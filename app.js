const TEAMS = {
  primera: "1ª División",
  segunda: "Autonómica Sénior",
};

// Temporadas sin datos en la federación. La temporada activa llega sola en data/fixtures.json.
const ARCHIVE = [
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


const US = "Brokers";
const SLIDE_MS = 7000;
const STALE_DAYS = 60;
let FIXTURES = [...ARCHIVE];
let STANDINGS = {};
let TEAM_INFO = {};
let SEASON = null;
const state = { team: "all", season: "2025/26", expanded: false };
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

const hasDay = (f) => f.date.length >= 10;
const hasTime = (f) => f.date.length > 10 && f.timeKnown !== false;
const toDate = (f) => new Date(f.date.length === 7 ? f.date + "-01T00:00" : f.date.length === 10 ? f.date + "T00:00" : f.date);
const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const isUpcoming = (f) => !f.rest && !f.res && hasDay(f) && toDate(f) >= startOfToday();
const byDate = (a, b) => toDate(a) - toDate(b);
const nextFor = (team) => FIXTURES.filter((f) => f.team === team && isUpcoming(f)).sort(byDate)[0];
const initials = (name) => name.replace(/^(CB|AD|ADB|CD|UC|CBT)\s+/i, "").split(/\s+/).filter((w) => /\p{L}/u.test(w)).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
const crestUs = (size = 48) => `<img class="crest" src="assets/escudo.jpg" alt="" width="${size}" height="${size}">`;
const crestThem = (f, size = 48) => f.rivalCrest
  ? `<img class="crest" src="${esc(f.rivalCrest)}" alt="" width="${size}" height="${size}" loading="lazy">`
  : `<span class="crest crest--txt" aria-hidden="true">${esc(initials(f.rival || "?"))}</span>`;

function formatDate(f) {
  const d = toDate(f);
  if (!hasDay(f)) return { main: "Sin fecha", sub: "exacta" };
  const main = d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
  if (!hasTime(f)) return { main, sub: "Hora por confirmar" };
  return { main, sub: d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) + " h" };
}

function relative(iso) {
  if (!iso) return "";
  const days = Math.round((new Date(iso) - new Date()) / 86400000);
  const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
  if (Math.abs(days) < 7) return rtf.format(days, "day");
  if (Math.abs(days) < 45) return rtf.format(Math.round(days / 7), "week");
  if (Math.abs(days) < 365) return rtf.format(Math.round(days / 30), "month");
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

function cleanCaption(raw) {
  const credit = (raw.match(/[\u{1F4F7}\u{1F4F8}][^@\n]*(@[\w.]+)/u) || [])[1] || null;
  const handle = (h) => h.slice(1).split(/[_.]/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
  const text = raw
    .replace(/[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}\u{FE0F}\u{200D}]/gu, "")
    .replace(/#[\p{L}\d_]+/gu, "")
    .replace(/!{2,}/g, "!")
    .replace(/^\s*\d+\s*[°º]\s*-\s*/gm, "")
    .replace(/[ \t]+/g, " ")
    .replace(/ ([,.!?])/g, "$1");
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l && !/^\d{1,2}\/\d{1,2}\/\d{2,4}\s*@/.test(l) && !/^@[\w.]+$/.test(l));
  const cut = (s, n) => (s.length > n ? s.slice(0, s.lastIndexOf(" ", n)) + "..." : s);
  const title = cut((lines[0] || "Financial Brokers").replace(/@[\w.]+/g, handle), 90);
  const body = cut(lines.slice(1).join(" ").replace(/@[\w.]+/g, handle), 220);
  return { title, body, credit };
}

async function getJSON(url) {
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) throw new Error(res.status);
  return res.json();
}

async function loadFeed() {
  try {
    const feed = await getJSON("data/feed.json");
    return { updated: feed.updated, posts: feed.posts.filter((p) => p.image).map((p) => ({ ...p, ...cleanCaption(p.caption || "") })) };
  } catch {
    return { updated: null, posts: [] };
  }
}

