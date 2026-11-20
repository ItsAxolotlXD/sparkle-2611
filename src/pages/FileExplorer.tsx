import React, { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback, useContext } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, Reorder } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  Scissors,
  Copy,
  ClipboardPaste,
  Pencil,
  Share2,
  Trash2,
  ArrowUpDown,
  LayoutGrid,
  List,
  AlignJustify,
  PanelRight,
  FolderPlus,
  FileText,
  FileCode2,
  StickyNote,
  Upload,
  Home,
  Monitor,
  Image as ImageIcon,
  Film,
  Music,
  CheckCircle2,
  Clock,
  ExternalLink,
  X,
  Info,
  Pin,
  Menu,
  Check,
  Save,
  Eye,
  MoreHorizontal,
  Folder,
  SlidersHorizontal,
  Star,
  Download,
  FileArchive,
} from 'lucide-react';
import { FILE_EXPLORER_ICON_URL, Fluent3DSettingsIcon } from '../components/Fluent3DIcons';
import { FluentSearchIcon } from '../components/FluentIcons';
import { WindowTitleBarPortalContext } from '../components/WindowFrame';
import { flyoutPanelClassName, flyoutPanelStyle, contextMenuMotionProps } from '../components/FlyoutDropdown';
import { modalDialogVariants, modalBackdropVariants } from '../utils/animations';
import { showAppToast } from '../utils/toast';
import { useSettings } from '../hooks/useSettings';
import { useNotes } from '../context/NotesContext';
import { galleryDB, GalleryMediaItem, getMediaDimensions } from '../services/galleryStorage';

interface FileExplorerProps {
  navigate?: (route: string, state?: any) => void;
}

export type ExplorerItemKind =
  | 'folder'
  | 'drive'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'word'
  | 'excel'
  | 'ppt'
  | 'pdf'
  | 'html'
  | 'note'
  | 'text'
  | 'code'
  | 'archive'
  | 'file'
  | 'app';

export interface ExplorerEntry {
  id: string;
  parentId: string;
  name: string;
  kind: ExplorerItemKind;
  sizeBytes?: number;
  modifiedAt: number;
  dateLabel?: string;
  locationLabel: string;
  pathLabel: string;
  status?: 'synced' | 'cloud' | 'local';
  isFavorite?: boolean;
  thumbnailUrl?: string;
  mediaUrl?: string;
  mimeType?: string;
  fileExtension?: string;
  isBinary?: boolean;
  dimensions?: { width: number; height: number };
  textContent?: string;
  targetRoute?: string;
  targetRouteState?: any;
  linkedSource?: 'custom' | 'gallery' | 'notes' | 'html-writer' | 'system';
  linkedId?: string;
  driveUsedGb?: number;
  driveTotalGb?: number;
  driveLetter?: string;
  targetDirId?: string;
  isImportedFromDevice?: boolean;
}

interface ExplorerTab {
  id: string;
  history: string[];
  historyIndex: number;
}

type SortField = 'name' | 'modifiedAt' | 'kind' | 'sizeBytes';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'details' | 'tiles' | 'compact';

const CUSTOM_FS_STORAGE_KEY = 'sparkle_file_explorer_v1';
const FAVORITES_STORAGE_KEY = 'sparkle_file_explorer_favs_v1';
const HIDDEN_SYSTEM_IDS_KEY = 'sparkle_file_explorer_hidden_v1';
const EXPLORER_PREFS_STORAGE_KEY = 'sparkle_file_explorer_prefs_v1';
const HTML_WRITER_STORAGE_KEY = 'sparkle_html_writer_files_v1';
const HTML_WRITER_ACTIVE_KEY = 'sparkle_html_writer_active_id_v1';

interface ExplorerPreferences {
  defaultDir: 'dir-home' | 'dir-this-pc';
  defaultViewMode: ViewMode;
  showDetailsByDefault: boolean;
  showFileExtensions: boolean;
  compactSpacing: boolean;
  doubleClickToOpen: boolean;
  showStatusBadges: boolean;
}

const DEFAULT_EXPLORER_PREFS: ExplorerPreferences = {
  defaultDir: 'dir-home',
  defaultViewMode: 'details',
  showDetailsByDefault: true,
  showFileExtensions: true,
  compactSpacing: false,
  doubleClickToOpen: true,
  showStatusBadges: true,
};

function loadExplorerPrefs(): ExplorerPreferences {
  try {
    const raw = localStorage.getItem(EXPLORER_PREFS_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_EXPLORER_PREFS, ...JSON.parse(raw) };
    }
  } catch {}
  return DEFAULT_EXPLORER_PREFS;
}

function saveExplorerPrefs(prefs: ExplorerPreferences) {
  try {
    localStorage.setItem(EXPLORER_PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {}
}

interface DirectoryMeta {
  id: string;
  name: string;
  parentId: string | null;
  pathLabel: string;
  icon: 'home' | 'pc' | 'gallery' | 'network' | 'desktop' | 'images' | 'videos' | 'downloads' | 'music' | 'documents' | 'imported' | 'personal' | 'cloud' | 'drive' | 'folder' | 'settings';
}

const CORE_DIRECTORIES: Record<string, DirectoryMeta> = {
  'dir-home': { id: 'dir-home', name: 'Home', parentId: null, pathLabel: 'Home', icon: 'home' },
  'dir-this-pc': { id: 'dir-this-pc', name: 'This PC', parentId: 'dir-home', pathLabel: 'This PC', icon: 'pc' },
  'dir-gallery': { id: 'dir-gallery', name: 'Gallery', parentId: 'dir-home', pathLabel: 'Gallery', icon: 'gallery' },
  'dir-network': { id: 'dir-network', name: 'Network', parentId: 'dir-home', pathLabel: 'Network', icon: 'network' },
  'dir-desktop': { id: 'dir-desktop', name: 'Desktop', parentId: 'dir-this-pc', pathLabel: 'C:\\Users\\Sparkle\\Desktop', icon: 'desktop' },
  'dir-pictures': { id: 'dir-pictures', name: 'Images', parentId: 'dir-this-pc', pathLabel: 'C:\\Users\\Sparkle\\Pictures', icon: 'images' },
  'dir-videos': { id: 'dir-videos', name: 'Videos', parentId: 'dir-this-pc', pathLabel: 'C:\\Users\\Sparkle\\Videos', icon: 'videos' },
  'dir-downloads': { id: 'dir-downloads', name: 'Downloads', parentId: 'dir-this-pc', pathLabel: 'C:\\Users\\Sparkle\\Downloads', icon: 'downloads' },
  'dir-music': { id: 'dir-music', name: 'Music', parentId: 'dir-this-pc', pathLabel: 'C:\\Users\\Sparkle\\Music', icon: 'music' },
  'dir-documents': { id: 'dir-documents', name: 'Documents', parentId: 'dir-this-pc', pathLabel: 'C:\\Users\\Sparkle\\Documents', icon: 'documents' },
  'dir-imported': { id: 'dir-imported', name: 'Imported from device', parentId: 'dir-home', pathLabel: 'Imported from device', icon: 'imported' },
  'dir-personal': { id: 'dir-personal', name: 'Personal folder', parentId: 'dir-this-pc', pathLabel: 'C:\\Users\\Sparkle', icon: 'personal' },
  'dir-cloud': { id: 'dir-cloud', name: 'Sparkle - Personal', parentId: 'dir-home', pathLabel: 'Sparkle Cloud\\Personal', icon: 'cloud' },
  'dir-drive-c': { id: 'dir-drive-c', name: 'Local Disk (C:)', parentId: 'dir-this-pc', pathLabel: 'C:\\', icon: 'drive' },
  'dir-drive-d': { id: 'dir-drive-d', name: 'Data (D:)', parentId: 'dir-this-pc', pathLabel: 'D:\\', icon: 'drive' },
  'dir-settings': { id: 'dir-settings', name: 'Settings', parentId: 'dir-home', pathLabel: 'Settings', icon: 'settings' },
};

const SEEDED_SYSTEM_ENTRIES: ExplorerEntry[] = [
  // Favorites / Documents / Office-style showcase items
  {
    id: 'sys-doc-ui-trends',
    parentId: 'dir-documents',
    name: 'UI Trends 2026.docx',
    kind: 'word',
    sizeBytes: 342000,
    modifiedAt: Date.now() - 1000 * 60 * 35,
    locationLabel: 'Documents',
    pathLabel: 'C:\\Users\\Sparkle\\Documents\\UI Trends 2026.docx',
    status: 'synced',
    isFavorite: true,
    linkedSource: 'system',
    textContent: 'WinUI 3 & Fluent 2 Design Language Notes\n\n- Layered Mica & Acrylic translucency\n- Crisp 1px hairline separation\n- Rounded 8px content surfaces and 4-6px controls\n- Consistent 3D Fluent iconography across desktop surfaces.',
  },
  {
    id: 'sys-doc-reports-july',
    parentId: 'dir-documents',
    name: 'Reports July.xlsx',
    kind: 'excel',
    sizeBytes: 218000,
    modifiedAt: Date.now() - 1000 * 60 * 90,
    locationLabel: 'Documents',
    pathLabel: 'C:\\Users\\Sparkle\\Documents\\Reports July.xlsx',
    status: 'synced',
    isFavorite: true,
    linkedSource: 'system',
    textContent: 'Quarter | Active Users | Retention | Performance\nQ1      | 12,480       | 91.2%     | 99.9%\nQ2      | 18,920       | 94.5%     | 99.95%\nQ3      | 24,310       | 96.1%     | 99.98%',
  },
  {
    id: 'sys-doc-history-ux',
    parentId: 'dir-documents',
    name: 'History of UX.pptx',
    kind: 'ppt',
    sizeBytes: 4820000,
    modifiedAt: Date.now() - 1000 * 60 * 140,
    locationLabel: 'Documents',
    pathLabel: 'C:\\Users\\Sparkle\\Documents\\History of UX.pptx',
    status: 'synced',
    isFavorite: true,
    linkedSource: 'system',
    textContent: 'Presentation Outline: Evolution of Desktop Interfaces\n\n1. Classic Desktop Metaphor\n2. Aero Glass & Depth\n3. Flat Minimalism\n4. Fluent Design & Mica Material (Build 26170)',
  },
  // Downloads
  {
    id: 'sys-dl-wallpaper-bloom',
    parentId: 'dir-downloads',
    name: 'Waves Ocean Light.png',
    kind: 'image',
    sizeBytes: 685000,
    modifiedAt: Date.now() - 1000 * 60 * 15,
    locationLabel: 'Downloads',
    pathLabel: 'C:\\Users\\Sparkle\\Downloads\\Waves Ocean Light.png',
    status: 'synced',
    thumbnailUrl: '/assets/aistudio/WIP_Light_184e3e28.png',
    mediaUrl: '/assets/aistudio/WIP_Light_184e3e28.png',
    mimeType: 'image/png',
    dimensions: { width: 1400, height: 900 },
    linkedSource: 'system',
  },
  {
    id: 'sys-dl-school-project',
    parentId: 'dir-downloads',
    name: 'School project',
    kind: 'folder',
    modifiedAt: Date.now() - 1000 * 60 * 180,
    locationLabel: 'Downloads',
    pathLabel: 'C:\\Users\\Sparkle\\Downloads\\School project',
    status: 'cloud',
    targetDirId: 'dir-sub-school',
    linkedSource: 'system',
  },
  {
    id: 'sys-dl-travel-budget',
    parentId: 'dir-downloads',
    name: 'Travel budget.xlsx',
    kind: 'excel',
    sizeBytes: 158000,
    modifiedAt: Date.now() - 1000 * 60 * 240,
    locationLabel: 'Downloads',
    pathLabel: 'C:\\Users\\Sparkle\\Downloads\\Travel budget.xlsx',
    status: 'synced',
    linkedSource: 'system',
    textContent: 'Destination | Flights | Hotel | Activities | Total\nHa Long     | $180    | $240  | $150       | $570\nDa Nang     | $210    | $290  | $190       | $690',
  },
  {
    id: 'sys-dl-inspiration',
    parentId: 'dir-downloads',
    name: 'Inspiration',
    kind: 'folder',
    modifiedAt: Date.now() - 1000 * 60 * 320,
    locationLabel: 'Downloads',
    pathLabel: 'C:\\Users\\Sparkle\\Downloads\\Inspiration',
    status: 'synced',
    targetDirId: 'dir-sub-inspiration',
    linkedSource: 'system',
  },
  {
    id: 'sys-dl-2026-photos',
    parentId: 'dir-downloads',
    name: '2026 Photos',
    kind: 'folder',
    modifiedAt: Date.now() - 1000 * 60 * 480,
    locationLabel: 'Downloads',
    pathLabel: 'C:\\Users\\Sparkle\\Downloads\\2026 Photos',
    status: 'synced',
    targetDirId: 'dir-pictures',
    linkedSource: 'system',
  },
  // Subfolder items
  {
    id: 'sys-sub-school-notes',
    parentId: 'dir-sub-school',
    name: 'Research Outline.txt',
    kind: 'text',
    sizeBytes: 18400,
    modifiedAt: Date.now() - 1000 * 60 * 200,
    locationLabel: 'School project',
    pathLabel: 'C:\\Users\\Sparkle\\Downloads\\School project\\Research Outline.txt',
    status: 'synced',
    linkedSource: 'system',
    textContent: 'Research Paper Outline\n- Abstract\n- Methodology\n- Fluent UI Evaluation Metrics\n- Conclusion',
  },
  {
    id: 'sys-sub-insp-wave',
    parentId: 'dir-sub-inspiration',
    name: 'Waves Lavender Light.png',
    kind: 'image',
    sizeBytes: 1240000,
    modifiedAt: Date.now() - 1000 * 60 * 310,
    locationLabel: 'Inspiration',
    pathLabel: 'C:\\Users\\Sparkle\\Downloads\\Inspiration\\Waves Lavender Light.png',
    status: 'synced',
    thumbnailUrl: '/assets/aistudio/01-Purple_LM-4K_e12d77d6.png',
    mediaUrl: '/assets/aistudio/01-Purple_LM-4K_e12d77d6.png',
    mimeType: 'image/png',
    dimensions: { width: 1920, height: 1080 },
    linkedSource: 'system',
  },
  // Desktop shortcuts & workspace items
  {
    id: 'sys-desk-welcome',
    parentId: 'dir-desktop',
    name: 'Welcome to Build 26170.txt',
    kind: 'text',
    sizeBytes: 4200,
    modifiedAt: Date.now() - 1000 * 60 * 45,
    locationLabel: 'Desktop',
    pathLabel: 'C:\\Users\\Sparkle\\Desktop\\Welcome to Build 26170.txt',
    status: 'local',
    linkedSource: 'system',
    textContent: 'Sparkle OS — Insider Preview Build 26170\n\nIncludes:\n- WinUI 3 File Explorer with Tabs & Details Pane\n- Mica Widgets Dashboard\n- HTML Writer Live Code Editor\n- PC Settings & Quick Controls',
  },
  {
    id: 'sys-desk-pc-settings',
    parentId: 'dir-desktop',
    name: 'PC Settings',
    kind: 'app',
    sizeBytes: 128000,
    modifiedAt: Date.now() - 1000 * 60 * 120,
    locationLabel: 'Desktop',
    pathLabel: 'C:\\Users\\Sparkle\\Desktop\\PC Settings',
    status: 'local',
    targetRoute: '/pc-settings',
    linkedSource: 'system',
  },
  {
    id: 'sys-desk-html-writer',
    parentId: 'dir-desktop',
    name: 'HTML Writer Studio',
    kind: 'app',
    sizeBytes: 256000,
    modifiedAt: Date.now() - 1000 * 60 * 160,
    locationLabel: 'Desktop',
    pathLabel: 'C:\\Users\\Sparkle\\Desktop\\HTML Writer Studio',
    status: 'local',
    targetRoute: '/html-writer',
    linkedSource: 'system',
  },
  // Personal folder links
  {
    id: 'sys-pers-desktop',
    parentId: 'dir-personal',
    name: 'Desktop',
    kind: 'folder',
    modifiedAt: Date.now() - 1000 * 60 * 60,
    locationLabel: 'Sparkle',
    pathLabel: 'C:\\Users\\Sparkle\\Desktop',
    status: 'synced',
    targetDirId: 'dir-desktop',
    linkedSource: 'system',
  },
  {
    id: 'sys-pers-docs',
    parentId: 'dir-personal',
    name: 'Documents',
    kind: 'folder',
    modifiedAt: Date.now() - 1000 * 60 * 60,
    locationLabel: 'Sparkle',
    pathLabel: 'C:\\Users\\Sparkle\\Documents',
    status: 'synced',
    targetDirId: 'dir-documents',
    linkedSource: 'system',
  },
  {
    id: 'sys-pers-dl',
    parentId: 'dir-personal',
    name: 'Downloads',
    kind: 'folder',
    modifiedAt: Date.now() - 1000 * 60 * 60,
    locationLabel: 'Sparkle',
    pathLabel: 'C:\\Users\\Sparkle\\Downloads',
    status: 'synced',
    targetDirId: 'dir-downloads',
    linkedSource: 'system',
  },
  {
    id: 'sys-pers-pics',
    parentId: 'dir-personal',
    name: 'Pictures',
    kind: 'folder',
    modifiedAt: Date.now() - 1000 * 60 * 60,
    locationLabel: 'Sparkle',
    pathLabel: 'C:\\Users\\Sparkle\\Pictures',
    status: 'synced',
    targetDirId: 'dir-pictures',
    linkedSource: 'system',
  },
  {
    id: 'sys-pers-vid',
    parentId: 'dir-personal',
    name: 'Videos',
    kind: 'folder',
    modifiedAt: Date.now() - 1000 * 60 * 60,
    locationLabel: 'Sparkle',
    pathLabel: 'C:\\Users\\Sparkle\\Videos',
    status: 'synced',
    targetDirId: 'dir-videos',
    linkedSource: 'system',
  },
  {
    id: 'sys-pers-mus',
    parentId: 'dir-personal',
    name: 'Music',
    kind: 'folder',
    modifiedAt: Date.now() - 1000 * 60 * 60,
    locationLabel: 'Sparkle',
    pathLabel: 'C:\\Users\\Sparkle\\Music',
    status: 'synced',
    targetDirId: 'dir-music',
    linkedSource: 'system',
  },
  {
    id: 'sys-pers-imported',
    parentId: 'dir-personal',
    name: 'Imported from device',
    kind: 'folder',
    modifiedAt: Date.now() - 1000 * 60 * 30,
    locationLabel: 'Sparkle',
    pathLabel: 'Imported from device',
    status: 'local',
    targetDirId: 'dir-imported',
    linkedSource: 'system',
  },
  // Cloud Storage items
  {
    id: 'sys-cloud-vault',
    parentId: 'dir-cloud',
    name: 'Cloud Backups',
    kind: 'folder',
    modifiedAt: Date.now() - 1000 * 60 * 210,
    locationLabel: 'Sparkle - Personal',
    pathLabel: 'Sparkle Cloud\\Personal\\Cloud Backups',
    status: 'cloud',
    targetDirId: 'dir-sub-inspiration',
    linkedSource: 'system',
  },
  {
    id: 'sys-cloud-design-spec',
    parentId: 'dir-cloud',
    name: 'Designs for printing.pdf',
    kind: 'pdf',
    sizeBytes: 1450000,
    modifiedAt: Date.now() - 1000 * 60 * 280,
    locationLabel: 'Sparkle - Personal',
    pathLabel: 'Sparkle Cloud\\Personal\\Designs for printing.pdf',
    status: 'cloud',
    linkedSource: 'system',
  },
  // Local Disk (C:) subfolders
  {
    id: 'sys-c-users',
    parentId: 'dir-drive-c',
    name: 'Users',
    kind: 'folder',
    modifiedAt: Date.now() - 1000 * 60 * 500,
    locationLabel: 'Local Disk (C:)',
    pathLabel: 'C:\\Users',
    status: 'local',
    targetDirId: 'dir-personal',
    linkedSource: 'system',
  },
  {
    id: 'sys-c-program-files',
    parentId: 'dir-drive-c',
    name: 'Program Files',
    kind: 'folder',
    modifiedAt: Date.now() - 1000 * 60 * 600,
    locationLabel: 'Local Disk (C:)',
    pathLabel: 'C:\\Program Files',
    status: 'local',
    targetDirId: 'dir-desktop',
    linkedSource: 'system',
  },
  {
    id: 'sys-c-windows',
    parentId: 'dir-drive-c',
    name: 'Sparkle',
    kind: 'folder',
    modifiedAt: Date.now() - 1000 * 60 * 700,
    locationLabel: 'Local Disk (C:)',
    pathLabel: 'C:\\Sparkle',
    status: 'local',
    targetDirId: 'dir-drive-c-win',
    linkedSource: 'system',
  },
  {
    id: 'sys-c-win-sys32',
    parentId: 'dir-drive-c-win',
    name: 'System32',
    kind: 'folder',
    modifiedAt: Date.now() - 1000 * 60 * 700,
    locationLabel: 'Sparkle',
    pathLabel: 'C:\\Sparkle\\System32',
    status: 'local',
    targetDirId: 'dir-drive-c-win',
    linkedSource: 'system',
  },
  {
    id: 'sys-c-win-build',
    parentId: 'dir-drive-c-win',
    name: 'build_26170_manifest.txt',
    kind: 'text',
    sizeBytes: 9420,
    modifiedAt: Date.now() - 1000 * 60 * 700,
    locationLabel: 'Sparkle',
    pathLabel: 'C:\\Sparkle\\build_26170_manifest.txt',
    status: 'local',
    linkedSource: 'system',
    textContent: 'Sparkle 27 (Milestone 1) Insider Preview\nBuild: 26170.ge_release\nShell: Sparkle Desktop Environment\nDesign System: WinUI 3 + Mica',
  },
  // Data (D:) items
  {
    id: 'sys-d-media',
    parentId: 'dir-drive-d',
    name: 'Media Archive',
    kind: 'folder',
    modifiedAt: Date.now() - 1000 * 60 * 350,
    locationLabel: 'Data (D:)',
    pathLabel: 'D:\\Media Archive',
    status: 'local',
    targetDirId: 'dir-gallery',
    linkedSource: 'system',
  },
  {
    id: 'sys-d-projects',
    parentId: 'dir-drive-d',
    name: 'Web Projects',
    kind: 'folder',
    modifiedAt: Date.now() - 1000 * 60 * 400,
    locationLabel: 'Data (D:)',
    pathLabel: 'D:\\Web Projects',
    status: 'local',
    targetDirId: 'dir-documents',
    linkedSource: 'system',
  },
  // Network locations
  {
    id: 'sys-net-workstation',
    parentId: 'dir-network',
    name: 'SPARKLE-WORKSTATION',
    kind: 'folder',
    modifiedAt: Date.now() - 1000 * 60 * 100,
    locationLabel: 'Network',
    pathLabel: '\\\\SPARKLE-WORKSTATION',
    status: 'cloud',
    targetDirId: 'dir-personal',
    linkedSource: 'system',
  },
  {
    id: 'sys-net-nas',
    parentId: 'dir-network',
    name: 'Sparkle Media Server',
    kind: 'folder',
    modifiedAt: Date.now() - 1000 * 60 * 150,
    locationLabel: 'Network',
    pathLabel: '\\\\Sparkle-Media-Server',
    status: 'cloud',
    targetDirId: 'dir-gallery',
    linkedSource: 'system',
  },
];

function formatBytes(bytes?: number): string {
  if (bytes === undefined || bytes === null) return '—';
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDateTime(ts: number): string {
  try {
    const d = new Date(ts);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return 'Today';
  }
}

function getKindLabel(kind: ExplorerItemKind, ext?: string): string {
  switch (kind) {
    case 'folder': return 'File folder';
    case 'drive': return 'Local Disk';
    case 'image': return 'PNG / JPEG Image';
    case 'video': return 'MP4 Video';
    case 'audio': return 'MP3 Audio';
    case 'word': return 'Microsoft Word Document';
    case 'excel': return 'Microsoft Excel Worksheet';
    case 'ppt': return 'PowerPoint Presentation';
    case 'pdf': return 'PDF Document';
    case 'html': return 'HTML Document';
    case 'note': return 'Sparkle Note';
    case 'text': return 'Text Document';
    case 'code': return ext ? `${ext.toUpperCase()} Source File` : 'Source File';
    case 'archive': return ext ? `${ext.toUpperCase()} Archive` : 'Compressed Archive';
    case 'file': return ext ? `${ext.toUpperCase()} File` : 'File';
    case 'app': return 'Sparkle Application';
    default: return ext ? `${ext.toUpperCase()} File` : 'File';
  }
}

const TEXT_EDITABLE_EXTENSIONS = new Set([
  'txt', 'md', 'markdown', 'json', 'csv', 'tsv', 'html', 'htm', 'css', 'scss',
  'js', 'mjs', 'cjs', 'ts', 'tsx', 'jsx', 'xml', 'svg', 'log', 'ini', 'cfg',
  'conf', 'yml', 'yaml', 'py', 'java', 'c', 'cpp', 'h', 'hpp', 'rs', 'go',
  'sh', 'bat', 'ps1', 'sql', 'env', 'toml',
]);

function isTextEditableEntry(entry: ExplorerEntry): boolean {
  if (entry.isBinary) return false;
  if (entry.kind === 'image' || entry.kind === 'video' || entry.kind === 'audio' || entry.kind === 'archive' || entry.kind === 'pdf' || entry.kind === 'app') {
    return false;
  }
  if (entry.kind === 'text' || entry.kind === 'html' || entry.kind === 'note' || entry.kind === 'code') {
    return true;
  }
  if (entry.fileExtension) {
    return TEXT_EDITABLE_EXTENSIONS.has(entry.fileExtension.toLowerCase());
  }
  return Boolean(entry.textContent);
}

const explorerItemSlideUpVariant = {
  hidden: { opacity: 0, y: 68 },
  visible: (_i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.34,
      ease: [0.16, 1, 0.3, 1] as const,
      delay: 0,
    },
  }),
};

// Colorful WinUI 3 Fluent file & folder icons (protected with fluent-3d-icon against light-mode overrides)
const FluentFolder3D: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 32 32" fill="none" className={`fluent-3d-icon ${className} shrink-0`}>
    <defs>
      <linearGradient id="fe_fld_back" x1="3" y1="5" x2="29" y2="26" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
      <linearGradient id="fe_fld_front" x1="3" y1="10" x2="29" y2="27" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
    </defs>
    <path d="M3 8C3 6.34 4.34 5 6 5H11.6C12.4 5 13.15 5.32 13.71 5.88L15.4 7.57C15.77 7.94 16.28 8.15 16.81 8.15H26C27.66 8.15 29 9.49 29 11.15V24C29 25.66 27.66 27 26 27H6C4.34 27 3 25.66 3 24V8Z" fill="url(#fe_fld_back)" />
    <rect x="3" y="10.5" width="26" height="16.5" rx="2.8" fill="url(#fe_fld_front)" />
    <rect x="3" y="10.5" width="26" height="2" rx="1" fill="#FEF08A" opacity="0.65" />
  </svg>
);

