import React, { useState, useEffect } from 'react';
import { useSettings, getTaskbarHeightPx } from '../hooks/useSettings';

interface EvaluationWatermarkProps {
  className?: string;
}

export const EvaluationWatermark: React.FC<EvaluationWatermarkProps> = ({ className = '' }) => {
  const { settings } = useSettings();
  const [isVisible, setIsVisible] = useState(true);
  const taskbarHeight = getTaskbarHeightPx(settings.taskbarScale);

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
        settings.windowsMode ? 'hidden md:block right-4 sm:right-5' : 'bottom-3 right-4 sm:bottom-4 sm:right-6'
      } ${settings.windowsMode ? 'z-[2]' : 'z-[9990]'} pointer-events-none select-none text-right transition-opacity duration-1000 ease-in-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      } text-white text-[11px] sm:text-[12px] leading-[1.35] font-normal tracking-normal ${className}`}
      style={{
        bottom: settings.windowsMode ? `${taskbarHeight + 8}px` : undefined,
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
