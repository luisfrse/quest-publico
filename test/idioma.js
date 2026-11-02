'use strict';
// Prueba de navegador del selector de idioma (català / castellano):
// idioma por defecto, selector en todas las pantallas, recuerdo de la elección, cambio en mitad de la partida
// SIN perder el estado y ausencia de textos sin traducir (claves a la vista, textos del otro idioma).
const { spawn } = require('child_process');
const { io } = require('socket.io-client');
const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/npm-tools/node_modules/playwright')); }
const I18N = require('../public/i18n.js');

const PORT = 3133;
const BASE = `http://127.0.0.1:${PORT}`;
const CLAVE = 'clave-idioma';
const ADMIN = 'Basic ' + Buffer.from('admin:' + CLAVE).toString('base64');
const FX = path.join(__dirname, 'fixtures');
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const ok = (m) => console.log('  ✓ ' + m);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'quest-idioma-'));
let servidor; let navegador;

// Frases que solo existen en un idioma (sin variables): si aparecen en la pantalla del otro idioma, falta traducir
function frasesPropias() {
  const ca = I18N.dict.ca; const es = I18N.dict.es;
  const otroCa = new Set(Object.values(ca)); const otroEs = new Set(Object.values(es));
  const soloEs = []; const soloCa = [];
  for (const k of Object.keys(ca)) {
    const a = ca[k]; const b = es[k];
    if (a === b || k.startsWith('csv.')) continue;
    const util = (x) => x.length >= 9 && !/[{}]/.test(x) && x.trim() === x;
    if (util(b) && !otroCa.has(b) && !a.includes(b)) soloEs.push(b);
    if (util(a) && !otroEs.has(a) && !b.includes(a)) soloCa.push(a);
  }
  return { soloEs, soloCa };
}
const PROPIAS = frasesPropias();

async function textos(page) {
  return page.evaluate(() => {
    const t = [document.body.innerText, document.title];
    for (const e of document.querySelectorAll('[placeholder],[aria-label],[title],[alt]')) {
      if (e.offsetParent === null && e.tagName !== 'BODY') continue;
      for (const a of ['placeholder', 'aria-label', 'title', 'alt']) if (e.getAttribute(a)) t.push(e.getAttribute(a));
    }
    return t.join('\n');
  });
}

// Comprueba que la pantalla actual no enseña claves, marcadores {x} ni frases del otro idioma
async function sinSinTraducir(page, pantalla) {
  const lang = await page.evaluate(() => document.documentElement.lang);
  const t = await textos(page);
  const limpio = t.replace(/https?:\/\/\S+/g, '').replace(/\S+\.(csv|xlsx|json|pdf|xls)\b/gi, '');
  assert.ok(!/\b(?:p|a|e|r|ad|ac|w|imp|bk|ay|csv)\.[a-z_]{3,}\b/.test(limpio), `clave sin traducir a la vista en ${pantalla} (${lang})`);
  assert.ok(!/\{[a-z]+\}/.test(t), `marcador {x} a la vista en ${pantalla} (${lang})`);
  const ajenas = lang === 'ca' ? PROPIAS.soloEs : PROPIAS.soloCa;
  const mal = ajenas.filter((f) => t.includes(f));
  assert.deepStrictEqual(mal, [], `textos del otro idioma en ${pantalla} (${lang})`);
}

async function enAmbos(page, pantalla) {
  for (const l of ['ca', 'es']) {
    await page.click(`.selector-idioma button[data-lang="${l}"]`);
    await page.waitForFunction((x) => document.documentElement.lang === x, l);
    await sinSinTraducir(page, pantalla);
  }
}

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

