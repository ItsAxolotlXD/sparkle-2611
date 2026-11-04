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
  const [isLightMode, setIsLightMode] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('light-mode');
    }
    return false;
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const checkTheme = () => {
      setIsLightMode(document.documentElement.classList.contains('light-mode'));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

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

  // In WinUI 3 tab, primary button color is:
  // - Dark mode: #4cc2ff
  // - Light mode: #005fb8
  const primaryButtonColor = isLightMode ? '#005fb8' : '#4cc2ff';

  return (
    <div
      id="vplay-splash-screen"
      className={`fixed inset-0 z-[99999] ${
        isLightMode ? 'bg-[#f9f9f9] text-[#111827]' : 'bg-[#1b1f24] text-white'
      } flex flex-col items-center justify-center select-none transition-colors duration-200`}
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
            <span className={`${isLightMode ? 'text-[#005fb8]' : 'text-[#4cc2ff]'} font-black text-5xl sm:text-6xl tracking-tighter`}>V</span>
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
            <p className={`text-[12.5px] sm:text-[13.5px] ${isLightMode ? 'text-[#111827]/85' : 'text-[#FFFFFF]/90'} font-normal tracking-wide max-w-md`}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Watermark in bottom right corner */}
      {showWatermark && (
        <div
          id="splash-watermark"
          className={`absolute bottom-4 right-5 sm:bottom-6 sm:right-7 z-10 text-right select-none pointer-events-none ${
            isLightMode ? 'text-black/60' : 'text-white/60'
          } text-[11px] sm:text-[12px] leading-[1.35] font-normal`}
          style={{ fontFamily: "'Segoe UI Variable Text', 'Segoe UI', system-ui, sans-serif" }}
        >
          <div>Sparkle 26.12 Insider Preview</div>
          <div>Evaluation copy. Build 26105.11.co_release-1309</div>
        </div>
      )}
    </div>
  );
};
