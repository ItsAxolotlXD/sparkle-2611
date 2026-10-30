import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HERO_SLIDES, DEFAULT_BANNER_PLACEHOLDER } from '../data/heroSlides';
import { Channel } from '../types';
import { useSettings } from '../hooks/useSettings';
import { SpinningRing } from './SpinningRing';

interface HeroCarouselProps {
  navigate?: (route: string) => void;
  onSelectChannel?: (channel: Channel) => void;
  channels?: Channel[];
  flipActiveSlide?: boolean;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ flipActiveSlide = false }) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { settings, draftSettings } = useSettings();
  const isLightMode = (draftSettings?.theme ?? settings.theme) === 'light';

  // 3-second loading state on tab load before displaying banner images
  const [isLoadingBanner, setIsLoadingBanner] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoadingBanner(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Danh sách slide gồm các banner chất lượng cao
  const allSlides = HERO_SLIDES;
  const totalSlides = allSlides.length;

  // Mặc định hiển thị THỜI SỰ 19H ở trung tâm (index 3), bên trái là CHÀO BUỔI SÁNG, bên phải là WAVES
  const initialIndex = allSlides.findIndex((s) => s.id === 'thoi-su-19h-vtv');
  const defaultIndex = initialIndex >= 0 ? initialIndex : 0;

  const [slideState, setSlideState] = useState({ current: defaultIndex, prev: defaultIndex });
  const { current: currentIndex, prev: prevIndex } = slideState;

  // Preload banner images to avoid layout reflow or frame drop
  useEffect(() => {
    allSlides.forEach((s) => {
      const src = s.backgroundImage;
      if (src) {
        const img = new Image();
        img.src = src;
      }
    });
  }, [allSlides]);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSlideState((s) => ({
        current: (s.current + 1) % totalSlides,
        prev: s.current,
      }));
    }, 5000);
  };

  const nextSlide = (isManual = false) => {
    if (totalSlides > 1) {
      setSlideState((s) => ({
        current: (s.current + 1) % totalSlides,
        prev: s.current,
      }));
      if (isManual) {
        resetTimer();
      }
    }
  };

  const prevSlide = (isManual = false) => {
    if (totalSlides > 1) {
      setSlideState((s) => ({
        current: (s.current - 1 + totalSlides) % totalSlides,
        prev: s.current,
      }));
      if (isManual) {
        resetTimer();
      }
    }
  };

  const goToSlide = (idx: number) => {
    if (idx !== currentIndex) {
      setSlideState({
        current: idx,
        prev: currentIndex,
      });
      resetTimer();
    }
  };

  // Cứ mỗi 5 giây banner tự động chuyển slide mượt mà
  useEffect(() => {
    if (totalSlides > 1) {
      resetTimer();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [totalSlides]);

  // Tính khoảng cách vòng tròn (circular diff) giữa index i và vị trí slide hiện tại
  const getSlidePosition = (i: number, current: number) => {
    let diff = (i - current) % totalSlides;
    if (diff < -Math.floor(totalSlides / 2)) {
      diff += totalSlides;
    } else if (diff > Math.floor(totalSlides / 2)) {
      diff -= totalSlides;
    }
    return diff;
  };

  // Touch swipe handling for mobile / tablets
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const isSwipingRef = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
      isSwipingRef.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwipingRef.current || touchStartXRef.current === null || touchStartYRef.current === null) return;
    const deltaX = e.touches[0].clientX - touchStartXRef.current;
    const deltaY = e.touches[0].clientY - touchStartYRef.current;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isSwipingRef.current || touchStartXRef.current === null || touchStartYRef.current === null) {
      isSwipingRef.current = false;
      return;
    }

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartXRef.current;
    const deltaY = touchEndY - touchStartYRef.current;

    if (Math.abs(deltaX) > 35 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        nextSlide(true);
      } else {
        prevSlide(true);
      }
    } else {
      resetTimer();
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;
    isSwipingRef.current = false;
  };

  const currentSlide = allSlides[currentIndex];
  const currentBannerBg = currentSlide ? (currentSlide.backgroundImage || DEFAULT_BANNER_PLACEHOLDER) : '';

  return (
    <div
      id="hero-3d-coverflow-carousel"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'pan-y' }}
      className="relative w-full overflow-hidden select-none pt-1 sm:pt-2 pb-1"
    >
      {/* 3D Stage Container */}
      <div
        className="relative w-full flex items-center justify-center"
        style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
      >
        {/* Aspect ratio spacer so stage height strictly matches banner height */}
        <div
          className="w-[88%] sm:w-[76%] md:w-[66%] lg:w-[62%] max-w-[860px] aspect-[16/9] pointer-events-none invisible"
          aria-hidden="true"
        />

        {allSlides.map((slide, i) => {
          const diff = getSlidePosition(i, currentIndex);
          const prevDiff = getSlidePosition(i, prevIndex);
          const diffDelta = Math.abs(diff - prevDiff);
          const isWrapJump = diffDelta > 1;

          const isCenter = diff === 0;
          const isLeft = diff === -1;
          const isRight = diff === 1;
          const isFarLeft = diff === -2;
          const isFarRight = diff === 2;
          const isNear = Math.abs(diff) <= 2;

          // Xây dựng style 3D Coverflow mượt mà
          let transformStyle: React.CSSProperties = {
            transition: !isWrapJump && isNear
              ? 'transform 0.95s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.95s cubic-bezier(0.22, 1, 0.36, 1)'
              : 'none',
            willChange: isNear ? 'transform, opacity' : 'auto',
            WebkitBackfaceVisibility: 'hidden',
            backfaceVisibility: 'hidden',
          };

          if (isCenter) {
            transformStyle = {
              ...transformStyle,
              transform: `translate3d(0%, 0, ${flipActiveSlide ? 72 : 0}px) rotateY(0deg) scale(1)`,
              zIndex: flipActiveSlide ? 100 : 30,
              opacity: 1,
              visibility: 'visible',
            };
          } else if (isLeft) {
            transformStyle = {
              ...transformStyle,
              transform: 'translate3d(-52%, 0, -100px) rotateY(38deg) scale(0.80)',
              zIndex: 20,
              opacity: 0.85,
              visibility: 'visible',
            };
          } else if (isRight) {
            transformStyle = {
              ...transformStyle,
              transform: 'translate3d(52%, 0, -100px) rotateY(-38deg) scale(0.80)',
              zIndex: 20,
              opacity: 0.85,
              visibility: 'visible',
            };
          } else if (isFarLeft) {
            transformStyle = {
              ...transformStyle,
              transform: 'translate3d(-85%, 0, -220px) rotateY(48deg) scale(0.65)',
              zIndex: 10,
              opacity: 0,
              visibility: 'visible',
            };
          } else if (isFarRight) {
            transformStyle = {
              ...transformStyle,
              transform: 'translate3d(85%, 0, -220px) rotateY(-48deg) scale(0.65)',
              zIndex: 10,
              opacity: 0,
              visibility: 'visible',
            };
          } else {
            transformStyle = {
              ...transformStyle,
              transform: 'translate3d(0%, 0, -260px) scale(0.55)',
              zIndex: 0,
              opacity: 0,
              visibility: 'hidden',
              transition: 'none',
            };
          }

          const slideContent = isLoadingBanner ? (
            <div key="banner-loading" className={`w-full h-full flex items-center justify-center ${isLightMode ? 'bg-white' : 'bg-[#18181b]'}`}>
              <SpinningRing size={42} strokeWidth={4.5} />
            </div>
          ) : (
            <div key="banner-loaded" className="slide-up-refresh w-full h-full relative">
              <img
                src={slide.backgroundImage || DEFAULT_BANNER_PLACEHOLDER}
                alt={slide.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center pointer-events-none select-none"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src !== DEFAULT_BANNER_PLACEHOLDER) {
                    target.src = DEFAULT_BANNER_PLACEHOLDER;
                  }
                }}
              />
            </div>
          );

          return (
            <div
              key={slide.id}
              id={`hero-carousel-slide-${slide.id}`}
              style={transformStyle}
              className={`hero-carousel-slide fluent-reveal-item banner-card absolute inset-0 m-auto w-[88%] sm:w-[76%] md:w-[66%] lg:w-[62%] max-w-[860px] aspect-[16/9] rounded-lg sm:rounded-xl overflow-hidden cursor-default select-none transition-shadow duration-500 ${
                isCenter
                  ? 'is-center shadow-2xl pointer-events-auto'
                  : 'shadow-lg pointer-events-none'
              }`}
            >
              {/* Ảnh banner lật vào tâm trên trang Home preview. */}
              {flipActiveSlide && isCenter ? (
                <motion.div
                  key={`flip-${currentIndex}`}
                  initial={{ rotateY: 0, scale: 0.96 }}
                  animate={{ rotateY: 360, scale: 1 }}
                  transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                  style={{ transformOrigin: 'center center', transformStyle: 'preserve-3d', backfaceVisibility: 'hidden', position: 'relative', zIndex: 101 }}
                  className="h-full w-full"
                >
                  {slideContent}
                </motion.div>
              ) : (
                slideContent
              )}

              {/* Lớp phủ tinh tế khi slide ở 2 bên */}
              {!isCenter && (
                <div className="absolute inset-0 bg-black/40 z-10 pointer-events-none" />
              )}
            </div>
          );
        })}

        {/* Nút mũi tên Chevron trái (<) - Bỏ nền nút, căn vị trí chuẩn 2 bên banner */}
        {totalSlides > 1 && (
          <button
            id="btn-coverflow-prev"
            onClick={() => prevSlide(true)}
            aria-label="Slide trước"
            className="absolute left-2 sm:left-4 md:left-6 top-1/2 -translate-y-1/2 z-40 p-1.5 sm:p-2 text-black/80 hover:text-black dark:text-white/75 dark:hover:text-white transition-all transform active:scale-95 cursor-default select-none outline-none filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.2)] dark:drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] bg-transparent border-0"
          >
            <ChevronLeft className="w-8 h-8 sm:w-9 sm:h-9 stroke-[2.25]" />
          </button>
        )}

        {/* Nút mũi tên Chevron phải (>) - Bỏ nền nút, căn vị trí chuẩn 2 bên banner */}
        {totalSlides > 1 && (
          <button
            id="btn-coverflow-next"
            onClick={() => nextSlide(true)}
            aria-label="Slide tiếp theo"
            className="absolute right-2 sm:right-4 md:right-6 top-1/2 -translate-y-1/2 z-40 p-1.5 sm:p-2 text-black/80 hover:text-black dark:text-white/75 dark:hover:text-white transition-all transform active:scale-95 cursor-default select-none outline-none filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.2)] dark:drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] bg-transparent border-0"
          >
            <ChevronRight className="w-8 h-8 sm:w-9 sm:h-9 stroke-[2.25]" />
          </button>
        )}
      </div>

      {/* Pagination Indicators chuẩn thiết kế: Các chấm tròn và thanh dài ở trung tâm */}
      {totalSlides > 1 && (
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-3 sm:mt-3.5">
          {allSlides.map((_, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={idx}
                onClick={() => goToSlide(idx)}
                className="relative py-1.5 px-0.5 flex items-center justify-center cursor-default group focus:outline-none"
                aria-label={`Đi tới slide ${idx + 1}`}
              >
                {isActive ? (
                  <motion.span
                    layoutId="hero-active-pill"
                    className="w-7 sm:w-8 h-1.5 rounded-full bg-black shadow-[0_0_12px_rgba(0,0,0,0.35)] dark:bg-white dark:shadow-[0_0_12px_rgba(255,255,255,0.95)]"
                    transition={{
                      type: 'spring',
                      stiffness: 380,
                      damping: 30,
                    }}
                  />
                ) : (
                  <motion.span
                    className="w-1.5 h-1.5 rounded-full bg-black/30 group-hover:bg-black/60 dark:bg-white/30 dark:group-hover:bg-white/60 transition-colors"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
