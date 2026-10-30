import React from 'react';

interface Fluent3DIconProps {
  className?: string;
  style?: React.CSSProperties;
}


const ImageIcon: React.FC<Fluent3DIconProps & { src: string; alt: string; pixelated?: boolean }> = ({ src, alt, className = "w-5 h-5", style, pixelated }) => (
  <div className={`fluent-3d-icon ${className} shrink-0 flex items-center justify-center`} style={style}>
    <img
      src={src}
      alt={alt}
      draggable={false}
      className="fluent-3d-icon w-[17px] h-[17px] shrink-0 object-contain"
      style={pixelated ? { imageRendering: "pixelated" } : undefined}
    />
  </div>
);

// 1. Home - Microsoft Fluent Design Home (scaled down slightly)
export const Fluent3DHomeIcon: React.FC<Fluent3DIconProps> = ({ className = 'w-5 h-5', style }) => {
  const [loadError, setLoadError] = React.useState(false);

  return (
    <div className={`fluent-3d-icon ${className} shrink-0 flex items-center justify-center`} style={style}>
      {!loadError ? (
        <img
          src="https://www.elevenforum.com/data/attachments/30/30188-c9f25938bd40f9c2e3af267cc96b3e28.jpg?hash=yfJZOL1A-c"
          alt="Home"
          referrerPolicy="no-referrer"
          className="w-[17px] h-[17px] shrink-0 object-contain rounded-[2px]"
          onError={() => setLoadError(true)}
        />
      ) : (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[17px] h-[17px] shrink-0">
          <defs>
            <linearGradient id="fl3d_home_roof" x1="4" y1="5" x2="28" y2="17" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="50%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#0369A1" />
            </linearGradient>
            <linearGradient id="fl3d_home_body" x1="6" y1="14" x2="26" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#075985" />
            </linearGradient>
            <filter id="fl3d_home_shadow" x="-10%" y="-10%" width="125%" height="125%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="1" floodColor="#000" floodOpacity="0.25" />
            </filter>
          </defs>
          <path d="M7 14.5L16 7L25 14.5V26C25 27.1046 24.1046 28 23 28H9C7.89543 28 7 27.1046 7 26V14.5Z" fill="url(#fl3d_home_body)" filter="url(#fl3d_home_shadow)" />
          <path d="M3.8 14.4C3.1 15 3.3 16 4.2 16H27.8C28.7 16 28.9 15 28.2 14.4L16.8 4.5C16.4 4.1 15.6 4.1 15.2 4.5L3.8 14.4Z" fill="url(#fl3d_home_roof)" />
          <rect x="13" y="19" width="6" height="9" rx="1.5" fill="#F59E0B" />
          <circle cx="17.5" cy="23.5" r="0.75" fill="#FEF3C7" />
        </svg>
      )}
    </div>
  );
};

// 2. Articles - 3D Red Megaphone
export const Fluent3DArticlesIcon: React.FC<Fluent3DIconProps> = ({ className = "w-5 h-5", style }) => (
  <ImageIcon src="/icons/sidebar/update-blogs.png" alt="Update blogs" className={className} style={style} />
);

// 3. Updates - 3D Yellow-Orange (Vàng cam) Sync Arrows
export const Fluent3DUpdatesIcon: React.FC<Fluent3DIconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={`fluent-3d-icon ${className} shrink-0`} style={style}>
    <defs>
      <linearGradient id="fl3d_up_orange_top" x1="4" y1="4" x2="28" y2="16" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="35%" stopColor="#FBBF24" />
        <stop offset="70%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#EA580C" />
      </linearGradient>
      <linearGradient id="fl3d_up_orange_bot" x1="28" y1="28" x2="4" y2="16" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#EA580C" />
        <stop offset="35%" stopColor="#F97316" />
        <stop offset="70%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#FBBF24" />
      </linearGradient>
      <filter id="fl3d_up_shadow" x="-10%" y="-10%" width="125%" height="125%">
        <feDropShadow dx="0" dy="1.5" stdDeviation="1" floodColor="#000" floodOpacity="0.22" />
      </filter>
    </defs>
    {/* Upper Yellow-Orange Arrow */}
    <g filter="url(#fl3d_up_shadow)">
      <path d="M7 16C7 11.0294 11.0294 7 16 7C19.1176 7 21.8676 8.58333 23.5 11" stroke="url(#fl3d_up_orange_top)" strokeWidth="3.8" strokeLinecap="round" />
      <path d="M22 6L25.8 11.2L20.2 12.2" fill="url(#fl3d_up_orange_top)" stroke="url(#fl3d_up_orange_top)" strokeWidth="1.2" strokeLinejoin="round" />
    </g>
    {/* Lower Yellow-Orange Arrow */}
    <g filter="url(#fl3d_up_shadow)">
      <path d="M25 16C25 20.9706 20.9706 25 16 25C12.8824 25 10.1324 23.4167 8.5 21" stroke="url(#fl3d_up_orange_bot)" strokeWidth="3.8" strokeLinecap="round" />
      <path d="M10 26L6.2 20.8L11.8 19.8" fill="url(#fl3d_up_orange_bot)" stroke="url(#fl3d_up_orange_bot)" strokeWidth="1.2" strokeLinejoin="round" />
    </g>
  </svg>
);

