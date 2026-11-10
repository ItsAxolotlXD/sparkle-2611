import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { flyoutPanelClassName, flyoutPanelStyle } from './FlyoutDropdown';
import { FluentEditIcon, FluentDeleteIcon } from './FluentIcons';
import { Channel } from '../types';

export type ChannelContextAction = 'edit' | 'remove';

interface WatchChannelContextMenuProps {
  x: number;
  y: number;
  channel: Channel;
  onAction: (action: ChannelContextAction) => void;
  onClose: () => void;
}

interface MenuEntry {
  action: ChannelContextAction;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  danger?: boolean;
}

const VIEWPORT_MARGIN = 8;

export const WatchChannelContextMenu: React.FC<WatchChannelContextMenuProps> = ({
  x,
  y,
  channel: _channel,
  onAction,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: x, top: y });

  const actions: MenuEntry[] = [
    { action: 'edit', label: 'Edit channel', icon: FluentEditIcon },
    { action: 'remove', label: 'Remove channel', icon: FluentDeleteIcon, danger: true },
  ];

  useLayoutEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const width = el.offsetWidth;
    const height = el.offsetHeight;
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
      if (!menuRef.current?.contains(e.target as Node)) {
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
        initial={{ y: -8 }}
        animate={{
          y: 0,
          transition: {
            duration: 0.16,
            delay,
            ease: 'linear',
          },
        }}
        onClick={() => {
          onAction(entry.action);
          onClose();
        }}
        className={`w-full h-[36px] px-3 rounded-[6px] flex items-center gap-3 text-[13px] font-medium text-left outline-none transition-colors cursor-pointer hover:bg-black/[0.05] dark:hover:bg-white/[0.08] focus-visible:bg-black/[0.05] dark:focus-visible:bg-white/[0.08] active:bg-black/[0.08] dark:active:bg-white/[0.12] ${
          entry.danger ? 'text-[#c42b1c] dark:text-[#ff99a4]' : 'text-[#111827] dark:text-white'
        }`}
      >
        <Icon
          className={`w-4 h-4 shrink-0 ${
            entry.danger ? 'text-[#c42b1c] dark:text-[#ff99a4]' : 'text-black dark:text-neutral-300'
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
      aria-label="Channel options"
transition={{ duration: 0.2, ease: 'linear' }}
      onContextMenu={(e) => e.preventDefault()}
      className={`fixed z-[2147483647] w-[232px] ${flyoutPanelClassName} fluent-context-menu`}
      style={{
        ...flyoutPanelStyle,
        left: position.left,
        top: position.top,
        transformOrigin: `${x - position.left}px ${y - position.top}px`,
      }}
    >
      {actions.map((entry, idx) => renderEntry(entry, idx * 0.04))}

      {/* Divider */}
      <motion.div
        role="separator"
        initial={{ y: -8 }}
        animate={{
          y: 0,
          transition: { duration: 0.16, delay: 0.08, ease: 'linear' },
        }}
        className="h-px bg-black/10 dark:bg-white/10 my-1 mx-1 origin-left"
      />

      {/* Disabled 'More to come soon...' */}
      <motion.div
        initial={{ y: -8 }}
        animate={{
          y: 0,
          transition: {
            duration: 0.16,
            delay: 0.1,
            ease: 'linear',
          },
        }}
        className="w-full h-[32px] px-3 flex items-center text-[12px] text-[#6B7280] dark:text-[#9CA3AF] select-none italic cursor-default opacity-60"
      >
        More to come soon...
      </motion.div>
    </motion.div>,
    document.body
  );
};
