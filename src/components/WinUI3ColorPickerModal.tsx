import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Palette, Check, Pipette } from 'lucide-react';
import { modalDialogVariants, modalBackdropVariants } from '../utils/animations';

export type ColorTarget = 'note' | 'text' | 'highlight';

interface WinUI3ColorPickerModalProps {
  isOpen: boolean;
  initialColor?: string;
  defaultTarget?: ColorTarget;
  onApply: (color: string, target: ColorTarget) => void;
  onClose: () => void;
}

const FLUENT_ACCENTS = [
  { name: 'Sky Blue', hex: '#4cc2ff' },
  { name: 'Windows Blue', hex: '#0078d4' },
  { name: 'Royal Blue', hex: '#005fb8' },
  { name: 'Teal', hex: '#0099bc' },
  { name: 'Cyan', hex: '#00bcf2' },
  { name: 'Emerald', hex: '#107c41' },
  { name: 'Green', hex: '#13a10e' },
  { name: 'Lime', hex: '#22b14c' },
  { name: 'Crimson', hex: '#c42b1c' },
  { name: 'Coral Red', hex: '#e81123' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Tangerine', hex: '#ff7f27' },
  { name: 'Gold', hex: '#ffb900' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Purple', hex: '#881798' },
  { name: 'Violet', hex: '#7057ff' },
  { name: 'Magenta', hex: '#e3008c' },
  { name: 'Lavender', hex: '#b146c2' },
];

const PASTEL_PALETTE = [
  { name: 'Canary Yellow', hex: '#fff176' },
  { name: 'Peach', hex: '#ffb4a2' },
  { name: 'Mint Breeze', hex: '#bbf7d0' },
  { name: 'Sky Whisper', hex: '#bae6fd' },
  { name: 'Lilac', hex: '#e9d5ff' },
  { name: 'Blush Pink', hex: '#fbcfe8' },
];

const MONO_PALETTE = [
  '#000000', '#1f2937', '#4b5563', '#6b7280', '#9ca3af', '#d1d5db', '#f3f4f6', '#ffffff'
];

export const WinUI3ColorPickerModal: React.FC<WinUI3ColorPickerModalProps> = ({
  isOpen,
  initialColor = '#0078d4',
  defaultTarget = 'note',
  onApply,
  onClose,
}) => {
  const [selectedColor, setSelectedColor] = useState<string>(initialColor);
  const [customHex, setCustomHex] = useState<string>(initialColor);
  const [target, setTarget] = useState<ColorTarget>(defaultTarget);

  useEffect(() => {
    if (isOpen) {
      setSelectedColor(initialColor);
      setCustomHex(initialColor);
      setTarget(defaultTarget);
    }
  }, [isOpen, initialColor, defaultTarget]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter') {
        onApply(selectedColor, target);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, selectedColor, target, onApply, onClose]);

  const handleSelectColor = (hex: string) => {
    setSelectedColor(hex);
    setCustomHex(hex);
  };

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomHex(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val) || /^#[0-9A-Fa-f]{3}$/.test(val)) {
      setSelectedColor(val);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 select-none">
          {/* Backdrop smoke overlay */}
          <motion.div
            variants={modalBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={onClose}
          />

          {/* Modal Window Frame */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Color Picker"
            variants={modalDialogVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fluent-modal-dialog relative z-10 w-full max-w-[460px] bg-white dark:bg-[#202020] rounded-[10px] overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.22),0_2px_6px_rgba(0,0,0,0.08)] dark:shadow-[0_24px_48px_rgba(0,0,0,0.7),0_2px_6px_rgba(255,255,255,0.04)] border border-black/[0.08] dark:border-white/[0.08] text-[#111827] dark:text-[#F3F4F6]"
          >
          {/* Header */}
          <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[6px] bg-[#0078d4]/10 dark:bg-[#4cc2ff]/15 text-[#0078d4] dark:text-[#4cc2ff] flex items-center justify-center">
                <Palette className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-[17px] font-semibold text-[#111827] dark:text-[#FFFFFF] tracking-tight leading-snug font-sans">
                  Choose Color
                </h2>
                <p className="text-xs text-[#6b7280] dark:text-[#9ca3af]">
                  Fluent palette & custom spectrum
                </p>
              </div>
            </div>

            {/* Target Tab Switcher */}
            <div className="flex items-center bg-black/5 dark:bg-white/5 p-0.5 rounded-[6px] text-xs font-medium">
              <button
                type="button"
                onClick={() => setTarget('note')}
                className={`px-2.5 py-1 rounded-[4px] transition-all cursor-pointer ${
                  target === 'note'
                    ? 'bg-white dark:bg-[#333333] text-[#0078d4] dark:text-[#4cc2ff] font-semibold shadow-xs'
                    : 'text-[#6b7280] dark:text-[#9ca3af] hover:text-[#111827] dark:hover:text-white'
                }`}
              >
                Note
              </button>
              <button
                type="button"
                onClick={() => setTarget('text')}
                className={`px-2.5 py-1 rounded-[4px] transition-all cursor-pointer ${
                  target === 'text'
                    ? 'bg-white dark:bg-[#333333] text-[#0078d4] dark:text-[#4cc2ff] font-semibold shadow-xs'
                    : 'text-[#6b7280] dark:text-[#9ca3af] hover:text-[#111827] dark:hover:text-white'
                }`}
              >
                Text
              </button>
              <button
                type="button"
                onClick={() => setTarget('highlight')}
                className={`px-2.5 py-1 rounded-[4px] transition-all cursor-pointer ${
                  target === 'highlight'
                    ? 'bg-white dark:bg-[#333333] text-[#0078d4] dark:text-[#4cc2ff] font-semibold shadow-xs'
                    : 'text-[#6b7280] dark:text-[#9ca3af] hover:text-[#111827] dark:hover:text-white'
                }`}
              >
                Highlight
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            {/* Color Preview & Hex Input Row */}
            <div className="flex items-center gap-3 p-2.5 rounded-[8px] bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06]">
              {/* Swatch */}
              <div
                className="w-12 h-12 rounded-[6px] border border-black/15 dark:border-white/20 shadow-inner shrink-0 relative overflow-hidden"
                style={{ backgroundColor: selectedColor }}
              >
                {/* HTML5 Native Color Picker click overlay */}
                <input
                  type="color"
                  value={selectedColor.startsWith('#') && selectedColor.length === 7 ? selectedColor : '#0078d4'}
                  onChange={(e) => handleSelectColor(e.target.value)}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                  title="Pick custom color"
                />
              </div>

              {/* Info & Hex Input */}
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-[#6b7280] dark:text-[#9ca3af] mb-1 flex items-center justify-between">
                  <span>Hex Color Code</span>
                  <label className="flex items-center gap-1 text-[11px] text-[#0078d4] dark:text-[#4cc2ff] cursor-pointer hover:underline">
                    <Pipette className="w-3 h-3" />
                    <span>Custom picker</span>
                    <input
                      type="color"
                      value={selectedColor.startsWith('#') && selectedColor.length === 7 ? selectedColor : '#0078d4'}
                      onChange={(e) => handleSelectColor(e.target.value)}
                      className="sr-only"
                    />
                  </label>
                </div>
                <input
                  type="text"
                  value={customHex}
                  onChange={handleHexChange}
                  placeholder="#0078D4"
                  className="w-full h-8 px-2.5 font-mono text-xs rounded-[4px] border border-black/15 dark:border-white/15 bg-white dark:bg-[#1a1a1a] text-[#111827] dark:text-white outline-none focus:border-[#0078d4] dark:focus:border-[#4cc2ff]"
                />
              </div>
            </div>

            {/* Windows Accent Colors */}
            <div>
              <div className="text-xs font-semibold text-[#111827] dark:text-white mb-2">
                Windows Accent Colors
              </div>
              <div className="grid grid-cols-6 sm:grid-cols-9 gap-1.5">
                {FLUENT_ACCENTS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => handleSelectColor(c.hex)}
                    className="w-full aspect-square rounded-[5px] border border-black/15 dark:border-white/20 transition-all flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 shadow-2xs"
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  >
                    {selectedColor.toLowerCase() === c.hex.toLowerCase() && (
                      <Check className="w-3.5 h-3.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] stroke-[2.5]" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Sticky Pastels */}
            <div>
              <div className="text-xs font-semibold text-[#111827] dark:text-white mb-2">
                Note & Highlighter Pastels
              </div>
              <div className="grid grid-cols-6 gap-2">
                {PASTEL_PALETTE.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => handleSelectColor(c.hex)}
                    className="h-7 rounded-[5px] border border-black/15 dark:border-white/20 transition-all flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 shadow-2xs"
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  >
                    {selectedColor.toLowerCase() === c.hex.toLowerCase() && (
                      <Check className="w-3.5 h-3.5 text-black/80 stroke-[2.5]" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Monochrome Grayscale */}
            <div>
              <div className="text-xs font-semibold text-[#111827] dark:text-white mb-2">
                Monochrome & Neutral
              </div>
              <div className="grid grid-cols-8 gap-1.5">
                {MONO_PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleSelectColor(c)}
                    className="w-full aspect-square rounded-[5px] border border-black/15 dark:border-white/20 transition-all flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 shadow-2xs"
                    style={{ backgroundColor: c }}
                    title={c}
                  >
                    {selectedColor.toLowerCase() === c.toLowerCase() && (
                      <Check
                        className={`w-3.5 h-3.5 stroke-[2.5] ${
                          c === '#ffffff' || c === '#f3f4f6' || c === '#d1d5db'
                            ? 'text-black'
                            : 'text-white'
                        }`}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer with standard WinUI 3 buttons */}
          <div className="fluent-modal-footer bg-[#F3F3F3] dark:bg-[#1C1C1C] px-6 py-3 flex items-center justify-end gap-2.5 border-t border-[#E5E5E5] dark:border-[#2F2F2F]">
            <button
              type="button"
              onClick={onClose}
              className="fluent-btn-secondary px-4 h-8 rounded-[5px] bg-white dark:bg-[#2C2C2C] hover:bg-[#F9F9F9] dark:hover:bg-[#343434] active:bg-[#EEEEEE] dark:active:bg-[#222222] text-[#111827] dark:text-[#FFFFFF] border border-[#d1d1d1] dark:border-[#3E3E3E] text-[12.5px] font-normal shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors flex items-center justify-center cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onApply(selectedColor, target)}
              className="fluent-btn-primary px-4 h-8 rounded-[5px] bg-[#0078d4] dark:bg-[#4cc2ff] hover:bg-[#106ebe] dark:hover:bg-[#6bd0ff] active:bg-[#005a9e] dark:active:bg-[#3bb2ef] text-white dark:text-black font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-colors border border-black/20 flex items-center justify-center cursor-pointer text-[12.5px]"
            >
              Apply Color
            </button>
          </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
