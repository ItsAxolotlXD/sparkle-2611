import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Channel } from '../types';
import { modalDialogVariants, modalBackdropVariants } from '../utils/animations';

export interface ChannelUpdates {
  name: string;
  streamUrl: string;
}

interface EditChannelModalProps {
  isOpen: boolean;
  channel: Channel | null;
  onSave: (channelId: string, updates: ChannelUpdates) => void;
  onClose: () => void;
}

export const EditChannelModal: React.FC<EditChannelModalProps> = ({
  isOpen,
  channel,
  onSave,
  onClose,
}) => {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && channel && (
        <EditChannelModalBody
          channel={channel}
          onSave={onSave}
          onClose={onClose}
        />
      )}
    </AnimatePresence>,
    document.body
  );
};

const EditChannelModalBody: React.FC<{
  channel: Channel;
  onSave: (channelId: string, updates: ChannelUpdates) => void;
  onClose: () => void;
}> = ({ channel, onSave, onClose }) => {
  const [name, setName] = useState(channel.name || '');
  const [url, setUrl] = useState(channel.streamUrl || '');
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    nameInputRef.current?.focus();
    nameInputRef.current?.select();
  }, []);

  const trimmedName = name.trim();
  const trimmedUrl = url.trim();
  const isValid = trimmedName.length > 0 && trimmedUrl.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onSave(channel.id, {
      name: trimmedName,
      streamUrl: trimmedUrl,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[2147483647] flex items-center justify-center p-4 sm:p-6 select-none">
      <motion.div
        variants={modalBackdropVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-xs"
        onClick={onClose}
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Edit channel info"
        variants={modalDialogVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="fluent-modal-dialog relative z-10 w-full max-w-[480px] bg-white dark:bg-[#202020] rounded-[10px] overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.22),0_2px_6px_rgba(0,0,0,0.08)] dark:shadow-[0_24px_48px_rgba(0,0,0,0.7),0_2px_6px_rgba(255,255,255,0.04)] border border-black/[0.08] dark:border-white/[0.08] text-[#111827] dark:text-[#F3F4F6]"
      >
        <div className="p-6 pb-4">
          <h2 className="text-[19px] sm:text-[20px] font-semibold text-[#111827] dark:text-[#FFFFFF] tracking-tight leading-snug font-sans">
            Edit channel info
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 pb-5 pt-0.5 space-y-3.5">
            {/* Channel brief preview badge */}
            <div className="flex items-center gap-3 p-2.5 rounded-[8px] bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.06]">
              <div className="w-12 h-8 rounded-[5px] bg-white dark:bg-[#2d2d32] border border-black/[0.08] dark:border-white/[0.08] flex items-center justify-center p-1 shrink-0 overflow-hidden">
                <img
                  src={channel.logo}
                  alt={channel.name}
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-[#111827] dark:text-white truncate">
                  {trimmedName || channel.name}
                </div>
                <div className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] truncate">
                  {channel.category} {channel.quality ? `• ${channel.quality}` : ''}
                </div>
              </div>
            </div>

            {/* Channel Name input field */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[#4B5563] dark:text-[#9CA3AF] block">
                Channel name
              </label>
              <div className="fluent-input-box relative w-full h-9 bg-black/5 dark:bg-white/10 flex items-center px-3.5 rounded-[6px] transition-colors border-none backdrop-blur-[50px] focus-within:ring-2 focus-within:ring-[#0078d4] dark:focus-within:ring-[#4cc2ff]">
                <input
                  ref={nameInputRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter channel name"
                  maxLength={80}
                  spellCheck={false}
                  autoCapitalize="words"
                  autoComplete="off"
                  autoCorrect="off"
                  className="w-full bg-transparent text-xs sm:text-[13px] text-[#111827] dark:text-white placeholder-[#71717a] dark:placeholder-[#9CA3AF] outline-none border-none py-1"
                />
              </div>
            </div>

            {/* URL input field */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[#4B5563] dark:text-[#9CA3AF] block">
                Stream URL (HLS / M3U8 / MP4)
              </label>
              <div className="fluent-input-box relative w-full h-9 bg-black/5 dark:bg-white/10 flex items-center px-3.5 rounded-[6px] transition-colors border-none backdrop-blur-[50px] focus-within:ring-2 focus-within:ring-[#0078d4] dark:focus-within:ring-[#4cc2ff]">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/stream.m3u8"
                  spellCheck={false}
                  autoCapitalize="off"
                  autoComplete="off"
                  autoCorrect="off"
                  className="w-full bg-transparent text-xs sm:text-[13px] text-[#111827] dark:text-white placeholder-[#71717a] dark:placeholder-[#9CA3AF] outline-none border-none py-1"
                />
              </div>
              <p className="text-[11px] text-[#9CA3AF] dark:text-[#71717A]">
                Enter a direct playable video stream link for this broadcast channel.
              </p>
            </div>
          </div>

          {/* WinUI 3 Dialog Footer */}
          <div className="fluent-modal-footer bg-[#F3F3F3] dark:bg-[#1C1C1C] px-6 py-3 flex items-center justify-end gap-2.5 border-t border-[#E5E5E5] dark:border-[#2F2F2F]">
            <button
              type="button"
              onClick={onClose}
              className="fluent-btn-secondary px-4 h-8 rounded-[5px] bg-white dark:bg-[#2C2C2C] hover:bg-[#F9F9F9] dark:hover:bg-[#343434] active:bg-[#EEEEEE] dark:active:bg-[#222222] text-[#111827] dark:text-[#FFFFFF] border border-[#d1d1d1] dark:border-[#3E3E3E] text-[12.5px] font-normal shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors flex items-center justify-center cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className="fluent-btn-primary px-4 h-8 rounded-[5px] bg-[#0078d4] dark:bg-[#4cc2ff] hover:bg-[#106ebe] dark:hover:bg-[#6bd0ff] active:bg-[#005a9e] dark:active:bg-[#3bb2ef] text-white dark:text-black font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-colors border border-black/20 flex items-center justify-center cursor-pointer text-[12.5px] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
