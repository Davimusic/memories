import React, { useState } from 'react';
import { marked } from 'marked';

const TableOfContents = ({ content }) => {
  const htmlContent = marked(content, {
    renderer: new marked.Renderer(),
    gfm: true,
    breaks: true,
  });

  const handleClick = (e, href) => {
    e.preventDefault();
    const targetId = href.replace('#', '');
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Tabla de Contenidos</h2>
      <div
        className="toc-content"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        onClick={(e) => {
          if (e.target.tagName === 'A' && e.target.getAttribute('href').startsWith('#')) {
            handleClick(e, e.target.getAttribute('href'));
          }
        }}
      />
    </div>
  );
};

export default TableOfContents