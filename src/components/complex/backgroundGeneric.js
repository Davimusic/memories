import React, { useState, useEffect, useRef } from 'react';
import ImageSlider from './imageSlider';
import '../../estilos/general/imageSlider.css';
import '../../app/globals.css'












const BackgroundGeneric = ({
  isLoading,
  children,
  style = {},
  className = "",
  showImageSlider = true
}) => {
  const [backgroundClass, setBackgroundClass] = useState("backgroundColor1");
  const [isMobile, setIsMobile] = useState(false);
  const loginContainerRef = useRef(null);
  const [loginDimensions, setLoginDimensions] = useState({ width: 400, height: 500 });

  const images = [
    '/photosLoging/f1.webp',
    '/photosLoging/f2.webp',
    '/photosLoging/f3.webp',
    '/photosLoging/f4.webp',
    '/photosLoging/f5.webp',
    '/photosLoging/f6.webp',
  ];

  // Efecto para cambio de color de fondo en desktop/tablet
  useEffect(() => {
    if (!isMobile) {
      const classes = ["backgroundColor1", "backgroundColor2", "backgroundColor3", "backgroundColor4", "backgroundColor5"];
      let index = 0;

      const interval = setInterval(() => {
        index = (index + 1) % classes.length;
        setBackgroundClass(classes[index]);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isMobile]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);

      if (loginContainerRef.current && !mobile) {
        setLoginDimensions({
          width: loginContainerRef.current.offsetWidth,
          height: loginContainerRef.current.offsetHeight
        });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Estilos integrados
  const styles = {
    mainContainer: {
      minHeight: '100vh',
      position: 'relative',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      transition: 'background-color 2.5s ease',
      ...style
    },
    mobileOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1,
    },
    mobileContent: {
      position: 'relative',
      zIndex: 2,
      width: '100%',
      maxWidth: '400px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    },
    desktopContainer: {
      display: 'flex',
      alignItems: 'stretch',
      height: '512px',
      maxWidth: '1200px',
      width: '100%',
      justifyContent: 'center',
      gap: '40px'
    },
    loginContainer: {
      flexShrink: 0,
      height: '100%'
    },
    sliderContainer: {
      width: '400px',
      flexShrink: 0,
      borderBottomRightRadius: '0.7em', 
      borderTopRightRadius: '0.7em',
      overflow: 'hidden',
      padding: '0',
      backgroundColor: 'white',
      height: '488px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      paddingLeft: '10px',
      marginLeft: '-50px'
    },
    sliderWrapper: {
      height: '100%',
      width: '100%',
      borderRadius: 'inherit'
    }

  };

  // Versión para móvil
  if (isMobile) {
    return (
      <div style={styles.mainContainer} className={`${backgroundClass} ${className} mainFont`}>
        {showImageSlider && (
          <div style={styles.mobileOverlay}>
            <ImageSlider
              images={images}
              fixedEffect="random"
              timeToShow={2000}
              showControls={false}
              style={{ height: '100%' }}
              initializeAutomatically={true}
            />
          </div>
        )}
        <div style={styles.mobileContent}>
          {children}
        </div>
      </div>
    );
  }

  // Versión para desktop/tablet
  return (
    <div style={styles.mainContainer} className={`${backgroundClass} ${className} mainFont`}>
      <div style={styles.desktopContainer}>
        <div ref={loginContainerRef} style={styles.loginContainer}>
          {children}
        </div>
        {showImageSlider && (
          <div style={styles.sliderContainer}>
            <div >
              <ImageSlider
                images={images}
                fixedEffect="random"
                timeToShow={3000}
                showControls={false}
                style={{ height: '488px' }}
                initializeAutomatically={true}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BackgroundGeneric;





