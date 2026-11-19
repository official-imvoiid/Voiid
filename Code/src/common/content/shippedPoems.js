/* shippedPoems.js - the shipped poems (poems.js) are only needed by the
   pages that show or edit them (Literature, the admin), so they are kept out
   of the first download and fetched with those pages instead (see App.jsx).
   ContentContext listens here and layers them in as the poems' default. */

let poems = null;
let pending = null;
const listeners = new Set();

/** Fetch the shipped poems once; resolves when every listener has them. */
export const loadPoems = () => {
  pending ||= import("./poems").then((m) => {
    poems = m.default;
    listeners.forEach((fn) => fn(poems));
    return poems;
  });
  return pending;
};

/** The shipped poems if they have arrived, else null. */
export const shippedPoems = () => poems;

/** Called with the poems when they arrive; returns an unsubscribe. */
export const onPoems = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
