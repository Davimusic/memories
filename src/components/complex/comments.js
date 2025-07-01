'use client';

import React, { useState, useEffect } from 'react';
import '../../estilos/general/comments.css'; // Assuming a separate CSS file for styling

const Comments = ({ commentsData = [], endpoint, userId, memoryId }) => {
  const [comments, setComments] = useState(commentsData);
  const [newComment, setNewComment] = useState('');
  const [replyText, setReplyText] = useState({});
  const [editText, setEditText] = useState({});
  const [error, setError] = useState(null);

  // Update comments when commentsData prop changes
  useEffect(() => {
    setComments(commentsData);
  }, [commentsData]);

  // Helper function to send API requests
  const sendRequest = async (url, method, body) => {
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (err) {
      setError(err.message);
      return null;
    }
  };

  // Handle creating a new comment
  const handleCreateComment = async (parentId = null) => {
    if (!newComment.trim() && !parentId) return;
    const commentText = parentId ? replyText[parentId] || '' : newComment;
    if (!commentText.trim()) return;

    const commentData = {
      memoryId,
      userId,
      text: commentText,
      parentId,
      createdAt: new Date().toISOString(),
    };

    const result = await sendRequest(endpoint, 'POST', commentData);
    console.log(result);
    
    if (result) {
      setComments(prev => parentId 
        ? prev.map(comment => comment.id === parentId 
            ? { ...comment, replies: [...(comment.replies || []), result] }
            : comment)
        : [...prev, result]
      );
      if (!parentId) setNewComment('');
      else setReplyText(prev => ({ ...prev, [parentId]: '' }));
      setError(null);
    }
  };

  // Handle liking a comment
  /*const handleLike = async (commentId) => {
    const result = await sendRequest(`${endpoint}/${commentId}/like`, 'POST', { userId });
    if (result) {
      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, likes: result.likes }
          : comment.replies 
            ? { ...comment, replies: comment.replies.map(reply => 
                reply.id === commentId ? { ...reply, likes: result.likes } : reply
              )}
            : comment
      ));
    }
  };

  // Handle editing a comment
  const handleEdit = async (commentId, isReply = false) => {
    const text = editText[commentId];
    if (!text?.trim()) return;

    const result = await sendRequest(`${endpoint}/${commentId}`, 'PUT', { text });
    if (result) {
      setComments(prev => prev.map(comment => 
        isReply 
          ? { ...comment, replies: comment.replies.map(reply => 
              reply.id === commentId ? { ...reply, text } : reply
            )}
          : comment.id === commentId 
            ? { ...comment, text }
            : comment
      ));
      setEditText(prev => ({ ...prev, [commentId]: '' }));
    }
  };

  // Handle deleting a comment
  const handleDelete = async (commentId, isReply = false) => {
    const result = await sendRequest(`${endpoint}/${commentId}`, 'DELETE');
    if (result) {
      setComments(prev => isReply 
        ? prev.map(comment => ({
            ...comment,
            replies: comment.replies.filter(reply => reply.id !== commentId)
          }))
        : prev.filter(comment => comment.id !== commentId)
      );
    }
  };*/

  // Render individual comment
  const renderComment = (comment, isReply = false) => (
    <div key={comment.id} className={`comment ${isReply ? 'reply' : ''}`}>
      <div className="comment-header">
        <span className="comment-author">{comment.author || 'Anonymous'}</span>
        <span className="comment-date">
          {new Date(comment.createdAt).toLocaleString()}
        </span>
      </div>
      {editText[comment.id] !== undefined ? (
        <div className="comment-edit">
          <textarea
            value={editText[comment.id]}
            onChange={(e) => setEditText(prev => ({ ...prev, [comment.id]: e.target.value }))}
          />
          <button onClick={() => handleEdit(comment.id, isReply)}>Save</button>
          <button onClick={() => setEditText(prev => ({ ...prev, [comment.id]: undefined }))}>
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
            {!isReply && (
              <button onClick={() => setReplyText(prev => ({ ...prev, [comment.id]: '' }))}>
                Reply
              </button>
            )}
            {comment.userId === userId && (
              <>
                <button onClick={() => setEditText(prev => ({ ...prev, [comment.id]: comment.text }))}>
                  Edit
                </button>
                <button onClick={() => handleDelete(comment.id, isReply)}>Delete</button>
              </>
            )}
          </div>
        </>
      )}
      {!isReply && replyText[comment.id] !== undefined && (
        <div className="reply-input">
          <textarea
            value={replyText[comment.id] || ''}
            onChange={(e) => setReplyText(prev => ({ ...prev, [comment.id]: e.target.value }))}
            placeholder="Write a reply..."
          />
          <button onClick={() => handleCreateComment(comment.id)}>Submit Reply</button>
          <button onClick={() => setReplyText(prev => ({ ...prev, [comment.id]: undefined }))}>
            Cancel
          </button>
        </div>
      )}
      {comment.replies?.map(reply => renderComment(reply, true))}
    </div>
  );

  return (
    <div className="comments-container">
      <h3>Comments</h3>
      {error && <p className="error-message">{error}</p>}
      <div className="new-comment">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
        />
        <button onClick={() => handleCreateComment()}>Submit Comment</button>
      </div>
      <div className="comments-list">
        {comments.length > 0 ? (
          comments.map(comment => renderComment(comment))
        ) : (
          <p>No comments yet.</p>
        )}
      </div>
    </div>
  );
};

export default Comments;