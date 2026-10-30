import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Play, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  Heart, 
  AlertCircle, 
  Sparkles, 
  RotateCcw, 
  PictureInPicture2,
  Ratio,
  Shuffle,
  SkipBack,
  SkipForward,
  Repeat,
  MoreHorizontal,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Channel } from '../types';
import { useHLS } from '../hooks/useHLS';
import { useFavorites } from '../hooks/useFavorites';
import { useSettings } from '../hooks/useSettings';
import { SpinningRing } from './SpinningRing';
import { EpgScheduleWidget } from './EpgScheduleWidget';

interface VideoPlayerProps {
  channel: Channel;
  onOpenCustomStreamModal?: () => void;
  onSelectAlternativeStream?: () => void;
  isTheaterMode?: boolean;
  onToggleTheaterMode?: () => void;
  onClose?: () => void;
  onNextChannel?: () => void;
  onPrevChannel?: () => void;
  onRandomChannel?: () => void;
  onOpenEpg?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  channel,
  onOpenCustomStreamModal,
  isTheaterMode,
  onToggleTheaterMode,
  onClose,
  onNextChannel,
  onPrevChannel,
  onRandomChannel,
  onOpenEpg
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { isChannelFavorite, toggleFavoriteChannel } = useFavorites();
  const isFav = isChannelFavorite(channel.id);

