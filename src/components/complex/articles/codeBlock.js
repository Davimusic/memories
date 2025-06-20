import React, { useState } from 'react';

const CodeBlock = ({ content }) => {
  const codeLines = content.split('\n');
  if (codeLines.length < 3) return null;
  const language = codeLines[0].replace(/```(\w+)?/, '$1') || 'jsx';
  const code = codeLines.slice(1, -1).join('\n');
  return (
    <div className="code-block">
      <div className="code-header">{language.toUpperCase()}</div>
      <div className="code-content">
        <pre><code>{code}</code></pre>
      </div>
    </div>
  );
};

export default CodeBlock