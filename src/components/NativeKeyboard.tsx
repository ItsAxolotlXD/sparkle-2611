import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Delete, Smile, ArrowBigUp, X, Check, Globe, Keyboard, ClipboardList, Copy, Mic, Search, Plus } from 'lucide-react';
import { FluentDeleteIcon, FluentSearchIcon } from './FluentIcons';
import { motion, AnimatePresence } from 'motion/react';
import { flyoutPanelClassName, flyoutPanelStyle } from './FlyoutDropdown';
import { useNativeKeyboard } from '../context/NativeKeyboardContext';
import { useSettings } from '../hooks/useSettings';
import { keyboardSound } from '../utils/keyboardSound';
import { VietnameseInputMethod } from '../utils/vietnameseIME';
import {
  getClipboardHistory,
  addClipboardItem,
  removeClipboardItem,
  clearClipboardHistory,
  ClipboardItem,
} from '../utils/clipboardHistory';
import { EmojiBoard } from './EmojiBoard';

type KeyboardLayoutMode = 'alpha' | 'numeric' | 'symbols';

const WindowsBackspaceIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
    <line x1="18" y1="9" x2="12" y2="15" />
    <line x1="12" y1="9" x2="18" y2="15" />
  </svg>
);

const WindowsEnterIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="9 10 4 15 9 20" />
    <path d="M20 4v7a4 4 0 0 1-4 4H4" />
  </svg>
);

const WindowsShiftIcon: React.FC<{ className?: string; filled?: boolean }> = ({ className = 'w-5 h-5', filled }) => (
  <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 3l7 7h-4v9h-6v-9H5l7-7z" />
  </svg>
);

const WindowsSettingsIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const WindowsLayoutIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <rect x="7" y="7" width="10" height="7" rx="1" />
  </svg>
);

const LANGUAGE_OPTIONS: { id: VietnameseInputMethod; label: string; short: string; flag: string }[] = [
  { id: 'vi-telex', label: 'Tiếng Việt (Telex)', short: 'Telex', flag: '🇻🇳' },
  { id: 'vi-vni', label: 'Tiếng Việt (VNI)', short: 'VNI', flag: '🇻🇳' },
  { id: 'en', label: 'Tiếng Anh', short: 'English', flag: '🇬🇧' },
];

