// Copia («vendoriza») el diseño común en public/dc/ desde el repo hermano ../diseno-comun (o la carpeta que se pase como argumento).
// Uso: node tools/actualizar-diseno-comun.mjs [ruta/a/diseno-comun]      (npm run dc)
// Copia SOLO lo que la app usa: tokens, base, fuentes en local, iconos y el módulo de entrada. No toca el repo de origen.
// Después: revisar `git diff public/dc`, probar (npm test && npm run e2e) y subir VERSION en public/sw.js si cambió algo que el service worker guarda.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SRC = path.resolve(process.argv[2] || path.join(ROOT, '..', 'diseno-comun'));
const DST = path.join(ROOT, 'public', 'dc');
const FILES = [
  'tokens.css', 'base.css', 'base.js',
  'fuentes/fuentes.css', 'fuentes/LICENCIAS.txt', 'fuentes/bricolage-latin.woff2', 'fuentes/bricolage-latin-ext.woff2', 'fuentes/sourcesans3-latin.woff2', 'fuentes/sourcesans3-latin-ext.woff2',
  'iconos/iconos.js',
  'entrada/entrada.js', 'entrada/entrada.css',
];
if (!fs.existsSync(path.join(SRC, 'tokens.css'))) { console.error('No encuentro el diseño común en ' + SRC); process.exit(2); }
let n = 0; const manifest = {};
for (const f of FILES) {
  const from = path.join(SRC, f), to = path.join(DST, f);
  if (!fs.existsSync(from)) { console.error('Falta en el origen: ' + f); process.exit(2); }
  fs.mkdirSync(path.dirname(to), { recursive: true });
  const buf = fs.readFileSync(from);
  if (!fs.existsSync(to) || !fs.readFileSync(to).equals(buf)) { fs.writeFileSync(to, buf); n++; }
  manifest[f] = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16);
}
let commit = 'desconocido';
try { commit = execFileSync('git', ['-C', SRC, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim(); } catch { /* origen sin git */ }
fs.writeFileSync(path.join(DST, 'VERSION.json'), JSON.stringify({ origen: 'diseno-comun', commit, ficheros: manifest }, null, 2) + '\n');
console.log(`diseño común (${commit}): ${n} fichero(s) actualizados de ${FILES.length} en public/dc/`);
