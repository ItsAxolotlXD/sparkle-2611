import React, { useState, useEffect } from 'react';
import { Play, Heart } from 'lucide-react';
import { Channel } from '../types';
import { useFavorites } from '../hooks/useFavorites';
import { DEFAULT_BANNER_PLACEHOLDER } from '../data/heroSlides';
import { SpinningRing } from './SpinningRing';

interface ChannelCardProps {
  channel: Channel;
  onSelect: (channel: Channel) => void;
  isActive?: boolean;
}

export const ChannelCard: React.FC<ChannelCardProps> = ({
  channel,
  onSelect,
  isActive
}) => {
  const { isChannelFavorite, toggleFavoriteChannel } = useFavorites();
  const isFav = isChannelFavorite(channel.id);

  // 3-second loading state on tab load before displaying channel images
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      id={`channel-card-${channel.id}`}
      data-channel-card="true"
      onClick={() => onSelect(channel)}
      className={`fluent-reveal-item channel-card group relative rounded-[8px] bg-white dark:bg-[#38383d] border transition-colors overflow-hidden cursor-pointer shadow-xs ${
        isActive
          ? 'border-[#4cc2ff] ring-1 ring-[#4cc2ff]'
          : 'border-[#e5e5e5] dark:border-[#48484e] hover:border-[#cccccc] dark:hover:border-[#606066] hover:bg-[#fafafa] dark:hover:bg-[#424248]'
      }`}
    >
      {/* Top Banner / Logo Area */}
      <div className="relative h-32 bg-neutral-100 dark:bg-[#38383d] flex items-center justify-center p-4 overflow-hidden">
        {isLoading ? (
          <div key="channel-loading" className="flex items-center justify-center w-full h-full">
            <SpinningRing size={36} strokeWidth={4} />
          </div>
        ) : (
          <div key="channel-loaded" className="slide-up-refresh w-full h-full relative flex items-center justify-center">
            <img
              src={channel.bannerImage || DEFAULT_BANNER_PLACEHOLDER}
              alt={channel.name}
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src !== DEFAULT_BANNER_PLACEHOLDER) {
                  target.src = DEFAULT_BANNER_PLACEHOLDER;
                }
              }}
            />

            {/* Center Channel Logo */}
            <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-[6px] bg-white dark:bg-[#1a1a1a] border border-black/10 dark:border-white/10 flex items-center justify-center p-2 overflow-hidden shadow-xs">
              <img
                src={channel.logo}
                alt={channel.name}
                referrerPolicy="no-referrer"
                className={`w-full h-full object-contain filter drop-shadow-xs transition-transform ${
                  channel.category === 'Kênh địa phương' || channel.category === 'Kênh phát thanh' || channel.category === 'Kênh HTV'
                    ? 'scale-110'
                    : channel.category === 'Kênh VTV'
                      ? 'scale-[0.96] p-0.5'
                      : ''
                }`}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          </div>
        )}

        {/* Live Status Badge */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded-[3px] bg-[#d83b01] text-white text-[10px] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span>LIVE</span>
        </div>

        {/* Quality Pill */}
        <div className="absolute top-2.5 right-11 px-1.5 py-0.5 rounded-[3px] bg-black/75 text-white text-[10px] font-mono font-bold">
          {channel.quality}
        </div>

        {/* Favorite Heart Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavoriteChannel(channel.id);
          }}
          className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-[4px] flex items-center justify-center transition-colors ${
            isFav 
              ? 'bg-[#e81123] text-white shadow-xs' 
              : 'bg-black/60 text-white hover:bg-black/80'
          }`}
          title={isFav ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
        </button>

        {/* Hover Play Button Overlay */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
          <div className="w-10 h-10 rounded-[6px] bg-[#4cc2ff] hover:bg-[#6bd0ff] flex items-center justify-center text-black shadow-md">
            <Play className="w-4.5 h-4.5 fill-black text-black ml-0.5" />
          </div>
        </div>
      </div>

      {/* Card Info Content */}
      <div className="p-3.5 pt-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className="text-[13.5px] font-semibold text-[#111827] dark:text-white group-hover:text-[#4cc2ff] dark:group-hover:text-[#4cc2ff] truncate">
              {channel.shortName || channel.name}
            </h3>
          </div>
          <span className="text-[11px] font-normal text-[#6b7280] dark:text-[#a1a1aa] shrink-0">
            {channel.category}
          </span>
        </div>

        {/* Current Program on Air */}
        <div className="mt-2 p-2 rounded-[4px] bg-black/5 dark:bg-[#38383d] border border-black/5 dark:border-white/5">
          <div className="flex items-center justify-between text-[11px] text-[#555555] dark:text-[#a1a1aa] mb-1">
            <span className="font-medium text-[#111827] dark:text-white truncate max-w-[170px]">
              {channel.currentProgram?.title || 'Live Broadcast'}
            </span>
            <span className="text-[10px] shrink-0 font-mono">
              {channel.currentProgram?.startTime} - {channel.currentProgram?.endTime}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-black/10 dark:bg-white/10 h-1 rounded-[2px] overflow-hidden">
            <div
              className="bg-[#4cc2ff] h-full rounded-[2px]"
              style={{ width: `${channel.currentProgram?.progress || 50}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