async function loadFixtures() {
  try {
    const data = await getJSON("data/fixtures.json");
    FIXTURES = [...ARCHIVE.filter((f) => f.season !== data.season), ...data.matches];
    STANDINGS = data.standings || {};
    TEAM_INFO = data.teams || {};
    SEASON = data.season;
    state.season = data.season;
    document.querySelectorAll(".seasons button").forEach((b, i) => { if (i === 0) { b.dataset.season = data.season; b.textContent = data.season; } });
  } catch {}
}

function countdownHTML(f, big = false) {
  return `<div class="countdown${big ? " countdown--big" : ""}" role="timer" data-at="${toDate(f).toISOString()}"></div>`;
}

let countdownTimer;
function tickCountdown() {
  clearTimeout(countdownTimer);
  document.querySelectorAll(".countdown").forEach((el) => {
    const diff = Math.max(0, new Date(el.dataset.at) - new Date());
    const parts = [[Math.floor(diff / 86400000), "días"], [Math.floor(diff / 3600000) % 24, "horas"], [Math.floor(diff / 60000) % 60, "min"]];
    el.innerHTML = `<span class="sr-only">Faltan ${parts.map(([n, l]) => `${n} ${l}`).join(", ")}</span>`
      + parts.map(([n, l]) => `<span aria-hidden="true">${String(n).padStart(2, "0")}<small>${l}</small></span>`).join("");
  });
  countdownTimer = setTimeout(tickCountdown, 30000);
}

const ICONS = {
  prev: '<path d="M15 6l-6 6l6 6"/>',
  next: '<path d="M9 6l6 6l-6 6"/>',
  pause: '<path d="M6 5h4v14h-4z"/><path d="M14 5h4v14h-4z"/>',
  play: '<path d="M7 4v16l13 -8z"/>',
};
const icon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;

