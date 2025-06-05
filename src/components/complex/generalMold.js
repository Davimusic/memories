'use client'; // Ensure this is a Client Component

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Menu from './menu';
import InternetStatus from './internetStatus';
import '../../app/globals.css';
import '../../estilos/general/generalMold.css';
import LoadingMemories from './loading';
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
  initialData,
  setInitialData // Function to update child's initialData
}) => {
  const [isDarkMode, setIsDarkMode] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [uid, setUid] = useState(null);
  const [token, setToken] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [permissionResult, setPermissionResult] = useState(initialData || null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionError, setPermissionError] = useState('');
  const router = useRouter();
  const { userID, memoryName } = router.query;

  console.log(visibility);
  

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
          setPermissionError('Authentication failed: Unable to verify user credentials.');
          setIsLoading(false);
        }
        const email = user.email || user.providerData?.[0]?.email;
        setUserEmail(email);
      } else {
        const path = window.location.pathname;
        localStorage.setItem('redirectPath', path);
        localStorage.setItem('reason', 'userEmailValidationOnly');
        router.push('/login');
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Fetch permission data
  useEffect(() => {
    const fetchPermissionData = async () => {
      const publicRoutes = ['/memories', '/createNewMemory'];
      const currentPath = router.pathname;

      if (publicRoutes.includes(currentPath)) {
        const publicData = { accessAllowed: true };
        setPermissionResult(publicData);
        setInitialData?.(publicData); // Update child's initialData
        setIsLoading(false);
        return;
      }

      if (!uid || !token || !userEmail) {
        setPermissionError('Authentication incomplete: Missing user ID, token, or email.');
        setIsLoading(false);
        return;
      }

      if (initialData && initialData.accessInformation && initialData.memoryMetadata) {
        setPermissionResult(initialData);
        setIsLoading(false);
        return;
      }

      const dynamicRoute = router.pathname;
      const basePath = dynamicRoute.split('/')[1];
      let realRoute = dynamicRoute;

      if (userID && memoryName) {
        realRoute = `/${basePath}/${userID}/${memoryName}`;
      } else {
        setPermissionError('Invalid URL: Missing userID or memoryName.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/mongoDb/queries/checkMemoryPermissionFromClient', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid,
            token,
            userEmail,
            path: realRoute,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Permission data:', data);
        setPermissionResult(data);
        setInitialData?.(data); // Update child's initialData
        if (!data.accessAllowed) {
          const memoryTitle = data.memoryMetadata?.title || 'this memory';
          setPermissionError(
            data.accessInformation?.reason ||
            `Access denied: You do not have permission to view ${memoryTitle}, which requires ${data.requiredVisibility} visibility.`
          );
        }
        setIsLoading(false);
      } catch (err) {
        console.error('Fetch error:', err.message);
        setPermissionError(`Failed to verify permissions: ${err.message}`);
        setIsLoading(false);
      }
    };

    if (uid && userEmail && token && !initialData) {
      fetchPermissionData();
    }
  }, [uid, userEmail, token, initialData, router.pathname, userID, memoryName, setInitialData]);

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

  if (isLoading) {
    return <LoadingMemories />;
  }

  const userRole =
    permissionResult?.accessInformation?.role ||
    (permissionResult?.currentUser === permissionResult?.memoryMetadata?.createdBy ? 'owner' : 'viewer');

  const showError = error || permissionError || (permissionResult && !permissionResult.accessAllowed);
  const errorContent = showError && (
    <div className="error-container" style={{ padding: '20px', textAlign: 'center' }}>
      <p className="color1 title-lg" aria-label="Error message">
        {permissionError || error || 'An unexpected error occurred.'}
      </p>
    </div>
  );

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
        <link rel="canonical" href={typeof window !== 'unknown' ? window.location.href : ''} />
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
        {permissionResult?.accessAllowed && !permissionError ? (
          <>
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
          </>
        ) : (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              width: '100%',
            }}
          >
            you do not have permission to see the content
          </div>
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









/*const GeneralMold = ({
  pageTitle = 'Default Page',
  pageDescription = 'Default page description',
  leftContent,
  rightContent,
  visibility = 'public',
  owner,
  metaKeywords = '',
  metaAuthor = '',
  error = '',
  initialData,
  setInitialData
}) => {
  const [isDarkMode, setIsDarkMode] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [uid, setUid] = useState(null);
  const [token, setToken] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [permissionResult, setPermissionResult] = useState(initialData || null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionError, setPermissionError] = useState('');
  const router = useRouter();
  const { userID, memoryName } = router.query;

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
          setPermissionError('Authentication failed: Unable to verify user credentials.');
          setIsLoading(false);
        }
        const email = user.email || user.providerData?.[0]?.email;
        setUserEmail(email);
      } else {
        const path = window.location.pathname;
        localStorage.setItem('redirectPath', path);
        localStorage.setItem('reason', 'userEmailValidationOnly');
        router.push('/login');
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Fetch permission data
  useEffect(() => {
   
    const fetchPermissionData = async () => {
      
      const publicRoutes = ['/memories', '/createNewMemory'];
      const currentPath = router.pathname;

      if (publicRoutes.includes(currentPath)) {
        setPermissionError('')
        setPermissionResult({accessAllowed: true})
        setIsLoading(false);
        return;
      }

      if (!uid || !token || !userEmail) {
        setPermissionError('Authentication incomplete: Missing user ID, token, or email.');
        setIsLoading(false);
        return;
      }

      

      if (initialData) {
        setPermissionResult(initialData);
        setIsLoading(false);
        return;
      }

      const dynamicRoute = router.pathname;
      const basePath = dynamicRoute.split('/')[1];
      let realRoute = dynamicRoute;

      if (userID && memoryName) {
        realRoute = `/${basePath}/${userID}/${memoryName}`;
      } else {
        setPermissionError('Invalid URL: Missing userID or memoryName.');
        setIsLoading(false);
        return;
      }

      
      
      try {
        const response = await fetch('/api/mongoDb/queries/checkMemoryPermissionFromClient', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid,
            token,
            userEmail,
            path: realRoute,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Permission data:', data);
        setPermissionResult(data);

        if (!data.accessAllowed) {
          const memoryTitle = data.memoryMetadata?.title || 'this memory';
          setPermissionError(
            data.accessInformation?.reason ||
            `Access denied: You do not have permission to view ${memoryTitle}, which requires ${data.requiredVisibility} visibility.`
          );
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Fetch error:', err.message);
        setPermissionError(`Failed to verify permissions: ${err.message}`);
        setIsLoading(false);
      }
    };

    if (uid && userEmail && token && !initialData) {
      fetchPermissionData();
    }
  }, [userID, memoryName, uid, userEmail, token, initialData, router.pathname]);

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

  if (isLoading) {
    return <LoadingMemories />;
  }

  // Infer user role if not provided in accessInformation
  const userRole =
    permissionResult?.accessInformation?.role ||
    (permissionResult?.currentUser === permissionResult?.memoryMetadata?.createdBy ? 'owner' : 'viewer');

  // Only show error content if there’s an error or permission denial
  const showError = error || permissionError || (permissionResult && !permissionResult.accessAllowed);
  const errorContent = showError && (
    <div className="error-container" style={{ padding: '20px', textAlign: 'center' }}>
      <p className="color1 title-lg" aria-label="Error message">
        {permissionError || error || 'An unexpected error occurred.'}
      </p>
    </div>
  );

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
        {permissionResult?.accessAllowed  && !permissionError ? (
          <>
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
          </>
        ) : (
          <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              width: '100%' // Asegura que el contenedor abarque todo el ancho disponible
            }}>
              you do not have permission to see the content
          </div>

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

export default GeneralMold;*/