const FluentDrive3D: React.FC<{ isWindows?: boolean; className?: string }> = ({ isWindows, className = 'w-8 h-8' }) => (
  <svg viewBox="0 0 36 36" fill="none" className={`fluent-3d-icon ${className} shrink-0`}>
    <defs>
      <linearGradient id="fe_drv_top" x1="4" y1="10" x2="32" y2="24" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#E2E8F0" />
        <stop offset="100%" stopColor="#94A3B8" />
      </linearGradient>
      <linearGradient id="fe_drv_front" x1="4" y1="20" x2="32" y2="29" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#475569" />
        <stop offset="100%" stopColor="#1E293B" />
      </linearGradient>
    </defs>
    <path d="M7.5 11.5C8 10.6 8.9 10 9.9 10H26.1C27.1 10 28 10.6 28.5 11.5L32 19.5H4L7.5 11.5Z" fill="url(#fe_drv_top)" />
    <rect x="4" y="19" width="28" height="9" rx="2.5" fill="url(#fe_drv_front)" />
    <circle cx="27.5" cy="23.5" r="1.6" fill="#38BDF8" />
    <rect x="7" y="22.8" width="12" height="1.5" rx="0.75" fill="#94A3B8" opacity="0.65" />
    {isWindows && (
      <g transform="translate(3, 2)">
        <rect x="0" y="0" width="5.5" height="5.5" rx="0.8" fill="#38BDF8" />
        <rect x="6.5" y="0" width="5.5" height="5.5" rx="0.8" fill="#0284C7" />
        <rect x="0" y="6.5" width="5.5" height="5.5" rx="0.8" fill="#0EA5E9" />
        <rect x="6.5" y="6.5" width="5.5" height="5.5" rx="0.8" fill="#0369A1" />
      </g>
    )}
  </svg>
);

const ExplorerItemIcon: React.FC<{ entry: ExplorerEntry; size?: 'sm' | 'md' | 'lg' }> = ({ entry, size = 'sm' }) => {
  const dim = size === 'lg' ? 'w-11 h-11' : size === 'md' ? 'w-9 h-9' : 'w-5 h-5';

  if (entry.kind === 'folder') {
    return <FluentFolder3D className={dim} />;
  }
  if (entry.kind === 'drive') {
    return <FluentDrive3D isWindows={entry.driveLetter === 'C:'} className={dim} />;
  }
  if (entry.kind === 'image' && entry.thumbnailUrl && size !== 'sm') {
    return (
      <div className={`${dim} rounded-[6px] overflow-hidden border border-black/10 dark:border-white/10 shrink-0 bg-black/10`}>
        <img src={entry.thumbnailUrl} alt={entry.name} className="w-full h-full object-cover" />
      </div>
    );
  }
  if (entry.kind === 'word' || entry.kind === 'excel' || entry.kind === 'ppt' || entry.kind === 'pdf') {
    const cfg =
      entry.kind === 'word'
        ? { bg: 'linear-gradient(135deg,#2563EB,#1D4ED8)', letter: 'W' }
        : entry.kind === 'excel'
        ? { bg: 'linear-gradient(135deg,#16A34A,#15803D)', letter: 'X' }
        : entry.kind === 'ppt'
        ? { bg: 'linear-gradient(135deg,#EA580C,#C2410C)', letter: 'P' }
        : { bg: 'linear-gradient(135deg,#DC2626,#991B1B)', letter: 'PDF' };
    const boxSize = size === 'lg' ? 'w-11 h-11 text-[13px]' : size === 'md' ? 'w-9 h-9 text-[12px]' : 'w-5 h-5 text-[9px]';
    return (
      <div
        className={`fluent-3d-icon ${boxSize} rounded-[5px] shrink-0 flex items-center justify-center font-bold shadow-xs select-none`}
        style={{ background: cfg.bg, color: '#ffffff' }}
      >
        <span style={{ color: '#ffffff' }}>{cfg.letter}</span>
      </div>
    );
  }
  if (entry.kind === 'html') {
    const boxSize = size === 'lg' ? 'w-11 h-11 text-[11px]' : size === 'md' ? 'w-9 h-9 text-[10px]' : 'w-5 h-5 text-[8px]';
    return (
      <div
        className={`fluent-3d-icon ${boxSize} rounded-[5px] shrink-0 flex items-center justify-center font-bold shadow-xs select-none`}
        style={{ background: 'linear-gradient(135deg,#4CC2FF,#0078D4)', color: '#ffffff' }}
      >
        <span style={{ color: '#ffffff' }}>&lt;/&gt;</span>
      </div>
    );
  }
  if (entry.kind === 'note') {
    const boxSize = size === 'lg' ? 'w-11 h-11' : size === 'md' ? 'w-9 h-9' : 'w-5 h-5';
    return (
      <div
        className={`fluent-3d-icon ${boxSize} rounded-[5px] shrink-0 flex items-center justify-center shadow-xs`}
        style={{ background: 'linear-gradient(135deg,#FACC15,#EAB308)', color: '#1F2937' }}
      >
        <StickyNote className={size === 'sm' ? 'w-3 h-3' : 'w-5 h-5'} style={{ color: '#1F2937', stroke: '#1F2937' }} />
      </div>
    );
  }
  if (entry.kind === 'image') {
    const boxSize = size === 'lg' ? 'w-11 h-11' : size === 'md' ? 'w-9 h-9' : 'w-5 h-5';
    return (
      <div
        className={`fluent-3d-icon ${boxSize} rounded-[5px] shrink-0 flex items-center justify-center shadow-xs`}
        style={{ background: 'linear-gradient(135deg,#38BDF8,#0284C7)' }}
      >
        <ImageIcon className={size === 'sm' ? 'w-3 h-3' : 'w-5 h-5'} style={{ color: '#ffffff', stroke: '#ffffff' }} />
      </div>
    );
  }
  if (entry.kind === 'video') {
    const boxSize = size === 'lg' ? 'w-11 h-11' : size === 'md' ? 'w-9 h-9' : 'w-5 h-5';
    return (
      <div
        className={`fluent-3d-icon ${boxSize} rounded-[5px] shrink-0 flex items-center justify-center shadow-xs`}
        style={{ background: 'linear-gradient(135deg,#A855F7,#7E22CE)' }}
      >
        <Film className={size === 'sm' ? 'w-3 h-3' : 'w-5 h-5'} style={{ color: '#ffffff', stroke: '#ffffff' }} />
      </div>
    );
  }
  if (entry.kind === 'audio') {
    const boxSize = size === 'lg' ? 'w-11 h-11' : size === 'md' ? 'w-9 h-9' : 'w-5 h-5';
    return (
      <div
        className={`fluent-3d-icon ${boxSize} rounded-[5px] shrink-0 flex items-center justify-center shadow-xs`}
        style={{ background: 'linear-gradient(135deg,#F43F5E,#BE123C)' }}
      >
        <Music className={size === 'sm' ? 'w-3 h-3' : 'w-5 h-5'} style={{ color: '#ffffff', stroke: '#ffffff' }} />
      </div>
    );
  }
  if (entry.kind === 'app') {
    const boxSize = size === 'lg' ? 'w-11 h-11' : size === 'md' ? 'w-9 h-9' : 'w-5 h-5';
    return (
      <div
        className={`fluent-3d-icon ${boxSize} rounded-[5px] shrink-0 flex items-center justify-center shadow-xs`}
        style={{ background: 'linear-gradient(135deg,#0EA5E9,#0369A1)' }}
      >
        <Monitor className={size === 'sm' ? 'w-3 h-3' : 'w-5 h-5'} style={{ color: '#ffffff', stroke: '#ffffff' }} />
      </div>
    );
  }

  if (entry.kind === 'archive') {
    const boxSize = size === 'lg' ? 'w-11 h-11' : size === 'md' ? 'w-9 h-9' : 'w-5 h-5';
    return (
      <div
        className={`fluent-3d-icon ${boxSize} rounded-[5px] shrink-0 flex items-center justify-center shadow-xs`}
        style={{ background: 'linear-gradient(135deg,#F59E0B,#B45309)' }}
      >
        <FileArchive className={size === 'sm' ? 'w-3 h-3' : 'w-5 h-5'} style={{ color: '#ffffff', stroke: '#ffffff' }} />
      </div>
    );
  }
  if (entry.kind === 'code') {
    const boxSize = size === 'lg' ? 'w-11 h-11 text-[10px]' : size === 'md' ? 'w-9 h-9 text-[9.5px]' : 'w-5 h-5 text-[7.5px]';
    return (
      <div
        className={`fluent-3d-icon ${boxSize} rounded-[5px] shrink-0 flex items-center justify-center font-bold shadow-xs select-none`}
        style={{ background: 'linear-gradient(135deg,#14B8A6,#0F766E)', color: '#ffffff' }}
      >
        <span style={{ color: '#ffffff' }}>{'{ }'}</span>
      </div>
    );
  }
  if (entry.kind === 'file') {
    const extTag = (entry.fileExtension || entry.name.split('.').pop() || 'FILE').slice(0, 4).toUpperCase();
    const boxSize = size === 'lg' ? 'w-11 h-11 text-[10px]' : size === 'md' ? 'w-9 h-9 text-[9px]' : 'w-5 h-5 text-[6.5px]';
    return (
      <div
        className={`fluent-3d-icon ${boxSize} rounded-[5px] shrink-0 flex items-center justify-center font-bold shadow-xs select-none`}
        style={{ background: 'linear-gradient(135deg,#64748B,#334155)', color: '#ffffff' }}
      >
        <span style={{ color: '#ffffff' }}>{extTag}</span>
      </div>
    );
  }

  const boxSize = size === 'lg' ? 'w-11 h-11' : size === 'md' ? 'w-9 h-9' : 'w-5 h-5';
  return (
    <div
      className={`fluent-3d-icon ${boxSize} rounded-[5px] shrink-0 flex items-center justify-center border border-black/15 dark:border-white/15 bg-white dark:bg-[#2c313a]`}
    >
      <FileText className={size === 'sm' ? 'w-3 h-3' : 'w-5 h-5'} />
    </div>
  );
};

// WinUI 3 Toggle Switch matching Widget Board Settings
const ExplorerToggle: React.FC<{ checked: boolean; onChange: () => void; ariaLabel: string }> = ({
  checked,
  onChange,
  ariaLabel,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={ariaLabel}
    onClick={onChange}
    className={`relative inline-flex items-center w-[42px] h-[22px] rounded-full transition-colors cursor-pointer shrink-0 border ${
      checked
        ? 'bg-[#0063B8] dark:bg-[#4CC2FF] border-transparent'
        : 'bg-black/[0.06] dark:bg-white/[0.08] border-black/30 dark:border-white/35'
    }`}
  >
    <span
      className={`inline-block w-[14px] h-[14px] rounded-full transition-transform ${
        checked
          ? 'translate-x-[23px] bg-white dark:bg-[#000000]'
          : 'translate-x-[3px] bg-black/60 dark:bg-white/75'
      }`}
    />
  </button>
);

// Colorful 3D Fluent SVG Icons for File Explorer Navigation Sidebar
const ExplorerSidebar3DIcon: React.FC<{
  kind: DirectoryMeta['icon'];
  className?: string;
}> = ({ kind, className = 'w-[18px] h-[18px]' }) => {
  if (kind === 'settings') {
    return <Fluent3DSettingsIcon className={className} />;
  }
  if (kind === 'home') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={`fluent-3d-icon ${className} shrink-0`}>
        <defs>
          <linearGradient id="fe_sb_home_roof" x1="2" y1="3" x2="22" y2="12" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#60CDFF" />
            <stop offset="100%" stopColor="#0078D4" />
          </linearGradient>
          <linearGradient id="fe_sb_home_wall" x1="4" y1="10" x2="20" y2="21" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0369A1" />
          </linearGradient>
        </defs>
        <path d="M5 11.2L12 5.4L19 11.2V19.5C19 20.33 18.33 21 17.5 21H6.5C5.67 21 5 20.33 5 19.5V11.2Z" fill="url(#fe_sb_home_wall)" />
        <path d="M2.6 11.3C2.1 11.75 2.4 12.5 3.1 12.5H20.9C21.6 12.5 21.9 11.75 21.4 11.3L12.6 3.7C12.25 3.4 11.75 3.4 11.4 3.7L2.6 11.3Z" fill="url(#fe_sb_home_roof)" />
        <rect x="9.5" y="14" width="5" height="7" rx="1.2" fill="#FBBF24" />
      </svg>
    );
  }
  if (kind === 'pc') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={`fluent-3d-icon ${className} shrink-0`}>
        <defs>
          <linearGradient id="fe_sb_pc_scr" x1="2" y1="4" x2="22" y2="17" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#60CDFF" />
            <stop offset="55%" stopColor="#0078D4" />
            <stop offset="100%" stopColor="#004E8C" />
          </linearGradient>
        </defs>
        <path d="M9.5 17H14.5V19.5H16.5C16.78 19.5 17 19.72 17 20C17 20.28 16.78 20.5 16.5 20.5H7.5C7.22 20.5 7 20.28 7 20C7 19.72 7.22 19.5 7.5 19.5H9.5V17Z" fill="#94A3B8" />
        <rect x="2.5" y="4" width="19" height="13.5" rx="2.4" fill="#1E293B" />
        <rect x="3.8" y="5.3" width="16.4" height="10.9" rx="1.4" fill="url(#fe_sb_pc_scr)" />
        <path d="M5 14.5C7.5 11.2 10.5 11.2 13 13.5C15 15.2 17 13.5 19 10.8V14.8C19 15.18 18.68 15.5 18.3 15.5H5.7C5.32 15.5 5 15.18 5 14.8V14.5Z" fill="#BAE6FD" opacity="0.45" />
      </svg>
    );
  }
  if (kind === 'gallery') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={`fluent-3d-icon ${className} shrink-0`}>
        <defs>
          <linearGradient id="fe_sb_gal_bg" x1="4" y1="4" x2="21" y2="20" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
          <linearGradient id="fe_sb_gal_mnt" x1="6" y1="12" x2="21" y2="20" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
        <rect x="3" y="3.5" width="14" height="14" rx="2.6" fill="#A855F7" opacity="0.7" />
        <rect x="6.5" y="6.5" width="14.5" height="14.5" rx="2.8" fill="url(#fe_sb_gal_bg)" />
        <circle cx="11" cy="10.8" r="1.8" fill="#FDE047" />
        <path d="M6.5 18.2L10.8 13.6L14 16.5L16.8 12.8L21 18.2V19C21 20.1 20.1 21 19 21H8.5C7.4 21 6.5 20.1 6.5 19V18.2Z" fill="url(#fe_sb_gal_mnt)" />
      </svg>
    );
  }
  if (kind === 'network') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={`fluent-3d-icon ${className} shrink-0`}>
        <defs>
          <linearGradient id="fe_sb_net" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#60CDFF" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="9" fill="url(#fe_sb_net)" />
        <ellipse cx="12" cy="12" rx="4.2" ry="8.8" stroke="#E0F2FE" strokeWidth="1.2" opacity="0.85" />
        <path d="M3.5 12H20.5" stroke="#E0F2FE" strokeWidth="1.2" opacity="0.85" />
        <path d="M5 7.5H19" stroke="#BAE6FD" strokeWidth="1" opacity="0.65" />
        <path d="M5 16.5H19" stroke="#BAE6FD" strokeWidth="1" opacity="0.65" />
      </svg>
    );
  }
  if (kind === 'desktop') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={`fluent-3d-icon ${className} shrink-0`}>
        <defs>
          <linearGradient id="fe_sb_dsk" x1="2.5" y1="4" x2="21.5" y2="18" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
        </defs>
        <rect x="2.5" y="4.5" width="19" height="14" rx="2.5" fill="url(#fe_sb_dsk)" />
        <rect x="4.5" y="14.5" width="15" height="2" rx="0.8" fill="#E0F2FE" opacity="0.85" />
        <path d="M8.5 19.5H15.5" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === 'images') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={`fluent-3d-icon ${className} shrink-0`}>
        <path d="M2.5 6.5C2.5 5.4 3.4 4.5 4.5 4.5H9L11 6.5H19.5C20.6 6.5 21.5 7.4 21.5 8.5V18C21.5 19.1 20.6 20 19.5 20H4.5C3.4 20 2.5 19.1 2.5 18V6.5Z" fill="#0284C7" />
        <rect x="2.5" y="8" width="19" height="12" rx="2.2" fill="#38BDF8" />
        <circle cx="8.2" cy="11.5" r="1.4" fill="#FEF08A" />
        <path d="M4.5 18.2L9.5 13.6L13.2 16.5L16.2 13.8L19.5 18.2H4.5Z" fill="#0369A1" opacity="0.65" />
      </svg>
    );
  }
  if (kind === 'videos') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={`fluent-3d-icon ${className} shrink-0`}>
        <defs>
          <linearGradient id="fe_sb_vid" x1="3" y1="5" x2="21" y2="20" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#C084FC" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
        <rect x="2.5" y="5" width="19" height="14" rx="3" fill="url(#fe_sb_vid)" />
        <path d="M10 9L15.5 12L10 15V9Z" fill="#FFFFFF" />
      </svg>
    );
  }
  if (kind === 'downloads') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={`fluent-3d-icon ${className} shrink-0`}>
        <defs>
          <linearGradient id="fe_sb_dl" x1="4" y1="3" x2="20" y2="21" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="9" fill="url(#fe_sb_dl)" />
        <path d="M12 7V15M12 15L8.6 11.6M12 15L15.4 11.6" stroke="#FFFFFF" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8.5 17.2H15.5" stroke="#ECFDF5" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === 'music') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={`fluent-3d-icon ${className} shrink-0`}>
        <defs>
          <linearGradient id="fe_sb_mus" x1="3" y1="4" x2="21" y2="20" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FB7185" />
            <stop offset="100%" stopColor="#E11D48" />
          </linearGradient>
        </defs>
        <rect x="3" y="4" width="18" height="16" rx="4" fill="url(#fe_sb_mus)" />
        <path d="M14.5 7.5V14.2C14.5 15.4 13.5 16.3 12.2 16.3C11 16.3 10 15.5 10 14.4C10 13.3 11 12.5 12.2 12.5C12.7 12.5 13.1 12.6 13.4 12.9V9L16.5 8.2V10L14.5 10.5" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12.2" cy="14.4" r="1.7" fill="#FFFFFF" />
      </svg>
    );
  }
  if (kind === 'documents') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={`fluent-3d-icon ${className} shrink-0`}>
        <defs>
          <linearGradient id="fe_sb_doc" x1="4" y1="3" x2="20" y2="21" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
        </defs>
        <path d="M5.5 3.5H14L18.5 8V19C18.5 20.1 17.6 21 16.5 21H5.5C4.4 21 3.5 20.1 3.5 19V5.5C3.5 4.4 4.4 3.5 5.5 3.5Z" fill="url(#fe_sb_doc)" />
        <path d="M14 3.5V8H18.5L14 3.5Z" fill="#FEF9C3" />
        <rect x="6.5" y="10.5" width="8.5" height="1.5" rx="0.75" fill="#78350F" opacity="0.55" />
        <rect x="6.5" y="13.5" width="9" height="1.5" rx="0.75" fill="#78350F" opacity="0.45" />
        <rect x="6.5" y="16.5" width="6" height="1.5" rx="0.75" fill="#78350F" opacity="0.45" />
      </svg>
    );
  }
  if (kind === 'imported') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={`fluent-3d-icon ${className} shrink-0`}>
        <defs>
          <linearGradient id="fe_sb_imp_bg" x1="3" y1="4" x2="21" y2="20" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
          <linearGradient id="fe_sb_imp_tray" x1="4" y1="13" x2="20" y2="20" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0EA5E9" />
            <stop offset="100%" stopColor="#0369A1" />
          </linearGradient>
        </defs>
        <rect x="3" y="4.5" width="18" height="15" rx="3" fill="url(#fe_sb_imp_bg)" />
        <path d="M3 13.5H21V16.5C21 18.16 19.66 19.5 18 19.5H6C4.34 19.5 3 18.16 3 16.5V13.5Z" fill="url(#fe_sb_imp_tray)" opacity="0.9" />
        <path d="M12 7V14M12 14L8.8 10.8M12 14L15.2 10.8" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 16.5H16" stroke="#E0F2FE" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === 'personal') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={`fluent-3d-icon ${className} shrink-0`}>
        <defs>
          <linearGradient id="fe_sb_star" x1="4" y1="3" x2="20" y2="21" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
        </defs>
        <path d="M2.5 6.5C2.5 5.4 3.4 4.5 4.5 4.5H9.2L11.2 6.5H19.5C20.6 6.5 21.5 7.4 21.5 8.5V18C21.5 19.1 20.6 20 19.5 20H4.5C3.4 20 2.5 19.1 2.5 18V6.5Z" fill="#F59E0B" />
        <rect x="2.5" y="8" width="19" height="12" rx="2.2" fill="url(#fe_sb_star)" />
        <path d="M12 10.2L13.1 12.6L15.7 13L13.8 14.8L14.3 17.4L12 16.1L9.7 17.4L10.2 14.8L8.3 13L10.9 12.6L12 10.2Z" fill="#FFFFFF" />
      </svg>
    );
  }
  if (kind === 'cloud') {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={`fluent-3d-icon ${className} shrink-0`}>
        <defs>
          <linearGradient id="fe_sb_cld1" x1="3" y1="7" x2="21" y2="19" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0369A1" />
          </linearGradient>
          <linearGradient id="fe_sb_cld2" x1="8" y1="10" x2="21" y2="19" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7DD3FC" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
        </defs>
        <path d="M7.5 18.5H17.5C19.7 18.5 21.5 16.8 21.5 14.7C21.5 12.8 20.1 11.2 18.2 10.9C17.6 7.8 14.9 5.5 11.7 5.5C8.1 5.5 5.2 8.3 5.1 11.8C3.5 12.3 2.5 13.8 2.5 15.4C2.5 17.1 4.8 18.5 7.5 18.5Z" fill="url(#fe_sb_cld1)" />
        <path d="M9.5 18.5H17.8C19.8 18.5 21.5 16.9 21.5 15C21.5 13.2 20.1 11.7 18.3 11.5C16.8 11.4 15.4 12.1 14.6 13.2C13.8 12.5 12.7 12.1 11.5 12.2C9.5 12.4 8 14 8 16C8 17.4 8.7 18.5 9.5 18.5Z" fill="url(#fe_sb_cld2)" />
      </svg>
    );
  }
  return <FluentFolder3D className={className} />;
};

