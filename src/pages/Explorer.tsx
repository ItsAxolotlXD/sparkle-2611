import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, ChevronDown, ChevronRight, Clock3, Copy, File, FileImage, FileText, Film, Folder, FolderOpen, Grid2X2, HardDrive, Home, Image, LayoutList, MoreHorizontal, Music2, Pin, Search, Share2, SlidersHorizontal, Star, Trash2, Video, Wifi } from 'lucide-react';

type ExplorerFolder = 'Desktop' | 'Downloads' | 'Documents' | 'Pictures' | 'Music' | 'Videos';
type ExplorerFile = { name: string; folder: ExplorerFolder; modified: string; kind: string; icon: 'text' | 'image' | 'video' | 'music' };

const folders: { name: ExplorerFolder; icon: React.ElementType; color: string }[] = [
  { name: 'Desktop', icon: MonitorIcon, color: '#10a8e8' },
  { name: 'Downloads', icon: ArrowDownIcon, color: '#10b99a' },
  { name: 'Documents', icon: FileText, color: '#94a3b8' },
  { name: 'Pictures', icon: Image, color: '#1488e8' },
  { name: 'Music', icon: Music2, color: '#e87045' },
  { name: 'Videos', icon: Video, color: '#a855e8' },
];

const files: ExplorerFile[] = [
  { name: 'list of commands.txt', folder: 'Downloads', modified: 'Today, 3:34 PM', kind: 'Text document', icon: 'text' },
  { name: 'branding.pptx', folder: 'Documents', modified: 'Today, 2:17 PM', kind: 'PowerPoint presentation', icon: 'text' },
  { name: '9+.pptx', folder: 'Documents', modified: 'Yesterday, 4:48 PM', kind: 'PowerPoint presentation', icon: 'text' },
  { name: 'master.m3u8', folder: 'Downloads', modified: 'Nov 15, 11:34 PM', kind: 'Playlist', icon: 'music' },
  { name: 'Screenshot 2026-11-09 211300.png', folder: 'Pictures', modified: 'Nov 9, 9:13 PM', kind: 'PNG image', icon: 'image' },
  { name: 'windhawk.txt', folder: 'Desktop', modified: 'Nov 9, 12:34 PM', kind: 'Text document', icon: 'text' },
  { name: 'Copilot (for taskbar).ico', folder: 'Downloads', modified: 'Nov 9, 12:39 AM', kind: 'Icon file', icon: 'image' },
  { name: 'Vacation video.mp4', folder: 'Videos', modified: 'Nov 7, 6:20 PM', kind: 'MP4 video', icon: 'video' },
];

