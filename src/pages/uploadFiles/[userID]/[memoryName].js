import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import MenuIcon from '@/components/complex/menuIcon';
import Menu from '@/components/complex/menu';
import Modal from "@/components/complex/modal";
import ShowHide from '@/components/complex/showHide';
import '../../../app/globals.css';
import '../../../estilos/general/api/upload/filePermissionViewer.css'
import '../../../estilos/general/general.css'

const FilePermissionViewer = () => {
  const router = useRouter();
  const { userID, memoryName } = router.query;
  
  const [permissionInfo, setPermissionInfo] = useState(null);
  const [files, setFiles] = useState({ photos: [], videos: [], audios: [] });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [activeFileType, setActiveFileType] = useState(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [uploadDetails, setUploadDetails] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roll, setRoll] = useState('false');

  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const audioInputRef = useRef(null);

  const transformUserId = (userId) => userId.replace(/[@.]/g, '_');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const email = localStorage.getItem('userEmail');
      if (email) setUserEmail(transformUserId(email));
    }

    const checkIfMobile = () => setIsMobile(window.innerWidth <= 768);
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
      Object.values(files).forEach(fileType => {
        fileType.forEach(file => URL.revokeObjectURL(file.preview));
      });
    };
  }, []);

  useEffect(() => {
    if (!userID || !memoryName) return;

    const fetchPermission = async () => {
      try {
        const response = await fetch('/api/mongoDb/uploadFiles/getMemoryPermissionUploadFiles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userID,
            memoryName,
            currentUser: userEmail || userID,
          }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Error al obtener permisos');
        }

        const visibility = data.access?.upload?.visibility;
        
        if (visibility === 'public') {
          setPermissionInfo(data);
          setRoll('Anyone can upload memories');
          return;
        }

        const path = window.location.pathname;
        const currentUserEmail = localStorage.getItem('userEmail');
        
        if (!currentUserEmail) {
          localStorage.setItem('redirectPath', path);
          localStorage.setItem('reason', 'userEmailValidationOnly');
          router.push('/login');
          return;
        }

        const transformedCurrentEmail = transformUserId(currentUserEmail);
        
        if(transformedCurrentEmail === data.ownerEmail) {
          setPermissionInfo(data);
          setRoll('You are the owner');
          return;
        }

        if (visibility === 'invitation') {
          const invitedEmails = data.access?.upload?.invitedEmails || [];
          const transformedInvitedEmails = invitedEmails.map(email => transformUserId(email));
          
          if (!transformedInvitedEmails.includes(transformedCurrentEmail)) {
            localStorage.setItem('redirectPath', path);
            localStorage.setItem('reason', 'userEmailValidationOnly');
            setRoll('User not allowed');
            return;
          }
          
          setPermissionInfo(data);
          setRoll('Invited to upload memories');
          return;
        }

        setRoll('User not allowed');
      } catch (err) {
        console.error("Error al obtener permisos:", err.message);
        setUploadError(err.message);
      }
    };
    
    fetchPermission();
  }, [userID, memoryName, userEmail]);

  const handleFileChange = (e, fileType) => {
    const selectedFiles = Array.from(e.target.files).map(file => ({
      file,
      preview: URL.createObjectURL(file),
      type: fileType,
      id: `${file.name}_${file.lastModified}_${file.size}`
    }));

    setFiles(prev => ({
      ...prev,
      [fileType]: [...prev[fileType], ...selectedFiles]
    }));
  };

  const removeFile = (fileType, index) => {
    setFiles(prev => {
      const updatedFiles = [...prev[fileType]];
      const [removedFile] = updatedFiles.splice(index, 1);
      URL.revokeObjectURL(removedFile.preview);
      return {
        ...prev,
        [fileType]: updatedFiles
      };
    });

    if (files[activeFileType]?.length === 1) {
      setIsPreviewModalOpen(false);
    }
  };

  const uploadFiles = async () => {
    setIsUploading(true);
    setUploadError(null);

    try {
      if (!permissionInfo) throw new Error('Información de permisos no disponible');

      const memoryData = {
        [memoryName]: {
          media: {
            photos: [],
            videos: [],
            audios: []
          },
          metadata: {
            ...permissionInfo.metadata,
            lastUpdated: new Date().toISOString()
          },
          activity: {
            lastAccessed: new Date().toISOString(),
            edits: [{
              user: userEmail,
              timestamp: new Date().toISOString(),
              action: "upload"
            }]
          }
        }
      };

      for (const fileType of ['photos', 'videos', 'audios']) {
        if (files[fileType].length === 0) continue;

        const formData = new FormData();
        formData.append('fileType', fileType);
        formData.append('userId', userID);
        formData.append('memoryTitle', memoryName);
        files[fileType].forEach(fileObj => formData.append('file', fileObj.file));

        const response = await fetch('/api/blackBlaze/uploadFilesToBackBlaze', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) throw new Error('Error al subir archivos a Backblaze');

        const result = await response.json();
        memoryData[memoryName].media[fileType] = result.uploadedFiles;
      }

      const uploadResponse = await fetch('/api/mongoDb/uploadReferencesFilesToMongoDB', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userEmail,
          memoryData,
          ownerEmail: permissionInfo.ownerEmail
        })
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.message || 'Error al guardar en MongoDB');
      }

      setFiles({ photos: [], videos: [], audios: [] });
      setUploadDetails('¡Files uploaded successfully!');
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error en uploadFiles:', error);
      setUploadError(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (Object.values(files).every(arr => arr.length === 0)) {
      return setUploadError('Agrega al menos un archivo');
    }
    uploadFiles();
  };

  const FileCounter = ({ type, count }) => {
    const handleClick = () => {
      if (count > 0 && files[type].length > 0) {
        setActiveFileType(type);
        setIsPreviewModalOpen(true);
      }
    };

    return (
      <div 
        className={`file-counter color2 ${count > 0 ? 'has-files' : ''}`}
        onClick={handleClick}
      >
        <span className="counter-badge color2">{count}</span>
        <span className="counter-label color2">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
      </div>
    );
  };

  const renderPreviewItem = (file, index) => {
    const uniqueKey = `${file.file.name}_${file.file.lastModified}_${file.file.size}`;
    
    return (
      <div key={uniqueKey} className="preview-item">
        <div className="media-container">
          {file.type === 'photos' && (
            <img 
              src={file.preview} 
              alt="Preview" 
              className="media-preview"
              style={{ objectFit: 'contain' }}
            />
          )}
          {file.type === 'videos' && (
            <video 
              controls
              src={file.preview}
              className="media-preview"
              style={{ objectFit: 'contain' }}
            />
          )}
          {file.type === 'audios' && (
            <div className="audio-preview-container">
              <audio
                controls
                src={file.preview}
                className="audio-preview"
              />
            </div>
          )}
        </div>
        <div className="file-meta">
          <span className="file-name">{file.file.name}</span>
          <span className="file-size">
            {(file.file.size / 1024 / 1024).toFixed(2)} MB
          </span>
          <button 
            className="closeXButton"
            onClick={(e) => {
              e.stopPropagation();
              removeFile(file.type, index);
            }}
          >
            X
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fullscreen-floating mainFont backgroundColor1 color2">
      <Menu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} className='backgroundColor1' />
      
      {isPreviewModalOpen && (
        <div className="preview-modal-overlay" onClick={() => setIsPreviewModalOpen(false)}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className='color1'>{activeFileType?.toUpperCase()}</h3>
              <button 
                className="closeXButton"
                onClick={() => setIsPreviewModalOpen(false)}
              >
                X
              </button>
            </div>
            {files[activeFileType]?.length > 0 ? (
              <div className='scroll-preview'>
                <div className="preview-grid">
                  {files[activeFileType]?.map((file, index) => 
                    renderPreviewItem(file, index)
                  )}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <p>No files to display</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="file-uploader">
        <div style={{ display: 'flex' }}>
          <div className="menu-icon-container">
            <MenuIcon onClick={() => setIsMenuOpen(true)} style={{ zIndex: 10 }} />
          </div>
          {roll === 'User not allowed' ? 
            <h2 style={{color: 'red'}} className="title">{roll}</h2> : 
            <h2 className="title">Upload files to: {permissionInfo?.metadata?.title || memoryName}</h2>
          }
        </div>

        <div className="uploader-content">
          <div className="files-column">
            <div className="file-section-container">
              <div className="section-header">
                {roll === 'User not allowed' ? 
                  <h3 style={{color: 'red'}}>If you believe this is a mistake, please contact the account owner.</h3> : 
                  <h3>Memory Details</h3>
                }
              </div>

              <div className="permission-details">
                {permissionInfo && (
                  <div className="permission-item">
                    <span className="permission-label">Roll:</span>
                    <span className="permission-value">{roll}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {permissionInfo?.uploadPermission && (
            <div className="form-column">
              <form onSubmit={handleSubmit} className="memory-form">
                {uploadError && <div className="error-message">{uploadError}</div>}

                <div className="file-sections">
  {/* Sección de Photos */}
  <div className="file-section-container">
    <div className="section-header">
      <h3>Photos</h3>
      <div className="section-controls">
        <div className="counter-and-preview">
          {files.photos.length > 0 && (
            <>
              <span style={{paddingRight: '10px'}} className="file-count-badge">
                {files.photos.length}
              </span>
              <ShowHide 
                onClick={() => {
                  setActiveFileType('photos');
                  setIsPreviewModalOpen(true);
                }}
                isVisible={isPreviewModalOpen && activeFileType === 'photos'}
                size={20}
              />
            </>
          )}
        </div>
        <button 
          className='add'
          type="button"
          onClick={() => photoInputRef.current.click()}
          disabled={isUploading}
        >
          Add
        </button>
      </div>
    </div>
    <input
      type="file"
      ref={photoInputRef}
      onChange={(e) => handleFileChange(e, 'photos')}
      accept="image/*"
      multiple
      hidden
    />
  </div>

  {/* Sección de Videos (mismo patrón) */}
  <div className="file-section-container">
    <div className="section-header">
      <h3>Videos</h3>
      <div className="section-controls">
        <div className="counter-and-preview">
          {files.videos.length > 0 && (
            <>
              <span style={{paddingRight: '10px'}} className="file-count-badge">
                {files.videos.length}
              </span>
              <ShowHide 
                onClick={() => {
                  setActiveFileType('videos');
                  setIsPreviewModalOpen(true);
                }}
                isVisible={isPreviewModalOpen && activeFileType === 'videos'}
                size={20}
              />
            </>
          )}
        </div>
        <button
          className='add' 
          type="button"
          onClick={() => videoInputRef.current.click()}
          disabled={isUploading}
        >
          Add
        </button>
      </div>
    </div>
    <input
      type="file"
      ref={videoInputRef}
      onChange={(e) => handleFileChange(e, 'videos')}
      accept="video/*"
      multiple
      hidden
    />
  </div>

  {/* Sección de Audios (mismo patrón) */}
  <div className="file-section-container">
    <div className="section-header">
      <h3>Audios</h3>
      <div className="section-controls">
        <div className="counter-and-preview">
          {files.audios.length > 0 && (
            <>
              <span style={{paddingRight: '10px'}} className="file-count-badge">
                {files.audios.length}
              </span>
              <ShowHide 
                onClick={() => {
                  setActiveFileType('audios');
                  setIsPreviewModalOpen(true);
                }}
                isVisible={isPreviewModalOpen && activeFileType === 'audios'}
                size={20}
              />
            </>
          )}
        </div>
        <button 
          className='add'
          type="button"
          onClick={() => audioInputRef.current.click()}
          disabled={isUploading}
        >
          Add
        </button>
      </div>
    </div>
    <input
      type="file"
      ref={audioInputRef}
      onChange={(e) => handleFileChange(e, 'audios')}
      accept="audio/*"
      multiple
      hidden
    />
  </div>
</div>

                <button 
                  type="submit" 
                  disabled={isUploading || !files.photos.length && !files.videos.length && !files.audios.length}
                  className={`submitButton ${isUploading ? 'uploading' : ''}`}
                >
                  {isUploading ? 'Uploading files...' : 'Upload Files'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="modal-content">
          <h3>{uploadDetails}</h3>
          <button className='add' onClick={() => setIsModalOpen(false)}>Close</button>
        </div>
      </Modal>
    </div>
  );
};

export default FilePermissionViewer;

