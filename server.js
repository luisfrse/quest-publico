'use strict';

// Quest (versión para invitados)
// - Los profesores entran con un código de invitación que crea y revoca el administrador.
// - Los cuestionarios viven en el navegador del profesor; el servidor solo los recibe al crear una
//   partida, los guarda en memoria y los olvida al terminar.
// - Los resultados NO se guardan en el servidor: se envían al profesor al acabar la partida.
// - La única base de datos (SQLite) contiene los códigos de invitación y contadores de uso.

const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { Server } = require('socket.io');
const Database = require('better-sqlite3');
const QRCode = require('qrcode');

// ---------------------------------------------------------------------------
// Configuración
// ---------------------------------------------------------------------------
function entero(nombre, defecto) {
  const n = parseInt(process.env[nombre], 10);
  return Number.isFinite(n) && n > 0 ? n : defecto;
}

const PORT = process.env.PORT || 3000;
const DIR_DATOS = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const CONTACT_URL = process.env.CONTACT_URL || 'https://luisfs.com';
const LIMITES = {
  preguntas: entero('MAX_PREGUNTAS', 100),
  jugadores: entero('MAX_JUGADORES', 60),
  partidasPorCodigo: entero('MAX_PARTIDAS_POR_CODIGO', 3),
  partidasTotal: entero('MAX_PARTIDAS_TOTAL', 40),
};
const HORAS = 60 * 60 * 1000;
const LETRAS = ['A', 'B', 'C', 'D'];

let ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) {
  ADMIN_PASSWORD = crypto.randomBytes(9).toString('base64url');
  console.warn('[Quest] ADMIN_PASSWORD no está definida. Contraseña temporal para esta ejecución: ' + ADMIN_PASSWORD);
  console.warn('[Quest] Define la variable de entorno ADMIN_PASSWORD para fijarla.');
}

// ---------------------------------------------------------------------------
// Base de datos: solo códigos de invitación
// ---------------------------------------------------------------------------
fs.mkdirSync(DIR_DATOS, { recursive: true });
const RUTA_DB = path.join(DIR_DATOS, 'quest-codigos.db');
const db = new Database(RUTA_DB);
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS codigos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    etiqueta TEXT NOT NULL,
    codigo TEXT NOT NULL UNIQUE,
    creado TEXT NOT NULL,
    caduca TEXT,
    revocado INTEGER NOT NULL DEFAULT 0,
    ultimo_uso TEXT,
    partidas INTEGER NOT NULL DEFAULT 0
  );
