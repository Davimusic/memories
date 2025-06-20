import React, { useState } from 'react';

const VideosRenderer = ({ videos }) => {
  if (!videos || videos.length === 0) return null;
  return (
    <div className="related-videos py-8">
      <h3 className="text-2xl font-bold mb-4">Related Videos</h3>
      <div className="video-grid">
        {videos.map((video, index) => (
          <div key={index} className="video-container">
            <iframe
              width="100%"
              height="315"
              src={`https://www.youtube.com/embed/${video.split('v=')[1]}`}
              title={`Video ${index + 1}`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideosRenderer