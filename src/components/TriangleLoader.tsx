import React from 'react';
interface TriangleLoaderProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

/**
 * Replaced with thick spinning ring (colored #4cc2ff) as requested.
 */
export const TriangleLoader: React.FC<TriangleLoaderProps> = ({
  size = 56,
  className = ''
}) => {
  return (
    <div
      role="status"
      aria-label="Đang tải..."
      className={`inline-flex items-center justify-center select-none pointer-events-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 44 44" width={size} height={size} className="fluent-spinning-ring" aria-hidden="true">
        <defs>
          <linearGradient id="triangle-loader-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff2df7" />
            <stop offset="50%" stopColor="#d946ef" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <path d="M22 5L39 36H5L22 5Z" fill="none" stroke="url(#triangle-loader-gradient)" strokeWidth={Math.max(4, Math.round(size / 14))} strokeLinejoin="round" />
      </svg>
    </div>
  );
};
