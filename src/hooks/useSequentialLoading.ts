import { useState, useEffect, useRef } from 'react';
import { useSettings } from './useSettings';

export function useSequentialLoading(totalSections: number) {
  const { settings } = useSettings();
  const enabled = settings.loadPagesSequentially;
  const [visibleCount, setVisibleCount] = useState<number>(() => (enabled ? 1 : totalSections));
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled) {
      setVisibleCount(totalSections);
      return;
    }
    // Start with 1 section on mount
    setVisibleCount(1);
  }, [enabled, totalSections]);

  useEffect(() => {
    if (!enabled || visibleCount >= totalSections) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + 1, totalSections));
        }
      },
      { rootMargin: '250px 0px', threshold: 0.01 }
    );

    const el = sentinelRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [enabled, visibleCount, totalSections]);

  return {
    visibleCount,
    sentinelRef,
    isLoadingMore: enabled && visibleCount < totalSections,
    enabled,
  };
}
