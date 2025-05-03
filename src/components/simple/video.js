import React, { useEffect, useRef, useState } from 'react';

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
  const videoRef = useRef(null);
  const videoContainerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });
  const timeoutRef = useRef(null);
  const [isShuffle, setIsShuffle] = useState(false);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [quality, setQuality] = useState('auto');
  const [isHovering, setIsHovering] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [autoPlayNext, setAutoPlayNext] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsMobile(isTouchDevice);
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

  useEffect(() => {
    if (videoRef.current && srcs.length > 0) {
      const handleCanPlay = () => {
        const { videoWidth, videoHeight } = videoRef.current;
        setVideoDimensions({ width: videoWidth, height: videoHeight });
      };
      videoRef.current.addEventListener('canplay', handleCanPlay);
      return () => {
        videoRef.current?.removeEventListener('canplay', handleCanPlay);
      };
    }
  }, [srcs, currentIndex]);

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
    
    // Si es el mismo video (puede pasar en shuffle)
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
    
    // Reproducir automáticamente cuando está listo
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
      style={{ 
        position: 'relative', 
        width: '100%', 
        height: '100%', 
        overflow: 'hidden',
        backgroundColor: '#000'
      }}
      onClick={(e) => {
        if (e.target === videoContainerRef.current || e.target === videoRef.current) {
          togglePlayPause(e);
        }
        showControls();
      }}
    >
      {srcs.length > 0 && (
        <video
          ref={videoRef}
          src={srcs[currentIndex]}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
          onEnded={handleEnded}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={() => setCurrentTimeMedia(videoRef.current?.currentTime || 0)}
          onLoadStart={() => setIsLoadingMedia?.(true)}
          onWaiting={() => setIsLoadingMedia?.(true)}
          onPlaying={() => setIsLoadingMedia?.(false)}
          muted={isMutedMedia}
          loop={isRepeatMedia}
        />
      )}

      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
        padding: '10px 15px',
        opacity: isControlsVisible ? 1 : 0,
        transition: 'opacity 0.3s ease',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%'
        }}>
          <span style={{ 
            color: 'white', 
            fontSize: '12px',
            minWidth: '40px',
            fontFamily: 'Arial, sans-serif'
          }}>
            {formatTime(currentTimeMedia)}
          </span>

          <div style={{ 
            flex: 1,
            margin: '0 10px'
          }}>
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

          <span style={{ 
            color: 'white', 
            fontSize: '12px',
            minWidth: '40px',
            fontFamily: 'Arial, sans-serif',
            textAlign: 'right'
          }}>
            {formatTime(duration)}
          </span>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '5px',
            marginLeft: '15px',
            width: isMobile ? '30%' : 'auto'
          }}>
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

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: '15px'
          }}>
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

          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: '15px'
          }}>
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

          <div>
            <QualityIcon 
              size={20}
              onClick={() => setShowQualityModal(true)}
            />
          </div>
        </div>
      </div>

      {showQualityModal && (
        <div style={{
          position: 'absolute',
          bottom: '120px',
          right: '20px',
          backgroundColor: 'rgba(30, 30, 30, 0.9)',
          padding: '15px',
          borderRadius: '8px',
          zIndex: 20,
          border: '1px solid #444'
        }}>
          <h4 style={{ 
            color: 'white', 
            margin: '0 0 10px 0',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            Calidad
          </h4>
          {['auto', '720p', '480p', '360p'].map((q) => (
            <div 
              key={q}
              style={{
                color: quality === q ? '#1DB954' : 'white',
                padding: '8px 0',
                cursor: 'pointer',
                fontSize: '13px',
                borderBottom: '1px solid #333'
              }}
              onClick={(e) => handleQualityChange(q, e)}
            >
              {q}
            </div>
          ))}
        </div>
      )}

      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        opacity: isControlsVisible ? 1 : 0,
        transition: 'opacity 0.3s ease',
        zIndex: 5
      }}>
        <TogglePlayPause
          size={40}
          isPlaying={isPlaying}
          onToggle={togglePlayPause}
        />
      </div>
    </div>
  );
};

export default Video;



