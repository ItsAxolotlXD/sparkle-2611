import React, { useState } from 'react';
import { RotateCw, Maximize2, Minimize2, ExternalLink } from 'lucide-react';
import { SpinningRing } from '../components/SpinningRing';

export const Photopea: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleReload = () => {
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  return (
    <div
      className={`w-full flex flex-col bg-[#f3f3f3] dark:bg-[#202020] transition-all select-none ${
        isFullscreen
          ? 'fixed inset-0 z-50 h-screen'
          : 'h-[calc(100vh-64px)] min-h-[580px] rounded-[10px] overflow-hidden border border-black/10 dark:border-white/10 shadow-sm'
      }`}
    >
      {/* Mini top toolbar for Photopea tab - Sparkle Fluent style */}
      <div className="h-10 px-3 sm:px-4 bg-white dark:bg-[#272727] border-b border-black/10 dark:border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-xs font-semibold text-black dark:text-white">
          <div className="w-2 h-2 rounded-full bg-[#18a0fb] animate-pulse" />
          <span>Photopea</span>
          <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-normal">
            photopea.com
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold uppercase">
            Photo Editor
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => window.open('https://www.photopea.com/', '_blank', 'noopener,noreferrer')}
            title="Open in new tab"
            className="w-7 h-7 rounded-[4px] flex items-center justify-center text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleReload}
            title="Reload Photopea"
            className="w-7 h-7 rounded-[4px] flex items-center justify-center text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            className="w-7 h-7 rounded-[4px] flex items-center justify-center text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition-colors"
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Embedded Iframe Container */}
      <div className="flex-1 relative w-full h-full bg-[#1e1e1e]">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#f3f3f3] dark:bg-[#202020] text-[#111827] dark:text-white space-y-3">
            <SpinningRing size={52} strokeWidth={5} />
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              Loading Photopea Editor...
            </p>
          </div>
        )}

        <iframe
          key={iframeKey}
          src="https://www.photopea.com/"
          title="Photopea Online Photo Editor"
          className="w-full h-full border-none"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; cross-origin-isolated; camera; microphone"
          allowFullScreen
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </div>
  );
};
