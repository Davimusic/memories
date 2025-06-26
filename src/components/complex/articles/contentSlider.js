import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import Image from 'next/image';
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
import Paragraphs from './paragraphs';

const ContentSlider = ({
  contents: rawContents,
  autoSlide = false,
  slideInterval = 1000,
  size = 'medium'
}) => {
  // Memoize contents to prevent unnecessary updates
  const contents = useMemo(() => rawContents, [JSON.stringify(rawContents)]);

  // Log para verificar contents (descomentar para depurar)
  // console.log('Contents:', contents);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Ref para rastrear el estado de pausa
  const pausedRef = useRef(paused);
  useEffect(() => { pausedRef.current = paused }, [paused]);

  // Ref para almacenar el ID del intervalo
  const intervalRef = useRef(null);

  // Component map para renderizar diferentes tipos de contenido
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
          width={600}
          height={400}
          className="slider-image"
          loading="lazy"
        />
      </div>
    ),
    video: ({
      url,
      controls = true,
      autoPlay = false,
      muted = true,
      loop = true
    }) => (
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

  /*/ Manejo del autoSlide con un único intervalo
  useEffect(() => {
    // Log para verificar ejecución del efecto (descomentar para depurar)
    // console.log('useEffect ejecutado', { autoSlide, slideInterval, contentsLength: contents.length });

    if (!autoSlide || contents.length < 2) {
      // Limpiar intervalo si existe
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Establecer intervalo solo si no existe uno activo
    if (!intervalRef.current) {
      intervalRef.current = setInterval(() => {
        // Log para verificar disparo del intervalo (descomentar para depurar)
        // console.log('Intervalo disparado, paused:', pausedRef.current);
        if (!pausedRef.current) {
          setCurrentIndex(i => (i + 1) % contents.length);
        }
      }, slideInterval);
    }

    // Limpieza al desmontar o cuando cambian las dependencias
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoSlide, slideInterval, contents.length]);*/

  const goToNext = () =>
    setCurrentIndex(i => (i + 1) % contents.length);

  const goToPrev = () =>
    setCurrentIndex(i => (i === 0 ? contents.length - 1 : i - 1));

  const goToSlide = idx => setCurrentIndex(idx);

  const handleMouseEnter = () => setPaused(true);
  const handleMouseLeave = () => setPaused(false);

  if (!contents || contents.length === 0) return null;

  const { type, props } = contents[currentIndex];
  const Slide = componentMap[type] || (() => (
    <div className="text-center p-8">
      Tipo no soportado: {type}
    </div>
  ));

  return (
    <div
      className={`content-slider ${size}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="slider-container relative">
        <div className="slide-content">
          <Slide {...props} />
        </div>

        {contents.length > 1 && (
          <>
            <button className="slider-nav prev" onClick={goToPrev} aria-label="Anterior">
              👈
            </button>
            <button className="slider-nav next" onClick={goToNext} aria-label="Siguiente">
              👉
            </button>
          </>
        )}
      </div>

      {contents.length > 1 && (
        <div className="slider-dots">
          {contents.map((_, i) => (
            <button
              key={i}
              className={`dot ${i === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(i)}
              aria-label={`Ir al slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Memoize el componente para evitar re-renders innecesarios
export default memo(ContentSlider);