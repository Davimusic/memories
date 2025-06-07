'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import ReactDOM from 'react-dom';
import styles from '../../../estilos/general/memoryDetail.module.css';
import SpinnerIcon from '@/components/complex/spinnerIcon';
import dynamic from 'next/dynamic';
import LoadingMemories from '@/components/complex/loading';
import Head from 'next/head';
import GeneralMold from '@/components/complex/generalMold';
import QRCodeStyling from 'qr-code-styling';
import QRGenerator from '@/components/complex/QRGenerator';

const Video = dynamic(() => import('../../../components/simple/video'), { ssr: false });
const AudioPlayer = dynamic(() => import('../../../components/complex/audioPlayer'), { ssr: false });
const ImageSlider = dynamic(() => import('../../../components/complex/imageSlider'), { ssr: false });

const MemoryDetail = () => {
  const router = useRouter();
  const { userID, memoryName } = router.query;
  const [memoryData, setMemoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [folderContents, setFolderContents] = useState({});
  const [folderLoadingStates, setFolderLoadingStates] = useState({});
  const [roll, setRoll] = useState('false');
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [previewFolder, setPreviewFolder] = useState(null);
  const mediaCache = useRef(new Map());
  const [uid, setUid] = useState(null);
  const [token, setToken] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const modalRootRef = useRef(null);
  const qrCodeRef = useRef(null); // Reference for QR code instance

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
    isLike: false,
    isHybridView: false,
  });

  // Construct the QR code URL based on the current route
  const qrCodeUrl = userID && memoryName
    ? `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/memory/${userID}/${memoryName}`
    : 'https://example.com';

  useEffect(() => {
    if (!document.getElementById('modal-root')) {
      const modalRoot = document.createElement('div');
      modalRoot.id = 'modal-root';
      document.body.appendChild(modalRoot);
    }
    modalRootRef.current = document.getElementById('modal-root');
    
    return () => {
      if (document.getElementById('modal-root')) {
        document.body.removeChild(document.getElementById('modal-root'));
      }
    };
  }, []);

  useEffect(() => {
    if (previewFolder || selectedMedia) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
  }, [previewFolder, selectedMedia]);

  useEffect(() => {
    const fetchMemoryData = async () => {
      try {
        if (!userID || !memoryName) {
          setError('Missing userID or memoryName');
          setLoading(false);
          return;
        }

        const res = await fetch('/api/mongoDb/postMemoryReferenceUser', {
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

  useEffect(() => {
    if (!memoryData || !userEmail) return;

    const checkViewPermissions = () => {
      const viewAccess = memoryData.access?.view;
      if (!viewAccess) {
        setError('Invalid access configuration');
        return;
      }

      const { visibility, invitedEmails = [] } = viewAccess;

      if (visibility === 'public') {
        setRoll('Anyone can view this memory');
        return;
      }

      if (!userEmail) {
        setRoll('Please log in to view this memory');
        return;
      }

      const transformEmail = (email) => email.replace(/[@.]/g, '_');
      const currentUserTransformed = transformEmail(userEmail);
      const ownerTransformed = transformEmail(memoryData.ownerEmail);

      if (visibility === 'private') {
        if (currentUserTransformed === ownerTransformed) {
          setRoll('You are the owner');
        } else {
          setRoll('User not allowed');
        }
      } else if (visibility === 'invitation') {
        const transformedInvites = invitedEmails.map(transformEmail);
        if (transformedInvites.includes(currentUserTransformed)) {
          setRoll('Invited to view this memory');
        } else {
          setRoll('User not allowed');
        }
      }
    };

    checkViewPermissions();
  }, [memoryData, userEmail]);

  // Initialize QR code for download functionality
  useEffect(() => {
    if (!qrCodeRef.current) {
      qrCodeRef.current = new QRCodeStyling({
        width: 200,
        height: 200,
        data: qrCodeUrl,
        dotsOptions: { color: '#000000', type: 'rounded' },
        cornersSquareOptions: { type: 'extra-rounded' },
        backgroundOptions: { color: '#ffffff' },
        imageOptions: { crossOrigin: 'anonymous', margin: 5 },
      });
    } else {
      qrCodeRef.current.update({ data: qrCodeUrl });
    }
  }, [qrCodeUrl]);

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
        [folderName]: { files: filesWithCacheStatus, loaded: true },
      }));
    }

    setFolderLoadingStates((prev) => ({ ...prev, [folderName]: false }));
  };

  const closeFolderPreview = () => setPreviewFolder(null);

  const handleFileSelect = (url, folderName, index) => {
    const files = folderContents[folderName]?.files || [];
    const mediaTypeMap = { videos: 'video', audios: 'audio', photos: 'image' };

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

  const handleDownloadQR = () => {
    if (qrCodeRef.current) {
      qrCodeRef.current.download({ name: `memory-${memoryName || 'qr'}`, extension: 'png' });
    }
  };

  const handleShareQR = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: memoryData?.metadata?.title || 'Memory Detail',
          text: memoryData?.metadata?.description || 'Check out this memory!',
          url: qrCodeUrl,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      alert('Sharing is not supported on this device/browser. You can copy the URL: ' + qrCodeUrl);
    }
  };

  const formatImageUrl = (url) => {
    if (!url) return url;
    return url.includes('?') ? (url.includes('format=webp') ? url : `${url}&format=webp`) : `${url}?format=webp`;
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

  const foldersWithContent = memoryData
    ? Object.keys(memoryData.media).filter((folderName) => memoryData.media[folderName].length > 0)
    : [];

  const leftContent = loading ? (
    <LoadingMemories />
  ) : error ? (
    <div className="error-container">
      <p className="color1 title-lg">{error}</p>
    </div>
  ) : (
    <div className={styles.infoColumn}>
      <p>
        <strong className={roll !== 'User not allowed' ? 'text-secondary' : 'alertColor'}>Role:</strong>{' '}
        <span className={roll !== 'User not allowed' ? 'text-secondary' : 'alertColor'}>{roll}</span>
      </p>
      {roll === 'User not allowed' && (
        <p className="alertColor">If you believe this is a mistake, please contact the account owner.</p>
      )}
      <h2 className="text-primary">{memoryData?.metadata?.title || 'No title available'}</h2>
      {memoryData?.metadata && (
        <div className={styles.metadataContainer}>
          <p className={`${styles.memoryDescription} text-primary`}>
            {memoryData.metadata.description || 'No description available'}
          </p>
          <div className={styles.datesContainer}>
            <p className="folderToggle">Created: {new Date(memoryData.metadata.createdAt).toLocaleDateString()}</p>
            <p className="folderToggle">Last modified: {new Date(memoryData.metadata.lastUpdated).toLocaleDateString()}</p>
          </div>
        </div>
      )}
      <div className={styles.qrCodeContainer}>
        <h3 className="text-secondary">Share this Memory</h3>
        <div className={styles.qrCodeWrapper}>
          <QRGenerator
            value={qrCodeUrl}
            dotsColor="#000000"
            bgColor="#ffffff"
            dotsType="rounded"
            cornersType="extra-rounded"
          />
        </div>
        <div className={styles.qrCodeButtons}>
          <button className={styles.qrButton} onClick={handleDownloadQR}>
            Download QR Code
          </button>
          <button className={styles.qrButton} onClick={handleShareQR}>
            Share
          </button>
        </div>
      </div>
    </div>
  );

  const renderModals = () => {
    return (
      <>
        {previewFolder && ReactDOM.createPortal(
          <div className={styles.modalOverlay} onClick={closeFolderPreview}>
            <div 
              className={styles.modalContentMemories} 
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={closeFolderPreview} className={styles.closeButton}>
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
          </div>,
          modalRootRef.current
        )}

        {selectedMedia && ReactDOM.createPortal(
          <div className={styles.modalOverlay} onClick={closeMediaPlayer}>
            <div 
              className={styles.modalContentMemories}
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={closeMediaPlayer} className={styles.closeButton}>
                ×
              </button>
              <div className={styles.mediaContainer}>
                {mediaType === 'video' && (
                  <Video
                    srcs={mediaState.srcs}
                    currentIndex={mediaState.currentIndex}
                    setCurrentIndex={(index) => setMediaState((prev) => ({ ...prev, currentIndex: index }))}
                    setCurrentTimeMedia={(time) => setMediaState((prev) => ({ ...prev, currentTimeMedia: time }))}
                    currentTimeMedia={mediaState.currentTimeMedia}
                    setVolumeMedia={(vol) => setMediaState((prev) => ({ ...prev, volumeMedia: vol }))}
                    volumeMedia={mediaState.volumeMedia}
                    setIsMutedMedia={(muted) => setMediaState((prev) => ({ ...prev, isMutedMedia: muted }))}
                    isMutedMedia={mediaState.isMutedMedia}
                    setIsRepeatMedia={(repeat) => setMediaState((prev) => ({ ...prev, isRepeatMedia: repeat }))}
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
                    images={mediaState.content.filter((item) => item.src).map((item) => formatImageUrl(item.src))}
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
          </div>,
          modalRootRef.current
        )}
      </>
    );
  };

  const rightContent = loading || error ? null : (
    <section className={styles.filesColumn}>
      <h2 className="text-primary">Folders</h2>
      {foldersWithContent.length > 0 ? (
        <ul className={`${styles.foldersList} text-secondary`}>
          {foldersWithContent.map((folderName) => (
            <li style={{ listStyle: 'none' }} key={folderName} className={styles.folderItem}>
              <button
                style={{ width: '100%', background: 'none', border: 'none' }}
                className={styles.folderHeader}
                onClick={() => handleFolderClick(folderName)}
                aria-expanded={previewFolder === folderName}
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
        <p>No folders available for this memory.</p>
      )}
    </section>
  );

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: memoryData?.metadata?.title || 'Memory Detail',
    description: memoryData?.metadata?.description || 'A collection of media files for a specific memory.',
    url: qrCodeUrl,
    datePublished: memoryData?.metadata?.createdAt
      ? new Date(memoryData.metadata.createdAt).toISOString()
      : undefined,
    dateModified: memoryData?.metadata?.lastUpdated
      ? new Date(memoryData.metadata.lastUpdated).toISOString()
      : undefined,
    image: memoryData?.media.photos?.[0]?.url
      ? formatImageUrl(memoryData.media.photos[0].url)
      : '/default-og-image.jpg',
  };

  return (
    <>
      <Head>
        <title>{memoryData?.metadata?.title || 'Memory Detail'}</title>
        <meta
          name="description"
          content={memoryData?.metadata?.description || 'View photos, videos, and other media for this memory.'}
        />
        <meta name="keywords" content="memory, media, photos, videos, audios, documents" />
        <meta name="robots" content={memoryData?.access?.view?.visibility === 'public' ? 'index, follow' : 'noindex'} />
        <meta property="og:title" content={memoryData?.metadata?.title || 'Memory Detail'} />
        <meta
          property="og:description"
          content={memoryData?.metadata?.description || 'View photos, videos, and other media for this memory.'}
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={qrCodeUrl} />
        <meta
          property="og:image"
          content={
            memoryData?.media.photos?.[0]?.url
              ? formatImageUrl(memoryData.media.photos[0].url)
              : '/default-og-image.jpg'
          }
        />
        <link rel="canonical" href={qrCodeUrl} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </Head>
      <GeneralMold
        pageTitle={memoryData?.metadata?.title || 'Memory Detail'}
        pageDescription={memoryData?.metadata?.description || 'View memory details'}
        visibility={memoryData?.access?.view?.visibility || 'private'}
        owner={memoryData?.ownerEmail || 'Unknown'}
        leftContent={leftContent}
        rightContent={rightContent}
        setUidChild={setUid}
        setTokenChild={setToken}
        setUserEmailChild={setUserEmail}
      />
      {renderModals()}
    </>
  );
};

export default MemoryDetail;

















































/*'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import ReactDOM from 'react-dom';
import styles from '../../../estilos/general/memoryDetail.module.css';
import SpinnerIcon from '@/components/complex/spinnerIcon';
import dynamic from 'next/dynamic';
import LoadingMemories from '@/components/complex/loading';
import Head from 'next/head';
import GeneralMold from '@/components/complex/generalMold';

const Video = dynamic(() => import('../../../components/simple/video'), { ssr: false });
const AudioPlayer = dynamic(() => import('../../../components/complex/audioPlayer'), { ssr: false });
const ImageSlider = dynamic(() => import('../../../components/complex/imageSlider'), { ssr: false });

const MemoryDetail = () => {
  const router = useRouter();
  const { userID, memoryName } = router.query;
  const [memoryData, setMemoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [folderContents, setFolderContents] = useState({});
  const [folderLoadingStates, setFolderLoadingStates] = useState({});
  const [roll, setRoll] = useState('false');
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [previewFolder, setPreviewFolder] = useState(null);
  const mediaCache = useRef(new Map());
  const [uid, setUid] = useState(null);
  const [token, setToken] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const modalRootRef = useRef(null);

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
    isLike: false,
    isHybridView: false,
  });

  useEffect(() => {
    if (!document.getElementById('modal-root')) {
      const modalRoot = document.createElement('div');
      modalRoot.id = 'modal-root';
      document.body.appendChild(modalRoot);
    }
    modalRootRef.current = document.getElementById('modal-root');
    
    return () => {
      if (document.getElementById('modal-root')) {
        document.body.removeChild(document.getElementById('modal-root'));
      }
    };
  }, []);

  // En MemoryDetail.js
useEffect(() => {
  if (previewFolder || selectedMedia) {
    document.body.classList.add('modal-open');
  } else {
    document.body.classList.remove('modal-open');
  }
}, [previewFolder, selectedMedia]);


  useEffect(() => {
    const fetchMemoryData = async () => {
      try {
        if (!userID || !memoryName) {
          setError('Missing userID or memoryName');
          setLoading(false);
          return;
        }

        const res = await fetch('/api/mongoDb/postMemoryReferenceUser', {
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

  useEffect(() => {
    if (!memoryData || !userEmail) return;

    const checkViewPermissions = () => {
      const viewAccess = memoryData.access?.view;
      if (!viewAccess) {
        setError('Invalid access configuration');
        return;
      }

      const { visibility, invitedEmails = [] } = viewAccess;

      if (visibility === 'public') {
        setRoll('Anyone can view this memory');
        return;
      }

      if (!userEmail) {
        setRoll('Please log in to view this memory');
        return;
      }

      const transformEmail = (email) => email.replace(/[@.]/g, '_');
      const currentUserTransformed = transformEmail(userEmail);
      const ownerTransformed = transformEmail(memoryData.ownerEmail);

      if (visibility === 'private') {
        if (currentUserTransformed === ownerTransformed) {
          setRoll('You are the owner');
        } else {
          setRoll('User not allowed');
        }
      } else if (visibility === 'invitation') {
        const transformedInvites = invitedEmails.map(transformEmail);
        if (transformedInvites.includes(currentUserTransformed)) {
          setRoll('Invited to view this memory');
        } else {
          setRoll('User not allowed');
        }
      }
    };

    checkViewPermissions();
  }, [memoryData, userEmail]);

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
        [folderName]: { files: filesWithCacheStatus, loaded: true },
      }));
    }

    setFolderLoadingStates((prev) => ({ ...prev, [folderName]: false }));
  };

  const closeFolderPreview = () => setPreviewFolder(null);

  const handleFileSelect = (url, folderName, index) => {
    const files = folderContents[folderName]?.files || [];
    const mediaTypeMap = { videos: 'video', audios: 'audio', photos: 'image' };

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
    return url.includes('?') ? (url.includes('format=webp') ? url : `${url}&format=webp`) : `${url}?format=webp`;
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

  const foldersWithContent = memoryData
    ? Object.keys(memoryData.media).filter((folderName) => memoryData.media[folderName].length > 0)
    : [];

  const leftContent = loading ? (
    <LoadingMemories />
  ) : error ? (
    <div className="error-container">
      <p className="color1 title-lg">{error}</p>
    </div>
  ) : (
    <div className={styles.infoColumn}>
      <p>
        <strong className={roll !== 'User not allowed' ? 'text-secondary' : 'alertColor'}>Role:</strong>{' '}
        <span className={roll !== 'User not allowed' ? 'text-secondary' : 'alertColor'}>{roll}</span>
      </p>
      {roll === 'User not allowed' && (
        <p className="alertColor">If you believe this is a mistake, please contact the account owner.</p>
      )}
      <h2 className="text-primary">{memoryData?.metadata?.title || 'No title available'}</h2>
      {memoryData?.metadata && (
        <div className={styles.metadataContainer}>
          <p className={`${styles.memoryDescription} text-primary`}>
            {memoryData.metadata.description || 'No description available'}
          </p>
          <div className={styles.datesContainer}>
            <p className="folderToggle">Created: {new Date(memoryData.metadata.createdAt).toLocaleDateString()}</p>
            <p className="folderToggle">Last modified: {new Date(memoryData.metadata.lastUpdated).toLocaleDateString()}</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderModals = () => {
    return (
      <>
        {previewFolder && ReactDOM.createPortal(
          <div className={styles.modalOverlay} onClick={closeFolderPreview}>
            <div 
              className={styles.modalContentMemories} 
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={closeFolderPreview} className={styles.closeButton}>
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
          </div>,
          modalRootRef.current
        )}

        {selectedMedia && ReactDOM.createPortal(
          <div className={styles.modalOverlay} onClick={closeMediaPlayer}>
            <div 
              className={styles.modalContentMemories}
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={closeMediaPlayer} className={styles.closeButton}>
                ×
              </button>
              <div className={styles.mediaContainer}>
                {mediaType === 'video' && (
                  <Video
                    srcs={mediaState.srcs}
                    currentIndex={mediaState.currentIndex}
                    setCurrentIndex={(index) => setMediaState((prev) => ({ ...prev, currentIndex: index }))}
                    setCurrentTimeMedia={(time) => setMediaState((prev) => ({ ...prev, currentTimeMedia: time }))}
                    currentTimeMedia={mediaState.currentTimeMedia}
                    setVolumeMedia={(vol) => setMediaState((prev) => ({ ...prev, volumeMedia: vol }))}
                    volumeMedia={mediaState.volumeMedia}
                    setIsMutedMedia={(muted) => setMediaState((prev) => ({ ...prev, isMutedMedia: muted }))}
                    isMutedMedia={mediaState.isMutedMedia}
                    setIsRepeatMedia={(repeat) => setMediaState((prev) => ({ ...prev, isRepeatMedia: repeat }))}
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
                    images={mediaState.content.filter((item) => item.src).map((item) => formatImageUrl(item.src))}
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
          </div>,
          modalRootRef.current
        )}
      </>
    );
  };

  const rightContent = loading || error ? null : (
    <section className={styles.filesColumn}>
      <h2 className="text-primary">Folders</h2>
      {foldersWithContent.length > 0 ? (
        <ul className={`${styles.foldersList} text-secondary`}>
          {foldersWithContent.map((folderName) => (
            <li style={{ listStyle: 'none' }} key={folderName} className={styles.folderItem}>
              <button
                style={{ width: '100%', background: 'none', border: 'none' }}
                className={styles.folderHeader}
                onClick={() => handleFolderClick(folderName)}
                aria-expanded={previewFolder === folderName}
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
        <p>No folders available for this memory.</p>
      )}
    </section>
  );

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: memoryData?.metadata?.title || 'Memory Detail',
    description: memoryData?.metadata?.description || 'A collection of media files for a specific memory.',
    url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/memory/${userID}/${memoryName}`,
    datePublished: memoryData?.metadata?.createdAt
      ? new Date(memoryData.metadata.createdAt).toISOString()
      : undefined,
    dateModified: memoryData?.metadata?.lastUpdated
      ? new Date(memoryData.metadata.lastUpdated).toISOString()
      : undefined,
    image: memoryData?.media.photos?.[0]?.url
      ? formatImageUrl(memoryData.media.photos[0].url)
      : '/default-og-image.jpg',
  };

  return (
    <>
      <Head>
        <title>{memoryData?.metadata?.title || 'Memory Detail'}</title>
        <meta
          name="description"
          content={memoryData?.metadata?.description || 'View photos, videos, and other media for this memory.'}
        />
        <meta name="keywords" content="memory, media, photos, videos, audios, documents" />
        <meta name="robots" content={memoryData?.access?.view?.visibility === 'public' ? 'index, follow' : 'noindex'} />
        <meta property="og:title" content={memoryData?.metadata?.title || 'Memory Detail'} />
        <meta
          property="og:description"
          content={memoryData?.metadata?.description || 'View photos, videos, and other media for this memory.'}
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content={`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/memory/${userID}/${memoryName}`}
        />
        <meta
          property="og:image"
          content={
            memoryData?.media.photos?.[0]?.url
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
      <GeneralMold
        pageTitle={memoryData?.metadata?.title || 'Memory Detail'}
        pageDescription={memoryData?.metadata?.description || 'View memory details'}
        visibility={memoryData?.access?.view?.visibility || 'private'}
        owner={memoryData?.ownerEmail || 'Unknown'}
        leftContent={leftContent}
        rightContent={rightContent}
        setUidChild={setUid}
        setTokenChild={setToken}
        setUserEmailChild={setUserEmail}
      />
      {renderModals()}
    </>
  );
};

export default MemoryDetail;*/










