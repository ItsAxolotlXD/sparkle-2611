import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  CheckCircle2, 
  Bug, 
  Lightbulb, 
  ExternalLink,
  Clock,
  ThumbsUp,
  RotateCcw,
  Star,
  Image as ImageIcon,
  Paperclip,
  X
} from 'lucide-react';
import { FluentDeleteIcon } from '../components/FluentIcons';

interface FeedbackProps {
  navigate?: (route: string) => void;
}

interface SubmittedFeedback {
  id: string;
  category: 'suggestion' | 'bug' | string;
  title: string;
  description: string;
  email?: string;
  rating?: number;
  attachmentCount?: number;
  savedDiagnostics?: boolean;
  createdAt: number;
}

interface AttachmentItem {
  id: string;
  name: string;
  size: string;
  type: 'media' | 'file';
}

const FEEDBACK_TYPES = [
  { id: 'suggestion', label: 'Feature Suggestion', icon: Lightbulb },
  { id: 'bug', label: 'Bugs Report', icon: Bug },
];

export const Feedback: React.FC<FeedbackProps> = () => {
  const [feedbackType, setFeedbackType] = useState<'suggestion' | 'bug'>('suggestion');
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [saveDiagnostics, setSaveDiagnostics] = useState<boolean>(true);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const mediaInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [savedFeedbacks, setSavedFeedbacks] = useState<SubmittedFeedback[]>(() => {
    try {
      const data = localStorage.getItem('waves_user_feedbacks');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('waves_user_feedbacks', JSON.stringify(savedFeedbacks));
    } catch {}
  }, [savedFeedbacks]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'media' | 'file') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: AttachmentItem[] = Array.from(files).map((f: File) => {
      const sizeStr = f.size > 1024 * 1024 
        ? `${(f.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${Math.round(f.size / 1024)} KB`;
      return {
        id: 'att-' + Math.random().toString(36).substring(2, 9),
        name: f.name,
        size: sizeStr,
        type,
      };
    });

    setAttachments((prev) => [...prev, ...newItems]);
    e.target.value = '';
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      const newFeedback: SubmittedFeedback = {
        id: 'fb-' + Date.now(),
        category: feedbackType,
        title: title.trim(),
        description: description.trim(),
        email: email.trim() || undefined,
        rating,
        attachmentCount: attachments.length,
        savedDiagnostics: saveDiagnostics,
        createdAt: Date.now(),
      };

      setSavedFeedbacks((prev) => [newFeedback, ...prev]);
      setIsSubmitting(false);
      setIsSubmitted(true);
      setTitle('');
      setEmail('');
      setDescription('');
      setAttachments([]);
    }, 500);
  };

  const handleDeleteFeedback = (id: string) => {
    setSavedFeedbacks((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <motion.div
      id="feedback-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="feedback-page-wrapper w-full max-w-5xl mx-auto pb-28 pt-2 px-4 sm:px-6 select-none space-y-6"
    >
      {/* Header */}
      <div className="pb-1 border-none bg-transparent">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#111827] dark:text-white tracking-tight">
          Feedback
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
          Share your suggestions, report issues, and help improve Sparkle.
        </p>
      </div>

      {/* Two feedback types: Feature Suggestion and Bugs Report with watch-style underline tabs */}
      <div
        id="feedback-type-tabs"
        className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-0.5 no-scrollbar border-0"
      >
        {FEEDBACK_TYPES.map((type) => {
          const isActive = feedbackType === type.id;
          const Icon = type.icon;
          return (
            <button
              key={type.id}
              id={`feedback-type-btn-${type.id}`}
              type="button"
              onClick={() => setFeedbackType(type.id as 'suggestion' | 'bug')}
              className={`relative px-4 py-2.5 text-xs sm:text-sm whitespace-nowrap cursor-pointer select-none transition-colors flex items-center gap-2 !bg-transparent !border-0 !shadow-none hover:!bg-transparent active:!bg-transparent focus:!bg-transparent ${
                isActive
                  ? 'text-black dark:text-white font-bold'
                  : 'text-[#6B7280] hover:text-black dark:text-[#9CA3AF] dark:hover:text-white font-medium'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#005fb8] dark:text-[#4cc2ff]' : 'text-current opacity-70'}`} />
              <span className="relative z-10 !bg-transparent">{type.label}</span>
              {isActive && (
                <motion.div
                  layoutId="feedback-type-active-underline"
                  className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-6 h-[3px] rounded-full bg-[#0078d4] dark:bg-[#4cc2ff]"
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
      </div>

      <div className="flex flex-col gap-8 bg-transparent">
        {/* Form Container */}
        <div className="rounded-[8px] bg-white dark:bg-[#2c3037] shadow-xs p-5 sm:p-6 border border-black/5 dark:border-white/5 hover:bg-black/[0.01] dark:hover:bg-[#31363e] transition-colors">
          <AnimatePresence mode="wait">
            {isSubmitted ? (
              <motion.div
                key="feedback-success"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="py-8 text-center space-y-4"
              >
                <div className="w-13 h-13 rounded-full bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-semibold text-[#111827] dark:text-white">
                  Thank you for your feedback!
                </h3>
                <p className="text-xs sm:text-sm text-[#6B7280] dark:text-[#9CA3AF] max-w-md mx-auto">
                  Your feedback has been recorded. Our team reviews submissions to continuously improve Sparkle.
                </p>
                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="mt-3 inline-flex items-center gap-2 px-4 h-8.5 rounded-[6px] bg-[#005fb8] dark:bg-[#4cc2ff] text-white dark:text-black font-semibold text-xs hover:opacity-90 transition-opacity cursor-pointer shadow-xs border-none"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Submit another feedback</span>
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                {/* 1. Heading */}
                <div>
                  <label className="block text-xs font-semibold text-[#111827] dark:text-white mb-1.5">
                    Heading <span className="text-rose-500">*</span>
                  </label>
                  <div className="fluent-input-box relative w-full h-9 bg-black/5 dark:bg-[#202328] flex items-center px-3.5 rounded-[6px] transition-colors border border-black/10 dark:border-white/10 focus-within:border-[#005fb8] dark:focus-within:border-[#4cc2ff]">
                    <input
                      required
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Summarize your feedback"
                      maxLength={120}
                      className="w-full bg-transparent text-xs sm:text-[13px] text-[#111827] dark:text-white placeholder-[#71717a] dark:placeholder-[#9ca3af] outline-none border-none py-1"
                    />
                  </div>
                </div>

                {/* 2. Email */}
                <div>
                  <label className="block text-xs font-semibold text-[#111827] dark:text-white mb-1.5">
                    Email
                  </label>
                  <div className="fluent-input-box relative w-full h-9 bg-black/5 dark:bg-[#202328] flex items-center px-3.5 rounded-[6px] transition-colors border border-black/10 dark:border-white/10 focus-within:border-[#005fb8] dark:focus-within:border-[#4cc2ff]">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Replies will return to your email"
                      className="w-full bg-transparent text-xs sm:text-[13px] text-[#111827] dark:text-white placeholder-[#71717a] dark:placeholder-[#9ca3af] outline-none border-none py-1"
                    />
                  </div>
                </div>

                {/* 3. Details */}
                <div>
                  <label className="block text-xs font-semibold text-[#111827] dark:text-white mb-1.5">
                    Details <span className="text-rose-500">*</span>
                  </label>
                  <div className="fluent-input-box relative w-full bg-black/5 dark:bg-[#202328] rounded-[6px] p-2.5 transition-colors border border-black/10 dark:border-white/10 focus-within:border-[#005fb8] dark:focus-within:border-[#4cc2ff]">
                    <textarea
                      required
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Wriite and explain your feedback in more details"
                      className="w-full bg-transparent text-xs sm:text-[13px] text-[#111827] dark:text-white placeholder-[#71717a] dark:placeholder-[#9ca3af] outline-none border-none resize-y"
                    />
                  </div>
                </div>

                {/* 4. Attachments (optional) */}
                <div>
                  <label className="block text-xs font-semibold text-[#111827] dark:text-white mb-1.5">
                    Attachments (optional)
                  </label>
                  <input
                    ref={mediaInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, 'media')}
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, 'file')}
                  />
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Button normal not colored 1: Attach media */}
                    <button
                      type="button"
                      onClick={() => mediaInputRef.current?.click()}
                      className="px-3.5 h-8.5 rounded-[6px] bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-[#111827] dark:text-white border border-black/10 dark:border-white/10 text-xs font-medium inline-flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
                    >
                      <ImageIcon className="w-4 h-4 text-[#6B7280] dark:text-[#9CA3AF]" />
                      <span>Attach media</span>
                    </button>

                    {/* Button normal not colored 2: Attach files */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 h-8.5 rounded-[6px] bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-[#111827] dark:text-white border border-black/10 dark:border-white/10 text-xs font-medium inline-flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
                    >
                      <Paperclip className="w-4 h-4 text-[#6B7280] dark:text-[#9CA3AF]" />
                      <span>Attach files</span>
                    </button>
                  </div>

                  {/* Attached file badges */}
                  {attachments.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {attachments.map((file) => (
                        <div
                          key={file.id}
                          className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[6px] bg-black/5 dark:bg-white/10 text-xs text-[#111827] dark:text-white border border-black/5 dark:border-white/10"
                        >
                          {file.type === 'media' ? (
                            <ImageIcon className="w-3.5 h-3.5 text-[#005fb8] dark:text-[#4cc2ff]" />
                          ) : (
                            <Paperclip className="w-3.5 h-3.5 text-[#005fb8] dark:text-[#4cc2ff]" />
                          )}
                          <span className="truncate max-w-[180px]">{file.name}</span>
                          <span className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">({file.size})</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(file.id)}
                            className="hover:text-rose-500 cursor-pointer p-0.5 rounded transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 5. How do you rate Sparkle? with 5 stars icon */}
                <div>
                  <label className="block text-xs font-semibold text-[#111827] dark:text-white mb-1.5">
                    How do you rate Sparkle?
                  </label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isFilled = (hoveredRating !== null ? hoveredRating : rating) >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(null)}
                          onClick={() => setRating(star)}
                          aria-label={`${star} star`}
                          className="p-1 rounded-[6px] hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer border-none"
                        >
                          <Star
                            className={`w-6 h-6 transition-transform hover:scale-110 ${
                              isFilled
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-[#9ca3af] dark:text-[#6b7280]'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 6. Checkbox */}
                <div className="pt-1">
                  <label className="inline-flex items-start gap-2.5 cursor-pointer text-xs sm:text-[13px] text-[#4b5563] dark:text-[#d1d5db]">
                    <input
                      type="checkbox"
                      checked={saveDiagnostics}
                      onChange={(e) => setSaveDiagnostics(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded-[4px] accent-[#005fb8] dark:accent-[#4cc2ff] cursor-pointer"
                    />
                    <span className="leading-snug select-none">
                      Save a local copy of diagnostics and attachments created when submitting feedback
                    </span>
                  </label>
                </div>

                {/* 7. Button colored: Submit Feedback */}
                <div className="pt-2 flex items-center justify-start">
                  <button
                    type="submit"
                    disabled={isSubmitting || !title.trim() || !description.trim()}
                    className="inline-flex items-center gap-2 px-6 h-9 rounded-[6px] bg-[#005fb8] hover:bg-[#106ebe] dark:bg-[#4cc2ff] dark:hover:bg-[#6bd0ff] text-white dark:text-black font-semibold text-xs shadow-xs transition-all cursor-pointer border-none disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Submitting...' : 'Submit Feedback'}</span>
                  </button>
                </div>
              </form>
            )}
          </AnimatePresence>
        </div>

        {/* 8. Recent submissions <div> */}
        <div className="space-y-3 bg-transparent">
          <div className="flex items-center justify-between py-1 px-1">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#005fb8] dark:text-[#4cc2ff]" />
              <h2 className="text-base sm:text-lg font-bold text-[#111827] dark:text-white tracking-tight">
                Recent submissions ({savedFeedbacks.length})
              </h2>
            </div>
          </div>

          <div className="space-y-2.5 bg-transparent">
            {savedFeedbacks.length === 0 ? (
              <div className="rounded-[6px] bg-white dark:bg-[#2c3037] shadow-xs p-6 text-center text-xs text-[#6B7280] dark:text-[#9CA3AF] border border-black/5 dark:border-white/5">
                No submissions recorded yet.
              </div>
            ) : (
              savedFeedbacks.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[6px] bg-white dark:bg-[#2c3037] shadow-xs px-4 py-3 sm:py-3.5 flex flex-col gap-2 hover:bg-black/[0.02] dark:hover:bg-[#363b43] transition-colors border border-black/5 dark:border-white/5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-normal text-sm text-[#111827] dark:text-white flex items-center gap-2">
                        <span className="font-semibold">{item.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-[4px] bg-[#0078d4]/10 dark:bg-[#4cc2ff]/20 text-[#0078d4] dark:text-[#4cc2ff] font-medium">
                          {item.category === 'bug' ? 'Bugs Report' : 'Feature Suggestion'}
                        </span>
                      </div>
                      <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-1 leading-relaxed">
                        {item.description}
                      </div>
                      {item.attachmentCount && item.attachmentCount > 0 ? (
                        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
                          <Paperclip className="w-3 h-3" />
                          <span>{item.attachmentCount} attachment(s) included</span>
                        </div>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-2 text-[11px] text-[#6B7280] dark:text-[#9CA3AF]">
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        <span className="font-medium text-amber-500">★ {item.rating || 5}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteFeedback(item.id)}
                        title="Delete this submission"
                        className="p-1 rounded-[6px] text-[#6B7280] dark:text-[#9CA3AF] hover:text-rose-500 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer border-none"
                      >
                        <FluentDeleteIcon className="w-3.5 h-3.5 text-current" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 9. Join our Discord Community <div> */}
        <div className="space-y-3 bg-transparent">
          <div className="flex items-center gap-2 py-1 px-1">
            <ThumbsUp className="w-4 h-4 text-[#5865F2]" />
            <h2 className="text-base sm:text-lg font-bold text-[#111827] dark:text-white tracking-tight">
              Join our Discord Community
            </h2>
          </div>

          <div className="rounded-[8px] bg-white dark:bg-[#2c3037] shadow-xs px-4 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-black/[0.02] dark:hover:bg-[#363b43] transition-colors border border-black/5 dark:border-white/5">
            <div>
              <div className="font-normal text-sm text-[#111827] dark:text-white">
                Connect with creators, stream watchers & developers
              </div>
              <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5 leading-normal max-w-xl">
                Want to discuss live TV streams, request new channels, or get direct help? Join the official Sparkle Discord community server.
              </div>
            </div>
            <a
              href="https://discord.gg/wcdjaDDayK"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 h-8.5 rounded-[6px] bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-semibold transition-colors shrink-0 cursor-pointer shadow-xs border-none"
            >
              <span>Open Discord</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Feedback;
