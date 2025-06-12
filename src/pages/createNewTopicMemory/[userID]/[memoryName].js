'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import '../../../estilos/general/createNewTopicMemory.css';
import '../../../app/globals.css';
import GeneralMold from '@/components/complex/generalMold';
import LoadingMemories from '@/components/complex/loading';
import Head from 'next/head';
import { auth } from '../../../../firebase';
import { toast } from 'react-toastify';

// Main ManageMemoryTopics Component
const ManageMemoryTopics = () => {
  const router = useRouter();
  const { userID, memoryName } = router.query;
  const [memoryData, setMemoryData] = useState(null);
  const [newTopicName, setNewTopicName] = useState('');
  const [userEmail, setUserEmail] = useState(null);
  const [uid, setUid] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [error, setError] = useState('');
  const [initialData, setInitialData] = useState();

  const notifySuccess = (message) => toast.success(message);
  const notifyFail = (message) => toast.error(message);

  // Autenticación de usuario
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
          setIsLoading(false);
        }
      } else {
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

  // Obtener datos del recuerdo
  useEffect(() => {
    const fetchMemoryData = async () => {
      if (!userID || !memoryName || !userEmail || !uid || !token) {
        return;
      }

      try {
        const response = await fetch('/api/mongoDb/postMemoryReferenceUser', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userID, memoryTitle: memoryName, uid, token }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error('Failed to load memory data');
        }

        setMemoryData(data.memory);
        setError('');
      } catch (err) {
        setError(err.message || 'Failed to fetch memory data');
      } finally {
        setIsLoading(false);
      }
    };

    if (userEmail && uid && token) {
      fetchMemoryData();
    }
  }, [userID, memoryName, userEmail, uid, token]);

  // Manejar la creación de un nuevo tópico
  const handleAddTopic = async (e) => {
    e.preventDefault();
    setError('');

    if (!newTopicName.trim()) {
      setError('Please provide a topic name');
      return;
    }

    // Verificar si el tópico ya existe (ignorando mayúsculas/minúsculas)
    const existingTopics = memoryData?.topics ? Object.keys(memoryData.topics).map(t => t.toLowerCase()) : [];
    if (existingTopics.includes(newTopicName.trim().toLowerCase())) {
      setError('A topic with this name already exists');
      return;
    }

    setIsAddingTopic(true);

    try {
      const response = await fetch('/api/mongoDb/queries/addMemoryTopics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail,
          userId: userID,
          memoryTitle: memoryName,
          newTopics: {
            [newTopicName.trim()]: { photos: [], videos: [], audios: [], texts: [] }
          },
          uid,
          token,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add topic');
      }

      const data = await response.json();

      if (data.success) {
        notifySuccess(data.message)
        // Actualizar memoryData con el nuevo tópico
        setMemoryData(prev => ({
          ...prev,
          topics: {
            ...prev.topics,
            [newTopicName.trim()]: { photos: [], videos: [], audios: [], texts: [] }
          }
        }));
        setNewTopicName('');
      } else {
        throw new Error('Failed to add topic');
      }
    } catch (err) {
      console.log(err);
      setError(err.message || 'An error occurred while adding the topic');
    } finally {
      setIsAddingTopic(false);
    }
  };

  // Contenido principal (izquierda)
  const leftContent = isLoading ? (
    <LoadingMemories />
  ) : error && !memoryData ? (
    <div className="error-container">
      <p className="color1 title-lg">{error}</p>
    </div>
  ) : (
    <div className="card-content">
      <div style={{ display: 'flex' }}>
        <h2 className="card-title">Manage Memory Topics</h2>
      </div>
      
      <div className="memory-form flex-column">
        <div className="form-group flex-column">
          <label className="title-sm">Memory Title</label>
          <input
            type="text"
            className="text-input rounded p-2"
            value={memoryData?.metadata?.title || ''}
            disabled
          />
        </div>
        
        <div className="form-group flex-column">
          <label className="title-sm">Description</label>
          <textarea
            style={{ resize: 'none' }}
            className="text-input rounded p-2"
            value={memoryData?.metadata?.description || ''}
            rows="5"
            disabled
          />
        </div>
        
        <div className="form-group flex-column">
          <label className="title-sm">New Topic Name</label>
          <input
            type="text"
            className="text-input rounded p-2"
            value={newTopicName}
            onChange={(e) => setNewTopicName(e.target.value)}
            placeholder="Enter topic name"
            disabled={isAddingTopic}
          />
        </div>
        
        {error && <div className="error-message color-error">{error}</div>}
        
        {newTopicName.trim() && (
          <button
            className="demo-button"
            onClick={handleAddTopic}
            disabled={isAddingTopic}
          >
            {isAddingTopic ? 'Adding...' : 'Add Topic'}
          </button>
        )}
      </div>
    </div>
  );

  // Contenido lateral (derecha)
  const rightContent = isLoading || (error && !memoryData) ? null : (
    <div className="card-content flex-column">
      <h4 className="card-title">Existing Topics</h4>
      {memoryData?.topics && Object.keys(memoryData.topics).length > 0 ? (
        <ul className="flex-column">
          {Object.keys(memoryData.topics).map((topic, index) => (
            <li key={index} className="card p-2 m-1">
              {topic}
            </li>
          ))}
        </ul>
      ) : (
        <p>No topics have been created yet.</p>
      )}
    </div>
  );

  return (
    <>
      <Head>
        <title>Manage Memory Topics | Memory App</title>
        <meta name="description" content="Add and manage topics for a memory in the Memory App" />
      </Head>
      {userEmail ? (
        <GeneralMold
          pageTitle="Manage Memory Topics"
          leftContent={leftContent}
          rightContent={rightContent}
          setInitialData={setInitialData}
        />
      ) : (
        null
      )}
    </>
  );
};

export default ManageMemoryTopics;