function MonitorIcon({ className }: { className?: string }) { return <HardDrive className={className} />; }
function ArrowDownIcon({ className }: { className?: string }) { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v12m-5-5 5 5 5-5M5 20h14" /></svg>; }

const fileIcon = (kind: ExplorerFile['icon']) => {
  const Icon = kind === 'image' ? FileImage : kind === 'video' ? Film : kind === 'music' ? Music2 : FileText;
  const color = kind === 'image' ? 'text-sky-400' : kind === 'video' ? 'text-violet-400' : kind === 'music' ? 'text-emerald-400' : 'text-slate-300';
  return <Icon className={`h-7 w-7 ${color}`} strokeWidth={1.7} />;
};

export function Explorer() {
  const [location, setLocation] = useState<ExplorerFolder | 'Home' | 'Gallery' | 'This PC'>('Home');
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'Recent' | 'Favorites' | 'Shared'>('Recent');
  const [selected, setSelected] = useState<string | null>(null);
  const visibleFiles = useMemo(() => files.filter((file) => {
    const inLocation = location === 'Home' || location === 'This PC' || location === 'Gallery' || file.folder === location;
    return inLocation && file.name.toLowerCase().includes(query.toLowerCase());
  }), [location, query]);
  const selectLocation = (value: typeof location) => { setLocation(value); setSelected(null); };

  return (
    <section aria-label="File Explorer" className="flex h-full min-h-0 flex-col overflow-hidden bg-[#191919] text-[#f4f4f4]" style={{ fontFamily: "'Segoe UI Variable Text', 'Segoe UI', sans-serif" }}>
      <div className="flex h-10 shrink-0 items-end gap-1 border-b border-white/[0.08] bg-[#101820] px-2 pt-1">
        <div className="flex h-9 min-w-36 max-w-56 items-center gap-2 rounded-t-lg border border-white/[0.08] border-b-[#191919] bg-[#191919] px-3 text-xs font-medium"><span className="text-sky-400"><FolderOpen className="h-4 w-4" /></span><span className="flex-1">{location}</span><button aria-label="Close tab" className="rounded p-0.5 hover:bg-white/10">×</button></div>
        <button aria-label="New tab" className="mb-1 rounded p-1.5 hover:bg-white/10"><span className="text-base">＋</span></button>
        <div className="ml-auto hidden items-center gap-5 px-3 text-[11px] text-white/70 sm:flex"><span>—</span><span>□</span><span>×</span></div>
      </div>
      <div className="flex shrink-0 items-center gap-2 border-b border-white/[0.08] px-3 py-2">
        <button aria-label="Back" onClick={() => selectLocation('Home')} className="rounded p-1.5 text-white/55 hover:bg-white/10"><ArrowLeft className="h-4 w-4" /></button><button aria-label="Forward" className="rounded p-1.5 text-white/35 hover:bg-white/10"><ArrowRight className="h-4 w-4" /></button><button aria-label="Up" onClick={() => selectLocation('This PC')} className="rounded p-1.5 hover:bg-white/10"><ArrowUp className="h-4 w-4" /></button>
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md bg-[#292d30] px-3 py-2 text-xs"><Home className="h-4 w-4 shrink-0 text-white/60" /><ChevronRight className="h-3.5 w-3.5 text-white/40" /><button onClick={() => selectLocation('Home')} className="shrink-0 hover:underline">Home</button>{location !== 'Home' && <><ChevronRight className="h-3.5 w-3.5 text-white/40" /><span className="truncate">{location}</span></>}</div>
        <label className="flex w-[34%] min-w-[120px] items-center gap-2 rounded-md bg-[#292d30] px-3 py-2 text-xs"><input aria-label={`Search ${location}`} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${location}`} className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-white/55" /><Search className="h-4 w-4 shrink-0 text-white/70" /></label>
      </div>
      <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-white/[0.08] px-3 py-2 text-xs text-white/80">
        <button className="flex items-center gap-2 rounded-md px-3 py-1.5 hover:bg-white/10"><span className="text-base">＋</span>New<ChevronDown className="h-3 w-3" /></button><span className="mx-1 h-6 border-l border-white/10" />
        {[Copy, Copy, Share2, Trash2].map((Icon, index) => <button key={index} aria-label={['Copy', 'Paste', 'Share', 'Delete'][index]} className="rounded-md p-2 text-white/45 hover:bg-white/10 hover:text-white"><Icon className="h-4 w-4" /></button>)}
        <span className="mx-1 h-6 border-l border-white/10" /><button className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-white/10"><SlidersHorizontal className="h-4 w-4" />Sort<ChevronDown className="h-3 w-3" /></button><button className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-white/10"><LayoutList className="h-4 w-4" />View<ChevronDown className="h-3 w-3" /></button><button className="ml-auto flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-white/10"><MoreHorizontal className="h-4 w-4" /><span className="hidden sm:inline">Details</span></button>
      </div>
      <div className="flex min-h-0 flex-1">
        <nav aria-label="Explorer navigation" className="hidden w-[176px] shrink-0 flex-col gap-1 overflow-y-auto border-r border-white/[0.08] p-2 text-xs sm:flex">
          <button onClick={() => selectLocation('Home')} className={`flex items-center gap-2 rounded px-2 py-2 text-left ${location === 'Home' ? 'bg-white/[0.12]' : 'hover:bg-white/[0.08]'}`}><Home className="h-4 w-4 text-sky-400" />Home</button>
          <button onClick={() => selectLocation('Gallery')} className={`flex items-center gap-2 rounded px-2 py-2 text-left ${location === 'Gallery' ? 'bg-white/[0.12]' : 'hover:bg-white/[0.08]'}`}><Image className="h-4 w-4 text-sky-400" />Gallery</button>
          <button className="flex items-center gap-2 rounded px-2 py-2 text-left hover:bg-white/[0.08]"><ChevronRight className="h-3 w-3" /><Wifi className="h-4 w-4 text-sky-400" />OneDrive</button>
          <div className="my-2 border-t border-white/[0.12]" />
          {folders.map(({ name, icon: Icon, color }) => <button key={name} onClick={() => selectLocation(name)} className={`flex items-center gap-2 rounded px-2 py-2 text-left ${location === name ? 'bg-white/[0.12]' : 'hover:bg-white/[0.08]'}`}><Icon className="h-4 w-4" style={{ color }} />{name}<Pin className="ml-auto h-3 w-3 fill-white/35 text-white/35" /></button>)}
          <div className="my-2 border-t border-white/[0.12]" /><button onClick={() => selectLocation('This PC')} className={`flex items-center gap-2 rounded px-2 py-2 text-left ${location === 'This PC' ? 'bg-white/[0.12]' : 'hover:bg-white/[0.08]'}`}><ChevronDown className="h-3 w-3" /><HardDrive className="h-4 w-4 text-sky-400" />This PC</button><button className="flex items-center gap-2 rounded px-5 py-2 text-left hover:bg-white/[0.08]"><HardDrive className="h-4 w-4 text-slate-300" />Windows (C:)</button><button className="flex items-center gap-2 rounded px-5 py-2 text-left hover:bg-white/[0.08]"><HardDrive className="h-4 w-4 text-slate-300" />Data (D:)</button><button className="flex items-center gap-2 rounded px-2 py-2 text-left hover:bg-white/[0.08]"><ChevronRight className="h-3 w-3" /><Wifi className="h-4 w-4 text-sky-400" />Network</button>
        </nav>
        <div className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {(location === 'Home' || location === 'This PC') && <>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><ChevronDown className="h-4 w-4" />Quick access</h2>
            <div className="mb-5 grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-4">{folders.map(({ name, icon: Icon, color }) => <button key={name} onClick={() => selectLocation(name)} className="flex min-w-0 items-center gap-3 rounded-md p-2.5 text-left hover:bg-white/[0.08]"><span className="flex h-9 w-10 shrink-0 items-center justify-center rounded-md" style={{ background: `${color}28`, color }}><Icon className="h-6 w-6" /></span><span className="min-w-0"><span className="block truncate text-xs font-medium">{name}</span><span className="block text-[11px] text-white/50">Stored locally</span><Pin className="mt-0.5 h-3 w-3 fill-white/50 text-white/50" /></span></button>)}</div>
          </>}
          <div className="mb-3 flex flex-wrap items-center gap-2">{(['Recent', 'Favorites', 'Shared'] as const).map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs ${activeTab === tab ? 'bg-[#35b9f5] text-[#082332]' : 'bg-white/[0.07] text-white/90 hover:bg-white/[0.12]'}`}>{tab === 'Recent' ? <Clock3 className="h-4 w-4" /> : tab === 'Favorites' ? <Star className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}{tab}</button>)}</div>
          <div className="grid grid-cols-[minmax(150px,1.4fr)_minmax(120px,1fr)_minmax(100px,0.8fr)] gap-3 border-b border-white/[0.12] px-3 py-2 text-xs text-white/75"><span>Name</span><span className="hidden sm:block">Date accessed</span><span className="hidden md:block">Activity</span></div>
          <div role="list" aria-label={`${activeTab} files`}>{visibleFiles.map((file) => <button key={file.name} role="listitem" onClick={() => setSelected(file.name)} onDoubleClick={() => selectLocation(file.folder)} className={`grid w-full grid-cols-[minmax(150px,1.4fr)_minmax(120px,1fr)_minmax(100px,0.8fr)] items-center gap-3 rounded px-3 py-2 text-left ${selected === file.name ? 'bg-sky-500/20 outline outline-1 outline-sky-400' : 'hover:bg-white/[0.07]'}`}><span className="flex min-w-0 items-center gap-3">{fileIcon(file.icon)}<span className="min-w-0"><span className="block truncate text-xs">{file.name}</span><span className="block truncate text-[11px] text-white/50">{file.folder}</span></span></span><span className="hidden text-[11px] text-white/75 sm:block">{file.modified}</span><span className="hidden truncate text-[11px] text-white/60 md:block">{file.kind}</span></button>)}{visibleFiles.length === 0 && <p className="p-5 text-sm text-white/55">No items match your search.</p>}</div>
          <div className="mt-4 flex items-center gap-2 border-t border-white/[0.08] pt-3 text-[11px] text-white/45"><Folder className="h-3.5 w-3.5" />{visibleFiles.length} items<span className="ml-auto flex items-center gap-2"><Grid2X2 className="h-4 w-4" /><LayoutList className="h-4 w-4" /></span></div>
        </div>
      </div>
    </section>
  );
}
