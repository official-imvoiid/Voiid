/**
 * Topic roadmaps - the study guides listed on /roadmap and drawn as a graph
 * at /roadmap/:slug.
 *
 * ---------------------------------------------------------------------------
 * EDITING
 *
 * One object per guide. The graph is a spine running top to bottom; each
 * section sits on it in order:
 *
 *   label - the small heading printed on the spine
 *   main  - the highlighted node(s) on the spine (usually one or two)
 *   left  - topics hanging off the left side
 *   right - topics hanging off the right side
 *
 * Layout, curves and heights are all worked out from this, so adding a topic
 * is just adding a string.
 * ---------------------------------------------------------------------------
 */

const roadmapGuides = [
  {
    slug: "cpp",
    title: "C++",
    blurb: "From your first program to templates, idioms, tooling and the library ecosystem.",
    sections: [
      {
        label: "Getting Started",
        main: ["Introduction to Language", "Setting up your Environment"],
        left: ["What is C++?", "Why use C++", "C vs C++"],
        right: ["Installing C++", "Code Editors / IDEs", "Running your First Program"],
      },
      {
        label: "Basics",
        main: ["Basic Operations", "Control Flow & Statements"],
        left: ["Arithmetic Operators", "Logical Operators", "Bitwise Operators"],
        right: ["if else / switch / goto", "for / while / do while loops"],
      },
      {
        label: "Core Language",
        main: ["Data Types", "Functions"],
        left: ["Static Typing", "Dynamic Typing", "RTTI"],
        right: ["Operator Overloading", "Lambdas", "Static Polymorphism", "Function Overloading"],
      },
      {
        label: "Memory",
        main: ["Pointers and References"],
        left: ["References", "Memory Model", "Lifetime of Objects", "Raw Pointers", "New/Delete Operators", "Memory Leakage"],
        right: ["Smart Pointers", "weak_ptr", "shared_ptr", "unique_ptr"],
      },
      {
        label: "Code Organisation",
        main: ["Structuring Codebase"],
        left: ["Forward Declaration", "Headers / CPP Files"],
        right: ["Namespaces", "Scope"],
      },
      {
        label: "Object Oriented",
        main: ["Structures and Classes", "Object Oriented Programming"],
        left: ["Rule of Zero, Five, Three", "Multiple Inheritance", "Diamond Inheritance"],
        right: ["Virtual Methods", "Virtual Tables", "Dynamic Polymorphism"],
      },
      {
        label: "Language Concepts",
        main: ["Language Concepts", "Exception Handling"],
        left: [
          "auto (Automatic Type Deduction)", "Type Casting", "static_cast", "const_cast", "dynamic_cast",
          "reinterpret_cast", "Undefined Behavior (UB)", "Argument Dependent Lookup (ADL)", "Name Mangling", "Macros",
        ],
        right: ["Exit Codes", "Exceptions", "Access Violations"],
      },
      {
        label: "Standard Library",
        main: ["Standard Library + STL", "Templates"],
        left: ["Iterators", "Algorithms", "Multithreading", "iostream", "Date / Time", "Containers"],
        right: [
          "Variadic Templates", "Template Specialization", "Full Template Specialization",
          "Partial Template Specialization", "Type Traits", "SFINAE",
        ],
      },
      {
        label: "Idioms & Standards",
        main: ["Idioms", "Standards"],
        left: ["Non-Copyable / Non-Moveable", "Erase-Remove", "Copy and Swap", "Copy on Write", "RAII", "Pimpl", "CRTP"],
        right: ["C++ 11 / 14", "C++ 17", "C++ 20", "Newest", "C++ 0x"],
      },
      {
        label: "Language Tools",
        main: ["Debuggers", "Compilers"],
        left: ["Debugging Symbols", "Understanding Debugger Messages", "WinDBg", "GDB"],
        right: ["Compiler Stages", "Compilers and Features", "Clang / LLVM", "Intel C++", "MSVC C++", "GCC", "MinGW"],
      },
      {
        label: "Building",
        main: ["Build Systems", "Package Managers"],
        left: ["CMake", "Makefile", "Ninja"],
        right: ["vcpkg", "Spack", "Conan", "NuGet"],
      },
      {
        label: "Libraries",
        main: ["Working with Libraries"],
        left: ["Licensing", "Library Inclusion", "gtest / gmock", "Qt", "Catch2", "Orbit Profiler", "PyTorch C++"],
        right: ["Boost", "OpenCV", "POCO", "Tensorflow", "protobuf", "spdlog", "gRPC", "pybind11", "fmt", "opencl", "ranges_v3"],
      },
    ],
  },

  {
    slug: "javascript",
    title: "JavaScript",
    blurb: "The language from variables and types up to async code, modules, memory and DevTools.",
    sections: [
      {
        label: "Introduction",
        main: ["Introduction to JavaScript", "All about Variables"],
        left: ["What is JavaScript", "History of JavaScript", "JavaScript Versions", "How to run JavaScript"],
        right: ["Variable Declarations", "var / let / const", "Hoisting", "Variable Naming Rules", "Variable Scopes", "Block / Function / Global"],
      },
      {
        label: "Data Types",
        main: ["Data Types", "Type Casting"],
        left: ["string", "number", "boolean", "undefined", "bigint", "null", "Symbol"],
        right: [
          "Object", "typeof operator", "Object Prototype", "Prototypal Inheritance", "Built-in Objects",
          "Type Conversion vs Coercion", "Implicit Type Casting", "Explicit Type Casting",
        ],
      },
      {
        label: "Data Structures",
        main: ["Data Structures", "Equality Comparisons"],
        left: ["Structured Data", "JSON", "Keyed Collections", "Map", "Weak Map", "Set", "Weak Set", "Indexed Collections", "Arrays", "Typed Arrays"],
        right: ["==", "===", "Object.is", "isLooselyEqual", "isStrictlyEqual", "SameValueZero", "SameValue"],
      },
      {
        label: "Control Flow",
        main: ["Loops and Iterations", "Control Flow"],
        left: ["for", "do...while", "while", "break / continue", "for...of loop", "for...in loop"],
        right: ["Conditional Statements", "if...else", "Switch", "Exceptional Handling", "throw statement", "try/catch/finally", "Error Objects"],
      },
      {
        label: "Expressions & Functions",
        main: ["Expressions & Operators", "Functions"],
        left: [
          "Assignment Operators", "Comparison Operators", "Arithmetic Operators", "Bitwise Operators", "Logical Operators",
          "BigInt Operators", "String Operators", "Conditional Operators", "Comma Operators", "Unary Operators",
        ],
        right: [
          "Function Parameters", "Default Params", "Rest", "Arrow Functions", "IIFEs", "arguments object",
          "Scope & Function Stack", "Recursion", "Lexical Scoping", "Closures", "Built-in Functions",
        ],
      },
      {
        label: "The this Keyword",
        main: ["DOM APIs", "Strict Mode", "Using (this) keyword"],
        left: ["in a method", "in a function", "using it alone", "in event handlers", "in arrow functions"],
        right: ["Function Borrowing", "Explicit Binding", "call", "apply", "bind"],
      },
      {
        label: "Asynchronous",
        main: ["Asynchronous JavaScript", "Working with APIs"],
        left: ["Event Loop", "setTimeout", "setInterval", "Callbacks", "Callback Hell", "Promises", "async/await"],
        right: ["XMLHTTPRequest", "Fetch"],
      },
      {
        label: "Modules & Memory",
        main: ["Modules in JavaScript", "Memory Management"],
        left: ["CommonJS", "ESM", "Classes", "Iterators and Generators"],
        right: ["Memory Lifecycle", "Garbage Collection"],
      },
      {
        label: "Debugging",
        main: ["Using Browser DevTools"],
        left: ["Debugging Issues", "Debugging Memory Leaks"],
        right: ["Debugging Performance"],
      },
    ],
  },

  {
    slug: "nodejs",
    title: "Node.js",
    blurb: "Server-side JavaScript: npm, async, files, CLIs, APIs, databases, testing and production.",
    sections: [
      {
        label: "Introduction",
        main: ["Introduction to Node.js", "Modules"],
        left: ["What is Node.js?", "Why use Node.js?", "History of Node.js", "Node.js vs Browser", "Running Node.js Code"],
        right: ["CommonJS", "ESM", "Creating & Importing", "[global] keyword"],
      },
      {
        label: "Packages",
        main: ["npm"],
        left: ["Global Installation", "Local Installation", "Updating Packages", "Running Scripts"],
        right: ["npx", "Semantic Versioning", "npm workspaces", "Creating Packages"],
      },
      {
        label: "Errors",
        main: ["Error Handling"],
        left: ["System Errors", "User Specified Errors", "Assertion Errors", "JavaScript Errors"],
        right: ["Uncaught Exceptions", "Handling Async Errors", "Callstack / Stack Trace", "Using Debugger"],
      },
      {
        label: "Async",
        main: ["Async Programming"],
        left: ["Promises", "async/await", "Callbacks", "setTimeout", "setInterval", "setImmediate", "process.nextTick"],
        right: ["Event Emitter", "Event Loop"],
      },
      {
        label: "Files",
        main: ["Working with Files"],
        left: ["__dirname", "__filename", "process.cwd()", "path module", "fs module"],
        right: ["glob", "globby", "fs-extra", "chokidar"],
      },
      {
        label: "Command Line",
        main: ["Command Line Apps"],
        left: ["Exiting / Exit Codes", "process.env", "dotenv package", "process.argv", "commander", "process.stdin"],
        right: ["Inquirer Package", "prompts package", "stdout / stderr", "chalk package", "figlet package", "cli-progress"],
      },
      {
        label: "APIs",
        main: ["Building & Consuming APIs"],
        left: ["Express.js", "fastify", "NestJS", "Hono", "jsonwebtoken", "passport.js"],
        right: ["http module", "axios", "ky", "fetch", "got package"],
      },
      {
        label: "Dev Workflow",
        main: ["Monitor Changes (Dev)", "Template Engines"],
        left: ["--watch", "nodemon"],
        right: ["ejs", "pug", "marko"],
      },
      {
        label: "Databases",
        main: ["Working with Databases"],
        left: ["Mongoose", "Prisma (NoSQL)", "Native Drivers (NoSQL)"],
        right: ["Drizzle", "TypeORM", "Knex", "Sequelize", "Prisma (SQL)", "Native Drivers (SQL)"],
      },
      {
        label: "Testing & Logging",
        main: ["Testing", "Logging"],
        left: ["Vitest", "Jest", "node:test", "Cypress", "Playwright"],
        right: ["Winston", "Morgan"],
      },
      {
        label: "Production",
        main: ["Keep app Running", "Threads", "Streams"],
        left: ["pm2"],
        right: ["Child Process", "Cluster", "Worker Threads"],
      },
      {
        label: "Debugging",
        main: ["Debugging", "Common Built-in Modules"],
        left: ["Memory Leaks", "Garbage Collection"],
        right: ["node --inspect", "Using APM"],
      },
    ],
  },

  {
    slug: "python",
    title: "Python",
    blurb: "Basics, data structures, OOP, packaging, frameworks, concurrency, typing and testing.",
    sections: [
      {
        label: "Basics",
        main: ["Learn the Basics"],
        left: ["Basic Syntax", "Variables and Data Types", "Conditionals", "Loops", "Type Casting", "Exceptions"],
        right: ["Functions, Builtin Functions", "Lists", "Tuples", "Sets", "Dictionaries"],
      },
      {
        label: "Algorithms",
        main: ["Data Structures & Algorithms"],
        left: ["Arrays and Linked Lists", "Hash Tables", "Heaps, Stacks and Queues"],
        right: ["Binary Search Tree", "Recursion", "Sorting Algorithms"],
      },
      {
        label: "Beyond the Basics",
        main: ["Modules", "Lambdas", "Decorators"],
        left: ["Builtin Modules", "Custom Modules"],
        right: ["Iterators", "Regular Expressions"],
      },
      {
        label: "Object Oriented",
        main: ["Object Oriented Programming"],
        left: ["Classes", "Inheritance"],
        right: ["Methods, Dunder"],
      },
      {
        label: "Packaging",
        main: ["Package Managers", "Common Packages"],
        left: ["PyPI", "Pip", "Conda", "uv", "Poetry"],
        right: ["pyproject.toml", "List Comprehensions", "Generator Expressions", "Paradigms", "Context Manager"],
      },
      {
        label: "Frameworks",
        main: ["Learn a Framework"],
        left: ["Plotly Dash", "Pyramid", "gevent", "aiohttp", "Tornado", "Sanic"],
        right: ["FastAPI", "Django", "Flask"],
      },
      {
        label: "Concurrency",
        main: ["Concurrency"],
        left: ["Multiprocessing", "Asynchrony"],
        right: ["GIL", "Threading"],
      },
      {
        label: "Typing",
        main: ["Environments", "Static Typing"],
        left: ["Pipenv", "virtualenv", "pyenv"],
        right: ["typing", "mypy", "pyright", "pyre", "Pydantic"],
      },
      {
        label: "Code Quality",
        main: ["Code Formatting", "Documentation", "Testing"],
        left: ["yapf", "black", "ruff", "Sphinx"],
        right: ["tox", "nose", "unittest / pyUnit", "doctest", "pytest"],
      },
    ],
  },

  {
    slug: "cyber-security",
    title: "Cyber Security",
    blurb: "IT and networking fundamentals through security concepts, attacks, incident response and cloud.",
    sections: [
      {
        label: "Fundamentals",
        main: ["Fundamental IT Skills"],
        left: [
          "Computer Hardware Components", "Connection Types and their function", "OS-Independent Troubleshooting",
          "Understand Basics of Popular Suites", "Basics of Computer Networking",
        ],
        right: ["NFC", "WiFi", "Bluetooth", "Infrared", "MS Office Suite", "iCloud", "Google Suite"],
      },
      {
        label: "Operating Systems",
        main: ["Operating Systems"],
        left: ["Windows", "Linux", "MacOS"],
        right: [
          "Installation and Configuration", "Different Versions and Differences", "Navigating using GUI and CLI",
          "Understand Permissions", "Installing Software and Applications", "Performing CRUD on Files",
          "Troubleshooting", "Common Commands",
        ],
      },
      {
        label: "Networking",
        main: ["Networking Knowledge"],
        left: [
          "Understand the OSI Model", "Common Protocols and their Uses", "Common Ports and their Uses",
          "SSL and TLS Basics", "Basics of NAS and SAN", "Basics of Subnetting", "Public vs Private IP Addresses",
        ],
        right: ["localhost", "loopback", "CIDR", "subnet mask", "default gateway", "MAN / LAN / WAN / WLAN", "Star / Ring / Mesh / Bus"],
      },
      {
        label: "Network Terms",
        main: ["Understand the Terminology", "Network Protocols"],
        left: ["VLAN", "DMZ", "ARP", "VM", "DHCP", "DNS", "NAT", "IP", "Router", "Switch", "VPN", "NTP", "IPAM"],
        right: ["SSH", "RDP", "FTP", "SFTP", "HTTP / HTTPS", "SSL / TLS"],
      },
      {
        label: "Virtualization & Tools",
        main: ["Virtualization", "Troubleshooting Tools"],
        left: ["VMWare", "VirtualBox", "esxi", "proxmox", "Hypervisor", "GuestOS", "HostOS", "VM"],
        right: [
          "ipconfig", "ping", "dig", "netstat", "route", "nmap", "tcpdump", "arp", "tracert", "nslookup",
          "iptables", "Packet Sniffers", "Port Scanners", "Protocol Analyzers",
        ],
      },
      {
        label: "Authentication",
        main: ["Authentication Methodologies"],
        left: ["Kerberos", "RADIUS", "LDAP"],
        right: ["SSO", "Certificates", "Local Auth"],
      },
      {
        label: "Security Skills",
        main: ["Security Skills and Knowledge"],
        left: [
          "Understand Common Hacking Tools", "Understand Common Exploit Frameworks", "Understand Concept of Defense in Depth",
          "Understand Concept of Runbooks", "Understand Basics of Forensics", "Basics and Concepts of Threat Hunting",
          "Basics of Vulnerability Management", "Basics of Reverse Engineering", "Penetration Testing Rules of Engagement",
          "Perimiter vs DMZ vs Segmentation",
        ],
        right: [
          "Blue / Red / Purple Teams", "False Negative / False Positive", "True Negative / True Positive",
          "Basics of Threat Intel, OSINT", "Understand Handshakes", "Understand CIA Triad", "Privilege Escalation",
          "Web Based Attacks and OWASP10", "Learn how Malware works and Types",
        ],
      },
      {
        label: "Security Concepts",
        main: ["Core Security Concepts"],
        left: [
          "Core Concepts of Zero Trust", "Roles of Compliance and Auditors", "Understand the Definition of Risk",
          "Understand Backups and Resiliency", "Cyber Kill Chain",
        ],
        right: [
          "MFA & 2FA", "Honeypots", "Operating System Hardening", "Understand Concept of Isolation",
          "Basics of IDS and IPS", "Authentication vs Authorization",
        ],
      },
      {
        label: "Tools & Standards",
        main: ["Incident Response & Discovery Tools", "Common Standards"],
        left: [
          "dig", "nmap", "ping", "arp", "cat", "dd", "tail", "hping", "head", "grep", "nslookup", "tracert",
          "winhex", "autopsy", "ipconfig", "curl", "wireshark", "memdump", "FTK Imager",
        ],
        right: ["ISO", "RMF", "NIST", "CIS", "CSF", "LOLBAS", "GTFOBINS", "WADCOMS"],
      },
      {
        label: "Cryptography",
        main: ["Basics of Cryptography", "Frameworks & Distros"],
        left: ["Salting", "Hashing", "Key Exchange", "Private vs Public Keys", "PKI", "Obfuscation"],
        right: ["Diamond Model", "Kill Chain", "ATT&CK", "ParrotOS", "Kali Linux"],
      },
      {
        label: "Logs & Hardening",
        main: ["Logs to Find and Use", "Hardening Concepts"],
        left: ["Event Logs", "syslogs", "netflow", "Packet Captures", "Firewall Logs", "SIEM", "SOAR"],
        right: [
          "MAC-based", "NAC-based", "Port Blocking", "Group Policy", "Sinkholes", "ACLs", "Patching",
          "Jump Server", "Endpoint Security",
        ],
      },
      {
        label: "Protocols & Terms",
        main: ["Secure vs Unsecure Protocols", "Security Terms"],
        left: ["FTP vs SFTP", "SSL vs TLS", "IPSEC", "DNSSEC", "LDAPS", "SRTP", "S/MIME"],
        right: [
          "Antivirus", "Antimalware", "EDR", "DLP", "Firewall & Nextgen Firewall", "HIPS", "NIDS", "NIPS",
          "Host Based Firewall", "Sandboxing", "EAP vs PEAP", "WPS", "ACL", "WPA vs WPA2 vs WPA3 vs WEP",
        ],
      },
      {
        label: "Incident Response",
        main: ["Incident Response Process", "Threat Classification"],
        left: ["Preparation", "Identification", "Containment", "Eradication", "Recovery", "Lessons Learned"],
        right: ["Zero Day", "Known vs Unknown", "APT"],
      },
      {
        label: "Tools & Audience",
        main: ["Common Tools", "Understand Audience"],
        left: ["VirusTotal", "urlscan", "any.run", "Joe Sandbox", "urlvoid", "WHOIS"],
        right: ["Stakeholders", "HR", "Legal", "Compliance", "Management"],
      },
      {
        label: "Attack Types",
        main: ["Attack Types and Differences"],
        left: [
          "Phishing", "Whishing", "Whaling", "Smishing", "Spam vs Spim", "Shoulder Surfing", "Tailgating",
          "Dumpster Diving", "Zero day", "Social Engineering",
        ],
        right: [
          "Reconnaissance", "Impersonation", "Watering Hole Attack", "Drive by Attack", "Typo Squatting",
          "Brute Force vs Password Spray",
        ],
      },
      {
        label: "Common Attacks",
        main: ["Common Attacks"],
        left: ["DoS vs DDoS", "MITM", "CSRF", "Spoofing", "SQL Injection", "XSS", "Evil Twin", "VLAN Hopping"],
        right: [
          "DNS Poisoning", "Deauth Attack", "Replay Attack", "Rogue Access Point", "Buffer Overflow",
          "Memory Leak", "Pass the Hash", "Directory Traversal",
        ],
      },
      {
        label: "Cloud",
        main: ["Cloud Skills and Knowledge"],
        left: [
          "Understand the Concept of Security in the Cloud", "Understand the differences between cloud and on-premises",
          "Understand the concept of Infrastructure as Code", "Understand the Concept of Serverless",
          "Understand the basics and general flow of deploying in the cloud",
        ],
        right: ["SaaS", "PaaS", "IaaS", "Private Cloud", "Public Cloud", "Hybrid Cloud"],
      },
      {
        label: "Cloud Platforms",
        main: ["Cloud Environments", "Cloud Storage"],
        left: ["AWS", "GCP", "Azure"],
        right: ["S3", "Dropbox", "iCloud", "Box", "OneDrive", "Google Drive"],
      },
      {
        label: "Programming",
        main: ["Programming Skills"],
        left: ["Python", "Go", "JavaScript"],
        right: ["C++", "Bash", "Power Shell"],
      },
      {
        label: "Practice & Certifications",
        main: ["CTFs (Capture the Flag)", "Certifications"],
        left: ["HackTheBox", "TryHackMe", "VulnHub", "picoCTF", "SANS Holiday Hack Challenge"],
        right: [
          "CompTIA A+", "CompTIA Linux+", "CompTIA Network+", "CCNA", "CompTIA Security+", "CEH", "CISA",
          "CISM", "GSEC", "GPEN", "GWAPT", "GIAC", "OSCP", "CREST", "CISSP",
        ],
      },
    ],
  },

  {
    slug: "philosophy",
    title: "Philosophy",
    blurb: "Step by step through Western philosophy, from the first Greeks to logic, knowledge, mind and justice.",
    sections: [
      {
        label: "Introduction",
        main: ["Nature of Philosophy", "Ancient Origins"],
        left: [
          "Mythos versus logos", "Early cosmological questions", "The Milesian school", "Pythagorean traditions",
          "Heraclitus and flux", "Parmenides and being", "The pluralist thinkers",
        ],
        right: [
          "Definition of philosophy", "Philosophical inquiry methods", "The role of wonder",
          "Critical thinking foundations", "Philosophical wonder", "The value of wisdom", "Overview of major branches",
        ],
      },
      {
        label: "Ancient Greek",
        main: ["Classical Period", "Hellenistic Schools"],
        left: [
          "Epicureanism and pleasure", "Stoicism and control", "Cynicism and society", "Skepticism and doubt",
          "Neo Platonism origins", "Plotinus and the one", "Hellenistic worldview shifts",
        ],
        right: [
          "Socrates and the method", "Socratic irony", "Plato and the forms", "The allegory of the cave",
          "Aristotle and categorization", "Virtue ethics foundations", "The Academy and Lyceum",
        ],
      },
      {
        label: "Medieval Era",
        main: ["Patristic Philosophy", "Scholasticism"],
        left: [
          "Thomas Aquinas synthesis", "The five ways", "Nominalism versus realism", "William of Ockham",
          "Duns Scotus thought", "University system origins", "Disputed questions method",
        ],
        right: [
          "Faith and reason relation", "Augustine of Hippo", "Problem of evil", "Divine illumination theory",
          "Boethius and consolation", "Early Christian apologetics", "Neo Platonic influence",
        ],
      },
      {
        label: "Early Modern",
        main: ["Rationalism", "Empiricism"],
        left: [
          "Francis Bacon induction", "John Locke tabula rasa", "George Berkeley idealism", "David Hume skepticism",
          "The induction problem", "Association of ideas", "British empiricism traits",
        ],
        right: [
          "Rene Descartes doubt", "Cartesian dualism", "Baruch Spinoza monism", "Gottfried Wilhelm Leibniz",
          "Continental rationalism traits", "Innate ideas debate", "Mind body problem",
        ],
      },
      {
        label: "Enlightenment",
        main: ["Political Thought", "Critical Philosophy"],
        left: [
          "Immanuel Kant synthesis", "Transcendental idealism", "Categorical imperative", "Critique of pure reason",
          "Phenomenal versus noumenal", "Aesthetics in Kant", "Moral duty foundations",
        ],
        right: [
          "Thomas Hobbes leviathan", "Social contract theories", "John Locke rights", "Jean Jacques Rousseau",
          "Montesquieu separation of powers", "Enlightenment ideals", "Justification of authority",
        ],
      },
      {
        label: "Nineteenth Century",
        main: ["German Idealism", "Existential Roots"],
        left: [
          "Soren Kierkegaard leap", "Arthur Schopenhauer pessimism", "Friedrich Nietzsche critique", "Will to power",
          "Critique of morality", "Death of God concept", "Early existential themes",
        ],
        right: [
          "Johann Gottlieb Fichte", "Friedrich Wilhelm Schelling", "Georg Wilhelm Friedrich Hegel", "Dialectical method",
          "Absolute idealism", "Phenomenology of spirit", "Legacy of idealism",
        ],
      },
      {
        label: "Contemporary",
        main: ["Analytic Philosophy", "Continental Philosophy"],
        left: [
          "Edmund Husserl phenomenology", "Martin Heidegger being", "Jean Paul Sartre existentialism",
          "Albert Camus absurdism", "Structuralism movement", "Poststructuralism critique", "Jacques Derrida deconstruction",
        ],
        right: [
          "Gottlob Frege logic", "Bertrand Russell analysis", "Logical positivism", "Ludwig Wittgenstein early",
          "Ordinary language philosophy", "Willard Van Orman Quine", "Linguistic turn impact",
        ],
      },
      {
        label: "Logic",
        main: ["Formal Logic", "Informal Logic"],
        left: [
          "Fallacy identification", "Deductive reasoning types", "Inductive reasoning forms", "Abductive reasoning methods",
          "Critical reading skills", "Argument mapping techniques", "Rhetorical devices analysis",
        ],
        right: [
          "Propositional logic syntax", "Truth tables creation", "Predicate logic rules", "Logical connectives usage",
          "Formal proofs construction", "Soundness and completeness", "First order logic",
        ],
      },
      {
        label: "Epistemology",
        main: ["Theory of Knowledge", "Justification"],
        left: [
          "Foundationalism structures", "Coherentism systems", "Infinitism theories", "Epistemic internalism",
          "Reliabilism accounts", "Social epistemology", "Virtue epistemology",
        ],
        right: [
          "Definition of knowledge", "Justified true belief", "Gettier problem cases", "Internalism versus externalism",
          "Evidentialism in belief", "Perceptual knowledge issues", "A priori knowledge",
        ],
      },
      {
        label: "Metaphysics",
        main: ["Reality and Being", "Philosophy of Mind"],
        left: [
          "Mind body interaction", "Consciousness studies", "Personal identity criteria", "Intentionality concept",
          "Physicalism versus dualism", "Functionalism theory", "Artificial intelligence minds",
        ],
        right: [
          "Nature of existence", "Ontology foundations", "Universals and particulars", "Identity and change",
          "Persistence through time", "Possible worlds theory", "Free will debate",
        ],
      },
      {
        label: "Political and Social",
        main: ["State and Justice"],
        left: ["Distributive justice theories", "John Rawls fairness", "Robert Nozick libertarianism", "Karl Marx critique"],
        right: ["Feminist political philosophy", "Multiculturalism debates", "Human rights foundations"],
      },
    ],
  },

  {
    slug: "video-editing-vfx",
    title: "Video Editing and Visual Effects",
    blurb: "From your first cut to colour, sound, motion graphics, compositing, VFX and delivery.",
    sections: [
      {
        label: "Introduction to Editing",
        main: ["Video Editing Basics", "Editing Terminology"],
        left: [
          "What editing is for", "Film language basics", "Shot types and sizes", "Frame rates",
          "Resolution and aspect ratio", "Codecs and containers", "Choosing an editor",
        ],
        right: [
          "Timeline management", "Cutting techniques", "Trimming clips", "Sequences and bins",
          "Keyboard shortcuts", "Project settings", "Proxy files",
        ],
      },
      {
        label: "Editing Techniques",
        main: ["Story and Structure", "Continuity Editing"],
        left: [
          "Three act structure", "Pacing and rhythm", "Cutting on action", "J cuts and L cuts", "Match cuts",
          "Montage", "B-roll coverage",
        ],
        right: [
          "The 180 degree rule", "Eyeline match", "Shot reverse shot", "Jump cuts", "Cross cutting",
          "Transitions", "Screen direction",
        ],
      },
      {
        label: "Audio",
        main: ["Sound Editing", "Audio Mixing"],
        left: ["Dialogue cleanup", "Room tone", "Noise reduction", "Sound effects and foley", "Music editing", "Voice over"],
        right: ["Audio levels and LUFS", "EQ and compression", "Panning", "Ducking", "Audio sync", "Stems and export"],
      },
      {
        label: "Colour",
        main: ["Color Correction", "Color Grading"],
        left: [
          "Waveform and vectorscope", "White balance", "Exposure and contrast", "Shot matching", "Log footage",
          "Color spaces",
        ],
        right: ["LUTs", "Primary grades", "Secondary grades and masks", "Skin tones", "Creating a look", "HDR basics"],
      },
      {
        label: "Motion Graphics",
        main: ["Titles and Text", "Keyframe Animation"],
        left: ["Typography on screen", "Lower thirds", "Kinetic typography", "Templates", "Safe areas"],
        right: ["Easing and graph editor", "Shape layers", "Masks and mattes", "Parenting and nulls", "Expressions"],
      },
      {
        label: "Compositing",
        main: ["Compositing", "Keying"],
        left: ["Layers and blend modes", "Alpha channels", "Rotoscoping", "Clean plates", "Node based compositing"],
        right: ["Green screen shooting", "Chroma keying", "Spill suppression", "Edge refinement", "Light wrap"],
      },
      {
        label: "Visual Effects",
        main: ["Tracking", "VFX Techniques"],
        left: ["Point tracking", "Planar tracking", "3D camera tracking", "Stabilization", "Match moving"],
        right: [
          "Set extensions", "Wire and object removal", "Screen replacement", "Particles and simulations",
          "Muzzle flashes and sparks", "Sky replacement",
        ],
      },
      {
        label: "3D and Advanced",
        main: ["3D Integration", "Advanced VFX"],
        left: ["3D basics for editors", "Modeling and texturing", "Lighting and HDRI", "Render passes"],
        right: ["Multipass compositing", "Depth of field and motion blur", "Digital matte painting", "CG integration"],
      },
      {
        label: "Tools",
        main: ["Editing Software", "VFX Software"],
        left: ["Premiere Pro", "DaVinci Resolve", "Final Cut Pro", "Avid Media Composer", "CapCut"],
        right: ["After Effects", "Fusion", "Nuke", "Blender", "Mocha Pro"],
      },
      {
        label: "Delivery",
        main: ["Export and Delivery", "Workflow"],
        left: ["Export settings", "Bitrate and compression", "Platform specs", "Captions and subtitles", "Archiving"],
        right: ["Media management", "Collaboration and review", "Version control for projects", "Building a showreel"],
      },
    ],
  },
];

/* every topic on a guide, spine nodes included - used for counts */
export const topicCount = (guide) =>
  guide.sections.reduce((n, s) => n + s.main.length + s.left.length + s.right.length, 0);

export default roadmapGuides;