// 4. Watch / Movies & TV - Official 2020 Microsoft Movies & TV Films Icon (scaled down slightly)
export const Fluent3DWatchIcon: React.FC<Fluent3DIconProps> = ({ className = "w-5 h-5", style }) => (
  <ImageIcon src="/icons/sidebar/watch.png" alt="Watch" className={className} style={style} />
);

// 4b. Watch
export const Fluent3DWatchPreviewIcon: React.FC<Fluent3DIconProps> = ({ className = "w-5 h-5", style }) => (
  <ImageIcon src="/icons/sidebar/watch-preview.png" alt="Watch" className={className} style={style} />
);

// 5. Gallery - 3D Microsoft Photos / Gallery (scaled down like home, settings, watch)
export const Fluent3DGalleryIcon: React.FC<Fluent3DIconProps> = ({ className = 'w-5 h-5', style }) => {
  const [loadError, setLoadError] = React.useState(false);

  return (
    <div className={`fluent-3d-icon ${className} shrink-0 flex items-center justify-center`} style={style}>
      {!loadError ? (
        <img
          src="https://www.elevenforum.com/data/attachments/73/73114-b7601bc81d404bb12cc522e1acb2fea8.jpg?hash=t2AbyB1AS7"
          alt="Gallery"
          referrerPolicy="no-referrer"
          className="w-[17px] h-[17px] shrink-0 object-contain rounded-[2px]"
          onError={() => setLoadError(true)}
        />
      ) : (
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[17px] h-[17px] shrink-0">
          <defs>
            <linearGradient id="fl3d_gal_back" x1="4" y1="4" x2="24" y2="24" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#A855F7" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>
            <linearGradient id="fl3d_gal_sky" x1="8" y1="8" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="60%" stopColor="#0284C7" />
              <stop offset="100%" stopColor="#1E3A8A" />
            </linearGradient>
            <linearGradient id="fl3d_gal_mount" x1="12" y1="18" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <filter id="fl3d_gal_shadow" x="-10%" y="-10%" width="125%" height="125%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="1" floodColor="#000" floodOpacity="0.22" />
            </filter>
          </defs>
          {/* Back Card */}
          <rect x="4" y="4" width="19" height="19" rx="3.5" fill="url(#fl3d_gal_back)" opacity="0.65" />
          {/* Front Picture Card */}
          <rect x="9" y="8" width="19" height="19" rx="3.5" fill="url(#fl3d_gal_sky)" filter="url(#fl3d_gal_shadow)" />
          {/* Sun */}
          <circle cx="14.5" cy="13.5" r="2.4" fill="#FBBF24" />
          {/* Mountains */}
          <path d="M9 24L14 18L18 22L22 17L28 24V24.5C28 25.8807 26.8807 27 25.5 27H11.5C10.1193 27 9 25.8807 9 24.5V24Z" fill="url(#fl3d_gal_mount)" />
          <path d="M17 23L22 17L28 24V25C28 26.1046 27.1046 27 26 27H21L17 23Z" fill="#10B981" opacity="0.5" />
        </svg>
      )}
    </div>
  );
};

