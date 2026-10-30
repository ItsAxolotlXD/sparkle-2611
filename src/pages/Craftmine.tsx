import React, { useState } from 'react';
import { ExternalLink, RotateCw, Maximize2, Minimize2 } from 'lucide-react';
import { SpinningRing } from '../components/SpinningRing';

export const Craftmine: React.FC = () => {
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
      {/* Mini top toolbar for Craftmine tab */}
      <div className="h-10 px-3 sm:px-4 bg-white dark:bg-[#272727] border-b border-black/10 dark:border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-xs font-semibold text-black dark:text-white">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Craftmine</span>
          <span className="text-[10px] text-black dark:text-neutral-400 font-normal">
            oreui-pi.vercel.app
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleReload}
            title="Reload game"
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
      <div className="flex-1 relative w-full h-full bg-[#18181b]">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#f3f3f3] dark:bg-[#202020] text-[#111827] dark:text-white space-y-3">
            <SpinningRing size={52} strokeWidth={5} />
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              Loading Craftmine...
            </p>
          </div>
        )}

        <iframe
          key={iframeKey}
          src="https://oreui-pi.vercel.app"
          title="Craftmine"
          className="w-full h-full border-none"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; cross-origin-isolated"
          allowFullScreen
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </div>
  );
};
