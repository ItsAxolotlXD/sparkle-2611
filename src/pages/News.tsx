import React, { useState } from 'react';
import { motion } from 'motion/react';
import { NewsArticle } from '../types';
import { NEWS_DATA } from '../data/news';
import { NewsCard } from '../components/NewsCard';
import { SequentialSection } from '../components/SequentialSection';
import { useSettings } from '../hooks/useSettings';

interface NewsProps {
  navigate: (route: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onOpenUpdate?: () => void;
}

type FeedTab = 'All' | 'Insider' | 'Releases' | 'Others';

interface FeedTabItem {
  id: FeedTab;
  label: string;
  icon: string;
}

const FEED_TABS: FeedTabItem[] = [
  { id: 'All', label: 'All', icon: '/assets/aistudio/icons8-list-96_2ac7968d.png' },
  { id: 'Insider', label: 'Insider', icon: '/assets/aistudio/icons8-lab-96_3288c3f4.png' },
  { id: 'Releases', label: 'Releases', icon: '/assets/aistudio/icons8-book-96_0b3e4efb.png' },
  { id: 'Others', label: 'Others', icon: '/assets/aistudio/icons8-megaphone-96_059922ae.png' },
];

const slideUpVariant = {
  hidden: { opacity: 0, y: 22 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.52,
      ease: [0.16, 1, 0.3, 1],
      delay: Math.min(i * 0.046, 1.1),
    },
    transitionEnd: {
      transform: 'none',
    },
  }),
};

const cardSlideUpVariant = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.46,
      ease: [0.16, 1, 0.3, 1],
      delay: 0,
    },
    transitionEnd: {
      transform: 'none',
    },
  },
};

