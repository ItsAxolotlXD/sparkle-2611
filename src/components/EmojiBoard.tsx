import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Delete } from 'lucide-react';
import { motion } from 'motion/react';
import { EMOJI_CATEGORIES } from '../data/emojiCategories';
import { FluentEmoji } from './FluentEmoji';
import { SpinningRing } from './SpinningRing';
import { keyboardSound } from '../utils/keyboardSound';

interface EmojiBoardProps {
  searchQuery?: string;
  onInsertEmoji: (emoji: string) => void;
  onDeleteChar: () => void;
  onCloseKeyboard: () => void;
  onSwitchToABC: () => void;
}

export const EmojiBoard: React.FC<EmojiBoardProps> = ({
  searchQuery = '',
  onInsertEmoji,
  onDeleteChar,
  onCloseKeyboard,
  onSwitchToABC,
}) => {
  const [activeCategoryId, setActiveCategoryId] = useState<string>(EMOJI_CATEGORIES[0]?.id || 'faces');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingCategoryRef = useRef<string | null>(EMOJI_CATEGORIES[0]?.id || 'faces');
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const categorySectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const isProgrammaticScrollRef = useRef<boolean>(false);
  const backspaceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const backspaceIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // In-app custom Fluent horizontal scroller state
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrollable, setIsScrollable] = useState(false);
  const [thumbWidth, setThumbWidth] = useState(60);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const dragStartXRef = useRef(0);
  const dragStartScrollLeftRef = useRef(0);

  // Play click sound with throttling
  const playSound = useCallback((type: 'char' | 'space' | 'delete' | 'action' | 'modifier' = 'char') => {
    keyboardSound.playKeyClick(type);
  }, []);

  // Backspace press handlers
  const clearBackspaceTimers = useCallback(() => {
    if (backspaceTimerRef.current) {
      clearTimeout(backspaceTimerRef.current);
      backspaceTimerRef.current = null;
    }
    if (backspaceIntervalRef.current) {
      clearInterval(backspaceIntervalRef.current);
      backspaceIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearBackspaceTimers();
  }, [clearBackspaceTimers]);

  const handleDeleteDown = (e: React.PointerEvent | React.MouseEvent) => {
    e.preventDefault();
    playSound('delete');
    onDeleteChar();
    if (navigator.vibrate) {
      try { navigator.vibrate(12); } catch {}
    }

    clearBackspaceTimers();
    backspaceTimerRef.current = setTimeout(() => {
      backspaceIntervalRef.current = setInterval(() => {
        playSound('delete');
        onDeleteChar();
      }, 75);
    }, 350);
  };

  const handleDeleteUp = () => {
    clearBackspaceTimers();
  };

  // Custom scroller drag and track handlers
  const handleThumbPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDragging(true);
    dragStartXRef.current = e.clientX;
    dragStartScrollLeftRef.current = scrollContainerRef.current?.scrollLeft || 0;
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const handleThumbPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollContainerRef.current || !trackRef.current) return;
    const deltaX = e.clientX - dragStartXRef.current;
    const trackW = trackRef.current.clientWidth;
    const usable = Math.max(1, trackW - thumbWidth);
    const container = scrollContainerRef.current;
    const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth);
    const scrollDelta = (deltaX / usable) * maxScroll;
    container.scrollLeft = Math.max(0, Math.min(maxScroll, dragStartScrollLeftRef.current + scrollDelta));
  };

  const handleThumbPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current || !scrollContainerRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const trackW = rect.width;
    const usable = Math.max(1, trackW - thumbWidth);
    const targetProgress = Math.max(0, Math.min(1, (clickX - thumbWidth / 2) / usable));
    const container = scrollContainerRef.current;
    const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth);
    container.scrollTo({ left: targetProgress * maxScroll, behavior: 'smooth' });
  };

  // Initial 3-second loading circle throbber on mount when switching to emoji page
  useEffect(() => {
    setIsLoading(true);
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
    }
    loadingTimerRef.current = setTimeout(() => {
      setIsLoading(false);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft = 0;
      }
    }, 3000);

    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
    };
  }, []);

  // Switch to selected category with 3-second loading circle throbber
  // ONLY the active category will be loaded into DOM to prevent lag!
  const handleSelectCategory = (catId: string) => {
    if (catId === activeCategoryId && !searchQuery.trim() && !isLoading) return;
    setActiveCategoryId(catId);
    pendingCategoryRef.current = catId;
    setIsLoading(true);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
    }
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
    }
    loadingTimerRef.current = setTimeout(() => {
      setIsLoading(false);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft = 0;
      }
    }, 3000);
  };

  // Detect active category while scrolling horizontally and update scroller
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollLeft = container.scrollLeft;

    // Update in-app horizontal scroller progress
    const maxScroll = container.scrollWidth - container.clientWidth;
    const canScroll = maxScroll > 8;
    setIsScrollable(canScroll);
    if (canScroll) {
      setScrollProgress(Math.min(1, Math.max(0, scrollLeft / maxScroll)));
      if (trackRef.current) {
        const trackW = trackRef.current.clientWidth;
        const calcW = Math.max(48, Math.min(trackW - 24, (container.clientWidth / container.scrollWidth) * trackW));
        setThumbWidth(calcW);
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (scrollContainerRef.current) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        scrollContainerRef.current.scrollLeft += e.deltaY;
      }
    }
  };

  const handleEmojiClick = (emoji: string) => {
    playSound('char');
    if (navigator.vibrate) {
      try { navigator.vibrate(8); } catch {}
    }
    onInsertEmoji(emoji);
  };

  // CRITICAL OPTIMIZATION: To prevent lag, ONLY load the current active category!
  // Absolutely never load all emoji categories at once into DOM.
  const currentCategory = EMOJI_CATEGORIES.find((c) => c.id === activeCategoryId) || EMOJI_CATEGORIES[0];
  const displayedCategories = searchQuery.trim()
    ? [
        {
          id: 'search_results',
          name: `Kết quả tìm kiếm ("${searchQuery.trim()}")`,
          icon: '🔍',
          emojis: Array.from(
            new Set(
              EMOJI_CATEGORIES.flatMap((c) => c.emojis).filter((emoji) =>
                emoji.includes(searchQuery.trim())
              )
            )
          ),
        },
      ]
    : [currentCategory];

  // Measure initial scrollable metrics
  useEffect(() => {
    const update = () => {
      if (!scrollContainerRef.current) return;
      const container = scrollContainerRef.current;
      const maxScroll = container.scrollWidth - container.clientWidth;
      setIsScrollable(maxScroll > 8);
      if (trackRef.current && container.scrollWidth > 0) {
        const trackW = trackRef.current.clientWidth;
        const calcW = Math.max(48, Math.min(trackW - 24, (container.clientWidth / container.scrollWidth) * trackW));
        setThumbWidth(calcW);
      }
    };
    const t = setTimeout(update, 60);
    return () => clearTimeout(t);
  }, [displayedCategories, isLoading]);

  const trackWidth = trackRef.current?.clientWidth || 300;
  const usableTrack = Math.max(0, trackWidth - thumbWidth);
  const thumbLeft = scrollProgress * usableTrack;

  return (
    <div className="flex-1 flex flex-col justify-between h-full min-h-0 select-none overflow-hidden pb-0.5">
      {/* Main Emoji Board or 3-Second Loading Circle Throbber */}
      {isLoading ? (
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center h-full w-full py-4 gap-3 select-none">
          <div className="flex items-center justify-center w-11 h-11">
            <SpinningRing size={44} strokeWidth={4} />
          </div>
          <span className="text-xs font-semibold text-[#111827] dark:text-white tracking-tight">
            Đang tải biểu tượng cảm xúc...
          </span>
        </div>
      ) : (
        <>
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            onWheel={handleWheel}
            className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden scroll-smooth flex flex-row gap-6 py-1.5 px-3 select-none no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden cursor-grab active:cursor-grabbing"
          >
            {displayedCategories.map((category) => (
              <div
                key={category.id}
                ref={(el) => {
                  categorySectionRefs.current[category.id] = el;
                }}
                className="flex flex-col shrink-0 h-full justify-between"
              >
                {/* Category header - Title is displayed in FULL without any truncation or ellipsis */}
                <div className="flex items-center gap-1.5 px-1 py-0.5 select-none shrink-0 whitespace-nowrap">
                  <FluentEmoji emoji={category.icon} isDecorative className="w-4 h-4 text-sm" />
                  <span className="text-xs sm:text-[13px] font-bold text-[#111827] dark:text-white tracking-tight whitespace-nowrap">
                    {category.name}
                  </span>
                  <span className="text-[11px] font-mono text-[#6b7280] dark:text-[#9ca3af]">
                    ({category.emojis.length})
                  </span>
                </div>

                {/* 3-Row horizontal grid for ONLY this active category - lightweight & zero lag */}
                <div className="grid grid-rows-3 grid-flow-col auto-cols-[46px] sm:auto-cols-[54px] gap-1.5 sm:gap-2 flex-1 items-center content-center py-1">
                  {category.emojis.map((emoji, idx) => (
                    <button
                      key={`${category.id}-${idx}-${emoji}`}
                      type="button"
                      aria-label={`Insert ${emoji} emoji`}
                      onMouseDown={(e) => e.preventDefault()}
                      onPointerDown={(e) => {
                        e.preventDefault();
                        handleEmojiClick(emoji);
                      }}
                      className="w-[46px] h-[40px] sm:w-[54px] sm:h-[46px] flex items-center justify-center text-[28px] sm:text-[32px] leading-none transition-opacity active:opacity-75 cursor-default select-none bg-transparent border-0 shadow-none p-0 outline-none"
                    >
                      <FluentEmoji emoji={emoji} isDecorative className="w-8 h-8 text-[28px] sm:text-[32px]" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* In-App Custom Horizontal Scroller (matching AppScrollbar design) */}
          {isScrollable && (
            <div
              ref={trackRef}
              onClick={handleTrackClick}
              className="relative w-[85%] max-w-[420px] mx-auto h-1.5 hover:h-2.5 my-0.5 rounded-full cursor-pointer bg-black/10 dark:bg-white/10 transition-all select-none"
            >
              <div
                role="scrollbar"
                aria-orientation="horizontal"
                aria-valuenow={Math.round(scrollProgress * 100)}
                onPointerDown={handleThumbPointerDown}
                onPointerMove={handleThumbPointerMove}
                onPointerUp={handleThumbPointerUp}
                onPointerCancel={handleThumbPointerUp}
                style={{
                  left: `${thumbLeft}px`,
                  width: `${thumbWidth}px`,
                }}
                className={`absolute top-0 bottom-0 rounded-full cursor-grab active:cursor-grabbing transition-colors shadow-xs ${
                  isDragging
                    ? 'bg-[#ff01ff]'
                    : 'bg-neutral-600/70 hover:bg-neutral-800'
                }`}
              />
            </div>
          )}
        </>
      )}

      {/* BOTTOM: Category Emoji Tabs (Bên dưới) & Action Controls */}
      <div className="flex flex-col gap-1 pt-1 px-1 border-t border-black/10 dark:border-white/10 shrink-0">
        {/* Category Emoji Bar placed below the emoji grid with Underline style matching Watch tab */}
        <div className="relative flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth py-0.5 w-full border-0">
          {EMOJI_CATEGORIES.map((cat) => {
            const isActive = activeCategoryId === cat.id && !searchQuery.trim();
            return (
              <button
                key={cat.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onPointerDown={() => playSound('modifier')}
                onClick={() => handleSelectCategory(cat.id)}
                className={`relative px-3 py-1.5 flex items-center gap-1.5 transition-colors shrink-0 cursor-default !bg-transparent !border-0 !shadow-none hover:!bg-transparent ${
                  isActive
                    ? 'text-[#111827] dark:text-white font-bold'
                    : 'text-[#6b7280] dark:text-[#9ca3af] hover:text-[#111827] dark:hover:text-white font-medium'
                }`}
                title={cat.name}
              >
                <FluentEmoji emoji={cat.icon} isDecorative className="w-5 h-5 text-base select-none" />
                {isActive && (
                  <span className="text-[11px] font-bold text-[#111827] dark:text-white whitespace-nowrap">
                    {cat.name}
                  </span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="emoji-category-active-underline"
                    className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-full bg-[#ff01ff]"
                    initial={false}
                    animate={{
                      scaleX: [1, 1.38, 0.94, 1],
                    }}
                    transition={{
                      layout: {
                        type: 'spring',
                        stiffness: 350,
                        damping: 26,
                        mass: 0.65,
                      },
                      scaleX: {
                        duration: 0.36,
                        times: [0, 0.45, 0.8, 1],
                        ease: [0.25, 1, 0.5, 1],
                      },
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Action buttons: ABC, Space, Backspace, Xong - WinUI 3 Button Styles adapting to Light & Dark */}
        <div className="flex items-center justify-between pt-0.5 px-0.5">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onPointerDown={() => playSound('modifier')}
              onClick={onSwitchToABC}
              className="h-8 px-4 rounded-[6px] bg-white/70 dark:bg-white/10 hover:bg-black/5 dark:hover:bg-white/15 active:bg-black/10 dark:active:bg-white/20 text-xs font-semibold text-[#111827] dark:text-white border-0 border-none outline-none focus:outline-none focus:ring-0 transition-colors cursor-default"
            >
              ABC
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onPointerDown={() => {
                playSound('space');
                onInsertEmoji(' ');
              }}
              className="h-8 px-5 sm:px-7 rounded-[6px] bg-white/70 dark:bg-white/10 hover:bg-black/5 dark:hover:bg-white/15 active:bg-black/10 dark:active:bg-white/20 text-xs font-medium text-[#111827] dark:text-white border-0 border-none outline-none focus:outline-none focus:ring-0 transition-colors cursor-default"
            >
              dấu cách
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              id="btn-emoji-backspace"
              onMouseDown={handleDeleteDown}
              onMouseUp={handleDeleteUp}
              onMouseLeave={handleDeleteUp}
              onPointerDown={handleDeleteDown}
              onPointerUp={handleDeleteUp}
              onPointerLeave={handleDeleteUp}
              onPointerCancel={handleDeleteUp}
              className="h-8 w-11 rounded-[6px] bg-white/70 dark:bg-white/10 hover:bg-black/5 dark:hover:bg-white/15 active:bg-black/10 dark:active:bg-white/20 flex items-center justify-center text-[#111827] dark:text-white border-0 border-none outline-none focus:outline-none focus:ring-0 transition-colors cursor-default"
              title="Xóa ký tự"
              aria-label="Xóa ký tự"
            >
              <Delete className="w-4 h-4 text-current stroke-[2.2]" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onPointerDown={() => playSound('action')}
              onClick={onCloseKeyboard}
              className="h-8 px-4 rounded-[6px] bg-[#005fb8] dark:bg-[#4cc2ff] hover:bg-[#106ebe] dark:hover:bg-[#6bd0ff] active:bg-[#005a9e] dark:active:bg-[#3bb2ef] text-xs font-semibold text-white dark:text-black transition-colors cursor-default border-0 border-none outline-none focus:outline-none focus:ring-0"
            >
              Xong
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