`);
console.log('[Quest] Base de datos de códigos en: ' + RUTA_DB);

const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin 0/O/1/I para evitar confusiones

function generarCodigo() {
  let c = '';
  for (let i = 0; i < 10; i++) c += ALFABETO[crypto.randomInt(ALFABETO.length)];
  return c;
}

function normalizarCodigo(texto) {
  return String(texto == null ? '' : texto).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 32);
}

function formatearCodigo(c) {
  return c.length === 10 ? c.slice(0, 5) + '-' + c.slice(5) : c;
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function estadoCodigo(fila) {
  if (fila.revocado) return 'revocado';
  if (fila.caduca && fila.caduca < hoyISO()) return 'caducado';
  return 'activo';
}

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
function quitarAcentos(s) {
  return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function barajar(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function limpiarTexto(s, max) {
  const t = typeof s === 'string' || typeof s === 'number' ? String(s) : '';
  return t.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

function iguales(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

// IP del cliente detrás del proxy (Coolify/Traefik añade la IP real al final de X-Forwarded-For)
function ipDeCabecera(xff, respaldo) {
  const partes = String(xff || '').split(',').map((x) => x.trim()).filter(Boolean);
  return partes.length ? partes[partes.length - 1] : respaldo || 'desconocida';
}

function limitador(maximo, ventanaMs) {
  const mapa = new Map();
  return {
    bloqueado(ip) {
      const e = mapa.get(ip);
      if (!e) return false;
      if (Date.now() - e.desde > ventanaMs) { mapa.delete(ip); return false; }
      return e.n >= maximo;
    },
    fallo(ip) {
      if (mapa.size > 20000) mapa.clear();
      const e = mapa.get(ip);
      if (!e || Date.now() - e.desde > ventanaMs) mapa.set(ip, { n: 1, desde: Date.now() });
      else e.n += 1;
    },
    exito(ip) { mapa.delete(ip); },
    purgar() {
      const ahora = Date.now();
      for (const [ip, e] of mapa) if (ahora - e.desde > ventanaMs) mapa.delete(ip);
    },
  };
}

const limAcceso = limitador(8, 15 * 60 * 1000); // 8 códigos erróneos cada 15 min por IP
const limUnirse = limitador(40, 10 * 60 * 1000); // 40 PIN erróneos cada 10 min por IP

// ---------------------------------------------------------------------------
// Sesiones de profesor (en memoria)
// ---------------------------------------------------------------------------
const sesiones = new Map(); // token -> { codigoId, etiqueta, exp }

function crearSesion(fila) {
  const token = crypto.randomBytes(24).toString('hex');
  sesiones.set(token, { codigoId: fila.id, etiqueta: fila.etiqueta, exp: Date.now() + 12 * HORAS });
  return token;
}

function sesionPorToken(token) {
  const s = sesiones.get(String(token || ''));
  if (!s) return null;
  if (s.exp < Date.now()) { sesiones.delete(token); return null; }
  const fila = db.prepare('SELECT * FROM codigos WHERE id = ?').get(s.codigoId);
  if (!fila || estadoCodigo(fila) !== 'activo') { sesiones.delete(token); return null; }
  return { codigoId: s.codigoId, etiqueta: s.etiqueta, fila };
}

function invalidarSesionesDe(codigoId) {
  for (const [t, s] of sesiones) if (s.codigoId === codigoId) sesiones.delete(t);
}

// ---------------------------------------------------------------------------
// Express
// ---------------------------------------------------------------------------
const app = express();
const server = http.createServer(app);
const io = new Server(server, { maxHttpBufferSize: 5e5 });

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; " +
    "connect-src 'self' ws: wss:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"
  );
  next();
});

function requiereClaveAdmin(req, res, next) {
  const cabecera = req.headers.authorization || '';
  if (cabecera.startsWith('Basic ')) {
    const dec = Buffer.from(cabecera.slice(6), 'base64').toString('utf8');
    const i = dec.indexOf(':');
    if (iguales(i >= 0 ? dec.slice(i + 1) : dec, ADMIN_PASSWORD)) return next();
  }
  res.setHeader('WWW-Authenticate', 'Basic realm="Quest (administrador)", charset="UTF-8"');
  res.status(401).send('Se requiere contraseña');
}

function requiereSesion(req, res, next) {
  const h = req.headers.authorization || '';
  const s = h.startsWith('Bearer ') ? sesionPorToken(h.slice(7)) : null;
  if (!s) return res.status(401).json({ error: 'Sesión no válida' });
  req.sesion = s;
  next();
}

app.get('/api/config', (req, res) => {
  res.json({
    contactUrl: CONTACT_URL,
    limites: { preguntas: LIMITES.preguntas, jugadores: LIMITES.jugadores, partidasPorCodigo: LIMITES.partidasPorCodigo },
  });
});

app.post('/api/acceso', express.json({ limit: '2kb' }), (req, res) => {
  const ip = ipDeCabecera(req.headers['x-forwarded-for'], req.socket.remoteAddress);
  if (limAcceso.bloqueado(ip)) return res.status(429).json({ error: 'Demasiados intentos fallidos. Espera unos minutos.' });
  const codigo = normalizarCodigo(req.body && req.body.codigo);
  const fila = codigo ? db.prepare('SELECT * FROM codigos WHERE codigo = ?').get(codigo) : null;
  if (!fila || estadoCodigo(fila) !== 'activo') {
    limAcceso.fallo(ip);
    return res.status(401).json({ error: 'Código no válido, revocado o caducado.' });
  }
  limAcceso.exito(ip);
  res.json({
    token: crearSesion(fila),
    etiqueta: fila.etiqueta,
    contactUrl: CONTACT_URL,
    limites: { preguntas: LIMITES.preguntas, jugadores: LIMITES.jugadores },
  });
});

// Código QR hacia la página del alumno con el PIN ya escrito
app.get('/api/qr', requiereSesion, async (req, res) => {
  const pin = String(req.query.pin || '');
  if (!/^\d{6}$/.test(pin)) return res.status(400).send('PIN no válido');
  const proto = String(req.headers['x-forwarded-proto'] || req.protocol).split(',')[0].trim();
  const url = `${proto}://${req.get('host')}/?pin=${pin}`;
  try {
    const svg = await QRCode.toString(url, {
      type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#1d1b2f', light: '#ffffff' },
    });
    res.type('image/svg+xml').set('Cache-Control', 'no-store').send(svg);
  } catch (e) {
    res.status(500).send('No se pudo generar el QR');
  }
});

