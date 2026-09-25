import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const PROFILE = "financialbbasket";
const MAX_POSTS = 12;
const FEED = "data/feed.json";
const IMG_DIR = "data/feed";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36";
const BOT_UA = "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const old = existsSync(FEED) ? JSON.parse(readFileSync(FEED, "utf8")) : { posts: [] };
const known = new Map(old.posts.map((p) => [p.code, p]));

const chromePath = [process.env.CHROME_PATH, "/usr/bin/google-chrome", "/usr/bin/chromium", "C:/Program Files/Google/Chrome/Application/chrome.exe"].find((p) => p && existsSync(p));
const profileDir = mkdtempSync(join(tmpdir(), "feed-"));
const port = 9500 + Math.floor(Math.random() * 400);
const chrome = spawn(chromePath, ["--headless=new", "--disable-gpu", "--no-sandbox", `--remote-debugging-port=${port}`, `--user-data-dir=${profileDir}`, "--lang=es-ES", `--user-agent=${UA}`, "about:blank"], { stdio: "ignore" });
const stop = (code, msg) => { if (msg) console.log(msg); chrome.kill(); try { rmSync(profileDir, { recursive: true, force: true }); } catch {} process.exit(code); };

let wsUrl;
for (let i = 0; i < 80 && !wsUrl; i++) {
  await sleep(250);
  try { wsUrl = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === "page")?.webSocketDebuggerUrl; } catch {}
}
if (!wsUrl) stop(0, "Chrome did not start; feed unchanged");

const ws = new WebSocket(wsUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (pending.has(d.id)) { pending.get(d.id)(d.result ?? {}); pending.delete(d.id); } };
const send = (method, params = {}) => new Promise((r) => { pending.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });

await send("Page.enable");
await send("Page.navigate", { url: `https://www.instagram.com/${PROFILE}/` });
await sleep(9000);
const listed = (await send("Runtime.evaluate", {
  returnByValue: true,
  expression: `[...document.querySelectorAll('a[href*="/p/"], a[href*="/reel/"]')].map((a) => ({
    code: (a.getAttribute("href").match(/\\/(?:p|reel)\\/([\\w-]+)/) || [])[1],
    alt: a.querySelector("img")?.alt || "",
    src: a.querySelector("img")?.currentSrc || a.querySelector("img")?.src || ""
  })).filter((x) => x.code)`,
})).result?.value || [];

if (!listed.length) stop(0, "No posts visible (login wall or rate limit); feed unchanged");

const months = { january: 0, february: 1, march: 2, april: 3, may: 4, june: 5, july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5, julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11 };
function dateFromAlt(alt) {
  const en = alt.match(/on (\w+) (\d{1,2}), (\d{4})/i);
  if (en && months[en[1].toLowerCase()] !== undefined) return new Date(Date.UTC(+en[3], months[en[1].toLowerCase()], +en[2])).toISOString().slice(0, 10);
  const es = alt.match(/(\d{1,2}) de (\w+) de (\d{4})/i);
  if (es && months[es[2].toLowerCase()] !== undefined) return new Date(Date.UTC(+es[3], months[es[2].toLowerCase()], +es[1])).toISOString().slice(0, 10);
  return null;
}

const decode = (s) => s.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#064;/g, "@");

async function caption(code) {
  const html = await (await fetch(`https://www.instagram.com/p/${code}/embed/captioned/`, { headers: { "User-Agent": "Mozilla/5.0" } })).text();
  const block = html.match(/class="Caption"[^>]*>([\s\S]*?)<\/div>/);
  if (!block) return "";
  return decode(block[1].replace(/<br\s*\/?>/g, "\n").replace(/<a[^>]*class="CaptionUsername"[^>]*>[\s\S]*?<\/a>/, "").replace(/<[^>]+>/g, "")).trim();
}

async function image(code, fallbackSrc) {
  let src = null;
  try {
    const html = await (await fetch(`https://www.instagram.com/p/${code}/embed/captioned/`, { headers: { "User-Agent": "Mozilla/5.0" } })).text();
    src = decode((html.match(/<img class="EmbeddedMediaImage"[^>]*?\ssrc="([^"]+)"/) || [])[1] || "") || null;
  } catch {}
  if (!src) {
    try {
      const html = await (await fetch(`https://www.instagram.com/p/${code}/`, { headers: { "User-Agent": BOT_UA } })).text();
      src = decode((html.match(/property="og:image" content="([^"]+)"/) || [])[1] || "") || fallbackSrc;
    } catch { src = fallbackSrc; }
  }
  if (!src) return null;
  const res = await fetch(src, { headers: { "User-Agent": UA } });
  if (!res.ok) return null;
  const ext = (res.headers.get("content-type") || "").includes("webp") ? "webp" : "jpg";
  mkdirSync(IMG_DIR, { recursive: true });
  const file = `${IMG_DIR}/${code}.${ext}`;
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  return file;
}

const posts = [];
for (const item of listed.slice(0, MAX_POSTS)) {
  const prev = known.get(item.code);
  if (prev && prev.image && existsSync(prev.image)) { posts.push(prev); continue; }
  try {
    posts.push({
      code: item.code,
      date: dateFromAlt(item.alt) || prev?.date || null,
      caption: prev?.caption || (await caption(item.code)),
      image: await image(item.code, item.src),
    });
    await sleep(1500);
  } catch (e) {
    if (prev) posts.push(prev);
    console.log(`skip ${item.code}: ${e.message}`);
  }
}

posts.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
const changed = JSON.stringify(posts) !== JSON.stringify(old.posts);
if (changed) {
  mkdirSync("data", { recursive: true });
  writeFileSync(FEED, JSON.stringify({ profile: PROFILE, updated: new Date().toISOString(), posts }, null, 2) + "\n");
}
stop(0, `${posts.length} posts, ${changed ? "feed updated" : "no changes"}`);
