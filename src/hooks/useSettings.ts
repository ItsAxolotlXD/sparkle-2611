import { useSyncExternalStore } from 'react';
import { CustomKeybinds } from '../types';
import { DEFAULT_KEYBINDS } from '../utils/keybinds';
import { keyboardSound } from '../utils/keyboardSound';

export interface SystemSettings {
  theme: 'dark' | 'light';
  themeVersion?: number;
  superDarkMode: boolean;
  spatialGlass: boolean;
  spatialGlassVersion?: number;
  spatialGlassOpacity: number; // 0 to 100 (%)
  spatialGlassBlur: number; // 0 to 100 (%)
  disableShinyOutline?: boolean;
  dockToSidebar: boolean;
  fontScale: number; // 0: Cực nhỏ, 1: Nhỏ, 2: Trung bình, 3: Lớn, 4: Cực lớn
  fontScaleVersion?: number;
  autoScrollBanner: boolean;
  autoHideSidebar: boolean;
  hoverToExpand: boolean;
  hoverToExpandVersion?: number;
  searchCategories: boolean;
  searchNews: boolean;
  searchTv: boolean;
  searchChannelNumber: boolean;
  searchSettings: boolean;
  reduceAllMotion: boolean;
  animateSidebar: boolean;
  animateModals: boolean;
  animatePageTransitions: boolean;
  immersiveSearch: boolean;
  nativeKeyboard: boolean;
  nativeKeyboardVersion?: number;
  keyboardNumberRow: boolean;
  keyboardClipboard: boolean;
  keyboardSoundEnabled: boolean;
  immersiveSidebar: boolean;
  sidebarPosition: 'left' | 'right';
  navigationMode: 'sidebar' | 'topbar' | 'floaty';
  navModeVersion?: number;
  floatingSearchBar: boolean;
  floatingSearchBarVersion?: number;
  streamAspectRatio: '16:9' | '4:3';
  developerMode: boolean;
  animatedBootScreen: boolean;
  triangleExperiment: boolean;
  triangleExperimentVersion?: number;
  newWatchTab: boolean;
  fluentIcons: boolean;
  dynamicSidebarIcons: boolean;
  pageAnimation: 'slideUp' | 'zoomIn';
  pageLoading: boolean;
  pageLoadingVersion?: number;
  loadPagesSequentially: boolean;
  customKeybinds: CustomKeybinds;
}

export const getDefaultNavigationMode = (): 'sidebar' | 'topbar' | 'floaty' => {
  return 'sidebar';
};

export const DEFAULT_SETTINGS: SystemSettings = {
  theme: 'dark', // Ban đêm (Dark mode) là mặc định
  themeVersion: 2,
  superDarkMode: false,
  spatialGlass: true,
  spatialGlassVersion: 3,
  spatialGlassOpacity: 20, // 20% mặc định cho Dark mode
  spatialGlassBlur: 10, // 10%
  disableShinyOutline: false,
  dockToSidebar: true,
  fontScale: 2, // Mặc định là "Trung bình" (quy chuẩn chuẩn cho cả desktop nhỏ và mobile)
  fontScaleVersion: 2,
  autoScrollBanner: true,
  autoHideSidebar: false,
  hoverToExpand: true,
  hoverToExpandVersion: 1,
  searchCategories: true,
  searchNews: true,
  searchTv: true,
  searchChannelNumber: true,
  searchSettings: true,
  reduceAllMotion: false,
  animateSidebar: true,
  animateModals: true,
  animatePageTransitions: true,
  immersiveSearch: true,
  nativeKeyboard: typeof window !== 'undefined' ? window.innerWidth < 768 : false,
  nativeKeyboardVersion: 3,
  keyboardNumberRow: false,
  keyboardClipboard: true,
  keyboardSoundEnabled: true,
  immersiveSidebar: false,
  sidebarPosition: 'left',
  navigationMode: 'sidebar',
  navModeVersion: 3,
  floatingSearchBar: true,
  floatingSearchBarVersion: 1,
  streamAspectRatio: '16:9',
  developerMode: false,
  animatedBootScreen: false,
  triangleExperiment: true,
  triangleExperimentVersion: 1,
  newWatchTab: false,
  fluentIcons: false,
  dynamicSidebarIcons: true,
  pageAnimation: 'slideUp',
  pageLoading: false,
  pageLoadingVersion: 2,
  loadPagesSequentially: false,
  customKeybinds: DEFAULT_KEYBINDS,
};

