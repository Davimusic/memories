'use client';
import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import '../../estilos/general/general.css'
import '../../estilos/general/audioPlayer.css'















export default function AudioPlayer({ audioFiles = [], currentIndex = 0 }) {
    console.log(audioFiles);
    
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(currentIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioBuffers, setAudioBuffers] = useState([]);
  const [isSeeking, setIsSeeking] = useState(false);
  
  const audioContextRef = useRef(null);
  const gainNodeRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const startTimeRef = useRef(0);
  const pauseTimeRef = useRef(0);
  const repeatRef = useRef(isRepeat);
  const seekTimeRef = useRef(0);

  const getDisplayName = (fileName) => {
    if (!fileName) return 'audio-file';
    
    try {
      const cleanName = fileName.split('?')[0];
      const decoded = decodeURIComponent(cleanName)
                       .split('_')
                       .pop()
                       .split('/')
                       .pop();
      return decoded.replace(/\.[^/.]+$/, "");
    } catch (error) {
      console.error('Error procesando nombre de archivo:', error);
      return 'audio-file';
    }
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !audioFiles.length) return;

    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    gainNodeRef.current = audioContextRef.current.createGain();
    gainNodeRef.current.connect(audioContextRef.current.destination);

    const loadBuffers = async () => {
      setIsLoading(true);
      try {
        const buffers = await Promise.all(
          audioFiles.map(async (file) => {
            try {
              const response = await fetch(file.src, {
                mode: 'cors',
                headers: new Headers({
                  'Origin': window.location.origin
                })
              });
              
              if (!response.ok) {
                console.error(`Error ${response.status} cargando: ${file.src}`);
                return null;
              }
              
              const arrayBuffer = await response.arrayBuffer();
              return await audioContextRef.current.decodeAudioData(arrayBuffer);
            } catch (error) {
              console.error('Error loading audio:', file.src, error);
              return null;
            }
          })
        );
        setAudioBuffers(buffers.filter(Boolean));
      } catch (error) {
        console.error('Error loading buffers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBuffers();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [audioFiles, isClient]);

  useEffect(() => {
    repeatRef.current = isRepeat;
  }, [isRepeat]);

  useEffect(() => {
    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.setValueAtTime(
        isMuted ? 0 : volume,
        audioContextRef.current.currentTime
      );
    }
  }, [volume, isMuted]);

  useEffect(() => {
    let animationFrameId;

    const updateProgress = () => {
      if (sourceNodeRef.current && !isSeeking && audioContextRef.current) {
        const elapsed = audioContextRef.current.currentTime - startTimeRef.current;
        const current = pauseTimeRef.current + elapsed;
        
        setCurrentTime(current);
        setProgress((current / duration) * 100);
        
        if (current >= duration - 0.1) {
          handleTrackEnd();
        }
        
        animationFrameId = requestAnimationFrame(updateProgress);
      }
    };

    if (isPlaying) {
      animationFrameId = requestAnimationFrame(updateProgress);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, duration, isSeeking]);

  useEffect(() => {
    if (audioBuffers[currentTrackIndex]) {
      setDuration(audioBuffers[currentTrackIndex].duration);
      pauseTimeRef.current = 0;
      setCurrentTime(0);
      setProgress(0);
      
      if (isPlaying) {
        playFromPosition(0);
      }
    }
  }, [currentTrackIndex, audioBuffers]);

  useEffect(() => {
    const handleMouseUp = () => {
      if (isSeeking) {
        setIsSeeking(false);
        pauseTimeRef.current = seekTimeRef.current;
        
        if (isPlaying) {
          playFromPosition(seekTimeRef.current);
        }
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [isSeeking, isPlaying]);

  const handleTrackEnd = () => {
    if (repeatRef.current) {
      setCurrentTime(0);
      setProgress(0);
      playFromPosition(0);
    } else {
      handleNext();
    }
  };

  const playFromPosition = (position) => {
    if (!audioContextRef.current || !audioBuffers[currentTrackIndex]) return;
    
    stopCurrentSource();

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffers[currentTrackIndex];
    source.connect(gainNodeRef.current);
    
    source.onended = () => {
      handleTrackEnd();
    };

    startTimeRef.current = audioContextRef.current.currentTime;
    pauseTimeRef.current = position;
    source.start(0, position);
    
    sourceNodeRef.current = source;
    setIsPlaying(true);
    setDuration(audioBuffers[currentTrackIndex].duration);
  };

  const stopCurrentSource = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.onended = null;
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
  };

  const handlePlayPause = async () => {
    if (!audioContextRef.current) return;

    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    if (isPlaying) {
      pauseTimeRef.current += audioContextRef.current.currentTime - startTimeRef.current;
      stopCurrentSource();
      setIsPlaying(false);
    } else {
      playFromPosition(pauseTimeRef.current);
    }
  };
  
  const handleNext = () => {
    if (audioFiles.length === 0) return;
    
    let newIndex;
    if (isShuffle) {
      do {
        newIndex = Math.floor(Math.random() * audioFiles.length);
      } while (newIndex === currentTrackIndex && audioFiles.length > 1);
    } else {
      newIndex = (currentTrackIndex + 1) % audioFiles.length;
    }
    setCurrentTrackIndex(newIndex);
    if (isPlaying) playFromPosition(0);
  };

  const handlePrevious = () => {
    if (audioFiles.length === 0) return;
    
    let newIndex;
    if (isShuffle) {
      do {
        newIndex = Math.floor(Math.random() * audioFiles.length);
      } while (newIndex === currentTrackIndex && audioFiles.length > 1);
    } else {
      newIndex = (currentTrackIndex - 1 + audioFiles.length) % audioFiles.length;
    }
    setCurrentTrackIndex(newIndex);
    if (isPlaying) playFromPosition(0);
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    seekTimeRef.current = newTime;
    
    setCurrentTime(newTime);
    setProgress((newTime / duration) * 100);

    if (isPlaying) {
      pauseTimeRef.current = newTime;
      stopCurrentSource();
      playFromPosition(newTime);
    } else {
      pauseTimeRef.current = newTime;
    }
  };

  const handleDownload = async () => {
    const currentTrack = audioFiles[currentTrackIndex];
    if (!currentTrack?.src) return;

    try {
      const response = await fetch(currentTrack.src);
      if (!response.ok) throw new Error("Error en la descarga");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const fileName = `${getDisplayName(currentTrack.fileName)}`;

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error descargando:', error);
      window.open(currentTrack.src, '_blank');
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const toggleShuffle = () => {
    setIsShuffle(prev => {
      const newValue = !prev;
      if (newValue) setIsRepeat(false);
      return newValue;
    });
  };

  const toggleRepeat = () => {
    setIsRepeat(prev => {
      const newValue = !prev;
      if (newValue) setIsShuffle(false);
      return newValue;
    });
  };

  const toggleMute = () => setIsMuted(!isMuted);

  if (!isClient) return null;

  return (
    <div className="audio-player-container">
      <div className="audio-player">
        <div className="player-container">
          
            <div className="player-main-content">
              {/* Sección de lista de reproducción */}
              <h3 className="playlist-title" style={{display: 'flex', justifyContent: 'center', textAlign: "center" }}>
  <svg width="20" height="20" viewBox="0 0 24 24" className="playlist-icon">
    <path fill="currentColor" d="M15,6H3V8H15V6M15,10H3V12H15V10M3,16H11V14H3V16M17,6V14.18C16.69,14.07 16.35,14 16,14A3,3 0 0,0 13,17A3,3 0 0,0 16,20A3,3 0 0,0 19,17V8H22V6H17Z"/>
  </svg>
  Playlist
</h3>

              <div className="playlist-container">
                <ul className="playlist">
                  {audioFiles.map((track, index) => (
                    <li
                      key={index}
                      onClick={() => {
                        setCurrentTrackIndex(index);
                        if (isPlaying) playFromPosition(0);
                      }}
                      className={`playlist-item ${
                        index === currentTrackIndex ? 'active' : ''
                      } ${index === currentTrackIndex && isPlaying ? 'currently-playing' : ''}`}
                    >
                      <span className="track-number">{index + 1}</span>
                      <span className="track-name">
                        {getDisplayName(track.fileName || track.title || track.src)}
                      </span>
                      <span className="track-duration">
                        {formatTime(audioBuffers[index]?.duration || 0)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Sección principal del reproductor */}
              <div className="player-content">
                {/* Información de la pista */}
                <div className="track-info">
                  <div className="track-title">
                    {getDisplayName(
                      audioFiles[currentTrackIndex]?.fileName || 
                      audioFiles[currentTrackIndex]?.title || 
                      'Canción actual'
                    )}
                  </div>
                  
                </div>
  
                {/* Barra de progreso */}
                <div className="progress-container">
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    step="0.1"
                    value={currentTime}
                    onChange={handleSeek}
                    className="progress-slider"
                    aria-label="Barra de progreso de la canción"
                  />
                  <div className="time-display">
                    <span className="current-time">{formatTime(currentTime)}</span>
                    <span className="total-time">{formatTime(duration)}</span>
                  </div>
                </div>
  
                {/* Controles principales */}
                <div className="">
                  <div className="main-controls">
                    {/* Botón shuffle */}
                    <button 
                      className={`control-button ${isShuffle ? 'active' : ''}`}
                      onClick={toggleShuffle}
                      aria-label={isShuffle ? 'Desactivar mezcla aleatoria' : 'Activar mezcla aleatoria'}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M14.83,13.41L13.42,14.82L16.55,17.95L14.5,20H20V14.5L17.96,16.54L14.83,13.41M14.5,4L16.54,6.04L4,18.59L5.41,20L17.96,7.46L20,9.5V4M10.59,9.17L5.41,4L4,5.41L9.17,10.58L10.59,9.17Z"/>
                      </svg>
                    </button>
                    
                    {/* Botón anterior */}
                    <button 
                      className="control-button" 
                      onClick={handlePrevious}
                      aria-label="Canción anterior"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M6,18V6H8V18H6M9.5,12L18,6V18L9.5,12Z"/>
                      </svg>
                    </button>
                    
                    {/* Botón play/pause */}
                    <button 
                      className="play-pause-button" 
                      onClick={handlePlayPause}
                      aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
                    >
                      {isPlaying ? (
                        <svg width="24" height="24" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M14,19H18V5H14M6,19H10V5H6V19Z"/>
                        </svg>
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z"/>
                        </svg>
                      )}
                    </button>
                    
                    {/* Botón siguiente */}
                    <button 
                      className="control-button" 
                      onClick={handleNext}
                      aria-label="Siguiente canción"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M16,18H18V6H16M6,18L14.5,12L6,6V18Z"/>
                      </svg>
                    </button>
                    
                    {/* Botón repeat */}
                    <button 
                      className={`control-button ${isRepeat ? 'active' : ''}`}
                      onClick={toggleRepeat}
                      aria-label={isRepeat ? 'Desactivar repetición' : 'Activar repetición'}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M17,17H7V14L3,18L7,22V19H19V13H17M7,7H17V10L21,6L17,2V5H5V11H7V7Z"/>
                      </svg>
                    </button>
                  </div>
  
                  {/* Controles secundarios */}
                  <div className="secondary-controls">
                    {/* Control de volumen */}
                    <div className="volume-control">
                      <button 
                        className="control-button" 
                        onClick={toggleMute}
                        aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
                      >
                        {isMuted ? (
                          <svg width="20" height="20" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M12,4L9.91,6.09L12,8.18M4.27,3L3,4.27L7.73,9H3V15H7L12,20V13.27L16.25,17.53C15.58,18.04 14.83,18.46 14,18.7V20.77C15.38,20.45 16.63,19.82 17.68,18.96L19.73,21L21,19.73L12,10.73M19,12C19,12.94 18.8,13.82 18.46,14.64L19.97,16.15C20.62,14.91 21,13.5 21,12C21,7.72 18,4.14 14,3.23V5.29C16.89,6.15 19,8.83 19,12M16.5,12C16.5,10.23 15.5,8.71 14,7.97V10.18L16.45,12.63C16.5,12.43 16.5,12.21 16.5,12Z"/>
                          </svg>
                        ) : volume > 0.5 ? (
                          <svg width="20" height="20" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.84 14,18.7V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z"/>
                          </svg>
                        ) : volume > 0 ? (
                          <svg width="20" height="20" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M7,9V15H11L16,20V4L11,9H7Z"/>
                          </svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M12,4L9.91,6.09L12,8.18M4.27,3L3,4.27L7.73,9H3V15H7L12,20V13.27L16.25,17.53C15.58,18.04 14.83,18.46 14,18.7V20.77C15.38,20.45 16.63,19.82 17.68,18.96L19.73,21L21,19.73L12,10.73M19,12C19,12.94 18.8,13.82 18.46,14.64L19.97,16.15C20.62,14.91 21,13.5 21,12C21,7.72 18,4.14 14,3.23V5.29C16.89,6.15 19,8.83 19,12M16.5,12C16.5,10.23 15.5,8.71 14,7.97V10.18L16.45,12.63C16.5,12.43 16.5,12.21 16.5,12Z"/>
                          </svg>
                        )}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="volume-slider"
                        aria-label="Control de volumen"
                      />
                    </div>
                    
                    {/* Botón de descarga */}
                    <button 
                      className="control-button" 
                      onClick={handleDownload}
                      aria-label="Descargar canción"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          
        </div>
      </div>
    </div>
  );
}