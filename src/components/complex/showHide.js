import React, { useState } from 'react';
import '../../estilos/music/icon.css'

const ShowHide = ({ size = 24, onClick = () => {}, isVisible = false, style = {} }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = (event) => {
    event.stopPropagation(); // Prevent event propagation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300); // Animation duration
    onClick(); // Execute the onClick function
  };

  return (
    <>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        onClick={handleClick}
        className={isAnimating ? 'pulse' : ''}
        style={{
          cursor: 'pointer',
          transition: 'transform 0.3s ease',
          ...style, // Merge the passed style with default styles
        }}
        stroke="black"
        strokeWidth="2"
        fill="none"
      >
        {/* Eye icon for "Show" state */}
        {!isVisible && (
          <>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </>
        )}
        {/* Eye-slash icon for "Hide" state */}
        {isVisible && (
          <>
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </>
        )}
      </svg>
    </>
  );
};

export default ShowHide;