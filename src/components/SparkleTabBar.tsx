import React, { useRef, useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  MoreHorizontal,
  Hand,
  Check,
  X,
  Copy,
  Trash2,
  Search
} from 'lucide-react';
import { flyoutPanelClassName, flyoutPanelStyle } from './FlyoutDropdown';
import {
  FluentHomeIcon,
  FluentWatchIcon,
  FluentLiveTvIcon,
  FluentNewsIcon,
  FluentNotesIcon,
  FluentGalleryIcon,
  FluentSettingsIcon,
  FluentSearchIcon,
  FluentCraftmineIcon,
  FluentPhotopeaIcon,
  FluentCameraIcon,
  FluentVlcIcon,
  FluentPersonFeedbackIcon,
  FluentInkCanvasIcon,
} from './FluentIcons';
import {
  Fluent3DHomeIcon,
  Fluent3DArticlesIcon,
  Fluent3DWatchPreviewIcon,
  Fluent3DGalleryIcon,
  Fluent3DDrawsIcon,
  Fluent3DNotesIcon,
  Fluent3DCraftmineIcon,
  Fluent3DPhotopeaIcon,
  Fluent3DVlcIcon,
  Fluent3DCameraIcon,
  Fluent3DSettingsIcon,
  Fluent3DFolderSearchIcon,
} from './Fluent3DIcons';
import { useSettings } from '../hooks/useSettings';

export interface AppTab {
  id: string;
  title: string;
  route: string;
  routeState?: any;
  channelId?: string;
}

interface SparkleTabBarProps {
  tabs: AppTab[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onCreateTab: () => void;
  onCloseTab: (tabId: string) => void;
  onDuplicateTab: (tabId: string) => void;
  onCloseOtherTabs: (tabId: string) => void;
  onReorderTabs: (reorderedTabs: AppTab[]) => void;
  isLightMode: boolean;
  onOpenSearch?: () => void;
}

interface TabContextMenuState {
  x: number;
  y: number;
  tabId: string;
}

interface TabGroup {
  id: string;
  tabIds: string[];
  name: string;
  color: string;
}

interface TabContextMenuProps {
  x: number;
  y: number;
  tabId: string;
  onClose: () => void;
  onCreateTab: () => void;
  onDuplicateTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onCloseOtherTabs: (tabId: string) => void;
}

const TabContextMenu: React.FC<TabContextMenuProps> = ({
  x,
  y,
  tabId,
  onClose,
  onCreateTab,
  onDuplicateTab,
  onCloseTab,
  onCloseOtherTabs,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(() => {
    const maxLeft = (typeof window !== 'undefined' ? window.innerWidth : 800) - 198;
    const maxTop = (typeof window !== 'undefined' ? window.innerHeight : 600) - 160;
    return {
      left: Math.max(8, Math.min(x, maxLeft)),
      top: Math.max(8, Math.min(y, maxTop)),
    };
  });

  useLayoutEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const maxLeft = (typeof window !== 'undefined' ? window.innerWidth : 800) - width - 8;
    const maxTop = (typeof window !== 'undefined' ? window.innerHeight : 600) - height - 8;
    setPosition({
      left: Math.max(8, Math.min(x, maxLeft)),
      top: Math.max(8, Math.min(y, maxTop)),
    });
  }, [x, y]);

