// Lee cuestionarios desde CSV o Excel (.xlsx) en el navegador y los valida.
// Nada de lo que se lee aquí sale del navegador hasta que se crea una partida.

const MAX_BYTES = 3 * 1024 * 1024;

function quitarAcentos(s) {
  return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function normalizarCabecera(h) {
  return quitarAcentos(h).toLowerCase().replace(/^﻿/, '').replace(/[\s_\-.]/g, '');
}

function limpiar(v) {
  return String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
}

// UTF-8 y, si no lo es, Windows-1252 (CSV guardado desde Excel en español sin "UTF-8")
export function decodificar(buffer) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch (e) {
    return new TextDecoder('windows-1252').decode(buffer);
  }
}

export function parsearCsv(texto) {
  texto = texto.replace(/^﻿/, '');
  const primera = texto.split(/\r?\n/, 1)[0] || '';
  const cuenta = (c) => primera.split(c).length - 1;
  let delim = ',';
  if (cuenta(';') > cuenta(',') && cuenta(';') >= cuenta('\t')) delim = ';';
  else if (cuenta('\t') > cuenta(',')) delim = '\t';

  const filas = [];
  let fila = [];
  let campo = '';
  let enComillas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (enComillas) {
      if (c === '"') {
        if (texto[i + 1] === '"') { campo += '"'; i++; } else enComillas = false;
      } else campo += c;
    } else if (c === '"' && campo === '') {
      enComillas = true;
    } else if (c === delim) {
      fila.push(campo); campo = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      fila.push(campo); campo = '';
      filas.push(fila); fila = [];
    } else campo += c;
  }
  if (campo !== '' || fila.length) { fila.push(campo); filas.push(fila); }
  return filas;
}

