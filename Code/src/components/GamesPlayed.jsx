import React from "react";
import { Link } from "react-router-dom";

const games = [
  { name: "Clash of Clans", image: "/images/clash_of_clans.jpg", glowColor: "#FF4500", theme: "Strategy" },
  { name: "Clash Royale", image: "/images/clash_royale.jpg", glowColor: "#4169E1", theme: "Strategy" },
  { name: "Rise of Kingdoms", image: "/images/rise_of_kingdoms.webp", glowColor: "#FFD700", theme: "Strategy" },
  { name: "Wuthering Waves", image: "/images/wuthering_waves.jpg", glowColor: "#00FF7F", theme: "Action RPG" },
  { name: "Assassin Creed", image: "/images/Assassin_Creed.png", glowColor: "#FF6347", theme: "Action-Adventure" },
  { name: "Minecraft", image: "/images/minecraft.jpg", glowColor: "#32CD32", theme: "Sandbox" },
  { name: "Pokémon GO", image: "/images/pokemon_go.jpg", glowColor: "#1E90FF", theme: "Augmented Reality" },
  { name: "Date A Live:Pledge", image: "/images/date_a_live.png", glowColor: "#8A2BE2", theme: "Visual Novel" },
  { name: "Resident Evil", image: "/images/Resident_Evil.png", glowColor: "#DC143C", theme: "Horror" },
  { name: "Silent Hill", image: "/images/Silent_Hill.png", glowColor: "#708090", theme: "Horror" },
  { name: "Miside", image: "/images/Miside.png", glowColor: "#FF69B4", theme: "Horror" },
  { name: "Doki Doki", image: "/images/Doki_doki_literature_club.png", glowColor: "#FFC0CB", theme: "Psychological Horror" }
];

const GameList = () => {
  return (
    <div style={{
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "20px",
      fontFamily: "Arial, sans-serif",
      backgroundColor: "#222",
      color: "#fff",
      borderRadius: "10px",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "10px",
      }}>
        <h1 style={{ 
          color: "#f39c12", 
          fontSize: "2.5rem",
          fontWeight: "700",
          margin: "0" 
        }}>
          Games I’ve Conquered 🎮🔥
        </h1>
        
        <Link to="/" style={{
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
          const bg = e.currentTarget.querySelector(".bg");
          bg.style.width = "100%";
          e.currentTarget.style.color = "#000";
        }}
        onMouseLeave={(e) => {
          const bg = e.currentTarget.querySelector(".bg");
          bg.style.width = "35%";
          e.currentTarget.style.color = "#000";
        }}>
          <span className="bg" style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "35%",
            height: "100%",
            background: "rgba(0, 255, 170, 0.93)",
            borderRadius: "9999px",
            transition: "all 0.4s ease",
            zIndex: 0,
          }}/>
          <span style={{
            position: "relative",
            zIndex: 1,
            whiteSpace: "nowrap",
          }}
          dangerouslySetInnerHTML={{
            __html: `<span style="font-family: Pacifico, cursive !important; font-weight: 500; font-size: 0.85rem;">&lt;&lt; Back home</span>`,
          }}/>
        </Link>
      </div>

      {/* Description */}
      <p style={{ 
        fontSize: "1.5rem",
        color: "#bbb", 
        marginBottom: "20px", 
        textAlign: "center",
        lineHeight: "1.5",
      }}>
        I haven't played many games, as I'm a workaholic who enjoys watching anime, researching, learning,  
        and experimenting with new AI and technology. But here are a few games I've played in my lifetime.
      </p>

      {/* Game Grid */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "20px",
        justifyContent: "center",
        padding: "20px",
      }}>
        {games.map((game, index) => (
          <div
            key={index}
            style={{
              width: "24%",
              maxWidth: "250px",
              height: "350px",
              borderRadius: "12px",
              boxShadow: `0 0 15px ${game.glowColor}`,
              transition: "transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              overflow: "hidden",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.08)";
              e.currentTarget.style.boxShadow = `0 0 30px ${game.glowColor}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = `0 0 15px ${game.glowColor}`;
            }}>
            <div style={{
              width: "100%",
              height: "80%",
              backgroundImage: `url(${game.image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}/>
            
            <div style={{
              width: "100%",
              height: "20%",
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              color: "white",
              fontSize: "1.1rem",
              fontWeight: "bold",
              padding: "10px 0",
              textShadow: "2px 2px 5px rgba(0, 0, 0, 0.8)",
            }}>
              <h2>{game.name}</h2>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameList;