import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  MoreHorizontal,
  Settings as SettingsIcon,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  RotateCw,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  User,
  X,
  Check,
  ExternalLink,
  Bell,
  Info,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Tv,
  SlidersHorizontal,
  Trash2,
  ArrowUpToLine,
  MapPin,
  Droplets,
  Wind,
  Sun,
  Calendar,
} from 'lucide-react';
import { useSettings, getTaskbarHeightPx } from '../hooks/useSettings';
import { NEWS_DATA } from '../data/news';
import { Channel } from '../types';
import { galleryDB, GalleryMediaItem } from '../services/galleryStorage';
import { showAppToast } from '../utils/toast';
import {
  Fluent3DCraftmineIcon,
  Fluent3DDrawsIcon,
  Fluent3DPhotopeaIcon,
  Fluent3DHtmlWriterIcon,
  Fluent3DScreenbugIcon,
  Fluent3DCameraIcon,
  Fluent3DNotesIcon,
  Fluent3DGalleryIcon,
  Fluent3DWatchPreviewIcon,
} from './Fluent3DIcons';
import { contextMenuMotionProps, flyoutPanelClassName, flyoutPanelStyle } from './FlyoutDropdown';
import { modalDialogVariants, modalBackdropVariants } from '../utils/animations';

export type WidgetId =
  | 'weather'
  | 'photos'
  | 'markets'
  | 'tips'
  | 'games'
  | 'phone-link'
  | 'daily-wonder'
  | 'daily-discovery'
  | 'countdown'
  | 'timer'
  | 'focus-session'
  | 'watchlist'
  | 'sports'
  | 'events'
  | 'todays-moment';

export interface CityWeather {
  id: string;
  city: string;
  temp: number;
  condition: 'cloudy' | 'sunny' | 'rain';
  conditionLabel: string;
  summary: string;
  aqi: string;
  humidity: number;
  wind: string;
  hourly: Array<{ time: string; temp: number; rain: number }>;
  daily: Array<{ day: string; icon: 'rain' | 'partly' | 'sunny'; high: number; low: number; rain: number }>;
}

export const CITY_WEATHER_DATA: CityWeather[] = [
  {
    id: 'son-duong',
    city: 'Sơn Dương',
    temp: 17,
    condition: 'cloudy',
    conditionLabel: 'Cloudy',
    summary: 'Expect 3 rainy days ahead starting Tomorrow.',
    aqi: 'Moderate air quality',
    humidity: 78,
    wind: '11 km/h NE',
    hourly: [
      { time: '12 AM', temp: 16, rain: 28 },
      { time: '1 AM', temp: 16, rain: 34 },
      { time: '2 AM', temp: 16, rain: 34 },
      { time: '3 AM', temp: 16, rain: 63 },
      { time: '4 AM', temp: 16, rain: 63 },
    ],
    daily: [
      { day: 'Fri', icon: 'rain', high: 19, low: 14, rain: 54 },
      { day: 'Sat', icon: 'partly', high: 21, low: 14, rain: 3 },
      { day: 'Sun', icon: 'sunny', high: 23, low: 17, rain: 1 },
      { day: 'Mon', icon: 'partly', high: 24, low: 17, rain: 13 },
      { day: 'Tue', icon: 'rain', high: 20, low: 16, rain: 41 },
    ],
  },
  {
    id: 'hanoi',
    city: 'Hà Nội',
    temp: 21,
    condition: 'cloudy',
    conditionLabel: 'Cloudy',
    summary: 'Cool breeze tonight with scattered light clouds.',
    aqi: 'Moderate air quality',
    humidity: 72,
    wind: '14 km/h E',
    hourly: [
      { time: '12 AM', temp: 20, rain: 15 },
      { time: '1 AM', temp: 20, rain: 18 },
      { time: '2 AM', temp: 19, rain: 20 },
      { time: '3 AM', temp: 19, rain: 22 },
      { time: '4 AM', temp: 19, rain: 25 },
    ],
    daily: [
      { day: 'Fri', icon: 'partly', high: 23, low: 18, rain: 18 },
      { day: 'Sat', icon: 'sunny', high: 25, low: 18, rain: 5 },
      { day: 'Sun', icon: 'sunny', high: 26, low: 19, rain: 4 },
      { day: 'Mon', icon: 'partly', high: 24, low: 19, rain: 20 },
      { day: 'Tue', icon: 'rain', high: 22, low: 17, rain: 55 },
    ],
  },
  {
    id: 'hcmc',
    city: 'TP. Hồ Chí Minh',
    temp: 32,
    condition: 'sunny',
    conditionLabel: 'Sunny',
    summary: 'Warm and mostly sunny throughout the afternoon.',
    aqi: 'Good air quality',
    humidity: 58,
    wind: '12 km/h SE',
    hourly: [
      { time: '12 AM', temp: 27, rain: 8 },
      { time: '1 AM', temp: 27, rain: 6 },
      { time: '2 AM', temp: 26, rain: 5 },
      { time: '3 AM', temp: 26, rain: 5 },
      { time: '4 AM', temp: 25, rain: 7 },
    ],
    daily: [
      { day: 'Fri', icon: 'sunny', high: 33, low: 25, rain: 10 },
      { day: 'Sat', icon: 'sunny', high: 34, low: 25, rain: 12 },
      { day: 'Sun', icon: 'partly', high: 32, low: 24, rain: 24 },
      { day: 'Mon', icon: 'rain', high: 31, low: 24, rain: 52 },
      { day: 'Tue', icon: 'partly', high: 32, low: 25, rain: 18 },
    ],
  },
  {
    id: 'danang',
    city: 'Đà Nẵng',
    temp: 25,
    condition: 'rain',
    conditionLabel: 'Light rain',
    summary: 'Coastal showers tapering off by early morning.',
    aqi: 'Good air quality',
    humidity: 81,
    wind: '19 km/h NE',
    hourly: [
      { time: '12 AM', temp: 24, rain: 62 },
      { time: '1 AM', temp: 24, rain: 58 },
      { time: '2 AM', temp: 23, rain: 45 },
      { time: '3 AM', temp: 23, rain: 36 },
      { time: '4 AM', temp: 23, rain: 30 },
    ],
    daily: [
      { day: 'Fri', icon: 'rain', high: 26, low: 22, rain: 65 },
      { day: 'Sat', icon: 'partly', high: 27, low: 22, rain: 28 },
      { day: 'Sun', icon: 'sunny', high: 29, low: 23, rain: 10 },
      { day: 'Mon', icon: 'sunny', high: 29, low: 23, rain: 8 },
      { day: 'Tue', icon: 'partly', high: 28, low: 22, rain: 22 },
    ],
  },
];

export interface WidgetsPreferences {
  enabledWidgets: WidgetId[];
  discoverEnabled: boolean;
  openOnHover: boolean;
  selectedCityId: string;
  newLookDiscover: boolean;
  notificationsEnabled: {
    weatherAlerts: boolean;
    breakingNews: boolean;
    sportsScores: boolean;
  };
}

export const WIDGETS_STORAGE_KEY = 'sparkle_widgets_board_v1';

export const DEFAULT_WIDGETS_PREFS: WidgetsPreferences = {
  enabledWidgets: [
    'weather',
    'photos',
    'markets',
    'tips',
    'games',
    'phone-link',
    'daily-wonder',
    'daily-discovery',
  ],
  discoverEnabled: true,
  openOnHover: false,
  selectedCityId: 'son-duong',
  newLookDiscover: false,
  notificationsEnabled: {
    weatherAlerts: true,
    breakingNews: true,
    sportsScores: false,
  },
};

export function loadWidgetsPrefs(): WidgetsPreferences {
  try {
    const raw = localStorage.getItem(WIDGETS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_WIDGETS_PREFS,
        ...parsed,
        enabledWidgets: Array.isArray(parsed.enabledWidgets)
          ? parsed.enabledWidgets
          : DEFAULT_WIDGETS_PREFS.enabledWidgets,
        notificationsEnabled: {
          ...DEFAULT_WIDGETS_PREFS.notificationsEnabled,
          ...(parsed.notificationsEnabled || {}),
        },
      };
    }
  } catch {}
  return DEFAULT_WIDGETS_PREFS;
}

export function saveWidgetsPrefs(prefs: WidgetsPreferences) {
  try {
    localStorage.setItem(WIDGETS_STORAGE_KEY, JSON.stringify(prefs));
    window.dispatchEvent(new CustomEvent('sparkle:widgets-prefs-changed', { detail: prefs }));
  } catch {}
}

interface WidgetCatalogEntry {
  id: WidgetId;
  title: string;
  description: string;
  accentColor: string;
}

const WIDGET_CATALOG: WidgetCatalogEntry[] = [
  { id: 'games', title: 'Casual Games', description: 'Quick-launch mini games & Sparkle Play apps.', accentColor: '#8b5cf6' },
  { id: 'countdown', title: 'Countdown', description: 'Track days remaining until your important milestones.', accentColor: '#0078d4' },
  { id: 'daily-discovery', title: 'Daily Discovery', description: 'Daily trivia, fun facts, and interactive quizzes.', accentColor: '#0ea5e9' },
  { id: 'daily-wonder', title: 'Daily Wonder', description: 'Curated scenic clips & live TV highlights.', accentColor: '#6366f1' },
  { id: 'events', title: 'Events Near You', description: 'Upcoming broadcast premieres & community events.', accentColor: '#f97316' },
  { id: 'focus-session', title: 'Focus session', description: 'Stay in flow with a built-in Pomodoro focus timer.', accentColor: '#10b981' },
  { id: 'phone-link', title: 'Phone Link', description: 'Use your mobile device notifications and calls from PC.', accentColor: '#0284c7' },
  { id: 'photos', title: 'Photos', description: 'Surface highlights from your Sparkle Gallery.', accentColor: '#0078d4' },
  { id: 'sports', title: 'Sports', description: 'Follow live scores and tournament standings.', accentColor: '#ec4899' },
  { id: 'timer', title: 'Timer', description: 'Quick preset countdown timers right on your board.', accentColor: '#0078d4' },
  { id: 'tips', title: 'Tips', description: 'Discover keyboard shortcuts and Sparkle tips.', accentColor: '#f59e0b' },
  { id: 'todays-moment', title: "Today's Moment", description: 'Daily inspiration and calm reflection.', accentColor: '#a855f7' },
  { id: 'watchlist', title: 'Watchlist', description: 'Monitor global indices, VN-Index, gold, and crypto.', accentColor: '#16a34a' },
  { id: 'weather', title: 'Weather', description: 'Hourly & 5-day forecast for your selected city.', accentColor: '#f59e0b' },
  { id: 'markets', title: 'Markets', description: 'At-a-glance S&P 500, DOW, and NASDAQ quotes.', accentColor: '#16a34a' },
];

