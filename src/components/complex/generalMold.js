'use client'; // Ensure this is a Client Component

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Menu from './menu';
import InternetStatus from './internetStatus';
import '../../app/globals.css';
import '../../estilos/general/generalMold.css';
import ErrorComponent from './error';
import { auth } from '../../../firebase'; 
const GeneralMold = ({
  pageTitle = 'Default Page',
  pageDescription = 'Default page description',
  leftContent,
  rightContent,
  visibility = 'public',
  owner,
  metaKeywords = '',
  metaAuthor = '',
  error = '',
  initialData // Optional: Server-side fetched permission data
}) => {
  const [isDarkMode, setIsDarkMode] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [uid, setUid] = useState(null);
  const [token, setToken] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [permissionResult, setPermissionResult] = useState(initialData || null);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionError, setPermissionError] = useState('');
  const router = useRouter();
  const { memoryId, memoryName } = router.query; // Extract memoryId and memoryName from dynamic route

  // Authentication check
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUid(user.uid);
        try {
          const token = await user.getIdToken();
          setToken(token);
        } catch (error) {
          console.error('Error getting token:', error);
          setPermissionError('Failed to authenticate user');
        }
        const email = user.email || user.providerData?.[0]?.email;
        setUserEmail(email);
      } else {
        const path = window.location.pathname;
        localStorage.setItem('redirectPath', path);
        localStorage.setItem('reason', 'userEmailValidationOnly');
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Fetch permission data if not provided by SSR
  useEffect(() => {
  const fetchPermissionData = async () => {
    // Skip permission check for routes like /memories
    const publicRoutes = ['/memories']; // Add other public routes as needed
    const currentPath = router.pathname;

    if (publicRoutes.includes(currentPath)) {
      setIsLoading(false);
      return;
    }

    // Proceed with permission check for routes requiring memoryId and memoryName
    if (!memoryId || !memoryName || !uid || !userEmail || !token) {
      console.log('esto es lo que pasa');
      
      setPermissionError('Missing required parameters');
      setIsLoading(false);
      return;
    }

    if (initialData) {
      setPermissionResult(initialData);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/mongoDb/queries/checkMemoryPermissionFromClient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: memoryId, // Assuming memoryId is used as userId for permission check
          memoryName,
          type: 'memories',
          uid,
          token,
          userEmail,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(data);

      setPermissionResult(data);

      if (!data.accessAllowed) {
        setPermissionError('You do not have permission to edit access to this memory');
        setIsLoading(false);
        return;
      }

      // Update state with accessInformation
      const accessInfo = data.accessInformation || {};
      setIsLoading(false);
    } catch (err) {
      console.error('Fetch error:', err.message);
      setPermissionError(err.message);
      setIsLoading(false);
    }
  };

  if (uid && userEmail && token && !initialData) {
    fetchPermissionData();
  }
}, [memoryId, memoryName, uid, userEmail, token, initialData, router.pathname]);

  // Toggle dark mode
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    const initialMode = savedMode ? JSON.parse(savedMode) : false;
    setIsDarkMode(initialMode);
    document.documentElement.classList.toggle('dark', initialMode);
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const newMode = !prev;
      localStorage.setItem('darkMode', JSON.stringify(newMode));
      document.documentElement.classList.toggle('dark', newMode);
      return newMode;
    });
  };

  const handleMenuToggle = () => setIsMenuOpen((prev) => !prev);

  const themeToggleButton = isDarkMode === null ? (
    <button className="theme-toggle button" aria-label="Loading theme...">
      ...
    </button>
  ) : (
    <button
      className="theme-toggle button"
      onClick={toggleDarkMode}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDarkMode ? '🌙' : '☀️'}
    </button>
  );

  const hasBothContent = leftContent && rightContent;

  /*/ Show ErrorComponent if there's an error or no permission
  if (error || permissionError || (!isLoading && !permissionResult?.accessAllowed)) {
    return (
      <ErrorComponent
        error={error || permissionError || 'You do not have permission to access this page'}
      />
    );
  }*/

  // Show loading state
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="general-mold" role="main" aria-label="Main content">
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={metaKeywords} />
        {metaAuthor && <meta name="author" content={metaAuthor} />}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={typeof window !== 'undefined' ? window.location.href : ''} />
        <meta name="robots" content={visibility === 'public' ? 'index, follow' : 'noindex'} />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : ''} />
      </Head>

      <InternetStatus setModalContent={setModalContent} setIsModalOpen={setIsModalOpen} />

      <header className="header">
        <button
          className="back-button button"
          onClick={() => window.history.back()}
          aria-label="Go back to previous page"
        >
          ←
        </button>
        <button
          className="menu-button button"
          onClick={handleMenuToggle}
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
        >
          ☰
        </button>
        {themeToggleButton}
        <div className="visibility">
          <span className="visibility-icon" aria-hidden="true">
            {visibility === 'public' ? '👁️' : visibility === 'private' ? '🔒' : '👥'}
          </span>
          <span className="visibility-label content-small">
            {visibility === 'public' ? 'Public' : visibility === 'private' ? 'Private' : 'Guests Only'}
          </span>
        </div>
      </header>

      <Menu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        aria-label="Navigation menu"
        isDarkMode={isDarkMode}
      />

      <div className={`content-container ${hasBothContent ? 'dual-content' : 'single-content'}`}>
        {leftContent && (
          <section
            className={`left-container card ${hasBothContent ? '' : 'full-width'}`}
            aria-label="Left content"
          >
            {leftContent}
          </section>
        )}
        {rightContent && (
          <section
            className={`right-container card ${hasBothContent ? '' : 'full-width'}`}
            aria-label="Right content"
          >
            {rightContent}
          </section>
        )}
      </div>

      {isModalOpen && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div
            className="modal-content"
            style={{
              backgroundColor: isDarkMode ? '#333' : '#fff',
              padding: '20px',
              borderRadius: '8px',
              maxWidth: '400px',
              width: '100%',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
            }}
          >
            {modalContent}
            <button
              onClick={() => setIsModalOpen(false)}
              style={{
                marginTop: '10px',
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              aria-label="Close modal"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneralMold;