import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import MenuIcon from '@/components/complex/menuIcon';
import Menu from '@/components/complex/menu';
import Modal from "@/components/complex/modal";
import ShowHide from '@/components/complex/showHide';
import { auth } from '../../../../firebase';
//import { onAuthStateChanged } from 'firebase/auth';

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








/*const validateFileType = (file) => {
    const extension = file.name.split('.').pop().toLowerCase();
    let fileType = ALLOWED_MIME_TYPES[file.type];

    if (!fileType) {
      if (ALLOWED_EXTENSIONS.audio.includes(extension)) {
        fileType = 'audio';
      } else if (ALLOWED_EXTENSIONS.video.includes(extension)) {
        fileType = 'video';
      } else if (ALLOWED_EXTENSIONS.image.includes(extension)) {
        fileType = 'image';
      }
    }

    if (fileType && ALLOWED_EXTENSIONS[fileType].includes(extension)) {
      return { isValid: true, fileType };
    }

    return { isValid: false, fileType: null };
  };

// IndexedDB utility (you can use a library like 'idb' or write your own)
const openDB = () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open('uploads', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      db.createObjectStore('uploadTasks');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const storeUploadTasks = async (files, uploadInfo) => {
  const db = await openDB();
  const tx = db.transaction('uploadTasks', 'readwrite');
  const store = tx.objectStore('uploadTasks');
  const keys = [];
  for (const file of files) {
    const key = Date.now() + Math.random();
    const task = {
      file,
      memoryName: uploadInfo.memoryName,
      userID: uploadInfo.userID,
      folderName: uploadInfo.folderName,
      currentUser: uploadInfo.currentUser,
      fileType: validateFileType(file).fileType,
      fileName: file.name,
    };
    await new Promise((resolve) => {
      const req = store.put(task, key);
      req.onsuccess = () => resolve();
    });
    keys.push(key);
  }
  await new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });
  db.close();
  return keys;
};

const ALLOWED_EXTENSIONS = {
  audio: ['mp3'],
  video: ['mp4'],
  image: ['jpg', 'jpeg', 'png', 'gif'],
};

const ALLOWED_MIME_TYPES = {
  'audio/mp3': 'audio',
  'video/mp4': 'video',
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const DirectBunnyUploader = () => {
  const router = useRouter();
  const { userID, memoryName } = router.query;

  const [userEmail, setUserEmail] = useState(null);
  const [files, setFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadResults, setUploadResults] = useState([]);
  const [folderName, setFolderName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [existingFiles, setExistingFiles] = useState([]);
  const [totalSize, setTotalSize] = useState('0 Bytes');

  useEffect(() => {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then(() => console.log('Service Worker registered'))
        .catch((err) => console.error('Service Worker registration failed:', err));
    }

    const email = localStorage.getItem('userEmail');
    if (email) {
      setUserEmail(email.replace(/[@.]/g, '_'));
    } else {
      const path = window.location.pathname;
      localStorage.setItem('redirectPath', path);
      localStorage.setItem('reason', 'userEmailValidationOnly');
      router.push('/login');
      return;
    }
    const path = window.location.pathname;
    const parts = path.split('/');
    if (parts.length > 2) {
      setFolderName(parts[1]);
    }
  }, [router]);

  useEffect(() => {
    console.log({ userID, memoryName, userEmail, folderName });
  }, [userID, memoryName, userEmail, folderName]);

  useEffect(() => {
    const fetchFiles = async () => {
      if (!userID || !memoryName || !folderName) return;
      setIsLoading(true);
      try {
        const response = await fetch(`/api/list-files?userID=${userID}&memoryName=${memoryName}`);
        const data = await response.json();
        if (data.success) {
          const filteredFiles = data.files.filter((file) =>
            Object.values(ALLOWED_EXTENSIONS)
              .flat()
              .includes(file.name.split('.').pop().toLowerCase())
          );
          setExistingFiles(filteredFiles);
        } else {
          setUploadStatus('Error al cargar los archivos');
        }
      } catch (err) {
        setUploadStatus('Error al cargar los archivos');
        console.error('Error al obtener archivos:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFiles();
  }, [userID, memoryName, folderName]);

  

  const handleFileChange = (e) => {
    const selectedFiles = [...e.target.files];
    if (selectedFiles.length === 0) {
      return;
    }

    const invalidFiles = selectedFiles.filter((file) => !validateFileType(file).isValid);
    if (invalidFiles.length > 0) {
      setUploadStatus(`Archivos inválidos: ${invalidFiles.map((f) => f.name).join(', ')}`);
      return;
    }

    setFiles((prevFiles) => {
      const newFiles = [...prevFiles, ...selectedFiles];
      const totalBytes = newFiles.reduce((sum, file) => sum + file.size, 0);
      setTotalSize(formatFileSize(totalBytes));
      return newFiles;
    });
    setUploadStatus('');
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!files.length || !memoryName || !userEmail || !folderName) {
      setUploadStatus('Faltan parámetros: archivo, memoria, email o carpeta');
      return;
    }

    setUploadStatus('Preparando subida en segundo plano...');
    setIsLoading(true);

    try {
      const uploadInfo = {
        memoryName,
        userID,
        folderName,
        currentUser: userEmail,
      };
      const taskKeys = await storeUploadTasks(files, uploadInfo);
      console.log(taskKeys);
      
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'START_UPLOADS',
          keys: taskKeys,
        });
        setUploadStatus('Subida iniciada en segundo plano');
        setFiles([]);
        setTotalSize('0 Bytes');
      } else {
        setUploadStatus('Error: No hay Service Worker activo');
      }
    } catch (error) {
      setUploadStatus(`Error al preparar la subida: ${error.message}`);
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl mb-4">Subida Segura a Bunny.net</h1>

      <form onSubmit={handleUpload}>
        <div className="mb-4">
          <label className="block mb-2">Archivos (mp3, mp4, jpg, jpeg, png, gif):</label>
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            accept="audio/mp3,video/mp4,image/jpeg,image/png,image/gif"
            className="w-full p-2 border rounded"
          />
        </div>
        {files.length > 0 && (
          <p className="mb-2">Tamaño total: {totalSize}</p>
        )}
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full disabled:bg-gray-400"
          disabled={!files.length || isLoading}
        >
          {isLoading ? 'Preparando...' : `Subir ${files.length} Archivo(s)`}
        </button>
      </form>

      <div className="mt-4">
        <p className="font-medium mb-2">Estado: {uploadStatus}</p>
        <div className="space-y-3">
          {uploadResults.map((result, index) => (
            <div key={index} className="p-3 border rounded-lg">
              <p className="font-medium truncate">{result.file}</p>
              <div className="text-sm mt-1">
                {result.status === 'fulfilled' ? (
                  <div className="text-green-600">
                    ✅ Subido correctamente
                    <div className="text-xs break-all">{result.data.url}</div>
                  </div>
                ) : (
                  <div className="text-red-600">❌ Error: {result.data.message}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Archivos Existentes</h2>
        {isLoading ? (
          <p>Cargando archivos...</p>
        ) : existingFiles.length === 0 ? (
          <p>No hay archivos disponibles</p>
        ) : (
          <div className="space-y-3">
            {existingFiles.map((file, index) => {
              const ext = file.name.split('.').pop().toLowerCase();
              const isImage = ALLOWED_EXTENSIONS.image.includes(ext);
              const isAudio = ALLOWED_EXTENSIONS.audio.includes(ext);
              const isVideo = ALLOWED_EXTENSIONS.video.includes(ext);

              return (
                <div key={index} className="p-3 border rounded-lg">
                  <p className="font-medium truncate">{file.name}</p>
                  {isImage && (
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-full h-40 object-cover mt-2"
                    />
                  )}
                  {isAudio && (
                    <audio controls className="w-full mt-2">
                      <source src={file.url} type="audio/mp3" />
                      Tu navegador no soporta audio.
                    </audio>
                  )}
                  {isVideo && (
                    <video controls className="w-full h-40 object-cover mt-2">
                      <source src={file.url} type="video/mp4" />
                      Tu navegador no soporta video.
                    </video>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectBunnyUploader;*/



























