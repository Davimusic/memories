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
  const [audioStates, setAudioStates] = useState([]); // [{url, isEnabled, isPlaying, type: 'background'|'voice', name}]
  const videoRefs = useRef([]);
  const audioRefs = useRef({});
  const modalRootRef = useRef(null);
  const [animationDuration, setAnimationDuration] = useState(10000); // Default 10s per group

  // Create modal root
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

  // Toggle body class for modal
  useEffect(() => {
    if (isModalOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
  }, [isModalOpen]);

  // Validate URL accessibility
  const validateMediaUrl = async (url, type) => {
    try {
      if (type === 'photo') {
        const img = new Image();
        img.src = url;
        await new Promise((resolve, reject) => {
          img.onload = () => resolve(true);
          img.onerror = () => reject(false);
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

  // Extract and validate photos, videos, and audios from topics
  useEffect(() => {
    if (memoryData?.topics) {
      const items = [];
      const validateItems = async () => {
        for (const topic of Object.values(memoryData.topics)) {
          for (const photo of topic.photos || []) {
            const isValid = await validateMediaUrl(photo.url, 'photo');
            if (isValid) {
              items.push({ type: 'photo', url: photo.url, metadata: photo.metadata });
            }
          }
          for (const video of topic.videos || []) {
            const isValid = await validateMediaUrl(video.url, 'video');
            if (isValid) {
              items.push({ type: 'video', url: video.url, metadata: video.metadata });
            }
          }
        }
        const shuffledItems = items.sort(() => Math.random() - 0.5);
        setMediaItems(shuffledItems);
      };
      validateItems();

      // Initialize audio states
      const audios = getAvailableAudios();
      setAudioStates(
        audios.map((audio) => ({
          url: audio.url,
          isEnabled: false, // Default to disabled
          isPlaying: false,
          type: audio.metadata?.type === 'voices' ? 'voice' : 'background',
          name: audio.url.split('/').pop().replace(/\.[^/.]+$/, ''), // Extract filename without extension
        }))
      );
    }
  }, [memoryData]);

  // Group media items into sets of four
  useEffect(() => {
    const newGroups = [];
    for (let i = 0; i < mediaItems.length; i += 4) {
      newGroups.push(mediaItems.slice(i, i + 4));
    }
    setGroups(newGroups);
    setCurrentGroupIndex(0);
  }, [mediaItems]);

  // Adjust animation duration based on selected background audio
  useEffect(() => {
    const selectedBackground = audioStates.find((audio) => audio.isEnabled && audio.type === 'background' && audio.isPlaying);
    if (selectedBackground && audioRefs.current[selectedBackground.url]) {
      const audio = new Audio(selectedBackground.url);
      audio.addEventListener('loadedmetadata', () => {
        const duration = audio.duration * 1000; // Convert to milliseconds
        setAnimationDuration(duration / groups.length || 10000);
      });
    } else {
      setAnimationDuration(10000); // Default to 10s
    }
  }, [audioStates, groups.length]);

  // Cycle through groups based on animation duration
  useEffect(() => {
    if (isPlaying && groups.length > 0) {
      const timer = setInterval(() => {
        setCurrentGroupIndex((prevIndex) => (prevIndex + 1) % groups.length);
      }, animationDuration);
      return () => clearInterval(timer);
    }
  }, [isPlaying, groups, animationDuration]);

  // Play videos and manage audio playback
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video) {
        const groupIndex = Math.floor(index / 4);
        if (groupIndex === currentGroupIndex && isModalOpen) {
          video.play().catch(() => console.log('Video play failed for', video.src));
        } else {
          video.pause();
        }
      }
    });

    // Manage audio playback for enabled audios
    audioStates.forEach((audio) => {
      const audioElement = audioRefs.current[audio.url];
      if (audioElement && audio.isEnabled) {
        audioElement.src = audio.url;
        if (audio.isPlaying && isModalOpen) {
          audioElement.play().catch(() => console.log(`Audio play failed for ${audio.url}`));
          if (audio.type === 'voice') {
            const backgroundAudios = audioStates.filter((a) => a.isEnabled && a.type === 'background' && a.isPlaying);
            backgroundAudios.forEach((bg) => {
              if (audioRefs.current[bg.url]) {
                audioRefs.current[bg.url].volume = 0.2;
              }
            });
          }
        } else {
          audioElement.pause();
          if (audio.type === 'background') {
            audioElement.volume = 1.0;
          }
        }
      }
    });
  }, [currentGroupIndex, isModalOpen, audioStates]);

  // Handle enable/disable audio
  const handleAudioEnable = (url) => {
    setAudioStates((prev) =>
      prev.map((audio) =>
        audio.url === url ? { ...audio, isEnabled: !audio.isEnabled, isPlaying: false } : audio
      )
    );
  };

  // Handle play/pause for an audio
  const handleAudioPlayPause = (url) => {
    setAudioStates((prev) =>
      prev.map((audio) => {
        if (audio.url === url && audio.isEnabled) {
          if (!audio.isPlaying) {
            // Pause all other audios
            Object.values(audioRefs.current).forEach((ref) => {
              if (ref.src !== url) {
                ref.pause();
                ref.volume = 1.0; // Reset volume for background audios
              }
            });
            return { ...audio, isPlaying: true };
          }
          return { ...audio, isPlaying: false };
        }
        return { ...audio, isPlaying: false };
      })
    );
  };

  // Handle audio type change
  const handleAudioTypeChange = (url, type) => {
    setAudioStates((prev) =>
      prev.map((audio) => (audio.url === url ? { ...audio, type } : audio))
    );
  };

  // Handle clicking an emoji to jump to a specific group
  const handleEmojiClick = (index) => {
    setCurrentGroupIndex(index);
    setIsPlaying(false);
  };

  // Toggle play/pause
  const handlePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };

  // Open/close modal
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsPlaying(false);
    Object.values(audioRefs.current).forEach((ref) => ref.pause());
  };

  // Get available audios
  const getAvailableAudios = () => {
    const audios = [];
    if (memoryData?.topics) {
      Object.values(memoryData.topics).forEach((topic) => {
        (topic.audios || []).forEach((audio) =>
          audios.push({
            url: audio.url,
            metadata: audio.metadata || {},
            type: audio.metadata?.type === 'voices' ? 'voices' : 'background',
          })
        );
      });
    }
    return audios;
  };

  const availableAudios = getAvailableAudios();

  const rightContent = (
    <div className="collage-pre-container">
      {availableAudios.length > 0 && (
        <div className="audio-selection">
          <h3>Audio Settings</h3>
          {availableAudios.map((audio, index) => (
            <div key={index} className="audio-option">
              <label>
                <input
                  type="checkbox"
                  checked={audioStates.find((a) => a.url === audio.url)?.isEnabled || false}
                  onChange={() => handleAudioEnable(audio.url)}
                />
                {audioStates.find((a) => a.url === audio.url)?.name}
              </label>
              <button
                onClick={() => handleAudioPlayPause(audio.url)}
                disabled={!audioStates.find((a) => a.url === audio.url)?.isEnabled}
                aria-label={audioStates.find((a) => a.url === audio.url)?.isPlaying ? 'Pause audio' : 'Play audio'}
              >
                {audioStates.find((a) => a.url === audio.url)?.isPlaying ? '⏸' : '▶'}
              </button>
              <select
                value={audioStates.find((a) => a.url === audio.url)?.type || 'background'}
                onChange={(e) => handleAudioTypeChange(audio.url, e.target.value)}
                disabled={!audioStates.find((a) => a.url === audio.url)?.isEnabled}
              >
                <option value="background">Background</option>
                <option value="voice">Voice</option>
              </select>
            </div>
          ))}
        </div>
      )}
      <button className="open-collage-button" onClick={handleOpenModal}>
        Open Memory Collage
      </button>
      {isModalOpen &&
        ReactDOM.createPortal(
          <div className="modalOverlay" onClick={handleCloseModal}>
            <div className="modalContentMemories" onClick={(e) => e.stopPropagation()}>
              <button onClick={handleCloseModal} className="closeButton">
                ×
              </button>
              <div className="collage-container">
                <h2 className="collage-title">
                  {memoryData?.memoryMetadata?.title || 'Memory Collage'}
                </h2>
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
                {memoryData?.accessAllowed ? (
                  mediaItems.length > 0 ? (
                    <div className="groups-wrapper">
                      {groups.map((group, groupIndex) => (
                        <div
                          key={groupIndex}
                          className={`group-container ${
                            groupIndex === currentGroupIndex ? 'visible' : 'hidden'
                          }`}
                        >
                          {group.map((item, index) => (
                            <div key={index} className="media-item">
                              {item.type === 'photo' ? (
                                <img
                                  src={item.url}
                                  alt={`Memory photo ${index + 1}`}
                                  className="media"
                                />
                              ) : (
                                <video
                                  ref={(el) => (videoRefs.current[groupIndex * 4 + index] = el)}
                                  src={item.url}
                                  muted
                                  controls
                                  className="media"
                                >
                                  Your browser does not support the video tag.
                                </video>
                              )}
                            </div>
                          ))}
                          {group.length < 4 &&
                            Array.from({ length: 4 - group.length }).map((_, index) => (
                              <div
                                key={`placeholder-${index}`}
                                className="media-item placeholder"
                              />
                            ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-media">
                      No media items available.
                    </div>
                  )
                ) : (
                  <div className="no-access">
                    You do not have permission to view this content.
                  </div>
                )}
              </div>
              {audioStates
                .filter((audio) => audio.isEnabled)
                .map((audio, index) => (
                  <audio
                    key={index}
                    ref={(el) => (audioRefs.current[audio.url] = el)}
                    style={{ display: 'none' }}
                    onEnded={() => {
                      if (audio.type === 'voice') {
                        audioStates
                          .filter((a) => a.isEnabled && a.type === 'background' && a.isPlaying)
                          .forEach((bg) => {
                            if (audioRefs.current[bg.url]) {
                              audioRefs.current[bg.url].volume = 1.0;
                            }
                          });
                      }
                      setAudioStates((prev) =>
                        prev.map((a) => (a.url === audio.url ? { ...a, isPlaying: false } : a))
                      );
                    }}
                  />
                ))}
            </div>
          </div>,
          modalRootRef.current
        )}
    </div>
  );

  return (
    <GeneralMold
      pageTitle={memoryData?.memoryMetadata?.title || 'Memory Collage'}
      pageDescription={
        memoryData?.memoryMetadata?.description || 'A collection of your memories'
      }
      rightContent={rightContent}
      visibility={memoryData?.accessInformation?.view?.visibility || 'private'}
      owner={memoryData?.memoryMetadata?.createdBy}
      metaKeywords="memory collage, photos, videos, memories"
      error={memoryData?.accessInformation?.reason || ''}
      initialData={memoryData}
      setInitialData={setMemoryData}
    />
  );
};

export default CollageDisplay;





