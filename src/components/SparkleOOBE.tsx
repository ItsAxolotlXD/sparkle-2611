import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Check, 
  Volume2, 
  VolumeX, 
  Search, 
  Tv, 
  Layers, 
  MessageSquare, 
  Sun, 
  Moon,
  ChevronUp,
  ChevronDown,
  Bug,
  ArrowLeft,
  Accessibility,
  Heart,
  X
} from 'lucide-react';
import { SPINNING_RING_GIF_URL } from './SpinningRing';
import { SparkleRecoveryModal } from './SparkleRecoveryModal';
import { SparkleOOBEDebug } from './SparkleOOBEDebug';
import { FluentSearchIcon } from './FluentIcons';

interface SparkleOOBEProps {
  isOpen: boolean;
  onComplete: () => void;
  navigate?: (route: string) => void;
}

// Custom Native WinUI Scroll Area (replicates the app's native AppScrollbar: ChevronUp, Rail Track, Draggable Thumb, ChevronDown)
interface NativeWinUIScrollAreaProps {
  children: React.ReactNode;
  height?: number | string;
  maxHeight?: number | string;
  className?: string;
  contentClassName?: string;
}

const NativeWinUIScrollArea: React.FC<NativeWinUIScrollAreaProps> = ({
  children,
  height = 230,
  maxHeight,
  className = '',
  contentClassName = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [thumbHeight, setThumbHeight] = useState(36);
  const [isScrollable, setIsScrollable] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartScrollTop = useRef(0);

  const updateScrollState = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const scrollHeight = el.scrollHeight;
    const clientHeight = el.clientHeight;
    const maxScroll = Math.max(0, scrollHeight - clientHeight);
    const canScroll = maxScroll > 4;
    setIsScrollable(canScroll);

    if (canScroll) {
      const progress = Math.min(1, Math.max(0, el.scrollTop / maxScroll));
      setScrollProgress(progress);
      const trackH = trackRef.current ? trackRef.current.clientHeight : 160;
      const calculatedThumb = Math.max(
        24,
        Math.min(trackH - 8, (clientHeight / scrollHeight) * trackH)
      );
      setThumbHeight(calculatedThumb);
    } else {
      setScrollProgress(0);
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    updateScrollState();

    const handleScroll = () => {
      updateScrollState();
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateScrollState);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => updateScrollState());
      ro.observe(el);
      if (trackRef.current) {
        ro.observe(trackRef.current);
      }
    }

    const interval = setInterval(updateScrollState, 400);

    return () => {
      el.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateScrollState);
      if (ro) ro.disconnect();
      clearInterval(interval);
    };
  }, [updateScrollState]);

  const scrollByDelta = (delta: number) => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollBy({ top: delta, behavior: 'smooth' });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const el = containerRef.current;
    if (!el || !trackRef.current) return;
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartScrollTop.current = el.scrollTop;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current || !trackRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const el = containerRef.current;
    const trackH = trackRef.current.clientHeight;
    const deltaY = e.clientY - dragStartY.current;
    const usableTrackH = Math.max(1, trackH - thumbHeight);
    const maxScroll = Math.max(1, el.scrollHeight - el.clientHeight);
    el.scrollTop = dragStartScrollTop.current + (deltaY / usableTrackH) * maxScroll;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !trackRef.current) return;
    if (e.target !== trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const trackH = rect.height;
    const usableTrackH = Math.max(1, trackH - thumbHeight);
    const targetProgress = Math.max(0, Math.min(1, (clickY - thumbHeight / 2) / usableTrackH));
    const maxScroll = Math.max(0, containerRef.current.scrollHeight - containerRef.current.clientHeight);
    containerRef.current.scrollTo({ top: targetProgress * maxScroll, behavior: 'smooth' });
  };

  const trackH = trackRef.current?.clientHeight || 160;
  const usableTrack = Math.max(0, trackH - thumbHeight);
  const thumbTop = scrollProgress * usableTrack;

  return (
    <div
      className={`relative flex items-stretch border border-neutral-200 rounded-[15px] bg-white overflow-hidden ${className}`}
      style={{ height, maxHeight }}
    >
      {/* Scrollable Content Container (hidden browser scrollbar, smooth native compositor wheel/touch scroll) */}
      <div
        ref={containerRef}
        data-winui-scroll="true"
        tabIndex={0}
        className={`flex-1 overflow-y-auto overflow-x-hidden p-1.5 focus:outline-none overscroll-contain ${contentClassName}`}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {children}
      </div>

      {/* App Native Custom Scrollbar (Top ChevronUp, Track with Draggable Thumb, Bottom ChevronDown) */}
      <div
        onWheel={(e) => {
          containerRef.current?.scrollBy({ top: e.deltaY });
        }}
        className={`w-4 my-1 mr-1 shrink-0 flex flex-col items-center justify-between select-none transition-opacity duration-200 ${
          isScrollable ? 'opacity-100 pointer-events-auto' : 'opacity-40 pointer-events-none'
        }`}
      >
        {/* Top Chevron Button */}
        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            scrollByDelta(-90);
          }}
          className="w-4 h-4 rounded flex items-center justify-center transition-colors cursor-default bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 text-neutral-600 hover:text-neutral-900 shrink-0 border-none"
          title="Scroll up"
        >
          <ChevronUp className="w-2.5 h-2.5 stroke-[2.5]" />
        </button>

        {/* Scroller Rail Track */}
        <div
          ref={trackRef}
          onClick={handleTrackClick}
          className="relative flex-1 w-full my-1 rounded-full cursor-default bg-neutral-100 hover:bg-neutral-200 transition-colors"
        >
          {/* Scroller Thumb */}
          <div
            role="scrollbar"
            aria-valuenow={Math.round(scrollProgress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-orientation="vertical"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{
              top: `${thumbTop}px`,
              height: `${thumbHeight}px`,
            }}
            className={`absolute left-1/2 -translate-x-1/2 rounded-full cursor-default ${
              isDragging
                ? 'w-2.5 bg-neutral-600 shadow-xs'
                : 'w-2 hover:w-2.5 bg-neutral-400 hover:bg-neutral-500 active:bg-neutral-600 transition-all duration-150'
            }`}
          />
        </div>

        {/* Bottom Chevron Button */}
        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            scrollByDelta(90);
          }}
          className="w-4 h-4 rounded flex items-center justify-center transition-colors cursor-default bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 text-neutral-600 hover:text-neutral-900 shrink-0 border-none"
          title="Scroll down"
        >
          <ChevronDown className="w-2.5 h-2.5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};

// Steps:
// 1: Choose app theme preferences (Light / Dark)
// 2: Choose what you want to do (Install / Recover)
// 3: Who is going to use Sparkle (Enter username)
// 4: Applicable notices and license terms (Accept / Decline)
// 5: Thank you for choosing Sparkle!
export type OOBEStep = 1 | 2 | 3 | 4 | 5;

