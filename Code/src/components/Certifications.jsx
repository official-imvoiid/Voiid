import { useMemo, useState } from "react";
import PageShell from "./PageShell";
import { useContent } from "../content/ContentContext";

/**
 * Certifications - what is earned, what is underway, what is next.
 *
 * ---------------------------------------------------------------------------
 * EDITING THIS LIST
 *
 * Every entry starts at "planned" or "active" on purpose - nothing claims to
 * be earned until you say so. When you pass one, flip its status and paste
 * the credential URL so the card becomes a verifiable link:
 *
 *   { name: "CompTIA Security+", issuer: "CompTIA", status: "done",
 *     date: "Aug 2026", verify: "https://www.credly.com/badges/…" }
 *
 * status: "done" | "active" | "planned"
 * ---------------------------------------------------------------------------
 */

const FILTERS = [
  { key: "all", label: "All" },
  { key: "done", label: "Earned" },
  { key: "active", label: "In progress" },
  { key: "planned", label: "Planned" },
];

const TONE_LABEL = { done: "Earned", active: "In progress", planned: "Planned" };

const Certifications = () => {
  /* the list lives in src/content/defaults.js and is editable at /admin */
  const { certifications: CERTS } = useContent();
  const [filter, setFilter] = useState("all");

  const shown = useMemo(
    () => (filter === "all" ? CERTS : CERTS.filter((c) => c.status === filter)),
    [filter, CERTS]
  );

  const earned = CERTS.filter((c) => c.status === "done").length;
  const active = CERTS.filter((c) => c.status === "active").length;

  return (
    <PageShell
      title="Certifications"
      accent="#F5C451"
      intro={`The paper trail behind the practice. ${earned} earned, ${active} in progress and the
              rest mapped out in order - each one picked because it proves something I actually
              use, not because it looks good in a list.`}
      footer="A certificate is the receipt. The work is the product."
    >
      <div className="pg-tools">
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

        <span className="pg-count">
          {shown.length} {shown.length === 1 ? "certification" : "certifications"}
        </span>
      </div>

      {shown.length === 0 ? (
        <p className="pg-empty">Nothing in this group yet.</p>
      ) : (
        <div className="pg-grid">
          {shown.map((c, i) => {
            const body = (
              <>
                <div className="pg-card-top">
                  <h3 className="pg-card-title">{c.name}</h3>
                  <span className="pg-badge" data-tone={c.status}>
                    {TONE_LABEL[c.status]}
                  </span>
                </div>
                <p className="pg-card-sub">
                  {c.issuer} &middot; {c.date}
                </p>
                <p className="pg-card-sub">{c.blurb}</p>
                <div className="pg-tags">
                  {c.tags.map((t) => (
                    <span key={t} className="pg-tag">{t}</span>
                  ))}
                </div>
                {c.verify ? <span className="pg-open">Verify credential &#8599;</span> : null}
              </>
            );

            return c.verify ? (
              <a
                key={c.name}
                className="pg-card"
                style={{ "--i": i }}
                href={c.verify}
                target="_blank"
                rel="noopener noreferrer"
              >
                {body}
              </a>
            ) : (
              <div key={c.name} className="pg-card" style={{ "--i": i }}>
                {body}
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
};

export default Certifications;
