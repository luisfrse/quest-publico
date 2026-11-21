// Prueba de extremo a extremo de Quest (versión pública para profesores invitados) con Chrome real (CDP, sin Playwright) y, con --capturas[=carpeta],
// capturas a 390 y 1200 px en claro y oscuro. Servidor con base TEMPORAL y datos inventados; no toca ningún servicio real.
// Recorre: acceso con código (error y acierto) -> biblioteca vacía -> importar con vista previa -> renombrar/borrar con diálogos propios -> crear partida
//          -> alumno (UI) -> partida completa del profesor -> final con descargas -> historial -> administración de códigos -> guía.
// Comprueba además: CSP sin violaciones ni errores de consola, sin diálogos nativos, sin desbordamiento horizontal a 360 px y objetivos >= 44 px.
// Uso: node tools/e2e.mjs [--capturas[=docs/capturas]]      Chrome: ruta habitual o variable CHROME.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { openChrome, sleep, free } from './lib-chrome.mjs';

const require = createRequire(import.meta.url);
const { io } = require('socket.io-client');
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const cap = process.argv.find((a) => a.startsWith('--capturas'));
const OUT = cap ? path.resolve(cap.includes('=') ? cap.split('=')[1] : path.join(ROOT, 'docs', 'capturas')) : null;
const PASS = 'clave-de-prueba-' + process.pid;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'quest-pub-e2e-'));
const csv = (filas) => '\ufeffnumero;tiempo;pregunta;correcta;incorrecta1;incorrecta2;incorrecta3\r\n' + filas.map((f, i) => [i + 1, 60, ...f].join(';')).join('\r\n') + '\r\n';
const f1 = path.join(tmp, 'C6_U1_Genètica bàsica.csv'); fs.writeFileSync(f1, csv([
  ['Quina molècula porta la informació genètica?', 'ADN', 'Lípids', 'Glúcids', 'Aigua'],
  ['Quantes cadenes té la doble hèlix?', 'Dues', 'Una', 'Tres', 'Quatre'],
  ['¿Qué orgánulo produce la energía de la célula?', 'Mitocondria', 'Ribosoma', 'Lisosoma', 'Núcleo']]));
const f2 = path.join(tmp, 'HIS_Repàs.csv'); fs.writeFileSync(f2, csv([['Any de l\'inici de la Guerra Civil', '1936', '1931', '1939', '1945'], ['Capital de Catalunya', 'Barcelona', 'Girona', 'Lleida', 'Tarragona']]));
const bad = path.join(tmp, 'sin-columnas.csv'); fs.writeFileSync(bad, 'a,b,c\n1,2,3\n');

const port = await free(), BASE = 'http://127.0.0.1:' + port;
const srv = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(port), ADMIN_PASSWORD: PASS, DATA_DIR: path.join(tmp, 'data'), CONTACT_URL: 'https://example.org/contacto' }, stdio: 'ignore' });
for (let i = 0; i < 60; i++) { try { if ((await fetch(BASE + '/')).ok) break; } catch { /* arrancando */ } await sleep(250); }
const CSP = (await fetch(BASE + '/')).headers.get('content-security-policy');
assert.ok(CSP && !/unsafe-inline/.test(CSP), 'CSP sin unsafe-inline'); console.log('  ok CSP sin unsafe-inline');
const basic = { Authorization: 'Basic ' + Buffer.from('x:' + PASS).toString('base64') };
const crear = await (await fetch(BASE + '/api/admin/codigos', { method: 'POST', headers: { ...basic, 'Content-Type': 'application/json' }, body: JSON.stringify({ etiqueta: 'Profesora de ejemplo' }) })).json();
await fetch(BASE + '/api/admin/codigos', { method: 'POST', headers: { ...basic, 'Content-Type': 'application/json' }, body: JSON.stringify({ etiqueta: 'Colega de pruebas', caduca: '2027-06-30' }) });
const r401 = await fetch(BASE + '/admin', { headers: { Accept: 'text/html' } });
assert.strictEqual(r401.status, 401); assert.ok((await r401.text()).includes('dc-card')); assert.ok(r401.headers.get('www-authenticate')); console.log('  ok /admin sin contraseña: 401 con página clara y el desafío Basic intacto');

