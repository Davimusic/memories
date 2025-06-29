'use client';

import React, { useState, useEffect, useRef } from 'react';
import GeneralMold from '@/components/complex/generalMold';
import '../../../estilos/general/dynamicCreator.css';
import ReactDOM from 'react-dom';

const CollageDisplay = () => {
  const [mediaItems, setMediaItems] = useState([]);
  const [groups, setGroups] = useState([]);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [memoryData, setMemoryData] = useState(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [audioSelections, setAudioSelections] = useState([]);
  const [selectedBackgroundAudios, setSelectedBackgroundAudios] = useState([]);
  const [selectedVoiceAudios, setSelectedVoiceAudios] = useState([]);
  const [sceneDurations, setSceneDurations] = useState([]);
  const [currentPreviewUrl, setCurrentPreviewUrl] = useState(null);
  const [showControls, setShowControls] = useState(true);
  const [saveMessage, setSaveMessage] = useState(null);
  const [uid, setUid] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [token, setToken] = useState('');

  const videoRefs = useRef({});
  const videoTimeouts = useRef({});
  const backgroundAudioRef = useRef(null);
  const voiceAudioRef = useRef(null);
  const previewAudioRef = useRef(null);
  const [currentBackgroundAudioIndex, setCurrentBackgroundAudioIndex] = useState(0);
  const modalRootRef = useRef(null);
  const defaultDuration = 10000;
  const controlsTimeoutRef = useRef(null);

  const layouts = [
    { type: 'single', count: 1 },
    { type: 'double', count: 2 },
    { type: 'triple', count: 3 },
    { type: 'quad', count: 4 },
    { type: 'video-only', count: 1 },
  ];

  // Initialize audio selections from memoryData
  useEffect(() => {
    if (memoryData?.topics) {
      const audios = [];
      Object.values(memoryData.topics).forEach(topic => {
        (topic.audios || []).forEach(audio => {
          audios.push({
            url: audio.url,
            isActive: false,
            type: 'Background',
          });
        });
      });
      setAudioSelections(audios);
    }
  }, [memoryData]);

  // Update selected background and voice audios, calculate scene durations
  useEffect(() => {
    const backgroundAudios = audioSelections
      .filter(audio => audio.isActive && audio.type === 'Background')
      .map(audio => audio.url);
    const voiceAudios = audioSelections
      .filter(audio => audio.isActive && audio.type === 'Voice')
      .map((audio, index) => ({ url: audio.url, groupIndex: index }));
    setSelectedBackgroundAudios(backgroundAudios);
    setSelectedVoiceAudios(voiceAudios);

    const calculateSceneDurations = async () => {
      const durations = Array(groups.length).fill(defaultDuration);
      await Promise.all(
        groups.map(async (group, groupIndex) => {
          if (group.layout === 'video-only' && group.items[0]?.type === 'video') {
            const isValid = await validateMediaUrl(group.items[0].url, 'video');
            if (isValid) {
              const duration = await new Promise(resolve => {
                const tempVideo = document.createElement('video');
                tempVideo.src = group.items[0].url;
                tempVideo.addEventListener('loadedmetadata', () => resolve(tempVideo.duration * 1000));
                tempVideo.addEventListener('error', () => resolve(defaultDuration));
              });
              durations[groupIndex] = Math.min(duration, defaultDuration);
            }
          } else if (voiceAudios[groupIndex]) {
            const isValid = await validateAudioDuration(voiceAudios[groupIndex].url);
            if (isValid) {
              const duration = await new Promise(resolve => {
                const tempAudio = new Audio(voiceAudios[groupIndex].url);
                tempAudio.addEventListener('loadedmetadata', () => resolve(tempAudio.duration * 1000));
                tempAudio.addEventListener('error', () => resolve(defaultDuration));
              });
              durations[groupIndex] = Math.min(duration, defaultDuration);
            }
          }
        })
      );
      setSceneDurations(durations);
    };
    if (groups.length > 0) {
      calculateSceneDurations();
    }
  }, [audioSelections, groups]);

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

  const validateMediaUrl = async (url, type) => {
    try {
      if (type === 'photo') {
        const img = new Image();
        img.src = url;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
      } else if (type === 'video' || type === 'audio') {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
      }
      return true;
    } catch {
      return false;
    }
  };

  const validateAudioDuration = async (url) => {
    try {
      const audio = new Audio(url);
      await new Promise((resolve, reject) => {
        audio.addEventListener('loadedmetadata', () => resolve(audio.duration));
        audio.addEventListener('error', () => reject());
      });
      return audio.duration <= 10;
    } catch {
      return false;
    }
  };

  // Save memory to database
  const handleSaveMemory = async () => {
    try {
      const memoryConfig = {
        userId: userEmail, //?.memoryMetadata?.createdBy,
        uid: uid, //memoryData?.uid,
        token: token,//memoryData?.token,
        memoryTitle: memoryData?.memoryMetadata?.title || 'Memory Collage',
        mediaItems,
        groups,
        audioSelections,
        sceneDurations,
        memoryMetadata: memoryData?.memoryMetadata || {},
        accessInformation: memoryData?.accessInformation || {},
      };

      const response = await fetch('/api/mongoDb/uploadFiles/uploadDinamicCreation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(memoryConfig),
      });

      if (!response.ok) {
        throw new Error('Failed to save memory');
      }

      const result = await response.json();
      console.log(result);
      
      setSaveMessage(`Memory saved successfully! Access it at /memory/${result.memoryId}`);
      setTimeout(() => setSaveMessage(null), 5000);
    } catch (error) {
      setSaveMessage('Error saving memory. Please try again.');
      setTimeout(() => setSaveMessage(null), 5000);
    }
  };

  useEffect(() => {
    if (memoryData?.topics) {
      const items = [];
      const validateItems = async () => {
        for (const topic of Object.values(memoryData.topics)) {
          for (const photo of topic.photos || []) {
            if (await validateMediaUrl(photo.url, 'photo')) {
              items.push({ type: 'photo', url: photo.url, metadata: photo.metadata });
            }
          }
          for (const video of topic.videos || []) {
            if (await validateMediaUrl(video.url, 'video')) {
              items.push({ type: 'video', url: video.url, metadata: video.metadata });
            }
          }
        }
        setMediaItems(items.sort(() => Math.random() - 0.5));
      };
      validateItems();
    }
  }, [memoryData]);

  useEffect(() => {
    const createGroups = (items) => {
      const groups = [];
      let index = 0;
      while (index < items.length) {
        const remaining = items.length - index;
        const possibleLayouts = layouts.filter(l => l.count <= remaining);
        if (!possibleLayouts.length) break;
        const isVideoOnly = items[index].type === 'video' && Math.random() < 0.3;
        const layout = isVideoOnly
          ? layouts.find(l => l.type === 'video-only')
          : possibleLayouts[Math.floor(Math.random() * possibleLayouts.length)];
        groups.push({ layout: layout.type, items: items.slice(index, index + layout.count) });
        index += layout.count;
      }
      return groups;
    };
    const newGroups = createGroups(mediaItems);
    setGroups(newGroups);
    setCurrentGroupIndex(0);
  }, [mediaItems]);

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
          // Video has started playing
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
          // Audio has started playing
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
        // Fallback to default duration if no voice audio
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
        // Check if voice audio or video-only video is playing
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
        // Skip voice audio for video-only scenes
        voiceAudioRef.current.pause();
        voiceAudioRef.current.currentTime = 0;
      } else if (currentVoiceAudio) {
        validateAudioDuration(currentVoiceAudio.url).then(isValid => {
          if (isValid) {
            voiceAudioRef.current.src = currentVoiceAudio.url;
            voiceAudioRef.current.currentTime = 0;
            voiceAudioRef.current.play().catch(() => console.log('Voice audio play failed:', currentVoiceAudio.url));
            if (backgroundAudioRef.current) {
              backgroundAudioRef.current.volume = 0.2;
            }
          } else {
            console.log('Voice audio duration exceeds scene duration:', currentVoiceAudio.url);
            voiceAudioRef.current.pause();
            voiceAudioRef.current.currentTime = 0;
            if (backgroundAudioRef.current) {
              backgroundAudioRef.current.volume = 1.0;
            }
          }
        });

        voiceAudioRef.current.addEventListener('ended', () => {
          if (backgroundAudioRef.current) {
            backgroundAudioRef.current.volume = 1.0;
          }
        }, { once: true });
      } else {
        voiceAudioRef.current.pause();
        voiceAudioRef.current.currentTime = 0;
        if (backgroundAudioRef.current) {
          backgroundAudioRef.current.volume = 1.0;
        }
      }

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

  // Preview audio control
  const handlePreviewAudio = (url) => {
    if (previewAudioRef.current) {
      if (currentPreviewUrl === url && !previewAudioRef.current.paused) {
        previewAudioRef.current.pause();
        previewAudioRef.current.currentTime = 0;
        setCurrentPreviewUrl(null);
      } else {
        if (currentPreviewUrl !== null) {
          previewAudioRef.current.pause();
          previewAudioRef.current.currentTime = 0;
        }
        previewAudioRef.current.src = url;
        previewAudioRef.current.play().catch(() => console.log('Preview audio play failed:', url));
        setCurrentPreviewUrl(url);
      }
    }
  };

  // Stop preview audio when modal opens
  useEffect(() => {
    if (isModalOpen && previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
      setCurrentPreviewUrl(null);
    }
  }, [isModalOpen]);

  const handleAudioSelectionChange = (url, field, value) => {
    setAudioSelections(prev =>
      prev.map(audio =>
        audio.url === url ? { ...audio, [field]: value } : audio
      )
    );
  };

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
      <h3>Select Audios for Collage</h3>
      <div className="audio-selection">
        {audioSelections.length > 0 ? (
          audioSelections.map(audio => (
            <div key={audio.url} className="audio-item">
              <label>
                <input
                  type="checkbox"
                  checked={audio.isActive}
                  onChange={e => handleAudioSelectionChange(audio.url, 'isActive', e.target.checked)}
                />
                {audio.url.split('/').pop()}
              </label>
              <button
                className="preview-button"
                onClick={() => handlePreviewAudio(audio.url)}
              >
                {currentPreviewUrl === audio.url && !previewAudioRef.current?.paused ? 'Stop' : 'Play'}
              </button>
              {audio.isActive && (
                <div className="audio-type-buttons">
                  <button
                    className={`audio-type-button ${audio.type === 'Background' ? 'active' : ''}`}
                    onClick={() => handleAudioSelectionChange(audio.url, 'type', 'Background')}
                  >
                    Background
                  </button>
                  <button
                    className={`audio-type-button ${audio.type === 'Voice' ? 'active' : ''}`}
                    onClick={() => handleAudioSelectionChange(audio.url, 'type', 'Voice')}
                  >
                    Voice
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <p>No audios available.</p>
        )}
      </div>
      <button className="open-collage-button" onClick={handleOpenModal}>
        Open Memory Collage
      </button>
      <button className="save-memory-button" onClick={handleSaveMemory}>
        Save Memory
      </button>
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
              {saveMessage && (
                <div className="save-message">
                  {saveMessage}
                </div>
              )}
            </div>
            {memoryData?.accessAllowed ? (
              mediaItems.length > 0 ? (
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
              <div className="no-access">You do not have permission to view this content.</div>
            )}
            <audio ref={backgroundAudioRef} style={{ display: 'none' }} />
            <audio ref={voiceAudioRef} style={{ display: 'none' }} />
          </div>
        </div>,
        modalRootRef.current
      )}
      <audio ref={previewAudioRef} style={{ display: 'none' }} />
    </div>
  );

  return (
    <GeneralMold
      pageTitle={memoryData?.memoryMetadata?.title || 'Memory Collage'}
      pageDescription={memoryData?.memoryMetadata?.description || 'A collection of your memories'}
      rightContent={rightContent}
      visibility={memoryData?.accessInformation?.view?.visibility || 'private'}
      owner={memoryData?.memoryMetadata?.createdBy}
      metaKeywords="memory collage, photos, videos, memories"
      error={memoryData?.accessInformation?.reason || ''}
      initialData={memoryData}
      setInitialData={setMemoryData}
      setUidChild={setUid}
      setUserEmailChild={setUserEmail}
      setTokenChild={setToken}
    />
  );
};

export default CollageDisplay;