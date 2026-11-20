import React, { useEffect, useState } from 'react';
import { SpinningRing } from './SpinningRing';

const LOGO_SRC = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-iTzEG0iuHLTKbWp5e2y55NABj3UWZr.png';

interface SplashScreenProps {
  duration?: number;
  ringSize?: number;
  onFinish?: () => void;
  subtitle?: string;
  isClosable?: boolean;
  showWatermark?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  duration = 3000,
  ringSize = 34,
  onFinish,
  subtitle,
  isClosable = true,
  showWatermark = true
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [logoError, setLogoError] = useState(false);
  const [isRingGifReady, setIsRingGifReady] = useState(false);

  useEffect(() => {
    const timer = isRingGifReady
      ? setTimeout(() => {
          setIsVisible(false);
          onFinish?.();
        }, duration)
      : undefined;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isClosable && e.key === 'Escape') {
        setIsVisible(false);
        onFinish?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [duration, onFinish, isClosable, isRingGifReady]);

  if (!isVisible) return null;

  return (
    <div
      id="vplay-splash-screen"
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center select-none bg-[#1b1f24] text-white"
    >
      {/* Splash content: logo, spinning ring and subtitle all centered together with enlarged gap */}
      <div className="flex flex-col items-center justify-center gap-12 sm:gap-16 text-center px-6 max-w-md w-full">
        {/* Logo in the center */}
        <div className="flex items-center justify-center">
          {!logoError ? (
            <img
              src={LOGO_SRC}
              alt="Sparkle"
              referrerPolicy="no-referrer"
              className="h-16 sm:h-20 md:h-24 w-auto max-w-[180px] sm:max-w-[220px] object-contain drop-shadow-md transition-all"
              onError={() => setLogoError(true)}
            />
          ) : (
            <span className="text-[#4cc2ff] font-black text-5xl sm:text-6xl tracking-tighter">V</span>
          )}
        </div>

        {/* Spinning ring and subtitle centered with generous spacing below logo */}
        <div className="flex flex-col items-center justify-center gap-3 text-center px-4">
          <SpinningRing
            size={ringSize}
            strokeWidth={4}
            onGifReady={() => setIsRingGifReady(true)}
          />
          {subtitle && (
            <p className="text-[12.5px] sm:text-[13.5px] text-white/90 font-normal tracking-wide max-w-md">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Watermark in bottom right corner */}
      {showWatermark && (
        <div
          id="splash-watermark"
          className="absolute bottom-4 right-5 sm:bottom-6 sm:right-7 z-10 text-right select-none pointer-events-none text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.85)] text-[11px] sm:text-[12px] leading-[1.35] font-normal"
          style={{ fontFamily: "'Segoe UI Variable Text', 'Segoe UI', system-ui, sans-serif", color: '#ffffff' }}
        >
          <div style={{ color: '#ffffff' }}>Sparkle 27M1 Insider Preview</div>
          <div style={{ color: '#ffffff' }}>Evaluation copy. Build 26170.Moment 1 (2027)</div>
        </div>
      )}
    </div>
  );
};
