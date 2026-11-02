import { leerArchivo } from './lector.js';
import {
  almacenamientoDisponible, nuevoId, codigoGuardado, biblioteca, historial, descargar, nombreSeguro,
  fechaCorta, csvNotas, csvDetalle, exportarCopia, importarCopia,
} from './almacen.js';

const LETRAS = ['A', 'B', 'C', 'D'];
const FORMAS = ['▲', '◆', '●', '■'];
const $ = (id) => document.getElementById(id);
// I18N es global (/i18n.js). T(clave, vars) crea un texto que se vuelve a traducir solo al cambiar de idioma.
const T = I18N.T;
const setT = (nodo, key, vars) => I18N.setT(nodo, key, vars);
const principal = $('principal');
const socket = io();

let token = null;
let etiqueta = '';
let contactUrl = 'https://luisfs.com';
let limites = { preguntas: 100, jugadores: 60 };
let estado = null; // estado de la partida en curso
let seleccion = null; // id del cuestionario elegido
let reloj = null;
let temporizador = null;
let enInicio = false;
let resultadoGuardado = false;
const hayAlmacen = almacenamientoDisponible();

const ss = {
  get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* sin almacenamiento */ } },
  del(k) { try { sessionStorage.removeItem(k); } catch (e) { /* sin almacenamiento */ } },
};

// ---------------------------------------------------------------- utilidades de interfaz
function el(tag, props, ...hijos) {
  const e = document.createElement(tag);
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (k === 'class') e.className = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (I18N.esD(v)) I18N.bind(e, k, v);
      else if (v !== undefined && v !== null && v !== false) e.setAttribute(k, v);
    }
  }
  for (const h of hijos.flat()) {
    if (h === null || h === undefined || h === false) continue;
    e.append(I18N.esD(h) ? I18N.nodo(h) : h.nodeType ? h : document.createTextNode(h));
  }
  return e;
}

// titulo: texto de la partida (no se traduce) · claveTitulo: clave del diccionario
function cabecera({ titulo = '', claveTitulo = null, pin = null, sesion = false } = {}) {
  if (claveTitulo) setT($('cab-titulo'), claveTitulo); else $('cab-titulo').textContent = titulo;
  const p = $('cab-pin');
  p.hidden = !pin;
  if (pin) setT(p, 'p.pin', { p: pin }); else p.textContent = '';
  const s = $('cab-sesion');
  s.hidden = !sesion;
  s.textContent = sesion ? etiqueta : '';
}

function ocultarLateral() { $('lateral').hidden = true; }

function aviso(texto, tipo) {
  const t = el('div', { class: 'toast ' + (tipo || ''), role: 'status' }, texto);
  document.body.append(t);
  setTimeout(() => t.remove(), 6000);
}

function segundosFmt(ms) { return I18N.seg(ms); }

function separarGrupo(titulo) {
  const i = titulo.indexOf('_');
  if (i <= 0 || i === titulo.length - 1) return { grupo: 'Otros', nombre: titulo };
  return { grupo: titulo.slice(0, i).trim().toUpperCase(), nombre: titulo.slice(i + 1).trim() };
}

const natural = (a, b) => I18N.ordenar(a, b);

// ---------------------------------------------------------------- acceso con código
// Texto traducible de un error del servidor: { error: 'codigo', vars }
function errorDe(d, porDefecto) {
  return d && d.error && I18N.has('e.' + d.error) ? T('e.' + d.error, d.vars) : T(porDefecto || 'e.generico');
}

async function acceder(codigo) {
  try {
    const r = await fetch('/api/acceso', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, error: errorDe(d, 'e.no_entrar'), rechazado: r.status === 401 };
    token = d.token;
    etiqueta = d.etiqueta || '';
    contactUrl = d.contactUrl || contactUrl;
    limites = d.limites || limites;
    return { ok: true };
  } catch (e) {
    return { ok: false, error: T('e.conexion') };
  }
}

function tarjetaContacto() {
  return el('div', { class: 'aviso-contacto' },
    el('strong', null, T('p.contacto_fuerte'), ' '),
    T('p.contacto_texto'), ' ',
    el('a', { href: contactUrl, target: '_blank', rel: 'noopener' }, T('p.contacto_enlace')));
}

// La guía PDF existe en cada idioma: el enlace sigue al selector
function enlaceGuia(texto, clase) {
  const a = el('a', { class: clase || null }, texto);
  I18N.bindFn(a, 'href', () => '/Guia-Quest-' + I18N.lang + '.pdf');
  I18N.bindFn(a, 'download', () => 'Guia-Quest-' + I18N.lang + '.pdf');
  return a;
}

