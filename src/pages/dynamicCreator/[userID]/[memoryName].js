/*'use client';

import React, { useState, useEffect, useRef } from 'react';
import GeneralMold from '@/components/complex/generalMold';
import '../../../estilos/general/dynamicCreator.css';
import TogglePlayPause from '@/components/complex/TogglePlayPause';
import { useRouter } from 'next/navigation';
import MemoryCollageModal from '@/components/complex/memoryCollageModal';

const CollageDisplay = () => {
  const [mediaItems, setMediaItems] = useState([]);
  const [groups, setGroups] = useState([]);
  const [memoryData, setMemoryData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [audioSelections, setAudioSelections] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [failMessage, setFailMessage] = useState('');
  const [uid, setUid] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [token, setToken] = useState('');
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [criticalError, setCriticalError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPlayingAudio, setCurrentPlayingAudio] = useState(null);
  const defaultDuration = 3000; // Fallback duration if no audio/video metadata
  const router = useRouter();
  const audioRef = useRef(null);

  const layouts = [
    { type: 'single', count: 1 },
    { type: 'double', count: 2 },
    { type: 'triple', count: 3 },
    { type: 'quad', count: 4 },
    { type: 'video-only', count: 1 },
  ];

  // Reset to home on critical error
  useEffect(() => {
    if (criticalError) {
      console.error('Critical error occurred:', criticalError);
      setFailMessage('Critical error occurred: ' + criticalError);
      router.push('/');
    }
  }, [criticalError, router]);

  // Validate media URL
  const validateMediaUrl = async (url, type) => {
    try {
      if (type === 'photo') {
        const img = new Image();
        img.src = url;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => reject(new Error('Image failed to load'));
        });
      } else if (type === 'video' || type === 'audio') {
        const response = await fetch(url, { method: 'HEAD' });
        if (!response.ok) throw new Error(`${type} URL not accessible`);
        const media = type === 'video' ? document.createElement('video') : new Audio();
        media.src = url;
        await new Promise((resolve, reject) => {
          media.onloadedmetadata = resolve;
          media.onerror = () => reject(new Error(`${type} failed to load metadata`));
        });
        if (type === 'audio' || type === 'video') return media.duration * 1000; // Return duration in milliseconds
      }
      return true;
    } catch (error) {
      console.log(`Validation failed for ${type} at ${url}:`, error.message);
      return false;
    }
  };

  // Initialize audio selections from memoryData with validation
  useEffect(() => {
    if (memoryData?.topics) {
      const validateAudios = async () => {
        const audios = [];
        for (const topic of Object.values(memoryData.topics)) {
          for (const audio of topic.audios || []) {
            const duration = await validateMediaUrl(audio.url, 'audio');
            if (duration) {
              audios.push({
                url: audio.url,
                isActive: false,
                type: 'Background',
                duration: duration / 1000, // Store duration in seconds
              });
            }
          }
          for (const video of topic.videos || []) {
            if (video.audioUrl) {
              const duration = await validateMediaUrl(video.audioUrl, 'audio');
              if (duration) {
                audios.push({
                  url: video.audioUrl,
                  isActive: false,
                  type: 'Voice',
                  duration: duration / 1000, // Store duration in seconds
                });
              }
            }
          }
        }
        setAudioSelections(audios);
        setIsDataLoaded(true);
      };
      validateAudios();
    }
  }, [memoryData]);

  // Validate and set media items
  useEffect(() => {
    if (memoryData?.topics) {
      const validateItems = async () => {
        const items = [];
        for (const topic of Object.values(memoryData.topics)) {
          for (const photo of topic.photos || []) {
            if (await validateMediaUrl(photo.url, 'photo')) {
              items.push({ type: 'photo', url: photo.url, metadata: photo.metadata });
            }
          }
          for (const video of topic.videos || []) {
            const duration = await validateMediaUrl(video.url, 'video');
            if (duration) {
              items.push({ type: 'video', url: video.url, metadata: { ...video.metadata, duration: duration / 1000 } });
            }
          }
        }
        setMediaItems(items.sort(() => Math.random() - 0.5));
        setIsDataLoaded(true);
      };
      validateItems();
    }
  }, [memoryData]);

  // Create groups
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
        const groupItems = items.slice(index, index + layout.count);
        if (groupItems.length > 0) {
          groups.push({ layout: layout.type, items: groupItems });
        }
        index += layout.count;
      }
      if (groups.length === 0 && items.length > 0) {
        groups.push({ layout: 'single', items: [items[0]] });
      }
      return groups;
    };
    const newGroups = createGroups(mediaItems);
    setGroups(newGroups);
  }, [mediaItems]);

  // Calculate scene durations dynamically
  const calculateSceneDurations = () => {
    return groups.map((group, index) => {
      const voiceAudio = audioSelections.find(a => a.type === 'Voice' && a.isActive && a.groupIndex === index);
      if (voiceAudio?.duration) {
        return voiceAudio.duration * 1000; // Convert to milliseconds
      } else if (group.layout === 'video-only' && group.items[0]?.type === 'video') {
        return (group.items[0].metadata?.duration || defaultDuration) * 1000;
      }
      return defaultDuration;
    });
  };

  // Save memory to database
  const handleSaveMemory = async () => {
    setIsSaving(true);
    try {
      const memoryConfig = {
        userId: userEmail,
        uid: uid,
        token: token,
        memoryTitle: memoryData?.memoryMetadata?.title || 'Memory Collage',
        mediaItems,
        groups,
        audioSelections,
        sceneDurations: calculateSceneDurations(),
        memoryMetadata: memoryData?.memoryMetadata || {},
        accessInformation: memoryData?.accessInformation || {},
      };

      const response = await fetch('/api/mongoDb/uploadFiles/uploadDinamicCreation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memoryConfig),
      });

      if (!response.ok) throw new Error('Failed to save memory');
      const result = await response.json();
      setSuccessMessage(`Memory saved successfully!`);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      setFailMessage('Error saving memory. Please try again.');
      setTimeout(() => setFailMessage(''), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAudioSelectionChange = (url, field, value) => {
    setAudioSelections(prev =>
      prev.map((audio, index) =>
        audio.url === url
          ? { ...audio, [field]: value, groupIndex: field === 'type' && value === 'Voice' ? index : audio.groupIndex }
          : audio
      )
    );
  };

  const handlePlayAudio = (url) => {
    if (currentPlayingAudio === url) {
      audioRef.current.pause();
      setCurrentPlayingAudio(null);
    } else {
      if (currentPlayingAudio) {
        audioRef.current.pause();
      }
      audioRef.current.src = url;
      audioRef.current.play().catch(() => {
        setFailMessage('Audio playback failed');
      });
      setCurrentPlayingAudio(url);
    }
  };

  const handleOpenModal = () => {
    if (groups.length === 0) {
      setFailMessage('No valid media items to display.');
      setTimeout(() => setFailMessage(''), 5000);
      return;
    }
    // Detener todos los audios en uso al abrir el modal
    if (audioRef.current && currentPlayingAudio) {
      audioRef.current.pause();
      setCurrentPlayingAudio(null);
    }
    setIsModalOpen(true);
  };

  const sceneDurations = calculateSceneDurations();

  // Función para obtener el nombre del archivo sin extensión
  const getFileNameWithoutExtension = (url) => {
    const fileName = url.split('/').pop();
    return fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
  };

  const rightContent = (
    <div className="collage-pre-container">
      <div style={{ width: '100vw' }}>
        <h3 style={{ paddingBottom: '20px' }}>{memoryData?.memoryMetadata?.title || 'Memory Collage'}</h3>
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
                  {getFileNameWithoutExtension(audio.url)}
                </label>
                <button
                  className="preview-button"
                  onClick={() => handlePlayAudio(audio.url)}
                >
                  {currentPlayingAudio === audio.url ? 'Stop' : 'Play'}
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
      </div>
      <div style={{ width: '100vw' }}>
        {isDataLoaded && (
          <>
            <button className="open-collage-button" onClick={handleOpenModal}>
              Open Memory Collage
            </button>
            <button
              className={`save-memory-button ${isSaving ? 'loading' : ''}`}
              onClick={handleSaveMemory}
              disabled={isSaving}
            >
              {isSaving && <span className="spinner"></span>}
              {isSaving ? 'Saving...' : 'Save Memory'}
            </button>
          </>
        )}
      </div>
      <MemoryCollageModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        memoryData={memoryData}
        dynamicMemoryID={null}
        groups={groups}
        sceneDurations={sceneDurations}
        audioSelections={audioSelections}
        defaultDuration={defaultDuration}
        PlayPauseComponent={TogglePlayPause}
        setFailMessage={setFailMessage}
      />
      <audio ref={audioRef} style={{ display: 'none' }} />
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
      successMessage={successMessage}
      failMessage={failMessage}
    />
  );
};

export default CollageDisplay;*/




