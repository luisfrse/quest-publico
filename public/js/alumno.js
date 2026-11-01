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

    function error(msg) {
      const e = $('error');
      e.textContent = msg || '';
      e.hidden = !msg;
    }

    function ordinal(n) { return n + 'º'; }

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
          return error((res && res.error) || 'No se pudo entrar');
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
        $('lobby-nombre').textContent = e.nombre;
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
        $('f-pos').textContent = e.pos ? 'Has quedado ' + ordinal(e.pos) + ' de ' + e.jugadores : '';
        $('f-pts').textContent = e.puntos + (e.puntos === 1 ? ' acierto' : ' aciertos');
        mostrar('v-final');
        olvidar();
      }
    });

    socket.on('alumno:expulsado', () => { olvidar(); sesion = null; mostrar('v-entrada'); error('El profesor te ha sacado de la partida.'); });
    socket.on('alumno:cerrada', () => { olvidar(); sesion = null; mostrar('v-entrada'); error('La partida se ha cerrado.'); });

    function pintarPregunta(e) {
      $('p-num').textContent = 'Pregunta ' + (e.indice + 1) + ' de ' + e.total;
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
      $('r-titulo').textContent = e.acierto ? '¡Correcto!' : (sinResp ? 'Sin respuesta' : 'Incorrecto');
      $('r-detalle').textContent = e.acierto ? '' : 'La respuesta correcta era la ' + LETRAS[e.correcta] + ' ' + FORMAS[e.correcta];
      $('r-pos').textContent = (e.pos ? 'Vas ' + ordinal(e.pos) + ' · ' : '') + e.puntos + (e.puntos === 1 ? ' punto' : ' puntos');
      mostrar('v-resultado');
    }

    $('btn-otra').addEventListener('click', () => { olvidar(); sesion = null; $('in-pin').value = ''; mostrar('v-entrada'); });

    // Si hay sesión guardada, intenta volver a entrar al cargar
    if (guardada()) mostrar('v-lobby');
  })();
