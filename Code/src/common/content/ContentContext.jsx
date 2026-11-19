import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import defaults from "./defaults";
import { asJson } from "./api";
import { onPoems, shippedPoems } from "./shippedPoems";

/**
 * ContentContext - the site's editable content.
 *
 *   defaults.js         what ships with the build (the baseline)
 *   server overrides    what the admin saved (server.js -> data/content.json)
 *   content             overrides layered over defaults - what pages read
 *
 * The page renders straight away from defaults.js and swaps in the saved
 * content as soon as it arrives. If server.js isn't running the site simply
 * shows the defaults.
 */
const ContentCtx = createContext(null);

/* the defaults, with the shipped poems once they have been fetched (they
   come with the Literature and admin pages - see shippedPoems.js) */
const baseline = (poems) => (poems ? { ...defaults, poems } : defaults);

/* Overrides replace a section wholesale; a section whose shape doesn't match
   the defaults (e.g. left over from an older version) is ignored. */
const layer = (base, over) => {
  const out = { ...base };
  for (const [key, value] of Object.entries(over || {})) {
    if (!(key in base)) continue;
    const baseIsList = Array.isArray(base[key]);
    if (baseIsList !== Array.isArray(value)) continue;
    out[key] = baseIsList ? value : { ...base[key], ...value };
  }
  return out;
};

export const ContentProvider = ({ children }) => {
  const [overrides, setOverrides] = useState({});
  const [poems, setPoems] = useState(shippedPoems);

  // committed straight away, so a page that waited for the poems (App.jsx)
  // never renders without them
  useEffect(() => {
    if (shippedPoems()) setPoems(shippedPoems());
    return onPoems((p) => flushSync(() => setPoems(p)));
  }, []);

  useEffect(() => {
    let alive = true;
    fetch("/api/content")
      .then((r) => (r.ok ? r.json() : { data: {} }))
      .then(({ data }) => alive && setOverrides(data || {}))
      .catch(() => { /* server offline: keep the defaults */ });
    return () => { alive = false; };
  }, []);

  const content = useMemo(() => layer(baseline(poems), overrides), [poems, overrides]);

  /** Save sections to the server, e.g. save({ games: [...] }).
      Resolves to an error message, or null on success. */
  const save = useCallback(async (sections) => {
    try {
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: sections }),
      });
      const body = await asJson(res, "Could not save.");
      setOverrides(body.data || {});
      return null;
    } catch (err) {
      return err.status ? err.message : "Can't reach the server - is `npm run server` running?";
    }
  }, []);

  const value = useMemo(() => ({ content, save }), [content, save]);
  return <ContentCtx.Provider value={value}>{children}</ContentCtx.Provider>;
};

/** Read the content. Safe outside the provider - falls back to defaults. */
export const useContent = () => useContext(ContentCtx)?.content ?? baseline(shippedPoems());

/** Read + save, for the admin portal. */
export const useContentAdmin = () => {
  const ctx = useContext(ContentCtx);
  if (!ctx) throw new Error("useContentAdmin must be used inside <ContentProvider>");
  return ctx;
};

export default ContentCtx;
