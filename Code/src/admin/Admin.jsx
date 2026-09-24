import { useCallback, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useContentAdmin } from "../content/ContentContext";
import SECTIONS from "./schema";
import "./Admin.css";

/**
 * Admin - the editing portal for everything in src/content/defaults.js.
 *
 * Generic on purpose: it renders whatever schema.js declares, so new
 * sections need no code here.
 *
 * On the gate: the passphrase below hides the portal from someone who
 * wanders onto /admin. It is NOT security - the whole app is JavaScript the
 * visitor downloaded, so the passphrase is in the bundle and the route can
 * be reached by anyone who looks. Nothing here is secret (it edits your own
 * public site content) and nothing is written to a server, so the exposure
 * is a stranger seeing an editor whose saves only affect their own browser.
 * Real protection needs a backend that checks the credential; there isn't
 * one in this project yet.
 */
const GATE_KEY = "voiid.admin.unlocked";
const PASSPHRASE = "voiid";

/* -------------------------------------------------------------------------
   Field renderers
   ------------------------------------------------------------------------- */
const Field = ({ field, value, onChange }) => {
  const id = `f-${field.name}`;
  const common = {
    id,
    className: "adm-input",
    value: value ?? "",
    onChange: (e) => onChange(e.target.value),
  };

  let control;
  if (field.type === "textarea") {
    control = <textarea {...common} className="adm-input adm-textarea" rows={3} />;
  } else if (field.type === "select") {
    control = (
      <select {...common} className="adm-input adm-select">
        {field.options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    );
  } else if (field.type === "number") {
    control = (
      <input
        {...common}
        type="number"
        min={field.min}
        max={field.max}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
      />
    );
  } else if (field.type === "tags") {
    control = (
      <input
        {...common}
        type="text"
        value={Array.isArray(value) ? value.join(", ") : value ?? ""}
        onChange={(e) =>
          onChange(e.target.value.split(",").map((t) => t.trim()).filter(Boolean))
        }
      />
    );
  } else if (field.type === "color") {
    control = (
      <div className="adm-color">
        <input
          type="color"
          className="adm-swatch"
          value={value || "#F39C12"}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${field.label} colour`}
        />
        <input {...common} type="text" />
      </div>
    );
  } else {
    control = <input {...common} type={field.type === "url" ? "url" : "text"} />;
  }

  return (
    <label className={`adm-field ${field.width === "narrow" ? "is-narrow" : ""}`} htmlFor={id}>
      <span className="adm-label">{field.label}</span>
      {control}
      {field.hint ? <span className="adm-hint">{field.hint}</span> : null}
    </label>
  );
};

/* -------------------------------------------------------------------------
   A single record inside a list section
   ------------------------------------------------------------------------- */
const Row = ({ section, item, index, count, onPatch, onMove, onRemove }) => {
  const [open, setOpen] = useState(false);

  return (
    <li className="adm-row" data-open={open}>
      <div className="adm-row-head">
        <button
          type="button"
          className="adm-row-toggle"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          <span className="adm-caret" aria-hidden="true">{open ? "▾" : "▸"}</span>
          <span className="adm-row-title">{section.title(item)}</span>
        </button>

        <div className="adm-row-tools">
          <button
            type="button" className="adm-icon" title="Move up"
            disabled={index === 0} onClick={() => onMove(index, -1)}
          >↑</button>
          <button
            type="button" className="adm-icon" title="Move down"
            disabled={index === count - 1} onClick={() => onMove(index, 1)}
          >↓</button>
          <button
            type="button" className="adm-icon is-danger" title="Delete"
            onClick={() => onRemove(index)}
          >✕</button>
        </div>
      </div>

      {open ? (
        <div className="adm-grid">
          {section.fields.map((f) => (
            <Field
              key={f.name}
              field={f}
              value={item[f.name]}
              onChange={(v) => onPatch(index, f.name, v)}
            />
          ))}
        </div>
      ) : null}
    </li>
  );
};

/* -------------------------------------------------------------------------
   The portal
   ------------------------------------------------------------------------- */
const AdminPortal = () => {
  const { content, editedSections, setSection, resetSection, resetAll, exportAll, importAll } =
    useContentAdmin();

  const [active, setActive] = useState(SECTIONS[0].key);
  const [flash, setFlash] = useState(null);
  const fileRef = useRef(null);

  const section = useMemo(() => SECTIONS.find((s) => s.key === active), [active]);
  const data = content[active];

  const say = useCallback((text, tone = "ok") => {
    setFlash({ text, tone });
    window.clearTimeout(say._t);
    say._t = window.setTimeout(() => setFlash(null), 3200);
  }, []);

  /* ---- fields section ---- */
  const patchField = (name, value) => setSection(active, { ...data, [name]: value });

  /* ---- list section ---- */
  const patchItem = (index, name, value) => {
    const next = data.map((it, i) => (i === index ? { ...it, [name]: value } : it));
    setSection(active, next);
  };
  const moveItem = (index, delta) => {
    const to = index + delta;
    if (to < 0 || to >= data.length) return;
    const next = [...data];
    [next[index], next[to]] = [next[to], next[index]];
    setSection(active, next);
  };
  const removeItem = (index) => setSection(active, data.filter((_, i) => i !== index));
  const addItem = () => setSection(active, [{ ...section.blank }, ...data]);

  /* ---- export / import ---- */
  const doExport = () => {
    const blob = new Blob([JSON.stringify(exportAll(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "voiid-content.json";
    a.click();
    URL.revokeObjectURL(url);
    say("Downloaded voiid-content.json");
  };

  const doImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const err = importAll(String(reader.result));
      say(err ?? "Content loaded.", err ? "bad" : "ok");
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="adm">
      <header className="adm-top">
        <div>
          <h1 className="adm-title">Content</h1>
          <p className="adm-sub">
            Saved to this browser only &mdash; visitors still see the shipped content.
            Use <strong>Export</strong> and commit the file to publish.
          </p>
        </div>
        <div className="adm-top-tools">
          <button type="button" className="adm-btn" onClick={doExport}>Export</button>
          <button type="button" className="adm-btn" onClick={() => fileRef.current?.click()}>Import</button>
          <input
            ref={fileRef} type="file" accept="application/json,.json"
            onChange={doImport} hidden
          />
          <Link to="/" className="adm-btn is-ghost">View site</Link>
        </div>
      </header>

      {flash ? <p className={`adm-flash is-${flash.tone}`}>{flash.text}</p> : null}

      <div className="adm-body">
        <nav className="adm-nav" aria-label="Content sections">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              type="button"
              className="adm-tab"
              aria-current={active === s.key}
              onClick={() => setActive(s.key)}
            >
              <span>{s.label}</span>
              {editedSections.includes(s.key) ? (
                <span className="adm-dot" title="Edited" aria-label="Edited" />
              ) : null}
            </button>
          ))}

          <button
            type="button"
            className="adm-tab is-reset"
            onClick={() => {
              resetAll();
              say("Every section is back to the shipped content.");
            }}
          >
            Reset everything
          </button>
        </nav>

        <section className="adm-panel">
          <div className="adm-panel-head">
            <div>
              <h2 className="adm-panel-title">{section.label}</h2>
              {section.blurb ? <p className="adm-panel-blurb">{section.blurb}</p> : null}
            </div>
            <div className="adm-panel-tools">
              {section.kind === "list" ? (
                <button type="button" className="adm-btn" onClick={addItem}>+ Add</button>
              ) : null}
              <button
                type="button"
                className="adm-btn is-ghost"
                disabled={!editedSections.includes(active)}
                onClick={() => {
                  resetSection(active);
                  say(`${section.label} reset.`);
                }}
              >
                Reset section
              </button>
            </div>
          </div>

          {section.kind === "fields" ? (
            <div className="adm-grid">
              {section.fields.map((f) => (
                <Field
                  key={f.name}
                  field={f}
                  value={data[f.name]}
                  onChange={(v) => patchField(f.name, v)}
                />
              ))}
            </div>
          ) : (
            <>
              <ul className="adm-list">
                {data.map((item, i) => (
                  <Row
                    key={`${active}-${i}`}
                    section={section}
                    item={item}
                    index={i}
                    count={data.length}
                    onPatch={patchItem}
                    onMove={moveItem}
                    onRemove={removeItem}
                  />
                ))}
              </ul>
              {data.length === 0 ? (
                <p className="adm-empty">Nothing here yet &mdash; use Add.</p>
              ) : null}
            </>
          )}
        </section>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------
   The gate
   ------------------------------------------------------------------------- */
const Admin = () => {
  const [unlocked, setUnlocked] = useState(() => {
    try {
      return sessionStorage.getItem(GATE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [entry, setEntry] = useState("");
  const [wrong, setWrong] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (entry === PASSPHRASE) {
      try { sessionStorage.setItem(GATE_KEY, "1"); } catch { /* private mode */ }
      setUnlocked(true);
    } else {
      setWrong(true);
      setEntry("");
    }
  };

  if (unlocked) return <AdminPortal />;

  return (
    <div className="adm adm-gate-page">
      <form className="adm-gate" onSubmit={submit}>
        <h1 className="adm-gate-title">Content</h1>
        <p className="adm-gate-sub">Enter the passphrase to edit.</p>
        <input
          className="adm-input"
          type="password"
          value={entry}
          onChange={(e) => { setEntry(e.target.value); setWrong(false); }}
          placeholder="Passphrase"
          aria-label="Passphrase"
          autoFocus
        />
        {wrong ? <p className="adm-gate-err">Not that one.</p> : null}
        <button type="submit" className="adm-btn is-primary">Unlock</button>
        <Link to="/" className="adm-gate-back">&larr; Back to the site</Link>
      </form>
    </div>
  );
};

export default Admin;
