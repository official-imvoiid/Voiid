import { useEffect, useState } from "react";
import BackHome from "./BackHome";
import { useContent } from "../content/ContentContext";

const SkillSet = () => {
  /* the list lives in src/content/defaults.js and is editable at /admin */
  const { skills } = useContent();
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 600);

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth <= 600);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    /* page-fill covers the window at any height or zoom, so nothing shows
       behind a short page; the inner div keeps the original 800px column */
    <div className="page-fill" style={{ padding: "clamp(14px, 2.6vw, 40px) var(--gutter)" }}>
    <div
      style={{
        maxWidth: isSmallScreen ? "100%" : "800px",
        margin: "auto",
        fontSize: isSmallScreen ? "14px" : "16px",
      }}
    >
      {/* Header Section */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "15px",
          borderBottom: "2px solid #f39c12",
          paddingBottom: "10px",
        }}
      >
        <h1 style={{ color: "#fff", margin: 0, fontSize: isSmallScreen ? "1.5rem" : "2rem" }}>
          My Skill Set ⚡💻
        </h1>
        <BackHome />
      </div>

      {/* Introduction */}
      <p style={{ fontSize: isSmallScreen ? "16px" : "18px", color: "#ddd", lineHeight: "1.6" }}>
        A passionate cybersecurity expert and developer, constantly evolving in 
        ethical hacking, open-source contributions, and full-stack development. 
        Skilled in troubleshooting, debugging, and crafting secure digital solutions 
        with a hacker’s mindset and an engineer’s precision.
      </p>

      {/* Skill List */}
      <div style={{ marginTop: "20px" }}>
        <h3 style={{ color: "#f39c12", fontSize: isSmallScreen ? "1.25rem" : "1.5rem" }}>Core Skills:</h3>
        <ul style={{ listStyle: "none", padding: 0, color: "#fff", fontSize: isSmallScreen ? "14px" : "16px" }}>
          {skills.map((sk) => (
            <li key={sk.label}>{sk.icon} {sk.label}</li>
          ))}
        </ul>
      </div>
    </div>
    </div>
  );
};

export default SkillSet;