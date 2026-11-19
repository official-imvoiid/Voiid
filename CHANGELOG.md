# Changelog

If you fork this project, record **your own changes** in this file before you
push or share them, as required by sections 3(b) and 3(c) of the
[LICENSE](LICENSE). You only need to list what you changed. Include the same
information in any pull request to the original repository.

## Entry format

```markdown
## YYYY-MM-DD — short title
**Author:** name or username
**Fork:** link to your fork

### Added
- `path/to/file` — what was added and why

### Changed
- `path/to/file` — what was changed and why

### Removed
- `path/to/file` — what was removed and why
```

---

<!-- Add your entries below this line. -->

## 2026-11-19 — Quotes, backups, faster Develop map and security hardening
**Author:** voiid
**Fork:** original repository

### Added
- `Code/src/common/pages/literature/Quotes.jsx`, `Code/src/common/pages/literature/toQuotes.js`, `Code/src/common/styles/pages/quotes.css` — a Quotes page on Literature with a quote of the day.
- `Code/src/common/content/quotes.js` — 53 quotes, grouped by theme.
- `Code/src/common/content/poems.js` — two poems: "The Weight of Grace" and "The Making of an Empire".
- `Code/server/quotes.js` — rules for saving quotes in the admin.
- `Code/server/backup.js`, `Code/src/common/pages/admin/Backup.jsx` — admin Backup: download the whole site or only its content as a zip.
- `Code/src/common/content/shippedPoems.js` — the poems load only with the pages that use them.
- `Gui/` — screenshots of every page on desktop and phone.

### Changed
- `Code/server.js` — the Develop map's GitHub projects are fetched by the server on a schedule and cached, so visitors no longer hit GitHub's hourly limit. Security hardening: two-factor code guessing is rate-limited, contact form checks tightened, cross-site and file-path checks, upload time limits, and a faster notes listing. Site content is sent compressed.
- `Code/src/App.jsx`, `Code/src/common/pages/Develop.jsx` — the Develop map is prepared in the background and opens about twice as fast on a computer (about five times on a phone). Refresh now shows "Refreshing…" then "Refreshed ✓".
- `Code/src/common/pages/` and `Code/src/common/hooks/useModal.js` — fixes: pages no longer crash on unexpected content, admin works on phones, keyboard focus stays inside viewers, double clicks no longer send twice, and the 3D page survives browsers without WebGL.
- `Code/src/common/pages/admin/Admin.jsx`, `Code/src/common/styles/pages/admin.css` — the "Saved" notice floats instead of moving the page, and the password box is focused on arrival.
- `Code/src/common/styles/pages/quotes.css` — Quotes fully honours "reduce motion".
- `Code/src/common/styles/pages/home/cards/fun.css`, `Code/src/platforms/desktop/home/hover.css` — the mascot stays inside the music card on Apple devices.
- `Code/vite.config.js` — library code is split out so it stays cached between updates. The dev server no longer serves `*.enc` files.
- `Code/package.json` — `archiver` added for backups, and dependency security patches applied.
