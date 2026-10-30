import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface AppScrollbarProps {
  currentRoute: string;
  isGalleryViewerOpen?: boolean;
  isTopBarVisible?: boolean;
}

export const AppScrollbar: React.FC<AppScrollbarProps> = ({
  currentRoute,
  isGalleryViewerOpen = false,
  isTopBarVisible = true,
}) => {
  const [scrollProgress, setScrollProgress] = useState(0); // 0 to 1
  const [isScrollable, setIsScrollable] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [thumbHeight, setThumbHeight] = useState(48);

  const trackRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dragStartYRef = useRef<number>(0);
  const dragStartScrollTopRef = useRef<number>(0);
  const activeContainerRef = useRef<HTMLElement | null>(null);

  // Determine active scroll target (internal scroll container on gallery or window)
  const getScrollContainer = useCallback((): HTMLElement | Window => {
    if (currentRoute === '/gallery') {
      const galleryScroll = document.querySelector<HTMLElement>('[data-gallery-scroll="true"]');
      if (galleryScroll && galleryScroll.scrollHeight > galleryScroll.clientHeight + 10) {
        activeContainerRef.current = galleryScroll;
        return galleryScroll;
      }
    }
    activeContainerRef.current = null;
    return window;
  }, [currentRoute]);

  // Read current scroll dimensions
  const getScrollInfo = useCallback(() => {
    const target = getScrollContainer();
    if (target instanceof Window || target === window) {
      const doc = document.documentElement;
      const scrollHeight = doc.scrollHeight;
      const clientHeight = window.innerHeight;
      const scrollTop = window.scrollY || doc.scrollTop;
      return { scrollHeight, clientHeight, scrollTop };
    } else {
      const el = target as HTMLElement;
      return {
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
        scrollTop: el.scrollTop,
      };
    }
  }, [getScrollContainer]);

  // Update scrollbar state based on scroll dimensions
  const updateScrollbarState = useCallback(() => {
    const { scrollHeight, clientHeight, scrollTop } = getScrollInfo();
    const maxScroll = scrollHeight - clientHeight;
    const canScroll = maxScroll > 12;
    setIsScrollable(canScroll);

    if (!canScroll) {
      setScrollProgress(0);
      return;
    }

    const progress = Math.min(1, Math.max(0, scrollTop / maxScroll));
    setScrollProgress(progress);

    // Calculate proportional thumb height
    if (trackRef.current) {
      const trackHeight = trackRef.current.clientHeight;
      const calculatedHeight = Math.max(
        36,
        Math.min(trackHeight - 24, (clientHeight / scrollHeight) * trackHeight)
      );
      setThumbHeight(calculatedHeight);
    }
  }, [getScrollInfo]);

  // Show scrollbar temporarily on scroll event
  const showTemporarily = useCallback(() => {
    setIsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (!isHovered && !isDragging) {
        setIsVisible(false);
      }
    }, 1800);
  }, [isHovered, isDragging]);

  // Setup scroll and resize listeners
  useEffect(() => {
    const target = getScrollContainer();
    const handleScroll = () => {
      updateScrollbarState();
      showTemporarily();
    };

    const handleResize = () => {
      updateScrollbarState();
    };

    if (target instanceof Window || target === window) {
      window.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('resize', handleResize, { passive: true });
    } else {
      (target as HTMLElement).addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('resize', handleResize, { passive: true });
    }

    // Initial calculation
    updateScrollbarState();

    // Check periodically for dynamic content changes
    const interval = setInterval(updateScrollbarState, 600);

    return () => {
      if (target instanceof Window || target === window) {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleResize);
      } else {
        (target as HTMLElement).removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleResize);
      }
      clearInterval(interval);
    };
  }, [getScrollContainer, updateScrollbarState, showTemporarily]);

  // Recalculate on route change
  useEffect(() => {
    const timer = setTimeout(() => {
      updateScrollbarState();
      showTemporarily();
    }, 120);
    return () => clearTimeout(timer);
  }, [currentRoute, updateScrollbarState, showTemporarily]);

  // Scroll to a specific target
  const scrollToPosition = useCallback((targetScrollTop: number, smooth: boolean = false) => {
    const target = activeContainerRef.current || window;
    const { scrollHeight, clientHeight } = getScrollInfo();
    const maxScroll = Math.max(0, scrollHeight - clientHeight);
    const clampedTop = Math.max(0, Math.min(maxScroll, targetScrollTop));

    if (target instanceof Window || target === window) {
      window.scrollTo({
        top: clampedTop,
        behavior: smooth ? 'smooth' : 'auto',
      });
    } else {
      (target as HTMLElement).scrollTo({
        top: clampedTop,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  }, [getScrollInfo]);

  // Scroll by delta
  const scrollByDelta = useCallback((deltaY: number) => {
    const { scrollTop } = getScrollInfo();
    scrollToPosition(scrollTop + deltaY, false);
  }, [getScrollInfo, scrollToPosition]);

  // Thumb Dragging Handler using Pointer Events
  const handleThumbPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    setIsDragging(true);
    setIsVisible(true);
    dragStartYRef.current = e.clientY;
    const { scrollTop } = getScrollInfo();
    dragStartScrollTopRef.current = scrollTop;
  };

  const handleThumbPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !trackRef.current) return;
    e.preventDefault();

    const trackHeight = trackRef.current.clientHeight;
    const deltaY = e.clientY - dragStartYRef.current;
    const usableTrackHeight = Math.max(1, trackHeight - thumbHeight);

    const { scrollHeight, clientHeight } = getScrollInfo();
    const maxScroll = Math.max(0, scrollHeight - clientHeight);

    const scrollDelta = (deltaY / usableTrackHeight) * maxScroll;
    scrollToPosition(dragStartScrollTopRef.current + scrollDelta, false);
  };

  const handleThumbPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      if (!isHovered) {
        showTemporarily();
      }
    }
  };

  // Clicking on Track to Jump
  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const trackHeight = rect.height;

    const usableTrackHeight = Math.max(1, trackHeight - thumbHeight);
    const targetProgress = Math.max(0, Math.min(1, (clickY - thumbHeight / 2) / usableTrackHeight));

    const { scrollHeight, clientHeight } = getScrollInfo();
    const maxScroll = Math.max(0, scrollHeight - clientHeight);
    scrollToPosition(targetProgress * maxScroll, false);
  };

  // Calculate thumb offset top
  const trackHeight = trackRef.current?.clientHeight || 200;
  const usableTrack = Math.max(0, trackHeight - thumbHeight);
  const thumbTop = scrollProgress * usableTrack;

  // If lightbox is open in Gallery or page has no scroll, don't show
  if (isGalleryViewerOpen || !isScrollable) {
    return null;
  }

  const topOffsetClass = isTopBarVisible ? 'top-[54px]' : 'top-2';

  return (
    <aside
      aria-label="App custom scroller"
      onMouseEnter={() => {
        setIsHovered(true);
        setIsVisible(true);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        showTemporarily();
      }}
      className={`fixed right-1 ${topOffsetClass} bottom-2 z-40 select-none flex flex-col items-center justify-between transition-all duration-200 pointer-events-auto cursor-default ${
        isHovered || isDragging ? 'w-3.5' : 'w-2'
      } ${
        isVisible || isHovered || isDragging
          ? 'opacity-100'
          : 'opacity-25 hover:opacity-100'
      }`}
      style={{ touchAction: 'none' }}
    >
      {/* Top Arrow Button (Fluent style) */}
      <button
        type="button"
        tabIndex={-1}
        onClick={(e) => {
          e.stopPropagation();
          scrollByDelta(-220);
        }}
        className={`w-3.5 h-3.5 rounded flex items-center justify-center transition-colors cursor-default ${
          isHovered
            ? 'opacity-80 hover:opacity-100 bg-black/10 dark:bg-white/10 text-neutral-600 dark:text-neutral-400'
            : 'opacity-0 pointer-events-none'
        }`}
        title="Scroll up"
      >
        <ChevronUp className="w-2.5 h-2.5 stroke-[2.5]" />
      </button>

      {/* Scroller Rail Track */}
      <div
        ref={trackRef}
        onClick={handleTrackClick}
        className={`relative flex-1 w-full my-0.5 rounded-full cursor-default transition-colors ${
          isHovered || isDragging
            ? 'bg-black/10 dark:bg-white/10 backdrop-blur-md border border-black/5 dark:border-white/10 shadow-xs'
            : 'bg-transparent'
        }`}
      >
        {/* Scroller Thumb */}
        <div
          role="scrollbar"
          aria-valuenow={Math.round(scrollProgress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-orientation="vertical"
          onPointerDown={handleThumbPointerDown}
          onPointerMove={handleThumbPointerMove}
          onPointerUp={handleThumbPointerUp}
          onPointerCancel={handleThumbPointerUp}
          style={{
            top: `${thumbTop}px`,
            height: `${thumbHeight}px`,
          }}
          className={`absolute left-1/2 -translate-x-1/2 rounded-full cursor-default ${
            isDragging ? 'transition-none' : 'transition-[width,background-color] duration-150'
          } ${
            isHovered || isDragging
              ? 'w-2.5 bg-neutral-500 dark:bg-neutral-400 hover:bg-neutral-600 dark:hover:bg-neutral-300 active:bg-neutral-700 dark:active:bg-neutral-200 shadow-sm'
              : 'w-1.5 bg-neutral-400/60 dark:bg-neutral-500/60'
          }`}
        />
      </div>

      {/* Bottom Arrow Button (Fluent style) */}
      <button
        type="button"
        tabIndex={-1}
        onClick={(e) => {
          e.stopPropagation();
          scrollByDelta(220);
        }}
        className={`w-3.5 h-3.5 rounded flex items-center justify-center transition-colors cursor-default ${
          isHovered
            ? 'opacity-80 hover:opacity-100 bg-black/10 dark:bg-white/10 text-neutral-600 dark:text-neutral-400'
            : 'opacity-0 pointer-events-none'
        }`}
        title="Scroll down"
      >
        <ChevronDown className="w-2.5 h-2.5 stroke-[2.5]" />
      </button>
    </aside>
  );
};
