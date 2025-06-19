import React, { Fragment, useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import '../../estilos/general/information.css';
import MemoryLogo from '@/components/complex/memoryLogo';
import { marked } from 'marked';

const TableOfContents = ({ content }) => {
  const htmlContent = marked(content, {
    renderer: new marked.Renderer(),
    gfm: true,
    breaks: true,
  });

  const handleClick = (e, href) => {
    e.preventDefault();
    const targetId = href.replace('#', '');
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Tabla de Contenidos</h2>
      <div
        className="toc-content"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        onClick={(e) => {
          if (e.target.tagName === 'A' && e.target.getAttribute('href').startsWith('#')) {
            handleClick(e, e.target.getAttribute('href'));
          }
        }}
      />
    </div>
  );
};

const Paragraphs = ({ data }) => {
  console.log('Paragraphs data:', data);
  const { title = '', content = [] } = data || {};
  if (!title && content.length === 0) {
    console.warn('Paragraphs: No title or content provided');
    return null;
  }

  const parseContent = (text) => {
    if (!text || typeof text !== 'string') return text;

    const lines = text.split('\n');
    let isList = false;
    const elements = [];
    let currentListItems = [];

    lines.forEach((line, index) => {
      const listMatch = line.match(/^\s*-\s*(.+)$/);
      const parseInline = (str) => {
        const parts = [];
        let lastIndex = 0;
        const regex = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)/g;
        let match;
        while ((match = regex.exec(str)) !== null) {
          const before = str.slice(lastIndex, match.index);
          if (before) parts.push(before);
          if (match[1]) {
            console.log('Bold match:', match[1]);
            parts.push(
              <span
                key={`${match.index}-bold-${match[1]}`}
                style={{ fontWeight: 700, color: '#2563eb' }}
              >
                {match[1]}
              </span>
            );
          } else if (match[2] && match[3]) {
            console.log('Link match:', match[2], match[3]);
            parts.push(
              <a
                key={`${match.index}-link-${match[2]}`}
                href={match[3]}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#3b82f6', textDecoration: 'underline' }}
                onMouseOver={(e) => (e.target.style.color = '#1d4ed8')}
                onMouseOut={(e) => (e.target.style.color = '#3b82f6')}
              >
                {match[2]}
              </a>
            );
          }
          lastIndex = match.index + match[0].length;
        }
        if (lastIndex < str.length) parts.push(str.slice(lastIndex));
        return parts.length > 0 ? parts : str;
      };

      if (listMatch) {
        isList = true;
        const listText = listMatch[1];
        currentListItems.push(
          <li key={index} style={{ marginBottom: '0.25rem' }}>
            {parseInline(listText)}
          </li>
        );
      } else {
        if (isList && currentListItems.length > 0) {
          elements.push(
            <ul
              key={`list-${index}`}
              style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginBottom: '1rem' }}
            >
              {currentListItems}
            </ul>
          );
          currentListItems = [];
          isList = false;
        }
        if (line.trim()) {
          elements.push(
            <span key={index} style={{ display: 'block', marginBottom: '1rem' }}>
              {parseInline(line)}
            </span>
          );
        }
      }
    });

    if (isList && currentListItems.length > 0) {
      elements.push(
        <ul key="list-end" style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginBottom: '1rem' }}>
          {currentListItems}
        </ul>
      );
    }

    return elements;
  };

  return (
    <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '1rem' }}>
      {title && <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>{title}</h2>}
      {content.map((block, index) => {
        const { text = '', highlight = '', continueText = '' } = block;
        if (!text && !highlight && !continueText) {
          console.warn(`Paragraphs: Empty content block at index ${index}`);
          return null;
        }

        let combinedText = text;
        if (highlight) combinedText += ` **${highlight}**`;
        if (continueText) combinedText += ` ${continueText}`;

        console.log('Combined text:', combinedText);

        const parsedContent = parseContent(combinedText);

        return (
          <div key={index} style={{ marginBottom: '1rem', color: '#1f2937' }}>
            {parsedContent}
          </div>
        );
      })}
    </div>
  );
};

const CreateSectionWrapper = ({ referenceId, children }) => {
  if (!referenceId || typeof referenceId !== 'string') {
    throw new Error('referenceId is required and must be a string');
  }
  return (
    <section 
      id={referenceId}
      role="region"
      aria-labelledby={`${referenceId}-heading`}
      className="w-full max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg my-6"
    >
      <div className="flex flex-col gap-4">
        {children}
      </div>
    </section>
  );
};

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
        <img 
          src={url} 
          alt={alt} 
          className="slider-image"
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

const CustomQuote = ({ quote, author }) => {
  return (
    <div className='CustomQuoteText'>
      <div className={'CustomQuoteAutor'} style={{ borderRadius: '20px'}}>
        <p>{quote}</p>
      </div>
      {author}
    </div>
  );
};

