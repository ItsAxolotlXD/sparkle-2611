import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { modalDialogVariants, modalBackdropVariants } from '../utils/animations';

interface DiscordWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DiscordWelcomeModal: React.FC<DiscordWelcomeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const handleJoin = () => {
    window.open('https://discord.gg/wcdjaDDayK', '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id="discord-welcome-container"
          className="fixed inset-0 z-9999 flex items-center justify-center p-4 sm:p-6"
        >
          {/* 1. Backdrop / Lớp nền mờ */}
          <motion.div
            id="discord-welcome-backdrop"
            variants={modalBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
          />

          {/* 2. Dialog Modal Box - Fluent Design ContentDialog */}
          <motion.div
            id="discord-welcome-dialog"
            variants={modalDialogVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fluent-modal-dialog relative z-10 w-full max-w-[480px] bg-white dark:bg-[#202020] rounded-[10px] overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.22),0_2px_6px_rgba(0,0,0,0.08)] dark:shadow-[0_24px_48px_rgba(0,0,0,0.7),0_2px_6px_rgba(255,255,255,0.04)] select-none border border-black/[0.08] dark:border-white/[0.08] text-[#111827] dark:text-[#F3F4F6]"
          >
            {/* Header & Body Content Area */}
            <div className="p-6 pb-5">
              <h2
                id="discord-welcome-title"
                className="text-[19px] sm:text-[20px] font-semibold text-[#111827] dark:text-[#FFFFFF] tracking-tight leading-snug font-sans"
              >
                Welcome to Sparkle Community
              </h2>

              <p
                id="discord-welcome-subtitle"
                className="text-[13.5px] sm:text-[14px] text-[#4b5563] dark:text-[#a1a1aa] leading-relaxed mt-2.5 font-normal"
              >
                Join our Discord server to connect with broadcasting enthusiasts, share media recordings, and preserve iconic moments of Vietnamese television.
              </p>
            </div>

            {/* Subtle Divider */}
            <div className="h-[1px] w-full bg-[#E5E5E5] dark:bg-[#2F2F2F]" />

            {/* Bottom Actions Footer */}
            <div className="fluent-modal-footer bg-[#F3F3F3] dark:bg-[#1C1C1C] px-6 py-3 flex items-center justify-end gap-2.5">
              <button
                type="button"
                id="btn-discord-close"
                onClick={onClose}
                className="fluent-btn-secondary px-4 h-8 rounded-[5px] bg-white dark:bg-[#2C2C2C] hover:bg-[#F9F9F9] dark:hover:bg-[#343434] active:bg-[#EEEEEE] dark:active:bg-[#222222] text-[#111827] dark:text-[#FFFFFF] border border-[#d1d1d1] dark:border-[#3E3E3E] text-[12.5px] font-normal shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors flex items-center justify-center cursor-pointer"
              >
                Not Now
              </button>
              <button
                type="button"
                id="btn-discord-join"
                onClick={handleJoin}
                className="fluent-btn-primary px-4 h-8 rounded-[5px] bg-[#5865F2] hover:bg-[#4752C4] active:bg-[#3C45A5] text-white text-[12.5px] font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-colors border border-[#4752C4] flex items-center justify-center cursor-pointer"
              >
                Join Discord
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
