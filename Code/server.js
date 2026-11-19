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
     /api/github/repos         the Develop map's GitHub projects, from the server's own copy
     /api/admin/backup/...     download the whole site or only its content as a zip (admin,
                               server/backup.js)

   Robot check on the contact form (all four must pass):
     1. honeypot   - a hidden "website" field people never see; bots fill it
     2. speed      - sent < 3 s after the question appeared = a bot
     3. question   - a small sum, signed with CHALLENGE_SECRET so the answer
                     can't be forged in the browser; each works only once
     4. rate limit - at most 5 messages per visitor every 5 minutes

   Storage, all under data/ (git-ignored):
     messages.enc  visitors' messages, AES-256-GCM encrypted with MESSAGES_KEY
     content.json  what the admin changed (layered over defaults.js), quotes included
     github-cache.json  the last copy of the GitHub project list (kept across restarts)
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
import { promisify } from "node:util";
import zlib from "node:zlib";
import express from "express";
import QRCode from "qrcode";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { body, validationResult } from "express-validator";
import { cleanQuotes } from "./server/quotes.js";
import { registerBackup } from "./server/backup.js";

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
  "certificationsPage", "certifications", "poems", "models", "quotes",
];

const app = express();
// behind nginx / Cloudflare / a host's proxy, set TRUST_PROXY_HOPS in .env (1 for
// one proxy) so req.ip and the rate limits see the visitor, not the proxy
app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS || 0));
app.use(helmet());
const smallJson = express.json({ limit: "20kb" });

/* How long a request may take to arrive. Node's own rule (5 minutes for any
   request, server.requestTimeout) cut off every big notes or model upload on
   an ordinary connection, so it is switched off at the bottom of this file and
   kept here instead, with one exception:
     - a logged-in admin's notes / model upload may take as long as it needs,
       and is only dropped when no bytes at all arrive for 2 minutes;
     - every other request with a body still has to arrive within 5 minutes,
       so nobody can hold connections open by sending a body a byte at a time.
   One sweep every 15 s over the requests still arriving - no timer each. */
const BODY_MS = 5 * 60 * 1000;
const UPLOAD_STALL_MS = 2 * 60 * 1000;
const BIG_UPLOAD = /^\/api\/admin\/(notes|models)\/upload\/?$/;
const arriving = new Set();   // { req, at, big, read, since }
app.use((req, _res, next) => {
  if (req.headers["transfer-encoding"] !== undefined || Number(req.headers["content-length"]) > 0) {
    const big = req.method === "POST" && BIG_UPLOAD.test(req.path) && hasAdminSession(req);
    arriving.add({ req, at: Date.now(), big, read: -1, since: Date.now() });
  }
  next();
});
setInterval(() => {
  const now = Date.now();
  for (const entry of arriving) {
    const { req } = entry;
    if (req.complete || req.destroyed || !req.socket || req.socket.destroyed) { arriving.delete(entry); continue; }
    if (entry.big) {
      const read = req.socket.bytesRead;
      if (read !== entry.read) { entry.read = read; entry.since = now; }
      else if (now - entry.since > UPLOAD_STALL_MS) { arriving.delete(entry); req.socket.destroy(); }
    } else if (now - entry.at > BODY_MS) {
      arriving.delete(entry);
      req.socket.destroy();
    }
  }
}, 15 * 1000).unref();

