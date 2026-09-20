import { useMemo, useState } from "react";
import PageShell from "./PageShell";

/**
 * My Study Notes - the B.Tech notes shelf.
 *
 * ---------------------------------------------------------------------------
 * ADDING A NOTE
 *
 * Drop the PDF into  Code/public/notes/  then point `file` at it:
 *
 *   { sem: 4, subject: "Operating Systems", title: "Deadlocks & Scheduling",
 *     tags: ["Deadlock", "RR", "SJF"], file: "/notes/os-deadlocks.pdf" }
 *
 * Leave `file` out (or null) and the card still lists the topic but shows
 * "coming soon" instead of a download link - so the shelf can be complete
 * before every PDF is written.
 * ---------------------------------------------------------------------------
 */
const NOTES = [
  // ---- Semester 1 ----
  { sem: 1, subject: "Engineering Mathematics I", title: "Calculus & Matrices", tags: ["Limits", "Eigenvalues", "Integration"] },
  { sem: 1, subject: "Programming for Problem Solving", title: "C Fundamentals", tags: ["Pointers", "Arrays", "Recursion"] },
  { sem: 1, subject: "Engineering Physics", title: "Waves, Optics & Modern Physics", tags: ["Interference", "Lasers"] },
  { sem: 1, subject: "Basic Electrical Engineering", title: "Circuit Theory Essentials", tags: ["KVL / KCL", "Thevenin"] },

  // ---- Semester 2 ----
  { sem: 2, subject: "Engineering Mathematics II", title: "Differential Equations & Transforms", tags: ["Laplace", "Fourier"] },
  { sem: 2, subject: "Data Structures", title: "Linear & Non-Linear Structures", tags: ["Stacks", "Trees", "Graphs"] },
  { sem: 2, subject: "Engineering Chemistry", title: "Bonding, Polymers & Corrosion", tags: ["Electrochemistry"] },
  { sem: 2, subject: "Environmental Science", title: "Ecosystems & Pollution Control", tags: ["Sustainability"] },

  // ---- Semester 3 ----
  { sem: 3, subject: "Discrete Mathematics", title: "Logic, Sets & Graph Theory", tags: ["Proofs", "Relations", "Combinatorics"] },
  { sem: 3, subject: "Object Oriented Programming", title: "Java & OOP Principles", tags: ["Inheritance", "Collections", "Exceptions"] },
  { sem: 3, subject: "Digital Logic Design", title: "Gates to Sequential Circuits", tags: ["K-Map", "Flip-Flops"] },
  { sem: 3, subject: "Computer Organization", title: "CPU, Memory & Pipelining", tags: ["Cache", "Addressing Modes"] },

  // ---- Semester 4 ----
  { sem: 4, subject: "Operating Systems", title: "Processes, Scheduling & Deadlocks", tags: ["Semaphores", "Paging", "Deadlock"] },
  { sem: 4, subject: "DBMS", title: "Relational Model to Transactions", tags: ["SQL", "Normalisation", "ACID"] },
  { sem: 4, subject: "Design & Analysis of Algorithms", title: "Complexity & Strategy", tags: ["Greedy", "DP", "Big-O"] },
  { sem: 4, subject: "Computer Networks", title: "OSI, TCP/IP & Routing", tags: ["Subnetting", "TCP", "DNS"] },

  // ---- Semester 5 ----
  { sem: 5, subject: "Cryptography & Network Security", title: "Ciphers, Keys & Protocols", tags: ["AES", "RSA", "TLS", "Hashing"] },
  { sem: 5, subject: "Software Engineering", title: "SDLC, Agile & Testing", tags: ["UML", "Scrum"] },
  { sem: 5, subject: "Theory of Computation", title: "Automata, Grammars & Turing Machines", tags: ["DFA", "CFG", "Pumping Lemma"] },
  { sem: 5, subject: "Web Technologies", title: "Frontend, Backend & REST", tags: ["React", "HTTP", "APIs"] },

  // ---- Semester 6 ----
  { sem: 6, subject: "Ethical Hacking", title: "Recon to Post-Exploitation", tags: ["Nmap", "Burp Suite", "OWASP Top 10"] },
  { sem: 6, subject: "Cloud Computing", title: "Virtualisation & Service Models", tags: ["IaaS", "Containers", "IAM"] },
  { sem: 6, subject: "Machine Learning", title: "Supervised & Unsupervised Learning", tags: ["Regression", "SVM", "Clustering"] },
  { sem: 6, subject: "Compiler Design", title: "Lexical Analysis to Code Generation", tags: ["Parsing", "SDT"] },

  // ---- Semester 7 ----
  { sem: 7, subject: "Digital Forensics", title: "Evidence, Imaging & Chain of Custody", tags: ["Autopsy", "Volatility", "Artifacts"] },
  { sem: 7, subject: "Malware Analysis", title: "Static & Dynamic Analysis", tags: ["Sandboxing", "IOCs", "Reversing"] },
  { sem: 7, subject: "Cyber Law & Ethics", title: "IT Act, Privacy & Compliance", tags: ["GDPR", "IT Act 2000"] },
  { sem: 7, subject: "Big Data Analytics", title: "Distributed Processing", tags: ["Hadoop", "Spark"] },

  // ---- Semester 8 ----
  { sem: 8, subject: "Security Operations", title: "SOC Workflow & SIEM", tags: ["Splunk", "Triage", "MITRE ATT&CK"] },
  { sem: 8, subject: "Advanced Penetration Testing", title: "Red Team Methodology", tags: ["Active Directory", "Pivoting", "Reporting"] },
  { sem: 8, subject: "Major Project", title: "Research, Build & Defend", tags: ["Thesis", "Documentation"] },
];

