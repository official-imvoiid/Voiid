import { PLATFORMS, PLATFORM_OPTIONS } from "../../content/platforms";

/**
 * schema.js - what the admin portal can edit, and how.
 *
 * The portal builds its forms from this file. To make something new
 * editable: add a section here, its default in content/defaults.js, and its
 * key to CONTENT_SECTIONS in server.js.
 *
 * kind:  "fields" - a fixed set of named fields (an object)
 *        "list"   - a reorderable list of records with the same fields
 * field.type: text | url | textarea | number | select | color | colorAuto
 *             image | pdf | certificate | model | modelThumb
 *   select options may be a function of the current content (see Songs).
 */

export const SECTIONS = [
  {
    key: "links",
    label: "Links",
    kind: "fields",
    blurb: "Your CV and where the home page cards point. Leave a link empty and that card stays un-clickable.",
    fields: [
      { name: "cv", label: "CV", type: "pdf", width: "wide", hint: "The PDF behind the Download CV button on the home page. Upload a new one to replace it, then Save." },
      { name: "discord", label: "Discord card", type: "url", hint: "Invite or server link" },
      { name: "article", label: "Latest Articles card", type: "url", hint: "Blog, Medium, dev.to…" },
      { name: "github", label: "GitHub", type: "url", hint: "Your GitHub profile - the GitHub card opens it and the Develop map is charted from it" },
      { name: "instagram", label: "Instagram (edited videos)", type: "url", hint: "Linked from the 3D & Editing page" },
      { name: "research", label: "Research card", type: "url", hint: "Where the Research card's View link opens - your papers" },
      { name: "hackthebox", label: "CyberSecurity tile", type: "url", hint: "The \"CyberSecurity\" button in What I do - your Hack The Box profile" },
      { name: "huggingface", label: "AI Models tile", type: "url", hint: "The \"AI Models\" button in What I do - your Hugging Face profile" },
    ],
  },

  {
    key: "develop",
    label: "Develop map",
    kind: "fields",
    blurb: "Which GitHub repos stay off the map. Your profile README repo is always left off.",
    fields: [
      { name: "hidden", label: "Hidden repos", type: "textarea", width: "wide", hint: "One repo name per line (or comma-separated), e.g. CivitFetch" },
    ],
  },

  {
    key: "models",
    label: "3D models",
    kind: "list",
    blurb: "The 3D & Editing page. Upload VRM (VRoid Studio), GLB / GLTF (Blender: File > Export > glTF 2.0), FBX, OBJ, STL, PLY or DAE. A .blend file can't be shown in a browser - export it as .glb.",
    title: (it) => `${it.name || "Untitled model"}${it.downloadable === "yes" ? "  ·  downloadable" : "  ·  no download button"}`,
    blank: { name: "", file: "", format: "", thumb: "", credit: "", description: "", downloadable: "no" },
    fields: [
      { name: "name", label: "Name", type: "text", width: "wide" },
      { name: "file", label: "Model file", type: "model", width: "wide" },
      { name: "thumb", label: "Card picture", type: "modelThumb", width: "wide", hint: "Upload a picture, or make one from the model." },
      { name: "credit", label: "Made by", type: "text", hint: "Who made it (shown as \"by …\")" },
      { name: "description", label: "Description", type: "text", hint: "e.g. the series it's from" },
      {
        name: "downloadable",
        label: "Download",
        type: "select",
        options: [
          { value: "no", label: "No Download button" },
          { value: "yes", label: "Free download" },
        ],
        hint: "The viewer has to fetch the file to show it, so this only hides the button - it can't stop a determined download.",
      },
    ],
  },

  {
    key: "poems",
    label: "Poems",
    kind: "list",
    blurb: "The Literature page - one book per poem. Every poem shows its quotes underneath.",
    title: (it) => `${it.title || "Untitled poem"}${it.year ? `  ·  ${it.year}` : ""}`,
    swatch: (it) => (it.color && it.color !== "auto" ? it.color : null),
    blank: { title: "", year: new Date().getFullYear(), color: "auto", quotes: "", text: "" },
    fields: [
      { name: "title", label: "Title", type: "text", width: "wide" },
      { name: "year", label: "Year", type: "number", width: "narrow" },
      { name: "color", label: "Book colour", type: "colorAuto", autoLabel: "Auto (shelf palette)" },
      { name: "text", label: "Poem", type: "textarea", rows: 16, width: "wide", hint: "Leave an empty line between stanzas." },
      { name: "quotes", label: "Quotes", type: "textarea", rows: 4, width: "wide", hint: "One quote per line, without quote marks - shown under the poem." },
    ],
  },

  {
    key: "social",
    label: "Social links",
    kind: "list",
    blurb: "The icons in the footer, in this order. Add as many as you like.",
    title: (it) => `${PLATFORMS[it.platform]?.label ?? "Pick a platform"}${it.url ? ` — ${it.url}` : " (no link yet)"}`,
    blank: { platform: "instagram", url: "" },
    fields: [
      { name: "platform", label: "Platform", type: "select", options: PLATFORM_OPTIONS },
      { name: "url", label: "Link", type: "url", width: "wide" },
    ],
  },

  {
    key: "skills",
    label: "Skills",
    kind: "list",
    blurb: "The Skill Set page. A logo replaces the emoji: an .svg is drawn in the skill's colour, a png/jpg is shown as it is.",
    title: (it) => it.label || "Untitled skill",
    swatch: (it) => (it.color && it.color !== "auto" ? it.color : null),
    blank: { icon: "✨", logo: "", color: "auto", label: "" },
    fields: [
      { name: "label", label: "Skill", type: "text", width: "wide" },
      { name: "logo", label: "Logo", type: "image", width: "wide" },
      { name: "icon", label: "Emoji (if no logo)", type: "text", width: "narrow" },
      { name: "color", label: "Colour", type: "colorAuto", autoLabel: "Auto (page palette)" },
    ],
  },

  {
    key: "games",
    label: "Games",
    kind: "list",
    blurb: "Tiles on the Games page. Colour \"Auto\" takes the glow from the cover image.",
    title: (it) => it.name || "Untitled game",
    swatch: (it) => (it.glowColor && it.glowColor !== "auto" ? it.glowColor : null),
    blank: { name: "", theme: "", image: "", url: "", glowColor: "auto" },
    fields: [
      { name: "name", label: "Name", type: "text" },
      { name: "theme", label: "Genre", type: "text" },
      { name: "image", label: "Cover image", type: "image", width: "wide" },
      { name: "url", label: "Link", type: "url", width: "wide", hint: "Where the tile opens" },
      { name: "glowColor", label: "Glow colour", type: "colorAuto" },
    ],
  },

  {
    key: "certificationsPage",
    label: "Certifications · Page",
    kind: "fields",
    blurb: "The heading and text on the Certifications page. In the intro, {earned}, {active} and {total} become the live counts.",
    fields: [
      { name: "title", label: "Title", type: "text" },
      { name: "intro", label: "Intro", type: "textarea", width: "wide", hint: "e.g. \"{earned} certificates earned so far.\"" },
      { name: "footer", label: "Footer line", type: "text", width: "wide" },
    ],
  },

  {
    key: "certifications",
    label: "Certifications · List",
    kind: "list",
    blurb: "One row per certificate, in this order. View opens the file (image or PDF) with these details beside it.",
    title: (it) => `${it.name || "Untitled certificate"}${it.issuer ? ` — ${it.issuer}` : ""}${it.status === "active" ? "  ·  in progress" : ""}`,
    blank: { name: "", issuer: "", status: "done", date: "", blurb: "", tags: "", file: "", verify: "" },
    fields: [
      { name: "name", label: "Certificate name", type: "text", width: "wide" },
      { name: "issuer", label: "Issued by", type: "text" },
      { name: "date", label: "Date", type: "text", hint: "e.g. Jun 2025" },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: [
          { value: "done", label: "Earned" },
          { value: "active", label: "In progress" },
        ],
      },
      { name: "tags", label: "Tags", type: "text", hint: "Comma-separated, e.g. Coursera, Networking" },
      { name: "blurb", label: "Details", type: "textarea", width: "wide", hint: "What it covered - shown next to the certificate" },
      { name: "file", label: "Certificate file", type: "certificate", width: "wide" },
      { name: "verify", label: "Verify link", type: "url", width: "wide", hint: "Optional - a public page that proves it (Credly, Coursera, Unstop…)" },
    ],
  },

  {
    key: "musicCategories",
    label: "Music · Categories",
    kind: "list",
    blurb: "Groups on the Music page, each with its own colour. Renaming one moves its songs with it.",
    title: (it) => it.name || "Untitled category",
    swatch: (it) => it.color,
    blank: { name: "", color: "#F39C12" },
    fields: [
      { name: "name", label: "Category name", type: "text" },
      { name: "color", label: "Colour", type: "color" },
    ],
  },

  {
    key: "songs",
    label: "Music · Songs",
    kind: "list",
    blurb: "Songs on the Music page. Paste any YouTube link.",
    title: (it) => `${it.song || "Untitled song"}${it.artist ? ` — ${it.artist}` : ""}${it.category ? `  ·  ${it.category}` : ""}`,
    blank: { category: "", song: "", artist: "", youtube: "", ytOnly: "" },
    fields: [
      {
        name: "category",
        label: "Category",
        type: "select",
        options: (content) => content.musicCategories.map((c) => ({ value: c.name, label: c.name })),
      },
      { name: "song", label: "Song", type: "text" },
      { name: "artist", label: "Artist", type: "text" },
      { name: "youtube", label: "YouTube link", type: "url", width: "wide", hint: "e.g. https://www.youtube.com/watch?v=… or https://youtu.be/…" },
      {
        name: "ytOnly",
        label: "Plays",
        type: "select",
        options: [
          { value: "", label: "In the pop-up player" },
          { value: "yes", label: "Only on YouTube (embedding blocked)" },
        ],
        hint: "Pick \"Only on YouTube\" if the pop-up says the video is unavailable",
      },
    ],
  },
];

export default SECTIONS;
