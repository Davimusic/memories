import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import MenuIcon from '@/components/complex/menuIcon';
import Menu from '@/components/complex/menu';
import Modal from "@/components/complex/modal";
import ShowHide from '@/components/complex/showHide';
import GeneralMold from '@/components/complex/generalMold';
import { auth } from '../../../../firebase';
import { toast } from 'react-toastify';
//import { onAuthStateChanged } from 'firebase/auth';

import '../../../app/globals.css';
import '../../../estilos/general/api/upload/filePermissionViewer.css'
//import '../../../estilos/general/general.css'









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

const openDB = () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open('Uploads', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      db.createObjectStore('uploadTasks');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const generateUniqueKey = () => `${Date.now()}_${Math.random().toString(36).substring(2)}`;

const storeUploadTasks = async (files, uploadInfo) => {
  const db = await openDB();
  const tx = db.transaction('uploadTasks', 'readwrite');
  const store = tx.objectStore('uploadTasks');
  const keys = [];
  for (const file of files) {
    const key = generateUniqueKey();
    const task = {
      file,
      memoryName: uploadInfo.memoryName,
      userID: uploadInfo.userID,
      folderName: uploadInfo.folderName,
      currentUser: uploadInfo.currentUser,
      fileType: validateFileType(file).fileType,
      fileName: file.name,
      uid: uploadInfo.uid,
      token: uploadInfo.token,
    };
    await new Promise((resolve) => {
      const req = store.put(task, key);
      req.onsuccess = () => resolve();
      req.onerror = () => console.error('Error storing task for key:', key);
    });
    keys.push(key);
  }
  await new Promise((resolve) => {
    tx.oncomplete = () => resolve();
  });
  db.close();
  return keys;
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Add getServerSideProps to fetch memory data
export async function getServerSideProps(context) {
  const { userID, memoryName } = context.query;

  if (!userID || !memoryName) {
    return {
      props: {
        error: 'Missing userID or memoryName',
      },
    };
  }

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const res = await fetch(`${apiUrl}/api/mongoDb/postMemoryReferenceUser`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userID, memoryTitle: memoryName }),
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
      setError(res.status)
    }

    const mongoData = await res.json();

    if (!mongoData.success) {
      throw new Error('Failed to load memory data');
    }

    const formattedData = {
      ...mongoData.memory,
      ownerEmail: mongoData.ownerEmail,
      metadata: {
        ...mongoData.memory.metadata,
        createdAt: mongoData.memory.metadata.createdAt
          ? new Date(mongoData.memory.metadata.createdAt).toISOString()
          : null,
        lastUpdated: mongoData.memory.metadata.lastUpdated
          ? new Date(mongoData.memory.metadata.lastUpdated).toISOString()
          : null,
      },
      access: mongoData.memory.access || {},
      media: {
        photos: mongoData.memory.media.photos || [],
        videos: mongoData.memory.media.videos || [],
        audios: mongoData.memory.media.audios || [],
        documents: mongoData.memory.media.documents || [],
      },
    };

    return {
      props: {
        initialMemoryData: formattedData,
        userID,
        memoryName,
      },
    };
  } catch (err) {
    console.error('getServerSideProps error:', err.message);
    return {
      props: {
        error: err.message || 'Failed to fetch memory data',
      },
    };
  }
}

