import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from '../hooks/useSettings';
import { modalDialogVariants, modalBackdropVariants } from '../utils/animations';
import {
  Check,
  ChevronRight,
  Info,
  Play,
  X,
  Search,
  Code2,
  ExternalLink
} from 'lucide-react';
import { SpinningRing } from '../components/SpinningRing';
import {
  FluentHomeIcon,
  FluentCopyIcon,
  FluentWatchIcon,
  FluentArticlesIcon,
  FluentNotesIcon,
  FluentUserIcon,
  FluentPersonDeleteIcon,
  FluentPersonFeedbackIcon,
  FluentSearchIcon,
  FluentSettingsIcon,
  FluentCraftmineIcon,
  FluentUpdatesIcon,
  FluentGalleryIcon,
  FluentDrawsIcon,
  FluentScreenbugIcon,
  FluentVlcIcon,
  FluentPhotopeaIcon,
  FluentDeleteIcon,
  FluentFolderAddIcon,
  FluentRenameIcon,
  FluentFolderArrowLeftIcon,
  FluentArrowUploadIcon,
  FluentInkCanvasIcon,
  FluentCameraIcon,
} from '../components/FluentIcons';
import {
  Fluent3DHomeIcon,
  Fluent3DWatchIcon,
  Fluent3DGalleryIcon,
  Fluent3DNotesIcon,
  Fluent3DDrawsIcon,
  Fluent3DVlcIcon,
  Fluent3DCraftmineIcon,
  Fluent3DPhotopeaIcon,
  Fluent3DDiscordIcon,
  Fluent3DSettingsIcon,
} from '../components/Fluent3DIcons';

interface IconEntry {
  name: string;
  category: 'system' | 'media' | 'doc' | '3d';
  componentName: string;
  component: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  is3D?: boolean;
  glyphHex?: string;
  description: string;
}

const ICON_CATALOG: IconEntry[] = [
  { name: '3D Craftmine', category: '3d', componentName: 'Fluent3DCraftmineIcon', component: Fluent3DCraftmineIcon, is3D: true, description: 'Icon 3D Colore Thế giới voxel game' },
  { name: '3D Discord', category: '3d', componentName: 'Fluent3DDiscordIcon', component: Fluent3DDiscordIcon, is3D: true, description: 'Icon 3D Colore Cộng đồng Discord' },
  { name: '3D Draws', category: '3d', componentName: 'Fluent3DDrawsIcon', component: Fluent3DDrawsIcon, is3D: true, description: 'Icon 3D Colore Hội họa Paint' },
  { name: '3D Gallery', category: '3d', componentName: 'Fluent3DGalleryIcon', component: Fluent3DGalleryIcon, is3D: true, description: 'Icon 3D Colore Album ảnh & đa phương tiện' },
  { name: '3D Home', category: '3d', componentName: 'Fluent3DHomeIcon', component: Fluent3DHomeIcon, is3D: true, description: 'Icon 3D Colore Trang chủ Windows 11' },
  { name: '3D Notes', category: '3d', componentName: 'Fluent3DNotesIcon', component: Fluent3DNotesIcon, is3D: true, description: 'Icon 3D Colore Ghi chú Notepad' },
  { name: '3D Photopea', category: '3d', componentName: 'Fluent3DPhotopeaIcon', component: Fluent3DPhotopeaIcon, is3D: true, description: 'Icon 3D Colore Thiết kế đồ họa' },
  { name: '3D Settings', category: '3d', componentName: 'Fluent3DSettingsIcon', component: Fluent3DSettingsIcon, is3D: true, description: 'Icon 3D Colore Thiết lập Windows' },
  { name: '3D VLC', category: '3d', componentName: 'Fluent3DVlcIcon', component: Fluent3DVlcIcon, is3D: true, description: 'Icon 3D Colore Trình phát video VLC' },
  { name: '3D Watch', category: '3d', componentName: 'Fluent3DWatchIcon', component: Fluent3DWatchIcon, is3D: true, description: 'Icon 3D Colore Phim & Truyền hình' },
  { name: 'Arrow loop', category: 'system', componentName: 'FluentUpdatesIcon', component: FluentUpdatesIcon, glyphHex: 'E895', description: 'Đồng bộ và cập nhật phần mềm' },
  { name: 'Arrow up', category: 'system', componentName: 'FluentArrowUploadIcon', component: FluentArrowUploadIcon, glyphHex: 'E898', description: 'Nhập và tải lên tệp tin' },
  { name: 'Camera', category: 'media', componentName: 'FluentCameraIcon', component: FluentCameraIcon, glyphHex: 'E722', description: 'Ứng dụng máy ảnh và quay phim WinUI 3' },
  { name: 'Copy', category: 'doc', componentName: 'FluentCopyIcon', component: FluentCopyIcon, glyphHex: 'E8C8', description: 'Sao chép hoặc nhân bản tệp/nội dung' },
  { name: 'Craftmine', category: 'system', componentName: 'FluentCraftmineIcon', component: FluentCraftmineIcon, glyphHex: 'F158', description: 'Khối 3D voxel sandbox game' },
  { name: 'Document with pen', category: 'doc', componentName: 'FluentNotesIcon', component: FluentNotesIcon, glyphHex: 'E70F', description: 'Soạn thảo văn bản và ghi chú' },
  { name: 'Draws', category: 'media', componentName: 'FluentDrawsIcon', component: FluentDrawsIcon, glyphHex: 'E790', description: 'Bảng vẽ kỹ thuật số & nghệ thuật' },
  { name: 'Feedback', category: 'system', componentName: 'FluentPersonFeedbackIcon', component: FluentPersonFeedbackIcon, glyphHex: 'ED15', description: 'Gửi phản hồi và đóng góp ý kiến' },
  { name: 'Film', category: 'media', componentName: 'FluentWatchIcon', component: FluentWatchIcon, glyphHex: 'E8B9', description: 'Trung tâm xem phim & truyền hình' },
  { name: 'Folder Add', category: 'doc', componentName: 'FluentFolderAddIcon', component: FluentFolderAddIcon, glyphHex: 'E8F4', description: 'Tạo thư mục mới trong bộ nhớ' },
  { name: 'Folder Move', category: 'doc', componentName: 'FluentFolderArrowLeftIcon', component: FluentFolderArrowLeftIcon, glyphHex: 'E8DE', description: 'Di chuyển vào thư mục đích' },
  { name: 'Gallery', category: 'media', componentName: 'FluentGalleryIcon', component: FluentGalleryIcon, glyphHex: 'EB9F', description: 'Thư viện hình ảnh và tài liệu' },
  { name: 'Highlights', category: 'doc', componentName: 'FluentArticlesIcon', component: FluentArticlesIcon, glyphHex: 'E8BD', description: 'Bài viết và điểm tin nổi bật' },
  { name: 'Home', category: 'system', componentName: 'FluentHomeIcon', component: FluentHomeIcon, glyphHex: 'E80F', description: 'Trang chủ và tổng quan ứng dụng' },
  { name: 'Ink Canvas', category: 'media', componentName: 'FluentInkCanvasIcon', component: FluentInkCanvasIcon, glyphHex: 'ED63', description: 'Khung vẽ tự do Windows Ink' },
  { name: 'Photopea', category: 'media', componentName: 'FluentPhotopeaIcon', component: FluentPhotopeaIcon, glyphHex: 'E8B7', description: 'Công cụ chỉnh sửa đồ họa ảnh' },
  { name: 'Rename', category: 'doc', componentName: 'FluentRenameIcon', component: FluentRenameIcon, glyphHex: 'E8AC', description: 'Đổi tên tệp hoặc thư mục' },
  { name: 'Screenbox', category: 'media', componentName: 'FluentScreenbugIcon', component: FluentScreenbugIcon, glyphHex: 'E7F4', description: 'Biểu trưng kênh và màn hình' },
  { name: 'Search with sparkles', category: 'system', componentName: 'FluentSearchIcon', component: FluentSearchIcon, glyphHex: 'E721', description: 'Tìm kiếm thông minh toàn hệ thống' },
  { name: 'Settings', category: 'system', componentName: 'FluentSettingsIcon', component: FluentSettingsIcon, glyphHex: 'E713', description: 'Cài đặt và tùy chỉnh hệ thống' },
  { name: 'Trash', category: 'system', componentName: 'FluentDeleteIcon', component: FluentDeleteIcon, glyphHex: 'E74D', description: 'Xóa tệp tin hoặc thư mục' },
  { name: 'User', category: 'system', componentName: 'FluentUserIcon', component: FluentUserIcon, glyphHex: 'E77B', description: 'Tài khoản người dùng cá nhân' },
  { name: 'User with cross', category: 'system', componentName: 'FluentPersonDeleteIcon', component: FluentPersonDeleteIcon, glyphHex: 'E8D5', description: 'Xóa hoặc đăng xuất người dùng' },
  { name: 'VLC Media', category: 'media', componentName: 'FluentVlcIcon', component: FluentVlcIcon, glyphHex: 'E768', description: 'Trình phát luồng đa phương tiện' },
];

