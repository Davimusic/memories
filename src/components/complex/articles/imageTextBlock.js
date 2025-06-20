import React, { useState } from 'react';
import Paragraphs from './paragraphs';
import Image from 'next/image';


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
          <Image 
            src={imageUrl} 
            alt={imageAlt} 
            className={imageClass}
            width={600}
            height={400}
            style={{ borderRadius: '20px' }}
            loading="lazy"
          />
          <div className="text-content">
            <Paragraphs data={paragraphData} />
          </div>
        </>
      ) : (
        <>
          <div className="text-content">
            <Paragraphs data={paragraphData} />
          </div>
          <Image 
            src={imageUrl} 
            alt={imageAlt} 
            className={imageClass}
            width={600}
            height={400}
            loading="lazy"
          />
        </>
      )}
    </div>
  );
};

export default ImageTextBlock