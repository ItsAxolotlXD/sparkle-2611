import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ANIMATED_BOOT_SCREEN_VIDEO_SRC, ANIMATED_BOOT_SCREEN_FALLBACK_URL } from '../constants/assets';

interface AnimatedBootScreenProps {
  onFinish: () => void;
  isClosable?: boolean;
}

export const AnimatedBootScreen: React.FC<AnimatedBootScreenProps> = ({
  onFinish,
  isClosable = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoSrc, setVideoSrc] = useState(ANIMATED_BOOT_SCREEN_VIDEO_SRC);
  const [isMuted, setIsMuted] = useState(false);
  const finishedRef = useRef(false);

  const complete = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinish();
  }, [onFinish]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isClosable && e.key === 'Escape') {
        complete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Attempt autoplay with audio first; if browser blocks unmuted audio, fallback to muted
    const playVideo = async () => {
      try {
        video.muted = false;
        await video.play();
        setIsMuted(false);
      } catch {
        try {
          video.muted = true;
          setIsMuted(true);
          await video.play();
        } catch {
          // Keep trying on user interaction
        }
      }
    };

    playVideo();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [complete, isClosable]);

  const handleVideoError = () => {
    // If primary local video fails, try remote fallback URL before giving up
    if (videoSrc !== ANIMATED_BOOT_SCREEN_FALLBACK_URL) {
      setVideoSrc(ANIMATED_BOOT_SCREEN_FALLBACK_URL);
    } else {
      complete();
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    // Ensure that once the video reaches its final frame, transition only then
    if (video.duration && video.currentTime >= video.duration - 0.08) {
      complete();
    }
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  return (
    <div
      id="animated-boot-screen"
      onClick={() => {
        // If clicking on screen while muted, try to unmute
        const video = videoRef.current;
        if (video && video.muted) {
          video.muted = false;
          setIsMuted(false);
        }
      }}
      className="fixed inset-0 z-[100000] bg-black flex items-center justify-center select-none overflow-hidden cursor-default"
    >
      <video
        ref={videoRef}
        key={videoSrc}
        src={videoSrc}
        referrerPolicy="no-referrer"
        playsInline
        autoPlay
        preload="auto"
        className="w-full h-full object-cover pointer-events-none"
        onEnded={complete}
        onTimeUpdate={handleTimeUpdate}
        onError={handleVideoError}
      />

      {/* Unmute hint if audio was blocked by browser autoplay policy */}
      {isMuted && (
        <button
          type="button"
          onClick={handleToggleMute}
          className="absolute bottom-6 left-6 z-20 px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white/90 text-xs font-medium transition-all duration-200 cursor-pointer border border-white/15 flex items-center gap-2"
        >
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>Nhấn để bật âm thanh</span>
        </button>
      )}

      {/* Watermark in bottom right corner */}
      <div
        id="boot-watermark"
        className="absolute bottom-4 right-5 sm:bottom-6 sm:right-7 z-20 text-right select-none pointer-events-none text-white/60 text-[11px] sm:text-[12px] leading-[1.35] font-normal"
        style={{ fontFamily: "'Segoe UI Variable Text', 'Segoe UI', system-ui, sans-serif" }}
      >
        <div>Sparkle 27M1 Insider Preview</div>
        <div>Evaluation copy. Build 26165.Moment 1 (2027)</div>
      </div>
    </div>
  );
};