function enlacesAyuda() {
  return el('p', { class: 'enlaces-ayuda' },
    enlaceGuia(T('p.guia_pdf')),
    ' · ',
    el('a', { href: '/ayuda', target: '_blank', rel: 'noopener' }, T('p.ver_instr')));
}

function pantallaAcceso(mensaje) {
  estado = null;
  token = null;
  enInicio = false;
  clearInterval(temporizador);
  ocultarLateral();
  cabecera({});
  const error = el('p', { class: 'error', id: 'err-acceso', hidden: mensaje ? null : 'hidden' }, mensaje || '');
  const entrada = el('input', {
    type: 'text', id: 'in-codigo', placeholder: 'XXXXX-XXXXX', 'aria-label': T('p.codigo_inv'), autocomplete: 'off',
    autocapitalize: 'characters', spellcheck: 'false', maxlength: '16', required: 'required',
  });
  const recordar = el('input', { type: 'checkbox', id: 'chk-recordar', checked: 'checked' });
  const boton = el('button', { class: 'btn grande', type: 'submit', id: 'btn-acceso' }, T('p.entrar'));
  const form = el('form', {
    class: 'acceso',
    onsubmit: async (ev) => {
      ev.preventDefault();
      boton.disabled = true;
      const r = await acceder(entrada.value);
      boton.disabled = false;
      if (!r.ok) { error.replaceChildren(I18N.nodo(r.error)); error.hidden = false; return; }
      if (recordar.checked) codigoGuardado.guardar(entrada.value); else codigoGuardado.borrar();
      entrarTrasAcceso();
    },
  },
    el('label', { class: 'campo' }, el('span', null, T('p.codigo_inv')), entrada),
    el('label', { class: 'casilla' }, recordar, T('p.recordar')),
    boton);
  principal.replaceChildren(el('div', { class: 'centrado tarjeta estrecha' },
    el('h1', { style: 'margin:0 0 0.4rem' }, T('p.acceso_titulo')),
    el('p', { class: 'nota' }, T('p.acceso_nota')),
    error, form, tarjetaContacto(), enlacesAyuda()));
  entrada.focus();
}

function entrarTrasAcceso() {
  const pin = ss.get('quest-pin');
  if (pin) {
    socket.emit('profesor:reanudar', { token, pin }, (res) => {
      if (!res || !res.ok) { ss.del('quest-pin'); pantallaInicio(); }
    });
  } else pantallaInicio();
}

async function arrancar() {
  try {
    const c = await (await fetch('/api/config')).json();
    contactUrl = c.contactUrl || contactUrl;
    limites = c.limites || limites;
  } catch (e) { /* se usan los valores por defecto */ }
  const codigo = codigoGuardado.leer();
  if (!codigo) return pantallaAcceso();
  const r = await acceder(codigo);
  if (r.ok) return entrarTrasAcceso();
  if (r.rechazado) {
    codigoGuardado.borrar();
    return pantallaAcceso(T('e.codigo_guardado_invalido'));
  }
  pantallaAcceso(r.error);
}

socket.on('connect', () => {
  const pin = ss.get('quest-pin');
  if (token && pin) socket.emit('profesor:reanudar', { token, pin }, () => {});
});

socket.on('profesor:revocado', () => {
  ss.del('quest-pin');
  codigoGuardado.borrar();
  pantallaAcceso(T('e.codigo_revocado'));
});

// ---------------------------------------------------------------- inicio: biblioteca
const inputArchivos = el('input', { type: 'file', accept: '.csv,.xlsx,.xlsm,.txt', multiple: 'multiple', class: 'oculto', id: 'in-archivos' });
const inputCopia = el('input', { type: 'file', accept: '.json,application/json', class: 'oculto', id: 'in-copia' });
document.body.append(inputArchivos, inputCopia);

inputArchivos.addEventListener('change', () => {
  const archivos = Array.from(inputArchivos.files);
  inputArchivos.value = '';
  if (archivos.length) importarArchivos(archivos);
});

inputCopia.addEventListener('change', async () => {
  const archivo = inputCopia.files[0];
  inputCopia.value = '';
  if (!archivo) return;
  try {
    const r = importarCopia(await archivo.text());
    aviso(T(r.descartados ? 'p.copia_importada_d' : 'p.copia_importada', { c: r.cuestionarios, p: r.partidas, d: r.descartados }), 'ok');
  } catch (e) {
    aviso(e.k ? T(e.k, e.v) : e.message, 'error');
  }
  pantallaInicio();
});

principal.addEventListener('dragover', (ev) => { if (enInicio) ev.preventDefault(); });
principal.addEventListener('drop', (ev) => {
  if (!enInicio) return;
  ev.preventDefault();
  const archivos = Array.from(ev.dataTransfer.files || []);
  if (archivos.length) importarArchivos(archivos);
});