// 6. Draws - 3D Artist Palette WITH PAINT BRUSH (Cọ vẽ)
export const Fluent3DDrawsIcon: React.FC<Fluent3DIconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={`fluent-3d-icon ${className} shrink-0`} style={style}>
    <defs>
      <linearGradient id="fl3d_draw_palette" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FDE68A" />
        <stop offset="50%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
      <linearGradient id="fl3d_draw_brush_handle" x1="14" y1="26" x2="28" y2="12" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#B45309" />
        <stop offset="60%" stopColor="#D97706" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
      <linearGradient id="fl3d_draw_ferrule" x1="18" y1="18" x2="22" y2="14" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#E2E8F0" />
        <stop offset="50%" stopColor="#94A3B8" />
        <stop offset="100%" stopColor="#CBD5E1" />
      </linearGradient>
      <filter id="fl3d_draw_shadow" x="-10%" y="-10%" width="125%" height="125%">
        <feDropShadow dx="0" dy="1.5" stdDeviation="1.2" floodColor="#000" floodOpacity="0.25" />
      </filter>
    </defs>
    {/* Palette Base */}
    <g filter="url(#fl3d_draw_shadow)">
      <path d="M15 4C8.5 4 4 8.8 4 15C4 18.5 5.5 21.5 8 23.5C9.5 25 11 26.5 11 27C11 27.5 11.5 27.8 12 27.8H13.5C14.2 27.8 14.8 27.2 14.8 26.5C14.8 25 16 23.5 18 23.5C23.2 23.5 26.5 20 26.5 15C26.5 8.8 21.5 4 15 4Z" fill="url(#fl3d_draw_palette)" />
      {/* Thumb Hole */}
      <ellipse cx="20.5" cy="18" rx="2" ry="2.2" fill="#78350F" opacity="0.35" />
      {/* Paint Drops */}
      <circle cx="9" cy="10" r="2.2" fill="#EF4444" />
      <circle cx="8.4" cy="9.2" r="0.6" fill="#FEE2E2" />
      <circle cx="15" cy="7.5" r="2.2" fill="#3B82F6" />
      <circle cx="14.4" cy="6.7" r="0.6" fill="#EFF6FF" />
      <circle cx="21" cy="10.5" r="2.2" fill="#10B981" />
      <circle cx="20.4" cy="9.7" r="0.6" fill="#ECFDF5" />
      <circle cx="8" cy="16.5" r="2" fill="#A855F7" />
      <circle cx="7.5" cy="15.8" r="0.5" fill="#FAF5FF" />
    </g>
    {/* Paint Brush across palette */}
    <g filter="url(#fl3d_draw_shadow)">
      {/* Brush Handle */}
      <path d="M29 5L24 10L21.5 12.5L20 14L22 16L23.5 14.5L26 12L31 7C31.5 6.5 31.5 5.5 31 5C30.5 4.5 29.5 4.5 29 5Z" fill="url(#fl3d_draw_brush_handle)" />
      {/* Metal Ferrule */}
      <path d="M20 14L17.5 16.5L19.5 18.5L22 16L20 14Z" fill="url(#fl3d_draw_ferrule)" />
      {/* Bristles tip with vibrant paint */}
      <path d="M17.5 16.5L14 20C13.5 20.5 13.5 21.5 14 22L14.5 22.5L16.5 20.5L17 19L19.5 18.5L17.5 16.5Z" fill="#38BDF8" />
      <path d="M14 22C13.2 22.8 12.2 23.5 11.5 24C11.2 24.2 11 23.8 11.2 23.5C11.8 22.8 12.5 21.8 13.5 21L14 22Z" fill="#0284C7" />
    </g>
  </svg>
);

// 7. Notes - 4 Stacked Sticky Notes (Vàng, Xanh lá, Xanh dương, Đỏ)
export const Fluent3DNotesIcon: React.FC<Fluent3DIconProps> = ({ className = "w-5 h-5", style }) => (
  <ImageIcon src="/icons/sidebar/notes.png" alt="Notes" className={className} style={style} />
);

// 8. Screenbug - 3D Fluent Media Player Icon
export const Fluent3DScreenbugIcon: React.FC<Fluent3DIconProps> = ({ className = "w-5 h-5", style }) => (
  <ImageIcon src="https://cdn3d.iconscout.com/3d/premium/thumb/play-button-3d-icon-png-download-13354190.png" alt="Screenbug" className={className} style={style} />
);
export const Fluent3DVlcIcon = Fluent3DScreenbugIcon;

// 9. Craftmine - 3D Isometric Minecraft Grass Block
export const Fluent3DCraftmineIcon: React.FC<Fluent3DIconProps> = ({ className = "w-5 h-5", style }) => (
  <ImageIcon src="/icons/sidebar/craftmine.png" alt="Craftmine" className={className} style={style} pixelated />
);

// 10. Photopea - 3D Vibrant Photopea Tile
export const Fluent3DPhotopeaIcon: React.FC<Fluent3DIconProps> = ({ className = "w-5 h-5", style }) => (
  <ImageIcon src="/icons/sidebar/photopea.png" alt="Photopea" className={className} style={style} />
);

// 11. Discord - 3D Microsoft Fluent Discord Clyde
export const Fluent3DDiscordIcon: React.FC<Fluent3DIconProps> = ({ className = 'w-5 h-5', style }) => (
  <img
    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-aIiiyqCXj2M4Gy2HPiavRZwWekqrS1.png"
    alt="Discord"
    className={`fluent-3d-icon ${className} shrink-0 object-contain`}
    style={style}
  />
);

