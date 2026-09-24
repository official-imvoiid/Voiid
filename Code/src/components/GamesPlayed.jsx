import BackHome from "./BackHome";
import { useContent } from "../content/ContentContext";
import "./GamesPlayed.css";

/**
 * Games I've Conquered.
 *
 * Each tile links out to that game's official site. Two entries (MiSide and
 * Date A Live) point at a Steam search instead of a homepage, because those
 * two do not have a stable official URL I could rely on - swap them for the
 * real links whenever you like.
 */

const GameList = () => {
  /* the tiles live in src/content/defaults.js and are editable at /admin */
  const { games } = useContent();

  return (
  <div className="gp-page">
    <div className="gp-shell">
      <div className="gp-head">
        <h1 className="gp-title">Games I&rsquo;ve Conquered 🎮🔥</h1>
        <BackHome />
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
};

export default GameList;
