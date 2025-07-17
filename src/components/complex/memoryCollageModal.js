import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import '../../estilos/general/dynamicCreator.css';

const MemoryCollageModal = ({
  isModalOpen,
  setIsModalOpen,
  memoryData,
  dynamicMemoryID = null,
  groups,
  sceneDurations = [],
  audioSelections = [],
  defaultDuration = 10000,
  PlayPauseComponent = null,
  setFailMessage = () => {},
}) => {
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [selectedBackgroundAudios, setSelectedBackgroundAudios] = useState([]);
  const [selectedVoiceAudios, setSelectedVoiceAudios] = useState([]);
  const [currentBackgroundAudioIndex, setCurrentBackgroundAudioIndex] = useState(0);
  const videoRefs = useRef({});
  const videoTimeouts = useRef({});
  const backgroundAudioRef = useRef(null);
  const voiceAudioRef = useRef(null);
  const modalRootRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

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

  // Scene transition logic
  useEffect(() => {
    if (!isPlaying || groups.length === 0 || !isModalOpen) return;

    const currentGroup = groups[currentGroupIndex];
    const isVideoOnly = currentGroup?.layout === 'video-only';
    let transitionTimeout;

    const goToNextScene = () => {
      setCurrentGroupIndex(prev => {
        const nextIndex = (prev + 1) % groups.length;
        let attempts = 0;
        let newIndex = nextIndex;
        while (groups[newIndex]?.items.every(item => !item.url) && attempts < groups.length) {
          newIndex = (newIndex + 1) % groups.length;
          attempts++;
        }
        return newIndex;
      });
    };

    if (isVideoOnly && currentGroup.items[0]?.type === 'video') {
      const video = videoRefs.current[`${currentGroupIndex}-0`];
      if (video) {
        const handleVideoEnded = () => {
          goToNextScene();
        };

        const handleVideoError = () => {
          console.log('Video error, skipping:', video.src);
          setFailMessage('Video playback failed');
          goToNextScene();
        };

        video.addEventListener('ended', handleVideoEnded, { once: true });
        video.addEventListener('error', handleVideoError, { once: true });

        return () => {
          video.removeEventListener('ended', handleVideoEnded);
          video.removeEventListener('error', handleVideoError);
        };
      }
    } else {
      const currentVoiceAudio = selectedVoiceAudios.find(audio => audio.groupIndex === currentGroupIndex);
      if (currentVoiceAudio && voiceAudioRef.current) {
        const handleAudioEnded = () => {
          goToNextScene();
        };

        const handleAudioError = () => {
          console.log('Voice audio error, skipping:', currentVoiceAudio.url);
          console.log('Voice audio playback failed');
          
          //setFailMessage('Voice audio playback failed');
          goToNextScene();
        };

        voiceAudioRef.current.addEventListener('ended', handleAudioEnded, { once: true });
        voiceAudioRef.current.addEventListener('error', handleAudioError, { once: true });

        return () => {
          if (voiceAudioRef.current) {
            voiceAudioRef.current.removeEventListener('ended', handleAudioEnded);
            voiceAudioRef.current.removeEventListener('error', handleAudioError);
          }
        };
      } else {
        const duration = sceneDurations[currentGroupIndex] || defaultDuration;
        transitionTimeout = setTimeout(goToNextScene, duration);
        return () => clearTimeout(transitionTimeout);
      }
    }
  }, [isPlaying, groups, currentGroupIndex, sceneDurations, isModalOpen, selectedVoiceAudios, setFailMessage]);

  // Background audio playback control
  useEffect(() => {
    if (isModalOpen && selectedBackgroundAudios.length > 0 && backgroundAudioRef.current) {
      const playNextBackgroundAudio = () => {
        backgroundAudioRef.current.src = selectedBackgroundAudios[currentBackgroundAudioIndex];
        const isVoicePlaying = voiceAudioRef.current && !voiceAudioRef.current.paused;
        const isVideoOnlyPlaying = groups[currentGroupIndex]?.layout === 'video-only' &&
          videoRefs.current[`${currentGroupIndex}-0`] && !videoRefs.current[`${currentGroupIndex}-0`].paused;
        backgroundAudioRef.current.volume = (isVoicePlaying || isVideoOnlyPlaying) ? 0.2 : 1.0;
        backgroundAudioRef.current.play().catch(() => {
          console.log('Background audio play failed:', selectedBackgroundAudios[currentBackgroundAudioIndex]);
          console.log('Background audio playback failed');
          //setFailMessage('Background audio playback failed');
        });
      };

      const handleAudioEnded = () => {
        const nextIndex = (currentBackgroundAudioIndex + 1) % selectedBackgroundAudios.length;
        setCurrentBackgroundAudioIndex(nextIndex);
      };

      const handleAudioError = () => {
        console.log('Background audio error, skipping:', selectedBackgroundAudios[currentBackgroundAudioIndex]);
        console.log('Background audio playback failed');
        
        //setFailMessage('Background audio playback failed');
        const nextIndex = (currentBackgroundAudioIndex + 1) % selectedBackgroundAudios.length;
        setCurrentBackgroundAudioIndex(nextIndex);
      };

      backgroundAudioRef.current.addEventListener('ended', handleAudioEnded);
      backgroundAudioRef.current.addEventListener('error', handleAudioError);

      if (backgroundAudioRef.current.paused) {
        playNextBackgroundAudio();
      }

      return () => {
        if (backgroundAudioRef.current) {
          backgroundAudioRef.current.removeEventListener('ended', handleAudioEnded);
          backgroundAudioRef.current.removeEventListener('error', handleAudioError);
          backgroundAudioRef.current.pause();
          backgroundAudioRef.current.currentTime = 0;
        }
      };
    } else if (backgroundAudioRef.current) {
      backgroundAudioRef.current.pause();
      backgroundAudioRef.current.currentTime = 0;
    }
  }, [isModalOpen, selectedBackgroundAudios, currentBackgroundAudioIndex, setFailMessage]);

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
        voiceAudioRef.current.play().catch(() => {
          console.log('Voice audio play failed:', currentVoiceAudio.url);
          //setFailMessage('Voice audio playback failed');
        });
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
  }, [isModalOpen, currentGroupIndex, selectedVoiceAudios, groups, setFailMessage]);

  // Video playback control
  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([key, video]) => {
      if (!video) return;
      const [groupIndexStr] = key.split('-');
      const groupIndex = parseInt(groupIndexStr);
      const isVideoOnly = groups[groupIndex]?.layout === 'video-only';
      if (groupIndex === currentGroupIndex && isModalOpen && isPlaying) {
        video.currentTime = 0;
        video.muted = !isVideoOnly;
        video.play().catch(() => {
          console.log('Video play failed:', video.src);
          setFailMessage('Video playback failed');
        });
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
  }, [currentGroupIndex, isModalOpen, isPlaying, groups, setFailMessage]);

  // Pause all media when isPlaying is false
  useEffect(() => {
    if (!isPlaying) {
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.pause();
      }
      if (voiceAudioRef.current) {
        voiceAudioRef.current.pause();
      }
      Object.values(videoRefs.current).forEach(video => {
        if (video) video.pause();
      });
    }
  }, [isPlaying]);

  const handleEmojiClick = index => setCurrentGroupIndex(index);

  const handlePlayPause = () => setIsPlaying(prev => !prev);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentBackgroundAudioIndex(0);
    setShowControls(true);
  };

  // Check if memory data is accessible
  const isMemoryAccessible = dynamicMemoryID
    ? memoryData && memoryData.dynamicMemories && memoryData.dynamicMemories[dynamicMemoryID]
    : memoryData && memoryData.accessAllowed;

  return (
    <>
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
                {PlayPauseComponent ? (
                  <PlayPauseComponent
                    isPlaying={isPlaying}
                    onToggle={handlePlayPause}
                    size={30}
                  />
                ) : (
                  <button
                    className="play-pause-button"
                    onClick={handlePlayPause}
                    aria-label={isPlaying ? 'Pause animation' : 'Play animation'}
                  >
                    {isPlaying ? '⏸' : '▶'}
                  </button>
                )}
              </div>
            </div>
            {isMemoryAccessible ? (
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
                              onError={() => {
                                console.log('Background image failed:', item.url);
                                setFailMessage('Background image failed to load');
                              }}
                            />
                          ) : (
                            <video
                              src={item.url}
                              className="background-media"
                              muted
                              loop
                              autoPlay
                              playsInline
                              onError={() => {
                                console.log('Background video failed:', item.url);
                                setFailMessage('Background video failed to load');
                              }}
                            />
                          )}
                          {/* Foreground media */}
                          {item.type === 'photo' ? (
                            <img
                              src={item.url}
                              alt={`Memory photo ${index + 1}`}
                              className="media"
                              onError={() => {
                                console.log('Foreground image failed:', item.url);
                                setFailMessage('Foreground image failed to load');
                              }}
                            />
                          ) : (
                            <video
                              ref={el => (videoRefs.current[`${groupIndex}-${index}`] = el)}
                              src={item.url}
                              className="media"
                              playsInline
                              onError={() => {
                                console.log('Foreground video failed:', item.url);
                                console.log('Foreground video playback failed');
                                
                                //setFailMessage('Foreground video playback failed');
                              }}
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
            <audio
              ref={backgroundAudioRef}
              style={{ display: 'none' }}
              onError={() => {
                console.log('Background audio error:', backgroundAudioRef.current?.src);
                console.log('Background audio playback failed');
                
                //setFailMessage('Background audio playback failed');
                const nextIndex = (currentBackgroundAudioIndex + 1) % selectedBackgroundAudios.length;
                setCurrentBackgroundAudioIndex(nextIndex);
              }}
            />
            <audio
              ref={voiceAudioRef}
              style={{ display: 'none' }}
              onError={() => {
                console.log('Voice audio error:', voiceAudioRef.current?.src);
                console.log('Voice audio playback failed');
                
                //setFailMessage('Voice audio playback failed');
                setCurrentGroupIndex(prev => (prev + 1) % groups.length);
              }}
            />
          </div>
        </div>,
        modalRootRef.current
      )}
    </>
  );
};

export default MemoryCollageModal;