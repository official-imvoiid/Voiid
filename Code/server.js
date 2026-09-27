/* ==========================================================================
   server.js - the site's backend: contact form, admin inbox, site content
   and image uploads. No third-party services anywhere.

     /api/challenge            robot-check question for the contact form
     /api/contact              a visitor sends a message
     /api/content              the site's editable content (public, read-only)
     /api/admin/login|logout   admin session (ADMIN_PASSWORD + authenticator code if on)
     /api/admin/2fa/...        turn the Google Authenticator check on / off (admin)
     /api/admin/messages       read / mark / delete messages      (admin)
     /api/admin/content        save edited content                (admin)
     /api/admin/upload         upload an image, get its URL back  (admin)
     /api/admin/upload-cv      upload the CV (PDF), get its URL back  (admin)
     /uploads/<file>           uploaded images
     /api/notes                list a folder of the notes library / search it
     /api/admin/notes/...      make folders, upload, rename, delete (admin)
     /files/notes/<path>       a notes file - viewed in the page or downloaded
     /api/admin/models/upload  upload a 3D model (vrm, glb, fbx, obj...)  (admin)
     /files/models/<file>      a 3D model for the viewer (?download=1 only if the admin allows it)

   Robot check on the contact form (all four must pass):
     1. honeypot   - a hidden "website" field people never see; bots fill it
     2. speed      - sent < 3 s after the question appeared = a bot
     3. question   - a small sum, signed with CHALLENGE_SECRET so the answer
                     can't be forged in the browser; each works only once
     4. rate limit - at most 5 messages per visitor every 5 minutes

   Storage, all under data/ (git-ignored):
     messages.enc  visitors' messages, AES-256-GCM encrypted with MESSAGES_KEY
     content.json  what the admin changed (layered over defaults.js)
     security.enc  the authenticator secret, encrypted with MESSAGES_KEY
     uploads/      images uploaded in the admin
     notes/        the notes library: folders and files, exactly as on disk
     models/       3D models for the 3D & Editing page

   Run:   npm run server           (in dev, Vite forwards /api, /uploads and /files to it)
   Setup: copy .env.example to .env and fill it in.
   ========================================================================== */

import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import net from "node:net";
import path from "node:path";
import express from "express";
import QRCode from "qrcode";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { body, validationResult } from "express-validator";

/* ---- config ------------------------------------------------------------- */
const PORT = process.env.PORT || 5001;
const { CHALLENGE_SECRET, MESSAGES_KEY, ADMIN_PASSWORD } = process.env;

