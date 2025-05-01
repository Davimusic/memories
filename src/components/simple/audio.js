import React, { useRef, useState, useEffect } from 'react';
import FullControlMedia from '../complex/fullControlMedia';
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
} from '@/functions/music/mediaUtils';
import DownloadIcon from '../complex/downloadIcon';
import TogglePlayPause from '../complex/TogglePlayPause';
import ShuffleButton from '../complex/ShuffleButton';
import RepeatButton from '../complex/RepeatButton';
import NextBeforeIcon from '../complex/nextBeforeIcon';
import QualityIcon from '../complex/ToggleIcon';
import ToggleMute from '../complex/ToggleMute';






const validQualities = [25, 50, 75, 100];











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
  // Se elimina qualityMedia y setQualityMedia, ya que no se usan más
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
      audioRef.current.play().catch((error) => {
        console.error("Error al reproducir el audio:", error);
      });
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
    <div className="backgroundColor2 audioPlayerContent">
      {/* Barra superior de controles */}
      <div className="flexContainer">
        <MenuIcon onClick={() => setIsMenuOpen(!isMenuOpen)} />
        <DownloadIcon
          size={30}
          isOpen={isContentVisible}
          onToggle={toggleContentVisibility}
        />
      </div>

      {/* Controles de reproducción */}
      <div className="mediaControlContainer">
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

      {/* Barra de progreso */}
      <div className="audioControlContainer">
        <span style={{ color: "white" }}>{currentTimeMedia.toFixed(2)}</span>
        <input
          type="range"
          min="0"
          max={duration || 100}
          value={currentTimeMedia}
          onChange={(e) => setCurrentTimeMedia(Number(e.target.value))}
          className="seek-slider backgroundColor5"
        />
        <span style={{ color: "white" }}>{duration.toFixed(2)}</span>
      </div>

      {/* Controles de volumen */}
      <div className="volume-controls">
        <ToggleMute
          size={30}
          isMuted={isMutedMedia}
          onToggle={() => setIsMutedMedia(!isMutedMedia)}
        />
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMutedMedia ? 0 : volumeMedia}
          onChange={(e) => setVolumeMedia(Number(e.target.value))}
          className="volume-slider backgroundColor5"
        />
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
    </div>
  );
};

export default Audio;











