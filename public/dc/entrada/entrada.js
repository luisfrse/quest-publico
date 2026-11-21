'use strict';
/* diseno-comun · entrada/entrada.js — pantalla de entrada única (contraseña, huella/llave, segundo factor, PIN de desbloqueo).
   Vanilla, sin dependencias, sin innerHTML con datos y sin estilos en línea: compatible con CSP `script-src 'self'; style-src 'self'`.
   Necesita antes: fuentes/fuentes.css, tokens.css, base.css, iconos/iconos.js y entrada/entrada.css. Contrato completo en entrada/README.md.

   Uso mínimo (HTML):
     <main id="dc-entrada" data-app="Control" data-subtitle="Panel de tus aplicaciones" data-color="#6fd3b4" data-glyph="activity"
           data-modes="password,passkey,totp,pin" data-pin-length="4-8" data-lock-minutes="10"></main>
     <script src="/iconos/iconos.js"></script><script src="/entrada/entrada.js"></script>
   Atributos data-*: app, subtitle, color, glyph, logo, modes, api (prefijo, por defecto /api), done (destino, por defecto /; «next» usa ?next=),
   pin-length («4-8» o «6»), pin-type (numeric|text), lock-minutes, lang (es|ca|en), csrf-header + csrf-value, auto-passkey (0|1), notice.
   Para integrar un servidor distinto: DCEntrada.init({ root, backend: { state, login, passkeyLogin, passkeyStep, code, unlock, logout, setup } }). */
