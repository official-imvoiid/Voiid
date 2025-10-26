import React, { useEffect, useState } from 'react';

function OfflineNotification() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  useEffect(() => {
    // Event Handlers
    const handleOnline = () => {
      console.log('Network status: Online');
      setIsOffline(false);
      window.location.reload(); // Reload page
    };

    const handleOffline = () => {
      console.log('Network status: Offline');
      setIsOffline(true);
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup Function
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // If the user is not offline, render nothing
  if (!isOffline) {
    return null;
  }

  // Fixed position banner that always stays at the top of the viewport
  return (
    <div
      style={{
        position: 'fixed', // Use fixed to stay at top of viewport while scrolling
        top: 0,
        left: 0,
        width: '100%',
        background: '#f44336',
        color: 'white',
        padding: '4px 20px',
        textAlign: 'center',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
        zIndex: 9999, // Very high z-index to ensure it's above everything
        fontFamily: 'Arial, sans-serif',
        fontSize: '0.9em',
        lineHeight: '1.4',
        boxSizing: 'border-box',
      }}
    >
      You appear to be offline. Checking connection...
    </div>
  );
}

export default OfflineNotification;