// Fluent 3D Hourglass Artwork for the 2-part "Just a moment" screen
export const FluentHourglassArtwork: React.FC<{ className?: string }> = ({ className = 'w-[155px] h-[155px]' }) => {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {!imgFailed ? (
        <img
          src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Hourglass%20not%20done/3D/hourglass_not_done_3d.png"
          alt="Hourglass"
          draggable={false}
          className="w-full h-full object-contain drop-shadow-md"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <svg viewBox="0 0 240 240" fill="none" className="w-full h-full drop-shadow-md">
          <defs>
            <linearGradient id="hg_stand_grad" x1="40" y1="20" x2="200" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
            <linearGradient id="hg_glass_grad" x1="70" y1="40" x2="170" y2="200" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="30%" stopColor="#e0f2fe" stopOpacity="0.4" />
              <stop offset="70%" stopColor="#bae6fd" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id="hg_sand_top" x1="80" y1="50" x2="160" y2="110" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <linearGradient id="hg_sand_bot" x1="80" y1="130" x2="160" y2="190" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="60%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>

          {/* Top Cap */}
          <rect x="52" y="24" width="136" height="16" rx="8" fill="url(#hg_stand_grad)" />
          <rect x="68" y="38" width="104" height="6" rx="3" fill="#0369a1" />

          {/* Bottom Cap */}
          <rect x="52" y="200" width="136" height="16" rx="8" fill="url(#hg_stand_grad)" />
          <rect x="68" y="196" width="104" height="6" rx="3" fill="#0369a1" />

          {/* Glass Outer Body */}
          <path
            d="M74 44 C74 90, 110 110, 116 120 C110 130, 74 150, 74 196 H166 C166 150, 130 130, 124 120 C130 110, 166 90, 166 44 Z"
            fill="url(#hg_glass_grad)"
            stroke="#bae6fd"
            strokeWidth="2.5"
          />

          {/* Top Sand Bulb */}
          <path
            d="M84 76 C84 96, 112 112, 120 118 C128 112, 156 96, 156 76 C144 80, 96 80, 84 76 Z"
            fill="url(#hg_sand_top)"
          />

          {/* Sand Falling Stream */}
          <line x1="120" y1="118" x2="120" y2="182" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="4 2" />

          {/* Bottom Sand Mound */}
          <path
            d="M80 196 C84 176, 108 168, 120 166 C132 168, 156 176, 160 196 Z"
            fill="url(#hg_sand_bot)"
          />

          {/* Glass Specular Highlights */}
          <path
            d="M82 52 C80 75, 96 95, 108 106"
            stroke="#ffffff"
            strokeWidth="3.5"
            strokeLinecap="round"
            opacity="0.75"
          />
          <path
            d="M82 188 C80 165, 96 145, 108 134"
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.6"
          />

          {/* Sparkles */}
          <circle cx="178" cy="68" r="3" fill="#fde047" />
          <circle cx="62" cy="145" r="2.5" fill="#38bdf8" />
        </svg>
      )}
    </div>
  );
};

// Fluent 3D Revolving Hearts (2 trái tim uốn quanh nhau) Artwork for "Thank you for choosing Sparkle!" screen
export const FluentThreeHeartsArtwork: React.FC<{ className?: string }> = ({ className = 'w-[165px] h-[165px]' }) => {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {!imgFailed ? (
        <img
          src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Revolving%20hearts/3D/revolving_hearts_3d.png"
          alt="Fluent Revolving Hearts 💞"
          draggable={false}
          className="w-full h-full object-contain drop-shadow-md"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <svg viewBox="0 0 240 240" fill="none" className="w-full h-full drop-shadow-md">
          <defs>
            <radialGradient id="rh_glow" cx="120" cy="120" r="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="rh_heart1" x1="20" y1="20" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ff4d8d" />
              <stop offset="40%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#be123c" />
            </linearGradient>
            <linearGradient id="rh_heart2" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="50%" stopColor="#e11d48" />
              <stop offset="100%" stopColor="#9f1239" />
            </linearGradient>
            <linearGradient id="rh_orbit" x1="40" y1="60" x2="200" y2="180" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0" />
              <stop offset="50%" stopColor="#f472b6" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#fb7185" stopOpacity="0" />
            </linearGradient>
            <filter id="rh_shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#881337" floodOpacity="0.35" />
            </filter>
          </defs>

          {/* Ambient Glow */}
          <circle cx="120" cy="120" r="100" fill="url(#rh_glow)" />

          {/* Revolving Orbit Paths */}
          <path
            d="M50 145 C45 80, 140 50, 190 85"
            stroke="url(#rh_orbit)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray="8 6"
          />
          <path
            d="M190 95 C195 160, 100 190, 50 155"
            stroke="url(#rh_orbit)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray="8 6"
          />

          {/* Heart 1: Front / Lower Left */}
          <g transform="translate(48, 88) rotate(-14) scale(0.72)" filter="url(#rh_shadow)">
            <path
              d="M60 22 C60 22, 50 2, 28 2 C12 2, 0 14, 0 32 C0 54, 22 76, 60 110 C98 76, 120 54, 120 32 C120 14, 108 2, 92 2 C70 2, 60 22, 60 22 Z"
              fill="url(#rh_heart1)"
            />
            {/* Top Gloss Highlight */}
            <path d="M18 18 C28 8, 44 8, 52 18" stroke="#ffffff" strokeWidth="5.5" strokeLinecap="round" opacity="0.75" />
          </g>

          {/* Heart 2: Revolving Upper Right */}
          <g transform="translate(118, 40) rotate(18) scale(0.60)" filter="url(#rh_shadow)">
            <path
              d="M60 22 C60 22, 50 2, 28 2 C12 2, 0 14, 0 32 C0 54, 22 76, 60 110 C98 76, 120 54, 120 32 C120 14, 108 2, 92 2 C70 2, 60 22, 60 22 Z"
              fill="url(#rh_heart2)"
            />
            {/* Top Gloss Highlight */}
            <path d="M18 18 C28 8, 44 8, 52 18" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" opacity="0.7" />
          </g>

          {/* Twinkles / Sparkles */}
          <circle cx="195" cy="65" r="3" fill="#fde047" />
          <circle cx="45" cy="85" r="2.5" fill="#f472b6" />
          <circle cx="110" cy="185" r="2.5" fill="#38bdf8" />
        </svg>
      )}
    </div>
  );
};

