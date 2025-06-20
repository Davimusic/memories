import React, { useState, useRef, useEffect } from 'react';

const Tooltip = ({ content, position = 'top', children, delay = 300, disabled = false }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({});
  const tooltipRef = useRef(null);
  const triggerRef = useRef(null);
  let timeout;
  const calculatePosition = () => {
    if (triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      let top, left;
      switch (position) {
        case 'top':
          top = triggerRect.top - tooltipRect.height - 10;
          left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
          break;
        case 'bottom':
          top = triggerRect.bottom + 10;
          left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
          break;
        case 'left':
          top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
          left = triggerRect.left - tooltipRect.width - 10;
          break;
        case 'right':
          top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
          left = triggerRect.right + 10;
          break;
        default:
          top = triggerRect.top - tooltipRect.height - 10;
          left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
      }
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      if (left < 10) left = 10;
      if (left + tooltipRect.width > viewportWidth - 10) left = viewportWidth - tooltipRect.width - 10;
      if (top < 10) top = 10;
      if (top + tooltipRect.height > viewportHeight - 10) top = viewportHeight - tooltipRect.height - 10;
      setCoords({ top, left });
    }
  };
  const showTooltip = () => {
    if (disabled) return;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      setIsVisible(true);
      calculatePosition();
    }, delay);
  };
  const hideTooltip = () => {
    clearTimeout(timeout);
    setIsVisible(false);
  };
  useEffect(() => {
    return () => clearTimeout(timeout);
  }, []);
  return (
    <div className="tooltip-container">
      <div ref={triggerRef} onMouseEnter={showTooltip} onMouseLeave={hideTooltip} onFocus={showTooltip} onBlur={hideTooltip} tabIndex={0} aria-describedby={isVisible ? `tooltip-${content.replace(/\s+/g, '-')}` : undefined}>
        {children}
      </div>
      {isVisible && (
        <div
          id={`tooltip-${content.replace(/\s+/g, '-')}`}
          ref={tooltipRef}
          className={`tooltip ${position}`}
          style={{ top: `${coords.top}px`, left: `${coords.left}px`, opacity: coords.top ? 1 : 0 }}
          role="tooltip"
        >
          {content}
          <span className="tooltip-arrow" aria-hidden="true"></span>
        </div>
      )}
    </div>
  );
};

export default Tooltip