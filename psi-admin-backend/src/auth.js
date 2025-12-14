import fetch from "node-fetch";
import { config } from "./config.js";

const AUTHZ_URL = "https://github.com/login/oauth/authorize";
const TOKEN_URL = "https://github.com/login/oauth/access_token";
const API = "https://api.github.com";

export function authRoutes(app) {
  app.get("/auth/login", (req, res) => {
    const state = randomState();
    req.session.oauthState = state;

    const redirectUri = `${config.baseUrl}/auth/callback`;
    const params = new URLSearchParams({
      client_id: config.githubClientId,
      redirect_uri: redirectUri,
      scope: "repo",
      state
    });

    res.redirect(`${AUTHZ_URL}?${params.toString()}`);
  });

  app.get("/auth/callback", async (req, res) => {
    const { code, state } = req.query;
    if (!code || !state) return res.status(400).send("Missing code/state");

    if (!req.session.oauthState || state !== req.session.oauthState) {
      return res.status(403).send("Invalid state");
    }

    const redirectUri = `${config.baseUrl}/auth/callback`;

    const tokenResp = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        client_id: config.githubClientId,
        client_secret: config.githubClientSecret,
        code,
        redirect_uri: redirectUri,
        state
      }).toString()
    });

    const tokenJson = await tokenResp.json();
    if (!tokenJson.access_token) return res.status(401).send("No access token");

    const token = tokenJson.access_token;

    const meResp = await fetch(`${API}/user`, {
      headers: {
        "Accept": "application/vnd.github+json",
        "Authorization": `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "psi-admin-backend"
      }
    });

    if (!meResp.ok) return res.status(401).send("Cannot read user");
    const me = await meResp.json();

    const login = String(me.login || "").toLowerCase();
    if (!config.adminAllowlist.includes(login)) {
      req.session.destroy(() => {});
      return res.status(403).send("Not in ADMIN_ALLOWLIST");
    }

    req.session.githubToken = token;
    req.session.user = { login: me.login, id: me.id, name: me.name || "" };

const isLocal = config.baseUrl.startsWith("http://localhost");
const adminUrl = isLocal
  ? "http://localhost:5500/admin/"
  : "https://tino-999.github.io/settlementindex/admin/";
res.redirect(adminUrl);
  });

  app.post("/auth/logout", (req, res) => {
    req.session.destroy(() => res.json({ ok: true }));
  });

  app.get("/me", (req, res) => {
    const u = req.session?.user || null;
    res.json({
      user: u,
      csrf: req.session?.csrfToken || null
    });
  });
}

function randomState() {
  const b = Buffer.from(String(Date.now()) + ":" + String(Math.random()));
  return b.toString("base64url");
}

