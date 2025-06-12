import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import '../../../estilos/general/editTitleNameUser.css';
import '../../../app/globals.css';
import GeneralMold from '@/components/complex/generalMold';
import { auth } from '../../../../firebase';
import { toast } from 'react-toastify';
import ErrorComponent from '@/components/complex/error';

const EditMemoryMetadata = () => {
  const router = useRouter();
  const { userID, memoryName } = router.query;

  // States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [permissionResult, setPermissionResult] = useState(null);
  const [permissionError, setPermissionError] = useState('');
  const [rollUser, setRollUser] = useState('private');
  const [uidChild, setUidChild] = useState(null);
  const [tokenChild, setTokenChild] = useState(null);
  const [userEmailChild, setUserEmailChild] = useState(null);

  // Initial state for change detection
  const initialStateRef = useRef({
    title: '',
    description: '',
  });

  // Update states based on permissionResult
  useEffect(() => {
    console.log(permissionResult);
    
    if (permissionResult) {
      setRollUser(permissionResult.requiredVisibility);
      setTitle(permissionResult.memoryMetadata?.title || '');
      setDescription(permissionResult.memoryMetadata?.description || '');
      setPermissionError(permissionResult.accessInformation?.reason || '');
      initialStateRef.current = {
        title: permissionResult.memoryMetadata?.title || '',
        description: permissionResult.memoryMetadata?.description || '',
      };
      setIsLoading(false);
    } else {
      setPermissionError('No permission data available');
      setIsLoading(false);
    }
  }, [permissionResult]);

  // Check for changes
  const hasChanges = () => {
    return (
      title !== initialStateRef.current.title ||
      description !== initialStateRef.current.description
    );
  };

  // Handle save
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      setIsSaving(false);
      return;
    }

    try {
      if (!userID || !memoryName) {
        throw new Error('Missing URL parameters');
      }

      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const response = await fetch('/api/mongoDb/queries/updateTitleNameMemoryUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userID,
          memoryName: memoryName,
          currentUser: userEmailChild,
          title: title.trim(),
          description: description.trim(),
          uid: uidChild,
          token: tokenChild,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        initialStateRef.current = { title: title.trim(), description: description.trim() };
        setPermissionResult((prev) => ({
          ...prev,
          memoryMetadata: {
            ...prev.memoryMetadata,
            title: title.trim(),
            description: description.trim(),
            lastUpdated: new Date().toISOString(),
          },
        }));
      } else {
        throw new Error(data.message || 'Error updating metadata');
      }
    } catch (err) {
      toast.error(err.message);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Main content
  const rightContent = (
    <div className="metadata-editor">
      {isLoading ? (
        null
      ) : (
        <>
          <div className="header-section">
            <h1 className="title">Edit Memory Metadata: {title}</h1>
          </div>
          <form className="metadata-form" onSubmit={handleSave}>
            {error && <div className="error-message">{error}</div>}
            <div className="form-group">
              <label htmlFor="memory-title" className="form-label">
                Memory Title <span className="required">(Required)</span>
              </label>
              <input
                id="memory-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter memory title"
                className="text-input"
                required
                aria-required="true"
              />
            </div>
            <div className="form-group">
              <label htmlFor="memory-description" className="form-label">
                Description (Optional)
              </label>
              <textarea
                id="memory-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter memory description"
                className="text-input textarea"
                rows="4"
              />
            </div>
            {hasChanges() && (
              <div className="actions">
                <button
                  type="submit"
                  className="button2"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </form>
        </>
      )}
    </div>
  );

  return (
    <GeneralMold
      key={`${userID}-${memoryName}`}
      pageTitle={`Edit Metadata: ${title}`}
      pageDescription="Configure title and description for your memory"
      rightContent={rightContent}
      visibility={rollUser}
      owner={permissionResult?.memoryMetadata?.createdBy}
      metaKeywords="memory metadata, edit title, edit description"
      error={permissionError}
      initialData={permissionResult}
      setInitialData={setPermissionResult}
      setUidChild={setUidChild}
      setTokenChild={setTokenChild}
      setUserEmailChild={setUserEmailChild}
    />
  );
};

export default EditMemoryMetadata;