import { requireAuth } from "./middleware.js";
import { getFile, getDefaultBranchHead, createBranch, putFile, createPR } from "./github.js";
import { config } from "./config.js";
import { validateAndNormalize } from "./validate.js";
import { canonicalJsonString } from "./canonicalJson.js";
import { buildOutputs } from "./buildEmit.js";

export function apiRoutes(app) {
  app.get("/index/people", requireAuth, async (req, res) => {
    const idx = await loadIndexJson(req.session.githubToken, "data/people_index.json");
    res.json(idx);
  });

  app.get("/index/movies", requireAuth, async (req, res) => {
    const idx = await loadIndexJson(req.session.githubToken, "data/movies_index.json");
    res.json(idx);
  });

  app.get("/index/tags", requireAuth, async (req, res) => {
    const tags = await loadTags(req.session.githubToken);
    const out = (tags.tags || []).map(t => ({ slug: t.slug, label: t.label }))
      .sort((a,b)=>String(a.label).localeCompare(String(b.label),"de"));
    res.json(out);
  });

  app.post("/validate", requireAuth, async (req, res) => {
    const { type, item } = req.body || {};
    const indexes = await loadIndexes(req.session.githubToken);
    indexes.userLogin = String(req.session.user.login || "").toLowerCase();
    const v = validateAndNormalize({ type, item, indexes });
    res.json(v);
  });

  app.post("/ai/suggest", requireAuth, async (req, res) => {
    const { prompt } = req.body || {};
    res.json({
      ok: true,
      provider: config.aiProvider,
      suggestions: [
        { kind: "summary", text: "Stub: Schreibe eine nüchterne 1–2 Satz Zusammenfassung, faktenbasiert." },
        { kind: "tags", text: "Stub: Schlage 3 passende Tags vor, nur aus tags.json." }
      ],
      echo: String(prompt || "")
    });
  });

  app.post("/github/pr", requireAuth, async (req, res) => {
    const token = req.session.githubToken;
    const userLogin = String(req.session.user.login || "").toLowerCase();

    const { type, item } = req.body || {};
    if (!type || !item) return res.status(400).json({ error: "missing type/item" });

    const indexes = await loadIndexes(token);
    indexes.userLogin = userLogin;

    const v = validateAndNormalize({ type, item, indexes });
    if (!v.ok) return res.status(400).json(v);

    const contentPath = `content/${type}/${v.normalized.slug}.json`;
    const exists = await getFile(token, contentPath, config.defaultBranch);
    if (exists.ok) {
      return res.status(400).json({
        ok: false,
        errors: [{ code: "slug", message: "slug already exists" }],
        warnings: v.warnings
      });
    }

    const allContent = await loadAllContent(token);

    if (type === "people") allContent.people.push(v.normalized);
    if (type === "movies") allContent.movies.push(v.normalized);
    if (type === "timeline") allContent.timeline.push(v.normalized);

    const generated = buildOutputs({ content: allContent });

    const ts = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
    const branchName = `admin/${type}/${v.normalized.slug}/${ts}`;

    const baseSha = await getDefaultBranchHead(token);
    await createBranch(token, branchName, baseSha);

    const conflicts = [];
    const written = [];

    const contentJson = canonicalJsonString(v.normalized);
    {
      const r = await putFile(token, contentPath, contentJson, `content(${type}): ${v.normalized.slug}`, branchName, null);
      if (!r.ok) conflicts.push({ path: contentPath, status: r.status, detail: r.text });
      else written.push(contentPath);
    }

    for (const [path, text] of generated.entries()) {
      const existing = await getFile(token, path, branchName);
      const expectedSha = existing.ok ? existing.json.sha : null;
      const r = await putFile(token, path, text, `build: emit ${path}`, branchName, expectedSha);
      if (!r.ok) conflicts.push({ path, status: r.status, expectedSha: expectedSha || null, detail: r.text });
      else written.push(path);
    }

    const prTitle = `[PSI] ${type}: ${v.normalized.slug}`;
    const prBody = buildPrBody({
      type,
      slug: v.normalized.slug,
      userLogin,
      warnings: v.warnings,
      sources: v.normalized.sources || [],
      ai: v.normalized.meta?.ai || { used: false },
      conflicts,
      written
    });

    const pr = await createPR(token, { branchName, title: prTitle, body: prBody });

    res.json({ ok: true, branch: branchName, prUrl: pr.html_url, warnings: v.warnings, conflicts });
  });
}

