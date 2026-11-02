  (() => {
    const LETRAS = ['A', 'B', 'C', 'D'];
    const FORMAS = ['▲', '◆', '●', '■'];
    const $ = (id) => document.getElementById(id);
    const vistas = ['v-entrada', 'v-lobby', 'v-pregunta', 'v-enviada', 'v-resultado', 'v-final'];
    const socket = io();

    let sesion = null; // { pin, id, nombre, clase }
    let animacion = null;

    const guardada = () => { try { return JSON.parse(localStorage.getItem('quest-sesion') || 'null'); } catch { return null; } };
    const guardar = (s) => { try { localStorage.setItem('quest-sesion', JSON.stringify(s)); } catch {} };
    const olvidar = () => { try { localStorage.removeItem('quest-sesion'); } catch {} };
    const datosForm = () => { try { return JSON.parse(localStorage.getItem('quest-datos') || 'null') || {}; } catch { return {}; } };

    function mostrar(id) {
      for (const v of vistas) $(v).hidden = v !== id;
      if (id !== 'v-pregunta' && animacion) { cancelAnimationFrame(animacion); animacion = null; }
    }

    // Los errores llegan del servidor como código y se traducen aquí (se vuelven a traducir si cambia el idioma)
    function error(codigo, vars) {
      const e = $('error');
      if (!codigo) { e.textContent = ''; e.hidden = true; return; }
      I18N.setT(e, I18N.has('e.' + codigo) ? 'e.' + codigo : 'e.generico', vars);
      e.hidden = false;
    }

    // --- Formulario de entrada
    const prev = datosForm();
    const params = new URLSearchParams(location.search);
    $('in-pin').value = (params.get('pin') || '').replace(/\D/g, '').slice(0, 6);
    if (prev.nombre) $('in-nombre').value = prev.nombre;
    if (prev.clase) $('in-clase').value = prev.clase;

    function unirse(datos, silencioso) {
      socket.emit('alumno:unirse', datos, (res) => {
        $('btn-entrar').disabled = false;
        if (!res || !res.ok) {
          if (silencioso) { olvidar(); mostrar('v-entrada'); return; }
          return error((res && res.error) || 'no_entrar', res && res.vars);
        }
        error('');
        sesion = { pin: res.pin, id: res.id, nombre: res.nombre, clase: res.clase };
        guardar(sesion);
        try { localStorage.setItem('quest-datos', JSON.stringify({ nombre: res.nombre, clase: res.clase })); } catch {}
      });
    }

    $('form-entrada').addEventListener('submit', (ev) => {
      ev.preventDefault();
      $('btn-entrar').disabled = true;
      const s = guardada();
      const pin = $('in-pin').value.trim();
      unirse({
        pin,
        nombre: $('in-nombre').value,
        clase: $('in-clase').value,
        id: s && s.pin === pin ? s.id : undefined,
      }, false);
    });

    // Reconexión automática (refresco de página o pérdida de cobertura)
    function reintentar() {
      const s = guardada();
      if (s) unirse({ pin: s.pin, nombre: s.nombre, clase: s.clase, id: s.id }, true);
    }
    socket.on('connect', () => { if (sesion || guardada()) reintentar(); });

    // --- Estados
    socket.on('alumno:estado', (e) => {
      if (e.fase === 'lobby') {
        I18N.setT($('lobby-msg'), 'a.dentro', { n: e.nombre });
        mostrar('v-lobby');
      } else if (e.fase === 'pregunta') {
        if (e.respondida !== null && e.respondida !== undefined) {
          mostrar('v-enviada');
          $('v-enviada').className = 'pantalla-color neutro';
        } else {
          pintarPregunta(e);
        }
      } else if (e.fase === 'revelada') {
        pintarResultado(e);
      } else if (e.fase === 'final') {
        if (e.pos) I18N.setT($('f-pos'), 'a.quedado', { pos: e.pos, n: e.jugadores }); else $('f-pos').textContent = '';
        I18N.setT($('f-pts'), 'a.aciertos', { n: e.puntos });
        mostrar('v-final');
        olvidar();
      }
    });

    socket.on('alumno:expulsado', () => { olvidar(); sesion = null; mostrar('v-entrada'); error('expulsado'); });
    socket.on('alumno:cerrada', () => { olvidar(); sesion = null; mostrar('v-entrada'); error('partida_cerrada'); });

    function pintarPregunta(e) {
      I18N.setT($('p-num'), 'a.pregunta_n_de', { i: e.indice + 1, n: e.total });
      const cont = $('p-opciones');
      cont.innerHTML = '';
      cont.className = 'opciones' + (e.nOpciones === 2 ? ' dos' : e.nOpciones === 3 ? ' tres' : '');
      for (let i = 0; i < e.nOpciones; i++) {
        const b = document.createElement('button');
        b.className = 'opcion op-' + i;
        b.innerHTML = '<span class="forma"></span><span class="letra"></span>';
        b.querySelector('.forma').textContent = FORMAS[i];
        b.querySelector('.letra').textContent = LETRAS[i];
        b.addEventListener('click', () => {
          socket.emit('alumno:responder', { opcion: i });
          mostrar('v-enviada');
          $('v-enviada').className = 'pantalla-color op-' + i;
        });
        cont.appendChild(b);
      }
      mostrar('v-pregunta');
      const fin = performance.now() + e.restanteMs;
      const total = e.tiempo * 1000;
      const paso = () => {
        const resto = Math.max(0, fin - performance.now());
        $('p-tiempo').textContent = Math.ceil(resto / 1000) + ' s';
        $('p-barra').style.width = (resto / total * 100) + '%';
        if (resto > 0) animacion = requestAnimationFrame(paso);
      };
      paso();
    }

    function pintarResultado(e) {
      const caja = $('v-resultado');
      const sinResp = e.elegida === null || e.elegida === undefined;
      caja.className = 'pantalla-color ' + (e.acierto ? 'acierto' : 'fallo');
      $('r-icono').textContent = e.acierto ? '✓' : '✗';
      I18N.setT($('r-titulo'), e.acierto ? 'a.correcto' : (sinResp ? 'a.sin_respuesta' : 'a.incorrecto'));
      if (e.acierto) $('r-detalle').textContent = ''; else I18N.setT($('r-detalle'), 'a.era', { l: LETRAS[e.correcta], f: FORMAS[e.correcta] });
      $('r-pos').replaceChildren(...(e.pos ? [I18N.nodo(I18N.T('a.posicion', { pos: e.pos })), ' · '] : []), I18N.nodo(I18N.T('a.puntos', { n: e.puntos })));
      mostrar('v-resultado');
    }

    $('btn-otra').addEventListener('click', () => { olvidar(); sesion = null; $('in-pin').value = ''; mostrar('v-entrada'); });

    // Si hay sesión guardada, intenta volver a entrar al cargar
    if (guardada()) mostrar('v-lobby');
  })();
