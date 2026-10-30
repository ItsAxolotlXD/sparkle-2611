// Service to fetch real-time Electronic Program Guide (EPG) from https://epg.io.vn/
import { Channel } from '../types';

export interface EpgProgram {
  id: string;
  start: string; // ISO string e.g. "2026-10-12T19:00:00+07:00"
  stop: string;  // ISO string e.g. "2026-10-12T19:40:00+07:00"
  title: string;
  description: string;
  categories: string[];
  thumbnail?: string;
  startTimeText: string; // e.g. "19:00"
  stopTimeText: string;  // e.g. "19:40"
  durationMinutes: number;
  isLive: boolean;
  isPast: boolean;
  isUpcoming: boolean;
  progress: number; // 0 - 100
}

export interface EpgGuideResponse {
  channel: string;
  channelName: string;
  timezone: string;
  dates: string[];
  programs: EpgProgram[];
  fetchedAt: number;
}

// Map local channel IDs/slugs to epg.io.vn channel IDs
const CHANNEL_EPG_MAP: Record<string, string> = {
  // VTV
  'vtv1': 'vtv1hd',
  'vtv2': 'vtv2hd',
  'vtv3': 'vtv3hd',
  'vtv4': 'vtv4hd',
  'vtv5': 'vtv5hd',
  'vtv5_tay_nam_bo': 'vtv5hdtnb',
  'vtv5_tay_nguyen': 'vtv5hdtn',
  'vtv6': 'vtv6hd',
  'vtv7': 'vtv7hd',
  'vtv8': 'vtv8hd',
  'vtv9': 'vtv9hd',
  'vtv10': 'vtv10hd',
  'vn_today': 'vietnamtoday',
  'vietnam_today': 'vietnamtoday',

  // HTV
  'htv1': 'htv1',
  'htv2': 'htv2hd',
  'htv3': 'htv3',
  'htv4': 'htv4',
  'htv5': 'htv5',
  'htv7': 'htv7hd',
  'htv9': 'htv9hd',
  'htv_thethao': 'htvthethaohd',
  'htvc_thethao': 'htvcthethao',
  'htvc_canhac': 'htvccanhachd',
  'htvc_dulich': 'htvcdulichhd',
  'htvc_giadinh': 'htvcgiadinhhd',
  'htvc_phimhd': 'htvcphimhd',
  'htvc_phunu': 'htvcphunuhd',
  'htvc_thuanviethd': 'htvcthuanviet',

  // VTVcab / ON
  'on_trending': 'ontrending',
  'on_kids': 'onkids',
  'on_golf': 'ongolf',
  'on_e_channel': 'onechannel',
  'on_vie_giaitri': 'onviegiaitri',
  'on_vie_dramas': 'onviedramas',
  'on_phimviet': 'onphimviet',
  'on_movies_youtv': 'onmovies',
  'on_o2tv': 'ono2tv',
  'on_bibi': 'onbibi',
  'on_infotv': 'oninfotv',
  'on_cine': 'oncine',
  'on_styletv': 'onstyle',
  'on_music': 'onmusic',
  'on_vfamily': 'onvfamily',
  'on_life': 'onlife',
  'on_football': 'onfootball',
  'on_sports': 'onsports',
  'on_sports_news': 'onsportsnews',

  // SCTV
  'sctv1': 'sctv1hd',
  'sctv2': 'sctv2hd',
  'sctv3': 'sctv3hd',
  'sctv4': 'sctv4hd',
  'sctv5': 'sctv5hd',
  'sctv6': 'sctv6hd',
  'sctv7': 'sctv7hd',
  'sctv8': 'sctv8hd',
  'sctv9': 'sctv9hd',
  'sctv10': 'sctv10hd',
  'sctv11': 'sctv11hd',
  'sctv12': 'sctv12hd',
  'sctv13': 'sctv13hd',
  'sctv14': 'sctv14hd',
  'sctv15': 'sctv15hd',
  'sctv16': 'sctv16hd',
  'sctv17': 'sctv17hd',
  'sctv18': 'sctv18hd',
  'sctv19': 'sctv19hd',
  'sctv20': 'sctv20hd',
  'sctv21': 'sctv21hd',
  'sctv22': 'sctv22hd',

  // Vĩnh Long
  'vinh_long_1': 'vinhlong1hd',
  'vinh_long_2': 'vinhlong2hd',
  'vinh_long_3': 'vinhlong3hd',
  'vinh_long_4': 'vinhlong4hd',
  'vinh_long_5': 'vinhlong5hd',

  // Hà Nội & Tỉnh thành
  'ha_noi_1': 'hanoihd1',
  'ha_noi_2': 'hanoihd2',
  'hai_phong': 'haiphong',
  'hai_phong_3': 'haiphong3',
  'da_nang_1': 'danang1',
  'da_nang_2': 'danang2',
  'can_tho_1': 'cantho1',
  'can_tho_2': 'cantho2',
  'can_tho_3': 'cantho3',
  'dong_nai_1': 'dongnai1',
  'dong_nai_2': 'dongnai2',
  'dong_thap_1': 'dongthap1',
  'dong_thap_2': 'dongthap2',
  'thanh_hoa': 'thanhhoa',
  'nghe_an': 'nghean',
  'hue': 'hue',
  'quang_ninh_1': 'quangninh1',
  'quang_ninh_3': 'quangninh3',
  'khanh_hoa': 'khanhhoa',
  'khanh_hoa_1': 'khanhhoa1',
  'lam_dong_1': 'lamdong1',
  'lam_dong_2': 'lamdong2',
  'lam_dong_3': 'lamdong3',
  'dak_lak': 'daklak',
  'gia_lai': 'gialai',
  'tay_ninh': 'tayninh',
  'ca_mau': 'camau',
  'bac_ninh': 'bacninh',
  'thai_nguyen': 'thainguyen',
  'phu_tho': 'phutho',
  'hung_yen': 'hungyen',
  'ninh_binh': 'ninhbinh',
  'ha_tinh': 'hatinh',
  'quang_tri': 'quangtri',
  'quang_ngai_1': 'quangngai1',
  'quang_ngai_2': 'quangngai2',
  'dien_bien': 'dienbien',
  'lai_chau': 'laichau',
  'son_la': 'sonla',
  'lao_cai': 'laocai',
  'cao_bang': 'caobang',
  'lang_son': 'langson',
  'tuyen_quang': 'tuyenquang',

  // Radio
  'vov1': 'vov1',
  'vov2': 'vov2',
  'vov3': 'vov3',
  'vov4': 'vov4tn',
  'vov5': 'vov5',
  'vov_giao_thong': 'vovgthn',
  'vov_gt_hn': 'vovgthn',
  'vov_gt_hcm': 'vovgthcm',
  'vov_gt_mekong': 'vovgtmekong',
  'vov_gt_duyenhai': 'vovgtduyenhai',
  'hanoi_fm90': 'hanoi90',
  'hanoi_fm96': 'hanoi96',
};

