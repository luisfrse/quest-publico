'use strict';
// Ayudas de interfaz comunes a profesor, administración y alumno: iconos propios, creación de nodos, avisos, diálogos propios
// (en lugar de alert/confirm/prompt) y anillo de tiempo. Sin estilos en línea: todo va por clases y CSSOM (CSP style-src 'self').
(function (global) {
  var NS = 'http://www.w3.org/2000/svg';

  // Iconos que Quest necesita y el conjunto común todavía no trae (anotados en el informe): formas de las opciones, jugar, copa, reloj, hoja y lupa.
  if (global.DCIcons) {
    Object.assign(global.DCIcons.paths, {
      'shape-triangle': 'M12 3.5 21.5 20h-19z',
      'shape-diamond': 'M12 2.5 21.5 12 12 21.5 2.5 12z',
      'shape-circle': 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
      'shape-square': 'M4.5 4.5h15v15h-15z',
      play: 'M8 5v14l11-7z',
      trophy: 'M8 4h8v5a4 4 0 0 1-8 0zM8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 13v4M8 20h8M10 17h4',
      hourglass: 'M7 3h10M7 21h10M8 3v4l4 5-4 5v4M16 3v4l-4 5 4 5v4',
      timer: 'M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 9v4l2.5 2M9.5 2h5',
      'file-check': 'M14 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8zM14 3v5h5M9 14.2l2.2 2.2 3.8-4'
    });
  }
  var FORMAS = ['shape-triangle', 'shape-diamond', 'shape-circle', 'shape-square'];
  var LETRAS = ['A', 'B', 'C', 'D'];

  function icono(nombre, etiqueta) {
    if (!global.DCIcons) return document.createTextNode('');
    var w = document.createElement('span'); w.className = 'dc-icon';
    if (!etiqueta) w.setAttribute('aria-hidden', 'true');
    w.append(global.DCIcons.svg(nombre, etiqueta)); return w;
  }
  function formaIcono(i) { return icono(FORMAS[i]); }

  // Nodo con propiedades: class, onXxx (evento), T() traducible o atributo normal; los hijos aceptan texto, nodos y T().
  function el(tag, props) {
    var e = document.createElement(tag);
    var hijos = Array.prototype.slice.call(arguments, 2);
    if (props) Object.keys(props).forEach(function (k) {
      var v = props[k];
      if (k === 'class') e.className = v;
      else if (k.indexOf('on') === 0) e.addEventListener(k.slice(2), v);
      else if (global.I18N.esD(v)) global.I18N.bind(e, k, v);
      else if (v !== undefined && v !== null && v !== false) e.setAttribute(k, v);
    });
    (function pegar(lista) {
      lista.forEach(function (h) {
        if (Array.isArray(h)) return pegar(h);
        if (h === null || h === undefined || h === false) return;
        e.append(global.I18N.esD(h) ? global.I18N.nodo(h) : h.nodeType ? h : document.createTextNode(h));
      });
    })(hijos);
    return e;
  }

  // Botón con icono y texto. opciones: { clase, icono, id, onclick, type, disabled, solo (solo icono: el texto va en aria-label y title) }
  function boton(texto, o) {
    o = o || {};
    var b = el('button', { type: o.type || 'button', id: o.id, class: 'dc-btn ' + (o.clase || 'dc-btn--secondary'), onclick: o.onclick, disabled: o.disabled ? 'disabled' : null });
    if (o.icono) b.append(icono(o.icono));
    if (o.solo) { b.classList.add('dc-btn--icon'); b.setAttribute('aria-label', typeof texto === 'string' ? texto : global.I18N.t(texto.key, texto.vars)); b.setAttribute('title', b.getAttribute('aria-label')); if (global.I18N.esD(texto)) { global.I18N.bind(b, 'aria-label', texto); global.I18N.bind(b, 'title', texto); } } else if (texto !== undefined && texto !== null) b.append(global.I18N.esD(texto) ? global.I18N.nodo(texto) : document.createTextNode(texto));
    return b;
  }

  // Aviso emergente (esquina). lineas: textos o T(); tipo: '' | 'error'. Conserva la clase .toast para las pruebas.
  function toasts() {
    var c = document.getElementById('q-toasts');
    if (!c) { c = el('div', { id: 'q-toasts', class: 'dc-toasts', 'aria-live': 'polite' }); document.body.append(c); }
    return c;
  }
  function aviso(lineas, tipo) {
    var t = el('div', { class: 'dc-toast toast ' + (tipo === 'error' ? 'toast--error' : ''), role: tipo === 'error' ? 'alert' : 'status' },
      icono(tipo === 'error' ? 'x-circle' : 'check-circle'),
      el('div', { class: 'toast__texto' }, [].concat(lineas).map(function (l) { return el('div', null, l); })),
      boton({ key: 'u.cerrar' }, { clase: 'dc-btn--ghost dc-btn--sm toast__cerrar', solo: true, icono: 'x', onclick: function () { t.remove(); } }));
    toasts().append(t);
    setTimeout(function () { t.remove(); }, 8000);
    return t;
  }

  // Diálogo propio. Devuelve una promesa: true/false (confirmar) o texto/null (preguntar). Esc y «Cancelar» devuelven false/null.
  function dialogo(o) {
    return new Promise(function (resolver) {
      var dlg = el('dialog', { class: 'dc-dialog q-dialogo', 'aria-labelledby': 'q-dlg-t' });
      var entrada = null; var resuelto = false;
      var fin = function (v) { if (resuelto) return; resuelto = true; try { dlg.close(); } catch (e) { /* ya cerrado */ } dlg.remove(); resolver(v); };
      var cancelar = boton(global.I18N.T('cancelar'), { clase: 'dc-btn--secondary', id: 'dlg-cancelar', onclick: function () { fin(o.entrada ? null : false); } });
      var ok = boton(o.textoOk || global.I18N.T('u.aceptar'), { clase: o.peligro ? 'dc-btn--danger' : 'dc-btn--primary', id: 'dlg-ok', onclick: function () { fin(o.entrada ? entrada.value : true); } });
      var cuerpo = [el('div', { class: 'q-dialogo__cab' }, el('span', { class: 'q-dialogo__icono' + (o.peligro ? ' q-dialogo__icono--peligro' : '') }, icono(o.icono || (o.peligro ? 'alert' : 'info'))), el('h2', { id: 'q-dlg-t' }, o.titulo || ''))];
      if (o.texto) cuerpo.push(el('p', { class: 'q-dialogo__texto' }, o.texto));
      if (o.entrada) {
        entrada = el('input', { class: 'dc-input', id: 'dlg-input', type: 'text', value: o.valor || '', maxlength: '80', 'aria-labelledby': 'q-dlg-t', autocomplete: 'off' });
        entrada.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); fin(entrada.value); } });
        cuerpo.push(entrada);
      }
      cuerpo.push(el('div', { class: 'dc-dialog__actions' }, cancelar, ok));
      dlg.append.apply(dlg, cuerpo);
      dlg.addEventListener('cancel', function (ev) { ev.preventDefault(); fin(o.entrada ? null : false); });
      dlg.addEventListener('click', function (ev) { if (ev.target === dlg) fin(o.entrada ? null : false); });
      document.body.append(dlg);
      dlg.showModal();
      (entrada || (o.peligro ? cancelar : ok)).focus();
      if (entrada) entrada.select();
    });
  }
  function confirmar(texto, o) { o = o || {}; return dialogo({ titulo: o.titulo || global.I18N.t('u.confirmar'), texto: texto, peligro: o.peligro, textoOk: o.textoOk, icono: o.icono }); }
  function preguntar(texto, valor) { return dialogo({ titulo: texto, entrada: true, valor: valor, icono: 'edit' }); }
  function informar(texto, titulo) {
    return new Promise(function (r) { dialogo({ titulo: titulo || global.I18N.t('u.aviso'), texto: texto, textoOk: global.I18N.T('u.cerrar') }).then(function () { r(); }); });
  }

  // Anillo de tiempo: devuelve { el, texto (nodo con el número), poner(fraccion 0..1) }. El trazo se mueve con CSSOM.
  function anillo(clase, idTexto) {
    var R = 44; var C = 2 * Math.PI * R;
    var wrap = el('div', { class: 'q-anillo ' + (clase || '') });
    var s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 100 100'); s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false');
    var base = document.createElementNS(NS, 'circle'); var arco = document.createElementNS(NS, 'circle');
    [base, arco].forEach(function (c) { c.setAttribute('cx', '50'); c.setAttribute('cy', '50'); c.setAttribute('r', String(R)); });
    base.setAttribute('class', 'q-anillo__base'); arco.setAttribute('class', 'q-anillo__arco');
    arco.style.strokeDasharray = String(C); arco.style.strokeDashoffset = '0';
    s.append(base, arco);
    var texto = el('span', { class: 'q-anillo__num', id: idTexto || null });
    wrap.append(s, texto);
    return { el: wrap, texto: texto, poner: function (f) { arco.style.strokeDashoffset = String(C * (1 - Math.max(0, Math.min(1, f)))); } };
  }

  global.Q = { el: el, boton: boton, icono: icono, formaIcono: formaIcono, FORMAS: FORMAS, LETRAS: LETRAS, aviso: aviso, confirmar: confirmar, preguntar: preguntar, informar: informar, dialogo: dialogo, anillo: anillo };
})(window);