const DirectBunnyUploader = ({ initialMemoryData, userID, memoryName, error: initialError }) => {
  const router = useRouter();
  const { folderName: queryFolderName } = router.query;
  const notifySuccess = (message) => toast.success(message);
  const notifyFailes = (message) => toast.error(message);

  const [userEmail, setUserEmail] = useState(null);
  const [uid, setUid] = useState(null);
  const [token, setToken] = useState(null);
  const [files, setFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadResults, setUploadResults] = useState([]);
  const [folderName, setFolderName] = useState(queryFolderName || '');
  const [isLoading, setIsLoading] = useState(false);
  const [existingFiles, setExistingFiles] = useState([]);
  const [totalSize, setTotalSize] = useState('0 Bytes');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [activeFileType, setActiveFileType] = useState(null);
  const [invalidFilesError, setInvalidFilesError] = useState(null);
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roll, setRoll] = useState('false'); // Add roll state
  const [error, setError] = useState(initialError);
  const [memoryData, setMemoryData] = useState(initialMemoryData);

  const audioInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const imageInputRef = useRef(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUid(user.uid);
        try {
          const idToken = await user.getIdToken();
          setToken(idToken);
        } catch (error) {
          console.error('Error getting token:', error);
          setUploadStatus('Failed to authenticate user');
        }
        const email = user.email || user.providerData?.[0]?.email;
        setUserEmail(email);
      } else {
        const path = window.location.pathname;
        notifyFailes('Please log in before continuing...');
        localStorage.setItem('redirectPath', path);
        localStorage.setItem('reason', 'userEmailValidationOnly');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Role-checking logic similar to MemoryDetail
  useEffect(() => {
    if (!memoryData || !userEmail) return;

    const checkViewPermissions = () => {
      const viewAccess = memoryData.access?.view;
      if (!viewAccess) {
        setError('Invalid access configuration');
        return;
      }

      const { visibility, invitedEmails = [] } = viewAccess;
      const currentPath = router.asPath;

      if (visibility === 'public') {
        setRoll('Anyone can upload memories');
        return;
      }

      if (!userEmail) {
        localStorage.setItem('redirectPath', currentPath);
        localStorage.setItem('reason', 'userEmailValidationOnly');
        router.push('/login');
        return;
      }

      const transformEmail = (email) => email.replace(/[@.]/g, '_');
      const currentUserTransformed = transformEmail(userEmail);
      const ownerTransformed = transformEmail(memoryData.ownerEmail);

      if (visibility === 'private') {
        if (currentUserTransformed === ownerTransformed) {
          setRoll('You are the owner');
          return;
        }
        setRoll('User not allowed');
        setMemoryData(null);
        setError('User not allowed');
        return;
      }

      if (visibility === 'invitation') {
        const transformedInvites = invitedEmails.map(transformEmail);
        if (transformedInvites.includes(currentUserTransformed)) {
          setRoll('Invited to upload memories');
          return;
        }
        setRoll('User not allowed');
        setMemoryData(null);
        setError('User not allowed');
      }
    };

    checkViewPermissions();
  }, [memoryData, userEmail, router]);

  useEffect(() => {
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            await registration.unregister();
          }

          const registration = await navigator.serviceWorker.register('/service-worker.js');
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
  }, []);

  useEffect(() => {
    const handleServiceWorkerMessage = (event) => {
      if (event.data.type === 'UPLOAD_STATUS') {
        if (event.data.failedTasks?.length > 0) {
          setUploadStatus(`Some uploads failed: ${event.data.failedTasks.map(t => t.error).join(', ')}`);
        } else {
          setUploadStatus('All uploads completed successfully');
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
  }, []);

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
        audio: 'MP3',
      }[fileType];
      setInvalidFilesError({
        title: `Invalid ${fileType} files detected`,
        message: `The selected files contain unsupported formats.`,
        allowed: `Allowed formats: ${allowedFormats}`,
      });
      return;
    }

    const filesWithPreview = selectedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      type: fileType,
      id: `${file.name}_${file.lastModified}_${file.size}`,
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
    setFiles((prev) => {
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
      setUploadStatus('Missing parameters: file, memory, email, or folder');
      return;
    }

    // Check if user is allowed to upload
    if (roll === 'User not allowed') {
      setUploadStatus('You do not have permission to upload files.');
      return;
    }

    setUploadStatus('Preparing upload...');
    setIsLoading(true);

    try {
      const uploadInfo = {
        memoryName,
        userID,
        folderName,
        currentUser: userEmail,
        uid,
        token,
      };

      if (navigator.serviceWorker.controller) {
        const taskKeys = await storeUploadTasks(files.map((f) => f.file), uploadInfo);
        navigator.serviceWorker.controller.postMessage({
          type: 'START_UPLOADS',
          keys: taskKeys,
        });
        setUploadStatus('Upload started in background');
      } else {
        setUploadStatus('Service Worker not active, uploading directly...');
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
                token,
                uid,
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
        setUploadStatus('Upload completed directly');
      }

      setFiles([]);
      setTotalSize('0 Bytes');
      setIsModalOpen(true);
    } catch (error) {
      setUploadStatus(`Upload preparation error: ${error.message}`);
      console.error('Upload error:', error);
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
      <div className={`file-counter color2 ${count > 0 ? 'has-files' : ''}`} onClick={handleClick}>
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
            <img src={file.preview} alt="Preview" className="media-preview" />
          )}
          {file.type === 'video' && (
            <div className="video-wrapper">
              <video controls src={file.preview} className="media-preview" />
            </div>
          )}
          {file.type === 'audio' && (
            <div className="audio-wrapper audio-preview-container">
              <audio controls src={file.preview} className="audio-preview" />
              <div className="audio-meta">
                {file.file.name} ({(file.file.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            </div>
          )}
        </div>
        <div className="file-meta">
          <button
            className="closeButton"
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

  // Modified leftContent to include role
  const leftContent = (
    <div className="file-section-containerDetails p-3">
      <div className="section-header">
        <h3 className="title-md">Memory Details</h3>
      </div>
      <div className="permission-details">
        <div className="permission-item">
          <span className="permission-label">Role:</span>
          <span className={`permission-value ${roll === 'User not allowed' ? 'alertColor' : ''}`}>
            {roll}
          </span>
        </div>
        {roll === 'User not allowed' && (
          <p className="alertColor">
            If you believe this is a mistake, please contact the account owner.
          </p>
        )}
        <div className="permission-item">
          <span className="permission-label">User:</span>
          <span className="permission-value">{userEmail || 'Loading...'}</span>
        </div>
        <div className="permission-item">
          <span className="permission-label">Total Size:</span>
          <span className="permission-value">{totalSize}</span>
        </div>
      </div>
    </div>
  );

  // Right Content remains mostly unchanged
  const rightContent = (
    <div className="uploader-content p-3">
      <form onSubmit={handleUpload} className="memory-form">
        {uploadStatus && <div className="error-message">{uploadStatus}</div>}

        <div className="file-sections">
          <div className="file-section-container">
            <div className="section-header">
              <h3 className="title-md">Photos</h3>
              <div className="section-controls">
                <div className="counter-and-preview">
                  {files.filter((f) => f.type === 'image').length > 0 && (
                    <>
                      <span className="file-count-badge">
                        {files.filter((f) => f.type === 'image').length}
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
                  className="add button2"
                  type="button"
                  onClick={triggerImageInput}
                  disabled={isLoading || roll === 'User not allowed'}
                  aria-label="Add image files"
                >
                  Add
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
              <h3 className="title-md">Videos</h3>
              <div className="section-controls">
                <div className="counter-and-preview">
                  {files.filter((f) => f.type === 'video').length > 0 && (
                    <>
                      <span className="file-count-badge">
                        {files.filter((f) => f.type === 'video').length}
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
                  className="add button2"
                  type="button"
                  onClick={triggerVideoInput}
                  disabled={isLoading || roll === 'User not allowed'}
                  aria-label="Add video files"
                >
                  Add
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
              <h3 className="title-md">Audios</h3>
              <div className="section-controls">
                <div className="counter-and-preview">
                  {files.filter((f) => f.type === 'audio').length > 0 && (
                    <>
                      <span className="file-count-badge">
                        {files.filter((f) => f.type === 'audio').length}
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
                  className="add button2"
                  type="button"
                  onClick={triggerAudioInput}
                  disabled={isLoading || roll === 'User not allowed'}
                  aria-label="Add audio files"
                >
                  Add
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

        {files.length > 0 && (
          <button
            type="submit"
            disabled={isLoading || !isServiceWorkerReady || roll === 'User not allowed'}
            className={`submit-btn button2 ${isLoading ? 'uploading' : ''}`}
            aria-label="Upload selected files"
          >
            {isLoading ? 'Preparing...' : `Upload ${files.length} File(s)`}
          </button>
        )}
      </form>

      <div className="file-section-container m-3">
        {isLoading ? (
          <p className="content-default">Loading files...</p>
        ) : existingFiles.length === 0 ? (
          <p className="content-default"></p>
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
                    {isImage && <img src={file.url} alt={file.name} className="media-preview" />}
                    {isAudio && (
                      <div className="audio-wrapper audio-preview-container">
                        <audio controls src={file.url} className="audio-preview" />
                        <div className="audio-meta">{file.name}</div>
                      </div>
                    )}
                    {isVideo && (
                      <div className="video-wrapper">
                        <video controls src={file.url} className="media-preview" />
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
        <div className="file-section-container m-3">
          <div className="section-header">
            <h3 className="title-md">Upload Results</h3>
          </div>
          <div className="preview-grid">
            {uploadResults.map((result, index) => (
              <div key={index} className="preview-item">
                <div className="media-container">
                  <p className="font-medium truncate">{result.file}</p>
                  <div className="content-small m-1">
                    {result.status === 'fulfilled' ? (
                      <div className="text-green-600">
                        ✅ Uploaded successfully
                        <div className="content-small break-all">{result.data.url}</div>
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
  );

  

  return (
    <>
      <GeneralMold
        pageTitle={memoryName || 'Upload Files'}
        pageDescription="Upload photos, videos, and audios for your memories."
        leftContent={leftContent}
        rightContent={rightContent}
        visibility="private"
        metaKeywords="file upload, media, photos, videos, audios"
        metaAuthor={userEmail || 'User'}
        error={error}
      />

      <Modal isOpen={!!invalidFilesError} onClose={() => setInvalidFilesError(null)}>
        <div className="modal-content card p-3">
          <h3 className="title-md">{invalidFilesError?.title}</h3>
          <p className="content-default">{invalidFilesError?.message}</p>
          <p className="content-default" style={{ color: '#4CAF50' }}>
            {invalidFilesError?.allowed}
          </p>
          <button className="button2" onClick={() => setInvalidFilesError(null)}>
            Close
          </button>
        </div>
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="modal-content card p-3">
          <h3 className="title-md">{uploadStatus}</h3>
          <button className="button2" onClick={() => setIsModalOpen(false)}>
            Close
          </button>
        </div>
      </Modal>

      {isPreviewModalOpen && (
        <div className="modal-overlay" onClick={() => setIsPreviewModalOpen(false)}>
          <div className="modal-content card p-3" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="title-md color1">{activeFileType?.toUpperCase()}</h3>
              <button
                className="closeButton"
                onClick={() => setIsPreviewModalOpen(false)}
                aria-label="Close preview modal"
              >
                ×
              </button>
            </div>
            {files.filter((f) => f.type === activeFileType).length > 0 ? (
              <div className="scroll-preview">
                <div className="preview-grid">
                  {files
                    .filter((f) => f.type === activeFileType)
                    .map((file, index) => renderPreviewItem(file, index))}
                </div>
              </div>
            ) : (
              <div className="empty-state p-3">
                <p className="content-default">No files to display</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default DirectBunnyUploader;