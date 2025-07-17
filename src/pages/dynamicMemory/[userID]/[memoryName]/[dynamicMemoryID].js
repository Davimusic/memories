/*'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import GeneralMold from '@/components/complex/generalMold';
import MemoryCollageModal from '@/components/complex/memoryCollageModal';
import Comments from '@/components/complex/comments';
import QRIcon from '@/components/complex/icons/qrIcon';
import QRGenerator from '@/components/complex/QRGenerator';
import QRCodeStyling from 'qr-code-styling';
import '../../../../estilos/general/dynamicCreator.css';

const MemoryViewer = () => {
  const [memoryData, setMemoryData] = useState(null);
  const [groups, setGroups] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [audioSelections, setAudioSelections] = useState([]);
  const [sceneDurations, setSceneDurations] = useState([]);
  const [comments, setComments] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState(null);
  const [Uid, setUid] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const defaultDuration = 10000;

  const router = useRouter();
  const { dynamicMemoryID, memoryID, memoryName } = router.query;
  const userId = userEmail;
  const qrCodeRef = useRef(null);

  const layouts = [
    { type: 'single', count: 1 },
    { type: 'double', count: 2 },
    { type: 'triple', count: 3 },
    { type: 'quad', count: 4 },
    { type: 'video-only', count: 1 },
  ];

  // Get current URL for QR code
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Initialize QRCodeStyling instance
  useEffect(() => {
    if (!qrCodeRef.current) {
      qrCodeRef.current = new QRCodeStyling({
        width: 250,
        height: 250,
        data: currentUrl,
        dotsOptions: { color: '#000000', type: 'rounded' },
        cornersSquareOptions: { type: 'extra-rounded' },
        backgroundOptions: { color: '#ffffff' },
        imageOptions: { crossOrigin: 'anonymous', margin: 5 },
      });
    } else {
      qrCodeRef.current.update({ data: currentUrl });
    }
  }, [currentUrl]);

  useEffect(() => {
    const dynamicMemory = memoryData?.dynamicMemories?.[dynamicMemoryID];
    console.log(dynamicMemory);
    
    if (dynamicMemory?.comments) {
      setComments(dynamicMemory.comments);
    }

    if (!memoryData || !dynamicMemoryID || !memoryID || !userEmail) return;

    const fetchComments = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/memories/${memoryID}/${dynamicMemoryID}/comments`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        console.log('Fetched comments:', data);
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
  }, [memoryData, dynamicMemoryID, memoryID, userEmail, token]);

  useEffect(() => {
    if (!memoryData || !dynamicMemoryID) return;

    const dynamicMemory = memoryData.dynamicMemories[dynamicMemoryID];
    if (!dynamicMemory) {
      setError('Memory data not available.');
      setIsModalOpen(false);
      return;
    }

    const groups = dynamicMemory.groups || [];
    const validatedGroups = groups
      .map((group) => ({
        ...group,
        items: group.layout === 'video-only' ? group.items.filter((item) => item.type === 'video') : group.items,
      }))
      .filter((group) => group.items.length > 0);

    setGroups(validatedGroups);
    const updatedAudioSelections = dynamicMemory.audioSelections || [];
    if (!updatedAudioSelections.some((audio) => audio.isActive && audio.type === 'Background')) {
      const firstBackground = updatedAudioSelections.find((audio) => audio.type === 'Background');
      if (firstBackground) {
        firstBackground.isActive = true;
      }
    }
    setAudioSelections(updatedAudioSelections);
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

  const handleOpenQRModal = () => {
    setIsQRModalOpen(true);
  };

  const handleCloseQRModal = () => {
    setIsQRModalOpen(false);
  };

  const handleDownloadQR = () => {
    if (qrCodeRef.current) {
      qrCodeRef.current.download({ name: `memory-${memoryData?.memoryMetadata?.title || 'qr'}`, extension: 'png' });
    }
  };

  const handleShareQR = async () => {
    if (navigator.share) {
      try {
        const qrBlob = await new Promise((resolve) => {
          qrCodeRef.current.getRawData('png').then((blob) => {
            resolve(blob);
          });
        });

        const qrFile = new File([qrBlob], `memory-qr-${memoryData?.memoryMetadata?.title || 'qr'}.png`, {
          type: 'image/png',
        });

        await navigator.share({
          title: memoryData?.memoryMetadata?.title || 'Memory Collage',
          text: memoryData?.memoryMetadata?.description || 'Check out this memory!',
          url: currentUrl,
          files: [qrFile],
        });
      } catch (err) {
        console.error('Share failed:', err);
        alert('Sharing failed. You can copy the URL: ' + currentUrl);
      }
    } else {
      alert('Sharing is not supported on this device/browser. You can copy the URL: ' + currentUrl);
    }
  };

  const rightContent = (
    <div className="collage-pre-container">
      <div style={{ width: '100%', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
  <h3 style={{ margin: 0 }}>{memoryData?.memoryMetadata?.title || 'Memory Collage'}</h3>
  <QRIcon size={24} onClick={handleOpenQRModal} />
</div>
<p>{memoryData?.memoryMetadata?.description || 'No description available.'}</p>

      {isLoading && <p>Loading memory data...</p>}
      {error && <p className="error-message">{error}</p>}
      {!isLoading && !error && (
        <>
          <Comments
            commentsData={comments}
            endpoint={`/api/mongoDb/comments/uploadComment`}
            userId={userEmail}
            memoryId={memoryName}
            uniqueMemoryId={dynamicMemoryID}
            token={token}
            uid={Uid}
            root="dynamicMemory"
          />
          <button className="open-collage-button" onClick={handleOpenModal}>
            View Memory Collage
          </button>
        </>
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
      {isQRModalOpen && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
          onClick={handleCloseQRModal}
        >
          <div
            className="modalContentMemories"
            style={{
              
              padding: '20px',
              borderRadius: '8px',
              maxWidth: '400px',
              width: '90%',
              textAlign: 'center',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleCloseQRModal}
              className="closeButton"
            >
              ×
            </button>
            <h3>Share this Memory</h3>
            <QRGenerator
              value={currentUrl}
              width={250}
              height={250}
              dotsColor="#000000"
              bgColor="#ffffff"
              dotsType="rounded"
              cornersType="extra-rounded"
            />
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '20px' }}>
              <button
                onClick={handleDownloadQR}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Download
              </button>
              <button
                onClick={handleShareQR}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Share
              </button>
            </div>
          </div>
        </div>
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
      setTokenChild={setToken}
      setUserEmailChild={setUserEmail}
      setUidChild={setUid}
    />
  );
};

export default MemoryViewer;*/




