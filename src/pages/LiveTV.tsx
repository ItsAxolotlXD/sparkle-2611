import React, { useState, useMemo } from 'react';
import { VideoPlayer } from '../components/VideoPlayer';
import { CategoryIcon } from '../components/CategoryIcon';
import { Channel } from '../types';
import { Tv, Calendar, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SequentialSection } from '../components/SequentialSection';
import { useSettings } from '../hooks/useSettings';
import { EpgScheduleWidget } from '../components/EpgScheduleWidget';
import { showAppToast } from '../utils/toast';

interface LiveTVProps {
  currentChannel: Channel;
  onSelectChannel: (channel: Channel) => void;
  channels: Channel[];
  onOpenCustomStreamModal: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  navigate?: (route: string) => void;
}

export const LiveTV: React.FC<LiveTVProps> = ({
  currentChannel,
  onSelectChannel,
  channels,
  onOpenCustomStreamModal,
  searchQuery,
  onSearchChange,
  navigate = () => {}
}) => {
  const { settings } = useSettings();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [isEpgSidebarOpen, setIsEpgSidebarOpen] = useState(false);

  // Distinct category list maintaining natural broadcast order
  const distinctCategories = useMemo(() => {
    return Array.from(new Set(channels.map((c) => c.category)));
  }, [channels]);

  const categoryTabs = useMemo(() => {
    return ['All', ...distinctCategories];
  }, [distinctCategories]);

  // Filter channels by tab & search query with memoization
  const query = (searchQuery || '').trim().toLowerCase();
  const filteredChannels = useMemo(() => {
    return channels.filter((c) => {
      const matchesCat = selectedCategory === 'All' || c.category === selectedCategory;
      const matchesSearch = !query ||
        c.name.toLowerCase().includes(query) ||
        c.category.toLowerCase().includes(query) ||
        (c.channelNumber && String(c.channelNumber).includes(query)) ||
        (c.tags && c.tags.some((t) => t.toLowerCase().includes(query)));
      return matchesCat && matchesSearch;
    });
  }, [channels, selectedCategory, query]);

  // Group channels by category when viewing "Tất cả" (or show single category if filtered)
  const groupedCategories = useMemo(() => {
    return distinctCategories
      .map((category) => ({
        category,
        channels: filteredChannels.filter((c) => c.category === category)
      }))
      .filter((group) => group.channels.length > 0);
  }, [distinctCategories, filteredChannels]);

  const handleSelectChannel = (channel: Channel) => {
    showAppToast(`Switched to ${channel.name}`);
    onSelectChannel(channel);
  };

  // Navigation helpers for channel controls
  const handleNextChannel = () => {
    const currentIndex = channels.findIndex((c) => c.id === currentChannel.id);
    if (currentIndex !== -1) {
      const nextIndex = (currentIndex + 1) % channels.length;
      handleSelectChannel(channels[nextIndex]);
    }
  };

  const handlePrevChannel = () => {
    const currentIndex = channels.findIndex((c) => c.id === currentChannel.id);
    if (currentIndex !== -1) {
      const prevIndex = (currentIndex - 1 + channels.length) % channels.length;
      handleSelectChannel(channels[prevIndex]);
    }
  };

  const handleRandomChannel = () => {
    const pool = channels.filter((c) => c.id !== currentChannel.id);
    if (pool.length > 0) {
      const rand = pool[Math.floor(Math.random() * pool.length)];
      handleSelectChannel(rand);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-8 pb-16">
      {/* Video Player Section */}
      <div className="w-full">
        <VideoPlayer
          channel={currentChannel}
          onOpenCustomStreamModal={onOpenCustomStreamModal}
          isTheaterMode={isTheaterMode}
          onToggleTheaterMode={() => setIsTheaterMode(!isTheaterMode)}
          onNextChannel={handleNextChannel}
          onPrevChannel={handlePrevChannel}
          onRandomChannel={handleRandomChannel}
          onOpenEpg={() => setIsEpgSidebarOpen((prev) => !prev)}
        />
      </div>


      {/* Channel List Section */}
      <div className="space-y-6 pt-2">
        {/* Category Underline Tabs Filter (matching Fluent underline tab style with #4cc2ff accent) */}
        <div className="flex flex-col gap-2">
          <div
            id="livetv-category-tabs"
            className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-0.5 no-scrollbar border-0"
          >
            {/* All tab */}
            <button
              id="livetv-cat-btn-all"
              type="button"
              onClick={() => setSelectedCategory('All')}
              className={`relative px-3.5 sm:px-4.5 py-2 sm:py-2.5 text-xs sm:text-sm whitespace-nowrap cursor-pointer select-none transition-colors flex flex-col items-center justify-center !bg-transparent !border-0 !shadow-none hover:!bg-transparent active:!bg-transparent focus:!bg-transparent ${
                selectedCategory === 'All'
                  ? 'text-black dark:text-white font-bold'
                  : 'text-[#6B7280] hover:text-black dark:text-[#9CA3AF] dark:hover:text-white font-medium'
              }`}
            >
              <span className="relative z-10 !bg-transparent">All</span>
              {selectedCategory === 'All' && (
                <motion.div
                  layoutId="watch-category-active-underline"
                  className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-6 h-[3px] rounded-full bg-[#4cc2ff]"
                  initial={{ scaleX: 1 }}
                  animate={{
                    scaleX: [1, 2.2, 1],
                  }}
                  transition={{
                    layout: {
                      duration: 0.4,
                      ease: [0.4, 0.0, 0.2, 1],
                    },
                    scaleX: {
                      duration: 0.4,
                      times: [0, 0.5, 1],
                      ease: [0.4, 0.0, 0.2, 1],
                    },
                  }}
                />
              )}
            </button>

            {/* Remaining Category Tabs */}
            {categoryTabs.filter((cat) => cat !== 'All').map((cat, idx) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  id={`livetv-cat-btn-${idx + 1}`}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`relative px-3.5 sm:px-4.5 py-2 sm:py-2.5 text-xs sm:text-sm whitespace-nowrap cursor-pointer select-none transition-colors flex flex-col items-center justify-center !bg-transparent !border-0 !shadow-none hover:!bg-transparent active:!bg-transparent focus:!bg-transparent ${
                    isActive
                      ? 'text-black dark:text-white font-bold'
                      : 'text-[#6B7280] hover:text-black dark:text-[#9CA3AF] dark:hover:text-white font-medium'
                  }`}
                >
                  <span className="relative z-10 !bg-transparent">{cat}</span>
                  {isActive && (
                    <motion.div
                      layoutId="watch-category-active-underline"
                      className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-6 h-[3px] rounded-full bg-[#4cc2ff]"
                      initial={{ scaleX: 1 }}
                      animate={{
                        scaleX: [1, 2.2, 1],
                      }}
                      transition={{
                        layout: {
                          duration: 0.4,
                          ease: [0.4, 0.0, 0.2, 1],
                        },
                        scaleX: {
                          duration: 0.4,
                          times: [0, 0.5, 1],
                          ease: [0.4, 0.0, 0.2, 1],
                        },
                      }}
                    />
                  )}
                </button>
              );
            })}

            {/* Right side: Button to open EPG schedule sidebar */}
            <div className="ml-auto pl-2 shrink-0 flex items-center">
              <button
                id="btn-livetv-open-epg-sidebar"
                type="button"
                onClick={() => setIsEpgSidebarOpen(true)}
                className="mb-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer select-none flex items-center gap-1.5 bg-gradient-to-r from-[#0078d4] via-[#0284c7] to-[#4cc2ff] hover:from-[#006cbd] hover:to-[#38bdf8] active:scale-95 text-white shadow-xs hover:shadow border border-white/20"
                title="Xem lịch phát sóng các kênh (EPG)"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Lịch phát sóng</span>
              </button>
            </div>
          </div>
        </div>


        {/* Channel Categories & Grids */}
        {filteredChannels.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#38383d] border border-[#E5E7EB] dark:border-[#2D2D35]">
            <Tv className="w-10 h-10 mx-auto text-[#9CA3AF] mb-2" />
            <p className="text-sm font-semibold text-[#111827] dark:text-white">No channels found</p>
            <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-1">Please try searching with a different keyword or channel number</p>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedCategories.map((group, groupIdx) => (
              <SequentialSection
                key={group.category}
                order={groupIdx}
                enabled={settings.loadPagesSequentially}
              >
                <section className="space-y-3">
                  {/* Category Section Header & Divider */}
                  <div className="livetv-category-divider flex items-center justify-between border-b border-[#E5E7EB] dark:border-[#2D2D35] pb-2">
                    <div className="flex items-center gap-2.5">
                      <CategoryIcon className="w-6 h-6 sm:w-6.5 sm:h-6.5 shrink-0" />
                      <h3 className="text-sm sm:text-base font-bold font-square text-[#111827] dark:text-white">
                        {group.category}
                      </h3>
                      <span className="text-[11px] font-semibold text-[#6B7280] dark:text-[#9CA3AF]">
                        ({group.channels.length})
                      </span>
                    </div>
                  </div>

                  {/* Channel Grid: Unified fixed width & height cards, 6 cols on desktop, 3 cols on mobile */}
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2.5 sm:gap-3.5">
                    {group.channels.map((ch) => {
                      const isSelected = ch.id === currentChannel.id;

                      return (
                        <div
                          key={ch.id}
                          id={`livetv-channel-card-${ch.id}`}
                          onClick={() => handleSelectChannel(ch)}
                          className={`fluent-reveal-item onair-card channel-card group relative w-full aspect-[136/78] rounded-[6px] sm:rounded-[8px] transition-colors cursor-pointer overflow-hidden flex items-center justify-center p-1.5 sm:p-2.5 select-none bg-white dark:bg-[#38383d] border shadow-xs ${
                            isSelected
                              ? 'border-[#4cc2ff] ring-1 ring-[#4cc2ff]'
                              : 'border-[#e5e5e5] dark:border-[#48484e] hover:border-[#cccccc] dark:hover:border-[#606066] hover:bg-[#fafafa] dark:hover:bg-[#424248]'
                          }`}
                          title={ch.name}
                        >
                          {/* Channel Logo Box without background (strictly only logo) */}
                          <div className="w-full h-full flex items-center justify-center p-1 relative">
                            <img
                              src={ch.logo}
                              alt={ch.name}
                              loading="lazy"
                              decoding="async"
                              referrerPolicy="no-referrer"
                              className={`${
                                ch.category === 'Kênh địa phương' || ch.category === 'Kênh phát thanh' || ch.category === 'Kênh HTV'
                                  ? 'max-h-[78%] max-w-[92%] scale-110'
                                  : ch.category === 'Kênh VTV'
                                    ? 'max-h-[56%] max-w-[80%]'
                                    : 'max-h-[58%] max-w-[82%]'
                              } w-auto h-auto object-contain filter drop-shadow-sm select-none pointer-events-none transition-transform`}
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </SequentialSection>
            ))}
          </div>
        )}

        {filteredChannels.length === 0 && (
          <div className="py-16 text-center space-y-3 rounded-2xl bg-[#38383d]/60 border border-white/10 p-6">
            <p className="text-sm font-medium text-[#9CA3AF]">
              No television channels found matching "{query}"
            </p>
            {onSearchChange && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="px-4 py-1.5 rounded-full text-xs font-semibold bg-[#4cc2ff] text-white dark:text-black hover:bg-[#6bd0ff] transition-colors cursor-pointer"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right Sidebar Drawer for EPG Broadcast Schedule */}
      <AnimatePresence>

        {isEpgSidebarOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setIsEpgSidebarOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            />

            {/* Right Sidebar Drawer Panel with slide animation */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 260 }}
              className="absolute top-0 right-0 h-full w-full sm:w-[460px] md:w-[480px] max-w-[95vw] bg-[#1a1d22] text-white shadow-2xl border-l border-white/10 flex flex-col z-10 overflow-hidden"
            >
              <EpgScheduleWidget
                currentChannel={currentChannel}
                isSidebarMode={true}
                onClose={() => setIsEpgSidebarOpen(false)}
                className="h-full"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

