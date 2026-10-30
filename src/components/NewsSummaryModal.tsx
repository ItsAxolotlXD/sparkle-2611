import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, CheckCircle2, FileText } from 'lucide-react';
import { NewsArticle } from '../types';
import { exportArticleToDocx } from '../utils/docxExport';
import { useSettings } from '../hooks/useSettings';
import { SpinningRing } from './SpinningRing';
import { modalDialogVariants, modalBackdropVariants } from '../utils/animations';

interface NewsSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: NewsArticle;
}

export const NewsSummaryModal: React.FC<NewsSummaryModalProps> = ({
  isOpen,
  onClose,
  article
}) => {
  const { settings } = useSettings();
  const shouldAnimate = !settings.reduceAllMotion && settings.animateModals;
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 10-second loading simulation when summarize news is opened
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen) {
      setIsLoading(true);
      timer = setTimeout(() => {
        setIsLoading(false);
      }, 3000);
    } else {
      setIsLoading(true);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isOpen, article.id]);

  // Generate structured summary bullet points from article content or explicit summary
  const bulletPoints = article.summary?.points && article.summary.points.length > 0
    ? article.summary.points
    : article.content.slice(0, 3).map((p) => {
        const firstSentence = p.split(/[.!?]/)[0];
        return firstSentence.length > 20 ? firstSentence + '.' : p;
      });

  const leadText = article.summary?.lead || article.excerpt;

  const handleCopySummary = () => {
    const pointsFormatted = bulletPoints.map((b) => `- ${b}`).join('\n');
    const conclusionText = article.summary?.conclusion ? `\n\n${article.summary.conclusion}` : '';
    const summaryText = `[ARTICLE SUMMARY - ${article.title}]\n\n• ${leadText}\n\nKey Highlights:\n${pointsFormatted}${conclusionText}\n\nSource: Sparkle News (${article.publishedAt})`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExportDocx = async () => {
    setExporting(true);
    try {
      await exportArticleToDocx(article);
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          id="news-summary-modal-container"
          className="fixed inset-0 z-9999 flex items-center justify-center p-4 sm:p-6 select-none"
        >
          {/* 1. Backdrop / Lớp nền mờ */}
          <motion.div
            id="news-summary-backdrop"
            variants={modalBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
          />

          {/* 2. Dialog Modal Box - Fluent Design ContentDialog */}
          <motion.div
            id="news-summary-dialog"
            variants={modalDialogVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fluent-modal-dialog relative z-10 w-full max-w-[480px] bg-white dark:bg-[#202020] rounded-[10px] overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.22),0_2px_6px_rgba(0,0,0,0.08)] dark:shadow-[0_24px_48px_rgba(0,0,0,0.7),0_2px_6px_rgba(255,255,255,0.04)] border border-black/[0.08] dark:border-white/[0.08] text-[#111827] dark:text-[#F3F4F6]"
          >
            {/* Header & Body Area */}
            <div className="p-6 pb-4">
              <h2 className="text-[19px] sm:text-[20px] font-semibold text-[#111827] dark:text-[#FFFFFF] tracking-tight leading-snug font-sans">
                Article Summary
              </h2>

              {/* Loading State */}
              {isLoading ? (
                <div className="py-10 px-4 flex flex-col items-center justify-center text-center space-y-4 my-2">
                  <div className="flex items-center justify-center py-2">
                    <SpinningRing size={52} strokeWidth={5} />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-[#111827] dark:text-[#FFFFFF]">
                      Processing article...
                    </h3>
                    <p className="text-xs text-[#666666] dark:text-[#AAAAAA] max-w-[300px]">
                      Extracting key insights and highlights
                    </p>
                  </div>

                  {/* 10-second progress indicator */}
                  <div className="w-48 h-1.5 bg-black/[0.08] dark:bg-white/[0.1] rounded-full overflow-hidden mt-2 relative">
                    <motion.div
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 10, ease: 'linear' }}
                      className="h-full bg-[#4cc2ff] rounded-full"
                    />
                  </div>
                </div>
              ) : (
                <motion.div 
                  initial={shouldAnimate ? { opacity: 0, y: 6 } : { opacity: 1, y: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-3 space-y-3.5 max-h-[55vh] overflow-y-auto pr-1"
                >
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#4cc2ff]">
                      {article.category}
                    </span>
                    <h3 className="text-base font-semibold text-[#111827] dark:text-[#FFFFFF] mt-0.5 leading-snug">
                      {article.title}
                    </h3>
                  </div>

                  {/* Core takeaway */}
                  <div className="p-3.5 rounded-lg bg-[#F9F9F9] dark:bg-[#2B2B2B] border border-black/[0.06] dark:border-white/[0.08] border-l-4 border-l-[#4cc2ff]">
                    <p className="text-[13px] font-normal text-[#111827] dark:text-[#E0E0E0] leading-relaxed">
                      "{leadText}"
                    </p>
                  </div>

                  {/* Bullet points */}
                  <div>
                    <h4 className="text-xs font-semibold text-[#666666] dark:text-[#AAAAAA] mb-2 uppercase tracking-wide">
                      Key Highlights:
                    </h4>
                    <div className="space-y-1.5">
                      {bulletPoints.map((bp, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-md bg-[#F9F9F9] dark:bg-[#2B2B2B] border border-black/[0.06] dark:border-white/[0.08] text-[13px] text-[#333333] dark:text-[#DDDDDD] flex items-start gap-2.5"
                        >
                          <span className="w-4.5 h-4.5 rounded-full bg-[#4cc2ff]/15 text-[#4cc2ff] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <p className="leading-relaxed font-normal">{bp}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {article.summary?.conclusion && (
                    <div className="p-3 rounded-md bg-[#F9F9F9] dark:bg-[#2B2B2B] border border-black/[0.06] dark:border-white/[0.08] text-[13px] text-[#333333] dark:text-[#DDDDDD] leading-relaxed font-normal">
                      {article.summary.conclusion}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-[#777777] dark:text-[#999999] pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
                    <span>Category: <strong className="text-[#111827] dark:text-[#FFFFFF]">{article.category}</strong></span>
                    <span>Published: {article.publishedAt}</span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Subtle Divider */}
            <div className="h-[1px] w-full bg-[#E5E5E5] dark:bg-[#2F2F2F]" />

            {/* Bottom Actions Footer */}
            <div className="fluent-modal-footer bg-[#F3F3F3] dark:bg-[#1C1C1C] px-6 py-3 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="fluent-btn-secondary px-4 h-8 rounded-[5px] bg-white dark:bg-[#2C2C2C] hover:bg-[#F9F9F9] dark:hover:bg-[#343434] active:bg-[#EEEEEE] dark:active:bg-[#222222] text-[#111827] dark:text-[#FFFFFF] border border-[#d1d1d1] dark:border-[#3E3E3E] text-[12.5px] font-normal shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors flex items-center justify-center cursor-pointer"
              >
                Close
              </button>
              {!isLoading && (
                <>
                  <button
                    type="button"
                    onClick={handleExportDocx}
                    disabled={exporting}
                    className="fluent-btn-secondary px-4 h-8 rounded-[5px] bg-white dark:bg-[#2C2C2C] hover:bg-[#F9F9F9] dark:hover:bg-[#343434] active:bg-[#EEEEEE] dark:active:bg-[#222222] text-[#111827] dark:text-[#FFFFFF] border border-[#d1d1d1] dark:border-[#3E3E3E] text-[12.5px] font-normal shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors flex items-center justify-center cursor-pointer gap-1.5"
                  >
                    <FileText className="w-3 h-3" />
                    <span>{exporting ? 'Exporting...' : 'Export Word'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopySummary}
                    className="fluent-btn-primary px-4 h-8 rounded-[5px] bg-[#0078d4] dark:bg-[#4cc2ff] hover:bg-[#106ebe] dark:hover:bg-[#6bd0ff] active:bg-[#005a9e] dark:active:bg-[#3bb2ef] text-white dark:text-black font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-colors border border-black/20 flex items-center justify-center cursor-pointer gap-1.5 text-[12.5px]"
                  >
                    {copied ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span className="font-semibold">{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
