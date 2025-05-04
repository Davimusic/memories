// pages/memories/[id].js
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import styles from '../../estilos/general/memoryDetail.module.css'; // Asegúrate de tener o crear los estilos correspondientes
import MemoryLogo from '../../components/complex/memoryLogo';
import BackgroundGeneric from '../../components/complex/backgroundGeneric';
import '../../estilos/general/general.css'
import Menu from '../../components/complex/menu';
import MenuIcon from '../../components/complex/menuIcon';
import SpinnerIcon from '@/components/complex/spinnerIcon';
import Video from '../../components/simple/video';
import Audio from '../../components/simple/audio';
import ImageSlider from '../../components/complex/imageSlider';








const MemoryDetail = () => {
  const router = useRouter();
  const { id } = router.query;

  // Estados principales
  const [userEmail, setUserEmail] = useState(null);
  const [memoryData, setMemoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [folderContents, setFolderContents] = useState({});
  const [folderLoadingStates, setFolderLoadingStates] = useState({});
  
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
      const storedEmail = localStorage.getItem("userEmail");
      if (!storedEmail) {
        setError("Debes iniciar sesión");
        setLoading(false);
        return;
      }
      setUserEmail(storedEmail);

      if (!id) return;

      try {
        const [mongoResponse, blackBlazeResponse] = await Promise.all([
          fetch("/api/mongoDb/postMemoryReferenceUser", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: storedEmail, memoryTitle: id }),
          }),
          fetch(`/api/blackBlaze/getMemoryReferenceUser?correo=${storedEmail}&memoryTitle=${id}`)
        ]);

        if (!mongoResponse.ok || !blackBlazeResponse.ok) {
          throw new Error("Error al obtener datos de la memoria");
        }

        const [mongoData, blackBlazeData] = await Promise.all([
          mongoResponse.json(),
          blackBlazeResponse.json()
        ]);

        if (mongoData.success && blackBlazeData.success) {
          const formattedData = {
            ...mongoData.memory,
            backBlazeRefs: blackBlazeData.memories[id] || {},
          };

          // Precargar miniaturas
          Object.entries(formattedData.backBlazeRefs).forEach(([folderName, files]) => {
            files.forEach(file => {
              if (!mediaCache.current.has(file.url)) {
                const media = folderName === 'fotos' ? new Image() : document.createElement(folderName === 'videos' ? 'video' : 'audio');
                media.src = file.url;
                media.onload = () => mediaCache.current.set(file.url, true);
                media.onerror = () => mediaCache.current.set(file.url, false);
              }
            });
          });

          setMemoryData(formattedData);
          setLoading(false);
        } else {
          throw new Error("Error en los datos recibidos");
        }
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchMemoryData();
  }, [id]);

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
      'fotos': 'image'
    };
    
    setMediaType(mediaTypeMap[folderName] || 'image');
    
    const mediaContent = files.map(file => ({
      src: file.url,
      type: mediaTypeMap[folderName],
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
        
        {folderName === "fotos" ? (
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
              <video src={file.url} muted playsInline preload="metadata" />
            ) : (
              <img src="/video-placeholder.jpg" alt="Video loading" />
            )}
            <div className={styles.playIcon}>▶</div>
          </div>
        ) : folderName === "audios" ? (
          <div className={styles.audioPreview}>
            <div className={styles.audioIcon}>🎵</div>
            <span>{file.fileName.split('_').pop()}</span>
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

  const backBlazeRefs = memoryData?.backBlazeRefs || {};
  const foldersWithContent = Object.keys(backBlazeRefs).filter(
    (folderName) => Array.isArray(backBlazeRefs[folderName]) && backBlazeRefs[folderName].length > 0
  );

  const { metadata } = memoryData || {};

  return (
    <div className={styles.fullscreenContainer}>
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
                className={`${styles.memoryTitle} title-xl`}
                value={id || "No title available"}
                readOnly
                rows={2}
              />
            </div>
          </div>

          {/* Contenido principal */}
          <div className={styles.contentWrapper}>
            {/* Columna izquierda - Información */}
            <div className={styles.infoColumn}>
              {metadata && (
                <div className={styles.metadataContainer}>
                  <textarea
                    className={`${styles.memoryDescription} color1`}
                    value={metadata.descripcion || "No description available"}
                    readOnly
                    rows={5}
                  />
                  <div className={styles.datesContainer}>
                    <div>Created: {new Date(metadata.fecha_creacion).toLocaleDateString()}</div>
                    <div>Modified: {new Date(metadata.ultima_modificacion).toLocaleDateString()}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Columna derecha - Archivos */}
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
                            {backBlazeRefs[folderName].length} {backBlazeRefs[folderName].length === 1 ? 'item' : 'items'}
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
                <Audio
                  src={selectedMedia}
                  allMusicProyects={mediaState.content}
                  currentIndex={mediaState.currentIndex}
                  setCurrentIndex={(val) => setMediaState(prev => ({ ...prev, currentIndex: val }))}
                  setContent={(content) => setMediaState(prev => ({ ...prev, content }))}
                  isFirstTimeLoading={false}
                  tags={mediaState.tags}
                  setTags={(tags) => setMediaState(prev => ({ ...prev, tags }))}
                  isMenuOpen={mediaState.isMenuOpen}
                  toggleMenu={() => setMediaState(prev => ({ ...prev, isMenuOpen: !prev.isMenuOpen }))}
                  content={mediaState.content}
                  isContentVisible={mediaState.isContentVisible}
                  toggleContentVisibility={() => setMediaState(prev => ({ 
                    ...prev, 
                    isContentVisible: !prev.isContentVisible 
                  }))}
                  componentInUse={mediaState.componentInUse}
                  setComponentInUse={(comp) => setMediaState(prev => ({ ...prev, componentInUse: comp }))}
                  currentTimeMedia={mediaState.currentTimeMedia}
                  setCurrentTimeMedia={(time) => setMediaState(prev => ({ ...prev, currentTimeMedia: time }))}
                  volumeMedia={mediaState.volumeMedia}
                  setVolumeMedia={(vol) => setMediaState(prev => ({ ...prev, volumeMedia: vol }))}
                  qualityMedia={mediaState.qualityMedia}
                  setQualityMedia={(quality) => setMediaState(prev => ({ ...prev, qualityMedia: quality }))}
                  isRepeatMedia={mediaState.isRepeatMedia}
                  setIsRepeatMedia={(repeat) => setMediaState(prev => ({ ...prev, isRepeatMedia: repeat }))}
                  isShuffleMedia={mediaState.isShuffleMedia}
                  setIsShuffleMedia={(shuffle) => setMediaState(prev => ({ ...prev, isShuffleMedia: shuffle }))}
                  isMutedMedia={mediaState.isMutedMedia}
                  setIsMutedMedia={(muted) => setMediaState(prev => ({ ...prev, isMutedMedia: muted }))}
                  isModalOpen={mediaState.isModalOpen}
                  openQualityModal={() => setMediaState(prev => ({ ...prev, isModalOpen: true }))}
                  isLike={mediaState.isLike}
                  setIsLike={(like) => setMediaState(prev => ({ ...prev, isLike: like }))}
                  isHybridView={mediaState.isHybridView}
                />
              )}

              {mediaType === 'image' && (
                <ImageSlider
                  images={mediaState.content.map(item => item.src)}
                  currentIndex={mediaState.currentIndex}
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







