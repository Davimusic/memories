'use client'; 

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
//import styles from '../../estilos/general/memoriesIndex.module.css'; 
//import '../../estilos/general/general.css'
import '../../app/globals.css'
import '../../estilos/general/memoriesIndex.css'
import MemoryLogo from './memoryLogo';
import Menu from './menu';
import MenuIcon from './menuIcon';
import BackgroundGeneric from './backgroundGeneric';
import ShowHide from './showHide';
import UploadIcon from './icons/uploadIcon';
import EditToggleIcon from './EditToggleIcon ';
import Head from 'next/head';
import ErrorComponent from './error';
import { auth } from '../../../firebase';
import { toast } from 'react-toastify';
import LoadingMemories from './loading';
import GeneralMold from './generalMold';
import EditPermissionsIcon from './icons/editPermissionsIcon';






/*export default function MemoriesIndex({ initialMemories, userInfo, error: initialError }) {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState(null);
  const [uid, setUid] = useState(null);
  const [token, setToken] = useState(null);
  const [memoriesState, setMemoriesState] = useState(initialMemories || {});
  const [loading, setLoading] = useState(!initialMemories && !initialError);
  const [error, setError] = useState(initialError || null);
  const [sortType, setSortType] = useState('alphabetical');
  const [filteredMemories, setFilteredMemories] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userID, setUserID] = useState(userInfo?.userInfoId || '');
  const [userInformation, setUserInformation] = useState(userInfo?.userInformation || {});

  const notifySuccess = (message) => toast.success(message);
  const notifyFail = (message) => toast.error(message);

  // Authentication check
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUid(user.uid);
        try {
          const idToken = await user.getIdToken();
          setToken(idToken);
          const email = user.email || user.providerData?.[0]?.email;
          setUserEmail(email);
        } catch (error) {
          console.error('Error getting token:', error);
          setError('Failed to authenticate user');
          setLoading(false);
        }
      } else {
        notifyFail('Please log in before continuing...');
        const path = window.location.pathname;
        localStorage.setItem('redirectPath', path);
        localStorage.setItem('reason', 'userEmailValidationOnly');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Fetch memories data if not provided by SSR
  useEffect(() => {
    const fetchMemories = async () => {
      if (!userEmail || !uid || !token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/mongoDb/getAllReferencesUser', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userEmail, uid, token }),
        });

        if (!response.ok) {
          if (response.status === 404) {
            setMemoriesState({});
            setUserID('');
            setLoading(false);
            setError('No memories found');
            return;
          }
          const errorInfo = await response.json().catch(() => ({}));
          const errorMessage = errorInfo.message || 'Network response error';
          throw new Error(`Error ${response.status}: ${errorMessage}`);
        }

        const data = await response.json();
        if (data.success) {
          setUserID(data.userInfoId);
          const { userInformation, ...actualMemories } = data.memories;
          setUserInformation(data.memories.userInformation);
          setMemoriesState(actualMemories);
        } else {
          throw new Error('Error fetching memories');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (userEmail && uid && token && !initialMemories) {
      fetchMemories();
    }
  }, [userEmail, uid, token, initialMemories]);

  // Sort memories
  useEffect(() => {
    const entries = Object.entries(memoriesState);
    let sortedEntries = entries;

    if (sortType === 'alphabetical') {
      sortedEntries = entries.sort((a, b) => a[0].localeCompare(b[0]));
    } else if (sortType === 'creationDate') {
      sortedEntries = entries.sort((a, b) => {
        const dateA = new Date(a[1]?.metadata?.createdAt || 0);
        const dateB = new Date(b[1]?.metadata?.createdAt || 0);
        return dateA - dateB;
      });
    } else if (sortType === 'lastModified') {
      sortedEntries = entries.sort((a, b) => {
        const dateA = new Date(a[1]?.metadata?.lastUpdated || 0);
        const dateB = new Date(b[1]?.metadata?.lastUpdated || 0);
        return dateB - dateA;
      });
    }
    setFilteredMemories(sortedEntries);
  }, [memoriesState, sortType]);

  const handleCreateMemory = () => {
    if (!userEmail || !uid || !token) {
      const path = window.location.pathname;
      localStorage.setItem('redirectPath', path);
      localStorage.setItem('reason', 'createNewUser');
      router.push('/login');
      return;
    }
    router.push('/createNewMemory');
  };

  const handleSortChange = (e) => {
    setSortType(e.target.value);
  };

  // Structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Your Memories',
    description: 'View and manage your personal memories in the Memory App',
    url: 'https://yourdomain.com/memories', // Replace with your domain
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: filteredMemories.map(([memoryTitle, details], index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'CreativeWork',
          name: details.metadata?.title || memoryTitle,
          description: details.metadata?.description || 'No description available',
          dateCreated: details.metadata?.createdAt || undefined,
          dateModified: details.metadata?.lastUpdated || undefined,
        },
      })),
    },
  };

  if (loading) {
    return <LoadingMemories />;
  }

  if (error) {
    return (
      <main className={`${styles.container} fullscreen-floating mainFont backgroundColor1 color2`}>
        <Head>
          <title>Error | Memory App</title>
          <meta name="description" content="An error occurred while loading your memories" />
          <meta name="robots" content="noindex" />
        </Head>
        <ErrorComponent error={error} />
      </main>
    );
  }

  return (
    <main className={`${styles.container} ${styles.fadeIn} fullscreen-floating color1 mainFont`} aria-labelledby="memories-heading">
      <Head>
        <title>Your Memories | Memory App</title>
        <meta name="description" content="View, manage, and create your personal memories in the Memory App" />
        <meta name="keywords" content="memories, personal memories, memory app, organize memories" />
        <meta property="og:title" content="Your Memories | Memory App" />
        <meta property="og:description" content="View, manage, and create your personal memories in the Memory App" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://yourdomain.com/memories" /> 
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Your Memories | Memory App" />
        <meta name="twitter:description" content="View, manage, and create your personal memories in the Memory App" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </Head>

      <Menu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        className="backgroundColor1 mainFont"
        aria-label="Navigation menu"
      />

      <section className={`backgroundColor5 ${styles.frame}`} style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <h1 id="memories-heading" className="visually-hidden">Your Memories</h1>
        <div className={styles.controlsContainer}>
          <div className={styles.leftControls}>
            <button
              style={{backgroundColor: 'none', border: 'none'}}
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open navigation menu"
              className={styles.iconButton}
            >
              <MenuIcon onClick={() => setIsMenuOpen(true)} size={30} />
            </button>
            {filteredMemories.length > 0 && (
              <div className={styles.filterContainer}>
                <label htmlFor="sort" className="visually-hidden">Sort memories by</label>
                <select
                  id="sort"
                  className={styles.appleSelect}
                  value={sortType}
                  onChange={handleSortChange}
                  aria-label="Sort memories"
                >
                  <option value="alphabetical">Name</option>
                  <option value="creationDate">Creation Date</option>
                  <option value="lastModified">Last Modified</option>
                </select>
              </div>
            )}
          </div>
          <button
            className={`mainFont ${styles.appleButton} ${
              filteredMemories.length === 0 ? styles.highlightButton : ''
            }`}
            onClick={handleCreateMemory}
            aria-label="Create new memory"
          >
            New Memory
          </button>
        </div>

        {filteredMemories.length === 0 ? (
          <div className={styles.emptyState} role="status">
            <MemoryLogo />
            <p className="title-md color2">No memories found. Click "New Memory" to create a new one</p>
          </div>
        ) : (
          <div
            style={{
              maxHeight: '80vh',
              overflowY: 'auto',
              display: 'flex',
              justifyContent: 'center',
              flex: 1,
            }}
            role="region"
            aria-labelledby="memories-table"
          >
            <div className={styles.appleTableContainer} role="grid" aria-labelledby="memories-table">
              <div className={`${styles.tableHeader} backgroundColor2 title-sm color1`} role="row">
                <div className={styles.headerCell} style={{ flex: 1 }} role="columnheader">
                  Actions
                </div>
                <div className={styles.headerCell} style={{ flex: 3 }} role="columnheader">
                  Name
                </div>
                <div className={styles.headerCell} style={{ flex: 2 }} role="columnheader">
                  Description
                </div>
                <div className={styles.headerCell} style={{ flex: 2 }} role="columnheader">
                  Types
                </div>
                <div className={styles.headerCell} style={{ flex: 1 }} role="columnheader">
                  Created
                </div>
                <div className={styles.headerCell} style={{ flex: 1 }} role="columnheader">
                  Modified
                </div>
              </div>

              {filteredMemories.map(([memoryTitle, details], index) => (
                <div
                  key={index}
                  className={styles.tableRow}
                  style={{
                    backgroundColor: index % 2 === 0 ? '#00000042' : 'none',
                  }}
                  role="row"
                >
                  <div className={`${styles.tableCell} ${styles.actionsCell}`} style={{ flex: 1, display: 'flex', gap: '10px' }} role="cell">
                    <button
                      style={{backgroundColor: '#ffffff00', border: 'none'}}
                      onClick={() => router.push(`/memories/${userInformation.id}/${encodeURIComponent(memoryTitle)}`)}
                      aria-label={`View ${details.metadata?.title || memoryTitle}`}
                      className={styles.actionButton}
                    >
                      <ShowHide onClick={() => router.push(`/memories/${userInformation.id}/${encodeURIComponent(memoryTitle)}`)} size={24} />
                    </button>
                    <button
                      style={{backgroundColor: '#ffffff00', border: 'none'}}
                      onClick={() => router.push(`/uploadFiles/${userInformation.id}/${encodeURIComponent(memoryTitle)}`)}
                      aria-label={`Upload files to ${details.metadata?.title || memoryTitle}`}
                      className={styles.actionButton}
                    >
                      <UploadIcon onClick={() => router.push(`/uploadFiles/${userInformation.id}/${encodeURIComponent(memoryTitle)}`)} size={24} />
                    </button>
                    <button
                      style={{backgroundColor: '#ffffff00', border: 'none'}}
                      onClick={() => router.push(`/editMemories/${userInformation.id}/${encodeURIComponent(memoryTitle)}`)}
                      aria-label={`Edit ${details.metadata?.title || memoryTitle}`}
                      className={styles.actionButton}
                    >
                      <EditToggleIcon onClick={() => router.push(`/editMemories/${userInformation.id}/${encodeURIComponent(memoryTitle)}`)} size={24} />
                    </button>
                    <button
                      style={{backgroundColor: '#ffffff00', border: 'none'}}
                      onClick={() => router.push(`/editAccessibility/${userInformation.id}/${encodeURIComponent(memoryTitle)}`)}
                      aria-label={`Edit accessibility${details.metadata?.title || memoryTitle}`}
                      className={styles.actionButton}
                    >
                      <EditPermissionsIcon onClick={() => router.push(`/editAccessibility/${userInformation.id}/${encodeURIComponent(memoryTitle)}`)} size={24} />
                    </button>
                  </div>
                  <div className={`${styles.tableCell} ${styles.cellWithScroll}`} style={{ flex: 3 }} role="cell">
                    <div className={styles.scrollContent} data-label="Name">{details.metadata?.title || '—'}</div>
                  </div>
                  <div className={`${styles.tableCell} ${styles.cellWithScroll}`} style={{ flex: 2 }} role="cell">
                    <div className={styles.scrollContent} data-label="Description">{details.metadata?.description || '—'}</div>
                  </div>
                  <div className={styles.tableCell} style={{ flex: 2 }} role="cell">
                    <div className={styles.typeBadges} data-label="Types">
                      {Object.entries(details.media)
                        .filter(([_, mediaArray]) => mediaArray.length > 0)
                        .map(([mediaType, mediaArray]) => (
                          <span key={mediaType} className={styles.typeBadge}>
                            {mediaType.toUpperCase()} ({mediaArray.length})
                          </span>
                        ))}
                    </div>
                  </div>
                  <div className={styles.tableCell} style={{ flex: 1 }} role="cell">
                    <div style={{ display: 'flex' }} data-label="Created">
                      <span className={styles.mobileLabel}>Created: </span>
                      {details.metadata?.createdAt ? new Date(details.metadata.createdAt).toLocaleDateString() : '—'}
                    </div>
                  </div>
                  <div className={styles.tableCell} style={{ flex: 1 }} role="cell">
                    <div style={{ display: 'flex' }} data-label="Modified">
                      <span className={styles.mobileLabel}>Modified: </span>
                      {details.metadata?.lastUpdated ? new Date(details.metadata.lastUpdated).toLocaleDateString() : '—'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <style jsx global>{`
        .visually-hidden {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>
    </main>
  );
}

// Server-Side Rendering
export async function getServerSideProps(context) {
  const { req } = context;
  try {
    // Simulate Firebase auth on the server (you may need to adjust based on your Firebase setup)
    const user = req.user; // This depends on your auth middleware
    if (!user) {
      return {
        redirect: {
          destination: '/login',
          permanent: false,
        },
      };
    }

    const idToken = await user.getIdToken();
    const userEmail = user.email || user.providerData?.[0]?.email;
    const uid = user.uid;

    // Fetch memories from API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mongoDb/getAllReferencesUser`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userEmail, uid, token: idToken }),
    });

    if (!response.ok) {
      return {
        props: {
          error: `Error ${response.status}: ${await response.text()}`,
        },
      };
    }

    const data = await response.json();
    if (data.success) {
      const { userInformation, ...actualMemories } = data.memories;
      return {
        props: {
          initialMemories: actualMemories,
          userInfo: {
            userInfoId: data.userInfoId,
            userInformation,
          },
        },
      };
    } else {
      return {
        props: {
          error: 'Error fetching memories',
        },
      };
    }
  } catch (error) {
    console.error('SSR Error:', error);
    return {
      props: {
        error: 'Server error occurred',
      },
    };
  }
}*/






