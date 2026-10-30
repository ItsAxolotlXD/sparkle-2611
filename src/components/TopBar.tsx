import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  Menu, 
  History, 
  X, 
  ChevronRight, 
  ChevronUp,
  ChevronDown,
  Folder, 
  FileText, 
  Image as ImageIcon, 
  Search, 
  Tv, 
  Settings as SettingsIcon,
  Globe,
  ArrowLeft,
  BookOpen
} from 'lucide-react';
import { SpinningRing } from './SpinningRing';
import { 
  FluentHomeIcon, 
  FluentLiveTvIcon, 
  FluentWatchIcon,
  FluentNewsIcon, 
  FluentSearchIcon, 
  FluentCraftmineIcon,
  FluentGalleryIcon,
  FluentSettingsIcon,
  FLUENT_ICON_URLS 
} from './FluentIcons';
import { 
  Fluent3DSearchIcon,
  Fluent3DFolderSearchIcon,
  Fluent3DCraftmineIcon,
  Fluent3DWatchIcon,
  Fluent3DWatchPreviewIcon,
  Fluent3DArticlesIcon,
  Fluent3DGalleryIcon,
  Fluent3DDrawsIcon,
  Fluent3DPhotopeaIcon,
  Fluent3DNotesIcon,
  Fluent3DScreenbugIcon,
  Fluent3DVlcIcon,
  Fluent3DUpdatesIcon,
  Fluent3DSettingsIcon,
  Fluent3DDiscordIcon,
  Fluent3DUserIcon,
  Fluent3DHomeIcon,
  Fluent3DCalculatorIcon,
  Fluent3DMapsIcon,
  Fluent3DMailIcon
} from './Fluent3DIcons';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings, SystemSettings } from '../hooks/useSettings';
import { useIsMobile } from '../hooks/useIsMobile';
import { useNotes } from '../context/NotesContext';
import { Channel, NewsArticle } from '../types';
import { NEWS_DATA } from '../data/news';
import { galleryDB, GalleryMediaItem } from '../services/galleryStorage';
import { showAppToast } from '../utils/toast';

function stripHtml(html: string): string {
  return (html || '').replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
}

const HOME_ICON_SRC = FLUENT_ICON_URLS.home;
const TV_ICON_SRC = FLUENT_ICON_URLS.liveTv;
const NEWS_ICON_SRC = FLUENT_ICON_URLS.news;
const SETTINGS_ICON_SRC = 'https://static.wikia.nocookie.net/ftv/images/9/97/Settungs.png/revision/latest?cb=20260411085024&path-prefix=vi';

const DEFAULT_HISTORY_ITEMS = [
  'minecraft preview for windows',
  'mail and calendar',
  'calculator',
  'microsoft maps',
  'notepad',
  'watch live tv',
  'vtv1 hd thoi su 19h'
];

