import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  X, 
  Play, 
  Tv, 
  Newspaper, 
  SlidersHorizontal,
  ChevronRight,
  Clock,
  Calendar,
  Sparkles
} from 'lucide-react';
import { FluentSearchIcon } from '../components/FluentIcons';
import { motion, AnimatePresence } from 'motion/react';
import { CHANNELS_DATA } from '../data/channels';
import { NEWS_DATA } from '../data/news';
import { Channel, NewsArticle } from '../types';
import { searchEpgSchedule, EpgSearchResultItem } from '../services/epgService';
import { SpinningRing } from '../components/SpinningRing';
import { useIsMobile } from '../hooks/useIsMobile';

interface ImmersiveSearchProps {
  navigate: (path: string, state?: any) => void;
  onSelectChannel: (channel: Channel) => void;
  onClose?: () => void;
}

export const ImmersiveSearch: React.FC<ImmersiveSearchProps> = ({
  navigate,
  onSelectChannel,
  onClose,
}) => {
  const isMobile = useIsMobile();
  const [query, setQuery] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('q') || '';
    } catch {
      return '';
    }
  });
  const [activeTab, setActiveTab] = useState<'all' | 'channels' | 'epg' | 'news'>('all');
  const [epgResults, setEpgResults] = useState<EpgSearchResultItem[]>([]);
  const [isSearchingEpg, setIsSearchingEpg] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync if location search changes
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlQ = params.get('q');
      if (urlQ && urlQ !== query) {
        setQuery(urlQ);
      }
    } catch {}
  }, []);

  // Automatically focus the search input upon mounting
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle closing / exiting search
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/');
    }
  };

  // Keyboard shortcut listener (Escape to exit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (query) {
          setQuery('');
        } else {
          handleClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [query]);

  // Normalized search query
  const trimmed = query.trim().toLowerCase();

  // Search Results
  const matchedChannels = useMemo(() => {
    if (!trimmed) return [];
    return CHANNELS_DATA.filter((ch) => {
      const matchName = ch.name.toLowerCase().includes(trimmed);
      const matchShort = ch.shortName?.toLowerCase().includes(trimmed);
      const matchCategory = ch.category.toLowerCase().includes(trimmed);
      const matchSlug = ch.slug.toLowerCase().includes(trimmed);
      const matchNumber = String(ch.channelNumber || '').includes(trimmed);
      return matchName || matchShort || matchCategory || matchSlug || matchNumber;
    });
  }, [trimmed]);

  const matchedNews = useMemo(() => {
    if (!trimmed) return [];
    return NEWS_DATA.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(trimmed);
      const matchCategory = item.category.toLowerCase().includes(trimmed);
      const matchExcerpt = item.excerpt?.toLowerCase().includes(trimmed);
      return matchTitle || matchCategory || matchExcerpt;
    });
  }, [trimmed]);

  // Real-time EPG Search across channels from epg.io.vn
  useEffect(() => {
    if (!trimmed || trimmed.length < 2) {
      setEpgResults([]);
      setIsSearchingEpg(false);
      return;
    }

    let isMounted = true;
    setIsSearchingEpg(true);

    const timer = setTimeout(async () => {
      try {
        const results = await searchEpgSchedule(trimmed, CHANNELS_DATA);
        if (isMounted) {
          setEpgResults(results);
        }
      } catch {
        if (isMounted) setEpgResults([]);
      } finally {
        if (isMounted) setIsSearchingEpg(false);
      }
    }, 220);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [trimmed]);

  const totalMatches = matchedChannels.length + matchedNews.length + epgResults.length;

  return (
    <div 
      id="immersive-search-page"
      className="w-full min-h-[calc(100vh-80px)] text-[#111827] dark:text-white px-3 sm:px-6 md:px-10 py-4 sm:py-6 select-none"
    >
      <div className="max-w-6xl mx-auto space-y-7 sm:space-y-9">
        {/* Top Search Bar Row */}
        <div className="flex items-center justify-center gap-3 w-full">
          {/* Search Box matching Find and search Sparkle */}
          <div 
            id="immersive-search-capsule"
            onClick={() => {
              inputRef.current?.focus();
            }}
            className="group relative w-full max-w-md sm:max-w-lg h-[35px] sm:h-[37px] bg-black/5 dark:bg-[#282c31] border border-black/10 dark:border-white/10 focus-within:border-[#005fb8] dark:focus-within:border-[#4cc2ff] flex items-center px-3.5 gap-2.5 rounded-[6px] transition-all cursor-text select-none"
          >
            <FluentSearchIcon className="w-[18px] h-[18px] text-[#71717a] dark:text-white shrink-0 pointer-events-none select-none" />
            <input
              ref={inputRef}
              id="immersive-search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isMobile ? "Search" : "Find and search"}
              className="w-full bg-transparent text-xs sm:text-[13.5px] text-[#111827] dark:text-white placeholder-[#71717a] dark:placeholder-white outline-none border-none py-1 pr-7 no-fluent-line"
            />
            {query && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="absolute right-2.5 text-[#71717a] dark:text-white hover:text-[#111827] dark:hover:text-white p-0.5 transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Deprecation Notice: exactly below find and search */}
        <div className="flex flex-col items-center text-center space-y-3 py-4 sm:py-6 px-4 max-w-xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-semibold text-[#111827] dark:text-white tracking-tight">
            Spotlight Search is deprecated
          </h2>
          <p className="text-xs sm:text-[13.5px] text-[#6b7280] dark:text-[#a1a1aa] leading-relaxed max-w-lg">
            The dedicated search page is no longer available. Instead, please try out the brand-new, better, smarter and more optimized search experience by clicking the search box located on the top bar.
          </p>
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('vplay:focus-topbar-search'));
            }}
            className="mt-2 h-8 sm:h-9 px-4 rounded-[6px] text-xs sm:text-sm font-semibold text-white dark:text-black bg-[#d946ef] hover:bg-[#c026d3] active:bg-[#a21caf] shadow-xs border-none transition-colors cursor-pointer flex items-center gap-2"
          >
            <span>Go to new search</span>
          </button>
        </div>

        {/* Dynamic Display: Search Results */}
        {trimmed && (
          /* Search Results View */
          <div className="space-y-6">
            {/* Filter Tabs & Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 dark:border-[#3b1540] pb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#6b7280] dark:text-[#D4CAD6]">
                  Results for &ldquo;<span className="text-[#111827] dark:text-white font-bold">{query}</span>&rdquo;
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#E6005A]/20 text-[#FF4D8B] border border-[#E6005A]/30">
                  {totalMatches} results
                </span>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1.5 bg-[#200d23] p-1 rounded-full border border-[#3b1540] overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === 'all'
                      ? 'bg-[#4cc2ff] text-white dark:text-black shadow-md'
                      : 'text-[#8A798C] hover:text-white dark:hover:text-white'
                  }`}
                >
                  All ({totalMatches})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('channels')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === 'channels'
                      ? 'bg-[#4cc2ff] text-white dark:text-black shadow-md'
                      : 'text-[#8A798C] hover:text-white dark:hover:text-white'
                  }`}
                >
                  Channels ({matchedChannels.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('epg')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'epg'
                      ? 'bg-[#4cc2ff] text-white dark:text-black shadow-md'
                      : 'text-[#8A798C] hover:text-white dark:hover:text-white'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Lịch phát sóng ({epgResults.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('news')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === 'news'
                      ? 'bg-[#4cc2ff] text-white dark:text-black shadow-md'
                      : 'text-[#8A798C] hover:text-white dark:hover:text-white'
                  }`}
                >
                  News ({matchedNews.length})
                </button>
              </div>
            </div>

            {totalMatches === 0 ? (
              /* Empty state */
              <div className="py-16 text-center space-y-3 bg-white dark:bg-[#200d23]/40 rounded-3xl border border-black/10 dark:border-[#3b1540]/60 p-8">
                <div className="w-14 h-14 rounded-full bg-[#E6005A]/10 text-[#E6005A] flex items-center justify-center mx-auto border border-[#E6005A]/20">
                  <FluentSearchIcon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[#111827] dark:text-white">No matching results found</h3>
                <p className="text-xs sm:text-sm text-[#8A798C] max-w-md mx-auto">
                  Try checking for spelling errors or searching with broader keywords like &ldquo;VTV&rdquo;, &ldquo;Sports&rdquo;, &ldquo;News&rdquo;.
                </p>
              </div>
            ) : (
              <motion.div
                key="immersive-search-results"
                initial={{ opacity: 0, y: 26 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.44, ease: [0.16, 1, 0.3, 1] }}
                className="immersive-search-results-container space-y-7"
              >
                {/* 1. Matched Channels */}
                {(activeTab === 'all' || activeTab === 'channels') && matchedChannels.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#E6005A]">
                      <Tv className="w-4 h-4" />
                      <span>CHANNELS ({matchedChannels.length})</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                      {matchedChannels.map((ch) => (
                        <div
                          key={ch.id}
                          onClick={() => {
                            onSelectChannel(ch);
                            navigate(`/live-tv?channel=${ch.slug}`);
                          }}
                          className="group relative p-3 rounded-2xl bg-[#353535] hover:bg-[#3d3d3d] border border-white/10 hover:border-[#FFFFFF] flex flex-col items-center text-center cursor-pointer transition-all shadow-md"
                        >
                          <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center p-2 rounded-xl bg-[#2a2a2a] border border-white/5 mb-2 overflow-hidden">
                            <img
                              src={ch.logo}
                              alt={ch.name}
                              referrerPolicy="no-referrer"
                              className={`w-full h-full object-contain filter drop-shadow-sm transition-transform ${
                                ch.category === 'Kênh địa phương' || ch.category === 'Kênh phát thanh' || ch.category === 'Kênh HTV'
                                  ? 'scale-115'
                                  : ch.id === 'vtv1' || ch.id === 'vtv3'
                                    ? 'scale-[0.90]'
                                    : ''
                              }`}
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          </div>
                          <span className="text-xs font-bold text-[#111827] dark:text-white group-hover:text-[#E6005A] transition-colors line-clamp-1">
                            {ch.shortName || ch.name}
                          </span>
                          <span className="text-[10px] text-[#8A798C] mt-0.5">
                            {ch.category}
                          </span>

                          <div className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1 px-2.5 rounded-full bg-[#4cc2ff]/10 group-hover:bg-[#4cc2ff] text-[11px] font-semibold text-[#4cc2ff] group-hover:text-black transition-all">
                            <Play className="w-3 h-3 fill-current" />
                            <span>Watch Live</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Matched EPG TV Schedule (Lịch phát sóng) */}
                {(activeTab === 'all' || activeTab === 'epg') && (epgResults.length > 0 || isSearchingEpg) && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-bold text-[#4cc2ff]">
                        <Calendar className="w-4 h-4" />
                        <span>LỊCH PHÁT SÓNG / TV SCHEDULE ({epgResults.length})</span>
                      </div>
                      {isSearchingEpg && (
                        <span className="text-xs text-[#9CA3AF] flex items-center gap-1.5">
                          <SpinningRing size={13} strokeWidth={2} />
                          <span>Đang tra cứu epg.io.vn...</span>
                        </span>
                      )}
                    </div>

                    {epgResults.length === 0 && isSearchingEpg ? (
                      <div className="py-8 flex flex-col items-center justify-center gap-2 bg-black/5 dark:bg-[#200d23]/40 rounded-2xl border border-black/10 dark:border-[#3b1540]/60">
                        <SpinningRing size={26} strokeWidth={3} />
                        <span className="text-xs text-[#9CA3AF]">Đang tìm chương trình trong lịch phát sóng...</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {(activeTab === 'epg' ? epgResults : epgResults.slice(0, 9)).map((item) => {
                          const isLive = item.program.isLive;
                          const isUpcoming = item.program.isUpcoming;
                          return (
                            <div
                              key={`${item.channel.id}-${item.program.id}-${item.program.start}`}
                              onClick={() => {
                                onSelectChannel(item.channel);
                                navigate(`/live-tv?channel=${item.channel.slug}`);
                              }}
                              className={`group p-3.5 rounded-2xl transition-all cursor-pointer flex flex-col justify-between border shadow-sm ${
                                isLive
                                  ? 'bg-[#E50914]/10 dark:bg-[#E50914]/15 border-[#E50914]/40 hover:border-[#E50914]'
                                  : 'bg-white dark:bg-[#200d23] hover:bg-black/5 dark:hover:bg-[#2e1233] border-black/10 dark:border-[#3b1540] hover:border-[#4cc2ff]'
                              }`}
                            >
                              <div>
                                {/* Channel & Live status header */}
                                <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-black/5 dark:border-white/5">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-6 h-6 rounded-md bg-black/5 dark:bg-white/10 flex items-center justify-center p-0.5 shrink-0 overflow-hidden">
                                      <img
                                        src={item.channel.logo}
                                        alt={item.channel.name}
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                          (e.target as HTMLElement).style.display = 'none';
                                        }}
                                      />
                                    </div>
                                    <span className="text-xs font-bold text-[#111827] dark:text-white truncate">
                                      {item.channel.name}
                                    </span>
                                  </div>

                                  {isLive ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E50914] text-white flex items-center gap-1 shadow-xs">
                                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                      ĐANG PHÁT
                                    </span>
                                  ) : isUpcoming ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#4cc2ff]/20 text-[#4cc2ff] border border-[#4cc2ff]/30">
                                      SẮP PHÁT
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/5 dark:bg-white/10 text-[#6B7280] dark:text-[#9CA3AF]">
                                      ĐÃ PHÁT
                                    </span>
                                  )}
                                </div>

                                {/* Program title & description */}
                                <h4 className="text-sm font-bold text-[#111827] dark:text-white group-hover:text-[#4cc2ff] line-clamp-2 leading-snug transition-colors">
                                  {item.program.title}
                                </h4>
                                {item.program.description && (
                                  <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-1 line-clamp-2 leading-relaxed">
                                    {item.program.description}
                                  </p>
                                )}
                              </div>

                              {/* Time & Action button */}
                              <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-black/5 dark:border-white/5 text-xs">
                                <div className="flex items-center gap-1.5 font-mono text-[#6B7280] dark:text-[#A1A1AA]">
                                  <Clock className="w-3.5 h-3.5 shrink-0 text-[#4cc2ff]" />
                                  <span>{item.program.startTimeText} - {item.program.stopTimeText}</span>
                                </div>

                                <div className="flex items-center gap-1 text-[11px] font-semibold text-[#4cc2ff] group-hover:translate-x-0.5 transition-transform">
                                  <Play className="w-3 h-3 fill-current" />
                                  <span>{isLive ? 'Xem ngay' : 'Mở kênh'}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Matched News */}
                {(activeTab === 'all' || activeTab === 'news') && matchedNews.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#E6005A]">
                      <Newspaper className="w-4 h-4" />
                      <span>NEWS & ARTICLES ({matchedNews.length})</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                      {matchedNews.map((news) => (
                        <div
                          key={news.id}
                          onClick={() => navigate(`/news/${news.slug}`)}
                          className="group p-3.5 rounded-2xl bg-white dark:bg-[#200d23] hover:bg-black/5 dark:hover:bg-[#2e1233] border border-black/10 dark:border-[#3b1540] hover:border-[#E6005A]/60 flex gap-3.5 cursor-pointer transition-all shadow-md"
                        >
                          <div className="w-24 h-20 sm:w-28 sm:h-22 rounded-xl overflow-hidden bg-black/5 dark:bg-[#1B0912] shrink-0 relative">
                            <img
                              src={news.coverImage}
                              alt={news.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <span className="absolute bottom-1 left-1 px-1.5 py-0.5 text-[9px] font-semibold rounded-[2px] bg-black/75 text-white">
                              {news.category}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <h4 className="text-xs sm:text-sm font-bold text-[#111827] dark:text-white group-hover:text-[#E6005A] line-clamp-2 leading-snug transition-colors">
                              {news.title}
                            </h4>
                            <div className="flex items-center gap-1.5 text-[10px] text-[#8A798C] mt-2">
                              <Clock className="w-3 h-3 shrink-0" />
                              <span>{news.publishedAt}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
