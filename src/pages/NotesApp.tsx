import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Heading1, 
  Heading2, 
  List, 
  ListOrdered, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  ChevronDown, 
  Check, 
  Undo2, 
  Redo2, 
  Highlighter, 
  RemoveFormatting, 
  Type, 
  Plus, 
  Pin, 
  Clock, 
  Sparkles, 
  Save,
  FileText,
  Palette,
  Minus
} from 'lucide-react';
import { FluentNotesIcon, FluentDeleteIcon } from '../components/FluentIcons';
import { exportDocx, exportWritePdf } from '../utils/officeExport';
import { galleryDB, GalleryMediaItem } from '../services/galleryStorage';
import { useNotes, STICKY_COLORS, NoteItem } from '../context/NotesContext';
import { flyoutPanelClassName, flyoutPanelStyle } from '../components/FlyoutDropdown';
import { PromptDialog } from '../components/gallery/GalleryDialogs';
import { WinUI3ColorPickerModal, type ColorTarget } from '../components/WinUI3ColorPickerModal';

export interface UnsavedNoteHandler {
  isDirty: boolean;
  noteTitle: string;
  save: () => void;
  discard: () => void;
}

interface NotesAppProps {
  navigate: (route: string) => void;
  onEnterEditor?: () => void;
  onRegisterUnsavedNote?: (handler: UnsavedNoteHandler | null) => void;
}

export interface FontOption {
  id: string;
  name: string;
  fontFamily: string;
}

export const PRESET_FONTS: FontOption[] = [
  { id: 'segoe-ui', name: 'Segoe UI', fontFamily: "'Segoe UI', 'Be Vietnam Pro', 'Inter', system-ui, sans-serif" },
  { id: 'be-vietnam-pro', name: 'Be Vietnam Pro', fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" },
  { id: 'inter', name: 'Inter', fontFamily: "'Inter', sans-serif" },
  { id: 'roboto', name: 'Roboto', fontFamily: "'Roboto', sans-serif" },
  { id: 'georgia', name: 'Georgia', fontFamily: "Georgia, serif" },
  { id: 'courier-new', name: 'Courier New', fontFamily: "'Courier New', Courier, monospace" }
];

const PRESET_SIZES = [12, 14, 16, 18, 20, 24, 28, 32];

const slideUpVariant = {
  hidden: { opacity: 0, y: 22 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.52,
      ease: [0.16, 1, 0.3, 1],
      delay: Math.min(i * 0.046, 1.1),
    },
  }),
};

function stripHtml(html: string): string {
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html || '';
  return tmp.textContent || tmp.innerText || '';
}

export const NOTE_ICON_URL =
  'https://upload.wikimedia.org/wikipedia/commons/c/c9/Windows_Notepad_icon.png?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=original';

function formatNoteDate(timestamp?: number): string {
  if (!timestamp) return 'Gần đây';
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    const hours = date.getHours().toString().padStart(2, '0');
    const mins = date.getMinutes().toString().padStart(2, '0');
    return `Hôm nay, ${hours}:${mins}`;
  }
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

interface NoteContextMenuProps {
  x: number;
  y: number;
  noteId: string;
  isPinned: boolean;
  onAction: (action: 'open' | 'pin' | 'rename' | 'docx' | 'pdf' | 'delete') => void;
  onClose: () => void;
}

const NoteContextMenu: React.FC<NoteContextMenuProps> = ({ x, y, isPinned, onAction, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: x, top: y });

  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const { width, height } = menu.getBoundingClientRect();
    setPosition({
      left: Math.max(8, Math.min(x, window.innerWidth - width - 8)),
      top: Math.max(8, y > window.innerHeight - height - 8 ? y - height : y),
    });
  }, [x, y]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    // Small delay ensures initiating right-click event lifecycle finishes before listening
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('contextmenu', handleOutsideClick);
    }, 40);

    document.addEventListener('keydown', handleKey);
    window.addEventListener('resize', onClose);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('contextmenu', handleOutsideClick);
      document.removeEventListener('keydown', handleKey);
      window.removeEventListener('resize', onClose);
    };
  }, [onClose]);

  const items: Array<{
    action: 'open' | 'pin' | 'rename' | 'docx' | 'pdf' | 'delete';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    danger?: boolean;
  }> = [
    { action: 'open', label: 'Open note', icon: FileText },
    { action: 'pin', label: isPinned ? 'Unpin' : 'Pin to top', icon: Pin },
    { action: 'rename', label: 'Rename', icon: Sparkles },
    { action: 'docx', label: 'Export Word (.docx)', icon: FileText },
    { action: 'pdf', label: 'Export PDF (.pdf)', icon: FileText },
    { action: 'delete', label: 'Delete note', icon: FluentDeleteIcon, danger: true },
  ];

  return createPortal(
    <motion.div
      ref={menuRef}
      role="menu"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      onContextMenu={(e) => e.preventDefault()}
      onMouseDown={(e) => e.stopPropagation()}
      className={`fixed z-[2147483647] w-[220px] ${flyoutPanelClassName} fluent-context-menu`}
      style={{ ...flyoutPanelStyle, left: position.left, top: position.top }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.action}
            type="button"
            role="menuitem"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAction(item.action);
            }}
            className={`w-full h-[36px] px-3 rounded-[6px] flex items-center gap-3 text-[13px] font-medium text-left outline-none transition-colors cursor-pointer hover:bg-black/[0.05] dark:hover:bg-white/[0.08] ${
              item.danger ? 'text-[#c42b1c] dark:text-[#ff99a4]' : 'text-[#111827] dark:text-white'
            }`}
          >
            <Icon className={`w-4 h-4 shrink-0 ${item.danger ? 'text-black dark:text-[#ff99a4]' : 'text-black dark:text-neutral-300'}`} />
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </motion.div>,
    document.body
  );
};