async function loadIndexJson(token, path) {
  const f = await getFile(token, path, config.defaultBranch);
  if (!f.ok) return [];
  const content = Buffer.from(f.json.content, "base64").toString("utf8");
  try { return JSON.parse(content); } catch { return []; }
}

async function loadTags(token) {
  const f = await getFile(token, "content/tags.json", config.defaultBranch);
  if (!f.ok) return { tags: [] };
  const content = Buffer.from(f.json.content, "base64").toString("utf8");
  try { return JSON.parse(content); } catch { return { tags: [] }; }
}

async function loadIndexes(token) {
  const [people, movies, tags] = await Promise.all([
    loadIndexJson(token, "data/people_index.json"),
    loadIndexJson(token, "data/movies_index.json"),
    loadTags(token)
  ]);
  return { people, movies, tags: (tags.tags || []).map(t => ({ slug: t.slug, label: t.label })) };
}

async function listDir(token, dirPath) {
  const f = await getFile(token, dirPath, config.defaultBranch);
  if (!f.ok) return [];
  if (!Array.isArray(f.json)) return [];
  return f.json.filter(x => x.type === "file").map(x => x.path);
}

async function loadJsonFile(token, path) {
  const f = await getFile(token, path, config.defaultBranch);
  if (!f.ok) return null;
  const content = Buffer.from(f.json.content, "base64").toString("utf8");
  try { return JSON.parse(content); } catch { return null; }
}

async function loadAllContent(token) {
  const [peoplePaths, moviePaths, timelinePaths, tags] = await Promise.all([
    listDir(token, "content/people"),
    listDir(token, "content/movies"),
    listDir(token, "content/timeline"),
    loadTags(token)
  ]);

  const [people, movies, timeline] = await Promise.all([
    Promise.all(peoplePaths.map(p => loadJsonFile(token, p))),
    Promise.all(moviePaths.map(p => loadJsonFile(token, p))),
    Promise.all(timelinePaths.map(p => loadJsonFile(token, p)))
  ]);

  return { people: people.filter(Boolean), movies: movies.filter(Boolean), timeline: timeline.filter(Boolean), tags };
}

function buildPrBody({ type, slug, userLogin, warnings, sources, ai, conflicts, written }) {
  const lines = [];
  lines.push(`This PR was created by PSI Admin Backend.`);
  lines.push(``);
  lines.push(`- Type: ${type}`);
  lines.push(`- Slug: ${slug}`);
  lines.push(`- Editor: @${userLogin}`);
  lines.push(``);

  lines.push(`## Sources`);
  if (!sources.length) lines.push(`- (none)`);
  for (const s of sources) {
    const t = String(s.title || "").trim();
    const u = String(s.url || "").trim();
    const a = String(s.accessedAt || "").trim();
    lines.push(`- ${t}${u ? ` — ${u}` : ""}${a ? ` (accessed: ${a})` : ""}`);
  }
  lines.push(``);

  lines.push(`## AI`);
  lines.push(`- used: ${ai?.used ? "yes" : "no"}`);
  if (ai?.used) {
    lines.push(`- provider: ${ai?.provider || ""}`);
    lines.push(`- model: ${ai?.model || ""}`);
  }
  lines.push(``);

  lines.push(`## Warnings`);
  if (!warnings.length) lines.push(`- (none)`);
  for (const w of warnings) lines.push(`- ${w.code}: ${w.message}`);
  lines.push(``);

  lines.push(`## Files`);
  for (const p of written) lines.push(`- ${p}`);
  lines.push(``);

  if (conflicts.length) {
    lines.push(`## CONFLICT`);
    lines.push(`Best-effort writes encountered issues. Please resolve manually in this PR.`);
    for (const c of conflicts) {
      lines.push(`- ${c.path} (status ${c.status})`);
      if (c.expectedSha) lines.push(`  - expectedSha: ${c.expectedSha}`);
      if (c.detail) lines.push(`  - detail: ${String(c.detail).slice(0, 400)}`);
    }
    lines.push(``);
  }

  return lines.join("\n");
}

