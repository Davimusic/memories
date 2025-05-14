import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Menu from '@/components/complex/menu';
import MenuIcon from '@/components/complex/menuIcon';
import '../estilos/general/createNewMemory.css';
import '../estilos/general/general.css';
import '../app/globals.css';
import Modal from '@/components/complex/modal';
import MemoryLogo from '@/components/complex/memoryLogo';

// Componente para el modal de visibilidad
const VisibilityModal = ({
  isOpen,
  onClose,
  initialVisibility,
  initialInvitedEmails,
  onSave
}) => {
  const [tempVisibility, setTempVisibility] = useState(initialVisibility);
  const [tempInvitedEmails, setTempInvitedEmails] = useState(initialInvitedEmails);
  const [tempEmailInput, setTempEmailInput] = useState('');
  const [modalError, setModalError] = useState('');

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
        <h3>Configure Memory Visibility</h3>
        
        <div className="privacy-options">
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

        {modalError && <div className="error-message">{modalError}</div>}

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

// Componente para el modal de permisos de subida
const UploadPermissionsModal = ({
  isOpen,
  onClose,
  initialUploadVisibility,
  initialUploadInvitedEmails,
  onSave
}) => {
  const [tempUploadVisibility, setTempUploadVisibility] = useState(initialUploadVisibility);
  const [tempUploadInvitedEmails, setTempUploadInvitedEmails] = useState(initialUploadInvitedEmails);
  const [tempUploadEmailInput, setTempUploadEmailInput] = useState('');
  const [modalError, setModalError] = useState('');

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
        <h3>Configure Upload Permissions</h3>
        
        <div className="privacy-options">
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

        {modalError && <div className="error-message">{modalError}</div>}

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

// Componente para el modal de permisos de edición
const EditPermissionsModal = ({
  isOpen,
  onClose,
  initialEditVisibility,
  initialEditInvitedEmails,
  onSave
}) => {
  const [tempEditVisibility, setTempEditVisibility] = useState(initialEditVisibility);
  const [tempEditInvitedEmails, setTempEditInvitedEmails] = useState(initialEditInvitedEmails);
  const [tempEditEmailInput, setTempEditEmailInput] = useState('');
  const [modalError, setModalError] = useState('');

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
        <h3>Configure Edit Permissions</h3>
        
        <div className="privacy-options">
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

        {modalError && <div className="error-message">{modalError}</div>}

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

// Componente principal EditMemoryPermissions
const EditMemoryPermissions = () => {
  const router = useRouter();
  const { memoryId } = router.query;

  const [memoryTitle, setMemoryTitle] = useState('');
  const [description, setDescription] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  
  const [visibility, setVisibility] = useState('private');
  const [invitedEmails, setInvitedEmails] = useState([]);
  const [uploadVisibility, setUploadVisibility] = useState('private');
  const [uploadInvitedEmails, setUploadInvitedEmails] = useState([]);
  const [editVisibility, setEditVisibility] = useState('private');
  const [editInvitedEmails, setEditInvitedEmails] = useState([]);

  const [isVisibilityModalOpen, setIsVisibilityModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const fetchMemoryData = async () => {
      if (!memoryId) return;
      
      try {
        setIsLoading(true);
        const response = await fetch(`/api/mongoDb/getMemory/${memoryId}`);
        const data = await response.json();
        
        if (data.success) {
          setMemoryTitle(data.memory.title);
          setDescription(data.memory.description);
          setVisibility(data.memory.visibility);
          setInvitedEmails(data.memory.invitedEmails || []);
          setUploadVisibility(data.memory.fileUploadVisibility);
          setUploadInvitedEmails(data.memory.fileUploadInvitedEmails || []);
          setEditVisibility(data.memory.editVisibility);
          setEditInvitedEmails(data.memory.editInvitedEmails || []);
        } else {
          setError(data.message || 'Failed to load memory data');
        }
      } catch (error) {
        console.error('Error loading memory:', error);
        setError('Error loading memory data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMemoryData();
  }, [memoryId]);

  useEffect(() => {
    const verifyPermissions = async () => {
      const email = localStorage.getItem('userEmail');
      if (!email) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch('/api/mongoDb/verifyEditPermissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memoryId,
            userEmail: email
          })
        });

        const data = await response.json();
        if (!data.hasPermission) {
          setAlertMessage('You do not have permission to edit this memory');
          setTimeout(() => router.push('/memories'), 3000);
        }
      } catch (error) {
        console.error('Permission verification error:', error);
        setError('Error verifying permissions');
      }
    };

    if (memoryId) verifyPermissions();
  }, [memoryId]);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/mongoDb/updateMemory/${memoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: memoryTitle,
          description,
          visibility,
          invitedEmails,
          fileUploadVisibility: uploadVisibility,
          fileUploadInvitedEmails: uploadInvitedEmails,
          editVisibility,
          editInvitedEmails
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update memory');

      router.push(`/memories/${memoryId}`);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenMenu = () => setIsMenuOpen(true);
  const handleCloseMenu = () => setIsMenuOpen(false);

  if (alertMessage) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
      }}>
        <div className="loading">
          <p className="color1">{alertMessage}</p>
          <MemoryLogo size={200} />
        </div>
      </div>
    );
  }

  return (
    <div className="fullscreen-floating mainFont backgroundColor1 mainFont color2">
      <Menu
        isOpen={isMenuOpen}
        onClose={handleCloseMenu}
        className="backgroundColor1"
      />

      <div className="file-uploader">
        <div style={{ display: 'flex' }}>
          <div className="menu-icon-container">
            <MenuIcon onClick={handleOpenMenu} style={{ zIndex: 10 }} />
          </div>
          <h2 className="title">Edit Memory Permissions</h2>
        </div>

        <div className="uploader-content">
          <div className="form-column">
            <form className="memory-form" onSubmit={handleSave}>
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

              {error && <div className="error-message">{error}</div>}

              <div className="actions">
                <button 
                  type="submit" 
                  className="submit-btn" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          <div className="files-column">
            <div className="file-section-container">
              <div className="section-header">
                <h4>Memory Visibility</h4>
              </div>
              
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

            <div className="file-section-container">
              <div className="section-header">
                <h4>Upload Permissions</h4>
              </div>
              
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

            <div className="file-section-container">
              <div className="section-header">
                <h4>Edit Permissions</h4>
              </div>
              
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
};

export default EditMemoryPermissions;