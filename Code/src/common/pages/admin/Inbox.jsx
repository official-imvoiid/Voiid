import { useCallback, useEffect, useState } from "react";
import { asJson } from "../../content/api";

/**
 * Inbox - messages sent through the contact form. They are stored on
 * server.js, encrypted, and only readable while logged in to the admin.
 */
const api = (url, options = {}) =>
  fetch(url, { ...options, headers: options.body ? { "Content-Type": "application/json" } : undefined })
    .then((r) => asJson(r, "Server error"));

const when = (iso) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

const Inbox = ({ onLoggedOut }) => {
  const [state, setState] = useState("loading");   // loading | ready | offline
  const [messages, setMessages] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const { messages: list } = await api("/api/admin/messages");
      setMessages(list);
      setState("ready");
    } catch (err) {
      if (err.status === 401) onLoggedOut();
      else {
        setError(err.status ? err.message : "Can't reach server.js - is `npm run server` running?");
        setState("offline");
      }
    }
  }, [onLoggedOut]);

  useEffect(() => { load(); }, [load]);

  const setRead = async (id, read) => {
    setMessages((all) => all.map((m) => (m.id === id ? { ...m, read } : m)));
    await api(`/api/admin/messages/${id}`, { method: "PATCH", body: JSON.stringify({ read }) }).catch(load);
  };

  const open = (m) => {
    setOpenId(openId === m.id ? null : m.id);
    if (!m.read) setRead(m.id, true);
  };

  const remove = async (m) => {
    if (!window.confirm(`Delete the message from ${m.name}? This can't be undone.`)) return;
    setMessages((all) => all.filter((x) => x.id !== m.id));
    await api(`/api/admin/messages/${m.id}`, { method: "DELETE" }).catch(load);
  };

  const unread = messages.filter((m) => !m.read).length;

  return (
    <section className="adm-panel">
      <div className="adm-panel-head">
        <div>
          <h2 className="adm-panel-title">Inbox</h2>
          <p className="adm-panel-blurb">
            Messages from the contact form, stored encrypted on your server.
          </p>
        </div>
        {state === "ready" ? (
          <div className="adm-panel-tools">
            <button type="button" className="adm-btn" onClick={load}>Refresh</button>
          </div>
        ) : null}
      </div>

      {state === "loading" ? <p className="adm-empty">Loading…</p> : null}

      {state === "offline" ? (
        <div className="inbox-note">
          <p>{error}</p>
          <button type="button" className="adm-btn" onClick={() => { setState("loading"); load(); }}>
            Try again
          </button>
        </div>
      ) : null}


      {state === "ready" ? (
        <>
          <p className="inbox-count">
            {messages.length} message{messages.length === 1 ? "" : "s"}
            {unread ? ` · ${unread} unread` : ""}
          </p>

          {messages.length === 0 ? (
            <p className="adm-empty">No messages yet.</p>
          ) : (
            <ul className="adm-list">
              {messages.map((m) => (
                <li key={m.id} className={`adm-row inbox-row${m.read ? "" : " is-unread"}`} data-open={openId === m.id}>
                  <div className="adm-row-head">
                    <button type="button" className="adm-row-toggle" onClick={() => open(m)}>
                      <span className="adm-caret" aria-hidden="true">▸</span>
                      <span className="adm-row-title">
                        <strong>{m.subject}</strong>
                        <span className="inbox-from"> — {m.name}</span>
                      </span>
                    </button>
                    <span className="inbox-date">{when(m.receivedAt)}</span>
                    <div className="adm-row-tools">
                      <button
                        type="button"
                        className="adm-icon"
                        title={m.read ? "Mark as unread" : "Mark as read"}
                        onClick={() => setRead(m.id, !m.read)}
                      >
                        {m.read ? "●" : "○"}
                      </button>
                      <button
                        type="button"
                        className="adm-icon is-danger"
                        title="Delete"
                        onClick={() => remove(m)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {openId === m.id ? (
                    <div className="inbox-body">
                      <p className="inbox-meta">
                        From <strong>{m.name}</strong> &lt;{m.email}&gt;
                      </p>
                      <p className="inbox-text">{m.message}</p>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </section>
  );
};

export default Inbox;