// In-memory cache to prevent excessive requests
const epgCache = new Map<string, { data: EpgGuideResponse; timestamp: number }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute fresh cache

// In-memory remote channels catalog from epg.io.vn
let remoteChannelsCache: { id: string; name: string }[] | null = null;

export async function fetchRemoteChannelsCatalog(): Promise<{ id: string; name: string }[]> {
  if (remoteChannelsCache) return remoteChannelsCache;
  try {
    const res = await fetch('https://epg.io.vn/api/v1/channels', {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json && Array.isArray(json.data)) {
      remoteChannelsCache = json.data;
      return json.data;
    }
  } catch (err) {
    console.warn('Could not fetch epg.io.vn channel catalog:', err);
  }
  return [];
}

export function resolveEpgChannelId(channel: Channel): string {
  const normId = channel.id.toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (CHANNEL_EPG_MAP[normId]) {
    return CHANNEL_EPG_MAP[normId];
  }
  const normSlug = (channel.slug || '').toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (CHANNEL_EPG_MAP[normSlug]) {
    return CHANNEL_EPG_MAP[normSlug];
  }

  // Name based heuristics
  const nameNorm = channel.name.toLowerCase().replace(/\s+/g, '');
  if (nameNorm.includes('vtv1')) return 'vtv1hd';
  if (nameNorm.includes('vtv2')) return 'vtv2hd';
  if (nameNorm.includes('vtv3')) return 'vtv3hd';
  if (nameNorm.includes('vtv4')) return 'vtv4hd';
  if (nameNorm.includes('vtv5')) return 'vtv5hd';
  if (nameNorm.includes('vtv6')) return 'vtv6hd';
  if (nameNorm.includes('vtv7')) return 'vtv7hd';
  if (nameNorm.includes('vtv8')) return 'vtv8hd';
  if (nameNorm.includes('vtv9')) return 'vtv9hd';
  if (nameNorm.includes('htv7')) return 'htv7hd';
  if (nameNorm.includes('htv9')) return 'htv9hd';
  if (nameNorm.includes('htv2')) return 'htv2hd';
  if (nameNorm.includes('thvl1') || nameNorm.includes('vinhlong1')) return 'vinhlong1hd';
  if (nameNorm.includes('thvl2') || nameNorm.includes('vinhlong2')) return 'vinhlong2hd';

  // Fallback: stripped alphanumeric
  return normId || 'vtv1hd';
}

function formatTimeString(isoString: string): string {
  try {
    const d = new Date(isoString);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch {
    return '00:00';
  }
}

export async function fetchChannelEpgGuide(
  channel: Channel,
  date?: string,
  forceRefresh = false
): Promise<EpgGuideResponse> {
  const epgChannelId = resolveEpgChannelId(channel);
  const cacheKey = `${epgChannelId}_${date || 'default'}`;

  if (!forceRefresh && epgCache.has(cacheKey)) {
    const cached = epgCache.get(cacheKey)!;
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      // Re-evaluate live progress with current timestamp
      return recomputeProgramStatus(cached.data);
    }
  }

  let url = `https://epg.io.vn/api/v1/guide?channel=${encodeURIComponent(epgChannelId)}`;
  if (date) {
    url += `&date=${encodeURIComponent(date)}`;
  }

  let raw: any;
  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });
    if (!response.ok) throw new Error(`EPG server responded with HTTP ${response.status}`);
    raw = await response.json();
  } catch (directErr) {
    try {
      const fallbackUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const fbRes = await fetch(fallbackUrl);
      if (!fbRes.ok) throw new Error(`Fallback HTTP ${fbRes.status}`);
      raw = await fbRes.json();
    } catch {
      throw directErr;
    }
  }

  const rawPrograms = Array.isArray(raw.data) ? raw.data : [];

  const now = Date.now();

  const programs: EpgProgram[] = rawPrograms.map((p: any) => {
    const startTime = new Date(p.start).getTime();
    const stopTime = new Date(p.stop).getTime();
    const durationMinutes = Math.max(1, Math.round((stopTime - startTime) / 60000));

    const isLive = now >= startTime && now < stopTime;
    const isPast = now >= stopTime;
    const isUpcoming = now < startTime;

    let progress = 0;
    if (isLive && stopTime > startTime) {
      progress = Math.min(100, Math.max(0, Math.round(((now - startTime) / (stopTime - startTime)) * 100)));
    } else if (isPast) {
      progress = 100;
    }

    return {
      id: p.id || `${startTime}-${p.title}`,
      start: p.start,
      stop: p.stop,
      title: p.title || 'Chương trình phát sóng',
      description: p.description || '',
      categories: Array.isArray(p.categories) ? p.categories : [],
      thumbnail: p.thumbnail || p.enrichment?.tv360?.thumbnail || p.enrichment?.mytv?.thumbnail,
      startTimeText: formatTimeString(p.start),
      stopTimeText: formatTimeString(p.stop),
      durationMinutes,
      isLive,
      isPast,
      isUpcoming,
      progress,
    };
  });

  const guideData: EpgGuideResponse = {
    channel: epgChannelId,
    channelName: raw.channel_data?.name || channel.name,
    timezone: raw.timezone || 'Asia/Ho_Chi_Minh',
    dates: Array.isArray(raw.dates) ? raw.dates : [],
    programs,
    fetchedAt: Date.now(),
  };

  epgCache.set(cacheKey, { data: guideData, timestamp: Date.now() });
  return guideData;
}

