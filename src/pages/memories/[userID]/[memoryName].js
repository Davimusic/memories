'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import '../../../app/globals.css';
import '../../../estilos/general/generalMold.css';
import styles from '../../../estilos/general/memoryDetail.module.css';

import MemoryLogo from '../../../components/complex/memoryLogo';
import BackgroundGeneric from '../../../components/complex/backgroundGeneric';
import Menu from '../../../components/complex/menu';
import MenuIcon from '../../../components/complex/menuIcon';
import SpinnerIcon from '@/components/complex/spinnerIcon';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import LoadingMemories from '@/components/complex/loading';
import { auth } from '../../../../firebase';
import Head from 'next/head';
import Modal from '@/components/complex/modal';
//import InternetStatus from '@/components/complex/internetStatus';

const Video = dynamic(() => import('../../../components/simple/video'), { ssr: false });
const AudioPlayer = dynamic(() => import('../../../components/complex/audioPlayer'), { ssr: false });
const ImageSlider = dynamic(() => import('../../../components/complex/imageSlider'), { ssr: false });

const MemoryDetail = () => {
  const router = useRouter();
  const { userID, memoryName } = router.query;
  const [userEmail, setUserEmail] = useState(null);
  const [memoryData, setMemoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [folderContents, setFolderContents] = useState({});
  const [folderLoadingStates, setFolderLoadingStates] = useState({});
  const [roll, setRoll] = useState('false');
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [previewFolder, setPreviewFolder] = useState(null);
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const mediaCache = useRef(new Map());

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

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const newMode = !prev;
      localStorage.setItem('darkMode', JSON.stringify(newMode));
      return newMode;
    });
  };

  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    setIsDarkMode(savedMode ? JSON.parse(savedMode) : false);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    const email = auth.currentUser?.reloadUserInfo?.providerUserInfo?.[0]?.email;
    if (email) setUserEmail(email);
  }, []);

  useEffect(() => {
    const fetchMemoryData = async () => {
      try {
        if (!userID || !memoryName) {
          setError('Missing userID or memoryName');
          setLoading(false);
          return;
        }

        console.log('userID:', userID);
        console.log('memoryName:', memoryName);
        const url = `http://localhost:3000/api/mongoDb/postMemoryReferenceUser`;
        console.log('Fetching from:', url);

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userID, memoryTitle: memoryName }),
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const mongoData = await res.json();
        console.log('Datos recibidos:', mongoData);

        if (!mongoData.success) {
          throw new Error('Failed to load memory data');
        }

        const formattedData = {
          ...mongoData.memory,
          ownerEmail: mongoData.ownerEmail,
          metadata: {
            ...mongoData.memory.metadata,
            createdAt: mongoData.memory.metadata.createdAt
              ? new Date(mongoData.memory.metadata.createdAt).toISOString()
              : null,
            lastUpdated: mongoData.memory.metadata.lastUpdated
              ? new Date(mongoData.memory.metadata.lastUpdated).toISOString()
              : null,
          },
          access: mongoData.memory.access || {},
          media: {
            photos: mongoData.memory.media.photos || [],
            videos: mongoData.memory.media.videos || [],
            audios: mongoData.memory.media.audios || [],
            documents: mongoData.memory.media.documents || [],
          },
        };

        setMemoryData(formattedData);
        setError(null);
      } catch (err) {
        console.error('fetchMemoryData error:', err.message);
        setError(err.message || 'Failed to fetch memory data');
      } finally {
        setLoading(false);
      }
    };

    fetchMemoryData();
  }, [userID, memoryName]);

  useEffect(() => {
    if (!memoryData) return;

    Object.entries(memoryData.media).forEach(([mediaType, items]) => {
      items.forEach((item) => {
        const url = item.url;
        if (!mediaCache.current.has(url)) {
          let media;
          if (mediaType === 'photos') {
            media = new Image();
            media.onload = () => {
              mediaCache.current.set(url, true);
              setFolderContents((prev) => ({ ...prev }));
            };
            media.onerror = () => mediaCache.current.set(url, false);
          } else if (mediaType === 'videos') {
            media = document.createElement('video');
            media.preload = 'metadata';
            media.onloadeddata = () => {
              mediaCache.current.set(url, true);
              setFolderContents((prev) => ({ ...prev }));
            };
            media.onerror = () => mediaCache.current.set(url, false);
          }
          if (media) media.src = url;
        }
      });
    });
  }, [memoryData]);

  useEffect(() => {
    if (!memoryData || !userEmail) return;

    const checkViewPermissions = () => {
      const viewAccess = memoryData.access?.view;
      if (!viewAccess) {
        setError('Invalid access configuration');
        return;
      }

      const { visibility, invitedEmails = [] } = viewAccess;
      const currentPath = router.asPath;

      if (visibility === 'public') {
        setRoll('Anyone can upload memories');
        return;
      }

      if (!userEmail) {
        localStorage.setItem('redirectPath', currentPath);
        localStorage.setItem('reason', 'userEmailValidationOnly');
        router.push('/login');
        return;
      }

      const transformEmail = (email) => email.replace(/[@.]/g, '_');
      const currentUserTransformed = transformEmail(userEmail);
      const ownerTransformed = transformEmail(memoryData.ownerEmail);

      if (visibility === 'private') {
        if (currentUserTransformed === ownerTransformed) {
          setRoll('You are the owner');
          return;
        }
        setRoll('User not allowed');
        setMemoryData(null);
        return;
      }

      if (visibility === 'invitation') {
        const transformedInvites = invitedEmails.map(transformEmail);
        if (transformedInvites.includes(currentUserTransformed)) {
          setRoll('Invited to upload memories');
          return;
        }
        setRoll('Usuario no permitido');
        setMemoryData(null);
      }
    };

    checkViewPermissions();
  }, [memoryData, userEmail, router]);

  const handleFolderClick = async (folderName) => {
    setFolderLoadingStates((prev) => ({ ...prev, [folderName]: true }));
    setPreviewFolder(folderName);

    await new Promise((resolve) => setTimeout(resolve, 200));

    if (!folderContents[folderName]) {
      const filesWithCacheStatus = memoryData.media[folderName].map((item) => ({
        url: item.url,
        fileName: item.url.split('/').pop(),
        cached: mediaCache.current.has(item.url),
        metadata: item.metadata,
      }));

      setFolderContents((prev) => ({
        ...prev,
        [folderName]: {
          files: filesWithCacheStatus,
          loaded: true,
        },
      }));
    }

    setFolderLoadingStates((prev) => ({ ...prev, [folderName]: false }));
  };

  const closeFolderPreview = () => {
    setPreviewFolder(null);
  };

  const handleFileSelect = (url, folderName, index) => {
    const files = folderContents[folderName]?.files || [];
    const mediaTypeMap = {
      videos: 'video',
      audios: 'audio',
      photos: 'image',
    };

    setMediaType(mediaTypeMap[folderName] || 'image');

    const mediaContent = files.map((file) => ({
      src: file.url,
      type: mediaTypeMap[folderName],
      fileName: file.fileName,
      cached: file.cached,
      metadata: file.metadata,
    }));

    setMediaState((prev) => ({
      ...prev,
      content: mediaContent,
      srcs: folderName === 'videos' ? files.map((file) => file.url) : prev.srcs,
      currentIndex: index,
    }));

    setSelectedMedia(url);
    closeFolderPreview();
  };

  const closeMediaPlayer = () => {
    setSelectedMedia(null);
    setMediaType(null);
    setMediaState((prev) => ({ ...prev, componentInUse: '' }));
  };

  const formatImageUrl = (url) => {
    if (!url) return url;
    if (url.includes('?')) {
      return url.includes('format=webp') ? url : `${url}&format=webp`;
    }
    return `${url}?format=webp`;
  };

  const renderPreviewItem = (file, index, folderName) => {
    const formattedUrl = formatImageUrl(file.url);
    return (
      <article
        key={index}
        onClick={() => handleFileSelect(file.url, folderName, index)}
        className={styles.previewItem}
        aria-label={`Open ${file.fileName}`}
      >
        {folderName === 'photos' ? (
          <div className={styles.imagePreview}>
            <img
              src={formattedUrl || '/placeholder-image.jpg'}
              alt={`Preview of ${file.fileName}`}
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        ) : folderName === 'videos' ? (
          <div className={styles.videoPreview}>
            <img
              src="/video-placeholder.jpg"
              alt={`Preview of ${file.fileName}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div className={styles.playIcon}>▶</div>
          </div>
        ) : folderName === 'audios' ? (
          <div className={styles.audioPreview}>
            <div className={styles.audioIcon}>🎵</div>
            <span style={{ color: 'white' }}>{file.fileName}</span>
          </div>
        ) : (
          <div className={styles.filePreview}>
            <span>{file.fileName}</span>
          </div>
        )}
      </article>
    );
  };

  if (loading) {
    return <LoadingMemories />;
  }

  if (error || !memoryData) {
    return (
      <div className="fullscreen-floating">
        <div className="general-mold">
          <div className={styles.loading}>
            <MemoryLogo size={300} />
            <p className="text-secondary title-xl">Error: {error || 'Memory not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  const foldersWithContent = Object.keys(memoryData.media).filter(
    (folderName) => memoryData.media[folderName].length > 0
  );

  const { metadata } = memoryData;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: metadata?.title || 'Memory Detail',
    description: metadata?.description || 'A collection of media files for a specific memory.',
    url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/memory/${userID}/${memoryName}`,
    datePublished: metadata?.createdAt ? new Date(metadata.createdAt).toISOString() : undefined,
    dateModified: metadata?.lastUpdated ? new Date(metadata.lastUpdated).toISOString() : undefined,
    image: memoryData.media.photos?.[0]?.url
      ? formatImageUrl(memoryData.media.photos[0].url)
      : '/default-og-image.jpg',
  };

  const leftContent = (
    <div className={styles.infoColumn} aria-label="Memory information">
      <p>
        <strong className={roll !== 'User not allowed' ? 'text-secondary' : 'alertColor'}>Role:</strong>{' '}
        <span className={roll !== 'User not allowed' ? 'text-secondary' : 'alertColor'}>{roll}</span>
      </p>
      {roll === 'User not allowed' && (
        <p className="alertColor">
          If you believe this is a mistake, please contact the account owner.
        </p>
      )}
      <h2 className="text-primary">{metadata?.title || 'No title available'}</h2>
      
      {metadata && (
        <div className={styles.metadataContainer}>
          <p className={`${styles.memoryDescription} text-primary`}>
            {metadata.description || 'No description available'}
          </p>
          <div className={styles.datesContainer}>
            <p className="folderToggle">Created: {new Date(metadata.createdAt).toLocaleDateString()}</p>
            <p className="folderToggle">Last modified: {new Date(metadata.lastUpdated).toLocaleDateString()}</p>
          </div>
        </div>
      )}
    </div>
  );

  const rightContent = (
    <section className={styles.filesColumn} aria-label="Media files">
      <h2 className="text-primary">Folders</h2>
      {foldersWithContent.length > 0 ? (
        <ul className={`${styles.foldersList} text-secondary`} aria-label="List of media folders">
          {foldersWithContent.map((folderName) => (
            <li style={{ listStyle: 'none' }} key={folderName} className={styles.folderItem}>
              <button
                style={{ width: '100%', background: 'none', border: 'none' }}
                className={styles.folderHeader}
                onClick={() => handleFolderClick(folderName)}
                aria-expanded={previewFolder === folderName}
                aria-label={`Open ${folderName} folder`}
              >
                <div className={styles.folderInfo}>
                  <h3 className="text-secondary">{folderName}</h3>
                  <span className="text-secondary">
                    {memoryData.media[folderName].length}{' '}
                    {memoryData.media[folderName].length === 1 ? 'item' : 'items'}
                  </span>
                  {folderLoadingStates[folderName] && <SpinnerIcon size={16} />}
                </div>
                <span className={styles.folderToggle}>→</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className={{}}>No folders available for this memory.</p>
      )}
    </section>
  );

  return (
    <div className="" role="main" aria-label="Memory detail page">
      <Suspense fallback={<LoadingMemories />}>
        <Head>
          <title>{metadata?.title || 'Memory Detail'}</title>
          <meta
            name="description"
            content={metadata?.description || 'View photos, videos, and other media for this memory.'}
          />
          <meta name="keywords" content="memory, media, photos, videos, audios, documents" />
          <meta name="robots" content={memoryData.access?.view?.visibility === 'public' ? 'index, follow' : 'noindex'} />
          <meta property="og:title" content={metadata?.title || 'Memory Detail'} />
          <meta
            property="og:description"
            content={metadata?.description || 'View photos, videos, and other media for this memory.'}
          />
          <meta property="og:type" content="website" />
          <meta
            property="og:url"
            content={`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/memory/${userID}/${memoryName}`}
          />
          <meta
            property="og:image"
            content={
              memoryData.media.photos?.[0]?.url
                ? formatImageUrl(memoryData.media.photos[0].url)
                : '/default-og-image.jpg'
            }
          />
          <link
            rel="canonical"
            href={`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/memory/${userID}/${memoryName}`}
          />
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        </Head>

        
        <header className="header">
          <button
            className="back-button button"
            onClick={() => window.history.back()}
            aria-label="Volver a la página anterior"
          >
            ←
          </button>
          <button
            className="menu-button button"
            onClick={() => setIsMainMenuOpen(true)}
            aria-label={isMainMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            ☰
          </button>
          <button
            className="theme-toggle button"
            onClick={toggleDarkMode}
            aria-label={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>
          <div className="visibility">
            <span className="visibility-icon" aria-hidden="true">
              {memoryData.access?.view?.visibility === 'public'
                ? '👁️'
                : memoryData.access?.view?.visibility === 'private'
                ? '🔒'
                : '👥'}
            </span>
            <span className="visibility-label content-small">
              {memoryData.access?.view?.visibility === 'public'
                ? 'Público'
                : memoryData.access?.view?.visibility === 'private'
                ? 'Privado'
                : 'Solo Invitados'}
            </span>
          </div>
        </header>

        <Menu
          isOpen={isMainMenuOpen}
          onClose={() => setIsMainMenuOpen(false)}
          aria-label="Menú de navegación"
          isDarkMode={isDarkMode}
        />

        <div
          style={{
            position: 'fixed',
            top: 60,
            left: 0,
            right: 0,
          }}
        >
          <div className={`content-container ${leftContent && rightContent ? 'dual-content' : 'single-content'}`}>
            {leftContent && (
              <section
                className={`left-container card ${leftContent && rightContent ? '' : 'full-width'}`}
                aria-label="Contenido izquierdo"
              >
                {leftContent}
              </section>
            )}
            {rightContent && (
              <section
                className={`right-container card ${leftContent && rightContent ? '' : 'full-width'}`}
                aria-label="Contenido derecho"
              >
                {rightContent}
              </section>
            )}
          </div>
        </div>

        {previewFolder && (
          <div className="modal-overlay" role="dialog" aria-label={`${previewFolder} preview`}>
            <div className="modal-content">
              <button
                onClick={closeFolderPreview}
                className="closeButton"
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
          </div>
        )}

        {selectedMedia && (
          <div className="modal-overlay" role="dialog" aria-label="Media player">
            <div className="modal-content">
              <button
                onClick={closeMediaPlayer}
                className="closeButton"
                aria-label="Close media player"
              >
                ×
              </button>
              {mediaType === 'video' && (
                <Video
                  srcs={mediaState.srcs}
                  currentIndex={mediaState.currentIndex}
                  setCurrentIndex={(index) => setMediaState((prev) => ({ ...prev, currentIndex: index }))}
                  setCurrentTimeMedia={(time) =>
                    setMediaState((prev) => ({ ...prev, currentTimeMedia: time }))
                  }
                  currentTimeMedia={mediaState.currentTimeMedia}
                  setVolumeMedia={(vol) => setMediaState((prev) => ({ ...prev, volumeMedia: vol }))}
                  volumeMedia={mediaState.volumeMedia}
                  setIsMutedMedia={(muted) => setMediaState((prev) => ({ ...prev, isMutedMedia: muted }))}
                  isMutedMedia={mediaState.isMutedMedia}
                  setIsRepeatMedia={(repeat) =>
                    setMediaState((prev) => ({ ...prev, isRepeatMedia: repeat }))
                  }
                  isRepeatMedia={mediaState.isRepeatMedia}
                  setIsLike={(like) => setMediaState((prev) => ({ ...prev, isLike: like }))}
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
                  images={mediaState.content
                    .filter((item) => item.src)
                    .map((item) => formatImageUrl(item.src))}
                  initialCurrentIndex={mediaState.currentIndex}
                  onIndexChange={(index) => setMediaState((prev) => ({ ...prev, currentIndex: index }))}
                  controls={{
                    showPrevious: true,
                    showPlayPause: true,
                    showNext: true,
                    showShuffle: true,
                    showEffects: true,
                    showDownload: true,
                  }}
                  timeToShow={5000}
                  showControls={true}
                />
              )}
            </div>
          </div>
        )}

        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              {modalContent}
              <button
                className="closeButton"
                onClick={() => setIsModalOpen(false)}
                aria-label="Cerrar modal"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Suspense>
    </div>
  );
};

export default MemoryDetail;















// getServerSideProps for server-side data fetching
/*export async function getServerSideProps(context) {
  const { userID, memoryName } = context.query;

  // Validate query parameters
  if (!userID || !memoryName) {
    return {
      props: {
        error: 'Missing userID or memoryName',
      },
    };
  }

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const res = await fetch(`${apiUrl}/api/mongoDb/postMemoryReferenceUser`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userID, memoryTitle: memoryName }),
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const mongoData = await res.json();

    if (!mongoData.success) {
      throw new Error('Failed to load memory data');
    }

    // Format data to match the original component's structure
    const formattedData = {
      ...mongoData.memory,
      ownerEmail: mongoData.ownerEmail,
      metadata: mongoData.memory.metadata || {},
      access: mongoData.memory.access || {},
      media: {
        photos: mongoData.memory.media.photos || [],
        videos: mongoData.memory.media.videos || [],
        audios: mongoData.memory.media.audios || [],
        documents: mongoData.memory.media.documents || [],
      },
    };

    return {
      props: {
        initialMemoryData: formattedData,
        userID,
        memoryName,
      },
    };
  } catch (err) {
    console.error('getServerSideProps error:', err.message);
    return {
      props: {
        error: err.message || 'Failed to fetch memory data',
      },
    };
  }
}

const MemoryDetail = ({ initialMemoryData, userID, memoryName, error: initialError }) => {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState(null);
  const [memoryData, setMemoryData] = useState(initialMemoryData);
  const [loading, setLoading] = useState(!initialMemoryData && !initialError);
  const [error, setError] = useState(initialError);
  const [folderContents, setFolderContents] = useState({});
  const [folderLoadingStates, setFolderLoadingStates] = useState({});
  const [roll, setRoll] = useState('false');
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [previewFolder, setPreviewFolder] = useState(null);
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(false);
  const mediaCache = useRef(new Map());

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

  // Fetch user email
  useEffect(() => {
    const email = auth.currentUser?.reloadUserInfo?.providerUserInfo?.[0]?.email;
    if (email) setUserEmail(email);
  }, []);

  // Preload media
  useEffect(() => {
    if (!memoryData) return;

    Object.entries(memoryData.media).forEach(([mediaType, items]) => {
      items.forEach((item) => {
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
  }, [memoryData]);

  // Access validation
  useEffect(() => {
    if (!memoryData || !userEmail) return;

    const checkViewPermissions = () => {
      const viewAccess = memoryData.access?.view;
      if (!viewAccess) {
        setError('Invalid access configuration');
        return;
      }

      const { visibility, invitedEmails = [] } = viewAccess;
      const currentPath = router.asPath;

      if (visibility === 'public') {
        setRoll('Anyone can upload memories');
        return;
      }

      if (!userEmail) {
        localStorage.setItem('redirectPath', currentPath);
        localStorage.setItem('reason', 'userEmailValidationOnly');
        router.push('/login');
        return;
      }

      const transformEmail = (email) => email.replace(/[@.]/g, '_');
      const currentUserTransformed = transformEmail(userEmail);
      const ownerTransformed = transformEmail(memoryData.ownerEmail);

      if (visibility === 'private') {
        if (currentUserTransformed === ownerTransformed) {
          setRoll('You are the owner');
          return;
        }
        setRoll('User not allowed');
        setMemoryData(null);
        return;
      }

      if (visibility === 'invitation') {
        const transformedInvites = invitedEmails.map(transformEmail);
        if (transformedInvites.includes(currentUserTransformed)) {
          setRoll('Invited to upload memories');
          return;
        }
        setRoll('Usuario no permitido');
        setMemoryData(null);
      }
    };

    checkViewPermissions();
  }, [memoryData, userEmail, router]);

  const handleFolderClick = async (folderName) => {
    setFolderLoadingStates((prev) => ({ ...prev, [folderName]: true }));
    setPreviewFolder(folderName);

    await new Promise((resolve) => setTimeout(resolve, 200));

    if (!folderContents[folderName]) {
      const filesWithCacheStatus = memoryData.media[folderName].map((item) => ({
        url: item.url,
        fileName: item.url.split('/').pop(),
        cached: mediaCache.current.has(item.url),
        metadata: item.metadata,
      }));

      setFolderContents((prev) => ({
        ...prev,
        [folderName]: {
          files: filesWithCacheStatus,
          loaded: true,
        },
      }));
    }

    setFolderLoadingStates((prev) => ({ ...prev, [folderName]: false }));
  };

  const closeFolderPreview = () => {
    setPreviewFolder(null);
  };

  const handleFileSelect = (url, folderName, index) => {
    const files = folderContents[folderName]?.files || [];
    const mediaTypeMap = {
      videos: 'video',
      audios: 'audio',
      photos: 'image',
    };

    setMediaType(mediaTypeMap[folderName] || 'image');

    const mediaContent = files.map((file) => ({
      src: file.url,
      type: mediaTypeMap[folderName],
      fileName: file.fileName,
      cached: file.cached,
      metadata: file.metadata,
    }));

    setMediaState((prev) => ({
      ...prev,
      content: mediaContent,
      srcs: folderName === 'videos' ? files.map((file) => file.url) : prev.srcs,
      currentIndex: index,
    }));

    setSelectedMedia(url);
    closeFolderPreview();
  };

  const closeMediaPlayer = () => {
    setSelectedMedia(null);
    setMediaType(null);
    setMediaState((prev) => ({ ...prev, componentInUse: '' }));
  };

  const formatImageUrl = (url) => {
    if (!url) return url;
    if (url.includes('?')) {
      return url.includes('format=webp') ? url : `${url}&format=webp`;
    }
    return `${url}?format=webp`;
  };

  const renderPreviewItem = (file, index, folderName) => {
    const isCached = mediaCache.current.has(file.url);
    const formattedUrl = formatImageUrl(file.url);

    return (
      <article
        key={index}
        onClick={() => handleFileSelect(file.url, folderName, index)}
        className={styles.previewItem}
        aria-label={`Open ${file.fileName}`}
      >
        {!isCached && (
          <div className={styles.loadingOverlay}>
            
          </div>
        )}
        {folderName === 'photos' ? (
          <div className={styles.imagePreview}>
            <img
              src={isCached ? formattedUrl : '/placeholder-image.jpg'}
              alt={`Preview of ${file.fileName}`}
              loading="lazy"
              onLoad={() => mediaCache.current.set(file.url, true)}
              onError={() => mediaCache.current.set(file.url, false)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        ) : folderName === 'videos' ? (
          <div className={styles.videoPreview}>
            {isCached ? (
              <video
                src={file.url}
                muted
                playsInline
                preload="metadata"
                onLoadedData={() => {
                  if (!mediaCache.current.has(file.url)) {
                    mediaCache.current.set(file.url, true);
                  }
                }}
                style={{ display: 'block', width: '100%', height: '100%' }}
              />
            ) : (
              <img
                src="/video-placeholder.jpg"
                alt={`Preview of ${file.fileName}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}
            <div className={styles.playIcon}>▶</div>
          </div>
        ) : folderName === 'audios' ? (
          <div className={styles.audioPreview}>
            <div className={styles.audioIcon}>🎵</div>
            <span>{file.fileName}</span>
          </div>
        ) : (
          <div className={styles.filePreview}>
            <span>{file.fileName}</span>
          </div>
        )}
      </article>
    );
  };

  if (loading) {
    return <LoadingMemories />;
  }

  if (error || !memoryData) {
    return (
      <div className="fullscreen-floating">
        <BackgroundGeneric showImageSlider={false}>
          <div className={styles.loading}>
            <MemoryLogo size={300} />
            <p className="color2 title-xl">Error: {error || 'Memory not found'}</p>
          </div>
        </BackgroundGeneric>
      </div>
    );
  }

  const foldersWithContent = Object.keys(memoryData.media).filter(
    (folderName) => memoryData.media[folderName].length > 0
  );

  const { metadata } = memoryData;

  // Structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: metadata?.title || 'Memory Detail',
    description: metadata?.description || 'A collection of media files for a specific memory.',
    url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/memory/${userID}/${memoryName}`,
    datePublished: metadata?.createdAt ? new Date(metadata.createdAt).toISOString() : undefined,
    dateModified: metadata?.lastUpdated ? new Date(metadata.lastUpdated).toISOString() : undefined,
    image: memoryData.media.photos?.[0]?.url
      ? formatImageUrl(memoryData.media.photos[0].url)
      : '/default-og-image.jpg',
  };

  return (
    <>
      <Head>
        <title>{metadata?.title || 'Memory Detail'}</title>
        <meta
          name="description"
          content={metadata?.description || 'View photos, videos, and other media for this memory.'}
        />
        <meta name="keywords" content="memory, media, photos, videos, audios, documents" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content={metadata?.title || 'Memory Detail'} />
        <meta
          property="og:description"
          content={metadata?.description || 'View photos, videos, and other media for this memory.'}
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content={`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/memory/${userID}/${memoryName}`}
        />
        <meta
          property="og:image"
          content={memoryData.media.photos?.[0]?.url ? formatImageUrl(memoryData.media.photos[0].url) : '/default-og-image.jpg'}
        />
        <link
          rel="canonical"
          href={`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/memory/${userID}/${memoryName}`}
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </Head>
      <main className={`${styles.fullscreenContainer} backgroundColor1`} aria-label="Memory detail page">
        <div className={styles.backgroundWrapper}>
          <Menu
            isOpen={isMainMenuOpen}
            onClose={() => setIsMainMenuOpen(false)}
            className="backgroundColor1 mainFont"
            aria-label="Main navigation menu"
          />
          <section className={`${styles.memoryContainer} backgroundColor5 color1`} aria-label="Memory details">
            <header className={styles.headerSection}>
              <div className={styles.titleContainer}>
                <button
                  style={{backgroundColor: 'none', border: 'none'}}
                  className="menuIconPosition"
                  onClick={() => setIsMainMenuOpen(true)}
                  aria-label="Open main menu"
                >
                  <MenuIcon onClick={() => setIsMainMenuOpen(true)} size={30} />
                </button>
                <h1 className={`${styles.memoryTitle} title-xl color2 centrar-horizontal`}>
                  {metadata?.title || 'No title available'}
                </h1>
              </div>
            </header>

            <div className={styles.contentWrapper}>
              <aside className={styles.infoColumn} aria-label="Memory information">
                <p>
                  <strong className={roll !== 'User not allowed' ? 'color2' : 'alertColor'}>Role:</strong>{' '}
                  <span className={roll !== 'User not allowed' ? 'color2' : 'alertColor'}>{roll}</span>
                </p>
                {roll === 'User not allowed' && (
                  <p style={{ color: 'red' }}>
                    If you believe this is a mistake, please contact the account owner.
                  </p>
                )}
                {metadata && (
                  <div className={styles.metadataContainer}>
                    <p className={`${styles.memoryDescription} color1`}>
                      {metadata.description || 'No description available'}
                    </p>
                    <div className={styles.datesContainer}>
                      <p>Created: {new Date(metadata.createdAt).toLocaleDateString()}</p>
                      <p>Last modified: {new Date(metadata.lastUpdated).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
              </aside>

              <section className={`${styles.filesColumn}`} aria-label="Media files">
                <h2 className="color1">Folders</h2>
                {foldersWithContent.length > 0 ? (
                  <ul className={`${styles.foldersList} color2`} aria-label="List of media folders">
                    {foldersWithContent.map((folderName) => (
                      <li style={{listStyle: 'none'}} key={folderName} className={styles.folderItem}>
                        <button
                          style={{width: '100%', backgroundColor: 'none', border: 'none'}}
                          className={styles.folderHeader}
                          onClick={() => handleFolderClick(folderName)}
                          aria-expanded={previewFolder === folderName}
                          aria-label={`Open ${folderName} folder`}
                        >
                          <div className={styles.folderInfo}>
                            <h3>{folderName}</h3>
                            <span className={styles.folderCount}>
                              {memoryData.media[folderName].length}{' '}
                              {memoryData.media[folderName].length === 1 ? 'item' : 'items'}
                            </span>
                            {folderLoadingStates[folderName] && <SpinnerIcon size={16} />}
                          </div>
                          <span className={styles.folderToggle}>→</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.noFoldersMessage}>No folders available for this memory.</p>
                )}
              </section>
            </div>

            {previewFolder && (
              <div className={styles.folderPreviewModal} role="dialog" aria-label={`${previewFolder} preview`}>
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

            {selectedMedia && (
              <div className={styles.mediaOverlay} role="dialog" aria-label="Media player">
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
                    setCurrentIndex={(index) => setMediaState((prev) => ({ ...prev, currentIndex: index }))}
                    setCurrentTimeMedia={(time) =>
                      setMediaState((prev) => ({ ...prev, currentTimeMedia: time }))
                    }
                    currentTimeMedia={mediaState.currentTimeMedia}
                    setVolumeMedia={(vol) => setMediaState((prev) => ({ ...prev, volumeMedia: vol }))}
                    volumeMedia={mediaState.volumeMedia}
                    setIsMutedMedia={(muted) => setMediaState((prev) => ({ ...prev, isMutedMedia: muted }))}
                    isMutedMedia={mediaState.isMutedMedia}
                    setIsRepeatMedia={(repeat) =>
                      setMediaState((prev) => ({ ...prev, isRepeatMedia: repeat }))
                    }
                    isRepeatMedia={mediaState.isRepeatMedia}
                    setIsLike={(like) => setMediaState((prev) => ({ ...prev, isLike: like }))}
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
                    images={mediaState.content
                      .filter((item) => item.src) // Filter out invalid URLs
                      .map((item) => formatImageUrl(item.src))}
                    initialCurrentIndex={mediaState.currentIndex}
                    onIndexChange={(index) => setMediaState((prev) => ({ ...prev, currentIndex: index }))}
                    controls={{
                      showPrevious: true,
                      showPlayPause: true,
                      showNext: true,
                      showShuffle: true,
                      showEffects: true,
                      showDownload: true,
                    }}
                    timeToShow={5000}
                    showControls={true}
                  />
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
};

export default MemoryDetail;*/