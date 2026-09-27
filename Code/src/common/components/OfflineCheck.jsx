import { useEffect, useState } from "react";

/* A banner pinned to the top of the screen while the browser is offline.
   Coming back online reloads the page. */
function OfflineNotification() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      window.location.reload();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="offline-banner">
      You appear to be offline. Checking connection...
    </div>
  );
}

export default OfflineNotification;
