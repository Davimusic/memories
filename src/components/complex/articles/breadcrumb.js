import React, { useState } from 'react';

const Breadcrumb = ({ items, separator = '/', color = 'primary' }) => {
  return (
    <nav className={`breadcrumb ${color}`} aria-label="Breadcrumb">
      <ol>
        {items.map((item, index) => (
          <li key={index} className="breadcrumb-item">
            {index === items.length - 1 ? (
              <span aria-current="page" className="breadcrumb-current">{item.label}</span>
            ) : (
              <>
                <a href={item.path} title={`Go to ${item.label}`} className="breadcrumb-link">{item.label}</a>
                {index < items.length - 1 && (
                  <span className="breadcrumb-separator" aria-hidden="true">{separator}</span>
                )}
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb