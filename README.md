# Quest · versión para profesores invitados

Cuestionarios en tiempo real tipo Kahoot. Esta versión es para compartir con otros profesores:

- Acceso con **código de invitación** (uno por persona), que se crea y revoca desde `/admin`.
- Los cuestionarios se importan desde Excel/CSV y **se guardan en el navegador** del profesor, no en el servidor.
- Los resultados **no se guardan en el servidor**: el profesor descarga el CSV al terminar (y queda un historial en su navegador).
- Los alumnos entran solo con el PIN de la partida (sin código ni cuenta).

## Páginas

| Ruta | Para quién |
|---|---|
| `/` | Alumnos (PIN, nombre, clase) |
| `/profesor` | Profesores (código de invitación) |
| `/ayuda` | Guía en català y castellano (selector CA \| ES, o `?lang=ca` / `?lang=es`); también en PDF: `/Guia-Quest-ca.pdf` y `/Guia-Quest-es.pdf` |
| `/admin` | Administrador (usuario cualquiera + `ADMIN_PASSWORD`) |

## Variables de entorno

| Variable | Por defecto | Qué hace |
|---|---|---|
| `ADMIN_PASSWORD` | aleatoria (sale en el log) | Contraseña de `/admin` |
| `DATA_DIR` | `./data` | Carpeta de la base de códigos (`quest-codigos.db`). En Coolify: volumen en `/data` |
| `CONTACT_URL` | `https://luisfs.com` | Enlace «solicita un código» (pon la URL exacta de tu apartado Contacto) |
| `MAX_PREGUNTAS` | 100 | Preguntas por cuestionario |
| `MAX_JUGADORES` | 60 | Alumnos por partida |
| `MAX_PARTIDAS_POR_CODIGO` | 3 | Partidas abiertas a la vez por código |
| `MAX_PARTIDAS_TOTAL` | 40 | Partidas abiertas a la vez en todo el servidor |
| `PORT` | 3000 | Puerto |

## Puesta en marcha

```
npm install
ADMIN_PASSWORD=una-clave-larga npm start
```

Detrás de un proxy (Coolify/Traefik) se confía en una sola cabecera `X-Forwarded-For`.

## Seguridad y privacidad

- Límites de intentos por IP (se guardan en memoria; al superarlos, respuesta **429**):
  - **5 códigos de invitación erróneos cada 15 min** (`limAcceso`). El sexto da 429 aunque se envíe un código bueno.
  - **5 contraseñas erróneas cada 15 min en `/admin`** (`limAdmin`, también su API). El sexto intento da 429 («Demasiados intentos fallidos. Espera unos minutos.») y el bloqueo se mantiene aunque se envíe la contraseña correcta. Solo cuenta una cabecera Basic con contraseña errónea: la primera visita sin credenciales (cuando el navegador aún no ha enviado nada) no suma. Acertar la contraseña reinicia el contador.
  - **40 PIN erróneos cada 10 min** (`limUnirse`).
- **Origen de Socket.IO**: las conexiones se aceptan si no llevan cabecera `Origin` (clientes que no son navegador) o si el host del `Origin` coincide con el primer valor de `X-Forwarded-Host` o con `Host`. Otro origen se rechaza. Funciona tras Coolify/Traefik porque este reenvía `X-Forwarded-Host` con el dominio público.
- Revocar un código cierra sus partidas e invalida sus sesiones.
- El servidor solo guarda en disco: etiqueta, código, fechas y contador de partidas. Preguntas, alumnos y notas viven únicamente en memoria durante la partida.
- Cabecera CSP: solo scripts propios.

## Archivos para repartir

`public/plantillas/Plantilla-Quest.xlsx` y `.csv` (mismas columnas en los dos idiomas; el Excel lleva una hoja de instrucciones en català, «Instruccions», y otra en castellano, «Instrucciones»), y las guías `public/Guia-Quest-ca.pdf` y `public/Guia-Quest-es.pdf`.

Si cambias `public/ayuda.html`, regenera los PDF con `node tools/generar-guias.js` (necesita Playwright con Chromium; genera A4). Sin Playwright: abre `/ayuda?lang=ca` (o `es`), imprime a A4 → «Guardar como PDF» y sustituye el archivo. El enlace antiguo `/Guia-Quest.pdf` redirige a la guía del idioma del navegador.

## Idiomas (català / castellano)

- Todo el texto de la interfaz sale de `public/i18n.js` (diccionarios planos `ca` y `es`, con marcadores `{n}`, `{c}`…). API global: `I18N.t(clave, vars)`, `I18N.set('ca'|'es')`, `I18N.lang`, `I18N.langs`. Si falta una clave en un idioma se usa el catalán; si falta en los dos, se muestra la clave. Las claves terminadas en `#1` son la forma singular (se usa cuando `n` vale 1).
- Idioma por defecto: castellano si el navegador es `es`, catalán en los demás casos. La elección se guarda en `localStorage` (`quest-lang`) y se aplica a `<html lang>`. `?lang=ca|es` en la URL fuerza el idioma.
- El selector **CA | ES** está en todas las pantallas y cambia el idioma sin recargar ni perder el estado (la partida en curso, lo escrito en formularios…).
- Los mensajes de error del servidor son **códigos** (`{ error: 'codigo_invalido' }`) que el cliente traduce con `e.<codigo>`. Quedan en un solo idioma (sin cliente que los traduzca): la página en texto plano de 401/429 de `/admin` (sale en los dos idiomas a la vez) y errores internos que nunca ve el usuario.
- Los CSV descargados usan las cabeceras del idioma activo; las fechas y números, el formato del idioma.
- Lo que escribe el profesor (preguntas, respuestas, nombres de cuestionario, etiquetas de códigos) no se traduce.

## Pruebas

`npm test` ejecuta, en orden: servidor (`test/servidor.js`), navegador con Playwright/Chromium (`test/navegador.js`), idioma en el navegador (`test/idioma.js`) y diccionario (`test/i18n.js`). `npm run test:servidor` y `npm run test:i18n` no necesitan navegador.
