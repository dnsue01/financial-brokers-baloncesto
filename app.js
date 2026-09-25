const TEAMS = {
  primera: "Primera División",
  segunda: "Segunda Autonómica",
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
let FIXTURES = [...ARCHIVE];
const state = { team: "all", season: "2025/26", expanded: false };
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

const hasDay = (f) => f.date.length >= 10;
const hasTime = (f) => f.date.length > 10 && f.timeKnown !== false;
const toDate = (f) => new Date(f.date.length === 7 ? f.date + "-01T00:00" : f.date.length === 10 ? f.date + "T00:00" : f.date);
const initials = (name) => name.replace(/^(CB|AD|ADB|CD|UC|CBT)\s+/i, "").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
const crestUs = (size = 48) => `<img class="crest" src="assets/escudo.jpg" alt="" width="${size}" height="${size}">`;
const crestThem = (f) => f.rivalCrest
  ? `<img class="crest" src="${esc(f.rivalCrest)}" alt="" width="48" height="48" loading="lazy">`
  : `<span class="crest crest--txt" aria-hidden="true">${esc(initials(f.rival))}</span>`;
const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

function formatDate(f) {
  const d = toDate(f);
  if (!hasDay(f)) return { main: d.toLocaleDateString("es-ES", { month: "long" }), sub: String(d.getFullYear()) };
  if (!hasTime(f)) return { main: d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" }), sub: "Hora por confirmar" };
  return {
    main: d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" }),
    sub: d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) + " h",
  };
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
  const text = raw
    .replace(/[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}️‍]/gu, "")
    .replace(/#[\p{L}\d_]+/gu, "")
    .replace(/!{2,}/g, "!")
    .replace(/^\s*\d+\s*[°º]\s*-\s*/gm, "")
    .replace(/[ \t]+/g, " ")
    .replace(/ ([,.!?])/g, "$1");
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l && !/^\d{1,2}\/\d{1,2}\/\d{2,4}\s*@/.test(l) && !/^@[\w.]+$/.test(l));
  const cut = (s, n) => (s.length > n ? s.slice(0, s.lastIndexOf(" ", n)) + "..." : s);
  const title = cut(lines[0] || "Financial Brokers", 90);
  const body = cut(lines.slice(1).join(" "), 220);
  return { title, body, credit };
}

async function loadFeed() {
  try {
    const res = await fetch("data/feed.json", { cache: "no-cache" });
    if (!res.ok) throw new Error(res.status);
    const feed = await res.json();
    return { updated: feed.updated, posts: feed.posts.filter((p) => p.image).map((p) => ({ ...p, ...cleanCaption(p.caption || "") })) };
  } catch {
    return { updated: null, posts: [] };
  }
}

