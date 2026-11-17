import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import {
  contextMenuMotionProps,
  contextMenuUpMotionProps,
  flyoutPanelClassName,
  flyoutPanelStyle,
} from './FlyoutDropdown';

export interface WindowsContextMenuItem {
  id: string;
  label?: string;
  icon?: React.ReactNode;
  checked?: boolean;
  danger?: boolean;
  divider?: boolean;
  onSelect?: () => void;
}

interface WindowsContextMenuProps {
  x: number;
  y: number;
  ariaLabel: string;
  items: WindowsContextMenuItem[];
  onClose: () => void;
}

const MENU_MARGIN = 8;

export const WindowsContextMenu: React.FC<WindowsContextMenuProps> = ({
  x,
  y,
  ariaLabel,
  items,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [opensUpward] = useState(() =>
    typeof window !== 'undefined' ? y > window.innerHeight - 240 : false
  );
  const [position, setPosition] = useState(() => {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 800;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 600;
    return {
      left: Math.max(MENU_MARGIN, Math.min(x, vw - 240)),
      top: Math.max(MENU_MARGIN, Math.min(y, vh - 260)),
    };
  });

  useLayoutEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const safeWidth = width > 60 ? width : 228;
    const safeHeight = height > 40 ? height : 240;
    const vw = typeof window !== 'undefined' ? window.innerWidth : 800;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 600;
    setPosition({
      left: Math.max(MENU_MARGIN, Math.min(x, vw - safeWidth - MENU_MARGIN)),
      top: Math.max(MENU_MARGIN, Math.min(y, vh - safeHeight - MENU_MARGIN)),
    });
    el.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus({ preventScroll: true });
  }, [x, y, items.length]);

  useEffect(() => {
    const handlePointerDown = (e: MouseEvent | PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
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
        if (buttons.length === 0) return;
        const idx = buttons.indexOf(document.activeElement as HTMLButtonElement);
        const next =
          e.key === 'ArrowDown'
            ? (idx + 1) % buttons.length
            : (idx - 1 + buttons.length) % buttons.length;
        buttons[next]?.focus();
      }
    };

    const timer = setTimeout(() => {
      window.addEventListener('pointerdown', handlePointerDown);
    }, 40);

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
    <div
      ref={menuRef}
      data-windows-context-menu="true"
      style={{
        position: 'fixed',
        left: position.left,
        top: position.top,
        zIndex: 2147483647,
        overflow: 'clip',
      }}
      className="fluent-context-menu-wrapper pointer-events-auto"
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <motion.div {...(opensUpward ? contextMenuUpMotionProps : contextMenuMotionProps)}>
        <div
          role="menu"
          aria-label={ariaLabel}
          style={flyoutPanelStyle}
          className={`w-[228px] p-1.5 ${flyoutPanelClassName} fluent-context-menu shadow-none`}
        >
          <div className="w-full flex flex-col space-y-0.5">
            {items.map((item) =>
              item.divider ? (
                <div key={item.id} className="h-px bg-black/10 dark:bg-white/10 my-1 mx-1" />
              ) : (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onClose();
                    item.onSelect?.();
                  }}
                  className={`w-full h-[36px] px-3 rounded-[6px] flex items-center gap-3 text-[13px] font-medium text-left outline-none transition-colors cursor-pointer hover:bg-black/[0.05] dark:hover:bg-white/[0.08] focus-visible:bg-black/[0.05] dark:focus-visible:bg-white/[0.08] active:bg-black/[0.08] dark:active:bg-white/[0.12] ${
                    item.danger ? 'text-[#c42b1c] dark:text-[#ff99a4]' : ''
                  }`}
                >
                  {item.icon && (
                    <span
                      className={`w-4 h-4 shrink-0 flex items-center justify-center ${
                        item.danger ? 'text-[#c42b1c] dark:text-[#ff99a4]' : 'text-black dark:text-neutral-300'
                      }`}
                    >
                      {item.icon}
                    </span>
                  )}
                  <span className="truncate flex-1">{item.label}</span>
                  {item.checked && (
                    <Check className="w-4 h-4 shrink-0 text-[#005fb8] dark:text-[#4cc2ff]" />
                  )}
                </button>
              )
            )}
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
