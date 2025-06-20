import React, { useState } from 'react';


const CTABlock = ({ title, description, buttonText, onClick, href, variant = 'primary', icon = null }) => {
  const handleClick = (e) => {
    if (!href) {
      e.preventDefault();
      if (onClick) onClick();
    }
  };
  return (
    <div className={`cta-block ${variant}`}>
      <div className="cta-content">
        {title && <h3 className="cta-title">{title}</h3>}
        {description && <p className="cta-description">{description}</p>}
      </div>
      <a href={href || '#'} title={buttonText} className={`cta-button ${variant}`} onClick={handleClick}>
        {icon && <span className="cta-icon" dangerouslySetInnerHTML={{ __html: icon }} />}
        {buttonText}
      </a>
    </div>
  );
};


export default CTABlock