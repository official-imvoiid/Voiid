import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import BackHome from "../components/BackHome";
import roadmapGuides, { topicCount } from "../content/roadmapGuides";

/**
 * RoadmapGraph - one topic roadmap drawn as a graph, at /roadmap/:slug.
 *
 * A spine runs down the middle. Each section prints its label on the spine,
 * puts its main node(s) on it, and hangs its topics off both sides with
 * dotted curves. Everything is laid out here from the plain lists in
 * content/roadmapGuides.js, so the data never carries coordinates.
 *
 * Clicking a topic ticks it off; ticks are kept per guide in localStorage.
 */

/* ---- canvas geometry (SVG units; the SVG scales to its box) ---- */
const W = 1000;
const CX = W / 2;
const COL_W = 250;               // topic column width
const LEFT_X = 16;
const RIGHT_X = W - 16 - COL_W;
const MAIN_W = 250;
const LINE_H = 15;               // one wrapped line of label text
const PAD_Y = 8;                 // box padding above + below the text
const GAP = 7;                   // between stacked boxes
const LABEL_H = 44;              // room for a section label on the spine
const SECTION_GAP = 34;
const TOP = 40;

/* rough width of a character at the label sizes below, used for wrapping */
const TOPIC_CHARS = 34;
const MAIN_CHARS = 30;

const wrap = (text, max) => {
  const lines = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
};

const boxH = (lines) => lines.length * LINE_H + PAD_Y * 2;

/* stack a list of labels from `top`, returning boxes and the total height */
const stack = (labels, x, width, chars, kind, sectionIdx, top) => {
  const boxes = [];
  let y = top;
  labels.forEach((text, i) => {
    const lines = wrap(text, chars);
    const h = boxH(lines);
    boxes.push({ id: `${sectionIdx}-${kind}-${i}`, text, lines, x, y, w: width, h, kind });
    y += h + GAP;
  });
  return { boxes, height: labels.length ? y - top - GAP : 0 };
};

const measure = (labels, chars) =>
  labels.length
    ? labels.reduce((sum, t) => sum + boxH(wrap(t, chars)), 0) + GAP * (labels.length - 1)
    : 0;

const layout = (guide) => {
  const nodes = [];
  const links = [];
  const labels = [];
  let y = TOP;

  guide.sections.forEach((s, si) => {
    labels.push({ text: s.label, y: y + LABEL_H / 2 });
    y += LABEL_H;

    const leftH = measure(s.left, TOPIC_CHARS);
    const rightH = measure(s.right, TOPIC_CHARS);
    const mainH = measure(s.main, MAIN_CHARS);
    const block = Math.max(leftH, rightH, mainH);

    const main = stack(s.main, CX - MAIN_W / 2, MAIN_W, MAIN_CHARS, "main", si, y + (block - mainH) / 2);
    const left = stack(s.left, LEFT_X, COL_W, TOPIC_CHARS, "left", si, y + (block - leftH) / 2);
    const right = stack(s.right, RIGHT_X, COL_W, TOPIC_CHARS, "right", si, y + (block - rightH) / 2);

    /* every side topic hangs off the middle of the main group */
    const anchorY = y + block / 2;
    const fromL = CX - MAIN_W / 2;
    const fromR = CX + MAIN_W / 2;
    left.boxes.forEach((b) => {
      const tx = b.x + b.w;
      const ty = b.y + b.h / 2;
      const mx = (fromL + tx) / 2;
      links.push({ id: b.id, d: `M${fromL} ${anchorY} C${mx} ${anchorY} ${mx} ${ty} ${tx} ${ty}` });
    });
    right.boxes.forEach((b) => {
      const ty = b.y + b.h / 2;
      const mx = (fromR + b.x) / 2;
      links.push({ id: b.id, d: `M${fromR} ${anchorY} C${mx} ${anchorY} ${mx} ${ty} ${b.x} ${ty}` });
    });

    nodes.push(...main.boxes, ...left.boxes, ...right.boxes);
    y += block + SECTION_GAP;
  });

  return { nodes, links, labels, height: y + 10 };
};

const storageKey = (slug) => `roadmap-done:${slug}`;

const loadDone = (slug) => {
  try {
    return new Set(JSON.parse(localStorage.getItem(storageKey(slug)) || "[]"));
  } catch {
    return new Set();
  }
};

