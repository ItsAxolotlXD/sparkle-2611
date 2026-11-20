import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  ChevronRight,
  ChevronLeft,
  Power,
  RotateCcw,
  LogOut,
  Monitor,
  Settings as SettingsIcon,
  User,
  FlaskConical,
  Tv,
  Heart,
  Sparkles,
  Sun,
  Moon,
  LayoutGrid,
  X,
  FolderOpen,
} from 'lucide-react';
import { WindowsContextMenu } from './WindowsContextMenu';
import {
  Fluent3DHomeIcon,
  Fluent3DArticlesIcon,
  Fluent3DWatchPreviewIcon,
  Fluent3DGalleryIcon,
  Fluent3DDrawsIcon,
  Fluent3DNotesIcon,
  Fluent3DScreenbugIcon,
  Fluent3DCameraIcon,
  Fluent3DCraftmineIcon,
  Fluent3DPhotopeaIcon,
  Fluent3DSettingsIcon,
  Fluent3DFolderSearchIcon,
  Fluent3DDiscordIcon,
  Fluent3DHtmlWriterIcon,
  Fluent3DPcSettingsIcon,
  Fluent3DFileExplorerIcon,
} from './Fluent3DIcons';
import { FluentPersonFeedbackIcon, FluentSearchIcon } from './FluentIcons';
import { useSettings, getTaskbarHeightPx, getWindowsUiScaleMultiplier } from '../hooks/useSettings';
import { useNotes } from '../context/NotesContext';
import { NEWS_DATA } from '../data/news';
import { Channel } from '../types';

export interface StartMenuAppItem {
  id: string;
  label: string;
  route?: string;
  externalUrl?: string;
  keywords: string;
  renderIcon: (sizeClass?: string) => React.ReactNode;
}

interface WindowsStartMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchRoute: (route: string, state?: any) => void;
  channels: Channel[];
  onSelectChannel: (channel: Channel) => void;
  onRestartOobe?: () => void;
}

type StartPinnedEntry =
  | { type: 'app'; appId: string }
  | { type: 'folder'; id: string; name: string; appIds: string[] };

const START_LAYOUT_STORAGE_KEY = 'sparkle_start_pinned_layout_v1';

const getEntryKey = (entry: StartPinnedEntry) =>
  entry.type === 'app' ? entry.appId : entry.id;

function reconcileStartLayout(
  saved: StartPinnedEntry[] | null,
  apps: StartMenuAppItem[]
): StartPinnedEntry[] {
  const validIds = new Set(apps.map((a) => a.id));
  const seen = new Set<string>();
  const result: StartPinnedEntry[] = [];

  if (Array.isArray(saved)) {
    for (const entry of saved) {
      if (!entry || typeof entry !== 'object') continue;
      if (entry.type === 'app') {
        if (validIds.has(entry.appId) && !seen.has(entry.appId)) {
          seen.add(entry.appId);
          result.push({ type: 'app', appId: entry.appId });
        }
      } else if (entry.type === 'folder' && Array.isArray(entry.appIds)) {
        const cleanIds: string[] = [];
        for (const id of entry.appIds) {
          if (validIds.has(id) && !seen.has(id)) {
            seen.add(id);
            cleanIds.push(id);
          }
        }
        if (cleanIds.length >= 2) {
          result.push({
            type: 'folder',
            id: entry.id || `folder-${cleanIds[0]}`,
            name: typeof entry.name === 'string' && entry.name.trim() ? entry.name : 'Folder',
            appIds: cleanIds,
          });
        } else if (cleanIds.length === 1) {
          result.push({ type: 'app', appId: cleanIds[0] });
        }
      }
    }
  }

  for (const app of apps) {
    if (!seen.has(app.id)) {
      seen.add(app.id);
      result.push({ type: 'app', appId: app.id });
    }
  }
  return result;
}

