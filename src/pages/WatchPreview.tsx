import React from 'react';
import { motion } from 'motion/react';
import { Play, Radio, Sparkles, Clock3 } from 'lucide-react';

interface WatchPreviewProps {
  enabled?: boolean;
}

const channels = [
  { title: 'Live channels', subtitle: 'Watch what is happening now', color: '#4cc2ff' },
  { title: 'Continue watching', subtitle: 'Pick up where you left off', color: '#f59e0b' },
  { title: 'Featured for you', subtitle: 'Curated from your favorites', color: '#ec4899' },
];

export const WatchPreview: React.FC<WatchPreviewProps> = ({ enabled = false }) => {
  if (!enabled) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-16 select-none">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] dark:text-white tracking-tight">Coming soon</h1>
        <p className="max-w-xl mt-3 text-sm sm:text-base text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed">This tab is currently undergoing major construction as the third milestone of Project Orbit, aimed at phasing out the outdated Vplay UI. Stay tuned for updates</p>
      </div>
    );
  }

  return (
    <main className="min-h-full bg-[#f3f4f6] dark:bg-[#202328] text-[#111827] dark:text-white px-5 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] font-semibold text-[#0078d4] dark:text-[#4cc2ff]">Watch</p>
            <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">Your viewing space</h1>
            <p className="mt-2 text-sm text-black/55 dark:text-white/55">A calm place for live channels, saved shows, and recommendations.</p>
          </div>
          <button type="button" className="inline-flex h-10 items-center gap-2 self-start rounded-lg bg-[#005fb8] px-4 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 sm:self-auto"><Play className="size-4" fill="currentColor" />Start watching</button>
        </motion.header>
        <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {channels.map((channel, index) => (
            <motion.article key={channel.title} data-channel-card="true" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }} className="channel-card group cursor-pointer overflow-hidden rounded-2xl border border-black/8 bg-white shadow-sm dark:border-white/10 dark:bg-[#2c3037]">
              <div className="relative h-44 overflow-hidden bg-gradient-to-br from-[#dbeafe] via-white to-[#f3f4f6] dark:from-[#263b4a] dark:via-[#2c3037] dark:to-[#202328]">
                <div className="absolute inset-5 rounded-xl border border-black/5 dark:border-white/10" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.045) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
                <div className="absolute left-9 top-10 flex size-12 items-center justify-center rounded-2xl text-white shadow-lg" style={{ backgroundColor: channel.color }}><Radio className="size-6" /></div>
                <div className="absolute bottom-7 right-8 h-2 w-28 rotate-[-8deg] rounded-full opacity-60" style={{ backgroundColor: channel.color }} />
              </div>
              <div className="flex items-start gap-3 p-4"><div className="min-w-0 flex-1"><h2 className="font-semibold truncate">{channel.title}</h2><p className="mt-1 text-xs text-black/45 dark:text-white/45">{channel.subtitle}</p></div><Clock3 className="size-4 shrink-0 text-black/35 dark:text-white/35" /></div>
            </motion.article>
          ))}
        </section>
        <div className="mt-8 flex items-center gap-2 text-sm text-black/50 dark:text-white/50"><Sparkles className="size-4 text-[#0078d4] dark:text-[#4cc2ff]" /> More watch experiences are being prepared.</div>
      </div>
    </main>
  );
};
