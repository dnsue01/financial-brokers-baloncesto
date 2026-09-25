import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const PROFILE = "financialbbasket";
const MAX_POSTS = 12;
const FEED = "data/feed.json";
const IMG_DIR = "data/feed";

const old = existsSync(FEED) ? JSON.parse(readFileSync(FEED, "utf8")) : { posts: [] };
const known = new Map(old.posts.map((p) => [p.code, p]));

async function download(code, url) {
  const res = await fetch(url);
  if (!res.ok) return null;
  const ext = (res.headers.get("content-type") || "").includes("webp") ? "webp" : "jpg";
  mkdirSync(IMG_DIR, { recursive: true });
  const file = `${IMG_DIR}/${code}.${ext}`;
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  return file;
}

try {
  const html = await (await fetch(`https://www.instagram.com/${PROFILE}/embed/`, { headers: { "User-Agent": "Mozilla/5.0" } })).text();
  const raw = html.match(/"contextJSON":"((?:[^"\\]|\\.)*)"/);
  if (!raw) throw new Error("profile embed without data (login wall or rate limit)");
  const ctx = JSON.parse(JSON.parse(`"${raw[1]}"`));
  const media = (ctx.context || ctx).graphql_media || [];
  if (!media.length) throw new Error("no posts in profile embed");

  const posts = [];
  for (const { shortcode_media: n } of media.slice(0, MAX_POSTS)) {
    const prev = known.get(n.shortcode);
    if (prev?.image && existsSync(prev.image)) { posts.push(prev); continue; }
    posts.push({
      code: n.shortcode,
      date: new Date(n.taken_at_timestamp * 1000).toISOString().slice(0, 10),
      caption: n.edge_media_to_caption?.edges?.[0]?.node?.text?.trim() || "",
      image: await download(n.shortcode, n.display_url),
    });
  }

  posts.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  if (JSON.stringify(posts) !== JSON.stringify(old.posts)) {
    mkdirSync("data", { recursive: true });
    writeFileSync(FEED, JSON.stringify({ profile: PROFILE, updated: new Date().toISOString(), posts }, null, 2) + "\n");
    console.log(`${posts.length} posts, feed updated`);
  } else {
    console.log(`${posts.length} posts, no changes`);
  }
} catch (e) {
  console.log(`Instagram unavailable, feed unchanged: ${e.message}`);
}
