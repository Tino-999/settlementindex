import fetch from "node-fetch";
import { config } from "./config.js";

const API = "https://api.github.com";

function headers(token) {
  return {
    "Accept": "application/vnd.github+json",
    "Authorization": `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "psi-admin-backend"
  };
}

export async function ghGetJson(token, path) {
  const r = await fetch(`${API}${path}`, { headers: headers(token) });
  const t = await r.text();
  let j = null;
  try { j = t ? JSON.parse(t) : null; } catch {}
  return { ok: r.ok, status: r.status, json: j, text: t };
}

export async function ghPostJson(token, path, body) {
  const r = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { ...headers(token), "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const t = await r.text();
  let j = null;
  try { j = t ? JSON.parse(t) : null; } catch {}
  return { ok: r.ok, status: r.status, json: j, text: t };
}

export async function ghPutJson(token, path, body) {
  const r = await fetch(`${API}${path}`, {
    method: "PUT",
    headers: { ...headers(token), "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const t = await r.text();
  let j = null;
  try { j = t ? JSON.parse(t) : null; } catch {}
  return { ok: r.ok, status: r.status, json: j, text: t };
}

export async function getDefaultBranchHead(token) {
  const { repoOwner, repoName, defaultBranch } = config;
  const ref = await ghGetJson(token, `/repos/${repoOwner}/${repoName}/git/ref/heads/${defaultBranch}`);
  if (!ref.ok) throw new Error(`Cannot read branch ref: ${ref.status}`);
  return ref.json.object.sha;
}

export async function createBranch(token, branchName, fromSha) {
  const { repoOwner, repoName } = config;
  const r = await ghPostJson(token, `/repos/${repoOwner}/${repoName}/git/refs`, {
    ref: `refs/heads/${branchName}`,
    sha: fromSha
  });
  if (!r.ok) throw new Error(`Cannot create branch: ${r.status} ${r.text}`);
  return true;
}

export async function getFile(token, path, ref) {
  const { repoOwner, repoName } = config;
  const q = ref ? `?ref=${encodeURIComponent(ref)}` : "";
  const r = await ghGetJson(token, `/repos/${repoOwner}/${repoName}/contents/${encodeURIComponent(path)}${q}`);
  return r;
}

export async function putFile(token, path, contentUtf8, message, branch, expectedShaOrNull) {
  const { repoOwner, repoName } = config;
  const b64 = Buffer.from(contentUtf8, "utf8").toString("base64");
  const body = { message, content: b64, branch };
  if (expectedShaOrNull) body.sha = expectedShaOrNull;
  const r = await ghPutJson(token, `/repos/${repoOwner}/${repoName}/contents/${encodeURIComponent(path)}`, body);
  return r;
}

export async function createPR(token, { branchName, title, body }) {
  const { repoOwner, repoName, defaultBranch } = config;
  const r = await ghPostJson(token, `/repos/${repoOwner}/${repoName}/pulls`, {
    title,
    head: branchName,
    base: defaultBranch,
    body
  });
  if (!r.ok) throw new Error(`Cannot create PR: ${r.status} ${r.text}`);
  return r.json;
}

