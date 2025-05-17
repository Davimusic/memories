import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import MenuIcon from '@/components/complex/menuIcon';
import Menu from '@/components/complex/menu';
import Modal from "@/components/complex/modal";
import ShowHide from '@/components/complex/showHide';

import '../../../app/globals.css';
import '../../../estilos/general/api/upload/filePermissionViewer.css'
import '../../../estilos/general/general.css'










/*const FilePermissionViewer = () => {
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
  const [invalidFilesError, setInvalidFilesError] = useState(null);

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
          throw new Error(data.message || 'Error getting permissions');
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
        console.error("Error getting permissions:", err.message);
        setUploadError(err.message);
      }
    };
    
    fetchPermission();
  }, [userID, memoryName, userEmail]);

  const handleFileChange = (e, fileType) => {
    const allowedTypes = {
      photos: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      videos: ['video/mp4'],
      audios: ['audio/mpeg']
    };

    const selectedFiles = Array.from(e.target.files);
    const validFiles = selectedFiles.filter(file => allowedTypes[fileType].includes(file.type));
    const invalidFiles = selectedFiles.filter(file => !allowedTypes[fileType].includes(file.type));

    if (invalidFiles.length > 0) {
      const allowedFormats = {
        photos: 'JPEG, PNG, WebP, GIF',
        videos: 'MP4',
        audios: 'MP3'
      }[fileType];

      setInvalidFilesError({
        title: `Invalid ${fileType} files detected`,
        message: `The selected files contain unsupported formats.`,
        allowed: `Allowed formats: ${allowedFormats}`
      });
    }

    const filesWithPreview = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      type: fileType,
      id: `${file.name}_${file.lastModified}_${file.size}`
    }));

    setFiles(prev => ({
      ...prev,
      [fileType]: [...prev[fileType], ...filesWithPreview]
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

    const sanitizeEmail = (email) => email.replace(/\./g, '(dot)');

    try {
      if (!permissionInfo) throw new Error('Permission information not available');

      const uploadedMedia = {
        photos: [],
        videos: [],
        audios: []
      };

      const uploadPromises = ['photos', 'videos', 'audios'].map(async (fileType) => {
        if (files[fileType].length === 0) return;

        const formData = new FormData();
        formData.append('fileType', fileType);
        formData.append('userId', sanitizeEmail(userID));
        formData.append('memoryTitle', memoryName);
        
        files[fileType].forEach(fileObj => {
          formData.append('file', fileObj.file);
        });

        console.log(files);
        
        
        const response = await fetch('/api/bunny/uploadFilesToBunny', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const errorResponse = await response.json();
          throw new Error(`Upload error: ${errorResponse.message || response.statusText}`);
        }

        const result = await response.json();
        console.log(result);
        
        
        result.files.forEach(file => {
          uploadedMedia[fileType].push({
            url: file.url,
            file_name: file.fileName,
            storage_path: file.path,
            metadata: {
              uploaded_by: sanitizeEmail(userEmail),
              upload_date: new Date().toISOString()
            }
          });
        });

        return result;
      });

      await Promise.all(uploadPromises);

      const memoryData = {
        [memoryName]: {
          media: uploadedMedia,
          metadata: {
            title: memoryName,
            description: permissionInfo.metadata?.description || "",
            created_by: sanitizeEmail(permissionInfo.ownerEmail),
            created_at: new Date().toISOString(),
            last_updated: new Date().toISOString(),
            status: "active",
            total_files: {
              photos: uploadedMedia.photos.length,
              videos: uploadedMedia.videos.length,
              audios: uploadedMedia.audios.length
            }
          },
          activity: {
            last_accessed: new Date().toISOString(),
            edits: [{
              user: sanitizeEmail(userEmail),
              timestamp: new Date().toISOString(),
              action: "upload",
              files_added: {
                photos: uploadedMedia.photos.length,
                videos: uploadedMedia.videos.length,
                audios: uploadedMedia.audios.length
              }
            }]
          }
        }
      };

      console.log(memoryData);
      
      const mongoResponse = await fetch('/api/mongoDb/uploadReferencesFilesToMongoDB', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: sanitizeEmail(userEmail),
          memoryData,
          ownerEmail: sanitizeEmail(permissionInfo.ownerEmail)
        })
      });

      const mongoResult = await mongoResponse.json();
      console.log(mongoResult);
      

      if (!mongoResponse.ok) {
        throw new Error(mongoResult.message || 'Error saving to MongoDB');
      }

      setFiles({ photos: [], videos: [], audios: [] });
      setUploadDetails(`Upload successful! Files uploaded: ${
        Object.values(uploadedMedia).reduce((acc, curr) => acc + curr.length, 0)
      }`);
      setIsModalOpen(true);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error.message);
    } finally {
      setIsUploading(false);
    }
  };






  const handleSubmit = (e) => {
    e.preventDefault();
    if (Object.values(files).every(arr => arr.length === 0)) {
      return setUploadError('Please add at least one file');
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
              style={{ objectFit: 'contain', maxHeight: '200px' }}
            />
          )}
          {file.type === 'videos' && (
            <div className="video-wrapper">
              <video 
                controls
                src={file.preview}
                className="media-preview"
                style={{ maxWidth: '100%', maxHeight: '200px' }}
              />
            </div>
          )}
          {file.type === 'audios' && (
            <div className="audio-wrapper" style={{ width: '100%' }}>
              <audio
                controls
                src={file.preview}
                style={{ width: '100%', height: '40px' }}
              />
              <div className="audio-meta">
                {file.file.name} ({(file.file.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            </div>
          )}
        </div>
        <div className="file-meta">
          <button 
            className="closeXButton"
            onClick={(e) => {
              e.stopPropagation();
              removeFile(file.type, index);
            }}
          >
            ×
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fullscreen-floating mainFont backgroundColor1 color2">
      <Menu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} className='backgroundColor1' />
      
      <Modal isOpen={!!invalidFilesError} onClose={() => setInvalidFilesError(null)}>
        <div className="modal-content">
          <h3>{invalidFilesError?.title}</h3>
          <p>{invalidFilesError?.message}</p>
          <p style={{color: '#4CAF50'}}>{invalidFilesError?.allowed}</p>
          <button 
            className='add' 
            onClick={() => setInvalidFilesError(null)}
          >
            Close
          </button>
        </div>
      </Modal>

      {isPreviewModalOpen && (
        <div className="preview-modal-overlay" onClick={() => setIsPreviewModalOpen(false)}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className='color1'>{activeFileType?.toUpperCase()}</h3>
              <button 
                className="closeXButton"
                onClick={() => setIsPreviewModalOpen(false)}
              >
                ×
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
                    <span className="permission-label">Role:</span>
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
                      accept="image/jpeg, image/png, image/webp, image/gif"
                      multiple
                      hidden
                    />
                  </div>

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
                      accept="video/mp4"
                      multiple
                      hidden
                    />
                  </div>

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
                      accept="audio/mpeg"
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

export default FilePermissionViewer;*/















