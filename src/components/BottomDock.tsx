import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  Settings as SettingsIcon,
  LayoutGrid
} from 'lucide-react';
import { 
  FluentHomeIcon, 
  FluentLiveTvIcon, 
  FluentNewsIcon, 
  FluentSearchIcon, 
  FluentSettingsIcon,
  FLUENT_ICON_URLS 
} from './FluentIcons';
import { useSettings } from '../hooks/useSettings';
import { useNativeKeyboard } from '../context/NativeKeyboardContext';
import { ToolsMenu } from './ToolsMenu';
import { Channel, NewsArticle } from '../types';

interface BottomDockProps {
  currentRoute: string;
  navigate: (route: string) => void;
  onOpenSearch?: () => void;
  onOpenHelp?: () => void;
  onOpenDiscord?: () => void;
  onOpenSummarize?: (article: NewsArticle) => void;
  onOpenTextToSpeech?: (article: NewsArticle) => void;
  onOpenFindWords?: () => void;
  onOpenAddStream?: () => void;
  onImportChannels?: (channels: Channel[]) => void;
  currentChannel?: Channel;
  channels?: Channel[];
  fontSize?: number;
  onChangeFontSize?: (size: number) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onOpenSpotlight?: () => void;
  onOpenOfficeTool?: (tool: 'write' | 'table' | 'present') => void;
}

const SETTINGS_ICON = 'https://static.wikia.nocookie.net/ftv/images/9/97/Settungs.png/revision/latest?cb=20260411085024&path-prefix=vi';
const MORE_ICON = 'https://static.wikia.nocookie.net/ep-deo/images/7/78/Icons8-apps-90.png/revision/latest?cb=20260925115254';

