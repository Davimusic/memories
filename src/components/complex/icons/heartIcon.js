import React, { useState, useEffect } from 'react'; // Asegúrate de importar useEffect
import '../../../estilos/music/icon.css';



const HeartIcon = ({ size = 20, onClickFunction, defaultLike = false, disabled = false }) => {
  const [isLike, setIsLike] = useState(defaultLike);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsLike(defaultLike);
  }, [defaultLike]);

  const handleClick = (event) => {
    if (disabled) return;
    event.stopPropagation();
    const newLikeState = !isLike;
    setIsLike(newLikeState);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    if (onClickFunction) {
      onClickFunction(newLikeState);
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      onClick={handleClick}
      className={`heart-icon ${isAnimating ? 'pulse' : ''} ${disabled ? 'disabled' : ''}`}
      style={{
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'fill 0.3s ease, transform 0.3s ease',
      }}
    >
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill={isLike ? '#e0245e' : 'none'}
        stroke={isLike ? '#e0245e' : '#666'}
        strokeWidth="1.5"
      />
    </svg>
  );
};

export default HeartIcon;

