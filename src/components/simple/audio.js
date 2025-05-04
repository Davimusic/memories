import React, { useRef, useState, useEffect } from 'react';

//import mixUrlWithQuality from '@/functions/music/mixUrlWithQuality';
import MenuIcon from '../complex/menuIcon';
import {
  togglePlayPause,
  handleEnded,
  handleTimeUpdate,
  handleLoadedMetadata,
  handleSeek,
  handleVolumeChange,
  toggleMute,
  toggleShuffle,
  toggleRepeat,
  getNextMedia,
  getPreviousMedia,
  formatTime,
} from '../../functions/music/mediaUtils';
import DownloadIcon from '../complex/downloadIcon';
import TogglePlayPause from '../complex/TogglePlayPause';
import ShuffleButton from '../complex/ShuffleButton';
import RepeatButton from '../complex/RepeatButton';
import NextBeforeIcon from '../complex/nextBeforeIcon';
import QualityIcon from '../complex/ToggleIcon';
import ToggleMute from '../complex/ToggleMute';

















const Audio = ({
  src,
  allMusicProyects,
  currentIndex,
  setCurrentIndex,
  setContent,
  tags,
  setTags,
  setMusicContent,
  isMenuOpen,
  setIsMenuOpen,
  toggleMenu,
  isContentVisible,
  toggleContentVisibility,
  setComponentInUse,
  componentInUse,
  setShowComponent,
  showComponent,
  setCurrentTimeMedia,
  currentTimeMedia,
  setVolumeMedia,
  volumeMedia,
  setIsRepeatMedia,
  isRepeatMedia,
  setIsShuffleMedia,
  isShuffleMedia,
  setIsMutedMedia,
  isMutedMedia,
  setIsLike,
  isLike,
  isHybridView
}) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current
        .play()
        .catch((error) => console.error("Error al reproducir el audio:", error));
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Actualiza el src del audio cada vez que cambie
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = src;
      audioRef.current.currentTime = currentTimeMedia;
      audioRef.current.volume = volumeMedia;
      playAudio();
    }
  }, [src]);

  const handleNextSong = () => {
    const nextSong = getNextMedia(allMusicProyects, currentIndex, isShuffleMedia);
    if (nextSong) {
      setContent([nextSong]);
      setCurrentIndex(
        allMusicProyects.findIndex(
          (project) =>
            project.audioPrincipal?.src === nextSong.audioPrincipal.src
        )
      );
      setCurrentTimeMedia(0);
    }
  };

  const handlePreviousSong = () => {
    const previousSong = getPreviousMedia(allMusicProyects, currentIndex, isShuffleMedia);
    if (previousSong) {
      setContent([previousSong]);
      setCurrentIndex(
        allMusicProyects.findIndex(
          (project) =>
            project.audioPrincipal?.src === previousSong.audioPrincipal.src
        )
      );
      setCurrentTimeMedia(0);
    }
  };

  return (
    <div className="audioPlayerContent">
      {/* Fila superior: Barra de progreso y botón de mute */}
      <div className="top-row">
        <div className="audio-progress">
          <span className="time-text">{currentTimeMedia.toFixed(2)}</span>
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTimeMedia}
            onChange={(e) => setCurrentTimeMedia(Number(e.target.value))}
            className="seek-slider backgroundColor5"
          />
          <span className="time-text">{duration.toFixed(2)}</span>
        </div>
        <div className="mute-control">
          <ToggleMute
            size={30}
            isMuted={isMutedMedia}
            onToggle={() => setIsMutedMedia(!isMutedMedia)}
          />
        </div>
      </div>

      {/* Fila inferior: Controles restantes */}
      <div className="bottom-row">
        <MenuIcon onClick={() => setIsMenuOpen(!isMenuOpen)} />
        <DownloadIcon
          size={30}
          isOpen={isContentVisible}
          onToggle={toggleContentVisibility}
        />
        <TogglePlayPause
          size={30}
          isPlaying={isPlaying}
          onToggle={() => (isPlaying ? pauseAudio() : playAudio())}
        />
        <ShuffleButton
          buttonColor="white"
          isShuffle={isShuffleMedia}
          toggleShuffle={() => setIsShuffleMedia(!isShuffleMedia)}
        />
        <RepeatButton
          buttonColor="white"
          isRepeat={isRepeatMedia}
          toggleRepeat={() => setIsRepeatMedia(!isRepeatMedia)}
        />
        <NextBeforeIcon onToggle={handlePreviousSong} direction="left" />
        <NextBeforeIcon onToggle={handleNextSong} direction="right" />
        <QualityIcon size={30} onClick={() => console.log("Abrir modal de calidad")} />
      </div>

      {/* Elemento de audio */}
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={() =>
          setCurrentTimeMedia(audioRef.current?.currentTime || 0)
        }
        onLoadedMetadata={() =>
          setDuration(audioRef.current?.duration || 0)
        }
        onEnded={() => (isRepeatMedia ? playAudio() : handleNextSong())}
        muted={isMutedMedia}
        loop={isRepeatMedia}
      >
        Tu navegador no admite el elemento de audio.
      </audio>

      {/* Estilos integrados en el componente */}
      <style>{`
        .audioPlayerContent {
          width: 100%;
          max-width: 100vw;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background-color: #2c2c2c;
          padding: 1rem;
          box-sizing: border-box;
        }
        .top-row,
        .bottom-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }
        .top-row {
          margin-bottom: 1rem;
        }
        .audio-progress {
          flex: 1;
          display: flex;
          align-items: center;
        }
        .audio-progress .time-text {
          color: white;
          margin: 0 0.5rem;
        }
        .audio-progress .seek-slider {
          flex: 1;
        }
        .mute-control {
          margin-left: 1rem;
        }
        .bottom-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
      `}</style>
    </div>
  );
};

export default Audio;












