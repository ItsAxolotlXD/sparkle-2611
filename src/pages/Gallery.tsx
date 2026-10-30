import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Download, 
  X, 
  Play, 
  Film, 
  Image as ImageIcon, 
  Music, 
  FileText, 
  RotateCw, 
  FolderOpen, 
  Sparkles,
  CheckSquare,
  Square,
  Copy,
  Check,
  FileSpreadsheet,
  Presentation,
  FileCode,
  Folder,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  Info,
  SlidersHorizontal,
  ArrowUpDown,
  LayoutGrid,
  Maximize2,
  Share2,
  Filter,
  FolderTree,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import { 
  galleryDB, 
  GalleryMediaItem, 
  GalleryFolder,
  getMediaDimensions 
} from '../services/galleryStorage';
import { GalleryContextMenu, type GalleryContextAction } from '../components/gallery/GalleryContextMenu';
import { PromptDialog, MoveToFolderDialog } from '../components/gallery/GalleryDialogs';
import { useSettings } from '../hooks/useSettings';
import { modalDialogVariants, modalBackdropVariants } from '../utils/animations';
import { flyoutPanelClassName, flyoutPanelStyle } from '../components/FlyoutDropdown';
import { 
  FluentNotesIcon,
  FluentDeleteIcon,
  FluentFolderAddIcon,
  FluentRenameIcon,
  FluentFolderArrowLeftIcon,
  FluentArrowUploadIcon,
  FluentCopyIcon
} from '../components/FluentIcons';
import { showAppToast } from '../utils/toast';

export const WINDOWS_11_FOLDER_ICON = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/52/Windows_11_FOLDER.svg/1280px-Windows_11_FOLDER.svg.png?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=thumbnail';

export const NOTE_ICON_URL = 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Windows_Notepad_icon.png?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=original';
export const MUSIC_ICON_URL = 'https://static.wikia.nocookie.net/logopedia/images/2/2b/Music_win-11.png/revision/latest?cb=20211007190213';
export const WORD_ICON_URL = 'https://upload.wikimedia.org/wikipedia/commons/f/fd/Microsoft_Office_Word_%282019%E2%80%93present%29.svg';
export const EXCEL_ICON_URL = 'https://upload.wikimedia.org/wikipedia/commons/3/34/Microsoft_Office_Excel_%282019%E2%80%93present%29.svg';
export const PPT_ICON_URL = 'https://upload.wikimedia.org/wikipedia/commons/0/0d/Microsoft_Office_PowerPoint_%282019%E2%80%93present%29.svg';
export const PDF_ICON_URL = 'https://upload.wikimedia.org/wikipedia/commons/8/87/PDF_file_icon.svg';

const getGalleryFileIconSrc = (item: GalleryMediaItem) => {
  const title = (item.title || '').toLowerCase();
  const mime = (item.mimeType || '').toLowerCase();

  if (item.type === 'audio' || title.endsWith('.mp3') || title.endsWith('.wav') || title.endsWith('.flac') || title.endsWith('.m4a') || title.endsWith('.ogg') || mime.includes('audio')) {
    return { src: MUSIC_ICON_URL, alt: 'Music' };
  }
  if (title.endsWith('.docx') || title.endsWith('.doc') || mime.includes('word')) {
    return { src: WORD_ICON_URL, alt: 'Word' };
  }
  if (title.endsWith('.xlsx') || title.endsWith('.xls') || mime.includes('spreadsheet') || mime.includes('excel')) {
    return { src: EXCEL_ICON_URL, alt: 'Excel' };
  }
  if (title.endsWith('.pptx') || title.endsWith('.ppt') || mime.includes('presentation') || mime.includes('powerpoint')) {
    return { src: PPT_ICON_URL, alt: 'PowerPoint' };
  }
  if (title.endsWith('.pdf') || mime.includes('pdf')) {
    return { src: PDF_ICON_URL, alt: 'PDF' };
  }
  return { src: NOTE_ICON_URL, alt: 'Note' };
};

const LONG_PRESS_MS = 500;

interface GalleryProps {
  navigate: (route: string, state?: any) => void;
  searchQuery?: string;
  routeState?: any;
}

type FilterType = 'all' | 'image' | 'video' | 'audio' | 'document' | 'favorites' | 'folders';
type GridDensity = 'small' | 'medium' | 'large';
type SortOrder = 'dont-sort' | 'year' | 'month';

