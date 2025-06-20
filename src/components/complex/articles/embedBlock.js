import React, { useState } from 'react';


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

export default EmbedBlock