import { useMemo, useState } from "react";
import PageShell from "./PageShell";
import { useContent } from "../content/ContentContext";

/**
 * My Study Notes - the B.Tech notes shelf.
 *
 * ---------------------------------------------------------------------------
 * ADDING A NOTE
 *
 * Drop the PDF into  Code/public/notes/  then point `file` at it:
 *
 *   { sem: 4, subject: "Operating Systems", title: "Deadlocks & Scheduling",
 *     tags: ["Deadlock", "RR", "SJF"], file: "/notes/os-deadlocks.pdf" }
 *
 * Leave `file` out (or null) and the card still lists the topic but shows
 * "coming soon" instead of a download link - so the shelf can be complete
 * before every PDF is written.
 * ---------------------------------------------------------------------------
 */

const Notes = () => {
  /* the shelf lives in src/content/defaults.js and is editable at /admin */
  const { notes: NOTES } = useContent();
  const SEMS = useMemo(
    () => [...new Set(NOTES.map((n) => n.sem))].sort((a, b) => a - b),
    [NOTES]
  );
  const [sem, setSem] = useState("all");
  const [q, setQ] = useState("");

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return NOTES.filter((n) => {
      if (sem !== "all" && n.sem !== sem) return false;
      if (!term) return true;
      return (
        n.title.toLowerCase().includes(term) ||
        n.subject.toLowerCase().includes(term) ||
        n.tags.some((t) => t.toLowerCase().includes(term))
      );
    });
  }, [sem, q, NOTES]);

  const ready = NOTES.filter((n) => n.file).length;

  return (
    <PageShell
      title="My Study Notes"
      accent="#7CF2D0"
      intro={`Everything I have written down across the B.Tech course, semester by semester -
              condensed theory, formula sheets and lab work. Search a topic or pick a semester.
              ${ready} of ${NOTES.length} are uploaded so far; the rest are on their way.`}
      footer="Notes are written to be re-read, not just submitted."
    >
      <div className="pg-tools">
        <input
          className="pg-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search a topic, subject or tag…"
          aria-label="Search notes"
        />

        <div className="pg-chips">
          <button
            type="button"
            className="pg-chip"
            aria-pressed={sem === "all"}
            onClick={() => setSem("all")}
          >
            All
          </button>
          {SEMS.map((s) => (
            <button
              key={s}
              type="button"
              className="pg-chip"
              aria-pressed={sem === s}
              onClick={() => setSem(s)}
            >
              Sem {s}
            </button>
          ))}
        </div>

        <span className="pg-count">
          {shown.length} {shown.length === 1 ? "note" : "notes"}
        </span>
      </div>

      {shown.length === 0 ? (
        <p className="pg-empty">Nothing matches that yet &mdash; try a broader word.</p>
      ) : (
        <div className="pg-grid">
          {shown.map((n, i) => {
            const body = (
              <>
                <div className="pg-card-top">
                  <h3 className="pg-card-title">{n.title}</h3>
                  <span className="pg-badge" data-tone={n.file ? "done" : "planned"}>
                    Sem {n.sem}
                  </span>
                </div>
                <p className="pg-card-sub">{n.subject}</p>
                <div className="pg-tags">
                  {n.tags.map((t) => (
                    <span key={t} className="pg-tag">{t}</span>
                  ))}
                </div>
                <span className="pg-open">
                  {n.file ? "Open PDF ↗" : "Write-up coming soon"}
                </span>
              </>
            );

            const key = `${n.sem}-${n.subject}-${n.title}`;

            return n.file ? (
              <a
                key={key}
                className="pg-card"
                style={{ "--i": i }}
                href={n.file}
                target="_blank"
                rel="noopener noreferrer"
              >
                {body}
              </a>
            ) : (
              <div key={key} className="pg-card" style={{ "--i": i }}>
                {body}
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
};

export default Notes;
