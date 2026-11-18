import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronUp,
  ChevronRight,
  Wifi,
  Volume2,
  VolumeX,
  Plus,
  X,
  Minus,
  Square,
  Copy,
  Sun,
  Moon,
  Sparkles,
  Keyboard,
  LogOut,
  Settings as SettingsIcon,
  Search,
  Globe,
  Layers,
  Monitor,
} from 'lucide-react';
import { WindowsContextMenu } from './WindowsContextMenu';
import { contextMenuUpMotionProps, flyoutPanelClassName, flyoutPanelStyle } from './FlyoutDropdown';
import { useSettings, SystemSettings, getTaskbarHeightPx } from '../hooks/useSettings';
import { useNotes } from '../context/NotesContext';
import { TabIcon, type AppTab } from './SparkleTabBar';
import { type AppWindowState } from './WindowFrame';
import {
  Fluent3DHomeIcon,
  Fluent3DWatchIcon,
  Fluent3DWatchPreviewIcon,
  Fluent3DArticlesIcon,
  Fluent3DGalleryIcon,
  Fluent3DNotesIcon,
  Fluent3DSettingsIcon,
  Fluent3DCraftmineIcon,
  Fluent3DPhotopeaIcon,
  Fluent3DScreenbugIcon,
  Fluent3DDrawsIcon,
  Fluent3DFolderSearchIcon,
  Fluent3DCalculatorIcon,
  Fluent3DMapsIcon,
  Fluent3DMailIcon,
  Fluent3DUpdatesIcon,
  Fluent3DDiscordIcon,
} from './Fluent3DIcons';
import { FluentSearchIcon } from './FluentIcons';
import { FluentEmojiText } from './FluentEmoji';
import { NEWS_DATA } from '../data/news';
import { Channel } from '../types';
import { galleryDB, GalleryMediaItem } from '../services/galleryStorage';
import { showAppToast } from '../utils/toast';

function stripHtml(html: string): string {
  return (html || '').replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
}

interface SearchHistoryItem {
  query: string;
  type?: SearchAspectItem['type'];
  logo?: string;
  subtitle?: string;
  timestamp?: number;
}

interface SearchAspectItem {
  id: string;
  title: string;
  subtitle?: string;
  type:
    | 'history'
    | 'page'
    | 'channel'
    | 'news'
    | 'setting'
    | 'tool'
    | 'setting-toggle'
    | 'setting-action'
    | 'note'
    | 'gallery'
    | 'web-search';
  logo?: string;
  keywords?: string;
  timestamp?: number;
  settingKey?: keyof SystemSettings;
  customToggle?: {
    checked: boolean;
    onToggle: () => void;
  };
  customAction?: {
    label: string;
    onAction: () => void;
  };
  externalUrl?: string;
  onSelect: () => void;
}

interface PinnedAppDef {
  id: string;
  title: string;
  route: string;
  matchPrefixes: string[];
}

interface WindowsTaskbarProps {
  tabs: AppTab[];
  activeTabId: string;
  windowStates: Record<string, AppWindowState>;
  isStartMenuOpen: boolean;
  onToggleStartMenu: () => void;
  onCloseStartMenu: () => void;
  isDirectCommandOpen: boolean;
  onToggleDirectCommand: () => void;
  onCloseDirectCommand: () => void;
  onTaskbarWindowClick: (tabId: string) => void;
  onLaunchRoute: (route: string, state?: any) => void;
  onCreateNewWindow: (route?: string) => void;
  onCloseWindow: (tabId: string) => void;
  onMinimizeWindow: (tabId: string) => void;
  onToggleMaximizeWindow: (tabId: string) => void;
  onDuplicateWindow: (tabId: string) => void;
  onShowDesktop: () => void;
  channels: Channel[];
  onSelectChannel: (channel: Channel) => void;
}

