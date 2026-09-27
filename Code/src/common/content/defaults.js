import POEMS from "./poems";

/**
 * defaults.js - every editable piece of the site, in one place.
 *
 * This is the shipped content. The admin portal never writes here: its
 * saves go to server.js (data/content.json) and are layered on top, so this
 * file stays the known-good baseline.
 *
 * Adding a new editable section:
 *   1. add it here
 *   2. add a matching entry to SECTIONS in src/common/pages/admin/schema.js
 *   3. add its key to CONTENT_SECTIONS in server.js
 *   4. read it in the component with useContent()
 */

const defaults = {
  /* ---------------------------------------------------------------------
     Outbound links. Several of these were href="#" placeholders on the
     home page - they are editable now rather than hardcoded.
     --------------------------------------------------------------------- */
  links: {
    discord: "",
    article: "",
    github: "https://github.com/official-imvoiid",   // also feeds the Develop map
    instagram: "https://www.instagram.com/voiid.ae/",   // the "3D & Editing" tile
    research: "",
    hackthebox: "https://app.hackthebox.com/",   // the "CyberSecurity" tile
    huggingface: "https://huggingface.co/",      // the "AI Models" tile
    cv: "",                                     // uploaded in the admin (Links > CV)
  },

  /* Develop map: repos left off the map, one name per line. The profile
     README repo (named after the account) is always left off. */
  develop: {
    hidden: "CivitFetch\nTEXT2IMG",
  },

  /* Footer icons, in order. platform = one of the keys in
     src/common/content/platforms.js; with an empty url the icon still shows,
     just not as a link (home/Footer.jsx). */
  social: [
    { platform: "instagram", url: "https://www.instagram.com/voiid.ae/" },
    { platform: "linkedin", url: "" },
    { platform: "pinterest", url: "" },
    { platform: "github", url: "" },
    { platform: "reddit", url: "" },
    { platform: "youtube", url: "" },
    { platform: "civitai", url: "" },
  ],

  /* ---------------------------------------------------------------------
     Skill-Set page
     --------------------------------------------------------------------- */
  skills: [
    { icon: "⚙️", logo: "/images/skills/kali-linux.svg", color: "auto", label: "Kali Linux & Cybersecurity" },
    { icon: "🐍", logo: "/images/skills/python.svg", color: "auto", label: "Python Development" },
    { icon: "🌐", logo: "/images/skills/web-development.svg", color: "auto", label: "Web Development (HTML, CSS, JavaScript, React, Node.js)" },
    { icon: "🚀", logo: "/images/skills/open-source.svg", color: "auto", label: "Open-Source Contribution" },
    { icon: "🔍", logo: "/images/skills/debugging.svg", color: "auto", label: "Debugging & Troubleshooting" },
    { icon: "📖", logo: "/images/skills/research.svg", color: "auto", label: "Active Learning & Research" },
    { icon: "📡", logo: "/images/skills/pentesting.svg", color: "auto", label: "Penetration Testing & Ethical Hacking" },
    { icon: "🔧", logo: "/images/skills/automation.svg", color: "auto", label: "Automation & Scripting (Bash, PowerShell)" },
    { icon: "🔑", logo: "/images/skills/cryptography.svg", color: "auto", label: "Cryptography & Secure Coding" },
    { icon: "🎬", logo: "/images/skills/video-editing.svg", color: "auto", label: "Video Editing & Content Management" },
    { icon: "📢", logo: "/images/skills/leadership.svg", color: "auto", label: "Leadership & Team Collaboration" },
    { icon: "🎯", logo: "/images/skills/problem-solving.svg", color: "auto", label: "Problem-Solving & Critical Thinking" },
    { icon: "💡", logo: "/images/skills/ux-ui.svg", color: "auto", label: "UX/UI Design Fundamentals" },
    { icon: "📝", logo: "/images/skills/documentation.svg", color: "auto", label: "Communication & Documentation" },
    { icon: "🔄", logo: "/images/skills/adaptability.svg", color: "auto", label: "Active Learning & Adaptability" },
    { icon: "🗣️", logo: "/images/skills/communication.svg", color: "auto", label: "Effective Communication Skills" },
  ],

  /* ---------------------------------------------------------------------
     Games I've Conquered. glowColor: a colour, or "auto" to take it from
     the cover image. url: the game's official site. MiSide and Date A Live
     point at a Steam search because neither has a stable official page -
     swap in the real links here (or in /admin -> Games) whenever you like.
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
     Music page. Every song belongs to a category; each category has its
     own colour. A category with no songs is simply not shown.
     --------------------------------------------------------------------- */
  musicCategories: [
    { name: "Rock & Alternative", color: "#F39C12" },
    { name: "Dark piano / Dark ambient", color: "#8B5CF6" },
    { name: "Anime & Game ", color: "#3B82F6" },
    { name: "Wave / Trap Wave", color: "#10B981" },
    { name: "Phonk & Stoic Edits", color: "#EF4444" },
    { name: "Special Mix", color: "#EC4899" },
    { name: "Electronic & EDM", color: "#06B6D4" },
    { name: "Official Anime OSTs", color: "#F39C12" },
  ],

  /* youtube: a YouTube link or just the video id */
  songs: [
    { category: "Rock & Alternative", song: "Animal I Have Become", artist: "Three Days Grace", youtube: "xqds0B_meys" },
    { category: "Rock & Alternative", song: "Can You Feel My Heart", artist: "Bring Me The Horizon", youtube: "QJJYpsA5tv8" },
    { category: "Rock & Alternative", song: "Counting Stars", artist: "OneRepublic", youtube: "hT_nvWreIhg" },
    { category: "Rock & Alternative", song: "In The End", artist: "Linkin Park", youtube: "eVTXPUF4Oz4" },
    { category: "Rock & Alternative", song: "Monster", artist: "Starset", youtube: "Bq6IuZIJhuI" },
    { category: "Rock & Alternative", song: "My Demons", artist: "Starset", youtube: "p-N_y1bZtRw" },
    { category: "Rock & Alternative", song: "Save Me", artist: "Skillet", youtube: "4RF9-efhHuE" },
    { category: "Rock & Alternative", song: "Softcore", artist: "The Neighbourhood", youtube: "ggG9ySCChYw" },
    { category: "Rock & Alternative", song: "Stay This Way", artist: "From Ashes to New", youtube: "n1Te-3gZFLI" },
    { category: "Rock & Alternative", song: "The Death of Peace of Mind", artist: "Bad Omens", youtube: "ouW_RCAI0sg" },
    { category: "Dark piano / Dark ambient", song: "Can You Hear Them Sing?", artist: "Cemeteries", youtube: "C8YK4mQOGBQ" },
    { category: "Dark piano / Dark ambient", song: "Children of the Night", artist: "Myuu", youtube: "-IREVE3G6Yg" },
    { category: "Dark piano / Dark ambient", song: "Lament", artist: "Myuu", youtube: "iHXkU2LKm50" },
    { category: "Dark piano / Dark ambient", song: "Outsider", artist: "Myuu", youtube: "Dlta3Qgy_6I" },
    { category: "Dark piano / Dark ambient", song: "Painted Smile", artist: "Madame Macabre", youtube: "9_IFb5YimMw" },
    { category: "Dark piano / Dark ambient", song: "Promise ~Reprise~", artist: "Myuu", youtube: "LApkHzyKxrw" },
    { category: "Dark piano / Dark ambient", song: "Reversion 2015", artist: "Myuu", youtube: "XhZ-Ny-onfg" },
    { category: "Dark piano / Dark ambient", song: "Stronger Together", artist: "Myuu", youtube: "49KzVgqidH0" },
    { category: "Dark piano / Dark ambient", song: "Theme of Laura ~Reprise~", artist: "Myuu", youtube: "V9HqmLQQtGo" },
    { category: "Dark piano / Dark ambient", song: "What Could Have Been", artist: "Myuu", youtube: "2bLCGNf--Fg" },
    { category: "Anime & Game ", song: "Blood and Guts (metal version)", artist: "Berserk OST · Friedrich Nihil", youtube: "XYGrPrXHUiY" },
    { category: "Anime & Game ", song: "Gon's Rage", artist: "Hunter × Hunter", youtube: "xbedjCeXf4w" },
    { category: "Anime & Game ", song: "I'm Still Here", artist: "Berserk", youtube: "eyu0SDWtj9k" },
    { category: "Anime & Game ", song: "maboroshi", artist: "Masaru Yokoyama", youtube: "SapzKlwAzKw" },
    { category: "Anime & Game ", song: "Not Tomorrow", artist: "Akira Yamaoka · Silent Hill", youtube: "uLpsZkADulQ" },
    { category: "Anime & Game ", song: "Requiem", artist: "Shyar Kiki · Tasogare Otome × Amnesia", youtube: "MrotFHT--BM" },
    { category: "Anime & Game ", song: "Sayaka Miki's Theme", artist: "Yuki Kajiura · Madoka Magica", youtube: "xg6jepvOsyw" },
    { category: "Anime & Game ", song: "Shin'on (心音)", artist: "Miyuki Nakajima", youtube: "ZLF7qG6PEzQ" },
    { category: "Anime & Game ", song: "Sis Puella Magica!", artist: "Yuki Kajiura", youtube: "bzlHPlq8hIs" },
    { category: "Anime & Game ", song: "Stronger than You (Chara)", artist: "Clara Kraft · Undertale", youtube: "qg9IMJKnIAA" },
    { category: "Wave / Trap Wave", song: "Euphoria", artist: "VØJ, Narvent, KoruSe", youtube: "LmcgmbRf5Ts" },
    { category: "Wave / Trap Wave", song: "Fainted", artist: "Narvent", youtube: "hLuhfSP8Odc" },
    { category: "Wave / Trap Wave", song: "Forget It", artist: "Xalv", youtube: "eWQuMIEzMqo" },
    { category: "Wave / Trap Wave", song: "Isolated Reality", artist: "VXLLAIN, VYRØN", youtube: "45UxL7uzor4" },
    { category: "Wave / Trap Wave", song: "Memory Reboot", artist: "VØJ, Narvent", youtube: "wL8DVHuWI7Y" },
    { category: "Phonk & Stoic Edits", song: "After Dark", artist: "Mr.Kitty", youtube: "IBe4W65iqyg" },
    { category: "Phonk & Stoic Edits", song: "Altyn Funk", artist: "WXCHSXN", youtube: "X6eN0jymD0Y" },
    { category: "Phonk & Stoic Edits", song: "Death Rattle", artist: "Miguel Angeles", youtube: "1xAF7YV_nB4" },
    { category: "Phonk & Stoic Edits", song: "I Know Who I Am, and I Do Not Need Your Help.", artist: "ProdBR", youtube: "omE_AMgQiZ0" },
    { category: "Phonk & Stoic Edits", song: "Memory Reboot (stoic)", artist: "VØJ, Narvent", youtube: "dqbhhlK8K4U" },
    { category: "Phonk & Stoic Edits", song: "One Chance", artist: "Moondiety × Interworld", youtube: "p_8t3dfx-v0" },
    { category: "Phonk & Stoic Edits", song: "Protection Charm", artist: "Stoic version", youtube: "tjBoj2UZAKY" },
    { category: "Phonk & Stoic Edits", song: "Reason", artist: "Xloers", youtube: "mgjXYd6PD1Y" },
    { category: "Phonk & Stoic Edits", song: "Sonne × I Am Napoleon", artist: "Rammstein (slowed)", youtube: "NIVS1B6w77w" },
    { category: "Phonk & Stoic Edits", song: "Who Decides What Your Limit Is", artist: "One Punch Man × Narvent (slowed)", youtube: "5FUdRbfGNCA" },
    { category: "Special Mix", song: "Around the World (La La La)", artist: "ATC", youtube: "IP2iaE_Mq5k", ytOnly: "yes" },
    { category: "Special Mix", song: "Around the World (Wesker edit)", artist: "ATC", youtube: "-RjhlM2zG6c" },
    { category: "Special Mix", song: "Bad Apple!!", artist: "Alstroemeria Records ft. nomico", youtube: "FtutLA63Cp8" },
    { category: "Special Mix", song: "Cigarettes Out the Window", artist: "TV Girl", youtube: "_4tNUIt2ZuA" },
    { category: "Special Mix", song: "Golden Brown", artist: "The Stranglers", youtube: "ArR62YwcXyI", ytOnly: "yes" },
    { category: "Special Mix", song: "In the House, in a Heartbeat × Berserk", artist: "John Murphy", youtube: "VOYVjsBuvp8" },
    { category: "Special Mix", song: "Killer", artist: "Mareux", youtube: "OcAnyrtA8J4" },
    { category: "Special Mix", song: "L's Theme (slowed + reverb)", artist: "Hideki Taniuchi · Death Note", youtube: "jK4yCxZ0q6w" },
    { category: "Special Mix", song: "Under the Influence × Renegade", artist: "Chris Brown × Aaryan Shah", youtube: "OVCjlZ0Zn3g" },
    { category: "Special Mix", song: "Zakhelo", artist: "Rushex", youtube: "45EGiEei1mc" },
    { category: "Electronic & EDM", song: "After Life", artist: "LOWX", youtube: "pRvPMQBsiRc" },
    { category: "Electronic & EDM", song: "Digital Tears (Sped Up)", artist: "REPLYKANT", youtube: "D3ZD3s6yrfs" },
    { category: "Electronic & EDM", song: "For You Pt. 1 & 2", artist: "Skeler", youtube: "PMZqxmZwUe8" },
    { category: "Electronic & EDM", song: "Thank You (Skeler Remix)", artist: "Dido", youtube: "buih7o5O0vk" },
    { category: "Electronic & EDM", song: "Umbrella (Skeler Remix)", artist: "Ember Island (Rihanna cover)", youtube: "PPutRXXWe-Q" },
    { category: "Official Anime OSTs", song: "Administrator", artist: "Yuki Kajiura · SAO Alicization", youtube: "q31SuIsN8SI" },
    { category: "Official Anime OSTs", song: "Eau de Vie", artist: "Yasuharu Takanashi · Shiki", youtube: "wA5CJrla26s" },
    { category: "Official Anime OSTs", song: "Find Your Sword in This Land", artist: "Yuki Kajiura · SAO Alicization", youtube: "LGqp-uktNzc" },
    { category: "Official Anime OSTs", song: "Furious Anger", artist: "Go Sakabe · Date A Live", youtube: "yNPJ3FxDWm8" },
    { category: "Official Anime OSTs", song: "Hanten Tohka (Inverse Tohka Theme)", artist: "Go Sakabe · Date A Live", youtube: "RDVG80kfWB4" },
    { category: "Official Anime OSTs", song: "Initiating", artist: "Go Sakabe · Date A Live IV", youtube: "yhm_bRVn_JY" },
    { category: "Official Anime OSTs", song: "Ryuk's Theme", artist: "Yoshihisa Hirano & Hideki Taniuchi · Death Note", youtube: "0zYw5IuEUZ0" },
    { category: "Official Anime OSTs", song: "She Was Sitting Under the Osmanthus Tree", artist: "Yuki Kajiura · SAO Alicization", youtube: "5d0iAU2H-eY" },
    { category: "Official Anime OSTs", song: "The Blue Rose Sword Battle", artist: "Yuki Kajiura · SAO Alicization", youtube: "eRNPp1mbV2s" },
    { category: "Official Anime OSTs", song: "The Human Empire Army", artist: "Yuki Kajiura · SAO Alicization", youtube: "Y5A_c50-Kpc" },
    { category: "Official Anime OSTs", song: "The Piece of White", artist: "Date A Bullet OST", youtube: "7rfKcOv90Lc" },
    { category: "Official Anime OSTs", song: "The Queen of White", artist: "Date A Bullet OST", youtube: "qRTV5OB7PXA" },
    { category: "Official Anime OSTs", song: "Trisha's Lullaby", artist: "Michiru Oshima · Fullmetal Alchemist", youtube: "hBkh7DRNqw8" },
    { category: "Official Anime OSTs", song: "You Can Save Him", artist: "Yuki Kajiura · SAO Alicization", youtube: "2iOOZKuS1Ss" },
  ],

  /* ---------------------------------------------------------------------
     Certifications page text. In the intro, {earned} {active} and {total}
     are filled in from the list below, so the numbers never go stale.
     --------------------------------------------------------------------- */
  certificationsPage: {
    title: "Certifications",
    intro: "The paper trail behind the practice - {earned} certificates earned so far. Hit View on any of them to see the certificate itself and what it covered.",
    footer: "A certificate is the receipt. The work is the product.",
  },

  /* ---------------------------------------------------------------------
     Certifications. status: done | active
     file:   the certificate itself (in public/certificates) - opens in the viewer
     verify: a public page that proves it, when the issuer has one
     tags:   comma-separated, e.g. "Coursera, Networking"
     --------------------------------------------------------------------- */
  certifications: [
    /* earned - imported from the Unstop profile */
    { name: "Adobe University Hackathon 2026 - Round 1 - Online Assessment (MCQ + Coding)", issuer: "Adobe", status: "done", date: "Aug 2026", blurb: "Participation certificate from Adobe, issued through Unstop.", tags: "Unstop", verify: "https://unstop.com/certificate-preview/a6d37c8f-57e4-449b-a65d-5efe48bcd8ce", file: "/certificates/2026-adobe-university-hackathon-2026-round-1-online-assessment-mcq-coding.png" },
    { name: "Solve for Tomorrow 2025", issuer: "Samsung", status: "done", date: "Jun 2026", blurb: "Recognized for contribution to Samsung Solve for Tomorrow 2025, applying Design Thinking principles to share innovative, real-world solutions.", tags: "Competition", verify: "", file: "/certificates/2026-solve-for-tomorrow-2025.png" },
    { name: "Learning Hadoop", issuer: "LinkedIn Learning", status: "done", date: "May 2026", blurb: "Completed LinkedIn Learning's \"Learning Hadoop\" course covering large-scale data processing fundamentals with Hadoop", tags: "LinkedIn Learning", verify: "", file: "/certificates/2026-learning-hadoop.png" },
    { name: "ORIGIN 2026 - Prelims Round (Online Submission Round)", issuer: "SIMATS Engineering", status: "done", date: "Apr 2026", blurb: "Participation certificate from SIMATS Engineering, issued through Unstop.", tags: "Unstop", verify: "https://unstop.com/certificate-preview/17e2a799-113f-4333-8693-1172291f0334", file: "/certificates/2026-origin-2026-prelims-round-online-submission-round.png" },
    { name: "ORIGIN 2026", issuer: "SIMATS Engineering", status: "done", date: "Apr 2026", blurb: "Participation certificate from SIMATS Engineering, issued through Unstop.", tags: "Unstop", verify: "https://unstop.com/certificate-preview/8cecb33c-4e9d-4a4b-a580-1fb0c768a2c7", file: "/certificates/2026-origin-2026.png" },
    { name: "Spark Fundamentals I (BD0211EN)", issuer: "IBM SkillBuild", status: "done", date: "Feb 2026", blurb: "Completed and passed IBM SkillsBuild's Spark Fundamentals I course (BD0211EN), provided by BigDataUniversity, covering core Apache Spark concepts.", tags: "IBM SkillsBuild", verify: "", file: "/certificates/2026-spark-fundamentals-i-bd0211en.png" },
    { name: "Hadoop 101 (BD0111EN)", issuer: "IBM SkillBuild", status: "done", date: "Feb 2026", blurb: "Completed and passed IBM SkillsBuild's Hadoop 101 course (BD0111EN), provided by IBM, covering Hadoop and hive fundamentals.", tags: "IBM SkillsBuild", verify: "", file: "/certificates/2026-hadoop-101-bd0111en.png" },
    { name: "Big Data 101 (BD0101EN)", issuer: "IBM SkillBuild", status: "done", date: "Feb 2026", blurb: "Completed and passed IBM SkillsBuild's Big Data 101 course (BD0101EN), an introduction to big data concepts and tools.", tags: "IBM SkillsBuild", verify: "", file: "/certificates/2026-big-data-101-bd0101en.png" },
    { name: "Data Fundamentals", issuer: "IBM SkillBuild", status: "done", date: "Feb 2026", blurb: "Completed IBM SkillsBuild's Data Fundamentals badge course covering core data concepts.", tags: "IBM SkillsBuild", verify: "", file: "/certificates/2026-data-fundamentals.png" },
    { name: "Introduction to Big Data Tools", issuer: "Simplilearn", status: "done", date: "Jan 2026", blurb: "Completed Simplilearn SkillUp's course covering an introduction to big data tools for beginners", tags: "Simplilearn", verify: "", file: "/certificates/2026-introduction-to-big-data-tools.png" },
    { name: "INCEPTRIX Hackathon 2026 — Certificate of Participation (Round 1)", issuer: "Presidency University (PU), Bangalore", status: "done", date: "Jan 2026", blurb: "Participated in the First Round of INCEPTRIX Hackathon 2026 under the theme \"Beyond Intelligent Innovation — systems that shape reality,\" demonstrating problem-solving, creativity, and technical skills.", tags: "Competition", verify: "", file: "/certificates/2026-inceptrix-hackathon-2026-certificate-of-participation-round-1.png" },
    { name: "Introduction to MongoDB", issuer: "MongoDB Inc", status: "done", date: "Nov 2025", blurb: "Completed MongoDB Inc.'s \"Introduction to MongoDB\" course offered through Coursera, covering NoSQL database fundamentals", tags: "Coursera", verify: "", file: "/certificates/2025-introduction-to-mongodb.png" },
    { name: "Introduction to Artificial Intelligence", issuer: "IBM", status: "done", date: "Sep 2025", blurb: "Completed IBM's \"Introduction to Artificial Intelligence (AI)\" course offered through Coursera", tags: "Coursera", verify: "", file: "/certificates/2025-introduction-to-artificial-intelligence.png" },
    { name: "Accelerate Your Job Search with AI", issuer: "Google", status: "done", date: "Sep 2025", blurb: "Completed Google's \"Accelerate Your Job Search with AI\" course offered through Coursera.", tags: "Coursera", verify: "", file: "/certificates/2025-accelerate-your-job-search-with-ai.png" },
    { name: "Put It to Work: Prepare for Cybersecurity Jobs", issuer: "Google", status: "done", date: "Sep 2025", blurb: "Completed Google's \"Put It to Work: Prepare for Cybersecurity Jobs\" course — the capstone of the Google Cybersecurity Professional Certificate on Coursera.", tags: "Coursera", verify: "", file: "/certificates/2025-put-it-to-work-prepare-for-cybersecurity-jobs.png" },
    { name: "Storytelling and Influencing: Communicate with Impact", issuer: "Macquarie University (MU), Australia", status: "done", date: "Aug 2025", blurb: "Completed Macquarie University's course on storytelling and influencing to communicate with impact, offered through Coursera.", tags: "Coursera", verify: "", file: "/certificates/2025-storytelling-and-influencing-communicate-with-impact.png" },
    { name: "Introduction to Networking", issuer: "NVIDIA", status: "done", date: "Aug 2025", blurb: "Completed NVIDIA's \"Introduction to Networking\" course offered through Coursera.", tags: "Coursera", verify: "", file: "/certificates/2025-introduction-to-networking.png" },
    { name: "Automate Cybersecurity Tasks with Python", issuer: "Google", status: "done", date: "Aug 2025", blurb: "Completed Google's \"Automate Cybersecurity Tasks with Python\" course, part of the Google Cybersecurity Professional Certificate on Coursera.", tags: "Coursera", verify: "", file: "/certificates/2025-automate-cybersecurity-tasks-with-python.png" },
    { name: "Tools of the Trade: Linux and SQL", issuer: "Google", status: "done", date: "Jul 2025", blurb: "Completed Google's \"Tools of the Trade: Linux and SQL\" course, part of the Google Cybersecurity Professional Certificate on Coursera.", tags: "Coursera", verify: "", file: "/certificates/2025-tools-of-the-trade-linux-and-sql.png" },
    { name: "Sound the Alarm: Detection and Response", issuer: "Google", status: "done", date: "Jul 2025", blurb: "Completed Google's \"Sound the Alarm: Detection and Response\" course, part of the Google Cybersecurity Professional Certificate on Coursera.", tags: "Coursera", verify: "", file: "/certificates/2025-sound-the-alarm-detection-and-response.png" },
    { name: "Assets, Threats, and Vulnerabilities", issuer: "Google", status: "done", date: "Jun 2025", blurb: "Completed Google's \"Assets, Threats, and Vulnerabilities\" course, part of the Google Cybersecurity Professional Certificate on Coursera.", tags: "Coursera", verify: "", file: "/certificates/2025-assets-threats-and-vulnerabilities.png" },
    { name: "Neural Networks and Deep Learning", issuer: "deeplearning.ai", status: "done", date: "Jun 2025", blurb: "Completed DeepLearning.AI's \"Neural Networks and Deep Learning\" course (Course 1 of the Deep Learning Specialization), offered through Coursera.", tags: "Coursera", verify: "", file: "/certificates/2025-neural-networks-and-deep-learning.png" },
    { name: "Connect and Protect: Networks and Network Security", issuer: "Google", status: "done", date: "Jun 2025", blurb: "Completed Google's \"Connect and Protect: Networks and Network Security\" course, part of the Google Cybersecurity Professional Certificate on Coursera.", tags: "Coursera", verify: "", file: "/certificates/2025-connect-and-protect-networks-and-network-security.png" },
    { name: "Developing Innovative Ideas for New Companies: The First Step in Entrepreneurship", issuer: "University of Maryland", status: "done", date: "Apr 2025", blurb: "Completed the University of Maryland's course on developing innovative ideas for new companies as the first step in entrepreneurship, offered through Coursera.", tags: "Coursera", verify: "", file: "/certificates/2025-developing-innovative-ideas-for-new-companies-the-first-step-in-entrep.png" },
    { name: "Global Environmental Management", issuer: "Technical University of Denmark", status: "done", date: "Apr 2025", blurb: "Completed DTU's \"Global Environmental Management\" course offered through Coursera.", tags: "Coursera", verify: "", file: "/certificates/2025-global-environmental-management.png" },
    { name: "Play It Safe: Manage Security Risks", issuer: "Google", status: "done", date: "Mar 2025", blurb: "Completed Google's \"Play It Safe: Manage Security Risks\" course, part of the Google Cybersecurity Professional Certificate on Coursera.", tags: "Coursera", verify: "", file: "/certificates/2025-play-it-safe-manage-security-risks.png" },
    { name: "Algorithms for Searching, Sorting, and Indexing", issuer: "University of Colorado", status: "done", date: "Mar 2025", blurb: "Completed the University of Colorado Boulder's course on algorithms for searching, sorting, and indexing, offered through Coursera.", tags: "Coursera", verify: "", file: "/certificates/2025-algorithms-for-searching-sorting-and-indexing.png" },
    { name: "Ethical Hacking - Mobile Platforms and Network Architecture", issuer: "Great Learning", status: "done", date: "Feb 2025", blurb: "Completed Great Learning Academy's verified online course on ethical hacking for mobile platforms and network architecture.", tags: "Great Learning", verify: "", file: "/certificates/2025-ethical-hacking-mobile-platforms-and-network-architecture.png" },
    { name: "Basics of Cisco Networking", issuer: "LearnQuest", status: "done", date: "Jan 2025", blurb: "Completed LearnQuest's \"Basics of Cisco Networking\" course offered through Coursera.", tags: "Coursera", verify: "", file: "/certificates/2025-basics-of-cisco-networking.png" },
    { name: "Introduction to Contemporary Operating Systems and Hardware", issuer: "Illinois Institute of Technology, Chicago", status: "done", date: "Jan 2025", blurb: "Completed Illinois Tech's \"Introduction to Contemporary Operating Systems and Hardware 1b\" course offered through Coursera.", tags: "Coursera", verify: "", file: "/certificates/2025-introduction-to-contemporary-operating-systems-and-hardware.png" },
    { name: "Network Security", issuer: "Great Learning", status: "done", date: "Nov 2024", blurb: "Completed Great Learning Academy's free online course on Network Security fundamentals.", tags: "Great Learning", verify: "", file: "/certificates/2024-network-security.png" },
    { name: "Foundations of Cybersecurity", issuer: "Google", status: "done", date: "Nov 2024", blurb: "Completed Google's \"Foundations of Cybersecurity\" course — the first course of the Google Cybersecurity Professional Certificate on Coursera.", tags: "Coursera", verify: "", file: "/certificates/2024-foundations-of-cybersecurity.png" },
    { name: "Intro to Operating Systems 2: Memory Management", issuer: "Codio", status: "done", date: "Nov 2024", blurb: "Completed Codio's \"Intro to Operating Systems 2: Memory Management\" course offered through Coursera.", tags: "Coursera", verify: "", file: "/certificates/2024-intro-to-operating-systems-2-memory-management.png" },
    { name: "Intro to Operating Systems 4: Persistence", issuer: "Codio", status: "done", date: "Nov 2024", blurb: "Completed Codio's \"Intro to Operating Systems 4: Persistence\" course offered through Coursera.", tags: "Coursera", verify: "", file: "/certificates/2024-intro-to-operating-systems-4-persistence.png" },
    { name: "Intro to Operating Systems 3: Concurrency", issuer: "Codio", status: "done", date: "Nov 2024", blurb: "Completed Codio's \"Intro to Operating Systems 3: Concurrency\" course offered through Coursera.", tags: "Coursera", verify: "", file: "/certificates/2024-intro-to-operating-systems-3-concurrency.png" },
    { name: "Intro to Operating Systems 1: Virtualization", issuer: "Codio", status: "done", date: "Nov 2024", blurb: "Completed Codio's \"Intro to Operating Systems 1: Virtualization\" course offered through Coursera.", tags: "Coursera", verify: "", file: "/certificates/2024-intro-to-operating-systems-1-virtualization.png" },
    { name: "Python for Data Science", issuer: "Great Learning", status: "done", date: "Nov 2024", blurb: "Completed Great Learning Academy's free online course on Python for Data Science.", tags: "Great Learning", verify: "", file: "/certificates/2024-python-for-data-science.png" },
    { name: "Introduction to Ethical Hacking", issuer: "Great Learning", status: "done", date: "Oct 2024", blurb: "Completed Great Learning Academy's free online course covering the fundamentals of ethical hacking.", tags: "Great Learning", verify: "", file: "/certificates/2024-introduction-to-ethical-hacking.png" },
    { name: "National Level Online Quiz — Cyber Security Awareness", issuer: "Jain University (JU), Bangalore", status: "done", date: "Oct 2024", blurb: "Participated in a National Level Online Quiz on Cyber Security Awareness conducted by the NSS wing at JAIN (Deemed-to-be University), Bengaluru — scored 92%.", tags: "Competition", verify: "", file: "/certificates/2024-national-level-online-quiz-cyber-security-awareness.png" },
    { name: "Introduction to Graph Theory", issuer: "University of San Francisco", status: "done", date: "Oct 2024", blurb: "Completed with Honors an online non-credit course on graph theory, authorized by UC San Diego and offered through Coursera.", tags: "Coursera", verify: "", file: "/certificates/2024-introduction-to-graph-theory.png" },
    { name: "Convolutional Neural Networks", issuer: "Great Learning", status: "done", date: "Oct 2024", blurb: "Completed Great Learning Academy's free online course on Convolutional Neural Networks.", tags: "Great Learning", verify: "", file: "/certificates/2024-convolutional-neural-networks.png" },
    { name: "Introduction to Firewall", issuer: "Great Learning", status: "done", date: "Sep 2024", blurb: "Completed Great Learning Academy's free online course on firewall fundamentals.", tags: "Great Learning", verify: "", file: "/certificates/2024-introduction-to-firewall.png" },
    { name: "Cloud Computing Fundamentals", issuer: "IBM SkillBuild", status: "done", date: "Aug 2024", blurb: "Completed IBM SkillsBuild's \"Cloud Computing Fundamentals\" course covering core cloud computing concepts.", tags: "IBM SkillsBuild", verify: "", file: "/certificates/2024-cloud-computing-fundamentals.png" },
    { name: "Self Directed Emotional Learning for Empathy and Kindness (SEEK)", issuer: "UNESCO", status: "done", date: "Mar 2024", blurb: "Successfully completed UNESCO MGIEP's SEEK course on self-directed emotional learning for empathy and kindness, for JAIN", tags: "", verify: "", file: "/certificates/2024-self-directed-emotional-learning-for-empathy-and-kindness-seek.png" },
    { name: "ChatGPT for Coders", issuer: "Great Learning", status: "done", date: "Mar 2024", blurb: "Completed Great Learning Academy's free online course on using ChatGPT for coding tasks.", tags: "Great Learning", verify: "", file: "/certificates/2024-chatgpt-for-coders.png" },
    { name: "AIML (Artificial Intelligence with Machine Learning) Mentorship Program", issuer: "Pregrad", status: "done", date: "Oct 2023", blurb: "Completed a 3-month mentorship program in Artificial Intelligence with ML (AIML), demonstrating dedication and the ability to work independently at an industry level.", tags: "", verify: "", file: "/certificates/2023-aiml-artificial-intelligence-with-machine-learning-mentorship-program.png" },

    /* on the way */
  ],

  /* ---------------------------------------------------------------------
     Literature: the poems (admin -> Poems). The shipped set is in poems.js.
     --------------------------------------------------------------------- */
  poems: POEMS,

  /* ---------------------------------------------------------------------
     3D & Editing: the models (admin -> 3D models). file is served by
     server.js from data/models; thumb is the card picture.
     downloadable: "yes" shows a Download button in the viewer; "no" hides it.
     (The viewer still fetches the whole file, so this is a courtesy, not a lock.)
     --------------------------------------------------------------------- */
  models: [
    { name: "Kurumi Tokisaki - Astral", file: "/files/models/kurumi-astral.vrm", format: "vrm", thumb: "/images/models/kurumi-astral.webp", credit: "Cskai", description: "Date A Live", downloadable: "no" },
    { name: "Kurumi Tokisaki - School", file: "/files/models/kurumi-school.vrm", format: "vrm", thumb: "/images/models/kurumi-school.webp", credit: "", description: "Date A Live", downloadable: "no" },
    { name: "Siesta", file: "/files/models/siesta.vrm", format: "vrm", thumb: "/images/models/siesta.webp", credit: "GHILOUFI", description: "The Detective Is Already Dead", downloadable: "no" },
    { name: "Tohka Yatogami", file: "/files/models/tohka.vrm", format: "vrm", thumb: "/images/models/tohka.webp", credit: "Cskai", description: "Date A Live", downloadable: "no" },
  ],
};

export default defaults;
