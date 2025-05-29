'use client'; 

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import '../../app/globals.css'
import '../../estilos/general/memoriesIndex.css'
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
  const [selectedMemory, setSelectedMemory] = useState(null);

  const notifySuccess = (message) => toast.success(message);
  const notifyFail = (message) => toast.error(message);

  // Authentication check
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

  // Fetch memories data if not provided
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
          const { userInformation, ...actualMemories } = data.memories;
          setUserInformation(data.memories.userInformation);
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

    if (userEmail && uid && token && !initialMemories) {
      fetchMemories();
    }
  }, [userEmail, uid, token, initialMemories]);

  // Sort memories
  useEffect(() => {
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

  // Structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Your Memories',
    description: 'View and manage your personal memories in the Memory App',
    url: typeof window !== 'undefined' ? window.location.href : 'https://yourdomain.com/memories',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: filteredMemories.map(([memoryTitle, details], index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'CreativeWork',
          name: details.metadata?.title || memoryTitle,
          description: details.metadata?.description || 'No description available',
          dateCreated: details.metadata?.createdAt || undefined,
          dateModified: details.metadata?.lastUpdated || undefined,
        },
      })),
    },
  };

  // Content for GeneralMold

const leftContent = loading ? (
  <LoadingMemories />
) : error ? (
  <ErrorComponent error={error} />
) : (
  <section className="memories-section" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
    <h1 className="visually-hidden">Your Memories</h1>
    <div className="flex-column controls-container">
      {filteredMemories.length > 0 && (
        <div style={{display: 'flex', gap: '30px'}} className="">
          <label htmlFor="sort" className="visually-hidden">Sort memories by</label>
          <select
            style={{maxHeight: '40px'}}
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
      <button
        className={`button2 rounded p-2 ${filteredMemories.length === 0 ? 'backgroundColor2' : ''}`}
        onClick={handleCreateMemory}
        aria-label="Create new memory"
      >
        New Memory
      </button>
    </div>

    <div  className='scrollTable'>
        {filteredMemories.length === 0 ? (
        <div className="centrar-completo flex-column no-memories" role="status">
            <MemoryLogo />
            <p className="title-md">No memories found. Click "New Memory" to create a new one</p>
        </div>
        ) : (
        <div
            className="memories-table-container"
            role="region"
            aria-labelledby="memories-table"
        >
            <div className="memories-table" role="grid" aria-labelledby="memories-table">
            {filteredMemories.map(([memoryTitle, details], index) => (
                <div
                key={index}
                className="table-row p-2"
                style={{
                    backgroundColor: index % 2 === 0 ? 'rgba(0, 0, 0, 0.2)' : 'none',
                }}
                role="row"
                >
                <div className="table-cell actions-cell" role="cell">
                    <button
                    className="button2 action-button"
                    onClick={() => openActionsModal(memoryTitle, details)}
                    aria-label={`Open actions for ${details.metadata?.title || memoryTitle}`}
                    >
                    Actions
                    </button>
                </div>
                <div className="table-cell name-cell" role="cell">
                    <div data-label="Name">{details.metadata?.title || '—'}</div>
                </div>
                <div className="table-cell description-cell" role="cell">
                    <div data-label="Description">{details.metadata?.description || '—'}</div>
                </div>
                <div className="table-cell types-cell" role="cell">
                    <div className="flex-column" data-label="Types">
                    {Object.entries(details.media)
                        .filter(([_, mediaArray]) => mediaArray.length > 0)
                        .map(([mediaType, mediaArray]) => (
                        <span key={mediaType} className="border rounded p-1 content-small">
                            {mediaType.toUpperCase()} ({mediaArray.length})
                        </span>
                        ))}
                    </div>
                </div>
                <div className="table-cell date-cell" role="cell">
                    <div data-label="Created">
                    <span className="content-small">Created: </span>
                    {details.metadata?.createdAt ? new Date(details.metadata.createdAt).toLocaleDateString() : '—'}
                    </div>
                </div>
                <div className="table-cell date-cell" role="cell">
                    <div data-label="Modified">
                    <span className="content-small">Modified: </span>
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
        <div className="flex-column p-3">
          <h2 className="title-md color1">{selectedMemory.details.metadata?.title || selectedMemory.memoryTitle}</h2>
          <button
            style={{display: 'flex', gap: '30px', justifyContent: 'center'}}
            className="button2 rounded p-2 m-1"
            onClick={() =>
              handleAction(
                `/memories/${userInformation.id}/${encodeURIComponent(selectedMemory.memoryTitle)}`
              )
            }
            aria-label={`View ${selectedMemory.details.metadata?.title || selectedMemory.memoryTitle}`}
          >
            <ShowHide size={24} /> View
          </button>
          <button
          style={{display: 'flex', gap: '30px', justifyContent: 'center'}}
            className="button2 rounded p-2 m-1"
            onClick={() =>
              handleAction(
                `/uploadFiles/${userInformation.id}/${encodeURIComponent(selectedMemory.memoryTitle)}`
              )
            }
            aria-label={`Upload files to ${selectedMemory.details.metadata?.title || selectedMemory.memoryTitle}`}
          >
            <UploadIcon size={24} /> Upload Files
          </button>
          <button
          style={{display: 'flex', gap: '30px', justifyContent: 'center'}}
            className="button2 rounded p-2 m-1"
            onClick={() =>
              handleAction(
                `/editMemories/${userInformation.id}/${encodeURIComponent(selectedMemory.memoryTitle)}`
              )
            }
            aria-label={`Edit ${selectedMemory.details.metadata?.title || selectedMemory.memoryTitle}`}
          >
            <EditToggleIcon size={24} /> Edit
          </button>
          <button
          style={{display: 'flex', gap: '30px', justifyContent: 'center'}}
            className="button2 rounded p-2 m-1"
            onClick={() =>
              handleAction(
                `/editAccessibility/${userInformation.id}/${encodeURIComponent(selectedMemory.memoryTitle)}`
              )
            }
            aria-label={`Edit accessibility ${selectedMemory.details.metadata?.title || selectedMemory.memoryTitle}`}
          >
            <EditPermissionsIcon size={24} /> Edit Accessibility
          </button>
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
        >
        <Head>
            <meta property="og:title" content="Your Memories | Memory App" />
            <meta property="og:description" content="View, manage, and create your personal memories in the Memory App" />
            <meta property="og:type" content="website" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="Your Memories | Memory App" />
            <meta name="twitter:description" content="View, manage, and create your personal memories in the Memory App" />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        </Head>
        </GeneralMold>
        }
    </>
  );
}
