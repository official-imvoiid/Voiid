import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import PageShell from "../components/PageShell";
import { useContent } from "../content/ContentContext";
import { cachedRepos, fetchRepos, githubUser, LANGUAGE_COLORS, readCopy, storageKey } from "../content/github";
import WorldLands from "./DevelopLands";
import { placeStops, project } from "../content/worldTour";
import { WORLD_H, WORLD_W } from "../content/worldLand";
import Creatures from "./DevelopCreatures";

/**
 * Develop - every project on my GitHub, charted as an old expedition map.
 *
 * The trail runs from the first repo I created to the newest, so a new
 * project simply becomes the next stop. Data comes live from GitHub (the
 * username is taken from admin -> Links -> GitHub) by way of this site's
 * server, which re-checks GitHub on the schedule set in /admin -> Develop
 * map (every 10 minutes by default). Refresh fetches the server's copy again.
 *
 *   ← →  (or ↑ ↓)  travel between projects      Enter  open it on GitHub
 *
 * Looks:  common/styles/pages/develop.css
 * Layout: platforms/<device>/develop.css
 */

const CLOCK_SLACK_MS = 5 * 1000;   // server check times from two answers may differ this much and still be the same check
const COLLECT_MS = 4 * 1000;       // the server is fetching a newer copy: collect it this long after
const RETRY_MS = 60 * 1000;        // the server's copy was overdue and still is: ask again this long after
const REFRESH_MIN_MS = 1000;       // "Refreshing…" stays on the button at least this long, so it can be read
const REFRESHED_MS = 1800;         // then "Refreshed ✓" for this long
const ACTIVE_DAYS = 30;            // pushed this recently = a lit campfire
const DAY = 24 * 60 * 60 * 1000;
const SAMPLE = 4;                  // px between the ship's pre-measured trail points
const PER_MAP = 30;                // projects on a full-size map; the rest go on the next map
const FULL_MAP_W = 1100;           // px: a map this wide (or wider) holds PER_MAP projects
const RESIZE_MS = 150;             // the map re-lays out once a resize has settled, not per pixel

// the continents only depend on the scale, so a re-render of the map (a new
// selection, a resize step) doesn't redraw the 81 KB of coastline
const World = memo(WorldLands);

const ago = (iso) => {
  const days = Math.floor((Date.now() - new Date(iso)) / DAY);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} month${days < 60 ? "" : "s"} ago`;
  return `${Math.floor(days / 365)} year${days < 730 ? "" : "s"} ago`;
};
/* the page's state, from a copy of the repo list (or none yet) */
/* live: the times come from this visit's answer from the server - a copy kept
   from an earlier visit draws the map at once, but its times are old news, so
   they aren't shown until the server has answered (a fraction of a second) */
const fromCopy = (user, copy, live = false) => (copy
  ? { status: "ready", user, version: copy.version || "", repos: copy.repos, fetchedAt: copy.fetchedAt, gotAt: copy.gotAt, checkEvery: copy.checkEvery || 0, error: "", live }
  : { status: "loading", user, version: "", repos: [], fetchedAt: 0, gotAt: 0, checkEvery: 0, error: "", live });

/* The two times beside Refresh. They count on by themselves (every 15 s, and
   at once when the tab comes back to the front), so the clock ticking never
   makes the whole page - and its big map - render again. */
const CopyTimes = ({ live, gotAt, fetchedAt, checkEvery }) => {
  const [, setTick] = useState(0);
  useEffect(() => {
    const tick = () => { if (!document.hidden) setTick((n) => n + 1); };
    const clock = window.setInterval(tick, 15 * 1000);
    document.addEventListener("visibilitychange", tick);
    return () => { window.clearInterval(clock); document.removeEventListener("visibilitychange", tick); };
  }, []);
  // a copy kept from an earlier visit is older than the server's schedule
  // allows and the page hasn't heard back from the server since: say so
  // instead of showing "3 h ago" and then jumping
  const everyMs = (checkEvery || 10) * 60 * 1000;
  const overdue = fetchedAt > 0 && Date.now() - fetchedAt > everyMs + RETRY_MS && Date.now() - gotAt > RETRY_MS;
  return (
    <span className="pg-count dv-count">
      <span title="When your browser last got the list from this site's server (on opening, on schedule, or Refresh).">
        Your session: {live ? sinceFetch(gotAt) : "…"}
      </span>
      <span title={`When this site's server last got the list from GitHub${checkEvery ? ` (it does so every ${checkEvery} min)` : ""}. Every visitor gets this same copy.`}>
        Server: {!live ? "…" : overdue ? "updating…" : sinceFetch(fetchedAt)}
      </span>
    </span>
  );
};

