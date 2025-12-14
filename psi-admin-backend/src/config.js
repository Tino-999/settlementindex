import fs from "node:fs";
import path from "node:path";
import url from "node:url";

/* ---------------------------------------------------------
   Load .env EARLY (before mustEnv is used)
--------------------------------------------------------- */
(function loadDotEnv() {
  const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
  const root = path.resolve(__dirname, "..");
  const envPath = path.join(root, ".env");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const s = line.trim();
    if (!s || s.startsWith("#")) continue;
    const idx = s.indexOf("=");
    if (idx < 0) continue;
    const key = s.slice(0, idx).trim();
    const val = s.slice(idx + 1).trim();
    if (!(key in process.env)) process.env[key] = val;
  }
})();

/* ---------------------------------------------------------
   Config
--------------------------------------------------------- */
export function mustEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export const config = {
  port: Number(process.env.PORT || 10000),

  baseUrl: mustEnv("BASE_URL"),
  adminUiOrigin: mustEnv("ADMIN_UI_ORIGIN"),

  githubClientId: mustEnv("GITHUB_CLIENT_ID"),
  githubClientSecret: mustEnv("GITHUB_CLIENT_SECRET"),

  adminAllowlist: mustEnv("ADMIN_ALLOWLIST")
    .split(",")
    .map(s => s.trim().toLowerCase())
    .filter(Boolean),

  repoOwner: mustEnv("GITHUB_REPO_OWNER"),
  repoName: mustEnv("GITHUB_REPO_NAME"),
  defaultBranch: mustEnv("GITHUB_DEFAULT_BRANCH"),

  sessionSecret: mustEnv("SESSION_SECRET"),

  aiProvider: process.env.AI_PROVIDER || "stub",
  aiApiKey: process.env.AI_API_KEY || ""
};

export function nowIsoUtc() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}