// 12. Sign In / User - 3D Microsoft Fluent Profile Avatar WITH GRAY BACKGROUND (Background is gray)
export const Fluent3DUserIcon: React.FC<Fluent3DIconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={`fluent-3d-icon ${className} shrink-0`} style={style}>
    <defs>
      <linearGradient id="fl3d_user_gray_bg" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#9CA3AF" />
        <stop offset="50%" stopColor="#6B7280" />
        <stop offset="100%" stopColor="#4B5563" />
      </linearGradient>
      <linearGradient id="fl3d_user_body" x1="8" y1="18" x2="24" y2="28" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#E2E8F0" />
      </linearGradient>
      <filter id="fl3d_user_shadow" x="-10%" y="-10%" width="125%" height="125%">
        <feDropShadow dx="0" dy="1.5" stdDeviation="1.2" floodColor="#000" floodOpacity="0.25" />
      </filter>
    </defs>
    {/* Circle badge with Gray background */}
    <circle cx="16" cy="16" r="12" fill="url(#fl3d_user_gray_bg)" filter="url(#fl3d_user_shadow)" />
    {/* Inner rim highlight */}
    <circle cx="16" cy="16" r="11" stroke="#D1D5DB" strokeWidth="1" opacity="0.4" />
    {/* Head */}
    <circle cx="16" cy="12" r="4.2" fill="url(#fl3d_user_body)" />
    {/* Shoulders */}
    <path d="M8.5 24C8.5 19.8 11.8 18 16 18C20.2 18 23.5 19.8 23.5 24C23.5 25.2 22.5 26.5 21 26.5H11C9.5 26.5 8.5 25.2 8.5 24Z" fill="url(#fl3d_user_body)" />
  </svg>
);

// 13. Settings - Official Windows 2020 Settings Gear (Settings_Windows_2020.svg, scaled down slightly)
export const Fluent3DSettingsIcon: React.FC<Fluent3DIconProps> = ({ className = 'w-5 h-5', style }) => (
  <div className={`fluent-3d-icon ${className} shrink-0 flex items-center justify-center`} style={style}>
    <svg
      viewBox="0 0 651 612.4"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-[17.5px] h-[17.5px] shrink-0"
    >
      <defs>
        <linearGradient id="fl3d_win2020_gear" x1="325.5" y1="612.4" x2="325.5" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#69757C" />
          <stop offset="0.5" stopColor="#7E8890" />
          <stop offset="1" stopColor="#878F95" />
        </linearGradient>
        <linearGradient id="fl3d_win2020_blue" x1="325.5" y1="470.7" x2="325.5" y2="141.7" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1C3A6D" />
          <stop offset="1" stopColor="#154687" />
        </linearGradient>
        <linearGradient id="fl3d_win2020_inner" x1="325.5" y1="418.7" x2="325.5" y2="193.7" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#D4D3D8" />
          <stop offset="1" stopColor="#FFFFFF" />
        </linearGradient>
      </defs>
      <path
        fill="url(#fl3d_win2020_gear)"
        d="M651,306.2c0,18.7-1.6,37-4.6,54.8c-1.1,6.6-6.8,11.5-13.5,11.6c-38.3,0.6-75.3,20.7-95.9,56.2 c-20.5,35.5-19.4,77.5-1,110.9c3.2,5.9,1.8,13.2-3.3,17.5c-27.6,22.8-59.1,41.2-93.3,54c-6.3,2.3-13.4-0.1-16.9-5.9 c-19.7-32.7-55.5-54.7-96.5-54.7c-41.1,0-77,22-96.7,54.9c-3.4,5.8-10.5,8.2-16.8,5.9c-34.5-12.8-66.3-31.3-94.2-54.3 c-5.2-4.3-6.6-11.6-3.3-17.5c18.5-33.4,19.5-75.4-1-110.9c-20.5-35.6-57.6-55.7-95.9-56.2c-6.7-0.1-12.4-5-13.5-11.6 c-3-17.8-4.6-36.1-4.6-54.8c0-18.7,1.6-37,4.6-54.8c1.1-6.6,6.8-11.5,13.5-11.6c38.3-0.6,75.3-20.7,95.9-56.2 c20.5-35.5,19.4-77.5,1-110.9c-3.2-5.9-1.8-13.2,3.3-17.5c27.6-22.8,59.1-41.2,93.3-54c6.3-2.3,13.4,0.1,16.9,5.9 C248.2,39.8,284,61.7,325,61.7c41.1,0,77-22,96.7-54.9c3.4-5.8,10.5-8.2,16.8-5.9c34.5,12.8,66.3,31.3,94.2,54.3 c5.2,4.3,6.6,11.6,3.3,17.5c-18.5,33.4-19.5,75.4,1,110.9c20.5,35.6,57.6,55.7,95.9,56.2c6.7,0.1,12.4,5,13.5,11.6 C649.4,269.2,651,287.5,651,306.2z"
      />
      <circle cx="325.5" cy="306.2" r="164.5" fill="url(#fl3d_win2020_blue)" />
      <circle cx="325.5" cy="306.2" r="112.5" fill="url(#fl3d_win2020_inner)" />
    </svg>
  </div>
);

