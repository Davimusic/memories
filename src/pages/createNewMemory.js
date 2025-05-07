import { useState, useEffect } from 'react';
import Menu from '@/components/complex/menu';
import MenuIcon from '@/components/complex/menuIcon';
import '../estilos/general/createNewMemory.css';
import '../estilos/general/general.css';
import '../app/globals.css';
import Modal from '@/components/complex/modal';

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

// Componente principal CreateNewMemory
const CreateNewMemory = () => {
  // Estados principales del formulario
  const [memoryTitle, setMemoryTitle] = useState('');
  const [description, setDescription] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Estados para visibilidad del recuerdo
  const [visibility, setVisibility] = useState('private');
  const [invitedEmails, setInvitedEmails] = useState([]);

  // Estados para permisos de subida de archivos
  const [uploadVisibility, setUploadVisibility] = useState('private');
  const [uploadInvitedEmails, setUploadInvitedEmails] = useState([]);

  // Estados para controlar la apertura de modales
  const [isVisibilityModalOpen, setIsVisibilityModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Obtener el email del usuario al cargar el componente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const email = localStorage.getItem('userEmail');
      if (email) {
        // Transformar el email para usarlo como ID (reemplazar @ y . por _)
        const transformUserId = (userId) => userId.replace(/[@.]/g, '_');
        setUserEmail(transformUserId(email));
      }
    }
  }, []);

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

    if (!userEmail) {
      setError('User not authenticated');
      setIsLoading(false);
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
      
      // Mostrar mensaje de éxito
      alert('Memory created successfully!');

    } catch (error) {
      console.error('Error creating memory:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fullscreen-floating mainFont backgroundColor1 mainFont color2">
      {/* Componente del menú lateral */}
      <Menu isOpen={isMenuOpen} onClose={handleCloseMenu} className="backgroundColor1" />

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
          </div>
        </div>
      </div>

      {/* Modales (solo se renderizan cuando están abiertos) */}
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
    </div>
  );
};

export default CreateNewMemory;
