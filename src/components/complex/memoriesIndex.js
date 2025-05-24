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
import { auth } from '../../../firebase';














const MemoriesIndex = () => {
  const router = useRouter();

  const [userEmail, setUserEmail] = useState(null);
  const [memoriesState, setMemoriesState] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortType, setSortType] = useState("alphabetical");
  const [filteredMemories, setFilteredMemories] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userID, setUserID] = useState('');


  

  // Primer useEffect: Escuchar cambios en el estado de autenticación
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        console.log(user);
        
        const email = user.email; // Obtener el correo directamente desde user.email
        console.log('Correo del usuario:', email);
        setUserEmail(email);
      } else {
        console.log('No hay usuario autenticado');
        setUserEmail(null);
        setLoading(false); // Detener la carga si no hay usuario
      }
    });

    // Cleanup: Desuscribirse del listener cuando el componente se desmonta
    return () => unsubscribe();
  }, []);



  useEffect(() => {
    console.log(userEmail);
    
    if (userEmail === null) {
      setUserEmail(null);
      setLoading(false);
      return;
    }
    
    console.log(userEmail);
    
  
    const apiUrl = "/api/mongoDb/getAllReferencesUser";
    fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: userEmail }),
    })
      .then(async (response) => {
        if (!response.ok) {
          if (response.status === 404) {
            return { success: true, memories: {} };
          }
          const errorInfo = await response.json().catch(() => ({}));
          const errorMessage = errorInfo.message || "Network response error";
          throw new Error(`Error ${response.status}: ${errorMessage}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data.success) {
          console.log(data);
          setUserID(data.userInfoId)
          const { userInformation, ...actualMemories } = data.memories;
          setMemoriesState(actualMemories);
          console.log(actualMemories);
        } else {
          throw new Error("Error fetching memories");
        }
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [userEmail]);

  useEffect(() => {
    const entries = Object.entries(memoriesState);
    let sortedEntries = entries;
    
    if (sortType === "alphabetical") {
      sortedEntries = entries.sort((a, b) => a[0].localeCompare(b[0]));
    } else if (sortType === "creationDate") {
      sortedEntries = entries.sort((a, b) => {
        const dateA = new Date(a[1]?.metadata?.createdAt || 0);
        const dateB = new Date(b[1]?.metadata?.createdAt || 0);
        return dateA - dateB;
      });
    } else if (sortType === "lastModified") {
      sortedEntries = entries.sort((a, b) => {
        const dateA = new Date(a[1]?.metadata?.lastUpdated || 0);
        const dateB = new Date(b[1]?.metadata?.lastUpdated || 0);
        return dateB - dateA;
      });
    }
    setFilteredMemories(sortedEntries);
  }, [memoriesState, sortType]);

  const handleCreateMemory = () => {
    console.log(userEmail)
    
    if (userEmail === null) {
      const path = window.location.pathname;
      localStorage.setItem('redirectPath', path);
      localStorage.setItem('reason', 'createNewUser');
      router.push('/login');
      return;
    } else {
      router.push('/createNewMemory');
    }
  };

  const handleSortChange = (e) => {
    setSortType(e.target.value);
  };

  if (loading) {
    return (
      <div className='fullscreen-floating'>
        <BackgroundGeneric showImageSlider={false}>
          <div className={`${styles.loading}`}>
            <MemoryLogo size={300} />
            <p className={'color2 title-lg'}>Loading memories...</p>
          </div>
        </BackgroundGeneric>
      </div>
    );
  }

  if (error) {
    return(
      <div className='fullscreen-floating'>
        <BackgroundGeneric showImageSlider={false}>
          <div className={`${styles.loading}`}>
            <MemoryLogo size={300} />
            <p className={'color2 title-xl'}>Error: {error}</p>
          </div>
        </BackgroundGeneric>
      </div>
    );
  }

  return (
    <>
      <div className={`${styles.container} ${styles.fadeIn} fullscreen-floating color1 mainFont`}>
        <div className={`backgroundColor5 ${styles.frame}`}>
          <Menu 
            isOpen={isMenuOpen} 
            onClose={() => setIsMenuOpen(false)} 
            className="backgroundColor1 mainFont"
          />
      
          <div className={styles.controlsContainer}>
            <div className={styles.leftControls}>
              <MenuIcon size={30} onClick={() => setIsMenuOpen(true)} />
              {filteredMemories.length > 0 && (
                <div className={styles.filterContainer}>
                  <label htmlFor="sort">Sort by:</label>
                  <select className={styles.appleSelect} value={sortType} onChange={handleSortChange}>
                    <option value="alphabetical">Name</option>
                    <option value="creationDate">Creation Date</option>
                    <option value="lastModified">Last Modified</option>
                  </select>
                </div>
              )}
            </div>
            <div
              className={`mainFont ${styles.appleButton} ${filteredMemories.length === 0 ? styles.highlightButton : ''}`}
              onClick={handleCreateMemory}
            >
              New Memory
            </div>
          </div>
      
          {filteredMemories.length === 0 ? (
            <div className={styles.emptyState}>
              <MemoryLogo size={300} />
              <p className={`title-md color2`}>No memories found. Click "New Memory" to create a new one.</p>
            </div>
          ) : (
            <div className={styles.appleTableContainer}>
              <div className={`${styles.tableHeader} backgroundColor1 title-sm color1`}>
                <div className={styles.headerCell} style={{ flex: 1 }}>Actions</div>
                <div className={styles.headerCell} style={{ flex: 3 }}>Name</div>
                <div className={styles.headerCell} style={{ flex: 2 }}>Description</div>
                <div className={styles.headerCell} style={{ flex: 2 }}>Types</div>
                <div className={styles.headerCell} style={{ flex: 1 }}>Created</div>
                <div className={styles.headerCell} style={{ flex: 1 }}>Modified</div>
              </div>
      
              {filteredMemories.map(([memoryTitle, details], index) => (
                <div
                  key={index}
                  className={styles.tableRow}
                  style={{
                    backgroundColor: index % 2 === 0 ? '#00000042' : 'none'
                  }}
                >
                  <div className={styles.tableCell} style={{ flex: 1, display: 'flex', gap: '10px' }}>
                    <ShowHide
                      size={24}
                      onClick={() => router.push(`/memories/${userID}/${encodeURIComponent(memoryTitle)}`)}
                    />
                    <UploadIcon
                      size={24}
                      onClick={() => router.push(`/uploadFiles/${userID}/${encodeURIComponent(memoryTitle)}`)}
                    />
                    <EditToggleIcon
                    size={24}
                    onClick={() => router.push(`/editMemories/${userID}/${encodeURIComponent(memoryTitle)}`)}
                    />
                  </div>
                  <div className={`${styles.tableCell} ${styles.cellWithScroll}`} style={{ flex: 3 }}>
                    <span className={styles.titleText}>{details.metadata?.title}</span>
                  </div>
                  <div className={`${styles.tableCell} ${styles.cellWithScroll}`} style={{ flex: 2 }}>
                    <div className={styles.mobileScrollContent}>
                      {details.metadata?.description || "—"}
                    </div>
                  </div>
                  <div className={styles.tableCell} style={{ flex: 2 }}>
                    <div className={styles.typeBadges}>
                      {Object.entries(details.media)
                        .filter(([_, mediaArray]) => mediaArray.length > 0)
                        .map(([mediaType, mediaArray]) => (
                          <span key={mediaType} className={styles.typeBadge}>
                            {mediaType.toUpperCase()} ({mediaArray.length})
                          </span>
                        ))}
                    </div>
                  </div>
                  <div className={styles.tableCell} style={{ flex: 1 }}>
                    {details.metadata?.createdAt 
                      ? <div style={{display: 'flex'}}>
                          <span className={styles.mobileLabel}>Created: </span> 
                          {new Date(details.metadata.createdAt).toLocaleDateString()}
                        </div>
                      : "—"}
                  </div>
                  <div className={styles.tableCell} style={{ flex: 1 }}>
                  {details.metadata?.lastUpdated 
                    ? <div style={{display: 'flex'}}>
                        <span className={styles.mobileLabel}>Modified: </span> 
                        {new Date(details.metadata.lastUpdated).toLocaleDateString()}
                      </div>
                    : "—"}
                </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default MemoriesIndex;













