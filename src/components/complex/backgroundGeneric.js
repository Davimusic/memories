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
  // Definimos nuestros degradados directamente en un array
  const backgroundGradients = [
    "linear-gradient(135deg, #3b3636, hwb(0 18% 82%))",
    "linear-gradient(135deg, hwb(0 18% 82%), hwb(0 15% 90%))",
    "linear-gradient(135deg, #113558, #1a4565)",
    "linear-gradient(135deg, #2cb9e4, #4dd7f0)",
    "linear-gradient(135deg, #ffffff, #f2f2f2)"
  ];

  // ÍNDICE DEL DEGRADADO ACTUAL
  const [currentIndex, setCurrentIndex] = useState(0);
  // Bandera para animar la opacidad (fade in/out)
  const [fade, setFade] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const loginContainerRef = useRef(null);
  const [loginDimensions, setLoginDimensions] = useState({ width: 400, height: 500 });

  const images = [
    "/photosLoging/f1.webp",
    "/photosLoging/f2.webp",
    "/photosLoging/f3.webp",
    "/photosLoging/f4.webp",
    "/photosLoging/f5.webp",
    "/photosLoging/f6.webp",
  ];

  // Alternamos el fondo cada 5 segundos en desktop/tablet
  useEffect(() => {
    if (!isMobile) {
      const interval = setInterval(() => {
        // Iniciamos la animación de fade-out (la capa actual se desvanece)
        setFade(true);

        // Después de la duración de la transición, cambiamos al siguiente degradado
        setTimeout(() => {
          setCurrentIndex((prevIndex) => (prevIndex + 1) % backgroundGradients.length);
          setFade(false);
        }, 2500); // Debe coincidir con la duración de la transición CSS
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
          height: loginContainerRef.current.offsetHeight,
        });
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Estilos del contenedor y de la capa de fondo
  const styles = {
    mainContainer: {
      position: "relative",
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
      ...style,
    },
    // Esta capa se posiciona detrás del contenido y su opacidad se anima
    backgroundLayer: {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundSize: "cover",
      backgroundRepeat: "no-repeat",
      transition: "opacity 2.5s ease",
      zIndex: -1,
      // La opacidad varía según el estado de `fade`
      opacity: fade ? 0 : 1,
    },
    // Resto de estilos para móviles y escritorio
    mobileOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1,
    },
    mobileContent: {
      position: "relative",
      zIndex: 2,
      width: "100%",
      maxWidth: "400px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    },
    desktopContainer: {
      display: "flex",
      alignItems: "stretch",
      height: "512px",
      maxWidth: "1200px",
      width: "100%",
      justifyContent: "center",
      gap: "40px",
    },
    loginContainer: {
      flexShrink: 0,
      height: "100%",
    },
    sliderContainer: {
      width: "400px",
      flexShrink: 0,
      borderBottomRightRadius: "0.7em",
      borderTopRightRadius: "0.7em",
      overflow: "hidden",
      backgroundColor: "white",
      height: "488px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      paddingLeft: "10px",
      marginLeft: "-50px",
    },
  };

  // Versión para móvil
  if (isMobile) {
    return (
      <div style={styles.mainContainer} className={`${className} mainFont`}>
        {/* Capa de fondo */}
        <div
          style={{
            ...styles.backgroundLayer,
            backgroundImage: backgroundGradients[currentIndex],
          }}
        />
        {showImageSlider && (
          <div style={styles.mobileOverlay}>
            <ImageSlider
              images={images}
              fixedEffect="random"
              timeToShow={2000}
              showControls={false}
              style={{ height: "100%" }}
              initializeAutomatically={true}
            />
          </div>
        )}
        <div style={styles.mobileContent}>{children}</div>
      </div>
    );
  }

  // Versión para desktop/tablet
  return (
    <div style={styles.mainContainer} className={`${className} mainFont`}>
      {/* Capa de fondo animada */}
      <div
        style={{
          ...styles.backgroundLayer,
          backgroundImage: backgroundGradients[currentIndex],
        }}
      />
      <div style={styles.desktopContainer}>
        <div ref={loginContainerRef} style={styles.loginContainer}>
          {children}
        </div>
        {showImageSlider && (
          <div style={styles.sliderContainer}>
            <ImageSlider
              images={images}
              fixedEffect="random"
              timeToShow={3000}
              showControls={false}
              style={{ height: "488px" }}
              initializeAutomatically={true}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default BackgroundGeneric;








