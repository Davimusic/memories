import React, { useRef, useState, useEffect, useCallback } from 'react';
import '../../estilos/general/audioPlayer.css';

const AudioPlayer = ({
  content = [],
  currentIndex = 0,
  setCurrentIndex,
  currentTimeMedia = 0,
  setCurrentTimeMedia,
  volumeMedia = 1,
  setVolumeMedia,
  isRepeatMedia = false,
  setIsRepeatMedia,
  isShuffleMedia = false,
  setIsShuffleMedia,
  isMutedMedia = false,
  setIsMutedMedia,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  const audioContext = useRef(null);
  const gainNode = useRef(null);
  const sourceNode = useRef(null);
  const bufferCache = useRef(new Map());
  const startTime = useRef(0);
  const rafId = useRef(null);
  const nextTrack = useRef({ index: null, url: null });
  const abortController = useRef(new AbortController());
  const currentTimeMediaRef = useRef(currentTimeMedia);
  const isMounted = useRef(true);
  const pausedTime = useRef(0);

  useEffect(() => {
    currentTimeMediaRef.current = currentTimeMedia;
  }, [currentTimeMedia]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      abortController.current.abort();
      audioContext.current?.close();
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  const initializeAudioContext = useCallback(async () => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
      gainNode.current = audioContext.current.createGain();
      gainNode.current.connect(audioContext.current.destination);
      setHasInitialized(true);
    }
    if (audioContext.current.state === 'suspended') {
      await audioContext.current.resume();
    }
  }, []);

  const getAudioUrl = (src) => `${src}?quality=low`;

  const preloadNextTrack = useCallback(async () => {
    if (!content.length) return;

    const getNextIndex = () => {
      if (isShuffleMedia) {
        let index;
        do {
          index = Math.floor(Math.random() * content.length);
        } while (index === currentIndex && content.length > 1);
        return index;
      }
      return (currentIndex + 1) % content.length;
    };

    const nextIndex = getNextIndex();
    const nextUrl = getAudioUrl(content[nextIndex]?.src);

    if (!nextUrl || bufferCache.current.has(nextUrl)) return;

    try {
      abortController.current.abort();
      abortController.current = new AbortController();

      const response = await fetch(nextUrl, {
        signal: abortController.current.signal,
      });

      const buffer = await audioContext.current.decodeAudioData(await response.arrayBuffer());

      bufferCache.current.set(nextUrl, buffer);
      nextTrack.current = { index: nextIndex, url: nextUrl };
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error preloading track:', error);
      }
    }
  }, [content, currentIndex, isShuffleMedia]);

  const handleTrackChange = useCallback(
    (newIndex) => {
      if (newIndex === currentIndex || newIndex < 0 || newIndex >= content.length) return;

      bufferCache.current.delete(getAudioUrl(content[currentIndex]?.src));
      setCurrentIndex(newIndex);
      setCurrentTimeMedia(0);
      currentTimeMediaRef.current = 0;
      pausedTime.current = 0;

      if (isPlaying) {
        setIsPlaying(false);
        setTimeout(() => setIsPlaying(true), 100);
      }
    },
    [content, currentIndex, isPlaying, setCurrentIndex, setCurrentTimeMedia]
  );

  const handleNextSong = useCallback(() => {
    const newIndex =
      isShuffleMedia && nextTrack.current.index !== null
        ? nextTrack.current.index
        : (currentIndex + 1) % content.length;

    handleTrackChange(newIndex);
  }, [content.length, currentIndex, isShuffleMedia, handleTrackChange]);

  const handlePreviousSong = useCallback(() => {
    const newIndex = (currentIndex - 1 + content.length) % content.length;
    handleTrackChange(newIndex);
  }, [content.length, currentIndex, handleTrackChange]);

  const startPlayback = useCallback(
    (buffer, startOffset = 0) => {
      if (!buffer || !audioContext.current) return;

      if (sourceNode.current) {
        sourceNode.current.stop();
        sourceNode.current.disconnect();
      }

      sourceNode.current = audioContext.current.createBufferSource();
      sourceNode.current.buffer = buffer;
      sourceNode.current.connect(gainNode.current);

      sourceNode.current.onended = () => {
        if (isRepeatMedia) {
          startPlayback(buffer);
        } else {
          handleNextSong();
        }
      };

      startTime.current = audioContext.current.currentTime - startOffset;
      sourceNode.current.start(0, startOffset);
      setIsPlaying(true);
      preloadNextTrack();
    },
    [handleNextSong, isRepeatMedia, preloadNextTrack]
  );

  const playAudio = useCallback(async () => {
    try {
      await initializeAudioContext();
      const currentUrl = getAudioUrl(content[currentIndex]?.src);
      if (!currentUrl) return;

      let buffer = bufferCache.current.get(currentUrl);
      if (!buffer) {
        setIsLoading(true);
        const response = await fetch(currentUrl);
        const arrayBuffer = await response.arrayBuffer();
        buffer = await audioContext.current.decodeAudioData(arrayBuffer);
        bufferCache.current.set(currentUrl, buffer);
        setDuration(buffer.duration);
        setIsLoading(false);
      }

      const startOffset = pausedTime.current % buffer.duration;
      startPlayback(buffer, startOffset);
      pausedTime.current = 0;
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
      setIsLoading(false);
    }
  }, [content, currentIndex, initializeAudioContext, startPlayback]);

  const pauseAudio = useCallback(() => {
    if (sourceNode.current) {
      pausedTime.current = audioContext.current.currentTime - startTime.current;
      sourceNode.current.stop();
      sourceNode.current.disconnect();
      sourceNode.current = null;
      setIsPlaying(false);
    }
  }, []);

  const togglePlayPause = useCallback(async () => {
    if (isPlaying) {
      pauseAudio();
    } else {
      await playAudio();
    }
  }, [isPlaying, pauseAudio, playAudio]);

  useEffect(() => {
    if (gainNode.current) {
      gainNode.current.gain.value = isMutedMedia ? 0 : volumeMedia;
    }
  }, [volumeMedia, isMutedMedia]);

  const updateTime = useCallback(() => {
    if (sourceNode.current && isPlaying && isMounted.current) {
      const currentTime = audioContext.current.currentTime - startTime.current;
      setCurrentTimeMedia(currentTime);
      currentTimeMediaRef.current = currentTime;
      rafId.current = requestAnimationFrame(updateTime);
    }
  }, [isPlaying, setCurrentTimeMedia]);

  useEffect(() => {
    updateTime();
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [updateTime]);

  const handleSeek = useCallback(
    (e) => {
      const newTime = Number(e.target.value);
      setCurrentTimeMedia(newTime);
      currentTimeMediaRef.current = newTime;
      pausedTime.current = newTime;

      if (isPlaying) {
        const currentUrl = getAudioUrl(content[currentIndex]?.src);
        const buffer = bufferCache.current.get(currentUrl);
        if (buffer) {
          startPlayback(buffer, newTime);
        }
      }
    },
    [content, currentIndex, isPlaying, setCurrentTimeMedia, startPlayback]
  );

  const toggleShuffle = useCallback(() => {
    setIsShuffleMedia((prev) => {
      const newValue = !prev;
      if (newValue) setIsRepeatMedia(false);
      return newValue;
    });
  }, [setIsRepeatMedia]);

  const toggleRepeat = useCallback(() => {
    setIsRepeatMedia((prev) => {
      const newValue = !prev;
      if (newValue) setIsShuffleMedia(false);
      return newValue;
    });
  }, [setIsShuffleMedia]);

  const toggleMute = useCallback(() => {
    setIsMutedMedia((prev) => !prev);
  }, []);

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  useEffect(() => {
    if (hasInitialized && content[currentIndex]?.src) {
      const loadAndPlay = async () => {
        const currentUrl = getAudioUrl(content[currentIndex].src);

        if (!bufferCache.current.has(currentUrl)) {
          setIsLoading(true);
          try {
            const response = await fetch(currentUrl);
            const arrayBuffer = await response.arrayBuffer();
            const buffer = await audioContext.current.decodeAudioData(arrayBuffer);
            bufferCache.current.set(currentUrl, buffer);
            setDuration(buffer.duration);

            if (isPlaying) {
              startPlayback(buffer);
            }
          } catch (error) {
            console.error('Error loading track:', error);
            handleNextSong();
          } finally {
            setIsLoading(false);
          }
        } else if (isPlaying) {
          const buffer = bufferCache.current.get(currentUrl);
          startPlayback(buffer);
        }
      };

      loadAndPlay();
    }
  }, [content, currentIndex, hasInitialized, isPlaying, startPlayback, handleNextSong]);

  useEffect(() => {
    const activeTrack = document.querySelector('.track-item.active');
    if (activeTrack) {
      activeTrack.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentIndex]);

  return (
    <div className="audio-player-container">
      <div className="track-list-container">
        <div className="track-list">
          {content.map((track, index) => (
            <div
              key={index}
              className={`track-item ${index === currentIndex ? 'active' : ''}`}
              onClick={() => handleTrackChange(index)}
            >
              <div className="track-info">
                <span className="track-name">{track.title || track.src.split('/').pop()}</span>
                <span className="track-duration">
                  {index === currentIndex ? formatTime(currentTimeMedia) : formatTime(track.duration || 0)}
                </span>
              </div>
              {index === currentIndex && (
                <div className="track-progress">
                  <div
                    className="progress-bar"
                    style={{ width: `${(currentTimeMedia / (duration || 1)) * 100}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="player-controls">
        {isLoading && <div className="loading-indicator">Cargando...</div>}
        <div className="progress-controls">
          <span className="time-display">{formatTime(currentTimeMedia)}</span>
          <input
            type="range"
            min="0"
            max={duration || 1}
            step="0.1"
            value={currentTimeMedia}
            onChange={handleSeek}
            className="seek-slider"
            aria-label="Barra de progreso"
          />
          <span className="time-display">{formatTime(duration)}</span>
        </div>

        <div className="volume-controls">
          <button
            onClick={toggleMute}
            className="control-button"
            aria-label={isMutedMedia ? 'Activar sonido' : 'Silenciar'}
          >
            {isMutedMedia ? '🔇' : '🔊'}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volumeMedia}
            onChange={(e) => setVolumeMedia(parseFloat(e.target.value))}
            className="volume-slider"
            aria-label="Control de volumen"
          />
        </div>

        <div className="playback-controls">
          <button
            onClick={toggleShuffle}
            className="control-button"
            style={{ color: isShuffleMedia ? '#4CAF50' : 'white' }}
            aria-label="Modo aleatorio"
          >
            🔀
          </button>

          <button onClick={handlePreviousSong} className="control-button" aria-label="Anterior">
            ⏮
          </button>

          <button
            onClick={togglePlayPause}
            className="control-button"
            disabled={isLoading || !content.length}
            aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>

          <button onClick={handleNextSong} className="control-button" aria-label="Siguiente">
            ⏭
          </button>

          <button
            onClick={toggleRepeat}
            className="control-button"
            style={{ color: isRepeatMedia ? '#4CAF50' : 'white' }}
            aria-label="Modo repetición"
          >
            🔁
          </button>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;