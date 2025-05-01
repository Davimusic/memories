import React from 'react';
import '../../estilos/general/memoryLogo.css';






const MemoryLogo = ({ size = 100, animate = true }) => {
  const animationClass = animate ? 'animate' : '';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      style={{ cursor: 'pointer' }}
    >
      {/* Fondo circular con tono cálido */}
      <circle cx="50" cy="50" r="45" fill="#2c1a3a" className={`background-pulse ${animationClass}`} />

      {/* Gradiente para los elementos */}
      <defs>
        <linearGradient id="memoryGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8a5a44" />
          <stop offset="50%" stopColor="#d4a373" />
          <stop offset="100%" stopColor="#f8e6d9" />
        </linearGradient>
        
        {/* Filtro para suavizar las animaciones */}
        <filter id="softGlow" height="130%" width="130%">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Forma principal que respira */}
      <path 
        d="M30 30 L70 30 L65 50 L35 50 Z" 
        fill="url(#memoryGradient)" 
        className={`shape-breathing ${animationClass}`}
        filter="url(#softGlow)"
      />
      
      {/* Líneas interiores que fluyen */}
      <path 
        d="M35 40 L65 40" 
        stroke="url(#memoryGradient)" 
        strokeWidth="1.5" 
        className={`line-flow ${animationClass}`} 
      />
      <path 
        d="M40 45 L60 45" 
        stroke="url(#memoryGradient)" 
        strokeWidth="1.5" 
        className={`line-flow ${animationClass}`} 
        style={{ animationDelay: '0.5s' }}
      />
      
      {/* Tres bolas flotantes (versión anterior mejorada) */}
      <circle cx="35" cy="65" r="4" fill="url(#memoryGradient)" className={`memory-dot ${animationClass}`} style={{ animationDelay: '0.1s' }} />
      <circle cx="50" cy="70" r="4" fill="url(#memoryGradient)" className={`memory-dot ${animationClass}`} style={{ animationDelay: '0.3s' }} />
      <circle cx="65" cy="65" r="4" fill="url(#memoryGradient)" className={`memory-dot ${animationClass}`} style={{ animationDelay: '0.5s' }} />
      
      {/* Borde con movimiento orgánico */}
      <circle 
        cx="50" 
        cy="50" 
        r="45" 
        fill="none" 
        stroke="url(#memoryGradient)" 
        strokeWidth="1.5" 
        strokeDasharray="3,2" 
        className={`organic-border ${animationClass}`}
      />
    </svg>
  );
};

export default MemoryLogo;