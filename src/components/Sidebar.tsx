import React, { useState, useRef, useMemo, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { flyoutPanelClassName, flyoutPanelStyle } from './FlyoutDropdown';
import { 
  Sliders,
  FlaskConical,
  Menu,
  X,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Wrench,
  Info,
  MessageSquarePlus,
  MessageSquare,
  PlusCircle,
  UploadCloud,
  DownloadCloud,
  RefreshCw,
  PanelsTopLeft,
  PanelLeft,
  Palette,
  Settings2,
  Check,
  Sparkles,
  Folder,
  Image as ImageIcon,
  Film,
  Music,
  FileText,
  FolderPlus
} from 'lucide-react';
import { galleryDB, GalleryFolder, GalleryMediaItem } from '../services/galleryStorage';
import { 
  FluentHomeIcon, 
  FluentWatchIcon,
  FluentLiveTvIcon, 
  FluentArticlesIcon,
  FluentNewsIcon, 
  FluentNotesIcon, 
  FluentUserIcon, 
  FluentPersonDeleteIcon, 
  FluentSearchIcon,
  FluentSettingsIcon,
  FluentCraftmineIcon,
  FluentUpdatesIcon,
  FluentGalleryIcon,
  FluentInkCanvasIcon,
  FluentScreenbugIcon,
  FluentVlcIcon,
  FluentPhotopeaIcon,
  FluentPersonFeedbackIcon,
  FluentArrowUploadIcon,
  FluentCameraIcon
} from './FluentIcons';
import {
  Fluent3DHomeIcon,
  Fluent3DArticlesIcon,
  Fluent3DUpdatesIcon,
  Fluent3DWatchIcon,
  Fluent3DWatchPreviewIcon,
  Fluent3DGalleryIcon,
  Fluent3DDrawsIcon,
  Fluent3DNotesIcon,
  Fluent3DScreenbugIcon,
  Fluent3DVlcIcon,
  Fluent3DCraftmineIcon,
  Fluent3DPhotopeaIcon,
  Fluent3DDiscordIcon,
  Fluent3DUserIcon,
  Fluent3DSettingsIcon,
  Fluent3DCameraIcon
} from './Fluent3DIcons';
import { useFavorites } from '../hooks/useFavorites';
import { useSettings } from '../hooks/useSettings';
import { CHANNELS_DATA } from '../data/channels';
import { showAppToast } from '../utils/toast';
import { Channel, NewsArticle } from '../types';
import { DiscordWelcomeModal } from './DiscordWelcomeModal';
import { UnderConstructionModal } from './UnderConstructionModal';
import { parseM3UPlaylist, downloadPlaylistFile } from '../utils/m3uParser';

const LOGO_SRC = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-iTzEG0iuHLTKbWp5e2y55NABj3UWZr.png';

interface MorphingIndicatorProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  currentRoute: string;
  dependencyKey?: string;
}

