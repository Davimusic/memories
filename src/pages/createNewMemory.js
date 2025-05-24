import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Menu from '@/components/complex/menu';
import MenuIcon from '@/components/complex/menuIcon';
import '../estilos/general/createNewMemory.css';
import '../estilos/general/general.css';
import '../app/globals.css';
import Modal from '@/components/complex/modal';
import MemoryLogo from '@/components/complex/memoryLogo';
import { auth } from '../../firebase';

// Componente para el modal de visibilidad (extraído como componente independiente)
const VisibilityModal = ({
  isOpen,
  onClose,
  initialVisibility,
  initialInvitedEmails,
  onSave
}) => {
  // Estados temporales para el modal (no afectan al padre hasta guardar)
  const [tempVisibility, setTempVisibility] = useState(initialVisibility);
  const [tempInvitedEmails, setTempInvitedEmails] = useState(initialInvitedEmails);
  const [tempEmailInput, setTempEmailInput] = useState('');
  const [modalError, setModalError] = useState('');

  // Función para validar emails
  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Añadir email a la lista temporal
  const handleTempAddEmail = (e) => {
    e.stopPropagation();
    if (!validateEmail(tempEmailInput)) {
      setModalError('Please enter a valid email address');
      return;
    }
    if (tempInvitedEmails.includes(tempEmailInput.trim())) {
      setModalError('This email is already added');
      return;
    }
    setTempInvitedEmails([...tempInvitedEmails, tempEmailInput.trim()]);
    setTempEmailInput('');
    setModalError('');
  };

  // Guardar configuración y notificar al componente padre
  const handleSave = (e) => {
    e.stopPropagation();
    if (tempVisibility === 'invitation' && tempInvitedEmails.length === 0) {
      setModalError('Please add at least one email for invitations');
      return;
    }
    onSave(tempVisibility, tempInvitedEmails);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Configure Memory Visibility</h3>
        
        {/* Opciones de privacidad */}
        <div className="privacy-options">
          {/* Opción por Invitación */}
          <div 
            className={`privacy-option ${tempVisibility === 'invitation' ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setTempVisibility('invitation');
            }}
          >
            <div className="privacy-icon">📩</div>
            <div className="privacy-details">
              <h4>By Invitation</h4>
              <p>Only specific users can view</p>
              
              {/* Sección para añadir emails (solo visible en modo invitación) */}
              {tempVisibility === 'invitation' && (
                <div className="email-section">
                  <div className="file-input-group">
                    <input
                      type="email"
                      value={tempEmailInput}
                      onChange={(e) => setTempEmailInput(e.target.value)}
                      placeholder="Enter email addresses"
                      className="text-input"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button 
                      type="button" 
                      className="submitButton" 
                      onClick={handleTempAddEmail}
                    >
                      Add
                    </button>
                  </div>
                  {/* Lista de emails añadidos */}
                  <div className="email-tags">
                    {tempInvitedEmails.map((email, index) => (
                      <div key={index} className="email-tag">
                        {email}
                        <button
                          className="remove-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTempInvitedEmails(
                              tempInvitedEmails.filter((_, i) => i !== index)
                            );
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Opción Privado */}
          <div 
            className={`privacy-option ${tempVisibility === 'private' ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setTempVisibility('private');
            }}
          >
            <div className="privacy-icon">🔒</div>
            <div className="privacy-details">
              <h4>Private</h4>
              <p>Only visible to you</p>
            </div>
          </div>
          
          {/* Opción Público */}
          <div 
            className={`privacy-option ${tempVisibility === 'public' ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setTempVisibility('public');
            }}
          >
            <div className="privacy-icon">🌍</div>
            <div className="privacy-details">
              <h4>Public</h4>
              <p>Visible to everyone</p>
            </div>
          </div>
        </div>

        {/* Mensaje de error */}
        {modalError && <div className="error-message">{modalError}</div>}

        {/* Acciones del modal */}
        <div style={{display: 'flex', gap: '10px', boxSizing: 'border-box'}}>
          <button 
            className="submitButton" 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            Cancel
          </button>
          <button className="submitButton" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </Modal>
  );
};

// Componente para el modal de permisos de subida (extraído como componente independiente)
const UploadPermissionsModal = ({
  isOpen,
  onClose,
  initialUploadVisibility,
  initialUploadInvitedEmails,
  onSave
}) => {
  // Estados temporales para el modal
  const [tempUploadVisibility, setTempUploadVisibility] = useState(initialUploadVisibility);
  const [tempUploadInvitedEmails, setTempUploadInvitedEmails] = useState(initialUploadInvitedEmails);
  const [tempUploadEmailInput, setTempUploadEmailInput] = useState('');
  const [modalError, setModalError] = useState('');

  // Función para validar emails
  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Añadir email a la lista temporal
  const handleTempUploadAddEmail = (e) => {
    e.stopPropagation();
    if (!validateEmail(tempUploadEmailInput)) {
      setModalError('Please enter a valid email address');
      return;
    }
    if (tempUploadInvitedEmails.includes(tempUploadEmailInput.trim())) {
      setModalError('This email is already added');
      return;
    }
    setTempUploadInvitedEmails([...tempUploadInvitedEmails, tempUploadEmailInput.trim()]);
    setTempUploadEmailInput('');
    setModalError('');
  };

  // Guardar configuración y notificar al componente padre
  const handleSave = (e) => {
    e.stopPropagation();
    if (tempUploadVisibility === 'invitation' && tempUploadInvitedEmails.length === 0) {
      setModalError('Please add at least one email for upload permissions');
      return;
    }
    onSave(tempUploadVisibility, tempUploadInvitedEmails);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Configure Upload Permissions</h3>
        
        {/* Opciones de privacidad */}
        <div className="privacy-options">
          {/* Opción por Invitación */}
          <div 
            className={`privacy-option ${tempUploadVisibility === 'invitation' ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setTempUploadVisibility('invitation');
            }}
          >
            <div className="privacy-icon">📩</div>
            <div className="privacy-details">
              <h4>By Invitation</h4>
              <p>Only invited users can upload</p>
              
              {/* Sección para añadir emails (solo visible en modo invitación) */}
              {tempUploadVisibility === 'invitation' && (
                <div className="email-section">
                  <div className="file-input-group">
                    <input
                      type="email"
                      value={tempUploadEmailInput}
                      onChange={(e) => setTempUploadEmailInput(e.target.value)}
                      placeholder="Enter email addresses"
                      className="text-input"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button 
                      type="button" 
                      className="submitButton" 
                      onClick={handleTempUploadAddEmail}
                    >
                      Add
                    </button>
                  </div>
                  {/* Lista de emails añadidos */}
                  <div className="email-tags">
                    {tempUploadInvitedEmails.map((email, index) => (
                      <div key={index} className="email-tag">
                        {email}
                        <button
                          className="remove-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTempUploadInvitedEmails(
                              tempUploadInvitedEmails.filter((_, i) => i !== index)
                            );
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Opción Privado */}
          <div 
            className={`privacy-option ${tempUploadVisibility === 'private' ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setTempUploadVisibility('private');
            }}
          >
            <div className="privacy-icon">🔒</div>
            <div className="privacy-details">
              <h4>Private</h4>
              <p>Only you can upload files</p>
            </div>
          </div>
          
          {/* Opción Público */}
          <div 
            className={`privacy-option ${tempUploadVisibility === 'public' ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setTempUploadVisibility('public');
            }}
          >
            <div className="privacy-icon">🌍</div>
            <div className="privacy-details">
              <h4>Public</h4>
              <p>Everyone can upload files</p>
            </div>
          </div>
        </div>

        {/* Mensaje de error */}
        {modalError && <div className="error-message">{modalError}</div>}

        {/* Acciones del modal */}
        <div style={{display: 'flex', gap: '10px', boxSizing: 'border-box'}}>
          <button 
            className="submitButton" 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            Cancel
          </button>
          <button className="submitButton" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </Modal>
  );
};

// Componente para el modal de permisos de edición (nuevo componente)
const EditPermissionsModal = ({
  isOpen,
  onClose,
  initialEditVisibility,
  initialEditInvitedEmails,
  onSave
}) => {
  // Estados temporales para el modal
  const [tempEditVisibility, setTempEditVisibility] = useState(initialEditVisibility);
  const [tempEditInvitedEmails, setTempEditInvitedEmails] = useState(initialEditInvitedEmails);
  const [tempEditEmailInput, setTempEditEmailInput] = useState('');
  const [modalError, setModalError] = useState('');

  // Función para validar emails
  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Añadir email a la lista temporal
  const handleTempEditAddEmail = (e) => {
    e.stopPropagation();
    if (!validateEmail(tempEditEmailInput)) {
      setModalError('Please enter a valid email address');
      return;
    }
    if (tempEditInvitedEmails.includes(tempEditEmailInput.trim())) {
      setModalError('This email is already added');
      return;
    }
    setTempEditInvitedEmails([...tempEditInvitedEmails, tempEditEmailInput.trim()]);
    setTempEditEmailInput('');
    setModalError('');
  };

  // Guardar configuración y notificar al componente padre
  const handleSave = (e) => {
    e.stopPropagation();
    if (tempEditVisibility === 'invitation' && tempEditInvitedEmails.length === 0) {
      setModalError('Please add at least one email for edit permissions');
      return;
    }
    onSave(tempEditVisibility, tempEditInvitedEmails);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Configure Edit Permissions</h3>
        
        {/* Opciones de privacidad */}
        <div className="privacy-options">
          {/* Opción por Invitación */}
          <div 
            className={`privacy-option ${tempEditVisibility === 'invitation' ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setTempEditVisibility('invitation');
            }}
          >
            <div className="privacy-icon">📩</div>
            <div className="privacy-details">
              <h4>By Invitation</h4>
              <p>Only invited users can edit</p>
              
              {/* Sección para añadir emails (solo visible en modo invitación) */}
              {tempEditVisibility === 'invitation' && (
                <div className="email-section">
                  <div className="file-input-group">
                    <input
                      type="email"
                      value={tempEditEmailInput}
                      onChange={(e) => setTempEditEmailInput(e.target.value)}
                      placeholder="Enter email addresses"
                      className="text-input"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button 
                      type="button" 
                      className="submitButton" 
                      onClick={handleTempEditAddEmail}
                    >
                      Add
                    </button>
                  </div>
                  {/* Lista de emails añadidos */}
                  <div className="email-tags">
                    {tempEditInvitedEmails.map((email, index) => (
                      <div key={index} className="email-tag">
                        {email}
                        <button
                          className="remove-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTempEditInvitedEmails(
                              tempEditInvitedEmails.filter((_, i) => i !== index)
                            );
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Opción Privado */}
          <div 
            className={`privacy-option ${tempEditVisibility === 'private' ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setTempEditVisibility('private');
            }}
          >
            <div className="privacy-icon">🔒</div>
            <div className="privacy-details">
              <h4>Private</h4>
              <p>Only you can edit</p>
            </div>
          </div>
          
          {/* Opción Público */}
          <div 
            className={`privacy-option ${tempEditVisibility === 'public' ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setTempEditVisibility('public');
            }}
          >
            <div className="privacy-icon">🌍</div>
            <div className="privacy-details">
              <h4>Public</h4>
              <p>Everyone can edit</p>
            </div>
          </div>
        </div>

        {/* Mensaje de error */}
        {modalError && <div className="error-message">{modalError}</div>}

        {/* Acciones del modal */}
        <div style={{display: 'flex', gap: '10px', boxSizing: 'border-box'}}>
          <button 
            className="submitButton" 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            Cancel
          </button>
          <button className="submitButton" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </Modal>
  );
};

// Componente principal CreateNewMemory
const CreateNewMemory = () => {
  const router = useRouter();

  // Estados principales del formulario
  const [memoryTitle, setMemoryTitle] = useState('');
  const [description, setDescription] = useState('');
  const [userEmail, setUserEmail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAlreadyUser, setIsAlreadyUser] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  
  // Estados para visibilidad del recuerdo
  const [visibility, setVisibility] = useState('private');
  const [invitedEmails, setInvitedEmails] = useState([]);

  // Estados para permisos de subida de archivos
  const [uploadVisibility, setUploadVisibility] = useState('private');
  const [uploadInvitedEmails, setUploadInvitedEmails] = useState([]);

  // Estados para permisos de edición (nuevos estados)
  const [editVisibility, setEditVisibility] = useState('private');
  const [editInvitedEmails, setEditInvitedEmails] = useState([]);

  // Estados para controlar la apertura de modales
  const [isVisibilityModalOpen, setIsVisibilityModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);



  // Primer useEffect: Escuchar cambios en el estado de autenticación
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
          //setLoading(false); // Detener la carga si no hay usuario
        }
      });
  
      // Cleanup: Desuscribirse del listener cuando el componente se desmonta
      return () => unsubscribe();
    }, []);

  //verifica permisos
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (userEmail === null) return;


    //const email = localStorage.getItem('userEmail');
    
    if (userEmail) {
      // Transformar el email para usarlo como ID (reemplazar @ y . por _)
      const transformUserId = (userId) => userId.replace(/[@.]/g, '_');
      setUserEmail(transformUserId(userEmail));
      console.log(transformUserId(userEmail));
      
    } else {
      console.log('no hay correo en createNewMemory')
      const path = window.location.pathname
      localStorage.setItem('redirectPath', path);
      localStorage.setItem('reason', 'userEmailValidationOnly');
      router.push('/login');
      return
    }
  
    const fetchPermission = async () => {
      try {
        console.log("Iniciando consulta para correo:", userEmail);
        const response = await fetch('/api/mongoDb/queries/verifyUserExistence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userEmail
          }),
        });
  
        const data = await response.json();
        if(data.success){
          if(data.exists){
            console.log('usuario existente en la plataforma ' + userEmail);
            setIsAlreadyUser(true)
            return
          } else {
            console.log('usuario  NO existente en la plataforma ');
            setAlertMessage(`The user ${localStorage.getItem('userEmail')} is not registered on the platform. To register, please use the next link.`)
          }
        }
        
      } catch (err) {
        console.error("Error al obtener permisos:", err.message);
        setUploadError(err.message);
      }
    };
  
    fetchPermission();
  }, [userEmail]);

  // Handlers para abrir/cerrar el menú
  const handleOpenMenu = () => setIsMenuOpen(true);
  const handleCloseMenu = () => setIsMenuOpen(false);

  // Handler para guardar la configuración de visibilidad
  const handleSaveVisibility = (newVisibility, newInvitedEmails) => {
    setVisibility(newVisibility);
    setInvitedEmails(newInvitedEmails);
  };

  // Handler para guardar la configuración de permisos de subida
  const handleSaveUpload = (newUploadVisibility, newUploadInvitedEmails) => {
    setUploadVisibility(newUploadVisibility);
    setUploadInvitedEmails(newUploadInvitedEmails);
  };

  // Handler para guardar la configuración de permisos de edición (nuevo handler)
  const handleSaveEdit = (newEditVisibility, newEditInvitedEmails) => {
    setEditVisibility(newEditVisibility);
    setEditInvitedEmails(newEditInvitedEmails);
  };

  // Handler para enviar el formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validaciones del formulario
    if (!memoryTitle) {
      setError('Please provide a title');
      setIsLoading(false);
      return;
    }

    if (visibility === 'invitation' && invitedEmails.length === 0) {
      setError('Please add at least one email for memory access');
      setIsLoading(false);
      return;
    }

    if (uploadVisibility === 'invitation' && uploadInvitedEmails.length === 0) {
      setError('Please add at least one email for upload permissions');
      setIsLoading(false);
      return;
    }

    if (editVisibility === 'invitation' && editInvitedEmails.length === 0) {
      setError('Please add at least one email for edit permissions');
      setIsLoading(false);
      return;
    }

    if (!userEmail) {
      setError('User not authenticated');
      setIsLoading(false);
      alert('falta')
      return;
    }

    try {
      // Enviar datos al servidor
      const response = await fetch('/api/mongoDb/createNewMemoryUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userEmail,
          memoryTitle,
          description,
          visibility,
          invitedEmails,
          fileUploadVisibility: uploadVisibility,
          fileUploadInvitedEmails: uploadInvitedEmails,
          editVisibility,
          editInvitedEmails
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create memory');
      }

      // Resetear el formulario después de crear el recuerdo
      setMemoryTitle('');
      setDescription('');
      setVisibility('private');
      setInvitedEmails([]);
      setUploadVisibility('private');
      setUploadInvitedEmails([]);
      setEditVisibility('private');
      setEditInvitedEmails([]);
      
      // Mostrar mensaje de éxito
      console.log('Memory created successfully!');
      router.push('/memories');

    } catch (error) {
      console.error('Error creating memory:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedirect = () => {
    localStorage.setItem('redirectPath', '/payment');
    localStorage.setItem('reason', 'createNewUser');
    router.push('/login');
  };

  return (
    <div className="fullscreen-floating mainFont backgroundColor1 mainFont color2">
      {/* Componente del menú lateral */}

      {isAlreadyUser ? (
        <>
          <Menu
            isOpen={isMenuOpen}
            onClose={handleCloseMenu}
            className="backgroundColor1"
          />

          <div className="file-uploader">
            {/* Encabezado con icono de menú y título */}
            <div style={{ display: 'flex' }}>
              <div className="menu-icon-container">
                <MenuIcon onClick={handleOpenMenu} style={{ zIndex: 10 }} />
              </div>
              <h2 className="title">Create New Memory</h2>
            </div>

            {/* Contenido principal del formulario */}
            <div className="uploader-content">
              {/* Columna del formulario */}
              <div className="form-column">
                <form className="memory-form" onSubmit={handleSubmit}>
                  {/* Campo para el título del recuerdo */}
                  <div className="form-group">
                    <h3>Memory Title *</h3>
                    <input
                      type="text"
                      className="text-input"
                      value={memoryTitle}
                      onChange={(e) => setMemoryTitle(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  {/* Campo para la descripción */}
                  <div className="form-group">
                    <h3>Description (Optional)</h3>
                    <textarea
                      className="text-input"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows="5"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Mensaje de error */}
                  {error && <div className="error-message">{error}</div>}

                  {/* Botón para enviar el formulario */}
                  <div className="actions">
                    <button 
                      type="submit" 
                      className="submit-btn" 
                      disabled={isLoading}
                    >
                      {isLoading ? 'Creating...' : 'Create Memory'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Columna de configuración */}
              <div className="files-column">
                {/* Sección de visibilidad del recuerdo */}
                <div className="file-section-container">
                  <div className="section-header">
                    <h4>Memory Visibility</h4>
                  </div>
                  
                  {/* Configuración actual de visibilidad */}
                  <div className="selected-settings" onClick={() => setIsVisibilityModalOpen(true)}>
                    {visibility === 'private' && (
                      <div className="privacy-option active">
                        <div className="privacy-icon">🔒</div>
                        <div className="privacy-details">
                          <h4>Private</h4>
                          <p>Only visible to you</p>
                        </div>
                      </div>
                    )}
                    
                    {visibility === 'public' && (
                      <div className="privacy-option active">
                        <div className="privacy-icon">🌍</div>
                        <div className="privacy-details">
                          <h4>Public</h4>
                          <p>Visible to everyone</p>
                        </div>
                      </div>
                    )}
                    
                    {visibility === 'invitation' && (
                      <div className="privacy-option active">
                        <div className="privacy-icon">📩</div>
                        <div className="privacy-details">
                          <h4>By Invitation</h4>
                          <p>{invitedEmails.length} invited users</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sección de permisos de subida */}
                <div className="file-section-container">
                  <div className="section-header">
                    <h4>Upload Permissions</h4>
                  </div>
                  
                  {/* Configuración actual de permisos de subida */}
                  <div className="selected-settings" onClick={() => setIsUploadModalOpen(true)}>
                    {uploadVisibility === 'private' && (
                      <div className="privacy-option active">
                        <div className="privacy-icon">🔒</div>
                        <div className="privacy-details">
                          <h4>Private</h4>
                          <p>Only you can upload</p>
                        </div>
                      </div>
                    )}
                    
                    {uploadVisibility === 'public' && (
                      <div className="privacy-option active">
                        <div className="privacy-icon">🌍</div>
                        <div className="privacy-details">
                          <h4>Public</h4>
                          <p>Everyone can upload</p>
                        </div>
                      </div>
                    )}
                    
                    {uploadVisibility === 'invitation' && (
                      <div className="privacy-option active">
                        <div className="privacy-icon">📩</div>
                        <div className="privacy-details">
                          <h4>By Invitation</h4>
                          <p>{uploadInvitedEmails.length} users can upload</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sección de permisos de edición (nueva sección) */}
                <div className="file-section-container">
                  <div className="section-header">
                    <h4>Edit Permissions</h4>
                  </div>
                  
                  {/* Configuración actual de permisos de edición */}
                  <div className="selected-settings" onClick={() => setIsEditModalOpen(true)}>
                    {editVisibility === 'private' && (
                      <div className="privacy-option active">
                        <div className="privacy-icon">🔒</div>
                        <div className="privacy-details">
                          <h4>Private</h4>
                          <p>Only you can edit</p>
                        </div>
                      </div>
                    )}
                    
                    {editVisibility === 'public' && (
                      <div className="privacy-option active">
                        <div className="privacy-icon">🌍</div>
                        <div className="privacy-details">
                          <h4>Public</h4>
                          <p>Everyone can edit</p>
                        </div>
                      </div>
                    )}
                    
                    {editVisibility === 'invitation' && (
                      <div className="privacy-option active">
                        <div className="privacy-icon">📩</div>
                        <div className="privacy-details">
                          <h4>By Invitation</h4>
                          <p>{editInvitedEmails.length} users can edit</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modales */}
          <VisibilityModal
            isOpen={isVisibilityModalOpen}
            onClose={() => setIsVisibilityModalOpen(false)}
            initialVisibility={visibility}
            initialInvitedEmails={invitedEmails}
            onSave={handleSaveVisibility}
          />

          <UploadPermissionsModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            initialUploadVisibility={uploadVisibility}
            initialUploadInvitedEmails={uploadInvitedEmails}
            onSave={handleSaveUpload}
          />

          <EditPermissionsModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            initialEditVisibility={editVisibility}
            initialEditInvitedEmails={editInvitedEmails}
            onSave={handleSaveEdit}
          />
        </>
      ) : (
        <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
        }}
      >
        <div className=" loading">
          <p className='color1'>{alertMessage}</p>
          <MemoryLogo size={200} />
          <button className='submitButton' onClick={handleRedirect}>
            create a new user account
          </button>
        </div>
      </div>
      )}
    </div>
  );
};

export default CreateNewMemory;
