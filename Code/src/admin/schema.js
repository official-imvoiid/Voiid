/**
 * schema.js - what the admin portal knows how to edit.
 *
 * The portal has no per-section code. It reads this file and builds the
 * forms, so adding a new editable section means adding an entry here plus
 * the matching default in src/content/defaults.js. Nothing in Admin.jsx
 * needs to change.
 *
 * kind:
 *   "fields" - a fixed set of named fields (an object)
 *   "list"   - a reorderable array of records, each with the same fields
 *
 * field.type:
 *   text | url | textarea | number | select | tags | color
 */

export const SECTIONS = [
  {
    key: "links",
    label: "Links",
    kind: "fields",
    blurb:
      "Where the home page cards point. Several of these were dead href=\"#\" placeholders - fill one in and that card starts working.",
    fields: [
      { name: "research", label: "Research card", type: "url", hint: "The site your Research card opens" },
      { name: "github", label: "GitHub card", type: "url", hint: "Your GitHub profile or a pinned repo" },
      { name: "discord", label: "Discord card", type: "url", hint: "Invite or server link" },
      { name: "article", label: "Latest Articles card", type: "url", hint: "Blog, Medium, dev.to…" },
      { name: "cv", label: "CV file", type: "text", hint: "A path under public/, e.g. /cv/Voiid-CV.pdf" },
    ],
  },

  {
    key: "social",
    label: "Social icons",
    kind: "fields",
    blurb: "The footer icons. Leave one empty and it stays inert rather than linking nowhere.",
    fields: [
      { name: "instagram", label: "Instagram", type: "url" },
      { name: "linkedin", label: "LinkedIn", type: "url" },
      { name: "pinterest", label: "Pinterest", type: "url" },
      { name: "github", label: "GitHub", type: "url" },
      { name: "reddit", label: "Reddit", type: "url" },
      { name: "youtube", label: "YouTube", type: "url" },
      { name: "civitai", label: "Civitai", type: "url" },
    ],
  },

  {
    key: "skills",
    label: "Skill-Set",
    kind: "list",
    blurb: "The list on the Skill-Set page.",
    title: (it) => it.label || "Untitled skill",
    blank: { icon: "✨", label: "" },
    fields: [
      { name: "icon", label: "Icon", type: "text", width: "narrow", hint: "One emoji" },
      { name: "label", label: "Skill", type: "text" },
    ],
  },

  {
    key: "games",
    label: "Games",
    kind: "list",
    blurb: "Tiles on the Games I've Conquered page.",
    title: (it) => it.name || "Untitled game",
    blank: { name: "", image: "", glowColor: "#F39C12", theme: "", url: "" },
    fields: [
      { name: "name", label: "Name", type: "text" },
      { name: "theme", label: "Genre", type: "text" },
      { name: "image", label: "Cover image", type: "text", hint: "A path under public/, e.g. /images/minecraft.jpg" },
      { name: "glowColor", label: "Glow", type: "color" },
      { name: "url", label: "Official site", type: "url" },
    ],
  },

  {
    key: "certifications",
    label: "Certifications",
    kind: "list",
    blurb:
      "Set status to Earned only once you have actually passed it - the page counts and labels come straight from this.",
    title: (it) => it.name || "Untitled certification",
    blank: { name: "", issuer: "", status: "planned", date: "Planned", blurb: "", tags: [], verify: "" },
    fields: [
      { name: "name", label: "Name", type: "text" },
      { name: "issuer", label: "Issuer", type: "text" },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: [
          { value: "done", label: "Earned" },
          { value: "active", label: "In progress" },
          { value: "planned", label: "Planned" },
        ],
      },
      { name: "date", label: "Date / timing", type: "text", hint: "Free text: \"Aug 2026\", \"In progress\", \"The goal\"" },
      { name: "blurb", label: "Description", type: "textarea" },
      { name: "tags", label: "Tags", type: "tags" },
      { name: "verify", label: "Credential URL", type: "url", hint: "Fill this in and the card becomes a verify link" },
    ],
  },

  {
    key: "roadmap",
    label: "Roadmap",
    kind: "list",
    blurb: "Stages on the Roadmap timeline, top to bottom. The progress bar counts the Done ones.",
    title: (it) => it.title || "Untitled stage",
    blank: { when: "", title: "", status: "planned", blurb: "", items: [] },
    fields: [
      { name: "when", label: "Stage label", type: "text", hint: "\"Foundation\", \"Now\", \"The Goal\"" },
      { name: "title", label: "Title", type: "text" },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: [
          { value: "done", label: "Done" },
          { value: "active", label: "In progress" },
          { value: "planned", label: "Ahead" },
        ],
      },
      { name: "blurb", label: "Description", type: "textarea" },
      { name: "items", label: "Checklist", type: "tags", hint: "Comma separated" },
    ],
  },

  {
    key: "notes",
    label: "Notes",
    kind: "list",
    blurb:
      "The B.Tech notes shelf. Leave the PDF blank and the card still lists the topic, marked coming soon.",
    title: (it) => (it.title ? `Sem ${it.sem} · ${it.title}` : "Untitled note"),
    blank: { sem: 1, subject: "", title: "", tags: [], file: "" },
    fields: [
      { name: "sem", label: "Semester", type: "number", width: "narrow", min: 1, max: 8 },
      { name: "subject", label: "Subject", type: "text" },
      { name: "title", label: "Topic", type: "text" },
      { name: "tags", label: "Tags", type: "tags" },
      { name: "file", label: "PDF", type: "text", hint: "A path under public/, e.g. /notes/os-deadlocks.pdf" },
    ],
  },
];

export default SECTIONS;
