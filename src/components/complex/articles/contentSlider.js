import React, { useState, useRef, useEffect } from 'react';
import TableRenderer from './tableRenderer';
import Accordion from './accordion';
import CTABlock from './CTABlock';
import LinksRenderer from './linksRenderer';
import VideosRenderer from './videosRenderer';
import ImagesRenderer from './imagesRenderer';
import AudiosRenderer from './audiosRenderer';
import SocialShare from './socialShare';
import Modal from './modal';
import ProgressBar from './progressBar';
import FeedbackForm from './feedbackForm';
import Tooltip from './tooltip';
import CustomQuote from './customQuote';
import CodeBlock from './codeBlock';
import ImageTextBlock from './imageTextBlock';
import EmbedBlock from './embedBlock';
import Image from 'next/image';
import Paragraphs from './paragraphs';

const ContentSlider = ({ 
  contents, 
  autoSlide = false, 
  slideInterval = 5000,
  size = 'medium' 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  const componentMap = {
    text: ({ content }) => <Paragraphs data={{ content }} />,
    table: TableRenderer,
    accordion: Accordion,
    cta: CTABlock,
    links: LinksRenderer,
    videos: VideosRenderer,
    images: ImagesRenderer,
    audios: AudiosRenderer,
    socialShare: SocialShare,
    modal: Modal,
    progressBar: ProgressBar,
    feedbackForm: FeedbackForm,
    tooltip: Tooltip,
    customQuote: CustomQuote,
    codeBlock: CodeBlock,
    imageText: ImageTextBlock,
    embed: EmbedBlock,
    image: ({ url, alt }) => (
      <div className="slide-content-image">
        <Image 
          src={url} 
          alt={alt} 
          className="slider-image"
          width={600}
          height={400}
          loading="lazy"
        />
      </div>
    ),
    video: ({ url, controls = true, autoPlay = false, muted = true, loop = true }) => (
      <video 
        src={url} 
        controls={controls}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        className="slider-video"
      />
    ),
    custom: ({ component, ...props }) => {
      const CustomComponent = componentMap[component] || (() => null);
      return (
        <div className="custom-component-container">
          <CustomComponent {...props} />
        </div>
      );
    }
  };

  useEffect(() => {
    if (autoSlide && !paused && contents.length > 1) {
      timerRef.current = setTimeout(() => {
        goToNext();
      }, slideInterval);
    }
    return () => clearTimeout(timerRef.current);
  }, [currentIndex, autoSlide, paused, slideInterval, contents.length]);

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % contents.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? contents.length - 1 : prevIndex - 1
    );
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const handleMouseEnter = () => setPaused(true);
  const handleMouseLeave = () => setPaused(false);

  if (!contents || contents.length === 0) return null;

  const currentContent = contents[currentIndex];
  const Component = componentMap[currentContent.type] || (() => (
    <div className="text-center p-8">Tipo de componente no soportado: {currentContent.type}</div>
  ));

  return (
    <div 
      className={`content-slider ${size}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="slider-container relative">
        <div className="slide-content">
          <Component {...currentContent.props} />
        </div>
        {contents.length > 1 && (
          <>
            <button 
              className="slider-nav prev"
              onClick={goToPrev}
              aria-label="Slide anterior"
            >
              👈
            </button>
            <button 
              className="slider-nav next"
              onClick={goToNext}
              aria-label="Slide siguiente"
            >
              👉
            </button>
          </>
        )}
      </div>
      {contents.length > 1 && (
        <div className="slider-dots">
          {contents.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Ir al slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ContentSlider