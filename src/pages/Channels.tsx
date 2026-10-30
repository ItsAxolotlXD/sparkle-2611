import React, { useState } from 'react';
import { Channel } from '../types';
import { ChannelCard } from '../components/ChannelCard';
import { CategoryIcon } from '../components/CategoryIcon';
import { DiscontinuedBanner } from '../components/DiscontinuedBanner';
import { Tag, Radio, Filter, Tv, CheckCircle2, Sparkles, Satellite, X } from 'lucide-react';
import { FluentSearchIcon } from '../components/FluentIcons';
import { SequentialSection } from '../components/SequentialSection';
import { useSettings } from '../hooks/useSettings';

interface ChannelsProps {
  channels: Channel[];
  onSelectChannel: (channel: Channel) => void;
  navigate: (route: string) => void;
  onOpenCustomStreamModal: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export const Channels: React.FC<ChannelsProps> = ({
  channels,
  onSelectChannel,
  navigate,
  onOpenCustomStreamModal,
  searchQuery: externalSearchQuery,
  onSearchChange: externalOnSearchChange
}) => {
  const { settings } = useSettings();
  const [selectedGroup, setSelectedGroup] = useState<string>('All');
  const [internalSearchQuery, setInternalSearchQuery] = useState<string>('');

  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const setSearchQuery = externalOnSearchChange || setInternalSearchQuery;

  const distinctCategories = Array.from(new Set(channels.map((c) => c.category)));
  const groups = ['All', ...distinctCategories];

  const filteredChannels = channels.filter((c) => {
    const matchesGroup = selectedGroup === 'All' || c.category === selectedGroup;
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesGroup && matchesSearch;
  });

  return (
    <div className="space-y-6 sm:space-y-8 pb-16">
      {/* Support Ceased Banner */}
      <DiscontinuedBanner navigate={navigate} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 text-xs text-[#E6005A] font-bold font-square uppercase tracking-wider mb-1">
            <CategoryIcon className="w-6 h-6 sm:w-6.5 sm:h-6.5 shrink-0" />
            <span>Broadcasting Infrastructure Directory</span>
          </div>
          <h1 className="text-3xl font-bold font-['Segoe_UI',_sans-serif] text-black dark:text-white tracking-tight">
            Television Channels Directory
          </h1>
          <p className="text-xs sm:text-sm text-black dark:text-[#9CA3AF] mt-1">
            National essential broadcast networks, entertainment, news, regional and international channels.
          </p>
        </div>

        <button
          onClick={onOpenCustomStreamModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#4cc2ff] hover:bg-[#6bd0ff] text-black text-xs font-bold shadow-md shrink-0 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>Import M3U8 Stream</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 sm:p-4 rounded-[8px] bg-white dark:bg-[#38383d] border border-black/10 dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 shadow-xs">
        {/* Groups */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 no-scrollbar">
          {groups.map((grp) => (
            <button
              key={grp}
              onClick={() => setSelectedGroup(grp)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedGroup === grp
                  ? 'bg-[#4cc2ff] text-black shadow-md'
                  : 'bg-black/5 dark:bg-white/5 text-[#4B5563] hover:text-[#111827] hover:bg-black/10 dark:text-[#A1A1AA] dark:hover:text-white border border-black/10 dark:border-white/10'
              }`}
            >
              {grp}
            </button>
          ))}
        </div>

        {/* Search matching TopBar search box */}
        <div
          id="channels-search-box"
          className="fluent-search-box group relative w-full md:w-80 h-9 bg-black/5 dark:bg-[#282c31] border-none flex items-center px-3.5 gap-2 transition-all rounded-[6px]"
        >
          <FluentSearchIcon className="w-[16px] h-[16px] text-[#71717a] dark:text-white shrink-0 pointer-events-none select-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in Channels"
            className="w-full bg-transparent text-xs sm:text-[13px] text-[#111827] dark:text-white placeholder-[#71717a] dark:placeholder-white outline-none border-none py-1 pr-6"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              title="Clear search"
              className="absolute right-1.5 text-[#71717a] dark:text-white hover:text-[#111827] dark:hover:text-white p-0.5 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Grid of channels */}
      {filteredChannels.length <= 16 || !settings.loadPagesSequentially ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredChannels.map((channel) => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              onSelect={(ch) => {
                onSelectChannel(ch);
                navigate(`/live-tv?channel=${ch.slug}`);
              }}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Initial Section 0 (First 16 channels) */}
          <SequentialSection order={0} enabled={settings.loadPagesSequentially}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredChannels.slice(0, 16).map((channel) => (
                <ChannelCard
                  key={channel.id}
                  channel={channel}
                  onSelect={(ch) => {
                    onSelectChannel(ch);
                    navigate(`/live-tv?channel=${ch.slug}`);
                  }}
                />
              ))}
            </div>
          </SequentialSection>

          {/* Section 1 (Next 16 channels) */}
          {filteredChannels.length > 16 && (
            <SequentialSection order={1} enabled={settings.loadPagesSequentially}>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredChannels.slice(16, 32).map((channel) => (
                  <ChannelCard
                    key={channel.id}
                    channel={channel}
                    onSelect={(ch) => {
                      onSelectChannel(ch);
                      navigate(`/live-tv?channel=${ch.slug}`);
                    }}
                  />
                ))}
              </div>
            </SequentialSection>
          )}

          {/* Section 2 (Remaining channels) */}
          {filteredChannels.length > 32 && (
            <SequentialSection order={2} enabled={settings.loadPagesSequentially}>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredChannels.slice(32).map((channel) => (
                  <ChannelCard
                    key={channel.id}
                    channel={channel}
                    onSelect={(ch) => {
                      onSelectChannel(ch);
                      navigate(`/live-tv?channel=${ch.slug}`);
                    }}
                  />
                ))}
              </div>
            </SequentialSection>
          )}
        </div>
      )}
    </div>
  );
};
