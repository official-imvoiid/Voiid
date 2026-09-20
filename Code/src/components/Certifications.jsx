import { useMemo, useState } from "react";
import PageShell from "./PageShell";

/**
 * Certifications - what is earned, what is underway, what is next.
 *
 * ---------------------------------------------------------------------------
 * EDITING THIS LIST
 *
 * Every entry starts at "planned" or "active" on purpose - nothing claims to
 * be earned until you say so. When you pass one, flip its status and paste
 * the credential URL so the card becomes a verifiable link:
 *
 *   { name: "CompTIA Security+", issuer: "CompTIA", status: "done",
 *     date: "Aug 2026", verify: "https://www.credly.com/badges/…" }
 *
 * status: "done" | "active" | "planned"
 * ---------------------------------------------------------------------------
 */
const CERTS = [
  {
    name: "Google Cybersecurity Certificate",
    issuer: "Google / Coursera",
    status: "active",
    date: "In progress",
    blurb: "Eight-course grounding in SOC work, Linux, SQL, Python and incident response.",
    tags: ["SIEM", "Linux", "Python"],
  },
  {
    name: "Certified in Cybersecurity (CC)",
    issuer: "ISC2",
    status: "active",
    date: "In progress",
    blurb: "Entry-level certification covering security principles, access control and network security.",
    tags: ["Access Control", "BCDR"],
  },
  {
    name: "CompTIA Security+",
    issuer: "CompTIA",
    status: "planned",
    date: "Targeting 2026",
    blurb: "The baseline the industry actually asks for - threats, architecture, operations, governance.",
    tags: ["Baseline", "DoD 8570"],
  },
  {
    name: "Jr Penetration Tester",
    issuer: "TryHackMe",
    status: "active",
    date: "In progress",
    blurb: "Hands-on offensive path: enumeration, web exploitation, privilege escalation.",
    tags: ["Web", "PrivEsc", "Labs"],
  },
  {
    name: "eJPT",
    issuer: "INE Security",
    status: "planned",
    date: "Next up",
    blurb: "Fully practical entry pentest exam - assess a live network end to end.",
    tags: ["Practical", "Networks"],
  },
  {
    name: "CCNA",
    issuer: "Cisco",
    status: "planned",
    date: "Targeting 2026",
    blurb: "Routing, switching and network fundamentals - the layer everything else sits on.",
    tags: ["Routing", "Switching"],
  },
  {
    name: "SC-900: Security Fundamentals",
    issuer: "Microsoft",
    status: "planned",
    date: "Planned",
    blurb: "Identity, compliance and security across the Microsoft cloud stack.",
    tags: ["Azure", "Identity"],
  },
  {
    name: "AWS Certified Cloud Practitioner",
    issuer: "Amazon Web Services",
    status: "planned",
    date: "Planned",
    blurb: "Cloud literacy - services, shared responsibility model, billing and security basics.",
    tags: ["Cloud", "IAM"],
  },
  {
    name: "Burp Suite Certified Practitioner",
    issuer: "PortSwigger",
    status: "planned",
    date: "Long term",
    blurb: "Proof of real web application testing skill, examined hands-on.",
    tags: ["Web AppSec", "OWASP"],
  },
  {
    name: "CPTS",
    issuer: "Hack The Box",
    status: "planned",
    date: "Long term",
    blurb: "Full penetration testing engagement plus a professional report.",
    tags: ["Red Team", "Reporting"],
  },
  {
    name: "OSCP",
    issuer: "OffSec",
    status: "planned",
    date: "The goal",
    blurb: "Twenty-four hours, a live network, and a report. The one worth the wait.",
    tags: ["Offensive", "Milestone"],
  },
];

const FILTERS = [
  { key: "all", label: "All" },
  { key: "done", label: "Earned" },
  { key: "active", label: "In progress" },
  { key: "planned", label: "Planned" },
];

const TONE_LABEL = { done: "Earned", active: "In progress", planned: "Planned" };

const Certifications = () => {
  const [filter, setFilter] = useState("all");

  const shown = useMemo(
    () => (filter === "all" ? CERTS : CERTS.filter((c) => c.status === filter)),
    [filter]
  );

  const earned = CERTS.filter((c) => c.status === "done").length;
  const active = CERTS.filter((c) => c.status === "active").length;

  return (
    <PageShell
      title="Certifications"
      accent="#F5C451"
      intro={`The paper trail behind the practice. ${earned} earned, ${active} in progress and the
              rest mapped out in order - each one picked because it proves something I actually
              use, not because it looks good in a list.`}
      footer="A certificate is the receipt. The work is the product."
    >
      <div className="pg-tools">
        <div className="pg-chips">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className="pg-chip"
              aria-pressed={filter === f.key}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <span className="pg-count">
          {shown.length} {shown.length === 1 ? "certification" : "certifications"}
        </span>
      </div>

      {shown.length === 0 ? (
        <p className="pg-empty">Nothing in this group yet.</p>
      ) : (
        <div className="pg-grid">
          {shown.map((c, i) => {
            const body = (
              <>
                <div className="pg-card-top">
                  <h3 className="pg-card-title">{c.name}</h3>
                  <span className="pg-badge" data-tone={c.status}>
                    {TONE_LABEL[c.status]}
                  </span>
                </div>
                <p className="pg-card-sub">
                  {c.issuer} &middot; {c.date}
                </p>
                <p className="pg-card-sub">{c.blurb}</p>
                <div className="pg-tags">
                  {c.tags.map((t) => (
                    <span key={t} className="pg-tag">{t}</span>
                  ))}
                </div>
                {c.verify ? <span className="pg-open">Verify credential &#8599;</span> : null}
              </>
            );

            return c.verify ? (
              <a
                key={c.name}
                className="pg-card"
                style={{ "--i": i }}
                href={c.verify}
                target="_blank"
                rel="noopener noreferrer"
              >
                {body}
              </a>
            ) : (
              <div key={c.name} className="pg-card" style={{ "--i": i }}>
                {body}
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
};

export default Certifications;
