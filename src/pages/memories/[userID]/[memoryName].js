// pages/memories/[id].js
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import styles from '../../../estilos/general/memoryDetail.module.css'; // Asegúrate de tener o crear los estilos correspondientes
import MemoryLogo from '../../../components/complex/memoryLogo';
import BackgroundGeneric from '../../../components/complex/backgroundGeneric';
import '../../../estilos/general/general.css'
import Menu from '../../../components/complex/menu';
import MenuIcon from '../../../components/complex/menuIcon';
import SpinnerIcon from '@/components/complex/spinnerIcon';
import Video from '../../../components/simple/video';
import AudioPlayer from '@/components/complex/audioPlayer';
import ImageSlider from '../../../components/complex/imageSlider';
import Modal from '@/components/complex/modal';


const MemoryDetail = () => {
  const router = useRouter();
  const { userID, memoryName } = router.query; 

  // Estados principales
  const [userEmail, setUserEmail] = useState(null);
  const [memoryData, setMemoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [folderContents, setFolderContents] = useState({});
  const [folderLoadingStates, setFolderLoadingStates] = useState({});
  const [roll, setRoll] = useState('false');
  
  // Estados para el reproductor multimedia
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [previewFolder, setPreviewFolder] = useState(null);
  const [mediaState, setMediaState] = useState({
    currentIndex: 0,
    srcs: [],
    content: [],
    tags: [],
    isContentVisible: false,
    componentInUse: '',
    currentTimeMedia: 0,
    volumeMedia: 1,
    qualityMedia: 'hd',
    isRepeatMedia: false,
    isShuffleMedia: false,
    isMutedMedia: false,
    isMenuOpen: false,
    isModalOpen: false,
    isLike: false,
    isHybridView: false,
  });

  // Cache de medios
  const mediaCache = useRef(new Map());
  let backBlazeRefs = useRef(null);
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(false);




  useEffect(() => {
    console.log(memoryData);
  }, []); 


//access validation
  useEffect(() => {
    if (!memoryData) return;
  
    const checkViewPermissions = () => {
      const viewAccess = memoryData.access?.view;
      if (!viewAccess) {
        console.error("Estructura de acceso no válida");
        setError("Configuración de acceso inválida");
        return;
      }
  
      const { visibility, invitedEmails = [] } = viewAccess;
      const currentPath = window.location.pathname;
  
      // Caso 1: Visibilidad Pública
      if (visibility === 'public') {
        console.log("Acceso público permitido");
        setRoll('Anyone can upload memories')
        return;
      }
  
      // Requerir autenticación para otros casos
      const userEmail = localStorage.getItem('userEmail');
      if (!userEmail) {
        console.log("Usuario no autenticado, redirigiendo...");
        localStorage.setItem('redirectPath', currentPath);
        localStorage.setItem('reason', 'userEmailValidationOnly');
        router.push('/login');
        return;
      }
  
      // Transformar IDs para comparación
      const transformEmail = (email) => email.replace(/[@.]/g, '_');
      const currentUserTransformed = transformEmail(userEmail);
      const ownerTransformed = memoryData.metadata.createdBy;
  
      // Caso 2: Visibilidad Privada
      if (visibility === 'private') {
        if (currentUserTransformed === ownerTransformed) {
          console.log("Acceso privado concedido (propietario)");
          setRoll('You are the owner')
          return;
        }
        console.log("Acceso privado denegado");
        setRoll('User not allowed')
        setMemoryData(null)
        return;
      }
  
      // Caso 3: Visibilidad por Invitación
      if (visibility === 'invitation') {
        const transformedInvites = invitedEmails.map(transformEmail);
        if (transformedInvites.includes(currentUserTransformed)) {
          console.log("Acceso por invitación concedido");
          setRoll('Invited to upload memories')
          return;
        }
        setRoll('User not allowed')
        console.log("Usuario no invitado");
        setMemoryData(null)
        //router.push('/unauthorized');
      }
    };
  
    checkViewPermissions();
  }, [memoryData, router]);




  useEffect(() => {
    const fetchMemoryData = async () => {  
      if (!userID || !memoryName) return;

      try {
        /*const storedEmail = localStorage.getItem("userEmail");
        if (!storedEmail) {
          throw new Error("User email not found in localStorage");
        }
        setUserEmail(storedEmail);

        // Transformar email para coincidir con rutas de Backblaze
        const correoFormatted = storedEmail.replace(/[@.]/g, '_');*/

        const [mongoResponse, blackBlazeResponse] = await Promise.all([
          fetch("/api/mongoDb/postMemoryReferenceUser", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userID: userID, memoryTitle: memoryName }),
          }),
          fetch(`/api/blackBlaze/getMemoryReferenceUser?correo=${userID}&memoryTitle=${memoryName}`)
        ]);

        if (!mongoResponse.ok || !blackBlazeResponse.ok) {
          throw new Error("Error fetching data from services");
        }

        const [mongoData, blackBlazeData] = await Promise.all([
          mongoResponse.json(),
          blackBlazeResponse.json()
        ]);

        if (mongoData.success && blackBlazeData.success) {
          const specificMemory = mongoData.memory;
          const backBlazeMedia = blackBlazeData.memories[memoryName] || { fotos: [], videos: [], audios: [] };

          // Función para combinar datos de MongoDB y Backblaze
          const transformMediaWithUrl = (mongoMedia, backBlazeFiles) => {
            return mongoMedia.map(item => {
              const bbFile = backBlazeFiles.find(f => f.fileName === item.storage_path);
              return {
                ...item,
                url: bbFile?.url || '#', // Usar URL de Backblaze
              };
            });
          };

          const formattedData = {
            ...specificMemory,
            backBlazeRefs: {
              photos: transformMediaWithUrl(specificMemory.media.photos, backBlazeMedia.fotos),
              videos: transformMediaWithUrl(specificMemory.media.videos, backBlazeMedia.videos),
              audios: transformMediaWithUrl(specificMemory.media.audios, backBlazeMedia.audios),
              documents: transformMediaWithUrl(specificMemory.media.documents, [])
            }
          };

          // Precargar medios para cache
          Object.entries(formattedData.backBlazeRefs).forEach(([folderName, files]) => {
            files.forEach(file => {
              if (!mediaCache.current.has(file.url)) {
                let media;
                if (folderName === 'photos') {
                  media = new Image();
                  media.onload = () => mediaCache.current.set(file.url, true);
                  media.onerror = () => mediaCache.current.set(file.url, false);
                } else if (folderName === 'videos') {
                  media = document.createElement('video');
                  media.preload = 'metadata';
                  media.onloadeddata = () => mediaCache.current.set(file.url, true);
                  media.onerror = () => mediaCache.current.set(file.url, false);
                  media.load();
                }
                if (media) media.src = file.url;
              }
            });
          });

          setMemoryData(formattedData);
          setLoading(false);
        }
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchMemoryData();
  }, [userID, memoryName]);



  const handleFolderClick = async (folderName) => {
    setFolderLoadingStates(prev => ({ ...prev, [folderName]: true }));
    setPreviewFolder(folderName);

    // Pequeño retardo para feedback visual
    await new Promise(resolve => setTimeout(resolve, 200));

    if (!folderContents[folderName]) {
      const filesWithCacheStatus = memoryData.backBlazeRefs[folderName].map(file => ({
        ...file,
        cached: mediaCache.current.has(file.url)
      }));

      setFolderContents(prev => ({
        ...prev,
        [folderName]: {
          files: filesWithCacheStatus,
          loaded: true
        }
      }));
    }

    setFolderLoadingStates(prev => ({ ...prev, [folderName]: false }));
  };

  const closeFolderPreview = () => {
    setPreviewFolder(null);
  };

  const handleFileSelect = (url, folderName, index) => {
    const files = folderContents[folderName]?.files || [];
    const mediaTypeMap = {
      'videos': 'video',
      'audios': 'audio',
      'photos': 'image'
    };
    
    setMediaType(mediaTypeMap[folderName] || 'image');
    
    const mediaContent = files.map(file => ({
      src: file.url,
      //type: mediaTypeMap[folderName],
      type: mediaTypeMap[folderName], // Usar el mapeo actualizado
      fileName: file.fileName,
      cached: file.cached
    }));

    setMediaState(prev => ({
      ...prev,
      content: mediaContent,
      srcs: folderName === 'videos' ? files.map(file => file.url) : prev.srcs,
      currentIndex: index
    }));
    
    setSelectedMedia(url);
    closeFolderPreview();
  };

  const closeMediaPlayer = () => {
    setSelectedMedia(null);
    setMediaType(null);
    setMediaState(prev => ({ ...prev, componentInUse: '' }));
  };

  const renderPreviewItem = (file, index, folderName) => {
    const isCached = mediaCache.current.has(file.url);
    
    return (
      <div 
        key={index} 
        onClick={() => handleFileSelect(file.url, folderName, index)}
        className={styles.previewItem}
        aria-label={`Open ${file.fileName}`}
      >
        {!isCached && (
          <div className={styles.loadingOverlay}>
            <SpinnerIcon size={24} />
          </div>
        )}
        
        {folderName === "photos" ? (
          <div className={styles.imagePreview}>
            <img 
              src={isCached ? file.url : '/placeholder-image.jpg'} 
              alt={`Preview ${index}`}
              loading="lazy"
              onLoad={() => mediaCache.current.set(file.url, true)}
              onError={(e) => {
                e.target.src = '/fallback-image.jpg';
                mediaCache.current.set(file.url, false);
              }}
            />
          </div>
        ) : folderName === "videos" ? (
          <div className={styles.videoPreview}>
            {isCached ? (
              <video 
                src={file.url} 
                muted 
                playsInline 
                preload="metadata"
                onLoadedData={(e) => {
                  // Forzar actualización de caché si es necesario
                  if (!mediaCache.current.has(file.url)) {
                    mediaCache.current.set(file.url, true);
                  }
                }}
                style={{ display: 'block', width: '100%', height: '100%' }}
              />
            ) : (
              <img src="/video-placeholder.jpg" alt="Video loading" />
            )}
            <div className={styles.playIcon}>▶</div>
          </div>
        ) : folderName === "audios" ? (
          <div className={styles.audioPreview}>
            <div className={styles.audioIcon}>🎵</div>
            {/*<span>{file.fileName.split('_').pop()}</span>*/}
          </div>
        ) : (
          <div className={styles.filePreview}>
            <span>{file.fileName}</span>
          </div>
        )}
      </div>
    );
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
    return (
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

  backBlazeRefs = memoryData?.backBlazeRefs || {};
  const foldersWithContent = Object.keys(backBlazeRefs).filter(
    (folderName) => Array.isArray(backBlazeRefs[folderName]) && backBlazeRefs[folderName].length > 0
  );

  const { metadata } = memoryData || {};

  

  return (
    <div  className={`${styles.fullscreenContainer} backgroundColor1`}>
      <div className={styles.backgroundWrapper}>
        <Menu 
          isOpen={isMainMenuOpen} 
          onClose={() => setIsMainMenuOpen(false)} 
          className="backgroundColor1 mainFont"
        />
        
        <div className={`${styles.memoryContainer} backgroundColor5 color1`}>
          {/* Header */}
          <div className={styles.headerSection}>
            <div className={styles.titleContainer}>
              <div style={{marginTop: '-90px', width: '50px'}}>
                <MenuIcon size={30} onClick={() => setIsMainMenuOpen(true)} />
              </div>
              <textarea
                className={`${styles.memoryTitle} title-xl color2`}
                value={memoryName || "No title available"}
                readOnly
                rows={2}
              />
            </div>
          </div>

          {/* Contenido principal */}
          <div className={styles.contentWrapper}>
            {/* Columna izquierda - Información */}
            <div className={styles.infoColumn}>
                  <span  className={`${roll != 'User not allowed' ? 'color2' : 'alertColor'}`} >Roll:</span>
                  <span  className={`${roll != 'User not allowed' ? 'color2' : 'alertColor'}`} >{roll}</span>
                  {roll === 'User not allowed' ? <h3 style={{color: 'red'}}>If you believe this is a mistake, please contact the account owner.</h3> : null}
              {metadata && (
                <div className={styles.metadataContainer}>
                  
                  <textarea
                    className={`${styles.memoryDescription} color1`}
                    value={metadata.descripcion || "No description available"}
                    readOnly
                    rows={5}
                  />
                  <div className={styles.datesContainer}>
                    <div>Created: {new Date(metadata.createdAt).toLocaleDateString()}</div>
                    <div>Last modified: {new Date(metadata.lastUpdated).toLocaleDateString()}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Columna derecha - Archivos */}
            {memoryData != null ? (
              <div className={styles.filesColumn}>
                <div className={styles.foldersHeader}>
                  <h2 className={'color1'}>Folders</h2>
                </div>
                
                {foldersWithContent.length > 0 ? (
                  <div className={`${styles.foldersList} color2`}>
                    {foldersWithContent.map((folderName) => (
                      <div key={folderName} className={styles.folderItem}>
                        <div
                          className={styles.folderHeader}
                          onClick={() => handleFolderClick(folderName)}
                          aria-expanded={previewFolder === folderName}
                        >
                          <div className={styles.folderInfo}>
                            <h3>{folderName}</h3>
                            <span className={styles.folderCount}>
                              {backBlazeRefs[folderName]?.length} {backBlazeRefs[folderName]?.length === 1 ? 'item' : 'items'}
                            </span>
                            {folderLoadingStates[folderName] && <SpinnerIcon size={16} />}
                          </div>
                          <span className={styles.folderToggle}>→</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.noFoldersMessage}>No folders available for this memory.</p>
                )}
              </div>
            ) : null}

          </div>

          {/* Modal de previsualización de carpeta */}
          {previewFolder && (
            <div className={styles.folderPreviewModal}>
              <button 
                onClick={closeFolderPreview} 
                className={styles.closeButton}
                aria-label="Close folder preview"
              >
                ×
              </button>
              
              <h2 className={styles.previewTitle}>{previewFolder}</h2>
              
              <div className={styles.previewContent}>
                {folderLoadingStates[previewFolder] ? (
                  <div className={styles.loadingPreview}>
                    <SpinnerIcon size={40} />
                    <p>Loading contents...</p>
                  </div>
                ) : folderContents[previewFolder]?.files?.length > 0 ? (
                  <div className={styles.previewGrid}>
                    {folderContents[previewFolder].files.map((file, index) => 
                      renderPreviewItem(file, index, previewFolder)
                    )}
                  </div>
                ) : (
                  <p>No files in this category.</p>
                )}
              </div>
            </div>
          )}

          {/* Overlay para reproductores multimedia */}
          {selectedMedia && (
            <div className={styles.mediaOverlay}>
              <button 
                onClick={closeMediaPlayer} 
                className={styles.closeButton}
                aria-label="Close media player"
              >
                ×
              </button>
              
              {mediaType === 'video' && (
                <Video
                  srcs={mediaState.srcs}
                  currentIndex={mediaState.currentIndex}
                  setCurrentIndex={(index) => setMediaState(prev => ({ ...prev, currentIndex: index }))}
                  setCurrentTimeMedia={(time) => setMediaState(prev => ({ ...prev, currentTimeMedia: time }))}
                  currentTimeMedia={mediaState.currentTimeMedia}
                  setVolumeMedia={(vol) => setMediaState(prev => ({ ...prev, volumeMedia: vol }))}
                  volumeMedia={mediaState.volumeMedia}
                  setIsMutedMedia={(muted) => setMediaState(prev => ({ ...prev, isMutedMedia: muted }))}
                  isMutedMedia={mediaState.isMutedMedia}
                  setIsRepeatMedia={(repeat) => setMediaState(prev => ({ ...prev, isRepeatMedia: repeat }))}
                  isRepeatMedia={mediaState.isRepeatMedia}
                  setIsLike={(like) => setMediaState(prev => ({ ...prev, isLike: like }))}
                  isLike={mediaState.isLike}
                  isHybridView={mediaState.isHybridView}
                  buttonColor="white"
                />
              )}

              {mediaType === 'audio' && (
                <div className={styles.audioPlayerWrapper}>
                  <AudioPlayer 
                    currentIndex={mediaState.currentIndex}
                    audioFiles={mediaState.content}
                    className={styles.customAudioPlayer}
                  />
                </div>
              )}

              {mediaType === 'image' && (
                <ImageSlider
                  images={mediaState.content.map(item => item.src)}
                  initialCurrentIndex={mediaState.currentIndex}
                  onIndexChange={(index) => setMediaState(prev => ({ ...prev, currentIndex: index }))}
                  controls={{
                    showPrevious: true,
                    showPlayPause: true,
                    showNext: true,
                    showShuffle: true,
                    showEffects: true,
                    showDownload: true
                  }}
                  timeToShow={5000}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemoryDetail;

