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

const LANGUAGE_OPTIONS: { id: VietnameseInputMethod; label: string; short: string; flag: string }[] = [
  { id: 'vi-telex', label: 'Tiếng Việt (Telex)', short: 'Telex', flag: '🇻🇳' },
  { id: 'vi-vni', label: 'Tiếng Việt (VNI)', short: 'VNI', flag: '🇻🇳' },
  { id: 'en', label: 'Tiếng Anh', short: 'English', flag: '🇬🇧' },
];

export const NativeKeyboard: React.FC = () => {
  const { settings } = useSettings();
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
  const [showClipboard, setShowClipboard] = useState(false);
  const [clipboardSearchQuery, setClipboardSearchQuery] = useState('');
  const [clipboardList, setClipboardList] = useState<ClipboardItem[]>([]);
  const [copiedFeedback, setCopiedFeedback] = useState<string | null>(null);
  const [pressedKeyId, setPressedKeyId] = useState<string | null>(null);
  const plusBtnRef = useRef<HTMLButtonElement>(null);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [plusMenuPos, setPlusMenuPos] = useState<{ left: number; bottom: number }>({ left: 16, bottom: 60 });

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

  // Close plus context menu on outside click or escape
  useEffect(() => {
    if (!showPlusMenu) return;
    const handlePointer = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        plusBtnRef.current?.contains(target as Node) ||
        target?.closest('#native-keyboard-plus-menu')
      ) {
        return;
      }
      setShowPlusMenu(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowPlusMenu(false);
    };
    document.addEventListener('pointerdown', handlePointer);
    document.addEventListener('keydown', handleKey);
    const handleResize = () => setShowPlusMenu(false);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('pointerdown', handlePointer);
      document.removeEventListener('keydown', handleKey);
      window.removeEventListener('resize', handleResize);
    };
  }, [showPlusMenu]);

  // Reset states when keyboard opens
  useEffect(() => {
    if (isOpen) {
      setLayoutMode('alpha');
      setIsShiftActive(false);
      setIsCapsLock(false);
      setShowEmojiPicker(false);
      setEmojiSearchQuery('');
      setShowPlusMenu(false);
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

  // Keyboard Rows definition
  const rowNumbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
  const row1Alpha = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
  const row2Alpha = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'];
  const row3Alpha = ['z', 'x', 'c', 'v', 'b', 'n', 'm'];

  const row1Num = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
  const row2Num = ['-', '/', ':', ';', '(', ')', '$', '&', '@', '"'];
  const row3Num = ['.', ',', '?', '!', "'"];

  const row1Sym = ['[', ']', '{', '}', '#', '%', '^', '*', '+', '='];
  const row2Sym = ['_', '\\', '|', '~', '<', '>', '€', '£', '¥', '•'];
  const row3Sym = ['.', ',', '?', '!', "'"];

  const hasNumberRow = Boolean(settings.keyboardNumberRow && layoutMode === 'alpha');
  const keyHeightClass = hasNumberRow
    ? 'h-[36px] sm:h-[40px] md:h-[44px]'
    : 'h-[42px] sm:h-[46px] md:h-[50px]';

  // Render individual character key with tactile sink-down animation on press (no pop-up balloon)
  const renderCharKey = (char: string, rowIndex: number, colIndex: number, _totalCols?: number) => {
    const keyId = `${layoutMode}-${rowIndex}-${char}-${colIndex}`;
    const isNumber = !isNaN(Number(char));
    const displayChar = (!isNumber && (isShiftActive || isCapsLock)) ? char.toUpperCase() : char;
    const isPressed = pressedKeyId === keyId;

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
        className={`touch-keycap relative flex-1 min-w-0 ${keyHeightClass} rounded-[6px] font-semibold ${
          hasNumberRow ? 'text-[17px] sm:text-[19px] md:text-[21px]' : 'text-[19px] sm:text-[21px] md:text-[23px]'
        } flex items-center justify-center transition-colors cursor-default font-sans select-none ${
          isPressed ? 'touch-keycap-pressed z-20' : 'z-10'
        }`}
      >
        {!hasNumberRow && layoutMode === 'alpha' && rowIndex === 1 && (
          <span aria-hidden="true" className="absolute left-1.5 top-1 text-[9px] sm:text-[10px] font-medium text-black/45">
            {rowNumbers[colIndex]}
          </span>
        )}
        <span className="relative z-10">{displayChar}</span>
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
      className={`touch-keyboard-shell fixed inset-x-0 bottom-0 z-50 rounded-none bg-white/50 backdrop-blur-2xl border-t border-black/10 transition-all duration-[440ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] will-change-transform select-none flex flex-col justify-between ${
        isOpen ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      <div className="w-full max-w-full md:max-w-full lg:max-w-[98%] xl:max-w-[97%] 2xl:max-w-[96%] mx-auto flex flex-col justify-between h-full px-1.5 sm:px-2 md:px-2.5 lg:px-3 pt-1 pb-1.5 sm:pb-2">
        {/* Top bar with Switch to device's keyboard button and emoji search bar when in emoji mode */}
        <div className="touch-keyboard-header relative flex items-center justify-between gap-2 px-1 pt-0.5 pb-1 select-none min-h-[36px] border-b border-black/10">
          {/* Compact switch to the device keyboard button */}
          <button
            type="button"
            id="btn-switch-to-device-keyboard"
            onMouseDown={(e) => e.preventDefault()}
            onPointerDown={(e) => {
              e.preventDefault();
              playSound('action');
            }}
            onClick={() => {
              switchToDeviceKeyboard();
            }}
            className="flex h-7 w-7 items-center justify-center rounded-md bg-transparent text-black/70 hover:bg-black/[0.06] active:bg-black/[0.1] transition-colors cursor-default shrink-0"
            title="Switch to device's keyboard"
            aria-label="Switch to device's keyboard"
          >
              <Keyboard className="w-4 h-4 text-black/70 shrink-0" />
          </button>

          {/* Search field for the emoji board */}
          {showEmojiPicker && (
            <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center shrink-0 w-48 xs:w-56 sm:w-72 md:w-84 h-8 rounded-[10px] bg-white/70 border border-black/10 px-3 gap-2 transition-all focus-within:bg-white/85 focus-within:border-[#0078d4] focus-within:ring-1 focus-within:ring-[#0078d4]/25 shadow-xs">
              <FluentSearchIcon className="w-[15px] h-[15px] text-[#6b7280] shrink-0 pointer-events-none select-none" />
              <input
                type="text"
                value={emojiSearchQuery}
                onChange={(e) => setEmojiSearchQuery(e.target.value)}
                placeholder="Tìm kiếm emoji..."
                className="flex-1 min-w-0 bg-transparent text-xs sm:text-[13px] text-[#1f2937] placeholder-[#6b7280] outline-none border-none py-0.5 pr-1 font-sans"
              />
              {emojiSearchQuery && (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setEmojiSearchQuery('')}
                  className="p-0.5 text-[#71717a] hover:text-black transition-colors cursor-pointer"
                  title="Xóa tìm kiếm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Active input hint / indicator & Dismiss button - Pinned to right */}
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {!showEmojiPicker && (
              <span className="sr-only">
                {activeInput?.placeholder || 'Sparkle Keyboard'}
              </span>
            )}

            {/* Dismiss button */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onPointerDown={(e) => {
                e.preventDefault();
                playSound('action');
              }}
              onClick={closeKeyboard}
              className="p-1 rounded-md text-black/70 hover:bg-black/[0.06] transition-colors cursor-default"
              title="Đóng bàn phím"
              aria-label="Đóng bàn phím"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {showClipboard ? (
          /* Clipboard History Tray */
          <div className="flex-1 flex flex-col justify-between px-1.5 py-1 min-h-0 overflow-hidden">
            {/* Clipboard Header */}
            <div className="flex items-center justify-between pb-1 px-1 border-b border-black/10 shrink-0">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-black" />
                <span className="text-xs font-bold text-black tracking-tight">Lịch sử sao chép (Clipboard)</span>
                {copiedFeedback && (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full animate-in fade-in duration-150">
                    {copiedFeedback}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {/* Paste from device button */}
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onPointerDown={(e) => {
                    playSound('action');
                  }}
                  onClick={handlePasteFromDevice}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/10 hover:bg-black/15 active:bg-black/20 text-black text-[11px] font-medium transition-colors cursor-default"
                  title="Dán từ bộ nhớ tạm của thiết bị"
                >
                  <Copy className="w-3 h-3 text-black" />
                  <span>Dán từ thiết bị</span>
                </button>

                {/* Clear all if items exist */}
                {clipboardList.length > 0 && (
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onPointerDown={(e) => {
                      playSound('delete');
                    }}
                    onClick={handleClearAllClipboard}
                    className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 text-red-700 text-[11px] font-medium transition-colors cursor-default"
                    title="Xóa tất cả lịch sử sao chép"
                  >
                    <FluentDeleteIcon className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">Xóa tất cả</span>
                  </button>
                )}

                {/* Close panel */}
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onPointerDown={() => playSound('modifier')}
                  onClick={() => setShowClipboard(false)}
                  className="p-1 rounded-full text-black hover:bg-black/10 transition-colors cursor-default"
                  title="Quay lại bàn phím"
                >
                  <X className="w-4 h-4 text-black" />
                </button>
              </div>
            </div>

            {/* Clipboard search pill */}
            <div className="relative flex items-center w-full h-7.5 rounded-[100px] bg-white border border-black/15 px-3 gap-2 transition-all focus-within:bg-white focus-within:border-[#55c5f4] focus-within:ring-1 focus-within:ring-[#55c5f4]/35 shadow-xs my-1 shrink-0">
              <FluentSearchIcon className="w-3.5 h-3.5 text-[#71717a] shrink-0 pointer-events-none select-none" />
              <input
                type="text"
                value={clipboardSearchQuery}
                onChange={(e) => setClipboardSearchQuery(e.target.value)}
                placeholder="Tìm kiếm trong lịch sử sao chép..."
                className="flex-1 min-w-0 bg-transparent text-xs text-[#111827] placeholder-[#71717a] outline-none border-none py-0.5 font-sans"
              />
              {clipboardSearchQuery && (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setClipboardSearchQuery('')}
                  className="p-0.5 text-[#71717a] hover:text-black transition-colors cursor-pointer"
                  title="Xóa tìm kiếm"
                >
                  <X className="w-3 h-3" />
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
                  <div className="h-full flex flex-col items-center justify-center py-6 text-center text-black/70 space-y-1.5">
                    <div className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center text-black/50">
                      <ClipboardList className="w-4.5 h-4.5" />
                    </div>
                    <div className="text-xs font-semibold text-black">Chưa có nội dung sao chép nào</div>
                    <div className="text-[11px] text-black/60 max-w-sm px-4 leading-normal">
                      Mọi văn bản bạn sao chép trong ứng dụng sẽ tự động lưu lại đây để chạm và dán nhanh.
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

            {/* Bottom bar of Clipboard view */}
            <div className="flex items-center justify-between pt-1 border-t border-black/10 shrink-0">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onPointerDown={() => playSound('modifier')}
                onClick={() => setShowClipboard(false)}
                className="px-4 py-1.5 rounded-xl bg-white/50 text-xs font-semibold text-black border border-white/25 hover:bg-white/70 transition-colors cursor-default"
              >
                Bàn phím
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onPointerDown={() => playSound('action')}
                onClick={closeKeyboard}
                className="px-4 py-1.5 rounded-lg bg-[#48c3f2] hover:bg-[#66d0f7] active:bg-[#34a9d7] text-xs font-bold text-[#08212a] shadow-xs transition-colors cursor-default"
              >
                Xong
              </button>
            </div>
          </div>
        ) : showEmojiPicker ? (
          /* Full Horizontal Scrolling Emoji Board with Unicode Categories */
          <EmojiBoard
            searchQuery={emojiSearchQuery}
            onInsertEmoji={(emoji) => handleCharPress(emoji)}
            onDeleteChar={deleteChar}
            onCloseKeyboard={closeKeyboard}
            onSwitchToABC={() => {
              setShowEmojiPicker(false);
              setEmojiSearchQuery('');
            }}
          />
        ) : (
          /* Standard keyboard grid with charcoal keycaps and press bubbles */
          <div className="flex flex-col gap-1 sm:gap-1.5 md:gap-2 flex-1 justify-center">
            {/* ROW 0: Dedicated Number Row (Bàn phím số: 0 đến 9 trên dải phím chữ) */}
            {hasNumberRow && (
              <div className="flex items-center justify-between gap-1 sm:gap-1.5 md:gap-2 w-full">
                {rowNumbers.map((char, colIndex, arr) =>
                  renderCharKey(char, 0, colIndex, arr.length)
                )}
              </div>
            )}

            {/* ROW 1 */}
            <div className="flex items-center justify-between gap-1 sm:gap-1.5 md:gap-2 w-full">
              {(layoutMode === 'alpha' ? row1Alpha : layoutMode === 'numeric' ? row1Num : row1Sym).map((char, colIndex, arr) =>
                renderCharKey(char, 1, colIndex, arr.length)
              )}
            </div>

            {/* ROW 2 (indented with reduced safe area) */}
            <div className="flex items-center justify-between gap-1 sm:gap-1.5 md:gap-2 w-full px-[2.5%] sm:px-[2.5%] md:px-[2.5%]">
              {(layoutMode === 'alpha' ? row2Alpha : layoutMode === 'numeric' ? row2Num : row2Sym).map((char, colIndex, arr) =>
                renderCharKey(char, 2, colIndex, arr.length)
              )}
            </div>

            {/* ROW 3: Shift / Mode, Characters, Backspace */}
            <div className="flex items-center justify-between gap-1 sm:gap-1.5 md:gap-2 w-full">
              {layoutMode === 'alpha' ? (
                /* Shift key with an accent state for Caps Lock and Shift */
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    playSound('modifier');
                    setPressedKeyId('shift');
                    if (navigator.vibrate) {
                      try { navigator.vibrate(10); } catch {}
                    }
                  }}
                  onPointerUp={() => setPressedKeyId(null)}
                  onPointerLeave={() => setPressedKeyId(null)}
                  onPointerCancel={() => setPressedKeyId(null)}
                  onClick={handleShiftTap}
                  className={`touch-keycap w-[13.5%] min-w-[38px] sm:min-w-[48px] ${keyHeightClass} rounded-[6px] flex items-center justify-center transition-colors cursor-default border ${
                    isCapsLock || isShiftActive ? 'touch-keycap-active' : ''
                  } ${pressedKeyId === 'shift' ? 'touch-keycap-pressed' : ''}`}
                  title={isCapsLock ? 'Caps Lock BẬT' : isShiftActive ? 'Shift BẬT' : 'Shift'}
                  aria-label="Shift"
                >
                  <ArrowBigUp className={`w-5 h-5 text-black ${isCapsLock || isShiftActive ? 'fill-black' : ''}`} />
                </button>
              ) : (
                /* #+= or 123 layout toggle */
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    playSound('modifier');
                    setPressedKeyId('sym-mode');
                  }}
                  onPointerUp={() => setPressedKeyId(null)}
                  onPointerLeave={() => setPressedKeyId(null)}
                  onPointerCancel={() => setPressedKeyId(null)}
                  onClick={() => {
                    setLayoutMode(layoutMode === 'numeric' ? 'symbols' : 'numeric');
                  }}
                  className={`touch-keycap w-[13.5%] min-w-[38px] sm:min-w-[48px] ${keyHeightClass} rounded-[6px] text-xs sm:text-sm font-semibold flex items-center justify-center transition-colors cursor-default font-sans ${
                    pressedKeyId === 'sym-mode' ? 'touch-keycap-pressed' : ''
                  }`}
                >
                  {layoutMode === 'numeric' ? '#+=' : '123'}
                </button>
              )}

              {/* Characters */}
              {(layoutMode === 'alpha' ? row3Alpha : layoutMode === 'numeric' ? row3Num : row3Sym).map((char, colIndex, arr) =>
                renderCharKey(char, 3, colIndex, arr.length)
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
                className={`touch-keycap w-[13.5%] min-w-[38px] sm:min-w-[48px] ${keyHeightClass} rounded-[6px] flex items-center justify-center transition-colors cursor-default ${
                  pressedKeyId === 'backspace' ? 'touch-keycap-pressed' : ''
                }`}
                title="Xóa"
                aria-label="Xóa"
              >
                <Delete className="w-5 h-5 text-black" />
              </button>
            </div>

            {/* ROW 4: Layout, merged tools (+), space, voice and search */}
            <div className="flex w-full items-center gap-1 sm:gap-1.5 md:gap-2">
              {/* Layout switch: 123 or ABC */}
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
                className={`touch-keycap h-[42px] w-[7%] min-w-[42px] shrink-0 rounded-[6px] flex items-center justify-center text-xs font-semibold transition-colors cursor-default font-sans sm:h-[46px] sm:min-w-[50px] sm:text-sm md:h-[50px] md:min-w-[56px] ${
                  pressedKeyId === 'layout-mode' ? 'touch-keycap-pressed' : ''
                }`}
                aria-label={layoutMode === 'alpha' ? 'Chuyển sang phím số' : 'Chuyển sang phím chữ'}
              >
                {layoutMode === 'alpha' ? '123' : 'ABC'}
              </button>

              {/* Merged Tools Key (+): Combines Emoji, Clipboard, and Language into 1 key with context menu flyout */}
              <button
                ref={plusBtnRef}
                type="button"
                id="btn-native-keyboard-tools"
                onMouseDown={(e) => e.preventDefault()}
                onPointerDown={(e) => {
                  e.preventDefault();
                  playSound('modifier');
                  setPressedKeyId('plus-btn');
                }}
                onPointerUp={() => setPressedKeyId(null)}
                onPointerLeave={() => setPressedKeyId(null)}
                onPointerCancel={() => setPressedKeyId(null)}
                onClick={() => {
                  if (!showPlusMenu && plusBtnRef.current) {
                    const rect = plusBtnRef.current.getBoundingClientRect();
                    const bottomOffset = window.innerHeight - rect.top + 8;
                    const leftOffset = Math.max(8, Math.min(rect.left, window.innerWidth - 248));
                    setPlusMenuPos({ left: leftOffset, bottom: bottomOffset });
                  }
                  setShowPlusMenu((prev) => !prev);
                }}
                className={`touch-keycap h-[42px] w-[7%] min-w-[44px] shrink-0 rounded-[6px] flex items-center justify-center transition-colors cursor-default sm:h-[46px] sm:min-w-[50px] md:h-[50px] md:min-w-[54px] ${
                  showPlusMenu ? 'touch-keycap-active' : ''
                } ${pressedKeyId === 'plus-btn' ? 'touch-keycap-pressed' : ''}`}
                title="Tiện ích & Ngôn ngữ (+)"
                aria-label="Tiện ích & Ngôn ngữ (+)"
                aria-haspopup="menu"
                aria-expanded={showPlusMenu}
              >
                <Plus className="w-5 h-5 text-black stroke-[2.2]" />
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
                className={`touch-keycap flex-1 min-w-[32px] h-[42px] sm:h-[46px] md:h-[50px] rounded-[6px] font-semibold text-sm flex items-center justify-center transition-colors cursor-default ${
                  pressedKeyId === 'spacebar' ? 'touch-keycap-pressed' : ''
                }`}
                aria-label="Phím cách"
              >
                <span className="text-[11px] sm:text-xs text-black font-semibold font-sans tracking-wide truncate px-1 sm:px-2">
                  {inputMethod === 'vi-telex'
                    ? 'cách • Tiếng Việt (Telex)'
                    : inputMethod === 'vi-vni'
                    ? 'cách • Tiếng Việt (VNI)'
                    : 'space • Tiếng Anh'}
                </span>
              </button>

              {/* Microphone, adjacent to search */}
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
                className={`touch-keycap h-[42px] w-[7%] min-w-[38px] shrink-0 rounded-[6px] flex items-center justify-center transition-colors cursor-default sm:h-[46px] sm:min-w-[46px] md:h-[50px] ${
                  isMicListening ? 'touch-keycap-active' : ''
                } ${pressedKeyId === 'mic-btn' ? 'touch-keycap-pressed' : ''}`}
                title={isMicListening ? 'Đang nghe...' : 'Nhập bằng giọng nói'}
                aria-label={isMicListening ? 'Đang nghe, dừng nhập bằng giọng nói' : 'Nhập bằng giọng nói'}
                aria-pressed={isMicListening}
              >
                <Mic className="w-5 h-5" />
              </button>

              {/* Search / action button */}
              <button
                type="button"
                id="btn-native-keyboard-search"
                onMouseDown={(e) => e.preventDefault()}
                onPointerDown={(e) => {
                  e.preventDefault();
                  playSound('action');
                  setPressedKeyId('search-btn');
                  if (navigator.vibrate) {
                    try { navigator.vibrate(16); } catch {}
                  }
                }}
                onPointerUp={() => setPressedKeyId(null)}
                onPointerLeave={() => setPressedKeyId(null)}
                onPointerCancel={() => setPressedKeyId(null)}
                onClick={handleSearchAction}
                className={`touch-keycap h-[42px] w-[8%] min-w-[50px] shrink-0 rounded-[6px] flex items-center justify-center transition-colors cursor-default sm:h-[46px] sm:min-w-[58px] md:h-[50px] ${
                  pressedKeyId === 'search-btn' ? 'touch-keycap-pressed' : ''
                }`}
                title="Tìm kiếm"
                aria-label="Tìm kiếm"
              >
                <Search className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {/* Plus Tools & Language Selection Flyout Context Menu (Styled and animated exactly like GalleryContextMenu) */}
        {typeof document !== 'undefined' &&
          createPortal(
            <AnimatePresence>
              {showPlusMenu && (
                <motion.div
                  id="native-keyboard-plus-menu"
                  role="menu"
                  aria-label="Tiện ích & Ngôn ngữ"
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 14 }}
                  transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                  onContextMenu={(e) => e.preventDefault()}
                  className={`fixed z-[2147483647] w-[232px] ${flyoutPanelClassName} fluent-context-menu select-none`}
                  style={{
                    ...flyoutPanelStyle,
                    left: `${plusMenuPos.left}px`,
                    bottom: `${plusMenuPos.bottom}px`,
                  }}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0, transition: { duration: 0.38, delay: 0, ease: [0.16, 1, 0.3, 1] } }}
                    className="px-3 py-1.5 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider"
                  >
                    Tiện ích
                  </motion.div>

                  {/* Emoji option */}
                  <motion.button
                    type="button"
                    role="menuitem"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.38, delay: 0.04, ease: [0.16, 1, 0.3, 1] },
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      playSound('action');
                    }}
                    onClick={() => {
                      setShowPlusMenu(false);
                      setShowClipboard(false);
                      setShowEmojiPicker(true);
                    }}
                    className="w-full h-[36px] px-3 rounded-[6px] flex items-center gap-3 text-[13px] font-medium text-left outline-none transition-colors cursor-pointer hover:bg-black/[0.05] focus-visible:bg-black/[0.05] active:bg-black/[0.08] text-[#111827]"
                  >
                    <Smile className="w-4 h-4 shrink-0 text-black stroke-black" />
                    <span className="truncate">Biểu tượng cảm xúc</span>
                  </motion.button>

                  {/* Clipboard option */}
                  <motion.button
                    type="button"
                    role="menuitem"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.38, delay: 0.08, ease: [0.16, 1, 0.3, 1] },
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      playSound('action');
                    }}
                    onClick={() => {
                      setShowPlusMenu(false);
                      setShowEmojiPicker(false);
                      setShowClipboard(true);
                    }}
                    className="w-full h-[36px] px-3 rounded-[6px] flex items-center gap-3 text-[13px] font-medium text-left outline-none transition-colors cursor-pointer hover:bg-black/[0.05] focus-visible:bg-black/[0.05] active:bg-black/[0.08] text-[#111827]"
                  >
                    <ClipboardList className="w-4 h-4 shrink-0 text-black stroke-black" />
                    <span className="truncate">Lịch sử sao chép</span>
                  </motion.button>

                  {/* Separator */}
                  <motion.div
                    role="separator"
                    initial={{ opacity: 0, scaleX: 0.8 }}
                    animate={{
                      opacity: 1,
                      scaleX: 1,
                      transition: { duration: 0.38, delay: 0.12, ease: [0.16, 1, 0.3, 1] },
                    }}
                    className="h-px bg-black/10 my-1 mx-1 origin-left"
                  />

                  {/* Languages Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0, transition: { duration: 0.38, delay: 0.16, ease: [0.16, 1, 0.3, 1] } }}
                    className="px-3 py-1.5 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wider flex items-center justify-between"
                  >
                    <span>Ngôn ngữ gõ</span>
                    <Globe className="w-3.5 h-3.5 text-black stroke-black" />
                  </motion.div>

                  <div className="space-y-0.5 mt-0.5">
                    {LANGUAGE_OPTIONS.map((lang, idx) => {
                      const isSelected = inputMethod === lang.id;
                      return (
                        <motion.button
                          key={lang.id}
                          type="button"
                          role="menuitem"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{
                            opacity: 1,
                            y: 0,
                            transition: {
                              duration: 0.38,
                              delay: 0.2 + idx * 0.04,
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
                            setShowPlusMenu(false);
                          }}
                          className="w-full h-[36px] px-3 rounded-[6px] flex items-center justify-between text-[13px] font-medium text-left outline-none transition-colors cursor-pointer hover:bg-black/[0.05] focus-visible:bg-black/[0.05] active:bg-black/[0.08] text-[#111827]"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-base leading-none shrink-0">{lang.flag}</span>
                            <span className="truncate">{lang.label}</span>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 shrink-0 text-black stroke-black" />
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
