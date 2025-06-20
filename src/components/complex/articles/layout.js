import React, { Fragment, useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import Tooltip from './tooltip';
import MemoryLogo from '../memoryLogo';
import ProgressBar from './progressBar';
import Modal from './modal';
import FeedbackForm from './feedbackForm';

const Layout = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollPercentage, setScrollPercentage] = useState(0);
  const mobileMenuRef = useRef(null);

  // Establecer el estado inicial del modo oscuro basado en la preferencia guardada o del sistema
  useEffect(() => {
    if (typeof window === 'undefined') return; // Evitar ejecución en el servidor
    const savedMode = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches; // Corregido 'dark-mode' a 'dark'
    let initialMode;
    if (savedMode) {
      try {
        initialMode = JSON.parse(savedMode); // Intentar parsear el valor guardado
      } catch (e) {
        console.error('Valor inválido de darkMode en localStorage:', e);
        initialMode = prefersDark; // Usar preferencia del sistema si falla
      }
    } else {
      initialMode = prefersDark; // Usar preferencia del sistema si no hay valor guardado
    }
    setDarkMode(initialMode);
    document.documentElement.classList.toggle('dark-mode', initialMode);
  }, []);

  // Actualizar la clase raíz y localStorage cuando darkMode cambia
  useEffect(() => {
    document.documentElement.classList.toggle('dark-mode', darkMode);
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    console.log('Valor guardado en localStorage:', localStorage.getItem('darkMode'));
  }, [darkMode]);

  // Manejar el scroll para la barra de progreso
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

  // Manejar clic fuera del menú móvil
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        !event.target.closest('.mobile-menu-button')
      ) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);
  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev);

  return (
    <Fragment>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <nav className="navbar">
        <div className="navbar-container">
          <Tooltip content="Visit the Good Memories homepage">
            <div className="navbar-brand">
              <MemoryLogo size={40} />
              <span>Good Memories</span>
            </div>
          </Tooltip>
          <div
            ref={mobileMenuRef}
            className={`navbar-links ${mobileMenuOpen ? 'mobile-open' : ''}`}
            id="mobile-menu"
            aria-hidden={!mobileMenuOpen}
          >
            <a href="#" title="Go to Home page">
              <i className="fas fa-home"></i> Home
            </a>
            <a href="/articles" title="View Articles">
              <i className="fas fa-book"></i> Articles
            </a>
            <a href="#" title="Explore Gallery">
              <i className="fas fa-images"></i> Gallery
            </a>
            <a href="#" title="Join Community">
              <i className="fas fa-user-friends"></i> Community
            </a>
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
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-section">
            <h3>Good Memories</h3>
            <p>Preserving your most cherished moments for future generations.</p>
            <div className="social-icons">
              <a href="#" title="Follow us on Facebook" aria-label="Facebook">
                <i className="fab fa-facebook"></i>
              </a>
              <a href="#" title="Follow us on Twitter" aria-label="Twitter">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" title="Follow us on Instagram" aria-label="Instagram">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#" title="Follow us on Pinterest" aria-label="Pinterest">
                <i className="fab fa-pinterest"></i>
              </a>
            </div>
          </div>
          <div className="footer-section">
            <h3>Quick Links</h3>
            <ul>
              <li>
                <a href="#" title="Learn About Us">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" title="Explore Our Services">
                  Our Services
                </a>
              </li>
              <li>
                <a href="#" title="Read Privacy Policy">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" title="Read Terms and Conditions">
                  Terms and Conditions
                </a>
              </li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>Resources</h3>
            <ul>
              <li>
                <a href="#" title="Read our Blog">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" title="View Tutorials">
                  Tutorials
                </a>
              </li>
              <li>
                <a href="#" title="Access FAQ">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#" title="Get Technical Support">
                  Technical Support
                </a>
              </li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>Contact</h3>
            <ul>
              <li>
                <i className="fas fa-map-marker-alt"></i> 123 Technology Ave, Digital City
              </li>
              <li>
                <i className="fas fa-phone"></i> +1 234 567 890
              </li>
              <li>
                <i className="fas fa-envelope"></i> info@digitalmemories.com
              </li>
            </ul>
            <Modal trigger={<button className="footer-feedback-button">Give Feedback</button>} title="Send Your Feedback">
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

export default Layout;