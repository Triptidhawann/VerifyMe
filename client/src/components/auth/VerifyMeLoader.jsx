import React from 'react';

/**
 * VerifyMeLoader — A signature custom mint verification loading indicator.
 * Displays a smooth pulsing ring around an authentic verification checkmark/shield.
 *
 * @param {string} size - 'sm' (16px), 'md' (24px), or 'lg' (36px)
 * @param {string} variant - 'mint' (mint ring/shield on light bg) or 'white' (white on mint button)
 * @param {string} label - Accessible label for screen readers
 */
export const VerifyMeLoader = ({ 
  size = 'md', 
  variant = 'mint', 
  label = 'Loading...' 
}) => {
  const sizeMap = {
    sm: { container: 18, stroke: 2, icon: 10 },
    md: { container: 26, stroke: 2.5, icon: 14 },
    lg: { container: 40, stroke: 3, icon: 20 },
  };

  const currentSize = sizeMap[size] || sizeMap.md;
  const isWhite = variant === 'white';

  const ringColor = isWhite ? 'rgba(255, 255, 255, 0.35)' : 'rgba(73, 185, 154, 0.2)';
  const activeArcColor = isWhite ? '#FFFFFF' : '#49B99A';
  const checkColor = isWhite ? '#FFFFFF' : '#49B99A';

  return (
    <div 
      className={`verifyme-loader verifyme-loader--${size} verifyme-loader--${variant}`}
      role="status"
      aria-label={label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        width: `${currentSize.container}px`,
        height: `${currentSize.container}px`,
        flexShrink: 0
      }}
    >
      <svg
        width={currentSize.container}
        height={currentSize.container}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="verifyme-loader-svg"
      >
        {/* Subtle background static ring */}
        <circle
          cx="16"
          cy="16"
          r="13"
          stroke={ringColor}
          strokeWidth={currentSize.stroke}
          strokeLinecap="round"
        />
        {/* Smooth animated active arc */}
        <circle
          cx="16"
          cy="16"
          r="13"
          stroke={activeArcColor}
          strokeWidth={currentSize.stroke}
          strokeDasharray="40 50"
          strokeLinecap="round"
          className="verifyme-loader-spinning-arc"
        />
        {/* Inner Verification Checkmark */}
        <path
          d="M10.5 16.5L14.2 20.2L21.5 12"
          stroke={checkColor}
          strokeWidth={currentSize.stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="verifyme-loader-check"
        />
      </svg>
      <span className="sr-only" style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0
      }}>
        {label}
      </span>
    </div>
  );
};

export default VerifyMeLoader;
