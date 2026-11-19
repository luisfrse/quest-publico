'use strict';
/* Acceso unico entre Control y cada app. ESTE MISMO FICHERO se copia en cada app (agente): Control firma, la app verifica.
   Token: `<payload>.<firma>`; payload = base64url(JSON {v, sub, iat, exp, jti}); firma = HMAC-SHA256(secreto de ESA app, payload).
   - El secreto es distinto para cada app: un token de una no sirve en otra.
   - Vive 60 s como maximo y solo se acepta UNA vez (jti recordado en memoria hasta que caduca).
   - Sin dependencias. Si cambias algo aqui, copialo a todas las apps. */
const crypto = require('node:crypto');

const b64 = (b) => Buffer.from(b).toString('base64url');
const mac = (secret, payload) => crypto.createHmac('sha256', secret).update(payload).digest('base64url');

/* lo usa Control */
function sign(secret, { sub = 'owner', ttlMs = 60000, now = Date.now() } = {}) {
  if (!secret) throw new Error('falta el secreto');
  const payload = b64(JSON.stringify({ v: 1, sub, iat: now, exp: now + ttlMs, jti: crypto.randomBytes(12).toString('base64url') }));
  return payload + '.' + mac(secret, payload);
}

/* lo usa cada app: devuelve una funcion verify(token, now?) -> { ok, sub } | { ok: false, error } */
function createVerifier(secret, { maxLifeMs = 120000, skewMs = 30000 } = {}) {
  const used = new Map();
  return function verify(token, now = Date.now()) {
    if (!secret) return { ok: false, error: 'config' };
    if (typeof token !== 'string' || token.length > 800 || token.split('.').length !== 2) return { ok: false, error: 'format' };
    const [payload, sig] = token.split('.');
    const want = mac(secret, payload);
    if (sig.length !== want.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(want))) return { ok: false, error: 'firma' };
    let d; try { d = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')); } catch (_) { return { ok: false, error: 'format' }; }
    if (!d || d.v !== 1 || typeof d.iat !== 'number' || typeof d.exp !== 'number' || typeof d.jti !== 'string' || d.jti.length < 8) return { ok: false, error: 'format' };
    if (d.exp - d.iat > maxLifeMs) return { ok: false, error: 'vida' };
    if (now > d.exp || now < d.iat - skewMs) return { ok: false, error: 'caducado' };
    for (const [k, e] of used) if (e < now) used.delete(k);
    if (used.has(d.jti)) return { ok: false, error: 'repetido' };
    used.set(d.jti, d.exp);
    return { ok: true, sub: String(d.sub || 'owner').slice(0, 60) };
  };
}
module.exports = { sign, createVerifier };
