import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import MenuIcon from '../../../components/complex/menuIcon';
import Menu from '../../../components/complex/menu';
import Modal from "../../../components/complex/modal";
import ShowHide from '@/components/complex/showHide';
import LoadingMemories from '@/components/complex/loading';
import ErrorComponent from '@/components/complex/error';
import Head from 'next/head';
import { auth } from '../../../../firebase';
import '../../../app/globals.css';
import '../../../estilos/general/api/edit/editMemories.css'
import '../../../estilos/general/general.css'
























const MemoryCleaner = ({ initialData, error: serverError }) => {
  const router = useRouter();
  const { userID, memoryName } = router.query;

  const [originalFiles, setOriginalFiles] = useState({
    photos: initialData?.backBlazeRefs?.photos || [],
    videos: initialData?.backBlazeRefs?.videos || [],
    audios: initialData?.backBlazeRefs?.audios || [],
  });
  const [filesToDelete, setFilesToDelete] = useState({
    photos: [],
    videos: [],
    audios: [],
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(serverError || null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeFileType, setActiveFileType] = useState(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [roll, setRoll] = useState('');
  const [memoryData, setMemoryData] = useState(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [userEmail, setUserEmail] = useState(null);
  const [userOwnerEmail, setUserOwnerEmail] = useState(null);
  const [uid, setUid] = useState(null);
  const [token, setToken] = useState(null);

  const transformEmail = useCallback((email) => email.replace(/[@.]/g, '_'), []);
  const pluralize = useCallback((type) => {
    if (type === 'photo' || type === 'image') return 'photos';
    if (type === 'video') return 'videos';
    if (type === 'audio') return 'audios';
    return type;
  }, []);

  // Authentication check
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUid(user.uid);
        try {
          const token = await user.getIdToken();
          setToken(token);
        } catch (error) {
          console.error('Error getting token:', error);
          setError('Authentication error occurred');
        }
        const email = user.email || user.providerData?.[0]?.email;
        setUserEmail(email);
      } else {
        const path = window.location.pathname;
        localStorage.setItem('redirectPath', path);
        localStorage.setItem('reason', 'userEmailValidationOnly');
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Client-side data fetch (if initialData is not provided)
  useEffect(() => {
    if (initialData || !userID || !memoryName) return;

    let isMounted = true;

    const fetchMemoryData = async () => {
      try {
        const response = await fetch('/api/mongoDb/postMemoryReferenceUser', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userID, memoryTitle: memoryName }),
        });

        if (!isMounted) return;

        const mongoData = await response.json();
        if (mongoData.success) {
          setUserOwnerEmail(mongoData.ownerEmail);
          const specificMemory = mongoData.memory;
          const formattedData = {
            ...specificMemory,
            backBlazeRefs: {
              photos: specificMemory.media.photos.map((item) => ({
                ...item,
                file_name: item.url.split('/').pop(),
                type: 'image',
                storage_url: item.url.replace(
                  'https://goodmemoriesapp.b-cdn.net',
                  `https://${process.env.NEXT_PUBLIC_BUNNY_REGION}.storage.bunnycdn.com/${process.env.NEXT_PUBLIC_BUNNY_STORAGE_ZONE}`
                ),
              })),
              videos: specificMemory.media.videos.map((item) => ({
                ...item,
                file_name: item.url.split('/').pop(),
                type: 'video',
                url: item.url.replace('https://goodmemoriesapp.b-cdn.net', 'https://goodmemoriesapp.b-cdn.net'),
                storage_url: item.url.replace(
                  'https://goodmemoriesapp.b-cdn.net',
                  `https://${process.env.NEXT_PUBLIC_BUNNY_REGION}.storage.bunnycdn.com/${process.env.NEXT_PUBLIC_BUNNY_STORAGE_ZONE}`
                ),
              })),
              audios: specificMemory.media.audios.map((item) => ({
                ...item,
                file_name: item.url.split('/').pop(),
                type: 'audio',
                storage_url: item.url.replace(
                  'https://goodmemoriesapp.b-cdn.net',
                  `https://${process.env.NEXT_PUBLIC_BUNNY_REGION}.storage.bunnycdn.com/${process.env.NEXT_PUBLIC_BUNNY_STORAGE_ZONE}`
                ),
              })),
            },
          };

          setMemoryData(formattedData);
          setOriginalFiles({
            photos: formattedData.backBlazeRefs.photos,
            videos: formattedData.backBlazeRefs.videos,
            audios: formattedData.backBlazeRefs.audios,
          });
        } else {
          throw new Error(mongoData.error || 'Failed to fetch memory data');
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMemoryData();

    return () => {
      isMounted = false;
    };
  }, [userID, memoryName, initialData]);

  // Permission check
  useEffect(() => {
    if (!memoryData || userEmail === null || !userOwnerEmail) {
      setRoll('User not allowed');
      return;
    }

    const checkViewPermissions = () => {
      const editAccess = memoryData.access?.edit;

      if (!editAccess) {
        setError('Invalid access configuration');
        setRoll('User not allowed');
        return;
      }

      const { visibility, invitedEmails = [] } = editAccess;
      const currentUserTransformed = transformEmail(userEmail);
      const ownerTransformed = transformEmail(userOwnerEmail);

      if (visibility === 'public') {
        setRoll('Anyone can edit memories');
        return;
      }

      if (visibility === 'private') {
        if (currentUserTransformed === ownerTransformed) {
          setRoll('You are the owner');
          return;
        }
        setRoll('User not allowed');
        setMemoryData(null);
        return;
      }

      if (visibility === 'invitation') {
        const transformedInvites = invitedEmails.map(transformEmail);
        if (transformedInvites.includes(currentUserTransformed)) {
          setRoll('Invited to edit memories');
          return;
        }
        setRoll('User not allowed');
        setMemoryData(null);
        return;
      }

      setRoll('User not allowed');
    };

    checkViewPermissions();
  }, [memoryData, userEmail, userOwnerEmail, transformEmail]);

  // File handlers
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

  // Confirm deletion
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
        throw new Error(
          deleteData.error ||
            (deleteData.details
              ? `Failed to delete some files: ${deleteData.details.map((d) => `${d.file}: ${d.error}`).join(', ')}`
              : 'Failed to delete files from Bunny.net')
        );
      }

      const updateResponse = await fetch('/api/mongoDb/queries/deleteFilesUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userID,
          memoryName,
          filesToDelete,
          userEmail,
          uid,
          token,
        }),
      });

      const updateData = await updateResponse.json();

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
  }, [filesToDelete, userID, memoryName, userEmail, uid, token]);

  // Render file preview
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
            className={`submitButton ${isMarkedForDeletion ? 'restore' : 'delete'}`}
            onClick={() =>
              isMarkedForDeletion
                ? handleRestoreFile(file.type, index)
                : handleMarkForDeletion(file.type, index)
            }
            aria-label={isMarkedForDeletion ? `Restore ${file.file_name}` : `Delete ${file.file_name}`}
          >
            {isMarkedForDeletion ? '↩ Restore' : '× Delete'}
          </button>
        </div>
      </article>
    ),
    [handleMarkForDeletion, handleRestoreFile]
  );

  // Render file section
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

  if (loading) return <LoadingMemories />;

  if (roll === 'User not allowed') {
    return (
      <main className="fullscreen-floating">
        <Head>
          <title>Access Denied - Memory Cleaner</title>
          <meta name="description" content="Access denied to the memory cleaner page. Contact the account owner for assistance." />
          <meta name="robots" content="noindex" />
        </Head>
        <section className="loading" aria-live="polite">
          <h1 className="title-xl color2">Error: Access Denied</h1>
          <p className="alertColor">
            If you believe this is a mistake, please contact the account owner.
          </p>
        </section>
      </main>
    );
  }

  const pageTitle = `${memoryData?.metadata?.title || 'Memory Cleaner'}`;
  const pageDescription = `Manage your photos, videos, and audios for the memory titled "${memoryData?.metadata?.title || 'Memory Cleaner'}" with secure deletion options.`;

  return (
    <main className="fullscreen-floating mainFont backgroundColor1 color2">
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content="memory cleaner, file management, photos, videos, audios, delete files" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: pageTitle,
            description: pageDescription,
            url: `https://yourdomain.com/memory-cleaner/${userID}/${memoryName}`,
          })}
        </script>
      </Head>
      <Menu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <section className="file-uploader" aria-label="File management section">
        <header className="header-container">
          <div style={{ width: '40px' }}>
            <MenuIcon
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            />
          </div>
          <div className="title-container">
            <h1 className="title">{pageTitle}</h1>
          </div>
        </header>

        <div className="uploader-content">
          <div style={{ display: 'flex', alignItems: 'center', paddingBottom: '10px' }}>
            <span className={roll !== 'User not allowed' ? 'color2' : 'alertColor'} style={{ paddingRight: '10px' }}>
              Role:
            </span>
            <span className={`roll-badge ${roll !== 'User not allowed' ? 'color2' : 'alertColor'}`}>
              {roll}
            </span>
            {roll === 'User not allowed' && (
              <p className="alertColor" style={{ marginLeft: '10px' }}>
                If you believe this is a mistake, please contact the account owner.
              </p>
            )}
          </div>

          <div className="files-column">
            <section className="files-group" aria-labelledby="current-files">
              <h2 id="current-files" className="color1" style={{ paddingBottom: '10px' }}>
                Current Files
              </h2>
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
              <h2 id="files-to-delete" className="color1" style={{ paddingBottom: '10px' }}>
                Files to Delete
              </h2>
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

          
        </div>
        {Object.values(filesToDelete).some((arr) => arr.length > 0) && (
            <button
              className={`submit-btn ${isProcessing ? 'processing' : ''}`}
              onClick={() => setConfirmationModalOpen(true)}
              disabled={isProcessing || roll === 'User not allowed'}
              aria-label="Confirm file deletion"
            >
              {isProcessing ? 'Processing...' : 'Confirm Deletion'}
            </button>
          )}
      </section>

      <Modal isOpen={confirmationModalOpen} onClose={() => setConfirmationModalOpen(false)}>
        <div className="danger-modal" role="alertdialog" aria-labelledby="modal-title">
          <h3 id="modal-title">⚠️ Permanent Deletion</h3>
          <p>
            Are you sure you want to delete {Object.values(filesToDelete).flat().length} files? This action cannot be
            undone.
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-around', paddingTop: '10px' }}>
            <button
              className="submitButton"
              onClick={() => setConfirmationModalOpen(false)}
              aria-label="Cancel deletion"
            >
              Cancel
            </button>
            <button className="submitButton delete" onClick={confirmDeleteFiles} aria-label="Confirm deletion">
              Confirm
            </button>
          </div>
        </div>
      </Modal>

      {isPreviewModalOpen && (
        <div className="preview-modal-overlay" role="dialog" aria-labelledby="preview-modal-title">
          <div className="preview-modal">
            <div className="modal-header">
              <h3 id="preview-modal-title" className="color1">
                {activeFileType.charAt(0).toUpperCase() + activeFileType.slice(1)} -{' '}
                {activeCategory === 'original' ? 'Original Files' : 'Files to Delete'}
              </h3>
              <button
                className="closeXButton"
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
    </main>
  );
};



