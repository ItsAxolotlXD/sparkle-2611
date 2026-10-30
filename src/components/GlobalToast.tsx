import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check } from 'lucide-react';
import { AppToastDetail } from '../utils/toast';
import { TOAST_NOTIFICATION_SOUND_SRC, TOAST_NOTIFICATION_SOUND_FALLBACK_URL } from '../constants/assets';

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
      if (!customEvent.detail || !customEvent.detail.message) return;

      if (timerRef.current) clearTimeout(timerRef.current);
      setToast(customEvent.detail);

      // Play Windows Notify System Generic sound
      try {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {
            // If failed (e.g. user interaction required on fresh tab), fallback smoothly
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

      timerRef.current = setTimeout(() => {
        setToast(null);
      }, 3200);
    };

    window.addEventListener('app:show-toast', handleShowToast);
    return () => {
      window.removeEventListener('app:show-toast', handleShowToast);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id || toast.message}
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[99999] bg-white/95 dark:bg-[#20242a]/95 backdrop-blur-2xl border border-black/10 dark:border-white/10 text-[#111827] dark:text-white text-xs sm:text-sm px-4 py-2.5 rounded-[6px] shadow-xl flex items-center gap-2.5 font-medium select-none pointer-events-auto"
        >
          {/* Tick icon on left: strictly black in light mode, white in dark mode */}
          <Check
            className="app-toast-tick w-4 h-4 text-black dark:text-white stroke-[2.5] shrink-0"
            aria-hidden="true"
          />
          <span className="leading-tight">{toast.message}</span>
          {toast.actionLabel && toast.onAction && (
            <button
              type="button"
              onClick={() => {
                toast.onAction?.();
                setToast(null);
              }}
              className="ml-2 px-2.5 py-1 rounded-[4px] bg-[#005fb8] dark:bg-[#4cc2ff] text-white dark:text-black font-semibold text-xs hover:opacity-90 transition-opacity cursor-pointer border-none"
            >
              {toast.actionLabel}
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
