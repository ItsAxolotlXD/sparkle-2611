import { useEffect, useMemo, useState } from 'react';
import { Aperture, Calculator, ChevronDown, ChevronRight, Clock3, FileText, Folder, Image, LayoutGrid, Monitor, Music2, Paintbrush, Power, Recycle, Search, Settings, Sparkles, StickyNote, Video, Wifi, Volume2, CloudSun, X } from 'lucide-react';
import './sparkos.css';

type AppItem = { name: string; icon: typeof Image; color: string; subtitle?: string };
const apps: AppItem[] = [
  { name: 'Edge', icon: Aperture, color: '#22b9db' }, { name: 'Photos', icon: Image, color: '#42b5f5' }, { name: 'Word', icon: FileText, color: '#1689e7' }, { name: 'Excel', icon: LayoutGrid, color: '#21a366' }, { name: 'PowerPoint', icon: Image, color: '#ed604b' }, { name: 'OneNote', icon: StickyNote, color: '#a443db' },
  { name: 'File Explorer', icon: Folder, color: '#f6bb25' }, { name: 'Settings', icon: Settings, color: '#a9bbc9' }, { name: 'Get Started', icon: Sparkles, color: '#43c9ef' }, { name: 'Notepad', icon: StickyNote, color: '#4bc8df' }, { name: 'Calculator', icon: Calculator, color: '#9baab3' }, { name: 'Clock', icon: Clock3, color: '#c1cbd1' },
  { name: 'Firefox', icon: Aperture, color: '#f5812a' }, { name: 'Media Player', icon: Video, color: '#f58056' }, { name: 'Paint', icon: Paintbrush, color: '#29bfce' }, { name: 'Microsoft Store', icon: LayoutGrid, color: '#fff' }, { name: 'Minecraft', icon: Monitor, color: '#69b744' }, { name: 'Gallery', icon: Image, color: '#41c8e8' },
];
const galleryPhotos = [
  { name: 'Ocean memories', src: '/assets/aistudio/Wallpaper_Alchemy_-_Windows_11_Abstract_Wave_Wallpaper_4K_e12d77d6.png', category: 'Photos' },
  { name: 'Garden in bloom', src: '/assets/aistudio/pink-nature-landscape-with-vegetation-flora_8a81cb83.jpg', category: 'Photos' },
  { name: 'SparkOS concept', src: '/assets/aistudio/image_01f68a03.png', category: 'Screenshots' },
  { name: 'Studio notes', src: '/assets/aistudio/image_13fa86e5.png', category: 'Screenshots' },
  { name: 'Creative workspace', src: '/assets/aistudio/image_152c3e3d.png', category: 'Photos' },
  { name: 'Color study', src: '/assets/aistudio/image_1d74d143.png', category: 'Albums' },
  { name: 'Quiet moments', src: '/assets/aistudio/image_37792d6e.png', category: 'Photos' },
  { name: 'Bright ideas', src: '/assets/aistudio/image_3d525a15.png', category: 'Albums' },
];
const desktopItems = [
  { name: 'Recycle Bin', icon: Recycle, color: '#39a9e8' }, { name: 'Microsoft Edge', icon: Aperture, color: '#20b5d5' }, { name: 'Winaero Tweaker', icon: Settings, color: '#efac29' }, { name: 'Firefox.exe', icon: Aperture, color: '#ff772f' }, { name: 'windhawk.txt', icon: FileText, color: '#f5f8fa' },
];

