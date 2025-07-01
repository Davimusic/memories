'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import GeneralMold from '@/components/complex/generalMold';
import MemoryCollageModal from '@/components/complex/memoryCollageModal';
import Comments from '@/components/complex/comments';
import '../../../../estilos/general/dynamicCreator.css';

const MemoryViewer = () => {
  const [memoryData, setMemoryData] = useState(null);
  const [groups, setGroups] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [audioSelections, setAudioSelections] = useState([]);
  const [sceneDurations, setSceneDurations] = useState([]);
  const [comments, setComments] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const defaultDuration = 10000; // 10 seconds

  const router = useRouter();
  const { dynamicMemoryID, memoryID } = router.query;
  // Assume userId is obtained from auth context or session
  const userId = 'user@example.com'; // Replace with actual user authentication logic

  const layouts = [
    { type: 'single', count: 1 },
    { type: 'double', count: 2 },
    { type: 'triple', count: 3 },
    { type: 'quad', count: 4 },
    { type: 'video-only', count: 1 },
  ];

  // Fetch comments when memoryData and dynamicMemoryID are available
  useEffect(() => {
    if (!memoryData || !dynamicMemoryID || !memoryID) return;

    const fetchComments = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/memories/${memoryID}/${dynamicMemoryID}/comments`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, uid: userId, token: 'user-token' }), // Replace with actual token
        });
        const data = await response.json();
        if (data.success) {
          setComments(data.comments || []);
        } else {
          setError(data.message || 'Failed to fetch comments');
        }
      } catch (err) {
        setError('Error fetching comments: ' + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComments();
  }, [memoryData, dynamicMemoryID, memoryID, userId]);

  // Initialize data and open modal when memoryData is received
  useEffect(() => {
    if (!memoryData || !dynamicMemoryID) return;

    const dynamicMemory = memoryData.dynamicMemories[dynamicMemoryID];
    if (!dynamicMemory) {
      setError('Memory data not available.');
      setIsModalOpen(false);
      return;
    }

    const groups = dynamicMemory.groups || [];
    // Validate groups to ensure video-only layouts contain videos
    const validatedGroups = groups.map(group => ({
      ...group,
      items: group.layout === 'video-only' ? group.items.filter(item => item.type === 'video') : group.items,
    })).filter(group => group.items.length > 0); // Remove empty groups

    setGroups(validatedGroups);
    // Enable first background audio if none are active
    const updatedAudioSelections = dynamicMemory.audioSelections || [];
    if (!updatedAudioSelections.some(audio => audio.isActive && audio.type === 'Background')) {
      const firstBackground = updatedAudioSelections.find(audio => audio.type === 'Background');
      if (firstBackground) {
        firstBackground.isActive = true;
      }
    }
    setAudioSelections(updatedAudioSelections);
    // Set default durations if sceneDurations is empty
    setSceneDurations(
      dynamicMemory.sceneDurations.length > 0
        ? dynamicMemory.sceneDurations
        : validatedGroups.map(() => defaultDuration)
    );
    setIsModalOpen(true);
  }, [memoryData, dynamicMemoryID]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const rightContent = (
    <div className="collage-pre-container">
      <div style={{ display: 'block' }}>
        <h3>{memoryData?.memoryMetadata?.title || 'Memory Collage'}</h3>
        <p>{memoryData?.memoryMetadata?.description || 'No description available.'}</p>
      </div>
      {isLoading && <p>Loading memory data...</p>}
      {error && <p className="error-message">{error}</p>}
      {!isLoading && !error && (
        <button className="open-collage-button" onClick={handleOpenModal}>
          View Memory Collage
        </button>
      )}
      <MemoryCollageModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        memoryData={memoryData}
        dynamicMemoryID={dynamicMemoryID}
        groups={groups}
        sceneDurations={sceneDurations}
        audioSelections={audioSelections}
        defaultDuration={defaultDuration}
      />
      <Comments
        commentsData={comments}
        endpoint={`/api/mongoDb/uploadFiles/uploadComment`}
        userId={userId}
        memoryId={memoryID}
      />
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