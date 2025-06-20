import React, { useState, useRef, useEffect } from 'react';


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


export default Accordion