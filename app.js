const TEAMS = {
  primera: "Primera División Nacional",
  segunda: "Segunda División Autonómica",
};

// Para añadir partidos: date "AAAA-MM-DDTHH:MM" (o "AAAA-MM" si solo se conoce el mes),
// home true/false/null, res "W" | "L" | null, score "80-72" | null.
const FIXTURES = [
  { season: "2025/26", team: "primera", date: "2025-10", rival: "Cantbasket 04", home: null, res: null },
  { season: "2025/26", team: "primera", date: "2025-10", rival: "Daygon Baloncesto", home: null, res: null },
  { season: "2025/26", team: "segunda", date: "2025-10", rival: "La Paz Torrelavega", home: null, res: null },
  { season: "2025/26", team: "segunda", date: "2025-10", rival: "SP Basket", home: null, res: null },
  { season: "2025/26", team: "primera", date: "2025-11", rival: "AD Amide", home: null, res: "L" },
  { season: "2025/26", team: "primera", date: "2025-11", rival: "Castrobasket", home: null, res: "L", note: "Por la mínima" },
  { season: "2025/26", team: "primera", date: "2025-11", rival: "SP Basket", home: false, venue: "Bezana", res: "W" },
  { season: "2025/26", team: "primera", date: "2025-11", rival: "Pas Piélagos", home: null, res: "W", note: "En la prórroga" },
  { season: "2025/26", team: "segunda", date: "2025-11", rival: "Cantbasket 04", home: null, res: "L" },
  { season: "2025/26", team: "segunda", date: "2025-11", rival: "Basket Cayón", home: null, res: "W" },
  { season: "2025/26", team: "segunda", date: "2025-11", rival: "Ribamontán al Mar", home: null, res: "W" },
  { season: "2025/26", team: "segunda", date: "2025-11", rival: "CB Santillana del Mar", home: null, res: "L", note: "Líder invicto" },
  { season: "2025/26", team: "primera", date: "2026-03", rival: "AD Amide", home: null, res: null, note: "Vuelta" },
  { season: "2025/26", team: "primera", date: "2026-03", rival: "Castrobasket", home: null, res: null, note: "Vuelta" },
  { season: "2025/26", team: "primera", date: "2026-03", rival: "SP Basket", home: null, res: null, note: "Vuelta" },
  { season: "2025/26", team: "primera", date: "2026-03", rival: "Pas Piélagos", home: null, res: null, note: "Vuelta" },
  { season: "2025/26", team: "segunda", date: "2026-03", rival: "Baloncesto Colindres", home: null, res: null, note: "Segunda fase" },
  { season: "2025/26", team: "segunda", date: "2026-03", rival: "Arsan Astillero", home: null, res: null, note: "Segunda fase" },
  { season: "2025/26", team: "segunda", date: "2026-03", rival: "Daygon Baloncesto", home: null, res: null, note: "Segunda fase" },
  { season: "2025/26", team: "segunda", date: "2026-03", rival: "Baloncesto Bezana", home: null, res: null, note: "Segunda fase, vuelta" },
];

const VIDEOS = [
  { id: "3199540490072185", title: "Ascenso a Primera y Final Four", sub: "La victoria que dio el ascenso al club" },
  { id: "305840216957655", title: "Visita a Colindres", sub: "Partido de liga, 62-52 para el local" },
  { id: "2017895515657901", title: "Resumen de noviembre", sub: "Temporada 2025/26, los dos equipos", tall: true },
];

const INSTAGRAM_POSTS = ["DRNTrpDCLJh", "DVjWTorCPCf", "DP3mNkACFzc"];

const US = "Brokers";
const state = { team: "all", season: "2026/27" };
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const hasTime = (f) => f.date.length > 7;
const toDate = (f) => new Date(hasTime(f) ? f.date : f.date + "-01T00:00");

function formatDate(f) {
  const d = toDate(f);
  if (!hasTime(f)) return { main: d.toLocaleDateString("es-ES", { month: "long" }), sub: String(d.getFullYear()) };
  return {
    main: d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" }),
    sub: d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) + " h",
  };
}

function matchup(f) {
  const us = `<span class="us">${US}</span>`;
  const them = esc(f.rival);
  return f.home === false ? `${them}<em>vs</em>${us}` : `${us}<em>vs</em>${them}`;
}

function result(f) {
  if (f.res === "W") return `<span class="fx__res fx__res--w">Victoria${f.score ? " " + esc(f.score) : ""}</span>`;
  if (f.res === "L") return `<span class="fx__res fx__res--l">Derrota${f.score ? " " + esc(f.score) : ""}</span>`;
  const past = toDate(f) < new Date();
  return `<span class="fx__res fx__res--p">${past ? "Disputado" : "Próximo"}</span>`;
}