// 14. Folder Search / Search in Folder - Microsoft Fluent Design Colored 3D Folder with 3D Magnifying Glass
export const Fluent3DFolderSearchIcon: React.FC<Fluent3DIconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`fluent-3d-icon ${className} shrink-0`}
    style={style}
  >
    <defs>
      {/* Folder Back Tab & Base Gradients */}
      <linearGradient id="fl3d_fsearch_back" x1="4" y1="6" x2="28" y2="24" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#F59E0B" />
        <stop offset="50%" stopColor="#D97706" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>
      {/* Folder Front Flap Gradient */}
      <linearGradient id="fl3d_fsearch_front" x1="4" y1="11" x2="28" y2="26" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="35%" stopColor="#FBBF24" />
        <stop offset="75%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
      {/* Magnifier Rim Gradient (Vibrant Azure 3D) */}
      <linearGradient id="fl3d_fsearch_rim" x1="10" y1="9" x2="23" y2="22" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#60A5FA" />
        <stop offset="30%" stopColor="#38BDF8" />
        <stop offset="70%" stopColor="#0284C7" />
        <stop offset="100%" stopColor="#0369A1" />
      </linearGradient>
      {/* Magnifier Handle Gradient */}
      <linearGradient id="fl3d_fsearch_handle" x1="19" y1="20" x2="28" y2="29" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#94A3B8" />
        <stop offset="30%" stopColor="#475569" />
        <stop offset="70%" stopColor="#1E293B" />
        <stop offset="100%" stopColor="#0F172A" />
      </linearGradient>
      {/* Magnifier Glass Lens Gradient */}
      <linearGradient id="fl3d_fsearch_glass" x1="11" y1="10" x2="21" y2="20" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.88" />
        <stop offset="45%" stopColor="#7DD3FC" stopOpacity="0.65" />
        <stop offset="100%" stopColor="#0284C7" stopOpacity="0.82" />
      </linearGradient>
      {/* Drop Shadows */}
      <filter id="fl3d_fsearch_shadow" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="0" dy="1.5" stdDeviation="1" floodColor="#000000" floodOpacity="0.25" />
      </filter>
      <filter id="fl3d_fsearch_mag_shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0.5" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.32" />
      </filter>
    </defs>

    {/* Folder Back with Tab */}
    <g filter="url(#fl3d_fsearch_shadow)">
      <path
        d="M3.5 8.5C3.5 7.4 4.4 6.5 5.5 6.5H11.2C12 6.5 12.7 6.9 13.2 7.5L14.7 9.5C15 9.9 15.5 10.2 16.1 10.2H26.5C27.6 10.2 28.5 11.1 28.5 12.2V23C28.5 24.1 27.6 25 26.5 25H5.5C4.4 25 3.5 24.1 3.5 23V8.5Z"
        fill="url(#fl3d_fsearch_back)"
      />
      {/* Folder Inside Shadow / Depth */}
      <path
        d="M4.5 11.5H27.5V13H4.5V11.5Z"
        fill="#78350F"
        opacity="0.35"
      />
      {/* Peeking White Paper Sheet inside folder */}
      <path
        d="M6 8.5C6 7.9 6.4 7.5 7 7.5H20.5C21.1 7.5 21.5 7.9 21.5 8.5V13H6V8.5Z"
        fill="#FFFFFF"
        opacity="0.9"
      />
      <line x1="8.5" y1="9.8" x2="15.5" y2="9.8" stroke="#93C5FD" strokeWidth="1" strokeLinecap="round" />
    </g>

    {/* Folder Front Pocket Flap */}
    <g filter="url(#fl3d_fsearch_shadow)">
      <path
        d="M2.5 12.5C2.5 11.4 3.4 10.5 4.5 10.5H27.5C28.6 10.5 29.5 11.4 29.5 12.5V23.5C29.5 24.6 28.6 25.5 27.5 25.5H4.5C3.4 25.5 2.5 24.6 2.5 23.5V12.5Z"
        fill="url(#fl3d_fsearch_front)"
      />
      {/* Top 3D Gloss Highlight Edge on Front Flap */}
      <path
        d="M4.5 11H27.5"
        stroke="#FEF9C3"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.8"
      />
      {/* Bottom subtle shadow on front flap */}
      <path
        d="M4.5 25H27.5"
        stroke="#B45309"
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.4"
      />
    </g>

    {/* 3D Magnifying Glass superimposed in 3D */}
    <g filter="url(#fl3d_fsearch_mag_shadow)">
      {/* 3D Cylindrical Handle */}
      <path
        d="M19.8 21.2L25.6 27C26.2 27.6 27.2 27.6 27.8 27C28.4 26.4 28.4 25.4 27.8 24.8L22 19L19.8 21.2Z"
        fill="url(#fl3d_fsearch_handle)"
      />
      {/* Metallic Ferrule Ring between Handle and Lens Rim */}
      <rect
        x="19"
        y="19"
        width="3"
        height="1.5"
        rx="0.5"
        transform="rotate(45 19 19)"
        fill="#E2E8F0"
      />
      {/* Outer 3D Bevel Lens Rim */}
      <circle cx="15" cy="15.5" r="5.6" fill="url(#fl3d_fsearch_rim)" />
      {/* Inner Lens Rim Highlight */}
      <circle cx="15" cy="15.5" r="4.3" stroke="#BAE6FD" strokeWidth="0.5" opacity="0.6" />
      {/* Glass Lens (Translucent 3D Glass) */}
      <circle cx="15" cy="15.5" r="4.1" fill="url(#fl3d_fsearch_glass)" />
      {/* Specular Curved Reflection Gleam on Top-Left of Glass */}
      <path
        d="M12.5 13C13.2 12.3 14.1 11.9 15.1 11.9C15.5 11.9 15.8 12.1 15.7 12.4C15.6 12.7 15.3 12.9 14.9 12.9C14.1 12.9 13.5 13.2 13 13.7C12.7 14 12.4 13.9 12.3 13.6C12.1 13.3 12.2 13.1 12.5 13Z"
        fill="#FFFFFF"
        opacity="0.95"
      />
      {/* Secondary subtle glint */}
      <circle cx="17.2" cy="17.5" r="0.65" fill="#FFFFFF" opacity="0.75" />
    </g>
  </svg>
);

