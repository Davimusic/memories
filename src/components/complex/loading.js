'use client'; // Ensure this is a Client Component

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import '../../app/globals.css';
import MemoryLogo from './memoryLogo';

const LoadingMemories = () => {
  const [isDarkMode, setIsDarkMode] = useState(null);

  // Apply dark mode from localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    const initialMode = savedMode ? JSON.parse(savedMode) : false;
    setIsDarkMode(initialMode);
    document.documentElement.classList.toggle('dark', initialMode);
  }, []);

  return (
    <div className="fullscreen-floating">
      <Head>
        <title>Loading Memories | Your App Name</title>
        <meta
          name="description"
          content="Loading your cherished memories in our application. Please wait a moment while we prepare your personalized experience."
        />
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="UTF-8" />
        <meta name="keywords" content="memories, loading, your app name" />
        <meta name="author" content="Your App Name" />
        <link rel="canonical" href= {`https://${process.env.NEXT_PUBLIC_DOMAINAPI_URL}.com/loading`}/>
      </Head>

      <div
        className="modal-content"
        role="status"
        aria-live="polite"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.2rem',
          gap: '20px',
          zIndex: 9999,
        }}
      >
        <MemoryLogo size={200} aria-label="Memories Logo" />
        <p className="color1 title-lg" aria-label="Loading memories">
          Loading...
        </p>
      </div>
    </div>
  );
};

export default LoadingMemories;