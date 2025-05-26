import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../../estilos/general/memoriesIndex.module.css'; 
import '../../estilos/general/general.css'
import '../../app/globals.css'
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





const MemoriesIndex = () => {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState(null);
  const [uid, setUid] = useState(null);
  const [token, setToken] = useState(null);
  const [memoriesState, setMemoriesState] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortType, setSortType] = useState('alphabetical');
  const [filteredMemories, setFilteredMemories] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userID, setUserID] = useState('');
  const [userInformation, setUserInformation] = useState({});

  const notifySuccess = (message) => toast.success(message);
  const notifyFailes = (message) => toast.error(message)
  

  // Authentication check
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUid(user.uid);
        console.log(user.uid);
        
        try {
          const idToken = await user.getIdToken();
          setToken(idToken);
          console.log(idToken);
          
        } catch (error) {
          console.error('Error getting token:', error);
          setError('Failed to authenticate user');
        }
        const email = user.email || user.providerData?.[0]?.email;
        setUserEmail(email);
        console.log(email);
        
      } else {
        const path = window.location.pathname;
        notifyFailes('Please log in before continuing...')
        localStorage.setItem('redirectPath', path);
        localStorage.setItem('reason', 'userEmailValidationOnly');
        setTimeout(() => {
          router.push('/login');
        }, 2000); 
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Fetch memories data
  useEffect(() => {
    const fetchMemories = async () => {
      if (!userEmail || !uid || !token) {
        setLoading(false);
        return;
      }

      let miarar = `${token}2`
      try {
        const response = await fetch('/api/mongoDb/getAllReferencesUser', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userEmail, uid, token }),
        });

        console.log(response);
        

        if (!response.ok) {
          setError('There seems to be an error, please log in again.')
          if (response.status === 404) {
            setMemoriesState({});
            setUserID('');
            setLoading(false);
            setError(response.statusText);
            return;
          }
          const errorInfo = await response.json().catch(() => ({}));
          const errorMessage = errorInfo.message || 'Network response error';
          throw new Error(`Error ${response.status}: ${errorMessage}`);
        }

        const data = await response.json();
        console.log(data);
        
        if (data.success) {
          setUserID(data.userInfoId);
          const { userInformation, ...actualMemories } = data.memories;
          setUserInformation(data.memories.userInformation)
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

    if (userEmail && uid && token) {
      fetchMemories();
    }
  }, [userEmail, uid, token]);

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

  if (loading) {
    return <LoadingMemories/>
  }

  if (error) {
    return (
      <div className="fullscreen-floating mainFont backgroundColor1 color2">
        <Head>
          <title>Error | Memories</title>
          <meta name="description" content="An error occurred while loading memories" />
        </Head>
        <ErrorComponent error={error} />
      </div>
    );
  }

  return (
  <div className={`${styles.container} ${styles.fadeIn} fullscreen-floating color1 mainFont`}>
    <Head>
      <title>Your Memories | Memory App</title>
      <meta name="description" content="View and manage your personal memories" />
      <meta property="og:title" content="Your Memories" />
      <meta property="og:description" content="View and manage your personal memories" />
    </Head>

    <Menu
      isOpen={isMenuOpen}
      onClose={() => setIsMenuOpen(false)}
      className="backgroundColor1 mainFont"
    />

    <div className={`backgroundColor5 ${styles.frame}`} style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
      <div className={styles.controlsContainer}>
        <div className={styles.leftControls}>
          <MenuIcon size={30} onClick={() => setIsMenuOpen(true)} aria-label="Open menu" />
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
        <div className={styles.emptyState}>
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
        >
          <div className={`${styles.appleTableContainer}`} role="grid" aria-labelledby="memories-table">
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
                  <button onClick={() => router.push(`/memories/${userInformation.id}/${memoryTitle}`)}
                    aria-label={`View ${details.metadata?.title}`}
                    style={{ backgroundColor: '#ffffff00', border: 'none' }} // Asegura que el botón sea clickeable
                  >
                    <ShowHide onClick={()=> router.push(`/memories/${userInformation.id}/${memoryTitle}`)} size={24} />
                  </button>
                  <button onClick={()=> router.push(`/uploadFiles/${userInformation.id}/${memoryTitle}`)}
                    aria-label={`Upload files to ${details.metadata?.title}`}
                    style={{ backgroundColor: '#ffffff00', border: 'none' }} // Asegura que el botón sea clickeable
                  >
                    <UploadIcon onClick={()=> router.push(`/uploadFiles/${userInformation.id}/${memoryTitle}`)} size={24} />
                  </button>
                  <button onClick={()=>router.push(`/editMemories/${userInformation.id}/${encodeURIComponent(memoryTitle)}`)}
                    aria-label={`Edit ${details.metadata?.title}`}
                    style={{ backgroundColor: '#ffffff00', border: 'none' }} // Asegura que el botón sea clickeable
                  >
                    <EditToggleIcon onClick={()=>router.push(`/editMemories/${userInformation.id}/${encodeURIComponent(memoryTitle)}`)} size={24} />
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
    </div>

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
  </div>
);
};

export default MemoriesIndex;













