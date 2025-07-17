"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Head from "next/head";
import Menu from "@/components/complex/menu";
import '../app/globals.css';
import '../estilos/general/generalMold.css';
import '../estilos/general/projectPresentation.css';
import LoadingMemories from "@/components/complex/loading";

const GeneralMold = ({
  pageTitle = 'Default Page',
  pageDescription = 'Default page description',
  leftContent,
  rightContent,
  visibility = 'public',
  metaKeywords = '',
  metaAuthor = '',
  error = '',
  initialData,
}) => {
  const [isDarkMode, setIsDarkMode] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [uid, setUid] = useState(null);
  const [token, setToken] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [permissionResult, setPermissionResult] = useState(initialData || null);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionError, setPermissionError] = useState('');
  const [basePath, setBasePath] = useState('');
  const router = useRouter();

  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    const initialMode = savedMode ? JSON.parse(savedMode) : false;
    setIsDarkMode(initialMode);
    document.documentElement.classList.toggle('dark', initialMode);
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const newMode = !prev;
      localStorage.setItem('darkMode', JSON.stringify(newMode));
      document.documentElement.classList.toggle('dark', newMode);
      return newMode;
    });
  };

  const handleMenuToggle = () => setIsMenuOpen((prev) => !prev);

  const themeToggleButton = isDarkMode === null ? (
    <button className="theme-toggle button" aria-label="Loading theme...">
      ...
    </button>
  ) : (
    <button
      className="theme-toggle button"
      onClick={toggleDarkMode}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDarkMode ? '🌙' : '☀️'}
    </button>
  );

  const hasBothContent = leftContent && rightContent;

  if (isLoading) {
    return <LoadingMemories />;
  }

  return (
    <div className={!(router.pathname === "/payment/payPlan" || basePath === "editMemories" || basePath === "uploadFiles") ? "general-mold" : ""} role="main" aria-label="Main content">
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={metaKeywords} />
        {metaAuthor && <meta name="author" content={metaAuthor} />}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta name="robots" content={visibility === 'public' ? 'index, follow' : 'noindex'} />
      </Head>

      <header className="header">
        <button
          className="back-button button"
          onClick={() => window.history.back()}
          aria-label="Go back to previous page"
        >
          ←
        </button>
        <button
          className="menu-button button"
          onClick={handleMenuToggle}
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
        >
          ☰
        </button>
        {themeToggleButton}
        <div className="visibility">
          <span className="visibility-icon" aria-hidden="true"></span>
          <span className="visibility-label content-small"></span>
        </div>
      </header>

      <Menu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        aria-label="Navigation menu"
        isDarkMode={isDarkMode}
      />

      <div style={{marginTop: '80px'}} className={`content-container ${hasBothContent ? 'dual-content' : 'single-content'}`}>
        <>
          {leftContent && (
            <section
              className={`card ${hasBothContent ? '' : 'full-width'}`}
              aria-label="Left content"
            >
              {leftContent}
            </section>
          )}
          {rightContent && (
            <section
              className={`right-container card ${hasBothContent ? '' : 'full-width'}`}
              aria-label="Right content"
            >
              {rightContent}
            </section>
          )}
        </>
      </div>

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
              aria-label="Close modal"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const ProjectPresentation = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('images');
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);

  const baseUrl = 'https://goodmemoriesapp.b-cdn.net/e55c81892694f42318e9b3b5131051559650dcba7d0fe0651c2aa472ea6a6c0c/ytrmrpGjnR5WfYvIFQm45SmoAWEGTynq54VgGIC7As/general/';
  const dynamicMemoryUrl = 'https://www.goodmemories.live/dynamicMemory/e55c81892694f42318e9b3b5131051559650dcba7d0fe0651c2aa472ea6a6c0c/ytrmrpGjnR5WfYvIFQm45SmoAWEGTynq54VgGIC7As/520b84d9c1f48f6b05ef8f4bb4a86420cff83e0d2f875dfe78062dd8eb5d718a';

  const heroImages = [
    `${baseUrl}image/family-7638959_640.jpg`,
    `${baseUrl}image/family-7638960_640.jpg`,
    `${baseUrl}image/family-7638961_640.jpg`,
    `${baseUrl}image/family-7638962_640.jpg`,
    `${baseUrl}image/family-7638964_640.jpg`,
    `${baseUrl}image/family-7638966_640.jpg`,
    `${baseUrl}image/family-7638967_640.jpg`,
    `${baseUrl}image/family-7638971_640.jpg`,
    `${baseUrl}image/family-7638972_640.jpg`,
  ];

  // Removed dynamicMemoryUrl from previewImages to avoid duplicate rendering
  const previewImages = [
    `${baseUrl}image/family-7638973_640.jpg`,
    `${baseUrl}image/park-2967756_640.jpg`,
  ];

  const fileTypes = [
    { id: 'images', name: 'Imágenes', icon: '🖼️', extensions: ['JPG', 'PNG', 'GIF', 'WEBP'] },
    { id: 'videos', name: 'Videos', icon: '🎬', extensions: ['MP4', 'MOV', 'AVI', 'MKV'] },
    { id: 'audio', name: 'Audio', icon: '🎵', extensions: ['MP3', 'WAV', 'FLAC', 'OGG'] },
  ];

  const features = [
    {
      title: "Organiza tus recuerdos",
      description: "Clasifica tus memorias por categorías, fechas o eventos importantes.",
      icon: "📂"
    },
    {
      title: "Comparte selectivamente",
      description: "Controla quién puede ver cada memoria con configuraciones de privacidad granular.",
      icon: "🔒"
    },
    {
      title: "Acceso multiplataforma",
      description: "Disponible en web, móvil y tablet para que nunca pierdas acceso a tus recuerdos.",
      icon: "📱"
    },
    {
      title: "Almacenamiento seguro",
      description: "Tus archivos están protegidos con encriptación de grado profesional.",
      icon: "🔐"
    }
  ];

  const testimonials = [
    {
      text: "Good Memories me ha permitido revivir momentos especiales con mi familia de una manera organizada y segura.",
      author: "María López"
    },
    {
      text: "La facilidad para subir y organizar mis videos de viajes ha transformado cómo preservo mis recuerdos.",
      author: "Carlos Martínez"
    },
    {
      text: "Como fotógrafo profesional, valoro la calidad con la que Good Memories maneja mis imágenes sin comprimirlas.",
      author: "Ana Rodríguez"
    }
  ];

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (comment.trim()) {
      setComments([...comments, { text: comment, id: Date.now() }]);
      setComment('');
    }
  };

  return (
    <div className="presentation-container">
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="title-lg color1">Good Memories</h1>
          <h2 className="title-md color4">Preserva tus momentos especiales para siempre</h2>
          <p className="content-default color1">
            Una plataforma diseñada para guardar, organizar y compartir tus recuerdos más valiosos con la máxima calidad y seguridad.
          </p>
          <div className="cta-buttons">
            <button 
              className="button2"
              onClick={() => router.push('/signup')}
            >
              Crear cuenta gratis
            </button>
            <button 
              className="button"
              onClick={() => router.push('/features')}
            >
              Ver características
            </button>
          </div>
        </div>
        <div className="hero-visual">
          <div className="visual-grid">
            {heroImages.map((url, i) => (
              <div
                key={i}
                className={`grid-item visual-item-${i + 1}`}
                style={{
                  backgroundImage: `url(${url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              ></div>
            ))}
          </div>
        </div>
      </section>

      <section className="features-section">
        <h2 className="title-md color1 text-center">Por qué elegir Good Memories</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card card">
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="title-sm color1">{feature.title}</h3>
              <p className="content-default color1">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="dynamic-memory-section">
        <h2 className="title-md color1 text-center">Recuerdo Dinámico Destacado</h2>
        <iframe
          src={dynamicMemoryUrl}
          width="100%"
          height="600"
          style={{ border: "none", borderRadius: '20px' }}
          title="Recuerdo Dinámico"
        />
      </section>

      <section className="file-types-section">
        <h2 className="title-md color1 text-center">Soporta todos tus formatos</h2>
        <div className="tabs-container">
          {fileTypes.map(type => (
            <button
              key={type.id}
              className={`tab-button ${activeTab === type.id ? 'active' : ''}`}
              onClick={() => setActiveTab(type.id)}
            >
              {type.icon} {type.name}
            </button>
          ))}
        </div>
        
        <div className="file-content">
          <div className="file-preview">
            {activeTab === 'images' && (
              <div className="image-preview">
                {previewImages.map((url, i) => (
                  <div
                    key={i}
                    className={`preview-image img${i + 1}`}
                    style={{
                      backgroundImage: `url(${url})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  ></div>
                ))}
              </div>
            )}
            {activeTab === 'videos' && (
              <div className="video-preview">
                <video
                  controls
                  src={`${baseUrl}video/13018-243739870_tiny.mp4`}
                  style={{ width: '100%', height: 'auto' }}
                />
                <div className="video-info">
                  <h4 className="title-xs color1">Chocar copas</h4>
                  <p className="content-small color1">MP4 • 1080p • 2:45 min</p>
                </div>
              </div>
            )}
            {activeTab === 'audio' && (
              <div className="audio-preview">
                <audio
                  controls
                  src={`${baseUrl}audio/mommy.mp3`}
                  style={{ width: '100%' }}
                />
                <div className="audio-info">
                  <h4 className="title-xs color1">Voz de la madre</h4>
                  <p className="content-small color1">MP3 • 3:22 min</p>
                </div>
              </div>
            )}
          </div>
          <div className="file-info">
            <h3 className="title-sm color1">{fileTypes.find(t => t.id === activeTab).name}</h3>
            <p className="content-default color1">
              Clasifica tus memorias por categorías, fechas o eventos importantes para una experiencia personalizada.
            </p>
          </div>
          <div className="comments-section">
            <h3 className="title-sm color1">Comentarios</h3>
            <form onSubmit={handleCommentSubmit}>
              <textarea
                className="comment-input"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Escribe un comentario..."
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  marginBottom: '10px',
                }}
              />
              <button
                type="submit"
                className="button"
                style={{ padding: '8px 16px' }}
              >
                Enviar
              </button>
            </form>
            <div className="comments-list">
              {comments.map((c) => (
                <div key={c.id} className="comment card" style={{ marginTop: '10px', padding: '10px' }}>
                  <p className="content-default color1">{c.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="testimonials-section">
        <h2 className="title-md color1 text-center">Lo que dicen nuestros usuarios</h2>
        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="testimonial-card card">
              <p className="content-default color1">"{testimonial.text}"</p>
              <p className="content-small color4">— {testimonial.author}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="final-cta card">
        <h2 className="title-md color1 text-center">Comienza a preservar tus recuerdos hoy</h2>
        <p className="content-default color1 text-center">
          Únete a miles de usuarios que ya están conservando sus momentos más preciados con Good Memories
        </p>
        <div className="cta-buttons center">
          <button 
            className="button2 large"
            onClick={() => router.push('/signup')}
          >
            Crear cuenta gratuita
          </button>
          <button 
            className="button large"
            onClick={() => router.push('/demo')}
          >
            Ver demostración
          </button>
        </div>
      </section>
    </div>
  );
};

export default function HomePage() {
  return (
    <main>
      <GeneralMold
        pageTitle="Good Memories - Plataforma de gestión de recuerdos"
        pageDescription="Descubre las posibilidades de Good Memories, la plataforma para guardar y compartir tus recuerdos más valiosos."
        leftContent={<ProjectPresentation />}
        visibility="public"
        metaKeywords="good memories, presentación, recuerdos, fotos, videos, audios, almacenamiento"
      />
    </main>
  );
}