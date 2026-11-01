// Todo lo que se guarda vive en el navegador del profesor (localStorage). El servidor no guarda nada de esto.

const K_BIBLIOTECA = 'quest-biblioteca-v1';
const K_HISTORIAL = 'quest-historial-v1';
const K_CODIGO = 'quest-codigo';
const MAX_PARTIDAS_HISTORIAL = 60;

function leer(clave, defecto) {
  try {
    const v = localStorage.getItem(clave);
    return v ? JSON.parse(v) : defecto;
  } catch (e) {
    return defecto;
  }
}

function escribir(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
    return true;
  } catch (e) {
    return false;
  }
}

export function almacenamientoDisponible() {
  try {
    localStorage.setItem('__quest_prueba', '1');
    localStorage.removeItem('__quest_prueba');
    return true;
  } catch (e) {
    return false;
  }
}

export function nuevoId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

// ---- Código de invitación recordado ----
export const codigoGuardado = {
  leer() { try { return localStorage.getItem(K_CODIGO) || ''; } catch (e) { return ''; } },
  guardar(c) { try { localStorage.setItem(K_CODIGO, c); } catch (e) { /* sin almacenamiento */ } },
  borrar() { try { localStorage.removeItem(K_CODIGO); } catch (e) { /* sin almacenamiento */ } },
};

// ---- Biblioteca de cuestionarios ----
export const biblioteca = {
  listar() {
    const l = leer(K_BIBLIOTECA, []);
    return Array.isArray(l) ? l : [];
  },
  obtener(id) {
    return this.listar().find((c) => c.id === id) || null;
  },
  porTitulo(titulo) {
    const t = String(titulo).trim().toLowerCase();
    return this.listar().find((c) => c.titulo.trim().toLowerCase() === t) || null;
  },
  // Devuelve false si el navegador no tiene sitio o no permite guardar
  guardar(cuestionario) {
    const lista = this.listar();
    const i = lista.findIndex((c) => c.id === cuestionario.id);
    if (i >= 0) lista[i] = cuestionario; else lista.push(cuestionario);
    return escribir(K_BIBLIOTECA, lista);
  },
  borrar(id) {
    return escribir(K_BIBLIOTECA, this.listar().filter((c) => c.id !== id));
  },
};

// ---- Historial de partidas ----
export const historial = {
  listar() {
    const l = leer(K_HISTORIAL, []);
    return Array.isArray(l) ? l : [];
  },
  añadir(resumen) {
    const lista = this.listar();
    lista.unshift(resumen);
    let recortada = lista.slice(0, MAX_PARTIDAS_HISTORIAL);
    // Si no cabe, se descartan las partidas más antiguas hasta que quepa
    while (recortada.length && !escribir(K_HISTORIAL, recortada)) recortada = recortada.slice(0, -1);
    return recortada.some((p) => p.id === resumen.id);
  },
  borrar(id) {
    return escribir(K_HISTORIAL, this.listar().filter((p) => p.id !== id));
  },
};