// --- API de administración (contraseña de administrador) ----------------------------------
function enVivoDe(codigoId) {
  let activas = 0;
  let jugadores = 0;
  for (const p of partidasActivas.values()) {
    if (p.codigoId === codigoId && p.fase !== 'final') {
      activas += 1;
      jugadores += p.jugadores.size;
    }
  }
  return { activas, jugadores };
}

function filaPublica(f) {
  return {
    id: f.id,
    etiqueta: f.etiqueta,
    codigo: formatearCodigo(f.codigo),
    creado: f.creado,
    caduca: f.caduca,
    ultimoUso: f.ultimo_uso,
    partidas: f.partidas,
    estado: estadoCodigo(f),
    enVivo: enVivoDe(f.id),
  };
}

app.get('/api/admin/codigos', requiereClaveAdmin, (req, res) => {
  res.json(db.prepare('SELECT * FROM codigos ORDER BY id DESC').all().map(filaPublica));
});

app.post('/api/admin/codigos', requiereClaveAdmin, express.json({ limit: '2kb' }), (req, res) => {
  const etiqueta = limpiarTexto(req.body && req.body.etiqueta, 60);
  if (!etiqueta) return res.status(400).json({ error: 'Escribe a quién corresponde el código.' });
  let caduca = req.body && req.body.caduca ? String(req.body.caduca) : null;
  if (caduca && !/^\d{4}-\d{2}-\d{2}$/.test(caduca)) return res.status(400).json({ error: 'Fecha de caducidad no válida.' });
  if (!caduca) caduca = null;
  for (let i = 0; i < 10; i++) {
    try {
      const codigo = generarCodigo();
      const r = db.prepare('INSERT INTO codigos (etiqueta, codigo, creado, caduca) VALUES (?,?,?,?)')
        .run(etiqueta, codigo, new Date().toISOString(), caduca);
      return res.json(filaPublica(db.prepare('SELECT * FROM codigos WHERE id = ?').get(r.lastInsertRowid)));
    } catch (e) {
      if (!/UNIQUE/.test(String(e.message))) throw e;
    }
  }
  res.status(500).json({ error: 'No se pudo generar un código único.' });
});

app.patch('/api/admin/codigos/:id', requiereClaveAdmin, express.json({ limit: '2kb' }), (req, res) => {
  const id = parseInt(req.params.id, 10) || 0;
  const fila = db.prepare('SELECT * FROM codigos WHERE id = ?').get(id);
  if (!fila) return res.status(404).json({ error: 'No existe ese código.' });
  if (req.body && typeof req.body.revocado === 'boolean') {
    db.prepare('UPDATE codigos SET revocado = ? WHERE id = ?').run(req.body.revocado ? 1 : 0, id);
    if (req.body.revocado) cerrarPartidasDe(id, 'revocado');
  }
  if (req.body && 'caduca' in req.body) {
    const c = req.body.caduca ? String(req.body.caduca) : null;
    if (c && !/^\d{4}-\d{2}-\d{2}$/.test(c)) return res.status(400).json({ error: 'Fecha de caducidad no válida.' });
    db.prepare('UPDATE codigos SET caduca = ? WHERE id = ?').run(c, id);
  }
  res.json(filaPublica(db.prepare('SELECT * FROM codigos WHERE id = ?').get(id)));
});

app.delete('/api/admin/codigos/:id', requiereClaveAdmin, (req, res) => {
  const id = parseInt(req.params.id, 10) || 0;
  cerrarPartidasDe(id, 'revocado');
  const r = db.prepare('DELETE FROM codigos WHERE id = ?').run(id);
  res.json({ borrados: r.changes });
});

