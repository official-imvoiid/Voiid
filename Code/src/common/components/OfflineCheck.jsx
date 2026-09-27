import { useEffect, useState } from "react";

/* A banner pinned to the top of the screen while the browser is offline.
   Coming back online shows "Back online" for a moment (no reload, so nothing
   typed on the page is lost). */
const BACK_MS = 3000;

function OfflineNotification() {
  const [state, setState] = useState(navigator.onLine ? "" : "offline");   // "" | offline | online

  useEffect(() => {
    let timer = 0;
    const handleOnline = () => {
      setState("online");
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setState(""), BACK_MS);
    };
    const handleOffline = () => { window.clearTimeout(timer); setState("offline"); };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!state) return null;

  return (
    <div className={`offline-banner${state === "online" ? " is-online" : ""}`} role="status" onClick={() => setState("")}>
      {state === "offline" ? "You appear to be offline. Some parts of the site may not load." : "Back online."}
    </div>
  );
}

export default OfflineNotification;