function menu(titulo, items, clase) {
  const d = el('details', { class: 'menu' },
    el('summary', { class: clase || 'btn secundario' }, titulo),
    el('div', { class: 'menu-items' }, items));
  d.addEventListener('click', (ev) => { if (ev.target.closest('a,button')) d.open = false; });
  return d;
}

function pantallaInicio() {
  estado = null;
  seleccion = null;
  enInicio = true;
  clearInterval(temporizador);
  ocultarLateral();
  cabecera({ claveTitulo: 'p.mis_cuestionarios', sesion: true });

  const lista = biblioteca.listar();
  const btnCrear = el('button', { class: 'btn grande', id: 'btn-crear', disabled: 'disabled', onclick: crear }, T('p.crear_partida'));
  const errCrear = el('p', { class: 'error', id: 'err-crear', hidden: 'hidden' });
  const contenedor = el('div', { class: 'lista-cuestionarios', id: 'lista-cuestionarios' });

  const grupos = new Map();
  for (const c of lista) {
    const g = separarGrupo(c.titulo);
    if (!grupos.has(g.grupo)) grupos.set(g.grupo, []);
    grupos.get(g.grupo).push({ c, nombre: g.nombre });
  }
  const nombresGrupo = Array.from(grupos.keys()).sort((a, b) => (a === 'Otros' ? 1 : b === 'Otros' ? -1 : natural(a, b)));
  const abiertos = new Set(JSON.parse(ss.get('quest-grupos') || '[]'));
  const ultimo = ss.get('quest-ultimo');

  function marcar(c, item) {
    seleccion = c.id;
    ss.set('quest-ultimo', c.id);
    for (const x of contenedor.querySelectorAll('.sel')) x.classList.remove('sel');
    item.classList.add('sel');
    btnCrear.disabled = false;
  }

  for (const nombre of nombresGrupo) {
    const cuestionarios = grupos.get(nombre).sort((a, b) => natural(a.nombre, b.nombre));
    const carpeta = el('details', { class: 'carpeta', 'data-grupo': nombre });
    if (abiertos.has(nombre) || nombresGrupo.length === 1 || cuestionarios.some((x) => x.c.id === ultimo)) carpeta.open = true;
    carpeta.addEventListener('toggle', () => {
      ss.set('quest-grupos', JSON.stringify(Array.from(contenedor.querySelectorAll('details[open]')).map((d) => d.dataset.grupo)));
    });
    carpeta.append(el('summary', null,
      el('span', { class: 'carpeta-nombre' }, '📁 ', nombre === 'Otros' ? T('otros') : nombre),
      el('small', null, T('p.n_cuestionarios', { n: cuestionarios.length }))));
    const dentro = el('div', { class: 'carpeta-items' });
    for (const { c, nombre: corto } of cuestionarios) {
      const item = el('div', { class: 'ci', 'data-busqueda': c.titulo.toLowerCase(), 'data-id': c.id },
        el('button', { class: 'ci-main', type: 'button', onclick: () => marcar(c, item) },
          el('strong', null, corto),
          el('small', null, T('p.n_preguntas', { n: c.preguntas.length }))),
        el('button', { class: 'ci-accion', type: 'button', title: T('p.cambiar_nombre'), 'aria-label': T('p.cambiar_nombre'), onclick: () => renombrar(c) }, '✎'),
        el('button', { class: 'ci-accion peligro', type: 'button', title: T('p.eliminar'), 'aria-label': T('p.eliminar'), onclick: () => eliminar(c) }, '🗑'));
      dentro.append(item);
      if (c.id === ultimo) marcar(c, item);
    }
    carpeta.append(dentro);
    contenedor.append(carpeta);
  }

  const buscador = el('input', { class: 'buscador', type: 'search', placeholder: T('p.buscar'), 'aria-label': T('p.buscar'), autocomplete: 'off' });
  buscador.addEventListener('input', () => {
    const q = buscador.value.trim().toLowerCase();
    for (const carpeta of contenedor.querySelectorAll('details.carpeta')) {
      let visibles = 0;
      for (const it of carpeta.querySelectorAll('.ci')) {
        const coincide = !q || it.dataset.busqueda.includes(q);
        it.hidden = !coincide;
        if (coincide) visibles += 1;
      }
      carpeta.hidden = visibles === 0;
      if (q && visibles) carpeta.open = true;
    }
  });

  const plantillas = menu(T('p.plantilla'), [
    el('a', { href: '/plantillas/Plantilla-Quest.xlsx', download: 'Plantilla-Quest.xlsx' }, T('p.plantilla_xlsx')),
    el('a', { href: '/plantillas/Plantilla-Quest.csv', download: 'Plantilla-Quest.csv' }, T('p.plantilla_csv')),
  ]);
  const copia = menu(T('p.copia'), [
    el('button', { type: 'button', onclick: () => {
      descargar('quest-copia-' + new Date().toISOString().slice(0, 10) + '.json', exportarCopia(), 'application/json');
    } }, T('p.exportar_copia')),
    el('button', { type: 'button', onclick: () => inputCopia.click() }, T('p.importar_copia')),
  ], 'enlace-menu');

  const vacio = el('div', { class: 'pasos' },
    el('h2', null, T('p.pasos_titulo')),
    el('ol', null,
      el('li', null, T('p.paso1')),
      el('li', null, T('p.paso2')),
      el('li', null, T('p.paso3'))),
    el('p', { class: 'nota' }, T('p.consejo')));

  principal.replaceChildren(el('div', { class: 'centrado tarjeta ancha' },
    el('div', { class: 'fila-titulo' },
      el('h1', { style: 'margin:0' }, T('p.mis_cuestionarios')),
      el('div', { class: 'acciones' },
        plantillas,
        el('button', { class: 'btn', id: 'btn-importar', type: 'button', onclick: () => inputArchivos.click() }, T('p.importar')))),
    hayAlmacen ? el('p', { class: 'nota' }, T('p.nota_navegador'))
      : el('p', { class: 'error' }, T('p.sin_almacen')),
    lista.length ? [lista.length > 6 ? buscador : null, contenedor] : vacio,
    errCrear,
    el('div', { style: 'text-align:center;margin-top:1rem' }, btnCrear),
    el('div', { class: 'pie-acciones' },
      el('button', { class: 'enlace-menu', type: 'button', id: 'btn-historial', onclick: pantallaHistorial },
        T('p.historial', { n: historial.listar().length })),
      copia,
      enlaceGuia(T('p.instrucciones_pdf'), 'enlace-menu'),
      el('button', { class: 'enlace-menu', type: 'button', id: 'btn-salir', onclick: salir }, T('p.salir')))));
}

