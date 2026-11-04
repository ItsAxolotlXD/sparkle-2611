import React, { useState, useEffect } from 'react';
import { 
  Type, 
  X,
  RotateCcw,
  AlertCircle,
  Tv,
  ChevronDown,
  Sun,
  Moon,
  Play
} from 'lucide-react';
import { AnimatedBootScreen } from '../components/AnimatedBootScreen';
import { SparkleRecoveryModal } from '../components/SparkleRecoveryModal';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings, FONT_SCALE_CONFIG, SystemSettings } from '../hooks/useSettings';
import { modalDialogVariants, modalBackdropVariants } from '../utils/animations';
import { SfCheckmark } from '../components/SfCheckmark';
import { KEYBIND_DEFINITIONS, DEFAULT_KEYBINDS, eventToKeyString, validateKeybind } from '../utils/keybinds';
import { KeybindAction } from '../types';
import { showAppToast } from '../utils/toast';
import { FluentEmoji } from '../components/FluentEmoji';

const SETTING_LABELS: Partial<Record<keyof SystemSettings, string>> = {
  theme: 'App theme',
  navigationMode: 'Navigation mode',
  sidebarPosition: 'Sidebar position',
  fontScale: 'Font scaling',
  superDarkMode: 'Super dark mode',
  spatialGlass: 'Spatial glass',
  spatialGlassOpacity: 'Spatial glass opacity',
  spatialGlassBlur: 'Spatial glass blur',
  autoHideSidebar: 'Auto-hide sidebar',
  hoverToExpand: 'Hover to expand',
  nativeKeyboard: 'Touch keyboard',
  keyboardNumberRow: 'Keyboard number row',
  keyboardClipboard: 'Keyboard clipboard',
  keyboardSoundEnabled: 'Keyboard sound',
  customKeybinds: 'Keybinds',
  newWatchTab: 'Watch tab layout',
  fluentIcons: 'Fluent icons',
  dynamicSidebarIcons: 'Dynamic sidebar icons',
  useFlumojs: 'Use Flumojs',
  pageAnimation: 'Page animation',
  pageLoading: 'Page loading',
  loadPagesSequentially: 'Load pages sequentially',
  streamAspectRatio: 'Stream aspect ratio',
  immersiveSearch: 'Immersive search',
  developerMode: 'Developer mode',
  animatedBootScreen: 'Animated boot screen',
  triangleExperiment: 'Loading experiment',
};

export type SettingsCategoryId = 
  | 'settings-section-experimental'
  | 'settings-section-interface'
  | 'settings-section-keyboard'
  | 'settings-section-tools'
  | 'settings-section-version';

interface SettingsProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onOpenUpdate?: () => void;
  onOpenOfficeTool?: (tool: string) => void;
  navigate?: (route: string) => void;
  onRestartOobe?: () => void;
}

// Staggered slide up variant for cascading entrance animation matching sidebar context menu
const slideUpVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.38,
      ease: [0.16, 1, 0.3, 1],
      delay: Math.min(i * 0.04, 0.8),
    },
  }),
};