const TableRenderer = ({ content, headers, rows }) => {
  const parseCellContent = (cell) => {
    if (!cell || typeof cell !== 'string') return cell;

    const cleanCell = cell.replace(/^\s*-\s*/, '').trim();

    const parts = [];
    let lastIndex = 0;
    const regex = /\*\*(.+?)\*\*/g;
    let match;
    while ((match = regex.exec(cleanCell)) !== null) {
      const before = cleanCell.slice(lastIndex, match.index);
      if (before) parts.push(before);
      parts.push(
        <span key={`${match.index}-${match[1]}`} className="font-bold text-blue-600" style={{ fontWeight: 700 }}>
          {match[1]}
        </span>
      );
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < cleanCell.length) parts.push(cleanCell.slice(lastIndex));

    return parts.length > 0 ? parts : cleanCell;
  };

  if (content) {
    const rows = content.split('\n').filter((row) => row.trim().startsWith('|'));
    if (rows.length < 2) return null;
    const parsedHeaders = rows[0].split('|').filter(Boolean).map((h) => h.trim());
    const dataRows = rows.slice(2).map((row) =>
      row
        .split('|')
        .filter(Boolean)
        .map((c) => parseCellContent(c.trim()))
    );

    return (
      <div className="table-container">
        <table>
          <thead className="tableTitle">
            <tr>
              {parsedHeaders.map((header, i) => (
                <th key={i}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((cells, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 1 ? 'alternate-row' : ''}>
                {cells.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (headers && rows) {
    return (
      <div className="table-container">
        <table>
          <thead>
            <tr>
              {headers.map((header, i) => (
                <th className="tableTitle" key={i}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((cells, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 1 ? 'alternate-row' : ''}>
                {cells.map((cell, cellIndex) => (
                  <td key={cellIndex}>{parseCellContent(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <style jsx>{`
          .table-container {
            overflow-x: auto;
            margin: 1rem 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th,
          td {
            border: 1px solid #e5e7eb;
            padding: 0.5rem;
            text-align: left;
          }
          .tableTitle {
            background-color: #f3f4f6;
            font-weight: bold;
          }
          .alternate-row {
            background-color: #f9fafb;
          }
          .font-bold {
            font-weight: 700 !important;
          }
        `}</style>
      </div>
    );
  }

  return null;
};

const LinksRenderer = ({ text, url }) => {
  if (!text || !url) return null;
  return (
    <div className="additional-resource">
      <h3>Additional Resource</h3>
      <ul className="additional-links">
        <li>
          <a href={url} target="_blank" rel="noopener noreferrer">
            {text}
          </a>
        </li>
      </ul>
    </div>
  );
};

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
                objectFit: 'contain',
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
              <button className="submit-button" onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

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
    <div className={`social-share ${size} ${color}`}>
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
    </div>
  );
};

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

const Layout = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollPercentage, setScrollPercentage] = useState(0);
  const mobileMenuRef = useRef(null);
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
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && 
          !mobileMenuRef.current.contains(event.target) &&
          !event.target.closest('.mobile-menu-button')) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const toggleDarkMode = () => setDarkMode(!darkMode);
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  return (
    <Fragment>
      <Head>
        <title>Good Memories - Memory Platform</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </Head>
      <nav className={`navbar ${darkMode ? 'dark' : ''}`}>
        <div className="navbar-container">
          <Tooltip content="Visit the Good Memories homepage">
            <div className="navbar-brand">
              <MemoryLogo size={40}/>
              <span>Good Memories</span>
            </div>
          </Tooltip>
          <div 
            ref={mobileMenuRef}
            className={`navbar-links ${mobileMenuOpen ? 'mobile-open' : ''}`}
            id="mobile-menu"
            aria-hidden={!mobileMenuOpen}
          >
            <a href="#"><i className="fas fa-home"></i> Home</a>
            <a href="#"><i className="fas fa-book"></i> Articles</a>
            <a href="#"><i className="fas fa-images"></i> Gallery</a>
            <a href="#"><i className="fas fa-user-friends"></i> Community</a>
            <button 
              className="theme-toggle" 
              onClick={toggleDarkMode} 
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <i className="fas fa-sun"></i> : <i className="fas fa-moon"></i>}
            </button>
          </div>
          <button 
            className="mobile-menu-button" 
            onClick={toggleMobileMenu}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? <i className="fas fa-times"></i> : <i className="fas fa-bars"></i>}
          </button>
        </div>
        <ProgressBar percentage={scrollPercentage} message="Reading Progress" size="small" />
      </nav>
      <main className={`main-content ${darkMode ? 'dark' : ''}`}>{children}</main>
      <footer className={`footer ${darkMode ? 'dark' : ''}`}>
        <div className="footer-container">
          <div className="footer-section">
            <h3>Good Memories</h3>
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
          <p>© {new Date().getFullYear()} Good Memories. All rights reserved.</p>
        </div>
      </footer>
    </Fragment>
  );
};

const ImageTextBlock = ({ imageUrl, imageAlt, text, layout = 'left', imageSize = 'medium' }) => {
  console.log('ImageTextBlock props:', { imageUrl, imageAlt, text, layout, imageSize });
  const imageClass = `image-${imageSize}`;
  const containerClass = `image-text-container ${layout}`;
  const paragraphData = {
    content: [{ text: text || 'No text provided for this image' }],
  };
  return (
    <div className={containerClass}>
      {layout === 'left' || layout === 'top' ? (
        <>
          <img style={{ borderRadius: '20px' }} src={imageUrl} alt={imageAlt} className={imageClass} />
          <div className="text-content">
            <Paragraphs data={paragraphData} />
          </div>
        </>
      ) : (
        <>
          <div className="text-content">
            <Paragraphs data={paragraphData} />
          </div>
          <img src={imageUrl} alt={imageAlt} className={imageClass} />
        </>
      )}
    </div>
  );
};

const EmbedBlock = ({ src, type, width = '100%', height = 'auto', allowFullScreen = true }) => {
  if (type === 'video') {
    return (
      <video
        src={src}
        controls
        width={width}
        height={height}
        allowFullScreen={allowFullScreen}
        style={{ maxWidth: '100%' }}
      />
    );
  } else if (type === 'iframe' || type === 'embed') {
    return (
      <iframe
        src={src}
        width={width}
        height={height}
        frameBorder="0"
        allowFullScreen={allowFullScreen}
        style={{ maxWidth: '100%' }}
      />
    );
  } else {
    return <div>Unsupported embed type: {type}</div>;
  }
};

const ContentBlockRenderer = ({ block }) => {
  console.log('ContentBlockRenderer block:', block);
  if (!block || !block.type) {
    console.warn('ContentBlockRenderer: Invalid block provided');
    return null;
  }
  const { type, props = {} } = block;
  switch (type) {
    case 'text':
      return <Paragraphs data={props} />;
    case 'tableOfContents':
      return <TableOfContents content={props.content} />;
    case 'imageText':
      return <ImageTextBlock {...props} />;
    case 'embed':
      return <EmbedBlock {...props} />;
    case 'table':
      return <TableRenderer {...props} />;
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
    case 'codeBlock':
      return <CodeBlock {...props} />;
    case 'createSectionWrapper':
      const { referenceId, children } = props;
      return (
        <CreateSectionWrapper referenceId={referenceId}>
          {children &&
            children.map((child, index) => (
              <ContentBlockRenderer key={index} block={child} />
            ))}
        </CreateSectionWrapper>
      );
    case 'feedbackForm':
      return <FeedbackForm {...props} onSubmit={props.onSubmit || ((data) => console.log('Feedback:', data))} />;
    default:
      console.warn(`Unsupported block type: ${type}`);
      return null;
  }
};

const articlesData = {
  "slug": "memory-formation2XD",
  "title": "Cómo se crean los recuerdos según la ciencia: Un viaje fascinante por la memoria",
  "seo": {
    "description": "Explora cómo se forman los recuerdos en el cerebro, los tipos de memoria, casos fascinantes como Henry Molaison y Solomon Shereshevsky, y técnicas para mejorar el aprendizaje.",
    "keywords": "memoria, recuerdos, neurociencia, hipocampo, plasticidad sináptica, Henry Molaison, Solomon Shereshevsky",
    "tags": "memoria, ciencia, neurociencia, aprendizaje, psicología"
  },
  "breadcrumbs": [
    { "label": "Home", "path": "/" },
    { "label": "Artículos", "path": "/articles" },
    { "label": "Cómo se crean los recuerdos", "path": "/articles/memory-formation" }
  ],
  "content": [
    {
      "type": "tableOfContents",
      "props": {
        "title": "¿Qué encontrarás en este artículo?",
        "content": "1. [Introducción: La magia de la memoria](#introduccion)\n2. [La ciencia detrás de la formación de los recuerdos](#ciencia-formacion)\n   - [¿Qué es la memoria?](#que-es-memoria)\n   - [Las etapas de la memoria](#etapas-memoria)\n   - [El cerebro y la memoria](#cerebro-memoria)\n   - [Plasticidad sináptica](#plasticidad-sinaptica)\n   - [Consolidación y reconsolidación](#consolidacion)\n3. [Tipos de memoria](#tipos-memoria)\n4. [Distorsiones y recuerdos falsos](#distorsiones)\n5. [Casos notables](#casos-notables)\n   - [Henry Molaison (H.M.)](#henry-molaison)\n   - [Solomon Shereshevsky](#solomon-shereshevsky)\n6. [Técnicas de memoria](#tecnicas-memoria)\n7. [Memoria y aprendizaje](#memoria-aprendizaje)\n8. [Perspectivas culturales](#perspectivas-culturales)\n9. [Conclusión](#conclusion)"
      }
    },
    {
      "type": "createSectionWrapper",
      "props": {
        "referenceId": "introduccion",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "Introducción: La magia de la memoria",
              "content": [
                {
                  "text": "Imagina que estás caminando por una calle conocida y, de repente, el aroma de un pan recién horneado te transporta a la cocina de tu abuela. En un instante, puedes recordar su risa, el calor del horno y hasta el sabor de ese pan. ¿Cómo logra tu cerebro revivir un momento que ocurrió hace años? La memoria es como un mago que saca recuerdos del sombrero, pero su truco no es magia: es ciencia.",
                  "highlight": "La memoria es un proceso dinámico",
                  "continueText": " que involucra cambios físicos y químicos en el cerebro. Cada vez que aprendes algo nuevo o vives una experiencia, tu cerebro reconfigura sus conexiones para guardar esa información. En este artículo, exploraremos cómo ocurre este proceso, los diferentes tipos de memoria y casos fascinantes que han cambiado nuestra comprensión de la mente humana."
                },
                {
                  "text": "Consideremos dos historias que han marcado la neurociencia: ",
                  "highlight": "Henry Molaison (H.M.)",
                  "link": { "text": "Simply Psychology", "url": "https://www.simplypsychology.org/henry-molaison-patient-hm.html" },
                  "continueText": ", quien perdió la capacidad de formar nuevos recuerdos tras una cirugía, y "
                },
                {
                  "highlight": "Solomon Shereshevsky",
                  "link": { "text": "Psychology Today", "url": "https://www.psychologytoday.com/us/blog/the-memory-factory/202106/the-curious-case-mr-s-and-his-memory" },
                  "continueText": ", un periodista con una memoria prodigiosa pero abrumadora. Acompáñanos en este viaje para descubrir los secretos de tu mente."
                }
              ]
            }
          },
          {
            "type": "imageText",
            "props": {
              "imageUrl": "https://goodmemoriesapp.b-cdn.net/mediaDinamicWeb/images/Copilot_20250618_142235.png",
              "imageAlt": "",
              "text": "Las conexiones neuronales en el cerebro se fortalecen con cada nuevo recuerdo, un proceso fascinante que exploraremos a fondo.",
              "layout": "right",
              "imageSize": "medium"
            }
          }
        ]
      }
    },
    {
      "type": "createSectionWrapper",
      "props": {
        "referenceId": "ciencia-formacion",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "La ciencia detrás de la formación de los recuerdos",
              "content": [
                {
                  "text": "La formación de recuerdos es un proceso complejo que ocurre en múltiples niveles dentro del cerebro. Desde la activación de neuronas hasta la creación de conexiones sinápticas, la memoria es el resultado de una danza intrincada entre células y moléculas."
                }
              ]
            }
          },
          {
            "type": "accordion",
            "props": {
              "title": "¿Qué es la memoria?",
              "defaultOpen": true,
              "children": [
                {
                  "type": "text",
                  "props": {
                    "content": [
                      {
                        "text": "La memoria es la capacidad del cerebro para codificar, almacenar y recuperar información. No es un proceso único, sino un sistema complejo con varias etapas:",
                        "highlight": "Codificación, almacenamiento y recuperación."
                      },
                      {
                        "text": "- **Codificación**: Transformar la información en un formato que el cerebro pueda procesar, como cuando memorizas un nombre.\n- **Almacenamiento**: Guardar esa información para usarla más tarde, ya sea por segundos o por décadas.\n- **Recuperación**: Acceder a la información almacenada cuando la necesitas, como recordar dónde estacionaste tu coche."
                      }
                    ]
                  }
                }
              ]
            }
          },
          {
            "type": "accordion",
            "props": {
              "title": "Las etapas de la memoria",
              "defaultOpen": true,
              "children": [
                {
                  "type": "text",
                  "props": {
                    "content": [
                      {
                        "text": "La memoria se divide en tres etapas principales, cada una con un propósito específico:",
                        "highlight": "Memoria sensorial, a corto plazo y a largo plazo."
                      },
                      {
                        "text": "- **Memoria sensorial**: Es la más breve, dura solo unos segundos y captura información de los sentidos. Por ejemplo, la memoria icónica te permite 'ver' una imagen fugaz después de que desaparece, como un relámpago ([Lesley University](https://lesley.edu/article/stages-of-memory)).\n- **Memoria a corto plazo (MCP)**: Retiene información por 20-30 segundos y tiene una capacidad limitada (unos 7 elementos). Es lo que usas para mantener un número de teléfono en tu mente mientras lo marcas.\n- **Memoria a largo plazo (MLP)**: Almacena información por períodos prolongados, desde horas hasta toda la vida. Incluye recuerdos de eventos personales, conocimientos generales y habilidades."
                      }
                    ]
                  }
                }
              ]
            }
          },
          {
            "type": "accordion",
            "props": {
              "title": "El cerebro y la memoria",
              "defaultOpen": true,
              "children": [
                {
                  "type": "text",
                  "props": {
                    "content": [
                      {
                        "text": "El cerebro es el escenario donde se forman los recuerdos, y varias regiones trabajan juntas:",
                        "highlight": "Hipocampo, corteza cerebral y amígdala."
                      },
                      {
                        "text": "- **Hipocampo**: Ubicado en el lóbulo temporal medial, es esencial para codificar nuevos recuerdos explícitos. Actúa como un 'índice' que organiza la información antes de transferirla a otras áreas ([Queensland Brain Institute](https://qbi.uq.edu.au/memory/where-are-memories-stored)).\n- **Corteza cerebral**: Almacena los recuerdos a largo plazo. Diferentes tipos de recuerdos se guardan en áreas específicas, como los visuales en la corteza occipital.\n- **Amígdala**: Modula la memoria emocional, haciendo que los eventos intensos, como un susto, sean más memorables ([Live Science](https://www.livescience.com/how-the-brain-stores-memories))."
                      }
                    ]
                  }
                }
              ]
            }
          },
          {
            "type": "accordion",
            "props": {
              "title": "Plasticidad sináptica",
              "defaultOpen": true,
              "children": [
                {
                  "type": "text",
                  "props": {
                    "content": [
                      {
                        "text": "Los recuerdos se forman cuando las neuronas fortalecen o debilitan sus conexiones, un proceso llamado ",
                        "highlight": "plasticidad sináptica",
                        "continueText": ". Según el [Queensland Brain Institute](https://qbi.uq.edu.au/memory/how-are-memories-formed), esto ocurre a través de:"
                      },
                      {
                        "text": "- **Potenciación a largo plazo (LTP)**: Cuando dos neuronas se activan juntas repetidamente, su conexión se fortalece, facilitando la transmisión de señales. Es como pavimentar un camino que usas a menudo.\n- **Depresión a largo plazo (LTD)**: Las conexiones poco usadas se debilitan, permitiendo al cerebro 'limpiar' información irrelevante."
                      },
                      {
                        "text": "Eric Kandel, en su libro ",
                        "highlight": "In Search of Memory",
                        "continueText": " (2006), explica cómo estos cambios moleculares son la base de la memoria a largo plazo."
                      }
                    ]
                  }
                }
              ]
            }
          },
          {
            "type": "accordion",
            "props": {
              "title": "Consolidación y reconsolidación",
              "defaultOpen": true,
              "children": [
                {
                  "type": "text",
                  "props": {
                    "content": [
                      {
                        "text": "La ",
                        "highlight": "consolidación",
                        "continueText": " estabiliza los recuerdos para que no se pierdan. Hay dos tipos:"
                      },
                      {
                        "text": "- **Consolidación inicial**: Ocurre horas o días después de un evento y depende del hipocampo. Requiere la síntesis de proteínas ([PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC4246028/)).\n- **Consolidación sistémica**: Transfiere los recuerdos a la corteza cerebral, un proceso que puede tomar años."
                      },
                      {
                        "text": "La ",
                        "highlight": "reconsolidación",
                        "continueText": " ocurre cuando un recuerdo se reactiva y se vuelve temporalmente inestable, permitiendo modificaciones. Esto tiene aplicaciones en el tratamiento de trastornos como el TEPT ([Smithsonian Magazine](https://www.smithsonianmag.com/science-nature/how-our-brains-make-memories-14466850/))."
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    },
    {
      "type": "createSectionWrapper",
      "props": {
        "referenceId": "tipos-memoria",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "Tipos de memoria",
              "content": [
                {
                  "text": "La memoria no es un sistema único; se divide en varios tipos, cada uno con funciones específicas. La siguiente tabla resume los principales tipos de memoria y sus características."
                }
              ]
            }
          },
          {
            "type": "table",
            "props": {
              "content": "| Tipo | Descripción | Ejemplo |\n|------|-------------|---------|\n| **Memoria sensorial** | Retiene información sensorial por segundos. | Ver un relámpago y 'recordar' su imagen. |\n| **Memoria a corto plazo** | Almacena información temporalmente (20-30 segundos). | Recordar un número de teléfono. |\n| **Memoria a largo plazo** | Guarda información por períodos prolongados. | Saber montar en bicicleta. |\n| - **Explícita** | Recuerdos conscientes (episódica: eventos; semántica: hechos). | Recordar tu boda o la capital de Francia. |\n| - **Implícita** | Recuerdos inconscientes (procedimental: habilidades; priming: influencias). | Conducir un coche automáticamente. |"
            }
          }
        ]
      }
    },
    {
      "type": "createSectionWrapper",
      "props": {
        "referenceId": "distorsiones",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "Distorsiones y recuerdos falsos",
              "content": [
                {
                  "text": "La memoria no es un video perfecto del pasado; es una reconstrucción que puede fallar. Elizabeth Loftus, en ",
                  "highlight": "The Myth of Repressed Memory",
                  "continueText": " (1994), demostró que las sugestiones pueden crear recuerdos falsos. Por ejemplo, al preguntar a testigos si vieron un 'semáforo' en un accidente, muchos lo 'recordaron' aunque no existía."
                },
                {
                  "text": "Las emociones también distorsionan la memoria. Eventos traumáticos pueden parecer más intensos de lo que fueron, un fenómeno explorado por Julia Shaw en ",
                  "highlight": "The Memory Illusion",
                  "continueText": " (2016)."
                }
              ]
            }
          }
        ]
      }
    },
    {
      "type": "createSectionWrapper",
      "props": {
        "referenceId": "casos-notables",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "Casos notables",
              "content": [
                {
                  "text": "Algunos casos extraordinarios han ayudado a los científicos a entender mejor cómo funciona la memoria. A continuación, exploramos dos ejemplos emblemáticos."
                }
              ]
            }
          },
          {
            "type": "accordion",
            "props": {
              "title": "Henry Molaison (H.M.)",
              "defaultOpen": true,
              "children": [
                {
                  "type": "text",
                  "props": {
                    "content": [
                      {
                        "text": "En 1953, Henry Molaison se sometió a una cirugía que removió su hipocampo para tratar su epilepsia. Aunque sus convulsiones disminuyeron, perdió la capacidad de formar nuevos recuerdos explícitos. Su caso, descrito en ",
                        "highlight": "Permanent Present Tense",
                        "continueText": " de Suzanne Corkin (2013), mostró que el hipocampo es crucial para la memoria declarativa, pero no para la procedimental ([The Guardian](https://www.theguardian.com/science/2013/may/05/henry-molaison-amnesiac-corkin-book-feature))."
                      }
                    ]
                  }
                }
              ]
            }
          },
          {
            "type": "accordion",
            "props": {
              "title": "Solomon Shereshevsky",
              "defaultOpen": true,
              "children": [
                {
                  "type": "text",
                  "props": {
                    "content": [
                      {
                        "text": "Solomon Shereshevsky tenía una memoria extraordinaria debido a su sinestesia, que le permitía asociar números y palabras con colores y texturas. Sin embargo, su incapacidad para olvidar lo abrumaba. Alexander Luria documentó su caso en ",
                        "highlight": "The Mind of a Mnemonist",
                        "continueText": " (1968) ([The New Yorker](https://www.newyorker.com/books/page-turner/the-mystery-of-s-the-man-with-an-impossible-memory))."
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    },
    {
      "type": "createSectionWrapper",
      "props": {
        "referenceId": "tecnicas-memoria",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "Técnicas de memoria",
              "content": [
                {
                  "text": "Las técnicas mnemotécnicas, como el método de los loci, han sido usadas desde la antigüedad. Frances Yates, en ",
                  "highlight": "The Art of Memory",
                  "continueText": " (1966), describe cómo los oradores griegos imaginaban 'palacios' mentales para recordar discursos. Joshua Foer, en ",
                  "highlight": "Moonwalking with Einstein",
                  "continueText": " (2011), muestra cómo estas técnicas pueden transformar una memoria promedio en una excepcional ([Five Books](https://fivebooks.com/best-books/joshua-foer-on-memory/))."
                }
              ]
            }
          },
          {
            "type": "cta",
            "props": {
              "title": "¿Deseas tener tus recuerdos de manera especial?",
              "description": "Mira estos ejemplos",
              "buttonText": "Ver",
              "href": "/",
              "variant": "primary"
            }
          }
        ]
      }
    },
    {
      "type": "createSectionWrapper",
      "props": {
        "referenceId": "memoria-aprendizaje",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "Memoria y aprendizaje",
              "content": [
                {
                  "text": "Entender la memoria mejora el aprendizaje. En ",
                  "highlight": "Make It Stick",
                  "continueText": " (2014), Brown, Roediger y McDaniel recomiendan:"
                },
                {
                  "text": "- **Práctica de recuperación**: Probarte a ti mismo fortalece los recuerdos.\n- **Espaciado**: Estudiar a lo largo del tiempo es más efectivo que cramming.\n- **Intercalación**: Mezclar temas mejora la retención."
                }
              ]
            }
          }
        ]
      }
    },
    {
      "type": "createSectionWrapper",
      "props": {
        "referenceId": "perspectivas-culturales",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "Perspectivas culturales",
              "content": [
                {
                  "text": "La memoria tiene un significado cultural profundo. David Rubin, en ",
                  "highlight": "Memory in Oral Traditions",
                  "continueText": " (1995), explica cómo las sociedades orales usaban rimas y narrativas para preservar conocimientos. En la literatura, Marcel Proust, en ",
                  "highlight": "In Search of Lost Time",
                  "continueText": " (1913-1927), explora cómo los recuerdos involuntarios dan sentido a la vida."
                }
              ]
            }
          }
        ]
      }
    },
    {
      "type": "createSectionWrapper",
      "props": {
        "referenceId": "conclusion",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "Conclusión",
              "content": [
                {
                  "text": "La memoria es un proceso complejo que define nuestra identidad. Desde los cambios sinápticos hasta las técnicas culturales, la ciencia de la memoria nos ayuda a entender quiénes somos y cómo aprendemos. Casos como los de H.M. y Shereshevsky nos recuerdan que la memoria es tanto una herramienta poderosa como un desafío. Al comprenderla, podemos mejorar nuestra vida y enfrentar el futuro con mayor claridad."
                }
              ]
            }
          },
          {
            "type": "customQuote",
            "props": {
              "quote": "La memoria es el diario que todos llevamos con nosotros.",
              "author": "Oscar Wilde"
            }
          }
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
              "url": "https://goodmemoriesapp.b-cdn.net/mediaDinamicWeb/images/openart-image_KPf_LYiD_1750275030272_raw.jpg",
              "alt": "Imagen del cerebro humano"
            }
          },
          {
            "type": "text",
            "props": {
              "content": [
                {
                  "text": "Explora más sobre la neurociencia de la memoria en nuestra galería interactiva."
                }
              ]
            }
          }
        ],
        "autoSlide": true,
        "slideInterval": 5000,
        "size": "medium"
      }
    },
    {
      "type": "feedbackForm",
      "props": {
        "title": "Deja tu opinión",
        "submitText": "Enviar retroalimentación",
        "showRatings": true
      }
    }
  ],
  "updatedAt": "2025-06-18T12:00:00Z"
}

