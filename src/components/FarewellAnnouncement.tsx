import React from 'react';
import { Heart } from 'lucide-react';

export const FarewellAnnouncement: React.FC = () => {
  return (
    <section
      id="home-farewell-announcement"
      aria-label="Announcement: The next chapter is coming - Sparkle"
      className="fluent-reveal-item setting-card relative w-full rounded-[8px] sm:rounded-[10px] overflow-hidden bg-white dark:bg-[#38383d] border border-[#e5e5e5] dark:border-[#48484e] shadow-xs p-5 sm:p-7 md:p-8 select-text transition-colors duration-200"
    >
      <div className="relative z-10 max-w-4xl mx-auto space-y-5 sm:space-y-6">
        {/* Header Tag */}
        <div className="flex items-center justify-between border-b border-[#e5e5e5] dark:border-[#383838] pb-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[4px] bg-[#4cc2ff]/10 text-[#0078d4] dark:bg-[#4cc2ff]/20 dark:text-[#4cc2ff] text-xs font-semibold uppercase tracking-wider">
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>ANNOUNCEMENT • SPARKLE</span>
          </div>
        </div>

        {/* Main Title: Tiêu chí 3 MỚI */}
        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-[#111827] dark:text-white leading-snug flex items-center flex-wrap gap-2">
            <span>Tiêu chí</span>
            <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#0078d4] via-[#0284c7] to-[#10b981] dark:from-[#38bdf8] dark:via-[#34d399] dark:to-[#4ade80]">
              3 MỚI
            </span>
          </h2>
        </div>

        {/* Announcement Body Content: 3 MỚI Criteria */}
        <div className="space-y-4 text-sm sm:text-base leading-relaxed text-[#374151] dark:text-[#D1D5DB] font-normal">
          {/* 1. Tên gọi mới */}
          <div className="flex items-start gap-2.5 p-3 sm:p-3.5 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.06] hover:border-[#0078d4]/30 dark:hover:border-[#4ade80]/30 transition-colors">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-gradient-to-r from-[#0078d4]/10 to-[#10b981]/15 dark:from-[#38bdf8]/15 dark:to-[#4ade80]/15 text-[#0078d4] dark:text-[#4ade80] shrink-0 mt-0.5">
              <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current" aria-hidden="true">
                <polygon points="7,4 19,12 7,20" />
              </svg>
            </span>
            <p className="leading-relaxed text-[#374151] dark:text-[#D1D5DB]">
              <strong className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#0078d4] via-[#0284c7] to-[#10b981] dark:from-[#38bdf8] dark:via-[#34d399] dark:to-[#4ade80] mr-1.5">
                Tên gọi mới:
              </strong>
              Kể từ 14/10/2026, V-One chính thức đổi tên ứng dụng thành Sparkle, đánh dấu bước chuyển mình trong hành trình phát triển với một diện mạo và định hướng hoàn toàn mới.
            </p>
          </div>

          {/* 2. Nhận diện mới */}
          <div className="flex items-start gap-2.5 p-3 sm:p-3.5 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.06] hover:border-[#0078d4]/30 dark:hover:border-[#4ade80]/30 transition-colors">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-gradient-to-r from-[#0078d4]/10 to-[#10b981]/15 dark:from-[#38bdf8]/15 dark:to-[#4ade80]/15 text-[#0078d4] dark:text-[#4ade80] shrink-0 mt-0.5">
              <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current" aria-hidden="true">
                <polygon points="7,4 19,12 7,20" />
              </svg>
            </span>
            <p className="leading-relaxed text-[#374151] dark:text-[#D1D5DB]">
              <strong className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#0078d4] via-[#0284c7] to-[#10b981] dark:from-[#38bdf8] dark:via-[#34d399] dark:to-[#4ade80] mr-1.5">
                Nhận diện mới:
              </strong>
              Logo Sparkle lấy chữ S làm trung tâm, bao quanh bởi vành đai lấy cảm hứng từ Sao Hỏa, tượng trưng cho sự chuyển động và tinh thần khám phá. Bảng màu gradient xanh dương – xanh lá đại diện cho công nghệ, sự đổi mới và sức sống kết hợp với ngôn ngữ thiết kế Fluent Design của Microsoft tạo sự trẻ trung và năng động
            </p>
          </div>

          {/* 3. Định hướng mới */}
          <div className="flex items-start gap-2.5 p-3 sm:p-3.5 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.06] hover:border-[#0078d4]/30 dark:hover:border-[#4ade80]/30 transition-colors">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-gradient-to-r from-[#0078d4]/10 to-[#10b981]/15 dark:from-[#38bdf8]/15 dark:to-[#4ade80]/15 text-[#0078d4] dark:text-[#4ade80] shrink-0 mt-0.5">
              <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current" aria-hidden="true">
                <polygon points="7,4 19,12 7,20" />
              </svg>
            </span>
            <p className="leading-relaxed text-[#374151] dark:text-[#D1D5DB]">
              <strong className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#0078d4] via-[#0284c7] to-[#10b981] dark:from-[#38bdf8] dark:via-[#34d399] dark:to-[#4ade80] mr-1.5">
                Định hướng mới:
              </strong>
              Sự ra đời của Sparkle cũng đánh dấu hồi kết của tiền tố V, từng gắn liền với Vplay và V-One. Đây không chỉ là sự thay đổi về tên gọi, mà còn là cột mốc khép lại một giai đoạn để mở ra hướng phát triển mới. Thay vì chỉ tập trung vào truyền hình như trước đây, Sparkle của LAC hướng đến một ứng dụng đa nhu cầu, mở rộng khả năng đáp ứng nhiều mục đích sử dụng khác nhau. Truyền hình vẫn là một phần trong hành trình, nhưng không còn là giới hạn duy nhất của ứng dụng.
            </p>
          </div>

          <div className="farewell-quote p-4 sm:p-5 rounded-xl bg-black/[0.04] dark:bg-white/5 border-l-4 border-[#4cc2ff] text-[#111827] dark:text-white font-medium leading-relaxed my-3">
            <span className="font-bold text-[#0078d4] dark:text-[#4cc2ff]">NOTE:</span> Sparkle là dự án phát triển độc lập, không liên quan đến Vplay tiền nhiệm cũng như các dự án sắp tới của VNRT.
          </div>
        </div>

        {/* Footer Sign-off */}
        <div className="pt-5 border-t border-black/10 dark:border-white/10 flex flex-col items-start gap-2.5">
          <div className="font-square text-lg sm:text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#0078d4] via-[#4cc2ff] to-[#60cdff]">
            Sparkle - A New Era Begins.
          </div>
          <p className="farewell-footer-note text-xs text-[#6B7280] dark:text-[#9CA3AF] italic leading-relaxed">
            (Đón chờ những bất ngờ và đổi mới tiếp theo từ hành trình phát triển của Sparkle.)
          </p>
        </div>
      </div>
    </section>
  );
};
