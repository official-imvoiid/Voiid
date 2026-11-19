/* toQuotes.js - the admin's quotes -> the ones worth showing (an empty one is
   skipped). Used by the Literature page for Quotes.jsx.
     text    the quote as plain text (the *stars* around key words removed)
     marked  the quote as written, stars and all - Quotes.jsx makes the
             starred words bold
     color   the wash behind it, a colour like #F2A7C3, or "" for the default */

export const toQuotes = (quotes) =>
  (Array.isArray(quotes) ? quotes : [])
    .map((q) => {
      const marked = String(q?.text ?? "").trim();
      return {
        marked,
        text: marked.replace(/\*/g, "").replace(/[ \t]{2,}/g, " ").trim(),
        author: String(q?.author ?? "").trim(),
        date: String(q?.date ?? ""),
        color: /^#[0-9a-f]{6}$/i.test(String(q?.color ?? "")) ? q.color : "",   // the wash; "" = the default pink
      };
    })
    .filter((q) => q.text);
