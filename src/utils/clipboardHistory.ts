// In-app clipboard history manager for Waves Community
export interface ClipboardItem {
  id: string;
  text: string;
  timestamp: number;
}

const STORAGE_KEY = 'waves_clipboard_history';
const MAX_ITEMS = 30;

export const getClipboardHistory = (): ClipboardItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => item && typeof item.text === 'string' && item.text.trim().length > 0);
    }
  } catch {}
  return [];
};

export const addClipboardItem = (text: string): ClipboardItem[] => {
  if (!text || !text.trim()) return getClipboardHistory();
  const trimmed = text.trim();
  const current = getClipboardHistory();

  // Deduplicate and move to top
  const filtered = current.filter((item) => item.text !== trimmed);
  const newItem: ClipboardItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    text: trimmed,
    timestamp: Date.now(),
  };

  const updated = [newItem, ...filtered].slice(0, MAX_ITEMS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('waves_clipboard_updated'));
  } catch {}

  return updated;
};

export const removeClipboardItem = (id: string): ClipboardItem[] => {
  const current = getClipboardHistory();
  const updated = current.filter((item) => item.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('waves_clipboard_updated'));
  } catch {}
  return updated;
};

export const clearClipboardHistory = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('waves_clipboard_updated'));
  } catch {}
};

// Global listener to capture copy events inside the application
if (typeof window !== 'undefined') {
  let isListenerAttached = false;
  if (!isListenerAttached) {
    isListenerAttached = true;
    document.addEventListener('copy', () => {
      try {
        setTimeout(() => {
          const selectedText = window.getSelection()?.toString();
          if (selectedText && selectedText.trim().length > 0) {
            addClipboardItem(selectedText);
          }
        }, 30);
      } catch {}
    });
  }
}