const validateFileType = (file) => {
    const extension = file.name.split('.').pop().toLowerCase();
    let fileType = ALLOWED_MIME_TYPES[file.type];

    if (!fileType) {
      if (ALLOWED_EXTENSIONS.audio.includes(extension)) {
        fileType = 'audio';
      } else if (ALLOWED_EXTENSIONS.video.includes(extension)) {
        fileType = 'video';
      } else if (ALLOWED_EXTENSIONS.image.includes(extension)) {
        fileType = 'image';
      }
    }

    if (fileType && ALLOWED_EXTENSIONS[fileType].includes(extension)) {
      return { isValid: true, fileType };
    }

    return { isValid: false, fileType: null };
  };

// IndexedDB utility (you can use a library like 'idb' or write your own)
const openDB = () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open('uploads', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      db.createObjectStore('uploadTasks');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const storeUploadTasks = async (files, uploadInfo) => {
  const db = await openDB();
  const tx = db.transaction('uploadTasks', 'readwrite');
  const store = tx.objectStore('uploadTasks');
  const keys = [];
  for (const file of files) {
    const key = Date.now() + Math.random();
    const task = {
      file,
      memoryName: uploadInfo.memoryName,
      userID: uploadInfo.userID,
      folderName: uploadInfo.folderName,
      currentUser: uploadInfo.currentUser,
      fileType: validateFileType(file).fileType,
      fileName: file.name,
    };
    await new Promise((resolve) => {
      const req = store.put(task, key);
      req.onsuccess = () => resolve();
    });
    keys.push(key);
  }
  await new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });
  db.close();
  return keys;
};