export const NativeKeyboard: React.FC = () => {
  const { settings, updateSetting } = useSettings();
  const {
    isOpen,
    keyboardHeight,
    closeKeyboard,
    switchToDeviceKeyboard,
    insertText,
    deleteChar,
    submitAction,
    isNativeKeyboardEnabled,
    activeInput,
    inputMethod,
    setInputMethod,
  } = useNativeKeyboard();

  const [layoutMode, setLayoutMode] = useState<KeyboardLayoutMode>('alpha');
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [isCapsLock, setIsCapsLock] = useState(false);
  const [isMicListening, setIsMicListening] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiSearchQuery, setEmojiSearchQuery] = useState('');
  const [isEmojiSearchFocused, setIsEmojiSearchFocused] = useState(false);
  const [showClipboard, setShowClipboard] = useState(false);
  const [clipboardSearchQuery, setClipboardSearchQuery] = useState('');
  const [isClipboardSearchFocused, setIsClipboardSearchFocused] = useState(false);
  const [clipboardList, setClipboardList] = useState<ClipboardItem[]>([]);
  const [copiedFeedback, setCopiedFeedback] = useState<string | null>(null);
  const [pressedKeyId, setPressedKeyId] = useState<string | null>(null);
  const settingsBtnRef = useRef<HTMLButtonElement>(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [settingsMenuPos, setSettingsMenuPos] = useState<{ left: number; top: number }>({ left: 16, top: 120 });

  // In-app custom vertical scroller for Clipboard
  const [clipboardScrollProgress, setClipboardScrollProgress] = useState(0);
  const [isClipboardScrollable, setIsClipboardScrollable] = useState(false);
  const [clipboardThumbHeight, setClipboardThumbHeight] = useState(44);
  const [isClipboardDragging, setIsClipboardDragging] = useState(false);
  const clipboardScrollRef = useRef<HTMLDivElement | null>(null);
  const clipboardTrackRef = useRef<HTMLDivElement | null>(null);
  const clipboardDragStartYRef = useRef(0);
  const clipboardDragStartScrollTopRef = useRef(0);

  const lastShiftTapRef = useRef<number>(0);
  const backspaceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const backspaceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSoundTimeRef = useRef<number>(0);

  // Close Settings Menu on outside click or escape
  useEffect(() => {
    if (!showSettingsMenu) return;
    const handleClickOutside = (e: MouseEvent | PointerEvent) => {
      const menu = document.getElementById('native-keyboard-settings-menu');
      if (
        menu &&
        !menu.contains(e.target as Node) &&
        settingsBtnRef.current &&
        !settingsBtnRef.current.contains(e.target as Node)
      ) {
        setShowSettingsMenu(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSettingsMenu(false);
      }
    };
    window.addEventListener('pointerdown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showSettingsMenu]);

  // Play key sound with throttling to avoid double clicks between pointerdown and click
  const playSound = useCallback((type: 'char' | 'space' | 'delete' | 'action' | 'modifier' = 'char') => {
    const now = Date.now();
    if (now - lastSoundTimeRef.current > 35) {
      keyboardSound.playKeyClick(type);
      lastSoundTimeRef.current = now;
    }
  }, []);

  // Global pointer release to always clear pressed key state
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      setPressedKeyId(null);
    };
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, []);

  // Reset states when keyboard opens
  useEffect(() => {
    if (isOpen) {
      setLayoutMode('alpha');
      setIsShiftActive(false);
      setIsCapsLock(false);
      setShowEmojiPicker(false);
      setEmojiSearchQuery('');
      setShowSettingsMenu(false);
      setShowClipboard(false);
      setClipboardSearchQuery('');
      setPressedKeyId(null);
      setCopiedFeedback(null);
      keyboardSound.unlockAudio();
    }
  }, [isOpen]);

  // In-app custom vertical scroller handlers for Clipboard
  const handleClipboardScroll = () => {
    if (!clipboardScrollRef.current) return;
    const el = clipboardScrollRef.current;
    const maxScroll = el.scrollHeight - el.clientHeight;
    const canScroll = maxScroll > 8;
    setIsClipboardScrollable(canScroll);
    if (canScroll) {
      setClipboardScrollProgress(Math.min(1, Math.max(0, el.scrollTop / maxScroll)));
      if (clipboardTrackRef.current) {
        const trackH = clipboardTrackRef.current.clientHeight;
        const calcH = Math.max(32, Math.min(trackH - 16, (el.clientHeight / el.scrollHeight) * trackH));
        setClipboardThumbHeight(calcH);
      }
    }
  };

  const handleClipboardThumbPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    setIsClipboardDragging(true);
    clipboardDragStartYRef.current = e.clientY;
    clipboardDragStartScrollTopRef.current = clipboardScrollRef.current?.scrollTop || 0;
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const handleClipboardThumbPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isClipboardDragging || !clipboardScrollRef.current || !clipboardTrackRef.current) return;
    const deltaY = e.clientY - clipboardDragStartYRef.current;
    const trackH = clipboardTrackRef.current.clientHeight;
    const usable = Math.max(1, trackH - clipboardThumbHeight);
    const el = clipboardScrollRef.current;
    const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight);
    const scrollDelta = (deltaY / usable) * maxScroll;
    el.scrollTop = Math.max(0, Math.min(maxScroll, clipboardDragStartScrollTopRef.current + scrollDelta));
  };

  const handleClipboardThumbPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isClipboardDragging) {
      setIsClipboardDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  const handleClipboardTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!clipboardTrackRef.current || !clipboardScrollRef.current) return;
    const rect = clipboardTrackRef.current.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const trackH = rect.height;
    const usable = Math.max(1, trackH - clipboardThumbHeight);
    const targetProgress = Math.max(0, Math.min(1, (clickY - clipboardThumbHeight / 2) / usable));
    const el = clipboardScrollRef.current;
    const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight);
    el.scrollTo({ top: targetProgress * maxScroll, behavior: 'smooth' });
  };

  // Keep clipboard history synchronized
  useEffect(() => {
    const updateList = () => {
      setClipboardList(getClipboardHistory());
    };
    updateList();
    window.addEventListener('waves_clipboard_updated', updateList);
    return () => window.removeEventListener('waves_clipboard_updated', updateList);
  }, []);

  const handlePasteClipboardItem = (text: string) => {
    insertText(text);
    setCopiedFeedback('Đã dán!');
    setTimeout(() => setCopiedFeedback(null), 1200);
  };

  const handlePasteFromDevice = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          addClipboardItem(text);
          insertText(text);
          setCopiedFeedback('Đã dán!');
          setTimeout(() => setCopiedFeedback(null), 1200);
          return;
        }
      }
    } catch {
      // Permission blocked or unsupported
    }
  };

  const handleClearAllClipboard = () => {
    clearClipboardHistory();
  };

  const handleDeleteClipboardItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeClipboardItem(id);
  };

  // Clean up backspace repeat timers
  const clearBackspaceTimers = useCallback(() => {
    if (backspaceTimerRef.current) {
      clearTimeout(backspaceTimerRef.current);
      backspaceTimerRef.current = null;
    }
    if (backspaceIntervalRef.current) {
      clearInterval(backspaceIntervalRef.current);
      backspaceIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearBackspaceTimers();
  }, [clearBackspaceTimers]);



  if (!isNativeKeyboardEnabled) return null;

  // Key press handlers (Sound is triggered exclusively on pointerdown/press, NEVER on release/click)
  const handleCharPress = (char: string) => {
    const output = (isShiftActive || isCapsLock) ? char.toUpperCase() : char.toLowerCase();
    insertText(output);

    // If shift was active (and not caps lock), turn off after one character
    if (isShiftActive && !isCapsLock) {
      setIsShiftActive(false);
    }
  };

  const handleSpacePress = () => {
    insertText(' ');
  };

  const handleDeleteDown = () => {
    playSound('delete');
    if (navigator.vibrate) {
      try { navigator.vibrate(12); } catch {}
    }
    deleteChar();

    clearBackspaceTimers();
    // Start repeating after 350ms hold
    backspaceTimerRef.current = setTimeout(() => {
      backspaceIntervalRef.current = setInterval(() => {
        keyboardSound.playKeyClick('delete');
        deleteChar();
      }, 75);
    }, 350);
  };

  const handleDeleteUp = () => {
    clearBackspaceTimers();
  };

  const handleShiftTap = () => {
    const now = Date.now();
    // Double tap within 300ms toggles Caps Lock
    if (now - lastShiftTapRef.current < 300) {
      setIsCapsLock((prev) => !prev);
      setIsShiftActive(false);
    } else {
      if (isCapsLock) {
        setIsCapsLock(false);
        setIsShiftActive(false);
      } else {
        setIsShiftActive((prev) => !prev);
      }
    }
    lastShiftTapRef.current = now;
  };

  const handleSearchAction = () => {
    submitAction();
  };

  const toggleMic = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      insertText('🎤 ');
      return;
    }

    try {
      const SpeechRecognition =
        (window as unknown as { SpeechRecognition: any }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition: any }).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'vi-VN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsMicListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          insertText(transcript);
        }
        setIsMicListening(false);
      };
      recognition.onerror = () => setIsMicListening(false);
      recognition.onend = () => setIsMicListening(false);

      recognition.start();
    } catch {
      setIsMicListening(false);
    }
  };

  const handleEscPress = () => {
    playSound('action');
    if (activeInput) {
      activeInput.blur();
    }
    closeKeyboard();
  };

  const handleTabPress = () => {
    playSound('char');
    insertText('\t');
  };

  const handleEnterPress = () => {
    playSound('action');
    if (activeInput?.tagName === 'TEXTAREA') {
      insertText('\n');
    } else {
      submitAction();
    }
  };

  const handleArrowLeft = () => {
    playSound('modifier');
    const input = activeInput;
    if (!input) return;
    const pos = input.selectionStart ?? input.value.length;
    const newPos = Math.max(0, pos - 1);
    input.focus();
    input.setSelectionRange(newPos, newPos);
  };

  const handleArrowRight = () => {
    playSound('modifier');
    const input = activeInput;
    if (!input) return;
    const pos = input.selectionEnd ?? input.value.length;
    const newPos = Math.min(input.value.length, pos + 1);
    input.focus();
    input.setSelectionRange(newPos, newPos);
  };

  // Windows 11 Keyboard Rows definition
  const rowNumbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
  const row1Alpha = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
  const row2Alpha = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'];
  const row3Alpha = ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '?'];

  const row1Num = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
  const row2Num = ['-', '/', ':', ';', '(', ')', '$', '&', '@', '"'];
  const row3Num = ['.', ',', '?', '!', "'", '[', ']', '{', '}'];

  const SECONDARY_LABELS: Record<string, string> = {
    q: '1',
    w: '2',
    e: '3',
    r: '4',
    t: '5',
    y: '6',
    u: '7',
    i: '8',
    o: '9',
    p: '0',
    ';': ':',
    ',': '<',
    '.': '>',
    '?': '!',
  };

  const keyHeightClass = 'h-[40px] sm:h-[44px] md:h-[48px]';

  // Render individual character key with tactile sink-down animation on press
  const renderCharKey = (char: string, rowIndex: number, colIndex: number) => {
    const keyId = `${layoutMode}-${rowIndex}-${char}-${colIndex}`;
    const isNumber = !isNaN(Number(char));
    const displayChar = (!isNumber && (isShiftActive || isCapsLock)) ? char.toUpperCase() : char;
    const isPressed = pressedKeyId === keyId;
    const secondary = layoutMode === 'alpha' ? SECONDARY_LABELS[char] : undefined;

    return (
      <button
        key={keyId}
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onPointerDown={(e) => {
          e.preventDefault();
          playSound('char');
          if (navigator.vibrate) {
            try { navigator.vibrate(8); } catch {}
          }
          setPressedKeyId(keyId);
        }}
        onPointerUp={() => {
          setPressedKeyId(null);
        }}
        onPointerLeave={() => {
          setPressedKeyId(null);
        }}
        onPointerCancel={() => {
          setPressedKeyId(null);
        }}
        onClick={() => handleCharPress(char)}
        className={`touch-keycap relative flex-1 min-w-0 ${keyHeightClass} rounded-[3px] font-medium flex items-center justify-center transition-colors cursor-default font-sans select-none ${
          isPressed ? 'touch-keycap-pressed z-20' : 'z-10'
        }`}
      >
        {secondary && (
          <span
            aria-hidden="true"
            className="absolute left-1.5 top-0.5 sm:top-1 text-[10px] sm:text-[11px] font-normal leading-none opacity-50 select-none pointer-events-none"
          >
            {secondary}
          </span>
        )}
        <span className="relative z-10 text-[16px] sm:text-[18px] md:text-[20px] font-medium leading-none">
          {displayChar}
        </span>
      </button>
    );
  };

  return (
    <div
      id="vplay-native-keyboard"
      role="group"
      aria-label="Touch keyboard"
      style={{
        height: `${keyboardHeight}px`,
        zIndex: 2147483647,
      }}
      className={`touch-keyboard-shell fixed inset-x-0 bottom-0 z-50 rounded-none transition-all duration-[440ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] will-change-transform select-none flex flex-col justify-between ${
        isOpen ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      <div className="w-full max-w-full mx-auto flex flex-col justify-between h-full px-0.5 sm:px-1 md:px-3 lg:px-4 pt-0.5 pb-1 sm:pb-1.5">
        {/* Top bar with Windows 11 Touch Keyboard header icons */}
        <div className="touch-keyboard-header relative flex items-center justify-between gap-2 px-1 pt-0.5 pb-1 select-none min-h-[30px] sm:min-h-[34px] border-b border-black/10 dark:border-white/10 text-black/75 dark:text-white/75">
          {/* Top-left: Settings gear & layout switch icon */}
          <div className="flex items-center gap-1">
            <button
              ref={settingsBtnRef}
              type="button"
              id="btn-native-keyboard-settings"
              onMouseDown={(e) => e.preventDefault()}
              onPointerDown={(e) => {
                e.preventDefault();
                playSound('action');
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (!showSettingsMenu && settingsBtnRef.current) {
                  const rect = settingsBtnRef.current.getBoundingClientRect();
                  const topOffset = rect.bottom + 6;
                  const leftOffset = Math.max(8, Math.min(rect.left, window.innerWidth - 248));
                  setSettingsMenuPos({ left: leftOffset, top: topOffset });
                }
                setShowSettingsMenu((prev) => !prev);
              }}
              className="flex h-6.5 w-6.5 items-center justify-center rounded-md hover:bg-black/10 dark:hover:bg-white/10 active:bg-black/15 dark:active:bg-white/15 transition-colors cursor-default border-0 border-none outline-none focus:outline-none focus:ring-0"
              title="Cài đặt bàn phím"
              aria-label="Cài đặt bàn phím"
              aria-haspopup="menu"
              aria-expanded={showSettingsMenu}
            >
              <WindowsSettingsIcon className="w-4 h-4 text-current" />
            </button>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onPointerDown={(e) => {
                e.preventDefault();
                playSound('action');
              }}
              onClick={() => {
                setLayoutMode((prev) => (prev === 'alpha' ? 'numeric' : 'alpha'));
              }}
              className="flex h-6.5 w-6.5 items-center justify-center rounded-md hover:bg-black/10 dark:hover:bg-white/10 active:bg-black/15 dark:active:bg-white/15 transition-colors cursor-default"
              title="Đổi kiểu ký tự"
              aria-label="Đổi kiểu ký tự"
            >
              <WindowsLayoutIcon className="w-4 h-4 text-current" />
            </button>
          </div>

          {/* Search field for the emoji board - WinUI 3 Search Box style */}
          {showEmojiPicker && (
            <div
              className={`fluent-search-box group absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center shrink-0 w-48 xs:w-56 sm:w-72 md:w-84 h-7.5 sm:h-8 px-3 gap-2 transition-all select-none ${
                isEmojiSearchFocused || emojiSearchQuery
                  ? 'is-focused bg-white dark:bg-[#282c31]'
                  : 'bg-[#fbfbfb] dark:bg-[#282c31]'
              }`}
            >
              <FluentSearchIcon className="w-4 h-4 text-black dark:text-white shrink-0 pointer-events-none select-none" />
              <input
                type="text"
                value={emojiSearchQuery}
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                onFocus={() => setIsEmojiSearchFocused(true)}
                onBlur={() => setIsEmojiSearchFocused(false)}
                onChange={(e) => setEmojiSearchQuery(e.target.value)}
                placeholder="Search for emojis"
                className="flex-1 min-w-0 bg-transparent text-xs sm:text-[13px] text-black dark:text-white placeholder-black/75 dark:placeholder-white outline-none border-none py-0.5 pr-1 font-sans"
              />
              {emojiSearchQuery && (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setEmojiSearchQuery('')}
                  className="text-black dark:text-white hover:text-black dark:hover:text-white p-0.5 transition-colors cursor-pointer shrink-0"
                  title="Xóa tìm kiếm"
                  aria-label="Xóa tìm kiếm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Right side: Switch to device keyboard and Close button */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              id="btn-switch-to-device-keyboard"
              onMouseDown={(e) => e.preventDefault()}
              onPointerDown={(e) => {
                e.preventDefault();
                playSound('action');
              }}
              onClick={switchToDeviceKeyboard}
              className="flex h-6.5 w-6.5 items-center justify-center rounded-md hover:bg-black/10 dark:hover:bg-white/10 active:bg-black/15 dark:active:bg-white/15 transition-colors cursor-default"
              title="Switch to device's keyboard"
              aria-label="Switch to device's keyboard"
            >
              <Keyboard className="w-4 h-4 text-current" />
            </button>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onPointerDown={(e) => {
                e.preventDefault();
                playSound('action');
              }}
              onClick={closeKeyboard}
              className="flex h-6.5 w-6.5 items-center justify-center rounded-md hover:bg-black/10 dark:hover:bg-white/10 active:bg-black/15 dark:active:bg-white/15 transition-colors cursor-default"
              title="Đóng bàn phím"
              aria-label="Đóng bàn phím"
            >
              <X className="w-4 h-4 text-current" />
            </button>
          </div>
        </div>

        {/* Main Keyboard Body with Right-to-Left Slide Transitions across Keyboard, Emoji, and Clipboard */}
        <div className="relative flex-1 overflow-hidden flex flex-col justify-center w-full min-h-0">
          <AnimatePresence mode="wait" initial={false}>
            {showClipboard ? (
              /* Clipboard History Tray */
              <motion.div
                key="clipboard-view"
                initial={{ opacity: 0, x: 80 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -80 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="flex-1 flex flex-col justify-between px-1.5 py-1 min-h-0 overflow-hidden w-full h-full"
              >
                {/* Clipboard Header Actions if items or feedback exist */}
                {(copiedFeedback || clipboardList.length > 0) && (
                  <div className="flex items-center justify-between pb-1 px-1 border-b border-black/10 dark:border-white/10 shrink-0">
                    <div className="flex items-center gap-2">
                      {copiedFeedback && (
                        <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full animate-in fade-in duration-150">
                          {copiedFeedback}
                        </span>
                      )}
                    </div>
                    {clipboardList.length > 0 && (
                      <div className="flex items-center gap-1.5 ml-auto">
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onPointerDown={() => {
                            playSound('delete');
                          }}
                          onClick={handleClearAllClipboard}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 text-red-700 dark:text-red-400 text-[11px] font-medium transition-colors cursor-default"
                          title="Xóa tất cả lịch sử sao chép"
                        >
                          <FluentDeleteIcon className="w-3.5 h-3.5" />
                          <span className="hidden xs:inline">Xóa tất cả</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

            {/* Clipboard search box - WinUI 3 Search Box style */}
            <div
              className={`fluent-search-box group relative flex items-center w-full h-8 sm:h-8.5 px-3.5 gap-2 transition-all my-1 shrink-0 select-none ${
                isClipboardSearchFocused || clipboardSearchQuery
                  ? 'is-focused bg-white dark:bg-[#282c31]'
                  : 'bg-[#fbfbfb] dark:bg-[#282c31]'
              }`}
            >
              <FluentSearchIcon className="w-4 h-4 text-black dark:text-white shrink-0 pointer-events-none select-none" />
              <input
                type="text"
                value={clipboardSearchQuery}
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                onFocus={() => setIsClipboardSearchFocused(true)}
                onBlur={() => setIsClipboardSearchFocused(false)}
                onChange={(e) => setClipboardSearchQuery(e.target.value)}
                placeholder="Search for clipboard history"
                className="flex-1 min-w-0 bg-transparent text-xs sm:text-[13px] text-black dark:text-white placeholder-black/75 dark:placeholder-white outline-none border-none py-0.5 pr-1 font-sans"
              />
              {clipboardSearchQuery && (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setClipboardSearchQuery('')}
                  className="text-black dark:text-white hover:text-black dark:hover:text-white p-0.5 transition-colors cursor-pointer shrink-0"
                  title="Xóa tìm kiếm"
                  aria-label="Xóa tìm kiếm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Clipboard List with In-App Custom Vertical Scroller (NO native browser scrollbar) */}
            <div className="flex-1 min-h-0 flex items-stretch gap-1.5 overflow-hidden">
              <div
                ref={clipboardScrollRef}
                onScroll={handleClipboardScroll}
                className="flex-1 overflow-y-auto py-1 space-y-1.5 pr-0.5 max-h-[185px] no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              >
                {clipboardList.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center py-8 text-center space-y-2 select-none">
                    <div className="flex items-center justify-center">
                      <ClipboardList className="w-8 h-8 text-black dark:text-white stroke-[1.8]" />
                    </div>
                    <div className="text-xs sm:text-[13px] font-semibold text-black dark:text-white">
                      Nothing to see here... yet
                    </div>
                  </div>
                ) : clipboardList.filter((item) =>
                    clipboardSearchQuery.trim()
                      ? item.text.toLowerCase().includes(clipboardSearchQuery.trim().toLowerCase())
                      : true
                  ).length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center py-6 text-center text-black/70 space-y-1.5">
                    <div className="text-xs font-semibold text-black">Không tìm thấy nội dung phù hợp</div>
                    <button
                      type="button"
                      onClick={() => setClipboardSearchQuery('')}
                      className="text-[11px] text-[#ff01ff] font-semibold hover:underline cursor-pointer"
                    >
                      Xóa bộ lọc tìm kiếm
                    </button>
                  </div>
                ) : (
                  clipboardList
                    .filter((item) =>
                      clipboardSearchQuery.trim()
                        ? item.text.toLowerCase().includes(clipboardSearchQuery.trim().toLowerCase())
                        : true
                    )
                    .map((item) => (
                      <div
                        key={item.id}
                        onPointerDown={() => playSound('action')}
                        onClick={() => handlePasteClipboardItem(item.text)}
                        className="group w-full flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white/60 hover:bg-white/80 active:bg-white/90 border border-white/35 shadow-xs cursor-default transition-colors text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-black line-clamp-2 select-none break-words">
                            {item.text}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-black/50">
                            <span>Chạm để dán</span>
                            <span>•</span>
                            <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            playSound('delete');
                          }}
                          onClick={(e) => handleDeleteClipboardItem(item.id, e)}
                          className="p-1.5 rounded-lg text-black/40 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0 cursor-default"
                          title="Xóa mục này"
                        >
                          <FluentDeleteIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                )}
              </div>

              {/* In-App Custom Vertical Scroller Rail & Thumb (matching AppScrollbar design) */}
              {isClipboardScrollable && (
                <div
                  ref={clipboardTrackRef}
                  onClick={handleClipboardTrackClick}
                  className="relative w-1.5 hover:w-2.5 my-1 rounded-full cursor-pointer bg-black/10 dark:bg-white/10 transition-all shrink-0 select-none"
                >
                  <div
                    role="scrollbar"
                    aria-orientation="vertical"
                    aria-valuenow={Math.round(clipboardScrollProgress * 100)}
                    onPointerDown={handleClipboardThumbPointerDown}
                    onPointerMove={handleClipboardThumbPointerMove}
                    onPointerUp={handleClipboardThumbPointerUp}
                    onPointerCancel={handleClipboardThumbPointerUp}
                    style={{
                      top: `${clipboardScrollProgress * Math.max(0, (clipboardTrackRef.current?.clientHeight || 150) - clipboardThumbHeight)}px`,
                      height: `${clipboardThumbHeight}px`,
                    }}
                    className={`absolute left-1/2 -translate-x-1/2 w-full rounded-full cursor-grab active:cursor-grabbing transition-colors shadow-xs ${
                      isClipboardDragging
                        ? 'bg-[#ff01ff]'
                        : 'bg-neutral-600/70 hover:bg-neutral-800'
                    }`}
                  />
                </div>
              )}
            </div>

            {/* Bottom bar of Clipboard view: WinUI 3 styled buttons */}
            <div className="flex items-center justify-between pt-1 border-t border-black/10 dark:border-white/10 shrink-0">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onPointerDown={() => playSound('modifier')}
                onClick={() => setShowClipboard(false)}
                className="h-8 px-4 rounded-[6px] bg-white/70 dark:bg-white/10 hover:bg-black/5 dark:hover:bg-white/15 active:bg-black/10 dark:active:bg-white/20 text-xs font-semibold text-[#111827] dark:text-white border-0 border-none outline-none focus:outline-none focus:ring-0 transition-colors cursor-default"
              >
                Bàn phím
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onPointerDown={() => playSound('action')}
                onClick={closeKeyboard}
                className="h-8 px-4 rounded-[6px] bg-[#005fb8] dark:bg-[#4cc2ff] hover:bg-[#106ebe] dark:hover:bg-[#6bd0ff] active:bg-[#005a9e] dark:active:bg-[#3bb2ef] text-xs font-semibold text-white dark:text-black transition-colors cursor-default border-0 border-none outline-none focus:outline-none focus:ring-0"
              >
                Xong
              </button>
            </div>
          </motion.div>
        ) : showEmojiPicker ? (
          /* Full Horizontal Scrolling Emoji Board with Unicode Categories */
          <motion.div
            key="emoji-view"
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -80 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full flex flex-col min-h-0"
          >
            <EmojiBoard
              searchQuery={emojiSearchQuery}
              onInsertEmoji={(emoji) => handleCharPress(emoji)}
              onDeleteChar={deleteChar}
              onCloseKeyboard={closeKeyboard}
              onSwitchToABC={() => {
                setShowEmojiPicker(false);
                setEmojiSearchQuery('');
                setIsEmojiSearchFocused(false);
              }}
            />
          </motion.div>
        ) : (
          /* Windows 11 Touch Keyboard grid */
          <motion.div
            key="keyboard-view"
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -80 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-1 sm:gap-1.5 md:gap-2 flex-1 justify-center py-0.5 w-full"
          >
            {/* ROW 1: Esc, q..p with 1..0 superscripts, Backspace */}
            <div className="flex items-center justify-between gap-1 sm:gap-1.5 md:gap-2 w-full">
              {/* Esc key */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onPointerDown={(e) => {
                  e.preventDefault();
                  playSound('action');
                  setPressedKeyId('esc-btn');
                }}
                onPointerUp={() => setPressedKeyId(null)}
                onPointerLeave={() => setPressedKeyId(null)}
                onPointerCancel={() => setPressedKeyId(null)}
                onClick={handleEscPress}
                className={`touch-keycap w-[8%] sm:w-[7.6%] min-w-[36px] sm:min-w-[42px] ${keyHeightClass} rounded-[3px] text-xs sm:text-[13px] font-medium flex items-center justify-center transition-colors cursor-default ${
                  pressedKeyId === 'esc-btn' ? 'touch-keycap-pressed' : ''
                }`}
                title="Escape"
                aria-label="Escape"
              >
                Esc
              </button>

              {/* Characters q..p */}
              {(layoutMode === 'alpha' ? row1Alpha : row1Num).map((char, colIndex) =>
                renderCharKey(char, 1, colIndex)
              )}

              {/* Backspace key */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onPointerDown={(e) => {
                  e.preventDefault();
                  setPressedKeyId('backspace');
                  handleDeleteDown();
                }}
                onPointerUp={() => {
                  setPressedKeyId(null);
                  handleDeleteUp();
                }}
                onPointerLeave={() => {
                  setPressedKeyId(null);
                  handleDeleteUp();
                }}
                onPointerCancel={() => {
                  setPressedKeyId(null);
                  handleDeleteUp();
                }}
                className={`touch-keycap w-[8.8%] sm:w-[8.4%] min-w-[40px] sm:min-w-[46px] ${keyHeightClass} rounded-[3px] flex items-center justify-center transition-colors cursor-default ${
                  pressedKeyId === 'backspace' ? 'touch-keycap-pressed' : ''
                }`}
                title="Xóa lùi (Backspace)"
                aria-label="Xóa lùi"
              >
                <WindowsBackspaceIcon className="w-5 h-5 text-current" />
              </button>
            </div>

            {/* ROW 2: Tab, a..l, ;, Enter */}
            <div className="flex items-center justify-between gap-1 sm:gap-1.5 md:gap-2 w-full">
              {/* Tab key */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onPointerDown={(e) => {
                  e.preventDefault();
                  playSound('char');
                  setPressedKeyId('tab-btn');
                }}
                onPointerUp={() => setPressedKeyId(null)}
                onPointerLeave={() => setPressedKeyId(null)}
                onPointerCancel={() => setPressedKeyId(null)}
                onClick={handleTabPress}
                className={`touch-keycap w-[8.8%] sm:w-[8.4%] min-w-[40px] sm:min-w-[46px] ${keyHeightClass} rounded-[3px] text-xs sm:text-[13px] font-medium flex items-center justify-center transition-colors cursor-default ${
                  pressedKeyId === 'tab-btn' ? 'touch-keycap-pressed' : ''
                }`}
                title="Tab"
                aria-label="Tab"
              >
                Tab
              </button>

              {/* Characters a..l and ; */}
              {(layoutMode === 'alpha' ? row2Alpha : row2Num).map((char, colIndex) =>
                renderCharKey(char, 2, colIndex)
              )}

              {/* Enter key */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onPointerDown={(e) => {
                  e.preventDefault();
                  playSound('action');
                  setPressedKeyId('enter-btn');
                }}
                onPointerUp={() => setPressedKeyId(null)}
                onPointerLeave={() => setPressedKeyId(null)}
                onPointerCancel={() => setPressedKeyId(null)}
                onClick={handleEnterPress}
                className={`touch-keycap w-[9.8%] sm:w-[9.4%] min-w-[44px] sm:min-w-[50px] ${keyHeightClass} rounded-[3px] flex items-center justify-center transition-colors cursor-default ${
                  pressedKeyId === 'enter-btn' ? 'touch-keycap-pressed' : ''
                }`}
                title="Enter"
                aria-label="Enter"
              >
                <WindowsEnterIcon className="w-5 h-5 text-current" />
              </button>
            </div>

            {/* ROW 3: Left Shift, z..m, ,, ., ?, Right Shift */}
            <div className="flex items-center justify-between gap-1 sm:gap-1.5 md:gap-2 w-full">
              {/* Left Shift key */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onPointerDown={(e) => {
                  e.preventDefault();
                  playSound('modifier');
                  setPressedKeyId('shift-left');
                  if (navigator.vibrate) {
                    try { navigator.vibrate(10); } catch {}
                  }
                }}
                onPointerUp={() => setPressedKeyId(null)}
                onPointerLeave={() => setPressedKeyId(null)}
                onPointerCancel={() => setPressedKeyId(null)}
                onClick={handleShiftTap}
                className={`touch-keycap w-[10.6%] sm:w-[10.2%] min-w-[44px] sm:min-w-[50px] ${keyHeightClass} rounded-[3px] flex items-center justify-center transition-colors cursor-default ${
                  isCapsLock || isShiftActive ? 'touch-keycap-active' : ''
                } ${pressedKeyId === 'shift-left' ? 'touch-keycap-pressed' : ''}`}
                title={isCapsLock ? 'Caps Lock BẬT' : isShiftActive ? 'Shift BẬT' : 'Shift'}
                aria-label="Shift trái"
              >
                <WindowsShiftIcon className="w-5 h-5 text-current" filled={isCapsLock || isShiftActive} />
              </button>

              {/* Characters z..m, ,, ., ? */}
              {(layoutMode === 'alpha' ? row3Alpha : row3Num).map((char, colIndex) =>
                renderCharKey(char, 3, colIndex)
              )}

              {/* Right Shift key */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onPointerDown={(e) => {
                  e.preventDefault();
                  playSound('modifier');
                  setPressedKeyId('shift-right');
                  if (navigator.vibrate) {
                    try { navigator.vibrate(10); } catch {}
                  }
                }}
                onPointerUp={() => setPressedKeyId(null)}
                onPointerLeave={() => setPressedKeyId(null)}
                onPointerCancel={() => setPressedKeyId(null)}
                onClick={handleShiftTap}
                className={`touch-keycap w-[10.6%] sm:w-[10.2%] min-w-[44px] sm:min-w-[50px] ${keyHeightClass} rounded-[3px] flex items-center justify-center transition-colors cursor-default ${
                  isCapsLock || isShiftActive ? 'touch-keycap-active' : ''
                } ${pressedKeyId === 'shift-right' ? 'touch-keycap-pressed' : ''}`}
                title={isCapsLock ? 'Caps Lock BẬT' : isShiftActive ? 'Shift BẬT' : 'Shift'}
                aria-label="Shift phải"
              >
                <WindowsShiftIcon className="w-5 h-5 text-current" filled={isCapsLock || isShiftActive} />
              </button>
            </div>

            {/* ROW 4: &123, Emoji, Clipboard, Space, Mic, <, > */}
            <div className="flex w-full items-center gap-1 sm:gap-1.5 md:gap-2">
              {/* &123 / ABC layout mode switch */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onPointerDown={(e) => {
                  e.preventDefault();
                  playSound('modifier');
                  setPressedKeyId('layout-mode');
                }}
                onPointerUp={() => setPressedKeyId(null)}
                onPointerLeave={() => setPressedKeyId(null)}
                onPointerCancel={() => setPressedKeyId(null)}
                onClick={() => {
                  setLayoutMode(layoutMode === 'alpha' ? 'numeric' : 'alpha');
                }}
                className={`touch-keycap h-[40px] sm:h-[44px] md:h-[48px] w-[7.4%] min-w-[38px] sm:min-w-[44px] shrink-0 rounded-[3px] flex items-center justify-center text-xs sm:text-[13px] font-medium transition-colors cursor-default ${
                  pressedKeyId === 'layout-mode' ? 'touch-keycap-pressed' : ''
                }`}
                title="Chuyển sang ký tự số / chữ"
                aria-label="Chuyển chế độ ký tự"
              >
                {layoutMode === 'alpha' ? '&123' : 'ABC'}
              </button>

              {/* Emoji key (chuyển ra ngoài từ context menu phím dấu +, thay phím Windows) */}
              <button
                type="button"
                id="btn-native-keyboard-emoji"
                onMouseDown={(e) => e.preventDefault()}
                onPointerDown={(e) => {
                  e.preventDefault();
                  playSound('action');
                  setPressedKeyId('emoji-btn');
                }}
                onPointerUp={() => setPressedKeyId(null)}
                onPointerLeave={() => setPressedKeyId(null)}
                onPointerCancel={() => setPressedKeyId(null)}
                onClick={() => {
                  setShowClipboard(false);
                  setShowSettingsMenu(false);
                  setShowEmojiPicker((prev) => !prev);
                  setEmojiSearchQuery('');
                }}
                className={`touch-keycap h-[40px] sm:h-[44px] md:h-[48px] w-[6.4%] min-w-[34px] sm:min-w-[40px] shrink-0 rounded-[3px] flex items-center justify-center transition-colors cursor-default ${
                  showEmojiPicker ? 'touch-keycap-active' : ''
                } ${pressedKeyId === 'emoji-btn' ? 'touch-keycap-pressed' : ''}`}
                title="Biểu tượng cảm xúc (Emoji)"
                aria-label="Biểu tượng cảm xúc"
              >
                <Smile className="w-5 h-5 text-current stroke-[1.8]" />
              </button>

              {/* Clipboard key (chuyển ra ngoài từ context menu phím dấu +, thay phím Alt) */}
              <button
                type="button"
                id="btn-native-keyboard-clipboard"
                onMouseDown={(e) => e.preventDefault()}
                onPointerDown={(e) => {
                  e.preventDefault();
                  playSound('action');
                  setPressedKeyId('clipboard-btn');
                }}
                onPointerUp={() => setPressedKeyId(null)}
                onPointerLeave={() => setPressedKeyId(null)}
                onPointerCancel={() => setPressedKeyId(null)}
                onClick={() => {
                  setShowEmojiPicker(false);
                  setShowSettingsMenu(false);
                  setShowClipboard((prev) => !prev);
                }}
                className={`touch-keycap h-[40px] sm:h-[44px] md:h-[48px] w-[6.4%] min-w-[34px] sm:min-w-[40px] shrink-0 rounded-[3px] flex items-center justify-center transition-colors cursor-default ${
                  showClipboard ? 'touch-keycap-active' : ''
                } ${pressedKeyId === 'clipboard-btn' ? 'touch-keycap-pressed' : ''}`}
                title="Lịch sử sao chép (Clipboard)"
                aria-label="Lịch sử sao chép"
              >
                <ClipboardList className="w-5 h-5 text-current stroke-[1.8]" />
              </button>

              {/* Spacebar */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onPointerDown={(e) => {
                  e.preventDefault();
                  playSound('space');
                  setPressedKeyId('spacebar');
                  if (navigator.vibrate) {
                    try { navigator.vibrate(10); } catch {}
                  }
                }}
                onPointerUp={() => setPressedKeyId(null)}
                onPointerLeave={() => setPressedKeyId(null)}
                onPointerCancel={() => setPressedKeyId(null)}
                onClick={handleSpacePress}
                className={`touch-keycap flex-1 min-w-[90px] h-[40px] sm:h-[44px] md:h-[48px] rounded-[3px] font-semibold text-sm flex items-center justify-center transition-colors cursor-default ${
                  pressedKeyId === 'spacebar' ? 'touch-keycap-pressed' : ''
                }`}
                aria-label="Phím cách"
              >
                <span className="text-[11px] sm:text-xs font-normal opacity-60 tracking-wider select-none pointer-events-none truncate px-2">
                  {inputMethod === 'vi-telex'
                    ? 'Tiếng Việt (Telex)'
                    : inputMethod === 'vi-vni'
                    ? 'Tiếng Việt (VNI)'
                    : 'English'}
                </span>
              </button>

              {/* Microphone (Dictation) */}
              <button
                type="button"
                id="btn-native-keyboard-mic"
                onMouseDown={(e) => e.preventDefault()}
                onPointerDown={(e) => {
                  e.preventDefault();
                  playSound('action');
                  setPressedKeyId('mic-btn');
                }}
                onPointerUp={() => setPressedKeyId(null)}
                onPointerLeave={() => setPressedKeyId(null)}
                onPointerCancel={() => setPressedKeyId(null)}
                onClick={toggleMic}
                className={`touch-keycap h-[40px] sm:h-[44px] md:h-[48px] w-[5.8%] min-w-[32px] sm:min-w-[38px] shrink-0 rounded-[3px] flex items-center justify-center transition-colors cursor-default ${
                  isMicListening ? 'touch-keycap-active' : ''
                } ${pressedKeyId === 'mic-btn' ? 'touch-keycap-pressed' : ''}`}
                title={isMicListening ? 'Đang nghe...' : 'Nhập bằng giọng nói'}
                aria-label={isMicListening ? 'Đang nghe, dừng nhập bằng giọng nói' : 'Nhập bằng giọng nói'}
                aria-pressed={isMicListening}
              >
                <Mic className="w-4.5 h-4.5 text-current" />
              </button>

              {/* Cursor Left < */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onPointerDown={(e) => {
                  e.preventDefault();
                  playSound('modifier');
                  setPressedKeyId('arrow-left');
                }}
                onPointerUp={() => setPressedKeyId(null)}
                onPointerLeave={() => setPressedKeyId(null)}
                onPointerCancel={() => setPressedKeyId(null)}
                onClick={handleArrowLeft}
                className={`touch-keycap h-[40px] sm:h-[44px] md:h-[48px] w-[5.4%] min-w-[30px] sm:min-w-[36px] shrink-0 rounded-[3px] flex items-center justify-center text-sm font-semibold transition-colors cursor-default ${
                  pressedKeyId === 'arrow-left' ? 'touch-keycap-pressed' : ''
                }`}
                title="Di chuyển sang trái"
                aria-label="Sang trái"
              >
                &lt;
              </button>

              {/* Cursor Right > */}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onPointerDown={(e) => {
                  e.preventDefault();
                  playSound('modifier');
                  setPressedKeyId('arrow-right');
                }}
                onPointerUp={() => setPressedKeyId(null)}
                onPointerLeave={() => setPressedKeyId(null)}
                onPointerCancel={() => setPressedKeyId(null)}
                onClick={handleArrowRight}
                className={`touch-keycap h-[40px] sm:h-[44px] md:h-[48px] w-[5.6%] min-w-[32px] sm:min-w-[38px] shrink-0 rounded-[3px] flex items-center justify-center text-sm font-semibold transition-colors cursor-default ${
                  pressedKeyId === 'arrow-right' ? 'touch-keycap-pressed' : ''
                }`}
                title="Di chuyển sang phải"
                aria-label="Sang phải"
              >
                &gt;
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>

        {/* Settings Flyout Context Menu */}
        {typeof document !== 'undefined' &&
          createPortal(
            <AnimatePresence>
              {showSettingsMenu && (
                <motion.div
                  id="native-keyboard-settings-menu"
                  role="menu"
                  aria-label="Cài đặt bàn phím"
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  onContextMenu={(e) => e.preventDefault()}
                  className={`fixed z-[2147483647] w-[236px] max-h-[calc(100vh-80px)] overflow-y-auto ${flyoutPanelClassName} fluent-context-menu select-none`}
                  style={{
                    ...flyoutPanelStyle,
                    left: `${settingsMenuPos.left}px`,
                    top: `${settingsMenuPos.top}px`,
                  }}
                >
                  {/* Header */}
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0, transition: { duration: 0.28, delay: 0, ease: [0.16, 1, 0.3, 1] } }}
                    className="px-3 py-1.5 text-[11px] font-semibold text-[#6b7280] dark:text-[#9ca3af] uppercase tracking-wider flex items-center justify-between"
                  >
                    <span>Cài đặt bàn phím</span>
                    <WindowsSettingsIcon className="w-3.5 h-3.5 text-black dark:text-white" />
                  </motion.div>

                  <div className="space-y-0.5 mt-0.5">
                    {/* 1. Use Flumojis toggle */}
                    <motion.button
                      type="button"
                      role="menuitemcheckbox"
                      aria-checked={settings.useFlumojs}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.28, delay: 0.03, ease: [0.16, 1, 0.3, 1] },
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                      onPointerDown={(e) => {
                        e.preventDefault();
                        playSound('action');
                      }}
                      onClick={() => {
                        updateSetting('useFlumojs', !settings.useFlumojs);
                      }}
                      className="w-full h-[36px] px-3 rounded-[6px] flex items-center justify-between text-[13px] font-medium text-left outline-none transition-colors cursor-pointer hover:bg-black/[0.05] dark:hover:bg-white/[0.08] focus-visible:bg-black/[0.05] dark:focus-visible:bg-white/[0.08] active:bg-black/[0.08] dark:active:bg-white/[0.12] text-[#111827] dark:text-white"
                    >
                      <div className="flex items-center gap-2">
                        <Smile className="w-4 h-4 text-black dark:text-white stroke-[1.8]" />
                        <span>Use Flumojis</span>
                      </div>
                      <div
                        className={`w-7 h-4 rounded-full transition-colors relative flex items-center p-0.5 ${
                          settings.useFlumojs
                            ? 'bg-[#0078d4] dark:bg-[#4cc2ff]'
                            : 'bg-black/20 dark:bg-white/20'
                        }`}
                      >
                        <div
                          className={`w-3 h-3 rounded-full bg-white dark:bg-black transition-transform ${
                            settings.useFlumojs ? 'translate-x-3' : 'translate-x-0'
                          }`}
                        />
                      </div>
                    </motion.button>

                    {/* 2. Play haptic and sounds toggle */}
                    <motion.button
                      type="button"
                      role="menuitemcheckbox"
                      aria-checked={settings.keyboardSoundEnabled}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.28, delay: 0.06, ease: [0.16, 1, 0.3, 1] },
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                      onPointerDown={(e) => {
                        e.preventDefault();
                        playSound('action');
                      }}
                      onClick={() => {
                        const nextVal = !settings.keyboardSoundEnabled;
                        updateSetting('keyboardSoundEnabled', nextVal);
                        keyboardSound.setEnabled(nextVal);
                        if (navigator.vibrate) {
                          try { navigator.vibrate(10); } catch {}
                        }
                      }}
                      className="w-full h-[36px] px-3 rounded-[6px] flex items-center justify-between text-[13px] font-medium text-left outline-none transition-colors cursor-pointer hover:bg-black/[0.05] dark:hover:bg-white/[0.08] focus-visible:bg-black/[0.05] dark:focus-visible:bg-white/[0.08] active:bg-black/[0.08] dark:active:bg-white/[0.12] text-[#111827] dark:text-white"
                    >
                      <div className="flex items-center gap-2">
                        <Mic className="w-4 h-4 text-black dark:text-white stroke-[1.8]" />
                        <span>Play haptic and sounds</span>
                      </div>
                      <div
                        className={`w-7 h-4 rounded-full transition-colors relative flex items-center p-0.5 ${
                          settings.keyboardSoundEnabled
                            ? 'bg-[#0078d4] dark:bg-[#4cc2ff]'
                            : 'bg-black/20 dark:bg-white/20'
                        }`}
                      >
                        <div
                          className={`w-3 h-3 rounded-full bg-white dark:bg-black transition-transform ${
                            settings.keyboardSoundEnabled ? 'translate-x-3' : 'translate-x-0'
                          }`}
                        />
                      </div>
                    </motion.button>

                    {/* <div> Divider */}
                    <div className="my-1 border-t border-black/10 dark:border-white/10" />

                    {/* 3. Language Options: ENG, VIE (Telex), VIE (VNI) */}
                    {[
                      { id: 'en' as VietnameseInputMethod, label: 'ENG' },
                      { id: 'vi-telex' as VietnameseInputMethod, label: 'VIE (Telex)' },
                      { id: 'vi-vni' as VietnameseInputMethod, label: 'VIE (VNI)' },
                    ].map((lang, idx) => {
                      const isSelected = inputMethod === lang.id;
                      return (
                        <motion.button
                          key={lang.id}
                          type="button"
                          role="menuitemradio"
                          aria-checked={isSelected}
                          initial={{ opacity: 0, y: -8 }}
                          animate={{
                            opacity: 1,
                            y: 0,
                            transition: {
                              duration: 0.28,
                              delay: 0.09 + idx * 0.03,
                              ease: [0.16, 1, 0.3, 1],
                            },
                          }}
                          onMouseDown={(e) => e.preventDefault()}
                          onPointerDown={(e) => {
                            e.preventDefault();
                            playSound('action');
                          }}
                          onClick={() => {
                            setInputMethod(lang.id);
                            setShowSettingsMenu(false);
                          }}
                          className={`w-full h-[36px] px-3 rounded-[6px] flex items-center justify-between text-[13px] font-medium text-left outline-none transition-colors cursor-pointer hover:bg-black/[0.05] dark:hover:bg-white/[0.08] focus-visible:bg-black/[0.05] dark:focus-visible:bg-white/[0.08] active:bg-black/[0.08] dark:active:bg-white/[0.12] ${
                            isSelected
                              ? 'bg-black/[0.04] dark:bg-white/[0.06] text-[#0078d4] dark:text-[#4cc2ff] font-semibold'
                              : 'text-[#111827] dark:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Globe className="w-3.5 h-3.5 text-black dark:text-white stroke-[1.8]" />
                            <span>{lang.label}</span>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-[#0078d4] dark:text-[#4cc2ff] stroke-[2.5]" />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>,
            document.body
          )}
      </div>
    </div>
  );
};