app.get('/api/admin/estado', requiereClaveAdmin, (req, res) => {
  let jugadores = 0;
  let activas = 0;
  for (const p of partidasActivas.values()) {
    if (p.fase !== 'final') { activas += 1; jugadores += p.jugadores.size; }
  }
  res.json({ partidasActivas: activas, jugadoresEnPartidas: jugadores, limites: LIMITES });
});

// --- Páginas ---------------------------------------------------------------------------------
const PUBLIC = path.join(__dirname, 'public');
app.get('/profesor', (req, res) => res.sendFile(path.join(PUBLIC, 'profesor.html')));
app.get('/ayuda', (req, res) => res.sendFile(path.join(PUBLIC, 'ayuda.html')));
app.get('/admin', requiereClaveAdmin, (req, res) => res.sendFile(path.join(__dirname, 'views', 'admin.html')));
// Lector de .xlsx (fflate) servido desde node_modules
app.get('/vendor/fflate.js', (req, res) =>
  res.sendFile(path.join(path.dirname(require.resolve('fflate')), '..', 'umd', 'index.js')));
app.use(express.static(PUBLIC, { index: 'index.html' }));

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  res.status(400).json({ error: 'Petición no válida' });
});

// ---------------------------------------------------------------------------
// Lógica de partida (solo en memoria)
// ---------------------------------------------------------------------------
const partidasActivas = new Map(); // pin -> partida

function generarPin() {
  for (let i = 0; i < 50; i++) {
    const pin = String(crypto.randomInt(100000, 1000000));
    if (!partidasActivas.has(pin)) return pin;
  }
  throw new Error('No se pudo generar un PIN libre');
}

// Valida y limpia el cuestionario que envía el navegador del profesor.
function sanearCuestionario(datos) {
  if (!datos || typeof datos !== 'object') throw new Error('Cuestionario no válido');
  const titulo = limpiarTexto(datos.titulo, 80) || 'Cuestionario';
  const origen = Array.isArray(datos.preguntas) ? datos.preguntas : [];
  if (!origen.length) throw new Error('El cuestionario no tiene preguntas');
  if (origen.length > LIMITES.preguntas) throw new Error(`Máximo ${LIMITES.preguntas} preguntas por cuestionario`);
  const lista = origen.map((p, i) => {
    const texto = limpiarTexto(p && p.texto, 500);
    const correcta = limpiarTexto(p && p.correcta, 300);
    const incorrectas = (Array.isArray(p && p.incorrectas) ? p.incorrectas : [])
      .slice(0, 3)
      .map((x) => limpiarTexto(x, 300))
      .filter((x) => x && x.toLowerCase() !== correcta.toLowerCase());
    if (!texto || !correcta || !incorrectas.length) throw new Error(`La pregunta ${i + 1} está incompleta`);
    let tiempo = parseInt(p.tiempo, 10);
    if (!Number.isFinite(tiempo) || tiempo < 3) tiempo = 20;
    if (tiempo > 600) tiempo = 600;
    // Se mezcla UNA vez por pregunta; todos los alumnos ven el mismo orden y colores.
    const opciones = barajar([{ texto: correcta, ok: true }, ...incorrectas.map((t) => ({ texto: t, ok: false }))]);
    return { texto, tiempo, opciones, correcta: opciones.findIndex((o) => o.ok) };
  });
  return { titulo, lista };
}

function nuevaPartida(sesion, cuestionario, socketId) {
  const pin = generarPin();
  const partida = {
    pin,
    titulo: cuestionario.titulo,
    fecha: new Date(),
    preguntas: cuestionario.lista,
    fase: 'lobby', // lobby | pregunta | revelada | final
    indice: -1,
    jugadores: new Map(),
    codigoId: sesion.codigoId,
    hostSocket: socketId,
    q: null,
    temporizador: null,
    preguntasJugadas: 0,
    resumen: null,
    cerrada: false,
    ultimaActividad: Date.now(),
  };
  partidasActivas.set(pin, partida);
  return partida;
}

