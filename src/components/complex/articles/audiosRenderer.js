import React, { useState } from 'react';

const AudiosRenderer = ({ audios }) => {
  if (!audios || audios.length === 0) return null;
  return (
    <div className="related-audios py-8">
      <h3 className="text-2xl font-bold mb-4">Related Audios</h3>
      <div className="audioContainer">
        {audios.map((audio, index) => (
          <div key={index} className="">
            <p className="text-sm font-semibold mb-2">
              {typeof audio === 'string' ? `Audio ${index + 1}` : audio.title || `Audio ${index + 1}`}
            </p>
            <audio
              src={typeof audio === 'string' ? audio : audio.url}
              controls
              className="w-full"
              aria-label={typeof audio === 'string' ? `Audio ${index + 1}` : audio.title || `Audio ${index + 1}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AudiosRenderer