interface TabItem {
  id: string;
  label: string;
  route?: string;
  isAction?: boolean;
  image?: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

const DOCK_TABS: TabItem[] = [
  { id: 'dock-home', label: 'Home', route: '/', image: FLUENT_ICON_URLS.home, icon: FluentHomeIcon },
  { id: 'dock-tv', label: 'Watch', route: '/live-tv', image: '/icons/sidebar/watch-preview.png', icon: FluentLiveTvIcon },
  { id: 'dock-news', label: 'Feed', route: '/news', image: FLUENT_ICON_URLS.news, icon: FluentNewsIcon },
  { id: 'dock-settings', label: 'Settings', route: '/settings', image: FLUENT_ICON_URLS.settings, icon: FluentSettingsIcon },
  { id: 'dock-search', label: 'Search', isAction: true, image: FLUENT_ICON_URLS.search, icon: FluentSearchIcon },
  { id: 'dock-more', label: 'More', isAction: true, image: MORE_ICON, icon: LayoutGrid },
];

const SQUISHY_SPRING = {
  type: 'spring' as const,
  stiffness: 170,
  damping: 18,
  mass: 0.9,
};

export const BottomDock: React.FC<BottomDockProps> = ({ 
  currentRoute, 
  navigate, 
  onOpenSearch,
  onOpenHelp,
  onOpenDiscord,
  onOpenSummarize,
  onOpenTextToSpeech,
  onOpenFindWords,
  onOpenAddStream,
  onImportChannels,
  currentChannel,
  channels,
  fontSize,
  onChangeFontSize,
  searchQuery = '',
  onSearchChange,
  onOpenSpotlight,
  onOpenOfficeTool
}) => {
  const { settings, draftSettings } = useSettings();
  const currentOpacity = typeof draftSettings?.spatialGlassOpacity === 'number'
    ? draftSettings.spatialGlassOpacity
    : (settings.spatialGlassOpacity ?? 20);
  const currentBlur = typeof draftSettings?.spatialGlassBlur === 'number'
    ? draftSettings.spatialGlassBlur
    : (settings.spatialGlassBlur ?? 10);
  const blurPx = Math.round((currentBlur / 100) * 40);
  const isSpatialGlassActive = (draftSettings?.spatialGlass ?? settings.spatialGlass) !== false;
  // When spatial glass opacity < 40%, user wants text & icons in tab bar / float search to be monochrome white
  const isLightMode = settings.theme === 'light';
  const isDarkContent = isSpatialGlassActive && currentOpacity > 40;
  const isUnder40 = isSpatialGlassActive && currentOpacity < 40;
  // In light mode, inactive content is always black. In dark mode, it's white.
  const useDarkContent = isLightMode;

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [gesturingTabId, setGesturingTabId] = useState<string | null>(null);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const toolsFlyoutRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const isGesturingRef = useRef(false);

  const { isOpen: isKeyboardOpen, keyboardHeight } = useNativeKeyboard();

  // Listen for global open event (Cmd+K / Alt+2 shortcuts)
  useEffect(() => {
    const handleGlobalOpen = () => {
      if (onOpenSpotlight) onOpenSpotlight();
      else if (onOpenSearch) onOpenSearch();
    };
    window.addEventListener('vplay:open-floaty-search', handleGlobalOpen);
    return () => window.removeEventListener('vplay:open-floaty-search', handleGlobalOpen);
  }, [onOpenSpotlight, onOpenSearch]);

  // Close tools when route changes
  useEffect(() => {
    setIsToolsOpen(false);
  }, [currentRoute]);

  // Click outside / Esc to close tools flyout
  useEffect(() => {
    if (!isToolsOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const moreBtn = tabRefs.current['dock-more'];
      const flyout = toolsFlyoutRef.current;
      if (
        (flyout && flyout.contains(target)) ||
        (moreBtn && moreBtn.contains(target)) ||
        target.closest('#vplay-tools-dropdown-card') ||
        target.closest('#dock-more')
      ) {
        return;
      }
      setIsToolsOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsToolsOpen(false);
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isToolsOpen]);

  const isActive = (route?: string) => {
    if (!route) return false;
    if (route === '/') {
      return currentRoute === '/' || currentRoute === '/home';
    }
    if (route === '/live-tv') {
      return currentRoute === '/live-tv' || currentRoute === '/channels' || currentRoute === '/test';
    }
    return currentRoute.startsWith(route);
  };

  const activeRouteTab = DOCK_TABS.find((t) => t.route && isActive(t.route)) || DOCK_TABS[0];
  const currentActiveId = gesturingTabId || (isToolsOpen ? 'dock-more' : activeRouteTab.id);

  // Real-time gesture tracking: finger sliding horizontally across floaty bar updates active tab indicator
  const getTabFromTouch = (touch: React.Touch | Touch): string | null => {
    const clientX = touch.clientX;
    const clientY = touch.clientY;

    let closestTabId: string | null = null;
    let minDistance = Infinity;

    for (const tab of DOCK_TABS) {
      const el = tabRefs.current[tab.id];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      // Allow vertical leeway (+-60px) so horizontal finger gestures remain tracked smoothly
      if (clientY >= rect.top - 60 && clientY <= rect.bottom + 60) {
        if (clientX >= rect.left && clientX <= rect.right) {
          return tab.id;
        }
        const centerX = rect.left + rect.width / 2;
        const dist = Math.abs(clientX - centerX);
        if (dist < minDistance) {
          minDistance = dist;
          closestTabId = tab.id;
        }
      }
    }

    return closestTabId;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isGesturingRef.current = true;
      const tabId = getTabFromTouch(e.touches[0]);
      if (tabId) {
        setGesturingTabId(tabId);
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isGesturingRef.current || e.touches.length !== 1) return;
    const tabId = getTabFromTouch(e.touches[0]);
    if (tabId && tabId !== gesturingTabId) {
      setGesturingTabId(tabId);
    }
  };

  const handleTabClick = (item: TabItem) => {
    if (item.id === 'dock-more') {
      setIsToolsOpen((prev) => !prev);
      return;
    }
    if (item.id === 'dock-search' || item.id === 'dock-spotlight-btn') {
      setIsToolsOpen(false);
      if (onOpenSpotlight) {
        onOpenSpotlight();
      } else if (onOpenSearch) {
        onOpenSearch();
      }
      return;
    }
    setIsToolsOpen(false);
    if (item.route) {
      navigate(item.route);
    }
  };

  const handleTouchEnd = () => {
    if (isGesturingRef.current) {
      isGesturingRef.current = false;
      if (gesturingTabId) {
        const targetTab = DOCK_TABS.find((t) => t.id === gesturingTabId);
        if (targetTab) {
          handleTabClick(targetTab);
        }
      }
      setGesturingTabId(null);
    }
  };

  const handleTouchCancel = () => {
    isGesturingRef.current = false;
    setGesturingTabId(null);
  };

  const renderTabIcon = (item: TabItem, active: boolean, isSelectedOrHovered: boolean) => {
    const Icon = item.icon;
    const hasImage = !!item.image && !imageErrors[item.id];
    const isWatchTab = item.id === 'dock-tv';
    const isSearchTab = item.id === 'dock-search' || item.id === 'dock-spotlight-btn';
    const iconSizeClasses = isWatchTab
      ? 'w-[24px] h-[24px] sm:w-[26.5px] sm:h-[26.5px]'
      : isSearchTab
        ? 'w-[24px] h-[24px] sm:w-[26.5px] sm:h-[26.5px]'
        : 'w-[28px] h-[28px] sm:w-[31px] sm:h-[31px]';

    const spinClass = item.id === 'dock-settings' ? 'settings-spin-icon' : '';

    if (active) {
      const activeColor = '#FFFFFF';
      if (hasImage) {
        return (
          <div
            className={`${iconSizeClasses} ${spinClass} shrink-0 transition-transform duration-200`}
            style={{
              maskImage: `url(${item.image})`,
              WebkitMaskImage: `url(${item.image})`,
              maskSize: 'contain',
              WebkitMaskSize: 'contain',
              maskRepeat: 'no-repeat',
              WebkitMaskRepeat: 'no-repeat',
              maskPosition: 'center',
              WebkitMaskPosition: 'center',
              backgroundColor: activeColor,
            }}
          />
        );
      }
      return (
        <Icon
          className={`${iconSizeClasses} ${spinClass} shrink-0 text-white fill-white stroke-white transition-all duration-200`}
        />
      );
    }

    // Inactive tab icon:
    // In light mode, inactive icons must be black. In dark mode, white.
    const isBlackIcon = isLightMode;

    if (hasImage) {
      return (
        <img
          src={item.image}
          alt={item.label}
          referrerPolicy="no-referrer"
          onError={() => setImageErrors((prev) => ({ ...prev, [item.id]: true }))}
          className={`${iconSizeClasses} ${spinClass} object-contain shrink-0 transition-all duration-150 ${
            isBlackIcon
              ? 'brightness-0'
              : 'filter brightness-0 invert'
          } ${isSelectedOrHovered ? 'opacity-100' : 'opacity-75'}`}
        />
      );
    }

    return (
      <Icon
        className={`${iconSizeClasses} ${spinClass} shrink-0 transition-all duration-150 ${
          isBlackIcon
            ? 'text-black fill-black stroke-black'
            : 'text-white fill-white stroke-white'
        } ${isSelectedOrHovered ? 'opacity-100' : 'opacity-75'}`}
      />
    );
  };

  return (
    <>
      {/* Bottom Dock Container with Fluent Bar */}
      <div
        id="bottom-dock-container"
        style={{
          bottom: isKeyboardOpen ? `${keyboardHeight + 12}px` : undefined,
          transition: 'bottom 0.42s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
        className={`fixed ${isKeyboardOpen ? '' : 'bottom-5'} left-1/2 -translate-x-1/2 z-40 select-none flex items-center justify-center pointer-events-auto`}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key="dock-tab-view"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ 
                opacity: 0, 
                scale: 0.94,
                transition: { duration: 0.18, ease: 'easeOut' }
              }}
              transition={SQUISHY_SPRING}
              className="relative flex items-center justify-center pointer-events-auto"
            >
              <motion.nav
                id="floaty-bar-surface"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchCancel}
                whileTap={{ scale: 0.98 }}
                style={{
                  backdropFilter: isSpatialGlassActive ? `blur(${blurPx}px)` : 'none',
                  WebkitBackdropFilter: isSpatialGlassActive ? `blur(${blurPx}px)` : 'none',
                  backgroundColor: isSpatialGlassActive ? `rgba(255, 255, 255, ${currentOpacity / 100})` : undefined,
                }}
                className="floaty-bar floaty-bar__surface h-[56px] sm:h-[58px] w-[336px] sm:w-[396px] max-w-[calc(100vw-20px)] flex items-center justify-between gap-1 px-2 rounded-xl shadow-[0_8px_20px_rgba(0,0,0,0.18)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.36)] select-none pointer-events-auto overflow-hidden bg-white dark:bg-[#2c2c2c] border border-[#e5e5e5] dark:border-[#3e3e3e] text-[#1b1b1b] dark:text-[#f3f3f3]"
                aria-label="Tab View"
              >
                <div 
                  id="floaty-bar-tabs-container"
                  className="floaty-bar__items w-full h-full relative z-30 overflow-hidden flex items-center justify-between gap-0.5 sm:gap-1 px-0.5 shrink-0 whitespace-nowrap"
                >
                  {DOCK_TABS.map((item) => {
                    const active = currentActiveId === item.id;
                    const isHovered = hoveredId === item.id;
                    const isSelectedOrHovered = active || isHovered;

                    return (
                      <button
                        key={item.id}
                        ref={(el) => { tabRefs.current[item.id] = el; }}
                        id={item.id}
                        type="button"
                        title={item.label}
                        onMouseEnter={() => setHoveredId(item.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        onClick={() => handleTabClick(item)}
                        className={`floaty-bar__item relative flex-1 h-[48px] sm:h-[52px] min-w-0 px-0.5 sm:px-1 rounded-full flex flex-col items-center justify-center cursor-default transition-all duration-150 outline-none select-none shrink-0 ${
                          active
                            ? 'is-active text-white z-20'
                            : isSelectedOrHovered
                              ? (isLightMode ? 'text-black z-10' : 'text-white z-10')
                              : (isLightMode ? 'text-black/80 hover:text-black hover:bg-black/5 z-10' : 'text-white/80 hover:text-white hover:bg-white/10 z-10')
                        }`}
                      >
                        {active && (
                          <motion.div
                            layoutId="floaty-bar-active-pill"
                            transition={{
                              type: 'spring',
                              stiffness: 420,
                              damping: 28,
                              mass: 0.55
                            }}
                            style={{ zIndex: 1 }}
                            className="floaty-bar-pill-indicator absolute inset-0 rounded-full pointer-events-none"
                          >
                            {/* Subtle contained glow around selected tab within tab view bar perimeter */}
                            <div 
                              className="absolute -inset-1 rounded-full bg-[#4cc2ff]/45 blur-[5px] pointer-events-none" 
                              aria-hidden="true" 
                            />
                            <div className="absolute inset-0 rounded-full bg-[#4cc2ff] border border-[#4cc2ff] shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)]" />
                          </motion.div>
                        )}
                        <div className="relative z-10 flex flex-col items-center justify-center w-full">
                          <div className="w-full h-[27px] sm:h-[29px] flex items-center justify-center shrink-0 relative">
                            {renderTabIcon(item, active, isSelectedOrHovered)}
                            {item.id === 'dock-search' && !!searchQuery?.trim() && (
                              <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-[#4cc2ff] ring-1.5 ring-black/40 shadow-sm" />
                            )}
                          </div>
                          <span
                            className={`text-[8px] sm:text-[8.5px] leading-none tracking-tight transition-colors duration-150 select-none text-center whitespace-nowrap block mt-0.5 -translate-y-[1.5px] ${
                              active
                                ? 'font-bold text-white'
                                : isLightMode
                                  ? 'font-medium text-black/85 group-hover:text-black'
                                  : 'font-medium text-white/85 group-hover:text-white'
                            }`}
                          >
                            {item.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.nav>

              {/* Tools Flyout Menu attached to More tab */}
              <div 
                ref={toolsFlyoutRef}
                className="absolute right-2 sm:right-3 bottom-full mb-2.5 z-50 pointer-events-auto"
              >
                <ToolsMenu
                  currentRoute={currentRoute}
                  currentChannel={currentChannel}
                  channels={channels || []}
                  onNavigate={(route) => {
                    setIsToolsOpen(false);
                    navigate(route);
                  }}
                  onOpenHelp={() => {
                    setIsToolsOpen(false);
                    onOpenHelp?.();
                  }}
                  onOpenDiscord={() => {
                    setIsToolsOpen(false);
                    onOpenDiscord?.();
                  }}
                  onOpenSummarize={(article) => {
                    setIsToolsOpen(false);
                    onOpenSummarize?.(article);
                  }}
                  onOpenTextToSpeech={(article) => {
                    setIsToolsOpen(false);
                    onOpenTextToSpeech?.(article);
                  }}
                  onOpenOfficeTool={(tool) => {
                    setIsToolsOpen(false);
                    navigate(`/${tool}`);
                  }}
                  onOpenFindWords={() => {
                    setIsToolsOpen(false);
                    onOpenFindWords?.();
                  }}
                  onOpenAddStream={() => {
                    setIsToolsOpen(false);
                    onOpenAddStream?.();
                  }}
                  onImportChannels={(newChs) => {
                    setIsToolsOpen(false);
                    onImportChannels?.(newChs);
                  }}
                  fontSize={fontSize || 16}
                  onChangeFontSize={onChangeFontSize || (() => {})}
                  placement="bottom"
                  isOpen={isToolsOpen}
                  onClose={() => setIsToolsOpen(false)}
                  showTrigger={false}
                />
              </div>
            </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
};

export { BottomDock as FloatyBar };
