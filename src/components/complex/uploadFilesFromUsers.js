import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import '../../estilos/general/fileUploader.css'
'../../estilos/general/general.css'
import Menu from './menu';
import MenuIcon from './menuIcon';
import { useRouter } from 'next/router';





 
const FileUploader = ({ userId, onUploadComplete, onClose }) => {
  // States
  const [memoryTitle, setMemoryTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState({
    photos: [],
    videos: [],
    audios: []
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [activeFileType, setActiveFileType] = useState(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Refs
  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const router = useRouter();

  // Detect mobile on mount and on resize
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      files.photos.forEach(photo => URL.revokeObjectURL(photo.preview));
      files.videos.forEach(video => URL.revokeObjectURL(video.preview));
      files.audios.forEach(audio => URL.revokeObjectURL(audio.preview));
    };
  }, [files]);

  // Menu handlers
  const handleOpenMenu = () => setIsMenuOpen(true);
  const handleCloseMenu = () => setIsMenuOpen(false);

  const handleUpdateBackgroundColor = () => {
    console.log("Background color update triggered");
    // Implement your color update logic here
  };

  // Handle file selection
  const handleFileChange = (e, fileType) => {
    const selectedFiles = Array.from(e.target.files);
    
    setFiles(prev => ({
      ...prev,
      [fileType]: [
        ...prev[fileType],
        ...selectedFiles.map(file => ({
          file,
          preview: URL.createObjectURL(file),
          type: fileType
        }))
      ]
    }));
  };

  // Remove file
  const removeFile = (fileType, index) => {
    const fileToRemove = files[fileType][index];
    URL.revokeObjectURL(fileToRemove.preview);
    
    setFiles(prev => ({
      ...prev,
      [fileType]: prev[fileType].filter((_, i) => i !== index)
    }));
  };

  // Upload files to Backblaze B2
  const uploadFiles = async () => {
    setIsUploading(true);
    setUploadError(null);
  
    try {
      const totalFiles = files.photos.length + files.videos.length + files.audios.length;
      if (totalFiles === 0) {
        throw new Error("You must select at least one file");
      }
  
      const memoryData = {
        [memoryTitle]: {
          photos: [],
          videos: [],
          audios: [],
          metadata: {
            descripcion: description,
            fecha_creacion: new Date().toISOString(),
            ultima_modificacion: new Date().toISOString()
          }
        }
      };
  
      for (const fileType of ['photos', 'videos', 'audios']) {
        if (files[fileType].length === 0) continue;
  
        const formData = new FormData();
        formData.append('userId', userId);
        formData.append('memoryTitle', memoryTitle);
        formData.append('description', description);
        formData.append('fileType', fileType);
  
        files[fileType].forEach(fileObj => {
          formData.append('file', fileObj.file); // Changed from 'file' to 'files' to match typical multi-file upload convention
        });
  
        const response = await fetch('/api/blackBlaze/uploadFilesToBackBlaze', {
          method: 'POST',
          body: formData
        });
  
        if (!response.ok) {
          throw new Error(`Error uploading ${fileType}: ${response.statusText}`);
        }
  
        const result = await response.json();
        
        // Check if result is an array (for multiple files) or a single object
        const uploadedFiles = Array.isArray(result) ? result : [result];
        
        uploadedFiles.forEach(uploadedFile => {
          memoryData[memoryTitle][fileType].push({
            file_name: uploadedFile.file_name || uploadedFile.originalFilename,
            storage_path: uploadedFile.storage_path || uploadedFile.finalFileName,
            metadata: {
              fecha_subida: new Date().toISOString(),
              formato: uploadedFile.metadata?.formato || uploadedFile.file_name?.split('.').pop() || 'unknown',
              size: uploadedFile.metadata?.size || '0MB'
            }
          });
        });
      }
  
      const mongoResponse = await fetch('/api/mongoDb/uploadReferencesFilesToMongoDB', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, memoryData })
      });
  
      if (!mongoResponse.ok) {
        throw new Error(`MongoDB error: ${await mongoResponse.text()}`);
      }
  
      setMemoryTitle('');
      setDescription('');
      setFiles({ photos: [], videos: [], audios: [] });
      [photoInputRef, videoInputRef, audioInputRef].forEach(ref => {
        if (ref.current) ref.current.value = '';
      });
  
      onUploadComplete(await mongoResponse.json());
  
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!memoryTitle) {
      setUploadError('Please provide a title');
      return;
    }

    if (files.photos.length === 0 && files.videos.length === 0 && files.audios.length === 0) {
      setUploadError('Please add at least one file');
      return;
    }

    await uploadFiles();
  };

  const FileCounter = ({ type, count }) => (
    <div 
      className={`file-counter ${count > 0 ? 'has-files' : ''}`}
      onClick={() => {
        if (count > 0) {
          setActiveFileType(type);
          setIsPreviewModalOpen(true);
        }
      }}
    >
      <span className="counter-badge">{count}</span>
      <span className="counter-label">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
    </div>
  );

  return (
    <div className="fullscreen-floating">
      {/* Menu Component */}
      <Menu 
        isOpen={isMenuOpen} 
        onClose={handleCloseMenu}
        openUpdateBackgroundColor={handleUpdateBackgroundColor}
        className='backgroundColor1'
      />
      
      <div className="file-uploader">
        <div className="uploader-header">
          <div className="menu-icon-container">
            <MenuIcon onClick={handleOpenMenu} style={{ zIndex: 10000 }} />
          </div>
          <h2 className="title">Upload New Memory</h2>
          <div className="spacer"></div>
        </div>
  
        <div className="uploader-content">
          <div className="form-column">
            <form onSubmit={handleSubmit} id="memory-form">
              <div className="form-group">
                <label>Memory Title *</label>
                <input
                  type="text"
                  className="text-input"
                  value={memoryTitle}
                  onChange={(e) => setMemoryTitle(e.target.value)}
                  required
                  disabled={isUploading}
                />
              </div>
  
              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  className="text-input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="5"
                  disabled={isUploading}
                />
              </div>
  
              {uploadError && <div className="error-message">{uploadError}</div>}
  
              {!isMobile && (
                <div className="actions">
                  <button
                    type="submit"
                    className={`submit-btn ${isUploading ? 'highlight' : ''}`}
                    disabled={isUploading}
                  >
                    {isUploading
                      ? `Uploading... ${uploadProgress}%`
                      : 'Save Memory'}
                  </button>
                </div>
              )}
            </form>
          </div>
  
          <div className="files-column">
            <div className="file-section-container">
              <div className="section-header">
                <h3>Photos</h3>
                <div className="section-controls">
                  <FileCounter type="photos" count={files.photos.length} />
                  <button 
                    type="button"
                    className="file-input-button"
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
                className="file-input"
                disabled={isUploading}
                style={{ display: 'none' }}
              />
            </div>
  
            <div className="file-section-container">
              <div className="section-header">
                <h3>Videos</h3>
                <div className="section-controls">
                  <FileCounter type="videos" count={files.videos.length} />
                  <button 
                    type="button"
                    className="file-input-button"
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
                className="file-input"
                disabled={isUploading}
                style={{ display: 'none' }}
              />
            </div>
  
            <div className="file-section-container">
              <div className="section-header">
                <h3>Audios</h3>
                <div className="section-controls">
                  <FileCounter type="audios" count={files.audios.length} />
                  <button 
                    type="button"
                    className="file-input-button"
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
                className="file-input"
                disabled={isUploading}
                style={{ display: 'none' }}
              />
            </div>
          </div>
          
          {isMobile && (
            <div className="mobile-save-memory">
              <button
                type="submit"
                form="memory-form"
                className={`submit-btn ${isUploading ? 'highlight' : ''}`}
                disabled={isUploading}
              >
                {isUploading
                  ? `Uploading... ${uploadProgress}%`
                  : 'Save Memory'}
              </button>
            </div>
          )}
        </div>
  
        {isPreviewModalOpen && (
          <div className="preview-modal">
            <div className="modal-header">
              <h3>{activeFileType?.toUpperCase()}</h3>
              <button 
                className="close-btn"
                onClick={() => setIsPreviewModalOpen(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <div className="preview-grid">
                {files[activeFileType]?.map((file, index) => (
                  <div key={index} className="preview-item">
                    {activeFileType === 'photos' && (
                      <img 
                        src={file.preview} 
                        alt="Preview" 
                        className="media-preview"
                      />
                    )}
                    {activeFileType === 'videos' && (
                      <video className="media-preview" controls>
                        <source src={file.preview} type={file.file.type} />
                      </video>
                    )}
                    {activeFileType === 'audios' && (
                      <div className="audio-preview">
                        <audio controls>
                          <source src={file.preview} type={file.file.type} />
                        </audio>
                      </div>
                    )}
                    <button
                      className="remove-btn"
                      onClick={() => removeFile(activeFileType, index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploader;