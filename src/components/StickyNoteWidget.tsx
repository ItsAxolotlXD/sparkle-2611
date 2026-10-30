import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Palette, 
  X, 
  Minus, 
  Maximize2, 
  ExternalLink, 
  GripHorizontal,
  Check
} from 'lucide-react';
import { FluentNotesIcon as StickyIcon } from './FluentIcons';
import { useNotes, STICKY_COLORS } from '../context/NotesContext';

interface StickyNoteWidgetProps {
  onNavigateNotes?: () => void;
}

export const StickyNoteWidget: React.FC<StickyNoteWidgetProps> = ({ onNavigateNotes }) => {
  const {
    noteTitle,
    setNoteTitle,
    noteContent,
    setNoteContent,
    stickyColorId,
    setStickyColorId,
    currentStickyColor,
    isStickyVisible,
    setIsStickyVisible,
    isStickyMinimized,
    setIsStickyMinimized,
    stickyPosition,
    setStickyPosition,
    stickySize,
    setStickySize,
  } = useNotes();

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({ startX: 0, startY: 0, startW: 320, startH: 280 });
  const stickyRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Sync content with contentRef when content changes or when expanding from minimized
  useEffect(() => {
    if (contentRef.current && !isStickyMinimized) {
      if (contentRef.current.innerHTML !== noteContent) {
        if (document.activeElement !== contentRef.current) {
          contentRef.current.innerHTML = noteContent;
        }
      }
    }
  }, [noteContent, isStickyMinimized]);

  // Handle Dragging
  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('.no-drag')) {
      return;
    }
    e.preventDefault();
    setIsDragging(true);
    const clientX = e.clientX;
    const clientY = e.clientY;
    dragOffsetRef.current = {
      x: clientX - stickyPosition.x,
      y: clientY - stickyPosition.y,
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragOffsetRef.current.x;
    const newY = e.clientY - dragOffsetRef.current.y;
    const currentW = isStickyMinimized ? 160 : (stickySize?.width || 320);
    const currentH = isStickyMinimized ? 48 : (stickySize?.height || 280);
    const maxX = Math.max(0, window.innerWidth - currentW);
    const maxY = Math.max(0, window.innerHeight - currentH);
    const clampedX = Math.min(Math.max(5, newX), maxX);
    const clampedY = Math.min(Math.max(5, newY), maxY);
    setStickyPosition({ x: clampedX, y: clampedY });
  }, [isDragging, isStickyMinimized, stickySize, setStickyPosition]);

  const handlePointerUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
    }
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [isDragging, handlePointerMove, handlePointerUp]);

  // Handle Resizing
  const handleResizePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startW: stickySize?.width || 320,
      startH: stickySize?.height || 280,
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handleResizePointerMove = useCallback((e: PointerEvent) => {
    if (!isResizing) return;
    const deltaX = e.clientX - resizeStartRef.current.startX;
    const deltaY = e.clientY - resizeStartRef.current.startY;
    const newW = Math.max(220, Math.min(window.innerWidth - stickyPosition.x - 10, resizeStartRef.current.startW + deltaX));
    const newH = Math.max(160, Math.min(window.innerHeight - stickyPosition.y - 10, resizeStartRef.current.startH + deltaY));
    setStickySize({ width: Math.round(newW), height: Math.round(newH) });
  }, [isResizing, stickyPosition, setStickySize]);

  const handleResizePointerUp = useCallback(() => {
    if (isResizing) {
      setIsResizing(false);
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('pointermove', handleResizePointerMove);
      window.addEventListener('pointerup', handleResizePointerUp);
      return () => {
        window.removeEventListener('pointermove', handleResizePointerMove);
        window.removeEventListener('pointerup', handleResizePointerUp);
      };
    }
  }, [isResizing, handleResizePointerMove, handleResizePointerUp]);

  if (!isStickyVisible) return null;

  // Minimized Floating Pill - content is NOT lost when minimized!
  if (isStickyMinimized) {
    return (
      <div
        ref={stickyRef}
        style={{
          transform: `translate3d(${stickyPosition.x}px, ${stickyPosition.y}px, 0)`,
          backgroundColor: currentStickyColor.headerBg,
          borderColor: currentStickyColor.border,
          color: currentStickyColor.text,
        }}
        onPointerDown={handlePointerDown}
        className="fixed top-0 left-0 z-50 flex items-center gap-2 px-3 py-2 rounded-full border shadow-xl cursor-grab active:cursor-grabbing select-none transition-shadow hover:shadow-2xl"
      >
        <StickyIcon className="w-4 h-4 shrink-0" style={{ color: currentStickyColor.accent }} />
        <span className="text-xs font-semibold truncate max-w-[130px]">
          {noteTitle || 'Sticky Note'}
        </span>
        <button
          type="button"
          onClick={() => setIsStickyMinimized(false)}
          className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors cursor-pointer"
          title="Mở rộng Sticky Note"
        >
          <Maximize2 className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={() => setIsStickyVisible(false)}
          className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors cursor-pointer"
          title="Đóng Sticky Note"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  const currentWidth = stickySize?.width || 320;
  const currentHeight = stickySize?.height || 280;

  return (
    <div
      ref={stickyRef}
      style={{
        transform: `translate3d(${stickyPosition.x}px, ${stickyPosition.y}px, 0)`,
        width: `${currentWidth}px`,
        height: `${currentHeight}px`,
        backgroundColor: currentStickyColor.bg,
        borderColor: currentStickyColor.border,
        color: currentStickyColor.text,
      }}
      className={`fixed top-0 left-0 z-50 rounded-xl border shadow-2xl flex flex-col overflow-hidden transition-shadow select-none ${
        isDragging || isResizing ? 'shadow-3xl ring-2 ring-[#4cc2ff]/50' : ''
      }`}
    >
      {/* 1. Header Bar (Draggable) */}
      <div
        onPointerDown={handlePointerDown}
        style={{ backgroundColor: currentStickyColor.headerBg }}
        className="h-10 px-3 flex items-center justify-between border-b cursor-grab active:cursor-grabbing border-black/10 shrink-0 select-none"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <GripHorizontal className="w-4 h-4 opacity-40 shrink-0" />
          <StickyIcon className="w-3.5 h-3.5 shrink-0" style={{ color: currentStickyColor.accent }} />
          <input
            type="text"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            className="text-xs font-bold bg-transparent border-none outline-none truncate w-28 sm:w-36 focus:bg-white/20 rounded px-1"
            placeholder="Tiêu đề sticky..."
            onPointerDown={(e) => e.stopPropagation()}
          />
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Color Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-6 h-6 rounded flex items-center justify-center hover:bg-black/10 transition-colors cursor-pointer"
              title="Đổi màu Stickies"
            >
              <Palette className="w-3.5 h-3.5" />
            </button>
            {showColorPicker && (
              <div
                className="absolute right-0 mt-1 p-2 bg-[#282832] border border-[#3e3e48] rounded-lg shadow-2xl grid grid-cols-4 gap-1.5 z-50"
                onClick={(e) => e.stopPropagation()}
              >
                {STICKY_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setStickyColorId(c.id);
                      setShowColorPicker(false);
                    }}
                    className="w-6 h-6 rounded-full border border-white/20 transition-colors flex items-center justify-center cursor-pointer"
                    style={{ backgroundColor: c.bg }}
                    title={c.name}
                  >
                    {stickyColorId === c.id && (
                      <Check className="w-3 h-3 text-black font-bold" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Navigate to full Notes */}
          {onNavigateNotes && (
            <button
              type="button"
              onClick={onNavigateNotes}
              className="w-6 h-6 rounded flex items-center justify-center hover:bg-black/10 transition-colors cursor-pointer"
              title="Mở toàn màn hình Notes"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Minimize (- button): minimizes without losing content */}
          <button
            type="button"
            onClick={() => {
              // Ensure content is saved before minimizing
              if (contentRef.current) {
                setNoteContent(contentRef.current.innerHTML);
              }
              setIsStickyMinimized(true);
            }}
            className="w-6 h-6 rounded flex items-center justify-center hover:bg-black/10 transition-colors cursor-pointer"
            title="Thu nhỏ thành thanh nhỏ"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={() => {
              if (contentRef.current) {
                setNoteContent(contentRef.current.innerHTML);
              }
              setIsStickyVisible(false);
            }}
            className="w-6 h-6 rounded flex items-center justify-center hover:bg-black/10 transition-colors cursor-pointer"
            title="Đóng Stickies"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Content Editable Body */}
      <div
        className="p-3 flex-1 overflow-y-auto cursor-text select-text text-sm focus:outline-none"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div
          ref={(el) => {
            contentRef.current = el;
            if (el && document.activeElement !== el && el.innerHTML !== (noteContent || '')) {
              el.innerHTML = noteContent || '';
            }
          }}
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => {
            const html = e.currentTarget.innerHTML;
            setNoteContent(html);
          }}
          onBlur={(e) => {
            const html = e.currentTarget.innerHTML;
            setNoteContent(html);
          }}
          className="outline-none min-h-[120px] leading-relaxed break-words font-sans"
          style={{ color: currentStickyColor.text }}
        />
      </div>

      {/* 3. Bottom Footer Info & Resize Handle */}
      <div
        style={{ backgroundColor: currentStickyColor.headerBg }}
        className="h-6 px-3 text-[10px] opacity-75 border-t border-black/5 flex items-center justify-between shrink-0 select-none relative"
      >
        <span>Sparkle Sticky Note</span>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline">Kéo góc để chỉnh kích cỡ</span>
          {/* Resize Corner Handle */}
          <div
            onPointerDown={handleResizePointerDown}
            className="w-4 h-4 -mr-1.5 flex items-center justify-center cursor-nwse-resize hover:opacity-100 opacity-60 text-current select-none"
            title="Kéo để thay đổi kích cỡ (Resize)"
          >
            <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 fill-current">
              <circle cx="8" cy="8" r="1.2" />
              <circle cx="4" cy="8" r="1.2" />
              <circle cx="8" cy="4" r="1.2" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
