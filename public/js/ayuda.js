// Rellena en la guía los límites y el enlace de contacto reales del servidor.
(async () => {
  try {
    const c = await (await fetch('/api/config')).json();
    for (const e of document.querySelectorAll('[data-lim]')) {
      const v = c.limites && c.limites[e.dataset.lim];
      if (v) e.textContent = String(v);
    }
    for (const a of document.querySelectorAll('.enlace-contacto, #enlace-contacto')) {
      if (c.contactUrl) a.href = c.contactUrl;
    }
  } catch (e) { /* se dejan los valores por defecto */ }
})();
