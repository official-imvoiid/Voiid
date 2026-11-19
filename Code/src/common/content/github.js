/* Reading public repos through this site's own server (/api/github/repos in
   server.js), never straight from GitHub: an anonymous browser only gets 60
   GitHub requests an hour. The server asks GitHub once per interval set in
   /admin -> Develop map (10 minutes or more) for everyone, and keeps the
   answer ready in memory. Every visitor gets that same copy.

   So the map never waits: the list is fetched quietly as soon as the site
   opens (prefetchRepos), kept for this visit, and saved in the browser - the
   Develop page draws straight away from that copy (cachedRepos) and, at the
   same moment, asks the server for its current one (an answer from the
   server's memory - GitHub is not involved) and swaps it in. The browser says
   which version of the list it holds; while that is still the server's, only
   the times come back, not the list again. */

const CACHE_MS = 60 * 1000;   // a copy fetched this recently isn't asked for again
export const storageKey = (user) => `voiid.github.${user}`;

let memory = null;    // { user, version, repos, fetchedAt, gotAt, checkEvery, notice } - this visit's copy
let pending = null;   // { user, promise } - the request on its way, shared by everyone asking

/* Only plain http(s) links ever reach an href - never javascript: or data: -
   and every field has the type the page expects, whatever was saved in this
   browser by an older version of the site (the server checks too). */