export const FONT_SCALE_CONFIG = [
  { label: 'Cực nhỏ', value: 75, badge: 'Cực nhỏ', scale: '0.78' },
  { label: 'Nhỏ', value: 88, badge: 'Nhỏ', scale: '0.88' },
  { label: 'Trung bình', value: 100, badge: 'Trung bình', scale: '1' },
  { label: 'Lớn', value: 112, badge: 'Lớn', scale: '1.12' },
  { label: 'Cực lớn', value: 125, badge: 'Cực lớn', scale: '1.24' },
];

export const getStoredSettings = (): SystemSettings => {
  try {
    const saved = localStorage.getItem('waves_system_settings');
    
    if (saved) {
      const parsed = JSON.parse(saved);
      let fontScale = typeof parsed.fontScale === 'number' ? parsed.fontScale : DEFAULT_SETTINGS.fontScale;
      // Auto-migrate from old 4-item scheme if needed
      if (parsed.fontScaleVersion !== 2) {
        if (fontScale === 1) {
          fontScale = 2; // Old 'Mặc định' was idx 1 -> now 'Trung bình' at idx 2
        } else if (fontScale === 0) {
          fontScale = 1; // Old 'Nhỏ' was idx 0 -> now 'Nhỏ' at idx 1
        } else if (fontScale === 2) {
          fontScale = 3; // Old 'Lớn' was idx 2 -> now 'Lớn' at idx 3
        } else if (fontScale === 3) {
          fontScale = 4; // Old 'Cực lớn' was idx 3 -> now 'Cực lớn' at idx 4
        } else {
          fontScale = 2;
        }
      }
      let navigationMode = parsed.navigationMode;
      if (navigationMode === 'immersive' || navigationMode === 'immersive_floaty') {
        navigationMode = 'floaty';
      }
      // Side View (sidebar) is the default navigation mode
      if (!navigationMode || parsed.navModeVersion !== 3) {
        navigationMode = 'sidebar';
      }
      const immersiveSearch = parsed.immersiveSearchVersion === 2
        ? parsed.immersiveSearch
        : true;
      const theme = parsed.themeVersion === 2
        ? (parsed.theme === 'light' ? 'light' : 'dark')
        : 'dark';
      return { 
        ...DEFAULT_SETTINGS, 
        ...parsed,
        theme,
        themeVersion: 2,
        immersiveSearch,
        immersiveSearchVersion: 2,
        navigationMode: navigationMode || DEFAULT_SETTINGS.navigationMode,
        navModeVersion: 2,
        floatingSearchBar: parsed.floatingSearchBarVersion === 1
          ? (typeof parsed.floatingSearchBar === 'boolean' ? parsed.floatingSearchBar : true)
          : true,
        floatingSearchBarVersion: 1,
        nativeKeyboard: parsed.nativeKeyboardVersion === 3
          ? (typeof parsed.nativeKeyboard === 'boolean' ? parsed.nativeKeyboard : (typeof window !== 'undefined' ? window.innerWidth < 768 : false))
          : (typeof window !== 'undefined' ? window.innerWidth < 768 : false),
        nativeKeyboardVersion: 3,
        keyboardNumberRow: typeof parsed.keyboardNumberRow === 'boolean' ? parsed.keyboardNumberRow : DEFAULT_SETTINGS.keyboardNumberRow,
        keyboardClipboard: typeof parsed.keyboardClipboard === 'boolean' ? parsed.keyboardClipboard : DEFAULT_SETTINGS.keyboardClipboard,
        keyboardSoundEnabled: typeof parsed.keyboardSoundEnabled === 'boolean' ? parsed.keyboardSoundEnabled : DEFAULT_SETTINGS.keyboardSoundEnabled,
        superDarkMode: typeof parsed.superDarkMode === 'boolean' ? parsed.superDarkMode : DEFAULT_SETTINGS.superDarkMode,
        spatialGlass: parsed.spatialGlassVersion >= 2
          ? (typeof parsed.spatialGlass === 'boolean' ? parsed.spatialGlass : true)
          : true,
        spatialGlassVersion: 3,
        spatialGlassOpacity: typeof parsed.spatialGlassOpacity === 'number'
          ? Math.max(0, Math.min(100, parsed.spatialGlassOpacity))
          : 20,
        spatialGlassBlur: (parsed.spatialGlassVersion === 3 && typeof parsed.spatialGlassBlur === 'number')
          ? Math.max(0, Math.min(100, parsed.spatialGlassBlur))
          : 10,
        disableShinyOutline: false,
        customKeybinds: {
          ...DEFAULT_KEYBINDS,
          ...(parsed.customKeybinds || {})
        },
        animatedBootScreen: typeof parsed.animatedBootScreen === 'boolean' ? parsed.animatedBootScreen : false,
        triangleExperiment: parsed.triangleExperimentVersion === 1
          ? (typeof parsed.triangleExperiment === 'boolean' ? parsed.triangleExperiment : true)
          : true,
        triangleExperimentVersion: 1,
        newWatchTab: typeof parsed.newWatchTab === 'boolean' ? parsed.newWatchTab : DEFAULT_SETTINGS.newWatchTab,
        fluentIcons: typeof parsed.fluentIcons === 'boolean' ? parsed.fluentIcons : DEFAULT_SETTINGS.fluentIcons,
        dynamicSidebarIcons: typeof parsed.dynamicSidebarIcons === 'boolean' ? parsed.dynamicSidebarIcons : true,
        pageAnimation: parsed.pageAnimation === 'zoomIn' ? 'zoomIn' : 'slideUp',
        pageLoading: parsed.pageLoadingVersion === 2
          ? (typeof parsed.pageLoading === 'boolean' ? parsed.pageLoading : false)
          : false,
        pageLoadingVersion: 2,
        loadPagesSequentially: typeof parsed.loadPagesSequentially === 'boolean' ? parsed.loadPagesSequentially : false,
        hoverToExpand: parsed.hoverToExpandVersion === 1
          ? (typeof parsed.hoverToExpand === 'boolean' ? parsed.hoverToExpand : true)
          : true,
        hoverToExpandVersion: 1,
        fontScale,
        fontScaleVersion: 2,
      };
    }
  } catch {}
  return DEFAULT_SETTINGS;
};

