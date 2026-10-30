import { useEffect } from 'react';
import { useSettings } from './useSettings';
import { eventToKeyString } from '../utils/keybinds';

interface KeyboardShortcutHandlers {
  onHome: () => void;
  onSearch: () => void;
  onTools: () => void;
  onSettings: () => void;
  onRecentChannel: () => void;
}

export function useKeyboardShortcuts({
  onHome,
  onSearch,
  onTools,
  onSettings,
  onRecentChannel
}: KeyboardShortcutHandlers) {
  const { settings } = useSettings();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger navigation shortcuts while user is actively typing in text fields
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        // Exception: Escape can blur, but Alt+Number shouldn't type anyway
        // If user is editing a keybind input, ignore global shortcut
        if (target.getAttribute('data-keybind-recording') === 'true') {
          return;
        }
      }

      const keyStr = eventToKeyString(e);
      if (!keyStr) return;

      const keybinds = settings.customKeybinds;

      const matchKey = (boundKey: string | undefined, defaultKey: string) => {
        const targetKey = boundKey || defaultKey;
        return targetKey.toLowerCase() === keyStr.toLowerCase();
      };

      // 1. Home (Alt+1)
      if (matchKey(keybinds?.home, 'Alt+1')) {
        e.preventDefault();
        onHome();
        return;
      }

      // 2. Search (Alt+2)
      if (matchKey(keybinds?.search, 'Alt+2')) {
        e.preventDefault();
        onSearch();
        return;
      }

      // 3. Tools menu (Alt+3)
      if (matchKey(keybinds?.tools, 'Alt+3')) {
        e.preventDefault();
        onTools();
        return;
      }

      // 4. Settings (Alt+4)
      if (matchKey(keybinds?.settings, 'Alt+4')) {
        e.preventDefault();
        onSettings();
        return;
      }

      // 5. Kênh xem gần nhất (Alt+5)
      if (matchKey(keybinds?.recentChannel, 'Alt+5')) {
        e.preventDefault();
        onRecentChannel();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings.customKeybinds, onHome, onSearch, onTools, onSettings, onRecentChannel]);
}
