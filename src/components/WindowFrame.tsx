import React, { useRef, useState, useEffect, useLayoutEffect, useCallback, createContext } from 'react';
import { motion } from 'motion/react';
import { Minus, Square, X, ArrowLeft } from 'lucide-react';
import { TabIcon, type AppTab } from './SparkleTabBar';
import { useSettings, getTaskbarHeightPx, getWindowsUiScaleMultiplier } from '../hooks/useSettings';

export const WindowTitleBarPortalContext = createContext<{
  titleBarSlotEl: HTMLDivElement | null;
  isInsideWindowFrame: boolean;
}>({
  titleBarSlotEl: null,
  isInsideWindowFrame: false,
});

export interface AppWindowState {
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
}

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

interface WindowFrameProps {
  tab: AppTab;
  windowState: AppWindowState;
  isActive: boolean;
  sidebarOffset: number;
  isRightSidebar: boolean;
  canGoBack?: boolean;
  onGoBack?: () => void;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onUpdateBounds: (bounds: Partial<AppWindowState>) => void;
  children: React.ReactNode;
}

const MIN_WIDTH = 360;
const MIN_HEIGHT = 260;

export const WindowFrame: React.FC<WindowFrameProps> = ({
  tab,
  windowState,
  isActive,
  sidebarOffset,
  isRightSidebar,
  canGoBack = false,
  onGoBack,
  onFocus,
  onClose,
  onMinimize,
  onToggleMaximize,
  onUpdateBounds,
  children,
}) => {
  const { settings } = useSettings();
  const dynamicIcons = settings.dynamicSidebarIcons !== false;
  const reduceMotion = settings.reduceAllMotion;
  const taskbarHeight = getTaskbarHeightPx(settings.taskbarScale);
  const uiScaleMult = getWindowsUiScaleMultiplier(settings.windowsUiScale);
  const titleBarHeight = settings.windowsUiScale === 'small' ? 32 : settings.windowsUiScale === 'large' ? 42 : 36;

  const [viewport, setViewport] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  }));
  const [showLaunchSplash, setShowLaunchSplash] = useState(true);

  useLayoutEffect(() => {
    setShowLaunchSplash(true);
    const timer = window.setTimeout(() => setShowLaunchSplash(false), 2000);
    return () => window.clearTimeout(timer);
  }, [tab.route]);

  useEffect(() => {
    const onResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isDesktop = viewport.width >= 768;
  const desktopMinX = isDesktop && !isRightSidebar ? sidebarOffset : 0;
  const desktopMaxX = isDesktop && isRightSidebar ? viewport.width - sidebarOffset : viewport.width;
  const desktopMaxY = viewport.height - taskbarHeight;

  // Dragging state
  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    wasMaximized: boolean;
    restoredWidth: number;
    restoredHeight: number;
    hasUnmaximized: boolean;
  } | null>(null);

  // Resizing state
  const resizeRef = useRef<{
    dir: ResizeDirection;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
  } | null>(null);

  const [isInteracting, setIsInteracting] = useState(false);
  const [titleBarSlotEl, setTitleBarSlotEl] = useState<HTMLDivElement | null>(null);
  const hasMergedTabBar = tab.route === '/file-explorer' || tab.route.startsWith('/file-explorer/');
  const effectiveTitleBarHeight = hasMergedTabBar ? Math.max(titleBarHeight, 40) : titleBarHeight;

  const handleTitlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, input, [role="tab"], [data-window-no-drag]')) return;

    onFocus();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsInteracting(true);

    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      origX: windowState.x,
      origY: windowState.y,
      wasMaximized: windowState.isMaximized,
      restoredWidth: windowState.width,
      restoredHeight: windowState.height,
      hasUnmaximized: false,
    };
  };

  const handleTitlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || !drag.active) return;

    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;

    if (drag.wasMaximized && !drag.hasUnmaximized) {
      if (Math.hypot(dx, dy) < 6) return;
      const availableW = desktopMaxX - desktopMinX;
      const targetW = Math.min(drag.restoredWidth, availableW - 16);
      const targetH = Math.min(drag.restoredHeight, desktopMaxY - 16);
      const newX = Math.max(
        desktopMinX,
        Math.min(e.clientX - targetW / 2, desktopMaxX - targetW)
      );
      const newY = Math.max(0, Math.min(e.clientY - 18, desktopMaxY - 40));
      drag.origX = newX;
      drag.origY = newY;
      drag.startX = e.clientX;
      drag.startY = e.clientY;
      drag.hasUnmaximized = true;
      onUpdateBounds({
        isMaximized: false,
        x: newX,
        y: newY,
        width: targetW,
        height: targetH,
      });
      return;
    }

    const nextX = Math.max(
      desktopMinX - windowState.width + 120,
      Math.min(drag.origX + dx, desktopMaxX - 120)
    );
    const nextY = Math.max(0, Math.min(drag.origY + dy, desktopMaxY - 36));
    onUpdateBounds({ x: nextX, y: nextY });
  };

  const handleTitlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.active) {
      dragRef.current.active = false;
      setIsInteracting(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  const handleResizePointerDown = useCallback(
    (dir: ResizeDirection, e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0 || windowState.isMaximized) return;
      e.preventDefault();
      e.stopPropagation();
      onFocus();
      e.currentTarget.setPointerCapture(e.pointerId);
      setIsInteracting(true);

      resizeRef.current = {
        dir,
        startX: e.clientX,
        startY: e.clientY,
        origX: windowState.x,
        origY: windowState.y,
        origW: windowState.width,
        origH: windowState.height,
      };
    },
    [windowState.isMaximized, windowState.x, windowState.y, windowState.width, windowState.height, onFocus]
  );

  const handleResizePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const r = resizeRef.current;
      if (!r) return;
      const dx = e.clientX - r.startX;
      const dy = e.clientY - r.startY;

      let nextX = r.origX;
      let nextY = r.origY;
      let nextW = r.origW;
      let nextH = r.origH;

      const minW = Math.min(MIN_WIDTH, desktopMaxX - desktopMinX);
      const minH = Math.min(MIN_HEIGHT, desktopMaxY);

      if (r.dir.includes('e')) {
        nextW = Math.max(minW, Math.min(r.origW + dx, desktopMaxX - r.origX));
      }
      if (r.dir.includes('s')) {
        nextH = Math.max(minH, Math.min(r.origH + dy, desktopMaxY - r.origY));
      }
      if (r.dir.includes('w')) {
        const rawW = r.origW - dx;
        const clampedW = Math.max(minW, Math.min(rawW, r.origX + r.origW - desktopMinX));
        nextX = r.origX + (r.origW - clampedW);
        nextW = clampedW;
      }
      if (r.dir.includes('n')) {
        const rawH = r.origH - dy;
        const clampedH = Math.max(minH, Math.min(rawH, r.origY + r.origH));
        nextY = r.origY + (r.origH - clampedH);
        nextH = clampedH;
      }

      onUpdateBounds({ x: nextX, y: nextY, width: nextW, height: nextH });
    },
    [desktopMinX, desktopMaxX, desktopMaxY, onUpdateBounds]
  );

  const handleResizePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (resizeRef.current) {
      resizeRef.current = null;
      setIsInteracting(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
  }, []);

  // Compute displayed geometry
  const maxWidth = Math.max(320, desktopMaxX - desktopMinX);
  const maxHeight = Math.max(240, desktopMaxY);

  const computedLeft = windowState.isMaximized
    ? desktopMinX
    : Math.max(desktopMinX - windowState.width + 120, Math.min(windowState.x, desktopMaxX - 120));
  const computedTop = windowState.isMaximized
    ? 0
    : Math.max(0, Math.min(windowState.y, Math.max(0, maxHeight - 36)));
  const computedWidth = windowState.isMaximized
    ? maxWidth
    : Math.min(windowState.width, maxWidth);
  const computedHeight = windowState.isMaximized
    ? maxHeight
    : Math.min(windowState.height, maxHeight);

  const resizeHandles: Array<{ dir: ResizeDirection; className: string }> = [
    { dir: 'n', className: 'top-0 left-2 right-2 h-1.5 cursor-ns-resize' },
    { dir: 's', className: 'bottom-0 left-2 right-2 h-1.5 cursor-ns-resize' },
    { dir: 'w', className: 'left-0 top-2 bottom-2 w-1.5 cursor-ew-resize' },
    { dir: 'e', className: 'right-0 top-2 bottom-2 w-1.5 cursor-ew-resize' },
    { dir: 'nw', className: 'top-0 left-0 w-3 h-3 cursor-nwse-resize z-20' },
    { dir: 'ne', className: 'top-0 right-0 w-3 h-3 cursor-nesw-resize z-20' },
    { dir: 'sw', className: 'bottom-0 left-0 w-3 h-3 cursor-nesw-resize z-20' },
    { dir: 'se', className: 'bottom-0 right-0 w-3 h-3 cursor-nwse-resize z-20' },
  ];

  const isCustomRouteFull =
    tab.route === '/craftmine' ||
    tab.route === '/photopea' ||
    tab.route.startsWith('/draws/') ||
    tab.route === '/html-writer' ||
    tab.route.startsWith('/html-writer/') ||
    tab.route === '/pc-settings' ||
    tab.route.startsWith('/pc-settings/') ||
    tab.route === '/file-explorer' ||
    tab.route.startsWith('/file-explorer/');

  return (
    <motion.section
      role="dialog"
      aria-label={tab.title}
      aria-hidden={windowState.isMinimized}
      data-window-id={tab.id}
      data-window-frame="true"
      data-window-active={isActive ? 'true' : 'false'}
      onPointerDownCapture={onFocus}
      initial={
        reduceMotion
          ? false
          : {
              opacity: 1,
              scale: 0.86,
              y: 16,
              left: computedLeft,
              top: computedTop,
              width: computedWidth,
              height: computedHeight,
            }
      }
      animate={
        windowState.isMinimized
          ? {
              opacity: 0,
              scale: 0.72,
              y: 110,
              left: computedLeft,
              top: computedTop,
              width: computedWidth,
              height: computedHeight,
            }
          : {
              opacity: 1,
              scale: 1,
              y: 0,
              left: computedLeft,
              top: computedTop,
              width: computedWidth,
              height: computedHeight,
            }
      }
      exit={
        reduceMotion
          ? undefined
          : {
              opacity: 0,
              scale: 0.84,
              y: 14,
              transition: { duration: 0.18, ease: [0.4, 0, 1, 1] },
            }
      }
      transition={
        reduceMotion || isInteracting
          ? { duration: 0 }
          : { duration: 0.25, ease: [0.16, 1, 0.3, 1] }
      }
      style={{
        position: 'fixed',
        zIndex: windowState.zIndex,
        transformOrigin: 'center center',
      }}
      className={`windows-mica-frame flex flex-col overflow-hidden select-text ${
        windowState.isMinimized ? 'pointer-events-none' : 'pointer-events-auto'
      } ${
        windowState.isMaximized
          ? 'rounded-none border-0'
          : 'rounded-[10px] border border-black/15 dark:border-white/[0.14]'
      } ${
        isActive
          ? 'shadow-[0_24px_64px_rgba(0,0,0,0.48),0_4px_16px_rgba(0,0,0,0.22)] ring-1 ring-black/5 dark:ring-white/[0.08]'
          : 'shadow-[0_12px_36px_rgba(0,0,0,0.28)]'
      } ${
        isInteracting ? 'select-none' : 'transition-[border-radius,box-shadow] duration-200'
      }`}
    >
      {/* 8-Direction Resize Handles when restored */}
      {!windowState.isMaximized &&
        resizeHandles.map((handle) => (
          <div
            key={handle.dir}
            onPointerDown={(e) => handleResizePointerDown(handle.dir, e)}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
            onPointerCancel={handleResizePointerUp}
            className={`absolute ${handle.className} z-30`}
          />
        ))}

      {/* Windows 11 Title Bar */}
      <div
        onPointerDown={handleTitlePointerDown}
        onPointerMove={handleTitlePointerMove}
        onPointerUp={handleTitlePointerUp}
        onPointerCancel={handleTitlePointerUp}
        onDoubleClick={(e) => {
          if ((e.target as HTMLElement).closest('button, input, [role="tab"], [data-window-no-drag]')) return;
          onToggleMaximize();
        }}
        style={{ height: `${effectiveTitleBarHeight}px` }}
        className={`shrink-0 flex items-center justify-between ${hasMergedTabBar ? 'pl-2' : 'pl-2.5'} pr-0 select-none cursor-default bg-transparent ${
          isActive
            ? 'text-[#111827] dark:text-white'
            : 'text-[#6b7280] dark:text-[#9ca3af]'
        }`}
      >
        {/* Left: optional Back + Merged Tab Bar OR App Icon + Title */}
        <div className="flex items-center gap-2 min-w-0 flex-1 h-full pr-2">
          {canGoBack && onGoBack && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onGoBack();
              }}
              aria-label="Back in window"
              className="w-6 h-6 rounded-[5px] flex items-center justify-center hover:bg-black/[0.07] dark:hover:bg-white/[0.09] text-current transition-colors cursor-pointer shrink-0 border-none"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}
          {hasMergedTabBar ? (
            <div
              ref={setTitleBarSlotEl}
              className="flex-1 min-w-0 h-full flex items-end pt-1"
            />
          ) : (
            <>
              <div className="w-4 h-4 flex items-center justify-center shrink-0">
                <TabIcon route={tab.route} active={isActive} dynamicIcons={dynamicIcons} className="w-4 h-4 shrink-0" />
              </div>
              <span className="text-[12px] font-medium truncate leading-none">
                {tab.title}
              </span>
            </>
          )}
        </div>

        {/* Right: Windows 11 Caption Controls */}
        <div className="flex items-stretch h-full shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMinimize();
            }}
            aria-label={`Minimize ${tab.title}`}
            className="w-[42px] h-full flex items-center justify-center hover:bg-black/[0.06] dark:hover:bg-white/[0.08] active:bg-black/10 dark:active:bg-white/15 transition-colors cursor-pointer border-none"
          >
            <Minus className="w-3.5 h-3.5 stroke-[1.75]" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMaximize();
            }}
            aria-label={windowState.isMaximized ? `Restore ${tab.title}` : `Maximize ${tab.title}`}
            className="w-[42px] h-full flex items-center justify-center hover:bg-black/[0.06] dark:hover:bg-white/[0.08] active:bg-black/10 dark:active:bg-white/15 transition-colors cursor-pointer border-none"
          >
            {windowState.isMaximized ? (
              <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
                <rect x="1.5" y="3.5" width="7" height="7" rx="1" />
                <path d="M3.5 3.5V2.5a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H8.5" />
              </svg>
            ) : (
              <Square className="w-3 h-3 stroke-[1.75]" />
            )}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label={`Close ${tab.title}`}
            className="w-[44px] h-full flex items-center justify-center hover:bg-[#c42b1c] hover:text-white active:bg-[#b32619] active:text-white transition-colors cursor-pointer border-none"
          >
            <X className="w-3.5 h-3.5 stroke-[1.8]" />
          </button>
        </div>
      </div>

      {/* Scrollable Window Body */}
      <div
        className={`window-content-area flex-1 min-h-0 ${
          hasMergedTabBar ? 'overflow-hidden flex flex-col' : 'overflow-y-auto overflow-x-hidden'
        } relative bg-transparent ${isCustomRouteFull ? 'p-0' : ''}`}
      >
        <div
          aria-hidden={showLaunchSplash}
          inert={showLaunchSplash}
          style={{ zoom: uiScaleMult }}
          className={`w-full ${hasMergedTabBar ? 'h-full overflow-hidden' : 'min-h-full'} ${
            tab.route === '/' ||
            tab.route === '/home' ||
            tab.route === '/news' ||
            tab.route === '/updates' ||
            tab.route.startsWith('/notes') ||
            tab.route === '/write' ||
            tab.route === '/craftmine' ||
            tab.route === '/photopea' ||
            tab.route === '/vlc' ||
            tab.route === '/screenbox' ||
            tab.route === '/screenbug' ||
            tab.route === '/gallery' ||
            tab.route === '/draws' ||
            tab.route.startsWith('/draws/') ||
            tab.route === '/camera' ||
            tab.route === '/html-writer' ||
            tab.route.startsWith('/html-writer/') ||
            tab.route === '/pc-settings' ||
            tab.route.startsWith('/pc-settings/') ||
            tab.route === '/file-explorer' ||
            tab.route.startsWith('/file-explorer/')
              ? 'p-0 h-full'
              : 'px-4 sm:px-6 py-5 max-w-7xl mx-auto'
          }`}
        >
          <WindowTitleBarPortalContext.Provider
            value={{ titleBarSlotEl, isInsideWindowFrame: true }}
          >
            {children}
          </WindowTitleBarPortalContext.Provider>
        </div>
      </div>
      {showLaunchSplash && (
        <div
          role="status"
          aria-label={`Loading ${tab.title}`}
          className="absolute inset-0 z-[100] flex items-center justify-center"
          style={{
            backgroundColor: settings.theme === 'light' ? '#ffffff' : '#202020',
            backgroundImage: 'none',
            opacity: 1,
            isolation: 'isolate',
          }}
        >
          <TabIcon route={tab.route} active={isActive} className="w-16 h-16 shrink-0 drop-shadow-sm" />
        </div>
      )}
    </motion.section>
  );
};
