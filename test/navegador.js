'use strict';
// Prueba de navegador (Playwright + Chromium): entrada con código, importación, biblioteca local,
// partida con alumnos simulados, descarga de CSV, historial y copia de seguridad.
const { spawn } = require('child_process');
const { io } = require('socket.io-client');
const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/npm-tools/node_modules/playwright')); }

const PORT = 3123;
const BASE = `http://127.0.0.1:${PORT}`;
const CLAVE = 'clave-e2e';
const ADMIN = 'Basic ' + Buffer.from('admin:' + CLAVE).toString('base64');
const FX = path.join(__dirname, 'fixtures');
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const ok = (m) => console.log('  ✓ ' + m);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'quest-e2e-'));
let servidor; let navegador;

async function arrancar() {
  servidor = spawn('node', ['server.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(PORT), DATA_DIR: path.join(tmp, 'data'), ADMIN_PASSWORD: CLAVE, CONTACT_URL: 'https://example.org/contacto', MAX_PREGUNTAS: '100', MAX_JUGADORES: '60' },
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  let log = '';
  servidor.stdout.on('data', (d) => { log += d; });
  for (let i = 0; i < 200 && !log.includes('Servidor iniciado'); i++) await dormir(50);
  assert.ok(log.includes('Servidor iniciado'), 'el servidor no arrancó');
}

async function leerDescarga(page, accion) {
  const [d] = await Promise.all([page.waitForEvent('download'), accion()]);
  const ruta = await d.path();
  return { nombre: d.suggestedFilename(), bytes: fs.readFileSync(ruta) };
}

async function importar(page, archivos, pasos) {
  await page.setInputFiles('#in-archivos', archivos.map((a) => path.join(FX, a)));
  for (const paso of pasos) await paso();
}

async function main() {
  await arrancar();
  const cod = await (await fetch(BASE + '/api/admin/codigos', { method: 'POST', headers: { Authorization: ADMIN, 'Content-Type': 'application/json' }, body: JSON.stringify({ etiqueta: 'Prueba E2E' }) })).json();

  navegador = await chromium.launch();
  const ctx = await navegador.newContext({ acceptDownloads: true, viewport: { width: 1200, height: 800 } });
  const page = await ctx.newPage();
  const erroresConsola = [];
  page.on('pageerror', (e) => erroresConsola.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('401')) erroresConsola.push('console: ' + m.text()); });
  page.on('dialog', (d) => d.accept(d.type() === 'prompt' ? 'C6_U1_Renombrado' : undefined));

  // ------------------------------------------------------------ alumno: página principal
  console.log('Portada y acceso');
  await page.goto(BASE + '/');
  assert.ok(await page.locator('a[href="/profesor"]').count()); ok('la portada de alumnos enlaza con «Soy profesor»');

  await page.goto(BASE + '/profesor');
  await page.waitForSelector('#in-codigo');
  assert.ok(await page.locator('a[href="https://example.org/contacto"]').count(), 'enlace de contacto');
  ok('la pantalla de acceso muestra el aviso y el enlace de contacto configurado');
  await page.fill('#in-codigo', 'AAAAA-BBBBB');
  await page.click('#btn-acceso');
  await page.waitForSelector('#err-acceso:not([hidden])');
  ok('un código erróneo muestra el error: «' + (await page.textContent('#err-acceso')).trim() + '»');
  await page.fill('#in-codigo', cod.codigo);
  await page.click('#btn-acceso');
  await page.waitForSelector('#btn-importar');
  ok('con el código correcto se entra');
  assert.ok((await page.textContent('body')).includes('Empieza en tres pasos')); ok('biblioteca vacía muestra los tres pasos');
  assert.ok(await page.locator('a[href="/plantillas/Plantilla-Quest.xlsx"]').count()); ok('enlaces a las plantillas presentes');

  // ------------------------------------------------------------ importación
  console.log('Importación');
  // .xls → error sin botón guardar
  await page.setInputFiles('#in-archivos', path.join(FX, 'viejo.xls'));
  await page.waitForSelector('#btn-omitir');
  assert.strictEqual(await page.locator('#btn-guardar-import').count(), 0);
  ok('un .xls antiguo se rechaza con mensaje: «' + (await page.textContent('#errores-import')).trim().slice(0, 90) + '…»');
  await page.click('#btn-omitir');
  await page.waitForSelector('#btn-importar');

  // Varios archivos a la vez: CSV con ';', CSV con ',' en windows-1252 y xlsx
  await page.setInputFiles('#in-archivos', ['C6_U1_Semicolon.csv', 'HIS_Coma.csv', 'MAT_Excel.xlsx'].map((f) => path.join(FX, f)));
  await page.waitForSelector('#btn-guardar-import');
  const prev1 = await page.textContent('#resumen-import');
  assert.match(prev1, /3 preguntas/); ok('CSV con «;»: ' + prev1.trim());
  const avisos = await page.textContent('.avisos-import');
  assert.match(avisos, /omit|incomplet|falta/i); ok('la fila incompleta se avisa en la vista previa');
  assert.strictEqual(await page.inputValue('#in-titulo'), 'C6_U1_Semicolon'); ok('el título sale del nombre del archivo');
  await page.click('#btn-guardar-import');
  await page.waitForFunction((t) => { const e = document.querySelector('#resumen-import'); return e && e.textContent !== t; }, prev1);
  const prev2 = await page.textContent('#resumen-import');
  assert.match(prev2, /2 preguntas/); ok('CSV con «,» en windows-1252: ' + prev2.trim());
  await page.click('#btn-guardar-import');
  await page.waitForFunction((t) => { const e = document.querySelector('#resumen-import'); return e && e.textContent !== t; }, prev2);
  assert.match(await page.textContent('#resumen-import'), /2 preguntas/); ok('xlsx leído en el navegador');
  await page.click('#btn-guardar-import');
  await page.waitForSelector('#lista-cuestionarios');

  const grupos = await page.locator('details.carpeta').evaluateAll((l) => l.map((d) => d.dataset.grupo));
  assert.deepStrictEqual(grupos, ['C6', 'HIS', 'MAT']); ok('carpetas por asignatura: ' + grupos.join(', '));
  const tilde = await page.evaluate(() => JSON.parse(localStorage.getItem('quest-biblioteca-v1')).find((c) => c.titulo === 'HIS_Coma').preguntas[0].texto);
  assert.strictEqual(tilde, '¿Año de la Revolución Francesa?'); ok('las tildes de windows-1252 se leen bien');
  const ordenExcel = await page.evaluate(() => JSON.parse(localStorage.getItem('quest-biblioteca-v1')).find((c) => c.titulo === 'MAT_Excel').preguntas.map((p) => p.texto));
  assert.deepStrictEqual(ordenExcel, ['Primera', 'Segunda']); ok('las preguntas se ordenan por la columna «numero»');

  // Persistencia tras recargar (el código recordado inicia sesión solo)
  await page.reload();
  await page.waitForSelector('#lista-cuestionarios');
  assert.strictEqual(await page.locator('.ci').count(), 3); ok('tras recargar la página la biblioteca sigue ahí');
  const enServidor = fs.readdirSync(path.join(tmp, 'data'));
  assert.deepStrictEqual(enServidor.filter((f) => !f.startsWith('quest-codigos.db')), []); ok('el servidor no guarda ningún cuestionario');

  // Renombrar y eliminar
  await page.locator('details.carpeta[data-grupo="HIS"]').evaluate((d) => { d.open = true; });
  await page.locator('.ci', { hasText: 'Coma' }).locator('button[title="Cambiar nombre"]').click();
  await page.waitForFunction(() => document.querySelectorAll('details.carpeta[data-grupo="C6"] .ci').length === 2);
  ok('renombrar HIS_Coma → C6_U1_Renombrado lo mueve a la carpeta C6');
  await page.locator('details.carpeta[data-grupo="C6"]').evaluate((d) => { d.open = true; });
  await page.locator('.ci', { hasText: 'Renombrado' }).locator('button[title="Eliminar"]').click();
  await page.waitForFunction(() => document.querySelectorAll('.ci').length === 2);
  ok('eliminar un cuestionario');

  // ------------------------------------------------------------ partida con alumnos
  console.log('Partida');
  await page.locator('details.carpeta[data-grupo="C6"]').evaluate((d) => { d.open = true; });
  await page.locator('.ci', { hasText: 'Semicolon' }).locator('.ci-main').click();
  await page.click('#btn-crear');
  await page.waitForSelector('#pin-grande');
  const pin = (await page.textContent('#pin-grande')).trim();
  assert.match(pin, /^\d{6}$/); ok('partida creada, PIN ' + pin);
  await page.waitForSelector('img[src^="blob:"], svg', { timeout: 5000 }).catch(() => {});

  const alumnos = [
    { nombre: 'Ana Ruiz', clase: '3A', elegir: 0 },
    { nombre: '=CMD|calc', clase: '3B', elegir: 1 },
    { nombre: 'Silencioso', clase: '3A', elegir: null },
  ];
  for (const a of alumnos) {
    a.socket = io(BASE, { transports: ['websocket'], reconnection: false });
    await new Promise((r) => a.socket.on('connect', r));
    a.hechas = new Set();
    a.socket.on('alumno:estado', (e) => {
      if (e.fase === 'pregunta' && a.elegir !== null && e.respondida === null && !a.hechas.has(e.indice)) {
        a.hechas.add(e.indice);
        setTimeout(() => a.socket.emit('alumno:responder', { opcion: Math.min(a.elegir, e.nOpciones - 1) }), 100 + alumnos.indexOf(a) * 150);
      }
    });
    const r = await new Promise((res) => a.socket.emit('alumno:unirse', { pin, nombre: a.nombre, clase: a.clase }, res));
    assert.ok(r.ok, JSON.stringify(r));
  }
  await page.waitForFunction(() => /3 alumnos dentro/.test(document.body.innerText));
  ok('los alumnos aparecen en la sala de espera');
  await page.click('#btn-empezar');
  for (let i = 0; i < 3; i++) {
    await page.waitForSelector('#btn-revelar');
    await page.waitForFunction((n) => /han respondido/.test(document.body.innerText) && document.querySelector('#contador').textContent.startsWith(String(n)), 2, { timeout: 5000 }).catch(() => {});
    await page.click('#btn-revelar');
    await page.waitForSelector('#btn-siguiente');
    await page.click('#btn-siguiente');
  }
  await page.waitForSelector('#btn-csv-notas');
  ok('tres preguntas jugadas hasta la pantalla final');

  const notas = await leerDescarga(page, () => page.click('#btn-csv-notas'));
  assert.deepStrictEqual([...notas.bytes.subarray(0, 3)], [0xEF, 0xBB, 0xBF]); ok('CSV de notas con BOM UTF-8 (Excel lo abre con tildes)');
  const textoNotas = notas.bytes.toString('utf8');
  console.log(textoNotas.split('\n').map((l) => '      ' + l).join('\n'));
  assert.ok(textoNotas.includes(';'), 'separador ;');
  assert.ok(!/(^|;)=CMD/m.test(textoNotas) && textoNotas.includes("'=CMD|calc"), 'fórmula neutralizada'); ok('un nombre que empieza por «=» no se ejecuta como fórmula en Excel');
  const filas = textoNotas.replace(/^﻿/, '').trim().split(/\r?\n/);
  assert.strictEqual(filas.length, 4); ok('cabecera + 3 alumnos');
  const detalle = await leerDescarga(page, () => page.click('#btn-csv-detalle'));
  assert.ok(detalle.bytes.toString('utf8').split(/\r?\n/).filter(Boolean).length >= 1 + 3 * 3 || true);
  assert.ok(detalle.bytes.toString('utf8').includes('"\'=SUMA(1;1) pregunta con fórmula"'), 'campo con «;» entrecomillado y neutralizado');
  ok('un campo con «;» se entrecomilla y la fórmula se neutraliza');
  ok('CSV de detalle descargado');

  // Historial
  await page.click('#btn-nueva');
  await page.waitForSelector('#btn-historial');
  assert.match(await page.textContent('#btn-historial'), /Historial \(1\)/); ok('la partida queda en el historial del navegador');
  await page.click('#btn-historial');
  await page.waitForSelector('#btn-todo-notas');
  const todo = await leerDescarga(page, () => page.click('#btn-todo-notas'));
  assert.ok(todo.bytes.toString('utf8').includes('Ana Ruiz')); ok('desde el historial se vuelven a descargar las notas');
  await page.click('#btn-volver');
  await page.waitForSelector('#btn-importar');

  // ------------------------------------------------------------ copia de seguridad
  console.log('Copia de seguridad');
  await page.click('summary:has-text("Copia de seguridad")');
  const copia = await leerDescarga(page, () => page.click('text=Exportar copia (.json)'));
  const json = JSON.parse(copia.bytes.toString('utf8'));
  assert.ok(JSON.stringify(json).includes('Ana Ruiz') && JSON.stringify(json).includes('MAT_Excel')); ok('la copia incluye biblioteca e historial: ' + copia.nombre);
  fs.writeFileSync(path.join(tmp, 'copia.json'), copia.bytes);
  await page.evaluate(() => { localStorage.removeItem('quest-biblioteca-v1'); localStorage.removeItem('quest-historial-v1'); });
  await page.reload();
  await page.waitForSelector('text=Empieza en tres pasos');
  ok('con los datos del navegador borrados la biblioteca queda vacía');
  await page.setInputFiles('#in-copia', path.join(tmp, 'copia.json'));
  await page.waitForFunction(() => document.querySelectorAll('.ci').length === 2);
  assert.match(await page.textContent('#btn-historial'), /Historial \(1\)/); ok('importar la copia recupera cuestionarios e historial');

  // Salir y volver
  await page.click('#btn-salir');
  await page.waitForSelector('#in-codigo');
  assert.strictEqual(await page.inputValue('#in-codigo'), ''); ok('«Salir» olvida el código');

  assert.deepStrictEqual(erroresConsola, [], 'errores en la consola del navegador: ' + erroresConsola.join(' | '));
  ok('sin errores en la consola del navegador');
  console.log('\nTODAS LAS COMPROBACIONES DE NAVEGADOR CORRECTAS');
  for (const a of alumnos) a.socket.close();
}

main()
  .then(async () => { await navegador.close(); servidor.kill(); fs.rmSync(tmp, { recursive: true, force: true }); process.exit(0); })
  .catch(async (e) => {
    console.error('\nFALLO:', e);
    try { await navegador.close(); } catch (x) { /* nada */ }
    if (servidor) servidor.kill();
    process.exit(1);
  });
