import BackHome from "./BackHome";

const Literature = () => (
  <div
    style={{
      minHeight: "100vh",
      background: "#141416",
      color: "#F2F2F4",
      fontFamily: "Montserrat, Arial, sans-serif",
      padding: "clamp(18px, 4vw, 44px) clamp(14px, 5vw, 56px) 64px",
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
          Literature
        </h1>
        <BackHome />
      </div>
      <p style={{ marginTop: 18, color: "#9A9AA4" }}>Literature content coming soon…</p>
    </div>
  </div>
);

export default Literature;
