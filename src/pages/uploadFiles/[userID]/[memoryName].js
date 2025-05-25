import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import MenuIcon from '@/components/complex/menuIcon';
import Menu from '@/components/complex/menu';
import Modal from "@/components/complex/modal";
import ShowHide from '@/components/complex/showHide';
import { auth } from '../../../../firebase';
import { toast } from 'react-toastify';
//import { onAuthStateChanged } from 'firebase/auth';

import '../../../app/globals.css';
import '../../../estilos/general/api/upload/filePermissionViewer.css'
import '../../../estilos/general/general.css'































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
  const notifySuccess = (message) => toast.success(message);
  const notifyFailes = (message) => toast.error(message)

  const [userEmail, setUserEmail] = useState(null);
  const [uid, setUid] = useState(null);
  const [token, setToken] = useState(null);
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


  

  // Authentication check
    useEffect(() => {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
          setUid(user.uid);
          try {
            const idToken = await user.getIdToken();
            setToken(idToken);
          } catch (error) {
            console.error('Error getting token:', error);
            setError('Failed to authenticate user');
          }
          const email = user.email || user.providerData?.[0]?.email;
          setUserEmail(email);
        } else {
          const path = window.location.pathname;
          notifyFailes('Please log in before continuing...')
          localStorage.setItem('redirectPath', path);
          localStorage.setItem('reason', 'userEmailValidationOnly');
          setTimeout(() => {
            router.push('/login');
          }, 2000); 
        }
      });
  
      return () => unsubscribe();
    }, [router]);

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

    console.log(files.length);
      console.log(memoryName);
      console.log(userEmail);
      console.log(folderName);

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






