function initHero(posts) {
  const slidesEl = $("#slides");
  const add = (cls, html) => {
    const slide = document.createElement("article");
    slide.className = `slide ${cls}`;
    slide.innerHTML = `<div class="wrap slide__in">${html}</div>`;
    slidesEl.append(slide);
  };

  ["primera", "segunda"].forEach((team) => {
    const f = nextFor(team);
    if (!f) return;
    const d = formatDate(f);
    const us = `<div class="vs__side">${crestUs(120)}<b>${US}</b></div>`;
    const them = `<div class="vs__side">${crestThem(f, 120)}<b>${esc(f.rival)}</b></div>`;
    add("slide--match", `
      <div class="slide__copy">
        <p class="slide__kicker">Próximo partido, ${esc(TEAMS[f.team])}${f.matchday ? `, jornada ${f.matchday}` : ""}</p>
        <h2 class="slide__title">${esc(d.main)}${hasTime(f) ? `<br><span>${esc(d.sub)}</span>` : ""}</h2>
        <p class="slide__text">${f.home ? "En casa" : "Fuera"}${f.venue ? `, ${esc(f.venue)}` : ""}.</p>
        ${hasTime(f) ? countdownHTML(f, true) : ""}
        <div class="slide__cta"><a class="btn" href="#calendario">Ver calendario</a></div>
      </div>
      <div class="vs">${f.home === false ? them + '<span class="vs__x">vs</span>' + us : us + '<span class="vs__x">vs</span>' + them}</div>`);
  });

  posts.filter((p) => p.date && (Date.now() - new Date(p.date)) / 86400000 < STALE_DAYS).slice(0, 2).forEach((p) => add("slide--post", `
      <div class="slide__copy">
        <p class="slide__kicker">Instagram, ${esc(relative(p.date))}</p>
        <h2 class="slide__title">${esc(p.title)}</h2>
        ${p.body ? `<p class="slide__text">${esc(p.body.length > 140 ? p.body.slice(0, p.body.lastIndexOf(" ", 140)) + "..." : p.body)}</p>` : ""}
        <div class="slide__cta"><a class="btn" href="https://www.instagram.com/p/${esc(p.code)}/" target="_blank" rel="noopener">Ver publicación</a></div>
      </div>
      <figure class="slide__media"><img src="${esc(p.image)}" alt="" loading="lazy"></figure>`));
  tickCountdown();

  const slides = [...slidesEl.children];
  if (slides.length < 2) return;
  const hero = $(".hero");
  const controls = $("#hero-controls");
  controls.innerHTML = `<div class="hero__dots" aria-label="Destacados">${slides.map((_, i) => `<button class="dot" aria-label="Destacado ${i + 1} de ${slides.length}"></button>`).join("")}</div>
    <div class="hero__arrows">
      <button class="arrow" data-play aria-label="Pausar carrusel">${icon("pause")}</button>
      <button class="arrow arrow--nav" data-dir="-1" aria-label="Destacado anterior">${icon("prev")}</button>
      <button class="arrow arrow--nav" data-dir="1" aria-label="Destacado siguiente">${icon("next")}</button>
    </div>`;
  controls.hidden = false;
  hero.style.setProperty("--slide-ms", SLIDE_MS + "ms");
  const dots = [...controls.querySelectorAll(".dot")];
  const playBtn = controls.querySelector("[data-play]");

  let current = -1;
  let timer = null;
  let stopped = reduceMotion;
  let hovering = false;
  const running = () => !stopped && !hovering && !document.hidden;
  const show = (i) => {
    current = (i + slides.length) % slides.length;
    slides.forEach((s, k) => { s.classList.toggle("is-active", k === current); s.inert = k !== current; });
    dots.forEach((d, k) => (k === current ? d.setAttribute("aria-current", "true") : d.removeAttribute("aria-current")));
    restart();
  };
  const restart = () => {
    clearTimeout(timer);
    hero.classList.toggle("is-playing", !stopped);
    hero.classList.toggle("is-paused", !running());
    if (!running()) return;
    const active = dots[current];
    active.classList.remove("dot--run");
    active.offsetWidth;
    active.classList.add("dot--run");
    timer = setTimeout(() => show(current + 1), SLIDE_MS);
  };
  const setStopped = (on) => {
    stopped = on;
    playBtn.innerHTML = icon(on ? "play" : "pause");
    playBtn.setAttribute("aria-label", on ? "Reproducir carrusel" : "Pausar carrusel");
    restart();
  };

  setStopped(stopped);
  dots.forEach((d, i) => d.addEventListener("click", () => show(i)));
  controls.querySelectorAll("[data-dir]").forEach((b) => b.addEventListener("click", () => show(current + Number(b.dataset.dir))));
  playBtn.addEventListener("click", () => setStopped(!stopped));
  $("#slides").addEventListener("mouseenter", () => { hovering = true; restart(); });
  $("#slides").addEventListener("mouseleave", () => { hovering = false; restart(); });
  document.addEventListener("visibilitychange", restart);
  show(Math.floor(Math.random() * slides.length));
}

function matchup(f, cls = "us") {
  const us = `<span class="${cls}">${US}</span>`;
  const them = esc(f.rival);
  if (f.home === null || f.home === undefined) return `${us}<em>ante</em>${them}`;
  return f.home === false ? `${them}<em>vs</em>${us}` : `${us}<em>vs</em>${them}`;
}

function matchCard(f, { next = false, label } = {}) {
  const d = formatDate(f);
  const us = `<div class="mcard__side">${crestUs()}<span>${US}</span></div>`;
  const them = `<div class="mcard__side">${crestThem(f)}<span>${esc(f.rival)}</span></div>`;
  const sides = f.home === false ? them + '<span class="mcard__vs">vs</span>' + us : us + '<span class="mcard__vs">vs</span>' + them;
  const top = `<div class="mcard__top"><span>${esc(label || TEAMS[f.team])}${f.matchday ? `, J${f.matchday}` : ""}</span><span>${d.main}, ${d.sub}</span></div>`;
  const where = f.home === true ? "En casa" : f.home === false ? "Fuera" : "";
  let foot;
  if (f.res) foot = `<div class="mcard__res"><span>${esc(f.score || f.note || "Resultado final")}</span><span class="badge badge--${f.res === "W" ? "w" : "l"}">${f.res === "W" ? "Victoria" : "Derrota"}</span></div>`;
  else if (next && hasTime(f)) foot = `${countdownHTML(f)}<div class="mcard__res"><span>${esc(f.venue || "")}</span></div>`;
  else foot = `<div class="mcard__res"><span>${esc(f.venue || "")}</span><span>${where}</span></div>`;
  return `<li class="mcard${next ? " mcard--next" : ""}">${top}<div class="mcard__teams">${sides}</div>${foot}</li>`;
}

