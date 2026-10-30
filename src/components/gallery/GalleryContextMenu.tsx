import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { MousePointer2, Star, Share2, Save } from 'lucide-react';
import { flyoutPanelClassName, flyoutPanelStyle } from '../FlyoutDropdown';
import { FluentRenameIcon, FluentFolderArrowLeftIcon, FluentDeleteIcon, FluentCopyIcon } from '../FluentIcons';

export type GalleryContextAction = 'open' | 'favorite' | 'rename' | 'share' | 'duplicate' | 'move' | 'save' | 'delete';

interface GalleryContextMenuProps {
  x: number;
  y: number;
  isFavorite: boolean;
  onAction: (action: GalleryContextAction) => void;
  onClose: () => void;
}

interface MenuEntry {
  action: GalleryContextAction;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  danger?: boolean;
}

const VIEWPORT_MARGIN = 8;

export const GalleryContextMenu: React.FC<GalleryContextMenuProps> = ({ x, y, isFavorite, onAction, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: x, top: y });

  const primary: MenuEntry[] = [
    { action: 'open', label: 'Open', icon: MousePointer2 },
    { action: 'favorite', label: isFavorite ? 'Remove from favorites' : 'Add to favorites', icon: Star },
    { action: 'rename', label: 'Rename', icon: FluentRenameIcon },
    { action: 'share', label: 'Share', icon: Share2 },
    { action: 'duplicate', label: 'Duplicate', icon: FluentCopyIcon },
    { action: 'move', label: 'Move into a folder', icon: FluentFolderArrowLeftIcon },
  ];
  const secondary: MenuEntry[] = [
    { action: 'save', label: 'Save to device', icon: Save },
    { action: 'delete', label: 'Delete', icon: FluentDeleteIcon, danger: true },
  ];

  useLayoutEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const maxLeft = window.innerWidth - width - VIEWPORT_MARGIN;
    const maxTop = window.innerHeight - height - VIEWPORT_MARGIN;
    setPosition({
      left: Math.max(VIEWPORT_MARGIN, Math.min(x, maxLeft)),
      top: Math.max(VIEWPORT_MARGIN, y > maxTop ? y - height : y),
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

  const renderEntry = (entry: MenuEntry, delay: number) => {
    const Icon = entry.icon;
    return (
      <motion.button
        key={entry.action}
        type="button"
        role="menuitem"
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.38,
            delay,
            ease: [0.16, 1, 0.3, 1],
          },
        }}
        onClick={() => onAction(entry.action)}
        className={`w-full h-[36px] px-3 rounded-[6px] flex items-center gap-3 text-[13px] font-medium text-left outline-none transition-colors cursor-pointer hover:bg-black/[0.05] dark:hover:bg-white/[0.08] focus-visible:bg-black/[0.05] dark:focus-visible:bg-white/[0.08] active:bg-black/[0.08] dark:active:bg-white/[0.12] ${
          entry.danger ? 'text-[#c42b1c] dark:text-[#ff99a4]' : 'text-[#111827] dark:text-white'
        }`}
      >
        <Icon
          className={`w-4 h-4 shrink-0 ${
            entry.danger ? 'text-black dark:text-[#ff99a4]' : 'text-black dark:text-neutral-300'
          }`}
        />
        <span className="truncate">{entry.label}</span>
      </motion.button>
    );
  };

  return createPortal(
    <motion.div
      ref={menuRef}
      role="menu"
      aria-label="File actions"
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 14 }}
      transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
      onContextMenu={(e) => e.preventDefault()}
      className={`fixed z-[2147483647] w-[232px] ${flyoutPanelClassName} fluent-context-menu`}
      style={{ ...flyoutPanelStyle, left: position.left, top: position.top }}
    >
      {primary.map((entry, idx) => renderEntry(entry, idx * 0.04))}
      <motion.div
        role="separator"
        initial={{ opacity: 0, scaleX: 0.8 }}
        animate={{
          opacity: 1,
          scaleX: 1,
          transition: { duration: 0.38, delay: 0.23, ease: [0.16, 1, 0.3, 1] },
        }}
        className="h-px bg-black/10 dark:bg-white/10 my-1 mx-1 origin-left"
      />
      {secondary.map((entry, idx) => renderEntry(entry, 0.26 + idx * 0.04))}
    </motion.div>,
    document.body
  );
};