const ALLOWED_EXTENSIONS = {
  audio: ['mp3'],
  video: ['mp4'],
  image: ['jpg', 'jpeg', 'png', 'gif'],
};

const ALLOWED_MIME_TYPES = {
  'audio/mp3': 'audio',
  'video/mp4': 'video',
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
  

const DirectBunnyUploader = () => {
  const router = useRouter();
  const { userID, memoryName } = router.query;

  const [userEmail, setUserEmail] = useState(null);
  const [files, setFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadResults, setUploadResults] = useState([]);
  const [folderName, setFolderName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [existingFiles, setExistingFiles] = useState([]);
  const [totalSize, setTotalSize] = useState('0 Bytes');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [activeFileType, setActiveFileType] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [invalidFilesError, setInvalidFilesError] = useState(null);
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false);

  const audioInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const imageInputRef = useRef(null);


  /*const email = localStorage.getItem('userEmail');
    if (email) {
      setUserEmail(email.replace(/[@.]/g, '_'));
    } else {
      const path = window.location.pathname;
      localStorage.setItem('redirectPath', path);
      localStorage.setItem('reason', 'userEmailValidationOnly');
      router.push('/login');
      return;
    }*/

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

  useEffect(() => {
    
    
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            await registration.unregister();
          }

          const registration = await navigator.serviceWorker.register('/service-worker.js');
          console.log('Service Worker registered');

          if (registration.active) {
            setIsServiceWorkerReady(true);
          } else {
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'activated') {
                  setIsServiceWorkerReady(true);
                }
              });
            });
          }
        } catch (err) {
          console.error('Service Worker registration failed:', err);
        }
      }
    };

    registerServiceWorker();

    
    const path = window.location.pathname;
    const parts = path.split('/');
    if (parts.length > 2) {
      setFolderName(parts[1]);
    }
  }, [router]);

  useEffect(() => {
    console.log({ userID, memoryName, userEmail, folderName });
  }, [userID, memoryName, userEmail, folderName]);

  /*useEffect(() => {
    const fetchFiles = async () => {
      if (!userID || !memoryName || !folderName) return;
      setIsLoading(true);
      try {
        const response = await fetch(`/api/list-files?userID=${userID}&memoryName=${memoryName}`);
        const data = await response.json();
        if (data.success) {
          const filteredFiles = data.files.filter((file) =>
            Object.values(ALLOWED_EXTENSIONS)
              .flat()
              .includes(file.name.split('.').pop().toLowerCase())
          );
          setExistingFiles(filteredFiles);
        }
      } catch (err) {
        console.error('Error al obtener archivos:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFiles();
  }, [userID, memoryName, folderName]);*/

  const handleFileChange = (e, fileType) => {
    const selectedFiles = [...e.target.files];
    if (selectedFiles.length === 0) {
      return;
    }

    const invalidFiles = selectedFiles.filter((file) => !validateFileType(file).isValid);
    if (invalidFiles.length > 0) {
      const allowedFormats = {
        image: 'JPEG, PNG, GIF',
        video: 'MP4',
        audio: 'MP3'
      }[fileType];
      setInvalidFilesError({
        title: `Archivos ${fileType} inválidos detectados`,
        message: `Los archivos seleccionados contienen formatos no soportados.`,
        allowed: `Formatos permitidos: ${allowedFormats}`
      });
      return;
    }

    const filesWithPreview = selectedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      type: fileType,
      id: `${file.name}_${file.lastModified}_${file.size}`
    }));

    setFiles((prevFiles) => {
      const newFiles = [...prevFiles, ...filesWithPreview];
      const totalBytes = newFiles.reduce((sum, file) => sum + file.file.size, 0);
      setTotalSize(formatFileSize(totalBytes));
      return newFiles;
    });
    setUploadStatus('');
    e.target.value = '';
  };

  const removeFile = (index) => {
    setFiles(prev => {
      const updatedFiles = [...prev];
      const [removedFile] = updatedFiles.splice(index, 1);
      URL.revokeObjectURL(removedFile.preview);
      const totalBytes = updatedFiles.reduce((sum, file) => sum + file.file.size, 0);
      setTotalSize(formatFileSize(totalBytes));
      return updatedFiles;
    });

    if (files.length === 1) {
      setIsPreviewModalOpen(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!files.length || !memoryName || !userEmail || !folderName) {
      console.log(files.length);
      console.log(memoryName);
      console.log(userEmail);
      console.log(folderName);
      
      setUploadStatus('Faltan parámetros: archivo, memoria, email o carpeta');
      return;
    }

    setUploadStatus('Preparando subida...');
    setIsLoading(true);

    try {
      const uploadInfo = {
        memoryName,
        userID,
        folderName,
        currentUser: userEmail,
      };

      if (navigator.serviceWorker.controller) {
        const taskKeys = await storeUploadTasks(files.map(f => f.file), uploadInfo);
        navigator.serviceWorker.controller.postMessage({
          type: 'START_UPLOADS',
          keys: taskKeys,
        });
        setUploadStatus('Subida iniciada en segundo plano');
      } else {
        setUploadStatus('Service Worker no activo, subiendo directamente...');
        for (const file of files) {
          const authResponse = await fetch(
            `/api/bunny/secureUpload?memoryName=${encodeURIComponent(memoryName)}&userID=${userID}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'file-type': file.file.type },
              body: JSON.stringify({
                currentUser: userEmail,
                type: folderName,
                fileType: file.type,
                fileName: file.file.name,
              }),
            }
          );

          if (!authResponse.ok) throw new Error('Failed to get upload URL');
          const { uploadUrl, headers } = await authResponse.json();

          const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            headers: { ...headers, 'Content-Type': file.file.type },
            body: file.file,
          });

          if (!uploadResponse.ok) throw new Error('Upload failed');
        }
        setUploadStatus('Subida completada directamente');
      }

      setFiles([]);
      setTotalSize('0 Bytes');
      setIsModalOpen(true);
    } catch (error) {
      setUploadStatus(`Error al preparar la subida: ${error.message}`);
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerAudioInput = () => audioInputRef.current.click();
  const triggerVideoInput = () => videoInputRef.current.click();
  const triggerImageInput = () => imageInputRef.current.click();

  const FileCounter = ({ type, count }) => {
    const handleClick = () => {
      if (count > 0) {
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
          {file.type === 'image' && (
            <img 
              src={file.preview} 
              alt="Preview" 
              className="media-preview"
            />
          )}
          {file.type === 'video' && (
            <div className="video-wrapper">
              <video 
                controls
                src={file.preview}
                className="media-preview"
              />
            </div>
          )}
          {file.type === 'audio' && (
            <div className="audio-wrapper audio-preview-container">
              <audio
                controls
                src={file.preview}
                className="audio-preview"
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
              removeFile(index);
            }}
            aria-label="Remove file"
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
            Cerrar
          </button>
        </div>
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="modal-content">
          <h3>{uploadStatus}</h3>
          <button className='add' onClick={() => setIsModalOpen(false)}>Cerrar</button>
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
                aria-label="Close preview modal"
              >
                ×
              </button>
            </div>
            {files.filter(f => f.type === activeFileType).length > 0 ? (
              <div className='scroll-preview'>
                <div className="preview-grid">
                  {files.filter(f => f.type === activeFileType).map((file, index) => 
                    renderPreviewItem(file, index)
                  )}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <p>No hay archivos para mostrar</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="file-uploader">
        <div className="header-container" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MenuIcon onClick={() => setIsMenuOpen(true)} style={{ zIndex: 10 }} />
          <h2 className="title"> {memoryName}</h2>
        </div>

        <div className="uploader-content">
          <div className="files-column">
            <div className="file-section-container">
              <div className="section-header">
                <h3>Detalles de la Memoria</h3>
              </div>
              <div className="permission-details">
                <div className="permission-item">
                  <span className="permission-label">Usuario:</span>
                  <span className="permission-value">{userEmail}</span>
                </div>
                
                <div className="permission-item">
                  <span className="permission-label">Tamaño Total:</span>
                  <span className="permission-value">{totalSize}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="form-column">
            <form onSubmit={handleUpload} className="memory-form">
              {uploadStatus && <div className="error-message">{uploadStatus}</div>}

              <div className="file-sections">
                <div className="file-section-container">
                  <div className="section-header">
                    <h3>Fotos</h3>
                    <div className="section-controls">
                      <div className="counter-and-preview">
                        {files.filter(f => f.type === 'image').length > 0 && (
                          <>
                            <span className="file-count-badge">
                              {files.filter(f => f.type === 'image').length}
                            </span>
                            <ShowHide 
                              onClick={() => {
                                setActiveFileType('image');
                                setIsPreviewModalOpen(true);
                              }}
                              isVisible={isPreviewModalOpen && activeFileType === 'image'}
                              size={20}
                            />
                          </>
                        )}
                      </div>
                      <button 
                        className='add'
                        type="button"
                        onClick={triggerImageInput}
                        disabled={isLoading}
                        aria-label="Add image files"
                      >
                        Añadir
                      </button>
                    </div>
                  </div>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => handleFileChange(e, 'image')}
                    accept="image/jpeg,image/png,image/gif"
                    ref={imageInputRef}
                    id="image-input"
                    hidden
                    aria-label="Select image files"
                  />
                </div>

                <div className="file-section-container">
                  <div className="section-header">
                    <h3>Videos</h3>
                    <div className="section-controls">
                      <div className="counter-and-preview">
                        {files.filter(f => f.type === 'video').length > 0 && (
                          <>
                            <span className="file-count-badge">
                              {files.filter(f => f.type === 'video').length}
                            </span>
                            <ShowHide 
                              onClick={() => {
                                setActiveFileType('video');
                                setIsPreviewModalOpen(true);
                              }}
                              isVisible={isPreviewModalOpen && activeFileType === 'video'}
                              size={20}
                            />
                          </>
                        )}
                      </div>
                      <button 
                        className='add'
                        type="button"
                        onClick={triggerVideoInput}
                        disabled={isLoading}
                        aria-label="Add video files"
                      >
                        Añadir
                      </button>
                    </div>
                  </div>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => handleFileChange(e, 'video')}
                    accept="video/mp4"
                    ref={videoInputRef}
                    id="video-input"
                    hidden
                    aria-label="Select video files"
                  />
                </div>

                <div className="file-section-container">
                  <div className="section-header">
                    <h3>Audios</h3>
                    <div className="section-controls">
                      <div className="counter-and-preview">
                        {files.filter(f => f.type === 'audio').length > 0 && (
                          <>
                            <span className="file-count-badge">
                              {files.filter(f => f.type === 'audio').length}
                            </span>
                            <ShowHide 
                              onClick={() => {
                                setActiveFileType('audio');
                                setIsPreviewModalOpen(true);
                              }}
                              isVisible={isPreviewModalOpen && activeFileType === 'audio'}
                              size={20}
                            />
                          </>
                        )}
                      </div>
                      <button 
                        className='add'
                        type="button"
                        onClick={triggerAudioInput}
                        disabled={isLoading}
                        aria-label="Add audio files"
                      >
                        Añadir
                      </button>
                    </div>
                  </div>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => handleFileChange(e, 'audio')}
                    accept="audio/mp3"
                    ref={audioInputRef}
                    id="audio-input"
                    hidden
                    aria-label="Select audio files"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading || !files.length || !isServiceWorkerReady}
                className={`submitButton ${isLoading ? 'uploading' : ''}`}
                aria-label="Upload selected files"
              >
                {isLoading ? 'Preparando...' : `Subir ${files.length} Archivo(s)`}
              </button>
            </form>
          </div>
        </div>

        <div className="file-section-container mt-6">
          {isLoading ? (
            <p>Cargando archivos...</p>
          ) : existingFiles.length === 0 ? (
            <p></p>
          ) : (
            <div className="preview-grid">
              {existingFiles.map((file, index) => {
                const ext = file.name.split('.').pop().toLowerCase();
                const isImage = ALLOWED_EXTENSIONS.image.includes(ext);
                const isAudio = ALLOWED_EXTENSIONS.audio.includes(ext);
                const isVideo = ALLOWED_EXTENSIONS.video.includes(ext);

                return (
                  <div key={index} className="preview-item">
                    <div className="media-container">
                      {isImage && (
                        <img
                          src={file.url}
                          alt={file.name}
                          className="media-preview"
                        />
                      )}
                      {isAudio && (
                        <div className="audio-wrapper audio-preview-container">
                          <audio
                            controls
                            src={file.url}
                            className="audio-preview"
                          />
                          <div className="audio-meta">
                            {file.name}
                          </div>
                        </div>
                      )}
                      {isVideo && (
                        <div className="video-wrapper">
                          <video
                            controls
                            src={file.url}
                            className="media-preview"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {uploadResults.length > 0 && (
          <div className="file-section-container mt-6">
            <div className="section-header">
              <h3>Resultados de Subida</h3>
            </div>
            <div className="preview-grid">
              {uploadResults.map((result, index) => (
                <div key={index} className="preview-item">
                  <div className="media-container">
                    <p className="font-medium truncate">{result.file}</p>
                    <div className="text-sm mt-1">
                      {result.status === 'fulfilled' ? (
                        <div className="text-green-600">
                          ✅ Subido correctamente
                          <div className="text-xs break-all">{result.data.url}</div>
                        </div>
                      ) : (
                        <div className="text-red-600">❌ Error: {result.data.message}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectBunnyUploader;






















