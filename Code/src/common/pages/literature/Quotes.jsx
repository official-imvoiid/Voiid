import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, LayoutList, Search, X } from "lucide-react";
import useModal from "../../hooks/useModal";

/**
 * Quotes - a thing of its own, apart from the poems.
 *
 *   QuotesBubble  a bubble that floats in the corner of the Literature page
 *   QuotesView    its own full-screen page: each quote on a frosted card over
 *                 a soft watercolour wash, inside a thin line frame with a
 *                 heavy opening mark top-left and closing mark bottom-right.
 *                 The card fills the screen (no wide empty margins).
 *                 Move through the quotes with ← →, a swipe, the bar at the
 *                 bottom, or "All quotes" - a searchable list that jumps to
 *                 any of them. Esc closes.
 *
 * Set in /admin -> Quotes: the first quote is the one the page opens on;
 * words wrapped in *stars* are set bold (a quote without any gets one or two
 * picked for it); each quote may have its own colour ("auto" = blossom pink).
 * Everything is printed as plain text. Looks: common/styles/pages/quotes.css
 */

const two = (n) => String(n).padStart(2, "0");
const SWIPE_PX = 60;
const DEFAULT_WASH = "#F2A7C3";   // soft cherry-blossom pink

// small words never picked as a key word
const STOP = new Set(("about after again against all also although always among another because been before being between both "
  + "cannot could does doing down during each every from further have having here into itself just more most much must never "
  + "only other over same should since some still such than that their them then there these they this those through under "
  + "until very were what when where which while whom whose will with would your yours you'll you're you've i'll i'm it's "
  + "don't won't isn't that's they're we're").split(" "));

const core = (w) => w.toLowerCase().replace(/[^\p{L}']/gu, "");

/* a quote -> its lines of words, each { t, em } */
function wordsOf(marked) {
  const lines = marked.split("\n").map((l) => l.split(/\s+/).filter(Boolean)).filter((l) => l.length);
  const flat = lines.flat();
  const starred = flat.some((w) => /^\*.+\*$/.test(w));
  let auto = new Set();
  if (!starred) {
    const picks = flat
      .map((w, i) => ({ i, c: core(w.replace(/\*/g, "")) }))
      .filter(({ c }) => c.length >= 5 && !STOP.has(c));
    const longest = picks.reduce((a, b) => (b.c.length > (a?.c.length ?? 0) ? b : a), null);
    const last = picks[picks.length - 1];
    auto = new Set([longest?.i, last?.i].filter((i) => i !== undefined));
  }
  let k = 0;
  return lines.map((line) => line.map((w) => {
    const word = { t: w.replace(/\*/g, ""), em: starred ? /^\*.+\*$/.test(w) : auto.has(k), k };
    k++;
    return word;
  }));
}

const lengthOf = (text) => (text.length <= 60 ? "short" : text.length <= 120 ? "mid" : text.length <= 240 ? "long" : "xlong");

/* "#F2A7C3" -> [242, 167, 195]; anything else -> the default pink */
const rgbOf = (hex) => {
  const m = /^#([0-9a-f]{6})$/i.exec(String(hex || ""));
  const v = parseInt((m ? m[1] : DEFAULT_WASH.slice(1)), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
};
const washOf = (hex) => {
  const [r, g, b] = rgbOf(hex);
  const towardWhite = (p) => [r, g, b].map((c) => Math.round(c * p + 255 * (1 - p))).join(", ");
  const deeper = [r, g, b].map((c) => Math.round(c * 0.86)).join(", ");
  return {
    page: `rgb(${towardWhite(0.16)})`,                 // the paper: the palest tint of the colour
    flower: `rgb(${r}, ${g}, ${b})`,                 // the blossoms, petals and sparks
    accent: `rgb(${r}, ${g}, ${b})`,                 // the marks, bold words and active bar
    hl: `rgba(${r}, ${g}, ${b}, 0.6)`,              // the brush stroke under the main quote's bold words
    blobA: `rgba(${r}, ${g}, ${b}, 0.5)`,            // the watercolour wash
    blobB: `rgba(${r}, ${g}, ${b}, 0.32)`,
    blobC: `rgba(${deeper}, 0.24)`,
  };
};

/* ---- the garden: blossoms that sway around the edges, petals that drift down ---- */

const PETAL = "M0 -5 C -13 -11, -21 -29, -14 -41 C -10 -46, -4 -46, 0 -39 C 4 -46, 10 -46, 14 -41 C 21 -29, 13 -11, 0 -5 Z";
const PETAL_TURNS = [[0, 1], [73, 0.95], [143, 1.03], [217, 0.97], [289, 1.01]];   // not quite even, like a real flower
const STAMENS = Array.from({ length: 14 }, (_, i) => i * (360 / 14) + (i % 2) * 6);

/* the gradients a flower needs, ids made unique per drawing */
const FlowerDefs = ({ id }) => (
  <>
    <radialGradient id={`p${id}`} gradientUnits="userSpaceOnUse" cx="0" cy="0" r="46">
      <stop offset="0" stopColor="currentColor" />
      <stop offset="0.42" stopColor="currentColor" />
      <stop offset="0.84" stopColor="#ffd0e0" />
      <stop offset="1" stopColor="#ffe6ef" />
    </radialGradient>
    <radialGradient id={`c${id}`}>
      <stop offset="0" stopColor="#8a1d45" stopOpacity="0.85" />
      <stop offset="1" stopColor="#8a1d45" stopOpacity="0" />
    </radialGradient>
  </>
);
/* one blossom, centred on 0,0, about 100 units across */
const FlowerShape = ({ id }) => (
  <>
    {PETAL_TURNS.map(([a, s]) => (
      <g key={a} transform={`rotate(${a}) scale(${s})`}>
        <path d={PETAL} fill={`url(#p${id})`} stroke="#d4668f" strokeOpacity="0.5" strokeWidth="0.9" />
        <path d="M0 -6 C -1 -18, 1 -28, 0 -37" fill="none" stroke="#c2507c" strokeOpacity="0.45" strokeWidth="0.8" />
        <path d="M-1 -10 C -6 -18, -8 -25, -9 -31 M1 -10 C 6 -18, 8 -25, 9 -31" fill="none" stroke="#c2507c" strokeOpacity="0.3" strokeWidth="0.6" />
      </g>
    ))}
    <circle r="13" fill={`url(#c${id})`} />
    {STAMENS.map((a, i) => (
      <g key={a} transform={`rotate(${a})`}>
        <line x1="0" y1="-3" x2="0" y2={i % 2 ? -11 : -14} stroke="#f3cfa0" strokeWidth="0.8" />
        <circle cx="0" cy={i % 2 ? -11.5 : -14.5} r="1.5" fill="#d9952a" />
      </g>
    ))}
    <circle r="2.8" fill="#eab64f" />
  </>
);

/* a cherry blossom, drawn to look real: five notched petals, deep pink at the
   heart fading to pale pink at the edge, a fine darker outline and veins, and
   a ring of stamens. The pink is the text colour (`color`). */
const Blossom = ({ className = "", style }) => {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg className={className} style={style} viewBox="-50 -50 100 100" aria-hidden="true" focusable="false">
      <defs><FlowerDefs id={id} /></defs>
      <FlowerShape id={id} />
    </svg>
  );
};

/* a whole cherry branch reaching in from a corner: a dark bough with side
   shoots, blossoms in clusters, buds and a few young leaves */
const BRANCH_FLOWERS = [
  [96, 34, 0.24, 0], [140, 40, 0.3, -30], [178, 64, 0.4, 10], [208, 22, 0.28, 40], [234, 8, 0.34, -20],
  [270, 140, 0.3, -10], [300, 166, 0.36, 15], [332, 116, 0.26, 50], [378, 84, 0.32, 30], [394, 128, 0.38, 0],
  [158, 82, 0.22, 25], [252, 96, 0.24, -35],
];
const BRANCH_BUDS = [[118, 26, -20], [196, 6, 30], [244, 120, 10], [356, 92, -40], [318, 172, 20], [410, 150, 0]];
const CherryBranch = () => {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg viewBox="0 0 420 200" aria-hidden="true" focusable="false">
      <defs>
        <FlowerDefs id={id} />
        <symbol id={`f${id}`} viewBox="-50 -50 100 100"><FlowerShape id={id} /></symbol>
      </defs>
      <g fill="none" stroke="#5e3d30" strokeLinecap="round">
        <path d="M-10 18 C 60 28, 120 40, 180 70 S 300 120, 400 132" strokeWidth="7" />
        <path d="M120 40 C 150 18, 190 10, 236 6" strokeWidth="3.4" />
        <path d="M210 88 C 232 120, 262 150, 304 168" strokeWidth="3" />
        <path d="M300 114 C 322 96, 348 86, 380 84" strokeWidth="2.4" />
        <path d="M60 26 C 76 14, 92 10, 104 12" strokeWidth="2" />
      </g>
      <path d="M150 52 C 152 40, 162 34, 172 36 C 170 46, 162 52, 150 52 Z" fill="#82a35f" />
      <path d="M286 128 C 296 120, 308 122, 312 130 C 302 136, 292 134, 286 128 Z" fill="#82a35f" />
      <path d="M222 10 C 224 0, 232 -2, 238 2 C 234 8, 228 10, 222 10 Z" fill="#82a35f" />
      {BRANCH_BUDS.map(([x, y, r]) => (
        <g key={`${x}-${y}`} transform={`translate(${x} ${y}) rotate(${r})`}>
          <ellipse rx="4.2" ry="6" fill="currentColor" />
          <ellipse cx="-1.2" cy="-1.8" rx="1.4" ry="2.8" fill="#fff" opacity="0.55" />
          <path d="M-3 3.6 Q 0 8, 3 3.6" fill="#82a35f" />
        </g>
      ))}
      {BRANCH_FLOWERS.map(([x, y, s, r]) => (
        <use key={`${x}-${y}`} href={`#f${id}`} x="-50" y="-50" width="100" height="100"
          transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`} />
      ))}
    </svg>
  );
};

/* a sprig, for the main quote's label */
const Sprig = ({ className = "", style }) => (
  <svg className={className} style={style} viewBox="0 0 60 30" aria-hidden="true" focusable="false">
    <path d="M2 26 C 18 22, 34 14, 50 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M18 21 C 16 13, 22 8, 28 8 C 28 15, 24 20, 18 21 Z" fill="currentColor" opacity="0.8" />
    <path d="M32 15 C 36 22, 44 23, 48 20 C 44 14, 38 13, 32 15 Z" fill="currentColor" opacity="0.65" />
    <circle cx="52" cy="5" r="3.6" fill="currentColor" />
  </svg>
);

// branches reaching in from three corners; they sway as the wind gusts
const BRANCHES = [
  { cls: "is-tl", d: 0 },
  { cls: "is-tr", d: -2.5 },
  { cls: "is-br", d: -5 },
];
// single blossoms round the edges (the middle stays calm): size in px, tilt, delay
const BLOSSOMS = [
  { x: "2%", y: "34%", s: 96, r: -14, d: 0 },
  { x: "-2%", y: "62%", s: 130, r: 8, d: -6 },
  { x: "8%", y: "84%", s: 84, r: -28, d: -4 },
  { x: "24%", y: "90%", s: 62, r: 18, d: -9 },
  { x: "40%", y: "-3%", s: 56, r: 30, d: -5 },
  { x: "58%", y: "92%", s: 78, r: 12, d: -8 },
  { x: "74%", y: "-2%", s: 64, r: -10, d: -1 },
  { x: "90%", y: "40%", s: 88, r: 40, d: -7 },
  { x: "86%", y: "64%", s: 112, r: -20, d: -2 },
  { x: "70%", y: "86%", s: 70, r: 26, d: -3 },
  { x: "30%", y: "4%", s: 48, r: -36, d: -10 },
  { x: "96%", y: "16%", s: 54, r: 14, d: -11 },
];
// petals carried across the screen by the wind: the height they enter at (from
// the left), how long the crossing takes, when they start, and their size
const PETALS = Array.from({ length: 26 }, (_, i) => ({
  y: `${(i * 29 + 7) % 92}%`,
  t: 9 + ((i * 7) % 9),
  d: -((i * 3.7) % 17),
  s: 0.7 + ((i * 13) % 6) / 10,
}));
// sparks: tiny glowing points that rise and twinkle
const SPARKS = Array.from({ length: 14 }, (_, i) => ({
  x: `${(i * 37 + 11) % 97}%`,
  t: 9 + ((i * 7) % 8),
  d: -((i * 5) % 14),
  s: 3 + (i % 3),
}));

const Garden = ({ color }) => (
  <div className="qk-garden" aria-hidden="true" style={{ color }}>
    {BRANCHES.map((b) => (
      <span key={b.cls} className={`qk-branch ${b.cls}`} style={{ animationDelay: `${b.d}s` }}>
        <CherryBranch />
      </span>
    ))}
    {BLOSSOMS.map((f, i) => (
      <span key={`b${i}`} className="qk-bloom" style={{ left: f.x, top: f.y, width: f.s, height: f.s, "--r": `${f.r}deg`, animationDelay: `${f.d}s` }}>
        <Blossom />
      </span>
    ))}
    {SPARKS.map((p, i) => (
      <span key={`k${i}`} className="qk-spark" style={{ left: p.x, width: p.s, height: p.s, animationDuration: `${p.t}s`, animationDelay: `${p.d}s` }} />
    ))}
    {PETALS.map((p, i) => (
      <span key={`p${i}`} className="qk-petal" style={{ top: p.y, "--s": p.s, animationDuration: `${p.t}s`, animationDelay: `${p.d}s` }}>
        <span />
      </span>
    ))}
  </div>
);

/* one drawn quotation mark: a ball with a tail */
const Comma = ({ x, open }) => (
  <path
    transform={`translate(${x} 0)${open ? " rotate(180 6 8)" : ""}`}
    d="M6 0.5a5.5 5.5 0 0 1 5.5 5.5c0 4.6-2.6 8.4-7.3 10.1l-.9-1.7c2.4-1.2 3.8-2.9 4.2-4.9A5.5 5.5 0 1 1 6 0.5z"
  />
);
/* a heavy opening (“) or closing (”) mark */
const Mark = ({ open, className = "" }) => (
  <svg className={`qk-mark ${className}`.trim()} viewBox="0 0 25 17" aria-hidden="true" focusable="false">
    <Comma x={0} open={open} />
    <Comma x={13} open={open} />
  </svg>
);
/* the pair, for the bubble and the empty page */
export const QuoteMarks = ({ className = "" }) => (
  <svg className={`qk-marks ${className}`.trim()} viewBox="0 0 58 17" aria-hidden="true" focusable="false">
    <Comma x={0} open />
    <Comma x={13} open />
    <Comma x={33} />
    <Comma x={46} />
  </svg>
);

/* ---- the bubble ---- */
export const QuotesBubble = ({ onOpen }) => (
  <button type="button" className="qt-bubble" onClick={onOpen} aria-label="Quotes - open the collection">
    <span className="qt-bubble-orb" aria-hidden="true"><Blossom className="qt-bubble-flower" /></span>
    <span className="qt-bubble-label" aria-hidden="true">Quotes</span>
  </button>
);

/* ---- the view ---- */
export const QuotesView = ({ quotes, onClose }) => {
  const count = quotes.length;
  const [index, setIndex] = useState(0);
  const [listOpen, setListOpen] = useState(false);
  const [query, setQuery] = useState("");
  const closeRef = useRef(null);
  const searchRef = useRef(null);
  const swipe = useRef(null);

  const [dir, setDir] = useState(1);   // which way the last move went: the new card slides in from that side
  const go = useCallback((i) => {
    const to = ((i % count) + count) % count;
    setIndex((cur) => { setDir(to >= cur ? 1 : -1); return to; });
  }, [count]);
  const step = useCallback((d) => {
    if (listOpen || count < 2) return;
    setDir(d > 0 ? 1 : -1);
    setIndex((i) => (i + d + count) % count);
  }, [listOpen, count]);
  // Esc closes the list first, then the page
  const close = useCallback(() => { if (listOpen) setListOpen(false); else onClose(); }, [listOpen, onClose]);
  useModal({ onClose: close, onStep: step, focusRef: closeRef });

  // the page underneath must not show its own scrollbar while this is open
  useEffect(() => {
    const html = document.documentElement;
    const before = html.style.overflow;
    html.style.overflow = "hidden";
    return () => { html.style.overflow = before; };
  }, []);

  useEffect(() => { if (index >= count) setIndex(0); }, [index, count]);
  useEffect(() => { if (listOpen) searchRef.current?.focus(); else setQuery(""); }, [listOpen]);

  const quote = quotes[Math.min(index, count - 1)];
  const lines = useMemo(() => (quote ? wordsOf(quote.marked) : []), [quote]);
  const wash = useMemo(() => washOf(quote?.color), [quote]);

  const found = useMemo(() => {
    const q = query.trim().toLowerCase();
    return quotes.map((item, i) => ({ item, i }))
      .filter(({ item }) => !q || item.text.toLowerCase().includes(q) || item.author.toLowerCase().includes(q));
  }, [quotes, query]);

  const jump = (i) => { go(i); setListOpen(false); };

  // a sideways swipe on the card steps through the quotes
  const onDown = (e) => { swipe.current = { x: e.clientX, y: e.clientY }; };
  const onUp = (e) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(e.clientY - s.y)) step(dx < 0 ? 1 : -1);
  };

  return (
    <div className="qk" role="dialog" aria-modal="true" aria-label="Quotes" style={{ backgroundColor: wash.page, "--qk-hl": wash.hl, "--qk-flower": wash.flower, "--qk-accent": wash.accent }}>
      {/* the watercolour wash: soft pools that drift slowly behind everything */}
      <div className="qk-wash" aria-hidden="true">
        <span className="qk-blob is-a" style={{ color: wash.blobA }} />
        <span className="qk-blob is-b" style={{ color: wash.blobB }} />
        <span className="qk-blob is-c" style={{ color: wash.blobC }} />
        <span className="qk-blob is-d" style={{ color: wash.blobB }} />
      </div>
      <Garden color={wash.flower} />

      <header className="qk-top">
        <span className="qk-brand">Quotes</span>
        <div className="qk-top-tools">
          {count ? <span className="qk-count">{two(index + 1)}<span> / {two(count)}</span></span> : null}
          {count > 1 ? (
            <button type="button" className="qk-pill" onClick={() => setListOpen(true)} aria-expanded={listOpen}>
              <LayoutList aria-hidden="true" /><span>All quotes</span>
            </button>
          ) : null}
          <button type="button" className="qk-round" onClick={onClose} aria-label="Close" ref={closeRef}>
            <X aria-hidden="true" />
          </button>
        </div>
      </header>

      <main className="qk-stage" onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={() => { swipe.current = null; }}>
        <figure className="qk-card">
          {!quote ? (
            <div className="qk-empty">
              <QuoteMarks className="qk-empty-marks" />
              <p className="qk-empty-title">No quotes yet.</p>
            </div>
          ) : (
            <div className={`qk-frame${index === 0 ? " is-main" : ""} ${dir > 0 ? "from-right" : "from-left"}`} key={index}>
              <Mark open className="is-open" />
              <span className="qk-rule is-top" aria-hidden="true" />
              <span className="qk-rule is-left" aria-hidden="true" />
              <span className="qk-rule is-right" aria-hidden="true" />
              <span className="qk-rule is-bottom" aria-hidden="true" />
              <Mark className="is-close" />
              {/* the main quote: blossoms in the frame's two empty corners */}
              {index === 0 ? (
                <>
                  <Blossom className="qk-corner is-tr" style={{ color: wash.accent }} />
                  <Blossom className="qk-corner is-bl" style={{ color: wash.accent }} />
                </>
              ) : null}

              <div className="qk-body">
                {index === 0 ? (
                  <p className="qk-kicker" style={{ color: wash.accent }}>
                    <Sprig className="qk-kicker-sprig" />
                    <span>The one above all</span>
                    <Sprig className="qk-kicker-sprig is-flip" />
                  </p>
                ) : null}
                <blockquote className="qk-quote" data-len={lengthOf(quote.text)}>
                  <span className="qk-sr">{quote.text}</span>
                  <span aria-hidden="true">
                    {lines.map((line, l) => (
                      <span className="qk-line" key={l}>
                        {line.map((w) => (
                          w.em
                            ? <strong key={w.k} className="qk-word" style={{ "--k": Math.min(w.k, 30) }}>{w.t}</strong>
                            : <span key={w.k} className="qk-word" style={{ "--k": Math.min(w.k, 30) }}>{w.t}</span>
                        ))}
                      </span>
                    ))}
                  </span>
                </blockquote>
                <figcaption className="qk-by">{quote.author || "voiid"}</figcaption>
              </div>
            </div>
          )}
        </figure>
      </main>

      {count > 1 ? (
        <nav className="qk-bar" aria-label="Move through the quotes">
          <button type="button" className="qk-round" onClick={() => step(-1)} aria-label="Previous quote">
            <ArrowLeft aria-hidden="true" />
          </button>
          {/* wide screens: one mark per quote, each a click away */}
          <div className="qk-segs">
            {quotes.map((_, i) => (
              <button key={i} type="button" className="qk-seg" aria-current={i === index} aria-label={`Quote ${i + 1}`} onClick={() => go(i)}>
                <span />
              </button>
            ))}
          </div>
          {/* narrower screens: one bar and a count (All quotes jumps anywhere) */}
          <div className="qk-meter" aria-hidden="true">
            <span className="qk-meter-line"><span style={{ width: `${((index + 1) / count) * 100}%` }} /></span>
            <span className="qk-meter-count">{two(index + 1)}<span> / {two(count)}</span></span>
          </div>
          <button type="button" className="qk-round" onClick={() => step(1)} aria-label="Next quote">
            <ArrowRight aria-hidden="true" />
          </button>
        </nav>
      ) : null}

      {listOpen ? (
        <div className="qk-index-wrap" onClick={(e) => { if (e.target === e.currentTarget) setListOpen(false); }}>
          <aside className="qk-index" aria-label="All quotes">
            <div className="qk-index-head">
              <h2 className="qk-index-title">All quotes<span>{count}</span></h2>
              <button type="button" className="qk-round" onClick={() => setListOpen(false)} aria-label="Close the list">
                <X aria-hidden="true" />
              </button>
            </div>
            <label className="qk-search">
              <Search aria-hidden="true" />
              <span className="qk-sr">Search the quotes</span>
              <input ref={searchRef} type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search a word…" maxLength={60} />
            </label>
            {found.length ? (
              <ol className="qk-index-list">
                {found.map(({ item, i }) => (
                  <li key={i}>
                    <button type="button" aria-current={i === index} onClick={() => jump(i)}>
                      <span className="qk-index-no" style={{ backgroundColor: washOf(item.color).blobA }}>{two(i + 1)}</span>
                      <span className="qk-index-text">{item.text}</span>
                    </button>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="qk-index-none">No quote has “{query.trim()}” in it.</p>
            )}
          </aside>
        </div>
      ) : null}
    </div>
  );
};