export const WindowsStartMenu: React.FC<WindowsStartMenuProps> = ({
  isOpen,
  onClose,
  onLaunchRoute,
  channels,
  onSelectChannel,
  onRestartOobe,
}) => {
  const { settings, updateSetting } = useSettings();
  const { notes, setActiveNoteId } = useNotes();
  const isLightMode = settings.theme === 'light';
  const taskbarHeight = getTaskbarHeightPx(settings.taskbarScale);
  const uiScaleMult = getWindowsUiScaleMultiplier(settings.windowsUiScale);
  const isLeftAligned = settings.taskbarAlignment === 'left';
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [showAllApps, setShowAllApps] = useState(false);
  const [isPowerMenuOpen, setIsPowerMenuOpen] = useState(false);
  const [startContextMenu, setStartContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [openFolderId, setOpenFolderId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<
    | { kind: 'pinned'; entryKey: string }
    | { kind: 'folder-app'; folderId: string; appId: string }
    | null
  >(null);
  const [dropTarget, setDropTarget] = useState<{
    entryKey: string;
    zone: 'before' | 'after' | 'merge';
  } | null>(null);
  const [folderAppDropTarget, setFolderAppDropTarget] = useState<{
    appId: string;
    side: 'before' | 'after';
  } | null>(null);
  const [savedLayout, setSavedLayout] = useState<StartPinnedEntry[] | null>(() => {
    try {
      const raw = localStorage.getItem(START_LAYOUT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return null;
  });

  const pinnedApps: StartMenuAppItem[] = useMemo(() => {
    const base: StartMenuAppItem[] = [
      {
        id: 'app-home',
        label: 'Home',
        route: '/',
        keywords: 'home overview trang chu',
        renderIcon: (cls = 'w-8 h-8') => <Fluent3DHomeIcon className={cls} />,
      },
      {
        id: 'app-watch',
        label: 'Watch',
        route: '/live-tv',
        keywords: 'watch live tv channels truyen hinh',
        renderIcon: (cls = 'w-8 h-8') => <Fluent3DWatchPreviewIcon className={cls} />,
      },
      {
        id: 'app-feed',
        label: 'Update blogs',
        route: '/news',
        keywords: 'feed news articles update blogs tin tuc',
        renderIcon: (cls = 'w-8 h-8') => <Fluent3DArticlesIcon className={cls} />,
      },
      {
        id: 'app-gallery',
        label: 'Gallery',
        route: '/gallery',
        keywords: 'gallery photos media album anh',
        renderIcon: (cls = 'w-8 h-8') => <Fluent3DGalleryIcon className={cls} />,
      },
      {
        id: 'app-notes',
        label: 'Notes',
        route: '/notes',
        keywords: 'notes notepad write ghi chu',
        renderIcon: (cls = 'w-8 h-8') => <Fluent3DNotesIcon className={cls} />,
      },
      {
        id: 'app-draws',
        label: 'Ink Canvas',
        route: '/draws',
        keywords: 'ink canvas draws paint ve',
        renderIcon: (cls = 'w-8 h-8') => <Fluent3DDrawsIcon className={cls} />,
      },
      {
        id: 'app-screenbox',
        label: 'Screenbox',
        route: '/screenbox',
        keywords: 'screenbox vlc media player video',
        renderIcon: (cls = 'w-8 h-8') => <Fluent3DScreenbugIcon className={cls} />,
      },
      {
        id: 'app-camera',
        label: 'Camera',
        route: '/camera',
        keywords: 'camera photo webcam may anh',
        renderIcon: (cls = 'w-8 h-8') => <Fluent3DCameraIcon className={cls} />,
      },
      {
        id: 'app-craftmine',
        label: 'Craftmine',
        route: '/craftmine',
        keywords: 'craftmine minecraft game',
        renderIcon: (cls = 'w-8 h-8') => <Fluent3DCraftmineIcon className={cls} />,
      },
      {
        id: 'app-photopea',
        label: 'Photopea',
        route: '/photopea',
        keywords: 'photopea photoshop image editor',
        renderIcon: (cls = 'w-8 h-8') => <Fluent3DPhotopeaIcon className={cls} />,
      },
      {
        id: 'app-file-explorer',
        label: 'File Explorer',
        route: '/file-explorer',
        keywords: 'file explorer files folders drives documents downloads pictures explorer tep tin thu muc',
        renderIcon: (cls = 'w-8 h-8') => <Fluent3DFileExplorerIcon className={cls} />,
      },
      {
        id: 'app-html-writer',
        label: 'HTML Writer',
        route: '/html-writer',
        keywords: 'html writer code editor css js preview winui 3 viet chay html',
        renderIcon: (cls = 'w-8 h-8') => <Fluent3DHtmlWriterIcon className={cls} />,
      },
      {
        id: 'app-channels',
        label: 'Channels',
        route: '/channels',
        keywords: 'channels tv directory danh sach kenh',
        renderIcon: (cls = 'w-7 h-7') => (
          <div className={`${cls} rounded-[8px] bg-[#0078d4]/15 dark:bg-[#4cc2ff]/15 flex items-center justify-center text-[#0078d4] dark:text-[#4cc2ff]`}>
            <Tv className="w-4.5 h-4.5" />
          </div>
        ),
      },
      {
        id: 'app-favorites',
        label: 'Favorites',
        route: '/favorites',
        keywords: 'favorites yeu thich',
        renderIcon: (cls = 'w-7 h-7') => (
          <div className={`${cls} rounded-[8px] bg-rose-500/15 flex items-center justify-center text-rose-500`}>
            <Heart className="w-4.5 h-4.5" />
          </div>
        ),
      },
      {
        id: 'app-winui3',
        label: 'WinUI 3',
        route: '/winui-3',
        keywords: 'winui 3 gallery fluent design',
        renderIcon: (cls = 'w-7 h-7') => (
          <img
            src="https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8e/WinUI.svg/120px-WinUI.svg.png?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=thumbnail&_=20241127184612"
            alt="WinUI 3"
            className={`${cls} object-contain`}
          />
        ),
      },
      {
        id: 'app-search',
        label: 'Search',
        route: '/search',
        keywords: 'search spotlight tim kiem',
        renderIcon: (cls = 'w-8 h-8') => <Fluent3DFolderSearchIcon className={cls} />,
      },
      {
        id: 'app-feedback',
        label: 'Feedback',
        route: '/feedback',
        keywords: 'feedback gop y',
        renderIcon: (cls = 'w-7 h-7') => (
          <div className={`${cls} rounded-[8px] bg-black/5 dark:bg-white/10 flex items-center justify-center`}>
            <FluentPersonFeedbackIcon className="w-5 h-5 text-[#111827] dark:text-white" />
          </div>
        ),
      },
      {
        id: 'app-discord',
        label: 'Discord',
        externalUrl: 'https://discord.gg/wcdjaDDayK',
        keywords: 'discord community',
        renderIcon: (cls = 'w-8 h-8') => <Fluent3DDiscordIcon className={cls} />,
      },
      {
        id: 'app-pc-settings',
        label: 'PC Settings',
        route: '/pc-settings',
        keywords: 'pc settings windows 11 system bluetooth network personalization update',
        renderIcon: (cls = 'w-8 h-8') => <Fluent3DPcSettingsIcon className={cls} />,
      },
      {
        id: 'app-settings',
        label: 'Settings',
        route: '/settings',
        keywords: 'settings cai dat preferences',
        renderIcon: (cls = 'w-8 h-8') => <Fluent3DSettingsIcon className={cls} />,
      },
    ];

    if (settings.developerMode) {
      base.push({
        id: 'app-insider',
        label: 'Insider Flags',
        route: '/test',
        keywords: 'insider flags lab test developer',
        renderIcon: (cls = 'w-7 h-7') => (
          <div className={`${cls} rounded-[8px] bg-violet-500/15 flex items-center justify-center text-violet-500`}>
            <FlaskConical className="w-4.5 h-4.5" />
          </div>
        ),
      });
    }

    return base;
  }, [settings.developerMode]);

  const appById = useMemo(() => {
    const map = new Map<string, StartMenuAppItem>();
    pinnedApps.forEach((app) => map.set(app.id, app));
    return map;
  }, [pinnedApps]);

  const pinnedEntries = useMemo(
    () => reconcileStartLayout(savedLayout, pinnedApps),
    [savedLayout, pinnedApps]
  );

  const commitStartLayout = (nextEntries: StartPinnedEntry[]) => {
    const clean = reconcileStartLayout(nextEntries, pinnedApps);
    setSavedLayout(clean);
    try {
      localStorage.setItem(START_LAYOUT_STORAGE_KEY, JSON.stringify(clean));
    } catch {}
  };

  const resetStartLayout = () => {
    setSavedLayout(null);
    setOpenFolderId(null);
    try {
      localStorage.removeItem(START_LAYOUT_STORAGE_KEY);
    } catch {}
  };

  const openFolder = useMemo(
    () =>
      openFolderId
        ? pinnedEntries.find(
            (e): e is Extract<StartPinnedEntry, { type: 'folder' }> =>
              e.type === 'folder' && e.id === openFolderId
          ) ?? null
        : null,
    [openFolderId, pinnedEntries]
  );

  const handlePinnedEntryDrop = (
    targetEntry: StartPinnedEntry,
    zone: 'before' | 'after' | 'merge'
  ) => {
    if (!dragState || dragState.kind !== 'pinned') return;
    const sourceKey = dragState.entryKey;
    const targetKey = getEntryKey(targetEntry);
    if (sourceKey === targetKey) return;

    const current = [...pinnedEntries];
    const sourceIdx = current.findIndex((e) => getEntryKey(e) === sourceKey);
    if (sourceIdx === -1) return;
    const sourceEntry = current[sourceIdx];

    if (zone === 'merge' && sourceEntry.type === 'app') {
      if (targetEntry.type === 'app') {
        const newFolderId = `folder-${Date.now()}`;
        const updated = current
          .map((e) =>
            getEntryKey(e) === targetKey
              ? {
                  type: 'folder' as const,
                  id: newFolderId,
                  name: 'Folder',
                  appIds: [targetEntry.appId, sourceEntry.appId],
                }
              : e
          )
          .filter((e) => getEntryKey(e) !== sourceKey);
        commitStartLayout(updated);
        return;
      }
      if (targetEntry.type === 'folder') {
        const updated = current
          .map((e) =>
            e.type === 'folder' && e.id === targetEntry.id
              ? { ...e, appIds: [...e.appIds, sourceEntry.appId] }
              : e
          )
          .filter((e) => getEntryKey(e) !== sourceKey);
        commitStartLayout(updated);
        return;
      }
    }

    const withoutSource = current.filter((e) => getEntryKey(e) !== sourceKey);
    const destIdx = withoutSource.findIndex((e) => getEntryKey(e) === targetKey);
    if (destIdx === -1) return;
    const insertIdx = zone === 'after' ? destIdx + 1 : destIdx;
    withoutSource.splice(insertIdx, 0, sourceEntry);
    commitStartLayout(withoutSource);
  };

  const handleRenameFolder = (folderId: string, name: string) => {
    const updated = pinnedEntries.map((e) =>
      e.type === 'folder' && e.id === folderId ? { ...e, name } : e
    );
    commitStartLayout(updated);
  };

  const handleRemoveAppFromFolder = (folderId: string, appId: string) => {
    const folderIdx = pinnedEntries.findIndex(
      (e) => e.type === 'folder' && e.id === folderId
    );
    if (folderIdx === -1) return;
    const folder = pinnedEntries[folderIdx];
    if (folder.type !== 'folder') return;
    const remaining = folder.appIds.filter((id) => id !== appId);
    const next = [...pinnedEntries];
    if (remaining.length >= 2) {
      next.splice(folderIdx, 1, { ...folder, appIds: remaining }, { type: 'app', appId });
    } else if (remaining.length === 1) {
      next.splice(folderIdx, 1, { type: 'app', appId: remaining[0] }, { type: 'app', appId });
      setOpenFolderId(null);
    } else {
      next.splice(folderIdx, 1, { type: 'app', appId });
      setOpenFolderId(null);
    }
    commitStartLayout(next);
  };

  const handleUngroupFolder = (folderId: string) => {
    const folderIdx = pinnedEntries.findIndex(
      (e) => e.type === 'folder' && e.id === folderId
    );
    if (folderIdx === -1) return;
    const folder = pinnedEntries[folderIdx];
    if (folder.type !== 'folder') return;
    const next = [...pinnedEntries];
    next.splice(
      folderIdx,
      1,
      ...folder.appIds.map((appId) => ({ type: 'app' as const, appId }))
    );
    setOpenFolderId(null);
    commitStartLayout(next);
  };

  const handleReorderFolderApp = (
    folderId: string,
    sourceAppId: string,
    targetAppId: string,
    side: 'before' | 'after'
  ) => {
    if (sourceAppId === targetAppId) return;
    const updated = pinnedEntries.map((e) => {
      if (e.type !== 'folder' || e.id !== folderId) return e;
      const filtered = e.appIds.filter((id) => id !== sourceAppId);
      const targetIdx = filtered.indexOf(targetAppId);
      if (targetIdx === -1) return e;
      filtered.splice(side === 'after' ? targetIdx + 1 : targetIdx, 0, sourceAppId);
      return { ...e, appIds: filtered };
    });
    commitStartLayout(updated);
  };

  const filteredApps = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = !q
      ? pinnedApps
      : pinnedApps.filter(
          (app) => app.label.toLowerCase().includes(q) || app.keywords.toLowerCase().includes(q)
        );
    if (showAllApps) {
      return [...list].sort((a, b) => a.label.localeCompare(b.label));
    }
    return list;
  }, [pinnedApps, query, showAllApps]);

  const matchedChannels = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return channels
      .filter((c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q))
      .slice(0, 4);
  }, [channels, query]);

  const recommendedItems = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      subtitle: string;
      icon: React.ReactNode;
      onClick: () => void;
    }> = [];

    if (notes && notes.length > 0) {
      const latestNote = [...notes].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];
      if (latestNote) {
        items.push({
          id: `rec-note-${latestNote.id}`,
          title: latestNote.title.trim() || 'Untitled Note',
          subtitle: 'Recent note',
          icon: <Fluent3DNotesIcon className="w-6 h-6 shrink-0" />,
          onClick: () => {
            setActiveNoteId(latestNote.id);
            onLaunchRoute('/notes');
            onClose();
          },
        });
      }
    }

    const featuredChannels = channels.slice(0, 2);
    featuredChannels.forEach((ch) => {
      items.push({
        id: `rec-ch-${ch.id}`,
        title: ch.name,
        subtitle: ch.category || 'Live TV',
        icon: ch.logo ? (
          <img src={ch.logo} alt={ch.name} className="w-6 h-6 object-contain rounded-[4px] shrink-0" />
        ) : (
          <Fluent3DWatchPreviewIcon className="w-6 h-6 shrink-0" />
        ),
        onClick: () => {
          onSelectChannel(ch);
          onLaunchRoute(`/live-tv?channel=${ch.slug}`);
          onClose();
        },
      });
    });

    NEWS_DATA.slice(0, 3).forEach((art) => {
      items.push({
        id: `rec-art-${art.id}`,
        title: art.title.replace(/^#\s*/, ''),
        subtitle: art.publishedAt || 'Update blog',
        icon: <Fluent3DArticlesIcon className="w-6 h-6 shrink-0" />,
        onClick: () => {
          onLaunchRoute(`/news/${art.slug}`);
          onClose();
        },
      });
    });

    return items.slice(0, 6);
  }, [notes, channels, setActiveNoteId, onLaunchRoute, onClose, onSelectChannel]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setShowAllApps(false);
      setIsPowerMenuOpen(false);
      setStartContextMenu(null);
      setOpenFolderId(null);
      setDragState(null);
      setDropTarget(null);
      setFolderAppDropTarget(null);
      return;
    }

    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 80);

    const handleOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('#btn-taskbar-start') || target.closest('[data-windows-context-menu]')) return;
      if (menuRef.current && !menuRef.current.contains(target)) {
        onClose();
      }
    };

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (openFolderId) {
          setOpenFolderId(null);
          return;
        }
        onClose();
      }
    };

    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleKey);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, onClose, openFolderId]);

  const handleLaunchApp = (app: StartMenuAppItem) => {
    if (app.externalUrl) {
      window.open(app.externalUrl, '_blank', 'noopener,noreferrer');
      onClose();
      return;
    }
    if (app.route) {
      onLaunchRoute(app.route);
      onClose();
    }
  };

  if (typeof document === 'undefined') return null;

  return (
    <>
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              key="windows-start-menu-wrapper"
              initial={settings.reduceAllMotion ? false : { y: '100%' }}
              animate={{
                y: '0%',
                transition: settings.reduceAllMotion
                  ? { duration: 0 }
                  : { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
              }}
              exit={
                settings.reduceAllMotion
                  ? undefined
                  : {
                      y: '100%',
                      transition: { duration: 0.26, ease: [0.4, 0, 0.2, 1] },
                    }
              }
              style={{ zIndex: 8990, paddingBottom: `${taskbarHeight + 8}px` }}
              className={`fixed bottom-0 inset-x-0 flex px-3 pointer-events-none ${
                isLeftAligned ? 'justify-center md:justify-start' : 'justify-center'
              }`}
            >
              <div
                ref={menuRef}
                id="windows-start-menu"
                role="dialog"
                aria-label="Start Menu"
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setStartContextMenu({ x: e.clientX, y: e.clientY });
                }}
                style={{
                  backgroundColor: isLightMode ? 'rgba(243, 243, 243, 0.86)' : 'rgba(30, 32, 37, 0.86)',
                  backdropFilter: 'blur(42px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(42px) saturate(180%)',
                  zoom: uiScaleMult,
                }}
                className="pointer-events-auto w-full max-w-[620px] max-h-[calc(100vh-76px)] rounded-[12px] border border-black/10 dark:border-white/[0.12] shadow-none flex flex-col overflow-hidden select-none text-[#111827] dark:text-white"
              >
          {/* Search Bar */}
          <div className="px-6 pt-5 pb-3 shrink-0">
            <form
              id="windows-start-search-box"
              onSubmit={(e) => {
                e.preventDefault();
                if (filteredApps.length > 0) {
                  handleLaunchApp(filteredApps[0]);
                } else if (matchedChannels.length > 0) {
                  const ch = matchedChannels[0];
                  onSelectChannel(ch);
                  onLaunchRoute(`/live-tv?channel=${ch.slug}`);
                  onClose();
                }
              }}
              className="relative flex items-center h-[36px] px-3.5 rounded-full bg-white/80 dark:bg-[#141619]/75 border border-black/10 dark:border-white/10 focus-within:ring-2 focus-within:ring-[#0078d4] dark:focus-within:ring-[#4cc2ff] transition-all"
            >
              <FluentSearchIcon className="w-4 h-4 text-[#6b7280] dark:text-[#9ca3af] mr-2.5 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for apps, channels, settings, and articles"
                className="flex-1 min-w-0 !bg-transparent text-[13px] text-[#111827] dark:text-white placeholder-[#6b7280] dark:placeholder-[#9ca3af] outline-none !border-none shadow-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="text-xs text-[#6b7280] hover:text-black dark:hover:text-white px-1 cursor-pointer border-none bg-transparent"
                >
                  Clear
                </button>
              )}
            </form>
          </div>

          {/* Scrollable Body: Pinned + Recommended */}
          <div className="flex-1 overflow-y-auto px-6 py-2 space-y-5 no-scrollbar">
            {/* Pinned / All Apps Section */}
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-[13.5px] font-semibold text-[#111827] dark:text-white">
                  {query.trim() ? 'Search results' : showAllApps ? 'All apps' : 'Pinned'}
                </h3>
                {!query.trim() && (
                  <button
                    type="button"
                    onClick={() => setShowAllApps((prev) => !prev)}
                    className="h-[26px] px-2.5 rounded-[5px] bg-black/[0.05] dark:bg-white/[0.07] hover:bg-black/[0.09] dark:hover:bg-white/[0.12] text-[12px] font-medium flex items-center gap-1 transition-colors cursor-pointer border border-black/[0.05] dark:border-white/[0.06]"
                  >
                    {showAllApps ? (
                      <>
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Back</span>
                      </>
                    ) : (
                      <>
                        <span>All apps</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                )}
              </div>

              {showAllApps && !query.trim() ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {filteredApps.map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => handleLaunchApp(app)}
                      className="h-[42px] px-2.5 rounded-[6px] flex items-center gap-3 hover:bg-black/[0.05] dark:hover:bg-white/[0.08] active:scale-[0.99] transition-all cursor-pointer text-left border-none"
                    >
                      <div className="w-7 h-7 flex items-center justify-center shrink-0">
                        {app.renderIcon('w-6 h-6')}
                      </div>
                      <span className="text-[13px] font-normal truncate">{app.label}</span>
                    </button>
                  ))}
                </div>
              ) : query.trim() ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                  {filteredApps.map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => handleLaunchApp(app)}
                      className="group py-2.5 px-1.5 rounded-[6px] flex flex-col items-center justify-center gap-1.5 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] active:scale-95 transition-all cursor-pointer border-none"
                    >
                      <div className="w-9 h-9 flex items-center justify-center group-hover:scale-105 transition-transform">
                        {app.renderIcon('w-8 h-8')}
                      </div>
                      <span className="text-[11.5px] font-normal text-center leading-tight line-clamp-1 max-w-full">
                        {app.label}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                  {pinnedEntries.map((entry) => {
                    const entryKey = getEntryKey(entry);
                    const isDragged =
                      dragState?.kind === 'pinned' && dragState.entryKey === entryKey;
                    const activeDrop =
                      dropTarget?.entryKey === entryKey ? dropTarget.zone : null;

                    if (entry.type === 'folder') {
                      const folderApps = entry.appIds
                        .map((id) => appById.get(id))
                        .filter((a): a is StartMenuAppItem => Boolean(a));

                      return (
                        <div
                          key={entry.id}
                          role="button"
                          tabIndex={0}
                          draggable
                          onClick={() => {
                            if (!dragState) setOpenFolderId(entry.id);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setOpenFolderId(entry.id);
                            }
                          }}
                          onDragStart={(e) => {
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData('text/plain', entryKey);
                            setDragState({ kind: 'pinned', entryKey });
                          }}
                          onDragOver={(e) => {
                            if (!dragState || dragState.kind !== 'pinned') return;
                            if (dragState.entryKey === entryKey) return;
                            e.preventDefault();
                            const sourceEntry = pinnedEntries.find(
                              (p) => getEntryKey(p) === dragState.entryKey
                            );
                            const rect = e.currentTarget.getBoundingClientRect();
                            const ratio = (e.clientX - rect.left) / Math.max(1, rect.width);
                            if (sourceEntry?.type === 'app' && ratio >= 0.22 && ratio <= 0.78) {
                              setDropTarget({ entryKey, zone: 'merge' });
                            } else {
                              setDropTarget({
                                entryKey,
                                zone: ratio < 0.5 ? 'before' : 'after',
                              });
                            }
                          }}
                          onDragLeave={(e) => {
                            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                              setDropTarget((prev) =>
                                prev?.entryKey === entryKey ? null : prev
                              );
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            const zone = dropTarget?.entryKey === entryKey ? dropTarget.zone : 'merge';
                            handlePinnedEntryDrop(entry, zone);
                            setDragState(null);
                            setDropTarget(null);
                          }}
                          onDragEnd={() => {
                            setDragState(null);
                            setDropTarget(null);
                          }}
                          className={`relative group py-2.5 px-1.5 rounded-[6px] flex flex-col items-center justify-center gap-1.5 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] active:scale-95 transition-all cursor-pointer select-none ${
                            isDragged ? 'opacity-40 scale-95' : ''
                          } ${
                            activeDrop === 'merge'
                              ? 'ring-2 ring-[#0078d4] dark:ring-[#4cc2ff] bg-[#0078d4]/15 dark:bg-[#4cc2ff]/15 scale-[1.04]'
                              : ''
                          }`}
                        >
                          {activeDrop === 'before' && (
                            <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-[#0078d4] dark:bg-[#4cc2ff] pointer-events-none" />
                          )}
                          {activeDrop === 'after' && (
                            <span className="absolute right-0 top-2 bottom-2 w-[3px] rounded-full bg-[#0078d4] dark:bg-[#4cc2ff] pointer-events-none" />
                          )}
                          <div className="w-9 h-9 rounded-[8px] bg-black/[0.07] dark:bg-white/[0.11] border border-black/[0.08] dark:border-white/[0.14] p-1 grid grid-cols-2 gap-0.5 place-items-center group-hover:scale-105 transition-transform">
                            {folderApps.slice(0, 4).map((fa) => (
                              <div key={fa.id} className="w-3.5 h-3.5 flex items-center justify-center overflow-hidden">
                                {fa.renderIcon('w-3.5 h-3.5')}
                              </div>
                            ))}
                          </div>
                          <span className="text-[11.5px] font-normal text-center leading-tight line-clamp-1 max-w-full">
                            {entry.name}
                          </span>
                        </div>
                      );
                    }

                    const app = appById.get(entry.appId);
                    if (!app) return null;

                    return (
                      <div
                        key={app.id}
                        role="button"
                        tabIndex={0}
                        draggable
                        onClick={() => {
                          if (!dragState) handleLaunchApp(app);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleLaunchApp(app);
                          }
                        }}
                        onDragStart={(e) => {
                          e.dataTransfer.effectAllowed = 'move';
                          e.dataTransfer.setData('text/plain', entryKey);
                          setDragState({ kind: 'pinned', entryKey });
                        }}
                        onDragOver={(e) => {
                          if (!dragState || dragState.kind !== 'pinned') return;
                          if (dragState.entryKey === entryKey) return;
                          e.preventDefault();
                          const sourceEntry = pinnedEntries.find(
                            (p) => getEntryKey(p) === dragState.entryKey
                          );
                          const rect = e.currentTarget.getBoundingClientRect();
                          const ratio = (e.clientX - rect.left) / Math.max(1, rect.width);
                          if (sourceEntry?.type === 'app' && ratio >= 0.24 && ratio <= 0.76) {
                            setDropTarget({ entryKey, zone: 'merge' });
                          } else {
                            setDropTarget({
                              entryKey,
                              zone: ratio < 0.5 ? 'before' : 'after',
                            });
                          }
                        }}
                        onDragLeave={(e) => {
                          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                            setDropTarget((prev) =>
                              prev?.entryKey === entryKey ? null : prev
                            );
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const zone = dropTarget?.entryKey === entryKey ? dropTarget.zone : 'before';
                          handlePinnedEntryDrop(entry, zone);
                          setDragState(null);
                          setDropTarget(null);
                        }}
                        onDragEnd={() => {
                          setDragState(null);
                          setDropTarget(null);
                        }}
                        className={`relative group py-2.5 px-1.5 rounded-[6px] flex flex-col items-center justify-center gap-1.5 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] active:scale-95 transition-all cursor-pointer select-none ${
                          isDragged ? 'opacity-40 scale-95' : ''
                        } ${
                          activeDrop === 'merge'
                            ? 'ring-2 ring-[#0078d4] dark:ring-[#4cc2ff] bg-[#0078d4]/15 dark:bg-[#4cc2ff]/15 scale-[1.04]'
                            : ''
                        }`}
                      >
                        {activeDrop === 'before' && (
                          <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-[#0078d4] dark:bg-[#4cc2ff] pointer-events-none" />
                        )}
                        {activeDrop === 'after' && (
                          <span className="absolute right-0 top-2 bottom-2 w-[3px] rounded-full bg-[#0078d4] dark:bg-[#4cc2ff] pointer-events-none" />
                        )}
                        <div
                          className={`w-9 h-9 flex items-center justify-center transition-transform ${
                            activeDrop === 'merge'
                              ? 'scale-90 rounded-[8px] bg-black/[0.08] dark:bg-white/[0.14] p-1'
                              : 'group-hover:scale-105'
                          }`}
                        >
                          {app.renderIcon('w-8 h-8')}
                        </div>
                        <span className="text-[11.5px] font-normal text-center leading-tight line-clamp-1 max-w-full">
                          {app.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Matched Live Channels when searching */}
              {matchedChannels.length > 0 && (
                <div className="mt-4 pt-3 border-t border-black/10 dark:border-white/10">
                  <div className="text-[12px] font-semibold text-[#6b7280] dark:text-[#9ca3af] mb-2 px-1">
                    Channels
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {matchedChannels.map((ch) => (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => {
                          onSelectChannel(ch);
                          onLaunchRoute(`/live-tv?channel=${ch.slug}`);
                          onClose();
                        }}
                        className="h-[44px] px-2.5 rounded-[6px] flex items-center gap-2.5 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors cursor-pointer text-left border-none"
                      >
                        <img
                          src={ch.logo}
                          alt={ch.name}
                          className="w-6 h-6 object-contain rounded-[4px] shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-[12.5px] font-medium truncate">{ch.name}</div>
                          <div className="text-[11px] text-[#6b7280] dark:text-[#9ca3af] truncate">
                            {ch.category}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {query.trim() && filteredApps.length === 0 && matchedChannels.length === 0 && (
                <div className="py-8 text-center text-[13px] text-[#6b7280] dark:text-[#9ca3af]">
                  No apps or channels found for &ldquo;{query}&rdquo;
                </div>
              )}
            </div>

            {/* Recommended Section */}
            {!query.trim() && !showAllApps && recommendedItems.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2.5 px-1">
                  <h3 className="text-[13.5px] font-semibold text-[#111827] dark:text-white">
                    Recommended
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      onLaunchRoute('/news');
                      onClose();
                    }}
                    className="h-[26px] px-2.5 rounded-[5px] bg-black/[0.05] dark:bg-white/[0.07] hover:bg-black/[0.09] dark:hover:bg-white/[0.12] text-[12px] font-medium flex items-center gap-1 transition-colors cursor-pointer border border-black/[0.05] dark:border-white/[0.06]"
                  >
                    <span>More</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {recommendedItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={item.onClick}
                      className="h-[48px] px-2.5 rounded-[6px] flex items-center gap-3 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors cursor-pointer text-left border-none"
                    >
                      {item.icon}
                      <div className="min-w-0 flex-1">
                        <div className="text-[12.5px] font-medium truncate">{item.title}</div>
                        <div className="text-[11px] text-[#6b7280] dark:text-[#9ca3af] truncate">
                          {item.subtitle}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Windows 11 Start Menu Footer */}
          <div className="relative h-[54px] px-6 shrink-0 bg-black/[0.04] dark:bg-black/25 border-t border-black/[0.07] dark:border-white/[0.08] flex items-center justify-between">
            {/* User Account */}
            <button
              type="button"
              onClick={() => {
                onLaunchRoute('/auth');
                onClose();
              }}
              className="h-[36px] px-2.5 -ml-2 rounded-[6px] flex items-center gap-2.5 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors cursor-pointer border-none"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0078d4] to-[#4cc2ff] flex items-center justify-center text-white shadow-xs">
                <User className="w-4 h-4" />
              </div>
              <span className="text-[12.5px] font-medium">Sparkle User</span>
            </button>

            {/* Quick Actions: Settings & Power */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  onLaunchRoute('/settings');
                  onClose();
                }}
                aria-label="Settings"
                className="w-9 h-9 rounded-[6px] flex items-center justify-center hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors cursor-pointer border-none"
              >
                <SettingsIcon className="w-4 h-4" />
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsPowerMenuOpen((prev) => !prev)}
                  aria-label="Power"
                  className={`w-9 h-9 rounded-[6px] flex items-center justify-center transition-colors cursor-pointer border-none ${
                    isPowerMenuOpen
                      ? 'bg-black/10 dark:bg-white/15'
                      : 'hover:bg-black/[0.06] dark:hover:bg-white/[0.08]'
                  }`}
                >
                  <Power className="w-4 h-4" />
                </button>

                <AnimatePresence>
                  {isPowerMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.14 }}
                      style={{
                        backgroundColor: isLightMode ? 'rgba(255, 255, 255, 0.92)' : 'rgba(32, 34, 39, 0.95)',
                        backdropFilter: 'blur(24px)',
                      }}
                      className="absolute right-0 bottom-full mb-2 w-[210px] p-1.5 rounded-[8px] border border-black/10 dark:border-white/12 shadow-2xl space-y-0.5 z-50"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          updateSetting('windowsMode', false);
                          onClose();
                        }}
                        className="w-full h-8 px-2.5 rounded-[5px] flex items-center gap-2.5 text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer text-left border-none"
                      >
                        <LogOut className="w-3.5 h-3.5 text-[#0078d4] dark:text-[#4cc2ff]" />
                        <span>Exit Sparkle Mode</span>
                      </button>

                      {onRestartOobe && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onRestartOobe();
                          }}
                          className="w-full h-8 px-2.5 rounded-[5px] flex items-center gap-2.5 text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer text-left border-none"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>Launch OOBE Setup</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="w-full h-8 px-2.5 rounded-[5px] flex items-center gap-2.5 text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer text-left border-none"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Restart Sparkle</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Open Start Folder Modal Overlay */}
          <AnimatePresence>
            {openFolder && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.16 }}
                onClick={() => setOpenFolderId(null)}
                onDragOver={(e) => {
                  if (dragState?.kind === 'folder-app') {
                    e.preventDefault();
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragState?.kind === 'folder-app') {
                    handleRemoveAppFromFolder(dragState.folderId, dragState.appId);
                    setDragState(null);
                    setFolderAppDropTarget(null);
                  }
                }}
                className="absolute inset-0 z-30 bg-black/25 dark:bg-black/45 backdrop-blur-[4px] flex items-center justify-center p-6"
              >
                <motion.div
                  initial={{ scale: 0.94, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.94, opacity: 0 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  onClick={(e) => e.stopPropagation()}
                  onDragOver={(e) => e.stopPropagation()}
                  style={{
                    backgroundColor: isLightMode ? 'rgba(246, 248, 252, 0.94)' : 'rgba(36, 39, 46, 0.94)',
                    backdropFilter: 'blur(36px) saturate(180%)',
                  }}
                  className="w-full max-w-[380px] rounded-[12px] border border-black/10 dark:border-white/[0.14] p-4 flex flex-col gap-3"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={openFolder.name}
                      onChange={(e) => handleRenameFolder(openFolder.id, e.target.value)}
                      placeholder="Folder name"
                      className="flex-1 min-w-0 h-8 px-2.5 rounded-[6px] !bg-black/[0.04] dark:!bg-white/[0.07] text-[14px] font-semibold text-[#111827] dark:text-white !outline-none !border-none shadow-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleUngroupFolder(openFolder.id)}
                      title="Ungroup folder"
                      className="h-8 px-2.5 rounded-[6px] text-[11.5px] font-medium bg-black/[0.05] dark:bg-white/[0.08] hover:bg-black/[0.1] dark:hover:bg-white/[0.14] cursor-pointer border-0"
                    >
                      Ungroup
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpenFolderId(null)}
                      aria-label="Close folder"
                      className="w-8 h-8 rounded-[6px] flex items-center justify-center hover:bg-black/[0.07] dark:hover:bg-white/[0.1] cursor-pointer border-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-2 max-h-[260px] overflow-y-auto no-scrollbar">
                    {openFolder.appIds.map((appId) => {
                      const fa = appById.get(appId);
                      if (!fa) return null;
                      const isAppDragged =
                        dragState?.kind === 'folder-app' && dragState.appId === appId;
                      const appDropSide =
                        folderAppDropTarget?.appId === appId ? folderAppDropTarget.side : null;

                      return (
                        <div
                          key={fa.id}
                          role="button"
                          tabIndex={0}
                          draggable
                          onClick={() => {
                            if (!dragState) handleLaunchApp(fa);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleLaunchApp(fa);
                            }
                          }}
                          onDragStart={(e) => {
                            e.stopPropagation();
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData('text/plain', fa.id);
                            setDragState({
                              kind: 'folder-app',
                              folderId: openFolder.id,
                              appId: fa.id,
                            });
                          }}
                          onDragOver={(e) => {
                            if (dragState?.kind !== 'folder-app' || dragState.appId === fa.id) return;
                            e.preventDefault();
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            const side = e.clientX < rect.left + rect.width / 2 ? 'before' : 'after';
                            setFolderAppDropTarget({ appId: fa.id, side });
                          }}
                          onDragLeave={(e) => {
                            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                              setFolderAppDropTarget((prev) =>
                                prev?.appId === fa.id ? null : prev
                              );
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (dragState?.kind === 'folder-app') {
                              const side =
                                folderAppDropTarget?.appId === fa.id
                                  ? folderAppDropTarget.side
                                  : 'before';
                              handleReorderFolderApp(
                                openFolder.id,
                                dragState.appId,
                                fa.id,
                                side
                              );
                            }
                            setDragState(null);
                            setFolderAppDropTarget(null);
                          }}
                          onDragEnd={() => {
                            setDragState(null);
                            setFolderAppDropTarget(null);
                          }}
                          className={`relative group py-2 px-1 rounded-[6px] flex flex-col items-center justify-center gap-1.5 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] cursor-pointer select-none ${
                            isAppDragged ? 'opacity-40' : ''
                          }`}
                        >
                          {appDropSide === 'before' && (
                            <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-[#0078d4] dark:bg-[#4cc2ff] pointer-events-none" />
                          )}
                          {appDropSide === 'after' && (
                            <span className="absolute right-0 top-2 bottom-2 w-[3px] rounded-full bg-[#0078d4] dark:bg-[#4cc2ff] pointer-events-none" />
                          )}
                          <div className="w-8 h-8 flex items-center justify-center">
                            {fa.renderIcon('w-7 h-7')}
                          </div>
                          <span className="text-[11px] text-center leading-tight line-clamp-1 max-w-full">
                            {fa.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="text-[11px] text-center text-black/50 dark:text-white/50">
                    Drag an app outside this box to move it back to Pinned
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <AnimatePresence>
        {startContextMenu && (
          <WindowsContextMenu
            key={`start-ctx-${startContextMenu.x}-${startContextMenu.y}`}
            x={startContextMenu.x}
            y={startContextMenu.y}
            ariaLabel="Start menu actions"
            onClose={() => setStartContextMenu(null)}
            items={[
              {
                id: 'start-toggle-all',
                label: showAllApps ? 'Back to Pinned' : 'All apps',
                icon: <LayoutGrid className="w-4 h-4" />,
                onSelect: () => setShowAllApps((prev) => !prev),
              },
              {
                id: 'start-focus-search',
                label: 'Search Start',
                icon: <Search className="w-4 h-4" />,
                onSelect: () => searchInputRef.current?.focus(),
              },
              {
                id: 'start-reset-layout',
                label: 'Reset Pinned layout',
                icon: <FolderOpen className="w-4 h-4" />,
                onSelect: resetStartLayout,
              },
              { id: 'start-div-1', divider: true },
              {
                id: 'start-theme',
                label: isLightMode ? 'Switch to Dark mode' : 'Switch to Light mode',
                icon: isLightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />,
                onSelect: () => updateSetting('theme', isLightMode ? 'dark' : 'light'),
              },
              {
                id: 'start-settings',
                label: 'Start settings',
                icon: <SettingsIcon className="w-4 h-4" />,
                onSelect: () => {
                  onLaunchRoute('/settings');
                  onClose();
                },
              },
              ...(onRestartOobe
                ? [
                    {
                      id: 'start-oobe',
                      label: 'Launch OOBE Setup',
                      icon: <Sparkles className="w-4 h-4" />,
                      onSelect: () => {
                        onClose();
                        onRestartOobe();
                      },
                    },
                  ]
                : []),
              { id: 'start-div-2', divider: true },
              {
                id: 'start-exit-win',
                label: 'Exit Sparkle Mode',
                icon: <LogOut className="w-4 h-4" />,
                danger: true,
                onSelect: () => {
                  updateSetting('windowsMode', false);
                  onClose();
                },
              },
            ]}
          />
        )}
      </AnimatePresence>
    </>
  );
};
