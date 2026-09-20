import PageShell from "./PageShell";

/**
 * Roadmap - where this is going, stage by stage.
 *
 * ---------------------------------------------------------------------------
 * EDITING
 *
 * One object per stage, in order. `status` drives the colour of the dot and
 * the badge:
 *
 *   "done"    - finished, dot filled
 *   "active"  - happening now, dot pulses
 *   "planned" - ahead, dot hollow
 *
 * Move a stage from "active" to "done" as you clear it and promote the next
 * one. The rail, the numbering and the layout all follow automatically.
 * ---------------------------------------------------------------------------
 */
const STAGES = [
  {
    when: "Foundation",
    title: "Learn to build before learning to break",
    status: "done",
    blurb:
      "Programming, data structures and the web stack - enough to write real software rather than just read about it.",
    items: ["C & Java fundamentals", "Data structures & algorithms", "React, HTTP and APIs", "Git and version control"],
  },
  {
    when: "Core Systems",
    title: "Understand the machine underneath",
    status: "done",
    blurb:
      "You cannot secure what you cannot explain. Operating systems, databases and networking, properly.",
    items: ["Operating systems internals", "DBMS & SQL", "TCP/IP and routing", "Linux as a daily driver"],
  },
  {
    when: "Now",
    title: "Security fundamentals & hands-on labs",
    status: "active",
    blurb:
      "Moving from theory to practice - cryptography, web exploitation and daily lab work, with the certifications that evidence it.",
    items: [
      "Cryptography & network security",
      "OWASP Top 10, hands-on",
      "TryHackMe / Hack The Box streak",
      "Google Cybersecurity & ISC2 CC",
    ],
  },
  {
    when: "Next",
    title: "Prove it under exam conditions",
    status: "planned",
    blurb:
      "Practical, examined certifications plus projects big enough to be worth writing up.",
    items: ["Security+ and eJPT", "Build & publish security tooling", "Full penetration test write-ups", "First internship"],
  },
  {
    when: "Specialise",
    title: "Pick a side and go deep",
    status: "planned",
    blurb:
      "Offensive and defensive both matter, but depth beats breadth. Red team methodology, forensics and malware analysis.",
    items: ["Red team methodology", "Digital forensics & malware analysis", "Cloud security", "CPTS / BSCP"],
  },
  {
    when: "The Goal",
    title: "Security engineer, building and breaking",
    status: "planned",
    blurb:
      "Working professionally on systems that matter - with OSCP behind me and a body of public work in front.",
    items: ["OSCP", "Full-time security engineering", "Research worth publishing", "Give the notes back to the next student"],
  },
];

const TONE_LABEL = { done: "Done", active: "In progress", planned: "Ahead" };

const Roadmap = () => {
  const done = STAGES.filter((s) => s.status === "done").length;
  const pct = Math.round((done / STAGES.length) * 100);

  return (
    <PageShell
      title="Roadmap"
      accent="#A78BFA"
      intro={`The plan, in the order it actually happens - what is cleared, what I am in the middle
              of, and what comes after. It gets edited as things change, because a roadmap that
              never moves was never real.`}
      footer="The plan is not the point. Moving through it is."
    >
      <div className="rm-progress" aria-label={`${pct} percent complete`}>
        <div className="rm-progress-bar">
          <span className="rm-progress-fill" style={{ "--pct": `${pct}%` }} />
        </div>
        <span className="pg-count">
          {done} of {STAGES.length} stages cleared
        </span>
      </div>

      <ol className="rm-line">
        {STAGES.map((s, i) => (
          <li className="rm-stage" data-status={s.status} style={{ "--i": i }} key={s.title}>
            <span className="rm-dot" aria-hidden="true" />

            <div className="rm-body">
              <div className="pg-card-top">
                <span className="rm-when">{s.when}</span>
                <span className="pg-badge" data-tone={s.status}>
                  {TONE_LABEL[s.status]}
                </span>
              </div>

              <h3 className="rm-title">{s.title}</h3>
              <p className="pg-card-sub">{s.blurb}</p>

              <ul className="rm-items">
                {s.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </PageShell>
  );
};

export default Roadmap;
