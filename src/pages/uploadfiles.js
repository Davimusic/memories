import React, { useState, useEffect, useRef } from 'react';
//import FileUploader from '../components/complex/uploadFilesFromUsers';
import Modal from "../components/complex/modal";
import Menu from '../components/complex/menu';
import MenuIcon from '../components/complex/menuIcon';
import '../estilos/general/fileUploader.css';
import '../estilos/general/general.css';
import '../app/globals.css';
import { useRouter } from 'next/router';

const App = () => {
  // 1. Estados principales de la aplicación
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadDetails, setUploadDetails] = useState(null);
  const [userEmail, setUserEmail] = useState(null);

  // 2. Estados para el sistema de subida de archivos (originalmente en FileUploader)
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

  // 3. Referencias para los inputs de archivo
  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const router = useRouter();

  // 4. Efectos secundarios
  useEffect(() => {
    // 4.1. Obtener el email del usuario desde localStorage
    if (typeof window !== 'undefined') {
      const email = localStorage.getItem('userEmail');
      if (email) {
        const transformUserId = (userId) => userId.replace(/[@.]/g, '_');
        setUserEmail(transformUserId(email));
      }
    }

    // 4.2. Detectar si es dispositivo móvil
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
      // Limpiar URLs de objetos para evitar fugas de memoria
      files.photos.forEach(photo => URL.revokeObjectURL(photo.preview));
      files.videos.forEach(video => URL.revokeObjectURL(video.preview));
      files.audios.forEach(audio => URL.revokeObjectURL(audio.preview));
    };
  }, [files]);

  // 5. Manejadores del menú
  const handleOpenMenu = () => setIsMenuOpen(true);
  const handleCloseMenu = () => setIsMenuOpen(false);

  const handleUpdateBackgroundColor = () => {
    console.log("Actualización de color de fondo");
  };

  // 6. Manejadores de archivos
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

  const removeFile = (fileType, index) => {
    const fileToRemove = files[fileType][index];
    URL.revokeObjectURL(fileToRemove.preview);
    
    setFiles(prev => ({
      ...prev,
      [fileType]: prev[fileType].filter((_, i) => i !== index)
    }));
  };

  // 7. Función para subir archivos a Backblaze B2
  const uploadFiles = async () => {
    setIsUploading(true);
    setUploadError(null);
  
    try {
      const totalFiles = files.photos.length + files.videos.length + files.audios.length;
      if (totalFiles === 0) {
        throw new Error("Debes seleccionar al menos un archivo");
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
  
      // Subir cada tipo de archivo por separado
      for (const fileType of ['photos', 'videos', 'audios']) {
        if (files[fileType].length === 0) continue;
  
        const formData = new FormData();
        formData.append('userId', userEmail);
        formData.append('memoryTitle', memoryTitle);
        formData.append('description', description);
        formData.append('fileType', fileType);
  
        files[fileType].forEach(fileObj => {
          formData.append('file', fileObj.file); 
        });
  
        const response = await fetch('/api/blackBlaze/uploadFilesToBackBlaze', {
          method: 'POST',
          body: formData
        });
  
        if (!response.ok) {
          throw new Error(`Error subiendo ${fileType}: ${response.statusText}`);
        }
  
        const result = await response.json();
        const { uploadedFiles } = result;
        const archivos = Array.isArray(uploadedFiles) ? uploadedFiles : [uploadedFiles];
        
        archivos.forEach(uploadedFile => {
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
  
      // Guardar referencia en MongoDB
      const mongoResponse = await fetch('/api/mongoDb/uploadReferencesFilesToMongoDB', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userEmail, memoryData })
      });
  
      if (!mongoResponse.ok) {
        throw new Error(`Error en MongoDB: ${await mongoResponse.text()}`);
      }
  
      // Resetear el formulario
      setMemoryTitle('');
      setDescription('');
      setFiles({ photos: [], videos: [], audios: [] });
      [photoInputRef, videoInputRef, audioInputRef].forEach(ref => {
        if (ref.current) ref.current.value = '';
      });
  
      // Mostrar mensaje de éxito
      setUploadDetails('¡Recuerdo guardado exitosamente!');
      setIsModalOpen(true);
  
    } catch (error) {
      console.error('Error en la subida:', error);
      setUploadError(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  // 8. Manejador de envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!memoryTitle) {
      setUploadError('Por favor, proporciona un título');
      return;
    }

    if (files.photos.length === 0 && files.videos.length === 0 && files.audios.length === 0) {
      setUploadError('Por favor añade al menos un archivo');
      return;
    }

    await uploadFiles();
  };

  // 9. Componente contador de archivos (renderizado interno)
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

  // 10. Renderizado principal
  return (
    <div className="fullscreen-floating mainFont">
      {/* Menú lateral */}
      <Menu 
        isOpen={isMenuOpen} 
        onClose={handleCloseMenu}
        openUpdateBackgroundColor={handleUpdateBackgroundColor}
        className='backgroundColor1'
      />
      
      {/* Contenedor principal de subida de archivos */}
      <div className="file-uploader">
        <div className="uploader-header">
          <div className="menu-icon-container">
            <MenuIcon onClick={handleOpenMenu} style={{ zIndex: 10 }} />
          </div>
          <h2 className="title">Subir Nuevo Recuerdo</h2>
          <div className="spacer"></div>
        </div>
  
        <div className="uploader-content">
          {/* Columna del formulario */}
          <div className="form-column">
            <form className='memory-form' onSubmit={handleSubmit} id="memory-form">
              <div className="form-group">
                <label>Título del Recuerdo *</label>
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
                <label>Descripción (Opcional)</label>
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
                      ? `Subiendo... ${uploadProgress}%`
                      : 'Guardar Recuerdo'}
                  </button>
                </div>
              )}
            </form>
          </div>
  
          {/* Columna de selección de archivos */}
          <div className="files-column">
            {/* Sección de fotos */}
            <div className="file-section-container">
              <div className="section-header">
                <h3>Fotos</h3>
                <div className="section-controls">
                  <FileCounter type="photos" count={files.photos.length} />
                  <button 
                    type="button"
                    className="file-input-button"
                    onClick={() => photoInputRef.current.click()}
                    disabled={isUploading}
                  >
                    Añadir
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
  
            {/* Sección de videos */}
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
                    Añadir
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
  
            {/* Sección de audios */}
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
                    Añadir
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
          
          {/* Botón de guardar para móviles */}
          {isMobile && (
            <div className="mobile-save-memory">
              <button
                type="submit"
                form="memory-form"
                className={`submit-btn ${isUploading ? 'highlight' : ''}`}
                disabled={isUploading}
              >
                {isUploading
                  ? `Subiendo... ${uploadProgress}%`
                  : 'Guardar Recuerdo'}
              </button>
            </div>
          )}
        </div>
  
        {/* Modal de vista previa de archivos */}
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
                        alt="Vista previa" 
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

      {/* Modal de confirmación de subida exitosa */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div style={{ padding: "20px", textAlign: "center", color: "white" }}>
          {uploadDetails}
        </div>
      </Modal>
    </div>
  );
};

export default App;


