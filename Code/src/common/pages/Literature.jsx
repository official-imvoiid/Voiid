import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import PageShell from "../components/PageShell";
import { useContent } from "../content/ContentContext";
import useModal from "../hooks/useModal";

/**
 * Literature - my poems, as a shelf of books.
 *
 * Each book shows its title and the first lines. Opening one reads it over
 * a dark see-through backdrop, with its quotes pulled out underneath.
 * The open poem is kept in the address (#poem-id) so it can be shared.
 *
 * The poems are edited at /admin -> Poems (shipped set: content/poems.js).
 * Looks: common/styles/pages/literature.css
 */

// leather tones for "auto" covers, taken in turn
const COVERS = ["#6b2230", "#1f3a5f", "#2f4a34", "#5a3a22", "#3b2f4f", "#4a4a4f", "#6a4a1f", "#233f47"];

const slug = (t) => t.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "poem";

/* the admin's poems -> books: an address, a cover colour, the quotes as a list */
function toBooks(poems) {
  const used = new Map();
  return poems
    .filter((p) => p.title || p.text)
    .map((p, i) => {
      let id = slug(p.title || `poem-${i + 1}`);
      const n = used.get(id) || 0;
      used.set(id, n + 1);
      if (n) id = `${id}-${n + 1}`;                     // two poems with one title
      return {
        id,
        title: p.title || "Untitled",
        year: Number(p.year) || null,
        text: p.text || "",
        quotes: String(p.quotes || "").split("\n").map((q) => q.trim().replace(/^["“]|["”]$/g, "")).filter(Boolean),
        cover: p.color && p.color !== "auto" ? p.color : COVERS[i % COVERS.length],
      };
    });
}

const preview = (text) => text.split("\n").filter(Boolean).slice(0, 3).join("\n");
const stanzas = (text) => text.split(/\n\s*\n/);

/* ---- the reader ---- */
const Reader = ({ books, index, onIndex, onClose }) => {
  const book = books[index];
  const count = books.length;
  const scrollRef = useRef(null);
  const step = useCallback((d) => onIndex((index + d + count) % count), [index, count, onIndex]);
  useModal({ onClose, onStep: step });

  // each poem starts at the top
  useEffect(() => { scrollRef.current?.scrollTo(0, 0); }, [index]);

  return (
    <div
      className="lit-reader"
      role="dialog"
      aria-modal="true"
      aria-label={book.title}
      ref={scrollRef}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="lit-reader-bar">
        <button type="button" className="lit-round" onClick={() => step(-1)} aria-label="Previous poem">
          <ChevronLeft aria-hidden="true" />
        </button>
        <span className="lit-reader-count">{index + 1} / {count}</span>
        <button type="button" className="lit-round" onClick={() => step(1)} aria-label="Next poem">
          <ChevronRight aria-hidden="true" />
        </button>
        <button type="button" className="lit-round is-close" onClick={onClose} aria-label="Close">
          <X aria-hidden="true" />
        </button>
      </div>

      <article className="lit-page" key={book.id}>
        {book.year ? <p className="lit-page-year">{book.year}</p> : null}
        <h2 className="lit-page-title">{book.title}</h2>
        <span className="lit-rule" aria-hidden="true">❦</span>

        <div className="lit-poem">
          {stanzas(book.text).map((st, i) => <p key={i}>{st}</p>)}
        </div>
        {book.quotes.length ? (
          <div className="lit-pulled">
            {book.quotes.map((q, i) => <blockquote key={i} className="lit-quote">“{q}”</blockquote>)}
          </div>
        ) : null}

        <p className="lit-page-sign">— voiid</p>
      </article>
    </div>
  );
};

const Literature = () => {
  const { poems } = useContent();
  const books = useMemo(() => toBooks(poems), [poems]);
  const [year, setYear] = useState("all");
  const [openId, setOpenId] = useState(() => {
    try { return decodeURIComponent(window.location.hash.slice(1)); } catch { return ""; }   // a malformed #hash opens nothing
  });
  const open = books.findIndex((b) => b.id === openId);

  // keep the open poem in the address, without adding history entries
  const openAt = useCallback((i) => {
    const id = i >= 0 ? books[i].id : "";
    setOpenId(id);
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${id ? `#${id}` : ""}`);
  }, [books]);
  const close = useCallback(() => openAt(-1), [openAt]);

  // newest year first; poems without a year at the end
  const years = useMemo(() => [...new Set(books.map((b) => b.year).filter(Boolean))].sort((a, b) => b - a), [books]);
  const groups = useMemo(() => {
    const list = years
      .filter((y) => year === "all" || year === y)
      .map((y) => ({ key: String(y), label: String(y), books: books.filter((b) => b.year === y) }));
    const undated = books.filter((b) => !b.year);
    if (undated.length && year === "all") list.push({ key: "undated", label: "Undated", books: undated });
    return list;
  }, [books, years, year]);

  return (
    <PageShell
      className="lit-page-shell"
      title="Literature"
      accent="#E3B873"
      intro="Poems I've written between the code - on time, loss, purpose and the price of wanting. Pick a book to read it."
      footer="Words written to be felt, not just read."
    >
      <div className="pg-tools">
        <div className="pg-chips">
          <button type="button" className="pg-chip" aria-pressed={year === "all"} onClick={() => setYear("all")}>All</button>
          {years.map((y) => (
            <button key={y} type="button" className="pg-chip" aria-pressed={year === y} onClick={() => setYear(y)}>{y}</button>
          ))}
        </div>
        <span className="pg-count">{books.length} poems</span>
      </div>

      {groups.map((g) => (
        <section key={g.key} className="lit-shelf">
          <h2 className="lit-shelf-title">{g.label}<span>{g.books.length}</span></h2>
          <ul className="lit-books">
            {g.books.map((b) => {
              const i = books.indexOf(b);
              return (
                <li key={b.id}>
                  <button type="button" className="lit-book" style={{ "--cover": b.cover, "--i": i }} onClick={() => openAt(i)}>
                    <span className="lit-book-spine" aria-hidden="true" />
                    <span className="lit-book-face">
                      <span className="lit-book-year">{b.year ?? "·"}</span>
                      <span className="lit-book-title">{b.title}</span>
                      <span className="lit-book-ornament" aria-hidden="true">❦</span>
                      <span className="lit-book-preview">{preview(b.text)}</span>
                      <span className="lit-book-read">Read →</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {open >= 0 ? <Reader books={books} index={open} onIndex={openAt} onClose={close} /> : null}
    </PageShell>
  );
};

export default Literature;
