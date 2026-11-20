export interface WallpaperOption {
  id: string;
  label: string;
  mode: 'light' | 'dark';
  image: string;
  accent: string;
  taskbarBg: string;
  isDefault?: boolean;
}

export const DEFAULT_WALLPAPER_ID = 'waves-ocean-light';

export const WINDOWS_WALLPAPERS: WallpaperOption[] = [
  {
    id: 'waves-ocean-light',
    label: 'Waves Ocean Light',
    mode: 'light',
    image: '/assets/aistudio/WIP_Light_184e3e28.png',
    accent: '#0067b8',
    taskbarBg: 'bg-white/85',
    isDefault: true,
  },
  {
    id: 'waves-ocean-dark',
    label: 'Waves Ocean Dark',
    mode: 'dark',
    image: '/assets/aistudio/WIP_Dark_32dc0df4.png',
    accent: '#4cc2ff',
    taskbarBg: 'bg-[#1c2026]/90',
  },
  {
    id: 'waves-lavender-light',
    label: 'Waves Lavender Light',
    mode: 'light',
    image: '/assets/aistudio/01-Purple_LM-4K_e12d77d6.png',
    accent: '#0067b8',
    taskbarBg: 'bg-white/85',
  },
  {
    id: 'waves-lavender-dark',
    label: 'Waves Lavender Dark',
    mode: 'dark',
    image: '/assets/aistudio/01-Purple_DM-4K_b8cfa939.png',
    accent: '#4cc2ff',
    taskbarBg: 'bg-[#1c2026]/90',
  },
  {
    id: 'waves-emerald-light',
    label: 'Waves Emerald Light',
    mode: 'light',
    image: '/assets/aistudio/02-Green_Blue_LM-4K_18e2263a.png',
    accent: '#0067b8',
    taskbarBg: 'bg-white/85',
  },
  {
    id: 'waves-emerald-dark',
    label: 'Waves Emerald Dark',
    mode: 'dark',
    image: '/assets/aistudio/02-Green_Blue_DM-4K_ee0b7443.png',
    accent: '#4cc2ff',
    taskbarBg: 'bg-[#1c2026]/90',
  },
  {
    id: 'waves-fire-light',
    label: 'Waves Fire Light',
    mode: 'light',
    image: '/assets/aistudio/04-Pink_Orange_LM-4K_2ba4977f.png',
    accent: '#0067b8',
    taskbarBg: 'bg-white/85',
  },
  {
    id: 'waves-fire-dark',
    label: 'Waves Fire Dark',
    mode: 'dark',
    image: '/assets/aistudio/04-Pink_Orange_DM-4K_4829cf04.png',
    accent: '#4cc2ff',
    taskbarBg: 'bg-[#1c2026]/90',
  },
];

export const getWallpaperById = (id?: string | null): WallpaperOption => {
  return WINDOWS_WALLPAPERS.find((w) => w.id === id) || WINDOWS_WALLPAPERS[0];
};
