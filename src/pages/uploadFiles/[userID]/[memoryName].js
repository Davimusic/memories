import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import MenuIcon from '@/components/complex/menuIcon';
import Menu from '@/components/complex/menu';
import Modal from "@/components/complex/modal";
import '../../../app/globals.css';
import '../../../estilos/general/api/upload/filePermissionViewer.css'









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

  useEffect(() => {
    const transformUserId = (userId) => userId.replace(/[@.]/g, '_');
    if (typeof window !== 'undefined') {
      const email = localStorage.getItem('userEmail');
      if (email) setUserEmail(transformUserId(email));
    }

    const checkIfMobile = () => setIsMobile(window.innerWidth <= 768);
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
      files.photos.forEach(photo => URL.revokeObjectURL(photo.preview));
      files.videos.forEach(video => URL.revokeObjectURL(video.preview));
      files.audios.forEach(audio => URL.revokeObjectURL(audio.preview));
    };
  }, [files]);


  //verifica permisos
  useEffect(() => {
    if (!userID || !memoryName) {
      console.log("Falta alguno de los parámetros requeridos: userID o memoryName.");
      return;
    }
  
    const fetchPermission = async () => {
      try {
        console.log("Iniciando la petición de permisos para la memoria:", memoryName);
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
        console.log(data);
        
  
        if (!response.ok) {
          console.log("Error en la respuesta:", data.message || "Error al obtener permisos");
          throw new Error(data.message || 'Error al obtener permisos');
        }
  
        // Obtener la visibilidad de la carga
        const visibility = data.access?.upload?.visibility;
        console.log("Visibilidad de la carga:", visibility);
  
        // Caso 1: Visibilidad Pública -> no se requiere autenticación
        if (visibility === 'public') {
          console.log("Caso 1: Visibilidad pública detectada. Permisos asignados sin autenticación.");
          setPermissionInfo(data);
          setRoll('Anyone can upload memories')
          return;
        }
  
        // Función para transformar correos (reemplaza "@" y "." por "_")
        const transformUserId = (userId) => userId.replace(/[@.]/g, '_');
        const path = window.location.pathname
  
        // Obtener correo del usuario autenticado desde localStorage
        const currentUserEmail = localStorage.getItem('userEmail');
        if (!currentUserEmail) {
          console.log("No se encontró el correo del usuario autenticado en localStorage.");
          localStorage.setItem('redirectPath', path);
          localStorage.setItem('reason', 'userEmailValidationOnly');
          router.push('/login');
          return;
        }
  
        const transformedCurrentEmail = transformUserId(currentUserEmail);
        console.log(transformedCurrentEmail);
        console.log(data.ownerEmail);
        
        
        console.log("Correo del usuario transformado:", transformedCurrentEmail);

        if(transformedCurrentEmail === data.ownerEmail){
          console.log('usuario dueño detectado');
          setPermissionInfo(data);
          setRoll('You are the owner')
          return;
        }
  
        // Caso 2: Modo Invitación -> se espera que visibility sea 'invitation'
        if (visibility === 'invitation') {
          const invitedEmails = data.access?.upload?.invitedEmails || [];
          // Transformar los correos de la lista para que coincidan en el formato
          const transformedInvitedEmails = invitedEmails.map(email => transformUserId(email));
          console.log("Correos invitados transformados:", transformedInvitedEmails);
  
          if (!transformedInvitedEmails.includes(transformedCurrentEmail)) {
            console.log("El usuario autenticado no se encuentra dentro de la lista de invitados.");
            localStorage.setItem('redirectPath', path);
            localStorage.setItem('reason', 'userEmailValidationOnly');
            setRoll('User not allowed')
            return;
          }
          console.log("El usuario está invitado para subir archivos. Permiso asignado.");
          setPermissionInfo(data);
          setRoll('Invited to upload memories')
          return;
        }

        // Caso 3: Validar que el usuario sea el propietario al no tratarse de invitación (por ejemplo, propiedad)
        const isOwner = transformedCurrentEmail === data.ownerEmail;
        if (!isOwner) {
          console.log("El usuario autenticado no es el propietario de la memoria.");
          localStorage.setItem('redirectPath', path);
          localStorage.setItem('reason', 'userEmailValidationOnly');
          setRoll('User not allowed')
          return;
        }
  
        // Si pasa todas las validaciones, se establecen los permisos
        console.log("Permisos establecidos exitosamente después de todas las validaciones.");
        setPermissionInfo(data);
      } catch (err) {
        console.error("Error al obtener permisos:", err.message);
        setUploadError(err.message);
      }
    };
  
    fetchPermission();
  }, [userID, memoryName, userEmail]);
  
  

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
    URL.revokeObjectURL(files[fileType][index].preview);
    setFiles(prev => ({
      ...prev,
      [fileType]: prev[fileType].filter((_, i) => i !== index)
    }));
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
        formData.append('userId', userID); // Añadir userID desde router.query
        formData.append('memoryTitle', memoryName); // Añadir memoryName desde router.query
        files[fileType].forEach(fileObj => formData.append('file', fileObj.file));

        console.log(formData);
        
        const response = await fetch('/api/blackBlaze/uploadFilesToBackBlaze', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) throw new Error('Error al subir archivos a Backblaze');

        const result = await response.json();
        memoryData[memoryName].media[fileType] = result.uploadedFiles;
      }
      console.log(memoryData);
      console.log(userEmail);
      console.log(permissionInfo.ownerEmail);
      
      
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

      const uploadData = await uploadResponse.json();
      console.log("Archivos subidos:", uploadData);
      
      setFiles({ photos: [], videos: [], audios: [] });
      setUploadDetails('¡Archivos subidos exitosamente!');
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

  const FileCounter = ({ type, count }) => (
    <div 
      className={`file-counter color2 ${count > 0 ? 'has-files' : ''}`}
      onClick={() => count > 0 && (setActiveFileType(type), setIsPreviewModalOpen(true))}
    >
      <span className="counter-badge color2">{count}</span>
      <span className="counter-label color2">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
    </div>
  );

  return (
    <div className="fullscreen-floating mainFont backgroundColor1 color2">
      <Menu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} className='backgroundColor1' />

      <div className="file-uploader">
        <div style={{ display: 'flex' }}>
          <div className="menu-icon-container">
            <MenuIcon onClick={() => setIsMenuOpen(true)} style={{ zIndex: 10 }} />
          </div>
          {roll === 'User not allowed' ? <h2 style={{color: 'red'}} className="title">{roll}</h2> : <h2 className="title">Subir archivos a: {permissionInfo?.metadata?.title || memoryName}</h2>}
        </div>

        <div className="uploader-content">
          <div className="files-column">
            <div className="file-section-container">
              <div className="section-header">
                {roll === 'User not allowed' ? <h3 style={{color: 'red'}}>If you believe this is a mistake, please contact the account owner.</h3> : <h3>Detalles del Recuerdo</h3>}
              </div>

              <div className="permission-details">
                {permissionInfo && (
                  <>
                    <div className="permission-item">
                      <span className="permission-label">Roll:</span>
                      <span className="permission-value">{roll}</span>
                    </div>
                  </>
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
                      <h3>Fotos</h3>
                      <div className="section-controls">
                        <FileCounter type="photos" count={files.photos.length} />
                        <button 
                          className='add'
                          type="button"
                          onClick={() => photoInputRef.current.click()}
                          disabled={isUploading}
                        >
                          Agregar
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

                  <div className="file-section-container">
                    <div className="section-header">
                      <h3>Videos</h3>
                      <div className="section-controls">
                        <FileCounter type="videos" count={files.videos.length} />
                        <button
                          className='add' 
                          type="button"
                          onClick={() => videoInputRef.current.click()}
                          disabled={isUploading}
                        >
                          Agregar
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

                  <div className="file-section-container">
                    <div className="section-header">
                      <h3>Audios</h3>
                      <div className="section-controls">
                        <FileCounter type="audios" count={files.audios.length} />
                        <button 
                          className='add'
                          type="button"
                          onClick={() => audioInputRef.current.click()}
                          disabled={isUploading}
                        >
                          Agregar
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
                  {isUploading ? 'Subiendo...' : 'Subir Archivos'}
                </button>
              </form>

              {isPreviewModalOpen && (
                <div className="preview-modal">
                  <div className="modal-header">
                    <h3>{activeFileType?.toUpperCase()}</h3>
                    <button onClick={() => setIsPreviewModalOpen(false)}>×</button>
                  </div>
                  <div className="preview-grid">
                    {files[activeFileType]?.map((file, index) => (
                      <div key={index} className="preview-item">
                        {file.type === 'photos' && <img src={file.preview} alt="Preview" />}
                        {file.type === 'videos' && <video controls src={file.preview} />}
                        {file.type === 'audios' && <audio controls src={file.preview} />}
                        <button onClick={() => removeFile(activeFileType, index)}>×</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="modal-content">
          <h3>{uploadDetails}</h3>
          <button onClick={() => setIsModalOpen(false)}>Cerrar</button>
        </div>
      </Modal>
    </div>
  );
};

export default FilePermissionViewer;
