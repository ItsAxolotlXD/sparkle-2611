import { SystemSettings } from '../hooks/useSettings';

export interface ViveFeatureDefinition {
  key: keyof SystemSettings;
  name: string;
  description: string;
}

export interface ViveFeature extends ViveFeatureDefinition {
  id: string;
}

const VIVE_FEATURE_DEFS: ViveFeatureDefinition[] = [
  {
    key: 'tabbedSparkle',
    name: 'Tabbed Sparkle',
    description: 'Transforms the top bar into a multi-tab bar like Windows 11 File Explorer.',
  },
  {
    key: 'windowsMode',
    name: 'Windows Mode',
    description: 'Turns Sparkle into a Windows 11 desktop with bottom taskbar, Start menu, and floating windows.',
  },
  {
    key: 'refreshedSearchIcon',
    name: 'Refreshed Search Icon',
    description: 'Updates the top bar search icon for light, dark, and focused states.',
  },
  {
    key: 'nativeKeyboard',
    name: 'Touch Keyboard',
    description: 'Shows an on-screen keyboard when you focus a text field.',
  },
  {
    key: 'useFlumojs',
    name: 'Use Flumojs',
    description: 'Render app emoji with Fluent 3D artwork from Fluent Deck.',
  },
  {
    key: 'dynamicSidebarIcons',
    name: 'Dynamic Sidebar Icons',
    description: 'Animates and highlights sidebar icons dynamically based on active state.',
  },
  {
    key: 'animatedBootScreen',
    name: 'Animated Boot Screen',
    description: 'Displays an animated video boot screen during startup.',
  },
];

const VIVE_IDS_STORAGE_KEY = 'sparkle_vive_feature_ids_v1';

const FALLBACK_RANDOM_IDS: Record<string, string> = {
  tabbedSparkle: '48291034',
  windowsMode: '57392018',
  refreshedSearchIcon: '63918472',
  nativeKeyboard: '71840295',
  useFlumojs: '84920156',
  dynamicSidebarIcons: '92047183',
  animatedBootScreen: '36481927',
};

function generateRandom8DigitId(existing: Set<string>): string {
  for (let i = 0; i < 50; i++) {
    const candidate = String(Math.floor(10000000 + Math.random() * 90000000));
    if (!existing.has(candidate)) {
      existing.add(candidate);
      return candidate;
    }
  }
  let fallback = 10000000;
  while (existing.has(String(fallback))) {
    fallback++;
  }
  const str = String(fallback);
  existing.add(str);
  return str;
}

function loadOrCreateViveFeatureIds(): Record<string, string> {
  if (typeof window === 'undefined') {
    return { ...FALLBACK_RANDOM_IDS };
  }

  let stored: Record<string, string> = {};
  try {
    const raw = localStorage.getItem(VIVE_IDS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        stored = parsed;
      }
    }
  } catch {}

  const used = new Set<string>();
  const resolved: Record<string, string> = {};
  let changed = false;

  for (const def of VIVE_FEATURE_DEFS) {
    const k = String(def.key);
    const existingId = stored[k];
    if (typeof existingId === 'string' && /^\d{8}$/.test(existingId) && !used.has(existingId)) {
      resolved[k] = existingId;
      used.add(existingId);
    } else {
      resolved[k] = generateRandom8DigitId(used);
      changed = true;
    }
  }

  if (changed) {
    try {
      localStorage.setItem(VIVE_IDS_STORAGE_KEY, JSON.stringify(resolved));
    } catch {}
  }

  return resolved;
}

const VIVE_FEATURE_IDS = loadOrCreateViveFeatureIds();

export const VIVE_FEATURES: ViveFeature[] = VIVE_FEATURE_DEFS.map((def) => ({
  ...def,
  id: VIVE_FEATURE_IDS[String(def.key)] || FALLBACK_RANDOM_IDS[String(def.key)],
}));

export function getViveFeatures(): ViveFeature[] {
  return VIVE_FEATURES;
}

export function getViveFeatureId(key: keyof SystemSettings): string | undefined {
  return VIVE_FEATURES.find((f) => f.key === key)?.id;
}

export function findViveFeatureById(id: string): ViveFeature | undefined {
  const cleanId = id.trim();
  return VIVE_FEATURES.find((f) => f.id === cleanId);
}