// 15. Search / Magnifying Glass - Microsoft Fluent Design Colored 3D Magnifying Glass
export const Fluent3DSearchIcon: React.FC<Fluent3DIconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`fluent-3d-icon ${className} shrink-0`}
    style={style}
  >
    <defs>
      {/* 3D Cylindrical Handle Gradient */}
      <linearGradient id="fl3d_mag_handle" x1="18.5" y1="18.5" x2="28" y2="28" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#94A3B8" />
        <stop offset="25%" stopColor="#475569" />
        <stop offset="65%" stopColor="#1E293B" />
        <stop offset="100%" stopColor="#0F172A" />
      </linearGradient>
      {/* Metallic Ferrule Collar */}
      <linearGradient id="fl3d_mag_collar" x1="17.5" y1="17.5" x2="21.5" y2="21.5" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="40%" stopColor="#E2E8F0" />
        <stop offset="100%" stopColor="#64748B" />
      </linearGradient>
      {/* 3D Rim Gradient (Fluent Azure / Windows Blue) */}
      <linearGradient id="fl3d_mag_rim" x1="5" y1="4" x2="22" y2="21" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#60A5FA" />
        <stop offset="35%" stopColor="#38BDF8" />
        <stop offset="70%" stopColor="#0284C7" />
        <stop offset="100%" stopColor="#0369A1" />
      </linearGradient>
      {/* Inner Rim Bevel */}
      <linearGradient id="fl3d_mag_inner_rim" x1="6" y1="5" x2="20" y2="19" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#BAE6FD" />
        <stop offset="100%" stopColor="#0284C7" />
      </linearGradient>
      {/* Translucent Glass Lens Gradient */}
      <linearGradient id="fl3d_mag_glass" x1="6.5" y1="5.5" x2="19.5" y2="18.5" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#F0F9FF" stopOpacity="0.9" />
        <stop offset="40%" stopColor="#7DD3FC" stopOpacity="0.55" />
        <stop offset="85%" stopColor="#0284C7" stopOpacity="0.75" />
        <stop offset="100%" stopColor="#0369A1" stopOpacity="0.85" />
      </linearGradient>
      {/* Drop Shadow */}
      <filter id="fl3d_mag_shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0.5" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.32" />
      </filter>
    </defs>
    <g filter="url(#fl3d_mag_shadow)">
      {/* 3D Cylindrical Handle */}
      <path
        d="M19.2 19.2L26.8 26.8C27.4 27.4 28.4 27.4 29 26.8C29.6 26.2 29.6 25.2 29 24.6L21.4 17L19.2 19.2Z"
        fill="url(#fl3d_mag_handle)"
      />
      {/* Metallic Ferrule Ring between Handle and Lens Rim */}
      <rect
        x="18.5"
        y="18.5"
        width="3.5"
        height="1.8"
        rx="0.6"
        transform="rotate(45 18.5 18.5)"
        fill="url(#fl3d_mag_collar)"
      />
      {/* Outer 3D Bevel Lens Rim */}
      <circle cx="13" cy="13" r="8.5" fill="url(#fl3d_mag_rim)" />
      {/* Inner Lens Rim Highlight */}
      <circle cx="13" cy="13" r="6.5" fill="url(#fl3d_mag_inner_rim)" />
      {/* Translucent Glass Lens */}
      <circle cx="13" cy="13" r="5.8" fill="url(#fl3d_mag_glass)" />
      {/* Specular Curved Reflection Gleam on Top-Left of Glass */}
      <path
        d="M9.5 9.5C10.5 8.5 11.8 8 13.2 8C13.8 8 14.1 8.3 14 8.7C13.9 9.1 13.5 9.3 13 9.3C11.9 9.3 11 9.7 10.3 10.4C9.9 10.8 9.5 10.7 9.3 10.3C9.1 9.9 9.2 9.7 9.5 9.5Z"
        fill="#FFFFFF"
        opacity="0.95"
      />
      {/* Secondary subtle glint */}
      <circle cx="16" cy="16" r="0.9" fill="#FFFFFF" opacity="0.75" />
    </g>
  </svg>
);