// Apply side-effects (theme class, font-scale property)
export const applySystemSettings = (settings: SystemSettings) => {
  if (typeof document === 'undefined') return;

  // Triangle Loading Experiment
  if (settings.triangleExperiment) {
    document.documentElement.classList.add('triangle-experiment-active');
  } else {
    document.documentElement.classList.remove('triangle-experiment-active');
  }

  // App Theme Mode (Ban ngày / Ban đêm - Ban đêm là mặc định)
  if (settings.theme === 'light') {
    document.documentElement.classList.add('light-mode');
    document.documentElement.classList.remove('dark');
    document.body?.classList.add('light-mode');
  } else {
    document.documentElement.classList.remove('light-mode');
    document.documentElement.classList.add('dark');
    document.body?.classList.remove('light-mode');
  }
  document.documentElement.dataset.immersiveSidebar = String(settings.immersiveSidebar);
  document.documentElement.dataset.sidebarPosition = settings.sidebarPosition;

  // Super Dark Mode
  if (settings.superDarkMode) {
    document.documentElement.classList.add('super-dark');
    document.body?.classList.add('super-dark');
  } else {
    document.documentElement.classList.remove('super-dark');
    document.body?.classList.remove('super-dark');
  }

  // Spatial Glass (when turned off, all borders on elements across the app disappear)
  const isSpatialGlassActive = settings.spatialGlass !== false;
  const opacity = typeof settings.spatialGlassOpacity === 'number' ? settings.spatialGlassOpacity : 20;
  const blur = typeof settings.spatialGlassBlur === 'number' ? settings.spatialGlassBlur : 10;
  const isDarkContent = isSpatialGlassActive && opacity > 40;
  const isUnder40 = isSpatialGlassActive && opacity < 40;
  document.documentElement.classList.toggle('spatial-glass-dark-content', isDarkContent);
  document.documentElement.classList.toggle('spatial-glass-under-40', isUnder40);

  if (!isSpatialGlassActive) {
    document.documentElement.classList.add('no-spatial-glass', 'no-shiny-outline');
    document.body?.classList.add('no-spatial-glass', 'no-shiny-outline');
    document.documentElement.style.setProperty('--spatial-glass-opacity', '0');
    document.documentElement.style.setProperty('--spatial-glass-bg', 'rgba(24, 24, 27, 0.85)');
    document.documentElement.style.setProperty('--spatial-glass-blur', '0px');
  } else {
    document.documentElement.classList.remove('no-spatial-glass', 'no-shiny-outline');
    document.body?.classList.remove('no-spatial-glass', 'no-shiny-outline');
    const opacityVal = opacity / 100;
    const blurPx = Math.round((blur / 100) * 40);
    document.documentElement.style.setProperty('--spatial-glass-opacity', String(opacityVal));
    document.documentElement.style.setProperty('--spatial-glass-bg', `rgba(255, 255, 255, ${opacityVal})`);
    document.documentElement.style.setProperty('--spatial-glass-blur', `${blurPx}px`);
  }

  // Apply font scale
  const scaleVal = FONT_SCALE_CONFIG[settings.fontScale]?.scale || '1';
  document.documentElement.style.setProperty('--waves-font-scale', scaleVal);

  // Apply keyboard sound preference
  keyboardSound.setEnabled(settings.keyboardSoundEnabled !== false);
};

