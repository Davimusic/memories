import React, { useState } from 'react';

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
            <Image
              src={image.url}
              alt={image.alt || `Image ${index}`}
              width={600}
              height={400}
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

export default ImagesRenderer