const Graph = ({ guide }) => {
  const { nodes, links, labels, height } = useMemo(() => layout(guide), [guide]);
  const [done, setDone] = useState(() => loadDone(guide.slug));

  const toggle = (text) => {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(text)) next.delete(text);
      else next.add(text);
      try {
        localStorage.setItem(storageKey(guide.slug), JSON.stringify([...next]));
      } catch {
        /* private mode - ticks just will not persist */
      }
      return next;
    });
  };

  const onKey = (e, text) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle(text);
    }
  };

  const total = topicCount(guide);
  const ticked = nodes.filter((n) => done.has(n.text)).length;

  return (
    <>
      <div className="rg-status">
        <div className="rm-progress-bar">
          <span className="rm-progress-fill" style={{ "--pct": `${(ticked / total) * 100}%` }} />
        </div>
        <span className="pg-count">
          {ticked} of {total} topics done
        </span>
        {ticked > 0 ? (
          <button
            type="button"
            className="pg-chip"
            onClick={() => {
              setDone(new Set());
              try { localStorage.removeItem(storageKey(guide.slug)); } catch { /* ignore */ }
            }}
          >
            Reset
          </button>
        ) : null}
      </div>
      <p className="rg-hint">Tap a topic to tick it off. Scroll sideways on small screens.</p>

      <div className="rg-scroll">
        <svg
          className="rg-svg"
          viewBox={`0 0 ${W} ${height}`}
          role="img"
          aria-label={`${guide.title} roadmap`}
        >
          {/* the spine: a dotted lead-in, then solid to the end */}
          <line className="rg-spine rg-spine-lead" x1={CX} y1={0} x2={CX} y2={TOP} />
          <line className="rg-spine" x1={CX} y1={TOP} x2={CX} y2={height - 30} />

          {links.map((l) => (
            <path key={l.id} className="rg-link" d={l.d} />
          ))}

          {labels.map((l, i) => (
            <g key={`${i}-${l.text}`} className="rg-label">
              <rect x={CX - 110} y={l.y - 11} width={220} height={22} />
              <text x={CX} y={l.y}>{l.text}</text>
            </g>
          ))}

          {nodes.map((n) => {
            const isDone = done.has(n.text);
            return (
              <g
                key={n.id}
                className="rg-node"
                data-kind={n.kind === "main" ? "main" : "topic"}
                data-done={isDone}
                role="button"
                tabIndex={0}
                aria-pressed={isDone}
                aria-label={n.text}
                onClick={() => toggle(n.text)}
                onKeyDown={(e) => onKey(e, n.text)}
              >
                <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={5} />
                <text x={n.x + n.w / 2} y={n.y + PAD_Y + LINE_H / 2}>
                  {n.lines.map((line, i) => (
                    <tspan key={i} x={n.x + n.w / 2} dy={i === 0 ? 0 : LINE_H}>
                      {line}
                    </tspan>
                  ))}
                </text>
                {isDone ? (
                  <circle className="rg-tick" cx={n.x + n.w - 1} cy={n.y + 1} r={6} />
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>
    </>
  );
};

const RoadmapGraph = () => {
  const { slug } = useParams();
  const guide = roadmapGuides.find((g) => g.slug === slug);
  const others = roadmapGuides.filter((g) => g.slug !== slug);

  return (
    <div className="pg rg rg-page" style={{ "--pg-accent": "#D4CC2E" }}>
      <div className="pg-shell">
        <div className="pg-head">
          <h1 className="pg-title">{guide ? guide.title : "Roadmap not found"}</h1>
          <BackHome to="/roadmap" label="<< Back to roadmaps" />
        </div>

        {guide ? (
          <>
            <p className="pg-intro">{guide.blurb}</p>

            <div className="rg-related">
              <span className="rg-related-title">Related roadmaps</span>
              {others.map((g) => (
                <Link key={g.slug} className="pg-chip" to={`/roadmap/${g.slug}`}>
                  {g.title}
                </Link>
              ))}
            </div>

            {/* key resets the ticks when hopping between guides */}
            <Graph key={guide.slug} guide={guide} />
          </>
        ) : (
          <p className="pg-empty">
            There is no roadmap called “{slug}”. <Link to="/roadmap">See all roadmaps</Link>.
          </p>
        )}
      </div>
    </div>
  );
};

export default RoadmapGraph;
