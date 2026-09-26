// Sincroniza la galería desde una carpeta pública de Google Drive.
// Cada subcarpeta es un álbum. Nombre recomendado: "2026-10-04 SPBasket Rosa" (fecha + título).
// Necesita GOOGLE_API_KEY (secreto del repo). DRIVE_FOLDER_ID es opcional.
import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const ROOT = process.env.DRIVE_FOLDER_ID || "1FmvcCDus1IkQ64SE96OPXNKseiq6l5Cw";
const KEY = process.env.GOOGLE_API_KEY;
const OUT = "data/gallery.json";
const DIR = "data/gallery";
const FULL = 1600;
const THUMB = 640;
const MAX_NEW = 400; // fotos nuevas por ejecución, para no pasarse del tiempo del workflow
const API = "https://www.googleapis.com/drive/v3";

if (!KEY) {
  console.log("GOOGLE_API_KEY not set, gallery unchanged");
  process.exit(0);
}

const old = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : { albums: [] };
const known = new Map(old.albums.flatMap((a) => a.photos).map((p) => [p.id, p]));

async function list(q, fields) {
  const items = [];
  let pageToken = "";
  do {
    const url = new URL(`${API}/files`);
    url.search = new URLSearchParams({ q, fields: `nextPageToken,files(${fields})`, pageSize: "1000", orderBy: "name", key: KEY, supportsAllDrives: "true", includeItemsFromAllDrives: "true", ...(pageToken && { pageToken }) });
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Drive API HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const json = await res.json();
    items.push(...json.files);
    pageToken = json.nextPageToken;
  } while (pageToken);
  return items;
}

async function fetchImage(file) {
  const res = await fetch(`${API}/files/${file.id}?alt=media&key=${KEY}&supportsAllDrives=true`);
  if (res.ok) return Buffer.from(await res.arrayBuffer());
  // Plan B (HEIC o descargas bloqueadas): Google sirve una versión renderizada de los archivos públicos
  const alt = await fetch(`https://lh3.googleusercontent.com/d/${file.id}=w${FULL}`);
  if (alt.ok) return Buffer.from(await alt.arrayBuffer());
  throw new Error(`HTTP ${res.status}`);
}

async function convert(file) {
  let input = await fetchImage(file);
  let img = sharp(input, { failOn: "none" }).rotate();
  try { await img.metadata(); } catch {
    const alt = await fetch(`https://lh3.googleusercontent.com/d/${file.id}=w${FULL}`);
    if (!alt.ok) throw new Error("unsupported format");
    input = Buffer.from(await alt.arrayBuffer());
    img = sharp(input, { failOn: "none" }).rotate();
  }
  const full = `${DIR}/${file.id}.webp`;
  const thumb = `${DIR}/${file.id}-t.webp`;
  const info = await img.clone().resize({ width: FULL, height: FULL, fit: "inside", withoutEnlargement: true }).webp({ quality: 78 }).toFile(full);
  await img.clone().resize({ width: THUMB, height: THUMB, fit: "inside", withoutEnlargement: true }).webp({ quality: 70 }).toFile(thumb);
  return { id: file.id, v: file.md5Checksum || file.modifiedTime, full, thumb, w: info.width, h: info.height };
}

function parseName(name, created) {
  const m = name.trim().match(/^(\d{4})[-_.](\d{2})[-_.](\d{2})\s*[-–·|]?\s*(.*)$/);
  if (m) return { date: `${m[1]}-${m[2]}-${m[3]}`, title: m[4].trim() || null };
  return { date: created.slice(0, 10), title: name.trim() };
}

const slugify = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

try {
  mkdirSync(DIR, { recursive: true });
  const folders = await list(`'${ROOT}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`, "id,name,createdTime");
  const albums = [];
  let fresh = 0, failed = 0;

  for (const folder of folders) {
    const files = await list(`'${folder.id}' in parents and mimeType contains 'image/' and trashed = false`, "id,name,md5Checksum,modifiedTime");
    if (!files.length) continue;
    const photos = [];
    for (const f of files) {
      const prev = known.get(f.id);
      const v = f.md5Checksum || f.modifiedTime;
      if (prev && prev.v === v && existsSync(prev.full) && existsSync(prev.thumb)) { photos.push(prev); continue; }
      if (fresh >= MAX_NEW) continue;
      try { photos.push(await convert(f)); fresh++; } catch (e) { failed++; console.log(`  skip ${folder.name}/${f.name}: ${e.message}`); }
    }
    if (!photos.length) continue;
    const { date, title } = parseName(folder.name, folder.createdTime);
    const coverFile = files.find((f) => /portada|cover/i.test(f.name));
    const cover = photos.find((p) => p.id === coverFile?.id) || photos[0];
    albums.push({ id: folder.id, slug: slugify(`${date} ${title || ""}`), date, title, cover: cover.id, photos });
  }

  albums.sort((a, b) => b.date.localeCompare(a.date) || (a.title || "").localeCompare(b.title || ""));

  // Borra las fotos que ya no están en Drive
  const keep = new Set(albums.flatMap((a) => a.photos.flatMap((p) => [p.full, p.thumb])));
  let removed = 0;
  for (const name of readdirSync(DIR)) {
    const path = `${DIR}/${name}`;
    if (!keep.has(path)) { unlinkSync(path); removed++; }
  }

  const strip = (x) => JSON.stringify(x.albums);
  const next = { updated: new Date().toISOString(), folder: ROOT, albums };
  if (strip(next) !== strip(old)) {
    writeFileSync(OUT, JSON.stringify(next, null, 2) + "\n");
    console.log(`${albums.length} albums, ${fresh} new photos, ${removed} files removed, ${failed} failed: gallery updated`);
  } else {
    console.log(`${albums.length} albums, no changes`);
  }
  if (fresh >= MAX_NEW) console.log(`Reached ${MAX_NEW} new photos, the rest will sync on the next run`);
} catch (e) {
  console.log(`Drive unavailable, gallery unchanged: ${e.message}`);
}
