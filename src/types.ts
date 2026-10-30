export type QualityType = '4K' | 'HD' | 'SD';

export type ChannelCategory = 
  | 'Kênh VTV'
  | 'Kênh VTVcab'
  | 'Kênh HTV'
  | 'Kênh SCTV'
  | 'Kênh thiết yếu'
  | 'Kênh địa phương'
  | 'Kênh quốc tế'
  | 'Kênh phát thanh'
  | string;

export interface Channel {
  id: string;
  name: string;
  shortName?: string;
  channelNumber?: number;
  channelCode?: string;
  slug: string;
  logo: string;
  category: ChannelCategory;
  quality: QualityType;
  streamUrl: string;
  backupStreamUrl?: string;
  isLive: boolean;
  viewers?: number;
  currentProgram: {
    title: string;
    startTime: string;
    endTime: string;
    progress: number; // 0 - 100
    description: string;
  };
  nextProgram?: {
    title: string;
    startTime: string;
  };
  description: string;
  resolution?: string;
  bitrate?: string;
  satelliteFrequency?: string;
  dvbT2Channel?: string;
  officialWebsite?: string;
  tags?: string[];
  bannerImage?: string;
}

export interface ProgramScheduleItem {
  id: string;
  channelId: string;
  title: string;
  startTime: string;
  endTime: string;
  category: string;
  description: string;
  isLive?: boolean;
}

export interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  coverImage: string;
  category: 'Thời sự truyền hình' | 'Công nghệ phát sóng' | 'Hậu trường & Kỹ thuật' | 'Đồ hoạ & Nhận diện' | 'Tư liệu & Lịch sử' | 'Cộng đồng & Kỷ niệm' | 'Cập nhật hệ thống' | 'Insider Preview' | 'System Updates' | '' | string;
  publishedAt: string;
  readingTime: string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  excerpt: string;
  content: string[];
  tags: string[];
  summary?: {
    lead: string;
    points: string[];
    conclusion: string;
  };
  relatedChannelId?: string;
  featured?: boolean;
  isLocked?: boolean;
  password?: string;
  treeDiagram?: {
    nodes: string[];
  };
}

export interface HeroSlide {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  category: string;
  quality: string;
  badge: string;
  channelId: string;
  channelLogo?: string;
  channelName?: string;
  backgroundImage: string;
  ctaText?: string;
  director?: string;
  externalUrl?: string;
  internalUrl?: string;
}

export interface UserSettings {
  autoPlay: boolean;
  defaultQuality: 'auto' | '1080p' | '720p' | '480p';
  volume: number;
  muted: boolean;
  lowLatency: boolean;
  hardwareAcceleration: boolean;
  showEpgOverlay: boolean;
  enableNoiseFilter: boolean;
  theme: 'dark' | 'oled';
}

export type KeybindAction = 
  | 'home'
  | 'search'
  | 'tools'
  | 'settings'
  | 'recentChannel';

export interface KeybindDefinition {
  id: KeybindAction;
  label: string;
  description: string;
  defaultKey: string; // e.g. "Alt+1"
}

export type CustomKeybinds = Record<KeybindAction, string>;
