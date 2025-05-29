'use client'; 

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Menu from './menu';
import InternetStatus from './internetStatus';
import '../../app/globals.css'
import '../../estilos/general/generalMold.css';






const GeneralMold = ({
  pageTitle = 'Default Page',
  pageDescription = 'Default page description',
  leftContent,
  rightContent,
  visibility = 'public',
  owner,
  metaKeywords = '',
  metaAuthor = '',
}) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // State for modal visibility
  const [modalContent, setModalContent] = useState(null); // State for modal content
  const router = useRouter();

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);
  const handleMenuToggle = () => setIsMenuOpen((prev) => !prev);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  // Determine if we have both content areas
  const hasBothContent = leftContent && rightContent;

  return (
    <div className="general-mold" role="main" aria-label="Contenido principal">
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={metaKeywords} />
        {metaAuthor && <meta name="author" content={metaAuthor} />}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={typeof window !== 'undefined' ? window.location.href : ''} />
        <meta name="robots" content={visibility === 'public' ? 'index, follow' : 'noindex'} />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : ''} />
      </Head>

      {/* Include InternetStatus component */}
      <InternetStatus setModalContent={setModalContent} setIsModalOpen={setIsModalOpen} />

      <header className="header">
        <button
          className="back-button button"
          onClick={() => window.history.back()}
          aria-label="Volver a la página anterior"
        >
          ←
        </button>
        <button
          className="menu-button button"
          onClick={handleMenuToggle}
          aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          ☰
        </button>
        <button
          className="theme-toggle button"
          onClick={toggleDarkMode}
          aria-label={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>
        <div className="visibility">
          <span className="visibility-icon" aria-hidden="true">
            {visibility === 'public' ? '👁️' : visibility === 'private' ? '🔒' : '👥'}
          </span>
          <span className="visibility-label content-small">
            {visibility === 'public' ? 'Público' : visibility === 'private' ? 'Privado' : 'Solo Invitados'}
          </span>
        </div>
      </header>

      <Menu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        aria-label="Menú de navegación"
        isDarkMode={isDarkMode}
      />

      <div className={`content-container ${hasBothContent ? 'dual-content' : 'single-content'}`}>
        {leftContent && (
          <section
            className={`left-container card ${hasBothContent ? '' : 'full-width'}`}
            aria-label="Contenido izquierdo"
          >
            {leftContent}
          </section>
        )}
        {rightContent && (
          <section
            className={`right-container card ${hasBothContent ? '' : 'full-width'}`}
            aria-label="Contenido derecho"
          >
            {rightContent}
          </section>
        )}
      </div>

      {/* Modal for displaying connection status */}
      {isModalOpen && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div
            className="modal-content"
            style={{
              backgroundColor: isDarkMode ? '#333' : '#fff',
              padding: '20px',
              borderRadius: '8px',
              maxWidth: '400px',
              width: '100%',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
            }}
          >
            {modalContent}
            <button
              onClick={() => setIsModalOpen(false)}
              style={{
                marginTop: '10px',
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              aria-label="Cerrar modal"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneralMold;