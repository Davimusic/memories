import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Menu from '@/components/complex/menu';
import MenuIcon from '@/components/complex/menuIcon';
import '../../../estilos/general/createNewMemory.css';
import '../../../estilos/general/general.css';
import '../../../estilos/general/api/edit/editAccessibility.css';
import '../../../app/globals.css';
import Modal from '@/components/complex/modal';
import LoadingMemories from '@/components/complex/loading';
import { auth } from '../../../../firebase';
import ErrorComponent from '@/components/complex/error';
import { toast } from 'react-toastify';
import Head from 'next/head';











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
        <h2>Configure Memory Visibility</h2>
        
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
                      className="submitButton" 
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
                            setTempInvitedEmails(
                              tempInvitedEmails.filter((_, i) => i !== index)
                            );
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

        <div style={{display: 'flex', gap: '10px', boxSizing: 'border-box'}}>
          <button 
            className="submitButton" 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            type="button"
          >
            Cancel
          </button>
          <button className="submitButton" onClick={handleSave} type="button">
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
        <h1 className="visually-hidden centrar-horizontal">Upload Permissions Settings</h1>
        <h2>Configure Upload Permissions</h2>
        
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
                      className="submitButton" 
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
                            setTempUploadInvitedEmails(
                              tempUploadInvitedEmails.filter((_, i) => i !== index)
                            );
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

        <div style={{display: 'flex', gap: '10px', boxSizing: 'border-box'}}>
          <button 
            className="submitButton" 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            type="button"
          >
            Cancel
          </button>
          <button className="submitButton" onClick={handleSave} type="button">
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

  const notifyFail = (message) => toast.error(message);

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleTempEditAddEmail = (e) => {
    e.stopPropagation();
    if (!validateEmail(tempEditEmailInput)) {
      notifyFail('Please enter a valid email address');
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
        <h2>Configure Edit Permissions</h2>
        
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
                      className="submitButton" 
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
                            setTempEditInvitedEmails(
                              tempEditInvitedEmails.filter((_, i) => i !== index)
                            );
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

        <div style={{display: 'flex', gap: '10px', boxSizing: 'border-box'}}>
          <button 
            className="submitButton" 
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            type="button"
          >
            Cancel
          </button>
          <button className="submitButton" onClick={handleSave} type="button">
            Save Changes
          </button>
        </div>
      </div>
    </Modal>
  );
};

