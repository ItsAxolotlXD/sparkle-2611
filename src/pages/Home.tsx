import React, { useState, useEffect, useMemo } from 'react';
import { HeroCarousel } from '../components/HeroCarousel';
import { OnAirSlider } from '../components/OnAirSlider';
import { FarewellAnnouncement } from '../components/FarewellAnnouncement';
import { CategoryIcon } from '../components/CategoryIcon';
import { NEWS_DATA } from '../data/news';
import { Channel } from '../types';
import { 
  Shield, 
  ExternalLink,
  Settings as SettingsIcon,
  Search,
  SlidersHorizontal,
  Compass,
  Layers
} from 'lucide-react';
import { FluentHomeIcon, FluentLiveTvIcon, FluentNewsIcon } from '../components/FluentIcons';
import { SequentialSection } from '../components/SequentialSection';
import { useSettings } from '../hooks/useSettings';
import { SpinningRing } from '../components/SpinningRing';

interface HomeProps {
  navigate: (route: string, state?: any) => void;
  onSelectChannel: (channel: Channel) => void;
  channels: Channel[];
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onOpenSpotlight?: () => void;
}

const APP_PAGES = [
  { id: 'page-home', title: 'Home', desc: 'Overview, trending & featured channels', route: '/', icon: FluentHomeIcon, keywords: 'home overview trending' },
  { id: 'page-livetv', title: 'Watch', desc: 'Watch live broadcasts from VTV, HTV, VTC, Local channels', route: '/live-tv', icon: FluentLiveTvIcon, keywords: 'watch live tv vtv htv vtc broadcasting' },
  { id: 'page-news', title: 'Update blogs', desc: 'Release notes, changelogs, broadcasting technology & articles', route: '/news', icon: FluentNewsIcon, keywords: 'update blogs articles news announcements updates changelogs' },
  { id: 'page-test', title: 'Test Channels', desc: 'Experimental feeds and test stream laboratory', route: '/test', icon: Compass, keywords: 'test channels lab developer' },
  { id: 'page-settings', title: 'Settings', desc: 'Customize theme, navigation bar, and keybinds', route: '/settings', icon: SettingsIcon, keywords: 'settings personalization font display' },
];

const SETTINGS_SHORTCUTS = [
  { id: 'set-font', title: 'Text Scaling & Typography', desc: 'Adjust font size scale from 78% to 124%', route: '/settings', keywords: 'font size zoom text scale' },
  { id: 'set-nav', title: 'Navigation Mode', desc: 'Switch between Top View, Side View, and Tab View', route: '/settings', keywords: 'navigation mode topbar sidebar floaty tab view' },
  { id: 'set-autohide', title: 'Auto-hide Side View', desc: 'Automatically collapse sidebar when watching content', route: '/settings', keywords: 'auto-hide sidebar collapse' },
  { id: 'set-motion', title: 'Motion & Movements', desc: 'Reduce animations or enable fluid transitions', route: '/settings', keywords: 'motion reduce animations movements' },
  { id: 'set-keybinds', title: 'Custom Keybinds', desc: 'Configure keyboard shortcuts for quick actions', route: '/settings', keywords: 'keybinds shortcuts keyboard alt' },
  { id: 'set-search-cats', title: 'Search Categories', desc: 'Choose which content types show in search', route: '/settings', keywords: 'search spotlight categories customize' },
];