function salir() {
  codigoGuardado.borrar();
  ss.del('quest-pin');
  pantallaAcceso();
}

function renombrar(c) {
  const nuevo = prompt(I18N.t('p.prompt_renombrar'), c.titulo);
  if (nuevo === null) return;
  const titulo = nuevo.replace(/\s+/g, ' ').trim().slice(0, 80);
  if (!titulo) return;
  const otro = biblioteca.porTitulo(titulo);
  if (otro && otro.id !== c.id) { aviso(T('p.nombre_repetido'), 'error'); return; }
  if (!biblioteca.guardar({ ...c, titulo, actualizado: new Date().toISOString() })) aviso(T('p.no_guardar_cambio'), 'error');
  pantallaInicio();
}

function eliminar(c) {
  if (!confirm(I18N.t('p.confirm_eliminar', { t: c.titulo }))) return;
  biblioteca.borrar(c.id);
  if (ss.get('quest-ultimo') === c.id) ss.del('quest-ultimo');
  pantallaInicio();
}

// ---------------------------------------------------------------- importar con vista previa
async function importarArchivos(archivos) {
  for (const f of archivos) {
    let r;
    try {
      r = await leerArchivo(f, { maxPreguntas: limites.preguntas });
    } catch (e) {
      r = { titulo: f.name.replace(/\.[^.]+$/, ''), preguntas: [], avisos: [], errores: [e.k ? { k: e.k, v: e.v } : { k: 'imp.error', v: { m: e.message } }] };
    }
    const accion = await vistaPrevia(f.name, r, archivos.length > 1);
    if (accion === 'parar') break;
  }
  pantallaInicio();
}

function vistaPrevia(nombreArchivo, r, hayMas) {
  return new Promise((resolve) => {
    enInicio = false;
    ocultarLateral();
    cabecera({ claveTitulo: 'p.importar', sesion: true });
    const valido = r.errores.length === 0;
    const titulo = el('input', { type: 'text', id: 'in-titulo', maxlength: '80', value: r.titulo });
    const hint = el('p', { class: 'nota', id: 'hint-titulo' });
    const textoHint = I18N.nodo(T('p.imp_sustituye'));
    const actualizarHint = () => {
      if (biblioteca.porTitulo(titulo.value)) hint.replaceChildren(textoHint); else hint.replaceChildren();
    };
    titulo.addEventListener('input', actualizarHint);
    actualizarHint();
    const errGuardar = el('p', { class: 'error', id: 'err-guardar', hidden: 'hidden' });

    const guardar = () => {
      const t = titulo.value.replace(/\s+/g, ' ').trim().slice(0, 80) || r.titulo;
      const existente = biblioteca.porTitulo(t);
      const ahora = new Date().toISOString();
      const ok = biblioteca.guardar({
        id: existente ? existente.id : nuevoId(),
        titulo: t,
        preguntas: r.preguntas.map((p, i) => ({ numero: i + 1, texto: p.texto, tiempo: p.tiempo, correcta: p.correcta, incorrectas: p.incorrectas })),
        creado: existente ? existente.creado : ahora,
        actualizado: ahora,
      });
      if (!ok) {
        errGuardar.replaceChildren(I18N.nodo(T('p.imp_no_espacio')));
        errGuardar.hidden = false;
        return;
      }
      aviso(T('p.imp_guardado', { t, n: r.preguntas.length }), 'ok');
      resolve('guardado');
    };

    const muestra = r.preguntas.slice(0, 3).map((p, i) => el('div', { class: 'muestra' },
      el('strong', null, `${i + 1}. ${p.texto}`),
      el('small', null, p.tiempo + ' ', T('s')),
      el('ul', null,
        el('li', { class: 'ok' }, '✓ ' + p.correcta),
        p.incorrectas.map((x) => el('li', null, '✗ ' + x)))));

    const tiempoMedio = r.preguntas.length
      ? Math.round(r.preguntas.reduce((s, p) => s + p.tiempo, 0) / r.preguntas.length) : 0;

    principal.replaceChildren(el('div', { class: 'centrado tarjeta ancha' },
      el('h1', { style: 'margin:0 0 0.2rem' }, T('p.importar')),
      el('p', { class: 'nota' }, T('p.imp_archivo', { f: nombreArchivo })),
      valido ? [
        el('label', { class: 'campo' }, el('span', null, T('p.imp_nombre')), titulo),
        hint,
        el('p', { class: 'resumen-import', id: 'resumen-import' },
          el('strong', null, T('p.imp_validas', { n: r.preguntas.length })),
          T('p.imp_tiempo_medio', { t: tiempoMedio }), r.avisos.length ? T('p.imp_n_avisos', { n: r.avisos.length }) : null),
      ] : null,
      r.errores.length ? el('div', { class: 'error', id: 'errores-import' }, r.errores.map((x) => el('p', { style: 'margin:0.2rem 0' }, T(x.k, x.v)))) : null,
      r.avisos.length ? el('details', { class: 'avisos-import', open: r.avisos.length <= 4 ? 'open' : null },
        el('summary', null, T('p.imp_avisos', { n: r.avisos.length })),
        el('ul', null, r.avisos.slice(0, 15).map((a) => el('li', null, T(a.k, a.v))),
          r.avisos.length > 15 ? el('li', null, T('p.imp_mas', { n: r.avisos.length - 15 })) : null)) : null,
      valido ? el('div', { class: 'muestras' }, el('h2', null, T('p.imp_asi')), muestra) : null,
      errGuardar,
      el('div', { class: 'acciones-fin' },
        valido ? el('button', { class: 'btn grande', id: 'btn-guardar-import', type: 'button', onclick: guardar }, T('p.imp_guardar')) : null,
        el('button', { class: 'btn secundario', type: 'button', id: 'btn-omitir', onclick: () => resolve('omitido') }, hayMas ? T('p.imp_omitir') : T('p.imp_cancelar')),
        hayMas ? el('button', { class: 'btn secundario', type: 'button', onclick: () => resolve('parar') }, T('p.imp_cancelar_resto')) : null)));
  });
}

