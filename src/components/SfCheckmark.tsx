import React, { useState } from 'react';

interface SfCheckmarkProps {
  className?: string;
  size?: number | string;
}

/**
 * Apple SF Symbols Checkmark Glyph (Monochrome White)
 * Grounded in: https://github.com/andrewtavis/sf-symbols-online/blob/master/glyphs/checkmark.png?raw=true
 * Backed by local instant asset and SVG fallback.
 */
export const SfCheckmark: React.FC<SfCheckmarkProps> = ({ 
  className = 'w-4 h-4',
  size 
}) => {
  const [useFallback, setUseFallback] = useState(false);

  if (useFallback) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`${className} text-white shrink-0 pointer-events-none select-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]`}
        style={size ? { width: size, height: size } : undefined}
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  }

  return (
    <img
      src="/icons/sf-checkmark-white.png"
      alt="Checkmark"
      referrerPolicy="no-referrer"
      className={`${className} aspect-square object-contain brightness-0 invert pointer-events-none select-none shrink-0 drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]`}
      style={size ? { width: size, height: size } : undefined}
      onError={() => {
        setUseFallback(true);
      }}
    />
  );
};

export default SfCheckmark;