export const News: React.FC<NewsProps> = ({ navigate, searchQuery, onSearchChange }) => {
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState<FeedTab>('All');

  const isArticleInTab = (article: NewsArticle, tab: FeedTab): boolean => {
    if (tab === 'All') return true;
    
    // 'Others' tab specifically holds build numbering and general editorial announcements
    if (tab === 'Others') {
      return (
        article.category === 'Others' ||
        article.category === 'Other news' ||
        article.id === 'news-sparkle-build-numbering-system' ||
        article.slug.includes('numbering-system')
      );
    }

    if (tab === 'Releases') {
      return (
        article.category === 'Releases' ||
        article.title.toLowerCase().includes('release -') ||
        article.title.toLowerCase().includes('rtm') ||
        article.slug.includes('rtm') ||
        article.slug.includes('release')
      );
    }

    if (tab === 'Insider') {
      // Exclude build numbering which belongs to 'Others'
      if (
        article.category === 'Others' ||
        article.category === 'Other news' ||
        article.id === 'news-sparkle-build-numbering-system' ||
        article.slug.includes('numbering-system')
      ) {
        return false;
      }
      return (
        article.category === 'Insider' ||
        article.title.toLowerCase().includes('insider')
      );
    }

    return true;
  };

  const query = (searchQuery || '').trim().toLowerCase();
  const filteredNews = NEWS_DATA.filter((article) => {
    const matchesTab = isArticleInTab(article, activeTab);
    const matchesSearch = !query ||
      article.title.toLowerCase().includes(query) ||
      article.excerpt.toLowerCase().includes(query) ||
      article.category.toLowerCase().includes(query);
    return matchesTab && matchesSearch;
  });

  let animIdx = 0;

  return (
    <div id="feed-page" className="min-h-screen bg-transparent text-[#111827] dark:text-white p-6 sm:p-10 select-none">
      <div className="mx-auto max-w-6xl">
        {/* Header matching Ink Canvas and Notes safe area */}
        <div className="flex items-end justify-between gap-4 mb-8">
          <motion.div
            variants={slideUpVariant}
            initial="hidden"
            animate="visible"
            custom={animIdx++}
          >
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Feed</h1>
            <p className="text-sm text-black/55 dark:text-white/55 mt-2">
              Release notes, system updates, changelogs, broadcasting technology, and media culture.
            </p>
          </motion.div>
        </div>

        {/* Category Underline Tabs Filter (matching Fluent underline tab style in Watch tab with #4cc2ff accent) */}
        <motion.div
          variants={slideUpVariant}
          initial="hidden"
          animate="visible"
          custom={animIdx++}
          id="feed-category-tabs"
          className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1 mb-6 no-scrollbar border-0"
        >
          {FEED_TABS.map((tabItem) => {
            const isActive = activeTab === tabItem.id;
            return (
              <button
                key={tabItem.id}
                id={`feed-tab-${tabItem.id.toLowerCase().replace(/\s+/g, '-')}`}
                type="button"
                onClick={() => setActiveTab(tabItem.id)}
                className={`relative px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm whitespace-nowrap cursor-pointer select-none transition-colors flex flex-col items-center justify-center !bg-transparent !border-0 !shadow-none hover:!bg-transparent active:!bg-transparent focus:!bg-transparent ${
                  isActive
                    ? 'text-black dark:text-white font-bold'
                    : 'text-[#6B7280] hover:text-black dark:text-[#9CA3AF] dark:hover:text-white font-medium'
                }`}
              >
                <span className="relative z-10 !bg-transparent flex items-center gap-2">
                  <img
                    src={tabItem.icon}
                    alt=""
                    aria-hidden="true"
                    className="w-4 h-4 object-contain shrink-0 filter dark:brightness-0 dark:invert transition-all"
                  />
                  <span>{tabItem.label}</span>
                </span>
                {isActive && (
                  <motion.div
                    layoutId="feed-category-active-underline"
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
        </motion.div>

        {/* Articles Grid matching Ink Canvas layout */}
        {filteredNews.length === 0 ? (
          <motion.div
            variants={slideUpVariant}
            initial="hidden"
            animate="visible"
            custom={animIdx++}
            className="py-16 text-center space-y-3 rounded-2xl bg-white dark:bg-[#2c3037] border border-black/8 dark:border-white/10 p-6 shadow-sm"
          >
            <p className="text-sm font-medium text-black/60 dark:text-white/60">
              No articles found matching "{query}"
            </p>
            {onSearchChange && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="px-4 py-1.5 rounded-full text-xs font-semibold bg-[#005fb8] dark:bg-[#4cc2ff] text-white dark:text-black hover:opacity-90 transition-opacity cursor-pointer"
              >
                Clear Search
              </button>
            )}
          </motion.div>
        ) : filteredNews.length <= 6 || !settings.loadPagesSequentially ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredNews.map((article) => {
              return (
                <motion.div
                  key={`${activeTab}-${article.id}`}
                  variants={cardSlideUpVariant}
                  initial="hidden"
                  animate="visible"
                >
                  <NewsCard
                    article={article}
                    onClick={(a) => navigate(`/news/${a.slug}`)}
                  />
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-5">
            {/* Initial batch (First 6 articles) */}
            <SequentialSection order={0} enabled={settings.loadPagesSequentially}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredNews.slice(0, 6).map((article) => {
                  return (
                    <motion.div
                      key={`${activeTab}-${article.id}`}
                      variants={cardSlideUpVariant}
                      initial="hidden"
                      animate="visible"
                    >
                      <NewsCard
                        article={article}
                        onClick={(a) => navigate(`/news/${a.slug}`)}
                      />
                    </motion.div>
                  );
                })}
              </div>
            </SequentialSection>

            {/* Subsequent articles */}
            <SequentialSection order={1} enabled={settings.loadPagesSequentially}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredNews.slice(6).map((article) => {
                  return (
                    <motion.div
                      key={`${activeTab}-${article.id}`}
                      variants={cardSlideUpVariant}
                      initial="hidden"
                      animate="visible"
                    >
                      <NewsCard
                        article={article}
                        onClick={(a) => navigate(`/news/${a.slug}`)}
                      />
                    </motion.div>
                  );
                })}
              </div>
            </SequentialSection>
          </div>
        )}
      </div>
    </div>
  );
};

