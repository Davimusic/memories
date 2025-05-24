import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import MenuIcon from '../../../components/complex/menuIcon';
import Menu from '../../../components/complex/menu';
import Modal from "../../../components/complex/modal";
import ShowHide from '@/components/complex/showHide';
import LoadingMemories from '@/components/complex/loading';
import { auth } from '../../../../firebase';
import '../../../app/globals.css';
import '../../../estilos/general/api/edit/editMemories.css'
import '../../../estilos/general/general.css'







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

  const transformEmail = useCallback((email) => email.replace(/[@.]/g, '_'), []);

  

  useEffect(() => {
          const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
              console.log(user);
              
              const email = user.email; // Obtener el correo directamente desde user.email
              console.log('Correo del usuario:', email);
              setUserEmail(email);
            } else {
              console.log('No hay usuario autenticado');
              setUserEmail(null);
              const path = window.location.pathname;
              localStorage.setItem('redirectPath', path);
              localStorage.setItem('reason', 'userEmailValidationOnly');
              router.push('/login');
              return;
              //setLoading(false); // Detener la carga si no hay usuario
            }
          });
          // Cleanup: Desuscribirse del listener cuando el componente se desmonta
          return () => unsubscribe();
  }, []);




const transformMediaWithUrl = useCallback((mongoMedia, backBlazeFiles) => {
  const bunnyHostname = "https://goodmemories.b-cdn.net";
  
  return mongoMedia.map(item => {
    const fileName = item.storage_path.split('/').pop();
    const bbFile = backBlazeFiles.find(f => f.fileName.endsWith(fileName));
    
    // URL original de Backblaze
    let fileUrl = bbFile?.url || "#";
    let backBlazeUrl
    
    // Usamos una regex para capturar el path que sigue a "/file/memoriesAppDavimusic"
    const regex = /https:\/\/f\d{3}\.backblazeb2\.com\/file\/memoriesAppDavimusic(\/.+)/;
    if (fileUrl !== "#" && regex.test(fileUrl)) {
      const match = fileUrl.match(regex);
      if (match && match[1]) {
        // Reconstruimos la URL: concatenamos el hostname de Bunny.net con el path extraído
        fileUrl = bunnyHostname + match[1];
      }
    }
    
    // Si se trata de un video, inserta el segmento para baja calidad (240p)
    if (item.storage_path.includes("videos") && fileUrl.includes(bunnyHostname)) {
      backBlazeUrl = item.storage_path
      fileUrl = fileUrl.replace(bunnyHostname, `${bunnyHostname}/240`);
    }
    
    console.log({
      backBlazeUrl: bbFile?.url,
      ...item,
      url: fileUrl,
      type: item.storage_path.includes("photos")
        ? "photo"
        : item.storage_path.includes("videos")
          ? "video"
          : "audio"
    });
    
    return {
      ...item,
      url: fileUrl,
      type: item.storage_path.includes("photos")
        ? "photo"
        : item.storage_path.includes("videos")
          ? "video"
          : "audio"
    };
  });
}, []);








  const pluralize = useCallback((type) => {
    if (type === 'photo') return 'photos';
    if (type === 'video') return 'videos';
    if (type === 'audio') return 'audios';
    return type;
  }, []);

  // Verificación de permisos
  useEffect(() => {
    if (!memoryData) return;
    console.log(memoryData);
    
    if (userEmail === null) return;
    console.log('entra '+ userEmail);
    
    
    const checkViewPermissions = () => {
      const viewAccess = memoryData.access?.edit;
      if (!viewAccess) {
        setError("Invalid access configuration");
        return;
      }
      
      

      const currentUserTransformed = transformEmail(userEmail);
      const ownerTransformed = transformEmail(memoryData.metadata.createdBy);

      switch (viewAccess.visibility) {
        case 'public':
          setRoll('public');
          break;
        case 'private':
          setRoll(currentUserTransformed === ownerTransformed ? 'private' : 'Unauthorized');
          break;
        case 'invitation':
          const transformedInvites = viewAccess.invitedEmails?.map(transformEmail) || [];
          setRoll(transformedInvites.includes(currentUserTransformed) ? 'invitation' : 'Unauthorized');
          break;
        default:
          setRoll('Unauthorized');
      }
    };

    checkViewPermissions();
  }, [memoryData, router, transformEmail]);

  // Carga inicial de datos
  useEffect(() => {

    let isMounted = true;

    const fetchMemoryData = async () => {
      if (!userID || !memoryName || !isMounted) return;

      try {
        const [mongoResponse, blackBlazeResponse] = await Promise.all([
          fetch("/api/mongoDb/postMemoryReferenceUser", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userID, memoryTitle: memoryName }),
          }),
          fetch(`/api/blackBlaze/getMemoryReferenceUser?correo=${userID}&memoryTitle=${memoryName}`)
        ]);

        if (!isMounted) return;

        const [mongoData, blackBlazeData] = await Promise.all([
          mongoResponse.json(),
          blackBlazeResponse.json()
        ]);

        console.log(mongoData);
        console.log(blackBlazeData);
        
        

        if (isMounted && mongoData.success && blackBlazeData.success) {
          const specificMemory = mongoData.memory;
          const backBlazeMedia = blackBlazeData.memories[memoryName] || { fotos: [], videos: [], audios: [] };

          const formattedData = {
            ...specificMemory,
            backBlazeRefs: {
              photos: transformMediaWithUrl(specificMemory.media.photos, backBlazeMedia.fotos),
              videos: transformMediaWithUrl(specificMemory.media.videos, backBlazeMedia.videos),
              audios: transformMediaWithUrl(specificMemory.media.audios, backBlazeMedia.audios)
            }
          };

          setMemoryData(formattedData);
          setOriginalFiles({
            photos: formattedData.backBlazeRefs.photos,
            videos: formattedData.backBlazeRefs.videos,
            audios: formattedData.backBlazeRefs.audios
          });
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
  }, [userID, memoryName, transformMediaWithUrl]);

  // Manejadores de archivos
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

  // Eliminación confirmada
  const confirmDeleteFiles = useCallback(async () => {
    setIsProcessing(true);
    setConfirmationModalOpen(false);
    
    try {
      const deleteResponse = await fetch('/api/blackBlaze/deleteFiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filesToDelete })
      });

      const updateResponse = await fetch('/api/mongoDb/queries/deleteFilesUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userID, memoryName, filesToDelete })
      });

      if (deleteResponse.ok && updateResponse.ok) {
        setFilesToDelete({ photos: [], videos: [], audios: [] });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  }, [filesToDelete, userID, memoryName]);

  // Componentes renderizados
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

  const renderFilePreview = useCallback((file, isMarkedForDeletion, index) => (
    <div key={`${file.storage_path}-${index}`} className="preview-item">
      <div className="media-container">
        {file.type === 'photo' && (
          <img src={file.url} alt="Preview" className="media-preview" />
        )}
        {file.type === 'video' && (
          <video src={file.url} controls className="media-preview" />
        )}
        {file.type === 'audio' && (
          <audio src={file.url} controls className="audio-preview" />
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

  if (loading) return <LoadingMemories/>;
  if (roll === 'Unauthorized') return <div className="error-message">Access Denied</div>;

  return (
    <div className="fullscreen-floating mainFont backgroundColor1 color2">
      <Menu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <div className="file-uploader">
        <div className="header-container">
          <div style={{ width: '40px' }}>
            <MenuIcon onClick={() => setIsMenuOpen(!isMenuOpen)} />
          </div>
          <div className="title-container">
            <h2 className="title">Manage files: </h2>
          </div>
        </div>

        <div className="cleaner-content">
          <div style={{ display: 'flex' }}>
            <p className='color2' style={{ paddingRight: '10px', paddingBottom: '10px' }}>status: </p>
            <span className="roll-badge">{roll}</span>
          </div>
          
          <div className="files-column">
            <div className="files-group">
              <h3 className='color1' style={{ paddingBottom: '10px' }}>Current Files</h3>
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
              <h3 className='color1' style={{ paddingBottom: '10px' }}>Files to Delete</h3>
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

          {error && <div className="error-message">{error}</div>}

          {Object.values(filesToDelete).some(arr => arr.length > 0) && (
            <button
              className={`submitButton ${isProcessing ? 'processing' : ''}`}
              onClick={() => setConfirmationModalOpen(true)}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Confirm Deletion'}
            </button>
          )}
        </div>
      </div>

      <Modal isOpen={confirmationModalOpen} onClose={() => setConfirmationModalOpen(false)}>
        <div className="danger-modal">
          <h3>⚠️ Permanent Deletion</h3>
          <p>
            Are you sure you want to delete {Object.values(filesToDelete).flat().length} files? 
            This action cannot be undone.
          </p>
          <div style={{ display: "flex", justifyContent: "space-around", paddingTop: '10px' }}>
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
        <div className="preview-modal-overlay" onClick={() => setIsPreviewModalOpen(false)}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className='color1'>
                {activeCategory === 'original'
                  ? `Current ${activeFileType.toUpperCase()}`
                  : `Pending Deletion (${activeFileType.toUpperCase()})`}
              </h3>
              <button className="closeXButton" onClick={() => setIsPreviewModalOpen(false)}>
                ×
              </button>
            </div>
            <div style={{ overflow: 'auto', height: '60vh' }}>
              <div className="preview-grid">
                {(activeCategory === 'original'
                  ? originalFiles[activeFileType]
                  : filesToDelete[activeFileType]
                )?.map((file, index) => 
                  renderFilePreview(file, activeCategory === 'toDelete', index)
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemoryCleaner;*/













const MemoryCleaner = () => {
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

  const transformEmail = useCallback((email) => email.replace(/[@.]/g, '_'), []);

  const pluralize = useCallback((type) => {
    if (type === 'photo' || type === 'image') return 'photos';
    if (type === 'video') return 'videos';
    if (type === 'audio') return 'audios';
    return type;
  }, []);

  // Authentication check
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {//&& user.email != null
        console.log(user);
        const email = user.email;
        console.log('Correo del usuario:', email);
        setUserEmail(email);
      } else {
        console.log('No hay usuario autenticado');
        setUserEmail(null);
        const path = window.location.pathname;
        localStorage.setItem('redirectPath', path);
        localStorage.setItem('reason', 'userEmailValidationOnly');
        router.push('/login');
        return;
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Permission check
  useEffect(() => {
    


    if (!memoryData || userEmail === null || !userOwnerEmail){
      setRoll('Unauthorized');
      return
    } 

    const checkViewPermissions = () => {
      console.log(memoryData);
      const viewAccess = memoryData.access?.edit;
      
      if (!viewAccess) {
        setError("Invalid access configuration");
        return;
      }

      const currentUserTransformed = transformEmail(userEmail);
      const ownerTransformed = transformEmail(userOwnerEmail);

      switch (viewAccess.visibility) {
        case 'public':
          setRoll('public');
          break;
        case 'private':
          setRoll(currentUserTransformed === ownerTransformed ? 'private' : 'Unauthorized');
          break;
        case 'invitation':
          const transformedInvites = viewAccess.invitedEmails?.map(transformEmail) || [];
          setRoll(transformedInvites.includes(currentUserTransformed) ? 'invitation' : 'Unauthorized');
          break;
        default:
          setRoll('Unauthorized');
      }
    };

    checkViewPermissions();
  }, [memoryData, userEmail, userOwnerEmail, transformEmail]);

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
                type: 'image', // Match endpoint VALID_FILE_TYPES
                storage_url: item.url.replace('https://goodmemoriesapp.b-cdn.net', `https://${process.env.NEXT_PUBLIC_BUNNY_REGION}.storage.bunnycdn.com/${process.env.NEXT_PUBLIC_BUNNY_STORAGE_ZONE}`)
              })),
              videos: specificMemory.media.videos.map(item => ({
                ...item,
                file_name: item.url.split('/').pop(),
                type: 'video',
                url: item.url.replace('https://goodmemoriesapp.b-cdn.net', 'https://goodmemoriesapp.b-cdn.net'), 
                storage_url: item.url.replace('https://goodmemoriesapp.b-cdn.net', `https://${process.env.NEXT_PUBLIC_BUNNY_REGION}.storage.bunnycdn.com/${process.env.NEXT_PUBLIC_BUNNY_STORAGE_ZONE}`) // For deletion
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
      // Flatten filesToDelete for Bunny.net
      const filesToDeleteArray = [
        ...filesToDelete.photos,
        ...filesToDelete.videos,
        ...filesToDelete.audios
      ].map(file => ({
        ...file,
        url: file.storage_url // Use storage_url for deletion
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
          filesToDelete: filesToDeleteArray
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
        filesToDelete // Send the object structure
      });

      const updateResponse = await fetch('/api/mongoDb/queries/deleteFilesUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userID,
          memoryName,
          filesToDelete,
          userEmail, 
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
  }, [filesToDelete, userID, memoryName, userEmail]);

  // Render components
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
          <audio src={file.url} controls className="audio-preview" />
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

  if (loading) return <LoadingMemories />;
  if (roll === 'Unauthorized') return <div className="error-message">Access Denied</div>;

  return (
    <div className="fullscreen-floating mainFont backgroundColor1 color2">
      <Menu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <div className="file-uploader">
        <div className="header-container">
          <div style={{ width: '40px' }}>
            <MenuIcon onClick={() => setIsMenuOpen(!isMenuOpen)} />
          </div>
          <div className="title-container">
            <h2 className="title">Manage files: </h2>
          </div>
        </div>

        <div className="cleaner-content">
          <div style={{ display: 'flex' }}>
            <p className='color2' style={{ paddingRight: '10px', paddingBottom: '10px' }}>status: {memoryData.access?.edit?.viewAccess?.visibility}</p>
            <span className="roll-badge">{roll}</span>
          </div>
          
          <div className="files-column">
            <div className="files-group">
              <h3 className='color1' style={{ paddingBottom: '10px' }}>Current Files</h3>
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
              <h3 className='color1' style={{ paddingBottom: '10px' }}>Files to Delete</h3>
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

          {error && <div className="error-message">{error}</div>}

          {Object.values(filesToDelete).some(arr => arr.length > 0) && (
            <button
              className={`submitButton ${isProcessing ? 'processing' : ''}`}
              onClick={() => setConfirmationModalOpen(true)}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Confirm Deletion'}
            </button>
          )}
        </div>
      </div>

      <Modal isOpen={confirmationModalOpen} onClose={() => setConfirmationModalOpen(false)}>
        <div className="danger-modal">
          <h3>⚠️ Permanent Deletion</h3>
          <p>
            Are you sure you want to delete {Object.values(filesToDelete).flat().length} files? 
            This action cannot be undone.
          </p>
          <div style={{ display: "flex", justifyContent: "space-around", paddingTop: '10px' }}>
            <button className="submitButton" onClick={() => setConfirmationModalOpen(false)}>
              Cancel
            </button>
            <button className="submitButton delete" onClick={confirmDeleteFiles}>
              Confirm
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isPreviewModalOpen} onClose={() => setIsPreviewModalOpen(false)}>
        <div  className="preview-modal">
          <div className="modal-header">
            
            <button className="closeXButton" onClick={() => setIsPreviewModalOpen(false)}>
              ×
            </button>
          </div>
          <div style={{ overflow: 'auto', height: '60vh' }}>
            <div className="preview-grid">
              {(activeCategory === 'original'
                ? originalFiles[activeFileType]
                : filesToDelete[activeFileType]
              )?.map((file, index) => 
                renderFilePreview(file, activeCategory === 'toDelete', index)
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MemoryCleaner;