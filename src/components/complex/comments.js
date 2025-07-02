'use client';

import React, { useState, useEffect } from 'react';
import '../../estilos/general/comments.css';
import { auth } from '../../../firebase';
import { useRouter } from 'next/navigation';

// Build comment tree from flat array
const buildCommentTree = (comments, parentId = null) => {
  return comments
    .filter((c) => c.parentId === parentId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((c) => ({ ...c, replies: buildCommentTree(comments, c.id) }));
};

const Comments = ({ commentsData = [], userId, memoryId, uniqueMemoryId, token, uid }) => {
  const [comments, setComments] = useState(commentsData);
  const [newComment, setNewComment] = useState('');
  const [replyText, setReplyText] = useState({});
  const [editText, setEditText] = useState({});
  const [error, setError] = useState(null);
  const router = useRouter();

  // Endpoints for API calls
  const ENDPOINTS = {
    CREATE: `/api/mongoDb/comments/uploadComment`,
    LIKE: `/api/mongoDb/comments/like`,
    EDIT: `/api/mongoDb/comments/edit`,
    DELETE: `/api/mongoDb/comments/delete`,
  };

  // Update comments when initial data changes
  useEffect(() => {
    setComments(commentsData || []);
  }, [commentsData]);

  // Function to send HTTP requests
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

  // Create a comment or reply
  const handleCreateComment = async (parentId = null) => {
    const commentText = parentId ? replyText[parentId] || '' : newComment;
    if (!commentText.trim()) return;

    const commentData = {
      text: commentText,
      parentId,
      userId,
      memoryId,
      uniqueMemoryId,
      token,
      uid,
    };

    const result = await sendRequest(ENDPOINTS.CREATE, 'POST', commentData);

    if (result && result.success && result.comment) {
      setComments((prev) => [...prev, result.comment]);
      if (!parentId) setNewComment('');
      else setReplyText((prev) => ({ ...prev, [parentId]: '' }));
      setError(null);
    } else {
      setError(result?.message || `Failed to create ${parentId ? 'reply' : 'comment'}`);
    }
  };

  // Like a comment
  const handleLike = async (commentId) => {
    if (!commentId) {
      setError('Comment ID is missing');
      return;
    }

    const result = await sendRequest(ENDPOINTS.LIKE, 'PUT', {
      commentId,
      userId,
      memoryId,
      uniqueMemoryId,
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

  // Edit a comment
  const handleEdit = async (commentId) => {
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
      uniqueMemoryId,
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

  // Delete a comment
  const handleDelete = async (commentId) => {
    if (!commentId) {
      setError('Comment ID is missing');
      return;
    }

    const result = await sendRequest(ENDPOINTS.DELETE, 'DELETE', {
      commentId,
      userId,
      memoryId,
      uniqueMemoryId,
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

  // Render a comment
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
          <button onClick={() => handleEdit(comment.id)}>Save</button>
          <button onClick={() => setEditText((prev) => ({ ...prev, [comment.id]: undefined }))}>
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
            placeholder="Write&amp;nbsp;a&amp;nbsp;reply..."
          />
          <button onClick={() => handleCreateComment(comment.id)}>Submit Reply</button>
          <button onClick={() => setReplyText((prev) => ({ ...prev, [comment.id]: undefined }))}>
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
          placeholder="write your comment..."
        />
        <button className='createCommentButton' onClick={() => handleCreateComment()}>Submit Comment</button>
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

export default Comments;