import BackHome from "./BackHome";

const Work = () => (
  <div
    style={{
      minHeight: "100dvh",
      background: "var(--app-bg)",
      color: "var(--ink)",
      fontFamily: "Montserrat, Arial, sans-serif",
      padding: "clamp(18px, 4vw, 44px) var(--gutter) 64px",
      boxSizing: "border-box",
    }}
  >
    <div style={{ maxWidth: 1240, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <h1 style={{ margin: 0, color: "#f39c12", fontSize: "clamp(1.7rem, 4.2vw, 2.6rem)" }}>
          Work
        </h1>
        <BackHome />
      </div>
      <p style={{ marginTop: 18, color: "#9A9AA4" }}>Work content coming soon…</p>
    </div>
  </div>
);

export default Work;