const DirectBunnyUploader = () => {
  // Configuración
  const BUNNY_ACCESS_KEY = "7026ecef-f874-4c3c-8968e8362281-949a-4e5b";
  const STORAGE_ZONE = "goodmemories";
  const BUNNY_REGION = "ny";
  const BASE_PATH = "e55c81892694f42318e9b3b5131051559650dcba7d0fe0651c2aa472ea6a6c0c/primer_test_bunny";

  // Estados
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [publicUrl, setPublicUrl] = useState("");
  const [selectedType, setSelectedType] = useState("");

  // Validación de tipos de archivo
  const validateFileType = (file, type) => {
    const extension = file.name.split('.').pop().toLowerCase();
    
    switch(type) {
      case 'audio':
        return file.type === 'audio/mpeg' && extension === 'mp3';
      case 'video':
        return file.type === 'video/mp4' && extension === 'mp4';
      case 'image':
        return file.type.startsWith('image/');
      default:
        return false;
    }
  };

  // Función de subida
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !selectedType) return;

    setUploadStatus("Validando archivo...");

    // Validar tipo de archivo
    if (!validateFileType(file, selectedType)) {
      setUploadStatus(`❌ Formato inválido para ${selectedType}`);
      return;
    }

    setUploadStatus("Subiendo...");
    
    try {
      // Generar nombre de archivo seguro
      const timestamp = Date.now();
      const safeName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
      const uploadPath = `${BASE_PATH}/${selectedType}/${safeName}`;

      // Configurar URL de subida
      const uploadUrl = `https://${BUNNY_REGION}.storage.bunnycdn.com/${STORAGE_ZONE}/${uploadPath}`;

      // Subir archivo
      const response = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "AccessKey": BUNNY_ACCESS_KEY,
          "Content-Type": file.type
        },
        body: file
      });

      if (!response.ok) throw new Error(`Error ${response.status}`);
      
      // Generar URL pública
      const cdnUrl = `https://goodmemoriesapp.b-cdn.net/${uploadPath}`;
      setPublicUrl(cdnUrl);
      setUploadStatus("✅ Subido exitosamente");
    } catch (error) {
      console.error("Error:", error);
      setUploadStatus(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl mb-4">Subir Archivo a Bunny.net</h1>
      <form onSubmit={handleUpload}>
        <div className="mb-4">
          <select 
            value={selectedType} 
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Seleccionar tipo de archivo</option>
            <option value="audio">Audio (MP3)</option>
            <option value="video">Video (MP4)</option>
            <option value="image">Imagen</option>
          </select>
        </div>

        <div className="mb-4">
          <input 
            type="file" 
            onChange={(e) => setFile(e.target.files[0])}
            accept={
              selectedType === 'audio' ? '.mp3' : 
              selectedType === 'video' ? '.mp4' : 
              selectedType === 'image' ? 'image/*' : ''
            }
            className="w-full"
            required
          />
        </div>

        <button 
          type="submit" 
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
        >
          Subir Archivo
        </button>
      </form>

      <div className="mt-4">
        <p className="font-medium">Estado: {uploadStatus}</p>
        {publicUrl && (
          <div className="mt-2 break-words">
            <p className="text-sm">Enlace público:</p>
            <a 
              href={publicUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 text-sm"
            >
              {publicUrl}
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectBunnyUploader;