const ArticleRenderer = ({ article }) => {
  const router = useRouter();
  const canonicalUrl = `https://yourdomain.com${router.asPath}`;

  if (!article) return <div>Loading article...</div>;

  return (
    <Fragment>
      <Head>
        <title>{article.title}</title>
        <meta name="description" content={article.seo.description} />
        <meta name="keywords" content={article.seo.keywords} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.seo.description} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={article.seo.image || 'https://yourdomain.com/default-image.jpg'} />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={article.title} />
        <meta name="twitter:description" content={article.seo.description} />
        <meta name="twitter:image" content={article.seo.image || 'https://yourdomain.com/default-image.jpg'} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              "headline": article.title,
              "description": article.seo.description,
              "author": {
                "@type": "Person",
                "name": article.author || "Good Memories",
              },
              "datePublished": article.datePublished || new Date().toISOString(),
              "image": article.seo.image || 'https://yourdomain.com/default-image.jpg',
            }),
          }}
        />
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

export default function ArticlePage({ article }) {
  return (
    <Layout>
      <ArticleRenderer article={articlesData} />
    </Layout>
  );
};

export async function getServerSideProps(context) {
  const { information } = context.params; // Captura el parámetro dinámico, ej. "upload-article"


  console.log('information');
  console.log(information);
  


  try {
    // Construir la URL de la API dinámicamente usando el parámetro `information`
    const response = await fetch(`http://localhost:3000/api/mongoDb/dinamicArticles/articles/${information}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Verificar si la respuesta es exitosa
    if (!response.ok) {
      const errorResult = await response.json();
      console.error('Error fetching article:', errorResult.message);
      return {
        notFound: true, // Devuelve 404 si no se encuentra el artículo
      };
    }

    const result = await response.json();

    console.log(result); // Para depuración

    return {
      props: {
        article: result.data, // Pasa los datos del artículo a la página
      },
    };
  } catch (error) {
    console.error('Error en getServerSideProps:', {
      message: error.message,
      stack: error.stack,
      slug: information,
    });
    return {
      notFound: true, // Devuelve 404 en caso de error
    };
  }
}

/*export async function getServerSideProps(context) {
  const { information } = context.params;
  if (information === 'memory-formation') {
    return {
      props: {
        article: articlesData,
      },
    };
  } else {
    return {
      notFound: true,
    };
  }
}*/















































































/*import React, { Fragment, useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import '../../estilos/general/information.css';
import MemoryLogo from '@/components/complex/memoryLogo';
import { marked } from 'marked';

const TableOfContents = ({ content }) => {
  const htmlContent = marked(content, {
    renderer: new marked.Renderer(),
    gfm: true,
    breaks: true,
  });

  const handleClick = (e, href) => {
    e.preventDefault();
    const targetId = href.replace('#', '');
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Tabla de Contenidos</h2>
      <div
        className="toc-content"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        onClick={(e) => {
          if (e.target.tagName === 'A' && e.target.getAttribute('href').startsWith('#')) {
            handleClick(e, e.target.getAttribute('href'));
          }
        }}
      />
     
    </div>
  );
};


const Paragraphs = ({ data }) => {
  console.log('Paragraphs data:', data);
  const { title = '', content = [] } = data || {};
  if (!title && content.length === 0) {
    console.warn('Paragraphs: No title or content provided');
    return null;
  }

  const parseContent = (text) => {
    if (!text || typeof text !== 'string') return text;

    const lines = text.split('\n');
    let isList = false;
    const elements = [];
    let currentListItems = [];

    lines.forEach((line, index) => {
      const listMatch = line.match(/^\s*-\s*(.+)$/);
      const parseInline = (str) => {
        const parts = [];
        let lastIndex = 0;
        const regex = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)/g;
        let match;
        while ((match = regex.exec(str)) !== null) {
          const before = str.slice(lastIndex, match.index);
          if (before) parts.push(before);
          if (match[1]) {
            console.log('Bold match:', match[1]);
            parts.push(
              <span
                key={`${match.index}-bold-${match[1]}`}
                style={{ fontWeight: 700, color: '#2563eb' }}
              >
                {match[1]}
              </span>
            );
          } else if (match[2] && match[3]) {
            console.log('Link match:', match[2], match[3]);
            parts.push(
              <a
                key={`${match.index}-link-${match[2]}`}
                href={match[3]}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#3b82f6', textDecoration: 'underline' }}
                onMouseOver={(e) => (e.target.style.color = '#1d4ed8')}
                onMouseOut={(e) => (e.target.style.color = '#3b82f6')}
              >
                {match[2]}
              </a>
            );
          }
          lastIndex = match.index + match[0].length;
        }
        if (lastIndex < str.length) parts.push(str.slice(lastIndex));
        return parts.length > 0 ? parts : str;
      };

      if (listMatch) {
        isList = true;
        const listText = listMatch[1];
        currentListItems.push(
          <li key={index} style={{ marginBottom: '0.25rem' }}>
            {parseInline(listText)}
          </li>
        );
      } else {
        if (isList && currentListItems.length > 0) {
          elements.push(
            <ul
              key={`list-${index}`}
              style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginBottom: '1rem' }}
            >
              {currentListItems}
            </ul>
          );
          currentListItems = [];
          isList = false;
        }
        if (line.trim()) {
          elements.push(
            <span key={index} style={{ display: 'block', marginBottom: '1rem' }}>
              {parseInline(line)}
            </span>
          );
        }
      }
    });

    if (isList && currentListItems.length > 0) {
      elements.push(
        <ul key="list-end" style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginBottom: '1rem' }}>
          {currentListItems}
        </ul>
      );
    }

    return elements;
  };

  return (
    <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '1rem' }}>
      {title && <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>{title}</h2>}
      {content.map((block, index) => {
        const { text = '', highlight = '', continueText = '' } = block;
        if (!text && !highlight && !continueText) {
          console.warn(`Paragraphs: Empty content block at index ${index}`);
          return null;
        }

        let combinedText = text;
        if (highlight) combinedText += ` **${highlight}**`;
        if (continueText) combinedText += ` ${continueText}`;

        console.log('Combined text:', combinedText);

        const parsedContent = parseContent(combinedText);

        return (
          <div key={index} style={{ marginBottom: '1rem', color: '#1f2937' }}>
            {parsedContent}
          </div>
        );
      })}
    </div>
  );
};







const CreateSectionWrapper = ({ referenceId, children }) => {
  if (!referenceId || typeof referenceId !== 'string') {
    throw new Error('referenceId is required and must be a string');
  }
  return (
    <section 
      id={referenceId}
      role="region"
      aria-labelledby={`${referenceId}-heading`}
      className="w-full max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg my-6"
    >
      <div className="flex flex-col gap-4">
        {children}
      </div>
    </section>
  );
};

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
    text: ({ content }) => <Paragraphs data={{ content }} />, // Ajuste aquí
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
        <img 
          src={url} 
          alt={alt} 
          className="slider-image"
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

const CustomQuote = ({ quote, author }) => {
  return (
    <div className='CustomQuoteText'>
      <div className={'CustomQuoteAutor'} style={{ borderRadius: '20px'}}>
        <p>{quote}</p>
      </div>
      {author}
    </div>
  );
};

const TableRenderer = ({ content, headers, rows }) => {
  // Parse markdown-like text for bold (**text**) and remove list prefixes (- )
  const parseCellContent = (cell) => {
    if (!cell || typeof cell !== 'string') return cell;

    // Remove list prefix (e.g., "- ") if present
    const cleanCell = cell.replace(/^\s*-\s, '').trim();

    // Parse bold text (**text**)
    const parts = [];
    let lastIndex = 0;
    const regex = /\*\*(.+?)\*\g;
    let match;
    while ((match = regex.exec(cleanCell)) !== null) {
      const before = cleanCell.slice(lastIndex, match.index);
      if (before) parts.push(before);
      parts.push(
        <span key={`${match.index}-${match[1]}`} className="font-bold text-blue-600" style={{ fontWeight: 700 }}>
          {match[1]}
        </span>
      );
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < cleanCell.length) parts.push(cleanCell.slice(lastIndex));

    return parts.length > 0 ? parts : cleanCell;
  };

  if (content) {
    const rows = content.split('\n').filter((row) => row.trim().startsWith('|'));
    if (rows.length < 2) return null;
    const parsedHeaders = rows[0].split('|').filter(Boolean).map((h) => h.trim());
    // Skip the separator row (e.g., |------|-------------|---------|)
    const dataRows = rows.slice(2).map((row) =>
      row
        .split('|')
        .filter(Boolean)
        .map((c) => parseCellContent(c.trim()))
    );

    return (
      <div className="table-container">
        <table>
          <thead className="tableTitle">
            <tr>
              {parsedHeaders.map((header, i) => (
                <th key={i}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((cells, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 1 ? 'alternate-row' : ''}>
                {cells.map((cell, cellIndex) => (
                  <td key={cellIndex}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        
      </div>
    );
  }

  if (headers && rows) {
    return (
      <div className="table-container">
        <table>
          <thead>
            <tr>
              {headers.map((header, i) => (
                <th className="tableTitle" key={i}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((cells, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 1 ? 'alternate-row' : ''}>
                {cells.map((cell, cellIndex) => (
                  <td key={cellIndex}>{parseCellContent(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <style jsx>{`
          .table-container {
            overflow-x: auto;
            margin: 1rem 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th,
          td {
            border: 1px solid #e5e7eb;
            padding: 0.5rem;
            text-align: left;
          }
          .tableTitle {
            background-color: #f3f4f6;
            font-weight: bold;
          }
          .alternate-row {
            background-color: #f9fafb;
          }
          .font-bold {
            font-weight: 700 !important;
          }
        `}</style>
      </div>
    );
  }

  return null;
};



const LinksRenderer = ({ text, url }) => {
  if (!text || !url) return null;
  return (
    <div className="additional-resource">
      <h3>Additional Resource</h3>
      <ul className="additional-links">
        <li>
          <a href={url} target="_blank" rel="noopener noreferrer">
            {text}
          </a>
        </li>
      </ul>
    </div>
  );
};

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
                objectFit: 'contain',
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
              <button className="submit-button" onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

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
    <div className={`social-share ${size} ${color}`}>
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
    </div>
  );
};

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

const Layout = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollPercentage, setScrollPercentage] = useState(0);
  const mobileMenuRef = useRef(null);
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
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && 
          !mobileMenuRef.current.contains(event.target) &&
          !event.target.closest('.mobile-menu-button')) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const toggleDarkMode = () => setDarkMode(!darkMode);
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  return (
    <Fragment>
      <Head>
        <title>Good Memories - Memory Platform</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </Head>
      <nav className={`navbar ${darkMode ? 'dark' : ''}`}>
        <div className="navbar-container">
          <Tooltip content="Visit the Good Memories homepage">
            <div className="navbar-brand">
              <MemoryLogo size={40}/>
              <span>Good Memories</span>
            </div>
          </Tooltip>
          <div 
            ref={mobileMenuRef}
            className={`navbar-links ${mobileMenuOpen ? 'mobile-open' : ''}`}
            id="mobile-menu"
            aria-hidden={!mobileMenuOpen}
          >
            <a href="#"><i className="fas fa-home"></i> Home</a>
            <a href="#"><i className="fas fa-book"></i> Articles</a>
            <a href="#"><i className="fas fa-images"></i> Gallery</a>
            <a href="#"><i className="fas fa-user-friends"></i> Community</a>
            <button 
              className="theme-toggle" 
              onClick={toggleDarkMode} 
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <i className="fas fa-sun"></i> : <i className="fas fa-moon"></i>}
            </button>
          </div>
          <button 
            className="mobile-menu-button" 
            onClick={toggleMobileMenu}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? <i className="fas fa-times"></i> : <i className="fas fa-bars"></i>}
          </button>
        </div>
        <ProgressBar percentage={scrollPercentage} message="Reading Progress" size="small" />
      </nav>
      <main className={`main-content ${darkMode ? 'dark' : ''}`}>{children}</main>
      <footer className={`footer ${darkMode ? 'dark' : ''}`}>
        <div className="footer-container">
          <div className="footer-section">
            <h3>Good Memories</h3>
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
          <p>© {new Date().getFullYear()} Good Memories. All rights reserved.</p>
        </div>
      </footer>
    </Fragment>
  );
};

const ImageTextBlock = ({ imageUrl, imageAlt, text, layout = 'left', imageSize = 'medium' }) => {
  console.log('ImageTextBlock props:', { imageUrl, imageAlt, text, layout, imageSize });
  const imageClass = `image-${imageSize}`;
  const containerClass = `image-text-container ${layout}`;
  const paragraphData = {
    content: [{ text: text || 'No text provided for this image' }],
  };
  return (
    <div className={containerClass}>
      {layout === 'left' || layout === 'top' ? (
        <>
          <img style={{ borderRadius: '20px' }} src={imageUrl} alt={imageAlt} className={imageClass} />
          <div className="text-content">
            <Paragraphs data={paragraphData} />
          </div>
        </>
      ) : (
        <>
          <div className="text-content">
            <Paragraphs data={paragraphData} />
          </div>
          <img src={imageUrl} alt={imageAlt} className={imageClass} />
        </>
      )}
    </div>
  );
};

const EmbedBlock = ({ src, type, width = '100%', height = 'auto', allowFullScreen = true }) => {
  if (type === 'video') {
    return (
      <video
        src={src}
        controls
        width={width}
        height={height}
        allowFullScreen={allowFullScreen}
        style={{ maxWidth: '100%' }}
      />
    );
  } else if (type === 'iframe' || type === 'embed') {
    return (
      <iframe
        src={src}
        width={width}
        height={height}
        frameBorder="0"
        allowFullScreen={allowFullScreen}
        style={{ maxWidth: '100%' }}
      />
    );
  } else {
    return <div>Unsupported embed type: {type}</div>;
  }
};

const ContentBlockRenderer = ({ block }) => {
  console.log('ContentBlockRenderer block:', block);
  if (!block || !block.type) {
    console.warn('ContentBlockRenderer: Invalid block provided');
    return null;
  }
  const { type, props = {} } = block;
  switch (type) {
    case 'text':
      return <Paragraphs data={props} />;
    case 'tableOfContents':
      return <TableOfContents content={props.content} />;
    case 'imageText':
      return <ImageTextBlock {...props} />;
    case 'embed':
      return <EmbedBlock {...props} />;
    case 'table':
      return <TableRenderer {...props} />;
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
    case 'codeBlock':
      return <CodeBlock {...props} />;
    case 'createSectionWrapper':
      const { referenceId, children } = props;
      return (
        <CreateSectionWrapper referenceId={referenceId}>
          {children &&
            children.map((child, index) => (
              <ContentBlockRenderer key={index} block={child} />
            ))}
        </CreateSectionWrapper>
      );
    case 'feedbackForm':
      return <FeedbackForm {...props} onSubmit={props.onSubmit || ((data) => console.log('Feedback:', data))} />;
    default:
      console.warn(`Unsupported block type: ${type}`);
      return null;
  }
};

const articlesData = {
  "title": "Cómo se crean los recuerdos según la ciencia: Un viaje fascinante por la memoria",
  "seo": {
    "description": "Explora cómo se forman los recuerdos en el cerebro, los tipos de memoria, casos fascinantes como Henry Molaison y Solomon Shereshevsky, y técnicas para mejorar el aprendizaje.",
    "keywords": "memoria, recuerdos, neurociencia, hipocampo, plasticidad sináptica, Henry Molaison, Solomon Shereshevsky",
    "tags": "memoria, ciencia, neurociencia, aprendizaje, psicología"
  },
  "breadcrumbs": [
    { "label": "Home", "path": "/" },
    { "label": "Artículos", "path": "/articles" },
    { "label": "Cómo se crean los recuerdos", "path": "/articles/memory-formation" }
  ],
  "content": [
    {
      "type": "tableOfContents",
      "props": {
        "title": "¿Qué encontrarás en este artículo?",
        "content": "1. [Introducción: La magia de la memoria](#introduccion)\n2. [La ciencia detrás de la formación de los recuerdos](#ciencia-formacion)\n   - [¿Qué es la memoria?](#que-es-memoria)\n   - [Las etapas de la memoria](#etapas-memoria)\n   - [El cerebro y la memoria](#cerebro-memoria)\n   - [Plasticidad sináptica](#plasticidad-sinaptica)\n   - [Consolidación y reconsolidación](#consolidacion)\n3. [Tipos de memoria](#tipos-memoria)\n4. [Distorsiones y recuerdos falsos](#distorsiones)\n5. [Casos notables](#casos-notables)\n   - [Henry Molaison (H.M.)](#henry-molaison)\n   - [Solomon Shereshevsky](#solomon-shereshevsky)\n6. [Técnicas de memoria](#tecnicas-memoria)\n7. [Memoria y aprendizaje](#memoria-aprendizaje)\n8. [Perspectivas culturales](#perspectivas-culturales)\n9. [Conclusión](#conclusion)"
      }
    },
    {
      "type": "createSectionWrapper",
      "props": {
        "referenceId": "introduccion",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "Introducción: La magia de la memoria",
              "content": [
                {
                  "text": "Imagina que estás caminando por una calle conocida y, de repente, el aroma de un pan recién horneado te transporta a la cocina de tu abuela. En un instante, puedes recordar su risa, el calor del horno y hasta el sabor de ese pan. ¿Cómo logra tu cerebro revivir un momento que ocurrió hace años? La memoria es como un mago que saca recuerdos del sombrero, pero su truco no es magia: es ciencia.",
                  "highlight": "La memoria es un proceso dinámico",
                  "continueText": " que involucra cambios físicos y químicos en el cerebro. Cada vez que aprendes algo nuevo o vives una experiencia, tu cerebro reconfigura sus conexiones para guardar esa información. En este artículo, exploraremos cómo ocurre este proceso, los diferentes tipos de memoria y casos fascinantes que han cambiado nuestra comprensión de la mente humana."
                },
                {
                  "text": "Consideremos dos historias que han marcado la neurociencia: ",
                  "highlight": "Henry Molaison (H.M.)",
                  "link": { "text": "Simply Psychology", "url": "https://www.simplypsychology.org/henry-molaison-patient-hm.html" },
                  "continueText": ", quien perdió la capacidad de formar nuevos recuerdos tras una cirugía, y "
                },
                {
                  "highlight": "Solomon Shereshevsky",
                  "link": { "text": "Psychology Today", "url": "https://www.psychologytoday.com/us/blog/the-memory-factory/202106/the-curious-case-mr-s-and-his-memory" },
                  "continueText": ", un periodista con una memoria prodigiosa pero abrumadora. Acompáñanos en este viaje para descubrir los secretos de tu mente."
                }
              ]
            }
          },
          {
            "type": "imageText",
            "props": {
              "imageUrl": "https://goodmemoriesapp.b-cdn.net/mediaDinamicWeb/images/Copilot_20250618_142235.png",
              "imageAlt": "",
              "text": "Las conexiones neuronales en el cerebro se fortalecen con cada nuevo recuerdo, un proceso fascinante que exploraremos a fondo.",
              "layout": "right",
              "imageSize": "medium"
            }
          }
        ]
      }
    },
    {
      "type": "createSectionWrapper",
      "props": {
        "referenceId": "ciencia-formacion",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "La ciencia detrás de la formación de los recuerdos",
              "content": [
                {
                  "text": "La formación de recuerdos es un proceso complejo que ocurre en múltiples niveles dentro del cerebro. Desde la activación de neuronas hasta la creación de conexiones sinápticas, la memoria es el resultado de una danza intrincada entre células y moléculas."
                }
              ]
            }
          },
          {
            "type": "accordion",
            "props": {
              "title": "¿Qué es la memoria?",
              "defaultOpen": true,
              "children": [
                {
                  "type": "text",
                  "props": {
                    "content": [
                      {
                        "text": "La memoria es la capacidad del cerebro para codificar, almacenar y recuperar información. No es un proceso único, sino un sistema complejo con varias etapas:",
                        "highlight": "Codificación, almacenamiento y recuperación."
                      },
                      {
                        "text": "- **Codificación**: Transformar la información en un formato que el cerebro pueda procesar, como cuando memorizas un nombre.\n- **Almacenamiento**: Guardar esa información para usarla más tarde, ya sea por segundos o por décadas.\n- **Recuperación**: Acceder a la información almacenada cuando la necesitas, como recordar dónde estacionaste tu coche."
                      }
                    ]
                  }
                }
              ]
            }
          },
          {
            "type": "accordion",
            "props": {
              "title": "Las etapas de la memoria",
              "defaultOpen": true,
              "children": [
                {
                  "type": "text",
                  "props": {
                    "content": [
                      {
                        "text": "La memoria se divide en tres etapas principales, cada una con un propósito específico:",
                        "highlight": "Memoria sensorial, a corto plazo y a largo plazo."
                      },
                      {
                        "text": "- **Memoria sensorial**: Es la más breve, dura solo unos segundos y captura información de los sentidos. Por ejemplo, la memoria icónica te permite 'ver' una imagen fugaz después de que desaparece, como un relámpago ([Lesley University](https://lesley.edu/article/stages-of-memory)).\n- **Memoria a corto plazo (MCP)**: Retiene información por 20-30 segundos y tiene una capacidad limitada (unos 7 elementos). Es lo que usas para mantener un número de teléfono en tu mente mientras lo marcas.\n- **Memoria a largo plazo (MLP)**: Almacena información por períodos prolongados, desde horas hasta toda la vida. Incluye recuerdos de eventos personales, conocimientos generales y habilidades."
                      }
                    ]
                  }
                }
              ]
            }
          },
          {
            "type": "accordion",
            "props": {
              "title": "El cerebro y la memoria",
              "defaultOpen": true,
              "children": [
                {
                  "type": "text",
                  "props": {
                    "content": [
                      {
                        "text": "El cerebro es el escenario donde se forman los recuerdos, y varias regiones trabajan juntas:",
                        "highlight": "Hipocampo, corteza cerebral y amígdala."
                      },
                      {
                        "text": "- **Hipocampo**: Ubicado en el lóbulo temporal medial, es esencial para codificar nuevos recuerdos explícitos. Actúa como un 'índice' que organiza la información antes de transferirla a otras áreas ([Queensland Brain Institute](https://qbi.uq.edu.au/memory/where-are-memories-stored)).\n- **Corteza cerebral**: Almacena los recuerdos a largo plazo. Diferentes tipos de recuerdos se guardan en áreas específicas, como los visuales en la corteza occipital.\n- **Amígdala**: Modula la memoria emocional, haciendo que los eventos intensos, como un susto, sean más memorables ([Live Science](https://www.livescience.com/how-the-brain-stores-memories))."
                      }
                    ]
                  }
                }
              ]
            }
          },
          {
            "type": "accordion",
            "props": {
              "title": "Plasticidad sináptica",
              "defaultOpen": true,
              "children": [
                {
                  "type": "text",
                  "props": {
                    "content": [
                      {
                        "text": "Los recuerdos se forman cuando las neuronas fortalecen o debilitan sus conexiones, un proceso llamado ",
                        "highlight": "plasticidad sináptica",
                        "continueText": ". Según el [Queensland Brain Institute](https://qbi.uq.edu.au/memory/how-are-memories-formed), esto ocurre a través de:"
                      },
                      {
                        "text": "- **Potenciación a largo plazo (LTP)**: Cuando dos neuronas se activan juntas repetidamente, su conexión se fortalece, facilitando la transmisión de señales. Es como pavimentar un camino que usas a menudo.\n- **Depresión a largo plazo (LTD)**: Las conexiones poco usadas se debilitan, permitiendo al cerebro 'limpiar' información irrelevante."
                      },
                      {
                        "text": "Eric Kandel, en su libro ",
                        "highlight": "In Search of Memory",
                        "continueText": " (2006), explica cómo estos cambios moleculares son la base de la memoria a largo plazo."
                      }
                    ]
                  }
                }
              ]
            }
          },
          {
            "type": "accordion",
            "props": {
              "title": "Consolidación y reconsolidación",
              "defaultOpen": true,
              "children": [
                {
                  "type": "text",
                  "props": {
                    "content": [
                      {
                        "text": "La ",
                        "highlight": "consolidación",
                        "continueText": " estabiliza los recuerdos para que no se pierdan. Hay dos tipos:"
                      },
                      {
                        "text": "- **Consolidación inicial**: Ocurre horas o días después de un evento y depende del hipocampo. Requiere la síntesis de proteínas ([PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC4246028/)).\n- **Consolidación sistémica**: Transfiere los recuerdos a la corteza cerebral, un proceso que puede tomar años."
                      },
                      {
                        "text": "La ",
                        "highlight": "reconsolidación",
                        "continueText": " ocurre cuando un recuerdo se reactiva y se vuelve temporalmente inestable, permitiendo modificaciones. Esto tiene aplicaciones en el tratamiento de trastornos como el TEPT ([Smithsonian Magazine](https://www.smithsonianmag.com/science-nature/how-our-brains-make-memories-14466850/))."
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    },
    {
      "type": "createSectionWrapper",
      "props": {
        "referenceId": "tipos-memoria",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "Tipos de memoria",
              "content": [
                {
                  "text": "La memoria no es un sistema único; se divide en varios tipos, cada uno con funciones específicas. La siguiente tabla resume los principales tipos de memoria y sus características."
                }
              ]
            }
          },
          {
            "type": "table",
            "props": {
              "content": "| Tipo | Descripción | Ejemplo |\n|------|-------------|---------|\n| **Memoria sensorial** | Retiene información sensorial por segundos. | Ver un relámpago y 'recordar' su imagen. |\n| **Memoria a corto plazo** | Almacena información temporalmente (20-30 segundos). | Recordar un número de teléfono. |\n| **Memoria a largo plazo** | Guarda información por períodos prolongados. | Saber montar en bicicleta. |\n| - **Explícita** | Recuerdos conscientes (episódica: eventos; semántica: hechos). | Recordar tu boda o la capital de Francia. |\n| - **Implícita** | Recuerdos inconscientes (procedimental: habilidades; priming: influencias). | Conducir un coche automáticamente. |"
            }
          }
        ]
      }
    },
    {
      "type": "createSectionWrapper",
      "props": {
        "referenceId": "distorsiones",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "Distorsiones y recuerdos falsos",
              "content": [
                {
                  "text": "La memoria no es un video perfecto del pasado; es una reconstrucción que puede fallar. Elizabeth Loftus, en ",
                  "highlight": "The Myth of Repressed Memory",
                  "continueText": " (1994), demostró que las sugestiones pueden crear recuerdos falsos. Por ejemplo, al preguntar a testigos si vieron un 'semáforo' en un accidente, muchos lo 'recordaron' aunque no existía."
                },
                {
                  "text": "Las emociones también distorsionan la memoria. Eventos traumáticos pueden parecer más intensos de lo que fueron, un fenómeno explorado por Julia Shaw en ",
                  "highlight": "The Memory Illusion",
                  "continueText": " (2016)."
                }
              ]
            }
          }
        ]
      }
    },
    {
      "type": "createSectionWrapper",
      "props": {
        "referenceId": "casos-notables",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "Casos notables",
              "content": [
                {
                  "text": "Algunos casos extraordinarios han ayudado a los científicos a entender mejor cómo funciona la memoria. A continuación, exploramos dos ejemplos emblemáticos."
                }
              ]
            }
          },
          {
            "type": "accordion",
            "props": {
              "title": "Henry Molaison (H.M.)",
              "defaultOpen": true,
              "children": [
                {
                  "type": "text",
                  "props": {
                    "content": [
                      {
                        "text": "En 1953, Henry Molaison se sometió a una cirugía que removió su hipocampo para tratar su epilepsia. Aunque sus convulsiones disminuyeron, perdió la capacidad de formar nuevos recuerdos explícitos. Su caso, descrito en ",
                        "highlight": "Permanent Present Tense",
                        "continueText": " de Suzanne Corkin (2013), mostró que el hipocampo es crucial para la memoria declarativa, pero no para la procedimental ([The Guardian](https://www.theguardian.com/science/2013/may/05/henry-molaison-amnesiac-corkin-book-feature))."
                      }
                    ]
                  }
                }
              ]
            }
          },
          {
            "type": "accordion",
            "props": {
              "title": "Solomon Shereshevsky",
              "defaultOpen": true,
              "children": [
                {
                  "type": "text",
                  "props": {
                    "content": [
                      {
                        "text": "Solomon Shereshevsky tenía una memoria extraordinaria debido a su sinestesia, que le permitía asociar números y palabras con colores y texturas. Sin embargo, su incapacidad para olvidar lo abrumaba. Alexander Luria documentó su caso en ",
                        "highlight": "The Mind of a Mnemonist",
                        "continueText": " (1968) ([The New Yorker](https://www.newyorker.com/books/page-turner/the-mystery-of-s-the-man-with-an-impossible-memory))."
                      }
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    },
    {
      "type": "createSectionWrapper",
      "props": {
        "referenceId": "tecnicas-memoria",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "Técnicas de memoria",
              "content": [
                {
                  "text": "Las técnicas mnemotécnicas, como el método de los loci, han sido usadas desde la antigüedad. Frances Yates, en ",
                  "highlight": "The Art of Memory",
                  "continueText": " (1966), describe cómo los oradores griegos imaginaban 'palacios' mentales para recordar discursos. Joshua Foer, en ",
                  "highlight": "Moonwalking with Einstein",
                  "continueText": " (2011), muestra cómo estas técnicas pueden transformar una memoria promedio en una excepcional ([Five Books](https://fivebooks.com/best-books/joshua-foer-on-memory/))."
                }
              ]
            }
          },
          {
            "type": "cta",
            "props": {
              "title": "¿Deseas tener tus recuerdos de manera especial?",
              "description": "Mira estos ejemplos",
              "buttonText": "Ver",
              "href": "/",
              "variant": "primary"
            }
          }
        ]
      }
    },
    {
      "type": "createSectionWrapper",
      "props": {
        "referenceId": "memoria-aprendizaje",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "Memoria y aprendizaje",
              "content": [
                {
                  "text": "Entender la memoria mejora el aprendizaje. En ",
                  "highlight": "Make It Stick",
                  "continueText": " (2014), Brown, Roediger y McDaniel recomiendan:"
                },
                {
                  "text": "- **Práctica de recuperación**: Probarte a ti mismo fortalece los recuerdos.\n- **Espaciado**: Estudiar a lo largo del tiempo es más efectivo que cramming.\n- **Intercalación**: Mezclar temas mejora la retención."
                }
              ]
            }
          }
        ]
      }
    },
    {
      "type": "createSectionWrapper",
      "props": {
        "referenceId": "perspectivas-culturales",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "Perspectivas culturales",
              "content": [
                {
                  "text": "La memoria tiene un significado cultural profundo. David Rubin, en ",
                  "highlight": "Memory in Oral Traditions",
                  "continueText": " (1995), explica cómo las sociedades orales usaban rimas y narrativas para preservar conocimientos. En la literatura, Marcel Proust, en ",
                  "highlight": "In Search of Lost Time",
                  "continueText": " (1913-1927), explora cómo los recuerdos involuntarios dan sentido a la vida."
                }
              ]
            }
          }
        ]
      }
    },
    {
      "type": "createSectionWrapper",
      "props": {
        "referenceId": "conclusion",
        "children": [
          {
            "type": "text",
            "props": {
              "title": "Conclusión",
              "content": [
                {
                  "text": "La memoria es un proceso complejo que define nuestra identidad. Desde los cambios sinápticos hasta las técnicas culturales, la ciencia de la memoria nos ayuda a entender quiénes somos y cómo aprendemos. Casos como los de H.M. y Shereshevsky nos recuerdan que la memoria es tanto una herramienta poderosa como un desafío. Al comprenderla, podemos mejorar nuestra vida y enfrentar el futuro con mayor claridad."
                }
              ]
            }
          },
          {
            "type": "customQuote",
            "props": {
              "quote": "La memoria es el diario que todos llevamos con nosotros.",
              "author": "Oscar Wilde"
            }
          }
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
              "url": "https://goodmemoriesapp.b-cdn.net/mediaDinamicWeb/images/openart-image_KPf_LYiD_1750275030272_raw.jpg",
              "alt": "Imagen del cerebro humano"
            }
          },
          {
            "type": "text",
            "props": {
              "content": [
                {
                  "text": "Explora más sobre la neurociencia de la memoria en nuestra galería interactiva."
                }
              ]
            }
          }
        ],
        "autoSlide": true,
        "slideInterval": 5000,
        "size": "medium"
      }
    },
    {
      "type": "feedbackForm",
      "props": {
        "title": "Deja tu opinión",
        "submitText": "Enviar retroalimentación",
        "showRatings": true
      }
    }
  ]
};

const ArticleRenderer = ({ article }) => {
  const router = useRouter();
  const { information } = router.query;
  console.log('ArticleRenderer article:', article);
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

export default function ArticlePage() {
  const router = useRouter();
  const { information } = router.query;
  console.log('ArticlePage information:', information);
  const article = information ? articlesData : null;
  return (
    <Layout>
      <ArticleRenderer article={article} />
    </Layout>
  );
};*/


