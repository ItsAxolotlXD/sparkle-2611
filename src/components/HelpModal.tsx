import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Keyboard, HelpCircle, Tv, Moon, Bookmark, Share2 } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { modalDialogVariants, modalBackdropVariants } from '../utils/animations';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const { settings } = useSettings();
  const shouldAnimate = !settings.reduceAllMotion && settings.animateModals;

  const shortcuts = [
    { key: 'Alt + 1', desc: 'Home' },
    { key: 'Alt + 2', desc: 'Spotlight Search' },
    { key: 'Alt + 3', desc: 'Tools Menu' },
    { key: 'Alt + 4', desc: 'Settings' },
    { key: 'Alt + 5', desc: 'Most Recent Channel' },
    { key: '⌘ + K / Ctrl + K', desc: 'Quick Spotlight Search' },
    { key: 'Space', desc: 'Play / Pause Live TV Stream' },
    { key: 'M', desc: 'Mute / Unmute Audio' },
    { key: 'F', desc: 'Fullscreen Player' },
    { key: 'T', desc: 'Theater Mode' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 sm:p-6 select-none">
          <motion.div
            id="help-modal-backdrop"
            variants={modalBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
          />

          <motion.div
            id="help-modal-dialog"
            variants={modalDialogVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fluent-modal-dialog relative z-10 w-full max-w-[480px] bg-white dark:bg-[#202020] rounded-[10px] overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.22),0_2px_6px_rgba(0,0,0,0.08)] dark:shadow-[0_24px_48px_rgba(0,0,0,0.7),0_2px_6px_rgba(255,255,255,0.04)] border border-black/[0.08] dark:border-white/[0.08] text-[#111827] dark:text-[#F3F4F6]"
          >
            {/* Header & Body Content Area */}
            <div className="p-6 pb-4 max-h-[75vh] overflow-y-auto">
              <h2 className="text-[19px] sm:text-[20px] font-semibold text-[#111827] dark:text-[#FFFFFF] tracking-tight leading-snug font-sans">
                Help & Keyboard Shortcuts
              </h2>
              <p className="text-[13.5px] sm:text-[14px] text-[#4b5563] dark:text-[#a1a1aa] leading-normal mt-1.5 font-normal">
                Quick navigation shortcuts and tips for using Sparkle
              </p>

              <div className="mt-4 space-y-3">
                <div className="space-y-1.5">
                  {shortcuts.map((sc, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-3 py-2 rounded-md bg-[#F9F9F9] dark:bg-[#2B2B2B] border border-black/[0.06] dark:border-white/[0.08] text-[13px]"
                    >
                      <span className="text-[#333333] dark:text-[#DDDDDD] font-normal">{sc.desc}</span>
                      <kbd className="px-2 py-0.5 rounded bg-black/[0.06] dark:bg-white/[0.1] font-mono text-[11px] text-[#4cc2ff] border border-black/[0.08] dark:border-white/[0.1]">
                        {sc.key}
                      </kbd>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-lg bg-[#F9F9F9] dark:bg-[#2B2B2B] border border-black/[0.06] dark:border-white/[0.08] text-[12px] text-[#555555] dark:text-[#AAAAAA] space-y-1 leading-relaxed">
                  <p className="font-semibold text-[#111827] dark:text-[#FFFFFF]">💡 Quick Tips:</p>
                  <p>• Use the Tools menu on the toolbar to import custom M3U8 streams or export playlists.</p>
                  <p>• When reading articles, Tools provides instant AI summaries and Microsoft Word (.docx) export.</p>
                </div>
              </div>
            </div>

            {/* Subtle Divider */}
            <div className="h-[1px] w-full bg-[#E5E5E5] dark:bg-[#2F2F2F]" />

            {/* Bottom Actions Footer */}
            <div className="fluent-modal-footer bg-[#F3F3F3] dark:bg-[#1C1C1C] px-6 py-3 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="fluent-btn-secondary px-4 h-8 rounded-[5px] bg-white dark:bg-[#2C2C2C] hover:bg-[#F9F9F9] dark:hover:bg-[#343434] active:bg-[#EEEEEE] dark:active:bg-[#222222] text-[#111827] dark:text-[#FFFFFF] border border-[#d1d1d1] dark:border-[#3E3E3E] text-[12.5px] font-normal shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors flex items-center justify-center cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={onClose}
                className="fluent-btn-primary px-4 h-8 rounded-[5px] bg-[#0078d4] dark:bg-[#4cc2ff] hover:bg-[#106ebe] dark:hover:bg-[#6bd0ff] active:bg-[#005a9e] dark:active:bg-[#3bb2ef] text-white dark:text-black text-[12.5px] font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-colors border border-black/15 flex items-center justify-center cursor-pointer"
              >
                Got It
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
