import { Link } from "react-router-dom";
import "./GamesPlayed.css";

/**
 * Games I've Conquered.
 *
 * Each tile links out to that game's official site. Two entries (MiSide and
 * Date A Live) point at a Steam search instead of a homepage, because those
 * two do not have a stable official URL I could rely on - swap them for the
 * real links whenever you like.
 */
const games = [
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
];

const GameList = () => (
  <div className="gp-page">
    <div className="gp-shell">
      <div className="gp-head">
        <h1 className="gp-title">Games I&rsquo;ve Conquered 🎮🔥</h1>
        {/* the original pill - white, with the green fill that slides across on
            hover. The glow and lift are layered on in CSS, nothing replaced. */}
        <Link
          to="/"
          className="gp-back"
          onClick={() => window.scrollTo({ top: 0 })}
          style={{
            position: "relative",
            display: "inline-block",
            padding: "0.4rem 1rem",
            color: "#000",
            fontWeight: "500",
            textDecoration: "none",
            overflow: "hidden",
            borderRadius: "9999px",
            background: "rgba(255, 255, 255, 0.96)",
            backdropFilter: "blur(2px)",
            WebkitBackdropFilter: "blur(6px)",
            fontSize: "0.85rem",
            cursor: "pointer",
            transition: "color 0.4s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.querySelector(".bg").style.width = "100%";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.querySelector(".bg").style.width = "35%";
          }}
        >
          <span
            className="bg"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "35%",
              height: "100%",
              background: "rgba(0, 255, 170, 0.93)",
              borderRadius: "9999px",
              transition: "all 0.4s ease",
              zIndex: 0,
            }}
          />
          <span
            style={{ position: "relative", zIndex: 1, whiteSpace: "nowrap" }}
            dangerouslySetInnerHTML={{
              __html: `<span style="font-family: Pacifico, cursive !important; font-weight: 500; font-size: 0.85rem;">&lt;&lt; Back home</span>`,
            }}
          />
        </Link>
      </div>

      <p className="gp-intro">
        I haven&rsquo;t played many games — I&rsquo;m a workaholic who enjoys watching anime,
        researching, learning and experimenting with new AI and technology. But here are a
        few I&rsquo;ve played in my lifetime.
      </p>

      <div className="gp-grid">
        {games.map((game) => (
          <a
            key={game.name}
            className="gp-card"
            style={{ "--glow": game.glowColor }}
            href={game.url}
            target="_blank"
            rel="noopener noreferrer"
            title={`Open the official site for ${game.name}`}
          >
            <div className="gp-art">
              <span className="gp-theme">{game.theme}</span>
              <img src={game.image} alt={game.name} loading="lazy" />
              <span className="gp-visit">Visit site ↗</span>
            </div>
            <h3 className="gp-name">{game.name}</h3>
          </a>
        ))}
      </div>

      <p className="gp-foot">Every world finished is another story carried home.</p>
    </div>
  </div>
);

export default GameList;
