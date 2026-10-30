import { KeybindAction, KeybindDefinition, CustomKeybinds } from '../types';

export const DEFAULT_KEYBINDS: CustomKeybinds = {
  home: 'Alt+1',
  search: 'Alt+2',
  tools: 'Alt+3',
  settings: 'Alt+4',
  recentChannel: 'Alt+5'
};

export const KEYBIND_DEFINITIONS: KeybindDefinition[] = [
  {
    id: 'home',
    label: 'Home',
    description: 'Quickly navigate to Home.',
    defaultKey: 'Alt+1'
  },
  {
    id: 'search',
    label: 'Search',
    description: 'Open TopBar Search.',
    defaultKey: 'Alt+2'
  },
  {
    id: 'tools',
    label: 'Tools Menu',
    description: 'Open Tools menu flyout.',
    defaultKey: 'Alt+3'
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Quickly navigate to Settings.',
    defaultKey: 'Alt+4'
  },
  {
    id: 'recentChannel',
    label: 'Most Recent Channel',
    description: 'Switch to the most recently watched channel.',
    defaultKey: 'Alt+5'
  }
];

/**
 * Reserved browser shortcuts that must not be used or overridden
 * to prevent breaking standard user browser navigation.
 */
export const FORBIDDEN_BROWSER_SHORTCUTS = [
  // Ctrl/Cmd shortcuts
  'Ctrl+W', 'Meta+W', // Close tab
  'Ctrl+T', 'Meta+T', // New tab
  'Ctrl+N', 'Meta+N', // New window
  'Ctrl+Q', 'Meta+Q', // Quit
  'Ctrl+Shift+W', 'Meta+Shift+W',
  'Ctrl+Shift+T', 'Meta+Shift+T', // Reopen tab
  'Ctrl+Shift+N', 'Meta+Shift+N', // Incognito
  'Ctrl+L', 'Meta+L', // Address bar
  'Ctrl+R', 'Meta+R', // Reload
  'Ctrl+Shift+R', 'Meta+Shift+R', // Hard reload
  'Ctrl+P', 'Meta+P', // Print
  'Ctrl+S', 'Meta+S', // Save
  'Ctrl+O', 'Meta+O', // Open
  'Ctrl+U', 'Meta+U', // View source
  'Ctrl+J', 'Meta+J', // Downloads
  'Ctrl+H', 'Meta+H', // History
  'Ctrl+D', 'Meta+D', // Bookmark
  'Ctrl+Shift+D', 'Meta+Shift+D',
  'Ctrl+Shift+I', 'Meta+Shift+I', 'F12', // DevTools
  'Ctrl+Shift+J', 'Meta+Shift+J', // Console
  'Ctrl+Shift+C', 'Meta+Shift+C', // Inspect
  'Ctrl+Shift+Delete', // Clear browsing data
  'Ctrl+Tab', 'Ctrl+Shift+Tab', // Switch tabs
  'Ctrl+Plus', 'Ctrl+=', 'Ctrl+-', 'Ctrl+0', // Zoom controls
  // Alt shortcuts on Windows/Linux
  'Alt+F4', // Close window
  'Alt+Left', 'Alt+Right', // Browser back/forward history
  'Alt+Home', // Browser homepage
  'Alt+D', // Focus address bar
  'F5', 'Ctrl+F5', // Refresh
  'F11', // Fullscreen browser
  // Bare functional keys
  'Escape',
  'Tab',
];

/**
 * Normalize KeyboardEvent to shortcut string e.g. "Alt+1", "Ctrl+Shift+K"
 */
export function eventToKeyString(e: KeyboardEvent): string {
  const parts: string[] = [];

  if (e.ctrlKey) parts.push('Ctrl');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');
  if (e.metaKey) parts.push('Meta');

  let key = e.key;

  // Don't form a standalone modifier keypress
  if (['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
    return '';
  }

  // Normalize standard keys
  if (key === ' ') key = 'Space';
  else if (key.length === 1) key = key.toUpperCase();
  else {
    // e.g. ArrowUp -> Up, ArrowDown -> Down, Enter -> Enter
    key = key.replace('Arrow', '');
  }

  parts.push(key);
  return parts.join('+');
}

/**
 * Validates if the keybind string conflicts with reserved browser shortcuts
 */
export function validateKeybind(keyStr: string): { valid: boolean; reason?: string } {
  if (!keyStr || !keyStr.trim()) {
    return { valid: false, reason: 'Keybind cannot be empty.' };
  }

  const normalized = keyStr.trim();

  // Must have at least one modifier key (Alt, Ctrl, or Shift) or be an allowed function key
  const hasModifier = normalized.includes('Alt') || normalized.includes('Ctrl') || normalized.includes('Meta') || normalized.includes('Shift');
  const isFunctionKey = /^F[1-9]|F1[0-2]$/i.test(normalized);

  if (!hasModifier && !isFunctionKey) {
    return { valid: false, reason: 'Keybind requires a modifier key (Alt, Ctrl, or Shift) to prevent accidental typing.' };
  }

  // Check against forbidden browser shortcuts
  for (const forbidden of FORBIDDEN_BROWSER_SHORTCUTS) {
    if (forbidden.toLowerCase() === normalized.toLowerCase()) {
      return { 
        valid: false, 
        reason: `Shortcut "${normalized}" conflicts with a reserved system/browser shortcut. Please choose another combination (e.g., Alt+Number or Alt+Key).` 
      };
    }
  }

  return { valid: true };
}
