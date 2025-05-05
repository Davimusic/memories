import { useState, useEffect, useRef } from "react";
import Modal from "./modal";
import NextBeforeIcon from "./nextBeforeIcon";
import TogglePlayPause from "./TogglePlayPause";
import ShuffleButton from "./ShuffleButton";
import EffectsIcon from "./effectsIcon";
import DownloadIcon from "./downloadIcon";
import SpinnerIcon from "./spinnerIcon";
import PropTypes from 'prop-types';
import "../../estilos/general/imageSlider.css";
import "../../estilos/general/general.css";
import { log } from "tone/build/esm/core/util/Debug";














const ImageSlider = ({
  images = [],
  controls = {
    showPrevious: true,
    showPlayPause: true,
    showNext: true,
    showShuffle: true,
    showEffects: true,
    showDownload: true,
  },
  fixedEffect,
  timeToShow = 5000,
  showControls = false,
  initializeAutomatically = false,
  style = {},
  initialCurrentIndex = 0
}) => {
  console.log(images);
  


  const [currentIndex, setCurrentIndex] = useState(initialCurrentIndex);
  const [isPlaying, setIsPlaying] = useState(initializeAutomatically);
  const [modalOpen, setModalOpen] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [transitionEffect, setTransitionEffect] = useState(fixedEffect || "fade");
  const [currentRandomEffect, setCurrentRandomEffect] = useState("none");
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [userControlsVisible, setUserControlsVisible] = useState(showControls);
  const [nextImageLoaded, setNextImageLoaded] = useState(true);
  
  const controlsTimeout = useRef(null);
  const loadedImages = useRef(new Set());

  const getNextIndex = () => {
    if (images.length === 0) return 0;
    if (isShuffle) {
      let randomIndex = Math.floor(Math.random() * images.length);
      if (images.length > 1 && randomIndex === currentIndex) {
        return (currentIndex + 1) % images.length;
      }
      return randomIndex;
    }
    return (currentIndex + 1) % images.length;
  };

  useEffect(() => {
    if (images.length > 0) {
      setNextImageLoaded(false);
      const nextIndex = getNextIndex();
      const nextImageUrl = images[nextIndex];

      if (loadedImages.current.has(nextImageUrl)) {
        setNextImageLoaded(true);
        return;
      }

      const img = new Image();
      img.src = nextImageUrl;
      img.onload = () => {
        loadedImages.current.add(nextImageUrl);
        setNextImageLoaded(true);
      };
      img.onerror = () => setNextImageLoaded(false);
    }
  }, [currentIndex, images, isShuffle]);

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (fixedEffect) {
      setTransitionEffect(fixedEffect);
    }
  }, [fixedEffect]);

  useEffect(() => {
    if (!isPlaying || images.length === 0) return;
    const intervalId = setInterval(() => {
      if (nextImageLoaded) {
        setCurrentIndex(getNextIndex());
      }
    }, timeToShow);
    return () => clearInterval(intervalId);
  }, [images, isPlaying, isShuffle, timeToShow, nextImageLoaded]);

  useEffect(() => {
    if (transitionEffect === "random") {
      const availableEffects = [
        "fade", "slide", "zoom", "rotate", 
        "flip", "blur", "slideDown", "slideUp"
      ];
      const randomIndex = Math.floor(Math.random() * availableEffects.length);
      setCurrentRandomEffect(availableEffects[randomIndex]);
    }
  }, [currentIndex, transitionEffect]);

  const handleManualNavigation = (newIndex, pauseAutoplay = true) => {
    setCurrentIndex(newIndex);
    if (pauseAutoplay && isPlaying) {
      setIsPlaying(false);
    }
  };

  const goToNext = () => {
    if (isShuffle) {
      let randomIndex = Math.floor(Math.random() * images.length);
      if (images.length > 1 && randomIndex === currentIndex) {
        randomIndex = (currentIndex + 1) % images.length;
      }
      handleManualNavigation(randomIndex, true);
    } else {
      handleManualNavigation((currentIndex + 1) % images.length, true);
    }
  };

  const goToPrevious = () => {
    if (isShuffle) {
      let randomIndex = Math.floor(Math.random() * images.length);
      if (images.length > 1 && randomIndex === currentIndex) {
        randomIndex = (currentIndex - 1 + images.length) % images.length;
      }
      handleManualNavigation(randomIndex, true);
    } else {
      handleManualNavigation((currentIndex - 1 + images.length) % images.length, true);
    }
  };

  const toggleShuffle = () => {
    setIsShuffle(!isShuffle);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const openModal = () => {
    setModalOpen(true);
  };

  const handleEffectSelection = (effect) => {
    setTransitionEffect(effect);
    setModalOpen(false);
  };

  const effectClasses = {
    none: "",
    fade: "fadeTransition",
    slide: "slideTransition",
    zoom: "zoomTransition",
    rotate: "rotateTransition",
    flip: "flipTransition",
    blur: "blurTransition",
    slideDown: "slideDownTransition",
    slideUp: "slideUpTransition",
  };

  const bgEffectClasses = {
    none: "",
    fade: "bg-fadeTransition",
    slide: "bg-slideTransition",
    zoom: "bg-zoomTransition",
    rotate: "bg-rotateTransition",
    flip: "bg-flipTransition",
    blur: "bg-blurTransition",
    slideDown: "bg-slideDownTransition",
    slideUp: "bg-slideUpTransition",
  };

  const chosenEffect = transitionEffect === "random" ? currentRandomEffect : transitionEffect;
  const effectClass = effectClasses[chosenEffect] || "";
  const bgEffectClass = bgEffectClasses[chosenEffect] || "";

  const handleUserInteraction = () => {
    setUserControlsVisible(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => {
      setUserControlsVisible(false);
    }, 5000);
  };

  useEffect(() => {
    return () => {
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    };
  }, []);

  const handleDownload = async (e) => {
    e?.stopPropagation();
    const src = images[currentIndex];
    if (!src) return;

    if (isPlaying) {
      setIsPlaying(false);
    }

    try {
      const response = await fetch(src);
      if (!response.ok) throw new Error("Network response was not ok");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const fileName = src.split("/").pop().split("?")[0] || `image-${Date.now()}.jpg`;

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", decodeURIComponent(fileName));
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error al descargar:", error);
      window.open(src, "_blank");
    }
  };

  if (images.length === 0) {
    return <div className="slider-container">No images available.</div>;
  }

  return (
    <div
      className="slider-container"
      onTouchStart={handleUserInteraction}
      onMouseMove={handleUserInteraction}
      style={{ position: "relative", ...style }}
    >
      <div className="slider">
        <div className="image-wrapper">
          <img
            key={`bg-${currentIndex}-${chosenEffect}`}
            src={images[currentIndex]}
            alt={`Background image ${currentIndex}`}
            className={`background-image ${bgEffectClass}`}
          />
          <img
            key={`${currentIndex}-${chosenEffect}`}
            src={images[currentIndex]}
            alt={`Image ${currentIndex}`}
            className={`slideImage ${effectClass}`}
          />
        </div>
      </div>

      {!nextImageLoaded && (
        <div className="loading-overlay">
          <SpinnerIcon size={dimensions.width < 768 ? 24 : 30} />
        </div>
      )}

      {userControlsVisible && (
        <div className="controls backgroundColor1">
          {controls.showPrevious && (
            <NextBeforeIcon
              size={dimensions.width < 768 ? 24 : 30}
              direction="left"
              onToggle={goToPrevious}
            />
          )}
          {controls.showPlayPause && (
            <TogglePlayPause
              size={dimensions.width < 768 ? 24 : 30}
              isPlaying={isPlaying}
              onToggle={handlePlayPause}
            />
          )}
          {controls.showNext && (
            <NextBeforeIcon
              size={dimensions.width < 768 ? 24 : 30}
              direction="right"
              onToggle={goToNext}
            />
          )}
          {controls.showShuffle && (
            <ShuffleButton
              size={dimensions.width < 768 ? 24 : 30}
              isShuffle={isShuffle}
              toggleShuffle={toggleShuffle}
            />
          )}
          {(!fixedEffect && controls.showEffects) && (
            <EffectsIcon
              size={dimensions.width < 768 ? 24 : 30}
              onClick={openModal}
            />
          )}
          {controls.showDownload && (
            <DownloadIcon
              size={dimensions.width < 768 ? 24 : 30}
              onToggle={handleDownload}
            />
          )}
        </div>
      )}

      {(!fixedEffect && userControlsVisible) && (
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
          <h2 style={{ color: "#fff", textAlign: "center", marginBottom: "15px" }}>
            Transition effect
          </h2>
          <div className="modal-options">
            <button onClick={() => handleEffectSelection("random")}>Random effect</button>
            <button onClick={() => handleEffectSelection("none")}>No effect</button>
            <button onClick={() => handleEffectSelection("fade")}>Fade</button>
            <button onClick={() => handleEffectSelection("slide")}>Slide</button>
            <button onClick={() => handleEffectSelection("zoom")}>Zoom</button>
            <button onClick={() => handleEffectSelection("rotate")}>Rotate</button>
            <button onClick={() => handleEffectSelection("flip")}>Flip</button>
            <button onClick={() => handleEffectSelection("blur")}>Blur</button>
            <button onClick={() => handleEffectSelection("slideDown")}>Slide down</button>
            <button onClick={() => handleEffectSelection("slideUp")}>Slide up</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

ImageSlider.propTypes = {
  images: PropTypes.arrayOf(PropTypes.string),
  controls: PropTypes.shape({
    showPrevious: PropTypes.bool,
    showPlayPause: PropTypes.bool,
    showNext: PropTypes.bool,
    showShuffle: PropTypes.bool,
    showEffects: PropTypes.bool,
    showDownload: PropTypes.bool,
  }),
  fixedEffect: PropTypes.string,
  timeToShow: PropTypes.number,
  showControls: PropTypes.bool,
  initializeAutomatically: PropTypes.bool,
  style: PropTypes.object,
};

export default ImageSlider;





