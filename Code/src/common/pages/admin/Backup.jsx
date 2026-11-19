import { useCallback, useEffect, useRef, useState } from "react";
import { getJson } from "../../content/api";

/**
 * Backup - download the site as one zip (server/backup.js makes it).
 *
 *   Full backup    everything needed to put the site back: the code, the
 *                  settings files and all the media and content
 *   Content only   just the media and the text: quotes, poems and the rest
 *                  of the content, the notes library, uploads, 3D models,
 *                  and the audio, video, images and certificates
 *
 * Neither holds the secrets (.env, the authenticator key) - keep your own
 * copy of .env somewhere safe.
 *
 * The zip is made while it downloads, so the browser's own download bar is
 * the progress bar. The server makes one backup at a time.
 */

const KINDS = [
  {
    key: "full",
    label: "Full backup",
    blurb: "Everything needed to restore the site: source code, config files, and all media and content. Not node_modules or dist (they are rebuilt), and not your secrets.",
  },
  {
    key: "content",
    label: "Content only",
    blurb: "Just what you made: quotes, poems and the rest of the content, the notes library, uploads, documents, 3D models, videos, audio and images.",
  },
];

const POLL_MS = 3000;

const Backup = ({ onLoggedOut }) => {
  const [busy, setBusy] = useState(false);            // the server is making one right now
  const [msg, setMsg] = useState({ text: "", tone: "" });
  const poll = useRef(0);

  const fail = useCallback((err) => {
    if (err.status === 401) onLoggedOut?.();
    else setMsg({ text: err.status ? err.message : "Can't reach the server.", tone: "err" });
  }, [onLoggedOut]);

  // while a backup runs, ask now and then whether it is done
  const watch = useCallback(() => {
    window.clearInterval(poll.current);
    poll.current = window.setInterval(() => {
      getJson("/api/admin/backup").then((d) => {
        if (d.busy) return;
        window.clearInterval(poll.current);
        setBusy(false);
        setMsg({ text: "The backup finished - check your Downloads folder.", tone: "ok" });
      }).catch(() => { /* a hiccup: try again on the next tick */ });
    }, POLL_MS);
  }, []);

  // one may already be running (started in another tab)
  useEffect(() => {
    getJson("/api/admin/backup").then((d) => { if (d.busy) { setBusy(true); watch(); } }).catch(fail);
    return () => window.clearInterval(poll.current);
  }, [fail, watch]);

  const starting = useRef(false);   // a double-click must not start two downloads
  const start = async (kind) => {
    if (starting.current) return;
    starting.current = true;
    setMsg({ text: "", tone: "" });
    try {
      // ask first: an expired login or a running backup is then a message here, not a broken download
      const { busy: running } = await getJson("/api/admin/backup");
      if (running) {
        setBusy(true);
        watch();
        setMsg({ text: "A backup is already being made - wait for it to finish.", tone: "err" });
        return;
      }
      // a plain link, so the browser streams the zip straight to disk
      const a = document.createElement("a");
      a.href = `/api/admin/backup/${kind.key}`;
      a.download = "";
      document.body.append(a);
      a.click();
      a.remove();
      setBusy(true);
      watch();
      setMsg({ text: `${kind.label} started - your browser is downloading the zip. A big site takes a while; keep this tab open.`, tone: "ok" });
    } catch (err) {
      fail(err);
    } finally {
      starting.current = false;
    }
  };

  return (
    <section className="adm-panel adm-security adm-backup">
      <h2 className="adm-panel-title">Backup</h2>
      <p className="adm-panel-blurb">
        Download a copy of the site as one zip file, named with today&apos;s date and time. Do it before big changes,
        and keep a copy off this server.
      </p>

      <div className="adm-backup-options">
        {KINDS.map((kind) => (
          <div key={kind.key} className="adm-backup-option">
            <button type="button" className={`adm-btn ${kind.key === "full" ? "is-primary" : ""}`} disabled={busy} onClick={() => start(kind)}>
              {kind.label}
            </button>
            <p className="adm-hint">{kind.blurb}</p>
          </div>
        ))}
      </div>

      {busy ? <div className="adm-sec-status"><span className="adm-sec-dot is-on" />Making a backup…</div> : null}
      {msg.text ? <p className={msg.tone === "err" ? "adm-gate-err" : "adm-sec-ok"}>{msg.text}</p> : null}
      <p className="adm-sec-note">
        Not in any backup: <code>.env</code> (your passwords and keys) and <code>data/security.enc</code> (the authenticator).
        Keep your own copy of <code>.env</code> - without it a restored inbox can&apos;t be read.
      </p>
    </section>
  );
};

export default Backup;