export const NotesApp: React.FC<NotesAppProps> = ({ 
  navigate, 
  onEnterEditor, 
  onRegisterUnsavedNote 
}) => {
  const {
    notes,
    activeNoteId,
    activeNote,
    createNote,
    deleteNote,
    updateNote,
    togglePinNote,
    setActiveNoteId,
    isStickyVisible,
    setIsStickyVisible,
    currentStickyColor,
    stickyColorId,
    setStickyColorId,
  } = useNotes();

  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(() => {
    const parts = window.location.pathname.split('/');
    const last = parts[parts.length - 1];
    if (last && last !== 'notes' && last !== 'write' && last !== 'present' && last !== 'table') {
      return last;
    }
    return null;
  });

  const [isCreateNoteOpen, setIsCreateNoteOpen] = useState(false);
  const [noteTilt, setNoteTilt] = useState<Record<string, { x: number; y: number }>>({});
  const [noteContextMenu, setNoteContextMenu] = useState<{ x: number; y: number; noteId: string } | null>(null);

  // Sync route param with selectedNoteId
  useEffect(() => {
    const parts = window.location.pathname.split('/');
    const last = parts[parts.length - 1];
    if (!last || last === 'notes' || last === 'write' || last === 'present' || last === 'table') {
      setSelectedNoteId(null);
    } else {
      setSelectedNoteId(last);
      setActiveNoteId(last);
    }
  }, [setActiveNoteId]);

  // When entering note editor, auto-collapse sidebar
  useEffect(() => {
    if (selectedNoteId) {
      onEnterEditor?.();
    }
  }, [selectedNoteId, onEnterEditor]);

  // Current note being edited in WinUI 3 Editor
  const currentNote = useMemo(() => {
    if (!selectedNoteId) return null;
    return notes.find((n) => n.id === selectedNoteId) || activeNote || notes[0] || null;
  }, [selectedNoteId, notes, activeNote]);

  // WinUI 3 Editor State with Unsaved Changes tracking
  const editorRef = useRef<HTMLDivElement>(null);
  const [selectedFont, setSelectedFont] = useState<FontOption>(PRESET_FONTS[0]);
  const [activeFontSize, setActiveFontSize] = useState<number>(16);
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showSizeMenu, setShowSizeMenu] = useState(false);

  // Unsaved changes state
  const [savedTitle, setSavedTitle] = useState<string>('');
  const [savedContent, setSavedContent] = useState<string>('');
  const [draftTitle, setDraftTitle] = useState<string>('');
  const [draftContent, setDraftContent] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  const showToast = (text: string) => {
    setNotice(text);
    setTimeout(() => setNotice(null), 3000);
  };

  const updateStats = useCallback((textStr?: string) => {
    const text = textStr !== undefined ? textStr : (editorRef.current?.innerText || '');
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    setWordCount(words);
    setCharCount(text.length);
  }, []);

  // Initialize draft when currentNote changes
  useEffect(() => {
    if (currentNote) {
      const initialTitle = currentNote.title || 'Untitled Note';
      const initialContent = currentNote.content || '';
      setSavedTitle(initialTitle);
      setSavedContent(initialContent);
      setDraftTitle(initialTitle);
      setDraftContent(initialContent);
      setHasUnsavedChanges(false);

      if (editorRef.current) {
        editorRef.current.innerHTML = initialContent;
        updateStats(editorRef.current.innerText || '');
      }
    }
  }, [currentNote?.id, updateStats]);

  // Handle title input change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDraftTitle(val);
    setHasUnsavedChanges(val !== savedTitle || draftContent !== savedContent);
  };

  // Handle content input change
  const handleContentChange = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    setDraftContent(html);
    setHasUnsavedChanges(draftTitle !== savedTitle || html !== savedContent);
    updateStats(editorRef.current.innerText || '');
  };

  // Commit and save changes to note
  const handleSave = useCallback(() => {
    if (!currentNote) return;
    updateNote(currentNote.id, {
      title: draftTitle.trim() || 'Untitled Note',
      content: draftContent,
    });
    setSavedTitle(draftTitle.trim() || 'Untitled Note');
    setSavedContent(draftContent);
    setHasUnsavedChanges(false);
    showToast('Note saved');
  }, [currentNote, draftTitle, draftContent, updateNote]);

  // Discard unsaved changes
  const handleDiscard = useCallback(() => {
    setDraftTitle(savedTitle);
    setDraftContent(savedContent);
    if (editorRef.current) {
      editorRef.current.innerHTML = savedContent;
      updateStats(editorRef.current.innerText || '');
    }
    setHasUnsavedChanges(false);
  }, [savedTitle, savedContent, updateStats]);

  // Register unsaved changes handler with parent (App.tsx)
  useEffect(() => {
    if (selectedNoteId && currentNote) {
      onRegisterUnsavedNote?.({
        isDirty: hasUnsavedChanges,
        noteTitle: draftTitle || currentNote.title || 'Untitled Note',
        save: handleSave,
        discard: handleDiscard,
      });
    } else {
      onRegisterUnsavedNote?.(null);
    }
    return () => {
      onRegisterUnsavedNote?.(null);
    };
  }, [selectedNoteId, currentNote?.id, hasUnsavedChanges, draftTitle, handleSave, handleDiscard, onRegisterUnsavedNote]);

  // Ctrl+S / Cmd+S save shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [colorPickerTarget, setColorPickerTarget] = useState<ColorTarget>('note');
  const [noteToRename, setNoteToRename] = useState<{ id: string; title: string } | null>(null);

  const execCmd = (command: string, value: string | undefined = undefined) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, value);
    handleContentChange();
  };

  const applyFontSize = (size: number) => {
    setActiveFontSize(size);
    setShowSizeMenu(false);
    if (editorRef.current) {
      editorRef.current.focus();
    }
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (range.collapsed) return;

    const span = document.createElement('span');
    span.style.fontSize = `${size}px`;
    span.appendChild(range.extractContents());
    range.insertNode(span);
    handleContentChange();
  };

  const applyFont = (font: FontOption) => {
    setSelectedFont(font);
    setShowFontMenu(false);
    if (editorRef.current) {
      editorRef.current.focus();
    }
    execCmd('fontName', font.name);
  };

  const applyTextColor = (color: string) => {
    execCmd('foreColor', color);
  };

  const applyHighlight = (color: string) => {
    if (color === 'transparent') {
      execCmd('removeFormat');
    } else {
      execCmd('hiliteColor', color);
    }
  };

  const handleApplyColor = (color: string, target: ColorTarget) => {
    setIsColorPickerOpen(false);
    if (target === 'note') {
      const matched = STICKY_COLORS.find(
        (c) => c.bg.toLowerCase() === color.toLowerCase() || c.id === color.toLowerCase()
      );
      if (matched && currentNote) {
        updateNote(currentNote.id, { colorId: matched.id });
        setStickyColorId(matched.id);
      } else if (currentNote) {
        updateNote(currentNote.id, { colorId: 'blue' });
      }
      showToast('Note color updated');
    } else if (target === 'text') {
      if (editorRef.current) {
        editorRef.current.focus();
      }
      document.execCommand('foreColor', false, color);
      handleContentChange();
      showToast('Text color applied');
    } else if (target === 'highlight') {
      if (editorRef.current) {
        editorRef.current.focus();
      }
      document.execCommand('hiliteColor', false, color);
      handleContentChange();
      showToast('Highlight applied');
    }
  };

  // Create a new note from dialog
  const handleConfirmCreateNote = (noteTitle: string) => {
    setIsCreateNoteOpen(false);
    const title = noteTitle.trim() || 'Untitled note';
    const newNote = createNote();
    updateNote(newNote.id, { title });
    setSelectedNoteId(newNote.id);
    navigate(`/notes/${newNote.id}`);
  };

  const handleConfirmRenameNote = (newTitle: string) => {
    if (!noteToRename) return;
    const title = newTitle.trim() || noteToRename.title;
    updateNote(noteToRename.id, { title });
    setNoteToRename(null);
    showToast('Note renamed');
  };

  const handleNoteContextAction = (action: 'open' | 'pin' | 'rename' | 'docx' | 'pdf' | 'delete') => {
    if (!noteContextMenu) return;
    const targetNote = notes.find((n) => n.id === noteContextMenu.noteId);
    setNoteContextMenu(null);
    if (!targetNote) return;

    if (action === 'open') {
      setSelectedNoteId(targetNote.id);
      setActiveNoteId(targetNote.id);
      navigate(`/notes/${targetNote.id}`);
      return;
    }
    if (action === 'pin') {
      togglePinNote(targetNote.id);
      return;
    }
    if (action === 'rename') {
      setNoteToRename(targetNote);
      return;
    }
    if (action === 'docx') {
      exportDocx(targetNote.title, targetNote.content);
      return;
    }
    if (action === 'pdf') {
      exportWritePdf(targetNote.title, targetNote.content);
      return;
    }
    if (action === 'delete') {
      deleteNote(targetNote.id);
      showToast(`Deleted "${targetNote.title}"`);
      return;
    }
  };

  // 1. COLLECTION PAGE VIEW (inheriting common tab background: bg-transparent)
  if (!selectedNoteId) {
    let animIdx = 0;
    return (
      <div className="min-h-screen bg-transparent text-[#111827] dark:text-white p-6 sm:p-10 select-none">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="flex items-end justify-between gap-4 mb-8">
            <motion.div
              variants={slideUpVariant}
              initial="hidden"
              animate="visible"
              custom={animIdx++}
            >
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Your notes</h1>
              <p className="text-sm text-black/55 dark:text-white/55 mt-2">Pick up where you left off or start with a blank document.</p>
            </motion.div>
            <motion.button
              variants={slideUpVariant}
              initial="hidden"
              animate="visible"
              custom={animIdx++}
              type="button" 
              onClick={() => setIsCreateNoteOpen(true)} 
              className="h-10 px-4 rounded-lg bg-[#005fb8] dark:bg-[#4cc2ff] text-white dark:text-black text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer"
            >
              <span className="flex size-6 items-center justify-center"><Plus aria-hidden="true" className="size-5" strokeWidth={2.5} /></span>
              <span className="light-mode-white-label">Create note</span>
            </motion.button>
          </div>

          {/* Cards Grid matching Recommended Section Note Files */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
            {notes.map((note) => {
              const itemIdx = animIdx++;
              const colorOption = STICKY_COLORS.find((c) => c.id === note.colorId) || STICKY_COLORS[0];
              const snippet = stripHtml(note.content).trim();
              const baseTitle = note.title || 'Ghi chú';
              const fileTitle = baseTitle.endsWith('.txt') ? baseTitle : `${baseTitle}.txt`;

              const handleOpenThisNote = () => {
                setSelectedNoteId(note.id);
                setActiveNoteId(note.id);
                navigate(`/notes/${note.id}`);
              };

              return (
                <motion.div
                  key={note.id}
                  variants={slideUpVariant}
                  initial="hidden"
                  animate="visible"
                  custom={itemIdx}
                  role="button"
                  tabIndex={0}
                  onClick={handleOpenThisNote}
                  onDoubleClick={handleOpenThisNote}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleOpenThisNote();
                    }
                  }}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setNoteContextMenu({ x: event.clientX, y: event.clientY, noteId: note.id });
                  }}
                  className="rounded-2xl bg-[#f0f2f5] dark:bg-[#282b32] border border-black/10 dark:border-white/10 p-3.5 sm:p-4.5 flex flex-col justify-between shadow-xs transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d91a9c] dark:focus-visible:ring-[#ff82ff]"
                >
                  <div className="flex items-start justify-between mb-2.5">
                    <div className="min-w-0 pr-2">
                      <h4 className="text-sm sm:text-base font-semibold text-black dark:text-white truncate group-hover:text-[#d91a9c] dark:group-hover:text-[#ff82ff] transition-colors">
                        {fileTitle}
                      </h4>
                      <p className="text-xs text-black/60 dark:text-[#9e9ea6] truncate">
                        Tệp ghi chú · {formatNoteDate(note.updatedAt || note.createdAt)}
                      </p>
                    </div>
                    {/* Notepad file icon + Pin indicator */}
                    <div className="shrink-0 mt-0.5 flex items-center gap-1.5">
                      {note.pinned && (
                        <div
                          className="w-4 h-4 rounded-full bg-amber-400 text-black flex items-center justify-center shadow-xs"
                          title="Đã ghim"
                        >
                          <Pin className="w-2.5 h-2.5 fill-current" />
                        </div>
                      )}
                      <div className="size-4 sm:size-4.5 flex items-center justify-center">
                        <img
                          src={NOTE_ICON_URL}
                          alt="Notepad"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          className="size-full object-contain filter drop-shadow-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Snapshot Thumbnail */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenThisNote();
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleOpenThisNote();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        handleOpenThisNote();
                      }
                    }}
                    className="relative h-[88px] sm:h-[98px] rounded-2xl overflow-hidden shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer group/thumb focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d91a9c] dark:focus-visible:ring-[#ff82ff] bg-white dark:bg-[#1e2025] p-3 select-none flex items-center justify-center border-[2px] border-black/[0.06] dark:border-white/[0.08] group-hover:border-[#d91a9c]/50 dark:group-hover:border-[#ff82ff]/50"
                  >
                    <div className="flex items-center gap-3.5 z-10 w-full px-2">
                      <div className="shrink-0 flex items-center justify-center bg-transparent">
                        <img
                          src={NOTE_ICON_URL}
                          alt="Notepad"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          className="size-10 sm:size-11 object-contain filter drop-shadow-sm group-hover/thumb:scale-105 transition-transform"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[12px] font-semibold text-black dark:text-[#f3f4f6] truncate group-hover/thumb:text-[#d91a9c] dark:group-hover/thumb:text-[#ff82ff] transition-colors">
                          {note.title || 'Ghi chú mới'}
                        </div>
                        <div className="text-[10px] text-black/50 dark:text-[#888892] truncate mt-0.5">
                          {snippet.slice(0, 42) || 'Ghi chú văn bản Sparkle Notes'}
                        </div>
                      </div>
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10 dark:border-white/20 ml-1.5"
                        style={{ backgroundColor: colorOption.bg }}
                        title={colorOption.name}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <AnimatePresence>
            {noteContextMenu && (
              <NoteContextMenu
                x={noteContextMenu.x}
                y={noteContextMenu.y}
                noteId={noteContextMenu.noteId}
                isPinned={Boolean(notes.find((n) => n.id === noteContextMenu.noteId)?.pinned)}
                onAction={handleNoteContextAction}
                onClose={() => setNoteContextMenu(null)}
              />
            )}
          </AnimatePresence>

          {/* WinUI 3 Create a new note Dialog */}
          <PromptDialog
            isOpen={isCreateNoteOpen}
            title="Create a new note"
            label="Note title"
            placeholder="Enter note title..."
            initialValue="Untitled note"
            confirmLabel="Create"
            onConfirm={handleConfirmCreateNote}
            onClose={() => setIsCreateNoteOpen(false)}
          />

          {/* WinUI 3 Rename Note Dialog */}
          <PromptDialog
            isOpen={Boolean(noteToRename)}
            title="Rename note"
            label="Note title"
            placeholder="Enter note title..."
            initialValue={noteToRename?.title || ''}
            confirmLabel="Save"
            onConfirm={handleConfirmRenameNote}
            onClose={() => setNoteToRename(null)}
          />
        </div>
      </div>
    );
  }

  // 2. FULL-PAGE WINUI 3 NOTE EDITOR VIEW (pinned Gallery-like toolbar, full page canvas, no go back/export/pin/delete, Save button)
  return (
    <div className="flex flex-col w-full min-h-screen bg-transparent text-[#111827] dark:text-[#F3F4F6] relative select-none">
      {/* Toast Notification */}
      {notice && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-[6px] bg-[#0078d4] dark:bg-[#4cc2ff] text-white dark:text-black text-xs font-semibold shadow-xl flex items-center gap-2 animate-fade-in">
          <Sparkles className="w-4 h-4" />
          <span>{notice}</span>
        </div>
      )}

      {/* Pinned 2-Row WinUI 3 Command Bar Toolbar */}
      <header className="sticky top-0 z-30 border-b border-black/10 dark:border-white/10 bg-[#f9f9f9]/90 dark:bg-[#202020]/90 backdrop-blur-2xl shrink-0 rounded-none md:rounded-tl-[10px] divide-y divide-black/5 dark:divide-white/5">
        {/* ROW 1: Typography, Styles & Core Actions */}
        <div className="px-3 sm:px-6 py-1.5 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar text-xs">
          {/* Left Group: Undo/Redo, Font Family, Font Size, Bold/Italic/Underline/Strike, Headings */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Undo / Redo */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execCmd('undo')}
              className="p-1.5 rounded-[4px] hover:bg-black/5 dark:hover:bg-white/10 text-[#4b5563] dark:text-neutral-300 hover:text-[#111827] dark:hover:text-white cursor-pointer"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execCmd('redo')}
              className="p-1.5 rounded-[4px] hover:bg-black/5 dark:hover:bg-white/10 text-[#4b5563] dark:text-neutral-300 hover:text-[#111827] dark:hover:text-white cursor-pointer"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-4 bg-black/10 dark:bg-white/10 mx-0.5" />

            {/* Font Family Dropdown */}
            <div className="relative">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowFontMenu(!showFontMenu)}
                className="h-7 px-2 rounded-[4px] bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs flex items-center gap-1.5 text-[#111827] dark:text-white cursor-pointer"
              >
                <Type className="w-3.5 h-3.5 text-[#0078d4] dark:text-[#4cc2ff]" />
                <span className="truncate max-w-[85px] hidden sm:inline">{selectedFont.name}</span>
                <ChevronDown className="w-3 h-3 text-current opacity-60" />
              </button>

              {showFontMenu && (
                <div
                  className={`absolute left-0 top-full mt-1 w-44 z-50 p-1 space-y-0.5 ${flyoutPanelClassName}`}
                  style={flyoutPanelStyle}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  {PRESET_FONTS.map((font) => (
                    <button
                      key={font.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyFont(font)}
                      className="w-full px-2.5 py-1.5 rounded-[4px] text-left text-xs hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-between cursor-pointer text-[#111827] dark:text-white"
                      style={{ fontFamily: font.fontFamily }}
                    >
                      <span>{font.name}</span>
                      {selectedFont.id === font.id && <Check className="w-3 h-3 text-[#0078d4] dark:text-[#4cc2ff]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Font Size Dropdown */}
            <div className="relative">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowSizeMenu(!showSizeMenu)}
                className="h-7 px-2 rounded-[4px] bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs flex items-center gap-1 text-[#111827] dark:text-white cursor-pointer"
              >
                <span>{activeFontSize}px</span>
                <ChevronDown className="w-3 h-3 text-current opacity-60" />
              </button>

              {showSizeMenu && (
                <div
                  className={`absolute left-0 top-full mt-1 w-24 z-50 p-1 space-y-0.5 ${flyoutPanelClassName}`}
                  style={flyoutPanelStyle}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  {PRESET_SIZES.map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyFontSize(sz)}
                      className="w-full px-2.5 py-1 rounded-[4px] text-center text-xs hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer text-[#111827] dark:text-white"
                    >
                      {sz} px
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="w-[1px] h-4 bg-black/10 dark:bg-white/10 mx-0.5" />

            {/* Bold, Italic, Underline, Strikethrough */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execCmd('bold')}
              className="p-1.5 rounded-[4px] hover:bg-black/5 dark:hover:bg-white/10 text-[#4b5563] dark:text-neutral-300 hover:text-[#111827] dark:hover:text-white cursor-pointer"
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execCmd('italic')}
              className="p-1.5 rounded-[4px] hover:bg-black/5 dark:hover:bg-white/10 text-[#4b5563] dark:text-neutral-300 hover:text-[#111827] dark:hover:text-white cursor-pointer"
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execCmd('underline')}
              className="p-1.5 rounded-[4px] hover:bg-black/5 dark:hover:bg-white/10 text-[#4b5563] dark:text-neutral-300 hover:text-[#111827] dark:hover:text-white cursor-pointer"
              title="Underline (Ctrl+U)"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execCmd('strikeThrough')}
              className="p-1.5 rounded-[4px] hover:bg-black/5 dark:hover:bg-white/10 text-[#4b5563] dark:text-neutral-300 hover:text-[#111827] dark:hover:text-white cursor-pointer"
              title="Strikethrough"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>

            <div className="w-[1px] h-4 bg-black/10 dark:bg-white/10 mx-0.5 hidden sm:block" />

            {/* Headings */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execCmd('formatBlock', '<h1>')}
              className="p-1.5 rounded-[4px] hover:bg-black/5 dark:hover:bg-white/10 text-[#4b5563] dark:text-neutral-300 hover:text-[#111827] dark:hover:text-white cursor-pointer hidden sm:block"
              title="Heading 1"
            >
              <Heading1 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execCmd('formatBlock', '<h2>')}
              className="p-1.5 rounded-[4px] hover:bg-black/5 dark:hover:bg-white/10 text-[#4b5563] dark:text-neutral-300 hover:text-[#111827] dark:hover:text-white cursor-pointer hidden sm:block"
              title="Heading 2"
            >
              <Heading2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right Group: Sticky Widget, Color Icon Dialog Trigger, Primary Save Button */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Show as Sticky */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setIsStickyVisible(!isStickyVisible)}
              className={`h-7 px-2.5 rounded-[4px] text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all border ${
                isStickyVisible
                  ? 'bg-amber-400/20 text-amber-600 dark:text-amber-400 border-amber-400/40'
                  : 'bg-black/5 dark:bg-white/5 text-[#6b7280] dark:text-[#9ca3af] hover:text-[#111827] dark:hover:text-white border-black/5 dark:border-white/5'
              }`}
              title="Toggle sticky note widget"
            >
              <FluentNotesIcon className="w-3.5 h-3.5 text-current" />
              <span className="hidden sm:inline">Sticky</span>
            </button>

            {/* WinUI 3 Color Picker Modal Trigger Button */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setColorPickerTarget('note');
                setIsColorPickerOpen(true);
              }}
              className="h-7 px-2.5 rounded-[4px] bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs flex items-center gap-1.5 text-[#111827] dark:text-white cursor-pointer border border-black/5 dark:border-white/5"
              title="Open Color Picker dialog"
            >
              <div
                className="w-3.5 h-3.5 rounded-full border border-black/20 dark:border-white/20 shadow-xs"
                style={{ backgroundColor: currentStickyColor.bg }}
              />
              <Palette className="w-3.5 h-3.5 text-[#0078d4] dark:text-[#4cc2ff]" />
              <span className="hidden md:inline font-medium text-[11px]">Color</span>
            </button>

            {/* Colored WinUI 3 Save Button */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleSave}
              className="h-7 px-3.5 rounded-[5px] bg-[#0078d4] dark:bg-[#4cc2ff] hover:bg-[#106ebe] dark:hover:bg-[#6bd0ff] active:bg-[#005a9e] text-white dark:text-black font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              title="Save note (Ctrl+S)"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>
          </div>
        </div>

        {/* ROW 2: Alignment, Lists, Text Color, Highlight, Clear formatting, Insert Tools, Word Count */}
        <div className="px-3 sm:px-6 py-1 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar text-xs bg-black/[0.015] dark:bg-white/[0.015]">
          {/* Left Sub-Group: Alignment, Lists, Text Color, Highlight, Clear Formatting, Dividers */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Alignment */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execCmd('justifyLeft')}
              className="p-1.5 rounded-[4px] hover:bg-black/5 dark:hover:bg-white/10 text-[#4b5563] dark:text-neutral-300 hover:text-[#111827] dark:hover:text-white cursor-pointer"
              title="Align Left"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execCmd('justifyCenter')}
              className="p-1.5 rounded-[4px] hover:bg-black/5 dark:hover:bg-white/10 text-[#4b5563] dark:text-neutral-300 hover:text-[#111827] dark:hover:text-white cursor-pointer"
              title="Align Center"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execCmd('justifyRight')}
              className="p-1.5 rounded-[4px] hover:bg-black/5 dark:hover:bg-white/10 text-[#4b5563] dark:text-neutral-300 hover:text-[#111827] dark:hover:text-white cursor-pointer"
              title="Align Right"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>

            <div className="w-[1px] h-3.5 bg-black/10 dark:bg-white/10 mx-0.5" />

            {/* Lists */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execCmd('insertUnorderedList')}
              className="p-1.5 rounded-[4px] hover:bg-black/5 dark:hover:bg-white/10 text-[#4b5563] dark:text-neutral-300 hover:text-[#111827] dark:hover:text-white cursor-pointer"
              title="Bullet List"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execCmd('insertOrderedList')}
              className="p-1.5 rounded-[4px] hover:bg-black/5 dark:hover:bg-white/10 text-[#4b5563] dark:text-neutral-300 hover:text-[#111827] dark:hover:text-white cursor-pointer"
              title="Numbered List"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>

            <div className="w-[1px] h-3.5 bg-black/10 dark:bg-white/10 mx-0.5" />

            {/* Text Color Trigger */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setColorPickerTarget('text');
                setIsColorPickerOpen(true);
              }}
              className="p-1.5 rounded-[4px] hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-1 cursor-pointer text-[#4b5563] dark:text-neutral-300 hover:text-[#111827] dark:hover:text-white"
              title="Text Color (Pick color)"
            >
              <span className="font-bold underline text-xs">A</span>
              <span className="w-2.5 h-1 bg-[#0078d4] dark:bg-[#4cc2ff] rounded-xs" />
            </button>

            {/* Highlighter Trigger */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setColorPickerTarget('highlight');
                setIsColorPickerOpen(true);
              }}
              className="p-1.5 rounded-[4px] hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-1 cursor-pointer text-[#4b5563] dark:text-neutral-300 hover:text-[#111827] dark:hover:text-white"
              title="Highlight Color (Pick highlight)"
            >
              <Highlighter className="w-3.5 h-3.5" />
            </button>

            {/* Clear formatting */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execCmd('removeFormat')}
              className="p-1.5 rounded-[4px] hover:bg-black/5 dark:hover:bg-white/10 text-[#4b5563] dark:text-neutral-300 hover:text-[#111827] dark:hover:text-white cursor-pointer"
              title="Clear formatting"
            >
              <RemoveFormatting className="w-3.5 h-3.5" />
            </button>

            <div className="w-[1px] h-3.5 bg-black/10 dark:bg-white/10 mx-0.5 hidden sm:block" />

            {/* Insert Horizontal Line */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => execCmd('insertHorizontalRule')}
              className="px-2 py-1 rounded-[4px] hover:bg-black/5 dark:hover:bg-white/10 text-[11px] text-[#4b5563] dark:text-neutral-300 hover:text-[#111827] dark:hover:text-white cursor-pointer hidden sm:flex items-center gap-1"
              title="Insert Divider Line"
            >
              <Minus className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Line</span>
            </button>

            {/* Insert Date */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                const nowStr = new Date().toLocaleDateString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
                if (editorRef.current) editorRef.current.focus();
                document.execCommand('insertText', false, nowStr);
                handleContentChange();
              }}
              className="px-2 py-1 rounded-[4px] hover:bg-black/5 dark:hover:bg-white/10 text-[11px] text-[#4b5563] dark:text-neutral-300 hover:text-[#111827] dark:hover:text-white cursor-pointer hidden sm:flex items-center gap-1"
              title="Insert current date & time"
            >
              <Clock className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Date</span>
            </button>
          </div>

          {/* Right Sub-Group: Live Word and Character Count Stats */}
          <div className="flex items-center gap-2 text-[11px] text-[#6b7280] dark:text-[#9ca3af] shrink-0 font-medium select-none">
            <span>{wordCount} words</span>
            <span>•</span>
            <span>{charCount} chars</span>
          </div>
        </div>
      </header>

      {/* Main Full-Page Writing Surface */}
      <main className="flex-1 w-full bg-white dark:bg-[#202020] flex flex-col p-6 sm:p-12 md:p-16 min-h-[calc(100vh-60px)]">
        <input
          type="text"
          value={draftTitle}
          onChange={handleTitleChange}
          placeholder="Untitled Note"
          className="w-full bg-transparent text-3xl sm:text-4xl font-bold tracking-tight text-[#111827] dark:text-white placeholder-[#9ca3af] outline-none pb-3 mb-4 border-b border-black/5 dark:border-white/5 focus:border-[#0078d4] dark:focus:border-[#4cc2ff] transition-colors"
        />

        <div className="flex items-center gap-3 text-xs text-[#6b7280] dark:text-[#9ca3af] pb-4 mb-6 border-b border-black/5 dark:border-white/5 select-none">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Edited: {currentNote ? formatNoteDate(currentNote.updatedAt) : 'Just now'}</span>
          </span>
          <span>•</span>
          <span>{wordCount} words</span>
          <span>•</span>
          <span>{charCount} characters</span>
          <span>•</span>
          <span className="font-mono text-[11px]">{selectedFont.name}</span>
        </div>

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleContentChange}
          className="flex-1 outline-none text-[#1f2937] dark:text-[#f3f4f6] text-base sm:text-lg leading-relaxed selection:bg-[#d946ef] selection:text-white dark:selection:bg-[#ff2d92] dark:selection:text-white min-h-[500px]"
          style={{
            fontFamily: selectedFont.fontFamily,
          }}
        />
      </main>

      {/* Footer Status Bar */}
      <footer className="sticky bottom-0 z-30 px-4 py-1.5 bg-[#f9f9f9]/80 dark:bg-[#202020]/80 backdrop-blur-2xl border-t border-black/8 dark:border-white/8 flex items-center justify-between text-xs text-[#6b7280] dark:text-[#9ca3af] shrink-0">
        <div className="flex items-center gap-3">
          <span>{wordCount} words</span>
          <span>•</span>
          <span>{charCount} characters</span>
        </div>
        <div className="flex items-center gap-3">
          <span>UTF-8</span>
          <span>•</span>
          <span>WinUI 3 Note</span>
        </div>
      </footer>

      {/* WinUI 3 Color Picker Modal */}
      <WinUI3ColorPickerModal
        isOpen={isColorPickerOpen}
        defaultTarget={colorPickerTarget}
        initialColor={colorPickerTarget === 'note' ? currentStickyColor.bg : '#0078d4'}
        onApply={handleApplyColor}
        onClose={() => setIsColorPickerOpen(false)}
      />
    </div>
  );
};

export default NotesApp;
