import { useEffect, useMemo, useRef, useState } from "react";
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

// A path typed the Windows way (\images\cover.jpg) shows fine in a browser, but the
// server only accepts /images/cover.jpg - and then refuses to save the whole
// section. Such paths are turned round on the way out.
const PATH_TYPES = new Set(["image", "pdf", "certificate", "model", "modelThumb", "url"]);
const tidyPaths = (section, record) => {
  const out = { ...record };
  for (const f of section.fields) {
    const v = out[f.name];
    if (PATH_TYPES.has(f.type) && typeof v === "string" && v.startsWith("\\")) out[f.name] = v.replace(/\\/g, "/");
  }
  return out;
};

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

  const saving = useRef(false);   // a second press while the first is on its way sends nothing
  const doSave = async () => {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    const clean = strip(section, draft);
    const out = { [section.key]: section.kind === "list" ? clean.map((it) => tidyPaths(section, it)) : tidyPaths(section, clean) };

    // renamed categories: move their songs to the new name
    if (section.key === "musicCategories") {
      const renamed = new Map(draft.filter((c) => c._was && c._was !== c.name).map((c) => [c._was, c.name]));
      if (renamed.size) {
        out.songs = content.songs.map((s) => (renamed.has(s.category) ? { ...s, category: renamed.get(s.category) } : s));
      }
    }

    const err = await save(out);
    saving.current = false;
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
    const blank = typeof section.blank === "function" ? section.blank() : section.blank;
    setDraft((d) => [{ ...blank, _key: key }, ...d]);
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
            <button type="button" className="adm-btn" onClick={addItem}>{section.addLabel || "+ Add"}</button>
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
