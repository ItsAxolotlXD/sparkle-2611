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
// 2: Choose country or region / keyboard and input methods
// 3: Choose what you want to do (Install / Recover)
// 4: Who is going to use Sparkle (Enter username)
// 5: Applicable notices and license terms (Accept / Decline)
// 6: Now let's see what's new on Sparkle
type OOBEStep = 1 | 2 | 3 | 4 | 5 | 6;

// Countries list for Country/Region selection
const COUNTRIES_LIST = [
  'Vietnam',
  'United States',
  'United Kingdom',
  'Japan',
  'South Korea',
  'France',
  'Germany',
  'Canada',
  'Australia',
  'Singapore',
  'Thailand',
  'Malaysia',
  'Indonesia',
  'Philippines',
  'India',
  'New Zealand',
  'Netherlands',
  'Sweden',
  'Switzerland',
  'Brazil',
  'Argentina',
  'Austria',
  'Belgium',
  'Denmark',
  'Finland',
  'Italy',
  'Norway',
  'Spain',
  'Tuvalu',
  'U.S. Minor Outlying Islands',
  'U.S. Virgin Islands',
  'Uganda',
  'Ukraine',
  'United Arab Emirates'
];

const KEYBOARD_LAYOUTS = [
  { id: 'vi-telex', name: 'Vietnamese (Telex)' },
  { id: 'en-us', name: 'United States (QWERTY)' },
  { id: 'vi-vni', name: 'Vietnamese (VNI)' },
  { id: 'en-uk', name: 'United Kingdom' }
];