function nuevoJugador(nombre, clase, socketId) {
  return {
    id: crypto.randomBytes(8).toString('hex'),
    nombre,
    clase,
    socketId,
    conectado: true,
    puntos: 0,
    tiempoMs: 0, // suma del tiempo de las respuestas correctas (desempate)
    respuestas: [],
  };
}

function rankingDe(partida) {
  const arr = Array.from(partida.jugadores.values()).sort((a, b) => {
    if (b.puntos !== a.puntos) return b.puntos - a.puntos;
    if (a.tiempoMs !== b.tiempoMs) return a.tiempoMs - b.tiempoMs;
    return a.nombre.localeCompare(b.nombre, 'es');
  });
  let pos = 0;
  let previo = null;
  return arr.map((j, i) => {
    if (!previo || previo.puntos !== j.puntos || previo.tiempoMs !== j.tiempoMs) pos = i + 1;
    previo = j;
    return { id: j.id, pos, nombre: j.nombre, clase: j.clase, puntos: j.puntos, tiempoMs: j.tiempoMs };
  });
}

function restanteMs(partida) {
  if (!partida.q || partida.fase !== 'pregunta') return 0;
  return Math.max(0, partida.q.terminaEn - Date.now());
}

// Resultado completo que recibe el profesor al terminar (el servidor no lo guarda).
function construirResumen(partida) {
  const jugadas = partida.preguntasJugadas;
  const ranking = rankingDe(partida);
  return {
    fecha: partida.fecha.toISOString(),
    titulo: partida.titulo,
    jugadas,
    preguntas: partida.preguntas.slice(0, jugadas).map((p) => ({
      texto: p.texto,
      opciones: p.opciones.map((o) => o.texto),
      correcta: p.correcta,
    })),
    jugadores: ranking.map((rk) => {
      const j = partida.jugadores.get(rk.id);
      return {
        nombre: j.nombre,
        clase: j.clase,
        pos: rk.pos,
        puntos: j.puntos,
        fallos: jugadas - j.puntos,
        tiempoMs: j.tiempoMs,
        resp: Array.from({ length: jugadas }, (_, i) => {
          const r = j.respuestas[i];
          return r ? [r.elegida, r.ms] : null;
        }),
      };
    }),
  };
}

function estadoProfesor(partida) {
  const base = {
    pin: partida.pin,
    titulo: partida.titulo,
    fase: partida.fase,
    total: partida.preguntas.length,
    indice: partida.indice,
    numJugadores: partida.jugadores.size,
  };
  if (partida.fase === 'lobby') {
    base.lobby = Array.from(partida.jugadores.values()).map((j) => ({ id: j.id, nombre: j.nombre, clase: j.clase }));
  }
  if (partida.fase === 'pregunta' || partida.fase === 'revelada') {
    const p = partida.preguntas[partida.indice];
    base.pregunta = {
      texto: p.texto,
      opciones: p.opciones.map((o) => o.texto), // nunca se envía cuál es la correcta antes de revelar
      tiempo: p.tiempo,
      restanteMs: restanteMs(partida),
      respondidos: partida.q.respuestas.size,
    };
    if (partida.fase === 'revelada') base.revelada = { correcta: p.correcta, conteo: partida.q.conteo };
  }
  if (partida.fase !== 'lobby') {
    const r = rankingDe(partida);
    base.ranking = partida.fase === 'final' ? r : r.slice(0, 15);
  }
  if (partida.fase === 'final' && partida.resumen) base.resumen = partida.resumen;
  return base;
}

function estadoAlumno(partida, j) {
  const base = {
    fase: partida.fase,
    titulo: partida.titulo,
    indice: partida.indice,
    total: partida.preguntas.length,
    nombre: j.nombre,
  };
  if (partida.fase === 'pregunta') {
    const r = partida.q.respuestas.get(j.id);
    base.nOpciones = partida.preguntas[partida.indice].opciones.length;
    base.restanteMs = restanteMs(partida);
    base.tiempo = partida.preguntas[partida.indice].tiempo;
    base.respondida = r ? r.elegida : null;
  }
  if (partida.fase === 'revelada') {
    const p = partida.preguntas[partida.indice];
    const r = partida.q.respuestas.get(j.id);
    const rk = rankingDe(partida).find((x) => x.id === j.id);
    base.nOpciones = p.opciones.length;
    base.correcta = p.correcta;
    base.elegida = r ? r.elegida : null;
    base.acierto = !!(r && r.acierto);
    base.puntos = j.puntos;
    base.pos = rk ? rk.pos : null;
  }
  if (partida.fase === 'final') {
    const rk = rankingDe(partida).find((x) => x.id === j.id);
    base.puntos = j.puntos;
    base.pos = rk ? rk.pos : null;
    base.jugadores = partida.jugadores.size;
    base.tiempoMs = j.tiempoMs;
  }
  return base;
}

