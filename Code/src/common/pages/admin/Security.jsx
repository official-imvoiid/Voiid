import { useCallback, useEffect, useState } from "react";
import { asJson, postJson } from "../../content/api";

/**
 * Security - the authenticator app (Google Authenticator, Authy, Microsoft
 * Authenticator...). Off by default. Turned on, logging in to the admin
 * needs the password AND the 6-digit code from your phone.
 *
 * Lost the phone? On the server, delete data/security.enc and the password
 * alone works again. (A file that is there but can't be read - wrong
 * MESSAGES_KEY - blocks every login instead; see server.js.)
 */

const post = (url, body) => postJson(url, body, "Something went wrong.");

const Security = ({ onLoggedOut }) => {
  const [enabled, setEnabled] = useState(null);     // null while checking, or when the check failed
  const [setup, setSetup] = useState(null);         // { qr, secret } while scanning
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState({ text: "", tone: "" });
  const [busy, setBusy] = useState(false);

  // a failed check (expired login, server trouble) must not read as "off"
  const fail = useCallback((err) => {
    if (err.status === 401) onLoggedOut?.();
    else setMsg({ text: err.status ? err.message : "Can't reach the server.", tone: "err" });
  }, [onLoggedOut]);

  useEffect(() => {
    fetch("/api/admin/2fa").then((r) => asJson(r, "Something went wrong.")).then((d) => setEnabled(Boolean(d.enabled))).catch(fail);
  }, [fail]);

  const run = async (fn) => {
    setBusy(true);
    setMsg({ text: "", tone: "" });
    try { await fn(); } catch (err) { fail(err); }
    setBusy(false);
  };

  const start = () => run(async () => { setSetup(await post("/api/admin/2fa/setup")); setCode(""); });
  const confirm = (e) => {
    e.preventDefault();
    run(async () => {
      await post("/api/admin/2fa/enable", { code });
      setEnabled(true);
      setSetup(null);
      setCode("");
      setMsg({ text: "Authenticator is on. Next time you log in, it will ask for a code.", tone: "ok" });
    });
  };
  const turnOff = (e) => {
    e.preventDefault();
    run(async () => {
      await post("/api/admin/2fa/disable", { code });
      setEnabled(false);
      setCode("");
      setMsg({ text: "Authenticator is off. The password alone logs you in.", tone: "ok" });
    });
  };

  return (
    <section className="adm-panel adm-security">
      <h2 className="adm-panel-title">Security</h2>
      <p className="adm-panel-blurb">
        Add an authenticator app (Google Authenticator, Authy, Microsoft Authenticator…) so logging in needs your
        password <strong>and</strong> a 6-digit code from your phone. Optional - you can switch it off again with a code.
      </p>

      <div className="adm-sec-status">
        <span className={`adm-sec-dot ${enabled ? "is-on" : ""}`} />
        {enabled === null ? (msg.text ? "Authenticator: unknown" : "Checking…") : enabled ? "Authenticator: on" : "Authenticator: off"}
      </div>

      {enabled === false && !setup ? (
        <button type="button" className="adm-btn is-primary" onClick={start} disabled={busy}>
          Set up Google Authenticator
        </button>
      ) : null}

      {setup ? (
        <form className="adm-sec-setup" onSubmit={confirm}>
          <ol>
            <li>Open Google Authenticator on your phone and tap <strong>+</strong> → <strong>Scan a QR code</strong>.</li>
            <li>Scan this code (or type the key under it).</li>
            <li>Type the 6-digit code the app shows, then press <strong>Turn on</strong>.</li>
          </ol>
          <img src={setup.qr} alt="QR code for your authenticator app" className="adm-sec-qr" />
          <code className="adm-sec-key">{setup.secret.match(/.{1,4}/g).join(" ")}</code>
          <div className="adm-sec-row">
            <input className="adm-input adm-sec-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
              placeholder="123456" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
            <button type="submit" className="adm-btn is-primary" disabled={busy || code.length !== 6}>Turn on</button>
            <button type="button" className="adm-btn is-ghost" onClick={() => setSetup(null)}>Cancel</button>
          </div>
        </form>
      ) : null}

      {enabled ? (
        <form className="adm-sec-row" onSubmit={turnOff}>
          <input className="adm-input adm-sec-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
            placeholder="Code to turn off" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
          <button type="submit" className="adm-btn" disabled={busy || code.length !== 6}>Turn off</button>
        </form>
      ) : null}

      {msg.text ? <p className={msg.tone === "err" ? "adm-gate-err" : "adm-sec-ok"}>{msg.text}</p> : null}
      <p className="adm-sec-note">Lost your phone? On the server, delete <code>data/security.enc</code> - then the password alone works again.</p>
    </section>
  );
};

export default Security;