const missing = ["CHALLENGE_SECRET", "MESSAGES_KEY", "ADMIN_PASSWORD"].filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing in .env: ${missing.join(", ")} - copy .env.example to .env and fill it in.`);
  process.exit(1);
}
if (!/^[0-9a-f]{64}$/i.test(MESSAGES_KEY)) {
  console.error("MESSAGES_KEY must be 64 hex characters (32 bytes) - see .env.example.");
  process.exit(1);
}

// the admin password has to be strong: 12+ characters mixing all four kinds
const weak = [
  [ADMIN_PASSWORD.length >= 12, "at least 12 characters"],
  [/[a-z]/.test(ADMIN_PASSWORD), "a small letter"],
  [/[A-Z]/.test(ADMIN_PASSWORD), "a capital letter"],
  [/[0-9]/.test(ADMIN_PASSWORD), "a number"],
  [/[^A-Za-z0-9]/.test(ADMIN_PASSWORD), "a symbol (like ! @ # $ %)"],
].filter(([ok]) => !ok).map(([, need]) => need);
if (weak.length) {
  console.error(`ADMIN_PASSWORD is too weak - it needs ${weak.join(", ")}. Change it in .env.`);
  process.exit(1);
}

const KEY = Buffer.from(MESSAGES_KEY, "hex");
const DATA_DIR = path.resolve("data");
const MESSAGES_FILE = path.join(DATA_DIR, "messages.enc");
const CONTENT_FILE = path.join(DATA_DIR, "content.json");
const SECURITY_FILE = path.join(DATA_DIR, "security.enc");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const NOTES_DIR = path.join(DATA_DIR, "notes");
const MODELS_DIR = path.join(DATA_DIR, "models");

const MAX_MESSAGES = 2000;              // inbox full past this: new messages are refused, none are dropped
const MIN_FILL_MS = 3 * 1000;           // faster than this is a bot
const MAX_AGE_MS = 30 * 60 * 1000;      // a robot question expires after 30 min
const SESSION_MS = 8 * 60 * 60 * 1000;  // an admin login lasts 8 hours
const MAX_UPLOAD = 5 * 1024 * 1024;     // 5 MB per image
const MAX_NOTE_FILE = 4 * 1024 ** 3;    // 4 GB per notes file (lecture videos are big)
const MAX_MODEL = 1024 ** 3;            // 1 GB per 3D model
const ALLOWED_DOMAINS = ["gmail.com", "outlook.com"];   // also in src/common/pages/Contact.jsx
const COOKIE = "voiid_admin";
const isProd = process.env.NODE_ENV === "production";

// the content sections the admin may write - anything else is rejected
// (one per entry in src/common/pages/admin/schema.js)
const CONTENT_SECTIONS = [
  "links", "develop", "social", "skills", "games", "musicCategories", "songs",
  "certificationsPage", "certifications", "poems", "models",
];

const app = express();
// behind nginx / Cloudflare / a host's proxy, set TRUST_PROXY_HOPS in .env (1 for
// one proxy) so req.ip and the rate limits see the visitor, not the proxy
app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS || 0));
app.use(helmet());
const smallJson = express.json({ limit: "20kb" });

// nothing the admin sees, and no robot question, may land in a browser's disk cache
app.use(["/api/admin", "/api/challenge"], (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// Express 4 doesn't catch a rejected promise from an async handler - it would
// take the whole process down. This hands it to the JSON error handler instead.
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// rate limits count per visitor. An IPv4 visitor seen through an IPv6 socket
// ("::ffff:49.36.10.5") counts as their plain IPv4 address; a real IPv6
// visitor is counted per /56, since one person there can use a whole block.
const HEX_GROUP = /^[0-9a-f]{1,4}$/i;
const perVisitor = (req) => {
  const ip = String(req.ip || "").replace(/%.*$/, "");        // no zone id
  const v4 = ip.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  if (v4) return v4[1];
  if (!net.isIPv6(ip)) return ip;
  const [head, tail = ""] = ip.split("::");
  const parts = head.split(":").filter(Boolean);
  const rest = tail.split(":").filter(Boolean);
  if (![...parts, ...rest].every((g) => HEX_GROUP.test(g)) || parts.length + rest.length > 8) return ip;
  const groups = [...parts, ...Array(8 - parts.length - rest.length).fill("0"), ...rest].map((g) => parseInt(g, 16));
  const bytes = Buffer.alloc(16);
  groups.forEach((g, i) => bytes.writeUInt16BE(g, i * 2));
  return `v6:${bytes.subarray(0, 7).toString("hex")}`;   // the first 56 bits
};
const limiter = (opts) => rateLimit({ standardHeaders: true, legacyHeaders: false, keyGenerator: perVisitor, ...opts });


/* ---- file helpers --------------------------------------------------------- */

// write-then-rename, so a crash can never leave half a file behind
async function writeAtomic(file, text) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, text, { mode: 0o600 });
  await fs.rename(tmp, file);
}

// one write at a time per file
const queues = new Map();
function serial(file, job) {
  const run = (queues.get(file) || Promise.resolve()).then(job);
  queues.set(file, run.catch(() => {}));
  return run;
}


/* ---- encrypted message store -------------------------------------------- */

function encrypt(json) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const data = Buffer.concat([cipher.update(json, "utf8"), cipher.final()]);
  return JSON.stringify({ v: 1, iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"), data: data.toString("base64") });
}

function decrypt(text) {
  const { iv, tag, data } = JSON.parse(text);
  const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8");
}

async function readMessages() {
  try {
    return JSON.parse(decrypt(await fs.readFile(MESSAGES_FILE, "utf8")));
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;   // wrong key or damaged file - never silently start over
  }
}

const updateMessages = (change) =>
  serial(MESSAGES_FILE, async () => {
    const next = change(await readMessages());
    await writeAtomic(MESSAGES_FILE, encrypt(JSON.stringify(next)));
    return next;
  });


/* ---- robot check: signed one-time sums ---------------------------------- */

const sign = (nonce, issuedAt, answer) =>
  crypto.createHmac("sha256", CHALLENGE_SECRET).update(`${nonce}.${issuedAt}.${answer}`).digest("hex");

const safeEqual = (a, b) => {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

const usedNonces = new Map();   // nonce -> expiry, so a question can't be replayed

app.get("/api/challenge", (_req, res) => {
  const a = crypto.randomInt(1, 10);
  const b = crypto.randomInt(1, 10);
  const nonce = crypto.randomBytes(16).toString("hex");
  const issuedAt = Date.now();
  res.json({ question: `${a} + ${b}`, nonce, issuedAt, sig: sign(nonce, issuedAt, a + b) });
});

// an error message, or null when the visitor passed
function checkHuman({ website, challenge, answer }) {
  if (website) return "Robot check failed.";                                  // honeypot
  if (!challenge || typeof challenge !== "object") return "Robot check missing.";

  const { nonce, issuedAt, sig } = challenge;
  const age = Date.now() - Number(issuedAt);
  if (!nonce || !sig || !Number.isFinite(age)) return "Robot check missing.";
  if (age < MIN_FILL_MS) return "That was a little too fast - please try again.";
  if (age > MAX_AGE_MS) return "The robot check expired - please answer the new one.";

  const now = Date.now();
  for (const [n, exp] of usedNonces) if (exp < now) usedNonces.delete(n);
  if (usedNonces.has(nonce)) return "That robot check was already used - please answer the new one.";
  // one try per question, right or wrong - a wrong answer can't be retried against the same question
  usedNonces.set(nonce, Number(issuedAt) + MAX_AGE_MS);

  if (!safeEqual(sign(nonce, issuedAt, String(answer ?? "").trim()), sig)) {
    return "Wrong answer to the robot check.";
  }
  return null;
}


/* ---- contact form -------------------------------------------------------- */

app.post(
  "/api/contact",
  limiter({
    windowMs: 5 * 60 * 1000,
    limit: 5,
    message: { error: "Too many messages. Please wait 5 minutes and try again." },
  }),
  // and a cap for everyone together, so a botnet can't fill the inbox in an evening
  limiter({
    windowMs: 60 * 60 * 1000,
    limit: 100,
    keyGenerator: () => "all",
    message: { error: "The inbox is busy right now. Please try again later." },
  }),
  smallJson,
  [
    body("name").trim().isLength({ min: 1, max: 100 }).withMessage("Please enter your name."),
    body("email")
      .trim()
      .isEmail().withMessage("Please enter a valid email address.")
      .custom((v) => ALLOWED_DOMAINS.includes(v.split("@")[1]?.toLowerCase()))
      .withMessage("Only Gmail and Outlook emails are allowed."),
    body("subject").trim().isLength({ min: 1, max: 200 }).withMessage("Please enter a subject."),
    body("message").trim().isLength({ min: 1, max: 5000 }).withMessage("Please enter a message."),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const robot = checkHuman(req.body);
    if (robot) return res.status(400).json({ error: robot });

    const { name, email, subject, message } = req.body;
    try {
      let full = false;
      await updateMessages((all) => {
        if (all.length >= MAX_MESSAGES) { full = true; return all; }   // never push a real message out
        return [{
          id: crypto.randomUUID(),
          name, email, subject, message,
          receivedAt: new Date().toISOString(),
          read: false,
        }, ...all];
      });
      if (full) return res.status(503).json({ error: "The inbox is full right now. Please try again later." });
      res.json({ ok: true });
    } catch (err) {
      console.error("Could not save message:", err);
      res.status(500).json({ error: "The message could not be saved. Please try again later." });
    }
  }
);


/* ---- admin login ------------------------------------------------------------ */

const sessions = new Map();   // token -> expiry

/* ---- authenticator app (Google Authenticator, Authy, Microsoft Authenticator...)
   Standard 6-digit codes that change every 30 seconds (RFC 6238). The secret
   is kept encrypted in data/security.enc. Lost your phone? Delete that file
   on the server and log in with the password alone (a missing file means
   "off"; a file that can't be read refuses every login until it's fixed). */
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const toBase32 = (buf) => {
  let bits = "";
  for (const b of buf) bits += b.toString(2).padStart(8, "0");
  let out = "";
  for (let i = 0; i + 5 <= bits.length; i += 5) out += B32[parseInt(bits.slice(i, i + 5), 2)];
  return out;
};
const fromBase32 = (text) => {
  let bits = "";
  for (const c of text.replace(/=+$/, "").toUpperCase()) bits += B32.indexOf(c).toString(2).padStart(5, "0");
  const out = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) out.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(out);
};
const totpAt = (secret, step) => {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const h = crypto.createHmac("sha1", fromBase32(secret)).update(counter).digest();
  const o = h[h.length - 1] & 0xf;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1_000_000).padStart(6, "0");
};
// a code works once per secret - no replaying a code someone saw (in memory,
// so it starts over when the server restarts)
const lastStep = new Map();   // secret -> last accepted 30 s step
// accepts the code for now, or 30 s either side (phone clocks drift a little)
function codeMatches(secret, code) {
  const given = String(code ?? "").replace(/\s+/g, "");
  if (!/^\d{6}$/.test(given)) return false;
  const now = Math.floor(Date.now() / 30000);
  const used = lastStep.get(secret) || 0;
  for (const step of [now, now - 1, now + 1]) {
    const want = totpAt(secret, step);
    if (step > used && crypto.timingSafeEqual(Buffer.from(want), Buffer.from(given))) {
      lastStep.set(secret, step);
      return true;
    }
  }
  return false;
}
// null = the file isn't there = the authenticator is off (deleting the file is
// the documented way back in). Any other problem is thrown, never treated as "off".
async function readTotpSecret() {
  try {
    return JSON.parse(decrypt(await fs.readFile(SECURITY_FILE, "utf8"))).totp || null;
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw err;
  }
}
const writeTotpSecret = (secret) => (secret
  ? writeAtomic(SECURITY_FILE, encrypt(JSON.stringify({ totp: secret })))
  : fs.rm(SECURITY_FILE, { force: true }));
let pendingSecret = null;   // { secret, expires } while the admin is scanning the QR

const readCookie = (req, name) =>
  (req.headers.cookie || "").split(";").map((c) => c.trim().split("="))
    .find(([k]) => k === name)?.[1];

// Secure whenever the request came over https (seen through the trusted proxy
// too) or in production - not only when NODE_ENV happens to be set
function setSessionCookie(req, res, token, maxAgeMs) {
  const secure = isProd || req.secure ? "; Secure" : "";
  res.setHeader("Set-Cookie",
    `${COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/api/admin; Max-Age=${Math.floor(maxAgeMs / 1000)}${secure}`);
}

// forget sessions that ran out, and (after a 2FA change) every session but this one
function pruneSessions(keep) {
  const now = Date.now();
  for (const [token, expires] of sessions) {
    if (expires < now || (keep !== undefined && token !== keep)) sessions.delete(token);
  }
}

function requireAdmin(req, res, next) {
  const token = readCookie(req, COOKIE);
  const expires = token && sessions.get(token);
  if (!expires || expires < Date.now()) {
    if (token) sessions.delete(token);
    return res.status(401).json({ error: "Please log in." });
  }
  next();
}

// hashing both sides first makes the comparison constant-time at any length
const passwordMatches = (given) =>
  crypto.timingSafeEqual(
    crypto.createHash("sha256").update(String(given ?? "")).digest(),
    crypto.createHash("sha256").update(ADMIN_PASSWORD).digest()
  );

app.post(
  "/api/admin/login",
  limiter({ windowMs: 15 * 60 * 1000, limit: 10, message: { error: "Too many tries. Wait 15 minutes." } }),
  smallJson,
  wrap(async (req, res) => {
    if (!passwordMatches(req.body?.password)) return res.status(401).json({ error: "Wrong password." });
    // with the authenticator on, the password alone isn't enough. If the secret
    // can't be read (wrong MESSAGES_KEY, damaged file...) nobody gets in until
    // it's fixed - the password alone must never be enough by accident.
    let secret;
    try {
      secret = await readTotpSecret();
    } catch (err) {
      console.error("Could not read data/security.enc - is MESSAGES_KEY the one it was saved with?", err);
      return res.status(503).json({ error: "Login is temporarily unavailable." });
    }
    if (secret) {
      if (!req.body?.code) return res.status(401).json({ error: "Enter the 6-digit code from your authenticator app.", need2fa: true });
      if (!codeMatches(secret, req.body.code)) return res.status(401).json({ error: "That code is wrong or expired.", need2fa: true });
    }
    pruneSessions();
    const token = crypto.randomBytes(32).toString("hex");
    sessions.set(token, Date.now() + SESSION_MS);
    setSessionCookie(req, res, token, SESSION_MS);
    res.json({ ok: true });
  })
);

app.post("/api/admin/logout", (req, res) => {
  sessions.delete(readCookie(req, COOKIE));
  setSessionCookie(req, res, "", 0);
  res.json({ ok: true });
});

// lets the admin page ask "am I still logged in?"
app.get("/api/admin/session", requireAdmin, (_req, res) => res.json({ ok: true }));

/* ---- turning the authenticator on and off ---- */
app.get("/api/admin/2fa", requireAdmin, wrap(async (_req, res) => {
  res.json({ enabled: Boolean(await readTotpSecret()) });
}));

// step 1: a new secret and its QR code to scan
app.post("/api/admin/2fa/setup", requireAdmin, wrap(async (_req, res) => {
  if (await readTotpSecret()) return res.status(409).json({ error: "The authenticator is already on." });
  const secret = toBase32(crypto.randomBytes(20));
  pendingSecret = { secret, expires: Date.now() + 10 * 60 * 1000 };
  const uri = `otpauth://totp/Voiid:admin?secret=${secret}&issuer=Voiid&algorithm=SHA1&digits=6&period=30`;
  res.json({ secret, qr: await QRCode.toDataURL(uri, { margin: 1, width: 240 }) });
}));

