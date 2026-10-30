import React, { createContext, useContext, useState, useEffect } from 'react';

export interface StickyColorOption {
  id: string;
  name: string;
  bg: string;
  headerBg: string;
  border: string;
  text: string;
  accent: string;
}

export const STICKY_COLORS: StickyColorOption[] = [
  {
    id: 'yellow',
    name: 'Vàng Cổ Điển',
    bg: '#fef9c3', // yellow-100
    headerBg: '#fef08a', // yellow-200
    border: '#fde047', // yellow-300
    text: '#1f2937',
    accent: '#ca8a04',
  },
  {
    id: 'orange',
    name: 'Cam Đào',
    bg: '#ffedd5', // orange-100
    headerBg: '#fed7aa', // orange-200
    border: '#fdba74', // orange-300
    text: '#1f2937',
    accent: '#ea580c',
  },
  {
    id: 'green',
    name: 'Xanh Lá Tươi',
    bg: '#dcfce7', // green-100
    headerBg: '#bbf7d0', // green-200
    border: '#86efac', // green-300
    text: '#1f2937',
    accent: '#16a34a',
  },
  {
    id: 'blue',
    name: 'Xanh Dương Nhạt',
    bg: '#e0f2fe', // sky-100
    headerBg: '#bae6fd', // sky-200
    border: '#7dd3fc', // sky-300
    text: '#1f2937',
    accent: '#0284c7',
  },
  {
    id: 'purple',
    name: 'Tím Lavender',
    bg: '#f3e8ff', // purple-100
    headerBg: '#e9d5ff', // purple-200
    border: '#d8b4fe', // purple-300
    text: '#1f2937',
    accent: '#9333ea',
  },
  {
    id: 'pink',
    name: 'Hồng Phấn',
    bg: '#fce7f3', // pink-100
    headerBg: '#fbcfe8', // pink-200
    border: '#f472b6', // pink-400
    text: '#1f2937',
    accent: '#db2777',
  },
  {
    id: 'dark',
    name: 'Fluent Tối',
    bg: '#25252b',
    headerBg: '#1f1f23',
    border: '#3f3f46',
    text: '#f3f4f6',
    accent: '#4cc2ff',
  },
];

export interface NoteItem {
  id: string;
  title: string;
  content: string; // HTML formatted string
  colorId: string;
  pinned?: boolean;
  folder?: string;
  createdAt: number;
  updatedAt: number;
}

const DEFAULT_INITIAL_NOTES: NoteItem[] = [
  {
    id: 'note-welcome-1',
    title: 'Ghi chú mới trong Sparkle Notes',
    content: `
      <h2 style="color: #4cc2ff; font-size: 22px; font-weight: bold; margin-bottom: 8px;">Ghi chú mới trong Sparkle Notes</h2>
      <p style="font-size: 15px; line-height: 1.6; margin-bottom: 12px;">Soạn thảo nhanh ý tưởng, kế hoạch hoặc việc cần làm giống Apple Notes & Notion ngay tại đây.</p>
      <ul style="margin-left: 20px; margin-bottom: 12px;">
        <li>Định dạng văn bản: <strong>In đậm</strong>, <em>In nghiêng</em>, <u>Gạch chân</u>, màu sắc và cỡ chữ linh hoạt từ 1 đến 200px.</li>
        <li>Bấm nút <strong>Show as stickies</strong> ở thanh công cụ để mở ghi chú dán nổi trên màn hình.</li>
        <li>Tạo thêm nhiều ghi chú nhỏ với nút <strong>+ Ghi chú mới</strong> ở danh sách bên trái.</li>
      </ul>
      <p style="font-size: 14px; color: #9ca3af; font-style: italic;">Chúc bạn một ngày làm việc và giải trí hiệu quả!</p>
    `,
    colorId: 'yellow',
    pinned: true,
    createdAt: Date.now() - 3600000 * 24,
    updatedAt: Date.now() - 1800000,
  },
  {
    id: 'note-todo-2',
    title: 'Kế hoạch công việc tuần này',
    content: `
      <h3 style="color: #4cc2ff; font-size: 18px; font-weight: bold; margin-bottom: 6px;">Kế hoạch & Mục tiêu tuần này</h3>
      <p style="font-size: 14px; margin-bottom: 10px;">Danh sách nhiệm vụ ưu tiên cần hoàn thành:</p>
      <ul style="margin-left: 20px; margin-bottom: 10px;">
        <li>Kiểm tra các luồng phát truyền hình trực tiếp Live TV</li>
        <li>Cập nhật giao diện tìm kiếm Fluent thông minh</li>
        <li>Trải nghiệm tính năng Stickies Note đa cửa sổ</li>
        <li>Khám phá bộ sưu tập media trong Gallery</li>
      </ul>
    `,
    colorId: 'green',
    pinned: false,
    createdAt: Date.now() - 3600000 * 48,
    updatedAt: Date.now() - 3600000 * 4,
  },
  {
    id: 'note-ideas-3',
    title: 'Ý tưởng dự án mới (Notion Brainstorming)',
    content: `
      <h3 style="color: #facc15; font-size: 18px; font-weight: bold; margin-bottom: 6px;">Ý tưởng phát triển hệ sinh thái</h3>
      <p style="font-size: 14px; margin-bottom: 8px;">Tổng hợp các tính năng đề xuất:</p>
      <ul style="margin-left: 20px; margin-bottom: 10px;">
        <li>Hỗ trợ xuất ghi chú sang Word (.docx) và PDF</li>
        <li>Đồng bộ tìm kiếm toàn diện từ thanh TopBar</li>
        <li>Hỗ trợ âm gõ phím cơ và bàn phím ảo Native Keyboard</li>
      </ul>
    `,
    colorId: 'blue',
    pinned: false,
    createdAt: Date.now() - 3600000 * 72,
    updatedAt: Date.now() - 3600000 * 12,
  }
];

