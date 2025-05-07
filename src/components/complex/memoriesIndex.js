import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../../estilos/general/memoriesIndex.module.css'; 
import '../../estilos/general/general.css'
import '../../app/globals.css'
import MemoryLogo from './memoryLogo';
import Menu from './menu';
import MenuIcon from './menuIcon';
import BackgroundGeneric from './backgroundGeneric';












const MemoriesIndex = () => {
  const router = useRouter();

  const [userEmail, setUserEmail] = useState(null);
  const [memoriesState, setMemoriesState] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortType, setSortType] = useState("alphabetical");
  const [filteredMemories, setFilteredMemories] = useState([]);

  // Nuevo estado para controlar la apertura del menú
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  

  useEffect(() => {
    const storedEmail = localStorage.getItem("userEmail");
    //localStorage.removeItem('userEmail');
    console.log(storedEmail);
    
    if (!storedEmail) {
      setUserEmail(null);
      setLoading(false);
      return;
    }
    setUserEmail(storedEmail);
  
    const apiUrl = "/api/mongoDb/getAllReferencesUser";
    fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: storedEmail }),
    })
      .then(async (response) => {
        if (!response.ok) {
          // Si la respuesta es 404, significa que no se encontraron recuerdos, por lo tanto,
          // devolvemos un objeto exitoso con un listado vacío
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
          const { userInformation, ...actualMemories } = data.memories;
          setMemoriesState(actualMemories);
          //setMemoriesState(data.memories);
        } else {
          throw new Error("Error fetching memories");
        }
      })
      .catch((err) => {
        // Opcional: podrías manejar otros errores de forma distinta
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);
  

  useEffect(() => {
    const entries = Object.entries(memoriesState);
    let sortedEntries = entries;
    
    if (sortType === "alphabetical") {
      sortedEntries = entries.sort((a, b) => a[0].localeCompare(b[0]));
    } else if (sortType === "creationDate") {
      sortedEntries = entries.sort((a, b) => {
        const dateA = new Date(a[1]?.metadata?.fecha_creacion || 0);
        const dateB = new Date(b[1]?.metadata?.fecha_creacion || 0);
        return dateA - dateB;
      });
    } else if (sortType === "lastModified") {
      sortedEntries = entries.sort((a, b) => {
        const dateA = new Date(a[1]?.metadata?.ultima_modificacion || 0);
        const dateB = new Date(b[1]?.metadata?.ultima_modificacion || 0);
        return dateB - dateA;
      });
    }
    setFilteredMemories(sortedEntries);
  }, [memoriesState, sortType]);

  const handleCreateMemory = () => {
    if (!userEmail) {
      alert("You must log in first");
    } else {
      router.push('/uploadfiles');
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
    )
  }

  return (
    <>
      {/* Marco para tablet/desktop */}
      
      
      <div className={`${styles.container} ${styles.fadeIn} fullscreen-floating color1 mainFont`}>
      <div className={`backgroundColor5 ${styles.frame}`} >
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
            <p className={`${styles.emptyText} color1`}>No memories found. Click "New Memory" to create one.</p>
          </div>
        ) : (
          <div className={styles.appleTableContainer}>
            <div className={`${styles.tableHeader} backgroundColor1 title-sm`}>
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
                onClick={() => router.push(`/memories/${encodeURIComponent(memoryTitle)}`)}
              >
                <div className={`${styles.tableCell} ${styles.cellWithScroll}`} style={{ flex: 3 }}>
                  <span className={styles.titleText}>{memoryTitle}</span>
                </div>
                <div className={`${styles.tableCell} ${styles.cellWithScroll}`} style={{ flex: 2 }}>
                  <div className={styles.mobileScrollContent}>
                    {details.metadata?.descripcion || "—"}
                  </div>
                </div>
                <div className={styles.tableCell} style={{ flex: 2 }}>
                  <div className={styles.typeBadges}>
                    {Object.entries(details)
                      .filter(([key, value]) => Array.isArray(value) && value.length > 0)
                      .map(([key, value]) => (
                        <span key={key} className={styles.typeBadge}>
                          {key.toUpperCase()} ({value.length})
                        </span>
                      ))}
                  </div>
                </div>
                <div className={styles.tableCell} style={{ flex: 1 }}>
                  {details.metadata?.fecha_creacion 
                    ? new Date(details.metadata.fecha_creacion).toLocaleDateString() 
                    : "—"}
                </div>
                <div className={styles.tableCell} style={{ flex: 1 }}>
                  {details.metadata?.ultima_modificacion 
                    ? new Date(details.metadata.ultima_modificacion).toLocaleDateString() 
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













