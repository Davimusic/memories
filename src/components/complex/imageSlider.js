/**
 * ImageSlider.js
 * A React component that displays a slideshow of images with navigation controls,
 * transition effects, and a comments modal for file-specific comments.
 * Updated to keep comments modal open until user closes it.
 */
import { useState, useEffect, useRef, useMemo } from "react";
import Modal from "./modal"; // Modal component for effects and comments
import NextBeforeIcon from "./nextBeforeIcon"; // Icon for previous/next navigation
import TogglePlayPause from "./TogglePlayPause"; // Play/pause toggle button
import ShuffleButton from "./ShuffleButton"; // Shuffle toggle button
import EffectsIcon from "./effectsIcon"; // Effects selection icon
import DownloadIcon from "./downloadIcon"; // Download icon
import SpinnerIcon from "./spinnerIcon"; // Loading spinner
import Comments from "./comments"; // Comments component for file-specific comments
import PropTypes from 'prop-types';
import CommentsIcon from "./icons/commentsIcon";
import "../../estilos/general/imageSlider.css"; // ImageSlider styles
import "../../estilos/general/general.css"; // General styles



/**
 * ImageSlider component
 * Displays a slideshow of images with navigation, autoplay, shuffle, effects,
 * and a comments modal that stays open until manually closed.
 */
