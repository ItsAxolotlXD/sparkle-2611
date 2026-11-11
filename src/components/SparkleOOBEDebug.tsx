import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Bug,
  ChevronRight,
  Clock,
  FlaskConical,
  SkipForward,
  Volume2,
  VolumeX,
  Accessibility,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { SPINNING_RING_GIF_URL } from './SpinningRing';
import { FluentHourglassArtwork } from './SparkleOOBE';
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
      className="group flex w-full items-center gap-3.5 rounded-[15px] border border-black/[0.08] bg-white/90 p-3 sm:p-3.5 text-left transition-all hover:border-black/15 hover:bg-neutral-50/80 active:bg-neutral-100/90 shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0067b8]"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-[15px] bg-[#0067b8]/10 text-[#0067b8] transition-colors group-hover:bg-[#0067b8]/15 group-hover:text-[#005a9e]">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold text-neutral-900 sm:text-sm">{title}</span>
        <span id={descriptionId} className="mt-0.5 block text-[11.5px] leading-relaxed text-neutral-500 sm:text-xs">
          {description}
        </span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-neutral-400 transition-transform group-hover:translate-x-0.5 group-hover:text-neutral-700" aria-hidden="true" />
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
  const [isMuted, setIsMuted] = useState(false);
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

  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      className="fixed inset-0 z-[999999] flex flex-col items-center justify-start sm:justify-center p-2 sm:p-4 md:p-6 overflow-y-auto overflow-x-hidden"
      style={{
        backgroundImage: "url('/assets/aistudio/pink-nature-landscape-with-vegetation-flora_8a81cb83.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        fontFamily: "'Segoe UI Variable Display', 'Segoe UI Variable Text', 'Segoe UI', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Centered WinUI 3 Window (Identical to Setup Window OOBE) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[820px] min-h-[410px] max-h-[86vh] md:h-[450px] rounded-[15px] bg-white/95 backdrop-blur-2xl border border-black/[0.08] shadow-[0_24px_70px_rgba(0,0,0,0.18)] flex flex-col md:flex-row overflow-hidden my-auto shrink-0"
        aria-hidden={isPasscodeDialogOpen}
      >
        {/* Back Button in Top-Left inside window */}
        {!isMomentPreviewOpen && (
          <div className="absolute top-4 left-4 z-20">
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to setup"
              className="w-8 h-8 rounded-[7px] flex items-center justify-center text-neutral-600 hover:text-neutral-900 hover:bg-black/5 active:bg-black/10 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content with Fade Animation */}
        <AnimatePresence mode="wait">
          {isMomentPreviewOpen ? (
            /* JUST A MOMENT SCREEN SPLIT INTO 2 PARTS */
            <motion.div
              key="debug-just-a-moment-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="w-full h-full flex flex-col md:flex-row overflow-hidden"
            >
              {/* LEFT PART: Fluent Hourglass Icon */}
              <div className="w-full md:w-[38%] bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#edf2f7] border-b md:border-b-0 md:border-r border-black/[0.06] flex items-center justify-center p-4 md:p-6 shrink-0 relative overflow-hidden select-none">
                <div className="absolute inset-0 bg-radial from-blue-500/10 via-transparent to-transparent pointer-events-none" />
                <FluentHourglassArtwork />
              </div>

              {/* RIGHT PART: Loading GIF and "Just a moment..." text (reduced text size) */}
              <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-6 md:p-8 bg-white select-none text-center">
                <div className="flex flex-col items-center justify-center text-center">
                  <div
                    aria-hidden="true"
                    className="w-12 h-12 bg-[#0067b8]"
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
                  <span 
                    className="mt-4 text-[16px] sm:text-[17px] font-normal tracking-wide text-neutral-800"
                    style={{ fontWeight: 400 }}
                  >
                    Just a moment...
                  </span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="debug-content-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="w-full h-full flex flex-col md:flex-row overflow-hidden"
            >
              {/* LEFT COLUMN: 3D Fluent Artwork (Bug & Diagnostic emblem) */}
              <div className="w-full md:w-[38%] bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#edf2f7] border-b md:border-b-0 md:border-r border-black/[0.06] flex items-center justify-center p-4 md:p-6 shrink-0 relative overflow-hidden select-none">
                <div className="absolute inset-0 bg-radial from-blue-500/10 via-transparent to-transparent pointer-events-none" />
                <div className="flex flex-col items-center justify-center text-center">
                  <svg viewBox="0 0 240 240" fill="none" className="w-[155px] h-[155px] drop-shadow-md">
                    <defs>
                      <linearGradient id="debug_shield_grad" x1="50" y1="40" x2="190" y2="190" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#38bdf8" />
                        <stop offset="50%" stopColor="#0284c7" />
                        <stop offset="100%" stopColor="#0369a1" />
                      </linearGradient>
                      <linearGradient id="debug_chip_grad" x1="80" y1="80" x2="160" y2="160" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="100%" stopColor="#e2e8f0" />
                      </linearGradient>
                    </defs>
                    {/* Hexagonal / Shield container */}
                    <path
                      d="M120 35L190 75V145L120 185L50 145V75L120 35Z"
                      fill="url(#debug_shield_grad)"
                    />
                    {/* Inner Diagnostic Chip */}
                    <rect x="85" y="85" width="70" height="70" rx="15" fill="url(#debug_chip_grad)" stroke="#cbd5e1" strokeWidth="2" />
                    {/* Bug Silhouette */}
                    <path
                      d="M120 98C114 98 110 102 110 106C110 107.5 110.8 109 112 110C107.5 112.5 105 117 105 122V128C105 136 112 142 120 142C128 142 135 136 135 128V122C135 117 132.5 112.5 128 110C129.2 109 130 107.5 130 106C130 102 126 98 120 98Z"
                      fill="#0284c7"
                    />
                    <line x1="97" y1="116" x2="105" y2="119" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" />
                    <line x1="95" y1="126" x2="105" y2="126" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" />
                    <line x1="97" y1="136" x2="105" y2="133" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" />
                    <line x1="143" y1="116" x2="135" y2="119" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" />
                    <line x1="145" y1="126" x2="135" y2="126" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" />
                    <line x1="143" y1="136" x2="135" y2="133" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  <div className="mt-2 text-xs font-medium text-neutral-500">
                    Sparkle Developer Diagnostics
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Interactive Debug Options */}
              <div className="flex-1 min-h-0 flex flex-col justify-between p-4 sm:p-6 md:p-7 bg-white overflow-y-auto">
                <div>
                  <h1 className="text-[22px] sm:text-[26px] font-semibold text-[#111827] leading-tight">
                    Developer options
                  </h1>
                  <p className="text-[12.5px] sm:text-[13.5px] text-neutral-600 mt-1 leading-normal">
                    Test setup screens, skip installation, or open developer tools in Sparkle.
                  </p>

                  <ul className="mt-4 flex flex-col gap-2.5">
                    <DebugAction
                      icon={<SkipForward className="size-4" aria-hidden="true" />}
                      title="Skip installation process"
                      description="Finish setup and enter Sparkle without completing remaining steps."
                      descriptionId="debug-skip-description"
                      onClick={openPasscodeDialog}
                    />
                    <DebugAction
                      icon={<Clock className="size-4" aria-hidden="true" />}
                      title={'Test "Just a moment" screen'}
                      description="Preview the loading state centered inside the setup window."
                      descriptionId="debug-moment-description"
                      onClick={() => setIsMomentPreviewOpen(true)}
                    />
                    <DebugAction
                      icon={<FlaskConical className="size-4" aria-hidden="true" />}
                      title="Open Velocity Features"
                      description="Close setup and open experimental features in Settings."
                      descriptionId="debug-insider-description"
                      onClick={onOpenInsiderExperiments}
                    />
                  </ul>
                </div>

                <div className="flex items-center justify-between gap-3 mt-6 pt-3.5 border-t border-neutral-200">
                  {/* WinUI 3 Secondary Button */}
                  <button
                    type="button"
                    onClick={onBack}
                    className="h-8 px-5 rounded-[7px] font-normal text-[#1b1b1b] bg-[#fbfbfb] hover:bg-[#f5f5f5] active:bg-[#eaeaea] border border-black/10 border-b-[2px] border-b-black/20 shadow-[0_1px_2px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.8)] active:shadow-none transition-all text-xs sm:text-[13px] flex items-center justify-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0067b8]"
                  >
                    Back to setup
                  </button>
                  <span className="text-[11px] font-medium tracking-wide text-neutral-400 uppercase select-none">
                    Debug Mode
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Windows 11 Bottom Right Tray (BÊN NGOÀI window oobe) */}
      <div className="absolute bottom-4 right-6 z-30 flex items-center gap-2 select-none">
        {/* Debug Button (Icon only, NO tooltip title, NO text title) */}
        <button
          type="button"
          onClick={() => {}}
          aria-label="Debug"
          className="w-8 h-8 rounded-[7px] flex items-center justify-center text-neutral-700 bg-white/75 hover:bg-white/95 active:bg-white backdrop-blur-md border border-black/[0.08] shadow-xs transition-colors cursor-pointer"
        >
          <Bug className="h-4 w-4" aria-hidden="true" />
        </button>

        {/* Volume Button */}
        <button
          type="button"
          onClick={() => setIsMuted(!isMuted)}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
          className="w-8 h-8 rounded-[7px] flex items-center justify-center text-neutral-700 bg-white/75 hover:bg-white/95 active:bg-white backdrop-blur-md border border-black/[0.08] shadow-xs transition-colors cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Accessibility Button */}
        <button
          type="button"
          aria-label="Accessibility"
          className="w-8 h-8 rounded-[7px] flex items-center justify-center text-neutral-700 bg-white/75 hover:bg-white/95 active:bg-white backdrop-blur-md border border-black/[0.08] shadow-xs transition-colors cursor-pointer"
        >
          <Accessibility className="w-4 h-4" />
        </button>

        {/* Clock */}
        <div className="h-8 px-2.5 rounded-[7px] flex items-center justify-center text-neutral-700 text-xs font-normal bg-white/75 backdrop-blur-md border border-black/[0.08] shadow-xs cursor-default">
          <span className="tracking-wide">{timeString}</span>
        </div>
      </div>

      {/* Developer Passcode Dialog (WinUI 3 ContentDialog in Light Mode) */}
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
              className="fixed inset-0 cursor-default border-0 bg-black/35 p-0 backdrop-blur-[2px]"
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
              className="relative z-10 w-full max-w-[440px] overflow-hidden rounded-[15px] border border-black/[0.08] bg-white/95 backdrop-blur-2xl text-neutral-900 shadow-[0_24px_50px_rgba(0,0,0,0.2)]"
              style={{ fontFamily: "'Segoe UI Variable Text', 'Segoe UI', system-ui, sans-serif" }}
            >
              <form onSubmit={handlePasscodeSubmit}>
                <div className="p-6 pb-5">
                  <h2 id="developer-passcode-title" className="text-[18px] font-semibold leading-snug tracking-tight text-neutral-900 sm:text-[19px]">
                    Developer passcode
                  </h2>
                  <p id="developer-passcode-description" className="mt-1.5 text-xs sm:text-[13px] leading-relaxed text-neutral-600">
                    You will need a developer passcode to access this feature
                  </p>

                  <div className="mt-4">
                    <label htmlFor="developer-passcode-input" className="mb-1.5 block text-xs font-medium text-neutral-800">
                      Passcode
                    </label>
                    {/* WinUI 3 TextBox */}
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
                      className="w-full h-8 px-3 rounded-[15px] bg-white border border-black/10 border-b-[2px] border-b-black/45 focus:border-b-[#0067b8] text-xs sm:text-[13px] text-[#1b1b1b] placeholder:text-neutral-400 outline-none shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors"
                    />
                    {passcodeError && (
                      <p id="developer-passcode-error" role="alert" className="mt-2 text-xs text-rose-500 font-medium">
                        {passcodeError}
                      </p>
                    )}
                  </div>
                </div>

                <div className="h-px w-full bg-neutral-200" />
                <div className="flex items-center justify-end gap-2.5 bg-neutral-50/80 px-6 py-3">
                  {/* WinUI 3 Secondary Button */}
                  <button
                    type="button"
                    onClick={closePasscodeDialog}
                    className="h-8 px-4 rounded-[7px] font-normal text-[#1b1b1b] bg-[#fbfbfb] hover:bg-[#f5f5f5] active:bg-[#eaeaea] border border-black/10 border-b-[2px] border-b-black/20 shadow-[0_1px_2px_rgba(0,0,0,0.05)] text-xs sm:text-[13px] transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  {/* WinUI 3 Primary Button */}
                  <button
                    type="submit"
                    className="h-8 px-5 rounded-[7px] font-normal text-white bg-[#0067b8] hover:bg-[#1879c7] active:bg-[#005a9e] border border-black/10 border-b-[2px] border-b-black/30 shadow-[0_1px_2px_rgba(0,0,0,0.12)] text-xs sm:text-[13px] transition-all cursor-pointer"
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

export default SparkleOOBEDebug;
