'use client';
import { useEffect, useState } from 'react';
import '../../app/globals.css';

const InternetStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    console.log('InternetStatus mounted on route:', window.location.pathname);
    const handleOnline = () => {
      console.log('Internet connection restored');
      setIsOnline(true);
      setIsVisible(true);
      window.location.reload();
    };
    const handleOffline = () => {
      console.log('Internet connection lost');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial connection status
    setIsOnline(navigator.onLine);
    console.log('Initial connection status:', navigator.onLine);

    // Periodic connectivity check
    const checkConnection = async () => {
      try {
        await fetch('https://www.google.com', { mode: 'no-cors' });
        if (!isOnline) {
          setIsOnline(true);
          setIsVisible(true);
          window.location.reload();
        }
      } catch {
        setIsOnline(false);
      }
    };
    const interval = setInterval(checkConnection, 5000);

    return () => {
      console.log('InternetStatus unmounted');
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [isOnline]);

  const handleClose = () => {
    setIsVisible(false);
  };

  return (
    <>
      {!isOnline && isVisible && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999]"
          style={{ pointerEvents: 'none' }}
        >
          <div
            className="title-lg backgroundColor1 pulse"
            style={{
              padding: '20px',
              transform: 'translate(-50%, -50%)',
              position: 'absolute',
              top: '50%',
              left: '50%',
              zIndex: 100000,
              borderRadius: '20px',
            }}
          >
            <style jsx>{`
              @keyframes pulse {
                0% {
                  transform: translate(-50%, -50%) scale(1);
                }
                50% {
                  transform: translate(-50%, -50%) scale(1.05);
                }
                100% {
                  transform: translate(-50%, -50%) scale(1);
                }
              }
              .pulse {
                animation: pulse 2s ease-in-out infinite !important;
              }
            `}</style>
            <p className="text-gray-800">
              It seems like there's no internet connection. Please check your network and try again.
            </p>
            <button
              onClick={handleClose}
              className="button2"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default InternetStatus;