function recomputeProgramStatus(guide: EpgGuideResponse): EpgGuideResponse {
  const now = Date.now();
  const updated = guide.programs.map((p) => {
    const startTime = new Date(p.start).getTime();
    const stopTime = new Date(p.stop).getTime();
    const isLive = now >= startTime && now < stopTime;
    const isPast = now >= stopTime;
    const isUpcoming = now < startTime;

    let progress = 0;
    if (isLive && stopTime > startTime) {
      progress = Math.min(100, Math.max(0, Math.round(((now - startTime) / (stopTime - startTime)) * 100)));
    } else if (isPast) {
      progress = 100;
    }

    return {
      ...p,
      isLive,
      isPast,
      isUpcoming,
      progress,
    };
  });

  return {
    ...guide,
    programs: updated,
  };
}

export interface EpgSearchResultItem {
  channel: Channel;
  program: EpgProgram;
}

export function normalizeVietnamese(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .trim();
}

// Major channels prioritized for fast search
const POPULAR_SEARCH_EPG_IDS = [
  'vtv1', 'vtv2', 'vtv3', 'vtv4', 'vtv5', 'vtv7', 'vtv8', 'vtv9',
  'htv7', 'htv9', 'htv2', 'vinh_long_1', 'vinh_long_2', 'sctv1', 'sctv9',
  'on_football', 'on_sports', 'ha_noi_1', 'da_nang_1'
];

