import React, { useState } from 'react';
import '../../../estilos/music/icon.css';

const EditPermissionsIcon = ({ size = 24, onClick = () => {} }) => {
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
        transition: 'transform 0.3s ease',
      }}
      stroke="black"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Icono de edición de permisos: lápiz sobre documento */}
      <path d="M12 2l8 8-8 8-8-8 8-8z" /> {/* Representa el documento */}
      <path d="M14 10l6 6" /> {/* Representa el lápiz */}
      <path d="M18 14l-2 2" />
    </svg>
  );
};

export default EditPermissionsIcon;
