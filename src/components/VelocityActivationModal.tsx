import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SpinningRing } from './SpinningRing';

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
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      onComplete();
    }, 5000);

    return () => {
      clearTimeout(timer);
    };
  }, [isOpen, onComplete]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="velocity-activation-modal-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[2147483647] w-screen h-screen flex flex-col items-center justify-center bg-[#f9f9f9] dark:bg-[#202020] text-[#111827] dark:text-[#F3F4F6] p-6 select-none"
        >
          {/* WinUI 3 GIF Loading Throbber */}
          <div className="mb-5 flex items-center justify-center">
            <SpinningRing size={56} strokeWidth={3} ariaLabel="Loading..." />
          </div>

          {/* Title */}
          <h2
            id="velocity-activation-title"
            className="text-[19px] sm:text-[21px] font-semibold text-[#111827] dark:text-white tracking-tight leading-snug font-sans mb-2 text-center"
          >
            Activating velocity features
          </h2>

          {/* Subtext */}
          <p
            id="velocity-activation-description"
            className="text-[13px] sm:text-[14px] leading-relaxed text-[#6B7280] dark:text-[#9CA3AF] max-w-[380px] text-center"
          >
            Activating velocity features. This might take a several minutes...
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
