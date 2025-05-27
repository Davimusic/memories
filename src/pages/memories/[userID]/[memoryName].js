// pages/memories/[id].js
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import styles from '../../../estilos/general/memoryDetail.module.css'; 
import MemoryLogo from '../../../components/complex/memoryLogo';
import BackgroundGeneric from '../../../components/complex/backgroundGeneric';
import '../../../estilos/general/general.css'
import Menu from '../../../components/complex/menu';
import MenuIcon from '../../../components/complex/menuIcon';
import SpinnerIcon from '@/components/complex/spinnerIcon';
import Video from '../../../components/simple/video';
import AudioPlayer from '@/components/complex/audioPlayer';
import ImageSlider from '../../../components/complex/imageSlider';
import LoadingMemories from '@/components/complex/loading';
import { auth } from '../../../../firebase';
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
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(false);

  // Obtener datos de la memoria
  useEffect(() => {
    const fetchMemoryData = async () => {  
      if (!userID || !memoryName) return;

      try {
        const mongoResponse = await fetch("/api/mongoDb/postMemoryReferenceUser", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userID: userID, memoryTitle: memoryName }),
        });

        if (!mongoResponse.ok) throw new Error("Error fetching data from MongoDB");
        
        const mongoData = await mongoResponse.json();
        console.log(mongoData);
        
        if (!mongoData.success) throw new Error("Failed to load memory data");

        // Estructurar los datos directamente desde MongoDB
        const formattedData = {
          ...mongoData.memory,
          ownerEmail: mongoData.ownerEmail,
          metadata: mongoData.memory.metadata,
          access: mongoData.memory.access,
          media: {
            photos: mongoData.memory.media.photos || [],
            videos: mongoData.memory.media.videos || [],
            audios: mongoData.memory.media.audios || [],
            documents: mongoData.memory.media.documents || []
          }
        };

        // Precargar medios usando las URLs directas
        Object.entries(formattedData.media).forEach(([mediaType, items]) => {
          items.forEach(item => {
            const url = item.url;
            if (!mediaCache.current.has(url)) {
              let media;
              if (mediaType === 'photos') {
                media = new Image();
                media.onload = () => mediaCache.current.set(url, true);
                media.onerror = () => mediaCache.current.set(url, false);
              } else if (mediaType === 'videos') {
                media = document.createElement('video');
                media.preload = 'metadata';
                media.onloadeddata = () => mediaCache.current.set(url, true);
                media.onerror = () => mediaCache.current.set(url, false);
              }
              if (media) media.src = url;
            }
          });
        });

        setMemoryData(formattedData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchMemoryData();
  }, [userID, memoryName]);

  useEffect(() => {
    const userEmail = auth.currentUser?.reloadUserInfo?.providerUserInfo?.[0]?.email;
    if(!userEmail) return
    setUserEmail(userEmail)
  }, []);

  // Validación de acceso
  useEffect(() => {
  if (!memoryData) return;
  console.log(memoryData);
  
  
  // Obtén de forma segura el email del usuario
  const userEmail = auth.currentUser?.reloadUserInfo?.providerUserInfo?.[0]?.email;
  

  console.log(userEmail);

  const checkViewPermissions = () => {
    const viewAccess = memoryData.access?.view;
    console.log(viewAccess);
    
    
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
      setRoll('Anyone can upload memories');
      return;
    }

    // Requerir autenticación para otros casos
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
    console.log(currentUserTransformed);
    
    
    const ownerTransformed = memoryData.ownerEmail
    if(ownerTransformed === currentUserTransformed){
      console.log("Acceso privado concedido (propietario)");
      setRoll('You are the owner');
      return;
    }



    // Caso 2: Visibilidad Privada
    if (visibility === 'private') {
      if (currentUserTransformed === ownerTransformed) {
        console.log("Acceso privado concedido (propietario)");
        setRoll('You are the owner');
        return;
      }
      console.log("Acceso privado denegado");
      setRoll('User not allowed');
      setMemoryData(null);
      return;
    }

    // Caso 3: Visibilidad por Invitación
    if (visibility === 'invitation') {
      const transformedInvites = invitedEmails.map(transformEmail);
      console.log(transformedInvites);
      
      if (transformedInvites.includes(currentUserTransformed)) {
        console.log("Acceso por invitación concedido");
        setRoll('Invited to upload memories');
        return;
      }
      console.log("Usuario no invitado");
      setRoll('User not allowed');
      setMemoryData(null);
    }
  };

  checkViewPermissions();
}, [
  memoryData,
  router,
  userEmail
]);


  const handleFolderClick = async (folderName) => {
    setFolderLoadingStates(prev => ({ ...prev, [folderName]: true }));
    setPreviewFolder(folderName);

    await new Promise(resolve => setTimeout(resolve, 200));

    if (!folderContents[folderName]) {
      console.log(memoryData);
      
      const filesWithCacheStatus = memoryData.media[folderName].map(item => ({
        url: item.url,
        fileName: item.url.split('/').pop(),
        cached: mediaCache.current.has(item.url),
        metadata: item.metadata
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
      type: mediaTypeMap[folderName],
      fileName: file.fileName,
      cached: file.cached,
      metadata: file.metadata
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
    return <LoadingMemories/>;
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

  const foldersWithContent = memoryData 
    ? Object.keys(memoryData.media).filter(
        folderName => memoryData.media[folderName].length > 0
      )
    : [];

  const { metadata } = memoryData || {};

  return (
    <div className={`${styles.fullscreenContainer} backgroundColor1`}>
      <div className={styles.backgroundWrapper}>
        <Menu 
          isOpen={isMainMenuOpen} 
          onClose={() => setIsMainMenuOpen(false)} 
          className="backgroundColor1 mainFont"
        />
        
        <div className={`${styles.memoryContainer} backgroundColor5 color1`}>
          {/* Header */}
          <div className={styles.headerSection}>
            <div className={`${styles.titleContainer}`}>
              <div className='menuIconPosition' >
                <MenuIcon size={30} onClick={() => setIsMainMenuOpen(true)} />
              </div>
              <textarea
                style={{textAlign: 'center'}}
                className={`${styles.memoryTitle} title-xl color2 `}
                value={memoryData?.metadata?.title || "No title available"}
                readOnly
                rows={2}
              />
            </div>
          </div>

          {/* Contenido principal */}
          <div className={styles.contentWrapper}>
            {/* Columna izquierda - Información */}
            <div className={styles.infoColumn}>
              <span className={`${roll != 'User not allowed' ? 'color2' : 'alertColor'}`}>Roll:</span>
              <span className={`${roll != 'User not allowed' ? 'color2' : 'alertColor'}`}>{roll}</span>
              {roll === 'User not allowed' && <h3 style={{color: 'red'}}>If you believe this is a mistake, please contact the account owner.</h3>}
              
              {metadata && (
                <div className={styles.metadataContainer}>
                  <textarea
                    className={`${styles.memoryDescription} color1`}
                    value={metadata.description || "No description available"}
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
            {memoryData && (
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
                              {memoryData.media[folderName].length} {memoryData.media[folderName].length === 1 ? 'item' : 'items'}
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
            )}
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

