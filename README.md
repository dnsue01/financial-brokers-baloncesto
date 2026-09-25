# Financial Brokers Baloncesto

Web del C.D.E. Financial Brokers Aseguradores (Santander, Cantabria). HTML, CSS y JS estáticos publicados con GitHub Pages.

## Qué se actualiza solo

El workflow `.github/workflows/update-data.yml` se ejecuta cada 6 horas (y a mano desde la pestaña Actions):

- `scripts/update-fixtures.mjs` descarga de la Federación Cántabra (API pública que usa su propia web) el calendario y los resultados de la temporada activa de los dos equipos del club, con los escudos de los rivales. Guarda `data/fixtures.json` y `data/crests/`.
- `scripts/update-feed.mjs` abre el Instagram del club con Chrome headless y guarda las últimas publicaciones (texto, fecha e imagen) en `data/feed.json` y `data/feed/`.

Si una fuente falla o bloquea la petición, el script deja los datos anteriores y la web sigue funcionando.

En cada visita la portada empieza en una diapositiva distinta (próximo partido de cada equipo, marca o publicación reciente), la cuenta atrás se calcula en el navegador y el vídeo destacado cambia.

## Datos manuales

- `ARCHIVE` en `app.js`: temporadas antiguas que la federación ya no sirve.
- `VIDEOS` en `app.js`: vídeos públicos de la página de Facebook del club (`tall: true` para verticales).

## Probar en local

```bash
python -m http.server 8000
```

Fotos de Unsplash: Davide Aracri, Markus Spiske, Patrick Fore y Kiona. Tipografías Big Shoulders Display y Manrope (OFL) en `assets/fonts`.
