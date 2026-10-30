import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, Radio, FileText, CheckCircle2, AlertCircle, Copy } from 'lucide-react';
import { FluentArrowUploadIcon } from './FluentIcons';
import { parseM3UPlaylist, SAMPLE_M3U_TEMPLATE } from '../utils/m3uParser';
import { Channel } from '../types';
import { useSettings } from '../hooks/useSettings';
import { modalDialogVariants, modalBackdropVariants } from '../utils/animations';

interface CustomStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayCustomChannel: (channel: Channel) => void;
  onImportPlaylist: (newChannels: Channel[]) => void;
}

export const CustomStreamModal: React.FC<CustomStreamModalProps> = ({
  isOpen,
  onClose,
  onPlayCustomChannel,
  onImportPlaylist
}) => {
  const { settings } = useSettings();
  const shouldAnimate = !settings.reduceAllMotion && settings.animateModals;
  const [activeTab, setActiveTab] = useState<'single' | 'playlist'>('single');
  const [streamUrl, setStreamUrl] = useState('');
  const [channelName, setChannelName] = useState('Custom Live Stream');
  const [playlistText, setPlaylistText] = useState('');
  const [parseStatus, setParseStatus] = useState<string | null>(null);

  const handlePlaySingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamUrl.trim()) return;

    const customChannel: Channel = {
      id: `custom-${Date.now()}`,
      name: channelName.trim() || 'Custom M3U8 Stream',
      shortName: channelName.trim() || 'Custom Stream',
      slug: `custom-${Date.now()}`,
      logo: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=200&auto=format&fit=crop&q=80',
      category: 'Special',
      quality: 'HD',
      streamUrl: streamUrl.trim(),
      isLive: true,
      description: 'Stream configured by user.',
      currentProgram: {
        title: channelName.trim() || 'Custom Live Stream',
        startTime: '00:00',
        endTime: '24:00',
        progress: 50,
        description: 'Streaming live via HLS/M3U8 protocol.'
      }
    };

    onPlayCustomChannel(customChannel);
    onClose();
  };

  const handleImportM3U = () => {
    if (!playlistText.trim()) return;
    try {
      const parsed = parseM3UPlaylist(playlistText);
      if (parsed.length === 0) {
        setParseStatus('No valid channels found in the M3U playlist content.');
        return;
      }

      const fullChannels: Channel[] = parsed.map((p, idx) => ({
        id: p.id || `m3u-${Date.now()}-${idx}`,
        name: p.name || `Channel ${idx + 1}`,
        shortName: p.name || `Channel ${idx + 1}`,
        slug: p.slug || `m3u-ch-${idx + 1}`,
        logo: p.logo || 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=200&auto=format&fit=crop&q=80',
        category: p.category || 'Special',
        quality: p.quality || 'HD',
        streamUrl: p.streamUrl || '',
        isLive: true,
        description: p.description || 'Channel imported from external M3U playlist.',
        currentProgram: p.currentProgram || {
          title: p.name || 'Live Program',
          startTime: '00:00',
          endTime: '24:00',
          progress: 50,
          description: 'Live broadcast.'
        }
      }));

      onImportPlaylist(fullChannels);
      setParseStatus(`Successfully imported ${fullChannels.length} channels!`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setParseStatus('Failed to parse M3U playlist. Please check format.');
    }
  };

  const handleLoadSample = () => {
    setPlaylistText(SAMPLE_M3U_TEMPLATE);
    setParseStatus('Sample playlist loaded. Click "Import Playlist" to load channels.');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id="custom-stream-modal-container"
          className="fixed inset-0 z-9999 flex items-center justify-center p-4 sm:p-6 select-none"
        >
          {/* 1. Backdrop / Lớp nền mờ */}
          <motion.div 
            id="custom-stream-backdrop"
            variants={modalBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={onClose}
          />

          {/* 2. Dialog Modal Box - Fluent Design ContentDialog */}
          <motion.div 
            id="custom-stream-dialog"
            variants={modalDialogVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fluent-modal-dialog relative z-10 w-full max-w-[480px] bg-white dark:bg-[#202020] rounded-[10px] overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.22),0_2px_6px_rgba(0,0,0,0.08)] dark:shadow-[0_24px_48px_rgba(0,0,0,0.7),0_2px_6px_rgba(255,255,255,0.04)] border border-black/[0.08] dark:border-white/[0.08] text-[#111827] dark:text-[#F3F4F6]"
          >
            {/* Header Area */}
            <div className="p-6 pb-3">
              <h2 className="text-[19px] sm:text-[20px] font-semibold text-[#111827] dark:text-[#FFFFFF] tracking-tight leading-snug font-sans">
                Configure M3U8 Stream & Playlist
              </h2>
              <p className="text-[13.5px] sm:text-[14px] text-[#4b5563] dark:text-[#a1a1aa] leading-normal mt-1.5 font-normal">
                Paste a direct HLS stream URL or import an external .m3u playlist
              </p>

              {/* Fluent Tab Bar */}
              <div className="flex p-1 mt-4 rounded-md bg-[#F4F4F4] dark:bg-[#2B2B2B] border border-black/[0.06] dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setActiveTab('single')}
                  className={`flex-1 py-1.5 rounded-[4px] text-xs font-medium transition-all cursor-default ${
                    activeTab === 'single'
                      ? 'bg-white dark:bg-[#383838] text-[#111827] dark:text-[#FFFFFF] shadow-sm font-semibold'
                      : 'text-[#666666] dark:text-[#AAAAAA] hover:text-[#111827] dark:hover:text-[#FFFFFF]'
                  }`}
                >
                  Direct Stream (.m3u8)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('playlist')}
                  className={`flex-1 py-1.5 rounded-[4px] text-xs font-medium transition-all cursor-default ${
                    activeTab === 'playlist'
                      ? 'bg-white dark:bg-[#383838] text-[#111827] dark:text-[#FFFFFF] shadow-sm font-semibold'
                      : 'text-[#666666] dark:text-[#AAAAAA] hover:text-[#111827] dark:hover:text-[#FFFFFF]'
                  }`}
                >
                  Import Playlist (.m3u)
                </button>
              </div>
            </div>

            {/* Form Body */}
            <div className="px-6 pb-5 pt-1">
              {activeTab === 'single' ? (
                <form id="form-single-stream" onSubmit={handlePlaySingle} className="space-y-3.5">
                  <div>
                    <label className="block text-[13px] font-medium text-[#333333] dark:text-[#DDDDDD] mb-1">
                      Channel / Stream Title
                    </label>
                    <input
                      type="text"
                      value={channelName}
                      onChange={(e) => setChannelName(e.target.value)}
                      placeholder="e.g., Live Sports Feed"
                      className="w-full h-8 sm:h-8.5 px-3 rounded-[6px] bg-black/5 dark:bg-[#282c31] border border-black/10 dark:border-white/10 text-xs sm:text-[13px] text-[#111827] dark:text-white placeholder-[#71717a] dark:placeholder-white outline-none focus:border-b-2 focus:border-b-[#005fb8] dark:focus:border-b-[#4cc2ff] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-[#333333] dark:text-[#DDDDDD] mb-1">
                      HLS Stream URL (.m3u8) <span className="text-[#4cc2ff]">*</span>
                    </label>
                    <input
                      type="url"
                      required
                      value={streamUrl}
                      onChange={(e) => setStreamUrl(e.target.value)}
                      placeholder="https://example.com/live/channel.m3u8"
                      className="w-full h-8 sm:h-8.5 px-3 rounded-[6px] bg-black/5 dark:bg-[#282c31] border border-black/10 dark:border-white/10 text-xs sm:text-[13px] text-[#111827] dark:text-white placeholder-[#71717a] dark:placeholder-white font-mono outline-none focus:border-b-2 focus:border-b-[#005fb8] dark:focus:border-b-[#4cc2ff] transition-all"
                    />
                  </div>

                  {/* Sample test streams buttons */}
                  <div>
                    <span className="text-[11px] font-medium text-[#666666] dark:text-[#AAAAAA] block mb-1.5">
                      Sample test streams:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setStreamUrl('https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
                          setChannelName('Mux HLS Test Multi-Rate');
                        }}
                        className="px-2.5 py-1 rounded-[4px] bg-[#F4F4F4] dark:bg-[#2B2B2B] text-[11px] text-[#333333] dark:text-[#DDDDDD] hover:bg-[#EAEAEA] dark:hover:bg-[#383838] border border-black/[0.08] dark:border-white/[0.1] cursor-default"
                      >
                        Mux HLS HD
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setStreamUrl('https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8');
                          setChannelName('Akamai Live Master HLS');
                        }}
                        className="px-2.5 py-1 rounded-[4px] bg-[#F4F4F4] dark:bg-[#2B2B2B] text-[11px] text-[#333333] dark:text-[#DDDDDD] hover:bg-[#EAEAEA] dark:hover:bg-[#383838] border border-black/[0.08] dark:border-white/[0.1] cursor-default"
                      >
                        Akamai Live HD
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[13px] font-medium text-[#333333] dark:text-[#DDDDDD]">
                        Paste #EXTM3U Playlist Content
                      </label>
                      <button
                        type="button"
                        onClick={handleLoadSample}
                        className="text-[11px] text-[#4cc2ff] hover:underline cursor-default font-medium"
                      >
                        Load sample playlist
                      </button>
                    </div>
                    <textarea
                      rows={5}
                      value={playlistText}
                      onChange={(e) => setPlaylistText(e.target.value)}
                      placeholder={`#EXTM3U\n#EXTINF:-1 tvg-id="vtv1" tvg-name="VTV1 HD" group-title="VTV", VTV1 HD\nhttps://example.com/vtv1.m3u8`}
                      className="w-full p-2.5 rounded-[4px] bg-[#F9F9F9] dark:bg-[#2B2B2B] border border-black/[0.12] dark:border-white/[0.12] border-b-2 border-b-[#888888] dark:border-b-[#777777] text-[#111827] dark:text-[#FFFFFF] placeholder:text-[#888888] text-xs font-mono focus:outline-none focus:border-b-[#4cc2ff] focus:border-b-2 resize-none"
                    />
                  </div>

                  {parseStatus && (
                    <div className="p-2.5 rounded-md bg-[#F4F4F4] dark:bg-[#2B2B2B] border border-black/[0.08] dark:border-white/[0.08] text-xs flex items-center gap-2 text-[#111827] dark:text-[#FFFFFF]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{parseStatus}</span>
                    </div>
                  )}
                </div>
              )}
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
              {activeTab === 'single' ? (
                <button
                  type="submit"
                  form="form-single-stream"
                  className="fluent-btn-primary px-4 h-8 rounded-[5px] bg-[#0078d4] dark:bg-[#4cc2ff] hover:bg-[#106ebe] dark:hover:bg-[#6bd0ff] active:bg-[#005a9e] dark:active:bg-[#3bb2ef] text-white dark:text-black font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-colors border border-black/20 flex items-center justify-center cursor-pointer gap-1.5 text-[12.5px]"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span className="font-semibold">Play Stream</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleImportM3U}
                  className="fluent-btn-primary px-4 h-8 rounded-[5px] bg-[#0078d4] dark:bg-[#4cc2ff] hover:bg-[#106ebe] dark:hover:bg-[#6bd0ff] active:bg-[#005a9e] dark:active:bg-[#3bb2ef] text-white dark:text-black font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-colors border border-black/20 flex items-center justify-center cursor-pointer gap-1.5 text-[12.5px]"
                >
                  <FluentArrowUploadIcon className="w-3.5 h-3.5" />
                  <span className="font-semibold">Import Playlist</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
