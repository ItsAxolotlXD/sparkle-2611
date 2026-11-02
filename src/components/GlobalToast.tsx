import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Camera, Images, MoreHorizontal, PanelLeft, Search, Settings, Tv, X } from 'lucide-react';
import { AppToastDetail, AppToastSource } from '../utils/toast';
import { TOAST_NOTIFICATION_SOUND_SRC } from '../constants/assets';

const TOAST_SOURCES: Record<AppToastSource, { label: string; Icon: typeof Settings }> = {
  settings: { label: 'Settings', Icon: Settings },
  search: { label: 'Search', Icon: Search },
  sidebar: { label: 'Sidebar', Icon: PanelLeft },
  'live-tv': { label: 'Live TV', Icon: Tv },
  gallery: { label: 'Gallery', Icon: Images },
  camera: { label: 'Camera', Icon: Camera },
};

const formatActionText = (text: string) => {
  const trimmedText = text.trim();
  const enableMatch = trimmedText.match(/^Enable\s+(.+)$/i);
  if (enableMatch) return `Enabled "${enableMatch[1].trim()}"`;

  const disableMatch = trimmedText.match(/^Disable\s+(.+)$/i);
  if (disableMatch) return `Disabled "${disableMatch[1].trim()}"`;

  const changeMatch = trimmedText.match(/^Changed\s+(.+?)\s+to\s+(.+)$/i);
  if (changeMatch) return `Changed "${changeMatch[1].trim()}" to "${changeMatch[2].trim()}"`;

  const switchMatch = trimmedText.match(/^Switched to\s+(.+)$/i);
  if (switchMatch) return `Switched to "${switchMatch[1].trim()}"`;

  return trimmedText;
};

export const GlobalToast: React.FC = () => {
  const [toast, setToast] = useState<AppToastDetail | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    try {
      const audio = new Audio(TOAST_NOTIFICATION_SOUND_SRC);
      audio.preload = 'auto';
      audio.volume = 0.65;
      audioRef.current = audio;
    } catch (e) {
      console.warn('Init toast audio failed', e);
    }
  }, []);

  useEffect(() => {
    const handleShowToast = (e: Event) => {
      const customEvent = e as CustomEvent<AppToastDetail>;
      if (!customEvent.detail || (!customEvent.detail.message && !customEvent.detail.title)) return;

      if (timerRef.current) clearTimeout(timerRef.current);
      setToast(customEvent.detail);

      // Play Windows Notify System Generic sound
      try {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {
            try {
              const fallbackAudio = new Audio(TOAST_NOTIFICATION_SOUND_SRC);
              fallbackAudio.volume = 0.65;
              fallbackAudio.play().catch(() => {});
            } catch {}
          });
        } else {
          const freshAudio = new Audio(TOAST_NOTIFICATION_SOUND_SRC);
          freshAudio.volume = 0.65;
          freshAudio.play().catch(() => {});
        }
      } catch (err) {
        console.warn('Toast sound play error:', err);
      }

      const displayDuration = customEvent.detail.duration || 4500;
      timerRef.current = setTimeout(() => {
        setToast(null);
      }, displayDuration);
    };

    window.addEventListener('app:show-toast', handleShowToast);
    return () => {
      window.removeEventListener('app:show-toast', handleShowToast);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  let titleText = toast?.title;
  let descText = toast?.description;

  if (toast && !titleText) {
    if (toast.message.includes('\n')) {
      const parts = toast.message.split('\n');
      titleText = parts[0];
      descText = descText || parts.slice(1).join('\n');
    } else {
      titleText = toast.message;
    }
  } else if (toast && !descText && toast.message && toast.message !== toast.title) {
    descText = toast.message;
  }

  const sourceConfig = toast?.source ? TOAST_SOURCES[toast.source] : undefined;
  const SourceIcon = sourceConfig?.Icon ?? Bell;
  const sourceName = sourceConfig?.label ?? toast?.appName ?? 'App';
  const actionText = formatActionText(
    [titleText, descText].filter(Boolean).join(' — ') || toast?.message || ''
  );

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id || toast.message}
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, x: 120, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ 
            opacity: 0, 
            x: 140, 
            scale: 0.94, 
            transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } 
          }}
          transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-[9999999] pointer-events-auto w-[360px] max-w-[calc(100vw-32px)] rounded-[14px] p-3.5 sm:p-4 bg-[#f8f8fa]/98 dark:bg-[#1e2127]/98 backdrop-blur-3xl border border-black/15 dark:border-white/15 text-[#111827] dark:text-white shadow-[0_16px_40px_rgba(0,0,0,0.22)] dark:shadow-[0_22px_54px_rgba(0,0,0,0.7)] select-none transition-colors duration-150"
          style={{
            fontFamily: "'Segoe UI Variable Text', 'Segoe UI', system-ui, -apple-system, sans-serif",
          }}
        >
          <div className="flex items-center justify-between mb-2 select-none">
            <div className="flex min-w-0 items-center gap-2 text-[12px] font-normal text-[#4b5563] dark:text-[#cbd5e1]">
              <SourceIcon className="h-4 w-4 shrink-0 text-[#4b5563] dark:text-[#cbd5e1]" aria-hidden="true" />
              <span className="truncate font-normal tracking-tight">Notification</span>
            </div>

            <div className="flex items-center gap-1 shrink-0 text-[#6b7280] dark:text-[#94a3b8]">
              <button
                type="button"
                title="Options"
                aria-label="Copy notification details"
                onClick={(e) => {
                  e.stopPropagation();
                  if (navigator.clipboard && actionText) {
                    navigator.clipboard.writeText([sourceName, actionText].filter(Boolean).join(' — '));
                  }
                }}
                className="w-6 h-6 rounded flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-[#6b7280] dark:text-[#94a3b8] hover:text-[#111827] dark:hover:text-white transition-colors cursor-pointer border-none"
              >
                <MoreHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                title="Close"
                aria-label="Close notification"
                onClick={(e) => {
                  e.stopPropagation();
                  setToast(null);
                }}
                className="w-6 h-6 rounded flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/15 text-[#6b7280] dark:text-[#94a3b8] hover:text-[#111827] dark:hover:text-white transition-colors cursor-pointer border-none"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="space-y-0.5">
            <div className="text-[13.5px] font-normal text-[#111827] dark:text-[#e2e8f0] leading-snug break-words">
              {sourceName}
            </div>
            <div
              className="text-[12.5px] text-[#4b5563] dark:text-[#cbd5e1] leading-normal break-words"
              style={{ fontWeight: 350 }}
            >
              {actionText}
            </div>
          </div>

          {/* Quick action button (if provided) */}
          {toast.actionLabel && toast.onAction && (
            <div className="mt-3 pt-2 flex justify-end border-t border-black/[0.06] dark:border-white/[0.08]">
              <button
                type="button"
                onClick={() => {
                  toast.onAction?.();
                  setToast(null);
                }}
                className="px-3 py-1 rounded-[6px] bg-[#005fb8] hover:bg-[#0067c0] dark:bg-[#4cc2ff] dark:hover:bg-[#6bd0ff] text-white dark:text-black font-semibold text-xs transition-colors cursor-pointer border-none shadow-xs"
              >
                {toast.actionLabel}
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GlobalToast;
