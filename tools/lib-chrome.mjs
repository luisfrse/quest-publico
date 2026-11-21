// Ayudas comunes de las herramientas que usan un Chrome real sin interfaz (CDP): e2e-passkey.mjs y capturas.mjs.
import { spawn } from 'node:child_process';
import net from 'node:net';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const CHROME = process.env.CHROME || ['C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const free = () => new Promise((ok) => { const s = net.createServer(); s.listen(0, () => { const p = s.address().port; s.close(() => ok(p)); }); });

/* Abre Chrome y devuelve { send, ev, waitFor, click, setVal, goto, log, close, dir }. */
export async function openChrome({ prefix = 'control', onDialog, csp } = {}) {
  if (!CHROME) { console.error('No encuentro Chrome: define la variable CHROME.'); process.exit(2); }
  const cdp = await free(), dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix + '-'));
  const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--no-proxy-server', '--remote-debugging-port=' + cdp, '--user-data-dir=' + path.join(dir, 'chrome'), 'about:blank'], { stdio: 'ignore' });
  let tabs; for (let i = 0; i < 80; i++) { try { tabs = await (await fetch('http://127.0.0.1:' + cdp + '/json')).json(); if (tabs.length) break; } catch { /* aun no */ } await sleep(250); }
  const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl); await new Promise((r) => { ws.onopen = r; });
  let id = 0; const pend = new Map(), log = [];
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); }
    else if (d.method === 'Runtime.exceptionThrown') log.push('EXC ' + JSON.stringify(d.params.exceptionDetails.exception && d.params.exceptionDetails.exception.description));
    else if (d.method === 'Log.entryAdded' && d.params.entry.level === 'error') log.push('LOG ' + d.params.entry.text + ' ' + (d.params.entry.url || ''));
    else if (d.method === 'Fetch.requestPaused') {
      // Algunos antivirus/filtros locales (p. ej. AdGuard) reescriben la CSP de las respuestas y le añaden 'unsafe-inline': eso taparia violaciones reales.
      // Con la opcion csp se restituye la cabecera que manda el servidor (leida con fetch de Node, sin filtros) antes de que Chrome la aplique.
      const h = (d.params.responseHeaders || []).filter((x) => x.name.toLowerCase() !== 'content-security-policy');
      if (d.params.responseHeaders && csp) h.push({ name: 'Content-Security-Policy', value: csp });
      const rid = d.params.requestId, code = d.params.responseStatusCode;
      if (csp && d.params.responseHeaders && d.params.resourceType === 'Document' && code === 200) {
        send('Fetch.getResponseBody', { requestId: rid }).then((b) => send('Fetch.fulfillRequest', { requestId: rid, responseCode: code, responseHeaders: h, body: b.result.base64Encoded ? b.result.body : Buffer.from(b.result.body, 'utf8').toString('base64') }));
      } else if (!d.params.responseHeaders) send('Fetch.continueResponse', { requestId: rid });
      else send('Fetch.continueResponse', { requestId: rid, responseCode: code, responseHeaders: h }).then((r) => { if (r.error) log.push('FETCHERR ' + d.params.request.url + ' ' + JSON.stringify(r.error)); });
    }
    else if (d.method === 'Page.javascriptDialogOpening') { log.push('DIALOGO NATIVO ' + d.params.type + ': ' + d.params.message); send('Page.handleJavaScriptDialog', { accept: true }); if (onDialog) onDialog(d.params); }
  };
  const send = (method, params) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); return r.result.exceptionDetails ? 'EXC:' + JSON.stringify(r.result.exceptionDetails.exception && r.result.exceptionDetails.exception.description) : r.result.result.value; };
  const waitFor = async (expr, ms = 8000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { let v; try { v = await ev(expr); } catch { /* carga */ } if (v === true) return true; await sleep(150); } return false; };
  const click = (sel) => ev(`(function(){var b=document.querySelector(${JSON.stringify(sel)});if(!b)return false;b.click();return true})()`);
  const clickText = (re, scope = 'document') => ev(`(function(){var b=[...${scope}.querySelectorAll('button,a')].find(b=>${re}.test(b.textContent)||${re}.test(b.getAttribute('aria-label')||''));if(!b)return false;b.click();return true})()`);
  const setVal = (sel, v) => ev(`(function(){var i=document.querySelector(${JSON.stringify(sel)});if(!i)return false;i.value=${JSON.stringify(v)};i.dispatchEvent(new Event('input',{bubbles:true}));return true})()`);
  const submit = (sel) => ev(`document.querySelector(${JSON.stringify(sel)}).closest('form').requestSubmit()`);
  const goto = async (url) => { await send('Page.navigate', { url }); await sleep(700); await waitFor('document.readyState==="complete"'); };
  const text = () => ev('document.body.innerText.replace(/\\s+/g," ").slice(0,500)');
  const has = (s) => `document.body.innerText.includes(${JSON.stringify(s)})`;
  const media = (theme) => send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: theme === 'oscuro' ? 'dark' : 'light' }, { name: 'prefers-reduced-motion', value: 'reduce' }] });
  await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable'); await send('WebAuthn.enable', {});
  // sin autorrelleno (mediacion condicional): el autenticador virtual lo resolveria solo y no se podria probar la contrasena sin huella
  await send('Page.addScriptToEvaluateOnNewDocument', { source: 'if(window.PublicKeyCredential){PublicKeyCredential.isConditionalMediationAvailable=async()=>false;}' });
  if (csp) await send('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Response' }] });
  const addAuthenticator = async (opts = {}) => (await send('WebAuthn.addVirtualAuthenticator', { options: { protocol: 'ctap2', transport: 'internal', hasResidentKey: true, hasUserVerification: true, isUserVerified: true, automaticPresenceSimulation: true, ...opts } })).result.authenticatorId;
  const close = async () => { try { ws.close(); } catch { /* ya cerrado */ } try { chrome.kill(); } catch { /* ya cerrado */ } await sleep(500); try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* Windows mantiene bloqueos un momento */ } };
  return { send, ev, waitFor, click, clickText, setVal, submit, goto, text, has, media, log, close, dir, addAuthenticator };
}
