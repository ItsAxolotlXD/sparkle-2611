import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Sparkles, 
  Search, 
  Type, 
  FileDown, 
  Heart, 
  ExternalLink, 
  PlusCircle, 
  UploadCloud, 
  DownloadCloud, 
  Minus, 
  Plus, 
  Check,
  Volume2,
  Wrench,
  FileText
} from 'lucide-react';
import { FluentNotesIcon, FluentSearchIcon, FluentGalleryIcon, FluentInkCanvasIcon, FluentScreenbugIcon, FluentVlcIcon, FluentPhotopeaIcon, FluentArrowUploadIcon, FluentCameraIcon } from './FluentIcons';
import { Channel, NewsArticle } from '../types';
import { useFavorites } from '../hooks/useFavorites';
import { useSettings } from '../hooks/useSettings';
import { useRevealEffect } from '../hooks/useRevealEffect';
import { flyoutPanelClassName, flyoutPanelStyle } from './FlyoutDropdown';
import { NEWS_DATA } from '../data/news';
import { parseM3UPlaylist, downloadPlaylistFile } from '../utils/m3uParser';
import { exportArticleToDocx } from '../utils/docxExport';

interface ToolsMenuProps {
  currentRoute: string;
  currentChannel?: Channel;
  channels: Channel[];
  isLightMode?: boolean;
  onNavigate: (route: string) => void;
  onOpenHelp: () => void;
  onOpenDiscord: () => void;
  onOpenSummarize: (article: NewsArticle) => void;
  onOpenTextToSpeech?: (article: NewsArticle) => void;
  onOpenFindWords: () => void;
  onOpenAddStream: () => void;
  onImportChannels: (newChannels: Channel[]) => void;
  fontSize: number;
  onChangeFontSize: (size: number) => void;
  onOpenOfficeTool?: (tool: string) => void;
  placement?: 'top' | 'bottom';
  isOpen?: boolean;
  onClose?: () => void;
  showTrigger?: boolean;
  className?: string;
}

