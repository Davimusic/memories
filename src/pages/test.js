'use client'; 

import { useState, useEffect, useRef, useCallback } from 'react';
import '../app/globals.css'
import '../estilos/general/test.css';
import Menu from '@/components/complex/menu';
import Head from 'next/head';
import { useRouter } from 'next/navigation';





const MemoryDetail = ({ memory, loading, error, userEmail, hasAccess }) => {
  const [expandedFolder, setExpandedFolder] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [currentMediaList, setCurrentMediaList] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMediaLoading, setIsMediaLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const videoRef = useRef(null);
  const router = useRouter();

  // Memoized event handlers
  const handleFolderToggle = useCallback((folderName) => {
    setExpandedFolder((prev) => (prev === folderName ? null : folderName));
  }, []);

  const handleMediaSelect = useCallback((media, mediaList, index) => {
    setIsMediaLoading(true);
    setSelectedMedia(media);
    setCurrentMediaList(mediaList);
    setCurrentMediaIndex(index);
    setIsPlaying(media.type.startsWith('video/'));
  }, []);

  const handleCloseMediaPlayer = useCallback(() => {
    setSelectedMedia(null);
    setIsPlaying(false);
    setIsMediaLoading(false);
  }, []);

  const handleNextMedia = useCallback(() => {
    if (currentMediaIndex < currentMediaList.length - 1) {
      const nextIndex = currentMediaIndex + 1;
      setCurrentMediaIndex(nextIndex);
      setSelectedMedia(currentMediaList[nextIndex]);
      setIsPlaying(currentMediaList[nextIndex].type.startsWith('video/'));
      setIsMediaLoading(true);
    }
  }, [currentMediaIndex, currentMediaList]);

  const handlePrevMedia = useCallback(() => {
    if (currentMediaIndex > 0) {
      const prevIndex = currentMediaIndex - 1;
      setCurrentMediaIndex(prevIndex);
      setSelectedMedia(currentMediaList[prevIndex]);
      setIsPlaying(currentMediaList[prevIndex].type.startsWith('video/'));
      setIsMediaLoading(true);
    }
  }, [currentMediaIndex, currentMediaList]);

  const handlePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => setIsPlaying(false));
      }
      setIsPlaying((prev) => !prev);
    }
  }, [isPlaying]);

  const handleMenuToggle = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  /*/ Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedMedia) {
        if (e.key === 'Escape' && isMenuOpen) {
          setIsMenuOpen(false);
        }
        return;
      }
      if (e.key === 'ArrowRight') handleNextMedia();
      if (e.key === 'ArrowLeft') handlePrevMedia();
      if (e.key === ' ') {
        e.preventDefault();
        handlePlayPause();
      }
      if (e.key === 'Escape') handleCloseMediaPlayer();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMedia, handleNextMedia, handlePrevMedia, handlePlayPause, handleCloseMediaPlayer, isMenuOpen]);*/

  // Handle video loading
  useEffect(() => {
    if (selectedMedia && videoRef.current && selectedMedia.type.startsWith('video/')) {
      videoRef.current.load();
      if (isPlaying) {
        videoRef.current.play().catch(() => setIsPlaying(false));
      }
      videoRef.current.onloadeddata = () => setIsMediaLoading(false);
    }
  }, [selectedMedia, isPlaying]);

  // Apply dark mode class
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  // Format date for SEO and accessibility
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const folderIcons = {
    photos: '📷',
    videos: '🎥',
    audios: '🎵',
    documents: '📄',
  };

  // SEO metadata
  const pageTitle = memory ? `${memory.title} - Memoria Detallada` : 'Memoria No Encontrada';
  const pageDescription = memory?.description
    ? `${memory.description.slice(0, 160)}...`
    : 'Explora los detalles de esta memoria, incluyendo fotos, videos, audios y documentos.';

  if (loading) {
    return (
      <div className="memory-detail" role="region" aria-label="Cargando memoria">
        <div className="skeleton-header"></div>
        <div className="skeleton-card"></div>
        <div className="skeleton-folder"></div>
        <div className="skeleton-folder"></div>
      </div>
    );
  }

  if (error || !memory) {
    return (
      <div className="memory-detail error" role="alert">
        <Head>
          <title>{pageTitle}</title>
          <meta name="description" content="Esta memoria no existe o no tienes permiso para verla." />
          <meta name="robots" content="noindex" /> {/* Prevent indexing of error pages */}
        </Head>
        <div className="error-card">
          <div className="error-icon" aria-hidden="true">⚠️</div>
          <h1>Memoria No Encontrada</h1>
          <p>{error || "Esta memoria no existe o no tienes permiso para verla."}</p>
          <button onClick={() => window.history.back()} aria-label="Volver a la página anterior">
            Volver
          </button>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="memory-detail error" role="alert">
        <Head>
          <title>Acceso Restringido - Memoria</title>
          <meta name="description" content="Esta memoria es privada. Contacta al propietario para obtener acceso." />
          <meta name="robots" content="noindex" /> {/* Prevent indexing of restricted pages */}
        </Head>
        <div className="error-card">
          <div className="error-icon" aria-hidden="true">🔒</div>
          <h1>Acceso Restringido</h1>
          <p>Esta memoria es privada. Contacta al propietario para obtener acceso.</p>
          <button onClick={() => window.history.back()} aria-label="Volver a la página anterior">
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="memory-detail" role="main" aria-label="Detalles de la memoria">
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={`memoria, ${memory.title}, fotos, videos, documentos, ${memory.visibility}`} />
        <meta name="author" content={memory.owner} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={typeof window !== 'undefined' ? window.location.href : ''} />
        <meta name="robots" content={memory.visibility === 'public' ? 'index, follow' : 'noindex'} />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : ''} />
      </Head>

      <header className="memory-header">
        <button
          className="back-button"
          onClick={() => window.history.back()}
          aria-label="Volver a la página anterior"
        >
          ←
        </button>
        <button
          className="menu-button"
          onClick={handleMenuToggle}
          aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          ☰
        </button>
        <button
          className="theme-toggle"
          onClick={toggleDarkMode}
          aria-label={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>
        <div className="visibility">
            <span className="visibility-icon" aria-hidden="true">
              {memory.visibility === 'public' ? '👁️' : memory.visibility === 'private' ? '🔒' : '👥'}
            </span>
            <span className="visibility-label">
              {memory.visibility === 'public' ? 'Público' : memory.visibility === 'private' ? 'Privado' : 'Solo Invitados'}
            </span>
          </div>
      </header>

      <Menu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        aria-label="Navigation menu"
        isDarkMode={isDarkMode}  // Añade esta línea
      />

      <div className="content-container">
        <section className="metadata-card" aria-label="Información de la memoria">
          <h1 className="memory-title">{memory.title}</h1>
          <div className="metadata-header"></div>
          <div className="description-container">
            {memory.description && (
              <p className="description" itemProp="description">{memory.description}</p>
            )}
            <div className="dates" itemScope itemType="http://schema.org/CreativeWork">
            <span itemProp="dateCreated">Creado: {formatDate(memory.createdAt)}</span>
            {memory.updatedAt !== memory.createdAt && (
              <span itemProp="dateModified">Actualizado: {formatDate(memory.updatedAt)}</span>
            )}
          </div>
          <div className="owner" itemProp="author">
            Propietario: {memory.owner}
            {userEmail && userEmail === memory.owner ? ' (Tú)' : ''}
          </div>
          </div>
          
          
        </section>

        <section className="media-folders" aria-label="Colecciones de medios">
          <h2 className='filesTittle'>Colecciones de Medios</h2>
          <div className='filesContent'>
            {Object.entries(memory.media).map(([folderName, files]) => (
              <article key={folderName} className="folder" itemScope itemType="http://schema.org/MediaObject">
                <div
                  className="folder-header"
                  onClick={() => handleFolderToggle(folderName)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFolderToggle(folderName)}
                  tabIndex={0}
                  role="button"
                  aria-expanded={expandedFolder === folderName}
                  aria-label={`Expandir carpeta ${folderName}`}
                >
                  <span className="folder-icon" aria-hidden="true">{folderIcons[folderName]}</span>
                  <span className="folder-name" itemProp="name">{folderName}</span>
                  <span className="folder-count">{files.length} elementos</span>
                  <button className="toggle-button" aria-hidden="true">
                    {expandedFolder === folderName ? '↑' : '↓'}
                  </button>
                </div>
                {expandedFolder === folderName && files.length > 0 && (
                  <div className="folder-content expanded">
                    <div className="media-grid">
                      {files.map((file, index) => (
                        <div
                          key={file.id}
                          className="media-item"
                          onClick={() => handleMediaSelect(file, files, index)}
                          onKeyDown={(e) => e.key === 'Enter' && handleMediaSelect(file, files, index)}
                          tabIndex={0}
                          role="button"
                          aria-label={`Seleccionar ${file.name}`}
                          itemScope
                          itemType="http://schema.org/MediaObject"
                        >
                          {file.type.startsWith('image/') ? (
                            <img
                              src={file.thumbnail || file.url}
                              alt={file.name}
                              loading="lazy"
                              itemProp="contentUrl"
                              onLoad={() => setIsMediaLoading(false)}
                            />
                          ) : file.type.startsWith('video/') ? (
                            <div className="video-preview">
                              <span className="play-icon" aria-hidden="true">▶</span>
                              <img src={file.thumbnail} alt={`Miniatura de ${file.name}`} loading="lazy" itemProp="thumbnailUrl" />
                            </div>
                          ) : (
                            <div className="file-preview">
                              <span aria-hidden="true">{folderIcons[folderName]}</span>
                            </div>
                          )}
                          <div className="media-name" itemProp="name">{file.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>

      {selectedMedia && (
        <div className="media-player" role="dialog" aria-label="Reproductor de medios">
          <button
            className="close-button"
            onClick={handleCloseMediaPlayer}
            aria-label="Cerrar reproductor"
          >
            ×
          </button>
          <div className="player-content">
            {isMediaLoading && <div className="media-loading" aria-live="polite">Cargando...</div>}
            {selectedMedia.type.startsWith('image/') && (
              <img
                src={selectedMedia.url}
                alt={selectedMedia.name}
                className="media-image"
                itemProp="contentUrl"
              />
            )}
            {selectedMedia.type.startsWith('video/') && (
              <>
                <video
                  ref={videoRef}
                  src={selectedMedia.url}
                  className="media-video"
                  controls={false}
                  aria-label={`Video: ${selectedMedia.name}`}
                  itemProp="contentUrl"
                />
                <progress
                  value={videoRef.current?.currentTime || 0}
                  max={videoRef.current?.duration || 100}
                  aria-label="Progreso del video"
                />
              </>
            )}
            {!selectedMedia.type.startsWith('image/') && !selectedMedia.type.startsWith('video/') && (
              <div className="unsupported-media">
                Formato no soportado: {selectedMedia.name}
              </div>
            )}
          </div>
          <div className="player-controls">
            <button
              className="prev-button"
              onClick={handlePrevMedia}
              disabled={currentMediaIndex === 0}
              aria-label="Medio anterior"
            >
              ⏮
            </button>
            {selectedMedia.type.startsWith('video/') && (
              <button
                className="play-pause-button"
                onClick={handlePlayPause}
                aria-label={isPlaying ? 'Pausar video' : 'Reproducir video'}
              >
                {isPlaying ? '⏸' : '▶'}
              </button>
            )}
            <button
              className="next-button"
              onClick={handleNextMedia}
              disabled={currentMediaIndex === currentMediaList.length - 1}
              aria-label="Siguiente medio"
            >
              ⏭
            </button>
          </div>
        </div>
      )}
    </div>
  );
};





const mockMemory = {
  id: '1',
  title: '..Vacaciones de Verano 2024..Vacaciones de Verano 2024..Vacaciones de Verano 2024.Vacaciones de Verano 2024..Vacaciones de Verano 2024..Vacaciones de Verano 2024.Vacaciones de Verano 2024',
  description:
    'Unas vacaciones de verano increíbles llenas de hermosos recuerdos, paisajes impresionantes y momentos maravillosos con familia y amigos.    Unas vacaciones de verano increíbles llenas de hermosos recuerdos, paisajes impresionantes y momentos maravillosos con familia y amigos.   Unas vacaciones de verano increíbles llenas de hermosos recuerdos, paisajes impresionantes y momentos maravillosos con familia y amigos. Unas vacaciones de verano increíbles llenas de hermosos recuerdos, paisajes impresionantes y momentos maravillosos con familia y amigos.    Unas vacaciones de verano increíbles llenas de hermosos recuerdos, paisajes impresionantes y momentos maravillosos con familia y amigos. Unas vacaciones de verano increíbles llenas de hermosos recuerdos, paisajes impresionantes y momentos maravillosos con familia y amigos. Unas vacaciones de verano increíbles llenas de hermosos recuerdos, paisajes impresionantes y momentos maravillosos con familia y amigos.',
  createdAt: '2024-06-15T10:30:00Z',
  updatedAt: '2024-06-20T14:45:00Z',
  visibility: 'public',
  owner: 'john.doe@example.com',
  media: {
    photos: [
      {
        id: '1',
        name: 'sunset-beach.jpg',
        url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
        thumbnail:
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop',
        type: 'image/jpeg',
        size: 2048576,
        createdAt: '2024-06-15T10:30:00Z',
      },
      {
        id: '2',
        name: 'mountain-view.jpg',
        url: 'https://images.unsplash.com/photo-1464822759844-d150baec0c86?w=800&h=600&fit=crop',
        thumbnail:
          'https://images.unsplash.com/photo-1464822759844-d150baec0c86?w=200&h=200&fit=crop',
        type: 'image/jpeg',
        size: 1843200,
        createdAt: '2024-06-16T09:15:00Z',
      },
    ],
    videos: [
      {
        id: '4',
        name: 'beach-waves.mp4',
        url: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
        thumbnail:
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop',
        type: 'video/mp4',
        size: 5242880,
        createdAt: '2024-06-15T11:00:00Z',
      },
    ],
    audios: [],
    documents: [],
  },
};

export default function Home() {
  return (
    <MemoryDetail
      memory={mockMemory}
      loading={false}
      userEmail="john.doe@example.com"
      hasAccess={true}
    />
  );
}