// Main Component
const EditMemoryPermissions = ({ initialData, initialError }) => {
  const router = useRouter();
  const { userID, memoryName } = router.query;

  const notifySuccess = (message) => toast.success(message);
  const notifyFail = (message) => toast.error(message);

  const [userEmail, setUserEmail] = useState(null);
  const [isLoading, setIsLoading] = useState(!initialData && !initialError);
  const [isUploadingInformation, setIsUploadingInformation] = useState(false);
  const [error, setError] = useState(initialError || '');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [permissionResult, setPermissionResult] = useState(initialData || null);

  const [visibility, setVisibility] = useState(initialData?.accessInformation?.view?.visibility || 'private');
  const [invitedEmails, setInvitedEmails] = useState(initialData?.accessInformation?.view?.invitedEmails || []);
  const [uploadVisibility, setUploadVisibility] = useState(initialData?.accessInformation?.upload?.visibility || 'private');
  const [uploadInvitedEmails, setUploadInvitedEmails] = useState(initialData?.accessInformation?.upload?.invitedEmails || []);
  const [editVisibility, setEditVisibility] = useState(initialData?.accessInformation?.edit?.visibility || 'private');
  const [editInvitedEmails, setEditInvitedEmails] = useState(initialData?.accessInformation?.edit?.invitedEmails || []);
  const [memoryTitle, setMemoryTitle] = useState(initialData?.memoryMetadata?.title || 'Memory');
  const [uid, setUid] = useState(null);
  const [token, setToken] = useState(null);

  const [isVisibilityModalOpen, setIsVisibilityModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Authentication check
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUid(user.uid);
        try {
          const token = await user.getIdToken();
          setToken(token);
        } catch (error) {
          console.error("Error getting token:", error);
          setError('Failed to authenticate user');
        }
        const email = user.email || user.providerData?.[0]?.email;
        setUserEmail(email);
      } else {
        const path = window.location.pathname;
        localStorage.setItem("redirectPath", path);
        localStorage.setItem("reason", "userEmailValidationOnly");
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Fetch permission data if not provided by SSR
  useEffect(() => {
    const fetchPermissionData = async () => {
      if (!userID || !memoryName || !uid || !userEmail || !token) {
        setError('Missing required parameters');
        setIsLoading(false);
        return;
      }

      if (initialData) {
        setPermissionResult(initialData);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/mongoDb/queries/checkMemoryPermissionFromClient', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userID,
            memoryName,
            type: 'editPermissions',
            uid,
            token,
            userEmail
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setPermissionResult(data);

        if (!data.accessAllowed) {
          setIsLoading(false);
          setError('You do not have permission to edit access to this memory');
          return;
        }

        // Update state with accessInformation
        const accessInfo = data.accessInformation || {};
        setVisibility(accessInfo.view?.visibility || 'private');
        setInvitedEmails(accessInfo.view?.invitedEmails || []);
        setUploadVisibility(accessInfo.upload?.visibility || 'private');
        setUploadInvitedEmails(accessInfo.upload?.invitedEmails || []);
        setEditVisibility(accessInfo.edit?.visibility || 'private');
        setEditInvitedEmails(accessInfo.edit?.invitedEmails || []);
        setMemoryTitle(data.memoryMetadata?.title || 'Memory');
        setIsLoading(false);
      } catch (err) {
        console.error('Fetch error:', err.message);
        setError(err.message);
        setIsLoading(false);
      }
    };

    if (uid && userEmail && token && !initialData) {
      fetchPermissionData();
    }
  }, [userID, memoryName, uid, userEmail, token, initialData]);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsUploadingInformation(true);
    setError('');

    try {
      const response = await fetch('/api/mongoDb/queries/updateMemoryPermissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userID,
          memoryName,
          currentUser: userEmail.replace(/[@.]/g, '_'),
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

      const data = await response.json();
      
      if (response.ok) {
        notifySuccess(data.message);
      } else {
        throw new Error(data.message || 'Failed to update permissions');
      }
    } catch (error) {
      notifyFail(error.message);
      setError(error.message);
    } finally {
      setIsUploadingInformation(false);
    }
  };

  const handleOpenMenu = () => setIsMenuOpen(true);
  const handleCloseMenu = () => setIsMenuOpen(false);

  if (isLoading) {
    return (
      <div className="fullscreen-floating mainFont backgroundColor1 color2">
        <Head>
          <title>Loading... | Memory Permissions</title>
          <meta name="description" content="Loading memory permission settings" />
        </Head>
        <div className="loading">
          <LoadingMemories/>
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorComponent error={error}/>;
  }

  // Structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `Edit Permissions: ${memoryTitle}`,
    description: `Configure visibility and permissions for ${memoryTitle} in the Memory App`,
    url: `https://yourdomain.com/editAccessibility/${userID}/${encodeURIComponent(memoryName)}`, // Replace with your domain
  };

  return (
    <div className="fullscreen-floating mainFont backgroundColor1 mainFont color2">
      <Head>
        <title>{`Edit Permissions: ${memoryTitle} | Memory App`}</title>
        <meta name="description" content={`Configure visibility and permissions for ${memoryTitle}`} />
        <meta name="keywords" content={`memory permissions, ${memoryTitle}, memory app, edit access`} />
        <meta property="og:title" content={`Edit Permissions: ${memoryTitle}`} />
        <meta property="og:description" content={`Configure visibility and permissions for ${memoryTitle}`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://yourdomain.com/editAccessibility/${userID}/${encodeURIComponent(memoryName)}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`Edit Permissions: ${memoryTitle}`} />
        <meta name="twitter:description" content={`Configure visibility and permissions for ${memoryTitle}`} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </Head>

      <Menu
        isOpen={isMenuOpen}
        onClose={handleCloseMenu}
        className="backgroundColor1"
      />

      <div className="file-uploader">
        <div style={{ display: 'flex' }}>
          <div className="menu-icon-container">
            <MenuIcon onClick={handleOpenMenu} style={{ zIndex: 10 }} aria-label="Open menu" />
          </div>
          <h1 className="title">Edit Permissions: {memoryTitle}</h1>
        </div>
        
        <div className='centered'> 
          <div className="uploader-content">
            <div className="files-column">
              <section className="file-section-container" aria-labelledby="visibility-section">
                <div className="section-header">
                  <h2 id="visibility-section">Memory Visibility</h2>
                </div>
                
                <button 
                  className="selected-settings" 
                  onClick={() => setIsVisibilityModalOpen(true)}
                  aria-expanded={isVisibilityModalOpen}
                  aria-controls="visibility-modal"
                >
                  {visibility === 'private' && (
                    <div className="privacy-option active">
                      <div className="privacy-icon" aria-hidden="true">🔒</div>
                      <div className="privacy-details">
                        <h3>Private</h3>
                        <p>Only visible to you</p>
                      </div>
                    </div>
                  )}
                  
                  {visibility === 'public' && (
                    <div className="privacy-option active">
                      <div className="privacy-icon" aria-hidden="true">🌍</div>
                      <div className="privacy-details">
                        <h3>Public</h3>
                        <p>Visible to everyone</p>
                      </div>
                    </div>
                  )}
                  
                  {visibility === 'invitation' && (
                    <div className="privacy-option active">
                      <div className="privacy-icon" aria-hidden="true">📩</div>
                      <div className="privacy-details">
                        <h3>By Invitation</h3>
                        <p>{invitedEmails.length} invited users</p>
                      </div>
                    </div>
                  )}
                </button>
              </section>

              <section className="file-section-container" aria-labelledby="upload-section">
                <div className="section-header">
                  <h2 id="upload-section">Upload Permissions</h2>
                </div>
                
                <button 
                  className="selected-settings" 
                  onClick={() => setIsUploadModalOpen(true)}
                  aria-expanded={isUploadModalOpen}
                  aria-controls="upload-modal"
                >
                  {uploadVisibility === 'private' && (
                    <div className="privacy-option active">
                      <div className="privacy-icon" aria-hidden="true">🔒</div>
                      <div className="privacy-details">
                        <h3>Private</h3>
                        <p>Only you can upload</p>
                      </div>
                    </div>
                  )}
                  
                  {uploadVisibility === 'public' && (
                    <div className="privacy-option active">
                      <div className="privacy-icon" aria-hidden="true">🌍</div>
                      <div className="privacy-details">
                        <h3>Public</h3>
                        <p>Everyone can upload</p>
                      </div>
                    </div>
                  )}
                  
                  {uploadVisibility === 'invitation' && (
                    <div className="privacy-option active">
                      <div className="privacy-icon" aria-hidden="true">📩</div>
                      <div className="privacy-details">
                        <h3>By Invitation</h3>
                        <p>{uploadInvitedEmails.length} users can upload</p>
                      </div>
                    </div>
                  )}
                </button>
              </section>

              <section className="file-section-container" aria-labelledby="edit-section">
                <div className="section-header">
                  <h2 id="edit-section">Edit Permissions</h2>
                </div>
                
                <button 
                  className="selected-settings" 
                  onClick={() => setIsEditModalOpen(true)}
                  aria-expanded={isEditModalOpen}
                  aria-controls="edit-modal"
                >
                  {editVisibility === 'private' && (
                    <div className="privacy-option active">
                      <div className="privacy-icon" aria-hidden="true">🔒</div>
                      <div className="privacy-details">
                        <h3>Private</h3>
                        <p>Only you can edit</p>
                      </div>
                    </div>
                  )}
                  
                  {editVisibility === 'public' && (
                    <div className="privacy-option active">
                      <div className="privacy-icon" aria-hidden="true">🌍</div>
                      <div className="privacy-details">
                        <h3>Public</h3>
                        <p>Everyone can edit</p>
                      </div>
                    </div>
                  )}
                  
                  {editVisibility === 'invitation' && (
                    <div className="privacy-option active">
                      <div className="privacy-icon" aria-hidden="true">📩</div>
                      <div className="privacy-details">
                        <h3>By Invitation</h3>
                        <p>{editInvitedEmails.length} users can edit</p>
                      </div>
                    </div>
                  )}
                </button>
              </section>
            </div>
          </div>
        </div>
        <form className="memory-form" onSubmit={handleSave}>
          {error && <div className="error-message" role="alert">{error}</div>}

          <div className="actions">
            <button 
              type="submit" 
              className="submit-btn" 
              disabled={isUploadingInformation}
              aria-busy={isUploadingInformation}
            >
              {isUploadingInformation ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
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


































/*/ Server-Side Rendering
export async function getServerSideProps(context) {
  const { req, params } = context;
  const { userID, memoryName } = params;

  try {
    // Extract ID token from Authorization header or cookie
    let idToken = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split('Bearer ')[1]
      : req.cookies.idToken; // Adjust cookie name as needed

    if (!idToken) {
      return {
        redirect: {
          destination: '/login',
          permanent: false,
        },
      };
    }

    // Verify ID token with Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const userEmail = decodedToken.email;

    // Fetch permission data from API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mongoDb/queries/checkMemoryPermissionFromClient`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userID,
        memoryName,
        type: 'editPermissions',
        uid,
        token: idToken,
        userEmail
      }),
    });

    if (!response.ok) {
      return {
        props: {
          initialError: `Error ${response.status}: ${await response.text()}`,
        },
      };
    }

    const data = await response.json();
    if (data.success && data.accessAllowed) {
      return {
        props: {
          initialData: {
            accessInformation: data.accessInformation || {},
            memoryMetadata: data.memoryMetadata || {},
            accessAllowed: data.accessAllowed,
          },
        },
      };
    } else {
      return {
        props: {
          initialError: 'You do not have permission to edit access to this memory',
        },
      };
    }
  } catch (error) {
    console.error('SSR Error:', error.message);
    return {
      props: {
        initialError: 'Server error occurred',
      },
    };
  }
}*/

export default EditMemoryPermissions;

// Add this to your global CSS
<style jsx global>{`
  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
`}</style>









































