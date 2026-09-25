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
  { season: "2025/26", team: "segunda", date: "2026-03", rival: "Baloncesto Bezana", home: null, res: null, note: "Segunda fase · vuelta" },
];

const INSTAGRAM_POSTS = ["DRNTrpDCLJh", "DSIANVCiGC_", "DVjWTorCPCf"];

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
    const where = f.venue ? ` · ${esc(f.venue)}` : f.home === true ? " · C.P. Eloy Villanueva" : "";
    const note = f.note ? ` · ${esc(f.note)}` : "";
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
    $("#next").innerHTML = `<div class="next__label"><span>Próximo partido</span><i>2026/27</i></div>
      <div class="next__empty">
        <img class="crest-big" src="assets/escudo.jpg" alt="Escudo de Financial Brokers" width="96" height="96">
        <h3>Pretemporada en marcha</h3>
        <p>El calendario de la nueva temporada se publicará en breve. Mientras tanto, síguenos en redes para no perderte nada.</p>
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

function renderTicker() {
  const items = ["#GoBrokers", "Primera División Nacional", "Segunda Autonómica", "C.P. Eloy Villanueva", "Santander · Cantabria", "Temporada 2026/27"];
  const html = items.map((t) => `<span>${t}</span>`).join("");
  $("#ticker").innerHTML = html + html;
}

function renderGallery() {
  $("#gallery").innerHTML = INSTAGRAM_POSTS.map((id) =>
    `<iframe src="https://www.instagram.com/p/${id}/embed/" loading="lazy" title="Publicación de Instagram de Financial Brokers" allowtransparency="true"></iframe>`
  ).join("");
  sizeGallery();
}

function sizeGallery() {
  document.querySelectorAll("#gallery iframe").forEach((f) => { f.height = Math.round(f.clientWidth * 1.25 + 120); });
}
addEventListener("resize", sizeGallery);

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
renderTicker();
renderNext();
renderFixtures();
renderGallery();