export const SparkleOOBE: React.FC<SparkleOOBEProps> = ({
  isOpen,
  onComplete,
  navigate,
}) => {
  // OOBE is strictly DARK MODE ("oobe luôn là dark mode")
  const [isMuted, setIsMuted] = useState(false);
  const [isDebugPageOpen, setIsDebugPageOpen] = useState(false);

  // Theme selection in Step 1 ("thêm bước Choose app theme prefereneces (Light/dark) ở đầu oobe")
  const [selectedTheme, setSelectedTheme] = useState<'dark' | 'light'>('dark');

  // Wizard Steps: 1 to 6
  const [currentStep, setCurrentStep] = useState<OOBEStep>(1);

  // Transition loading spinner (5s between steps, enlarged throbber)
  const [isStepTransitioning, setIsStepTransitioning] = useState(false);
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Final 10-second loading throbber after step 6
  const [isFinalLoading, setIsFinalLoading] = useState(false);
  const finalLoadingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Greeting Sequence phases:
  // hi -> ready -> minutes -> almost -> finished
  type GreetingPhase = 
    | 'idle' 
    | 'hi' 
    | 'ready' 
    | 'minutes' 
    | 'almost' 
    | 'finished';

  const [greetingPhase, setGreetingPhase] = useState<GreetingPhase>('idle');
  const [isAlmostFading, setIsAlmostFading] = useState(false);
  const greetingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Step 2 State: Action (Install / Recover)
  const [selectedAction, setSelectedAction] = useState<'install' | 'recover'>('install');
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);

  // Step 3 State: Username
  const [username, setUsername] = useState('Sparkle User');

  // Step 4 State: Terms
  const [termsDeclinePrompt, setTermsDeclinePrompt] = useState(false);

  // Synchronously reset state during render when isOpen changes to true
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen && !prevIsOpen) {
    setPrevIsOpen(true);
    setCurrentStep(1);
    setIsStepTransitioning(false);
    setIsFinalLoading(false);
    setGreetingPhase('idle');
    setIsAlmostFading(false);
    setSelectedAction('install');
    setIsRecoveryModalOpen(false);
  } else if (!isOpen && prevIsOpen) {
    setPrevIsOpen(false);
  }

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setIsStepTransitioning(false);
      setIsFinalLoading(false);
      setGreetingPhase('idle');
      setSelectedAction('install');
      setIsRecoveryModalOpen(false);
    }
    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      if (finalLoadingTimerRef.current) clearTimeout(finalLoadingTimerRef.current);
      if (greetingTimerRef.current) clearTimeout(greetingTimerRef.current);
    };
  }, [isOpen]);

  // Transition between steps helper: 5 seconds with enlarged loading throbber
  const advanceStep = (next: OOBEStep) => {
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    setIsStepTransitioning(true);

    transitionTimerRef.current = setTimeout(() => {
      setIsStepTransitioning(false);
      setCurrentStep(next);
    }, 5000); // 5 seconds
  };

  // When step 6 finishes, start the 10-second loading circle, then greeting screens
  const startFinalSequence = () => {
    setIsFinalLoading(true);

    if (finalLoadingTimerRef.current) clearTimeout(finalLoadingTimerRef.current);
    finalLoadingTimerRef.current = setTimeout(() => {
      setIsFinalLoading(false);
      // Start greeting sequence with Hi (Phase 1)
      setGreetingPhase('hi');
    }, 10000); // 10 seconds
  };

  // Greeting sequence controller:
  // hi (5s) -> ready (5s) -> minutes (20s) -> almost (5s) -> finished (enters app immediately)
  useEffect(() => {
    if (greetingPhase === 'idle' || greetingPhase === 'finished') return;

    if (greetingTimerRef.current) clearTimeout(greetingTimerRef.current);

    if (greetingPhase === 'hi') {
      greetingTimerRef.current = setTimeout(() => {
        setGreetingPhase('ready');
      }, 5000);
    } else if (greetingPhase === 'ready') {
      greetingTimerRef.current = setTimeout(() => {
        setGreetingPhase('minutes');
      }, 5000);
    } else if (greetingPhase === 'minutes') {
      greetingTimerRef.current = setTimeout(() => {
        setGreetingPhase('almost');
      }, 20000); // 20 seconds as requested
    } else if (greetingPhase === 'almost') {
      setIsAlmostFading(false);
      greetingTimerRef.current = setTimeout(() => {
        setIsAlmostFading(true);
        greetingTimerRef.current = setTimeout(() => {
          setGreetingPhase('finished');
          // Persist theme choice and completion
          try {
            localStorage.setItem('sparkle_oobe_completed', 'true');
            if (username.trim()) {
              localStorage.setItem('sparkle_username', username.trim());
            }
            const currentSettingsStr = localStorage.getItem('waves_system_settings');
            const parsed = currentSettingsStr ? JSON.parse(currentSettingsStr) : {};
            parsed.theme = selectedTheme;
            parsed.themeVersion = 2;
            localStorage.setItem('waves_system_settings', JSON.stringify(parsed));

            if (selectedTheme === 'light') {
              document.documentElement.classList.add('light-mode');
              document.documentElement.classList.remove('dark');
            } else {
              document.documentElement.classList.remove('light-mode');
              document.documentElement.classList.add('dark');
            }
          } catch {}
          onComplete();
        }, 1200); // 1.2s smooth fade out
      }, 4500); // freeze for 4.5s then fade out
    }

    return () => {
      if (greetingTimerRef.current) clearTimeout(greetingTimerRef.current);
    };
  }, [greetingPhase, onComplete, username, selectedTheme]);


  // Time for bottom right tray
  const now = new Date();
  const timeString = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

  // Right Column Custom WinUI Scrollbar State (native scrollbar of the app for OOBE)
  const rightPaneRef = useRef<HTMLDivElement>(null);
  const rightPaneTrackRef = useRef<HTMLDivElement>(null);
  const [rightPaneScrollProgress, setRightPaneScrollProgress] = useState(0);
  const [rightPaneThumbHeight, setRightPaneThumbHeight] = useState(48);
  const [isRightPaneScrollable, setIsRightPaneScrollable] = useState(false);
  const [isRightPaneDragging, setIsRightPaneDragging] = useState(false);
  const rightPaneDragStartY = useRef(0);
  const rightPaneDragStartScrollTop = useRef(0);

  const updateRightPaneScroll = useCallback(() => {
    const el = rightPaneRef.current;
    if (!el) return;
    const scrollHeight = el.scrollHeight;
    const clientHeight = el.clientHeight;
    const maxScroll = Math.max(0, scrollHeight - clientHeight);
    const canScroll = maxScroll > 6;
    setIsRightPaneScrollable(canScroll);

    if (canScroll) {
      const progress = Math.min(1, Math.max(0, el.scrollTop / maxScroll));
      setRightPaneScrollProgress(progress);
      const trackH = rightPaneTrackRef.current ? rightPaneTrackRef.current.clientHeight : 220;
      const calculatedThumb = Math.max(
        32,
        Math.min(trackH - 12, (clientHeight / scrollHeight) * trackH)
      );
      setRightPaneThumbHeight(calculatedThumb);
    } else {
      setRightPaneScrollProgress(0);
    }
  }, []);

  useEffect(() => {
    const el = rightPaneRef.current;
    if (!el) return;
    updateRightPaneScroll();

    const handleScroll = () => {
      updateRightPaneScroll();
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateRightPaneScroll);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => updateRightPaneScroll());
      ro.observe(el);
      if (rightPaneTrackRef.current) {
        ro.observe(rightPaneTrackRef.current);
      }
    }

    const interval = setInterval(updateRightPaneScroll, 400);

    return () => {
      el.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateRightPaneScroll);
      if (ro) ro.disconnect();
      clearInterval(interval);
    };
  }, [updateRightPaneScroll, currentStep]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (rightPaneRef.current) {
        rightPaneRef.current.scrollTop = 0;
      }
      updateRightPaneScroll();
    }, 60);
    return () => clearTimeout(timer);
  }, [currentStep, updateRightPaneScroll]);

  const handleRightPanePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const el = rightPaneRef.current;
    if (!el || !rightPaneTrackRef.current) return;
    setIsRightPaneDragging(true);
    rightPaneDragStartY.current = e.clientY;
    rightPaneDragStartScrollTop.current = el.scrollTop;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleRightPanePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isRightPaneDragging || !rightPaneRef.current || !rightPaneTrackRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const el = rightPaneRef.current;
    const trackH = rightPaneTrackRef.current.clientHeight;
    const deltaY = e.clientY - rightPaneDragStartY.current;
    const usableTrackH = Math.max(1, trackH - rightPaneThumbHeight);
    const maxScroll = Math.max(1, el.scrollHeight - el.clientHeight);
    el.scrollTop = rightPaneDragStartScrollTop.current + (deltaY / usableTrackH) * maxScroll;
  };

  const handleRightPanePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isRightPaneDragging) {
      setIsRightPaneDragging(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  const handleRightPaneTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!rightPaneRef.current || !rightPaneTrackRef.current) return;
    if (e.target !== rightPaneTrackRef.current) return;
    const rect = rightPaneTrackRef.current.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const trackH = rect.height;
    const usableTrackH = Math.max(1, trackH - rightPaneThumbHeight);
    const targetProgress = Math.max(0, Math.min(1, (clickY - rightPaneThumbHeight / 2) / usableTrackH));
    const maxScroll = Math.max(0, rightPaneRef.current.scrollHeight - rightPaneRef.current.clientHeight);
    rightPaneRef.current.scrollTo({ top: targetProgress * maxScroll, behavior: 'smooth' });
  };

  const rightPaneTrackH = rightPaneTrackRef.current?.clientHeight || 220;
  const rightPaneUsableTrack = Math.max(0, rightPaneTrackH - rightPaneThumbHeight);
  const rightPaneThumbTop = rightPaneScrollProgress * rightPaneUsableTrack;

  const renderPortal = (content: React.ReactNode) => {
    return typeof document !== 'undefined'
      ? createPortal(content, document.body)
      : (content as React.ReactElement);
  };

  if (!isOpen || greetingPhase === 'finished') return null;

  // ==========================================
  // RENDER POST-SETUP GREETING SCREENS
  // ==========================================
  if (greetingPhase !== 'idle' && greetingPhase !== 'finished') {
    return renderPortal(
      <div 
        className="fixed inset-0 z-[9999999] bg-black select-none flex items-center justify-center overflow-hidden"
        style={{ fontFamily: "'Segoe UI Variable Display', 'Segoe UI Variable Text', 'Segoe UI', system-ui, -apple-system, sans-serif" }}
      >
        <AnimatePresence mode="wait">
          {/* SCREEN 1: "Hi." (Freeze 5s, Regular Font) */}
          {greetingPhase === 'hi' && (
            <motion.div
              key="greeting-hi"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
              className="absolute inset-0 bg-black flex flex-col items-center justify-center text-center p-6"
            >
              <div 
                className="oobe-regular-text text-white text-2xl sm:text-3xl md:text-4xl tracking-normal select-none"
                style={{ fontWeight: 400, fontFamily: "'Segoe UI Variable Display', 'Segoe UI Variable Text', 'Segoe UI', system-ui, sans-serif" }}
              >
                Hi.
              </div>
            </motion.div>
          )}

          {/* SCREEN 2: "Getting things ready for you" (Freeze 5s, Regular Font) */}
          {greetingPhase === 'ready' && (
            <motion.div
              key="greeting-ready"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
              className="absolute inset-0 bg-black flex flex-col items-center justify-center text-center p-6"
            >
              <div 
                className="oobe-regular-text text-white text-2xl sm:text-3xl md:text-4xl tracking-normal select-none"
                style={{ fontWeight: 400, fontFamily: "'Segoe UI Variable Display', 'Segoe UI Variable Text', 'Segoe UI', system-ui, sans-serif" }}
              >
                Getting things ready for you
              </div>
            </motion.div>
          )}

          {/* SCREEN 3: "This might take a few minutes." (Freeze 20s, Regular Font, breathing glow shrinking and expanding slowly) */}
          {greetingPhase === 'minutes' && (
            <motion.div
              key="greeting-minutes"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
              className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 overflow-hidden bg-[#020510]"
              style={{
                background: 'radial-gradient(ellipse at 50% 50%, #0d286d 0%, #061545 45%, #030a24 80%, #010412 100%)',
              }}
            >
              {/* Central Pulsing Ambient Aura: Thu nhỏ sâu hơn ở trạng thái shrink */}
              <motion.div
                animate={{
                  scale: [1.05, 0.32, 1.25, 0.32, 1.05],
                  opacity: [0.75, 0.22, 0.85, 0.22, 0.75],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute w-[560px] h-[560px] sm:w-[720px] sm:h-[720px] pointer-events-none mix-blend-screen"
                style={{
                  background: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.7) 0%, rgba(37, 99, 235, 0.45) 35%, rgba(29, 78, 216, 0.18) 65%, transparent 80%)',
                  filter: 'blur(75px)',
                }}
              />

              {/* Secondary Soft Ambient Pulse: Thu nhỏ sâu hơn ở trạng thái shrink */}
              <motion.div
                animate={{
                  scale: [0.28, 1.20, 0.28],
                  opacity: [0.15, 0.55, 0.15],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute w-[420px] h-[420px] sm:w-[540px] sm:h-[540px] pointer-events-none mix-blend-screen"
                style={{
                  background: 'radial-gradient(circle at 50% 50%, rgba(96, 165, 250, 0.55) 0%, rgba(14, 165, 233, 0.25) 50%, transparent 80%)',
                  filter: 'blur(60px)',
                }}
              />

              {/* Deep edge vignette border shadow */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  boxShadow: 'inset 0 0 160px 80px rgba(0, 0, 0, 0.92)',
                }}
              />

              <div className="relative z-10">
                <div 
                  className="oobe-regular-text text-white text-2xl sm:text-3xl md:text-4xl tracking-normal select-none"
                  style={{ fontWeight: 400, fontFamily: "'Segoe UI Variable Display', 'Segoe UI Variable Text', 'Segoe UI', system-ui, sans-serif" }}
                >
                  This might take a few minutes.
                </div>
                <p 
                  className="oobe-regular-text text-white/80 text-sm sm:text-base mt-4 tracking-wide select-none"
                  style={{ fontWeight: 400, fontFamily: "'Segoe UI Variable Text', 'Segoe UI', system-ui, sans-serif" }}
                >
                  Don&apos;t close the tab or browser
                </p>
              </div>
            </motion.div>
          )}

          {/* SCREEN 4: "Almost there." (Freeze 4.5s + 1.2s fade out, Regular Font) */}
          {greetingPhase === 'almost' && (
            <motion.div
              key="greeting-almost"
              initial={{ opacity: 0 }}
              animate={{ opacity: isAlmostFading ? 0 : 1 }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
              className="absolute inset-0 bg-black flex flex-col items-center justify-center text-center p-6"
            >
              <div 
                className="oobe-regular-text text-white text-2xl sm:text-3xl md:text-4xl tracking-normal select-none"
                style={{ fontWeight: 400, fontFamily: "'Segoe UI Variable Display', 'Segoe UI Variable Text', 'Segoe UI', system-ui, sans-serif" }}
              >
                Almost there.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (isDebugPageOpen) {
    return renderPortal(
      <SparkleOOBEDebug
        onBack={() => setIsDebugPageOpen(false)}
        onSkipInstallation={() => {
          try {
            localStorage.setItem('sparkle_oobe_completed', 'true');
          } catch {}
          setIsDebugPageOpen(false);
          onComplete();
        }}
        onOpenInsiderExperiments={() => {
          setIsDebugPageOpen(false);
          onComplete();
          navigate?.('/settings');
        }}
      />
    );
  }

  // ==========================================
  // RENDER MAIN OOBE WIZARD (LIGHT MODE WITH WINUI 3 DESIGN)
  // ==========================================
  return renderPortal(
    <div 
      className="fixed inset-0 z-[999999] flex flex-col items-center justify-start sm:justify-center p-2 sm:p-4 md:p-6 overflow-y-auto overflow-x-hidden"
      style={{
        backgroundImage: "url('/assets/aistudio/pink-nature-landscape-with-vegetation-flora_8a81cb83.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        fontFamily: "'Segoe UI Variable Display', 'Segoe UI Variable Text', 'Segoe UI', system-ui, -apple-system, sans-serif"
      }}
    >
      {/* Centered WinUI 11 / WinUI 3 Setup Window (15px rounded corners) - Hidden when Recovery Modal is open */}
      <AnimatePresence>
        {!isRecoveryModalOpen && (
          <motion.div
            key="oobe-setup-window"
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-[820px] min-h-[410px] max-h-[86vh] md:h-[450px] rounded-[15px] bg-white/95 backdrop-blur-2xl border border-black/[0.08] shadow-[0_24px_70px_rgba(0,0,0,0.18)] flex flex-col md:flex-row overflow-hidden my-auto shrink-0"
          >
          {/* TOP BACK BUTTON (Inside Window, only during active steps) */}
          {!isStepTransitioning && !isFinalLoading && currentStep > 1 && (
            <div className="absolute top-4 left-4 z-20">
              <button
                type="button"
                onClick={() => advanceStep((currentStep - 1) as OOBEStep)}
                aria-label="Back"
                className="w-8 h-8 rounded-[7px] flex items-center justify-center text-neutral-600 hover:text-neutral-900 hover:bg-black/5 active:bg-black/10 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* WINDOW CONTENT: FADE ANIMATION BETWEEN JUST A MOMENT & WIZARD PAGES */}
          <AnimatePresence mode="wait">
            {isStepTransitioning || isFinalLoading ? (
              /* JUST A MOMENT SCREEN SPLIT INTO 2 PARTS */
              <motion.div
                key="oobe-just-a-moment-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="w-full h-full flex flex-col md:flex-row overflow-hidden"
              >
                {/* LEFT PART: Fluent Hourglass Icon */}
                <div className="w-full md:w-[38%] bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#edf2f7] border-b md:border-b-0 md:border-r border-black/[0.06] flex items-center justify-center p-4 md:p-6 shrink-0 relative overflow-hidden select-none">
                  <div className="absolute inset-0 bg-radial from-blue-500/10 via-transparent to-transparent pointer-events-none" />
                  <FluentHourglassArtwork />
                </div>

                {/* RIGHT PART: Loading GIF and "Just a moment..." text (reduced text size) */}
                <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-6 md:p-8 bg-white select-none text-center">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div
                      aria-hidden="true"
                      className="w-12 h-12 bg-[#0067b8]"
                      style={{
                        WebkitMaskImage: `url("${SPINNING_RING_GIF_URL}")`,
                        maskImage: `url("${SPINNING_RING_GIF_URL}")`,
                        WebkitMaskSize: 'contain',
                        maskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat',
                        maskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                        maskPosition: 'center',
                      }}
                    />
                    <span 
                      className="mt-4 text-[16px] sm:text-[17px] font-normal tracking-wide text-neutral-800"
                      style={{ fontWeight: 400 }}
                    >
                      Just a moment...
                    </span>
                  </div>
                </div>
              </motion.div>
            ) : (
            /* WIZARD SETUP PAGES WITH LEFT & RIGHT PANES */
            <motion.div
              key={`oobe-setup-step-${currentStep}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="w-full h-full flex flex-col md:flex-row overflow-hidden"
            >
              {/* LEFT COLUMN: 3D Fluent Style Colored Artwork */}
              <div className="w-full md:w-[38%] bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#edf2f7] border-b md:border-b-0 md:border-r border-black/[0.06] flex items-center justify-center p-4 md:p-6 shrink-0 relative overflow-hidden">
                <div className="absolute inset-0 bg-radial from-blue-500/10 via-transparent to-transparent pointer-events-none" />

                <AnimatePresence mode="wait">
                  {/* STEP 1: Theme preferences artwork (Sun & Moon 3D) */}
                  {currentStep === 1 && (
                    <motion.div
                      key="left-step1-theme"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="flex flex-col items-center justify-center text-center select-none"
                    >
                      <svg viewBox="0 0 240 240" fill="none" className="w-[170px] h-[170px] drop-shadow-md">
                        <defs>
                          <linearGradient id="oobe_theme_sun" x1="40" y1="40" x2="140" y2="140" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#fde047" />
                            <stop offset="60%" stopColor="#f59e0b" />
                            <stop offset="100%" stopColor="#d97706" />
                          </linearGradient>
                          <linearGradient id="oobe_theme_moon" x1="120" y1="90" x2="200" y2="190" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#818cf8" />
                            <stop offset="60%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#312e81" />
                          </linearGradient>
                        </defs>
                        {/* Sun sphere */}
                        <circle cx="95" cy="95" r="46" fill="url(#oobe_theme_sun)" />
                        {/* Sun rays */}
                        <line x1="95" y1="32" x2="95" y2="16" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" />
                        <line x1="95" y1="158" x2="95" y2="174" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" />
                        <line x1="32" y1="95" x2="16" y2="95" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" />
                        <line x1="158" y1="95" x2="174" y2="95" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" />
                        <line x1="50" y1="50" x2="38" y2="38" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" />
                        <line x1="140" y1="140" x2="152" y2="152" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" />
                        {/* Moon crescent */}
                        <path
                          d="M145 105C125 105 110 120 110 140C110 162 128 180 150 180C168 180 182 168 186 152C178 156 168 156 160 150C148 142 144 126 150 114C148 108 147 106 145 105Z"
                          fill="url(#oobe_theme_moon)"
                        />
                        <circle cx="166" cy="116" r="3" fill="#a5b4fc" />
                        <circle cx="178" cy="132" r="2" fill="#c7d2fe" />
                      </svg>
                    </motion.div>
                  )}

                  {/* STEP 2: Setup Box & Recovery */}
                  {currentStep === 2 && (
                    <motion.div
                      key="left-step2-action"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="flex flex-col items-center justify-center text-center select-none"
                    >
                      <svg viewBox="0 0 240 240" fill="none" className="w-[170px] h-[170px] drop-shadow-md">
                        <defs>
                          <linearGradient id="oobe_box_grad" x1="40" y1="60" x2="200" y2="200" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#38bdf8" />
                            <stop offset="50%" stopColor="#0284c7" />
                            <stop offset="100%" stopColor="#0369a1" />
                          </linearGradient>
                          <linearGradient id="oobe_disc_grad" x1="100" y1="30" x2="210" y2="140" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#f43f5e" />
                            <stop offset="25%" stopColor="#fbbf24" />
                            <stop offset="50%" stopColor="#34d399" />
                            <stop offset="75%" stopColor="#38bdf8" />
                            <stop offset="100%" stopColor="#a855f7" />
                          </linearGradient>
                          <linearGradient id="oobe_wrench_grad" x1="40" y1="40" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#fbbf24" />
                            <stop offset="100%" stopColor="#d97706" />
                          </linearGradient>
                        </defs>
                        <circle cx="155" cy="85" r="48" fill="url(#oobe_disc_grad)" opacity="0.95" />
                        <circle cx="155" cy="85" r="16" fill="#f1f5f9" />
                        <circle cx="155" cy="85" r="8" fill="url(#oobe_box_grad)" />
                        <rect x="50" y="80" width="115" height="120" rx="16" fill="url(#oobe_box_grad)" />
                        <rect x="62" y="92" width="91" height="96" rx="10" fill="white" opacity="0.15" />
                        <path d="M107 108L112 126L130 131L112 136L107 154L102 136L84 131L102 126Z" fill="#ffffff" />
                        <g transform="rotate(-30 75 160)">
                          <rect x="68" y="140" width="14" height="48" rx="7" fill="url(#oobe_wrench_grad)" />
                          <circle cx="75" cy="140" r="14" fill="url(#oobe_wrench_grad)" />
                          <circle cx="75" cy="140" r="6" fill="#f1f5f9" />
                        </g>
                      </svg>
                    </motion.div>
                  )}

                  {/* STEP 3: User Profile Avatar */}
                  {currentStep === 3 && (
                    <motion.div
                      key="left-step3-user"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="flex flex-col items-center justify-center text-center select-none"
                    >
                      <svg viewBox="0 0 240 240" fill="none" className="w-[170px] h-[170px] drop-shadow-md">
                        <defs>
                          <linearGradient id="oobe_user_bg" x1="40" y1="40" x2="200" y2="200" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#a855f7" />
                            <stop offset="50%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#3b82f6" />
                          </linearGradient>
                          <linearGradient id="oobe_user_face" x1="80" y1="60" x2="160" y2="140" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#fde047" />
                            <stop offset="100%" stopColor="#f59e0b" />
                          </linearGradient>
                        </defs>
                        <circle cx="120" cy="120" r="76" fill="url(#oobe_user_bg)" />
                        <circle cx="120" cy="120" r="72" stroke="white" strokeWidth="2" opacity="0.3" />
                        <circle cx="120" cy="100" r="26" fill="url(#oobe_user_face)" />
                        <path d="M72 172C72 144 94 136 120 136C146 136 168 144 168 172V178H72V172Z" fill="#ffffff" />
                        <circle cx="160" cy="80" r="14" fill="#10b981" />
                        <path d="M155 80L158 83L165 76" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </motion.div>
                  )}

                  {/* STEP 4: Legal terms */}
                  {currentStep === 4 && (
                    <motion.div
                      key="left-step4-terms"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="flex flex-col items-center justify-center text-center select-none"
                    >
                      <svg viewBox="0 0 240 240" fill="none" className="w-[170px] h-[170px] drop-shadow-md">
                        <defs>
                          <linearGradient id="oobe_doc_grad" x1="60" y1="40" x2="180" y2="190" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#ffffff" />
                            <stop offset="100%" stopColor="#f1f5f9" />
                          </linearGradient>
                          <linearGradient id="oobe_shield_grad" x1="110" y1="120" x2="180" y2="190" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#1d4ed8" />
                          </linearGradient>
                        </defs>
                        <rect x="65" y="45" width="110" height="145" rx="10" fill="url(#oobe_doc_grad)" stroke="#e2e8f0" strokeWidth="2" />
                        <line x1="85" y1="75" x2="145" y2="75" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
                        <line x1="85" y1="95" x2="155" y2="95" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
                        <line x1="85" y1="110" x2="155" y2="110" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
                        <line x1="85" y1="125" x2="135" y2="125" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" />
                        <path d="M145 125C145 125 170 120 170 145C170 168 145 185 145 185C145 185 120 168 120 145C120 120 145 125 145 125Z" fill="url(#oobe_shield_grad)" />
                        <path d="M137 145L142 150L153 139" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </motion.div>
                  )}

                  {/* STEP 5: Thank you for choosing Sparkle! (Fluent 3 Hearts) */}
                  {currentStep === 5 && (
                    <motion.div
                      key="left-step5-thankyou"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="flex flex-col items-center justify-center text-center select-none"
                    >
                      <FluentThreeHeartsArtwork className="w-[165px] h-[165px]" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* RIGHT COLUMN: Interactive Step Content with Native Custom Scrollbar */}
              <div className="flex-1 min-h-0 relative flex items-stretch overflow-hidden bg-white">
                {/* Scrollable Step Content Container */}
                <div
                  ref={rightPaneRef}
                  data-winui-scroll="true"
                  className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-7 relative overscroll-contain"
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                  }}
                >
                  <AnimatePresence mode="wait">
                    {/* STEP 1: Choose app theme preferences */}
                    {currentStep === 1 && (
                      <motion.div
                        key="step-theme-preferences"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="flex flex-col min-h-full justify-between min-h-0"
                      >
                        <div>
                          <h1 className="text-[19px] sm:text-[21px] font-semibold text-[#111827] leading-tight">
                            Choose app theme preferences
                          </h1>
                          <p className="text-[13px] sm:text-[14px] text-neutral-600 mt-1.5 leading-normal">
                            Select how you would like Sparkle to appear. You can easily switch this at any time in Settings.
                          </p>

                          {/* Two Theme Cards (Light / Dark) */}
                          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Dark Mode Card */}
                            <div
                              onClick={() => setSelectedTheme('dark')}
                              className={`p-4 rounded-[15px] border transition-all cursor-pointer relative ${
                                selectedTheme === 'dark'
                                  ? 'border-[#0067b8] bg-[#0067b8]/[0.04] shadow-xs ring-2 ring-[#0067b8]/40'
                                  : 'border-black/[0.09] bg-white/90 hover:bg-[#fbfbfb] hover:border-black/20 shadow-xs'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Moon className="w-4 h-4 text-indigo-500" />
                                  <span className="text-sm font-semibold text-neutral-900">Dark mode</span>
                                </div>
                                {selectedTheme === 'dark' && (
                                  <div className="w-5 h-5 rounded-full bg-[#0067b8] flex items-center justify-center">
                                    <Check className="w-3.5 h-3.5 text-white" />
                                  </div>
                                )}
                              </div>
                              <div className="h-20 rounded-[15px] bg-[#0f131a] border border-neutral-800 p-2 flex flex-col justify-between overflow-hidden">
                                <div className="h-2 w-16 bg-white/20 rounded-full" />
                                <div className="space-y-1.5">
                                  <div className="h-2 w-full bg-white/10 rounded-full" />
                                  <div className="h-2 w-3/4 bg-white/10 rounded-full" />
                                </div>
                                <div className="flex justify-end gap-1">
                                  <div className="h-3 w-8 bg-[#0067b8] rounded-xs" />
                                </div>
                              </div>
                              <p className="text-[11.5px] text-neutral-500 mt-2.5">
                                High-contrast, easy on the eyes with WinUI acrylic translucency.
                              </p>
                            </div>

                            {/* Light Mode Card */}
                            <div
                              onClick={() => setSelectedTheme('light')}
                              className={`p-4 rounded-[15px] border transition-all cursor-pointer relative ${
                                selectedTheme === 'light'
                                  ? 'border-[#0067b8] bg-[#0067b8]/[0.04] shadow-xs ring-2 ring-[#0067b8]/40'
                                  : 'border-black/[0.09] bg-white/90 hover:bg-[#fbfbfb] hover:border-black/20 shadow-xs'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Sun className="w-4 h-4 text-amber-500" />
                                  <span className="text-sm font-semibold text-neutral-900">Light mode</span>
                                </div>
                                {selectedTheme === 'light' && (
                                  <div className="w-5 h-5 rounded-full bg-[#0067b8] flex items-center justify-center">
                                    <Check className="w-3.5 h-3.5 text-white" />
                                  </div>
                                )}
                              </div>
                              <div className="h-20 rounded-[15px] bg-[#f8fafc] border border-neutral-200 p-2 flex flex-col justify-between overflow-hidden">
                                <div className="h-2 w-16 bg-black/25 rounded-full" />
                                <div className="space-y-1.5">
                                  <div className="h-2 w-full bg-black/15 rounded-full" />
                                  <div className="h-2 w-3/4 bg-black/15 rounded-full" />
                                </div>
                                <div className="flex justify-end gap-1">
                                  <div className="h-3 w-8 bg-[#0067b8] rounded-xs" />
                                </div>
                              </div>
                              <p className="text-[11.5px] text-neutral-500 mt-2.5">
                                Clean and bright presentation with classic Fluent styling.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-neutral-200">
                          {/* WinUI 3 Primary Button */}
                          <button
                            type="button"
                            onClick={() => advanceStep(2)}
                            className="h-8 px-7 rounded-[7px] font-normal text-white bg-[#0067b8] hover:bg-[#1879c7] active:bg-[#005a9e] border border-black/10 border-b-[2px] border-b-black/30 shadow-[0_1px_2px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.16)] active:shadow-none transition-all text-xs sm:text-[13px] flex items-center justify-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0067b8]"
                          >
                            Next
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 2: Choose what you want to do (Install / Recover) */}
                    {currentStep === 2 && (
                      <motion.div
                        key="step-action-choice"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="flex flex-col min-h-full justify-between min-h-0"
                      >
                        <div>
                          <h1 className="text-[19px] sm:text-[21px] font-semibold text-[#111827] leading-tight">
                            Choose what you want to do
                          </h1>
                          <p className="text-[13px] sm:text-[14px] text-neutral-600 mt-1.5 leading-normal">
                            Select whether you want to proceed with a fresh installation or open recovery diagnostics.
                          </p>

                          <div className="mt-6 space-y-3">
                            {/* WinUI 3 Radio Card 1: Install Sparkle */}
                            <label
                              onClick={() => setSelectedAction('install')}
                              className={`block p-4 rounded-[15px] border transition-all cursor-pointer ${
                                selectedAction === 'install'
                                  ? 'border-[#0067b8] bg-[#0067b8]/[0.05] shadow-xs ring-1 ring-[#0067b8]/30'
                                  : 'border-black/[0.09] bg-white/90 hover:bg-[#fbfbfb] hover:border-black/20 shadow-xs'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5 w-4.5 h-4.5 rounded-full border border-neutral-400 bg-white flex items-center justify-center shrink-0">
                                  {selectedAction === 'install' && (
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#0067b8]" />
                                  )}
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-[#111827]">
                                    Install Sparkle
                                  </div>
                                  <div className="text-xs text-neutral-500 mt-0.5 leading-normal">
                                    Set up a fresh instance of Sparkle streaming & community experience on this device.
                                  </div>
                                </div>
                              </div>
                            </label>

                            {/* WinUI 3 Radio Card 2: Recover Sparkle */}
                            <label
                              onClick={() => setSelectedAction('recover')}
                              className={`block p-4 rounded-[15px] border transition-all cursor-pointer ${
                                selectedAction === 'recover'
                                  ? 'border-[#0067b8] bg-[#0067b8]/[0.05] shadow-xs ring-1 ring-[#0067b8]/30'
                                  : 'border-black/[0.09] bg-white/90 hover:bg-[#fbfbfb] hover:border-black/20 shadow-xs'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5 w-4.5 h-4.5 rounded-full border border-neutral-400 bg-white flex items-center justify-center shrink-0">
                                  {selectedAction === 'recover' && (
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#0067b8]" />
                                  )}
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-[#111827]">
                                    Recover Sparkle
                                  </div>
                                  <div className="text-xs text-neutral-500 mt-0.5 leading-normal">
                                    Restore settings, reset corrupted configurations, or submit troubleshooting feedback.
                                  </div>
                                </div>
                              </div>
                            </label>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-neutral-200">
                          {/* WinUI 3 Secondary Button */}
                          <button
                            type="button"
                            onClick={() => advanceStep(1)}
                            className="h-8 px-5 rounded-[7px] font-normal text-[#1b1b1b] bg-[#fbfbfb] hover:bg-[#f5f5f5] active:bg-[#eaeaea] border border-black/10 border-b-[2px] border-b-black/20 shadow-[0_1px_2px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.8)] active:shadow-none transition-all text-xs sm:text-[13px] flex items-center justify-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0067b8]"
                          >
                            Back
                          </button>
                          {/* WinUI 3 Primary Button */}
                          <button
                            type="button"
                            onClick={() => {
                              if (selectedAction === 'recover') {
                                setIsRecoveryModalOpen(true);
                              } else {
                                advanceStep(3);
                              }
                            }}
                            className="h-8 px-7 rounded-[7px] font-normal text-white bg-[#0067b8] hover:bg-[#1879c7] active:bg-[#005a9e] border border-black/10 border-b-[2px] border-b-black/30 shadow-[0_1px_2px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.16)] active:shadow-none transition-all text-xs sm:text-[13px] flex items-center justify-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0067b8]"
                          >
                            Next
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 3: Who is going to use Sparkle (Username) */}
                    {currentStep === 3 && (
                      <motion.div
                        key="step-username"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="flex flex-col min-h-full justify-between min-h-0"
                      >
                        <div>
                          <h1 className="text-[19px] sm:text-[21px] font-semibold text-[#111827] leading-tight">
                            Who is going to use Sparkle?
                          </h1>
                          <p className="text-[13px] sm:text-[14px] text-neutral-600 mt-1.5 leading-normal">
                            Enter your name or nickname to personalize your entertainment channels, notes, and profile.
                          </p>

                          <div className="mt-8 max-w-[360px]">
                            <label className="text-xs font-semibold text-neutral-800 block mb-1.5">
                              User name
                            </label>
                            {/* WinUI 3 Gallery TextBox */}
                            <div className="fluent-input-box relative w-full h-9 bg-black/5 hover:bg-black/[0.08] focus-within:bg-black/5 flex items-center px-3.5 rounded-[6px] transition-colors border-none backdrop-blur-[50px]">
                              <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter a name"
                                spellCheck={false}
                                autoCapitalize="off"
                                autoComplete="off"
                                autoCorrect="off"
                                className="w-full bg-transparent text-xs sm:text-[13px] text-[#111827] placeholder-[#71717a] outline-none border-none py-1"
                              />
                            </div>
                            <p className="text-[11.5px] text-neutral-500 mt-2 leading-relaxed">
                              This user profile will be used throughout the Sparkle WinUI workspace.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-neutral-200">
                          {/* WinUI 3 Secondary Button */}
                          <button
                            type="button"
                            onClick={() => advanceStep(2)}
                            className="h-8 px-5 rounded-[7px] font-normal text-[#1b1b1b] bg-[#fbfbfb] hover:bg-[#f5f5f5] active:bg-[#eaeaea] border border-black/10 border-b-[2px] border-b-black/20 shadow-[0_1px_2px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.8)] active:shadow-none transition-all text-xs sm:text-[13px] flex items-center justify-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0067b8]"
                          >
                            Back
                          </button>
                          {/* WinUI 3 Primary Button */}
                          <button
                            type="button"
                            onClick={() => advanceStep(4)}
                            className="h-8 px-7 rounded-[7px] font-normal text-white bg-[#0067b8] hover:bg-[#1879c7] active:bg-[#005a9e] border border-black/10 border-b-[2px] border-b-black/30 shadow-[0_1px_2px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.16)] active:shadow-none transition-all text-xs sm:text-[13px] flex items-center justify-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0067b8]"
                          >
                            Next
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 4: Applicable notices and license terms (Accept / Decline) */}
                    {currentStep === 4 && (
                      <motion.div
                        key="step-license-terms"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="flex flex-col min-h-full justify-between min-h-0"
                      >
                        <div>
                          <h1 className="text-[19px] sm:text-[21px] font-semibold text-[#111827] leading-tight">
                            Applicable notices and license terms
                          </h1>
                          <p className="text-[13px] sm:text-[14px] text-neutral-600 mt-1.5 leading-normal">
                            Please review the terms of service and license agreement before finishing setup.
                          </p>

                          {/* Native WinUI custom scrollbar */}
                          <NativeWinUIScrollArea height={150} className="mt-4" contentClassName="p-3 text-xs text-neutral-700 space-y-3 leading-relaxed">
                            <div className="font-semibold text-neutral-900 text-[13px]">
                              SPARKLE COMMUNITY SOFTWARE LICENSE TERMS
                            </div>
                            <p>
                              <strong>1. Overview.</strong> Sparkle is a community-driven entertainment, streaming, and productivity platform built with Microsoft Fluent & WinUI standards.
                            </p>
                            <p>
                              <strong>2. Media & Streaming Feeds.</strong> Streaming channels and program schedules are delivered for cultural, educational, and community viewing purposes.
                            </p>
                            <p>
                              <strong>3. Sandboxed Local Storage.</strong> Channel bookmarks, drawings, custom layouts, and sticky notes are maintained securely inside your browser local cache.
                            </p>
                            <p>
                              <strong>4. Insider Program & Updates.</strong> Experimental updates and feature tests may roll out periodically to enhance performance and stability.
                            </p>
                          </NativeWinUIScrollArea>

                          {termsDeclinePrompt && (
                            <p className="mt-2 text-xs text-rose-500 font-medium">
                              You must accept the license terms to complete installation and enter Sparkle.
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-neutral-200">
                          {/* WinUI 3 Secondary Button */}
                          <button
                            type="button"
                            onClick={() => advanceStep(3)}
                            className="h-8 px-5 rounded-[7px] font-normal text-[#1b1b1b] bg-[#fbfbfb] hover:bg-[#f5f5f5] active:bg-[#eaeaea] border border-black/10 border-b-[2px] border-b-black/20 shadow-[0_1px_2px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.8)] active:shadow-none transition-all text-xs sm:text-[13px] flex items-center justify-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0067b8]"
                          >
                            Back
                          </button>
                          <div className="flex items-center gap-2.5">
                            {/* WinUI 3 Secondary Button */}
                            <button
                              type="button"
                              onClick={() => setTermsDeclinePrompt(true)}
                              className="h-8 px-5 rounded-[7px] font-normal text-[#1b1b1b] bg-[#fbfbfb] hover:bg-[#f5f5f5] active:bg-[#eaeaea] border border-black/10 border-b-[2px] border-b-black/20 shadow-[0_1px_2px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.8)] active:shadow-none transition-all text-xs sm:text-[13px] flex items-center justify-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0067b8]"
                            >
                              Decline
                            </button>
                            {/* WinUI 3 Primary Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setTermsDeclinePrompt(false);
                                advanceStep(5);
                              }}
                              className="h-8 px-7 rounded-[7px] font-normal text-white bg-[#0067b8] hover:bg-[#1879c7] active:bg-[#005a9e] border border-black/10 border-b-[2px] border-b-black/30 shadow-[0_1px_2px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.16)] active:shadow-none transition-all text-xs sm:text-[13px] flex items-center justify-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0067b8]"
                            >
                              Accept
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 5: Thank you for choosing Sparkle! */}
                    {currentStep === 5 && (
                      <motion.div
                        key="step-thank-you"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="flex flex-col min-h-full justify-between min-h-0"
                      >
                        <div>
                          <h1 className="text-[19px] sm:text-[21px] font-semibold text-[#111827] leading-tight">
                            Thank you for choosing Sparkle!
                          </h1>
                          <p className="text-[13px] sm:text-[14px] text-neutral-600 mt-1.5 leading-normal">
                            Your setup is complete and Sparkle is ready for you. Everything is set up to give you the best entertainment, productivity, and community experience.
                          </p>

                          <div className="mt-5 space-y-3">
                            {/* Summary Card: Profile & Theme */}
                            <div className="p-4 rounded-[12px] bg-black/[0.03] border border-black/[0.08] flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-[#0067b8]/10 text-[#0067b8] flex items-center justify-center font-semibold text-sm">
                                  {(username.trim() || 'S').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="text-xs sm:text-[13px] font-semibold text-neutral-900 flex items-center gap-1.5">
                                    <span>{username.trim() || 'Sparkle User'}</span>
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800">
                                      Ready
                                    </span>
                                  </div>
                                  <div className="text-[11.5px] text-neutral-500 mt-0.5">
                                    {selectedTheme === 'dark' ? 'Dark theme' : 'Light theme'} · Standard edition
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Welcome Highlights Card */}
                            <div className="p-3.5 rounded-[12px] bg-[#0067b8]/[0.04] border border-[#0067b8]/20 flex items-start gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#0067b8]/10 flex items-center justify-center shrink-0 mt-0.5 shadow-xs overflow-hidden">
                                <img
                                  src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Revolving%20hearts/3D/revolving_hearts_3d.png"
                                  alt="💞"
                                  className="w-5 h-5 object-contain"
                                />
                              </div>
                              <div className="text-xs text-neutral-700 leading-relaxed">
                                Sparkle is personalized and ready. Click <strong>Get started</strong> below to enter your workspace and enjoy streaming TV, radio, notes, and community updates.
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-neutral-200">
                          {/* WinUI 3 Secondary Button */}
                          <button
                            type="button"
                            onClick={() => advanceStep(4)}
                            className="h-8 px-5 rounded-[7px] font-normal text-[#1b1b1b] bg-[#fbfbfb] hover:bg-[#f5f5f5] active:bg-[#eaeaea] border border-black/10 border-b-[2px] border-b-black/20 shadow-[0_1px_2px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.8)] active:shadow-none transition-all text-xs sm:text-[13px] flex items-center justify-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0067b8]"
                          >
                            Back
                          </button>
                          {/* WinUI 3 Primary Button */}
                          <button
                            type="button"
                            onClick={startFinalSequence}
                            className="h-8 px-8 rounded-[7px] font-normal text-white bg-[#0067b8] hover:bg-[#1879c7] active:bg-[#005a9e] border border-black/10 border-b-[2px] border-b-black/30 shadow-[0_1px_2px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.16)] active:shadow-none transition-all text-xs sm:text-[13px] flex items-center justify-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0067b8]"
                          >
                            Get started
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Native WinUI Custom Scrollbar for Right Pane */}
                {isRightPaneScrollable && (
                  <div
                    onWheel={(e) => {
                      rightPaneRef.current?.scrollBy({ top: e.deltaY });
                    }}
                    className="w-4 my-3 mr-1.5 shrink-0 flex flex-col items-center justify-between select-none z-30 transition-opacity duration-200"
                  >
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={(e) => {
                        e.stopPropagation();
                        rightPaneRef.current?.scrollBy({ top: -140, behavior: 'smooth' });
                      }}
                      className="w-4 h-4 rounded-[7px] flex items-center justify-center transition-colors cursor-default bg-neutral-100/80 hover:bg-neutral-200 active:bg-neutral-300 text-neutral-600 hover:text-neutral-900 shrink-0 border-none"
                      title="Scroll up"
                    >
                      <ChevronUp className="w-2.5 h-2.5 stroke-[2.5]" />
                    </button>

                    <div
                      ref={rightPaneTrackRef}
                      onClick={handleRightPaneTrackClick}
                      className="relative flex-1 w-full my-1 rounded-full cursor-default bg-neutral-100 hover:bg-neutral-200 transition-colors"
                    >
                      <div
                        role="scrollbar"
                        aria-valuenow={Math.round(rightPaneScrollProgress * 100)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-orientation="vertical"
                        onPointerDown={handleRightPanePointerDown}
                        onPointerMove={handleRightPanePointerMove}
                        onPointerUp={handleRightPanePointerUp}
                        onPointerCancel={handleRightPanePointerUp}
                        style={{
                          top: `${rightPaneThumbTop}px`,
                          height: `${rightPaneThumbHeight}px`,
                        }}
                        className={`absolute left-1/2 -translate-x-1/2 rounded-full cursor-default ${
                          isRightPaneDragging
                            ? 'w-2.5 bg-neutral-600 shadow-xs'
                            : 'w-2 hover:w-2.5 bg-neutral-400 hover:bg-neutral-500 active:bg-neutral-600 transition-all duration-150'
                        }`}
                      />
                    </div>

                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={(e) => {
                        e.stopPropagation();
                        rightPaneRef.current?.scrollBy({ top: 140, behavior: 'smooth' });
                      }}
                      className="w-4 h-4 rounded-[7px] flex items-center justify-center transition-colors cursor-default bg-neutral-100/80 hover:bg-neutral-200 active:bg-neutral-300 text-neutral-600 hover:text-neutral-900 shrink-0 border-none"
                      title="Scroll down"
                    >
                      <ChevronDown className="w-2.5 h-2.5 stroke-[2.5]" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )}
  </AnimatePresence>

      {/* Sparkle Recovery Modal Dialog on top of OOBE wallpaper */}
      <SparkleRecoveryModal
        isOpen={isRecoveryModalOpen}
        onClose={() => setIsRecoveryModalOpen(false)}
        navigate={navigate}
      />

      {/* Windows 11 Bottom Right Tray (BÊN NGOÀI window oobe) */}
      <div className="absolute bottom-4 right-6 z-30 flex items-center gap-2 select-none">
        {/* Debug Button (Icon only, NO text title, NO tooltip title) */}
        <button
          type="button"
          onClick={() => setIsDebugPageOpen(true)}
          aria-label="Debug"
          className="w-8 h-8 rounded-[7px] flex items-center justify-center text-neutral-700 bg-white/75 hover:bg-white/95 active:bg-white backdrop-blur-md border border-black/[0.08] shadow-xs transition-colors cursor-pointer"
        >
          <Bug className="h-4 w-4" aria-hidden="true" />
        </button>

        {/* Volume Button (Icon only) */}
        <button
          type="button"
          onClick={() => setIsMuted(!isMuted)}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
          className="w-8 h-8 rounded-[7px] flex items-center justify-center text-neutral-700 bg-white/75 hover:bg-white/95 active:bg-white backdrop-blur-md border border-black/[0.08] shadow-xs transition-colors cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Accessibility Button */}
        <button
          type="button"
          aria-label="Accessibility"
          className="w-8 h-8 rounded-[7px] flex items-center justify-center text-neutral-700 bg-white/75 hover:bg-white/95 active:bg-white backdrop-blur-md border border-black/[0.08] shadow-xs transition-colors cursor-pointer"
        >
          <Accessibility className="w-4 h-4" />
        </button>

        {/* Clock Time */}
        <div className="h-8 px-2.5 rounded-[7px] flex items-center justify-center text-neutral-700 text-xs font-normal bg-white/75 backdrop-blur-md border border-black/[0.08] shadow-xs cursor-default">
          <span className="tracking-wide">{timeString}</span>
        </div>
      </div>
    </div>
  );
};

export default SparkleOOBE;