const sinceFetch = (t) => {
  if (!t) return "not yet";
  const min = Math.floor(Math.max(0, Date.now() - t) / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  if (min < 48 * 60) return `${Math.floor(min / 60)} h ago`;
  return `${Math.floor(min / 1440)} days ago`;
};
const monthYear = (iso) => new Date(iso).toLocaleDateString(undefined, { month: "short", year: "numeric" });

/* ---- geometry: the projects as cities on a world tour ----
   worldTour.js spreads them round the continents, oldest first; this scales
   the 1000 x 500 world to the map's width. */
function chart(names, flags, width) {
  const count = names.length;
  const scale = width / WORLD_W;
  const all = placeStops(count).map((p) => ({ x: p.x * scale, y: p.y * scale }));
  const points = all.slice(0, count);
  const height = Math.round(WORLD_H * scale);
  return { points, labels: placeLabels(points, names, flags, width, height), next: all[count], height, scale };
}

const shortName = (name) => (name.length > 20 ? `${name.slice(0, 19)}…` : name);

/* Every name is shown, so each one tries a few spots round its dot - below,
   above, right, left, then further out - and takes the first that doesn't
   cover another name or dot. */
function placeLabels(points, names, flags, width, height) {
  const CH = 6.4;                     // rough width of one character at 12px
  const H = 13;
  const taken = points.map((p) => ({ x0: p.x - 6, y0: p.y - 6, x1: p.x + 6, y1: p.y + 6 }));
  // the year flags stand just above-left of their stop
  flags.forEach((i) => {
    const p = points[i];
    if (p) taken.push({ x0: p.x - 16, y0: p.y - 52, x1: p.x + 20, y1: p.y - 4 });
  });
  const off = (b) => b.x0 < 4 || b.y0 < 4 || b.x1 > width - 4 || b.y1 > height - 4;
  const hits = (b) => off(b) || taken.some((t) => b.x0 < t.x1 && b.x1 > t.x0 && b.y0 < t.y1 && b.y1 > t.y0);
  return points.map((p, i) => {
    const w = shortName(names[i]).length * CH + 4;
    const tries = [
      { dx: 0, dy: 18, anchor: "middle" }, { dx: 0, dy: -10, anchor: "middle" },
      { dx: 10, dy: 4, anchor: "start" }, { dx: -10, dy: 4, anchor: "end" },
      { dx: 0, dy: 31, anchor: "middle" }, { dx: 0, dy: -23, anchor: "middle" },
      { dx: 12, dy: 17, anchor: "start" }, { dx: -12, dy: 17, anchor: "end" },
      { dx: 12, dy: -9, anchor: "start" }, { dx: -12, dy: -9, anchor: "end" },
    ];
    const box = (t) => {
      const x0 = t.anchor === "middle" ? p.x + t.dx - w / 2 : t.anchor === "start" ? p.x + t.dx : p.x + t.dx - w;
      return { x0, y0: p.y + t.dy - H + 2, x1: x0 + w, y1: p.y + t.dy + 3 };
    };
    const pick = tries.find((t) => !hits(box(t))) || tries.find((t) => !off(box(t))) || tries[0];
    taken.push(box(pick));
    return pick;
  });
}

/* open-sea spots for the creatures (longitude, latitude) */
const SEAS = [[-150, 28], [-40, 38], [72, -28], [-128, -8], [165, 18], [-25, -12], [-165, -30], [100, -45]];

// Catmull-Rom through the points, as smooth cubic curves
function trail(pts) {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    d += ` C ${p1.x + (p2.x - p0.x) / 6} ${p1.y + (p2.y - p0.y) / 6}, ${p2.x - (p3.x - p1.x) / 6} ${p2.y - (p3.y - p1.y) / 6}, ${p2.x} ${p2.y}`;
  }
  return d;
}

/* The trail as a point every SAMPLE px along it, worked out from the very
   curves trail() draws. Asking the browser instead (getPointAtLength, a
   thousand times or more) froze the page for a quarter of a second - longer
   on a phone - before the map could appear; this takes about a millisecond.
   Each curve is followed in small straight steps, then read off at even
   distances. */
const CURVE_STEPS = 48;
function sampleTrail(pts) {
  if (!pts.length) return [];
  const line = [[pts[0].x, pts[0].y]];
  const dist = [0];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    for (let s = 1; s <= CURVE_STEPS; s++) {
      const t = s / CURVE_STEPS;
      const u = 1 - t;
      const x = u * u * u * p1.x + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * p2.x;
      const y = u * u * u * p1.y + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * p2.y;
      const [px, py] = line[line.length - 1];
      dist.push(dist[dist.length - 1] + Math.hypot(x - px, y - py));
      line.push([x, y]);
    }
  }
  const total = dist[dist.length - 1];
  const out = [];
  let j = 1;
  for (let l = 0; l <= total + SAMPLE; l += SAMPLE) {
    const want = Math.min(total, l);
    while (j < dist.length - 1 && dist[j] < want) j++;
    if (j >= line.length) { out.push(line[line.length - 1]); continue; }
    const span = dist[j] - dist[j - 1];
    const f = span > 0 ? Math.min(1, Math.max(0, (want - dist[j - 1]) / span)) : 0;
    const [ax, ay] = line[j - 1];
    const [bx, by] = line[j];
    out.push([ax + (bx - ax) * f, ay + (by - ay) * f]);
  }
  return out;
}

