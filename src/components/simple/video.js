/*import React, { useEffect, useRef, useState, useCallback } from 'react';
import '../../estilos/music/video.css';
import TogglePlayPause from '../complex/TogglePlayPause';
import DownloadIcon from '../complex/downloadIcon';
import HeartIcon from '../complex/heartIcon';
import ShuffleButton from '../complex/ShuffleButton';
import RepeatButton from '../complex/RepeatButton';
import NextBeforeIcon from '../complex/nextBeforeIcon';
import QualityIcon from '../complex/ToggleIcon';
import ToggleMute from '../complex/ToggleMute';
import RangeInput from '../complex/rangeInput';
import SpinnerIcon from '../complex/spinnerIcon';

const Video = ({
  srcs = [],
  currentIndex = 0,
  setCurrentIndex,
  setCurrentTimeMedia,
  currentTimeMedia = 0,
  setVolumeMedia,
  volumeMedia = 1,
  setIsMutedMedia,
  isMutedMedia = false,
  setIsRepeatMedia,
  isRepeatMedia = false,
  setIsLike,
  isLike = false,
  setIsLoadingMedia,
  isHybridView,
  showComponent,
  setShowComponent,
  content,
  buttonColor = 'white'
}) => {
  // Referencias
  const videoRef = useRef(null);
  const videoContainerRef = useRef(null);
  const timeoutRef = useRef(null);
  
  // Estados del reproductor
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [isShuffle, setIsShuffle] = useState(false);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [quality, setQuality] = useState('auto');
  const [isHovering, setIsHovering] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [autoPlayNext, setAutoPlayNext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados para el fondo difuminado
  const [blurredBackground, setBlurredBackground] = useState(null);
  const [bgUpdateInterval, setBgUpdateInterval] = useState(null);

  // Genera el fondo difuminado a partir del frame actual del video
  const updateBlurredBackground = useCallback(() => {
    try {
      if (!videoRef.current || videoRef.current.readyState < 2) return;
      
      const canvas = document.createElement('canvas');
      const video = videoRef.current;
      
      // Tamaño reducido para mejor rendimiento (16:9 aspect ratio)
      const width = 160;
      const height = 90;
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      
      // Dibuja el frame actual en el canvas
      ctx.drawImage(video, 0, 0, width, height);
      
      // Aplica efectos al frame
      ctx.filter = 'blur(15px) brightness(0.6)';
      ctx.drawImage(canvas, 0, 0, width, height);
      
      // Guarda como URL de imagen
      setBlurredBackground(canvas.toDataURL());
    } catch (error) {
      console.error('Error generando fondo difuminado:', error);
      setBlurredBackground(null);
    }
  }, []);

  // Configura el intervalo para actualizar el fondo
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(updateBlurredBackground, 1000); // Actualiza cada segundo
      setBgUpdateInterval(interval);
      return () => clearInterval(interval);
    } else {
      if (bgUpdateInterval) clearInterval(bgUpdateInterval);
    }
  }, [isPlaying, updateBlurredBackground]);

  // Efecto para manejar interacciones y detectar dispositivos móviles
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkIsMobile();

    const container = videoContainerRef.current;
    if (!container) return;

    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => setIsHovering(false);
    const handleMouseMove = () => showControls();
    const handleTouchStart = () => {
      setIsHovering(true);
      showControls();
    };
    const handleTouchEnd = () => {
      setIsHovering(false);
      if (!isMobile) return;
      showControls();
    };

    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile]);

  // Efecto para manejar cambios de fuente del video
  useEffect(() => {
    if (videoRef.current && srcs.length > 0) {
      const handleCanPlay = () => {
        if (!videoRef.current) return;
        updateBlurredBackground();
      };

      const handleSourceChange = () => {
        if (videoRef.current.src !== srcs[currentIndex]) {
          setIsLoading(true);
          videoRef.current.src = srcs[currentIndex];
        }
      };

      videoRef.current.addEventListener('canplay', handleCanPlay);
      videoRef.current.addEventListener('loadeddata', updateBlurredBackground);
      videoRef.current.addEventListener('waiting', () => setIsLoading(true));
      videoRef.current.addEventListener('playing', () => setIsLoading(false));
      
      handleSourceChange();

      return () => {
        videoRef.current?.removeEventListener('canplay', handleCanPlay);
        videoRef.current?.removeEventListener('loadeddata', updateBlurredBackground);
        videoRef.current?.removeEventListener('waiting', () => setIsLoading(true));
        videoRef.current?.removeEventListener('playing', () => setIsLoading(false));
      };
    }
  }, [srcs, currentIndex, updateBlurredBackground]);

  // Funciones del reproductor
  const playVideo = () => {
    if (srcs.length === 0) return;
    
    videoRef.current?.play()
      .then(() => setIsPlaying(true))
      .catch(error => console.error('Error al reproducir:', error));
  };

  const togglePlayPause = (e) => {
    e?.stopPropagation();
    if (isPlaying) {
      videoRef.current?.pause();
      setIsPlaying(false);
    } else {
      playVideo();
    }
    showControls();
  };

  const handleEnded = () => {
    setIsPlaying(false);
    
    if (isRepeatMedia) {
      videoRef.current.currentTime = 0;
      playVideo();
    } else if (srcs.length > 1) {
      handleNextVideo();
    }
    setCurrentTimeMedia(0);
  };

  const handleNextVideo = (e) => {
    e?.stopPropagation();
    if (srcs.length === 0) return;
    
    const nextIndex = isShuffle 
      ? Math.floor(Math.random() * srcs.length)
      : (currentIndex + 1) % srcs.length;
    
    if (nextIndex === currentIndex) {
      videoRef.current.currentTime = 0;
      playVideo();
    } else {
      setCurrentIndex(nextIndex);
      setCurrentTimeMedia(0);
      setAutoPlayNext(true);
    }
  };

  const handlePreviousVideo = (e) => {
    e?.stopPropagation();
    if (srcs.length === 0) return;
    
    const prevIndex = (currentIndex - 1 + srcs.length) % srcs.length;
    setCurrentIndex(prevIndex);
    setCurrentTimeMedia(0);
    setAutoPlayNext(true);
  };

  const handleLoadedMetadata = () => {
    setDuration(videoRef.current.duration);
    setIsLoadingMedia?.(false);
    setIsLoading(false);
    
    if (autoPlayNext) {
      playVideo();
      setAutoPlayNext(false);
    }
  };

  const showControls = () => {
    setIsControlsVisible(true);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (!isHovering) {
        setIsControlsVisible(false);
      }
    }, 5000);
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const toggleShuffle = (e) => {
    e?.stopPropagation();
    if (isRepeatMedia) {
      setIsRepeatMedia(false);
    }
    setIsShuffle(!isShuffle);
    showControls();
  };

  const toggleRepeat = (e) => {
    e?.stopPropagation();
    if (isShuffle) {
      setIsShuffle(false);
    }
    setIsRepeatMedia(!isRepeatMedia);
    showControls();
  };

  const toggleMute = (e) => {
    e?.stopPropagation();
    videoRef.current.muted = !isMutedMedia;
    setIsMutedMedia(!isMutedMedia);
    showControls();
  };

  const handleQualityChange = (newQuality, e) => {
    e?.stopPropagation();
    setQuality(newQuality);
    setShowQualityModal(false);
    showControls();
  };

  const handleSeek = (newTime) => {
    videoRef.current.currentTime = newTime;
    setCurrentTimeMedia(newTime);
    showControls();
  };

  const handleVolumeChange = (newVolume) => {
    setVolumeMedia(newVolume);
    videoRef.current.volume = newVolume;
    if (isMutedMedia && newVolume > 0) setIsMutedMedia(false);
    showControls();
  };

  const handleDownload = async (e) => {
    e?.stopPropagation();
    const currentSrc = srcs[currentIndex];
    if (!currentSrc) return;
  
    try {
      const response = await fetch(currentSrc);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const fileName = currentSrc.split('/').pop().split('?')[0] || `video-${Date.now()}.mp4`;
  
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', decodeURIComponent(fileName));
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al descargar:', error);
      window.open(currentSrc, '_blank');
    }
  };

  const toggleLike = (e) => {
    e?.stopPropagation();
    setIsLike(!isLike);
    showControls();
  };

  return (
    <div 
      ref={videoContainerRef}
      className="video-player-container"
      onClick={(e) => {
        if (e.target === videoContainerRef.current || e.target === videoRef.current) {
          togglePlayPause(e);
        }
        showControls();
      }}
    >
      
      {blurredBackground && (
        <div 
          className="video-blur-background"
          style={{ backgroundImage: `url(${blurredBackground})` }}
        />
      )}
      
      
      <div className="video-dark-overlay" />
      
      
      {srcs.length > 0 && (
        <video
          ref={videoRef}
          className="main-video-element"
          src={srcs[currentIndex]}
          crossOrigin="anonymous"  
          onEnded={handleEnded}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={() => setCurrentTimeMedia(videoRef.current?.currentTime || 0)}
          onLoadStart={() => {
            setIsLoading(true);
            setIsLoadingMedia?.(true);
          }}
          onWaiting={() => {
            setIsLoading(true);
            setIsLoadingMedia?.(true);
          }}
          onPlaying={() => {
            setIsLoading(false);
            setIsLoadingMedia?.(false);
          }}
          muted={isMutedMedia}
          loop={isRepeatMedia}
        />
      )}

      
      {isLoading && (
        <div className="loading-overlay">
          <SpinnerIcon size={40} />
        </div>
      )}

      
      <div className={`video-controls ${isControlsVisible ? 'visible' : ''}`}>
       
        <div className="progress-container">
          <span className="time-display">
            {formatTime(currentTimeMedia)}
          </span>

          <div className="progress-bar">
            <RangeInput
              min={0}
              max={duration || 100}
              value={currentTimeMedia}
              onChange={handleSeek}
              progressColor="backgroundColor4"
              trackColor="backgroundColor5"
              showLabel={false}
            />
          </div>

          <span className="time-display">
            {formatTime(duration)}
          </span>

          
          <div className="volume-controls">
            <ToggleMute
              size={20}
              isMuted={isMutedMedia}
              onToggle={toggleMute}
              buttonColor="white"
            />
            <RangeInput
              min={0}
              max={1}
              step={0.01}
              value={isMutedMedia ? 0 : volumeMedia}
              onChange={handleVolumeChange}
              progressColor="backgroundColor4"
              trackColor="backgroundColor5"
              showLabel={false}
              style={{ width: isMobile ? '60px' : '80px' }}
            />
          </div>
        </div>

        
        <div className="media-controls">
          <div className="left-controls">
            <HeartIcon 
              size={20}
              onClickFunction={toggleLike}
              defaultLike={isLike}
            />
            
            <DownloadIcon 
              size={20}
              onToggle={handleDownload}
            />
          </div>

          <div className="center-controls">
            <ShuffleButton
              buttonColor="white"
              isShuffle={isShuffle}
              toggleShuffle={toggleShuffle}
              size={20}
            />

            <NextBeforeIcon 
              size={20}
              direction="left"
              onToggle={handlePreviousVideo}
            />
            
            <TogglePlayPause
              size={24}
              isPlaying={isPlaying}
              onToggle={togglePlayPause}
            />
            
            <NextBeforeIcon 
              size={20}
              direction="right"
              onToggle={handleNextVideo}
            />

            <RepeatButton
              buttonColor="white"
              isRepeat={isRepeatMedia}
              toggleRepeat={toggleRepeat}
              size={20}
            />
          </div>

          <div className="right-controls">
            <QualityIcon 
              size={20}
              onClick={() => setShowQualityModal(true)}
            />
          </div>
        </div>
      </div>

      
      {showQualityModal && (
        <div className="quality-modal">
          <h4>Calidad</h4>
          {['auto', '720p', '480p', '360p'].map((q) => (
            <div 
              key={q}
              className={`quality-option ${quality === q ? 'active' : ''}`}
              onClick={(e) => handleQualityChange(q, e)}
            >
              {q}
            </div>
          ))}
        </div>
      )}

      
      <div className={`center-play-button ${isControlsVisible ? 'visible' : ''}`}>
        <TogglePlayPause
          size={40}
          isPlaying={isPlaying}
          onToggle={togglePlayPause}
        />
      </div>
    </div>
  );
};

export default Video;*/