// step 2: prove the app works by typing its code - only then is it switched on
app.post("/api/admin/2fa/enable", requireAdmin, smallJson, wrap(async (req, res) => {
  if (!pendingSecret || pendingSecret.expires < Date.now()) {
    return res.status(400).json({ error: "The setup timed out - start again." });
  }
  if (!codeMatches(pendingSecret.secret, req.body?.code)) return res.status(400).json({ error: "That code is wrong - check the app and try again." });
  await writeTotpSecret(pendingSecret.secret);
  pendingSecret = null;
  pruneSessions(readCookie(req, COOKIE));   // anyone else logged in has to come back through 2FA
  res.json({ enabled: true });
}));

// turning it off needs a current code too
app.post("/api/admin/2fa/disable", requireAdmin, smallJson, wrap(async (req, res) => {
  const secret = await readTotpSecret();
  if (!secret) return res.json({ enabled: false });
  if (!codeMatches(secret, req.body?.code)) return res.status(400).json({ error: "That code is wrong or expired." });
  await writeTotpSecret(null);
  pruneSessions(readCookie(req, COOKIE));
  res.json({ enabled: false });
}));


/* ---- admin: inbox --------------------------------------------------------- */

app.get("/api/admin/messages", requireAdmin, async (_req, res) => {
  try {
    res.json({ messages: await readMessages() });
  } catch (err) {
    console.error("Could not read messages:", err);
    res.status(500).json({ error: "Could not read the inbox - is MESSAGES_KEY the one it was saved with?" });
  }
});