const ImageSlider = ({
  images = [], // Array of image URLs
  controls = {
    showPrevious: true,
    showPlayPause: true,
    showNext: true,
    showShuffle: true,
    showEffects: true,
    showDownload: true,
    showComments: true,
  },
  fixedEffect, // Optional fixed transition effect
  timeToShow = 5000, // Time (ms) to show each image during autoplay
  showControls = false, // Whether to show controls by default
  initializeAutomatically = false, // Start autoplay on mount
  style = {}, // Custom styles for the slider container
  initialCurrentIndex = 0, // Initial image index
  onIndexChange = () => {}, // Callback to notify parent of index changes
  commentsData = [], // Array of comments for the current image
  userId = null, // User email for comment authorship
  memoryId = null, // Memory ID for endpoint
  token = null, // Firebase auth token
  uid = null, // Firebase user UID
  root = "files", // Comment root (set to "files" for file-specific comments)
  fileId = "", // Current image URL for comment association
  onCommentAdded = () => {}, // Callback to notify parent of new comments
}) => {
  // State for current image index
  const [currentIndex, setCurrentIndex] = useState(initialCurrentIndex);
  // State for autoplay status
  const [isPlaying, setIsPlaying] = useState(initializeAutomatically);
  // State for effects selection modal
  const [modalOpen, setModalOpen] = useState(false);
  // State for comments modal (independent of controls visibility)
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  // State for shuffle mode
  const [isShuffle, setIsShuffle] = useState(false);
  // State for current transition effect
  const [transitionEffect, setTransitionEffect] = useState(fixedEffect || "fade");
  // State for random effect when transitionEffect is "random"
  const [currentRandomEffect, setCurrentRandomEffect] = useState("none");
  // State for window dimensions (for responsive design)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  // State for control visibility (excludes comments modal)
  const [userControlsVisible, setUserControlsVisible] = useState(showControls);
  // State for next image loading status
  const [nextImageLoaded, setNextImageLoaded] = useState(true);
  // Ref to manage control visibility timeout
  const controlsTimeout = useRef(null);
  // Ref to track loaded images
  const loadedImages = useRef(new Set());

  // Log commentsData to verify it's an array
  //console.log("ImageSlider: commentsData received:", commentsData);

  /**
   * Updates the current index and notifies the parent
   * @param {number} newIndex - The new image index
   */
  const updateIndex = (newIndex) => {
    setCurrentIndex(newIndex);
    onIndexChange(newIndex);
  };

  /**
   * Formats image URLs to include webp format
   * @param {string} url - The image URL
   * @returns {string} Formatted URL
   */
  const formatImageUrl = (url) => {
    if (!url) return url;
    if (url.includes('?')) {
      if (!url.includes('format=webp')) {
        return `${url}&format=webp`;
      }
      return url;
    }
    return `${url}?format=webp`;
  };

  // Memoized formatted images array
  const formattedImages = useMemo(() => {
    return images.map((img) => formatImageUrl(img));
  }, [images]);

  /**
   * Gets the next image index based on shuffle mode
   * @returns {number} The next index
   */
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

  /**
   * Preloads the next image to ensure smooth transitions
   */
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

  /**
   * Updates window dimensions for responsive design
   */
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

  /**
   * Sets fixed effect if provided
   */
  useEffect(() => {
    if (fixedEffect) {
      setTransitionEffect(fixedEffect);
    }
  }, [fixedEffect]);

  /**
   * Handles autoplay functionality
   */
  useEffect(() => {
    if (!isPlaying || images.length === 0) return;
    const intervalId = setInterval(() => {
      if (nextImageLoaded) {
        updateIndex(getNextIndex());
      }
    }, timeToShow);
    return () => clearInterval(intervalId);
  }, [images, isPlaying, isShuffle, timeToShow, nextImageLoaded]);

  /**
   * Selects a random effect when transitionEffect is "random"
   */
  useEffect(() => {
    if (transitionEffect === "random") {
      const availableEffects = [
        "fade",
        "slide",
        "zoom",
        "rotate",
        "flip",
        "blur",
        "slideDown",
        "slideUp",
      ];
      const randomIndex = Math.floor(Math.random() * availableEffects.length);
      setCurrentRandomEffect(availableEffects[randomIndex]);
    }
  }, [currentIndex, transitionEffect]);

  /**
   * Handles manual navigation with optional autoplay pause
   * @param {number} newIndex - The new image index
   * @param {boolean} pauseAutoplay - Whether to pause autoplay
   */
  const handleManualNavigation = (newIndex, pauseAutoplay = true) => {
    updateIndex(newIndex);
    if (pauseAutoplay && isPlaying) {
      setIsPlaying(false);
    }
  };

  /**
   * Navigates to the next image
   */
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

  /**
   * Navigates to the previous image
   */
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

  /**
   * Toggles shuffle mode
   */
  const toggleShuffle = () => {
    setIsShuffle(!isShuffle);
  };

  /**
   * Toggles autoplay
   */
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  /**
   * Opens the effects selection modal
   */
  const openModal = () => {
    setModalOpen(true);
  };

  /**
   * Opens the comments modal
   */
  const openCommentsModal = () => {
    setCommentsModalOpen(true);
  };

  /**
   * Closes the comments modal
   */
  const closeCommentsModal = () => {
    setCommentsModalOpen(false);
  };

  /**
   * Handles effect selection from the modal
   * @param {string} effect - The selected effect
   */
  const handleEffectSelection = (effect) => {
    setTransitionEffect(effect);
    setModalOpen(false);
  };

  /**
   * Handles new comment addition and notifies parent
   * @param {object} newComment - The new comment object
   */
  const handleCommentAdded = (newComment) => {
    onCommentAdded(currentIndex, newComment);
  };

  // Transition effect classes
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

  // Background transition effect classes
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

  // Determine the current effect
  const chosenEffect = transitionEffect === "random" ? currentRandomEffect : transitionEffect;
  const effectClass = effectClasses[chosenEffect] || "";
  const bgEffectClass = bgEffectClasses[chosenEffect] || "";

  /**
   * Shows navigation controls on user interaction and hides them after 5 seconds
   */
  const handleUserInteraction = () => {
    setUserControlsVisible(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => {
      setUserControlsVisible(false);
    }, 5000);
  };

  // Cleanup controls timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    };
  }, []);

  /**
   * Downloads the current image
   * @param {Event} e - The click event
   */
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

  // Render empty state if no images
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
      {/* Image slider */}
      <div className="slider">
        <div className="image-wrapper">
          <img
            key={`bg-${currentIndex}-${chosenEffect}`}
            src={formattedImages[currentIndex]}
            alt={`Background image ${currentIndex}`}
            className={`background-image ${bgEffectClass}`}
          />
          <img
            key={`${currentIndex}-${chosenEffect}`}
            src={formattedImages[currentIndex]}
            alt={`Image ${currentIndex}`}
            className={`slideImage ${effectClass}`}
          />
        </div>
      </div>

      {/* Loading overlay for next image */}
      {!nextImageLoaded && (
        <div className="loading-overlay">
          <SpinnerIcon size={dimensions.width < 768 ? 24 : 30} />
        </div>
      )}

      {/* Navigation controls (hidden after timeout) */}
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
          <CommentsIcon
              size={dimensions.width < 768 ? 24 : 30}
              onClick={openCommentsModal}
            />
          {controls.showComments && (
            <CommentsIcon
              size={dimensions.width < 768 ? 24 : 30}
              onClick={openCommentsModal}
            />
          )}
        </div>
      )}

      {/* Effects selection modal (hidden after timeout) */}
      {(!fixedEffect && userControlsVisible) && (
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
          <h2 style={{ color: "black", textAlign: "center", marginBottom: "15px" }}>
            Effects
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

      {/* Comments modal (stays open until manually closed) */}
      <Modal isOpen={commentsModalOpen} onClose={closeCommentsModal}>
        <div className="comments-container">
          <Comments
            commentsData={commentsData}
            userId={userId}
            memoryId={memoryId}
            token={token}
            uid={uid}
            root={root}
            fileId={fileId}
            onCommentAdded={handleCommentAdded}
            currentIndex={currentIndex}
          />
        </div>
      </Modal>
    </div>
  );
};