export default function SparkOS() {
  const [startOpen, setStartOpen] = useState(true);
  const [query, setQuery] = useState('');
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const [galleryFilter, setGalleryFilter] = useState('All photos');
  const [galleryQuery, setGalleryQuery] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<(typeof galleryPhotos)[number] | null>(null);
  const [clock, setClock] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const WindowIcon = apps.find((app) => app.name === activeApp)?.icon ?? Folder;
  const filteredApps = useMemo(() => apps.filter((app) => app.name.toLowerCase().includes(query.toLowerCase())), [query]);
  const filteredPhotos = useMemo(() => galleryPhotos.filter((photo) => (galleryFilter === 'All photos' || photo.category === galleryFilter) && photo.name.toLowerCase().includes(galleryQuery.toLowerCase())), [galleryFilter, galleryQuery]);
  const launch = (name: string) => { setActiveApp(name); setStartOpen(false); };

  return <main className="sparkos-desktop" onPointerDown={(event) => { if (event.target === event.currentTarget) setStartOpen(false); }}>
    <div className="sparkos-shortcuts" aria-label="Desktop shortcuts">{desktopItems.map((item) => <button className="desktop-shortcut" key={item.name} onDoubleClick={() => launch(item.name)} onClick={() => setActiveApp(item.name)} aria-label={`Open ${item.name}`}><span className="shortcut-icon" style={{ color: item.color }}><item.icon /></span><span>{item.name}</span></button>)}</div>
    <button className="learn-picture" aria-label="Learn about this picture"><span>i</span><Image /></button>
    {activeApp && <section className={`app-window ${activeApp === 'Gallery' ? 'gallery-window' : ''}`} aria-label={`${activeApp} window`}><header><span>{activeApp === 'Gallery' ? <span className="gallery-title"><Image /> Gallery</span> : activeApp}</span><button onClick={() => { setActiveApp(null); setSelectedPhoto(null); }} aria-label="Close window">×</button></header>{activeApp === 'Gallery' ? <div className="gallery-app"><div className="gallery-toolbar"><div><h2>Gallery</h2><p>All your moments, in one place</p></div><label className="gallery-search"><Search /><input aria-label="Search photos" placeholder="Search photos" value={galleryQuery} onChange={(event) => setGalleryQuery(event.target.value)} /></label></div><nav className="gallery-tabs" aria-label="Photo collections">{['All photos', 'Photos', 'Screenshots', 'Albums'].map((filter) => <button key={filter} className={galleryFilter === filter ? 'active' : ''} onClick={() => setGalleryFilter(filter)}>{filter}</button>)}</nav><div className="gallery-count">{filteredPhotos.length} items <span>Recently added</span></div><div className="gallery-grid">{filteredPhotos.map((photo) => <button className="gallery-photo" key={photo.name} onClick={() => setSelectedPhoto(photo)} aria-label={`View ${photo.name}`}><img src={photo.src} alt={photo.name} /><span>{photo.name}</span></button>)}</div>{filteredPhotos.length === 0 && <p className="gallery-empty">No photos match your search.</p>}{selectedPhoto && <div className="photo-viewer" role="dialog" aria-modal="true" aria-label={selectedPhoto.name} onClick={() => setSelectedPhoto(null)}><button className="photo-close" aria-label="Close photo" onClick={() => setSelectedPhoto(null)}><X /></button><img src={selectedPhoto.src} alt={selectedPhoto.name} /><span>{selectedPhoto.name}</span></div>}</div> : <div className="window-body"><div className="window-app-icon"><WindowIcon /></div><h2>{activeApp}</h2><p>Welcome to SparkOS</p><button onClick={() => setActiveApp(null)}>Close</button></div>}</section>}
    {startOpen && <section className="start-panel" aria-label="Start menu"><label className="start-search"><Search /><input autoFocus placeholder="Search for apps, settings, and documents" value={query} onChange={(event) => setQuery(event.target.value)} /></label><div className="start-content"><div className="section-heading"><strong>{query ? 'Search results' : 'Pinned'}</strong><button onClick={() => setQuery('')}>{query ? 'Clear search' : <>Show less <ChevronDown /></>}</button></div><div className="pinned-grid">{filteredApps.map((app) => <button className="pinned-app" key={app.name} onClick={() => launch(app.name)}><span className="pinned-icon" style={{ color: app.color }}><app.icon /></span><span>{app.name}</span></button>)}</div>{!query && <><div className="section-heading recommended-heading"><strong>Recommended</strong><button>Show all <ChevronRight /></button></div><div className="recommended-grid">{[['master.m3u8','14h ago',Video],['Screenshot 2026-11-09 211300.png','Monday at 9:13 PM',Image],['windhawk.txt','Nov 9',FileText],['Copilot (for taskbar).ico','Nov 8',Sparkles]].map(([name, when, Icon]) => <button className="recent-file" key={String(name)} onClick={() => launch(String(name))}><span className="file-icon"><Icon /></span><span><b>{String(name)}</b><small>{String(when)}</small></span></button>)}</div></>}</div><footer className="start-footer"><button className="user-account"><span className="avatar">S</span><b>PC</b></button><button className="power-button" aria-label="Power options"><Power /></button></footer></section>}
    <footer className="sparkos-taskbar"><div className="weather-tile"><CloudSun /><span><b>Market updates</b><small>S&amp;P 500 retreated...</small></span></div><div className="taskbar-center"><button className={`taskbar-button start-button ${startOpen ? 'selected' : ''}`} onClick={() => setStartOpen(!startOpen)} aria-label="Start"><span className="windows-mark"><i /><i /><i /><i /></span></button><button className="taskbar-search" onClick={() => { setStartOpen(true); setQuery(''); }}><Search /><span>Search here</span><span className="search-avatar">S</span></button>{[Folder, Image, Video, Music2].map((Icon, index) => <button className="taskbar-button app-task" key={index} onClick={() => launch(['File Explorer','Photos','Media Player','Music'][index])}><Icon /></button>)}</div><div className="system-tray"><ChevronDown /><Wifi /><Volume2 /><div className="tray-time"><b>{clock.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</b><span>{clock.toLocaleDateString()}</span></div></div></footer>
  </main>;
}