// 16. Calculator - Microsoft Fluent Design Colored 3D Calculator
export const Fluent3DCalculatorIcon: React.FC<Fluent3DIconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`fluent-3d-icon ${className} shrink-0`}
    style={style}
  >
    <defs>
      <linearGradient id="fl3d_calc_body" x1="6" y1="3" x2="26" y2="29" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#475569" />
        <stop offset="50%" stopColor="#334155" />
        <stop offset="100%" stopColor="#1E293B" />
      </linearGradient>
      <linearGradient id="fl3d_calc_screen" x1="8" y1="6" x2="24" y2="12" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#0F172A" />
        <stop offset="100%" stopColor="#1E293B" />
      </linearGradient>
      <linearGradient id="fl3d_calc_orange_btn" x1="18" y1="21" x2="24" y2="26" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FB923C" />
        <stop offset="100%" stopColor="#EA580C" />
      </linearGradient>
      <linearGradient id="fl3d_calc_blue_btn" x1="18" y1="14" x2="24" y2="19" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="100%" stopColor="#0284C7" />
      </linearGradient>
      <filter id="fl3d_calc_shadow" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="0" dy="1.5" stdDeviation="1.2" floodColor="#000" floodOpacity="0.28" />
      </filter>
    </defs>
    <g filter="url(#fl3d_calc_shadow)">
      {/* Calculator Body */}
      <rect x="5.5" y="3.5" width="21" height="25" rx="4.5" fill="url(#fl3d_calc_body)" />
      {/* Top 3D Rim Highlight */}
      <rect x="6" y="4" width="20" height="2" rx="1" fill="#94A3B8" opacity="0.35" />
      {/* Screen Display */}
      <rect x="8" y="6.5" width="16" height="5.5" rx="1.8" fill="url(#fl3d_calc_screen)" />
      <rect x="8" y="6.5" width="16" height="5.5" rx="1.8" stroke="#334155" strokeWidth="0.6" />
      {/* Subtle Digital Digits glow */}
      <rect x="18" y="8.2" width="4" height="2" rx="0.5" fill="#38BDF8" opacity="0.9" />
      <rect x="14" y="8.2" width="3" height="2" rx="0.5" fill="#38BDF8" opacity="0.6" />

      {/* Row 1 Keys */}
      <rect x="8" y="14" width="3.5" height="3" rx="1" fill="#64748B" />
      <rect x="12.5" y="14" width="3.5" height="3" rx="1" fill="#64748B" />
      <rect x="17" y="14" width="3.5" height="3" rx="1" fill="#64748B" />
      <rect x="21.5" y="14" width="2.5" height="3" rx="1" fill="url(#fl3d_calc_blue_btn)" />

      {/* Row 2 Keys */}
      <rect x="8" y="18" width="3.5" height="3" rx="1" fill="#64748B" />
      <rect x="12.5" y="18" width="3.5" height="3" rx="1" fill="#64748B" />
      <rect x="17" y="18" width="3.5" height="3" rx="1" fill="#64748B" />
      <rect x="21.5" y="18" width="2.5" height="3" rx="1" fill="url(#fl3d_calc_blue_btn)" />

      {/* Row 3 Keys */}
      <rect x="8" y="22" width="3.5" height="3" rx="1" fill="#64748B" />
      <rect x="12.5" y="22" width="3.5" height="3" rx="1" fill="#64748B" />
      <rect x="17" y="22" width="7" height="3" rx="1" fill="url(#fl3d_calc_orange_btn)" />
    </g>
  </svg>
);

// 17. Maps - Microsoft Fluent Design Colored 3D Folded Map with Pin
export const Fluent3DMapsIcon: React.FC<Fluent3DIconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`fluent-3d-icon ${className} shrink-0`}
    style={style}
  >
    <defs>
      <linearGradient id="fl3d_map_left" x1="4" y1="7" x2="11" y2="27" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="60%" stopColor="#0284C7" />
        <stop offset="100%" stopColor="#0369A1" />
      </linearGradient>
      <linearGradient id="fl3d_map_mid" x1="11" y1="4" x2="19" y2="24" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#86EFAC" />
        <stop offset="60%" stopColor="#22C55E" />
        <stop offset="100%" stopColor="#15803D" />
      </linearGradient>
      <linearGradient id="fl3d_map_right" x1="19" y1="7" x2="26" y2="27" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="60%" stopColor="#EAB308" />
        <stop offset="100%" stopColor="#CA8A04" />
      </linearGradient>
      <linearGradient id="fl3d_map_pin" x1="17" y1="5" x2="25" y2="17" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#EF4444" />
        <stop offset="70%" stopColor="#DC2626" />
        <stop offset="100%" stopColor="#991B1B" />
      </linearGradient>
      <filter id="fl3d_map_shadow" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="0" dy="1.5" stdDeviation="1.2" floodColor="#000" floodOpacity="0.25" />
      </filter>
      <filter id="fl3d_pin_shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0.5" dy="2" stdDeviation="1" floodColor="#000" floodOpacity="0.35" />
      </filter>
    </defs>
    <g filter="url(#fl3d_map_shadow)">
      {/* Left Fold */}
      <path d="M5 8.5L12 5.5V23.5L5 26.5V8.5Z" fill="url(#fl3d_map_left)" />
      {/* Middle Fold */}
      <path d="M12 5.5L19 8.5V26.5L12 23.5V5.5Z" fill="url(#fl3d_map_mid)" />
      {/* Right Fold */}
      <path d="M19 8.5L26 5.5V23.5L19 26.5V8.5Z" fill="url(#fl3d_map_right)" />
      {/* Road / Path across folds */}
      <path d="M5 16L12 14L19 18L26 15" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
    </g>
    {/* 3D Location Pin */}
    <g filter="url(#fl3d_pin_shadow)">
      <path
        d="M21 5.5C18.5 5.5 16.5 7.5 16.5 10C16.5 13.5 21 19 21 19C21 19 25.5 13.5 25.5 10C25.5 7.5 23.5 5.5 21 5.5Z"
        fill="url(#fl3d_map_pin)"
      />
      <circle cx="21" cy="9.8" r="1.8" fill="#FFFFFF" />
    </g>
  </svg>
);

