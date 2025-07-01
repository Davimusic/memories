'use client'; // Ensure this is a Client Component

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import '../app/globals.css';
import MemoryLogo from '@/components/complex/memoryLogo';

const NotFound = () => {
  const [isDarkMode, setIsDarkMode] = useState(null);
  const router = useRouter();

  // Apply dark mode from localStorage and handle redirect
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    const initialMode = savedMode ? JSON.parse(savedMode) : false;
    setIsDarkMode(initialMode);
    document.documentElement.classList.toggle('dark', initialMode);

    // Redirect to homepage after 3 seconds
    const timer = setTimeout(() => {
      //router.push('/');
    }, 3000);

    return () => clearTimeout(timer); // Cleanup timer on unmount
  }, [router]);

  return (
    <div className="fullscreen-floating">
      <Head>
        <title>404 - Page Not Found | GoodMemories</title>
        <meta
          name="description"
          content="The page you are looking for could not be found. You will be redirected to the homepage shortly."
        />
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="UTF-8" />
        <meta name="keywords" content="404, not found, memories, goodmemories" />
        <meta name="author" content="GoodMemories" />
        <link rel="canonical" href={`https://${process.env.NEXT_PUBLIC_DOMAINAPI_URL}/404`} />
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
        <p className="color1 title-lg" aria-label="Page not found">
          404 - Page Not Found
        </p>
        <p className="color1" style={{ fontSize: '1rem', textAlign: 'center' }}>
          Oops! This page seems to have wandered off. Redirecting you to the homepage in 3 seconds...
        </p>
      </div>
    </div>
  );
};

export default NotFound;