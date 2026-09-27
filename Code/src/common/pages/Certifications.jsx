import { useCallback, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, ExternalLink, Eye, FileImage, FileText, X } from "lucide-react";
import PageShell from "../components/PageShell";
import { useContent } from "../content/ContentContext";
import useModal from "../hooks/useModal";
import ZoomImage from "./notes/ZoomImage";

/**
 * Certifications - one row per certificate; View opens the certificate
 * itself with its details beside it.
 *
 * The page text and the list live in src/common/content/defaults.js
 * (certificationsPage + certifications) and are editable at /admin.
 *
 *   { name, issuer, status: "done" | "active", date, blurb,
 *     tags: "Coursera, Networking", file: "/certificates/…png|pdf", verify: "https://…" }
 *
 * Looks: common/styles/pages/info-pages.css (cert-*) + the viewer from notes.css
 */

const FILTERS = [
  { key: "all", label: "All" },
  { key: "done", label: "Earned" },
  { key: "active", label: "In progress" },
];

const TONE_LABEL = { done: "Earned", active: "In progress" };

const kindOf = (file = "") => (/\.pdf$/i.test(file) ? "pdf" : "image");
const tagsOf = (c) => (Array.isArray(c.tags) ? c.tags : String(c.tags || "").split(",")).map((t) => t.trim()).filter(Boolean);
const fill = (text, counts) => String(text || "").replace(/\{(\w+)\}/g, (m, k) => (Object.hasOwn(counts, k) ? counts[k] : m));

/* ---- the viewer: the certificate on the left, its details on the right ---- */
const Viewer = ({ items, index, onIndex, onClose }) => {
  const cert = items[index];
  const closeRef = useRef(null);
  const kind = kindOf(cert.file);
  const step = useCallback((d) => onIndex((index + d + items.length) % items.length), [index, items.length, onIndex]);
  const tags = tagsOf(cert);
  useModal({ onClose, onStep: step, focusRef: closeRef });

  const Icon = kind === "pdf" ? FileText : FileImage;
  return (
    <div className="nb cert-viewer-root">
      <div className="nb-viewer" role="dialog" aria-modal="true" aria-label={cert.name}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="nb-viewer-box">
          <div className="nb-viewer-bar">
            <p className="nb-viewer-name" title={cert.name}>
              <Icon aria-hidden="true" /> {cert.name}
              {items.length > 1 ? <span>{index + 1} of {items.length}</span> : null}
            </p>
            <a className="nb-btn is-accent" href={cert.file} download>
              <Download aria-hidden="true" /> <span>Download</span>
            </a>
            <button type="button" ref={closeRef} className="nb-icon-btn" onClick={onClose} aria-label="Close">
              <X aria-hidden="true" />
            </button>
          </div>

          <div className="cert-view">
            <div className={`nb-viewer-stage is-${kind}`}>
              {kind === "pdf"
                ? <iframe key={cert.file} src={cert.file} title={cert.name} />
                : <ZoomImage key={cert.file} src={cert.file} alt={cert.name} />}
              {items.length > 1 ? (
                <>
                  <button type="button" className="nb-nav is-prev" onClick={() => step(-1)} aria-label="Previous certificate">
                    <ChevronLeft aria-hidden="true" />
                  </button>
                  <button type="button" className="nb-nav is-next" onClick={() => step(1)} aria-label="Next certificate">
                    <ChevronRight aria-hidden="true" />
                  </button>
                </>
              ) : null}
            </div>

            <aside className="cert-details">
              <span className="pg-badge" data-tone={cert.status}>{TONE_LABEL[cert.status] || "Earned"}</span>
              <h2 className="cert-details-title">{cert.name}</h2>
              <dl className="cert-facts">
                {cert.issuer ? (<><dt>Issued by</dt><dd>{cert.issuer}</dd></>) : null}
                {cert.date ? (<><dt>Date</dt><dd>{cert.date}</dd></>) : null}
              </dl>
              {cert.blurb ? <p className="cert-details-blurb">{cert.blurb}</p> : null}
              {tags.length ? (
                <div className="pg-tags">
                  {tags.map((t) => <span key={t} className="pg-tag">{t}</span>)}
                </div>
              ) : null}
              {cert.verify ? (
                <a className="cert-btn" href={cert.verify} target="_blank" rel="noopener noreferrer">
                  Verify credential <ExternalLink aria-hidden="true" />
                </a>
              ) : null}
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

const Certifications = () => {
  const { certifications, certificationsPage: page } = useContent();
  const CERTS = useMemo(() => certifications.filter((c) => c.status !== "planned"), [certifications]);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [viewing, setViewing] = useState(-1);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return CERTS.filter((c) => filter === "all" || c.status === filter).filter(
      (c) => !needle || [c.name, c.issuer, c.blurb, ...tagsOf(c)].join(" ").toLowerCase().includes(needle)
    );
  }, [filter, q, CERTS]);

  // the viewer steps through whatever is on screen that has a file
  const viewable = useMemo(() => shown.filter((c) => c.file), [shown]);

  const counts = {
    earned: CERTS.filter((c) => c.status === "done").length,
    active: CERTS.filter((c) => c.status === "active").length,
    total: CERTS.length,
  };

  return (
    <PageShell
      title={page.title}
      accent="#F5C451"
      intro={fill(page.intro, counts)}
      footer={page.footer}
    >
      <div className="pg-tools">
        <input
          type="search"
          className="pg-search"
          placeholder="Search by name, issuer or topic…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search certifications"
        />
        {counts.active ? (
          <div className="pg-chips">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                className="pg-chip"
                aria-pressed={filter === f.key}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        ) : null}

        <span className="pg-count">
          {shown.length} {shown.length === 1 ? "certificate" : "certificates"}
        </span>
      </div>

      {shown.length === 0 ? (
        <p className="pg-empty">Nothing matches that yet.</p>
      ) : (
        <ul className="cert-list">
          {shown.map((c, i) => (
            <li key={`${c.name}-${i}`} className="cert-row" data-status={c.status} style={{ "--i": Math.min(i, 24) }}>
              <div className="cert-row-text">
                <h3 className="cert-row-title">{c.name}</h3>
                <p className="cert-row-meta">
                  {[c.issuer, c.date].filter(Boolean).join(" · ")}
                  {c.status === "active" ? <span className="pg-badge" data-tone="active">In progress</span> : null}
                </p>
              </div>
              {c.file ? (
                <button type="button" className="rg-view cert-view-btn" onClick={() => setViewing(viewable.indexOf(c))}>
                  <Eye aria-hidden="true" /> View
                </button>
              ) : c.verify ? (
                <a className="rg-view cert-view-btn" href={c.verify} target="_blank" rel="noopener noreferrer">
                  Verify <ExternalLink aria-hidden="true" />
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {viewing >= 0 && viewable[viewing] ? (
        <Viewer items={viewable} index={viewing} onIndex={setViewing} onClose={() => setViewing(-1)} />
      ) : null}
    </PageShell>
  );
};

export default Certifications;