export const ToolsMenu: React.FC<ToolsMenuProps> = ({
  currentRoute,
  currentChannel,
  channels,
  isLightMode,
  onNavigate,
  onOpenHelp,
  onOpenDiscord,
  onOpenSummarize,
  onOpenTextToSpeech,
  onOpenFindWords,
  onOpenAddStream,
  onImportChannels,
  fontSize,
  onChangeFontSize,
  onOpenOfficeTool,
  placement = 'top',
  isOpen: externalIsOpen,
  onClose,
  showTrigger = true,
  className
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = externalIsOpen !== undefined;
  const isOpen = isControlled ? externalIsOpen : internalOpen;

  const setIsOpen = (next: boolean | ((prev: boolean) => boolean)) => {
    if (isControlled) {
      const nextVal = typeof next === 'function' ? next(externalIsOpen!) : next;
      if (!nextVal && onClose) onClose();
    } else {
      setInternalOpen(next);
    }
  };

  const [copiedToast, setCopiedToast] = useState<string | null>(null);
  const [exportingDocx, setExportingDocx] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const revealProps = useRevealEffect();

  const isRelevant = true; // Always available on all pages

  const handleTriggerClick = () => {
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleToggleTools = () => {
      setIsOpen((prev) => !prev);
    };
    window.addEventListener('vone:toggle-tools', handleToggleTools);
    window.addEventListener('vplay:toggle-tools', handleToggleTools);
    return () => {
      window.removeEventListener('vone:toggle-tools', handleToggleTools);
      window.removeEventListener('vplay:toggle-tools', handleToggleTools);
    };
  }, []);

  const { isChannelFavorite, toggleFavoriteChannel } = useFavorites();
  const isFav = currentChannel ? isChannelFavorite(currentChannel.id) : false;

  const { settings } = useSettings();

  // Determine current active section & whether Tools is relevant for this page
  const isNews = currentRoute.startsWith('/news');
  const isLiveTV = currentRoute.startsWith('/live-tv') || currentRoute.startsWith('/channels') || currentRoute.startsWith('/test');
  const isOther = !isNews && !isLiveTV;

  // Find active article if on news
  const currentNewsArticle: NewsArticle = (() => {
    if (currentRoute.startsWith('/news/')) {
      const slug = currentRoute.replace('/news/', '');
      return NEWS_DATA.find((a) => a.slug === slug) || NEWS_DATA[0];
    }
    return NEWS_DATA[0];
  })();

  // Check if active article is locked in session
  const isCurrentArticleLocked = (() => {
    if (!currentNewsArticle || !currentNewsArticle.isLocked) return false;
    try {
      const saved = sessionStorage.getItem('waves_unlocked_articles');
      const unlocked = saved ? JSON.parse(saved) : {};
      return !unlocked[currentNewsArticle.slug];
    } catch {
      return true;
    }
  })();

  const handleMouseEnter = () => {
    if (!isRelevant || !showTrigger) return;
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (!isRelevant || !showTrigger) return;
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  const showToast = (msg: string) => {
    setCopiedToast(msg);
    setTimeout(() => setCopiedToast(null), 2500);
  };

  // Handler for Export .docx
  const handleExportDocx = async () => {
    setExportingDocx(true);
    try {
      await exportArticleToDocx(currentNewsArticle);
      showToast('Successfully exported .docx file!');
    } catch (e) {
      console.error(e);
      showToast('Failed to export Word document.');
    } finally {
      setExportingDocx(false);
      setIsOpen(false);
    }
  };

  // Handler for Export M3U8
  const handleExportM3U8 = () => {
    try {
      downloadPlaylistFile(channels, 'v_one_playlist.m3u8');
      showToast(`Exported ${channels.length} channels to .m3u8!`);
    } catch (e) {
      console.error(e);
      showToast('Failed to export channels playlist.');
    }
    setIsOpen(false);
  };

  // Handler for Import M3U File
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;
      try {
        const parsed = parseM3UPlaylist(content);
        if (parsed.length === 0) {
          showToast('No valid channels found in file.');
          return;
        }
        const fullChannels: Channel[] = parsed.map((p, idx) => ({
          id: p.id || `m3u-file-${Date.now()}-${idx}`,
          name: p.name || `Channel ${idx + 1}`,
          shortName: p.name || `Channel ${idx + 1}`,
          slug: p.slug || `m3u-file-ch-${idx + 1}`,
          logo: p.logo || 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=200&auto=format&fit=crop&q=80',
          category: p.category || 'Special',
          quality: p.quality || 'HD',
          streamUrl: p.streamUrl || '',
          isLive: true,
          description: p.description || 'Channel loaded from M3U file.',
          currentProgram: p.currentProgram || {
            title: p.name || 'Live Broadcast',
            startTime: '00:00',
            endTime: '24:00',
            progress: 50,
            description: 'Live broadcast.'
          }
        }));
        onImportChannels(fullChannels);
        showToast(`Loaded ${fullChannels.length} channels from file!`);
      } catch (err) {
        showToast('Failed to parse playlist file.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsOpen(false);
  };

  return (
    <div
      className={`relative pointer-events-auto cursor-default ${
        !isRelevant ? 'opacity-30 pointer-events-none grayscale' : ''
      }`}
      onMouseEnter={showTrigger ? handleMouseEnter : undefined}
      onMouseLeave={showTrigger ? handleMouseLeave : undefined}
    >
      {/* Hidden M3U File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".m3u,.m3u8,text/plain"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Tools Trigger Button with Tools icon (Fluent button style) */}
      {showTrigger && (
        <button
          id="btn-top-tools-menu"
          type="button"
          disabled={!isRelevant}
          onClick={handleTriggerClick}
          className={`fluent-reveal-item w-9 h-9 rounded-md flex items-center justify-center transition-colors cursor-default relative text-neutral-800 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/5 ${
            isOpen ? 'bg-black/10 dark:bg-white/10' : ''
          }`}
          title={isRelevant ? "Tools & Utilities (Sparkle Tools)" : "No tools available"}
          aria-label="Sparkle Tools Menu"
          aria-expanded={isOpen}
          {...revealProps}
        >
          <img
            src="https://static.wikia.nocookie.net/ep-deo/images/3/3c/Tools_menu.png/revision/latest?cb=20260905055712"
            alt="Tools"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/icons/copilot.png';
            }}
            className="w-5 h-5 object-contain"
          />
        </button>
      )}

      {/* Fluent Menu Flyout (Context Menu) - Unified Acrylic Blur & Fluent Design */}
      <AnimatePresence>
        {isOpen && isRelevant && (
          <motion.div
            id="vplay-tools-dropdown-card"
            initial={{ opacity: 0, y: placement === 'bottom' ? 14 : -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: placement === 'bottom' ? 10 : -10 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className={`${
              showTrigger
                ? (placement === 'bottom' ? 'absolute right-0 bottom-full mb-2 origin-bottom-right' : 'absolute right-0 mt-1.5 origin-top-right')
                : 'relative origin-bottom-right'
            } w-[280px] max-w-[calc(100vw-24px)] z-50 select-none cursor-default overflow-hidden ${flyoutPanelClassName} ${className || ''}`}
            style={flyoutPanelStyle}
          >
            {/* Context Menu Header */}
            <div className="px-2.5 py-1.5 flex items-center justify-between border-b border-black/[0.08] dark:border-white/[0.08] mb-1">
              <div className="flex items-center gap-2">
                <Wrench className="w-3.5 h-3.5 text-[#4cc2ff]" />
                <span className="font-semibold text-xs tracking-tight text-[#1b1b1b] dark:text-[#f3f3f3]">
                  Tools & Utilities
                </span>
              </div>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-[3px] bg-black/5 dark:bg-white/10 text-neutral-600 dark:text-neutral-400">
                {isNews ? 'News' : isLiveTV ? 'Live TV' : 'System'}
              </span>
            </div>

            {/* Menu Items for HOME & OTHER PAGES */}
            {isOther && (
              <div className="space-y-0.5">
                <button
                  id="tool-home-help"
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenHelp();
                  }}
                  className="fluent-reveal-item w-full h-[34px] px-2.5 rounded-[4px] flex items-center justify-between text-[13px] font-normal transition-colors text-left cursor-default text-[#1b1b1b] dark:text-[#f3f3f3] hover:bg-black/5 dark:hover:bg-white/[0.08] active:bg-black/10 dark:active:bg-white/[0.05]"
                  {...revealProps}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <BookOpen className="w-4 h-4 text-[#555555] dark:text-[#cccccc] shrink-0" />
                    <span className="truncate">Help & Shortcuts</span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">F1</span>
                </button>

                <button
                  id="tool-home-discord"
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenDiscord();
                  }}
                  className="fluent-reveal-item w-full h-[34px] px-2.5 rounded-[4px] flex items-center justify-between text-[13px] font-normal transition-colors text-left cursor-default text-[#1b1b1b] dark:text-[#f3f3f3] hover:bg-black/5 dark:hover:bg-white/[0.08] active:bg-black/10 dark:active:bg-white/[0.05]"
                  {...revealProps}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <svg className="w-4 h-4 fill-current text-[#5865F2] shrink-0" viewBox="0 0 24 24">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.078.078 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                    <span className="truncate">Discord Community</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-[2px] bg-[#5865F2]/10 text-[#5865F2] font-medium">Join</span>
                </button>

                <div className="my-1 mx-1 h-[1px] bg-black/[0.08] dark:bg-white/[0.08]" />

                <button
                  id="tool-home-add-stream"
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenAddStream();
                  }}
                  className="fluent-reveal-item w-full h-[34px] px-2.5 rounded-[4px] flex items-center justify-between text-[13px] font-normal transition-colors text-left cursor-default text-[#1b1b1b] dark:text-[#f3f3f3] hover:bg-black/5 dark:hover:bg-white/[0.08] active:bg-black/10 dark:active:bg-white/[0.05]"
                  {...revealProps}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <PlusCircle className="w-4 h-4 text-[#4cc2ff] shrink-0" />
                    <span className="truncate">Add Stream</span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">+URL</span>
                </button>

                <button
                  id="tool-home-import-m3u"
                  type="button"
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                  className="fluent-reveal-item w-full h-[34px] px-2.5 rounded-[4px] flex items-center justify-between text-[13px] font-normal transition-colors text-left cursor-default text-[#1b1b1b] dark:text-[#f3f3f3] hover:bg-black/5 dark:hover:bg-white/[0.08] active:bg-black/10 dark:active:bg-white/[0.05]"
                  {...revealProps}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <FluentArrowUploadIcon className="w-4 h-4 text-[#555555] dark:text-[#cccccc] shrink-0" />
                    <span className="truncate">Import Playlist</span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">.m3u</span>
                </button>

                <button
                  id="tool-home-export-m3u"
                  type="button"
                  onClick={handleExportM3U8}
                  className="fluent-reveal-item w-full h-[34px] px-2.5 rounded-[4px] flex items-center justify-between text-[13px] font-normal transition-colors text-left cursor-default text-[#1b1b1b] dark:text-[#f3f3f3] hover:bg-black/5 dark:hover:bg-white/[0.08] active:bg-black/10 dark:active:bg-white/[0.05]"
                  {...revealProps}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <DownloadCloud className="w-4 h-4 text-[#555555] dark:text-[#cccccc] shrink-0" />
                    <span className="truncate">Export Playlist</span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">.m3u8</span>
                </button>

                <div className="my-1 mx-1 h-[1px] bg-black/[0.08] dark:bg-white/[0.08]" />

                <button
                  id="tool-home-text-to-speech"
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenTextToSpeech?.(NEWS_DATA[0]);
                  }}
                  className="fluent-reveal-item w-full h-[34px] px-2.5 rounded-[4px] flex items-center justify-between text-[13px] font-normal transition-colors text-left cursor-default text-[#1b1b1b] dark:text-[#f3f3f3] hover:bg-black/5 dark:hover:bg-white/[0.08] active:bg-black/10 dark:active:bg-white/[0.05]"
                  {...revealProps}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Volume2 className="w-4 h-4 text-[#555555] dark:text-[#cccccc] shrink-0" />
                    <span className="truncate">Text to Speech</span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">TTS</span>
                </button>
              </div>
            )}

            {/* Menu Items for NEWS */}
            {isNews && (
              <div className="space-y-0.5">
                {/* 1. Summarize News */}
                <button
                  id="tool-news-summarize"
                  type="button"
                  disabled={isCurrentArticleLocked}
                  onClick={() => {
                    if (isCurrentArticleLocked) return;
                    setIsOpen(false);
                    onOpenSummarize(currentNewsArticle);
                  }}
                  className={`fluent-reveal-item w-full h-[34px] px-2.5 rounded-[4px] flex items-center justify-between text-[13px] font-normal transition-colors text-left cursor-default ${
                    isCurrentArticleLocked 
                      ? 'opacity-40 cursor-not-allowed' 
                      : 'text-[#1b1b1b] dark:text-[#f3f3f3] hover:bg-black/5 dark:hover:bg-white/[0.08] active:bg-black/10 dark:active:bg-white/[0.05]'
                  }`}
                  title={isCurrentArticleLocked ? 'Article is locked, unlock to summarize' : 'Summarize article with AI'}
                  {...revealProps}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Sparkles className="w-4 h-4 text-[#4cc2ff] shrink-0" />
                    <span className="truncate">
                      {isCurrentArticleLocked ? 'Summarize (Locked)' : 'Summarize Content'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-[3px] bg-[#4cc2ff]/15 text-[#4cc2ff]">
                    AI
                  </span>
                </button>

                {/* 2. Text to speech */}
                <button
                  id="tool-news-text-to-speech"
                  type="button"
                  disabled={isCurrentArticleLocked}
                  onClick={() => {
                    if (isCurrentArticleLocked) return;
                    setIsOpen(false);
                    onOpenTextToSpeech?.(currentNewsArticle);
                  }}
                  className={`fluent-reveal-item w-full h-[34px] px-2.5 rounded-[4px] flex items-center justify-between text-[13px] font-normal transition-colors text-left cursor-default ${
                    isCurrentArticleLocked 
                      ? 'opacity-40 cursor-not-allowed' 
                      : 'text-[#1b1b1b] dark:text-[#f3f3f3] hover:bg-black/5 dark:hover:bg-white/[0.08] active:bg-black/10 dark:active:bg-white/[0.05]'
                  }`}
                  title={isCurrentArticleLocked ? 'Article is locked, unlock to listen' : 'Read article aloud'}
                  {...revealProps}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Volume2 className="w-4 h-4 text-[#555555] dark:text-[#cccccc] shrink-0" />
                    <span className="truncate">
                      {isCurrentArticleLocked ? 'Read Article (Locked)' : 'Read Article'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">
                    TTS
                  </span>
                </button>

                {/* 3. Find words */}
                <button
                  id="tool-news-find-words"
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenFindWords();
                  }}
                  className="fluent-reveal-item w-full h-[34px] px-2.5 rounded-[4px] flex items-center justify-between text-[13px] font-normal transition-colors text-left cursor-default text-[#1b1b1b] dark:text-[#f3f3f3] hover:bg-black/5 dark:hover:bg-white/[0.08] active:bg-black/10 dark:active:bg-white/[0.05]"
                  {...revealProps}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <FluentSearchIcon className="w-4 h-4 text-[#555555] dark:text-[#cccccc] shrink-0" />
                    <span className="truncate">Find in Article</span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">⌘F</span>
                </button>

                <div className="my-1 mx-1 h-[1px] bg-black/[0.08] dark:bg-white/[0.08]" />

                {/* 4. Font size with Fluent Number Stepper */}
                <div 
                  id="tool-news-font-size"
                  className="fluent-reveal-item w-full h-[34px] px-2.5 rounded-[4px] flex items-center justify-between text-[13px] font-normal text-[#1b1b1b] dark:text-[#f3f3f3] cursor-default"
                  {...revealProps}
                >
                  <div className="flex items-center gap-2.5">
                    <Type className="w-4 h-4 text-[#555555] dark:text-[#cccccc] shrink-0" />
                    <span>Reading Font Size</span>
                  </div>
                  <div className="flex items-center rounded-[4px] border border-black/15 dark:border-white/15 bg-black/5 dark:bg-white/5 h-6">
                    <button
                      type="button"
                      onClick={() => onChangeFontSize(Math.max(14, fontSize - 2))}
                      className="w-6 h-full flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 rounded-l-[3px] text-xs transition-colors cursor-default"
                      title="Decrease font size"
                    >
                      <Minus className="w-3 h-3 text-[#1b1b1b] dark:text-[#f3f3f3]" />
                    </button>
                    <span className="px-1.5 text-[11px] font-mono font-medium text-center min-w-[32px] text-[#1b1b1b] dark:text-[#f3f3f3]">
                      {fontSize}px
                    </span>
                    <button
                      type="button"
                      onClick={() => onChangeFontSize(Math.min(24, fontSize + 2))}
                      className="w-6 h-full flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 rounded-r-[3px] text-xs transition-colors cursor-default"
                      title="Increase font size"
                    >
                      <Plus className="w-3 h-3 text-[#1b1b1b] dark:text-[#f3f3f3]" />
                    </button>
                  </div>
                </div>

                {/* 5. Export as .docx */}
                <button
                  id="tool-news-export-docx"
                  type="button"
                  onClick={handleExportDocx}
                  disabled={exportingDocx || isCurrentArticleLocked}
                  className={`fluent-reveal-item w-full h-[34px] px-2.5 rounded-[4px] flex items-center justify-between text-[13px] font-normal transition-colors text-left cursor-default ${
                    isCurrentArticleLocked
                      ? 'opacity-40 cursor-not-allowed'
                      : 'text-[#1b1b1b] dark:text-[#f3f3f3] hover:bg-black/5 dark:hover:bg-white/[0.08] active:bg-black/10 dark:active:bg-white/[0.05]'
                  }`}
                  title={isCurrentArticleLocked ? 'Article is locked, unlock to export .docx' : 'Export article as .docx'}
                  {...revealProps}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <FileDown className="w-4 h-4 text-[#555555] dark:text-[#cccccc] shrink-0" />
                    <span className="truncate">
                      {isCurrentArticleLocked 
                        ? 'Export .docx (Locked)' 
                        : exportingDocx 
                          ? 'Exporting .docx...' 
                          : 'Export Word (.docx)'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">.docx</span>
                </button>
              </div>
            )}

            {/* Menu Items for LIVE TV */}
            {isLiveTV && (
              <div className="space-y-0.5">
                {/* 1. Add / Remove Favorite */}
                {currentChannel && (
                  <button
                    id="tool-tv-toggle-favorite"
                    type="button"
                    onClick={() => {
                      toggleFavoriteChannel(currentChannel.id);
                      showToast(isFav ? `Removed ${currentChannel.name} from favorites` : `Added ${currentChannel.name} to favorites`);
                    }}
                    className="fluent-reveal-item w-full h-[34px] px-2.5 rounded-[4px] flex items-center justify-between text-[13px] font-normal transition-colors text-left cursor-default text-[#1b1b1b] dark:text-[#f3f3f3] hover:bg-black/5 dark:hover:bg-white/[0.08] active:bg-black/10 dark:active:bg-white/[0.05]"
                    {...revealProps}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Heart className={`w-4 h-4 ${isFav ? 'text-[#e81123] fill-current' : 'text-[#555555] dark:text-[#cccccc]'}`} />
                      <span className="truncate">
                        {isFav ? 'Remove from Favorites' : 'Add to Favorites'}
                      </span>
                    </div>
                    {isFav && <span className="text-[10px] text-[#e81123] font-medium">★</span>}
                  </button>
                )}

                {/* 2. Open Original Stream */}
                {currentChannel && (
                  <button
                    id="tool-tv-open-stream"
                    type="button"
                    onClick={() => {
                      window.open(currentChannel.streamUrl, '_blank', 'noopener,noreferrer');
                      setIsOpen(false);
                    }}
                    className="fluent-reveal-item w-full h-[34px] px-2.5 rounded-[4px] flex items-center justify-between text-[13px] font-normal transition-colors text-left cursor-default text-[#1b1b1b] dark:text-[#f3f3f3] hover:bg-black/5 dark:hover:bg-white/[0.08] active:bg-black/10 dark:active:bg-white/[0.05]"
                    {...revealProps}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <ExternalLink className="w-4 h-4 text-[#555555] dark:text-[#cccccc] shrink-0" />
                      <span className="truncate">Open Source Stream</span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">M3U8</span>
                  </button>
                )}

                <div className="my-1 mx-1 h-[1px] bg-black/[0.08] dark:bg-white/[0.08]" />

                {/* 3. Add stream */}
                <button
                  id="tool-tv-add-stream"
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenAddStream();
                  }}
                  className="fluent-reveal-item w-full h-[34px] px-2.5 rounded-[4px] flex items-center justify-between text-[13px] font-normal transition-colors text-left cursor-default text-[#1b1b1b] dark:text-[#f3f3f3] hover:bg-black/5 dark:hover:bg-white/[0.08] active:bg-black/10 dark:active:bg-white/[0.05]"
                  {...revealProps}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <PlusCircle className="w-4 h-4 text-[#4cc2ff] shrink-0" />
                    <span className="truncate">Add Channel</span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">+URL</span>
                </button>

                {/* 4. Import m3u/m3u8 */}
                <button
                  id="tool-tv-import-m3u"
                  type="button"
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                  className="fluent-reveal-item w-full h-[34px] px-2.5 rounded-[4px] flex items-center justify-between text-[13px] font-normal transition-colors text-left cursor-default text-[#1b1b1b] dark:text-[#f3f3f3] hover:bg-black/5 dark:hover:bg-white/[0.08] active:bg-black/10 dark:active:bg-white/[0.05]"
                  {...revealProps}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <FluentArrowUploadIcon className="w-4 h-4 text-[#555555] dark:text-[#cccccc] shrink-0" />
                    <span className="truncate">Import Playlist (.m3u)</span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">Import</span>
                </button>

                {/* 5. Export m3u/m3u8 */}
                <button
                  id="tool-tv-export-m3u"
                  type="button"
                  onClick={handleExportM3U8}
                  className="fluent-reveal-item w-full h-[34px] px-2.5 rounded-[4px] flex items-center justify-between text-[13px] font-normal transition-colors text-left cursor-default text-[#1b1b1b] dark:text-[#f3f3f3] hover:bg-black/5 dark:hover:bg-white/[0.08] active:bg-black/10 dark:active:bg-white/[0.05]"
                  {...revealProps}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <DownloadCloud className="w-4 h-4 text-[#555555] dark:text-[#cccccc] shrink-0" />
                    <span className="truncate">Export Playlist (.m3u)</span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">Export</span>
                </button>
              </div>
            )}

            {/* Notes Tool Section */}
            <div className="my-1 mx-1 h-[1px] bg-black/[0.08] dark:bg-white/[0.08]" />

            <div className="px-2.5 py-0.5 text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider flex items-center justify-between">
              <span>Ứng dụng</span>
              <span className="text-[9px] text-[#4cc2ff] font-semibold tracking-wide">SPARKLE</span>
            </div>

            <div className="space-y-0.5">
              {/* Gallery */}
              <button
                id="tool-gallery"
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onNavigate('/gallery');
                }}
                className="fluent-reveal-item w-full h-[34px] px-2.5 rounded-[4px] flex items-center justify-between text-[13px] font-normal transition-colors text-left cursor-default text-[#1b1b1b] dark:text-[#f3f3f3] hover:bg-black/5 dark:hover:bg-white/[0.08] active:bg-black/10 dark:active:bg-white/[0.05]"
                {...revealProps}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <FluentGalleryIcon className="w-4 h-4 text-[#111827] dark:text-white shrink-0" />
                  <span className="truncate">Gallery</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-[2px] bg-black/5 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 font-medium">Bộ sưu tập</span>
              </button>

              {/* Draws */}
              <button
                id="tool-draws"
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onNavigate('/draws');
                }}
                className="fluent-reveal-item w-full h-[34px] px-2.5 rounded-[4px] flex items-center justify-between text-[13px] font-normal transition-colors text-left cursor-default text-[#1b1b1b] dark:text-[#f3f3f3] hover:bg-black/5 dark:hover:bg-white/[0.08] active:bg-black/10 dark:active:bg-white/[0.05]"
                {...revealProps}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <FluentInkCanvasIcon className="w-4 h-4 shrink-0" />
                  <span className="truncate">Ink Canvas</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-[2px] bg-black/5 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 font-medium">Vẽ Paint</span>
              </button>

              {/* Notes */}
              <button
                id="tool-notes"
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onNavigate('/notes');
                }}
                className="fluent-reveal-item w-full h-[34px] px-2.5 rounded-[4px] flex items-center justify-between text-[13px] font-normal transition-colors text-left cursor-default text-[#1b1b1b] dark:text-[#f3f3f3] hover:bg-black/5 dark:hover:bg-white/[0.08] active:bg-black/10 dark:active:bg-white/[0.05]"
                {...revealProps}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <FluentNotesIcon className="w-4 h-4 text-[#111827] dark:text-white shrink-0" />
                  <span className="truncate">Notes</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-[2px] bg-black/5 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 font-medium">Ghi chú</span>
              </button>

              {/* Screenbox */}
              <button
                id="tool-screenbox"
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onNavigate('/screenbox');
                }}
                className="fluent-reveal-item w-full h-[34px] px-2.5 rounded-[4px] flex items-center justify-between text-[13px] font-normal transition-colors text-left cursor-default text-[#1b1b1b] dark:text-[#f3f3f3] hover:bg-black/5 dark:hover:bg-white/[0.08] active:bg-black/10 dark:active:bg-white/[0.05]"
                {...revealProps}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <FluentScreenbugIcon className="w-4 h-4 shrink-0" />
                  <span className="truncate">Screenbox</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-[2px] bg-black/5 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 font-medium">Media player</span>
              </button>

              {/* Camera */}
              <button
                id="tool-camera"
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onNavigate('/camera');
                }}
                className="fluent-reveal-item w-full h-[34px] px-2.5 rounded-[4px] flex items-center justify-between text-[13px] font-normal transition-colors text-left cursor-default text-[#1b1b1b] dark:text-[#f3f3f3] hover:bg-black/5 dark:hover:bg-white/[0.08] active:bg-black/10 dark:active:bg-white/[0.05]"
                {...revealProps}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <FluentCameraIcon className="w-4 h-4 shrink-0 text-black dark:text-white" />
                  <span className="truncate">Camera</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-[2px] bg-black/5 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 font-medium">Insider</span>
              </button>

              {/* Photopea Web Tool */}
              <button
                id="tool-photopea"
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onNavigate('/photopea');
                }}
                className="fluent-reveal-item w-full h-[34px] px-2.5 rounded-[4px] flex items-center justify-between text-[13px] font-normal transition-colors text-left cursor-default text-[#1b1b1b] dark:text-[#f3f3f3] hover:bg-black/5 dark:hover:bg-white/[0.08] active:bg-black/10 dark:active:bg-white/[0.05]"
                {...revealProps}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <FluentPhotopeaIcon className="w-4 h-4 shrink-0" />
                  <span className="truncate">Photopea</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-[2px] bg-black/5 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 font-medium">Photo editor</span>
              </button>
            </div>

            {/* Quick feedback toast inside flyout */}
            {copiedToast && (
              <div className="mt-1.5 p-1.5 rounded-[4px] bg-[#4cc2ff]/15 border border-[#4cc2ff]/30 text-center text-xs font-medium text-[#4cc2ff] flex items-center justify-center gap-1.5">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{copiedToast}</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
