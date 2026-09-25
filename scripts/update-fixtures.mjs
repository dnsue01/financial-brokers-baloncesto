import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const API = "https://esb.optimalwayconsulting.com/fecan/1/GhDqDyahm2TBntKn3JNdpxBppRS5zVeI";
const CLUB_ID = "203";
const OUT = "data/fixtures.json";
const CRESTS = "data/crests";
const HEADERS = { Origin: "https://www.fecanbaloncesto.com", Referer: "https://www.fecanbaloncesto.com/", "User-Agent": "Mozilla/5.0" };

const SHORT_NAMES = [
  [/DAYGON.*U50/, "Daygon U50"],
  [/DAYGON/, "Daygon"],
  [/SPBASKET ROSA/, "SPBasket Rosa"],
  [/SPBASKET BLANCO/, "SPBasket Blanco"],
  [/CBT TORRELAVEGA/, "CBT Torrelavega"],
  [/LA PAZ/, "La Paz Torrelavega"],
  [/COLINDRES/, "Colindres"],
  [/CASTROBASKET/, "Castrobasket"],
  [/BEZANA/, "Bezana"],
  [/ASTILLERO/, "Astillero"],
  [/CANTBASKET/, "Cantbasket 04"],
  [/SOLARES/, "CB Solares"],
  [/CORRALES/, "CB Corrales"],
  [/KING.S/, "King's Santander U22"],
  [/RIBAMONTAN/, "Ribamontán al Mar"],
  [/FINANCIALBROK/, "Financial Brokers"],
  [/INTERMODAL/, "Intermodal Sea Solutions"],
];

const ACCENTS = {
  pabellon: "Pabellón", angel: "Ángel", jose: "José", escandon: "Escandón", botin: "Botín", maria: "María",
  fernandez: "Fernández", numancia: "Numancia", latas: "Latas", calasanz: "Calasanz", n: "nº",
};
const LOWER = new Set(["de", "del", "al", "y"]);
const ARTICLES = new Set(["la", "las", "los", "el"]);