export default function MemoriesIndex({ initialMemories, userInfo, error: initialError }) {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState(null);
  const [uid, setUid] = useState(null);
  const [token, setToken] = useState(null);
  const [memoriesState, setMemoriesState] = useState(initialMemories || {});
  const [loading, setLoading] = useState(!initialMemories && !initialError);
  const [error, setError] = useState(initialError || null);
  const [sortType, setSortType] = useState('alphabetical');
  const [filteredMemories, setFilteredMemories] = useState([]);
  const [userID, setUserID] = useState(userInfo?.userInfoId || '');
  const [userInformation, setUserInformation] = useState(userInfo?.userInformation || {});

  const notifySuccess = (message) => toast.success(message);
  const notifyFail = (message) => toast.error(message);

  // Authentication check
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUid(user.uid);
        try {
          const idToken = await user.getIdToken();
          setToken(idToken);
          const email = user.email || user.providerData?.[0]?.email;
          setUserEmail(email);
        } catch (error) {
          console.error('Error getting token:', error);
          setError('Failed to authenticate user');
          setLoading(false);
        }
      } else {
        notifyFail('Please log in before continuing...');
        const path = window.location.pathname;
        localStorage.setItem('redirectPath', path);
        localStorage.setItem('reason', 'userEmailValidationOnly');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Fetch memories data if not provided
  useEffect(() => {
    const fetchMemories = async () => {
      if (!userEmail || !uid || !token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/mongoDb/getAllReferencesUser', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userEmail, uid, token }),
        });

        if (!response.ok) {
          if (response.status === 404) {
            setMemoriesState({});
            setUserID('');
            setLoading(false);
            setError('No memories found');
            return;
          }
          const errorInfo = await response.json().catch(() => ({}));
          const errorMessage = errorInfo.message || 'Network response error';
          throw new Error(`Error ${response.status}: ${errorMessage}`);
        }

        const data = await response.json();
        if (data.success) {
          setUserID(data.userInfoId);
          const { userInformation, ...actualMemories } = data.memories;
          setUserInformation(data.memories.userInformation);
          setMemoriesState(actualMemories);
        } else {
          throw new Error('Error fetching memories');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (userEmail && uid && token && !initialMemories) {
      fetchMemories();
    }
  }, [userEmail, uid, token, initialMemories]);

  // Sort memories
  useEffect(() => {
    const entries = Object.entries(memoriesState);
    let sortedEntries = entries;

    if (sortType === 'alphabetical') {
      sortedEntries = entries.sort((a, b) => a[0].localeCompare(b[0]));
    } else if (sortType === 'creationDate') {
      sortedEntries = entries.sort((a, b) => {
        const dateA = new Date(a[1]?.metadata?.createdAt || 0);
        const dateB = new Date(b[1]?.metadata?.createdAt || 0);
        return dateA - dateB;
      });
    } else if (sortType === 'lastModified') {
      sortedEntries = entries.sort((a, b) => {
        const dateA = new Date(a[1]?.metadata?.lastUpdated || 0);
        const dateB = new Date(b[1]?.metadata?.lastUpdated || 0);
        return dateB - dateA;
      });
    }
    setFilteredMemories(sortedEntries);
  }, [memoriesState, sortType]);

  const handleCreateMemory = () => {
    if (!userEmail || !uid || !token) {
      const path = window.location.pathname;
      localStorage.setItem('redirectPath', path);
      localStorage.setItem('reason', 'createNewUser');
      router.push('/login');
      return;
    }
    router.push('/createNewMemory');
  };

  const handleSortChange = (e) => {
    setSortType(e.target.value);
  };

  // Structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Your Memories',
    description: 'View and manage your personal memories in the Memory App',
    url: typeof window !== 'undefined' ? window.location.href : 'https://yourdomain.com/memories',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: filteredMemories.map(([memoryTitle, details], index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'CreativeWork',
          name: details.metadata?.title || memoryTitle,
          description: details.metadata?.description || 'No description available',
          dateCreated: details.metadata?.createdAt || undefined,
          dateModified: details.metadata?.lastUpdated || undefined,
        },
      })),
    },
  };

  // Content for GeneralMold
  const leftContent = loading ? (
    <LoadingMemories />
  ) : error ? (
    <ErrorComponent error={error} />
  ) : (
    <section className="card p-3" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
      <h1 className="visually-hidden">Your Memories</h1>
      <div className="flex-column">
        <div className="flex-column">
          {filteredMemories.length > 0 && (
            <div className="flex-column">
              <label htmlFor="sort" className="visually-hidden">Sort memories by</label>
              <select
                id="sort"
                className="rounded p-2 border"
                value={sortType}
                onChange={handleSortChange}
                aria-label="Sort memories"
              >
                <option value="alphabetical">Name</option>
                <option value="creationDate">Creation Date</option>
                <option value="lastModified">Last Modified</option>
              </select>
            </div>
          )}
          <button
            className={`button2 rounded p-2 ${filteredMemories.length === 0 ? 'backgroundColor2' : ''}`}
            onClick={handleCreateMemory}
            aria-label="Create new memory"
          >
            New Memory
          </button>
        </div>

        {filteredMemories.length === 0 ? (
          <div className="centrar-completo flex-column" role="status">
            <MemoryLogo />
            <p className="title-md">No memories found. Click "New Memory" to create a new one</p>
          </div>
        ) : (
          <div
            style={{
              maxHeight: '80vh',
              overflowY: 'auto',
              display: 'flex',
              justifyContent: 'center',
              flex: 1,
            }}
            role="region"
            aria-labelledby="memories-table"
          >
            <div className="" style={{ width: '100%' }} role="grid" aria-labelledby="memories-table">
              

              {filteredMemories.map(([memoryTitle, details], index) => (
                <div
                  key={index}
                  className="p-2"
                  style={{
                    backgroundColor: index % 2 === 0 ? 'rgba(0, 0, 0, 0.2)' : 'none',
                    display: 'flex',
                  }}
                  role="row"
                >
                  <div style={{ flex: 1, display: 'flex', gap: '10px' }} role="cell">
                    <button
                      className="button"
                      onClick={() => router.push(`/memories/${userInformation.id}/${encodeURIComponent(memoryTitle)}`)}
                      aria-label={`View ${details.metadata?.title || memoryTitle}`}
                    >
                      <ShowHide size={24} />
                    </button>
                    <button
                      className="button"
                      onClick={() => router.push(`/uploadFiles/${userInformation.id}/${encodeURIComponent(memoryTitle)}`)}
                      aria-label={`Upload files to ${details.metadata?.title || memoryTitle}`}
                    >
                      <UploadIcon size={24} />
                    </button>
                    <button
                      className="button"
                      onClick={() => router.push(`/editMemories/${userInformation.id}/${encodeURIComponent(memoryTitle)}`)}
                      aria-label={`Edit ${details.metadata?.title || memoryTitle}`}
                    >
                      <EditToggleIcon size={24} />
                    </button>
                    <button
                      className="button"
                      onClick={() => router.push(`/editAccessibility/${userInformation.id}/${encodeURIComponent(memoryTitle)}`)}
                      aria-label={`Edit accessibility ${details.metadata?.title || memoryTitle}`}
                    >
                      <EditPermissionsIcon size={24} />
                    </button>
                  </div>
                  <div style={{ flex: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} role="cell">
                    <div data-label="Name">{details.metadata?.title || '—'}</div>
                  </div>
                  <div style={{ flex: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} role="cell">
                    <div data-label="Description">{details.metadata?.description || '—'}</div>
                  </div>
                  <div style={{ flex: 2 }} role="cell">
                    <div className="flex-column" data-label="Types">
                      {Object.entries(details.media)
                        .filter(([_, mediaArray]) => mediaArray.length > 0)
                        .map(([mediaType, mediaArray]) => (
                          <span key={mediaType} className="border rounded p-1 content-small">
                            {mediaType.toUpperCase()} ({mediaArray.length})
                          </span>
                        ))}
                    </div>
                  </div>
                  <div style={{ flex: 1 }} role="cell">
                    <div data-label="Created">
                      <span className="content-small">Created: </span>
                      {details.metadata?.createdAt ? new Date(details.metadata.createdAt).toLocaleDateString() : '—'}
                    </div>
                  </div>
                  <div style={{ flex: 1 }} role="cell">
                    <div data-label="Modified">
                      <span className="content-small">Modified: </span>
                      {details.metadata?.lastUpdated ? new Date(details.metadata.lastUpdated).toLocaleDateString() : '—'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );

  return (
    <GeneralMold
      pageTitle="Your Memories | Memory App"
      pageDescription="View, manage, and create your personal memories in the Memory App"
      metaKeywords="memories, personal memories, memory app, organize memories"
      visibility="private"
      owner={userEmail || 'Anonymous'}
      leftContent={leftContent}
      rightContent={'hi'}
    >
      <Head>
        <meta property="og:title" content="Your Memories | Memory App" />
        <meta property="og:description" content="View, manage, and create your personal memories in the Memory App" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Your Memories | Memory App" />
        <meta name="twitter:description" content="View, manage, and create your personal memories in the Memory App" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </Head>
    </GeneralMold>
  );
}








