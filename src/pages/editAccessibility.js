import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Menu from '@/components/complex/menu';
import MenuIcon from '@/components/complex/menuIcon';
import styles from'../estilos/general/createNewMemory.css';
import '../estilos/general/general.css';
import '../app/globals.css';
























const EditMemoryPermissions = () => {
  const router = useRouter();
  const { userID, memoryName } = router.query; // Get userID and memoryName from URL query params
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [visibility, setVisibility] = useState('');
  const [invitedEmails, setInvitedEmails] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [userEmail, setUserEmail] = useState(null);

  // Authentication check
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        console.log(user);
        
        const email = user.email;
        console.log('Correo del usuario:', email);
        setUserEmail(email);
      } else {
        console.log('No hay usuario autenticado');
        setUserEmail(null);
        const path = window.location.pathname;
        localStorage.setItem('redirectPath', path);
        localStorage.setItem('reason', 'userEmailValidationOnly');
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  /*/ Fetch permission data
  useEffect(() => {
    const fetchPermissionData = async () => {
      if (!userID || !memoryName || !userEmail) {
        setError('Missing userID, memoryName, or userEmail');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/mongoDb/queries/checkMemoryPermissionFromClient', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userID,// || '72be666c9b590aa5dca47241aab57521ac992478fb6f484123d8a6dcd6399c0a',
            memoryName: memoryName,// || 'test',
            currentUser: transformEmail(userEmail),// || 'testwebmemories_gmail_com'),
            type: 'editPermissions',
            //uid: 
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Permission Check Response:', data);
        setResponse(data);
        setVisibility(data.requiredVisibility || 'private');
        setInvitedEmails(data.invitedEmails || []);
        setLoading(false);
      } catch (err) {
        console.error('Fetch error:', err.message);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchPermissionData();
  }, [userID, memoryName, userEmail]);*/

  const transformEmail = (email) => email.replace(/[@.]/g, '_');

  const handleVisibilityChange = (e) => {
    setVisibility(e.target.value);
  };

  const handleAddEmail = () => {
    if (newEmail && !invitedEmails.includes(newEmail)) {
      setInvitedEmails([...invitedEmails, newEmail]);
      setNewEmail('');
    }
  };

  const handleRemoveEmail = (email) => {
    setInvitedEmails(invitedEmails.filter((e) => e !== email));
  };

  const handleSubmit = async () => {
    try {
      const updateResponse = await fetch('/api/mongoDb/queries/updateMemoryPermissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userID || '72be666c9b590aa5dca47241aab57521ac992478fb6f484123d8a6dcd6399c0a',
          memoryName: memoryName || 'test',
          currentUser: transformEmail(userEmail || 'testwebmemories_gmail_com'),
          visibility,
          invitedEmails,
        }),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update permissions');
      }

      const updateData = await updateResponse.json();
      console.log('Update Permissions Response:', updateData);
      setConfirmationModalOpen(false);
      alert('Permissions updated successfully!');
    } catch (err) {
      console.error('Update error:', err.message);
      setError(err.message);
      setConfirmationModalOpen(false);
    }
  };

  

  if (error) {
    return (
      <div className="fullscreen-floating mainFont backgroundColor1 color2">
        <div className="error-message">
          <p className="color2 title">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fullscreen-floating mainFont backgroundColor1 color2">
      <Menu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <div className="file-uploader">
        <div className="header-container">
          <div style={{ width: '40px' }}>
            <MenuIcon onClick={() => setIsMenuOpen(!isMenuOpen)} />
          </div>
          <div className="title-container">
            <h2 className="title">
              Edit Permissions: {response?.memoryMetadata?.title || 'Memory'}
            </h2>
          </div>
        </div>

        <div className="cleaner-content">
          <div style={{ display: 'flex' }}>
            <p className="color2" style={{ paddingRight: '10px', paddingBottom: '10px' }}>
              Status: {response?.requiredVisibility}
            </p>
            <span className="roll-badge">
              {response?.accessAllowed ? 'Authorized' : 'Unauthorized'}
            </span>
          </div>

          <div className="files-column">
            <div className="files-group">
              <h3 className="color1" style={{ paddingBottom: '10px' }}>
                Permission Settings
              </h3>
              <div className="file-section-container">
                <div className="section-header">
                  <h3>Access Details</h3>
                </div>
                <div className="section-content">
                  <p>
                    <span className="color2">Access Allowed:</span>{' '}
                    {response?.accessAllowed ? 'Yes' : 'No'}
                  </p>
                  <p>
                    <span className="color2">Owner:</span> {response?.owner}
                  </p>
                  <p>
                    <span className="color2">Current User:</span> {response?.currentUser}
                  </p>
                </div>
              </div>

              {response?.accessAllowed ? (
                <div className="file-section-container">
                  <div className="section-header">
                    <h3>Edit Permissions</h3>
                  </div>
                  <div className="section-content">
                    <label>
                      <span className="color2">Visibility:</span>
                      <select
                        value={visibility}
                        onChange={handleVisibilityChange}
                        className="color1"
                        style={{ padding: '5px', width: '100%', marginTop: '10px' }}
                      >
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                        <option value="invitation">Invitation</option>
                      </select>
                    </label>
                    <div style={{ marginTop: '20px' }}>
                      <span className="color2">Invited Emails:</span>
                      {invitedEmails.length > 0 ? (
                        <ul>
                          {invitedEmails.map((email, index) => (
                            <li key={index} className="color1">
                              {email}{' '}
                              <button
                                type="button"
                                onClick={() => handleRemoveEmail(email)}
                                className="submitButton delete"
                                style={{ marginLeft: '10px' }}
                              >
                                Remove
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="color1">None</p>
                      )}
                      <div style={{ display: 'flex', marginTop: '10px' }}>
                        <input
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="Add email"
                          className="color1"
                          style={{ padding: '5px', marginRight: '10px', flex: 1 }}
                        />
                        <button
                          type="button"
                          onClick={handleAddEmail}
                          className="submitButton"
                        >
                          Add Email
                        </button>
                      </div>
                    </div>
                    <button
                      className="submitButton"
                      onClick={() => setConfirmationModalOpen(true)}
                      style={{ marginTop: '20px' }}
                    >
                      Save Permissions
                    </button>
                  </div>
                </div>
              ) : (
                <p className="error-message">
                  You do not have permission to edit roles for this memory.
                </p>
              )}
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
        </div>
      </div>

      <Modal isOpen={confirmationModalOpen} onClose={() => setConfirmationModalOpen(false)}>
        <div className="danger-modal">
          <h3>⚠️ Save Permission Changes</h3>
          <p>Are you sure you want to update the permissions for this memory?</p>
          <div style={{ display: 'flex', justifyContent: 'space-around', paddingTop: '10px' }}>
            <button
              className="submitButton"
              onClick={() => setConfirmationModalOpen(false)}
            >
              Cancel
            </button>
            <button className="submitButton delete" onClick={handleSubmit}>
              Confirm
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EditMemoryPermissions;