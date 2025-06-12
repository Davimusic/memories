import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import GeneralMold from '@/components/complex/generalMold';
import Modal from '@/components/complex/modal';
import ShowHide from '@/components/complex/showHide';
import LoadingMemories from '@/components/complex/loading';
import ErrorComponent from '@/components/complex/error';
import '../../../app/globals.css';
import '../../../estilos/general/api/edit/editMemories.css';
import { toast } from 'react-toastify';
const notifySuccess = (message) => toast.success(message);
const notifyFail = (message) => toast.error(message);

const MemoryCleaner = () => {
  const router = useRouter();
  const { userID, memoryName } = router.query;

  const [permissionResult, setPermissionResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [uid, setUid] = useState(null);
  const [token, setToken] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState('general');
  const [originalFiles, setOriginalFiles] = useState({
    photos: [],
    videos: [],
    audios: [],
  });
  const [filesToDelete, setFilesToDelete] = useState({
    photos: [],
    videos: [],
    audios: [],
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeFileType, setActiveFileType] = useState(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [initialData, setInitialData] = useState('');

  const pluralize = useCallback((type) => {
    if (type === 'photo' || type === 'image') return 'photos';
    if (type === 'video') return 'videos';
    if (type === 'audio') return 'audios';
    return type;
  }, []);

  useEffect(() => {
    const fetchMemoryData = async () => {
      try {
        if (!userID || !memoryName) return;

        setIsLoading(true);
        const res = await fetch('/api/mongoDb/postMemoryReferenceUser', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userID, memoryTitle: memoryName }),
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const mongoData = await res.json();

        if (!mongoData.success) {
          throw new Error('Failed to load memory data');
        }

        const memory = mongoData.memory;
        
        const formattedData = {
          ...memory,
          ownerEmail: mongoData.ownerEmail,
          metadata: {
            ...memory.metadata,
            createdAt: memory.metadata.createdAt
              ? new Date(memory.metadata.createdAt).toISOString()
              : null,
            lastUpdated: memory.metadata.lastUpdated
              ? new Date(memory.metadata.lastUpdated).toISOString()
              : null,
          },
          access: memory.access || {},
          topics: memory.topics || {},
        };

        setPermissionResult(formattedData);
        setError(null);
      } catch (err) {
        console.error('fetchMemoryData error:', err.message);
        setError(err.message || 'Failed to fetch memory data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMemoryData();
  }, [userID, memoryName]);

  useEffect(() => {
    if (permissionResult && permissionResult.topics && permissionResult.topics[selectedTopic]) {
      const topic = permissionResult.topics[selectedTopic];
      setOriginalFiles({
        photos: (topic.photos || []).map((file) => ({
          ...file,
          type: 'image',
          file_name: file.url.split('/').pop(),
          storage_url: file.url.replace(
            'https://goodmemoriesapp.b-cdn.net',
            `https://${process.env.NEXT_PUBLIC_BUNNY_REGION}.storage.bunnycdn.com/${process.env.NEXT_PUBLIC_BUNNY_STORAGE_ZONE}`
          ),
        })),
        videos: (topic.videos || []).map((file) => ({
          ...file,
          type: 'video',
          file_name: file.url.split('/').pop(),
          storage_url: file.url.replace(
            'https://goodmemoriesapp.b-cdn.net',
            `https://${process.env.NEXT_PUBLIC_BUNNY_REGION}.storage.bunnycdn.com/${process.env.NEXT_PUBLIC_BUNNY_STORAGE_ZONE}`
          ),
        })),
        audios: (topic.audios || []).map((file) => ({
          ...file,
          type: 'audio',
          file_name: file.url.split('/').pop(),
          storage_url: file.url.replace(
            'https://goodmemoriesapp.b-cdn.net',
            `https://${process.env.NEXT_PUBLIC_BUNNY_REGION}.storage.bunnycdn.com/${process.env.NEXT_PUBLIC_BUNNY_STORAGE_ZONE}`
          ),
        })),
      });
    } else {
      setOriginalFiles({ photos: [], videos: [], audios: [] });
    }
  }, [permissionResult, selectedTopic]);

  const canEdit = useMemo(() => {
    if (!permissionResult || !userEmail) return false;

    const editAccess = permissionResult.access?.edit;
    if (!editAccess) return false;

    const { allowed, invitedEmails = [] } = editAccess;
    if (!allowed) return false;

    const transformEmail = (email) => email.replace(/[@.]/g, '_');
    const currentUserTransformed = transformEmail(userEmail);
    const ownerTransformed = transformEmail(permissionResult.ownerEmail);

    if (permissionResult.access.view?.visibility === 'public') {
      return true;
    }

    if (permissionResult.access.view?.visibility === 'private') {
      return currentUserTransformed === ownerTransformed;
    }

    if (permissionResult.access.view?.visibility === 'invitation') {
      const transformedInvites = invitedEmails.map(transformEmail);
      return transformedInvites.includes(currentUserTransformed);
    }

    return false;
  }, [permissionResult, userEmail]);

  const handleMarkForDeletion = useCallback(
    (fileType, index) => {
      const key = pluralize(fileType);
      setOriginalFiles((prev) => {
        const updatedFiles = [...prev[key]];
        const [fileToDelete] = updatedFiles.splice(index, 1);
        setFilesToDelete((prevDelete) => ({
          ...prevDelete,
          [key]: [...prevDelete[key], fileToDelete],
        }));
        return { ...prev, [key]: updatedFiles };
      });
    },
    [pluralize]
  );

  const handleRestoreFile = useCallback(
    (fileType, index) => {
      const key = pluralize(fileType);
      setFilesToDelete((prev) => {
        const updatedFiles = [...prev[key]];
        const [fileToRestore] = updatedFiles.splice(index, 1);
        setOriginalFiles((prevOriginal) => ({
          ...prevOriginal,
          [key]: [...prevOriginal[key], fileToRestore],
        }));
        return { ...prev, [key]: updatedFiles };
      });
    },
    [pluralize]
  );

  const confirmDeleteFiles = useCallback(async () => {
    setIsProcessing(true);
    setConfirmationModalOpen(false);

    try {
      const filesToDeleteArray = [
        ...filesToDelete.photos,
        ...filesToDelete.videos,
        ...filesToDelete.audios,
      ].map((file) => ({
        ...file,
        url: file.storage_url,
        topic: selectedTopic,
      }));

      const deleteResponse = await fetch('/api/bunny/deleteFiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userID,
          memoryName,
          userEmail,
          filesToDelete: filesToDeleteArray,
          uid,
          token,
        }),
      });

      const deleteData = await deleteResponse.json();
      if (!deleteResponse.ok || !deleteData.success) {
        console.log(deleteData);
        if(deleteData.error != 'Some files could not be deleted'){
          throw new Error(deleteData.error || 'Failed to delete files from Bunny.net');
        }
      }

      console.log(filesToDeleteArray);
      console.log(deleteData);
      
      

      const updateResponse = await fetch('/api/mongoDb/queries/deleteFilesUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerKey: userID,
          memoryName,
          filesToDelete: deleteData,
          userEmail,
          uid,
          token,
          topic: selectedTopic,
        }),
      });

      const updateData = await updateResponse.json();

      if(updateData.success){
          notifySuccess(updateData.message);
      } else {
          notifyFail(updateData.message)
      }
      
      


      if (!updateResponse.ok || !updateData.success) {
        throw new Error(updateData.message || 'Failed to update MongoDB');
      }

      setFilesToDelete({ photos: [], videos: [], audios: [] });
    } catch (err) {
      setError(err.message);
      console.error('Deletion error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [filesToDelete, userID, memoryName, userEmail, uid, token, selectedTopic]);

  const renderFilePreview = useCallback(
    (file, isMarkedForDeletion, index) => (
      <article key={`${file.url}-${index}`} className="preview-item">
        <div className="media-container">
          {file.type === 'image' && (
            <img
              src={file.url}
              alt={`Preview of ${file.file_name}`}
              className="media-preview"
              loading="lazy"
            />
          )}
          {file.type === 'video' && (
            <video
              src={file.url}
              controls
              className="media-preview"
              aria-label={`Video: ${file.file_name}`}
            />
          )}
          {file.type === 'audio' && (
            <div className="audio-preview-container">
              <audio
                src={file.url}
                controls
                className="audio-preview"
                aria-label={`Audio: ${file.file_name}`}
              />
            </div>
          )}
        </div>
        <div className="file-meta">
          <span className="file-name">{file.file_name}</span>
          <button
            className={`closeButton ${isMarkedForDeletion ? 'restore' : 'delete'}`}
            onClick={() =>
              isMarkedForDeletion
                ? handleRestoreFile(file.type, index)
                : handleMarkForDeletion(file.type, index)
            }
            aria-label={isMarkedForDeletion ? `Restore ${file.file_name}` : `Delete ${file.file_name}`}
          >
            {isMarkedForDeletion ? '↩' : '×'}
          </button>
        </div>
      </article>
    ),
    [handleMarkForDeletion, handleRestoreFile]
  );

  const FileSection = useMemo(
    () =>
      ({ title, files, fileCategory, fileType }) => (
        <section className="file-section-container" aria-labelledby={`${fileCategory}-${fileType}-header`}>
          <div className="section-header">
            <h3 id={`${fileCategory}-${fileType}-header`}>{title}</h3>
            <div className="section-controls">
              <span className="file-count-badge" aria-label={`${files.length} ${title.toLowerCase()}`}>
                {files.length}
              </span>
              {files.length > 0 && (
                <ShowHide
                  onClick={() => {
                    setActiveCategory(fileCategory);
                    setActiveFileType(fileType);
                    setIsPreviewModalOpen(true);
                  }}
                  size={20}
                  aria-label={`Show ${title.toLowerCase()} preview`}
                />
              )}
            </div>
          </div>
        </section>
      ),
    []
  );

  if (isLoading) {
    return <LoadingMemories />;
  }

  if (error) {
    return <ErrorComponent error={error} />;
  }

  const topicOptions = permissionResult?.topics
    ? Object.keys(permissionResult.topics).map((topic) => ({
        value: topic,
        label: topic.charAt(0).toUpperCase() + topic.slice(1),
      }))
    : [];

  const rightContent = (
    <div className="memory-cleaner">
      <h1>Memory Cleaner: {permissionResult?.metadata?.title || memoryName}</h1>
      <div className="topic-selector">
        <label htmlFor="topic-select">Select Topic:</label>
        <select
          id="topic-select"
          value={selectedTopic}
          onChange={(e) => setSelectedTopic(e.target.value)}
          aria-label="Select topic to manage files"
        >
          {topicOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="files-column">
        <section className="files-group" aria-labelledby="current-files">
          <h2 id="current-files">Current Files</h2>
          {['photos', 'videos', 'audios'].map((typeKey) => (
            <FileSection
              key={`original-${typeKey}`}
              title={typeKey.toUpperCase()}
              files={originalFiles[typeKey]}
              fileCategory="original"
              fileType={typeKey}
            />
          ))}
        </section>
        <section className="files-group" aria-labelledby="files-to-delete">
          <h2 id="files-to-delete">Files to Delete</h2>
          {['photos', 'videos', 'audios'].map((typeKey) => (
            <FileSection
              key={`delete-${typeKey}`}
              title={typeKey.toUpperCase()}
              files={filesToDelete[typeKey]}
              fileCategory="toDelete"
              fileType={typeKey}
            />
          ))}
        </section>
      </div>
      {error && <ErrorComponent error={error} />}
      {Object.values(filesToDelete).some((arr) => arr.length > 0) && (
        <button
          className={`button2 ${isProcessing ? 'processing' : ''}`}
          onClick={() => setConfirmationModalOpen(true)}
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Confirm Deletion'}
        </button>
      )}
      {isPreviewModalOpen && (
        <div className="preview-modal-overlay modal-content" role="dialog" aria-labelledby="preview-modal-title">
          <div className="preview-modal">
            <div className="modal-header">
              <h3 id="preview-modal-title">
                {activeFileType.charAt(0).toUpperCase() + activeFileType.slice(1)} -{' '}
                {activeCategory === 'original' ? 'Original Files' : 'Files to Delete'}
              </h3>
              <button
                className="closeButton"
                onClick={() => setIsPreviewModalOpen(false)}
                aria-label="Close preview modal"
              >
                ×
              </button>
            </div>
            <div className="scroll-preview">
              <div className="preview-grid">
                {(activeCategory === 'original'
                  ? originalFiles[activeFileType]
                  : filesToDelete[activeFileType]
                )?.map((file, index) => renderFilePreview(file, activeCategory === 'toDelete', index))}
              </div>
            </div>
          </div>
        </div>
      )}
      <Modal isOpen={confirmationModalOpen} onClose={() => setConfirmationModalOpen(false)}>
        <div className="danger-modal" role="alertdialog" aria-labelledby="modal-title">
          <h3 id="modal-title">⚠️ Permanent Deletion</h3>
          <p>
            Are you sure you want to delete {Object.values(filesToDelete).flat().length} files from topic '{selectedTopic}'? This action cannot be undone.
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-around', paddingTop: '10px' }}>
            <button
              className="button2"
              onClick={() => setConfirmationModalOpen(false)}
              aria-label="Cancel deletion"
            >
              Cancel
            </button>
            <button className="button2 delete" onClick={confirmDeleteFiles} aria-label="Confirm deletion">
              Confirm
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );

  return (
    <GeneralMold
      pageTitle={`Memory Cleaner: ${permissionResult?.metadata?.title || memoryName}`}
      pageDescription="Clean up your memory by deleting unwanted files."
      rightContent={rightContent}
      visibility={permissionResult?.access?.view?.visibility || 'private'}
      owner={permissionResult?.ownerEmail || 'Unknown'}
      initialData={permissionResult}
      setInitialData={setInitialData}
      setUidChild={setUid}
      setTokenChild={setToken}
      setUserEmailChild={setUserEmail}
    />
  );
};

export default MemoryCleaner;


