import React, { useState, useRef, useEffect } from 'react';


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


export default Modal