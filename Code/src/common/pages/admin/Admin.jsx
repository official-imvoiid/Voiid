import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useContentAdmin } from "../../content/ContentContext";
import SECTIONS from "./schema";
import SectionEditor from "./SectionEditor";
import Inbox from "./Inbox";
import Security from "./Security";
import NotesBrowser from "../notes/NotesBrowser";

/**
 * Admin - edit the site and read contact messages.
 *
 * The login is checked by server.js against ADMIN_PASSWORD (in .env) and
 * kept in an HttpOnly cookie. Saves go to the server and are live for every
 * visitor straight away. Needs `npm run server` running.
 *
 *   Admin.jsx          login + the section rail
 *   SectionEditor.jsx  edit one section as a draft, Save / Discard
 *   Fields.jsx         the input controls (text, colour, image upload…)
 *   Inbox.jsx          contact form messages
 *   Security.jsx       the optional authenticator app (Google Authenticator)
 *   ../notes/NotesBrowser.jsx  the notes library (folders + file uploads)
 *   schema.js          which sections exist and what fields they have
 */

const NAV = [
  ...SECTIONS.map((s) => ({ key: s.key, label: s.label })),
  { key: "notes", label: "Notes (files)" },
  { key: "inbox", label: "Inbox" },
  { key: "security", label: "Security" },
];

const AdminPortal = ({ onLogout }) => {
  const { content, save } = useContentAdmin();
  const [active, setActive] = useState(SECTIONS[0].key);
  const [dirty, setDirty] = useState(false);
  const [flash, setFlash] = useState(null);
  const [notesPath, setNotesPath] = useState("");
  const timer = useRef(0);

  const say = useCallback((text, tone = "ok") => {
    setFlash({ text, tone });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setFlash(null), 3600);
  }, []);

  // don't lose an unsaved draft by switching section or closing the tab
  const go = (key) => {
    if (key === active) return;
    if (dirty && !window.confirm("You have unsaved changes here. Leave without saving?")) return;
    setDirty(false);
    setActive(key);
  };
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const section = SECTIONS.find((s) => s.key === active);

  return (
    <div className="adm">
      <header className="adm-top">
        <div>
          <h1 className="adm-title">Admin</h1>
          <p className="adm-sub">Changes go live for every visitor as soon as you press <strong>Save</strong>.</p>
        </div>
        <div className="adm-top-tools">
          <Link to="/" className="adm-btn is-ghost">View site</Link>
          <button type="button" className="adm-btn" onClick={onLogout}>Log out</button>
        </div>
      </header>

      {flash ? <p className={`adm-flash is-${flash.tone}`}>{flash.text}</p> : null}

      <div className="adm-body">
        <nav className="adm-nav" aria-label="Admin sections">
          {NAV.map((s) => (
            <button
              key={s.key}
              type="button"
              className="adm-tab"
              aria-current={active === s.key}
              onClick={() => go(s.key)}
            >
              <span>{s.label}</span>
              {active === s.key && dirty ? <span className="adm-dot" title="Unsaved" aria-label="Unsaved" /> : null}
            </button>
          ))}
        </nav>

        {active === "inbox" ? (
          <Inbox onLoggedOut={onLogout} />
        ) : active === "security" ? (
          <Security onLoggedOut={onLogout} />
        ) : active === "notes" ? (
          <section className="adm-panel adm-notes">
            <h2 className="adm-panel-title">Notes library</h2>
            <p className="adm-panel-blurb">
              Folders and files on the Notes page. Visitors can view images, PDFs and videos and download anything.
              Uploads go into the folder you have open.
            </p>
            <NotesBrowser path={notesPath} onPath={setNotesPath} admin />
          </section>
        ) : (
          <SectionEditor
            key={section.key}
            section={section}
            content={content}
            save={save}
            onDirty={setDirty}
            say={say}
          />
        )}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------
   Login - checked by the server
   ------------------------------------------------------------------------- */
const Admin = () => {
  const [state, setState] = useState("checking");   // checking | login | in | offline
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [needCode, setNeedCode] = useState(false);   // the authenticator is on
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/session")
      .then((r) => setState(r.ok ? "in" : r.status === 401 ? "login" : "offline"))
      .catch(() => setState("offline"));
  }, []);

  const login = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, code: needCode ? code : undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.need2fa) setNeedCode(true);
      if (!res.ok) throw new Error(data.error || "Could not log in.");
      setPassword("");
      setCode("");
      setNeedCode(false);
      setState("in");
    } catch (err) {
      setError(err instanceof TypeError ? "Can't reach the server." : err.message);   // a TypeError is a network failure in every browser
    }
  };

  const logout = useCallback(async () => {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
    setState("login");
  }, []);

  if (state === "in") return <AdminPortal onLogout={logout} />;

  return (
    <div className="adm adm-gate-page">
      <form className="adm-gate" onSubmit={login}>
        <h1 className="adm-gate-title">Admin</h1>
        {state === "offline" ? (
          <p className="adm-gate-err">
            Can&apos;t reach the server. Start it with <code>npm run server</code>, then reload.
          </p>
        ) : (
          <>
            <p className="adm-gate-sub">Enter the admin password.</p>
            <input
              className="adm-input"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder="Password"
              aria-label="Password"
              autoComplete="current-password"
              autoFocus
              disabled={state === "checking"}
            />
            {needCode ? (
              <input
                className="adm-input adm-sec-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setError(""); }}
                placeholder="6-digit code from your app"
                aria-label="Authenticator code"
                autoFocus
              />
            ) : null}
            {error ? <p className="adm-gate-err">{error}</p> : null}
            <button type="submit" className="adm-btn is-primary" disabled={state === "checking"}>Log in</button>
          </>
        )}
        <Link to="/" className="adm-gate-back">&larr; Back to the site</Link>
      </form>
    </div>
  );
};

export default Admin;