export const WindowsTaskbar: React.FC<WindowsTaskbarProps> = ({
  tabs,
  activeTabId,
  windowStates,
  isStartMenuOpen,
  onToggleStartMenu,
  onCloseStartMenu,
  isDirectCommandOpen,
  onToggleDirectCommand,
  onCloseDirectCommand,
  onTaskbarWindowClick,
  onLaunchRoute,
  onCreateNewWindow,
  onCloseWindow,
  onMinimizeWindow,
  onToggleMaximizeWindow,
  onDuplicateWindow,
  onShowDesktop,
  channels,
  onSelectChannel,
}) => {
  const { settings, updateSetting } = useSettings();
  const { notes, setActiveNoteId, isStickyVisible, toggleSticky, createNote } = useNotes();
  const isLightMode = settings.theme === 'light';
  const taskbarScale = settings.taskbarScale || 'default';
  const taskbarHeight = getTaskbarHeightPx(taskbarScale);
  const flyoutBottomOffset = taskbarHeight + 8;
  const isLeftAligned = settings.taskbarAlignment === 'left';
  const isSearchButtonMode = settings.taskbarSearchStyle === 'button';

  const btnSizeClass =
    taskbarScale === 'small'
      ? 'w-[34px] h-[34px]'
      : taskbarScale === 'large'
      ? 'w-[46px] h-[46px]'
      : 'w-[40px] h-[40px]';
  const directCmdBtnSizeClass =
    taskbarScale === 'small'
      ? 'w-[30px] h-[32px]'
      : taskbarScale === 'large'
      ? 'w-[40px] h-[44px]'
      : 'w-[34px] h-[38px]';
  const startIconSizeClass =
    taskbarScale === 'small'
      ? 'w-[21px] h-[21px]'
      : taskbarScale === 'large'
      ? 'w-[29px] h-[29px]'
      : 'w-[25px] h-[25px]';
  const appIconSizeClass =
    taskbarScale === 'small'
      ? 'w-[20px] h-[20px]'
      : taskbarScale === 'large'
      ? 'w-[28px] h-[28px]'
      : 'w-[24px] h-[24px]';
  const searchBoxHeightClass =
    taskbarScale === 'small'
      ? 'h-[28px]'
      : taskbarScale === 'large'
      ? 'h-[36px]'
      : 'h-[32px]';
  const clockTextSizeClass =
    taskbarScale === 'small'
      ? 'text-[10.5px]'
      : taskbarScale === 'large'
      ? 'text-[12.5px]'
      : 'text-[11.5px]';

  // Live Clock & Date formatted like Windows 11 taskbar
  const [clockText, setClockText] = useState({ time: '', date: '' });
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const time = now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      const date = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;
      setClockText({ time, date });
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Search box & Trending Search UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showAllResults, setShowAllResults] = useState(false);
  const [isClearingHistory, setIsClearingHistory] = useState(false);
  const [galleryItems, setGalleryItems] = useState<GalleryMediaItem[]>([]);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const searchFlyoutRef = useRef<HTMLDivElement>(null);
  const searchFlyoutInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    galleryDB.getAll().then(setGalleryItems).catch(() => {});
    const unsubscribe = galleryDB.subscribe(() => {
      galleryDB.getAll().then(setGalleryItems).catch(() => {});
    });
    return () => unsubscribe();
  }, []);

  const formatRelativeTime = (timestamp?: number): string => {
    if (!timestamp) return 'Just now';
    const elapsed = Math.max(0, Date.now() - timestamp);
    const seconds = Math.floor(elapsed / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
    const years = Math.floor(days / 365);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  };

  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('vone_search_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const now = Date.now();
          return parsed
            .map((item: any, idx: number) => {
              if (typeof item === 'string') {
                return { query: item, timestamp: now - (idx + 1) * 300000 };
              }
              const rawSubtitle = item.subtitle === 'Do action' ? 'Switch page' : item.subtitle;
              return {
                query: item.query || item.title || '',
                type: item.type,
                logo: item.logo,
                subtitle: rawSubtitle,
                timestamp: item.timestamp || now - (idx + 1) * 300000,
              };
            })
            .filter((item: SearchHistoryItem) => Boolean(item.query.trim()));
        }
      }
    } catch {}
    return [];
  });

  const saveToHistory = (
    query: string,
    meta?: { type?: SearchAspectItem['type']; logo?: string; subtitle?: string; timestamp?: number }
  ) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const now = Date.now();
    const cleanSubtitle = meta?.subtitle === 'Do action' ? 'Switch page' : meta?.subtitle;
    setSearchHistory((prev) => {
      const next = [
        {
          query: trimmed,
          type: meta?.type,
          logo: meta?.logo,
          subtitle: cleanSubtitle,
          timestamp: meta?.timestamp || now,
        },
        ...prev.filter((item) => item.query.toLowerCase() !== trimmed.toLowerCase()),
      ].slice(0, 20);
      try {
        localStorage.setItem('vone_search_history', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const removeFromHistory = (queryToRemove: string) => {
    setSearchHistory((prev) => {
      const next = prev.filter((item) => item.query.toLowerCase() !== queryToRemove.toLowerCase());
      try {
        localStorage.setItem('vone_search_history', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const clearAllHistory = () => {
    setSearchHistory([]);
    try {
      localStorage.setItem('vone_search_history', JSON.stringify([]));
    } catch {}
  };

  // Taskbar popovers
  const [isQuickSettingsOpen, setIsQuickSettingsOpen] = useState(false);
  const [isTrayOverflowOpen, setIsTrayOverflowOpen] = useState(false);
  const [isTaskViewOpen, setIsTaskViewOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(72);
  const [brightness, setBrightness] = useState(100);

  // Hover tooltip
  const [hoverTooltip, setHoverTooltip] = useState<{ label: string; left: number } | null>(null);

  // Taskbar icon right-click menu & empty taskbar context menu
  const [taskMenu, setTaskMenu] = useState<{ tabId: string; x: number; y: number } | null>(null);
  const [taskbarContextMenu, setTaskbarContextMenu] = useState<{ x: number; y: number } | null>(null);

  const quickSettingsRef = useRef<HTMLDivElement>(null);
  const trayOverflowRef = useRef<HTMLDivElement>(null);
  const taskViewRef = useRef<HTMLDivElement>(null);
  const taskMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-windows-context-menu]')) return;
      if (
        isSearchOpen &&
        searchBoxRef.current &&
        !searchBoxRef.current.contains(target) &&
        !target.closest('#windows-taskbar-search-btn') &&
        (!searchFlyoutRef.current || !searchFlyoutRef.current.contains(target))
      ) {
        setIsSearchOpen(false);
        setShowAllResults(false);
      }
      if (
        isQuickSettingsOpen &&
        quickSettingsRef.current &&
        !quickSettingsRef.current.contains(target) &&
        !target.closest('#btn-taskbar-quick-settings') &&
        !target.closest('#btn-taskbar-clock-tray')
      ) {
        setIsQuickSettingsOpen(false);
      }
      if (
        isTrayOverflowOpen &&
        trayOverflowRef.current &&
        !trayOverflowRef.current.contains(target) &&
        !target.closest('#btn-taskbar-tray-overflow')
      ) {
        setIsTrayOverflowOpen(false);
      }
      if (
        isTaskViewOpen &&
        taskViewRef.current &&
        !taskViewRef.current.contains(target) &&
        !target.closest('#btn-taskbar-taskview')
      ) {
        setIsTaskViewOpen(false);
      }
      if (taskMenu && taskMenuRef.current && !taskMenuRef.current.contains(target)) {
        setTaskMenu(null);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setShowAllResults(false);
        setIsQuickSettingsOpen(false);
        setIsTrayOverflowOpen(false);
        setIsTaskViewOpen(false);
        setTaskMenu(null);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleKey);
    };
  }, [isSearchOpen, isQuickSettingsOpen, isTrayOverflowOpen, isTaskViewOpen, taskMenu]);

  // Listen to vplay:focus-topbar-search shortcut
  useEffect(() => {
    const onFocusSearch = () => {
      setIsSearchOpen(true);
      onCloseStartMenu();
      onCloseDirectCommand();
      setTimeout(() => {
        searchFlyoutInputRef.current?.focus();
      }, 60);
    };
    window.addEventListener('vplay:focus-topbar-search', onFocusSearch);
    return () => window.removeEventListener('vplay:focus-topbar-search', onFocusSearch);
  }, [onCloseStartMenu, onCloseDirectCommand]);

  useEffect(() => {
    if (!isSearchOpen) return;
    const t = setTimeout(() => {
      searchFlyoutInputRef.current?.focus();
    }, 50);
    return () => clearTimeout(t);
  }, [isSearchOpen]);

  // Pinned taskbar apps: only Settings (Start, Search, Task View are built-in taskbar controls)
  const pinnedApps: PinnedAppDef[] = useMemo(
    () => [
      {
        id: 'pin-settings',
        title: 'Settings',
        route: '/settings',
        matchPrefixes: ['/settings'],
      },
    ],
    []
  );

  const routeMatchesPinned = (route: string, pinned: PinnedAppDef) => {
    const base = route.split('?')[0];
    return pinned.matchPrefixes.some((p) => (p === '/' ? base === '/' : base === p || base.startsWith(`${p}/`)));
  };

  // Build extra open tabs that aren't in pinnedApps
  const extraOpenTabs = useMemo(() => {
    return tabs.filter((t) => !pinnedApps.some((p) => routeMatchesPinned(t.route, p)));
  }, [tabs, pinnedApps]);

  // Unified draggable taskbar app slots (pinned + extra open tabs) persisted in localStorage
  const TASKBAR_ORDER_KEY = 'sparkle_taskbar_order_v1';
  const [taskbarOrder, setTaskbarOrder] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(TASKBAR_ORDER_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });
  const [draggedSlotKey, setDraggedSlotKey] = useState<string | null>(null);
  const [taskbarDropTarget, setTaskbarDropTarget] = useState<{
    key: string;
    side: 'before' | 'after';
  } | null>(null);

  type TaskbarSlot =
    | { key: string; kind: 'pinned'; pinned: PinnedAppDef; matchingTabs: AppTab[] }
    | { key: string; kind: 'tab'; tab: AppTab };

  const orderedTaskbarSlots: TaskbarSlot[] = useMemo(() => {
    const slotMap = new Map<string, TaskbarSlot>();
    const defaultKeys: string[] = [];

    pinnedApps.forEach((pinned) => {
      const key = `pin:${pinned.id}`;
      defaultKeys.push(key);
      slotMap.set(key, {
        key,
        kind: 'pinned',
        pinned,
        matchingTabs: tabs.filter((t) => routeMatchesPinned(t.route, pinned)),
      });
    });

    extraOpenTabs.forEach((tab) => {
      const key = `tab:${tab.id}`;
      defaultKeys.push(key);
      slotMap.set(key, {
        key,
        kind: 'tab',
        tab,
      });
    });

    const orderedKeys: string[] = [];
    const used = new Set<string>();

    taskbarOrder.forEach((k) => {
      if (slotMap.has(k) && !used.has(k)) {
        used.add(k);
        orderedKeys.push(k);
      }
    });

    defaultKeys.forEach((k) => {
      if (!used.has(k)) {
        used.add(k);
        orderedKeys.push(k);
      }
    });

    return orderedKeys.map((k) => slotMap.get(k)!);
  }, [pinnedApps, extraOpenTabs, tabs, taskbarOrder]);

  const handleTaskbarSlotDrop = (targetKey: string, side: 'before' | 'after') => {
    if (!draggedSlotKey || draggedSlotKey === targetKey) return;
    const keys = orderedTaskbarSlots.map((s) => s.key);
    const filtered = keys.filter((k) => k !== draggedSlotKey);
    const destIdx = filtered.indexOf(targetKey);
    if (destIdx === -1) return;
    filtered.splice(side === 'after' ? destIdx + 1 : destIdx, 0, draggedSlotKey);
    setTaskbarOrder(filtered);
    try {
      localStorage.setItem(TASKBAR_ORDER_KEY, JSON.stringify(filtered));
    } catch {}
  };

  // Pre-configured App Aspects matching TopBar Search UI
  const appAspects = useMemo(() => {
    const aspects: SearchAspectItem[] = [
      { id: 'page-home', title: 'Home', subtitle: 'Switch page', keywords: 'trang chủ home overview', type: 'page', onSelect: () => onLaunchRoute('/') },
      { id: 'page-watch', title: 'Watch', subtitle: 'Switch page', keywords: 'live tv xem truyền hình trực tuyến watch', type: 'page', onSelect: () => onLaunchRoute('/live-tv') },
      { id: 'page-news', title: 'Feed', subtitle: 'Switch page', keywords: 'tin tức bài viết news articles feed update blogs changelog cập nhật', type: 'page', onSelect: () => onLaunchRoute('/news') },
      { id: 'page-channels', title: 'Channels', subtitle: 'Switch page', keywords: 'danh sách kênh channels channel directory', type: 'page', onSelect: () => onLaunchRoute('/channels') },
      { id: 'page-favs', title: 'Favorites', subtitle: 'Switch page', keywords: 'kênh yêu thích favorites favs', type: 'page', onSelect: () => onLaunchRoute('/favorites') },
      { id: 'page-craftmine', title: 'Craftmine', subtitle: 'Switch page', keywords: 'minecraft preview web game', type: 'page', onSelect: () => onLaunchRoute('/craftmine') },
      { id: 'page-photopea', title: 'Photopea', subtitle: 'Switch page', keywords: 'photopea photoshop chỉnh sửa ảnh biên tập ảnh psd photo editor web app', type: 'page', onSelect: () => onLaunchRoute('/photopea') },
      { id: 'page-gallery', title: 'Gallery', subtitle: 'Switch page', keywords: 'gallery bộ sưu tập ảnh video âm thanh phương tiện media photos', type: 'page', onSelect: () => onLaunchRoute('/gallery') },
      { id: 'page-draws', title: 'Ink Canvas', subtitle: 'Switch page', keywords: 'ink canvas draws paint vẽ hội họa bút cọ sketch ms paint canvas', type: 'page', onSelect: () => onLaunchRoute('/draws') },
      { id: 'page-notes', title: 'Notes', subtitle: 'Switch page', keywords: 'ghi chú soạn thảo notes office', type: 'page', onSelect: () => onLaunchRoute('/notes') },
      { id: 'page-screenbox', title: 'Screenbox', subtitle: 'Switch page', keywords: 'screenbox screenbug vlc media player phát video âm thanh stream disc network equalizer open url', type: 'page', onSelect: () => onLaunchRoute('/screenbox') },
      { id: 'page-camera', title: 'Camera', subtitle: 'Switch page', keywords: 'camera máy ảnh chụp ảnh camera rolls webcam snapshot photo insider', type: 'page', onSelect: () => onLaunchRoute('/camera') },
      { id: 'page-html-writer', title: 'HTML Writer', subtitle: 'Switch page', keywords: 'html writer code editor css js preview winui 3 viet chay html', type: 'page', onSelect: () => onLaunchRoute('/html-writer') },
      { id: 'page-pc-settings', title: 'PC Settings', subtitle: 'Switch page', keywords: 'pc settings windows 11 system bluetooth network personalization windows update', type: 'page', onSelect: () => onLaunchRoute('/pc-settings') },
      { id: 'page-settings', title: 'Settings', subtitle: 'Switch page', keywords: 'cài đặt hệ thống settings preferences', type: 'page', onSelect: () => onLaunchRoute('/settings') },
      {
        id: 'flag-theme-toggle',
        title: 'Dark / Light Mode',
        subtitle: 'System Setting',
        keywords: 'dark light mode theme sáng tối giao diện ban đêm ban ngày',
        type: 'setting-toggle',
        customToggle: {
          checked: settings.theme === 'light',
          onToggle: () => updateSetting('theme', settings.theme === 'light' ? 'dark' : 'light'),
        },
        onSelect: () => onLaunchRoute('/settings'),
      },
      {
        id: 'flag-windows-mode',
        title: 'Windows Mode (Vive)',
        subtitle: 'Vive Feature',
        keywords: 'windows mode windows 11 taskbar start menu floating window desktop wallpaper vive velocity',
        type: 'setting-toggle',
        settingKey: 'windowsMode',
        onSelect: () => onLaunchRoute('/settings'),
      },
      {
        id: 'tool-direct-command',
        title: 'Direct Command',
        subtitle: 'Command Prompt UI',
        keywords: 'direct command cmd terminal prompt cli vivetool session taskbar',
        type: 'tool',
        logo: '/assets/aistudio/direct_command_6240d59d.png',
        onSelect: () => window.dispatchEvent(new CustomEvent('vplay:open-direct-command')),
      },
      {
        id: 'flag-spatial-glass',
        title: 'Spatial Glass & Blur (Acrylic)',
        subtitle: 'System Setting',
        keywords: 'settings spatial glass acrylic blur kính mờ hiệu ứng mờ',
        type: 'setting-toggle',
        settingKey: 'spatialGlass',
        onSelect: () => onLaunchRoute('/settings'),
      },
      {
        id: 'flag-super-dark',
        title: 'Super Dark Mode (OLED Black)',
        subtitle: 'System Setting',
        keywords: 'settings super dark mode oled black đen hoàn toàn',
        type: 'setting-toggle',
        settingKey: 'superDarkMode',
        onSelect: () => onLaunchRoute('/settings'),
      },
      {
        id: 'action-toggle-sticky-widget',
        title: 'Sticky Note Widget',
        subtitle: 'Direct Action',
        keywords: 'sticky note stickies ghi chú dán mở stickies',
        type: 'setting-toggle',
        customToggle: {
          checked: isStickyVisible,
          onToggle: () => toggleSticky(),
        },
        onSelect: () => onLaunchRoute('/notes'),
      },
      {
        id: 'action-create-new-note',
        title: 'Tạo ghi chú mới (Create Note)',
        subtitle: 'Direct Action',
        keywords: 'tạo ghi chú mới create note new note notion apple notes',
        type: 'setting-action',
        customAction: {
          label: '+ Tạo note',
          onAction: () => {
            createNote('Ghi chú mới', '<p></p>');
            onLaunchRoute('/notes');
            setIsSearchOpen(false);
          },
        },
        onSelect: () => {
          createNote('Ghi chú mới', '<p></p>');
          onLaunchRoute('/notes');
        },
      },
      {
        id: 'flag-native-keyboard',
        title: 'Touch keyboard',
        subtitle: 'Insider Flags',
        keywords: 'insider flags experimental touch keyboard native keyboard on-screen keyboard bàn phím cảm ứng',
        type: 'setting-toggle',
        settingKey: 'nativeKeyboard',
        onSelect: () => onLaunchRoute('/test'),
      },
      {
        id: 'flag-fluent-icons',
        title: 'Fluent icons (3D)',
        subtitle: 'Insider Flags',
        keywords: 'insider flags experimental fluent icons 3d icon biểu tượng',
        type: 'setting-toggle',
        settingKey: 'fluentIcons',
        onSelect: () => onLaunchRoute('/test'),
      },
      {
        id: 'flag-developer-mode',
        title: 'Developer Mode',
        subtitle: 'Insider Flags',
        keywords: 'developer mode chế độ nhà phát triển debug',
        type: 'setting-toggle',
        settingKey: 'developerMode',
        onSelect: () => onLaunchRoute('/test'),
      },
      {
        id: 'tool-discord',
        title: 'Discord Community',
        subtitle: 'Switch page',
        keywords: 'community discord sparkle',
        type: 'tool',
        onSelect: () => window.open('https://discord.gg/wcdjaDDayK', '_blank'),
      },
    ];

    (channels || []).forEach((ch) => {
      aspects.push({
        id: `channel-${ch.id}`,
        title: ch.name,
        subtitle: ch.category || 'Live Channel',
        keywords: `${ch.category} ${ch.shortName || ''} ${ch.slug}`,
        type: 'channel',
        logo: ch.logo,
        onSelect: () => {
          onSelectChannel(ch);
          onLaunchRoute(`/live-tv?channel=${ch.slug}`);
        },
      });
    });

    NEWS_DATA.forEach((art) => {
      aspects.push({
        id: `article-${art.id}`,
        title: art.title,
        subtitle: 'Sparkle News',
        keywords: `${art.category} ${art.excerpt || ''}`,
        type: 'news',
        onSelect: () => onLaunchRoute(`/article/${art.id}`),
      });
    });

    (notes || []).forEach((note) => {
      const plainText = stripHtml(note.content).trim();
      aspects.push({
        id: `note-${note.id}`,
        title: note.title.trim() || 'Ghi chú không có tiêu đề',
        subtitle: `Note • ${formatRelativeTime(note.updatedAt)}`,
        keywords: `note notes ghi chú notion apple notes ${plainText}`,
        type: 'note',
        customAction: {
          label: 'Mở',
          onAction: () => {
            setActiveNoteId(note.id);
            saveToHistory(note.title, { subtitle: 'Note', type: 'note' });
            onLaunchRoute('/notes');
            setIsSearchOpen(false);
          },
        },
        onSelect: () => {
          setActiveNoteId(note.id);
          saveToHistory(note.title, { subtitle: 'Note', type: 'note' });
          onLaunchRoute('/notes');
        },
      });
    });

    (galleryItems || []).forEach((media) => {
      aspects.push({
        id: `gallery-${media.id}`,
        title: media.title,
        subtitle:
          media.type === 'document'
            ? 'Gallery Document'
            : media.type === 'video'
            ? 'Gallery Video'
            : media.type === 'audio'
            ? 'Gallery Audio'
            : 'Gallery Image',
        keywords: `gallery ${media.type} ${media.tags ? media.tags.join(' ') : ''} ${media.description || ''}`,
        type: 'gallery',
        logo: media.thumbnailUrl || (media.type === 'image' ? media.url : undefined),
        customAction: {
          label: 'Xem',
          onAction: () => {
            saveToHistory(media.title, { subtitle: 'Gallery', type: 'gallery' });
            onLaunchRoute(`/gallery?preview=${encodeURIComponent(media.id)}`);
            setIsSearchOpen(false);
          },
        },
        onSelect: () => {
          saveToHistory(media.title, { subtitle: 'Gallery', type: 'gallery' });
          onLaunchRoute(`/gallery?preview=${encodeURIComponent(media.id)}`);
        },
      });
    });

    return aspects;
  }, [
    channels,
    onLaunchRoute,
    onSelectChannel,
    settings,
    updateSetting,
    isStickyVisible,
    toggleSticky,
    createNote,
    notes,
    galleryItems,
    setActiveNoteId,
  ]);

  // Trending searches shown when input is empty & history is empty (matching TopBar.tsx)
  const trendingSearchItems: SearchAspectItem[] = useMemo(() => {
    return [
      {
        id: 'trending-vtv1-hd',
        title: 'VTV1 HD',
        subtitle: 'Watch',
        type: 'channel' as const,
        onSelect: () => {
          const matched = channels.find(
            (c) =>
              c.slug.toLowerCase().includes('vtv1') ||
              c.name.toLowerCase().includes('vtv1') ||
              c.shortName?.toLowerCase().includes('vtv1')
          );
          if (matched) onSelectChannel(matched);
          saveToHistory('VTV1 HD', { subtitle: 'Watch', type: 'channel' });
          onLaunchRoute(`/live-tv?channel=${matched?.slug || 'vtv1-hd'}`);
          setIsSearchOpen(false);
          setShowAllResults(false);
        },
      },
      {
        id: 'trending-craftmine',
        title: 'The Craftmine',
        subtitle: 'Play',
        type: 'page' as const,
        onSelect: () => {
          saveToHistory('The Craftmine', { subtitle: 'Play', type: 'page' });
          onLaunchRoute('/craftmine');
          setIsSearchOpen(false);
          setShowAllResults(false);
        },
      },
      {
        id: 'trending-memories',
        title: 'View memories',
        subtitle: 'Gallery',
        type: 'page' as const,
        onSelect: () => {
          saveToHistory('View memories', { subtitle: 'Gallery', type: 'page' });
          onLaunchRoute('/gallery');
          setIsSearchOpen(false);
          setShowAllResults(false);
        },
      },
      {
        id: 'trending-settings',
        title: 'Flag experimental',
        subtitle: 'Settings',
        type: 'setting' as const,
        onSelect: () => {
          saveToHistory('Flag experimental', { subtitle: 'Settings', type: 'setting' });
          onLaunchRoute('/test');
          setIsSearchOpen(false);
          setShowAllResults(false);
        },
      },
    ];
  }, [channels, onLaunchRoute, onSelectChannel]);

  const searchResults: SearchAspectItem[] = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      if (searchHistory.length === 0) {
        return trendingSearchItems;
      }
      return searchHistory.map((hist, idx) => ({
        id: `history-${idx}`,
        title: hist.query,
        subtitle: hist.subtitle || 'Search history',
        type: 'history' as const,
        logo: hist.logo,
        timestamp: hist.timestamp,
        onSelect: () => {
          setSearchQuery(hist.query);
          saveToHistory(hist.query, {
            type: hist.type,
            logo: hist.logo,
            subtitle: hist.subtitle,
            timestamp: hist.timestamp,
          });
          const found =
            appAspects.find((a) => a.title.toLowerCase() === hist.query.toLowerCase()) ||
            trendingSearchItems.find((t) => t.title.toLowerCase() === hist.query.toLowerCase());
          if (found) {
            found.onSelect();
          }
          setIsSearchOpen(false);
          setShowAllResults(false);
        },
      }));
    }

    const matches: SearchAspectItem[] = [];

    searchHistory.forEach((hist, idx) => {
      if (hist.query.toLowerCase().includes(q)) {
        matches.push({
          id: `hist-match-${idx}`,
          title: hist.query,
          subtitle: hist.subtitle || 'Search history',
          type: 'history',
          logo: hist.logo,
          timestamp: hist.timestamp,
          onSelect: () => {
            saveToHistory(hist.query, {
              type: hist.type,
              logo: hist.logo,
              subtitle: hist.subtitle,
              timestamp: hist.timestamp,
            });
            const found =
              appAspects.find((a) => a.title.toLowerCase() === hist.query.toLowerCase()) ||
              trendingSearchItems.find((t) => t.title.toLowerCase() === hist.query.toLowerCase());
            if (found) found.onSelect();
            setIsSearchOpen(false);
            setShowAllResults(false);
          },
        });
      }
    });

    appAspects.forEach((item) => {
      if (item.title.toLowerCase().includes(q) || (item.keywords && item.keywords.toLowerCase().includes(q))) {
        matches.push(item);
      }
    });

    if (matches.length === 0 && q) {
      return [
        {
          id: 'web-google',
          title: 'Find on Google',
          subtitle: `Search "${searchQuery.trim()}" on Google`,
          type: 'web-search' as const,
          externalUrl: `https://www.google.com/search?q=${encodeURIComponent(searchQuery.trim())}`,
          onSelect: () => {
            window.open(`https://www.google.com/search?q=${encodeURIComponent(searchQuery.trim())}`, '_blank');
            saveToHistory(searchQuery.trim(), { subtitle: 'Find on Google', type: 'web-search' });
            setIsSearchOpen(false);
            setShowAllResults(false);
          },
        },
        {
          id: 'web-coccoc',
          title: 'Find on Cốc Cốc Search',
          subtitle: `Search "${searchQuery.trim()}" on Cốc Cốc`,
          type: 'web-search' as const,
          externalUrl: `https://coccoc.com/search?query=${encodeURIComponent(searchQuery.trim())}`,
          onSelect: () => {
            window.open(`https://coccoc.com/search?query=${encodeURIComponent(searchQuery.trim())}`, '_blank');
            saveToHistory(searchQuery.trim(), { subtitle: 'Find on Cốc Cốc Search', type: 'web-search' });
            setIsSearchOpen(false);
            setShowAllResults(false);
          },
        },
        {
          id: 'web-bing',
          title: 'Find on Bing',
          subtitle: `Search "${searchQuery.trim()}" on Bing`,
          type: 'web-search' as const,
          externalUrl: `https://www.bing.com/search?q=${encodeURIComponent(searchQuery.trim())}`,
          onSelect: () => {
            window.open(`https://www.bing.com/search?q=${encodeURIComponent(searchQuery.trim())}`, '_blank');
            saveToHistory(searchQuery.trim(), { subtitle: 'Find on Bing', type: 'web-search' });
            setIsSearchOpen(false);
            setShowAllResults(false);
          },
        },
      ];
    }

    return matches;
  }, [searchQuery, searchHistory, appAspects, trendingSearchItems]);

  const isWebSearch = Boolean(searchQuery.trim() && searchResults.length > 0 && searchResults[0]?.type === 'web-search');

  const handleClearAllWithAnimation = () => {
    if (isClearingHistory || searchHistory.length === 0) return;
    setIsClearingHistory(true);
    const count = showAllResults ? searchResults.length : Math.min(searchResults.length, 6);
    const totalDuration = Math.max(count * 45 + 260, 320);

    setTimeout(() => {
      clearAllHistory();
      setIsClearingHistory(false);
      setShowAllResults(false);
    }, totalDuration);
  };

  const handleSelectSearchResult = (item: SearchAspectItem) => {
    saveToHistory(item.title, { type: item.type, logo: item.logo, subtitle: item.subtitle });
    item.onSelect();
    setIsSearchOpen(false);
    setShowAllResults(false);
    setSearchQuery('');
  };

  const getRecentSearchIcon = (query: string, logo?: string) => {
    if (logo) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <img src={logo} alt="" className="w-6.5 h-6.5 object-contain rounded-[4px]" />
        </div>
      );
    }

    const q = query.trim().toLowerCase();
    const cleanQ = q.replace(/[-_\s]/g, '');

    const matchedChannel = channels.find((c) => {
      const cName = c.name.toLowerCase().replace(/[-_\s]/g, '');
      const cShort = c.shortName ? c.shortName.toLowerCase().replace(/[-_\s]/g, '') : '';
      const cSlug = c.slug.toLowerCase().replace(/[-_\s]/g, '');
      return (
        cleanQ === cName ||
        cleanQ === cSlug ||
        (cShort && cleanQ === cShort) ||
        cleanQ.includes(cName) ||
        (cShort && cleanQ.includes(cShort)) ||
        cName.includes(cleanQ) ||
        (cShort && cShort.includes(cleanQ))
      );
    });
    if (matchedChannel?.logo) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <img src={matchedChannel.logo} alt="" className="w-6.5 h-6.5 object-contain rounded-[4px]" />
        </div>
      );
    }

    if (q.includes('minecraft') || q.includes('craftmine') || q.includes('game') || q.includes('play') || q.includes('chơi')) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DCraftmineIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }
    if (q.includes('calculator') || q.includes('calc') || q.includes('máy tính') || q.includes('math')) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DCalculatorIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }
    if (q.includes('mail') || q.includes('calendar') || q.includes('email') || q.includes('outlook')) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DMailIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }
    if (q.includes('maps') || q.includes('map') || q.includes('bản đồ')) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DMapsIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }
    if (q.includes('notepad') || q.includes('notes') || q.includes('note') || q.includes('ghi chú')) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DNotesIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }
    if (q.includes('tv') || q.includes('watch') || q.includes('live') || q.includes('vtv') || q.includes('htv') || q.includes('stream')) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DWatchIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }
    if (q.includes('news') || q.includes('article') || q.includes('thời sự') || q.includes('tin tức') || q.includes('feed')) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DArticlesIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }
    if (q.includes('photo') || q.includes('gallery') || q.includes('image') || q.includes('ảnh') || q.includes('album') || q.includes('memories')) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DGalleryIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }
    if (q.includes('draw') || q.includes('paint') || q.includes('vẽ') || q.includes('sketch') || q.includes('canvas')) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DDrawsIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }
    if (q.includes('photopea') || q.includes('photoshop') || q.includes('psd')) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DPhotopeaIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }
    if (q.includes('screenbug') || q.includes('vlc') || q.includes('screenbox')) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DScreenbugIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }
    if (q.includes('setting') || q.includes('cài đặt') || q.includes('experimental') || q.includes('flag')) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DSettingsIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }
    if (q.includes('update') || q.includes('cập nhật')) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DUpdatesIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }
    if (q.includes('discord')) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DDiscordIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }
    if (q.includes('home') || q.includes('trang chủ')) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DHomeIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }

    return (
      <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
        <Fluent3DFolderSearchIcon className="w-7 h-7 drop-shadow-sm" />
      </div>
    );
  };

  const renderItemIcon = (item: SearchAspectItem) => {
    if (item.id === 'trending-vtv1-hd' || item.title === 'VTV1 HD') {
      const vtv1Logo =
        channels.find((c) => c.slug.includes('vtv1') || c.name.toLowerCase().includes('vtv1'))?.logo ||
        'https://img.vtvprime.vn/CK-rS1WbUz0mcRIodGxvvpqXiQB6XhphIkl2z7F_S_4/rs:fit:836:468/czM6Ly9wcmQtc24taW1hZ2VzL2NoYW5uZWwvM2ZlMDdhZmQtYzIyZS00M2QwLTgyZTgtOWNkMGUyYTc3ZTRkLnBuZw==.png';
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <img src={vtv1Logo} alt="VTV1 HD" className="w-7 h-7 object-contain rounded-[4px]" />
        </div>
      );
    }
    if (item.id === 'trending-craftmine' || item.title === 'The Craftmine') {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DCraftmineIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }
    if (item.id === 'trending-memories' || item.title === 'View memories') {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DGalleryIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }
    if (item.id === 'trending-settings' || item.title === 'Flag experimental') {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DSettingsIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }

    if (item.type === 'web-search') {
      if (item.id === 'web-google') {
        return (
          <div className="w-8.5 h-8.5 rounded-full bg-[#4285F4]/10 dark:bg-[#4285F4]/20 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
          </div>
        );
      }
      if (item.id === 'web-coccoc') {
        return (
          <div className="w-8.5 h-8.5 rounded-full bg-[#189947]/10 dark:bg-[#189947]/20 flex items-center justify-center shrink-0">
            <div className="w-6 h-6 rounded-full bg-[#189947] flex items-center justify-center text-white font-bold text-xs shadow-xs">
              C
            </div>
          </div>
        );
      }
      if (item.id === 'web-bing') {
        return (
          <div className="w-8.5 h-8.5 rounded-full bg-[#008373]/10 dark:bg-[#008373]/20 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#008373">
              <path d="M5 3v18l5.5-3.2L15 21l4-2.3V11l-8.5-3.2V3L5 3zm6 6.8l5 1.9v4.9l-2.4 1.4-2.6-1.5V9.8z" />
            </svg>
          </div>
        );
      }
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <div className="w-7 h-7 rounded-full bg-[#005fb8]/10 dark:bg-[#4cc2ff]/15 flex items-center justify-center text-[#005fb8] dark:text-[#4cc2ff] shadow-xs">
            <Globe className="w-4 h-4" />
          </div>
        </div>
      );
    }

    if (item.type === 'history') {
      return getRecentSearchIcon(item.title, item.logo);
    }

    if (item.logo) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <img src={item.logo} alt="" className="w-6.5 h-6.5 object-contain rounded-[4px]" />
        </div>
      );
    }

    if (item.type === 'note') {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DNotesIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }

    if (item.type === 'gallery') {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DGalleryIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }

    if (item.type === 'setting-toggle' || item.type === 'setting' || item.type === 'setting-action') {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DSettingsIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }

    if (item.type === 'news') {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DArticlesIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }

    if (item.type === 'channel') {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DWatchPreviewIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }

    return (
      <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
        <Fluent3DFolderSearchIcon className="w-7 h-7 drop-shadow-sm" />
      </div>
    );
  };

  const showTooltip = (label: string, e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverTooltip({ label, left: rect.left + rect.width / 2 });
  };

  return (
    <>
      {brightness < 100 && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[8000] bg-black"
          style={{ opacity: ((100 - brightness) / 100) * 0.72 }}
        />
      )}
      <footer
        id="windows-taskbar"
        role="region"
        aria-label="Windows Taskbar"
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setHoverTooltip(null);
          setTaskMenu(null);
          setTaskbarContextMenu({ x: e.clientX, y: e.clientY });
        }}
        style={{
          height: `${taskbarHeight}px`,
          backgroundColor: isLightMode ? 'rgba(226, 233, 243, 0.72)' : 'rgba(28, 30, 36, 0.76)',
          backdropFilter: 'blur(36px) saturate(165%)',
          WebkitBackdropFilter: 'blur(36px) saturate(165%)',
          border: 'none',
          outline: 'none',
          boxShadow: 'none',
        }}
        className="fixed bottom-0 inset-x-0 z-[9000] border-0 outline-none flex items-center justify-between px-2 sm:px-3 select-none text-[#111827] dark:text-white transition-[height] duration-200"
      >
        {/* 1. Left: Weather Widget (hidden on left when taskbar alignment is left so Start sits flush left) */}
        {!isLeftAligned && (
          <button
            id="btn-taskbar-weather"
            type="button"
            onClick={() => {
              onCloseDirectCommand();
              onLaunchRoute('/news');
            }}
            onMouseEnter={(e) => showTooltip('Weather & Feed', e)}
            onMouseLeave={() => setHoverTooltip(null)}
            className="hidden md:flex items-center gap-2.5 h-[38px] px-2.5 rounded-[6px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] active:scale-[0.98] transition-all cursor-pointer border-0 outline-none focus:outline-none shrink-0 text-left"
          >
            <svg
              id="windows-taskbar-weather-sun"
              className="w-6 h-6 shrink-0 fluent-3d-icon"
              viewBox="0 0 28 28"
              fill="none"
              stroke="none"
            >
              <defs>
                <radialGradient id="win11_sunny_grad" cx="40%" cy="35%" r="65%">
                  <stop offset="0%" stopColor="#FDE047" />
                  <stop offset="55%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#EA580C" />
                </radialGradient>
              </defs>
              <circle cx="14" cy="14" r="9" fill="url(#win11_sunny_grad)" stroke="none" strokeWidth={0} />
            </svg>
            <div className="leading-tight">
              <div className="text-[12px] font-medium">32°C</div>
              <div className="text-[11px] text-black/65 dark:text-white/70">Sunny</div>
            </div>
          </button>
        )}

        {/* 2. Main Cluster: Start + Search (Box or Button) + Task View + Taskbar App Icons */}
        <div
          className={`flex items-center gap-1 sm:gap-1.5 flex-1 min-w-0 max-w-full overflow-x-auto no-scrollbar ${
            isLeftAligned
              ? 'justify-start'
              : 'justify-center md:flex-none md:absolute md:left-1/2 md:-translate-x-1/2'
          }`}
        >
          {/* Start Button (Windows 11 4-pane blue logo) */}
          <button
            id="btn-taskbar-start"
            type="button"
            onClick={() => {
              setIsQuickSettingsOpen(false);
              setIsTrayOverflowOpen(false);
              setIsTaskViewOpen(false);
              setIsSearchOpen(false);
              onCloseDirectCommand();
              onToggleStartMenu();
            }}
            onMouseEnter={(e) => showTooltip('Start', e)}
            onMouseLeave={() => setHoverTooltip(null)}
            aria-label="Start"
            aria-expanded={isStartMenuOpen}
            className={`${btnSizeClass} rounded-[6px] flex items-center justify-center shrink-0 transition-all cursor-pointer border-none active:scale-90 ${
              isStartMenuOpen
                ? 'bg-black/10 dark:bg-white/[0.14]'
                : 'hover:bg-black/[0.06] dark:hover:bg-white/[0.08]'
            }`}
          >
            <img
              src="/assets/aistudio/image_24e205f4.png"
              alt="Start"
              draggable={false}
              className={`${startIconSizeClass} object-contain select-none pointer-events-none`}
            />
          </button>

          {/* Search Box or Search Icon Button based on taskbarSearchStyle */}
          <div ref={searchBoxRef} className="relative shrink-0">
            {isSearchButtonMode ? (
              <button
                id="windows-taskbar-search-btn"
                type="button"
                onClick={() => {
                  onCloseStartMenu();
                  onCloseDirectCommand();
                  setIsQuickSettingsOpen(false);
                  setIsTrayOverflowOpen(false);
                  setIsTaskViewOpen(false);
                  setIsSearchOpen((prev) => !prev);
                }}
                onMouseEnter={(e) => showTooltip('Search', e)}
                onMouseLeave={() => setHoverTooltip(null)}
                aria-label="Search"
                aria-expanded={isSearchOpen}
                className={`${btnSizeClass} rounded-[6px] flex items-center justify-center shrink-0 transition-all cursor-pointer border-none active:scale-90 ${
                  isSearchOpen
                    ? 'bg-black/10 dark:bg-white/[0.14]'
                    : 'hover:bg-black/[0.06] dark:hover:bg-white/[0.08]'
                }`}
              >
                <FluentSearchIcon className={`${appIconSizeClass} text-[#374151] dark:text-white/90 shrink-0`} />
              </button>
            ) : (
              <form
                id="windows-taskbar-search-box"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchQuery.trim() && searchResults.length > 0) {
                    handleSelectSearchResult(searchResults[0]);
                  } else {
                    setIsSearchOpen(true);
                  }
                }}
                style={{
                  backgroundColor: isLightMode
                    ? isSearchOpen
                      ? 'rgba(255, 255, 255, 0.85)'
                      : 'rgba(255, 255, 255, 0.80)'
                    : isSearchOpen
                    ? 'rgba(56, 59, 66, 0.85)'
                    : 'rgba(56, 59, 66, 0.80)',
                  border: 'none',
                  outline: 'none',
                  boxShadow: 'none',
                }}
                className={`${searchBoxHeightClass} w-[145px] sm:w-[205px] rounded-full flex items-center pl-3 pr-1 gap-2 transition-colors !border-0 !outline-none focus:!outline-none focus-within:!outline-none ring-0 focus-within:ring-0`}
              >
                <FluentSearchIcon className="w-[14px] h-[14px] text-[#374151] dark:text-white/90 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => {
                    onCloseStartMenu();
                    onCloseDirectCommand();
                    setIsQuickSettingsOpen(false);
                    setIsTrayOverflowOpen(false);
                    setIsTaskViewOpen(false);
                    setIsSearchOpen(true);
                  }}
                  onClick={() => {
                    onCloseStartMenu();
                    onCloseDirectCommand();
                    setIsSearchOpen(true);
                  }}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowAllResults(false);
                    setIsSearchOpen(true);
                  }}
                  placeholder="Search here"
                  className="flex-1 min-w-0 !bg-transparent text-[12.5px] text-[#111827] dark:text-white placeholder-[#4b5563] dark:placeholder-white/80 !outline-none focus:!outline-none !border-none !border-b-0 !shadow-none"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/15 cursor-pointer border-none bg-transparent"
                  >
                    <X className="w-3 h-3" />
                  </button>
                ) : (
                  <div
                    aria-hidden="true"
                    className="hidden sm:block w-[36px] h-[22px] rounded-full overflow-hidden shrink-0 border border-white/15 shadow-xs"
                  >
                    <img
                      src="/assets/aistudio/pink-nature-landscape-with-vegetation-flora_8a81cb83.jpg"
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </form>
            )}

            {/* Straight Slide-Up Search UI Card matching reference screenshot (no fade, no shadow, bottom Search input) */}
            {typeof document !== 'undefined' &&
              createPortal(
                <AnimatePresence>
                  {isSearchOpen && (
                    <motion.div
                      key="windows-taskbar-search-flyout-wrapper"
                      initial={settings.reduceAllMotion ? false : { y: '100%' }}
                      animate={{
                        y: '0%',
                        transition: settings.reduceAllMotion
                          ? { duration: 0 }
                          : { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
                      }}
                      exit={
                        settings.reduceAllMotion
                          ? undefined
                          : {
                              y: '100%',
                              transition: { duration: 0.26, ease: [0.4, 0, 0.2, 1] },
                            }
                      }
                      style={{ zIndex: 8990, paddingBottom: `${flyoutBottomOffset}px` }}
                      className={`fixed bottom-0 inset-x-0 flex px-3 pointer-events-none ${
                        isLeftAligned ? 'justify-center md:justify-start' : 'justify-center'
                      }`}
                    >
                      <div
                        ref={searchFlyoutRef}
                        id="windows-taskbar-search-flyout"
                        className="pointer-events-auto w-full max-w-[396px] rounded-[14px] border border-black/10 dark:border-white/[0.12] shadow-none overflow-hidden flex flex-col"
                      >
                        {/* Upper Frosted Results List */}
                        <div
                          style={{
                            backgroundColor: isLightMode ? 'rgba(235, 240, 248, 0.82)' : 'rgba(32, 35, 42, 0.84)',
                            backdropFilter: 'blur(36px) saturate(170%)',
                            WebkitBackdropFilter: 'blur(36px) saturate(170%)',
                          }}
                          className={`p-2 space-y-0.5 ${
                            showAllResults
                              ? 'max-h-[min(420px,calc(100vh-140px))] overflow-y-auto sidebar-scroller'
                              : 'max-h-[calc(100vh-140px)] overflow-hidden'
                          }`}
                        >
                          {(showAllResults ? searchResults : searchResults.slice(0, 6)).map((item, index) => {
                            const matchedChannelLogo =
                              item.logo ||
                              channels.find((c) => {
                                const q = item.title.trim().toLowerCase().replace(/[-_\s]/g, '');
                                return (
                                  q === c.name.toLowerCase().replace(/[-_\s]/g, '') ||
                                  q === c.slug.toLowerCase().replace(/[-_\s]/g, '')
                                );
                              })?.logo;

                            return (
                              <div
                                key={`${item.id}-${searchQuery}-${index}`}
                                onClick={() => !isClearingHistory && handleSelectSearchResult(item)}
                                title={item.title}
                                className="w-full min-h-[48px] px-3 py-2 rounded-[8px] flex items-center gap-3.5 text-left text-[#111827] dark:text-white hover:bg-black/[0.06] dark:hover:bg-white/[0.08] active:bg-black/[0.09] dark:active:bg-white/[0.12] transition-colors cursor-pointer group select-none"
                              >
                                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                                  {matchedChannelLogo ? (
                                    <img
                                      src={matchedChannelLogo}
                                      alt=""
                                      className="w-5 h-5 object-contain rounded-[3px]"
                                    />
                                  ) : (
                                    <Search className="w-[15px] h-[15px] text-black/75 dark:text-white/80" strokeWidth={1.75} />
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="search-result-title text-[13px] font-medium text-[#111827] dark:text-white truncate leading-[1.3]">
                                    <FluentEmojiText>{item.title}</FluentEmojiText>
                                  </div>
                                  <div className="text-[11.5px] font-normal text-black/60 dark:text-white/60 truncate leading-[1.25] mt-0.5">
                                    {item.type === 'history' && item.timestamp ? (
                                      <>
                                        {formatRelativeTime(item.timestamp)} •{' '}
                                        <FluentEmojiText>{item.subtitle || 'Search history'}</FluentEmojiText>
                                      </>
                                    ) : (
                                      <FluentEmojiText>{item.subtitle || 'Switch page'}</FluentEmojiText>
                                    )}
                                  </div>
                                </div>

                                {item.type === 'setting-toggle' && (item.settingKey || item.customToggle) && (
                                  <button
                                    type="button"
                                    role="switch"
                                    aria-checked={item.customToggle ? item.customToggle.checked : Boolean(settings[item.settingKey!])}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (item.customToggle) {
                                        item.customToggle.onToggle();
                                      } else if (item.settingKey) {
                                        const currentVal = Boolean(settings[item.settingKey]);
                                        const nextVal = !currentVal;
                                        updateSetting(item.settingKey, nextVal);
                                        showAppToast(nextVal ? `Enable ${item.title}` : `Disable ${item.title}`, { source: 'search' });
                                      }
                                    }}
                                    className="toggle-switch-btn shrink-0"
                                    title={
                                      (item.customToggle ? item.customToggle.checked : Boolean(settings[item.settingKey!]))
                                        ? 'Turn off'
                                        : 'Turn on'
                                    }
                                  >
                                    <span className="toggle-switch-thumb" />
                                  </button>
                                )}

                                {item.customAction && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      item.customAction!.onAction();
                                    }}
                                    className="px-2 py-0.5 rounded-[6px] bg-[#005fb8]/10 dark:bg-[#4cc2ff]/15 hover:bg-[#005fb8]/20 text-[#005fb8] dark:text-[#4cc2ff] text-[11px] font-semibold shrink-0 cursor-pointer border-none"
                                  >
                                    {item.customAction.label}
                                  </button>
                                )}

                                {item.type === 'web-search' && (
                                  <span className="text-[11px] px-2 py-0.5 rounded-[4px] bg-[#005fb8]/10 dark:bg-[#4cc2ff]/15 text-[#005fb8] dark:text-[#4cc2ff] font-medium shrink-0">
                                    Open tab
                                  </span>
                                )}

                                {item.type === 'history' && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeFromHistory(item.title);
                                    }}
                                    aria-label="Remove from history"
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full text-black/55 dark:text-white/60 hover:text-black dark:hover:text-white shrink-0 cursor-pointer border-none bg-transparent"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            );
                          })}

                          {/* Compact Show more / Clear all footer */}
                          {((!searchQuery.trim() && searchHistory.length > 0) ||
                            (searchQuery.trim() && searchResults.length > 6 && !isWebSearch)) && (
                            <div className="pt-1 pb-0.5 px-2.5 flex items-center justify-between text-[11px] text-black/55 dark:text-white/55 border-t border-black/[0.06] dark:border-white/[0.06] mt-1">
                              {searchResults.length > 6 ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowAllResults((prev) => !prev);
                                  }}
                                  className="text-[#005fb8] dark:text-[#4cc2ff] hover:underline font-medium cursor-pointer border-none bg-transparent"
                                >
                                  {showAllResults ? 'Show less' : `Show more (${searchResults.length})`}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onLaunchRoute('/search');
                                    setIsSearchOpen(false);
                                  }}
                                  className="text-[#005fb8] dark:text-[#4cc2ff] hover:underline font-medium cursor-pointer border-none bg-transparent"
                                >
                                  Spotlight
                                </button>
                              )}
                              {!searchQuery.trim() && searchHistory.length > 0 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleClearAllWithAnimation();
                                  }}
                                  disabled={isClearingHistory}
                                  className="hover:text-[#005fb8] dark:hover:text-[#4cc2ff] hover:underline font-medium cursor-pointer border-none bg-transparent"
                                >
                                  Clear all
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Bottom Search Input Strip matching reference screenshot */}
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (searchQuery.trim() && searchResults.length > 0) {
                              handleSelectSearchResult(searchResults[0]);
                            }
                          }}
                          style={{
                            backgroundColor: isLightMode ? 'rgba(255, 255, 255, 0.96)' : 'rgba(24, 26, 31, 0.96)',
                          }}
                          className="h-[46px] px-4 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center gap-2 shrink-0"
                        >
                          <input
                            ref={searchFlyoutInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                              setSearchQuery(e.target.value);
                              setShowAllResults(false);
                            }}
                            placeholder="Search"
                            className="flex-1 min-w-0 !bg-transparent text-[13.5px] text-[#111827] dark:text-white placeholder-black/55 dark:placeholder-white/55 !outline-none focus:!outline-none !border-none !shadow-none"
                          />
                          {searchQuery && (
                            <button
                              type="button"
                              onClick={() => {
                                setSearchQuery('');
                                searchFlyoutInputRef.current?.focus();
                              }}
                              aria-label="Clear search"
                              className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/15 cursor-pointer border-none bg-transparent text-black/60 dark:text-white/70"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </form>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>,
                document.body
              )}
          </div>

          {/* Task View / Open Windows Button (Windows 11 split dual-pane style) */}
          <div className="relative shrink-0">
            <button
              id="btn-taskbar-taskview"
              type="button"
              onClick={() => {
                onCloseStartMenu();
                onCloseDirectCommand();
                setIsSearchOpen(false);
                setIsTaskViewOpen((prev) => !prev);
              }}
              onMouseEnter={(e) => showTooltip('Task view', e)}
              onMouseLeave={() => setHoverTooltip(null)}
              aria-label="Task view"
              className={`${btnSizeClass} rounded-[6px] flex items-center justify-center transition-all cursor-pointer border-none active:scale-90 ${
                isTaskViewOpen
                  ? 'bg-white/55 dark:bg-white/[0.14]'
                  : 'hover:bg-black/[0.06] dark:hover:bg-white/[0.08]'
              }`}
            >
              <svg className={appIconSizeClass} viewBox="0 0 20 20" fill="none">
                <rect x="2.5" y="3.5" width="7.2" height="13" rx="1.6" fill="#0078D4" fillOpacity="0.88" />
                <rect x="10.3" y="3.5" width="7.2" height="13" rx="1.6" fill={isLightMode ? '#1F2937' : '#E5E7EB'} fillOpacity="0.45" />
              </svg>
            </button>

            {typeof document !== 'undefined' &&
              createPortal(
                <AnimatePresence>
                  {isTaskViewOpen && (
                    <motion.div
                      key="windows-taskbar-taskview-wrapper"
                      initial={settings.reduceAllMotion ? false : { y: '100%' }}
                      animate={{
                        y: '0%',
                        transition: settings.reduceAllMotion
                          ? { duration: 0 }
                          : { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
                      }}
                      exit={
                        settings.reduceAllMotion
                          ? undefined
                          : {
                              y: '100%',
                              transition: { duration: 0.26, ease: [0.4, 0, 0.2, 1] },
                            }
                      }
                      style={{ zIndex: 8990, paddingBottom: `${flyoutBottomOffset}px` }}
                      className={`fixed bottom-0 inset-x-0 flex px-3 pointer-events-none ${
                        isLeftAligned ? 'justify-center md:justify-start' : 'justify-center'
                      }`}
                    >
                      <div
                        ref={taskViewRef}
                        id="windows-taskbar-taskview-flyout"
                        style={{
                          backgroundColor: isLightMode ? 'rgba(235, 240, 248, 0.84)' : 'rgba(30, 32, 37, 0.88)',
                          backdropFilter: 'blur(36px) saturate(180%)',
                          WebkitBackdropFilter: 'blur(36px) saturate(180%)',
                        }}
                        className="pointer-events-auto w-full max-w-[360px] rounded-[14px] border border-black/10 dark:border-white/[0.12] shadow-none p-2.5"
                      >
                      <div className="flex items-center justify-between px-1.5 pb-2 mb-1.5 border-b border-black/10 dark:border-white/10">
                        <span className="text-[12px] font-semibold">Open Windows ({tabs.length})</span>
                        <button
                          type="button"
                          onClick={() => {
                            onCreateNewWindow('/');
                            setIsTaskViewOpen(false);
                          }}
                          className="h-6 px-2 rounded-[5px] bg-[#0078d4] text-white text-[11px] font-medium flex items-center gap-1 hover:bg-[#106ebe] cursor-pointer border-none"
                        >
                          <Plus className="w-3 h-3" />
                          <span>New window</span>
                        </button>
                      </div>
                      <div className="space-y-1 max-h-[260px] overflow-y-auto no-scrollbar">
                        {tabs.length === 0 ? (
                          <div className="py-5 text-center text-[12px] text-[#6b7280] dark:text-[#9ca3af]">
                            No open windows
                          </div>
                        ) : (
                          tabs.map((tab) => {
                            const ws = windowStates[tab.id];
                            const isWinActive = tab.id === activeTabId && !ws?.isMinimized;
                            return (
                              <div
                                key={tab.id}
                                className={`h-[38px] px-2 rounded-[7px] flex items-center justify-between gap-2 ${
                                  isWinActive
                                    ? 'bg-black/[0.08] dark:bg-white/[0.12]'
                                    : 'hover:bg-black/[0.05] dark:hover:bg-white/[0.07]'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    onTaskbarWindowClick(tab.id);
                                    setIsTaskViewOpen(false);
                                  }}
                                  className="flex items-center gap-2.5 flex-1 min-w-0 h-full text-left cursor-pointer border-none bg-transparent"
                                >
                                  <TabIcon route={tab.route} active={isWinActive} className="w-4 h-4 shrink-0" />
                                  <span className="text-[12.5px] font-medium truncate">{tab.title}</span>
                                  {ws?.isMinimized && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 text-[#6b7280] dark:text-[#9ca3af]">
                                      Minimized
                                    </span>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onCloseWindow(tab.id)}
                                  aria-label={`Close ${tab.title}`}
                                  className="w-6 h-6 rounded-[4px] flex items-center justify-center hover:bg-[#c42b1c] hover:text-white cursor-pointer border-none"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>,
                document.body
              )}
          </div>

          {/* Unified Draggable Taskbar App Icons (pinned + open windows) */}
          {orderedTaskbarSlots.map((slot) => {
            const isSlotDragged = draggedSlotKey === slot.key;
            const dropSide =
              taskbarDropTarget?.key === slot.key ? taskbarDropTarget.side : null;

            if (slot.kind === 'pinned') {
              const { pinned, matchingTabs } = slot;
              if (matchingTabs.length === 0) {
                return (
                  <div
                    key={slot.key}
                    role="button"
                    tabIndex={0}
                    draggable
                    onClick={() => {
                      if (!draggedSlotKey) {
                        onCloseStartMenu();
                        onCloseDirectCommand();
                        setIsSearchOpen(false);
                        onLaunchRoute(pinned.route);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onCloseStartMenu();
                        onCloseDirectCommand();
                        setIsSearchOpen(false);
                        onLaunchRoute(pinned.route);
                      }
                    }}
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', slot.key);
                      setHoverTooltip(null);
                      setDraggedSlotKey(slot.key);
                    }}
                    onDragOver={(e) => {
                      if (!draggedSlotKey || draggedSlotKey === slot.key) return;
                      e.preventDefault();
                      const rect = e.currentTarget.getBoundingClientRect();
                      const side = e.clientX < rect.left + rect.width / 2 ? 'before' : 'after';
                      setTaskbarDropTarget({ key: slot.key, side });
                    }}
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        setTaskbarDropTarget((prev) => (prev?.key === slot.key ? null : prev));
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const side =
                        taskbarDropTarget?.key === slot.key ? taskbarDropTarget.side : 'before';
                      handleTaskbarSlotDrop(slot.key, side);
                      setDraggedSlotKey(null);
                      setTaskbarDropTarget(null);
                    }}
                    onDragEnd={() => {
                      setDraggedSlotKey(null);
                      setTaskbarDropTarget(null);
                    }}
                    onMouseEnter={(e) => !draggedSlotKey && showTooltip(pinned.title, e)}
                    onMouseLeave={() => setHoverTooltip(null)}
                    aria-label={pinned.title}
                    className={`relative ${btnSizeClass} rounded-[6px] flex items-center justify-center shrink-0 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] active:scale-90 transition-all cursor-pointer border-0 outline-none select-none ${
                      isSlotDragged ? 'opacity-45 scale-90' : ''
                    }`}
                  >
                    {dropSide === 'before' && (
                      <span className="absolute -left-[2px] top-1.5 bottom-1.5 w-[2.5px] rounded-full bg-[#0078d4] dark:bg-[#4cc2ff] pointer-events-none" />
                    )}
                    {dropSide === 'after' && (
                      <span className="absolute -right-[2px] top-1.5 bottom-1.5 w-[2.5px] rounded-full bg-[#0078d4] dark:bg-[#4cc2ff] pointer-events-none" />
                    )}
                    <TabIcon route={pinned.route} className={`${appIconSizeClass} shrink-0`} />
                  </div>
                );
              }

              return matchingTabs.map((tab, tabIdx) => {
                const ws = windowStates[tab.id];
                const isFocused = tab.id === activeTabId && !ws?.isMinimized;
                return (
                  <div
                    key={tab.id}
                    role="button"
                    tabIndex={0}
                    draggable
                    onClick={() => {
                      if (!draggedSlotKey) {
                        onCloseStartMenu();
                        onCloseDirectCommand();
                        setIsSearchOpen(false);
                        onTaskbarWindowClick(tab.id);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onCloseStartMenu();
                        onCloseDirectCommand();
                        setIsSearchOpen(false);
                        onTaskbarWindowClick(tab.id);
                      }
                    }}
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', slot.key);
                      setHoverTooltip(null);
                      setDraggedSlotKey(slot.key);
                    }}
                    onDragOver={(e) => {
                      if (!draggedSlotKey || draggedSlotKey === slot.key) return;
                      e.preventDefault();
                      const rect = e.currentTarget.getBoundingClientRect();
                      const side = e.clientX < rect.left + rect.width / 2 ? 'before' : 'after';
                      setTaskbarDropTarget({ key: slot.key, side });
                    }}
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        setTaskbarDropTarget((prev) => (prev?.key === slot.key ? null : prev));
                      }
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const side =
                        taskbarDropTarget?.key === slot.key ? taskbarDropTarget.side : 'before';
                      handleTaskbarSlotDrop(slot.key, side);
                      setDraggedSlotKey(null);
                      setTaskbarDropTarget(null);
                    }}
                    onDragEnd={() => {
                      setDraggedSlotKey(null);
                      setTaskbarDropTarget(null);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setTaskMenu({ tabId: tab.id, x: e.clientX, y: e.clientY });
                    }}
                    onMouseEnter={(e) => !draggedSlotKey && showTooltip(tab.title, e)}
                    onMouseLeave={() => setHoverTooltip(null)}
                    aria-label={tab.title}
                    className={`relative ${btnSizeClass} rounded-[6px] flex items-center justify-center shrink-0 transition-all cursor-pointer border-0 outline-none active:scale-90 select-none ${
                      isFocused
                        ? 'bg-black/[0.08] dark:bg-white/[0.12]'
                        : 'hover:bg-black/[0.06] dark:hover:bg-white/[0.08]'
                    } ${isSlotDragged ? 'opacity-45 scale-90' : ''}`}
                  >
                    {tabIdx === 0 && dropSide === 'before' && (
                      <span className="absolute -left-[2px] top-1.5 bottom-1.5 w-[2.5px] rounded-full bg-[#0078d4] dark:bg-[#4cc2ff] pointer-events-none" />
                    )}
                    {tabIdx === matchingTabs.length - 1 && dropSide === 'after' && (
                      <span className="absolute -right-[2px] top-1.5 bottom-1.5 w-[2.5px] rounded-full bg-[#0078d4] dark:bg-[#4cc2ff] pointer-events-none" />
                    )}
                    <TabIcon route={tab.route} active={isFocused} className={`${appIconSizeClass} shrink-0`} />
                    <span
                      className={`absolute bottom-[2px] left-1/2 -translate-x-1/2 h-[3px] rounded-full transition-all duration-200 ${
                        isFocused
                          ? 'w-[16px] bg-[#0078d4] dark:bg-[#4cc2ff]'
                          : 'w-[6px] bg-black/40 dark:bg-white/50'
                      }`}
                    />
                  </div>
                );
              });
            }

            const { tab } = slot;
            const ws = windowStates[tab.id];
            const isFocused = tab.id === activeTabId && !ws?.isMinimized;
            return (
              <div
                key={slot.key}
                role="button"
                tabIndex={0}
                draggable
                onClick={() => {
                  if (!draggedSlotKey) {
                    onCloseStartMenu();
                    onCloseDirectCommand();
                    setIsSearchOpen(false);
                    onTaskbarWindowClick(tab.id);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onCloseStartMenu();
                    onCloseDirectCommand();
                    setIsSearchOpen(false);
                    onTaskbarWindowClick(tab.id);
                  }
                }}
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', slot.key);
                  setHoverTooltip(null);
                  setDraggedSlotKey(slot.key);
                }}
                onDragOver={(e) => {
                  if (!draggedSlotKey || draggedSlotKey === slot.key) return;
                  e.preventDefault();
                  const rect = e.currentTarget.getBoundingClientRect();
                  const side = e.clientX < rect.left + rect.width / 2 ? 'before' : 'after';
                  setTaskbarDropTarget({ key: slot.key, side });
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setTaskbarDropTarget((prev) => (prev?.key === slot.key ? null : prev));
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const side =
                    taskbarDropTarget?.key === slot.key ? taskbarDropTarget.side : 'before';
                  handleTaskbarSlotDrop(slot.key, side);
                  setDraggedSlotKey(null);
                  setTaskbarDropTarget(null);
                }}
                onDragEnd={() => {
                  setDraggedSlotKey(null);
                  setTaskbarDropTarget(null);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setTaskMenu({ tabId: tab.id, x: e.clientX, y: e.clientY });
                }}
                onMouseEnter={(e) => !draggedSlotKey && showTooltip(tab.title, e)}
                onMouseLeave={() => setHoverTooltip(null)}
                aria-label={tab.title}
                className={`relative ${btnSizeClass} rounded-[6px] flex items-center justify-center shrink-0 transition-all cursor-pointer border-0 outline-none active:scale-90 select-none ${
                  isFocused
                    ? 'bg-black/[0.08] dark:bg-white/[0.12]'
                    : 'hover:bg-black/[0.06] dark:hover:bg-white/[0.08]'
                } ${isSlotDragged ? 'opacity-45 scale-90' : ''}`}
              >
                {dropSide === 'before' && (
                  <span className="absolute -left-[2px] top-1.5 bottom-1.5 w-[2.5px] rounded-full bg-[#0078d4] dark:bg-[#4cc2ff] pointer-events-none" />
                )}
                {dropSide === 'after' && (
                  <span className="absolute -right-[2px] top-1.5 bottom-1.5 w-[2.5px] rounded-full bg-[#0078d4] dark:bg-[#4cc2ff] pointer-events-none" />
                )}
                <TabIcon route={tab.route} active={isFocused} className={`${appIconSizeClass} shrink-0`} />
                <span
                  className={`absolute bottom-[2px] left-1/2 -translate-x-1/2 h-[3px] rounded-full transition-all duration-200 ${
                    isFocused
                      ? 'w-[16px] bg-[#0078d4] dark:bg-[#4cc2ff]'
                      : 'w-[6px] bg-black/40 dark:bg-white/50'
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* 3. Right System Tray: ^ Overflow, Wi-Fi + Volume (Control Center), Clock + Date, Direct Command, Show Desktop */}
          <div className="flex items-center gap-0 shrink-0 h-full">
          {isLeftAligned && (
            <button
              id="btn-taskbar-weather"
              type="button"
              onClick={() => {
                onCloseDirectCommand();
                onLaunchRoute('/news');
              }}
              onMouseEnter={(e) => showTooltip('Weather & Feed', e)}
              onMouseLeave={() => setHoverTooltip(null)}
              className="hidden lg:flex items-center gap-2 h-[34px] px-2 rounded-[5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] active:scale-[0.98] transition-all cursor-pointer border-0 outline-none focus:outline-none shrink-0 text-left mr-0.5"
            >
              <svg
                id="windows-taskbar-weather-sun"
                className="w-5 h-5 shrink-0 fluent-3d-icon"
                viewBox="0 0 28 28"
                fill="none"
                stroke="none"
              >
                <defs>
                  <radialGradient id="win11_sunny_grad_tray" cx="40%" cy="35%" r="65%">
                    <stop offset="0%" stopColor="#FDE047" />
                    <stop offset="55%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#EA580C" />
                  </radialGradient>
                </defs>
                <circle cx="14" cy="14" r="9" fill="url(#win11_sunny_grad_tray)" stroke="none" strokeWidth={0} />
              </svg>
              <span className="text-[11.5px] font-medium">32°C</span>
            </button>
          )}

          <div className="relative hidden sm:block">
            <button
              id="btn-taskbar-tray-overflow"
              type="button"
              onClick={() => {
                onCloseDirectCommand();
                setIsQuickSettingsOpen(false);
                setIsTrayOverflowOpen((prev) => !prev);
              }}
              aria-label="Show hidden icons"
              className="w-7 h-[34px] rounded-[5px] flex items-center justify-center hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors cursor-pointer border-none"
            >
              <ChevronUp className={`w-3.5 h-3.5 transition-transform ${isTrayOverflowOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isTrayOverflowOpen && (
                <motion.div
                  ref={trayOverflowRef}
                  initial={{ opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.96 }}
                  transition={{ duration: 0.14 }}
                  style={{
                    bottom: `${flyoutBottomOffset}px`,
                    backgroundColor: isLightMode ? 'rgba(245, 245, 247, 0.92)' : 'rgba(30, 32, 37, 0.92)',
                    backdropFilter: 'blur(28px)',
                  }}
                  className="fixed right-12 w-[195px] p-1.5 rounded-[10px] border border-black/10 dark:border-white/[0.12] shadow-2xl space-y-0.5 z-[9500]"
                >
                  <button
                    type="button"
                    onClick={() => {
                      updateSetting('nativeKeyboard', !settings.nativeKeyboard);
                      setIsTrayOverflowOpen(false);
                    }}
                    className="w-full h-8 px-2.5 rounded-[6px] flex items-center gap-2.5 text-[12px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer text-left border-none"
                  >
                    <Keyboard className="w-3.5 h-3.5" />
                    <span>{settings.nativeKeyboard ? 'Hide touch keyboard' : 'Touch keyboard'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onLaunchRoute('/settings');
                      setIsTrayOverflowOpen(false);
                    }}
                    className="w-full h-8 px-2.5 rounded-[6px] flex items-center gap-2.5 text-[12px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer text-left border-none"
                  >
                    <SettingsIcon className="w-3.5 h-3.5" />
                    <span>Windows Mode Settings</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateSetting('windowsMode', false);
                      setIsTrayOverflowOpen(false);
                    }}
                    className="w-full h-8 px-2.5 rounded-[6px] flex items-center gap-2.5 text-[12px] text-[#c42b1c] dark:text-[#ff99a4] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer text-left border-none"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Exit Windows Mode</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <button
              id="btn-taskbar-quick-settings"
              type="button"
              onClick={() => {
                onCloseDirectCommand();
                setIsTrayOverflowOpen(false);
                setIsQuickSettingsOpen((prev) => !prev);
              }}
              aria-label="Quick settings"
              className={`h-[34px] px-2 rounded-[5px] flex items-center gap-2 transition-colors cursor-pointer border-none ${
                isQuickSettingsOpen
                  ? 'bg-black/10 dark:bg-white/[0.14]'
                  : 'hover:bg-black/[0.06] dark:hover:bg-white/[0.08]'
              }`}
            >
              <Wifi className="w-3.5 h-3.5" />
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            <AnimatePresence>
              {isQuickSettingsOpen && (
                <motion.div
                  ref={quickSettingsRef}
                  initial={settings.reduceAllMotion ? false : { x: '110%', opacity: 0 }}
                  animate={{
                    x: 0,
                    opacity: 1,
                    transition: settings.reduceAllMotion
                      ? { duration: 0 }
                      : { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
                  }}
                  exit={
                    settings.reduceAllMotion
                      ? undefined
                      : {
                          x: '110%',
                          opacity: 0,
                          transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
                        }
                  }
                  style={{
                    bottom: `${flyoutBottomOffset}px`,
                  }}
                  className="windows-mica-frame fixed right-3 w-[300px] rounded-[12px] border border-black/10 dark:border-white/[0.12] shadow-2xl p-3.5 space-y-3 z-[9500]"
                >
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => updateSetting('theme', settings.theme === 'light' ? 'dark' : 'light')}
                      className={`h-[56px] rounded-[8px] flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors cursor-pointer border ${
                        settings.theme === 'light'
                          ? `bg-[#0078d4] ${isLightMode ? 'text-white' : 'text-black'} border-[#0078d4]`
                          : 'bg-black/[0.05] dark:bg-white/[0.08] border-black/[0.06] dark:border-white/[0.08] hover:bg-black/10 dark:hover:bg-white/[0.12]'
                      }`}
                    >
                      {settings.theme === 'light' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                      <span>{settings.theme === 'light' ? 'Light' : 'Dark'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateSetting('spatialGlass', !settings.spatialGlass)}
                      className={`h-[56px] rounded-[8px] flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors cursor-pointer border ${
                        settings.spatialGlass
                          ? `bg-[#0078d4] ${isLightMode ? 'text-white' : 'text-black'} border-[#0078d4]`
                          : 'bg-black/[0.05] dark:bg-white/[0.08] border-black/[0.06] dark:border-white/[0.08]'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Acrylic</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => updateSetting('windowsMode', false)}
                      className="h-[56px] rounded-[8px] flex flex-col items-center justify-center gap-1 text-[11px] font-medium bg-black/[0.05] dark:bg-white/[0.08] hover:bg-rose-500/20 border border-black/[0.06] dark:border-white/[0.08] transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Exit Win</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2.5 pt-1">
                    <Sun className="h-4 w-4 shrink-0" />
                    <input
                      type="range"
                      min={20}
                      max={100}
                      value={brightness}
                      onChange={(event) => setBrightness(Number(event.target.value))}
                      aria-label="Brightness"
                      className="flex-1 accent-[#0078d4] dark:accent-[#4cc2ff] cursor-pointer"
                    />
                    <span className="w-8 text-right text-[11px] tabular-nums">{brightness}%</span>
                  </div>

                  <div className="flex items-center gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsMuted((m) => !m)}
                      className="w-7 h-7 rounded-[5px] flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer border-none"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        setIsMuted(false);
                        setVolume(Number(e.target.value));
                      }}
                      aria-label="Volume"
                      className="flex-1 accent-[#0078d4] dark:accent-[#4cc2ff] cursor-pointer"
                    />
                    <span className="text-[11px] w-7 text-right tabular-nums">
                      {isMuted ? 0 : volume}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-0 shrink-0">
            <button
              id="btn-taskbar-clock-tray"
              type="button"
              onClick={() => {
                onCloseDirectCommand();
                setIsQuickSettingsOpen((prev) => !prev);
              }}
              className="h-[36px] pl-1 pr-0 rounded-[5px] flex flex-col items-end justify-center leading-[1.2] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors cursor-pointer border-none text-right shrink-0"
            >
              <span className={`${clockTextSizeClass} font-normal tabular-nums`}>{clockText.time}</span>
              <span className={`${clockTextSizeClass} font-normal tabular-nums`}>{clockText.date}</span>
            </button>

            {/* Direct Command icon placed tightly to the right next to Clock Tray */}
            <button
              id="btn-taskbar-direct-command"
              type="button"
              onClick={() => {
                onCloseStartMenu();
                setIsSearchOpen(false);
                setIsQuickSettingsOpen(false);
                setIsTrayOverflowOpen(false);
                setIsTaskViewOpen(false);
                onToggleDirectCommand();
              }}
              onMouseEnter={(e) => showTooltip('Direct Command', e)}
              onMouseLeave={() => setHoverTooltip(null)}
              aria-label="Direct Command"
              aria-expanded={isDirectCommandOpen}
              className={`${directCmdBtnSizeClass} rounded-[6px] flex items-center justify-center shrink-0 transition-all cursor-pointer border-none active:scale-90 ${
                isDirectCommandOpen
                  ? 'bg-black/10 dark:bg-white/[0.14]'
                  : 'hover:bg-black/[0.06] dark:hover:bg-white/[0.08]'
              }`}
            >
              <img
                src="/assets/aistudio/direct_command_6240d59d.png"
                alt="Direct Command"
                draggable={false}
                className={`${appIconSizeClass} object-contain select-none pointer-events-none`}
              />
            </button>
          </div>

          <button
            type="button"
            onClick={onShowDesktop}
            onMouseEnter={(e) => showTooltip('Show desktop', e)}
            onMouseLeave={() => setHoverTooltip(null)}
            aria-label="Show desktop"
            className="w-2 h-[34px] ml-0.5 rounded-[2px] border-l border-black/15 dark:border-white/15 hover:bg-black/10 dark:hover:bg-white/15 transition-colors cursor-pointer shrink-0"
          />
        </div>
      </footer>

      {/* WinUI 3 Acrylic Tooltip matching Sidebar tooltip */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {hoverTooltip && (
              <motion.div
                key="taskbar-hover-tooltip"
                role="tooltip"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                style={{
                  position: 'fixed',
                  bottom: `${flyoutBottomOffset}px`,
                  left: `${Math.max(48, Math.min(hoverTooltip.left, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 48))}px`,
                  transform: 'translateX(-50%)',
                  backgroundColor: isLightMode ? 'rgba(255, 255, 255, 0.50)' : 'rgba(24, 24, 28, 0.50)',
                  backdropFilter: 'blur(16px) saturate(140%)',
                  WebkitBackdropFilter: 'blur(16px) saturate(140%)',
                }}
                className="fluent-tooltip z-[2147483647] px-3 py-1.5 min-h-[30px] flex items-center rounded-[6px] text-[#111827] dark:text-white text-xs font-medium shadow-[0_4px_20px_rgba(0,0,0,0.18)] border-0 outline-none pointer-events-none whitespace-nowrap select-none"
              >
                {hoverTooltip.label}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {taskMenu && (
              <div
                key={`task-menu-${taskMenu.tabId}-${taskMenu.x}`}
                ref={taskMenuRef}
                data-windows-context-menu="true"
                style={{
                  position: 'fixed',
                  left: Math.max(8, Math.min(taskMenu.x, window.innerWidth - 190)),
                  bottom: `${taskbarHeight + 6}px`,
                  zIndex: 2147483647,
                  overflow: 'clip',
                }}
                className="fluent-context-menu-wrapper pointer-events-auto"
              >
                <motion.div {...contextMenuUpMotionProps}>
                  <div
                    role="menu"
                    style={flyoutPanelStyle}
                    className={`w-[180px] p-1 ${flyoutPanelClassName} fluent-context-menu shadow-none space-y-0.5 text-[#111827] dark:text-white`}
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onTaskbarWindowClick(taskMenu.tabId);
                        setTaskMenu(null);
                      }}
                      className="w-full h-8 px-2.5 rounded-[5px] flex items-center gap-2 text-[12px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer text-left border-none"
                    >
                      <Minus className="w-3.5 h-3.5" />
                      <span>{windowStates[taskMenu.tabId]?.isMinimized ? 'Restore' : 'Minimize'}</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onToggleMaximizeWindow(taskMenu.tabId);
                        setTaskMenu(null);
                      }}
                      className="w-full h-8 px-2.5 rounded-[5px] flex items-center gap-2 text-[12px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer text-left border-none"
                    >
                      <Square className="w-3.5 h-3.5" />
                      <span>{windowStates[taskMenu.tabId]?.isMaximized ? 'Restore size' : 'Maximize'}</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onDuplicateWindow(taskMenu.tabId);
                        setTaskMenu(null);
                      }}
                      className="w-full h-8 px-2.5 rounded-[5px] flex items-center gap-2 text-[12px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer text-left border-none"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>New window</span>
                    </button>
                    <div className="h-[1px] my-1 bg-black/10 dark:bg-white/10" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onCloseWindow(taskMenu.tabId);
                        setTaskMenu(null);
                      }}
                      className="w-full h-8 px-2.5 rounded-[5px] flex items-center gap-2 text-[12px] text-[#c42b1c] dark:text-[#ff99a4] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer text-left border-none"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Close window</span>
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

      <AnimatePresence>
        {taskbarContextMenu && (
          <WindowsContextMenu
            key={`tb-ctx-${taskbarContextMenu.x}-${taskbarContextMenu.y}`}
            x={taskbarContextMenu.x}
            y={taskbarContextMenu.y}
            ariaLabel="Taskbar actions"
            onClose={() => setTaskbarContextMenu(null)}
            items={[
              {
                id: 'tb-taskview',
                label: 'Task view',
                icon: <Layers className="w-4 h-4" />,
                onSelect: () => {
                  onCloseStartMenu();
                  setIsSearchOpen(false);
                  setIsTaskViewOpen((prev) => !prev);
                },
              },
              {
                id: 'tb-search',
                label: 'Search Sparkle',
                icon: <Search className="w-4 h-4" />,
                onSelect: () => {
                  onCloseStartMenu();
                  setIsSearchOpen(true);
                  setTimeout(() => {
                    searchFlyoutInputRef.current?.focus();
                  }, 50);
                },
              },
              {
                id: 'tb-show-desktop',
                label: 'Show the desktop',
                icon: <Monitor className="w-4 h-4" />,
                onSelect: onShowDesktop,
              },
              { id: 'tb-div-1', divider: true },
              {
                id: 'tb-touch-keyboard',
                label: 'Touch keyboard',
                icon: <Keyboard className="w-4 h-4" />,
                checked: Boolean(settings.nativeKeyboard),
                onSelect: () => updateSetting('nativeKeyboard', !settings.nativeKeyboard),
              },
              {
                id: 'tb-theme',
                label: isLightMode ? 'Dark mode' : 'Light mode',
                icon: isLightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />,
                onSelect: () => updateSetting('theme', isLightMode ? 'dark' : 'light'),
              },
              { id: 'tb-div-2', divider: true },
              {
                id: 'tb-settings',
                label: 'Taskbar settings',
                icon: <SettingsIcon className="w-4 h-4" />,
                onSelect: () => onLaunchRoute('/settings'),
              },
              {
                id: 'tb-exit-win',
                label: 'Exit Windows Mode',
                icon: <LogOut className="w-4 h-4" />,
                danger: true,
                onSelect: () => updateSetting('windowsMode', false),
              },
            ]}
          />
        )}
      </AnimatePresence>
    </>
  );
};
