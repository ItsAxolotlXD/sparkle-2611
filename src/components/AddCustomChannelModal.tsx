import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, RotateCcw, Plus } from 'lucide-react';
import { Channel } from '../types';
import { modalDialogVariants, modalBackdropVariants } from '../utils/animations';

// Clean SVG default fallback logo for newly created channels
const DEFAULT_CHANNEL_LOGO = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="128" height="80" viewBox="0 0 128 80" fill="none"><rect width="128" height="80" rx="10" fill="%230078D4"/><path d="M42 26L38 18M86 26L90 18" stroke="white" stroke-width="3" stroke-linecap="round"/><rect x="28" y="24" width="72" height="42" rx="6" stroke="white" stroke-width="3"/><circle cx="56" cy="45" r="4" fill="white"/><path d="M68 38L78 45L68 52V38Z" fill="white"/></svg>';

interface AddCustomChannelModalProps {
  isOpen: boolean;
  existingCategories: string[];
  initialCategory?: string;
  onAdd: (newChannel: Channel) => void;
  onClose: () => void;
}

export const AddCustomChannelModal: React.FC<AddCustomChannelModalProps> = ({
  isOpen,
  existingCategories,
  initialCategory,
  onAdd,
  onClose,
}) => {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <AddCustomChannelModalBody
          existingCategories={existingCategories}
          initialCategory={initialCategory}
          onAdd={onAdd}
          onClose={onClose}
        />
      )}
    </AnimatePresence>,
    document.body
  );
};

const NEW_CAT_FLAG = '__NEW_CUSTOM_CATEGORY__';

