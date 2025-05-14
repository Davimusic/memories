import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import MenuIcon from '../../../components/complex/menuIcon';
import Menu from '../../../components/complex/menu';
import Modal from "../../../components/complex/modal";
import ShowHide from '@/components/complex/showHide';
import LoadingMemories from '@/components/complex/loading';
import '../../../app/globals.css';
import '../../../estilos/general/api/edit/editMemories.css'
import '../../../estilos/general/general.css'

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

  const transformEmail = useCallback((email) => email.replace(/[@.]/g, '_'), []);

  /*const transformMediaWithUrl = useCallback((mongoMedia, backBlazeFiles) => {
    return mongoMedia.map(item => {
      const fileName = item.storage_path.split('/').pop();
      const bbFile = backBlazeFiles.find(f => f.fileName.endsWith(fileName));
      return {
        ...item,
        url: bbFile?.url || '#',
        type: item.storage_path.includes('photos') 
          ? 'photo' 
          : item.storage_path.includes('videos') 
            ? 'video' 
            : 'audio'
      };
    });
  }, []);*/

  const transformMediaWithUrl = useCallback((mongoMedia, backBlazeFiles) => {
  const bunnyHostname = "https://goodmemories.b-cdn.net";
  return mongoMedia.map(item => {
    const fileName = item.storage_path.split('/').pop();
    const bbFile = backBlazeFiles.find(f => f.fileName.endsWith(fileName));
    
    // URL original de Backblaze
    let fileUrl = bbFile?.url || "#";
    
    if (fileUrl !== "#" && fileUrl.includes("https://f001.backblazeb2.com/file/memoriesAppDavimusic")) {
      // Reemplaza la parte de Backblaze por el hostname de Bunny.net
      fileUrl = fileUrl.replace("https://f001.backblazeb2.com/file/memoriesAppDavimusic", bunnyHostname);
    }
    
    // Si se trata de un video, inserta el segmento para baja calidad (240p)
    if (item.storage_path.includes("videos")) {
      // Esto asume que la transformación se activa insertando "/240" inmediatamente después del hostname.
      fileUrl = fileUrl.replace(bunnyHostname, `${bunnyHostname}/240`);
    }

    console.log({
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
    
    const checkViewPermissions = () => {
      const viewAccess = memoryData.access?.edit;
      if (!viewAccess) {
        setError("Invalid access configuration");
        return;
      }
      
      const userEmail = localStorage.getItem('userEmail');
      if (!userEmail) {
        localStorage.setItem('redirectPath', window.location.pathname);
        router.push('/login');
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
            <h2 className="title">Manage files: {memoryData.metadata.title}</h2>
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

export default MemoryCleaner;


