import React, { useState } from 'react';


const ProgressBar = ({ percentage, type = 'linear', message, color = 'primary', size = 'medium' }) => {
  if (type === 'circular') {
    const strokeWidth = 8;
    const radius = 50 - strokeWidth / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    return (
      <div className={`progress-circular ${size}`}>
        <svg className="circular-svg" viewBox="0 0 100 100" aria-valuenow={percentage} aria-valuemin="0" aria-valuemax="100">
          <circle className="circular-bg" cx="50" cy="50" r={radius} strokeWidth={strokeWidth} />
          <circle
            className={`circular-progress ${color}`}
            cx="50"
            cy="50"
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="circular-text">
          {percentage}%
          {message && <span className="circular-message">{message}</span>}
        </div>
      </div>
    );
  }
  return (
    <div className={`progress-linear ${size}`} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      {/*<div className="progress-info" style={{ whiteSpace: 'nowrap' }}>
        {message && <span className="progress-message">{message}</span>}
      </div>*/}
      <div className="progress-track" style={{ flex: 1 }} role="progressbar" aria-valuenow={percentage} aria-valuemin="0" aria-valuemax="100">
        <div className={`progress-bar ${color}`} style={{ width: `${percentage}%` }}></div>
      </div>
      {/*<span className="progress-percentage">{percentage}%</span>*/}
    </div>
  );
};


export default ProgressBar