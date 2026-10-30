import React, { useEffect, useId, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ChevronDown } from 'lucide-react';

export interface FlyoutDropdownOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

interface FlyoutDropdownProps<T extends string> {
  value: T;
  options: FlyoutDropdownOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  id?: string;
}

export const flyoutPanelClassName =
  'bg-white/70 dark:bg-[#1c1c1c]/70 border border-black/10 dark:border-white/10 rounded-[10px] p-1.5 space-y-0.5 text-[#111827] dark:text-white select-none';

export const flyoutPanelStyle: React.CSSProperties = {
  backdropFilter: 'blur(32px) saturate(180%)',
  WebkitBackdropFilter: 'blur(32px) saturate(180%)',
  boxShadow: '0 16px 40px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.1)',
};

export function FlyoutDropdown<T extends string>({ value, options, onChange, ariaLabel, id }: FlyoutDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!isOpen) return;
    const handlePointer = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setIsOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('pointerdown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => setIsOpen((v) => !v)}
        className="h-8 min-w-[132px] px-3 rounded-[6px] flex items-center justify-between gap-2 text-[13px] font-medium bg-black/5 dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] border border-black/10 dark:border-white/10 text-[#111827] dark:text-white transition-colors cursor-pointer"
      >
        <span className="truncate">{current.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            id={listId}
            role="listbox"
            aria-label={ariaLabel}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute right-0 top-full mt-1.5 z-50 w-[200px] ${flyoutPanelClassName}`}
            style={flyoutPanelStyle}
          >
            {options.map((option, idx) => {
              const isActive = option.value === value;
              return (
                <motion.li
                  key={option.value}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: {
                      duration: 0.28,
                      delay: Math.min(idx * 0.03, 0.22),
                      ease: [0.16, 1, 0.3, 1],
                    },
                  }}
                >
                  <button
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className="w-full h-[36px] px-3 rounded-[6px] flex items-center gap-3 text-[13px] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] active:bg-black/[0.08] dark:active:bg-white/[0.12] transition-colors cursor-pointer text-left"
                  >
                    <span className="w-4 h-4 flex items-center justify-center shrink-0 text-[#0078d4] dark:text-[#4cc2ff]">
                      {isActive && <Check className="w-4 h-4" />}
                    </span>
                    <span className="font-medium truncate flex-1">{option.label}</span>
                    {option.hint && <span className="text-[11px] text-neutral-500 dark:text-neutral-400">{option.hint}</span>}
                  </button>
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
