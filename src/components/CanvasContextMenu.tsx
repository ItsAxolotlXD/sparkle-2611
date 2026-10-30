import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { Download, Image as GalleryIcon } from 'lucide-react';
import { flyoutPanelClassName, flyoutPanelStyle } from './FlyoutDropdown';
import { FluentRenameIcon, FluentDeleteIcon } from './FluentIcons';

export type CanvasContextAction = 'export' | 'gallery' | 'rename' | 'delete';

interface CanvasContextMenuProps {
  x: number;
  y: number;
  onAction: (action: CanvasContextAction) => void;
  onClose: () => void;
}

const entries: Array<{ action: CanvasContextAction; label: string; icon: React.ComponentType<{ className?: string }>; danger?: boolean }> = [
  { action: 'export', label: 'Export canvas', icon: Download },
  { action: 'gallery', label: 'Save to Gallery', icon: GalleryIcon },
  { action: 'rename', label: 'Rename', icon: FluentRenameIcon },
  { action: 'delete', label: 'Delete', icon: FluentDeleteIcon, danger: true },
];

export const CanvasContextMenu: React.FC<CanvasContextMenuProps> = ({ x, y, onAction, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: x, top: y });

  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const { width, height } = menu.getBoundingClientRect();
    setPosition({
      left: Math.max(8, Math.min(x, window.innerWidth - width - 8)),
      top: Math.max(8, y > window.innerHeight - height - 8 ? y - height : y),
    });
    menu.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus({ preventScroll: true });
  }, [x, y]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    // Small delay ensures initiating right-click event lifecycle finishes before listening
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('contextmenu', handleOutsideClick);
    }, 40);

    document.addEventListener('keydown', handleKey);
    window.addEventListener('resize', onClose);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('contextmenu', handleOutsideClick);
      document.removeEventListener('keydown', handleKey);
      window.removeEventListener('resize', onClose);
    };
  }, [onClose]);

  return createPortal(
    <motion.div
      ref={menuRef}
      role="menu"
      aria-label="Canvas actions"
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 14 }}
      transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
      onContextMenu={(event) => event.preventDefault()}
      onMouseDown={(event) => event.stopPropagation()}
      className={`fixed z-[2147483647] w-[232px] ${flyoutPanelClassName} fluent-context-menu`}
      style={{ ...flyoutPanelStyle, left: position.left, top: position.top }}
    >
      {entries.map((entry, index) => {
        const Icon = entry.icon;
        return (
          <motion.button
            key={entry.action}
            type="button"
            role="menuitem"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAction(entry.action);
            }}
            className={`w-full h-[36px] px-3 rounded-[6px] flex items-center gap-3 text-[13px] font-medium text-left outline-none transition-colors cursor-pointer hover:bg-black/[0.05] dark:hover:bg-white/[0.08] focus-visible:bg-black/[0.05] dark:focus-visible:bg-white/[0.08] active:bg-black/[0.08] dark:active:bg-white/[0.12] ${entry.danger ? 'text-[#c42b1c] dark:text-[#ff99a4]' : 'text-[#111827] dark:text-white'}`}
          >
            <Icon className={`w-4 h-4 shrink-0 ${entry.danger ? 'text-black dark:text-[#ff99a4]' : 'text-black dark:text-neutral-300'}`} />
            <span className="truncate">{entry.label}</span>
          </motion.button>
        );
      })}
    </motion.div>,
    document.body
  );
};
