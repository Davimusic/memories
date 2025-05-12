import React, { useState } from 'react';
import '../../../estilos/music/icon.css'

const UploadIcon = ({ size = 24, onClick = () => {} }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = (event) => {
    event.stopPropagation();
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
    onClick();
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      onClick={handleClick}
      className={isAnimating ? 'pulse' : ''}
      style={{ 
        cursor: 'pointer',
        transform: 'rotate(180deg)',
        transition: 'transform 0.3s ease',
      }}
      stroke="black"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 4v16m0 0l6-6m-6 6l-6-6" />
    </svg>
  );
};

export default UploadIcon;