export const Home: React.FC<HomeProps> = ({
  navigate,
  onSelectChannel,
  channels,
  searchQuery,
  onSearchChange,
  onOpenSpotlight
}) => {
  const { settings } = useSettings();
  const query = (searchQuery || '').trim().toLowerCase();

  // 3-second loading state on tab load before displaying channel cards
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Filter channels gracefully in-place when search query is active on Home tab
  const visibleChannels = useMemo(() => {
    if (!query) return channels;
    return channels.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.category.toLowerCase().includes(query) ||
        (c.channelNumber && String(c.channelNumber).includes(query)) ||
        (c.tags && c.tags.some((t) => t.toLowerCase().includes(query)))
    );
  }, [channels, query]);

  // Dynamic greeting based on time of day:
  // 5 AM - 12 PM: Good morning
  // 12 PM - 6 PM: Good afternoon
  // 6 PM - 5 AM: Good evening
  // month day day, year (e.g: October 16, 2016)
  const [currentDate, setCurrentDate] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const { greetingText, formattedDate } = useMemo(() => {
    const hour = currentDate.getHours();
    let timeGreeting = 'morning';
    if (hour >= 5 && hour < 12) {
      timeGreeting = 'morning';
    } else if (hour >= 12 && hour < 18) {
      timeGreeting = 'afternoon';
    } else {
      timeGreeting = 'evening';
    }

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const month = monthNames[currentDate.getMonth()];
    const day = currentDate.getDate();
    const year = currentDate.getFullYear();
    const formatted = `${month} ${day}, ${year}`;

    return {
      greetingText: `Good ${timeGreeting}`,
      formattedDate: formatted,
    };
  }, [currentDate]);

  return (
    <div className="space-y-4 sm:space-y-6 pb-16">
      {/* 1. 3D Coverflow Hero Banner (Section 0 - loads first) */}
      <SequentialSection order={0} enabled={settings.loadPagesSequentially}>
        <HeroCarousel
          navigate={navigate}
          onSelectChannel={onSelectChannel}
          channels={visibleChannels}
        />
      </SequentialSection>

      {/* Centered Greeting directly below banner cards: Good ... - <month day day, year> */}
      <div className="flex items-center justify-center text-center py-1 sm:py-2 px-4 select-none">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight text-black dark:text-white">
          {greetingText} - {formattedDate}
        </h2>
      </div>

      <div className="px-4 sm:px-6 md:px-8 max-w-7xl mx-auto space-y-8 sm:space-y-10">
        {/* 2. Đề xuất cho bạn (Section 1) */}
        <SequentialSection order={1} enabled={settings.loadPagesSequentially}>
          <OnAirSlider
            channels={visibleChannels}
            onSelectChannel={onSelectChannel}
            navigate={navigate}
          />
        </SequentialSection>

        {/* Thông báo dừng sản xuất & Lời cảm ơn VPlay (Section 2) */}
        <SequentialSection order={2} enabled={settings.loadPagesSequentially}>
          <FarewellAnnouncement />
        </SequentialSection>

        {/* 3. About Sparkle (Section 3) */}
        <SequentialSection order={3} enabled={settings.loadPagesSequentially}>
          <section id="home-about-section" className="space-y-8 pt-4 border-t border-[#26262E]">
            {/* Hero Intro */}
            <div className="text-center space-y-4 pt-2">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black dark:text-white tracking-tight">
                Sparkle -{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF2020] via-[#FF3366] to-[#E6005A]">
                  Bringing Vietnam to Your Screen
                </span>
              </h2>

              <div className="text-sm sm:text-base text-black dark:text-[#9CA3AF] max-w-3xl mx-auto leading-relaxed text-left space-y-3 pt-2">
                <p className="flex items-start gap-2">
                  <span className="text-[#E6005A] font-bold select-none">•</span>
                  <span>
                    Sparkle is a non-profit online television platform providing users with high-quality streaming experiences across diverse broadcast channels, completely free of charge.
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-[#E6005A] font-bold select-none">•</span>
                  <span>
                    In addition, Sparkle provides comprehensive updates on broadcasting technology, television branding & motion graphics, and media culture in Vietnam.
                  </span>
                </p>
              </div>
            </div>

            {/* Disclaimer and Ethics Card */}
            <div
              id="home-about-disclaimer-card"
              className="fluent-reveal-item setting-card p-5 sm:p-6 rounded-[8px] bg-white dark:bg-[#38383d] border border-[#e5e5e5] dark:border-[#48484e] shadow-xs space-y-2.5 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-[#4cc2ff] shrink-0" />
                <h3 id="about-disclaimer-title" className="text-base font-semibold text-black dark:text-white">
                  Copyright & Broadcast Source Disclaimer
                </h3>
              </div>
              <p id="about-disclaimer-text" className="text-xs sm:text-sm text-black dark:text-[#a1a1aa] leading-relaxed">
                All television logos, trademarks, studio images, and broadcast feeds are the intellectual property of their respective broadcasters (Vietnam Television VTV, Ho Chi Minh City Television HTV, VTC Digital Television, and local radio-television stations). Sparkle serves non-commercial, academic research, and technical archive purposes only.
              </p>
            </div>

            {/* Community Connect */}
            <div
              id="home-about-community-card"
              className="fluent-reveal-item setting-card text-center p-5 sm:p-6 rounded-[8px] bg-white dark:bg-[#38383d] border border-[#e5e5e5] dark:border-[#48484e] shadow-xs space-y-3.5 transition-colors"
            >
              <h3 className="text-base sm:text-lg font-semibold text-black dark:text-white">Join the Waves Community</h3>
              <p className="text-xs sm:text-sm text-black dark:text-[#a1a1aa] max-w-2xl mx-auto leading-relaxed">
                “Waves of Our Time” — connecting people from across all regions to meet, share, and discuss stories of our era. A space to preserve media memories, iconic broadcasts, and cultural milestones of television.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                <a
                  id="btn-home-join-discord"
                  href="https://discord.gg/wcdjaDDayK"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative flex items-center gap-2 px-5 py-2 rounded-[4px] bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs sm:text-[13px] font-medium transition-colors shadow-xs cursor-pointer active:scale-95"
                >
                  <svg className="w-4 h-4 fill-current text-white transition-colors" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.078.078 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                  <span>Join Waves on Discord</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-90 group-hover:opacity-100" />
                </a>
              </div>
            </div>
          </section>
        </SequentialSection>
      </div>
    </div>
  );
};
