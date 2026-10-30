import React, { useMemo, useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronDown, ChevronLeft, ChevronRight, Clock, Sparkles, Upload } from 'lucide-react';
import { HeroCarousel } from '../components/HeroCarousel';
import { Channel } from '../types';
import { useIsMobile } from '../hooks/useIsMobile';
import { useNotes } from '../context/NotesContext';
import { NEWS_DATA } from '../data/news';
import { galleryDB } from '../services/galleryStorage';

interface HomePreviewProps {
  channels: Channel[];
  onSelectChannel: (channel: Channel) => void;
  navigate: (route: string, state?: any) => void;
}

const slideUpProps = (index: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.38,
      delay: Math.min(index * 0.04, 0.8),
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
});

export const HomePreview: React.FC<HomePreviewProps> = ({ channels, onSelectChannel, navigate }) => {
  const isMobile = useIsMobile();
  const { notes, setActiveNoteId } = useNotes();
  const [selectedQuickAccessId, setSelectedQuickAccessId] = useState<string | null>(null);
  const [selectedRecommendedId, setSelectedRecommendedId] = useState<string | null>(null);

  const vtvChannels = useMemo(
    () => channels
      .filter((channel) => /^VTV\s*\d+(?:\s+HD)?$/i.test(channel.name.trim()))
      .sort((a, b) => Number(a.name.match(/\d+/)?.[0] ?? 0) - Number(b.name.match(/\d+/)?.[0] ?? 0)),
    [channels]
  );

  const quickAccessRef = useRef<HTMLDivElement>(null);
  const recommendedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (quickAccessRef.current && !quickAccessRef.current.contains(e.target as Node)) {
        setSelectedQuickAccessId(null);
      }
      if (recommendedRef.current && !recommendedRef.current.contains(e.target as Node)) {
        setSelectedRecommendedId(null);
      }
    };
    document.addEventListener('pointerdown', handleOutsideClick);
    return () => document.removeEventListener('pointerdown', handleOutsideClick);
  }, []);

  const handleRecCardClick = (
    e: React.MouseEvent,
    id: string,
    action: () => void
  ) => {
    setSelectedQuickAccessId(null);
    if (!isMobile) {
      e.stopPropagation();
      setSelectedRecommendedId(id);
    } else {
      action();
    }
  };

  const handleRecCardDoubleClick = (
    e: React.MouseEvent,
    action: () => void
  ) => {
    if (!isMobile) {
      e.stopPropagation();
      action();
    }
  };

  const handleRecCardKeyDown = (
    e: React.KeyboardEvent,
    id: string,
    action: () => void
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    } else if (e.key === ' ') {
      e.preventDefault();
      if (!isMobile) {
        setSelectedRecommendedId(id);
      } else {
        action();
      }
    }
  };

  const scrollQuickAccess = (direction: 'previous' | 'next') => {
    quickAccessRef.current?.scrollBy({ left: direction === 'next' ? 300 : -300, behavior: 'smooth' });
  };

  const openChannel = (channel: Channel) => {
    onSelectChannel(channel);
    navigate(`/live-tv?channel=${channel.slug}`);
  };

  // Block 1: 3 random TV channels refreshed when web is reloaded / mounted
  const randomChannels = useMemo(() => {
    const valid = channels.filter((c) => Boolean(c.logo && c.name));
    const shuffled = [...valid].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }, [channels]);

  const ch0 = randomChannels[0] || channels[0];
  const ch1 = randomChannels[1] || channels[1] || channels[0];
  const ch2 = randomChannels[2] || channels[2] || channels[0];

  const NOTE_ICON_URL =
    'https://upload.wikimedia.org/wikipedia/commons/c/c9/Windows_Notepad_icon.png?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=original';
  const MUSIC_ICON_URL =
    'https://static.wikia.nocookie.net/logopedia/images/2/2b/Music_win-11.png/revision/latest?cb=20211007190213';
  const WORD_ICON_URL =
    'https://upload.wikimedia.org/wikipedia/commons/f/fd/Microsoft_Office_Word_%282019%E2%80%93present%29.svg';
  const EXCEL_ICON_URL =
    'https://upload.wikimedia.org/wikipedia/commons/3/34/Microsoft_Office_Excel_%282019%E2%80%93present%29.svg';
  const PPT_ICON_URL =
    'https://upload.wikimedia.org/wikipedia/commons/0/0d/Microsoft_Office_PowerPoint_%282019%E2%80%93present%29.svg';
  const PDF_ICON_URL =
    'https://upload.wikimedia.org/wikipedia/commons/8/87/PDF_file_icon.svg';

  const importFileInputRef = useRef<HTMLInputElement>(null);
  const [deviceFiles, setDeviceFiles] = useState<any[]>([]);
  const [importedCustomFile, setImportedCustomFile] = useState<any | null>(null);

  // Load files imported from device (from galleryDB, local VLC playlist, and localStorage)
  useEffect(() => {
    let isMounted = true;
    const loadDeviceFiles = async () => {
      try {
        const allGallery = await galleryDB.getAll();
        const uploadedItems = allGallery.filter(
          (it) => it.source === 'upload' || it.id.startsWith('upload-') || it.type === 'document' || it.type === 'audio'
        );

        let vlcLocals: any[] = [];
        try {
          const rawVlc = localStorage.getItem('vone_vlc_playlist');
          if (rawVlc) {
            const parsed = JSON.parse(rawVlc);
            if (Array.isArray(parsed)) {
              vlcLocals = parsed.filter((it: any) => it.id?.startsWith('local-'));
            }
          }
        } catch {}

        const parsedDeviceFiles: any[] = [];

        for (const item of uploadedItems) {
          const lower = (item.title || '').toLowerCase();
          let ext = 'docx';
          if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) ext = 'xlsx';
          else if (lower.endsWith('.pptx') || lower.endsWith('.ppt')) ext = 'pptx';
          else if (lower.endsWith('.pdf')) ext = 'pdf';
          else if (item.type === 'audio' || /\.(mp3|wav|ogg|aac|m4a|flac)$/i.test(lower)) ext = 'mp3';
          else if (item.type === 'image' || /\.(png|jpe?g|webp|gif|svg)$/i.test(lower)) ext = 'png';
          else if (lower.endsWith('.txt')) ext = 'txt';

          const sizeStr = item.size ? `${(item.size / 1024 / 1024).toFixed(1)} MB` : 'Tệp từ thiết bị';
          parsedDeviceFiles.push({
            id: `dev-${item.id}`,
            name: item.title,
            subtitle: `Đã nhập từ thiết bị · ${sizeStr}`,
            ext,
            iconColor: ext === 'mp3' ? '#8764b8' : ext === 'xlsx' ? '#107c41' : ext === 'pptx' ? '#d83b01' : '#0078d4',
            badge: item.title.replace(/\.[^/.]+$/, '').slice(0, 24),
            route: item.type === 'audio' ? '/vlc' : '/gallery',
            isDeviceImport: true,
          });
        }

        for (const it of vlcLocals) {
          parsedDeviceFiles.push({
            id: `vlc-${it.id}`,
            name: `${it.title}.mp3`,
            subtitle: 'Âm thanh từ thiết bị · Media Player',
            ext: 'mp3',
            iconColor: '#8764b8',
            badge: it.title.slice(0, 24),
            route: '/vlc',
            isDeviceImport: true,
          });
        }

        if (isMounted) {
          setDeviceFiles(parsedDeviceFiles);
        }
      } catch (err) {
        console.warn('Could not load device files:', err);
      }
    };

    loadDeviceFiles();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleImportDeviceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    const lower = fileName.toLowerCase();
    let ext = 'docx';
    let type: 'document' | 'audio' | 'image' | 'video' = 'document';
    let route = '/notes';

    if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
      ext = 'xlsx';
      type = 'document';
      route = '/gallery';
    } else if (lower.endsWith('.pptx') || lower.endsWith('.ppt')) {
      ext = 'pptx';
      type = 'document';
      route = '/gallery';
    } else if (lower.endsWith('.pdf')) {
      ext = 'pdf';
      type = 'document';
      route = '/gallery';
    } else if (/\.(mp3|wav|ogg|aac|m4a|flac)$/i.test(lower) || file.type.startsWith('audio/')) {
      ext = 'mp3';
      type = 'audio';
      route = '/vlc';
    } else if (/\.(png|jpe?g|webp|gif|svg)$/i.test(lower) || file.type.startsWith('image/')) {
      ext = 'png';
      type = 'image';
      route = '/gallery';
    } else if (/\.(mp4|webm|mkv|mov)$/i.test(lower) || file.type.startsWith('video/')) {
      ext = 'mp4';
      type = 'video';
      route = '/vlc';
    } else if (lower.endsWith('.txt')) {
      ext = 'txt';
      type = 'document';
      route = '/notes';
    }

    const url = URL.createObjectURL(file);
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    const newFileItem = {
      id: `dev-import-${Date.now()}`,
      name: fileName,
      subtitle: `Tệp từ thiết bị · ${sizeMb} MB`,
      ext,
      iconColor: ext === 'mp3' ? '#8764b8' : ext === 'xlsx' ? '#107c41' : ext === 'pptx' ? '#d83b01' : '#0078d4',
      badge: fileName.replace(/\.[^/.]+$/, '').slice(0, 24),
      route,
      isDeviceImport: true,
    };

    try {
      await galleryDB.add({
        id: `upload-${Date.now()}`,
        title: fileName,
        type,
        url,
        blobData: file,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        dateAdded: new Date().toISOString(),
        year: new Date().getFullYear(),
        aspectRatio: 1,
        source: 'upload',
        description: `Imported from device (${sizeMb} MB)`,
      });
    } catch {}

    setDeviceFiles((prev) => [newFileItem, ...prev]);
    setImportedCustomFile(newFileItem);
    if (e.target) e.target.value = '';
  };

  // Block 3: 1 random file (Office / Media / Document / Imported from Device) refreshed on web reload
  const randomFile = useMemo(() => {
    if (importedCustomFile) return importedCustomFile;

    const basePool = [
      {
        id: 'file-doc-1',
        name: 'Tài liệu kiến trúc Sparkle.docx',
        subtitle: 'Microsoft Word · Đã sửa đổi 10m trước',
        ext: 'docx' as const,
        iconColor: '#0078d4',
        badge: 'Tài liệu kiến trúc Sparkle',
        route: '/notes',
      },
      {
        id: 'file-sheet-2',
        name: 'Kế hoạch phát sóng VTV 2026.xlsx',
        subtitle: 'Microsoft Excel · Bảng tính đã lưu',
        ext: 'xlsx' as const,
        iconColor: '#107c41',
        badge: 'Kế hoạch phát sóng 2026',
        route: '/notes',
      },
      {
        id: 'file-pres-3',
        name: 'Sparkle Vision 26.11.pptx',
        subtitle: 'PowerPoint · Bản trình chiếu',
        ext: 'pptx' as const,
        iconColor: '#d83b01',
        badge: 'Sparkle Vision 26.11',
        route: '/notes',
      },
      {
        id: 'file-audio-4',
        name: 'Ghi âm phát thanh VOV FM91.mp3',
        subtitle: 'Tệp âm thanh · 14.8 MB',
        ext: 'mp3' as const,
        iconColor: '#8764b8',
        badge: 'VOV Giao thông FM91',
        route: '/vlc',
      },
      {
        id: 'file-img-5',
        name: 'Tư liệu đồ họa truyền hình.png',
        subtitle: 'Tệp hình ảnh · Bộ sưu tập',
        ext: 'png' as const,
        iconColor: '#f59e0b',
        badge: 'Đồ họa truyền hình Sparkle',
        route: '/gallery',
      },
    ];

    const pool = deviceFiles.length > 0 ? [...deviceFiles, ...basePool] : basePool;
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled[0];
  }, [deviceFiles, importedCustomFile]);

  // Block 4: 1 random note file from Notes app (refreshed on web reload)
  const randomNote = useMemo(() => {
    if (!notes || notes.length === 0) return null;
    const shuffled = [...notes].sort(() => Math.random() - 0.5);
    return shuffled[0];
  }, [notes]);

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  };

  const formatNoteDate = (timestamp?: number) => {
    if (!timestamp) return 'Gần đây';
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      const hours = date.getHours().toString().padStart(2, '0');
      const mins = date.getMinutes().toString().padStart(2, '0');
      return `Hôm nay lúc ${hours}:${mins}`;
    }
    return `${date.getDate()} thg ${date.getMonth() + 1}`;
  };

  const renderFileIcon = (ext: string, isPreview: boolean = false) => {
    const iconClass = isPreview
      ? 'size-10 sm:size-11 object-contain filter drop-shadow-sm'
      : 'size-4 sm:size-4.5 object-contain filter drop-shadow-xs';

    switch (ext.toLowerCase()) {
      case 'docx':
      case 'doc':
        return (
          <img
            src={WORD_ICON_URL}
            alt="Word"
            referrerPolicy="no-referrer"
            loading="lazy"
            className={iconClass}
          />
        );
      case 'xlsx':
      case 'xls':
        return (
          <img
            src={EXCEL_ICON_URL}
            alt="Excel"
            referrerPolicy="no-referrer"
            loading="lazy"
            className={iconClass}
          />
        );
      case 'pptx':
      case 'ppt':
        return (
          <img
            src={PPT_ICON_URL}
            alt="PowerPoint"
            referrerPolicy="no-referrer"
            loading="lazy"
            className={iconClass}
          />
        );
      case 'pdf':
        return (
          <img
            src={PDF_ICON_URL}
            alt="PDF"
            referrerPolicy="no-referrer"
            loading="lazy"
            className={iconClass}
          />
        );
      case 'mp3':
      case 'wav':
      case 'audio':
      case 'music':
      case 'flac':
      case 'm4a':
      case 'ogg':
        return (
          <img
            src={MUSIC_ICON_URL}
            alt="Music"
            referrerPolicy="no-referrer"
            loading="lazy"
            className={iconClass}
          />
        );
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'image':
        return (
          <img
            src={NOTE_ICON_URL}
            alt="Image"
            referrerPolicy="no-referrer"
            loading="lazy"
            className={iconClass}
          />
        );
      case 'txt':
      case 'note':
      default:
        return (
          <img
            src={NOTE_ICON_URL}
            alt="Note"
            referrerPolicy="no-referrer"
            loading="lazy"
            className={iconClass}
          />
        );
    }
  };

  // Dynamic greeting based on time of day:
  // 5 AM - 12 PM: Good morning
  // 12 PM - 6 PM: Good afternoon
  // 6 PM - 5 AM: Good evening
  // month day day, year (e.g: October 16, 2016)
  const [currentDate, setCurrentDate] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const { greetingText, formattedDate } = useMemo(() => {
    const hour = currentDate.getHours();
    let timeGreeting = 'morning';
    if (hour >= 5 && hour < 12) {
      timeGreeting = 'morning';
    } else if (hour >= 12 && hour < 18) {
      timeGreeting = 'afternoon';
    } else {
      timeGreeting = 'evening';
    }

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const month = monthNames[currentDate.getMonth()];
    const day = currentDate.getDate();
    const year = currentDate.getFullYear();
    const formatted = `${month} ${day}, ${year}`;

    return {
      greetingText: `Good ${timeGreeting}`,
      formattedDate: formatted,
    };
  }, [currentDate]);

  const openChannelBySlugOrId = (slugOrId: string) => {
    const found = channels.find(
      (c) => c.slug.toLowerCase().includes(slugOrId.toLowerCase()) || c.id.toLowerCase().includes(slugOrId.toLowerCase())
    );
    if (found) {
      openChannel(found);
    } else {
      navigate('/live-tv');
    }
  };

  let elementIndex = 0;

  return (
    <div className="home-preview-page mx-auto flex w-full max-w-7xl flex-col gap-5 px-1 py-2 selection:bg-[#d946ef] selection:text-white dark:selection:bg-[#ff2d92] dark:selection:text-white sm:gap-6 sm:py-4">
      {/* 1. Hero Carousel */}
      <motion.div {...slideUpProps(elementIndex++)}>
        <HeroCarousel channels={channels} onSelectChannel={onSelectChannel} navigate={navigate} flipActiveSlide />
      </motion.div>

      {/* Centered Greeting directly below banner cards: Good ... - <month day day, year> */}
      <motion.div
        {...slideUpProps(elementIndex++)}
        className="flex items-center justify-center text-center py-1 sm:py-2 px-4 select-none"
      >
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight text-black dark:text-white">
          {greetingText} - {formattedDate}
        </h2>
      </motion.div>

      {/* 2. Recommendations Section - Fluent Snapshots Layout */}
      <section aria-labelledby="recommendations-title" className="px-4 text-black dark:text-[#e7e7e7] sm:px-6">
        <motion.div {...slideUpProps(elementIndex++)} className="flex h-9 items-center justify-between border-b border-black/10 px-1 dark:border-white/10 mb-4">
          <div className="flex items-center gap-2 text-[13px] font-medium">
            <ChevronDown className="size-3.5 text-black/60 dark:text-[#bdbdbd]" aria-hidden="true" />
            <h2 id="recommendations-title">Recommended</h2>
          </div>
        </motion.div>

        {/* Snapshots Grid Layout */}
        <div ref={recommendedRef} className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 items-stretch">
          {/* Block 1: Recent activities (3 random TV channels, refreshed on web reload) */}
          <motion.div
            {...slideUpProps(elementIndex++)}
            className="rounded-2xl bg-white dark:bg-[#1e2024] border border-black/10 dark:border-white/10 p-4 sm:p-5 flex flex-col justify-between shadow-xs transition-colors"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3.5">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-black dark:text-white">Recent activities</h3>
                <p className="text-xs sm:text-sm text-black/60 dark:text-[#9e9ea6]">Pick up where you left off</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-black/50 dark:text-[#888892] mt-0.5">
                <Clock className="size-3.5" />
                <span>Just now</span>
              </div>
            </div>

            {/* Main Featured Snapshot (Random Channel 0) */}
            <div
              role="button"
              tabIndex={0}
              id={`rec-card-ch-${ch0.id}`}
              data-channel-card="true"
              data-selected={selectedRecommendedId === `rec-ch-${ch0.id}`}
              aria-selected={selectedRecommendedId === `rec-ch-${ch0.id}`}
              onClick={(e) => handleRecCardClick(e, `rec-ch-${ch0.id}`, () => openChannel(ch0))}
              onDoubleClick={(e) => handleRecCardDoubleClick(e, () => openChannel(ch0))}
              onKeyDown={(e) => handleRecCardKeyDown(e, `rec-ch-${ch0.id}`, () => openChannel(ch0))}
              className={`channel-card relative flex-1 min-h-[220px] sm:min-h-[250px] md:min-h-[280px] rounded-2xl shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d91a9c] dark:focus-visible:ring-[#ff82ff] bg-transparent ${
                selectedRecommendedId === `rec-ch-${ch0.id}`
                  ? 'is-selected border-[3px] border-[#d91a9c] dark:border-[#ff82ff]'
                  : 'border-[3px] border-black/[0.08] dark:border-white/[0.08]'
              }`}
            >
              <div className="relative size-full flex items-center justify-center p-6 sm:p-8 select-none">
                {/* Channel Logo (Reduced size, transparent background) */}
                <img
                  src={ch0.logo}
                  alt={ch0.name}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  decoding="async"
                  className="max-h-[90px] sm:max-h-[110px] max-w-[70%] sm:max-w-[65%] object-contain filter drop-shadow-md transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            </div>

            {/* Sub-snapshots Row (Random Channel 1 & Random Channel 2) */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4">
              {/* Channel 1 */}
              <div
                role="button"
                tabIndex={0}
                id={`rec-card-ch-${ch1.id}`}
                data-channel-card="true"
                data-selected={selectedRecommendedId === `rec-ch-${ch1.id}`}
                aria-selected={selectedRecommendedId === `rec-ch-${ch1.id}`}
                onClick={(e) => handleRecCardClick(e, `rec-ch-${ch1.id}`, () => openChannel(ch1))}
                onDoubleClick={(e) => handleRecCardDoubleClick(e, () => openChannel(ch1))}
                onKeyDown={(e) => handleRecCardKeyDown(e, `rec-ch-${ch1.id}`, () => openChannel(ch1))}
                className={`channel-card relative h-[86px] sm:h-[98px] rounded-2xl shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d91a9c] dark:focus-visible:ring-[#ff82ff] bg-transparent ${
                  selectedRecommendedId === `rec-ch-${ch1.id}`
                    ? 'is-selected border-[3px] border-[#d91a9c] dark:border-[#ff82ff]'
                    : 'border-[3px] border-black/[0.08] dark:border-white/[0.08]'
                }`}
              >
                <div className="relative size-full flex items-center justify-center p-2.5 sm:p-3 select-none">
                  <img
                    src={ch1.logo}
                    alt={ch1.name}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    decoding="async"
                    className="max-h-[38px] sm:max-h-[44px] max-w-[70%] object-contain filter drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              </div>

              {/* Channel 2 */}
              <div
                role="button"
                tabIndex={0}
                id={`rec-card-ch-${ch2.id}`}
                data-channel-card="true"
                data-selected={selectedRecommendedId === `rec-ch-${ch2.id}`}
                aria-selected={selectedRecommendedId === `rec-ch-${ch2.id}`}
                onClick={(e) => handleRecCardClick(e, `rec-ch-${ch2.id}`, () => openChannel(ch2))}
                onDoubleClick={(e) => handleRecCardDoubleClick(e, () => openChannel(ch2))}
                onKeyDown={(e) => handleRecCardKeyDown(e, `rec-ch-${ch2.id}`, () => openChannel(ch2))}
                className={`channel-card relative h-[86px] sm:h-[98px] rounded-2xl shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d91a9c] dark:focus-visible:ring-[#ff82ff] bg-transparent ${
                  selectedRecommendedId === `rec-ch-${ch2.id}`
                    ? 'is-selected border-[3px] border-[#d91a9c] dark:border-[#ff82ff]'
                    : 'border-[3px] border-black/[0.08] dark:border-white/[0.08]'
                }`}
              >
                <div className="relative size-full flex items-center justify-center p-2.5 sm:p-3 select-none">
                  <img
                    src={ch2.logo}
                    alt={ch2.name}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    decoding="async"
                    className="max-h-[38px] sm:max-h-[44px] max-w-[70%] object-contain filter drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Block: Block 2 (Latest Sparkle Updates) + Blocks 3 & 4 (2 random files) */}
          <motion.div
            {...slideUpProps(elementIndex++)}
            className="flex flex-col gap-4 lg:gap-5 justify-between"
          >
            {/* Block 2: Latest Sparkle Updates */}
            <div className="rounded-2xl bg-white dark:bg-[#1e2024] border border-black/10 dark:border-white/10 p-4 sm:p-5 flex flex-col justify-between shadow-xs transition-colors">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-black dark:text-white">Latest Sparkle Updates</h3>
                  <p className="text-xs sm:text-sm text-black/60 dark:text-[#9e9ea6]">
                    {NEWS_DATA[0]?.publishedAt ? `${NEWS_DATA[0].publishedAt} · ${NEWS_DATA[0].readingTime}` : "Insider Preview, changelogs & new features"}
                  </p>
                </div>
                {/* Sparkle icon - reduced size */}
                <div className="size-5 shrink-0 mt-0.5 text-[#ff82ff] flex items-center justify-center">
                  <Sparkles className="size-4 sm:size-4.5" />
                </div>
              </div>

              {/* Updates Snapshot */}
              <div
                role="button"
                tabIndex={0}
                id="rec-card-news"
                data-selected={selectedRecommendedId === 'rec-news'}
                aria-selected={selectedRecommendedId === 'rec-news'}
                onClick={(e) => handleRecCardClick(e, 'rec-news', () => navigate('/news'))}
                onDoubleClick={(e) => handleRecCardDoubleClick(e, () => navigate('/news'))}
                onKeyDown={(e) => handleRecCardKeyDown(e, 'rec-news', () => navigate('/news'))}
                className={`relative h-[155px] sm:h-[180px] rounded-2xl overflow-hidden shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d91a9c] dark:focus-visible:ring-[#ff82ff] bg-[#181518] ${
                  selectedRecommendedId === 'rec-news'
                    ? 'is-selected border-[3px] border-[#d91a9c] dark:border-[#ff82ff]'
                    : 'border-[3px] border-black/[0.08] dark:border-white/[0.08]'
                }`}
              >
                <div className="relative size-full flex items-center justify-center select-none">
                  <img
                    src={NEWS_DATA[0]?.coverImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=85'}
                    alt="Latest Sparkle Updates"
                    referrerPolicy="no-referrer"
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>

            {/* Blocks 3 & 4: 2 Random Files (refreshed on web reload) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Block 3: Random Document File / Imported from Device */}
              {randomFile && (
                <div
                  onDoubleClick={(e) => handleRecCardDoubleClick(e, () => navigate(randomFile.route))}
                  className="rounded-2xl bg-white dark:bg-[#1e2024] border border-black/10 dark:border-white/10 p-3.5 sm:p-4.5 flex flex-col justify-between shadow-xs transition-colors"
                >
                  <input
                    type="file"
                    ref={importFileInputRef}
                    onChange={handleImportDeviceFile}
                    className="hidden"
                  />
                  <div className="flex items-start justify-between mb-2.5">
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm sm:text-base font-semibold text-black dark:text-white truncate">
                          {randomFile.name}
                        </h4>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            importFileInputRef.current?.click();
                          }}
                          className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-black/[0.05] dark:bg-white/[0.08] text-black/70 dark:text-white/70 hover:bg-black/10 dark:hover:bg-white/15 transition-colors"
                        >
                          <Upload className="size-2.5" />
                          <span>Nhập</span>
                        </button>
                      </div>
                      <p className="text-xs text-black/60 dark:text-[#9e9ea6] truncate">
                        {randomFile.subtitle}
                      </p>
                    </div>
                    {/* File icon - reduced size */}
                    <div className="shrink-0 mt-0.5">
                      {renderFileIcon(randomFile.ext)}
                    </div>
                  </div>

                  {/* Snapshot Thumbnail */}
                  <div
                    role="button"
                    tabIndex={0}
                    id="rec-card-file"
                    data-selected={selectedRecommendedId === 'rec-file'}
                    aria-selected={selectedRecommendedId === 'rec-file'}
                    onClick={(e) => handleRecCardClick(e, 'rec-file', () => navigate(randomFile.route))}
                    onDoubleClick={(e) => handleRecCardDoubleClick(e, () => navigate(randomFile.route))}
                    onKeyDown={(e) => handleRecCardKeyDown(e, 'rec-file', () => navigate(randomFile.route))}
                    className={`relative h-[88px] sm:h-[98px] rounded-2xl overflow-hidden shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d91a9c] dark:focus-visible:ring-[#ff82ff] bg-neutral-100 dark:bg-[#16181d] p-3 select-none flex items-center justify-center ${
                      selectedRecommendedId === 'rec-file'
                        ? 'is-selected border-[3px] border-[#d91a9c] dark:border-[#ff82ff]'
                        : 'border-[3px] border-black/[0.08] dark:border-white/[0.08]'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 z-10 w-full px-2">
                      <div className="shrink-0 flex items-center justify-center bg-transparent">
                        {renderFileIcon(randomFile.ext, true)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[12px] font-semibold text-black dark:text-[#f3f4f6] truncate">
                          {randomFile.name}
                        </div>
                        <div className="text-[10px] text-black/50 dark:text-[#888892] truncate">
                          {randomFile.subtitle}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Block 4: 1 Random Note File from Notes App */}
              {randomNote && (
                <div
                  onDoubleClick={(e) =>
                    handleRecCardDoubleClick(e, () => {
                      setActiveNoteId(randomNote.id);
                      navigate('/notes');
                    })
                  }
                  className="rounded-2xl bg-white dark:bg-[#1e2024] border border-black/10 dark:border-white/10 p-3.5 sm:p-4.5 flex flex-col justify-between shadow-xs transition-colors"
                >
                  <div className="flex items-start justify-between mb-2.5">
                    <div className="min-w-0 pr-2">
                      <h4 className="text-sm sm:text-base font-semibold text-black dark:text-white truncate">
                        {randomNote.title || 'Ghi chú'}.txt
                      </h4>
                      <p className="text-xs text-black/60 dark:text-[#9e9ea6] truncate">
                        Tệp ghi chú · {formatNoteDate(randomNote.updatedAt || randomNote.createdAt)}
                      </p>
                    </div>
                    {/* Notepad file icon - reduced size with official Windows Notepad icon */}
                    <div className="shrink-0 mt-0.5 size-4 sm:size-4.5 flex items-center justify-center">
                      <img
                        src={NOTE_ICON_URL}
                        alt="Notepad"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        className="size-full object-contain filter drop-shadow-xs"
                      />
                    </div>
                  </div>

                  {/* Snapshot Thumbnail */}
                  <div
                    role="button"
                    tabIndex={0}
                    id="rec-card-note"
                    data-selected={selectedRecommendedId === 'rec-note'}
                    aria-selected={selectedRecommendedId === 'rec-note'}
                    onClick={(e) =>
                      handleRecCardClick(e, 'rec-note', () => {
                        setActiveNoteId(randomNote.id);
                        navigate('/notes');
                      })
                    }
                    onDoubleClick={(e) =>
                      handleRecCardDoubleClick(e, () => {
                        setActiveNoteId(randomNote.id);
                        navigate('/notes');
                      })
                    }
                    onKeyDown={(e) =>
                      handleRecCardKeyDown(e, 'rec-note', () => {
                        setActiveNoteId(randomNote.id);
                        navigate('/notes');
                      })
                    }
                    className={`relative h-[88px] sm:h-[98px] rounded-2xl overflow-hidden shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d91a9c] dark:focus-visible:ring-[#ff82ff] bg-neutral-100 dark:bg-[#16181d] p-3 select-none flex items-center justify-center ${
                      selectedRecommendedId === 'rec-note'
                        ? 'is-selected border-[3px] border-[#d91a9c] dark:border-[#ff82ff]'
                        : 'border-[3px] border-black/[0.08] dark:border-white/[0.08]'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 z-10 w-full px-2">
                      <div className="shrink-0 flex items-center justify-center bg-transparent">
                        <img
                          src={NOTE_ICON_URL}
                          alt="Notepad"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          className="size-10 sm:size-11 object-contain filter drop-shadow-sm"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[12px] font-semibold text-black dark:text-[#f3f4f6] truncate">
                          {randomNote.title || 'Ghi chú mới'}
                        </div>
                        <div className="text-[10px] text-black/50 dark:text-[#888892] truncate">
                          {stripHtml(randomNote.content).slice(0, 42) || 'Ghi chú văn bản Sparkle Notes'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* 4. Quick Access / VTV Channels Section (Horizontal Tiles) */}
      <section aria-label="Quick access" className="px-4 text-black dark:text-[#e7e7e7] sm:px-6">
        <motion.div {...slideUpProps(elementIndex++)} className="flex h-9 items-center justify-between border-b border-black/10 px-1 text-[13px] font-medium text-black dark:border-white/10 dark:text-[#ededed]">
          <div className="flex items-center gap-2">
            <ChevronDown className="size-3.5 text-black/60 dark:text-[#bdbdbd]" aria-hidden="true" />
            <span>Quick access</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => scrollQuickAccess('previous')}
              className="rounded-full p-1 text-black transition-colors hover:bg-black/10 hover:text-black dark:text-white/35 dark:hover:bg-white/10 dark:hover:text-white"
              aria-label="Previous quick access"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => scrollQuickAccess('next')}
              className="rounded-full p-1 text-black transition-colors hover:bg-black/10 hover:text-black dark:text-white/55 dark:hover:bg-white/10 dark:hover:text-white"
              aria-label="Next quick access"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        </motion.div>

        <div
          ref={quickAccessRef}
          className="flex snap-x gap-3 overflow-x-auto pt-3 pb-2 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {vtvChannels.map((channel) => {
            const channelLabel = channel.name.replace(/\s+HD$/i, '').trim();
            const currentChIdx = elementIndex++;
            const isSelected = selectedQuickAccessId === channel.id;

            return (
              <motion.button
                key={channel.id}
                id={`quick-access-card-${channel.id}`}
                data-quick-access-card="true"
                data-selected={isSelected ? 'true' : 'false'}
                aria-selected={isSelected}
                {...slideUpProps(currentChIdx)}
                type="button"
                onClick={(e) => {
                  setSelectedRecommendedId(null);
                  if (!isMobile) {
                    e.stopPropagation();
                    setSelectedQuickAccessId(channel.id);
                  } else {
                    openChannel(channel);
                  }
                }}
                onDoubleClick={(e) => {
                  if (!isMobile) {
                    e.stopPropagation();
                    openChannel(channel);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    openChannel(channel);
                  } else if (e.key === ' ') {
                    e.preventDefault();
                    if (!isMobile) {
                      setSelectedQuickAccessId(channel.id);
                    } else {
                      openChannel(channel);
                    }
                  }
                }}
                aria-label={`Watch ${channelLabel}`}
                className={`group flex size-[88px] sm:size-[100px] shrink-0 snap-start items-center justify-center rounded-2xl shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d91a9c] dark:focus-visible:ring-[#ff82ff] bg-white dark:bg-[#2c3037] hover:bg-black/[0.02] dark:hover:bg-[#363b43] ${
                  isSelected
                    ? 'is-selected border-[3px] border-[#d91a9c] dark:border-[#ff82ff]'
                    : 'border-[3px] border-black/[0.08] dark:border-white/[0.08]'
                }`}
              >
                <div className="flex size-full items-center justify-center p-3 sm:p-3.5 select-none">
                  <img
                    src={channel.logo}
                    alt={channelLabel}
                    loading="lazy"
                    decoding="async"
                    className="max-h-full max-w-full object-contain filter drop-shadow-xs transition-transform duration-200 group-hover:scale-110"
                  />
                </div>
              </motion.button>
            );
          })}

          {vtvChannels.length === 0 && (
            <p className="px-2 py-4 text-sm text-black/60 dark:text-[#bdbdbd]">No VTV channels are available yet.</p>
          )}
        </div>
      </section>
    </div>
  );
};
