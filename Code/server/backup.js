/* ==========================================================================
   server/backup.js - the admin's Backup button (admin -> Backup).

     GET /api/admin/backup           { busy }  - is a backup running right now?
     GET /api/admin/backup/full      everything needed to put the site back
     GET /api/admin/backup/content   only the media and the text content

   Each answers with ONE zip, made while it downloads: files are read from
   disk and sent on a few at a time, so a 4 GB lecture video never sits in
   memory. Admin only, like every other /api/admin route.

   What goes in is decided here and nowhere else - the browser sends no path,
   no file name and no options, so there is nothing to trick.

   Full backup: the whole project folder, except
     node_modules, dist        rebuilt with `npm install` / `npm run build`
     .env and its variants     the passwords and keys   (.env.example is kept)
     data/security.enc         the authenticator secret
     *.pem / *.key / *.pfx     certificates and private keys, should any appear
     dot-folders (.git, .vscode...), half-finished uploads, *.tmp, *.log
   data/messages.enc (the inbox) IS in the full backup: it is encrypted, and
   unreadable without MESSAGES_KEY from .env - which is not in the backup.
   So after restoring: put your own .env back (keep a copy of it somewhere
   safe, separately), and set the authenticator up again.

   Content only: data/content.json (quotes, poems, songs, links...),
   data/notes, data/uploads, data/models, and public/ audio, video, images
   and certificates. No code, no inbox, no secrets.

   One backup at a time for the whole server: a second request while one is
   running gets a 409 instead of starting another walk over the disk. A
   download that takes no bytes for 5 minutes is dropped (pausing it that
   long in the browser cancels it - just start again).
   ========================================================================== */

import fs from "node:fs/promises";
import path from "node:path";
import archiver from "archiver";

const ROOT = path.resolve(".");

// never in any backup, wherever they are
const SECRET_FILE = /^\.env(?!\.example$)|\.(pem|key|pfx|p12)$/i;
const JUNK_FILE = /\.(tmp|part|log)$/i;
const SKIP_DIRS = new Set(["node_modules", "dist", "dist-ssr"]);
const SECRET_PATHS = new Set(["data/security.enc"]);
// root dotfiles that are part of the project (every other dot-name is skipped)
const KEEP_DOTFILES = new Set([".gitignore", ".env.example"]);

// already-compressed files are stored as they are - squeezing a video again
// only burns CPU. Text (code, json, svg, md...) is compressed.
const STORED = new Set([
  "png", "jpg", "jpeg", "gif", "webp", "avif", "mp4", "webm", "mov", "mkv", "mp3", "ogg", "m4a", "wav", "flac",
  "pdf", "zip", "rar", "7z", "gz", "docx", "pptx", "xlsx", "woff", "woff2", "vrm", "glb", "enc",
]);
const extOf = (name) => (name.includes(".") ? name.split(".").pop().toLowerCase() : "");

const PLANS = {
  full: { label: "full-backup", roots: [""] },
  content: {
    label: "content-backup",
    roots: [
      "data/content.json", "data/notes", "data/uploads", "data/models",
      "public/audio", "public/video", "public/images", "public/certificates",
    ],
  },
};

/* every file under `rel` (a path inside the project, "" = all of it), one at a
   time, as { abs, name }. Links are never followed, so nothing outside the
   project can be pulled in. */
async function* walk(rel) {
  const abs = path.join(ROOT, rel);
  const st = await fs.lstat(abs).catch(() => null);
  if (!st || st.isSymbolicLink()) return;
  if (st.isFile()) {
    if (allowed(rel)) yield { abs, name: rel };
    return;
  }
  if (!st.isDirectory()) return;
  const entries = await fs.readdir(abs, { withFileTypes: true }).catch(() => []);
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const e of entries) {
    const child = rel ? `${rel}/${e.name}` : e.name;
    if (e.isSymbolicLink()) continue;
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name) || e.name.startsWith(".")) continue;
      yield* walk(child);
    } else if (e.isFile() && allowed(child)) {
      yield { abs: path.join(abs, e.name), name: child };
    }
  }
}

function allowed(rel) {
  const name = rel.split("/").pop();
  if (SECRET_PATHS.has(rel) || SECRET_FILE.test(name) || JUNK_FILE.test(name)) return false;
  if (name.startsWith(".") && !KEEP_DOTFILES.has(rel)) return false;
  return true;
}

// 2026-01-31_18-05-09 (the server's UTC clock) - safe in a file name everywhere
const stamp = () => new Date().toISOString().slice(0, 19).replace("T", "_").replace(/:/g, "-");

const STALL_MS = 5 * 60 * 1000;   // no bytes taken for this long = the download is dead

let running = false;

export function registerBackup(app, { requireAdmin }) {
  app.get("/api/admin/backup", requireAdmin, (_req, res) => res.json({ busy: running }));

  const send = (kind) => (req, res) => {
    if (running) return res.status(409).json({ error: "A backup is already being made - wait for it to finish." });
    running = true;
    const plan = PLANS[kind];

    const archive = archiver("zip", { zlib: { level: 6 }, highWaterMark: 1024 * 1024 });
    let done = false;
    const finish = () => { running = false; };
    // "close" comes after a finished download and after a cancelled one alike
    res.on("close", () => {
      clearInterval(watchdog);
      if (!done) archive.abort();          // the visitor went away: stop reading the disk
      finish();
    });
    // a download that stops taking bytes (a sleeping laptop, a dead connection)
    // is dropped, so it can't keep every later backup waiting
    let sent = -1;
    let since = Date.now();
    const watchdog = setInterval(() => {
      const now = req.socket?.bytesWritten ?? 0;
      if (now !== sent) { sent = now; since = Date.now(); }
      else if (Date.now() - since > STALL_MS) res.destroy();
    }, 15 * 1000);
    watchdog.unref();
    archive.on("warning", (err) => console.error("Backup warning:", err.message));
    archive.on("error", (err) => {
      console.error("Backup failed:", err);
      finish();
      if (!res.headersSent) res.status(500).json({ error: "The backup could not be made." });
      else res.destroy(err);              // half a zip must fail loudly, not look complete
    });
    archive.on("end", () => { done = true; });

    res.attachment(`voiid-${plan.label}-${stamp()}.zip`);
    res.type("application/zip");
    res.set("X-Content-Type-Options", "nosniff");
    archive.pipe(res);

    (async () => {
      // files are handed to the zip one by one, waiting for each to be written,
      // so neither the list of files nor their bytes pile up in memory
      for (const root of plan.roots) {
        for await (const file of walk(root)) {
          if (done || res.destroyed) return;
          await new Promise((resolve) => {
            // written, or skipped with a warning (a file deleted meanwhile), or failed
            const next = () => {
              archive.off("entry", onEntry);
              archive.off("warning", next);
              archive.off("error", next);
              res.off("close", next);
              resolve();
            };
            const onEntry = (entry) => { if (entry.name === file.name) next(); };
            archive.on("entry", onEntry);
            archive.on("warning", next);
            archive.on("error", next);
            res.on("close", next);          // a cancelled download: stop waiting for a file that will never be written
            archive.file(file.abs, { name: file.name, store: STORED.has(extOf(file.name)) });
          });
        }
      }
      if (!res.destroyed) await archive.finalize();
    })().catch((err) => archive.emit("error", err));
  };

  app.get("/api/admin/backup/full", requireAdmin, send("full"));
  app.get("/api/admin/backup/content", requireAdmin, send("content"));
}
