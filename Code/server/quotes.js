/* ==========================================================================
   server/quotes.js - the rules for the Literature page's quotes
   (admin -> Quotes, saved with the rest of the content in data/content.json).

   Used by server.js when the admin saves the "quotes" section. A quote is:
     text     the quote itself - plain text, 1 to 600 characters
     author   who said it / where it is from - optional, up to 120 characters
     date     the day it was added, YYYY-MM-DD ("" = not known)
     color    the watercolour wash behind it: a colour like #F2A7C3, or "auto" / "" (soft pink)

   Quotes are always shown as plain text, never as HTML - the page prints them
   through React, which escapes everything. The limits here keep a quote a
   quote, and keep control characters out of the file.
   ========================================================================== */

export const MAX_QUOTES = 500;
export const MAX_QUOTE_TEXT = 600;
export const MAX_QUOTE_AUTHOR = 120;

const FIELDS = new Set(["text", "author", "date", "color"]);
const isColor = (v) => v === "" || v === "auto" || /^#[0-9a-f]{6}$/i.test(v);

// control characters (a line break is the only one a quote may keep), plus
// the invisible direction marks that can reorder how a line reads
const CONTROL = /[\u0000-\u0009\u000b-\u001f\u007f-\u009f‎‏‪-‮⁦-⁩]/g;   // eslint-disable-line no-control-regex

const today = () => new Date().toISOString().slice(0, 10);

// a real calendar day, not just the right shape (2025-02-31 is refused)
const isDay = (v) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
};

const tidy = (v) => v.replace(/\r\n?/g, "\n").replace(CONTROL, "");

/* The list the admin sent -> { value } (tidied, ready to store) or { error }
   (a sentence for the admin). Nothing is ever cut short silently: too long is
   an error, so what is saved is what was typed. */
export function cleanQuotes(list) {
  if (!Array.isArray(list)) return { error: "quotes: expected a list." };
  if (list.length > MAX_QUOTES) return { error: `quotes: at most ${MAX_QUOTES} quotes.` };

  const value = [];
  for (const [i, item] of list.entries()) {
    const n = `Quote ${i + 1}`;
    if (!item || typeof item !== "object" || Array.isArray(item)) return { error: `${n}: expected an object.` };
    const extra = Object.keys(item).find((k) => !FIELDS.has(k));
    if (extra) return { error: `${n}: unknown field "${String(extra).slice(0, 40)}".` };

    const { text, author = "", date, color = "auto" } = item;
    if (typeof text !== "string") return { error: `${n}: the quote must be text.` };
    if (typeof author !== "string") return { error: `${n}: the author must be text.` };
    if (date !== undefined && typeof date !== "string") return { error: `${n}: the date must be text like 2026-01-31.` };

    const cleanText = tidy(text).replace(/\n{3,}/g, "\n\n").trim();
    const cleanAuthor = tidy(author).replace(/\s+/g, " ").trim();
    // a quote sent without a date at all is stamped with today; an empty date stays empty
    const cleanDate = date === undefined ? today() : date.trim();

    if (!cleanText) return { error: `${n}: write the quote first (or delete the empty one).` };
    if (cleanText.length > MAX_QUOTE_TEXT) return { error: `${n}: the quote is too long - at most ${MAX_QUOTE_TEXT} characters.` };
    if (cleanAuthor.length > MAX_QUOTE_AUTHOR) return { error: `${n}: the author is too long - at most ${MAX_QUOTE_AUTHOR} characters.` };
    if (cleanDate && !isDay(cleanDate)) return { error: `${n}: the date must look like 2026-01-31.` };
    if (typeof color !== "string" || !isColor(color.trim())) return { error: `${n}: the colour must look like #F2A7C3, or auto.` };

    value.push({ text: cleanText, author: cleanAuthor, date: cleanDate, color: color.trim() || "auto" });
  }
  return { value };
}
