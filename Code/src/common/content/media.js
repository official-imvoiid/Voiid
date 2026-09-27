/* Small helpers for content that points at media. */

/* "https://youtu.be/ID", "https://www.youtube.com/watch?v=ID&t=3",
   ".../shorts/ID", ".../embed/ID" or just "ID"  ->  "ID" (or "" if none). */
export function youtubeId(input) {
  const s = String(input || "").trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  const m = s.match(/(?:youtu\.be\/|[?&]v=|\/(?:embed|shorts|live)\/)([\w-]{11})/);
  return m ? m[1] : "";
}

/* The average colour of an image, brightened a little so it reads as a
   glow on a dark page. Used for games whose colour is set to "auto".
   Resolves to null if the image can't be read. */
const cache = new Map();

export function imageColor(src) {
  if (!src) return Promise.resolve(null);
  if (!cache.has(src)) {
    cache.set(src, new Promise((resolve) => {
      const img = new Image();
      // same-origin covers come straight from the cache; only another site's
      // image needs the CORS request that lets the canvas read it
      if (/^https?:/i.test(src) && !src.startsWith(window.location.origin)) img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const size = 24;                              // tiny: fast and already averaged
          const canvas = document.createElement("canvas");
          canvas.width = canvas.height = size;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          ctx.drawImage(img, 0, 0, size, size);
          const px = ctx.getImageData(0, 0, size, size).data;

          // weight saturated pixels higher, so a grey background doesn't win
          let r = 0, g = 0, b = 0, w = 0;
          for (let i = 0; i < px.length; i += 4) {
            const max = Math.max(px[i], px[i + 1], px[i + 2]);
            const min = Math.min(px[i], px[i + 1], px[i + 2]);
            const weight = 1 + (max - min) / 32;
            r += px[i] * weight; g += px[i + 1] * weight; b += px[i + 2] * weight; w += weight;
          }
          const lift = (v) => Math.min(255, Math.round((v / w) * 1.25 + 20));
          resolve(`rgb(${lift(r)}, ${lift(g)}, ${lift(b)})`);
        } catch {
          resolve(null);                                // e.g. a cross-origin image
        }
      };
      img.onerror = () => resolve(null);
      img.src = src;
    }));
  }
  return cache.get(src);
}