function emitirProfesor(partida) {
  if (partida.hostSocket) io.to(partida.hostSocket).emit('profesor:estado', estadoProfesor(partida));
}

function emitirAlumno(partida, j) {
  if (j.conectado && j.socketId) io.to(j.socketId).emit('alumno:estado', estadoAlumno(partida, j));
}

function emitirATodos(partida) {
  emitirProfesor(partida);
  for (const j of partida.jugadores.values()) emitirAlumno(partida, j);
}

function iniciarPregunta(partida) {
  partida.indice += 1;
  const p = partida.preguntas[partida.indice];
  partida.fase = 'pregunta';
  partida.q = {
    inicio: Date.now(),
    terminaEn: Date.now() + p.tiempo * 1000,
    respuestas: new Map(),
    conteo: new Array(p.opciones.length).fill(0),
  };
  clearTimeout(partida.temporizador);
  partida.temporizador = setTimeout(() => revelar(partida), p.tiempo * 1000);
  emitirATodos(partida);
}

function revelar(partida) {
  if (partida.cerrada || partida.fase !== 'pregunta') return;
  clearTimeout(partida.temporizador);
  for (const j of partida.jugadores.values()) {
    const r = partida.q.respuestas.get(j.id);
    if (r) {
      if (r.acierto) {
        j.puntos += 1;
        j.tiempoMs += r.ms;
      }
      j.respuestas[partida.indice] = r;
    } else {
      j.respuestas[partida.indice] = null;
    }
  }
  partida.fase = 'revelada';
  partida.ultimaActividad = Date.now();
  emitirATodos(partida);
}

function jugadoresConectados(partida) {
  let n = 0;
  for (const j of partida.jugadores.values()) if (j.conectado) n += 1;
  return n;
}

function terminarPartida(partida) {
  clearTimeout(partida.temporizador);
  if (partida.fase === 'pregunta') partida.preguntasJugadas = partida.indice; // la pregunta en curso no se puntúa
  else if (partida.fase === 'revelada') partida.preguntasJugadas = partida.indice + 1;
  else partida.preguntasJugadas = Math.max(0, partida.indice);
  partida.fase = 'final';
  partida.resumen = construirResumen(partida);
  partida.ultimaActividad = Date.now();
  emitirATodos(partida);
}

function eliminarPartida(partida) {
  clearTimeout(partida.temporizador);
  partida.cerrada = true;
  partidasActivas.delete(partida.pin);
}

// Cierra todas las partidas de un código (al revocarlo o borrarlo)
function cerrarPartidasDe(codigoId, motivo) {
  invalidarSesionesDe(codigoId);
  for (const partida of Array.from(partidasActivas.values())) {
    if (partida.codigoId !== codigoId) continue;
    if (partida.hostSocket) io.to(partida.hostSocket).emit('profesor:revocado', { motivo });
    for (const j of partida.jugadores.values()) if (j.socketId) io.to(j.socketId).emit('alumno:cerrada');
    eliminarPartida(partida);
  }
}

// Limpieza de partidas y datos temporales abandonados
setInterval(() => {
  const ahora = Date.now();
  for (const partida of Array.from(partidasActivas.values())) {
    const inactiva = ahora - partida.ultimaActividad;
    if (partida.fase === 'final' ? inactiva > 2 * HORAS : inactiva > 3 * HORAS) eliminarPartida(partida);
  }
  for (const [t, s] of sesiones) if (s.exp < ahora) sesiones.delete(t);
  limAcceso.purgar();
  limUnirse.purgar();
}, 5 * 60 * 1000).unref();