import React, { useEffect, useRef, useState, useCallback } from 'react';
import '../../estilos/music/video.css';
import TogglePlayPause from '../complex/TogglePlayPause';
import DownloadIcon from '../complex/downloadIcon';
import HeartIcon from '../complex/icons/heartIcon';
import ShuffleButton from '../complex/ShuffleButton';
import RepeatButton from '../complex/RepeatButton';
import NextBeforeIcon from '../complex/nextBeforeIcon';
import QualityIcon from '../complex/ToggleIcon';
import ToggleMute from '../complex/ToggleMute';
import RangeInput from '../complex/rangeInput';
import SpinnerIcon from '../complex/spinnerIcon';
import CommentsIcon from '../complex/icons/commentsIcon'; // Import CommentsIcon
import Modal from '../complex/modal'; // Import Modal for comments
import Comments from '../complex/comments'; // Import Comments component

const Video = ({
  srcs = [],
  currentIndex = 0,
  setCurrentIndex,
  setCurrentTimeMedia,
  currentTimeMedia = 0,
  setVolumeMedia,
  volumeMedia = 1,
  setIsMutedMedia,
  isMutedMedia = false,
  setIsRepeatMedia,
  isRepeatMedia = false,
  setIsLike,
  isLike = false,
  setIsLoadingMedia,
  isHybridView,
  showComponent,
  setShowComponent,
  content,
  buttonColor = 'white',
  commentsData = [], // Comments for the current video
  userId = null, // User email for comment authorship
  userEmail = null,
  memoryId = null, // Memory ID for endpoint
  token = null, // Firebase auth token
  uid = null, // Firebase user UID
  fileId = '', // Current video URL for comment association
  onCommentAdded = () => {}, // Callback to notify parent of new comments
}) => {
  // Referencias
  const videoRef = useRef(null);
  const videoContainerRef = useRef(null);
  const timeoutRef = useRef(null);

  // Estados del reproductor
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [isShuffle, setIsShuffle] = useState(false);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [quality, setQuality] = useState('auto');
  const [isHovering, setIsHovering] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [autoPlayNext, setAutoPlayNext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [commentsModalOpen, setCommentsModalOpen] = useState(false); // State for comments modal

  // Estados para el fondo difuminado
  const [blurredBackground, setBlurredBackground] = useState(null);
  const [bgUpdateInterval, setBgUpdateInterval] = useState(null);

  // Genera el fondo difuminado a partir del frame actual del video
  const updateBlurredBackground = useCallback(() => {
    try {
      if (!videoRef.current || videoRef.current.readyState < 2) return;

      const canvas = document.createElement('canvas');
      const video = videoRef.current;

      // Tamaño reducido para mejor rendimiento (16:9 aspect ratio)
      const width = 160;
      const height = 90;

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');

      // Dibuja el frame actual en el canvas
      ctx.drawImage(video, 0, 0, width, height);

      // Aplica efectos al frame
      ctx.filter = 'blur(15px) brightness(0.6)';
      ctx.drawImage(canvas, 0, 0, width, height);

      // Guarda como URL de imagen
      setBlurredBackground(canvas.toDataURL());
    } catch (error) {
      console.error('Error generando fondo difuminado:', error);
      setBlurredBackground(null);
    }
  }, []);

  // Configura el intervalo para actualizar el fondo
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(updateBlurredBackground, 1000);
      setBgUpdateInterval(interval);
      return () => clearInterval(interval);
    } else {
      if (bgUpdateInterval) clearInterval(bgUpdateInterval);
    }
  }, [isPlaying, updateBlurredBackground]);

  // Efecto para manejar interacciones y detectar dispositivos móviles
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkIsMobile();

    const container = videoContainerRef.current;
    if (!container) return;

    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => setIsHovering(false);
    const handleMouseMove = () => showControls();
    const handleTouchStart = () => {
      setIsHovering(true);
      showControls();
    };
    const handleTouchEnd = () => {
      setIsHovering(false);
      if (!isMobile) return;
      showControls();
    };

    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile]);

  // Efecto para manejar cambios de fuente del video
  useEffect(() => {
    if (videoRef.current && srcs.length > 0) {
      const handleCanPlay = () => {
        if (!videoRef.current) return;
        updateBlurredBackground();
      };

      const handleSourceChange = () => {
        if (videoRef.current.src !== srcs[currentIndex]) {
          setIsLoading(true);
          videoRef.current.src = srcs[currentIndex];
        }
      };

      videoRef.current.addEventListener('canplay', handleCanPlay);
      videoRef.current.addEventListener('loadeddata', updateBlurredBackground);
      videoRef.current.addEventListener('waiting', () => setIsLoading(true));
      videoRef.current.addEventListener('playing', () => setIsLoading(false));

      handleSourceChange();

      return () => {
        videoRef.current?.removeEventListener('canplay', handleCanPlay);
        videoRef.current?.removeEventListener('loadeddata', updateBlurredBackground);
        videoRef.current?.removeEventListener('waiting', () => setIsLoading(true));
        videoRef.current?.removeEventListener('playing', () => setIsLoading(false));
      };
    }
  }, [srcs, currentIndex, updateBlurredBackground]);

  // Funciones del reproductor
  const playVideo = () => {
    if (srcs.length === 0) return;

    videoRef.current?.play()
      .then(() => setIsPlaying(true))
      .catch(error => console.error('Error al reproducir:', error));
  };

  const togglePlayPause = (e) => {
    e?.stopPropagation();
    if (isPlaying) {
      videoRef.current?.pause();
      setIsPlaying(false);
    } else {
      playVideo();
    }
    showControls();
  };

  const handleEnded = () => {
    setIsPlaying(false);

    if (isRepeatMedia) {
      videoRef.current.currentTime = 0;
      playVideo();
    } else if (srcs.length > 1) {
      handleNextVideo();
    }
    setCurrentTimeMedia(0);
  };

  const handleNextVideo = (e) => {
    e?.stopPropagation();
    if (srcs.length === 0) return;

    const nextIndex = isShuffle
      ? Math.floor(Math.random() * srcs.length)
      : (currentIndex + 1) % srcs.length;

    if (nextIndex === currentIndex) {
      videoRef.current.currentTime = 0;
      playVideo();
    } else {
      setCurrentIndex(nextIndex);
      setCurrentTimeMedia(0);
      setAutoPlayNext(true);
    }
  };

  const handlePreviousVideo = (e) => {
    e?.stopPropagation();
    if (srcs.length === 0) return;

    const prevIndex = (currentIndex - 1 + srcs.length) % srcs.length;
    setCurrentIndex(prevIndex);
    setCurrentTimeMedia(0);
    setAutoPlayNext(true);
  };

  const handleLoadedMetadata = () => {
    setDuration(videoRef.current.duration);
    setIsLoadingMedia?.(false);
    setIsLoading(false);

    if (autoPlayNext) {
      playVideo();
      setAutoPlayNext(false);
    }
  };

  const showControls = () => {
    setIsControlsVisible(true);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (!isHovering && !commentsModalOpen) { // Keep controls visible if comments modal is open
        setIsControlsVisible(false);
      }
    }, 5000);
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const toggleShuffle = (e) => {
    e?.stopPropagation();
    if (isRepeatMedia) {
      setIsRepeatMedia(false);
    }
    setIsShuffle(!isShuffle);
    showControls();
  };

  const toggleRepeat = (e) => {
    e?.stopPropagation();
    if (isShuffle) {
      setIsShuffle(false);
    }
    setIsRepeatMedia(!isRepeatMedia);
    showControls();
  };

  const toggleMute = (e) => {
    e?.stopPropagation();
    videoRef.current.muted = !isMutedMedia;
    setIsMutedMedia(!isMutedMedia);
    showControls();
  };

  const handleQualityChange = (newQuality, e) => {
    e?.stopPropagation();
    setQuality(newQuality);
    setShowQualityModal(false);
    showControls();
  };

  const handleSeek = (newTime) => {
    videoRef.current.currentTime = newTime;
    setCurrentTimeMedia(newTime);
    showControls();
  };

  const handleVolumeChange = (newVolume) => {
    setVolumeMedia(newVolume);
    videoRef.current.volume = newVolume;
    if (isMutedMedia && newVolume > 0) setIsMutedMedia(false);
    showControls();
  };

  const handleDownload = async (e) => {
    e?.stopPropagation();
    const currentSrc = srcs[currentIndex];
    if (!currentSrc) return;

    try {
      const response = await fetch(currentSrc);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const fileName = currentSrc.split('/').pop().split('?')[0] || `video-${Date.now()}.mp4`;

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', decodeURIComponent(fileName));
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al descargar:', error);
      window.open(currentSrc, '_blank');
    }
  };

  const toggleLike = (e) => {
    e?.stopPropagation();
    setIsLike(!isLike);
    showControls();
  };

  // Opens the comments modal
  const openCommentsModal = (e) => {
    e?.stopPropagation();
    setCommentsModalOpen(true);
    showControls();
  };

  // Closes the comments modal
  const closeCommentsModal = () => {
    setCommentsModalOpen(false);
    showControls();
  };

  // Handles new comment addition and notifies parent
  const handleCommentAdded = (newComment) => {
    onCommentAdded(currentIndex, newComment);
  };

  return (
    <div
      ref={videoContainerRef}
      className="video-player-container"
      onClick={(e) => {
        if (e.target === videoContainerRef.current || e.target === videoRef.current) {
          togglePlayPause(e);
        }
        showControls();
      }}
    >
      {/* Fondo difuminado */}
      {blurredBackground && (
        <div
          className="video-blur-background"
          style={{ backgroundImage: `url(${blurredBackground})` }}
        />
      )}

      {/* Capa oscura para mejorar contraste */}
      <div className="video-dark-overlay" />

      {/* Video principal */}
      {srcs.length > 0 && (
        <video
          ref={videoRef}
          className="main-video-element"
          src={srcs[currentIndex]}
          crossOrigin="anonymous"
          onEnded={handleEnded}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={() => setCurrentTimeMedia(videoRef.current?.currentTime || 0)}
          onLoadStart={() => {
            setIsLoading(true);
            setIsLoadingMedia?.(true);
          }}
          onWaiting={() => {
            setIsLoading(true);
            setIsLoadingMedia?.(true);
          }}
          onPlaying={() => {
            setIsLoading(false);
            setIsLoadingMedia?.(false);
          }}
          muted={isMutedMedia}
          loop={isRepeatMedia}
        />
      )}

      {/* Spinner de carga */}
      {isLoading && (
        <div className="loading-overlay">
          <SpinnerIcon size={40} />
        </div>
      )}

      {/* Controles del reproductor */}
      <div className={`video-controls ${isControlsVisible ? 'visible' : ''}`}>
        {/* Barra de progreso */}
        <div className="progress-container">
          <span className="time-display">{formatTime(currentTimeMedia)}</span>

          <div className="progress-bar">
            <RangeInput
              min={0}
              max={duration || 100}
              value={currentTimeMedia}
              onChange={handleSeek}
              progressColor="backgroundColor4"
              trackColor="backgroundColor5"
              showLabel={false}
            />
          </div>

          <span className="time-display">{formatTime(duration)}</span>

          {/* Controles de volumen */}
          <div className="volume-controls">
            <ToggleMute
              size={20}
              isMuted={isMutedMedia}
              onToggle={toggleMute}
              buttonColor="white"
            />
            <RangeInput
              min={0}
              max={1}
              step={0.01}
              value={isMutedMedia ? 0 : volumeMedia}
              onChange={handleVolumeChange}
              progressColor="backgroundColor4"
              trackColor="backgroundColor5"
              showLabel={false}
              style={{ width: isMobile ? '60px' : '80px' }}
            />
          </div>
        </div>

        {/* Controles principales */}
        <div className="media-controls">
          <div className="left-controls">
            <HeartIcon size={20} onClickFunction={toggleLike} defaultLike={isLike} />
            <DownloadIcon size={20} onToggle={handleDownload} />
            <CommentsIcon size={20} onClick={openCommentsModal} /> {/* Add CommentsIcon */}
          </div>

          <div className="center-controls">
            <ShuffleButton
              buttonColor="white"
              isShuffle={isShuffle}
              toggleShuffle={toggleShuffle}
              size={20}
            />
            <NextBeforeIcon size={20} direction="left" onToggle={handlePreviousVideo} />
            <TogglePlayPause size={24} isPlaying={isPlaying} onToggle={togglePlayPause} />
            <NextBeforeIcon size={20} direction="right" onToggle={handleNextVideo} />
            <RepeatButton
              buttonColor="white"
              isRepeat={isRepeatMedia}
              toggleRepeat={toggleRepeat}
              size={20}
            />
          </div>

          <div className="right-controls">
            <QualityIcon size={20} onClick={() => setShowQualityModal(true)} />
          </div>
        </div>
      </div>

      {/* Modal de calidad */}
      {showQualityModal && (
        <div className="quality-modal">
          <h4>Calidad</h4>
          {['auto', '720p', '480p', '360p'].map((q) => (
            <div
              key={q}
              className={`quality-option ${quality === q ? 'active' : ''}`}
              onClick={(e) => handleQualityChange(q, e)}
            >
              {q}
            </div>
          ))}
        </div>
      )}

      {/* Modal de comentarios */}
      <Modal isOpen={commentsModalOpen} onClose={closeCommentsModal}>
        <div className="comments-container">
          <Comments
            commentsData={commentsData}
            userId={userId}
            userEmail={userEmail}
            memoryId={memoryId}
            token={token}
            uid={uid}
            root="files" // Set to "files" for file-specific comments
            fileId={fileId}
            onCommentAdded={handleCommentAdded}
            currentIndex={currentIndex}
          />
        </div>
      </Modal>

      {/* Botón central de play/pause */}
      <div className={`center-play-button ${isControlsVisible ? 'visible' : ''}`}>
        <TogglePlayPause size={40} isPlaying={isPlaying} onToggle={togglePlayPause} />
      </div>
    </div>
  );
};

export default Video;



