
/*'use client'; 

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Menu from './menu';
import '../../app/globals.css';
import '../../estilos/general/generalMold.css';
import LoadingMemories from './loading';
import { auth } from '../../../firebase';
import { toast } from 'react-toastify'; 

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
  setInitialData,
  setUidChild,
  setTokenChild,
  setUserEmailChild
}) => {
  const [isDarkMode, setIsDarkMode] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [uid, setUid] = useState('');
  const [token, setToken] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [permissionResult, setPermissionResult] = useState(initialData || null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionError, setPermissionError] = useState('');
  const [basePath, setBasePath] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const router = useRouter();
  const { userID, memoryName } = router.query;

  const notifySuccess = (message) => toast.success(message);
  const notifyFail = (message) => toast.error(message);

  // Pass uid, token, userEmail to parent if provided
  useEffect(() => {
    if (setUidChild && uid !== undefined && uid !== null) setUidChild(uid);
  }, [uid, setUidChild]);

  useEffect(() => {
    if (setTokenChild && token !== undefined && token !== null) setTokenChild(token);
  }, [token, setTokenChild]);

  useEffect(() => {
    if (setUserEmailChild && userEmail !== undefined && userEmail !== null) setUserEmailChild(userEmail);
  }, [userEmail, setUserEmailChild]);

  // Fetch permission data and handle authentication based on requiredVisibility
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
          return;
        }
        const email = user.email || user.providerData?.[0]?.email;
        setUserEmail(email);
      } else {
        setUid(null);
        setToken(null);
        setUserEmail(null);
      }
    });

    if ([uid, token, userEmail].every(value => value === null) || (uid && token && userEmail)) {
      fetchPermissionData();
    }

    return () => unsubscribe();
  }, [router, uid, token, userEmail, retryCount]);

  const fetchPermissionData = async () => {
    const dynamicRoute = router.pathname;
    const basePath = dynamicRoute.split('/')[1];
    let realRoute = dynamicRoute;
    setBasePath(basePath);

    if (userID && memoryName) {
      realRoute = `/${basePath}/${userID}/${memoryName}`;
    }

    try {
      const response = await fetch('/api/mongoDb/queries/checkMemoryPermissionFromClient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: uid || null,
          token: token || null,
          userEmail: userEmail || null,
          path: realRoute,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Permission data:', data);
      //setInitialData(data);
      if (typeof setInitialData === 'function') {
        console.log('setInitialData es una funcion');
        
      setInitialData(data);
      } else {
        console.log('setInitialData NO es una funcion');
      }
      setPermissionResult(data);

      if (data.requiredVisibility === 'public') {
        setIsLoading(false);
      } else if (!uid) {
        const path = window.location.pathname;
        localStorage.setItem('redirectPath', path);
        localStorage.setItem('reason', 'userEmailValidationOnly');
        router.push('/login');
      } else if (data.accessAllowed) {
        setIsLoading(false);
      } else {
        if (retryCount < 2) {
          setRetryCount(prev => prev + 1);
          setTimeout(() => {
            window.location.reload();
          }, 1000); // Delay to prevent rapid reloads
        } else {
          setPermissionError('Access denied after multiple attempts. Please contact support.');
          setIsLoading(false);
        }
      }
    } catch (err) {
      console.error('Fetch error:', err.message);
      setPermissionError(`Failed to verify permissions: ${err.message}`);
      setIsLoading(false);
    }
  };

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
    <div className={!(basePath === "/payment" || basePath === "/editAccessibility") ? "general-mold" : ""} role="main" aria-label="Main content">
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={metaKeywords} />
        {metaAuthor && <meta name="author" content={metaAuthor} />}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={typeof window !== 'undefined' ? window.location.href : ''} />
        <meta name="robots" content={permissionResult?.requiredVisibility === 'public' ? 'index, follow' : 'noindex'} />
        <link rel="canonical" href={typeof window !== 'unknown' ? window.location.href : ''} />
      </Head>

      <header className="headerGeneralMold">
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
            {permissionResult?.requiredVisibility === 'public' ? '👁️' : 
             permissionResult?.requiredVisibility === 'private' ? '🔒' :
             permissionResult?.requiredVisibility === "invitation" ? '✉️' : ''}
          </span>
          <span className="visibility-label content-small">
            {permissionResult?.requiredVisibility === 'public' ? 'Public' : 
             permissionResult?.requiredVisibility === 'private' ? 'Private' :
             permissionResult?.requiredVisibility === 'invitation' ? 'By invitation' : ''}
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
            {retryCount >= 2 ? 'Access denied after multiple attempts. Please contact support.' : 'you do not have permission to see the content'}
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







'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Menu from './menu';
import '../../app/globals.css';
import '../../estilos/general/generalMold.css';
import LoadingMemories from './loading';
import { auth } from '../../../firebase';
import { toast } from 'react-toastify';

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
  setInitialData,
  setUidChild,
  setTokenChild,
  setUserEmailChild,
  successMessage = '', // New prop for success messages
  failMessage = '',   // New prop for failure messages
}) => {
  const [isDarkMode, setIsDarkMode] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [uid, setUid] = useState('');
  const [token, setToken] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [permissionResult, setPermissionResult] = useState(initialData || null);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionError, setPermissionError] = useState('');
  const [basePath, setBasePath] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const router = useRouter();
  const { userID, memoryName,  dynamicMemoryID} = router.query;

  // Store previous values of successMessage and failMessage
  const prevSuccessMessageRef = useRef('');
  const prevFailMessageRef = useRef('');

  const notifySuccess = (message) => toast.success(message);
  const notifyFail = (message) => toast.error(message);

  

   useEffect(() => {
    if (setUidChild && uid !== undefined && uid !== null) setUidChild(uid);
  }, [uid, setUidChild]);

  useEffect(() => {
    if (setTokenChild && token !== undefined && token !== null) setTokenChild(token);
  }, [token, setTokenChild]);

  useEffect(() => {
    if (setUserEmailChild && userEmail !== undefined && userEmail !== null) setUserEmailChild(userEmail);
  }, [userEmail, setUserEmailChild]);

  // Detect changes in successMessage and trigger toast if different
  useEffect(() => {
    if (successMessage && successMessage !== prevSuccessMessageRef.current) {
      notifySuccess(successMessage);
      prevSuccessMessageRef.current = successMessage; // Update previous value
    }
  }, [successMessage]);

  // Detect changes in failMessage and trigger toast if different
  useEffect(() => {
    if (failMessage && failMessage !== prevFailMessageRef.current) {
      notifyFail(failMessage);
      prevFailMessageRef.current = failMessage; // Update previous value
    }
  }, [failMessage]);

  // Fetch permission data and handle authentication based on requiredVisibility
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
          return;
        }
        const email = user.email || user.providerData?.[0]?.email;
        setUserEmail(email);
      } else {
        setUid(null);
        setToken(null);
        setUserEmail(null);
      }
    });

    //if ([uid, token, userEmail].every((value) => value === null) || (uid && token && userEmail)) {
      fetchPermissionData();
    //}

    return () => unsubscribe();
  }, [router, uid, token, userEmail, retryCount]);

  const fetchPermissionData = async () => {
    
    
    const dynamicRoute = router.pathname;
    const basePath = dynamicRoute.split('/')[1];
    let realRoute = dynamicRoute;
    setBasePath(basePath);

    if (userID && memoryName) {
      realRoute = `/${basePath}/${userID}/${memoryName}/${dynamicMemoryID}`;
    }

    console.log('.......basePath');
    console.log(basePath);
    
    

    try {
      const response = await fetch('/api/mongoDb/queries/checkMemoryPermissionFromClient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: uid || null,
          token: token || null,
          userEmail: userEmail || null,
          path: realRoute,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      
      
console.log('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
      console.log(data);

      
      
      console.log('Permission data:', {
          ...data,           // Conservas todas las propiedades originales de data
          userID,            // Agregas userID (equivalente a userID: userID)
          memoryName         // Agregas memoryName (equivalente a memoryName: memoryName)
        });
      if (typeof setInitialData === 'function') {
        setInitialData({
          ...data,           // Conservas todas las propiedades originales de data
          userID,            // Agregas userID (equivalente a userID: userID)
          memoryName         // Agregas memoryName (equivalente a memoryName: memoryName)
        });
      }

      console.log('debe pasar');
      
      console.log(data);
      
      
      setPermissionResult(data);

      if (data.requiredVisibility === 'public') {
        setIsLoading(false);
      } else if (!uid) {
        const path = window.location.pathname;
        localStorage.setItem('redirectPath', path);
        localStorage.setItem('reason', 'userEmailValidationOnly');
        router.push('/login');
      } else if (data.accessAllowed) {
        setIsLoading(false);
      } else {
        if (retryCount < 2) {
          setRetryCount((prev) => prev + 1);
          setTimeout(() => {
            window.location.reload();
          }, 1000); // Delay to prevent rapid reloads
        } else {
          setPermissionError('Access denied after multiple attempts. Please contact support.');
          setIsLoading(false);
        }
      }
    } catch (err) {
      console.error('Fetch error:', err.message);
      setPermissionError(`Failed to verify permissions: ${err.message}`);
      setPermissionError(null);
      setIsLoading(false);
    }
  };

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
    (permissionResult?.currentUser === permissionResult?.memoryMetadata?.createdBy
      ? 'owner'
      : 'viewer');

  const showError = error || permissionError || (permissionResult && !permissionResult.accessAllowed);
  const errorContent = showError && (
    <div className="error-container" style={{ padding: '20px', textAlign: 'center' }}>
      <p className="color1 title-lg" aria-label="Error message">
        {permissionError || error || 'An unexpected error occurred.'}
      </p>
    </div>
  );

  return (
    <div
      className={!(basePath === '/payment' || basePath === '/editAccessibility') ? 'general-mold' : ''}
      role="main"
      aria-label="Main content"
    >
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={metaKeywords} />
        {metaAuthor && <meta name="author" content={metaAuthor} />}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={typeof window !== 'undefined' ? window.location.href : ''} />
        <meta
          name="robots"
          content={permissionResult?.requiredVisibility === 'public' ? 'index, follow' : 'noindex'}
        />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : ''} />
      </Head>

      <header className="headerGeneralMold">
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
            {permissionResult?.requiredVisibility === 'public'
              ? '👁️'
              : permissionResult?.requiredVisibility === 'private'
              ? '🔒'
              : permissionResult?.requiredVisibility === 'invitation'
              ? '✉️' : ''}
          </span>
          <span className="visibility-label content-small">
            {permissionResult?.requiredVisibility === 'public'
              ? 'Public'
              : permissionResult?.requiredVisibility === 'private'
              ? 'Private'
              : permissionResult?.requiredVisibility === 'invitation'
              ? 'By invitation' : ''}
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
            {retryCount >= 2
              ? 'Access denied after multiple attempts. Please contact support.'
              : 'You do not have permission to see the content'}
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




