// ---------------------------------------------------------------- historial
function pantallaHistorial() {
  estado = null;
  enInicio = false;
  ocultarLateral();
  cabecera({ claveTitulo: 'p.hist_titulo', sesion: true });
  const partidas = historial.listar();

  const items = partidas.map((p) => {
    const clases = Array.from(new Set(p.jugadores.map((j) => j.clase))).join(', ');
    return el('details', { class: 'partida', 'data-id': p.id },
      el('summary', null,
        el('span', { class: 'partida-titulo' }, p.titulo),
        el('small', null, T('p.hist_resumen', { f: fechaCorta(p.fecha), n: p.jugadores.length, c: clases }))),
      el('div', { class: 'tabla-scroll' }, el('table', null,
        el('thead', null, el('tr', null, ['p.th_pos', 'p.th_nombre', 'p.th_clase', 'p.th_puntos', 'p.th_fallos', 'p.th_tiempo'].map((h) => el('th', null, T(h))))),
        el('tbody', null, p.jugadores.map((j) => el('tr', null,
          el('td', null, String(j.pos)), el('td', null, j.nombre), el('td', null, j.clase),
          el('td', null, j.puntos + ' / ' + p.jugadas), el('td', null, String(j.fallos)), el('td', null, segundosFmt(j.tiempoMs))))))),
      el('div', { class: 'acciones-fin' },
        el('button', { class: 'btn', type: 'button', onclick: () => descargar(`quest-notas-${nombreSeguro(p.titulo)}-${p.fecha.slice(0, 10)}.csv`, csvNotas([p]), 'text/csv;charset=utf-8') }, T('p.dl_notas')),
        el('button', { class: 'btn secundario', type: 'button', onclick: () => descargar(`quest-detalle-${nombreSeguro(p.titulo)}-${p.fecha.slice(0, 10)}.csv`, csvDetalle([p]), 'text/csv;charset=utf-8') }, T('p.dl_detalle')),
        el('button', { class: 'btn peligro', type: 'button', onclick: () => {
          if (!confirm(I18N.t('p.confirm_borrar_partida'))) return;
          historial.borrar(p.id);
          pantallaHistorial();
        } }, T('borrar'))));
  });

  principal.replaceChildren(el('div', { class: 'centrado tarjeta ancha' },
    el('div', { class: 'fila-titulo' },
      el('h1', { style: 'margin:0' }, T('p.hist_titulo')),
      el('div', { class: 'acciones' },
        el('button', { class: 'btn secundario', type: 'button', id: 'btn-volver', onclick: pantallaInicio }, T('volver')),
        partidas.length ? el('button', { class: 'btn', type: 'button', id: 'btn-todo-notas', onclick: () => descargar('quest-notas-todas.csv', csvNotas(partidas), 'text/csv;charset=utf-8') }, T('p.dl_todas')) : null)),
    el('p', { class: 'nota' }, T('p.hist_nota')),
    partidas.length ? items : el('p', { class: 'ranking-vacio' }, T('p.hist_vacio'))));
}

// ---------------------------------------------------------------- crear y seguir la partida
function crear(reintento) {
  const c = biblioteca.obtener(seleccion);
  if (!c) return;
  const btn = $('btn-crear');
  const err = $('err-crear');
  if (btn) btn.disabled = true;
  socket.emit('profesor:crear', { token, titulo: c.titulo, preguntas: c.preguntas }, async (res) => {
    if (res && res.sesion === false && !reintento) {
      const codigo = codigoGuardado.leer();
      if (codigo && (await acceder(codigo)).ok) return crear(true);
      return pantallaAcceso(T('e.sesion_caducada'));
    }
    if (!res || !res.ok) {
      if (err) { err.replaceChildren(I18N.nodo(errorDe(res, 'e.no_crear_partida'))); err.hidden = false; }
      if (btn) btn.disabled = false;
      return;
    }
    resultadoGuardado = false;
    ss.set('quest-pin', res.pin);
  });
}

socket.on('profesor:estado', (e) => {
  estado = e;
  enInicio = false;
  ss.set('quest-pin', e.pin);
  pintar();
});

socket.on('profesor:respondidos', (d) => {
  const c = $('contador');
  if (c && estado && estado.pregunta) {
    estado.pregunta.respondidos = d.respondidos;
    setT(c, 'p.han_respondido', { r: d.respondidos, n: d.conectados });
  }
});

socket.on('profesor:jugadores', (d) => { if (estado) estado.numJugadores = d.numJugadores; });

function pintar() {
  const e = estado;
  clearInterval(temporizador);
  reloj = null;
  cabecera({ titulo: e.titulo, pin: e.pin });
  if (e.fase === 'lobby') return pintarLobby(e);
  if (e.fase === 'pregunta' || e.fase === 'revelada') return pintarPregunta(e);
  if (e.fase === 'final') return pintarFinal(e);
}

const cacheQr = {};
async function cargarQr(pin, img) {
  try {
    if (!cacheQr[pin]) {
      const r = await fetch('/api/qr?pin=' + encodeURIComponent(pin), { headers: { Authorization: 'Bearer ' + token }, cache: 'no-store' });
      if (!r.ok) throw new Error('qr');
      cacheQr[pin] = URL.createObjectURL(await r.blob());
    }
    img.src = cacheQr[pin];
  } catch (e) {
    img.replaceWith(el('p', { class: 'ranking-vacio' }, T('p.no_qr')));
  }
}

