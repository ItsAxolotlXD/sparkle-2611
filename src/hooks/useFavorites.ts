import { useSyncExternalStore } from 'react';

const FAVORITES_CHANNELS_KEY = 'waves_favorite_channels';
const BOOKMARKED_NEWS_KEY = 'waves_bookmarked_news';

const getInitialFavorites = (): string[] => {
  try {
    const saved = localStorage.getItem(FAVORITES_CHANNELS_KEY);
    return saved ? JSON.parse(saved) : ['vtv1-hd', 'vtv3-hd', 'vtv4-hd'];
  } catch {
    return ['vtv1-hd', 'vtv3-hd', 'vtv4-hd'];
  }
};

const getInitialBookmarks = (): string[] => {
  try {
    const saved = localStorage.getItem(BOOKMARKED_NEWS_KEY);
    return saved ? JSON.parse(saved) : ['vietnam-today-chuyen-doi-so-quoc-te'];
  } catch {
    return ['vietnam-today-chuyen-doi-so-quoc-te'];
  }
};

interface FavoritesState {
  favoriteChannelIds: string[];
  bookmarkedNewsSlugs: string[];
}

let favoritesStore: FavoritesState = {
  favoriteChannelIds: getInitialFavorites(),
  bookmarkedNewsSlugs: getInitialBookmarks(),
};

const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  const handleStorage = (e: StorageEvent) => {
    if (e.key === FAVORITES_CHANNELS_KEY || e.key === BOOKMARKED_NEWS_KEY || !e.key) {
      favoritesStore = {
        favoriteChannelIds: getInitialFavorites(),
        bookmarkedNewsSlugs: getInitialBookmarks(),
      };
      callback();
    }
  };
  window.addEventListener('storage', handleStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', handleStorage);
  };
}

function getSnapshot(): FavoritesState {
  return favoritesStore;
}

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (err) {
      console.error(err);
    }
  });
}

export function useFavorites() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const toggleFavoriteChannel = (channelId: string) => {
    const prev = favoritesStore.favoriteChannelIds;
    const next = prev.includes(channelId)
      ? prev.filter((id) => id !== channelId)
      : [...prev, channelId];
    
    favoritesStore = {
      ...favoritesStore,
      favoriteChannelIds: next,
    };
    try {
      localStorage.setItem(FAVORITES_CHANNELS_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('Could not save favorites to localStorage', e);
    }
    notifyListeners();
  };

  const isChannelFavorite = (channelId: string) => {
    return state.favoriteChannelIds.includes(channelId);
  };

  const toggleBookmarkNews = (slug: string) => {
    const prev = favoritesStore.bookmarkedNewsSlugs;
    const next = prev.includes(slug)
      ? prev.filter((s) => s !== slug)
      : [...prev, slug];
    
    favoritesStore = {
      ...favoritesStore,
      bookmarkedNewsSlugs: next,
    };
    try {
      localStorage.setItem(BOOKMARKED_NEWS_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('Could not save bookmarks to localStorage', e);
    }
    notifyListeners();
  };

  const isNewsBookmarked = (slug: string) => {
    return state.bookmarkedNewsSlugs.includes(slug);
  };

  const clearAllFavorites = () => {
    favoritesStore = {
      favoriteChannelIds: [],
      bookmarkedNewsSlugs: [],
    };
    try {
      localStorage.removeItem(FAVORITES_CHANNELS_KEY);
      localStorage.removeItem(BOOKMARKED_NEWS_KEY);
    } catch (e) {
      console.warn(e);
    }
    notifyListeners();
  };

  return {
    favoriteChannelIds: state.favoriteChannelIds,
    bookmarkedNewsSlugs: state.bookmarkedNewsSlugs,
    toggleFavoriteChannel,
    isChannelFavorite,
    toggleBookmarkNews,
    isNewsBookmarked,
    clearAllFavorites,
  };
}