// ---------------------------------------------------------------------------
// Sockets
// ---------------------------------------------------------------------------
io.on('connection', (socket) => {
  const ip = ipDeCabecera(socket.handshake.headers['x-forwarded-for'], socket.handshake.address);
  let rol = null; // 'profesor' | 'alumno'
  let partida = null;
  let jugador = null;

  const responder = (cb, datos) => { if (typeof cb === 'function') cb(datos); };
  const esProfesor = () => rol === 'profesor' && partida && !partida.cerrada && partida.hostSocket === socket.id;

  // ----- Profesor -----
  socket.on('profesor:crear', (datos, cb) => {
    try {
      const sesion = sesionPorToken(datos && datos.token);
      if (!sesion) return responder(cb, { ok: false, sesion: false, error: 'Sesión caducada. Vuelve a entrar con tu código.' });

      let quiz;
      try { quiz = sanearCuestionario(datos); } catch (e) { return responder(cb, { ok: false, error: e.message }); }

      let propias = 0;
      for (const p of partidasActivas.values()) if (p.codigoId === sesion.codigoId && p.fase !== 'final') propias += 1;
      if (propias >= LIMITES.partidasPorCodigo) {
        return responder(cb, { ok: false, error: `Ya tienes ${propias} partidas abiertas. Cierra alguna antes de crear otra.` });
      }
      let totales = 0;
      for (const p of partidasActivas.values()) if (p.fase !== 'final') totales += 1;
      if (totales >= LIMITES.partidasTotal) {
        return responder(cb, { ok: false, error: 'El servidor está al máximo de partidas simultáneas. Inténtalo de nuevo en unos minutos.' });
      }

      partida = nuevaPartida(sesion, quiz, socket.id);
      rol = 'profesor';
      db.prepare('UPDATE codigos SET partidas = partidas + 1, ultimo_uso = ? WHERE id = ?')
        .run(new Date().toISOString(), sesion.codigoId);
      responder(cb, { ok: true, pin: partida.pin });
      emitirProfesor(partida);
    } catch (e) {
      console.error('[Quest] Error al crear partida:', e);
      responder(cb, { ok: false, error: 'No se pudo crear la partida' });
    }
  });

  socket.on('profesor:reanudar', (datos, cb) => {
    const sesion = sesionPorToken(datos && datos.token);
    const p = datos && partidasActivas.get(String(datos.pin));
    if (!sesion || !p || p.cerrada || p.codigoId !== sesion.codigoId) return responder(cb, { ok: false });
    partida = p;
    rol = 'profesor';
    partida.hostSocket = socket.id;
    partida.ultimaActividad = Date.now();
    responder(cb, { ok: true, pin: partida.pin });
    emitirProfesor(partida);
  });

  socket.on('profesor:iniciar', () => {
    if (!esProfesor() || partida.fase !== 'lobby' || partida.jugadores.size === 0) return;
    partida.ultimaActividad = Date.now();
    iniciarPregunta(partida);
  });

  socket.on('profesor:revelar', () => {
    if (!esProfesor() || partida.fase !== 'pregunta') return;
    revelar(partida);
  });

  socket.on('profesor:siguiente', () => {
    if (!esProfesor() || partida.fase !== 'revelada') return;
    partida.ultimaActividad = Date.now();
    if (partida.indice + 1 >= partida.preguntas.length) terminarPartida(partida);
    else iniciarPregunta(partida);
  });

  socket.on('profesor:terminar', () => {
    if (!esProfesor() || partida.fase === 'final') return;
    terminarPartida(partida);
  });

  socket.on('profesor:expulsar', (datos) => {
    if (!esProfesor() || partida.fase !== 'lobby' || !datos) return;
    const j = partida.jugadores.get(String(datos.id));
    if (!j) return;
    partida.jugadores.delete(j.id);
    if (j.socketId) io.to(j.socketId).emit('alumno:expulsado');
    emitirProfesor(partida);
  });

  socket.on('profesor:cerrar', () => {
    if (!esProfesor()) return;
    for (const j of partida.jugadores.values()) if (j.socketId) io.to(j.socketId).emit('alumno:cerrada');
    eliminarPartida(partida);
    partida = null;
    rol = null;
  });

  // ----- Alumno -----
  socket.on('alumno:unirse', (datos, cb) => {
    if (limUnirse.bloqueado(ip)) return responder(cb, { ok: false, error: 'Demasiados intentos. Espera unos minutos.' });
    if (!datos) return responder(cb, { ok: false, error: 'Datos no válidos' });
    const pin = String(datos.pin || '').replace(/\D/g, '');
    const p = partidasActivas.get(pin);
    if (!p || p.cerrada || p.fase === 'final') {
      limUnirse.fallo(ip);
      return responder(cb, { ok: false, error: 'Código no válido o partida terminada' });
    }
    const nombre = limpiarTexto(datos.nombre, 24);
    const clase = limpiarTexto(datos.clase, 16);
    if (!nombre || !clase) return responder(cb, { ok: false, error: 'Escribe tu nombre y tu clase' });

    // Reconexión: mismo id guardado en el móvil, o mismo nombre y clase
    let j = null;
    if (datos.id) j = p.jugadores.get(String(datos.id)) || null;
    if (!j) {
      const clave = quitarAcentos(nombre).toLowerCase() + '|' + quitarAcentos(clase).toLowerCase();
      for (const x of p.jugadores.values()) {
        if (quitarAcentos(x.nombre).toLowerCase() + '|' + quitarAcentos(x.clase).toLowerCase() === clave) { j = x; break; }
      }
    }
    if (j) {
      if (j.conectado && j.socketId && j.socketId !== socket.id && io.sockets.sockets.get(j.socketId)) {
        if (!datos.id || datos.id !== j.id) return responder(cb, { ok: false, error: 'Ya hay alguien conectado con ese nombre y clase' });
      }
    } else {
      if (p.jugadores.size >= LIMITES.jugadores) return responder(cb, { ok: false, error: 'La partida está llena' });
      j = nuevoJugador(nombre, clase, socket.id);
      p.jugadores.set(j.id, j);
    }
    j.socketId = socket.id;
    j.conectado = true;
    partida = p;
    jugador = j;
    rol = 'alumno';
    p.ultimaActividad = Date.now();
    responder(cb, { ok: true, id: j.id, nombre: j.nombre, clase: j.clase, pin: p.pin });
    emitirAlumno(p, j);
    if (p.fase === 'lobby') emitirProfesor(p);
    else if (p.hostSocket) io.to(p.hostSocket).emit('profesor:jugadores', { numJugadores: p.jugadores.size });
  });

  socket.on('alumno:responder', (datos) => {
    if (rol !== 'alumno' || !partida || partida.cerrada || !jugador) return;
    if (partida.fase !== 'pregunta') return;
    const p = partida.preguntas[partida.indice];
    const opcion = datos && Number.isInteger(datos.opcion) ? datos.opcion : -1;
    if (opcion < 0 || opcion >= p.opciones.length) return;
    if (partida.q.respuestas.has(jugador.id)) return; // solo la primera respuesta cuenta
    const limite = p.tiempo * 1000;
    let ms = Date.now() - partida.q.inicio;
    if (ms > limite + 800) return; // llegó tarde
    ms = Math.min(ms, limite);
    partida.q.respuestas.set(jugador.id, { elegida: opcion, ms, acierto: opcion === p.correcta });
    partida.q.conteo[opcion] += 1;
    emitirAlumno(partida, jugador);
    if (partida.hostSocket) {
      io.to(partida.hostSocket).emit('profesor:respondidos', {
        respondidos: partida.q.respuestas.size,
        conectados: jugadoresConectados(partida),
      });
    }
    let faltan = 0;
    for (const j of partida.jugadores.values()) if (j.conectado && !partida.q.respuestas.has(j.id)) faltan += 1;
    if (faltan === 0) revelar(partida);
  });

  socket.on('disconnect', () => {
    if (rol === 'alumno' && partida && jugador && jugador.socketId === socket.id) {
      jugador.conectado = false;
      if (partida.fase === 'lobby') emitirProfesor(partida);
    }
    if (rol === 'profesor' && partida && partida.hostSocket === socket.id) partida.hostSocket = null;
  });
});

server.listen(PORT, () => {
  console.log(`[Quest] Servidor iniciado en el puerto ${PORT}`);
  console.log(`[Quest] Enlace de contacto: ${CONTACT_URL}`);
});

module.exports = { server };
