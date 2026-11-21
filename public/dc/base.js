'use strict';
/* diseno-comun · base.js — ayudas mínimas para base.css que necesitan JavaScript porque la CSP no permite style="…".
   - Medidores: <div class="dc-meter" data-value="42"><span></span></div>  → pone --dc-value:42% con la API CSSOM (que la CSP sí permite).
   Llama a DC.meters(raiz) tras pintar medidores nuevos. Se ejecuta solo al cargar. Opcional: si la app no usa medidores, no hace falta. */
(function (root) {
  function meters(scope) {
    var els = (scope || document).querySelectorAll('.dc-meter[data-value]');
    for (var i = 0; i < els.length; i++) { var v = Math.max(0, Math.min(100, parseFloat(els[i].getAttribute('data-value')) || 0)); els[i].style.setProperty('--dc-value', v + '%'); els[i].setAttribute('role', 'meter'); els[i].setAttribute('aria-valuemin', '0'); els[i].setAttribute('aria-valuemax', '100'); els[i].setAttribute('aria-valuenow', String(v)); }
  }
  root.DC = { meters: meters };
  if (typeof document !== 'undefined') { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { meters(); }); else meters(); }
})(typeof window !== 'undefined' ? window : globalThis);