app.patch("/api/admin/messages/:id", requireAdmin, smallJson, wrap(async (req, res) => {
  const read = Boolean(req.body?.read);
  await updateMessages((all) => all.map((m) => (m.id === req.params.id ? { ...m, read } : m)));
  res.json({ ok: true });
}));

app.delete("/api/admin/messages/:id", requireAdmin, wrap(async (req, res) => {
  await updateMessages((all) => all.filter((m) => m.id !== req.params.id));
  res.json({ ok: true });
}));


/* ---- site content ----------------------------------------------------------- */

// read once, kept in memory; every page load asks for it
let contentCache = null;   // { data, etag }
async function readContent() {
  if (contentCache) return contentCache.data;
  let data = {};
  try {
    data = JSON.parse(await fs.readFile(CONTENT_FILE, "utf8"));
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }
  contentCache = { data, etag: `"${crypto.createHash("sha1").update(JSON.stringify(data)).digest("hex")}"` };
  return data;
}

app.get("/api/content", wrap(async (req, res) => {
  const data = await readContent();
  res.set("Cache-Control", "no-cache");
  res.set("ETag", contentCache.etag);
  if (req.headers["if-none-match"] === contentCache.etag) return res.status(304).end();
  res.json({ data });
}));

/* What the admin may store. Values are shown on public pages, so links must
   be real web addresses (or a path on this site) - never javascript: or data:
   - and colours must be colours. Anything else is refused with a 400. */