export const Gallery: React.FC<GalleryProps> = ({ navigate, searchQuery = '', routeState }) => {
  const { settings } = useSettings();
  const isLightMode = settings.theme === 'light';
  const dropdownBg = isLightMode ? 'rgba(243, 243, 243, 0.94)' : 'rgba(27, 31, 36, 0.94)';
  const [items, setItems] = useState<GalleryMediaItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [gridDensity, setGridDensity] = useState<GridDensity>('medium');
  const [sortOrder, setSortOrder] = useState<SortOrder>('month');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const [selectedItem, setSelectedItem] = useState<GalleryMediaItem | null>(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Selection mode states
  const [isSelectMode, setIsSelectMode] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Folders & context menu
  const [folders, setFolders] = useState<GalleryFolder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  const [galleryTooltip, setGalleryTooltip] = useState<{ label: string; top: number; left: number } | null>(null);

  const showTooltip = (label: string, e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setGalleryTooltip({
      label,
      top: rect.bottom + 8,
      left: rect.left + rect.width / 2,
    });
  };

  const hideTooltip = () => {
    setGalleryTooltip(null);
  };

  useEffect(() => {
    hideTooltip();
  }, [activeFilter, isSelectMode, currentFolderId]);
  const [contextMenu, setContextMenu] = useState<{ item: GalleryMediaItem; x: number; y: number } | null>(null);
  const [renameTarget, setRenameTarget] = useState<{ kind: 'item' | 'folder'; id: string; name: string } | null>(null);
  const [moveTargetIds, setMoveTargetIds] = useState<string[] | null>(null);
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [isMobileAppModalOpen, setIsMobileAppModalOpen] = useState(false);
  const [isWelcomeScreenOpen, setIsWelcomeScreenOpen] = useState(false);
  const longPressTimer = useRef<number | null>(null);
  const longPressTriggered = useRef(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryContainerRef = useRef<HTMLDivElement>(null);
  const galleryScrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load items from database
  const loadGallery = async () => {
    const [list, folderList] = await Promise.all([galleryDB.getAll(), galleryDB.getFolders()]);
    setItems(list);
    setFolders(folderList);
  };

  const currentFolder = folders.find((f) => f.id === currentFolderId) ?? null;
  const isSearching = searchQuery.trim().length > 0;

  useEffect(() => {
    if (currentFolderId && folders.length > 0 && !folders.some((f) => f.id === currentFolderId)) {
      setCurrentFolderId(null);
    }
  }, [folders, currentFolderId]);

  useEffect(() => {
    loadGallery();
    const unsubscribe = galleryDB.subscribe(() => {
      loadGallery();
    });
    return () => unsubscribe();
  }, []);

  // Sync folder/item from Sidebar or routeState
  useEffect(() => {
    try {
      const savedFolder = sessionStorage.getItem('vplay_gallery_selected_folder');
      if (savedFolder !== null) {
        setCurrentFolderId(savedFolder === 'null' ? null : savedFolder);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (routeState?.folderId !== undefined) {
      setCurrentFolderId(routeState.folderId);
      setActiveFilter('all');
    }
    if (routeState?.itemId) {
      const found = items.find((it) => it.id === routeState.itemId);
      if (found) setSelectedItem(found);
    }
  }, [routeState, items]);

  useEffect(() => {
    const handleFolderSelect = (e: any) => {
      const folderId = e.detail?.folderId ?? null;
      setCurrentFolderId(folderId);
      setActiveFilter('all');
    };
    const handleItemSelect = (e: any) => {
      const itemId = e.detail?.itemId;
      if (itemId) {
        const found = items.find((it) => it.id === itemId);
        if (found) setSelectedItem(found);
      }
    };
    window.addEventListener('vplay:gallery:folder_selected', handleFolderSelect);
    window.addEventListener('vplay:gallery:item_selected', handleItemSelect);
    return () => {
      window.removeEventListener('vplay:gallery:folder_selected', handleFolderSelect);
      window.removeEventListener('vplay:gallery:item_selected', handleItemSelect);
    };
  }, [items]);

  // Notify App when viewing a photo/video/file in Lightbox (to hide Sidebar and TopBar)
  useEffect(() => {
    const isOpen = Boolean(selectedItem);
    window.dispatchEvent(new CustomEvent('vplay:gallery:lightbox_toggle', { detail: { isOpen } }));
    return () => {
      window.dispatchEvent(new CustomEvent('vplay:gallery:lightbox_toggle', { detail: { isOpen: false } }));
    };
  }, [selectedItem]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(target)) {
        setIsFilterDropdownOpen(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(target)) {
        setIsSortDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const FILTER_OPTIONS: { id: FilterType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'all', label: 'All files', icon: ImageIcon },
    { id: 'image', label: 'Photos', icon: ImageIcon },
    { id: 'video', label: 'Videos', icon: Film },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'folders', label: 'Folders', icon: Folder },
    { id: 'document', label: 'Documents & Files', icon: FileText },
  ];

  const SORT_OPTIONS: { id: SortOrder; label: string }[] = [
    { id: 'dont-sort', label: "Don't sort" },
    { id: 'year', label: 'Year' },
    { id: 'month', label: 'Month' },
  ];

  // Filter & sort items
  const filteredItems = useMemo(() => {
    let result = items.filter((item) => {
      // Folder scope (search looks across every folder)
      if (!searchQuery.trim() && (item.folderId ?? null) !== currentFolderId) return false;

      // Type filter
      if (activeFilter === 'image' && item.type !== 'image') return false;
      if (activeFilter === 'video' && item.type !== 'video') return false;
      if (activeFilter === 'audio' && item.type !== 'audio') return false;
      if (activeFilter === 'document' && item.type !== 'document') return false;
      if (activeFilter === 'favorites' && !item.isFavorite) return false;

      // Search query (from TopBar)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q) ?? false;
        const matchesTags = item.tags?.some((t) => t.toLowerCase().includes(q)) ?? false;
        const matchesDate = item.dateLabel?.toLowerCase().includes(q) ?? false;
        const matchesMime = item.mimeType?.toLowerCase().includes(q) ?? false;
        if (!matchesTitle && !matchesDesc && !matchesTags && !matchesDate && !matchesMime) return false;
      }

      return true;
    });

    // Sort order: always newest down to oldest
    result = [...result].sort((a, b) => {
      const timeA = new Date(a.dateAdded).getTime() || 0;
      const timeB = new Date(b.dateAdded).getTime() || 0;
      return timeB - timeA;
    });

    return result;
  }, [items, activeFilter, searchQuery, currentFolderId]);

  const folderItemCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const it of items) {
      if (it.folderId) counts.set(it.folderId, (counts.get(it.folderId) ?? 0) + 1);
    }
    return counts;
  }, [items]);

  const categoryCounts = useMemo(() => {
    let images = 0, videos = 0, audios = 0, docs = 0, favs = 0;
    for (const it of items) {
      if (it.type === 'image') images++;
      else if (it.type === 'video') videos++;
      else if (it.type === 'audio') audios++;
      else if (it.type === 'document') docs++;
      if (it.isFavorite) favs++;
    }
    return { images, videos, audios, docs, favs };
  }, [items]);

  // Group filtered items based on sortOrder (Don't sort, Year, Month)
  const groupedSections = useMemo(() => {
    if (filteredItems.length === 0) return [];

    // 1. Don't sort: hiển thị toàn bộ files/items ở gallery theo thứ tự từ newest xuống oldest k chia theo ngày tháng năm
    if (sortOrder === 'dont-sort') {
      return [{
        id: 'all-items',
        year: 0,
        label: '',
        isUngrouped: true,
        items: filteredItems,
      }];
    }

    // 2. Year: chỉ chia theo năm
    if (sortOrder === 'year') {
      const groupsMap = new Map<number, { year: number; label: string; items: GalleryMediaItem[] }>();
      for (const item of filteredItems) {
        let year = item.year;
        if (!year && item.dateAdded) {
          const d = new Date(item.dateAdded);
          if (!isNaN(d.getFullYear())) year = d.getFullYear();
        }
        year = year || 2026;

        if (!groupsMap.has(year)) {
          groupsMap.set(year, { year, label: `${year}`, items: [] });
        }
        groupsMap.get(year)!.items.push(item);
      }

      return Array.from(groupsMap.entries())
        .sort((a, b) => b[0] - a[0])
        .map(([year, val]) => ({
          id: `year-${year}`,
          year: val.year,
          label: val.label,
          isUngrouped: false,
          items: val.items,
        }));
    }

    // 3. Month: chia theo tháng, năm, VD October 2026
    const groupsMap = new Map<string, { year: number; month: number; label: string; items: GalleryMediaItem[] }>();

    for (const item of filteredItems) {
      let year = item.year;
      let month = 0;
      let monthName = 'October';
      if (item.dateAdded) {
        const d = new Date(item.dateAdded);
        if (!isNaN(d.getTime())) {
          if (!year) year = d.getFullYear();
          month = d.getMonth();
          monthName = d.toLocaleString('en-US', { month: 'long' });
        }
      }
      year = year || 2026;
      const label = `${monthName} ${year}`;
      const key = `${year}-${String(month).padStart(2, '0')}`;

      if (!groupsMap.has(key)) {
        groupsMap.set(key, { year, month, label, items: [] });
      }
      groupsMap.get(key)!.items.push(item);
    }

    return Array.from(groupsMap.entries())
      .sort((a, b) => {
        if (b[1].year !== a[1].year) return b[1].year - a[1].year;
        return b[1].month - a[1].month;
      })
      .map(([key, value]) => ({
        id: key,
        year: value.year,
        label: value.label,
        isUngrouped: false,
        items: value.items,
      }));
  }, [filteredItems, sortOrder]);

  // Toggle selection for all items in a date group
  const toggleGroupSelect = (groupItems: GalleryMediaItem[]) => {
    const groupIds = groupItems.map((i) => i.id);
    const allSelected = groupIds.every((id) => selectedIds.has(id));

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        groupIds.forEach((id) => next.delete(id));
      } else {
        groupIds.forEach((id) => next.add(id));
      }
      return next;
    });

    if (!isSelectMode) {
      setIsSelectMode(true);
    }
  };

  const showToast = (msg: string) => {
    showAppToast(msg);
  };

  // Upload handler supporting images, videos, audio, and all office formats
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(10);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileNameLower = file.name.toLowerCase();
      let type: 'image' | 'video' | 'audio' | 'document' = 'document';

      if (file.type.startsWith('image/')) {
        type = 'image';
      } else if (file.type.startsWith('video/')) {
        type = 'video';
      } else if (file.type.startsWith('audio/')) {
        type = 'audio';
      } else {
        type = 'document';
      }

      const dims = await getMediaDimensions(file);
      const url = URL.createObjectURL(file);
      const now = new Date();
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const dateLabel = `${monthNames[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

      const tags = ['Uploaded'];
      if (fileNameLower.endsWith('.docx') || fileNameLower.endsWith('.doc')) {
        tags.push('Word', 'DOCX');
      } else if (fileNameLower.endsWith('.pptx') || fileNameLower.endsWith('.ppt')) {
        tags.push('PowerPoint', 'PPTX');
      } else if (fileNameLower.endsWith('.xlsx') || fileNameLower.endsWith('.xls')) {
        tags.push('Excel', 'XLSX');
      } else if (fileNameLower.endsWith('.pdf')) {
        tags.push('PDF');
      } else {
        tags.push(type.toUpperCase());
      }

      const newItem: GalleryMediaItem = {
        id: `upload-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
        title: file.name,
        type,
        url,
        blobData: file,
        thumbnailUrl: type === 'image' ? url : undefined,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        dateAdded: now.toISOString(),
        dateLabel,
        year: now.getFullYear(),
        dimensions: { width: dims.width, height: dims.height },
        aspectRatio: dims.width / Math.max(dims.height, 1),
        duration: dims.duration,
        isFavorite: false,
        tags,
        description: `Uploaded from device (${(file.size / (1024 * 1024)).toFixed(2)} MB)`,
        source: 'upload',
        folderId: currentFolderId,
      };

      await galleryDB.add(newItem);
      setUploadProgress(Math.round(((i + 1) / files.length) * 100));
    }

    setIsUploading(false);
    setUploadProgress(null);
    showToast(`Uploaded ${files.length} media ${files.length === 1 ? 'file' : 'files'}`);
    if (e.target) e.target.value = '';
  };

  const handleDeleteItem = async (item: GalleryMediaItem) => {
    setItems((prev) => prev.filter((it) => it.id !== item.id));
    if (selectedItem?.id === item.id) setSelectedItem(null);
    await galleryDB.delete(item.id);
    showToast(`Deleted "${item.title}"`);
  };

  const handleToggleFavorite = async (item: GalleryMediaItem) => {
    const isFav = await galleryDB.toggleFavorite(item.id);
    setItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, isFavorite: isFav } : it))
    );
    if (selectedItem?.id === item.id) {
      setSelectedItem({ ...selectedItem, isFavorite: isFav });
    }
    showToast(isFav ? 'Added to favorites' : 'Removed from favorites');
  };

  const handleRestoreSamples = async () => {
    await galleryDB.restoreSamples();
    showToast('Loaded sample photos (Samples demo mode)');
  };

  // Selection actions
  const toggleSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map((it) => it.id)));
    }
  };

  const handleDuplicateSelected = async () => {
    if (selectedIds.size === 0) return;
    const ids: string[] = Array.from(selectedIds);
    for (const id of ids) {
      await galleryDB.duplicate(id);
    }
    showToast(`Duplicated ${ids.length} ${ids.length === 1 ? 'item' : 'items'}`);
    setSelectedIds(new Set());
    setIsSelectMode(false);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    const ids: string[] = Array.from(selectedIds);
    setItems((prev) => prev.filter((it) => !selectedIds.has(it.id)));
    setSelectedIds(new Set());
    setIsSelectMode(false);
    await galleryDB.deleteMany(ids);
    showToast(`Deleted ${ids.length} ${ids.length === 1 ? 'item' : 'items'}`);
  };

  const closeContextMenu = React.useCallback(() => setContextMenu(null), []);

  const openContextMenu = (item: GalleryMediaItem, x: number, y: number) => {
    if (isSelectMode) return;
    setContextMenu({ item, x, y });
  };

  const clearLongPress = () => {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchStart = (item: GalleryMediaItem, e: React.TouchEvent) => {
    longPressTriggered.current = false;
    const touch = e.touches[0];
    const { clientX, clientY } = touch;
    clearLongPress();
    longPressTimer.current = window.setTimeout(() => {
      longPressTriggered.current = true;
      if (navigator.vibrate) navigator.vibrate(10);
      openContextMenu(item, clientX, clientY);
    }, LONG_PRESS_MS);
  };

  const getFileName = (item: GalleryMediaItem) => {
    if (/\.[a-z0-9]{2,5}$/i.test(item.title)) return item.title;
    const ext = item.mimeType?.split('/')[1]?.split(/[+;]/)[0];
    return ext && ext.length <= 5 ? `${item.title}.${ext}` : item.title;
  };

  const getItemBlob = async (item: GalleryMediaItem): Promise<Blob | null> => {
    if (item.blobData) return item.blobData;
    try {
      const res = await fetch(item.url);
      return await res.blob();
    } catch {
      return null;
    }
  };

  const handleSaveToDevice = async (item: GalleryMediaItem) => {
    const blob = await getItemBlob(item);
    const href = blob ? URL.createObjectURL(blob) : item.url;
    const a = document.createElement('a');
    a.href = href;
    a.download = getFileName(item);
    a.rel = 'noopener';
    if (!blob) a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    a.remove();
    if (blob) setTimeout(() => URL.revokeObjectURL(href), 1000);
    showToast(`Saving "${item.title}"`);
  };

  const handleShare = async (item: GalleryMediaItem) => {
    try {
      const blob = await getItemBlob(item);
      if (blob && navigator.share) {
        const file = new File([blob], getFileName(item), { type: blob.type || item.mimeType });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: item.title });
          return;
        }
      }
      if (navigator.share && /^https?:/.test(item.url)) {
        await navigator.share({ title: item.title, url: item.url });
        return;
      }
      if (/^https?:/.test(item.url) && navigator.clipboard) {
        await navigator.clipboard.writeText(item.url);
        showToast('Link copied to clipboard');
        return;
      }
      showToast('Sharing is not supported on this device');
    } catch (err) {
      if ((err as DOMException)?.name !== 'AbortError') showToast('Unable to share this file');
    }
  };

  const handleContextAction = async (action: GalleryContextAction) => {
    if (!contextMenu) return;
    const { item } = contextMenu;
    setContextMenu(null);
    switch (action) {
      case 'open':
        setSelectedItem(item);
        break;
      case 'favorite': {
        const isFav = await galleryDB.toggleFavorite(item.id);
        setItems((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, isFavorite: isFav } : it))
        );
        showToast(isFav ? 'Added to favorites' : 'Removed from favorites');
        break;
      }
      case 'rename':
        setRenameTarget({ kind: 'item', id: item.id, name: item.title });
        break;
      case 'share':
        await handleShare(item);
        break;
      case 'duplicate':
        await galleryDB.duplicate(item.id);
        showToast(`Duplicated "${item.title}"`);
        break;
      case 'move':
        setMoveTargetIds([item.id]);
        break;
      case 'save':
        await handleSaveToDevice(item);
        break;
      case 'delete':
        await handleDeleteItem(item);
        break;
    }
  };

  const handleRenameConfirm = async (name: string) => {
    if (!renameTarget) return;
    if (renameTarget.kind === 'item') {
      await galleryDB.rename(renameTarget.id, name);
      if (selectedItem?.id === renameTarget.id) setSelectedItem({ ...selectedItem, title: name });
    } else {
      await galleryDB.renameFolder(renameTarget.id, name);
    }
    setRenameTarget(null);
    showToast(`Renamed to "${name}"`);
  };

  const handleCreateFolder = async (name: string) => {
    const folder = await galleryDB.createFolder(name);
    setIsNewFolderOpen(false);
    if (moveTargetIds) {
      await galleryDB.moveToFolder(moveTargetIds, folder.id);
      showToast(`Moved ${moveTargetIds.length === 1 ? 'item' : `${moveTargetIds.length} items`} to "${name}"`);
      setMoveTargetIds(null);
      setSelectedIds(new Set());
      setIsSelectMode(false);
    } else {
      showToast(`Created folder "${name}"`);
    }
  };

  const handleMove = async (folderId: string | null) => {
    if (!moveTargetIds) return;
    const ids = moveTargetIds;
    setMoveTargetIds(null);
    await galleryDB.moveToFolder(ids, folderId);
    const dest = folderId ? folders.find((f) => f.id === folderId)?.name ?? 'folder' : 'Gallery';
    showToast(`Moved ${ids.length === 1 ? 'item' : `${ids.length} items`} to "${dest}"`);
    setSelectedIds(new Set());
    setIsSelectMode(false);
  };

  const handleDeleteFolder = async (folder: GalleryFolder) => {
    await galleryDB.deleteFolder(folder.id);
    if (currentFolderId === folder.id) setCurrentFolderId(null);
    showToast(`Deleted folder "${folder.name}"`);
  };

  // Lightbox navigation
  const currentIndex = useMemo(() => {
    if (!selectedItem) return -1;
    return filteredItems.findIndex((it) => it.id === selectedItem.id);
  }, [selectedItem, filteredItems]);

  const handlePrevMedia = () => {
    if (currentIndex > 0) {
      setSelectedItem(filteredItems[currentIndex - 1]);
      setZoomLevel(1);
      setRotation(0);
    }
  };

  const handleNextMedia = () => {
    if (currentIndex < filteredItems.length - 1) {
      setSelectedItem(filteredItems[currentIndex + 1]);
      setZoomLevel(1);
      setRotation(0);
    }
  };

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!selectedItem) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedItem(null);
      } else if (e.key === 'ArrowLeft') {
        handlePrevMedia();
      } else if (e.key === 'ArrowRight') {
        handleNextMedia();
      } else if (e.key === 'i' || e.key === 'I') {
        setShowInfoPanel((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedItem, currentIndex, filteredItems]);

  // Helper to determine Office Document type info
  const getDocumentDetails = (item: GalleryMediaItem) => {
    const title = item.title.toLowerCase();
    const mime = item.mimeType?.toLowerCase() || '';

    if (item.mimeType === 'application/x-sticky-note' || item.tags?.includes('Stickies') || item.tags?.includes('Sticky Note')) {
      return {
        badge: 'STICKIES',
        brand: 'Sticky Note',
        color: '#ca8a04',
        icon: FluentNotesIcon,
      };
    }
    if (title.endsWith('.docx') || title.endsWith('.doc') || mime.includes('word')) {
      return {
        badge: 'DOCX',
        brand: 'Word Document',
        color: '#2b579a',
        icon: FileText,
      };
    }
    if (title.endsWith('.pptx') || title.endsWith('.ppt') || mime.includes('presentation') || mime.includes('powerpoint')) {
      return {
        badge: 'PPTX',
        brand: 'PowerPoint',
        color: '#d24726',
        icon: Presentation,
      };
    }
    if (title.endsWith('.xlsx') || title.endsWith('.xls') || mime.includes('spreadsheet') || mime.includes('excel')) {
      return {
        badge: 'XLSX',
        brand: 'Excel Sheet',
        color: '#217346',
        icon: FileSpreadsheet,
      };
    }
    if (title.endsWith('.pdf') || mime.includes('pdf')) {
      return {
        badge: 'PDF',
        brand: 'PDF Document',
        color: '#e81123',
        icon: FileText,
      };
    }
    return {
      badge: 'FILE',
      brand: 'Document',
      color: '#4cc2ff',
      icon: FileCode,
    };
  };

  // Columns density classes for resolution-based display of media
  const columnsContainerStyle = useMemo(() => {
    if (gridDensity === 'small') {
      return 'columns-3 sm:columns-4 md:columns-6 lg:columns-8 gap-1.5 sm:gap-2';
    }
    if (gridDensity === 'large') {
      return 'columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-3 sm:gap-4';
    }
    // medium default
    return 'columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-2 sm:gap-2.5';
  }, [gridDensity]);

  return (
    <div id="gallery-page" className="flex flex-col h-[calc(100vh-56px)] max-h-[calc(100vh-56px)] overflow-hidden bg-transparent text-[#111827] dark:text-[#F3F4F6] relative select-none font-['Segoe_UI',system-ui,sans-serif]">

      {/* Windows 11 Photos Fluent Command Bar - Fixed, does not scroll with page */}
      <header className="gallery-toolbar shrink-0 z-30 px-3 sm:px-6 py-2 border-b border-black/10 dark:border-white/10 bg-[#f9f9f9]/80 dark:bg-[#202020]/80 backdrop-blur-2xl flex items-center justify-between gap-3 rounded-none md:rounded-tl-[10px]">
        {/* Left Section: Filter, Sort, Load Demo, New Folder (buttons with white icons) + item count badge */}
        <div className="flex items-center gap-1.5 overflow-visible py-0.5">
          {/* 1. Filter Dropdown (Icon phễu màu trắng) */}
          <div className="relative" ref={filterDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsFilterDropdownOpen((prev) => !prev);
                setIsSortDropdownOpen(false);
              }}
              onMouseEnter={(e) => showTooltip(`Bộ lọc (${activeFilter})`, e)}
              onMouseLeave={hideTooltip}
              className={`w-8 h-8 rounded-[6px] flex items-center justify-center transition-all cursor-pointer relative active:scale-95 bg-transparent border-0 shadow-none text-white ${
                isFilterDropdownOpen || activeFilter !== 'all'
                  ? 'bg-black/10 dark:bg-white/15'
                  : 'hover:bg-black/10 dark:hover:bg-white/10'
              }`}
              aria-label={`Filter: ${activeFilter}`}
            >
              <Filter className="w-3.5 h-3.5 text-white" />
              {activeFilter !== 'all' && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#4cc2ff]" />
              )}
            </button>

            {/* Filter Dropdown Menu with Unified Flyout Style & Staggered Animation */}
            <AnimatePresence>
              {isFilterDropdownOpen && (
                <motion.div
                  key="gallery-filter-dropdown"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{
                    duration: 0.32,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className={`absolute top-[calc(100%+8px)] left-0 z-50 min-w-[210px] ${flyoutPanelClassName}`}
                  style={flyoutPanelStyle}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    className="px-2.5 py-1 text-[10px] font-bold text-[#6b7280] dark:text-[#9ca3af] uppercase tracking-wider"
                  >
                    Filter by
                  </motion.div>
                  {FILTER_OPTIONS.map((tab, idx) => {
                    const isActive = activeFilter === tab.id;
                    const IconComp = tab.icon;
                    return (
                      <motion.button
                        key={tab.id}
                        type="button"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          transition: {
                            duration: 0.3,
                            delay: Math.min(idx * 0.032, 0.24),
                            ease: [0.16, 1, 0.3, 1],
                          },
                        }}
                        onClick={() => {
                          setActiveFilter(tab.id as FilterType);
                          if (tab.id === 'folders') {
                            setCurrentFolderId(null);
                          }
                          setIsFilterDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-[6px] flex items-center justify-between text-xs font-medium cursor-pointer transition-colors ${
                          isActive
                            ? 'bg-[#005fb8]/10 dark:bg-[#4cc2ff]/15 text-[#005fb8] dark:text-[#4cc2ff] font-semibold'
                            : 'text-[#111827] dark:text-[#f3f4f6] hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <IconComp className={`w-3.5 h-3.5 ${isActive ? 'text-[#005fb8] dark:text-[#4cc2ff]' : 'text-[#6b7280] dark:text-[#9ca3af]'}`} />
                          <span>{tab.label}</span>
                        </div>
                        {isActive && <Check className="w-3.5 h-3.5 text-[#005fb8] dark:text-[#4cc2ff]" />}
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 2. Sort Dropdown (cạnh nút filter, button without background) */}
          <div className="relative" ref={sortDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsSortDropdownOpen((prev) => !prev);
                setIsFilterDropdownOpen(false);
              }}
              onMouseEnter={(e) => showTooltip('Sắp xếp (Sort)', e)}
              onMouseLeave={hideTooltip}
              className={`w-8 h-8 rounded-[6px] flex items-center justify-center transition-all cursor-pointer active:scale-95 bg-transparent border-0 shadow-none text-white ${
                isSortDropdownOpen
                  ? 'bg-black/10 dark:bg-white/15'
                  : 'hover:bg-black/10 dark:hover:bg-white/10'
              }`}
              aria-label="Sort"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-white" />
            </button>

            {/* Sort Dropdown Menu with Unified Flyout Style & Staggered Animation */}
            <AnimatePresence>
              {isSortDropdownOpen && (
                <motion.div
                  key="gallery-sort-dropdown"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{
                    duration: 0.32,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className={`absolute top-[calc(100%+8px)] left-0 z-50 min-w-[195px] ${flyoutPanelClassName}`}
                  style={flyoutPanelStyle}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    className="px-2.5 py-1 text-[10px] font-bold text-[#6b7280] dark:text-[#9ca3af] uppercase tracking-wider"
                  >
                    Sort by
                  </motion.div>
                  {SORT_OPTIONS.map((opt, idx) => (
                    <motion.button
                      key={opt.id}
                      type="button"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        transition: {
                          duration: 0.3,
                          delay: Math.min(idx * 0.032, 0.24),
                          ease: [0.16, 1, 0.3, 1],
                        },
                      }}
                      onClick={() => {
                        setSortOrder(opt.id as SortOrder);
                        setIsSortDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-[6px] flex items-center justify-between text-xs font-medium cursor-pointer transition-colors ${
                        sortOrder === opt.id
                          ? 'bg-[#005fb8]/10 dark:bg-[#4cc2ff]/15 text-[#005fb8] dark:text-[#4cc2ff] font-semibold'
                          : 'text-[#111827] dark:text-[#f3f4f6] hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/15'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {sortOrder === opt.id && <Check className="w-3.5 h-3.5 text-[#005fb8] dark:text-[#4cc2ff]" />}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 3. Load Demo Button (cạnh nút sort, button with white icon) */}
          <button
            type="button"
            onClick={handleRestoreSamples}
            onMouseEnter={(e) => showTooltip('Tải dữ liệu mẫu (Demo)', e)}
            onMouseLeave={hideTooltip}
            className="w-8 h-8 rounded-[6px] bg-transparent hover:bg-black/10 dark:hover:bg-white/10 text-white border-0 shadow-none transition-all cursor-pointer flex items-center justify-center active:scale-95"
            aria-label="Load demo samples"
          >
            <RotateCw className="w-3.5 h-3.5 text-white" />
          </button>

          {/* 4. New Folder Button (cạnh nút load demo, button with white icon) */}
          <button
            type="button"
            onClick={() => setIsNewFolderOpen(true)}
            onMouseEnter={(e) => showTooltip('Tạo thư mục mới (New folder)', e)}
            onMouseLeave={hideTooltip}
            className="w-8 h-8 rounded-[6px] bg-transparent hover:bg-black/10 dark:hover:bg-white/10 active:scale-95 text-white border-0 shadow-none transition-all cursor-pointer flex items-center justify-center"
            aria-label="New folder"
          >
            <FluentFolderAddIcon className="w-4 h-4 text-white" />
          </button>

          {/* 5. Welcome Screen / Highlights Button */}
          <button
            type="button"
            onClick={() => setIsWelcomeScreenOpen(true)}
            onMouseEnter={(e) => showTooltip('Khám phá điểm nổi bật (Highlights)', e)}
            onMouseLeave={hideTooltip}
            className="h-8 px-2.5 rounded-[6px] bg-transparent hover:bg-black/10 dark:hover:bg-white/10 active:scale-95 text-white border-0 shadow-none transition-all cursor-pointer flex items-center gap-1.5"
            aria-label="Welcome screen"
          >
            <Sparkles className="gallery-toolbar-icon w-3.5 h-3.5 text-[#4cc2ff]" />
            <span className="hidden sm:inline text-xs font-semibold text-white">Highlights</span>
          </button>

          {/* Item Count Pill & Active Filter Pill */}
          <div className="flex items-center gap-1.5 ml-1">
            <span className="hidden xs:inline-flex text-[11px] font-medium text-white px-1.5 py-0.5 whitespace-nowrap">
              {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
            </span>
            {activeFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-white px-2 py-0.5 bg-black/10 dark:bg-white/15 rounded-full border border-black/10 dark:border-white/15 whitespace-nowrap">
                {activeFilter}
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  onMouseEnter={(e) => showTooltip('Bỏ lọc', e)}
                  onMouseLeave={hideTooltip}
                  className="hover:text-rose-400 cursor-pointer ml-0.5 text-white"
                  aria-label="Clear filter"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </span>
            )}
          </div>
        </div>

        {/* Right Section: Windows 11 Photos Action Toolbar */}
        <div className="flex items-center gap-1.5 ml-auto">
          {isSelectMode ? (
            /* Multi-Select Active Toolbar */
            <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/10 px-2.5 py-1 rounded-[8px] border-0 shadow-xs">
              <span className="text-xs font-semibold text-white px-1">
                {selectedIds.size} selected
              </span>

              {/* Select All */}
              <button
                type="button"
                onClick={handleSelectAll}
                onMouseEnter={(e) => showTooltip(selectedIds.size === filteredItems.length && filteredItems.length > 0 ? 'Bỏ chọn tất cả' : 'Chọn tất cả', e)}
                onMouseLeave={hideTooltip}
                className="px-2.5 py-1 rounded-[6px] bg-black/10 dark:bg-white/15 hover:bg-black/15 dark:hover:bg-white/20 text-xs text-white font-medium transition-colors cursor-pointer border-0"
              >
                {selectedIds.size === filteredItems.length && filteredItems.length > 0 ? 'Deselect All' : 'Select All'}
              </button>

              {/* Duplicate Selected */}
              <button
                type="button"
                onClick={handleDuplicateSelected}
                onMouseEnter={(e) => showTooltip('Nhân bản (Duplicate)', e)}
                onMouseLeave={hideTooltip}
                disabled={selectedIds.size === 0}
                className="px-2.5 py-1 rounded-[6px] bg-black/10 dark:bg-white/15 hover:bg-black/15 dark:hover:bg-white/20 disabled:opacity-40 text-white text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer border-0"
                aria-label="Duplicate selected"
              >
                <FluentCopyIcon className="w-4 h-4 text-white" />
                <span className="hidden md:inline text-white">Duplicate</span>
              </button>

              {/* Move Selected */}
              <button
                type="button"
                onClick={() => setMoveTargetIds(Array.from(selectedIds))}
                onMouseEnter={(e) => showTooltip('Di chuyển vào thư mục (Move)', e)}
                onMouseLeave={hideTooltip}
                disabled={selectedIds.size === 0}
                className="px-2.5 py-1 rounded-[6px] bg-black/10 dark:bg-white/15 hover:bg-black/15 dark:hover:bg-white/20 disabled:opacity-40 text-xs font-medium text-white flex items-center gap-1.5 transition-all cursor-pointer border-0"
                aria-label="Move into folder"
              >
                <FluentFolderArrowLeftIcon className="w-4 h-4 text-white" />
                <span className="hidden md:inline text-white">Move</span>
              </button>

              {/* Delete Selected */}
              <button
                type="button"
                onClick={handleDeleteSelected}
                onMouseEnter={(e) => showTooltip('Xóa các mục đã chọn (Delete)', e)}
                onMouseLeave={hideTooltip}
                disabled={selectedIds.size === 0}
                className="px-2.5 py-1 rounded-[6px] bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs border-0"
                aria-label="Delete selected"
              >
                <FluentDeleteIcon className="w-4 h-4 text-white" />
                <span className="text-white">Delete</span>
              </button>

              {/* Cancel selection */}
              <button
                type="button"
                onClick={() => {
                  setIsSelectMode(false);
                  setSelectedIds(new Set());
                }}
                onMouseEnter={(e) => showTooltip('Hoàn tất chọn (Done)', e)}
                onMouseLeave={hideTooltip}
                className="px-2 py-1 rounded-[6px] text-xs text-white hover:text-white/80 cursor-pointer ml-1 border-0"
              >
                Done
              </button>
            </div>
          ) : (
            /* Normal Mode Toolbar */
            <>
              {/* Grid Density Switcher - Icons changed to 1+, 2+, 3+, no borders */}
              <div className="hidden md:flex items-center bg-black/10 dark:bg-white/10 p-0.5 rounded-[6px] border-0">
                <button
                  type="button"
                  onClick={() => setGridDensity('small')}
                  onMouseEnter={(e) => showTooltip('Lưới nhỏ (1+)', e)}
                  onMouseLeave={hideTooltip}
                  className={`h-7 px-2 rounded-[4px] cursor-pointer transition-colors border-0 flex items-center justify-center text-white ${
                    gridDensity === 'small' ? 'bg-white/20 shadow-xs font-bold' : 'text-white/80 hover:text-white font-medium'
                  }`}
                  aria-label="Small grid tiles (1+)"
                >
                  <span className="text-[11px] tracking-tight text-white">1+</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGridDensity('medium')}
                  onMouseEnter={(e) => showTooltip('Lưới vừa (2+)', e)}
                  onMouseLeave={hideTooltip}
                  className={`h-7 px-2 rounded-[4px] cursor-pointer transition-colors border-0 flex items-center justify-center text-white ${
                    gridDensity === 'medium' ? 'bg-white/20 shadow-xs font-bold' : 'text-white/80 hover:text-white font-medium'
                  }`}
                  aria-label="Medium grid tiles (2+)"
                >
                  <span className="text-[11px] tracking-tight text-white">2+</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGridDensity('large')}
                  onMouseEnter={(e) => showTooltip('Lưới lớn (3+)', e)}
                  onMouseLeave={hideTooltip}
                  className={`h-7 px-2 rounded-[4px] cursor-pointer transition-colors border-0 flex items-center justify-center text-white ${
                    gridDensity === 'large' ? 'bg-white/20 shadow-xs font-bold' : 'text-white/80 hover:text-white font-medium'
                  }`}
                  aria-label="Large grid tiles (3+)"
                >
                  <span className="text-[11px] tracking-tight text-white">3+</span>
                </button>
              </div>

              {/* 5. Select Mode Button (bỏ viền nút, icon màu trắng) */}
              {filteredItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsSelectMode(true)}
                  onMouseEnter={(e) => showTooltip('Chọn nhiều tệp (Select)', e)}
                  onMouseLeave={hideTooltip}
                  className="px-3 h-8 rounded-[6px] bg-black/10 dark:bg-white/10 hover:bg-black/15 dark:hover:bg-white/15 active:scale-95 text-xs font-semibold text-white border-0 transition-all cursor-pointer flex items-center gap-1.5"
                  aria-label="Select multiple files"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-white" />
                  <span className="text-white">Select</span>
                </button>
              )}

              {/* Import Button (formerly Upload button - retains primary action styling) */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onMouseEnter={(e) => showTooltip('Nhập ảnh, video hoặc tài liệu (Import)', e)}
                onMouseLeave={hideTooltip}
                className="px-3.5 h-8 rounded-[6px] bg-[#005fb8] dark:bg-[#4cc2ff] hover:bg-[#0067c0] dark:hover:bg-[#6bd0ff] active:scale-95 text-white dark:text-black text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs border-0 transition-all"
                aria-label="Import photos, videos, or documents"
              >
                <FluentArrowUploadIcon className="gallery-import-icon w-3.5 h-3.5 text-white" />
                <span className="light-mode-white-label">Import</span>
              </button>
            </>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative" ref={galleryContainerRef}>
        {/* Gallery Content View */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 no-scrollbar" ref={galleryScrollRef} data-gallery-scroll="true">
          {/* Folder breadcrumb navigation */}
          {currentFolder && !isSearching && (
            <nav aria-label="Folder Breadcrumb" className="flex items-center gap-2 mb-5 max-w-[1800px] mx-auto text-sm bg-black/[0.02] dark:bg-white/[0.03] p-2 rounded-lg border border-black/5 dark:border-white/5">
              <button
                type="button"
                onClick={() => setCurrentFolderId(null)}
                className="w-8 h-8 rounded-[6px] flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition-colors text-[#005fb8] dark:text-[#4cc2ff]"
                aria-label="Back to Gallery"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentFolderId(null)}
                className="px-2 py-1 rounded-[4px] text-[#6b7280] dark:text-neutral-400 hover:text-[#111827] dark:hover:text-white cursor-pointer font-medium"
              >
                Gallery
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-[#9ca3af]" />
              <div className="flex items-center gap-1.5">
                <img src={WINDOWS_11_FOLDER_ICON} alt="Folder" className="w-4 h-4 object-contain inline-block" />
                <span className="font-semibold text-[#111827] dark:text-white" aria-current="page">{currentFolder.name}</span>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setRenameTarget({ kind: 'folder', id: currentFolder.id, name: currentFolder.name })}
                  className="h-7 px-2.5 rounded-[6px] text-xs font-medium flex items-center gap-1.5 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition-colors border border-black/5 dark:border-white/5 text-[#111827] dark:text-white"
                >
                  <FluentRenameIcon className="w-3.5 h-3.5 text-current" />
                  <span>Rename</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteFolder(currentFolder)}
                  className="h-7 px-2.5 rounded-[6px] text-xs font-medium flex items-center gap-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors border border-rose-500/20"
                >
                  <FluentDeleteIcon className="w-3.5 h-3.5 text-current" />
                  <span>Delete folder</span>
                </button>
              </div>
            </nav>
          )}

          {/* Folder Cards (Shown at root or in Folders tab) - Horizontal Tiles */}
          {(!currentFolderId || activeFilter === 'folders') && !isSearching && folders.length > 0 && (
            <section aria-label="Folders" className="max-w-[1800px] mx-auto mb-7">
              <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-[#4b5563] dark:text-[#d1d5db] px-1 mb-3">
                <div className="flex items-center gap-2">
                  <img src={WINDOWS_11_FOLDER_ICON} alt="Folder" className="w-4 h-4 object-contain inline-block" />
                  <span>Folders</span>
                </div>
                <span className="text-[11px] text-[#6b7280] dark:text-[#9ca3af] bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-full">
                  {folders.length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
                <AnimatePresence>
                  {folders.map((folder) => {
                    const count = folderItemCounts.get(folder.id) ?? 0;
                    return (
                      <motion.div
                        key={folder.id}
                        layout
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.7 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <button
                          type="button"
                          onClick={() => setCurrentFolderId(folder.id)}
                          className="gallery-file-card group flex flex-row items-center gap-3 p-2.5 sm:p-3 rounded-[8px] sm:rounded-[10px] bg-black/[0.02] dark:bg-white/[0.04] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] border border-black/10 dark:border-white/10 text-left cursor-pointer transition-all hover:shadow-md w-full"
                        >
                          <img
                            src={WINDOWS_11_FOLDER_ICON}
                            alt="Folder"
                            className="w-8 h-8 object-contain shrink-0 drop-shadow-sm"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-semibold truncate text-[#111827] dark:text-white group-hover:text-[#005fb8] dark:group-hover:text-[#4cc2ff] transition-colors">
                              {folder.name}
                            </p>
                            <p className="text-[11px] text-[#6b7280] dark:text-[#9ca3af] mt-0.5">
                              {count === 1 ? '1 item' : `${count} items`}
                            </p>
                          </div>
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </section>
          )}

          {/* Empty State - Moments Highlights matching Microsoft design */}
          {items.length === 0 && !currentFolderId ? (
            <div className="flex flex-col items-center justify-center min-h-[65vh] text-center px-4 max-w-4xl mx-auto py-8">
              {/* Heading */}
              <h2 className="text-xl sm:text-2xl md:text-[26px] font-semibold text-[#111827] dark:text-white tracking-tight mb-2">
                Explore highlights from your photo collection
              </h2>

              {/* Subheading */}
              <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 max-w-xl mx-auto mb-8 font-normal leading-relaxed">
                Add photos to relive special times, revisit favorite places, and celebrate what matters most.
              </p>

              {/* Center Moments Image Illustration */}
              <div className="relative mb-8 max-w-[540px] w-full px-2">
                <div className="absolute inset-0 bg-radial from-violet-600/20 via-sky-600/10 to-transparent blur-2xl pointer-events-none -z-10" />
                <img
                  src="https://res.public.onecdn.static.microsoft/files/odsp-web-prod_2026-10-02.003/odbspartan/images/moments_empty_97059def.png"
                  alt="Explore highlights from your photo collection"
                  className="w-full h-auto object-contain drop-shadow-2xl select-none pointer-events-none"
                  draggable={false}
                />
              </div>

              {/* Dual Action Cards Row */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 sm:gap-10 w-full max-w-lg mb-8">
                {/* 1. Add photos here */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-3 p-2 rounded-xl text-left hover:bg-black/5 dark:hover:bg-white/5 active:scale-98 transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#0078d4] flex items-center justify-center shrink-0 shadow-md">
                    <ImageIcon className="w-5 h-5 text-white stroke-[2]" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[14px] font-semibold text-[#111827] dark:text-white group-hover:text-black dark:group-hover:text-white transition-colors">
                      Add photos here
                    </span>
                    <span className="light-mode-black-label text-[13px] text-white dark:text-[#4cc2ff] group-hover:underline">
                      Upload on your device
                    </span>
                  </div>
                </button>

                {/* 2. Load samples - Load pre-installed Gallery items */}
                <button
                  type="button"
                  onClick={handleRestoreSamples}
                  className="flex items-center gap-3 p-2 rounded-xl text-left hover:bg-black/5 dark:hover:bg-white/5 active:scale-98 transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#7738d8] flex items-center justify-center shrink-0 shadow-md">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[14px] font-semibold text-[#111827] dark:text-white group-hover:text-black dark:group-hover:text-white transition-colors">
                      Load samples
                    </span>
                    <span className="text-[13px] text-[#8b5cf6] dark:text-[#b197fc] group-hover:underline">
                      Load pre-installed Gallery items
                    </span>
                  </div>
                </button>
              </div>

              {/* Load Sample Files Option */}
              <div className="pt-2 flex items-center justify-center">
                <button
                  type="button"
                  onClick={handleRestoreSamples}
                  className="text-xs text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer py-1.5 px-3 rounded-md hover:bg-black/5 dark:hover:bg-white/5"
                >
                  <RotateCw className="w-3.5 h-3.5 text-[#0078d4] dark:text-[#4cc2ff]" />
                  <span>Load demo sample photos</span>
                </button>
              </div>
            </div>
          ) : filteredItems.length === 0 && activeFilter === 'all' && !isSearching ? (
            currentFolderId ? (
              <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-4 max-w-md mx-auto">
                <img src={WINDOWS_11_FOLDER_ICON} alt="Folder" className="w-12 h-12 mb-3 object-contain" />
                <h3 className="text-base font-semibold text-[#111827] dark:text-white mb-1">This folder is empty</h3>
                <p className="text-xs text-[#6b7280] dark:text-[#9ca3af] mb-4">
                  Right-click or select items in Gallery and move them into this folder.
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-lg bg-[#005fb8] dark:bg-[#4cc2ff] text-white dark:text-black text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FluentArrowUploadIcon className="w-3.5 h-3.5" />
                  <span>Upload into this folder</span>
                </button>
              </div>
            ) : null
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center text-[#6b7280] dark:text-[#9ca3af] mb-4">
                <FolderOpen className="w-8 h-8 stroke-[1.5]" />
              </div>
              <h3 className="text-base font-semibold text-[#111827] dark:text-white mb-1">
                No items match this filter
              </h3>
              <p className="text-xs text-[#6b7280] dark:text-[#9ca3af] mb-4">
                Try selecting a different filter category or reset your search.
              </p>
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className="px-4 py-2 rounded-[6px] bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-xs font-semibold text-[#111827] dark:text-white cursor-pointer transition-colors"
              >
                Show All Items
              </button>
            </div>
          ) : (
            /* Populated Windows 11 Photos Grid Grouped by Date */
            <div className="space-y-8 max-w-[1800px] mx-auto pb-16">
              {groupedSections.map((group, groupIdx) => {
                const isFirstSectionOfYear = groupIdx === 0 || groupedSections[groupIdx - 1].year !== group.year;
                const isAllGroupSelected = group.items.every((it) => selectedIds.has(it.id));

                return (
                  <section
                    key={group.id}
                    id={isFirstSectionOfYear ? `gallery-group-${group.year}` : `gallery-section-${group.id}`}
                    data-year={group.year}
                    className="gallery-year-section space-y-3"
                  >
                    {/* Date Header without background or border (hidden when Don't sort is active) */}
                    {!group.isUngrouped && (
                      <div className="flex items-center justify-between px-2 py-1.5 bg-transparent transition-colors">
                        <div className="flex items-baseline gap-2.5">
                          <h3 className="text-base sm:text-lg font-bold text-[#111827] dark:text-white">
                            {group.label}
                          </h3>
                          <span className="text-xs text-[#6b7280] dark:text-[#9ca3af] font-normal">
                            {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
                          </span>
                        </div>

                        {/* Group Select Button */}
                        <button
                          type="button"
                          onClick={() => toggleGroupSelect(group.items)}
                          className={`px-2.5 py-1 rounded-[6px] text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                            isAllGroupSelected && isSelectMode
                              ? 'bg-[#005fb8] dark:bg-[#4cc2ff] text-white dark:text-black font-semibold shadow-xs'
                              : 'hover:bg-black/5 dark:hover:bg-white/10 text-[#6b7280] dark:text-[#9ca3af] hover:text-[#111827] dark:hover:text-white'
                          }`}
                          title="Select all items in this section"
                        >
                          {isAllGroupSelected && isSelectMode ? (
                            <>
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>Selected</span>
                            </>
                          ) : (
                            <span>Select</span>
                          )}
                        </button>
                      </div>
                    )}

                    {(() => {
                      const tileItems = group.items.filter((it) => it.type !== 'image' && it.type !== 'video');
                      const mediaItems = group.items.filter((it) => it.type === 'image' || it.type === 'video');

                      return (
                        <div className="space-y-3">
                          {/* 1. Horizontal Tiles for Files, Audio, and Other non-media items */}
                          {tileItems.length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                              <AnimatePresence>
                                {tileItems.map((item) => {
                                  const isSelected = selectedIds.has(item.id);
                                  const docInfo = item.type === 'document' ? getDocumentDetails(item) : null;

                                  return (
                                    <motion.div
                                      key={item.id}
                                      layout
                                      initial={{ opacity: 0, scale: 0.7 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.7 }}
                                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                                      onClick={(e) => {
                                        if (longPressTriggered.current) {
                                          longPressTriggered.current = false;
                                          return;
                                        }
                                        if (isSelectMode) {
                                          toggleSelect(item.id, e);
                                        } else {
                                          setSelectedItem(item);
                                          setZoomLevel(1);
                                          setRotation(0);
                                        }
                                      }}
                                      onContextMenu={(e) => {
                                        e.preventDefault();
                                        clearLongPress();
                                        openContextMenu(item, e.clientX, e.clientY);
                                      }}
                                      onTouchStart={(e) => handleTouchStart(item, e)}
                                      onTouchMove={clearLongPress}
                                      onTouchEnd={clearLongPress}
                                      onTouchCancel={clearLongPress}
                                      className={`gallery-file-card gallery-media-card group relative flex flex-row items-center gap-3 p-2.5 sm:p-3 rounded-[8px] sm:rounded-[10px] bg-black/[0.02] dark:bg-white/[0.04] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] cursor-pointer shadow-xs hover:shadow-md transition-all select-none border ${
                                        isSelected
                                          ? 'ring-2 ring-[#005fb8] dark:ring-[#4cc2ff] border-transparent'
                                          : 'border-black/10 dark:border-white/10'
                                      }`}
                                    >
                                      {/* Icon on left - no background, matching recommended section */}
                                      <div className="w-10 h-10 flex items-center justify-center shrink-0 bg-transparent">
                                        <img
                                          src={getGalleryFileIconSrc(item).src}
                                          alt={getGalleryFileIconSrc(item).alt}
                                          referrerPolicy="no-referrer"
                                          loading="lazy"
                                          className="w-8 h-8 object-contain filter drop-shadow-xs"
                                        />
                                      </div>

                                      {/* Title & Metadata in center */}
                                      <div className="min-w-0 flex-1">
                                        <p className="text-[13px] font-semibold truncate text-[#111827] dark:text-white group-hover:text-[#005fb8] dark:group-hover:text-[#4cc2ff] transition-colors">
                                          {item.title}
                                        </p>
                                        <p className="text-[11px] text-[#6b7280] dark:text-[#9ca3af] mt-0.5 flex items-center gap-1.5">
                                          <span>{item.type === 'audio' ? 'Audio file' : (docInfo?.brand || 'Document')}</span>
                                          <span>•</span>
                                          <span>{item.size ? `${(item.size / 1024).toFixed(0)} KB` : item.dateLabel || 'File'}</span>
                                        </p>
                                      </div>

                                      {/* Checkbox indicator */}
                                      <div
                                        className={`shrink-0 transition-opacity ${
                                          isSelectMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                        }`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (!isSelectMode) setIsSelectMode(true);
                                          toggleSelect(item.id, e);
                                        }}
                                      >
                                        <div
                                          className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                                            isSelected
                                              ? 'bg-[#005fb8] dark:bg-[#4cc2ff] text-white dark:text-black shadow-md ring-2 ring-white dark:ring-black'
                                              : 'bg-black/20 dark:bg-white/20 hover:bg-black/40 text-white border border-black/20 dark:border-white/30'
                                          }`}
                                        >
                                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                        </div>
                                      </div>
                                    </motion.div>
                                  );
                                })}
                              </AnimatePresence>
                            </div>
                          )}

                          {/* 2. Media Items (Images and Videos) displayed according to native resolution ratio */}
                          {mediaItems.length > 0 && (
                            <div className={columnsContainerStyle}>
                              <AnimatePresence>
                                {mediaItems.map((item) => {
                                  const isSelected = selectedIds.has(item.id);
                                  const ratio = item.aspectRatio || (item.dimensions && item.dimensions.height > 0 ? item.dimensions.width / item.dimensions.height : 16 / 9);

                                  return (
                                    <motion.div
                                      key={item.id}
                                      layout
                                      initial={{ opacity: 0, scale: 0.7 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.7 }}
                                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                                    onClick={(e) => {
                                      if (longPressTriggered.current) {
                                        longPressTriggered.current = false;
                                        return;
                                      }
                                      if (isSelectMode) {
                                        toggleSelect(item.id, e);
                                      } else {
                                        setSelectedItem(item);
                                        setZoomLevel(1);
                                        setRotation(0);
                                      }
                                    }}
                                    onContextMenu={(e) => {
                                      e.preventDefault();
                                      clearLongPress();
                                      openContextMenu(item, e.clientX, e.clientY);
                                    }}
                                    onTouchStart={(e) => handleTouchStart(item, e)}
                                    onTouchMove={clearLongPress}
                                    onTouchEnd={clearLongPress}
                                    onTouchCancel={clearLongPress}
                                    className={`gallery-media-card group relative break-inside-avoid mb-2 sm:mb-2.5 rounded-[8px] sm:rounded-[10px] overflow-hidden bg-black/5 dark:bg-[#282828] cursor-pointer shadow-xs hover:shadow-xl transition-all select-none border ${
                                      isSelected
                                        ? 'ring-3 ring-[#005fb8] dark:ring-[#4cc2ff] border-transparent'
                                        : 'border-black/5 dark:border-white/5 hover:border-[#005fb8]/50 dark:hover:border-[#4cc2ff]/50'
                                    }`}
                                    style={{ aspectRatio: `${ratio}` }}
                                  >
                                    {/* Checkbox indicator */}
                                    <div
                                      className={`absolute top-2 left-2 z-20 transition-opacity ${
                                        isSelectMode
                                          ? 'opacity-100'
                                          : 'opacity-0 group-hover:opacity-100'
                                      }`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (!isSelectMode) setIsSelectMode(true);
                                        toggleSelect(item.id, e);
                                      }}
                                    >
                                      <div
                                        className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                                          isSelected
                                            ? 'bg-[#005fb8] dark:bg-[#4cc2ff] text-white dark:text-black shadow-md ring-2 ring-white dark:ring-black'
                                            : 'bg-black/40 hover:bg-black/60 text-white border border-white/60 backdrop-blur-sm'
                                        }`}
                                      >
                                        {isSelected ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : null}
                                      </div>
                                    </div>

                                    {/* Media Thumbnail / Preview displaying according to resolution */}
                                    {item.type === 'video' ? (
                                      <div className="relative w-full h-full bg-black">
                                        <img
                                          src={item.thumbnailUrl || item.url}
                                          alt={item.title}
                                          className="w-full h-full object-cover"
                                          loading="lazy"
                                          onLoad={(e) => {
                                            const nw = e.currentTarget.naturalWidth;
                                            const nh = e.currentTarget.naturalHeight;
                                            if (nw && nh && nh > 0) {
                                              const cardEl = e.currentTarget.closest('.gallery-media-card') as HTMLElement | null;
                                              if (cardEl) {
                                                cardEl.style.aspectRatio = `${nw / nh}`;
                                              }
                                            }
                                          }}
                                        />
                                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                          <div className="w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-md shadow-lg">
                                            <Play className="w-5 h-5 fill-current ml-0.5" />
                                          </div>
                                        </div>
                                        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-[4px] bg-black/70 backdrop-blur-md text-[10px] font-semibold text-white">
                                          {item.duration ? `${Math.floor(item.duration / 60)}:${String(item.duration % 60).padStart(2, '0')}` : '0:45'}
                                        </div>
                                      </div>
                                    ) : (
                                      <img
                                        src={item.thumbnailUrl || item.url}
                                        alt={item.title}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                        onLoad={(e) => {
                                          const nw = e.currentTarget.naturalWidth;
                                          const nh = e.currentTarget.naturalHeight;
                                          if (nw && nh && nh > 0) {
                                            const cardEl = e.currentTarget.closest('.gallery-media-card') as HTMLElement | null;
                                            if (cardEl) {
                                              cardEl.style.aspectRatio = `${nw / nh}`;
                                            }
                                          }
                                        }}
                                      />
                                    )}

                                    {/* Top-Right Favorite / Action icons */}
                                    <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleFavorite(item);
                                        }}
                                        className={`p-1 rounded-full backdrop-blur-md transition-all cursor-pointer ${
                                          item.isFavorite
                                            ? 'bg-amber-400 text-black shadow-md opacity-100'
                                            : 'bg-black/50 text-white/80 hover:text-white opacity-0 group-hover:opacity-100 hover:bg-black/70'
                                        }`}
                                        title={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                                      >
                                        <Heart className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-current' : ''}`} />
                                      </button>

                                      {!isSelectMode && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteItem(item);
                                          }}
                                          className="p-1 rounded-full bg-black/50 hover:bg-rose-600 text-white/80 hover:text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-md"
                                          title="Delete item"
                                        >
                                          <FluentDeleteIcon className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>

                                    {/* Subtle bottom gradient info overlay */}
                                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between text-white pointer-events-none">
                                      <span className="text-[11px] font-medium truncate max-w-[85%]">{item.title}</span>
                                      {item.dimensions && (
                                        <span className="text-[9px] text-neutral-300 font-mono">
                                          {item.dimensions.width}×{item.dimensions.height}
                                        </span>
                                      )}
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </AnimatePresence>
                          </div>
                          )}
                        </div>
                      );
                    })()}
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* File context menu */}
      <AnimatePresence>
        {contextMenu && (
          <GalleryContextMenu
            key={contextMenu.item.id + contextMenu.x + contextMenu.y}
            x={contextMenu.x}
            y={contextMenu.y}
            isFavorite={!!contextMenu.item.isFavorite}
            onAction={handleContextAction}
            onClose={closeContextMenu}
          />
        )}
      </AnimatePresence>

      <PromptDialog
        isOpen={!!renameTarget}
        title={renameTarget?.kind === 'folder' ? 'Rename folder' : 'Rename'}
        label="Name"
        initialValue={renameTarget?.name}
        confirmLabel="Rename"
        onConfirm={handleRenameConfirm}
        onClose={() => setRenameTarget(null)}
      />

      <PromptDialog
        isOpen={isNewFolderOpen}
        title="Create a new folder"
        label="Enter a name for this folder"
        placeholder="Enter a name for this folder"
        initialValue=""
        confirmLabel="Create"
        maxWidthClass="max-w-[340px]"
        onConfirm={handleCreateFolder}
        onClose={() => setIsNewFolderOpen(false)}
      />

      <MoveToFolderDialog
        isOpen={!!moveTargetIds && !isNewFolderOpen}
        folders={folders}
        currentFolderId={
          moveTargetIds?.length === 1 ? items.find((it) => it.id === moveTargetIds[0])?.folderId ?? null : undefined
        }
        onMove={handleMove}
        onCreateFolder={() => setIsNewFolderOpen(true)}
        onClose={() => setMoveTargetIds(null)}
      />

      {/* Mobile App Dialog */}
      <AnimatePresence>
        {isMobileAppModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
            <motion.div
              variants={modalBackdropVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={() => setIsMobileAppModalOpen(false)}
              className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-xs"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              variants={modalDialogVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="fluent-modal-dialog relative z-10 w-full max-w-md bg-[#ffffff] dark:bg-[#202020] text-[#111827] dark:text-white rounded-xl shadow-2xl border border-black/10 dark:border-white/10 p-6 select-none"
            >
              <button
                type="button"
                onClick={() => setIsMobileAppModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#7738d8] flex items-center justify-center shrink-0 shadow-md">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                    <path d="M12 18h.01" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#111827] dark:text-white">
                    Back up phone photos
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Sync and view your memories on iOS & Android
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs sm:text-[13px] text-neutral-600 dark:text-neutral-300 bg-black/5 dark:bg-white/5 p-4 rounded-lg border border-black/5 dark:border-white/5">
                <p>
                  1. Open this website on your mobile device browser (Safari or Chrome).
                </p>
                <p>
                  2. Tap <strong>Share</strong> or <strong>Options</strong> and select <strong>&quot;Add to Home Screen&quot;</strong> to install the Progressive Web App (PWA).
                </p>
                <p>
                  3. Tap <strong>&quot;Upload Files&quot;</strong> on your phone to instantly upload photos from your camera roll.
                </p>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsMobileAppModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#0078d4] dark:bg-[#4cc2ff] hover:bg-[#0067c0] dark:hover:bg-[#6bd0ff] text-white dark:text-black text-xs font-semibold cursor-pointer shadow-sm transition-colors"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Welcome Screen / Highlights Modal */}
      <AnimatePresence>
        {isWelcomeScreenOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
            <motion.div
              variants={modalBackdropVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={() => setIsWelcomeScreenOpen(false)}
              className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-xs"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              variants={modalDialogVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="fluent-modal-dialog relative z-10 w-full max-w-2xl bg-[#ffffff] dark:bg-[#202020] text-[#111827] dark:text-white rounded-2xl shadow-2xl border border-black/10 dark:border-white/10 p-6 sm:p-8 select-none max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <button
                type="button"
                onClick={() => setIsWelcomeScreenOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-lg text-neutral-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                title="Close"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center pt-2">
                {/* Heading */}
                <h2 className="text-xl sm:text-2xl font-semibold text-[#111827] dark:text-white tracking-tight mb-2">
                  Explore highlights from your photo collection
                </h2>

                {/* Subheading */}
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 max-w-lg mx-auto mb-6 font-normal leading-relaxed">
                  Add photos to relive special times, revisit favorite places, and celebrate what matters most.
                </p>

                {/* Center Moments Illustration */}
                <div className="relative mb-6 max-w-[420px] mx-auto px-2">
                  <div className="absolute inset-0 bg-radial from-violet-600/20 via-sky-600/10 to-transparent blur-2xl pointer-events-none -z-10" />
                  <img
                    src="https://res.public.onecdn.static.microsoft/files/odsp-web-prod_2026-10-02.003/odbspartan/images/moments_empty_97059def.png"
                    alt="Explore highlights from your photo collection"
                    className="w-full h-auto object-contain drop-shadow-xl select-none pointer-events-none"
                    draggable={false}
                  />
                </div>

                {/* Dual Action Cards Row */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 w-full max-w-lg mx-auto mb-4">
                  {/* 1. Add photos here */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsWelcomeScreenOpen(false);
                      fileInputRef.current?.click();
                    }}
                    className="flex-1 flex items-center gap-3 p-3 rounded-xl text-left bg-black/[0.03] dark:bg-white/[0.05] hover:bg-black/[0.06] dark:hover:bg-white/[0.09] active:scale-98 transition-all cursor-pointer group border border-black/5 dark:border-white/10"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#0078d4] flex items-center justify-center shrink-0 shadow-md">
                      <ImageIcon className="w-5 h-5 text-white stroke-[2]" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[13.5px] font-semibold text-[#111827] dark:text-white group-hover:text-black dark:group-hover:text-white transition-colors">
                        Add photos here
                      </span>
                      <span className="light-mode-black-label text-[12px] text-[#0078d4] dark:text-[#4cc2ff] group-hover:underline">
                        Upload on your device
                      </span>
                    </div>
                  </button>

                  {/* 2. Load samples */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsWelcomeScreenOpen(false);
                      handleRestoreSamples();
                    }}
                    className="flex-1 flex items-center gap-3 p-3 rounded-xl text-left bg-black/[0.03] dark:bg-white/[0.05] hover:bg-black/[0.06] dark:hover:bg-white/[0.09] active:scale-98 transition-all cursor-pointer group border border-black/5 dark:border-white/10"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#7738d8] flex items-center justify-center shrink-0 shadow-md">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[13.5px] font-semibold text-[#111827] dark:text-white group-hover:text-black dark:group-hover:text-white transition-colors">
                        Load samples
                      </span>
                      <span className="text-[12px] text-[#8b5cf6] dark:text-[#b197fc] group-hover:underline">
                        Load pre-installed Gallery items
                      </span>
                    </div>
                  </button>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsWelcomeScreenOpen(false)}
                    className="px-5 py-2 rounded-lg bg-[#0078d4] dark:bg-[#4cc2ff] hover:bg-[#0067c0] dark:hover:bg-[#6bd0ff] text-white dark:text-black text-xs font-semibold cursor-pointer shadow-sm transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Windows 11 Photos Fullscreen Lightbox & Media Viewer */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#16181d]/95 backdrop-blur-3xl flex flex-col justify-between select-none"
            onClick={() => setSelectedItem(null)}
          >
            {/* Top Windows 11 Title & Command Bar */}
            <header 
              className="flex items-center justify-between text-white px-4 py-2.5 bg-black/30 backdrop-blur-md border-b border-white/10 shrink-0 z-20"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Media Title & Metadata */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-[6px] bg-white/10 flex items-center justify-center shrink-0">
                  {selectedItem.type === 'video' ? (
                    <Film className="w-4 h-4 text-[#4cc2ff]" />
                  ) : selectedItem.type === 'audio' ? (
                    <img src={MUSIC_ICON_URL} alt="Music" referrerPolicy="no-referrer" className="w-5 h-5 object-contain" />
                  ) : selectedItem.type === 'document' ? (
                    <img src={getGalleryFileIconSrc(selectedItem).src} alt="Document" referrerPolicy="no-referrer" className="w-5 h-5 object-contain" />
                  ) : (
                    <ImageIcon className="w-4 h-4 text-[#4cc2ff]" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md">{selectedItem.title}</h3>
                  <p className="text-[11px] text-neutral-400">
                    {currentIndex + 1} of {filteredItems.length} • {selectedItem.dateLabel || 'Media'}
                  </p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-1.5">
                {/* Zoom Controls (Images only) */}
                {selectedItem.type === 'image' && (
                  <div className="hidden sm:flex items-center bg-white/10 rounded-lg p-0.5 mr-2">
                    <button
                      type="button"
                      onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                      className="p-1.5 rounded-md hover:bg-white/10 text-neutral-300 hover:text-white cursor-pointer"
                      title="Zoom out"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-[10px] font-mono px-1.5 text-neutral-300 min-w-10 text-center">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                      className="p-1.5 rounded-md hover:bg-white/10 text-neutral-300 hover:text-white cursor-pointer"
                      title="Zoom in"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setRotation((r) => (r + 90) % 360)}
                      className="p-1.5 rounded-md hover:bg-white/10 text-neutral-300 hover:text-white cursor-pointer ml-1"
                      title="Rotate 90°"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Edit in Photopea (Images) */}
                {selectedItem.type === 'image' && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedItem(null);
                      navigate('photopea');
                    }}
                    className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-xs font-medium text-white cursor-pointer transition-colors"
                    title="Edit in Photopea"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#4cc2ff]" />
                    <span>Edit</span>
                  </button>
                )}

                {/* Favorite */}
                <button
                  type="button"
                  onClick={() => handleToggleFavorite(selectedItem)}
                  className={`p-2 rounded-md cursor-pointer transition-colors ${
                    selectedItem.isFavorite ? 'text-amber-400 bg-amber-400/20' : 'text-neutral-400 hover:text-white hover:bg-white/10'
                  }`}
                  title="Favorite"
                >
                  <Heart className={`w-4 h-4 ${selectedItem.isFavorite ? 'fill-current' : ''}`} />
                </button>

                {/* Share */}
                <button
                  type="button"
                  onClick={() => handleShare(selectedItem)}
                  className="p-2 rounded-md text-neutral-400 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
                  title="Share"
                >
                  <Share2 className="w-4 h-4" />
                </button>

                {/* Download */}
                <button
                  type="button"
                  onClick={() => handleSaveToDevice(selectedItem)}
                  className="p-2 rounded-md text-neutral-400 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
                  title="Save to device"
                >
                  <Download className="w-4 h-4" />
                </button>

                {/* Info Panel Toggle */}
                <button
                  type="button"
                  onClick={() => setShowInfoPanel((prev) => !prev)}
                  className={`p-2 rounded-md cursor-pointer transition-colors ${
                    showInfoPanel ? 'bg-[#005fb8] text-white' : 'text-neutral-400 hover:text-white hover:bg-white/10'
                  }`}
                  title="File details"
                >
                  <Info className="w-4 h-4" />
                </button>

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => handleDeleteItem(selectedItem)}
                  className="p-2 rounded-md text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors"
                  title="Delete"
                >
                  <FluentDeleteIcon className="w-4 h-4 text-current" />
                </button>

                {/* Close */}
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="p-2 rounded-md text-neutral-400 hover:text-white hover:bg-white/10 cursor-pointer transition-colors ml-1"
                  title="Close (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </header>

            {/* Modal Body with Left/Right Navigation Arrows */}
            <div 
              className="flex-1 flex items-center justify-center p-4 min-h-0 relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Previous button */}
              {currentIndex > 0 && (
                <button
                  type="button"
                  onClick={handlePrevMedia}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md border border-white/10 shadow-2xl transition-all cursor-pointer"
                  title="Previous item (Left Arrow)"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              {/* Next button */}
              {currentIndex < filteredItems.length - 1 && (
                <button
                  type="button"
                  onClick={handleNextMedia}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md border border-white/10 shadow-2xl transition-all cursor-pointer"
                  title="Next item (Right Arrow)"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}

              {/* Media Display */}
              <div className="w-full h-full flex items-center justify-center p-2">
                {selectedItem.type === 'video' ? (
                  <video
                    src={selectedItem.url}
                    controls
                    autoPlay
                    className="max-h-[72vh] max-w-[85vw] rounded-xl shadow-2xl object-contain bg-black"
                  />
                ) : selectedItem.type === 'audio' ? (
                  <div className="w-full max-w-md p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl flex flex-col items-center text-center shadow-2xl">
                    <div className="w-24 h-24 flex items-center justify-center mb-4 bg-transparent">
                      <img
                        src={MUSIC_ICON_URL}
                        alt="Music"
                        referrerPolicy="no-referrer"
                        className="w-20 h-20 object-contain filter drop-shadow-md"
                      />
                    </div>
                    <h4 className="text-lg font-bold text-white mb-1">{selectedItem.title}</h4>
                    <p className="text-xs text-neutral-400 mb-6">{selectedItem.description || 'Audio track'}</p>
                    <audio ref={audioRef} src={selectedItem.url} controls className="w-full" autoPlay />
                  </div>
                ) : selectedItem.type === 'document' ? (
                  selectedItem.mimeType === 'application/x-sticky-note' && (selectedItem.thumbnailUrl || selectedItem.url) ? (
                    <div className="max-w-md w-full p-2 flex flex-col items-center">
                      <img
                        src={selectedItem.thumbnailUrl || selectedItem.url}
                        alt={selectedItem.title}
                        className="max-h-[70vh] w-auto rounded-2xl shadow-2xl border border-white/20 object-contain"
                      />
                      <div className="mt-4 flex items-center gap-3">
                        <a
                          href={selectedItem.url}
                          download={`${selectedItem.title}.svg`}
                          className="px-4 py-2 rounded-lg bg-[#005fb8] dark:bg-[#4cc2ff] text-white dark:text-black font-semibold text-xs sm:text-sm flex items-center gap-2 hover:opacity-90 cursor-pointer shadow-md"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download Sticky Note</span>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full max-w-md p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl flex flex-col items-center text-center shadow-2xl">
                      <div className="w-20 h-20 flex items-center justify-center mb-4 bg-transparent">
                        <img
                          src={getGalleryFileIconSrc(selectedItem).src}
                          alt={getGalleryFileIconSrc(selectedItem).alt}
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 object-contain filter drop-shadow-md"
                        />
                      </div>
                      <h4 className="text-lg font-bold text-white mb-2">{selectedItem.title}</h4>
                      <p className="text-xs text-neutral-400 mb-6">{selectedItem.description || 'Stored Office document'}</p>
                      <a
                        href={selectedItem.url}
                        download={selectedItem.title}
                        className="px-5 py-2.5 rounded-lg bg-[#005fb8] dark:bg-[#4cc2ff] text-white dark:text-black font-semibold text-sm flex items-center gap-2 hover:opacity-90 cursor-pointer shadow-md"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download {getDocumentDetails(selectedItem).badge} File</span>
                      </a>
                    </div>
                  )
                ) : (
                  <motion.img
                    src={selectedItem.url}
                    alt={selectedItem.title}
                    animate={{ scale: zoomLevel, rotate: rotation }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="max-h-[72vh] max-w-[85vw] object-contain rounded-lg shadow-2xl transition-all"
                  />
                )}
              </div>

              {/* Side Info Panel */}
              <AnimatePresence>
                {showInfoPanel && (
                  <motion.div
                    initial={{ x: 300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 300, opacity: 0 }}
                    className="absolute right-0 top-0 bottom-0 w-80 bg-[#1e2025]/95 backdrop-blur-2xl border-l border-white/10 p-5 overflow-y-auto text-white z-40 text-xs space-y-4 shadow-2xl"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <h4 className="font-bold text-sm">File details</h4>
                      <button
                        type="button"
                        onClick={() => setShowInfoPanel(false)}
                        className="p-1 rounded-md text-neutral-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <p className="text-neutral-400 text-[11px] mb-1">File name</p>
                      <p className="font-semibold text-neutral-100 break-words">{selectedItem.title}</p>
                    </div>

                    <div>
                      <p className="text-neutral-400 text-[11px] mb-1">Date added</p>
                      <p className="font-medium text-neutral-200">
                        {new Date(selectedItem.dateAdded).toLocaleString()}
                      </p>
                    </div>

                    {selectedItem.dimensions && (
                      <div>
                        <p className="text-neutral-400 text-[11px] mb-1">Dimensions</p>
                        <p className="font-medium text-neutral-200">
                          {selectedItem.dimensions.width} × {selectedItem.dimensions.height} px
                        </p>
                      </div>
                    )}

                    {selectedItem.size && (
                      <div>
                        <p className="text-neutral-400 text-[11px] mb-1">File size</p>
                        <p className="font-medium text-neutral-200">
                          {(selectedItem.size / (1024 * 1024)).toFixed(2)} MB ({(selectedItem.size / 1024).toFixed(0)} KB)
                        </p>
                      </div>
                    )}

                    {selectedItem.mimeType && (
                      <div>
                        <p className="text-neutral-400 text-[11px] mb-1">Type</p>
                        <p className="font-medium text-neutral-200 font-mono text-[11px]">{selectedItem.mimeType}</p>
                      </div>
                    )}

                    {selectedItem.tags && selectedItem.tags.length > 0 && (
                      <div>
                        <p className="text-neutral-400 text-[11px] mb-1.5">Tags</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedItem.tags.map((t) => (
                            <span key={t} className="px-2 py-0.5 rounded-full bg-white/10 text-[10px]">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Filmstrip Carousel */}
            <div 
              className="px-4 py-2 bg-black/40 backdrop-blur-md border-t border-white/10 shrink-0 flex items-center justify-center gap-2 overflow-x-auto no-scrollbar z-20"
              onClick={(e) => e.stopPropagation()}
            >
              {filteredItems.slice(Math.max(0, currentIndex - 5), currentIndex + 6).map((it) => {
                const isCurrent = it.id === selectedItem.id;
                return (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => {
                        setSelectedItem(it);
                        setZoomLevel(1);
                        setRotation(0);
                      }}
                      className={`gallery-media-card gallery-lightbox-thumb w-12 h-12 rounded-[6px] overflow-hidden shrink-0 transition-all cursor-pointer border ${
                      isCurrent
                        ? 'ring-2 ring-[#4cc2ff] border-white opacity-100 shadow-md'
                        : 'border-white/20 opacity-60 hover:opacity-100'
                    }`}
                  >
                    {it.type === 'image' ? (
                      <img src={it.thumbnailUrl || it.url} alt={it.title} className="w-full h-full object-cover" />
                    ) : it.type === 'video' ? (
                      <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-white">
                        <Play className="w-4 h-4 fill-current" />
                      </div>
                    ) : (
                      <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-white text-[9px] font-bold">
                        DOC
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Tooltip for Gallery Toolbar (matching sidebar tooltip styling) */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {galleryTooltip && (
            <motion.div
              key="gallery-toolbar-tooltip"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.05, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                top: `${galleryTooltip.top}px`,
                left: `${galleryTooltip.left}px`,
                transform: 'translate(-50%, 0)',
                backgroundColor: isLightMode ? 'rgba(255, 255, 255, 0.50)' : 'rgba(24, 24, 28, 0.50)',
                backdropFilter: 'blur(16px) saturate(140%)',
                WebkitBackdropFilter: 'blur(16px) saturate(140%)',
              }}
              className="z-[99999] px-3 py-1.5 min-h-[30px] flex items-center rounded-[6px] text-[#111827] dark:text-white text-xs font-medium shadow-[0_4px_20px_rgba(0,0,0,0.18)] border-0 outline-none pointer-events-none whitespace-nowrap select-none"
            >
              {galleryTooltip.label}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
