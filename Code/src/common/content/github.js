/* Reading public repos straight from GitHub's API. No token needed: public
   data, 60 requests an hour per visitor, and a 10-minute cache per tab keeps
   well under that. */

const CACHE_MS = 10 * 60 * 1000;

/* "https://github.com/official-imvoiid" (or ".../repo", or just the name)
   -> "official-imvoiid" */
export function githubUser(link) {
  const s = String(link || "").trim();
  const m = s.match(/github\.com\/([A-Za-z0-9-]+)/i);
  if (m) return m[1];
  return /^[A-Za-z0-9-]+$/.test(s) ? s : "";
}

/* All public repos of `user`, newest push first. Resolves to
   { repos, fetchedAt } or throws with a readable message. */
export async function fetchRepos(user, { fresh = false } = {}) {
  const key = `voiid.github.${user}`;
  if (!fresh) {
    try {
      const hit = JSON.parse(sessionStorage.getItem(key) || "null");
      if (hit && Date.now() - hit.fetchedAt < CACHE_MS) return hit;
    } catch { /* no storage - just fetch */ }
  }

  const repos = [];
  for (let page = 1; page <= 5; page++) {                 // up to 500 repos
    const res = await fetch(
      `https://api.github.com/users/${encodeURIComponent(user)}/repos?per_page=100&page=${page}&sort=pushed`,
      { headers: { Accept: "application/vnd.github+json" } }
    );
    if (res.status === 404) throw new Error(`GitHub has no user called "${user}".`);
    if (res.status === 403 || res.status === 429) throw new Error("GitHub's hourly limit was reached - try again in a little while.");
    if (!res.ok) throw new Error("Could not reach GitHub.");
    const batch = await res.json();
    repos.push(...batch.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description || "",
      url: r.html_url,
      homepage: r.homepage || "",
      language: r.language || "",
      stars: r.stargazers_count,
      forks: r.forks_count,
      topics: r.topics || [],
      fork: r.fork,
      archived: r.archived,
      createdAt: r.created_at,
      pushedAt: r.pushed_at,
    })));
    if (batch.length < 100) break;
  }

  const result = { repos, fetchedAt: Date.now() };
  try { sessionStorage.setItem(key, JSON.stringify(result)); } catch { /* ignore */ }
  return result;
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