const MAX_ITEMS = 500;
const MAX_TEXT = 20_000;   // a poem
const URL_FIELDS = new Set(["url", "verify", "cv", "file", "thumb", "logo", "image", "discord", "article",
  "github", "instagram", "research", "hackthebox", "huggingface"]);
const COLOR_FIELDS = new Set(["color", "glowColor"]);
const isUrl = (v) => v === "" || /^https?:\/\/[^\s]+$/i.test(v) || (/^\/[^/\\][^\s]*$/.test(v) && !/^\/\//.test(v));
const isColor = (v) => v === "" || v === "auto" || /^#[0-9a-f]{6}$/i.test(v);
const isYoutube = (v) => v === "" || /^[\w-]{11}$/.test(v) || (/^https?:\/\//i.test(v) && /youtu\.?be/i.test(v));

function checkValue(name, value) {
  if (typeof value === "number") return Number.isFinite(value) ? null : `${name} must be a number.`;
  if (typeof value === "boolean" || value === null) return null;
  if (typeof value !== "string") return `${name} must be text.`;
  if (value.length > MAX_TEXT) return `${name} is too long.`;
  if (URL_FIELDS.has(name) && !isUrl(value)) return `${name} must be a web address (https://…) or a path on this site (/…).`;
  if (name === "youtube" && !isYoutube(value)) return "youtube must be a YouTube link or video id.";
  if (COLOR_FIELDS.has(name) && !isColor(value)) return `${name} must be a colour like #F39C12, or auto.`;
  return null;
}
function checkRecord(record) {
  if (!record || typeof record !== "object" || Array.isArray(record)) return "Expected an object.";
  for (const [name, value] of Object.entries(record)) {
    if (!/^[A-Za-z][\w]{0,40}$/.test(name)) return `Bad field name "${name}".`;
    const err = checkValue(name, value);
    if (err) return err;
  }
  return null;
}
function checkContent(data) {
  for (const [section, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      if (value.length > MAX_ITEMS) return `${section}: at most ${MAX_ITEMS} items.`;
      for (const item of value) {
        const err = checkRecord(item);
        if (err) return `${section}: ${err}`;
      }
    } else {
      const err = checkRecord(value);
      if (err) return `${section}: ${err}`;
    }
  }
  return null;
}

// save one or more sections: { data: { games: [...], links: {...} } }
app.put("/api/admin/content", requireAdmin, express.json({ limit: "1mb" }), async (req, res) => {
  const data = req.body?.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return res.status(400).json({ error: "Expected { data: { section: value } }." });
  }
  const unknown = Object.keys(data).filter((k) => !CONTENT_SECTIONS.includes(k));
  if (unknown.length) return res.status(400).json({ error: `Unknown section(s): ${unknown.join(", ")}` });
  const bad = checkContent(data);
  if (bad) return res.status(400).json({ error: bad });

  try {
    const next = await serial(CONTENT_FILE, async () => {
      const merged = { ...(await readContent()), ...data };
      await writeAtomic(CONTENT_FILE, JSON.stringify(merged, null, 2));
      contentCache = null;
      return merged;
    });
    res.json({ data: next });
  } catch (err) {
    console.error("Could not save content:", err);
    res.status(500).json({ error: "Could not save." });
  }
});


/* ---- image uploads ------------------------------------------------------------ */

// the type is decided by the file's first bytes, never by what the browser
// claims. No SVG: it can carry scripts.
const IMAGE_SIGNATURES = [
  { ext: "png",  test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: "jpg",  test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: "gif",  test: (b) => b.subarray(0, 4).toString("latin1") === "GIF8" },
  { ext: "webp", test: (b) => b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP" },
];

app.post(
  "/api/admin/upload",
  requireAdmin,
  express.raw({ type: () => true, limit: MAX_UPLOAD }),
  async (req, res) => {
    const buf = req.body;
    if (!Buffer.isBuffer(buf) || buf.length < 12) return res.status(400).json({ error: "No image received." });
    const kind = IMAGE_SIGNATURES.find((s) => s.test(buf));
    if (!kind) return res.status(400).json({ error: "Only PNG, JPG, GIF or WebP images." });

    const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${kind.ext}`;
    try {
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
      await fs.writeFile(path.join(UPLOAD_DIR, name), buf);
      res.json({ url: `/uploads/${name}` });
    } catch (err) {
      console.error("Upload failed:", err);
      res.status(500).json({ error: "Could not save the image." });
    }
  }
);

/* ---- CV upload: one PDF, checked by its first bytes like the images ---------- */

const MAX_CV = 15 * 1024 * 1024;         // 15 MB

app.post(
  "/api/admin/upload-cv",
  requireAdmin,
  express.raw({ type: () => true, limit: MAX_CV }),
  async (req, res) => {
    const buf = req.body;
    if (!Buffer.isBuffer(buf) || buf.length < 8) return res.status(400).json({ error: "No file received." });
    if (buf.subarray(0, 5).toString("latin1") !== "%PDF-") {
      return res.status(400).json({ error: "The CV must be a PDF." });
    }

    const name = `cv-${Date.now()}-${crypto.randomBytes(6).toString("hex")}.pdf`;
    try {
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
      await fs.writeFile(path.join(UPLOAD_DIR, name), buf);
      res.json({ url: `/uploads/${name}` });
    } catch (err) {
      console.error("CV upload failed:", err);
      res.status(500).json({ error: "Could not save the CV." });
    }
  }
);

// the CV and PDF certificates are shown in an <iframe>, and browsers refuse to
// draw a PDF whose response carries an object-src 'none' policy (see /files/notes)
app.use("/uploads", (req, res, next) => {
  if (extOf(req.path) === "pdf") res.removeHeader("Content-Security-Policy");
  next();
}, express.static(UPLOAD_DIR, {
  fallthrough: false,
  setHeaders: (res) => res.set("X-Content-Type-Options", "nosniff"),
}));

/* ---- the notes library ---------------------------------------------------------
   A plain folder tree under data/notes. The site lists it, shows images, PDFs
   and videos in the page, and hands out any file as a download. The admin can
   make folders, upload, rename and delete. */

// file types the page can show; everything else is download-only
// (NotesBrowser.jsx reads the resulting `view` field and has its own extOf)
const VIEWABLE = {
  png: "image", jpg: "image", jpeg: "image", gif: "image", webp: "image",
  pdf: "pdf", mp4: "video", webm: "video", mov: "video",
};
// what the admin may upload (html/svg/js are left out: they could run code)
const NOTE_TYPES = new Set([
  ...Object.keys(VIEWABLE),
  "pkt", "dft", "txt", "md", "zip", "rar", "7z", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "csv", "py", "c", "cpp", "java",
]);
const extOf = (name) => (name.includes(".") ? name.split(".").pop().toLowerCase() : "");

// characters no file system name may contain (the last range is the control characters)
const BAD_CHARS = /[<>:"|?*\u0000-\u001f]/;   // eslint-disable-line no-control-regex
// a name Windows can't store: its reserved device names, or a trailing dot / space
const badOnWindows = (p) => /^(con|prn|aux|nul|com\d|lpt\d)(\..*)?$/i.test(p) || /[. ]$/.test(p);

// a relative path inside the library -> an absolute one, or null if it tries
// to climb out (.., absolute paths, hidden files)
function notesPath(rel = "") {
  const parts = String(rel).split(/[\\/]+/).filter(Boolean);
  if (parts.some((p) => p === ".." || p === "." || p.startsWith(".") || BAD_CHARS.test(p) || badOnWindows(p))) return null;
  const abs = path.resolve(NOTES_DIR, ...parts);
  return abs === NOTES_DIR || abs.startsWith(NOTES_DIR + path.sep) ? abs : null;
}
const relOf = (abs) => path.relative(NOTES_DIR, abs).split(path.sep).join("/");
const cleanName = (name) => {
  const n = String(name ?? "").trim();
  return n && n.length <= 150 && !/[\\/]/.test(n) && !BAD_CHARS.test(n) && !n.startsWith(".") && n !== ".." && !badOnWindows(n) ? n : null;
};

// a % sequence that isn't valid UTF-8 makes decodeURIComponent throw
const decodePath = (p) => { try { return decodeURIComponent(p); } catch { return null; } };

// read the entries of a folder a few at a time (never one by one, never all at once)
async function mapLimit(list, limit, fn) {
  const out = new Array(list.length);
  let next = 0;
  const worker = async () => {
    for (let i = next++; i < list.length; i = next++) out[i] = await fn(list[i], i);
  };
  await Promise.all(Array.from({ length: Math.min(limit, list.length) }, worker));
  return out;
}

async function listFolder(abs) {
  const entries = (await fs.readdir(abs, { withFileTypes: true })).filter((e) => !e.name.startsWith("."));
  const rows = await mapLimit(entries, 8, async (e) => {
    const full = path.join(abs, e.name);
    if (e.isDirectory()) {
      const inside = await fs.readdir(full).catch(() => []);
      return { folder: true, name: e.name, items: inside.filter((n) => !n.startsWith(".")).length };
    }
    if (!e.isFile()) return null;
    const st = await fs.stat(full);
    return { folder: false, name: e.name, size: st.size, modified: st.mtimeMs, view: VIEWABLE[extOf(e.name)] || null };
  });
  const byName = (a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
  const strip = ({ folder: _folder, ...row }) => row;
  return {
    folders: rows.filter((r) => r?.folder).map(strip).sort(byName),
    files: rows.filter((r) => r && !r.folder).map(strip).sort(byName),
  };
}

/* Search works from a list of every name in the library, kept in memory, so
   a search never walks the disk itself. The list is rebuilt when the admin
   changes something, and at most every 30 s otherwise - files may also be
   copied into data/notes by hand, and they show up on the next rebuild. */
const INDEX_MS = 30 * 1000;
let notesIndex = { at: 0, list: [], building: null };
const forgetNotesIndex = () => { notesIndex.at = 0; };
async function buildNotesIndex() {
  const list = [];
  const walk = async (dir) => {
    const entries = (await fs.readdir(dir, { withFileTypes: true }).catch(() => [])).filter((e) => !e.name.startsWith("."));
    await mapLimit(entries, 8, async (e) => {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        list.push({ path: relOf(full), name: e.name, folder: true, size: 0, view: null });
        await walk(full);
      } else if (e.isFile()) {
        const st = await fs.stat(full).catch(() => null);
        list.push({ path: relOf(full), name: e.name, folder: false, size: st?.size ?? 0, view: VIEWABLE[extOf(e.name)] || null });
      }
    });
  };
  await walk(NOTES_DIR);
  list.sort((a, b) => a.path.localeCompare(b.path, undefined, { numeric: true, sensitivity: "base" }));
  return list;
}
function getNotesIndex() {
  if (Date.now() - notesIndex.at < INDEX_MS) return Promise.resolve(notesIndex.list);
  if (!notesIndex.building) {
    notesIndex.building = buildNotesIndex()
      .then((list) => { notesIndex = { at: Date.now(), list, building: null }; return list; })
      .catch((err) => { notesIndex.building = null; throw err; });
  }
  return notesIndex.building;
}

const notesLimiter = limiter({ windowMs: 60 * 1000, limit: 60, message: { error: "Too many requests - slow down a little." } });

// GET /api/notes?path=Machine Learning/Module 1   - one folder
app.get("/api/notes", notesLimiter, async (req, res) => {
  const abs = notesPath(req.query.path);
  if (!abs) return res.status(400).json({ error: "Bad path." });
  try {
    const st = await fs.stat(abs);
    if (!st.isDirectory()) return res.status(404).json({ error: "Not a folder." });
    res.set("Cache-Control", "no-cache");
    res.json({ path: relOf(abs), ...(await listFolder(abs)) });
  } catch (err) {
    if (err.code === "ENOENT") return res.status(404).json({ error: "That folder doesn't exist." });
    console.error("Notes list failed:", err);
    res.status(500).json({ error: "Could not read the notes." });
  }
});

// GET /api/notes/search?q=ospf   - names anywhere in the library
app.get("/api/notes/search", notesLimiter, async (req, res) => {
  const q = String(req.query.q ?? "").trim().toLowerCase().slice(0, 100);
  if (q.length < 2) return res.json({ results: [] });
  try {
    const results = (await getNotesIndex()).filter((e) => e.name.toLowerCase().includes(q)).slice(0, 200);
    res.json({ results });
  } catch (err) {
    console.error("Notes search failed:", err);
    res.status(500).json({ error: "Search failed." });
  }
});

// the files themselves; ?download=1 saves instead of showing. Anything the
// page can't show is always a download, and nothing is ever run as a page.
app.use("/files/notes", (req, res, next) => {
  const file = decodePath(req.path);
  if (file === null) return res.status(400).json({ error: "Bad path." });
  const ext = extOf(file);
  if (req.query.download === "1" || !VIEWABLE[ext]) {
    // saved, never shown: a strict sandbox so it can't run as a page
    res.attachment(path.basename(file));
    res.set("Content-Security-Policy", "sandbox; default-src 'none'");
  } else if (VIEWABLE[ext] === "pdf") {
    // browsers refuse to draw a PDF under a sandbox / object-src 'none' rule
    res.removeHeader("Content-Security-Policy");
  }
  next();
}, express.static(NOTES_DIR, {
  fallthrough: false,
  dotfiles: "deny",
  index: false,
  setHeaders: (res) => res.set("X-Content-Type-Options", "nosniff"),
}));

// ---- admin: make a folder
app.post("/api/admin/notes/folder", requireAdmin, smallJson, async (req, res) => {
  const parent = notesPath(req.body?.path);
  const name = cleanName(req.body?.name);
  if (!parent || !name) return res.status(400).json({ error: "Give the folder a plain name (no / \\ : * ? \" < > |)." });
  try {
    await fs.mkdir(path.join(parent, name));
    forgetNotesIndex();
    res.json({ ok: true });
  } catch (err) {
    if (err.code === "EEXIST") return res.status(409).json({ error: "Something with that name is already there." });
    if (err.code === "ENOENT") return res.status(404).json({ error: "That folder doesn't exist." });
    console.error("New folder failed:", err);
    res.status(500).json({ error: "Could not make the folder." });
  }
});

// ---- admin: upload one file, streamed straight to disk
//      POST /api/admin/notes/upload?path=<folder>&name=<file name>  body = the file
app.post("/api/admin/notes/upload", requireAdmin, async (req, res) => {
  const folder = notesPath(req.query.path);
  const name = cleanName(req.query.name);
  if (!folder || !name) return res.status(400).json({ error: "Bad folder or file name." });
  if (!NOTE_TYPES.has(extOf(name))) {
    return res.status(400).json({ error: `.${extOf(name) || "?"} files aren't allowed. Allowed: ${[...NOTE_TYPES].join(", ")}.` });
  }
  const size = Number(req.headers["content-length"] || 0);
  if (size > MAX_NOTE_FILE) return res.status(413).json({ error: "That file is over 4 GB." });

  const target = path.join(folder, name);
  // a dotfile while it uploads: listings skip it and /files/notes refuses it
  const temp = path.join(folder, `.upload-${crypto.randomBytes(4).toString("hex")}.part`);
  try {
    const st = await fs.stat(folder).catch(() => null);
    if (!st?.isDirectory()) return res.status(404).json({ error: "That folder doesn't exist." });
    if (await fs.stat(target).catch(() => null)) {
      return res.status(409).json({ error: `"${name}" is already there - rename or delete it first.` });
    }
    let received = 0;
    req.on("data", (chunk) => {
      received += chunk.length;
      if (received > MAX_NOTE_FILE) req.destroy(new Error("too big"));
    });
    await pipeline(req, createWriteStream(temp, { flags: "wx" }));
    await fs.rename(temp, target);            // only appears once it's complete
    forgetNotesIndex();
    res.json({ ok: true, path: relOf(target) });
  } catch (err) {
    await fs.rm(temp, { force: true });
    console.error("Notes upload failed:", err.message);
    if (!res.headersSent) res.status(500).json({ error: "Upload failed." });
  }
});

// ---- admin: rename a file or folder (same place, new name)
app.post("/api/admin/notes/rename", requireAdmin, smallJson, async (req, res) => {
  const from = notesPath(req.body?.path);
  const name = cleanName(req.body?.name);
  if (!from || from === NOTES_DIR || !name) return res.status(400).json({ error: "Bad name." });
  const to = path.join(path.dirname(from), name);
  try {
    const st = await fs.stat(from);
    if (st.isFile() && !NOTE_TYPES.has(extOf(name))) return res.status(400).json({ error: "Keep an allowed file type ending." });
    // a change of case only ("a.pdf" -> "A.pdf") finds itself on Windows - that's allowed
    const sameItem = to.toLowerCase() === from.toLowerCase();
    if (!sameItem && await fs.stat(to).catch(() => null)) return res.status(409).json({ error: "Something with that name is already there." });
    await fs.rename(from, to);
    forgetNotesIndex();
    res.json({ ok: true });
  } catch (err) {
    if (err.code === "ENOENT") return res.status(404).json({ error: "That item doesn't exist any more." });
    console.error("Rename failed:", err);
    res.status(500).json({ error: "Could not rename." });
  }
});

// ---- admin: delete a file, or a folder with everything in it
app.delete("/api/admin/notes", requireAdmin, async (req, res) => {
  const abs = notesPath(req.query.path);
  if (!abs || abs === NOTES_DIR) return res.status(400).json({ error: "Bad path." });
  try {
    await fs.rm(abs, { recursive: true });
    forgetNotesIndex();
    res.json({ ok: true });
  } catch (err) {
    if (err.code === "ENOENT") return res.status(404).json({ error: "Already gone." });
    console.error("Delete failed:", err);
    res.status(500).json({ error: "Could not delete." });
  }
});

/* ---- 3D models -------------------------------------------------------------------
   Files for the 3D & Editing page's viewer, in data/models. The viewer has to
   fetch a model to show it, so every model file is public; the "downloadable"
   setting only decides whether ?download=1 (the Download button) is answered.
   It is a courtesy, not a lock - the bytes are in the browser either way. */

// VRoid (vrm), Blender's web formats (glb, gltf) and the common exchange ones
const MODEL_TYPES = new Set(["vrm", "glb", "gltf", "fbx", "obj", "stl", "ply", "dae"]);

app.post("/api/admin/models/upload", requireAdmin, async (req, res) => {
  const original = cleanName(req.query.name);
  const ext = original ? extOf(original) : "";
  if (!MODEL_TYPES.has(ext)) {
    return res.status(400).json({ error: `Upload a ${[...MODEL_TYPES].join(", ")} file. (.blend: export from Blender as .glb.)` });
  }
  const size = Number(req.headers["content-length"] || 0);
  if (size > MAX_MODEL) return res.status(413).json({ error: "That model is over 1 GB." });

  const base = original.slice(0, -(ext.length + 1)).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "model";
  const name = `${base}-${crypto.randomBytes(3).toString("hex")}.${ext}`;
  const target = path.join(MODELS_DIR, name);
  const temp = path.join(MODELS_DIR, `.${name}.part`);   // a dotfile until complete - never served
  try {
    await fs.mkdir(MODELS_DIR, { recursive: true });
    let received = 0;
    req.on("data", (chunk) => {
      received += chunk.length;
      if (received > MAX_MODEL) req.destroy(new Error("too big"));
    });
    await pipeline(req, createWriteStream(temp, { flags: "wx" }));
    await fs.rename(temp, target);
    res.json({ url: `/files/models/${name}`, format: ext });
  } catch (err) {
    await fs.rm(temp, { force: true });
    console.error("Model upload failed:", err.message);
    if (!res.headersSent) res.status(500).json({ error: "Upload failed." });
  }
});

app.use("/files/models", async (req, res, next) => {
  const decoded = decodePath(req.path);
  if (decoded === null) return res.status(400).json({ error: "Bad path." });
  const file = path.basename(decoded);
  res.set("Content-Security-Policy", "sandbox; default-src 'none'");
  if (req.query.download !== "1") return next();
  try {
    const { models = [] } = await readContent();
    const entry = models.find((m) => path.basename(String(m.file || "")) === file);
    if (!entry || entry.downloadable !== "yes") return res.status(403).json({ error: "This model has no download." });
    const nice = String(entry.name || "model").replace(/[^\w .-]+/g, "").trim() || "model";
    res.attachment(`${nice}.${extOf(file)}`);
    next();
  } catch (err) {
    console.error("Model download check failed:", err);
    res.status(500).json({ error: "Could not check that model." });
  }
}, express.static(MODELS_DIR, {
  fallthrough: false,
  dotfiles: "deny",
  index: false,
  setHeaders: (res) => res.set("X-Content-Type-Options", "nosniff"),
}));

// an /api address that doesn't exist answers in JSON like everything else
app.use("/api", (_req, res) => res.status(404).json({ error: "Not found." }));

// a too-big upload, bad JSON or a failed async route ends up here - answer in JSON, not HTML
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  if (status === 413) return res.status(413).json({ error: "That's too big - the limit for this upload is lower." });
  if (status === 404) return res.status(404).json({ error: "Not found." });
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 ? "Something went wrong on the server." : "Bad request." });
});


// the folders exist before the first request, so the routes never have to make them
await Promise.all([UPLOAD_DIR, NOTES_DIR, MODELS_DIR].map((d) => fs.mkdir(d, { recursive: true })));
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
