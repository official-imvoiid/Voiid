import BackHome from "./BackHome";

/* Placeholder page for sections that are not written yet
   (About, Expertise, Work - see the routes in App.jsx).

     <ComingSoon title="About" />                                          */
const ComingSoon = ({ title }) => (
  <div className="cs">
    <div className="cs-shell">
      <div className="cs-head">
        <h1 className="cs-title">{title}</h1>
        <BackHome />
      </div>
      <p className="cs-text">{title} content coming soon…</p>
    </div>
  </div>
);

export default ComingSoon;