function renderMatches() {
  const season = SEASON || state.season;
  const upcoming = FIXTURES.filter(isUpcoming).sort(byDate);
  const played = FIXTURES.filter((f) => f.res && f.season === season).sort(byDate);
  const cards = played.slice(-4).map((f) => matchCard(f));
  if (upcoming.length) {
    upcoming.slice(0, 8).forEach((f, i) => cards.push(matchCard(f, { next: i === 0, label: i === 0 ? `Próximo, ${TEAMS[f.team]}` : null })));
  } else {
    cards.push(`<li class="mcard mcard--next">
      <div class="mcard__top"><span>Próxima temporada</span><span>Pretemporada</span></div>
      <div class="mcard__teams"><div class="mcard__side">${crestUs()}<span>${US}</span></div><span class="mcard__vs">vs</span><div class="mcard__side"><span class="crest crest--txt">?</span><span>Por confirmar</span></div></div>
      <div class="mcard__res"><span>Calendario pendiente de la federación</span></div>
    </li>`);
  }
  const row = $("#matches");
  row.innerHTML = cards.join("");
  const nextCard = row.querySelector(".mcard--next");
  if (nextCard && played.length) requestAnimationFrame(() => { row.scrollLeft += nextCard.getBoundingClientRect().left - row.getBoundingClientRect().left; });
  tickCountdown();
}

function renderNews(feed) {
  const box = $("#news");
  const posts = feed.posts.filter((p) => !(/calendario/i.test(p.title) && (Date.now() - new Date(p.date)) / 86400000 > 45)).slice(0, 8);
  const latest = feed.posts[0];
  const fresh = latest && (Date.now() - new Date(latest.date)) / 86400000 < STALE_DAYS;
  $("#actualidad h2").textContent = fresh ? "Actualidad" : "Desde Instagram";
  $("#feed-updated").textContent = latest ? `Última publicación ${relative(latest.date)}` : "";
  if (!posts.length) {
    box.innerHTML = `<p class="news__empty">Las publicaciones del club aparecerán aquí. Mientras tanto, síguelas en <a class="link" href="https://www.instagram.com/financialbbasket/" target="_blank" rel="noopener">Instagram</a>.</p>`;
    return;
  }
  box.innerHTML = posts.map((p) => `<a class="post" href="https://www.instagram.com/p/${esc(p.code)}/" target="_blank" rel="noopener">
      <span class="post__media"><img src="${esc(p.image)}" alt="" loading="lazy"></span>
      <span class="post__body">
        <span class="post__date">${esc(relative(p.date))}${p.credit ? `. Foto: ${esc(p.credit)}` : ""}</span>
        <span class="post__title">${esc(p.title)}</span>
        ${p.body ? `<span class="post__text">${esc(p.body)}</span>` : ""}
      </span>
    </a>`).join("");
}

function result(f) {
  if (f.res === "W") return `<span class="fx__res fx__res--w">Victoria${f.score ? " " + esc(f.score) : ""}</span>`;
  if (f.res === "L") return `<span class="fx__res fx__res--l">Derrota${f.score ? " " + esc(f.score) : ""}</span>`;
  const past = toDate(f) < startOfToday();
  return `<span class="fx__res fx__res--p">${past ? "Disputado" : f.home === true ? "En casa" : f.home === false ? "Fuera" : "Pendiente"}</span>`;
}