const SEMS = [...new Set(NOTES.map((n) => n.sem))].sort((a, b) => a - b);

const Notes = () => {
  const [sem, setSem] = useState("all");
  const [q, setQ] = useState("");

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return NOTES.filter((n) => {
      if (sem !== "all" && n.sem !== sem) return false;
      if (!term) return true;
      return (
        n.title.toLowerCase().includes(term) ||
        n.subject.toLowerCase().includes(term) ||
        n.tags.some((t) => t.toLowerCase().includes(term))
      );
    });
  }, [sem, q]);

  const ready = NOTES.filter((n) => n.file).length;

  return (
    <PageShell
      title="My Study Notes"
      accent="#7CF2D0"
      intro={`Everything I have written down across the B.Tech course, semester by semester -
              condensed theory, formula sheets and lab work. Search a topic or pick a semester.
              ${ready} of ${NOTES.length} are uploaded so far; the rest are on their way.`}
      footer="Notes are written to be re-read, not just submitted."
    >
      <div className="pg-tools">
        <input
          className="pg-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search a topic, subject or tag…"
          aria-label="Search notes"
        />

        <div className="pg-chips">
          <button
            type="button"
            className="pg-chip"
            aria-pressed={sem === "all"}
            onClick={() => setSem("all")}
          >
            All
          </button>
          {SEMS.map((s) => (
            <button
              key={s}
              type="button"
              className="pg-chip"
              aria-pressed={sem === s}
              onClick={() => setSem(s)}
            >
              Sem {s}
            </button>
          ))}
        </div>

        <span className="pg-count">
          {shown.length} {shown.length === 1 ? "note" : "notes"}
        </span>
      </div>

      {shown.length === 0 ? (
        <p className="pg-empty">Nothing matches that yet &mdash; try a broader word.</p>
      ) : (
        <div className="pg-grid">
          {shown.map((n, i) => {
            const body = (
              <>
                <div className="pg-card-top">
                  <h3 className="pg-card-title">{n.title}</h3>
                  <span className="pg-badge" data-tone={n.file ? "done" : "planned"}>
                    Sem {n.sem}
                  </span>
                </div>
                <p className="pg-card-sub">{n.subject}</p>
                <div className="pg-tags">
                  {n.tags.map((t) => (
                    <span key={t} className="pg-tag">{t}</span>
                  ))}
                </div>
                <span className="pg-open">
                  {n.file ? "Open PDF ↗" : "Write-up coming soon"}
                </span>
              </>
            );

            const key = `${n.sem}-${n.subject}-${n.title}`;

            return n.file ? (
              <a
                key={key}
                className="pg-card"
                style={{ "--i": i }}
                href={n.file}
                target="_blank"
                rel="noopener noreferrer"
              >
                {body}
              </a>
            ) : (
              <div key={key} className="pg-card" style={{ "--i": i }}>
                {body}
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
};

export default Notes;