interface NotesContextType {
  notes: NoteItem[];
  activeNoteId: string;
  activeNote: NoteItem;
  createNote: (initialTitle?: string, initialContent?: string, colorId?: string) => NoteItem;
  deleteNote: (id: string) => void;
  updateNote: (id: string, updates: Partial<NoteItem>) => void;
  togglePinNote: (id: string) => void;
  setActiveNoteId: (id: string) => void;
  // Backward compatibility with single-note consumers
  noteTitle: string;
  setNoteTitle: (title: string) => void;
  noteContent: string;
  setNoteContent: (content: string) => void;
  stickyColorId: string;
  setStickyColorId: (colorId: string) => void;
  currentStickyColor: StickyColorOption;
  isStickyVisible: boolean;
  setIsStickyVisible: (visible: boolean) => void;
  toggleSticky: () => void;
  isStickyMinimized: boolean;
  setIsStickyMinimized: (minimized: boolean) => void;
  stickyPosition: { x: number; y: number };
  setStickyPosition: (pos: { x: number; y: number }) => void;
  stickySize: { width: number; height: number };
  setStickySize: (size: { width: number; height: number }) => void;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

const NOTES_LIST_KEY = 'vone_notes_multi_v1';
const STICKY_PREFS_KEY = 'vone_notes_sticky_prefs_v1';

export const NotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load notes list with fallback migration from previous single-note format
  const [notes, setNotes] = useState<NoteItem[]>(() => {
    try {
      const savedList = localStorage.getItem(NOTES_LIST_KEY);
      if (savedList) {
        const parsed = JSON.parse(savedList);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }

      // Check legacy single-note storage to migrate user data seamlessly
      const legacyState = localStorage.getItem('vone_notes_state_v2') || localStorage.getItem('vone_notes_state_v1');
      if (legacyState) {
        const parsed = JSON.parse(legacyState);
        if (parsed.noteTitle || parsed.noteContent) {
          const migrated: NoteItem = {
            id: 'note-migrated-1',
            title: parsed.noteTitle || 'Ghi chú Sparkle',
            content: parsed.noteContent || DEFAULT_INITIAL_NOTES[0].content,
            colorId: parsed.stickyColorId || 'yellow',
            pinned: true,
            createdAt: Date.now() - 3600000,
            updatedAt: Date.now(),
          };
          return [migrated, ...DEFAULT_INITIAL_NOTES.slice(1)];
        }
      }
    } catch {}
    return DEFAULT_INITIAL_NOTES;
  });

  const [activeNoteId, setActiveNoteId] = useState<string>(() => {
    return notes[0]?.id || DEFAULT_INITIAL_NOTES[0].id;
  });

  // Ensure activeNoteId points to a valid note
  useEffect(() => {
    if (!notes.some((n) => n.id === activeNoteId)) {
      if (notes.length > 0) {
        setActiveNoteId(notes[0].id);
      }
    }
  }, [notes, activeNoteId]);

  // Persist notes list
  const persistNotes = (updated: NoteItem[]) => {
    setNotes(updated);
    try {
      localStorage.setItem(NOTES_LIST_KEY, JSON.stringify(updated));
    } catch {}
  };

