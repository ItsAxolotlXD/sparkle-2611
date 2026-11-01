import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MoreHorizontal, X, Bell } from 'lucide-react';
import { AppToastDetail } from '../utils/toast';
import { TOAST_NOTIFICATION_SOUND_SRC } from '../constants/assets';

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

  if (!toast) return null;

  // Compute title & description:
  // If toast.title is given: title = toast.title, description = toast.description || toast.message
  // Otherwise if toast.message has newlines: first line = title, remaining = description
  // Otherwise: title = toast.message, description = toast.description
  let titleText = toast.title;
  let descText = toast.description;

  if (!titleText) {
    if (toast.message.includes('\n')) {
      const parts = toast.message.split('\n');
      titleText = parts[0];
      descText = descText || parts.slice(1).join('\n');
    } else {
      titleText = toast.message;
    }
  } else if (!descText && toast.message && toast.message !== toast.title) {
    descText = toast.message;
  }

  const appName = toast.appName || 'fluent';

  return (
    <AnimatePresence>
      <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-[9999999] pointer-events-none flex flex-col items-end">
        <motion.div
          key={toast.id || toast.message}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100, transition: { duration: 0.22, ease: 'easeIn' } }}
          transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-auto w-[350px] max-w-[calc(100vw-32px)] rounded-[14px] p-3.5 sm:p-4 bg-[#f0f0f0]/95 dark:bg-[#20232a]/95 backdrop-blur-2xl border border-black/10 dark:border-white/10 text-[#111827] dark:text-white shadow-[0_12px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_18px_48px_rgba(0,0,0,0.6)] select-none transition-colors duration-150"
          style={{
            fontFamily: "'Segoe UI Variable Text', 'Segoe UI', system-ui, -apple-system, sans-serif",
          }}
        >
          {/* Header row: App Icon + App Name + Options + Close */}
          <div className="flex items-center justify-between text-xs text-[#4b5563] dark:text-[#cbd5e1] mb-2 select-none">
            <div className="flex items-center gap-2 font-normal text-[12px] truncate">
              {/* Gold notification bell icon matching the screenshot */}
              <span className="text-[13px] leading-none shrink-0" aria-hidden="true">
                🔔
              </span>
              <span className="truncate text-[#1f2937] dark:text-[#e2e8f0] font-normal tracking-tight">
                {appName}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0 text-[#6b7280] dark:text-[#94a3b8]">
              <button
                type="button"
                title="Options"
                onClick={(e) => {
                  e.stopPropagation();
                  if (navigator.clipboard && (titleText || descText)) {
                    navigator.clipboard.writeText([titleText, descText].filter(Boolean).join(' - '));
                  }
                }}
                className="w-6 h-6 rounded flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-[#6b7280] dark:text-[#94a3b8] hover:text-[#111827] dark:hover:text-white transition-colors cursor-pointer border-none"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title="Close"
                onClick={(e) => {
                  e.stopPropagation();
                  setToast(null);
                }}
                className="w-6 h-6 rounded flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/15 text-[#6b7280] dark:text-[#94a3b8] hover:text-[#111827] dark:hover:text-white transition-colors cursor-pointer border-none"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Main notification body */}
          <div className="space-y-1">
            <div className="text-[13.5px] font-semibold text-[#111827] dark:text-white leading-snug break-words">
              {titleText}
            </div>
            {descText && (
              <div className="text-[12.5px] text-[#4b5563] dark:text-[#94a3b8] leading-normal break-words font-normal">
                {descText}
              </div>
            )}
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
      </div>
    </AnimatePresence>
  );
};

export default GlobalToast;
