import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { modalDialogVariants, modalBackdropVariants } from '../utils/animations';

interface UnderConstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  buttonText?: string;
  requirePassword?: boolean;
  expectedPassword?: string;
  onUnlockSuccess?: () => void;
}

export const UnderConstructionModal: React.FC<UnderConstructionModalProps> = ({
  isOpen,
  onClose,
  title = 'Under construction',
  description = 'This feature is working in progress and might be available in future builds.',
  buttonText = 'Understood',
  requirePassword = false,
  expectedPassword = 'camera',
  onUnlockSuccess,
}) => {
  const { settings } = useSettings();
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPasswordInput('');
      setErrorMessage('');
      setShowPassword(false);
    }
  }, [isOpen]);

  // Listen for Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!requirePassword) {
      onClose();
      return;
    }

    if (passwordInput.trim().toLowerCase() === expectedPassword.toLowerCase()) {
      setErrorMessage('');
      if (onUnlockSuccess) {
        onUnlockSuccess();
      }
      onClose();
    } else {
      setErrorMessage('Incorrect passcode. Please try again.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id="under-construction-modal-container"
          className="fixed inset-0 z-9999 flex items-center justify-center p-4 sm:p-6 select-none"
        >
          {/* 1. Backdrop / Lớp nền mờ */}
          <motion.div
            id="under-construction-modal-backdrop"
            variants={modalBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
          />

          {/* 2. Dialog Modal Box - Fluent Design ContentDialog */}
          <motion.div
            id="under-construction-modal-dialog"
            initial={modalDialogVariants.initial}
            animate={{
              ...modalDialogVariants.animate,
              x: isShaking ? [0, -6, 6, -4, 4, 0] : 0,
            }}
            exit={modalDialogVariants.exit}
            className="fluent-modal-dialog relative z-10 w-full max-w-[480px] bg-white dark:bg-[#202020] rounded-[10px] overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.22),0_2px_6px_rgba(0,0,0,0.08)] dark:shadow-[0_24px_48px_rgba(0,0,0,0.7),0_2px_6px_rgba(255,255,255,0.04)] border border-black/[0.08] dark:border-white/[0.08] text-[#111827] dark:text-[#F3F4F6]"
          >
            {/* Header & Body Content Area */}
            <form onSubmit={handleUnlock}>
              <div className="p-6 pb-5">
                <div className="flex items-center gap-2 mb-1.5">
                  <h2
                    id="under-construction-modal-title"
                    className="text-[19px] sm:text-[20px] font-semibold text-[#111827] dark:text-[#FFFFFF] tracking-tight leading-snug font-sans"
                  >
                    {title}
                  </h2>
                </div>

                <p
                  id="under-construction-modal-description"
                  className="text-[13.5px] sm:text-[14px] text-[#4b5563] dark:text-[#a1a1aa] leading-relaxed mt-1 font-normal"
                >
                  {description}
                </p>

                {requirePassword && (
                  <div className="mt-4 pt-2">
                    <label 
                      htmlFor="modal-passcode-input"
                      className="block text-[12px] font-medium text-neutral-600 dark:text-neutral-400 mb-1.5"
                    >
                      Enter developer passcode to unlock:
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3 text-neutral-400 pointer-events-none">
                        <Lock className="w-3.5 h-3.5 stroke-[1.8]" />
                      </div>
                      <input
                        id="modal-passcode-input"
                        type={showPassword ? 'text' : 'password'}
                        value={passwordInput}
                        onChange={(e) => {
                          setPasswordInput(e.target.value);
                          if (errorMessage) setErrorMessage('');
                        }}
                        autoFocus
                        placeholder="Enter passcode"
                        className="w-full h-9 pl-9 pr-9 text-[13px] bg-white dark:bg-[#2d2d2d] border border-black/15 dark:border-white/15 focus:border-[#0078d4] dark:focus:border-[#4cc2ff] rounded-[5px] text-[#111827] dark:text-white placeholder:text-neutral-400 outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors p-1 rounded"
                        title={showPassword ? 'Hide passcode' : 'Show passcode'}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {errorMessage && (
                      <div className="flex items-center gap-1.5 mt-2 text-[12px] text-red-500 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errorMessage}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Subtle Divider */}
              <div className="h-[1px] w-full bg-[#E5E5E5] dark:bg-[#2F2F2F]" />

              {/* Bottom Actions Footer */}
              <div className="fluent-modal-footer bg-[#F3F3F3] dark:bg-[#1C1C1C] px-6 py-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  id="btn-under-construction-close"
                  onClick={onClose}
                  className="px-4 h-8 rounded-[5px] bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 active:bg-black/15 text-[#111827] dark:text-white font-medium transition-colors border border-black/10 dark:border-white/10 flex items-center justify-center cursor-pointer text-[12.5px]"
                >
                  <span>{buttonText}</span>
                </button>

                {requirePassword && (
                  <button
                    type="submit"
                    id="btn-under-construction-unlock"
                    className="fluent-btn-primary px-4 h-8 rounded-[5px] bg-[#0078d4] dark:bg-[#4cc2ff] hover:bg-[#106ebe] dark:hover:bg-[#6bd0ff] active:bg-[#005a9e] dark:active:bg-[#3bb2ef] text-white dark:text-black font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-colors border border-black/20 flex items-center justify-center cursor-pointer text-[12.5px]"
                  >
                    <span>Unlock</span>
                  </button>
                )}
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