// Crisp WinUI 3 / Fluent 3D Weather SVGs (marked fluent-3d-icon to preserve full gradients in light mode)
export const FluentWeatherIcon: React.FC<{
  type: 'cloudy' | 'sunny' | 'rain' | 'partly';
  className?: string;
}> = ({ type, className = 'w-11 h-11' }) => {
  if (type === 'sunny') {
    return (
      <svg className={`${className} fluent-3d-icon shrink-0`} viewBox="0 0 48 48" fill="none">
        <defs>
          <radialGradient id="w_sun_core" cx="38%" cy="32%" r="65%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="55%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#EA580C" />
          </radialGradient>
        </defs>
        <circle cx="24" cy="24" r="15" fill="url(#w_sun_core)" />
      </svg>
    );
  }
  if (type === 'rain') {
    return (
      <svg className={`${className} fluent-3d-icon shrink-0`} viewBox="0 0 48 48" fill="none">
        <defs>
          <linearGradient id="w_rain_cloud" x1="0" y1="8" x2="0" y2="34" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>
          <radialGradient id="w_rain_sun" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#F59E0B" />
          </radialGradient>
        </defs>
        <circle cx="31" cy="15" r="8" fill="url(#w_rain_sun)" />
        <path
          d="M15 33h19.5a7.5 7.5 0 0 0 1.4-14.87A10.5 10.5 0 0 0 15.6 16.5a8.5 8.5 0 0 0-.6 16.5Z"
          fill="url(#w_rain_cloud)"
        />
        <path d="M18 37l-2 5M25 37l-2 5M32 37l-2 5" stroke="#38BDF8" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === 'partly') {
    return (
      <svg className={`${className} fluent-3d-icon shrink-0`} viewBox="0 0 48 48" fill="none">
        <defs>
          <radialGradient id="w_partly_sun" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#F59E0B" />
          </radialGradient>
          <linearGradient id="w_partly_cloud" x1="12" y1="16" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>
        </defs>
        <circle cx="30" cy="17" r="9.5" fill="url(#w_partly_sun)" />
        <path
          d="M14 35h19a7.5 7.5 0 0 0 1.3-14.88A10 10 0 0 0 15.1 19a8 8 0 0 0-1.1 16Z"
          fill="url(#w_partly_cloud)"
        />
      </svg>
    );
  }
  // cloudy
  return (
    <svg className={`${className} fluent-3d-icon shrink-0`} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="w_cloud_back" x1="12" y1="10" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F1F5F9" />
          <stop offset="60%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#94A3B8" />
        </linearGradient>
        <linearGradient id="w_cloud_front" x1="10" y1="18" x2="38" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#BFD0E5" />
        </linearGradient>
      </defs>
      <path
        d="M15 34h20a8 8 0 0 0 1.4-15.87A11 11 0 0 0 15.5 16.4 9 9 0 0 0 15 34Z"
        fill="url(#w_cloud_back)"
      />
      <path
        d="M12 36h21a7 7 0 0 0 1.2-13.9A9.5 9.5 0 0 0 16 20.5a7.8 7.8 0 0 0-4 15.5Z"
        fill="url(#w_cloud_front)"
      />
    </svg>
  );
};

// MSN / Microsoft Start Butterfly Icon
const DiscoverButterflyIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={`${className} fluent-3d-icon shrink-0`} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="msn_tl" x1="2" y1="3" x2="12" y2="12" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="100%" stopColor="#0284C7" />
      </linearGradient>
      <linearGradient id="msn_tr" x1="12" y1="3" x2="22" y2="12" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#4ADE80" />
        <stop offset="100%" stopColor="#16A34A" />
      </linearGradient>
      <linearGradient id="msn_bl" x1="2" y1="12" x2="12" y2="21" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#F43F5E" />
        <stop offset="100%" stopColor="#E11D48" />
      </linearGradient>
      <linearGradient id="msn_br" x1="12" y1="12" x2="22" y2="21" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FACC15" />
        <stop offset="100%" stopColor="#EA580C" />
      </linearGradient>
    </defs>
    <path d="M3 5.5C3 4.1 4.4 3.2 5.7 3.8L11.5 6.8V12.5L4.4 9.5C3.5 9.1 3 8.2 3 7.2V5.5Z" fill="url(#msn_tl)" />
    <path d="M21 5.5C21 4.1 19.6 3.2 18.3 3.8L12.5 6.8V12.5L19.6 9.5C20.5 9.1 21 8.2 21 7.2V5.5Z" fill="url(#msn_tr)" />
    <path d="M4.2 12.6L11.5 14.1V19.6L5.5 17.8C4.6 17.5 4 16.7 4 15.7V12.8C4 12.7 4.1 12.6 4.2 12.6Z" fill="url(#msn_bl)" />
    <path d="M19.8 12.6L12.5 14.1V19.6L18.5 17.8C19.4 17.5 20 16.7 20 15.7V12.8C20 12.7 19.9 12.6 19.8 12.6Z" fill="url(#msn_br)" />
  </svg>
);

const WidgetsNavIcon: React.FC<{ active?: boolean; className?: string }> = ({ active, className = 'w-5 h-5' }) => (
  <svg className={`${className} fluent-3d-icon shrink-0`} viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="win_wid_1" x1="3" y1="3" x2="11" y2="11" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#60A5FA" />
        <stop offset="100%" stopColor="#0078D4" />
      </linearGradient>
      <linearGradient id="win_wid_2" x1="13" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="100%" stopColor="#0284C7" />
      </linearGradient>
    </defs>
    <rect x="3" y="3" width="8.5" height="8.5" rx="2" fill={active ? 'url(#win_wid_1)' : '#64748B'} fillOpacity={active ? 1 : 0.72} />
    <rect x="12.8" y="3" width="8.2" height="12.5" rx="2" fill={active ? 'url(#win_wid_2)' : '#94A3B8'} fillOpacity={active ? 1 : 0.65} />
    <rect x="3" y="13" width="8.5" height="8" rx="2" fill={active ? '#0284C7' : '#64748B'} fillOpacity={active ? 0.9 : 0.55} />
    <rect x="12.8" y="17" width="8.2" height="4" rx="1.5" fill={active ? '#38BDF8' : '#94A3B8'} fillOpacity={active ? 0.85 : 0.55} />
  </svg>
);