// Morphing Vertical Pill Indicator matching Sidebar.tsx exact stretch & slide animation
const ExplorerMorphingVerticalIndicator: React.FC<{
  containerRef: React.RefObject<HTMLDivElement | null>;
  activeKey: string;
  accentColor: string;
}> = ({ containerRef, activeKey, accentColor }) => {
  const [bounds, setBounds] = useState<{
    top: number;
    left: number;
    height: number;
    visible: boolean;
  }>({ top: 0, left: 8, height: 32, visible: false });

  const prevTopRef = useRef<number | null>(null);
  const [stretchKey, setStretchKey] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    let observer: ResizeObserver | null = null;
    let mutationObserver: MutationObserver | null = null;
    let rafId: number | null = null;
    let timer1: ReturnType<typeof setTimeout> | null = null;
    let timer2: ReturnType<typeof setTimeout> | null = null;

    const measure = () => {
      if (isCancelled) return;
      const container = containerRef.current;
      if (!container) return;

      const activeEl = container.querySelector('[data-nav-active="true"]') as HTMLElement | null;
      if (!activeEl) {
        setBounds((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const activeRect = activeEl.getBoundingClientRect();
      const top = Math.round(activeRect.top - containerRect.top);
      const left = Math.round(activeRect.left - containerRect.left);
      const height = Math.round(activeRect.height);

      if (height > 0) {
        setBounds({ top, left, height, visible: true });
      }
    };

    measure();
    rafId = requestAnimationFrame(measure);
    timer1 = setTimeout(measure, 40);
    timer2 = setTimeout(measure, 160);

    const container = containerRef.current;
    const scroller = container?.querySelector('.sidebar-scroller') as HTMLElement | null;
    if (container) {
      observer = new ResizeObserver(() => measure());
      observer.observe(container);
      mutationObserver = new MutationObserver(() => measure());
      mutationObserver.observe(container, {
        attributes: true,
        attributeFilter: ['data-nav-active'],
        subtree: true,
      });
      scroller?.addEventListener('scroll', measure, { passive: true });
    }

    return () => {
      isCancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      if (timer1) clearTimeout(timer1);
      if (timer2) clearTimeout(timer2);
      if (observer) observer.disconnect();
      if (mutationObserver) mutationObserver.disconnect();
      scroller?.removeEventListener('scroll', measure);
    };
  }, [activeKey, containerRef]);

  const INDICATOR_HEIGHT = 16;
  const centeredTop = bounds.top + Math.round((bounds.height - INDICATOR_HEIGHT) / 2);

  useEffect(() => {
    if (bounds.visible) {
      if (prevTopRef.current !== null && Math.abs(prevTopRef.current - centeredTop) > 2) {
        setStretchKey((k) => k + 1);
      }
      prevTopRef.current = centeredTop;
    }
  }, [centeredTop, bounds.visible]);

  if (!bounds.visible) return null;

  return (
    <motion.div
      className="absolute w-[3px] h-[16px] z-30 pointer-events-none rounded-full"
      initial={false}
      animate={{
        top: centeredTop,
        left: bounds.left,
        opacity: bounds.visible ? 1 : 0,
      }}
      transition={{
        top: { duration: 0.38, ease: [0.4, 0.0, 0.2, 1] },
        left: { duration: 0.38, ease: [0.4, 0.0, 0.2, 1] },
        opacity: { duration: 0.15 },
      }}
    >
      <motion.div
        key={`fe-pill-stretch-${stretchKey}`}
        className="w-full h-full rounded-full origin-center"
        style={{ backgroundColor: accentColor }}
        initial={{ scaleY: 1 }}
        animate={{
          scaleY: stretchKey > 0 ? [1, 2.2, 1] : 1,
        }}
        transition={{
          duration: 0.38,
          times: [0, 0.5, 1],
          ease: [0.4, 0.0, 0.2, 1],
        }}
      />
    </motion.div>
  );
};

// Right-Click Tab Context Menu matching SparkleTabBar.tsx
const ExplorerTabContextMenu: React.FC<{
  x: number;
  y: number;
  tabId: string;
  canClose: boolean;
  onClose: () => void;
  onCreateTab: () => void;
  onDuplicateTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onCloseOtherTabs: (tabId: string) => void;
}> = ({
  x,
  y,
  tabId,
  canClose,
  onClose,
  onCreateTab,
  onDuplicateTab,
  onCloseTab,
  onCloseOtherTabs,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(() => {
    const maxLeft = (typeof window !== 'undefined' ? window.innerWidth : 800) - 198;
    const maxTop = (typeof window !== 'undefined' ? window.innerHeight : 600) - 160;
    return {
      left: Math.max(8, Math.min(x, maxLeft)),
      top: Math.max(8, Math.min(y, maxTop)),
    };
  });

  useLayoutEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const maxLeft = (typeof window !== 'undefined' ? window.innerWidth : 800) - width - 8;
    const maxTop = (typeof window !== 'undefined' ? window.innerHeight : 600) - height - 8;
    setPosition({
      left: Math.max(8, Math.min(x, maxLeft)),
      top: Math.max(8, Math.min(y, maxTop)),
    });
  }, [x, y]);

  useEffect(() => {
    const handlePointerDown = (e: MouseEvent | PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const timer = setTimeout(() => {
      window.addEventListener('pointerdown', handlePointerDown);
    }, 50);
    window.addEventListener('keydown', handleKey);
    window.addEventListener('resize', onClose);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('resize', onClose);
    };
  }, [onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: position.left,
        top: position.top,
        zIndex: 2147483647,
        overflow: 'clip',
      }}
      className="fluent-context-menu-wrapper pointer-events-auto"
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <motion.div {...contextMenuMotionProps}>
        <div
          role="menu"
          aria-label="Explorer tab actions"
          style={flyoutPanelStyle}
          className={`w-[190px] p-1 ${flyoutPanelClassName} fluent-context-menu shadow-none`}
        >
          <div className="w-full flex flex-col">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onCreateTab();
                onClose();
              }}
              className="w-full h-8 px-2.5 rounded-[4px] flex items-center gap-2.5 text-[12px] text-[#111827] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer text-left border-none"
            >
              <Plus className="w-3.5 h-3.5 text-neutral-400" />
              <span>New tab</span>
            </button>
            {tabId && (
              <>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onDuplicateTab(tabId);
                    onClose();
                  }}
                  className="w-full h-8 px-2.5 rounded-[4px] flex items-center gap-2.5 text-[12px] text-[#111827] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer text-left border-none"
                >
                  <Copy className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Duplicate tab</span>
                </button>
                <div className="h-[1px] my-1 bg-black/10 dark:bg-white/10" />
                {canClose && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onCloseTab(tabId);
                      onClose();
                    }}
                    className="w-full h-8 px-2.5 rounded-[4px] flex items-center gap-2.5 text-[12px] text-[#111827] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer text-left border-none"
                  >
                    <X className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Close tab</span>
                  </button>
                )}
                {canClose && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onCloseOtherTabs(tabId);
                      onClose();
                    }}
                    className="w-full h-8 px-2.5 rounded-[4px] flex items-center gap-2.5 text-[12px] text-[#111827] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer text-left border-none"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Close other tabs</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

