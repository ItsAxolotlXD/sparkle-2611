import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Channel } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { SpinningRing } from './SpinningRing';
import { useIsMobile } from '../hooks/useIsMobile';

interface OnAirSliderProps {
  channels: Channel[];
  onSelectChannel: (channel: Channel) => void;
  navigate: (route: string) => void;
}

export const OnAirSlider: React.FC<OnAirSliderProps> = ({
  channels,
  onSelectChannel,
  navigate
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const isMobile = useIsMobile();
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (scrollContainerRef.current && !scrollContainerRef.current.contains(e.target as Node)) {
        setSelectedChannelId(null);
      }
    };
    document.addEventListener('pointerdown', handleOutsideClick);
    return () => document.removeEventListener('pointerdown', handleOutsideClick);
  }, []);

  // 3-second loading state on tab load before displaying channel logos
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Hàm cuộn mượt mà có gia tốc animation (smooth kinetic easeInOutCubic scroll)
  const animatedScroll = (distance: number, duration: number = 600) => {
    const container = scrollContainerRef.current;
    if (!container || isScrolling) return;

    setIsScrolling(true);
    const start = container.scrollLeft;
    const startTime = performance.now();

    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = easeInOutCubic(progress);

      container.scrollLeft = start + distance * ease;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setIsScrolling(false);
      }
    };

    requestAnimationFrame(step);
  };

  const scroll = (direction: 'left' | 'right') => {
    const offset = direction === 'left' ? -460 : 460;
    animatedScroll(offset, 650);
  };

  return (
    <section className="w-full">
      {/* Header with Title & Slider Controls */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-bold font-square tracking-tight text-[#111827] dark:text-white flex items-center gap-2.5 sm:gap-3">
          <CategoryIcon className="w-8 h-8 sm:w-9 sm:h-9 shrink-0" />
          <span>Đề xuất cho bạn</span>
        </h2>

        <div className="flex items-center gap-1.5">
          <button
            id="slider-prev-btn"
            onClick={() => scroll('left')}
            className="fluent-reveal-item w-7 h-7 rounded-[4px] flex items-center justify-center text-[#6b7280] dark:text-[#a1a1aa] hover:text-black dark:hover:text-white bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 transition-colors cursor-default"
            aria-label="Cuộn sang trái"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            id="slider-next-btn"
            onClick={() => scroll('right')}
            className="fluent-reveal-item w-7 h-7 rounded-[4px] flex items-center justify-center text-[#6b7280] dark:text-[#a1a1aa] hover:text-black dark:hover:text-white bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 transition-colors cursor-default"
            aria-label="Cuộn sang phải"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Cards Scroll với hiệu ứng lướt mượt mà */}
      <div
        ref={scrollContainerRef}
        className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-3 pt-1 no-scrollbar scroll-smooth reveal-group"
      >
        {channels.map((ch, idx) => {
          const isSelected = selectedChannelId === ch.id;
          return (
            <div
              key={`${ch.id}-${isLoading ? 'loading' : 'loaded'}`}
              id={`recommended-channel-${ch.id}`}
              data-recommended-card="true"
              data-selected={isSelected ? 'true' : 'false'}
              role="button"
              tabIndex={0}
              onClick={(e) => {
                if (!isMobile) {
                  e.stopPropagation();
                  setSelectedChannelId(ch.id);
                } else {
                  onSelectChannel(ch);
                  navigate(`/live-tv?channel=${ch.slug}`);
                }
              }}
              onDoubleClick={(e) => {
                if (!isMobile) {
                  e.stopPropagation();
                  onSelectChannel(ch);
                  navigate(`/live-tv?channel=${ch.slug}`);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onSelectChannel(ch);
                  navigate(`/live-tv?channel=${ch.slug}`);
                } else if (e.key === ' ') {
                  e.preventDefault();
                  if (!isMobile) {
                    setSelectedChannelId(ch.id);
                  } else {
                    onSelectChannel(ch);
                    navigate(`/live-tv?channel=${ch.slug}`);
                  }
                }
              }}
              className={`fluent-reveal-item onair-card banner-card channel-card min-w-[84px] sm:min-w-[96px] md:min-w-[108px] h-[46px] sm:h-[50px] md:h-[54px] shrink-0 rounded-[6px] sm:rounded-[8px] p-2 flex items-center justify-center cursor-default group select-none transition-all shadow-xs bg-white dark:bg-[#2c3037] hover:bg-black/[0.02] dark:hover:bg-[#363b43] ${
                isSelected
                  ? 'is-selected border-[3px] border-[#d91a9c] dark:border-[#ff82ff]'
                  : 'border-[3px] border-black/[0.08] dark:border-white/[0.08]'
              } ${!isLoading ? 'slide-up-refresh' : ''}`}
              title={!isMobile ? `${ch.name} — Nhấp để chọn, nhấp đúp để mở` : ch.name}
              aria-label={ch.name}
              aria-selected={isSelected}
            >
            <div className="w-full h-full flex items-center justify-center">
              {isLoading ? (
                <SpinningRing size={22} strokeWidth={3} />
              ) : (
                <img
                  src={ch.logo}
                  alt={ch.name}
                  referrerPolicy="no-referrer"
                  className={`${
                    ch.category === 'Kênh địa phương' || ch.category === 'Kênh phát thanh' || ch.category === 'Kênh HTV'
                      ? 'max-h-7 sm:max-h-8 md:max-h-9 max-w-[92%] scale-110'
                      : 'max-h-6 sm:max-h-7 md:max-h-7.5 max-w-[82%]'
                  } w-auto object-contain filter drop-shadow-sm transition-transform duration-300 group-hover:scale-105`}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              )}
            </div>
          </div>
          );
        })}
      </div>
    </section>
  );
};
