import React, { useState, useEffect } from 'react';
import { useSettings } from '../hooks/useSettings';

interface EvaluationWatermarkProps {
  className?: string;
}

export const EvaluationWatermark: React.FC<EvaluationWatermarkProps> = ({ className = '' }) => {
  const { settings } = useSettings();
  const [isVisible, setIsVisible] = useState(true);
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

  // 30 seconds visible -> 30 seconds hidden cycle
  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible((prev) => !prev);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      id="in-app-evaluation-watermark"
      aria-hidden="true"
      className={`fixed ${
        settings.windowsMode ? 'bottom-14 right-4 sm:bottom-14 sm:right-5' : 'bottom-3 right-4 sm:bottom-4 sm:right-6'
      } z-[9990] pointer-events-none select-none text-right transition-opacity duration-1000 ease-in-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      } text-white text-[11px] sm:text-[12px] leading-[1.35] font-normal tracking-normal ${className}`}
      style={{
        fontFamily: "'Segoe UI Variable Text', 'Segoe UI', system-ui, sans-serif",
        color: '#ffffff',
        textShadow: 'none',
      }}
    >
      <div style={{ color: '#ffffff', textShadow: 'none' }}>Sparkle 27M1 Insider Preview</div>
      <div style={{ color: '#ffffff', textShadow: 'none' }}>Evaluation copy. Build 26165.Moment 1 (2027)</div>
    </div>
  );
};
