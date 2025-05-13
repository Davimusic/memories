import React from 'react';
import '../../estilos/general/general.css'
import '../../app/globals.css'
import BackgroundGeneric from './backgroundGeneric';
import MemoryLogo from './memoryLogo';


const LoadingMemories = () => {
  return (
    <div className="fullscreen-floating">
      <BackgroundGeneric showImageSlider={false}>
        <div 
          className="loading" 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            gap: '20px',
            zIndex: 9999
          }}
        >
          <MemoryLogo size={300} />
          <p className="color2 title-lg">Loading memories...</p>
        </div>
      </BackgroundGeneric>
    </div>
  );
};

export default LoadingMemories;

