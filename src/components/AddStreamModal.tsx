import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Radio, Play } from 'lucide-react';
import { Channel } from '../types';
import { useSettings } from '../hooks/useSettings';
import { modalDialogVariants, modalBackdropVariants } from '../utils/animations';

interface AddStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStream: (channel: Channel) => void;
}

export const AddStreamModal: React.FC<AddStreamModalProps> = ({
  isOpen,
  onClose,
  onAddStream
}) => {
  const { settings } = useSettings();
  const shouldAnimate = !settings.reduceAllMotion && settings.animateModals;
  const [streamName, setStreamName] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [streamQuality, setStreamQuality] = useState<'HD' | 'Full HD' | '4K' | 'SD'>('HD');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamUrl.trim()) return;

    const name = streamName.trim() || 'Custom Live Stream';
    const newChannel: Channel = {
      id: `custom-stream-${Date.now()}`,
      name: name,
      shortName: name,
      slug: `custom-${Date.now()}`,
      logo: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=200&auto=format&fit=crop&q=80',
      category: 'Special',
      quality: streamQuality,
      streamUrl: streamUrl.trim(),
      isLive: true,
      description: 'User-added live broadcast stream.',
      currentProgram: {
        title: name,
        startTime: '00:00',
        endTime: '24:00',
        progress: 50,
        description: 'Streaming via HLS M3U8 protocol.'
      }
    };

    onAddStream(newChannel);
    setStreamName('');
    setStreamUrl('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id="add-stream-modal-container"
          className="fixed inset-0 z-9999 flex items-center justify-center p-4 sm:p-6 select-none"
        >
          {/* 1. Backdrop / Lớp nền mờ */}
          <motion.div
            id="add-stream-backdrop"
            variants={modalBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
          />

          {/* 2. Dialog Modal Box - Fluent Design ContentDialog */}
          <motion.div
            id="add-stream-dialog"
            variants={modalDialogVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fluent-modal-dialog relative z-10 w-full max-w-[480px] bg-white dark:bg-[#202020] rounded-[10px] overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.22),0_2px_6px_rgba(0,0,0,0.08)] dark:shadow-[0_24px_48px_rgba(0,0,0,0.7),0_2px_6px_rgba(255,255,255,0.04)] border border-black/[0.08] dark:border-white/[0.08] text-[#111827] dark:text-[#F3F4F6]"
          >
            {/* Header & Body Content Area */}
            <form onSubmit={handleSubmit}>
              <div className="p-6 pb-5 space-y-4">
                <div>
                  <h2 className="text-[19px] sm:text-[20px] font-semibold text-[#111827] dark:text-[#FFFFFF] tracking-tight leading-snug font-sans">
                    Add New Live Stream
                  </h2>
                  <p className="text-[13.5px] sm:text-[14px] text-[#4b5563] dark:text-[#a1a1aa] leading-normal mt-1.5 font-normal">
                    Enter HLS / M3U8 stream details to watch directly
                  </p>
                </div>

                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-[13px] font-medium text-[#333333] dark:text-[#DDDDDD] mb-1">
                      Stream Name <span className="text-[#4cc2ff]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={streamName}
                      onChange={(e) => setStreamName(e.target.value)}
                      placeholder="e.g., Live Broadcast Feed"
                      className="w-full h-8 sm:h-8.5 px-3 rounded-[6px] bg-black/5 dark:bg-[#282c31] border border-black/10 dark:border-white/10 text-xs sm:text-[13px] text-[#111827] dark:text-white placeholder-[#71717a] dark:placeholder-white outline-none focus:border-b-2 focus:border-b-[#005fb8] dark:focus:border-b-[#4cc2ff] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-[#333333] dark:text-[#DDDDDD] mb-1">
                      Stream URL (.m3u8) <span className="text-[#4cc2ff]">*</span>
                    </label>
                    <input
                      type="url"
                      required
                      value={streamUrl}
                      onChange={(e) => setStreamUrl(e.target.value)}
                      placeholder="https://example.com/live/stream.m3u8"
                      className="w-full h-8 sm:h-8.5 px-3 rounded-[6px] bg-black/5 dark:bg-[#282c31] border border-black/10 dark:border-white/10 text-xs sm:text-[13px] text-[#111827] dark:text-white placeholder-[#71717a] dark:placeholder-white font-mono outline-none focus:border-b-2 focus:border-b-[#005fb8] dark:focus:border-b-[#4cc2ff] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-[#333333] dark:text-[#DDDDDD] mb-1.5">
                      Quality
                    </label>
                    <div className="flex gap-2">
                      {(['SD', 'HD', 'Full HD', '4K'] as const).map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => setStreamQuality(q)}
                          className={`flex-1 py-1.5 rounded-[4px] text-xs font-semibold transition-all cursor-default border ${
                            streamQuality === q
                              ? 'bg-[#4cc2ff] text-black border-black/20 shadow-sm'
                              : 'bg-white dark:bg-[#2B2B2B] text-[#555555] dark:text-[#AAAAAA] hover:text-[#111827] dark:hover:text-[#FFFFFF] border-[#d1d1d1] dark:border-[#3E3E3E]'
                          }`}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
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
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-add-stream-submit"
                  className="fluent-btn-primary px-4 h-8 rounded-[5px] bg-[#0078d4] dark:bg-[#4cc2ff] hover:bg-[#106ebe] dark:hover:bg-[#6bd0ff] active:bg-[#005a9e] dark:active:bg-[#3bb2ef] text-white dark:text-black font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-colors border border-black/20 flex items-center justify-center cursor-pointer gap-1.5 text-[12.5px]"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span className="font-semibold">Play Stream</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
