import React, { useState } from 'react';

const FeedbackForm = ({ onSubmit, title = "Send Your Feedback", submitText = "Submit Feedback", showRatings = true }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const validate = () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return false;
    }
    if (!email.trim()) {
      setError('Please enter your email');
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please enter a valid email');
      return false;
    }
    if (!message.trim()) {
      setError('Please enter your message');
      return false;
    }
    setError('');
    return true;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      await onSubmit({ name, email, message, rating: showRatings ? rating : null });
      setSubmitted(true);
    } catch (err) {
      setError('An error occurred while submitting the form. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  if (submitted) {
    return (
      <div className="feedback-success">
        <div className="success-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h3 className="success-title">Thank You for Your Feedback!</h3>
        <p className="success-message">We have received your message successfully.</p>
      </div>
    );
  }
  return (
    <div className="feedback-form">
      <h3 className="feedback-title">{title}</h3>
      {error && <div className="feedback-error">{error}</div>}
      <div className="form-group">
        <label htmlFor="feedback-name">Name</label>
        <input type="text" id="feedback-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="form-group">
        <label htmlFor="feedback-email">Email</label>
        <input type="email" id="feedback-email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      {showRatings && (
        <div className="form-group">
          <label>Rating</label>
          <div className="rating-container">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`rating-star ${star <= (hoverRating || rating) ? 'active' : ''}`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                aria-label={`Rate with ${star} ${star === 1 ? 'star' : 'stars'}`}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="form-group">
        <label htmlFor="feedback-message">Message</label>
        <textarea id="feedback-message" value={message} onChange={(e) => setMessage(e.target.value)} rows="5" required></textarea>
      </div>
      <button type="button" className="submit-button" onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? (
          <>
            <svg className="spinner" viewBox="0 0 50 50">
              <circle cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
            </svg>
            Submitting...
          </>
        ) : (
          submitText
        )}
      </button>
    </div>
  );
};

export default FeedbackForm