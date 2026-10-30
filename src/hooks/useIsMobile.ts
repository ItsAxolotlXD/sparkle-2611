import { useState, useEffect } from 'react';

export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < breakpoint;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateMatch = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    updateMatch();
    window.addEventListener('resize', updateMatch);
    return () => window.removeEventListener('resize', updateMatch);
  }, [breakpoint]);

  return isMobile;
}