// WinUI 3 Countdown Ring Preview & Card Component
const CountdownRing: React.FC<{ daysLeft: number; totalDays?: number; size?: number }> = ({
  daysLeft,
  totalDays = 2000,
  size = 152,
}) => {
  const segments = 32;
  const activeCount = Math.max(2, Math.min(segments, Math.round(((totalDays - daysLeft) / totalDays) * segments) + 5));
  const cx = size / 2;
  const cy = size / 2;
  const rInner = size * 0.34;
  const rOuter = size * 0.44;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="w-full h-full fluent-3d-icon" viewBox={`0 0 ${size} ${size}`}>
        {Array.from({ length: segments }).map((_, i) => {
          const angle = ((i / segments) * 360 - 90) * (Math.PI / 180);
          const x1 = cx + Math.cos(angle) * rInner;
          const y1 = cy + Math.sin(angle) * rInner;
          const x2 = cx + Math.cos(angle) * rOuter;
          const y2 = cy + Math.sin(angle) * rOuter;
          const isLit = i < activeCount;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={isLit ? '#0078D4' : 'rgba(148,163,184,0.35)'}
              strokeWidth={4.2}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-[17px] font-semibold tabular-nums tracking-tight">{daysLeft} days</span>
      </div>
    </div>
  );
};

// Reusable WinUI 3 Toggle Switch
const WinUIToggle: React.FC<{
  checked: boolean;
  onChange: () => void;
  ariaLabel: string;
}> = ({ checked, onChange, ariaLabel }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={ariaLabel}
    onClick={onChange}
    className={`relative inline-flex items-center w-[42px] h-[22px] rounded-full transition-colors cursor-pointer shrink-0 border ${
      checked
        ? 'bg-[#0067c0] dark:bg-[#4cc2ff] border-transparent'
        : 'bg-black/[0.06] dark:bg-white/[0.08] border-black/30 dark:border-white/35'
    }`}
  >
    <span
      className={`inline-block w-[14px] h-[14px] rounded-full transition-transform ${
        checked
          ? 'translate-x-[23px] bg-white dark:bg-[#111827]'
          : 'translate-x-[3px] bg-black/60 dark:bg-white/75'
      }`}
    />
  </button>
);

interface WindowsWidgetsBoardProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchRoute: (route: string, state?: any) => void;
  channels: Channel[];
  onSelectChannel: (channel: Channel) => void;
}

export const WindowsWidgetsBoard: React.FC<WindowsWidgetsBoardProps> = ({
  isOpen,
  onClose,
  onLaunchRoute,
  channels,
  onSelectChannel,
}) => {
  const { settings } = useSettings();
  const isLightMode = settings.theme === 'light';
  const taskbarHeight = getTaskbarHeightPx(settings.taskbarScale);

  const [prefs, setPrefs] = useState<WidgetsPreferences>(() => loadWidgetsPrefs());
  const [activeNav, setActiveNav] = useState<'widgets' | 'discover' | 'settings'>('widgets');
  const [discoverSubTab, setDiscoverSubTab] = useState<'discover' | 'watch' | 'play'>('discover');

  // Add Widget Modal state (Screenshot 3)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCatalogId, setSelectedCatalogId] = useState<WidgetId>('countdown');

  // Interactive widget states
  const [openMenuWidget, setOpenMenuWidget] = useState<WidgetId | null>(null);
  const [isCityPickerOpen, setIsCityPickerOpen] = useState(false);
  const [showFullForecast, setShowFullForecast] = useState(false);
  const [showExpandedMarkets, setShowExpandedMarkets] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [gamesPage, setGamesPage] = useState<0 | 1>(0);
  const [quizExpanded, setQuizExpanded] = useState(false);
  const [quizChoice, setQuizChoice] = useState<number | null>(null);
  const [countdownEventIdx, setCountdownEventIdx] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(300);
  const [timerRunning, setTimerRunning] = useState(false);
  const [focusSeconds, setFocusSeconds] = useState(1500);
  const [focusRunning, setFocusRunning] = useState(false);

  // Discover state
  const [heroSlideIdx, setHeroSlideIdx] = useState(0);
  const [isRefreshingFeed, setIsRefreshingFeed] = useState(false);
  const [likedArticles, setLikedArticles] = useState<Record<string, boolean>>({});
  const [sportsLeague, setSportsLeague] = useState<'PGA' | 'Premier League' | 'V-League'>('PGA');
  const [isSportsDropdownOpen, setIsSportsDropdownOpen] = useState(false);
  const [extraArticlesShown, setExtraArticlesShown] = useState(false);

  // Settings accordion state (Screenshot 4)
  const [aboutExpanded, setAboutExpanded] = useState(true);
  const [notificationsExpanded, setNotificationsExpanded] = useState(false);

  // Gallery photos for Photos widget
  const [galleryPhotos, setGalleryPhotos] = useState<GalleryMediaItem[]>([]);
  const [photoIdx, setPhotoIdx] = useState(0);

  const boardRef = useRef<HTMLDivElement>(null);

  const updatePrefs = (updater: (prev: WidgetsPreferences) => WidgetsPreferences) => {
    setPrefs((prev) => {
      const next = updater(prev);
      saveWidgetsPrefs(next);
      return next;
    });
  };

  // Keep Discover nav disabled cleanly if toggled off in Settings
  useEffect(() => {
    if (!prefs.discoverEnabled && activeNav === 'discover') {
      setActiveNav('widgets');
    }
  }, [prefs.discoverEnabled, activeNav]);

  // Load real photos from Gallery IndexedDB when board opens
  useEffect(() => {
    if (!isOpen) return;
    galleryDB
      .getAll()
      .then((items) => {
        setGalleryPhotos(items.filter((i) => i.type === 'image'));
      })
      .catch(() => {});
  }, [isOpen]);

  // Timer & Focus session ticks
  useEffect(() => {
    if (!timerRunning) return;
    const t = setInterval(() => {
      setTimerSeconds((s) => {
        if (s <= 1) {
          setTimerRunning(false);
          showAppToast('Timer completed!', 'success');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [timerRunning]);

  useEffect(() => {
    if (!focusRunning) return;
    const t = setInterval(() => {
      setFocusSeconds((s) => {
        if (s <= 1) {
          setFocusRunning(false);
          showAppToast('Focus session complete — take a break!', 'success');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [focusRunning]);

  // Outside click & Escape handling
  useEffect(() => {
    if (!isOpen) return;
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('#btn-taskbar-weather')) return;
      if (boardRef.current && !boardRef.current.contains(target)) {
        if (isAddModalOpen) {
          setIsAddModalOpen(false);
        } else {
          onClose();
        }
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isAddModalOpen) {
          setIsAddModalOpen(false);
        } else if (openMenuWidget) {
          setOpenMenuWidget(null);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isAddModalOpen, openMenuWidget, onClose]);

  const activeWeather = useMemo(
    () => CITY_WEATHER_DATA.find((c) => c.id === prefs.selectedCityId) || CITY_WEATHER_DATA[0],
    [prefs.selectedCityId]
  );

  const greetingText = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }, [isOpen]);

  const formattedDate = useMemo(() => {
    return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  }, []);

  const tipsList = [
    {
      title: 'Use clipboard history',
      body: 'Select Sparkle key + V to view your clipboard history and paste from it.',
    },
    {
      title: 'Quick Direct Command',
      body: 'Press Ctrl + Shift + R or click the terminal icon in the tray to run /vivetool or theme commands.',
    },
    {
      title: 'Pin windows & layouts',
      body: 'Drag taskbar icons to reorder them, or right-click the desktop to switch wallpapers and themes.',
    },
  ];

  const countdownMilestones = [
    { label: 'First day of school', days: 1365, color: '#f59e0b' },
    { label: 'Off work', days: 3, color: '#0ea5e9' },
    { label: 'Lunch', days: 1, color: '#10b981' },
    { label: 'Leave for vacation', days: 42, color: '#22c55e' },
    { label: 'Volunteer event', days: 19, color: '#ef4444' },
  ];

  const heroStories = useMemo(() => {
    const newsStories = NEWS_DATA.slice(0, 4).map((n, idx) => ({
      id: n.id,
      slug: n.slug,
      source: 'Sparkle News',
      time: `${idx + 2}h`,
      title: n.title.replace(/^#\s*/, ''),
      image: n.coverImage || '/banners/thoi_su_19h_hd.webp',
      likes: 423 + idx * 38,
      comments: 45 + idx * 12,
    }));
    return newsStories;
  }, []);

  const secondaryStories = useMemo(() => {
    const rest = NEWS_DATA.slice(1, extraArticlesShown ? 7 : 5).map((n, idx) => ({
      id: n.id,
      slug: n.slug,
      source: n.category || 'Sparkle Feed',
      time: `${idx + 3}d`,
      title: n.title.replace(/^#\s*/, ''),
      image: n.coverImage || '/banners/vietnam_today.jpg',
    }));
    return rest;
  }, [extraArticlesShown]);

  const sportsFeed = useMemo(() => {
    if (sportsLeague === 'Premier League') {
      return [
        { badge: 'Live · 68\'', title: 'Arsenal 2 - 1 Chelsea', sub: 'Emirates Stadium, London', stat: 'MD 12' },
        { badge: 'Nov 18 · Final', title: 'Liverpool 3 - 0 Aston Villa', sub: 'Anfield', stat: 'FT' },
        { badge: 'Nov 17 · Final', title: 'Man City 2 - 2 Tottenham', sub: 'Etihad Stadium', stat: 'FT' },
        { badge: 'Nov 16 · Final', title: 'Newcastle 1 - 0 Man Utd', sub: 'St James\' Park', stat: 'FT' },
      ];
    }
    if (sportsLeague === 'V-League') {
      return [
        { badge: 'Live · 74\'', title: 'Hà Nội FC 2 - 1 Thể Công Viettel', sub: 'Sân Hàng Đẫy, Hà Nội', stat: 'V8' },
        { badge: 'Nov 18 · Final', title: 'Thép Xanh Nam Định 3 - 1 CAHN', sub: 'Sân Thiên Trường', stat: 'FT' },
        { badge: 'Nov 17 · Final', title: 'Bình Dương 1 - 1 HAGL', sub: 'Sân Gò Đậu', stat: 'FT' },
        { badge: 'Nov 15 · Final', title: 'Hải Phòng 2 - 0 Thanh Hóa', sub: 'Sân Lạch Tray', stat: 'FT' },
      ];
    }
    return [
      { badge: 'Live · R1', title: 'The RSM Classic', sub: 'Sea Island, GA, USA', stat: 'Live' },
      { badge: 'Nov 12 - 17 · Final', title: 'Austin Championship presented...', sub: 'Winner: C. Ramey', stat: '-20' },
      { badge: 'Nov 5 - 9 · Final', title: 'World Wide Technology Champio...', sub: 'Winner: B. Brown', stat: '-23' },
      { badge: 'Oct 29 - Nov 2 · Final', title: 'VidantaWorld Mexico Open', sub: 'Winner: A. Novak', stat: '-25' },
    ];
  }, [sportsLeague]);

  const removeWidget = (id: WidgetId) => {
    updatePrefs((p) => ({
      ...p,
      enabledWidgets: p.enabledWidgets.filter((w) => w !== id),
    }));
    setOpenMenuWidget(null);
    showAppToast('Widget removed from board', 'info');
  };

  const pinWidgetToTop = (id: WidgetId) => {
    updatePrefs((p) => ({
      ...p,
      enabledWidgets: [id, ...p.enabledWidgets.filter((w) => w !== id)],
    }));
    setOpenMenuWidget(null);
    showAppToast('Pinned to top of Widgets', 'success');
  };

  const addWidget = (id: WidgetId) => {
    updatePrefs((p) => {
      if (p.enabledWidgets.includes(id)) return p;
      return { ...p, enabledWidgets: [...p.enabledWidgets, id] };
    });
    const entry = WIDGET_CATALOG.find((c) => c.id === id);
    showAppToast(`Added ${entry?.title || id} widget`, 'success');
    setIsAddModalOpen(false);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const cardSurfaceClass =
    'rounded-[10px] border border-black/[0.06] dark:border-white/[0.08] bg-white/75 dark:bg-[#2b2f36]/80 backdrop-blur-md transition-colors';

  const linkTextStyle: React.CSSProperties = {
    color: isLightMode ? '#0067c0' : '#4cc2ff',
  };

  const mutedTextStyle: React.CSSProperties = {
    color: isLightMode ? 'rgba(17, 24, 39, 0.65)' : 'rgba(255, 255, 255, 0.68)',
  };

  const shouldAnimateModal = !settings.reduceAllMotion && settings.animateModals;

  const renderWidgetMenu = (id: WidgetId, isPreview = false) => {
    if (isPreview) {
      return (
        <span className="w-7 h-7 rounded-[6px] flex items-center justify-center opacity-70 pointer-events-none shrink-0">
          <MoreHorizontal className="w-4 h-4" />
        </span>
      );
    }

    return (
      <div className="relative shrink-0" onMouseDown={(e) => e.stopPropagation()}>
        <button
          type="button"
          aria-label="Widget options"
          onClick={(e) => {
            e.stopPropagation();
            setOpenMenuWidget((prev) => (prev === id ? null : id));
          }}
          className="w-7 h-7 rounded-[6px] flex items-center justify-center hover:bg-black/[0.06] dark:hover:bg-white/[0.09] transition-colors cursor-pointer border-none bg-transparent"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
        <AnimatePresence>
          {openMenuWidget === id && (
            <div
              style={{ overflow: 'clip' }}
              className="fluent-context-menu-wrapper absolute right-0 top-8 z-40 pointer-events-auto"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <motion.div {...contextMenuMotionProps}>
                <div
                  role="menu"
                  style={flyoutPanelStyle}
                  className={`w-[176px] ${flyoutPanelClassName} fluent-context-menu shadow-none`}
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => pinWidgetToTop(id)}
                    className="w-full h-8 px-2.5 rounded-[5px] flex items-center gap-2 text-[12px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer text-left border-none bg-transparent"
                  >
                    <ArrowUpToLine className="w-3.5 h-3.5" />
                    <span>Move to top</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpenMenuWidget(null);
                      showAppToast('Widget refreshed', 'info');
                    }}
                    className="w-full h-8 px-2.5 rounded-[5px] flex items-center gap-2 text-[12px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer text-left border-none bg-transparent"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Refresh</span>
                  </button>
                  <div className="h-[1px] my-1 bg-black/10 dark:bg-white/10" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => removeWidget(id)}
                    className="w-full h-8 px-2.5 rounded-[5px] flex items-center gap-2 text-[12px] hover:bg-rose-500/10 cursor-pointer text-left border-none bg-transparent"
                    style={{ color: isLightMode ? '#c42b1c' : '#ff99a4' }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove widget</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderWidgetCard = (id: WidgetId, isPreview = false) => {
    switch (id) {
      case 'weather':
        return (
          <div key="weather" className={`${cardSurfaceClass} p-4 flex flex-col justify-between ${isPreview ? '' : 'md:row-span-2'}`}>
            <div>
              {/* City Header */}
              <div className="flex items-center justify-between gap-2 mb-3 relative">
                <button
                  type="button"
                  onClick={() => !isPreview && setIsCityPickerOpen((v) => !v)}
                  className="flex items-center gap-1.5 text-[13px] font-medium hover:bg-black/[0.05] dark:hover:bg-white/[0.08] px-2 py-1 -ml-2 rounded-[6px] transition-colors cursor-pointer border-none bg-transparent"
                >
                  <span className="w-4 h-4 rounded-full bg-amber-400/20 flex items-center justify-center">
                    <MapPin className="w-3 h-3" style={{ color: '#f59e0b' }} />
                  </span>
                  <span>{activeWeather.city}</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                </button>
                {renderWidgetMenu('weather', isPreview)}

                <AnimatePresence>
                  {isCityPickerOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute left-0 top-8 w-[190px] rounded-[8px] border border-black/10 dark:border-white/12 bg-white/95 dark:bg-[#25282e]/95 backdrop-blur-2xl p-1 shadow-xl z-40"
                    >
                      {CITY_WEATHER_DATA.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            updatePrefs((p) => ({ ...p, selectedCityId: c.id }));
                            setIsCityPickerOpen(false);
                          }}
                          className="w-full h-8 px-2.5 rounded-[5px] flex items-center justify-between text-[12px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer border-none bg-transparent"
                        >
                          <span>{c.city}</span>
                          <span className="tabular-nums font-medium">{c.temp}°C</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Current Temp + Summary */}
              <div className="flex items-center gap-3.5 mb-5">
                <FluentWeatherIcon type={activeWeather.condition} className="w-12 h-12" />
                <div className="flex items-start leading-none">
                  <span className="text-[36px] font-light tabular-nums tracking-tight">{activeWeather.temp}</span>
                  <span className="text-[13px] font-medium mt-1 ml-0.5">°C</span>
                </div>
                <p className="text-[12px] leading-snug flex-1" style={mutedTextStyle}>
                  {activeWeather.summary}
                </p>
              </div>

              {/* Hourly Strip */}
              <div className="grid grid-cols-5 gap-1 text-center py-2.5 border-y border-black/[0.05] dark:border-white/[0.06]">
                {activeWeather.hourly.map((h) => (
                  <div key={h.time} className="flex flex-col items-center gap-1.5">
                    <span className="text-[11px]" style={mutedTextStyle}>
                      {h.time}
                    </span>
                    <span className="text-[13px] font-semibold tabular-nums">{h.temp}°</span>
                    <span className="inline-flex items-center gap-0.5 text-[11px] tabular-nums" style={mutedTextStyle}>
                      <Droplets className="w-2.5 h-2.5 fluent-3d-icon" style={{ color: '#0284c7' }} />
                      {h.rain}%
                    </span>
                  </div>
                ))}
              </div>

              {/* 5-day Strip */}
              <div className="grid grid-cols-5 gap-1 text-center pt-3 pb-2">
                {activeWeather.daily.map((d) => (
                  <div key={d.day} className="flex flex-col items-center gap-1.5">
                    <span className="text-[11.5px] font-medium">{d.day}</span>
                    <FluentWeatherIcon type={d.icon} className="w-7 h-7" />
                    <div className="flex flex-col leading-tight tabular-nums">
                      <span className="text-[12px] font-semibold">{d.high}°</span>
                      <span className="text-[11px]" style={mutedTextStyle}>
                        {d.low}°
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-0.5 text-[10.5px] tabular-nums" style={mutedTextStyle}>
                      <Droplets className="w-2.5 h-2.5 fluent-3d-icon" style={{ color: '#0284c7' }} />
                      {d.rain}%
                    </span>
                  </div>
                ))}
              </div>

              {/* Expandable Extra Forecast Details */}
              <AnimatePresence>
                {showFullForecast && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 p-2.5 rounded-[8px] bg-black/[0.04] dark:bg-white/[0.05] text-[11.5px] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5" style={mutedTextStyle}>
                          <Wind className="w-3.5 h-3.5" /> Wind
                        </span>
                        <span className="font-medium tabular-nums">{activeWeather.wind}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5" style={mutedTextStyle}>
                          <Droplets className="w-3.5 h-3.5" /> Humidity
                        </span>
                        <span className="font-medium tabular-nums">{activeWeather.humidity}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5" style={mutedTextStyle}>
                          <Sun className="w-3.5 h-3.5" /> Air quality
                        </span>
                        <span className="font-medium">{activeWeather.aqi}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              type="button"
              onClick={() => setShowFullForecast((v) => !v)}
              className="mt-2 pt-2 text-[12px] font-medium hover:underline cursor-pointer border-none bg-transparent text-center w-full"
              style={linkTextStyle}
            >
              {showFullForecast ? 'Hide full forecast' : 'See full forecast'}
            </button>
          </div>
        );

      case 'photos': {
        const currentPhoto = galleryPhotos[photoIdx % Math.max(1, galleryPhotos.length)];
        const imgSrc =
          currentPhoto?.thumbnailUrl ||
          currentPhoto?.url ||
          '/assets/aistudio/pink-nature-landscape-with-vegetation-flora_8a81cb83.jpg';
        return (
          <div key="photos" className={`${cardSurfaceClass} overflow-hidden relative min-h-[240px] flex flex-col justify-between group`}>
            <img
              src={imgSrc}
              alt={currentPhoto?.title || 'Gallery photo highlight'}
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/70 pointer-events-none" />
            <div className="relative z-10 p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Fluent3DGalleryIcon className="w-4.5 h-4.5" />
                <span className="text-[12.5px] font-medium" style={{ color: '#ffffff' }}>
                  Photos
                </span>
              </div>
              <div className="flex items-center gap-1">
                {galleryPhotos.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setPhotoIdx((i) => (i + 1) % galleryPhotos.length)}
                    className="h-6 px-2 rounded-[5px] bg-white/15 hover:bg-white/25 text-[11px] cursor-pointer border-none"
                    style={{ color: '#ffffff' }}
                  >
                    Next
                  </button>
                )}
                {renderWidgetMenu('photos', isPreview)}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onLaunchRoute('/gallery');
                onClose();
              }}
              className="relative z-10 p-4 text-center cursor-pointer border-none bg-transparent w-full"
            >
              <p className="text-[13px] font-medium leading-snug" style={{ color: '#ffffff' }}>
                {currentPhoto
                  ? currentPhoto.title
                  : 'Open Sparkle Gallery to browse your saved photos and memories.'}
              </p>
              <span className="inline-block mt-1.5 text-[11.5px] underline" style={{ color: '#93c5fd' }}>
                Open Gallery
              </span>
            </button>
          </div>
        );
      }

      case 'markets':
        return (
          <div key="markets" className={`${cardSurfaceClass} p-4 flex flex-col justify-between`}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 fluent-3d-icon" viewBox="0 0 20 20" fill="none">
                    <path d="M3 14L8 9L11.5 12L17 6" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M13 6H17V10" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-[13px] font-medium">Markets</span>
                </div>
                {renderWidgetMenu('markets', isPreview)}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { name: 'S&P 500', change: '+0.07%', price: '7,329.04', up: true },
                  { name: 'DOW', change: '-1.11%', price: '50,198.17', up: false },
                  { name: 'NASDAQ', change: '-0.18%', price: '24,385.99', up: false },
                ].map((m) => (
                  <div key={m.name} className="space-y-0.5">
                    <div className="text-[12px] font-semibold truncate">{m.name}</div>
                    <div
                      className="text-[12px] font-semibold tabular-nums"
                      style={{ color: m.up ? (isLightMode ? '#15803d' : '#4ade80') : (isLightMode ? '#c42b1c' : '#fb7185') }}
                    >
                      {m.change}
                    </div>
                    <div className="text-[12px] font-medium tabular-nums">{m.price}</div>
                  </div>
                ))}
              </div>

              <AnimatePresence>
                {showExpandedMarkets && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 pt-2.5 border-t border-black/[0.06] dark:border-white/[0.08] space-y-1.5 text-[12px]">
                      {[
                        { name: 'VN-INDEX', change: '+0.84%', price: '1,284.50', up: true },
                        { name: 'GOLD', change: '+0.42%', price: '2,695.10', up: true },
                        { name: 'BTC/USD', change: '+1.65%', price: '92,410.00', up: true },
                      ].map((row) => (
                        <div key={row.name} className="flex items-center justify-between tabular-nums">
                          <span className="font-medium">{row.name}</span>
                          <div className="flex items-center gap-3">
                            <span style={{ color: isLightMode ? '#15803d' : '#4ade80' }}>{row.change}</span>
                            <span className="font-semibold">{row.price}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              type="button"
              onClick={() => setShowExpandedMarkets((v) => !v)}
              className="mt-3 text-[12px] font-medium hover:underline cursor-pointer border-none bg-transparent text-center w-full"
              style={linkTextStyle}
            >
              {showExpandedMarkets ? 'Show less' : 'See more in Markets'}
            </button>
          </div>
        );

      case 'tips': {
        const currentTip = tipsList[tipIndex % tipsList.length];
        return (
          <div key="tips" className={`${cardSurfaceClass} p-4 flex flex-col justify-between`}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 fluent-3d-icon" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M10 2.5a5 5 0 0 0-3.2 8.85c.56.47.95 1.12 1.07 1.85h4.26c.12-.73.51-1.38 1.07-1.85A5 5 0 0 0 10 2.5Z"
                      fill="#FBBF24"
                    />
                    <rect x="7.8" y="14.5" width="4.4" height="2.5" rx="1" fill="#94A3B8" />
                  </svg>
                  <span className="text-[13px] font-medium">Tips</span>
                </div>
                {renderWidgetMenu('tips', isPreview)}
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-11 h-12 rounded-[6px] bg-[#0ea5e9] flex flex-col items-center justify-start pt-1 shrink-0 shadow-xs">
                  <div className="w-5 h-2 rounded-t-[2px] bg-[#fde047] -mt-2 border border-amber-500/40" />
                  <div className="w-6 h-1 rounded-full bg-white/75 mt-2.5" />
                  <div className="w-5 h-1 rounded-full bg-white/55 mt-1" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[13px] font-semibold leading-snug">{currentTip.title}</h4>
                  <p className="text-[12px] mt-1 leading-relaxed" style={mutedTextStyle}>
                    {currentTip.body}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setTipIndex((i) => (i + 1) % tipsList.length)}
              className="mt-3 text-[12px] font-medium hover:underline cursor-pointer border-none bg-transparent text-center w-full"
              style={linkTextStyle}
            >
              More productivity tips
            </button>
          </div>
        );
      }

      case 'games': {
        const pageZeroTiles = [
          { label: 'Craftmine', bg: 'linear-gradient(135deg,#22c55e,#15803d)', route: '/craftmine', icon: <Fluent3DCraftmineIcon className="w-9 h-9" /> },
          { label: 'Ink Canvas', bg: 'linear-gradient(135deg,#06b6d4,#2563eb)', route: '/draws', icon: <Fluent3DDrawsIcon className="w-9 h-9" /> },
          { label: 'Photopea', bg: 'linear-gradient(135deg,#10b981,#0f766e)', route: '/photopea', icon: <Fluent3DPhotopeaIcon className="w-9 h-9" /> },
          { label: 'HTML Writer', bg: 'linear-gradient(135deg,#6366f1,#4338ca)', route: '/html-writer', icon: <Fluent3DHtmlWriterIcon className="w-9 h-9" /> },
          { label: 'Screenbox', bg: 'linear-gradient(135deg,#f97316,#dc2626)', route: '/screenbox', icon: <Fluent3DScreenbugIcon className="w-9 h-9" /> },
          { label: 'Camera', bg: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', route: '/camera', icon: <Fluent3DCameraIcon className="w-9 h-9" /> },
          { label: 'Watch TV', bg: 'linear-gradient(135deg,#ec4899,#be185d)', route: '/live-tv', icon: <Fluent3DWatchPreviewIcon className="w-9 h-9" /> },
          { label: 'Notes', bg: 'linear-gradient(135deg,#0ea5e9,#0369a1)', route: '/notes', icon: <Fluent3DNotesIcon className="w-9 h-9" /> },
          { label: 'Gallery', bg: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', route: '/gallery', icon: <Fluent3DGalleryIcon className="w-9 h-9" /> },
        ];
        const pageOneTiles = [
          { label: 'News Feed', bg: 'linear-gradient(135deg,#14b8a6,#0d9488)', route: '/news', icon: <Tv className="w-7 h-7 fluent-3d-icon" style={{ color: '#fff' }} /> },
          { label: 'Channels', bg: 'linear-gradient(135deg,#f59e0b,#d97706)', route: '/channels', icon: <Sparkles className="w-7 h-7 fluent-3d-icon" style={{ color: '#fff' }} /> },
          { label: 'WinUI 3', bg: 'linear-gradient(135deg,#3b82f6,#1e40af)', route: '/winui-3', icon: <SlidersHorizontal className="w-7 h-7 fluent-3d-icon" style={{ color: '#fff' }} /> },
          ...pageZeroTiles.slice(0, 6),
        ];
        const tiles = gamesPage === 0 ? pageZeroTiles : pageOneTiles;

        return (
          <div key="games" className={`${cardSurfaceClass} p-4 flex flex-col justify-between`}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 fluent-3d-icon" viewBox="0 0 20 20" fill="none">
                    <rect x="3" y="4" width="6" height="12" rx="1.5" fill="#3B82F6" />
                    <rect x="11" y="4" width="6" height="12" rx="1.5" fill="#EC4899" />
                  </svg>
                  <span className="text-[13px] font-medium">Games</span>
                </div>
                {renderWidgetMenu('games', isPreview)}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {tiles.map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => {
                      onLaunchRoute(t.route);
                      onClose();
                    }}
                    title={t.label}
                    style={{ background: t.bg }}
                    className="aspect-square rounded-[8px] flex flex-col items-center justify-center gap-1 p-1.5 hover:scale-[1.03] active:scale-[0.97] transition-transform cursor-pointer border border-black/10 dark:border-white/10 shadow-xs overflow-hidden"
                  >
                    {t.icon}
                    <span className="text-[10px] font-medium truncate w-full text-center" style={{ color: '#ffffff' }}>
                      {t.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {[0, 1].map((p) => (
                  <button
                    key={p}
                    type="button"
                    aria-label={`Games page ${p + 1}`}
                    onClick={() => setGamesPage(p as 0 | 1)}
                    className={`w-1.5 h-1.5 rounded-full cursor-pointer border-none transition-colors ${
                      gamesPage === p ? 'bg-[#0078d4] dark:bg-[#4cc2ff]' : 'bg-black/25 dark:bg-white/25'
                    }`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  onLaunchRoute('/craftmine');
                  onClose();
                }}
                className="text-[12px] font-medium hover:underline cursor-pointer border-none bg-transparent"
                style={linkTextStyle}
              >
                Explore more games
              </button>
            </div>
          </div>
        );
      }

      case 'phone-link':
        return (
          <div key="phone-link" className={`${cardSurfaceClass} p-4 flex flex-col justify-between`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 fluent-3d-icon" viewBox="0 0 20 20" fill="none">
                  <rect x="5" y="2" width="10" height="16" rx="2" fill="#0284C7" />
                  <rect x="6.5" y="4" width="7" height="10.5" rx="1" fill="#BAE6FD" />
                </svg>
                <span className="text-[13px] font-medium">Phone Link</span>
              </div>
              {renderWidgetMenu('phone-link', isPreview)}
            </div>
            <div>
              <h4 className="text-[13px] font-semibold">Use your mobile device from your PC</h4>
              <div className="mt-2.5 space-y-1.5 text-[12px]" style={mutedTextStyle}>
                <div className="flex items-center gap-2">
                  <span>📞</span>
                  <span>Make and take calls</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>💬</span>
                  <span>Sync notifications & messages</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onLaunchRoute('/pc-settings');
                onClose();
              }}
              className="mt-3 text-[12px] font-medium hover:underline cursor-pointer border-none bg-transparent text-left"
              style={linkTextStyle}
            >
              Manage device link
            </button>
          </div>
        );

      case 'daily-wonder':
        return (
          <div key="daily-wonder" className={`${cardSurfaceClass} p-4 flex flex-col justify-between`}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-[4px] bg-[#6366f1] flex items-center justify-center">
                    <Play className="w-2.5 h-2.5 fluent-3d-icon" style={{ color: '#fff', fill: '#fff' }} />
                  </div>
                  <span className="text-[13px] font-medium">Daily Wonder</span>
                </div>
                {renderWidgetMenu('daily-wonder', isPreview)}
              </div>

              <button
                type="button"
                onClick={() => {
                  onLaunchRoute('/live-tv');
                  onClose();
                }}
                className="flex items-center gap-3 text-left cursor-pointer border-none bg-transparent w-full group"
              >
                <img
                  src="/banners/vietnam_today.jpg"
                  alt="Daily Wonder stream"
                  referrerPolicy="no-referrer"
                  className="w-[96px] h-[64px] rounded-[6px] object-cover shrink-0 border border-black/10 dark:border-white/10"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-medium" style={mutedTextStyle}>
                    Sparkle Live TV
                  </div>
                  <div className="text-[12.5px] font-semibold leading-snug line-clamp-2 group-hover:underline">
                    Vietnam&apos;s scenic broadcasts and live cultural programming
                  </div>
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                onLaunchRoute('/live-tv');
                onClose();
              }}
              className="mt-3 text-[12px] font-medium hover:underline cursor-pointer border-none bg-transparent text-center w-full"
              style={linkTextStyle}
            >
              Watch more videos like this
            </button>
          </div>
        );

      case 'daily-discovery':
        return (
          <div key="daily-discovery" className={`${cardSurfaceClass} p-4 flex flex-col justify-between`}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-[4px] bg-[#0ea5e9] flex items-center justify-center text-[10px] font-bold" style={{ color: '#fff' }}>
                    ?
                  </div>
                  <span className="text-[13px] font-medium">Daily Discovery</span>
                </div>
                {renderWidgetMenu('daily-discovery', isPreview)}
              </div>

              <div className="flex items-center gap-3">
                <img
                  src="/banners/chao_buoi_sang_vtv1_2026.webp"
                  alt="Quiz thumbnail"
                  referrerPolicy="no-referrer"
                  className="w-[84px] h-[58px] rounded-[6px] object-cover shrink-0 border border-black/10 dark:border-white/10"
                />
                <p className="text-[12.5px] font-semibold leading-snug">
                  Which Vietnamese national channel broadcasts Thời sự 19h daily?
                </p>
              </div>

              <AnimatePresence>
                {quizExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-2.5 grid grid-cols-3 gap-1.5"
                  >
                    {['VTV1', 'VTV3', 'HTV7'].map((opt, idx) => {
                      const picked = quizChoice === idx;
                      const isCorrect = idx === 0;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setQuizChoice(idx)}
                          className={`h-7 rounded-[5px] text-[11.5px] font-medium border cursor-pointer transition-colors ${
                            picked
                              ? isCorrect
                                ? 'bg-emerald-500/20 border-emerald-500'
                                : 'bg-rose-500/20 border-rose-500'
                              : 'bg-black/[0.04] dark:bg-white/[0.06] border-black/10 dark:border-white/10 hover:bg-black/[0.08]'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              type="button"
              onClick={() => setQuizExpanded((v) => !v)}
              className="mt-3 text-[12px] font-medium hover:underline cursor-pointer border-none bg-transparent text-center w-full"
              style={linkTextStyle}
            >
              {quizExpanded ? 'Hide quiz' : 'Take the quiz'}
            </button>
          </div>
        );

      case 'countdown': {
        const activeMilestone = countdownMilestones[countdownEventIdx % countdownMilestones.length];
        return (
          <div key="countdown" className={`${cardSurfaceClass} p-4 flex flex-col justify-between`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 fluent-3d-icon" style={{ color: '#0078d4' }} />
                <span className="text-[13px] font-medium">Countdown</span>
              </div>
              {renderWidgetMenu('countdown', isPreview)}
            </div>

            <div className="flex flex-col items-center py-1">
              <CountdownRing daysLeft={activeMilestone.days} size={136} />
              <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
                {countdownMilestones.map((m, idx) => (
                  <button
                    key={m.label}
                    type="button"
                    onClick={() => setCountdownEventIdx(idx)}
                    className={`px-2 py-0.5 rounded-full text-[10.5px] border transition-colors cursor-pointer flex items-center gap-1 ${
                      countdownEventIdx === idx
                        ? 'bg-black/[0.08] dark:bg-white/[0.14] border-black/20 dark:border-white/25 font-semibold'
                        : 'bg-black/[0.03] dark:bg-white/[0.05] border-black/[0.06] dark:border-white/[0.08]'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: m.color }} />
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      }

      case 'timer':
        return (
          <div key="timer" className={`${cardSurfaceClass} p-4 flex flex-col justify-between`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-medium">Timer</span>
              {renderWidgetMenu('timer', isPreview)}
            </div>
            <div className="text-center py-2">
              <div className="text-[34px] font-light tabular-nums tracking-tight">{formatTimer(timerSeconds)}</div>
              <div className="mt-2.5 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setTimerRunning((r) => !r)}
                  className="fluent-btn-primary h-7 px-3 rounded-[6px] bg-[#0078d4] text-[12px] font-medium flex items-center gap-1 cursor-pointer border-none"
                  style={{ color: '#ffffff' }}
                >
                  {timerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  <span>{timerRunning ? 'Pause' : 'Start'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTimerRunning(false);
                    setTimerSeconds(300);
                  }}
                  className="h-7 px-2.5 rounded-[6px] bg-black/[0.06] dark:bg-white/[0.08] text-[12px] flex items-center gap-1 cursor-pointer border-none"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>5m</span>
                </button>
              </div>
            </div>
          </div>
        );

      case 'focus-session':
        return (
          <div key="focus-session" className={`${cardSurfaceClass} p-4 flex flex-col justify-between`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-medium">Focus session</span>
              {renderWidgetMenu('focus-session', isPreview)}
            </div>
            <div className="text-center py-2">
              <div className="text-[32px] font-light tabular-nums">{formatTimer(focusSeconds)}</div>
              <div className="text-[11.5px] mt-0.5" style={mutedTextStyle}>
                Deep work · 25 min block
              </div>
              <div className="mt-2.5 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setFocusRunning((r) => !r)}
                  className="fluent-btn-primary h-7 px-3 rounded-[6px] bg-[#0078d4] text-[12px] font-medium cursor-pointer border-none"
                  style={{ color: '#ffffff' }}
                >
                  {focusRunning ? 'Pause focus' : 'Start focus'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFocusRunning(false);
                    setFocusSeconds(1500);
                  }}
                  className="h-7 px-2.5 rounded-[6px] bg-black/[0.06] dark:bg-white/[0.08] text-[12px] cursor-pointer border-none"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        );

      case 'watchlist':
        return (
          <div key="watchlist" className={`${cardSurfaceClass} p-4 flex flex-col justify-between`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-medium">Watchlist</span>
              {renderWidgetMenu('watchlist', isPreview)}
            </div>
            <div className="space-y-2 text-[12px] tabular-nums">
              {[
                { symbol: 'MSFT', price: '428.15', pct: '+1.24%', up: true },
                { symbol: 'NVDA', price: '142.80', pct: '+2.38%', up: true },
                { symbol: 'VN30', price: '1,346.20', pct: '+0.61%', up: true },
              ].map((s) => (
                <div key={s.symbol} className="flex items-center justify-between">
                  <span className="font-semibold">{s.symbol}</span>
                  <div className="flex items-center gap-2.5">
                    <span>{s.price}</span>
                    <span style={{ color: isLightMode ? '#15803d' : '#4ade80' }}>{s.pct}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'sports':
        return (
          <div key="sports" className={`${cardSurfaceClass} p-4 flex flex-col justify-between`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-medium">Sports · {sportsLeague}</span>
              {renderWidgetMenu('sports', isPreview)}
            </div>
            <div className="space-y-2 text-[12px]">
              {sportsFeed.slice(0, 2).map((ev) => (
                <div key={ev.title} className="p-2 rounded-[6px] bg-black/[0.04] dark:bg-white/[0.05]">
                  <div className="text-[10.5px] font-semibold" style={{ color: ev.badge.startsWith('Live') ? '#e11d48' : undefined }}>
                    {ev.badge}
                  </div>
                  <div className="font-medium truncate">{ev.title}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'events':
        return (
          <div key="events" className={`${cardSurfaceClass} p-4 flex flex-col justify-between`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-medium">Events Near You</span>
              {renderWidgetMenu('events', isPreview)}
            </div>
            <div className="space-y-1.5 text-[12px]">
              <div className="font-semibold">ASIAD 2026 Broadcast Special</div>
              <p className="text-[11.5px]" style={mutedTextStyle}>
                Live coverage across VTV & HTV sports channels.
              </p>
              <button
                type="button"
                onClick={() => {
                  onLaunchRoute('/live-tv');
                  onClose();
                }}
                className="text-[12px] font-medium hover:underline cursor-pointer border-none bg-transparent"
                style={linkTextStyle}
              >
                Watch live coverage
              </button>
            </div>
          </div>
        );

      case 'todays-moment':
        return (
          <div key="todays-moment" className={`${cardSurfaceClass} p-4 flex flex-col justify-between`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-medium">Today&apos;s Moment</span>
              {renderWidgetMenu('todays-moment', isPreview)}
            </div>
            <p className="text-[12.5px] leading-relaxed italic">
              &ldquo;Simplicity is about subtracting the obvious and adding the meaningful.&rdquo;
            </p>
            <span className="text-[11px] mt-2" style={mutedTextStyle}>
              Build 26170 · Sparkle Design Note
            </span>
          </div>
        );

      default:
        return null;
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="windows-widgets-dashboard-portal"
          initial={settings.reduceAllMotion ? false : { x: '-104%', opacity: 0.4 }}
          animate={{
            x: 0,
            opacity: 1,
            transition: settings.reduceAllMotion ? { duration: 0 } : { duration: 0.32, ease: [0.16, 1, 0.3, 1] },
          }}
          exit={
            settings.reduceAllMotion
              ? undefined
              : {
                  x: '-104%',
                  opacity: 0.4,
                  transition: { duration: 0.22, ease: [0.4, 0, 1, 1] },
                }
          }
          style={{
            position: 'fixed',
            left: '12px',
            bottom: `${taskbarHeight + 10}px`,
            width: 'min(840px, calc(100vw - 24px))',
            height: `min(680px, calc(100vh - ${taskbarHeight + 24}px))`,
            zIndex: 8995,
          }}
          className="pointer-events-auto"
        >
          <div
            ref={boardRef}
            id="windows-widgets-board"
            onMouseDown={() => {
              if (openMenuWidget) setOpenMenuWidget(null);
            }}
            className="windows-mica-frame relative w-full h-full rounded-[14px] border border-black/[0.08] dark:border-white/[0.11] shadow-[0_24px_64px_rgba(0,0,0,0.3)] flex overflow-hidden select-none text-[#111827] dark:text-white"
          >
            {/* Left WinUI 3 Navigation Rail */}
            <aside
              aria-label="Widgets navigation"
              className="w-[68px] shrink-0 border-r border-black/[0.06] dark:border-white/[0.07] bg-white/30 dark:bg-black/15 flex flex-col items-center justify-between py-3 px-1.5"
            >
              <div className="w-full space-y-1.5">
                <button
                  type="button"
                  onClick={() => setActiveNav('widgets')}
                  className={`relative w-full py-2 rounded-[8px] flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer border-none ${
                    activeNav === 'widgets'
                      ? 'bg-white/75 dark:bg-white/[0.10]'
                      : 'hover:bg-black/[0.05] dark:hover:bg-white/[0.06] bg-transparent'
                  }`}
                >
                  {activeNav === 'widgets' && (
                    <span className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full bg-[#0067c0] dark:bg-[#4cc2ff]" />
                  )}
                  <WidgetsNavIcon active={activeNav === 'widgets'} className="w-5 h-5" />
                  <span className="text-[10.5px] font-medium">Widgets</span>
                </button>

                {prefs.discoverEnabled && (
                  <button
                    type="button"
                    onClick={() => setActiveNav('discover')}
                    className={`relative w-full py-2 rounded-[8px] flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer border-none ${
                      activeNav === 'discover'
                        ? 'bg-white/75 dark:bg-white/[0.10]'
                        : 'hover:bg-black/[0.05] dark:hover:bg-white/[0.06] bg-transparent'
                    }`}
                  >
                    {activeNav === 'discover' && (
                      <span className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full bg-[#0067c0] dark:bg-[#4cc2ff]" />
                    )}
                    <DiscoverButterflyIcon className="w-5 h-5" />
                    <span className="text-[10.5px] font-medium">Discover</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                aria-label="Widget settings"
                onClick={() => setActiveNav('settings')}
                className={`relative w-full py-2.5 rounded-[8px] flex items-center justify-center transition-colors cursor-pointer border-none ${
                  activeNav === 'settings'
                    ? 'bg-white/75 dark:bg-white/[0.10]'
                    : 'hover:bg-black/[0.05] dark:hover:bg-white/[0.06] bg-transparent'
                }`}
              >
                {activeNav === 'settings' && (
                  <span className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-full bg-[#0067c0] dark:bg-[#4cc2ff]" />
                )}
                <SettingsIcon className="w-[18px] h-[18px]" />
              </button>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
              {/* TAB 1: WIDGETS */}
              {activeNav === 'widgets' && (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="px-6 pt-4 pb-3 flex items-center justify-between shrink-0">
                    <h2 className="text-[18px] font-semibold tracking-tight">Widgets</h2>
                    <button
                      type="button"
                      id="btn-widgets-add"
                      aria-label="Add widget"
                      onClick={() => setIsAddModalOpen(true)}
                      className="w-9 h-9 rounded-[8px] flex items-center justify-center hover:bg-black/[0.06] dark:hover:bg-white/[0.08] active:scale-95 transition-all cursor-pointer border-none bg-transparent"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto px-6 pb-6">
                    {prefs.enabledWidgets.length === 0 ? (
                      <div className={`${cardSurfaceClass} p-8 text-center space-y-3`}>
                        <p className="text-[14px] font-medium">No widgets pinned to your board yet.</p>
                        <button
                          type="button"
                          onClick={() => setIsAddModalOpen(true)}
                          className="fluent-btn-primary h-8 px-4 rounded-[6px] bg-[#0078d4] text-[13px] font-medium cursor-pointer border-none"
                          style={{ color: '#ffffff' }}
                        >
                          + Add widget
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 items-stretch">
                        {prefs.enabledWidgets.map((wId) => renderWidgetCard(wId))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: DISCOVER */}
              {activeNav === 'discover' && (
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Top Greeting Bar */}
                  <div className="px-6 pt-4 pb-2 flex items-center justify-between gap-4 shrink-0">
                    <h2 className="text-[18px] font-semibold tracking-tight">{greetingText}</h2>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label="Refresh feed"
                        onClick={() => {
                          setIsRefreshingFeed(true);
                          setTimeout(() => {
                            setIsRefreshingFeed(false);
                            setHeroSlideIdx((i) => (i + 1) % heroStories.length);
                          }, 450);
                        }}
                        className="w-8 h-8 rounded-[6px] flex items-center justify-center hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer border-none bg-transparent"
                      >
                        <RotateCw className={`w-4 h-4 ${isRefreshingFeed ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        type="button"
                        aria-label="Personalize feed"
                        onClick={() => setActiveNav('settings')}
                        className="w-8 h-8 rounded-[6px] flex items-center justify-center hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer border-none bg-transparent"
                      >
                        <SlidersHorizontal className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Account"
                        onClick={() => {
                          onLaunchRoute('/auth');
                          onClose();
                        }}
                        className="w-8 h-8 rounded-full border border-black/15 dark:border-white/20 flex items-center justify-center hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer bg-white/50 dark:bg-white/[0.06]"
                      >
                        <User className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Date + Centered Sub-tabs */}
                  <div className="px-6 pb-3 flex items-center justify-between shrink-0">
                    <span className="text-[12.5px] font-semibold">{formattedDate}</span>
                    <div className="flex items-center gap-6 mx-auto">
                      {(
                        [
                          { id: 'discover', label: 'Discover' },
                          { id: 'watch', label: 'Watch' },
                          { id: 'play', label: 'Play' },
                        ] as const
                      ).map((tab) => {
                        const active = discoverSubTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setDiscoverSubTab(tab.id)}
                            className={`relative pb-1.5 text-[13px] cursor-pointer border-none bg-transparent transition-colors ${
                              active ? 'font-semibold' : 'font-normal opacity-75 hover:opacity-100'
                            }`}
                          >
                            {tab.label}
                            {active && (
                              <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-4 h-[2.5px] rounded-full bg-[#0067c0] dark:bg-[#4cc2ff]" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <span className="w-[70px] hidden sm:block" />
                  </div>

                  {/* Scrollable Discover Body (full width without Weather / PGA) */}
                  <div className="flex-1 overflow-y-auto px-6 pb-6">
                    <div>
                      {discoverSubTab === 'discover' && (
                        <div className="space-y-3.5">
                          {/* Featured Carousel Hero Card */}
                          {heroStories.length > 0 && (
                            <div className="relative h-[255px] rounded-[10px] overflow-hidden border border-black/10 dark:border-white/10 group">
                              <img
                                src={heroStories[heroSlideIdx % heroStories.length].image}
                                alt={heroStories[heroSlideIdx % heroStories.length].title}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

                              <button
                                type="button"
                                aria-label="Previous story"
                                onClick={() => setHeroSlideIdx((i) => (i - 1 + heroStories.length) % heroStories.length)}
                                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-7 h-9 rounded-[6px] bg-black/45 hover:bg-black/65 flex items-center justify-center cursor-pointer border-none"
                                style={{ color: '#ffffff' }}
                              >
                                <ChevronLeft className="w-4 h-4 fluent-3d-icon" style={{ color: '#ffffff' }} />
                              </button>
                              <button
                                type="button"
                                aria-label="Next story"
                                onClick={() => setHeroSlideIdx((i) => (i + 1) % heroStories.length)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-9 rounded-[6px] bg-black/45 hover:bg-black/65 flex items-center justify-center cursor-pointer border-none"
                                style={{ color: '#ffffff' }}
                              >
                                <ChevronRight className="w-4 h-4 fluent-3d-icon" style={{ color: '#ffffff' }} />
                              </button>

                              <div className="absolute inset-x-0 bottom-0 p-4 space-y-2">
                                <div className="text-[11.5px] font-medium" style={{ color: '#e2e8f0' }}>
                                  {heroStories[heroSlideIdx % heroStories.length].source} ·{' '}
                                  {heroStories[heroSlideIdx % heroStories.length].time}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onLaunchRoute(`/article/${heroStories[heroSlideIdx % heroStories.length].slug}`);
                                    onClose();
                                  }}
                                  className="text-left text-[18px] font-bold leading-snug hover:underline cursor-pointer border-none bg-transparent block"
                                  style={{ color: '#ffffff' }}
                                >
                                  {heroStories[heroSlideIdx % heroStories.length].title}
                                </button>
                                <div className="flex items-center justify-between pt-1">
                                  <div className="flex items-center gap-3 text-[11.5px]" style={{ color: '#e2e8f0' }}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const id = heroStories[heroSlideIdx % heroStories.length].id;
                                        setLikedArticles((prev) => ({ ...prev, [id]: !prev[id] }));
                                      }}
                                      className="inline-flex items-center gap-1 cursor-pointer border-none bg-transparent"
                                      style={{ color: '#ffffff' }}
                                    >
                                      <ThumbsUp className="w-3.5 h-3.5 fluent-3d-icon" style={{ color: '#ffffff' }} />
                                      <span className="tabular-nums">
                                        {heroStories[heroSlideIdx % heroStories.length].likes +
                                          (likedArticles[heroStories[heroSlideIdx % heroStories.length].id] ? 1 : 0)}
                                      </span>
                                    </button>
                                    <ThumbsDown className="w-3.5 h-3.5 fluent-3d-icon opacity-80" style={{ color: '#ffffff' }} />
                                    <span className="inline-flex items-center gap-1 tabular-nums">
                                      <MessageSquare className="w-3.5 h-3.5 fluent-3d-icon" style={{ color: '#ffffff' }} />
                                      {heroStories[heroSlideIdx % heroStories.length].comments}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    {heroStories.map((s, idx) => (
                                      <button
                                        key={s.id}
                                        type="button"
                                        aria-label={`Slide ${idx + 1}`}
                                        onClick={() => setHeroSlideIdx(idx)}
                                        className={`h-1.5 rounded-full transition-all cursor-pointer border-none ${
                                          idx === heroSlideIdx % heroStories.length
                                            ? 'w-4 bg-white'
                                            : 'w-1.5 bg-white/45'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 2-Column Secondary Articles */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            {secondaryStories.map((art) => (
                              <button
                                key={art.id}
                                type="button"
                                onClick={() => {
                                  onLaunchRoute(`/article/${art.slug}`);
                                  onClose();
                                }}
                                className={`${cardSurfaceClass} overflow-hidden text-left hover:bg-white/95 dark:hover:bg-[#323740] cursor-pointer group flex flex-col`}
                              >
                                <div className="h-[135px] w-full overflow-hidden">
                                  <img
                                    src={art.image}
                                    alt={art.title}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                                  />
                                </div>
                                <div className="p-3 space-y-1">
                                  <div className="text-[11px]" style={mutedTextStyle}>
                                    {art.source} · {art.time}
                                  </div>
                                  <div className="text-[13.5px] font-semibold leading-snug line-clamp-2">{art.title}</div>
                                </div>
                              </button>
                            ))}
                          </div>

                          <div className="flex justify-center pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (!extraArticlesShown) {
                                  setExtraArticlesShown(true);
                                } else {
                                  onLaunchRoute('/news');
                                  onClose();
                                }
                              }}
                              className="fluent-btn-primary h-8 px-4 rounded-[6px] bg-[#0078d4] text-[12.5px] font-medium flex items-center gap-1 cursor-pointer border-none"
                              style={{ color: '#ffffff' }}
                            >
                              <span>{extraArticlesShown ? 'Open Feed' : 'See more'}</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      {discoverSubTab === 'watch' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {(channels || []).slice(0, 6).map((ch) => (
                            <button
                              key={ch.id}
                              type="button"
                              onClick={() => {
                                onSelectChannel(ch);
                                onLaunchRoute(`/live-tv?channel=${ch.slug}`);
                                onClose();
                              }}
                              className={`${cardSurfaceClass} p-3.5 flex items-center gap-3 text-left hover:bg-white/95 dark:hover:bg-[#323740] cursor-pointer`}
                            >
                              <div className="w-12 h-12 rounded-[8px] bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center p-1.5 shrink-0">
                                <img src={ch.logo} alt={ch.name} referrerPolicy="no-referrer" className="w-full h-full object-contain" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-[13.5px] font-semibold truncate">{ch.name}</div>
                                <div className="text-[11.5px] truncate" style={mutedTextStyle}>
                                  {ch.category || 'Live Broadcast'}
                                </div>
                              </div>
                              <Play className="w-4 h-4 shrink-0" style={linkTextStyle} />
                            </button>
                          ))}
                        </div>
                      )}

                      {discoverSubTab === 'play' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {[
                            { title: 'Craftmine', desc: 'Build and explore blocks directly in browser', route: '/craftmine', icon: <Fluent3DCraftmineIcon className="w-10 h-10" /> },
                            { title: 'Ink Canvas', desc: 'Sketch, draw, and export artwork', route: '/draws', icon: <Fluent3DDrawsIcon className="w-10 h-10" /> },
                            { title: 'Photopea', desc: 'Advanced raster & PSD photo studio', route: '/photopea', icon: <Fluent3DPhotopeaIcon className="w-10 h-10" /> },
                            { title: 'HTML Writer', desc: 'Live HTML/CSS/JS playground', route: '/html-writer', icon: <Fluent3DHtmlWriterIcon className="w-10 h-10" /> },
                          ].map((app) => (
                            <button
                              key={app.title}
                              type="button"
                              onClick={() => {
                                onLaunchRoute(app.route);
                                onClose();
                              }}
                              className={`${cardSurfaceClass} p-4 flex items-center gap-3.5 text-left hover:bg-white/95 dark:hover:bg-[#323740] cursor-pointer`}
                            >
                              {app.icon}
                              <div className="min-w-0 flex-1">
                                <div className="text-[13.5px] font-semibold">{app.title}</div>
                                <div className="text-[11.5px]" style={mutedTextStyle}>
                                  {app.desc}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SETTINGS (Screenshot 4) */}
              {activeNav === 'settings' && (
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                  <h2 className="text-[18px] font-semibold tracking-tight">Settings</h2>

                  <div className="space-y-2.5 max-w-[760px]">
                    {/* Discover Toggle */}
                    <div className={`${cardSurfaceClass} px-4 py-3.5 flex items-center justify-between gap-4`}>
                      <div className="flex items-center gap-3.5 min-w-0">
                        <DiscoverButterflyIcon className="w-6 h-6" />
                        <div className="min-w-0">
                          <div className="text-[13.5px] font-medium">Discover</div>
                          <div className="text-[11.5px]" style={mutedTextStyle}>
                            Microsoft Start Feed
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <WinUIToggle
                          checked={prefs.discoverEnabled}
                          onChange={() => updatePrefs((p) => ({ ...p, discoverEnabled: !p.discoverEnabled }))}
                          ariaLabel="Toggle Discover feed"
                        />
                        <span className="text-[12.5px] w-7">{prefs.discoverEnabled ? 'On' : 'Off'}</span>
                      </div>
                    </div>

                    {/* Browse Dashboards */}
                    <div className={`${cardSurfaceClass} px-4 py-3.5 flex items-center justify-between gap-4`}>
                      <div className="text-[13.5px] font-medium">Get more dashboards from the Microsoft Store</div>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveNav('widgets');
                          setIsAddModalOpen(true);
                        }}
                        className="h-8 px-3.5 rounded-[6px] bg-white dark:bg-white/[0.08] hover:bg-black/[0.04] dark:hover:bg-white/[0.12] border border-black/15 dark:border-white/15 text-[12.5px] font-medium cursor-pointer shrink-0"
                      >
                        Browse dashboards
                      </button>
                    </div>

                    {/* More settings */}
                    <div className="pt-2 space-y-2">
                      <h3 className="text-[13px] font-semibold">More settings</h3>

                      <div className={`${cardSurfaceClass} overflow-hidden`}>
                        <button
                          type="button"
                          onClick={() => setNotificationsExpanded((v) => !v)}
                          className="w-full px-4 py-3.5 flex items-center justify-between gap-4 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] cursor-pointer border-none bg-transparent text-left"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <Bell className="w-4.5 h-4.5 shrink-0" />
                            <div>
                              <div className="text-[13.5px] font-medium">Notifications</div>
                              <div className="text-[11.5px]" style={mutedTextStyle}>
                                Manage taskbar notifications from your widgets and boards
                              </div>
                            </div>
                          </div>
                          <ChevronRight className={`w-4 h-4 transition-transform ${notificationsExpanded ? 'rotate-90' : ''}`} />
                        </button>

                        <AnimatePresence>
                          {notificationsExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden border-t border-black/[0.06] dark:border-white/[0.07]"
                            >
                              <div className="px-11 py-3 space-y-2.5 text-[12.5px]">
                                {(
                                  [
                                    { key: 'weatherAlerts', label: 'Weather alerts & severe advisories' },
                                    { key: 'breakingNews', label: 'Breaking news & Sparkle updates' },
                                    { key: 'sportsScores', label: 'Live sports score updates' },
                                  ] as const
                                ).map((item) => (
                                  <div key={item.key} className="flex items-center justify-between">
                                    <span>{item.label}</span>
                                    <WinUIToggle
                                      checked={prefs.notificationsEnabled[item.key]}
                                      onChange={() =>
                                        updatePrefs((p) => ({
                                          ...p,
                                          notificationsEnabled: {
                                            ...p.notificationsEnabled,
                                            [item.key]: !p.notificationsEnabled[item.key],
                                          },
                                        }))
                                      }
                                      ariaLabel={item.label}
                                    />
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className={`${cardSurfaceClass} px-4 py-3.5 flex items-center justify-between gap-4`}>
                        <div className="flex items-center gap-3.5 min-w-0">
                          <Tv className="w-4.5 h-4.5 shrink-0" />
                          <div>
                            <div className="text-[13.5px] font-medium">Open on hover</div>
                            <div className="text-[11.5px]" style={mutedTextStyle}>
                              Opens when hovering on the taskbar icon
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0">
                          <WinUIToggle
                            checked={prefs.openOnHover}
                            onChange={() => updatePrefs((p) => ({ ...p, openOnHover: !p.openOnHover }))}
                            ariaLabel="Open on hover"
                          />
                          <span className="text-[12.5px] w-7">{prefs.openOnHover ? 'On' : 'Off'}</span>
                        </div>
                      </div>
                    </div>

                    {/* About */}
                    <div className="pt-2 space-y-2">
                      <h3 className="text-[13px] font-semibold">About</h3>

                      <div className={`${cardSurfaceClass} overflow-hidden divide-y divide-black/[0.06] dark:divide-white/[0.07]`}>
                        <button
                          type="button"
                          onClick={() => setAboutExpanded((v) => !v)}
                          className="w-full px-4 py-3.5 flex items-center justify-between gap-4 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] cursor-pointer border-none bg-transparent text-left"
                        >
                          <div className="flex items-center gap-3.5">
                            <Info className="w-4.5 h-4.5 shrink-0" />
                            <div>
                              <div className="text-[13.5px] font-medium">Widgets</div>
                              <div className="text-[11.5px] tabular-nums" style={mutedTextStyle}>
                                Version: 526.31400.0.0 · Build 26170.Moment 1
                              </div>
                            </div>
                          </div>
                          {aboutExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        {aboutExpanded && (
                          <>
                            {[
                              { label: 'Learn more', action: () => { onLaunchRoute('/about'); onClose(); } },
                              { label: 'Give feedback', action: () => { onLaunchRoute('/feedback'); onClose(); } },
                              { label: 'Terms of use', action: () => showAppToast('Sparkle Insider Preview · Build 26170 Terms', 'info') },
                              { label: 'Consumer health privacy', action: () => showAppToast('Local-only storage in browser IndexedDB/localStorage', 'info') },
                              { label: 'Privacy statement', action: () => showAppToast('Preferences stay on your device', 'info') },
                            ].map((row) => (
                              <button
                                key={row.label}
                                type="button"
                                onClick={row.action}
                                className="w-full px-11 py-3 flex items-center justify-between text-[13px] hover:bg-black/[0.03] dark:hover:bg-white/[0.04] cursor-pointer border-none bg-transparent text-left"
                              >
                                <span>{row.label}</span>
                                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                              </button>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ADD WIDGET MODAL (WinUI 3 ContentDialog animation + 100% live widget preview) */}
            <AnimatePresence>
              {isAddModalOpen && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
                  <motion.div
                    variants={shouldAnimateModal ? modalBackdropVariants : undefined}
                    initial={shouldAnimateModal ? 'initial' : false}
                    animate="animate"
                    exit={shouldAnimateModal ? 'exit' : undefined}
                    onClick={() => setIsAddModalOpen(false)}
                    className="absolute inset-0 bg-black/40 backdrop-blur-xs"
                  />

                  <motion.div
                    variants={shouldAnimateModal ? modalDialogVariants : undefined}
                    initial={shouldAnimateModal ? 'initial' : false}
                    animate="animate"
                    exit={shouldAnimateModal ? 'exit' : undefined}
                    onClick={(e) => e.stopPropagation()}
                    className="fluent-modal-dialog windows-mica-frame relative z-10 w-full max-w-[580px] h-[500px] rounded-[12px] border border-black/10 dark:border-white/15 shadow-2xl flex flex-col overflow-hidden"
                  >
                    {/* Modal Header */}
                    <div className="px-4 py-2.5 flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] shrink-0">
                      <span className="text-[12.5px] font-medium">Add widget</span>
                      <button
                        type="button"
                        aria-label="Close add widget"
                        onClick={() => setIsAddModalOpen(false)}
                        className="w-7 h-7 rounded-[6px] flex items-center justify-center hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer border-none bg-transparent"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Modal Split Body */}
                    <div className="flex-1 min-h-0 flex">
                      {/* Left Widget Picker List */}
                      <div className="w-[190px] shrink-0 border-r border-black/[0.06] dark:border-white/[0.08] flex flex-col justify-between p-1.5 overflow-y-auto">
                        <div className="space-y-0.5">
                          {WIDGET_CATALOG.map((item) => {
                            const selected = selectedCatalogId === item.id;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => setSelectedCatalogId(item.id)}
                                className={`relative w-full h-9 px-3 rounded-[6px] flex items-center gap-2.5 text-[12.5px] cursor-pointer border-none text-left transition-colors ${
                                  selected
                                    ? 'bg-black/[0.06] dark:bg-white/[0.10] font-semibold'
                                    : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.06] bg-transparent'
                                }`}
                              >
                                {selected && (
                                  <span className="absolute left-0.5 top-2 bottom-2 w-[3px] rounded-full bg-[#0067c0] dark:bg-[#4cc2ff]" />
                                )}
                                <span
                                  className="w-2.5 h-2.5 rounded-[3px] shrink-0"
                                  style={{ backgroundColor: item.accentColor }}
                                />
                                <span className="truncate">{item.title}</span>
                              </button>
                            );
                          })}
                        </div>
                        <button
                          type="button"
                          onClick={() => showAppToast('All available Sparkle widgets are listed above', 'info')}
                          className="mt-2 px-3 py-2 text-[12px] font-medium hover:underline text-left cursor-pointer border-none bg-transparent"
                          style={linkTextStyle}
                        >
                          Find more widgets
                        </button>
                      </div>

                      {/* Right Preview Pane: Renders 100% the real widget card from Widgets tab */}
                      <div className="flex-1 min-w-0 p-4 flex flex-col items-center justify-between bg-white/35 dark:bg-black/15 overflow-hidden">
                        {(() => {
                          const cat = WIDGET_CATALOG.find((c) => c.id === selectedCatalogId) || WIDGET_CATALOG[1];
                          const alreadyAdded = prefs.enabledWidgets.includes(cat.id);
                          return (
                            <>
                              <h3 className="text-[19px] font-semibold tracking-tight shrink-0">{cat.title}</h3>

                              <div className="flex-1 min-h-0 w-full overflow-y-auto flex items-center justify-center py-2 px-1">
                                <div className="w-full max-w-[285px]">
                                  {renderWidgetCard(cat.id, true)}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  if (alreadyAdded) {
                                    removeWidget(cat.id);
                                  } else {
                                    addWidget(cat.id);
                                  }
                                }}
                                className="fluent-btn-primary h-8 px-4 rounded-[6px] bg-[#0078d4] hover:bg-[#106ebe] text-[12.5px] font-medium flex items-center gap-1.5 cursor-pointer border-none shrink-0"
                                style={{ color: '#ffffff' }}
                              >
                                {alreadyAdded ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Added (Remove)</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add widget</span>
                                  </>
                                )}
                              </button>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