function pintarLobby(e) {
  ocultarLateral();
  const chips = el('div', { class: 'chips' });
  if (!e.lobby.length) chips.append(el('span', { class: 'ranking-vacio' }, T('p.esperando')));
  for (const j of e.lobby) {
    chips.append(el('span', { class: 'chip' }, j.nombre, el('small', null, j.clase),
      el('button', { title: T('p.sacar'), 'aria-label': T('p.sacar'), onclick: () => socket.emit('profesor:expulsar', { id: j.id }) }, '×')));
  }
  const qr = el('img', { class: 'qr', alt: T('p.qr_alt'), width: '260', height: '260' });
  cargarQr(e.pin, qr);
  principal.replaceChildren(el('div', { class: 'centrado' },
    el('div', { class: 'entrada-fila' },
      el('div', { class: 'entrada-texto' },
        el('p', { class: 'url-union' }, T('p.entra_movil'), el('strong', null, location.host)),
        el('p', { class: 'url-union' }, T('p.introduce_codigo')),
        el('div', { class: 'pin-grande', id: 'pin-grande' }, e.pin)),
      el('div', { class: 'entrada-qr' }, qr, el('p', { class: 'qr-pie' }, T('p.o_qr')))),
    el('p', { class: 'contador-resp', id: 'contador-lobby' }, T('p.n_dentro', { n: e.numJugadores })),
    chips,
    el('div', { style: 'display:flex;gap:1rem;justify-content:center' },
      el('button', { class: 'btn secundario', id: 'btn-cancelar', onclick: cancelarPartida }, T('cancelar')),
      el('button', { class: 'btn grande', id: 'btn-empezar', disabled: e.numJugadores ? null : 'disabled', onclick: () => socket.emit('profesor:iniciar') }, T('p.empezar')))));
}

function cancelarPartida() {
  if (!confirm(I18N.t('p.confirm_cancelar'))) return;
  cerrarYVolver();
}

function cerrarYVolver() {
  socket.emit('profesor:cerrar');
  ss.del('quest-pin');
  estado = null;
  pantallaInicio();
}

function pintarPregunta(e) {
  const p = e.pregunta;
  const revelada = e.fase === 'revelada';
  const temporizadorEl = el('div', { class: 'temporizador', id: 'temporizador' }, revelada ? '' : Math.ceil(p.restanteMs / 1000));
  const barra = el('i', { id: 'barra' });
  const opciones = el('div', { class: 'grid-opciones' + (p.opciones.length === 1 ? ' una-sola-columna' : '') });
  p.opciones.forEach((texto, i) => {
    const clases = ['opcion-pro', 'op-' + i];
    if (revelada) clases.push(i === e.revelada.correcta ? 'correcta' : 'apagada');
    opciones.append(el('div', { class: clases.join(' ') },
      el('span', { class: 'letra-pro' }, FORMAS[i] + ' ' + LETRAS[i]),
      el('span', null, texto),
      revelada ? el('span', { class: 'cuenta' }, String(e.revelada.conteo[i])) : null));
  });

  const acciones = el('div', { class: 'barra-acciones' });
  if (!revelada) {
    acciones.append(
      el('span', { class: 'contador-resp', id: 'contador' }, T('p.han_respondido', { r: p.respondidos, n: e.numJugadores })),
      el('span', { style: 'display:flex;gap:0.6rem' },
        el('button', { class: 'btn peligro', id: 'btn-terminar', onclick: terminar }, T('p.terminar')),
        el('button', { class: 'btn', id: 'btn-revelar', onclick: () => socket.emit('profesor:revelar') }, T('p.mostrar_resp'))));
  } else {
    const ultima = e.indice + 1 >= e.total;
    acciones.append(
      el('span', { class: 'contador-resp' }, T('p.respondieron', { r: p.respondidos, n: e.numJugadores })),
      el('span', { style: 'display:flex;gap:0.6rem' },
        el('button', { class: 'btn peligro', id: 'btn-terminar', onclick: terminar }, T('p.terminar')),
        el('button', { class: 'btn grande', id: 'btn-siguiente', onclick: () => socket.emit('profesor:siguiente') }, ultima ? T('p.ver_finales') : T('p.siguiente'))));
  }

  principal.replaceChildren(
    el('div', { class: 'estado-pregunta' }, el('span', null, T('a.pregunta_n_de', { i: e.indice + 1, n: e.total })), temporizadorEl),
    el('div', { class: 'pista-tiempo' }, barra),
    el('div', { class: 'enunciado' }, p.texto),
    opciones,
    acciones);

  if (!revelada) {
    reloj = { fin: performance.now() + p.restanteMs, total: p.tiempo * 1000 };
    const tic = () => {
      const resto = Math.max(0, reloj.fin - performance.now());
      const t = $('temporizador');
      const b = $('barra');
      if (!t || !b) return;
      const s = Math.ceil(resto / 1000);
      t.textContent = s;
      t.classList.toggle('poco', s <= 5);
      b.style.transform = 'scaleX(' + (resto / reloj.total) + ')';
    };
    tic();
    temporizador = setInterval(tic, 100);
  } else {
    barra.style.transform = 'scaleX(0)';
  }
  pintarRanking(e.ranking, revelada ? 'p.ranking' : 'p.ranking_antes');
}

