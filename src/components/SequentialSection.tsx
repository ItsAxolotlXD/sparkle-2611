import React, { useState, useEffect, useRef } from 'react';
import { SpinningRing } from './SpinningRing';

interface SequentialSectionProps {
  children: React.ReactNode;
  order: number;
  enabled?: boolean;
  className?: string;
  minHeight?: string | number;
}

export const SequentialSection: React.FC<SequentialSectionProps> = ({
  children,
  order,
  enabled = false,
  className = '',
  minHeight = '140px',
}) => {
  // If order === 0 or sequential loading is disabled, render immediately (initial 1 portion of page)
  const [isLoaded, setIsLoaded] = useState(() => !enabled || order === 0);
  const [isTriggered, setIsTriggered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled || order === 0 || isLoaded) {
      setIsLoaded(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          setIsTriggered(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '20px 0px',
        threshold: 0.05,
      }
    );

    const el = containerRef.current;
    if (el) {
      observer.observe(el);
    }

    return () => {
      observer.disconnect();
    };
  }, [enabled, order, isLoaded]);

  // When placeholder enters viewport upon scrolling down, run loading ring for 1 second before loading more
  useEffect(() => {
    if (isTriggered && !isLoaded) {
      timerRef.current = setTimeout(() => {
        setIsLoaded(true);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isTriggered, isLoaded]);

  if (!enabled || isLoaded) {
    return (
      <div className={`sequential-section-loaded ${order > 0 ? 'slide-up-refresh' : ''} ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ minHeight }}
      className={`sequential-section-placeholder w-full flex flex-col items-center justify-center py-10 select-none ${className}`}
    >
      <div className="flex flex-col items-center justify-center gap-3">
        <SpinningRing size={34} strokeWidth={3.8} />
        <span className="text-xs text-[#888888] dark:text-[#AAAAAA] font-normal tracking-wide">
          Đang tải thêm nội dung...
        </span>
      </div>
    </div>
  );
};