function renderFixtures() {
  const list = FIXTURES
    .filter((f) => f.season === state.season && (state.team === "all" || f.team === state.team))
    .sort((a, b) => toDate(a) - toDate(b));

  $("#season-label").textContent = state.season;

  if (!list.length) {
    $("#fixtures").innerHTML = `<li class="fx fx--empty"><div>
      <h3>Calendario ${esc(state.season)} en camino</h3>
      <p>La Federación Cántabra aún no ha publicado los emparejamientos. En cuanto salgan, los verás aquí con fecha, hora y pabellón.</p>
      <button class="btn btn--ghost btn--sm" data-go="2025/26">Ver temporada 2025/26</button>
    </div></li>`;
    $("#fixtures [data-go]").addEventListener("click", (e) => setSeason(e.currentTarget.dataset.go));
    return;
  }

  $("#fixtures").innerHTML = list.map((f, i) => {
    const d = formatDate(f);
    const where = f.venue ? `, en ${esc(f.venue)}` : f.home === true ? ", en C.P. Eloy Villanueva" : "";
    const note = f.note ? `. ${esc(f.note)}` : "";
    return `<li class="fx" style="animation-delay:${Math.min(i, 10) * 30}ms">
      <div class="fx__date">${d.main}<small>${d.sub}</small></div>
      <div><div class="fx__teams">${matchup(f)}</div><span class="fx__comp">${TEAMS[f.team]}${where}${note}</span></div>
      ${result(f)}
    </li>`;
  }).join("");
}

function renderNext() {
  const now = new Date();
  const next = FIXTURES.filter((f) => hasTime(f) && toDate(f) > now).sort((a, b) => toDate(a) - toDate(b))[0];

  if (!next) {
    $("#next").innerHTML = `<div class="next__label"><span>Próximo partido</span><i>Temporada 2026/27</i></div>
      <div class="next__empty">
        <img src="assets/escudo.jpg" alt="Escudo de Financial Brokers" width="76" height="76">
        <div><h3>Pretemporada</h3><p>El calendario se publicará en cuanto lo confirme la federación.</p></div>
      </div>`;
    return;
  }

  const d = formatDate(next);
  const initials = next.rival.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const us = `<div class="next__side"><img src="assets/escudo.jpg" alt="" width="72" height="72">${US}</div>`;
  const them = `<div class="next__side"><span class="next__crest">${esc(initials)}</span>${esc(next.rival)}</div>`;
  $("#next").innerHTML = `<div class="next__label"><span>Próximo partido</span><i>${TEAMS[next.team]}</i></div>
    <div class="next__vs">${next.home === false ? them + '<span class="next__x">vs</span>' + us : us + '<span class="next__x">vs</span>' + them}</div>
    <div class="next__when"><b>${d.main} · ${d.sub}</b><span>${esc(next.venue || (next.home === false ? "Fuera de casa" : "C.P. Eloy Villanueva, Santander"))}</span></div>`;
}

function renderForm() {
  document.querySelectorAll("[data-form]").forEach((box) => {
    const played = FIXTURES.filter((f) => f.team === box.dataset.form && f.res).sort((a, b) => toDate(a) - toDate(b));
    if (!played.length) return;
    const label = played.map((f) => `${f.res === "W" ? "victoria" : "derrota"} ante ${f.rival}`).join(", ");
    box.innerHTML = `<span class="form__label">Racha, noviembre 25/26</span>
      <ol class="form__row" aria-label="${esc(label)}">${played.map((f) =>
        `<li class="form__cell form__cell--${f.res === "W" ? "w" : "l"}" title="${esc(f.rival)}">${f.res === "W" ? "V" : "D"}</li>`).join("")}</ol>`;
  });
}

function renderMedia() {
  const clip = (v) => `<figure class="clip${v.tall ? " clip--tall" : ""}">
      <div class="clip__frame" data-video="${v.id}"></div>
      <figcaption><b>${esc(v.title)}</b><span>${esc(v.sub)}</span></figcaption>
    </figure>`;
  const wide = VIDEOS.filter((v) => !v.tall);
  const tall = VIDEOS.filter((v) => v.tall);
  $("#media").innerHTML = `<div class="media__stack">${wide.map(clip).join("")}</div>${tall.map(clip).join("")}`;

  document.querySelectorAll("[data-video]").forEach((box) => {
    const href = encodeURIComponent(`https://www.facebook.com/financialbbasket/videos/${box.dataset.video}/`);
    const w = Math.round(box.clientWidth);
    box.innerHTML = `<iframe src="https://www.facebook.com/plugins/video.php?href=${href}&show_text=false&width=${w}" loading="lazy" title="Vídeo de Financial Brokers en Facebook" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowfullscreen></iframe>`;
  });

  $("#photos").innerHTML = INSTAGRAM_POSTS.map((id) =>
    `<iframe src="https://www.instagram.com/p/${id}/embed/" loading="lazy" title="Publicación de Instagram de Financial Brokers"></iframe>`
  ).join("");
  sizePhotos();
}

function sizePhotos() {
  document.querySelectorAll("#photos iframe").forEach((f) => { f.height = Math.round(f.clientWidth * 1.25 + 170); });
}
addEventListener("resize", sizePhotos);

document.querySelectorAll(".tabs button").forEach((b) => b.addEventListener("click", () => {
  document.querySelectorAll(".tabs button").forEach((x) => x.setAttribute("aria-selected", x === b));
  state.team = b.dataset.team;
  renderFixtures();
}));

function setSeason(season) {
  document.querySelectorAll(".seasons button").forEach((x) => x.setAttribute("aria-pressed", x.dataset.season === season));
  state.season = season;
  renderFixtures();
}

document.querySelectorAll(".seasons button").forEach((b) => b.addEventListener("click", () => setSeason(b.dataset.season)));

const toggle = $(".nav__toggle");
const menu = $("#menu");
toggle.addEventListener("click", () => {
  const open = menu.classList.toggle("open");
  toggle.setAttribute("aria-expanded", open);
});
menu.addEventListener("click", (e) => {
  if (e.target.closest("a")) { menu.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }
});

$("#year").textContent = new Date().getFullYear();
renderNext();
renderFixtures();
renderForm();
renderMedia();
