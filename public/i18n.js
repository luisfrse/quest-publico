/* Quest · i18n (català / castellano). Diccionarios planos ca y es: al añadir una clave, ponla en los dos (npm test lo comprueba).
   API: I18N.t(clave, vars) · I18N.set(idioma) · I18N.lang · I18N.langs. Es el mismo archivo en las dos apps de Quest. */
(function (global) {
  'use strict';

  var DICT = {
 "ca": {
  "idioma": "Idioma",
  "otros": "Altres",
  "cargando": "Carregant…",
  "volver": "← Torna",
  "cancelar": "Cancel·la",
  "borrar": "Esborra",
  "s": "s",
  "e.generico": "S'ha produït un error. Torna-ho a provar.",
  "e.conexion": "No s'ha pogut connectar amb el servidor.",
  "e.demasiados_intentos": "Massa intents fallits. Espera uns minuts.",
  "e.codigo_invalido": "Codi no vàlid, revocat o caducat.",
  "e.sesion_invalida": "Sessió no vàlida.",
  "e.sesion_caducada": "Sessió caducada. Torna a entrar amb el teu codi.",
  "e.falta_etiqueta": "Escriu a qui correspon el codi.",
  "e.fecha_invalida": "Data de caducitat no vàlida.",
  "e.no_codigo_unico": "No s'ha pogut generar un codi únic.",
  "e.no_existe_codigo": "Aquest codi no existeix.",
  "e.peticion_invalida": "Petició no vàlida.",
  "e.cuestionario_invalido": "Qüestionari no vàlid.",
  "e.cuestionario_vacio": "El qüestionari no té preguntes.",
  "e.max_preguntas": "Màxim {n} preguntes per qüestionari.",
  "e.pregunta_incompleta": "La pregunta {n} està incompleta.",
  "e.max_partidas_codigo": "Ja tens {n} partides obertes. Tanca'n alguna abans de crear-ne una altra.",
  "e.servidor_lleno": "El servidor té el màxim de partides simultànies. Torna-ho a provar d'aquí a uns minuts.",
  "e.no_crear_partida": "No s'ha pogut crear la partida.",
  "e.no_pin_libre": "No s'ha pogut generar un PIN lliure.",
  "e.datos_invalidos": "Dades no vàlides.",
  "e.pin_invalido": "Codi no vàlid o partida acabada.",
  "e.falta_nombre_clase": "Escriu el teu nom i la teva classe.",
  "e.nombre_en_uso": "Ja hi ha algú connectat amb aquest nom i aquesta classe.",
  "e.partida_llena": "La partida és plena.",
  "e.expulsado": "El professor t'ha tret de la partida.",
  "e.partida_cerrada": "La partida s'ha tancat.",
  "e.no_entrar": "No s'ha pogut entrar.",
  "e.codigo_guardado_invalido": "El codi que tenies desat ja no és vàlid. Introdueix-ne un de nou.",
  "e.codigo_revocado": "El teu codi ha estat revocat. Si creus que és un error, contacta amb l'administrador.",
  "e.cuestionario_no_encontrado": "Qüestionari no trobat.",
  "e.sesion_profesor_invalida": "Sessió de professor no vàlida. Recarrega la pàgina.",
  "e.no_preguntas_guardar": "No hi ha preguntes per desar.",
  "e.ninguna_valida": "Cap pregunta és vàlida (cadascuna necessita enunciat, resposta correcta i almenys una d'incorrecta).",
  "e.falta_nombre_cuestionario": "Falta el nom del qüestionari.",
  "e.ya_existe_cuestionario": "Ja existeix un qüestionari amb aquest nom.",
  "e.no_existe_cuestionario": "Aquest qüestionari no existeix.",
  "e.falta_nombre_nuevo": "Falta el nom nou.",
  "e.falta_confirmar": "Cal confirmar l'operació.",
  "e.no_copia": "No s'ha pogut crear la còpia: {m}",
  "e.cuestionario_sin_preguntas": "El qüestionari no té preguntes vàlides.",
  "e.no_leer": "No s'ha pogut llegir: {m}",
  "e.no_autenticar": "No s'ha pogut autenticar. Recarrega la pàgina.",
  "w.fila_incompleta": "Fila {n}: falta l'enunciat, la correcta o alguna d'incorrecta; s'omet.",
  "w.recortada_pregunta": "Fila {n}: enunciat retallat a {max} caràcters.",
  "w.recortada_correcta": "Fila {n}: resposta correcta retallada a {max} caràcters.",
  "w.recortada_incorrecta": "Fila {n}: una resposta incorrecta retallada a {max} caràcters.",
  "w.repetidas": "Fila {n}: hi havia respostes repetides; s'ignoren les duplicades.",
  "w.sin_distintas": "Fila {n}: cap resposta incorrecta diferent de la correcta; s'omet.",
  "w.tiempo": "Fila {n}: temps «{t}» no vàlid; s'usen 20 s.",
  "imp.sin_lector": "No s'ha pogut carregar el lector d'Excel. Recarrega la pàgina.",
  "imp.no_xlsx": "Aquest fitxer no és un Excel (.xlsx) vàlid.",
  "imp.sin_hojas": "L'Excel no té fulls.",
  "imp.no_hoja": "No s'ha pogut llegir el full de l'Excel.",
  "imp.vacio": "El fitxer és buit.",
  "imp.falta_columna": "A la primera fila falta la columna: {c}. Utilitza la plantilla (primera fila: numero, tiempo, pregunta, correcta, incorrecta1, incorrecta2, incorrecta3).",
  "imp.sin_preguntas": "No hi ha cap pregunta completa (enunciat, correcta i almenys una d'incorrecta).",
  "imp.demasiadas": "Té {n} preguntes i el màxim és {max}. Divideix-lo en dos qüestionaris.",
  "imp.grande": "El fitxer és massa gran (màxim 3 MB).",
  "imp.xls": "El format .xls antic no s'admet. Desa'l com a .xlsx o com a CSV.",
  "imp.error": "{m}",
  "bk.no_copia": "Aquest fitxer no és una còpia de seguretat de Quest.",
  "bk.sin_espacio": "No hi ha espai en aquest navegador per importar la còpia.",
  "csv.fecha": "data",
  "csv.nombre": "nom",
  "csv.clase": "classe",
  "csv.cuestionario": "qüestionari",
  "csv.fallos": "errors",
  "csv.puntuacion": "puntuació total",
  "csv.tiempo_total": "temps total (s)",
  "csv.pregunta_n": "pregunta núm.",
  "csv.pregunta": "pregunta",
  "csv.resp_alumno": "resposta de l'alumne",
  "csv.resp_correcta": "resposta correcta",
  "csv.acierto": "encert",
  "csv.tiempo_s": "temps (s)",
  "csv.sin_resp": "(sense resposta)",
  "csv.si": "sí",
  "csv.no": "no",
  "a.doc": "Quest",
  "a.codigo_partida": "Codi de la partida",
  "a.tu_nombre": "El teu nom",
  "a.nombre_ph": "Nom (i cognom si n'hi ha de repetits)",
  "a.tu_clase": "La teva classe",
  "a.clase_ph": "Ex.: 1A, 2B…",
  "a.entrar": "Entra",
  "a.soy_profe": "Sóc professor",
  "a.dentro": "Ja ets dins, {n}!",
  "a.mira_pantalla": "Mira la pantalla de la classe. Esperant que comenci el joc…",
  "a.pie_toca": "Mira la pantalla i toca el color de la teva resposta",
  "a.enviada": "Resposta enviada",
  "a.espera_resto": "Esperant la resta de la classe…",
  "a.pregunta_n_de": "Pregunta {i} de {n}",
  "a.correcto": "Correcte!",
  "a.incorrecto": "Incorrecte",
  "a.sin_respuesta": "Sense resposta",
  "a.era": "La resposta correcta era la {l} {f}",
  "a.posicion": "Posició {pos}",
  "a.puntos": "{n} punts",
  "a.puntos#1": "{n} punt",
  "a.aciertos": "{n} encerts",
  "a.aciertos#1": "{n} encert",
  "a.fin": "Fi del qüestionari!",
  "a.quedado": "Has quedat en la posició {pos} de {n}",
  "a.salir": "Surt",
  "p.doc": "Quest · Professor",
  "p.contacto_fuerte": "Vols fer servir Quest gratis?",
  "p.contacto_texto": "Si no tens codi, contacta amb mi des de l'apartat de contacte del web i te'n donaré un.",
  "p.contacto_enlace": "Ves a la pàgina de contacte",
  "p.guia_pdf": "Descarrega les instruccions (PDF)",
  "p.ver_instr": "Mostra les instruccions",
  "p.acceso_titulo": "Quest per a professors",
  "p.acceso_nota": "Entra amb el codi d'invitació que t'han facilitat.",
  "p.codigo_inv": "Codi d'invitació",
  "p.recordar": " Recorda el codi en aquest navegador",
  "p.entrar": "Entra",
  "p.mis_cuestionarios": "Els meus qüestionaris",
  "p.crear_partida": "Crea la partida",
  "p.n_cuestionarios": "{n} qüestionaris",
  "p.n_cuestionarios#1": "{n} qüestionari",
  "p.n_preguntas": "{n} preguntes",
  "p.n_preguntas#1": "{n} pregunta",
  "p.cambiar_nombre": "Canvia el nom",
  "p.eliminar": "Elimina",
  "p.buscar": "Cerca un qüestionari…",
  "p.plantilla": "Descarrega la plantilla",
  "p.plantilla_xlsx": "Plantilla Excel (.xlsx)",
  "p.plantilla_csv": "Plantilla CSV (.csv)",
  "p.plantilla_para": "Plantilla per importar: ",
  "p.copia": "Còpia de seguretat",
  "p.exportar_copia": "Exporta la còpia (.json)",
  "p.importar_copia": "Importa una còpia…",
  "p.pasos_titulo": "Comença en tres passos",
  "p.paso1": "Descarrega la plantilla (Excel o CSV).",
  "p.paso2": "Escriu les preguntes seguint les columnes.",
  "p.paso3": "Prem «Importa un qüestionari» i tria el fitxer, o arrossega'l fins aquí.",
  "p.consejo": "Consell: anomena els fitxers ASSIGNATURA_Tema (per exemple C6_U1_Instrumental) i Quest els agruparà en carpetes per assignatura.",
  "p.importar": "Importa un qüestionari",
  "p.nota_navegador": "Els teus qüestionaris es desen només en aquest navegador, no al servidor. Fes una còpia de seguretat de tant en tant i conserva els fitxers originals.",
  "p.sin_almacen": "Aquest navegador no permet desar dades (mode privat?). Podràs jugar, però els qüestionaris no es conservaran.",
  "p.historial": "Historial ({n})",
  "p.instrucciones_pdf": "Instruccions (PDF)",
  "p.salir": "Surt",
  "p.prompt_renombrar": "Nou nom del qüestionari.\nUtilitza ASSIGNATURA_Tema per agrupar-lo en una carpeta:",
  "p.nombre_repetido": "Ja tens un altre qüestionari amb aquest nom.",
  "p.no_guardar_cambio": "No s'ha pogut desar el canvi.",
  "p.confirm_eliminar": "Vols eliminar «{t}» d'aquest navegador? No es pot desfer.",
  "p.imp_archivo": "Fitxer: {f}",
  "p.imp_nombre": "Nom del qüestionari (ASSIGNATURA_Tema l'agrupa en una carpeta)",
  "p.imp_sustituye": "Ja tens un qüestionari amb aquest nom: se substituirà.",
  "p.imp_validas": "{n} preguntes vàlides",
  "p.imp_validas#1": "{n} pregunta vàlida",
  "p.imp_tiempo_medio": " · temps mitjà {t} s",
  "p.imp_n_avisos": " · {n} avisos",
  "p.imp_n_avisos#1": " · {n} avís",
  "p.imp_avisos": "Avisos ({n})",
  "p.imp_mas": "… i {n} més",
  "p.imp_asi": "Així es veurà (primeres preguntes)",
  "p.imp_guardar": "Desa a la meva biblioteca",
  "p.imp_omitir": "Omet aquest fitxer",
  "p.imp_cancelar": "Cancel·la",
  "p.imp_cancelar_resto": "Cancel·la la resta",
  "p.imp_no_espacio": "No s'ha pogut desar: el navegador no té espai o bloqueja l'emmagatzematge.",
  "p.imp_guardado": "«{t}» desat ({n} preguntes).",
  "p.copia_importada": "Còpia importada: {c} qüestionaris i {p} partides noves.",
  "p.copia_importada_d": "Còpia importada: {c} qüestionaris i {p} partides noves ({d} elements no vàlids descartats).",
  "p.hist_titulo": "Historial de partides",
  "p.hist_nota": "L'historial és només en aquest navegador (desa les últimes 60 partides). Descarrega els CSV que vulguis conservar.",
  "p.hist_vacio": "Encara no hi ha partides desades.",
  "p.hist_resumen": "{f} · {n} alumnes · {c}",
  "p.hist_resumen#1": "{f} · {n} alumne · {c}",
  "p.th_pos": "Pos.",
  "p.th_nombre": "Nom",
  "p.th_clase": "Classe",
  "p.th_puntos": "Punts",
  "p.th_fallos": "Errors",
  "p.th_tiempo": "Temps (encerts)",
  "p.dl_notas": "Descarrega les notes (CSV)",
  "p.dl_detalle": "Descarrega el detall (CSV)",
  "p.dl_todas": "Descarrega totes les notes (CSV)",
  "p.confirm_borrar_partida": "Vols esborrar aquesta partida de l'historial? No es pot desfer.",
  "p.esperando": "Esperant que entrin els alumnes…",
  "p.sacar": "Treu de la partida",
  "p.qr_alt": "Codi QR per entrar",
  "p.entra_movil": "Entra des del mòbil a ",
  "p.introduce_codigo": "i escriu el codi",
  "p.o_qr": "o escaneja el QR",
  "p.no_qr": "No s'ha pogut carregar el QR",
  "p.n_dentro": "{n} alumnes dins",
  "p.n_dentro#1": "{n} alumne dins",
  "p.empezar": "Comença",
  "p.confirm_cancelar": "Vols cancel·lar la partida? Els alumnes que ja hagin entrat seran desconnectats.",
  "p.han_respondido": "{r} de {n} han respost",
  "p.respondieron": "{r} de {n} van respondre",
  "p.terminar": "Acaba",
  "p.mostrar_resp": "Mostra la resposta",
  "p.siguiente": "Següent",
  "p.ver_finales": "Mostra els resultats finals",
  "p.confirm_terminar": "Vols acabar la partida ara? Compten les preguntes amb la resposta ja mostrada.",
  "p.ranking": "Rànquing",
  "p.ranking_antes": "Rànquing (abans d'aquesta pregunta)",
  "p.clasif_final": "Classificació final",
  "p.sin_punt": "Encara no hi ha puntuacions",
  "p.pts": "{n} pts",
  "p.fin": "Fi del qüestionari!",
  "p.descarga_ahora": "Descarrega els resultats ara.",
  "p.srv_no_guarda_ok": " El servidor no els desa, però també queden a l'historial d'aquest navegador.",
  "p.srv_no_guarda_ko": " El servidor no els desa i no s'han pogut desar a l'historial d'aquest navegador.",
  "p.sin_resultados": "No s'ha arribat a puntuar cap pregunta, per tant no hi ha resultats per desar.",
  "p.nueva": "Partida nova",
  "p.pin": "PIN {p}",
  "r.doc_profesor": "Quest · Professor",
  "r.elige": "Tria un qüestionari",
  "r.resultados_ant": "Resultats anteriors",
  "r.vacio": "Encara no hi ha qüestionaris. Prem «Importa un qüestionari» i tria un fitxer .csv o .xlsx.",
  "r.importado_ok": "✓ {t}: {n} preguntes",
  "r.importado_ok#1": "✓ {t}: {n} pregunta",
  "r.omitido": "omès (ja existia).",
  "r.confirm_sustituir": "Ja existeix «{t}». Vols substituir-lo pel fitxer nou?",
  "r.n_omitidas": " ({n} files omeses)",
  "r.n_omitidas#1": " ({n} fila omesa)",
  "r.aviso_volatil": "Avís: QUIZ_DIR no està configurada; aquests qüestionaris es perdran en el proper desplegament.",
  "r.confirm_eliminar": "Vols eliminar «{t}»? No es pot desfer. (Els resultats ja desats d'aquest qüestionari es conserven.)",
  "r.no_cambiar": "No s'ha pogut canviar el nom.",
  "r.no_eliminar": "No s'ha pogut eliminar.",
  "r.confirm_cerrar": "Vols tancar la partida? Es desaran els resultats de les preguntes ja jugades.",
  "r.resultados_guardados": "Els resultats ja estan desats. Pots veure'ls i descarregar-los a /admin.",
  "r.ver_resultados": "Mostra els resultats",
  "r.falladas": "Preguntes més fallades",
  "r.todas_titulo": "Totes les preguntes (de la més fallada a la més encertada)",
  "r.ver_todas": "Mostra-les totes",
  "r.ver_falladas": "Mostra només les més fallades",
  "r.pct_aciertos": "{n} % d'encerts",
  "r.n_de": "{a} de {t}",
  "r.sin_resp_n": " · {n} sense resposta",
  "r.error_frecuente": "Error més freqüent: {t} ({n})",
  "r.todos_acertaron": "Tothom ha encertat totes les preguntes! 🎉",
  "r.pregunta_num": "P{n}",
  "ad.doc": "Quest · Resultats",
  "ad.titulo": "Resultats",
  "ad.nueva_partida": "Partida nova",
  "ad.clase": "Classe",
  "ad.cuestionario": "Qüestionari",
  "ad.todas": "Totes",
  "ad.todos": "Tots",
  "ad.desde": "Des de",
  "ad.hasta": "Fins a",
  "ad.limpiar": "Neteja",
  "ad.borrar_filtrado": "Esborra el filtrat",
  "ad.tab_resultados": "Resultats",
  "ad.tab_partidas": "Partides",
  "ad.tab_preguntas": "Per pregunta",
  "ad.th_fecha": "Data",
  "ad.th_nombre": "Nom",
  "ad.th_clase": "Classe",
  "ad.th_cuestionario": "Qüestionari",
  "ad.th_pos": "Pos.",
  "ad.th_puntuacion": "Puntuació",
  "ad.th_fallos": "Errors",
  "ad.th_tiempo": "Temps (encerts)",
  "ad.detalle": "Detall",
  "ad.confirm_borrar_res": "Vols esborrar el resultat de {n} ({c})? No es pot desfer.",
  "ad.sin_resultados": "No hi ha resultats amb aquests filtres.",
  "ad.th_pregunta": "Pregunta",
  "ad.th_resp_alumno": "Resposta de l'alumne",
  "ad.th_correcta": "Correcta",
  "ad.th_t": "Temps",
  "ad.sin_resp_dash": "— sense resposta —",
  "ad.th_clases": "Classes",
  "ad.th_alumnos": "Alumnes",
  "ad.th_preguntas": "Preguntes",
  "ad.csv_notas": "Notes CSV",
  "ad.csv_detalle": "Detall CSV",
  "ad.confirm_borrar_partida": "Vols esborrar aquesta partida i tots els seus resultats? No es pot desfer.",
  "ad.aun_nada": "Encara no s'ha jugat cap partida.",
  "ad.nota_preguntas": "Quants alumnes encerten cada pregunta (respecta els filtres de dalt; tria un qüestionari per veure només el seu). Ordenades de la més fallada a la més encertada.",
  "ad.th_respuestas": "Respostes",
  "ad.th_pct": "% d'encerts",
  "ad.th_sin_responder": "Sense respondre",
  "ad.th_tiempo_medio": "Temps mitjà (encerts)",
  "ad.sin_datos": "No hi ha respostes amb aquests filtres.",
  "ad.datos_titulo": "Dades desades al servidor",
  "ad.resumen": "{n} resultats d'alumnes en {p} partides (es mostren fins a 5000 resultats i 300 partides). Descarrega el que vulguis conservar abans d'esborrar.",
  "ad.resumen_vacio": "No hi ha resultats desats.",
  "ad.copia_db": "Descarrega la còpia completa (.db)",
  "ad.borrar_todo": "Esborra tots els resultats",
  "ad.nada_borrar": "No hi ha resultats per esborrar.",
  "ad.confirm_masivo": "Se n'esborraran {n} resultats ({d}).\nNo es pot desfer. Has descarregat el que vulguis conservar?",
  "ad.desc_filtros": "els que compleixen els filtres actuals",
  "ad.desc_todos": "TOTS els desats",
  "ad.borrados": "S'han esborrat {n} resultats i {p} partides buides.",
  "ad.sin_filtro": "No hi ha cap filtre actiu. Utilitza «Esborra tots els resultats» (a baix) si ho vols esborrar tot.",
  "ac.doc": "Quest · Codis d'invitació",
  "ac.titulo": "Codis d'invitació",
  "ac.persona": "Persona",
  "ac.persona_ph": "Ex.: Anna Puig (IES Mataró)",
  "ac.caduca_opc": "Caduca (opcional)",
  "ac.crear": "Crea el codi",
  "ac.estado_srv": "{a} partides actives · {j} alumnes jugant",
  "ac.vacio": "Encara no has creat cap codi.",
  "ac.th_persona": "Persona",
  "ac.th_codigo": "Codi",
  "ac.th_creado": "Creat",
  "ac.th_caduca": "Caduca",
  "ac.th_ultimo": "Últim ús",
  "ac.th_partidas": "Partides",
  "ac.th_vivo": "En directe",
  "ac.th_estado": "Estat",
  "ac.copiar": "Copia",
  "ac.invitacion": "Invitació",
  "ac.revocar": "Revoca",
  "ac.reactivar": "Reactiva",
  "ac.borrar": "Esborra",
  "ac.copiar_codigo": "Copia el codi",
  "ac.copiar_msg": "Copia el missatge d'invitació",
  "ac.copiado": "Copiat!",
  "ac.codigo_para": "Codi per a {n}",
  "ac.mensaje": "Hola, aquí tens el teu codi per fer servir Quest gratis: {c}\nEntra a {u}/profesor i escriu-lo (no cal registrar-se).\nInstruccions: {u}/ayuda",
  "ac.est_activo": "actiu",
  "ac.est_revocado": "revocat",
  "ac.est_caducado": "caducat",
  "ac.nunca": "mai",
  "ac.en_vivo": "{a} ({j} alumnes)",
  "ac.confirm_revocar": "Vols revocar el codi de {n}? Deixarà de funcionar i es tancaran les seves partides obertes.",
  "ac.confirm_borrar": "Vols esborrar definitivament el codi de {n}?",
  "r.cargando_lista": "Carregant qüestionaris…",
  "r.no_cargar_lista": "No s'han pogut carregar els qüestionaris.",
  "r.err_guardar": "No s'ha pogut desar.",
  "ay.doc": "Quest · Guia per a professors"
 },
 "es": {
  "idioma": "Idioma",
  "otros": "Otros",
  "cargando": "Cargando…",
  "volver": "← Volver",
  "cancelar": "Cancelar",
  "borrar": "Borrar",
  "s": "s",
  "e.generico": "Se ha producido un error. Inténtalo de nuevo.",
  "e.conexion": "No se pudo conectar con el servidor.",
  "e.demasiados_intentos": "Demasiados intentos fallidos. Espera unos minutos.",
  "e.codigo_invalido": "Código no válido, revocado o caducado.",
  "e.sesion_invalida": "Sesión no válida.",
  "e.sesion_caducada": "Sesión caducada. Vuelve a entrar con tu código.",
  "e.falta_etiqueta": "Escribe a quién corresponde el código.",
  "e.fecha_invalida": "Fecha de caducidad no válida.",
  "e.no_codigo_unico": "No se pudo generar un código único.",
  "e.no_existe_codigo": "No existe ese código.",
  "e.peticion_invalida": "Petición no válida.",
  "e.cuestionario_invalido": "Cuestionario no válido.",
  "e.cuestionario_vacio": "El cuestionario no tiene preguntas.",
  "e.max_preguntas": "Máximo {n} preguntas por cuestionario.",
  "e.pregunta_incompleta": "La pregunta {n} está incompleta.",
  "e.max_partidas_codigo": "Ya tienes {n} partidas abiertas. Cierra alguna antes de crear otra.",
  "e.servidor_lleno": "El servidor está al máximo de partidas simultáneas. Inténtalo de nuevo en unos minutos.",
  "e.no_crear_partida": "No se pudo crear la partida.",
  "e.no_pin_libre": "No se pudo generar un PIN libre.",
  "e.datos_invalidos": "Datos no válidos.",
  "e.pin_invalido": "Código no válido o partida terminada.",
  "e.falta_nombre_clase": "Escribe tu nombre y tu clase.",
  "e.nombre_en_uso": "Ya hay alguien conectado con ese nombre y clase.",
  "e.partida_llena": "La partida está llena.",
  "e.expulsado": "El profesor te ha sacado de la partida.",
  "e.partida_cerrada": "La partida se ha cerrado.",
  "e.no_entrar": "No se pudo entrar.",
  "e.codigo_guardado_invalido": "Tu código guardado ya no es válido. Introduce uno nuevo.",
  "e.codigo_revocado": "Tu código ha sido revocado. Si crees que es un error, contacta con el administrador.",
  "e.cuestionario_no_encontrado": "Cuestionario no encontrado.",
  "e.sesion_profesor_invalida": "Sesión de profesor no válida. Recarga la página.",
  "e.no_preguntas_guardar": "No hay preguntas que guardar.",
  "e.ninguna_valida": "Ninguna pregunta es válida (cada una necesita pregunta, correcta y al menos una incorrecta).",
  "e.falta_nombre_cuestionario": "Falta el nombre del cuestionario.",
  "e.ya_existe_cuestionario": "Ya existe un cuestionario con ese nombre.",
  "e.no_existe_cuestionario": "No existe ese cuestionario.",
  "e.falta_nombre_nuevo": "Falta el nombre nuevo.",
  "e.falta_confirmar": "Falta confirmar la operación.",
  "e.no_copia": "No se pudo crear la copia: {m}",
  "e.cuestionario_sin_preguntas": "El cuestionario no tiene preguntas válidas.",
  "e.no_leer": "No se pudo leer: {m}",
  "e.no_autenticar": "No se pudo autenticar. Recarga la página.",
  "w.fila_incompleta": "Fila {n}: falta la pregunta, la correcta o alguna incorrecta; se omite.",
  "w.recortada_pregunta": "Fila {n}: pregunta recortada a {max} caracteres.",
  "w.recortada_correcta": "Fila {n}: respuesta correcta recortada a {max} caracteres.",
  "w.recortada_incorrecta": "Fila {n}: una incorrecta recortada a {max} caracteres.",
  "w.repetidas": "Fila {n}: había respuestas repetidas; se ignoran las duplicadas.",
  "w.sin_distintas": "Fila {n}: sin respuestas incorrectas distintas de la correcta; se omite.",
  "w.tiempo": "Fila {n}: tiempo «{t}» no válido; se usan 20 s.",
  "imp.sin_lector": "No se pudo cargar el lector de Excel. Recarga la página.",
  "imp.no_xlsx": "Este archivo no es un Excel (.xlsx) válido.",
  "imp.sin_hojas": "El Excel no tiene hojas.",
  "imp.no_hoja": "No se pudo leer la hoja del Excel.",
  "imp.vacio": "El archivo está vacío.",
  "imp.falta_columna": "En la primera fila falta la columna: {c}. Usa la plantilla (primera fila: numero, tiempo, pregunta, correcta, incorrecta1, incorrecta2, incorrecta3).",
  "imp.sin_preguntas": "No hay ninguna pregunta completa (pregunta, correcta y al menos una incorrecta).",
  "imp.demasiadas": "Tiene {n} preguntas y el máximo es {max}. Divídelo en dos cuestionarios.",
  "imp.grande": "El archivo es demasiado grande (máximo 3 MB).",
  "imp.xls": "El formato .xls antiguo no se admite. Guárdalo como .xlsx o como CSV.",
  "imp.error": "{m}",
  "bk.no_copia": "El archivo no es una copia de seguridad de Quest.",
  "bk.sin_espacio": "No hay espacio en este navegador para importar la copia.",
  "csv.fecha": "fecha",
  "csv.nombre": "nombre",
  "csv.clase": "clase",
  "csv.cuestionario": "cuestionario",
  "csv.fallos": "fallos",
  "csv.puntuacion": "puntuacion total",
  "csv.tiempo_total": "tiempo total (s)",
  "csv.pregunta_n": "pregunta nº",
  "csv.pregunta": "pregunta",
  "csv.resp_alumno": "respuesta del alumno",
  "csv.resp_correcta": "respuesta correcta",
  "csv.acierto": "acierto",
  "csv.tiempo_s": "tiempo (s)",
  "csv.sin_resp": "(sin respuesta)",
  "csv.si": "sí",
  "csv.no": "no",
  "a.doc": "Quest",
  "a.codigo_partida": "Código de la partida",
  "a.tu_nombre": "Tu nombre",
  "a.nombre_ph": "Nombre (y apellido si hay repetidos)",
  "a.tu_clase": "Tu clase",
  "a.clase_ph": "Ej.: 1A, 2B…",
  "a.entrar": "Entrar",
  "a.soy_profe": "Soy profesor",
  "a.dentro": "¡Estás dentro, {n}!",
  "a.mira_pantalla": "Mira la pantalla de la clase. Esperando a que empiece el juego…",
  "a.pie_toca": "Mira la pantalla y toca el color de tu respuesta",
  "a.enviada": "Respuesta enviada",
  "a.espera_resto": "Esperando al resto de la clase…",
  "a.pregunta_n_de": "Pregunta {i} de {n}",
  "a.correcto": "¡Correcto!",
  "a.incorrecto": "Incorrecto",
  "a.sin_respuesta": "Sin respuesta",
  "a.era": "La respuesta correcta era la {l} {f}",
  "a.posicion": "Vas {pos}º",
  "a.puntos": "{n} puntos",
  "a.puntos#1": "{n} punto",
  "a.aciertos": "{n} aciertos",
  "a.aciertos#1": "{n} acierto",
  "a.fin": "¡Fin del cuestionario!",
  "a.quedado": "Has quedado {pos}º de {n}",
  "a.salir": "Salir",
  "p.doc": "Quest · Profesor",
  "p.contacto_fuerte": "¿Quieres usar Quest gratis?",
  "p.contacto_texto": "Si no tienes código, contacta conmigo desde el apartado de contacto de la web y te daré uno.",
  "p.contacto_enlace": "Ir a la página de contacto",
  "p.guia_pdf": "Descargar instrucciones (PDF)",
  "p.ver_instr": "Ver instrucciones",
  "p.acceso_titulo": "Quest para profesores",
  "p.acceso_nota": "Entra con el código de invitación que te han facilitado.",
  "p.codigo_inv": "Código de invitación",
  "p.recordar": " Recordar el código en este navegador",
  "p.entrar": "Entrar",
  "p.mis_cuestionarios": "Mis cuestionarios",
  "p.crear_partida": "Crear partida",
  "p.n_cuestionarios": "{n} cuestionarios",
  "p.n_cuestionarios#1": "{n} cuestionario",
  "p.n_preguntas": "{n} preguntas",
  "p.n_preguntas#1": "{n} pregunta",
  "p.cambiar_nombre": "Cambiar nombre",
  "p.eliminar": "Eliminar",
  "p.buscar": "Buscar cuestionario…",
  "p.plantilla": "Descargar plantilla",
  "p.plantilla_xlsx": "Plantilla Excel (.xlsx)",
  "p.plantilla_csv": "Plantilla CSV (.csv)",
  "p.plantilla_para": "Plantilla para importar: ",
  "p.copia": "Copia de seguridad",
  "p.exportar_copia": "Exportar copia (.json)",
  "p.importar_copia": "Importar copia…",
  "p.pasos_titulo": "Empieza en tres pasos",
  "p.paso1": "Descarga la plantilla (Excel o CSV).",
  "p.paso2": "Escribe tus preguntas siguiendo las columnas.",
  "p.paso3": "Pulsa «Importar cuestionario» y elige el archivo, o arrástralo hasta aquí.",
  "p.consejo": "Consejo: nombra los archivos ASIGNATURA_Tema (por ejemplo C6_U1_Instrumental) y Quest los agrupará en carpetas por asignatura.",
  "p.importar": "Importar cuestionario",
  "p.nota_navegador": "Tus cuestionarios se guardan solo en este navegador, no en el servidor. Haz una copia de seguridad de vez en cuando y conserva tus archivos originales.",
  "p.sin_almacen": "Este navegador no permite guardar datos (¿modo privado?). Podrás jugar, pero los cuestionarios no se conservarán.",
  "p.historial": "Historial ({n})",
  "p.instrucciones_pdf": "Instrucciones (PDF)",
  "p.salir": "Salir",
  "p.prompt_renombrar": "Nuevo nombre del cuestionario.\nUsa ASIGNATURA_Tema para agruparlo en una carpeta:",
  "p.nombre_repetido": "Ya tienes otro cuestionario con ese nombre.",
  "p.no_guardar_cambio": "No se pudo guardar el cambio.",
  "p.confirm_eliminar": "¿Eliminar «{t}» de este navegador? No se puede deshacer.",
  "p.imp_archivo": "Archivo: {f}",
  "p.imp_nombre": "Nombre del cuestionario (ASIGNATURA_Tema lo agrupa en carpeta)",
  "p.imp_sustituye": "Ya tienes un cuestionario con este nombre: se sustituirá.",
  "p.imp_validas": "{n} preguntas válidas",
  "p.imp_validas#1": "{n} pregunta válida",
  "p.imp_tiempo_medio": " · tiempo medio {t} s",
  "p.imp_n_avisos": " · {n} avisos",
  "p.imp_n_avisos#1": " · {n} aviso",
  "p.imp_avisos": "Avisos ({n})",
  "p.imp_mas": "… y {n} más",
  "p.imp_asi": "Así se verá (primeras preguntas)",
  "p.imp_guardar": "Guardar en mi biblioteca",
  "p.imp_omitir": "Omitir este archivo",
  "p.imp_cancelar": "Cancelar",
  "p.imp_cancelar_resto": "Cancelar el resto",
  "p.imp_no_espacio": "No se pudo guardar: el navegador no tiene espacio o bloquea el almacenamiento.",
  "p.imp_guardado": "«{t}» guardado ({n} preguntas).",
  "p.copia_importada": "Copia importada: {c} cuestionarios y {p} partidas nuevas.",
  "p.copia_importada_d": "Copia importada: {c} cuestionarios y {p} partidas nuevas ({d} elementos no válidos descartados).",
  "p.hist_titulo": "Historial de partidas",
  "p.hist_nota": "El historial está solo en este navegador (guarda las últimas 60 partidas). Descarga los CSV que quieras conservar.",
  "p.hist_vacio": "Todavía no hay partidas guardadas.",
  "p.hist_resumen": "{f} · {n} alumnos · {c}",
  "p.hist_resumen#1": "{f} · {n} alumno · {c}",
  "p.th_pos": "Pos.",
  "p.th_nombre": "Nombre",
  "p.th_clase": "Clase",
  "p.th_puntos": "Puntos",
  "p.th_fallos": "Fallos",
  "p.th_tiempo": "Tiempo (aciertos)",
  "p.dl_notas": "Descargar notas (CSV)",
  "p.dl_detalle": "Descargar detalle (CSV)",
  "p.dl_todas": "Descargar todas las notas (CSV)",
  "p.confirm_borrar_partida": "¿Borrar esta partida del historial? No se puede deshacer.",
  "p.esperando": "Esperando a que entren los alumnos…",
  "p.sacar": "Sacar de la partida",
  "p.qr_alt": "Código QR para entrar",
  "p.entra_movil": "Entra desde el móvil en ",
  "p.introduce_codigo": "e introduce el código",
  "p.o_qr": "o escanea el QR",
  "p.no_qr": "No se pudo cargar el QR",
  "p.n_dentro": "{n} alumnos dentro",
  "p.n_dentro#1": "{n} alumno dentro",
  "p.empezar": "Empezar",
  "p.confirm_cancelar": "¿Cancelar la partida? Los alumnos que ya hayan entrado serán desconectados.",
  "p.han_respondido": "{r} de {n} han respondido",
  "p.respondieron": "{r} de {n} respondieron",
  "p.terminar": "Terminar",
  "p.mostrar_resp": "Mostrar respuesta",
  "p.siguiente": "Siguiente",
  "p.ver_finales": "Ver resultados finales",
  "p.confirm_terminar": "¿Terminar la partida ahora? Cuentan las preguntas cuya respuesta ya se ha mostrado.",
  "p.ranking": "Ranking",
  "p.ranking_antes": "Ranking (antes de esta pregunta)",
  "p.clasif_final": "Clasificación final",
  "p.sin_punt": "Sin puntuaciones todavía",
  "p.pts": "{n} pts",
  "p.fin": "¡Fin del cuestionario!",
  "p.descarga_ahora": "Descarga los resultados ahora.",
  "p.srv_no_guarda_ok": " El servidor no los guarda, pero también quedan en el historial de este navegador.",
  "p.srv_no_guarda_ko": " El servidor no los guarda y no se han podido guardar en el historial de este navegador.",
  "p.sin_resultados": "No se llegó a puntuar ninguna pregunta, así que no hay resultados que guardar.",
  "p.nueva": "Nueva partida",
  "p.pin": "PIN {p}",
  "r.doc_profesor": "Quest · Profesor",
  "r.elige": "Elige un cuestionario",
  "r.resultados_ant": "Resultados anteriores",
  "r.vacio": "Todavía no hay cuestionarios. Pulsa «Importar cuestionario» y elige un archivo .csv o .xlsx.",
  "r.importado_ok": "✓ {t}: {n} preguntas",
  "r.importado_ok#1": "✓ {t}: {n} pregunta",
  "r.omitido": "omitido (ya existía).",
  "r.confirm_sustituir": "Ya existe «{t}». ¿Sustituirlo por el archivo nuevo?",
  "r.n_omitidas": " ({n} filas omitidas)",
  "r.n_omitidas#1": " ({n} fila omitida)",
  "r.aviso_volatil": "Aviso: QUIZ_DIR no está configurada; estos cuestionarios se perderán en el próximo despliegue.",
  "r.confirm_eliminar": "¿Eliminar «{t}»? No se puede deshacer. (Los resultados ya guardados de este cuestionario se conservan.)",
  "r.no_cambiar": "No se pudo cambiar el nombre.",
  "r.no_eliminar": "No se pudo eliminar.",
  "r.confirm_cerrar": "¿Cerrar la partida? Se guardarán los resultados de las preguntas ya jugadas.",
  "r.resultados_guardados": "Los resultados ya están guardados. Puedes verlos y descargarlos en /admin.",
  "r.ver_resultados": "Ver resultados",
  "r.falladas": "Preguntas más falladas",
  "r.todas_titulo": "Todas las preguntas (de la más fallada a la más acertada)",
  "r.ver_todas": "Ver todas",
  "r.ver_falladas": "Ver solo las más falladas",
  "r.pct_aciertos": "{n} % aciertos",
  "r.n_de": "{a} de {t}",
  "r.sin_resp_n": " · {n} sin responder",
  "r.error_frecuente": "Error más frecuente: {t} ({n})",
  "r.todos_acertaron": "¡Todos acertaron todas las preguntas! 🎉",
  "r.pregunta_num": "P{n}",
  "ad.doc": "Quest · Resultados",
  "ad.titulo": "Resultados",
  "ad.nueva_partida": "Nueva partida",
  "ad.clase": "Clase",
  "ad.cuestionario": "Cuestionario",
  "ad.todas": "Todas",
  "ad.todos": "Todos",
  "ad.desde": "Desde",
  "ad.hasta": "Hasta",
  "ad.limpiar": "Limpiar",
  "ad.borrar_filtrado": "Borrar lo filtrado",
  "ad.tab_resultados": "Resultados",
  "ad.tab_partidas": "Partidas",
  "ad.tab_preguntas": "Por pregunta",
  "ad.th_fecha": "Fecha",
  "ad.th_nombre": "Nombre",
  "ad.th_clase": "Clase",
  "ad.th_cuestionario": "Cuestionario",
  "ad.th_pos": "Pos.",
  "ad.th_puntuacion": "Puntuación",
  "ad.th_fallos": "Fallos",
  "ad.th_tiempo": "Tiempo (aciertos)",
  "ad.detalle": "Detalle",
  "ad.confirm_borrar_res": "¿Borrar el resultado de {n} ({c})? No se puede deshacer.",
  "ad.sin_resultados": "No hay resultados con estos filtros.",
  "ad.th_pregunta": "Pregunta",
  "ad.th_resp_alumno": "Respuesta del alumno",
  "ad.th_correcta": "Correcta",
  "ad.th_t": "Tiempo",
  "ad.sin_resp_dash": "— sin respuesta —",
  "ad.th_clases": "Clases",
  "ad.th_alumnos": "Alumnos",
  "ad.th_preguntas": "Preguntas",
  "ad.csv_notas": "Notas CSV",
  "ad.csv_detalle": "Detalle CSV",
  "ad.confirm_borrar_partida": "¿Borrar esta partida y todos sus resultados? No se puede deshacer.",
  "ad.aun_nada": "Todavía no se ha jugado ninguna partida.",
  "ad.nota_preguntas": "Cuántos alumnos aciertan cada pregunta (respeta los filtros de arriba; elige un cuestionario para ver solo el suyo). Ordenadas de la más fallada a la más acertada.",
  "ad.th_respuestas": "Respuestas",
  "ad.th_pct": "% de aciertos",
  "ad.th_sin_responder": "Sin responder",
  "ad.th_tiempo_medio": "Tiempo medio (aciertos)",
  "ad.sin_datos": "No hay respuestas con estos filtros.",
  "ad.datos_titulo": "Datos guardados en el servidor",
  "ad.resumen": "{n} resultados de alumnos en {p} partidas (se muestran hasta 5000 resultados y 300 partidas). Descarga lo que quieras conservar antes de borrar.",
  "ad.resumen_vacio": "No hay resultados guardados.",
  "ad.copia_db": "Descargar copia completa (.db)",
  "ad.borrar_todo": "Borrar todos los resultados",
  "ad.nada_borrar": "No hay resultados que borrar.",
  "ad.confirm_masivo": "Se van a borrar {n} resultados ({d}).\nNo se puede deshacer. ¿Has descargado lo que quieras conservar?",
  "ad.desc_filtros": "los que cumplen los filtros actuales",
  "ad.desc_todos": "TODOS los guardados",
  "ad.borrados": "Borrados {n} resultados y {p} partidas vacías.",
  "ad.sin_filtro": "No hay ningún filtro activo. Usa «Borrar todos los resultados» (abajo) si quieres borrarlo todo.",
  "ac.doc": "Quest · Códigos de invitación",
  "ac.titulo": "Códigos de invitación",
  "ac.persona": "Persona",
  "ac.persona_ph": "Ej.: Ana López (IES Mataró)",
  "ac.caduca_opc": "Caduca (opcional)",
  "ac.crear": "Crear código",
  "ac.estado_srv": "{a} partidas activas · {j} alumnos jugando",
  "ac.vacio": "Todavía no has creado ningún código.",
  "ac.th_persona": "Persona",
  "ac.th_codigo": "Código",
  "ac.th_creado": "Creado",
  "ac.th_caduca": "Caduca",
  "ac.th_ultimo": "Último uso",
  "ac.th_partidas": "Partidas",
  "ac.th_vivo": "En directo",
  "ac.th_estado": "Estado",
  "ac.copiar": "Copiar",
  "ac.invitacion": "Invitación",
  "ac.revocar": "Revocar",
  "ac.reactivar": "Reactivar",
  "ac.borrar": "Borrar",
  "ac.copiar_codigo": "Copiar código",
  "ac.copiar_msg": "Copiar mensaje de invitación",
  "ac.copiado": "¡Copiado!",
  "ac.codigo_para": "Código para {n}",
  "ac.mensaje": "Hola, aquí tienes tu código para usar Quest gratis: {c}\nEntra en {u}/profesor e introdúcelo (no hace falta registrarse).\nInstrucciones: {u}/ayuda",
  "ac.est_activo": "activo",
  "ac.est_revocado": "revocado",
  "ac.est_caducado": "caducado",
  "ac.nunca": "nunca",
  "ac.en_vivo": "{a} ({j} alumnos)",
  "ac.confirm_revocar": "¿Revocar el código de {n}? Dejará de funcionar y se cerrarán sus partidas abiertas.",
  "ac.confirm_borrar": "¿Borrar definitivamente el código de {n}?",
  "r.cargando_lista": "Cargando cuestionarios…",
  "r.no_cargar_lista": "No se pudieron cargar los cuestionarios.",
  "r.err_guardar": "No se pudo guardar.",
  "ay.doc": "Quest · Guía para profesores"
 }
};
  var LANGS = ['ca', 'es'];
  var CLAVE = 'quest-lang';
  var enNavegador = typeof document !== 'undefined';

  function guardado() { try { return localStorage.getItem(CLAVE); } catch (e) { return null; } }
  function detectar() {
    var q = null;
    try { q = new URLSearchParams(location.search).get('lang'); } catch (e) { /* sin URL */ }
    if (LANGS.indexOf(q) >= 0) return q;
    var g = guardado();
    if (LANGS.indexOf(g) >= 0) return g;
    var n = '';
    try { n = (navigator.language || '').toLowerCase(); } catch (e) { /* sin navigator */ }
    return n.indexOf('es') === 0 ? 'es' : 'ca';
  }

  var lang = enNavegador ? detectar() : 'ca';
  var registro = []; // textos y atributos pintados con T(): se vuelven a traducir al cambiar de idioma
  var oyentes = [];

  function tl(l, key, vars) {
    var d = DICT[l] || DICT.ca;
    var plural = vars && vars.n === 1;
    var s;
    if (plural) s = d[key + '#1'] !== undefined ? d[key + '#1'] : DICT.ca[key + '#1'];
    if (s === undefined) s = d[key] !== undefined ? d[key] : DICT.ca[key];
    if (s === undefined) return key;
    return s.replace(/\{(\w+)\}/g, function (m, k) { return vars && vars[k] !== undefined && vars[k] !== null ? String(vars[k]) : ''; });
  }
  function t(key, vars) { return tl(lang, key, vars); }
  function has(key) { return DICT[lang][key] !== undefined || DICT.ca[key] !== undefined; }

  function D(key, vars) { this.key = key; this.vars = vars; }
  function T(key, vars) { return new D(key, vars); }
  function esD(x) { return x instanceof D; }

  function podar() {
    registro = registro.filter(function (r) { return (r.nodo || r.el).isConnected; });
  }
  function nodo(d) {
    var n = document.createTextNode(t(d.key, d.vars));
    registro.push({ tipo: 'texto', nodo: n, key: d.key, vars: d.vars });
    if (registro.length > 4000) podar();
    return n;
  }
  function bind(el, attr, d) {
    el.setAttribute(attr, t(d.key, d.vars));
    registro.push({ tipo: 'attr', el: el, attr: attr, key: d.key, vars: d.vars });
  }
  function bindFn(el, attr, fn) {
    el.setAttribute(attr, fn());
    registro.push({ tipo: 'fn', el: el, attr: attr, fn: fn });
  }
  function setT(el, key, vars) { el.replaceChildren(nodo(T(key, vars))); }
  function titulo(key, vars) {
    document.title = t(key, vars);
    registro = registro.filter(function (r) { return r.tipo !== 'titulo'; });
    registro.push({ tipo: 'titulo', el: document.documentElement, key: key, vars: vars });
  }

  // Texto con <b>, <strong>, <code>, <em> y <br> (para párrafos de las páginas estáticas)
  function rich(el, texto) {
    el.replaceChildren();
    var partes = String(texto).split(/(<\/?(?:b|strong|code|em)>|<br\s*\/?>)/);
    var pila = [el];
    partes.forEach(function (p) {
      var m = /^<(\/?)(b|strong|code|em)>$/.exec(p);
      if (m) {
        if (m[1]) { if (pila.length > 1) pila.pop(); } else {
          var e = document.createElement(m[2]);
          pila[pila.length - 1].appendChild(e);
          pila.push(e);
        }
      } else if (/^<br/.test(p)) pila[pila.length - 1].appendChild(document.createElement('br'));
      else if (p) pila[pila.length - 1].appendChild(document.createTextNode(p));
    });
  }

  function aplicar(raiz) {
    if (!enNavegador) return;
    raiz = raiz || document;
    var q = function (s) { return raiz.querySelectorAll ? raiz.querySelectorAll(s) : []; };
    Array.prototype.forEach.call(q('[data-i18n]'), function (e) { e.textContent = t(e.getAttribute('data-i18n')); });
    Array.prototype.forEach.call(q('[data-i18n-html]'), function (e) { rich(e, t(e.getAttribute('data-i18n-html'))); });
    Array.prototype.forEach.call(q('[data-i18n-ph]'), function (e) { e.setAttribute('placeholder', t(e.getAttribute('data-i18n-ph'))); });
    Array.prototype.forEach.call(q('[data-i18n-aria]'), function (e) { e.setAttribute('aria-label', t(e.getAttribute('data-i18n-aria'))); });
    Array.prototype.forEach.call(q('[data-i18n-title]'), function (e) { e.setAttribute('title', t(e.getAttribute('data-i18n-title'))); });
    Array.prototype.forEach.call(q('[data-i18n-alt]'), function (e) { e.setAttribute('alt', t(e.getAttribute('data-i18n-alt'))); });
    var dt = document.querySelector('title[data-i18n-doc]');
    if (dt) document.title = t(dt.getAttribute('data-i18n-doc'));
  }

  function refrescar() {
    podar();
    registro.forEach(function (r) {
      if (r.tipo === 'texto') r.nodo.data = t(r.key, r.vars);
      else if (r.tipo === 'attr') r.el.setAttribute(r.attr, t(r.key, r.vars));
      else if (r.tipo === 'fn') r.el.setAttribute(r.attr, r.fn());
      else if (r.tipo === 'titulo') document.title = t(r.key, r.vars);
    });
  }

  function marcarSelectores() {
    if (!enNavegador) return;
    Array.prototype.forEach.call(document.querySelectorAll('.selector-idioma button'), function (b) {
      var activo = b.getAttribute('data-lang') === lang;
      b.classList.toggle('activo', activo);
      b.setAttribute('aria-pressed', activo ? 'true' : 'false');
    });
    Array.prototype.forEach.call(document.querySelectorAll('.selector-idioma'), function (g) { g.setAttribute('aria-label', t('idioma')); });
  }

  function set(l) {
    if (LANGS.indexOf(l) < 0) return;
    lang = l;
    try { localStorage.setItem(CLAVE, l); } catch (e) { /* sin almacenamiento */ }
    if (enNavegador) document.documentElement.lang = l;
    aplicar(document);
    refrescar();
    marcarSelectores();
    oyentes.slice().forEach(function (f) { try { f(l); } catch (e) { console.error(e); } });
  }

  function selector() {
    var g = document.createElement('div');
    g.className = 'selector-idioma';
    g.setAttribute('role', 'group');
    LANGS.forEach(function (l) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('data-lang', l);
      b.textContent = l.toUpperCase();
      b.addEventListener('click', function () { set(l); });
      g.appendChild(b);
    });
    return g;
  }

  function montar() {
    document.documentElement.lang = lang;
    var huecos = document.querySelectorAll('[data-lang-slot]');
    if (huecos.length) {
      Array.prototype.forEach.call(huecos, function (h) { h.replaceChildren(selector()); });
    } else {
      var c = document.createElement('div');
      c.className = 'selector-flotante';
      c.appendChild(selector());
      document.body.appendChild(c);
    }
    aplicar(document);
    marcarSelectores();
  }
  if (enNavegador) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar); else montar();
  }

  // Formatos según idioma
  function loc() { return lang === 'es' ? 'es-ES' : 'ca-ES'; }
  function locDe(l) { return l === 'es' ? 'es-ES' : 'ca-ES'; }
  var ZONA = 'Europe/Madrid';
  function setZona(z) { ZONA = z; }
  function fecha(d, l) {
    return new Date(d).toLocaleDateString(locDe(l || lang), { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: ZONA });
  }
  function fechaHora(d, l) {
    var x = new Date(d);
    return fecha(x, l) + ' ' + x.toLocaleTimeString(locDe(l || lang), { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: ZONA });
  }
  function num(n, opciones, l) { return new Intl.NumberFormat(locDe(l || lang), opciones).format(n); }
  function seg(ms, l) { return num(ms / 1000, { minimumFractionDigits: 1, maximumFractionDigits: 1 }, l) + ' s'; }
  function segNum(ms, l) { return num(ms / 1000, { minimumFractionDigits: 2, maximumFractionDigits: 2 }, l); }
  function ordenar(a, b) { return String(a).localeCompare(String(b), loc(), { numeric: true, sensitivity: 'base' }); }

  // Error con código: el mensaje se traduce al crearlo; el código permite volver a traducirlo
  function Err(code, vars) {
    var e = new Error(t('e.' + code, vars));
    e.code = code;
    e.vars = vars;
    return e;
  }
  // Texto de un error del servidor ({ error: 'codigo', vars }) o de un Error con código
  function errTxt(codigo, vars, porDefecto) {
    if (codigo && has('e.' + codigo)) return t('e.' + codigo, vars);
    return t(porDefecto || 'e.generico');
  }

  var API = {
    t: t, tl: tl, T: T, D: D, esD: esD, has: has, set: set, nodo: nodo, bind: bind, bindFn: bindFn, setT: setT, titulo: titulo,
    rich: rich, apply: aplicar, selector: selector, fecha: fecha, fechaHora: fechaHora, num: num, seg: seg, segNum: segNum,
    ordenar: ordenar, loc: loc, setZona: setZona, Err: Err, errTxt: errTxt,
    onChange: function (f) { oyentes.push(f); },
    langs: LANGS.slice(), dict: DICT,
  };
  Object.defineProperty(API, 'lang', { get: function () { return lang; } });
  global.I18N = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