// nothing the admin sees, and no robot question, may land in a browser's disk cache
app.use(["/api/admin", "/api/challenge"], (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// the admin cookie is SameSite=Strict, which already keeps other sites out. This
// is a second lock: browsers say where a request came from (Sec-Fetch-Site), and
// anything that changes data must come from this site's own pages - not from
// another site, and not from a sister subdomain either.
app.use("/api/admin", (req, res, next) => {
  const from = req.headers["sec-fetch-site"];
  // a backup is a GET, but it reads the whole disk and hands over the site: same rule
  // (routes match any letter case, so /BACKUP/full reaches the backup too)
  const guarded = !["GET", "HEAD", "OPTIONS"].includes(req.method) || req.path.toLowerCase().startsWith("/backup/");
  if (guarded && from && from !== "same-origin" && from !== "none") {
    return res.status(403).json({ error: "Cross-site request refused." });
  }
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
// that list lives in memory, so a question from before this start can't be
// checked against it: it counts as expired (the page just asks for a new one)
const STARTED_AT = Date.now();

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
  // plain values only: a nonce sent as ["abc"] signs like "abc" but would never
  // match the used-nonce list, so one question could be replayed
  if (typeof nonce !== "string" || typeof sig !== "string" || nonce.length > 64 || sig.length > 128
    || !["number", "string"].includes(typeof issuedAt)) return "Robot check missing.";
  const age = Date.now() - Number(issuedAt);
  if (!nonce || !sig || !Number.isFinite(age)) return "Robot check missing.";
  if (age < MIN_FILL_MS) return "That was a little too fast - please try again.";
  if (age > MAX_AGE_MS || Number(issuedAt) < STARTED_AT) return "The robot check expired - please answer the new one.";

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
    // only messages that were stored count: refused requests (junk, failed robot
    // checks) must not use up everyone's allowance and shut the form for an hour
    skipFailedRequests: true,
    message: { error: "The inbox is busy right now. Please try again later." },
  }),
  smallJson,
  // text only - a list or an object in place of a field is never a real visitor.
  // Checked before the rules below, which would turn { } or 5 into text first.
  (req, res, next) => {
    if (!["name", "email", "subject", "message"].every((k) => typeof req.body?.[k] === "string")) {
      return res.status(400).json({ error: "Please fill in every field." });
    }
    next();
  },
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
    // text only - a list or an object in place of a field is never a real visitor
    if (!["name", "email", "subject", "message"].every((k) => typeof req.body?.[k] === "string")) {
      return res.status(400).json({ error: "Please fill in every field." });
    }
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

// is this request from a logged-in admin? (asks only - never answers the request)
function hasAdminSession(req) {
  const token = readCookie(req, COOKIE);
  const expires = token && sessions.get(token);
  return Boolean(expires && expires >= Date.now());
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
  typeof given === "string" && crypto.timingSafeEqual(
    crypto.createHash("sha256").update(String(given ?? "")).digest(),
    crypto.createHash("sha256").update(ADMIN_PASSWORD).digest()
  );

app.post(
  "/api/admin/login",
  // only failed tries count: logging in (and out) ten times must not lock the owner out
  limiter({ windowMs: 15 * 60 * 1000, limit: 10, skipSuccessfulRequests: true, message: { error: "Too many tries. Wait 15 minutes." } }),
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

// a 6-digit code can be guessed, so tries are counted here as at the login:
// 10 per 15 minutes (someone holding a stolen session must not be able to
// guess their way to switching the authenticator off)
const codeLimiter = limiter({ windowMs: 15 * 60 * 1000, limit: 10, message: { error: "Too many tries. Wait 15 minutes." } });

// step 2: prove the app works by typing its code - only then is it switched on
app.post("/api/admin/2fa/enable", requireAdmin, codeLimiter, smallJson, wrap(async (req, res) => {
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
app.post("/api/admin/2fa/disable", requireAdmin, codeLimiter, smallJson, wrap(async (req, res) => {
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
let contentSaves = 0;      // goes up with every save
async function readContent() {
  if (contentCache) return contentCache.data;
  const saves = contentSaves;
  let data = {};
  try {
    data = JSON.parse(await fs.readFile(CONTENT_FILE, "utf8"));
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }
  // a save landed while the file was being read: what was read may be the old
  // copy, and keeping it would make the next save undo that one - read again
  if (saves !== contentSaves) return readContent();
  contentCache = { data, etag: `"${crypto.createHash("sha1").update(JSON.stringify(data)).digest("hex")}"` };
  return data;
}

const packContent = promisify(zlib.gzip);
app.get("/api/content", wrap(async (req, res) => {
  const data = await readContent();
  res.set("Cache-Control", "no-cache");
  res.set("ETag", contentCache.etag);
  res.set("Vary", "Accept-Encoding");
  if (req.headers["if-none-match"] === contentCache.etag) return res.status(304).end();
  // every visitor gets the same reply until the next save (which drops the
  // cache): encoded, and compressed, once rather than per request
  const cache = contentCache?.data === data ? contentCache : { data };
  cache.body ??= JSON.stringify({ data });
  res.type("application/json");
  if (/\bgzip\b/.test(req.get("accept-encoding") || "")) {
    cache.packed ??= packContent(cache.body);
    const packed = await cache.packed.catch(() => null);
    if (packed) {
      res.set("Content-Encoding", "gzip");
      return res.send(packed);
    }
  }
  res.send(cache.body);
}));

/* ---- GitHub repos for the Develop map ---------------------------------------
   Browsers never talk to GitHub themselves: an anonymous visitor only gets 60
   GitHub requests an hour. The server asks instead, and keeps the answer (in
   memory and in data/github-cache.json) for the check interval set in
   /admin -> Develop map (10 minutes or more, default 10) - so GitHub is asked
   at most once per interval however many visitors open the map. Re-checks send the
   saved ETag, a failed check falls back to the last good answer, and
   GITHUB_TOKEN in .env (optional) raises GitHub's limit from 60 to 5000/hour. */
const GITHUB_FILE = path.join(DATA_DIR, "github-cache.json");
const GITHUB_API = (process.env.GITHUB_API_URL || "https://api.github.com").replace(/\/+$/, "");
const GITHUB_EVERY_MIN = 10;               // default check interval, minutes (admin -> Develop map -> checkEvery)
const GITHUB_EVERY_MIN_LOWEST = 10;        // never more often than this, whatever is saved
const GITHUB_EVERY_MIN_HIGHEST = 7 * 24 * 60;   // a week
const GITHUB_RETRY_MS = 60 * 1000;         // after a failed check, leave GitHub alone this long
const GITHUB_RETRY_MAX_MS = 30 * 60 * 1000;   // ...doubling with each failure in a row, up to this
const GITHUB_PAGES = 5;                   // 100 repos a page: up to 500
const GITHUB_DEFAULT_USER = "official-imvoiid";   // also in src/common/content/defaults.js

// "https://github.com/name" (or just "name") -> "name"; same as src/common/content/github.js
function githubUserOf(link) {
  const s = String(link || "").trim();
  const m = s.match(/github\.com\/([A-Za-z0-9-]+)/i);
  if (m) return m[1];
  return /^[A-Za-z0-9-]+$/.test(s) ? s : "";
}

const newGithubState = (user) => ({ user, pages: [], checkedAt: 0, retryAt: 0, failures: 0, lastError: null, refreshing: null });
let githubState = null;      // the one user being charted
let githubTokenOk = true;    // false once GitHub refuses GITHUB_TOKEN: the server carries on without it

function githubError(message, status, retryAt = 0) {
  return Object.assign(new Error(message), { status, retryAt });
}

/* Everything shown on the map passes through here - from GitHub, and again
   when data/github-cache.json is read back - so a repo's website field (set by
   whoever owns the repo) or a damaged cache file can never put a javascript:
   link or a huge text on the page. Links must be plain http(s) addresses. */
const webLink = (v) => {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s || s.length > 500 || !/^https?:\/\/[^\s<>"']+$/i.test(s)) return "";
  try { return ["http:", "https:"].includes(new URL(s).protocol) ? s : ""; } catch { return ""; }
};
const text = (v, max) => (typeof v === "string" ? v.slice(0, max) : "");
const isoDate = (v) => (typeof v === "string" && !Number.isNaN(Date.parse(v)) ? v.slice(0, 40) : "");
const count = (v) => (Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0);
function cleanRepo(r) {
  if (!r || typeof r !== "object") return null;
  const name = text(r.name, 100);
  const url = webLink(r.url ?? r.html_url);
  if (!name || !url) return null;
  return {
    id: count(r.id),
    name,
    description: text(r.description, 500),
    url,
    homepage: webLink(r.homepage),
    language: text(r.language, 40),
    stars: count(r.stars ?? r.stargazers_count),
    forks: count(r.forks ?? r.forks_count),
    topics: Array.isArray(r.topics) ? r.topics.filter((t) => typeof t === "string").slice(0, 20).map((t) => t.slice(0, 50)) : [],
    fork: r.fork === true,
    archived: r.archived === true,
    createdAt: isoDate(r.createdAt ?? r.created_at),
    pushedAt: isoDate(r.pushedAt ?? r.pushed_at),
  };
}
// an ETag is sent back to GitHub as a header: only the characters an ETag can have
const cleanEtag = (v) => (typeof v === "string" && /^(W\/)?"[\x21\x23-\x7e]{1,200}"$/.test(v) ? v : "");
const cleanPage = (p) => (p && Array.isArray(p.repos)
  ? { etag: cleanEtag(p.etag), repos: p.repos.slice(0, 100).map(cleanRepo).filter(Boolean), raw: p.raw ?? p.repos.length }
  : null);

// every page of the user's repos; a page GitHub says is unchanged (304) is reused
async function fetchGithubPages(user, old) {
  const pages = [];
  for (let page = 1; page <= GITHUB_PAGES; page++) {
    const before = old[page - 1];
    const useToken = Boolean(process.env.GITHUB_TOKEN) && githubTokenOk;
    const headers = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "develop-map" };
    if (useToken) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    if (before?.etag) headers["If-None-Match"] = before.etag;
    const res = await fetch(
      `${GITHUB_API}/users/${encodeURIComponent(user)}/repos?per_page=100&page=${page}&sort=pushed`,
      { headers, signal: AbortSignal.timeout(10 * 1000) }
    );
    // an answer whose body isn't read (304, errors, limits) must still be let go
    // of, or its connection stays tied up until garbage collection
    if (res.status !== 200) await res.body?.cancel().catch(() => {});
    if (res.status === 401 && useToken) {
      // a wrong or expired token must not take the map down: ask again without it
      githubTokenOk = false;
      console.error("github: GITHUB_TOKEN was refused - carrying on without it. Fix or remove it in .env.");
      page--;
      continue;
    }
    let entry;
    if (res.status === 304 && before) {
      entry = before;
    } else if (res.status === 404) {
      throw githubError(`GitHub has no user called "${user}".`, 404);
    } else if (res.status === 403 || res.status === 429) {
      // GitHub says when it will answer again - don't ask before then (an hour at most)
      const reset = Number(res.headers.get("x-ratelimit-reset")) * 1000;
      const after = Date.now() + Number(res.headers.get("retry-after")) * 1000;
      const until = Math.min(Math.max(reset || 0, after || 0), Date.now() + 60 * 60 * 1000);
      throw githubError("GitHub's hourly limit was reached - try again in a little while.", 503, until);
    } else if (!res.ok) {
      throw githubError("Could not reach GitHub.", 502);
    } else if (res.status !== 200) {
      throw githubError("Could not reach GitHub.", 502);   // 2xx without a list (204, 206...) is not an answer we can use
    } else {
      const batch = await res.json();
      if (!Array.isArray(batch)) throw githubError("Could not reach GitHub.", 502);
      // raw: how many GitHub sent (a full page of 100 means there may be another page)
      entry = { etag: cleanEtag(res.headers.get("etag")), repos: batch.slice(0, 100).map(cleanRepo).filter(Boolean), raw: batch.length };
    }
    pages.push(entry);
    if ((entry.raw ?? entry.repos.length) < 100) break;
  }
  return pages;
}

// Resolves to the state holding the repos, or throws when there is nothing to
// show. Nobody ever waits for GitHub once a copy exists: the saved copy goes
// out at once and a due check runs alongside, replacing the copy when it lands.
// Only the schedule decides when GitHub is asked - no visitor (and no Refresh
// button) can make the server ask it sooner.
async function getGithubRepos(user, ttl) {
  if (!githubState) {
    // first use since the server started: pick up what the last run saved
    let saved = null;
    try { saved = JSON.parse(await fs.readFile(GITHUB_FILE, "utf8")); } catch { /* none yet, or unreadable */ }
    if (!githubState) {
      githubState = newGithubState(saved?.user || user);
      if (saved && Array.isArray(saved.pages) && Number.isFinite(saved.checkedAt)) {
        githubState.pages = saved.pages.slice(0, GITHUB_PAGES).map(cleanPage).filter(Boolean);
        // a saved time in the future (clock moved back, or an edited file) would freeze the copy: treat it as due now
        githubState.checkedAt = saved.checkedAt > 0 && saved.checkedAt <= Date.now() ? saved.checkedAt : (githubState.pages.length ? 1 : 0);
      }
    }
  }
  if (githubState.user !== user) githubState = newGithubState(user);   // the admin changed the GitHub link
  const st = githubState;
  const have = st.checkedAt > 0;
  const now = Date.now();
  const due = !have || now - st.checkedAt >= ttl;
  if (!due) return st;                                                 // fresh: GitHub isn't asked
  if (now < st.retryAt) {                                              // GitHub just failed: don't ask again yet
    if (have) return st;
    throw st.lastError;
  }
  if (!st.refreshing) {                                                // one check at a time, shared by everyone waiting
    st.refreshing = fetchGithubPages(user, st.pages)
      .then((pages) => {
        st.pages = pages;
        st.checkedAt = Date.now();
        st.lastError = null;
        st.failures = 0;
        const text = JSON.stringify({ user, checkedAt: st.checkedAt, pages });
        serial(GITHUB_FILE, () => writeAtomic(GITHUB_FILE, text)).catch((err) => console.error("github cache:", err.message));
      })
      .catch((err) => {
        st.lastError = err.status ? err : githubError("Could not reach GitHub.", 502);
        // each failure in a row doubles the wait (1, 2, 4... up to 30 minutes): a wrong
        // user name or a GitHub outage must not use up the hourly allowance on retries
        st.failures = (st.failures || 0) + 1;
        const wait = Math.min(GITHUB_RETRY_MS * 2 ** Math.min(st.failures - 1, 10), GITHUB_RETRY_MAX_MS);
        st.retryAt = Math.max(err.retryAt || 0, Date.now() + wait);
        console.error("github:", err.message);
      })
      .finally(() => { st.refreshing = null; });
  }
  if (have) return st;   // nobody waits on GitHub: the saved answer goes out now, the newer one to whoever asks next
  await st.refreshing;
  if (st.checkedAt > 0) return st;
  throw st.lastError;
}

const githubLimiter = limiter({ windowMs: 60 * 1000, limit: 60, message: { error: "Too many requests - slow down a little." } });

// minutes as saved in /admin -> Develop map, kept within the allowed range
function githubEveryMin(saved) {
  const n = Number(saved);
  if (saved === "" || saved === undefined || saved === null || !Number.isFinite(n)) return GITHUB_EVERY_MIN;
  return Math.min(GITHUB_EVERY_MIN_HIGHEST, Math.max(GITHUB_EVERY_MIN_LOWEST, Math.round(n)));
}

// whose repos (the GitHub link saved in /admin -> Links) and how often to check
async function githubSettings() {
  const content = await readContent();
  const link = content.links?.github;
  const everyMin = githubEveryMin(content.develop?.checkEvery);
  return { user: link === undefined ? GITHUB_DEFAULT_USER : githubUserOf(link), everyMin, ttl: everyMin * 60 * 1000 };
}

// The server keeps the copy up to date on its own, on the schedule set in
// /admin -> Develop map: ready when it starts (from data/github-cache.json, or
// GitHub if that is missing or old), then a new check as soon as the copy is
// an interval old, replacing it - visitors or not, so whoever comes next gets
// a recent copy instantly. The timer wakes exactly when the copy becomes due
// (so "Server: … ago" never runs past the interval), and at least once a
// minute so a changed interval in the admin takes effect; a wake with nothing
// due only reads two numbers from memory - no GitHub request, no disk.
// Only ever one timer: a wake while another is still running (say, the admin
// saved while a GitHub check was under way) just asks that one to go round
// again when it finishes, instead of starting a second chain of timers.
let githubTimer = null;
let githubWarming = false;
let githubWarmAgain = false;
const warmGithub = async () => {
  if (githubWarming) { githubWarmAgain = true; return; }
  githubWarming = true;
  clearTimeout(githubTimer);
  let wait = 60 * 1000;
  try {
    const { user, ttl } = await githubSettings();
    if (user) {
      const st = await getGithubRepos(user, ttl);
      if (st.refreshing) await st.refreshing;                   // a due check: plan the next one from its result
      const dueIn = Math.max(st.checkedAt + ttl, st.retryAt) - Date.now();
      wait = Math.min(60 * 1000, Math.max(1000, dueIn));
    }
  } catch { /* nothing to show yet - try again in a minute */ }
  githubWarming = false;
  if (githubWarmAgain) { githubWarmAgain = false; wait = 0; }
  githubTimer = setTimeout(warmGithub, wait);
  githubTimer.unref();
};
warmGithub();

// One copy, prepared once for every visitor: the list (duplicates dropped - a
// repo pushed to while GitHub was being paged through can turn up on two
// pages), its JSON, and a short version tag that changes only when the list
// does. A browser that already holds that version is told "same" and gets no
// list at all (about 200 bytes instead of ~28 KB).
function githubCopyOf(st) {
  if (st.copyFor !== st.pages) {
    const seen = new Set();
    const list = [];
    for (const r of st.pages.flatMap((p) => p.repos)) {
      const key = r.id || r.url;
      if (seen.has(key)) continue;
      seen.add(key);
      list.push(r);
    }
    const json = JSON.stringify(list);
    st.copy = { json, count: list.length, version: crypto.createHash("sha1").update(`${st.user}\n${json}`).digest("hex").slice(0, 16) };
    st.copyFor = st.pages;
  }
  return st.copy;
}
const gzip = promisify(zlib.gzip);

// GET /api/github/repos[?have=<version>] - the public repos of the GitHub link
// saved in /admin -> Links. Always answered from the server's copy; the server
// alone decides when to ask GitHub. `have`: the version this browser already
// holds - if it is still the current one, the list itself is left out.
app.get("/api/github/repos", githubLimiter, wrap(async (req, res) => {
  const { user, ttl, everyMin } = await githubSettings();
  res.set("Cache-Control", "no-store");
  res.set("Vary", "Accept-Encoding");
  if (!user) return res.status(404).json({ error: "No GitHub link is set." });
  let st;
  try {
    st = await getGithubRepos(user, ttl);
  } catch (err) {
    return res.status(err.status || 502).json({ error: err.message });
  }
  const copy = githubCopyOf(st);
  const age = Math.max(0, Date.now() - st.checkedAt);   // the browser's clock may be wrong: it gets an age, not a time
  const stale = age >= ttl + 2 * 60 * 1000;
  const meta = {
    user,
    version: copy.version,            // changes only when the list does
    fetchedAt: st.checkedAt,          // when the server last checked GitHub
    age,                              // ...as an age in ms
    checkEvery: everyMin,             // the server checks GitHub this often (minutes)
    checking: Boolean(st.refreshing), // a check is under way: ask again in a few seconds for the new copy
    stale,
    notice: stale && st.lastError ? st.lastError.message : "",
  };
  const have = typeof req.query.have === "string" && /^[0-9a-f]{16}$/.test(req.query.have) ? req.query.have : "";
  if (have === copy.version) return res.json({ ...meta, same: true });

  // the full list: put together from the prepared JSON (not re-encoded per
  // visitor) and compressed for browsers that accept it (~28 KB -> ~9 KB)
  const body = `${JSON.stringify(meta).slice(0, -1)},"repos":${copy.json}}`;
  res.type("application/json");
  if (body.length > 1024 && /\bgzip\b/.test(req.get("accept-encoding") || "")) {
    try {
      const packed = await gzip(body);
      res.set("Content-Encoding", "gzip");
      return res.send(packed);
    } catch { /* fall through to the plain answer */ }
  }
  res.send(body);
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
  // Develop map: how often the server checks GitHub - 10 minutes or more (empty = the default 10)
  const every = data.develop?.checkEvery;
  if (every !== undefined && every !== "" && !(Number.isInteger(every) && every >= GITHUB_EVERY_MIN_LOWEST && every <= GITHUB_EVERY_MIN_HIGHEST)) {
    return res.status(400).json({ error: `develop: "Check GitHub every" must be a whole number of minutes from ${GITHUB_EVERY_MIN_LOWEST} to ${GITHUB_EVERY_MIN_HIGHEST}.` });
  }
  // quotes have their own, tighter rules (server/quotes.js): only text / author / date, with length limits
  if ("quotes" in data) {
    const quotes = cleanQuotes(data.quotes);
    if (quotes.error) return res.status(400).json({ error: quotes.error });
    data.quotes = quotes.value;
  }

  try {
    const next = await serial(CONTENT_FILE, async () => {
      const merged = { ...(await readContent()), ...data };
      await writeAtomic(CONTENT_FILE, JSON.stringify(merged, null, 2));
      contentCache = null;
      contentSaves++;
      return merged;
    });
    // a new GitHub link or check interval takes effect now, not on the next minute's tick
    if ("links" in data || "develop" in data) warmGithub();
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
  // every upload gets a new random name and is never rewritten, so a browser may keep it
  maxAge: "30d",
  immutable: true,
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
// ...or a Windows short name ("UPLOAD~1.PAR"): Windows opens the long-named file
// it stands for, so it would get round the rule that dotfiles (half-finished
// uploads) are never served. Such names are refused everywhere instead.
const badOnWindows = (p) => /^(con|prn|aux|nul|com\d|lpt\d)(\..*)?$/i.test(p) || /[. ]$/.test(p) || /~\d/.test(p);

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
// a folder's listing is kept for a few seconds too, and visitors asking for the
// same folder at the same moment share one read - a folder of thousands of files
// otherwise costs a disk look-up per file for every single visitor
const LIST_MS = 5 * 1000;
const listings = new Map();   // folder -> { at, json: Promise<string> }
const forgetNotesIndex = () => { notesIndex.at = 0; listings.clear(); };
function cachedListing(abs) {
  const hit = listings.get(abs);
  if (hit && Date.now() - hit.at < LIST_MS) return hit.json;
  if (listings.size > 500) listings.clear();
  const json = listFolder(abs).then((list) => JSON.stringify({ path: relOf(abs), ...list }));
  json.catch(() => listings.delete(abs));
  listings.set(abs, { at: Date.now(), json });
  return json;
}
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
    res.type("application/json").send(await cachedListing(abs));
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
  // ":" would name an NTFS stream (ok.txt::$DATA) - never a file in the library
  if (file === null || file.split("/").some((p) => BAD_CHARS.test(p) || badOnWindows(p))) return res.status(400).json({ error: "Bad path." });
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
  if (decoded === null || decoded.split("/").some((p) => BAD_CHARS.test(p) || badOnWindows(p))) return res.status(400).json({ error: "Bad path." });
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

// admin -> Backup: the whole site, or just its content, as one streamed zip (server/backup.js)
registerBackup(app, { requireAdmin });

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
const server = app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
// Node's 5-minute limit on a whole request is replaced by the sweep near the top
// (BODY_MS / UPLOAD_STALL_MS); its 60 s limit on the headers still applies
server.requestTimeout = 0;
