import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera as CameraIcon, 
  RotateCw, 
  Timer, 
  Grid3X3, 
  Sparkles, 
  Folder, 
  Check, 
  Volume2, 
  VolumeX, 
  Maximize, 
  RefreshCw,
  Image as ImageIcon,
  AlertCircle,
  ShieldAlert,
  Download,
  Video
} from 'lucide-react';
import { galleryDB, GalleryMediaItem, GalleryFolder } from '../services/galleryStorage';
import { useSettings } from '../hooks/useSettings';
import { showAppToast } from '../utils/toast';
import { CAMERA_ICON_URL } from '../components/FluentIcons';

interface CameraProps {
  navigate: (route: string, state?: any) => void;
}

type AspectRatio = '16:9' | '4:3' | '1:1';
type GridMode = 'off' | 'rule_of_thirds' | 'golden_ratio';
type CameraFilter = 'none' | 'vivid' | 'mono' | 'warm' | 'cool' | 'vintage' | 'cyberpunk';

const FILTER_STYLES: Record<CameraFilter, { name: string; css: string }> = {
  none: { name: 'Tự nhiên', css: 'none' },
  vivid: { name: 'Sống động', css: 'saturate(1.4) contrast(1.1)' },
  mono: { name: 'Đơn sắc', css: 'grayscale(1) contrast(1.15)' },
  warm: { name: 'Ấm áp', css: 'sepia(0.25) saturate(1.2) hue-rotate(-10deg)' },
  cool: { name: 'Mát mẻ', css: 'saturate(1.1) hue-rotate(15deg) brightness(1.05)' },
  vintage: { name: 'Cổ điển', css: 'sepia(0.4) contrast(0.9) brightness(1.05)' },
  cyberpunk: { name: 'Cyberpunk', css: 'hue-rotate(180deg) saturate(1.6) contrast(1.2)' }
};

