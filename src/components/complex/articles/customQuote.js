import React, { useState } from 'react';

const CustomQuote = ({ quote, author }) => {
  return (
    <div className='CustomQuoteText'>
      <div className={'CustomQuoteAutor'} style={{ borderRadius: '20px'}}>
        <p>{quote}</p>
      </div>
      {author}
    </div>
  );
};

export default CustomQuote