import BackHome from "./BackHome";

/* The page for an address that isn't a route (App.jsx, path="*"). Same frame
   as ComingSoon: common/styles/components/coming-soon.css */
const NotFound = () => (
  <div className="cs">
    <div className="cs-shell">
      <div className="cs-head">
        <h1 className="cs-title">Page not found</h1>
        <BackHome />
      </div>
      <p className="cs-text">There is nothing at this address. The link may be old or mistyped.</p>
    </div>
  </div>
);

export default NotFound;