// 18. Mail & Calendar - Microsoft Fluent Design Colored 3D Mail & Calendar
export const Fluent3DMailIcon: React.FC<Fluent3DIconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`fluent-3d-icon ${className} shrink-0`}
    style={style}
  >
    <defs>
      <linearGradient id="fl3d_mail_body" x1="4" y1="8" x2="28" y2="26" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="50%" stopColor="#0284C7" />
        <stop offset="100%" stopColor="#0369A1" />
      </linearGradient>
      <linearGradient id="fl3d_mail_flap" x1="4" y1="8" x2="28" y2="20" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#60A5FA" />
        <stop offset="100%" stopColor="#2563EB" />
      </linearGradient>
      <linearGradient id="fl3d_mail_cal_top" x1="16" y1="14" x2="28" y2="18" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#EF4444" />
        <stop offset="100%" stopColor="#DC2626" />
      </linearGradient>
      <filter id="fl3d_mail_shadow" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="0" dy="1.5" stdDeviation="1.2" floodColor="#000" floodOpacity="0.25" />
      </filter>
      <filter id="fl3d_cal_badge_shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0.5" dy="1.5" stdDeviation="1" floodColor="#000" floodOpacity="0.3" />
      </filter>
    </defs>
    <g filter="url(#fl3d_mail_shadow)">
      {/* Envelope Back & Body */}
      <rect x="4" y="8" width="24" height="17" rx="3" fill="url(#fl3d_mail_body)" />
      {/* Envelope Flap Fold Lines */}
      <path d="M4 8.5L16 17.5L28 8.5" fill="none" stroke="#BAE6FD" strokeWidth="1.2" opacity="0.6" />
      <path d="M4 24.5L12 17.5" stroke="#075985" strokeWidth="1" opacity="0.4" />
      <path d="M28 24.5L20 17.5" stroke="#075985" strokeWidth="1" opacity="0.4" />
      <path d="M4 9C4 7.9 4.9 7 6 7H26C27.1 7 28 7.9 28 9L16 18L4 9Z" fill="url(#fl3d_mail_flap)" opacity="0.9" />
    </g>
    {/* Mini Calendar Badge overlay bottom right */}
    <g filter="url(#fl3d_cal_badge_shadow)">
      <rect x="17" y="15" width="12" height="12" rx="2.5" fill="#FFFFFF" />
      <path d="M17 17.5C17 16.1 18.1 15 19.5 15H26.5C27.9 15 29 16.1 29 17.5V18.5H17V17.5Z" fill="url(#fl3d_mail_cal_top)" />
      <rect x="19.5" y="21" width="2" height="2" rx="0.5" fill="#3B82F6" />
      <rect x="23.5" y="21" width="2" height="2" rx="0.5" fill="#94A3B8" />
      <rect x="19.5" y="24" width="2" height="2" rx="0.5" fill="#94A3B8" />
      <rect x="23.5" y="24" width="2" height="2" rx="0.5" fill="#94A3B8" />
    </g>
  </svg>
);

export const CAMERA_ICON_URL = 'https://static.wikia.nocookie.net/logopedia/images/3/38/Camera_Win10X.svg/revision/latest/scale-to-width-down/200?cb=20221230185750';

export const Fluent3DCameraIcon: React.FC<Fluent3DIconProps> = ({ className = 'w-5 h-5', style }) => (
  <div className={`fluent-3d-icon ${className} shrink-0 flex items-center justify-center`} style={style}>
    <img
      src={CAMERA_ICON_URL}
      alt="Camera"
      referrerPolicy="no-referrer"
      draggable={false}
      className="fluent-3d-icon w-[18px] h-[18px] shrink-0 object-contain select-none"
    />
  </div>
);


