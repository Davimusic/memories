'use client';

import React, { useState, useEffect, useRef } from 'react';
import GeneralMold from '@/components/complex/generalMold';
import '../../../estilos/general/dynamicCreator.css';
import ReactDOM from 'react-dom';

const MemoryViewer = () => {
  const [memoryData, setMemoryData] = useState(null);
  const memoryKey = memoryData?.memoryMetadata?.memoryKey;
  const [groups, setGroups] = useState([]);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [audioSelections, setAudioSelections] = useState([]);
  const [selectedBackgroundAudios, setSelectedBackgroundAudios] = useState([]);
  const [selectedVoiceAudios, setSelectedVoiceAudios] = useState([]);
  const [sceneDurations, setSceneDurations] = useState([]);
  const [currentBackgroundAudioIndex, setCurrentBackgroundAudioIndex] = useState(0);
  const [error, setError] = useState(null);
  const videoRefs = useRef({});
  const videoTimeouts = useRef({});
  const backgroundAudioRef = useRef(null);
  const voiceAudioRef = useRef(null);
  const modalRootRef = useRef(null);
  const defaultDuration = 10000;
  const controlsTimeoutRef = useRef(null);
  const [showControls, setShowControls] = useState(true);

  const layouts = [
    { type: 'single', count: 1 },
    { type: 'double', count: 2 },
    { type: 'triple', count: 3 },
    { type: 'quad', count: 4 },
    { type: 'video-only', count: 1 },
  ];

  // Initialize data and open modal when memoryData is received
  useEffect(() => {
    if (!memoryData) return;

    if (!memoryKey || !memoryData?.dynamicMemories?.[memoryKey]) {
      setError('Memory data not available.');
      setIsModalOpen(false);
      return;
    }

    const dynamicMemory = memoryData.dynamicMemories[memoryKey];
    setGroups(dynamicMemory.groups || []);
    setAudioSelections(dynamicMemory.audioSelections || []);
    setSceneDurations(dynamicMemory.sceneDurations || []);
    setIsModalOpen(true); // Open modal automatically
    setIsPlaying(true); // Start playback automatically
  }, [memoryData, memoryKey]);

  // Initialize audio selections
  useEffect(() => {
    const backgroundAudios = audioSelections
      .filter(audio => audio.isActive && audio.type === 'Background')
      .map(audio => audio.url);
    const voiceAudios = audioSelections
      .filter(audio => audio.isActive && audio.type === 'Voice')
      .map((audio, index) => ({ url: audio.url, groupIndex: index }));
    setSelectedBackgroundAudios(backgroundAudios);
    setSelectedVoiceAudios(voiceAudios);
  }, [audioSelections]);

  // Create modal root
  useEffect(() => {
    if (!document.getElementById('modal-root')) {
      const modalRoot = document.createElement('div');
      modalRoot.id = 'modal-root';
      document.body.appendChild(modalRoot);
    }
    modalRootRef.current = document.getElementById('modal-root');
    return () => {
      if (modalRootRef.current && document.getElementById('modal-root')) {
        document.body.removeChild(modalRootRef.current);
      }
    };
  }, []);

  // Toggle body overflow when modal is open
  useEffect(() => {
    document.body.classList.toggle('modal-open', isModalOpen);
  }, [isModalOpen]);

  // Handle controls visibility timeout
  useEffect(() => {
    if (isModalOpen && showControls) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 5000);
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isModalOpen, showControls]);

  // Handle mouse movement and touch events
  const handleInteraction = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 5000);
  };

  // Scene transition logic based on video or audio playback
  useEffect(() => {
    if (!isPlaying || groups.length === 0 || sceneDurations.length === 0 || !isModalOpen) return;

    const currentGroup = groups[currentGroupIndex];
    const isVideoOnly = currentGroup?.layout === 'video-only';
    let transitionTimeout;

    const goToNextScene = () => {
      setCurrentGroupIndex(prev => (prev + 1) % groups.length);
    };

    if (isVideoOnly && currentGroup.items[0]?.type === 'video') {
      const video = videoRefs.current[`${currentGroupIndex}-0`];
      if (video) {
        const handleVideoPlay = () => {
          const duration = Math.min(video.duration * 1000, defaultDuration);
          transitionTimeout = setTimeout(goToNextScene, duration);
        };

        const handleVideoEnded = () => {
          clearTimeout(transitionTimeout);
          goToNextScene();
        };

        video.addEventListener('play', handleVideoPlay, { once: true });
        video.addEventListener('ended', handleVideoEnded, { once: true });

        return () => {
          video.removeEventListener('play', handleVideoPlay);
          video.removeEventListener('ended', handleVideoEnded);
          clearTimeout(transitionTimeout);
        };
      }
    } else {
      const currentVoiceAudio = selectedVoiceAudios.find(audio => audio.groupIndex === currentGroupIndex);
      if (currentVoiceAudio && voiceAudioRef.current) {
        const handleAudioPlay = () => {
          const duration = Math.min(voiceAudioRef.current.duration * 1000, defaultDuration);
          transitionTimeout = setTimeout(goToNextScene, duration);
        };

        const handleAudioEnded = () => {
          clearTimeout(transitionTimeout);
          goToNextScene();
        };

        voiceAudioRef.current.addEventListener('play', handleAudioPlay, { once: true });
        voiceAudioRef.current.addEventListener('ended', handleAudioEnded, { once: true });

        return () => {
          if (voiceAudioRef.current) {
            voiceAudioRef.current.removeEventListener('play', handleAudioPlay);
            voiceAudioRef.current.removeEventListener('ended', handleAudioEnded);
          }
          clearTimeout(transitionTimeout);
        };
      } else {
        transitionTimeout = setTimeout(goToNextScene, sceneDurations[currentGroupIndex] || defaultDuration);
        return () => clearTimeout(transitionTimeout);
      }
    }
  }, [isPlaying, groups, currentGroupIndex, sceneDurations, isModalOpen, selectedVoiceAudios]);

  // Background audio playback control
  useEffect(() => {
    if (isModalOpen && selectedBackgroundAudios.length > 0 && backgroundAudioRef.current) {
      const playNextBackgroundAudio = () => {
        backgroundAudioRef.current.src = selectedBackgroundAudios[currentBackgroundAudioIndex];
        const isVoicePlaying = voiceAudioRef.current && !voiceAudioRef.current.paused;
        const isVideoOnlyPlaying = groups[currentGroupIndex]?.layout === 'video-only' &&
          videoRefs.current[`${currentGroupIndex}-0`] && !videoRefs.current[`${currentGroupIndex}-0`].paused;
        backgroundAudioRef.current.volume = (isVoicePlaying || isVideoOnlyPlaying) ? 0.2 : 1.0;
        backgroundAudioRef.current.play().catch(() => console.log('Background audio play failed:', selectedBackgroundAudios[currentBackgroundAudioIndex]));
      };

      const handleAudioEnded = () => {
        const nextIndex = (currentBackgroundAudioIndex + 1) % selectedBackgroundAudios.length;
        setCurrentBackgroundAudioIndex(nextIndex);
        playNextBackgroundAudio();
      };

      backgroundAudioRef.current.addEventListener('ended', handleAudioEnded);

      if (backgroundAudioRef.current.paused) {
        playNextBackgroundAudio();
      }

      return () => {
        if (backgroundAudioRef.current) {
          backgroundAudioRef.current.removeEventListener('ended', handleAudioEnded);
          backgroundAudioRef.current.pause();
          backgroundAudioRef.current.currentTime = 0;
        }
      };
    } else if (backgroundAudioRef.current) {
      backgroundAudioRef.current.pause();
      backgroundAudioRef.current.currentTime = 0;
    }
  }, [isModalOpen, currentBackgroundAudioIndex, selectedBackgroundAudios, currentGroupIndex, groups]);

  // Voice audio and video audio playback control
  useEffect(() => {
    if (isModalOpen && voiceAudioRef.current) {
      const currentGroup = groups[currentGroupIndex];
      const isVideoOnly = currentGroup?.layout === 'video-only';
      const currentVoiceAudio = selectedVoiceAudios.find(audio => audio.groupIndex === currentGroupIndex);

      if (isVideoOnly) {
        voiceAudioRef.current.pause();
        voiceAudioRef.current.currentTime = 0;
      } else if (currentVoiceAudio) {
        voiceAudioRef.current.src = currentVoiceAudio.url;
        voiceAudioRef.current.currentTime = 0;
        voiceAudioRef.current.play().catch(() => console.log('Voice audio play failed:', currentVoiceAudio.url));
        if (backgroundAudioRef.current) {
          backgroundAudioRef.current.volume = 0.2;
        }
      } else {
        voiceAudioRef.current.pause();
        voiceAudioRef.current.currentTime = 0;
        if (backgroundAudioRef.current) {
          backgroundAudioRef.current.volume = 1.0;
        }
      }

      voiceAudioRef.current.addEventListener('ended', () => {
        if (backgroundAudioRef.current) {
          backgroundAudioRef.current.volume = 1.0;
        }
      }, { once: true });

      return () => {
        if (voiceAudioRef.current) {
          voiceAudioRef.current.pause();
          voiceAudioRef.current.currentTime = 0;
        }
        if (backgroundAudioRef.current) {
          backgroundAudioRef.current.volume = 1.0;
        }
      };
    } else if (voiceAudioRef.current) {
      voiceAudioRef.current.pause();
      voiceAudioRef.current.currentTime = 0;
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.volume = 1.0;
      }
    }
  }, [isModalOpen, currentGroupIndex, selectedVoiceAudios, groups]);

  // Video playback control
  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([key, video]) => {
      if (!video) return;
      const [groupIndexStr] = key.split('-');
      const groupIndex = parseInt(groupIndexStr);
      const isVideoOnly = groups[groupIndex]?.layout === 'video-only';
      if (groupIndex === currentGroupIndex && isModalOpen) {
        video.currentTime = 0;
        video.muted = !isVideoOnly;
        video.play().catch(() => console.log('Video play failed:', video.src));
        if (isVideoOnly && backgroundAudioRef.current) {
          video.addEventListener('play', () => {
            if (backgroundAudioRef.current) backgroundAudioRef.current.volume = 0.2;
          }, { once: true });
          video.addEventListener('ended', () => {
            if (backgroundAudioRef.current) backgroundAudioRef.current.volume = 1.0;
          }, { once: true });
        }
      } else {
        if (video) {
          video.pause();
          video.currentTime = 0;
          video.muted = true;
        }
        if (videoTimeouts.current[key]) {
          clearTimeout(videoTimeouts.current[key]);
          delete videoTimeouts.current[key];
        }
      }
    });

    return () => {
      Object.entries(videoRefs.current).forEach(([key, video]) => {
        if (video) {
          video.pause();
          video.currentTime = 0;
          video.muted = true;
        }
        if (videoTimeouts.current[key]) {
          clearTimeout(videoTimeouts.current[key]);
          delete videoTimeouts.current[key];
        }
      });
    };
  }, [currentGroupIndex, isModalOpen, groups]);

  const handleEmojiClick = index => setCurrentGroupIndex(index);

  const handlePlayPause = () => setIsPlaying(prev => !prev);

  const handleOpenModal = () => {
    setCurrentGroupIndex(0);
    setIsModalOpen(true);
    setShowControls(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentBackgroundAudioIndex(0);
    setShowControls(true);
  };

  const rightContent = (
    <div className="collage-pre-container">
      <h3>{memoryData?.memoryMetadata?.title || 'Memory Collage'}</h3>
      <p>{memoryData?.memoryMetadata?.description || 'No description available.'}</p>
      <button className="open-collage-button" onClick={handleOpenModal}>
        View Memory Collage
      </button>
      {error && <p className="error-message">{error}</p>}
      {isModalOpen && ReactDOM.createPortal(
        <div
          className="modalOverlay"
          onClick={handleCloseModal}
          onMouseMove={handleInteraction}
          onTouchStart={handleInteraction}
        >
          <div className="modalContentMemories" onClick={e => e.stopPropagation()}>
            <div className={`floating-controls ${showControls ? 'visible' : 'hidden'}`}>
              <div className="collage-title">{memoryData?.memoryMetadata?.title || 'Memory Collage'}</div>
              <button onClick={handleCloseModal} className="closeButton">×</button>
              <div className="controls">
                <div className="emoji-indicators">
                  {groups.map((group, index) => (
                    <button
                      key={index}
                      className={`emoji ${index === currentGroupIndex ? 'active' : ''}`}
                      onClick={() => handleEmojiClick(index)}
                      aria-label={`Go to group ${index + 1}`}
                    >
                      ●
                    </button>
                  ))}
                </div>
                <button
                  className="play-pause-button"
                  onClick={handlePlayPause}
                  aria-label={isPlaying ? 'Pause animation' : 'Play animation'}
                >
                  {isPlaying ? '⏸' : '▶'}
                </button>
              </div>
            </div>
            {memoryKey && memoryData?.dynamicMemories?.[memoryKey] ? (
              groups.length > 0 ? (
                <div className="groups-wrapper">
                  {groups.map((group, groupIndex) => (
                    <div
                      key={groupIndex}
                      className={`group-container ${group.layout} ${groupIndex === currentGroupIndex ? 'visible' : 'hidden'}`}
                    >
                      {group.items.map((item, index) => (
                        <div key={index} className="media-item">
                          {/* Background media */}
                          {item.type === 'photo' ? (
                            <img
                              src={item.url}
                              alt={`Background for memory ${index + 1}`}
                              className="background-media"
                            />
                          ) : (
                            <video
                              src={item.url}
                              className="background-media"
                              muted
                              loop
                              autoPlay
                              playsInline
                            />
                          )}
                          {/* Foreground media */}
                          {item.type === 'photo' ? (
                            <img
                              src={item.url}
                              alt={`Memory photo ${index + 1}`}
                              className="media"
                            />
                          ) : (
                            <video
                              ref={el => (videoRefs.current[`${groupIndex}-${index}`] = el)}
                              src={item.url}
                              className="media"
                              playsInline
                            >
                              Your browser does not support the video tag.
                            </video>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-media">No media items available.</div>
              )
            ) : (
              <div className="no-access">Memory data not available.</div>
            )}
            <audio ref={backgroundAudioRef} style={{ display: 'none' }} />
            <audio ref={voiceAudioRef} style={{ display: 'none' }} />
          </div>
        </div>,
        modalRootRef.current
      )}
    </div>
  );

  return (
    <GeneralMold
      pageTitle={memoryData?.memoryMetadata?.title || 'Memory Collage'}
      pageDescription={memoryData?.memoryMetadata?.description || 'A collection of your memories'}
      rightContent={rightContent}
      visibility={memoryData?.memoryMetadata?.requiredVisibility || 'private'}
      owner={memoryData?.memoryMetadata?.createdBy}
      metaKeywords="memory collage, photos, videos, memories"
      error={error}
      setInitialData={setMemoryData}
    />
  );
};

export default MemoryViewer;