const MorphingVerticalIndicator: React.FC<MorphingIndicatorProps> = ({
  containerRef,
  currentRoute,
  dependencyKey,
}) => {
  const [bounds, setBounds] = useState<{
    top: number;
    left: number;
    height: number;
    visible: boolean;
  }>({ top: 0, left: 10, height: 38, visible: false });

  const prevTopRef = useRef<number | null>(null);
  const [stretchKey, setStretchKey] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    let observer: ResizeObserver | null = null;
    let mutationObserver: MutationObserver | null = null;
    let rafId: number | null = null;
    let timer1: NodeJS.Timeout | null = null;
    let timer2: NodeJS.Timeout | null = null;
    let timer3: NodeJS.Timeout | null = null;

    const measure = () => {
      if (isCancelled) return;
      const container = containerRef.current;
      if (!container) return;

      const activeEl = container.querySelector('[data-nav-active="true"]') as HTMLElement | null;
      if (!activeEl) {
        setBounds((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const activeRect = activeEl.getBoundingClientRect();
      const top = Math.round(activeRect.top - containerRect.top + container.scrollTop);
      const left = Math.round(activeRect.left - containerRect.left);
      const height = Math.round(activeRect.height);

      if (height > 0) {
        setBounds({ top, left, height, visible: true });
      }
    };

    measure();
    rafId = requestAnimationFrame(measure);
    timer1 = setTimeout(measure, 40);
    timer2 = setTimeout(measure, 120);
    timer3 = setTimeout(measure, 300);

    const container = containerRef.current;
    if (container) {
      observer = new ResizeObserver(() => measure());
      observer.observe(container);

      mutationObserver = new MutationObserver(() => measure());
      mutationObserver.observe(container, {
        attributes: true,
        attributeFilter: ['data-nav-active'],
        subtree: true,
      });

      container.addEventListener('scroll', measure, { passive: true });
    }

    return () => {
      isCancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      if (timer1) clearTimeout(timer1);
      if (timer2) clearTimeout(timer2);
      if (timer3) clearTimeout(timer3);
      if (observer) observer.disconnect();
      if (mutationObserver) mutationObserver.disconnect();
      if (container) container.removeEventListener('scroll', measure);
    };
  }, [currentRoute, dependencyKey, containerRef]);

  const INDICATOR_HEIGHT = 16;
  const centeredTop = bounds.top + Math.round((bounds.height - INDICATOR_HEIGHT) / 2);

  useEffect(() => {
    if (bounds.visible) {
      if (prevTopRef.current !== null && Math.abs(prevTopRef.current - centeredTop) > 2) {
        setStretchKey((k) => k + 1);
      }
      prevTopRef.current = centeredTop;
    }
  }, [centeredTop, bounds.visible]);

  if (!bounds.visible) return null;

  return (
    <motion.div
      className="absolute w-[3px] h-[16px] z-30 pointer-events-none rounded-full"
      initial={false}
      animate={{
        top: centeredTop,
        left: bounds.left,
        opacity: bounds.visible ? 1 : 0,
      }}
      transition={{
        top: {
          duration: 0.38,
          ease: [0.4, 0.0, 0.2, 1],
        },
        left: {
          duration: 0.38,
          ease: [0.4, 0.0, 0.2, 1],
        },
        opacity: {
          duration: 0.15,
        },
      }}
    >
      <motion.div
        key={`sidebar-pill-stretch-${stretchKey}`}
        className="w-full h-full bg-[#4cc2ff] rounded-full origin-center"
        initial={{ scaleY: 1 }}
        animate={{
          scaleY: stretchKey > 0 ? [1, 2.2, 1] : 1,
        }}
        transition={{
          duration: 0.38,
          times: [0, 0.5, 1],
          ease: [0.4, 0.0, 0.2, 1],
        }}
      />
    </motion.div>
  );
};

interface SidebarProps {
  currentRoute: string;
  navigate: (route: string, state?: any) => void;
  onOpenSearch: () => void;
  selectedChannel?: Channel | null;
  onSelectChannel?: (channel: Channel) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  channels?: Channel[];
  currentChannel?: Channel;
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
  onOpenUpdate?: () => void;
  onOpenOfficeTool?: (tool: string) => void;
  isSplashFinished?: boolean;
  mobileDragOffset?: number | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  navigate,
  onOpenSearch,
  onSelectChannel,
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
  channels = [],
  currentChannel,
  onOpenHelp = () => {},
  onOpenDiscord = () => {},
  onOpenSummarize = (_article: NewsArticle) => {},
  onOpenTextToSpeech = (_article: NewsArticle) => {},
  onOpenFindWords = () => {},
  onOpenAddStream = () => {},
  onImportChannels = (_channels: Channel[]) => {},
  onOpenNotifications = () => {},
  fontSize = 16,
  onChangeFontSize = (_size: number) => {},
  onOpenUpdate = () => {},
  onOpenOfficeTool = (_tool: string) => {},
  isSplashFinished = false,
  mobileDragOffset = null
}) => {
  const { settings, updateSetting } = useSettings();
  const { favoriteChannelIds } = useFavorites();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate('/');
    }
  };

  const desktopNavRef = useRef<HTMLDivElement>(null);
  const mobileNavRef = useRef<HTMLDivElement>(null);
  const collapsedNavRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLiveTvExpanded, setIsLiveTvExpanded] = useState(false);
  const [isFavoritesExpanded, setIsFavoritesExpanded] = useState(false);
  const [isDiscordModalOpen, setIsDiscordModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [galleryFolders, setGalleryFolders] = useState<GalleryFolder[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryMediaItem[]>([]);
  const [isGalleryTreeExpanded, setIsGalleryTreeExpanded] = useState<boolean>(false);
  const [expandedSidebarFolderIds, setExpandedSidebarFolderIds] = useState<Set<string>>(new Set());
  const [selectedSidebarFolderId, setSelectedSidebarFolderId] = useState<string | null>(null);
  const [collapsedTooltip, setCollapsedTooltip] = useState<{ label: string; top: number; left: number } | null>(null);

  const showTooltip = (label: string, e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const isRightSidebar = settings.sidebarPosition === 'right';
    setCollapsedTooltip({
      label,
      top: rect.top + rect.height / 2,
      left: isRightSidebar ? rect.left - 10 : rect.right + 10,
    });
  };

  const hideTooltip = () => {
    setCollapsedTooltip(null);
  };

  useEffect(() => {
    setCollapsedTooltip(null);
  }, [currentRoute, isCollapsed]);

  useEffect(() => {
    let mounted = true;
    const loadGalleryTreeData = async () => {
      try {
        const [fList, iList] = await Promise.all([
          galleryDB.getFolders(),
          galleryDB.getAll(),
        ]);
        if (mounted) {
          setGalleryFolders(fList);
          setGalleryItems(iList);
        }
      } catch {}
    };
    loadGalleryTreeData();
    const unsub = galleryDB.subscribe(loadGalleryTreeData);
    return () => {
      mounted = false;
      unsub();
    };
  }, []);
  const [isToolsFlyoutOpen, setIsToolsFlyoutOpen] = useState(false);
  const [isSignInFlyoutOpen, setIsSignInFlyoutOpen] = useState(false);
  const [isSignInUnderConstructionOpen, setIsSignInUnderConstructionOpen] = useState(false);
  const [signedInAccount, setSignedInAccount] = useState<string | null>(null);
  const [signInToast, setSignInToast] = useState<string | null>(null);
  const [sidebarContextMenu, setSidebarContextMenu] = useState<{ x: number; y: number } | null>(null);
  const sidebarHoldTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openSidebarContextMenu = (x: number, y: number) => {
    setIsToolsFlyoutOpen(false);
    setIsSignInFlyoutOpen(false);
    setSidebarContextMenu({ x, y });
  };

  const handleSidebarContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    openSidebarContextMenu(e.clientX, e.clientY);
  };

  const handleSidebarTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    sidebarHoldTimer.current = setTimeout(() => openSidebarContextMenu(touch.clientX, touch.clientY), 550);
  };

  const clearSidebarHold = () => {
    if (sidebarHoldTimer.current) clearTimeout(sidebarHoldTimer.current);
    sidebarHoldTimer.current = null;
  };

  useEffect(() => clearSidebarHold, []);

  const toggleSignInFlyout = () => {
    setIsSignInFlyoutOpen((prev) => !prev);
    if (isToolsFlyoutOpen) setIsToolsFlyoutOpen(false);
  };

  const toggleToolsFlyout = () => {
    setIsToolsFlyoutOpen((prev) => !prev);
    if (isSignInFlyoutOpen) setIsSignInFlyoutOpen(false);
  };

  const handleSignInAction = (provider: string) => {
    setIsSignInFlyoutOpen(false);
    if (provider === 'Sign out') {
      setSignedInAccount(null);
      setSignInToast('Signed out of account');
      return;
    }
    if (provider === 'Guest') {
      setSignInToast('Continuing without an account');
      return;
    }
    navigate('/auth');
  };

  useEffect(() => {
    if (!signInToast) return;
    const timer = setTimeout(() => setSignInToast(null), 3000);
    return () => clearTimeout(timer);
  }, [signInToast]);

  // Close flyouts when clicking outside
  useEffect(() => {
    if (!isToolsFlyoutOpen && !isSignInFlyoutOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (isToolsFlyoutOpen && target && !target.closest('.tools-flyout-container')) {
        setIsToolsFlyoutOpen(false);
      }
      if (isSignInFlyoutOpen && target && !target.closest('.signin-flyout-container') && !target.closest('.signin-toggle-btn')) {
        setIsSignInFlyoutOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isToolsFlyoutOpen, isSignInFlyoutOpen]);

  // Touch swipe to close mobile drawer & follow finger
  const drawerTouchStartX = useRef<number | null>(null);
  const [closeDragOffset, setCloseDragOffset] = useState<number | null>(null);

  const handleDrawerTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      drawerTouchStartX.current = e.touches[0].clientX;
      setCloseDragOffset(0);
    }
  };

  const handleDrawerTouchMove = (e: React.TouchEvent) => {
    if (drawerTouchStartX.current === null) return;
    const deltaX = e.touches[0].clientX - drawerTouchStartX.current;
    if (deltaX < 0) {
      setCloseDragOffset(deltaX);
    } else {
      setCloseDragOffset(0);
    }
  };

  const handleDrawerTouchEnd = (e: React.TouchEvent) => {
    if (drawerTouchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - drawerTouchStartX.current;
    if (deltaX < -55) {
      onCloseMobile?.();
    }
    drawerTouchStartX.current = null;
    setCloseDragOffset(null);
  };

  const favoriteChannels = useMemo(() => {
    return CHANNELS_DATA.filter((ch) => favoriteChannelIds.includes(ch.id));
  }, [favoriteChannelIds]);

  const isDynamicIcons = Boolean(settings.dynamicSidebarIcons);
  const isFluentIcons = Boolean(settings.fluentIcons);
  // When Dynamic sidebar icons is active:
  // - home, articles/update blogs, watch, gallery, notes, draws, vlc, craftmine, photopea, discord: icon fluent colore (3D)
  // - sign in, settings, winui 3: icon thường
  const useFluent3DForContent = isDynamicIcons || isFluentIcons;
  const useFluent3DForSystem = !isDynamicIcons && isFluentIcons;
  const shouldAnimateSidebar = !settings.reduceAllMotion && settings.animateSidebar;
  const isHoverToExpandActive = Boolean(settings.hoverToExpand && isCollapsed);
  const isExpandedOnHover = isHovered || isToolsFlyoutOpen || isSignInFlyoutOpen || Boolean(sidebarContextMenu);
  const effectiveCollapsed = isHoverToExpandActive
    ? !isExpandedOnHover
    : (settings.autoHideSidebar ? !isHovered : isCollapsed);

  const handleNavClick = (route: string, state?: any) => {
    navigate(route, state);
    if (onCloseMobile) onCloseMobile();
  };

  // Handler for Export M3U8
  const handleExportM3U8 = () => {
    try {
      downloadPlaylistFile(channels.length > 0 ? channels : CHANNELS_DATA, 'vplay_playlist.m3u8');
    } catch (e) {
      console.error(e);
    }
  };

  // Handler for Import M3U File
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;
      try {
        const parsed = parseM3UPlaylist(content);
        if (parsed.length === 0) return;
        const fullChannels: Channel[] = parsed.map((p, idx) => ({
          id: p.id || `m3u-file-${Date.now()}-${idx}`,
          name: p.name || `Channel ${idx + 1}`,
          shortName: p.name || `Channel ${idx + 1}`,
          slug: p.slug || `m3u-file-ch-${idx + 1}`,
          logo: p.logo || 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=200&auto=format&fit=crop&q=80',
          category: p.category || 'Special',
          quality: p.quality || 'HD',
          streamUrl: p.streamUrl || '',
          isLive: true,
          description: p.description || 'Channel loaded from M3U file.',
          currentProgram: p.currentProgram || {
            title: p.name || 'Live Broadcast',
            startTime: '00:00',
            endTime: '24:00',
            progress: 50,
            description: 'Live broadcast.'
          }
        }));
        onImportChannels(fullChannels);
      } catch (err) {
        console.error(err);
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  // Navigation Items matching the Windows 10 Settings Style (Settings moved to bottom footer)
  const navItems = useMemo(() => {
    const list = [
      {
        id: 'live-tv',
        label: 'Watch',
        secondary: 'Watch',
        route: '/live-tv',
        icon: FluentWatchIcon,
        hasSubmenu: true,
      },
      {
        id: 'news',
        label: 'Articles',
        secondary: 'Articles',
        route: '/news',
        icon: FluentArticlesIcon,
      },
    ];

    if (settings.developerMode) {
      list.push({
        id: 'test',
        label: 'Insider Flags (Lab)',
        secondary: 'Developer Mode',
        route: '/test',
        icon: FlaskConical,
      });
    }

    return list;
  }, [settings.developerMode]);

  const isCurrentActive = (route: string) => {
    if (route === '/' && (currentRoute === '/' || currentRoute === '/home')) return true;
    if (route === '/news' && (currentRoute === '/news' || currentRoute.startsWith('/article') || currentRoute.startsWith('/news/'))) return true;
    if (route === '/updates' && (currentRoute === '/updates' || currentRoute.startsWith('/updates'))) return true;
    if (route === '/live-tv' && (currentRoute === '/live-tv' || currentRoute.startsWith('/live-tv'))) return true;
    if (route === '/notes' && (currentRoute === '/notes' || currentRoute === '/write' || currentRoute === '/present' || currentRoute === '/table')) return true;
    if (route === '/gallery' && (currentRoute === '/gallery' || currentRoute.startsWith('/gallery'))) return true;
    if (route === '/draws' && (currentRoute === '/draws' || currentRoute.startsWith('/draws'))) return true;
    if (route === '/vlc' && (currentRoute === '/vlc' || currentRoute.startsWith('/vlc'))) return true;
    if (route === '/camera' && (currentRoute === '/camera' || currentRoute.startsWith('/camera'))) return true;
    if (route === '/craftmine' && currentRoute === '/craftmine') return true;
    if (route === '/photopea' && currentRoute === '/photopea') return true;
    if (route === '/settings' && (currentRoute === '/settings' || currentRoute.startsWith('/settings'))) return true;
    if (route === '/about' && (currentRoute === '/about' || currentRoute.startsWith('/about'))) return true;
    if (route !== '/' && currentRoute.startsWith(route)) return true;
    return false;
  };

  // Render Flyout Menu matching user screenshot
  const renderToolsFlyout = (isCollapsedMode = false) => {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: isCollapsedMode ? 0 : 4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: isCollapsedMode ? 0 : 4 }}
        transition={{ duration: 0.14, ease: 'easeOut' }}
        className={`tools-flyout-container absolute z-50 w-[230px] bg-white dark:bg-[#1b1f24] border border-black/10 dark:border-[#3e3e3e] rounded-[6px] shadow-2xl p-1.5 space-y-0.5 text-[#111827] dark:text-white select-none ${
          isCollapsedMode ? 'left-[52px] bottom-14' : 'left-3 right-3 sm:left-[265px] sm:right-auto bottom-12'
        }`}
        style={{
          boxShadow: '0 16px 40px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. About with chevron right > */}
        <button
          type="button"
          onClick={() => {
            setIsToolsFlyoutOpen(false);
            onOpenHelp();
          }}
          className="w-full h-[36px] px-3 rounded-[4px] flex items-center justify-between text-[13px] text-[#111827] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 text-[#111827] dark:text-white stroke-[1.75]" />
            <span>About</span>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-400 stroke-[1.5]" />
        </button>

        {/* 2. Send feedback */}
        <button
          type="button"
          onClick={() => {
            setIsToolsFlyoutOpen(false);
            handleNavClick('/feedback');
          }}
          className="w-full h-[36px] px-3 rounded-[4px] flex items-center justify-between text-[13px] text-[#111827] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <FluentPersonFeedbackIcon className="w-4 h-4 text-[#111827] dark:text-white shrink-0" />
            <span>Send feedback</span>
          </div>
        </button>

        {/* 3. Notification settings */}
        <button
          type="button"
          onClick={() => {
            setIsToolsFlyoutOpen(false);
            onOpenNotifications();
          }}
          className="w-full h-[36px] px-3 rounded-[4px] flex items-center justify-between text-[13px] text-[#111827] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-4 h-4 text-[#111827] dark:text-white stroke-[1.75]" />
            <span>Notification settings</span>
          </div>
        </button>

        <div className="my-1 mx-1 h-[1px] bg-black/10 dark:bg-white/10" />

        {/* 4. Add stream */}
        <button
          type="button"
          onClick={() => {
            setIsToolsFlyoutOpen(false);
            onOpenAddStream();
          }}
          className="w-full h-[36px] px-3 rounded-[4px] flex items-center justify-between text-[13px] text-[#111827] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <PlusCircle className="w-4 h-4 text-[#0078d4] dark:text-[#4cc2ff] stroke-[1.75]" />
            <span>Add stream</span>
          </div>
        </button>

        {/* 5. Import playlist */}
        <button
          type="button"
          onClick={() => {
            setIsToolsFlyoutOpen(false);
            fileInputRef.current?.click();
          }}
          className="w-full h-[36px] px-3 rounded-[4px] flex items-center justify-between text-[13px] text-[#111827] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <FluentArrowUploadIcon className="w-4 h-4 text-neutral-500 dark:text-neutral-300 shrink-0" />
            <span>Import playlist</span>
          </div>
        </button>

        {/* 6. Export playlist */}
        <button
          type="button"
          onClick={() => {
            setIsToolsFlyoutOpen(false);
            handleExportM3U8();
          }}
          className="w-full h-[36px] px-3 rounded-[4px] flex items-center justify-between text-[13px] text-[#111827] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <DownloadCloud className="w-4 h-4 text-neutral-500 dark:text-neutral-300 stroke-[1.75]" />
            <span>Export playlist</span>
          </div>
        </button>

        {/* Notes Tool Section */}
        <div className="my-1 mx-1 h-[1px] bg-black/10 dark:bg-white/10" />
        <div className="px-3 py-1 text-[10px] font-semibold tracking-wider text-neutral-500 dark:text-neutral-400 uppercase">
          Ứng dụng
        </div>

        {/* Gallery */}
        <button
          type="button"
          id="tool-gallery"
          onClick={() => {
            setIsToolsFlyoutOpen(false);
            handleNavClick('/gallery');
          }}
          className="w-full h-[36px] px-3 rounded-[4px] flex items-center justify-between text-[13px] text-[#111827] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <FluentGalleryIcon className="w-4 h-4 text-[#111827] dark:text-white shrink-0" />
            <span>Gallery</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 font-medium">Bộ sưu tập</span>
        </button>

        {/* Ink Canvas */}
        <button
          type="button"
          id="tool-draws"
          onClick={() => {
            setIsToolsFlyoutOpen(false);
            handleNavClick('/draws');
          }}
          className="w-full h-[36px] px-3 rounded-[4px] flex items-center justify-between text-[13px] text-[#111827] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <FluentInkCanvasIcon className="fluent-3d-icon w-4 h-4 shrink-0" />
            <span>Ink Canvas</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 font-medium">Vẽ Paint</span>
        </button>

        {/* Notes */}
        <button
          type="button"
          id="tool-notes"
          onClick={() => {
            setIsToolsFlyoutOpen(false);
            handleNavClick('/notes');
          }}
          className="w-full h-[36px] px-3 rounded-[4px] flex items-center justify-between text-[13px] text-[#111827] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <FluentNotesIcon className="w-4 h-4 text-[#111827] dark:text-white shrink-0" />
            <span>Notes</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 font-medium">Ghi chú</span>
        </button>

        {/* VLC */}
        <button
          type="button"
          id="tool-vlc"
          onClick={() => {
            setIsToolsFlyoutOpen(false);
            handleNavClick('/vlc');
          }}
          className="w-full h-[36px] px-3 rounded-[4px] flex items-center justify-between text-[13px] text-[#111827] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <FluentVlcIcon white className="w-4 h-4 shrink-0 text-white" />
            <span>VLC</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 font-medium">Media player</span>
        </button>

        {/* Camera Tool */}
        <button
          type="button"
          id="tool-camera"
          onClick={() => {
            setIsToolsFlyoutOpen(false);
            handleNavClick('/camera');
          }}
          className="w-full h-[36px] px-3 rounded-[4px] flex items-center justify-between text-[13px] text-[#111827] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <FluentCameraIcon className="w-4 h-4 shrink-0 text-black dark:text-white" />
            <span>Camera</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 font-medium">Insider</span>
        </button>

        {/* Photopea Tool */}
        <button
          type="button"
          id="tool-photopea"
          onClick={() => {
            setIsToolsFlyoutOpen(false);
            handleNavClick('/photopea');
          }}
          className="w-full h-[36px] px-3 rounded-[4px] flex items-center justify-between text-[13px] text-[#111827] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <FluentPhotopeaIcon className="w-4 h-4 shrink-0 text-black dark:text-white" />
            <span>Photopea</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 font-medium">Photo editor</span>
        </button>

        {/* Article contextual tools */}
        {(currentRoute === '/news' || currentRoute.startsWith('/article')) && (
          <>
            <div className="my-1 mx-1 h-[1px] bg-black/10 dark:bg-white/10" />
            <button
              type="button"
              onClick={() => {
                setIsToolsFlyoutOpen(false);
                onOpenFindWords();
              }}
              className="w-full h-[36px] px-3 rounded-[4px] flex items-center gap-2.5 text-[13px] text-[#111827] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 transition-colors cursor-pointer text-left"
            >
              <FluentSearchIcon className="w-4 h-4 text-neutral-500 dark:text-neutral-300 shrink-0" />
              <span>Find words</span>
            </button>
          </>
        )}
      </motion.div>
    );
  };

  // Render Flyout Menu for Sign in with distinct pure slide-up animation and acrylic blur
  const renderSignInFlyout = (isCollapsedMode = false) => {
    return (
      <motion.div
        key="signin-flyout-panel"
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 18 }}
        transition={{ duration: 0.44, ease: [0.16, 1, 0.3, 1] }}
        className={`signin-flyout-panel signin-flyout-container absolute z-50 w-[264px] bg-white/70 dark:bg-[#1c1c1c]/70 backdrop-blur-3xl backdrop-saturate-150 border border-black/10 dark:border-white/10 rounded-[10px] shadow-[0_16px_48px_rgba(0,0,0,0.22),0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.7),0_2px_8px_rgba(255,255,255,0.04)] p-1.5 space-y-0.5 text-[#111827] dark:text-white select-none ${
          isCollapsedMode
            ? settings.sidebarPosition === 'right'
              ? 'right-[54px] bottom-0'
              : 'left-[54px] bottom-0'
            : 'bottom-full mb-2 left-0 right-0 sm:left-0 sm:right-auto sm:w-[264px]'
        }`}
        style={{
          backdropFilter: 'blur(32px) saturate(180%)',
          WebkitBackdropFilter: 'blur(32px) saturate(180%)',
          boxShadow: '0 16px 40px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Signed in status header */}
        {signedInAccount && (
          <div className="px-3 py-2 mb-1 rounded-[6px] bg-black/[0.04] dark:bg-white/[0.04] border-0 border-none flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-6 h-6 rounded-full bg-[#0078d4]/15 dark:bg-[#4cc2ff]/20 text-[#0078d4] dark:text-[#4cc2ff] flex items-center justify-center text-xs font-bold shrink-0 border border-[#0078d4]/30 dark:border-[#4cc2ff]/30">
                {signedInAccount[0]}
              </div>
              <div className="min-w-0 truncate">
                <div className="text-[12px] font-medium text-[#111827] dark:text-white truncate">{signedInAccount}</div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Active account</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleSignInAction('Sign out')}
              className="text-[11px] text-neutral-500 hover:text-rose-500 hover:underline px-1.5 py-0.5 rounded cursor-pointer transition-colors"
            >
              Sign out
            </button>
          </div>
        )}

        {/* 1. Sign in with Sparkle */}
        <button
          type="button"
          onClick={() => handleSignInAction('Sparkle')}
          className="w-full h-[40px] px-3 rounded-[6px] flex items-center gap-3 text-[13px] text-[#111827] dark:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] active:bg-black/[0.08] dark:active:bg-white/[0.12] transition-colors cursor-pointer text-left"
        >
          <div className="w-5 h-5 rounded-[5px] bg-gradient-to-br from-[#0078d4] to-[#4cc2ff] flex items-center justify-center shrink-0 border border-[#4cc2ff]/40 shadow-xs">
            <span className="text-white font-black text-xs leading-none">V</span>
          </div>
          <span className="font-medium truncate">Sign in with Sparkle</span>
        </button>

        {/* 2. Sign in with Apple */}
        <button
          type="button"
          onClick={() => handleSignInAction('Apple')}
          className="w-full h-[40px] px-3 rounded-[6px] flex items-center gap-3 text-[13px] text-[#111827] dark:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] active:bg-black/[0.08] dark:active:bg-white/[0.12] transition-colors cursor-pointer text-left"
        >
          <div className="w-5 h-5 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 fill-current text-[#111827] dark:text-white" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.63 1.35-.58.67-1.09 1.74-.96 2.77 1 .08 2.05-.52 2.67-1.27z"/>
            </svg>
          </div>
          <span className="font-medium truncate">Sign in with Apple</span>
        </button>

        {/* 3. Sign in with Google */}
        <button
          type="button"
          onClick={() => handleSignInAction('Google')}
          className="w-full h-[40px] px-3 rounded-[6px] flex items-center gap-3 text-[13px] text-[#111827] dark:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] active:bg-black/[0.08] dark:active:bg-white/[0.12] transition-colors cursor-pointer text-left"
        >
          <div className="w-5 h-5 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
          </div>
          <span className="font-medium truncate">Sign in with Google</span>
        </button>

        {/* 4. Sign in with Microsoft */}
        <button
          type="button"
          onClick={() => handleSignInAction('Microsoft')}
          className="w-full h-[40px] px-3 rounded-[6px] flex items-center gap-3 text-[13px] text-[#111827] dark:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] active:bg-black/[0.08] dark:active:bg-white/[0.12] transition-colors cursor-pointer text-left"
        >
          <div className="w-5 h-5 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 microsoft-logo" viewBox="0 0 24 24" stroke="none" fill="none">
              <rect x="1" y="1" width="10" height="10" fill="#F25022" stroke="none" />
              <rect x="13" y="1" width="10" height="10" fill="#7FBA00" stroke="none" />
              <rect x="1" y="13" width="10" height="10" fill="#00A4EF" stroke="none" />
              <rect x="13" y="13" width="10" height="10" fill="#FFB900" stroke="none" />
            </svg>
          </div>
          <span className="font-medium truncate">Sign in with Microsoft</span>
        </button>

        {/* Divider */}
        <div className="my-1.5 mx-1 h-[1px] bg-black/[0.08] dark:bg-white/[0.08]" />

        {/* 5. Continue without account */}
        <button
          type="button"
          onClick={() => handleSignInAction('Guest')}
          className="w-full h-[40px] px-3 rounded-[6px] flex items-center gap-3 text-[13px] text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] active:bg-black/[0.08] dark:active:bg-white/[0.12] transition-colors cursor-pointer text-left"
        >
          <div className="w-5 h-5 flex items-center justify-center shrink-0">
            <FluentPersonDeleteIcon className="w-4 h-4 text-neutral-500 dark:text-neutral-400 shrink-0" />
          </div>
          <span className="font-normal truncate">Continue without account</span>
        </button>
      </motion.div>
    );
  };

  const SIDEBAR_MENU_MARGIN = 8;

  interface SidebarContextMenuOverlayProps {
    x: number;
    y: number;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
    hoverToExpand?: boolean;
    onToggleHoverToExpand: () => void;
    fluentIcons?: boolean;
    onToggleFluentIcons: () => void;
    dynamicSidebarIcons?: boolean;
    onToggleDynamicSidebarIcons: () => void;
    onNavigateSettings: () => void;
    onGoBack: () => void;
    onClose: () => void;
  }

  const SidebarContextMenuOverlay: React.FC<SidebarContextMenuOverlayProps> = ({
    x,
    y,
    isCollapsed,
    onToggleCollapse,
    hoverToExpand,
    onToggleHoverToExpand,
    fluentIcons,
    onToggleFluentIcons,
    dynamicSidebarIcons,
    onToggleDynamicSidebarIcons,
    onNavigateSettings,
    onGoBack,
    onClose,
  }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ left: x, top: y });

    useLayoutEffect(() => {
      const el = menuRef.current;
      if (!el) return;
      const { width, height } = el.getBoundingClientRect();
      const maxLeft = window.innerWidth - width - SIDEBAR_MENU_MARGIN;
      const maxTop = window.innerHeight - height - SIDEBAR_MENU_MARGIN;
      setPosition({
        left: Math.max(SIDEBAR_MENU_MARGIN, Math.min(x, maxLeft)),
        top: Math.max(SIDEBAR_MENU_MARGIN, y > maxTop ? y - height : y),
      });
      el.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus({ preventScroll: true });
    }, [x, y]);

    useEffect(() => {
      const handlePointer = (e: PointerEvent) => {
        if (!menuRef.current?.contains(e.target as Node)) onClose();
      };
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
          return;
        }
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          const buttons: HTMLButtonElement[] = Array.from(
            menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []
          );
          const idx = buttons.indexOf(document.activeElement as HTMLButtonElement);
          const next = e.key === 'ArrowDown' ? (idx + 1) % buttons.length : (idx - 1 + buttons.length) % buttons.length;
          buttons[next]?.focus();
        }
      };
      document.addEventListener('pointerdown', handlePointer, true);
      document.addEventListener('keydown', handleKey);
      window.addEventListener('resize', onClose);
      window.addEventListener('blur', onClose);
      return () => {
        document.removeEventListener('pointerdown', handlePointer, true);
        document.removeEventListener('keydown', handleKey);
        window.removeEventListener('resize', onClose);
        window.removeEventListener('blur', onClose);
      };
    }, [onClose]);

    return createPortal(
      <motion.div
        ref={menuRef}
        role="menu"
        aria-label="Sidebar actions"
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 14 }}
        transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
        onContextMenu={(e) => e.preventDefault()}
        className={`fixed z-[2147483647] w-[232px] ${flyoutPanelClassName} fluent-context-menu`}
        style={{ ...flyoutPanelStyle, left: position.left, top: position.top }}
      >
        <motion.button
          type="button"
          role="menuitem"
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: { duration: 0.38, delay: 0, ease: [0.16, 1, 0.3, 1] },
          }}
          onClick={() => {
            onClose();
            window.location.reload();
          }}
          className="w-full h-[36px] px-3 rounded-[6px] flex items-center gap-3 text-[13px] font-medium text-left outline-none transition-colors cursor-pointer hover:bg-black/[0.05] dark:hover:bg-white/[0.08] focus-visible:bg-black/[0.05] dark:focus-visible:bg-white/[0.08] active:bg-black/[0.08] dark:active:bg-white/[0.12]"
        >
          <RefreshCw className="w-4 h-4 shrink-0 text-black dark:text-neutral-300" />
          <span className="truncate">Refresh</span>
        </motion.button>

        <motion.button
          type="button"
          role="menuitem"
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: { duration: 0.38, delay: 0.04, ease: [0.16, 1, 0.3, 1] },
          }}
          onClick={() => {
            onClose();
            onGoBack();
          }}
          className="w-full h-[36px] px-3 rounded-[6px] flex items-center gap-3 text-[13px] font-medium text-left outline-none transition-colors cursor-pointer hover:bg-black/[0.05] dark:hover:bg-white/[0.08] focus-visible:bg-black/[0.05] dark:focus-visible:bg-white/[0.08] active:bg-black/[0.08] dark:active:bg-white/[0.12]"
        >
          <ArrowLeft className="w-4 h-4 shrink-0 text-black dark:text-neutral-300" />
          <span className="truncate">Go back</span>
        </motion.button>

        <motion.button
          type="button"
          role="menuitem"
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: { duration: 0.38, delay: 0.08, ease: [0.16, 1, 0.3, 1] },
          }}
          onClick={() => {
            onClose();
            onToggleCollapse?.();
          }}
          className="w-full h-[36px] px-3 rounded-[6px] flex items-center gap-3 text-[13px] font-medium text-left outline-none transition-colors cursor-pointer hover:bg-black/[0.05] dark:hover:bg-white/[0.08] focus-visible:bg-black/[0.05] dark:focus-visible:bg-white/[0.08] active:bg-black/[0.08] dark:active:bg-white/[0.12]"
        >
          <PanelLeft className="w-4 h-4 shrink-0 text-black dark:text-neutral-300" />
          <span className="truncate">{isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}</span>
        </motion.button>

        <motion.button
          type="button"
          role="menuitem"
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: { duration: 0.38, delay: 0.12, ease: [0.16, 1, 0.3, 1] },
          }}
          onClick={() => {
            onToggleHoverToExpand();
            onClose();
          }}
          className="w-full h-[36px] px-3 rounded-[6px] flex items-center gap-3 text-[13px] font-medium text-left outline-none transition-colors cursor-pointer hover:bg-black/[0.05] dark:hover:bg-white/[0.08] focus-visible:bg-black/[0.05] dark:focus-visible:bg-white/[0.08] active:bg-black/[0.08] dark:active:bg-white/[0.12]"
        >
          <PanelsTopLeft className="w-4 h-4 shrink-0 text-black dark:text-neutral-300" />
          <span className="truncate flex-1">Hover to expand</span>
          {hoverToExpand && (
            <Check className="w-4 h-4 shrink-0 text-black dark:text-[#4cc2ff]" />
          )}
        </motion.button>

        <motion.div
          role="separator"
          initial={{ opacity: 0, scaleX: 0.8 }}
          animate={{
            opacity: 1,
            scaleX: 1,
            transition: { duration: 0.38, delay: 0.15, ease: [0.16, 1, 0.3, 1] },
          }}
          className="h-px bg-black/10 dark:bg-white/10 my-1 mx-1 origin-left"
        />

        <motion.button
          type="button"
          role="menuitem"
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: { duration: 0.38, delay: 0.18, ease: [0.16, 1, 0.3, 1] },
          }}
          aria-label="Bật/tắt nhanh Fluent icons (Insider flag)"
          onClick={() => {
            onToggleFluentIcons();
            onClose();
          }}
          className="w-full h-[36px] px-3 rounded-[6px] flex items-center gap-3 text-[13px] font-medium text-left outline-none transition-colors cursor-pointer hover:bg-black/[0.05] dark:hover:bg-white/[0.08] focus-visible:bg-black/[0.05] dark:focus-visible:bg-white/[0.08] active:bg-black/[0.08] dark:active:bg-white/[0.12]"
        >
          <Palette className="w-4 h-4 shrink-0 text-black dark:text-neutral-300" />
          <span className="truncate flex-1">Fluent design icons</span>
          {fluentIcons && (
            <Check className="w-4 h-4 shrink-0 text-black dark:text-[#4cc2ff]" />
          )}
        </motion.button>

        <motion.button
          type="button"
          role="menuitem"
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: { duration: 0.38, delay: 0.20, ease: [0.16, 1, 0.3, 1] },
          }}
          aria-label="Dynamic sidebar icons: icon thường cho Sign In, Settings, WinUI 3; icon Fluent 3D màu cho Home, Update blogs, Watch, Gallery, Notes, Ink Canvas..."
          onClick={() => {
            onToggleDynamicSidebarIcons();
            onClose();
          }}
          className="w-full h-[36px] px-3 rounded-[6px] flex items-center gap-3 text-[13px] font-medium text-left outline-none transition-colors cursor-pointer hover:bg-black/[0.05] dark:hover:bg-white/[0.08] focus-visible:bg-black/[0.05] dark:focus-visible:bg-white/[0.08] active:bg-black/[0.08] dark:active:bg-white/[0.12]"
        >
          <Sparkles className="w-4 h-4 shrink-0 text-black dark:text-neutral-300" />
          <span className="truncate flex-1">Dynamic sidebar icons</span>
          {dynamicSidebarIcons && (
            <Check className="w-4 h-4 shrink-0 text-black dark:text-[#4cc2ff]" />
          )}
        </motion.button>

        <motion.button
          type="button"
          role="menuitem"
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: { duration: 0.38, delay: 0.22, ease: [0.16, 1, 0.3, 1] },
          }}
          onClick={() => {
            onClose();
            onNavigateSettings();
          }}
          className="w-full h-[36px] px-3 rounded-[6px] flex items-center gap-3 text-[13px] font-medium text-left outline-none transition-colors cursor-pointer hover:bg-black/[0.05] dark:hover:bg-white/[0.08] focus-visible:bg-black/[0.05] dark:focus-visible:bg-white/[0.08] active:bg-black/[0.08] dark:active:bg-white/[0.12]"
        >
          <Settings2 className="w-4 h-4 shrink-0 text-black dark:text-neutral-300" />
          <span className="truncate">Interface settings</span>
        </motion.button>
      </motion.div>,
      document.body
    );
  };

  // Sidebar Context Menu Component matching Gallery Context Menu design and animation
  const renderSidebarContextMenu = () => {
    return (
      <AnimatePresence>
        {sidebarContextMenu && (
          <SidebarContextMenuOverlay
            key="sidebar-context-menu"
            x={sidebarContextMenu.x}
            y={sidebarContextMenu.y}
            isCollapsed={isCollapsed}
            onToggleCollapse={onToggleCollapse}
            hoverToExpand={settings.hoverToExpand}
            onToggleHoverToExpand={() => {
              const next = !settings.hoverToExpand;
              updateSetting('hoverToExpand', next);
              showAppToast(next ? 'Enable Hover to expand' : 'Disable Hover to expand');
            }}
            fluentIcons={settings.fluentIcons}
            onToggleFluentIcons={() => {
              const next = !settings.fluentIcons;
              updateSetting('fluentIcons', next);
              showAppToast(next ? 'Enable Fluent icons' : 'Disable Fluent icons');
            }}
            dynamicSidebarIcons={settings.dynamicSidebarIcons}
            onToggleDynamicSidebarIcons={() => {
              const next = !settings.dynamicSidebarIcons;
              updateSetting('dynamicSidebarIcons', next);
              showAppToast(next ? 'Enable Dynamic sidebar icons' : 'Disable Dynamic sidebar icons');
            }}
            onNavigateSettings={() => navigate('/settings')}
            onGoBack={handleGoBack}
            onClose={() => setSidebarContextMenu(null)}
          />
        )}
      </AnimatePresence>
    );
  };

  const renderSidebarBody = (isMobile: boolean = false) => {
  const containerRef = isMobile ? mobileNavRef : desktopNavRef;
  
  return (
  <div className="relative flex flex-col h-full select-none text-[13.5px] font-sans" onContextMenu={handleSidebarContextMenu} onTouchStart={handleSidebarTouchStart} onTouchEnd={clearSidebarHold} onTouchMove={clearSidebarHold} onTouchCancel={clearSidebarHold}>
        {/* Hidden M3U file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".m3u,.m3u8,text/plain"
          onChange={handleFileInputChange}
          className="hidden"
          aria-hidden="true"
        />

        {/* Top Header: Left Arrow (Back) + Hamburger Toggle + Vplay Logo placed right beside it */}
        <div className="px-3.5 pt-3 pb-2 flex items-center justify-start gap-1 shrink-0">
          {/* Back button with left arrow */}
          <button
            type="button"
            id={isMobile ? 'btn-mobile-sidebar-back' : 'btn-desktop-sidebar-back'}
            onClick={handleGoBack}
            onMouseEnter={(e) => showTooltip('Go back', e)}
            onMouseLeave={hideTooltip}
            aria-label="Go back"
            className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-[6px] flex items-center justify-center text-black dark:text-white hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 cursor-pointer transition-colors shrink-0"
          >
            <ArrowLeft className="w-4.5 h-4.5 stroke-[1.75] text-black dark:text-white stroke-black dark:stroke-white" />
          </button>

          {/* Hamburger Menu Icon */}
          <button
            type="button"
            id={isMobile ? 'btn-mobile-sidebar-toggle' : 'btn-desktop-sidebar-toggle'}
            onClick={isMobile ? onCloseMobile : onToggleCollapse}
            onMouseEnter={(e) => showTooltip('Collapse or expand', e)}
            onMouseLeave={hideTooltip}
            aria-label="Collapse or expand"
            className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-[6px] flex items-center justify-center text-black dark:text-white hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15 cursor-pointer transition-colors shrink-0"
          >
            {isMobile ? <X className="w-4.5 h-4.5 stroke-[1.75] text-black dark:text-white" /> : <Menu className="w-4.5 h-4.5 stroke-[1.75] text-black dark:text-white" />}
          </button>

          {/* Logo placed right next to hamburger menu icon */}
          <button
            type="button"
            onClick={() => handleNavClick('/')}
            className="cursor-pointer flex items-center p-0 border-0 bg-transparent hover:opacity-85 active:scale-95 transition-opacity"
            aria-label="Home"
          >
            <img 
              src={LOGO_SRC}
              alt="Sparkle" 
              referrerPolicy="no-referrer"
              className="h-6 w-auto object-contain drop-shadow-sm"
            />
          </button>
        </div>

        {/* Unified Navigation List inside common scroll container */}
        <div 
          ref={containerRef}
          key={`sidebar-nav-expanded-${isSplashFinished ? 'booted' : 'booting'}`}
          className={`flex-1 overflow-y-auto pb-4 no-scrollbar space-y-1 px-2.5 font-normal relative ${
            isSplashFinished ? 'sidebar-items-slide-up' : 'opacity-0'
          }`}
        >
          {/* Morphing Vertical Blue Accent Bar */}
          <MorphingVerticalIndicator
            containerRef={containerRef}
            currentRoute={currentRoute}
            dependencyKey={`${navItems.length}-${isLiveTvExpanded}-${currentRoute}`}
          />

          {/* 1. Home */}
          <div className="shrink-0">
            <button
              type="button"
              id={isMobile ? 'mobile-nav-home' : 'sidebar-nav-home'}
              data-nav-active={(currentRoute === '/' || currentRoute === '/home' || currentRoute === '/home-preview') ? 'true' : undefined}
              onClick={() => handleNavClick('/')}
              aria-label="Home"
              className={`sidebar-nav-item w-full h-[38px] flex items-center gap-3.5 px-3 cursor-pointer relative text-left rounded-[6px] transition-colors ${
                (currentRoute === '/' || currentRoute === '/home' || currentRoute === '/home-preview')
                  ? 'bg-black/5 dark:bg-white/[0.08] text-black dark:text-white font-medium shadow-xs'
                  : 'text-black dark:text-[#cccccc] hover:bg-black/5 dark:hover:bg-white/[0.05] hover:text-black dark:hover:text-white'
              }`}
            >
              {useFluent3DForContent ? (
                <Fluent3DHomeIcon className="w-5 h-5 shrink-0" />
              ) : (
                <FluentHomeIcon className="w-5 h-5 shrink-0 text-black dark:text-white" />
              )}
              <span className="truncate text-[13.5px]">Home</span>
            </button>
          </div>

          {/* 2. Feed */}
          <div className="shrink-0">
            <button
              type="button"
              id={isMobile ? 'mobile-nav-articles' : 'sidebar-nav-articles'}
              data-nav-active={(currentRoute === '/news' || currentRoute.startsWith('/article') || currentRoute.startsWith('/news/') || currentRoute === '/updates' || currentRoute.startsWith('/updates')) ? 'true' : undefined}
              onClick={() => handleNavClick('/news')}
              aria-label="Feed"
              className={`sidebar-nav-item w-full h-[38px] flex items-center gap-3.5 px-3 cursor-pointer relative text-left rounded-[6px] transition-colors ${
                (currentRoute === '/news' || currentRoute.startsWith('/article') || currentRoute.startsWith('/news/') || currentRoute === '/updates' || currentRoute.startsWith('/updates'))
                  ? 'bg-black/5 dark:bg-white/[0.08] text-black dark:text-white font-medium shadow-xs'
                  : 'text-black dark:text-[#cccccc] hover:bg-black/5 dark:hover:bg-white/[0.05] hover:text-black dark:hover:text-white'
              }`}
            >
              {useFluent3DForContent ? (
                <Fluent3DArticlesIcon className="w-5 h-5 shrink-0" />
              ) : (
                <FluentArticlesIcon className="w-5 h-5 shrink-0 text-black dark:text-white" />
              )}
              <span className="truncate text-[13.5px]">Feed</span>
            </button>
          </div>

          {/* Divider & Category Heading: Apps */}
          <div className="my-2 mx-1 h-[1px] bg-black/10 dark:bg-white/10" />
          <div className="px-1.5 pt-0.5 pb-1 shrink-0">
            <h2 className="text-black dark:text-[#a1a1aa] text-[11px] font-semibold tracking-wider uppercase select-none">
              Apps
            </h2>
          </div>

          {/* 3. Watch */}
          <div className="w-full">
            <button
              type="button"
              id={isMobile ? 'mobile-nav-live-tv' : 'sidebar-nav-live-tv'}
              data-nav-active={(currentRoute === '/live-tv' || currentRoute.startsWith('/live-tv')) ? 'true' : undefined}
              onClick={() => handleNavClick('/live-tv')}
              aria-label="Watch"
              className={`sidebar-nav-item w-full h-[38px] flex items-center justify-between px-3 cursor-pointer relative text-left rounded-[6px] transition-colors ${
                (currentRoute === '/live-tv' || currentRoute.startsWith('/live-tv'))
                  ? 'bg-black/5 dark:bg-white/[0.08] text-black dark:text-white font-medium shadow-xs'
                  : 'text-black dark:text-[#cccccc] hover:bg-black/5 dark:hover:bg-white/[0.05] hover:text-black dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3.5 truncate">
                {useFluent3DForContent ? (
                  <Fluent3DWatchPreviewIcon className="w-5 h-5 shrink-0" />
                ) : (
                  <FluentWatchIcon className="w-5 h-5 shrink-0 text-black dark:text-white" />
                )}
                <span className="truncate text-[13.5px]">Watch</span>
              </div>

              {/* Submenu toggle */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLiveTvExpanded(!isLiveTvExpanded);
                }}
                className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-[4px] cursor-pointer"
              >
                {isLiveTvExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                )}
              </div>
            </button>

            {/* Live TV Channels Quick Submenu */}
            {isLiveTvExpanded && (
              <div className="ml-4 pl-2.5 space-y-0.5 py-1">
                {channels.slice(0, 8).map((ch) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => {
                      handleNavClick(`/live-tv?channel=${ch.slug}`);
                      if (onSelectChannel) onSelectChannel(ch);
                      showAppToast(`Switched to ${ch.name}`);
                    }}
                    className="w-full h-[30px] flex items-center justify-between px-2.5 rounded-[4px] text-xs text-black dark:text-[#a1a1aa] hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                  >
                    <span className="truncate">{`${String(ch.channelNumber || 1).padStart(3, '0')} | ${ch.shortName || ch.name}`}</span>
                    <span className="px-1.5 py-0.2 text-[9px] bg-[#0078d4] dark:bg-[#4cc2ff] text-white rounded-[2px] font-bold">
                      Play
                    </span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleNavClick('/live-tv')}
                  className="w-full text-left px-2.5 py-1 text-[11px] text-[#0078d4] dark:text-[#4cc2ff] hover:underline font-normal cursor-pointer rounded-[4px]"
                >
                  + View all channels
                </button>
              </div>
            )}
          </div>
  
  {/* 5. Gallery & Folder Tree */}
          <div className="w-full">
            <div className="flex items-center w-full">
              <button
                type="button"
                id={isMobile ? 'mobile-nav-gallery' : 'sidebar-nav-gallery'}
                data-nav-active={(currentRoute === '/gallery' || currentRoute.startsWith('/gallery')) ? 'true' : undefined}
                onClick={() => {
                  setSelectedSidebarFolderId(null);
                  try {
                    sessionStorage.setItem('vplay_gallery_selected_folder', 'null');
                    window.dispatchEvent(new CustomEvent('vplay:gallery:folder_selected', { detail: { folderId: null } }));
                  } catch {}
                  handleNavClick('/gallery', { folderId: null });
                }}
                aria-label="Gallery"
                className={`sidebar-nav-item flex-1 h-[38px] flex items-center justify-between px-3 cursor-pointer relative text-left rounded-[6px] transition-colors ${
                  (currentRoute === '/gallery' || currentRoute.startsWith('/gallery')) && selectedSidebarFolderId === null
                    ? 'bg-black/5 dark:bg-white/[0.08] text-black dark:text-white font-medium shadow-xs'
                    : 'text-black dark:text-[#cccccc] hover:bg-black/5 dark:hover:bg-white/[0.05] hover:text-black dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3.5 truncate">
                  {useFluent3DForContent ? (
                    <Fluent3DGalleryIcon className="w-5 h-5 shrink-0" />
                  ) : (
                    <FluentGalleryIcon className="w-5 h-5 shrink-0 text-black dark:text-white" />
                  )}
                  <span className="truncate text-[13.5px]">Gallery</span>
                </div>
              </button>

              {/* Chevron to expand/collapse folder tree in sidebar (collapsed by default) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsGalleryTreeExpanded((prev) => !prev);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-[6px] hover:bg-black/5 dark:hover:bg-white/[0.08] text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer shrink-0 mr-1"
                aria-label={isGalleryTreeExpanded ? "Thu gọn sơ đồ cây" : "Mở rộng sơ đồ cây thư mục"}
              >
                {isGalleryTreeExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Sơ đồ cây ở sidebar - collapse by default, icon đơn sắc */}
            <AnimatePresence initial={false}>
              {isGalleryTreeExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="ml-5 pl-2.5 my-1 border-l border-black/10 dark:border-white/10 space-y-0.5 text-xs">
                    {/* All Files Root Item (icon đơn sắc) */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSidebarFolderId(null);
                        try {
                          sessionStorage.setItem('vplay_gallery_selected_folder', 'null');
                          window.dispatchEvent(new CustomEvent('vplay:gallery:folder_selected', { detail: { folderId: null } }));
                        } catch {}
                        handleNavClick('/gallery', { folderId: null });
                      }}
                      className={`group relative w-full h-[30px] px-2 rounded-[5px] flex items-center gap-2 text-left cursor-pointer transition-colors ${
                        currentRoute.startsWith('/gallery') && selectedSidebarFolderId === null
                          ? 'bg-[#0078d4]/10 dark:bg-[#4cc2ff]/15 text-[#0078d4] dark:text-[#4cc2ff] font-semibold'
                          : 'text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <span className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-2 h-[1px] bg-black/15 dark:bg-white/15 pointer-events-none" />
                      <Folder className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400 shrink-0 stroke-[1.75]" />
                      <span className="truncate flex-1 text-[12px]">All Files</span>
                      <span className="text-[10px] text-neutral-500 font-normal">
                        {galleryItems.length}
                      </span>
                    </button>

                    {/* Folders in tree */}
                    {galleryFolders.length === 0 ? (
                      <div className="text-[11px] text-neutral-400 dark:text-neutral-500 italic py-1 pl-2">
                        No folders yet
                      </div>
                    ) : (
                      galleryFolders.map((folder) => {
                        const folderItems = galleryItems.filter((it) => it.folderId === folder.id);
                        const isFolderExpanded = expandedSidebarFolderIds.has(folder.id);
                        const isFolderSelected = currentRoute.startsWith('/gallery') && selectedSidebarFolderId === folder.id;

                        return (
                          <div key={folder.id} className="space-y-0.5">
                            <div
                              className={`group relative w-full h-[30px] px-1.5 rounded-[5px] flex items-center gap-1.5 text-left cursor-pointer transition-colors ${
                                isFolderSelected
                                  ? 'bg-[#0078d4]/10 dark:bg-[#4cc2ff]/15 text-[#0078d4] dark:text-[#4cc2ff] font-semibold'
                                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5'
                              }`}
                            >
                              <span className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-2 h-[1px] bg-black/15 dark:bg-white/15 pointer-events-none" />

                              {/* Per folder chevron (icon đơn sắc) */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedSidebarFolderIds((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(folder.id)) next.delete(folder.id);
                                    else next.add(folder.id);
                                    return next;
                                  });
                                }}
                                className="w-4 h-4 flex items-center justify-center rounded hover:bg-black/10 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors shrink-0 cursor-pointer"
                                aria-label={isFolderExpanded ? "Thu gọn" : "Mở rộng"}
                              >
                                {isFolderExpanded ? (
                                  <ChevronDown className="w-3 h-3 text-neutral-500 dark:text-neutral-400" />
                                ) : (
                                  <ChevronRight className="w-3 h-3 text-neutral-500 dark:text-neutral-400" />
                                )}
                              </button>

                              {/* Folder label (icon đơn sắc) */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedSidebarFolderId(folder.id);
                                  try {
                                    sessionStorage.setItem('vplay_gallery_selected_folder', folder.id);
                                    window.dispatchEvent(new CustomEvent('vplay:gallery:folder_selected', { detail: { folderId: folder.id } }));
                                  } catch {}
                                  handleNavClick('/gallery', { folderId: folder.id });
                                }}
                                className="flex items-center gap-2 flex-1 min-w-0 text-left cursor-pointer"
                              >
                                <Folder className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400 shrink-0 stroke-[1.75]" />
                                <span className="truncate flex-1 text-[12px]">{folder.name}</span>
                                <span className="text-[10px] text-neutral-500 font-normal">
                                  {folderItems.length}
                                </span>
                              </button>
                            </div>

                            {/* Nested Items inside folder in the tree (icon đơn sắc) */}
                            {isFolderExpanded && (
                              <div className="ml-4 pl-2 border-l border-dashed border-black/15 dark:border-white/15 space-y-0.5 py-0.5">
                                {folderItems.length === 0 ? (
                                  <div className="text-[11px] text-neutral-400 dark:text-neutral-500 italic py-0.5 pl-1">
                                    (Empty)
                                  </div>
                                ) : (
                                  folderItems.map((item) => (
                                    <button
                                      key={item.id}
                                      type="button"
                                      onClick={() => {
                                        setSelectedSidebarFolderId(folder.id);
                                        try {
                                          sessionStorage.setItem('vplay_gallery_selected_folder', folder.id);
                                          window.dispatchEvent(new CustomEvent('vplay:gallery:folder_selected', { detail: { folderId: folder.id } }));
                                          window.dispatchEvent(new CustomEvent('vplay:gallery:item_selected', { detail: { itemId: item.id } }));
                                        } catch {}
                                        handleNavClick('/gallery', { folderId: folder.id, itemId: item.id });
                                      }}
                                      className="group relative w-full h-[26px] px-2 rounded-[4px] flex items-center gap-2 text-left hover:bg-black/5 dark:hover:bg-white/5 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                                      aria-label={item.title}
                                    >
                                      <span className="absolute -left-2 top-1/2 -translate-y-1/2 w-1.5 h-[1px] bg-black/15 dark:border-white/15 pointer-events-none" />
                                      {item.type === 'image' && (
                                        <ImageIcon className="w-3 h-3 text-neutral-500 dark:text-neutral-400 shrink-0 stroke-[1.5]" />
                                      )}
                                      {item.type === 'video' && (
                                        <Film className="w-3 h-3 text-neutral-500 dark:text-neutral-400 shrink-0 stroke-[1.5]" />
                                      )}
                                      {item.type === 'audio' && (
                                        <Music className="w-3 h-3 text-neutral-500 dark:text-neutral-400 shrink-0 stroke-[1.5]" />
                                      )}
                                      {item.type === 'document' && (
                                        <FileText className="w-3 h-3 text-neutral-500 dark:text-neutral-400 shrink-0 stroke-[1.5]" />
                                      )}
                                      <span className="truncate flex-1 text-[11px] font-normal">
                                        {item.title}
                                      </span>
                                    </button>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 6. Ink Canvas */}
          <div className="w-full">
            <button
              type="button"
              id={isMobile ? 'mobile-nav-draws' : 'sidebar-nav-draws'}
              data-nav-active={(currentRoute === '/draws' || currentRoute.startsWith('/draws')) ? 'true' : undefined}
              onClick={() => handleNavClick('/draws')}
              aria-label="Ink Canvas"
              className={`sidebar-nav-item w-full h-[38px] flex items-center justify-between px-3 cursor-pointer relative text-left rounded-[6px] transition-colors ${
                (currentRoute === '/draws' || currentRoute.startsWith('/draws'))
                  ? 'bg-black/5 dark:bg-white/[0.08] text-black dark:text-white font-medium shadow-xs'
                  : 'text-black dark:text-[#cccccc] hover:bg-black/5 dark:hover:bg-white/[0.05] hover:text-black dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3.5 truncate">
                {useFluent3DForContent ? (
                  <FluentInkCanvasIcon className="fluent-3d-icon w-5 h-5 shrink-0" />
                ) : (
                  <FluentInkCanvasIcon className="w-5 h-5 shrink-0 text-black dark:text-white" />
                )}
                <span className="truncate text-[13.5px]">Ink Canvas</span>
              </div>
            </button>
          </div>

          {/* 7. Notes */}
          <div className="w-full">
            <button
              type="button"
              id={isMobile ? 'mobile-nav-notes' : 'sidebar-nav-notes'}
              data-nav-active={(currentRoute === '/notes' || currentRoute === '/write' || currentRoute === '/present' || currentRoute === '/table') ? 'true' : undefined}
              onClick={() => handleNavClick('/notes')}
              aria-label="Notes"
              className={`sidebar-nav-item w-full h-[38px] flex items-center justify-between px-3 cursor-pointer relative text-left rounded-[6px] transition-colors ${
                (currentRoute === '/notes' || currentRoute === '/write' || currentRoute === '/present' || currentRoute === '/table')
                  ? 'bg-black/5 dark:bg-white/[0.08] text-black dark:text-white font-medium shadow-xs'
                  : 'text-black dark:text-[#cccccc] hover:bg-black/5 dark:hover:bg-white/[0.05] hover:text-black dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3.5 truncate">
                {useFluent3DForContent ? (
                  <Fluent3DNotesIcon className="w-5 h-5 shrink-0" />
                ) : (
                  <FluentNotesIcon className="w-5 h-5 shrink-0 text-black dark:text-white" />
                )}
                <span className="truncate text-[13.5px]">Notes</span>
              </div>
            </button>
          </div>

          {/* 8. Screenbox */}
          <div className="w-full">
            <button
              type="button"
              id={isMobile ? 'mobile-nav-screenbox' : 'sidebar-nav-screenbox'}
              data-nav-active={(currentRoute === '/vlc' || currentRoute.startsWith('/vlc') || currentRoute === '/screenbox' || currentRoute.startsWith('/screenbox') || currentRoute === '/screenbug' || currentRoute.startsWith('/screenbug')) ? 'true' : undefined}
              onClick={() => handleNavClick('/screenbox')}
              aria-label="Screenbox"
              className={`sidebar-nav-item w-full h-[38px] flex items-center justify-between px-3 cursor-pointer relative text-left rounded-[6px] transition-colors ${
                (currentRoute === '/vlc' || currentRoute.startsWith('/vlc') || currentRoute === '/screenbox' || currentRoute.startsWith('/screenbox') || currentRoute === '/screenbug' || currentRoute.startsWith('/screenbug'))
                  ? 'bg-black/5 dark:bg-white/[0.08] text-black dark:text-white font-medium shadow-xs'
                  : 'text-black dark:text-[#cccccc] hover:bg-black/5 dark:hover:bg-white/[0.05] hover:text-black dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3.5 truncate">
                {useFluent3DForContent ? (
                  <Fluent3DScreenbugIcon className="w-5 h-5 shrink-0" />
                ) : (
                  <FluentScreenbugIcon white className="w-5 h-5 shrink-0 text-white" />
                )}
                <span className="truncate text-[13.5px]">Screenbox</span>
              </div>
            </button>
          </div>

          {/* 9. Camera */}
          <div className="w-full">
            <button
              type="button"
              id={isMobile ? 'mobile-nav-camera' : 'sidebar-nav-camera'}
              data-nav-active={(currentRoute === '/camera' || currentRoute.startsWith('/camera')) ? 'true' : undefined}
              onClick={() => handleNavClick('/camera')}
              aria-label="Camera"
              className={`sidebar-nav-item w-full h-[38px] flex items-center justify-between px-3 cursor-pointer relative text-left rounded-[6px] transition-colors ${
                (currentRoute === '/camera' || currentRoute.startsWith('/camera'))
                  ? 'bg-black/5 dark:bg-white/[0.08] text-black dark:text-white font-medium shadow-xs'
                  : 'text-black dark:text-[#cccccc] hover:bg-black/5 dark:hover:bg-white/[0.05] hover:text-black dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3.5 truncate">
                {useFluent3DForContent ? (
                  <Fluent3DCameraIcon className="w-5 h-5 shrink-0" />
                ) : (
                  <FluentCameraIcon className="w-5 h-5 shrink-0 text-black dark:text-white" />
                )}
                <span className="truncate text-[13.5px]">Camera</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 font-medium">Insider</span>
            </button>
          </div>

          {/* Divider & Category Heading: LAC's project */}
          <div className="my-2 mx-1 h-[1px] bg-black/10 dark:bg-white/10" />
          <div className="px-1.5 pt-0.5 pb-1 shrink-0">
            <h2 className="text-black dark:text-[#a1a1aa] text-[11px] font-semibold tracking-wider uppercase select-none">
              LAC's project
            </h2>
          </div>

          {/* 6. Craftmine */}
          <div className="w-full">
            <button
              type="button"
              id={isMobile ? 'mobile-nav-craftmine' : 'sidebar-nav-craftmine'}
              data-nav-active={currentRoute === '/craftmine' ? 'true' : undefined}
              onClick={() => handleNavClick('/craftmine')}
              aria-label="Craftmine"
              className={`sidebar-nav-item w-full h-[38px] flex items-center gap-3.5 px-3 cursor-pointer relative text-left rounded-[6px] transition-colors ${
                currentRoute === '/craftmine'
                  ? 'bg-black/5 dark:bg-white/[0.08] text-black dark:text-white font-medium shadow-xs'
                  : 'text-black dark:text-[#cccccc] hover:bg-black/5 dark:hover:bg-white/[0.05] hover:text-black dark:hover:text-white'
              }`}
            >
              {useFluent3DForContent ? (
                <Fluent3DCraftmineIcon className="w-5 h-5 shrink-0" />
              ) : (
                <FluentCraftmineIcon className="w-5 h-5 shrink-0 text-black dark:text-white" />
              )}
              <span className="truncate text-[13.5px]">Craftmine</span>
            </button>
          </div>

          {/* Photopea */}
          <div className="w-full">
            <button
              type="button"
              id={isMobile ? 'mobile-nav-photopea' : 'sidebar-nav-photopea'}
              data-nav-active={currentRoute === '/photopea' ? 'true' : undefined}
              onClick={() => handleNavClick('/photopea')}
              aria-label="Photopea"
              className={`sidebar-nav-item w-full h-[38px] flex items-center gap-3.5 px-3 cursor-pointer relative text-left rounded-[6px] transition-colors ${
                currentRoute === '/photopea'
                  ? 'bg-black/5 dark:bg-white/[0.08] text-black dark:text-white font-medium shadow-xs'
                  : 'text-black dark:text-[#cccccc] hover:bg-black/5 dark:hover:bg-white/[0.05] hover:text-black dark:hover:text-white'
              }`}
            >
              {useFluent3DForContent ? (
                <Fluent3DPhotopeaIcon className="w-5 h-5 shrink-0" />
              ) : (
                <FluentPhotopeaIcon className="w-5 h-5 shrink-0 text-black dark:text-white" />
              )}
              <span className="truncate text-[13.5px]">Photopea</span>
            </button>
          </div>

          {/* 7. Discord */}
          <div className="w-full">
            <button
              type="button"
              id={isMobile ? 'mobile-nav-discord' : 'sidebar-nav-discord'}
              onClick={() => {
                if (isMobile) onCloseMobile?.();
                window.open('https://discord.gg/wcdjaDDayK', '_blank', 'noopener,noreferrer');
              }}
              aria-label="Discord"
              className="sidebar-nav-item w-full h-[38px] flex items-center gap-3.5 px-3 text-black dark:text-[#cccccc] hover:bg-black/5 dark:hover:bg-white/[0.05] hover:text-black dark:hover:text-white cursor-pointer text-left rounded-[6px] transition-colors"
            >
              {useFluent3DForContent ? (
                <Fluent3DDiscordIcon className="w-5 h-5 shrink-0" />
              ) : (
                <svg className="w-5 h-5 fill-current shrink-0 text-black dark:text-white" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.078.078 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              )}
              <span className="truncate text-[13.5px]">Discord</span>
            </button>
          </div>
        </div>

        {/* Bottom Section: WinUI 3, Sign In (placed directly above Settings) & Settings */}
        <div 
          key={`sidebar-bottom-expanded-${isSplashFinished ? 'booted' : 'booting'}`}
          className={`px-2.5 py-2 shrink-0 mt-auto space-y-1 relative signin-flyout-container ${
            isSplashFinished ? 'sidebar-bottom-slide-up' : 'opacity-0'
          }`}
        >
          {/* WinUI 3 component library - icon thường */}
          <button
            type="button"
            id={isMobile ? 'mobile-nav-winui-3' : 'sidebar-nav-winui-3'}
            data-nav-active={currentRoute === '/winui-3' ? 'true' : undefined}
            onClick={() => handleNavClick('/winui-3')}
            aria-label="WinUI 3"
            className={`sidebar-nav-item w-full h-[38px] flex items-center gap-3.5 px-3 cursor-pointer relative text-left rounded-[6px] transition-colors ${
              currentRoute === '/winui-3'
                ? 'bg-black/5 dark:bg-white/[0.08] text-black dark:text-white font-medium shadow-xs'
                : 'text-black dark:text-[#cccccc] hover:bg-black/5 dark:hover:bg-white/[0.05] hover:text-black dark:hover:text-white'
            }`}
          >
            <img
              src="https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8e/WinUI.svg/120px-WinUI.svg.png?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=thumbnail&_=20241127184612"
              alt=""
              className="w-5 h-5 shrink-0 object-contain winui-sidebar-icon"
              aria-hidden="true"
            />
            <span className="truncate text-[13.5px]">WinUI 3</span>
          </button>

          {/* Feedback tab placed directly ABOVE Settings tab */}
          <button
            type="button"
            id={isMobile ? 'mobile-nav-feedback' : 'sidebar-nav-feedback'}
            data-nav-active={isCurrentActive('/feedback') ? 'true' : undefined}
            onClick={() => handleNavClick('/feedback')}
            aria-label="Feedback"
            className={`sidebar-nav-item w-full h-[38px] flex items-center gap-3.5 px-3 cursor-pointer relative text-left rounded-[6px] transition-colors ${
              isCurrentActive('/feedback')
                ? 'bg-black/5 dark:bg-white/[0.08] text-black dark:text-white font-medium shadow-xs'
                : 'text-black dark:text-[#cccccc] hover:bg-black/5 dark:hover:bg-white/[0.05] hover:text-black dark:hover:text-white'
            }`}
          >
            {isCurrentActive('/feedback') && (
              <span
                aria-hidden="true"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[16px] bg-[#4cc2ff] rounded-full z-30 pointer-events-none"
              />
            )}
            <FluentPersonFeedbackIcon className="w-5 h-5 shrink-0 text-black dark:text-white" />
            <span className="truncate text-[13.5px]">Feedback</span>
          </button>

          {/* Bottom Settings Tab Item - icon thường khi dynamic */}
          <button
            type="button"
            id={isMobile ? 'mobile-nav-settings' : 'sidebar-nav-settings'}
            data-nav-active={isCurrentActive('/settings') ? 'true' : undefined}
            onClick={() => handleNavClick('/settings')}
            aria-label="Settings"
            className={`sidebar-nav-item w-full h-[38px] flex items-center gap-3.5 px-3 cursor-pointer relative text-left rounded-[6px] transition-colors ${
              isCurrentActive('/settings')
                ? 'bg-black/5 dark:bg-white/[0.08] text-black dark:text-white font-medium shadow-xs'
                : 'text-black dark:text-[#cccccc] hover:bg-black/5 dark:hover:bg-white/[0.05] hover:text-black dark:hover:text-white'
            }`}
          >
            {isCurrentActive('/settings') && (
              <span
                aria-hidden="true"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[16px] bg-[#4cc2ff] rounded-full z-30 pointer-events-none"
              />
            )}
            {useFluent3DForSystem ? (
              <Fluent3DSettingsIcon className="w-5 h-5 shrink-0 settings-spin-icon" />
            ) : (
              <FluentSettingsIcon className="w-5 h-5 shrink-0 settings-spin-icon text-black dark:text-white" />
            )}
            <span className="truncate text-[13.5px]">Settings</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {renderSidebarContextMenu()}
      {/* 1. Desktop Persistent Sidebar */}
      {settings.dockToSidebar && (
        <aside 
          id="waves-desktop-sidebar"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onContextMenu={handleSidebarContextMenu}
          onTouchStart={handleSidebarTouchStart}
          onTouchEnd={clearSidebarHold}
          onTouchMove={clearSidebarHold}
          onTouchCancel={clearSidebarHold}
          className={`hidden md:flex flex-col h-screen bg-[#f3f3f3] dark:bg-[#1b1f24] text-[#111827] dark:text-white select-none shrink-0 fixed top-0 overflow-visible border-r border-[#e5e5e5] dark:border-[#2e2e2e] ${
            settings.sidebarPosition === 'right' ? 'right-0 border-l' : 'left-0 border-r'
          } ${
            shouldAnimateSidebar ? 'transition-[width,box-shadow] duration-[160ms] ease-[cubic-bezier(0.34,1.45,0.64,1)]' : 'transition-none'
          } ${
            effectiveCollapsed ? 'w-[48px]' : 'w-[260px]'
          } ${
            isHoverToExpandActive && isExpandedOnHover
              ? settings.sidebarPosition === 'right'
                ? '!z-50 shadow-[-8px_0_32px_rgba(0,0,0,0.18)] dark:shadow-[-8px_0_32px_rgba(0,0,0,0.6)]'
                : '!z-50 shadow-[8px_0_32px_rgba(0,0,0,0.18)] dark:shadow-[8px_0_32px_rgba(0,0,0,0.6)]'
              : '!z-[200] shadow-none'
          }`}
          style={{
            backgroundColor: settings.theme === 'light' ? '#f3f3f3' : '#1b1f24',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
          }}
        >
          {!effectiveCollapsed ? (
            renderSidebarBody(false)
          ) : (
            /* Collapsed Windows 10 Sidebar Icon Bar */
            <div 
              key="sidebar-nav-collapsed"
              onContextMenu={handleSidebarContextMenu}
              onTouchStart={handleSidebarTouchStart}
              onTouchEnd={clearSidebarHold}
              onTouchMove={clearSidebarHold}
              onTouchCancel={clearSidebarHold}
              className="sidebar-items-slide-up flex flex-col h-full select-none items-center py-2 relative w-full"
            >
              {/* Top controls: Back & Hamburger toggle (shrink-0) */}
              <div className="flex flex-col items-center gap-1 shrink-0 pb-1.5 w-full">
                {/* Back Button with Left Arrow */}
                <button 
                  id="btn-sidebar-collapsed-back"
                  type="button"
                  onClick={handleGoBack} 
                  onMouseEnter={(e) => showTooltip('Go back', e)}
                  onMouseLeave={hideTooltip}
                  className="w-9 h-9 rounded-[6px] shrink-0 flex items-center justify-center text-black dark:text-white/90 hover:bg-black/5 dark:hover:bg-white/10 hover:text-black dark:hover:text-white cursor-pointer transition-colors"
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-5 h-5 stroke-[1.75] text-black dark:text-white" />
                </button>

                {/* Hamburger Button to Expand */}
                <button 
                  id="btn-sidebar-expand-toggle"
                  type="button"
                  onClick={onToggleCollapse} 
                  onMouseEnter={(e) => showTooltip('Collapse or expand', e)}
                  onMouseLeave={hideTooltip}
                  className="w-9 h-9 rounded-[6px] shrink-0 flex items-center justify-center text-black dark:text-white/90 hover:bg-black/5 dark:hover:bg-white/10 hover:text-black dark:hover:text-white cursor-pointer transition-colors"
                  aria-label="Collapse or expand"
                >
                  <Menu className="w-5 h-5 stroke-[1.75] text-black dark:text-white" />
                </button>
              </div>

              {/* Scrollable Navigation List (spaced out like expanded, never squeezed, can scroll down) */}
              <div 
                ref={collapsedNavRef}
                key={`sidebar-nav-collapsed-${isSplashFinished ? 'booted' : 'booting'}`}
                className={`flex-1 w-full overflow-y-auto no-scrollbar py-1 space-y-1 flex flex-col items-center relative ${
                  isSplashFinished ? 'sidebar-items-slide-up' : 'opacity-0'
                }`}
              >
                <MorphingVerticalIndicator
                  containerRef={collapsedNavRef}
                  currentRoute={currentRoute}
                  dependencyKey={`${navItems.length}-${currentRoute}`}
                />

                {/* 1. Home Icon */}
                <button
                  type="button"
                  id="sidebar-collapsed-home"
                  data-nav-active={(currentRoute === '/' || currentRoute === '/home' || currentRoute === '/home-preview') ? 'true' : undefined}
                  onClick={() => handleNavClick('/')}
                  onMouseEnter={(e) => showTooltip('Home', e)}
                  onMouseLeave={hideTooltip}
                  aria-label="Home"
                  className={`sidebar-nav-item w-10 h-[38px] rounded-[6px] shrink-0 flex items-center justify-center relative transition-colors cursor-pointer ${
                    (currentRoute === '/' || currentRoute === '/home' || currentRoute === '/home-preview')
                      ? 'bg-black/5 dark:bg-white/[0.08] text-black dark:text-white shadow-xs'
                      : 'text-black dark:text-[#cccccc] hover:bg-black/5 dark:hover:bg-white/[0.05] hover:text-black dark:hover:text-white'
                  }`}
                >
                  {useFluent3DForContent ? (
                    <Fluent3DHomeIcon className="w-5 h-5 shrink-0" />
                  ) : (
                    <FluentHomeIcon className="w-5 h-5 text-black dark:text-white" />
                  )}
                </button>

                {/* 2. Feed Icon */}
                <button
                  type="button"
                  id="sidebar-collapsed-articles"
                  data-nav-active={(currentRoute === '/news' || currentRoute.startsWith('/article') || currentRoute.startsWith('/news/') || currentRoute === '/updates' || currentRoute.startsWith('/updates')) ? 'true' : undefined}
                  onClick={() => handleNavClick('/news')}
                  onMouseEnter={(e) => showTooltip('Feed', e)}
                  onMouseLeave={hideTooltip}
                  aria-label="Feed"
                  className={`sidebar-nav-item w-10 h-[38px] rounded-[6px] shrink-0 flex items-center justify-center relative transition-colors cursor-pointer ${
                    (currentRoute === '/news' || currentRoute.startsWith('/article') || currentRoute.startsWith('/news/') || currentRoute === '/updates' || currentRoute.startsWith('/updates'))
                      ? 'bg-black/5 dark:bg-white/[0.08] text-black dark:text-white shadow-xs'
                      : 'text-black dark:text-[#cccccc] hover:bg-black/5 dark:hover:bg-white/[0.05] hover:text-black dark:hover:text-white'
                  }`}
                >
                  {useFluent3DForContent ? (
                    <Fluent3DArticlesIcon className="w-5 h-5 shrink-0" />
                  ) : (
                    <FluentArticlesIcon className="w-5 h-5 text-black dark:text-white" />
                  )}
                </button>

                {/* Divider: Apps */}
                <div className="w-6 h-[1px] bg-black/10 dark:bg-white/10 my-2 shrink-0" />

                {/* 3. Watch Icon */}
                <button
                  type="button"
                  id="sidebar-collapsed-watch"
                  data-nav-active={(currentRoute === '/live-tv' || currentRoute.startsWith('/live-tv')) ? 'true' : undefined}
                  onClick={() => handleNavClick('/live-tv')}
                  onMouseEnter={(e) => showTooltip('Watch', e)}
                  onMouseLeave={hideTooltip}
                  aria-label="Watch"
                  className={`sidebar-nav-item w-10 h-[38px] rounded-[6px] shrink-0 flex items-center justify-center relative transition-colors cursor-pointer ${
                    (currentRoute === '/live-tv' || currentRoute.startsWith('/live-tv'))
                      ? 'bg-black/5 dark:bg-white/[0.08] text-black dark:text-white shadow-xs'
                      : 'text-black dark:text-[#cccccc] hover:bg-black/5 dark:hover:bg-white/[0.05] hover:text-black dark:hover:text-white'
                  }`}
                >
                  {useFluent3DForContent ? (
                    <Fluent3DWatchPreviewIcon className="w-5 h-5 shrink-0" />
                  ) : (
                    <FluentWatchIcon className="w-5 h-5 text-black dark:text-white" />
                  )}
                </button>

                {/* 4. Gallery Icon */}
                <button
                  type="button"
                  id="sidebar-collapsed-gallery"
                  data-nav-active={(currentRoute === '/gallery' || currentRoute.startsWith('/gallery')) ? 'true' : undefined}
                  onClick={() => handleNavClick('/gallery')}
                  onMouseEnter={(e) => showTooltip('Gallery', e)}
                  onMouseLeave={hideTooltip}
                  aria-label="Gallery"
                  className={`sidebar-nav-item w-10 h-[38px] rounded-[6px] shrink-0 flex items-center justify-center relative transition-colors cursor-pointer ${
                    (currentRoute === '/gallery' || currentRoute.startsWith('/gallery'))
                      ? 'bg-black/5 dark:bg-white/[0.08] text-black dark:text-white shadow-xs'
                      : 'text-black dark:text-[#cccccc] hover:bg-black/5 dark:hover:bg-white/[0.05] hover:text-black dark:hover:text-white'
                  }`}
                >
                  {useFluent3DForContent ? (
                    <Fluent3DGalleryIcon className="w-5 h-5 shrink-0" />
                  ) : (
                    <FluentGalleryIcon className="w-5 h-5 text-black dark:text-white" />
                  )}
                </button>

                {/* 5. Ink Canvas Icon */}
                <button
                  type="button"
                  id="sidebar-collapsed-draws"
                  data-nav-active={(currentRoute === '/draws' || currentRoute.startsWith('/draws')) ? 'true' : undefined}
                  onClick={() => handleNavClick('/draws')}
                  onMouseEnter={(e) => showTooltip('Ink Canvas', e)}
                  onMouseLeave={hideTooltip}
                  aria-label="Ink Canvas"
                  className={`sidebar-nav-item w-10 h-[38px] rounded-[6px] shrink-0 flex items-center justify-center relative transition-colors cursor-pointer ${
                    (currentRoute === '/draws' || currentRoute.startsWith('/draws'))
                      ? 'bg-black/5 dark:bg-white/[0.08] text-black dark:text-white shadow-xs'
                      : 'text-black dark:text-[#cccccc] hover:bg-black/5 dark:hover:bg-white/[0.05] hover:text-black dark:hover:text-white'
                  }`}
                >
                  {useFluent3DForContent ? (
                    <FluentInkCanvasIcon className="fluent-3d-icon w-5 h-5 shrink-0" />
                  ) : (
                    <FluentInkCanvasIcon className="w-5 h-5 text-black dark:text-white" />
                  )}
                </button>

                {/* 6. Notes Icon */}
                <button
                  type="button"
                  id="sidebar-collapsed-notes"
                  data-nav-active={(currentRoute === '/notes' || currentRoute === '/write' || currentRoute === '/present' || currentRoute === '/table') ? 'true' : undefined}
                  onClick={() => handleNavClick('/notes')}
                  onMouseEnter={(e) => showTooltip('Notes', e)}
                  onMouseLeave={hideTooltip}
                  aria-label="Notes"
                  className={`sidebar-nav-item w-10 h-[38px] rounded-[6px] shrink-0 flex items-center justify-center relative transition-colors cursor-pointer ${
                    (currentRoute === '/notes' || currentRoute === '/write' || currentRoute === '/present' || currentRoute === '/table')
                      ? 'bg-black/5 dark:bg-white/[0.08] text-black dark:text-white shadow-xs'
                      : 'text-black dark:text-[#cccccc] hover:bg-black/5 dark:hover:bg-white/[0.05] hover:text-black dark:hover:text-white'
                  }`}
                >
                  {useFluent3DForContent ? (
                    <Fluent3DNotesIcon className="w-5 h-5 shrink-0" />
                  ) : (
                    <FluentNotesIcon className="w-5 h-5 text-black dark:text-white" />
                  )}
                </button>

                {/* 7. Screenbox Icon */}
                <button
                  type="button"
                  id="sidebar-collapsed-screenbox"
                  data-nav-active={(currentRoute === '/vlc' || currentRoute.startsWith('/vlc') || currentRoute === '/screenbox' || currentRoute.startsWith('/screenbox') || currentRoute === '/screenbug' || currentRoute.startsWith('/screenbug')) ? 'true' : undefined}
                  onClick={() => handleNavClick('/screenbox')}
                  onMouseEnter={(e) => showTooltip('Screenbox', e)}
                  onMouseLeave={hideTooltip}
                  aria-label="Screenbox"
                  className={`sidebar-nav-item w-10 h-[38px] rounded-[6px] shrink-0 flex items-center justify-center relative transition-colors cursor-pointer ${
                    (currentRoute === '/vlc' || currentRoute.startsWith('/vlc') || currentRoute === '/screenbox' || currentRoute.startsWith('/screenbox') || currentRoute === '/screenbug' || currentRoute.startsWith('/screenbug'))
                      ? 'bg-black/5 dark:bg-white/[0.08] text-black dark:text-white shadow-xs'
                      : 'text-black dark:text-[#cccccc] hover:bg-black/5 dark:hover:bg-white/[0.05] hover:text-black dark:hover:text-white'
                  }`}
                >
                  {useFluent3DForContent ? (
                    <Fluent3DScreenbugIcon className="w-5 h-5 shrink-0" />
                  ) : (
                    <FluentScreenbugIcon white className="w-5 h-5 text-white" />
                  )}
                </button>

                {/* 8. Camera Icon */}
                <button
                  type="button"
                  id="sidebar-collapsed-camera"
                  data-nav-active={(currentRoute === '/camera' || currentRoute.startsWith('/camera')) ? 'true' : undefined}
                  onClick={() => handleNavClick('/camera')}
                  onMouseEnter={(e) => showTooltip('Camera', e)}
                  onMouseLeave={hideTooltip}
                  aria-label="Camera"
                  className={`sidebar-nav-item w-10 h-[38px] rounded-[6px] shrink-0 flex items-center justify-center relative transition-colors cursor-pointer ${
                    (currentRoute === '/camera' || currentRoute.startsWith('/camera'))
                      ? 'bg-black/5 dark:bg-white/[0.08] text-black dark:text-white shadow-xs'
                      : 'text-black dark:text-[#cccccc] hover:bg-black/5 dark:hover:bg-white/[0.05] hover:text-black dark:hover:text-white'
                  }`}
                >
                  {useFluent3DForContent ? (
                    <Fluent3DCameraIcon className="w-5 h-5 shrink-0" />
                  ) : (
                    <FluentCameraIcon className="w-5 h-5 text-black dark:text-white" />
                  )}
                </button>

                {/* Divider: LAC's project */}
                <div className="w-6 h-[1px] bg-black/10 dark:bg-white/10 my-2 shrink-0" />

                {/* 8. Craftmine Icon */}
                <button
                  type="button"
                  id="sidebar-collapsed-craftmine"
                  data-nav-active={currentRoute === '/craftmine' ? 'true' : undefined}
                  onClick={() => handleNavClick('/craftmine')}
                  onMouseEnter={(e) => showTooltip('Craftmine', e)}
                  onMouseLeave={hideTooltip}
                  aria-label="Craftmine"
                  className={`sidebar-nav-item w-10 h-[38px] rounded-[6px] shrink-0 flex items-center justify-center relative transition-colors cursor-pointer ${
                    currentRoute === '/craftmine'
                      ? 'bg-black/5 dark:bg-white/[0.08] text-black dark:text-white shadow-xs'
                      : 'text-black dark:text-[#cccccc] hover:bg-black/5 dark:hover:bg-white/[0.05] hover:text-black dark:hover:text-white'
                  }`}
                >
                  {useFluent3DForContent ? (
                    <Fluent3DCraftmineIcon className="w-5 h-5 shrink-0" />
                  ) : (
                    <FluentCraftmineIcon className="w-5 h-5 text-black dark:text-white" />
                  )}
                </button>

                {/* 9. Photopea Icon */}
                <button
                  type="button"
                  id="sidebar-collapsed-photopea"
                  data-nav-active={currentRoute === '/photopea' ? 'true' : undefined}
                  onClick={() => handleNavClick('/photopea')}
                  onMouseEnter={(e) => showTooltip('Photopea', e)}
                  onMouseLeave={hideTooltip}
                  aria-label="Photopea"
                  className={`sidebar-nav-item w-10 h-[38px] rounded-[6px] shrink-0 flex items-center justify-center relative transition-colors cursor-pointer ${
                    currentRoute === '/photopea'
                      ? 'bg-black/5 dark:bg-white/[0.08] text-black dark:text-white shadow-xs'
                      : 'text-black dark:text-[#cccccc] hover:bg-black/5 dark:hover:bg-white/[0.05] hover:text-black dark:hover:text-white'
                  }`}
                >
                  {useFluent3DForContent ? (
                    <Fluent3DPhotopeaIcon className="w-5 h-5 shrink-0" />
                  ) : (
                    <FluentPhotopeaIcon className="w-5 h-5 text-black dark:text-white" />
                  )}
                </button>

                {/* 10. Discord Icon */}
                <button
                  type="button"
                  id="sidebar-collapsed-discord"
                  onClick={() => window.open('https://discord.gg/wcdjaDDayK', '_blank', 'noopener,noreferrer')}
                  onMouseEnter={(e) => showTooltip('Discord', e)}
                  onMouseLeave={hideTooltip}
                  aria-label="Discord"
                  className="sidebar-nav-item w-10 h-[38px] rounded-[6px] shrink-0 flex items-center justify-center relative transition-colors cursor-pointer text-black dark:text-[#cccccc] hover:bg-black/5 dark:hover:bg-white/[0.05] hover:text-black dark:hover:text-white"
                >
                  {useFluent3DForContent ? (
                    <Fluent3DDiscordIcon className="w-5 h-5 shrink-0" />
                  ) : (
                    <svg className="w-5 h-5 fill-current text-black dark:text-white" viewBox="0 0 24 24">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.078.078 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                  )}
                </button>
              </div>

              {/* Bottom WinUI 3, Sign In & Settings Icons */}
              <div 
                key={`sidebar-collapsed-bottom-${isSplashFinished ? 'booted' : 'booting'}`}
                className={`shrink-0 w-full mt-auto pt-2 pb-1 space-y-1 flex flex-col items-center relative signin-flyout-container border-t border-black/5 dark:border-white/5 ${
                  isSplashFinished ? 'sidebar-bottom-slide-up' : 'opacity-0'
                }`}
              >
                {/* WinUI 3 Collapsed Button (icon thường) */}
                <button
                  type="button"
                  id="sidebar-collapsed-winui-3"
                  onClick={() => handleNavClick('/winui-3')}
                  onMouseEnter={(e) => showTooltip('WinUI 3', e)}
                  onMouseLeave={hideTooltip}
                  aria-label="WinUI 3"
                  className={`sidebar-nav-item w-10 h-[38px] rounded-[6px] shrink-0 flex items-center justify-center relative transition-colors cursor-pointer ${
                    currentRoute === '/winui-3'
                      ? 'bg-black/10 dark:bg-white/[0.12] text-[#111827] dark:text-white shadow-xs'
                      : 'text-[#4b5563] dark:text-[#cccccc] hover:bg-black/5 dark:hover:bg-white/[0.05] hover:text-[#111827] dark:hover:text-white'
                  }`}
                >
                  <img
                    src="https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8e/WinUI.svg/120px-WinUI.svg.png?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=thumbnail&_=20241127184612"
                    alt="WinUI 3"
                    className="w-5 h-5 shrink-0 object-contain winui-sidebar-icon"
                  />
                </button>

                {/* Feedback Collapsed Button placed directly above Settings */}
                <button
                  type="button"
                  id="sidebar-collapsed-feedback"
                  data-nav-active={isCurrentActive('/feedback') ? 'true' : undefined}
                  onClick={() => handleNavClick('/feedback')}
                  onMouseEnter={(e) => showTooltip('Feedback', e)}
                  onMouseLeave={hideTooltip}
                  aria-label="Feedback"
                  className={`sidebar-nav-item w-10 h-[38px] rounded-[6px] shrink-0 flex items-center justify-center relative transition-colors cursor-pointer ${
                    isCurrentActive('/feedback')
                      ? 'bg-black/10 dark:bg-white/[0.12] text-[#111827] dark:text-white shadow-xs'
                      : 'text-[#4b5563] dark:text-[#cccccc] hover:bg-black/5 dark:hover:bg-white/[0.05] hover:text-[#111827] dark:hover:text-white'
                  }`}
                >
                  {isCurrentActive('/feedback') && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[16px] bg-[#4cc2ff] rounded-full z-30 pointer-events-none"
                    />
                  )}
                  <FluentPersonFeedbackIcon className="w-5 h-5 text-[#111827] dark:text-white shrink-0" />
                </button>

                {/* Bottom Settings Icon */}
                <button
                  type="button"
                  id="sidebar-collapsed-settings"
                  data-nav-active={isCurrentActive('/settings') ? 'true' : undefined}
                  onClick={() => handleNavClick('/settings')}
                  onMouseEnter={(e) => showTooltip('Settings', e)}
                  onMouseLeave={hideTooltip}
                  aria-label="Settings"
                  className={`sidebar-nav-item w-10 h-[38px] rounded-[6px] shrink-0 flex items-center justify-center relative transition-colors cursor-pointer ${
                    isCurrentActive('/settings')
                      ? 'bg-black/5 dark:bg-white/[0.08] text-[#111827] dark:text-white shadow-xs'
                      : 'text-[#4b5563] dark:text-[#cccccc] hover:bg-black/5 dark:hover:bg-white/[0.05] hover:text-[#111827] dark:hover:text-white'
                  }`}
                >
                  {isCurrentActive('/settings') && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[16px] bg-[#4cc2ff] rounded-full z-30 pointer-events-none"
                    />
                  )}
                  {useFluent3DForSystem ? (
                    <Fluent3DSettingsIcon className="w-5 h-5 shrink-0 settings-spin-icon" />
                  ) : (
                    <FluentSettingsIcon className="w-5 h-5 settings-spin-icon text-[#111827] dark:text-white" />
                  )}
                </button>
              </div>
            </div>
          )}
        </aside>
      )}

      {/* 2. Mobile Drawer Navigation with Smooth Animation & Follow Finger */}
      <AnimatePresence>
        {(isMobileOpen || (mobileDragOffset !== null && mobileDragOffset > 0)) && (() => {
          const drawerWidth = typeof window !== 'undefined' ? Math.min(285, window.innerWidth * 0.85) : 285;
          const isDragging = (mobileDragOffset !== null && mobileDragOffset > 0) || (closeDragOffset !== null && closeDragOffset < 0);
          
          let currentTranslateX = 0;
          if (mobileDragOffset !== null && mobileDragOffset > 0) {
            currentTranslateX = Math.min(0, -drawerWidth + mobileDragOffset);
          } else if (closeDragOffset !== null && closeDragOffset < 0) {
            currentTranslateX = Math.max(-drawerWidth, closeDragOffset);
          }

          let backdropOpacity = 1;
          if (mobileDragOffset !== null && mobileDragOffset > 0) {
            backdropOpacity = Math.min(1, Math.max(0, mobileDragOffset / drawerWidth));
          } else if (closeDragOffset !== null && closeDragOffset < 0) {
            backdropOpacity = Math.max(0, 1 + closeDragOffset / drawerWidth);
          }

          return (
            <div 
              className="fixed inset-0 z-50 md:hidden flex"
              role="dialog"
              aria-modal="true"
            >
              {/* Backdrop with smooth fade or follow finger */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: backdropOpacity }}
                exit={{ opacity: 0 }}
                transition={isDragging ? { duration: 0 } : { duration: 0.22, ease: 'easeOut' }}
                onClick={onCloseMobile}
                className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
                aria-hidden="true"
              />

              {/* Slide-out Sidebar Drawer with smooth spring transition or follow finger */}
              <motion.div 
                id="waves-mobile-sidebar"
                initial={{ x: '-100%', opacity: 0.8 }}
                animate={{ x: currentTranslateX, opacity: 1 }}
                exit={{ x: '-100%', opacity: 0.8 }}
                transition={
                  isDragging
                    ? { duration: 0 }
                    : { 
                        type: 'spring', 
                        damping: 18, 
                        stiffness: 450, 
                        mass: 0.6 
                      }
                }
                onTouchStart={handleDrawerTouchStart}
                onTouchMove={handleDrawerTouchMove}
                onTouchEnd={handleDrawerTouchEnd}
                className="relative w-[285px] max-w-[85vw] h-full bg-[#f3f3f3]/90 dark:bg-[#1b1f24]/90 text-[#111827] dark:text-white shadow-none flex flex-col z-10 border-r border-[#e5e5e5] dark:border-[#333333] backdrop-blur-2xl"
                style={{
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  boxShadow: 'none',
                }}
              >
                {renderSidebarBody(true)}
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Discord Welcome Modal */}
      <DiscordWelcomeModal
        isOpen={isDiscordModalOpen}
        onClose={() => setIsDiscordModalOpen(false)}
      />

      {/* Under Construction Modal for Sign In attempts */}
      <UnderConstructionModal
        isOpen={isSignInUnderConstructionOpen}
        onClose={() => setIsSignInUnderConstructionOpen(false)}
        aria-label="Under construction"
        description="This feature is working in progress and might be available in future builds."
        buttonText="Understood"
      />

      {/* Toast Feedback for Sign In Actions */}
      <AnimatePresence>
        {signInToast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-5 left-1/2 -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0 z-[1000] px-4 py-2.5 rounded-[6px] bg-[#2d2d2d] border border-[#3e3e3e] shadow-2xl text-xs sm:text-sm text-white flex items-center gap-2.5 pointer-events-none"
          >
            <div className="w-2 h-2 rounded-full bg-[#4cc2ff] shrink-0" />
            <span>{signInToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Tooltip for Sidebar Items (works in both collapsed & expanded states) */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {collapsedTooltip && (
            <motion.div
              key="sidebar-collapsed-tooltip"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                top: `${collapsedTooltip.top}px`,
                left: `${collapsedTooltip.left}px`,
                transform: settings.sidebarPosition === 'right' ? 'translate(-100%, -50%)' : 'translateY(-50%)',
                backgroundColor: settings.theme === 'light' ? 'rgba(255, 255, 255, 0.50)' : 'rgba(24, 24, 28, 0.50)',
                backdropFilter: 'blur(16px) saturate(140%)',
                WebkitBackdropFilter: 'blur(16px) saturate(140%)',
              }}
              className="z-[99999] px-3 py-1.5 min-h-[30px] flex items-center rounded-[6px] text-[#111827] dark:text-white text-xs font-medium shadow-[0_4px_20px_rgba(0,0,0,0.18)] border-0 outline-none pointer-events-none whitespace-nowrap select-none"
            >
              {collapsedTooltip.label}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};