function initHero(posts) {
  const slidesEl = $("#slides");
  const add = (cls, html) => {
    const slide = document.createElement("article");
    slide.className = `slide ${cls}`;
    slide.innerHTML = `<div class="wrap slide__in">${html}</div>`;
    slidesEl.append(slide);
  };

  const today = startOfToday();
  ["primera", "segunda"].forEach((team) => {
    const f = FIXTURES.filter((x) => x.team === team && hasDay(x) && !x.res && toDate(x) >= today).sort((a, b) => toDate(a) - toDate(b))[0];
    if (!f) return;
    const d = formatDate(f);
    const us = `<div class="vs__side">${crestUs(120)}<b>${US}</b></div>`;
    const them = `<div class="vs__side">${f.rivalCrest ? `<img class="crest" src="${esc(f.rivalCrest)}" alt="" width="120" height="120">` : crestThem(f)}<b>${esc(f.rival)}</b></div>`;
    add("slide--match", `
      <div class="slide__copy">
        <p class="slide__kicker">Próximo partido, ${esc(TEAMS[f.team])}${f.matchday ? `, jornada ${f.matchday}` : ""}</p>
        <h2 class="slide__title">${esc(d.main)}${hasTime(f) ? `<br><span>${esc(d.sub)}</span>` : ""}</h2>
        <p class="slide__text">${f.home ? "En casa" : "Fuera"}, ${esc(f.venue || "")}.</p>
        ${hasTime(f) ? `<div class="countdown countdown--big" data-at="${toDate(f).toISOString()}"></div>` : ""}
        <div class="slide__cta"><a class="btn" href="#calendario">Ver calendario</a></div>
      </div>
      <div class="vs">${f.home === false ? them + '<span class="vs__x">vs</span>' + us : us + '<span class="vs__x">vs</span>' + them}</div>`);
  });

  const fresh = posts.filter((p) => p.date && (Date.now() - new Date(p.date)) / 86400000 < 60).slice(0, 2);
  fresh.forEach((p) => add("slide--post", `
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
  const dots = $("#hero-dots");
  dots.innerHTML = slides.map((_, i) => `<button class="dot" role="tab" aria-label="Destacado ${i + 1} de ${slides.length}" aria-selected="false"></button>`).join("");
  $("#hero-controls").hidden = false;
  hero.style.setProperty("--slide-ms", SLIDE_MS + "ms");

  let current = -1;
  let timer = null;
  const show = (i) => {
    current = (i + slides.length) % slides.length;
    slides.forEach((s, k) => { s.classList.toggle("is-active", k === current); s.inert = k !== current; });
    [...dots.children].forEach((d, k) => d.setAttribute("aria-selected", k === current));
    restart();
  };
  const restart = () => {
    clearTimeout(timer);
    if (reduceMotion || hero.classList.contains("is-paused")) return;
    const active = dots.children[current];
    active.style.animation = "none";
    active.offsetWidth;
    active.style.animation = "";
    timer = setTimeout(() => show(current + 1), SLIDE_MS);
  };
  const pause = (on) => {
    hero.classList.toggle("is-paused", on);
    if (on) clearTimeout(timer); else restart();
  };

  if (!reduceMotion) hero.classList.add("is-playing");
  dots.addEventListener("click", (e) => { const i = [...dots.children].indexOf(e.target.closest(".dot")); if (i >= 0) show(i); });
  hero.querySelectorAll(".arrow").forEach((b) => b.addEventListener("click", () => show(current + Number(b.dataset.dir))));
  hero.addEventListener("mouseenter", () => pause(true));
  hero.addEventListener("mouseleave", () => pause(false));
  hero.addEventListener("focusin", () => pause(true));
  hero.addEventListener("focusout", () => pause(false));
  document.addEventListener("visibilitychange", () => pause(document.hidden));
  show(Math.floor(Math.random() * slides.length));
}

function matchCard(f, { next = false, label } = {}) {
  const d = formatDate(f);
  const us = `<div class="mcard__side">${crestUs()}${US}</div>`;
  const them = `<div class="mcard__side">${crestThem(f)}<span>${esc(f.rival)}</span></div>`;
  const sides = f.home === false ? them + '<span class="mcard__vs">vs</span>' + us : us + '<span class="mcard__vs">vs</span>' + them;
  const top = `<div class="mcard__top"><span>${esc(label || TEAMS[f.team])}${f.matchday ? `, J${f.matchday}` : ""}</span><span>${d.main}${hasDay(f) ? `, ${d.sub}` : ` ${d.sub}`}</span></div>`;
  let foot;
  if (f.res) foot = `<div class="mcard__res"><span>${esc(f.score || f.note || "Resultado final")}</span><span class="badge badge--${f.res === "W" ? "w" : "l"}">${f.res === "W" ? "Victoria" : "Derrota"}</span></div>`;
  else if (next && hasTime(f)) foot = `<div class="countdown" data-at="${toDate(f).toISOString()}"></div><div class="mcard__res"><span>${esc(f.venue || "")}</span></div>`;
  else foot = `<div class="mcard__res"><span>${esc(f.venue || (f.home === false ? "Fuera de casa" : "Pabellón Monte, Santander"))}</span><span>${f.home === true ? "En casa" : f.home === false ? "Fuera" : ""}</span></div>`;
  return `<li class="mcard${next ? " mcard--next" : ""}">${top}<div class="mcard__teams">${sides}</div>${foot}</li>`;
}

function renderMatches() {
  const today = startOfToday();
  const upcoming = FIXTURES.filter((f) => hasDay(f) && !f.res && toDate(f) >= today).sort((a, b) => toDate(a) - toDate(b));
  const played = FIXTURES.filter((f) => f.res).sort((a, b) => toDate(b) - toDate(a));
  const cards = [];

  played.slice(0, 3).reverse().forEach((f) => cards.push(matchCard(f)));
  if (upcoming.length) {
    upcoming.slice(0, 8).forEach((f, i) => cards.push(matchCard(f, { next: i === 0, label: i === 0 ? `Próximo, ${TEAMS[f.team]}` : null })));
  } else {
    cards.push(`<li class="mcard mcard--next">
      <div class="mcard__top"><span>Próxima temporada</span><span>Pretemporada</span></div>
      <div class="mcard__teams"><div class="mcard__side">${crestUs()}${US}</div><span class="mcard__vs">vs</span><div class="mcard__side"><span class="crest crest--txt">?</span>Por confirmar</div></div>
      <div class="mcard__res"><span>Calendario pendiente de la federación</span></div>
    </li>`);
  }
  if (!upcoming.length || played.length > 3) played.slice(3, 9).forEach((f) => cards.push(matchCard(f)));

  $("#matches").innerHTML = cards.join("");
  const nextCard = $("#matches .mcard--next");
  if (nextCard && played.length) requestAnimationFrame(() => { const row = $("#matches"); row.scrollLeft += nextCard.getBoundingClientRect().left - row.getBoundingClientRect().left; });
  tickCountdown();
}

let countdownTimer;
function tickCountdown() {
  clearTimeout(countdownTimer);
  document.querySelectorAll(".countdown").forEach((el) => {
    const diff = Math.max(0, new Date(el.dataset.at) - new Date());
    const parts = [[Math.floor(diff / 86400000), "días"], [Math.floor(diff / 3600000) % 24, "horas"], [Math.floor(diff / 60000) % 60, "min"]];
    el.setAttribute("aria-label", `Faltan ${parts.map(([n, l]) => `${n} ${l}`).join(", ")}`);
    el.innerHTML = parts.map(([n, l]) => `<span aria-hidden="true">${String(n).padStart(2, "0")}<small>${l}</small></span>`).join("");
  });
  countdownTimer = setTimeout(tickCountdown, 30000);
}

function renderNews(feed) {
  const box = $("#news");
  if (!feed.posts.length) {
    box.innerHTML = `<p class="news__empty">Las últimas publicaciones del club aparecerán aquí. Mientras tanto, síguelas en <a class="link" href="https://www.instagram.com/financialbbasket/" target="_blank" rel="noopener">Instagram</a>.</p>`;
    return;
  }
  const posts = feed.posts.slice(0, 5);
  box.innerHTML = posts.map((p, i) => `<a class="news__card${i === 0 ? " news__card--lead" : ""} reveal" href="https://www.instagram.com/p/${esc(p.code)}/" target="_blank" rel="noopener">
      <img src="${esc(p.image)}" alt="" loading="lazy">
      <span class="news__body">
        <span class="news__date">${esc(relative(p.date))}${p.credit ? `. Foto: ${esc(p.credit)}` : ""}</span>
        <span class="news__title">${esc(p.title)}</span>
        ${p.body ? `<span class="news__text">${esc(p.body)}</span>` : ""}
      </span>
    </a>`).join("");
  if (posts.length < 5) box.style.gridTemplateColumns = `repeat(${Math.max(posts.length, 1) + (posts.length > 1 ? 1 : 0)}, 1fr)`;
  if (feed.updated) $("#feed-updated").textContent = `Actualizado ${relative(feed.updated)} desde Instagram`;
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
  return `<span class="fx__res fx__res--p">${past ? "Disputado" : f.home === true ? "En casa" : f.home === false ? "Fuera" : "Próximo"}</span>`;
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

  const today = startOfToday();
  const firstUpcoming = list.findIndex((f) => !f.res && hasDay(f) && toDate(f) >= today);
  const from = firstUpcoming > 2 ? firstUpcoming - 2 : 0;
  const visible = state.expanded || list.length <= 12 ? list : list.slice(from, from + 10);
  let month = "";
  const rows = visible.map((f, i) => {
    const d = formatDate(f);
    const where = f.venue ? `, en ${esc(f.venue)}` : f.home === true ? ", en Pabellón Monte" : "";
    const note = f.note ? `. ${esc(f.note)}` : "";
    const m = toDate(f).toLocaleDateString("es-ES", { month: "long", year: "numeric" });
    const header = m !== month ? `<li class="fx-month">${esc(m)}</li>` : "";
    month = m;
    return `${header}<li class="fx" style="animation-delay:${Math.min(i, 10) * 30}ms">
      <div class="fx__date">${d.main}<small>${d.sub}</small></div>
      <div><div class="fx__teams">${matchup(f)}</div><span class="fx__comp">${TEAMS[f.team]}${f.matchday ? `, jornada ${f.matchday}` : ""}${where}${note}</span></div>
      ${result(f)}
    </li>`;
  });
  if (visible.length < list.length) rows.push(`<li class="fx-more"><button class="btn btn--ghost" data-expand>Ver temporada completa (${list.length} partidos)</button></li>`);
  $("#fixtures").innerHTML = rows.join("");
  $("#fixtures [data-expand]")?.addEventListener("click", () => { state.expanded = true; renderFixtures(); });
}

function setSeason(season) {
  document.querySelectorAll(".seasons button").forEach((x) => x.setAttribute("aria-pressed", x.dataset.season === season));
  state.season = season;
  state.expanded = false;
  renderFixtures();
}

function renderForm() {
  document.querySelectorAll("[data-form]").forEach((box) => {
    const team = FIXTURES.filter((f) => f.team === box.dataset.form && f.res);
    if (!team.length) return;
    const season = team.map((f) => f.season).sort().at(-1);
    const played = team.filter((f) => f.season === season).sort((a, b) => toDate(a) - toDate(b)).slice(-5);
    const label = played.map((f) => `${f.res === "W" ? "victoria" : "derrota"} ante ${f.rival}`).join(", ");
    const when = season === "2025/26" ? "noviembre 25/26" : season;
    box.innerHTML = `<span class="form__label">Últimos resultados, ${esc(when)}</span>
      <ol class="form__row" aria-label="${esc(label)}">${played.map((f) =>
        `<li class="form__cell form__cell--${f.res === "W" ? "w" : "l"}" title="${esc(f.rival)}">${f.res === "W" ? "V" : "D"}</li>`).join("")}</ol>`;
  });
}

function renderTeamNext() {
  const today = startOfToday();
  document.querySelectorAll("[data-next]").forEach((dd) => {
    const next = FIXTURES.filter((f) => f.team === dd.dataset.next && hasDay(f) && !f.res && toDate(f) >= today).sort((a, b) => toDate(a) - toDate(b))[0];
    if (!next) return;
    const d = formatDate(next);
    dd.textContent = `${d.main}, ${next.home === false ? "en casa de" : "vs"} ${next.rival}`;
    dd.title = `${next.home === false ? next.rival + " vs Brokers" : "Brokers vs " + next.rival}, ${d.sub}`;
  });
}

async function loadFixtures() {
  try {
    const res = await fetch("data/fixtures.json", { cache: "no-cache" });
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    FIXTURES = [...ARCHIVE.filter((f) => f.season !== data.season), ...data.matches];
    state.season = data.season;
    document.querySelector('.seasons [data-season="2026/27"]')?.setAttribute("data-season", data.season);
    document.querySelectorAll(".seasons button").forEach((b) => { if (b.dataset.season === data.season) b.textContent = data.season; });
  } catch {}
}

function renderMedia() {
  const featured = [...VIDEOS];
  const wide = featured.filter((v) => !v.tall);
  const lead = Math.floor(Math.random() * wide.length);
  wide.unshift(...wide.splice(lead, 1));
  const clip = (v) => `<figure class="clip${v.tall ? " clip--tall" : ""}">
      <div class="clip__frame" data-video="${v.id}"></div>
      <figcaption><b>${esc(v.title)}</b><span>${esc(v.sub)}</span></figcaption>
    </figure>`;
  $("#media").innerHTML = `<div class="media__stack">${wide.map(clip).join("")}</div>${featured.filter((v) => v.tall).map(clip).join("")}`;

  document.querySelectorAll("[data-video]").forEach((box) => {
    const href = encodeURIComponent(`https://www.facebook.com/financialbbasket/videos/${box.dataset.video}/`);
    box.innerHTML = `<iframe src="https://www.facebook.com/plugins/video.php?href=${href}&show_text=false&width=${Math.round(box.clientWidth)}" loading="lazy" title="Vídeo de Financial Brokers en Facebook" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowfullscreen></iframe>`;
  });
}

document.querySelectorAll(".tabs button").forEach((b) => b.addEventListener("click", () => {
  document.querySelectorAll(".tabs button").forEach((x) => x.setAttribute("aria-selected", x === b));
  state.team = b.dataset.team;
  renderFixtures();
}));
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
renderMedia();
Promise.all([loadFixtures(), loadFeed()]).then(([, feed]) => {
  setSeason(state.season);
  renderMatches();
  renderForm();
  renderTeamNext();
  renderNews(feed);
  initHero(feed.posts);
});
