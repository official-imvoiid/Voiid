import PageShell from "./PageShell";
import { useContent } from "../content/ContentContext";

/**
 * Roadmap - where this is going, stage by stage.
 *
 * ---------------------------------------------------------------------------
 * EDITING
 *
 * One object per stage, in order. `status` drives the colour of the dot and
 * the badge:
 *
 *   "done"    - finished, dot filled
 *   "active"  - happening now, dot pulses
 *   "planned" - ahead, dot hollow
 *
 * Move a stage from "active" to "done" as you clear it and promote the next
 * one. The rail, the numbering and the layout all follow automatically.
 * ---------------------------------------------------------------------------
 */

const TONE_LABEL = { done: "Done", active: "In progress", planned: "Ahead" };

const Roadmap = () => {
  /* stages live in src/content/defaults.js and are editable at /admin */
  const { roadmap: STAGES } = useContent();
  const done = STAGES.filter((s) => s.status === "done").length;
  const pct = Math.round((done / STAGES.length) * 100);

  return (
    <PageShell
      title="Roadmap"
      accent="#A78BFA"
      intro={`The plan, in the order it actually happens - what is cleared, what I am in the middle
              of, and what comes after. It gets edited as things change, because a roadmap that
              never moves was never real.`}
      footer="The plan is not the point. Moving through it is."
    >
      <div className="rm-progress" aria-label={`${pct} percent complete`}>
        <div className="rm-progress-bar">
          <span className="rm-progress-fill" style={{ "--pct": `${pct}%` }} />
        </div>
        <span className="pg-count">
          {done} of {STAGES.length} stages cleared
        </span>
      </div>

      <ol className="rm-line">
        {STAGES.map((s, i) => (
          <li className="rm-stage" data-status={s.status} style={{ "--i": i }} key={s.title}>
            <span className="rm-dot" aria-hidden="true" />

            <div className="rm-body">
              <div className="pg-card-top">
                <span className="rm-when">{s.when}</span>
                <span className="pg-badge" data-tone={s.status}>
                  {TONE_LABEL[s.status]}
                </span>
              </div>

              <h3 className="rm-title">{s.title}</h3>
              <p className="pg-card-sub">{s.blurb}</p>

              <ul className="rm-items">
                {s.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </PageShell>
  );
};

export default Roadmap;
