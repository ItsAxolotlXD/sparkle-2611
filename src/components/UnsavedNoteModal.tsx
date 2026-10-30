import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from '../hooks/useSettings';
import { modalDialogVariants, modalBackdropVariants } from '../utils/animations';

interface UnsavedNoteModalProps {
  isOpen: boolean;
  noteTitle: string;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

export const UnsavedNoteModal: React.FC<UnsavedNoteModalProps> = ({
  isOpen,
  noteTitle,
  onSave,
  onDiscard,
  onCancel,
}) => {
  const { settings } = useSettings();

  // Listen for Escape key to cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  const displayTitle = noteTitle?.trim() || 'Untitled note';

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          key="unsaved-note-modal-container"
          id="unsaved-note-modal-container"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 select-none"
        >
          {/* Backdrop */}
          <motion.div
            key="unsaved-note-modal-backdrop"
            id="unsaved-note-modal-backdrop"
            variants={modalBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onCancel}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
          />

          {/* Dialog Modal Box - WinUI 3 Fluent ContentDialog */}
          <motion.div
            key="unsaved-note-modal-dialog"
            id="unsaved-note-modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="unsaved-note-modal-title"
            variants={modalDialogVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fluent-modal-dialog relative z-10 w-full max-w-[460px] bg-white dark:bg-[#202020] rounded-[10px] overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.22),0_2px_6px_rgba(0,0,0,0.08)] dark:shadow-[0_24px_48px_rgba(0,0,0,0.7),0_2px_6px_rgba(255,255,255,0.04)] border border-black/[0.08] dark:border-white/[0.08] text-[#111827] dark:text-[#F3F4F6]"
          >
            {/* Header & Body Content */}
            <div className="p-6 pb-5">
              <h2
                id="unsaved-note-modal-title"
                className="text-[19px] sm:text-[20px] font-semibold text-[#111827] dark:text-[#FFFFFF] tracking-tight leading-snug font-sans"
              >
                Save your changes?
              </h2>

              <p
                id="unsaved-note-modal-description"
                className="text-[13.5px] sm:text-[14px] text-[#4b5563] dark:text-[#a1a1aa] leading-relaxed mt-2.5 font-normal"
              >
                &ldquo;{displayTitle}&rdquo; is not saved yet. Any unsaved edits will be lost if you leave without saving. Do you want to save them now?
              </p>
            </div>

            {/* Subtle Divider */}
            <div className="h-[1px] w-full bg-[#E5E5E5] dark:bg-[#2F2F2F]" />

            {/* Footer Actions: Button colored (Save) & Button not colored (Discard) */}
            <div className="fluent-modal-footer px-6 py-4 bg-[#F8F9FA] dark:bg-[#262626] flex items-center justify-end gap-3">
              <button
                type="button"
                id="unsaved-note-discard-btn"
                onClick={onDiscard}
                className="fluent-btn-secondary px-5 py-2 rounded-[6px] text-[13px] font-medium text-[#1F2937] dark:text-[#E5E7EB] bg-white dark:bg-[#323232] hover:bg-[#F3F4F6] dark:hover:bg-[#3B3B3B] border border-black/15 dark:border-white/15 transition-all duration-150 cursor-pointer shadow-xs active:scale-[0.98]"
              >
                Discard
              </button>

              <button
                type="button"
                id="unsaved-note-save-btn"
                onClick={onSave}
                style={{
                  backgroundColor: settings.accentColor || '#0078d4',
                  color: '#ffffff'
                }}
                className="fluent-btn-primary px-5 py-2 rounded-[6px] text-[13px] font-medium hover:opacity-90 active:scale-[0.98] transition-all duration-150 shadow-xs cursor-pointer"
              >
                Save
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