'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import GeneralMold from '@/components/complex/generalMold';
import MemoryCollageModal from '@/components/complex/memoryCollageModal';
import Comments from '@/components/complex/comments';
import QRIcon from '@/components/complex/icons/qrIcon';
import QRGenerator from '@/components/complex/QRGenerator';
import TogglePlayPause from '@/components/complex/TogglePlayPause';
import QRCodeStyling from 'qr-code-styling';
import '../../../../estilos/general/dynamicCreator.css';



// MemoryViewer Component
const MemoryViewer = () => {
  // Estados principales
  const [memoryData, setMemoryData] = useState(null);
  const [groups, setGroups] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [audioSelections, setAudioSelections] = useState([]);
  const [sceneDurations, setSceneDurations] = useState([]);
  const [comments, setComments] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState(null);
  const [Uid, setUid] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  //const [userID, setUserID] = useState(null);
  const defaultDuration = 10000;

  // Router y referencias
  const router = useRouter();
  const { dynamicMemoryID, userID, memoryName } = router.query;
  const qrCodeRef = useRef(null);

  console.log(dynamicMemoryID);
  console.log(userID);
  console.log(memoryName);
  

  // Layouts disponibles
  const layouts = [
    { type: 'single', count: 1 },
    { type: 'double', count: 2 },
    { type: 'triple', count: 3 },
    { type: 'quad', count: 4 },
    { type: 'video-only', count: 1 },
  ];

  // URL actual para el QR
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Inicialización del QR
  useEffect(() => {
    if (!qrCodeRef.current) {
      qrCodeRef.current = new QRCodeStyling({
        width: 250,
        height: 250,
        data: currentUrl,
        dotsOptions: { color: '#000000', type: 'rounded' },
        cornersSquareOptions: { type: 'extra-rounded' },
        backgroundOptions: { color: '#ffffff' },
        imageOptions: { crossOrigin: 'anonymous', margin: 5 },
      });
    } else {
      qrCodeRef.current.update({ data: currentUrl });
    }
  }, [currentUrl]);

  // Cargar comentarios
  useEffect(() => {
    const dynamicMemory = memoryData?.dynamicMemories?.[dynamicMemoryID];

    if (dynamicMemory?.comments) {
      setComments(dynamicMemory.comments);
    }

    if (!memoryData || !dynamicMemoryID || !userID || !userEmail) return;

    const fetchComments = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/memories/${memoryID}/${dynamicMemoryID}/comments`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
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
  }, [memoryData, dynamicMemoryID, userID, userEmail, token]);

  // Función para calcular duraciones de escena
  const calculateSceneDurations = (groups, audios) => {
    return groups.map((group, index) => {
      const voiceAudio = audios.find(
        (a) => a.isActive && a.type === 'Voice' && a.groupIndex === index
      );
      if (voiceAudio?.duration) {
        return voiceAudio.duration * 1000;
      } else if (group.layout === 'video-only' && group.items[0]?.type === 'video') {
        return (group.items[0].metadata?.duration || defaultDuration) * 1000;
      }
      return defaultDuration;
    });
  };

  // Cargar y preparar datos del recuerdo con validación de URLs
  useEffect(() => {
    if (!memoryData || !dynamicMemoryID) return;

    const dynamicMemory = memoryData.dynamicMemories[dynamicMemoryID];
    if (!dynamicMemory) {
      setError('Memory data not available.');
      setIsModalOpen(false);
      return;
    }

    // Validar y procesar grupos
    const validatedGroups = (dynamicMemory.groups || [])
      .map((group) => ({
        ...group,
        items: group.layout === 'video-only'
          ? group.items.filter((item) => item.type === 'video' && item.url && item.url.startsWith('http'))
          : group.items.filter((item) => item.url && item.url.startsWith('http')),
      }))
      .filter((group) => group.items.length > 0);

    if (validatedGroups.length === 0) {
      setError('No valid media items to display.');
      setIsModalOpen(false);
      return;
    }

    setGroups(validatedGroups);

    // Validar y procesar audioSelections
    const updatedAudioSelections = (dynamicMemory.audioSelections || []).map((audio) => {
      const isValid = !!audio.url && audio.url.startsWith('http');
      if (!isValid) {
        setError(`Invalid audio URL: ${audio.url || 'undefined'}`);
      }
      return {
        url: audio.url,
        isActive: audio.isActive !== undefined ? audio.isActive : false,
        type: audio.type || 'Background',
        duration: audio.duration || null,
        isValid,
        groupIndex: audio.groupIndex !== undefined ? audio.groupIndex : -1,
      };
    });

    // Activar un audio de fondo si no hay ninguno activo
    const hasActiveBackground = updatedAudioSelections.some(
      (a) => a.isActive && a.type === 'Background'
    );
    if (!hasActiveBackground) {
      const firstBackground = updatedAudioSelections.find((a) => a.type === 'Background');
      if (firstBackground) {
        firstBackground.isActive = true;
      }
    }

    setAudioSelections(updatedAudioSelections);

    // Calcular duraciones
    const durations = dynamicMemory.sceneDurations?.length > 0
      ? dynamicMemory.sceneDurations
      : calculateSceneDurations(validatedGroups, updatedAudioSelections);

    setSceneDurations(durations);
    setIsModalOpen(true);
  }, [memoryData, dynamicMemoryID]);

  // Handlers para el modal y QR
  const handleOpenModal = () => {
    if (groups.length === 0) {
      setError('No valid media items to display.');
      return;
    }
    setIsModalOpen(true);
  };

  const handleOpenQRModal = () => {
    setIsQRModalOpen(true);
  };

  const handleCloseQRModal = () => {
    setIsQRModalOpen(false);
  };

  const handleDownloadQR = () => {
    if (qrCodeRef.current) {
      qrCodeRef.current.download({
        name: `memory-${memoryData?.memoryMetadata?.title || 'qr'}`,
        extension: 'png',
      });
    }
  };

  const handleShareQR = async () => {
    if (navigator.share) {
      try {
        const qrBlob = await new Promise((resolve) => {
          qrCodeRef.current.getRawData('png').then((blob) => resolve(blob));
        });

        const qrFile = new File(
          [qrBlob],
          `memory-qr-${memoryData?.memoryMetadata?.title || 'qr'}.png`,
          { type: 'image/png' }
        );

        await navigator.share({
          title: memoryData?.memoryMetadata?.title || 'Memory Collage',
          text: memoryData?.memoryMetadata?.description || 'Check out this memory!',
          url: currentUrl,
          files: [qrFile],
        });
      } catch (err) {
        console.error('Share failed:', err);
        alert('Sharing failed. You can copy the URL: ' + currentUrl);
      }
    } else {
      alert('Sharing is not supported on this device/browser. You can copy the URL: ' + currentUrl);
    }
  };

  // Contenido del lado derecho
  const rightContent = (
    <div className="collage-pre-container">
      <div style={{ width: '100%', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
        <h3 style={{ margin: 0 }}>{memoryData?.memoryMetadata?.title || 'Memory Collage'}</h3>
        <QRIcon size={24} onClick={handleOpenQRModal} />
      </div>
      <p>{memoryData?.memoryMetadata?.description || 'No description available.'}</p>

      {isLoading && <p>Loading memory data...</p>}
      {/*error && <p className="error-message">{error}</p>*/}
      {!isLoading &&  (
        <>
          <Comments
            commentsData={comments}
            endpoint={`/api/mongoDb/comments/uploadComment`}
            userId={userID}
            userEmail={userEmail}
            memoryId={memoryName}
            uniqueMemoryId={dynamicMemoryID}
            token={token}
            uid={Uid}
            root="dynamicMemory"
          />
          <button className="open-collage-button" onClick={handleOpenModal}>
            View Memory Collage
          </button>
        </>
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
        PlayPauseComponent={TogglePlayPause}
        setFailMessage={setError}
      />

      {isQRModalOpen && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
          onClick={handleCloseQRModal}
        >
          <div
            className="modalContentMemories"
            style={{
              padding: '20px',
              borderRadius: '8px',
              maxWidth: '400px',
              width: '90%',
              textAlign: 'center',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleCloseQRModal}
              className="closeButton"
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
              }}
            >
              ×
            </button>
            <h3>Share this Memory</h3>
            <QRGenerator
              value={currentUrl}
              width={250}
              height={250}
              dotsColor="#000000"
              bgColor="#ffffff"
              dotsType="rounded"
              cornersType="extra-rounded"
            />
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '20px' }}>
              <button
                onClick={handleDownloadQR}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Download
              </button>
              <button
                onClick={handleShareQR}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Share
              </button>
            </div>
          </div>
        </div>
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
      setTokenChild={setToken}
      setUserEmailChild={setUserEmail}
      setUidChild={setUid}
    />
  );
};

export default MemoryViewer;
