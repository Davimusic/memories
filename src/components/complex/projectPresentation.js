// components/projectPresentation.js
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import '../../estilos/general/projectPresentation.css'

const ProjectPresentation = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('images');

  const fileTypes = [
    { id: 'images', name: 'Imágenes', icon: '🖼️', extensions: ['JPG', 'PNG', 'GIF', 'WEBP'] },
    { id: 'videos', name: 'Videos', icon: '🎬', extensions: ['MP4', 'MOV', 'AVI', 'MKV'] },
    { id: 'audio', name: 'Audio', icon: '🎵', extensions: ['MP3', 'WAV', 'FLAC', 'OGG'] },
    { id: 'docs', name: 'Documentos', icon: '📄', extensions: ['PDF', 'DOC', 'DOCX', 'TXT'] },
    { id: 'other', name: 'Otros', icon: '📦', extensions: ['ZIP', 'RAR', 'EXE', 'ISO'] }
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
            {[...Array(9)].map((_, i) => (
              <div key={i} className={`grid-item visual-item-${i+1}`}></div>
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
                <div className="preview-image img1"></div>
                <div className="preview-image img2"></div>
                <div className="preview-image img3"></div>
              </div>
            )}
            
            {activeTab === 'videos' && (
              <div className="video-preview">
                <div className="video-player">
                  <div className="play-button">▶</div>
                </div>
                <div className="video-info">
                  <h4 className="title-xs color1">Video de vacaciones</h4>
                  <p className="content-small color1">MP4 • 1080p • 2:45 min</p>
                </div>
              </div>
            )}
            
            {activeTab === 'audio' && (
              <div className="audio-preview">
                <div className="audio-player">
                  <div className="waveform">
                    {[...Array(20)].map((_, i) => (
                      <div key={i} className="wave-bar" style={{ height: `${10 + Math.random() * 50}%` }}></div>
                    ))}
                  </div>
                  <div className="player-controls">
                    <button className="control-button">⏮</button>
                    <button className="control-button play">▶</button>
                    <button className="control-button">⏭</button>
                  </div>
                </div>
                <div className="audio-info">
                  <h4 className="title-xs color1">Canción favorita</h4>
                  <p className="content-small color1">MP3 • 3:22 min</p>
                </div>
              </div>
            )}
            
            {activeTab === 'docs' && (
              <div className="doc-preview">
                <div className="document">
                  <div className="doc-header">
                    <div className="doc-icon">📄</div>
                    <h4 className="title-xs color1">Receta familiar.pdf</h4>
                  </div>
                  <div className="doc-content">
                    <p className="content-default color1">
                      <strong>Ingredientes:</strong><br/>
                      - Harina<br/>
                      - Azúcar<br/>
                      - Huevos<br/>
                      - Leche<br/>
                      <strong>Preparación:</strong><br/>
                      1. Mezclar todos los ingredientes...
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'other' && (
              <div className="other-preview">
                <div className="archive">
                  <div className="archive-icon">📦</div>
                  <h4 className="title-xs color1">Fotos_vacaciones.zip</h4>
                  <p className="content-small color1">125 MB • 48 archivos</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="file-info">
            <h3 className="title-sm color1">{fileTypes.find(t => t.id === activeTab).name}</h3>
            <p className="content-default color1">
              Good Memories soporta todos los formatos estándar para que puedas almacenar cualquier tipo de archivo sin preocupaciones.
            </p>
            <div className="supported-formats">
              <h4 className="title-xxs color4">Formatos soportados:</h4>
              <div className="format-badges">
                {fileTypes.find(t => t.id === activeTab).extensions.map((ext, i) => (
                  <span key={i} className="format-badge">{ext}</span>
                ))}
              </div>
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

export default ProjectPresentation;