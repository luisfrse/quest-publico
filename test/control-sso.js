'use strict';
// Acceso unico desde Control: enlace firmado de un solo uso que abre una sesion de administrador. La contrasena (HTTP basica) sigue funcionando.
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const net = require('net');
const path = require('path');
const assert = require('assert');
const { sign } = require('../control-sso');

const SECRETO = 'secreto-de-prueba-0123456789-abcdef', CLAVE = 'clave-de-prueba-123';
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const ok = (m) => console.log('  ✓ ' + m);
const libre = () => new Promise((res) => { const s = net.createServer(); s.listen(0, () => { const p = s.address().port; s.close(() => res(p)); }); });

async function arrancar(extra) {
  const port = await libre(), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ctl-sso-'));
  const srv = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], { env: Object.assign({}, process.env, { PORT: String(port), DATA_DIR: dir, ADMIN_PASSWORD: CLAVE }, extra), stdio: 'ignore' });
  const base = 'http://127.0.0.1:' + port;
  for (let i = 0; i < 80; i++) { try { await fetch(base + '/'); break; } catch (_) { await dormir(150); } }
  return { base, parar() { srv.kill(); try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) { /* Windows */ } } };
}
const entrar = (base, t) => fetch(base + '/api/control/sso?t=' + encodeURIComponent(t), { redirect: 'manual' });
const protegido = (base, cookie, basic) => fetch(base + '/api/admin/codigos', { redirect: 'manual', headers: Object.assign({ Accept: 'text/html' }, cookie ? { Cookie: cookie } : {}, basic ? { Authorization: 'Basic ' + Buffer.from('admin:' + CLAVE).toString('base64') } : {}) });

(async () => {
  const a = await arrancar({ CONTROL_SSO_SECRET: SECRETO });
  try {
    assert.notStrictEqual((await protegido(a.base)).status, 200, 'sin credenciales no entra');
    ok('sin credenciales no se entra');
    const tk = sign(SECRETO), r = await entrar(a.base, tk);
    assert.strictEqual(r.status, 302); assert.strictEqual(r.headers.get('location'), '/admin');
    const cookie = (r.headers.getSetCookie() || []).map((c) => c.split(';')[0]).find((c) => c.startsWith('asid='));
    assert.ok(cookie, 'sesion por cookie');
    const sc = (r.headers.getSetCookie() || []).find((c) => c.startsWith('asid=')); assert.ok(/HttpOnly/i.test(sc) && /SameSite=Lax/i.test(sc), 'cookie HttpOnly y SameSite');
    ok('enlace valido: sesion de administrador (cookie HttpOnly) y redireccion a /admin');
    assert.strictEqual((await protegido(a.base, cookie)).status, 200); ok('la cookie abre la zona de administracion');
    assert.strictEqual((await protegido(a.base, null, true)).status, 200); ok('la contrasena HTTP basica sigue funcionando');
    assert.strictEqual((await entrar(a.base, tk)).status, 403); ok('el mismo enlace no vale dos veces');
    for (const mal of [sign('otro-secreto-distinto-0123456789'), sign(SECRETO, { now: Date.now() - 5 * 60e3 })]) assert.strictEqual((await entrar(a.base, mal)).status, 403);
    ok('firma de otra app y caducado: rechazados');
  } finally { a.parar(); }
  const b = await arrancar({ CONTROL_SSO_SECRET: '' });
  try { assert.strictEqual((await entrar(b.base, sign(SECRETO))).status, 404); ok('sin CONTROL_SSO_SECRET la ruta no existe'); } finally { b.parar(); }
  console.log('SSO DE CONTROL OK');
})().catch((e) => { console.error('FALLO', e); process.exit(1); });
