import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const API = "https://esb.optimalwayconsulting.com/fecan/1/GhDqDyahm2TBntKn3JNdpxBppRS5zVeI";
const CLUB_ID = "203";
const OUT = "data/fixtures.json";
const CRESTS = "data/crests";
const HEADERS = { Origin: "https://www.fecanbaloncesto.com", Referer: "https://www.fecanbaloncesto.com/", "User-Agent": "Mozilla/5.0" };

async function esb(path) {
  const res = await fetch(`${API}/${path}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  const text = (await res.text()).trim();
  const json = JSON.parse(text.startsWith("{") ? text : Buffer.from(text, "base64").toString("utf8"));
  if (json.result !== "OK") throw new Error(`${path}: ${json.message}`);
  return json.messageData;
}

const clean = (s) => (s || "").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim();
const title = (s) => clean(s).toLowerCase().replace(/(^|[\s(-])(\p{L})/gu, (_, a, b) => a + b.toUpperCase());

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
    const ourTeam = clean(home ? m.nameLocalTeam : m.nameVisitorTeam);
    const key = /^1/.test(clean(m.nameCompetition)) ? "primera" : "segunda";
    teams[key] = { name: ourTeam, competition: clean(m.nameCompetition), group: clean(m.nameGroup), category: clean(m.nameCategory) };

    const [day, time] = m.matchDay.split(" ");
    const timeKnown = time && time !== "00:00:00";
    const us = home ? m.localScore : m.visitorScore;
    const them = home ? m.visitorScore : m.localScore;
    const played = us !== null && them !== null && us !== "" && them !== "";
    const rivalClub = home ? m.idVisitorClub : m.idLocalClub;

    matches.push({
      id: m.idMatch,
      season: label,
      team: key,
      matchday: Number(m.numMatchDay) || null,
      date: timeKnown ? `${day}T${time.slice(0, 5)}` : day,
      timeKnown: Boolean(timeKnown),
      home,
      rival: clean(home ? m.nameVisitorTeam : m.nameLocalTeam),
      rivalCrest: await crest(rivalClub, home ? m.visitorClubLogo : m.localClubLogo),
      venue: title(`${m.nameField || ""}${m.nameTown ? ", " + m.nameTown : ""}`),
      res: played ? (Number(us) > Number(them) ? "W" : "L") : null,
      score: played ? `${m.localScore}-${m.visitorScore}` : null,
    });
  }

  matches.sort((a, b) => a.date.localeCompare(b.date));
  const ourCrest = await crest(CLUB_ID, raw.find((m) => m.idLocalClub === CLUB_ID)?.localClubLogo || raw.find((m) => m.idVisitorClub === CLUB_ID)?.visitorClubLogo);

  const old = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};
  const next = { season: label, teams, crest: ourCrest, matches };
  if (JSON.stringify({ ...old, updated: undefined }) !== JSON.stringify({ ...next, updated: undefined })) {
    mkdirSync("data", { recursive: true });
    writeFileSync(OUT, JSON.stringify({ updated: new Date().toISOString(), ...next }, null, 2) + "\n");
    console.log(`${matches.length} matches (${label}), fixtures updated`);
  } else {
    console.log(`${matches.length} matches (${label}), no changes`);
  }
} catch (e) {
  console.log(`Federation API unavailable, fixtures unchanged: ${e.message}`);
}
