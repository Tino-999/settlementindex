import fs from "node:fs";
import path from "node:path";
import url from "node:url";

function loadDotEnv() {
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
}

loadDotEnv();

import express from "express";
import { installSecurity } from "./middleware.js";
import { authRoutes } from "./auth.js";
import { apiRoutes } from "./routes.js";
import { config } from "./config.js";

const app = express();
installSecurity(app);

app.get("/", (req, res) => res.json({ ok: true, service: "psi-admin-backend" }));

authRoutes(app);
apiRoutes(app);

app.listen(config.port, () => {
  console.log(`PSI Admin Backend listening on :${config.port}`);
});