  useEffect(() => {
    const handlePointerDown = (e: MouseEvent | PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const timer = setTimeout(() => {
      window.addEventListener('pointerdown', handlePointerDown);
    }, 50);

    window.addEventListener('keydown', handleKey);
    window.addEventListener('resize', onClose);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('resize', onClose);
    };
  }, [onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <motion.div
      ref={menuRef}
      exit={{ opacity: 1 }}
      transition={{ duration: 0.13 }}
      style={{
        position: 'fixed',
        left: position.left,
        top: position.top,
        zIndex: 2147483647,
      }}
      className="fluent-context-menu-wrapper pointer-events-auto"
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <motion.div
        role="menu"
        aria-label="Tab actions"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        exit={{ scaleY: 0 }}
        transition={{ duration: 0.11, ease: 'linear' }}
        style={{ ...flyoutPanelStyle, transformOrigin: `${x - position.left}px ${y - position.top}px` }}
        className={`w-[190px] p-1 ${flyoutPanelClassName} fluent-context-menu`}
      >
        <div className="w-full flex flex-col">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onCreateTab();
              onClose();
            }}
            className="w-full h-8 px-2.5 rounded-[4px] flex items-center gap-2.5 text-[12px] text-[#111827] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer text-left border-none"
          >
            <Plus className="w-3.5 h-3.5 text-neutral-400" />
            <span>New tab</span>
          </button>
          {tabId && (
            <>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onDuplicateTab(tabId);
                  onClose();
                }}
                className="w-full h-8 px-2.5 rounded-[4px] flex items-center gap-2.5 text-[12px] text-[#111827] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer text-left border-none"
              >
                <Copy className="w-3.5 h-3.5 text-neutral-400" />
                <span>Duplicate tab</span>
              </button>
              <div className="h-[1px] my-1 bg-black/10 dark:bg-white/10" />
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onCloseTab(tabId);
                  onClose();
                }}
                className="w-full h-8 px-2.5 rounded-[4px] flex items-center gap-2.5 text-[12px] text-[#111827] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer text-left border-none"
              >
                <X className="w-3.5 h-3.5 text-neutral-400" />
                <span>Close tab</span>
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onCloseOtherTabs(tabId);
                  onClose();
                }}
                className="w-full h-8 px-2.5 rounded-[4px] flex items-center gap-2.5 text-[12px] text-[#111827] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer text-left border-none"
              >
                <Trash2 className="w-3.5 h-3.5 text-neutral-400" />
                <span>Close other tabs</span>
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
};

// Renders the exact same icons as on the sidebar
const TabIcon: React.FC<{ route: string; active: boolean; dynamicIcons: boolean }> = ({
  route,
  dynamicIcons,
}) => {
  const iconClass = 'w-4 h-4 shrink-0';

  if (route === '/' || route === '/home' || route === '/home-preview') {
    return <FluentHomeIcon className={`${iconClass} text-black dark:text-white`} />;
  }
  if (route.startsWith('/news') || route.startsWith('/article') || route.startsWith('/updates')) {
    return <FluentNewsIcon className={`${iconClass} text-black dark:text-white`} />;
  }
  if (route.startsWith('/live-tv') || route.startsWith('/watch')) {
    return dynamicIcons ? (
      <Fluent3DWatchPreviewIcon className={iconClass} />
    ) : (
      <FluentWatchIcon className={`${iconClass} text-black dark:text-white`} />
    );
  }
  if (route.startsWith('/gallery')) {
    return dynamicIcons ? (
      <Fluent3DGalleryIcon className={iconClass} />
    ) : (
      <FluentGalleryIcon className={`${iconClass} text-black dark:text-white`} />
    );
  }
  if (route.startsWith('/notes') || route.startsWith('/write')) {
    return dynamicIcons ? (
      <Fluent3DNotesIcon className={iconClass} />
    ) : (
      <FluentNotesIcon className={`${iconClass} text-black dark:text-white`} />
    );
  }
  if (route.startsWith('/draws')) {
    return dynamicIcons ? (
      <Fluent3DDrawsIcon className={iconClass} />
    ) : (
      <FluentInkCanvasIcon className={`${iconClass} text-black dark:text-white`} />
    );
  }
  if (route.startsWith('/camera')) {
    return dynamicIcons ? (
      <Fluent3DCameraIcon className={iconClass} />
    ) : (
      <FluentCameraIcon className={`${iconClass} text-black dark:text-white`} />
    );
  }
  if (route.startsWith('/vlc') || route.startsWith('/screenbox')) {
    return dynamicIcons ? (
      <Fluent3DVlcIcon className={iconClass} />
    ) : (
      <FluentVlcIcon className={`${iconClass} text-black dark:text-white`} />
    );
  }
  if (route.startsWith('/craftmine')) {
    return dynamicIcons ? (
      <Fluent3DCraftmineIcon className={iconClass} />
    ) : (
      <FluentCraftmineIcon className={`${iconClass} text-black dark:text-white`} />
    );
  }
  if (route.startsWith('/photopea')) {
    return dynamicIcons ? (
      <Fluent3DPhotopeaIcon className={iconClass} />
    ) : (
      <FluentPhotopeaIcon className={`${iconClass} text-black dark:text-white`} />
    );
  }
  if (route.startsWith('/settings')) {
    return <FluentSettingsIcon className={`${iconClass} text-black dark:text-white`} />;
  }
  if (route.startsWith('/feedback')) {
    return <FluentPersonFeedbackIcon className={`${iconClass} text-black dark:text-white`} />;
  }
  if (route.startsWith('/search')) {
    return <FluentSearchIcon className={`${iconClass} text-black dark:text-white`} />;
  }
  if (route.startsWith('/channels') || route.startsWith('/test')) {
    return <FluentLiveTvIcon className={`${iconClass} text-black dark:text-white`} />;
  }

  // Fallback
  return <FluentHomeIcon className={`${iconClass} text-black dark:text-white`} />;
};

