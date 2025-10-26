import React from "react";
import { Link } from "react-router-dom";

const genres = {
  "Rock & Alternative": [
    { id: "kXYiU_JCYtU", title: "Linkin Park - Numb", artist: "Linkin Park", song: "Numb" },
    { id: "hT_nvWreIhg", title: "OneRepublic - Counting Stars", artist: "OneRepublic", song: "Counting Stars" },
    { id: "Bq6IuZIJhuI", title: "Starset - Monster", artist: "Starset", song: "Monster" },
  ],
  "Dark piano / Dark ambient": [
    { id: "4qrFYVjsIM0", title: "Myuu - Tender Remains", artist: "Myuu", song: "Tender Remains" },
    { id: "iHXkU2LKm50", title: "Myuu - Lament", artist: "Myuu", song: "Lament" },
    { id: "-G37YAeLV0M", title: "Myuu - Shelter", artist: "Myuu", song: "Shelter" },
    { id: "XhZ-Ny-onfg", title: "Myuu - Reversion 2015", artist: "Myuu", song: "Reversion 2015" },
    { id: "Dlta3Qgy_6I", title: "Myuu - Outsider", artist: "Myuu", song: "Outsider" },
    { id: "-IREVE3G6Yg", title: "Myuu - Children of the Night", artist: "Myuu", song: "Children of the Night" }
  ],
  "Electronic & EDM": [
    { id: "PPutRXXWe-Q", title: "Rihanna - Umbrella (Skeler Remix)", artist: "Skeler", song: "Umbrella" },
    { id: "p-N_y1bZtRw", title: "STARSET - My Demons", artist: "STARSET", song: "My Demons" },
    { id: "PMZqxmZwUe8", title: "Skeler - For You Pt. 1 & 2", artist: "Skeler", song: "For You" },
  ],
  "Anthemic Rap & Rock": [
    { id: "y2zCKOUjZG8", title: "ONLAP - Forever", artist: "ONLAP", song: "Forever" },
    { id: "lRN598t1l1o", title: "ONLAP - The Awakening", artist: "ONLAP", song: "The Awakening" },
    { id: "WzHyamdBZ2Y", title: "NEFFEX - NO TURNING BACK", artist: "NEFFEX", song: "NO TURNING BACK" },
  ],
  "Wave / Trap Wave": [
    { id: "LmcgmbRf5Ts", title: "VØJ, Narvent, KoruSe - Euphoria", artist: "VØJ, Narvent, KoruSe", song: "Euphoria" },
    { id: "45UxL7uzor4", title: "VXLLAIN, VYRØN - Isolated Reality", artist: "VXLLAIN, VYRØN", song: "Isolated Reality" },
    { id: "eWQuMIEzMqo", title: "Xalv - Forget It", artist: "Xalv", song: "Forget It" },
  ],
};

const MusicList = () => {
  return (
    <div style={{
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "30px 20px",
      fontFamily: "'Montserrat', 'Arial', sans-serif",
      backgroundColor: "#181818",
      color: "#fff",
      borderRadius: "12px",
      boxShadow: "0 4px 30px rgba(0, 0, 0, 0.3)",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "30px",
      }}>
        <h1 style={{ 
          color: "#f39c12", 
          fontSize: "2.5rem",
          fontWeight: "700",
          margin: "0"
        }}>
          My Music Gene 🎵
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

      {/* Quote Section */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "10vh",
      }}>
        <div style={{
          padding: "10px",
          backgroundColor: "rgba(30, 30, 30, 0.7)",
          borderRadius: "14px",
          borderLeft: "5px solid #f39c12", 
          maxWidth: "1000px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: "20px",
        }}>
          <p style={{
            fontSize: "18px",
            color: "#e0e0e0",
            lineHeight: "1.4",
            textAlign: "center",
            margin: "0",
          }}>
            Coffee wakes the body, Music frees the mind —My quick reset between the grind.<br />
            "The Art of strategically using music and coffee to boost work efficiency"
          </p>
        </div>
      </div>

      {/* Genre Sections */}
      {Object.entries(genres).map(([genre, songs]) => (
        <div key={genre} style={{ marginBottom: "50px" }}>
          <h2 style={{
            color: "#f39c12",
            borderBottom: "2px solid #f39c12",
            paddingBottom: "10px",
            fontSize: "1.8rem",
            fontWeight: "600",
          }}>
            {genre}
          </h2>
          
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "25px",
            marginTop: "20px",
          }}>
            {songs.map((song, index) => (
              <div key={index} style={{
                backgroundColor: "#222",
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0 10px 20px rgba(0,0,0,0.3)",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
              }}>
                <div style={{ position: "relative", paddingTop: "56.25%" }}>
                  <iframe
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      border: "none",
                    }}
                    src={`https://www.youtube.com/embed/${song.id}`}
                    title={song.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div style={{ padding: "16px" }}>
                  <h3 style={{ 
                    margin: "0 0 8px 0", 
                    color: "#fff",
                    fontSize: "18px", 
                    fontWeight: "600" 
                  }}>
                    {song.song}
                  </h3>
                  <p style={{ 
                    margin: "0", 
                    color: "#aaa",
                    fontSize: "14px" 
                  }}>
                    {song.artist}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Footer Quote */}
      <div style={{ 
        textAlign: "center", 
        marginTop: "30px", 
        color: "#888", 
        fontSize: "20px" 
      }}>
        <p>Music speaks what words fear to say</p>
      </div>
    </div>
  );
};

export default MusicList;