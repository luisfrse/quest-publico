'use strict';
// Comprobaciones del diccionario compartido (public/i18n.js): mismas claves en ca y es, mismos marcadores, respaldo y plurales.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const I18N = require('../public/i18n.js');
const { ca, es } = I18N.dict;
const ok = (m) => console.log('  ✓ ' + m);

assert.deepStrictEqual(I18N.langs, ['ca', 'es']); ok('idiomas: ca y es');
const kc = Object.keys(ca).sort(); const ke = Object.keys(es).sort();
assert.deepStrictEqual(kc.filter((k) => !(k in es)), [], 'claves que faltan en castellano');
assert.deepStrictEqual(ke.filter((k) => !(k in ca)), [], 'claves que faltan en catalán');
ok(kc.length + ' claves, las mismas en los dos idiomas');
const marcadores = (s) => (s.match(/\{\w+\}/g) || []).sort().join(',');
for (const k of kc) {
  assert.ok(ca[k] !== '' && es[k] !== '', 'texto vacío en ' + k);
  assert.strictEqual(marcadores(ca[k]), marcadores(es[k]), 'marcadores distintos en ' + k);
}
ok('ningún texto vacío y los mismos marcadores {x} en los dos idiomas');
// los plurales #1 tienen su forma general
for (const k of kc.filter((x) => x.endsWith('#1'))) assert.ok(k.slice(0, -2) in ca, 'plural sin forma general: ' + k);
ok('cada forma singular (#1) tiene su forma general');
// Traducciones realmente distintas (no se ha dejado el castellano en el catalán): la inmensa mayoría debe diferir
const iguales = kc.filter((k) => ca[k] === es[k] && ca[k].length > 12 && !k.startsWith('imp.error') && !k.startsWith('csv.'));
assert.ok(iguales.length < 15, 'demasiados textos idénticos en ca y es: ' + iguales.join(', '));
ok('el catalán no es una copia del castellano (' + iguales.length + ' textos largos idénticos)');
// Calcos habituales del castellano que no deben aparecer en catalán
const calcos = [/\bsolament\b/, /\bhabitacions\b/, /\bcontrasenya\b.*\bclave\b/, /\bsiguiente\b/, /\bcuestionari\b/, /\bpregunta[s]? mas\b/i, /\bdonçs\b/, /\bpero\b/, /\bpuntuacion\b/];
for (const k of kc) for (const r of calcos) assert.ok(!r.test(ca[k]), 'posible calco en ' + k + ': ' + ca[k]);
ok('sin calcos evidentes ni restos de castellano en el diccionario catalán');
// Motor: respaldo, plurales, variables
assert.strictEqual(I18N.tl('es', 'clave.inexistente'), 'clave.inexistente'); ok('clave inexistente → se devuelve la clave');
assert.strictEqual(I18N.tl('es', 'p.n_dentro', { n: 1 }), '1 alumno dentro');
assert.strictEqual(I18N.tl('ca', 'p.n_dentro', { n: 2 }), '2 alumnes dins');
assert.strictEqual(I18N.tl('ca', 'p.n_dentro', { n: 1 }), '1 alumne dins'); ok('plurales {n}');
assert.strictEqual(I18N.tl('ca', 'a.dentro', { n: 'Ana' }), 'Ja ets dins, Ana!');
assert.strictEqual(I18N.tl('fr', 'a.dentro', { n: 'Ana' }), 'Ja ets dins, Ana!'); ok('idioma desconocido → respaldo en catalán');
assert.strictEqual(I18N.t('a.entrar'), 'Entra'); ok('sin navegador, I18N.t usa catalán');
console.log('\nTODAS LAS COMPROBACIONES DEL DICCIONARIO CORRECTAS');
