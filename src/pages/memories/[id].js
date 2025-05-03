// pages/memories/[id].js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../../estilos/general/memoryDetail.module.css'; // Asegúrate de tener o crear los estilos correspondientes
import MemoryLogo from '../../components/complex/memoryLogo';
import BackgroundGeneric from '../../components/complex/backgroundGeneric';
import '../../estilos/general/general.css'
import Menu from '../../components/complex/menu';
import MenuIcon from '../../components/complex/menuIcon';











import Video from '../../components/simple/video';
import Audio from '../../components/simple/audio';
import ImageSlider from '../../components/complex/imageSlider';







const MemoryDetail = () => {
  const router = useRouter();
  const { id } = router.query;

  // Estados para la memoria
  const [userEmail, setUserEmail] = useState(null);
  const [memoryData, setMemoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [folderContents, setFolderContents] = useState({});
  
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

  // Estado para el menú de navegación
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(false);

  // Obtener datos de la memoria
  useEffect(() => {
    const storedEmail = localStorage.getItem("userEmail");
    if (!storedEmail) {
      setUserEmail(null);
      setError("Debes iniciar sesión");
      setLoading(false);
      return;
    }
    setUserEmail(storedEmail);

    if (id) {
      Promise.all([
        fetch("/api/mongoDb/postMemoryReferenceUser", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: storedEmail, memoryTitle: id }),
        }).then(async (res) => {
          if (!res.ok) throw new Error("Error al obtener detalles del recuerdo");
          return res.json();
        }),
        fetch(`/api/blackBlaze/getMemoryReferenceUser?correo=${storedEmail}&memoryTitle=${id}`)
          .then(async (res) => {
            if (!res.ok) throw new Error("Error al obtener referencias de memoria");
            return res.json();
          }),
      ])
        .then(([mongoData, blackBlazeData]) => {
          if (mongoData.success && blackBlazeData.success) {
            const formattedData = {
              ...mongoData.memory,
              backBlazeRefs: blackBlazeData.memories[id] || {},
            };
            
            const initialFolderContents = {};
            Object.keys(formattedData.backBlazeRefs).forEach(folderName => {
              initialFolderContents[folderName] = {
                files: formattedData.backBlazeRefs[folderName] || [],
                loaded: true
              };
            });
            
            setMemoryData(formattedData);
            setFolderContents(initialFolderContents);
          } else {
            throw new Error("Error al combinar la información");
          }
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [id]);


  useEffect(() => {
    console.log(folderContents);
  }, [folderContents]);

  const handleFolderClick = (folderName) => {
    setPreviewFolder(folderName);
    
    if (!folderContents[folderName]) {
      setFolderContents(prev => ({
        ...prev,
        [folderName]: {
          files: memoryData?.backBlazeRefs?.[folderName] || [],
          loaded: true
        }
      }));
    }
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
      fileName: file.fileName
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
          {/* Header con título y menú */}
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
                      >
                        <div className={styles.folderInfo}>
                          <h3>{folderName}</h3>
                          <span className={styles.folderCount}>
                            {backBlazeRefs[folderName].length} {backBlazeRefs[folderName].length === 1 ? 'item' : 'items'}
                          </span>
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
              >
                ×
              </button>
              
              <h2 className={styles.previewTitle}>{previewFolder}</h2>
              
              <div className={styles.previewContent}>
                {folderContents[previewFolder]?.files?.length > 0 ? (
                  <div className={styles.previewGrid}>
                    {folderContents[previewFolder].files.map((file, index) => (
                      <div 
                        key={index} 
                        onClick={() => handleFileSelect(file.url, previewFolder, index)}
                        className={styles.previewItem}
                      >
                        {previewFolder === "fotos" ? (
                          <div className={styles.imagePreview}>
                            <img 
                              src={file.url} 
                              alt={`Image ${index}`} 
                              loading="lazy"
                              onError={(e) => e.target.src = '/fallback-image.jpg'}
                            />
                          </div>
                        ) : previewFolder === "videos" ? (
                          <div className={styles.videoPreview}>
                            <video src={file.url} muted playsInline />
                            <div className={styles.playIcon}>▶</div>
                          </div>
                        ) : previewFolder === "audios" ? (
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
                    ))}
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
              <button onClick={closeMediaPlayer} className={styles.closeButton}>
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
                  setIsLoadingMedia={(loading) => setMediaState(prev => ({ ...prev, isLoadingMedia: loading }))}
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
                  setIsFirstTimeLoading={() => {}}
                  tags={mediaState.tags}
                  setTags={(tags) => setMediaState(prev => ({ ...prev, tags }))}
                  setMusicContent={() => {}}
                  setContentModal={() => {}}
                  setIsMenuOpen={(open) => setMediaState(prev => ({ ...prev, isMenuOpen: open }))}
                  isMenuOpen={mediaState.isMenuOpen}
                  toggleMenu={() => setMediaState(prev => ({ ...prev, isMenuOpen: !prev.isMenuOpen }))}
                  content={mediaState.content}
                  handleItemClick={() => {}}
                  toggleContentVisibility={() => setMediaState(prev => ({ 
                    ...prev, 
                    isContentVisible: !prev.isContentVisible 
                  }))}
                  isContentVisible={mediaState.isContentVisible}
                  setComponentInUse={(comp) => setMediaState(prev => ({ ...prev, componentInUse: comp }))}
                  componentInUse={mediaState.componentInUse}
                  setShowComponent={() => {}}
                  showComponent={true}
                  setCurrentTimeMedia={(time) => setMediaState(prev => ({ ...prev, currentTimeMedia: time }))}
                  currentTimeMedia={mediaState.currentTimeMedia}
                  changeStateMenu={() => {}}
                  setVolumeMedia={(vol) => setMediaState(prev => ({ ...prev, volumeMedia: vol }))}
                  volumeMedia={mediaState.volumeMedia}
                  setQualityMedia={(quality) => setMediaState(prev => ({ ...prev, qualityMedia: quality }))}
                  qualityMedia={mediaState.qualityMedia}
                  setIsRepeatMedia={(repeat) => setMediaState(prev => ({ ...prev, isRepeatMedia: repeat }))}
                  isRepeatMedia={mediaState.isRepeatMedia}
                  setIsShuffleMedia={(shuffle) => setMediaState(prev => ({ ...prev, isShuffleMedia: shuffle }))}
                  isShuffleMedia={mediaState.isShuffleMedia}
                  setIsMutedMedia={(muted) => setMediaState(prev => ({ ...prev, isMutedMedia: muted }))}
                  isMutedMedia={mediaState.isMutedMedia}
                  openQualityModal={() => setMediaState(prev => ({ ...prev, isModalOpen: true }))}
                  openUpdateBackgroundColor={() => {}}
                  setIsLoadingMedia={() => {}}
                  setIsLike={(like) => setMediaState(prev => ({ ...prev, isLike: like }))}
                  isLike={mediaState.isLike}
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







