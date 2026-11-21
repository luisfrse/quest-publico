'use strict';
/* diseno-comun · iconos.js — GENERADO por tools/crear-iconos.js. No lo edites: cambia iconos/svg/*.svg y vuelve a generarlo.
   Uso en HTML:  <span class="dc-icon" data-icon="home" aria-hidden="true"></span>   (se rellena solo al cargar; o llama a DCIcons.upgrade(raiz))
   Uso en JS:    el.append(DCIcons.svg('lock'))   →   <svg class="dc-icon__svg" viewBox="0 0 24 24" aria-hidden="true">…</svg>
   Todos los iconos: viewBox 24, trazo 1,75, extremos y uniones redondeados, color = currentColor (heredan el color del texto). */
(function (root) {
  var P = {
 "activity": "M3 12h4l3-8 4 16 3-8h4",
 "alert": "M12 4 2.8 19.5h18.4zM12 10v4.5M12 17.5h.01",
 "arrow-left": "M19 12H5M11 5l-7 7 7 7",
 "arrow-right": "M5 12h14M13 5l7 7-7 7",
 "backspace": "M9 5.5h11v13H9L3 12zM12.5 9.5l5 5M17.5 9.5l-5 5",
 "bell": "M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15zM10 21h4",
 "book": "M4 5.5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2zM4 20.5a2 2 0 0 1 2-2h13M8.5 8h6",
 "calendar": "M4.5 6h15v14h-15zM4.5 10.5h15M8.5 3.5V7M15.5 3.5V7",
 "cart": "M3 4.5h2.5l2 11h10.5l2-8H6.5M9.5 20h.01M17 20h.01",
 "chart": "M4 20V4M4 20h16M8.5 16v-5M13 16V8M17.5 16v-3",
 "check-circle": "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 12.2l2.8 2.8 5.2-5.6",
 "check": "M4.5 12.5 9.5 17.5 19.5 6.5",
 "chevron-down": "M5 9l7 7 7-7",
 "chevron-left": "M15 5l-7 7 7 7",
 "chevron-right": "M9 5l7 7-7 7",
 "chevron-up": "M5 15l7-7 7 7",
 "clock": "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5.5l3.5 2",
 "cloud": "M7.5 19a4.5 4.5 0 0 1-.5-8.97 5.5 5.5 0 0 1 10.6 1.2A3.9 3.9 0 0 1 17 19z",
 "copy": "M9 9h11v11H9zM15 9V4H4v11h5",
 "download": "M12 4v11M7.5 10.5 12 15l4.5-4.5M5 20h14",
 "dumbbell": "M6.5 7.5v9M3.5 10v4M17.5 7.5v9M20.5 10v4M6.5 12h11",
 "edit": "M4 20l1-4.5L16.5 4a2.1 2.1 0 0 1 3 3L8 18.5zM14.5 6l3 3",
 "external": "M13 4.5h6.5V11M19.5 4.5 11 13M17 14v5.5H4.5V7H10",
 "eye-off": "M3 3l18 18M10 5.7c.6-.1 1.3-.2 2-.2 6 0 9.5 6.5 9.5 6.5s-.9 1.6-2.5 3.2M6.5 7C3.9 8.8 2.5 12 2.5 12S6 18.5 12 18.5c1.5 0 2.8-.4 4-.9M9.9 9.9a3 3 0 0 0 4.2 4.2",
 "eye": "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
 "file": "M6.5 3h7l4.5 4.5V21H6.5zM13.5 3v4.5H18M9 13h6M9 17h6",
 "fingerprint": "M4 9a8.5 8.5 0 0 1 16 0M7 12a5 5 0 0 1 10 0v2c0 2.5-.6 4.5-1.7 6.3M7 12v3c0 1.8-.3 3-.9 4.2M12 11.5v3c0 2.3-.5 4-1.4 5.5",
 "flag": "M5 21V4M5 4.5h12l-2 4 2 4H5",
 "flask": "M9.5 3.5h5M10 3.5v6L4.5 19a1.5 1.5 0 0 0 1.3 2.2h12.4A1.5 1.5 0 0 0 19.5 19L14 9.5v-6M7.5 15h9",
 "folder": "M3.5 6.5h6l2 2.5h9v10.5h-17z",
 "graduation": "M2.5 9 12 4.5 21.5 9 12 13.5zM6.5 11.5V16c1.5 1.5 3.2 2.3 5.5 2.3s4-.8 5.5-2.3v-4.5M21.5 9v5",
 "heart-pulse": "M12 20.5S3.5 15.5 3.5 9.2A4.7 4.7 0 0 1 12 6.6a4.7 4.7 0 0 1 8.5 2.6c0 6.3-8.5 11.3-8.5 11.3zM6.5 12.5h3l1.5-3 2.5 5 1.5-2h2.5",
 "home": "M3.5 11 12 3.8l8.5 7.2M5.5 9.7V20h13V9.7M10 20v-6h4v6",
 "info": "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5.5M12 7.8h.01",
 "key": "M7.5 20.5a4 4 0 1 1 0-8 4 4 0 0 1 0 8zM10.4 13.6 20 4M16.5 7.5l3 3M13.5 10.5l2 2",
 "life-buoy": "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5.6 5.6l3 3M15.4 15.4l3 3M18.4 5.6l-3 3M8.6 15.4l-3 3",
 "link": "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
 "lock": "M6 11h12v9.5H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3M12 15v2.5",
 "log-out": "M10 4.5H5v15h5M14.5 8l4 4-4 4M18.5 12h-9",
 "mail": "M3.5 5.5h17v13h-17zM3.8 6.5 12 13l8.2-6.5",
 "map-pin": "M12 21s-6.5-5.8-6.5-11a6.5 6.5 0 0 1 13 0c0 5.2-6.5 11-6.5 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
 "menu": "M4 6.5h16M4 12h16M4 17.5h16",
 "minus": "M5 12h14",
 "moon": "M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z",
 "more": "M5 12a1 1 0 1 0 2 0 1 1 0 0 0-2 0M11 12a1 1 0 1 0 2 0 1 1 0 0 0-2 0M17 12a1 1 0 1 0 2 0 1 1 0 0 0-2 0",
 "offline": "M3 3l18 18M5 9.5a10 10 0 0 1 4-2.3M19 9.5a10 10 0 0 0-5-2.8M8 13a6 6 0 0 1 2.5-1.3M16 13a6 6 0 0 0-1.8-1.2M12 18h.01",
 "phone": "M7 3.5h10v17H7zM11 17.5h2",
 "plus": "M12 5v14M5 12h14",
 "refresh": "M20 11a8 8 0 0 0-14.5-3.5M4 4v4h4M4 13a8 8 0 0 0 14.5 3.5M20 20v-4h-4",
 "search": "M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15zM16 16l5 5",
 "server": "M4 4.5h16v6H4zM4 13.5h16v6H4zM7.5 7.5h.01M7.5 16.5h.01",
 "settings": "M4 7h9M17 7h3M4 17h3M11 17h9M15 4.5v5M9 14.5v5",
 "shield-check": "M12 3 4.5 6v5.5c0 4.5 3.1 8 7.5 9.5 4.4-1.5 7.5-5 7.5-9.5V6zM8.8 12l2.2 2.2 4.2-4.4",
 "shield": "M12 3 4.5 6v5.5c0 4.5 3.1 8 7.5 9.5 4.4-1.5 7.5-5 7.5-9.5V6z",
 "star": "M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9L3.5 9.7l5.9-.8z",
 "sun": "M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4",
 "tag": "M3.5 12.5v-8h8l9 9-8 8zM8 8.5h.01",
 "trash": "M4.5 6.5h15M9.5 6.5V4h5v2.5M6.5 6.5l1 14h9l1-14M10 10.5v6M14 10.5v6",
 "unlock": "M6 11h12v9.5H6zM8.5 11V8a3.5 3.5 0 0 1 6.6-1.6M12 15v2.5",
 "upload": "M12 15V4M7.5 8.5 12 4l4.5 4.5M5 20h14",
 "user": "M12 12a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4zM4.5 20.5c.6-3.6 3.6-6 7.5-6s6.9 2.4 7.5 6",
 "users": "M9 11.5a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2zM2.8 19.8c.5-3.2 3-5.2 6.2-5.2s5.7 2 6.2 5.2M16 4.6a3.6 3.6 0 0 1 0 6.8M18.5 14.9c1.6.7 2.6 2.2 2.9 4.4",
 "x-circle": "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9 9l6 6M15 9l-6 6",
 "x": "M6 6l12 12M18 6 6 18"
 };
  var NS = 'http://www.w3.org/2000/svg';
  function svg(name, label) {
    var s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', 'dc-icon__svg'); s.setAttribute('focusable', 'false');
    if (label) { s.setAttribute('role', 'img'); s.setAttribute('aria-label', label); } else s.setAttribute('aria-hidden', 'true');
    var p = document.createElementNS(NS, 'path'); p.setAttribute('d', P[name] || P.info); s.appendChild(p); return s;
  }
  function upgrade(scope) {
    var els = (scope || document).querySelectorAll('[data-icon]');
    for (var i = 0; i < els.length; i++) { if (!els[i].firstChild) els[i].appendChild(svg(els[i].getAttribute('data-icon'))); }
  }
  root.DCIcons = { paths: P, names: Object.keys(P), svg: svg, upgrade: upgrade };
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { upgrade(); }); else upgrade();
  }
})(typeof window !== 'undefined' ? window : globalThis);
