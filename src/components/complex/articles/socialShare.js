import React, { useState } from 'react';

const SocialShare = ({ url, title, description, platforms = ['facebook', 'twitter', 'linkedin', 'whatsapp'], size = 'medium', color = 'brand' }) => {
  const shareOn = (platform) => {
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(description)}`,
      whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} - ${url}`)}`,
      pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(description)}`,
      email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${description}\n\n${url}`)}`
    };
    if (platform === 'email') {
      window.location.href = shareUrls[platform];
    } else {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };
  const getPlatformIcon = (platform) => {
    const icons = {
      facebook: <i className="fab fa-facebook-f"></i>,
      twitter: <i className="fab fa-twitter"></i>,
      linkedin: <i className="fab fa-linkedin-in"></i>,
      whatsapp: <i className="fab fa-whatsapp"></i>,
      pinterest: <i className="fab fa-pinterest-p"></i>,
      email: <i className="fas fa-envelope"></i>
    };
    return icons[platform];
  };
  return (
    <div className={`social-share ${size} ${color}`}>
      {platforms.map((platform) => (
        <button
          key={platform}
          className={`social-button ${platform}`}
          onClick={() => shareOn(platform)}
          aria-label={`Share on ${platform}`}
        >
          {getPlatformIcon(platform)}
        </button>
      ))}
    </div>
  );
};

export default SocialShare