const webLink = (v) => (typeof v === "string" && /^https?:\/\/[^\s<>"']+$/i.test(v.trim()) ? v.trim() : "");
const str = (v) => (typeof v === "string" ? v : "");
const num = (v) => (Number.isFinite(v) && v >= 0 ? v : 0);
function safeRepo(r) {
  if (!r || typeof r !== "object" || !str(r.name) || !webLink(r.url)) return null;
  return {
    id: num(r.id), name: str(r.name), description: str(r.description), url: webLink(r.url), homepage: webLink(r.homepage),
    language: str(r.language), stars: num(r.stars), forks: num(r.forks),
    topics: Array.isArray(r.topics) ? [...new Set(r.topics.filter((t) => typeof t === "string"))] : [],
    fork: r.fork === true, archived: r.archived === true, createdAt: str(r.createdAt), pushedAt: str(r.pushedAt),
  };
}
const safeRepos = (list) => (Array.isArray(list) ? list.map(safeRepo).filter(Boolean) : []);

/* Turns a stored copy back into one we can use, or null if it's broken. The
   last one read is remembered, so the ~28 KB isn't parsed again and again
   (and the same text always gives the very same list - the map then sees
   nothing new and doesn't redraw). */
let lastRead = { key: "", text: null, copy: null };
export function readCopy(user, text) {
  if (!text) return null;
  const key = storageKey(user);
  if (lastRead.key === key && lastRead.text === text) return lastRead.copy;
  let copy = null;
  try {
    const hit = JSON.parse(text);
    if (hit && Array.isArray(hit.repos)) {
      const now = Date.now();
      const time = (t) => { const n = Number(t) || 0; return n > now ? now : n; };   // a time in the future would read "just now" for ever
      copy = { user, version: typeof hit.version === "string" ? hit.version : "", repos: safeRepos(hit.repos),
        fetchedAt: time(hit.fetchedAt), gotAt: time(hit.gotAt), checkEvery: Number(hit.checkEvery) || 0, notice: "" };
    }
  } catch { /* broken - as if there were none */ }
  lastRead = { key, text, copy };
  return copy;
}

/* The copy already in hand - this tab's, or the newest any tab saved, however
   old - or null. Never waits. */
export function cachedRepos(user) {
  let saved = null;
  try { saved = readCopy(user, localStorage.getItem(storageKey(user))); } catch { /* no storage (private mode) */ }
  const mine = memory && memory.user === user ? memory : null;
  if (mine && saved) {
    if (saved.gotAt <= mine.gotAt) return mine;
    // another tab got a later answer: its times, but this tab's list when it's the same one
    return saved.version && saved.version === mine.version ? { ...saved, repos: mine.repos } : saved;
  }
  return mine || saved;
}

/* Fetch the list ahead of time, quietly - an error here is not an error yet. */
export function prefetchRepos(user) {
  if (user) fetchRepos(user).catch(() => {});
}

/* "https://github.com/official-imvoiid" (or ".../repo", or just the name)
   -> "official-imvoiid" */
export function githubUser(link) {
  const s = String(link || "").trim();
  const m = s.match(/github\.com\/([A-Za-z0-9-]+)/i);
  if (m) return m[1];
  return /^[A-Za-z0-9-]+$/.test(s) ? s : "";
}

/* All public repos of `user`, newest push first. Resolves to
   { repos, fetchedAt, notice } or throws with a readable message.
     fetchedAt  when the SERVER last checked GitHub (not when this browser asked)
     notice     why the copy is an old one, when the server couldn't renew it
     fresh      skip this browser's copy and ask the server (opening the
                Develop page, Refresh) - the server answers from its own copy;
                only its schedule ever makes it ask GitHub
     checking   the server is fetching a newer copy right now - ask again in a
                few seconds to collect it (nobody is made to wait for GitHub) */
export async function fetchRepos(user, { fresh = false } = {}) {
  if (!fresh) {
    const hit = cachedRepos(user);
    // the server only checks GitHub once per interval, so a copy from its
    // latest check can't be bettered yet: don't ask it again until then
    const every = (hit?.checkEvery || 10) * 60 * 1000;
    if (hit && (Date.now() - hit.gotAt < CACHE_MS || Date.now() - hit.fetchedAt < every)) return hit;
  }
  if (pending && pending.user === user) return pending.promise;

  const ask = async (have) => {
    let res;
    try {
      res = await fetch(`/api/github/repos${have ? `?have=${encodeURIComponent(have.version)}` : ""}`, { headers: { Accept: "application/json" } });
    } catch {
      throw new Error("Could not reach the server.");
    }
    const body = await res.json().catch(() => null);
    if (!res.ok || !body) throw new Error(body?.error || "Could not load the projects.");
    if (body.same) {
      // the server's list is the one this browser already holds: it only sent the times
      if (!have || body.version !== have.version) return ask(null);   // can't happen, but never guess
      return { body, repos: have.repos, version: have.version };
    }
    if (!Array.isArray(body.repos)) throw new Error("Could not load the projects.");
    return { body, repos: safeRepos(body.repos), version: typeof body.version === "string" ? body.version : "" };
  };

  const promise = (async () => {
    const held = cachedRepos(user);
    const { body, repos, version } = await ask(held?.version && held.repos.length ? held : null);

    // the server sends how old its check is, so a wrong clock here can't skew "checked 3 min ago"
    const now = Date.now();
    const fetchedAt = Number.isFinite(body.age) ? now - body.age : Number(body.fetchedAt) || now;
    const result = { user, version, repos, fetchedAt, notice: body.notice || "", gotAt: now,
      checkEvery: Number(body.checkEvery) || 0, checking: Boolean(body.checking) };
    memory = result;
    try {
      const text = JSON.stringify(result);
      localStorage.setItem(storageKey(user), text);
      lastRead = { key: storageKey(user), text, copy: result };   // reading it back later gives this very copy
    } catch { /* full or private mode: this tab's copy still works */ }
    return result;
  })();
  pending = { user, promise };
  const done = () => { if (pending && pending.promise === promise) pending = null; };
  promise.then(done, done);
  return promise;
}

/* GitHub's own language colours, for the ones that are likely to turn up */
export const LANGUAGE_COLORS = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  "Jupyter Notebook": "#DA5B0B",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Java: "#b07219",
  C: "#555555",
  "C++": "#f34b7d",
  "C#": "#178600",
  Go: "#00ADD8",
  Rust: "#dea584",
  PHP: "#4F5D95",
  Shell: "#89e051",
  PowerShell: "#012456",
  Batchfile: "#C1F12E",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  Lua: "#000080",
  Ruby: "#701516",
  Swift: "#F05138",
};