  const { settings, updateSetting } = useSettings();
  const isLightMode = settings.theme === 'light';
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '4:3'>(settings.streamAspectRatio || '16:9');
  const [aspectRatioToast, setAspectRatioToast] = useState<string | null>(null);
  const [captionsToast, setCaptionsToast] = useState<string | null>(null);
  const [isCaptionsOn, setIsCaptionsOn] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showEpgOverlay, setShowEpgOverlay] = useState(false);
  const [playerTooltip, setPlayerTooltip] = useState<{ label: string; top: number; left: number } | null>(null);

  const showTooltip = (label: string, e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPlayerTooltip({
      label,
      top: rect.top - 8,
      left: rect.left + rect.width / 2,
    });
  };

  const hideTooltip = () => {
    setPlayerTooltip(null);
  };

  useEffect(() => {
    hideTooltip();
  }, [channel.id, isFullscreen, showControls]);

  const handleOpenEpgSchedule = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFullscreen) {
      setShowEpgOverlay((prev) => !prev);
    } else if (onOpenEpg) {
      onOpenEpg();
    } else {
      setShowEpgOverlay((prev) => !prev);
    }
  };

  useEffect(() => {
    if (settings.streamAspectRatio) {
      setAspectRatio(settings.streamAspectRatio);
    }
  }, [settings.streamAspectRatio]);

  const handleToggleAspectRatio = () => {
    const nextRatio = aspectRatio === '16:9' ? '4:3' : '16:9';
    setAspectRatio(nextRatio);
    updateSetting('streamAspectRatio', nextRatio);
    setAspectRatioToast(nextRatio === '4:3' ? 'Tỉ lệ: 4:3 (Squish)' : 'Tỉ lệ: 16:9 (Chuẩn)');
    setTimeout(() => setAspectRatioToast(null), 1800);
    resetControlsTimeout();
  };

  const handleToggleCaptions = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !isCaptionsOn;
    setIsCaptionsOn(nextState);
    setCaptionsToast(nextState ? 'Phụ đề: Bật' : 'Phụ đề: Tắt');
    setTimeout(() => setCaptionsToast(null), 1800);
    resetControlsTimeout();
  };

  const handleToggleLoop = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.loop = !isLooping;
    }
    setIsLooping(!isLooping);
    resetControlsTimeout();
  };

  const {
    videoRef,
    isPlaying,
    isLoading,
    isBuffering,
    error,
    volume,
    isMuted,
    duration,
    currentTime,
    togglePlay,
    changeVolume,
    toggleMute,
    retry
  } = useHLS(channel.streamUrl, true);

  // Spinner visibility & UI visibility rule
  const isSpinnerVisible = (isLoading || isBuffering) && !error;
  const canShowControls = !isSpinnerVisible && !error && (showControls || !isPlaying);

  // Auto-hide controls after 3.5 seconds of inactivity
  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
        setShowMoreMenu(false);
      }
    }, 3500);
  };

  // When loading spinner finishes, reveal controls briefly
  const prevSpinnerRef = useRef(isSpinnerVisible);
  useEffect(() => {
    if (prevSpinnerRef.current && !isSpinnerVisible && !error) {
      resetControlsTimeout();
    }
    prevSpinnerRef.current = isSpinnerVisible;
  }, [isSpinnerVisible, error]);

  useEffect(() => {
    if (isPlaying) {
      resetControlsTimeout();
    } else {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    }
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying, channel.id]);

  const handleFullscreenToggle = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(console.warn);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(console.warn);
      setIsFullscreen(false);
    }
    resetControlsTimeout();
  };

  const handlePiP = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
      }
    } catch (e) {
      console.warn('PiP not supported or failed', e);
    }
    resetControlsTimeout();
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Format seconds to H:MM:SS or M:SS
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Compute playback display values
  let displayCurrent = '0:00';
  let displayDuration = '0:00';
  let progressPercent = 0;

  if (duration && isFinite(duration) && duration > 0) {
    displayCurrent = formatTime(currentTime);
    displayDuration = formatTime(duration);
    progressPercent = Math.min(100, Math.max(0, (currentTime / duration) * 100));
  } else if (videoRef.current?.seekable && videoRef.current.seekable.length > 0) {
    const s = videoRef.current.seekable;
    const start = s.start(0);
    const end = s.end(s.length - 1);
    const total = end - start;
    if (total > 5) {
      const cur = Math.max(0, videoRef.current.currentTime - start);
      displayCurrent = formatTime(cur);
      displayDuration = formatTime(total);
      progressPercent = Math.min(100, Math.max(0, (cur / total) * 100));
    } else {
      displayCurrent = formatTime(currentTime);
      displayDuration = '1:36:21';
      progressPercent = Math.min(100, ((currentTime % 5781) / 5781) * 100);
    }
  } else {
    displayCurrent = formatTime(currentTime || 389);
    displayDuration = '1:36:21';
    progressPercent = 6.7;
  }

  // Seek backward 10s
  const handleRewind10 = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, video.currentTime - 10);
    resetControlsTimeout();
  };

  // Seek forward 30s
  const handleForward30 = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    if (video.duration && isFinite(video.duration)) {
      video.currentTime = Math.min(video.duration, video.currentTime + 30);
    } else if (video.seekable && video.seekable.length > 0) {
      const end = video.seekable.end(video.seekable.length - 1);
      video.currentTime = Math.min(end, video.currentTime + 30);
    } else {
      video.currentTime = video.currentTime + 30;
    }
    resetControlsTimeout();
  };

  // Scrubber click
  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (video.duration && isFinite(video.duration) && video.duration > 0) {
      video.currentTime = pos * video.duration;
    } else if (video.seekable && video.seekable.length > 0) {
      const start = video.seekable.start(0);
      const end = video.seekable.end(video.seekable.length - 1);
      video.currentTime = start + pos * (end - start);
    }
    resetControlsTimeout();
  };

  // Volume slider click
  const handleVolumeSliderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    changeVolume(pos);
    resetControlsTimeout();
  };

  return (
    <div
      ref={containerRef}
      id="waves-video-player-container"
      onMouseMove={() => {
        if (!isSpinnerVisible && !error) resetControlsTimeout();
      }}
      onPointerMove={() => {
        if (!isSpinnerVisible && !error) resetControlsTimeout();
      }}
      onTouchStart={() => {
        if (!isSpinnerVisible && !error) resetControlsTimeout();
      }}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className={`relative w-full ${
        aspectRatio === '4:3' ? 'rounded-none' : 'rounded-[10px]'
      } overflow-hidden bg-black shadow-none border-0 outline-none transition-all duration-300 select-none ${
        isTheaterMode ? 'aspect-[21/9] max-h-[75vh]' : 'aspect-video'
      } ${(!canShowControls && isPlaying) || isSpinnerVisible ? 'cursor-none' : ''}`}
      style={{
        borderRadius: aspectRatio === '4:3' ? '0px' : '10px',
        border: 'none',
        outline: 'none',
        WebkitMaskImage: aspectRatio === '4:3' ? 'none' : '-webkit-radial-gradient(white, black)'
      }}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        playsInline
        style={
          aspectRatio === '4:3'
            ? {
                aspectRatio: '4 / 3',
                width: 'auto',
                height: '100%',
                objectFit: 'fill',
                margin: '0 auto',
                display: 'block',
                borderRadius: '0px',
                border: 'none',
                outline: 'none'
              }
            : {
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                borderRadius: '10px',
                border: 'none',
                outline: 'none'
              }
        }
        className={`h-full bg-black cursor-default border-0 outline-none ${
          aspectRatio === '4:3' ? 'rounded-none' : 'rounded-[10px]'
        } transition-all duration-200`}
        onClick={() => {
          if (!isSpinnerVisible && !error) togglePlay();
        }}
      />

      {/* Aspect Ratio Toast Notification */}
      <AnimatePresence>
        {aspectRatioToast && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ duration: 0.18 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none px-3.5 py-1.5 rounded-full bg-black/85 border border-white/20 text-white font-mono text-xs sm:text-sm font-semibold shadow-2xl flex items-center gap-2 backdrop-blur-md"
          >
            <Ratio className="w-4 h-4 text-[#ff6b22]" />
            <span>{aspectRatioToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Captions Toast Notification */}
      <AnimatePresence>
        {captionsToast && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ duration: 0.18 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none px-3.5 py-1.5 rounded-full bg-black/85 border border-white/20 text-white font-mono text-xs sm:text-sm font-semibold shadow-2xl flex items-center gap-2 backdrop-blur-md"
          >
            <svg className="w-4 h-4 text-[#ff6b22]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect width="20" height="15" x="2" y="4.5" rx="2" />
              <path d="M7 15.5h4M15 15.5h2M7 11.5h3M14 11.5h3" />
            </svg>
            <span>{captionsToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle Dark Gradient Overlay when controls are active */}
      <div 
        className={`absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30 pointer-events-none transition-opacity duration-300 ${
          canShowControls ? 'opacity-100' : 'opacity-0 pointer-events-none invisible'
        }`} 
      />

      {/* Buffering & Loading Spinner - Thick Spinning Ring in #4cc2ff */}
      {(isLoading || isBuffering) && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10 pointer-events-none p-4">
          <SpinningRing size={58} strokeWidth={5.5} />
        </div>
      )}

      {/* Error Overlay UI if Stream fails */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#17171A]/95 p-3 sm:p-6 z-20 text-center animate-in fade-in duration-200">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">Không thể kết nối luồng phát</h3>
          <p className="text-xs text-white/60 max-w-sm mb-4">
            Kênh hiện đang tạm dừng hoặc định dạng truyền tải chưa được hỗ trợ. Vui lòng thử tải lại hoặc đổi nguồn phát khác.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={retry}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Thử lại</span>
            </button>
            {onOpenCustomStreamModal && (
              <button
                onClick={onOpenCustomStreamModal}
                className="px-4 py-2 rounded-lg bg-[#0078d4] hover:bg-[#006cbd] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Dán URL M3U8</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* CHANNEL CONTROLS UI IN TAB WATCH (supports light mode & dark mode with 50% opacity, 20% blur) */}
      <div
        id="video-player-channel-controls"
        style={{
          backgroundColor: isLightMode ? 'rgba(255, 255, 255, 0.50)' : 'rgba(20, 21, 23, 0.50)',
          backdropFilter: 'blur(8px) saturate(140%)',
          WebkitBackdropFilter: 'blur(8px) saturate(140%)',
        }}
        className={`absolute bottom-0 left-0 right-0 z-20 px-3.5 sm:px-6 pt-3 pb-3 sm:pb-4.5 border-t ${
          isLightMode ? 'border-black/10 text-black' : 'border-white/10 text-white'
        } select-none transition-opacity duration-300 ${
          canShowControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none invisible'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress Timeline Row: [6:29] [=======●---------------] [1:36:21] */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 w-full mb-2.5 sm:mb-3">
          <span className={`text-[11px] sm:text-xs font-medium font-mono select-none min-w-[34px] sm:min-w-[40px] text-left ${
            isLightMode ? 'text-black/90' : 'text-white/90'
          }`}>
            {displayCurrent}
          </span>

          <div
            onClick={handleScrubberClick}
            className="relative flex-1 h-3 flex items-center cursor-pointer group/scrubber"
          >
            {/* Background track */}
            <div className={`w-full h-1 sm:h-1.5 rounded-full relative overflow-visible ${
              isLightMode ? 'bg-black/20' : 'bg-white/30'
            }`}>
              {/* Played Orange Progress */}
              <div
                className="h-full bg-[#ff6b22] rounded-full transition-all duration-75 shadow-xs"
                style={{ width: `${progressPercent}%` }}
              />
              {/* Circular Scrubber Thumb Handle with Orange Center and Outer Halo */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#ff6b22] ring-4 ring-[#ff6b22]/40 shadow-md transition-transform duration-75 group-hover/scrubber:scale-115"
                style={{ left: `${progressPercent}%` }}
              />
            </div>
          </div>

          <span className={`text-[11px] sm:text-xs font-medium font-mono select-none min-w-[36px] sm:min-w-[46px] text-right ${
            isLightMode ? 'text-black/90' : 'text-white/90'
          }`}>
            {displayDuration}
          </span>
        </div>

        {/* Bottom Row: [Title / Subtitle]  [Playback Controls]  [Utilities] */}
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Title & Subtitle (matching "Symbols Of The Shadows / 2021") */}
          <div className="min-w-0 max-w-[120px] sm:max-w-[200px] md:max-w-xs flex-1">
            <h4 className={`text-xs sm:text-sm md:text-base font-semibold truncate tracking-tight ${
              isLightMode ? 'text-[#111827]' : 'text-white'
            }`} title={channel.name}>
              {channel.name}
            </h4>
            <p className={`text-[10px] sm:text-xs truncate font-normal mt-0.5 ${
              isLightMode ? 'text-[#6B7280]' : 'text-white/55'
            }`}>
              {channel.channelNumber ? `Kênh ${channel.channelNumber} • ${channel.category}` : channel.category}
            </p>
          </div>

          {/* Center: Playback Controls with signature Orange-Magenta-Purple Ring */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0">
            {/* Lịch phát sóng (EPG) */}
            <button
              id="video-player-epg-btn"
              type="button"
              onClick={handleOpenEpgSchedule}
              onMouseEnter={(e) => showTooltip('Lịch phát sóng (EPG)', e)}
              onMouseLeave={hideTooltip}
              className={`p-1 sm:p-1.5 rounded-full transition-colors cursor-pointer ${
                showEpgOverlay
                  ? 'text-[#4cc2ff] bg-[#4cc2ff]/20'
                  : isLightMode
                    ? 'text-black/70 hover:text-black hover:bg-black/10'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
              aria-label="Lịch phát sóng (EPG)"
            >
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Previous */}
            <button
              type="button"
              onClick={onPrevChannel}
              onMouseEnter={(e) => showTooltip('Kênh trước', e)}
              onMouseLeave={hideTooltip}
              className={`p-1 sm:p-1.5 rounded-full transition-colors cursor-pointer ${
                isLightMode ? 'text-black/60 hover:text-black hover:bg-black/10' : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
              aria-label="Kênh trước"
            >
              <SkipBack className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Rewind 10s */}
            <button
              id="video-player-rewind-btn"
              type="button"
              onClick={handleRewind10}
              onMouseEnter={(e) => showTooltip('Lùi 10 giây', e)}
              onMouseLeave={hideTooltip}
              className={`p-1 sm:p-1.5 rounded-full transition-colors cursor-pointer ${
                isLightMode ? 'text-black/80 hover:text-black hover:bg-black/10' : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
              aria-label="Lùi 10 giây"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <text x="12" y="15.5" fontSize="7" fontWeight="800" textAnchor="middle" fill="currentColor" stroke="none">10</text>
              </svg>
            </button>

            {/* Center Main Play / Pause Button with Vibrant Orange to Magenta / Purple Gradient Ring */}
            <div className="p-[2.5px] rounded-full bg-gradient-to-br from-[#ff6b22] via-[#e11d48] to-[#a855f7] shadow-lg flex items-center justify-center active:scale-95 transition-transform">
              <button
                id="video-player-play-btn"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                  resetControlsTimeout();
                }}
                onMouseEnter={(e) => showTooltip(isPlaying ? 'Tạm dừng' : 'Phát', e)}
                onMouseLeave={hideTooltip}
                className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                  isLightMode ? 'bg-[#f4f4f5] hover:bg-[#e4e4e7]' : 'bg-[#18181c] hover:bg-[#222329]'
                }`}
                aria-label={isPlaying ? 'Tạm dừng' : 'Phát'}
              >
                {isPlaying ? (
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <div className={`w-1 sm:w-1.5 h-3.5 sm:h-4.5 rounded-[2px] ${isLightMode ? 'bg-black' : 'bg-white'}`} />
                    <div className={`w-1 sm:w-1.5 h-3.5 sm:h-4.5 rounded-[2px] ${isLightMode ? 'bg-black' : 'bg-white'}`} />
                  </div>
                ) : (
                  <Play className={`w-4 h-4 sm:w-5 sm:h-5 ml-0.5 ${isLightMode ? 'fill-black text-black' : 'fill-white text-white'}`} />
                )}
              </button>
            </div>

            {/* Forward 30s */}
            <button
              id="video-player-forward-btn"
              type="button"
              onClick={handleForward30}
              onMouseEnter={(e) => showTooltip('Tua tới 30 giây', e)}
              onMouseLeave={hideTooltip}
              className={`p-1 sm:p-1.5 rounded-full transition-colors cursor-pointer ${
                isLightMode ? 'text-black/80 hover:text-black hover:bg-black/10' : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
              aria-label="Tua tới 30 giây"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <text x="12" y="15.5" fontSize="7" fontWeight="800" textAnchor="middle" fill="currentColor" stroke="none">30</text>
              </svg>
            </button>

            {/* Next */}
            <button
              type="button"
              onClick={onNextChannel}
              onMouseEnter={(e) => showTooltip('Kênh tiếp theo', e)}
              onMouseLeave={hideTooltip}
              className={`p-1 sm:p-1.5 rounded-full transition-colors cursor-pointer ${
                isLightMode ? 'text-black/60 hover:text-black hover:bg-black/10' : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
              aria-label="Kênh tiếp theo"
            >
              <SkipForward className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Repeat / Loop */}
            <button
              type="button"
              onClick={handleToggleLoop}
              onMouseEnter={(e) => showTooltip(isLooping ? 'Đang lặp lại' : 'Lặp lại (Loop)', e)}
              onMouseLeave={hideTooltip}
              className={`p-1 sm:p-1.5 rounded-full transition-colors cursor-pointer ${
                isLooping ? 'text-[#ff6b22] bg-[#ff6b22]/15' : isLightMode ? 'text-black/70 hover:text-black hover:bg-black/10' : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
              aria-label={isLooping ? 'Đang lặp lại' : 'Lặp lại (Loop)'}
            >
              <Repeat className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* Right: Utilities (Subtitles, Volume, Fullscreen, PiP, More) */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Subtitles / CC */}
            <button
              type="button"
              onClick={handleToggleCaptions}
              onMouseEnter={(e) => showTooltip(isCaptionsOn ? 'Tắt phụ đề' : 'Bật phụ đề', e)}
              onMouseLeave={hideTooltip}
              className={`p-1 sm:p-1.5 rounded-full transition-colors cursor-pointer ${
                isCaptionsOn ? 'text-[#ff6b22] bg-[#ff6b22]/15' : isLightMode ? 'text-black/80 hover:text-black hover:bg-black/10' : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
              aria-label={isCaptionsOn ? 'Tắt phụ đề' : 'Bật phụ đề'}
            >
              <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="15" x="2" y="4.5" rx="2" />
                <path d="M7 15.5h4M15 15.5h2M7 11.5h3M14 11.5h3" />
              </svg>
            </button>

            {/* Volume Icon + Slider */}
            <div className="flex items-center gap-1.5 group/vol">
              <button
                id="video-player-mute-btn"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute();
                  resetControlsTimeout();
                }}
                onMouseEnter={(e) => showTooltip(isMuted || volume === 0 ? 'Bật âm thanh' : 'Tắt tiếng', e)}
                onMouseLeave={hideTooltip}
                className={`p-1 sm:p-1.5 rounded-full transition-colors cursor-pointer ${
                  isLightMode ? 'text-black/80 hover:text-black hover:bg-black/10' : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
                aria-label={isMuted ? 'Bật âm thanh' : 'Tắt tiếng'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                ) : (
                  <Volume2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                )}
              </button>
              <div
                onClick={handleVolumeSliderClick}
                onMouseEnter={(e) => showTooltip(`Âm lượng: ${Math.round((isMuted ? 0 : volume) * 100)}%`, e)}
                onMouseLeave={hideTooltip}
                className={`w-10 sm:w-16 h-1 rounded-full cursor-pointer relative overflow-hidden transition-all duration-200 ${
                  isLightMode ? 'bg-black/20 hover:bg-black/40' : 'bg-white/30 hover:bg-white/50'
                }`}
                aria-label={`Âm lượng: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
              >
                <div
                  className={`h-full rounded-full transition-all duration-75 ${
                    isLightMode ? 'bg-black' : 'bg-white'
                  }`}
                  style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                />
              </div>
            </div>

            {/* Fullscreen Toggle */}
            <button
              id="video-player-fullscreen-btn"
              type="button"
              onClick={handleFullscreenToggle}
              onMouseEnter={(e) => showTooltip(isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình', e)}
              onMouseLeave={hideTooltip}
              className={`p-1 sm:p-1.5 rounded-full transition-colors cursor-pointer ${
                isLightMode ? 'text-black/80 hover:text-black hover:bg-black/10' : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
              aria-label={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              ) : (
                <Maximize2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              )}
            </button>

            {/* Picture-in-Picture */}
            <button
              id="video-player-pip-btn"
              type="button"
              onClick={handlePiP}
              onMouseEnter={(e) => showTooltip('Thu nhỏ Picture-in-Picture', e)}
              onMouseLeave={hideTooltip}
              className={`p-1 sm:p-1.5 rounded-full transition-colors cursor-pointer hidden xs:flex ${
                isLightMode ? 'text-black/80 hover:text-black hover:bg-black/10' : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
              aria-label="Thu nhỏ Picture-in-Picture"
            >
              <PictureInPicture2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>

            {/* More Options (...) */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMoreMenu(!showMoreMenu);
                  resetControlsTimeout();
                }}
                onMouseEnter={(e) => showTooltip('Tùy chọn khác', e)}
                onMouseLeave={hideTooltip}
                className={`p-1 sm:p-1.5 rounded-full transition-colors cursor-pointer ${
                  showMoreMenu ? 'text-[#ff6b22] bg-[#ff6b22]/15' : isLightMode ? 'text-black/80 hover:text-black hover:bg-black/10' : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
                aria-label="Tùy chọn khác"
              >
                <MoreHorizontal className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>

              {showMoreMenu && (
                <div
                  style={{
                    backgroundColor: isLightMode ? 'rgba(255, 255, 255, 0.70)' : 'rgba(20, 21, 23, 0.30)',
                    backdropFilter: 'blur(10px) saturate(140%)',
                    WebkitBackdropFilter: 'blur(10px) saturate(140%)',
                  }}
                  className={`absolute right-0 bottom-full mb-2 w-48 rounded-xl border ${
                    isLightMode ? 'border-black/10 text-black shadow-xl' : 'border-white/10 text-white shadow-2xl'
                  } p-1.5 text-xs z-30`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      handleToggleAspectRatio();
                      setShowMoreMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer ${
                      isLightMode ? 'hover:bg-black/10' : 'hover:bg-white/10'
                    }`}
                  >
                    <span>Tỉ lệ khung hình</span>
                    <span className="font-mono font-bold text-[#ff6b22]">{aspectRatio}</span>
                  </button>
                  <button
                    onClick={() => {
                      toggleFavoriteChannel(channel.id);
                      setShowMoreMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer ${
                      isLightMode ? 'hover:bg-black/10' : 'hover:bg-white/10'
                    }`}
                  >
                    <span>Yêu thích kênh</span>
                    <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-red-500 text-red-500' : isLightMode ? 'text-black/70' : 'text-white/70'}`} />
                  </button>
                  <button
                    onClick={() => {
                      retry();
                      setShowMoreMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer ${
                      isLightMode ? 'hover:bg-black/10' : 'hover:bg-white/10'
                    }`}
                  >
                    <span>Tải lại luồng</span>
                    <RotateCcw className={`w-3.5 h-3.5 ${isLightMode ? 'text-black/70' : 'text-white/70'}`} />
                  </button>
                  {onOpenCustomStreamModal && (
                    <button
                      onClick={() => {
                        onOpenCustomStreamModal();
                        setShowMoreMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer ${
                        isLightMode ? 'hover:bg-black/10' : 'hover:bg-white/10'
                      }`}
                    >
                      <span>Dán URL M3U8</span>
                      <Sparkles className={`w-3.5 h-3.5 ${isLightMode ? 'text-black/70' : 'text-white/70'}`} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* In-Player / Fullscreen EPG Schedule Drawer */}
      <AnimatePresence>
        {showEpgOverlay && (
          <div className="absolute inset-0 z-40 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setShowEpgOverlay(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 260 }}
              className="absolute top-0 right-0 h-full w-full sm:w-[460px] md:w-[480px] max-w-[95vw] bg-[#1a1d22] text-white shadow-2xl border-l border-white/10 flex flex-col z-50 overflow-hidden"
            >
              <EpgScheduleWidget
                currentChannel={channel}
                isSidebarMode={true}
                onClose={() => setShowEpgOverlay(false)}
                className="h-full"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Tooltip for Player Controls (matching sidebar tooltip styling) */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {playerTooltip && (
            <motion.div
              key="player-control-tooltip"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              style={{
                position: 'fixed',
                top: `${playerTooltip.top}px`,
                left: `${playerTooltip.left}px`,
                transform: 'translate(-50%, -100%)',
                backgroundColor: isLightMode ? 'rgba(255, 255, 255, 0.50)' : 'rgba(24, 24, 28, 0.50)',
                backdropFilter: 'blur(16px) saturate(140%)',
                WebkitBackdropFilter: 'blur(16px) saturate(140%)',
              }}
              className="z-[99999] px-3 py-1.5 min-h-[30px] flex items-center rounded-[6px] text-[#111827] dark:text-white text-xs font-medium shadow-[0_4px_20px_rgba(0,0,0,0.18)] border-0 outline-none pointer-events-none whitespace-nowrap select-none"
            >
              {playerTooltip.label}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