async function esb(path) {
  const res = await fetch(`${API}/${path}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  const text = (await res.text()).trim();
  const json = JSON.parse(text.startsWith("{") ? text : Buffer.from(text, "base64").toString("utf8"));
  if (json.result !== "OK") throw new Error(`${path}: ${json.message}`);
  return json.messageData;
}

const clean = (s) => (s || "").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim();
const shortName = (s) => (SHORT_NAMES.find(([re]) => re.test(clean(s).toUpperCase())) || [, null])[1] || prettify(s);

function prettify(s) {
  return clean(s).toLowerCase().replace(/[º°]/g, "").split(" ").map((w, i, all) => {
    if (ACCENTS[w]) return ACCENTS[w];
    if (i > 0 && (LOWER.has(w) || (ARTICLES.has(w) && LOWER.has(all[i - 1])))) return w;
    return w.replace(/(^|[-(])(\p{L})/gu, (_, a, b) => a + b.toUpperCase());
  }).join(" ");
}

function venueName(field, town) {
  const t = prettify(town || "").replace(/^(.*), (El|La|Los|Las)$/i, (_, a, b) => `${b[0].toUpperCase()}${b.slice(1).toLowerCase()} ${a}`);
  return [prettify(field || ""), t].filter(Boolean).join(", ");
}

async function crest(clubId, url) {
  if (!clubId || !url) return null;
  const ext = (url.match(/\.(png|jpe?g|webp|svg)(\?|$)/i) || [, "jpg"])[1].toLowerCase().replace("jpeg", "jpg");
  const file = `${CRESTS}/${clubId}.${ext}`;
  if (existsSync(file)) return file;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    mkdirSync(CRESTS, { recursive: true });
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    return file;
  } catch { return null; }
}

const isPlayed = (m) => m.localScore !== null && m.visitorScore !== null && m.localScore !== "" && m.visitorScore !== "";

async function group(idGroup) {
  const data = await esb(`FCBQWeb/getAllGamesByGrupWithMatchRecords/${idGroup}`);
  const table = new Map();
  const rows = (m, side) => {
    const id = side === "local" ? m.idLocalTeam : m.idVisitorTeam;
    if (!table.has(id)) table.set(id, { team: id, name: shortName(side === "local" ? m.nameLocalTeam : m.nameVisitorTeam), club: side === "local" ? m.idLocalClub : m.idVisitorClub, logo: side === "local" ? m.logoLocal : m.logoVisitant, pj: 0, g: 0, p: 0, pf: 0, pc: 0, pts: 0 });
    return table.get(id);
  };
  const rests = {};
  for (const [round, r] of Object.entries(data.rounds || {})) {
    for (const m of Object.values(r.matches || {})) {
      const home = rows(m, "local");
      const away = rows(m, "visitor");
      if (!isPlayed(m)) continue;
      const hs = Number(m.localScore), as = Number(m.visitorScore);
      for (const [t, f, a] of [[home, hs, as], [away, as, hs]]) {
        t.pj++; t.pf += f; t.pc += a;
        if (f > a) { t.g++; t.pts += 2; } else { t.p++; t.pts += 1; }
      }
    }
    const rest = Object.keys((data.rest || {})[round] || {});
    if (rest.length) rests[round] = { date: r.date, teams: rest };
  }
  const standings = [...table.values()];
  for (const row of standings) {
    row.crest = await crest(row.club, row.logo);
    delete row.logo;
  }
  standings.sort((a, b) => b.pts - a.pts || (b.pf - b.pc) - (a.pf - a.pc) || b.pf - a.pf || a.name.localeCompare(b.name));
  return { standings, rests };
}

try {
  const seasons = await esb("Season/getActiveWebVisibility");
  const season = seasons.find((s) => s.active === "1") || seasons.at(-1);
  const start = Number(season.idSeason);
  const label = `${start}/${String(start + 1).slice(2)}`;

  const raw = [];
  for (const month of [7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6]) {
    raw.push(...(await esb(`Match/getMatchClubMonth/${CLUB_ID}/${month}/T`)));
  }

  const seen = new Set();
  const matches = [];
  const teams = {};
  for (const m of raw) {
    if (seen.has(m.idMatch) || m.season !== String(start)) continue;
    seen.add(m.idMatch);
    const home = m.idLocalClub === CLUB_ID;
    const key = /^1/.test(clean(m.nameCompetition)) ? "primera" : "segunda";
    teams[key] ||= { name: clean(home ? m.nameLocalTeam : m.nameVisitorTeam), teamId: home ? m.idLocalTeam : m.idVisitorTeam, idGroup: m.idGroup, competition: clean(m.nameCompetition), group: clean(m.nameGroup), venues: [] };
    if (home) {
      const v = prettify(m.nameField).replace(/^Pabellón /, "");
      if (v && !teams[key].venues.includes(v)) teams[key].venues.push(v);
    }

    const [day, time] = m.matchDay.split(" ");
    const timeKnown = time && time !== "00:00:00";
    const us = home ? m.localScore : m.visitorScore;
    const them = home ? m.visitorScore : m.localScore;
    const rivalClub = home ? m.idVisitorClub : m.idLocalClub;
    const rivalRaw = home ? m.nameVisitorTeam : m.nameLocalTeam;

    matches.push({
      id: m.idMatch,
      season: label,
      team: key,
      matchday: Number(m.numMatchDay) || null,
      date: timeKnown ? `${day}T${time.slice(0, 5)}` : day,
      timeKnown: Boolean(timeKnown),
      home,
      rival: shortName(rivalRaw),
      rivalFull: clean(rivalRaw),
      rivalCrest: await crest(rivalClub, home ? m.visitorClubLogo : m.localClubLogo),
      venue: venueName(m.nameField, m.nameTown),
      res: isPlayed(m) ? (Number(us) > Number(them) ? "W" : "L") : null,
      score: isPlayed(m) ? `${m.localScore}-${m.visitorScore}` : null,
    });
  }

  const standings = {};
  for (const [key, t] of Object.entries(teams)) {
    try {
      const g = await group(t.idGroup);
      standings[key] = g.standings.map((row) => ({ ...row, us: row.team === t.teamId }));
      for (const [round, r] of Object.entries(g.rests)) {
        if (r.teams.includes(t.teamId)) matches.push({ id: `rest-${key}-${round}`, season: label, team: key, matchday: Number(round), date: r.date, timeKnown: false, rest: true, home: null, rival: null, res: null });
      }
    } catch (e) {
      console.log(`group ${t.idGroup} unavailable: ${e.message}`);
    }
  }

  matches.sort((a, b) => a.date.localeCompare(b.date));
  const old = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};
  const next = { season: label, teams, standings, matches };
  const strip = ({ updated, ...rest }) => rest;
  if (JSON.stringify(strip(old)) !== JSON.stringify(next)) {
    mkdirSync("data", { recursive: true });
    writeFileSync(OUT, JSON.stringify({ updated: new Date().toISOString(), ...next }, null, 2) + "\n");
    console.log(`${matches.length} matches (${label}), fixtures updated`);
  } else {
    console.log(`${matches.length} matches (${label}), no changes`);
  }
} catch (e) {
  console.log(`Federation API unavailable, fixtures unchanged: ${e.message}`);
}
