import React, { Fragment, useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import '../../estilos/general/information.css';
import MemoryLogo from '@/components/complex/memoryLogo';



const ContentSlider = ({ 
  contents, 
  autoSlide = false, 
  slideInterval = 5000,
  size = 'medium' 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  // Mapeo de tipos de componentes a sus implementaciones
  const componentMap = {
    text: TextRenderer,
    table: TableRenderer,
    accordion: Accordion,
    cta: CTABlock,
    links: LinksRenderer,
    videos: VideosRenderer,
    images: ImagesRenderer,
    audios: AudiosRenderer,
    socialShare: SocialShare,
    countdown: Countdown,
    pagination: Pagination,
    modal: Modal,
    progressBar: ProgressBar,
    feedbackForm: FeedbackForm,
    tooltip: Tooltip,
    customQuote: CustomQuote,
    codeBlock: CodeBlock,
    image: ({ url, alt }) => (
    <img 
      src={url} 
      alt={alt} 
      className="object-contain"
    />
  ),
  
  video: ({ url, controls = true, autoPlay = false, muted = true, loop = true }) => (
    <video 
  src={url} 
  controls={controls}
  autoPlay={autoPlay}
  muted={muted}
  loop={loop}
  style={{
    width: '100%',
    height: 'auto',
    objectFit: 'contain',
    display: 'block'
  }}
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

  // Manejar auto-desplazamiento
  useEffect(() => {
    if (autoSlide && !paused && contents.length > 1) {
      timerRef.current = setTimeout(() => {
        goToNext();
      }, slideInterval);
    }
    
    return () => clearTimeout(timerRef.current);
  }, [currentIndex, autoSlide, paused, slideInterval]);

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
        
        {/* Navegación */}
        {contents.length > 1 && (
          <>
            <button 
              className="slider-nav prev"
              onClick={goToPrev}
              aria-label="Slide anterior"
            >
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path d="M15 18L9 12L15 6" stroke="currentColor" />
              </svg>
            </button>
            
            <button 
              className="slider-nav next"
              onClick={goToNext}
              aria-label="Slide siguiente"
            >
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path d="M9 18L15 12L9 6" stroke="currentColor" />
              </svg>
            </button>
          </>
        )}
      </div>
      
      {/* Indicadores (dots) */}
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

// Componente para cita personalizada
const CustomQuote = ({ quote, author }) => {
  return (
    <div className={'footer'} style={{ borderRadius: '20px'}}>
        
        <p>{quote}</p>
      
      {author}
    </div>
  );
};


// Componente para renderizar texto con markdown básico, incluyendo soporte para acordeones
const TextRenderer = ({ text }) => {
  const renderFormattedText = (content) => {
    const lines = content.split('\n');
    const elements = [];
    let i = 0;

    // Helper function to parse inline bold formatting
    const parseInlineFormatting = (line) => {
      const parts = [];
      let currentIndex = 0;

      // Regular expression to match **text**
      const boldRegex = /\*\*([^\*]+)\*\*/g;
      let match;

      while ((match = boldRegex.exec(line)) !== null) {
        const beforeText = line.slice(currentIndex, match.index);
        if (beforeText) parts.push(beforeText);
        parts.push(<strong key={currentIndex}>{match[1]}</strong>);
        currentIndex = match.index + match[0].length;
      }

      // Add any remaining text after the last bold section
      if (currentIndex < line.length) {
        parts.push(line.slice(currentIndex));
      }

      return parts.length > 1 ? parts : line;
    };

    while (i < lines.length) {
      const line = lines[i].trim();

      // Detect and render divs with IDs as HTML elements
      if (line.startsWith('<div id=') && line.endsWith('></div>')) {
        const idMatch = line.match(/id='([^']+)'/);
        if (idMatch) {
          elements.push(<div key={i} id={idMatch[1]}></div>);
        }
        i++;
      } else if (line.startsWith('[accordion title="')) {
        const titleMatch = line.match(/\[accordion title="([^"]+)"\]/);
        if (titleMatch) {
          const title = titleMatch[1];
          const accordionContent = [];
          i++;
          while (i < lines.length && !lines[i].startsWith('[/accordion]')) {
            accordionContent.push(lines[i]);
            i++;
          }
          elements.push(
            <Accordion key={i} title={title}>
              <TextRenderer text={accordionContent.join('\n')} />
            </Accordion>
          );
          i++; // Skip closing [/accordion]
        }
      } else if (line.startsWith('### ')) {
        const parsedContent = parseInlineFormatting(line.substring(4));
        elements.push(<h3 key={i}>{parsedContent}</h3>);
        i++;
      } else if (line.startsWith('|') && line.endsWith('|')) {
        const tableLines = [];
        while (i < lines.length && lines[i].startsWith('|')) {
          tableLines.push(lines[i]);
          i++;
        }
        elements.push(<TableRenderer key={i} content={tableLines.join('\n')} />);
        continue;
      } else if (line.startsWith('```')) {
        const codeLines = [line];
        i++;
        while (i < lines.length && !lines[i].startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        if (i < lines.length) codeLines.push(lines[i]);
        elements.push(<CodeBlock key={i} content={codeLines.join('\n')} />);
        i++;
      } else if (line.trim() === '') {
        elements.push(<br key={i} />);
        i++;
      } else {
        // Parse inline formatting for paragraphs
        const parsedContent = parseInlineFormatting(line);
        elements.push(<p key={i}>{parsedContent}</p>);
        i++;
      }
    }

    return elements;
  };

  return <div className="article-body">{renderFormattedText(text)}</div>;
};

// Componente para tablas en markdown
const TableRenderer = ({ content }) => {
  const rows = content.split('\n').filter(row => row.trim().startsWith('|'));
  
  if (rows.length < 2) return null;

  const headers = rows[0].split('|').filter(Boolean).map(h => h.trim());
  const dataRows = rows.slice(1).map(row => row.split('|').filter(Boolean).map(c => c.trim()));

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            {headers.map((header, i) => (
              <th key={i}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataRows.map((cells, rowIndex) => (
            <tr key={rowIndex}>
              {cells.map((cell, cellIndex) => (
                <td key={cellIndex} dangerouslySetInnerHTML={{ __html: cell }} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Componente para bloques de código
const CodeBlock = ({ content }) => {
  const codeLines = content.split('\n');
  if (codeLines.length < 3) return null;
  
  const language = codeLines[0].replace(/```(\w+)?/, '$1') || 'jsx';
  const code = codeLines.slice(1, -1).join('\n');
  
  return (
    <div className="code-block">
      <div className="code-header">{language.toUpperCase()}</div>
      <div className="code-content">
        <pre><code>{code}</code></pre>
      </div>
    </div>
  );
};

// Componente para lista de enlaces
const LinksRenderer = ({ links }) => {
  if (!links || links.length === 0) return null;
  
  return (
    <div className="additional-resources">
      <h3>Additional Resources</h3>
      <ul className="additional-links">
        {links.map((link, index) => (
          <li key={index}>
            <a href={link} target="_blank" rel="noopener noreferrer">{link}</a>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Componente para lista de videos
const VideosRenderer = ({ videos }) => {
  if (!videos || videos.length === 0) return null;

  return (
    <div className="related-videos py-8">
      <h3 className="text-2xl font-bold mb-4">Related Videos</h3>
      <div className="video-grid">
        {videos.map((video, index) => (
          <div key={index} className="video-container">
            <iframe
              width="100%"
              height="315"
              src={`https://www.youtube.com/embed/${video.split('v=')[1]}`}
              title={`Video ${index + 1}`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        ))}
      </div>
    </div>
  );
};

// Componente para lista de imágenes
const ImagesRenderer = ({ images }) => {
  if (!images || images.length === 0) return null;

  return (
    <div style={{ padding: '2rem 0' }}>
      <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Related Images</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {images.map((image, index) => (
          <div
            key={index}
            style={{
              width: '100%',
              height: '50vh',
              overflow: 'hidden',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            }}
          >
            <img
              src={image.url}
              alt={image.alt || `Image ${index}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.3s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
};



// Componente para renderizar contenido individual dentro del slider

// Componente para acordeón
const Accordion = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    setContentHeight(isOpen ? contentRef.current.scrollHeight : 0);
  }, [isOpen]);

  const toggleAccordion = () => setIsOpen(!isOpen);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleAccordion();
    }
  };

  return (
    <div className={`accordion ${isOpen ? 'open' : ''}`}>
      <h3>
        <button
          className="accordion-header"
          onClick={toggleAccordion}
          onKeyDown={handleKeyDown}
          aria-expanded={isOpen}
          aria-controls={`accordion-content-${title.replace(/\s+/g, '-')}`}
        >
          {title}
          <span className="accordion-icon" aria-hidden="true">
            {isOpen ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 10L8 4L14 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            )}
          </span>
        </button>
      </h3>
      <div
        id={`accordion-content-${title.replace(/\s+/g, '-')}`}
        className="accordion-content"
        ref={contentRef}
        style={{ maxHeight: `${contentHeight}px`, overflow: 'hidden', transition: 'max-height 0.3s ease-out' }}
        aria-hidden={!isOpen}
      >
        <div className="accordion-inner">{children}</div>
      </div>
    </div>
  );
};

// Componente para modal
const Modal = ({ trigger, title, children, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef(null);

  const openModal = () => {
    setIsOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setIsOpen(false);
    document.body.style.overflow = 'auto';
    if (onClose) onClose();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) closeModal();
    };

    const handleEsc = (event) => {
      if (event.key === 'Escape') closeModal();
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEsc);
      const focusableElements = modalRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusableElements.length > 0) focusableElements[0].focus();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen]);

  return (
    <>
      <div onClick={openModal}>{trigger}</div>
      {isOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="modal-content light-mode" ref={modalRef}>
            <div className="modal-header">
              <h2 id="modal-title">{title}</h2>
              <button className="modal-close" onClick={closeModal} aria-label="Close modal">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">{children}</div>
            <div className="modal-footer">
              <button className="modal-secondary-button" onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Componente para llamada a la acción
const CTABlock = ({ title, description, buttonText, onClick, href, variant = 'primary', icon = null }) => {
  const handleClick = (e) => {
    if (!href) {
      e.preventDefault();
      if (onClick) onClick();
    }
  };

  return (
    <div className={`cta-block ${variant}`}>
      <div className="cta-content">
        {title && <h3 className="cta-title">{title}</h3>}
        {description && <p className="cta-description">{description}</p>}
      </div>
      <a href={href || '#'} className={`cta-button ${variant}`} onClick={handleClick}>
        {icon && <span className="cta-icon" dangerouslySetInnerHTML={{ __html: icon }} />}
        {buttonText}
      </a>
    </div>
  );
};

// Componente para barra de progreso
const ProgressBar = ({ percentage, type = 'linear', message, color = 'primary', size = 'medium' }) => {
  if (type === 'circular') {
    const strokeWidth = 8;
    const radius = 50 - strokeWidth / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className={`progress-circular ${size}`}>
        <svg className="circular-svg" viewBox="0 0 100 100" aria-valuenow={percentage} aria-valuemin="0" aria-valuemax="100">
          <circle className="circular-bg" cx="50" cy="50" r={radius} strokeWidth={strokeWidth} />
          <circle
            className={`circular-progress ${color}`}
            cx="50"
            cy="50"
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="circular-text">
          {percentage}%
          {message && <span className="circular-message">{message}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className={`progress-linear ${size}`} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div className="progress-info" style={{ whiteSpace: 'nowrap' }}>
        {message && <span className="progress-message">{message}</span>}
        
      </div>
      <div className="progress-track" style={{ flex: 1 }} role="progressbar" aria-valuenow={percentage} aria-valuemin="0" aria-valuemax="100">
        <div className={`progress-bar ${color}`} style={{ width: `${percentage}%` }}></div>
      </div>
      <span className="progress-percentage">{percentage}%</span>
    </div>
  );
};

// Componente para compartir en redes sociales
const SocialShare = ({ url, title, description, platforms = ['facebook', 'twitter', 'linkedin', 'whatsapp'], size = 'medium', color = 'brand' }) => {
  const shareOn = (platform) => {
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(description)}`,
      whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} - ${url}`)}`,
      pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(description)}`,
      email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${description}\n\n${url}`)}`
    };

    if (platform === 'email') {
      window.location.href = shareUrls[platform];
    } else {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };

  const getPlatformIcon = (platform) => {
    const icons = {
      facebook: <i className="fab fa-facebook-f"></i>,
      twitter: <i className="fab fa-twitter"></i>,
      linkedin: <i className="fab fa-linkedin-in"></i>,
      whatsapp: <i className="fab fa-whatsapp"></i>,
      pinterest: <i className="fab fa-pinterest-p"></i>,
      email: <i className="fas fa-envelope"></i>
    };
    return icons[platform];
  };

  return (
    <>
    {/*<div className={`social-share ${size} ${color}`}>
      {platforms.map((platform) => (
        <button
          key={platform}
          className={`social-button ${platform}`}
          onClick={() => shareOn(platform)}
          aria-label={`Share on ${platform}`}
        >
          {getPlatformIcon(platform)}
        </button>
      ))}
    </div>*/}
    </>
  );
};

// Componente para migas de pan
const Breadcrumb = ({ items, separator = '/', color = 'primary' }) => {
  return (
    <nav className={`breadcrumb ${color}`} aria-label="Breadcrumb">
      <ol>
        {items.map((item, index) => (
          <li key={index} className="breadcrumb-item">
            {index === items.length - 1 ? (
              <span aria-current="page" className="breadcrumb-current">{item.label}</span>
            ) : (
              <>
                <a href={item.path} className="breadcrumb-link">{item.label}</a>
                {index < items.length - 1 && (
                  <span className="breadcrumb-separator" aria-hidden="true">{separator}</span>
                )}
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

// Componente para barra de búsqueda
const SearchBar = ({ onSearch, placeholder = "Search...", size = 'medium', variant = 'default', defaultValue = '', autoFocus = false }) => {
  const [query, setQuery] = useState(defaultValue);
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) onSearch(query);
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current.focus();
  };

  useEffect(() => {
    if (autoFocus && inputRef.current) inputRef.current.focus();
  }, [autoFocus]);

  return (
    <>
    {/*<div className={`search-bar ${size} ${variant}`} role="search">
      <div className="search-input-container">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          aria-label="Search content"
          ref={inputRef}
        />
        {query && (
          <button type="button" className="search-clear" onClick={handleClear} aria-label="Clear search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>
      <button type="button" className="search-button" onClick={handleSubmit} aria-label="Perform search">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>*/}
    </>
  );
};

// Componente para formulario de retroalimentación
const FeedbackForm = ({ onSubmit, title = "Send Your Feedback", submitText = "Submit Feedback", showRatings = true }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return false;
    }
    if (!email.trim()) {
      setError('Please enter your email');
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Please enter a valid email');
      return false;
    }
    if (!message.trim()) {
      setError('Please enter your message');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      await onSubmit({ name, email, message, rating: showRatings ? rating : null });
      setSubmitted(true);
    } catch (err) {
      setError('An error occurred while submitting the form. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="feedback-success">
        <div className="success-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h3 className="success-title">Thank You for Your Feedback!</h3>
        <p className="success-message">We have received your message successfully.</p>
      </div>
    );
  }

  return (
    <div className="feedback-form">
      <h3 className="feedback-title">{title}</h3>
      {error && <div className="feedback-error">{error}</div>}
      <div className="form-group">
        <label htmlFor="feedback-name">Name</label>
        <input type="text" id="feedback-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="form-group">
        <label htmlFor="feedback-email">Email</label>
        <input type="email" id="feedback-email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      {showRatings && (
        <div className="form-group">
          <label>Rating</label>
          <div className="rating-container">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`rating-star ${star <= (hoverRating || rating) ? 'active' : ''}`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                aria-label={`Rate with ${star} ${star === 1 ? 'star' : 'stars'}`}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="form-group">
        <label htmlFor="feedback-message">Message</label>
        <textarea id="feedback-message" value={message} onChange={(e) => setMessage(e.target.value)} rows="5" required></textarea>
      </div>
      <button type="button" className="submit-button" onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? (
          <>
            <svg className="spinner" viewBox="0 0 50 50">
              <circle cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
            </svg>
            Submitting...
          </>
        ) : (
          submitText
        )}
      </button>
    </div>
  );
};

// Componente para paginación
const Pagination = ({ totalItems, itemsPerPage, currentPage, onPageChange, maxVisiblePages = 5, showFirstLast = true, showPrevNext = true }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  if (totalPages <= 1) return null;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) onPageChange(page);
  };

  const getPageNumbers = () => {
    const half = Math.floor(maxVisiblePages / 2);
    let start = Math.max(currentPage - half, 1);
    let end = Math.min(start + maxVisiblePages - 1, totalPages);
    
    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(end - maxVisiblePages + 1, 1);
    }
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return (
    <div className="pagination" aria-label="Pagination">
      <ul>
        {showFirstLast && (
          <li className={`pagination-item first ${currentPage === 1 ? 'disabled' : ''}`}>
            <button onClick={() => handlePageChange(1)} disabled={currentPage === 1} aria-label="First page">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 12H19M19 12L12 19M19 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </li>
        )}
        {showPrevNext && (
          <li className={`pagination-item previous ${currentPage === 1 ? 'disabled' : ''}`}>
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} aria-label="Previous page">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </li>
        )}
        {getPageNumbers().map(page => (
          <li key={page} className={`pagination-item ${page === currentPage ? 'active' : ''}`}>
            <button
              onClick={() => handlePageChange(page)}
              aria-current={page === currentPage ? 'page' : undefined}
              aria-label={`Page ${page}`}
            >
              {page}
            </button>
          </li>
        ))}
        {showPrevNext && (
          <li className={`pagination-item next ${currentPage === totalPages ? 'disabled' : ''}`}>
            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} aria-label="Next page">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </li>
        )}
        {showFirstLast && (
          <li className={`pagination-item last ${currentPage === totalPages ? 'disabled' : ''}`}>
            <button onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} aria-label="Last page">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 12H5M5 12L12 5M5 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </li>
        )}
      </ul>
      <div className="pagination-info">
        Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
      </div>
    </div>
  );
};

// Componente para tooltip
const Tooltip = ({ content, position = 'top', children, delay = 300, disabled = false }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({});
  const tooltipRef = useRef(null);
  const triggerRef = useRef(null);
  let timeout;

  const calculatePosition = () => {
    if (triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      let top, left;
      
      switch (position) {
        case 'top':
          top = triggerRect.top - tooltipRect.height - 10;
          left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
          break;
        case 'bottom':
          top = triggerRect.bottom + 10;
          left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
          break;
        case 'left':
          top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
          left = triggerRect.left - tooltipRect.width - 10;
          break;
        case 'right':
          top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
          left = triggerRect.right + 10;
          break;
        default:
          top = triggerRect.top - tooltipRect.height - 10;
          left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
      }
      
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      if (left < 10) left = 10;
      if (left + tooltipRect.width > viewportWidth - 10) left = viewportWidth - tooltipRect.width - 10;
      if (top < 10) top = 10;
      if (top + tooltipRect.height > viewportHeight - 10) top = viewportHeight - tooltipRect.height - 10;
      
      setCoords({ top, left });
    }
  };

  const showTooltip = () => {
    if (disabled) return;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      setIsVisible(true);
      calculatePosition();
    }, delay);
  };

  const hideTooltip = () => {
    clearTimeout(timeout);
    setIsVisible(false);
  };

  useEffect(() => {
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="tooltip-container">
      <div ref={triggerRef} onMouseEnter={showTooltip} onMouseLeave={hideTooltip} onFocus={showTooltip} onBlur={hideTooltip} tabIndex={0} aria-describedby={isVisible ? `tooltip-${content.replace(/\s+/g, '-')}` : undefined}>
        {children}
      </div>
      {isVisible && (
        <div
          id={`tooltip-${content.replace(/\s+/g, '-')}`}
          ref={tooltipRef}
          className={`tooltip ${position}`}
          style={{ top: `${coords.top}px`, left: `${coords.left}px`, opacity: coords.top ? 1 : 0 }}
          role="tooltip"
        >
          {content}
          <span className="tooltip-arrow" aria-hidden="true"></span>
        </div>
      )}
    </div>
  );
};

// Componente para cuenta regresiva
const Countdown = ({ targetDate, onComplete, format = 'long', size = 'medium', color = 'primary' }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [hasEnded, setHasEnded] = useState(false);
  const intervalRef = useRef(null);

  const calculateTimeLeft = () => {
    const difference = new Date(targetDate) - new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    } else {
      setHasEnded(true);
      if (onComplete) onComplete();
      clearInterval(intervalRef.current);
    }

    return timeLeft;
  };

  useEffect(() => {
    setTimeLeft(calculateTimeLeft());
    intervalRef.current = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(intervalRef.current);
  }, [targetDate]);

  const formatTime = (value) => value.toString().padStart(2, '0');

  if (hasEnded) {
    return (
      <div className={`countdown-ended ${size} ${color}`}>
        <div className="ended-message">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>The event has started!</span>
        </div>
      </div>
    );
  }

  if (format === 'compact') {
    return (
      <div className={`countdown-compact ${size} ${color}`}>
        <div className="countdown-item">
          <span className="countdown-value">{formatTime(timeLeft.days)} days</span>
          <span className="countdown-separator">, </span>
          <span className="countdown-value">{formatTime(timeLeft.hours)} hours</span>
          <span className="countdown-separator">, </span>
          <span className="countdown-value">{formatTime(timeLeft.minutes)} min</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`countdown ${size} ${color}`}>
      <div className="countdown-item">
        <span className="countdown-value">{formatTime(timeLeft.days)}</span>
        <span className="countdown-label">Days</span>
      </div>
      <div className="countdown-separator">,</div>
      <div className="countdown-item">
        <span className="countdown-value">{formatTime(timeLeft.hours)}</span>
        <span className="countdown-label">Hours</span>
      </div>
      <div className="countdown-separator">,</div>
      <div className="countdown-item">
        <span className="countdown-value">{formatTime(timeLeft.minutes)}</span>
        <span className="countdown-label">Min</span>
      </div>
      <div className="countdown-separator">,</div>
      <div className="countdown-item">
        <span className="countdown-value">{formatTime(timeLeft.seconds)}</span>
        <span className="countdown-label">Sec</span>
      </div>
    </div>
  );
};

// Componente para audios
const AudiosRenderer = ({ audios }) => {
  if (!audios || audios.length === 0) return null;

  return (
    <div className="related-audios py-8">
      <h3 className="text-2xl font-bold mb-4">Related Audios</h3>
      <div className="audioContainer">
        {audios.map((audio, index) => (
          <div key={index} className="">
            <p className="text-sm font-semibold mb-2">
              {typeof audio === 'string' ? `Audio ${index + 1}` : audio.title || `Audio ${index + 1}`}
            </p>
            <audio
              src={typeof audio === 'string' ? audio : audio.url}
              controls
              className="w-full"
              aria-label={typeof audio === 'string' ? `Audio ${index + 1}` : audio.title || `Audio ${index + 1}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// Componente de Layout
const Layout = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollPercentage, setScrollPercentage] = useState(0);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark-mode');
      document.documentElement.classList.remove('light-mode');
    } else {
      document.documentElement.classList.add('light-mode');
      document.documentElement.classList.remove('dark-mode');
    }
  }, [darkMode]);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY;
      const percentage = Math.min((scrolled / totalHeight) * 100, 100);
      setScrollPercentage(Math.round(percentage));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleDarkMode = () => setDarkMode(!darkMode);
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  return (
    <Fragment>
      <Head>
        <title>Digital Memories - Memory Platform</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </Head>
      
      <nav className={`navbar ${darkMode ? 'dark' : ''}`}>
        <div className="navbar-container">
          <Tooltip content="Visit the Digital Memories homepage">
            <div className="navbar-brand">
              <MemoryLogo size={40}/>
              <span>Digital Memories</span>
            </div>
          </Tooltip>
          
          <div className={`navbar-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            <a href="#"><i className="fas fa-home"></i> Home</a>
            <a href="#"><i className="fas fa-book"></i> Articles</a>
            <a href="#"><i className="fas fa-images"></i> Gallery</a>
            <a href="#"><i className="fas fa-user-friends"></i> Community</a>
            <Modal
              trigger={<a href="#" onClick={(e) => e.preventDefault()}><i className="fas fa-comment"></i> Feedback</a>}
              title="Send Your Feedback"
            >
              <FeedbackForm onSubmit={(data) => console.log('Feedback submitted:', data)} />
            </Modal>
          </div>
          
          <div className="navbar-actions">
            <SearchBar onSearch={(query) => console.log('Searching:', query)} />
            <button className="theme-toggle" onClick={toggleDarkMode} aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
              {darkMode ? <i className="fas fa-sun"></i> : <i className="fas fa-moon"></i>}
            </button>
          </div>
          
          <button className="mobile-menu-button" onClick={toggleMobileMenu} aria-label="Toggle navigation menu">
            {mobileMenuOpen ? <i className="fas fa-times"></i> : <i className="fas fa-bars"></i>}
          </button>
        </div>
        <ProgressBar percentage={scrollPercentage} message="Reading Progress" size="small" />
      </nav>
      
      <main className={`main-content ${darkMode ? 'dark' : ''}`}>{children}</main>
      
      <footer className={`footer ${darkMode ? 'dark' : ''}`}>
        <div className="footer-container">
          <div className="footer-section">
            <h3>Digital Memories</h3>
            <p>Preserving your most cherished moments for future generations.</p>
            <div className="social-icons">
              <a href="#" aria-label="Facebook"><i className="fab fa-facebook"></i></a>
              <a href="#" aria-label="Twitter"><i className="fab fa-twitter"></i></a>
              <a href="#" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
              <a href="#" aria-label="Pinterest"><i className="fab fa-pinterest"></i></a>
            </div>
          </div>
          <div className="footer-section">
            <h3>Quick Links</h3>
            <ul>
              <li><a href="#">About Us</a></li>
              <li><a href="#">Our Services</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms and Conditions</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>Resources</h3>
            <ul>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Tutorials</a></li>
              <li><a href="#">FAQ</a></li>
              <li><a href="#">Technical Support</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>Contact</h3>
            <ul>
              <li><i className="fas fa-map-marker-alt"></i> 123 Technology Ave, Digital City</li>
              <li><i className="fas fa-phone"></i> +1 234 567 890</li>
              <li><i className="fas fa-envelope"></i> info@digitalmemories.com</li>
            </ul>
            <Modal
              trigger={<button className="footer-feedback-button">Give Feedback</button>}
              title="Send Your Feedback"
            >
              <FeedbackForm onSubmit={(data) => console.log('Feedback submitted:', data)} />
            </Modal>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Digital Memories. All rights reserved.</p>
        </div>
      </footer>
    </Fragment>
  );
};

const ContentBlockRenderer = ({ block }) => {
  const { type, props } = block;

  switch (type) {
    case 'text':
      return <TextRenderer {...props} />;
    case 'table':
      return (
        <table className="table-of-contents">
          <thead>
            <tr>
              {props.headers.map((header, index) => (
                <th key={index}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {props.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} dangerouslySetInnerHTML={{ __html: cell }} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    case 'accordion':
      return (
        <Accordion {...props}>
          {props.children &&
            props.children.map((child, index) => (
              <ContentBlockRenderer key={index} block={child} />
            ))}
        </Accordion>
      );
    case 'cta':
      return <CTABlock {...props} />;
    case 'links':
      return <LinksRenderer {...props} />;
    case 'videos':
      return <VideosRenderer {...props} />;
    case 'images':
      return <ImagesRenderer {...props} />;
    case 'image':
      return <img src={props.url} alt={props.alt} className="w-full-image h-auto" />;
    case 'audios':
      return <AudiosRenderer {...props} />;
    case 'contentSlider':
      return <ContentSlider {...props} />;
    case 'socialShare':
      return <SocialShare {...props} />;
    case 'countdown':
      return <Countdown {...props} />;
    case 'pagination':
      return <Pagination {...props} onPageChange={(page) => props.onPageChange && props.onPageChange(page)} />;
    case 'modal':
      return (
        <Modal {...props}>
          {props.children &&
            props.children.map((child, index) => (
              <ContentBlockRenderer key={index} block={child} />
            ))}
        </Modal>
      );
    case 'customQuote':
      return <CustomQuote {...props} />;
    case 'feedbackForm':
      return <FeedbackForm {...props} />;
    default:
      console.warn(`Unsupported block type: ${type}`);
      return null;
  }
};

// Componente principal del artículo
const ArticleRenderer = ({ article }) => {
  const router = useRouter();
  const { information } = router.query;

  if (!article) return <div>Loading article...</div>;

  return (
    <Fragment>
      <Head>
        <title>{article.title}</title>
        <meta name="description" content={article.seo.description} />
        <meta name="keywords" content={article.seo.keywords} />
      </Head>
      
      <div className="article-container">
        <article>
          <Breadcrumb items={article.breadcrumbs} />
          <div className="article-header">
            <h1>{article.title}</h1>
            <p>{article.seo.description}</p>
          </div>
          
          {article.content.map((block, index) => (
            <ContentBlockRenderer key={index} block={block} />
          ))}
          
          <div className="article-footer">
            <div className="tags-container">
              {article?.seo?.tags ? (
  article.seo.tags.split(',').map((tag, index) => (
    <span key={index} className="tag">{tag.trim()}</span>
  ))
) : null}
            </div>
          </div>
        </article>
      </div>
    </Fragment>
  );
};

const articlesData = {
  "id": "article-happy-memories-20250616",
  "type": "article",
  "title": "How Humans Create Happy Memories: The Neuroscience of Positive Recall",
  "seo": {
    "description": "Discover evidence-based techniques to intentionally create joyful memories. Neuroscience reveals how emotion, attention, and neuroplasticity shape lasting happiness.",
    "keywords": "happy memories, neuroscience, positive psychology, memory formation, emotional well-being, neuroplasticity",
    "metaTags": {
      "og:title": "How Humans Create Happy Memories: Science-Backed Techniques",
      "og:image": "https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a",
      "og:url": "https://yourdomain.com/neuroscience/happy-memories",
      "twitter:card": "summary_large_image",
      "twitter:creator": "@NeuroScienceInsights",
      "article:published_time": "2025-06-16T08:00:00Z"
    }
  },
  "breadcrumbs": [
    {"label": "Home", "path": "/"},
    {"label": "Neuroscience", "path": "/neuroscience"},
    {"label": "Memory Formation"}
  ],
  "content": [
    {
      "type": "text",
      "props": {
        "text": "## Table of Contents\n1. [The Neurobiology of Happy Memories](#neurobiology)\n2. [Memory Formation Techniques](#techniques-table)\n3. [Science of Positive Encoding](#encoding)\n4. [Proven Memory-Building Methods](#methods)\n5. [Savoring & Anticipation Effects](#savoring)\n6. [Cognitive Reframing Mechanics](#reframing)\n7. [Social Amplification](#sharing)\n8. [Sleep Optimization](#sleep)\n9. [Expert Resources](#resources)"
      }
    },
    {
      "type": "text",
      "props": {
        "text": "<div id='neurobiology'></div>\n## The Neurobiology of Happy Memories\nOur brains actively construct positive memories through three neural mechanisms:\n\n- **Amygdala-Hippocampus Circuit**: Emotional intensity tags memories for long-term storage\n- **Dopaminergic Signaling**: Novelty detection flags experiences worth remembering\n- **Multi-Sensory Integration**: Rich sensory details create redundant retrieval pathways\n\nHarvard neuroscientist Dr. Lisa Feldman Barrett explains: \"We're not passive recorders but active constructors of emotional meaning. Each recall literally rewires the memory.\""
      }
    },
    {
      "type": "text",
      "props": {
        "text": "<div id='techniques-table'></div>\n### Memory Formation Techniques"
      }
    },
    {
      "type": "table",
      "props": {
        "headers": ["Technique", "Neural Mechanism", "Effectiveness"],
        "rows": [
          ["<a href='#savoring'>Savoring</a>", "Prefrontal cortex activation", "31% recall boost"],
          ["<a href='#reframing'>Positive Reframing</a>", "Hippocampal pattern separation", "27% emotional enhancement"],
          ["<a href='#sharing'>Social Sharing</a>", "Mirror neuron reinforcement", "3.2x recall frequency"],
          ["<a href='#sleep'>Sleep Consolidation</a>", "Slow-wave memory replay", "142% detail retention"]
        ]
      }
    },
    {
      "type": "contentSlider",
      "props": {
        "contents": [
          {
            "type": "image",
            "props": {
              "url": "https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a",
              "alt": "fMRI scan showing hippocampal activation during positive recall"
            }
          },
          {
            "type": "customQuote",
            "props": {
              "quote": "Happiness depends on the quality of our memories as much as our experiences. We can engineer joy by strategically designing recollection.",
              "author": "Dr. Rick Hanson, neuroscientist"
            }
          },
          {
            "type": "text",
            "props": {
              "text": "**Neurochemical Triggers of Joyful Recall**\n- Oxytocin: Bonds social experiences to emotional memory\n- Dopamine: Flags novel experiences as worth remembering\n- Serotonin: Stabilizes positive emotional states\n\nCombined effect creates 42% stronger encoding than neutral events (Nature Neuroscience)"
            }
          }
        ],
        "autoSlide": true,
        "slideInterval": 8000
      }
    },
    {
      "type": "text",
      "props": {
        "text": "<div id='encoding'></div>\n## The Science of Positive Encoding\nMemory formation follows predictable neurobiological stages:\n\n1. **Attention Phase**: Focused awareness activates dorsolateral prefrontal cortex\n2. **Emotional Tagging**: Amygdala assigns valence significance within 250ms\n3. **Consolidation**: Hippocampus binds sensory fragments during sleep\n4. **Reconsolidation**: Each recall makes memories malleable for updating\n\nYale psychologist Dr. Laurie Santos notes: \"We dramatically underestimate how small positive moments compound into lasting joy when properly encoded.\""
      }
    },
    {
      "type": "accordion",
      "props": {
        "title": "<div id='methods'></div>Evidence-Based Memory Building",
        "defaultOpen": true,
        "children": [
          {
            "type": "text",
            "props": {
              "text": "### 4 Research-Backed Techniques\n\n**1. Focused Savoring**\nSustain attention on positive moments for 20+ seconds to extend amygdala activation\n\n**2. Sensory Layering**\nEngage 3+ senses simultaneously (Journal of Experimental Psychology shows 68% stronger recall)\n\n**3. Narrative Structuring**\nTransform experiences into stories with emotional turning points (4x more retrievable)\n\n**4. Future Projection**\nImagine recalling the moment later to activate prefrontal consolidation pathways"
            }
          }
        ]
      }
    },
    {
      "type": "videos",
      "props": {
        "videos": [
          "https://www.youtube.com/watch?v=4q1dgn_C0AU" // Laurie Santos TED Talk
        ]
      }
    },
    {
      "type": "text",
      "props": {
        "text": "<div id='savoring'></div>\n## The Savoring Paradox\nfMRI studies reveal counterintuitive findings:\n\n- Anticipation activates prefrontal cortex 28% more than the actual experience\n- Dopamine peaks 48-72 hours before special occasions\n- Recalling positive events sustains elevated mood longer than the original experience\n\n> \"We extract more happiness from remembering than from experiencing.\" - Daniel Kahneman, Nobel laureate"
      }
    },
    {
      "type": "text",
      "props": {
        "text": "<div id='reframing'></div>\n## Cognitive Reframing Mechanics\nOur brains edit memories during recall through:\n\n- **Valence Updating**: Negative events gain positive aspects after 3+ recalls\n- **Detail Enhancement**: Adding new sensory details increases hippocampal flexibility\n- **Temporal Distortion**: Rosy recollection effect intensifies after 18 months\n\nUC Berkeley research shows writing about trauma with 30% positive reinterpretations reduces PTSD symptoms by 41%"
      }
    },
    {
      "type": "images",
      "props": {
        "images": [
          {
            "url": "https://images.unsplash.com/photo-1506126613408-eca07ce68773",
            "alt": "Woman journaling positive memories at sunset"
          }
        ]
      }
    },
    {
      "type": "text",
      "props": {
        "text": "<div id='sharing'></div>\n## Social Amplification Effect\nSharing joyful moments triggers neurological reinforcement:\n\n1. Verbal narration activates auditory processing centers\n2. Listener reactions create emotional mirroring via mirror neurons\n3. Joint attention strengthens hippocampal encoding\n\nOxford studies found memories shared within 72 hours with 2+ people become 83% more persistent"
      }
    },
    {
      "type": "audios",
      "props": {
        "audios": [
          "https://ondemand.npr.org/anon.npr-mp3/npr/science/2024/05/20240516_science_memoryconsolidation.mp3"
        ]
      }
    },
    {
      "type": "text",
      "props": {
        "text": "<div id='sleep'></div>\n## Sleep's Memory Optimization\nDuring REM sleep:\n\n- Emotional memories undergo selective reactivation\n- Negative associations are chemically decoupled\n- Positive valence is enhanced through noradrenaline suppression\n\nParticipants recalling happy events after 8 hours sleep reported 37% stronger positive feelings (Journal of Sleep Research)"
      }
    },
    {
      "type": "customQuote",
      "props": {
        "quote": "The most potent happiness technology is free: Consciously design attention to build reserves of positive memories that sustain through challenges.",
        "author": "Dr. Barbara Fredrickson, positivity researcher"
      }
    },
    {
      "type": "text",
      "props": {
        "text": "<div id='resources'></div>\n## Expert Resources"
      }
    },
    {
      "type": "cta",
      "props": {
        "title": "The Happiness Hypothesis",
        "description": "Positive psychology research by Jonathan Haidt",
        "buttonText": "View Book",
        "href": "https://www.basicbooks.com/titles/jonathan-haidt/the-happiness-hypothesis/9780465028023/",
        "variant": "text"
      }
    },
    {
      "type": "cta",
      "props": {
        "title": "Hardwiring Happiness",
        "description": "Neuroscience-based techniques by Rick Hanson",
        "buttonText": "Explore Methods",
        "href": "https://www.rickhanson.net/books/hardwiring-happiness/",
        "variant": "text"
      }
    },
    {
      "type": "cta",
      "props": {
        "title": "The Science of Well-Being",
        "description": "Yale's popular course on Coursera",
        "buttonText": "Enroll Now",
        "href": "https://www.coursera.org/learn/the-science-of-well-being",
        "variant": "text"
      }
    },
    {
      "type": "socialShare",
      "props": {
        "url": "https://yourdomain.com/neuroscience/happy-memories",
        "title": "How Humans Create Happy Memories: Neuroscience Reveals",
        "description": "Evidence-based techniques to build lasting joyful recollection",
        "platforms": ["twitter", "facebook", "linkedin"],
        "size": "medium"
      }
    },
    {
      "type": "feedbackForm",
      "props": {
        "onSubmit": "submitFeedback",
        "title": "Share Your Experience",
        "submitText": "Submit Memory Technique",
        "fields": [
          {"name": "name", "type": "text", "label": "Name (optional)"},
          {"name": "technique", "type": "textarea", "label": "Your memory method", "required": true}
        ],
        "showRatings": true
      }
    }
  ]
}

// Component principal de la página
export default function ArticlePage() {
  const router = useRouter();
  const { information } = router.query;

  // Placeholder for data fetching logic
  const article = information ? articlesData : null;

  return (
    <Layout>
      <ArticleRenderer article={article} />
    </Layout>
  );
};