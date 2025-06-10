import React, { useState } from 'react';
import '../../../estilos/music/icon.css';

const QRIcon = ({ size = 24, onClick = () => {} }) => {
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
      onClick={handleClick}
      className={isAnimating ? 'pulse' : ''}
      style={{
        cursor: 'pointer',
        transition: 'transform 0.3s ease',
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Marcador superior izquierdo */}
      <rect x="2" y="2" width="6" height="6" fill="black" />
      <rect x="3" y="3" width="4" height="4" fill="white" />
      
      {/* Marcador superior derecho */}
      <rect x="16" y="2" width="6" height="6" fill="black" />
      <rect x="17" y="3" width="4" height="4" fill="white" />

      {/* Marcador inferior izquierdo */}
      <rect x="2" y="16" width="6" height="6" fill="black" />
      <rect x="3" y="17" width="4" height="4" fill="white" />

      {/* Algunos cuadrados internos para simular la malla del código QR */}
      <rect x="10" y="4" width="2" height="2" fill="black" />
      <rect x="10" y="8" width="2" height="2" fill="black" />
      <rect x="10" y="12" width="2" height="2" fill="black" />
      <rect x="4" y="10" width="2" height="2" fill="black" />
      <rect x="8" y="10" width="2" height="2" fill="black" />
      <rect x="12" y="10" width="2" height="2" fill="black" />
      <rect x="16" y="16" width="2" height="2" fill="black" />
      <rect x="16" y="12" width="2" height="2" fill="black" />
      <rect x="12" y="16" width="2" height="2" fill="black" />
    </svg>
  );
};

export default QRIcon;