// ---- Descargas ----
export function descargar(nombre, contenido, tipo) {
  const blob = new Blob([contenido], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function nombreSeguro(texto) {
  return String(texto).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'quest';
}

export function fechaCorta(iso) {
  const d = new Date(iso);
  const dia = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const hora = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
  return dia + ' ' + hora;
}

// ---- CSV de resultados (separador «;» y BOM para que Excel respete las tildes) ----
function celdaCsv(valor) {
  let s = valor == null ? '' : String(valor);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // evita fórmulas al abrir en Excel/Sheets
  if (/[;"\n\r]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
  return s;
}

const segundos = (ms) => (ms / 1000).toFixed(2).replace('.', ',');

export function csvNotas(partidas) {
  const lineas = [['fecha', 'nombre', 'clase', 'cuestionario', 'fallos', 'puntuacion total', 'tiempo total (s)'].join(';')];
  for (const p of partidas) {
    for (const j of p.jugadores) {
      lineas.push([fechaCorta(p.fecha), j.nombre, j.clase, p.titulo, j.fallos, j.puntos, segundos(j.tiempoMs)].map(celdaCsv).join(';'));
    }
  }
  return '﻿' + lineas.join('\r\n') + '\r\n';
}

export function csvDetalle(partidas) {
  const L = ['A', 'B', 'C', 'D'];
  const lineas = [['fecha', 'nombre', 'clase', 'cuestionario', 'pregunta nº', 'pregunta', 'respuesta del alumno', 'respuesta correcta', 'acierto', 'tiempo (s)'].join(';')];
  for (const p of partidas) {
    for (const j of p.jugadores) {
      p.preguntas.forEach((q, i) => {
        const r = j.resp[i];
        lineas.push([
          fechaCorta(p.fecha), j.nombre, j.clase, p.titulo, i + 1, q.texto,
          r ? L[r[0]] + ': ' + q.opciones[r[0]] : 'sin respuesta',
          L[q.correcta] + ': ' + q.opciones[q.correcta],
          r && r[0] === q.correcta ? 'sí' : 'no',
          r ? segundos(r[1]) : '',
        ].map(celdaCsv).join(';'));
      });
    }
  }
  return '﻿' + lineas.join('\r\n') + '\r\n';
}

// ---- Copia de seguridad (biblioteca + historial) ----
export function exportarCopia() {
  return JSON.stringify({
    app: 'quest',
    version: 1,
    exportado: new Date().toISOString(),
    biblioteca: biblioteca.listar(),
    historial: historial.listar(),
  });
}

const texto = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');

function cuestionarioValido(c) {
  if (!c || typeof c !== 'object' || typeof c.id !== 'string' || !Array.isArray(c.preguntas)) return null;
  if (c.preguntas.length < 1 || c.preguntas.length > 500) return null;
  const preguntas = [];
  for (const p of c.preguntas) {
    if (!p || typeof p !== 'object' || !Array.isArray(p.incorrectas)) return null;
    const q = {
      numero: Number.isFinite(p.numero) ? p.numero : preguntas.length + 1,
      texto: texto(p.texto, 500),
      tiempo: Number.isFinite(p.tiempo) ? Math.min(600, Math.max(3, Math.round(p.tiempo))) : 20,
      correcta: texto(p.correcta, 300),
      incorrectas: p.incorrectas.slice(0, 3).map((x) => texto(x, 300)),
    };
    if (!q.texto || !q.correcta || !q.incorrectas.length) return null;
    preguntas.push(q);
  }
  return {
    id: texto(c.id, 80),
    titulo: texto(c.titulo, 80) || 'Cuestionario',
    preguntas,
    creado: texto(c.creado, 40),
    actualizado: texto(c.actualizado, 40),
  };
}

function partidaValida(p) {
  if (!p || typeof p !== 'object' || typeof p.id !== 'string' || !Array.isArray(p.jugadores) || !Array.isArray(p.preguntas)) return null;
  if (Number.isNaN(Date.parse(p.fecha))) return null;
  for (const q of p.preguntas) {
    if (!q || !Array.isArray(q.opciones) || typeof q.texto !== 'string' || !Number.isInteger(q.correcta)) return null;
  }
  for (const j of p.jugadores) {
    if (!j || typeof j.nombre !== 'string' || !Array.isArray(j.resp)) return null;
  }
  return p;
}

// Devuelve { cuestionarios, partidas, descartados } o lanza un Error si el archivo no sirve.
export function importarCopia(contenido) {
  let datos;
  try {
    datos = JSON.parse(contenido);
  } catch (e) {
    throw new Error('El archivo no es una copia de seguridad de Quest.');
  }
  if (!datos || datos.app !== 'quest' || !Array.isArray(datos.biblioteca) || !Array.isArray(datos.historial)) {
    throw new Error('El archivo no es una copia de seguridad de Quest.');
  }
  let descartados = 0;
  const biblio = biblioteca.listar();
  let nuevosC = 0;
  for (const c of datos.biblioteca) {
    const v = cuestionarioValido(c);
    if (!v) { descartados++; continue; }
    const i = biblio.findIndex((x) => x.id === v.id);
    if (i < 0) { biblio.push(v); nuevosC++; }
    else if ((v.actualizado || '') > (biblio[i].actualizado || '')) { biblio[i] = v; nuevosC++; }
  }
  const hist = historial.listar();
  let nuevasP = 0;
  for (const p of datos.historial) {
    const v = partidaValida(p);
    if (!v) { descartados++; continue; }
    if (!hist.some((x) => x.id === v.id)) { hist.push(v); nuevasP++; }
  }
  hist.sort((a, b) => Date.parse(b.fecha) - Date.parse(a.fecha));
  if (!escribir(K_BIBLIOTECA, biblio) || !escribir(K_HISTORIAL, hist.slice(0, MAX_PARTIDAS_HISTORIAL))) {
    throw new Error('No hay espacio en este navegador para importar la copia.');
  }
  return { cuestionarios: nuevosC, partidas: nuevasP, descartados };
}
