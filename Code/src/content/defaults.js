/**
 * defaults.js - every editable piece of the site, in one place.
 *
 * This is the shipped content. The admin portal never writes here; it saves
 * an override layer on top (see ContentContext), so this file stays the
 * known-good baseline you can always reset to.
 *
 * Adding a new editable section is three steps:
 *   1. add it here
 *   2. add a matching entry to SECTIONS in src/admin/schema.js
 *   3. read it in the component with useContent()
 */

export const CONTENT_VERSION = 1;

const defaults = {
  /* ---------------------------------------------------------------------
     Outbound links. Several of these were href="#" placeholders on the
     home page - they are editable now rather than hardcoded.
     --------------------------------------------------------------------- */
  links: {
    research: "",
    github: "",
    discord: "",
    article: "",
    cv: "/cv/Voiid-CV.pdf",
  },

  social: {
    instagram: "https://www.instagram.com/voiid.ae/",
    linkedin: "",
    pinterest: "",
    github: "",
    reddit: "",
    youtube: "",
    civitai: "",
  },

  /* ---------------------------------------------------------------------
     Skill-Set page
     --------------------------------------------------------------------- */
  skills: [
    { icon: "⚙️", label: "Kali Linux & Cybersecurity" },
    { icon: "🐍", label: "Python Development" },
    { icon: "🌐", label: "Web Development (HTML, CSS, JavaScript, React, Node.js)" },
    { icon: "🚀", label: "Open-Source Contribution" },
    { icon: "🔍", label: "Debugging & Troubleshooting" },
    { icon: "📖", label: "Active Learning & Research" },
    { icon: "📡", label: "Penetration Testing & Ethical Hacking" },
    { icon: "🔧", label: "Automation & Scripting (Bash, PowerShell)" },
    { icon: "🔑", label: "Cryptography & Secure Coding" },
    { icon: "🎬", label: "Video Editing & Content Management" },
    { icon: "📢", label: "Leadership & Team Collaboration" },
    { icon: "🎯", label: "Problem-Solving & Critical Thinking" },
    { icon: "💡", label: "UX/UI Design Fundamentals" },
    { icon: "📝", label: "Communication & Documentation" },
    { icon: "🔄", label: "Active Learning & Adaptability" },
    { icon: "🗣️", label: "Effective Communication Skills" },
  ],

  /* ---------------------------------------------------------------------
     Games I've Conquered
     --------------------------------------------------------------------- */
  games: [
    { name: "Clash of Clans", image: "/images/clash_of_clans.jpg", glowColor: "#FF4500", theme: "Strategy", url: "https://supercell.com/en/games/clashofclans/" },
    { name: "Clash Royale", image: "/images/clash_royale.jpg", glowColor: "#4169E1", theme: "Strategy", url: "https://supercell.com/en/games/clashroyale/" },
    { name: "Rise of Kingdoms", image: "/images/rise_of_kingdoms.webp", glowColor: "#FFD700", theme: "Strategy", url: "https://rok.lilith.com/" },
    { name: "Wuthering Waves", image: "/images/wuthering_waves.jpg", glowColor: "#00FF7F", theme: "Action RPG", url: "https://wutheringwaves.kurogames.com/" },
    { name: "Assassin's Creed", image: "/images/Assassin_Creed.png", glowColor: "#FF6347", theme: "Action-Adventure", url: "https://www.ubisoft.com/en-us/game/assassins-creed" },
    { name: "Minecraft", image: "/images/minecraft.jpg", glowColor: "#32CD32", theme: "Sandbox", url: "https://www.minecraft.net/" },
    { name: "Pokémon GO", image: "/images/pokemon_go.jpg", glowColor: "#1E90FF", theme: "Augmented Reality", url: "https://pokemongolive.com/" },
    { name: "Date A Live: Pledge", image: "/images/date_a_live.png", glowColor: "#8A2BE2", theme: "Visual Novel", url: "https://store.steampowered.com/search/?term=Date+A+Live" },
    { name: "Resident Evil", image: "/images/Resident_Evil.png", glowColor: "#DC143C", theme: "Horror", url: "https://www.residentevil.com/" },
    { name: "Silent Hill", image: "/images/Silent_Hill.png", glowColor: "#708090", theme: "Horror", url: "https://www.konami.com/games/silenthill/" },
    { name: "MiSide", image: "/images/Miside.png", glowColor: "#FF69B4", theme: "Horror", url: "https://store.steampowered.com/search/?term=MiSide" },
    { name: "Doki Doki Literature Club", image: "/images/Doki_doki_literature_club.png", glowColor: "#FFC0CB", theme: "Psychological Horror", url: "https://ddlc.moe/" },
  ],

  /* ---------------------------------------------------------------------
     Certifications. status: done | active | planned
     --------------------------------------------------------------------- */
  certifications: [
    { name: "Google Cybersecurity Certificate", issuer: "Google / Coursera", status: "active", date: "In progress", blurb: "Eight-course grounding in SOC work, Linux, SQL, Python and incident response.", tags: ["SIEM", "Linux", "Python"], verify: "" },
    { name: "Certified in Cybersecurity (CC)", issuer: "ISC2", status: "active", date: "In progress", blurb: "Entry-level certification covering security principles, access control and network security.", tags: ["Access Control", "BCDR"], verify: "" },
    { name: "CompTIA Security+", issuer: "CompTIA", status: "planned", date: "Targeting 2026", blurb: "The baseline the industry actually asks for - threats, architecture, operations, governance.", tags: ["Baseline", "DoD 8570"], verify: "" },
    { name: "Jr Penetration Tester", issuer: "TryHackMe", status: "active", date: "In progress", blurb: "Hands-on offensive path: enumeration, web exploitation, privilege escalation.", tags: ["Web", "PrivEsc", "Labs"], verify: "" },
    { name: "eJPT", issuer: "INE Security", status: "planned", date: "Next up", blurb: "Fully practical entry pentest exam - assess a live network end to end.", tags: ["Practical", "Networks"], verify: "" },
    { name: "CCNA", issuer: "Cisco", status: "planned", date: "Targeting 2026", blurb: "Routing, switching and network fundamentals - the layer everything else sits on.", tags: ["Routing", "Switching"], verify: "" },
    { name: "SC-900: Security Fundamentals", issuer: "Microsoft", status: "planned", date: "Planned", blurb: "Identity, compliance and security across the Microsoft cloud stack.", tags: ["Azure", "Identity"], verify: "" },
    { name: "AWS Certified Cloud Practitioner", issuer: "Amazon Web Services", status: "planned", date: "Planned", blurb: "Cloud literacy - services, shared responsibility model, billing and security basics.", tags: ["Cloud", "IAM"], verify: "" },
    { name: "Burp Suite Certified Practitioner", issuer: "PortSwigger", status: "planned", date: "Long term", blurb: "Proof of real web application testing skill, examined hands-on.", tags: ["Web AppSec", "OWASP"], verify: "" },
    { name: "CPTS", issuer: "Hack The Box", status: "planned", date: "Long term", blurb: "Full penetration testing engagement plus a professional report.", tags: ["Red Team", "Reporting"], verify: "" },
    { name: "OSCP", issuer: "OffSec", status: "planned", date: "The goal", blurb: "Twenty-four hours, a live network, and a report. The one worth the wait.", tags: ["Offensive", "Milestone"], verify: "" },
  ],

  /* ---------------------------------------------------------------------
     Roadmap. status: done | active | planned
     --------------------------------------------------------------------- */
  roadmap: [
    { when: "Foundation", title: "Learn to build before learning to break", status: "done", blurb: "Programming, data structures and the web stack - enough to write real software rather than just read about it.", items: ["C & Java fundamentals", "Data structures & algorithms", "React, HTTP and APIs", "Git and version control"] },
    { when: "Core Systems", title: "Understand the machine underneath", status: "done", blurb: "You cannot secure what you cannot explain. Operating systems, databases and networking, properly.", items: ["Operating systems internals", "DBMS & SQL", "TCP/IP and routing", "Linux as a daily driver"] },
    { when: "Now", title: "Security fundamentals & hands-on labs", status: "active", blurb: "Moving from theory to practice - cryptography, web exploitation and daily lab work, with the certifications that evidence it.", items: ["Cryptography & network security", "OWASP Top 10, hands-on", "TryHackMe / Hack The Box streak", "Google Cybersecurity & ISC2 CC"] },
    { when: "Next", title: "Prove it under exam conditions", status: "planned", blurb: "Practical, examined certifications plus projects big enough to be worth writing up.", items: ["Security+ and eJPT", "Build & publish security tooling", "Full penetration test write-ups", "First internship"] },
    { when: "Specialise", title: "Pick a side and go deep", status: "planned", blurb: "Offensive and defensive both matter, but depth beats breadth. Red team methodology, forensics and malware analysis.", items: ["Red team methodology", "Digital forensics & malware analysis", "Cloud security", "CPTS / BSCP"] },
    { when: "The Goal", title: "Security engineer, building and breaking", status: "planned", blurb: "Working professionally on systems that matter - with OSCP behind me and a body of public work in front.", items: ["OSCP", "Full-time security engineering", "Research worth publishing", "Give the notes back to the next student"] },
  ],

  /* ---------------------------------------------------------------------
     B.Tech study notes. `file` is a path under public/, e.g.
     "/notes/os-deadlocks.pdf". Empty means "coming soon".
     --------------------------------------------------------------------- */
  notes: [
    { sem: 1, subject: "Engineering Mathematics I", title: "Calculus & Matrices", tags: ["Limits", "Eigenvalues", "Integration"], file: "" },
    { sem: 1, subject: "Programming for Problem Solving", title: "C Fundamentals", tags: ["Pointers", "Arrays", "Recursion"], file: "" },
    { sem: 1, subject: "Engineering Physics", title: "Waves, Optics & Modern Physics", tags: ["Interference", "Lasers"], file: "" },
    { sem: 1, subject: "Basic Electrical Engineering", title: "Circuit Theory Essentials", tags: ["KVL / KCL", "Thevenin"], file: "" },
    { sem: 2, subject: "Engineering Mathematics II", title: "Differential Equations & Transforms", tags: ["Laplace", "Fourier"], file: "" },
    { sem: 2, subject: "Data Structures", title: "Linear & Non-Linear Structures", tags: ["Stacks", "Trees", "Graphs"], file: "" },
    { sem: 2, subject: "Engineering Chemistry", title: "Bonding, Polymers & Corrosion", tags: ["Electrochemistry"], file: "" },
    { sem: 2, subject: "Environmental Science", title: "Ecosystems & Pollution Control", tags: ["Sustainability"], file: "" },
    { sem: 3, subject: "Discrete Mathematics", title: "Logic, Sets & Graph Theory", tags: ["Proofs", "Relations", "Combinatorics"], file: "" },
    { sem: 3, subject: "Object Oriented Programming", title: "Java & OOP Principles", tags: ["Inheritance", "Collections", "Exceptions"], file: "" },
    { sem: 3, subject: "Digital Logic Design", title: "Gates to Sequential Circuits", tags: ["K-Map", "Flip-Flops"], file: "" },
    { sem: 3, subject: "Computer Organization", title: "CPU, Memory & Pipelining", tags: ["Cache", "Addressing Modes"], file: "" },
    { sem: 4, subject: "Operating Systems", title: "Processes, Scheduling & Deadlocks", tags: ["Semaphores", "Paging", "Deadlock"], file: "" },
    { sem: 4, subject: "DBMS", title: "Relational Model to Transactions", tags: ["SQL", "Normalisation", "ACID"], file: "" },
    { sem: 4, subject: "Design & Analysis of Algorithms", title: "Complexity & Strategy", tags: ["Greedy", "DP", "Big-O"], file: "" },
    { sem: 4, subject: "Computer Networks", title: "OSI, TCP/IP & Routing", tags: ["Subnetting", "TCP", "DNS"], file: "" },
    { sem: 5, subject: "Cryptography & Network Security", title: "Ciphers, Keys & Protocols", tags: ["AES", "RSA", "TLS", "Hashing"], file: "" },
    { sem: 5, subject: "Software Engineering", title: "SDLC, Agile & Testing", tags: ["UML", "Scrum"], file: "" },
    { sem: 5, subject: "Theory of Computation", title: "Automata, Grammars & Turing Machines", tags: ["DFA", "CFG", "Pumping Lemma"], file: "" },
    { sem: 5, subject: "Web Technologies", title: "Frontend, Backend & REST", tags: ["React", "HTTP", "APIs"], file: "" },
    { sem: 6, subject: "Ethical Hacking", title: "Recon to Post-Exploitation", tags: ["Nmap", "Burp Suite", "OWASP Top 10"], file: "" },
    { sem: 6, subject: "Cloud Computing", title: "Virtualisation & Service Models", tags: ["IaaS", "Containers", "IAM"], file: "" },
    { sem: 6, subject: "Machine Learning", title: "Supervised & Unsupervised Learning", tags: ["Regression", "SVM", "Clustering"], file: "" },
    { sem: 6, subject: "Compiler Design", title: "Lexical Analysis to Code Generation", tags: ["Parsing", "SDT"], file: "" },
    { sem: 7, subject: "Digital Forensics", title: "Evidence, Imaging & Chain of Custody", tags: ["Autopsy", "Volatility", "Artifacts"], file: "" },
    { sem: 7, subject: "Malware Analysis", title: "Static & Dynamic Analysis", tags: ["Sandboxing", "IOCs", "Reversing"], file: "" },
    { sem: 7, subject: "Cyber Law & Ethics", title: "IT Act, Privacy & Compliance", tags: ["GDPR", "IT Act 2000"], file: "" },
    { sem: 7, subject: "Big Data Analytics", title: "Distributed Processing", tags: ["Hadoop", "Spark"], file: "" },
    { sem: 8, subject: "Security Operations", title: "SOC Workflow & SIEM", tags: ["Splunk", "Triage", "MITRE ATT&CK"], file: "" },
    { sem: 8, subject: "Advanced Penetration Testing", title: "Red Team Methodology", tags: ["Active Directory", "Pivoting", "Reporting"], file: "" },
    { sem: 8, subject: "Major Project", title: "Research, Build & Defend", tags: ["Thesis", "Documentation"], file: "" },
  ],
};

export default defaults;
