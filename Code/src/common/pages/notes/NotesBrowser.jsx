import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft, ChevronRight, Download, Eye, File, FileArchive, FileImage, FileText,
  FileVideo, Folder, FolderPlus, House, Pencil, Search, Trash2, Upload, X,
} from "lucide-react";
import {
  deleteItem, fetchFolder, fileUrl, formatSize, joinPath, makeFolder, renameItem,
  searchNotes, uploadFile,
} from "../../content/notesApi";
import ZoomImage from "./ZoomImage";
import useModal from "../../hooks/useModal";

// phones and tablets: PDFs drawn page by page (the browser's viewer can't be
// swiped there). Loaded only when needed.
const PdfPages = lazy(() => import("./PdfPages"));
const isTouch = () => window.matchMedia("(pointer: coarse)").matches;

/**
 * NotesBrowser - the notes library, browsed like folders on a computer.
 *
 *   path / onPath   which folder is open (the page keeps it in the address)
 *   admin           adds New folder, Upload, Rename and Delete
 *
 * Images, PDFs and videos open in the viewer; everything can be downloaded.
 * Looks: common/styles/pages/notes.css
 */

const ICONS = { image: FileImage, pdf: FileText, video: FileVideo };
const ARCHIVES = new Set(["zip", "rar", "7z"]);
const extOf = (name) => (name.includes(".") ? name.split(".").pop().toLowerCase() : "");
const FileIcon = ({ file }) => {
  const Icon = ICONS[file.view] || (ARCHIVES.has(extOf(file.name)) ? FileArchive : File);
  return <Icon className={`nb-file-icon is-${file.view || "other"}`} aria-hidden="true" />;
};

