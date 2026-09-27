import { useEffect, useMemo, useState } from "react";
import { Field, Row } from "./Fields";

/* Edits one section as a draft; nothing reaches the site until Save.
   Saving goes to server.js, so it is live for every visitor at once. */

// List items get two private fields while being edited, both removed on save:
//   _was  the name they were loaded with, so a renamed music category can
//         take its songs along (see save below)
//   _key  a stable React key, so moving or deleting a row keeps the open /
//         closed state with the right item. Kept from `prev` after a save.
const newKey = () => Math.random().toString(36).slice(2);
const load = (section, value, prev = []) =>
  section.kind === "list" ? value.map((it, i) => ({ ...it, _was: it.name, _key: prev[i]?._key || newKey() })) : { ...value };
const strip = (section, draft) =>
  section.kind === "list" ? draft.map(({ _was, _key, ...it }) => it) : draft;

const SectionEditor = ({ section, content, save, onDirty, say }) => {
  const saved = content[section.key];
  const [draft, setDraft] = useState(() => load(section, saved));
  const [busy, setBusy] = useState(false);
  const [openKey, setOpenKey] = useState(null);   // the row that Add just made, shown open

  const savedJson = useMemo(() => JSON.stringify(saved), [saved]);
  const draftJson = useMemo(() => JSON.stringify(strip(section, draft)), [section, draft]);
  const dirty = draftJson !== savedJson;
  useEffect(() => onDirty(dirty), [dirty, onDirty]);

  // the server copy changed (e.g. just saved) - start again from it
  useEffect(() => { setDraft((d) => load(section, saved, Array.isArray(d) ? d : [])); }, [section, saved]);

  const doSave = async () => {
    setBusy(true);
    const out = { [section.key]: strip(section, draft) };

    // renamed categories: move their songs to the new name
    if (section.key === "musicCategories") {
      const renamed = new Map(draft.filter((c) => c._was && c._was !== c.name).map((c) => [c._was, c.name]));
      if (renamed.size) {
        out.songs = content.songs.map((s) => (renamed.has(s.category) ? { ...s, category: renamed.get(s.category) } : s));
      }
    }

    const err = await save(out);
    setBusy(false);
    say(err ?? `${section.label} saved - live on the site now.`, err ? "bad" : "ok");
  };

  /* ---- list editing ---- */
  const patchItem = (i, name, value) => setDraft((d) => d.map((it, j) => (j === i ? { ...it, [name]: value } : it)));
  const moveItem = (i, delta) => setDraft((d) => {
    const to = i + delta;
    if (to < 0 || to >= d.length) return d;
    const next = [...d];
    [next[i], next[to]] = [next[to], next[i]];
    return next;
  });
  const removeItem = (i) => setDraft((d) => d.filter((_, j) => j !== i));
  const addItem = () => {
    const key = newKey();
    setDraft((d) => [{ ...section.blank, _key: key }, ...d]);
    setOpenKey(key);
  };

  return (
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
            disabled={!dirty || busy}
            onClick={() => setDraft(load(section, saved))}
          >
            Discard
          </button>
          <button type="button" className="adm-btn is-primary" disabled={!dirty || busy} onClick={doSave}>
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {section.kind === "fields" ? (
        <div className="adm-grid">
          {section.fields.map((f) => (
            <Field
              key={f.name}
              field={f}
              value={draft[f.name]}
              content={content}
              onChange={(v) => setDraft((d) => ({ ...d, [f.name]: v }))}
            />
          ))}
        </div>
      ) : draft.length === 0 ? (
        <p className="adm-empty">Nothing here yet &mdash; use Add.</p>
      ) : (
        <ul className="adm-list">
          {draft.map((item, i) => (
            <Row
              key={item._key}
              section={section}
              item={item}
              index={i}
              count={draft.length}
              content={content}
              startOpen={item._key === openKey}
              onPatch={patchItem}
              onMove={moveItem}
              onRemove={removeItem}
            />
          ))}
        </ul>
      )}
    </section>
  );
};

export default SectionEditor;
