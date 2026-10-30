import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  RefreshCw, 
  Radio, 
  ExternalLink, 
  AlertCircle,
  Search,
  Sparkles,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Flame,
  Tv,
  X
} from 'lucide-react';
import { Channel } from '../types';
import { fetchChannelEpgGuide, EpgProgram, EpgGuideResponse } from '../services/epgService';
import { SpinningRing } from './SpinningRing';
import { FluentSearchIcon } from './FluentIcons';

interface EpgScheduleWidgetProps {
  currentChannel: Channel;
  className?: string;
  onClose?: () => void;
  isSidebarMode?: boolean;
}

export const EpgScheduleWidget: React.FC<EpgScheduleWidgetProps> = ({
  currentChannel,
  className = '',
  onClose,
  isSidebarMode = false,
}) => {
  const [guideData, setGuideData] = useState<EpgGuideResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [expandedProgramId, setExpandedProgramId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const listContainerRef = useRef<HTMLDivElement>(null);
  const liveProgramRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch EPG for current channel and date
  const loadEpg = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const data = await fetchChannelEpgGuide(currentChannel, selectedDate || undefined, isManualRefresh);
      setGuideData(data);
      if (!selectedDate && data.dates && data.dates.length > 0) {
        const todayStr = new Date().toISOString().slice(0, 10);
        const match = data.dates.find((d) => d === todayStr) || data.dates[0];
        setSelectedDate(match);
      }
    } catch (err: any) {
      console.warn('Lỗi tải lịch phát sóng từ epg.io.vn:', err);
      setError('Không thể tải lịch phát sóng từ epg.io.vn. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentChannel, selectedDate]);

  // Load when currentChannel changes or selectedDate changes
  useEffect(() => {
    loadEpg(false);
  }, [currentChannel.id, selectedDate]);

  // Background auto-refresh every 3 minutes for daily real-time accuracy
  useEffect(() => {
    pollIntervalRef.current = setInterval(() => {
      loadEpg(true);
    }, 3 * 60 * 1000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [loadEpg]);

  // Filter programs by selected date and search text
  const displayedPrograms = useMemo(() => {
    if (!guideData?.programs) return [];
    let list = guideData.programs;

    // Filter by selected date
    if (selectedDate) {
      list = list.filter((p) => p.start.startsWith(selectedDate));
    }

    // Filter by search query
    if (filterQuery.trim()) {
      const q = filterQuery.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.startTimeText.includes(q)
      );
    }

    return list;
  }, [guideData, selectedDate, filterQuery]);

  // Find currently live program
  const liveProgram = useMemo(() => {
    return displayedPrograms.find((p) => p.isLive) || guideData?.programs.find((p) => p.isLive);
  }, [displayedPrograms, guideData]);

  // Scroll to current live program
  const scrollToLive = useCallback(() => {
    if (liveProgramRef.current && listContainerRef.current) {
      liveProgramRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  // Auto-scroll on initial load when live program is ready
  useEffect(() => {
    if (!isLoading && liveProgram) {
      const t = setTimeout(scrollToLive, 350);
      return () => clearTimeout(t);
    }
  }, [isLoading, liveProgram?.id, scrollToLive]);

  // Format date tab labels
  const formatDateLabel = (dateStr: string) => {
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      const d = new Date(dateStr);
      const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      const dayName = dayNames[d.getDay()];
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');

      if (dateStr === todayStr) {
        return `Hôm nay (${day}/${month})`;
      }
      return `${dayName} ${day}/${month}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      id="epg-schedule-widget"
      className={`flex flex-col h-full min-h-0 select-none ${
        isSidebarMode
          ? 'bg-transparent border-0 shadow-none'
          : `fluent-card rounded-2xl bg-white dark:bg-[#38383d] border border-black/10 dark:border-white/10 shadow-sm overflow-hidden ${className}`
      }`}
    >
      {/* Sidebar Mode Header: Clean header with "Search for programs" input on the left and Close button X on the right */}
      {isSidebarMode ? (
        <div className="h-14 px-3 sm:px-4 flex items-center justify-between gap-3 border-b border-black/10 dark:border-white/10 bg-[#16181d] shrink-0">
          {/* Synchronized Search Bar matching "Find and search" layout & design */}
          <div className="group relative flex-1 min-w-0 h-8 sm:h-8.5 bg-black/20 border border-white/10 flex items-center px-3 gap-2 rounded-[6px] transition-all focus-within:border-b-2 focus-within:border-b-[#4cc2ff]">
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Search for programs"
              className="w-full bg-transparent text-xs sm:text-[13px] text-white placeholder-[#71717a] dark:placeholder-white outline-none border-none py-1 pr-6 no-fluent-line"
            />
            {filterQuery && (
              <button
                type="button"
                onClick={() => setFilterQuery('')}
                className="absolute right-1 text-[#71717a] dark:text-white hover:text-white p-0.5 transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action buttons: live quick jump, refresh, and close X button */}
          <div className="flex items-center gap-1.5 shrink-0">
            {liveProgram && (
              <button
                type="button"
                onClick={scrollToLive}
                title="Cuộn tới chương trình đang phát"
                className="px-2 py-1.5 rounded-full text-[11px] font-medium bg-[#4cc2ff]/15 hover:bg-[#4cc2ff]/25 active:scale-95 text-[#4cc2ff] transition-all flex items-center gap-1 cursor-pointer border-0"
              >
                <Radio className="w-3 h-3 animate-pulse" />
                <span className="hidden sm:inline">Đang chiếu</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => loadEpg(true)}
              disabled={isRefreshing || isLoading}
              title="Làm mới lịch phát sóng"
              className={`p-2 rounded-full text-[#9CA3AF] hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer border-0 ${
                isRefreshing ? 'animate-spin text-[#4cc2ff]' : ''
              }`}
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#9CA3AF] hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0 border-0 ml-0.5"
                title="Đóng lịch phát sóng"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Non-sidebar fallback header */
        <div className="p-3.5 sm:p-4 border-b border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-black/20 flex flex-col gap-2 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#4cc2ff]/15 text-[#4cc2ff] flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-[#111827] dark:text-white truncate leading-tight">
                  Lịch phát sóng
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {liveProgram && (
                <button
                  type="button"
                  onClick={scrollToLive}
                  title="Cuộn tới chương trình đang phát"
                  className="px-2 py-1 rounded-[6px] text-[11px] font-medium bg-[#4cc2ff]/15 hover:bg-[#4cc2ff]/25 active:scale-95 text-[#0078d4] dark:text-[#4cc2ff] transition-all flex items-center gap-1 cursor-pointer border-0"
                >
                  <Radio className="w-3 h-3 animate-pulse" />
                  <span className="hidden sm:inline">Đang chiếu</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => loadEpg(true)}
                disabled={isRefreshing || isLoading}
                title="Làm mới lịch phát sóng"
                className={`p-1.5 rounded-[6px] text-neutral-600 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer border-0 ${
                  isRefreshing ? 'animate-spin text-[#4cc2ff]' : ''
                }`}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Date Tabs Filter Bar (no clock, no epg source text, no outline) */}
      <div className="px-3 sm:px-4 py-2 border-b border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] flex items-center gap-1.5 shrink-0 overflow-x-auto no-scrollbar">
        {guideData?.dates && guideData.dates.length > 0 ? (
          guideData.dates.map((dateStr) => {
            const isSelected = selectedDate === dateStr;
            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => setSelectedDate(dateStr)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 border-0 ${
                  isSelected
                    ? 'bg-[#4cc2ff] text-black font-bold shadow-xs'
                    : 'bg-black/5 dark:bg-white/10 text-[#4B5563] dark:text-[#D1D5DB] hover:bg-black/10 dark:hover:bg-white/15'
                }`}
              >
                {formatDateLabel(dateStr)}
              </button>
            );
          })
        ) : (
          <div className="text-[11px] text-[#9CA3AF]">Hôm nay</div>
        )}
      </div>

      {/* Program Schedule List: No borders/outlines on cards, start-only time enlarged */}
      <div
        ref={listContainerRef}
        className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-2 no-scrollbar"
      >
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-3">
            <SpinningRing size={38} strokeWidth={3.5} />
            <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
              Đang tải lịch phát sóng...
            </p>
          </div>
        ) : error ? (
          <div className="h-56 p-4 rounded-xl bg-black/5 dark:bg-white/5 flex flex-col items-center justify-center text-center space-y-2.5 border-0">
            <AlertCircle className="w-8 h-8 text-amber-500/80" />
            <p className="text-xs text-[#111827] dark:text-white font-medium max-w-[260px]">
              {error}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => loadEpg(true)}
                className="px-3 py-1 rounded-full text-xs font-semibold bg-[#4cc2ff] text-black hover:bg-[#6bd0ff] transition-all cursor-pointer border-0"
              >
                Thử lại
              </button>
            </div>
          </div>
        ) : displayedPrograms.length === 0 ? (
          <div className="h-56 p-4 rounded-xl bg-black/5 dark:bg-white/5 flex flex-col items-center justify-center text-center space-y-2 border-0">
            <Tv className="w-8 h-8 text-neutral-400" />
            <p className="text-xs font-medium text-[#111827] dark:text-white">
              Chưa có dữ liệu lịch phát sóng cho ngày này
            </p>
          </div>
        ) : (
          displayedPrograms.map((program) => {
            const isLive = program.isLive;
            const isExpanded = expandedProgramId === program.id;

            return (
              <div
                key={program.id}
                ref={isLive ? liveProgramRef : undefined}
                className={`relative rounded-xl transition-all p-2.5 sm:p-3 text-left border-0 outline-none ${
                  isLive
                    ? 'bg-[#4cc2ff]/15 dark:bg-[#4cc2ff]/20 shadow-sm'
                    : program.isPast
                    ? 'bg-black/[0.03] dark:bg-white/[0.04] opacity-75'
                    : 'bg-black/[0.05] dark:bg-white/[0.07] hover:bg-black/[0.08] dark:hover:bg-white/[0.1]'
                }`}
              >
                {/* Top Row: Start time enlarged (no stop time) & Badges */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    {/* Enlarged start-only time */}
                    <span
                      className={`text-sm sm:text-base font-mono font-extrabold tracking-tight ${
                        isLive ? 'text-[#0078d4] dark:text-[#4cc2ff]' : 'text-neutral-800 dark:text-white'
                      }`}
                    >
                      {program.startTimeText}
                    </span>
                    <span className="text-[11px] text-neutral-400 font-medium">
                      ({program.durationMinutes}p)
                    </span>
                  </div>

                  {isLive && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#4cc2ff] text-black shadow-xs flex items-center gap-1 shrink-0 animate-pulse border-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-black" />
                      Đang phát
                    </span>
                  )}
                  {program.isUpcoming && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-500/15 text-neutral-600 dark:text-neutral-300 border-0">
                      Sắp phát
                    </span>
                  )}
                </div>

                {/* Live Progress Bar */}
                {isLive && (
                  <div className="w-full h-1 bg-black/10 dark:bg-white/15 rounded-full overflow-hidden my-1.5 border-0">
                    <div
                      className="h-full bg-[#4cc2ff] transition-all duration-1000 ease-linear rounded-full"
                      style={{ width: `${program.progress}%` }}
                    />
                  </div>
                )}

                {/* Main Content: Title & Thumbnail */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="min-w-0 flex-1">
                    <h4
                      className={`text-xs sm:text-[13px] font-semibold leading-snug line-clamp-2 ${
                        isLive
                          ? 'text-[#0078d4] dark:text-[#4cc2ff] font-bold'
                          : 'text-[#111827] dark:text-neutral-100'
                      }`}
                    >
                      {program.title}
                    </h4>

                    {program.description && (
                      <p
                        className={`text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5 leading-relaxed ${
                          isExpanded ? '' : 'line-clamp-1'
                        }`}
                      >
                        {program.description}
                      </p>
                    )}
                  </div>

                  {program.thumbnail && (
                    <img
                      src={program.thumbnail}
                      alt={program.title}
                      loading="lazy"
                      className="w-12 h-8 sm:w-14 sm:h-9 object-cover rounded-md bg-black/10 shrink-0 border-0"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  )}
                </div>

                {/* Expand / Collapse description toggle if text is longer */}
                {program.description && program.description.length > 50 && (
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedProgramId(isExpanded ? null : program.id)
                    }
                    className="mt-1 text-[10px] text-[#4cc2ff] hover:underline flex items-center gap-0.5 cursor-pointer border-0"
                  >
                    <span>{isExpanded ? 'Thu gọn' : 'Chi tiết'}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
