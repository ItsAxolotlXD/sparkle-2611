import React from 'react';

interface CategoryIconProps {
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  className = 'w-6 h-6 sm:w-7 sm:h-7 shrink-0',
}) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 align-middle category-icon-svg text-black dark:text-transparent ${className}`}
      aria-hidden="true"
    >
      <defs>
        {/* Dark mode: Gradient magenta - purple */}
        <linearGradient
          id="vplay-cat-inverted-triangle-grad"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#ff2df7" />
          <stop offset="50%" stopColor="#d946ef" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>

        {/* Light mode: Gradient magenta - purple */}
        <linearGradient
          id="vplay-cat-inverted-triangle-grad-light"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#d946ef" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      {/* Tam giác ngược: ở Light mode là gradient xanh dương đậm giống spinning ring #005fb8, ở Dark mode là gradient xanh dương nhạt */}
      <path
        d="M 2.2 3.6 H 21.8 L 12 21.6 Z"
        className="category-icon-path stroke-[url(#vplay-cat-inverted-triangle-grad-light)] dark:stroke-[url(#vplay-cat-inverted-triangle-grad)]"
        strokeWidth="3.6"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
};