const AddCustomChannelModalBody: React.FC<{
  existingCategories: string[];
  initialCategory?: string;
  onAdd: (newChannel: Channel) => void;
  onClose: () => void;
}> = ({ existingCategories, initialCategory, onAdd, onClose }) => {
  // Filter out 'All' if passed in categories
  const validCategories = existingCategories.filter((c) => c && c !== 'All');
  const defaultSelectedCat =
    initialCategory && initialCategory !== 'All' && validCategories.includes(initialCategory)
      ? initialCategory
      : validCategories[0] || 'Kênh tùy chỉnh';

  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [logo, setLogo] = useState(DEFAULT_CHANNEL_LOGO);
  const [categorySelect, setCategorySelect] = useState<string>(defaultSelectedCat);
  const [customCategoryName, setCustomCategoryName] = useState('');

  const nameInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const customCatInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const dataUrl = loadEvent.target?.result as string;
      if (dataUrl) {
        setLogo(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRestoreDefault = () => {
    setLogo(DEFAULT_CHANNEL_LOGO);
  };

  const isCreatingNewCategory = categorySelect === NEW_CAT_FLAG;
  const resolvedCategory = isCreatingNewCategory
    ? customCategoryName.trim()
    : categorySelect.trim();

  const trimmedName = name.trim();
  const trimmedUrl = url.trim();
  const isValid =
    trimmedName.length > 0 &&
    trimmedUrl.length > 0 &&
    resolvedCategory.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const slugBase = trimmedName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'custom-channel';

    const newChannel: Channel = {
      id: `custom-${timestamp}-${randomSuffix}`,
      name: trimmedName,
      slug: `${slugBase}-${randomSuffix}`,
      category: resolvedCategory,
      streamUrl: trimmedUrl,
      logo: logo.trim() || DEFAULT_CHANNEL_LOGO,
      quality: 'HD',
      isLive: true,
      currentProgram: {
        title: `${trimmedName} — Trực tiếp`,
        startTime: '00:00',
        endTime: '23:59',
        progress: 50,
        description: `Luồng phát trực tiếp kênh ${trimmedName}`,
      },
      nextProgram: {
        title: 'Chương trình tiếp theo',
        startTime: '23:59',
      },
      description: `Kênh tùy chỉnh: ${trimmedName}`,
      tags: ['Custom', resolvedCategory, trimmedName],
    };

    onAdd(newChannel);
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
        aria-label="Add custom channel"
        variants={modalDialogVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="fluent-modal-dialog relative z-10 w-full max-w-[480px] bg-white dark:bg-[#202020] rounded-[10px] overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.22),0_2px_6px_rgba(0,0,0,0.08)] dark:shadow-[0_24px_48px_rgba(0,0,0,0.7),0_2px_6px_rgba(255,255,255,0.04)] border border-black/[0.08] dark:border-white/[0.08] text-[#111827] dark:text-[#F3F4F6]"
      >
        <div className="p-6 pb-4">
          <h2 className="text-[19px] sm:text-[20px] font-semibold text-[#111827] dark:text-[#FFFFFF] tracking-tight leading-snug font-sans">
            Add custom channel
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 pb-5 pt-0.5 space-y-3.5 max-h-[75vh] overflow-y-auto no-scrollbar">
            {/* Channel brief preview badge */}
            <div className="flex items-center gap-3 p-2.5 rounded-[8px] bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.06]">
              <div className="w-14 h-9 rounded-[5px] bg-white dark:bg-[#2d2d32] border border-black/[0.08] dark:border-white/[0.08] flex items-center justify-center p-1 shrink-0 overflow-hidden">
                <img
                  key={logo}
                  src={logo || DEFAULT_CHANNEL_LOGO}
                  alt={trimmedName || 'Preview'}
                  className="max-h-full max-w-full object-contain"
                  onLoad={(e) => {
                    (e.target as HTMLElement).style.display = 'block';
                  }}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-[#111827] dark:text-white truncate">
                  {trimmedName || 'New channel'}
                </div>
                <div className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] truncate">
                  {resolvedCategory || 'Chưa chọn danh mục'} • HD
                </div>
                {logo !== DEFAULT_CHANNEL_LOGO && (
                  <div className="text-[10px] text-[#ff01ff] font-medium mt-0.5">
                    Custom logo active
                  </div>
                )}
              </div>
            </div>

            {/* Custom Logo Upload & Restore Section */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[#4B5563] dark:text-[#9CA3AF] flex items-center justify-between">
                <span>Channel logo</span>
                {logo !== DEFAULT_CHANNEL_LOGO && (
                  <span className="text-[11px] text-[#ff01ff] font-medium">Customized</span>
                )}
              </label>

              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="fluent-btn-secondary px-3 h-8 rounded-[5px] bg-white dark:bg-[#2C2C2C] hover:bg-[#F9F9F9] dark:hover:bg-[#343434] active:bg-[#EEEEEE] dark:active:bg-[#222222] text-[#111827] dark:text-[#FFFFFF] border border-[#d1d1d1] dark:border-[#3E3E3E] text-[12px] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Upload a custom logo image from your device"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload custom</span>
                </button>

                <button
                  type="button"
                  disabled={logo === DEFAULT_CHANNEL_LOGO}
                  onClick={handleRestoreDefault}
                  className="fluent-btn-secondary px-3 h-8 rounded-[5px] bg-white dark:bg-[#2C2C2C] hover:bg-[#F9F9F9] dark:hover:bg-[#343434] active:bg-[#EEEEEE] dark:active:bg-[#222222] text-[#111827] dark:text-[#FFFFFF] border border-[#d1d1d1] dark:border-[#3E3E3E] text-[12px] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Restore default channel logo"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore default</span>
                </button>
              </div>

              {/* URL or Base64 display / input */}
              <div className="fluent-input-box relative w-full h-8.5 bg-black/5 dark:bg-white/10 flex items-center px-3 rounded-[6px] transition-colors border-none backdrop-blur-[50px] focus-within:ring-2 focus-within:ring-[#0078d4] dark:focus-within:ring-[#4cc2ff] mt-1">
                <input
                  type="text"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  placeholder="Paste image URL or data:image URL"
                  spellCheck={false}
                  autoCapitalize="off"
                  autoComplete="off"
                  autoCorrect="off"
                  className="w-full bg-transparent text-xs text-[#111827] dark:text-white placeholder-[#71717a] dark:placeholder-[#9CA3AF] outline-none border-none py-1 truncate"
                />
              </div>
            </div>

            {/* Channel Category selection & creation */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[#4B5563] dark:text-[#9CA3AF] block">
                Channel category
              </label>

              <div className="fluent-input-box relative w-full h-9 bg-black/5 dark:bg-white/10 flex items-center px-3 rounded-[6px] transition-colors border-none backdrop-blur-[50px] focus-within:ring-2 focus-within:ring-[#0078d4] dark:focus-within:ring-[#4cc2ff]">
                <select
                  value={categorySelect}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCategorySelect(val);
                    if (val === NEW_CAT_FLAG) {
                      setTimeout(() => customCatInputRef.current?.focus(), 50);
                    }
                  }}
                  className="w-full bg-transparent text-xs sm:text-[13px] text-[#111827] dark:text-white outline-none border-none py-1 cursor-pointer [&>option]:bg-white [&>option]:text-black dark:[&>option]:bg-[#202020] dark:[&>option]:text-white"
                >
                  {validCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value={NEW_CAT_FLAG}>+ Create new category (Tạo danh mục mới)...</option>
                </select>
              </div>

              {/* If creating new category, show input to type category name */}
              {isCreatingNewCategory && (
                <div className="pt-1 space-y-1">
                  <div className="fluent-input-box relative w-full h-9 bg-black/5 dark:bg-white/10 flex items-center px-3.5 rounded-[6px] transition-colors border-none backdrop-blur-[50px] focus-within:ring-2 focus-within:ring-[#0078d4] dark:focus-within:ring-[#4cc2ff]">
                    <input
                      ref={customCatInputRef}
                      type="text"
                      value={customCategoryName}
                      onChange={(e) => setCustomCategoryName(e.target.value)}
                      placeholder="Enter new category name (e.g. Kênh Yêu Thích, Phim, Anime)"
                      maxLength={50}
                      spellCheck={false}
                      autoCapitalize="words"
                      autoComplete="off"
                      autoCorrect="off"
                      className="w-full bg-transparent text-xs sm:text-[13px] text-[#111827] dark:text-white placeholder-[#71717a] dark:placeholder-[#9CA3AF] outline-none border-none py-1"
                    />
                  </div>
                  <p className="text-[11px] text-[#9CA3AF] dark:text-[#71717A]">
                    This new category will appear as a new tab in the Watch page.
                  </p>
                </div>
              )}
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
              Add channel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