function terminar() {
  if (!confirm(I18N.t('p.confirm_terminar'))) return;
  socket.emit('profesor:terminar');
}

function pintarRanking(lista, claveTitulo, todos) {
  $('lateral').hidden = false;
  setT($('lat-titulo'), claveTitulo || 'p.ranking');
  const ol = $('ranking');
  ol.replaceChildren();
  if (!lista || !lista.length) { ol.append(el('li', { class: 'ranking-vacio' }, T('p.sin_punt'))); return; }
  for (const r of todos ? lista : lista.slice(0, 15)) {
    ol.append(el('li', null,
      el('span', { class: 'pos' }, String(r.pos)),
      el('span', { class: 'nom' }, r.nombre, el('small', null, r.clase + (todos ? ' · ' + segundosFmt(r.tiempoMs) : ''))),
      el('span', { class: 'pts' }, T('p.pts', { n: r.puntos }))));
  }
}

function pintarFinal(e) {
  const resumen = e.resumen;
  const hayResultados = !!(resumen && resumen.jugadas > 0 && resumen.jugadores.length > 0);
  let guardadoEnHistorial = false;
  if (hayResultados) {
    resumen.id = resumen.fecha + '-' + e.pin;
    if (historial.listar().some((p) => p.id === resumen.id)) guardadoEnHistorial = true;
    else guardadoEnHistorial = hayAlmacen && historial.añadir(resumen);
    resultadoGuardado = guardadoEnHistorial;
  }

  const r = e.ranking || [];
  const medallas = ['🥇', '🥈', '🥉'];
  const podio = el('div', { class: 'podio' });
  for (const i of [1, 0, 2]) {
    if (!r[i]) continue;
    podio.append(el('div', { class: 'puesto p' + (i + 1) },
      el('div', { class: 'medalla' }, medallas[i]),
      el('div', { class: 'nombre' }, r[i].nombre),
      el('div', { class: 'puntos' }, r[i].clase + ' · ', T('p.pts', { n: r[i].puntos })),
      el('div', { class: 'puntos' }, segundosFmt(r[i].tiempoMs))));
  }

  const nombreBase = hayResultados ? `${nombreSeguro(resumen.titulo)}-${resumen.fecha.slice(0, 10)}` : '';
  principal.replaceChildren(el('div', { class: 'centrado' },
    el('h1', { style: 'font-size:clamp(2rem,5vw,3.5rem);margin:0' }, T('p.fin')),
    podio,
    hayResultados ? [
      el('div', { class: 'caja-resultados' },
        el('p', { style: 'margin:0 0 0.6rem' }, el('strong', null, T('p.descarga_ahora')),
          T(guardadoEnHistorial ? 'p.srv_no_guarda_ok' : 'p.srv_no_guarda_ko')),
        el('div', { class: 'acciones-fin', style: 'justify-content:center' },
          el('button', { class: 'btn grande', id: 'btn-csv-notas', onclick: () => descargar(`quest-notas-${nombreBase}.csv`, csvNotas([resumen]), 'text/csv;charset=utf-8') }, T('p.dl_notas')),
          el('button', { class: 'btn secundario', id: 'btn-csv-detalle', onclick: () => descargar(`quest-detalle-${nombreBase}.csv`, csvDetalle([resumen]), 'text/csv;charset=utf-8') }, T('p.dl_detalle')))),
    ] : el('p', { class: 'contador-resp' }, T('p.sin_resultados')),
    el('div', { style: 'display:flex;gap:1rem;justify-content:center;margin-top:1.2rem' },
      el('button', { class: 'btn grande', id: 'btn-nueva', onclick: cerrarYVolver }, T('p.nueva')))));
  pintarRanking(r, 'p.clasif_final', true);
}

// Atajos de teclado: Espacio / Intro / → hacen la acción principal
document.addEventListener('keydown', (ev) => {
  const tag = document.activeElement && document.activeElement.tagName;
  if (!estado || ['INPUT', 'SELECT', 'TEXTAREA'].includes(tag)) return;
  if (ev.key === ' ' || ev.key === 'Enter' || ev.key === 'ArrowRight') {
    if (estado.fase === 'revelada') { ev.preventDefault(); socket.emit('profesor:siguiente'); }
    else if (estado.fase === 'pregunta') { ev.preventDefault(); socket.emit('profesor:revelar'); }
    else if (estado.fase === 'lobby' && estado.numJugadores) { ev.preventDefault(); socket.emit('profesor:iniciar'); }
  }
});

// Avisa antes de cerrar la pestaña con una partida en marcha
window.addEventListener('beforeunload', (ev) => {
  if (estado && estado.fase !== 'final') { ev.preventDefault(); ev.returnValue = ''; }
});

arrancar();