export const FileExplorer: React.FC<FileExplorerProps> = ({ navigate }) => {
  const { settings } = useSettings();
  const { notes, setActiveNoteId, createNote } = useNotes();
  const { titleBarSlotEl, isInsideWindowFrame } = useContext(WindowTitleBarPortalContext);
  const isLight = settings.theme === 'light';
  const accentColor = isLight ? '#0063B8' : '#4CC2FF';
  const accentForeground = isLight ? '#ffffff' : '#000000';

  const [fePrefs, setFePrefs] = useState<ExplorerPreferences>(() => loadExplorerPrefs());
  const updateFePrefs = useCallback((updater: (prev: ExplorerPreferences) => ExplorerPreferences) => {
    setFePrefs((prev) => {
      const next = updater(prev);
      saveExplorerPrefs(next);
      return next;
    });
  }, []);

  // Internal tabs (matching SparkleTabBar mechanism)
  const [tabs, setTabs] = useState<ExplorerTab[]>(() => [
    { id: 'fe-tab-1', history: [loadExplorerPrefs().defaultDir || 'dir-home'], historyIndex: 0 },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('fe-tab-1');
  const [tabContextMenu, setTabContextMenu] = useState<{ x: number; y: number; tabId: string } | null>(null);
  const [canScrollTabsLeft, setCanScrollTabsLeft] = useState(false);
  const [canScrollTabsRight, setCanScrollTabsRight] = useState(false);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const sidebarContainerRef = useRef<HTMLDivElement>(null);

  const activeTab = useMemo(
    () => tabs.find((t) => t.id === activeTabId) || tabs[0],
    [tabs, activeTabId]
  );
  const currentDirId = activeTab.history[activeTab.historyIndex] || 'dir-home';

  // Live data sources
  const [galleryItems, setGalleryItems] = useState<GalleryMediaItem[]>([]);
  const [htmlFiles, setHtmlFiles] = useState<Array<{ id: string; name: string; content: string; updatedAt: number }>>([]);

  // Custom persisted entries & favorites
  const [customEntries, setCustomEntries] = useState<ExplorerEntry[]>(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_FS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return ['sys-doc-ui-trends', 'sys-doc-reports-july', 'sys-doc-history-ux'];
  });

  const [hiddenSystemIds, setHiddenSystemIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(HIDDEN_SYSTEM_IDS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  // UI states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>(() => loadExplorerPrefs().defaultViewMode);
  const [showDetailsPane, setShowDetailsPane] = useState<boolean>(() => loadExplorerPrefs().showDetailsByDefault);
  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>('sys-dl-wallpaper-bloom');
  const [clipboard, setClipboard] = useState<{ mode: 'cut' | 'copy'; entryId: string } | null>(null);

  // Settings view accordion states (matching Widget Board Settings tab)
  const [moreSettingsExpanded, setMoreSettingsExpanded] = useState(false);
  const [aboutExpanded, setAboutExpanded] = useState(true);

  // Home collapsible sections
  const [favoritesOpen, setFavoritesOpen] = useState(true);
  const [drivesOpen, setDrivesOpen] = useState(true);
  const [recentOpen, setRecentOpen] = useState(true);
  const [pcFoldersOpen, setPcFoldersOpen] = useState(true);
  const [pcDrivesOpen, setPcDrivesOpen] = useState(true);

  // Address bar editing
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressDraft, setAddressDraft] = useState('');

  // Dropdowns & Context Menus
  const [openMenu, setOpenMenu] = useState<'new' | 'sort' | 'view' | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; entry: ExplorerEntry | null } | null>(null);

  // Modals: Rename, New Item, Preview/Editor, Properties
  const [renameTarget, setRenameTarget] = useState<ExplorerEntry | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [newItemModal, setNewItemModal] = useState<{ kind: 'folder' | 'text' | 'html' } | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [previewEntry, setPreviewEntry] = useState<ExplorerEntry | null>(null);
  const [editorText, setEditorText] = useState('');
  const [propertiesEntry, setPropertiesEntry] = useState<ExplorerEntry | null>(null);

  const fileUploadInputRef = useRef<HTMLInputElement>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  const loadHtmlWriterFiles = useCallback(() => {
    try {
      const raw = localStorage.getItem(HTML_WRITER_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setHtmlFiles(parsed);
      }
    } catch {}
  }, []);

  const refreshLiveSources = useCallback(() => {
    galleryDB.getAll().then(setGalleryItems).catch(() => {});
    loadHtmlWriterFiles();
  }, [loadHtmlWriterFiles]);

  useEffect(() => {
    refreshLiveSources();
    const unsub = galleryDB.subscribe(refreshLiveSources);
    const onStorage = (e: StorageEvent) => {
      if (e.key === HTML_WRITER_STORAGE_KEY) loadHtmlWriterFiles();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      unsub();
      window.removeEventListener('storage', onStorage);
    };
  }, [refreshLiveSources, loadHtmlWriterFiles]);

  const persistCustomEntries = useCallback((next: ExplorerEntry[]) => {
    setCustomEntries(next);
    try {
      localStorage.setItem(CUSTOM_FS_STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const persistFavorites = useCallback((next: string[]) => {
    setFavoriteIds(next);
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const persistHidden = useCallback((next: string[]) => {
    setHiddenSystemIds(next);
    try {
      localStorage.setItem(HIDDEN_SYSTEM_IDS_KEY, JSON.stringify(next));
    } catch {}
  }, []);

  // Build unified entry catalog
  const allEntries: ExplorerEntry[] = useMemo(() => {
    const hiddenSet = new Set(hiddenSystemIds);
    const favSet = new Set(favoriteIds);

    const galleryMapped: ExplorerEntry[] = galleryItems.map((item) => {
      const parentId =
        item.type === 'image'
          ? 'dir-pictures'
          : item.type === 'video'
          ? 'dir-videos'
          : item.type === 'audio'
          ? 'dir-music'
          : 'dir-documents';
      const folderName =
        item.type === 'image'
          ? 'Images'
          : item.type === 'video'
          ? 'Videos'
          : item.type === 'audio'
          ? 'Music'
          : 'Documents';
      const lowerTitle = item.title.toLowerCase();
      const kind: ExplorerItemKind =
        item.type === 'document'
          ? lowerTitle.endsWith('.docx')
            ? 'word'
            : lowerTitle.endsWith('.xlsx')
            ? 'excel'
            : lowerTitle.endsWith('.pdf')
            ? 'pdf'
            : 'document'
          : item.type;

      return {
        id: `gal-${item.id}`,
        parentId,
        name: item.title,
        kind,
        sizeBytes: item.size || 1250000,
        modifiedAt: new Date(item.dateAdded).getTime() || Date.now(),
        dateLabel: item.dateLabel,
        locationLabel: folderName,
        pathLabel: `C:\\Users\\Sparkle\\${folderName}\\${item.title}`,
        status: 'synced',
        isFavorite: favSet.has(`gal-${item.id}`) || Boolean(item.isFavorite),
        thumbnailUrl: item.thumbnailUrl || (item.type === 'image' ? item.url : undefined),
        mediaUrl: item.url,
        mimeType: item.mimeType,
        dimensions: item.dimensions,
        textContent: item.description,
        linkedSource: 'gallery',
        linkedId: item.id,
        isImportedFromDevice: item.source === 'upload' || item.id.startsWith('upload-'),
      };
    });

    const notesMapped: ExplorerEntry[] = notes.map((n) => ({
      id: `note-${n.id}`,
      parentId: 'dir-documents',
      name: `${n.title || 'Untitled Note'}.note`,
      kind: 'note',
      sizeBytes: Math.max(1024, (n.content || '').length * 2),
      modifiedAt: n.updatedAt || n.createdAt || Date.now(),
      locationLabel: 'Documents',
      pathLabel: `C:\\Users\\Sparkle\\Documents\\${n.title || 'Untitled Note'}.note`,
      status: 'synced',
      isFavorite: favSet.has(`note-${n.id}`) || Boolean(n.pinned),
      textContent: (n.content || '').replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim(),
      linkedSource: 'notes',
      linkedId: n.id,
      targetRoute: '/notes',
    }));

    const htmlMapped: ExplorerEntry[] = htmlFiles.map((f) => ({
      id: `html-${f.id}`,
      parentId: 'dir-documents',
      name: f.name.endsWith('.html') ? f.name : `${f.name}.html`,
      kind: 'html',
      sizeBytes: Math.max(512, (f.content || '').length),
      modifiedAt: f.updatedAt || Date.now(),
      locationLabel: 'Documents',
      pathLabel: `C:\\Users\\Sparkle\\Documents\\${f.name}`,
      status: 'local',
      isFavorite: favSet.has(`html-${f.id}`),
      textContent: f.content,
      linkedSource: 'html-writer',
      linkedId: f.id,
      targetRoute: '/html-writer',
    }));

    const drives: ExplorerEntry[] = [
      {
        id: 'drive-c',
        parentId: 'dir-this-pc',
        name: 'Local Disk (C:)',
        kind: 'drive',
        driveLetter: 'C:',
        driveUsedGb: 87,
        driveTotalGb: 222,
        sizeBytes: 222 * 1024 * 1024 * 1024,
        modifiedAt: Date.now() - 1000 * 60 * 5,
        locationLabel: 'This PC',
        pathLabel: 'C:\\',
        status: 'local',
        targetDirId: 'dir-drive-c',
        linkedSource: 'system',
      },
      {
        id: 'drive-d',
        parentId: 'dir-this-pc',
        name: 'Data (D:)',
        kind: 'drive',
        driveLetter: 'D:',
        driveUsedGb: 624,
        driveTotalGb: 931,
        sizeBytes: 931 * 1024 * 1024 * 1024,
        modifiedAt: Date.now() - 1000 * 60 * 30,
        locationLabel: 'This PC',
        pathLabel: 'D:\\',
        status: 'local',
        targetDirId: 'dir-drive-d',
        linkedSource: 'system',
      },
    ];

    const seeded = SEEDED_SYSTEM_ENTRIES.filter((it) => !hiddenSet.has(it.id)).map((it) => ({
      ...it,
      isFavorite: favSet.has(it.id) || Boolean(it.isFavorite),
    }));

    const custom = customEntries.map((it) => ({
      ...it,
      isFavorite: favSet.has(it.id) || Boolean(it.isFavorite),
      isImportedFromDevice: Boolean(
        it.isImportedFromDevice ||
          it.parentId === 'dir-imported' ||
          (it.linkedSource === 'custom' && it.kind !== 'folder' && (it.mediaUrl !== undefined || it.mimeType !== undefined))
      ),
    }));

    return [...drives, ...seeded, ...custom, ...htmlMapped, ...notesMapped, ...galleryMapped];
  }, [galleryItems, notes, htmlFiles, customEntries, favoriteIds, hiddenSystemIds]);

  // Directory metadata lookup including custom folders
  const getDirMeta = useCallback(
    (dirId: string): DirectoryMeta => {
      if (CORE_DIRECTORIES[dirId]) return CORE_DIRECTORIES[dirId];
      if (dirId === 'dir-sub-school') {
        return { id: 'dir-sub-school', name: 'School project', parentId: 'dir-downloads', pathLabel: 'C:\\Users\\Sparkle\\Downloads\\School project', icon: 'folder' };
      }
      if (dirId === 'dir-sub-inspiration') {
        return { id: 'dir-sub-inspiration', name: 'Inspiration', parentId: 'dir-downloads', pathLabel: 'C:\\Users\\Sparkle\\Downloads\\Inspiration', icon: 'folder' };
      }
      if (dirId === 'dir-drive-c-win') {
        return { id: 'dir-drive-c-win', name: 'Sparkle', parentId: 'dir-drive-c', pathLabel: 'C:\\Sparkle', icon: 'folder' };
      }
      const customFolder = customEntries.find((e) => e.targetDirId === dirId || e.id === dirId);
      if (customFolder) {
        return {
          id: dirId,
          name: customFolder.name,
          parentId: customFolder.parentId,
          pathLabel: customFolder.pathLabel,
          icon: 'folder',
        };
      }
      return CORE_DIRECTORIES['dir-home'];
    },
    [customEntries]
  );

  const currentDirMeta = getDirMeta(currentDirId);

  // Build breadcrumb trail
  const breadcrumbs = useMemo(() => {
    const chain: DirectoryMeta[] = [];
    let cursor: string | null = currentDirId;
    const guard = new Set<string>();
    while (cursor && !guard.has(cursor)) {
      guard.add(cursor);
      const meta = getDirMeta(cursor);
      chain.unshift(meta);
      cursor = meta.parentId;
    }
    return chain;
  }, [currentDirId, getDirMeta]);

  // Tab navigation helpers
  const navigateToDir = useCallback(
    (dirId: string) => {
      setSearchQuery('');
      setContextMenu(null);
      setOpenMenu(null);
      setIsNavDrawerOpen(false);
      setTabs((prev) =>
        prev.map((t) => {
          if (t.id !== activeTabId) return t;
          const current = t.history[t.historyIndex];
          if (current === dirId) return t;
          const nextHistory = [...t.history.slice(0, t.historyIndex + 1), dirId];
          return { ...t, history: nextHistory, historyIndex: nextHistory.length - 1 };
        })
      );
    },
    [activeTabId]
  );

  const goBack = useCallback(() => {
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId && t.historyIndex > 0
          ? { ...t, historyIndex: t.historyIndex - 1 }
          : t
      )
    );
  }, [activeTabId]);

  const goForward = useCallback(() => {
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId && t.historyIndex < t.history.length - 1
          ? { ...t, historyIndex: t.historyIndex + 1 }
          : t
      )
    );
  }, [activeTabId]);

  const goUp = useCallback(() => {
    if (currentDirMeta.parentId) {
      navigateToDir(currentDirMeta.parentId);
    }
  }, [currentDirMeta.parentId, navigateToDir]);

  const addTab = useCallback((initialDir?: string) => {
    const targetDir = initialDir || fePrefs.defaultDir || 'dir-home';
    const id = `fe-tab-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    setTabs((prev) => [...prev, { id, history: [targetDir], historyIndex: 0 }]);
    setActiveTabId(id);
  }, [fePrefs.defaultDir]);

  const duplicateTab = useCallback((id: string) => {
    const src = tabs.find((t) => t.id === id);
    if (!src) return;
    const newId = `fe-tab-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    const copy: ExplorerTab = {
      id: newId,
      history: [...src.history],
      historyIndex: src.historyIndex,
    };
    setTabs((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
    setActiveTabId(newId);
  }, [tabs]);

  const closeTab = useCallback((id: string) => {
    if (tabs.length <= 1) return;
    setTabs((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      const next = prev.filter((t) => t.id !== id);
      if (activeTabId === id && next.length > 0) {
        const fallback = next[Math.min(idx, next.length - 1)];
        setActiveTabId(fallback.id);
      }
      return next;
    });
  }, [tabs.length, activeTabId]);

  const closeOtherTabs = useCallback((keepId: string) => {
    setTabs((prev) => prev.filter((t) => t.id === keepId));
    setActiveTabId(keepId);
  }, []);

  const updateTabScrollStatus = useCallback(() => {
    const el = tabsContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollTabsLeft(scrollLeft > 2);
    setCanScrollTabsRight(scrollLeft < scrollWidth - clientWidth - 2);
  }, []);

  useEffect(() => {
    const el = tabsContainerRef.current;
    if (!el) return;
    updateTabScrollStatus();
    el.addEventListener('scroll', updateTabScrollStatus, { passive: true });
    window.addEventListener('resize', updateTabScrollStatus);
    return () => {
      el.removeEventListener('scroll', updateTabScrollStatus);
      window.removeEventListener('resize', updateTabScrollStatus);
    };
  }, [tabs.length, updateTabScrollStatus, titleBarSlotEl]);

  useEffect(() => {
    const el = tabsContainerRef.current;
    if (!el) return;
    const activeEl = el.querySelector(`[data-tab-id="${activeTabId}"]`) as HTMLElement | null;
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
    }
    const timer = setTimeout(updateTabScrollStatus, 160);
    return () => clearTimeout(timer);
  }, [activeTabId, updateTabScrollStatus]);

  // Items visible in current directory or search
  const visibleEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list: ExplorerEntry[];

    if (q) {
      if (currentDirId === 'dir-home' || currentDirId === 'dir-this-pc') {
        list = allEntries.filter(
          (e) =>
            e.kind !== 'drive' &&
            (e.name.toLowerCase().includes(q) ||
              e.locationLabel.toLowerCase().includes(q) ||
              getKindLabel(e.kind).toLowerCase().includes(q))
        );
      } else if (currentDirId === 'dir-gallery') {
        list = allEntries.filter(
          (e) =>
            (e.linkedSource === 'gallery' || e.kind === 'image' || e.kind === 'video') &&
            e.name.toLowerCase().includes(q)
        );
      } else if (currentDirId === 'dir-imported') {
        list = allEntries.filter(
          (e) =>
            (e.isImportedFromDevice || e.parentId === 'dir-imported') &&
            e.kind !== 'drive' &&
            e.name.toLowerCase().includes(q)
        );
      } else {
        list = allEntries.filter((e) => e.parentId === currentDirId && e.name.toLowerCase().includes(q));
      }
    } else if (currentDirId === 'dir-gallery') {
      list = allEntries.filter((e) => e.linkedSource === 'gallery' || e.kind === 'image' || e.kind === 'video');
    } else if (currentDirId === 'dir-imported') {
      list = allEntries.filter((e) => (e.isImportedFromDevice || e.parentId === 'dir-imported') && e.kind !== 'drive');
    } else if (currentDirId === 'dir-home') {
      // Recent items for Home
      list = allEntries
        .filter((e) => e.kind !== 'drive')
        .sort((a, b) => b.modifiedAt - a.modifiedAt)
        .slice(0, 14);
    } else {
      list = allEntries.filter((e) => e.parentId === currentDirId);
    }

    // Apply sort (for Home without search, keep recent sort unless explicitly sorted, or always sort folders first on folder views)
    const sorted = [...list].sort((a, b) => {
      if (currentDirId !== 'dir-home') {
        const aDir = a.kind === 'folder' || a.kind === 'drive' ? 0 : 1;
        const bDir = b.kind === 'folder' || b.kind === 'drive' ? 0 : 1;
        if (aDir !== bDir) return aDir - bDir;
      }
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'modifiedAt') cmp = a.modifiedAt - b.modifiedAt;
      else if (sortField === 'kind') cmp = getKindLabel(a.kind).localeCompare(getKindLabel(b.kind));
      else if (sortField === 'sizeBytes') cmp = (a.sizeBytes || 0) - (b.sizeBytes || 0);
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return sorted;
  }, [allEntries, currentDirId, searchQuery, sortField, sortOrder]);

  const homeFavorites = useMemo(
    () => allEntries.filter((e) => e.isFavorite && e.kind !== 'drive').slice(0, 6),
    [allEntries]
  );

  const homeDrives = useMemo(
    () => allEntries.filter((e) => e.kind === 'drive'),
    [allEntries]
  );

  const selectedEntry = useMemo(
    () => allEntries.find((e) => e.id === selectedId) || visibleEntries[0] || null,
    [allEntries, selectedId, visibleEntries]
  );

  // Close popovers on outside click
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (openMenu && menuContainerRef.current && !menuContainerRef.current.contains(target)) {
        setOpenMenu(null);
      }
      if (contextMenu && !target.closest('[data-fe-context-menu]')) {
        setContextMenu(null);
      }
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [openMenu, contextMenu]);

  // Open an item (navigate folder, launch Sparkle app, or open inline preview)
  const openEntry = useCallback(
    (entry: ExplorerEntry, forceExternalApp = false) => {
      if (entry.kind === 'folder' || entry.kind === 'drive') {
        const dest = entry.targetDirId || entry.id;
        navigateToDir(dest);
        return;
      }

      if (entry.kind === 'app' && entry.targetRoute && navigate) {
        navigate(entry.targetRoute, entry.targetRouteState);
        return;
      }

      if (forceExternalApp && navigate) {
        if (entry.linkedSource === 'gallery') {
          if (entry.kind === 'video' || entry.kind === 'audio') {
            navigate('/screenbox');
          } else {
            navigate('/gallery');
          }
          return;
        }
        if (entry.linkedSource === 'notes' && entry.linkedId) {
          setActiveNoteId(entry.linkedId);
          navigate('/notes');
          return;
        }
        if (entry.linkedSource === 'html-writer' && entry.linkedId) {
          try {
            localStorage.setItem(HTML_WRITER_ACTIVE_KEY, entry.linkedId);
          } catch {}
          navigate('/html-writer');
          return;
        }
      }

      // Open preview / inline viewer modal
      setEditorText(entry.textContent || '');
      setPreviewEntry(entry);
    },
    [navigate, navigateToDir, setActiveNoteId]
  );

  // Create Folder / Text / HTML / Note
  const handleCreateItem = (kind: 'folder' | 'text' | 'html' | 'note') => {
    setOpenMenu(null);
    const targetParent =
      currentDirId === 'dir-home' || currentDirId === 'dir-this-pc' || currentDirId === 'dir-gallery'
        ? 'dir-documents'
        : currentDirId;

    if (kind === 'note') {
      const id = createNote('New Explorer Note', '<p>Created from File Explorer.</p>', 'yellow');
      setActiveNoteId(id);
      navigateToDir('dir-documents');
      showAppToast('Created new note in Documents', { appName: 'File Explorer' });
      return;
    }

    setNewItemName(
      kind === 'folder' ? 'New folder' : kind === 'html' ? 'index.html' : 'New Text Document.txt'
    );
    setNewItemModal({ kind });
    if (currentDirId !== targetParent && (currentDirId === 'dir-home' || currentDirId === 'dir-this-pc')) {
      navigateToDir(targetParent);
    }
  };

  const confirmCreateNewItem = () => {
    if (!newItemModal || !newItemName.trim()) return;
    const rawName = newItemName.trim();
    const targetParent =
      currentDirId === 'dir-home' || currentDirId === 'dir-this-pc' || currentDirId === 'dir-gallery'
        ? 'dir-documents'
        : currentDirId;
    const parentMeta = getDirMeta(targetParent);

    if (newItemModal.kind === 'html') {
      const fname = rawName.endsWith('.html') ? rawName : `${rawName}.html`;
      const newHtml = {
        id: `html-fe-${Date.now()}`,
        name: fname,
        content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <title>${fname}</title>\n  <style>body{font-family:'Segoe UI',sans-serif;padding:24px;}</style>\n</head>\n<body>\n  <h1>${fname}</h1>\n  <p>Created in Sparkle File Explorer.</p>\n</body>\n</html>`,
        updatedAt: Date.now(),
      };
      const next = [newHtml, ...htmlFiles];
      setHtmlFiles(next);
      try {
        localStorage.setItem(HTML_WRITER_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      setSelectedId(`html-${newHtml.id}`);
      showAppToast(`Created ${fname}`, { appName: 'File Explorer' });
      setNewItemModal(null);
      return;
    }

    const newId = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const isFolder = newItemModal.kind === 'folder';
    const finalName = isFolder ? rawName : rawName.includes('.') ? rawName : `${rawName}.txt`;
    const newEntry: ExplorerEntry = {
      id: newId,
      parentId: targetParent,
      name: finalName,
      kind: isFolder ? 'folder' : 'text',
      sizeBytes: isFolder ? undefined : 128,
      modifiedAt: Date.now(),
      locationLabel: parentMeta.name,
      pathLabel: `${parentMeta.pathLabel}\\${finalName}`,
      status: 'local',
      linkedSource: 'custom',
      targetDirId: isFolder ? `dir-${newId}` : undefined,
      textContent: isFolder ? undefined : '',
    };
    persistCustomEntries([newEntry, ...customEntries]);
    setSelectedId(newId);
    showAppToast(`Created ${finalName}`, { appName: 'File Explorer' });
    setNewItemModal(null);
  };

  // Import local device files of any format into Explorer (+ Gallery for media)
  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileList: File[] = Array.from(files);
    const isOverviewDir =
      currentDirId === 'dir-home' ||
      currentDirId === 'dir-this-pc' ||
      currentDirId === 'dir-gallery' ||
      currentDirId === 'dir-network' ||
      currentDirId === 'dir-settings';
    const targetParent = isOverviewDir ? 'dir-downloads' : currentDirId;
    const parentMeta = getDirMeta(targetParent);

    const newCustomEntries: ExplorerEntry[] = [];
    let firstSelectedId: string | null = null;
    let firstMediaOnly = false;

    for (const file of fileList) {
      const ext = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() || '' : '';
      const isImage = file.type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico', 'avif'].includes(ext);
      const isVideo = file.type.startsWith('video/') || ['mp4', 'webm', 'mkv', 'mov', 'avi'].includes(ext);
      const isAudio = file.type.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'].includes(ext);

      if (isImage || isVideo || isAudio) {
        const dims = await getMediaDimensions(file).catch(() => ({ width: 1280, height: 720, duration: undefined }));
        const mediaUrl =
          file.size <= 3_000_000
            ? await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result || ''));
                reader.onerror = () => resolve(URL.createObjectURL(file));
                reader.readAsDataURL(file);
              })
            : URL.createObjectURL(file);

        const mediaType: GalleryMediaItem['type'] = isVideo ? 'video' : isAudio ? 'audio' : 'image';
        const defaultMediaDir =
          mediaType === 'video' ? 'dir-videos' : mediaType === 'audio' ? 'dir-music' : 'dir-pictures';

        if (isOverviewDir || targetParent === defaultMediaDir) {
          const galId = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          await galleryDB.add({
            id: galId,
            title: file.name,
            type: mediaType,
            url: mediaUrl,
            thumbnailUrl: mediaType === 'image' ? mediaUrl : undefined,
            mimeType: file.type || `${mediaType}/${ext || 'octet-stream'}`,
            size: file.size,
            dateAdded: new Date().toISOString(),
            dateLabel: new Date().toLocaleDateString(),
            dimensions: { width: dims.width, height: dims.height },
            aspectRatio: dims.width / Math.max(1, dims.height),
            duration: dims.duration,
            source: 'upload',
          });
          if (!firstSelectedId) {
            firstSelectedId = `gal-${galId}`;
            firstMediaOnly = true;
          }
        } else {
          const newId = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          newCustomEntries.push({
            id: newId,
            parentId: targetParent,
            name: file.name,
            kind: mediaType,
            sizeBytes: file.size,
            modifiedAt: Date.now(),
            locationLabel: parentMeta.name,
            pathLabel: `${parentMeta.pathLabel}\\${file.name}`,
            status: 'local',
            linkedSource: 'custom',
            thumbnailUrl: mediaType === 'image' ? mediaUrl : undefined,
            mediaUrl,
            mimeType: file.type,
            fileExtension: ext,
            dimensions: { width: dims.width, height: dims.height },
            isImportedFromDevice: true,
          });
          if (!firstSelectedId) firstSelectedId = newId;
        }
      } else {
        const isText = TEXT_EDITABLE_EXTENSIONS.has(ext) || file.type.startsWith('text/');
        const textContent = isText ? await file.text().catch(() => '') : undefined;
        const mediaUrl =
          file.size <= 1_500_000
            ? await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result || ''));
                reader.onerror = () => resolve(URL.createObjectURL(file));
                reader.readAsDataURL(file);
              })
            : URL.createObjectURL(file);

        const kind: ExplorerItemKind =
          ext === 'html' || ext === 'htm'
            ? 'html'
            : ext === 'pdf'
            ? 'pdf'
            : ext === 'docx' || ext === 'doc' || ext === 'rtf' || ext === 'odt'
            ? 'word'
            : ext === 'xlsx' || ext === 'xls' || ext === 'ods'
            ? 'excel'
            : ext === 'pptx' || ext === 'ppt' || ext === 'odp'
            ? 'ppt'
            : ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(ext)
            ? 'archive'
            : ['js', 'mjs', 'cjs', 'ts', 'tsx', 'jsx', 'json', 'css', 'scss', 'py', 'xml', 'yml', 'yaml', 'sql', 'sh'].includes(ext)
            ? 'code'
            : ['exe', 'msi', 'app', 'apk', 'dmg', 'deb'].includes(ext)
            ? 'app'
            : isText
            ? 'text'
            : 'file';

        const newId = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        newCustomEntries.push({
          id: newId,
          parentId: targetParent,
          name: file.name,
          kind,
          sizeBytes: file.size,
          modifiedAt: Date.now(),
          locationLabel: parentMeta.name,
          pathLabel: `${parentMeta.pathLabel}\\${file.name}`,
          status: 'local',
          linkedSource: 'custom',
          textContent,
          mediaUrl,
          mimeType: file.type || 'application/octet-stream',
          fileExtension: ext,
          isBinary: !isText,
          isImportedFromDevice: true,
        });
        if (!firstSelectedId) firstSelectedId = newId;
      }
    }

    if (newCustomEntries.length > 0) {
      persistCustomEntries([...newCustomEntries, ...customEntries]);
      if (currentDirId === 'dir-settings' || currentDirId === 'dir-this-pc' || currentDirId === 'dir-network' || currentDirId === 'dir-gallery') {
        navigateToDir(targetParent);
      }
    }
    if (firstSelectedId) {
      setSelectedId(firstSelectedId);
    }

    if (fileList.length === 1) {
      showAppToast(
        firstMediaOnly ? `Imported "${fileList[0].name}" from device` : `Imported "${fileList[0].name}" to ${parentMeta.name}`,
        { appName: 'File Explorer' }
      );
    } else {
      showAppToast(`Imported ${fileList.length} files from device`, { appName: 'File Explorer' });
    }
    e.target.value = '';
  };

  // Cut / Copy / Paste
  const handleCopyOrCut = (mode: 'cut' | 'copy', entry: ExplorerEntry | null) => {
    if (!entry || entry.kind === 'drive') return;
    setClipboard({ mode, entryId: entry.id });
    showAppToast(`${mode === 'cut' ? 'Cut' : 'Copied'} "${entry.name}"`, { appName: 'File Explorer' });
  };

  const handlePaste = () => {
    if (!clipboard) return;
    const source = allEntries.find((e) => e.id === clipboard.entryId);
    if (!source) return;
    const targetParent =
      currentDirId === 'dir-home' || currentDirId === 'dir-this-pc' || currentDirId === 'dir-gallery'
        ? 'dir-downloads'
        : currentDirId;
    const parentMeta = getDirMeta(targetParent);

    if (clipboard.mode === 'cut' && source.linkedSource === 'custom') {
      persistCustomEntries(
        customEntries.map((c) =>
          c.id === source.id
            ? {
                ...c,
                parentId: targetParent,
                locationLabel: parentMeta.name,
                pathLabel: `${parentMeta.pathLabel}\\${c.name}`,
                modifiedAt: Date.now(),
              }
            : c
        )
      );
      setClipboard(null);
      showAppToast(`Moved "${source.name}" to ${parentMeta.name}`, { appName: 'File Explorer' });
    } else {
      const copyId = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
      const copyName = source.parentId === targetParent ? `${source.name} - Copy` : source.name;
      persistCustomEntries([
        {
          ...source,
          id: copyId,
          parentId: targetParent,
          name: copyName,
          locationLabel: parentMeta.name,
          pathLabel: `${parentMeta.pathLabel}\\${copyName}`,
          modifiedAt: Date.now(),
          linkedSource: 'custom',
          targetDirId: source.kind === 'folder' ? `dir-${copyId}` : source.targetDirId,
        },
        ...customEntries,
      ]);
      setSelectedId(copyId);
      showAppToast(`Pasted "${copyName}"`, { appName: 'File Explorer' });
    }
  };

  // Rename
  const startRename = (entry: ExplorerEntry | null) => {
    if (!entry || entry.kind === 'drive') return;
    setRenameTarget(entry);
    setRenameValue(entry.name);
  };

  const confirmRename = async () => {
    if (!renameTarget || !renameValue.trim()) return;
    const nextName = renameValue.trim();

    if (renameTarget.linkedSource === 'custom') {
      persistCustomEntries(
        customEntries.map((c) =>
          c.id === renameTarget.id
            ? { ...c, name: nextName, pathLabel: c.pathLabel.replace(/[^\\]+$/, nextName), modifiedAt: Date.now() }
            : c
        )
      );
    } else if (renameTarget.linkedSource === 'gallery' && renameTarget.linkedId) {
      await galleryDB.rename(renameTarget.linkedId, nextName);
    } else if (renameTarget.linkedSource === 'html-writer' && renameTarget.linkedId) {
      const next = htmlFiles.map((f) =>
        f.id === renameTarget.linkedId ? { ...f, name: nextName, updatedAt: Date.now() } : f
      );
      setHtmlFiles(next);
      try {
        localStorage.setItem(HTML_WRITER_STORAGE_KEY, JSON.stringify(next));
      } catch {}
    } else {
      // Fork system item into custom renamed copy and hide original
      const newId = `custom-${Date.now()}`;
      persistCustomEntries([
        {
          ...renameTarget,
          id: newId,
          name: nextName,
          pathLabel: renameTarget.pathLabel.replace(/[^\\]+$/, nextName),
          modifiedAt: Date.now(),
          linkedSource: 'custom',
        },
        ...customEntries,
      ]);
      persistHidden([...hiddenSystemIds, renameTarget.id]);
      setSelectedId(newId);
    }

    showAppToast(`Renamed to "${nextName}"`, { appName: 'File Explorer' });
    setRenameTarget(null);
  };

  // Delete
  const handleDelete = async (entry: ExplorerEntry | null) => {
    if (!entry || entry.kind === 'drive') return;
    if (entry.linkedSource === 'custom') {
      persistCustomEntries(customEntries.filter((c) => c.id !== entry.id));
    } else if (entry.linkedSource === 'gallery' && entry.linkedId) {
      await galleryDB.delete(entry.linkedId);
    } else if (entry.linkedSource === 'html-writer' && entry.linkedId) {
      const next = htmlFiles.filter((f) => f.id !== entry.linkedId);
      setHtmlFiles(next);
      try {
        localStorage.setItem(HTML_WRITER_STORAGE_KEY, JSON.stringify(next));
      } catch {}
    } else {
      persistHidden([...hiddenSystemIds, entry.id]);
    }
    if (selectedId === entry.id) setSelectedId(null);
    showAppToast(`Deleted "${entry.name}"`, { appName: 'File Explorer' });
  };

  const toggleFavorite = (entry: ExplorerEntry) => {
    const isFav = favoriteIds.includes(entry.id);
    const next = isFav ? favoriteIds.filter((id) => id !== entry.id) : [entry.id, ...favoriteIds];
    persistFavorites(next);
    showAppToast(isFav ? `Removed "${entry.name}" from Favorites` : `Pinned "${entry.name}" to Favorites`, {
      appName: 'File Explorer',
    });
  };

  const handleShare = (entry: ExplorerEntry | null) => {
    if (!entry) return;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(entry.pathLabel).catch(() => {});
    }
    showAppToast(`Copied path "${entry.pathLabel}" to clipboard`, { appName: 'Share' });
  };

  const savePreviewTextEdits = () => {
    if (!previewEntry) return;
    if (previewEntry.linkedSource === 'custom') {
      persistCustomEntries(
        customEntries.map((c) =>
          c.id === previewEntry.id
            ? { ...c, textContent: editorText, sizeBytes: editorText.length, modifiedAt: Date.now() }
            : c
        )
      );
    } else if (previewEntry.linkedSource === 'html-writer' && previewEntry.linkedId) {
      const next = htmlFiles.map((f) =>
        f.id === previewEntry.linkedId ? { ...f, content: editorText, updatedAt: Date.now() } : f
      );
      setHtmlFiles(next);
      try {
        localStorage.setItem(HTML_WRITER_STORAGE_KEY, JSON.stringify(next));
      } catch {}
    } else {
      const newId = `custom-${Date.now()}`;
      persistCustomEntries([
        {
          ...previewEntry,
          id: newId,
          textContent: editorText,
          sizeBytes: editorText.length,
          modifiedAt: Date.now(),
          linkedSource: 'custom',
        },
        ...customEntries,
      ]);
      if (previewEntry.linkedSource === 'system') {
        persistHidden([...hiddenSystemIds, previewEntry.id]);
      }
    }
    setPreviewEntry((prev) => (prev ? { ...prev, textContent: editorText } : null));
    showAppToast(`Saved changes to "${previewEntry.name}"`, { appName: 'File Explorer' });
  };

  const submitAddressEdit = () => {
    const q = addressDraft.trim().toLowerCase();
    setIsEditingAddress(false);
    if (!q) return;
    const matchedDir = Object.values(CORE_DIRECTORIES).find(
      (d) =>
        d.name.toLowerCase() === q ||
        d.pathLabel.toLowerCase() === q ||
        d.pathLabel.toLowerCase().endsWith(`\\${q}`)
    );
    if (matchedDir) {
      navigateToDir(matchedDir.id);
    } else {
      setSearchQuery(addressDraft.trim());
    }
  };

  // Keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (renameTarget || newItemModal || previewEntry || propertiesEntry || isEditingAddress) return;
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    if (e.key === 'F2' && selectedEntry) {
      e.preventDefault();
      startRename(selectedEntry);
    } else if (e.key === 'Delete' && selectedEntry) {
      e.preventDefault();
      handleDelete(selectedEntry);
    } else if (e.key === 'Enter' && selectedEntry) {
      e.preventDefault();
      openEntry(selectedEntry);
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && selectedEntry) {
      e.preventDefault();
      handleCopyOrCut('copy', selectedEntry);
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x' && selectedEntry) {
      e.preventDefault();
      handleCopyOrCut('cut', selectedEntry);
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v' && clipboard) {
      e.preventDefault();
      handlePaste();
    }
  };

  const navGroups: Array<{
    label: string | null;
    items: Array<{ id: string; name: string; iconKind: DirectoryMeta['icon'] }>;
  }> = [
    {
      label: null,
      items: [
        { id: 'dir-home', name: 'Home', iconKind: 'home' },
        { id: 'dir-this-pc', name: 'This PC', iconKind: 'pc' },
        { id: 'dir-gallery', name: 'Gallery', iconKind: 'gallery' },
        { id: 'dir-network', name: 'Network', iconKind: 'network' },
      ],
    },
    {
      label: 'Quick access',
      items: [
        { id: 'dir-desktop', name: 'Desktop', iconKind: 'desktop' },
        { id: 'dir-pictures', name: 'Images', iconKind: 'images' },
        { id: 'dir-videos', name: 'Videos', iconKind: 'videos' },
        { id: 'dir-downloads', name: 'Downloads', iconKind: 'downloads' },
        { id: 'dir-music', name: 'Music', iconKind: 'music' },
        { id: 'dir-documents', name: 'Documents', iconKind: 'documents' },
      ],
    },
    {
      label: 'Pinned',
      items: [
        { id: 'dir-imported', name: 'Imported from device', iconKind: 'imported' },
        { id: 'dir-personal', name: 'Personal folder', iconKind: 'personal' },
      ],
    },
    {
      label: 'Cloud Storage',
      items: [{ id: 'dir-cloud', name: 'Sparkle - Personal', iconKind: 'cloud' }],
    },
  ];

  const getOpenAppLabel = (entry: ExplorerEntry | null) => {
    if (!entry) return 'Open';
    if (entry.kind === 'folder' || entry.kind === 'drive') return 'Open folder';
    if (entry.linkedSource === 'gallery') {
      return entry.kind === 'video' || entry.kind === 'audio' ? 'Open in Screenbox' : 'Open in Gallery';
    }
    if (entry.linkedSource === 'notes') return 'Open in Notes';
    if (entry.linkedSource === 'html-writer') return 'Open in HTML Writer';
    if (entry.kind === 'app' && entry.name.includes('Settings')) return 'Open Settings';
    if (entry.kind === 'app' && entry.name.includes('HTML')) return 'Launch HTML Writer';
    return 'Open with...';
  };

  const getDisplayName = useCallback(
    (entry: ExplorerEntry) => {
      if (fePrefs.showFileExtensions || entry.kind === 'folder' || entry.kind === 'drive' || entry.kind === 'app') {
        return entry.name;
      }
      const dot = entry.name.lastIndexOf('.');
      return dot > 0 ? entry.name.slice(0, dot) : entry.name;
    },
    [fePrefs.showFileExtensions]
  );

  const renderSidebarNav = () => (
    <div ref={sidebarContainerRef} className="relative h-full flex flex-col select-none">
      {/* Animated Vertical Blue Indicator Pill matching main Sparkle Sidebar */}
      <ExplorerMorphingVerticalIndicator
        containerRef={sidebarContainerRef}
        activeKey={currentDirId}
        accentColor={accentColor}
      />

      <div className="flex-1 overflow-y-auto sidebar-scroller p-2 space-y-3">
        {navGroups.map((group, gi) => (
          <div key={gi} className="space-y-0.5">
            {group.label && (
              <div className="px-2.5 pt-1 pb-1 text-[11px] font-semibold tracking-wide text-black/55 dark:text-white/55">
                {group.label}
              </div>
            )}
            {group.items.map((item) => {
              const isActive = currentDirId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  data-nav-active={isActive ? 'true' : undefined}
                  onClick={() => navigateToDir(item.id)}
                  className={`w-full h-[32px] px-2.5 rounded-[6px] flex items-center gap-2.5 text-[12.5px] relative transition-colors cursor-pointer border-none text-left ${
                    isActive
                      ? 'bg-black/[0.08] dark:bg-white/[0.11] font-semibold'
                      : 'bg-transparent hover:bg-black/[0.05] dark:hover:bg-white/[0.06] font-normal'
                  }`}
                >
                  <ExplorerSidebar3DIcon kind={item.iconKind} className="w-[17px] h-[17px]" />
                  <span className="truncate">{item.name}</span>
                  {item.id === 'dir-personal' && (
                    <Pin className="w-3 h-3 ml-auto text-black/40 dark:text-white/40 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom Settings Entry (pinned like Widget Board & Sparkle Sidebar) */}
      <div className="p-2 border-t border-black/[0.06] dark:border-white/[0.07] shrink-0">
        <button
          type="button"
          data-nav-active={currentDirId === 'dir-settings' ? 'true' : undefined}
          onClick={() => navigateToDir('dir-settings')}
          className={`w-full h-[32px] px-2.5 rounded-[6px] flex items-center gap-2.5 text-[12.5px] relative transition-colors cursor-pointer border-none text-left ${
            currentDirId === 'dir-settings'
              ? 'bg-black/[0.08] dark:bg-white/[0.11] font-semibold'
              : 'bg-transparent hover:bg-black/[0.05] dark:hover:bg-white/[0.06] font-normal'
          }`}
        >
          <ExplorerSidebar3DIcon kind="settings" className="w-[17px] h-[17px]" />
          <span className="truncate">Settings</span>
        </button>
      </div>
    </div>
  );

  // Reusable WinUI 3 Explorer Tab Strip (matches SparkleTabBar mechanism + merges into WindowFrame title bar)
  const explorerTabStrip = (
    <div
      className={`flex items-end min-w-0 h-full select-none ${
        isInsideWindowFrame
          ? 'flex-1 pr-1'
          : 'h-[40px] px-2 pt-1.5 border-b border-black/[0.07] dark:border-white/[0.07] bg-black/[0.03] dark:bg-black/25 shrink-0'
      }`}
    >
      {/* Left scroll arrow */}
      {canScrollTabsLeft && (
        <button
          type="button"
          data-window-no-drag="true"
          onClick={() => {
            tabsContainerRef.current?.scrollBy({ left: -140, behavior: 'smooth' });
          }}
          title="Scroll tabs left"
          aria-label="Scroll tabs left"
          className="h-[26px] w-5 self-center mr-1 rounded-[4px] flex items-center justify-center text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 shrink-0 cursor-pointer border-none bg-transparent"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Draggable / Reorderable Tab List matching SparkleTabBar */}
      <div
        ref={tabsContainerRef}
        onWheel={(e) => {
          if (e.deltaY !== 0 && tabsContainerRef.current) {
            tabsContainerRef.current.scrollLeft += e.deltaY;
            updateTabScrollStatus();
          }
        }}
        className="flex-1 flex items-end overflow-x-auto no-scrollbar scroll-smooth h-full min-w-0"
      >
        <Reorder.Group
          as="div"
          axis="x"
          values={tabs}
          onReorder={setTabs}
          role="tablist"
          aria-label="File Explorer tabs"
          onContextMenu={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault();
              e.stopPropagation();
              setTabContextMenu({ x: e.clientX, y: e.clientY + 2, tabId: '' });
            }
          }}
          className="flex items-end space-x-1 h-full w-max"
        >
          <AnimatePresence initial={false}>
            {tabs.map((t) => {
              const tabDirId = t.history[t.historyIndex] || 'dir-home';
              const tabMeta = getDirMeta(tabDirId);
              const isTabActive = t.id === activeTabId;
              return (
                <Reorder.Item
                  as="div"
                  key={t.id}
                  value={t}
                  data-tab-id={t.id}
                  data-window-no-drag="true"
                  role="tab"
                  aria-selected={isTabActive}
                  aria-keyshortcuts="Shift+ArrowLeft Shift+ArrowRight"
                  tabIndex={0}
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 22 }}
                  transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                  layout
                  dragMomentum={false}
                  whileDrag={{ scale: 1.02, zIndex: 50 }}
                  onKeyDown={(e) => {
                    if (!e.shiftKey || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
                    const idx = tabs.findIndex((item) => item.id === t.id);
                    const targetIdx = idx + (e.key === 'ArrowLeft' ? -1 : 1);
                    if (targetIdx < 0 || targetIdx >= tabs.length) return;
                    e.preventDefault();
                    const copy = [...tabs];
                    const [moved] = copy.splice(idx, 1);
                    copy.splice(targetIdx, 0, moved);
                    setTabs(copy);
                  }}
                  onClick={() => setActiveTabId(t.id)}
                  onAuxClick={(e) => {
                    if (e.button === 1 && tabs.length > 1) {
                      e.preventDefault();
                      closeTab(t.id);
                    }
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setTabContextMenu({ x: e.clientX, y: e.clientY + 2, tabId: t.id });
                  }}
                  style={{
                    minWidth: tabs.length > 7 ? '95px' : '142px',
                    maxWidth: '215px',
                  }}
                  className={`group relative h-[34px] shrink-0 px-2.5 rounded-t-[8px] flex items-center gap-2 cursor-grab active:cursor-grabbing transition-colors border outline-none ${
                    isTabActive
                      ? 'bg-[#f8fafc] dark:bg-[#242830] text-[#111827] dark:text-white border-b-0 border-black/[0.08] dark:border-white/[0.08] shadow-xs z-10'
                      : 'border-transparent hover:bg-black/[0.05] dark:hover:bg-white/[0.07] text-black/75 dark:text-white/75'
                  }`}
                >
                  <ExplorerSidebar3DIcon kind={tabMeta.icon} className="w-4 h-4 shrink-0" />
                  <span className={`text-[12px] truncate flex-1 leading-none ${isTabActive ? 'font-medium' : 'font-normal'}`}>
                    {tabMeta.name}
                  </span>
                  {tabs.length > 1 && (
                    <button
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTab(t.id);
                      }}
                      aria-label={`Close ${tabMeta.name} tab`}
                      className={`w-[16px] h-[16px] rounded-[3px] flex items-center justify-center shrink-0 transition-colors border-none bg-transparent cursor-pointer ${
                        isTabActive
                          ? 'text-neutral-400 hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/15'
                          : 'opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/15'
                      }`}
                    >
                      <X className="w-3 h-3 stroke-[2.2]" />
                    </button>
                  )}
                </Reorder.Item>
              );
            })}
          </AnimatePresence>
        </Reorder.Group>
      </div>

      {/* Right scroll arrow */}
      {canScrollTabsRight && (
        <button
          type="button"
          data-window-no-drag="true"
          onClick={() => {
            tabsContainerRef.current?.scrollBy({ left: 140, behavior: 'smooth' });
          }}
          title="Scroll tabs right"
          aria-label="Scroll tabs right"
          className="h-[26px] w-5 self-center ml-1 rounded-[4px] flex items-center justify-center text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 shrink-0 cursor-pointer border-none bg-transparent"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}

      {/* New Tab (+) button directly after tabs */}
      <button
        type="button"
        data-window-no-drag="true"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          addTab();
        }}
        title="Open new tab"
        aria-label="New Explorer tab"
        className="w-7 h-7 self-center ml-1 rounded-[6px] flex items-center justify-center hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border-none bg-transparent cursor-pointer shrink-0"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>

      {/* Colored "Import" button right beside the + new tab button */}
      <button
        id="btn-fe-import-device"
        type="button"
        data-window-no-drag="true"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          fileUploadInputRef.current?.click();
        }}
        title="Import files of any format from your device"
        aria-label="Import"
        className="h-[26px] self-center ml-1.5 px-2.5 rounded-[5px] flex items-center gap-1.5 text-[11.5px] font-medium whitespace-nowrap shrink-0 cursor-pointer active:scale-[0.97] transition-all"
      >
        <Upload className="w-3.5 h-3.5 shrink-0" />
        <span>Import</span>
      </button>
    </div>
  );

  const selectedBytes = selectedEntry?.sizeBytes ? formatBytes(selectedEntry.sizeBytes) : '';
  const isSettingsView = currentDirId === 'dir-settings';
  const effectiveCompact = viewMode === 'compact' || fePrefs.compactSpacing;
  const shouldAnimateModal = !settings.reduceAllMotion && settings.animateModals;
  const itemAnimInitial = settings.reduceAllMotion ? false : ('hidden' as const);

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={() => {
        if (contextMenu) setContextMenu(null);
        if (tabContextMenu) setTabContextMenu(null);
      }}
      className="w-full h-full flex flex-col overflow-hidden bg-[#eef2f6]/95 dark:bg-[#191c22]/95 text-[#111827] dark:text-[#f3f3f3] select-none outline-none"
    >
      {/* Hidden multi-file upload input supporting ANY file format */}
      <input
        ref={fileUploadInputRef}
        type="file"
        multiple
        onChange={handleUploadFile}
        className="hidden"
      />

      {/* 1. WINUI 3 EXPLORER TAB STRIP (Merged into WindowFrame Title Bar in Windows Mode, or standalone header in Tab View) */}
      {isInsideWindowFrame && titleBarSlotEl
        ? createPortal(explorerTabStrip, titleBarSlotEl)
        : !isInsideWindowFrame
        ? explorerTabStrip
        : null}

      {/* 2. NAVIGATION + BREADCRUMB ADDRESS BAR + SEARCH ROW (Pinned on scroll) */}
      <div className="h-[46px] px-2.5 flex items-center gap-2 bg-[#f8fafc]/90 dark:bg-[#242830]/90 border-b border-black/[0.06] dark:border-white/[0.06] shrink-0">
        {/* Mobile nav drawer trigger */}
        <button
          type="button"
          onClick={() => setIsNavDrawerOpen((v) => !v)}
          className="md:hidden w-8 h-8 rounded-[6px] flex items-center justify-center hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border-none bg-transparent cursor-pointer"
          aria-label="Toggle navigation pane"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Back / Forward / Up / Refresh */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            disabled={activeTab.historyIndex <= 0}
            onClick={goBack}
            title="Back"
            className="w-8 h-8 rounded-[6px] flex items-center justify-center hover:bg-black/[0.06] dark:hover:bg-white/[0.08] disabled:opacity-35 border-none bg-transparent cursor-pointer disabled:cursor-default"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={activeTab.historyIndex >= activeTab.history.length - 1}
            onClick={goForward}
            title="Forward"
            className="w-8 h-8 rounded-[6px] flex items-center justify-center hover:bg-black/[0.06] dark:hover:bg-white/[0.08] disabled:opacity-35 border-none bg-transparent cursor-pointer disabled:cursor-default"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={!currentDirMeta.parentId}
            onClick={goUp}
            title="Up to parent folder"
            className="w-8 h-8 rounded-[6px] flex items-center justify-center hover:bg-black/[0.06] dark:hover:bg-white/[0.08] disabled:opacity-35 border-none bg-transparent cursor-pointer disabled:cursor-default"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              refreshLiveSources();
              showAppToast('Folder refreshed', { appName: 'File Explorer' });
            }}
            title="Refresh"
            className="w-8 h-8 rounded-[6px] flex items-center justify-center hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border-none bg-transparent cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Breadcrumb Address Bar */}
        <div
          id="fe-address-box"
          onClick={() => {
            if (!isEditingAddress && !isSettingsView) {
              setAddressDraft(currentDirMeta.pathLabel);
              setIsEditingAddress(true);
            }
          }}
          className="flex-1 min-w-0 h-[32px] px-2.5 rounded-[6px] bg-white/85 dark:bg-[#1a1d23]/85 border border-black/[0.09] dark:border-white/[0.1] flex items-center gap-1.5 overflow-hidden cursor-text"
        >
          <ExplorerSidebar3DIcon kind={currentDirMeta.icon} className="w-4 h-4 shrink-0" />
          {isEditingAddress ? (
            <input
              type="text"
              autoFocus
              value={addressDraft}
              onChange={(e) => setAddressDraft(e.target.value)}
              onBlur={() => setIsEditingAddress(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitAddressEdit();
                if (e.key === 'Escape') setIsEditingAddress(false);
              }}
              className="flex-1 min-w-0 !bg-transparent text-[12.5px] !outline-none !border-0 !border-b-0 !shadow-none"
            />
          ) : (
            <div className="flex items-center gap-1 min-w-0 overflow-x-auto no-scrollbar">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.id}>
                  {idx > 0 && <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-50" />}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateToDir(crumb.id);
                    }}
                    className={`px-1.5 py-0.5 rounded-[4px] text-[12.5px] whitespace-nowrap hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border-none bg-transparent cursor-pointer ${
                      idx === breadcrumbs.length - 1 ? 'font-medium' : 'opacity-80'
                    }`}
                  >
                    {crumb.name}
                  </button>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* Search Input with Taskbar Search Icon & strictly no underline */}
        <div
          id="fe-search-box"
          className="w-[170px] sm:w-[225px] md:w-[255px] h-[32px] px-2.5 rounded-[6px] bg-white/85 dark:bg-[#1a1d23]/85 border border-black/[0.09] dark:border-white/[0.1] flex items-center gap-2 shrink-0"
        >
          <FluentSearchIcon className="w-[14px] h-[14px] text-[#374151] dark:text-white/90 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search in ${currentDirMeta.name}`}
            className="flex-1 min-w-0 !bg-transparent text-[12.5px] placeholder-black/50 dark:placeholder-white/50 !outline-none !border-0 !border-b-0 !shadow-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 border-none bg-transparent cursor-pointer shrink-0"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* 3. WINUI 3 COMMAND BAR */}
      <div
        ref={menuContainerRef}
        className="min-h-[44px] py-1 px-3 flex flex-wrap items-center justify-between gap-2 bg-[#f3f5f8]/95 dark:bg-[#1e222a]/95 border-b border-black/[0.07] dark:border-white/[0.07] shrink-0 relative z-20"
      >
        <div className="flex flex-wrap items-center gap-1">
          {/* + New Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === 'new' ? null : 'new')}
              className="h-[30px] px-2.5 rounded-[6px] flex items-center gap-1.5 text-[12.5px] font-medium hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border-none bg-transparent cursor-pointer"
            >
              <span
                className="w-4 h-4 rounded-full flex items-center justify-center fluent-3d-icon"
                style={{ backgroundColor: accentColor }}
              >
                <Plus className="w-3 h-3" style={{ color: accentForeground, stroke: accentForeground }} />
              </span>
              <span>New</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>

            <AnimatePresence>
              {openMenu === 'new' && (
                <div className="absolute left-0 top-9 z-50" style={{ overflow: 'clip' }}>
                  <motion.div
                    {...contextMenuMotionProps}
                    style={flyoutPanelStyle}
                    className={`${flyoutPanelClassName} w-[215px] p-1.5`}
                  >
                  <button
                    type="button"
                    onClick={() => handleCreateItem('folder')}
                    className="w-full h-[32px] px-2.5 rounded-[5px] flex items-center gap-2.5 text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border-none bg-transparent cursor-pointer text-left"
                  >
                    <FolderPlus className="w-4 h-4 text-amber-500 fluent-3d-icon" style={{ color: '#f59e0b', stroke: '#f59e0b' }} />
                    <span>Folder</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCreateItem('text')}
                    className="w-full h-[32px] px-2.5 rounded-[5px] flex items-center gap-2.5 text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border-none bg-transparent cursor-pointer text-left"
                  >
                    <FileText className="w-4 h-4 opacity-80" />
                    <span>Text Document (.txt)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCreateItem('html')}
                    className="w-full h-[32px] px-2.5 rounded-[5px] flex items-center gap-2.5 text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border-none bg-transparent cursor-pointer text-left"
                  >
                    <FileCode2 className="w-4 h-4 fluent-3d-icon" style={{ color: '#0078d4', stroke: '#0078d4' }} />
                    <span>HTML Page (.html)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCreateItem('note')}
                    className="w-full h-[32px] px-2.5 rounded-[5px] flex items-center gap-2.5 text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border-none bg-transparent cursor-pointer text-left"
                  >
                    <StickyNote className="w-4 h-4 fluent-3d-icon" style={{ color: '#eab308', stroke: '#eab308' }} />
                    <span>Sparkle Note</span>
                  </button>
                  <div className="my-1 h-[1px] bg-black/10 dark:bg-white/10" />
                  <button
                    type="button"
                    onClick={() => {
                      setOpenMenu(null);
                      fileUploadInputRef.current?.click();
                    }}
                    className="w-full h-[32px] px-2.5 rounded-[5px] flex items-center gap-2.5 text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border-none bg-transparent cursor-pointer text-left"
                  >
                    <Upload className="w-4 h-4 opacity-80" />
                    <span>Import from PC...</span>
                  </button>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>

          <div className="h-4 w-[1px] bg-black/10 dark:bg-white/10 mx-1" />

          {/* Cut / Copy / Paste / Rename / Share / Delete */}
          <button
            type="button"
            disabled={!selectedEntry || selectedEntry.kind === 'drive'}
            onClick={() => handleCopyOrCut('cut', selectedEntry)}
            title="Cut (Ctrl+X)"
            className="w-8 h-[30px] rounded-[6px] flex items-center justify-center hover:bg-black/[0.06] dark:hover:bg-white/[0.08] disabled:opacity-35 border-none bg-transparent cursor-pointer disabled:cursor-default"
          >
            <Scissors className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={!selectedEntry || selectedEntry.kind === 'drive'}
            onClick={() => handleCopyOrCut('copy', selectedEntry)}
            title="Copy (Ctrl+C)"
            className="w-8 h-[30px] rounded-[6px] flex items-center justify-center hover:bg-black/[0.06] dark:hover:bg-white/[0.08] disabled:opacity-35 border-none bg-transparent cursor-pointer disabled:cursor-default"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={!clipboard}
            onClick={handlePaste}
            title="Paste (Ctrl+V)"
            className="w-8 h-[30px] rounded-[6px] flex items-center justify-center hover:bg-black/[0.06] dark:hover:bg-white/[0.08] disabled:opacity-35 border-none bg-transparent cursor-pointer disabled:cursor-default relative"
          >
            <ClipboardPaste className="w-4 h-4" />
            {clipboard && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#0078d4]" />
            )}
          </button>
          <button
            type="button"
            disabled={!selectedEntry || selectedEntry.kind === 'drive'}
            onClick={() => startRename(selectedEntry)}
            title="Rename (F2)"
            className="w-8 h-[30px] rounded-[6px] flex items-center justify-center hover:bg-black/[0.06] dark:hover:bg-white/[0.08] disabled:opacity-35 border-none bg-transparent cursor-pointer disabled:cursor-default"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={!selectedEntry}
            onClick={() => handleShare(selectedEntry)}
            title="Share / Copy path"
            className="w-8 h-[30px] rounded-[6px] flex items-center justify-center hover:bg-black/[0.06] dark:hover:bg-white/[0.08] disabled:opacity-35 border-none bg-transparent cursor-pointer disabled:cursor-default"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={!selectedEntry || selectedEntry.kind === 'drive'}
            onClick={() => handleDelete(selectedEntry)}
            title="Delete (Del)"
            className="w-8 h-[30px] rounded-[6px] flex items-center justify-center hover:bg-black/[0.06] dark:hover:bg-white/[0.08] disabled:opacity-35 border-none bg-transparent cursor-pointer disabled:cursor-default"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <div className="h-4 w-[1px] bg-black/10 dark:bg-white/10 mx-1" />

          {/* Sort */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === 'sort' ? null : 'sort')}
              className="h-[30px] px-2.5 rounded-[6px] flex items-center gap-1.5 text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border-none bg-transparent cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sort</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>
            <AnimatePresence>
              {openMenu === 'sort' && (
                <div className="absolute left-0 top-9 z-50" style={{ overflow: 'clip' }}>
                  <motion.div
                    {...contextMenuMotionProps}
                    style={flyoutPanelStyle}
                    className={`${flyoutPanelClassName} w-[180px] p-1.5`}
                  >
                  {(
                    [
                      ['name', 'Name'],
                      ['modifiedAt', 'Date modified'],
                      ['kind', 'Type'],
                      ['sizeBytes', 'Size'],
                    ] as Array<[SortField, string]>
                  ).map(([field, label]) => (
                    <button
                      key={field}
                      type="button"
                      onClick={() => {
                        setSortField(field);
                        setOpenMenu(null);
                      }}
                      className="w-full h-[30px] px-2.5 rounded-[5px] flex items-center justify-between text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border-none bg-transparent cursor-pointer"
                    >
                      <span>{label}</span>
                      {sortField === field && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                  <div className="my-1 h-[1px] bg-black/10 dark:bg-white/10" />
                  <button
                    type="button"
                    onClick={() => {
                      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
                      setOpenMenu(null);
                    }}
                    className="w-full h-[30px] px-2.5 rounded-[5px] flex items-center justify-between text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border-none bg-transparent cursor-pointer"
                  >
                    <span>{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
                    <ArrowUpDown className="w-3.5 h-3.5 opacity-70" />
                  </button>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* View */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === 'view' ? null : 'view')}
              className="h-[30px] px-2.5 rounded-[6px] flex items-center gap-1.5 text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border-none bg-transparent cursor-pointer"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>View</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>
            <AnimatePresence>
              {openMenu === 'view' && (
                <div className="absolute left-0 top-9 z-50" style={{ overflow: 'clip' }}>
                  <motion.div
                    {...contextMenuMotionProps}
                    style={flyoutPanelStyle}
                    className={`${flyoutPanelClassName} w-[170px] p-1.5`}
                  >
                  {(
                    [
                      ['tiles', 'Large tiles', LayoutGrid],
                      ['details', 'Details', List],
                      ['compact', 'Compact list', AlignJustify],
                    ] as Array<[ViewMode, string, React.FC<{ className?: string }>]>
                  ).map(([mode, label, Icon]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setViewMode(mode);
                        setOpenMenu(null);
                      }}
                      className="w-full h-[30px] px-2.5 rounded-[5px] flex items-center justify-between text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border-none bg-transparent cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5" />
                        <span>{label}</span>
                      </div>
                      {viewMode === mode && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Details Pane Toggle */}
        <button
          id="btn-fe-toggle-details"
          type="button"
          aria-pressed={showDetailsPane && !isSettingsView}
          disabled={isSettingsView}
          onClick={() => setShowDetailsPane((v) => !v)}
          title={showDetailsPane ? 'Hide details pane' : 'Show details pane'}
          className={`h-[30px] px-2.5 rounded-[6px] flex items-center gap-1.5 text-[12.5px] font-medium border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default shrink-0 ${
            showDetailsPane && !isSettingsView
              ? 'bg-white dark:bg-[#2b303a] border-black/15 dark:border-white/15 shadow-xs'
              : 'bg-transparent border-transparent hover:bg-black/[0.06] dark:hover:bg-white/[0.08]'
          }`}
        >
          <PanelRight className="w-3.5 h-3.5" />
          <span>Details</span>
        </button>
      </div>

      {/* 4. MAIN 3-COLUMN WORKSPACE (Only sidebar, center content, and details pane scroll) */}
      <div className="flex-1 min-h-0 flex relative overflow-hidden">
        {/* Mobile Overlay Sidebar Drawer */}
        {isNavDrawerOpen && (
          <div
            onClick={() => setIsNavDrawerOpen(false)}
            className="md:hidden fixed inset-0 bg-black/30 z-30"
          />
        )}
        <aside
          className={`${
            isNavDrawerOpen
              ? 'fixed inset-y-0 left-0 z-40 w-[225px] bg-[#f3f5f8] dark:bg-[#191c22] shadow-2xl pt-3'
              : 'hidden'
          } md:block md:w-[205px] lg:w-[218px] shrink-0 overflow-hidden border-r border-black/[0.06] dark:border-white/[0.06]`}
        >
          {renderSidebarNav()}
        </aside>

        {/* Center Content Canvas */}
        <div
          onContextMenu={(e) => {
            if (isSettingsView) return;
            if ((e.target as HTMLElement).closest('[data-fe-row]')) return;
            e.preventDefault();
            setContextMenu({ x: e.clientX, y: e.clientY, entry: null });
          }}
          className="flex-1 min-w-0 m-2 mr-1.5 rounded-[8px] bg-white/85 dark:bg-[#22262e]/85 border border-black/[0.06] dark:border-white/[0.07] overflow-y-auto overflow-x-hidden sidebar-scroller p-4 sm:p-5 space-y-5"
        >
          {/* FILE EXPLORER SETTINGS PAGE (Matching Widget Board Settings Tab layout) */}
          {isSettingsView ? (
            <motion.div
              key={`${activeTabId}-dir-settings`}
              variants={explorerItemSlideUpVariant}
              initial={itemAnimInitial}
              animate="visible"
              custom={0}
              className="px-1 sm:px-2 py-1 space-y-5 max-w-[760px]"
            >
              <h2 className="text-[18px] font-semibold tracking-tight">Settings</h2>

              <div className="space-y-2.5">
                {/* Details Pane Default Toggle */}
                <motion.div
                  variants={explorerItemSlideUpVariant}
                  initial={itemAnimInitial}
                  animate="visible"
                  custom={1}
                  className="rounded-[8px] border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.04] px-4 py-3.5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={FILE_EXPLORER_ICON_URL}
                      alt="File Explorer"
                      className="fluent-3d-icon w-6 h-6 object-contain shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-medium">Details pane</div>
                      <div className="text-[11.5px] text-black/60 dark:text-white/60">
                        Show file properties, preview, and quick open actions on the right
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <ExplorerToggle
                      checked={fePrefs.showDetailsByDefault}
                      onChange={() => {
                        const nextVal = !fePrefs.showDetailsByDefault;
                        updateFePrefs((p) => ({ ...p, showDetailsByDefault: nextVal }));
                        setShowDetailsPane(nextVal);
                      }}
                      ariaLabel="Toggle Details pane default"
                    />
                    <span className="text-[12.5px] w-7">{fePrefs.showDetailsByDefault ? 'On' : 'Off'}</span>
                  </div>
                </motion.div>

                {/* Launch Location Card */}
                <motion.div
                  variants={explorerItemSlideUpVariant}
                  initial={itemAnimInitial}
                  animate="visible"
                  custom={2}
                  className="rounded-[8px] border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.04] px-4 py-3.5 flex flex-wrap items-center justify-between gap-4"
                >
                  <div>
                    <div className="text-[13.5px] font-medium">Open File Explorer to</div>
                    <div className="text-[11.5px] text-black/60 dark:text-white/60">
                      Choose the default starting folder when opening a new Explorer tab
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {(
                      [
                        ['dir-home', 'Home'],
                        ['dir-this-pc', 'This PC'],
                      ] as const
                    ).map(([dirKey, label]) => {
                      const active = fePrefs.defaultDir === dirKey;
                      return (
                        <button
                          key={dirKey}
                          type="button"
                          onClick={() => updateFePrefs((p) => ({ ...p, defaultDir: dirKey }))}
                          className={`h-8 px-3.5 rounded-[6px] border text-[12.5px] font-medium cursor-pointer transition-colors ${
                            active
                              ? 'fluent-btn-primary bg-[#0063B8] dark:bg-[#4CC2FF] border-transparent'
                              : 'bg-white dark:bg-white/[0.08] hover:bg-black/[0.04] dark:hover:bg-white/[0.12] border-black/15 dark:border-white/15'
                          }`}
                          style={active ? { backgroundColor: accentColor, color: accentForeground } : undefined}
                        >
                          <span style={active ? { color: accentForeground } : undefined}>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>

                {/* More settings */}
                <motion.div
                  variants={explorerItemSlideUpVariant}
                  initial={itemAnimInitial}
                  animate="visible"
                  custom={3}
                  className="pt-2 space-y-2"
                >
                  <h3 className="text-[13px] font-semibold">More settings</h3>

                  <div className="rounded-[8px] border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.04] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setMoreSettingsExpanded((v) => !v)}
                      className="w-full px-4 py-3.5 flex items-center justify-between gap-4 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] cursor-pointer border-none bg-transparent text-left"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <SlidersHorizontal className="w-4 h-4 shrink-0" />
                        <div>
                          <div className="text-[13.5px] font-medium">Folder & display options</div>
                          <div className="text-[11.5px] text-black/60 dark:text-white/60">
                            Manage file name extensions, status badges, and interaction behavior
                          </div>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-transform ${moreSettingsExpanded ? 'rotate-90' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {moreSettingsExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden border-t border-black/[0.06] dark:border-white/[0.07]"
                        >
                          <div className="px-11 py-3 space-y-3 text-[12.5px]">
                            <div className="flex items-center justify-between gap-4">
                              <span>Show file name extensions</span>
                              <ExplorerToggle
                                checked={fePrefs.showFileExtensions}
                                onChange={() =>
                                  updateFePrefs((p) => ({ ...p, showFileExtensions: !p.showFileExtensions }))
                                }
                                ariaLabel="Show file name extensions"
                              />
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span>Show cloud & sync status icons</span>
                              <ExplorerToggle
                                checked={fePrefs.showStatusBadges}
                                onChange={() =>
                                  updateFePrefs((p) => ({ ...p, showStatusBadges: !p.showStatusBadges }))
                                }
                                ariaLabel="Show cloud and sync status icons"
                              />
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span>Double-click to open items (single-click selects)</span>
                              <ExplorerToggle
                                checked={fePrefs.doubleClickToOpen}
                                onChange={() =>
                                  updateFePrefs((p) => ({ ...p, doubleClickToOpen: !p.doubleClickToOpen }))
                                }
                                ariaLabel="Double click to open items"
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Compact view mode toggle */}
                  <div className="rounded-[8px] border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.04] px-4 py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <AlignJustify className="w-4 h-4 shrink-0" />
                      <div>
                        <div className="text-[13.5px] font-medium">Use compact view</div>
                        <div className="text-[11.5px] text-black/60 dark:text-white/60">
                          Decrease space between items to show more files in the list
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <ExplorerToggle
                        checked={fePrefs.compactSpacing}
                        onChange={() =>
                          updateFePrefs((p) => ({ ...p, compactSpacing: !p.compactSpacing }))
                        }
                        ariaLabel="Use compact view"
                      />
                      <span className="text-[12.5px] w-7">{fePrefs.compactSpacing ? 'On' : 'Off'}</span>
                    </div>
                  </div>
                </motion.div>

                {/* About */}
                <motion.div
                  variants={explorerItemSlideUpVariant}
                  initial={itemAnimInitial}
                  animate="visible"
                  custom={4}
                  className="pt-2 space-y-2"
                >
                  <h3 className="text-[13px] font-semibold">About</h3>

                  <div className="rounded-[8px] border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.04] overflow-hidden divide-y divide-black/[0.06] dark:divide-white/[0.07]">
                    <button
                      type="button"
                      onClick={() => setAboutExpanded((v) => !v)}
                      className="w-full px-4 py-3.5 flex items-center justify-between gap-4 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] cursor-pointer border-none bg-transparent text-left"
                    >
                      <div className="flex items-center gap-3.5">
                        <Info className="w-4 h-4 shrink-0" />
                        <div>
                          <div className="text-[13.5px] font-medium">File Explorer</div>
                          <div className="text-[11.5px] tabular-nums text-black/60 dark:text-white/60">
                            Version: 22631.26170.0 · Build 26170
                          </div>
                        </div>
                      </div>
                      {aboutExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {aboutExpanded && (
                      <>
                        {[
                          {
                            label: 'Open PC Settings',
                            action: () => navigate?.('/pc-settings'),
                          },
                          {
                            label: 'Give feedback',
                            action: () => navigate?.('/feedback'),
                          },
                          {
                            label: 'Restore default File Explorer preferences',
                            action: () => {
                              updateFePrefs(() => DEFAULT_EXPLORER_PREFS);
                              setViewMode(DEFAULT_EXPLORER_PREFS.defaultViewMode);
                              setShowDetailsPane(DEFAULT_EXPLORER_PREFS.showDetailsByDefault);
                              showAppToast('File Explorer settings restored to defaults', { appName: 'File Explorer' });
                            },
                          },
                        ].map((row) => (
                          <button
                            key={row.label}
                            type="button"
                            onClick={row.action}
                            className="w-full px-11 py-3 flex items-center justify-between text-[13px] hover:bg-black/[0.03] dark:hover:bg-white/[0.04] cursor-pointer border-none bg-transparent text-left"
                          >
                            <span>{row.label}</span>
                            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <div key={`${activeTabId}-${currentDirId}-${viewMode}`} className="space-y-5">
          {/* SEARCH HEADER BANNER WHEN SEARCHING */}
          {searchQuery.trim() && (
            <motion.div
              variants={explorerItemSlideUpVariant}
              initial={itemAnimInitial}
              animate="visible"
              custom={0}
              className="flex items-center justify-between pb-2 border-b border-black/[0.06] dark:border-white/[0.08]"
            >
              <div className="text-[13px] font-semibold">
                Search results for "{searchQuery.trim()}" ({visibleEntries.length})
              </div>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[12px] px-2.5 py-1 rounded-[5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border-none bg-transparent cursor-pointer"
              >
                Clear search
              </button>
            </motion.div>
          )}

          {/* HOME SECTIONS: Favorites + Drives + Recent */}
          {currentDirId === 'dir-home' && !searchQuery.trim() && (
            <>
              {/* Favorites */}
              <motion.section
                variants={explorerItemSlideUpVariant}
                initial={itemAnimInitial}
                animate="visible"
                custom={0}
                className="space-y-2.5"
              >
                <button
                  type="button"
                  onClick={() => setFavoritesOpen((v) => !v)}
                  className="flex items-center gap-1.5 text-[13px] font-semibold border-none bg-transparent cursor-pointer p-0"
                >
                  {favoritesOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  <span>Favorites</span>
                </button>
                {favoritesOpen && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {homeFavorites.map((item, idx) => {
                      const isSel = selectedEntry?.id === item.id;
                      return (
                        <motion.div
                          key={item.id}
                          variants={explorerItemSlideUpVariant}
                          initial={itemAnimInitial}
                          animate="visible"
                          custom={idx + 1}
                          data-fe-row="true"
                          onClick={() => setSelectedId(item.id)}
                          onDoubleClick={() => openEntry(item)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setSelectedId(item.id);
                            setContextMenu({ x: e.clientX, y: e.clientY, entry: item });
                          }}
                          className={`p-3 rounded-[8px] flex flex-col items-center text-center gap-2.5 cursor-pointer transition-all relative ${
                            isSel
                              ? 'border-[2px] border-[#0063B8] dark:border-[#4CC2FF] bg-[#0063B8]/[0.06] dark:bg-white/[0.05]'
                              : 'border-[2px] border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.03] hover:bg-black/[0.05] dark:hover:bg-white/[0.07]'
                          }`}
                        >
                          {isSel && (
                            <span
                              className="fluent-3d-icon absolute top-2 left-2 w-[16px] h-[16px] rounded-[4px] flex items-center justify-center"
                              style={{ backgroundColor: accentColor }}
                            >
                              <Check className="w-3 h-3 stroke-[2.6]" style={{ color: accentForeground, stroke: accentForeground }} />
                            </span>
                          )}
                          <div className="w-16 h-14 rounded-[6px] bg-white dark:bg-[#191c22] border border-black/[0.07] dark:border-white/[0.08] flex items-center justify-center shadow-xs">
                            <ExplorerItemIcon entry={item} size="md" />
                          </div>
                          <div className="w-full text-[12px] font-medium truncate">{getDisplayName(item)}</div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.section>

              {/* Drives */}
              <motion.section
                variants={explorerItemSlideUpVariant}
                initial={itemAnimInitial}
                animate="visible"
                custom={2}
                className="space-y-2.5"
              >
                <button
                  type="button"
                  onClick={() => setDrivesOpen((v) => !v)}
                  className="flex items-center gap-1.5 text-[13px] font-semibold border-none bg-transparent cursor-pointer p-0"
                >
                  {drivesOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  <span>Drives</span>
                </button>
                {drivesOpen && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {homeDrives.map((drv, idx) => {
                      const used = drv.driveUsedGb || 87;
                      const total = drv.driveTotalGb || 222;
                      const free = Math.max(0, total - used);
                      const pct = Math.min(100, Math.round((used / total) * 100));
                      const isSel = selectedEntry?.id === drv.id;
                      return (
                        <motion.div
                          key={drv.id}
                          variants={explorerItemSlideUpVariant}
                          initial={itemAnimInitial}
                          animate="visible"
                          custom={idx + 3}
                          data-fe-row="true"
                          onClick={() => setSelectedId(drv.id)}
                          onDoubleClick={() => openEntry(drv)}
                          className={`p-3 rounded-[8px] flex items-center gap-3 cursor-pointer transition-all ${
                            isSel
                              ? 'border-[2px] border-[#0063B8] dark:border-[#4CC2FF] bg-[#0063B8]/[0.06] dark:bg-white/[0.05]'
                              : 'border-[2px] border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.03] hover:bg-black/[0.05] dark:hover:bg-white/[0.07]'
                          }`}
                        >
                          <ExplorerItemIcon entry={drv} size="lg" />
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="text-[12.5px] font-semibold truncate">{drv.name}</div>
                            <div className="h-[7px] w-full rounded-full bg-black/[0.1] dark:bg-white/[0.12] overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: pct > 88 ? '#dc2626' : accentColor,
                                }}
                              />
                            </div>
                            <div className="text-[11px] text-black/60 dark:text-white/60 truncate">
                              {free} GB free of {total} GB
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.section>

              {/* Recent Header */}
              <motion.button
                variants={explorerItemSlideUpVariant}
                initial={itemAnimInitial}
                animate="visible"
                custom={4}
                type="button"
                onClick={() => setRecentOpen((v) => !v)}
                className="flex items-center gap-1.5 text-[13px] font-semibold border-none bg-transparent cursor-pointer p-0"
              >
                {recentOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                <span>Recent</span>
              </motion.button>
            </>
          )}

          {/* THIS PC FOLDERS GRID */}
          {currentDirId === 'dir-this-pc' && !searchQuery.trim() && (
            <>
              <motion.section
                variants={explorerItemSlideUpVariant}
                initial={itemAnimInitial}
                animate="visible"
                custom={0}
                className="space-y-2.5"
              >
                <button
                  type="button"
                  onClick={() => setPcFoldersOpen((v) => !v)}
                  className="flex items-center gap-1.5 text-[13px] font-semibold border-none bg-transparent cursor-pointer p-0"
                >
                  {pcFoldersOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  <span>Folders (6)</span>
                </button>
                {pcFoldersOpen && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                    {[
                      { id: 'dir-desktop', name: 'Desktop' },
                      { id: 'dir-documents', name: 'Documents' },
                      { id: 'dir-downloads', name: 'Downloads' },
                      { id: 'dir-music', name: 'Music' },
                      { id: 'dir-pictures', name: 'Pictures' },
                      { id: 'dir-videos', name: 'Videos' },
                    ].map((f, idx) => (
                      <motion.button
                        key={f.id}
                        variants={explorerItemSlideUpVariant}
                        initial={itemAnimInitial}
                        animate="visible"
                        custom={idx + 1}
                        type="button"
                        onClick={() => navigateToDir(f.id)}
                        className="p-2.5 rounded-[8px] border border-black/[0.06] dark:border-white/[0.07] bg-black/[0.02] dark:bg-white/[0.03] hover:bg-black/[0.05] dark:hover:bg-white/[0.07] flex items-center gap-3 text-left cursor-pointer"
                      >
                        <FluentFolder3D className="w-8 h-8" />
                        <span className="text-[12.5px] font-medium truncate">{f.name}</span>
                      </motion.button>
                    ))}
                  </div>
                )}
              </motion.section>

              <motion.section
                variants={explorerItemSlideUpVariant}
                initial={itemAnimInitial}
                animate="visible"
                custom={4}
                className="space-y-2.5"
              >
                <button
                  type="button"
                  onClick={() => setPcDrivesOpen((v) => !v)}
                  className="flex items-center gap-1.5 text-[13px] font-semibold border-none bg-transparent cursor-pointer p-0"
                >
                  {pcDrivesOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  <span>Devices and drives ({homeDrives.length})</span>
                </button>
                {pcDrivesOpen && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {homeDrives.map((drv, idx) => {
                      const used = drv.driveUsedGb || 87;
                      const total = drv.driveTotalGb || 222;
                      const free = Math.max(0, total - used);
                      const pct = Math.min(100, Math.round((used / total) * 100));
                      return (
                        <motion.div
                          key={drv.id}
                          variants={explorerItemSlideUpVariant}
                          initial={itemAnimInitial}
                          animate="visible"
                          custom={idx + 5}
                          onClick={() => setSelectedId(drv.id)}
                          onDoubleClick={() => openEntry(drv)}
                          className={`p-3 rounded-[8px] flex items-center gap-3 cursor-pointer transition-all ${
                            selectedEntry?.id === drv.id
                              ? 'border-[2px] border-[#0063B8] dark:border-[#4CC2FF] bg-[#0063B8]/[0.06] dark:bg-white/[0.05]'
                              : 'border-[2px] border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.03] hover:bg-black/[0.05] dark:hover:bg-white/[0.07]'
                          }`}
                        >
                          <ExplorerItemIcon entry={drv} size="lg" />
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="text-[12.5px] font-semibold truncate">{drv.name}</div>
                            <div className="h-[7px] w-full rounded-full bg-black/[0.1] dark:bg-white/[0.12] overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: pct > 88 ? '#dc2626' : accentColor }} />
                            </div>
                            <div className="text-[11px] text-black/60 dark:text-white/60 truncate">
                              {free} GB free of {total} GB
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.section>
            </>
          )}

          {/* FILE LISTING (Recent on Home or any Directory listing) */}
          {(currentDirId !== 'dir-this-pc' || searchQuery.trim() !== '') &&
            (currentDirId !== 'dir-home' || recentOpen || searchQuery.trim() !== '') && (
              <div>
                {visibleEntries.length === 0 ? (
                  <motion.div
                    variants={explorerItemSlideUpVariant}
                    initial={itemAnimInitial}
                    animate="visible"
                    custom={0}
                    className="py-16 flex flex-col items-center justify-center text-center gap-3"
                  >
                    <FluentFolder3D className="w-12 h-12 opacity-80" />
                    <div className="text-[13.5px] font-medium">
                      {currentDirId === 'dir-imported' ? 'No imported files yet' : 'This folder is empty'}
                    </div>
                    <div className="text-[12px] text-black/60 dark:text-white/60">
                      {currentDirId === 'dir-imported'
                        ? 'Import files of any format from your device to store and access them here.'
                        : 'Create a new folder, document, or import files from your computer.'}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {currentDirId !== 'dir-imported' && (
                        <button
                          type="button"
                          onClick={() => handleCreateItem('folder')}
                          className="fluent-btn-primary h-[30px] px-3 rounded-[6px] bg-[#0063B8] dark:bg-[#4CC2FF] text-[12px] font-medium cursor-pointer border-none"
                          style={{ backgroundColor: accentColor, color: accentForeground }}
                        >
                          <span style={{ color: accentForeground }}>New folder</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => fileUploadInputRef.current?.click()}
                        className={
                          currentDirId === 'dir-imported'
                            ? 'fluent-btn-primary h-[30px] px-3 rounded-[6px] bg-[#0063B8] dark:bg-[#4CC2FF] text-[12px] font-medium cursor-pointer border-none'
                            : 'h-[30px] px-3 rounded-[6px] border border-black/15 dark:border-white/15 bg-black/[0.03] dark:bg-white/[0.06] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] text-[12px] font-medium cursor-pointer'
                        }
                        style={currentDirId === 'dir-imported' ? { backgroundColor: accentColor, color: accentForeground } : undefined}
                      >
                        <span style={currentDirId === 'dir-imported' ? { color: accentForeground } : undefined}>Import file</span>
                      </button>
                    </div>
                  </motion.div>
                ) : viewMode === 'tiles' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5">
                    {visibleEntries.map((item, idx) => {
                      const isSel = selectedEntry?.id === item.id;
                      return (
                        <motion.div
                          key={item.id}
                          variants={explorerItemSlideUpVariant}
                          initial={itemAnimInitial}
                          animate="visible"
                          custom={idx + (currentDirId === 'dir-home' ? 5 : 0)}
                          data-fe-row="true"
                          onClick={() => {
                            setSelectedId(item.id);
                            if (!fePrefs.doubleClickToOpen) openEntry(item);
                          }}
                          onDoubleClick={() => openEntry(item)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setSelectedId(item.id);
                            setContextMenu({ x: e.clientX, y: e.clientY, entry: item });
                          }}
                          className={`p-2.5 rounded-[8px] flex flex-col items-center text-center gap-2 cursor-pointer transition-all relative ${
                            isSel
                              ? 'border-[2px] border-[#0063B8] dark:border-[#4CC2FF] bg-[#0063B8]/[0.06] dark:bg-white/[0.05]'
                              : 'border-[2px] border-transparent bg-transparent hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                          }`}
                        >
                          {isSel && (
                            <span
                              className="fluent-3d-icon absolute top-2 left-2 w-[16px] h-[16px] rounded-[4px] flex items-center justify-center"
                              style={{ backgroundColor: accentColor }}
                            >
                              <Check className="w-3 h-3 stroke-[2.6]" style={{ color: accentForeground, stroke: accentForeground }} />
                            </span>
                          )}
                          <ExplorerItemIcon entry={item} size="lg" />
                          <div className="w-full text-[12px] font-medium truncate" title={item.name}>
                            {getDisplayName(item)}
                          </div>
                          <div className="text-[10.5px] text-black/55 dark:text-white/55 truncate w-full">
                            {item.kind === 'folder' ? item.locationLabel : formatBytes(item.sizeBytes)}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="w-full space-y-1">
                    {viewMode === 'details' && !effectiveCompact && (
                      <motion.div
                        variants={explorerItemSlideUpVariant}
                        initial={itemAnimInitial}
                        animate="visible"
                        custom={currentDirId === 'dir-home' ? 4 : 0}
                        className="flex items-center px-3 py-1.5 border-b border-black/[0.07] dark:border-white/[0.08] text-[11.5px] font-medium text-black/60 dark:text-white/60"
                      >
                        <div
                          onClick={() => {
                            if (sortField === 'name') setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
                            else setSortField('name');
                          }}
                          className="flex-1 min-w-0 pl-8 cursor-pointer hover:text-black dark:hover:text-white"
                        >
                          Name
                        </div>
                        <div className="w-20 shrink-0 hidden sm:block" />
                        <div
                          onClick={() => {
                            if (sortField === 'modifiedAt') setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
                            else setSortField('modifiedAt');
                          }}
                          className="w-[138px] shrink-0 hidden sm:block cursor-pointer hover:text-black dark:hover:text-white"
                        >
                          Date modified
                        </div>
                        {fePrefs.showStatusBadges && (
                          <div className="w-12 text-center shrink-0 hidden md:block">Status</div>
                        )}
                        <div
                          onClick={() => {
                            if (sortField === 'sizeBytes') setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
                            else setSortField('sizeBytes');
                          }}
                          className="w-16 text-right shrink-0 cursor-pointer hover:text-black dark:hover:text-white"
                        >
                          Size
                        </div>
                      </motion.div>
                    )}

                    <div className="space-y-1">
                      {visibleEntries.map((item, idx) => {
                        const isSel = selectedEntry?.id === item.id;
                        return (
                          <motion.div
                            key={item.id}
                            variants={explorerItemSlideUpVariant}
                            initial={itemAnimInitial}
                            animate="visible"
                            custom={idx + (currentDirId === 'dir-home' ? 5 : 1)}
                            data-fe-row="true"
                            onClick={() => {
                              setSelectedId(item.id);
                              if (!fePrefs.doubleClickToOpen) openEntry(item);
                            }}
                            onDoubleClick={() => openEntry(item)}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setSelectedId(item.id);
                              setContextMenu({ x: e.clientX, y: e.clientY, entry: item });
                            }}
                            className={`group px-2.5 rounded-[6px] flex items-center gap-3 cursor-pointer transition-colors ${
                              effectiveCompact ? 'py-1.5 min-h-[32px]' : 'py-2 min-h-[48px]'
                            } ${
                              isSel
                                ? 'border-[2px] border-[#0063B8] dark:border-[#4CC2FF] bg-[#0063B8]/[0.05] dark:bg-white/[0.04]'
                                : 'border-[2px] border-transparent hover:bg-black/[0.04] dark:hover:bg-white/[0.05]'
                            } ${clipboard?.mode === 'cut' && clipboard.entryId === item.id ? 'opacity-50' : ''}`}
                          >
                            {/* Selection Checkbox matching reference screenshot */}
                            <button
                              type="button"
                              aria-label={`Select ${item.name}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedId(item.id);
                              }}
                              className={`fluent-3d-icon w-[18px] h-[18px] rounded-[4px] flex items-center justify-center shrink-0 cursor-pointer transition-opacity ${
                                isSel
                                  ? 'opacity-100 border-none'
                                  : 'opacity-0 group-hover:opacity-100 border border-black/30 dark:border-white/35 bg-transparent'
                              }`}
                              style={isSel ? { backgroundColor: accentColor } : undefined}
                            >
                              {isSel && (
                                <Check
                                  className="w-3.5 h-3.5 stroke-[2.6]"
                                  style={{ color: accentForeground, stroke: accentForeground }}
                                />
                              )}
                            </button>

                            {/* File Thumbnail / 3D Icon */}
                            {item.kind === 'image' && item.thumbnailUrl && !effectiveCompact ? (
                              <div className="w-[34px] h-[22px] rounded-[3px] overflow-hidden border border-black/10 dark:border-white/15 shrink-0 bg-black/15">
                                <img
                                  src={item.thumbnailUrl}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <ExplorerItemIcon entry={item} size="sm" />
                            )}

                            {/* File Name + Location Subtitle (2-line stack in Details view, matching screenshot) */}
                            <div className="flex-1 min-w-0">
                              <div className="text-[13px] font-medium truncate leading-tight">
                                {getDisplayName(item)}
                              </div>
                              {!effectiveCompact && (
                                <div className="text-[11.5px] text-black/55 dark:text-white/55 truncate leading-tight mt-0.5">
                                  {item.locationLabel}
                                </div>
                              )}
                            </div>

                            {/* Quick Row Actions (Open folder & More ... matching screenshot) */}
                            <div
                              className={`flex items-center gap-1 shrink-0 transition-opacity ${
                                isSel ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                              }`}
                            >
                              <button
                                type="button"
                                title="Open containing location"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (item.targetDirId) navigateToDir(item.targetDirId);
                                  else navigateToDir(item.parentId || 'dir-home');
                                }}
                                className="w-7 h-7 rounded-[5px] flex items-center justify-center hover:bg-black/[0.08] dark:hover:bg-white/[0.1] border-none bg-transparent cursor-pointer"
                              >
                                <Folder className="w-4 h-4 opacity-75" />
                              </button>
                              <button
                                type="button"
                                title="More options"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedId(item.id);
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setContextMenu({ x: rect.left, y: rect.bottom + 4, entry: item });
                                }}
                                className="w-7 h-7 rounded-[5px] flex items-center justify-center hover:bg-black/[0.08] dark:hover:bg-white/[0.1] border-none bg-transparent cursor-pointer"
                              >
                                <MoreHorizontal className="w-4 h-4 opacity-80" />
                              </button>
                            </div>

                            {/* Date Modified */}
                            {viewMode === 'details' && (
                              <div className="w-[138px] shrink-0 text-[12px] text-black/65 dark:text-white/65 tabular-nums whitespace-nowrap hidden sm:block">
                                {formatDateTime(item.modifiedAt)}
                              </div>
                            )}

                            {/* Sync Status */}
                            {fePrefs.showStatusBadges && (
                              <div className="w-10 text-center shrink-0 hidden md:flex items-center justify-center">
                                {item.status === 'cloud' ? (
                                  <span
                                    className="fluent-3d-icon w-2.5 h-2.5 rounded-full inline-block"
                                    style={{ backgroundColor: '#0284c7' }}
                                    title="Available online"
                                  />
                                ) : (
                                  <CheckCircle2
                                    className="w-3.5 h-3.5 fluent-3d-icon"
                                    style={{ color: '#16a34a', stroke: '#16a34a' }}
                                  />
                                )}
                              </div>
                            )}

                            {/* File Size */}
                            <div className="w-16 text-right text-[12px] text-black/65 dark:text-white/65 tabular-nums whitespace-nowrap shrink-0">
                              {item.kind === 'folder' ? '—' : formatBytes(item.sizeBytes)}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
            </div>
          )}
        </div>

        {/* Right Details Pane */}
        <AnimatePresence initial={false}>
          {showDetailsPane && !isSettingsView && (
            <motion.aside
              initial={{ width: 0, opacity: 0, marginRight: 0, marginLeft: 0 }}
              animate={{ width: 268, opacity: 1, marginRight: 8, marginLeft: 2 }}
              exit={{ width: 0, opacity: 0, marginRight: 0, marginLeft: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              style={{ maxWidth: '45vw' }}
              className="flex flex-col shrink-0 my-2 rounded-[8px] bg-white/85 dark:bg-[#22262e]/85 border border-black/[0.06] dark:border-white/[0.07] overflow-hidden"
            >
              <div className="w-[268px] flex-1 overflow-y-auto sidebar-scroller p-3.5 space-y-4">
                {selectedEntry ? (
                  <>
                    {/* Preview Header */}
                    <div className="space-y-2.5">
                      <div className="w-full h-[132px] rounded-[8px] overflow-hidden border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.04] dark:bg-[#14171c] flex items-center justify-center">
                        {selectedEntry.thumbnailUrl ? (
                          <img
                            src={selectedEntry.thumbnailUrl}
                            alt={selectedEntry.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ExplorerItemIcon entry={selectedEntry} size="lg" />
                        )}
                      </div>
                      <div className="text-[13.5px] font-semibold break-words leading-snug">
                        {selectedEntry.name}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleShare(selectedEntry)}
                          className="h-[30px] px-3 rounded-[6px] border border-black/15 dark:border-white/15 bg-white dark:bg-white/[0.06] hover:bg-black/[0.04] dark:hover:bg-white/[0.1] text-[12px] font-medium flex items-center gap-1.5 cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Share</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openEntry(selectedEntry, true)}
                          className="fluent-btn-primary flex-1 h-[30px] px-3 rounded-[6px] bg-[#0063B8] dark:bg-[#4CC2FF] text-[12px] font-medium flex items-center justify-center gap-1.5 cursor-pointer border-none"
                          style={{ backgroundColor: accentColor, color: accentForeground }}
                        >
                          <span className="truncate" style={{ color: accentForeground }}>
                            {getOpenAppLabel(selectedEntry)}
                          </span>
                          <ExternalLink className="w-3 h-3 shrink-0" style={{ color: accentForeground, stroke: accentForeground }} />
                        </button>
                      </div>
                    </div>

                    <div className="h-[1px] bg-black/[0.07] dark:bg-white/[0.08]" />

                    {/* Details Table */}
                    <div className="space-y-2">
                      <div className="text-[12px] font-semibold">Details</div>
                      <div className="space-y-1.5 text-[11.5px]">
                        <div className="flex justify-between gap-3">
                          <span className="text-black/55 dark:text-white/55">Type</span>
                          <span className="font-medium text-right truncate">{getKindLabel(selectedEntry.kind, selectedEntry.fileExtension)}</span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span className="text-black/55 dark:text-white/55">Size</span>
                          <span className="font-medium text-right">
                            {selectedEntry.kind === 'folder' ? 'Folder' : formatBytes(selectedEntry.sizeBytes)}
                          </span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span className="text-black/55 dark:text-white/55 shrink-0">File location</span>
                          <span className="font-medium text-right truncate" title={selectedEntry.pathLabel}>
                            {selectedEntry.pathLabel}
                          </span>
                        </div>
                        {selectedEntry.dimensions && (
                          <div className="flex justify-between gap-3">
                            <span className="text-black/55 dark:text-white/55">Dimensions</span>
                            <span className="font-medium text-right">
                              {selectedEntry.dimensions.width} × {selectedEntry.dimensions.height}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between gap-3">
                          <span className="text-black/55 dark:text-white/55">Modified</span>
                          <span className="font-medium text-right">{formatDateTime(selectedEntry.modifiedAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="h-[1px] bg-black/[0.07] dark:bg-white/[0.08]" />

                    {/* Activity */}
                    <div className="space-y-2">
                      <div className="text-[12px] font-semibold">Activity</div>
                      <div className="space-y-2 text-[11.5px] text-black/70 dark:text-white/70">
                        <div className="flex items-start gap-2">
                          <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-70" />
                          <span>Modified on {formatDateTime(selectedEntry.modifiedAt)}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle2
                            className="w-3.5 h-3.5 mt-0.5 shrink-0 fluent-3d-icon"
                            style={{ color: '#16a34a', stroke: '#16a34a' }}
                          />
                          <span>Available in Sparkle Workspace</span>
                        </div>
                      </div>
                    </div>

                    <div className="h-[1px] bg-black/[0.07] dark:bg-white/[0.08]" />

                    {/* Related files */}
                    <div className="space-y-1.5">
                      <div className="text-[12px] font-semibold">Related files</div>
                      {visibleEntries
                        .filter((it) => it.id !== selectedEntry.id)
                        .slice(0, 3)
                        .map((rel) => (
                          <button
                            key={rel.id}
                            type="button"
                            onClick={() => setSelectedId(rel.id)}
                            className="w-full px-2 py-1.5 rounded-[5px] flex items-center gap-2 hover:bg-black/[0.05] dark:hover:bg-white/[0.07] border-none bg-transparent cursor-pointer text-left"
                          >
                            <ExplorerItemIcon entry={rel} size="sm" />
                            <span className="text-[11.5px] truncate">{rel.name}</span>
                          </button>
                        ))}
                    </div>
                  </>
                ) : (
                  <div className="py-12 text-center text-[12px] text-black/60 dark:text-white/60">
                    Select a file or folder to inspect details.
                  </div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* 5. BOTTOM STATUS BAR */}
      <div className="h-[28px] px-3.5 flex items-center justify-between text-[11.5px] text-black/65 dark:text-white/65 border-t border-black/[0.06] dark:border-white/[0.07] bg-[#f3f5f8]/95 dark:bg-[#191c22]/95 shrink-0">
        <div className="flex items-center gap-2.5 truncate">
          <span>{visibleEntries.length} items</span>
          {selectedEntry && (
            <>
              <span className="opacity-40">|</span>
              <span className="truncate">
                1 item selected {selectedBytes ? `(${selectedBytes})` : ''}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('details')}
            title="Details view"
            className={`w-6 h-5 rounded-[4px] flex items-center justify-center border-none cursor-pointer ${
              viewMode === 'details' ? 'bg-black/10 dark:bg-white/15' : 'bg-transparent hover:bg-black/[0.05] dark:hover:bg-white/[0.08]'
            }`}
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('tiles')}
            title="Large tiles view"
            className={`w-6 h-5 rounded-[4px] flex items-center justify-center border-none cursor-pointer ${
              viewMode === 'tiles' ? 'bg-black/10 dark:bg-white/15' : 'bg-transparent hover:bg-black/[0.05] dark:hover:bg-white/[0.08]'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* RIGHT-CLICK WINUI 3 CONTEXT MENU */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {contextMenu && (
              <div
                data-fe-context-menu="true"
                style={{
                  position: 'fixed',
                  left: Math.min(contextMenu.x, window.innerWidth - 220),
                  top: Math.min(contextMenu.y, window.innerHeight - 280),
                  zIndex: 9995,
                  overflow: 'clip',
                }}
              >
                <motion.div
                  {...contextMenuMotionProps}
                  style={flyoutPanelStyle}
                  className={`${flyoutPanelClassName} w-[210px] p-1.5 space-y-0.5 text-[#111827] dark:text-[#f3f3f3]`}
                >
                  {contextMenu.entry ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          const target = contextMenu.entry!;
                          setContextMenu(null);
                          openEntry(target);
                        }}
                        className="w-full h-[30px] px-2.5 rounded-[5px] flex items-center gap-2.5 text-[12.5px] font-medium hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border-none bg-transparent cursor-pointer text-left"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Open</span>
                      </button>
                      {contextMenu.entry.kind !== 'folder' && contextMenu.entry.kind !== 'drive' && (
                        <button
                          type="button"
                          onClick={() => {
                            const target = contextMenu.entry!;
                            setContextMenu(null);
                            openEntry(target, true);
                          }}
                          className="w-full h-[30px] px-2.5 rounded-[5px] flex items-center gap-2.5 text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border-none bg-transparent cursor-pointer text-left"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>{getOpenAppLabel(contextMenu.entry)}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const target = contextMenu.entry!;
                          setContextMenu(null);
                          toggleFavorite(target);
                        }}
                        className="w-full h-[30px] px-2.5 rounded-[5px] flex items-center gap-2.5 text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border-none bg-transparent cursor-pointer text-left"
                      >
                        <Star className="w-3.5 h-3.5" />
                        <span>
                          {favoriteIds.includes(contextMenu.entry.id) ? 'Unpin from Favorites' : 'Pin to Favorites'}
                        </span>
                      </button>
                      <div className="my-1 h-[1px] bg-black/10 dark:bg-white/10" />
                      {contextMenu.entry.kind !== 'drive' && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              const target = contextMenu.entry!;
                              setContextMenu(null);
                              handleCopyOrCut('cut', target);
                            }}
                            className="w-full h-[30px] px-2.5 rounded-[5px] flex items-center gap-2.5 text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border-none bg-transparent cursor-pointer text-left"
                          >
                            <Scissors className="w-3.5 h-3.5" />
                            <span>Cut</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const target = contextMenu.entry!;
                              setContextMenu(null);
                              handleCopyOrCut('copy', target);
                            }}
                            className="w-full h-[30px] px-2.5 rounded-[5px] flex items-center gap-2.5 text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border-none bg-transparent cursor-pointer text-left"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const target = contextMenu.entry!;
                              setContextMenu(null);
                              startRename(target);
                            }}
                            className="w-full h-[30px] px-2.5 rounded-[5px] flex items-center gap-2.5 text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border-none bg-transparent cursor-pointer text-left"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Rename</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const target = contextMenu.entry!;
                              setContextMenu(null);
                              handleDelete(target);
                            }}
                            className="w-full h-[30px] px-2.5 rounded-[5px] flex items-center gap-2.5 text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border-none bg-transparent cursor-pointer text-left"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                          <div className="my-1 h-[1px] bg-black/10 dark:bg-white/10" />
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const target = contextMenu.entry!;
                          setContextMenu(null);
                          setPropertiesEntry(target);
                        }}
                        className="w-full h-[30px] px-2.5 rounded-[5px] flex items-center gap-2.5 text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border-none bg-transparent cursor-pointer text-left"
                      >
                        <Info className="w-3.5 h-3.5" />
                        <span>Properties</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setContextMenu(null);
                          handleCreateItem('folder');
                        }}
                        className="w-full h-[30px] px-2.5 rounded-[5px] flex items-center gap-2.5 text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border-none bg-transparent cursor-pointer text-left"
                      >
                        <FolderPlus className="w-3.5 h-3.5" />
                        <span>New folder</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setContextMenu(null);
                          handleCreateItem('text');
                        }}
                        className="w-full h-[30px] px-2.5 rounded-[5px] flex items-center gap-2.5 text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border-none bg-transparent cursor-pointer text-left"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>New text document</span>
                      </button>
                      {clipboard && (
                        <button
                          type="button"
                          onClick={() => {
                            setContextMenu(null);
                            handlePaste();
                          }}
                          className="w-full h-[30px] px-2.5 rounded-[5px] flex items-center gap-2.5 text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border-none bg-transparent cursor-pointer text-left"
                        >
                          <ClipboardPaste className="w-3.5 h-3.5" />
                          <span>Paste</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setContextMenu(null);
                          refreshLiveSources();
                        }}
                        className="w-full h-[30px] px-2.5 rounded-[5px] flex items-center gap-2.5 text-[12.5px] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border-none bg-transparent cursor-pointer text-left"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Refresh</span>
                      </button>
                    </>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* NEW ITEM DIALOG (WinUI 3 ContentDialog) */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {newItemModal && (
              <div className="fixed inset-0 z-[2147483647] flex items-center justify-center p-4 sm:p-6 select-none">
                <motion.div
                  variants={shouldAnimateModal ? modalBackdropVariants : undefined}
                  initial={shouldAnimateModal ? 'initial' : false}
                  animate="animate"
                  exit="exit"
                  onClick={() => setNewItemModal(null)}
                  className="fixed inset-0 bg-black/55 dark:bg-black/70 backdrop-blur-xs"
                />
                <motion.div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="fe-new-item-title"
                  variants={shouldAnimateModal ? modalDialogVariants : undefined}
                  initial={shouldAnimateModal ? 'initial' : false}
                  animate="animate"
                  exit="exit"
                  className="fluent-modal-dialog relative z-10 w-full max-w-[440px] bg-white dark:bg-[#202020] rounded-[10px] overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.22),0_2px_6px_rgba(0,0,0,0.08)] dark:shadow-[0_24px_48px_rgba(0,0,0,0.7),0_2px_6px_rgba(255,255,255,0.04)] border border-black/[0.08] dark:border-white/[0.08] text-[#111827] dark:text-[#F3F4F6]"
                >
                  <div className="p-6 pb-5 space-y-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 id="fe-new-item-title" className="text-[19px] font-semibold tracking-tight leading-snug text-[#111827] dark:text-white">
                          {newItemModal.kind === 'folder'
                            ? 'Create new folder'
                            : newItemModal.kind === 'html'
                            ? 'Create HTML page'
                            : 'Create text document'}
                        </h2>
                        <p className="mt-1 text-[13px] text-[#4b5563] dark:text-[#a1a1aa]">
                          Enter a name for the new item in File Explorer.
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label="Close dialog"
                        onClick={() => setNewItemModal(null)}
                        className="rounded-[6px] p-1.5 text-[#4b5563] hover:bg-black/5 dark:text-white/55 dark:hover:bg-white/10 cursor-pointer border-none bg-transparent"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      autoFocus
                      type="text"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') confirmCreateNewItem();
                        if (e.key === 'Escape') setNewItemModal(null);
                      }}
                      className="w-full h-[36px] px-3 rounded-[6px] bg-black/[0.03] dark:bg-white/[0.06] border border-black/15 dark:border-white/15 text-[13.5px] outline-none"
                    />
                  </div>
                  <div className="h-[1px] w-full bg-[#E5E5E5] dark:bg-[#2F2F2F]" />
                  <div className="fluent-modal-footer bg-[#F3F3F3] dark:bg-[#1C1C1C] px-6 py-3 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setNewItemModal(null)}
                      className="fluent-btn-secondary px-4 h-8 rounded-[6px] bg-white dark:bg-[#2C2C2C] hover:bg-[#F9F9F9] dark:hover:bg-[#343434] text-[#111827] dark:text-white text-[12.5px] shadow-xs transition-colors flex items-center justify-center cursor-pointer border border-black/10 dark:border-white/10"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={confirmCreateNewItem}
                      className="fluent-btn-primary px-4 h-8 rounded-[6px] text-[12.5px] font-medium shadow-xs transition-colors flex items-center justify-center cursor-pointer border-none"
                    >
                      Create
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* RENAME DIALOG (WinUI 3 ContentDialog) */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {renameTarget && (
              <div className="fixed inset-0 z-[2147483647] flex items-center justify-center p-4 sm:p-6 select-none">
                <motion.div
                  variants={shouldAnimateModal ? modalBackdropVariants : undefined}
                  initial={shouldAnimateModal ? 'initial' : false}
                  animate="animate"
                  exit="exit"
                  onClick={() => setRenameTarget(null)}
                  className="fixed inset-0 bg-black/55 dark:bg-black/70 backdrop-blur-xs"
                />
                <motion.div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="fe-rename-title"
                  variants={shouldAnimateModal ? modalDialogVariants : undefined}
                  initial={shouldAnimateModal ? 'initial' : false}
                  animate="animate"
                  exit="exit"
                  className="fluent-modal-dialog relative z-10 w-full max-w-[440px] bg-white dark:bg-[#202020] rounded-[10px] overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.22),0_2px_6px_rgba(0,0,0,0.08)] dark:shadow-[0_24px_48px_rgba(0,0,0,0.7),0_2px_6px_rgba(255,255,255,0.04)] border border-black/[0.08] dark:border-white/[0.08] text-[#111827] dark:text-[#F3F4F6]"
                >
                  <div className="p-6 pb-5 space-y-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 id="fe-rename-title" className="text-[19px] font-semibold tracking-tight leading-snug text-[#111827] dark:text-white">
                          Rename item
                        </h2>
                        <p className="mt-1 text-[13px] text-[#4b5563] dark:text-[#a1a1aa] truncate">
                          Update the name for &ldquo;{renameTarget.name}&rdquo;.
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label="Close dialog"
                        onClick={() => setRenameTarget(null)}
                        className="rounded-[6px] p-1.5 text-[#4b5563] hover:bg-black/5 dark:text-white/55 dark:hover:bg-white/10 cursor-pointer border-none bg-transparent shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      autoFocus
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') confirmRename();
                        if (e.key === 'Escape') setRenameTarget(null);
                      }}
                      className="w-full h-[36px] px-3 rounded-[6px] bg-black/[0.03] dark:bg-white/[0.06] border border-black/15 dark:border-white/15 text-[13.5px] outline-none"
                    />
                  </div>
                  <div className="h-[1px] w-full bg-[#E5E5E5] dark:bg-[#2F2F2F]" />
                  <div className="fluent-modal-footer bg-[#F3F3F3] dark:bg-[#1C1C1C] px-6 py-3 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setRenameTarget(null)}
                      className="fluent-btn-secondary px-4 h-8 rounded-[6px] bg-white dark:bg-[#2C2C2C] hover:bg-[#F9F9F9] dark:hover:bg-[#343434] text-[#111827] dark:text-white text-[12.5px] shadow-xs transition-colors flex items-center justify-center cursor-pointer border border-black/10 dark:border-white/10"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={confirmRename}
                      className="fluent-btn-primary px-4 h-8 rounded-[6px] text-[12.5px] font-medium shadow-xs transition-colors flex items-center justify-center cursor-pointer border-none"
                    >
                      Save
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* INLINE FILE PREVIEW / TEXT EDITOR DIALOG (WinUI 3 ContentDialog) */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {previewEntry && (
              <div className="fixed inset-0 z-[2147483647] flex items-center justify-center p-4 sm:p-6 select-none">
                <motion.div
                  variants={shouldAnimateModal ? modalBackdropVariants : undefined}
                  initial={shouldAnimateModal ? 'initial' : false}
                  animate="animate"
                  exit="exit"
                  onClick={() => setPreviewEntry(null)}
                  className="fixed inset-0 bg-black/55 dark:bg-black/75 backdrop-blur-xs"
                />
                <motion.div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="fe-preview-title"
                  variants={shouldAnimateModal ? modalDialogVariants : undefined}
                  initial={shouldAnimateModal ? 'initial' : false}
                  animate="animate"
                  exit="exit"
                  className="fluent-modal-dialog relative z-10 w-full max-w-[680px] max-h-[85vh] flex flex-col bg-white dark:bg-[#202020] rounded-[10px] overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.22),0_2px_6px_rgba(0,0,0,0.08)] dark:shadow-[0_24px_48px_rgba(0,0,0,0.7),0_2px_6px_rgba(255,255,255,0.04)] border border-black/[0.08] dark:border-white/[0.08] text-[#111827] dark:text-[#F3F4F6]"
                >
                  <div className="px-6 py-4 flex items-center justify-between gap-3 border-b border-[#E5E5E5] dark:border-[#2F2F2F] shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <ExplorerItemIcon entry={previewEntry} size="sm" />
                      <div className="min-w-0">
                        <h2 id="fe-preview-title" className="text-[16px] font-semibold tracking-tight truncate text-[#111827] dark:text-white">
                          {previewEntry.name}
                        </h2>
                        <div className="text-[11.5px] text-[#4b5563] dark:text-[#a1a1aa] tabular-nums">
                          {getKindLabel(previewEntry.kind, previewEntry.fileExtension)} · {formatBytes(previewEntry.sizeBytes)}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label="Close preview"
                      onClick={() => setPreviewEntry(null)}
                      className="rounded-[6px] p-1.5 text-[#4b5563] hover:bg-black/5 dark:text-white/55 dark:hover:bg-white/10 cursor-pointer border-none bg-transparent shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-3">
                    {previewEntry.kind === 'image' && previewEntry.mediaUrl ? (
                      <div className="rounded-[8px] overflow-hidden bg-black/10 flex items-center justify-center max-h-[55vh]">
                        <img
                          src={previewEntry.mediaUrl}
                          alt={previewEntry.name}
                          className="max-w-full max-h-[55vh] object-contain"
                        />
                      </div>
                    ) : previewEntry.kind === 'video' && previewEntry.mediaUrl ? (
                      <video src={previewEntry.mediaUrl} controls className="w-full max-h-[55vh] rounded-[8px] bg-black" />
                    ) : previewEntry.kind === 'audio' && previewEntry.mediaUrl ? (
                      <div className="p-6 rounded-[8px] bg-black/[0.04] dark:bg-white/[0.04] flex flex-col items-center gap-4">
                        <ExplorerItemIcon entry={previewEntry} size="lg" />
                        <audio src={previewEntry.mediaUrl} controls className="w-full" />
                      </div>
                    ) : previewEntry.kind === 'pdf' && previewEntry.mediaUrl ? (
                      <iframe
                        src={previewEntry.mediaUrl}
                        title={previewEntry.name}
                        className="w-full h-[52vh] rounded-[8px] border border-black/10 dark:border-white/10 bg-white"
                      />
                    ) : isTextEditableEntry(previewEntry) ? (
                      <textarea
                        value={editorText}
                        onChange={(e) => setEditorText(e.target.value)}
                        rows={12}
                        className="w-full p-3 rounded-[8px] bg-black/[0.03] dark:bg-[#171a20] border border-black/10 dark:border-white/10 font-mono text-[12.5px] leading-relaxed outline-none resize-y"
                      />
                    ) : (
                      <div className="py-10 px-6 rounded-[8px] border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.03] flex flex-col items-center text-center gap-3">
                        <ExplorerItemIcon entry={previewEntry} size="lg" />
                        <div className="text-[14px] font-semibold">{previewEntry.name}</div>
                        <div className="text-[12.5px] text-[#4b5563] dark:text-[#a1a1aa] tabular-nums">
                          {getKindLabel(previewEntry.kind, previewEntry.fileExtension)} · {formatBytes(previewEntry.sizeBytes)}
                        </div>
                        <p className="text-[12px] text-[#4b5563] dark:text-[#a1a1aa] max-w-sm">
                          Inline text editing is not available for this binary format. You can download a copy to your computer below.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="fluent-modal-footer bg-[#F3F3F3] dark:bg-[#1C1C1C] px-6 py-3 flex items-center justify-between gap-3 shrink-0">
                    <span className="text-[11.5px] text-[#4b5563] dark:text-[#a1a1aa] truncate">
                      {previewEntry.pathLabel}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreviewEntry(null)}
                        className="fluent-btn-secondary px-4 h-8 rounded-[6px] bg-white dark:bg-[#2C2C2C] hover:bg-[#F9F9F9] dark:hover:bg-[#343434] text-[#111827] dark:text-white text-[12.5px] shadow-xs transition-colors flex items-center justify-center cursor-pointer border border-black/10 dark:border-white/10"
                      >
                        Close
                      </button>
                      {previewEntry.mediaUrl && (
                        <a
                          href={previewEntry.mediaUrl}
                          download={previewEntry.name}
                          className="fluent-btn-secondary px-3.5 h-8 rounded-[6px] bg-white dark:bg-[#2C2C2C] hover:bg-[#F9F9F9] dark:hover:bg-[#343434] text-[#111827] dark:text-white text-[12.5px] shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-black/10 dark:border-white/10 no-underline"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </a>
                      )}
                      {isTextEditableEntry(previewEntry) && (
                        <button
                          type="button"
                          onClick={savePreviewTextEdits}
                          className="fluent-btn-primary px-4 h-8 rounded-[6px] text-[12.5px] font-medium flex items-center gap-1.5 border-none cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save changes</span>
                        </button>
                      )}
                      {(previewEntry.linkedSource === 'gallery' ||
                        previewEntry.linkedSource === 'notes' ||
                        previewEntry.linkedSource === 'html-writer') && (
                        <button
                          type="button"
                          onClick={() => {
                            const target = previewEntry;
                            setPreviewEntry(null);
                            openEntry(target, true);
                          }}
                          className="fluent-btn-primary px-4 h-8 rounded-[6px] text-[12.5px] font-medium flex items-center gap-1.5 border-none cursor-pointer"
                        >
                          <span>{getOpenAppLabel(previewEntry)}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* PROPERTIES DIALOG (WinUI 3 ContentDialog) */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {propertiesEntry && (
              <div className="fixed inset-0 z-[2147483647] flex items-center justify-center p-4 sm:p-6 select-none">
                <motion.div
                  variants={shouldAnimateModal ? modalBackdropVariants : undefined}
                  initial={shouldAnimateModal ? 'initial' : false}
                  animate="animate"
                  exit="exit"
                  onClick={() => setPropertiesEntry(null)}
                  className="fixed inset-0 bg-black/55 dark:bg-black/70 backdrop-blur-xs"
                />
                <motion.div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="fe-properties-title"
                  variants={shouldAnimateModal ? modalDialogVariants : undefined}
                  initial={shouldAnimateModal ? 'initial' : false}
                  animate="animate"
                  exit="exit"
                  className="fluent-modal-dialog relative z-10 w-full max-w-[440px] bg-white dark:bg-[#202020] rounded-[10px] overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.22),0_2px_6px_rgba(0,0,0,0.08)] dark:shadow-[0_24px_48px_rgba(0,0,0,0.7),0_2px_6px_rgba(255,255,255,0.04)] border border-black/[0.08] dark:border-white/[0.08] text-[#111827] dark:text-[#F3F4F6]"
                >
                  <div className="p-6 pb-5 space-y-4">
                    <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-black/[0.08] dark:border-white/[0.08]">
                      <div className="flex items-center gap-3 min-w-0">
                        <ExplorerItemIcon entry={propertiesEntry} size="md" />
                        <div className="min-w-0">
                          <h2 id="fe-properties-title" className="text-[16px] font-semibold tracking-tight truncate text-[#111827] dark:text-white">
                            {propertiesEntry.name}
                          </h2>
                          <div className="text-[12px] text-[#4b5563] dark:text-[#a1a1aa]">
                            {getKindLabel(propertiesEntry.kind, propertiesEntry.fileExtension)}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        aria-label="Close properties"
                        onClick={() => setPropertiesEntry(null)}
                        className="rounded-[6px] p-1.5 text-[#4b5563] hover:bg-black/5 dark:text-white/55 dark:hover:bg-white/10 cursor-pointer border-none bg-transparent shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-2.5 text-[13px]">
                      <div className="flex justify-between gap-4">
                        <span className="text-[#4b5563] dark:text-[#a1a1aa] shrink-0">Location</span>
                        <span className="font-medium text-right truncate">{propertiesEntry.pathLabel}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-[#4b5563] dark:text-[#a1a1aa] shrink-0">Size</span>
                        <span className="font-medium tabular-nums">{formatBytes(propertiesEntry.sizeBytes)}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-[#4b5563] dark:text-[#a1a1aa] shrink-0">Modified</span>
                        <span className="font-medium tabular-nums">{formatDateTime(propertiesEntry.modifiedAt)}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-[#4b5563] dark:text-[#a1a1aa] shrink-0">Sync status</span>
                        <span className="font-medium capitalize">{propertiesEntry.status || 'local'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-[1px] w-full bg-[#E5E5E5] dark:bg-[#2F2F2F]" />
                  <div className="fluent-modal-footer bg-[#F3F3F3] dark:bg-[#1C1C1C] px-6 py-3 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setPropertiesEntry(null)}
                      className="fluent-btn-primary px-5 h-8 rounded-[6px] text-[12.5px] font-medium border-none cursor-pointer"
                    >
                      OK
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* EXPLORER TAB RIGHT-CLICK CONTEXT MENU */}
      <AnimatePresence>
        {tabContextMenu && (
          <ExplorerTabContextMenu
            key={`fe-tab-menu-${tabContextMenu.tabId || 'strip'}-${tabContextMenu.x}-${tabContextMenu.y}`}
            x={tabContextMenu.x}
            y={tabContextMenu.y}
            tabId={tabContextMenu.tabId}
            canClose={tabs.length > 1}
            onClose={() => setTabContextMenu(null)}
            onCreateTab={() => addTab()}
            onDuplicateTab={duplicateTab}
            onCloseTab={closeTab}
            onCloseOtherTabs={closeOtherTabs}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

