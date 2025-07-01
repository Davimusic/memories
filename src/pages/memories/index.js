'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import '../../app/globals.css';
import '../../estilos/general/memoriesIndex.css';
import MemoryLogo from '@/components/complex/memoryLogo';
import ShowHide from '@/components/complex/showHide';
import UploadIcon from '@/components/complex/icons/uploadIcon';
import EditToggleIcon from '@/components/complex/EditToggleIcon ';
import Head from 'next/head';
import ErrorComponent from '@/components/complex/error';
import { auth } from '../../../firebase';
import { toast } from 'react-toastify';
import LoadingMemories from '@/components/complex/loading';
import GeneralMold from '@/components/complex/generalMold';
import Modal from '@/components/complex/modal';
import EditPermissionsIcon from '@/components/complex/icons/editPermissionsIcon';

export default function MemoriesIndex({ initialMemories, userInfo, error: initialError }) {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState(null);
  const [uid, setUid] = useState(null);
  const [token, setToken] = useState(null);
  const [memoriesState, setMemoriesState] = useState(initialMemories || {});
  const [loading, setLoading] = useState(!initialMemories && !initialError);
  const [error, setError] = useState(initialError || null);
  const [sortType, setSortType] = useState('alphabetical');
  const [filteredMemories, setFilteredMemories] = useState([]);
  const [userID, setUserID] = useState(userInfo?.userInfoId || '');
  const [userInformation, setUserInformation] = useState(userInfo?.userInformation || {});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialData, setInitialData] = useState();
  const [selectedMemory, setSelectedMemory] = useState(null);

  const notifySuccess = (message) => toast.success(message);
  const notifyFail = (message) => toast.error(message);

  // Helper function to count media types across all topics
  const countMediaTypes = (topics) => {
    const mediaCounts = {
      photos: 0,
      videos: 0,
      audios: 0,
      texts: 0,
    };

    if (!topics || typeof topics !== 'object') return mediaCounts;

    Object.values(topics).forEach((topic) => {
      mediaCounts.photos += topic.photos?.length || 0;
      mediaCounts.videos += topic.videos?.length || 0;
      mediaCounts.audios += topic.audios?.length || 0;
      mediaCounts.texts += topic.texts?.length || 0;
    });

    return mediaCounts;
  };

  // Efecto para verificar autenticación
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUid(user.uid);
        try {
          const idToken = await user.getIdToken();
          setToken(idToken);
          const email = user.email || user.providerData?.[0]?.email;
          setUserEmail(email);
        } catch (error) {
          console.error('Error getting token:', error);
          setError('Failed to authenticate user');
          setLoading(false);
        }
      } else {
        notifyFail('Please log in before continuing...');
        const path = window.location.pathname;
        localStorage.setItem('redirectPath', path);
        localStorage.setItem('reason', 'userEmailValidationOnly');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Efecto para obtener memorias
  useEffect(() => {
    const fetchMemories = async () => {
      if (!userEmail || !uid || !token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/mongoDb/getAllReferencesUser', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userEmail, uid, token }),
        });

        if (!response.ok) {
          if (response.status === 404) {
            setMemoriesState({});
            setUserID('');
            setLoading(false);
            setError('No memories found');
            return;
          }
          const errorInfo = await response.json().catch(() => ({}));
          const errorMessage = errorInfo.message || 'Network response error';
          throw new Error(`Error ${response.status}: ${errorMessage}`);
        }

        const data = await response.json();
        if (data.success) {
          setUserID(data.userInfoId);
          console.log(data.userInfoId);
          
          const { userInformation, dynamicMemories, lastUpdated, ...actualMemories } = data.memories;
          setUserInformation(data.memories.userInformation);
          console.log(data.memories.userInformation);
          
          console.log(actualMemories);
          setMemoriesState(actualMemories);
        } else {
          throw new Error('Error fetching memories');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (userEmail && uid && token) {
      fetchMemories();
    }
  }, [userEmail, uid, token]);

  // Efecto para ordenar memorias
  useEffect(() => {
    console.log(memoriesState);
    
    const entries = Object.entries(memoriesState);
    let sortedEntries = entries;

    if (sortType === 'alphabetical') {
      sortedEntries = entries.sort((a, b) => a[0].localeCompare(b[0]));
    } else if (sortType === 'creationDate') {
      sortedEntries = entries.sort((a, b) => {
        const dateA = new Date(a[1]?.metadata?.createdAt || 0);
        const dateB = new Date(b[1]?.metadata?.createdAt || 0);
        return dateA - dateB;
      });
    } else if (sortType === 'lastModified') {
      sortedEntries = entries.sort((a, b) => {
        const dateA = new Date(a[1]?.metadata?.lastUpdated || 0);
        const dateB = new Date(b[1]?.metadata?.lastUpdated || 0);
        return dateB - dateA;
      });
    }
    setFilteredMemories(sortedEntries);
  }, [memoriesState, sortType]);

  const handleCreateMemory = () => {
    if (!userEmail || !uid || !token) {
      const path = window.location.pathname;
      localStorage.setItem('redirectPath', path);
      localStorage.setItem('reason', 'createNewUser');
      router.push('/login');
      return;
    }
    router.push('/createNewMemory');
  };

  const handleSortChange = (e) => {
    setSortType(e.target.value);
  };

  const openActionsModal = (memoryTitle, details) => {
    setSelectedMemory({ memoryTitle, details });
    setIsModalOpen(true);
  };

  const closeActionsModal = () => {
    setIsModalOpen(false);
    setSelectedMemory(null);
  };

  const handleAction = (path) => {
    if (selectedMemory) {
      router.push(path);
      closeActionsModal();
    }
  };

  // Contenido para el panel izquierdo
  const leftContent = loading ? (
    <LoadingMemories />
  ) : error ? (
    <ErrorComponent error={error} />
  ) : (
    <section className="memories-section" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
      <h1 className="visually-hidden">Your Memories</h1>
      <button
        className={`button2 rounded p-2 ${filteredMemories.length === 0 ? 'backgroundColor2' : ''}`}
        onClick={handleCreateMemory}
        aria-label="Create new memory"
      >
        New Memory
      </button>
      
      <div className="flex-column">
        {filteredMemories.length > 0 && (
          <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', paddingBottom: '20px' }}>
            <label htmlFor="sort" className="visually-hidden">Sort memories by</label>
            <select
              style={{ maxHeight: '40px' }}
              id="sort"
              className="rounded p-2 border sort-select"
              value={sortType}
              onChange={handleSortChange}
              aria-label="Sort memories"
            >
              <option value="alphabetical">Name</option>
              <option value="creationDate">Creation Date</option>
              <option value="lastModified">Last Modified</option>
            </select>
          </div>
        )}
      </div>

      <div className='scrollTable'>
        {filteredMemories.length === 0 ? (
          <div className="centrar-completo flex-column no-memories" role="status">
            <MemoryLogo />
            <p className="title-md">No memories found. Click "New Memory" to create a new one</p>
          </div>
        ) : (
          <div className="memories-table-container" role="region" aria-labelledby="memories-table">
            {/* Encabezados de tabla solo visibles en desktop/tablet */}
            <div className="table-header desktop-only" role="rowgroup">
              <div className="header-cell actions-header" role="columnheader">Actions</div>
              <div className="header-cell name-header" role="columnheader">Name</div>
              <div className="header-cell description-header" role="columnheader">Description</div>
              <div className="header-cell types-header" role="columnheader">Media Types</div>
              <div className="header-cell date-header" role="columnheader">Created</div>
              <div className="header-cell date-header" role="columnheader">Modified</div>
            </div>
            
            <div className="memories-table" role="grid">
              {filteredMemories.map(([memoryTitle, details], index) => (
                <div
                  key={index}
                  className="table-row p-2"
                  style={{
                    backgroundColor: index % 2 === 0 ? 'rgba(0, 0, 0, 0.2)' : 'none',
                  }}
                  role="row"
                >
                  <div className="table-cell actions-cell" role="cell" data-label="Actions">
                    <button
                      className="button2 action-button"
                      onClick={() => openActionsModal(memoryTitle, details)}
                      aria-label={`Open actions for ${details.metadata?.title || memoryTitle}`}
                    >
                      Actions
                    </button>
                  </div>
                  <div className="table-cell name-cell" role="cell" data-label="Name">
                    <div>{details.metadata?.title || '—'}</div>
                  </div>
                  <div className="table-cell description-cell" role="cell" data-label="Description">
                    <div>{details.metadata?.description || '—'}</div>
                  </div>
                  <div className="table-cell types-cell" role="cell" data-label="Media Types">
                    <div className="flex-column">
                      {Object.entries(countMediaTypes(details.topics))
                        .filter(([_, count]) => count > 0)
                        .map(([mediaType, count]) => (
                          <span key={mediaType} className="border rounded p-1 content-small">
                            {mediaType.toUpperCase()} ({count})
                          </span>
                        ))}
                    </div>
                  </div>
                  <div className="table-cell date-cell" role="cell" data-label="Created">
                    <div>
                      <span className="content-small mobile-only"></span>
                      {details.metadata?.createdAt ? new Date(details.metadata.createdAt).toLocaleDateString() : '—'}
                    </div>
                  </div>
                  <div className="table-cell date-cell" role="cell" data-label="Modified">
                    <div>
                      <span className="content-small mobile-only"></span>
                      {details.metadata?.lastUpdated ? new Date(details.metadata.lastUpdated).toLocaleDateString() : '—'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeActionsModal}
        className="actions-modal"
        style={{ maxWidth: '400px', width: '90vw' }}
      >
        {selectedMemory && (
          <div className="actions-modal flex-column p-3">
            <h2 className="title-md color2">{selectedMemory.details.metadata?.title || selectedMemory.memoryTitle}</h2>
            <button
              className="button2 rounded p-2 m-1 accionsContainer"
              onClick={() =>
                handleAction(
                  `/memories/${userID}/${encodeURIComponent(selectedMemory.memoryTitle)}`
                )
              }
              aria-label={`View ${selectedMemory.details.metadata?.title || selectedMemory.memoryTitle}`}
            >
              <ShowHide size={24} /> View
            </button>
            <button
              className="button2 rounded p-2 m-1 accionsContainer"
              onClick={() =>
                handleAction(
                  `/createNewTopicMemory/${userID}/${encodeURIComponent(selectedMemory.memoryTitle)}`
                )
              }
              aria-label={`Create new topic for ${selectedMemory.details.metadata?.title || selectedMemory.memoryTitle}`}
            >
              <EditPermissionsIcon size={24} /> Create new topic
            </button>
            <button
              className="button2 rounded p-2 m-1 accionsContainer"
              onClick={() =>
                handleAction(
                  `/dynamicCreator/${userID}/${encodeURIComponent(selectedMemory.memoryTitle)}`
                )
              }
              aria-label={`Edit title and description for ${selectedMemory.details.metadata?.title || selectedMemory.memoryTitle}`}
            >
              <EditPermissionsIcon size={24} /> Create new dynamic memory
            </button>
            <button
              className="button2 rounded p-2 m-1 accionsContainer"
              onClick={() =>
                handleAction(
                  `/uploadFiles/${userID}/${encodeURIComponent(selectedMemory.memoryTitle)}`
                )
              }
              aria-label={`Upload files to ${selectedMemory.details.metadata?.title || selectedMemory.memoryTitle}`}
            >
              <UploadIcon size={24} /> Upload Files
            </button>
            <button
              className="button2 rounded p-2 m-1 accionsContainer"
              onClick={() =>
                handleAction(
                  `/editMemories/${userID}/${encodeURIComponent(selectedMemory.memoryTitle)}`
                )
              }
              aria-label={`Edit ${selectedMemory.details.metadata?.title || selectedMemory.memoryTitle}`}
            >
              <EditToggleIcon size={24} /> Edit Files
            </button>
            <button
              className="button2 rounded p-2 m-1 accionsContainer"
              onClick={() =>
                handleAction(
                  `/editAccessibility/${userID}/${encodeURIComponent(selectedMemory.memoryTitle)}`
                )
              }
              aria-label={`Edit accessibility for ${selectedMemory.details.metadata?.title || selectedMemory.memoryTitle}`}
            >
              <EditToggleIcon size={24} /> Edit Accessibility
            </button>
            <button
              className="button2 rounded p-2 m-1 accionsContainer"
              onClick={() =>
                handleAction(
                  `/editTitleNameUser/${userID}/${encodeURIComponent(selectedMemory.memoryTitle)}`
                )
              }
              aria-label={`Edit title and description for ${selectedMemory.details.metadata?.title || selectedMemory.memoryTitle}`}
            >
              <EditToggleIcon size={24} /> Edit title and description memory
            </button>
            {selectedMemory.details?.dynamicMemories &&
              Object.entries(selectedMemory.details.dynamicMemories).map(([dynamicMemoryKey, dynamicMemoryData]) => (
                <button
                  key={dynamicMemoryKey}
                  className="button2 rounded p-2 m-1 accionsContainer"
                  onClick={() =>
                    handleAction(
                      `/dynamicMemory/${userID}/${encodeURIComponent(selectedMemory.memoryTitle)}/${encodeURIComponent(dynamicMemoryKey)}`
                    )
                  }
                  aria-label={`View dynamic memory ${dynamicMemoryKey} for ${selectedMemory.details.metadata?.title || selectedMemory.memoryTitle}`}
                >
                  <ShowHide size={24} /> Dynamic Memory {dynamicMemoryKey.slice(0, 8)}... (Created: {dynamicMemoryData.createdAt ? new Date(dynamicMemoryData.createdAt).toLocaleDateString() : '—'})
                </button>
              ))}
          </div>
        )}
      </Modal>
    </section>
  );

  return (
    <>
      {loading ? <LoadingMemories /> : 
        <GeneralMold
          pageTitle="Your Memories | Memory App"
          pageDescription="View, manage, and create your personal memories in the Memory App"
          metaKeywords="memories, personal memories, memory app, organize memories"
          visibility="private"
          owner={userEmail || 'Anonymous'}
          leftContent={leftContent}
          setInitialData={setInitialData}
          setTokenChild={setToken}
          setUidChild={setUid}
          setUserEmailChild={setUserEmail}
        />
      }
    </>
  );
}































































/*'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import '../../app/globals.css';
import '../../estilos/general/memoriesIndex.css';
import MemoryLogo from '@/components/complex/memoryLogo';
import ShowHide from '@/components/complex/showHide';
import UploadIcon from '@/components/complex/icons/uploadIcon';
import EditToggleIcon from '@/components/complex/EditToggleIcon ';
import Head from 'next/head';
import ErrorComponent from '@/components/complex/error';
import { auth } from '../../../firebase';
import { toast } from 'react-toastify';
import LoadingMemories from '@/components/complex/loading';
import GeneralMold from '@/components/complex/generalMold';
import Modal from '@/components/complex/modal';
import EditPermissionsIcon from '@/components/complex/icons/editPermissionsIcon';

export default function MemoriesIndex({ initialMemories, userInfo, error: initialError }) {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState(null);
  const [uid, setUid] = useState(null);
  const [token, setToken] = useState(null);
  const [memoriesState, setMemoriesState] = useState(initialMemories || {});
  const [loading, setLoading] = useState(!initialMemories && !initialError);
  const [error, setError] = useState(initialError || null);
  const [sortType, setSortType] = useState('alphabetical');
  const [filteredMemories, setFilteredMemories] = useState([]);
  const [userID, setUserID] = useState(userInfo?.userInfoId || '');
  const [userInformation, setUserInformation] = useState(userInfo?.userInformation || {});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialData, setInitialData] = useState();
  const [selectedMemory, setSelectedMemory] = useState(null);

  const notifySuccess = (message) => toast.success(message);
  const notifyFail = (message) => toast.error(message);

  // Helper function to count media types across all topics
  const countMediaTypes = (topics) => {
    const mediaCounts = {
      photos: 0,
      videos: 0,
      audios: 0,
      texts: 0,
    };

    if (!topics || typeof topics !== 'object') return mediaCounts;

    Object.values(topics).forEach((topic) => {
      mediaCounts.photos += topic.photos?.length || 0;
      mediaCounts.videos += topic.videos?.length || 0;
      mediaCounts.audios += topic.audios?.length || 0;
      mediaCounts.texts += topic.texts?.length || 0;
    });

    return mediaCounts;
  };

  

  // Efecto para verificar autenticación
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUid(user.uid);
        try {
          const idToken = await user.getIdToken();
          setToken(idToken);
          const email = user.email || user.providerData?.[0]?.email;
          setUserEmail(email);
        } catch (error) {
          console.error('Error getting token:', error);
          setError('Failed to authenticate user');
          setLoading(false);
        }
      } else {
        notifyFail('Please log in before continuing...');
        const path = window.location.pathname;
        localStorage.setItem('redirectPath', path);
        localStorage.setItem('reason', 'userEmailValidationOnly');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Efecto para obtener memorias
  useEffect(() => {
    const fetchMemories = async () => {
      if (!userEmail || !uid || !token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/mongoDb/getAllReferencesUser', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userEmail, uid, token }),
        });

        if (!response.ok) {
          if (response.status === 404) {
            setMemoriesState({});
            setUserID('');
            setLoading(false);
            setError('No memories found');
            return;
          }
          const errorInfo = await response.json().catch(() => ({}));
          const errorMessage = errorInfo.message || 'Network response error';
          throw new Error(`Error ${response.status}: ${errorMessage}`);
        }

        const data = await response.json();
        if (data.success) {
          setUserID(data.userInfoId);
          console.log(data.userInfoId);
          
          
          //const { userInformation, ...actualMemories } = data.memories;
          const { userInformation, dynamicMemories, lastUpdated, ...actualMemories } = data.memories;
          setUserInformation(data.memories.userInformation);
          console.log(data.memories.userInformation);
          
          
          
          console.log(actualMemories);
          setMemoriesState(actualMemories);
        } else {
          throw new Error('Error fetching memories');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (userEmail && uid && token) {
      fetchMemories();
    }
  }, [userEmail, uid, token]);

  // Efecto para ordenar memorias
  useEffect(() => {
    console.log(memoriesState);
    
    const entries = Object.entries(memoriesState);
    let sortedEntries = entries;

    if (sortType === 'alphabetical') {
      sortedEntries = entries.sort((a, b) => a[0].localeCompare(b[0]));
    } else if (sortType === 'creationDate') {
      sortedEntries = entries.sort((a, b) => {
        const dateA = new Date(a[1]?.metadata?.createdAt || 0);
        const dateB = new Date(b[1]?.metadata?.createdAt || 0);
        return dateA - dateB;
      });
    } else if (sortType === 'lastModified') {
      sortedEntries = entries.sort((a, b) => {
        const dateA = new Date(a[1]?.metadata?.lastUpdated || 0);
        const dateB = new Date(b[1]?.metadata?.lastUpdated || 0);
        return dateB - dateA;
      });
    }
    setFilteredMemories(sortedEntries);
  }, [memoriesState, sortType]);

  const handleCreateMemory = () => {
    if (!userEmail || !uid || !token) {
      const path = window.location.pathname;
      localStorage.setItem('redirectPath', path);
      localStorage.setItem('reason', 'createNewUser');
      router.push('/login');
      return;
    }
    router.push('/createNewMemory');
  };

  const handleSortChange = (e) => {
    setSortType(e.target.value);
  };

  const openActionsModal = (memoryTitle, details) => {
    setSelectedMemory({ memoryTitle, details });
    setIsModalOpen(true);
  };

  const closeActionsModal = () => {
    setIsModalOpen(false);
    setSelectedMemory(null);
  };

  const handleAction = (path) => {
    if (selectedMemory) {
      router.push(path);
      closeActionsModal();
    }
  };

  // Contenido para el panel izquierdo
  const leftContent = loading ? (
    <LoadingMemories />
  ) : error ? (
    <ErrorComponent error={error} />
  ) : (
    <section className="memories-section" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
      <h1 className="visually-hidden">Your Memories</h1>
      <button
        className={`button2 rounded p-2 ${filteredMemories.length === 0 ? 'backgroundColor2' : ''}`}
        onClick={handleCreateMemory}
        aria-label="Create new memory"
      >
        New Memory
      </button>
      
      <div className="flex-column">
        {filteredMemories.length > 0 && (
          <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', paddingBottom: '20px' }}>
            <label htmlFor="sort" className="visually-hidden">Sort memories by</label>
            <select
              style={{ maxHeight: '40px' }}
              id="sort"
              className="rounded p-2 border sort-select"
              value={sortType}
              onChange={handleSortChange}
              aria-label="Sort memories"
            >
              <option value="alphabetical">Name</option>
              <option value="creationDate">Creation Date</option>
              <option value="lastModified">Last Modified</option>
            </select>
          </div>
        )}
      </div>

      <div className='scrollTable'>
        {filteredMemories.length === 0 ? (
          <div className="centrar-completo flex-column no-memories" role="status">
            <MemoryLogo />
            <p className="title-md">No memories found. Click "New Memory" to create a new one</p>
          </div>
        ) : (
          <div className="memories-table-container" role="region" aria-labelledby="memories-table">
            
            <div className="table-header desktop-only" role="rowgroup">
              <div className="header-cell actions-header" role="columnheader">Actions</div>
              <div className="header-cell name-header" role="columnheader">Name</div>
              <div className="header-cell description-header" role="columnheader">Description</div>
              <div className="header-cell types-header" role="columnheader">Media Types</div>
              <div className="header-cell date-header" role="columnheader">Created</div>
              <div className="header-cell date-header" role="columnheader">Modified</div>
            </div>
            
            <div className="memories-table" role="grid">
              {filteredMemories.map(([memoryTitle, details], index) => (
                <div
                  key={index}
                  className="table-row p-2"
                  style={{
                    backgroundColor: index % 2 === 0 ? 'rgba(0, 0, 0, 0.2)' : 'none',
                  }}
                  role="row"
                >
                  <div className="table-cell actions-cell" role="cell" data-label="Actions">
                    <button
                      className="button2 action-button"
                      onClick={() => openActionsModal(memoryTitle, details)}
                      aria-label={`Open actions for ${details.metadata?.title || memoryTitle}`}
                    >
                      Actions
                    </button>
                  </div>
                  <div className="table-cell name-cell" role="cell" data-label="Name">
                    <div>{details.metadata?.title || '—'}</div>
                  </div>
                  <div className="table-cell description-cell" role="cell" data-label="Description">
                    <div>{details.metadata?.description || '—'}</div>
                  </div>
                  <div className="table-cell types-cell" role="cell" data-label="Media Types">
                    <div className="flex-column">
                      {Object.entries(countMediaTypes(details.topics))
                        .filter(([_, count]) => count > 0)
                        .map(([mediaType, count]) => (
                          <span key={mediaType} className="border rounded p-1 content-small">
                            {mediaType.toUpperCase()} ({count})
                          </span>
                        ))}
                    </div>
                  </div>
                  <div className="table-cell date-cell" role="cell" data-label="Created">
                    <div>
                      <span className="content-small mobile-only"></span>
                      {details.metadata?.createdAt ? new Date(details.metadata.createdAt).toLocaleDateString() : '—'}
                    </div>
                  </div>
                  <div className="table-cell date-cell" role="cell" data-label="Modified">
                    <div>
                      <span className="content-small mobile-only"></span>
                      {details.metadata?.lastUpdated ? new Date(details.metadata.lastUpdated).toLocaleDateString() : '—'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Modal
  isOpen={isModalOpen}
  onClose={closeActionsModal}
  className="actions-modal"
  style={{ maxWidth: '400px', width: '90vw' }}
>
  {selectedMemory && (
    <div className="actions-modal flex-column p-3">
      <h2 className="title-md color2">{selectedMemory.details.metadata?.title || selectedMemory.memoryTitle}</h2>
      <button
        className={`button2 rounded p-2 m-1 accionsContainer`}
        onClick={() =>
          handleAction(
            `/memories/${userID}/${encodeURIComponent(selectedMemory.memoryTitle)}`
          )
        }
        aria-label={`View ${selectedMemory.details.metadata?.title || selectedMemory.memoryTitle}`}
      >
        <ShowHide size={24} /> View
      </button>
      <button
        className="button2 rounded p-2 m-1 accionsContainer"
        onClick={() =>
          handleAction(
            `/createNewTopicMemory/${userID}/${encodeURIComponent(selectedMemory.memoryTitle)}`
          )
        }
        aria-label={`Edit title and name memory ${selectedMemory.details.metadata?.title || selectedMemory.memoryTitle}`}
      >
        <EditPermissionsIcon size={24} /> Create new topic
      </button>
      <button
        className="button2 rounded p-2 m-1 accionsContainer"
        onClick={() =>
          handleAction(
            `/uploadFiles/${userID}/${encodeURIComponent(selectedMemory.memoryTitle)}`
          )
        }
        aria-label={`Upload files to ${selectedMemory.details.metadata?.title || selectedMemory.memoryTitle}`}
      >
        <UploadIcon size={24} /> Upload Files
      </button>
      <button
        className="button2 rounded p-2 m-1 accionsContainer"
        onClick={() =>
          handleAction(
            `/editMemories/${userID}/${encodeURIComponent(selectedMemory.memoryTitle)}`
          )
        }
        aria-label={`Edit ${selectedMemory.details.metadata?.title || selectedMemory.memoryTitle}`}
      >
        <EditToggleIcon size={24} /> Edit Files
      </button>
      <button
        className="button2 rounded p-2 m-1 accionsContainer"
        onClick={() =>
          handleAction(
            `/editAccessibility/${userID}/${encodeURIComponent(selectedMemory.memoryTitle)}`
          )
        }
        aria-label={`Edit accessibility ${selectedMemory.details.metadata?.title || selectedMemory.memoryTitle}`}
      >
        <EditToggleIcon size={24} /> Edit Accessibility
      </button>
      <button
        className="button2 rounded p-2 m-1 accionsContainer"
        onClick={() =>
          handleAction(
            `/editTitleNameUser/${userID}/${encodeURIComponent(selectedMemory.memoryTitle)}`
          )
        }
        aria-label={`Edit title and name memory ${selectedMemory.details.metadata?.title || selectedMemory.memoryTitle}`}
      >
        <EditToggleIcon size={24} /> Edit title and description memory
      </button>
      {selectedMemory.details?.dynamicMemories &&
        Object.keys(selectedMemory.details.dynamicMemories).map((dynamicMemoryKey) => (
          <button
            key={dynamicMemoryKey}
            className="button2 rounded p-2 m-1 accionsContainer"
            onClick={() =>
              handleAction(
                `/dynamicMemory/${userID}/${encodeURIComponent(dynamicMemoryKey)}`
              )
            }
            aria-label={`View dynamic memory ${dynamicMemoryKey} for ${selectedMemory.details.metadata?.title || selectedMemory.memoryTitle}`}
          >
            <ShowHide size={24} /> View Dynamic Memory {dynamicMemoryKey.slice(0, 8)}...
          </button>
        ))}
    </div>
  )}
</Modal>
    </section>
  );

  return (
    <>
      {loading ? <LoadingMemories /> : 
        <GeneralMold
          pageTitle="Your Memories | Memory App"
          pageDescription="View, manage, and create your personal memories in the Memory App"
          metaKeywords="memories, personal memories, memory app, organize memories"
          visibility="private"
          owner={userEmail || 'Anonymous'}
          leftContent={leftContent}
          setInitialData={setInitialData}
          setTokenChild={setToken}
          setUidChild={setUid}
          setUserEmailChild={setUserEmail}
        />
      }
    </>
  );
}*/



































