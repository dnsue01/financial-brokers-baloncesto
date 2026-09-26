# Financial Brokers Baloncesto

Web del C.D.E. Financial Brokers Aseguradores (Santander, Cantabria). HTML, CSS y JS estáticos publicados con GitHub Pages.

## Qué se actualiza solo

El workflow `.github/workflows/update-data.yml` se ejecuta cada 6 horas (y a mano desde la pestaña Actions):

- `scripts/update-fixtures.mjs` descarga de la Federación Cántabra (API pública que usa su propia web) el calendario y los resultados de la temporada activa de los dos equipos del club, con los escudos de los rivales. Guarda `data/fixtures.json` y `data/crests/`.
- `scripts/update-feed.mjs` lee el embed público del perfil de Instagram del club y guarda las últimas publicaciones (texto, fecha e imagen) en `data/feed.json` y `data/feed/`.

El workflow `.github/workflows/update-gallery.yml` se ejecuta cada hora:

- `scripts/update-gallery.mjs` lee la carpeta de Google Drive **Fotos Financial Brokers (web)**. Cada subcarpeta es un álbum; las fotos se descargan, se reducen a WebP (1600 px y miniatura de 640 px) y se guardan en `data/gallery/` con el índice en `data/gallery.json`. Si una foto o carpeta se borra en Drive, desaparece de la web.

Si una fuente falla o bloquea la petición, el script deja los datos anteriores y la web sigue funcionando.

En cada visita la portada empieza en una diapositiva distinta (próximo partido de cada equipo, marca o publicación reciente), la cuenta atrás se calcula en el navegador y el vídeo destacado cambia.

## Datos manuales

- `ARCHIVE` en `app.js`: temporadas antiguas que la federación ya no sirve.
- `VIDEOS` en `app.js`: vídeos públicos de la página de Facebook del club (`tall: true` para verticales).

## Subir fotos de un partido

1. Entra en la carpeta de Drive (solo pueden subir las personas invitadas como Editor).
2. Crea una subcarpeta con la fecha y el rival: `2026-10-04 SPBasket Rosa`. Con la fecha, el álbum se enlaza solo al partido de ese día (resultado y enlace "fotos" en el calendario).
3. Sube las fotos. Si alguna se llama `portada`, será la portada del álbum; si no, la primera por nombre.
4. En menos de una hora salen en la sección Fotos. Para no esperar: Actions > Actualizar galería > Run workflow.

Configuración (una vez): la carpeta debe estar compartida como "Cualquier persona con el enlace: Lector", y el repo necesita el secreto `GOOGLE_API_KEY` (clave de Google Cloud con la Google Drive API activada). Para usar otra carpeta, crea la variable `DRIVE_FOLDER_ID`.

## Probar en local

```bash
python -m http.server 8000
```

Fotos de Unsplash: Davide Aracri, Markus Spiske, Patrick Fore y Kiona. Tipografías Big Shoulders Display y Manrope (OFL) en `assets/fonts`.
