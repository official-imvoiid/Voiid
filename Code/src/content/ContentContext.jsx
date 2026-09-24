import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import defaults, { CONTENT_VERSION } from "./defaults";

/**
 * ContentContext - the site's editable content, and the only way to change it.
 *
 * Shape:
 *   defaults.js  = what ships with the build, never written to
 *   overrides    = what the admin portal saved, in localStorage
 *   content      = overrides merged over defaults, what components read
 *
 * Keeping the two layers separate is what makes "reset this section" a
 * single delete rather than a guess at what the original value was.
 *
 * ---------------------------------------------------------------------------
 * WHERE THE DATA LIVES - read this before relying on it
 *
 * Saves go to localStorage. That means they live in ONE browser on ONE
 * machine. They are not published, not shared with visitors, and they are
 * gone if site data is cleared. This is deliberate: there is no backend in
 * this project to save to.
 *
 * To make an edit real for everyone, use Export in the portal and commit the
 * downloaded JSON over src/content/defaults.js - or point `load` at an API
 * later; the rest of the app does not need to change.
 * ---------------------------------------------------------------------------
 */
const STORAGE_KEY = "voiid.content.v1";

const ContentCtx = createContext(null);

/* A plain deep merge: overrides win, arrays replace rather than concatenate
   (an edited list is the whole list, not an addition to the shipped one). */
const merge = (base, over) => {
  if (Array.isArray(over)) return over;
  if (over && typeof over === "object" && !Array.isArray(base)) {
    const out = { ...base };
    for (const k of Object.keys(over)) {
      out[k] = k in base ? merge(base[k], over[k]) : over[k];
    }
    return out;
  }
  return over === undefined ? base : over;
};

const readStore = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    // a store written by an older shape is ignored rather than half-applied
    if (parsed?.version !== CONTENT_VERSION) return {};
    return parsed.data ?? {};
  } catch {
    // private mode, blocked site data, corrupt JSON - fall back to defaults
    return {};
  }
};

const writeStore = (data) => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: CONTENT_VERSION, savedAt: Date.now(), data })
    );
    return true;
  } catch {
    return false;
  }
};

export const ContentProvider = ({ children }) => {
  const [overrides, setOverrides] = useState(readStore);

  // keep other tabs of the site in step with an edit made in this one
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) setOverrides(readStore());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const content = useMemo(() => merge(defaults, overrides), [overrides]);

  /** Replace one top-level section, e.g. setSection("links", {...}). */
  const setSection = useCallback((key, value) => {
    setOverrides((prev) => {
      const next = { ...prev, [key]: value };
      writeStore(next);
      return next;
    });
  }, []);

  /** Drop the override for one section, returning it to defaults.js. */
  const resetSection = useCallback((key) => {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[key];
      writeStore(next);
      return next;
    });
  }, []);

  /** Drop every override. */
  const resetAll = useCallback(() => {
    setOverrides({});
    writeStore({});
  }, []);

  /** The full merged content, for downloading. */
  const exportAll = useCallback(() => content, [content]);

  /** Load a previously exported file. Returns an error string, or null. */
  const importAll = useCallback((json) => {
    let parsed;
    try {
      parsed = typeof json === "string" ? JSON.parse(json) : json;
    } catch {
      return "That is not valid JSON.";
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return "Expected a JSON object at the top level.";
    }
    // accept both a bare content object and a full export envelope
    const data = parsed.data && parsed.version ? parsed.data : parsed;
    const unknown = Object.keys(data).filter((k) => !(k in defaults));
    if (unknown.length) return `Unknown section(s): ${unknown.join(", ")}`;
    setOverrides(data);
    writeStore(data);
    return null;
  }, []);

  const value = useMemo(
    () => ({
      content,
      overrides,
      editedSections: Object.keys(overrides),
      setSection,
      resetSection,
      resetAll,
      exportAll,
      importAll,
    }),
    [content, overrides, setSection, resetSection, resetAll, exportAll, importAll]
  );

  return <ContentCtx.Provider value={value}>{children}</ContentCtx.Provider>;
};

/** Read the merged content. Safe outside the provider - falls back to defaults. */
export const useContent = () => useContext(ContentCtx)?.content ?? defaults;

/** Read/write access, for the admin portal. */
export const useContentAdmin = () => {
  const ctx = useContext(ContentCtx);
  if (!ctx) throw new Error("useContentAdmin must be used inside <ContentProvider>");
  return ctx;
};

export default ContentCtx;