export const Settings: React.FC<SettingsProps> = ({
  searchQuery = '',
  onOpenUpdate,
  onOpenOfficeTool,
  navigate,
  onRestartOobe
}) => {
  const { 
    draftSettings, 
    updateDraftSetting 
  } = useSettings();

  const [showApplyToast, setShowApplyToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [isLightModeUnlockOpen, setIsLightModeUnlockOpen] = useState(false);
  const [lightModeUnlockCode, setLightModeUnlockCode] = useState('');
  const [lightModeUnlockError, setLightModeUnlockError] = useState('');
  const [editingKeybindId, setEditingKeybindId] = useState<KeybindAction | null>(null);
  const [keybindError, setKeybindError] = useState<{ id: KeybindAction; message: string } | null>(null);
  const [isPreviewBootScreen, setIsPreviewBootScreen] = useState(false);

  useEffect(() => {
    if (!isLightModeUnlockOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightModeUnlockOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightModeUnlockOpen]);

  const toggleCategoryCollapse = (catId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const isCategoryCollapsed = (catId: string) => {
    if (searchQuery.trim()) return false;
    return Boolean(collapsedCategories[catId]);
  };

  const updateDraft = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K], silentToast = false) => {
    updateDraftSetting(key, value);
    if (!silentToast) {
      const label = SETTING_LABELS[key] || String(key);
      if (typeof value === 'boolean') {
        showAppToast(value ? `Enable ${label}` : `Disable ${label}`, { source: 'settings' });
      } else if (key === 'fontScale') {
        const item = FONT_SCALE_CONFIG[value as number];
        const param = item ? `${item.value}%` : `${value}`;
        showAppToast(`Changed ${label} to ${param}`, { source: 'settings' });
      } else if (typeof value === 'number') {
        showAppToast(`Changed ${label} to ${value}%`, { source: 'settings' });
      } else if (key === 'theme') {
        showAppToast(`Changed ${label} to ${value === 'light' ? 'Light' : 'Dark'}`, { source: 'settings' });
      } else {
        showAppToast(`Changed ${label} to ${String(value)}`, { source: 'settings' });
      }
    }
    if (key === 'superDarkMode') {
      if (value) {
        document.documentElement.classList.add('super-dark');
        document.body?.classList.add('super-dark');
      } else {
        document.documentElement.classList.remove('super-dark');
        document.body?.classList.remove('super-dark');
      }
    }
    if (key === 'theme') {
      if (value === 'light') {
        document.documentElement.classList.add('light-mode');
        document.documentElement.classList.remove('dark');
        document.body?.classList.add('light-mode');
      } else {
        document.documentElement.classList.remove('light-mode');
        document.documentElement.classList.add('dark');
        document.body?.classList.remove('light-mode');
      }
    }
    if (key === 'disableShinyOutline') {
      if (value) {
        document.documentElement.classList.add('no-shiny-outline');
        document.body?.classList.add('no-shiny-outline');
      } else {
        document.documentElement.classList.remove('no-shiny-outline');
        document.body?.classList.remove('no-shiny-outline');
      }
    }
  };

  // Search filter helper
  const query = searchQuery.trim().toLowerCase();
  const matchesSearch = (texts: (string | undefined)[]) => {
    if (!query) return true;
    return texts.some((t) => t && t.toLowerCase().includes(query));
  };

  const matchesExperimental =
    matchesSearch(['Insider experiments', 'Insider Flags', 'thử nghiệm', 'touch keyboard', 'native keyboard', 'bàn phím cảm ứng', 'bàn phím ảo', 'immersive search', 'fluent icons', 'flumojs', 'fluent emojis', 'emoji', '3d icons', 'animated boot screen', 'boot screen', 'khởi động', 'video khởi động']);
  const matchesInterface = 
    matchesSearch(['Appearance', 'Interface', 'giao diện', 'chế độ ứng dụng', 'ban ngày', 'ban đêm', 'light', 'dark', 'thanh điều hướng', 'navigation', 'side view', 'top view', 'tab view', 'thu phóng giao diện', 'font', 'vị trí thanh bên', 'siêu chế độ tối', 'super dark']);
  const matchesAccessibility = matchesSearch(['Accessibility', 'trợ năng', 'hover to expand']);
  const matchesKeyboard = matchesSearch(['Keyboard and Mouse', 'Native keyboard', 'bàn phím số', 'clipboard', 'âm bàn phím', 'keyboard sound', 'keybinds', 'phím tắt']);
  const matchesTools = false;
  const matchesVersion = 
    matchesSearch(['Updates', 'thông tin phiên bản', 'cập nhật', 'software update', 'build', 'test sparkle', 'update sparkle', 'sparkle recovery', 'recovery', 'khôi phục', 'reset']);

  const hasAnyMatch = 
    !query || 
    matchesExperimental ||
    matchesInterface || 
    matchesKeyboard ||
    matchesTools ||
    matchesVersion;

  // Global staggered element counter for cascading animation
  let elementIndex = 0;

  return (
    <motion.div
      id="settings-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="settings-page-wrapper w-full max-w-5xl mx-auto pb-28 pt-2 px-4 sm:px-6 select-none space-y-6"
    >
      {/* Top Header with updated description */}
      <motion.div 
        variants={slideUpVariant}
        initial="hidden"
        animate="visible"
        custom={elementIndex++}
        className="pb-3 border-none bg-transparent"
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] dark:text-white tracking-tight">
          Settings
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
          Customize your Sparkle experience your way
        </p>
      </motion.div>

      {/* No matching results fallback */}
      {!hasAnyMatch && (
        <motion.div 
          variants={slideUpVariant}
          initial="hidden"
          animate="visible"
          custom={elementIndex++}
          className="rounded-[6px] bg-white dark:bg-[#2c3037] p-8 text-center space-y-2 border-none"
        >
          <p className="text-sm font-normal text-[#111827] dark:text-white" style={{ fontWeight: 400 }}>
            Không tìm thấy cài đặt phù hợp với "{searchQuery}"
          </p>
          <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
            Hãy thử tìm bằng từ khóa khác hoặc xóa nội dung tìm kiếm trên thanh top bar.
          </p>
        </motion.div>
      )}

      {/* Settings Sections Container */}
      <div className="flex flex-col gap-8 bg-transparent">
        {/* 2. SECTION: INSIDER FLAGS */}
        {matchesExperimental && (
          <section id="settings-section-experimental" className="order-2 space-y-3 bg-transparent">
            {/* Category Header */}
            <motion.div
              variants={slideUpVariant}
              initial="hidden"
              animate="visible"
              custom={elementIndex++}
            >
              <button
                type="button"
                onClick={() => toggleCategoryCollapse('settings-section-experimental')}
                className="fluent-category-header settings-block-card w-full flex items-center justify-between py-2 px-1 text-left bg-transparent hover:opacity-85 transition-opacity cursor-pointer select-none border-none"
              >
                <div className="flex items-center gap-2.5">
                  <img src="/icons/settings/insider.png" alt="" aria-hidden="true" draggable={false} className="fluent-3d-icon w-6 h-6 object-contain shrink-0" />
                  <h2 className="text-base sm:text-lg font-bold text-[#111827] dark:text-white tracking-tight">
                    Insider experiments
                  </h2>
                </div>
                <ChevronDown 
                  className={`w-4 h-4 text-white transition-transform duration-200 ${
                    isCategoryCollapsed('settings-section-experimental') ? '-rotate-90' : 'rotate-0'
                  }`} 
                />
              </button>
            </motion.div>

            {/* Individual Option Blocks */}
            <motion.div
              key="content-settings-section-experimental"
              initial={isCategoryCollapsed('settings-section-experimental') ? { height: 0, opacity: 0 } : false}
              animate={{
                height: isCategoryCollapsed('settings-section-experimental') ? 0 : 'auto',
                opacity: isCategoryCollapsed('settings-section-experimental') ? 0 : 1,
              }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="space-y-2.5 bg-transparent pt-0.5">
                {/* Touch keyboard */}
                {matchesSearch(['Touch keyboard', 'Native keyboard', 'bàn phím cảm ứng', 'bàn phím ảo']) && (
                  <motion.div
                    variants={slideUpVariant}
                    initial="hidden"
                    animate="visible"
                    custom={elementIndex++}
                    id="setting-experimental-touch-keyboard"
                    onClick={() => updateDraft('nativeKeyboard', !draftSettings.nativeKeyboard)}
                    className="settings-block-card rounded-[6px] bg-white dark:bg-[#2c3037] shadow-xs px-4 py-3 sm:py-3.5 flex items-center justify-between gap-4 settings-block-card cursor-pointer hover:bg-black/[0.02] dark:hover:bg-[#363b43] transition-colors border-none"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div
                        id="touch-keyboard-label"
                        className="font-normal text-sm text-[#111827] dark:text-white"
                        style={{ fontWeight: 400 }}
                      >
                        Touch keyboard
                      </div>
                      <p
                        id="touch-keyboard-description"
                        className="mt-1 text-xs leading-relaxed text-[#6B7280] dark:text-[#9CA3AF]"
                      >
                        Shows an on-screen keyboard when you focus a text field. On by default on mobile and off by default on desktop; you can change it anytime.
                      </p>
                    </div>

                    <button
                      id="toggle-touch-keyboard"
                      type="button"
                      role="switch"
                      aria-labelledby="touch-keyboard-label"
                      aria-describedby="touch-keyboard-description"
                      aria-checked={draftSettings.nativeKeyboard}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateDraft('nativeKeyboard', !draftSettings.nativeKeyboard);
                      }}
                      className="toggle-switch-btn focus:outline-none shrink-0 border-none"
                    >
                      <span className="toggle-switch-thumb" />
                    </button>
                  </motion.div>
                )}

                {/* 2. Immersive search experience */}
                {false && matchesSearch(['Immersive search experience', 'tìm kiếm', 'immersive']) && (
                  <motion.div 
                    variants={slideUpVariant}
                    initial="hidden"
                    animate="visible"
                    custom={elementIndex++}
                    id="setting-experimental-immersive-search"
                    onClick={() => updateDraft('immersiveSearch', !draftSettings.immersiveSearch)}
                    className="settings-block-card rounded-[6px] bg-white dark:bg-[#2c3037] shadow-xs px-4 py-3 sm:py-3.5 flex items-center justify-between gap-4 settings-block-card cursor-pointer hover:bg-black/[0.02] dark:hover:bg-[#363b43] transition-colors border-none"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="font-normal text-sm text-[#111827] dark:text-white" style={{ fontWeight: 400 }}>
                        Immersive search experience
                      </div>
                    </div>

                    <button
                      id="toggle-immersive-search"
                      type="button"
                      role="switch"
                      aria-checked={draftSettings.immersiveSearch}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateDraft('immersiveSearch', !draftSettings.immersiveSearch);
                      }}
                      className="toggle-switch-btn focus:outline-none shrink-0 border-none"
                    >
                      <span className="toggle-switch-thumb" />
                    </button>
                  </motion.div>
                )}

                {/* 3. Fluent icons */}
                {false && matchesSearch(['Fluent icons', '3d icons', 'biểu tượng 3d']) && (
                  <motion.div 
                    variants={slideUpVariant}
                    initial="hidden"
                    animate="visible"
                    custom={elementIndex++}
                    id="setting-experimental-fluent-icons"
                    onClick={() => updateDraft('fluentIcons', !draftSettings.fluentIcons)}
                    className="settings-block-card rounded-[6px] bg-white dark:bg-[#2c3037] shadow-xs px-4 py-3 sm:py-3.5 flex items-center justify-between gap-4 settings-block-card cursor-pointer hover:bg-black/[0.02] dark:hover:bg-[#363b43] transition-colors border-none"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                      <div className="w-9 h-9 flex items-center justify-center shrink-0">
                        <img
                          src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Leaf%20fluttering%20in%20wind/3D/leaf_fluttering_in_wind_3d.png"
                          alt=""
                          aria-hidden="true"
                          referrerPolicy="no-referrer"
                          className="w-7 h-7 object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-normal text-sm text-[#111827] dark:text-white flex items-center gap-2" style={{ fontWeight: 400 }}>
                          <span>Fluent icons</span>
                        </div>
                      </div>
                    </div>

                    <button
                      id="toggle-fluent-icons"
                      type="button"
                      role="switch"
                      aria-checked={draftSettings.fluentIcons}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateDraft('fluentIcons', !draftSettings.fluentIcons);
                      }}
                      className="toggle-switch-btn focus:outline-none shrink-0 border-none"
                    >
                      <span className="toggle-switch-thumb" />
                    </button>
                  </motion.div>
                )}

                {/* New Watch Tab */}
                {false && matchesSearch(['New Watch Tab', 'watch', 'preview', 'tab xem']) && (
                  <motion.div
                    variants={slideUpVariant}
                    initial="hidden"
                    animate="visible"
                    custom={elementIndex++}
                    id="setting-experimental-new-watch-tab"
                    onClick={() => updateDraft('newWatchTab', !draftSettings.newWatchTab)}
                    className="settings-block-card rounded-[6px] bg-white dark:bg-[#2c3037] shadow-xs px-4 py-3 sm:py-3.5 flex items-center justify-between gap-4 settings-block-card cursor-pointer hover:bg-black/[0.02] dark:hover:bg-[#363b43] transition-colors border-none"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="font-normal text-sm text-[#111827] dark:text-white flex items-center gap-2">
                        <span>New Watch Tab</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-[6px] uppercase tracking-wider bg-[#0078d4]/10 dark:bg-[#4cc2ff]/20 text-[#0078d4] dark:text-[#4cc2ff]">New</span>
                      </div>
                    </div>
                    <button id="toggle-new-watch-tab" type="button" role="switch" aria-checked={draftSettings.newWatchTab} onClick={(e) => { e.stopPropagation(); updateDraft('newWatchTab', !draftSettings.newWatchTab); }} className="toggle-switch-btn focus:outline-none shrink-0 border-none"><span className="toggle-switch-thumb" /></button>
                  </motion.div>
                )}

                {/* Use Flumojs */}
                {matchesSearch(['Use Flumojs', 'Flumojs', 'Fluent Emojis', 'emoji']) && (
                  <motion.div
                    variants={slideUpVariant}
                    initial="hidden"
                    animate="visible"
                    custom={elementIndex++}
                    id="setting-use-flumojs"
                    onClick={() => updateDraft('useFlumojs', !draftSettings.useFlumojs)}
                    className="settings-block-card rounded-[6px] bg-white dark:bg-[#2c3037] shadow-xs px-4 py-3 sm:py-3.5 flex items-center justify-between gap-4 settings-block-card cursor-pointer hover:bg-black/[0.02] dark:hover:bg-[#363b43] transition-colors border-none"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                      <div className="w-9 h-9 flex items-center justify-center shrink-0">
                        <FluentEmoji emoji="😀" isDecorative className="w-7 h-7 text-[28px]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div id="use-flumojs-label" className="font-normal text-sm text-[#111827] dark:text-white flex items-center gap-2">
                          <span>Use Flumojs</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-[6px] uppercase tracking-wider bg-[#0078d4]/10 dark:bg-[#4cc2ff]/20 text-[#0078d4] dark:text-[#4cc2ff] font-medium">
                            New
                          </span>
                        </div>
                        <p id="use-flumojs-description" className="text-xs text-[#6b7280] dark:text-[#9ca3af] mt-0.5">
                          Render app emoji with Fluent 3D artwork from Fluent Deck.
                        </p>
                      </div>
                    </div>

                    <button
                      id="toggle-use-flumojs"
                      type="button"
                      role="switch"
                      aria-labelledby="use-flumojs-label"
                      aria-describedby="use-flumojs-description"
                      aria-checked={draftSettings.useFlumojs}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateDraft('useFlumojs', !draftSettings.useFlumojs);
                      }}
                      className="toggle-switch-btn focus:outline-none shrink-0 border-none"
                    >
                      <span className="toggle-switch-thumb" />
                    </button>
                  </motion.div>
                )}

                {/* Dynamic sidebar icons */}
                {matchesSearch(['Dynamic sidebar icons', 'dynamic icons', 'sidebar icons', 'icon thanh bên']) && (
                  <motion.div
                    variants={slideUpVariant}
                    initial="hidden"
                    animate="visible"
                    custom={elementIndex++}
                    id="setting-dynamic-sidebar-icons"
                    onClick={() => updateDraft('dynamicSidebarIcons', !draftSettings.dynamicSidebarIcons)}
                    className="settings-block-card rounded-[6px] bg-white dark:bg-[#2c3037] shadow-xs px-4 py-3 sm:py-3.5 flex items-center justify-between gap-4 settings-block-card cursor-pointer hover:bg-black/[0.02] dark:hover:bg-[#363b43] transition-colors border-none"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                      <div className="w-9 h-9 flex items-center justify-center shrink-0">
                        <img
                          src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Sparkles/3D/sparkles_3d.png"
                          alt=""
                          aria-hidden="true"
                          referrerPolicy="no-referrer"
                          className="w-7 h-7 object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-normal text-sm text-[#111827] dark:text-white flex items-center gap-2" style={{ fontWeight: 400 }}>
                          <span>Dynamic sidebar icons</span>
                        </div>
                      </div>
                    </div>

                    <button
                      id="toggle-dynamic-sidebar-icons"
                      type="button"
                      role="switch"
                      aria-checked={draftSettings.dynamicSidebarIcons}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateDraft('dynamicSidebarIcons', !draftSettings.dynamicSidebarIcons);
                      }}
                      className="toggle-switch-btn focus:outline-none shrink-0 border-none"
                    >
                      <span className="toggle-switch-thumb" />
                    </button>
                  </motion.div>
                )}

                {/* Animated boot screen */}
                {matchesSearch(['Animated boot screen', 'boot screen', 'animated splash', 'khởi động', 'video khởi động', 'splash screen']) && (
                  <motion.div
                    variants={slideUpVariant}
                    initial="hidden"
                    animate="visible"
                    custom={elementIndex++}
                    id="setting-animated-boot-screen"
                    onClick={() => updateDraft('animatedBootScreen', !draftSettings.animatedBootScreen)}
                    className="settings-block-card rounded-[6px] bg-white dark:bg-[#2c3037] shadow-xs px-4 py-3 sm:py-3.5 flex items-center justify-between gap-4 settings-block-card cursor-pointer hover:bg-black/[0.02] dark:hover:bg-[#363b43] transition-colors border-none"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                      <div className="w-9 h-9 flex items-center justify-center shrink-0">
                        <img
                          src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Film%20projector/3D/film_projector_3d.png"
                          alt=""
                          aria-hidden="true"
                          referrerPolicy="no-referrer"
                          className="w-7 h-7 object-contain"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/icons/sidebar/watch.png';
                          }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-normal text-sm text-[#111827] dark:text-white flex items-center gap-2" style={{ fontWeight: 400 }}>
                          <span>Animated boot screen</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-[6px] uppercase tracking-wider bg-[#0078d4]/10 dark:bg-[#4cc2ff]/20 text-[#0078d4] dark:text-[#4cc2ff] font-medium">
                            Insider
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsPreviewBootScreen(true);
                        }}
                        className="px-2.5 py-1 text-xs font-medium rounded-[4px] bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 text-[#111827] dark:text-white transition-colors flex items-center gap-1.5 shrink-0"
                        title="Xem thử video khởi động"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span className="hidden sm:inline">Xem thử</span>
                      </button>

                      <button
                        id="toggle-animated-boot-screen"
                        type="button"
                        role="switch"
                        aria-checked={draftSettings.animatedBootScreen}
                        onClick={(e) => {
                          e.stopPropagation();
                          updateDraft('animatedBootScreen', !draftSettings.animatedBootScreen);
                        }}
                        className="toggle-switch-btn focus:outline-none shrink-0 border-none"
                      >
                        <span className="toggle-switch-thumb" />
                      </button>
                    </div>
                  </motion.div>
                )}
                  </div>
            </motion.div>
          </section>
        )}

        {/* 2. SECTION: INTERFACE */}
        {matchesInterface && (
          <section id="settings-section-interface" className="order-3 space-y-3 bg-transparent">
            {/* Category Header */}
            <motion.div
              variants={slideUpVariant}
              initial="hidden"
              animate="visible"
              custom={elementIndex++}
            >
              <button
                type="button"
                onClick={() => toggleCategoryCollapse('settings-section-interface')}
                className="fluent-category-header settings-block-card w-full flex items-center justify-between py-2 px-1 text-left bg-transparent hover:opacity-85 transition-opacity cursor-pointer select-none border-none"
              >
                <div className="flex items-center gap-2.5">
                  <img src="/icons/settings/appearance.png" alt="" aria-hidden="true" draggable={false} className="fluent-3d-icon w-6 h-6 object-contain shrink-0" />
                  <h2 className="text-base sm:text-lg font-bold text-[#111827] dark:text-white tracking-tight">
                    Appearance
                  </h2>
                </div>
                <ChevronDown 
                  className={`w-4 h-4 text-white transition-transform duration-200 ${
                    isCategoryCollapsed('settings-section-interface') ? '-rotate-90' : 'rotate-0'
                  }`} 
                />
              </button>
            </motion.div>

            {/* Individual Option Blocks */}
            <motion.div
              key="content-settings-section-interface"
              initial={isCategoryCollapsed('settings-section-interface') ? { height: 0, opacity: 0 } : false}
              animate={{
                height: isCategoryCollapsed('settings-section-interface') ? 0 : 'auto',
                opacity: isCategoryCollapsed('settings-section-interface') ? 0 : 1,
              }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="space-y-2.5 bg-transparent pt-0.5">
                {/* 1. Chế độ ứng dụng */}
                {matchesSearch(['Chế độ ứng dụng', 'ban ngày', 'ban đêm', 'light', 'dark', 'theme']) && (
                  <motion.div
                    variants={slideUpVariant}
                    initial="hidden"
                    animate="visible"
                    custom={elementIndex++}
                    id="setting-theme-mode"
                    className="settings-block-card rounded-[6px] bg-white dark:bg-[#2c3037] shadow-xs px-4 py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-black/[0.02] dark:hover:bg-[#363b43] transition-colors border-none"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-normal text-sm text-[#111827] dark:text-white" style={{ fontWeight: 400 }}>
                        Chế độ ứng dụng
                      </div>
                      <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5 leading-normal">
                        Lựa chọn giao diện sáng hoặc tối cho toàn bộ hệ thống.
                      </div>
                    </div>
                    <div className="settings-segmented-group grid grid-cols-2 gap-1 rounded-[6px] bg-black/5 dark:bg-black/30 p-1 w-full sm:w-auto sm:min-w-[220px] border-none" role="group" aria-label="Chế độ ứng dụng">
                      {([
                        ['light', 'Ban ngày', Sun],
                        ['dark', 'Ban đêm', Moon],
                      ] as const).map(([val, label, IconComponent]) => (
                        <button
                          key={val}
                          type="button"
                          id={`theme-btn-${val}`}
                          onClick={() => {
                            if (val === 'light') {
                              setLightModeUnlockCode('');
                              setLightModeUnlockError('');
                              setIsLightModeUnlockOpen(true);
                              return;
                            }
                            updateDraft('theme', val);
                          }}
                          className={`flex items-center justify-center gap-1.5 rounded-[6px] px-3 py-1.5 text-xs transition-colors settings-block-card cursor-pointer border-none ${
                            (draftSettings.theme || 'dark') === val
                              ? 'bg-[#0078d4] dark:bg-[#4cc2ff] text-white dark:text-black shadow-xs font-normal'
                              : 'text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 font-normal'
                          }`}
                          aria-pressed={(draftSettings.theme || 'dark') === val}
                        >
                          <IconComponent className="w-3.5 h-3.5 text-white" />
                          <span className="light-mode-white-label">{label}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 2. Thanh điều hướng */}
                {false && matchesSearch(['Thanh điều hướng', 'side view', 'top view', 'tab view', 'navigation']) && (
                  <motion.div 
                    variants={slideUpVariant}
                    initial="hidden"
                    animate="visible"
                    custom={elementIndex++}
                    className="settings-block-card rounded-[6px] bg-white dark:bg-[#2c3037] shadow-xs px-4 py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-black/[0.02] dark:hover:bg-[#363b43] transition-colors border-none"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-normal text-sm text-[#111827] dark:text-white" style={{ fontWeight: 400 }}>
                          Thanh điều hướng
                        </div>
                        {draftSettings.navigationMode === 'topbar' && (
                          <span className="inline-flex items-center text-[10px] font-semibold text-[#0078d4] dark:text-[#4cc2ff] bg-[#0078d4]/10 dark:bg-[#4cc2ff]/10 px-2 py-0.5 rounded-[6px]">
                            Top View
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5 leading-normal">
                        {draftSettings.navigationMode === 'topbar'
                          ? 'Giao diện Top View đưa thanh điều khiển lên đầu màn hình.'
                          : 'Lựa chọn kiểu điều hướng của ứng dụng (Side View, Top View, Tab View).'}
                      </div>
                    </div>
                    <div className="settings-segmented-group grid grid-cols-3 gap-1 rounded-[6px] bg-black/5 dark:bg-black/30 p-1 w-full sm:w-auto sm:min-w-[280px] border-none" role="group" aria-label="Thanh điều hướng">
                      {([
                        ['sidebar', 'Side View'],
                        ['topbar', 'Top View'],
                        ['floaty', 'Tab View'],
                      ] as const).map(([value, label]) => (
                        <button 
                          key={value} 
                          type="button" 
                          onClick={() => { 
                            updateDraft('navigationMode', value); 
                            updateDraft('immersiveSidebar', false); 
                          }} 
                          className={`rounded-[6px] px-2.5 py-1.5 text-xs font-normal transition-colors settings-block-card cursor-pointer text-center truncate border-none ${
                            draftSettings.navigationMode === value
                              ? 'bg-[#0078d4] dark:bg-[#4cc2ff] text-white dark:text-black shadow-xs font-normal'
                              : 'text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 font-normal'
                          }`} 
                          aria-pressed={draftSettings.navigationMode === value}
                          title={label}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 3. Thu phóng giao diện */}
                {matchesSearch(['Thu phóng giao diện', 'font', 'scale', 'kích cỡ']) && (
                  <motion.div 
                    variants={slideUpVariant}
                    initial="hidden"
                    animate="visible"
                    custom={elementIndex++}
                    className="settings-block-card rounded-[6px] bg-white dark:bg-[#2c3037] shadow-xs px-4 py-3 sm:py-3.5 space-y-2 hover:bg-black/[0.02] dark:hover:bg-[#363b43] transition-colors border-none"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <Type className="w-4 h-4 text-white" />
                          <span className="font-normal text-sm text-[#111827] dark:text-white" style={{ fontWeight: 400 }}>
                            Thu phóng giao diện
                          </span>
                        </div>
                        <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5 leading-normal">
                          Tùy chỉnh kích cỡ giao diện ứng dụng để phù hợp với thiết bị của bạn.
                        </div>
                      </div>
                    </div>

                    <div className="py-2.5 px-1">
                      <div className="group relative w-full h-5 flex items-center transition-all settings-slider-capsule select-none">
                        <input
                          id="slider-font-scale"
                          type="range"
                          min="0"
                          max={FONT_SCALE_CONFIG.length - 1}
                          step="1"
                          value={draftSettings.fontScale}
                          onChange={(e) => updateDraft('fontScale', parseInt(e.target.value, 10))}
                          className="absolute inset-0 w-full h-full opacity-0 settings-block-card cursor-pointer z-20"
                          aria-label="Thu phóng giao diện"
                        />

                        <div className="settings-slider-track relative w-full h-1 rounded-full bg-[#8a8a8a] dark:bg-[#7f7f84] overflow-visible pointer-events-none z-10">
                          <div 
                            className="absolute left-0 top-0 h-full rounded-full bg-[#0078d4] dark:bg-[#4cc2ff] transition-all duration-150 ease-out"
                            style={{ width: `${(draftSettings.fontScale / (FONT_SCALE_CONFIG.length - 1)) * 100}%` }}
                          />
                          <div 
                            id="settings-slider-thumb"
                            className="settings-slider-thumb"
                            style={{ 
                              left: `${(draftSettings.fontScale / (FONT_SCALE_CONFIG.length - 1)) * 100}%`,
                              top: '50%',
                              transform: 'translate(-50%, -50%)'
                            }}
                          />
                        </div>
                      </div>

                      <div className="relative flex items-center justify-between text-[11px] pt-2 px-1">
                        {FONT_SCALE_CONFIG.map((item, idx) => {
                          const isSelected = draftSettings.fontScale === idx;
                          let alignClass = 'text-center';
                          if (idx === 0) alignClass = 'text-left';
                          else if (idx === FONT_SCALE_CONFIG.length - 1) alignClass = 'text-right';
                          return (
                            <button
                              key={item.label}
                              type="button"
                              id={`btn-font-scale-${idx}`}
                              onClick={() => updateDraft('fontScale', idx)}
                              className={`settings-block-card cursor-pointer transition-colors py-1 border-none ${alignClass} ${
                                isSelected
                                  ? 'text-[#0078d4] dark:text-[#4cc2ff] font-normal text-xs'
                                  : 'text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white font-normal'
                              }`}
                            >
                              {item.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 4. Vị trí thanh bên (nếu dùng Side View) */}
                {false && draftSettings.navigationMode === 'sidebar' && matchesSearch(['Vị trí thanh bên', 'trái', 'phải', 'sidebar position']) && (
                  <motion.div
                    variants={slideUpVariant}
                    initial="hidden"
                    animate="visible"
                    custom={elementIndex++}
                    id="setting-sidebar-position"
                    className="settings-block-card rounded-[6px] bg-white dark:bg-[#2c3037] shadow-xs px-4 py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-black/[0.02] dark:hover:bg-[#363b43] transition-colors border-none"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-normal text-sm text-[#111827] dark:text-white" style={{ fontWeight: 400 }}>
                        Vị trí thanh bên (Side View position)
                      </div>
                      <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5 leading-normal">
                        Chọn vị trí hiển thị thanh bên trái hoặc phải.
                      </div>
                    </div>
                    <div className="settings-segmented-group grid grid-cols-2 gap-1 rounded-[6px] bg-black/5 dark:bg-black/30 p-1 w-full sm:w-auto sm:min-w-[180px] border-none">
                      {[
                        ['left', 'Trái'],
                        ['right', 'Phải'],
                      ].map(([pos, label]) => (
                        <button
                          key={pos}
                          type="button"
                          onClick={() => updateDraft('sidebarPosition', pos as 'left' | 'right')}
                          className={`rounded-[6px] px-3 py-1.5 text-xs font-normal transition-colors settings-block-card cursor-pointer text-center border-none ${
                            draftSettings.sidebarPosition === pos
                              ? 'bg-[#0078d4] dark:bg-[#4cc2ff] text-white dark:text-black shadow-xs font-normal'
                              : 'text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 font-normal'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 5. Siêu chế độ tối */}
                {false && matchesSearch(['Siêu chế độ tối', 'super dark', 'oled', 'pure black']) && (
                  <motion.div
                    variants={slideUpVariant}
                    initial="hidden"
                    animate="visible"
                    custom={elementIndex++}
                    id="setting-super-dark-mode"
                    className="settings-block-card rounded-[6px] bg-white dark:bg-[#2c3037] shadow-xs px-4 py-3 sm:py-3.5 flex items-center justify-between gap-4 transition-colors hover:bg-black/[0.02] dark:hover:bg-[#363b43] border-none"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="font-normal text-sm text-[#111827] dark:text-white" style={{ fontWeight: 400 }}>
                        Siêu chế độ tối (Super Dark Mode)
                      </div>
                      <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5 leading-normal">
                        Chuyển đổi giao diện sang màu đen tuyền tuyệt đối (OLED Pure Black #000000) giúp tối ưu tiết kiệm pin trên màn hình OLED và tạo cảm giác dịu mắt ban đêm.
                      </div>
                    </div>

                    <button
                      id="toggle-super-dark-mode"
                      type="button"
                      role="switch"
                      aria-checked={draftSettings.superDarkMode}
                      onClick={() => updateDraft('superDarkMode', !draftSettings.superDarkMode)}
                      className="toggle-switch-btn focus:outline-none shrink-0 border-none"
                    >
                      <span className="toggle-switch-thumb" />
                    </button>
                  </motion.div>
                )}

                {matchesInterface && (
                  <motion.div variants={slideUpVariant} initial="hidden" animate="visible" custom={elementIndex++} className="settings-block-card rounded-[6px] bg-white dark:bg-[#2c3037] shadow-xs px-4 py-3 sm:py-3.5 flex items-center justify-between gap-4 transition-colors hover:bg-black/[0.02] dark:hover:bg-[#363b43] border-none">
                    <div className="min-w-0 flex-1 pr-2"><div className="font-normal text-sm text-[#111827] dark:text-white">Tự động ẩn Side View</div><div className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5 leading-normal">Tự động thu gọn thanh menu khi không di chuột vào.</div></div>
                    <button id="toggle-autohide-sidebar-appearance" type="button" role="switch" aria-checked={draftSettings.autoHideSidebar} onClick={() => updateDraft('autoHideSidebar', !draftSettings.autoHideSidebar)} className="toggle-switch-btn focus:outline-none shrink-0 border-none"><span className="toggle-switch-thumb" /></button>
                  </motion.div>
                )}
                  </div>
            </motion.div>
          </section>
        )}

        {/* 3. SECTION: KEYBOARD AND MOUSE */}
        {matchesKeyboard && (
          <section id="settings-section-keyboard" className="order-4 space-y-3 bg-transparent">
            {/* Category Header */}
            <motion.div
              variants={slideUpVariant}
              initial="hidden"
              animate="visible"
              custom={elementIndex++}
            >
              <button
                type="button"
                onClick={() => toggleCategoryCollapse('settings-section-keyboard')}
                className="fluent-category-header settings-block-card w-full flex items-center justify-between py-2 px-1 text-left bg-transparent hover:opacity-85 transition-opacity cursor-pointer select-none border-none"
              >
                <div className="flex items-center gap-2.5">
                  <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-tZDhYcOsxyui7l0TvqaoPI63JZnsSF.png" alt="" aria-hidden="true" draggable={false} className="fluent-3d-icon w-6 h-6 object-contain shrink-0" />
                  <h2 className="text-base sm:text-lg font-bold text-[#111827] dark:text-white tracking-tight">
                    Keyboard and Mouse
                  </h2>
                </div>
                <ChevronDown 
                  className={`w-4 h-4 text-white transition-transform duration-200 ${
                    isCategoryCollapsed('settings-section-keyboard') ? '-rotate-90' : 'rotate-0'
                  }`} 
                />
              </button>
            </motion.div>

            {/* Individual Option Blocks */}
            <motion.div
              key="content-settings-section-keyboard"
              initial={isCategoryCollapsed('settings-section-keyboard') ? { height: 0, opacity: 0 } : false}
              animate={{
                height: isCategoryCollapsed('settings-section-keyboard') ? 0 : 'auto',
                opacity: isCategoryCollapsed('settings-section-keyboard') ? 0 : 1,
              }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="space-y-2.5 bg-transparent pt-0.5">
                {/* 1. Hover to expand */}
                {matchesSearch(['Hover to expand', 'sidebar', 'di chuột', 'mở rộng']) && (
                  <motion.div 
                    variants={slideUpVariant}
                    initial="hidden"
                    animate="visible"
                    custom={elementIndex++}
                    id="setting-hover-to-expand"
                    onClick={() => updateDraft('hoverToExpand', !draftSettings.hoverToExpand)}
                    className="settings-block-card rounded-[6px] bg-white dark:bg-[#2c3037] shadow-xs px-4 py-3 sm:py-3.5 flex items-center justify-between gap-4 settings-block-card cursor-pointer hover:bg-black/[0.02] dark:hover:bg-[#363b43] transition-colors border-none"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="font-normal text-sm text-[#111827] dark:text-white" style={{ fontWeight: 400 }}>
                        Hover to expand
                      </div>
                      <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5 leading-normal">
                        Khi di chuột qua thanh bên đang thu gọn, thanh bên sẽ tự động mở rộng mà không làm thay đổi độ rộng của trang.
                      </div>
                    </div>

                    <button
                      id="toggle-hover-to-expand"
                      type="button"
                      role="switch"
                      aria-checked={draftSettings.hoverToExpand}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateDraft('hoverToExpand', !draftSettings.hoverToExpand);
                      }}
                      className="toggle-switch-btn focus:outline-none shrink-0 border-none"
                    >
                      <span className="toggle-switch-thumb" />
                    </button>
                  </motion.div>
                )}

                {/* 2. Page loading */}
                {false && matchesSearch(['Page loading', 'tải trang', 'vòng xoay']) && (
                  <motion.div 
                    variants={slideUpVariant}
                    initial="hidden"
                    animate="visible"
                    custom={elementIndex++}
                    id="setting-page-loading"
                    onClick={() => updateDraft('pageLoading', !draftSettings.pageLoading)}
                    className="settings-block-card rounded-[6px] bg-white dark:bg-[#2c3037] shadow-xs px-4 py-3 sm:py-3.5 flex items-center justify-between gap-4 settings-block-card cursor-pointer hover:bg-black/[0.02] dark:hover:bg-[#363b43] transition-colors border-none"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="font-normal text-sm text-[#111827] dark:text-white" style={{ fontWeight: 400 }}>
                        Page loading
                      </div>
                      <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5 leading-normal">
                        Hiển thị vòng xoay đang tải trong 1 giây trước khi trang hoàn tất để tạo cảm giác mượt mà hơn.
                      </div>
                    </div>

                    <button
                      id="toggle-page-loading"
                      type="button"
                      role="switch"
                      aria-checked={draftSettings.pageLoading}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateDraft('pageLoading', !draftSettings.pageLoading);
                      }}
                      className="toggle-switch-btn focus:outline-none shrink-0 border-none"
                    >
                      <span className="toggle-switch-thumb" />
                    </button>
                  </motion.div>
                )}

                {/* 3. Load pages sequentially */}
                {false && matchesSearch(['Load pages sequentially', 'tải tuần tự', 'cuộn trang']) && (
                  <motion.div 
                    variants={slideUpVariant}
                    initial="hidden"
                    animate="visible"
                    custom={elementIndex++}
                    id="setting-load-pages-sequentially"
                    onClick={() => updateDraft('loadPagesSequentially', !draftSettings.loadPagesSequentially)}
                    className="settings-block-card rounded-[6px] bg-white dark:bg-[#2c3037] shadow-xs px-4 py-3 sm:py-3.5 flex items-center justify-between gap-4 settings-block-card cursor-pointer hover:bg-black/[0.02] dark:hover:bg-[#363b43] transition-colors border-none"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="font-normal text-sm text-[#111827] dark:text-white" style={{ fontWeight: 400 }}>
                        Load pages sequentially
                      </div>
                      <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5 leading-normal">
                        Tải nội dung ban ��ầu của trang, sau đó hiển thị v��ng xoay tải trong 1 giây khi cuộn xuống để khám phá thêm.
                      </div>
                    </div>

                    <button
                      id="toggle-load-pages-sequentially"
                      type="button"
                      role="switch"
                      aria-checked={draftSettings.loadPagesSequentially}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateDraft('loadPagesSequentially', !draftSettings.loadPagesSequentially);
                      }}
                      className="toggle-switch-btn focus:outline-none shrink-0 border-none"
                    >
                      <span className="toggle-switch-thumb" />
                    </button>
                  </motion.div>
                )}

                {/* 4. Bàn phím số */}
                {matchesSearch(['Bàn phím số', 'keyboard number', 'số 0-9']) && (
                  <motion.div 
                    variants={slideUpVariant}
                    initial="hidden"
                    animate="visible"
                    custom={elementIndex++}
                    id="setting-keyboard-number-row"
                    onClick={() => updateDraft('keyboardNumberRow', !draftSettings.keyboardNumberRow)}
                    className="settings-block-card rounded-[6px] bg-white dark:bg-[#2c3037] shadow-xs px-4 py-3 sm:py-3.5 flex items-center justify-between gap-4 settings-block-card cursor-pointer hover:bg-black/[0.02] dark:hover:bg-[#363b43] transition-colors border-none"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="font-normal text-sm text-[#111827] dark:text-white" style={{ fontWeight: 400 }}>
                        Bàn phím số
                      </div>
                      <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5 leading-normal">
                        Hiển thị bàn phím số từ 0 đến 9 ngay trên dải phím chữ.
                      </div>
                    </div>

                    <button
                      id="toggle-keyboard-number-row"
                      type="button"
                      role="switch"
                      aria-checked={draftSettings.keyboardNumberRow}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateDraft('keyboardNumberRow', !draftSettings.keyboardNumberRow);
                      }}
                      className="toggle-switch-btn focus:outline-none shrink-0 border-none"
                    >
                      <span className="toggle-switch-thumb" />
                    </button>
                  </motion.div>
                )}

                {/* 5. Clipboard */}
                {matchesSearch(['Clipboard', 'lịch sử sao chép', 'bộ nhớ tạm']) && (
                  <motion.div 
                    variants={slideUpVariant}
                    initial="hidden"
                    animate="visible"
                    custom={elementIndex++}
                    id="setting-keyboard-clipboard"
                    onClick={() => updateDraft('keyboardClipboard', !draftSettings.keyboardClipboard)}
                    className="settings-block-card rounded-[6px] bg-white dark:bg-[#2c3037] shadow-xs px-4 py-3 sm:py-3.5 flex items-center justify-between gap-4 settings-block-card cursor-pointer hover:bg-black/[0.02] dark:hover:bg-[#363b43] transition-colors border-none"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="font-normal text-sm text-[#111827] dark:text-white" style={{ fontWeight: 400 }}>
                        Clipboard
                      </div>
                      <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5 leading-normal">
                        Danh sách lịch sử sao chép trong ứng dụng.
                      </div>
                    </div>

                    <button
                      id="toggle-keyboard-clipboard"
                      type="button"
                      role="switch"
                      aria-checked={draftSettings.keyboardClipboard}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateDraft('keyboardClipboard', !draftSettings.keyboardClipboard);
                      }}
                      className="toggle-switch-btn focus:outline-none shrink-0 border-none"
                    >
                      <span className="toggle-switch-thumb" />
                    </button>
                  </motion.div>
                )}

                {/* 6. Âm bàn phím */}
                {matchesSearch(['Âm bàn phím', 'keyboard sound', 'âm thanh']) && (
                  <motion.div 
                    variants={slideUpVariant}
                    initial="hidden"
                    animate="visible"
                    custom={elementIndex++}
                    id="setting-keyboard-sound"
                    onClick={() => updateDraft('keyboardSoundEnabled', !draftSettings.keyboardSoundEnabled)}
                    className="settings-block-card rounded-[6px] bg-white dark:bg-[#2c3037] shadow-xs px-4 py-3 sm:py-3.5 flex items-center justify-between gap-4 settings-block-card cursor-pointer hover:bg-black/[0.02] dark:hover:bg-[#363b43] transition-colors border-none"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="font-normal text-sm text-[#111827] dark:text-white" style={{ fontWeight: 400 }}>
                        Âm bàn phím
                      </div>
                      <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5 leading-normal">
                        Phát ra tiếng "pop" khi gõ trên bàn phím.
                      </div>
                    </div>

                    <button
                      id="toggle-keyboard-sound"
                      type="button"
                      role="switch"
                      aria-checked={draftSettings.keyboardSoundEnabled}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateDraft('keyboardSoundEnabled', !draftSettings.keyboardSoundEnabled);
                      }}
                      className="toggle-switch-btn focus:outline-none shrink-0 border-none"
                    >
                      <span className="toggle-switch-thumb" />
                    </button>
                  </motion.div>
                )}

                <div className="px-1 pt-4 text-xs font-semibold uppercase tracking-wider text-[#6B7280] dark:text-[#9CA3AF]">Keybinds</div>
                {matchesSearch(['Keyboard and Mouse', 'Tổ hợp phím', 'keybinds', 'phím tắt', 'ctrl', 'alt', 'keyboard sound', 'b��n phím']) && (
                  <motion.div 
                    variants={slideUpVariant}
                    initial="hidden"
                    animate="visible"
                    custom={elementIndex++}
                    className="space-y-2 pt-2 bg-transparent"
                  >
                    <div className="flex items-center justify-between px-1 bg-transparent">
                      <div className="flex items-center gap-2 font-normal text-xs text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider" style={{ fontWeight: 400 }}>
                        <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-tZDhYcOsxyui7l0TvqaoPI63JZnsSF.png" alt="" aria-hidden="true" className="w-5 h-5 object-contain" />
                        <span>Keyboard and Mouse</span>
                      </div>
                      <button
                        type="button"
                        id="btn-reset-keybinds"
                        onClick={() => {
                          updateDraft('customKeybinds', { ...DEFAULT_KEYBINDS });
                          setEditingKeybindId(null);
                          setKeybindError(null);
                        }}
                        title="Đặt lại tất cả phím tắt về mặc định"
                        className="px-2.5 py-1 rounded-[6px] text-xs font-normal text-[#0078d4] dark:text-[#4cc2ff] hover:bg-black/5 dark:hover:bg-black/20 transition-colors flex items-center gap-1.5 shrink-0 settings-block-card cursor-pointer border-none"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-white" />
                        <span>Phím tắt mặc định</span>
                      </button>
                    </div>

                    <div className="space-y-2 bg-transparent">
                      {KEYBIND_DEFINITIONS.map((def) => {
                        const currentKey = draftSettings.customKeybinds?.[def.id] || def.defaultKey;
                        const isEditing = editingKeybindId === def.id;
                        const error = keybindError?.id === def.id ? keybindError.message : null;

                        return (
                          <div
                            key={def.id}
                            id={`keybind-row-${def.id}`}
                            className="settings-block-card rounded-[6px] bg-white dark:bg-[#2c3037] shadow-xs px-4 py-3 sm:py-3.5 flex flex-col gap-2 hover:bg-black/[0.02] dark:hover:bg-[#363b43] transition-colors border-none"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="font-normal text-sm text-[#111827] dark:text-white flex items-center gap-2" style={{ fontWeight: 400 }}>
                                  <span>{def.label}</span>
                                  {currentKey !== def.defaultKey && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded-[6px] bg-[#0078d4]/10 dark:bg-[#4cc2ff]/20 text-[#0078d4] dark:text-[#4cc2ff] font-normal">
                                      Đã đổi
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5 leading-normal">
                                  {def.description}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {isEditing ? (
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      autoFocus
                                      readOnly
                                      data-keybind-recording="true"
                                      value="Nhấn tổ hợp phím..."
                                      onKeyDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();

                                        if (e.key === 'Escape') {
                                          setEditingKeybindId(null);
                                          setKeybindError(null);
                                          return;
                                        }

                                        const keyStr = eventToKeyString(e.nativeEvent);
                                        if (!keyStr) return;

                                        const validation = validateKeybind(keyStr);
                                        if (!validation.valid) {
                                          setKeybindError({ id: def.id, message: validation.reason || 'Phím tắt không hợp lệ.' });
                                          return;
                                        }

                                        const existingAction = Object.entries(draftSettings.customKeybinds || {}).find(
                                          ([act, key]) => act !== def.id && typeof key === 'string' && key.toLowerCase() === keyStr.toLowerCase()
                                        );

                                        if (existingAction) {
                                          const conflictDef = KEYBIND_DEFINITIONS.find((d) => d.id === existingAction[0]);
                                          setKeybindError({
                                            id: def.id,
                                            message: `Phím này đã được dùng cho "${conflictDef?.label || existingAction[0]}".`
                                          });
                                          return;
                                        }

                                        const updated = {
                                          ...(draftSettings.customKeybinds || DEFAULT_KEYBINDS),
                                          [def.id]: keyStr
                                        };
                                        updateDraft('customKeybinds', updated);
                                        setEditingKeybindId(null);
                                        setKeybindError(null);
                                      }}
                                      className="px-2.5 py-1 text-xs rounded-[6px] bg-[#0078d4]/10 text-[#0078d4] dark:text-[#4cc2ff] outline-none font-mono font-normal w-36 text-center animate-pulse border border-[#0078d4]"
                                      aria-label={`Gán phím cho ${def.label}`}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingKeybindId(null);
                                        setKeybindError(null);
                                      }}
                                      className="p-1.5 rounded-[6px] text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 text-xs transition-colors border-none"
                                      title="Hủy"
                                    >
                                      <X className="w-3.5 h-3.5 text-white" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      id={`btn-edit-keybind-${def.id}`}
                                      onClick={() => {
                                        setEditingKeybindId(def.id);
                                        setKeybindError(null);
                                      }}
                                      title="Nhấp để thay đổi phím tắt"
                                      className="px-2.5 py-1 rounded-[6px] bg-black/5 dark:bg-black/30 hover:bg-black/10 dark:hover:bg-black/40 text-[#111827] dark:text-white font-mono text-xs font-normal transition-colors settings-block-card cursor-pointer border-none"
                                    >
                                      {currentKey}
                                    </button>
                                    {currentKey !== def.defaultKey && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = {
                                            ...(draftSettings.customKeybinds || DEFAULT_KEYBINDS),
                                            [def.id]: def.defaultKey
                                          };
                                          updateDraft('customKeybinds', updated);
                                          setKeybindError(null);
                                        }}
                                        className="p-1 rounded-[6px] text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors settings-block-card cursor-pointer border-none"
                                        title="Khôi phục mặc định"
                                      >
                                        <RotateCcw className="w-3 h-3 text-white" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {error && (
                              <div className="flex items-start gap-1.5 text-xs text-red-500 bg-red-500/10 p-2 rounded-[6px] border border-red-500/20">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-white" />
                                <span>{error}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
                  </div>
            </motion.div>
          </section>
        )}

        {/* 4. SECTION: TOOLS (removed) */}
        {false && matchesTools && (
          <section id="settings-section-tools" className="space-y-3 bg-transparent">
            {/* Category Header */}
            <motion.div
              variants={slideUpVariant}
              initial="hidden"
              animate="visible"
              custom={elementIndex++}
            >
              <button
                type="button"
                onClick={() => toggleCategoryCollapse('settings-section-tools')}
                className="fluent-category-header settings-block-card w-full flex items-center justify-between py-2 px-1 text-left bg-transparent hover:opacity-85 transition-opacity cursor-pointer select-none border-none"
              >
                <div className="flex items-center gap-2.5">
                  <img src="/icons/settings/tools.png" alt="" aria-hidden="true" draggable={false} className="fluent-3d-icon w-6 h-6 object-contain shrink-0" />
                  <h2 className="text-base sm:text-lg font-bold text-[#111827] dark:text-white tracking-tight">
                    Tools
                  </h2>
                </div>
                <ChevronDown 
                  className={`w-4 h-4 text-white transition-transform duration-200 ${
                    isCategoryCollapsed('settings-section-tools') ? '-rotate-90' : 'rotate-0'
                  }`} 
                />
              </button>
            </motion.div>

            {/* Individual Option Blocks */}
            <motion.div
              key="content-settings-section-tools"
              initial={isCategoryCollapsed('settings-section-tools') ? { height: 0, opacity: 0 } : false}
              animate={{
                height: isCategoryCollapsed('settings-section-tools') ? 0 : 'auto',
                opacity: isCategoryCollapsed('settings-section-tools') ? 0 : 1,
              }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="space-y-2.5 bg-transparent pt-0.5">
                {/* 1. Tỉ lệ khung hình */}
                {false && matchesSearch(['Tỉ lệ khung hình', 'aspect ratio', '16:9', '4:3']) && (
                  <motion.div 
                    variants={slideUpVariant}
                    initial="hidden"
                    animate="visible"
                    custom={elementIndex++}
                    className="settings-block-card rounded-[6px] bg-white dark:bg-[#2c3037] shadow-xs px-4 py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-black/[0.02] dark:hover:bg-[#363b43] transition-colors border-none"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Tv className="w-4 h-4 text-white" />
                        <span className="font-normal text-sm text-[#111827] dark:text-white" style={{ fontWeight: 400 }}>
                          Tỉ lệ khung hình
                        </span>
                      </div>
                      <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5 leading-normal">
                        Chuyển đổi tỉ lệ khung hình khi xem giữa 4:3 hoặc 16:9.
                      </div>
                    </div>
                    <div className="settings-segmented-group grid grid-cols-2 gap-1 rounded-[6px] bg-black/5 dark:bg-black/30 p-1 w-full sm:w-auto sm:min-w-[220px] border-none">
                      {[
                        { value: '16:9', label: '16:9 (chuẩn rộng)' },
                        { value: '4:3', label: '4:3 (chuẩn vuông)' },
                      ].map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          id={`btn-aspect-${value.replace(':', '-')}`}
                          onClick={() => updateDraft('streamAspectRatio', value as '16:9' | '4:3')}
                          className={`rounded-[6px] px-3 py-1.5 text-xs font-normal transition-colors settings-block-card cursor-pointer text-center border-none ${
                            draftSettings.streamAspectRatio === value
                              ? 'bg-[#0078d4] dark:bg-[#4cc2ff] text-white dark:text-black shadow-xs font-normal'
                              : 'text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 font-normal'
                          }`}
                          aria-pressed={draftSettings.streamAspectRatio === value}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 2. Tự động ẩn Side View */}
                {false && matchesSearch(['Tự động ẩn Side View', 'auto hide', 'sidebar']) && (
                  <motion.div 
                    variants={slideUpVariant}
                    initial="hidden"
                    animate="visible"
                    custom={elementIndex++}
                    className="settings-block-card rounded-[6px] bg-white dark:bg-[#2c3037] shadow-xs px-4 py-3 sm:py-3.5 flex items-center justify-between gap-4 transition-colors hover:bg-black/[0.02] dark:hover:bg-[#363b43] border-none"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="font-normal text-sm text-[#111827] dark:text-white" style={{ fontWeight: 400 }}>
                        Tự động ẩn Side View
                      </div>
                      <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5 leading-normal">
                        Tự động thu gọn thanh menu khi không di chuột vào.
                      </div>
                    </div>

                    <button
                      id="toggle-autohide-sidebar"
                      type="button"
                      role="switch"
                      aria-checked={draftSettings.autoHideSidebar}
                      onClick={() => updateDraft('autoHideSidebar', !draftSettings.autoHideSidebar)}
                      className="toggle-switch-btn focus:outline-none shrink-0 border-none"
                    >
                      <span className="toggle-switch-thumb" />
                    </button>
                  </motion.div>
                )}

                {/* 3. Sparkle Notes */}
                {false && matchesSearch(['Sparkle Notes', 'ghi chú', 'notes']) && (
                  <motion.div 
                    variants={slideUpVariant}
                    initial="hidden"
                    animate="visible"
                    custom={elementIndex++}
                    className="settings-block-card rounded-[6px] bg-white dark:bg-[#2c3037] shadow-xs px-4 py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-black/[0.02] dark:hover:bg-[#363b43] transition-colors border-none"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-normal text-sm text-[#111827] dark:text-white flex items-center gap-2" style={{ fontWeight: 400 }}>
                        <span>Sparkle Notes</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-[6px] font-normal uppercase tracking-wider bg-[#0078d4]/10 dark:bg-[#4cc2ff]/20 text-[#0078d4] dark:text-[#4cc2ff]">
                          Ghi chú
                        </span>
                      </div>
                      <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5 leading-normal">
                        Ứng dụng ghi chú & soạn thảo văn bản, hỗ trợ hiển thị dưới dạng Sticky Note nổi di động.
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenOfficeTool?.('notes')}
                      className="px-4 py-1.5 rounded-[6px] font-normal text-xs text-white bg-[#0078d4] hover:bg-[#106ebe] dark:bg-[#4cc2ff] dark:text-black dark:hover:bg-[#6bd0ff] transition-colors flex items-center gap-2 self-start sm:self-auto settings-block-card cursor-pointer shadow-xs border-none"
                    >
                      <span>Mở Sparkle Notes</span>
                    </button>
                  </motion.div>
                )}
                  </div>
            </motion.div>
          </section>
        )}

        {/* 5. SECTION: UPDATES */}
        {matchesVersion && (
          <section id="settings-section-version" className="order-1 space-y-3 bg-transparent">
            {/* Category Header */}
            <motion.div
              variants={slideUpVariant}
              initial="hidden"
              animate="visible"
              custom={elementIndex++}
            >
              <button
                type="button"
                onClick={() => toggleCategoryCollapse('settings-section-version')}
                className="fluent-category-header settings-block-card w-full flex items-center justify-between py-2 px-1 text-left bg-transparent hover:opacity-85 transition-opacity cursor-pointer select-none border-none"
              >
                <div className="flex items-center gap-2.5">
                  <img src="/icons/settings/updates.png" alt="" aria-hidden="true" draggable={false} className="fluent-3d-icon w-6 h-6 object-contain shrink-0" />
                  <h2 className="text-base sm:text-lg font-bold text-[#111827] dark:text-white tracking-tight">
                    Updates
                  </h2>
                </div>
                <ChevronDown 
                  className={`w-4 h-4 text-white transition-transform duration-200 ${
                    isCategoryCollapsed('settings-section-version') ? '-rotate-90' : 'rotate-0'
                  }`} 
                />
              </button>
            </motion.div>

            {/* Individual Option Blocks */}
            <motion.div
              key="content-settings-section-version"
              initial={isCategoryCollapsed('settings-section-version') ? { height: 0, opacity: 0 } : false}
              animate={{
                height: isCategoryCollapsed('settings-section-version') ? 0 : 'auto',
                opacity: isCategoryCollapsed('settings-section-version') ? 0 : 1,
              }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="space-y-2.5 bg-transparent pt-0.5">
                {/* 1. Version information */}
                {matchesSearch(['Update version', 'Build number', 'Branch', 'Channel', 'Insider Preview', 'co_release', '26105.11', '26.12']) && (
                  <motion.div variants={slideUpVariant} initial="hidden" animate="visible" custom={elementIndex++} className="settings-block-card rounded-[6px] bg-white dark:bg-[#2c3037] shadow-xs p-4 sm:p-5 space-y-3 select-text hover:bg-black/[0.02] dark:hover:bg-[#363b43] transition-colors border-none">
                    <div className="flex items-center justify-between text-xs sm:text-sm"><span className="text-[#111827] dark:text-white">Update version</span><span className="font-semibold text-[#9CA3AF]">26.12</span></div>
                    <div className="flex items-center justify-between text-xs sm:text-sm"><span className="text-[#111827] dark:text-white">Build number</span><span className="font-semibold text-[#9CA3AF]">26105.11</span></div>
                    <div className="flex items-center justify-between text-xs sm:text-sm"><span className="text-[#111827] dark:text-white">Branch</span><span className="font-semibold text-[#9CA3AF]">co_release</span></div>
                    <div className="flex items-center justify-between text-xs sm:text-sm"><span className="text-[#111827] dark:text-white">Channel</span><span className="font-semibold text-[#4cc2ff]">Insider Preview</span></div>
                  </motion.div>
                )}

                {/* 2. Sparkle Insider Program */}
                {matchesSearch(['Join Sparkle Insider Program', 'Functional purpose', 'Early Access', 'Feedback Collection', 'How are you doing']) && (
                  <motion.div variants={slideUpVariant} initial="hidden" animate="visible" custom={elementIndex++} className="settings-block-card rounded-[6px] bg-white dark:bg-[#2c3037] shadow-xs p-4 sm:p-5 space-y-4 select-text hover:bg-black/[0.02] dark:hover:bg-[#363b43] transition-colors border-none">
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-[#111827] dark:text-white">Join Sparkle Insider Program</h3>
                      <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#9CA3AF] mt-2 leading-relaxed">The Sparkle Insider Program is an open software testing program that lets users try out early, pre-release features and builds of Sparkle before they roll-out officially to the general public with Sparkle Insider Preview. Additionally, users who joined Sparkle Insider Program will have a door to access more random out of context Sparkle test builds with Sparkle Dev Insider Preview.</p>
                    </div>
                    <div><h4 className="text-xs sm:text-sm font-semibold text-[#111827] dark:text-white">Functional purpose</h4><ul className="mt-2 space-y-1 text-xs sm:text-sm text-[#6B7280] dark:text-[#9CA3AF] list-disc pl-5"><li>Early Access: Test early new Sparkle features, design changes, and performance updates months before official release.</li><li>Feedback Collection: Submit bug reports, suggestions, and votes to help us shape future updates.</li></ul></div>
                    <div><h4 className="text-xs sm:text-sm font-semibold text-[#111827] dark:text-white">How are you doing?</h4><p className="mt-2 text-xs sm:text-sm text-[#6B7280] dark:text-[#9CA3AF]">Great, you have joined Sparkle Insider Program. Congratulations!</p></div>
                  </motion.div>
                )}

                {/* 3. Developer preview */}
                {matchesSearch(['Sparkle Dev Insider Preview', 'Test Sparkle', 'test build']) && (
                  <motion.div variants={slideUpVariant} initial="hidden" animate="visible" custom={elementIndex++} className="settings-block-card rounded-[6px] bg-white dark:bg-[#2c3037] shadow-xs p-4 sm:p-4.5 flex items-center justify-between gap-3 hover:bg-black/[0.02] dark:hover:bg-[#363b43] transition-colors border-none">
                    <div><div className="font-normal text-[#111827] dark:text-white text-xs sm:text-sm">Sparkle Dev Insider Preview</div><div className="text-[11px] sm:text-xs text-[#9CA3AF] mt-0.5 leading-normal">Try experimental Sparkle builds with early, unreleased features.</div></div>
                    <a id="btn-test-vplay-switch" href="https://test-vplay.vercel.app" target="_blank" rel="noopener noreferrer" className="px-4 py-1.5 rounded-[6px] font-normal text-white bg-[#005fb8] dark:bg-[#4cc2ff] hover:bg-[#0067c0] dark:hover:bg-[#6bd0ff] dark:text-black transition-colors text-xs flex items-center justify-center shrink-0 shadow-xs tracking-tight text-center select-none border-none"><span className="light-mode-white-label">Switch</span></a>
                  </motion.div>
                )}

                {/* 4. Sparkle Recovery */}
                {matchesSearch(['Sparkle Recovery', 'Recovery', 'Useful if something went wrong', 'reset all the options to default value', 'reset', 'khôi phục']) && (
                  <motion.div variants={slideUpVariant} initial="hidden" animate="visible" custom={elementIndex++} className="settings-block-card rounded-[6px] bg-white dark:bg-[#2c3037] shadow-xs p-4 sm:p-4.5 flex items-center justify-between gap-3 hover:bg-black/[0.02] dark:hover:bg-[#363b43] transition-colors border-none">
                    <div>
                      <div className="font-normal text-[#111827] dark:text-white text-xs sm:text-sm">Sparkle Recovery</div>
                      <div className="text-[11px] sm:text-xs text-[#9CA3AF] mt-0.5 leading-normal">
                        Useful if something went wrong with the app or you want to reset all the options to default value.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsRecoveryOpen(true)}
                      className="px-4 py-1.5 rounded-[6px] font-normal text-white bg-[#005fb8] dark:bg-[#4cc2ff] hover:bg-[#0067c0] dark:hover:bg-[#6bd0ff] dark:text-black transition-colors text-xs flex items-center justify-center shrink-0 shadow-xs tracking-tight text-center select-none border-none cursor-pointer"
                    >
                      <span className="light-mode-white-label">Recover</span>
                    </button>
                  </motion.div>
                )}

                {/* 5. Restart Out of Box Experience */}
                {matchesSearch(['Restart Out of Box Experience', 'Out of Box Experience', 'OOBE', 'Setup Wizard', 'cài đặt ban đầu', 'khoi dong lai oobe']) && (
                  <motion.div variants={slideUpVariant} initial="hidden" animate="visible" custom={elementIndex++} className="settings-block-card rounded-[6px] bg-white dark:bg-[#2c3037] shadow-xs p-4 sm:p-4.5 flex items-center justify-between gap-3 hover:bg-black/[0.02] dark:hover:bg-[#363b43] transition-colors border-none">
                    <div>
                      <div className="font-normal text-[#111827] dark:text-white text-xs sm:text-sm">Restart Out of Box Experience</div>
                      <div className="text-[11px] sm:text-xs text-[#9CA3AF] mt-0.5 leading-normal">
                        Launch the initial Sparkle Setup Wizard and welcome onboarding sequence again.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          localStorage.removeItem('sparkle_oobe_completed');
                        } catch {}
                        if (onRestartOobe) {
                          onRestartOobe();
                        } else {
                          window.location.reload();
                        }
                      }}
                      className="px-4 py-1.5 rounded-[6px] font-normal text-white bg-[#005fb8] dark:bg-[#4cc2ff] hover:bg-[#0067c0] dark:hover:bg-[#6bd0ff] dark:text-black transition-colors text-xs flex items-center justify-center shrink-0 shadow-xs tracking-tight text-center select-none border-none cursor-pointer"
                    >
                      <span className="light-mode-white-label">Restart</span>
                    </button>
                  </motion.div>
                )}
                  </div>
            </motion.div>
          </section>
        )}
      </div>

      {/* Temporary light mode maintenance lock */}
      <AnimatePresence>
        {isLightModeUnlockOpen && (
          <div
            key="light-mode-lock-container"
            id="light-mode-lock-container"
            className="fixed inset-0 z-9999 flex items-center justify-center p-4 sm:p-6 select-none"
          >
            <motion.div
              key="light-mode-lock-backdrop"
              id="light-mode-lock-backdrop"
              variants={modalBackdropVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={() => setIsLightModeUnlockOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            />
            <motion.div
              key="light-mode-lock-dialog"
              id="light-mode-lock-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="light-mode-lock-title"
              variants={modalDialogVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="fluent-modal-dialog relative z-10 w-full max-w-[480px] bg-white dark:bg-[#202020] rounded-[6px] overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.22),0_2px_6px_rgba(0,0,0,0.08)] dark:shadow-[0_24px_48px_rgba(0,0,0,0.7),0_2px_6px_rgba(255,255,255,0.04)] text-[#111827] dark:text-[#F3F4F6] border-none"
            >
              <div className="p-6 pb-5">
                <h2 id="light-mode-lock-title" className="text-[19px] sm:text-[20px] font-semibold text-[#111827] dark:text-white tracking-tight leading-snug">
                  Tính năng bị khóa
                </h2>
                <p className="text-[13.5px] sm:text-[14px] text-[#4b5563] dark:text-[#a1a1aa] leading-relaxed mt-2.5">
                  Chế độ ban ngày tạm thời bị khóa để bảo trì. Nếu bạn là nhà phát triển thử nghiệm tính năng này, hãy nhập mã bảo vệ gồm 6 chữ số.
                </p>
                <div className="fluent-input-box relative mt-4 w-full h-9 bg-black/5 dark:bg-[#282c31] flex items-center px-3.5 rounded-[6px] transition-colors border-none">
                  <input
                    autoFocus
                    inputMode="numeric"
                    maxLength={6}
                    value={lightModeUnlockCode}
                    onChange={(event) => {
                      setLightModeUnlockCode(event.target.value.replace(/\D/g, '').slice(0, 6));
                      setLightModeUnlockError('');
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        if (lightModeUnlockCode === '366761') {
                          updateDraft('theme', 'light');
                          setIsLightModeUnlockOpen(false);
                        } else {
                          setLightModeUnlockError('Mã bảo vệ không chính xác.');
                        }
                      }
                    }}
                    placeholder="Nhập mã 6 chữ số"
                    aria-label="Mã bảo vệ"
                    className="w-full bg-transparent text-xs sm:text-[13px] text-[#111827] dark:text-white placeholder-[#71717a] dark:placeholder-white outline-none border-none py-1"
                  />
                </div>
                {lightModeUnlockError && <p className="mt-2 text-xs text-red-500">{lightModeUnlockError}</p>}
              </div>
              <div className="h-[1px] w-full bg-[#E5E5E5] dark:bg-[#2F2F2F]" />
              <div className="fluent-modal-footer bg-[#F3F3F3] dark:bg-[#1C1C1C] px-6 py-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsLightModeUnlockOpen(false)}
                  className="fluent-btn-secondary px-4 h-8 rounded-[6px] bg-white dark:bg-[#2C2C2C] hover:bg-[#F9F9F9] dark:hover:bg-[#343434] text-[#111827] dark:text-white text-[12.5px] shadow-xs transition-colors cursor-pointer border-none"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (lightModeUnlockCode === '366761') {
                      updateDraft('theme', 'light');
                      setIsLightModeUnlockOpen(false);
                    } else {
                      setLightModeUnlockError('Mã bảo vệ không chính xác.');
                    }
                  }}
                  className="fluent-btn-primary px-4 h-8 rounded-[6px] bg-[#0078d4] dark:bg-[#4cc2ff] hover:bg-[#106ebe] dark:hover:bg-[#6bd0ff] text-white dark:text-black font-semibold shadow-xs transition-colors cursor-pointer text-[12.5px] border-none"
                >
                  Unlock
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Preview animated boot video inside Settings if requested */}
      {isPreviewBootScreen && (
        <AnimatedBootScreen onFinish={() => setIsPreviewBootScreen(false)} />
      )}

      {/* Sparkle Recovery Modal */}
      <SparkleRecoveryModal
        isOpen={isRecoveryOpen}
        onClose={() => setIsRecoveryOpen(false)}
        navigate={navigate}
      />
    </motion.div>
  );
};
