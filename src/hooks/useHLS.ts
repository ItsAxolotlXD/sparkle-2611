import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';

export interface QualityLevel {
  id: number;
  height: number;
  bitrate: number;
  label: string;
}

export function useHLS(streamUrl: string, autoPlay: boolean = true) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [qualities, setQualities] = useState<QualityLevel[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1); // -1 = Auto
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  const cleanupHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);

  const initPlayer = useCallback(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    cleanupHls();
    setIsLoading(true);
    setError(null);
    setQualities([]);

    // Check for native HLS support (Safari iOS / macOS)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.load();
      if (autoPlay) {
        video.play().catch(() => {
          // Auto-play was prevented (often due to unmuted audio policy)
          video.muted = true;
          setIsMuted(true);
          video.play().catch((err) => {
            console.warn('Native video autoplay failed', err);
          });
        });
      }
      setIsLoading(false);
    } else if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 3,
        levelLoadingTimeOut: 10000,
        fragLoadingTimeOut: 20000
      });

      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        setIsLoading(false);
        const parsedQualities: QualityLevel[] = data.levels.map((level, idx) => ({
          id: idx,
          height: level.height,
          bitrate: level.bitrate,
          label: level.height ? `${level.height}p` : `${Math.round(level.bitrate / 1000)} kbps`
        }));
        setQualities(parsedQualities);

        if (autoPlay) {
          video.play().catch(() => {
            video.muted = true;
            setIsMuted(true);
            video.play().catch((e) => console.warn('HLS autoplay fallback muted failed', e));
          });
        }
      });

      hls.on(Hls.Events.BUFFER_APPENDED, () => {
        setIsBuffering(false);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn('HLS Network error encountered, attempting recovery...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn('HLS Media error encountered, recovering media error...');
              hls.recoverMediaError();
              break;
            default:
              console.error('Fatal HLS error', data);
              setError('Không thể kết nối hoặc giải mã luồng phát sóng này.');
              cleanupHls();
              break;
          }
        }
      });
    } else {
      setError('Trình duyệt của bạn không hỗ trợ phát sóng định dạng HLS/M3U8.');
      setIsLoading(false);
    }
  }, [streamUrl, autoPlay, cleanupHls]);

  useEffect(() => {
    initPlayer();
    return () => {
      cleanupHls();
    };
  }, [initPlayer, cleanupHls, retryCount]);

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleWaiting = () => setIsBuffering(true);
    const handlePlaying = () => {
      setIsBuffering(false);
      setIsLoading(false);
    };
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setDuration(video.duration || 0);
    };
    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };
    const handleError = () => {
      setError('Lỗi khi phát video từ máy chủ nguồn.');
      setIsLoading(false);
      setIsBuffering(false);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('error', handleError);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(console.warn);
    } else {
      video.pause();
    }
  };

  const changeVolume = (newVol: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = Math.max(0, Math.min(1, newVol));
    if (newVol > 0 && video.muted) {
      video.muted = false;
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const setQuality = (qualityLevelIndex: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = qualityLevelIndex;
      setCurrentQuality(qualityLevelIndex);
    }
  };

  const retry = () => {
    setError(null);
    setIsLoading(true);
    setRetryCount((prev) => prev + 1);
  };

  return {
    videoRef,
    isPlaying,
    isLoading,
    isBuffering,
    error,
    volume,
    isMuted,
    qualities,
    currentQuality,
    duration,
    currentTime,
    togglePlay,
    changeVolume,
    toggleMute,
    setQuality,
    retry
  };
}
