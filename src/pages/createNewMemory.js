'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Menu from '@/components/complex/menu';
import MenuIcon from '@/components/complex/menuIcon';
import '../estilos/general/createNewMemory.css';
import '../app/globals.css';
import Modal from '@/components/complex/modal';
import MemoryLogo from '@/components/complex/memoryLogo';
import GeneralMold from '@/components/complex/generalMold';
import { auth } from '../../firebase';
import LoadingMemories from '@/components/complex/loading';
import Head from 'next/head';

// Visibility Modal Component
const VisibilityModal = ({
  isOpen,
  onClose,
  initialVisibility,
  initialInvitedEmails,
  onSave,
}) => {
  const [tempVisibility, setTempVisibility] = useState(initialVisibility);
  const [tempInvitedEmails, setTempInvitedEmails] = useState(initialInvitedEmails);
  const [tempEmailInput, setTempEmailInput] = useState('');
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    console.log(isOpen);
  }, [isOpen]);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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
        <h3 className="title-md">Configure Memory Visibility</h3>
        <div className="privacy-options">
          <div
            className={`card ${tempVisibility === 'invitation' ? 'active' : ''}`}
            onClick={() => setTempVisibility('invitation')}
          >
            <span className="privacy-icon">📩</span>
            <h4>By Invitation</h4>
            <p>Only specific users can view</p>
            {tempVisibility === 'invitation' && (
              <div className="email-section">
                <div className="flex-column">
                  <input
                    type="email"
                    value={tempEmailInput}
                    onChange={(e) => setTempEmailInput(e.target.value)}
                    placeholder="Enter email addresses"
                    className="text-input rounded p-2"
                  />
                  <button className="button2 m-1" onClick={handleTempAddEmail}>
                    Add
                  </button>
                </div>
                <div className="email-tags flex-column">
                  {tempInvitedEmails.map((email, index) => (
                    <div key={index} className="email-tag card p-1">
                      {email}
                      <button
                        className="close-button"
                        onClick={() =>
                          setTempInvitedEmails(tempInvitedEmails.filter((_, i) => i !== index))
                        }
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div
            className={`card ${tempVisibility === 'private' ? 'active' : ''}`}
            onClick={() => setTempVisibility('private')}
          >
            <span className="privacy-icon">🔒</span>
            <h4>Private</h4>
            <p>Only visible to you</p>
          </div>
          <div
            className={`card ${tempVisibility === 'public' ? 'active' : ''}`}
            onClick={() => setTempVisibility('public')}
          >
            <span className="privacy-icon">🌍</span>
            <h4>Public</h4>
            <p>Visible to everyone</p>
          </div>
        </div>
        {modalError && <div className="error-message color-error">{modalError}</div>}
        <div className="demo-actions">
          <button className="demo-button secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="demo-button" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </Modal>
  );
};

// Upload Permissions Modal Component
const UploadPermissionsModal = ({
  isOpen,
  onClose,
  initialUploadVisibility,
  initialUploadInvitedEmails,
  onSave,
}) => {
  const [tempUploadVisibility, setTempUploadVisibility] = useState(initialUploadVisibility);
  const [tempUploadInvitedEmails, setTempUploadInvitedEmails] = useState(initialUploadInvitedEmails);
  const [tempUploadEmailInput, setTempUploadEmailInput] = useState('');
  const [modalError, setModalError] = useState('');

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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
        <h3 className="title-md">Configure Upload Permissions</h3>
        <div className="privacy-options">
          <div
            className={`card ${tempUploadVisibility === 'invitation' ? 'active' : ''}`}
            onClick={() => setTempUploadVisibility('invitation')}
          >
            <span className="privacy-icon">📩</span>
            <h4>By Invitation</h4>
            <p>Only invited users can upload</p>
            {tempUploadVisibility === 'invitation' && (
              <div className="email-section">
                <div className="flex-column">
                  <input
                    type="email"
                    value={tempUploadEmailInput}
                    onChange={(e) => setTempUploadEmailInput(e.target.value)}
                    placeholder="Enter email addresses"
                    className="text-input rounded p-2"
                  />
                  <button className="button2 m-1" onClick={handleTempUploadAddEmail}>
                    Add
                  </button>
                </div>
                <div className="email-tags flex-column">
                  {tempUploadInvitedEmails.map((email, index) => (
                    <div key={index} className="email-tag card p-1">
                      {email}
                      <button
                        className="close-button"
                        onClick={() =>
                          setTempUploadInvitedEmails(tempUploadInvitedEmails.filter((_, i) => i !== index))
                        }
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div
            className={`card ${tempUploadVisibility === 'private' ? 'active' : ''}`}
            onClick={() => setTempUploadVisibility('private')}
          >
            <span className="privacy-icon">🔒</span>
            <h4>Private</h4>
            <p>Only you can upload files</p>
          </div>
          <div
            className={`card ${tempUploadVisibility === 'public' ? 'active' : ''}`}
            onClick={() => setTempUploadVisibility('public')}
          >
            <span className="privacy-icon">🌍</span>
            <h4>Public</h4>
            <p>Everyone can upload files</p>
          </div>
        </div>
        {modalError && <div className="error-message color-error">{modalError}</div>}
        <div className="demo-actions">
          <button className="demo-button secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="demo-button" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </Modal>
  );
};

// Edit Permissions Modal Component
const EditPermissionsModal = ({
  isOpen,
  onClose,
  initialEditVisibility,
  initialEditInvitedEmails,
  onSave,
}) => {
  const [tempEditVisibility, setTempEditVisibility] = useState(initialEditVisibility);
  const [tempEditInvitedEmails, setTempEditInvitedEmails] = useState(initialEditInvitedEmails);
  const [tempEditEmailInput, setTempEditEmailInput] = useState('');
  const [modalError, setModalError] = useState('');

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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
        <h3 className="title-md">Configure Edit Permissions</h3>
        <div className="privacy-options">
          <div
            className={`card ${tempEditVisibility === 'invitation' ? 'active' : ''}`}
            onClick={() => setTempEditVisibility('invitation')}
          >
            <span className="privacy-icon">📩</span>
            <h4>By Invitation</h4>
            <p>Only invited users can edit</p>
            {tempEditVisibility === 'invitation' && (
              <div className="email-section">
                <div className="flex-column">
                  <input
                    type="email"
                    value={tempEditEmailInput}
                    onChange={(e) => setTempEditEmailInput(e.target.value)}
                    placeholder="Enter email addresses"
                    className="text-input rounded p-2"
                  />
                  <button className="button2 m-1" onClick={handleTempEditAddEmail}>
                    Add
                  </button>
                </div>
                <div className="email-tags flex-column">
                  {tempEditInvitedEmails.map((email, index) => (
                    <div key={index} className="email-tag card p-1">
                      {email}
                      <button
                        className="close-button"
                        onClick={() =>
                          setTempEditInvitedEmails(tempEditInvitedEmails.filter((_, i) => i !== index))
                        }
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div
            className={`card ${tempEditVisibility === 'private' ? 'active' : ''}`}
            onClick={() => setTempEditVisibility('private')}
          >
            <span className="privacy-icon">🔒</span>
            <h4>Private</h4>
            <p>Only you can edit</p>
          </div>
          <div
            className={`card ${tempEditVisibility === 'public' ? 'active' : ''}`}
            onClick={() => setTempEditVisibility('public')}
          >
            <span className="privacy-icon">🌍</span>
            <h4>Public</h4>
            <p>Everyone can edit</p>
          </div>
        </div>
        {modalError && <div className="error-message color-error">{modalError}</div>}
        <div className="demo-actions">
          <button className="demo-button secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="demo-button" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </Modal>
  );
};

// Create Memory Topics Modal Component
const CreateMemoryTopicsModal = ({
  isOpen,
  onClose,
  initialCreateTopicsVisibility,
  initialCreateTopicsInvitedEmails,
  onSave,
}) => {
  const [tempCreateTopicsVisibility, setTempCreateTopicsVisibility] = useState(initialCreateTopicsVisibility);
  const [tempCreateTopicsInvitedEmails, setTempCreateTopicsInvitedEmails] = useState(initialCreateTopicsInvitedEmails);
  const [tempCreateTopicsEmailInput, setTempCreateTopicsEmailInput] = useState('');
  const [modalError, setModalError] = useState('');

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleTempCreateTopicsAddEmail = (e) => {
    e.stopPropagation();
    if (!validateEmail(tempCreateTopicsEmailInput)) {
      setModalError('Please enter a valid email address');
      return;
    }
    if (tempCreateTopicsInvitedEmails.includes(tempCreateTopicsEmailInput.trim())) {
      setModalError('This email is already added');
      return;
    }
    setTempCreateTopicsInvitedEmails([...tempCreateTopicsInvitedEmails, tempCreateTopicsEmailInput.trim()]);
    setTempCreateTopicsEmailInput('');
    setModalError('');
  };

  const handleSave = (e) => {
    e.stopPropagation();
    if (tempCreateTopicsVisibility === 'invitation' && tempCreateTopicsInvitedEmails.length === 0) {
      setModalError('Please add at least one email for create topics permissions');
      return;
    }
    onSave(tempCreateTopicsVisibility, tempCreateTopicsInvitedEmails);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="title-md">Configure Create Topics Permissions</h3>
        <div className="privacy-options">
          <div
            className={`card ${tempCreateTopicsVisibility === 'invitation' ? 'active' : ''}`}
            onClick={() => setTempCreateTopicsVisibility('invitation')}
          >
            <span className="privacy-icon">📩</span>
            <h4>By Invitation</h4>
            <p>Only invited users can create topics</p>
            {tempCreateTopicsVisibility === 'invitation' && (
              <div className="email-section">
                <div className="flex-column">
                  <input
                    type="email"
                    value={tempCreateTopicsEmailInput}
                    onChange={(e) => setTempCreateTopicsEmailInput(e.target.value)}
                    placeholder="Enter email addresses"
                    className="text-input rounded p-2"
                  />
                  <button className="button2 m-1" onClick={handleTempCreateTopicsAddEmail}>
                    Add
                  </button>
                </div>
                <div className="email-tags flex-column">
                  {tempCreateTopicsInvitedEmails.map((email, index) => (
                    <div key={index} className="email-tag card p-1">
                      {email}
                      <button
                        className="close-button"
                        onClick={() =>
                          setTempCreateTopicsInvitedEmails(tempCreateTopicsInvitedEmails.filter((_, i) => i !== index))
                        }
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div
            className={`card ${tempCreateTopicsVisibility === 'private' ? 'active' : ''}`}
            onClick={() => setTempCreateTopicsVisibility('private')}
          >
            <span className="privacy-icon">🔒</span>
            <h4>Private</h4>
            <p>Only you can create topics</p>
          </div>
          <div
            className={`card ${tempCreateTopicsVisibility === 'public' ? 'active' : ''}`}
            onClick={() => setTempCreateTopicsVisibility('public')}
          >
            <span className="privacy-icon">🌍</span>
            <h4>Public</h4>
            <p>Everyone can create topics</p>
          </div>
        </div>
        {modalError && <div className="error-message color-error">{modalError}</div>}
        <div className="demo-actions">
          <button className="demo-button secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="demo-button" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </Modal>
  );
};

// Main CreateNewMemory Component
const CreateNewMemory = () => {
  const router = useRouter();
  const [memoryTitle, setMemoryTitle] = useState('');
  const [description, setDescription] = useState('');
  const [userEmail, setUserEmail] = useState(null);
  const [uid, setUid] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAlreadyUser, setIsAlreadyUser] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [initialData, setInitialData] = useState();

  // Estados para permisos
  const [visibility, setVisibility] = useState('private');
  const [invitedEmails, setInvitedEmails] = useState([]);
  const [uploadVisibility, setUploadVisibility] = useState('private');
  const [uploadInvitedEmails, setUploadInvitedEmails] = useState([]);
  const [editVisibility, setEditVisibility] = useState('private');
  const [editInvitedEmails, setEditInvitedEmails] = useState([]);
  const [createTopicsVisibility, setCreateTopicsVisibility] = useState('private');
  const [createTopicsInvitedEmails, setCreateTopicsInvitedEmails] = useState([]);

  // Estados para modales
  const [isVisibilityModalOpen, setIsVisibilityModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateTopicsModalOpen, setIsCreateTopicsModalOpen] = useState(false);

  // Autenticación de usuario
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
        setIsAlreadyUser(true);
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

  useEffect(() => {
    console.log(isVisibilityModalOpen);
  }, [isVisibilityModalOpen]);

  const handleRedirect = () => {
    localStorage.setItem('redirectPath', '/payment');
    localStorage.setItem('reason', 'createNewUser');
    router.push('/login');
  };

  const handleSaveVisibility = (newVisibility, newInvitedEmails) => {
    setVisibility(newVisibility);
    setInvitedEmails(newInvitedEmails);
  };

  const handleSaveUpload = (newUploadVisibility, newUploadInvitedEmails) => {
    setUploadVisibility(newUploadVisibility);
    setUploadInvitedEmails(newUploadInvitedEmails);
  };

  const handleSaveEdit = (newEditVisibility, newEditInvitedEmails) => {
    setEditVisibility(newEditVisibility);
    setEditInvitedEmails(newEditInvitedEmails);
  };

  const handleSaveCreateTopics = (newCreateTopicsVisibility, newCreateTopicsInvitedEmails) => {
    setCreateTopicsVisibility(newCreateTopicsVisibility);
    setCreateTopicsInvitedEmails(newCreateTopicsInvitedEmails);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validaciones
    const validations = [
      [!memoryTitle, 'Please provide a title'],
      [visibility === 'invitation' && !invitedEmails.length, 'Add at least one email for memory access'],
      [uploadVisibility === 'invitation' && !uploadInvitedEmails.length, 'Add at least one email for upload permissions'],
      [editVisibility === 'invitation' && !editInvitedEmails.length, 'Add at least one email for edit permissions'],
      [createTopicsVisibility === 'invitation' && !createTopicsInvitedEmails.length, 'Add at least one email for create topics permissions'],
      [!userEmail, 'User not authenticated'],
    ];

    for (const [condition, message] of validations) {
      if (condition) {
        setError(message);
        setIsLoading(false);
        return;
      }
    }

    try {
      const response = await fetch('/api/mongoDb/createNewMemoryUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userEmail,
          memoryTitle,
          description,
          visibility,
          invitedEmails,
          fileUploadVisibility: uploadVisibility,
          fileUploadInvitedEmails: uploadInvitedEmails,
          editVisibility,
          editInvitedEmails,
          createTopicsVisibility,
          createTopicsInvitedEmails,
          uid,
          token,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create memory');
      }

      // Reset y redirección
      setMemoryTitle('');
      setDescription('');
      setVisibility('private');
      setInvitedEmails([]);
      setUploadVisibility('private');
      setUploadInvitedEmails([]);
      setEditVisibility('private');
      setEditInvitedEmails([]);
      setCreateTopicsVisibility('private');
      setCreateTopicsInvitedEmails([]);
      
      router.push('/memories');
    } catch (error) {
      setError(error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Contenido principal
  const leftContent = (
    <div className="card-content">
      <div style={{ display: 'flex' }}>
        <h2 className="card-title">Create New Memory</h2>
      </div>
      
      <form className="memory-form flex-column" onSubmit={handleSubmit}>
        <div className="form-group flex-column">
          <label className="title-sm">Memory Title *</label>
          <input
            type="text"
            className="text-input rounded p-2"
            value={memoryTitle}
            onChange={(e) => setMemoryTitle(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        
        <div className="form-group flex-column">
          <label className="title-sm">Description</label>
          <textarea
            style={{ resize: 'none' }}
            className="text-input rounded p-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="5"
            disabled={isLoading}
          />
        </div>
        
        {error && <div className="error-message color-error">{error}</div>}
        
        <button
          type="submit"
          className="demo-button"
          disabled={isLoading}
        >
          {isLoading ? 'Creating...' : 'Create Memory'}
        </button>
      </form>
    </div>
  );

  // Contenido lateral con permisos
  const rightContent = (
    <div className="card-content flex-column">
      {/* Sección de visibilidad */}
      <div className="permission-section">
        <h4 className="card-title">Memory Visibility</h4>
        <div
          className="selected-settings card pointer"
          onClick={() => setIsVisibilityModalOpen(true)}
        >
          {visibility === 'private' && (
            <div className="privacy-option">
              <span className="privacy-icon">🔒</span>
              <h5>Private</h5>
              <p>Only visible to you</p>
            </div>
          )}
          {visibility === 'public' && (
            <div className="privacy-option">
              <span className="privacy-icon">🌍</span>
              <h5>Public</h5>
              <p>Visible to everyone</p>
            </div>
          )}
          {visibility === 'invitation' && (
            <div className="privacy-option">
              <span className="privacy-icon">📩</span>
              <h5>By Invitation</h5>
              <p>{invitedEmails.length} invited users</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Sección de permisos de subida */}
      <div className="permission-section">
        <h4 className="card-title">Upload Permissions</h4>
        <div
          className="selected-settings card pointer"
          onClick={() => setIsUploadModalOpen(true)}
        >
          {uploadVisibility === 'private' && (
            <div className="privacy-option">
              <span className="privacy-icon">🔒</span>
              <h5>Private</h5>
              <p>Only you can upload</p>
            </div>
          )}
          {uploadVisibility === 'public' && (
            <div className="privacy-option">
              <span className="privacy-icon">🌍</span>
              <h5>Public</h5>
              <p>Everyone can upload</p>
            </div>
          )}
          {uploadVisibility === 'invitation' && (
            <div className="privacy-option">
              <span className="privacy-icon">📩</span>
              <h5>By Invitation</h5>
              <p>{uploadInvitedEmails.length} users can upload</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Sección de permisos de edición */}
      <div className="permission-section">
        <h4 className="card-title">Edit Permissions</h4>
        <div
          className="selected-settings card pointer"
          onClick={() => setIsEditModalOpen(true)}
        >
          {editVisibility === 'private' && (
            <div className="privacy-option">
              <span className="privacy-icon">🔒</span>
              <h5>Private</h5>
              <p>Only you can edit</p>
            </div>
          )}
          {editVisibility === 'public' && (
            <div className="privacy-option">
              <span className="privacy-icon">🌍</span>
              <h5>Public</h5>
              <p>Everyone can edit</p>
            </div>
          )}
          {editVisibility === 'invitation' && (
            <div className="privacy-option">
              <span className="privacy-icon">📩</span>
              <h5>By Invitation</h5>
              <p>{editInvitedEmails.length} users can edit</p>
            </div>
          )}
        </div>
      </div>

      {/* Sección de permisos para crear tópicos */}
      <div className="permission-section">
        <h4 className="card-title">Create Topics Permissions</h4>
        <div
          className="selected-settings card pointer"
          onClick={() => setIsCreateTopicsModalOpen(true)}
        >
          {createTopicsVisibility === 'private' && (
            <div className="privacy-option">
              <span className="privacy-icon">🔒</span>
              <h5>Private</h5>
              <p>Only you can create topics</p>
            </div>
          )}
          {createTopicsVisibility === 'public' && (
            <div className="privacy-option">
              <span className="privacy-icon">🌍</span>
              <h5>Public</h5>
              <p>Everyone can create topics</p>
            </div>
          )}
          {createTopicsVisibility === 'invitation' && (
            <div className="privacy-option">
              <span className="privacy-icon">📩</span>
              <h5>By Invitation</h5>
              <p>{createTopicsInvitedEmails.length} users can create topics</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Head>
        <title>Create New Memory | Memory App</title>
        <meta name="description" content="Create a new memory in the Memory App" />
      </Head>
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
      <CreateMemoryTopicsModal
        isOpen={isCreateTopicsModalOpen}
        onClose={() => setIsCreateTopicsModalOpen(false)}
        initialCreateTopicsVisibility={createTopicsVisibility}
        initialCreateTopicsInvitedEmails={createTopicsInvitedEmails}
        onSave={handleSaveCreateTopics}
      />
      
      {isAlreadyUser ? (
        <GeneralMold
          pageTitle="Create New Memory"
          leftContent={leftContent}
          rightContent={rightContent}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          setInitialData={setInitialData}
        />
      ) : alertMessage ? (
        <div className="fullscreen-floating flex-center">
          <div className="card p-4 text-center">
            <p className="text-lg mb-4">{alertMessage}</p>
            <button
              className="demo-button"
              onClick={handleRedirect}
            >
              Register Now
            </button>
          </div>
        </div>
      ) : (
        null
      )}
    </>
  );
};

export default CreateNewMemory;




















































/*'use client'; 


import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Menu from '@/components/complex/menu';
import MenuIcon from '@/components/complex/menuIcon';
import '../estilos/general/createNewMemory.css';
import '../app/globals.css';
import Modal from '@/components/complex/modal';
import MemoryLogo from '@/components/complex/memoryLogo';
import GeneralMold from '@/components/complex/generalMold';
import { auth } from '../../firebase';
import LoadingMemories from '@/components/complex/loading';
import Head from 'next/head';


// Visibility Modal Component
const VisibilityModal = ({
  isOpen,
  onClose,
  initialVisibility,
  initialInvitedEmails,
  onSave,
}) => {
  const [tempVisibility, setTempVisibility] = useState(initialVisibility);
  const [tempInvitedEmails, setTempInvitedEmails] = useState(initialInvitedEmails);
  const [tempEmailInput, setTempEmailInput] = useState('');
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    console.log(isOpen);
  }, [isOpen]);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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
        <h3 className="title-md">Configure Memory Visibility</h3>
        <div className="privacy-options">
          <div
            className={` card ${tempVisibility === 'invitation' ? 'active' : ''}`}
            onClick={() => setTempVisibility('invitation')}
          >
            <span className="privacy-icon">📩</span>
            <h4>By Invitation</h4>
            <p>Only specific users can view</p>
            {tempVisibility === 'invitation' && (
              <div className="email-section">
                <div className="flex-column">
                  <input
                    type="email"
                    value={tempEmailInput}
                    onChange={(e) => setTempEmailInput(e.target.value)}
                    placeholder="Enter email addresses"
                    className="text-input rounded p-2"
                  />
                  <button className="button2 m-1" onClick={handleTempAddEmail}>
                    Add
                  </button>
                </div>
                <div className="email-tags flex-column">
                  {tempInvitedEmails.map((email, index) => (
                    <div key={index} className="email-tag card p-1">
                      {email}
                      <button
                        className="close-button"
                        onClick={() =>
                          setTempInvitedEmails(tempInvitedEmails.filter((_, i) => i !== index))
                        }
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div
            className={` card ${tempVisibility === 'private' ? 'active' : ''}`}
            onClick={() => setTempVisibility('private')}
          >
            <span className="privacy-icon">🔒</span>
            <h4>Private</h4>
            <p>Only visible to you</p>
          </div>
          <div
            className={` card ${tempVisibility === 'public' ? 'active' : ''}`}
            onClick={() => setTempVisibility('public')}
          >
            <span className="privacy-icon">🌍</span>
            <h4>Public</h4>
            <p>Visible to everyone</p>
          </div>
        </div>
        {modalError && <div className="error-message color-error">{modalError}</div>}
        <div className="demo-actions">
          <button className="demo-button secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="demo-button" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </Modal>
  );
};

// Upload Permissions Modal Component
// Upload Permissions Modal Component
const UploadPermissionsModal = ({
  isOpen,
  onClose,
  initialUploadVisibility,
  initialUploadInvitedEmails,
  onSave,
}) => {
  const [tempUploadVisibility, setTempUploadVisibility] = useState(initialUploadVisibility);
  const [tempUploadInvitedEmails, setTempUploadInvitedEmails] = useState(initialUploadInvitedEmails);
  const [tempUploadEmailInput, setTempUploadEmailInput] = useState('');
  const [modalError, setModalError] = useState('');

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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
        <h3 className="title-md">Configure Upload Permissions</h3>
        <div className="privacy-options">
          <div
            className={`card ${tempUploadVisibility === 'invitation' ? 'active' : ''}`}
            onClick={() => setTempUploadVisibility('invitation')}
          >
            <span className="privacy-icon">📩</span>
            <h4>By Invitation</h4>
            <p>Only invited users can upload</p>
            {tempUploadVisibility === 'invitation' && (
              <div className="email-section">
                <div className="flex-column">
                  <input
                    type="email"
                    value={tempUploadEmailInput}
                    onChange={(e) => setTempUploadEmailInput(e.target.value)}
                    placeholder="Enter email addresses"
                    className="text-input rounded p-2"
                  />
                  <button className="button2 m-1" onClick={handleTempUploadAddEmail}>
                    Add
                  </button>
                </div>
                <div className="email-tags flex-column">
                  {tempUploadInvitedEmails.map((email, index) => (
                    <div key={index} className="email-tag card p-1">
                      {email}
                      <button
                        className="close-button"
                        onClick={() =>
                          setTempUploadInvitedEmails(tempUploadInvitedEmails.filter((_, i) => i !== index))
                        }
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div
            className={`card ${tempUploadVisibility === 'private' ? 'active' : ''}`}
            onClick={() => setTempUploadVisibility('private')}
          >
            <span className="privacy-icon">🔒</span>
            <h4>Private</h4>
            <p>Only you can upload files</p>
          </div>
          <div
            className={`card ${tempUploadVisibility === 'public' ? 'active' : ''}`}
            onClick={() => setTempUploadVisibility('public')}
          >
            <span className="privacy-icon">🌍</span>
            <h4>Public</h4>
            <p>Everyone can upload files</p>
          </div>
        </div>
        {modalError && <div className="error-message color-error">{modalError}</div>}
        <div className="demo-actions">
          <button className="demo-button secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="demo-button" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </Modal>
  );
};

// Edit Permissions Modal Component
const EditPermissionsModal = ({
  isOpen,
  onClose,
  initialEditVisibility,
  initialEditInvitedEmails,
  onSave,
}) => {
  const [tempEditVisibility, setTempEditVisibility] = useState(initialEditVisibility);
  const [tempEditInvitedEmails, setTempEditInvitedEmails] = useState(initialEditInvitedEmails);
  const [tempEditEmailInput, setTempEditEmailInput] = useState('');
  const [modalError, setModalError] = useState('');

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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
        <h3 className="title-md">Configure Edit Permissions</h3>
        <div className="privacy-options">
          <div
            className={` card ${tempEditVisibility === 'invitation' ? 'active' : ''}`}
            onClick={() => setTempEditVisibility('invitation')}
          >
            <span className="privacy-icon">📩</span>
            <h4>By Invitation</h4>
            <p>Only invited users can edit</p>
            {tempEditVisibility === 'invitation' && (
              <div className="email-section">
                <div className="flex-column">
                  <input
                    type="email"
                    value={tempEditEmailInput}
                    onChange={(e) => setTempEditEmailInput(e.target.value)}
                    placeholder="Enter email addresses"
                    className="text-input rounded p-2"
                  />
                  <button className="button2 m-1" onClick={handleTempEditAddEmail}>
                    Add
                  </button>
                </div>
                <div className="email-tags flex-column">
                  {tempEditInvitedEmails.map((email, index) => (
                    <div key={index} className="email-tag card p-1">
                      {email}
                      <button
                        className="close-button"
                        onClick={() =>
                          setTempEditInvitedEmails(tempEditInvitedEmails.filter((_, i) => i !== index))
                        }
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div
            className={` card ${tempEditVisibility === 'private' ? 'active' : ''}`}
            onClick={() => setTempEditVisibility('private')}
          >
            <span className="privacy-icon">🔒</span>
            <h4>Private</h4>
            <p>Only you can edit</p>
          </div>
          <div
            className={` card ${tempEditVisibility === 'public' ? 'active' : ''}`}
            onClick={() => setTempEditVisibility('public')}
          >
            <span className="privacy-icon">🌍</span>
            <h4>Public</h4>
            <p>Everyone can edit</p>
          </div>
        </div>
        {modalError && <div className="error-message color-error">{modalError}</div>}
        <div className="demo-actions">
          <button className="demo-button secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="demo-button" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </Modal>
  );
};

// Main CreateNewMemory Component
// Componente principal actualizado con 100% de funcionalidades
const CreateNewMemory = () => {
  const router = useRouter();
  const [memoryTitle, setMemoryTitle] = useState('');
  const [description, setDescription] = useState('');
  const [userEmail, setUserEmail] = useState(null);
  const [uid, setUid] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAlreadyUser, setIsAlreadyUser] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null); 
  const [initialData, setInitialData] = useState();
  
  // Estados para permisos
  const [visibility, setVisibility] = useState('private');
  const [invitedEmails, setInvitedEmails] = useState([]);
  const [uploadVisibility, setUploadVisibility] = useState('private');
  const [uploadInvitedEmails, setUploadInvitedEmails] = useState([]);
  const [editVisibility, setEditVisibility] = useState('private');
  const [editInvitedEmails, setEditInvitedEmails] = useState([]);
  
  // Estados para modales
  const [isVisibilityModalOpen, setIsVisibilityModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Autenticación de usuario
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
        setIsAlreadyUser(true)
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
    console.log(isVisibilityModalOpen);
  }, [isVisibilityModalOpen]);

  // Verificación de permisos del usuario
  

  const handleRedirect = () => {
    localStorage.setItem('redirectPath', '/payment');
    localStorage.setItem('reason', 'createNewUser');
    router.push('/login');
  };

  const handleSaveVisibility = (newVisibility, newInvitedEmails) => {
    setVisibility(newVisibility);
    setInvitedEmails(newInvitedEmails);
  };

  const handleSaveUpload = (newUploadVisibility, newUploadInvitedEmails) => {
    setUploadVisibility(newUploadVisibility);
    setUploadInvitedEmails(newUploadInvitedEmails);
  };

  const handleSaveEdit = (newEditVisibility, newEditInvitedEmails) => {
    setEditVisibility(newEditVisibility);
    setEditInvitedEmails(newEditInvitedEmails);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validaciones
    const validations = [
      [!memoryTitle, 'Please provide a title'],
      [visibility === 'invitation' && !invitedEmails.length, 'Add at least one email for memory access'],
      [uploadVisibility === 'invitation' && !uploadInvitedEmails.length, 'Add at least one email for upload permissions'],
      [editVisibility === 'invitation' && !editInvitedEmails.length, 'Add at least one email for edit permissions'],
      [!userEmail, 'User not authenticated']
    ];

    for (const [condition, message] of validations) {
      if (condition) {
        setError(message);
        setIsLoading(false);
        return;
      }
    }

    

    try {
      const response = await fetch('/api/mongoDb/createNewMemoryUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userEmail,
          memoryTitle,
          description,
          visibility,
          invitedEmails,
          fileUploadVisibility: uploadVisibility,
          fileUploadInvitedEmails: uploadInvitedEmails,
          editVisibility,
          editInvitedEmails,
          uid, 
          token
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create memory');
      }

      // Reset y redirección
      setMemoryTitle('');
      setDescription('');
      setVisibility('private');
      setInvitedEmails([]);
      setUploadVisibility('private');
      setUploadInvitedEmails([]);
      setEditVisibility('private');
      setEditInvitedEmails([]);
      
      router.push('/memories');
    } catch (error) {
      setError(error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Contenido principal
  const leftContent = (
    <div className="card-content">
      <div style={{ display: 'flex' }}>
        <h2 className="card-title">Create New Memory</h2>
      </div>
      
      <form className="memory-form flex-column" onSubmit={handleSubmit}>
        <div className="form-group flex-column">
          <label className="title-sm">Memory Title *</label>
          <input
            type="text"
            className="text-input rounded p-2"
            value={memoryTitle}
            onChange={(e) => setMemoryTitle(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        
        <div className="form-group flex-column">
          <label className="title-sm">Description</label>
          <textarea
            style={{resize: 'none'}}
            className="text-input rounded p-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="5"
            disabled={isLoading}
          />
        </div>
        
        {error && <div className="error-message color-error">{error}</div>}
        
        <button 
          type="submit" 
          className="demo-button" 
          disabled={isLoading}
        >
          {isLoading ? 'Creating...' : 'Create Memory'}
        </button>
      </form>
    </div>
  );

  // Contenido lateral con permisos
  const rightContent = (
    <div className="card-content flex-column">
      
      <div className="permission-section">
        <h4 className="card-title">Memory Visibility</h4>
        <div 
          className="selected-settings card pointer" 
          onClick={() => setIsVisibilityModalOpen(true)}
        >
          {visibility === 'private' && (
            <div className="privacy-option">
              <span className="privacy-icon">🔒</span>
              <h5>Private</h5>
              <p>Only visible to you</p>
            </div>
          )}
          {visibility === 'public' && (
            <div className="privacy-option">
              <span className="privacy-icon">🌍</span>
              <h5>Public</h5>
              <p>Visible to everyone</p>
            </div>
          )}
          {visibility === 'invitation' && (
            <div className="privacy-option">
              <span className="privacy-icon">📩</span>
              <h5>By Invitation</h5>
              <p>{invitedEmails.length} invited users</p>
            </div>
          )}
        </div>
      </div>
      
      
      <div className="permission-section">
        <h4 className="card-title">Upload Permissions</h4>
        <div 
          className="selected-settings card pointer" 
          onClick={() => setIsUploadModalOpen(true)}
        >
          {uploadVisibility === 'private' && (
            <div className="privacy-option">
              <span className="privacy-icon">🔒</span>
              <h5>Private</h5>
              <p>Only you can upload</p>
            </div>
          )}
          {uploadVisibility === 'public' && (
            <div className="privacy-option">
              <span className="privacy-icon">🌍</span>
              <h5>Public</h5>
              <p>Everyone can upload</p>
            </div>
          )}
          {uploadVisibility === 'invitation' && (
            <div className="privacy-option">
              <span className="privacy-icon">📩</span>
              <h5>By Invitation</h5>
              <p>{uploadInvitedEmails.length} users can upload</p>
            </div>
          )}
        </div>
      </div>
      
      
      <div className="permission-section">
        <h4 className="card-title">Edit Permissions</h4>
        <div 
          className="selected-settings card pointer" 
          onClick={() => setIsEditModalOpen(true)}
        >
          {editVisibility === 'private' && (
            <div className="privacy-option">
              <span className="privacy-icon">🔒</span>
              <h5>Private</h5>
              <p>Only you can edit</p>
            </div>
          )}
          {editVisibility === 'public' && (
            <div className="privacy-option">
              <span className="privacy-icon">🌍</span>
              <h5>Public</h5>
              <p>Everyone can edit</p>
            </div>
          )}
          {editVisibility === 'invitation' && (
            <div className="privacy-option">
              <span className="privacy-icon">📩</span>
              <h5>By Invitation</h5>
              <p>{editInvitedEmails.length} users can edit</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Head>
        <title>Create New Memory | Memory App</title>
        <meta name="description" content="Create a new memory in the Memory App" />
      </Head>
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
      
      {isAlreadyUser ? (
        <GeneralMold
          pageTitle="Create New Memory"
          leftContent={leftContent}
          rightContent={rightContent}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          setInitialData={setInitialData}
        >
        </GeneralMold>
      ) : alertMessage ? (
        <div className="fullscreen-floating flex-center">
          <div className="card p-4 text-center">
            <p className="text-lg mb-4">{alertMessage}</p>
            <button 
              className="demo-button"
              onClick={handleRedirect}
            >
              Register Now
            </button>
          </div>
        </div>
      ) : (
        null
      )}
    </>
  );
};

// Exportar los modales con las mismas funcionalidades de la primera versión


export default CreateNewMemory;*/