  // Sticky widget floating preferences
  const [stickyPrefs, setStickyPrefs] = useState<{
    isVisible: boolean;
    isMinimized: boolean;
    position: { x: number; y: number };
    size: { width: number; height: number };
  }>(() => {
    try {
      const saved = localStorage.getItem(STICKY_PREFS_KEY) || localStorage.getItem('vone_notes_state_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          isVisible: Boolean(parsed.isStickyVisible),
          isMinimized: Boolean(parsed.isStickyMinimized),
          position: parsed.stickyPosition && typeof parsed.stickyPosition.x === 'number'
            ? parsed.stickyPosition
            : { x: Math.max(20, (typeof window !== 'undefined' ? window.innerWidth : 800) - 350), y: 80 },
          size: parsed.stickySize && typeof parsed.stickySize.width === 'number'
            ? parsed.stickySize
            : { width: 320, height: 280 }
        };
      }
    } catch {}
    return {
      isVisible: false,
      isMinimized: false,
      position: { x: 100, y: 100 },
      size: { width: 320, height: 280 }
    };
  });

  const saveStickyPrefs = (partial: Partial<typeof stickyPrefs>) => {
    setStickyPrefs((prev) => {
      const next = { ...prev, ...partial };
      try {
        localStorage.setItem(STICKY_PREFS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const activeNote = notes.find((n) => n.id === activeNoteId) || notes[0] || {
    id: 'note-fallback',
    title: 'Ghi chú mới',
    content: '<p></p>',
    colorId: 'yellow',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const createNote = (initialTitle = 'Ghi chú mới', initialContent = '<p>Bắt đầu viết...</p>', colorId = 'yellow'): NoteItem => {
    const newNote: NoteItem = {
      id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: initialTitle,
      content: initialContent,
      colorId,
      pinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    const nextList = [newNote, ...notes];
    persistNotes(nextList);
    setActiveNoteId(newNote.id);
    return newNote;
  };

  const deleteNote = (id: string) => {
    const nextList = notes.filter((n) => n.id !== id);
    if (nextList.length === 0) {
      const fallback = createNote('Ghi chú mới', '<p>Bắt đầu viết...</p>');
      persistNotes([fallback]);
      setActiveNoteId(fallback.id);
    } else {
      persistNotes(nextList);
      if (activeNoteId === id) {
        setActiveNoteId(nextList[0].id);
      }
    }
  };

  const updateNote = (id: string, updates: Partial<NoteItem>) => {
    const nextList = notes.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          ...updates,
          updatedAt: Date.now()
        };
      }
      return item;
    });
    persistNotes(nextList);
  };

  const togglePinNote = (id: string) => {
    const note = notes.find((n) => n.id === id);
    if (note) {
      updateNote(id, { pinned: !note.pinned });
    }
  };

  // Backward-compatible handlers for active note
  const setNoteTitle = (title: string) => {
    updateNote(activeNote.id, { title });
  };

  const setNoteContent = (content: string) => {
    updateNote(activeNote.id, { content });
  };

  const setStickyColorId = (colorId: string) => {
    updateNote(activeNote.id, { colorId });
  };

  const currentStickyColor =
    STICKY_COLORS.find((c) => c.id === activeNote.colorId) || STICKY_COLORS[0];

  const setIsStickyVisible = (visible: boolean) => {
    saveStickyPrefs({ isVisible: visible });
  };

  const toggleSticky = () => {
    saveStickyPrefs({ isVisible: !stickyPrefs.isVisible });
  };

  const setIsStickyMinimized = (minimized: boolean) => {
    saveStickyPrefs({ isMinimized: minimized });
  };

  const setStickyPosition = (pos: { x: number; y: number }) => {
    saveStickyPrefs({ position: pos });
  };

  const setStickySize = (size: { width: number; height: number }) => {
    saveStickyPrefs({ size });
  };

  return (
    <NotesContext.Provider
      value={{
        notes,
        activeNoteId,
        activeNote,
        createNote,
        deleteNote,
        updateNote,
        togglePinNote,
        setActiveNoteId,
        // Backward compatibility
        noteTitle: activeNote.title,
        setNoteTitle,
        noteContent: activeNote.content,
        setNoteContent,
        stickyColorId: activeNote.colorId,
        setStickyColorId,
        currentStickyColor,
        isStickyVisible: stickyPrefs.isVisible,
        setIsStickyVisible,
        toggleSticky,
        isStickyMinimized: stickyPrefs.isMinimized,
        setIsStickyMinimized,
        stickyPosition: stickyPrefs.position,
        setStickyPosition,
        stickySize: stickyPrefs.size,
        setStickySize,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
};

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
};