function renderFixtures() {
  const list = FIXTURES
    .filter((f) => f.season === state.season && (state.team === "all" || f.team === state.team))
    .sort(byDate);

  $("#season-label").textContent = state.season;
  renderStandings();

  if (!list.length) {
    $("#fixtures").innerHTML = `<li class="fx fx--empty"><div>
      <h3>Calendario ${esc(state.season)} en camino</h3>
      <p>La Federación Cántabra aún no ha publicado los emparejamientos. En cuanto salgan, los verás aquí con fecha, hora y pabellón.</p>
    </div></li>`;
    return;
  }

  const firstUpcoming = list.findIndex(isUpcoming);
  const from = firstUpcoming > 2 ? firstUpcoming - 2 : 0;
  const visible = state.expanded || list.length <= 12 ? list : list.slice(from, from + 10);
  let month = "";
  const rows = visible.map((f, i) => {
    const d = formatDate(f);
    const m = hasDay(f) || f.date.length === 7 ? toDate(f).toLocaleDateString("es-ES", { month: "long", year: "numeric" }) : "";
    const header = m !== month ? `<li class="fx-month">${esc(m)}</li>` : "";
    month = m;
    const delay = `style="animation-delay:${Math.min(i, 10) * 30}ms"`;
    if (f.rest) {
      return `${header}<li class="fx fx--rest" ${delay}>
        <div class="fx__date">${esc(toDate(f).toLocaleDateString("es-ES", { day: "numeric", month: "short" }))}<small>Fin de semana</small></div>
        <div><div class="fx__teams"><span class="us">${US}</span><em>descansa</em></div><span class="fx__comp">${TEAMS[f.team]}, jornada ${f.matchday}</span></div>
        <span class="fx__res fx__res--p">Descanso</span>
      </li>`;
    }
    const where = f.venue ? `, en ${esc(f.venue)}` : "";
    const note = f.note ? `. ${esc(f.note)}` : "";
    return `${header}<li class="fx" ${delay}>
      <div class="fx__date">${d.main}<small>${d.sub}</small></div>
      <div><div class="fx__teams">${matchup(f)}</div><span class="fx__comp">${TEAMS[f.team]}${f.matchday ? `, jornada ${f.matchday}` : ""}${where}${note}</span></div>
      ${result(f)}
    </li>`;
  });
  if (visible.length < list.length) rows.push(`<li class="fx-more"><button class="btn btn--ghost" data-expand>Ver temporada completa (${list.filter((f) => !f.rest).length} partidos)</button></li>`);
  $("#fixtures").innerHTML = rows.join("");
  $("#fixtures [data-expand]")?.addEventListener("click", () => { state.expanded = true; renderFixtures(); });
}

function renderStandings() {
  const box = $("#standings");
  const keys = (state.team === "all" ? ["primera", "segunda"] : [state.team]).filter((k) => STANDINGS[k]?.length);
  const show = state.season === SEASON && keys.length;
  box.hidden = !show;
  box.parentElement.classList.toggle("season--full", !show);
  if (!show) return;
  box.innerHTML = keys.map((k) => {
    const rows = STANDINGS[k];
    const played = Math.max(...rows.map((r) => r.pj));
    return `<div class="standing"><div class="standing__head"><h3>${esc(TEAMS[k])}</h3><span>${played ? `Tras ${played} ${played === 1 ? "partido" : "partidos"}` : "Antes de la jornada 1"}</span></div>
    <table class="table">
      <caption class="sr-only">Clasificación de ${esc(TEAMS[k])}</caption>
      <thead><tr><th scope="col"><span class="sr-only">Posición</span></th><th scope="col">Equipo</th><th scope="col" title="Partidos jugados">PJ</th><th scope="col" title="Ganados">G</th><th scope="col" title="Perdidos">P</th><th scope="col" title="Puntos">Pts</th></tr></thead>
      <tbody>${rows.map((r, i) => `<tr${r.us ? ' class="is-us"' : ""}>
        <td>${played ? i + 1 : "-"}</td>
        <th scope="row"><span class="table__team">${r.crest ? `<img src="${esc(r.crest)}" alt="" width="24" height="24" loading="lazy">` : ""}${esc(r.name)}</span></th>
        <td>${r.pj}</td><td>${r.g}</td><td>${r.p}</td><td><b>${r.pts}</b></td>
      </tr>`).join("")}</tbody>
    </table></div>`;
  }).join("");
}

function setSeason(season) {
  document.querySelectorAll(".seasons button").forEach((x) => x.setAttribute("aria-pressed", x.dataset.season === season));
  state.season = season;
  state.expanded = false;
  renderFixtures();
}