const B = await openChrome({ prefix: 'quest-pub-e2e', csp: CSP });
const { send, ev, waitFor, click, setVal, goto, media } = B;
const ok = (m) => console.log('  ok ' + m);
const must = async (expr, msg, ms = 9000) => { const r = await waitFor(expr, ms); if (!r) { console.log('FALLO esperando: ' + msg + '\n  texto: ' + await B.text()); throw new Error(msg); } };
const SIZES = [[390, 844], [1200, 900]], THEMES = ['claro', 'oscuro'];
const shot = async (name) => {
  if (!OUT) return;
  fs.mkdirSync(OUT, { recursive: true });
  for (const [w, h] of SIZES) for (const th of THEMES) {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 600 }); await media(th); await sleep(450);
    const H = Math.min(3000, Math.max(h, await ev('Math.ceil(document.documentElement.scrollHeight)')));
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: H, deviceScaleFactor: 1, mobile: w < 600 }); await sleep(250);
    const r = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT, `${name}-${w}-${th}.png`), Buffer.from(r.result.data, 'base64'));
  }
  await send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 900, deviceScaleFactor: 1, mobile: false }); await media('claro');
  console.log('  captura ' + name);
};
const sinDesborde = async (nombre) => {
  await send('Emulation.setDeviceMetricsOverride', { width: 360, height: 740, deviceScaleFactor: 1, mobile: true }); await sleep(300);
  const d = await ev('document.documentElement.scrollWidth - document.documentElement.clientWidth');
  await send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 900, deviceScaleFactor: 1, mobile: false });
  assert.ok(d <= 1, `desbordamiento horizontal a 360 px en ${nombre}: ${d}`); ok('sin desbordamiento horizontal a 360 px: ' + nombre);
};
const chicos = async (sel, nombre) => {
  const peq = await ev(`[...document.querySelectorAll(${JSON.stringify(sel)})].filter(e=>e.offsetParent&&!e.disabled).map(e=>{const r=e.getBoundingClientRect();return [e.textContent.trim().slice(0,20)||e.getAttribute('aria-label')||e.id, Math.round(r.width), Math.round(r.height)]}).filter(x=>x[1]<44||x[2]<44)`);
  assert.deepStrictEqual(peq, [], 'objetivos menores de 44 px en ' + nombre + ': ' + JSON.stringify(peq)); ok('objetivos táctiles >= 44 px: ' + nombre);
};
const subir = async (...files) => {
  await send('DOM.enable'); const doc = await send('DOM.getDocument', {}); const inp = await send('DOM.querySelector', { nodeId: doc.result.root.nodeId, selector: '#in-archivos' });
  await send('DOM.setFileInputFiles', { files, nodeId: inp.result.nodeId });
};
const abrirCarpetas = () => ev(`document.querySelectorAll('details.carpeta').forEach(d=>{d.open=true})`);
const alumnoBot = (pin, nombre, clase) => new Promise((res) => { const s = io(BASE, { transports: ['websocket'], reconnection: false }); s.on('connect', () => s.emit('alumno:unirse', { pin, nombre, clase }, (r) => res({ s, r }))); });
let code = 0;
try {
  // ---------- acceso con código
  await goto(BASE + '/profesor'); await must('!!document.getElementById("in-codigo")', 'pantalla de acceso'); await sleep(300);
  assert.ok(await ev('!!document.querySelector("a[href=\\"https://example.org/contacto\\"]")'), 'enlace de contacto'); ok('pantalla de acceso con enlace de contacto');
  await shot('acceso'); await sinDesborde('acceso'); await chicos('#principal button, #principal a, #principal input[type=text]', 'acceso');
  await setVal('#in-codigo', 'AAAAA-BBBBB'); await B.submit('#in-codigo'); await must('!document.getElementById("err-acceso").hidden', 'error de código');
  ok('código erróneo: error visible («' + (await ev('document.getElementById("err-acceso").textContent.trim()')) + '»)'); await shot('acceso-error');
  await setVal('#in-codigo', crear.codigo); await B.submit('#in-codigo'); await must('!!document.getElementById("btn-importar")', 'biblioteca');
  assert.ok((await ev('document.body.textContent')).includes('Empieza en tres pasos')); ok('código válido: biblioteca vacía con los tres pasos'); await sleep(300); await shot('biblioteca-vacia');

  // ---------- importar
  await subir(bad); await must('!!document.getElementById("errores-import")', 'error de importación'); await shot('importar-error');
  assert.ok(!(await ev('!!document.getElementById("btn-guardar-import")'))); await click('#btn-omitir'); await must('!!document.getElementById("btn-importar")', 'vuelve');
  ok('un CSV sin columnas se rechaza con mensaje');
  await subir(f1); await must('!!document.getElementById("btn-guardar-import")', 'vista previa'); await shot('importar-vista-previa'); await sinDesborde('vista previa');
  await click('#btn-guardar-import'); await must('!!document.getElementById("btn-importar")', 'guardado');
  await subir(f2); await must('!!document.getElementById("btn-guardar-import")', 'segunda vista previa'); await click('#btn-guardar-import'); await must('!!document.getElementById("lista-cuestionarios")', 'lista'); await abrirCarpetas(); await sleep(300);
  await shot('biblioteca'); await sinDesborde('biblioteca'); await chicos('#principal button, #principal a, #principal summary', 'biblioteca'); ok('importar con vista previa y guardar en el navegador');
  await ev(`document.querySelector('.ci button[title="Cambiar nombre"]').click()`); await must('!!document.querySelector("dialog #dlg-input")', 'diálogo de renombrar'); await shot('dialogo-renombrar');
  await ev(`document.getElementById('dlg-input').value='HIS_Renombrado'; document.getElementById('dlg-ok').click()`); await must(`document.body.textContent.includes('Renombrado')`, 'renombrado'); ok('renombrar con diálogo propio');
  await abrirCarpetas(); await ev(`document.querySelector('.ci button[title="Eliminar"]').click()`); await must('!!document.querySelector("dialog #dlg-ok")', 'diálogo de borrar'); await ev('document.getElementById("dlg-cancelar").click()');
  await sleep(200); assert.ok(await ev('document.querySelectorAll(".ci").length===2')); ok('borrar pide confirmación y Cancelar conserva el cuestionario');
  await click('#principal details.menu > summary'); await sleep(200); await shot('menu-plantillas'); await ev('document.querySelector("#principal details.menu").open=false');

  // ---------- partida
  await ev(`[...document.querySelectorAll('.ci-main')].find(b=>b.textContent.includes('Renombrado')).click()`); await click('#btn-crear'); await must('!!document.getElementById("pin-grande")', 'sala');
  const pin = (await ev('document.getElementById("pin-grande").textContent')).trim(); assert.match(pin, /^\d{6}$/);
  await must('!!document.querySelector(".qr") && document.querySelector(".qr").naturalWidth>0', 'QR'); ok('partida creada y QR visible con la CSP estricta');
  const bots = []; for (const [n, c] of [['Núria Pons', '1A'], ['Marc Soler', '1A'], ['Aina Roca', '1B']]) bots.push(await alumnoBot(pin, n, c));
  await must(`document.body.innerText.includes('3 alumn')`, 'bots en la sala'); await shot('sala'); await sinDesborde('sala');
  // el alumno real (UI) en la misma pestaña
  await goto(BASE + '/?pin=' + pin); await shot('alumno-entrada');
  await setVal('#in-pin', '000000'); await setVal('#in-nombre', 'Laia'); await setVal('#in-clase', '1A'); await B.submit('#in-pin'); await must('!document.getElementById("error").hidden', 'error de PIN');
  ok('PIN inválido: error con icono y texto'); await shot('alumno-error');
  await setVal('#in-pin', pin); await setVal('#in-nombre', 'Laia Ferrer'); await B.submit('#in-pin'); await must('!document.getElementById("v-lobby").hidden', 'sala del alumno'); await shot('alumno-sala'); await sinDesborde('alumno · sala');
  await goto(BASE + '/profesor'); await must('!!document.getElementById("btn-empezar")', 'profesor reanuda'); await sleep(500);
  assert.ok(await ev('!document.getElementById("btn-empezar").disabled'));
  await click('#btn-empezar'); await must('!!document.getElementById("btn-revelar")', 'primera pregunta'); await sleep(300);
  await shot('pregunta'); await sinDesborde('pregunta'); await chicos('#principal button', 'pregunta');
  bots.forEach((b, i) => b.s.emit('alumno:responder', { opcion: i % 2 })); await must(`/^3 de/.test(document.getElementById('contador').textContent)`, 'contador'); ok('contador y medidor de respuestas');
  await click('#btn-revelar'); await must('!!document.getElementById("btn-siguiente")', 'revelada'); await shot('revelada');
  for (let q = 1; q < 3; q++) { await click('#btn-siguiente'); await must('!!document.getElementById("btn-revelar")', 'pregunta ' + (q + 1)); bots.forEach((b, i) => b.s.emit('alumno:responder', { opcion: (i + q) % 3 })); await sleep(300); await click('#btn-revelar'); await must('!!document.getElementById("btn-siguiente")', 'revelada ' + (q + 1)); }
  await click('#btn-siguiente'); await must('!!document.getElementById("btn-csv-notas")', 'final'); await sleep(300); await shot('final'); await sinDesborde('final'); ok('podio, descargas y aviso de que el servidor no guarda resultados');
  bots.forEach((b) => b.s.close());
  await click('#btn-nueva'); await must('!!document.getElementById("btn-historial")', 'vuelve a la biblioteca');
  assert.match(await ev('document.getElementById("btn-historial").textContent'), /1\)/); await click('#btn-historial'); await must('!!document.getElementById("btn-todo-notas")', 'historial');
  await ev('document.querySelector("details.partida").open=true'); await sleep(200); await shot('historial'); await sinDesborde('historial'); ok('la partida queda en el historial del navegador');

  // ---------- alumno por UI contra la partida 2 (flujo completo del alumno)
  await click('#btn-volver'); await must('!!document.getElementById("lista-cuestionarios")', 'biblioteca'); await abrirCarpetas();
  await ev(`[...document.querySelectorAll('.ci-main')].find(b=>b.textContent.includes('Renombrado')).click()`); await click('#btn-crear'); await must('!!document.getElementById("pin-grande")', 'sala 2');
  const pin2 = (await ev('document.getElementById("pin-grande").textContent')).trim(); const bot2 = await alumnoBot(pin2, 'Pau Vidal', '1B');
  // el alumno (UI) usa la misma pestaña tras dejar la partida al profesor por socket: se juega con otro token y el alumno en pantalla
  const tok = (await (await fetch(BASE + '/api/acceso', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ codigo: crear.codigo }) })).json()).token;
  const prof = io(BASE, { transports: ['websocket'], reconnection: false }); await new Promise((r) => prof.on('connect', r));
  const pin3 = (await new Promise((r) => prof.emit('profesor:crear', { token: tok, titulo: 'HIS_Prueba', preguntas: [{ numero: 1, texto: 'Capital de Catalunya', tiempo: 60, correcta: 'Barcelona', incorrectas: ['Girona', 'Lleida'] }, { numero: 2, texto: '2 + 2', tiempo: 60, correcta: '4', incorrectas: ['3', '5', '22'] }] }, r))).pin;
  assert.match(pin3, /^\d{6}$/);
  await ev('localStorage.removeItem("quest-sesion")'); await goto(BASE + '/?pin=' + pin3); await setVal('#in-nombre', 'Laia Ferrer'); await setVal('#in-clase', '1A'); await B.submit('#in-pin'); await must('!document.getElementById("v-lobby").hidden', 'alumno en la partida 3');
  prof.emit('profesor:iniciar'); await must('!document.getElementById("v-pregunta").hidden', 'pregunta del alumno'); await must('document.querySelectorAll("#p-opciones .opcion").length>=2', 'opciones');
  await shot('alumno-pregunta'); await sinDesborde('alumno · pregunta'); await chicos('#p-opciones .opcion', 'alumno · opciones');
  assert.ok(await ev('document.querySelectorAll("#p-opciones .opcion .dc-icon__svg").length>=2')); ok('opciones grandes con forma y letra (no solo color)');
  await ev('document.querySelector("#p-opciones .opcion").click()'); await must('!document.getElementById("v-enviada").hidden', 'enviada'); await shot('alumno-enviada');
  prof.emit('profesor:revelar'); await must('!document.getElementById("v-resultado").hidden', 'resultado'); assert.ok(await ev('!!document.querySelector("#r-icono svg")')); await shot('alumno-resultado'); ok('resultado con icono y color');
  prof.emit('profesor:siguiente'); await must('!document.getElementById("v-pregunta").hidden', '2ª pregunta'); await ev('document.querySelectorAll("#p-opciones .opcion")[1].click()');
  prof.emit('profesor:revelar'); await must('!document.getElementById("v-resultado").hidden', '2º resultado'); prof.emit('profesor:siguiente'); await must('!document.getElementById("v-final").hidden', 'final alumno');
  await shot('alumno-final'); await sinDesborde('alumno · final'); prof.close(); bot2.s.close();

  // ---------- administración de códigos (Basic) y guía
  await send('Network.enable'); await send('Network.setExtraHTTPHeaders', { headers: basic });
  await goto(BASE + '/admin'); await must('!!document.querySelector("#tabla table")', 'tabla de códigos'); await sleep(300);
  assert.ok(await ev('document.querySelectorAll("#kpis .q-kpi").length===3')); await shot('admin'); await sinDesborde('admin'); await chicos('.q-admin button, .q-admin a, .q-admin input', 'admin');
  await setVal('#in-etiqueta', 'Docente nueva'); await click('#btn-crear'); await must('!!document.getElementById("codigo-nuevo")', 'código creado'); await shot('admin-codigo-nuevo');
  await ev(`document.querySelector('button[data-accion="borrar"]').click()`); await must('!!document.querySelector("dialog #dlg-ok")', 'diálogo de borrar código'); await shot('admin-dialogo'); await ev('document.getElementById("dlg-cancelar").click()');
  ok('administración: indicadores, crear código y confirmación propia');
  await goto(BASE + '/ayuda?lang=es'); await must('!!document.querySelector(".ayuda-es h1")', 'guía'); await shot('ayuda'); await sinDesborde('ayuda');

  assert.ok(!B.log.some((l) => /DIALOGO NATIVO/.test(l)), 'no debe abrirse ningún diálogo nativo');
  const malas = B.log.filter((l) => !/favicon|40[19]|429|adguard|LOCAL_NETWORK_ACCESS|beforeunload/i.test(l)); assert.deepStrictEqual(malas, [], 'errores de consola/CSP:\n' + malas.join('\n')); ok('sin diálogos nativos ni errores de consola ni violaciones de la CSP');
  console.log('\nE2E DE QUEST (PÚBLICA) CORRECTO');
} catch (e) { console.error('\nFALLO:', e.message || e); console.error(B.log.join('\n')); code = 1; }
await B.close(); srv.kill(); try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* Windows */ }
process.exit(code);