/* a compass rose: eight points, each half light and half shaded */
const Compass = ({ x, y, size = 1 }) => {
  const point = (angle, len, w) => {
    const r = (angle * Math.PI) / 180;
    const tip = [Math.sin(r) * len, -Math.cos(r) * len];
    const l = [Math.sin(r - Math.PI / 2) * w, -Math.cos(r - Math.PI / 2) * w];
    const rt = [Math.sin(r + Math.PI / 2) * w, -Math.cos(r + Math.PI / 2) * w];
    return (
      <g key={angle}>
        <path className="dv-rose-dark" d={`M 0 0 L ${l[0]} ${l[1]} L ${tip[0]} ${tip[1]} Z`} />
        <path className="dv-rose-light" d={`M 0 0 L ${rt[0]} ${rt[1]} L ${tip[0]} ${tip[1]} Z`} />
      </g>
    );
  };
  const ticks = Array.from({ length: 32 }, (_, i) => {
    const r = (i / 32) * Math.PI * 2;
    return `M ${Math.sin(r) * 31} ${-Math.cos(r) * 31} L ${Math.sin(r) * (i % 4 ? 34 : 36)} ${-Math.cos(r) * (i % 4 ? 34 : 36)}`;
  }).join(" ");
  return (
    <g className="dv-compass" transform={`translate(${x} ${y}) scale(${size})`}>
      <circle r="36" className="dv-rose-ring" />
      <circle r="31" className="dv-rose-ring" />
      <path d={ticks} className="dv-rose-ticks" />
      {[45, 135, 225, 315].map((a) => point(a, 24, 5))}
      {[0, 90, 180, 270].map((a) => point(a, 44, 7))}
      <circle r="3" className="dv-rose-hub" />
      <text y="-50" className="dv-rose-n">N</text>
    </g>
  );
};

/* a pennant marking the first project of a new year */
const YearFlag = ({ x, y, year }) => (
  <g className="dv-flag" transform={`translate(${x} ${y})`}>
    <path d="M 0 0 L 0 -34" className="dv-flag-pole" />
    <path d="M 0 -34 Q 13 -37 25 -30 Q 13 -26 0 -21 Z" className="dv-flag-cloth" />
    <circle cy="-35" r="1.8" className="dv-flag-knob" />
    <text x="1" y="-40">{year}</text>
  </g>
);

/* starred repos carry a little treasure chest */
const Chest = () => (
  <g className="dv-chest" transform="translate(10 -8) scale(0.8)">
    <path d="M -6 -2 L 6 -2 L 6 5 L -6 5 Z" />
    <path d="M -6 -2 Q 0 -8 6 -2" />
    <path d="M -6 1 L 6 1 M 0 -1 L 0 3" className="dv-chest-band" />
  </g>
);

/* the traveller's boat - it sails along the trail to the chosen project */
const Ship = () => (
  <g className="dv-ship">
    <path d="M -13 2 L 13 2 Q 10 9 0 9 Q -10 9 -13 2 Z" className="dv-ship-hull" />
    <path d="M -9 5 L 9 5" className="dv-ship-line" />
    <path d="M 0 2 L 0 -20" className="dv-ship-mast" />
    <path d="M 1 -18 Q 11 -10 10 -1 L 1 -1 Z" className="dv-ship-sail" />
    <path d="M -1 -15 Q -9 -8 -8 -1 L -1 -1 Z" className="dv-ship-sail" />
    <path d="M 0 -20 L 6 -22 L 0 -24" className="dv-ship-pennant" />
  </g>
);

/* ---- the map itself ----
   `width` is measured by the page (it decides how many projects fit on one
   map); `boxRef` hands the page the frame to measure. */
