import cors from "cors";
import helmet from "helmet";
import session from "express-session";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { config } from "./config.js";

export function installSecurity(app) {
  app.set("trust proxy", 1);

  app.use(helmet({
    contentSecurityPolicy: false
  }));

  app.use(cookieParser());

  app.use(cors({
    origin: config.adminUiOrigin,
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-CSRF-Token"]
  }));

const isLocal = config.baseUrl.startsWith("http://localhost");

app.use(session({
  name: "psi_admin_sid",
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: !isLocal,                 // HTTPS only in prod
    sameSite: isLocal ? "lax" : "none",
    maxAge: 1000 * 60 * 60 * 8
  }
}));

  // JSON body (minimal, no deps)
  app.use((req, res, next) => {
    if (req.method === "POST") {
      let data = "";
      req.on("data", chunk => { data += chunk; });
      req.on("end", () => {
        if (!data) { req.body = {}; return next(); }
        try { req.body = JSON.parse(data); return next(); }
        catch { return res.status(400).json({ error: "invalid_json" }); }
      });
    } else {
      next();
    }
  });

  // CSRF: token in session, client must send back via header
  app.use((req, res, next) => {
    if (!req.session.csrfToken) req.session.csrfToken = cryptoRandomToken();
    res.setHeader("X-CSRF-Token", req.session.csrfToken);
    if (req.method === "POST") {
      const t = req.headers["x-csrf-token"];
      if (!t || t !== req.session.csrfToken) {
        return res.status(403).json({ error: "csrf" });
      }
    }
    next();
  });

  // Rate limit for AI endpoint
  app.use("/ai/suggest", rateLimit({
    windowMs: 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false
  }));
}

function cryptoRandomToken() {
  const a = new Uint8Array(24);
  globalThis.crypto?.getRandomValues?.(a);
  for (let i = 0; i < a.length; i++) if (a[i] === 0) a[i] = Math.floor(Math.random() * 256);
  return Buffer.from(a).toString("base64url");
}

export function requireAuth(req, res, next) {
  if (!req.session?.user?.login) return res.status(401).json({ error: "unauthorized" });
  next();
}