import React, { useState, useEffect, useRef } from 'react';
import GeneralMold from '@/components/complex/generalMold';
import '../../../estilos/general/dynamicCreator.css';
import TogglePlayPause from '@/components/complex/TogglePlayPause';
import { useRouter } from 'next/navigation';
import MemoryCollageModal from '@/components/complex/memoryCollageModal';

const CollageDisplay = () => {
  const [mediaItems, setMediaItems] = useState([]);
  const [groups, setGroups] = useState([]);
  const [memoryData, setMemoryData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [audioSelections, setAudioSelections] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [failMessage, setFailMessage] = useState('');
  const [uid, setUid] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [token, setToken] = useState('');
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [criticalError, setCriticalError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPlayingAudio, setCurrentPlayingAudio] = useState(null);
  const defaultDuration = 3000; // Fallback duration if no audio/video metadata
  const router = useRouter();
  const audioRef = useRef(null);

  const layouts = [
    { type: 'single', count: 1 },
    { type: 'double', count: 2 },
    { type: 'triple', count: 3 },
    { type: 'quad', count: 4 },
    { type: 'video-only', count: 1 },
  ];


  
  /*useEffect(() => {
    if(!userEmail){ //
      const path = window.location.pathname;
      localStorage.setItem('redirectPath', path);
      localStorage.setItem('reason', 'userEmailValidationOnly');
      router.push('/login');
    }
  }, []);*/



  // Reset to home on critical error
  useEffect(() => {
    if (criticalError) {
      console.error('Critical error occurred:', criticalError);
      setFailMessage('Critical error occurred: ' + criticalError);
      router.push('/');
    }
  }, [criticalError, router]);

  // Validate media URL
  const validateMediaUrl = async (url, type) => {
    try {
      if (type === 'photo') {
        const img = new Image();
        img.src = url;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => reject(new Error('Image failed to load'));
        });
      } else if (type === 'video' || type === 'audio') {
        const response = await fetch(url, { method: 'HEAD' });
        if (!response.ok) throw new Error(`${type} URL not accessible`);
        const media = type === 'video' ? document.createElement('video') : new Audio();
        media.src = url;
        await new Promise((resolve, reject) => {
          media.onloadedmetadata = resolve;
          media.onerror = () => reject(new Error(`${type} failed to load metadata`));
        });
        if (type === 'audio' || type === 'video') return media.duration * 1000; // Return duration in milliseconds
      }
      return true;
    } catch (error) {
      console.log(`Validation failed for ${type} at ${url}:`, error.message);
      return false;
    }
  };

  // Initialize audio selections from memoryData with validation
  useEffect(() => {
    if (memoryData?.topics) {
      const validateAudios = async () => {
        const audios = [];
        // Collect all audios from all topics
        const allTopics = Object.values(memoryData.topics);
        const allAudios = allTopics.flatMap(topic => [
          ...(topic.audios || []),
          ...(topic.videos?.filter(video => video.audioUrl).map(video => ({
            url: video.audioUrl,
            metadata: video.metadata,
          })) || []),
        ]);

        // Remove duplicates based on URL
        const uniqueAudios = Array.from(new Map(allAudios.map(audio => [audio.url, audio])).values());

        for (const audio of uniqueAudios) {
          const duration = await validateMediaUrl(audio.url, 'audio');
          audios.push({
            url: audio.url,
            isActive: false,
            type: 'Background', // Default type
            duration: duration ? duration / 1000 : null, // Store duration in seconds if valid
            isValid: !!duration, // Flag to indicate if audio is valid
          });
        }

        setAudioSelections(audios);
        setIsDataLoaded(true);

        // Notify user if some audios are invalid
        const invalidCount = audios.filter(audio => !audio.isValid).length;
        if (invalidCount > 0) {
          setFailMessage(`Some audios (${invalidCount}) are not available due to validation errors.`);
          setTimeout(() => setFailMessage(''), 5000);
        }
      };
      validateAudios();
    }
  }, [memoryData]);

  // Validate and set media items
  useEffect(() => {
    if (memoryData?.topics) {
      const validateItems = async () => {
        const items = [];
        for (const topic of Object.values(memoryData.topics)) {
          for (const photo of topic.photos || []) {
            if (await validateMediaUrl(photo.url, 'photo')) {
              items.push({ type: 'photo', url: photo.url, metadata: photo.metadata });
            }
          }
          for (const video of topic.videos || []) {
            const duration = await validateMediaUrl(video.url, 'video');
            if (duration) {
              items.push({ type: 'video', url: video.url, metadata: { ...video.metadata, duration: duration / 1000 } });
            }
          }
        }
        setMediaItems(items.sort(() => Math.random() - 0.5));
        setIsDataLoaded(true);
      };
      validateItems();
    }
  }, [memoryData]);

  // Create groups
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
        const groupItems = items.slice(index, index + layout.count);
        if (groupItems.length > 0) {
          groups.push({ layout: layout.type, items: groupItems });
        }
        index += layout.count;
      }
      if (groups.length === 0 && items.length > 0) {
        groups.push({ layout: 'single', items: [items[0]] });
      }
      return groups;
    };
    const newGroups = createGroups(mediaItems);
    setGroups(newGroups);
  }, [mediaItems]);

  // Calculate scene durations dynamically
  const calculateSceneDurations = () => {
    return groups.map((group, index) => {
      const voiceAudio = audioSelections.find(a => a.type === 'Voice' && a.isActive && a.groupIndex === index);
      if (voiceAudio?.duration) {
        return voiceAudio.duration * 1000; // Convert to milliseconds
      } else if (group.layout === 'video-only' && group.items[0]?.type === 'video') {
        return (group.items[0].metadata?.duration || defaultDuration) * 1000;
      }
      return defaultDuration;
    });
  };

  // Save memory to database
  const handleSaveMemory = async () => {
    setIsSaving(true);
    try {
      const memoryConfig = {
        userId: userEmail,
        uid: uid,
        token: token,
        memoryTitle: memoryData?.memoryMetadata?.title || 'Memory Collage',
        mediaItems,
        groups,
        audioSelections,
        sceneDurations: calculateSceneDurations(),
        memoryMetadata: memoryData?.memoryMetadata || {},
        accessInformation: memoryData?.accessInformation || {},
      };

      const response = await fetch('/api/mongoDb/uploadFiles/uploadDinamicCreation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memoryConfig),
      });

      if (!response.ok) throw new Error('Failed to save memory');
      const result = await response.json();
      setSuccessMessage(`Memory saved successfully!`);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      setFailMessage('Error saving memory. Please try again.');
      setTimeout(() => setFailMessage(''), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAudioSelectionChange = (url, field, value) => {
    setAudioSelections(prev =>
      prev.map((audio, index) =>
        audio.url === url
          ? { ...audio, [field]: value, groupIndex: field === 'type' && value === 'Voice' ? index : audio.groupIndex }
          : audio
      )
    );
  };

  const handlePlayAudio = (url) => {
    if (currentPlayingAudio === url) {
      audioRef.current.pause();
      setCurrentPlayingAudio(null);
    } else {
      if (currentPlayingAudio) {
        audioRef.current.pause();
      }
      audioRef.current.src = url;
      audioRef.current.play().catch(() => {
        setFailMessage('Audio playback failed');
      });
      setCurrentPlayingAudio(url);
    }
  };

  const handleOpenModal = () => {
    if (groups.length === 0) {
      setFailMessage('No valid media items to display.');
      setTimeout(() => setFailMessage(''), 5000);
      return;
    }
    // Stop all audios when opening the modal
    if (audioRef.current && currentPlayingAudio) {
      audioRef.current.pause();
      setCurrentPlayingAudio(null);
    }
    setIsModalOpen(true);
  };

  const sceneDurations = calculateSceneDurations();

  // Function to get the file name without extension
  const getFileNameWithoutExtension = (url) => {
    const fileName = url.split('/').pop();
    return fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
  };

  const rightContent = (
    <div className="collage-pre-container">
      <div style={{ width: '100vw' }}>
        <h3 style={{ paddingBottom: '20px' }}>{memoryData?.memoryMetadata?.title || 'Memory Collage'}</h3>
        <h3>Select Audios for Collage</h3>
        <div className="audio-selection">
          {audioSelections.length > 0 ? (
            audioSelections.map((audio, index) => (
              <div key={`${audio.url}-${index}`} className={`audio-item ${!audio.isValid ? 'invalid' : ''}`}>
                <label>
                  <input
                    type="checkbox"
                    checked={audio.isActive}
                    onChange={e => audio.isValid && handleAudioSelectionChange(audio.url, 'isActive', e.target.checked)}
                    disabled={!audio.isValid}
                  />
                  {getFileNameWithoutExtension(audio.url)}
                  {!audio.isValid && <span className="invalid-audio"> (Unavailable)</span>}
                </label>
                <button
                  className="preview-button"
                  onClick={() => audio.isValid && handlePlayAudio(audio.url)}
                  disabled={!audio.isValid}
                >
                  {currentPlayingAudio === audio.url ? 'Stop' : 'Play'}
                </button>
                {audio.isActive && audio.isValid && (
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
      </div>
      <div style={{ width: '100vw' }}>
        {isDataLoaded && (
          <>
            <button className="open-collage-button" onClick={handleOpenModal}>
              Open Memory Collage
            </button>
            <button
              className={`save-memory-button ${isSaving ? 'loading' : ''}`}
              onClick={handleSaveMemory}
              disabled={isSaving}
            >
              {isSaving && <span className="spinner"></span>}
              {isSaving ? 'Saving...' : 'Save Memory'}
            </button>
          </>
        )}
      </div>
      <MemoryCollageModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        memoryData={memoryData}
        dynamicMemoryID={null}
        groups={groups}
        sceneDurations={sceneDurations}
        audioSelections={audioSelections}
        defaultDuration={defaultDuration}
        PlayPauseComponent={TogglePlayPause}
        setFailMessage={setFailMessage}
      />
      <audio ref={audioRef} style={{ display: 'none' }} />
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
      successMessage={successMessage}
      failMessage={failMessage}
    />
  );
};

export default CollageDisplay;









