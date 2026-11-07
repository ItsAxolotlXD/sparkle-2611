import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SpinningRing, SPINNING_RING_GIF_URL } from './SpinningRing';
import { modalDialogVariants, modalBackdropVariants } from '../utils/animations';

interface VelocityActivationModalProps {
  isOpen: boolean;
  onComplete: () => void;
  featureName?: string;
}

export const VelocityActivationModal: React.FC<VelocityActivationModalProps> = ({
  isOpen,
  onComplete,
  featureName = 'velocity features',
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(5);

  useEffect(() => {
    if (!isOpen) return;
    setSecondsRemaining(5);

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    const timer = setTimeout(() => {
      onComplete();
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [isOpen, onComplete]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id="velocity-activation-modal-container"
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 select-none"
        >
          {/* Backdrop */}
          <motion.div
            id="velocity-activation-backdrop"
            variants={modalBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* WinUI 3 ContentDialog */}
          <motion.div
            id="velocity-activation-dialog"
            variants={modalDialogVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fluent-modal-dialog relative z-10 w-full max-w-[420px] bg-[#f9f9f9] dark:bg-[#202020] rounded-[8px] overflow-hidden shadow-[0_24px_54px_rgba(0,0,0,0.35)] dark:shadow-[0_28px_64px_rgba(0,0,0,0.8)] border border-black/[0.1] dark:border-white/[0.1] text-[#111827] dark:text-[#F3F4F6] p-6 sm:p-7 flex flex-col items-center text-center"
          >
            {/* WinUI 3 GIF Loading Throbber */}
            <div className="mb-4 flex items-center justify-center">
              <SpinningRing size={52} strokeWidth={3} ariaLabel="Loading..." />
            </div>

            {/* Title */}
            <h2
              id="velocity-activation-title"
              className="text-[17px] sm:text-[18px] font-semibold text-[#111827] dark:text-white tracking-tight leading-snug font-sans mb-2"
            >
              Activating velocity features
            </h2>

            {/* Subtext */}
            <p
              id="velocity-activation-description"
              className="text-[13px] leading-relaxed text-[#6B7280] dark:text-[#9CA3AF] max-w-[340px]"
            >
              Activating velocity features. This might take a several minutes...
            </p>

            {/* Subtle Progress Bar */}
            <div className="w-full mt-5 bg-black/5 dark:bg-white/10 h-[3px] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#0078d4] dark:bg-[#4cc2ff] rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 5, ease: 'linear' }}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