interface SearchAspectItem {
  id: string;
  title: string;
  subtitle?: string;
  type: 'history' | 'page' | 'channel' | 'news' | 'setting' | 'tool' | 'setting-toggle' | 'setting-action' | 'note' | 'gallery' | 'web-search';
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

interface TopBarProps {
  currentRoute: string;
  navigate: (route: string) => void;
  onOpenSearch: () => void;
  onOpenMobileMenu?: () => void;
  currentChannel?: Channel;
  channels?: Channel[];
  onSelectChannel?: (channel: Channel) => void;
  onOpenHelp?: () => void;
  onOpenDiscord?: () => void;
  onOpenSummarize?: (article: NewsArticle) => void;
  onOpenTextToSpeech?: (article: NewsArticle) => void;
  onOpenFindWords?: () => void;
  onOpenAddStream?: () => void;
  onImportChannels?: (channels: Channel[]) => void;
  onOpenNotifications?: () => void;
  fontSize?: number;
  onChangeFontSize?: (size: number) => void;
  showUnsavedTooltip?: boolean;
  onDismissUnsavedTooltip?: () => void;
  tabSearchQuery?: string;
  onTabSearchChange?: (query: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentRoute,
  navigate,
  onOpenSearch,
  onOpenMobileMenu,
  currentChannel,
  channels = [],
  onSelectChannel,
  onOpenHelp = () => {},
  onOpenDiscord = () => {},
  onOpenSummarize = (_art?: NewsArticle) => {},
  onOpenTextToSpeech = (_art?: NewsArticle) => {},
  onOpenFindWords = () => {},
  onOpenAddStream = () => {},
  onImportChannels = () => {},
  fontSize = 16,
  onChangeFontSize = () => {},
  showUnsavedTooltip = false,
  onDismissUnsavedTooltip = () => {},
  tabSearchQuery = '',
  onTabSearchChange
}) => {
  const { settings, hasChanges, applyDraftSettings, updateSetting } = useSettings();
  const { notes, setActiveNoteId, createNote, isStickyVisible, toggleSticky } = useNotes();
  const isLightMode = settings.theme === 'light';
  const searchFlyoutBg = isLightMode ? 'rgba(243, 243, 243, 0.90)' : 'rgba(27, 31, 36, 0.90)';
  const isMobile = useIsMobile();
  const [logoError, setLogoError] = useState(false);
  const [searchQuery, setSearchQuery] = useState(tabSearchQuery);
  const [isSearchFlyoutOpen, setIsSearchFlyoutOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showAllResults, setShowAllResults] = useState(false);
  const [galleryItems, setGalleryItems] = useState<GalleryMediaItem[]>([]);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [resultTitleTooltip, setResultTitleTooltip] = useState<{
    text: string;
    top: number;
    left: number;
    placement: 'top' | 'bottom';
  } | null>(null);

  const isArticlePage = currentRoute.startsWith('/news/') || currentRoute.startsWith('/article');
  const [isFindWordsMode, setIsFindWordsMode] = useState(false);
  const [findWordsTerm, setFindWordsTerm] = useState('');
  const [findWordsMatchCount, setFindWordsMatchCount] = useState(0);
  const [findWordsMatchIndex, setFindWordsMatchIndex] = useState(0);
  const findWordsInputRef = useRef<HTMLInputElement>(null);

  const clearArticleHighlights = useCallback(() => {
    const marks = document.querySelectorAll('mark.vplay-search-highlight');
    marks.forEach((mark) => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
        parent.normalize();
      }
    });
  }, []);

  const scrollArticleMatch = useCallback((index: number, markList?: NodeListOf<Element>) => {
    const marks = markList || document.querySelectorAll('mark.vplay-search-highlight');
    if (marks.length === 0) return;

    marks.forEach((m, idx) => {
      if (idx === index) {
        m.classList.add('ring-2', 'ring-[#4cc2ff]', 'bg-[#4cc2ff]', 'text-black');
        m.classList.remove('bg-amber-400');
        m.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        m.classList.remove('ring-2', 'ring-[#4cc2ff]', 'bg-[#4cc2ff]');
        m.classList.add('bg-amber-400', 'text-black');
      }
    });
  }, []);

  const highlightArticleText = useCallback((term: string) => {
    clearArticleHighlights();
    if (!term.trim() || term.length < 1) {
      setFindWordsMatchCount(0);
      setFindWordsMatchIndex(0);
      return;
    }

    const container = document.querySelector('article') || document.querySelector('main');
    if (!container) return;

    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');

    const walk = (node: Node) => {
      if (node.nodeType === 3) {
        const text = node.nodeValue;
        if (text && regex.test(text)) {
          const span = document.createElement('span');
          span.innerHTML = text.replace(regex, '<mark class="vplay-search-highlight bg-amber-400 text-black px-1 py-0.5 rounded font-bold shadow-sm">$1</mark>');
          node.parentNode?.replaceChild(span, node);
        }
      } else if (node.nodeType === 1 && node.nodeName !== 'SCRIPT' && node.nodeName !== 'STYLE' && node.nodeName !== 'INPUT') {
        Array.from(node.childNodes).forEach(walk);
      }
    };

    walk(container);

    const highlights = document.querySelectorAll('mark.vplay-search-highlight');
    setFindWordsMatchCount(highlights.length);
    if (highlights.length > 0) {
      setFindWordsMatchIndex(1);
      scrollArticleMatch(0, highlights);
    } else {
      setFindWordsMatchIndex(0);
    }
  }, [clearArticleHighlights, scrollArticleMatch]);

  const handleNextFindMatch = () => {
    if (findWordsMatchCount === 0) return;
    const nextIdx = findWordsMatchIndex >= findWordsMatchCount ? 1 : findWordsMatchIndex + 1;
    setFindWordsMatchIndex(nextIdx);
    scrollArticleMatch(nextIdx - 1);
  };

  const handlePrevFindMatch = () => {
    if (findWordsMatchCount === 0) return;
    const prevIdx = findWordsMatchIndex <= 1 ? findWordsMatchCount : findWordsMatchIndex - 1;
    setFindWordsMatchIndex(prevIdx);
    scrollArticleMatch(prevIdx - 1);
  };

  const handleExitFindWords = useCallback(() => {
    clearArticleHighlights();
    setFindWordsTerm('');
    setFindWordsMatchCount(0);
    setFindWordsMatchIndex(0);
    setIsFindWordsMode(false);
  }, [clearArticleHighlights]);

  useEffect(() => {
    if (!isArticlePage && isFindWordsMode) {
      handleExitFindWords();
    }
  }, [isArticlePage, isFindWordsMode, handleExitFindWords]);

  const handleResultMouseEnter = (title: string, e: React.MouseEvent<HTMLElement>) => {
    const currentTarget = e.currentTarget;
    const titleSpan = currentTarget.querySelector<HTMLElement>('.search-result-title');
    if (titleSpan && titleSpan.scrollWidth > titleSpan.clientWidth) {
      const rect = titleSpan.getBoundingClientRect();
      const isNearTop = rect.top < 45;
      setResultTitleTooltip({
        text: title,
        top: isNearTop ? rect.bottom + 6 : rect.top - 6,
        left: Math.max(16, Math.min(window.innerWidth - 16, rect.left + rect.width / 2)),
        placement: isNearTop ? 'bottom' : 'top',
      });
      return;
    }
    setResultTitleTooltip(null);
  };

  const handleResultMouseLeave = () => {
    setResultTitleTooltip(null);
  };

  useEffect(() => {
    if (!isSearchFlyoutOpen) {
      setResultTitleTooltip(null);
    }
  }, [isSearchFlyoutOpen]);

  // Synchronize searchQuery with current tab's search query
  useEffect(() => {
    setSearchQuery(tabSearchQuery || '');
  }, [tabSearchQuery, currentRoute]);

  // Listen for vplay:focus-topbar-search event to open search flyout and focus input
  useEffect(() => {
    const handleFocusTopBarSearch = () => {
      setIsSearchFlyoutOpen(true);
      setIsSearchFocused(true);
      const input = searchContainerRef.current?.querySelector('input');
      if (input) {
        input.focus();
        input.select();
      }
    };
    window.addEventListener('vplay:focus-topbar-search', handleFocusTopBarSearch);
    return () => window.removeEventListener('vplay:focus-topbar-search', handleFocusTopBarSearch);
  }, []);

  // Load gallery items so TopBar search can find gallery media/documents
  useEffect(() => {
    galleryDB.getAll().then(setGalleryItems).catch(() => {});
    const unsubscribe = galleryDB.subscribe(() => {
      galleryDB.getAll().then(setGalleryItems).catch(() => {});
    });
    return () => unsubscribe();
  }, []);

  interface SearchHistoryItem {
    query: string;
    type?: SearchAspectItem['type'];
    logo?: string;
    subtitle?: string;
    timestamp?: number;
  }

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

  // Search History from localStorage (supports string[] or SearchHistoryItem[])
  // When empty, Search UI displays "Trending searches". Once user searches and clicks an item, it stores in "Recent searches".
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('vone_search_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const now = Date.now();
          return parsed
            .map((item, idx) => {
              if (typeof item === 'string') {
                return { query: item, timestamp: now - (idx + 1) * 300000 };
              }
              const rawSubtitle = item.subtitle === 'Do action' ? 'Switch page' : item.subtitle;
              return {
                query: item.query || item.title || '',
                type: item.type,
                logo: item.logo,
                subtitle: rawSubtitle,
                timestamp: item.timestamp || (now - (idx + 1) * 300000),
              };
            })
            .filter((item) => Boolean(item.query.trim()));
        }
      }
    } catch {}
    return [];
  });

  const saveToHistory = (query: string, meta?: { type?: SearchAspectItem['type']; logo?: string; subtitle?: string; timestamp?: number }) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const now = Date.now();
    const cleanSubtitle = meta?.subtitle === 'Do action' ? 'Switch page' : meta?.subtitle;
    setSearchHistory((prev) => {
      const next = [
        { query: trimmed, type: meta?.type, logo: meta?.logo, subtitle: cleanSubtitle, timestamp: meta?.timestamp || now },
        ...prev.filter((item) => item.query.toLowerCase() !== trimmed.toLowerCase())
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

  const [isClearingHistory, setIsClearingHistory] = useState(false);

  const clearAllHistory = () => {
    setSearchHistory([]);
    try {
      localStorage.setItem('vone_search_history', JSON.stringify([]));
    } catch {}
  };

  const handleClearAllWithAnimation = () => {
    if (isClearingHistory || searchHistory.length === 0) return;
    setIsClearingHistory(true);
    const count = showAllResults ? searchResults.length : Math.min(searchResults.length, 4);
    const totalDuration = Math.max(count * 45 + 260, 320);

    setTimeout(() => {
      clearAllHistory();
      setIsClearingHistory(false);
      setShowAllResults(false);
    }, totalDuration);
  };

  // Close flyout on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFlyoutOpen(false);
        setShowAllResults(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchFlyoutOpen(false);
        setShowAllResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const isTopBarMode = settings.navigationMode === 'topbar';

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  const handleApplySettings = () => {
    applyDraftSettings();
    onDismissUnsavedTooltip();
  };

  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const handleSaveSettings = () => {
    if (isSavingSettings) return;
    setIsSavingSettings(true);
    setTimeout(() => {
      applyDraftSettings();
      setIsSavingSettings(false);
      window.dispatchEvent(new CustomEvent('settings-applied-toast'));
    }, 350);
  };

  // Pre-configured App Aspects (Pages, Settings, Tools) with exact original naming and subtitles matching Fluent Search UI
  const appAspects = useMemo(() => {
    const aspects: SearchAspectItem[] = [
      // Pages (Switch page)
      { id: 'page-home', title: 'Home', subtitle: 'Switch page', keywords: 'trang chủ home overview', type: 'page', onSelect: () => navigate('/') },
      { id: 'page-watch', title: 'Watch', subtitle: 'Switch page', keywords: 'live tv xem truyền hình trực tuyến watch', type: 'page', onSelect: () => navigate('/live-tv') },
      { id: 'page-news', title: 'Feed', subtitle: 'Switch page', keywords: 'tin tức bài viết news articles feed update blogs changelog cập nhật', type: 'page', onSelect: () => navigate('/news') },
      { id: 'page-channels', title: 'Channels', subtitle: 'Switch page', keywords: 'danh sách kênh channels channel directory', type: 'page', onSelect: () => navigate('/channels') },
      { id: 'page-favs', title: 'Favorites', subtitle: 'Switch page', keywords: 'kênh yêu thích favorites favs', type: 'page', onSelect: () => navigate('/favorites') },
      { id: 'page-craftmine', title: 'Craftmine', subtitle: 'Switch page', keywords: 'minecraft preview web game', type: 'page', onSelect: () => navigate('/craftmine') },
      { id: 'page-photopea', title: 'Photopea', subtitle: 'Switch page', keywords: 'photopea photoshop chỉnh sửa ảnh biên tập ảnh psd photo editor web app', type: 'page', onSelect: () => navigate('/photopea') },
      { id: 'page-gallery', title: 'Gallery', subtitle: 'Switch page', keywords: 'gallery bộ sưu tập ảnh video âm thanh phương tiện media photos', type: 'page', onSelect: () => navigate('/gallery') },
      { id: 'page-draws', title: 'Ink Canvas', subtitle: 'Switch page', keywords: 'ink canvas draws paint vẽ hội họa bút cọ sketch ms paint canvas', type: 'page', onSelect: () => navigate('/draws') },
      { id: 'page-notes', title: 'Notes', subtitle: 'Switch page', keywords: 'ghi chú soạn thảo notes office', type: 'page', onSelect: () => navigate('/notes') },
      { id: 'page-screenbox', title: 'Screenbox', subtitle: 'Switch page', keywords: 'screenbox screenbug vlc media player phát video âm thanh stream disc network equalizer open url', type: 'page', onSelect: () => navigate('/screenbox') },
      { id: 'page-camera', title: 'Camera', subtitle: 'Switch page', keywords: 'camera máy ảnh chụp ảnh camera rolls webcam snapshot photo insider', type: 'page', onSelect: () => navigate('/camera') },
      { id: 'page-settings', title: 'Settings', subtitle: 'Switch page', keywords: 'cài đặt hệ thống settings preferences', type: 'page', onSelect: () => navigate('/settings') },
      // All Interactive System Settings & Action Toggles (Search & execute right on Search UI)
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
        onSelect: () => navigate('/settings'),
      },
      {
        id: 'flag-aspect-toggle',
        title: 'Stream Aspect Ratio (16:9 / 4:3)',
        subtitle: 'System Setting',
        keywords: 'stream aspect ratio tỉ lệ khung hình 16:9 4:3',
        type: 'setting-toggle',
        customToggle: {
          checked: settings.streamAspectRatio === '4:3',
          onToggle: () => updateSetting('streamAspectRatio', settings.streamAspectRatio === '4:3' ? '16:9' : '4:3'),
        },
        onSelect: () => navigate('/settings'),
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
        onSelect: () => navigate('/notes'),
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
            navigate('/notes');
            setIsSearchFlyoutOpen(false);
          },
        },
        onSelect: () => {
          createNote('Ghi chú mới', '<p></p>');
          navigate('/notes');
          setIsSearchFlyoutOpen(false);
        },
      },
      {
        id: 'action-clear-search-history',
        title: 'Xóa lịch sử tìm kiếm (Clear History)',
        subtitle: 'Direct Action',
        keywords: 'xóa lịch sử tìm kiếm clear search history recent searches',
        type: 'setting-action',
        customAction: {
          label: 'X�����a ngay',
          onAction: () => {
            clearAllHistory();
            setIsSearchFlyoutOpen(false);
          },
        },
        onSelect: () => clearAllHistory(),
      },
      {
        id: 'flag-super-dark',
        title: 'Super Dark Mode (OLED Black)',
        subtitle: 'System Setting',
        keywords: 'settings super dark mode oled black đen hoàn toàn',
        type: 'setting-toggle',
        settingKey: 'superDarkMode',
        onSelect: () => navigate('/settings'),
      },
      {
        id: 'flag-spatial-glass',
        title: 'Spatial Glass & Blur (Acrylic)',
        subtitle: 'System Setting',
        keywords: 'settings spatial glass acrylic blur kính mờ hiệu ứng mờ',
        type: 'setting-toggle',
        settingKey: 'spatialGlass',
        onSelect: () => navigate('/settings'),
      },
      {
        id: 'flag-disable-shiny-outline',
        title: 'Disable Shiny Outline',
        subtitle: 'System Setting',
        keywords: 'disable shiny outline tắt viền bóng sáng',
        type: 'setting-toggle',
        settingKey: 'disableShinyOutline',
        onSelect: () => navigate('/settings'),
      },
      {
        id: 'flag-dock-sidebar',
        title: 'Dock to Sidebar',
        subtitle: 'System Setting',
        keywords: 'dock to sidebar ghim vào thanh bên',
        type: 'setting-toggle',
        settingKey: 'dockToSidebar',
        onSelect: () => navigate('/settings'),
      },
      {
        id: 'flag-autohide-sidebar',
        title: 'Auto-hide Side View',
        subtitle: 'System Setting',
        keywords: 'settings auto hide sidebar side view tự động thu gọn thanh bên',
        type: 'setting-toggle',
        settingKey: 'autoHideSidebar',
        onSelect: () => navigate('/settings'),
      },
      {
        id: 'flag-hover-expand',
        title: 'Hover to Expand Sidebar',
        subtitle: 'System Setting',
        keywords: 'hover to expand sidebar tự động mở rộng khi rê chuột',
        type: 'setting-toggle',
        settingKey: 'hoverToExpand',
        onSelect: () => navigate('/settings'),
      },
      {
        id: 'flag-floating-search',
        title: 'Floating Search Bar',
        subtitle: 'System Setting',
        keywords: 'settings floating search bar thanh tìm kiếm nổi',
        type: 'setting-toggle',
        settingKey: 'floatingSearchBar',
        onSelect: () => navigate('/settings'),
      },
      {
        id: 'flag-reduce-motion',
        title: 'Reduce All Motion',
        subtitle: 'System Setting',
        keywords: 'settings reduce all motion giảm chuyển động animation',
        type: 'setting-toggle',
        settingKey: 'reduceAllMotion',
        onSelect: () => navigate('/settings'),
      },
      {
        id: 'flag-animate-sidebar',
        title: 'Animate Sidebar',
        subtitle: 'System Setting',
        keywords: 'animate sidebar hiệu ứng chuyển động thanh bên',
        type: 'setting-toggle',
        settingKey: 'animateSidebar',
        onSelect: () => navigate('/settings'),
      },
      {
        id: 'flag-animate-modals',
        title: 'Animate Modals',
        subtitle: 'System Setting',
        keywords: 'animate modals hiệu ứng hộp thoại',
        type: 'setting-toggle',
        settingKey: 'animateModals',
        onSelect: () => navigate('/settings'),
      },
      {
        id: 'flag-animate-page-transitions',
        title: 'Animate Page Transitions',
        subtitle: 'System Setting',
        keywords: 'animate page transitions chuyển trang mượt mà',
        type: 'setting-toggle',
        settingKey: 'animatePageTransitions',
        onSelect: () => navigate('/settings'),
      },
      {
        id: 'flag-page-loading',
        title: 'Page Loading Screen',
        subtitle: 'System Setting',
        keywords: 'page loading screen màn hình chờ tải trang',
        type: 'setting-toggle',
        settingKey: 'pageLoading',
        onSelect: () => navigate('/settings'),
      },
      {
        id: 'flag-load-pages-sequentially',
        title: 'Sequential Section Loading',
        subtitle: 'System Setting',
        keywords: 'load pages sequentially tải trang tuần tự',
        type: 'setting-toggle',
        settingKey: 'loadPagesSequentially',
        onSelect: () => navigate('/settings'),
      },
      {
        id: 'flag-auto-scroll-banner',
        title: 'Auto-scroll Banner',
        subtitle: 'System Setting',
        keywords: 'settings auto scroll banner tự động cuộn banner',
        type: 'setting-toggle',
        settingKey: 'autoScrollBanner',
        onSelect: () => navigate('/settings'),
      },
      {
        id: 'flag-immersive-sidebar',
        title: 'Immersive Sidebar Acrylic',
        subtitle: 'System Setting',
        keywords: 'immersive sidebar thanh bên trong suốt',
        type: 'setting-toggle',
        settingKey: 'immersiveSidebar',
        onSelect: () => navigate('/settings'),
      },

      // Insider Flags
      {
        id: 'flag-native-keyboard',
        title: 'Native virtual keyboard',
        subtitle: 'Insider Flags',
        keywords: 'insider flags experimental native keyboard bàn phím ảo vni telex',
        type: 'setting-toggle',
        settingKey: 'nativeKeyboard',
        onSelect: () => navigate('/test'),
      },
      {
        id: 'flag-keyboard-sound',
        title: 'Âm bàn phím (Keyboard Sound)',
        subtitle: 'Insider Flags',
        keywords: 'settings keyboard sound âm bàn phím gõ phím pop click',
        type: 'setting-toggle',
        settingKey: 'keyboardSoundEnabled',
        onSelect: () => navigate('/settings'),
      },
      {
        id: 'flag-keyboard-number-row',
        title: 'Bàn phím số (Number Row)',
        subtitle: 'Insider Flags',
        keywords: 'settings keyboard number row bàn phím số 0-9',
        type: 'setting-toggle',
        settingKey: 'keyboardNumberRow',
        onSelect: () => navigate('/settings'),
      },
      {
        id: 'flag-keyboard-clipboard',
        title: 'Keyboard Clipboard History',
        subtitle: 'Insider Flags',
        keywords: 'settings keyboard clipboard danh sách lịch sử sao chép',
        type: 'setting-toggle',
        settingKey: 'keyboardClipboard',
        onSelect: () => navigate('/settings'),
      },
      {
        id: 'flag-immersive-search',
        title: 'Immersive search experience',
        subtitle: 'Insider Flags',
        keywords: 'insider flags experimental immersive search tìm kiếm giao diện lớn',
        type: 'setting-toggle',
        settingKey: 'immersiveSearch',
        onSelect: () => navigate('/test'),
      },
      {
        id: 'flag-triangle',
        title: 'Thử nghiệm Tam giác (Triangle loader)',
        subtitle: 'Insider Flags',
        keywords: 'insider flags experimental tam giác triangle loader biểu tượng loading xoay',
        type: 'setting-toggle',
        settingKey: 'triangleExperiment',
        onSelect: () => navigate('/test'),
      },
      {
        id: 'flag-fluent-icons',
        title: 'Fluent icons (3D)',
        subtitle: 'Insider Flags',
        keywords: 'insider flags experimental fluent icons 3d icon biểu tượng',
        type: 'setting-toggle',
        settingKey: 'fluentIcons',
        onSelect: () => navigate('/test'),
      },
      {
        id: 'flag-developer-mode',
        title: 'Developer Mode',
        subtitle: 'Insider Flags',
        keywords: 'developer mode chế độ nhà phát triển debug',
        type: 'setting-toggle',
        settingKey: 'developerMode',
        onSelect: () => navigate('/test'),
      },
      {
        id: 'flag-search-tv',
        title: 'Search TV Channels',
        subtitle: 'Search Setting',
        keywords: 'settings search tv tìm kênh truyền hình',
        type: 'setting-toggle',
        settingKey: 'searchTv',
        onSelect: () => navigate('/settings'),
      },
      {
        id: 'flag-search-channel-number',
        title: 'Search by Channel Number',
        subtitle: 'Search Setting',
        keywords: 'settings search channel number tìm số kênh nhanh',
        type: 'setting-toggle',
        settingKey: 'searchChannelNumber',
        onSelect: () => navigate('/settings'),
      },
      {
        id: 'flag-search-news',
        title: 'Search Articles & News',
        subtitle: 'Search Setting',
        keywords: 'settings search news bài viết tin tức',
        type: 'setting-toggle',
        settingKey: 'searchNews',
        onSelect: () => navigate('/settings'),
      },
      {
        id: 'flag-search-categories',
        title: 'Search Categories',
        subtitle: 'Search Setting',
        keywords: 'settings search categories chuyên mục phân mục',
        type: 'setting-toggle',
        settingKey: 'searchCategories',
        onSelect: () => navigate('/settings'),
      },
      {
        id: 'flag-search-settings',
        title: 'Search Settings',
        subtitle: 'Search Setting',
        keywords: 'settings search settings tìm kiếm trong cài đặt',
        type: 'setting-toggle',
        settingKey: 'searchSettings',
        onSelect: () => navigate('/settings'),
      },

      {
        id: 'flag-sidebar-position',
        title: 'Sidebar Position (Right Side)',
        subtitle: 'System Setting',
        keywords: 'sidebar position vị trí thanh bên bên phải bên trái right left',
        type: 'setting-toggle',
        customToggle: {
          checked: settings.sidebarPosition === 'right',
          onToggle: () => updateSetting('sidebarPosition', settings.sidebarPosition === 'right' ? 'left' : 'right'),
        },
        onSelect: () => navigate('/settings'),
      },
      {
        id: 'flag-nav-mode',
        title: 'TopBar Navigation Mode',
        subtitle: 'System Setting',
        keywords: 'navigation mode kiểu điều hướng topbar thanh trên cùng sidebar',
        type: 'setting-toggle',
        customToggle: {
          checked: settings.navigationMode === 'topbar',
          onToggle: () => updateSetting('navigationMode', settings.navigationMode === 'topbar' ? 'sidebar' : 'topbar'),
        },
        onSelect: () => navigate('/settings'),
      },
      {
        id: 'flag-page-animation',
        title: 'Zoom Page Transitions',
        subtitle: 'System Setting',
        keywords: 'page transitions animation hiệu ứng chuyển trang zoom in slide up',
        type: 'setting-toggle',
        customToggle: {
          checked: settings.pageAnimation === 'zoomIn',
          onToggle: () => updateSetting('pageAnimation', settings.pageAnimation === 'zoomIn' ? 'slideUp' : 'zoomIn'),
        },
        onSelect: () => navigate('/settings'),
      },

      // Tools
      { id: 'tool-sticky', title: 'Sticky Note', subtitle: 'Switch page', keywords: 'tools sticky note ghi chú dán', type: 'tool', onSelect: () => navigate('/notes') },
      { id: 'tool-tts', title: 'Text-to-Speech Player', subtitle: 'Switch page', keywords: 'tools text-to-speech tts đọc bài viết', type: 'tool', onSelect: () => onOpenTextToSpeech(NEWS_DATA[0]) },
      { id: 'tool-findwords', title: 'Find Words', subtitle: 'Switch page', keywords: 'tools find words tìm từ trong trang', type: 'tool', onSelect: () => onOpenFindWords() },
      { id: 'tool-addstream', title: 'Add Custom Stream', subtitle: 'Switch page', keywords: 'tools add custom stream thêm luồng phát', type: 'tool', onSelect: () => onOpenAddStream() },
      { id: 'tool-discord', title: 'Discord Community', subtitle: 'Switch page', keywords: 'community discord sparkle', type: 'tool', onSelect: () => window.open('https://discord.gg/wcdjaDDayK', '_blank') }
    ];

    // Channels
    (channels || []).forEach((ch) => {
      aspects.push({
        id: `channel-${ch.id}`,
        title: ch.name,
        subtitle: ch.category || 'Live Channel',
        keywords: `${ch.category} ${ch.shortName || ''} ${ch.slug}`,
        type: 'channel',
        logo: ch.logo,
        onSelect: () => {
          if (onSelectChannel) onSelectChannel(ch);
          navigate(`/live-tv?channel=${ch.slug}`);
        }
      });
    });

    // News
    NEWS_DATA.forEach((art) => {
      aspects.push({
        id: `article-${art.id}`,
        title: art.title,
        subtitle: 'Sparkle News',
        keywords: `${art.category} ${art.excerpt || ''}`,
        type: 'news',
        onSelect: () => navigate(`/article/${art.id}`)
      });
    });

    // Notes (All notes from NotesContext, searchable by title and full text content)
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
            navigate('/notes');
            setIsSearchFlyoutOpen(false);
          },
        },
        onSelect: () => {
          setActiveNoteId(note.id);
          saveToHistory(note.title, { subtitle: 'Note', type: 'note' });
          navigate('/notes');
        },
      });
    });

    // Gallery Items (All media, images, videos, and documents from Gallery DB)
    (galleryItems || []).forEach((media) => {
      aspects.push({
        id: `gallery-${media.id}`,
        title: media.title,
        subtitle: media.type === 'document' 
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
            navigate(`/gallery?preview=${encodeURIComponent(media.id)}`);
            setIsSearchFlyoutOpen(false);
          },
        },
        onSelect: () => {
          saveToHistory(media.title, { subtitle: 'Gallery', type: 'gallery' });
          navigate(`/gallery?preview=${encodeURIComponent(media.id)}`);
        },
      });
    });

    return aspects;
  }, [channels, navigate, onSelectChannel, onOpenTextToSpeech, onOpenFindWords, onOpenAddStream, settings, updateSetting, isStickyVisible, toggleSticky, createNote, notes, galleryItems, setActiveNoteId]);

  // Trending searches: shown initially when opening search UI or when recent searches are cleared
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
          if (matched && onSelectChannel) {
            onSelectChannel(matched);
          }
          saveToHistory('VTV1 HD', { subtitle: 'Watch', type: 'channel' });
          navigate(`/live-tv?channel=${matched?.slug || 'vtv1-hd'}`);
          setIsSearchFlyoutOpen(false);
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
          navigate('/craftmine');
          setIsSearchFlyoutOpen(false);
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
          navigate('/gallery');
          setIsSearchFlyoutOpen(false);
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
          navigate('/test');
          setIsSearchFlyoutOpen(false);
          setShowAllResults(false);
        },
      },
    ];
  }, [channels, navigate, onSelectChannel]);

  // Filtered search results for flyout
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      // Empty input: render trending searches if history is empty, otherwise recent search history
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
          saveToHistory(hist.query, { type: hist.type, logo: hist.logo, subtitle: hist.subtitle, timestamp: hist.timestamp });
          if (onTabSearchChange) {
            onTabSearchChange(hist.query);
          }
          // Route if matching trending or app aspects
          const found = appAspects.find((a) => a.title.toLowerCase() === hist.query.toLowerCase()) ||
                        trendingSearchItems.find((t) => t.title.toLowerCase() === hist.query.toLowerCase());
          if (found) {
            found.onSelect();
          }
          setIsSearchFlyoutOpen(false);
          setShowAllResults(false);
        }
      }));
    }

    // When query is typed: match every aspect of the app
    const matches: SearchAspectItem[] = [];

    // History matches
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
            setSearchQuery(hist.query);
            saveToHistory(hist.query, { type: hist.type, logo: hist.logo, subtitle: hist.subtitle, timestamp: hist.timestamp });
            if (onTabSearchChange) {
              onTabSearchChange(hist.query);
            }
            setIsSearchFlyoutOpen(false);
            setShowAllResults(false);
          }
        });
      }
    });

    // App aspects matches
    appAspects.forEach((item) => {
      if (item.title.toLowerCase().includes(q) || (item.keywords && item.keywords.toLowerCase().includes(q))) {
        matches.push(item);
      }
    });

    // All Gallery media and document matches (images, videos, audio, documents, stickies)
    galleryItems.forEach((gItem) => {
      const matchTitle = gItem.title.toLowerCase().includes(q);
      const matchTag = gItem.tags?.some((t) => t.toLowerCase().includes(q));
      const matchDesc = gItem.description?.toLowerCase().includes(q);
      const matchType = gItem.type.toLowerCase().includes(q);
      if (matchTitle || matchTag || matchDesc || matchType) {
        const rawExt = gItem.title?.split('.').pop()?.toUpperCase() || gItem.url?.split('.').pop()?.toUpperCase();
        const validExt = rawExt && rawExt.length <= 4 ? rawExt : (gItem.type === 'image' ? 'JPG' : gItem.type.toUpperCase());
        const fileSubtitle = `Gallery • ${validExt} File`;

        matches.push({
          id: `gallery-item-${gItem.id}`,
          title: gItem.title,
          subtitle: fileSubtitle,
          keywords: `gallery ${gItem.type} ${gItem.tags?.join(' ') || ''} ${gItem.description || ''}`,
          type: 'tool',
          logo: gItem.type === 'image' ? (gItem.thumbnailUrl || gItem.url) : undefined,
          onSelect: () => {
            navigate('/gallery');
            if (onTabSearchChange) {
              onTabSearchChange(gItem.title);
            }
          }
        });
      }
    });

    // All Notes matches (search all notes title & content)
    notes.forEach((note) => {
      const matchTitle = note.title.toLowerCase().includes(q);
      const plainText = stripHtml(note.content).toLowerCase();
      const matchContent = plainText.includes(q);
      if (matchTitle || matchContent) {
        matches.push({
          id: `note-item-${note.id}`,
          title: note.title.trim() || 'Ghi chú không có tiêu đề',
          subtitle: `Notes • ${formatRelativeTime(note.updatedAt)}`,
          keywords: `notes ghi chú ${plainText.slice(0, 100)}`,
          type: 'note',
          timestamp: note.updatedAt,
          onSelect: () => {
            setActiveNoteId(note.id);
            navigate('/notes');
            setIsSearchFlyoutOpen(false);
            setShowAllResults(false);
          }
        });
      }
    });

    // When no local matches are found with the entered keyword, return the Web searches group
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
            setIsSearchFlyoutOpen(false);
            setShowAllResults(false);
          }
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
            setIsSearchFlyoutOpen(false);
            setShowAllResults(false);
          }
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
            setIsSearchFlyoutOpen(false);
            setShowAllResults(false);
          }
        }
      ];
    }

    // Return ALL matches
    return matches;
  }, [searchQuery, searchHistory, appAspects, galleryItems, notes, navigate, onTabSearchChange, setActiveNoteId]);

  const handleSelectSearchResult = (item: SearchAspectItem) => {
    saveToHistory(item.title, { type: item.type, logo: item.logo, subtitle: item.subtitle });
    item.onSelect();
    setIsSearchFlyoutOpen(false);
    setShowAllResults(false);
  };

  // Get 3D Fluent icon or real logo based on the recent search item/query
  const getRecentSearchIcon = (query: string, logo?: string, type?: string) => {
    if (logo) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <img src={logo} alt="" className="w-6.5 h-6.5 object-contain rounded-[4px]" />
        </div>
      );
    }

    const q = query.trim().toLowerCase();
    const cleanQ = q.replace(/[-_\s]/g, '');

    // 1. Channel check: exact or partial name/slug/shortName
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

    // 2. Minecraft / Craftmine / Game
    if (q.includes('minecraft') || q.includes('craftmine') || q.includes('game') || q.includes('play') || q.includes('chơi')) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DCraftmineIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }

    // 3. Calculator
    if (q.includes('calculator') || q.includes('calc') || q.includes('máy tính') || q.includes('math') || q.includes('toán')) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DCalculatorIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }

    // 4. Mail & Calendar
    if (
      q.includes('mail') ||
      q.includes('calendar') ||
      q.includes('email') ||
      q.includes('outlook') ||
      q.includes('lịch') ||
      q.includes('thư')
    ) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DMailIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }

    // 5. Maps
    if (
      q.includes('maps') ||
      q.includes('map') ||
      q.includes('bản đồ') ||
      q.includes('navigation') ||
      q.includes('earth')
    ) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DMapsIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }

    // 6. Notepad / Notes / Documents
    if (
      q.includes('notepad') ||
      q.includes('notes') ||
      q.includes('note') ||
      q.includes('ghi chú') ||
      q.includes('memo') ||
      q.includes('word') ||
      q.includes('doc') ||
      q.includes('văn bản') ||
      q.includes('soạn thảo')
    ) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DNotesIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }

    // 7. Live TV / Watch / Channels / VTV / HTV / Stream / Movies
    if (
      q.includes('tv') ||
      q.includes('watch') ||
      q.includes('live') ||
      q.includes('vtv') ||
      q.includes('htv') ||
      q.includes('truyền hình') ||
      q.includes('stream') ||
      q.includes('movie') ||
      q.includes('phim')
    ) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DWatchIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }

    // 8. News / Articles / Thời sự / Báo / Tin tức
    if (
      q.includes('news') ||
      q.includes('article') ||
      q.includes('thời sự') ||
      q.includes('thoi su') ||
      q.includes('báo') ||
      q.includes('tin tức') ||
      q.includes('bão')
    ) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DArticlesIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }

    // 9. Gallery / Photos / Images / Album
    if (
      q.includes('photo') ||
      q.includes('gallery') ||
      q.includes('image') ||
      q.includes('ảnh') ||
      q.includes('hình') ||
      q.includes('picture') ||
      q.includes('album')
    ) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DGalleryIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }

    // 10. Draws / Paint
    if (q.includes('draw') || q.includes('paint') || q.includes('vẽ') || q.includes('sketch') || q.includes('brush') || q.includes('cọ')) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DDrawsIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }

    // 11. Photopea / Photoshop
    if (q.includes('photopea') || q.includes('photoshop') || q.includes('psd') || q.includes('chỉnh sửa ảnh')) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DPhotopeaIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }

    // 12. Screenbug Media Player
    if (q.includes('screenbug') || q.includes('vlc') || q.includes('screenbox') || q.includes('media player') || q.includes('video player') || q.includes('phát video') || q.includes('phát nhạc')) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DScreenbugIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }

    // 13. Settings / Cài đặt
    if (
      q.includes('setting') ||
      q.includes('cài đặt') ||
      q.includes('tùy chọn') ||
      q.includes('config') ||
      q.includes('preferences') ||
      q.includes('giao diện') ||
      q.includes('dark mode') ||
      q.includes('light mode')
    ) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DSettingsIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }

    // 14. Updates / Cập nhật
    if (q.includes('update') || q.includes('cập nhật') || q.includes('version') || q.includes('changelog')) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DUpdatesIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }

    // 15. Discord / Community
    if (q.includes('discord') || q.includes('cộng đồng') || q.includes('community')) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DDiscordIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }

    // 16. Home / Trang chủ
    if (q.includes('home') || q.includes('trang chủ')) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DHomeIcon className="w-7 h-7 drop-shadow-sm" />
        </div>
      );
    }

    // Default for all other recent searches: Microsoft Fluent Design 3D Folder with Magnifying Glass, bigger size
    return (
      <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
        <Fluent3DFolderSearchIcon className="w-7 h-7 drop-shadow-sm" />
      </div>
    );
  };

  // Render icon based on item type - using Microsoft Fluent Design Icons matching sidebar
  const renderItemIcon = (item: SearchAspectItem) => {
    // 1. Trending search items: exact requested colored fluent icons and VTV1 HD tab watch logo
    if (item.id === 'trending-vtv1-hd' || item.title === 'VTV1 HD') {
      const vtv1Logo = channels.find((c) => c.slug.includes('vtv1') || c.name.toLowerCase().includes('vtv1'))?.logo ||
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
              <path d="M5 3v18l5.5-3.2L15 21l4-2.3V11l-8.5-3.2V3L5 3zm6 6.8l5 1.9v4.9l-2.4 1.4-2.6-1.5V9.8z"/>
            </svg>
          </div>
        );
      }
    }

    if (item.type === 'history') {
      return getRecentSearchIcon(item.title, item.logo, item.type);
    }

    if (item.logo) {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <img src={item.logo} alt="" className="w-6.5 h-6.5 object-contain rounded-[4px]" />
        </div>
      );
    }

    if (item.type === 'web-search') {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <div className="w-7 h-7 rounded-full bg-[#005fb8]/10 dark:bg-[#4cc2ff]/15 flex items-center justify-center text-[#005fb8] dark:text-[#4cc2ff] shadow-xs">
            <Globe className="w-4 h-4" />
          </div>
        </div>
      );
    }

    if (item.type === 'page' || item.type === 'tool') {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <Fluent3DFolderSearchIcon className="w-7 h-7 drop-shadow-sm" />
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

    if (item.type === 'setting-action') {
      return (
        <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
          <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-YwocFq7vTTHvRXruXCpkOX6434urQW.png" alt="" className="topbar-settings-save-icon w-7 h-7 object-contain" aria-hidden="true" />
        </div>
      );
    }

    if (item.type === 'setting-toggle' || item.type === 'setting') {
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

    // Default / Search fallback: Microsoft Fluent Design 3D Folder with Magnifying Glass, bigger size
    return (
      <div className="w-8.5 h-8.5 flex items-center justify-center shrink-0">
        <Fluent3DFolderSearchIcon className="w-7 h-7 drop-shadow-sm" />
      </div>
    );
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      saveToHistory(searchQuery.trim());
      if (onTabSearchChange) {
        onTabSearchChange(searchQuery.trim());
      }
    }
    // Stay on current tab page - do not jump to /search or open spotlight modal
    setIsSearchFlyoutOpen(false);
    setShowAllResults(false);
  };

  const isWebSearch = Boolean(searchQuery.trim() && searchResults.length > 0 && searchResults[0].type === 'web-search');

  return (
    <header className={`w-full h-14 relative bg-[#f3f3f3] dark:bg-[#1b1f24] px-3 sm:px-6 md:px-8 flex items-center justify-between gap-3 sticky top-0 ${
      isSearchFlyoutOpen || isSearchFocused ? 'z-[2147483647]' : '!z-[200]'
    } select-none`}>
      {/* Sticky top-left tab corner rounded mask: keeps top-left of tab page rounded (bo cong 10px) when scrolling, hidden on mobile UI */}
      <div
        aria-hidden="true"
        className="hidden md:block pointer-events-none absolute top-full left-0 z-30 w-[10px] h-[10px] overflow-hidden"
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-[10px] h-[10px] block"
        >
          <path
            d="M 0,0 L 10,0 A 10 10 0 0 0 0,10 Z"
            className={settings.superDarkMode ? 'fill-black' : 'fill-[#f3f3f3] dark:fill-[#1b1f24]'}
          />
        </svg>
      </div>

      {/* 1. Left Section */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 z-10">
        {settings.navigationMode !== 'floaty' && (
          <motion.button
            id="btn-mobile-menu-toggle"
            whileTap={{ scale: 0.9 }}
            onClick={onOpenMobileMenu}
            className="md:hidden w-8 h-8 rounded-md flex items-center justify-center text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 transition-colors cursor-pointer shrink-0"
            aria-label="Collapse or expand"
          >
            <Menu className="w-5 h-5 transition-transform text-black dark:text-white" />
          </motion.button>
        )}

        {isTopBarMode && (
          <nav className="hidden xl:flex items-center gap-1 shrink-0" aria-label="Main Navigation">
            {/* Home */}
            <button
              id="btn-topbar-nav-home"
              type="button"
              onClick={() => navigate('/')}
              className={`group relative flex items-center gap-2 px-3 h-8.5 rounded-[4px] text-xs sm:text-[13px] font-normal transition-colors cursor-default whitespace-nowrap outline-none select-none ${
                currentRoute === '/' || currentRoute === '/home'
                  ? 'bg-black/5 dark:bg-white/10 text-[#111827] dark:text-white font-medium'
                  : 'text-[#4b5563] dark:text-[#d1d5db] hover:bg-black/5 dark:hover:bg-white/[0.06] hover:text-[#111827] dark:hover:text-white'
              }`}
              aria-label="Home"
            >
              <FluentHomeIcon className="w-4 h-4 shrink-0 text-[#111827] dark:text-white" />
              <span>Home</span>

              {(currentRoute === '/' || currentRoute === '/home') && (
                <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-[#4cc2ff] rounded-t-full pointer-events-none" />
              )}
            </button>

            {/* Watch (preview) */}
            <button
              id="btn-topbar-nav-tv"
              type="button"
              onClick={() => navigate('/live-tv')}
              className={`group relative flex items-center gap-2 px-3 h-8.5 rounded-[4px] text-xs sm:text-[13px] font-normal transition-colors cursor-default whitespace-nowrap outline-none select-none ${
                currentRoute === '/live-tv'
                  ? 'bg-black/5 dark:bg-white/10 text-[#111827] dark:text-white font-medium'
                  : 'text-[#4b5563] dark:text-[#d1d5db] hover:bg-black/5 dark:hover:bg-white/[0.06] hover:text-[#111827] dark:hover:text-white'
              }`}
              aria-label="Watch"
            >
              <Fluent3DWatchPreviewIcon className="w-4 h-4 shrink-0" />
              <span>Watch</span>

              {currentRoute === '/live-tv' && (
                <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-[#4cc2ff] rounded-t-full pointer-events-none" />
              )}
            </button>

            {/* Update blogs */}
            <button
              id="btn-topbar-nav-news"
              type="button"
              onClick={() => navigate('/news')}
              className={`group relative flex items-center gap-2 px-3 h-8.5 rounded-[4px] text-xs sm:text-[13px] font-normal transition-colors cursor-default whitespace-nowrap outline-none select-none ${
                currentRoute === '/news' || currentRoute.startsWith('/article') || currentRoute.startsWith('/updates')
                  ? 'bg-black/5 dark:bg-white/10 text-[#111827] dark:text-white font-medium'
                  : 'text-[#4b5563] dark:text-[#d1d5db] hover:bg-black/5 dark:hover:bg-white/[0.06] hover:text-[#111827] dark:hover:text-white'
              }`}
              aria-label="Update blogs"
            >
              <FluentNewsIcon className="w-4 h-4 shrink-0 text-[#111827] dark:text-white" />
              <span>Update blogs</span>

              {(currentRoute === '/news' || currentRoute.startsWith('/article') || currentRoute.startsWith('/updates')) && (
                <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-[#4cc2ff] rounded-t-full pointer-events-none" />
              )}
            </button>
          </nav>
        )}
      </div>

      {/* 2. Center Search Box with Flyout matching Microsoft Fluent Design and reference image */}
      <div 
        ref={searchContainerRef}
        id="topbar-search-container"
        className={`flex-1 flex items-center justify-center min-w-0 transition-all ${
          isSearchFlyoutOpen || isSearchFocused
            ? 'fixed md:absolute inset-x-0 top-0 h-14 md:h-auto md:top-auto px-2.5 sm:px-4 z-[2147483647] bg-[#f3f3f3] dark:bg-[#1b1f24] md:bg-transparent md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-[460px]'
            : 'px-1 sm:px-4 z-40 md:absolute md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-[460px]'
        }`}
      >
        <div className="relative w-full max-w-full md:max-w-[460px] min-w-0 mx-auto flex items-center gap-2">
          {(isSearchFlyoutOpen || isSearchFocused) && (
            <button
              type="button"
              onClick={() => {
                setIsSearchFlyoutOpen(false);
                setIsSearchFocused(false);
              }}
              className="md:hidden w-8 h-8 rounded-full flex items-center justify-center text-black dark:text-white hover:bg-black/10 dark:hover:bg-white/10 shrink-0 cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (isFindWordsMode) {
                handleNextFindMatch();
                return;
              }
              handleSearchSubmit(e);
            }} 
            className="flex-1 w-full min-w-0"
          >
            <div
              id="topbar-search-box"
              className={`group relative w-full h-9 sm:h-9 rounded-[100px] flex items-center px-3.5 gap-2 transition-all ${
                isSearchFlyoutOpen || isSearchFocused
                  ? 'search-flyout-open is-focused bg-white dark:bg-[#282c31]'
                  : 'bg-[#fbfbfb] dark:bg-[#282c31]'
              } ${isFindWordsMode ? 'ring-2 ring-[#0078d4] dark:ring-[#4cc2ff]' : ''} ${currentRoute === '/search' || currentRoute.startsWith('/search') ? 'topbar-search-box-spotlight-glow' : ''}`}
            >
              <FluentSearchIcon className="w-[16px] h-[16px] text-black dark:text-white shrink-0 pointer-events-none select-none" />

              {isFindWordsMode ? (
                <input
                  ref={findWordsInputRef}
                  type="text"
                  value={findWordsTerm}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoComplete="off"
                  autoCorrect="off"
                  autoFocus
                  onChange={(e) => {
                    const val = e.target.value;
                    setFindWordsTerm(val);
                    highlightArticleText(val);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleNextFindMatch();
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      handleExitFindWords();
                    }
                  }}
                  placeholder="Find some words"
                  className="flex-1 min-w-0 bg-transparent text-xs sm:text-[13px] text-black dark:text-white placeholder-black/75 dark:placeholder-white outline-none border-none py-0.5 pr-1"
                />
              ) : (
                <input
                  type="text"
                  value={searchQuery}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoComplete="off"
                  autoCorrect="off"
                  onChange={(e) => {
                    const val = e.target.value;
                    setSearchQuery(val);
                    setShowAllResults(false);
                    if (currentRoute !== '/settings') {
                      setIsSearchFlyoutOpen(true);
                    } else {
                      setIsSearchFlyoutOpen(false);
                    }
                    if (onTabSearchChange) {
                      onTabSearchChange(val);
                    }
                  }}
                  onFocus={() => {
                    setIsSearchFocused(true);
                    if (currentRoute !== '/settings') {
                      setIsSearchFlyoutOpen(true);
                    }
                  }}
                  onBlur={() => {
                    setIsSearchFocused(false);
                  }}
                  placeholder={(() => {
                    if (currentRoute === '/search' || currentRoute.startsWith('/search')) return 'Try new search here!';
                    if (currentRoute === '/' || currentRoute === '/home') return 'Search Home';
                    if (currentRoute.startsWith('/live-tv') || currentRoute.startsWith('/watch-preview')) return 'Search Watch';
                    if (currentRoute.startsWith('/news') || currentRoute.startsWith('/article') || currentRoute.startsWith('/updates')) return 'Search for articles';
                    if (currentRoute.startsWith('/gallery')) return 'Search for photos or files';
                    if (currentRoute.startsWith('/draws')) return 'Search for canvases';
                    if (currentRoute.startsWith('/notes') || currentRoute.startsWith('/write') || currentRoute.startsWith('/present') || currentRoute.startsWith('/table')) return 'Search Notes';
                    if (currentRoute.startsWith('/vlc') || currentRoute.startsWith('/screenbox')) return 'Search Screenbox';
                    if (currentRoute.startsWith('/craftmine')) return 'Search Craftmine';
                    if (currentRoute.startsWith('/photopea')) return 'Search Photopea';
                    if (currentRoute.startsWith('/settings')) return 'Search settings';
                    if (currentRoute.startsWith('/winui-3') || currentRoute.startsWith('/winui')) return 'Search WinUI 3 Gallery';
                    if (currentRoute.startsWith('/channels')) return 'Search Channels';
                    if (currentRoute.startsWith('/favorites')) return 'Search Favorites';
                    if (currentRoute.startsWith('/about')) return 'Search About';
                    if (currentRoute.startsWith('/test')) return 'Search Insider Flags';
                    const clean = currentRoute.replace(/^\//, '').split(/[/?#]/)[0];
                    return `Search ${clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : 'Home'}`;
                  })()}
                  className="flex-1 min-w-0 bg-transparent text-xs sm:text-[13px] text-black dark:text-white placeholder-black/75 dark:placeholder-white outline-none border-none py-0.5 pr-1"
                />
              )}

              <div className="flex items-center gap-1.5 shrink-0">
                {isFindWordsMode ? (
                  <>
                    {findWordsTerm.trim() && (
                      <span className="text-[11px] font-semibold text-[#6b7280] dark:text-[#9ca3af] px-1 select-none">
                        {findWordsMatchCount > 0 ? `${findWordsMatchIndex}/${findWordsMatchCount}` : '0/0'}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handlePrevFindMatch}
                      disabled={findWordsMatchCount === 0}
                      title="Previous match"
                      className="p-1 rounded text-[#111827] dark:text-white hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextFindMatch}
                      disabled={findWordsMatchCount === 0}
                      title="Next match"
                      className="p-1 rounded text-[#111827] dark:text-white hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleExitFindWords}
                      title="Exit word search"
                      className="p-1 rounded text-[#111827] dark:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setIsSearchFlyoutOpen(false);
                          setShowAllResults(false);
                          if (onTabSearchChange) {
                            onTabSearchChange('');
                          }
                        }}
                        aria-label="Clear search"
                        className="text-black dark:text-white hover:text-black dark:hover:text-white p-0.5 transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Book Icon on article page */}
                    {isArticlePage && (
                      <div className="relative group/bookbtn flex items-center">
                        <button
                          type="button"
                          id="btn-topbar-find-words"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setIsSearchFlyoutOpen(false);
                            setIsSearchFocused(false);
                            setIsFindWordsMode(true);
                            setTimeout(() => {
                              findWordsInputRef.current?.focus();
                            }, 50);
                          }}
                          className="p-1 rounded-[6px] text-[#111827] dark:text-white hover:text-[#0078d4] dark:hover:text-[#4cc2ff] hover:bg-black/5 dark:hover:bg-white/10 active:opacity-75 flex items-center justify-center shrink-0 transition-colors cursor-pointer select-none"
                          aria-label="Find some words in this article"
                        >
                          <BookOpen className="w-[17px] h-[17px] shrink-0 pointer-events-none fill-none stroke-[1.8]" />
                        </button>
                        <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded-[6px] bg-[#1f1f1f] dark:bg-[#2d2d2d] text-white text-[11px] font-medium shadow-xl border border-black/10 dark:border-white/15 opacity-0 group-hover/bookbtn:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50">
                          Find some words
                        </div>
                      </div>
                    )}

                    {/* Save button without background (pure icon button) inside search box */}
                    {(currentRoute === '/settings' || currentRoute.startsWith('/settings') || currentRoute.includes('settings') || (typeof window !== 'undefined' && window.location.pathname.includes('settings'))) && (
                      <div className="relative group/savetooltip flex items-center">
                        <button
                          type="button"
                          id="btn-topbar-settings-save"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleSaveSettings();
                          }}
                          disabled={isSavingSettings}
                          className="p-1 rounded-[6px] text-[#111827] dark:text-white hover:text-[#0078d4] dark:hover:text-[#4cc2ff] active:opacity-75 flex items-center justify-center shrink-0 transition-colors cursor-pointer select-none bg-transparent border-none shadow-none"
                          aria-label="Save changes"
                        >
                          {isSavingSettings ? (
                            <SpinningRing size={16} strokeWidth={2.5} />
                          ) : (
                            <img
                              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-YwocFq7vTTHvRXruXCpkOX6434urQW.png"
                              alt=""
                              className="topbar-settings-save-icon w-[18px] h-[18px] shrink-0 object-contain pointer-events-none"
                              aria-hidden="true"
                            />
                          )}
                        </button>
                        {/* Hover Tooltip: Save changes */}
                        <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded-[6px] bg-[#1f1f1f] dark:bg-[#2d2d2d] text-white text-[11px] font-medium shadow-xl border border-black/10 dark:border-white/15 opacity-0 group-hover/savetooltip:opacity-100 transition-opacity duration-150 whitespace-nowrap z-50">
                          Save changes
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </form>

            {/* Flyout Result Dropdown: Displays up to 4 items initially with slide-up animation and layout morph */}
            <AnimatePresence>
              {isSearchFlyoutOpen && !isFindWordsMode && currentRoute !== '/settings' && (
                <motion.div
                key="topbar-search-flyout"
                layout
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 14 }}
                transition={{
                  duration: 0.38,
                  ease: [0.16, 1, 0.3, 1],
                  layout: { duration: 0.36, ease: [0.16, 1, 0.3, 1] },
                }}
                className={`topbar-search-results-dropdown fixed left-0 right-0 top-14 w-full rounded-none sm:rounded-b-[16px] md:rounded-[14px] md:absolute md:top-[calc(100%+8px)] md:left-0 md:right-0 md:w-full z-[2147483647] backdrop-blur-2xl border border-black/10 dark:border-white/10 shadow-[0_20px_48px_rgba(0,0,0,0.18)] dark:shadow-[0_24px_64px_rgba(0,0,0,0.7)] p-2 space-y-1 ${
                  showAllResults ? 'max-h-[calc(100vh-70px)] md:max-h-[380px] overflow-y-auto sidebar-scroller' : 'max-h-[calc(100vh-70px)] md:max-h-none overflow-hidden'
                }`}
                style={{
                  backgroundColor: searchFlyoutBg,
                  backdropFilter: 'blur(28px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(28px) saturate(180%)',
                }}
              >

                {/* Section Header when input is empty: "Trending searches" or "Recent searches" */}
                {!searchQuery.trim() && (
                  <div className="px-2.5 pt-1 pb-1.5 text-[12px] font-semibold text-[#6b7280] dark:text-[#9ca3af] select-none border-b border-black/5 dark:border-white/5 mb-1 flex items-center justify-between">
                    <span>{searchHistory.length > 0 ? 'Recent searches' : 'Trending searches'}</span>
                  </div>
                )}

                {/* Section Header when no local results and Web searches shown */}
                {isWebSearch && (
                  <div className="px-2.5 pt-1 pb-1.5 text-[12px] font-semibold text-[#005fb8] dark:text-[#4cc2ff] select-none border-b border-black/5 dark:border-white/5 mb-1 flex items-center justify-between">
                    <span>Web searches</span>
                    <span className="text-[11px] font-normal text-[#6b7280] dark:text-[#9ca3af]">No local results</span>
                  </div>
                )}

                {(showAllResults ? searchResults : searchResults.slice(0, 4)).map((item, index) => (
                  <motion.div
                    key={`${item.id}-${searchQuery}-${index}`}
                    layout
                    initial={{ opacity: 0, y: 20, x: 0 }}
                    animate={
                      isClearingHistory && item.type === 'history'
                        ? {
                            opacity: 0,
                            x: -140,
                            transition: {
                              duration: 0.28,
                              delay: index * 0.045,
                              ease: [0.4, 0, 0.2, 1],
                            },
                          }
                        : {
                            opacity: 1,
                            y: 0,
                            x: 0,
                            transition: {
                              duration: 0.38,
                              delay: Math.min(index * 0.04, 0.2),
                              ease: [0.16, 1, 0.3, 1],
                            },
                          }
                    }
                    onClick={() => !isClearingHistory && handleSelectSearchResult(item)}
                    onMouseEnter={(e) => handleResultMouseEnter(item.title, e)}
                    onMouseLeave={handleResultMouseLeave}
                    title={item.title}
                    className="w-full min-h-[50px] px-2.5 py-1.5 rounded-[8px] flex items-center gap-3 text-left text-[#111827] dark:text-white hover:bg-black/[0.06] dark:hover:bg-white/[0.08] active:bg-black/[0.1] dark:active:bg-white/[0.12] transition-none cursor-pointer group select-none"
                  >
                    {renderItemIcon(item)}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="search-result-title text-[13.5px] font-medium text-[#111827] dark:text-white/95 truncate leading-snug">
                            {item.title}
                          </span>
                          {item.type === 'history' && item.timestamp && (
                            <span className="text-[11px] font-normal text-[#9ca3af] dark:text-[#9ca3af]/80 shrink-0 select-none">
                              • {formatRelativeTime(item.timestamp)}
                            </span>
                          )}
                        </div>
                      </div>
                      {item.subtitle && (
                        <div className="text-[11.5px] font-normal text-[#6b7280] dark:text-[#9ca3af] truncate leading-tight mt-0.5">
                          {item.subtitle}
                        </div>
                      )}
                    </div>

                    {/* Action toggle switch right on search UI */}
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
                            showAppToast(nextVal ? `Enable ${item.title}` : `Disable ${item.title}`);
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

                    {/* Direct action button right on search UI */}
                    {item.customAction && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          item.customAction!.onAction();
                        }}
                        className="px-2.5 py-1 rounded-[8px] bg-[#005fb8]/10 dark:bg-[#4cc2ff]/15 hover:bg-[#005fb8]/20 dark:hover:bg-[#4cc2ff]/25 text-[#005fb8] dark:text-[#4cc2ff] text-[12px] font-semibold shrink-0 transition-none cursor-pointer border border-[#005fb8]/20 dark:border-[#4cc2ff]/20"
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
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full text-[#6b7280] dark:text-[#9ca3af] hover:text-[#111827] dark:hover:text-white shrink-0 cursor-pointer transition-none"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </motion.div>
                ))}

                {/* Recent Searches Footer: Show more button and Clear all button without hover/pressed transforms */}
                {!searchQuery.trim() && searchHistory.length > 4 && !showAllResults && (
                  <motion.div
                    key="recent-search-footer-actions"
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.38,
                      delay: Math.min(4 * 0.04, 0.2),
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="w-full mt-1 flex items-center gap-1.5 pt-0.5"
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAllResults(true);
                      }}
                      className="flex-1 h-9 px-3 rounded-[14px] bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] active:bg-black/[0.09] dark:active:bg-white/[0.1] border border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between text-left text-[13px] text-[#374151] dark:text-[#d1d5db] hover:text-[#111827] dark:hover:text-white transition-none cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-2.5">
                        <Search className="w-4 h-4 text-[#6b7280] dark:text-[#9ca3af] shrink-0" />
                        <span className="font-medium text-[13px]">Show more</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#6b7280] dark:text-[#9ca3af] shrink-0" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearAllWithAnimation();
                      }}
                      disabled={isClearingHistory}
                      className="h-9 px-3.5 rounded-[14px] bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] hover:text-[#005fb8] dark:hover:text-[#4cc2ff] active:bg-black/[0.09] dark:active:bg-white/[0.1] border border-black/[0.06] dark:border-white/[0.06] flex items-center justify-center text-[12.5px] font-medium text-[#6b7280] dark:text-[#9ca3af] transition-none cursor-pointer select-none shrink-0"
                    >
                      Clear all
                    </button>
                  </motion.div>
                )}

                {/* When 4 or fewer recent searches, Clear all is placed at the bottom where Show more is */}
                {!searchQuery.trim() && searchHistory.length <= 4 && searchHistory.length > 0 && (
                  <motion.div
                    key="recent-search-footer-clear"
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.38,
                      delay: Math.min(searchHistory.length * 0.04, 0.2),
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="w-full mt-1 pt-0.5"
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearAllWithAnimation();
                      }}
                      disabled={isClearingHistory}
                      className="w-full h-9 px-3.5 rounded-[14px] bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] hover:text-[#005fb8] dark:hover:text-[#4cc2ff] active:bg-black/[0.09] dark:active:bg-white/[0.1] border border-black/[0.06] dark:border-white/[0.06] flex items-center justify-center text-[12.5px] font-medium text-[#6b7280] dark:text-[#9ca3af] transition-none cursor-pointer select-none"
                    >
                      Clear all
                    </button>
                  </motion.div>
                )}

                {/* When expanded with recent searches, show Show less and Clear all in footer */}
                {!searchQuery.trim() && showAllResults && (
                  <div className="pt-2 pb-1 px-3 flex items-center justify-between text-[11.5px] text-[#6b7280] dark:text-[#9ca3af] border-t border-black/5 dark:border-white/5 mt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAllResults(false);
                      }}
                      className="text-[#005fb8] dark:text-[#4cc2ff] hover:underline font-medium cursor-pointer transition-none"
                    >
                      Show less
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearAllWithAnimation();
                      }}
                      disabled={isClearingHistory}
                      className="text-[#6b7280] dark:text-[#9ca3af] hover:text-[#005fb8] dark:hover:text-[#4cc2ff] hover:underline font-medium cursor-pointer transition-none"
                    >
                      Clear all
                    </button>
                  </div>
                )}

                {/* Non-empty search results: Show more button */}
                {searchQuery.trim() && searchResults.length > 4 && !showAllResults && !isWebSearch && (
                  <motion.button
                    key={`show-more-search-results-${searchQuery}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.38,
                      delay: Math.min(4 * 0.04, 0.2),
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAllResults(true);
                    }}
                    className="w-full mt-1 h-9 px-3 rounded-[14px] bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] active:bg-black/[0.09] dark:active:bg-white/[0.1] border border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between text-left text-[13px] text-[#374151] dark:text-[#d1d5db] hover:text-[#111827] dark:hover:text-white transition-none cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2.5">
                      <Search className="w-4 h-4 text-[#6b7280] dark:text-[#9ca3af] shrink-0" />
                      <span className="font-medium text-[13px]">Show more</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#6b7280] dark:text-[#9ca3af] shrink-0" />
                  </motion.button>
                )}

                {/* When expanded with query */}
                {searchQuery.trim() && showAllResults && (
                  <div className="pt-2 pb-1 px-3 flex items-center justify-between text-[11.5px] text-[#6b7280] dark:text-[#9ca3af] border-t border-black/5 dark:border-white/5 mt-1">
                    <span>{searchResults.length} results</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAllResults(false);
                      }}
                      className="text-[#005fb8] dark:text-[#4cc2ff] hover:underline font-medium cursor-pointer transition-none"
                    >
                      Show less
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 3. Right Action Icons: Settings */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 z-10">


        {/* TopBar Mode: Settings Gear Icon */}
        {isTopBarMode && (
          <button
            id="btn-top-settings-gear"
            onClick={handleSettingsClick}
            className={`w-9 h-9 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
              currentRoute === '/settings'
                ? 'bg-black/10 dark:bg-white/15'
                : 'hover:bg-black/5 dark:hover:bg-white/10'
            }`}
            aria-label="Settings"
          >
            <img 
              src={SETTINGS_ICON_SRC}
              alt="Settings"
              referrerPolicy="no-referrer"
              className={`w-5 h-5 object-contain shrink-0 brightness-0 dark:brightness-0 dark:invert transition-opacity duration-200 ${
                currentRoute === '/settings' ? 'opacity-100' : 'opacity-75 hover:opacity-100'
              }`}
            />
          </button>
        )}

      </div>

      {/* Floating Tooltip for truncated search result titles */}
      {resultTitleTooltip && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          <motion.div
            key="search-result-tooltip"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              top: `${resultTitleTooltip.top}px`,
              left: `${resultTitleTooltip.left}px`,
              transform: resultTitleTooltip.placement === 'bottom' ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
              backgroundColor: isLightMode ? 'rgba(255, 255, 255, 0.95)' : 'rgba(24, 24, 28, 0.95)',
              backdropFilter: 'blur(16px) saturate(140%)',
              WebkitBackdropFilter: 'blur(16px) saturate(140%)',
              zIndex: 2147483647,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
            }}
            className="px-3 py-1.5 min-h-[28px] max-w-[360px] flex items-center rounded-[6px] text-[#111827] dark:text-white text-xs font-medium border border-black/10 dark:border-white/15 pointer-events-none select-none break-words"
          >
            {resultTitleTooltip.text}
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </header>
  );
};
