# Financial Brokers Baloncesto

Web del C.D.E. Financial Brokers Aseguradores (Santander, Cantabria). HTML, CSS y JS estáticos, publicada con GitHub Pages.

## Actualizar el calendario

Edita el array `FIXTURES` en `app.js`. Cada partido:

```js
{ season: "2026/27", team: "primera", date: "2026-10-04T18:00", rival: "AD Amide", home: true, res: null, score: null }
```

- `team`: `primera` o `segunda`
- `home`: `true` en casa, `false` fuera
- `res`: `"W"`, `"L"` o `null` si no se ha jugado

El bloque "Próximo partido" se rellena solo con el siguiente partido futuro que tenga hora.

## Vídeos y fotos

- `VIDEOS` en `app.js`: ids de vídeos públicos de la página de Facebook del club (`tall: true` para vídeos verticales).
- `INSTAGRAM_POSTS`: códigos de publicaciones de Instagram (la parte de la URL tras `/p/`).

Foto de portada: Davide Aracri en Unsplash (licencia Unsplash). Tipografías Big Shoulders Display y Manrope (OFL), alojadas en `assets/fonts`.
