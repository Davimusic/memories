'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import ReactDOM from 'react-dom';
import styles from '../../../estilos/general/memoryDetail.module.css';
import '../../../app/globals.css';
import SpinnerIcon from '@/components/complex/spinnerIcon';
import dynamic from 'next/dynamic';
import LoadingMemories from '@/components/complex/loading';
import Head from 'next/head';
import GeneralMold from '@/components/complex/generalMold';
import QRCodeStyling from 'qr-code-styling';
import QRGenerator from '@/components/complex/QRGenerator';
import QRIcon from '@/components/complex/icons/qrIcon';

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
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [videoThumbnails, setVideoThumbnails] = useState({});
  const [initialData, setInitialData] = useState();
  const [uid, setUid] = useState(null);
  const [token, setToken] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const modalRootRef = useRef(null);
  const qrCodeRef = useRef(null);
  const mediaCache = useRef(new Map());
  const thumbnailsCache = useRef(new Map());

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

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const currentPath = router.asPath;
  const qrCodeUrl = userID && memoryName ? `${baseUrl}${currentPath}` : 'https://example.com';

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
    if (previewFolder || selectedMedia || isQrModalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
  }, [previewFolder, selectedMedia, isQrModalOpen]);

  const generateVideoThumbnail = async (url) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.preload = 'metadata';
      video.src = url;

      video.onloadeddata = () => {
        video.currentTime = 0.1;
      };

      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
          resolve(thumbnail);
        } else {
          reject(new Error('Canvas context not available'));
        }
      };

      video.onerror = (error) => {
        reject(error);
      };
    });
  };

  const preloadMedia = async () => {
    if (!memoryData?.topics) return;

    Object.values(memoryData.topics).forEach((topic) => {
      topic.photos?.forEach((photo) => {
        if (!mediaCache.current.has(photo.url)) {
          const img = new Image();
          img.src = formatImageUrl(photo.url);
          img.onload = () => mediaCache.current.set(photo.url, true);
          img.onerror = () => mediaCache.current.set(photo.url, false);
        }
      });

      topic.videos?.forEach((video) => {
        if (!mediaCache.current.has(video.url)) {
          const videoEl = document.createElement('video');
          videoEl.preload = 'metadata';
          videoEl.src = video.url;
          videoEl.onloadeddata = () => mediaCache.current.set(video.url, true);
          videoEl.onerror = () => mediaCache.current.set(video.url, false);

          if (!thumbnailsCache.current.has(video.url)) {
            generateVideoThumbnail(video.url)
              .then((thumbnail) => {
                thumbnailsCache.current.set(video.url, thumbnail);
                setVideoThumbnails((prev) => ({ ...prev, [video.url]: thumbnail }));
              })
              .catch(() => {
                thumbnailsCache.current.set(video.url, '/video-placeholder.jpg');
              });
          }
        }
      });

      topic.audios?.forEach((audio) => {
        if (!mediaCache.current.has(audio.url)) {
          const audioEl = new Audio();
          audioEl.preload = 'metadata';
          audioEl.src = audio.url;
          audioEl.onloadeddata = () => mediaCache.current.set(audio.url, true);
          audioEl.onerror = () => mediaCache.current.set(audio.url, false);
        }
      });
    });
  };

  useEffect(() => {
    return () => {
      Object.values(videoThumbnails).forEach(URL.revokeObjectURL);
    };
  }, [videoThumbnails]);

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
          media: mongoData.memory.media || {
            photos: [],
            videos: [],
            audios: [],
            documents: [],
            texts: [],
          },
        };

        console.log(formattedData);
        setMemoryData(formattedData);
        // Set default topic to the first one with content, or first topic if none have content
        const firstTopicWithContent = Object.keys(formattedData.topics || {}).find((topicName) => {
          const topic = formattedData.topics[topicName];
          return (
            topic.photos?.length > 0 ||
            topic.videos?.length > 0 ||
            topic.audios?.length > 0 ||
            topic.texts?.length > 0
          );
        });
        setSelectedTopic(firstTopicWithContent || Object.keys(formattedData.topics || {})[0] || null);
        setError(null);
        preloadMedia();
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

  const preloadVideo = (url) => {
    if (!mediaCache.current.has(url)) {
      const video = document.createElement('video');
      video.preload = 'auto';
      video.src = url;
      video.onloadeddata = () => mediaCache.current.set(url, true);
      video.onerror = () => mediaCache.current.set(url, false);
    }
  };

  const handleFolderClick = async (mediaType) => {
    if (!selectedTopic) return;

    const folderKey = `${selectedTopic}_${mediaType}`;
    setFolderLoadingStates((prev) => ({ ...prev, [folderKey]: true }));
    setPreviewFolder(folderKey);

    await new Promise((resolve) => setTimeout(resolve, 200));

    if (!folderContents[folderKey]) {
      const topicData = memoryData.topics[selectedTopic] || {};
      const filesWithCacheStatus = (topicData[mediaType] || []).map((item) => ({
        url: item.url,
        fileName: item.url.split('/').pop(),
        cached: mediaCache.current.has(item.url),
        metadata: item.metadata,
      }));

      setFolderContents((prev) => ({
        ...prev,
        [folderKey]: { files: filesWithCacheStatus, loaded: true },
      }));
    }

    if (mediaType === 'videos' && memoryData.topics[selectedTopic]?.videos?.length > 0) {
      preloadVideo(memoryData.topics[selectedTopic].videos[0].url);
    }

    setFolderLoadingStates((prev) => ({ ...prev, [folderKey]: false }));
  };

  const closeFolderPreview = () => setPreviewFolder(null);

  const handleFileSelect = (url, folderKey, index) => {
    const files = folderContents[folderKey]?.files || [];
    const mediaTypeMap = {
      photos: 'image',
      videos: 'video',
      audios: 'audio',
      texts: 'text',
    };
    const mediaType = mediaTypeMap[folderKey.split('_')[1]] || 'image';

    setMediaType(mediaType);

    const mediaContent = files.map((file) => ({
      src: file.url,
      type: mediaType,
      fileName: file.fileName,
      cached: file.cached,
      metadata: file.metadata,
    }));

    setMediaState((prev) => ({
      ...prev,
      content: mediaContent,
      srcs: mediaType === 'video' ? mediaContent.map((file) => file.src) : prev.srcs,
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
      qrCodeRef.current.download({ name: `memory-${memoryData?.metadata?.title || 'qr'}`, extension: 'png' });
    }
  };

  const handleShareQR = async () => {
    if (navigator.share) {
      try {
        const qrBlob = await new Promise((resolve) => {
          qrCodeRef.current.getRawData('png').then((blob) => {
            resolve(blob);
          });
        });

        const qrFile = new File([qrBlob], `memory-qr-${memoryData?.metadata?.title || 'qr'}.png`, {
          type: 'image/png',
        });

        await navigator.share({
          title: memoryData?.metadata?.title || 'Memory Detail',
          text: memoryData?.metadata?.description || 'Check out this memory!',
          url: qrCodeUrl,
          files: [qrFile],
        });
      } catch (err) {
        console.error('Share failed:', err);
        alert('Sharing failed. You can copy the URL: ' + qrCodeUrl);
      }
    } else {
      alert('Sharing is not supported on this device/browser. You can copy the URL: ' + qrCodeUrl);
    }
  };

  const formatImageUrl = (url) => {
    if (!url) return url;
    return url.includes('?') ? (url.includes('format=webp') ? url : `${url}&format=webp`) : `${url}?format=webp`;
  };

  const renderPreviewItem = (file, index, folderKey) => {
    const formattedUrl = formatImageUrl(file.url);
    const mediaType = folderKey.split('_')[1];

    if (mediaType === 'photos') {
      return (
        <article
          key={index}
          onClick={() => handleFileSelect(file.url, folderKey, index)}
          className={styles.previewItem}
          aria-label={`Open ${file.fileName}`}
        >
          <div className={styles.imagePreview}>
            <img
              src={formattedUrl || '/placeholder-image.jpg'}
              alt={`Preview of ${file.fileName}`}
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </article>
      );
    } else if (mediaType === 'videos') {
      const thumbnail = videoThumbnails[file.url] || '/video-placeholder.jpg';

      return (
        <article
          key={index}
          onClick={() => handleFileSelect(file.url, folderKey, index)}
          className={styles.previewItem}
          aria-label={`Open ${file.fileName}`}
        >
          <div className={styles.videoPreview} onMouseEnter={() => preloadVideo(file.url)}>
            <img
              src={thumbnail}
              alt={`Preview of ${file.fileName}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div className={styles.playIcon}>▶</div>
          </div>
        </article>
      );
    } else if (mediaType === 'audios') {
      return (
        <article
          key={index}
          onClick={() => handleFileSelect(file.url, folderKey, index)}
          className={styles.previewItem}
          aria-label={`Open ${file.fileName}`}
        >
          <div className={styles.audioPreview}>
            <div className={styles.audioIcon}>🎵</div>
            <span style={{ color: 'white' }}>{file.fileName}</span>
          </div>
        </article>
      );
    } else {
      return (
        <article
          key={index}
          onClick={() => handleFileSelect(file.url, folderKey, index)}
          className={styles.previewItem}
          aria-label={`Open ${file.fileName}`}
        >
          <div className={styles.filePreview}>
            <span>{file.fileName}</span>
          </div>
        </article>
      );
    }
  };

  const foldersWithContent = selectedTopic
    ? Object.keys(memoryData?.topics?.[selectedTopic] || {}).filter(
        (mediaType) =>
          ['photos', 'videos', 'audios', 'texts'].includes(mediaType) &&
          memoryData.topics[selectedTopic][mediaType]?.length > 0,
      )
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
            <p className="folderToggle">
              Last modified: {new Date(memoryData.metadata.lastUpdated).toLocaleDateString()}
            </p>
            <button
              style={{ backgroundColor: '#66666600', border: 'none', width: '40px' }}
              onClick={() => setIsQrModalOpen(true)}
              aria-label="Open QR Code"
            >
              <QRIcon size={30} onClick={() => setIsQrModalOpen(true)} />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderModals = () => {
    return (
      <>
        {previewFolder &&
          ReactDOM.createPortal(
            <div className={styles.modalOverlay} onClick={closeFolderPreview}>
              <div className={styles.modalContentMemories} onClick={(e) => e.stopPropagation()}>
                <button onClick={closeFolderPreview} className={'closeButton'}>
                  ×
                </button>
                <h2 className={styles.previewTitle}>{previewFolder.split('_')[1]}</h2>
                <div className={styles.previewContent}>
                  {folderLoadingStates[previewFolder] ? (
                    <div className={styles.loadingPreview}>
                      <SpinnerIcon size={40} />
                      <p>Loading contents...</p>
                    </div>
                  ) : folderContents[previewFolder]?.files?.length > 0 ? (
                    <div className={styles.previewGrid}>
                      {folderContents[previewFolder].files.map((file, index) =>
                        renderPreviewItem(file, index, previewFolder),
                      )}
                    </div>
                  ) : (
                    <p>No files in this category.</p>
                  )}
                </div>
              </div>
            </div>,
            modalRootRef.current,
          )}

        {selectedMedia &&
          ReactDOM.createPortal(
            <div className={styles.modalOverlay} onClick={closeMediaPlayer}>
              <div className={styles.modalContentMemories} onClick={(e) => e.stopPropagation()}>
                <button onClick={closeMediaPlayer} className={'closeButton'}>
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
            modalRootRef.current,
          )}

        {isQrModalOpen &&
          ReactDOM.createPortal(
            <div className={styles.modalOverlay} onClick={() => setIsQrModalOpen(false)}>
              <div className={styles.modalContentMemories} onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setIsQrModalOpen(false)} className={'closeButton'}>
                  ×
                </button>
                <h2 className={styles.previewTitle}>Share this Memory</h2>
                <div className={styles.qrCodeWrapper}>
                  <div>
                    <QRGenerator
                      value={qrCodeUrl}
                      dotsColor="#000000"
                      bgColor="#ffffff"
                      dotsType="rounded"
                      cornersType="extra-rounded"
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%' }}>
                      <button className={'button2'} onClick={handleDownloadQR}>
                        Download
                      </button>
                      <button className={'button2'} onClick={handleShareQR}>
                        Share
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            modalRootRef.current,
          )}
      </>
    );
  };

  const rightContent = loading || error ? null : (
    <section className={styles.filesColumn}>
      <h2 className="text-primary">Media Types</h2>
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="topicSelect" className="text-secondary" style={{ marginRight: '10px' }}>
          Select Topic:
        </label>
        <select
          id="topicSelect"
          value={selectedTopic || ''}
          onChange={(e) => {
            setSelectedTopic(e.target.value);
            setFolderContents({}); // Reset folder contents when changing topic
            setPreviewFolder(null); // Close any open preview
          }}
          style={{ padding: '5px', fontSize: '16px' }}
        >
          {Object.keys(memoryData?.topics || {}).map((topicName) => (
            <option key={topicName} value={topicName}>
              {topicName}
            </option>
          ))}
        </select>
      </div>
      {selectedTopic && foldersWithContent.length > 0 ? (
        <ul className={`${styles.foldersList} text-secondary`}>
          {foldersWithContent.map((mediaType) => (
            <li style={{ listStyle: 'none' }} key={mediaType} className={styles.folderItem}>
              <button
                style={{ width: '100%', background: 'none', border: 'none' }}
                className={styles.folderHeader}
                onClick={() => handleFolderClick(mediaType)}
                aria-expanded={previewFolder === `${selectedTopic}_${mediaType}`}
              >
                <div className={styles.folderInfo}>
                  <h3 className="text-secondary">{mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}</h3>
                  <span className="text-secondary">
                    {memoryData.topics[selectedTopic][mediaType]?.length || 0}{' '}
                    {memoryData.topics[selectedTopic][mediaType]?.length === 1 ? 'item' : 'items'}
                  </span>
                  {folderLoadingStates[`${selectedTopic}_${mediaType}`] && <SpinnerIcon size={16} />}
                </div>
                <span className={styles.folderToggle}>→</span>
              </button>
            </li>
          ))}
        </ul>
      ) : selectedTopic ? (
        <p>No media available for this topic.</p>
      ) : (
        <p>Please select a topic.</p>
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
    image: Object.values(memoryData?.topics || {})
      .find((topic) => topic.photos?.length > 0)?.photos[0]?.url
      ? formatImageUrl(Object.values(memoryData?.topics || {}).find((topic) => topic.photos?.length > 0)?.photos[0]?.url)
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
        <meta name="keywords" content="memory, media, photos, videos, audios, documents, texts" />
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
            Object.values(memoryData?.topics || {}).find((topic) => topic.photos?.length > 0)?.photos[0]?.url
              ? formatImageUrl(
                  Object.values(memoryData?.topics || {}).find((topic) => topic.photos?.length > 0)?.photos[0]?.url,
                )
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
        setInitialData={setInitialData}
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
import '../../../app/globals.css';
import SpinnerIcon from '@/components/complex/spinnerIcon';
import dynamic from 'next/dynamic';
import LoadingMemories from '@/components/complex/loading';
import Head from 'next/head';
import GeneralMold from '@/components/complex/generalMold';
import QRCodeStyling from 'qr-code-styling';
import QRGenerator from '@/components/complex/QRGenerator';
import QRIcon from '@/components/complex/icons/qrIcon';

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
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [videoThumbnails, setVideoThumbnails] = useState({});
  const [initialData, setInitialData] = useState();
  const [uid, setUid] = useState(null);
  const [token, setToken] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const modalRootRef = useRef(null);
  const qrCodeRef = useRef(null);
  const mediaCache = useRef(new Map());
  const thumbnailsCache = useRef(new Map());

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

  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : '';

  const currentPath = router.asPath;
  const qrCodeUrl = userID && memoryName ? `${baseUrl}${currentPath}` : 'https://example.com';

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
    if (previewFolder || selectedMedia || isQrModalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
  }, [previewFolder, selectedMedia, isQrModalOpen]);

  const generateVideoThumbnail = async (url) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.preload = 'metadata';
      video.src = url;
      
      video.onloadeddata = () => {
        video.currentTime = 0.1;
      };

      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
          resolve(thumbnail);
        } else {
          reject(new Error('Canvas context not available'));
        }
      };

      video.onerror = (error) => {
        reject(error);
      };
    });
  };

  const preloadMedia = async () => {
    if (!memoryData) return;

    // Usar topics.general o media como respaldo
    const mediaData = memoryData.topics?.general || memoryData.media || {};

    mediaData.photos?.forEach((photo) => {
      if (!mediaCache.current.has(photo.url)) {
        const img = new Image();
        img.src = formatImageUrl(photo.url);
        img.onload = () => mediaCache.current.set(photo.url, true);
        img.onerror = () => mediaCache.current.set(photo.url, false);
      }
    });

    mediaData.videos?.forEach((video) => {
      if (!mediaCache.current.has(video.url)) {
        const videoEl = document.createElement('video');
        videoEl.preload = 'metadata';
        videoEl.src = video.url;
        videoEl.onloadeddata = () => mediaCache.current.set(video.url, true);
        videoEl.onerror = () => mediaCache.current.set(video.url, false);
        
        if (!thumbnailsCache.current.has(video.url)) {
          generateVideoThumbnail(video.url)
            .then(thumbnail => {
              thumbnailsCache.current.set(video.url, thumbnail);
              setVideoThumbnails(prev => ({ ...prev, [video.url]: thumbnail }));
            })
            .catch(() => {
              thumbnailsCache.current.set(video.url, '/video-placeholder.jpg');
            });
        }
      }
    });

    mediaData.audios?.forEach((audio) => {
      if (!mediaCache.current.has(audio.url)) {
        const audioEl = new Audio();
        audioEl.preload = 'metadata';
        audioEl.src = audio.url;
        audioEl.onloadeddata = () => mediaCache.current.set(audio.url, true);
        audioEl.onerror = () => mediaCache.current.set(audio.url, false);
      }
    });
  };

  useEffect(() => {
    return () => {
      Object.values(videoThumbnails).forEach(URL.revokeObjectURL);
    };
  }, [videoThumbnails]);

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

        // Usar topics.general o media como respaldo
        const mediaSource = mongoData.memory.topics?.general || mongoData.memory.media || {
          photos: [],
          videos: [],
          audios: [],
          documents: [],
          texts: [],
        };

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
            photos: mediaSource.photos || [],
            videos: mediaSource.videos || [],
            audios: mediaSource.audios || [],
            documents: mediaSource.documents || [],
            texts: mediaSource.texts || [],
          },
        };

        console.log(formattedData);
        setMemoryData(formattedData);
        setError(null);
        preloadMedia();
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

  const preloadVideo = (url) => {
    if (!mediaCache.current.has(url)) {
      const video = document.createElement('video');
      video.preload = 'auto';
      video.src = url;
      video.onloadeddata = () => mediaCache.current.set(url, true);
      video.onerror = () => mediaCache.current.set(url, false);
    }
  };

  const handleFolderClick = async (folderName) => {
    setFolderLoadingStates((prev) => ({ ...prev, [folderName]: true }));
    setPreviewFolder(folderName);

    await new Promise((resolve) => setTimeout(resolve, 200));

    if (!folderContents[folderName]) {
      // Usar topics.general o media como respaldo
      const mediaData = memoryData.topics?.general || memoryData.media || {};
      const filesWithCacheStatus = mediaData[folderName]?.map((item) => ({
        url: item.url,
        fileName: item.url.split('/').pop(),
        cached: mediaCache.current.has(item.url),
        metadata: item.metadata,
      })) || [];

      setFolderContents((prev) => ({
        ...prev,
        [folderName]: { files: filesWithCacheStatus, loaded: true },
      }));
    }

    if (folderName === 'videos' && memoryData.topics?.general?.videos?.length > 0) {
      preloadVideo(memoryData.topics.general.videos[0].url);
    } else if (folderName === 'videos' && memoryData.media?.videos?.length > 0) {
      preloadVideo(memoryData.media.videos[0].url);
    }

    setFolderLoadingStates((prev) => ({ ...prev, [folderName]: false }));
  };

  const closeFolderPreview = () => setPreviewFolder(null);

  const handleFileSelect = (url, folderName, index) => {
    const files = folderContents[folderName]?.files || [];
    const mediaTypeMap = { videos: 'video', audios: 'audio', photos: 'image', documents: 'document', texts: 'text' };

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
      qrCodeRef.current.download({ name: `memory-${memoryData?.metadata?.title || 'No title available' || 'qr'}`, extension: 'png' });
    }
  };

  const handleShareQR = async () => {
    if (navigator.share) {
      try {
        const qrBlob = await new Promise((resolve) => {
          qrCodeRef.current.getRawData('png').then((blob) => {
            resolve(blob);
          });
        });

        const qrFile = new File([qrBlob], `memory-qr-${memoryData?.metadata?.title || 'qr'}.png`, {
          type: 'image/png',
        });

        await navigator.share({
          title: memoryData?.metadata?.title || 'Memory Detail',
          text: memoryData?.metadata?.description || 'Check out this memory!',
          url: qrCodeUrl,
          files: [qrFile],
        });
      } catch (err) {
        console.error('Share failed:', err);
        alert('Sharing failed. You can copy the URL: ' + qrCodeUrl);
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
    
    if (folderName === 'photos') {
      return (
        <article
          key={index}
          onClick={() => handleFileSelect(file.url, folderName, index)}
          className={styles.previewItem}
          aria-label={`Open ${file.fileName}`}
        >
          <div className={styles.imagePreview}>
            <img
              src={formattedUrl || '/placeholder-image.jpg'}
              alt={`Preview of ${file.fileName}`}
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </article>
      );
    } else if (folderName === 'videos') {
      const thumbnail = videoThumbnails[file.url] || '/video-placeholder.jpg';
      
      return (
        <article
          key={index}
          onClick={() => handleFileSelect(file.url, folderName, index)}
          className={styles.previewItem}
          aria-label={`Open ${file.fileName}`}
        >
          <div
            className={styles.videoPreview}
            onMouseEnter={() => preloadVideo(file.url)}
          >
            <img
              src={thumbnail}
              alt={`Preview of ${file.fileName}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div className={styles.playIcon}>▶</div>
          </div>
        </article>
      );
    } else if (folderName === 'audios') {
      return (
        <article
          key={index}
          onClick={() => handleFileSelect(file.url, folderName, index)}
          className={styles.previewItem}
          aria-label={`Open ${file.fileName}`}
        >
          <div className={styles.audioPreview}>
            <div className={styles.audioIcon}>🎵</div>
            <span style={{ color: 'white' }}>{file.fileName}</span>
          </div>
        </article>
      );
    } else {
      return (
        <article
          key={index}
          onClick={() => handleFileSelect(file.url, folderName, index)}
          className={styles.previewItem}
          aria-label={`Open ${file.fileName}`}
        >
          <div className={styles.filePreview}>
            <span>{file.fileName}</span>
          </div>
        </article>
      );
    }
  };

  const foldersWithContent = memoryData
    ? Object.keys(memoryData.topics?.general || memoryData.media || {}).filter(
        (folderName) => (memoryData.topics?.general?.[folderName] || memoryData.media?.[folderName])?.length > 0
      )
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
            <button style={{backgroundColor: '#66666600', border: 'none', width: '40px'}}  onClick={() => setIsQrModalOpen(true)} aria-label="Open QR Code">
              <QRIcon size={30} onClick={() => setIsQrModalOpen(true)}/>
            </button>
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
              <button onClick={closeFolderPreview} className={'closeButton'}>
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
              <button onClick={closeMediaPlayer} className={'closeButton'}>
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

        {isQrModalOpen && ReactDOM.createPortal(
          <div className={styles.modalOverlay} onClick={() => setIsQrModalOpen(false)}>
            <div 
              className={styles.modalContentMemories} 
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => setIsQrModalOpen(false)} className={'closeButton'}>
                ×
              </button>
              <h2 className={styles.previewTitle}>Share this Memory</h2>
              <div className={styles.qrCodeWrapper}>
                <div>
                    <QRGenerator
                      value={qrCodeUrl}
                      dotsColor="#000000"
                      bgColor="#ffffff"
                      dotsType="rounded"
                      cornersType="extra-rounded"
                    />
                  <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%'}}>
                    <button className={'button2'} onClick={handleDownloadQR}>
                      Download
                    </button>
                    <button className={'button2'} onClick={handleShareQR}>
                      Share
                    </button>
                  </div>
                </div>
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
                    {(memoryData.topics?.general?.[folderName] || memoryData.media?.[folderName])?.length || 0}{' '}
                    {(memoryData.topics?.general?.[folderName] || memoryData.media?.[folderName])?.length === 1 ? 'item' : 'items'}
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
    image: memoryData?.topics?.general?.photos?.[0]?.url || memoryData?.media?.photos?.[0]?.url
      ? formatImageUrl(memoryData.topics?.general?.photos?.[0]?.url || memoryData.media?.photos?.[0]?.url)
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
        <meta name="keywords" content="memory, media, photos, videos, audios, documents, texts" />
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
            memoryData?.topics?.general?.photos?.[0]?.url || memoryData?.media?.photos?.[0]?.url
              ? formatImageUrl(memoryData.topics?.general?.photos?.[0]?.url || memoryData.media?.photos?.[0]?.url)
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
        setInitialData={setInitialData}
        setUidChild={setUid}
        setTokenChild={setToken}
        setUserEmailChild={setUserEmail}
      />
      {renderModals()}
    </>
  );
};

export default MemoryDetail;*/








