'use client';

import React, { useState, useEffect } from 'react';
import '../../estilos/general/comments.css';
import { auth } from '../../../firebase';
import { useRouter } from 'next/navigation';
import PropTypes from 'prop-types';
import HeartIcon from './icons/heartIcon';






const buildCommentTree = (comments, parentId = null) => {
  if (!Array.isArray(comments)) {
    console.warn('buildCommentTree: comments is not an array, defaulting to []', comments);
    return [];
  }

  return comments
    .filter((c) => c.parentId === parentId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((c) => ({ ...c, replies: buildCommentTree(comments, c.id) }));
};

const Comments = ({
  commentsData = [],
  userId,
  memoryId,
  userEmail,
  uniqueMemoryId,
  token,
  uid,
  root,
  fileId,
  onCommentAdded = () => {},
  currentIndex = 0,
}) => {
  const [comments, setComments] = useState(Array.isArray(commentsData) ? commentsData : []);
  const [newComment, setNewComment] = useState('');
  const [replyText, setReplyText] = useState({});
  const [editText, setEditText] = useState({});
  const [error, setError] = useState(null);
  const [loadingStates, setLoadingStates] = useState({});
  //const [userEmail, setUserEmail] = useState(null);

  console.log(memoryId);
  

  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      console.log(user);
      if (user) {
        const email = user.email || user.providerData?.[0]?.email || null;
        console.log(email);
      } else {
        console.log('sin correo');
        
      }
    });
    return () => unsubscribe();
  }, []); 

  
  const validRoots = ['dynamicMemory', 'generalMemory', 'files'];
  useEffect(() => {
    if (!validRoots.includes(root)) {
      console.error('Invalid root parameter. Must be one of:', validRoots);
      setError('Invalid comment location specified.');
    }
  }, [root]);

  useEffect(() => {
    if (root === 'files' && fileId) {
      try {
        const comments = commentsData?.content?.[currentIndex]?.comments;
        if (comments) {
          setComments(comments);
        } else {
          const fallbackComments = commentsData?.[currentIndex]?.comments;
          if (fallbackComments) {
            setComments(fallbackComments);
          }
        }
      } catch (error) {
        console.error("Error al obtener los comentarios:", error);
      }
    } else {
      setComments(Array.isArray(commentsData) ? commentsData : []);
    }
  }, [commentsData, currentIndex, fileId, root]);

  const ENDPOINTS = {
    CREATE: `/api/mongoDb/comments/uploadComment`,
    LIKE: `/api/mongoDb/comments/like`,
    EDIT: `/api/mongoDb/comments/edit`,
    DELETE: `/api/mongoDb/comments/delete`,
  };

  const sendRequest = async (url, method, body) => {
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: method !== 'GET' ? JSON.stringify(body) : undefined,
      });
      if (!response.ok) throw new Error(`Network response was not ok: ${response.status}`);
      return await response.json();
    } catch (err) {
      setError(err.message);
      console.error('Request error:', err);
      return null;
    }
  };

  const handleCreateComment = async (parentId = null) => {
  console.log(userEmail);

  

    if (!userEmail) {
      const path = window.location.pathname;
      localStorage.setItem('redirectPath', path);
      localStorage.setItem('reason', 'userEmailValidationOnly');
      router.push('/login/userValidation');
    }

    const loadingKey = parentId ? `reply_${parentId}` : 'newComment';
    setLoadingStates((prev) => ({ ...prev, [loadingKey]: true }));

    const commentText = parentId ? replyText[parentId] || '' : newComment;
    if (!commentText.trim()) {
      setLoadingStates((prev) => ({ ...prev, [loadingKey]: undefined }));
      return;
    }

    const commentData = {
      text: commentText,
      parentId,
      userId,
      memoryId,
      userEmail,
      root,
      ...(root === 'dynamicMemory' && { uniqueMemoryId }),
      ...(root === 'files' && { fileId }),
      token,
      uid,
    };

    const result = await sendRequest(ENDPOINTS.CREATE, 'POST', commentData);

    if (result && result.success && result.comment) {
      setComments((prev) => [...prev, result.comment]);
      onCommentAdded(currentIndex, result.comment);
      if (!parentId) {
        setNewComment('');
      } else {
        setReplyText((prev) => ({ ...prev, [parentId]: undefined }));
      }
      setError(null);
    } else {
      setError(result?.message || `Failed to create ${parentId ? 'reply' : 'comment'}`);
    }
    setLoadingStates((prev) => ({ ...prev, [loadingKey]: undefined }));
  };

  const handleLike = async (commentId) => {
    setLoadingStates((prev) => ({ ...prev, [commentId]: 'like' }));

    const result = await sendRequest(ENDPOINTS.LIKE, 'PUT', {
      commentId,
      userId,
      memoryId,
      userEmail,
      root,
      ...(root === 'dynamicMemory' && { uniqueMemoryId }),
      ...(root === 'files' && { fileId }),
      token,
      uid,
    });

    if (result && result.success && result.likes) {
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, likes: result.likes } : c))
      );
      setError(null);
    } else {
      setError(result?.message || 'Failed to like comment');
    }
    setLoadingStates((prev) => ({ ...prev, [commentId]: undefined }));
  };

  const handleEdit = async (commentId) => {
    setLoadingStates((prev) => ({ ...prev, [commentId]: 'edit' }));

    const text = editText[commentId];
    if (!text.trim()) {
      setLoadingStates((prev) => ({ ...prev, [commentId]: undefined }));
      return;
    }

    const result = await sendRequest(ENDPOINTS.EDIT, 'PUT', {
      commentId,
      text,
      userId,
      userEmail,
      memoryId,
      root,
      ...(root === 'dynamicMemory' && { uniqueMemoryId }),
      ...(root === 'files' && { fileId }),
      token,
      uid,
    });

    if (result && result.success && result.comment) {
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, text: result.comment.text } : c))
      );
      setEditText((prev) => ({ ...prev, [commentId]: undefined }));
      setError(null);
    } else {
      setError(result?.message || 'Failed to edit comment');
    }
    setLoadingStates((prev) => ({ ...prev, [commentId]: undefined }));
  };

  const handleDelete = async (commentId) => {
    setLoadingStates((prev) => ({ ...prev, [commentId]: 'delete' }));

    const result = await sendRequest(ENDPOINTS.DELETE, 'DELETE', {
      commentId,
      userId,
      memoryId,
      root,
      ...(root === 'dynamicMemory' && { uniqueMemoryId }),
      ...(root === 'files' && { fileId }),
      token,
      uid,
    });

    if (result && result.success) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setError(null);
    } else {
      setError(result?.message || 'Failed to delete comment');
    }
    setLoadingStates((prev) => ({ ...prev, [commentId]: undefined }));
  };

  const renderComment = (comment, isReply = false) => (
    <div key={comment.id} className={`comment ${isReply ? 'reply' : ''}`}>
      <div className="comment-header">
        <span className="comment-author">{comment.author || 'Anonymous'}</span>
        <span className="comment-date">{new Date(comment.createdAt).toLocaleString()}</span>
      </div>
      {editText[comment.id] !== undefined ? (
        <div className="comment-edit">
          <textarea
            value={editText[comment.id]}
            onChange={(e) => setEditText((prev) => ({ ...prev, [comment.id]: e.target.value }))}
          />
          <button
            className={`createCommentButton ${loadingStates[comment.id] === 'edit' ? 'loading' : ''}`}
            onClick={() => handleEdit(comment.id)}
            disabled={loadingStates[comment.id] === 'edit'}
          >
            {loadingStates[comment.id] === 'edit' ? <span className="spinner"></span> : 'Save'}
          </button>
          <button
            className="createCommentButton"
            onClick={() => setEditText((prev) => ({ ...prev, [comment.id]: undefined }))}
          >
            Cancel
          </button>
        </div>
      ) : (
        <>
          <p className="comment-text">{comment.text}</p>
          <div className="comment-actions">
            <div className="like-container">
              <HeartIcon
                size={20}
                onClickFunction={() => handleLike(comment.id)}
                defaultLike={comment.likes?.includes(userEmail) || false}
                disabled={loadingStates[comment.id] === 'like'}
              />
              <span className="like-count">{comment.likes?.length || 0}</span>
            </div>
            <button onClick={() => setReplyText((prev) => ({ ...prev, [comment.id]: '' }))}>
              Reply
            </button>
            {comment.author === userEmail && (
              <>
                <button
                  onClick={() => setEditText((prev) => ({ ...prev, [comment.id]: comment.text }))}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(comment.id)}
                  disabled={loadingStates[comment.id] === 'delete'}
                  className={loadingStates[comment.id] === 'delete' ? 'loading' : ''}
                >
                  {loadingStates[comment.id] === 'delete' ? (
                    <span className="spinner"></span>
                  ) : (
                    'Delete'
                  )}
                </button>
              </>
            )}
          </div>
        </>
      )}
      {replyText[comment.id] !== undefined && (
        <div className="reply-input">
          <textarea
            value={replyText[comment.id] || ''}
            onChange={(e) => setReplyText((prev) => ({ ...prev, [comment.id]: e.target.value }))}
            placeholder="Write a reply..."
          />
          <button
            className={`createCommentButton ${loadingStates[`reply_${comment.id}`] ? 'loading' : ''}`}
            onClick={() => handleCreateComment(comment.id)}
            disabled={loadingStates[`reply_${comment.id}`]}
          >
            {loadingStates[`reply_${comment.id}`] ? (
              <span className="spinner"></span>
            ) : (
              'Submit Reply'
            )}
          </button>
          <button
            className="createCommentButton"
            onClick={() => setReplyText((prev) => ({ ...prev, [comment.id]: undefined }))}
          >
            Cancel
          </button>
        </div>
      )}
      {comment.replies.map((reply) => renderComment(reply, true))}
    </div>
  );

  const commentTree = buildCommentTree(comments);

  return (
    <div style={{ width: '100%' }}>
      <h3>Comments</h3>
      <div className="comments-container">
        {error && <p className="error-message">{error}</p>}
        <div className="new-comment">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write your comment..."
          />
          <button
            className={`createCommentButton ${loadingStates['newComment'] ? 'loading' : ''}`}
            onClick={() => handleCreateComment()}
            disabled={loadingStates['newComment']}
          >
            {loadingStates['newComment'] ? <span className="spinner"></span> : 'Submit Comment'}
          </button>
        </div>
        <div className="comments-list">
          {commentTree.length > 0 ? (
            commentTree.map((comment) => renderComment(comment))
          ) : (
            <p>No comments yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

Comments.propTypes = {
  commentsData: PropTypes.array,
  userId: PropTypes.string,
  memoryId: PropTypes.string,
  uniqueMemoryId: PropTypes.string,
  token: PropTypes.string,
  uid: PropTypes.string,
  root: PropTypes.string,
  fileId: PropTypes.string,
  onCommentAdded: PropTypes.func,
  currentIndex: PropTypes.number,
};

export default Comments;
