/* ---- the viewer: image, PDF or video, with ← → through the folder ---- */
const Viewer = ({ items, index, onIndex, onClose }) => {
  const file = items[index];
  const closeRef = useRef(null);
  const step = useCallback((d) => onIndex((index + d + items.length) % items.length), [index, items.length, onIndex]);
  useModal({ onClose, onStep: step, focusRef: closeRef });

  const src = fileUrl(file.path);
  return (
    <div className="nb-viewer" role="dialog" aria-modal="true" aria-label={file.name}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="nb-viewer-box">
        <div className="nb-viewer-bar">
          <p className="nb-viewer-name" title={file.name}>
            <FileIcon file={file} /> {file.name}
            <span>{formatSize(file.size)}{items.length > 1 ? ` · ${index + 1} of ${items.length}` : ""}</span>
          </p>
          <a className="nb-btn is-accent" href={fileUrl(file.path, true)} download>
            <Download aria-hidden="true" /> Download
          </a>
          <button type="button" ref={closeRef} className="nb-icon-btn" onClick={onClose} aria-label="Close">
            <X aria-hidden="true" />
          </button>
        </div>
        <div className={`nb-viewer-stage is-${file.view}`}>
          {file.view === "image" ? <ZoomImage key={src} src={src} alt={file.name} /> : null}
          {file.view === "pdf" && isTouch() ? (
            <Suspense fallback={null}><PdfPages key={src} src={src} /></Suspense>
          ) : null}
          {file.view === "pdf" && !isTouch() ? <iframe key={src} src={src} title={file.name} /> : null}
          {file.view === "video" ? <video key={src} src={src} controls autoPlay playsInline /> : null}
          {items.length > 1 ? (
            <>
              <button type="button" className="nb-nav is-prev" onClick={() => step(-1)} aria-label="Previous file">
                <ChevronLeft aria-hidden="true" />
              </button>
              <button type="button" className="nb-nav is-next" onClick={() => step(1)} aria-label="Next file">
                <ChevronRight aria-hidden="true" />
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const NotesBrowser = ({ path, onPath, admin = false }) => {
  const [data, setData] = useState({ status: "loading", folders: [], files: [], error: "" });
  const [q, setQ] = useState("");
  const [results, setResults] = useState(null);      // search results, or null when not searching
  const [viewing, setViewing] = useState(-1);
  const [uploads, setUploads] = useState([]);        // [{ name, progress, error }]
  const [notice, setNotice] = useState("");
  const fileInput = useRef(null);
  const loadId = useRef(0);   // a slow answer to an earlier folder must not replace a newer one

  const load = useCallback(async () => {
    const id = ++loadId.current;
    setData((d) => ({ ...d, status: d.folders.length || d.files.length ? "ready" : "loading" }));
    try {
      const body = await fetchFolder(path);
      if (id === loadId.current) setData({ status: "ready", folders: body.folders, files: body.files, error: "" });
    } catch (err) {
      if (id === loadId.current) setData({ status: "error", folders: [], files: [], error: err.message });
    }
  }, [path]);

  useEffect(() => { load(); setViewing(-1); }, [load]);

  // search the whole library as you type (after a short pause)
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setResults(null); return undefined; }
    let stale = false;
    const t = window.setTimeout(() => {
      searchNotes(term).then((r) => !stale && setResults(r)).catch(() => !stale && setResults([]));
    }, 250);
    return () => { stale = true; window.clearTimeout(t); };
  }, [q]);

  const crumbs = useMemo(() => (path ? path.split("/") : []), [path]);

  // what's on screen: the folder, or the search results
  const folders = results
    ? results.filter((r) => r.folder).map((r) => ({ name: r.name, path: r.path, where: r.path }))
    : data.folders.map((f) => ({ ...f, path: joinPath(path, f.name) }));
  const files = results
    ? results.filter((r) => !r.folder).map((r) => ({ ...r, where: r.path.split("/").slice(0, -1).join(" / ") }))
    : data.files.map((f) => ({ ...f, path: joinPath(path, f.name) }));
  const viewable = files.filter((f) => f.view);
  const viewIndex = new Map(viewable.map((f, i) => [f.path, i]));   // file -> its place in the viewer

  const open = (folderPath) => { setQ(""); onPath(folderPath); };

  /* ---- admin actions ---- */
  const act = async (fn, done) => {
    setNotice("");
    try { await fn(); if (done) setNotice(done); await load(); } catch (err) { setNotice(err.message); }
  };
  const newFolder = () => {
    const name = window.prompt("New folder name:");
    if (name) act(() => makeFolder(path, name.trim()), `Made "${name.trim()}".`);
  };
  const rename = (item) => {
    const name = window.prompt("New name:", item.name);
    if (name && name.trim() !== item.name) act(() => renameItem(item.path, name.trim()), "Renamed.");
  };
  const remove = (item, isFolder) => {
    const what = isFolder ? `the folder "${item.name}" and everything inside it` : `"${item.name}"`;
    if (window.confirm(`Delete ${what}? This can't be undone.`)) act(() => deleteItem(item.path), "Deleted.");
  };
  const upload = async (list) => {
    const picked = [...list];
    if (!picked.length) return;
    setNotice("");
    setUploads(picked.map((f) => ({ name: f.name, progress: 0, error: "" })));
    for (let i = 0; i < picked.length; i++) {
      try {
        await uploadFile(path, picked[i], (p) =>
          setUploads((u) => u.map((x, k) => (k === i ? { ...x, progress: p } : x))));
        setUploads((u) => u.map((x, k) => (k === i ? { ...x, progress: 1 } : x)));
      } catch (err) {
        setUploads((u) => u.map((x, k) => (k === i ? { ...x, error: err.message } : x)));
      }
    }
    await load();
    setUploads((u) => u.filter((x) => x.error));      // keep only the failures on screen
  };

  const empty = data.status === "ready" && !folders.length && !files.length;

  return (
    <div className="nb">
      {/* where you are, and search */}
      <div className="nb-top">
        <nav className="nb-crumbs" aria-label="Folder">
          <button type="button" className="nb-crumb" onClick={() => open("")} aria-label="All notes">
            <House aria-hidden="true" /> Notes
          </button>
          {crumbs.map((c, i) => (
            <span key={i} className="nb-crumb-step">
              <ChevronRight aria-hidden="true" />
              <button
                type="button"
                className="nb-crumb"
                onClick={() => open(crumbs.slice(0, i + 1).join("/"))}
                aria-current={i === crumbs.length - 1 ? "page" : undefined}
              >
                {c}
              </button>
            </span>
          ))}
        </nav>
        <label className="nb-search">
          <Search aria-hidden="true" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search all notes…" />
        </label>
      </div>

      {admin ? (
        <div className="nb-admin-bar">
          <button type="button" className="nb-btn" onClick={newFolder}><FolderPlus aria-hidden="true" /> New folder</button>
          <button type="button" className="nb-btn is-accent" onClick={() => fileInput.current?.click()}>
            <Upload aria-hidden="true" /> Upload files
          </button>
          <input ref={fileInput} type="file" multiple hidden onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
          <span className="nb-admin-where">into <strong>{path || "Notes"}</strong></span>
          {notice ? <span className="nb-notice">{notice}</span> : null}
        </div>
      ) : null}

      {uploads.length ? (
        <ul className="nb-uploads">
          {uploads.map((u, i) => (
            <li key={i} className={u.error ? "is-error" : ""}>
              <span className="nb-upload-name">{u.name}</span>
              {u.error ? <span>{u.error}</span> : (
                <span className="nb-progress"><span style={{ width: `${Math.round(u.progress * 100)}%` }} /></span>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      {data.status === "loading" ? <p className="pg-empty">Opening the folder…</p> : null}
      {data.status === "error" ? <p className="pg-empty">{data.error}</p> : null}
      {results && !folders.length && !files.length ? <p className="pg-empty">Nothing called “{q.trim()}”.</p> : null}
      {!results && empty ? <p className="pg-empty">This folder is empty.</p> : null}

      {/* folders */}
      {folders.length ? (
        <ul className="nb-folders">
          {folders.map((f) => (
            <li key={f.path} className="nb-folder">
              <button type="button" className="nb-folder-open" onClick={() => open(f.path)}>
                <Folder className="nb-folder-icon" aria-hidden="true" />
                <span className="nb-folder-name">{f.name}</span>
                <span className="nb-folder-meta">
                  {results ? f.where.split("/").slice(0, -1).join(" / ") || "Notes" : `${f.items} item${f.items === 1 ? "" : "s"}`}
                </span>
              </button>
              {admin && !results ? (
                <span className="nb-row-admin">
                  <button type="button" className="nb-icon-btn" onClick={() => rename(f)} aria-label={`Rename ${f.name}`}><Pencil aria-hidden="true" /></button>
                  <button type="button" className="nb-icon-btn is-danger" onClick={() => remove(f, true)} aria-label={`Delete ${f.name}`}><Trash2 aria-hidden="true" /></button>
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {/* files */}
      {files.length ? (
        <ul className="nb-files">
          {files.map((f) => (
            <li key={f.path} className="nb-file">
              <button
                type="button"
                className="nb-file-main"
                onClick={() => (f.view ? setViewing(viewIndex.get(f.path)) : window.location.assign(fileUrl(f.path, true)))}
                title={f.view ? "View" : "Download"}
              >
                <FileIcon file={f} />
                <span className="nb-file-name">{f.name}</span>
                <span className="nb-file-meta">{results ? f.where || "Notes" : extOf(f.name).toUpperCase()}</span>
                <span className="nb-file-size">{formatSize(f.size)}</span>
              </button>
              <span className="nb-file-actions">
                {f.view ? (
                  <button type="button" className="nb-btn is-small" onClick={() => setViewing(viewIndex.get(f.path))}>
                    <Eye aria-hidden="true" /> View
                  </button>
                ) : null}
                <a className="nb-btn is-small is-accent" href={fileUrl(f.path, true)} download>
                  <Download aria-hidden="true" /> Download
                </a>
                {admin && !results ? (
                  <>
                    <button type="button" className="nb-icon-btn" onClick={() => rename(f)} aria-label={`Rename ${f.name}`}><Pencil aria-hidden="true" /></button>
                    <button type="button" className="nb-icon-btn is-danger" onClick={() => remove(f, false)} aria-label={`Delete ${f.name}`}><Trash2 aria-hidden="true" /></button>
                  </>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {viewing >= 0 && viewable[viewing] ? (
        <Viewer items={viewable} index={viewing} onIndex={setViewing} onClose={() => setViewing(-1)} />
      ) : null}
    </div>
  );
};

export default NotesBrowser;