export default MemoryCleaner;


/*const MemoryCleaner = () => {
  const router = useRouter();
  const { userID, memoryName } = router.query;

  const [originalFiles, setOriginalFiles] = useState({
    photos: [],
    videos: [],
    audios: []
  });
  const [filesToDelete, setFilesToDelete] = useState({
    photos: [],
    videos: [],
    audios: []
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeFileType, setActiveFileType] = useState(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [roll, setRoll] = useState('');
  const [memoryData, setMemoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState(null);
  const [userOwnerEmail, setUserOwnerEmail] = useState(null);
  const [uid, setUid] = useState(null);
  const [token, setToken] = useState(null);

  const transformEmail = useCallback((email) => email.replace(/[@.]/g, '_'), []);

  const pluralize = useCallback((type) => {
    if (type === 'photo' || type === 'image') return 'photos';
    if (type === 'video') return 'videos';
    if (type === 'audio') return 'audios';
    return type;
  }, []);

  // Authentication check
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUid(user.uid);
        try {
          const token = await user.getIdToken();
          setToken(token);
        } catch (error) {
          console.error("Error getting token:", error);
        }
        const email = user.email || user.providerData?.[0]?.email;
        setUserEmail(email);
      } else {
        const path = window.location.pathname;
        localStorage.setItem("redirectPath", path);
        localStorage.setItem("reason", "userEmailValidationOnly");
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Initial data fetch
  useEffect(() => {
    let isMounted = true;

    const fetchMemoryData = async () => {
      if (!userID || !memoryName || !isMounted) return;

      try {
        const response = await fetch("/api/mongoDb/postMemoryReferenceUser", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userID, memoryTitle: memoryName }),
        });

        if (!isMounted) return;

        const mongoData = await response.json();
        console.log('MongoDB response:', mongoData);

        if (isMounted && mongoData.success) {
          setUserOwnerEmail(mongoData.ownerEmail);
          const specificMemory = mongoData.memory;
          const formattedData = {
            ...specificMemory,
            backBlazeRefs: {
              photos: specificMemory.media.photos.map(item => ({
                ...item,
                file_name: item.url.split('/').pop(),
                type: 'image',
                storage_url: item.url.replace('https://goodmemoriesapp.b-cdn.net', `https://${process.env.NEXT_PUBLIC_BUNNY_REGION}.storage.bunnycdn.com/${process.env.NEXT_PUBLIC_BUNNY_STORAGE_ZONE}`)
              })),
              videos: specificMemory.media.videos.map(item => ({
                ...item,
                file_name: item.url.split('/').pop(),
                type: 'video',
                url: item.url.replace('https://goodmemoriesapp.b-cdn.net', 'https://goodmemoriesapp.b-cdn.net'),
                storage_url: item.url.replace('https://goodmemoriesapp.b-cdn.net', `https://${process.env.NEXT_PUBLIC_BUNNY_REGION}.storage.bunnycdn.com/${process.env.NEXT_PUBLIC_BUNNY_STORAGE_ZONE}`)
              })),
              audios: specificMemory.media.audios.map(item => ({
                ...item,
                file_name: item.url.split('/').pop(),
                type: 'audio',
                storage_url: item.url.replace('https://goodmemoriesapp.b-cdn.net', `https://${process.env.NEXT_PUBLIC_BUNNY_REGION}.storage.bunnycdn.com/${process.env.NEXT_PUBLIC_BUNNY_STORAGE_ZONE}`)
              }))
            }
          };

          setMemoryData(formattedData);
          setOriginalFiles({
            photos: formattedData.backBlazeRefs.photos,
            videos: formattedData.backBlazeRefs.videos,
            audios: formattedData.backBlazeRefs.audios
          });
        } else {
          throw new Error(mongoData.error || 'Failed to fetch memory data');
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMemoryData();

    return () => {
      isMounted = false;
    };
  }, [userID, memoryName]);

  // Permission check
  useEffect(() => {
    if (!memoryData || userEmail === null || !userOwnerEmail) {
      setRoll('User not allowed');
      return;
    }

    const checkViewPermissions = () => {
      const editAccess = memoryData.access?.edit;

      if (!editAccess) {
        setError("Invalid access configuration");
        setRoll('User not allowed');
        return;
      }

      const { visibility, invitedEmails = [] } = editAccess;
      const currentUserTransformed = transformEmail(userEmail);
      const ownerTransformed = transformEmail(userOwnerEmail);

      if (visibility === 'public') {
        console.log("Public edit access granted");
        setRoll('Anyone can edit memories');
        return;
      }

      if (visibility === 'private') {
        if (currentUserTransformed === ownerTransformed) {
          console.log("Private edit access granted (owner)");
          setRoll('You are the owner');
          return;
        }
        console.log("Private edit access denied");
        setRoll('User not allowed');
        setMemoryData(null);
        return;
      }

      if (visibility === 'invitation') {
        const transformedInvites = invitedEmails.map(transformEmail);
        if (transformedInvites.includes(currentUserTransformed)) {
          console.log("Invitation edit access granted");
          setRoll('Invited to edit memories');
          return;
        }
        console.log("User not invited");
        setRoll('User not allowed');
        setMemoryData(null);
        return;
      }

      setRoll('User not allowed');
    };

    checkViewPermissions();
  }, [memoryData, userEmail, userOwnerEmail, transformEmail]);

  // File handlers
  const handleMarkForDeletion = useCallback((fileType, index) => {
    const key = pluralize(fileType);
    setOriginalFiles(prev => {
      const updatedFiles = [...prev[key]];
      const [fileToDelete] = updatedFiles.splice(index, 1);

      setFilesToDelete(prevDelete => ({
        ...prevDelete,
        [key]: [...prevDelete[key], fileToDelete]
      }));

      return { ...prev, [key]: updatedFiles };
    });
  }, [pluralize]);

  const handleRestoreFile = useCallback((fileType, index) => {
    const key = pluralize(fileType);
    setFilesToDelete(prev => {
      const updatedFiles = [...prev[key]];
      const [fileToRestore] = updatedFiles.splice(index, 1);

      setOriginalFiles(prevOriginal => ({
        ...prevOriginal,
        [key]: [...prevOriginal[key], fileToRestore]
      }));

      return { ...prev, [key]: updatedFiles };
    });
  }, [pluralize]);

  // Confirm deletion
  const confirmDeleteFiles = useCallback(async () => {
    setIsProcessing(true);
    setConfirmationModalOpen(false);

    try {
      const filesToDeleteArray = [
        ...filesToDelete.photos,
        ...filesToDelete.videos,
        ...filesToDelete.audios
      ].map(file => ({
        ...file,
        url: file.storage_url
      }));

      console.log('Sending Bunny.net delete request:', {
        userId: userID,
        memoryName,
        userEmail,
        filesToDelete: filesToDeleteArray
      });

      const deleteResponse = await fetch('/api/bunny/deleteFiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userID,
          memoryName,
          userEmail,
          filesToDelete: filesToDeleteArray,
          uid,
          token
        })
      });

      const deleteData = await deleteResponse.json();
      console.log('Bunny.net delete response:', deleteData);

      if (!deleteResponse.ok || !deleteData.success) {
        throw new Error(
          deleteData.error ||
          (deleteData.details ?
            `Failed to delete some files: ${deleteData.details.map(d => `${d.file}: ${d.error}`).join(', ')}` :
            'Failed to delete files from Bunny.net')
        );
      }

      console.log('Sending MongoDB delete request:', {
        userId: userID,
        memoryName,
        filesToDelete
      });

      const updateResponse = await fetch('/api/mongoDb/queries/deleteFilesUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userID,
          memoryName,
          filesToDelete,
          userEmail,
          uid,
          token
        })
      });

      const updateData = await updateResponse.json();
      console.log('MongoDB update response:', updateData);

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
  }, [filesToDelete, userID, memoryName, userEmail, uid, token]);

  // Render file preview
  const renderFilePreview = useCallback((file, isMarkedForDeletion, index) => (
    <div key={`${file.url}-${index}`} className="preview-item">
      <div className="media-container">
        {file.type === 'image' && (
          <img src={file.url} alt="Preview" className="media-preview" />
        )}
        {file.type === 'video' && (
          <video src={file.url} controls className="media-preview" />
        )}
        {file.type === 'audio' && (
          <div className="audio-preview-container">
            <audio src={file.url} controls className="audio-preview" />
          </div>
        )}
      </div>
      <div className="file-meta">
        <span className="file-name">{file.file_name}</span>
        <button
          className={`submitButton ${isMarkedForDeletion ? 'restore' : 'delete'}`}
          onClick={() => isMarkedForDeletion
            ? handleRestoreFile(file.type, index)
            : handleMarkForDeletion(file.type, index)
          }
        >
          {isMarkedForDeletion ? '↩ Restore' : '× Delete'}
        </button>
      </div>
    </div>
  ), [handleMarkForDeletion, handleRestoreFile]);

  // Render file section
  const FileSection = useMemo(() => ({ title, files, fileCategory, fileType }) => (
    <div className="file-section-container">
      <div className="section-header">
        <h3>{title}</h3>
        <div className="section-controls">
          <span className="file-count-badge">{files.length}</span>
          {files.length > 0 && (
            <ShowHide
              onClick={() => {
                setActiveCategory(fileCategory);
                setActiveFileType(fileType);
                setIsPreviewModalOpen(true);
              }}
              size={20}
            />
          )}
        </div>
      </div>
    </div>
  ), []);

  if (loading) return <LoadingMemories />;

  if (roll === 'User not allowed') {
    return (
      <div className="fullscreen-floating">
        <div className="loading">
          <p className="title-xl color2">Error: Access Denied</p>
          <h3 className="alertColor">
            If you believe this is a mistake, please contact the account owner.
          </h3>
        </div>
      </div>
    );
  }

  return (
    <div className="fullscreen-floating mainFont backgroundColor1 color2">
      <Menu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <div className="file-uploader">
        <div className="header-container">
          <div style={{ width: '40px' }}>
            <MenuIcon onClick={() => setIsMenuOpen(!isMenuOpen)} />
          </div>
          <div className="title-container">
            <h2 className="title">
              Manage files: {memoryData?.metadata?.title || "No title available"}
            </h2>
          </div>
        </div>

        <div className="uploader-content">
          <div style={{ display: 'flex', alignItems: 'center', paddingBottom: '10px' }}>
            <span className={roll !== 'User not allowed' ? 'color2' : 'alertColor'} style={{ paddingRight: '10px' }}>
              Role:
            </span>
            <span className={`roll-badge ${roll !== 'User not allowed' ? 'color2' : 'alertColor'}`}>
              {roll}
            </span>
            {roll === 'User not allowed' && (
              <h3 className="alertColor" style={{ marginLeft: '10px' }}>
                If you believe this is a mistake, please contact the account owner.
              </h3>
            )}
          </div>

          <div className="files-column">
            <div className="files-group">
              <h3 className="color1" style={{ paddingBottom: '10px' }}>Current Files</h3>
              {['photos', 'videos', 'audios'].map((typeKey) => (
                <FileSection
                  key={`original-${typeKey}`}
                  title={typeKey.toUpperCase()}
                  files={originalFiles[typeKey]}
                  fileCategory="original"
                  fileType={typeKey}
                />
              ))}
            </div>

            <div className="files-group">
              <h3 className="color1" style={{ paddingBottom: '10px' }}>Files to Delete</h3>
              {['photos', 'videos', 'audios'].map((typeKey) => (
                <FileSection
                  key={`delete-${typeKey}`}
                  title={typeKey.toUpperCase()}
                  files={filesToDelete[typeKey]}
                  fileCategory="toDelete"
                  fileType={typeKey}
                />
              ))}
            </div>
          </div>

          {error && <ErrorComponent error={error} />}

          
        </div>
        {Object.values(filesToDelete).some(arr => arr.length > 0) && (
            <button
              className={`submit-btn ${isProcessing ? 'processing' : ''}`}
              onClick={() => setConfirmationModalOpen(true)}
              disabled={isProcessing || roll === 'User not allowed'}
            >
              {isProcessing ? 'Processing...' : 'Confirm Deletion'}
            </button>
          )}
      </div>

      <Modal isOpen={confirmationModalOpen} onClose={() => setConfirmationModalOpen(false)}>
        <div className="danger-modal">
          <h3>⚠️ Permanent Deletion</h3>
          <p>
            Are you sure you want to delete {Object.values(filesToDelete).flat().length} files?
            This action cannot be undone.
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-around', paddingTop: '10px' }}>
            <button className="submitButton" onClick={() => setConfirmationModalOpen(false)}>
              Cancel
            </button>
            <button className="submitButton delete" onClick={confirmDeleteFiles}>
              Confirm
            </button>
          </div>
        </div>
      </Modal>

      {isPreviewModalOpen && (
        <div className="preview-modal-overlay">
          <div className="preview-modal">
            <div className="modal-header">
              <h3 className="color1">
                {activeFileType.charAt(0).toUpperCase() + activeFileType.slice(1)} -{' '}
                {activeCategory === 'original' ? 'Original Files' : 'Files to Delete'}
              </h3>
              <button
                className="closeXButton"
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
    </div>
  );
};

export default MemoryCleaner;*/













