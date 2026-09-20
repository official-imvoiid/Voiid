import { useEffect, useState } from "react";
import BackHome from "./BackHome";

const SkillSet = () => {
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 600);

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth <= 600);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      style={{
        maxWidth: isSmallScreen ? "100%" : "800px",
        margin: "auto",
        padding: isSmallScreen ? "10px" : "20px",
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
          <li>⚙️ Kali Linux & Cybersecurity</li>
          <li>🐍 Python Development</li>
          <li>🌐 Web Development (HTML, CSS, JavaScript, React, Node.js)</li>
          <li>🚀 Open-Source Contribution</li>
          <li>🔍 Debugging & Troubleshooting</li>
          <li>📖 Active Learning & Research</li>
          <li>📡 Penetration Testing & Ethical Hacking</li>
          <li>🔧 Automation & Scripting (Bash, PowerShell)</li>
          <li>🔑 Cryptography & Secure Coding</li>
          <li>🎬 Video Editing & Content Management</li>
          <li>📢 Leadership & Team Collaboration</li>
          <li>🎯 Problem-Solving & Critical Thinking</li>
          <li>💡 UX/UI Design Fundamentals</li>
          <li>📝 Communication & Documentation</li>
          <li>🔄 Active Learning & Adaptability</li>
          <li>🗣️ Effective Communication Skills</li>
        </ul>
      </div>
    </div>
  );
};

export default SkillSet;