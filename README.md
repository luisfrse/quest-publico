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
| `/ayuda` | Guía; también en PDF (`/Guia-Quest.pdf`) |
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

- Límite de intentos: 8 códigos erróneos/15 min y 40 PIN erróneos/10 min por IP.
- Revocar un código cierra sus partidas e invalida sus sesiones.
- El servidor solo guarda en disco: etiqueta, código, fechas y contador de partidas. Preguntas, alumnos y notas viven únicamente en memoria durante la partida.
- Cabecera CSP: solo scripts propios.

## Archivos para repartir

`public/plantillas/Plantilla-Quest.xlsx` y `.csv`, y `public/Guia-Quest.pdf`. Si cambias `ayuda.html`, regenera el PDF imprimiendo `/ayuda` (A4).

## Pruebas

`npm test` (servidor + navegador con Playwright/Chromium). `npm run test:servidor` no necesita navegador.
