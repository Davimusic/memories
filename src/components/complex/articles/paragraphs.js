import React, { useState } from 'react';


const Paragraphs = ({ data }) => {
  console.log('Paragraphs data:', data);
  const { title = '', content = [] } = data || {};
  if (!title && content.length === 0) {
    console.warn('Paragraphs: No title or content provided');
    return null;
  }

  const parseContent = (text) => {
    if (!text || typeof text !== 'string') return text;

    const lines = text.split('\n');
    let isList = false;
    const elements = [];
    let currentListItems = [];

    lines.forEach((line, index) => {
      const listMatch = line.match(/^\s*-\s*(.+)$/);
      const parseInline = (str) => {
        const parts = [];
        let lastIndex = 0;
        const regex = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)/g;
        let match;
        while ((match = regex.exec(str)) !== null) {
          const before = str.slice(lastIndex, match.index);
          if (before) parts.push(before);
          if (match[1]) {
            console.log('Bold match:', match[1]);
            parts.push(
              <span
                key={`${match.index}-bold-${match[1]}`}
                style={{ fontWeight: 700, color: '#2563eb' }}
              >
                {match[1]}
              </span>
            );
          } else if (match[2] && match[3]) {
            console.log('Link match:', match[2], match[3]);
            parts.push(
              <a
                key={`${match.index}-link-${match[2]}`}
                href={match[3]}
                title={`Visit ${match[2]} for more information`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#3b82f6', textDecoration: 'underline' }}
                onMouseOver={(e) => (e.target.style.color = '#1d4ed8')}
                onMouseOut={(e) => (e.target.style.color = '#3b82f6')}
              >
                {match[2]}
              </a>
            );
          }
          lastIndex = match.index + match[0].length;
        }
        if (lastIndex < str.length) parts.push(str.slice(lastIndex));
        return parts.length > 0 ? parts : str;
      };

      if (listMatch) {
        isList = true;
        const listText = listMatch[1];
        currentListItems.push(
          <li key={index} style={{ marginBottom: '0.25rem' }}>
            {parseInline(listText)}
          </li>
        );
      } else {
        if (isList && currentListItems.length > 0) {
          elements.push(
            <ul
              key={`list-${index}`}
              style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginBottom: '1rem' }}
            >
              {currentListItems}
            </ul>
          );
          currentListItems = [];
          isList = false;
        }
        if (line.trim()) {
          elements.push(
            <span key={index} style={{ display: 'block', marginBottom: '1rem' }}>
              {parseInline(line)}
            </span>
          );
        }
      }
    });

    if (isList && currentListItems.length > 0) {
      elements.push(
        <ul key="list-end" style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginBottom: '1rem' }}>
          {currentListItems}
        </ul>
      );
    }

    return elements;
  };

  return (
    <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '1rem' }}>
      {title && <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>{title}</h2>}
      {content.map((block, index) => {
        const { text = '', highlight = '', continueText = '' } = block;
        if (!text && !highlight && !continueText) {
          console.warn(`Paragraphs: Empty content block at index ${index}`);
          return null;
        }

        let combinedText = text;
        if (highlight) combinedText += ` **${highlight}**`;
        if (continueText) combinedText += ` ${continueText}`;

        console.log('Combined text:', combinedText);

        const parsedContent = parseContent(combinedText);

        return (
          <div key={index} style={{ marginBottom: '1rem', color: '#1f2937' }}>
            {parsedContent}
          </div>
        );
      })}
    </div>
  );
};

export default Paragraphs