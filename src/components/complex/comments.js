'use client';

import React, { useState, useEffect } from 'react';
import '../../estilos/general/comments.css';
import { auth } from '../../../firebase';
import { useRouter } from 'next/navigation';
import PropTypes from 'prop-types';

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
  const router = useRouter();

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
      <div class className="comment-header">
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
            <button
              onClick={() => handleLike(comment.id)}
              disabled={loadingStates[comment.id] === 'like'}
              className={loadingStates[comment.id] === 'like' ? 'loading' : ''}
            >
              {loadingStates[comment.id] === 'like' ? (
                <span className="spinner"></span>
              ) : (
                `Like (${comment.likes?.length || 0})`
              )}
            </button>
            <button onClick={() => setReplyText((prev) => ({ ...prev, [comment.id]: '' }))}>
              Reply
            </button>
            {comment.author === userId && (
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
    <div style={{width: '100%'}}>
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


















/*'use client';

import React, { useState, useEffect } from 'react';
import '../../estilos/general/comments.css';
import { auth } from '../../../firebase';
import { useRouter } from 'next/navigation';
import PropTypes from 'prop-types';

/**
 * Builds a comment tree from a flat array of comments
 * @param {Array} comments - Array of comment objects
 * @param {string|null} parentId - ID of the parent comment (null for top-level)
 * @returns {Array} Nested comment tree
 */
/*const buildCommentTree = (comments, parentId = null) => {
  // Safeguard: If comments is not an array, log warning and return empty array
  if (!Array.isArray(comments)) {
    console.warn('buildCommentTree: comments is not an array, defaulting to []', comments);
    return [];
  }

  return comments
    .filter((c) => c.parentId === parentId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((c) => ({ ...c, replies: buildCommentTree(comments, c.id) }));
};

/**
 * Comments component
 * Displays a list of comments for the current image, allows creating, liking, editing, and deleting comments.
 * @param {Object} props - Component props
 */
/*const Comments = ({
  commentsData = [], // Array of comments for the current file
  userId, // User email for comment authorship
  memoryId, // Memory ID for endpoint
  uniqueMemoryId, // Unique memory ID for dynamicMemory
  token, // Firebase auth token
  uid, // Firebase user UID
  root, // Comment root (dynamicMemory, generalMemory, files)
  fileId, // File URL for file-specific comments
  onCommentAdded = () => {}, // Callback to notify parent of new comments
  currentIndex = 0, // Current image index from ImageSlider
}) => {
  // Initialize comments state, ensuring it's an array
  const [comments, setComments] = useState(Array.isArray(commentsData) ? commentsData : []);
  const [newComment, setNewComment] = useState('');
  const [replyText, setReplyText] = useState({});
  const [editText, setEditText] = useState({});
  const [error, setError] = useState(null);
  const router = useRouter();

  // Validate root parameter
  const validRoots = ['dynamicMemory', 'generalMemory', 'files'];
  useEffect(() => {
    if (!validRoots.includes(root)) {
      console.error('Invalid root parameter. Must be one of:', validRoots);
      setError('Invalid comment location specified.');
    }
  }, [root]);

  // Update comments when commentsData, currentIndex, fileId, or root changes
  useEffect(() => {
    console.log('Comments: Received commentsData:', commentsData, 'for currentIndex:', currentIndex, 'fileId:', fileId);

    if (commentsData?.content) {
  console.log("Coordenada actual:", currentIndex);
  console.log(commentsData?.content[currentIndex].comments);
}

    
    
    if (root === 'files' && fileId) {
      //console.log(commentsData[currentIndex].comments);
      //setComments(commentsData?.content[currentIndex].comments);
      try {
        const comments = commentsData?.content?.[currentIndex]?.comments;
        if (comments) {
          setComments(comments);
        } else {
          const fallbackComments = commentsData?.[currentIndex]?.comments;
          if (fallbackComments) {
            console.log(fallbackComments);
            setComments(fallbackComments);
          }
        }
      } catch (error) {
        console.error("Error al obtener los comentarios:", error);
      }
    } else {
      // For non-file roots, use all comments
      setComments(Array.isArray(commentsData) ? commentsData : []);
    }
  }, [commentsData, currentIndex, fileId, root]);

  // Endpoints for API calls
  const ENDPOINTS = {
    CREATE: `/api/mongoDb/comments/uploadComment`,
    LIKE: `/api/mongoDb/comments/like`,
    EDIT: `/api/mongoDb/comments/edit`,
    DELETE: `/api/mongoDb/comments/delete`,
  };

  /**
   * Sends HTTP requests to the API
   * @param {string} url - API endpoint
   * @param {string} method - HTTP method
   * @param {object} body - Request body
   * @returns {Promise<object|null>} Response data or null on error
   */
  /*const sendRequest = async (url, method, body) => {
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

  /**
   * Creates a new comment or reply
   * @param {string|null} parentId - Parent comment ID (null for top-level)
   */
  /*const handleCreateComment = async (parentId = null) => {
    const commentText = parentId ? replyText[parentId] || '' : newComment;
    if (!commentText.trim()) return;

    const commentData = {
      text: commentText,
      parentId,
      userId,
      memoryId,
      root,
      ...(root === 'dynamicMemory' && { uniqueMemoryId }),
      ...(root === 'files' && { fileId }), // Include fileId for file-specific comments
      token,
      uid,
    };

    const result = await sendRequest(ENDPOINTS.CREATE, 'POST', commentData);

    if (result && result.success && result.comment) {
      setComments((prev) => [...prev, result.comment]);
      onCommentAdded(currentIndex, result.comment); // Pass currentIndex to parent
      if (!parentId) setNewComment('');
      else setReplyText((prev) => ({ ...prev, [parentId]: '' }));
      setError(null);
    } else {
      setError(result?.message || `Failed to create ${parentId ? 'reply' : 'comment'}`);
    }
  };

  /**
   * Likes a comment
   * @param {string} commentId - ID of the comment to like
   */
  /*const handleLike = async (commentId) => {
    if (!commentId) {
      setError('Comment ID is missing');
      return;
    }

    const result = await sendRequest(ENDPOINTS.LIKE, 'PUT', {
      commentId,
      userId,
      memoryId,
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
  };

  /**
   * Edits a comment
   * @param {string} commentId - ID of the comment to edit
   */
  /*const handleEdit = async (commentId) => {
    if (!commentId) {
      setError('Comment ID is missing');
      return;
    }

    const text = editText[commentId];
    if (!text.trim()) return;

    const result = await sendRequest(ENDPOINTS.EDIT, 'PUT', {
      commentId,
      text,
      userId,
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
  };

  /**
   * Deletes a comment
   * @param {string} commentId - ID of the comment to delete
   */
  /*const handleDelete = async (commentId) => {
    if (!commentId) {
      setError('Comment ID is missing');
      return;
    }

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
  };

  /**
   * Renders a single comment
   * @param {object} comment - The comment object
   * @param {boolean} isReply - Whether the comment is a reply
   * @returns {JSX.Element} Comment JSX
   */
  /*const renderComment = (comment, isReply = false) => (
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
          <button className='createCommentButton' onClick={() => handleEdit(comment.id)}>Save</button>
          <button className='createCommentButton' onClick={() => setEditText((prev) => ({ ...prev, [comment.id]: undefined }))}>
            Cancel
          </button>
        </div>
      ) : (
        <>
          <p className="comment-text">{comment.text}</p>
          <div className="comment-actions">
            <button onClick={() => handleLike(comment.id)}>
              Like ({comment.likes?.length || 0})
            </button>
            <button onClick={() => setReplyText((prev) => ({ ...prev, [comment.id]: '' }))}>
              Reply
            </button>
            {comment.author === userId && (
              <>
                <button
                  onClick={() => setEditText((prev) => ({ ...prev, [comment.id]: comment.text }))}
                >
                  Edit
                </button>
                <button onClick={() => handleDelete(comment.id)}>Delete</button>
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
          <button className='createCommentButton' onClick={() => handleCreateComment(comment.id)}>Submit Reply</button>
          <button className='createCommentButton' onClick={() => setReplyText((prev) => ({ ...prev, [comment.id]: undefined }))}>
            Cancel
          </button>
        </div>
      )}
      {comment.replies.map((reply) => renderComment(reply, true))}
    </div>
  );

  // Build the comment tree
  const commentTree = buildCommentTree(comments);

  return (
    <div className="comments-container">
      <h3>Comments</h3>
      {error && <p className="error-message">{error}</p>}
      <div className="new-comment">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write your comment..."
        />
        <button className="createCommentButton" onClick={() => handleCreateComment()}>
          Submit Comment
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
  );
};

// PropTypes for type checking
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
*/








