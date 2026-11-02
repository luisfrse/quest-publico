'use strict';
// Genera Guia-Quest-ca.pdf y Guia-Quest-es.pdf (A4) a partir de /ayuda. Uso: node tools/generar-guias.js
// Necesita Playwright con Chromium (solo para generar los PDF; no hace falta para ejecutar la aplicación).
const { spawn } = require('child_process');
const path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/npm-tools/node_modules/playwright')); }

const PORT = 3190;
(async () => {
  const srv = spawn('node', ['server.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(PORT), DATA_DIR: path.join(require('os').tmpdir(), 'quest-guias-' + process.pid), ADMIN_PASSWORD: 'x' },
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  let log = '';
  srv.stdout.on('data', (d) => { log += d; });
  for (let i = 0; i < 200 && !log.includes('Servidor iniciado'); i++) await new Promise((r) => setTimeout(r, 50));
  const nav = await chromium.launch();
  try {
    for (const l of ['ca', 'es']) {
      const ctx = await nav.newContext({ locale: l === 'es' ? 'es-ES' : 'ca-ES' });
      const p = await ctx.newPage();
      await p.goto(`http://127.0.0.1:${PORT}/ayuda?lang=${l}`, { waitUntil: 'networkidle' });
      await p.emulateMedia({ media: 'print' });
      const destino = path.join(__dirname, '..', 'public', `Guia-Quest-${l}.pdf`);
      await p.pdf({ path: destino, format: 'A4', printBackground: true, margin: { top: '16mm', bottom: '16mm', left: '14mm', right: '14mm' } });
      console.log('Generado', destino);
      await ctx.close();
    }
  } finally {
    await nav.close();
    srv.kill();
  }
})();
