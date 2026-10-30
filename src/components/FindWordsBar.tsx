import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronUp, ChevronDown, X } from 'lucide-react';
import { FluentSearchIcon } from './FluentIcons';

interface FindWordsBarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FindWordsBar: React.FC<FindWordsBarProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    } else {
      clearHighlights();
      setSearchTerm('');
      setMatchCount(0);
      setCurrentMatchIndex(0);
    }
  }, [isOpen]);

  const clearHighlights = () => {
    const marks = document.querySelectorAll('mark.vplay-search-highlight');
    marks.forEach((mark) => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
        parent.normalize();
      }
    });
  };

  const highlightText = (term: string) => {
    clearHighlights();
    if (!term.trim() || term.length < 2) {
      setMatchCount(0);
      setCurrentMatchIndex(0);
      return;
    }

    const container = document.querySelector('article') || document.querySelector('main');
    if (!container) return;

    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    let count = 0;

    const walk = (node: Node) => {
      if (node.nodeType === 3) {
        // Text node
        const text = node.nodeValue;
        if (text && regex.test(text)) {
          const span = document.createElement('span');
          span.innerHTML = text.replace(regex, '<mark class="vplay-search-highlight bg-amber-400 text-black px-1 py-0.5 rounded font-bold shadow-sm">$1</mark>');
          node.parentNode?.replaceChild(span, node);
        }
      } else if (node.nodeType === 1 && node.nodeName !== 'SCRIPT' && node.nodeName !== 'STYLE' && node.nodeName !== 'INPUT') {
        Array.from(node.childNodes).forEach(walk);
      }
    };

    walk(container);

    const highlights = document.querySelectorAll('mark.vplay-search-highlight');
    setMatchCount(highlights.length);
    if (highlights.length > 0) {
      setCurrentMatchIndex(1);
      scrollToMatch(0, highlights);
    } else {
      setCurrentMatchIndex(0);
    }
  };

  const scrollToMatch = (index: number, markList?: NodeListOf<Element>) => {
    const marks = markList || document.querySelectorAll('mark.vplay-search-highlight');
    if (marks.length === 0) return;

    marks.forEach((m, idx) => {
      if (idx === index) {
        m.classList.add('ring-2', 'ring-[#4cc2ff]', 'bg-[#4cc2ff]', 'text-black');
        m.classList.remove('bg-amber-400', 'text-black');
        m.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        m.classList.remove('ring-2', 'ring-[#4cc2ff]', 'bg-[#4cc2ff]', 'text-black');
        m.classList.add('bg-amber-400', 'text-black');
      }
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    highlightText(val);
  };

  const handleNext = () => {
    if (matchCount === 0) return;
    const nextIndex = currentMatchIndex >= matchCount ? 1 : currentMatchIndex + 1;
    setCurrentMatchIndex(nextIndex);
    scrollToMatch(nextIndex - 1);
  };

  const handlePrev = () => {
    if (matchCount === 0) return;
    const prevIndex = currentMatchIndex <= 1 ? matchCount : currentMatchIndex - 1;
    setCurrentMatchIndex(prevIndex);
    scrollToMatch(prevIndex - 1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) handlePrev();
      else handleNext();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="find-words-bar"
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed top-20 right-6 sm:right-10 z-50 flex items-center gap-2 p-2 rounded-[8px] bg-white/90 dark:bg-[#1b1f24]/90 backdrop-blur-2xl border border-black/10 dark:border-white/10 shadow-2xl text-[#111827] dark:text-white"
        >
          <div className="group relative h-[35px] sm:h-[37px] flex items-center gap-2 px-3 rounded-[6px] bg-black/5 dark:bg-[#282c31] border-0 focus-within:ring-2 focus-within:ring-[#005fb8] dark:focus-within:ring-[#4cc2ff] transition-all">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              placeholder="Find in article..."
              className="w-36 sm:w-52 bg-transparent text-xs sm:text-[13px] text-[#111827] dark:text-white placeholder-[#71717a] dark:placeholder-white outline-none border-none py-1 no-fluent-line"
            />
            {searchTerm && (
              <span className="text-[11px] font-mono text-[#71717a] dark:text-white/80 whitespace-nowrap">
                {matchCount > 0 ? `${currentMatchIndex}/${matchCount}` : '0/0'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrev}
              disabled={matchCount === 0}
              aria-label="Previous match (Shift+Enter)"
              className="p-1.5 rounded-lg bg-[#27121d] hover:bg-[#331726] disabled:opacity-40 disabled:hover:bg-[#27121d] text-white cursor-default"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={matchCount === 0}
              aria-label="Next match (Enter)"
              className="p-1.5 rounded-lg bg-[#27121d] hover:bg-[#331726] disabled:opacity-40 disabled:hover:bg-[#27121d] text-white cursor-default"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close search (Esc)"
              className="p-1.5 rounded-lg bg-[#27121d] hover:bg-[#331726] text-[#9CA3AF] hover:text-white cursor-default ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
