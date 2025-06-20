import React, { useState } from 'react';

const CreateSectionWrapper = ({ referenceId, children }) => {
  if (!referenceId || typeof referenceId !== 'string') {
    throw new Error('referenceId is required and must be a string');
  }
  return (
    <section 
      id={referenceId}
      role="region"
      aria-labelledby={`${referenceId}-heading`}
      className="w-full max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg my-6"
    >
      <div className="flex flex-col gap-4">
        {children}
      </div>
    </section>
  );
};

export default CreateSectionWrapper