// PropTypes for ImageSlider
ImageSlider.propTypes = {
  images: PropTypes.arrayOf(PropTypes.string),
  controls: PropTypes.shape({
    showPrevious: PropTypes.bool,
    showPlayPause: PropTypes.bool,
    showNext: PropTypes.bool,
    showShuffle: PropTypes.bool,
    showEffects: PropTypes.bool,
    showDownload: PropTypes.bool,
    showComments: PropTypes.bool,
  }),
  fixedEffect: PropTypes.string,
  timeToShow: PropTypes.number,
  showControls: PropTypes.bool,
  initializeAutomatically: PropTypes.bool,
  style: PropTypes.object,
  initialCurrentIndex: PropTypes.number,
  onIndexChange: PropTypes.func,
  commentsData: PropTypes.array,
  userId: PropTypes.string,
  memoryId: PropTypes.string,
  token: PropTypes.string,
  uid: PropTypes.string,
  root: PropTypes.string,
  fileId: PropTypes.string,
  onCommentAdded: PropTypes.func,
};

export default ImageSlider;



































/*import { useState, useEffect, useRef, useMemo } from "react";
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
  //console.log(images);
  


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


  const formatImageUrl = (url) => {
    if (!url) return url;
    
    // Si ya tiene parámetros, agregamos format=webp al final
    if (url.includes('?')) {
      // Verificamos si ya tiene format=webp
      if (!url.includes('format=webp')) {
        return `${url}&format=webp`;
      }
      return url;
    }
    // Si no tiene parámetros, agregamos ?format=webp
    return `${url}?format=webp`;
  };

  const formattedImages = useMemo(() => {
    return images.map(img => formatImageUrl(img));
  }, [images]);

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
            src={formattedImages[currentIndex]}
            alt={`Background image ${currentIndex}`}
            className={`background-image ${bgEffectClass}`}
          />
          <img
            key={`${currentIndex}-${chosenEffect}`}
            src={formattedImages[currentIndex]}
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

export default ImageSlider;*/