// --- Excel (.xlsx): un zip con XML. Se lee la hoja «Cuestionario» o, si no existe, la primera. ---
function letrasAColumna(ref) {
  const m = /^([A-Z]+)/.exec(ref || '');
  if (!m) return -1;
  let n = 0;
  for (const ch of m[1]) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

function textoDeNodos(nodo) {
  let t = '';
  for (const x of nodo.getElementsByTagName('t')) {
    if (x.parentNode && x.parentNode.nodeName === 'rPh') continue; // pronunciación fonética
    t += x.textContent;
  }
  return t;
}

export function leerXlsx(buffer) {
  const f = window.fflate;
  if (!f) throw new Error('No se pudo cargar el lector de Excel. Recarga la página.');
  let ficheros;
  try {
    ficheros = f.unzipSync(new Uint8Array(buffer));
  } catch (e) {
    throw new Error('Este archivo no es un Excel (.xlsx) válido.');
  }
  const leerTexto = (ruta) => (ficheros[ruta] ? f.strFromU8(ficheros[ruta]) : null);
  const xml = (s) => new DOMParser().parseFromString(s, 'application/xml');

  const wb = leerTexto('xl/workbook.xml');
  if (!wb) throw new Error('Este archivo no es un Excel (.xlsx) válido.');
  const NS_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const hojas = Array.from(xml(wb).getElementsByTagName('sheet')).map((s) => ({
    nombre: s.getAttribute('name') || '',
    rid: s.getAttribute('r:id') || s.getAttributeNS(NS_REL, 'id'),
  }));
  if (!hojas.length) throw new Error('El Excel no tiene hojas.');

  const rels = {};
  const relsXml = leerTexto('xl/_rels/workbook.xml.rels');
  if (relsXml) {
    for (const r of xml(relsXml).getElementsByTagName('Relationship')) rels[r.getAttribute('Id')] = r.getAttribute('Target');
  }
  const hoja = hojas.find((h) => normalizarCabecera(h.nombre) === 'cuestionario') || hojas[0];
  let destino = rels[hoja.rid] || 'worksheets/sheet1.xml';
  destino = destino.startsWith('/') ? destino.slice(1) : 'xl/' + destino.replace(/^\.\//, '');
  const hojaXml = leerTexto(destino);
  if (!hojaXml) throw new Error('No se pudo leer la hoja del Excel.');

  const compartidas = [];
  const ssXml = leerTexto('xl/sharedStrings.xml');
  if (ssXml) for (const si of xml(ssXml).getElementsByTagName('si')) compartidas.push(textoDeNodos(si));

  const filas = [];
  let numFila = 0;
  for (const row of xml(hojaXml).getElementsByTagName('row')) {
    numFila = parseInt(row.getAttribute('r'), 10) || numFila + 1;
    if (numFila > 5000) break;
    const valores = [];
    for (const c of row.getElementsByTagName('c')) {
      const col = letrasAColumna(c.getAttribute('r'));
      if (col < 0 || col > 60) continue;
      const tipo = c.getAttribute('t');
      const v = c.getElementsByTagName('v')[0];
      let valor = '';
      if (tipo === 's') valor = v ? compartidas[parseInt(v.textContent, 10)] || '' : '';
      else if (tipo === 'inlineStr') { const is = c.getElementsByTagName('is')[0]; valor = is ? textoDeNodos(is) : ''; }
      else if (tipo === 'e') valor = '';
      else valor = v ? v.textContent : '';
      while (valores.length < col) valores.push('');
      valores[col] = valor;
    }
    while (filas.length < numFila - 1) filas.push([]);
    filas[numFila - 1] = valores;
  }
  return filas;
}

// --- Filas -> preguntas validadas (mismas reglas que aplica el servidor) ---
export function filasAPreguntas(filas, { maxPreguntas = 100 } = {}) {
  const res = { preguntas: [], avisos: [], errores: [] };
  const idx = filas.findIndex((f) => f.some((c) => limpiar(c) !== ''));
  if (idx < 0) { res.errores.push('El archivo está vacío.'); return res; }

  const cab = filas[idx].map(normalizarCabecera);
  const col = (n) => cab.indexOf(n);
  const iP = col('pregunta');
  const iC = col('correcta');
  const iI = [col('incorrecta1'), col('incorrecta2'), col('incorrecta3')];
  const iN = col('numero');
  const iT = col('tiempo');
  const falta = [];
  if (iP < 0) falta.push('pregunta');
  if (iC < 0) falta.push('correcta');
  if (iI[0] < 0) falta.push('incorrecta1');
  if (falta.length) {
    res.errores.push(
      'En la primera fila falta la columna: ' + falta.join(', ') +
      '. Usa la plantilla (primera fila: numero, tiempo, pregunta, correcta, incorrecta1, incorrecta2, incorrecta3).'
    );
    return res;
  }

  const dato = (f, i) => (i < 0 ? '' : limpiar(f[i]));
  const recortar = (texto, max, fila, que) => {
    if (texto.length <= max) return texto;
    res.avisos.push(`Fila ${fila}: ${que} recortada a ${max} caracteres.`);
    return texto.slice(0, max);
  };

  for (let r = idx + 1; r < filas.length; r++) {
    const f = filas[r];
    const nFila = r + 1;
    let texto = dato(f, iP);
    let correcta = dato(f, iC);
    let incorrectas = iI.map((i) => dato(f, i)).filter(Boolean);
    if (!texto && !correcta && !incorrectas.length) continue; // fila vacía (solo el número)
    if (!texto || !correcta || !incorrectas.length) {
      res.avisos.push(`Fila ${nFila}: falta la pregunta, la correcta o alguna incorrecta; se omite.`);
      continue;
    }
    texto = recortar(texto, 500, nFila, 'la pregunta');
    correcta = recortar(correcta, 300, nFila, 'la respuesta correcta');
    incorrectas = incorrectas.map((x) => recortar(x, 300, nFila, 'una incorrecta'));
    const antes = incorrectas.length;
    const vistas = new Set([correcta.toLowerCase()]);
    incorrectas = incorrectas.filter((x) => { const k = x.toLowerCase(); if (vistas.has(k)) return false; vistas.add(k); return true; });
    if (incorrectas.length !== antes) res.avisos.push(`Fila ${nFila}: había respuestas repetidas; se ignoran las duplicadas.`);
    if (!incorrectas.length) { res.avisos.push(`Fila ${nFila}: sin respuestas incorrectas distintas de la correcta; se omite.`); continue; }

    const crudoT = dato(f, iT);
    let tiempo = parseInt(crudoT.replace(/[^0-9]/g, ''), 10);
    if (!Number.isFinite(tiempo) || tiempo < 3) {
      if (crudoT !== '') res.avisos.push(`Fila ${nFila}: tiempo «${crudoT}» no válido; se usan 20 s.`);
      tiempo = 20;
    }
    if (tiempo > 600) tiempo = 600;
    const numero = parseFloat(dato(f, iN).replace(',', '.'));
    res.preguntas.push({ numero: Number.isFinite(numero) ? numero : r, texto, tiempo, correcta, incorrectas });
  }

  res.preguntas.sort((a, b) => a.numero - b.numero);
  if (!res.preguntas.length) res.errores.push('No hay ninguna pregunta completa (pregunta, correcta y al menos una incorrecta).');
  if (res.preguntas.length > maxPreguntas) {
    res.errores.push(`Tiene ${res.preguntas.length} preguntas y el máximo es ${maxPreguntas}. Divídelo en dos cuestionarios.`);
  }
  return res;
}

export async function leerArchivo(archivo, opciones) {
  if (archivo.size > MAX_BYTES) throw new Error('El archivo es demasiado grande (máximo 3 MB).');
  const buffer = await archivo.arrayBuffer();
  const bytes = new Uint8Array(buffer.slice(0, 2));
  const ext = ((archivo.name.match(/\.([^.]+)$/) || [])[1] || '').toLowerCase();
  const esZip = bytes[0] === 0x50 && bytes[1] === 0x4b;
  let filas;
  if (ext === 'xls') throw new Error('El formato .xls antiguo no se admite. Guárdalo como .xlsx o como CSV.');
  if (ext === 'xlsx' || ext === 'xlsm' || esZip) filas = leerXlsx(buffer);
  else filas = parsearCsv(decodificar(buffer));
  const titulo = archivo.name.replace(/\.[^.]+$/, '');
  return { titulo, ...filasAPreguntas(filas, opciones) };
}
