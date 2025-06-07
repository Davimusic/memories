import React from 'react';
import Head from 'next/head'; 
import '../../app/globals.css';
import MemoryLogo from './memoryLogo';

const LoadingMemories = () => {
  return (
    <div className="fullscreen-floating">
      <Head>
        <title>Loading Memories | Your App Name</title>
        <meta name="description" content="Loading your cherished memories in our application. Please wait a moment while we prepare your personalized experience." />
        <meta name="robots" content="noindex, nofollow" /> {/* Prevent indexing of loading pages */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="UTF-8" />
        <meta name="keywords" content="memories, loading, your app name" />
        <meta name="author" content="Your App Name" />
        <link rel="canonical" href="https://yourdomain.com/loading" /> {/* Adjust to your domain */}
      </Head>
      
        <div
          className='modal-content'
          //className="loading backgroundColor1"
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