// memo: the map only draws again when its own props change - not when the
// Refresh button toggles or a copy with the same list arrives
const ProjectMap = memo(({ repos, selected, onSelect, more, width, boxRef, quiet }) => {
  const markRefs = useRef([]);

  const names = useMemo(() => repos.map((r) => r.name), [repos]);
  // a flag where each new year begins - and on the first stop of every map
  const flags = useMemo(() => repos.flatMap((r, i) => {
    const year = new Date(r.createdAt).getFullYear();
    return i === 0 || year !== new Date(repos[i - 1].createdAt).getFullYear() ? [i] : [];
  }), [repos]);
  const { points, labels, next, height, scale } = useMemo(() => chart(names, flags, width), [names, flags, width]);
  const seas = useMemo(() => SEAS.map(([lon, lat]) => {
    const p = project(lon, lat);
    return { x: p.x * scale, y: p.y * scale + 24 };
  }), [scale]);
  const fullTrail = useMemo(() => trail(points), [points]);

  /* ---- the ship: measure how far along the trail each stop is, then
     sail from the last stop to the new one ---- */
  const trailRef = useRef(null);
  const shipRef = useRef(null);
  const walkedRef = useRef(null);
  const shipAt = useRef(null);           // current distance along the trail (null = not placed yet)
  const [stopLengths, setStopLengths] = useState([]);
  const samples = useRef([]);            // the trail as a point every SAMPLE px

  useLayoutEffect(() => {
    if (!trailRef.current || !points.length) return;
    const pts = sampleTrail(points);
    // each stop's distance along the trail: the nearest sample, walking forward
    let k = 0;
    const lengths = points.map((p) => {
      let best = k;
      let bestD = Infinity;
      for (let j = k; j < pts.length && j < k + 400; j++) {
        const d = (pts[j][0] - p.x) ** 2 + (pts[j][1] - p.y) ** 2;
        if (d < bestD) { bestD = d; best = j; }
      }
      k = best;
      return best * SAMPLE;
    });
    samples.current = pts;
    setStopLengths(lengths);
  }, [points]);

  useEffect(() => {
    const ship = shipRef.current;
    const pts = samples.current;
    const target = stopLengths[selected];
    if (!ship || !pts.length || target === undefined) return undefined;

    // position at a distance along the trail, read from the sampled table
    const at = (len) => {
      const f = Math.max(0, Math.min(pts.length - 1.001, len / SAMPLE));
      const i = Math.floor(f);
      const t = f - i;
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[i + 1] || pts[i];
      return { x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t };
    };

    const place = (len) => {
      const a = at(len);
      const b = at(len + 14);           // look a little ahead for a calm heading
      const angle = Math.atan2(b.y - a.y, b.x - a.x) * (180 / Math.PI);
      // keep the boat upright: face the way it's heading, never upside-down
      const flip = Math.abs(angle) > 90 ? -1 : 1;
      const tilt = flip === 1 ? angle : angle + 180;
      const lean = Math.max(-8, Math.min(8, tilt * 0.3));        // a gentle lean, never a capsize
      ship.setAttribute("transform", `translate(${a.x} ${a.y - 36}) rotate(${lean}) scale(${flip} 1)`);
      // the red "travelled" line grows with the ship instead of jumping ahead
      walkedRef.current?.setAttribute("stroke-dasharray", `${len} 1000000`);
      shipAt.current = len;
    };

    const from = shipAt.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // first placement, or reduced motion: no voyage, just be there
    if (reduce || from === null) { place(target); return undefined; }

    // a steady sailing speed: about 80px a second, never shorter than 2.5s
    const duration = Math.min(15000, Math.max(2500, (Math.abs(target - from) / 80) * 1000));
    const start = performance.now();
    let raf = 0;
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      place(from + (target - from) * eased);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [selected, stopLengths]);

  // bring the selected stop into view when it changes (not in the hidden preview,
  // which must never move the page the visitor is actually on)
  useEffect(() => {
    if (quiet) return;
    markRefs.current[selected]?.scrollIntoView?.({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [selected, quiet]);

  const now = Date.now();

  return (
    <div className="dv-map" ref={boxRef}>
      <svg
        className="dv-svg"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Map of ${repos.length} projects`}
      >
        {/* one country per year of projects, stamped on the board */}
        <World scale={scale} />

        {/* the compass rose */}
        <Compass x={width - 64 * Math.min(1, scale)} y={74 * Math.min(1, scale)} size={Math.min(1, scale)} />

        {/* the trail: dashed ahead, solid where we've already walked */}
        <path d={fullTrail} className="dv-trail-casing" />
        <path d={fullTrail} className="dv-trail" ref={trailRef} />
        <mask id="dv-walked" maskUnits="userSpaceOnUse" x="0" y="0" width={width} height={height}>
          <path ref={walkedRef} d={fullTrail} className="dv-walked" strokeDasharray="0 1000000" />
        </mask>
        <path d={fullTrail} className="dv-trail is-travelled" mask="url(#dv-walked)" />
        {points.length ? (
          <path
            d={`M ${points[points.length - 1].x} ${points[points.length - 1].y} Q ${(points[points.length - 1].x + next.x) / 2} ${next.y + 40} ${next.x} ${next.y}`}
            className="dv-trail is-future"
          />
        ) : null}


        {/* the stops: a town mark each, a red X on the chosen one */}
        {points.map((p, i) => {
          const r = repos[i];
          const active = now - new Date(r.pushedAt) < ACTIVE_DAYS * DAY;
          const isSel = i === selected;
          const label = shortName(r.name);
          const spot = labels[i];
          return (
            <g
              key={r.id}
              ref={(el) => { markRefs.current[i] = el; }}
              className={`dv-stop${isSel ? " is-selected" : ""}${active ? " is-active" : ""}${r.archived ? " is-archived" : ""}${r.fork ? " is-fork" : ""}`}
              transform={`translate(${p.x} ${p.y})`}
              onClick={() => onSelect(i)}
              role="button"
              tabIndex={-1}
              aria-label={r.name}
            >
              <circle r="12" className="dv-hit" />
              {active ? <path d="M -6 -6 q -3 -4 0 -7 t 0 -7" className="dv-smoke" /> : null}
              {isSel ? (
                <g className="dv-x-mark">
                  <circle r="15" className="dv-pulse" />
                  <path d="M -8 -9 Q 0 -1 9 8 M 8 -9 Q 1 -1 -9 9" className="dv-x-edge" />
                  <path d="M -8 -9 Q 0 -1 9 8 M 8 -9 Q 1 -1 -9 9" className="dv-x" />
                </g>
              ) : (
                <>
                  {r.fork ? <circle r="7.5" className="dv-fork-ring" /> : null}
                  <circle r="4.6" className="dv-town" />
                  <circle r="1.6" className="dv-town-dot" />
                  {r.stars > 0 ? <Chest /> : null}
                </>
              )}
              <text className="dv-label" x={spot.dx} y={spot.dy} textAnchor={spot.anchor}>{label}</text>
            </g>
          );
        })}

        {/* the year flags */}
        {flags.map((i) => (
          <YearFlag key={`y${i}`} x={points[i].x - 8} y={points[i].y - 5} year={new Date(repos[i].createdAt).getFullYear()} />
        ))}

        {/* where the map runs out */}
        <g className="dv-next" transform={`translate(${next.x} ${next.y})`}>
          <circle r="5" />
          <text className="dv-next-label" y="18">{more ? "on to the next map →" : "the next project…"}</text>
        </g>

        {/* the little folk between the rows - hover one to hear it */}
        <Creatures spots={seas} width={width} />

        {/* the traveller, drawn last so it sails over everything */}
        <g ref={shipRef} className="dv-ship-wrap"><Ship /></g>
      </svg>
    </div>
  );
});
ProjectMap.displayName = "ProjectMap";

/* small drawn icons - the ↗ / ← → text glyphs render lopsided in the hand font */
const Icon = ({ d }) => (
  <svg className="dv-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d={d} />
  </svg>
);
const ICON = {
  prev: "M15 5 8 12l7 7",
  next: "M9 5l7 7-7 7",
  out: "M9 6h9v9M18 6 6 18",
};

/* repo names from the admin box: one per line or comma-separated */
const nameSet = (text = "") =>
  new Set(String(text ?? "").split(/[\n,]/).map((n) => n.trim().toLowerCase()).filter(Boolean));

/* the ship's log beside the intro: the whole voyage in numbers */
const VoyageLog = memo(({ repos }) => {
  const stars = repos.reduce((n, r) => n + r.stars, 0);
  const byLang = {};
  repos.forEach((r) => { if (r.language) byLang[r.language] = (byLang[r.language] || 0) + 1; });
  const langs = Object.entries(byLang).sort((a, b) => b[1] - a[1]);
  const top = langs.slice(0, 4);
  const years = repos.map((r) => new Date(r.createdAt).getFullYear());
  const first = Math.min(...years);
  const last = Math.max(...years);

  return (
    <aside className="dv-log" aria-label="Voyage log">
      <p className="dv-log-title">Ship&apos;s log</p>
      <dl className="dv-log-stats">
        <div><dt>Projects</dt><dd>{repos.length}</dd></div>
        <div><dt>Languages</dt><dd>{langs.length}</dd></div>
        <div><dt>Stars</dt><dd>{stars}</dd></div>
        <div><dt>At sea</dt><dd>{first === last ? first : `${first}–${String(last).slice(2)}`}</dd></div>
      </dl>
      <ul className="dv-log-langs">
        {top.map(([lang, n]) => (
          <li key={lang} style={{ "--lang": LANGUAGE_COLORS[lang] || "#8a7250", "--share": n / top[0][1] }}>
            <span className="dv-log-name">{lang}</span>
            <span className="dv-log-bar" />
            <span className="dv-log-n">{n}</span>
          </li>
        ))}
      </ul>
      <p className="dv-log-title">Map key</p>
      <ul className="dv-key">
        <li><svg viewBox="-16 -16 32 32"><circle r="6.5" className="dv-town" /><circle r="2.2" className="dv-town-dot" /></svg>My project</li>
        <li><svg viewBox="-16 -16 32 32"><circle r="10" className="dv-fork-ring" /><circle r="6.5" className="dv-town" /><circle r="2.2" className="dv-town-dot" /></svg>Forked repo</li>
        <li><svg viewBox="-16 -16 32 32"><g className="dv-chest" transform="scale(1.6)"><path d="M -6 -2 L 6 -2 L 6 5 L -6 5 Z" /><path d="M -6 -2 Q 0 -8 6 -2" /></g></svg>Starred</li>
        <li><svg viewBox="-16 -16 32 32"><path d="M -3 10 q -4 -5 0 -9 t 0 -9" className="dv-smoke" /><circle cx="6" cy="8" r="5" className="dv-town" /></svg>Active this month</li>
        <li><svg viewBox="-16 -16 32 32"><path d="M -6 13 L -6 -13" className="dv-flag-pole" /><path d="M -6 -13 Q 4 -14 11 -9 Q 4 -7 -6 -3 Z" className="dv-flag-cloth" /></svg>A new year</li>
      </ul>
    </aside>
  );
});
VoyageLog.displayName = "VoyageLog";

/* I, II, III ... for the map numbers */
const roman = (n) => ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][n] || String(n);

/* ---- the page ----
   preview: drawn once, invisibly, while the visitor is still on another page
   (WarmDevelop in App.jsx), so the browser has already prepared this page's
   fonts at their exact sizes when it is really opened. A preview draws from
   the copy already in hand and does nothing else: no requests, no keys, no
   scrolling, no timers of its own. */
const Develop = ({ preview = false }) => {
  const { links, develop } = useContent();
  const user = githubUser(links.github);

  // drawn at once from the copy already in hand (fetched when the site opened,
  // or kept from the last visit); load() below swaps in a newer one
  const [state, setState] = useState(() => fromCopy(user, user ? cachedRepos(user) : null));
  const [showForks, setShowForks] = useState(true);   // forks show, ringed twice
  const [selected, setSelected] = useState(-1);

  const [busy, setBusy] = useState(false);            // the Refresh button is at work
  const [refreshed, setRefreshed] = useState(false);  // ...and just finished: "Refreshed ✓" for a moment
  const labelTimer = useRef(0);

  // a copy arrives (from the server, or saved by another tab): take it unless
  // it is from an older server check than the one already shown - then only
  // "your copy" moves on (that copy was just confirmed). When its list is the
  // one already on screen (same version), the very same list is kept, so the
  // map isn't laid out and measured all over again for nothing.
  const take = useCallback((copy, error = "") => {
    setState((s) => {
      const sameUser = s.user === copy.user && s.status === "ready";
      if (sameUser && s.live && copy.fetchedAt < s.fetchedAt - CLOCK_SLACK_MS) {
        return { ...s, gotAt: Math.max(s.gotAt, copy.gotAt), error };
      }
      const next = { ...fromCopy(copy.user, copy, true), error };
      if (sameUser && copy.version && copy.version === s.version) next.repos = s.repos;
      return next;
    });
  }, []);

  // Gets the server's copy into this page ("Your session"). It never makes the
  // server ask GitHub - only the server's own schedule does that ("Server").
  //   fresh   ask the server even if this browser's copy looks current
  //           (opening the page, Refresh, and the scheduled pick-up)
  //   manual  the Refresh button - shows "Refreshing…" while it waits
  // When a copy is already shown, a failed ask is simply ignored: visitors keep
  // the map, never an error.
  const retry = useRef(0);
  const [attempts, setAttempts] = useState(0);         // bumps after every ask, so the next one is always scheduled
  const load = useCallback(async ({ fresh = false, manual = false } = {}) => {
    if (!user) return;
    window.clearTimeout(retry.current);
    const started = Date.now();
    if (manual) { window.clearTimeout(labelTimer.current); setRefreshed(false); setBusy(true); }
    let collecting = false;
    let ok = false;
    try {
      const copy = await fetchRepos(user, { fresh });
      take(copy, "");
      ok = true;
      // The server is in the middle of its scheduled GitHub check: it answered
      // at once with the copy it has; collect the new one a few seconds later.
      if (copy.checking) {
        collecting = true;
        retry.current = window.setTimeout(() => {
          fetchRepos(user, { fresh: true })
            .then((c) => take(c, ""))
            .catch(() => {})
            .finally(() => setAttempts((n) => n + 1));
        }, COLLECT_MS);
      }
    } catch (err) {
      // server unreachable: keep the map, and show the saved copy's own times
      setState((s) => (s.repos.length ? { ...s, status: "ready", error: "", live: true } : { ...s, status: "error", error: err.message }));
    } finally {
      if (manual) {
        // the server answers in a few milliseconds: the new copy is shown at
        // once, but "Refreshing…" stays up long enough to read, then
        // "Refreshed ✓" for a moment, so the click visibly did something
        const left = Math.max(0, REFRESH_MIN_MS - (Date.now() - started));
        labelTimer.current = window.setTimeout(() => {
          setBusy(false);
          if (ok) {
            setRefreshed(true);
            labelTimer.current = window.setTimeout(() => setRefreshed(false), REFRESHED_MS);
          }
        }, left);
      }
      if (!collecting) setAttempts((n) => n + 1);
    }
  }, [user, take]);
  useEffect(() => () => { window.clearTimeout(retry.current); window.clearTimeout(labelTimer.current); }, []);

  // While the page is open, pick up the server's next copy when it is due:
  // its last check + the interval set in the admin (+ a moment for the check
  // itself). One request per interval per open page - no polling in between.
  // Re-planned after every ask: if the server couldn't renew its copy (GitHub
  // down), the page tries again a minute later instead of going quiet.
  useEffect(() => {
    if (preview || state.status !== "ready" || !state.fetchedAt) return undefined;
    const every = (state.checkEvery || 10) * 60 * 1000;
    const due = state.fetchedAt + every + COLLECT_MS - Date.now();
    const wait = Math.min(Math.max(RETRY_MS, due), every + COLLECT_MS);
    const t = window.setTimeout(() => { if (!document.hidden) load({ fresh: true }); }, wait);
    return () => window.clearTimeout(t);
  }, [preview, state.status, state.fetchedAt, state.checkEvery, attempts, load]);

  // the admin changed the GitHub link while the page was open: start over from that user's copy
  useEffect(() => {
    setState((s) => (s.user === user ? s : fromCopy(user, user ? cachedRepos(user) : null)));
  }, [user]);

  // The map is already drawn from the copy in hand; on arrival the server's
  // current copy is fetched at once, so both times are right straight away.
  // When the tab comes back to the front, it is fetched only if it is due.
  useEffect(() => {
    if (preview) return undefined;
    load({ fresh: true });
    const onShow = () => { if (!document.hidden) load(); };
    document.addEventListener("visibilitychange", onShow);
    window.addEventListener("pageshow", onShow);       // back/forward cache (Safari, Android Chrome)
    window.addEventListener("online", onShow);
    return () => {
      document.removeEventListener("visibilitychange", onShow);
      window.removeEventListener("pageshow", onShow);
      window.removeEventListener("online", onShow);
    };
  }, [load, preview]);

  // another tab got a newer copy: show it here too, without asking again
  useEffect(() => {
    if (!user || preview) return undefined;
    const onStorage = (e) => {
      if (e.key !== storageKey(user)) return;
      const copy = readCopy(user, e.newValue);
      if (copy) take(copy);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [user, take, preview]);

  // left off: the profile README repo, and whatever the admin hid
  const hidden = useMemo(() => {
    const set = nameSet(develop?.hidden);
    if (user) set.add(user.toLowerCase());
    return set;
  }, [develop?.hidden, user]);
  const charted = useMemo(
    () => state.repos.filter((r) => !hidden.has(r.name.toLowerCase())),
    [state.repos, hidden]
  );

  // the journey runs from the first project created to the newest
  const repos = useMemo(
    () => charted
      .filter((r) => showForks || !r.fork)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [charted, showForks]
  );

  // start at whatever I touched most recently. When a newer list arrives, stay
  // on the same project (found by name) - its number may have moved, and
  // keeping the number would quietly jump to a different project.
  const prevRepos = useRef(repos);
  useEffect(() => {
    const before = prevRepos.current;
    prevRepos.current = repos;
    if (!repos.length) return;
    setSelected((cur) => {
      if (cur >= 0 && before !== repos) {
        const name = before[cur]?.name;
        const at = name ? repos.findIndex((r) => r.name === name) : -1;
        if (at >= 0) return at;
      } else if (cur >= 0 && cur < repos.length) {
        return cur;
      }
      let latest = 0;
      repos.forEach((r, i) => { if (r.pushedAt > repos[latest].pushedAt) latest = i; });
      return latest;
    });
  }, [repos]);

  const go = useCallback((delta) => {
    setSelected((i) => (repos.length ? (i + delta + repos.length) % repos.length : -1));
  }, [repos.length]);

  const current = repos[selected];

  // the map's frame and its drawn width
  const [mapBox, setMapBox] = useState(null);
  const [width, setWidth] = useState(FULL_MAP_W);
  useLayoutEffect(() => {
    if (!mapBox) return undefined;
    // never narrower than 720: on a phone the map scrolls sideways instead of
    // being squashed until nothing can be read (desktop is always wider)
    const measure = () => Math.max(720, Math.round(mapBox.clientWidth));
    setWidth(measure());                   // before the first paint - no jump from a guessed size
    let timer = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setWidth(measure()), RESIZE_MS);
    });
    ro.observe(mapBox);
    return () => { window.clearTimeout(timer); ro.disconnect(); };
  }, [mapBox]);

  // a smaller map holds fewer projects, so its stops sit as far apart as on a
  // full-size one: they spread over its area, so the count follows width².
  // A phone's 720px map holds 12 of the 30.
  const perMap = Math.min(PER_MAP, Math.floor(PER_MAP * (width / FULL_MAP_W) ** 2));

  // the voyage is split into maps of perMap projects; the map shown is the
  // one holding the chosen project, so ← → carry on onto the next map
  const maps = Math.max(1, Math.ceil(repos.length / perMap));
  const page = selected >= 0 ? Math.floor(selected / perMap) : 0;
  const first = page * perMap;
  const pageRepos = useMemo(() => repos.slice(first, first + perMap), [repos, first, perMap]);
  const toMap = (n) => setSelected(Math.min(repos.length - 1, n * perMap));
  // the same function from one render to the next, so the (memoised) map
  // only draws again when something on it changed
  const selectOnMap = useCallback((i) => setSelected(first + i), [first]);

  // keyboard travel
  useEffect(() => {
    if (preview) return undefined;
    const onKey = (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); go(1); }
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); go(-1); }
      else if (e.key === "Enter" && current && e.target === document.body) {
        window.open(current.url, "_blank", "noopener,noreferrer");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, current, preview]);

  const forkCount = useMemo(() => charted.filter((r) => r.fork).length, [charted]);

  return (
    <PageShell
      className="dv-page"
      title="Develop 🗺️"
      accent="#D9A441"
      footer="The map ends where the next idea begins."
    >
      <p className="pg-intro dv-intro">
        Every project I&apos;ve built, charted from the very first repository to the newest -
        straight from my GitHub, so the map grows as I do.
      </p>

      {!user ? (
        <p className="pg-empty">Add your GitHub link in /admin → Links to chart the map.</p>
      ) : state.status === "loading" ? (
        <p className="pg-empty">Charting the map…</p>
      ) : state.status === "error" ? (
        <div className="dv-error">
          <p>{state.error}</p>
          <button type="button" className="pg-chip" onClick={() => { setState((s) => ({ ...s, status: "loading" })); load({ fresh: true, manual: true }); }}>
            Try again
          </button>
        </div>
      ) : (
        <>
          <div className="pg-tools">
            {forkCount ? (
              <button
                type="button"
                className="pg-chip"
                aria-pressed={showForks}
                onClick={() => { setShowForks((v) => !v); setSelected(-1); }}
              >
                {showForks ? "Hide" : "Show"} forks ({forkCount})
              </button>
            ) : null}
            <button type="button" className="pg-chip" disabled={busy} aria-live="polite" onClick={() => load({ fresh: true, manual: true })}>
              {busy ? "Refreshing…" : refreshed ? "Refreshed ✓" : "Refresh"}
            </button>
            <CopyTimes live={state.live} gotAt={state.gotAt} fetchedAt={state.fetchedAt} checkEvery={state.checkEvery} />
          </div>

          <div className="dv-layout">
            <div className="dv-maps">
              {maps > 1 ? (
                <div className="dv-pager">
                  <button type="button" className="dv-page-btn" onClick={() => toMap(page - 1)} disabled={page === 0}>
                    <Icon d={ICON.prev} /> Previous map
                  </button>
                  <p className="dv-page-title">
                    Map {roman(page + 1)} of {roman(maps)}
                    <span>projects {first + 1}–{first + pageRepos.length}</span>
                  </p>
                  <button type="button" className="dv-page-btn" onClick={() => toMap(page + 1)} disabled={page === maps - 1}>
                    Next map <Icon d={ICON.next} />
                  </button>
                </div>
              ) : null}
              <ProjectMap
                key={`${page}-${perMap}`}
                repos={pageRepos}
                selected={selected - first}
                onSelect={selectOnMap}
                more={page < maps - 1}
                width={width}
                boxRef={setMapBox}
                quiet={preview}
              />
            </div>

            <div className="dv-side">
            {current ? (
              <aside className="dv-card" aria-live="polite">
                <p className="dv-card-step">Stop {selected + 1} of {repos.length}</p>
                <h2 className="dv-card-title">{current.name}</h2>
                {current.description ? <p className="dv-card-desc">{current.description}</p> : null}

                <ul className="dv-card-facts">
                  {current.language ? (
                    <li>
                      <span className="dv-lang-dot" style={{ background: LANGUAGE_COLORS[current.language] || "#8a7250" }} />
                      {current.language}
                    </li>
                  ) : null}
                  <li>★ {current.stars}</li>
                  <li>⑂ {current.forks}</li>
                  {current.fork ? <li>fork</li> : null}
                  {current.archived ? <li>archived</li> : null}
                </ul>

                <dl className="dv-card-dates">
                  <div><dt>Began</dt><dd>{monthYear(current.createdAt)}</dd></div>
                  <div><dt>Last activity</dt><dd>{ago(current.pushedAt)}</dd></div>
                </dl>

                {current.topics.length ? (
                  <div className="dv-card-topics">
                    {current.topics.map((t) => <span key={t}>{t}</span>)}
                  </div>
                ) : null}

                <div className="dv-card-nav">
                  <button type="button" className="dv-btn" onClick={() => go(-1)} aria-label="Previous project"><Icon d={ICON.prev} /></button>
                  <a className="dv-btn is-visit" href={current.url} target="_blank" rel="noopener noreferrer">
                    Visit on GitHub <Icon d={ICON.out} />
                  </a>
                  <button type="button" className="dv-btn" onClick={() => go(1)} aria-label="Next project"><Icon d={ICON.next} /></button>
                </div>
                {current.homepage ? (
                  <a className="dv-card-live" href={current.homepage} target="_blank" rel="noopener noreferrer">
                    Live site <Icon d={ICON.out} />
                  </a>
                ) : null}
                {state.error ? <p className="dv-card-warn">{state.error} Showing the last copy.</p> : null}
              </aside>
            ) : null}
            {repos.length ? <VoyageLog repos={repos} /> : null}
            </div>
          </div>
        </>
      )}
    </PageShell>
  );
};

export default Develop;
