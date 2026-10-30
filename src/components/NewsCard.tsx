import React from 'react';
import { NewsArticle } from '../types';

interface NewsCardProps {
  article: NewsArticle;
  onClick: (article: NewsArticle) => void;
  index?: number;
}

export const NewsCard: React.FC<NewsCardProps> = ({ article, onClick }) => {
  const buildMatch = article.title.match(/Build\s+([A-Za-z0-9.]+)/i) || article.id.match(/\b(26\d+)\b/);
  const buildLabel = buildMatch ? `Build ${buildMatch[1]}` : (article.category || 'Sparkle');

  return (
    <button
      id={`news-card-${article.slug}`}
      type="button"
      onClick={() => onClick(article)}
      className="w-full group relative text-left rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 cursor-pointer select-none bg-[#1c1822] transition-all duration-300"
    >
      {/* Card Background: User-provided fluid artwork */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src="/assets/aistudio/image_ee030999.png"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/15 group-hover:bg-black/5 transition-colors" />
      </div>

      {/* Sheet Preview / Badge Area with Enlarged Build text & reliable frosted blur */}
      <div className="relative z-10 h-44 p-5 flex items-center justify-center">
        <div 
          className="relative px-6 py-3 rounded-2xl border border-white/25 shadow-2xl group-hover:scale-105 group-hover:border-white/40 transition-transform duration-300 overflow-hidden"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.40)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          {/* Hardware-accelerated blurred backdrop clone that never fails or turns opaque during scroll */}
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <img
              src="/assets/aistudio/image_ee030999.png"
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover scale-150 filter blur-xl brightness-75 contrast-125"
            />
            <div className="absolute inset-0 bg-black/35" />
          </div>

          <span 
            className="relative z-10 text-base sm:text-lg font-bold tracking-tight text-white drop-shadow-md select-none" 
            style={{ color: '#ffffff' }}
          >
            {buildLabel}
          </span>
        </div>
      </div>

      {/* Info Section - Frosted dark glass overlay, 2 lines white text */}
      <div 
        className="relative z-10 p-4 border-t border-white/15 overflow-hidden transition-colors"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        {/* Hardware-accelerated blurred backdrop clone that never fails or turns opaque during scroll */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <img
            src="/assets/aistudio/image_ee030999.png"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover scale-150 filter blur-xl brightness-75 contrast-125"
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>

        <h3 
          className="relative z-10 font-semibold line-clamp-2 !text-white text-white group-hover:!text-white transition-opacity leading-snug drop-shadow-sm"
          style={{ color: '#ffffff' }}
        >
          {article.title.replace(/^#\s*/, '')}
        </h3>
      </div>
    </button>
  );
};