function renderForm() {
  document.querySelectorAll("[data-form]").forEach((box) => {
    const team = box.dataset.form;
    const current = FIXTURES.filter((f) => f.team === team && f.res && f.season === SEASON).sort(byDate);
    const archive = FIXTURES.filter((f) => f.team === team && f.res && f.season === "2025/26").sort(byDate);
    const played = (current.length ? current : archive).slice(-5);
    if (!played.length) { box.innerHTML = ""; return; }
    const when = current.length ? `Últimos resultados, ${SEASON}` : "Noviembre de la temporada pasada (2025/26)";
    const label = played.map((f) => `${f.res === "W" ? "victoria" : "derrota"} ante ${f.rival}`).join(", ");
    box.innerHTML = `<span class="form__label">${esc(when)}</span>
      <ol class="form__row" aria-label="${esc(label)}">${played.map((f) =>
        `<li class="form__cell form__cell--${f.res === "W" ? "w" : "l"}" title="${esc(f.rival)}">${f.res === "W" ? "V" : "D"}</li>`).join("")}</ol>`;
  });
}

function renderTeamInfo() {
  document.querySelectorAll("[data-next]").forEach((dd) => {
    const f = nextFor(dd.dataset.next);
    if (!f) return;
    const d = formatDate(f);
    dd.textContent = `${d.main}, ${f.home ? "en casa ante" : "fuera ante"} ${f.rival}`;
  });
  document.querySelectorAll("[data-venue]").forEach((dd) => {
    const venues = TEAM_INFO[dd.dataset.venue]?.venues;
    if (venues?.length) dd.textContent = `Pabellón ${venues.join(" y ")}`;
  });
}

function renderMedia() {
  const wide = VIDEOS.filter((v) => !v.tall);
  wide.unshift(...wide.splice(Math.floor(Math.random() * wide.length), 1));
  const clip = (v) => `<figure class="clip${v.tall ? " clip--tall" : ""}">
      <div class="clip__frame" data-video="${v.id}"></div>
      <figcaption><b>${esc(v.title)}</b><span>${esc(v.sub)}</span></figcaption>
    </figure>`;
  $("#media").innerHTML = `<div class="media__stack">${wide.map(clip).join("")}</div>${VIDEOS.filter((v) => v.tall).map(clip).join("")}`;

  const mount = (box) => {
    const href = encodeURIComponent(`https://www.facebook.com/financialbbasket/videos/${box.dataset.video}/`);
    box.innerHTML = `<iframe src="https://www.facebook.com/plugins/video.php?href=${href}&show_text=false&width=${Math.round(box.clientWidth)}" title="Vídeo de Financial Brokers en Facebook" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowfullscreen></iframe>`;
  };
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { mount(e.target); io.unobserve(e.target); }
  }), { rootMargin: "300px 0px" });
  document.querySelectorAll("[data-video]").forEach((box) => io.observe(box));
}

document.querySelectorAll(".tabs button").forEach((b) => b.addEventListener("click", () => {
  document.querySelectorAll(".tabs button").forEach((x) => x.setAttribute("aria-selected", x === b));
  state.team = b.dataset.team;
  renderFixtures();
}));
document.querySelectorAll(".seasons button").forEach((b) => b.addEventListener("click", () => setSeason(b.dataset.season)));
document.querySelectorAll("[data-strip]").forEach((b) => b.addEventListener("click", () => {
  const row = $("#matches");
  const card = row.querySelector(".mcard");
  row.scrollBy({ left: Number(b.dataset.strip) * (card ? card.offsetWidth + 12 : 260) * 2, behavior: reduceMotion ? "auto" : "smooth" });
}));

const toggle = $(".nav__toggle");
const menu = $("#menu");
const closeMenu = () => { menu.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); };
toggle.addEventListener("click", () => {
  const open = menu.classList.toggle("open");
  toggle.setAttribute("aria-expanded", open);
});
menu.addEventListener("click", (e) => { if (e.target.closest("a")) closeMenu(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && menu.classList.contains("open")) { closeMenu(); toggle.focus(); } });

$("#year").textContent = new Date().getFullYear();
renderMedia();
Promise.all([loadFixtures(), loadFeed()]).then(([, feed]) => {
  setSeason(state.season);
  renderMatches();
  renderForm();
  renderTeamInfo();
  renderNews(feed);
  initHero(feed.posts);
});