(function (root) {
  var STR = {
    es: {
      loading: 'Cargando…', entering: 'Entrando…', retry: 'Reintentar', cancel: 'Cancelar', back: 'Volver', continue: 'Continuar', logout: 'Salir',
      offline: 'Sin conexión', offlineText: 'No se puede hablar con el servidor. Comprueba la conexión e inténtalo de nuevo.', serverError: 'El servidor no responde', serverErrorText: 'Algo ha fallado al conectar. Inténtalo de nuevo en un momento.',
      notConfigured: 'Todavía sin configurar', notConfiguredText: 'Esta app aún no tiene contraseña. Defínela en las variables de entorno del servidor y recarga esta página.',
      loginTitle: 'Entrar', password: 'Contraseña', showPassword: 'Mostrar contraseña', hidePassword: 'Ocultar contraseña', capsOn: 'Tienes las mayúsculas activadas.', signIn: 'Entrar', checking: 'Comprobando…',
      passkey: 'Entrar con huella o llave', passkeyShort: 'Usar huella o llave', or: 'o con tu contraseña', passkeyCancelled: 'Cancelado. Puedes volver a intentarlo.', passkeyUnavailable: 'Este navegador no admite huella ni llaves.',
      stepsTitle: 'Verificación en dos pasos', stepsPasskey: 'Confirma con tu huella, tu cara o tu llave de seguridad.', stepsCode: 'Código de tu app de autenticación', stepsCodeHint: 'Son 6 cifras y cambian cada 30 segundos.',
      recoveryCode: 'Código de recuperación', useRecovery: 'Usar un código de recuperación', useApp: 'Usar el código de la app', recoveryHint: 'Uno de los códigos que guardaste al activar la verificación. Cada uno vale una vez.', confirm: 'Confirmar',
      recoveryUsed: 'Has usado un código de recuperación', recoveryLeft: function (n) { return n === 1 ? 'Te queda 1 código. Genera códigos nuevos en los ajustes de seguridad.' : 'Te quedan ' + n + ' códigos. Puedes generar nuevos en los ajustes de seguridad.'; },
      lockTitle: 'Bloqueada', lockHint: function (m) { return m ? 'Se bloquea sola tras ' + m + ' min sin usarla.' : 'Se bloqueó por inactividad.'; }, pinTitle: 'Introduce tu PIN', pinKeys: 'Teclado numérico del PIN', pinDigits: function (n) { return n === 0 ? 'Sin cifras' : n + (n === 1 ? ' cifra' : ' cifras'); },
      pinDelete: 'Borrar la última cifra', pinUnlock: 'Desbloquear', pinPlaceholder: 'PIN', pinForgot: 'Salir y entrar con la contraseña', useKey: 'Usar huella o llave', noPinNoKey: 'No hay PIN ni huella: entra con tu contraseña.',
      waitTitle: 'Demasiados intentos', waitText: 'Por seguridad hay que esperar antes de volver a probar.', waitIn: function (t) { return 'Podrás volver a intentarlo en ' + t + '.'; }, waitDone: 'Ya puedes volver a intentarlo.', waitUnknown: 'Espera unos minutos antes de volver a probar.', retryNow: 'Volver a intentarlo',
      setupTitle: 'Crea tu contraseña', setupText: 'Es la primera vez. Necesitas el código de instalación que pusiste en las variables del servidor.', setupCode: 'Código de instalación', newPassword: 'Contraseña nueva', repeatPassword: 'Repite la contraseña', passwordRule: function (n) { return n + ' o más caracteres. Una frase larga es mejor que una palabra rara.'; }, createEnter: 'Crear contraseña y entrar',
      errBad: 'Contraseña incorrecta.', errPin: 'PIN incorrecto.', errCode: 'Código incorrecto.', errSetupCode: 'Código de instalación incorrecto.', errLocked: 'Demasiados fallos. Empieza de nuevo con la contraseña.', errExpired: 'Ha caducado. Empieza de nuevo.', errRevoked: 'Demasiados fallos: la sesión se ha cerrado. Entra con la contraseña.',
      errNeedFactor: 'Con la huella o el segundo factor activados, la contraseña sola ya no entra.', errNoKeys: 'Aún no hay ninguna huella registrada.', errInvalid: 'Revisa los datos.', errNetwork: 'No se pudo conectar con el servidor.', errUnknown: 'Algo ha fallado. Inténtalo de nuevo.',
      errEmpty: 'Escribe la contraseña.', errShort: function (n) { return 'La contraseña necesita al menos ' + n + ' caracteres.'; }, errMismatch: 'Las contraseñas no coinciden.', errCodeEmpty: 'Escribe el código.',
      left: function (n) { return n === 1 ? 'Queda 1 intento.' : 'Quedan ' + n + ' intentos.'; }, lastWarn: 'Si fallas otra vez se cerrará la sesión.', min: 'min', sec: 's'
    },
    ca: {
      loading: 'Carregant…', entering: 'Entrant…', retry: 'Torna-ho a provar', cancel: 'Cancel·la', back: 'Enrere', continue: 'Continua', logout: 'Surt',
      offline: 'Sense connexió', offlineText: 'No es pot parlar amb el servidor. Comprova la connexió i torna-ho a provar.', serverError: 'El servidor no respon', serverErrorText: 'Alguna cosa ha fallat en connectar. Torna-ho a provar d’aquí a un moment.',
      notConfigured: 'Encara sense configurar', notConfiguredText: 'Aquesta app encara no té contrasenya. Defineix-la a les variables d’entorn del servidor i recarrega aquesta pàgina.',
      loginTitle: 'Entra', password: 'Contrasenya', showPassword: 'Mostra la contrasenya', hidePassword: 'Amaga la contrasenya', capsOn: 'Tens les majúscules activades.', signIn: 'Entra', checking: 'Comprovant…',
      passkey: 'Entra amb empremta o clau', passkeyShort: 'Usa empremta o clau', or: 'o amb la teva contrasenya', passkeyCancelled: 'Cancel·lat. Pots tornar-ho a provar.', passkeyUnavailable: 'Aquest navegador no admet empremta ni claus.',
      stepsTitle: 'Verificació en dos passos', stepsPasskey: 'Confirma amb l’empremta, la cara o la clau de seguretat.', stepsCode: 'Codi de la teva app d’autenticació', stepsCodeHint: 'Són 6 xifres i canvien cada 30 segons.',
      recoveryCode: 'Codi de recuperació', useRecovery: 'Usa un codi de recuperació', useApp: 'Usa el codi de l’app', recoveryHint: 'Un dels codis que vas guardar en activar la verificació. Cadascun val una sola vegada.', confirm: 'Confirma',
      recoveryUsed: 'Has fet servir un codi de recuperació', recoveryLeft: function (n) { return n === 1 ? 'Et queda 1 codi. Genera’n de nous als ajustos de seguretat.' : 'Et queden ' + n + ' codis. Pots generar-ne de nous als ajustos de seguretat.'; },
      lockTitle: 'Bloquejada', lockHint: function (m) { return m ? 'Es bloqueja sola després de ' + m + ' min sense fer-la servir.' : 'S’ha bloquejat per inactivitat.'; }, pinTitle: 'Introdueix el teu PIN', pinKeys: 'Teclat numèric del PIN', pinDigits: function (n) { return n === 0 ? 'Cap xifra' : n + (n === 1 ? ' xifra' : ' xifres'); },
      pinDelete: 'Esborra l’última xifra', pinUnlock: 'Desbloqueja', pinPlaceholder: 'PIN', pinForgot: 'Surt i entra amb la contrasenya', useKey: 'Usa empremta o clau', noPinNoKey: 'No hi ha PIN ni empremta: entra amb la contrasenya.',
      waitTitle: 'Massa intents', waitText: 'Per seguretat cal esperar abans de tornar-ho a provar.', waitIn: function (t) { return 'Podràs tornar-ho a provar d’aquí a ' + t + '.'; }, waitDone: 'Ja pots tornar-ho a provar.', waitUnknown: 'Espera uns minuts abans de tornar-ho a provar.', retryNow: 'Torna-ho a provar',
      setupTitle: 'Crea la teva contrasenya', setupText: 'És la primera vegada. Necessites el codi d’instal·lació que vas posar a les variables del servidor.', setupCode: 'Codi d’instal·lació', newPassword: 'Contrasenya nova', repeatPassword: 'Repeteix la contrasenya', passwordRule: function (n) { return n + ' o més caràcters. Una frase llarga és millor que una paraula estranya.'; }, createEnter: 'Crea la contrasenya i entra',
      errBad: 'Contrasenya incorrecta.', errPin: 'PIN incorrecte.', errCode: 'Codi incorrecte.', errSetupCode: 'Codi d’instal·lació incorrecte.', errLocked: 'Massa errors. Torna a començar amb la contrasenya.', errExpired: 'Ha caducat. Torna a començar.', errRevoked: 'Massa errors: s’ha tancat la sessió. Entra amb la contrasenya.',
      errNeedFactor: 'Amb l’empremta o el segon factor activats, la contrasenya sola ja no entra.', errNoKeys: 'Encara no hi ha cap empremta registrada.', errInvalid: 'Revisa les dades.', errNetwork: 'No s’ha pogut connectar amb el servidor.', errUnknown: 'Alguna cosa ha fallat. Torna-ho a provar.',
      errEmpty: 'Escriu la contrasenya.', errShort: function (n) { return 'La contrasenya necessita almenys ' + n + ' caràcters.'; }, errMismatch: 'Les contrasenyes no coincideixen.', errCodeEmpty: 'Escriu el codi.',
      left: function (n) { return n === 1 ? 'Queda 1 intent.' : 'Queden ' + n + ' intents.'; }, lastWarn: 'Si falles una altra vegada es tancarà la sessió.', min: 'min', sec: 's'
    },
    en: {
      loading: 'Loading…', entering: 'Signing in…', retry: 'Try again', cancel: 'Cancel', back: 'Back', continue: 'Continue', logout: 'Sign out',
      offline: 'No connection', offlineText: 'Cannot reach the server. Check your connection and try again.', serverError: 'The server is not responding', serverErrorText: 'Something went wrong while connecting. Try again in a moment.',
      notConfigured: 'Not set up yet', notConfiguredText: 'This app has no password yet. Set it in the server environment variables and reload this page.',
      loginTitle: 'Sign in', password: 'Password', showPassword: 'Show password', hidePassword: 'Hide password', capsOn: 'Caps Lock is on.', signIn: 'Sign in', checking: 'Checking…',
      passkey: 'Sign in with fingerprint or key', passkeyShort: 'Use fingerprint or key', or: 'or with your password', passkeyCancelled: 'Cancelled. You can try again.', passkeyUnavailable: 'This browser does not support fingerprints or security keys.',
      stepsTitle: 'Two-step verification', stepsPasskey: 'Confirm with your fingerprint, face or security key.', stepsCode: 'Code from your authenticator app', stepsCodeHint: 'It has 6 digits and changes every 30 seconds.',
      recoveryCode: 'Recovery code', useRecovery: 'Use a recovery code', useApp: 'Use the app code', recoveryHint: 'One of the codes you saved when you turned verification on. Each works once.', confirm: 'Confirm',
      recoveryUsed: 'You used a recovery code', recoveryLeft: function (n) { return n === 1 ? '1 code left. Generate new ones in the security settings.' : n + ' codes left. You can generate new ones in the security settings.'; },
      lockTitle: 'Locked', lockHint: function (m) { return m ? 'It locks itself after ' + m + ' min without use.' : 'It locked because of inactivity.'; }, pinTitle: 'Enter your PIN', pinKeys: 'PIN keypad', pinDigits: function (n) { return n === 0 ? 'No digits' : n + (n === 1 ? ' digit' : ' digits'); },
      pinDelete: 'Delete the last digit', pinUnlock: 'Unlock', pinPlaceholder: 'PIN', pinForgot: 'Sign out and use the password', useKey: 'Use fingerprint or key', noPinNoKey: 'There is no PIN or fingerprint: sign in with your password.',
      waitTitle: 'Too many attempts', waitText: 'For security you have to wait before trying again.', waitIn: function (t) { return 'You can try again in ' + t + '.'; }, waitDone: 'You can try again now.', waitUnknown: 'Wait a few minutes before trying again.', retryNow: 'Try again',
      setupTitle: 'Create your password', setupText: 'First time here. You need the install code you set in the server variables.', setupCode: 'Install code', newPassword: 'New password', repeatPassword: 'Repeat the password', passwordRule: function (n) { return n + ' or more characters. A long phrase beats an odd word.'; }, createEnter: 'Create password and sign in',
      errBad: 'Wrong password.', errPin: 'Wrong PIN.', errCode: 'Wrong code.', errSetupCode: 'Wrong install code.', errLocked: 'Too many failures. Start again with the password.', errExpired: 'It expired. Start again.', errRevoked: 'Too many failures: the session was closed. Sign in with the password.',
      errNeedFactor: 'With a fingerprint or second factor turned on, the password alone no longer works.', errNoKeys: 'No fingerprint is registered yet.', errInvalid: 'Check the details.', errNetwork: 'Could not reach the server.', errUnknown: 'Something went wrong. Try again.',
      errEmpty: 'Enter the password.', errShort: function (n) { return 'The password needs at least ' + n + ' characters.'; }, errMismatch: 'The passwords do not match.', errCodeEmpty: 'Enter the code.',
      left: function (n) { return n === 1 ? '1 attempt left.' : n + ' attempts left.'; }, lastWarn: 'If you fail once more the session will be closed.', min: 'min', sec: 's'
    }
  };

  /* ---------- utilidades ---------- */
  function h(tag, attrs) {
    var e = document.createElement(tag), a = attrs || {};
    Object.keys(a).forEach(function (k) {
      var v = a[k]; if (v == null || v === false) return;
      if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v; else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? '' : v);
    });
    for (var i = 2; i < arguments.length; i++) append(e, arguments[i]);
    return e;
  }
  function append(e, c) { if (c == null || c === false) return; if (Array.isArray(c)) { c.forEach(function (x) { append(e, x); }); return; } e.appendChild(c.nodeType ? c : document.createTextNode(String(c))); }
  function icon(name) { var s = root.DCIcons ? root.DCIcons.svg(name) : document.createElement('span'); var w = h('span', { class: 'dc-icon', 'aria-hidden': 'true' }); w.appendChild(s); return w; }
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var canPasskey = function () { return !!(root.PublicKeyCredential && navigator.credentials && navigator.credentials.get); };
  var b64 = {
    dec: function (s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); var bin = atob(s + '='.repeat((4 - s.length % 4) % 4)); return Uint8Array.from(bin, function (c) { return c.charCodeAt(0); }).buffer; },
    enc: function (buf) { var u = new Uint8Array(buf), s = ''; for (var i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  };
  function fmtTime(sec, T) { var m = Math.floor(sec / 60), s = sec % 60; return m > 0 ? m + ' ' + T.min + (s ? ' ' + s + ' ' + T.sec : '') : s + ' ' + T.sec; }
  function clock(sec) { var m = Math.floor(sec / 60), s = sec % 60; return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s; }

  /* ---------- backend HTTP por defecto (contrato de Control y Deporte) ---------- */
  function httpBackend(o) {
    var base = (o.api || '/api').replace(/\/+$/, ''), hdr = {};
    if (o.csrfHeader) hdr[o.csrfHeader] = o.csrfValue || '1';
    function fail(res, data, extra) { var e = new Error((data && data.error) || 'http'); e.status = res ? res.status : 0; e.code = (data && data.error) || (res ? 'http' : 'network'); e.left = data && data.left; e.wait = (data && (data.wait || data.retryAfter)) || (res && parseInt(res.headers.get('Retry-After'), 10)) || undefined; e.data = data || {}; if (extra) e.name = extra; return e; }
    async function call(path, body) {
      var res, data = {};
      try {
        var opt = { method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', headers: Object.assign({}, hdr) };
        if (body !== undefined) { opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body); }
        res = await fetch(base + path, opt);
      } catch (_) { throw fail(null, { error: 'network' }); }
      try { data = await res.json(); } catch (_) { data = {}; }
      if (res.status === 429 && !(data && data.error)) data = Object.assign({}, data, { error: 'rate' });
      if (!res.ok) throw fail(res, data);
      return data;
    }
    async function assertion(opts) {
      var cred = await navigator.credentials.get({ publicKey: { challenge: b64.dec(opts.challenge), rpId: opts.rpId, timeout: opts.timeout, userVerification: opts.userVerification, allowCredentials: (opts.allowCredentials || []).map(function (c) { return { type: 'public-key', id: b64.dec(c.id), transports: c.transports }; }) } });
      var r = cred.response;
      return { id: cred.id, rawId: b64.enc(cred.rawId), type: cred.type, authenticatorAttachment: cred.authenticatorAttachment, clientExtensionResults: cred.getClientExtensionResults(),
        response: { authenticatorData: b64.enc(r.authenticatorData), clientDataJSON: b64.enc(r.clientDataJSON), signature: b64.enc(r.signature), userHandle: r.userHandle ? b64.enc(r.userHandle) : undefined } };
    }
    var norm = function (r) { r = r || {}; var need = Array.isArray(r.need) ? r.need.slice() : (r.need2fa ? ['totp'] : []); return { need: need, recoveryLeft: r.recoveryLeft }; };
    return {
      state: async function () { var s = await call('/state'); return { authed: !!s.authed, unlocked: !!s.unlocked, hasPin: !!s.hasPin, passkeys: !!(s.passkeys > 0 || s.passkeys === true || s.hasPasskeys), configured: s.configured !== false && s.canLogin !== false, needsSetup: !!s.needsSetup, lockMinutes: s.lockMinutes, totp: s.totp }; },
      login: async function (password) { return norm(await call('/login', { password: password })); },
      passkeyLogin: async function () { return norm(await call('/webauthn/login/verify', await assertion(await call('/webauthn/login/options', {})))); },
      passkeyStep: async function () { return norm(await call('/login/passkey/verify', await assertion(await call('/login/passkey/options', {})))); },
      code: async function (code) { return norm(await call('/login/2fa', { code: code })); },
      unlock: async function (pin) { return call('/unlock', { pin: pin }); },
      logout: async function () { try { await call('/logout', {}); } catch (_) { /* da igual: se vuelve a leer el estado */ } },
      setup: async function (d) { return call('/setup', { code: d.code, password: d.password }); }
    };
  }

  /* ---------- la pantalla ---------- */
  function init(opts) {
    opts = opts || {};
    var rootEl = opts.root || document.getElementById('dc-entrada');
    if (!rootEl) throw new Error('DCEntrada: falta el contenedor #dc-entrada');
    var ds = rootEl.dataset || {};
    var o = {
      app: opts.app || ds.app || 'App', subtitle: opts.subtitle != null ? opts.subtitle : ds.subtitle || '', color: opts.color || ds.color || '', ink: opts.ink || ds.ink || '', glyph: opts.glyph || ds.glyph || 'lock', logo: opts.logo || ds.logo || '',
      modes: (opts.modes || ds.modes || 'password,passkey,totp,pin').split(',').map(function (s) { return s.trim(); }), api: opts.api || ds.api || '/api', done: opts.done || ds.done || '/', notice: opts.notice || ds.notice || '',
      pinType: opts.pinType || ds.pinType || 'numeric', lockMinutes: opts.lockMinutes || (ds.lockMinutes ? +ds.lockMinutes : 0), autoPasskey: opts.autoPasskey != null ? opts.autoPasskey : ds.autoPasskey !== '0',
      pkBase: opts.pkBase || ds.pkBase || '/api/webauthn', pkLegacy: opts.pkLegacy != null ? opts.pkLegacy : ds.pkLegacy === '1', csrfHeader: opts.csrfHeader || ds.csrfHeader || '', csrfValue: opts.csrfValue || ds.csrfValue || '', minPassword: opts.minPassword || (ds.minPassword ? +ds.minPassword : 12)
    };
    var pl = String(opts.pinLength || ds.pinLength || '4-8').split('-'); o.pinMin = +pl[0] || 4; o.pinMax = +(pl[1] || pl[0]) || o.pinMin; o.pinFixed = o.pinMin === o.pinMax;
    var lang = (opts.lang || ds.lang || document.documentElement.lang || 'es').slice(0, 2); var T = Object.assign({}, STR[lang] || STR.es, opts.text || {});
    var PK = root.DCPasskey ? root.DCPasskey.create({ base: o.pkBase, legacy: o.pkLegacy, lang: lang, headers: o.csrfHeader ? Object.fromEntries([[o.csrfHeader, o.csrfValue || '1']]) : {} }) : null;
    var B = httpBackend(o);
    if (PK) B.passkeyLogin = async function (mode) { var r = await PK.login({ mode: mode || 'modal' }); return { need: [], recoveryLeft: undefined, raw: r }; };
    B = Object.assign(B, opts.backend || {});
    var allow = function (m) { return o.modes.indexOf(m) >= 0; };
    var S = null, autoTried = false, timers = [], keyHandler = null;

    document.title = o.app + ' · ' + T.loginTitle;
    if (o.color) rootEl.style.setProperty('--dc-app', o.color);     // CSSOM: lo permite la CSP (no es un atributo style)
    if (o.ink) rootEl.style.setProperty('--dc-app-ink', o.ink);
    rootEl.classList.add('dc-entrada');

    /* marco: marca + tarjeta */
    var tile = o.logo ? h('img', { class: 'dc-entrada__logo', src: o.logo, alt: '', width: 72, height: 72 }) : h('span', { class: 'dc-brand__tile' }, icon(o.glyph));
    var brand = h('div', { class: 'dc-entrada__brand dc-brand dc-brand--lg' }, tile, h('div', { class: 'dc-entrada__names' }, h('p', { class: 'dc-entrada__app', text: o.app }), o.subtitle ? h('p', { class: 'dc-entrada__sub', text: o.subtitle }) : null));
    var card = h('div', { class: 'dc-entrada__card', 'aria-busy': 'false' });
    var foot = o.notice ? h('p', { class: 'dc-entrada__foot', text: o.notice }) : null;
    rootEl.replaceChildren(brand, card, foot);

    /* ---- ayudas de pantalla ---- */
    function clearTimers() { timers.forEach(function (t) { clearInterval(t); clearTimeout(t); }); timers = []; }
    function screen(kind, kids, focus) {
      clearTimers(); if (keyHandler) { rootEl.removeEventListener('keydown', keyHandler); keyHandler = null; }
      card.setAttribute('data-screen', kind); card.setAttribute('aria-busy', 'false');
      card.replaceChildren.apply(card, [].concat(kids).flat(Infinity).filter(Boolean));
      var f = focus || card.querySelector('.dc-entrada__title');
      if (f) { if (f.tagName === 'H1' || f.tagName === 'H2') f.setAttribute('tabindex', '-1'); try { f.focus({ preventScroll: true }); } catch (_) { /* nada */ } }
    }
    var title = function (t, sub) { return [h('h1', { class: 'dc-entrada__title', text: t }), sub ? h('p', { class: 'dc-entrada__lead', text: sub }) : null]; };
    function msgBox() { return h('div', { class: 'dc-entrada__msg', role: 'alert', 'aria-live': 'assertive' }); }
    function say(box, text, kind, ttl) { box.replaceChildren(); if (!text) return; box.appendChild(h('div', { class: 'dc-alert dc-alert--' + (kind || 'danger') }, icon(kind === 'info' ? 'info' : kind === 'ok' ? 'check-circle' : kind === 'warn' ? 'alert' : 'x-circle'), h('div', null, ttl ? h('span', { class: 'dc-alert__title', text: ttl }) : null, text))); }
    function busy(on, btn) { card.setAttribute('aria-busy', on ? 'true' : 'false'); if (btn) { if (on) btn.setAttribute('aria-busy', 'true'); else btn.removeAttribute('aria-busy'); btn.disabled = !!on; } }
    function errText(e, ctx) {
      var c = e && (e.code || e.message), left = e && e.left != null ? ' ' + T.left(e.left) : '';
      if (e && e.name === 'PKError' && PK) { var ex = PK.explain(e); return { t: ex.text, title: ex.title, kind: ex.kind === 'cancelled' || ex.kind === 'gesture' || ex.kind === 'timeout' ? 'info' : ex.kind === 'nocred' || ex.kind === 'nouv' ? 'warn' : 'danger', silent: ex.silent }; }
      if (e && e.name === 'NotAllowedError') return { t: T.passkeyCancelled, kind: 'info' };
      if (e && e.name === 'AbortError') return { t: T.passkeyCancelled, kind: 'info' };
      var map = { bad: T.errBad, pin: T.errPin, code: ctx === 'setup' ? T.errSetupCode : T.errCode, locked: T.errLocked, expired: T.errExpired, revoked: T.errRevoked, needfactor: T.errNeedFactor, nokeys: T.errNoKeys, invalid: T.errInvalid, network: T.errNetwork };
      var base = map[c] || T.errUnknown;
      var warn = (c === 'pin' || c === 'bad') && e.left === 1 && ctx === 'pin' ? ' ' + T.lastWarn : '';
      return { t: base + (map[c] && c !== 'locked' && c !== 'expired' && c !== 'revoked' ? left : '') + warn, kind: 'danger' };
    }
    function fail(box, e, ctx) { var r = errText(e, ctx); if (r.silent) return say(box, ''); say(box, r.t, r.kind, r.title); }
    function showPass(input, btn) {
      var on = input.type === 'text'; input.type = on ? 'password' : 'text'; btn.setAttribute('aria-pressed', on ? 'false' : 'true'); btn.setAttribute('aria-label', on ? T.showPassword : T.hidePassword);
      btn.replaceChildren(icon(on ? 'eye' : 'eye-off')); input.focus();
    }
    function passwordField(id, label, opts2) {
      opts2 = opts2 || {};
      var input = h('input', { class: 'dc-input', id: id, name: opts2.name || 'password', type: 'password', autocomplete: opts2.auto || 'current-password', autocapitalize: 'none', spellcheck: 'false', required: true });
      var eye = h('button', { type: 'button', class: 'dc-btn dc-btn--ghost dc-btn--icon dc-input-group__btn', 'aria-label': T.showPassword, 'aria-pressed': 'false', onclick: function () { showPass(input, eye); } }, icon('eye'));
      var caps = h('p', { class: 'dc-hint dc-entrada__caps', hidden: true, text: T.capsOn });
      input.addEventListener('keyup', function (ev) { if (ev.getModifierState) caps.hidden = !ev.getModifierState('CapsLock'); });
      input.addEventListener('blur', function () { caps.hidden = true; });
      var hint = opts2.hint ? h('p', { class: 'dc-hint', id: id + '-hint', text: opts2.hint }) : null;
      if (hint) input.setAttribute('aria-describedby', id + '-hint');
      return { input: input, node: h('div', { class: 'dc-field' }, h('label', { class: 'dc-label', for: id, text: label }), h('div', { class: 'dc-input-group' }, input, eye), hint, caps) };
    }
    var passkeyBtn = function (label, handler, primary) { return h('button', { type: 'button', class: 'dc-btn dc-btn--lg dc-btn--block ' + (primary === false ? 'dc-btn--secondary' : 'dc-btn--primary'), onclick: handler }, icon('fingerprint'), label); };
    function offer() { return allow('passkey') && S && S.passkeys && canPasskey(); }                 // llave registrada en el servidor (teclado de PIN)
    function showKey() { return allow('passkey') && (PK ? PK.supported() : canPasskey()); }            // el botón «Entrar con huella» se ve siempre que el navegador pueda

    /* ---- destino ---- */
    function done() {
      screen('done', [h('div', { class: 'dc-state', role: 'status' }, h('div', { class: 'dc-spinner', 'aria-hidden': 'true' }), h('p', { text: T.entering }))]);
      var to = o.done; if (to === 'next') { var n = new URLSearchParams(location.search).get('next'); to = n && /^\/(?!\/)/.test(n) ? n : '/'; }
      if (typeof opts.onDone === 'function') return opts.onDone(to);
      location.replace(new URL(to, location.href).href);
    }
    function after(r) {
      if (r && r.need && r.need.length) return steps(r.need);
      if (r && r.recoveryLeft != null) return recoveryNotice(r.recoveryLeft);
      done();
    }

    /* ---- pantallas ---- */
    function loading() { screen('loading', [h('div', { class: 'dc-state', role: 'status' }, h('div', { class: 'dc-spinner', 'aria-hidden': 'true' }), h('p', { text: T.loading }))]); }
    function problem(kind) {
      var off = kind === 'offline' || navigator.onLine === false;
      screen('error', [h('div', { class: 'dc-state dc-state--error' }, h('div', { class: 'dc-state__icon' }, icon(off ? 'offline' : 'alert')), h('h1', { class: 'dc-state__title dc-entrada__title', text: off ? T.offline : T.serverError }), h('p', { class: 'dc-muted', text: off ? T.offlineText : T.serverErrorText }), h('button', { type: 'button', class: 'dc-btn dc-btn--primary', onclick: boot }, icon('refresh'), T.retry))]);
    }
    function notConfigured() {
      screen('notconfigured', [h('div', { class: 'dc-state' }, h('div', { class: 'dc-state__icon' }, icon('settings')), h('h1', { class: 'dc-state__title dc-entrada__title', text: T.notConfigured }), h('p', { class: 'dc-muted', text: T.notConfiguredText }), h('button', { type: 'button', class: 'dc-btn dc-btn--secondary', onclick: boot }, icon('refresh'), T.retry))]);
    }

    function login() {
      var box = msgBox(), key = showKey(), strong = !!(S && S.passkeys);
      var pw = passwordField('dc-pw', T.password, { auto: key ? 'current-password webauthn' : 'current-password' });   // «webauthn»: el navegador puede ofrecer la llave al tocar el campo (mediación condicional)
      var submit = h('button', { type: 'submit', class: 'dc-btn dc-btn--lg dc-btn--block ' + (key && strong ? 'dc-btn--secondary' : 'dc-btn--primary') }, T.signIn);
      var keyBtn = null, armed = null;
      var disarm = function () { if (armed) { armed(); armed = null; } };
      var arm = async function () { if (!PK || !key || !strong || card.getAttribute('data-screen') !== 'login') return;     // sin llaves en el servidor no se pide nada (evita un 404 y un aviso inútil)
        disarm(); armed = await PK.startConditional(function (r) { after({ need: [] }); }, function () { /* el autorrelleno es un extra: si falla, se calla (la contraseña y el botón siguen ahí) */ }); };
      var useKey = async function () {
        say(box, ''); disarm(); keyBtn.setAttribute('aria-busy', 'true'); keyBtn.disabled = true;
        try { after(await B.passkeyLogin('modal')); }
        catch (e) { keyBtn.removeAttribute('aria-busy'); keyBtn.disabled = false; if (e && (e.code === 'rate' || e.kind === 'rate')) return waiting(e.wait, login); if (e && e.kind === 'nocred' && PK) PK.clearMark(); fail(box, e); keyBtn.focus(); arm(); }
      };
      keyBtn = key ? passkeyBtn(T.passkey, useKey, strong) : null;
      var form = h('form', { class: 'dc-form', novalidate: true, onsubmit: async function (ev) {
        ev.preventDefault(); say(box, '');
        if (!pw.input.value) { pw.input.setAttribute('aria-invalid', 'true'); say(box, T.errEmpty); pw.input.focus(); return; }
        pw.input.removeAttribute('aria-invalid'); disarm(); busy(true, submit);
        try { after(await B.login(pw.input.value)); }
        catch (e) { busy(false, submit); pw.input.setAttribute('aria-invalid', 'true'); if (e && e.code === 'rate') return waiting(e.wait, login); fail(box, e); pw.input.select(); arm(); }
      } }, h('input', { class: 'dc-sr-only', type: 'text', name: 'username', autocomplete: 'username', tabindex: '-1', 'aria-hidden': 'true', value: o.app }), pw.node, box, submit);
      screen('login', [title(T.loginTitle), key ? [keyBtn, h('p', { class: 'dc-entrada__or' }, h('span', { text: T.or }))] : null, form], key && strong && PK && PK.hasMark() ? null : (key && strong ? null : pw.input));
      if (!key || !PK) return;
      /* 1) aviso automático solo si este dispositivo ya usó la llave en esta app; 2) si no, autorrelleno; una sola vez por carga, sin bucles */
      if (o.autoPasskey && !autoTried && strong && PK.hasMark() && !document.hidden) {
        autoTried = true;
        PK.auto().then(function (r) { after({ need: [] }); }, function (e) {
          if (card.getAttribute('data-screen') !== 'login') return;
          if (e.kind === 'gesture' || e.kind === 'abort') { keyBtn.classList.add('is-hint'); keyBtn.focus(); }   // Safari/iOS: hace falta un toque; se resalta el botón sin dar error
          else { if (e.kind === 'nocred') PK.clearMark(); fail(box, e); pw.input.focus(); }
          arm();
        });
      } else arm();
    }

    function steps(need) {
      var box = msgBox(), kids = [];
      var next = function (r) { if (r && r.need && r.need.length) return steps(r.need); if (r && r.recoveryLeft != null) return recoveryNotice(r.recoveryLeft); done(); };
      var restart = function (e) { if (e && (e.code === 'locked' || e.code === 'expired')) timers.push(setTimeout(boot, 2200)); };
      var focusEl = null;
      if (need.indexOf('passkey') >= 0) {
        kids.push(h('p', { class: 'dc-entrada__lead', text: T.stepsPasskey }), passkeyBtn(T.passkeyShort, async function () { say(box, ''); busy(true); try { next(await B.passkeyStep()); } catch (e) { busy(false); if (e && e.code === 'rate') return waiting(e.wait, boot); fail(box, e); restart(e); } }));
      }
      if (need.indexOf('totp') >= 0) {
        var recovery = false, label = h('label', { class: 'dc-label', for: 'dc-code', text: T.stepsCode }), hint = h('p', { class: 'dc-hint', id: 'dc-code-hint', text: T.stepsCodeHint });
        var code = h('input', { class: 'dc-input dc-input--code', id: 'dc-code', name: 'code', type: 'text', inputmode: 'numeric', pattern: '[0-9]*', autocomplete: 'one-time-code', maxlength: '6', autocapitalize: 'none', spellcheck: 'false', 'aria-describedby': 'dc-code-hint' });
        var go = h('button', { type: 'submit', class: 'dc-btn dc-btn--lg dc-btn--block dc-btn--primary' }, T.confirm);
        var toggle = h('button', { type: 'button', class: 'dc-btn dc-btn--ghost dc-btn--block', onclick: function () {
          recovery = !recovery; say(box, ''); code.value = '';
          code.setAttribute('inputmode', recovery ? 'text' : 'numeric'); code.setAttribute('maxlength', recovery ? '24' : '6'); code.removeAttribute('pattern'); if (!recovery) code.setAttribute('pattern', '[0-9]*');
          code.classList.toggle('dc-input--code', !recovery); label.textContent = recovery ? T.recoveryCode : T.stepsCode; hint.textContent = recovery ? T.recoveryHint : T.stepsCodeHint; toggle.textContent = recovery ? T.useApp : T.useRecovery; code.focus();
        } }, T.useRecovery);
        var send = async function () {
          var v = code.value.trim(); if (!v) { code.setAttribute('aria-invalid', 'true'); say(box, T.errCodeEmpty); code.focus(); return; }
          code.removeAttribute('aria-invalid'); busy(true, go);
          try { next(await B.code(v)); } catch (e) { busy(false, go); code.setAttribute('aria-invalid', 'true'); if (e && e.code === 'rate') return waiting(e.wait, boot); fail(box, e); restart(e); code.select(); }
        };
        code.addEventListener('input', function () { if (!recovery) { code.value = code.value.replace(/\D/g, '').slice(0, 6); if (code.value.length === 6) send(); } });
        kids.push(h('form', { class: 'dc-form', novalidate: true, onsubmit: function (ev) { ev.preventDefault(); send(); } }, h('div', { class: 'dc-field' }, label, code, hint), box, go, toggle));
        if (need.indexOf('passkey') < 0) focusEl = code;
      } else kids.push(box);
      kids.push(h('button', { type: 'button', class: 'dc-btn dc-btn--ghost dc-btn--block', onclick: boot }, T.cancel));
      screen('steps', [title(T.stepsTitle), kids], focusEl);
    }

    function recoveryNotice(n) {
      screen('notice', [h('div', { class: 'dc-state' }, h('div', { class: 'dc-state__icon' }, icon('key')), h('h1', { class: 'dc-state__title dc-entrada__title', text: T.recoveryUsed }), h('p', { class: 'dc-muted', text: T.recoveryLeft(n) }), h('button', { type: 'button', class: 'dc-btn dc-btn--primary dc-btn--lg', onclick: done }, T.continue))]);
    }

    function waiting(sec, back) {
      sec = sec > 0 ? Math.round(sec) : 0;
      var live = h('p', { class: 'dc-sr-only', role: 'status', 'aria-live': 'polite' }), time = h('p', { class: 'dc-entrada__clock dc-num', 'aria-hidden': 'true' });
      var btn = h('button', { type: 'button', class: 'dc-btn dc-btn--primary dc-btn--lg', onclick: back || boot }, icon('refresh'), T.retryNow), text = h('p', { class: 'dc-muted' });
      btn.disabled = sec > 0;
      var paint = function () { time.textContent = sec > 0 ? clock(sec) : ''; time.hidden = sec <= 0; };
      text.textContent = sec > 0 ? T.waitText : T.waitUnknown;
      screen('wait', [h('div', { class: 'dc-state' }, h('div', { class: 'dc-state__icon' }, icon('lock')), h('h1', { class: 'dc-state__title dc-entrada__title', text: T.waitTitle }), text, time, live, btn)]);
      paint(); if (sec > 0) live.textContent = T.waitIn(fmtTime(sec, T));
      if (sec > 0) {
        var end = Date.now() + sec * 1000;
        var iv = setInterval(function () {
          sec = Math.max(0, Math.round((end - Date.now()) / 1000)); paint();
          if (sec === 0) { clearInterval(iv); btn.disabled = false; live.textContent = T.waitDone; text.textContent = T.waitDone; btn.focus(); }
        }, 1000); timers.push(iv);
      }
    }

    function lock() {
      var box = msgBox(), pin = '', working = false, key = offer();
      var status = h('p', { class: 'dc-sr-only', role: 'status', 'aria-live': 'polite' });
      var useKey = async function () { say(box, ''); try { after(await B.passkeyLogin()); } catch (e) { fail(box, e); if (e && e.code === 'rate') waiting(e.wait, lock); } };
      var logout = h('button', { type: 'button', class: 'dc-btn dc-btn--ghost dc-btn--block', onclick: async function () { await B.logout(); boot(); } }, S.hasPin && allow('pin') ? T.pinForgot : T.logout);
      var head = title(T.lockTitle, T.lockHint(S.lockMinutes || o.lockMinutes));
      if (!(S.hasPin && allow('pin'))) {
        if (key) return screen('lock', [head, passkeyBtn(T.passkey, useKey), box, logout]);
        var pw = passwordField('dc-pw', T.password), go = h('button', { type: 'submit', class: 'dc-btn dc-btn--lg dc-btn--block dc-btn--primary' }, T.signIn);
        return screen('lock', [head, h('p', { class: 'dc-hint', text: T.noPinNoKey }), h('form', { class: 'dc-form', novalidate: true, onsubmit: async function (ev) { ev.preventDefault(); say(box, ''); busy(true, go); try { after(await B.login(pw.input.value)); } catch (e) { busy(false, go); if (e && e.code === 'rate') return waiting(e.wait, lock); fail(box, e); pw.input.select(); } } }, pw.node, box, go), logout], pw.input);
      }
      if (o.pinType === 'text') {
        var pf = h('input', { class: 'dc-input', id: 'dc-pin', name: 'pin', type: 'password', autocomplete: 'off', autocapitalize: 'none', spellcheck: 'false', 'aria-label': T.pinTitle });
        var ub = h('button', { type: 'submit', class: 'dc-btn dc-btn--lg dc-btn--block dc-btn--primary' }, T.pinUnlock);
        return screen('lock', [head, h('form', { class: 'dc-form', novalidate: true, onsubmit: async function (ev) { ev.preventDefault(); say(box, ''); if (!pf.value) return pf.focus(); busy(true, ub); try { await B.unlock(pf.value); done(); } catch (e) { busy(false, ub); pf.value = ''; if (e && e.code === 'rate') return waiting(e.wait, lock); fail(box, e, 'pin'); if (e && e.code === 'revoked') timers.push(setTimeout(boot, 2200)); pf.focus(); } } },
          h('div', { class: 'dc-field' }, h('label', { class: 'dc-label', for: 'dc-pin', text: T.pinTitle }), pf), box, ub), key ? passkeyBtn(T.useKey, useKey, false) : null, logout], pf);
      }
      /* teclado numérico */
      var dots = h('div', { class: 'dc-dots', 'aria-hidden': 'true' });
      var paint = function () {
        var n = Math.max(o.pinMin, Math.min(o.pinMax, pin.length)); if (pin.length > n) n = pin.length;
        dots.replaceChildren.apply(dots, Array.from({ length: o.pinFixed ? o.pinMax : n }, function (_, i) { return h('i', { class: i < pin.length ? 'is-on' : '' }); }));
        status.textContent = T.pinDigits(pin.length); okBtn.disabled = working || pin.length < o.pinMin;
      };
      var okBtn = h('button', { type: 'button', class: 'dc-btn dc-btn--lg dc-btn--block dc-btn--primary', onclick: function () { submit(); } }, T.pinUnlock);
      var submit = async function () {
        if (working || pin.length < o.pinMin) return; working = true; say(box, ''); card.setAttribute('aria-busy', 'true'); pad.classList.add('is-busy'); paint();
        try { await B.unlock(pin); done(); }
        catch (e) {
          working = false; pin = ''; card.setAttribute('aria-busy', 'false'); pad.classList.remove('is-busy'); paint();
          if (e && e.code === 'rate') return waiting(e.wait, lock);
          card.classList.remove('dc-shake'); void card.offsetWidth; card.classList.add('dc-shake'); fail(box, e, 'pin'); if (e && e.code === 'revoked') timers.push(setTimeout(boot, 2200));
        }
      };
      var press = function (d) { if (working || pin.length >= o.pinMax) return; pin += d; paint(); if (o.pinFixed && pin.length === o.pinMax) submit(); };
      var del = function () { if (working) return; pin = pin.slice(0, -1); paint(); };
      var keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(function (d) { return h('button', { type: 'button', class: 'dc-pad__key', 'aria-label': d, onclick: function () { press(d); } }, d); });
      var pad = h('div', { class: 'dc-pad', role: 'group', 'aria-label': T.pinKeys }, keys,
        key ? h('button', { type: 'button', class: 'dc-pad__key dc-pad__key--aux', 'aria-label': T.useKey, onclick: useKey }, icon('fingerprint')) : h('span', { 'aria-hidden': 'true' }),
        h('button', { type: 'button', class: 'dc-pad__key', 'aria-label': '0', onclick: function () { press('0'); } }, '0'),
        h('button', { type: 'button', class: 'dc-pad__key dc-pad__key--aux', 'aria-label': T.pinDelete, onclick: del }, icon('backspace')));
      keyHandler = function (ev) {
        var t = ev.target && ev.target.tagName; if (t === 'INPUT' || t === 'TEXTAREA' || ev.ctrlKey || ev.metaKey || ev.altKey) return;
        if (/^\d$/.test(ev.key)) { ev.preventDefault(); press(ev.key); } else if (ev.key === 'Backspace') { ev.preventDefault(); del(); } else if (ev.key === 'Escape') { pin = ''; paint(); } else if (ev.key === 'Enter' && t !== 'BUTTON') { ev.preventDefault(); submit(); }
      };
      rootEl.addEventListener('keydown', keyHandler);
      screen('lock', [head, h('p', { class: 'dc-entrada__pinlabel', text: T.pinTitle }), dots, status, box, pad, o.pinFixed ? null : okBtn, logout]);
      paint();
    }

    function setup() {
      var box = msgBox(), code = h('input', { class: 'dc-input', id: 'dc-setup-code', name: 'setup-code', type: 'password', autocomplete: 'off', required: true });
      var p1 = passwordField('dc-new', T.newPassword, { auto: 'new-password', name: 'new-password', hint: T.passwordRule(o.minPassword) }), p2 = passwordField('dc-new2', T.repeatPassword, { auto: 'new-password', name: 'new-password-2' });
      var go = h('button', { type: 'submit', class: 'dc-btn dc-btn--lg dc-btn--block dc-btn--primary' }, T.createEnter);
      screen('setup', [title(T.setupTitle, T.setupText), h('form', { class: 'dc-form', novalidate: true, onsubmit: async function (ev) {
        ev.preventDefault(); say(box, '');
        if (p1.input.value.length < o.minPassword) { p1.input.setAttribute('aria-invalid', 'true'); say(box, T.errShort(o.minPassword)); return p1.input.focus(); }
        p1.input.removeAttribute('aria-invalid');
        if (p1.input.value !== p2.input.value) { p2.input.setAttribute('aria-invalid', 'true'); say(box, T.errMismatch); return p2.input.focus(); }
        p2.input.removeAttribute('aria-invalid'); busy(true, go);
        try { await B.setup({ code: code.value, password: p1.input.value }); done(); } catch (e) { busy(false, go); fail(box, e, 'setup'); code.focus(); }
      } }, h('div', { class: 'dc-field' }, h('label', { class: 'dc-label', for: 'dc-setup-code', text: T.setupCode }), code), p1.node, p2.node, box, go)], code);
    }

    /* ---- arranque ---- */
    async function boot() {
      loading();
      try { S = await B.state(); } catch (e) { return problem(e && e.code === 'network' ? 'offline' : 'server'); }
      if (!S.configured && !S.needsSetup) return notConfigured();
      if (S.needsSetup) return setup();
      if (S.authed && S.unlocked) return done();
      if (S.authed) return lock();
      login();
    }
    window.addEventListener('online', function () { if (card.getAttribute('data-screen') === 'error') boot(); });
    boot();
    return { boot: boot };
  }

  root.DCEntrada = { init: init, strings: STR };
  /* arranque automático si el contenedor lleva data-auto (por defecto sí) */
  if (typeof document !== 'undefined') {
    var go = function () { var el = document.getElementById('dc-entrada'); if (el && el.getAttribute('data-auto') !== '0' && !el.__dcInit) { el.__dcInit = true; init({ root: el }); } };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
  }
})(typeof window !== 'undefined' ? window : globalThis);