export const Camera: React.FC<CameraProps> = ({ navigate }) => {
  const { settings } = useSettings();
  const isLightMode = settings.theme === 'light';

  // 1. Hardware / MediaStream State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [permissionError, setPermissionError] = useState<'denied' | 'not_found' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string>('');

  // 2. Camera Controls & Modes
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [gridMode, setGridMode] = useState<GridMode>('rule_of_thirds');
  const [timerSeconds, setTimerSeconds] = useState<number>(0); // 0 = off, 3, 5, 10
  const [activeFilter, setActiveFilter] = useState<CameraFilter>('none');
  const [isShutterSoundOn, setIsShutterSoundOn] = useState(true);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdownValue, setCountdownValue] = useState<number>(0);
  const [isFlashing, setIsFlashing] = useState(false);
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);

  // 3. Captured photo state & Camera Rolls folder
  const [recentCapture, setRecentCapture] = useState<GalleryMediaItem | null>(null);
  const [cameraRollFolder, setCameraRollFolder] = useState<GalleryFolder | null>(null);

  // Web Audio Context for Shutter Sound
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // Play realistic synthesized camera shutter sound
  const playShutterSound = useCallback(() => {
    if (!isShutterSoundOn) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Click 1: High frequency tick
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(1400, now);
      osc1.frequency.exponentialRampToValueAtTime(120, now + 0.045);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.045);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.05);

      // Click 2: Mechanical curtain release
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(800, now + 0.05);
      osc2.frequency.exponentialRampToValueAtTime(80, now + 0.12);
      gain2.gain.setValueAtTime(0.25, now + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.13);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.05);
      osc2.stop(now + 0.14);
    } catch (e) {
      console.warn('Audio playback error', e);
    }
  }, [getAudioContext, isShutterSoundOn]);

  // Play countdown beep
  const playCountdownBeep = useCallback((isFinal = false) => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isFinal ? 1200 : 750, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + (isFinal ? 0.25 : 0.1));
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + (isFinal ? 0.26 : 0.11));
    } catch {}
  }, [getAudioContext]);

  // Find or create "Camera Rolls" folder on mount
  useEffect(() => {
    let isCancelled = false;
    const initFolder = async () => {
      try {
        const folders = await galleryDB.getFolders();
        let roll = folders.find(
          (f) => f.name.toLowerCase() === 'camera rolls' || f.name.toLowerCase() === 'camera roll'
        );
        if (!roll) {
          roll = await galleryDB.createFolder('Camera Rolls');
        }
        if (!isCancelled) {
          setCameraRollFolder(roll);
        }

        const allItems = await galleryDB.getAll();
        const rollItems = allItems.filter((it) => it.folderId === roll?.id);
        if (rollItems.length > 0 && !isCancelled) {
          setRecentCapture(rollItems[0]);
        }
      } catch (e) {
        console.error('Failed to init Camera Rolls folder', e);
      }
    };

    initFolder();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Enumerate connected cameras
  const enumerateDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      setAvailableDevices(videoInputs);
    } catch (e) {
      console.warn('Failed to enumerate devices:', e);
    }
  }, []);

  // Stop camera tracks helper
  const stopCurrentStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreamActive(false);
  }, []);

  // Request actual camera stream from the device
  const startCamera = useCallback(async (forcedDeviceId?: string) => {
    stopCurrentStream();
    setIsRequestingPermission(true);
    setPermissionError(null);
    setErrorMessage('');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsRequestingPermission(false);
      setPermissionError('error');
      setErrorMessage('Trình duyệt hiện tại không hỗ trợ Web Camera API (getUserMedia).');
      return;
    }

    try {
      const deviceIdToUse = forcedDeviceId !== undefined ? forcedDeviceId : activeDeviceId;
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: deviceIdToUse
          ? {
              deviceId: { exact: deviceIdToUse },
              width: { ideal: 1920, min: 640 },
              height: { ideal: 1080, min: 480 }
            }
          : {
              facingMode: facingMode,
              width: { ideal: 1920, min: 640 },
              height: { ideal: 1080, min: 480 }
            }
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err: any) {
        // Fallback: If 1080p ideal fails, try generic video constraint
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(console.error);
        };
      }

      setIsStreamActive(true);
      setPermissionError(null);
      await enumerateDevices();
    } catch (err: any) {
      console.error('Lỗi khi truy cập camera thiết bị:', err);
      setIsStreamActive(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionError('denied');
        setErrorMessage('Quyền truy cập máy ảnh đã bị từ chối. Hãy nhấn "Cho phép" trên thông báo trình duyệt.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setPermissionError('not_found');
        setErrorMessage('Không tìm thấy thiết bị máy ảnh nào kết nối với thiết bị.');
      } else {
        setPermissionError('error');
        setErrorMessage(err.message || 'Không thể khởi động camera của thiết bị.');
      }
    } finally {
      setIsRequestingPermission(false);
    }
  }, [activeDeviceId, enumerateDevices, facingMode, stopCurrentStream]);

  // Start real device camera on mount or when facingMode changes
  useEffect(() => {
    startCamera();
    return () => {
      stopCurrentStream();
    };
  }, [facingMode]);

  // Focus tap effect
  const handleViewfinderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setFocusPoint({ x, y });
    setTimeout(() => {
      setFocusPoint(null);
    }, 1200);
  };

  // Perform the capture and save to Gallery -> Camera Rolls folder
  const executeCapture = async () => {
    if (!videoRef.current || !isStreamActive) {
      showAppToast('Máy ảnh chưa sẵn sàng');
      return;
    }

    setIsFlashing(true);
    playShutterSound();
    setTimeout(() => setIsFlashing(false), 160);

    try {
      const v = videoRef.current;
      const vWidth = v.videoWidth || 1920;
      const vHeight = v.videoHeight || 1080;

      // Determine dimensions based on chosen aspect ratio
      let cropW = vWidth;
      let cropH = vHeight;

      if (aspectRatio === '1:1') {
        cropW = Math.min(vWidth, vHeight);
        cropH = cropW;
      } else if (aspectRatio === '4:3') {
        cropW = (vHeight * 4) / 3;
        cropH = vHeight;
        if (cropW > vWidth) {
          cropW = vWidth;
          cropH = (vWidth * 3) / 4;
        }
      }

      const cropX = (vWidth - cropW) / 2;
      const cropY = (vHeight - cropH) / 2;

      const offscreen = document.createElement('canvas');
      offscreen.width = cropW;
      offscreen.height = cropH;
      const ctx = offscreen.getContext('2d');
      if (!ctx) return;

      // Apply active filter CSS to 2D context
      if (activeFilter !== 'none') {
        ctx.filter = FILTER_STYLES[activeFilter].css;
      }

      // Mirror front-facing camera
      if (facingMode === 'user') {
        ctx.translate(cropW, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(v, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
      ctx.filter = 'none';

      // Generate JPEG Blob and Data URL
      const dataUrl = offscreen.toDataURL('image/jpeg', 0.95);
      const blob: Blob = await new Promise((resolve) => {
        offscreen.toBlob((b) => resolve(b || new Blob()), 'image/jpeg', 0.95);
      });

      // Ensure "Camera Rolls" folder exists
      let targetFolder = cameraRollFolder;
      if (!targetFolder) {
        const folders = await galleryDB.getFolders();
        let found = folders.find(
          (f) => f.name.toLowerCase() === 'camera rolls' || f.name.toLowerCase() === 'camera roll'
        );
        if (!found) {
          found = await galleryDB.createFolder('Camera Rolls');
        }
        targetFolder = found;
        setCameraRollFolder(found);
      }

      // Create standard Windows Camera filename: WIN_YYYYMMDD_HHMMSS_Pro.jpg
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
      const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      const fileName = `WIN_${dateStr}_${timeStr}_Pro.jpg`;

      const newItem: GalleryMediaItem = {
        id: `camera-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: fileName,
        type: 'image',
        url: dataUrl,
        blobData: blob,
        thumbnailUrl: dataUrl,
        mimeType: 'image/jpeg',
        size: blob.size,
        dateAdded: now.toISOString(),
        dateLabel: now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        year: now.getFullYear(),
        dimensions: { width: cropW, height: cropH },
        aspectRatio: cropW / cropH,
        isFavorite: false,
        tags: ['Camera', 'Camera Rolls', 'Ảnh chụp thực tế', activeFilter !== 'none' ? FILTER_STYLES[activeFilter].name : 'Tự nhiên'],
        description: `Được chụp bằng Camera thực tế (${cropW}x${cropH}).`,
        source: 'upload',
        folderId: targetFolder ? targetFolder.id : null
      };

      // Save to Gallery IndexedDB
      await galleryDB.add(newItem);
      setRecentCapture(newItem);
      showAppToast(`Đã lưu ảnh vào mục "Camera Rolls" trong Gallery`);
    } catch (err) {
      console.error('Lỗi khi chụp và lưu ảnh:', err);
      showAppToast('Không thể lưu ảnh chụp');
    }
  };

  // Trigger capture with optional timer countdown
  const handleTakeShutter = () => {
    if (isCountingDown) return;

    if (timerSeconds === 0) {
      executeCapture();
      return;
    }

    // Countdown flow
    setIsCountingDown(true);
    setCountdownValue(timerSeconds);
    playCountdownBeep(false);

    let current = timerSeconds;
    const interval = setInterval(() => {
      current--;
      if (current > 0) {
        setCountdownValue(current);
        playCountdownBeep(false);
      } else {
        clearInterval(interval);
        setIsCountingDown(false);
        playCountdownBeep(true);
        executeCapture();
      }
    }, 1000);
  };

  // Cycle aspect ratio
  const handleCycleAspectRatio = () => {
    if (aspectRatio === '16:9') setAspectRatio('4:3');
    else if (aspectRatio === '4:3') setAspectRatio('1:1');
    else setAspectRatio('16:9');
  };

  // Cycle grid
  const handleCycleGrid = () => {
    if (gridMode === 'off') setGridMode('rule_of_thirds');
    else if (gridMode === 'rule_of_thirds') setGridMode('golden_ratio');
    else setGridMode('off');
  };

  // Cycle timer
  const handleCycleTimer = () => {
    if (timerSeconds === 0) setTimerSeconds(3);
    else if (timerSeconds === 3) setTimerSeconds(5);
    else if (timerSeconds === 5) setTimerSeconds(10);
    else setTimerSeconds(0);
  };

  // Switch camera: if multiple devices, cycle them; otherwise toggle facingMode
  const handleFlipCamera = () => {
    if (availableDevices.length > 1) {
      const currentIndex = availableDevices.findIndex((d) => d.deviceId === activeDeviceId);
      const nextIndex = (currentIndex + 1) % availableDevices.length;
      const nextDevice = availableDevices[nextIndex];
      setActiveDeviceId(nextDevice.deviceId);
      startCamera(nextDevice.deviceId);
    } else {
      setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
    }
  };

  return (
    <div 
      id="camera-page"
      className={`relative w-full h-full flex flex-col select-none overflow-hidden font-sans transition-colors ${
        isLightMode ? 'bg-[#f3f3f3] text-[#111827]' : 'bg-[#18181b] text-white'
      }`}
    >
      {/* Flash Effect Overlay */}
      <AnimatePresence>
        {isFlashing && (
          <motion.div
            initial={{ opacity: 0.95 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="fixed inset-0 z-[9999] bg-white pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Main Camera Layout */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top WinUI 3 Camera Ribbon */}
        <header className={`h-12 px-4 flex items-center justify-between border-b shrink-0 z-20 backdrop-blur-md ${
          isLightMode 
            ? 'bg-white/80 border-black/[0.08]' 
            : 'bg-[#202020]/80 border-white/[0.08]'
        }`}>
          {/* Left: App Title and Live Status */}
          <div className="flex items-center gap-2.5">
            <img
              src={CAMERA_ICON_URL}
              alt="Camera"
              referrerPolicy="no-referrer"
              className="w-5 h-5 object-contain"
            />
            <span className="font-semibold text-xs tracking-tight">Camera</span>
            {isStreamActive ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Trực tiếp ({facingMode === 'user' ? 'Trước' : 'Sau'})</span>
              </span>
            ) : isRequestingPermission ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-medium">
                Đang kết nối...
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 font-medium">
                Chưa kết nối
              </span>
            )}
          </div>

          {/* Center Quick Tool Icons */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Aspect Ratio Toggle */}
            <button
              type="button"
              onClick={handleCycleAspectRatio}
              title={`Tỷ lệ khung hình: ${aspectRatio}`}
              className="h-8 px-2.5 rounded-[5px] text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Maximize className="w-3.5 h-3.5" />
              <span className="font-mono text-[11px]">{aspectRatio}</span>
            </button>

            {/* Grid Toggle */}
            <button
              type="button"
              onClick={handleCycleGrid}
              title={`Khung lưới: ${gridMode}`}
              className={`w-8 h-8 rounded-[5px] flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer ${
                gridMode !== 'off' ? 'text-[#0078d4] dark:text-[#4cc2ff]' : 'text-neutral-500 dark:text-neutral-400'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>

            {/* Timer Toggle */}
            <button
              type="button"
              onClick={handleCycleTimer}
              title={`Hẹn giờ chụp: ${timerSeconds === 0 ? 'Tắt' : `${timerSeconds}s`}`}
              className={`h-8 px-2 rounded-[5px] flex items-center gap-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer ${
                timerSeconds > 0 ? 'text-[#0078d4] dark:text-[#4cc2ff]' : 'text-neutral-500 dark:text-neutral-400'
              }`}
            >
              <Timer className="w-4 h-4" />
              {timerSeconds > 0 && <span className="text-[11px] font-mono font-bold">{timerSeconds}s</span>}
            </button>

            {/* Shutter Sound Mute Toggle */}
            <button
              type="button"
              onClick={() => setIsShutterSoundOn(!isShutterSoundOn)}
              title={`Âm thanh chụp: ${isShutterSoundOn ? 'Bật' : 'Tắt'}`}
              className="w-8 h-8 rounded-[5px] flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-neutral-500 dark:text-neutral-400 transition-colors cursor-pointer"
            >
              {isShutterSoundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Flip camera */}
            <button
              type="button"
              onClick={handleFlipCamera}
              title="Đổi máy ảnh (Trước / Sau)"
              className="w-8 h-8 rounded-[5px] flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-neutral-500 dark:text-neutral-400 transition-colors cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          {/* Right: Gallery Shortcut */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                if (cameraRollFolder) {
                  navigate('/gallery', { folderId: cameraRollFolder.id });
                } else {
                  navigate('/gallery');
                }
              }}
              title="Mở thư mục Camera Rolls trong Gallery"
              className="h-8 px-2.5 rounded-[5px] text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Folder className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Camera Rolls</span>
            </button>
          </div>
        </header>

        {/* Filter Preset Chips Bar */}
        <div className={`h-8 px-4 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 border-b text-xs ${
          isLightMode ? 'bg-[#fafafa] border-black/[0.05]' : 'bg-[#1c1c1f] border-white/[0.05]'
        }`}>
          <span className="text-[11px] text-neutral-400 font-medium shrink-0">Bộ lọc:</span>
          {(Object.keys(FILTER_STYLES) as CameraFilter[]).map((filterKey) => (
            <button
              key={filterKey}
              type="button"
              onClick={() => setActiveFilter(filterKey)}
              className={`px-2.5 py-0.5 rounded-[4px] text-[11px] font-medium transition-colors cursor-pointer shrink-0 ${
                activeFilter === filterKey
                  ? 'bg-[#0078d4] dark:bg-[#4cc2ff] text-white dark:text-black font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/10'
              }`}
            >
              {FILTER_STYLES[filterKey].name}
            </button>
          ))}
        </div>

        {/* Main Stage: Real Viewfinder + Controls Layout */}
        <div className="flex-1 relative flex flex-col md:flex-row overflow-hidden bg-black">
          {/* Viewfinder Viewport */}
          <div 
            className="flex-1 relative flex items-center justify-center overflow-hidden cursor-crosshair"
            onClick={handleViewfinderClick}
          >
            {/* Aspect Ratio Sizing Wrapper */}
            <div 
              className="relative overflow-hidden transition-all duration-200 shadow-2xl flex items-center justify-center bg-black"
              style={{
                aspectRatio: aspectRatio === '16:9' ? '16/9' : aspectRatio === '4:3' ? '4/3' : '1/1',
                maxHeight: '100%',
                maxWidth: '100%',
                width: aspectRatio === '1:1' ? 'min(75vh, 75vw)' : '100%',
                height: aspectRatio === '1:1' ? 'min(75vh, 75vw)' : '100%',
              }}
            >
              {/* Real Hardware Webcam Video element */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  filter: FILTER_STYLES[activeFilter].css,
                  transform: facingMode === 'user' ? 'scaleX(-1)' : 'none'
                }}
                className={`w-full h-full object-cover transition-opacity duration-200 ${
                  isStreamActive ? 'opacity-100' : 'opacity-0'
                }`}
              />

              {/* State 1: Connecting / Requesting camera permission */}
              {isRequestingPermission && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/85 text-white p-6 text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-[#4cc2ff]" />
                  <p className="text-sm font-medium">Đang kết nối với máy ảnh của thiết bị...</p>
                  <p className="text-xs text-white/60 max-w-sm">
                    Vui lòng bấm &ldquo;Cho phép&rdquo; (Allow) nếu trình duyệt hỏi quyền sử dụng camera.
                  </p>
                </div>
              )}

              {/* State 2: Permission Denied or Camera Error Screen */}
              {!isStreamActive && !isRequestingPermission && permissionError && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-[#18181b] text-white p-6 text-center select-none">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                    <ShieldAlert className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold">
                      {permissionError === 'denied' 
                        ? 'Chưa cấp quyền truy cập Camera' 
                        : permissionError === 'not_found'
                        ? 'Không tìm thấy máy ảnh'
                        : 'Không thể mở Camera'}
                    </h2>
                    <p className="text-xs text-neutral-400 mt-1 max-w-sm leading-relaxed">
                      {errorMessage || 'Để sử dụng ứng dụng Camera, bạn cần cho phép trình duyệt truy cập vào máy ảnh của thiết bị.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => startCamera()}
                      className="px-4 py-2 rounded-[6px] bg-[#0078d4] dark:bg-[#4cc2ff] hover:bg-[#106ebe] dark:hover:bg-[#6bd0ff] text-white dark:text-black font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-md"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Cấp lại quyền & Thử lại</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Framing Grid Overlay */}
              {gridMode === 'rule_of_thirds' && isStreamActive && (
                <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 z-10">
                  <div className="border-r border-b border-white/25" />
                  <div className="border-r border-b border-white/25" />
                  <div className="border-b border-white/25" />
                  <div className="border-r border-b border-white/25" />
                  <div className="border-r border-b border-white/25" />
                  <div className="border-b border-white/25" />
                  <div className="border-r border-b border-white/25" />
                  <div className="border-r border-b border-white/25" />
                  <div />
                </div>
              )}

              {gridMode === 'golden_ratio' && isStreamActive && (
                <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between">
                  <div className="w-full h-[38.2%] border-b border-white/25 flex">
                    <div className="h-full w-[38.2%] border-r border-white/25" />
                    <div className="h-full w-[23.6%] border-r border-white/25" />
                    <div className="h-full flex-1" />
                  </div>
                  <div className="w-full h-[23.6%] border-b border-white/25 flex">
                    <div className="h-full w-[38.2%] border-r border-white/25" />
                    <div className="h-full w-[23.6%] border-r border-white/25" />
                    <div className="h-full flex-1" />
                  </div>
                  <div className="w-full flex-1 flex">
                    <div className="h-full w-[38.2%] border-r border-white/25" />
                    <div className="h-full w-[23.6%] border-r border-white/25" />
                    <div className="h-full flex-1" />
                  </div>
                </div>
              )}

              {/* Focus Ring Indicator on Tap/Click */}
              <AnimatePresence>
                {focusPoint && (
                  <motion.div
                    initial={{ scale: 1.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ left: focusPoint.x - 28, top: focusPoint.y - 28 }}
                    className="absolute w-14 h-14 border border-amber-400 rounded-[6px] pointer-events-none z-20 shadow-[0_0_12px_rgba(251,191,36,0.6)]"
                  >
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-amber-400/40" />
                    <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-amber-400/40" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Countdown Large Number Overlay */}
              <AnimatePresence>
                {isCountingDown && (
                  <motion.div
                    key={countdownValue}
                    initial={{ scale: 1.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
                  >
                    <div className="w-24 h-24 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center border-2 border-white/80 shadow-2xl">
                      <span className="text-white text-5xl font-black font-mono">
                        {countdownValue}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bottom Watermark Overlay */}
              {isStreamActive && (
                <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 pointer-events-none">
                  <span className="px-2 py-0.5 rounded-[4px] bg-black/50 backdrop-blur-md text-white/90 text-[10px] font-mono font-medium">
                    {aspectRatio} · {activeFilter !== 'none' ? FILTER_STYLES[activeFilter].name : 'Tự nhiên'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* WinUI 3 Camera Controls Sidebar (Right side on Desktop, Bottom bar on Mobile) */}
          <div className={`w-full md:w-28 shrink-0 flex md:flex-col items-center justify-between p-4 z-20 backdrop-blur-xl ${
            isLightMode 
              ? 'bg-white/90 md:border-l border-t md:border-t-0 border-black/10' 
              : 'bg-[#18181b]/95 md:border-l border-t md:border-t-0 border-white/10'
          }`}>
            {/* Top / Left Action: Re-connect or cycle devices */}
            <div className="flex md:flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => startCamera()}
                title="Tải lại kết nối Camera"
                className="p-2.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-neutral-500 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>

            {/* Shutter Capture Button - WinUI 3 Fluent Circular Button */}
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                id="btn-camera-shutter"
                onClick={handleTakeShutter}
                disabled={isCountingDown || !isStreamActive}
                aria-label="Chụp ảnh"
                className="group relative w-16 h-16 sm:w-18 sm:h-18 rounded-full border-[3px] border-white/90 flex items-center justify-center p-1 cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  boxShadow: '0 8px 24px rgba(0,0,0,0.35)'
                }}
              >
                {/* Outer glow ring */}
                <div className="absolute inset-0 rounded-full border border-black/20 pointer-events-none" />

                {/* Inner capture disk */}
                <div className="w-full h-full rounded-full bg-white dark:bg-white group-hover:bg-neutral-100 dark:group-hover:bg-neutral-200 group-active:scale-90 transition-all flex items-center justify-center shadow-inner">
                  <CameraIcon className="w-6 h-6 text-neutral-800 shrink-0" />
                </div>
              </button>
              <span className="text-[11px] font-medium tracking-tight text-neutral-500 dark:text-neutral-400 hidden sm:inline">
                Chụp ảnh
              </span>
            </div>

            {/* Bottom / Right: Recent Photo Bubble Preview */}
            <div className="flex md:flex-col items-center gap-2">
              <button
                type="button"
                id="btn-camera-recent-preview"
                onClick={() => {
                  if (recentCapture && cameraRollFolder) {
                    navigate('/gallery', { 
                      folderId: cameraRollFolder.id, 
                      itemId: recentCapture.id 
                    });
                  } else if (cameraRollFolder) {
                    navigate('/gallery', { folderId: cameraRollFolder.id });
                  } else {
                    navigate('/gallery');
                  }
                }}
                title={recentCapture ? `Xem ${recentCapture.title} trong Camera Rolls` : 'Xem thư viện ảnh'}
                className="group relative w-11 h-11 rounded-full overflow-hidden border-2 border-white/60 dark:border-white/30 hover:border-[#0078d4] dark:hover:border-[#4cc2ff] transition-all cursor-pointer shadow-md shrink-0 bg-neutral-800"
              >
                {recentCapture?.thumbnailUrl || recentCapture?.url ? (
                  <img
                    src={recentCapture.thumbnailUrl || recentCapture.url}
                    alt="Ảnh vừa chụp"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-neutral-700 text-neutral-300">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                )}

                {/* Camera Roll badge */}
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#0078d4] dark:bg-[#4cc2ff] flex items-center justify-center text-white dark:text-black">
                  <Folder className="w-2.5 h-2.5" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