export async function searchEpgSchedule(
  query: string,
  channels: Channel[]
): Promise<EpgSearchResultItem[]> {
  const normQ = normalizeVietnamese(query);
  if (!normQ || normQ.length < 2) return [];

  // Filter channels available in current channel list that have EPG support
  const targetChannels = channels.filter((c) => {
    const id = c.id.toLowerCase();
    const slug = (c.slug || '').toLowerCase();
    return !!CHANNEL_EPG_MAP[id] || !!CHANNEL_EPG_MAP[slug] || POPULAR_SEARCH_EPG_IDS.includes(id);
  });

  // Prioritize top channels first
  targetChannels.sort((a, b) => {
    const aTop = POPULAR_SEARCH_EPG_IDS.includes(a.id) ? 1 : 0;
    const bTop = POPULAR_SEARCH_EPG_IDS.includes(b.id) ? 1 : 0;
    return bTop - aTop;
  });

  // Take top 20 channels to fetch/search
  const selectedChannels = targetChannels.slice(0, 20);

  const results: EpgSearchResultItem[] = [];

  const promises = selectedChannels.map(async (channel) => {
    try {
      const guide = await fetchChannelEpgGuide(channel);
      if (!guide || !guide.programs) return;

      for (const prog of guide.programs) {
        const progTitleNorm = normalizeVietnamese(prog.title);
        const progDescNorm = normalizeVietnamese(prog.description || '');

        if (progTitleNorm.includes(normQ) || progDescNorm.includes(normQ)) {
          results.push({ channel, program: prog });
        }
      }
    } catch {
      // Ignore individual channel fetch failures
    }
  });

  await Promise.allSettled(promises);

  // Sort by priority: Live first, then upcoming, then past (most recent first)
  return results.sort((a, b) => {
    if (a.program.isLive && !b.program.isLive) return -1;
    if (!a.program.isLive && b.program.isLive) return 1;
    if (a.program.isUpcoming && !b.program.isUpcoming) return -1;
    if (!a.program.isUpcoming && b.program.isUpcoming) return 1;
    return new Date(b.program.start).getTime() - new Date(a.program.start).getTime();
  });
}

