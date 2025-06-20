import React, { useState } from 'react';

const LinksRenderer = ({ text, url }) => {
  if (!text || !url) return null;
  return (
    <div className="additional-resource">
      <h3>Additional Resource</h3>
      <ul className="additional-links">
        <li>
          <a href={url} title={`Visit ${text} for more information`} target="_blank" rel="noopener noreferrer">
            {text}
          </a>
        </li>
      </ul>
    </div>
  );
};

export default LinksRenderer