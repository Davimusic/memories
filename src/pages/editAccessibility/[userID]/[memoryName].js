import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import '../../../estilos/general/api/edit/editAccessibility.css';
import '../../../app/globals.css';
import Modal from '@/components/complex/modal';
import LoadingMemories from '@/components/complex/loading';
import { auth } from '../../../../firebase';
import ErrorComponent from '@/components/complex/error';
import { toast } from 'react-toastify';
import GeneralMold from '@/components/complex/generalMold';

// Visibility Modal Component
const VisibilityModal = ({
  isOpen,
  onClose,
  initialVisibility,
  initialInvitedEmails,
  onSave
}) => {
  const [tempVisibility, setTempVisibility] = useState(initialVisibility || 'private');
  const [tempInvitedEmails, setTempInvitedEmails] = useState(initialInvitedEmails || []);
  const [tempEmailInput, setTempEmailInput] = useState('');
  const [modalError, setModalError] = useState('');

  // Sync modal state with props when they change
  useEffect(() => {
    setTempVisibility(initialVisibility || 'private');
    setTempInvitedEmails(initialInvitedEmails || []);
  }, [initialVisibility, initialInvitedEmails]);

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

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
        <h1 className="visually-hidden">Memory Visibility Settings</h1>
        <div className="privacy-options" role="radiogroup" aria-labelledby="visibility-heading">
          <div 
            className={`privacy-option ${tempVisibility === 'invitation' ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setTempVisibility('invitation');
            }}
            role="radio"
            aria-checked={tempVisibility === 'invitation'}
            tabIndex={0}
          >
            <div className="privacy-icon" aria-hidden="true">📩</div>
            <div className="privacy-details">
              <h3 id="invitation-heading">By Invitation</h3>
              <p>Only specific users can view</p>
              {tempVisibility === 'invitation' && (
                <div className="email-section">
                  <div className="file-input-group">
                    <label htmlFor="visibility-email-input" className="visually-hidden">Enter email addresses</label>
                    <input
                      id="visibility-email-input"
                      type="email"
                      value={tempEmailInput}
                      onChange={(e) => setTempEmailInput(e.target.value)}
                      placeholder="Enter email addresses"
                      className="text-input"
                      onClick={(e) => e.stopPropagation()}
                      aria-describedby="visibility-email-error"
                    />
                    <button 
                      type="button" 
                      className="button2" 
                      onClick={handleTempAddEmail}
                      aria-label="Add email"
                    >
                      Add
                    </button>
                  </div>
                  {modalError && (
                    <div id="visibility-email-error" className="error-message" role="alert">
                      {modalError}
                    </div>
                  )}
                  <div className="email-tags">
                    {tempInvitedEmails.map((email, index) => (
                      <div key={index} className="email-tag">
                        <span>{email}</span>
                        <button
                          className="remove-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTempInvitedEmails(tempInvitedEmails.filter((_, i) => i !== index));
                          }}
                          aria-label={`Remove ${email}`}
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

          <div 
            className={`privacy-option ${tempVisibility === 'private' ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setTempVisibility('private');
            }}
            role="radio"
            aria-checked={tempVisibility === 'private'}
            tabIndex={0}
          >
            <div className="privacy-icon" aria-hidden="true">🔒</div>
            <div className="privacy-details">
              <h3>Private</h3>
              <p>Only visible to you</p>
            </div>
          </div>
          
          <div 
            className={`privacy-option ${tempVisibility === 'public' ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setTempVisibility('public');
            }}
            role="radio"
            aria-checked={tempVisibility === 'public'}
            tabIndex={0}
          >
            <div className="privacy-icon" aria-hidden="true">🌍</div>
            <div className="privacy-details">
              <h3>Public</h3>
              <p>Visible to everyone</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', boxSizing: 'border-box' }}>
          <button 
            className="button2" 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            type="button"
          >
            Cancel
          </button>
          <button className="button2" onClick={handleSave} type="button">
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
  onSave
}) => {
  const [tempUploadVisibility, setTempUploadVisibility] = useState(initialUploadVisibility || 'private');
  const [tempUploadInvitedEmails, setTempUploadInvitedEmails] = useState(initialUploadInvitedEmails || []);
  const [tempUploadEmailInput, setTempUploadEmailInput] = useState('');
  const [modalError, setModalError] = useState('');

  // Sync modal state with props when they change
  useEffect(() => {
    setTempUploadVisibility(initialUploadVisibility || 'private');
    setTempUploadInvitedEmails(initialUploadInvitedEmails || []);
  }, [initialUploadVisibility, initialUploadInvitedEmails]);

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

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
        <h1 className="visually-hidden">Upload Permissions Settings</h1>
        <div className="privacy-options" role="radiogroup" aria-labelledby="upload-heading">
          <div 
            className={`privacy-option ${tempUploadVisibility === 'invitation' ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setTempUploadVisibility('invitation');
            }}
            role="radio"
            aria-checked={tempUploadVisibility === 'invitation'}
            tabIndex={0}
          >
            <div className="privacy-icon" aria-hidden="true">📩</div>
            <div className="privacy-details">
              <h3 id="upload-invitation-heading">By Invitation</h3>
              <p>Only invited users can upload</p>
              {tempUploadVisibility === 'invitation' && (
                <div className="email-section">
                  <div className="file-input-group">
                    <label htmlFor="upload-email-input" className="visually-hidden">Enter email addresses</label>
                    <input
                      id="upload-email-input"
                      type="email"
                      value={tempUploadEmailInput}
                      onChange={(e) => setTempUploadEmailInput(e.target.value)}
                      placeholder="Enter email addresses"
                      className="text-input"
                      onClick={(e) => e.stopPropagation()}
                      aria-describedby="upload-email-error"
                    />
                    <button 
                      type="button" 
                      className="button2" 
                      onClick={handleTempUploadAddEmail}
                      aria-label="Add email"
                    >
                      Add
                    </button>
                  </div>
                  {modalError && (
                    <div id="upload-email-error" className="error-message" role="alert">
                      {modalError}
                    </div>
                  )}
                  <div className="email-tags">
                    {tempUploadInvitedEmails.map((email, index) => (
                      <div key={index} className="email-tag">
                        <span>{email}</span>
                        <button
                          className="remove-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTempUploadInvitedEmails(tempUploadInvitedEmails.filter((_, i) => i !== index));
                          }}
                          aria-label={`Remove ${email}`}
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

          <div 
            className={`privacy-option ${tempUploadVisibility === 'private' ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setTempUploadVisibility('private');
            }}
            role="radio"
            aria-checked={tempUploadVisibility === 'private'}
            tabIndex={0}
          >
            <div className="privacy-icon" aria-hidden="true">🔒</div>
            <div className="privacy-details">
              <h3>Private</h3>
              <p>Only you can upload files</p>
            </div>
          </div>
          
          <div 
            className={`privacy-option ${tempUploadVisibility === 'public' ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setTempUploadVisibility('public');
            }}
            role="radio"
            aria-checked={tempUploadVisibility === 'public'}
            tabIndex={0}
          >
            <div className="privacy-icon" aria-hidden="true">🌍</div>
            <div className="privacy-details">
              <h3>Public</h3>
              <p>Everyone can upload files</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', boxSizing: 'border-box' }}>
          <button 
            className="button2" 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            type="button"
          >
            Cancel
          </button>
          <button className="button2" onClick={handleSave} type="button">
            Save Changes
          </button>
        </div>
      </div>
    </Modal>
  );
};


const CreateTopicsPermissionsModal = ({
  isOpen,
  onClose,
  initialCreateTopicsVisibility,
  initialCreateTopicsInvitedEmails,
  onSave
}) => {
  const [tempCreateTopicsVisibility, setTempCreateTopicsVisibility] = useState(initialCreateTopicsVisibility || 'private');
  const [tempCreateTopicsInvitedEmails, setTempCreateTopicsInvitedEmails] = useState(initialCreateTopicsInvitedEmails || []);
  const [tempCreateTopicsEmailInput, setTempCreateTopicsEmailInput] = useState('');
  const [modalError, setModalError] = useState('');

  // Sync modal state with props when they change
  useEffect(() => {
    setTempCreateTopicsVisibility(initialCreateTopicsVisibility || 'private');
    setTempCreateTopicsInvitedEmails(initialCreateTopicsInvitedEmails || []);
  }, [initialCreateTopicsVisibility, initialCreateTopicsInvitedEmails]);

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

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
        <h1 className="visually-hidden">Create Topics Permissions Settings</h1>
        <h2 className="modal-title">Create Topics Permissions</h2>
        <div className="privacy-options" role="radiogroup" aria-labelledby="create-topics-heading">
          <div 
            className={`privacy-option ${tempCreateTopicsVisibility === 'invitation' ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setTempCreateTopicsVisibility('invitation');
            }}
            role="radio"
            aria-checked={tempCreateTopicsVisibility === 'invitation'}
            tabIndex={0}
          >
            <div className="privacy-icon" aria-hidden="true">📩</div>
            <div className="privacy-details">
              <h3 id="create-topics-invitation-heading">By Invitation</h3>
              <p>Only invited users can create topics</p>
              {tempCreateTopicsVisibility === 'invitation' && (
                <div className="email-section">
                  <div className="file-input-group">
                    <label htmlFor="create-topics-email-input" className="visually-hidden">Enter email addresses</label>
                    <input
                      id="create-topics-email-input"
                      type="email"
                      value={tempCreateTopicsEmailInput}
                      onChange={(e) => setTempCreateTopicsEmailInput(e.target.value)}
                      placeholder="Enter email addresses"
                      className="text-input"
                      onClick={(e) => e.stopPropagation()}
                      aria-describedby="create-topics-email-error"
                    />
                    <button 
                      type="button" 
                      className="button2" 
                      onClick={handleTempCreateTopicsAddEmail}
                      aria-label="Add email"
                    >
                      Add
                    </button>
                  </div>
                  {modalError && (
                    <div id="create-topics-email-error" className="error-message" role="alert">
                      {modalError}
                    </div>
                  )}
                  <div className="email-tags">
                    {tempCreateTopicsInvitedEmails.map((email, index) => (
                      <div key={index} className="email-tag">
                        <span>{email}</span>
                        <button
                          className="remove-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTempCreateTopicsInvitedEmails(tempCreateTopicsInvitedEmails.filter((_, i) => i !== index));
                          }}
                          aria-label={`Remove ${email}`}
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

          <div 
            className={`privacy-option ${tempCreateTopicsVisibility === 'private' ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setTempCreateTopicsVisibility('private');
            }}
            role="radio"
            aria-checked={tempCreateTopicsVisibility === 'private'}
            tabIndex={0}
          >
            <div className="privacy-icon" aria-hidden="true">🔒</div>
            <div className="privacy-details">
              <h3>Private</h3>
              <p>Only you can create topics</p>
            </div>
          </div>
          
          <div 
            className={`privacy-option ${tempCreateTopicsVisibility === 'public' ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setTempCreateTopicsVisibility('public');
            }}
            role="radio"
            aria-checked={tempCreateTopicsVisibility === 'public'}
            tabIndex={0}
          >
            <div className="privacy-icon" aria-hidden="true">🌍</div>
            <div className="privacy-details">
              <h3>Public</h3>
              <p>Everyone can create topics</p>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button 
            className="cancel-button button2" 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            type="button"
          >
            Cancel
          </button>
          <button className="submit-button button2" onClick={handleSave} type="button">
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
  onSave
}) => {
  const [tempEditVisibility, setTempEditVisibility] = useState(initialEditVisibility || 'private');
  const [tempEditInvitedEmails, setTempEditInvitedEmails] = useState(initialEditInvitedEmails || []);
  const [tempEditEmailInput, setTempEditEmailInput] = useState('');
  const [modalError, setModalError] = useState('');

  // Sync modal state with props when they change
  useEffect(() => {
    setTempEditVisibility(initialEditVisibility || 'private');
    setTempEditInvitedEmails(initialEditInvitedEmails || []);
  }, [initialEditVisibility, initialEditInvitedEmails]);

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

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
        <h1 className="visually-hidden">Edit Permissions Settings</h1>
        <h2 className="modal-title">Edit Permissions</h2>
        <div className="privacy-options" role="radiogroup" aria-labelledby="edit-heading">
          <div 
            className={`privacy-option ${tempEditVisibility === 'invitation' ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setTempEditVisibility('invitation');
            }}
            role="radio"
            aria-checked={tempEditVisibility === 'invitation'}
            tabIndex={0}
          >
            <div className="privacy-icon" aria-hidden="true">📩</div>
            <div className="privacy-details">
              <h3 id="edit-invitation-heading">By Invitation</h3>
              <p>Only invited users can edit</p>
              {tempEditVisibility === 'invitation' && (
                <div className="email-section">
                  <div className="file-input-group">
                    <label htmlFor="edit-email-input" className="visually-hidden">Enter email addresses</label>
                    <input
                      id="edit-email-input"
                      type="email"
                      value={tempEditEmailInput}
                      onChange={(e) => setTempEditEmailInput(e.target.value)}
                      placeholder="Enter email addresses"
                      className="text-input"
                      onClick={(e) => e.stopPropagation()}
                      aria-describedby="edit-email-error"
                    />
                    <button 
                      type="button" 
                      className="button2" 
                      onClick={handleTempEditAddEmail}
                      aria-label="Add email"
                    >
                      Add
                    </button>
                  </div>
                  {modalError && (
                    <div id="edit-email-error" className="error-message" role="alert">
                      {modalError}
                    </div>
                  )}
                  <div className="email-tags">
                    {tempEditInvitedEmails.map((email, index) => (
                      <div key={index} className="email-tag">
                        <span>{email}</span>
                        <button
                          className="remove-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTempEditInvitedEmails(tempEditInvitedEmails.filter((_, i) => i !== index));
                          }}
                          aria-label={`Remove ${email}`}
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

          <div 
            className={`privacy-option ${tempEditVisibility === 'private' ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setTempEditVisibility('private');
            }}
            role="radio"
            aria-checked={tempEditVisibility === 'private'}
            tabIndex={0}
          >
            <div className="privacy-icon" aria-hidden="true">🔒</div>
            <div className="privacy-details">
              <h3>Private</h3>
              <p>Only you can edit</p>
            </div>
          </div>
          
          <div 
            className={`privacy-option ${tempEditVisibility === 'public' ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setTempEditVisibility('public');
            }}
            role="radio"
            aria-checked={tempEditVisibility === 'public'}
            tabIndex={0}
          >
            <div className="privacy-icon" aria-hidden="true">🌍</div>
            <div className="privacy-details">
              <h3>Public</h3>
              <p>Everyone can edit</p>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button 
            className="cancel-button button2" 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            type="button"
          >
            Cancel
          </button>
          <button className="submit-button button2" onClick={handleSave} type="button">
            Save Changes
          </button>
        </div>
      </div>
    </Modal>
  );
};



const EditMemoryPermissions = () => {
  const router = useRouter();
  const { userID: urlUserID, memoryName: urlMemoryName } = router.query;

  // States
  const [visibility, setVisibility] = useState('private');
  const [invitedEmails, setInvitedEmails] = useState([]);
  const [uploadVisibility, setUploadVisibility] = useState('private');
  const [uploadInvitedEmails, setUploadInvitedEmails] = useState([]);
  const [editVisibility, setEditVisibility] = useState('private');
  const [editInvitedEmails, setEditInvitedEmails] = useState([]);
  const [createTopicsVisibility, setCreateTopicsVisibility] = useState('private');
  const [createTopicsInvitedEmails, setCreateTopicsInvitedEmails] = useState([]);
  const [memoryTitle, setMemoryTitle] = useState('Memory');
  const [isVisibilityModalOpen, setIsVisibilityModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateTopicsModalOpen, setIsCreateTopicsModalOpen] = useState(false);
  const [isUploadingInformation, setIsUploadingInformation] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [permissionResult, setPermissionResult] = useState(null);
  const [permissionError, setPermissionError] = useState('');
  const [rollUser, setRollUSer] = useState('private');
  const [uidChild, setUidChild] = useState(null);
  const [tokenChild, setTokenChild] = useState(null);
  const [userEmailChild, setUserEmailChild] = useState(null);

  // Estado inicial para detectar cambios
  const initialStateRef = useRef({
    visibility: 'private',
    invitedEmails: [],
    uploadVisibility: 'private',
    uploadInvitedEmails: [],
    editVisibility: 'private',
    editInvitedEmails: [],
    createTopicsVisibility: 'private',
    createTopicsInvitedEmails: [],
  });

  // Update states based on permissionResult
  useEffect(() => {
    console.log(permissionResult);
    if (permissionResult) {
      setRollUSer(permissionResult.requiredVisibility)
      setVisibility(permissionResult.accessInformation?.view.visibility || 'private');
      setInvitedEmails(permissionResult.accessInformation?.view?.invitedEmails || []);
      setUploadVisibility(permissionResult.accessInformation?.upload?.visibility || 'private');
      setUploadInvitedEmails(permissionResult.accessInformation?.upload?.invitedEmails || []);
      setEditVisibility(permissionResult.accessInformation?.edit?.visibility || 'private');
      setEditInvitedEmails(permissionResult.accessInformation?.edit?.invitedEmails || []);
      setCreateTopicsVisibility(permissionResult.accessInformation?.createMemoryTopics?.visibility || 'private');
      setCreateTopicsInvitedEmails(permissionResult.accessInformation?.createMemoryTopics?.invitedEmails || []);
      setMemoryTitle(permissionResult.memoryMetadata?.title || 'Memory');
      setPermissionError(permissionResult.accessInformation?.reason || '');
      initialStateRef.current = {
        visibility: permissionResult.accessInformation?.view.visibility || 'private',
        invitedEmails: permissionResult.accessInformation?.view?.invitedEmails || [],
        uploadVisibility: permissionResult.accessInformation?.upload?.visibility || 'private',
        uploadInvitedEmails: permissionResult.accessInformation?.upload?.invitedEmails || [],
        editVisibility: permissionResult.accessInformation?.edit?.visibility || 'private',
        editInvitedEmails: permissionResult.accessInformation?.edit?.invitedEmails || [],
        createTopicsVisibility: permissionResult.accessInformation?.createMemoryTopics?.visibility || 'private',
        createTopicsInvitedEmails: permissionResult.accessInformation?.createMemoryTopics?.invitedEmails || [],
      };
      setIsLoading(false);
    } else {
      setPermissionError('No permission data available');
      setIsLoading(false);
    }
  }, [permissionResult]);

  // Verificar si hay cambios
  const hasChanges = () => {
    return (
      visibility !== initialStateRef.current.visibility ||
      JSON.stringify(invitedEmails) !== JSON.stringify(initialStateRef.current.invitedEmails) ||
      uploadVisibility !== initialStateRef.current.uploadVisibility ||
      JSON.stringify(uploadInvitedEmails) !== JSON.stringify(initialStateRef.current.uploadInvitedEmails) ||
      editVisibility !== initialStateRef.current.editVisibility ||
      JSON.stringify(editInvitedEmails) !== JSON.stringify(initialStateRef.current.editInvitedEmails) ||
      createTopicsVisibility !== initialStateRef.current.createTopicsVisibility ||
      JSON.stringify(createTopicsInvitedEmails) !== JSON.stringify(initialStateRef.current.createTopicsInvitedEmails)
    );
  };

  // Guardar cambios
  const handleSave = async (e) => {
    e.preventDefault();
    setIsUploadingInformation(true);
    setError('');

    try {
      if (!urlUserID || !urlMemoryName) {
        throw new Error('Missing URL parameters');
      }

      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const response = await fetch('/api/mongoDb/queries/updateMemoryPermissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: urlUserID,
          memoryName: urlMemoryName,
          currentUser: userEmailChild,
          visibility,
          invitedEmails,
          fileUploadVisibility: uploadVisibility,
          fileUploadInvitedEmails: uploadInvitedEmails,
          editVisibility,
          editInvitedEmails,
          createTopicsVisibility,
          createTopicsInvitedEmails,
          uid: uidChild,
          token: tokenChild,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        initialStateRef.current = { 
          visibility, 
          invitedEmails, 
          uploadVisibility, 
          uploadInvitedEmails, 
          editVisibility, 
          editInvitedEmails,
          createTopicsVisibility,
          createTopicsInvitedEmails 
        };
        setPermissionResult((prev) => ({
          ...prev,
          accessInformation: {
            ...prev.accessInformation,
            view: { visibility, invitedEmails },
            upload: { visibility: uploadVisibility, invitedEmails: uploadInvitedEmails },
            edit: { visibility: editVisibility, invitedEmails: editInvitedEmails },
            createMemoryTopics: { visibility: createTopicsVisibility, invitedEmails: createTopicsInvitedEmails },
          },
        }));
        // Update parent with new permission data
        setPermissionResult({
          ...permissionResult,
          accessInformation: {
            ...permissionResult.accessInformation,
            view: { visibility, invitedEmails },
            upload: { visibility: uploadVisibility, invitedEmails: uploadInvitedEmails },
            edit: { visibility: editVisibility, invitedEmails: editInvitedEmails },
            createMemoryTopics: { visibility: createTopicsVisibility, invitedEmails: createTopicsInvitedEmails },
          },
        });
      } else {
        throw new Error(data.message || 'Error updating permissions');
      }
    } catch (err) {
      toast.error(err.message);
      setError(err.message);
    } finally {
      setIsUploadingInformation(false);
    }
  };

  // Componente para sección de permiso
  const PermissionSection = ({ title, icon, type, count, onClick }) => {
    const getTypeText = () => {
      switch (type) {
        case 'private':
          return 'Only you';
        case 'public':
          return 'Everyone';
        case 'invitation':
          return `${count} users`;
        default:
          return '';
      }
    };

    const getDescription = () => {
      if (title === 'Memory Visibility') {
        switch (type) {
          case 'private':
            return 'Only visible to you';
          case 'public':
            return 'Visible to everyone';
          case 'invitation':
            return 'Specific users';
          default:
            return '';
        }
      }
      if (title === 'Upload Permissions') {
        switch (type) {
          case 'private':
            return 'Only you can upload';
          case 'public':
            return 'Everyone can upload';
          case 'invitation':
            return 'Specific users';
          default:
            return '';
        }
      }
      if (title === 'Edit Permissions') {
        switch (type) {
          case 'private':
            return 'Only you can edit';
          case 'public':
            return 'Everyone can edit';
          case 'invitation':
            return 'Specific users';
          default:
            return '';
        }
      }
      if (title === 'Create Topics Permissions') {
        switch (type) {
          case 'private':
            return 'Only you can create topics';
          case 'public':
            return 'Everyone can create topics';
          case 'invitation':
            return 'Specific users';
          default:
            return '';
        }
      }
      return '';
    };

    return (
      <section className="permission-card">
        <div className="section-header">
          <h2>{title}</h2>
        </div>
        <button type="button" className="permission-settings" onClick={onClick}>
          <div className="permission-icon">{icon}</div>
          <div className="permission-details">
            <h3>{getTypeText()}</h3>
            <p>{getDescription()}</p>
          </div>
        </button>
      </section>
    );
  };

  // Funciones auxiliares para iconos
  const getVisibilityIcon = (type) => {
    switch (type) {
      case 'private':
        return '🔒';
      case 'public':
        return '🌍';
      case 'invitation':
        return '📩';
      default:
        return '⚙️';
    }
  };

  const getUploadIcon = (type) => {
    switch (type) {
      case 'private':
        return '📤';
      case 'public':
        return '📥';
      case 'invitation':
        return '👥';
      default:
        return '📁';
    }
  };

  const getEditIcon = (type) => {
    switch (type) {
      case 'private':
        return '✏️';
      case 'public':
        return '📝';
      case 'invitation':
        return '👨‍💻';
      default:
        return '🛠️';
    }
  };

  const getCreateTopicsIcon = (type) => {
    switch (type) {
      case 'private':
        return '📋';
      case 'public':
        return '📚';
      case 'invitation':
        return '👥';
      default:
        return '📌';
    }
  };

  // Contenido principal
  const rightContent = (
    <div className="permissions-editor">
      {isLoading ? (
        null
      ) : permissionError ? (
        <ErrorComponent
          errorMessage={permissionError}
          onRetry={() => {
            setPermissionError('');
            setIsLoading(true);
            setPermissionResult(null);
          }}
        />
      ) : (
        <>
          <div className="header-section">
            <h1 className="title">Edit Permissions: {memoryTitle}</h1>
          </div>
          <form className="permissions-form" onSubmit={handleSave}>
            {error && <div className="error-message">{error}</div>}
            <div className="permissions-grid">
              <PermissionSection
                title="Memory Visibility"
                icon={getVisibilityIcon(visibility)}
                type={visibility}
                count={invitedEmails.length}
                onClick={() => setIsVisibilityModalOpen(true)}
              />
              <PermissionSection
                title="Upload Permissions"
                icon={getUploadIcon(uploadVisibility)}
                type={uploadVisibility}
                count={uploadInvitedEmails.length}
                onClick={() => setIsUploadModalOpen(true)}
              />
              <PermissionSection
                title="Edit Permissions"
                icon={getEditIcon(editVisibility)}
                type={editVisibility}
                count={editInvitedEmails.length}
                onClick={() => setIsEditModalOpen(true)}
              />
              <PermissionSection
                title="Create Topics Permissions"
                icon={getCreateTopicsIcon(createTopicsVisibility)}
                type={createTopicsVisibility}
                count={createTopicsInvitedEmails.length}
                onClick={() => setIsCreateTopicsModalOpen(true)}
              />
            </div>
            {hasChanges() && (
              <div className="actions">
                <button
                  type="submit"
                  className="save-button"
                  disabled={isUploadingInformation}
                >
                  {isUploadingInformation ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </form>
        </>
      )}
      <VisibilityModal
        isOpen={isVisibilityModalOpen}
        onClose={() => setIsVisibilityModalOpen(false)}
        initialVisibility={visibility}
        initialInvitedEmails={invitedEmails}
        onSave={(vis, emails) => {
          setVisibility(vis);
          setInvitedEmails(emails);
        }}
      />
      <UploadPermissionsModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        initialUploadVisibility={uploadVisibility}
        initialUploadInvitedEmails={uploadInvitedEmails}
        onSave={(vis, emails) => {
          setUploadVisibility(vis);
          setUploadInvitedEmails(emails);
        }}
      />
      <EditPermissionsModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialEditVisibility={editVisibility}
        initialEditInvitedEmails={editInvitedEmails}
        onSave={(vis, emails) => {
          setEditVisibility(vis);
          setEditInvitedEmails(emails);
        }}
      />
      <CreateTopicsPermissionsModal
        isOpen={isCreateTopicsModalOpen}
        onClose={() => setIsCreateTopicsModalOpen(false)}
        initialCreateTopicsVisibility={createTopicsVisibility}
        initialCreateTopicsInvitedEmails={createTopicsInvitedEmails}
        onSave={(vis, emails) => {
          setCreateTopicsVisibility(vis);
          setCreateTopicsInvitedEmails(emails);
        }}
      />
    </div>
  );

  return (
    <GeneralMold
      key={`${urlUserID}-${urlMemoryName}`}
      pageTitle={`Edit Permissions: ${memoryTitle}`}
      pageDescription="Configure visibility and permissions for your memory"
      rightContent={rightContent}
      visibility={rollUser}
      owner={permissionResult?.memoryMetadata?.createdBy}
      metaKeywords="memory permissions, edit access, create topics"
      error={permissionError}
      initialData={permissionResult}
      setInitialData={setPermissionResult}
      setUidChild={setUidChild}
      setTokenChild={setTokenChild}
      setUserEmailChild={setUserEmailChild}
    />
  );
};

export default EditMemoryPermissions;


















































/*const EditMemoryPermissions = () => {
  const router = useRouter();
  const { userID: urlUserID, memoryName: urlMemoryName } = router.query;

  // States
  const [visibility, setVisibility] = useState('private');
  const [invitedEmails, setInvitedEmails] = useState([]);
  const [uploadVisibility, setUploadVisibility] = useState('private');
  const [uploadInvitedEmails, setUploadInvitedEmails] = useState([]);
  const [editVisibility, setEditVisibility] = useState('private');
  const [editInvitedEmails, setEditInvitedEmails] = useState([]);
  const [memoryTitle, setMemoryTitle] = useState('Memory');
  const [isVisibilityModalOpen, setIsVisibilityModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploadingInformation, setIsUploadingInformation] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [permissionResult, setPermissionResult] = useState(null);
  const [permissionError, setPermissionError] = useState('');
  const [rollUser, setRollUSer] = useState('private');
  const [uidChild, setUidChild] = useState(null);
  const [tokenChild, setTokenChild] = useState(null);
  const [userEmailChild, setUserEmailChild] = useState(null);

  // Estado inicial para detectar cambios
  const initialStateRef = useRef({
    visibility: 'private',
    invitedEmails: [],
    uploadVisibility: 'private',
    uploadInvitedEmails: [],
    editVisibility: 'private',
    editInvitedEmails: [],
  });

  
 
  
  

  // Update states based on permissionResult
  useEffect(() => {
    console.log(permissionResult);
    if (permissionResult) {
      setRollUSer(permissionResult.requiredVisibility)
      setVisibility(permissionResult.accessInformation?.view.visibility || 'private');
      setInvitedEmails(permissionResult.accessInformation?.view?.invitedEmails || []);
      setUploadVisibility(permissionResult.accessInformation?.upload?.visibility || 'private');
      setUploadInvitedEmails(permissionResult.accessInformation?.upload?.invitedEmails || []);
      setEditVisibility(permissionResult.accessInformation?.edit?.visibility || 'private');
      setEditInvitedEmails(permissionResult.accessInformation?.edit?.invitedEmails || []);
      setMemoryTitle(permissionResult.memoryMetadata?.title || 'Memory');
      setPermissionError(permissionResult.accessInformation?.reason || '');
      initialStateRef.current = {
        visibility: permissionResult.accessInformation?.view.visibility || 'private',
        invitedEmails: permissionResult.accessInformation?.view?.invitedEmails || [],
        uploadVisibility: permissionResult.accessInformation?.upload?.visibility || 'private',
        uploadInvitedEmails: permissionResult.accessInformation?.upload?.invitedEmails || [],
        editVisibility: permissionResult.accessInformation?.edit?.visibility || 'private',
        editInvitedEmails: permissionResult.accessInformation?.edit?.invitedEmails || [],
      };
      setIsLoading(false);
    } else {
      setPermissionError('No permission data available');
      setIsLoading(false);
    }
  }, [permissionResult]);

  // Verificar si hay cambios
  const hasChanges = () => {
    return (
      visibility !== initialStateRef.current.visibility ||
      JSON.stringify(invitedEmails) !== JSON.stringify(initialStateRef.current.invitedEmails) ||
      uploadVisibility !== initialStateRef.current.uploadVisibility ||
      JSON.stringify(uploadInvitedEmails) !== JSON.stringify(initialStateRef.current.uploadInvitedEmails) ||
      editVisibility !== initialStateRef.current.editVisibility ||
      JSON.stringify(editInvitedEmails) !== JSON.stringify(initialStateRef.current.editInvitedEmails)
    );
  };

  // Guardar cambios
  const handleSave = async (e) => {
    e.preventDefault();
    setIsUploadingInformation(true);
    setError('');

    try {
      if (!urlUserID || !urlMemoryName) {
        throw new Error('Missing URL parameters');
      }

      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const response = await fetch('/api/mongoDb/queries/updateMemoryPermissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: urlUserID,
          memoryName: urlMemoryName,
          currentUser: userEmailChild,//userEmail,
          visibility,
          invitedEmails,
          fileUploadVisibility: uploadVisibility,
          fileUploadInvitedEmails: uploadInvitedEmails,
          editVisibility,
          editInvitedEmails,
          uid: uidChild,
          token: tokenChild,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        initialStateRef.current = { visibility, invitedEmails, uploadVisibility, uploadInvitedEmails, editVisibility, editInvitedEmails };
        setPermissionResult((prev) => ({
          ...prev,
          accessInformation: {
            ...prev.accessInformation,
            view: { visibility, invitedEmails },
            upload: { visibility: uploadVisibility, invitedEmails: uploadInvitedEmails },
            edit: { visibility: editVisibility, invitedEmails: editInvitedEmails },
          },
        }));
        // Update parent with new permission data
        setPermissionResult({
          ...permissionResult,
          accessInformation: {
            ...permissionResult.accessInformation,
            view: { visibility, invitedEmails },
            upload: { visibility: uploadVisibility, invitedEmails: uploadInvitedEmails },
            edit: { visibility: editVisibility, invitedEmails: editInvitedEmails },
          },
        });
      } else {
        throw new Error(data.message || 'Error updating permissions');
      }
    } catch (err) {
      toast.error(err.message);
      setError(err.message);
    } finally {
      setIsUploadingInformation(false);
    }
  };

  // Componente para sección de permiso
  const PermissionSection = ({ title, icon, type, count, onClick }) => {
    const getTypeText = () => {
      switch (type) {
        case 'private':
          return 'Only you';
        case 'public':
          return 'Everyone';
        case 'invitation':
          return `${count} users`;
        default:
          return '';
      }
    };

    const getDescription = () => {
      if (title === 'Memory Visibility') {
        switch (type) {
          case 'private':
            return 'Only visible to you';
          case 'public':
            return 'Visible to everyone';
          case 'invitation':
            return 'Specific users';
          default:
            return '';
        }
      }
      if (title === 'Upload Permissions') {
        switch (type) {
          case 'private':
            return 'Only you can upload';
          case 'public':
            return 'Everyone can upload';
          case 'invitation':
            return 'Specific users';
          default:
            return '';
        }
      }
      if (title === 'Edit Permissions') {
        switch (type) {
          case 'private':
            return 'Only you can edit';
          case 'public':
            return 'Everyone can edit';
          case 'invitation':
            return 'Specific users';
          default:
            return '';
        }
      }
      return '';
    };

    return (
      <section className="permission-card">
        <div className="section-header">
          <h2>{title}</h2>
        </div>
        <button type="button" className="permission-settings" onClick={onClick}>
          <div className="permission-icon">{icon}</div>
          <div className="permission-details">
            <h3>{getTypeText()}</h3>
            <p>{getDescription()}</p>
          </div>
        </button>
      </section>
    );
  };

  // Funciones auxiliares para iconos
  const getVisibilityIcon = (type) => {
    switch (type) {
      case 'private':
        return '🔒';
      case 'public':
        return '🌍';
      case 'invitation':
        return '📩';
      default:
        return '⚙️';
    }
  };

  const getUploadIcon = (type) => {
    switch (type) {
      case 'private':
        return '📤';
      case 'public':
        return '📥';
      case 'invitation':
        return '👥';
      default:
        return '📁';
    }
  };

  const getEditIcon = (type) => {
    switch (type) {
      case 'private':
        return '✏️';
      case 'public':
        return '📝';
      case 'invitation':
        return '👨‍💻';
      default:
        return '🛠️';
    }
  };

  // Contenido principal
  const rightContent = (
    <div className="permissions-editor">
      {isLoading ? (
        null
      ) : permissionError ? (
        <ErrorComponent
          errorMessage={permissionError}
          onRetry={() => {
            setPermissionError('');
            setIsLoading(true);
            setPermissionResult(null);
          }}
        />
      ) : (
        <>
          <div className="header-section">
            <h1 className="title">Edit Permissions: {memoryTitle}</h1>
          </div>
          <form className="permissions-form" onSubmit={handleSave}>
            {error && <div className="error-message">{error}</div>}
            <div className="permissions-grid">
              <PermissionSection
                title="Memory Visibility"
                icon={getVisibilityIcon(visibility)}
                type={visibility}
                count={invitedEmails.length}
                onClick={() => setIsVisibilityModalOpen(true)}
              />
              <PermissionSection
                title="Upload Permissions"
                icon={getUploadIcon(uploadVisibility)}
                type={uploadVisibility}
                count={uploadInvitedEmails.length}
                onClick={() => setIsUploadModalOpen(true)}
              />
              <PermissionSection
                title="Edit Permissions"
                icon={getEditIcon(editVisibility)}
                type={editVisibility}
                count={editInvitedEmails.length}
                onClick={() => setIsEditModalOpen(true)}
              />
            </div>
            {hasChanges() && (
              <div className="actions">
                <button
                  type="submit"
                  className="save-button"
                  disabled={isUploadingInformation}
                >
                  {isUploadingInformation ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </form>
        </>
      )}
      <VisibilityModal
        isOpen={isVisibilityModalOpen}
        onClose={() => setIsVisibilityModalOpen(false)}
        initialVisibility={visibility}
        initialInvitedEmails={invitedEmails}
        onSave={(vis, emails) => {
          setVisibility(vis);
          setInvitedEmails(emails);
        }}
      />
      <UploadPermissionsModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        initialUploadVisibility={uploadVisibility}
        initialUploadInvitedEmails={uploadInvitedEmails}
        onSave={(vis, emails) => {
          setUploadVisibility(vis);
          setUploadInvitedEmails(emails);
        }}
      />
      <EditPermissionsModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialEditVisibility={editVisibility}
        initialEditInvitedEmails={editInvitedEmails}
        onSave={(vis, emails) => {
          setEditVisibility(vis);
          setEditInvitedEmails(emails);
        }}
      />
    </div>
  );

  return (
    <GeneralMold
      key={`${urlUserID}-${urlMemoryName}`}
      pageTitle={`Edit Permissions: ${memoryTitle}`}
      pageDescription="Configure visibility and permissions for your memory"
      rightContent={rightContent}
      visibility={rollUser}
      owner={permissionResult?.memoryMetadata?.createdBy}
      metaKeywords="memory permissions, edit access"
      error={permissionError}
      initialData={permissionResult}
      setInitialData={setPermissionResult}
      setUidChild={setUidChild}
      setTokenChild={setTokenChild}
      setUserEmailChild={setUserEmailChild}
    />
  );
};

export default EditMemoryPermissions;*/
































































