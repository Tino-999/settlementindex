#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const ROOT = path.resolve(process.cwd());                 // repo root
const DATA_PATH = path.join(ROOT, "people", "data.js");
const IMAGES_DIR = path.join(ROOT, "people", "images");

const query = process.argv.slice(2).join(" ").trim();
if (!query) {
  console.log('Usage: node people/add-person.mjs "zubrin"');
  process.exit(1);
}

if (!fs.existsSync(DATA_PATH)) throw new Error(`Missing ${DATA_PATH}`);
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

const candidates = await searchWikidata(query, 7);
if (candidates.length === 0) {
  console.log(`No results for "${query}"`);
  process.exit(1);
}

console.log("\nResults:");
candidates.forEach((c, i) => {
  const desc = c.description ? ` — ${c.description}` : "";
  console.log(`  ${i + 1}) ${c.label} (${c.id})${desc}`);
});

const rl = readline.createInterface({ input, output });
const answer = (await rl.question(`\nChoose [1-${candidates.length}] (default 1): `)).trim();
rl.close();

let idx = 1;
if (answer) {
  const n = Number(answer);
  if (!Number.isInteger(n) || n < 1 || n > candidates.length) {
    console.log("Invalid choice.");
    process.exit(1);
  }
  idx = n;
}

const chosen = candidates[idx - 1];
console.log(`\nChosen: ${chosen.label} (${chosen.id})`);

const person = await getPersonFromEntity(chosen.id);

console.log("Data:", person.name, person.life, person.imageFile ? `images/${person.imageFile}` : "(no image)");

let localImageRel = person.imageFile ? `images/${person.imageFile}` : "";
if (person.imageFile) {
  const fileUrl = makeCommonsFilePathUrl(person.imageFile, 900); // scaled download
  const outPath = path.join(IMAGES_DIR, person.localFileName);
  const ok = await downloadImage(fileUrl, outPath);
  if (ok) localImageRel = `images/${person.localFileName}`;
  else localImageRel = ""; // don’t write broken paths
}

const entry = {
  name: person.name,
  life: person.life,
  image: localImageRel
};

updateDataJs(DATA_PATH, entry);

console.log("\n✅ Updated:", DATA_PATH);
if (entry.image) console.log("✅ Image saved:", path.join(IMAGES_DIR, path.basename(entry.image)));
console.log('\nNext:\n  git add people/data.js people/images\n  git commit -m "Add person: ' + entry.name.replace(/"/g,'') + '"\n  git push\n');


async function searchWikidata(search, limit = 5) {
  // fuzzy search via MediaWiki API
  const url = new URL("https://www.wikidata.org/w/api.php");
  url.searchParams.set("action", "wbsearchentities");
  url.searchParams.set("search", search);
  url.searchParams.set("language", "de");
  url.searchParams.set("uselang", "de");
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url, { headers: { "User-Agent": "settlementindex-bot/1.0" } });
  if (!res.ok) throw new Error("Wikidata search HTTP " + res.status);
  const json = await res.json();

  return (json.search || []).map(x => ({
    id: x.id,                       // Q...
    label: x.label || x.match?.text || x.id,
    description: x.description || ""
  }));
}

async function getPersonFromEntity(qid) {
  // Entity JSON contains claims (birth/death/image)
  const url = `https://www.wikidata.org/wiki/Special:EntityData/${encodeURIComponent(qid)}.json`;
  const res = await fetch(url, { headers: { "User-Agent": "settlementindex-bot/1.0" } });
  if (!res.ok) throw new Error("EntityData HTTP " + res.status);

  const json = await res.json();
  const entity = json.entities?.[qid];
  if (!entity) throw new Error("Entity not found: " + qid);

  const name =
    entity.labels?.de?.value ||
    entity.labels?.en?.value ||
    qid;

  const birthIso = getTimeClaim(entity, "P569"); // birth
  const deathIso = getTimeClaim(entity, "P570"); // death
  const life = formatLife(birthIso, deathIso);

  const commonsFile = getCommonsFileClaim(entity, "P18"); // image
  if (!commonsFile) {
    return { name, life, imageFile: "", localFileName: "" };
  }

  // Create stable local filename in people/images
  const ext = guessExtFromName(commonsFile) || ".jpg";
  const h = crypto.createHash("sha1").update(qid + "|" + commonsFile).digest("hex").slice(0, 10);
  const base = slug(name).slice(0, 40) || "person";
  const localFileName = `${base}-${h}${ext}`;

  return {
    name,
    life,
    imageFile: commonsFile,     // original Commons filename (e.g. "Robert Zubrin 2019.jpg")
    localFileName               // stored in people/images/
  };
}

function getTimeClaim(entity, pid) {
  const c = entity.claims?.[pid]?.[0]?.mainsnak?.datavalue?.value;
  // time format: "+1952-04-09T00:00:00Z"
  if (!c?.time) return "";
  const t = c.time.startsWith("+") ? c.time.slice(1) : c.time;
  return t; // "1952-04-09T00:00:00Z"
}

function getCommonsFileClaim(entity, pid) {
  const v = entity.claims?.[pid]?.[0]?.mainsnak?.datavalue?.value;
  if (!v) return "";
  // e.g. "FileName.jpg" (without "File:")
  return String(v);
}

function formatLife(birthIso, deathIso) {
  const by = birthIso ? birthIso.slice(0, 4) : "";
  const dy = deathIso ? deathIso.slice(0, 4) : "";
  if (!by && !dy) return "—";
  return `${by || "?"}–${dy || "…"}`;
}

function makeCommonsFilePathUrl(fileName, width = 900) {
  // Uses Wikimedia Special:FilePath for direct file access (scaled via width)
  // IMPORTANT: fileName is without "File:"
  const encoded = encodeURIComponent(fileName).replace(/%2F/g, "/");
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encoded}?width=${width}`;
}

function guessExtFromName(fileName) {
  const m = String(fileName).match(/\.(jpg|jpeg|png|webp|gif|tif|tiff)$/i);
  if (!m) return "";
  const ext = m[1].toLowerCase().replace("jpeg", "jpg").replace("tiff", "tif");
  return "." + ext;
}

function slug(s) {
  return s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

async function downloadImage(url, outPath) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "settlementindex-bot/1.0" } });
    if (!res.ok) {
      console.warn("⚠️ Image download failed:", res.status);
      return false;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(outPath, buf);
    return true;
  } catch (e) {
    console.warn("⚠️ Image download error:", e.message);
    return false;
  }
}

function updateDataJs(dataPath, entry) {
  const src = fs.readFileSync(dataPath, "utf8");

  // crude duplicate check by name (case-insensitive)
  const nameNeedle = `name: ${JSON.stringify(entry.name)}`.toLowerCase();
  if (src.toLowerCase().includes(nameNeedle)) {
    console.log("ℹ️ Already present. No change.");
    return;
  }

  const objText =
`  {
    name: ${JSON.stringify(entry.name)},
    life: ${JSON.stringify(entry.life)},
    image: ${JSON.stringify(entry.image)}
  },\n`;

  if (!/const\s+people\s*=\s*\[/.test(src)) {
    throw new Error("Could not find 'const people = [' in people/data.js");
  }

  const updated = src.replace(/\]\s*;?\s*$/s, `${objText}];\n`);
  fs.writeFileSync(dataPath, updated, "utf8");
}
