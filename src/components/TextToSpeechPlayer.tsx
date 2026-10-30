import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  X, 
  Gauge, 
  Headphones,
  ChevronDown,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { NewsArticle } from '../types';

interface TextToSpeechPlayerProps {
  article: NewsArticle | null;
  isOpen: boolean;
  onClose: () => void;
}

interface SpeechChunk {
  index: number;
  label: string;
  text: string;
}

export const TextToSpeechPlayer: React.FC<TextToSpeechPlayerProps> = ({
  article,
  isOpen,
  onClose
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  const [voiceDropdownOpen, setVoiceDropdownOpen] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  // Prepare clean readable chunks from the article
  const chunks: SpeechChunk[] = useMemo(() => {
    if (!article) return [];
    const list: SpeechChunk[] = [];
    let idx = 0;

    // 1. Title
    if (article.title) {
      list.push({ index: idx++, label: 'Title', text: article.title });
    }

    // 2. Subtitle
    if (article.subtitle) {
      list.push({ index: idx++, label: 'Subtitle', text: article.subtitle });
    }

    // 3. Excerpt
    if (article.excerpt) {
      list.push({ index: idx++, label: 'Lead Excerpt', text: article.excerpt });
    }

    // 4. Content paragraphs (filtering out image markers)
    article.content.forEach((p) => {
      if (!p.startsWith('<image>') && p.trim().length > 0) {
        list.push({ index: idx++, label: `Paragraph ${idx - 2}`, text: p });
      }
    });

    return list;
  }, [article]);

  // Load available speech synthesis voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSpeechSupported(false);
      return;
    }

    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      setVoices(allVoices);

      // Prioritize Vietnamese voices (vi-VN, vi_VN, vi)
      const viVoice = allVoices.find((v) => v.lang.startsWith('vi') || v.name.toLowerCase().includes('vietnam'));
      if (viVoice) {
        setSelectedVoiceURI(viVoice.voiceURI);
      } else if (allVoices.length > 0 && !selectedVoiceURI) {
        setSelectedVoiceURI(allVoices[0].voiceURI);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Stop speech synthesis when closing or when article changes
  useEffect(() => {
    if (!isOpen && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentIndex(0);
    }
  }, [isOpen, article]);

  // Handle speaking a specific chunk
  const speakChunk = (chunkIndex: number) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (chunkIndex < 0 || chunkIndex >= chunks.length) {
      setIsPlaying(false);
      setIsPaused(false);
      return;
    }

    window.speechSynthesis.cancel();

    const chunk = chunks[chunkIndex];
    const utterance = new SpeechSynthesisUtterance(chunk.text);

    utterance.rate = playbackRate;
    utterance.volume = isMuted ? 0 : volume;

    // Set voice if chosen
    if (selectedVoiceURI) {
      const v = voices.find((item) => item.voiceURI === selectedVoiceURI);
      if (v) utterance.voice = v;
    } else {
      utterance.lang = 'vi-VN';
    }

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      setCurrentIndex(chunkIndex);

      // Highlight corresponding element on page if it exists
      try {
        const el = document.querySelector(`[data-speech-index="${chunkIndex}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } catch {}
    };

    utterance.onend = () => {
      if (chunkIndex + 1 < chunks.length) {
        speakChunk(chunkIndex + 1);
      } else {
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentIndex(0);
      }
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      setIsPlaying(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handlePlay = () => {
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
    } else {
      speakChunk(currentIndex);
    }
  };

  const handlePause = () => {
    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentIndex(0);
  };

  const handleNext = () => {
    if (currentIndex + 1 < chunks.length) {
      speakChunk(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      speakChunk(currentIndex - 1);
    }
  };

  const handleSpeedChange = () => {
    const speeds = [0.75, 1.0, 1.25, 1.5, 2.0];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const newSpeed = speeds[nextIdx];
    setPlaybackRate(newSpeed);

    // If already playing, restart current chunk with new speed
    if (isPlaying) {
      setTimeout(() => speakChunk(currentIndex), 50);
    }
  };

  if (!isOpen || !article) return null;

  const currentChunk = chunks[currentIndex] || chunks[0];
  const progressPercent = chunks.length > 0 ? Math.round(((currentIndex + 1) / chunks.length) * 100) : 0;

  // Filter Vietnamese voices or fallbacks
  const vietnameseVoices = voices.filter(
    (v) => v.lang.startsWith('vi') || v.name.toLowerCase().includes('vietnam')
  );
  const displayVoices = vietnameseVoices.length > 0 ? vietnameseVoices : voices.slice(0, 10);

  return (
    <AnimatePresence>
      <motion.div
        id="text-to-speech-player-container"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className="fixed bottom-5 right-4 left-4 sm:left-auto sm:right-6 sm:w-[480px] z-50 select-none"
      >
        <div className="bg-[#2c2c2c] border border-[#3e3e3e] rounded-lg shadow-2xl p-4 text-white overflow-hidden">
          {/* Top Header */}
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/10">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#E6005A]/20 border border-[#E6005A]/50 flex items-center justify-center text-[#FF4D8B] shrink-0">
                <Headphones className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF4D8B]">
                    Text to Speech
                  </span>
                  {isPlaying && (
                    <span className="flex items-center gap-0.5">
                      <span className="w-1 h-3 bg-[#E6005A] rounded-full animate-pulse" />
                      <span className="w-1 h-4 bg-[#FF4D8B] rounded-full animate-pulse delay-75" />
                      <span className="w-1 h-2 bg-[#E6005A] rounded-full animate-pulse delay-150" />
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-white/90 truncate max-w-[260px] sm:max-w-[320px]">
                  {article.title}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-default"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  handleStop();
                  onClose();
                }}
                className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-default"
                title="Close player"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Expanded Content View */}
          {!isMinimized && (
            <div className="pt-3 space-y-3">
              {/* Spoken Text Preview */}
              <div className="p-3 rounded-2xl bg-[#140710]/80 border border-white/5 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-white/50">
                  <span className="font-semibold text-[#FF4D8B]">
                    {currentChunk?.label || 'Ready'}
                  </span>
                  <span>{`${currentIndex + 1} / ${chunks.length}`}</span>
                </div>
                <p className="text-xs text-white/85 line-clamp-3 leading-relaxed font-normal">
                  {currentChunk?.text || 'Press Play to start reading article.'}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#E6005A] to-[#FF4D8B] h-full transition-all duration-300 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-white/50 font-mono">
                  <span>Progress: {progressPercent}%</span>
                  <span>{chunks.length} segments</span>
                </div>
              </div>

              {/* Controls Toolbar */}
              <div className="flex items-center justify-between gap-2 pt-1">
                {/* Voice Selection Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setVoiceDropdownOpen(!voiceDropdownOpen)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-medium text-white/80 cursor-default transition-all max-w-[130px]"
                    title="Select voice"
                  >
                    <span className="truncate">
                      {voices.find((v) => v.voiceURI === selectedVoiceURI)?.name || 'Default Voice'}
                    </span>
                    <ChevronDown className="w-3 h-3 shrink-0 opacity-70" />
                  </button>

                  {voiceDropdownOpen && (
                    <div className="absolute bottom-full mb-2 left-0 w-56 max-h-48 overflow-y-auto rounded-2xl bg-[#28131F] border border-white/15 p-1.5 shadow-2xl z-50 text-xs space-y-1 no-scrollbar">
                      <div className="px-2 py-1 text-[10px] font-bold text-[#FF4D8B] uppercase tracking-wider">
                        Voice Selection
                      </div>
                      {displayVoices.map((v) => (
                        <button
                          key={v.voiceURI}
                          type="button"
                          onClick={() => {
                            setSelectedVoiceURI(v.voiceURI);
                            setVoiceDropdownOpen(false);
                            if (isPlaying) speakChunk(currentIndex);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs truncate transition-colors ${
                            selectedVoiceURI === v.voiceURI
                              ? 'bg-[#4cc2ff] text-black font-bold'
                              : 'text-white/80 hover:bg-white/10'
                          }`}
                        >
                          {v.name} ({v.lang})
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Main Playback Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={currentIndex <= 0}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-white cursor-default transition-all"
                    title="Previous chunk"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={isPlaying ? handlePause : handlePlay}
                    className="w-11 h-11 rounded-full bg-[#4cc2ff] hover:bg-[#6bd0ff] active:scale-95 flex items-center justify-center text-white dark:text-black shadow-lg shadow-[#4cc2ff]/40 cursor-default transition-all"
                    title={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 fill-current" />
                    ) : (
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={currentIndex >= chunks.length - 1}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-white cursor-default transition-all"
                    title="Next chunk"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleStop}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-white/70 hover:text-white cursor-default transition-all"
                    title="Stop"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>

                {/* Rate Speed & Volume */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleSpeedChange}
                    className="px-2 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono font-bold text-white cursor-default transition-all flex items-center gap-1"
                    title="Reading speed"
                  >
                    <Gauge className="w-3 h-3 text-[#FF4D8B]" />
                    <span>{playbackRate}x</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsMuted(!isMuted)}
                    className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/80 hover:text-white cursor-default transition-all"
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Minimized Compact Bar */}
          {isMinimized && (
            <div className="pt-2 flex items-center justify-between gap-3">
              <span className="text-xs text-white/80 truncate">
                {currentChunk?.label}: {currentChunk?.text}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={isPlaying ? handlePause : handlePlay}
                  className="w-8 h-8 rounded-full bg-[#4cc2ff] flex items-center justify-center text-white dark:text-black cursor-default shadow-md"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white cursor-default"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {!speechSupported && (
            <p className="mt-2 text-[11px] text-amber-300">
              Trình duyệt của bạn không hỗ trợ Web Speech API.
            </p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
