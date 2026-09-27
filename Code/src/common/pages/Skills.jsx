import PageShell from "../components/PageShell";
import { useContent } from "../content/ContentContext";

/* each skill gets its own colour unless one is set in the admin */
const HUES = ["#F39C12", "#3B82F6", "#10B981", "#EC4899", "#8B5CF6", "#06B6D4", "#EF4444", "#EAB308"];

/* An .svg logo is drawn as a silhouette in the skill's colour, so every icon
   matches; a photo-type logo (png, jpg, webp) is shown as it is. */
const SkillIcon = ({ skill }) => {
  if (!skill.logo) return skill.icon;
  if (/\.svg(\?|$)/i.test(skill.logo)) {
    return <span className="skills-glyph" style={{ "--logo": `url("${skill.logo}")` }} />;
  }
  return <img src={skill.logo} alt="" loading="lazy" draggable={false} />;
};

/* Looks: common/styles/pages/skills.css
   Sizes: platforms/<device>/skills.css
   The list is edited at /admin -> Skills. */
const SkillSet = () => {
  const { skills } = useContent();

  return (
    <PageShell
      className="skills-page"
      title="My Skill Set ⚡💻"
      accent="#F39C12"
      intro={
        <>
          <span className="skills-intro-line">
            A passionate cybersecurity expert and developer, constantly evolving in ethical
            hacking, open-source contributions, and full-stack development.
          </span>
          <span className="skills-intro-line">
            Skilled in troubleshooting, debugging, and crafting secure digital solutions with a
            hacker’s mindset and an engineer’s precision.
          </span>
        </>
      }
      footer="Always learning - the list grows as the work does."
    >
      <div className="pg-tools">
        <h2 className="skills-heading">Core skills</h2>
        <span className="pg-count">{skills.length} skills</span>
      </div>

      <ul className="skills-grid-list">
        {skills.map((sk, i) => (
          <li
            key={sk.label}
            className="pg-card skills-tile"
            style={{ "--i": i, "--hue": sk.color && sk.color !== "auto" ? sk.color : HUES[i % HUES.length] }}
          >
            <span className="skills-icon" aria-hidden="true">
              <SkillIcon skill={sk} />
            </span>
            <span className="skills-label">{sk.label}</span>
          </li>
        ))}
      </ul>
    </PageShell>
  );
};

export default SkillSet;
