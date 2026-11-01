(() => {
  const $ = (id) => document.getElementById(id);

  function el(tag, props, ...hijos) {
    const e = document.createElement(tag);
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        if (k === 'class') e.className = v;
        else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
        else if (v !== undefined && v !== null && v !== false) e.setAttribute(k, v);
      }
    }
    for (const h of hijos.flat()) if (h !== null && h !== undefined && h !== false) e.append(h.nodeType ? h : document.createTextNode(h));
    return e;
  }

  const fecha = (iso) => (iso ? new Date(iso).toLocaleDateString('es-ES') : '—');
  const fechaHora = (iso) => (iso ? new Date(iso).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }) : 'nunca');

  function mostrarError(msg) {
    const e = $('error');
    e.textContent = msg || '';
    e.hidden = !msg;
  }

  async function api(url, opciones) {
    const r = await fetch(url, opciones);
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || 'Error ' + r.status);
    return d;
  }

  async function copiar(texto, boton) {
    try {
      await navigator.clipboard.writeText(texto);
    } catch (e) {
      const t = el('textarea', { style: 'position:fixed;opacity:0' }, texto);
      document.body.append(t);
      t.select();
      document.execCommand('copy');
      t.remove();
    }
    const antes = boton.textContent;
    boton.textContent = '¡Copiado!';
    setTimeout(() => { boton.textContent = antes; }, 1500);
  }

  function invitacion(fila) {
    const base = location.origin;
    return `Hola, aquí tienes tu código para usar Quest gratis: ${fila.codigo}\n` +
      `Entra en ${base}/profesor e introdúcelo (no hace falta registrarse).\n` +
      `Instrucciones: ${base}/ayuda`;
  }

  function tarjetaNuevo(fila) {
    const b1 = el('button', { class: 'btn secundario', type: 'button' }, 'Copiar código');
    b1.addEventListener('click', () => copiar(fila.codigo, b1));
    const b2 = el('button', { class: 'btn', type: 'button' }, 'Copiar mensaje de invitación');
    b2.addEventListener('click', () => copiar(invitacion(fila), b2));
    $('nuevo').replaceChildren(el('div', { class: 'codigo-nuevo', id: 'codigo-nuevo' },
      el('div', null, el('div', null, 'Código para ', el('strong', null, fila.etiqueta)), el('div', { class: 'codigo-mono', id: 'codigo-nuevo-texto' }, fila.codigo)),
      b1, b2));
  }

  async function cargar() {
    const [codigos, estado] = await Promise.all([api('/api/admin/codigos'), api('/api/admin/estado')]);
    $('estado-servidor').textContent =
      `${estado.partidasActivas} partidas activas · ${estado.jugadoresEnPartidas} alumnos jugando`;

    if (!codigos.length) {
      $('tabla').replaceChildren(el('div', { class: 'vacio' }, 'Todavía no has creado ningún código.'));
      return;
    }
    const cuerpo = el('tbody');
    for (const f of codigos) {
      const bCopiar = el('button', { class: 'link', type: 'button' }, 'Copiar');
      bCopiar.addEventListener('click', () => copiar(f.codigo, bCopiar));
      const bInv = el('button', { class: 'link', type: 'button' }, 'Invitación');
      bInv.addEventListener('click', () => copiar(invitacion(f), bInv));
      const bRevocar = el('button', { class: 'link' + (f.estado === 'revocado' ? '' : ' rojo'), type: 'button', 'data-accion': 'revocar' },
        f.estado === 'revocado' ? 'Reactivar' : 'Revocar');
      bRevocar.addEventListener('click', async () => {
        const revocar = f.estado !== 'revocado';
        if (revocar && !confirm(`¿Revocar el código de ${f.etiqueta}? Dejará de funcionar y se cerrarán sus partidas abiertas.`)) return;
        try { await api('/api/admin/codigos/' + f.id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ revocado: revocar }) }); await cargar(); } catch (e) { mostrarError(e.message); }
      });
      const bBorrar = el('button', { class: 'link rojo', type: 'button', 'data-accion': 'borrar' }, 'Borrar');
      bBorrar.addEventListener('click', async () => {
        if (!confirm(`¿Borrar definitivamente el código de ${f.etiqueta}?`)) return;
        try { await api('/api/admin/codigos/' + f.id, { method: 'DELETE' }); await cargar(); } catch (e) { mostrarError(e.message); }
      });
      cuerpo.append(el('tr', { 'data-id': String(f.id) },
        el('td', null, f.etiqueta),
        el('td', null, el('span', { class: 'codigo-mono' }, f.codigo)),
        el('td', null, fecha(f.creado)),
        el('td', null, f.caduca ? fecha(f.caduca + 'T12:00:00') : '—'),
        el('td', null, fechaHora(f.ultimoUso)),
        el('td', { class: 'num' }, String(f.partidas)),
        el('td', { class: 'num' }, f.enVivo.activas ? `${f.enVivo.activas} (${f.enVivo.jugadores} alumnos)` : '—'),
        el('td', null, el('span', { class: 'etiqueta-estado ' + f.estado }, f.estado)),
        el('td', null, el('div', { class: 'acciones-fila' }, bCopiar, bInv, bRevocar, bBorrar))));
    }
    $('tabla').replaceChildren(el('table', null,
      el('thead', null, el('tr', null,
        el('th', null, 'Persona'), el('th', null, 'Código'), el('th', null, 'Creado'), el('th', null, 'Caduca'),
        el('th', null, 'Último uso'), el('th', { class: 'num' }, 'Partidas'), el('th', { class: 'num' }, 'En directo'),
        el('th', null, 'Estado'), el('th', null, ''))),
      cuerpo));
  }

  $('btn-crear').addEventListener('click', async () => {
    mostrarError('');
    try {
      const fila = await api('/api/admin/codigos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ etiqueta: $('in-etiqueta').value, caduca: $('in-caduca').value || null }),
      });
      $('in-etiqueta').value = '';
      $('in-caduca').value = '';
      tarjetaNuevo(fila);
      await cargar();
    } catch (e) {
      mostrarError(e.message);
    }
  });

  $('in-etiqueta').addEventListener('keydown', (ev) => { if (ev.key === 'Enter') $('btn-crear').click(); });

  cargar().catch((e) => mostrarError(e.message));
  setInterval(() => cargar().catch(() => {}), 15000);
})();