async function main() {
  await arrancar();
  const cod = await (await fetch(BASE + '/api/admin/codigos', { method: 'POST', headers: { Authorization: ADMIN, 'Content-Type': 'application/json' }, body: JSON.stringify({ etiqueta: 'Prueba idioma' }) })).json();
  navegador = await chromium.launch();

  // ------------------------------------------------------------ idioma por defecto
  console.log('Idioma por defecto');
  for (const [locale, esperado] of [['es-ES', 'es'], ['es-MX', 'es'], ['en-US', 'ca'], ['fr-FR', 'ca'], ['ca-ES', 'ca']]) {
    const c = await navegador.newContext({ locale });
    const p = await c.newPage();
    await p.goto(BASE + '/');
    assert.strictEqual(await p.evaluate(() => document.documentElement.lang), esperado, locale);
    await c.close();
  }
  ok('navegador es-ES/es-MX → castellano; en-US/fr-FR/ca-ES → catalán');

  // ------------------------------------------------------------ alumno
  console.log('Alumno');
  const ctx = await navegador.newContext({ locale: 'en-US', acceptDownloads: true, viewport: { width: 1200, height: 800 }, httpCredentials: { username: 'admin', password: CLAVE } });
  const page = await ctx.newPage();
  const errores = [];
  page.on('pageerror', (e) => errores.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/40[19]|429/.test(m.text())) errores.push('console: ' + m.text()); });
  page.on('dialog', (d) => d.accept());

  await page.goto(BASE + '/');
  assert.strictEqual(await page.locator('.selector-idioma button').count(), 2);
  assert.strictEqual((await page.locator('.selector-idioma button').allTextContents()).join('|'), 'CA|ES'); ok('selector visible CA | ES en la pantalla de entrada');
  assert.strictEqual(await page.getAttribute('.selector-idioma button[data-lang="ca"]', 'aria-pressed'), 'true');
  assert.ok(await page.locator('.selector-idioma button.activo[data-lang="ca"]').count()); ok('el idioma activo está resaltado');
  assert.strictEqual((await page.textContent('#btn-entrar')).trim(), 'Entra');
  await page.evaluate(() => { window.__marca = 'misma-pagina'; });
  await page.fill('#in-pin', '123'); await page.fill('#in-nombre', 'Núria Pons');
  await page.click('.selector-idioma button[data-lang="es"]');
  assert.strictEqual((await page.textContent('#btn-entrar')).trim(), 'Entrar'); ok('al pulsar ES la pantalla cambia a castellano');
  assert.strictEqual(await page.evaluate(() => document.documentElement.lang), 'es');
  assert.strictEqual(await page.getAttribute('#in-clase', 'placeholder'), 'Ej.: 1A, 2B…'); ok('también cambian los placeholders');
  assert.strictEqual(await page.inputValue('#in-pin'), '123');
  assert.strictEqual(await page.inputValue('#in-nombre'), 'Núria Pons');
  assert.strictEqual(await page.evaluate(() => window.__marca), 'misma-pagina'); ok('lo escrito en el formulario se conserva y la página no se recarga');
  assert.strictEqual(await page.evaluate(() => localStorage.getItem('quest-lang')), 'es');
  await page.reload();
  assert.strictEqual(await page.evaluate(() => document.documentElement.lang), 'es'); ok('el idioma elegido se recuerda tras recargar (localStorage)');
  await page.goto(BASE + '/profesor');
  assert.strictEqual(await page.evaluate(() => document.documentElement.lang), 'es'); ok('y se mantiene al ir a otras pantallas');
  await page.goto(BASE + '/');
  await enAmbos(page, 'entrada del alumno');
  // error de PIN traducido y retraducido al cambiar
  await page.fill('#in-pin', '000000'); await page.fill('#in-nombre', 'X'); await page.fill('#in-clase', 'Y');
  await page.click('#btn-entrar');
  await page.waitForSelector('#error:not([hidden])');
  await page.click('.selector-idioma button[data-lang="es"]');
  assert.strictEqual((await page.textContent('#error')).trim(), 'Código no válido o partida terminada.');
  await page.click('.selector-idioma button[data-lang="ca"]');
  assert.strictEqual((await page.textContent('#error')).trim(), 'Codi no vàlid o partida acabada.'); ok('el error del servidor (código) se traduce y se retraduce al cambiar de idioma');

  // ------------------------------------------------------------ profesor: acceso
  console.log('Profesor');
  await page.goto(BASE + '/profesor');
  await page.waitForSelector('#in-codigo');
  await page.click('.selector-idioma button[data-lang="ca"]');
  await enAmbos(page, 'acceso del profesor');
  await page.fill('#in-codigo', 'AAAAA-BBBBB');
  await page.click('#btn-acceso');
  await page.waitForSelector('#err-acceso:not([hidden])');
  await page.click('.selector-idioma button[data-lang="ca"]');
  assert.strictEqual((await page.textContent('#err-acceso')).trim(), 'Codi no vàlid, revocat o caducat.');
  await page.click('.selector-idioma button[data-lang="es"]');
  assert.strictEqual((await page.textContent('#err-acceso')).trim(), 'Código no válido, revocado o caducado.'); ok('acceso: error traducido en los dos idiomas');
  await page.fill('#in-codigo', cod.codigo);
  await page.click('#btn-acceso');
  await page.waitForSelector('#btn-importar');
  await page.click('.selector-idioma button[data-lang="ca"]');
  await enAmbos(page, 'biblioteca vacía');

  // importar con vista previa
  await page.setInputFiles('#in-archivos', [path.join(FX, 'C6_U1_Semicolon.csv'), path.join(FX, 'viejo.xls')]);
  await page.waitForSelector('#btn-guardar-import');
  await page.click('.selector-idioma button[data-lang="ca"]');
  await page.fill('#in-titulo', 'C6_U1_Idioma');
  await page.evaluate(() => { window.__marca = 'vista-previa'; });
  assert.match(await page.textContent('#resumen-import'), /3 preguntes vàlides/);
  await page.click('.selector-idioma button[data-lang="es"]');
  assert.match(await page.textContent('#resumen-import'), /3 preguntas válidas/);
  assert.strictEqual(await page.inputValue('#in-titulo'), 'C6_U1_Idioma');
  assert.strictEqual(await page.evaluate(() => window.__marca), 'vista-previa'); ok('vista previa: cambia de idioma conservando el nombre escrito');
  assert.match(await page.textContent('.avisos-import'), /Fila 5: falta la pregunta/);
  await page.click('.selector-idioma button[data-lang="ca"]');
  assert.match(await page.textContent('.avisos-import'), /Fila 5: falta l'enunciat/); ok('los avisos del lector se traducen');
  await enAmbos(page, 'vista previa de importación');
  await page.click('#btn-guardar-import');
  await page.waitForSelector('#err-1, #errores-import');
  assert.match(await page.textContent('#errores-import'), /xls/);
  await page.click('.selector-idioma button[data-lang="ca"]');
  assert.match(await page.textContent('#errores-import'), /\.xls antic/); 
  await page.click('.selector-idioma button[data-lang="es"]');
  assert.match(await page.textContent('#errores-import'), /\.xls antiguo/); ok('los errores del lector (archivo .xls) se traducen');
  await enAmbos(page, 'error de importación');
  await page.click('#btn-omitir');
  await page.waitForSelector('#lista-cuestionarios');
  await page.click('.selector-idioma button[data-lang="ca"]');
  assert.match(await page.textContent('#lista-cuestionarios'), /1 qüestionari/);
  await page.click('.selector-idioma button[data-lang="es"]');
  assert.match(await page.textContent('#lista-cuestionarios'), /1 cuestionario/); ok('biblioteca: singular/plural y nombres de carpeta según el idioma');
  await enAmbos(page, 'biblioteca');

  // ------------------------------------------------------------ partida: cambio de idioma en mitad del juego
  console.log('Partida (cambio de idioma sin perder el estado)');
  await page.locator('details.carpeta[data-grupo="C6"]').evaluate((d) => { d.open = true; });
  await page.locator('.ci', { hasText: 'Idioma' }).locator('.ci-main').click();
  await page.click('#btn-crear');
  await page.waitForSelector('#pin-grande');
  const pin = (await page.textContent('#pin-grande')).trim();
  await page.click('.selector-idioma button[data-lang="ca"]');
  await enAmbos(page, 'sala de espera (profesor)');

  // alumno real en otra pestaña del mismo navegador (comparte el idioma elegido)
  const alumno = await ctx.newPage();
  await alumno.goto(BASE + '/');
  await alumno.fill('#in-pin', pin); await alumno.fill('#in-nombre', 'Núria'); await alumno.fill('#in-clase', '1A');
  await alumno.click('#btn-entrar');
  await alumno.waitForSelector('#v-lobby:not([hidden])');
  assert.match(await alumno.textContent('#lobby-msg'), /Ja ets dins|Estás dentro/);
  await alumno.click('.selector-idioma button[data-lang="ca"]');
  assert.strictEqual((await alumno.textContent('#lobby-msg')).trim().startsWith('Ja ets dins, Núria!'), true);
  await alumno.click('.selector-idioma button[data-lang="es"]');
  assert.strictEqual((await alumno.textContent('#lobby-msg')).trim().startsWith('¡Estás dentro, Núria!'), true); ok('alumno en la sala de espera: mensaje con su nombre en los dos idiomas');
  await sinSinTraducir(alumno, 'sala de espera (alumno)');
  // un segundo alumno que no responde, para que la pregunta no se revele sola
  const mudo = io(BASE, { transports: ['websocket'], reconnection: false });
  await new Promise((r) => mudo.on('connect', r));
  assert.ok((await new Promise((r) => mudo.emit('alumno:unirse', { pin, nombre: 'Mut', clase: '1A' }, r))).ok);
  await page.waitForFunction(() => /2 alumn/.test(document.body.innerText));
  await page.click('.selector-idioma button[data-lang="ca"]');
  await page.click('#btn-empezar');
  await page.waitForSelector('#btn-revelar');
  await page.evaluate(() => { window.__marca = 'en-partida'; window.__tempo = document.querySelector('#temporizador'); });
  const textoPregunta = await page.textContent('.enunciado');
  assert.match(await page.textContent('.estado-pregunta'), /Pregunta 1 de 3/);

  // alumno: pantalla de pregunta y respuesta
  await alumno.waitForSelector('#v-pregunta:not([hidden])');
  await alumno.click('#p-opciones button >> nth=0');
  await alumno.waitForSelector('#v-enviada:not([hidden])');
  await sinSinTraducir(alumno, 'respuesta enviada (alumno)');
  await page.waitForFunction(() => /^1 de 2/.test(document.querySelector('#contador').textContent));
  assert.strictEqual((await page.textContent('#contador')).trim(), '1 de 2 han respost');
  await page.click('.selector-idioma button[data-lang="es"]');
  assert.strictEqual((await page.textContent('#contador')).trim(), '1 de 2 han respondido');
  assert.strictEqual(await page.evaluate(() => window.__marca), 'en-partida');
  assert.strictEqual(await page.evaluate(() => window.__tempo === document.querySelector('#temporizador')), true);
  assert.strictEqual(await page.textContent('.enunciado'), textoPregunta);
  assert.match(await page.textContent('#lat-titulo'), /Ranking/);
  assert.match(await page.textContent('.estado-pregunta'), /Pregunta 1 de 3/);
  ok('profesor en plena pregunta: cambia el idioma sin recargar, sin repintar el cronómetro y sin perder la pregunta');
  await page.click('.selector-idioma button[data-lang="ca"]');
  assert.match(await page.textContent('#lat-titulo'), /Rànquing/);
  await enAmbos(page, 'pregunta (profesor)');

  await page.click('#btn-revelar');
  await page.waitForSelector('#btn-siguiente');
  await alumno.waitForSelector('#v-resultado:not([hidden])');
  const titRes = (await alumno.textContent('#r-titulo')).trim();
  assert.ok(['Correcte!', 'Incorrecte', '¡Correcto!', 'Incorrecto'].includes(titRes), titRes);
  await alumno.click('.selector-idioma button[data-lang="ca"]');
  const rCa = (await alumno.textContent('#r-titulo')).trim();
  await alumno.click('.selector-idioma button[data-lang="es"]');
  const rEs = (await alumno.textContent('#r-titulo')).trim();
  assert.notStrictEqual(rCa, rEs); assert.ok(await alumno.locator('#v-resultado:not([hidden])').count());
  ok('alumno en la pantalla de resultado: «' + rCa + '» ↔ «' + rEs + '»');
  await enAmbos(page, 'pregunta revelada (profesor)');
  await sinSinTraducir(alumno, 'resultado (alumno)');
  for (let i = 0; i < 2; i++) {
    await page.click('#btn-siguiente');
    await page.waitForSelector('#btn-revelar');
    await page.click('#btn-revelar');
    await page.waitForSelector('#btn-siguiente');
  }
  await page.click('#btn-siguiente');
  await page.waitForSelector('#btn-csv-notas');
  await alumno.waitForSelector('#v-final:not([hidden])');
  await alumno.click('.selector-idioma button[data-lang="ca"]');
  assert.match(await alumno.textContent('#f-pos'), /Has quedat en la posició \d de 2/);
  await alumno.click('.selector-idioma button[data-lang="es"]');
  assert.match(await alumno.textContent('#f-pos'), /Has quedado \dº de 2/); ok('alumno en la pantalla final: posición traducida');
  await sinSinTraducir(alumno, 'final (alumno)');
  await page.click('.selector-idioma button[data-lang="ca"]');
  await enAmbos(page, 'pantalla final (profesor)');

  // CSV según el idioma del selector
  await page.click('.selector-idioma button[data-lang="ca"]');
  const [d1] = await Promise.all([page.waitForEvent('download'), page.click('#btn-csv-notas')]);
  const csvCa = fs.readFileSync(await d1.path(), 'utf8').replace('﻿', '');
  assert.ok(csvCa.startsWith('data;nom;classe;qüestionari;errors;puntuació total;temps total (s)'), csvCa.split('\n')[0]);
  await page.click('.selector-idioma button[data-lang="es"]');
  const [d2] = await Promise.all([page.waitForEvent('download'), page.click('#btn-csv-detalle')]);
  const csvEs = fs.readFileSync(await d2.path(), 'utf8').replace('﻿', '');
  assert.ok(csvEs.startsWith('fecha;nombre;clase;cuestionario;pregunta nº;pregunta;respuesta del alumno'), csvEs.split('\n')[0]);
  ok('los CSV salen con las cabeceras del idioma elegido');

  // historial
  mudo.close();
  await page.click('#btn-nueva');
  await page.waitForSelector('#btn-historial');
  await enAmbos(page, 'biblioteca (tras la partida)');
  await page.click('#btn-historial');
  await page.waitForSelector('#btn-volver');
  await page.locator('details.partida summary').click();
  await enAmbos(page, 'historial');
  await page.click('.selector-idioma button[data-lang="ca"]');
  assert.match(await page.textContent('details.partida summary small'), /2 alumnes/);
  await page.click('.selector-idioma button[data-lang="es"]');
  assert.match(await page.textContent('details.partida summary small'), /2 alumnos/); ok('historial: resumen según el idioma');

  // ------------------------------------------------------------ admin y ayuda
  console.log('Administración y ayuda');
  await page.goto(BASE + '/admin');
  await page.waitForSelector('#tabla table');
  await page.click('.selector-idioma button[data-lang="ca"]');
  assert.match(await page.textContent('.cab h1'), /Codis d'invitació/);
  await enAmbos(page, 'administración de códigos');
  assert.match(await page.textContent('.cab h1'), /Códigos de invitación/); ok('/admin: selector y textos en los dos idiomas');
  await page.click('.selector-idioma button[data-lang="ca"]');
  const textoBoton = (await page.textContent('#btn-crear')).trim(); assert.strictEqual(textoBoton, 'Crea el codi');

  for (const l of ['ca', 'es']) {
    const r = await fetch(BASE + `/Guia-Quest-${l}.pdf`);
    assert.strictEqual(r.status, 200); assert.strictEqual((await r.arrayBuffer()).byteLength > 5000, true);
  }
  ok('Guia-Quest-ca.pdf y Guia-Quest-es.pdf se sirven');
  const c2 = await navegador.newContext({ locale: 'en-US', viewport: { width: 1000, height: 900 } });
  const ay = await c2.newPage();
  await ay.goto(BASE + '/ayuda?lang=ca');
  assert.ok(await ay.isVisible('.ayuda-ca h1')); assert.ok(!(await ay.isVisible('.ayuda-es h1')));
  assert.match(await ay.textContent('.ayuda-ca h1'), /Guia ràpida per a professors/);
  assert.strictEqual(await ay.getAttribute('.ayuda-ca a[data-pdf]', 'href'), '/Guia-Quest-ca.pdf');
  await ay.goto(BASE + '/ayuda?lang=es');
  assert.ok(await ay.isVisible('.ayuda-es h1')); assert.ok(!(await ay.isVisible('.ayuda-ca h1')));
  assert.strictEqual(await ay.getAttribute('.ayuda-es a[data-pdf]', 'href'), '/Guia-Quest-es.pdf');
  ok('/ayuda?lang=ca y ?lang=es muestran la guía en su idioma, con su PDF');
  await ay.goto(BASE + '/ayuda');
  assert.ok(await ay.isVisible('.ayuda-ca h1'));
  await ay.click('.selector-idioma button[data-lang="es"]');
  assert.ok(await ay.isVisible('.ayuda-es h1')); assert.ok(!(await ay.isVisible('.ayuda-ca h1')));
  assert.strictEqual(await ay.title(), 'Quest · Guía para profesores'); ok('/ayuda tiene selector y cambia de idioma (también el título de la pestaña)');
  await enAmbos(ay, 'ayuda');
  await c2.close();

  assert.deepStrictEqual(errores, [], errores.join('\n')); ok('sin errores en la consola del navegador');
  console.log('\nTODAS LAS COMPROBACIONES DE IDIOMA CORRECTAS');
}

main()
  .then(async () => { await navegador.close(); servidor.kill(); fs.rmSync(tmp, { recursive: true, force: true }); process.exit(0); })
  .catch(async (e) => {
    console.error('\nFALLO:', e);
    try { await navegador.close(); } catch {}
    if (servidor) servidor.kill();
    process.exit(1);
  });