export const WinUI3: React.FC = () => {
  const { settings, updateSetting } = useSettings();
  const isDarkMode = settings.theme !== 'light';
  const toggleDarkMode = () => {
    updateSetting('theme', isDarkMode ? 'light' : 'dark');
  };
  const [volume, setVolume] = useState(68);
  const [notifications, setNotifications] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProgressActive, setIsProgressActive] = useState(true);
  const [determinateProgress, setDeterminateProgress] = useState(72);
  const [copied, setCopied] = useState(false);

  // Modal Dialog Animation In/Out Code States
  const [dialogCodeTab, setDialogCodeTab] = useState<'variants' | 'component'>('variants');
  const [copiedDialogCode, setCopiedDialogCode] = useState(false);

  const dialogVariantsCode = `// WinUI 3 / Fluent Design Modal Dialog In/Out Animation
export const dialogAnimation = {
  initial: { opacity: 0, scale: 1.8 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.24,
      ease: [0.16, 1, 0.3, 1] // Fluent Standard Decelerate
    }
  },
  exit: {
    opacity: 0,
    scale: 1.8,
    transition: {
      duration: 0.18,
      ease: [0.4, 0, 0.2, 1] // Fluent Standard Accelerate
    }
  }
};

export const backdropAnimation = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1, 
    transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } 
  },
  exit: { 
    opacity: 0, 
    transition: { duration: 0.18, ease: [0.4, 0, 0.2, 1] } 
  }
};`;

  const dialogComponentCode = `import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';

interface DialogProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const FullscreenDialog: React.FC<DialogProps> = ({
  isOpen,
  title,
  onClose,
  children
}) => {
  if (typeof document === 'undefined') return null;

  return (
    <AnimatePresence>
      {isOpen &&
        createPortal(
          <div className="fixed inset-0 z-[2147483647] flex items-center justify-center p-4 sm:p-6 select-none">
            {/* Backdrop In/Out Animation */}
            <motion.div
              variants={modalBackdropVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={onClose}
              className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-xs"
            />

            {/* Modal Dialog In/Out Animation */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={title}
              variants={modalDialogVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="fluent-modal-dialog relative z-10 w-full max-w-[480px] bg-white dark:bg-[#202020] rounded-[10px] overflow-hidden shadow-2xl border border-black/10 dark:border-white/10"
            >
              <div className="p-6 pb-4">
                <h2 className="text-[19px] font-semibold text-[#111827] dark:text-white">
                  {title}
                </h2>
              </div>
              {children}
            </motion.div>
          </div>,
          document.body
        )}
    </AnimatePresence>
  );
};`;

  const copyDialogCode = async () => {
    const textToCopy = dialogCodeTab === 'variants' ? dialogVariantsCode : dialogComponentCode;
    await navigator.clipboard?.writeText(textToCopy);
    setCopiedDialogCode(true);
    setTimeout(() => setCopiedDialogCode(false), 1800);
  };

  // Iconography Gallery States
  const [iconCategoryFilter, setIconCategoryFilter] = useState<'all' | 'system' | '3d' | 'media' | 'doc'>('all');
  const [iconSearchTerm, setIconSearchTerm] = useState('');
  const [iconPreviewSize, setIconPreviewSize] = useState<number>(24);
  const [selectedIconItem, setSelectedIconItem] = useState<IconEntry>(ICON_CATALOG[0]);
  const [copiedIconCode, setCopiedIconCode] = useState<string | null>(null);

  const filteredIcons = useMemo(() => {
    return ICON_CATALOG.filter((item) => {
      const matchesCategory = iconCategoryFilter === 'all' || item.category === iconCategoryFilter;
      const q = iconSearchTerm.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.componentName.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    }).sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  }, [iconCategoryFilter, iconSearchTerm]);

  const copyIconCode = async (text: string, type: string) => {
    await navigator.clipboard?.writeText(text);
    setCopiedIconCode(type);
    setTimeout(() => setCopiedIconCode(null), 1800);
  };

  const primaryAccent = isDarkMode ? '#4cc2ff' : '#005fb8';
  const progressAccent = isDarkMode ? '#ff82ff' : '#ff01ff';

  const copyToken = async () => {
    await navigator.clipboard?.writeText(`--winui-accent: ${primaryAccent}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <motion.div
      id="winui3-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`winui3-page-wrapper w-full max-w-5xl mx-auto pb-28 pt-2 px-4 sm:px-6 select-none space-y-6 ${isDarkMode ? 'text-white' : 'text-[#111827]'}`}
    >
      {/* WinUI Gallery Hero Banner & 4 Quick Links matching reference */}
      <div id="winui-hero-banner-section" className="space-y-3.5">
        {/* Top Hero Banner with Segoe UI Display Typography */}
        <div className="relative w-full rounded-[8px] overflow-hidden border border-black/10 dark:border-white/10 shadow-xs bg-[#d9d9e3] dark:bg-[#1b1f24] min-h-[160px] sm:min-h-[190px] md:min-h-[220px] flex items-center">
          <img
            src="/assets/winui3/hero_banner_clean.png"
            alt="WinUI 3 Gallery"
            className="absolute inset-0 w-full h-full object-cover object-right pointer-events-none select-none dark:opacity-40"
          />
          {/* Dark gradient backdrop behind text in dark mode for high-contrast white text */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#181920]/95 via-[#181920]/80 to-transparent pointer-events-none hidden dark:block z-[2]" />
          <div className="relative z-10 px-6 sm:px-10 py-6 flex flex-col justify-center select-none">
            <h1
              id="winui3-hero-title"
              className="text-3xl sm:text-4xl md:text-5xl font-semibold text-black dark:text-white tracking-tight"
              style={{
                fontFamily: "'Segoe UI Variable Display', 'Segoe UI', system-ui, -apple-system, sans-serif",
                color: isDarkMode ? '#ffffff' : '#0c0d0e'
              }}
            >
              WinUI 3 Gallery
            </h1>
            <p
              id="winui3-hero-subtitle"
              className="text-lg sm:text-xl md:text-2xl font-normal text-black dark:text-[#e5e7eb] mt-1 sm:mt-1.5"
              style={{
                fontFamily: "'Segoe UI Variable Text', 'Segoe UI', system-ui, -apple-system, sans-serif",
                color: isDarkMode ? '#e5e7eb' : '#1a1b1d'
              }}
            >
              SDK 2.9
            </p>
          </div>
        </div>

        {/* 4 Quick Link Cards - Compact, 1 Single Row, Magenta / Red / Pink Palettes */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {/* Card 1: Getting Started - Magenta */}
          <a
            href="https://learn.microsoft.com/windows/apps/winui/winui3/get-started-winui3"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-[8px] overflow-hidden border border-black/10 dark:border-white/10 bg-white dark:bg-[#2c3037] hover:bg-black/[0.03] dark:hover:bg-[#363b43] transition-colors flex flex-col cursor-pointer shadow-xs text-inherit no-underline"
          >
            <div
              className="w-full h-14 sm:h-18 md:h-20 relative flex items-center justify-center overflow-hidden"
              style={{
                background: 'radial-gradient(circle at 50% 120%, #ff2d92 0%, #d946ef 45%, #701a75 100%)',
              }}
            >
              <div className="relative z-10 w-12 h-8 sm:w-16 sm:h-10 md:w-20 md:h-12 rounded-[4px] sm:rounded-[6px] bg-white/35 dark:bg-black/35 backdrop-blur-md border border-white/50 dark:border-white/20 shadow-sm flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white drop-shadow-sm" fill="currentColor">
                  <rect x="2.5" y="2.5" width="8.8" height="8.8" rx="0.5" />
                  <rect x="12.7" y="2.5" width="8.8" height="8.8" rx="0.5" />
                  <rect x="2.5" y="12.7" width="8.8" height="8.8" rx="0.5" />
                  <rect x="12.7" y="12.7" width="8.8" height="8.8" rx="0.5" />
                </svg>
              </div>
            </div>
            <div className="px-2 sm:px-2.5 py-1.5 flex items-center justify-between gap-1 border-t border-black/5 dark:border-white/5">
              <span className="text-[10.5px] sm:text-xs font-medium text-[#111827] dark:text-white truncate">
                Getting Started
              </span>
              <ExternalLink className="size-3 text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors shrink-0" />
            </div>
          </a>

          {/* Card 2: Windows Design - Red */}
          <a
            href="https://learn.microsoft.com/windows/apps/design/"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-[8px] overflow-hidden border border-black/10 dark:border-white/10 bg-white dark:bg-[#2c3037] hover:bg-black/[0.03] dark:hover:bg-[#363b43] transition-colors flex flex-col cursor-pointer shadow-xs text-inherit no-underline"
          >
            <div
              className="w-full h-14 sm:h-18 md:h-20 relative flex items-center justify-center overflow-hidden"
              style={{
                background: 'radial-gradient(circle at 50% 120%, #ff4b72 0%, #e11d48 45%, #881337 100%)',
              }}
            >
              <div className="relative z-10 w-14 h-9 sm:w-18 sm:h-11 md:w-22 md:h-13 rounded-[4px] sm:rounded-[6px] bg-white/85 dark:bg-[#1a1c22]/90 backdrop-blur-md border border-white/60 dark:border-white/20 shadow-sm flex flex-col justify-center px-2 py-1">
                <span
                  className="text-sm sm:text-base md:text-lg font-bold leading-none text-neutral-900 dark:text-white tracking-tight"
                  style={{ fontFamily: "'Segoe UI Variable Display', 'Segoe UI', system-ui, sans-serif" }}
                >
                  Aa
                </span>
                <div className="flex h-1 sm:h-1.5 w-full rounded-[2px] overflow-hidden mt-1 gap-[1.5px]">
                  <div className="flex-1 bg-[#ffe4e6]" />
                  <div className="flex-1 bg-[#fda4af]" />
                  <div className="flex-1 bg-[#fb7185]" />
                  <div className="flex-1 bg-[#e11d48]" />
                  <div className="flex-1 bg-[#881337]" />
                </div>
              </div>
            </div>
            <div className="px-2 sm:px-2.5 py-1.5 flex items-center justify-between gap-1 border-t border-black/5 dark:border-white/5">
              <span className="text-[10.5px] sm:text-xs font-medium text-[#111827] dark:text-white truncate">
                Windows Design
              </span>
              <ExternalLink className="size-3 text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors shrink-0" />
            </div>
          </a>

          {/* Card 3: GitHub Repo - Rose / Pink */}
          <a
            href="https://github.com/microsoft/WinUI-Gallery"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-[8px] overflow-hidden border border-black/10 dark:border-white/10 bg-white dark:bg-[#2c3037] hover:bg-black/[0.03] dark:hover:bg-[#363b43] transition-colors flex flex-col cursor-pointer shadow-xs text-inherit no-underline"
          >
            <div
              className="w-full h-14 sm:h-18 md:h-20 relative flex items-center justify-center overflow-hidden"
              style={{
                background: 'radial-gradient(circle at 50% 110%, #f43f5e 0%, #be123c 50%, #4c0519 100%)',
              }}
            >
              <div className="relative z-10 w-12 h-8 sm:w-16 sm:h-10 md:w-20 md:h-12 rounded-[4px] sm:rounded-[6px] bg-white/25 dark:bg-white/10 backdrop-blur-md border border-white/35 dark:border-white/15 shadow-sm flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 fill-white drop-shadow-sm">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              </div>
            </div>
            <div className="px-2 sm:px-2.5 py-1.5 flex items-center justify-between gap-1 border-t border-black/5 dark:border-white/5">
              <span className="text-[10.5px] sm:text-xs font-medium text-[#111827] dark:text-white truncate">
                GitHub Repo
              </span>
              <ExternalLink className="size-3 text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors shrink-0" />
            </div>
          </a>

          {/* Card 4: Template Studio - Deep Magenta / Hot Pink */}
          <a
            href="https://github.com/microsoft/TemplateStudio"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-[8px] overflow-hidden border border-black/10 dark:border-white/10 bg-white dark:bg-[#2c3037] hover:bg-black/[0.03] dark:hover:bg-[#363b43] transition-colors flex flex-col cursor-pointer shadow-xs text-inherit no-underline"
          >
            <div
              className="w-full h-14 sm:h-18 md:h-20 relative flex items-center justify-center overflow-hidden"
              style={{
                background: 'radial-gradient(circle at 50% 110%, #f472b6 0%, #db2777 45%, #701a75 100%)',
              }}
            >
              <div className="relative z-10 w-12 h-8 sm:w-16 sm:h-10 md:w-20 md:h-12 rounded-[4px] sm:rounded-[6px] bg-white/25 dark:bg-white/10 backdrop-blur-md border border-white/35 dark:border-white/15 shadow-sm flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 fill-white drop-shadow-sm">
                  <path d="M12 2.5L3 7.5L12 12.5L21 7.5L12 2.5Z" />
                  <path d="M3 11.5L12 16.5L21 11.5L19 10.4L12 14.3L5 10.4L3 11.5Z" />
                  <path d="M3 15.5L12 20.5L21 15.5L19 14.4L12 18.3L5 14.4L3 15.5Z" />
                </svg>
              </div>
            </div>
            <div className="px-2 sm:px-2.5 py-1.5 flex items-center justify-between gap-1 border-t border-black/5 dark:border-white/5">
              <span className="text-[10.5px] sm:text-xs font-medium text-[#111827] dark:text-white truncate">
                Template Studio
              </span>
              <ExternalLink className="size-3 text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors shrink-0" />
            </div>
          </a>
        </div>
      </div>

      {/* Sections Container - Stacked full-width blocks matching Settings exactly */}
      <div className="flex flex-col gap-8 bg-transparent">
        {/* 01 / Actions - Buttons */}
        <section id="section-buttons" className="space-y-3 bg-transparent">
          <div className="flex items-center justify-between py-1 px-1">
            <h2 className="text-base sm:text-lg font-bold text-[#111827] dark:text-white tracking-tight">
              Buttons
            </h2>
            <span className="text-[11px] font-medium text-[#6B7280] dark:text-[#9CA3AF]">
              Action controls
            </span>
          </div>
          <div className="space-y-2.5 bg-transparent pt-0.5">
            <div className="rounded-[6px] bg-white dark:bg-[#2c3037] shadow-xs px-4 py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-default hover:bg-black/[0.02] dark:hover:bg-[#363b43] transition-colors border-none">
              <div className="min-w-0 flex-1 pr-2">
                <div className="font-normal text-sm text-[#111827] dark:text-white">
                  Standard Button Styles
                </div>
                <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5 leading-normal">
                  Các kiểu nút bấm Primary, Outline, Subtle và Disabled theo quy chuẩn Windows 11 Fluent Design.
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  className={`inline-flex h-8 items-center gap-1.5 rounded-[6px] px-3.5 text-xs font-semibold transition cursor-pointer shadow-xs border-none ${
                    isDarkMode
                      ? 'bg-[#4cc2ff] text-black hover:bg-[#6bd0ff] active:bg-[#3bb2ef]'
                      : 'bg-[#005fb8] text-white hover:bg-[#106ebe] active:bg-[#005a9e]'
                  }`}
                >
                  <Play className="size-3 fill-current" /> Primary
                </button>
                <button
                  type="button"
                  className="h-8 rounded-[6px] border border-black/15 dark:border-white/15 bg-black/5 dark:bg-black/30 hover:bg-black/10 dark:hover:bg-black/50 text-black dark:text-white px-3.5 text-xs font-semibold transition cursor-pointer"
                >
                  Outline
                </button>
                <button
                  type="button"
                  className="h-8 rounded-[6px] bg-black/5 dark:bg-black/30 hover:bg-black/10 dark:hover:bg-black/50 text-[#111827] dark:text-white px-3.5 text-xs font-semibold transition cursor-pointer border-none"
                >
                  Subtle
                </button>
                <button
                  type="button"
                  disabled
                  className="h-8 rounded-[6px] bg-black/5 dark:bg-black/20 text-black/30 dark:text-white/30 px-3.5 text-xs font-semibold cursor-not-allowed border-none"
                >
                  Disabled
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 02 / State - Toggles & sliders */}
        <section id="section-toggles" className="space-y-3 bg-transparent">
          <div className="py-1 px-1">
            <h2 className="text-base sm:text-lg font-bold text-[#111827] dark:text-white tracking-tight">
              Toggles & sliders
            </h2>
          </div>
          <div className="space-y-2.5 bg-transparent pt-0.5">
            {/* 1. Notifications */}
            <div
              onClick={() => setNotifications(!notifications)}
              className="rounded-[6px] bg-white dark:bg-[#2c3037] shadow-xs px-4 py-3 sm:py-3.5 flex items-center justify-between gap-4 cursor-default hover:bg-black/[0.02] dark:hover:bg-[#363b43] transition-colors border-none"
            >
              <div className="min-w-0 flex-1 pr-2">
                <div className="font-normal text-sm text-[#111827] dark:text-white">
                  Notifications
                </div>
                <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5 leading-normal">
                  Nhận các thông báo cập nhật mới từ ứng dụng Sparkle.
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={notifications}
                onClick={(e) => {
                  e.stopPropagation();
                  setNotifications(!notifications);
                }}
                className={`relative h-5 w-10 rounded-full transition cursor-pointer border-none shrink-0 ${
                  notifications ? (isDarkMode ? 'bg-[#4cc2ff]' : 'bg-[#0078d4]') : (isDarkMode ? 'bg-white/20' : 'bg-black/20')
                }`}
              >
                <span
                  className={`absolute top-0.5 size-4 rounded-full shadow transition-all ${
                    notifications ? 'left-[22px] bg-white dark:bg-black' : 'left-0.5 bg-white'
                  }`}
                />
              </button>
            </div>

            {/* 2. Dark appearance */}
            <div
              onClick={toggleDarkMode}
              className="rounded-[6px] bg-white dark:bg-[#2c3037] shadow-xs px-4 py-3 sm:py-3.5 flex items-center justify-between gap-4 cursor-default hover:bg-black/[0.02] dark:hover:bg-[#363b43] transition-colors border-none"
            >
              <div className="min-w-0 flex-1 pr-2">
                <div className="font-normal text-sm text-[#111827] dark:text-white">
                  Dark appearance
                </div>
                <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5 leading-normal">
                  Chuyển đổi giữa chế độ nền sáng và nền tối Fluent.
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isDarkMode}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDarkMode();
                }}
                className={`relative h-5 w-10 rounded-full transition cursor-pointer border-none shrink-0 ${
                  isDarkMode ? 'bg-[#4cc2ff]' : 'bg-[#0078d4]'
                }`}
              >
                <span
                  className={`absolute top-0.5 size-4 rounded-full shadow transition-all ${
                    isDarkMode ? 'left-[22px] bg-black' : 'left-0.5 bg-white'
                  }`}
                />
              </button>
            </div>

            {/* 3. Volume Slider */}
            <div className="rounded-[6px] bg-white dark:bg-[#2c3037] shadow-xs px-4 py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-black/[0.02] dark:hover:bg-[#363b43] transition-colors border-none">
              <div className="min-w-0 flex-1">
                <div className="font-normal text-sm text-[#111827] dark:text-white flex items-center gap-2">
                  <span>Volume</span>
                  <span className="text-xs font-semibold text-[#0078d4] dark:text-[#4cc2ff] bg-black/5 dark:bg-black/30 px-2 py-0.5 rounded-[6px]">
                    {volume}%
                  </span>
                </div>
                <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5 leading-normal">
                  Điều chỉnh mức âm lượng luồng phát video và truyền hình.
                </div>
              </div>
              <div className="w-full sm:w-64 pt-1 sm:pt-0">
                <input
                  aria-label="Volume"
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(event) => setVolume(Number(event.target.value))}
                  className="winui-slider h-1.5 w-full cursor-pointer"
                  style={{ accentColor: primaryAccent }}
                />
              </div>
            </div>

            {/* 4. Selection Checkboxes & Radios */}
            <div className="rounded-[6px] bg-white dark:bg-[#2c3037] shadow-xs px-4 py-3 sm:py-3.5 flex flex-col gap-2.5 hover:bg-black/[0.02] dark:hover:bg-[#363b43] transition-colors border-none">
              <div>
                <div className="font-normal text-sm text-[#111827] dark:text-white">
                  Checkboxes & radios
                </div>
                <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5 leading-normal">
                  Hộp kiểm tra và nút chọn đơn chuẩn Windows UI.
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs sm:text-sm font-normal text-[#111827] dark:text-white">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="winui-checkbox size-4 rounded-[4px] cursor-pointer"
                      style={{ accentColor: primaryAccent }}
                    />
                    Remember my preference
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs sm:text-sm font-normal text-[#111827] dark:text-white">
                    <input
                      type="checkbox"
                      className="winui-checkbox size-4 rounded-[4px] cursor-pointer"
                      style={{ accentColor: primaryAccent }}
                    />
                    Show system labels
                  </label>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs sm:text-sm font-normal text-[#111827] dark:text-white">
                    <input
                      type="radio"
                      name="accent"
                      defaultChecked
                      className="winui-checkbox size-4 cursor-pointer"
                      style={{ accentColor: primaryAccent }}
                    />
                    Primary accent ({primaryAccent})
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs sm:text-sm font-normal text-[#111827] dark:text-white">
                    <input
                      type="radio"
                      name="accent"
                      className="winui-checkbox size-4 cursor-pointer"
                      style={{ accentColor: primaryAccent }}
                    />
                    System default
                  </label>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 03 / Content - Input boxes */}
        <section id="section-inputs" className="space-y-3 bg-transparent">
          <div className="flex items-center justify-between py-1 px-1">
            <h2 className="text-base sm:text-lg font-bold text-[#111827] dark:text-white tracking-tight">
              Input boxes
            </h2>
            <span className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">TextBox · PasswordBox</span>
          </div>
          <div className="space-y-2.5 bg-transparent pt-0.5">
            <div className="rounded-[6px] bg-white dark:bg-[#2c3037] shadow-xs px-4 py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-black/[0.02] dark:hover:bg-[#363b43] transition-colors border-none">
              <div className="min-w-0 flex-1">
                <div className="font-normal text-sm text-[#111827] dark:text-white">
                  Display name
                </div>
                <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5 leading-normal">
                  Ô nhập văn bản tên người dùng hiển thị
                </div>
              </div>
              <div className="fluent-input-box relative w-full sm:w-64 h-9 bg-black/5 dark:bg-white/10 flex items-center px-3.5 rounded-[6px] transition-colors border-none backdrop-blur-[50px]">
                <input
                  type="text"
                  placeholder="Enter a name"
                  spellCheck={false}
                  autoCapitalize="off"
                  autoComplete="off"
                  autoCorrect="off"
                  className="w-full bg-transparent text-xs sm:text-[13px] text-[#111827] dark:text-white placeholder-[#71717a] dark:placeholder-white outline-none border-none py-1"
                />
              </div>
            </div>

            <div className="rounded-[6px] bg-white dark:bg-[#2c3037] shadow-xs px-4 py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-black/[0.02] dark:hover:bg-[#363b43] transition-colors border-none">
              <div className="min-w-0 flex-1">
                <div className="font-normal text-sm text-[#111827] dark:text-white">
                  Email address
                </div>
                <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5 leading-normal">
                  Ô nhập địa chỉ thư điện tử xác thực
                </div>
              </div>
              <div className="fluent-input-box relative w-full sm:w-64 h-9 bg-black/5 dark:bg-white/10 flex items-center px-3.5 rounded-[6px] transition-colors border-none backdrop-blur-[50px]">
                <input
                  type="email"
                  placeholder="you@example.com"
                  spellCheck={false}
                  autoCapitalize="off"
                  autoComplete="off"
                  autoCorrect="off"
                  className="w-full bg-transparent text-xs sm:text-[13px] text-[#111827] dark:text-white placeholder-[#71717a] dark:placeholder-white outline-none border-none py-1"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 04 / Progress - Spinning progress (ProgressRing) */}
        <section id="section-progress" className="space-y-3 bg-transparent">
          <div className="flex items-center justify-between py-1 px-1">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#111827] dark:text-white tracking-tight">
                Spinning progress
              </h2>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
                Displays indeterminate or determinate circular progress for ongoing operations.
              </p>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11px] font-semibold ${
              isDarkMode ? 'bg-[#ff82ff]/20 text-[#ff82ff]' : 'bg-[#ff01ff]/15 text-[#ff01ff]'
            }`}>
              <span className="size-2 rounded-full" style={{ backgroundColor: progressAccent }} />
              ProgressRing
            </span>
          </div>

          <div className="space-y-2.5 bg-transparent pt-0.5">
            <div className="rounded-[6px] bg-white dark:bg-[#2c3037] shadow-xs px-4 py-4 sm:p-5 flex flex-col gap-4 border-none hover:bg-black/[0.02] dark:hover:bg-[#363b43] transition-colors">
              <div className="grid gap-6 md:grid-cols-2 items-center">
                {/* Live Preview Area */}
                <div className="flex flex-wrap items-center justify-around gap-6 p-4 rounded-[6px] bg-black/5 dark:bg-black/30 border-none min-h-[120px]">
                  {/* Small (20px) */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-12 flex items-center justify-center">
                      {isProgressActive ? (
                        <SpinningRing size={20} strokeWidth={3} />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-current opacity-25 border-dashed" style={{ borderColor: progressAccent }} />
                      )}
                    </div>
                    <span className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] font-medium">Small (20px)</span>
                  </div>

                  {/* Medium (36px) - Standard */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-12 flex items-center justify-center">
                      {isProgressActive ? (
                        <SpinningRing size={36} strokeWidth={4} />
                      ) : (
                        <div className="w-9 h-9 rounded-full border-2 border-current opacity-25 border-dashed" style={{ borderColor: progressAccent }} />
                      )}
                    </div>
                    <span className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] font-medium">Medium (36px)</span>
                  </div>

                  {/* Large (52px) */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-12 flex items-center justify-center">
                      {isProgressActive ? (
                        <SpinningRing size={52} strokeWidth={5} />
                      ) : (
                        <div className="w-13 h-13 rounded-full border-2 border-current opacity-25 border-dashed" style={{ borderColor: progressAccent }} />
                      )}
                    </div>
                    <span className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] font-medium">Large (52px)</span>
                  </div>

                  {/* Determinate */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-12 flex items-center justify-center relative">
                      <svg width="40" height="40" viewBox="0 0 44 44" className="rotate-[-90deg]">
                        <circle
                          cx="22"
                          cy="22"
                          r="18"
                          fill="none"
                          stroke={isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}
                          strokeWidth="4"
                          data-progress-ring-track="true"
                        />
                        <circle
                          cx="22"
                          cy="22"
                          r="18"
                          fill="none"
                          stroke={progressAccent}
                          strokeWidth="4"
                          data-spinning-ring="true"
                          strokeLinecap="round"
                          strokeDasharray={`${(determinateProgress / 100) * (2 * Math.PI * 18)} ${(2 * Math.PI * 18)}`}
                          className="transition-all duration-200"
                        />
                      </svg>
                      <span className="absolute text-[10px] font-bold text-[#111827] dark:text-white">
                        {determinateProgress}%
                      </span>
                    </div>
                    <span className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] font-medium">Determinate</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <span className="block font-medium text-sm text-[#111827] dark:text-white">IsActive state</span>
                      <span className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">Toggle spinning animation</span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isProgressActive}
                      onClick={() => setIsProgressActive(!isProgressActive)}
                      className={`relative h-5 w-10 rounded-full transition cursor-pointer border-none shrink-0 ${
                        isProgressActive ? (isDarkMode ? 'bg-[#4cc2ff]' : 'bg-[#0078d4]') : (isDarkMode ? 'bg-white/20' : 'bg-black/20')
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 size-4 rounded-full shadow transition-all ${
                          isProgressActive ? 'left-[22px] bg-white dark:bg-black' : 'left-0.5 bg-white'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="pt-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-[#111827] dark:text-white">Determinate value</span>
                      <span className="text-xs font-semibold text-[#0078d4] dark:text-[#4cc2ff]">{determinateProgress}%</span>
                    </div>
                    <input
                      aria-label="Determinate value"
                      type="range"
                      min="0"
                      max="100"
                      value={determinateProgress}
                      onChange={(e) => setDeterminateProgress(Number(e.target.value))}
                      className="winui-slider mt-2 h-1.5 w-full cursor-pointer"
                      style={{ accentColor: primaryAccent }}
                    />
                  </div>

                  <div className="p-2.5 rounded-[6px] bg-black/5 dark:bg-black/30 text-xs font-mono space-y-0.5 border-none">
                    <div className="text-[#6B7280] dark:text-[#9CA3AF] text-[11px]">// WinUI 3 XAML Control</div>
                    <div className="text-[#0078d4] dark:text-[#4cc2ff] font-semibold truncate text-[11.5px]">
                      &lt;ProgressRing IsActive="{isProgressActive ? 'True' : 'False'}" Width="36" Height="36" /&gt;
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 05 / Dialog section */}
        <section id="section-dialogs" className="space-y-3 bg-transparent">
          <div className="py-1 px-1">
            <h2 className="text-base sm:text-lg font-bold text-[#111827] dark:text-white tracking-tight">
              Dialogs
            </h2>
          </div>
          <div className="space-y-3 bg-transparent pt-0.5">
            {/* Live Interactive Preview Card */}
            <div className="rounded-[6px] bg-white dark:bg-[#2c3037] shadow-xs px-4 py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-black/[0.02] dark:hover:bg-[#363b43] transition-colors border-none">
              <div className="flex gap-3 items-center">
                <div className={`w-9 h-9 rounded-[6px] flex items-center justify-center shrink-0 ${
                  isDarkMode ? 'bg-[#4cc2ff]/15 text-[#4cc2ff]' : 'bg-[#0078d4]/10 text-[#0078d4]'
                }`}>
                  <Info className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#111827] dark:text-white">Modal popup dialog preview</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDialogOpen(true)}
                className="inline-flex h-8 shrink-0 items-center justify-center gap-2 rounded-[6px] px-4 text-xs font-semibold transition cursor-pointer shadow-xs bg-[#005fb8] dark:bg-[#4cc2ff] text-white dark:text-black hover:bg-[#106ebe] dark:hover:bg-[#6bd0ff] active:bg-[#005a9e] border-none"
              >
                <span>Mở dialog mẫu</span> <ChevronRight className="size-4" />
              </button>
            </div>

            {/* Animation In/Out Code Snippet Card */}
            <div className="rounded-[6px] bg-white dark:bg-[#2c3037] shadow-xs p-4 sm:p-5 space-y-3.5 border-none">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-[6px] flex items-center justify-center shrink-0 ${
                    isDarkMode ? 'bg-[#4cc2ff]/15 text-[#4cc2ff]' : 'bg-[#0078d4]/10 text-[#0078d4]'
                  }`}>
                    <Code2 className="size-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#111827] dark:text-white">
                      Mã Animation In/Out cho Modal Dialog
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Tab Selector */}
                  <div className="p-0.5 rounded-[6px] bg-black/5 dark:bg-white/10 flex items-center gap-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setDialogCodeTab('variants')}
                      className={`px-2.5 py-1 rounded-[5px] font-medium transition cursor-pointer border-none ${
                        dialogCodeTab === 'variants'
                          ? 'bg-white dark:bg-[#1f2329] text-[#111827] dark:text-white shadow-xs'
                          : 'text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white'
                      }`}
                    >
                      Motion Variants
                    </button>
                    <button
                      type="button"
                      onClick={() => setDialogCodeTab('component')}
                      className={`px-2.5 py-1 rounded-[5px] font-medium transition cursor-pointer border-none ${
                        dialogCodeTab === 'component'
                          ? 'bg-white dark:bg-[#1f2329] text-[#111827] dark:text-white shadow-xs'
                          : 'text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white'
                      }`}
                    >
                      Fullscreen Component
                    </button>
                  </div>

                  {/* Copy Button */}
                  <button
                    type="button"
                    onClick={copyDialogCode}
                    className={`h-8 px-3 rounded-[6px] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border-none shadow-xs ${
                      copiedDialogCode
                        ? 'bg-emerald-500 text-white'
                        : isDarkMode
                          ? 'bg-[#4cc2ff] text-black hover:bg-[#6bd0ff]'
                          : 'bg-[#005fb8] text-white hover:bg-[#106ebe]'
                    }`}
                  >
                    {copiedDialogCode ? <Check className="size-3.5" /> : <FluentCopyIcon className="size-3.5" />}
                    <span>{copiedDialogCode ? 'Đã sao chép' : 'Sao chép mã'}</span>
                  </button>
                </div>
              </div>

              {/* Code Display Area */}
              <div className="relative rounded-[6px] overflow-hidden bg-[#181a1f] dark:bg-[#121417] text-[#e5e7eb] border border-black/10 dark:border-white/10">
                <div className="flex items-center justify-between px-3.5 py-2 bg-black/20 dark:bg-white/5 border-b border-white/5 text-[11px] text-neutral-400 font-mono">
                  <span>{dialogCodeTab === 'variants' ? 'dialogAnimation.ts' : 'FullscreenDialog.tsx'}</span>
                  <span>TypeScript / Motion</span>
                </div>
                <pre className="p-3.5 sm:p-4 text-xs font-mono overflow-x-auto leading-relaxed select-text text-neutral-200 max-h-[320px] overflow-y-auto">
                  <code>{dialogCodeTab === 'variants' ? dialogVariantsCode : dialogComponentCode}</code>
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* 06 / Fluent MDL2 Icons */}
        <section id="section-iconography" className="space-y-3 bg-transparent">
          <div className="flex items-center justify-between py-1 px-1">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#111827] dark:text-white tracking-tight">
                Fluent MDL2 Icons
              </h2>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
                Thư viện biểu tượng chuẩn Fluent MDL2 Icons, Fluent System Icons và Fluent 3D Colore dành cho giao diện WinUI 3 & Windows 11.
              </p>
            </div>
          </div>

          <div className="space-y-2.5 bg-transparent pt-0.5">
            <div className="rounded-[6px] bg-white dark:bg-[#2c3037] shadow-xs p-4 sm:p-5 space-y-4 border-none hover:bg-black/[0.02] dark:hover:bg-[#363b43] transition-colors">
              {/* Search, Filter Tabs & Size Controls */}
              <div className="flex flex-col gap-3">
                {/* Search Bar + Size Picker */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="fluent-search-box group relative flex-1 max-w-md h-9 bg-[#fbfbfb] focus-within:bg-white dark:bg-[#282c31] dark:focus-within:bg-[#282c31] flex items-center px-3.5 rounded-[6px] transition-colors border-none">
                    <FluentSearchIcon className="w-[16px] h-[16px] text-black dark:text-white shrink-0 pointer-events-none select-none mr-2" />
                    <input
                      type="text"
                      value={iconSearchTerm}
                      onChange={(e) => setIconSearchTerm(e.target.value)}
                      placeholder="Tìm biểu tượng (copy, home, settings...)..."
                      className="w-full bg-transparent text-xs sm:text-[13px] text-black dark:text-white placeholder-black/75 dark:placeholder-white outline-none border-none py-1"
                    />
                    {iconSearchTerm && (
                      <button
                        type="button"
                        onClick={() => setIconSearchTerm('')}
                        className="text-black dark:text-white hover:text-black dark:hover:text-white cursor-pointer ml-1 p-0.5 border-none"
                        title="Clear search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Size Preview Selector */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    <span className="text-[11px] font-medium mr-1 text-[#6B7280] dark:text-[#9CA3AF]">Kích thước:</span>
                    {[16, 20, 24, 32].map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setIconPreviewSize(sz)}
                        className={`h-7 px-2.5 rounded-[6px] text-[11px] font-semibold cursor-pointer transition-all border-none ${
                          iconPreviewSize === sz
                            ? 'bg-[#0078d4] dark:bg-[#4cc2ff] text-white dark:text-black shadow-xs font-normal'
                            : 'bg-black/5 dark:bg-black/30 text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white'
                        }`}
                      >
                        {sz}px
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: 'all', label: 'Tất cả' },
                    { id: 'system', label: 'Hệ thống (System)' },
                    { id: 'media', label: 'Truyền thông & Đồ họa' },
                    { id: 'doc', label: 'Tài liệu & Thư mục' },
                    { id: '3d', label: 'Fluent 3D Colore' },
                  ].map((cat) => {
                    const isActive = iconCategoryFilter === cat.id;
                    const count = cat.id === 'all'
                      ? ICON_CATALOG.length
                      : ICON_CATALOG.filter((i) => i.category === cat.id).length;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setIconCategoryFilter(cat.id as any)}
                        className={`px-3 py-1.5 rounded-[6px] text-xs transition-colors cursor-pointer border-none ${
                          isActive
                            ? 'bg-[#0078d4] dark:bg-[#4cc2ff] text-white dark:text-black shadow-xs font-normal'
                            : 'bg-black/5 dark:bg-black/30 text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white font-normal'
                        }`}
                      >
                        {cat.label} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Icon Grid - Solid background, matching Settings */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 pt-1">
                {filteredIcons.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                    Không tìm thấy biểu tượng phù hợp với "{iconSearchTerm}".
                  </div>
                ) : (
                  filteredIcons.map((item) => {
                    const isSelected = selectedIconItem.name === item.name;
                    const IconComp = item.component;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setSelectedIconItem(item)}
                        className={`group relative flex flex-col items-center justify-center p-3 rounded-[6px] text-center transition-all cursor-pointer border-none ${
                          isSelected
                            ? 'bg-[#0078d4]/15 dark:bg-[#4cc2ff]/20 text-[#0078d4] dark:text-[#4cc2ff] shadow-xs'
                            : 'bg-black/5 dark:bg-black/30 hover:bg-black/10 dark:hover:bg-black/50 text-[#111827] dark:text-white'
                        }`}
                      >
                        <div
                          className="flex items-center justify-center mb-2"
                          style={{ width: `${Math.max(36, iconPreviewSize + 12)}px`, height: `${Math.max(36, iconPreviewSize + 12)}px` }}
                        >
                          <div style={{ width: `${iconPreviewSize}px`, height: `${iconPreviewSize}px` }} className="flex items-center justify-center">
                            <IconComp
                              className="w-full h-full object-contain"
                              style={{ color: isSelected ? (isDarkMode ? '#4cc2ff' : '#005fb8') : 'currentColor' }}
                            />
                          </div>
                        </div>
                        <span className={`text-[11.5px] font-medium leading-tight truncate w-full ${
                          isSelected
                            ? isDarkMode ? 'text-[#4cc2ff] font-semibold' : 'text-[#005fb8] font-semibold'
                            : isDarkMode ? 'text-white' : 'text-[#111827]'
                        }`}>
                          {item.name}
                        </span>
                        <span className={`text-[10px] mt-0.5 truncate w-full ${isDarkMode ? 'text-white/40' : 'text-black/45'}`}>
                          {item.componentName}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Selected Icon Inspector Banner */}
              {selectedIconItem && (
                <div className="mt-4 p-4 rounded-[6px] bg-black/5 dark:bg-black/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-none">
                  <div className="flex items-center gap-3.5">
                    <div className="size-13 rounded-[6px] flex items-center justify-center shrink-0 bg-white dark:bg-[#2c3037] shadow-xs border-none">
                      {React.createElement(selectedIconItem.component, {
                        className: 'size-7 object-contain',
                        style: { color: isDarkMode ? '#4cc2ff' : '#005fb8' },
                      })}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-current">{selectedIconItem.name}</h3>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-[6px] bg-black/5 dark:bg-black/30 text-[#6B7280] dark:text-[#9CA3AF]">
                          {selectedIconItem.category}
                        </span>
                        {selectedIconItem.is3D && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-[6px] bg-pink-500/15 text-pink-400">
                            3D Colore
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
                        {selectedIconItem.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    {/* Copy Name */}
                    <button
                      type="button"
                      onClick={() => copyIconCode(selectedIconItem.name, 'name')}
                      className={`h-8 px-3 rounded-[6px] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border-none ${
                        copiedIconCode === 'name'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-white dark:bg-[#2c3037] shadow-xs hover:bg-black/[0.02] dark:hover:bg-[#363b43] text-current'
                      }`}
                    >
                      {copiedIconCode === 'name' ? <Check className="size-3 text-emerald-400" /> : <FluentCopyIcon className="size-3.5" />}
                      <span>{copiedIconCode === 'name' ? 'Đã sao chép' : 'Sao chép tên'}</span>
                    </button>

                    {/* Copy React Code */}
                    <button
                      type="button"
                      onClick={() => copyIconCode(`<${selectedIconItem.componentName} className="w-5 h-5" />`, 'code')}
                      className={`h-8 px-3 rounded-[6px] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs border-none ${
                        copiedIconCode === 'code'
                          ? 'bg-emerald-500 text-white'
                          : isDarkMode
                            ? 'bg-[#4cc2ff] text-black hover:bg-[#6bd0ff]'
                            : 'bg-[#005fb8] text-white hover:bg-[#106ebe]'
                      }`}
                    >
                      {copiedIconCode === 'code' ? <Check className="size-3 text-white" /> : <Code2 className="size-3.5" />}
                      <span>{copiedIconCode === 'code' ? 'Đã sao chép JSX' : 'Sao chép Component'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Confirmation Dialog Modal */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isDialogOpen && (
              <div className="fixed inset-0 z-[2147483647] flex items-center justify-center p-4 sm:p-6 select-none">
                <motion.div
                  variants={modalBackdropVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  onClick={() => setIsDialogOpen(false)}
                  className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-xs"
                />
                <motion.div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="winui-dialog-title"
                  variants={modalDialogVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="fluent-modal-dialog relative z-10 w-full max-w-[480px] bg-white dark:bg-[#202020] rounded-[10px] overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.22),0_2px_6px_rgba(0,0,0,0.08)] dark:shadow-[0_24px_48px_rgba(0,0,0,0.7),0_2px_6px_rgba(255,255,255,0.04)] text-[#111827] dark:text-[#F3F4F6] border border-black/[0.08] dark:border-white/[0.08]"
                >
                  <div className="p-6 pb-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-[#005fb8] dark:text-[#4cc2ff]">ContentDialog</p>
                        <h2 id="winui-dialog-title" className="mt-2 text-[19px] sm:text-[20px] font-semibold tracking-tight text-[#111827] dark:text-white leading-snug">Apply these settings?</h2>
                      </div>
                      <button type="button" aria-label="Close dialog" onClick={() => setIsDialogOpen(false)} className="rounded-[6px] p-1.5 text-[#4b5563] hover:bg-black/5 dark:text-white/45 dark:hover:bg-white/10 cursor-pointer border-none">
                        <X className="size-4" />
                      </button>
                    </div>
                    <p className="mt-2.5 text-[13.5px] sm:text-[14px] leading-relaxed text-[#4b5563] dark:text-[#a1a1aa] font-normal">
                      Your selected controls will be applied to the current workspace.
                    </p>
                  </div>
                  <div className="h-[1px] w-full bg-[#E5E5E5] dark:bg-[#2F2F2F]" />
                  <div className="fluent-modal-footer bg-[#F3F3F3] dark:bg-[#1C1C1C] px-6 py-3 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsDialogOpen(false)}
                      className="fluent-btn-secondary px-4 h-8 rounded-[6px] bg-white dark:bg-[#2C2C2C] hover:bg-[#F9F9F9] dark:hover:bg-[#343434] text-[#111827] dark:text-white text-[12.5px] shadow-xs transition-colors flex items-center justify-center cursor-pointer border-none"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDialogOpen(false)}
                      className={`fluent-btn-primary px-4 h-8 rounded-[6px] ${isDarkMode ? 'bg-[#4cc2ff] text-black hover:bg-[#6bd0ff]' : 'bg-[#005fb8] text-white hover:bg-[#106ebe]'} font-semibold shadow-xs transition-colors flex items-center justify-center cursor-pointer text-[12.5px] border-none`}
                    >
                      Apply
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </motion.div>
  );
};

export default WinUI3;
