import { config, nowIsoUtc } from "./config.js";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateAndNormalize({ type, item, indexes }) {
  const errors = [];
  const warnings = [];

  if (!["people", "movies", "timeline"].includes(type)) {
    errors.push({ code: "type", message: "invalid type" });
    return { ok: false, errors, warnings };
  }

  if (!item || typeof item !== "object") {
    errors.push({ code: "item", message: "missing item" });
    return { ok: false, errors, warnings };
  }

  const slug = String(item.slug || "").trim();
  if (!slug) errors.push({ code: "slug", message: "slug required" });
  else if (!SLUG_RE.test(slug)) errors.push({ code: "slug", message: "invalid slug format" });

  if (!Array.isArray(item.sources) || item.sources.length < 1) {
    errors.push({ code: "sources", message: "at least 1 source required" });
  } else {
    for (let i = 0; i < item.sources.length; i++) {
      const s = item.sources[i];
      if (!s || typeof s !== "object") { errors.push({ code: "sources", message: "invalid source object" }); break; }
      if (!String(s.title || "").trim()) errors.push({ code: "sources.title", message: "source.title required" });
      if (!String(s.url || "").trim()) warnings.push({ code: "sources.url", message: "source.url missing (recommended)" });
      if (!String(s.accessedAt || "").trim()) warnings.push({ code: "sources.accessedAt", message: "source.accessedAt missing (recommended)" });
    }
  }

  const status = item.status === "reviewed" ? "reviewed" : "draft";

  const tags = Array.isArray(item.tags) ? item.tags.map(t => String(t).trim()).filter(Boolean) : [];
  const allowedTags = new Set((indexes.tags || []).map(t => String(t.slug).toLowerCase()));
  for (const t of tags) {
    if (!allowedTags.has(String(t).toLowerCase())) {
      errors.push({ code: "tags", message: `unknown tag: ${t}` });
    }
  }

  const links = Array.isArray(item.links) ? item.links.map(normalizeLink).filter(Boolean) : [];

  if (type === "people") {
    if (!String(item.name || "").trim()) errors.push({ code: "name", message: "name required" });
    if (!String(item.summary || "").trim()) errors.push({ code: "summary", message: "summary required" });
  }
  if (type === "movies") {
    if (!String(item.title || "").trim()) errors.push({ code: "title", message: "title required" });
    if (!Number.isFinite(Number(item.year))) errors.push({ code: "year", message: "year required" });
    if (!String(item.summary || "").trim()) errors.push({ code: "summary", message: "summary required" });
  }
  if (type === "timeline") {
    if (!Number.isFinite(Number(item.year))) errors.push({ code: "year", message: "year required" });
    if (!String(item.title || "").trim()) errors.push({ code: "title", message: "title required" });
    if (!String(item.summary || "").trim()) errors.push({ code: "summary", message: "summary required" });
    if (!String(item.track || "").trim()) errors.push({ code: "track", message: "track required" });
  }

  const peopleSlugs = new Set((indexes.people || []).map(p => p.slug));
  const movieSlugs = new Set((indexes.movies || []).map(m => m.slug));

  if (type === "movies") {
    const ppl = Array.isArray(item.people) ? item.people.map(String) : [];
    for (const p of ppl) if (!peopleSlugs.has(p)) errors.push({ code: "people", message: `unknown person: ${p}` });
  }

  if (type === "timeline") {
    const ppl = Array.isArray(item.people) ? item.people.map(String) : [];
    for (const p of ppl) if (!peopleSlugs.has(p)) errors.push({ code: "people", message: `unknown person: ${p}` });
    const mv = Array.isArray(item.movies) ? item.movies.map(String) : [];
    for (const m of mv) if (!movieSlugs.has(m)) errors.push({ code: "movies", message: `unknown movie: ${m}` });
  }

  const user = indexes.userLogin || "unknown";
  const now = nowIsoUtc();
  const meta = item.meta && typeof item.meta === "object" ? item.meta : {};
  const createdAt = meta.createdAt && typeof meta.createdAt === "string" ? meta.createdAt : now;
  const createdBy = meta.createdBy && typeof meta.createdBy === "string" ? meta.createdBy : user;

  const ai = (meta.ai && typeof meta.ai === "object") ? meta.ai : {};
  const aiUsed = !!ai.used;

  const normalized = {
    ...item,
    slug,
    status,
    tags,
    links,
    meta: {
      createdAt,
      updatedAt: now,
      createdBy,
      updatedBy: user,
      ai: {
        used: aiUsed,
        provider: String(ai.provider || (aiUsed ? config.aiProvider : "")),
        model: String(ai.model || "")
      }
    }
  };

  const ok = errors.length === 0;
  return { ok, errors, warnings, normalized };
}

function normalizeLink(x) {
  if (!x || typeof x !== "object") return null;
  const label = String(x.label || "").trim();
  const url = String(x.url || "").trim();
  if (!label || !url) return null;
  return { label, url };
}

