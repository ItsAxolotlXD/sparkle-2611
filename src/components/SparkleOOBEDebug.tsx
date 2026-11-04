import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Bug,
  ChevronRight,
  Clock,
  FlaskConical,
  SkipForward,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { SPINNING_RING_GIF_URL } from './SpinningRing';
import { modalBackdropVariants, modalDialogVariants } from '../utils/animations';

interface SparkleOOBEDebugProps {
  onBack: () => void;
  onSkipInstallation: () => void;
  onOpenInsiderExperiments: () => void;
}

interface DebugActionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  descriptionId: string;
}

const DEVELOPER_PASSCODE = 'oobeskip';

const DebugAction: React.FC<DebugActionProps> = ({
  icon,
  title,
  description,
  onClick,
  descriptionId,
}) => (
  <li>
    <button
      type="button"
      onClick={onClick}
      aria-describedby={descriptionId}
      className="group flex w-full items-center gap-3 rounded-[8px] border border-white/[0.08] bg-white/[0.035] p-3.5 text-left transition-colors hover:border-white/15 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4cc2ff] sm:p-4"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-[7px] bg-white/[0.07] text-white/75 transition-colors group-hover:bg-white/[0.12] group-hover:text-white">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-medium text-white sm:text-sm">{title}</span>
        <span id={descriptionId} className="mt-1 block text-[11.5px] leading-relaxed text-white/55 sm:text-xs">
          {description}
        </span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-white/35 transition-transform group-hover:translate-x-0.5 group-hover:text-white/70" aria-hidden="true" />
    </button>
  </li>
);