// NATIVE SVG ILLUSTRATION: Globe + Suitcase + Paper Airplane + Stack of Books (matching Image 1 natively)
const NativeOobeGlobeArtwork: React.FC = () => (
  <svg viewBox="0 0 340 300" fill="none" className="w-full max-w-[220px] sm:max-w-[240px] drop-shadow-md select-none pointer-events-none">
    <defs>
      <linearGradient id="globe_stand_grad" x1="100" y1="120" x2="160" y2="210" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fcd34d" />
        <stop offset="60%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>
      <linearGradient id="globe_ocean_grad" x1="70" y1="40" x2="180" y2="160" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#60a5fa" />
        <stop offset="40%" stopColor="#2563eb" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
      <linearGradient id="suitcase_grad" x1="190" y1="180" x2="310" y2="290" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#0284c7" />
        <stop offset="60%" stopColor="#0369a1" />
        <stop offset="100%" stopColor="#075985" />
      </linearGradient>
      <linearGradient id="plane_grad" x1="210" y1="50" x2="310" y2="120" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="60%" stopColor="#e2e8f0" />
        <stop offset="100%" stopColor="#cbd5e1" />
      </linearGradient>
      <filter id="globe_shadow" x="-10%" y="-10%" width="125%" height="125%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.2" />
      </filter>
    </defs>

    {/* Orbiting dotted flight trail */}
    <g opacity="0.35">
      <circle cx="28" cy="140" r="2.5" fill="#94a3b8" />
      <circle cx="34" cy="120" r="2.5" fill="#94a3b8" />
      <circle cx="56" cy="98" r="2.5" fill="#94a3b8" />
      <circle cx="185" cy="138" r="2.5" fill="#94a3b8" />
      <circle cx="205" cy="132" r="2.5" fill="#94a3b8" />
      <circle cx="218" cy="115" r="2.5" fill="#94a3b8" />
    </g>

    {/* Stack of Books at bottom-left */}
    <g filter="url(#globe_shadow)">
      {/* Bottom Book (Yellow hardcover with white pages) */}
      <rect x="42" y="248" width="138" height="32" rx="5" fill="#fde68a" />
      <rect x="44" y="252" width="132" height="24" rx="3" fill="#ffffff" />
      <line x1="44" y1="260" x2="176" y2="260" stroke="#e2e8f0" strokeWidth="1.5" />
      <line x1="44" y1="268" x2="176" y2="268" stroke="#e2e8f0" strokeWidth="1.5" />

      {/* Top Book (White/gray pages with curved spine) */}
      <rect x="52" y="208" width="124" height="36" rx="6" fill="#f1f5f9" />
      <path d="M52 208C46 208 42 216 42 226C42 236 46 244 52 244H176V208H52Z" fill="#e2e8f0" />
      <circle cx="85" cy="226" r="2" fill="#cbd5e1" />
      <circle cx="115" cy="226" r="2" fill="#cbd5e1" />
      <circle cx="145" cy="226" r="2" fill="#cbd5e1" />
    </g>

    {/* 3D Globe Stand & Base */}
    <g filter="url(#globe_shadow)">
      {/* Base disc */}
      <ellipse cx="120" cy="208" rx="42" ry="10" fill="url(#globe_stand_grad)" />
      {/* Vertical post */}
      <rect x="114" y="170" width="12" height="38" rx="4" fill="url(#globe_stand_grad)" />
      {/* Meridian Arc */}
      <path
        d="M62 108C62 58 100 24 150 24C164 24 175 27 184 32"
        stroke="url(#globe_stand_grad)"
        strokeWidth="11"
        strokeLinecap="round"
      />
      <circle cx="72" cy="36" r="5" fill="#f59e0b" />
      {/* Axis bottom pin */}
      <circle cx="166" cy="186" r="5.5" fill="#f59e0b" />
      <line x1="166" y1="186" x2="148" y2="162" stroke="url(#globe_stand_grad)" strokeWidth="6" strokeLinecap="round" />
    </g>

    {/* 3D Globe Sphere */}
    <g filter="url(#globe_shadow)">
      <circle cx="118" cy="98" r="54" fill="url(#globe_ocean_grad)" />
      {/* Continents in light pastel cyan */}
      <path
        d="M95 62C105 60 114 66 120 74C126 82 135 78 142 82C150 86 156 98 152 106C148 114 135 120 128 132C122 142 110 148 98 144C88 140 82 128 78 118C74 108 85 85 95 62Z"
        fill="#93c5fd"
        opacity="0.9"
      />
      <path
        d="M130 52C138 52 146 58 150 64C154 70 162 72 165 68C160 58 148 50 130 52Z"
        fill="#bfdbfe"
        opacity="0.85"
      />
      {/* Spherical specular highlight gloss */}
      <path
        d="M80 66C90 56 104 50 120 50C124 50 126 52 125 55C124 58 120 60 116 60C104 60 92 65 84 73C82 75 79 74 78 71C77 69 78 68 80 66Z"
        fill="#ffffff"
        opacity="0.6"
      />
    </g>

    {/* 3D Travel Suitcase at bottom-right */}
    <g filter="url(#globe_shadow)">
      {/* Main Suitcase Body */}
      <rect x="200" y="180" width="120" height="98" rx="14" fill="url(#suitcase_grad)" />
      {/* Top Handle */}
      <path
        d="M242 180V166C242 162 246 158 250 158H270C274 158 278 162 278 166V180"
        stroke="#fcd34d"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      {/* Yellow/Golden Leather Straps */}
      <rect x="222" y="180" width="10" height="98" fill="#fcd34d" />
      <rect x="288" y="180" width="10" height="98" fill="#fcd34d" />
      {/* Brass Corner Protectors */}
      <circle cx="206" cy="186" r="6" fill="#fbbf24" />
      <circle cx="314" cy="186" r="6" fill="#fbbf24" />
      <circle cx="206" cy="272" r="6" fill="#fbbf24" />
      <circle cx="314" cy="272" r="6" fill="#fbbf24" />
      {/* Travel Stamp Stickers */}
      <rect x="248" y="204" width="16" height="16" rx="3" fill="#ffffff" transform="rotate(12 248 204)" opacity="0.95" />
      <circle cx="244" cy="246" r="8" fill="#ffffff" opacity="0.9" />
      <polygon points="274,228 266,242 282,242" fill="#ffffff" opacity="0.9" />
    </g>

    {/* Origami Paper Airplane soaring up-right */}
    <g filter="url(#globe_shadow)">
      <polygon points="220,95 320,40 275,130 258,105" fill="url(#plane_grad)" />
      {/* Crease fold */}
      <polygon points="258,105 320,40 275,130" fill="#cbd5e1" opacity="0.8" />
      <line x1="220" y1="95" x2="320" y2="40" stroke="#94a3b8" strokeWidth="1" />
    </g>
  </svg>
);

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
  const greetingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Step 2 State: Country & Keyboard
  const [selectedCountry, setSelectedCountry] = useState('Vietnam');
  const [countrySearch, setCountrySearch] = useState('');
  const [selectedKeyboard, setSelectedKeyboard] = useState('vi-telex');

  // Step 3 State: Action (Install / Recover)
  const [selectedAction, setSelectedAction] = useState<'install' | 'recover'>('install');
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);

  // Step 4 State: Username
  const [username, setUsername] = useState('Sparkle User');

  // Step 5 State: Terms
  const [termsDeclinePrompt, setTermsDeclinePrompt] = useState(false);

  // Synchronously reset state during render when isOpen changes to true
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen && !prevIsOpen) {
    setPrevIsOpen(true);
    setCurrentStep(1);
    setIsStepTransitioning(false);
    setIsFinalLoading(false);
    setGreetingPhase('idle');
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
      }, 5000);
    }

    return () => {
      if (greetingTimerRef.current) clearTimeout(greetingTimerRef.current);
    };
  }, [greetingPhase, onComplete, username, selectedTheme]);

  // Filtered countries
  const filteredCountries = COUNTRIES_LIST.filter((c) =>
    c.toLowerCase().includes(countrySearch.toLowerCase())
  );

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
                className="oobe-regular-text text-white text-4xl sm:text-5xl md:text-6xl tracking-normal select-none"
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
                className="oobe-regular-text text-white text-3xl sm:text-4xl md:text-5xl tracking-normal select-none"
                style={{ fontWeight: 400, fontFamily: "'Segoe UI Variable Display', 'Segoe UI Variable Text', 'Segoe UI', system-ui, sans-serif" }}
              >
                Getting things ready for you
              </div>
            </motion.div>
          )}

          {/* SCREEN 3: "This might take a few minutes." (Freeze 20s, Regular Font, pulsing & radiating vintage ambient aura) */}
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
              {/* Vintage Aura 1: Zooms in and out (thu nhỏ phóng to) & radiates outward slowly (toả ra chậm rãi) */}
              <motion.div
                animate={{
                  scale: [0.85, 1.35, 1.1, 0.85],
                  opacity: [0.35, 0.72, 0.45, 0.35],
                  rotate: [0, 90, 180, 270, 360],
                }}
                transition={{
                  duration: 16,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -inset-[45%] pointer-events-none mix-blend-screen"
                style={{
                  background: 'radial-gradient(ellipse at 50% 50%, rgba(59, 130, 246, 0.55) 0%, rgba(37, 99, 235, 0.35) 40%, rgba(30, 64, 175, 0.15) 70%, transparent 85%)',
                  filter: 'blur(85px)',
                }}
              />

              {/* Vintage Aura 2: Secondary radial pulse blooming and breathing outward */}
              <motion.div
                animate={{
                  scale: [1.2, 0.88, 1.4, 1.2],
                  opacity: [0.25, 0.55, 0.32, 0.25],
                }}
                transition={{
                  duration: 12,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1.5,
                }}
                className="absolute -inset-[35%] pointer-events-none mix-blend-screen"
                style={{
                  background: 'radial-gradient(circle at 50% 50%, rgba(96, 165, 250, 0.45) 0%, rgba(14, 165, 233, 0.22) 50%, transparent 80%)',
                  filter: 'blur(95px)',
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

          {/* SCREEN 4: "Almost there." (Freeze 5s, Regular Font) */}
          {greetingPhase === 'almost' && (
            <motion.div
              key="greeting-almost"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
              className="absolute inset-0 bg-black flex flex-col items-center justify-center text-center p-6"
            >
              <div 
                className="oobe-regular-text text-white text-3xl sm:text-4xl md:text-5xl tracking-normal select-none"
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
        backgroundImage: "url('/assets/aistudio/Wallpaper_Alchemy_-_Windows_11_Abstract_Wave_Wallpaper_4K_e12d77d6.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        fontFamily: "'Segoe UI Variable Display', 'Segoe UI Variable Text', 'Segoe UI', system-ui, -apple-system, sans-serif"
      }}
    >
      {/* Centered WinUI 11 / WinUI 3 Setup Window (15px rounded corners) */}
      <motion.div
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
                className="w-8 h-8 rounded-[15px] flex items-center justify-center text-neutral-600 hover:text-neutral-900 hover:bg-black/5 active:bg-black/10 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* WINDOW CONTENT: FADE ANIMATION BETWEEN JUST A MOMENT & WIZARD PAGES */}
          <AnimatePresence mode="wait">
            {isStepTransitioning || isFinalLoading ? (
              /* JUST A MOMENT SCREEN PERFECTLY CENTERED INSIDE OOBE WINDOW */
              <motion.div
                key="oobe-just-a-moment-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="w-full h-full flex-1 flex flex-col items-center justify-center m-auto p-8 select-none text-center"
              >
                <div className="flex flex-col items-center justify-center text-center">
                  <div
                    aria-hidden="true"
                    className="w-14 h-14 bg-[#0067b8]"
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
                    className="mt-5 text-xl sm:text-2xl font-normal tracking-wide text-neutral-800"
                    style={{ fontWeight: 400 }}
                  >
                    Just a moment...
                  </span>
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

                  {/* STEP 2: NATIVE SVG Globe & Travel */}
                  {currentStep === 2 && (
                    <motion.div
                      key="left-step2-globe"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="flex flex-col items-center justify-center"
                    >
                      <NativeOobeGlobeArtwork />
                    </motion.div>
                  )}

                  {/* STEP 3: Setup Box & Recovery */}
                  {currentStep === 3 && (
                    <motion.div
                      key="left-step3-action"
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

                  {/* STEP 4: User Profile Avatar */}
                  {currentStep === 4 && (
                    <motion.div
                      key="left-step4-user"
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

                  {/* STEP 5: Legal terms */}
                  {currentStep === 5 && (
                    <motion.div
                      key="left-step5-terms"
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

                  {/* STEP 6: Sparkle Features */}
                  {currentStep === 6 && (
                    <motion.div
                      key="left-step6-features"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="flex flex-col items-center justify-center text-center select-none"
                    >
                      <svg viewBox="0 0 240 240" fill="none" className="w-[170px] h-[170px] drop-shadow-md">
                        <defs>
                          <linearGradient id="oobe_star_grad" x1="60" y1="50" x2="180" y2="180" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#fb7185" />
                            <stop offset="35%" stopColor="#f43f5e" />
                            <stop offset="70%" stopColor="#d946ef" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                          </linearGradient>
                        </defs>
                        <path d="M120 30L135 95L200 110L135 125L120 190L105 125L40 110L105 95Z" fill="url(#oobe_star_grad)" />
                        <circle cx="65" cy="65" r="8" fill="#38bdf8" />
                        <circle cx="180" cy="60" r="12" fill="#fbbf24" />
                        <circle cx="185" cy="165" r="9" fill="#34d399" />
                        <circle cx="60" cy="160" r="7" fill="#818cf8" />
                      </svg>
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
                            className="h-8 px-7 rounded-[15px] font-normal text-white bg-[#0067b8] hover:bg-[#1879c7] active:bg-[#005a9e] border border-black/10 border-b-[2px] border-b-black/30 shadow-[0_1px_2px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.16)] active:shadow-none transition-all text-xs sm:text-[13px] flex items-center justify-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0067b8]"
                          >
                            Next
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 2: Welcome to Sparkle Setup Wizard (Country/Region & Keyboard) */}
                    {currentStep === 2 && (
                      <motion.div
                        key="step-country-region"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="flex flex-col min-h-full justify-between min-h-0"
                      >
                        <div>
                          <h1 className="text-[19px] sm:text-[21px] font-semibold text-[#111827] leading-tight">
                            Is this the right country or region?
                          </h1>
                          <p className="text-[13px] sm:text-[14px] text-neutral-600 mt-1.5 leading-normal">
                            Welcome to Sparkle Setup Wizard. Choose your country or region to configure localized broadcasting and language.
                          </p>

                          {/* Country Search Filter (TopBar search box design style) */}
                          <div className="mt-3.5">
                            <div className="fluent-search-box group relative w-full h-9 bg-[#fbfbfb] hover:bg-black/[0.04] focus-within:bg-white dark:bg-[#282c31] border-none flex items-center px-3.5 gap-2 transition-colors rounded-[6px]">
                              <FluentSearchIcon className="w-[16px] h-[16px] text-black dark:text-white shrink-0 pointer-events-none select-none" />
                              <input
                                type="text"
                                value={countrySearch}
                                onChange={(e) => setCountrySearch(e.target.value)}
                                placeholder="Search country or region..."
                                spellCheck={false}
                                autoCapitalize="off"
                                autoComplete="off"
                                autoCorrect="off"
                                className="flex-1 min-w-0 bg-transparent text-xs sm:text-[13px] text-[#111827] dark:text-white placeholder-black/60 dark:placeholder-white outline-none border-none py-1 pr-1"
                              />
                              {countrySearch && (
                                <button
                                  type="button"
                                  onClick={() => setCountrySearch('')}
                                  title="Clear search"
                                  className="w-5 h-5 rounded-full flex items-center justify-center text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 shrink-0 cursor-pointer transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Native WinUI custom scrollbar */}
                          <NativeWinUIScrollArea height={165} className="mt-2.5">
                            {filteredCountries.map((country) => {
                              const isSelected = selectedCountry === country;
                              return (
                                <button
                                  key={country}
                                  type="button"
                                  onClick={() => setSelectedCountry(country)}
                                  className={`w-full text-left px-3 py-1.5 text-xs sm:text-[13px] rounded-[15px] transition-colors flex items-center justify-between cursor-pointer ${
                                    isSelected
                                      ? 'bg-[#0067b8] text-white font-medium shadow-xs'
                                      : 'text-neutral-800 hover:bg-black/[0.04]'
                                  }`}
                                >
                                  <span>{country}</span>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                </button>
                              );
                            })}
                          </NativeWinUIScrollArea>

                          {/* Keyboard layout selection (WinUI 3 ComboBox) */}
                          <div className="mt-2.5">
                            <label className="text-xs font-semibold text-neutral-800 block mb-1">
                              Keyboard and input methods
                            </label>
                            <select
                              value={selectedKeyboard}
                              onChange={(e) => setSelectedKeyboard(e.target.value)}
                              className="w-full h-8 px-3 text-xs sm:text-[13px] bg-white border border-black/10 border-b-[2px] border-b-black/45 focus:border-b-[#0067b8] rounded-[15px] text-[#1b1b1b] outline-none shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors cursor-pointer"
                            >
                              {KEYBOARD_LAYOUTS.map((kb) => (
                                <option key={kb.id} value={kb.id} className="bg-white text-neutral-900">
                                  {kb.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-neutral-200">
                          {/* WinUI 3 Secondary Button */}
                          <button
                            type="button"
                            onClick={() => advanceStep(1)}
                            className="h-8 px-5 rounded-[15px] font-normal text-[#1b1b1b] bg-[#fbfbfb] hover:bg-[#f5f5f5] active:bg-[#eaeaea] border border-black/10 border-b-[2px] border-b-black/20 shadow-[0_1px_2px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.8)] active:shadow-none transition-all text-xs sm:text-[13px] flex items-center justify-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0067b8]"
                          >
                            Back
                          </button>
                          {/* WinUI 3 Primary Button */}
                          <button
                            type="button"
                            onClick={() => advanceStep(3)}
                            className="h-8 px-7 rounded-[15px] font-normal text-white bg-[#0067b8] hover:bg-[#1879c7] active:bg-[#005a9e] border border-black/10 border-b-[2px] border-b-black/30 shadow-[0_1px_2px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.16)] active:shadow-none transition-all text-xs sm:text-[13px] flex items-center justify-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0067b8]"
                          >
                            Yes
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 3: Choose what you want to do (Install / Recover) */}
                    {currentStep === 3 && (
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
                            onClick={() => advanceStep(2)}
                            className="h-8 px-5 rounded-[15px] font-normal text-[#1b1b1b] bg-[#fbfbfb] hover:bg-[#f5f5f5] active:bg-[#eaeaea] border border-black/10 border-b-[2px] border-b-black/20 shadow-[0_1px_2px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.8)] active:shadow-none transition-all text-xs sm:text-[13px] flex items-center justify-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0067b8]"
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
                                advanceStep(4);
                              }
                            }}
                            className="h-8 px-7 rounded-[15px] font-normal text-white bg-[#0067b8] hover:bg-[#1879c7] active:bg-[#005a9e] border border-black/10 border-b-[2px] border-b-black/30 shadow-[0_1px_2px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.16)] active:shadow-none transition-all text-xs sm:text-[13px] flex items-center justify-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0067b8]"
                          >
                            Next
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 4: Who is going to use Sparkle (Username) */}
                    {currentStep === 4 && (
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
                            {/* WinUI 3 TextBox */}
                            <input
                              type="text"
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              placeholder="Enter username"
                              className="w-full h-8 px-3 text-xs sm:text-[13px] bg-white border border-black/10 border-b-[2px] border-b-black/45 focus:border-b-[#0067b8] rounded-[15px] text-[#1b1b1b] outline-none shadow-[0_1px_2px_rgba(0,0,0,0.04)] placeholder:text-neutral-400 transition-colors"
                            />
                            <p className="text-[11.5px] text-neutral-500 mt-2">
                              This user profile will be used throughout the Sparkle WinUI workspace.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-neutral-200">
                          {/* WinUI 3 Secondary Button */}
                          <button
                            type="button"
                            onClick={() => advanceStep(3)}
                            className="h-8 px-5 rounded-[15px] font-normal text-[#1b1b1b] bg-[#fbfbfb] hover:bg-[#f5f5f5] active:bg-[#eaeaea] border border-black/10 border-b-[2px] border-b-black/20 shadow-[0_1px_2px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.8)] active:shadow-none transition-all text-xs sm:text-[13px] flex items-center justify-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0067b8]"
                          >
                            Back
                          </button>
                          {/* WinUI 3 Primary Button */}
                          <button
                            type="button"
                            onClick={() => advanceStep(5)}
                            className="h-8 px-7 rounded-[15px] font-normal text-white bg-[#0067b8] hover:bg-[#1879c7] active:bg-[#005a9e] border border-black/10 border-b-[2px] border-b-black/30 shadow-[0_1px_2px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.16)] active:shadow-none transition-all text-xs sm:text-[13px] flex items-center justify-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0067b8]"
                          >
                            Next
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 5: Applicable notices and license terms (Accept / Decline) */}
                    {currentStep === 5 && (
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
                            onClick={() => advanceStep(4)}
                            className="h-8 px-5 rounded-[15px] font-normal text-[#1b1b1b] bg-[#fbfbfb] hover:bg-[#f5f5f5] active:bg-[#eaeaea] border border-black/10 border-b-[2px] border-b-black/20 shadow-[0_1px_2px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.8)] active:shadow-none transition-all text-xs sm:text-[13px] flex items-center justify-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0067b8]"
                          >
                            Back
                          </button>
                          <div className="flex items-center gap-2.5">
                            {/* WinUI 3 Secondary Button */}
                            <button
                              type="button"
                              onClick={() => setTermsDeclinePrompt(true)}
                              className="h-8 px-5 rounded-[15px] font-normal text-[#1b1b1b] bg-[#fbfbfb] hover:bg-[#f5f5f5] active:bg-[#eaeaea] border border-black/10 border-b-[2px] border-b-black/20 shadow-[0_1px_2px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.8)] active:shadow-none transition-all text-xs sm:text-[13px] flex items-center justify-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0067b8]"
                            >
                              Decline
                            </button>
                            {/* WinUI 3 Primary Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setTermsDeclinePrompt(false);
                                advanceStep(6);
                              }}
                              className="h-8 px-7 rounded-[15px] font-normal text-white bg-[#0067b8] hover:bg-[#1879c7] active:bg-[#005a9e] border border-black/10 border-b-[2px] border-b-black/30 shadow-[0_1px_2px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.16)] active:shadow-none transition-all text-xs sm:text-[13px] flex items-center justify-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0067b8]"
                            >
                              Accept
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* STEP 6: Now let's see what's new on Sparkle */}
                    {currentStep === 6 && (
                      <motion.div
                        key="step-features-showcase"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="flex flex-col min-h-full justify-between min-h-0"
                      >
                        <div>
                          <h1 className="text-[19px] sm:text-[21px] font-semibold text-[#111827] leading-tight">
                            Now let&apos;s see what&apos;s new on Sparkle
                          </h1>
                          <p className="text-[13px] sm:text-[14px] text-neutral-600 mt-1.5 leading-normal">
                            Here are four major capabilities designed directly into your new Sparkle experience.
                          </p>

                          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* WinUI 3 Feature 1 */}
                            <div className="p-3 rounded-[15px] bg-[#fcfcfc]/90 border border-black/[0.08] shadow-xs flex items-start gap-3 hover:bg-white hover:border-black/15 transition-all">
                              <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                                <Tv className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-xs sm:text-[13px] font-semibold text-neutral-900">
                                  Unlimited entertainment
                                </div>
                                <div className="text-[11px] text-neutral-600 mt-0.5 leading-snug">
                                  Truyền hình & phát sóng trực tuyến đa kênh 24/7 với kho đài VTV, HTV, VOV phong phú.
                                </div>
                              </div>
                            </div>

                            {/* WinUI 3 Feature 2 */}
                            <div className="p-3 rounded-[15px] bg-[#fcfcfc]/90 border border-black/[0.08] shadow-xs flex items-start gap-3 hover:bg-white hover:border-black/15 transition-all">
                              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                <Search className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-xs sm:text-[13px] font-semibold text-neutral-900">
                                  Smarter search experience
                                </div>
                                <div className="text-[11px] text-neutral-600 mt-0.5 leading-snug">
                                  Tìm kiếm tức thì, nhận diện giọng nói tiếng Việt và điều hướng phím tắt mượt mà.
                                </div>
                              </div>
                            </div>

                            {/* WinUI 3 Feature 3 */}
                            <div className="p-3 rounded-[15px] bg-[#fcfcfc]/90 border border-black/[0.08] shadow-xs flex items-start gap-3 hover:bg-white hover:border-black/15 transition-all">
                              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                                <Layers className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-xs sm:text-[13px] font-semibold text-neutral-900">
                                  Modern WinUI design system
                                </div>
                                <div className="text-[11px] text-neutral-600 mt-0.5 leading-snug">
                                  Giao diện Fluent chuẩn WinUI 3 với hiệu ứng Mica, Acrylic, Reveal và bo góc hiện đại.
                                </div>
                              </div>
                            </div>

                            {/* WinUI 3 Feature 4 */}
                            <div className="p-3 rounded-[15px] bg-[#fcfcfc]/90 border border-black/[0.08] shadow-xs flex items-start gap-3 hover:bg-white hover:border-black/15 transition-all">
                              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                                <MessageSquare className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-xs sm:text-[13px] font-semibold text-neutral-900">
                                  Developers hear from your speak
                                </div>
                                <div className="text-[11px] text-neutral-600 mt-0.5 leading-snug">
                                  Lắng nghe và đồng hành cùng cộng đồng qua trung tâm phản hồi và cập nhật liên tục.
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-neutral-200">
                          {/* WinUI 3 Secondary Button */}
                          <button
                            type="button"
                            onClick={() => advanceStep(5)}
                            className="h-8 px-5 rounded-[15px] font-normal text-[#1b1b1b] bg-[#fbfbfb] hover:bg-[#f5f5f5] active:bg-[#eaeaea] border border-black/10 border-b-[2px] border-b-black/20 shadow-[0_1px_2px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.8)] active:shadow-none transition-all text-xs sm:text-[13px] flex items-center justify-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0067b8]"
                          >
                            Back
                          </button>
                          {/* WinUI 3 Primary Button */}
                          <button
                            type="button"
                            onClick={startFinalSequence}
                            className="h-8 px-8 rounded-[15px] font-normal text-white bg-[#0067b8] hover:bg-[#1879c7] active:bg-[#005a9e] border border-black/10 border-b-[2px] border-b-black/30 shadow-[0_1px_2px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.16)] active:shadow-none transition-all text-xs sm:text-[13px] flex items-center justify-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0067b8]"
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
                      className="w-4 h-4 rounded-[15px] flex items-center justify-center transition-colors cursor-default bg-neutral-100/80 hover:bg-neutral-200 active:bg-neutral-300 text-neutral-600 hover:text-neutral-900 shrink-0 border-none"
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
                      className="w-4 h-4 rounded-[15px] flex items-center justify-center transition-colors cursor-default bg-neutral-100/80 hover:bg-neutral-200 active:bg-neutral-300 text-neutral-600 hover:text-neutral-900 shrink-0 border-none"
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

      {/* Windows 11 Bottom Right Tray (BÊN NGOÀI window oobe) */}
      <div className="absolute bottom-4 right-6 z-30 flex items-center gap-2 select-none">
        {/* Debug Button (Icon only, NO text title, NO tooltip title) */}
        <button
          type="button"
          onClick={() => setIsDebugPageOpen(true)}
          aria-label="Debug"
          className="w-8 h-8 rounded-[15px] flex items-center justify-center text-neutral-700 bg-white/75 hover:bg-white/95 active:bg-white backdrop-blur-md border border-black/[0.08] shadow-xs transition-colors cursor-pointer"
        >
          <Bug className="h-4 w-4" aria-hidden="true" />
        </button>

        {/* Volume Button (Icon only) */}
        <button
          type="button"
          onClick={() => setIsMuted(!isMuted)}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
          className="w-8 h-8 rounded-[15px] flex items-center justify-center text-neutral-700 bg-white/75 hover:bg-white/95 active:bg-white backdrop-blur-md border border-black/[0.08] shadow-xs transition-colors cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Accessibility Button */}
        <button
          type="button"
          aria-label="Accessibility"
          className="w-8 h-8 rounded-[15px] flex items-center justify-center text-neutral-700 bg-white/75 hover:bg-white/95 active:bg-white backdrop-blur-md border border-black/[0.08] shadow-xs transition-colors cursor-pointer"
        >
          <Accessibility className="w-4 h-4" />
        </button>

        {/* Clock Time */}
        <div className="h-8 px-2.5 rounded-[15px] flex items-center justify-center text-neutral-700 text-xs font-normal bg-white/75 backdrop-blur-md border border-black/[0.08] shadow-xs cursor-default">
          <span className="tracking-wide">{timeString}</span>
        </div>
      </div>

      {/* Embedded Sparkle Recovery Modal */}
      <SparkleRecoveryModal
        isOpen={isRecoveryModalOpen}
        onClose={() => setIsRecoveryModalOpen(false)}
        navigate={navigate}
      />
    </div>
  );
};

export default SparkleOOBE;