export const SparkleTabBar: React.FC<SparkleTabBarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCreateTab,
  onCloseTab,
  onDuplicateTab,
  onCloseOtherTabs,
  onReorderTabs,
  isLightMode,
  onOpenSearch,
}) => {
  const { settings } = useSettings();
  const dynamicIcons = settings.dynamicSidebarIcons !== false;
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [contextMenu, setContextMenu] = useState<TabContextMenuState | null>(null);
  const [isOverflowOpen, setIsOverflowOpen] = useState(false);
  const overflowMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOverflowOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (overflowMenuRef.current && !overflowMenuRef.current.contains(e.target as Node)) {
        setIsOverflowOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOverflowOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOverflowOpen]);
  const [isGrouping, setIsGrouping] = useState(false);
  const [selectedTabIds, setSelectedTabIds] = useState<string[]>([]);
  const [tabGroups, setTabGroups] = useState<TabGroup[]>([]);
  const [groupName, setGroupName] = useState('New group');
  const [groupColor, setGroupColor] = useState('#8b5cf6');
  const [addTabTooltip, setAddTabTooltip] = useState<{ top: number; left: number } | null>(null);
  const [searchTooltip, setSearchTooltip] = useState<{ top: number; left: number } | null>(null);

  const showSearchTooltip = (e: React.SyntheticEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setSearchTooltip({ top: rect.bottom + 6, left: rect.left + rect.width / 2 });
  };

  const hideSearchTooltip = () => setSearchTooltip(null);

  const showAddTabTooltip = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setAddTabTooltip({
      top: rect.bottom + 6,
      left: rect.left + rect.width / 2,
    });
  };

  const hideAddTabTooltip = () => {
    setAddTabTooltip(null);
  };

  const toggleGroupingMode = () => {
    setIsGrouping((current) => !current);
    setSelectedTabIds([]);
    setIsOverflowOpen(false);
  };

  const toggleTabSelection = (tabId: string) => {
    setSelectedTabIds((current) =>
      current.includes(tabId) ? current.filter((id) => id !== tabId) : [...current, tabId].slice(-2),
    );
  };

  const createTabGroup = () => {
    if (selectedTabIds.length < 2) return;
    setTabGroups((current) => [
      ...current.filter((group) => !group.tabIds.some((id) => selectedTabIds.includes(id))),
      { id: `tab-group-${Date.now()}`, tabIds: selectedTabIds, name: groupName.trim() || 'New group', color: groupColor },
    ]);
    setSelectedTabIds([]);
    setIsGrouping(false);
    setGroupName('New group');
  };

  const getTabGroup = (tabId: string) => tabGroups.find((group) => group.tabIds.includes(tabId));

  useEffect(() => {
    setAddTabTooltip(null);
  }, [tabs.length, activeTabId]);

  // Check overflow and scroll bounds for the two pole navigation arrows
  const updateScrollStatus = useCallback(() => {
    const el = tabsContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 2);
  }, []);

  useEffect(() => {
    const el = tabsContainerRef.current;
    if (!el) return;
    updateScrollStatus();
    el.addEventListener('scroll', updateScrollStatus, { passive: true });
    window.addEventListener('resize', updateScrollStatus);
    return () => {
      el.removeEventListener('scroll', updateScrollStatus);
      window.removeEventListener('resize', updateScrollStatus);
    };
  }, [tabs.length, updateScrollStatus]);

  // Scroll active tab into view when switched
  useEffect(() => {
    const el = tabsContainerRef.current;
    if (!el) return;
    const activeEl = el.querySelector(`[data-tab-id="${activeTabId}"]`) as HTMLElement | null;
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
    }
    setTimeout(updateScrollStatus, 160);
  }, [activeTabId, updateScrollStatus]);

  const handleScrollLeft = () => {
    tabsContainerRef.current?.scrollBy({ left: -150, behavior: 'smooth' });
  };

  const handleScrollRight = () => {
    tabsContainerRef.current?.scrollBy({ left: 150, behavior: 'smooth' });
  };

  // Tab Context menu state
  // Outside clicks are handled inside the dedicated TabContextMenu component

  return (
    <div className="flex-1 flex items-end min-w-0 h-full relative select-none -ml-1.5 sm:-ml-3 pl-0 pr-1">
      {/* 0. Search Icon at the start of Tab Bar (Tabbed Sparkle) */}
      {onOpenSearch && (
        <motion.button
          layoutId="sparkle-search-box-pill"
          type="button"
          id="btn-sparkle-tabbar-search"
          onClick={(e) => {
            e.stopPropagation();
            hideSearchTooltip();
            onOpenSearch();
          }}
          onMouseEnter={showSearchTooltip}
          onMouseLeave={hideSearchTooltip}
          onFocus={showSearchTooltip}
          onBlur={hideSearchTooltip}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          aria-label="Search"
          aria-describedby={searchTooltip ? 'sparkle-search-tooltip' : undefined}
          className="w-[30px] h-[30px] self-center mr-1.5 rounded-[8px] flex items-center justify-center bg-transparent hover:bg-black/10 dark:hover:bg-white/10 active:bg-black/15 dark:active:bg-white/15 transition-colors cursor-pointer shrink-0 z-10 border-none shadow-none"
        >
          <FluentSearchIcon className="w-[15px] h-[15px] text-black dark:text-white shrink-0 pointer-events-none select-none" />
        </motion.button>
      )}

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {searchTooltip && (
            <motion.div
              id="sparkle-search-tooltip"
              role="tooltip"
              key="sparkle-search-tooltip"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                top: `${searchTooltip.top}px`,
                left: `${searchTooltip.left}px`,
                transform: 'translateX(-50%)',
                backgroundColor: isLightMode ? 'rgba(255, 255, 255, 0.50)' : 'rgba(24, 24, 28, 0.50)',
                backdropFilter: 'blur(16px) saturate(140%)',
                WebkitBackdropFilter: 'blur(16px) saturate(140%)',
              }}
              className="z-[99999] px-3 py-1.5 min-h-[30px] flex items-center rounded-[6px] text-[#111827] dark:text-white text-xs font-medium shadow-[0_4px_20px_rgba(0,0,0,0.18)] border-0 outline-none pointer-events-none whitespace-nowrap select-none"
            >
              Search here
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* 1. Left Pole Arrow (<) for horizontal scrolling when tabs overflow */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={handleScrollLeft}
          title="Scroll tabs left"
          aria-label="Scroll tabs left"
          className="h-[28px] w-5 self-center mr-1 rounded-[4px] flex items-center justify-center text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 shrink-0 cursor-pointer z-10 transition-colors border-none"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      )}

      {/* 2. Scrollable Tabs Strip with Fade-In Animation on Tab Creation */}
      <div
        ref={tabsContainerRef}
        onWheel={(e) => {
          if (e.deltaY !== 0 && tabsContainerRef.current) {
            tabsContainerRef.current.scrollLeft += e.deltaY;
            updateScrollStatus();
          }
        }}
        className="flex-1 flex items-end overflow-x-auto no-scrollbar scroll-smooth h-full"
      >
        <Reorder.Group
          as="div"
          axis="x"
          values={tabs}
          onReorder={onReorderTabs}
          role="tablist"
          aria-label="Open tabs"
          onContextMenu={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault();
              e.stopPropagation();
              setContextMenu({
                x: e.clientX,
                y: e.clientY + 2,
                tabId: '',
              });
            }
          }}
          className="flex items-end space-x-1 h-full w-max min-w-full"
        >
          <AnimatePresence initial={false}>
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            const group = getTabGroup(tab.id);

            return (
              <Reorder.Item
                as="div"
                key={tab.id}
                value={tab}
                data-tab-id={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-keyshortcuts="Shift+ArrowLeft Shift+ArrowRight"
                tabIndex={0}
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 22 }}
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                layout
                dragMomentum={false}
                whileDrag={{ scale: 1.02, zIndex: 50 }}
                onKeyDown={(e) => {
                  if (!e.shiftKey || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
                  const currentIndex = tabs.findIndex((currentTab) => currentTab.id === tab.id);
                  const targetIndex = currentIndex + (e.key === 'ArrowLeft' ? -1 : 1);
                  if (targetIndex < 0 || targetIndex >= tabs.length) return;

                  e.preventDefault();
                  const reorderedTabs = [...tabs];
                  const [movedTab] = reorderedTabs.splice(currentIndex, 1);
                  reorderedTabs.splice(targetIndex, 0, movedTab);
                  onReorderTabs(reorderedTabs);
                }}
                onClick={() => (isGrouping ? toggleTabSelection(tab.id) : onSelectTab(tab.id))}
                onAuxClick={(e) => {
                  // Middle click closes tab
                  if (e.button === 1) {
                    e.preventDefault();
                    onCloseTab(tab.id);
                  }
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setContextMenu({
                    x: e.clientX,
                    y: e.clientY + 2,
                    tabId: tab.id,
                  });
                }}
                title={group ? `${tab.title} · ${group.name}` : tab.title}
                style={{
                  minWidth: tabs.length > 8 ? '68px' : tabs.length > 5 ? '92px' : '120px',
                  maxWidth: '210px',
                  borderTop: group ? `2px solid ${group.color}` : undefined,
                }}
                className={`group relative flex-1 shrink h-[38px] flex items-center justify-between px-2.5 cursor-grab active:cursor-grabbing rounded-t-[6px] transition-colors duration-150 border-none outline-none ${isGrouping && selectedTabIds.includes(tab.id) ? 'ring-2 ring-inset ring-violet-400 z-20' : ''} ${
                  isActive
                    ? isLightMode
                      ? 'bg-[#f9f9f9] text-[#111827] shadow-xs z-10'
                      : settings.superDarkMode
                      ? 'bg-black text-white shadow-xs z-10'
                      : 'bg-[#282c31] text-white shadow-xs z-10'
                    : isLightMode
                    ? 'bg-transparent text-[#4b5563] hover:bg-black/[0.04] hover:text-[#111827]'
                    : 'bg-transparent text-[#9ca3af] hover:bg-white/[0.05] hover:text-[#e5e7eb]'
                }`}
              >
                {/* Tab Icon & Title using Sidebar's Fluent Artwork */}
                <div className="flex items-center gap-2 min-w-0 flex-1 mr-1">
                  <TabIcon route={tab.route} active={isActive} dynamicIcons={dynamicIcons} />
                  <span
                    className={`text-[12px] truncate flex-1 leading-none ${
                      isActive ? 'font-medium' : 'font-normal'
                    }`}
                  >
                    {tab.title}
                  </span>
                </div>

                {/* Tab Close Button ('x') */}
                <button
                  type="button"
                  aria-label={`Close ${tab.title}`}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.id);
                  }}
                  className={`w-[16px] h-[16px] rounded-[3px] flex items-center justify-center shrink-0 transition-colors cursor-pointer border-none ${
                    isActive
                      ? 'text-neutral-400 hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/15'
                      : 'opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/15'
                  }`}
                >
                  <X className="w-3 h-3 stroke-[2.2]" />
                </button>
              </Reorder.Item>
            );
          })}
          </AnimatePresence>
        </Reorder.Group>
      </div>

      {/* 3. Right Pole Arrow (>) for horizontal scrolling when tabs overflow */}
      {canScrollRight && (
        <button
          type="button"
          onClick={handleScrollRight}
          title="Scroll tabs right"
          aria-label="Scroll tabs right"
          className="h-[28px] w-5 self-center ml-1 rounded-[4px] flex items-center justify-center text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 shrink-0 cursor-pointer z-10 transition-colors border-none"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}

      {/* 4. Overflow menu for tab actions */}
      <div ref={overflowMenuRef} className="relative self-center ml-1 z-30">
        <button
          type="button"
          id="btn-sparkle-tab-actions"
          aria-label="Tab actions"
          aria-expanded={isOverflowOpen}
          onClick={() => setIsOverflowOpen((open) => !open)}
          className="w-[28px] h-[28px] rounded-[5px] flex items-center justify-center text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 active:bg-black/15 dark:active:bg-white/15 transition-colors cursor-pointer border-none"
        >
          <MoreHorizontal className="w-4 h-4 stroke-[2.2]" />
        </button>
        <AnimatePresence>
          {isOverflowOpen && (
            <motion.div
              role="menu"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              exit={{ scaleY: 0 }}
              transition={{ duration: 0.11, ease: 'linear' }}
              style={{ ...flyoutPanelStyle, transformOrigin: 'top right' }}
              className={`absolute right-0 top-full mt-1.5 w-[190px] p-1 z-50 ${flyoutPanelClassName} fluent-context-menu`}
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => { setIsOverflowOpen(false); onCreateTab(); }}
                className="w-full h-8 px-2.5 rounded-[5px] flex items-center gap-2 text-[12px] text-[#111827] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 border-none cursor-pointer text-left"
              >
                <Plus className="w-3.5 h-3.5 text-neutral-400" />
                <span>New tab</span>
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={toggleGroupingMode}
                className="w-full h-8 px-2.5 rounded-[5px] flex items-center gap-2 text-[12px] text-[#111827] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 border-none cursor-pointer text-left"
              >
                <Hand className="w-3.5 h-3.5 text-neutral-400" />
                <span>{isGrouping ? 'Cancel group tabs' : 'Group tabs'}</span>
              </button>
              {isGrouping && (
                <div className="mt-1 border-t border-black/10 dark:border-white/10 pt-2 px-2 pb-1 space-y-2">
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Select 2 tabs</p>
                  <input value={groupName} onChange={(event) => setGroupName(event.target.value)} aria-label="Group name" className="w-full h-7 px-2 rounded border border-black/10 dark:border-white/10 bg-transparent text-[11px] text-black dark:text-white outline-none" />
                  <div className="flex items-center gap-1.5">
                    {['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'].map((color) => (
                      <button key={color} type="button" aria-label={`Use ${color} group color`} onClick={() => setGroupColor(color)} className={`w-4 h-4 rounded-full border-2 ${groupColor === color ? 'border-black dark:border-white' : 'border-transparent'}`} style={{ backgroundColor: color }} />
                    ))}
                  </div>
                  <button type="button" disabled={selectedTabIds.length < 2} onClick={createTabGroup} className="w-full h-7 rounded bg-violet-500 text-white text-[11px] disabled:opacity-40 disabled:cursor-not-allowed border-none cursor-pointer">Create group</button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 5. Tab Right-Click Context Menu with Slide-Down Animation from top edge */}
      <AnimatePresence>
        {contextMenu && (
          <TabContextMenu
            key={`tab-context-menu-${contextMenu.tabId || 'strip'}-${contextMenu.x}-${contextMenu.y}`}
            x={contextMenu.x}
            y={contextMenu.y}
            tabId={contextMenu.tabId}
            onClose={() => setContextMenu(null)}
            onCreateTab={onCreateTab}
            onDuplicateTab={onDuplicateTab}
            onCloseTab={onCloseTab}
            onCloseOtherTabs={onCloseOtherTabs}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
