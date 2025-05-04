import React from "react";

const SpinnerIcon = ({ size = 30 }) => {
  return (
    <div className="spinner-wrapper">
      <svg
        width={size}
        height={size}
        viewBox="0 0 50 50"
        className="spinner"
        stroke="white"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle className="path" cx="25" cy="25" r="20" />
      </svg>
      <style jsx>{`
        .spinner-wrapper {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: ${size}px;
          height: ${size}px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000; /* Asegura que el spinner se muestre por encima del contenido */
        }
        .spinner {
          animation: rotate 2s linear infinite;
        }
        .path {
          stroke-dasharray: 90, 150;
          stroke-dashoffset: 0;
          animation: dash 1.5s ease-in-out infinite;
        }
        @keyframes rotate {
          100% {
            transform: rotate(360deg);
          }
        }
        @keyframes dash {
          0% {
            stroke-dasharray: 1, 150;
            stroke-dashoffset: 0;
          }
          50% {
            stroke-dasharray: 90, 150;
            stroke-dashoffset: -35;
          }
          100% {
            stroke-dasharray: 90, 150;
            stroke-dashoffset: -124;
          }
        }
      `}</style>
    </div>
  );
};

export default SpinnerIcon;

