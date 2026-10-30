import React, { useState } from 'react';
import { Channel } from '../types';
import { ChannelCard } from '../components/ChannelCard';
import { NewsCard } from '../components/NewsCard';
import { CategoryIcon } from '../components/CategoryIcon';
import { NEWS_DATA } from '../data/news';
import { useFavorites } from '../hooks/useFavorites';
import { Heart, Bookmark, Tv, Newspaper, ArrowRight } from 'lucide-react';
import { FluentDeleteIcon } from '../components/FluentIcons';

interface FavoritesProps {
  channels: Channel[];
  onSelectChannel: (channel: Channel) => void;
  navigate: (route: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export const Favorites: React.FC<FavoritesProps> = ({
  channels,
  onSelectChannel,
  navigate,
  searchQuery,
  onSearchChange
}) => {
  const [activeTab, setActiveTab] = useState<'channels' | 'news'>('channels');
  const { favoriteChannelIds, bookmarkedNewsSlugs, clearAllFavorites } = useFavorites();

  const query = (searchQuery || '').trim().toLowerCase();
  const favoriteChannels = channels.filter((c) => {
    const isFav = favoriteChannelIds.includes(c.id);
    const matchesSearch = !query ||
      c.name.toLowerCase().includes(query) ||
      c.category.toLowerCase().includes(query);
    return isFav && matchesSearch;
  });

  const bookmarkedNews = NEWS_DATA.filter((n) => {
    const isBookmarked = bookmarkedNewsSlugs.includes(n.slug);
    const matchesSearch = !query ||
      n.title.toLowerCase().includes(query) ||
      n.excerpt.toLowerCase().includes(query) ||
      n.category.toLowerCase().includes(query);
    return isBookmarked && matchesSearch;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 text-xs text-[#E6005A] font-bold font-square uppercase tracking-wider mb-1">
            <CategoryIcon className="w-6 h-6 sm:w-6.5 sm:h-6.5 shrink-0" />
            <span>Saved Content</span>
          </div>
          <h1 className="text-3xl font-bold font-square text-[#111827] dark:text-white tracking-tight">
            Favorites & Bookmarks
          </h1>
          <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#9CA3AF] mt-1">
            All television channels and articles you have bookmarked for quick access.
          </p>
        </div>

        {(favoriteChannels.length > 0 || bookmarkedNews.length > 0) && (
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all favorites?')) {
                clearAllFavorites();
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F3F4F6] hover:bg-red-50 text-[#6B7280] hover:text-red-600 border border-[#E5E7EB] dark:bg-[#27121d] dark:hover:bg-[#FF2020]/20 dark:text-[#A1A1AA] dark:hover:text-[#FF4D4D] dark:border-white/10 text-xs font-semibold transition-colors shrink-0 cursor-pointer"
          >
            <FluentDeleteIcon className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex p-1.5 rounded-full bg-[#E5E7EB] dark:bg-[#38383d] border border-[#D1D5DB] dark:border-[#2D2D35] max-w-sm">
        <button
          onClick={() => setActiveTab('channels')}
          className={`flex-1 py-2 px-4 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'channels'
              ? 'bg-[#4cc2ff] text-white dark:text-black shadow-md'
              : 'text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white'
          }`}
        >
          <Tv className="w-3.5 h-3.5" />
          <span>Favorite Channels ({favoriteChannels.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('news')}
          className={`flex-1 py-2 px-4 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'news'
              ? 'bg-[#4cc2ff] text-white dark:text-black shadow-md'
              : 'text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Saved Articles ({bookmarkedNews.length})</span>
        </button>
      </div>

      {/* Channels List */}
      {activeTab === 'channels' && (
        <div>
          {favoriteChannels.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {favoriteChannels.map((channel) => (
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
            <div className="text-center py-16 p-8 rounded-[30px] bg-white dark:bg-[#38383d] border border-[#e5e5e5] dark:border-[#2D2D35]">
              <div className="w-16 h-16 rounded-full bg-black/5 dark:bg-[#28282d] flex items-center justify-center text-[#A1A1AA] mx-auto mb-4">
                <Heart className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-[#111827] dark:text-white mb-2">No favorite channels yet</h3>
              <p className="text-xs text-[#9CA3AF] max-w-md mx-auto mb-6">
                Click the heart icon on any television channel to save it to your quick access list.
              </p>
              <button
                onClick={() => navigate('/live-tv')}
                className="px-6 py-2.5 rounded-full bg-gradient-purple-active text-white text-xs font-bold shadow-lg glow-purple"
              >
                Explore Live TV
              </button>
            </div>
          )}
        </div>
      )}

      {/* News List */}
      {activeTab === 'news' && (
        <div>
          {bookmarkedNews.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookmarkedNews.map((article) => (
                <NewsCard
                  key={article.id}
                  article={article}
                  onClick={(a) => navigate(`/news/${a.slug}`)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 p-8 rounded-[30px] bg-white dark:bg-[#38383d] border border-[#e5e5e5] dark:border-[#2D2D35]">
              <div className="w-16 h-16 rounded-full bg-black/5 dark:bg-[#28282d] flex items-center justify-center text-[#A1A1AA] mx-auto mb-4">
                <Bookmark className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-[#111827] dark:text-white mb-2">No saved articles yet</h3>
              <p className="text-xs text-[#9CA3AF] max-w-md mx-auto mb-6">
                Save broadcasting tech and television history articles to read anytime.
              </p>
              <button
                onClick={() => navigate('/news')}
                className="px-6 py-2.5 rounded-full bg-gradient-purple-active text-white text-xs font-bold shadow-lg glow-purple"
              >
                Explore News & Articles
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