export const SparkleOOBEDebug: React.FC<SparkleOOBEDebugProps> = ({
  onBack,
  onSkipInstallation,
  onOpenInsiderExperiments,
}) => {
  const [isPasscodeDialogOpen, setIsPasscodeDialogOpen] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [isMomentPreviewOpen, setIsMomentPreviewOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMomentPreviewOpen) return;

    const timer = window.setTimeout(() => setIsMomentPreviewOpen(false), 5000);
    return () => window.clearTimeout(timer);
  }, [isMomentPreviewOpen]);

  const openPasscodeDialog = () => {
    setPasscode('');
    setPasscodeError('');
    setIsPasscodeDialogOpen(true);
  };

  const closePasscodeDialog = () => {
    setIsPasscodeDialogOpen(false);
    setPasscode('');
    setPasscodeError('');
  };

  const handlePasscodeSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (passcode !== DEVELOPER_PASSCODE) {
      setPasscodeError('The developer passcode is incorrect. Try again.');
      return;
    }

    closePasscodeDialog();
    onSkipInstallation();
  };

  const handleDialogKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closePasscodeDialog();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
      'input:not([disabled]), button:not([disabled])'
    );
    if (!focusableElements?.length) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  if (isMomentPreviewOpen) {
    return (
      <div
        className="fixed inset-0 z-[999999] flex select-none flex-col items-center justify-center bg-[#0b0f17]"
        style={{
          background: 'radial-gradient(circle at 50% 40%, #151c28 0%, #0d121c 50%, #06090e 100%)',
          fontFamily: "'Segoe UI Variable Display', 'Segoe UI Variable Text', 'Segoe UI', system-ui, sans-serif",
        }}
      >
        <div role="status" aria-live="polite" className="flex flex-col items-center gap-6">
          <div
            aria-hidden="true"
            className="h-20 w-20 bg-white"
            style={{
              WebkitMaskImage: `url("${SPINNING_RING_GIF_URL}")`,
              maskImage: `url("${SPINNING_RING_GIF_URL}")`,
              WebkitMaskSize: 'contain',
              maskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
              maskPosition: 'center',
            }}
          />
          <span className="text-xl font-normal tracking-wide text-white sm:text-2xl">
            Just a moment...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center overflow-y-auto bg-[#090d14] p-3 dark sm:p-5"
      style={{
        background: 'radial-gradient(circle at 50% 30%, #171f2e 0%, #0d121c 60%, #06080e 100%)',
        fontFamily: "'Segoe UI Variable Display', 'Segoe UI Variable Text', 'Segoe UI', system-ui, -apple-system, sans-serif",
      }}
    >
      <motion.main
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex max-h-[88vh] min-h-[400px] w-full max-w-[760px] flex-col overflow-hidden rounded-[14px] border border-white/10 bg-[#1d222b]/95 shadow-[0_24px_70px_rgba(0,0,0,0.7)] backdrop-blur-2xl sm:rounded-[18px]"
        aria-hidden={isPasscodeDialogOpen}
      >
        <header className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-3.5 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-[8px] bg-white/[0.08] text-white">
              <Bug className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[9px] font-semibold tracking-[0.16em] text-white/45">SPARKLE OOBE</p>
              <h1 className="text-lg font-semibold leading-tight text-white sm:text-xl">Debug</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="flex shrink-0 items-center gap-1.5 rounded-[5px] px-2.5 py-2 text-[11px] text-white/70 transition-colors hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4cc2ff] sm:px-3 sm:text-xs"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            <span>Back to setup</span>
          </button>
        </header>

        <section className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
          <h2 className="text-[21px] font-semibold leading-tight text-white sm:text-[24px]">Developer options</h2>
          <p className="mt-1.5 max-w-[520px] text-xs leading-relaxed text-white/55 sm:text-[13px]">
            Test setup screens or open a development area in Sparkle.
          </p>

          <ul className="mt-5 flex flex-col gap-2.5 sm:mt-6 sm:gap-3">
            <DebugAction
              icon={<SkipForward className="size-[18px]" aria-hidden="true" />}
              title="Skip installation process"
              description="Finish setup and enter Sparkle without completing the remaining steps."
              descriptionId="debug-skip-description"
              onClick={openPasscodeDialog}
            />
            <DebugAction
              icon={<Clock className="size-[18px]" aria-hidden="true" />}
              title={'Test "Just a moment" screen'}
              description="Preview the full-screen loading state used during setup."
              descriptionId="debug-moment-description"
              onClick={() => setIsMomentPreviewOpen(true)}
            />
            <DebugAction
              icon={<FlaskConical className="size-[18px]" aria-hidden="true" />}
              title="Open Insider experiments"
              description="Close setup and open Insider experiments in Settings."
              descriptionId="debug-insider-description"
              onClick={onOpenInsiderExperiments}
            />
          </ul>
        </section>

        <footer className="flex items-center justify-between gap-3 border-t border-white/[0.08] bg-black/10 px-4 py-3 sm:px-6">
          <p className="text-[10px] leading-relaxed text-white/40 sm:text-[11px]">
            Developer tools for the Sparkle setup experience.
          </p>
          <span className="shrink-0 rounded-full border border-white/10 px-2 py-1 text-[9px] font-medium tracking-[0.12em] text-white/45">
            DEBUG MODE
          </span>
        </footer>
      </motion.main>

      <AnimatePresence>
        {isPasscodeDialogOpen && (
          <div
            key="developer-passcode-container"
            className="fixed inset-0 z-[1000000] flex items-center justify-center p-4 sm:p-6"
            onKeyDown={handleDialogKeyDown}
          >
            <motion.button
              type="button"
              aria-label="Close developer passcode dialog"
              variants={modalBackdropVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={closePasscodeDialog}
              className="fixed inset-0 cursor-default border-0 bg-black/65 p-0 backdrop-blur-[2px]"
            />
            <motion.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="developer-passcode-title"
              aria-describedby="developer-passcode-description"
              variants={modalDialogVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="fluent-modal-dialog relative z-10 w-full max-w-[480px] overflow-hidden rounded-[6px] border border-white/[0.06] bg-[#202020] text-[#f3f4f6] shadow-[0_24px_48px_rgba(0,0,0,0.7)]"
              style={{ fontFamily: "'Segoe UI Variable Text', 'Segoe UI', system-ui, sans-serif" }}
            >
              <form onSubmit={handlePasscodeSubmit}>
                <div className="p-6 pb-5">
                  <h2 id="developer-passcode-title" className="text-[19px] font-semibold leading-snug tracking-tight text-white sm:text-[20px]">
                    Developer passcode
                  </h2>
                  <p id="developer-passcode-description" className="mt-2.5 text-[13.5px] leading-relaxed text-[#a1a1aa] sm:text-[14px]">
                    You will need a developer passcode to access this feature
                  </p>

                  <div className="mt-4">
                    <label htmlFor="developer-passcode-input" className="mb-1.5 block text-xs text-white/80">
                      Passcode
                    </label>
                    <div className="fluent-input-box relative flex h-9 w-full items-center rounded-[6px] bg-[#282c31] px-3.5 transition-colors">
                      <input
                        id="developer-passcode-input"
                        autoFocus
                        type="password"
                        value={passcode}
                        onChange={(event) => {
                          setPasscode(event.target.value);
                          setPasscodeError('');
                        }}
                        onKeyDown={(event) => {
                          if (event.key !== 'Enter') return;
                          if (event.nativeEvent.isComposing || event.keyCode === 229) return;
                          event.preventDefault();
                          event.currentTarget.form?.requestSubmit();
                        }}
                        autoComplete="off"
                        spellCheck={false}
                        aria-invalid={Boolean(passcodeError)}
                        aria-describedby={passcodeError ? 'developer-passcode-error' : undefined}
                        placeholder="Enter developer passcode"
                        className="w-full border-none bg-transparent py-1 text-xs text-white outline-none placeholder:text-white/35 sm:text-[13px]"
                      />
                    </div>
                    {passcodeError && (
                      <p id="developer-passcode-error" role="alert" className="mt-2 text-xs text-red-400">
                        {passcodeError}
                      </p>
                    )}
                  </div>
                </div>

                <div className="h-px w-full bg-white/[0.08]" />
                <div className="fluent-modal-footer flex items-center justify-end gap-2.5 bg-[#1c1c1c] px-6 py-3">
                  <button
                    type="button"
                    onClick={closePasscodeDialog}
                    className="fluent-btn-secondary h-8 rounded-[6px] bg-[#2c2c2c] px-4 text-[12.5px] text-white transition-colors hover:bg-[#343434]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="fluent-btn-primary h-8 rounded-[6px] bg-[#4cc2ff] px-4 text-[12.5px] font-semibold text-black transition-colors hover:bg-[#6bd0ff]"
                  >
                    Continue
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