// Initialize current settings and apply them to DOM immediately
let settingsStore = getStoredSettings();
let draftSettingsStore: SystemSettings = { ...settingsStore };

if (typeof window !== 'undefined') {
  applySystemSettings(settingsStore);
}

const listeners = new Set<() => void>();
const draftListeners = new Set<() => void>();

function notifyDraftListeners() {
  draftListeners.forEach((listener) => {
    try {
      listener();
    } catch (err) {
      console.error(err);
    }
  });
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  const handleStorage = (e: StorageEvent) => {
    if (e.key === 'waves_system_settings' || e.key === 'waves_theme' || !e.key) {
      settingsStore = getStoredSettings();
      draftSettingsStore = { ...settingsStore };
      applySystemSettings(settingsStore);
      callback();
      notifyDraftListeners();
    }
  };
  window.addEventListener('storage', handleStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', handleStorage);
  };
}

function subscribeDraft(callback: () => void) {
  draftListeners.add(callback);
  return () => {
    draftListeners.delete(callback);
  };
}

function getSnapshot(): SystemSettings {
  return settingsStore;
}

function getDraftSnapshot(): SystemSettings {
  return draftSettingsStore;
}

export const updateDraftSetting = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
  // Auto-save immediately: changing an option saves immediately without manual confirmation
  updateGlobalSetting(key, value);
};

export const discardDraftSettings = () => {
  draftSettingsStore = { ...settingsStore };
  applySystemSettings(settingsStore);
  notifyDraftListeners();
};

export const applyDraftSettings = () => {
  updateMultipleSettings(draftSettingsStore);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('settings-applied-toast', { 
      detail: { timestamp: Date.now() } 
    }));
  }
};

export const updateGlobalSetting = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
  let extraUpdates: Partial<SystemSettings> = {};
  if (key === 'theme' && value === 'light') {
    extraUpdates.spatialGlassOpacity = 43;
  }
  settingsStore = { ...settingsStore, [key]: value, ...extraUpdates, fontScaleVersion: 2, spatialGlassVersion: 3, nativeKeyboardVersion: 3, pageLoadingVersion: 2 };
  draftSettingsStore = { ...settingsStore };
  try {
    localStorage.setItem('waves_system_settings', JSON.stringify(settingsStore));
    if (key === 'theme') {
      localStorage.setItem('waves_theme', value as string);
    }
  } catch {}
  applySystemSettings(settingsStore);
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (err) {
      console.error(err);
    }
  });
  notifyDraftListeners();
};

export const updateMultipleSettings = (newSettings: Partial<SystemSettings>) => {
  settingsStore = { ...settingsStore, ...newSettings, fontScaleVersion: 2, spatialGlassVersion: 3, nativeKeyboardVersion: 3, pageLoadingVersion: 2 };
  draftSettingsStore = { ...settingsStore };
  try {
    localStorage.setItem('waves_system_settings', JSON.stringify(settingsStore));
    if (newSettings.theme) {
      localStorage.setItem('waves_theme', newSettings.theme);
    }
  } catch {}
  applySystemSettings(settingsStore);
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (err) {
      console.error(err);
    }
  });
  notifyDraftListeners();
};

export const useSettings = () => {
  const settings = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const draftSettings = useSyncExternalStore(subscribeDraft, getDraftSnapshot, getDraftSnapshot);

  const keys = Object.keys(draftSettings) as (keyof SystemSettings)[];
  const changedKeys = keys.filter((k) => draftSettings[k] !== settings[k]);
  const hasChanges = changedKeys.length > 0;

  return { 
    settings, 
    draftSettings,
    hasChanges,
    changedKeys,
    updateSetting: updateGlobalSetting,
    updateMultipleSettings,
    updateDraftSetting,
    applyDraftSettings,
    discardDraftSettings
  };
};
