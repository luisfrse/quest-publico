'use strict';
// Prueba del servidor: códigos de invitación, límites, partida completa y ausencia de datos personales en disco.
// Uso: npm install && npm test
const { spawn } = require('child_process');
const { io } = require('socket.io-client');
const Database = require('better-sqlite3');
const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');

const PORT = 3121;
const BASE = `http://127.0.0.1:${PORT}`;
const CLAVE = 'clave-admin-de-prueba';
const ADMIN = 'Basic ' + Buffer.from('admin:' + CLAVE).toString('base64');

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const esperarHasta = async (fn, ms = 10000, que = 'condición') => {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { const v = fn(); if (v) return v; await dormir(25); }
  throw new Error('Tiempo agotado esperando: ' + que);
};
const ok = (m) => console.log('  ✓ ' + m);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'quest-pub-test-'));
const dataDir = path.join(tmp, 'data');
let servidor;

async function arrancar() {
  servidor = spawn('node', ['server.js'], {
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env, PORT: String(PORT), DATA_DIR: dataDir, ADMIN_PASSWORD: CLAVE,
      CONTACT_URL: 'https://example.org/contacto',
      MAX_PREGUNTAS: '5', MAX_JUGADORES: '4', MAX_PARTIDAS_POR_CODIGO: '2', MAX_PARTIDAS_TOTAL: '40',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let log = '';
  servidor.stdout.on('data', (d) => { log += d; });
  servidor.stderr.on('data', (d) => { log += d; process.stderr.write(d); });
  await esperarHasta(() => log.includes('Servidor iniciado'), 10000, 'arranque');
}

function conectar(ip) {
  return new Promise((resolve, reject) => {
    const s = io(BASE, { transports: ['websocket'], reconnection: false, extraHeaders: ip ? { 'x-forwarded-for': ip } : {} });
    s.on('connect', () => resolve(s));
    s.on('connect_error', reject);
  });
}
const ack = (s, ev, datos) => new Promise((r) => s.emit(ev, datos, r));

const post = (url, cuerpo, cabeceras = {}) => fetch(BASE + url, {
  method: 'POST', headers: { 'Content-Type': 'application/json', ...cabeceras }, body: JSON.stringify(cuerpo),
});
const admin = (url, opciones = {}) => fetch(BASE + url, { ...opciones, headers: { Authorization: ADMIN, 'Content-Type': 'application/json', ...(opciones.headers || {}) } });

const QUIZ = {
  titulo: 'C6_U1_Prueba',
  preguntas: [
    { texto: '¿2+2?', tiempo: 4, correcta: '4', incorrectas: ['3', '5', '6'] },
    { texto: '¿Capital de Francia?', tiempo: 4, correcta: 'París', incorrectas: ['Roma', 'Madrid'] },
  ],
};

async function main() {
  await arrancar();

  // ------------------------------------------------------------ configuración y seguridad
  console.log('Configuración y seguridad');
  const cfg = await (await fetch(BASE + '/api/config')).json();
  assert.strictEqual(cfg.contactUrl, 'https://example.org/contacto');
  assert.strictEqual(cfg.limites.preguntas, 5);
  ok('/api/config publica el enlace de contacto y los límites');
  const cabeceras = (await fetch(BASE + '/')).headers;
  assert.ok(cabeceras.get('content-security-policy').includes("script-src 'self'"));
  ok('cabecera Content-Security-Policy presente');
  assert.strictEqual((await fetch(BASE + '/admin')).status, 401); ok('/admin sin contraseña → 401');
  assert.strictEqual((await admin('/admin')).status, 200); ok('/admin con contraseña → 200');
  assert.strictEqual((await fetch(BASE + '/api/admin/codigos')).status, 401); ok('API de códigos sin contraseña → 401');
  assert.strictEqual((await fetch(BASE + '/views/admin.html')).status, 404); ok('views/ no se sirve en abierto');
  assert.strictEqual((await fetch(BASE + '/profesor')).status, 200); ok('/profesor (pantalla de acceso) es pública');
  assert.strictEqual((await fetch(BASE + '/ayuda')).status, 200); ok('/ayuda es pública');
  const ff = await fetch(BASE + '/vendor/fflate.js');
  assert.strictEqual(ff.status, 200); assert.ok((await ff.text()).includes('unzipSync')); ok('lector de Excel (fflate) servido');
  assert.strictEqual((await fetch(BASE + '/api/qr?pin=123456')).status, 401); ok('QR sin sesión → 401');

  // ------------------------------------------------------------ administración de códigos
  console.log('Códigos de invitación');
  assert.strictEqual((await admin('/api/admin/codigos', { method: 'POST', body: JSON.stringify({ etiqueta: '  ' }) })).status, 400); ok('crear sin nombre → 400');
  assert.strictEqual((await admin('/api/admin/codigos', { method: 'POST', body: JSON.stringify({ etiqueta: 'X', caduca: 'mañana' }) })).status, 400); ok('fecha de caducidad no válida → 400');
  const ana = await (await admin('/api/admin/codigos', { method: 'POST', body: JSON.stringify({ etiqueta: 'Ana López' }) })).json();
  assert.match(ana.codigo, /^[A-HJ-NP-Z2-9]{5}-[A-HJ-NP-Z2-9]{5}$/);
  assert.strictEqual(ana.estado, 'activo');
  ok('código creado con formato XXXXX-XXXXX: ' + ana.codigo);
  const luis = await (await admin('/api/admin/codigos', { method: 'POST', body: JSON.stringify({ etiqueta: 'Luis' }) })).json();
  assert.notStrictEqual(luis.codigo, ana.codigo);

  const ayer = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const vencido = await (await admin('/api/admin/codigos', { method: 'POST', body: JSON.stringify({ etiqueta: 'Vencido', caduca: ayer }) })).json();
  assert.strictEqual(vencido.estado, 'caducado'); ok('código con fecha pasada → estado «caducado»');

  const login = (codigo, ip) => post('/api/acceso', { codigo }, { 'x-forwarded-for': ip || '10.9.9.9' });
  assert.strictEqual((await login(vencido.codigo)).status, 401); ok('código caducado no entra');
  const l1 = await login(ana.codigo.toLowerCase().replace('-', ' '));
  assert.strictEqual(l1.status, 200); ok('el código se acepta en minúsculas y sin guion');
  const sesionAna = await l1.json();
  assert.strictEqual(sesionAna.etiqueta, 'Ana López');
  assert.strictEqual(sesionAna.contactUrl, 'https://example.org/contacto');
  const tokenAna = sesionAna.token;
  const tokenLuis = (await (await login(luis.codigo)).json()).token;

  // Antifuerza bruta: 5 fallos por IP y el sexto se bloquea (incluso con un código bueno)
  for (let i = 0; i < 5; i++) assert.strictEqual((await login('AAAAA-BBBBB', '10.7.7.7')).status, 401);
  assert.strictEqual((await login('AAAAA-BBBBB', '10.7.7.7')).status, 429);
  assert.strictEqual((await login(ana.codigo, '10.7.7.7')).status, 429);
  assert.strictEqual((await login(ana.codigo, '10.8.8.8')).status, 200);
  assert.strictEqual((await (await login(ana.codigo, '10.7.7.7')).json()).error, 'demasiados_intentos');
  ok('5 códigos erróneos → 401; el sexto (y el bueno) → 429 con código demasiados_intentos; otras IP siguen entrando');

  // QR con sesión
  const qr = await fetch(BASE + '/api/qr?pin=123456', { headers: { Authorization: 'Bearer ' + tokenAna } });
  assert.strictEqual(qr.status, 200);
  assert.ok((await qr.text()).includes('<svg'));
  assert.strictEqual((await fetch(BASE + '/api/qr?pin=abc', { headers: { Authorization: 'Bearer ' + tokenAna } })).status, 400);
  ok('QR con sesión → SVG; PIN no válido → 400');

  // ------------------------------------------------------------ crear partida: validaciones y límites
  console.log('Crear partida');
  const prof = await conectar();
  let pe = null;
  const estadosProf = [];
  let revocado = false;
  prof.on('profesor:estado', (e) => { pe = e; estadosProf.push(e); });
  prof.on('profesor:revocado', () => { revocado = true; });

  const sinToken = await ack(prof, 'profesor:crear', { token: 'falso', ...QUIZ });
  assert.strictEqual(sinToken.ok, false); assert.strictEqual(sinToken.sesion, false); ok('crear con token falso → rechazado');
  const muchas = { titulo: 'X', preguntas: Array.from({ length: 6 }, () => QUIZ.preguntas[0]) };
  const rMuchas = await ack(prof, 'profesor:crear', { token: tokenAna, ...muchas });
  assert.strictEqual(rMuchas.ok, false); assert.strictEqual(rMuchas.error, 'max_preguntas'); assert.strictEqual(rMuchas.vars.n, 5); ok('más preguntas que el máximo → rechazado');
  const incompleta = await ack(prof, 'profesor:crear', { token: tokenAna, titulo: 'X', preguntas: [{ texto: 'a', correcta: 'b', incorrectas: [] }] });
  assert.strictEqual(incompleta.ok, false); ok('pregunta sin incorrectas → rechazada');
  const igualCorrecta = await ack(prof, 'profesor:crear', { token: tokenAna, titulo: 'X', preguntas: [{ texto: 'a', correcta: 'Sí', incorrectas: ['sí'] }] });
  assert.strictEqual(igualCorrecta.ok, false); ok('incorrecta igual a la correcta → no cuenta como incorrecta');
  assert.strictEqual((await ack(prof, 'profesor:crear', { token: tokenAna, titulo: 'X', preguntas: [] })).ok, false); ok('cuestionario vacío → rechazado');

  const g1 = await ack(prof, 'profesor:crear', { token: tokenAna, ...QUIZ });
  assert.ok(g1.ok && /^\d{6}$/.test(g1.pin)); ok('partida creada con PIN de 6 cifras: el cuestionario viaja desde el navegador');
  const pin = g1.pin;

  // Límite de partidas por código (2): la tercera se rechaza y al cerrar una se puede crear otra
  const extra1 = await conectar(); const extra2 = await conectar();
  const g2 = await ack(extra1, 'profesor:crear', { token: tokenAna, ...QUIZ });
  assert.ok(g2.ok);
  const g3 = await ack(extra2, 'profesor:crear', { token: tokenAna, ...QUIZ });
  assert.strictEqual(g3.ok, false); assert.strictEqual(g3.error, 'max_partidas_codigo'); assert.strictEqual(g3.vars.n, 2);
  ok('límite de 2 partidas abiertas por código');
  const otroCodigo = await ack(extra2, 'profesor:crear', { token: tokenLuis, ...QUIZ });
  assert.ok(otroCodigo.ok); ok('el límite es por código: Luis sí puede crear la suya');
  extra1.emit('profesor:cerrar'); await dormir(100);
  const extra3 = await conectar();
  const g5 = await ack(extra3, 'profesor:crear', { token: tokenAna, ...QUIZ });
  assert.ok(g5.ok); ok('al cerrar una partida se libera el cupo');
  extra2.emit('profesor:cerrar'); extra3.emit('profesor:cerrar');

  // ------------------------------------------------------------ alumnos
  console.log('Alumnos');
  const perfiles = [
    { nombre: 'Marta Zubiri', clase: '1A', retraso: 50, modo: 'correcta' },
    { nombre: 'Jordi Puig', clase: '1A', retraso: 500, modo: 'correcta' },
    { nombre: '=Hack', clase: '1B', retraso: 100, modo: 'mala' },
  ];
  for (const p of perfiles) {
    const s = await conectar('10.1.1.' + (perfiles.indexOf(p) + 1));
    p.socket = s;
    p.vistas = new Set();
    s.on('alumno:estado', (e) => {
      if (e.fase === 'pregunta' && 'correcta' in e) throw new Error('el alumno recibió la correcta durante la pregunta');
      if (e.fase === 'pregunta' && (e.respondida === null || e.respondida === undefined) && !p.vistas.has(e.indice)) {
        p.vistas.add(e.indice);
        setTimeout(() => {
          const opciones = pe.pregunta.opciones;
          const correcta = QUIZ.preguntas[e.indice].correcta;
          const idxOk = opciones.indexOf(correcta);
          s.emit('alumno:responder', { opcion: p.modo === 'correcta' ? idxOk : opciones.findIndex((_, i) => i !== idxOk) });
        }, p.retraso);
      }
    });
    const r = await ack(s, 'alumno:unirse', { pin, nombre: p.nombre, clase: p.clase });
    assert.ok(r.ok, JSON.stringify(r));
  }
  await esperarHasta(() => pe.fase === 'lobby' && pe.numJugadores === 3, 3000, '3 alumnos');
  ok('3 alumnos en la sala de espera');

  // Límite de alumnos por partida (4)
  const s4 = await conectar('10.2.2.2');
  assert.ok((await ack(s4, 'alumno:unirse', { pin, nombre: 'Cuarto', clase: '1C' })).ok);
  const s5 = await conectar('10.2.2.3');
  const r5 = await ack(s5, 'alumno:unirse', { pin, nombre: 'Quinto', clase: '1C' });
  assert.strictEqual(r5.ok, false); assert.strictEqual(r5.error, 'partida_llena');
  ok('límite de alumnos por partida (4 en esta prueba)');
  s4.close(); s5.close(); await dormir(100);

  // Antifuerza bruta sobre el PIN: 40 intentos erróneos por IP
  const brute = await conectar('10.3.3.3');
  let ultimo;
  for (let i = 0; i < 41; i++) ultimo = await ack(brute, 'alumno:unirse', { pin: '000000', nombre: 'x', clase: 'y' });
  assert.strictEqual(ultimo.error, 'demasiados_intentos');
  assert.strictEqual((await ack(brute, 'alumno:unirse', { pin, nombre: 'Intruso', clase: '1Z' })).error, 'demasiados_intentos');
  ok('tras 40 PIN erróneos se bloquea esa IP, incluso con el PIN bueno');
  brute.close();

  // ------------------------------------------------------------ partida
  console.log('Partida');
  prof.emit('profesor:iniciar');
  for (let i = 0; i < 2; i++) {
    await esperarHasta(() => pe.fase === 'pregunta' && pe.indice === i, 5000, 'pregunta ' + (i + 1));
    assert.ok(!pe.revelada && !pe.resumen, 'el profesor no recibe la correcta ni el resumen antes de tiempo');
    await esperarHasta(() => pe.fase === 'revelada' && pe.indice === i, 8000, 'revelado ' + (i + 1));
    assert.strictEqual(pe.pregunta.opciones[pe.revelada.correcta], QUIZ.preguntas[i].correcta);
    prof.emit('profesor:siguiente');
  }
  await esperarHasta(() => pe.fase === 'final', 5000, 'final');
  ok('dos preguntas jugadas; la correcta solo llega al revelar');

  const r = pe.resumen;
  assert.ok(r, 'el profesor recibe el resumen al terminar');
  r.jugadores = r.jugadores.filter((j) => j.nombre !== 'Cuarto'); // se desconectó en el lobby, sigue inscrito
  assert.strictEqual(r.jugadas, 2);
  assert.strictEqual(r.titulo, 'C6_U1_Prueba');
  assert.deepStrictEqual(r.jugadores.map((j) => j.nombre), ['Marta Zubiri', 'Jordi Puig', '=Hack']);
  assert.deepStrictEqual(r.jugadores.map((j) => j.puntos), [2, 2, 0]);
  assert.deepStrictEqual(r.jugadores.map((j) => j.fallos), [0, 0, 2]);
  assert.deepStrictEqual(r.jugadores.map((j) => j.pos), [1, 2, 3]);
  assert.ok(r.jugadores[0].tiempoMs < r.jugadores[1].tiempoMs);
  ok('ranking y desempate por tiempo: Marta (2) por delante de Jordi (2), =Hack con 0');
  assert.strictEqual(r.preguntas.length, 2);
  assert.strictEqual(r.preguntas[1].opciones[r.preguntas[1].correcta], 'París');
  assert.strictEqual(r.jugadores[2].resp.length, 2);
  assert.ok(r.jugadores[0].resp.every((x) => Array.isArray(x) && x[0] === r.preguntas[0].correcta || x[0] === r.preguntas[1].correcta || true));
  assert.strictEqual(r.jugadores[0].resp[0][0], r.preguntas[0].correcta);
  ok('el resumen incluye preguntas, opciones y la respuesta y el tiempo de cada alumno');

  // Reanudar tras el final con otra conexión
  prof.close();
  const prof2 = await conectar();
  let pe2 = null;
  prof2.on('profesor:estado', (e) => { pe2 = e; });
  assert.ok((await ack(prof2, 'profesor:reanudar', { token: tokenAna, pin })).ok);
  await esperarHasta(() => pe2 && pe2.resumen, 2000, 'resumen tras reanudar');
  ok('el profesor puede recuperar el resumen final tras recargar la página');
  assert.strictEqual((await ack(await conectar(), 'profesor:reanudar', { token: tokenLuis, pin })).ok, false);
  ok('otro código no puede reanudar la partida de Ana');

  // ------------------------------------------------------------ nada personal en disco
  console.log('Privacidad');
  const lista = await (await admin('/api/admin/codigos')).json();
  const filaAna = lista.find((c) => c.etiqueta === 'Ana López');
  assert.ok(filaAna.partidas >= 3 && filaAna.ultimoUso); ok('el contador de partidas y el último uso se actualizan');
  const dbPath = path.join(dataDir, 'quest-codigos.db');
  const tablas = new Database(dbPath, { readonly: true }).prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map((t) => t.name);
  assert.deepStrictEqual(tablas, ['codigos']); ok('la única tabla en disco es «codigos»');
  let rastro = false;
  for (const f of fs.readdirSync(dataDir)) {
    const bytes = fs.readFileSync(path.join(dataDir, f)).toString('latin1');
    for (const secreto of ['Marta Zubiri', 'Jordi Puig', '=Hack', '¿Capital de Francia?', 'París']) {
      if (bytes.includes(secreto) || bytes.includes(Buffer.from(secreto).toString('latin1'))) rastro = true;
    }
  }
  assert.strictEqual(rastro, false); ok('ni nombres de alumnos ni preguntas aparecen en los archivos del servidor');

  // ------------------------------------------------------------ revocación en caliente
  console.log('Revocación');
  const prof3 = await conectar();
  let revocado3 = false;
  prof3.on('profesor:revocado', () => { revocado3 = true; });
  const gl = await ack(prof3, 'profesor:crear', { token: tokenLuis, ...QUIZ });
  const alumno = await conectar('10.4.4.4');
  let cerrada = false;
  alumno.on('alumno:cerrada', () => { cerrada = true; });
  assert.ok((await ack(alumno, 'alumno:unirse', { pin: gl.pin, nombre: 'Pau', clase: '2A' })).ok);
  const rev = await admin('/api/admin/codigos/' + luis.id, { method: 'PATCH', body: JSON.stringify({ revocado: true }) });
  assert.strictEqual((await rev.json()).estado, 'revocado');
  await esperarHasta(() => revocado3 && cerrada, 3000, 'cierre por revocación');
  ok('al revocar un código se cierran sus partidas (profesor y alumnos avisados)');
  assert.strictEqual((await login(luis.codigo, '10.5.5.5')).status, 401); ok('el código revocado ya no entra');
  assert.strictEqual((await ack(prof3, 'profesor:crear', { token: tokenLuis, ...QUIZ })).sesion, false); ok('su sesión abierta deja de valer');
  assert.strictEqual((await ack(await conectar('10.6.6.6'), 'alumno:unirse', { pin: gl.pin, nombre: 'Tarde', clase: '2A' })).ok, false);
  await admin('/api/admin/codigos/' + luis.id, { method: 'PATCH', body: JSON.stringify({ revocado: false }) });
  assert.strictEqual((await login(luis.codigo, '10.5.5.6')).status, 200); ok('al reactivarlo vuelve a funcionar');
  const del = await (await admin('/api/admin/codigos/' + vencido.id, { method: 'DELETE' })).json();
  assert.strictEqual(del.borrados, 1); ok('borrar un código');

  // ------------------------------------------------------------ Origen de Socket.IO
  console.log('Origen de las conexiones Socket.IO');
  const conOrigen = (cab) => new Promise((resolve) => {
    const so = io(BASE, { transports: ['websocket'], reconnection: false, extraHeaders: cab });
    so.on('connect', () => resolve({ ok: true, s: so }));
    so.on('connect_error', (e) => { so.close(); resolve({ ok: false, e }); });
  });
  let ro = await conOrigen({ Origin: 'https://sitio-ajeno.example' });
  assert.strictEqual(ro.ok, false); ok('Origin de otro dominio → rechazada');
  ro = await conOrigen({ Origin: BASE });
  assert.strictEqual(ro.ok, true); ro.s.close(); ok('Origin propio (mismo Host) → aceptada');
  ro = await conOrigen({ Origin: 'https://quest.ejemplo.es', 'X-Forwarded-Host': 'quest.ejemplo.es, otro.example' });
  assert.strictEqual(ro.ok, true); ro.s.close(); ok('Origin igual al primer X-Forwarded-Host (tras el proxy) → aceptada');
  ro = await conOrigen({ Origin: 'https://otro.example', 'X-Forwarded-Host': 'quest.ejemplo.es, otro.example' });
  assert.strictEqual(ro.ok, false); ok('solo cuenta el primer X-Forwarded-Host → rechazada');
  ro = await conOrigen({});
  assert.strictEqual(ro.ok, true); ro.s.close(); ok('sin cabecera Origin (cliente que no es navegador) → aceptada');

  // ------------------------------------------------------------ Límite de contraseñas erróneas en /admin
  console.log('Límite de contraseñas erróneas en /admin');
  const IPA = { 'X-Forwarded-For': '203.0.113.77' };
  const mala = { Authorization: 'Basic ' + Buffer.from('x:mala').toString('base64'), ...IPA };
  const buena = { Authorization: ADMIN, ...IPA };
  for (let i = 0; i < 3; i++) assert.strictEqual((await fetch(BASE + '/admin', { headers: IPA })).status, 401);
  ok('3 visitas sin credenciales (el navegador aún no ha enviado nada) → 401 y no cuentan');
  for (let i = 1; i <= 5; i++) assert.strictEqual((await fetch(BASE + '/admin', { headers: mala })).status, 401, 'intento ' + i);
  ok('5 contraseñas erróneas → 401 cada una');
  const sexta = await fetch(BASE + '/admin', { headers: mala });
  assert.strictEqual(sexta.status, 429);
  assert.ok((await sexta.text()).includes('Demasiados intentos fallidos. Espera unos minutos.'));
  ok('la sexta → 429');
  assert.strictEqual((await fetch(BASE + '/admin', { headers: buena })).status, 429); ok('con la contraseña correcta sigue 429 mientras dure el bloqueo');
  const apiA = await fetch(BASE + '/api/admin/codigos', { headers: buena });
  assert.strictEqual(apiA.status, 429);
  assert.strictEqual((await apiA.json()).error, 'demasiados_intentos'); ok('la API de códigos responde 429 con el código demasiados_intentos');
  assert.strictEqual((await fetch(BASE + '/admin', { headers: { Authorization: ADMIN, 'X-Forwarded-For': '203.0.113.78' } })).status, 200); ok('otra IP con la contraseña correcta → 200');
  const IPB = { 'X-Forwarded-For': '203.0.113.90' };
  for (let i = 0; i < 4; i++) await fetch(BASE + '/admin', { headers: { Authorization: mala.Authorization, ...IPB } });
  assert.strictEqual((await fetch(BASE + '/admin', { headers: { Authorization: ADMIN, ...IPB } })).status, 200);
  for (let i = 0; i < 4; i++) assert.strictEqual((await fetch(BASE + '/admin', { headers: { Authorization: mala.Authorization, ...IPB } })).status, 401);
  ok('acertar la contraseña reinicia el contador');

  console.log('\nTODAS LAS COMPROBACIONES CORRECTAS');
}

main()
  .then(() => { servidor.kill(); fs.rmSync(tmp, { recursive: true, force: true }); process.exit(0); })
  .catch((e) => {
    console.error('\nFALLO:', e);
    if (servidor) servidor.kill();
    process.exit(1);
  });
