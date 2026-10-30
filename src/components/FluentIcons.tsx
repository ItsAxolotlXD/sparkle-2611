import React from 'react';

export const SEARCH_SPARKLE_ICON_URL = '/icons/search_sparkle.png';
export const SEARCH_SPARKLE_REMOTE_URL =
  'https://static.wikia.nocookie.net/ep-deo/images/6/6c/Search_sparkle.png/revision/latest/scale-to-width-down/1000?cb=20261015133722';

export const INK_CANVAS_ICON_URL = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-fEvkjm5oELvCI8unT4JL0LhTiPYN3Q.png';

export const FluentInkCanvasIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = 'w-5 h-5', style }) => (
  <img src={INK_CANVAS_ICON_URL} alt="Ink Canvas" className={className} style={style} />
);

export const FLUENT_ICON_URLS = {
  home: 'https://raw.githubusercontent.com/microsoft/fluentui-system-icons/main/assets/Home/SVG/ic_fluent_home_48_regular.svg',
  watch: 'https://raw.githubusercontent.com/microsoft/fluentui-system-icons/refs/heads/main/assets/Movies%20and%20TV/SVG/ic_fluent_movies_and_tv_24_regular.svg',
  liveTv: 'https://raw.githubusercontent.com/microsoft/fluentui-system-icons/refs/heads/main/assets/Movies%20and%20TV/SVG/ic_fluent_movies_and_tv_24_regular.svg',
  news: 'https://raw.githubusercontent.com/microsoft/fluentui-system-icons/refs/heads/main/assets/New/SVG/ic_fluent_new_24_regular.svg',
  articles: 'https://raw.githubusercontent.com/microsoft/fluentui-system-icons/refs/heads/main/assets/New/SVG/ic_fluent_new_24_regular.svg',
  notes: 'https://raw.githubusercontent.com/microsoft/fluentui-system-icons/refs/heads/main/assets/Document%20Edit/SVG/ic_fluent_document_edit_24_regular.svg',
  settings: 'https://raw.githubusercontent.com/microsoft/fluentui-system-icons/refs/heads/main/assets/Settings/SVG/ic_fluent_settings_48_regular.svg',
  user: 'https://raw.githubusercontent.com/microsoft/fluentui-system-icons/refs/heads/main/assets/Person/SVG/ic_fluent_person_48_regular.svg',
  personDelete: 'https://raw.githubusercontent.com/microsoft/fluentui-system-icons/refs/heads/main/assets/Person%20Delete/SVG/ic_fluent_person_delete_24_regular.svg',
  personFeedback: 'https://github.com/microsoft/fluentui-system-icons/raw/main/assets/Person%20Feedback/SVG/ic_fluent_person_feedback_48_regular.svg?raw=true',
  delete: 'https://github.com/microsoft/fluentui-system-icons/raw/main/assets/Delete/SVG/ic_fluent_delete_48_regular.svg?raw=true',
  folderAdd: 'https://github.com/microsoft/fluentui-system-icons/raw/main/assets/Folder%20Add/SVG/ic_fluent_folder_add_48_regular.svg?raw=true',
  rename: 'https://github.com/microsoft/fluentui-system-icons/raw/main/assets/Rename%20A/SVG/ic_fluent_rename_a_28_regular.svg?raw=true',
  folderArrowLeft: 'https://github.com/microsoft/fluentui-system-icons/raw/main/assets/Folder%20Arrow%20Left/SVG/ic_fluent_folder_arrow_left_48_regular.svg?raw=true',
  arrowUpload: 'https://github.com/microsoft/fluentui-system-icons/raw/main/assets/Arrow%20Upload/SVG/ic_fluent_arrow_upload_32_regular.svg?raw=true',
  search: SEARCH_SPARKLE_REMOTE_URL,
  gallery: 'https://raw.githubusercontent.com/microsoft/fluentui-system-icons/refs/heads/main/assets/Image%20Multiple/SVG/ic_fluent_image_multiple_24_regular.svg',
  draws: 'https://raw.githubusercontent.com/microsoft/fluentui-system-icons/refs/heads/main/assets/Draw%20Shape/SVG/ic_fluent_draw_shape_24_regular.svg'
};

export const FluentHomeIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = 'w-5 h-5', style }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
    <path d="M21.6062 5.85517C23.0048 4.71494 24.9952 4.71494 26.3938 5.85517L39.5688 16.5966C40.4736 17.3342 41 18.4492 41 19.628V39.1134C41 41.2599 39.2875 43 37.175 43H31.825C29.7125 43 28 41.2599 28 39.1134V29.8866C28 29.1711 27.4292 28.5911 26.725 28.5911H21.275C20.5708 28.5911 20 29.1711 20 29.8866V39.1134C20 41.2599 18.2875 43 16.175 43H10.825C8.71251 43 7 41.2599 7 39.1134V19.628C7 18.4493 7.52645 17.3342 8.43124 16.5966L21.6062 5.85517ZM24.7979 7.87612C24.3317 7.49604 23.6683 7.49604 23.2021 7.87612L10.0271 18.6175C9.72548 18.8634 9.55 19.2351 9.55 19.628V39.1134C9.55 39.8289 10.1208 40.4089 10.825 40.4089H16.175C16.8792 40.4089 17.45 39.8289 17.45 39.1134V29.8866C17.45 27.7401 19.1625 26 21.275 26H26.725C28.8375 26 30.55 27.7401 30.55 29.8866V39.1134C30.55 39.8289 31.1208 40.4089 31.825 40.4089H37.175C37.8792 40.4089 38.45 39.8289 38.45 39.1134V19.628C38.45 19.2351 38.2745 18.8634 37.9729 18.6175L24.7979 7.87612Z" fill="currentColor"/>
  </svg>
);

export const FluentWatchIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = 'w-5 h-5', style }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
    <path d="M19.7289 3.91704L19.7799 4.07669L20.3312 5.99921C20.4359 6.3642 20.2512 6.74361 19.9129 6.89226L19.817 6.92689L9.09009 10.002L20.2492 10.0029C20.6289 10.0029 20.9426 10.2851 20.9923 10.6512L20.9992 10.7529V19.2509C20.9992 20.7135 19.8575 21.9093 18.4167 21.9959L18.2492 22.0009H5.7503C4.28777 22.0009 3.0919 20.8592 3.00532 19.4185L3.0003 19.2509L3.00009 10.859L2.47833 9.03785C2.07521 7.63197 2.84305 6.16773 4.20415 5.68738L4.3638 5.63638L16.3785 2.19122C17.7844 1.7881 19.2486 2.55595 19.7289 3.91704ZM19.4983 11.502H4.5003V19.2509C4.5003 19.855 4.92878 20.359 5.49838 20.4755L5.62249 20.4945L5.7503 20.5009H18.2492C18.8964 20.5009 19.4287 20.0091 19.4927 19.3787L19.4992 19.2509L19.4983 11.502ZM6.27298 6.64938L4.77726 7.07827C4.15512 7.25666 3.77896 7.87622 3.89116 8.49977L3.92018 8.6244L4.26452 9.82525L4.5596 9.74039L6.27298 6.64938ZM11.0293 5.28552L8.31182 6.06475L6.59844 9.15576L9.31593 8.37653L11.0293 5.28552ZM15.7866 3.92139L13.0691 4.70062L11.3557 7.79163L14.0723 7.01268L15.7866 3.92139ZM17.6338 3.68784L16.113 6.4275L18.6815 5.69124L18.3381 4.49015C18.2309 4.11643 17.9645 3.83149 17.6338 3.68784Z" fill="currentColor"/>
  </svg>
);

export const FluentLiveTvIcon = FluentWatchIcon;

export const FluentArticlesIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = 'w-5 h-5', style }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
    <path d="M18.25 4C18.6642 4 19 4.33579 19 4.75V13.25C19 13.6642 18.6642 14 18.25 14C17.8358 14 17.5 13.6642 17.5 13.25V4.75C17.5 4.33579 17.8358 4 18.25 4ZM4 18.25C4 17.8358 4.33579 17.5 4.75 17.5H13.25C13.6642 17.5 14 17.8358 14 18.25C14 18.6642 13.6642 19 13.25 19H4.75C4.33579 19 4 18.6642 4 18.25ZM8.28033 7.21967C7.98744 6.92678 7.51256 6.92678 7.21967 7.21967C6.92678 7.51256 6.92678 7.98744 7.21967 8.28033L13.7197 14.7803C14.0126 15.0732 14.4874 15.0732 14.7803 14.7803C15.0732 14.4874 15.0732 14.0126 14.7803 13.7197L8.28033 7.21967Z" fill="currentColor"/>
  </svg>
);

export const FluentNewsIcon = FluentArticlesIcon;

export const FluentNotesIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = 'w-4 h-4', style }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
    <path d="M6.25 3.5C5.83579 3.5 5.5 3.83579 5.5 4.25V19.75C5.5 20.1642 5.83579 20.5 6.25 20.5H10.0293C9.92216 21.0483 10.0375 21.5732 10.3007 22H6.25C5.00736 22 4 20.9926 4 19.75V4.25C4 3.00736 5.00736 2 6.25 2H12.3358C12.7999 2 13.245 2.18437 13.5732 2.51256L19.4874 8.42678C19.8156 8.75497 20 9.20009 20 9.66421V10H14C12.8954 10 12 9.10457 12 8V3.5H6.25ZM13.5 4.56066V8C13.5 8.27614 13.7239 8.5 14 8.5H17.4393L13.5 4.56066ZM19.7133 11H19.7154C20.3 11.0003 20.8845 11.2234 21.3305 11.6695C22.2231 12.5621 22.2231 14.0093 21.3305 14.9019L15.4281 20.8043C15.084 21.1485 14.6528 21.3926 14.1806 21.5106L12.3499 21.9683C11.5538 22.1674 10.8326 21.4462 11.0317 20.6501L11.4894 18.8194C11.6074 18.3472 11.8515 17.916 12.1957 17.5719L18.0981 11.6695C18.5441 11.2234 19.1287 11.0003 19.7133 11Z" fill="currentColor"/>
  </svg>
);

export const FluentUserIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = 'w-4 h-4', style }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
    <path d="M24 4C18.4772 4 14 8.47715 14 14C14 19.5228 18.4772 24 24 24C29.5228 24 34 19.5228 34 14C34 8.47715 29.5228 4 24 4ZM16.5 14C16.5 9.85786 19.8579 6.5 24 6.5C28.1421 6.5 31.5 9.85786 31.5 14C31.5 18.1421 28.1421 21.5 24 21.5C19.8579 21.5 16.5 18.1421 16.5 14ZM12.2499 28C9.90326 28 8.00002 29.9013 8 32.2489L8 33C8 36.7555 9.94167 39.5669 12.9202 41.3802C15.8491 43.1633 19.7861 44 24 44C28.2139 44 32.1509 43.1633 35.0798 41.3802C38.0583 39.5669 40 36.7555 40 33L40 32.2487C40 29.9011 38.0967 28 35.7502 28H12.2499ZM10.5 32.2489C10.5 31.283 11.283 30.5 12.2499 30.5H35.7502C36.7171 30.5 37.5 31.2829 37.5 32.2488L37.5 33C37.5 35.7444 36.1398 37.8081 33.7798 39.2448C31.3703 40.7117 27.9323 41.5 24 41.5C20.0677 41.5 16.6297 40.7117 14.2202 39.2448C11.8602 37.8081 10.5 35.7444 10.5 33L10.5 32.2489Z" fill="currentColor"/>
  </svg>
);

export const FluentPersonDeleteIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = 'w-4 h-4', style }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
    <path d="M17.5004 12.0003C20.5379 12.0003 23.0004 14.4627 23.0004 17.5003C23.0004 20.5378 20.5379 23.0003 17.5004 23.0003C14.4628 23.0003 12.0004 20.5378 12.0004 17.5003C12.0004 14.4627 14.4628 12.0003 17.5004 12.0003ZM12.0226 13.9996C11.7259 14.4629 11.4864 14.9663 11.314 15.4999L4.25391 15.5002C3.83969 15.5002 3.50391 15.836 3.50391 16.2502V17.1575C3.50391 17.8132 3.7899 18.4362 4.28707 18.8636C5.54516 19.9453 7.44117 20.5013 10.0004 20.5013C10.5992 20.5013 11.1618 20.4709 11.6885 20.4104C11.9374 20.9105 12.2512 21.3743 12.6175 21.7908C11.8153 21.9315 10.9423 22.0013 10.0004 22.0013C7.11087 22.0013 4.87205 21.3447 3.30918 20.001C2.48056 19.2887 2.00391 18.2503 2.00391 17.1575V16.2502C2.00391 15.0075 3.01127 14.0002 4.25391 14.0002L12.0226 13.9996ZM15.0934 14.9665L15.0242 15.0244L14.9663 15.0936C14.8482 15.2642 14.8482 15.4917 14.9663 15.6623L15.0242 15.7315L16.7937 17.5009L15.0268 19.2677L14.9689 19.337C14.8508 19.5075 14.8508 19.7351 14.9689 19.9056L15.0268 19.9749L15.096 20.0327C15.2665 20.1508 15.4941 20.1508 15.6646 20.0327L15.7339 19.9749L17.5007 18.2079L19.2698 19.9771L19.339 20.035C19.5095 20.1531 19.7371 20.1531 19.9076 20.035L19.9769 19.9771L20.0347 19.9079C20.1528 19.7373 20.1528 19.5097 20.0347 19.3392L19.9769 19.27L18.2077 17.5009L19.9796 15.7316L20.0375 15.6623C20.1556 15.4918 20.1556 15.2642 20.0375 15.0937L19.9796 15.0244L19.9104 14.9666C19.7399 14.8485 19.5123 14.8485 19.3418 14.9666L19.2725 15.0244L17.5007 16.794L15.7313 15.0244L15.662 14.9665C15.5159 14.8653 15.3278 14.8508 15.1696 14.9231L15.0934 14.9665ZM10.0004 2.00488C12.7618 2.00488 15.0004 4.24346 15.0004 7.00488C15.0004 9.76631 12.7618 12.0049 10.0004 12.0049C7.23894 12.0049 5.00036 9.76631 5.00036 7.00488C5.00036 4.24346 7.23894 2.00488 10.0004 2.00488ZM10.0004 3.50488C8.06737 3.50488 6.50036 5.07189 6.50036 7.00488C6.50036 8.93788 8.06737 10.5049 10.0004 10.5049C11.9334 10.5049 13.5004 8.93788 13.5004 7.00488C13.5004 5.07189 11.9334 3.50488 10.0004 3.50488Z" fill="currentColor"/>
  </svg>
);

export const FluentSearchIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = 'w-[18px] h-[18px]', style }) => (
  <img
    src={SEARCH_SPARKLE_ICON_URL}
    alt="Search"
    className={`inline-block ${className} object-contain search-sparkle-icon select-none pointer-events-none transition-all duration-150`}
    style={style}
    onError={(e) => {
      const target = e.target as HTMLImageElement;
      if (!target.src.includes('wikia')) {
        target.src = SEARCH_SPARKLE_REMOTE_URL;
      }
    }}
  />
);

export const FluentSettingsIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = 'w-5 h-5', style }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
    <path d="M24 16.4999C19.8579 16.4999 16.5 19.8578 16.5 23.9999C16.5 28.1421 19.8579 31.4999 24 31.4999C28.1421 31.4999 31.5 28.1421 31.5 23.9999C31.5 19.8578 28.1421 16.4999 24 16.4999ZM19 23.9999C19 21.2385 21.2386 18.9999 24 18.9999C26.7614 18.9999 29 21.2385 29 23.9999C29 26.7614 26.7614 28.9999 24 28.9999C21.2386 28.9999 19 26.7614 19 23.9999ZM19.4943 43.468C20.9727 43.8208 22.4874 43.999 24.0073 43.999C25.524 43.9974 27.0353 43.8182 28.5103 43.465C28.898 43.3716 29.2476 43.161 29.5114 42.8618C29.7751 42.5626 29.9402 42.1894 29.9843 41.793L30.3223 38.722C30.3794 38.1728 30.6307 37.662 31.0309 37.2816C31.4311 36.9012 31.9539 36.6762 32.5053 36.647C32.8719 36.6311 33.2372 36.6995 33.5732 36.847L36.3803 38.078C36.6243 38.1877 36.8886 38.2452 37.1562 38.2469C37.4238 38.2487 37.6888 38.1945 37.9343 38.088C38.1807 37.9827 38.4022 37.8266 38.5843 37.63C40.6483 35.4053 42.1891 32.7475 43.0943 29.851C43.2128 29.4667 43.2091 29.0552 43.0837 28.6731C42.9583 28.291 42.7174 27.9573 42.3943 27.718L39.9003 25.878C39.6032 25.6622 39.3614 25.3793 39.1947 25.0522C39.028 24.7251 38.9411 24.3631 38.9411 23.996C38.9411 23.6289 39.028 23.2669 39.1947 22.9398C39.3614 22.6127 39.6032 22.3297 39.9003 22.114L42.3863 20.278C42.7104 20.0383 42.9519 19.7038 43.0774 19.3207C43.2028 18.9376 43.2059 18.5249 43.0863 18.14C42.1808 15.243 40.6381 12.5857 38.5713 10.363C38.2974 10.0703 37.9395 9.86982 37.5469 9.78922C37.1542 9.70861 36.7463 9.75187 36.3793 9.91299L33.5732 11.149C33.2821 11.2802 32.9666 11.3483 32.6473 11.349C32.0711 11.3481 31.5155 11.1345 31.0872 10.7491C30.6588 10.3638 30.3879 9.83385 30.3263 9.26099L29.9863 6.20099C29.9428 5.79937 29.7748 5.42138 29.5058 5.11996C29.2368 4.81855 28.8804 4.60878 28.4863 4.51999C27.019 4.19242 25.5216 4.01847 24.0183 4.00098C22.5043 4.01846 20.9963 4.19274 19.5183 4.521C19.1246 4.60928 18.7684 4.81836 18.4995 5.11905C18.2305 5.41974 18.0623 5.79699 18.0183 6.198L17.6773 9.25998C17.6134 9.83345 17.3403 10.3632 16.9103 10.748C16.471 11.1211 15.9174 11.3328 15.3413 11.348C15.0235 11.3478 14.7092 11.2817 14.4183 11.154L11.6183 9.918C11.25 9.75542 10.8403 9.71157 10.4461 9.79257C10.0518 9.87358 9.69255 10.0754 9.41827 10.37C7.35399 12.5931 5.81275 15.2495 4.90726 18.145C4.78769 18.5298 4.79083 18.9423 4.91627 19.3252C5.0417 19.7081 5.2832 20.0425 5.60726 20.282L8.09626 22.118C8.39089 22.3355 8.63046 22.6191 8.79578 22.9459C8.9611 23.2727 9.04758 23.6337 9.04827 24C9.0486 24.3669 8.9626 24.7286 8.79722 25.0561C8.63183 25.3836 8.3917 25.6675 8.09626 25.885L5.60627 27.724C5.2826 27.9633 5.04136 28.2974 4.91595 28.6799C4.79053 29.0624 4.78714 29.4745 4.90626 29.859C5.80978 32.7571 7.35083 35.4162 9.41627 37.641C9.59569 37.8352 9.81367 37.9898 10.0563 38.095C10.301 38.2026 10.5654 38.2581 10.8328 38.2581C11.1001 38.2581 11.3645 38.2026 11.6093 38.095L14.4283 36.858C14.7191 36.7298 15.0335 36.6637 15.3513 36.664H15.3593C15.9331 36.6647 16.4866 36.8765 16.9144 37.2589C17.3422 37.6414 17.6145 38.1678 17.6793 38.738L18.0173 41.795C18.0614 42.1919 18.227 42.5656 18.4913 42.865C18.7556 43.1644 19.1059 43.375 19.4943 43.468ZM27.5583 41.123C25.2181 41.6234 22.7985 41.6234 20.4583 41.123L20.1543 38.461C20.0221 37.2798 19.4597 36.1886 18.5744 35.3955C17.6891 34.6024 16.5429 34.1629 15.3543 34.161H15.3443C14.6814 34.1583 14.0253 34.2945 13.4183 34.561L10.9723 35.634C9.38518 33.8444 8.17417 31.754 7.41126 29.487L9.57726 27.887C10.1874 27.4371 10.6833 26.8502 11.025 26.1736C11.3668 25.497 11.5449 24.7495 11.5449 23.9915C11.5449 23.2334 11.3668 22.486 11.025 21.8094C10.6833 21.1328 10.1874 20.5459 9.57726 20.096L7.41326 18.496C8.17734 16.2316 9.38828 14.1437 10.9743 12.356L13.4063 13.428C14.0144 13.6972 14.6722 13.8358 15.3373 13.835H15.3473C16.5387 13.8327 17.6877 13.3919 18.5748 12.5966C19.462 11.8012 20.0253 10.7071 20.1573 9.52298L20.4573 6.86298C21.6304 6.6279 22.8229 6.50205 24.0193 6.487C25.2063 6.50208 26.3894 6.62762 27.5533 6.862L27.8533 9.521C27.9816 10.705 28.5424 11.8 29.4281 12.596C30.3139 13.3921 31.4623 13.8333 32.6533 13.835C33.3249 13.8509 33.9911 13.7105 34.5993 13.425L37.0293 12.354C38.6163 14.1415 39.8276 16.2299 40.5913 18.495L38.4343 20.088C37.8198 20.5358 37.3199 21.1226 36.9752 21.8003C36.6305 22.478 36.4508 23.2276 36.4508 23.988C36.4508 24.7483 36.6305 25.4979 36.9752 26.1757C37.3199 26.8534 37.8198 27.4401 38.4343 27.888L40.5993 29.488C39.8348 31.752 38.6243 33.8398 37.0393 35.628L34.5983 34.558C33.9037 34.2496 33.146 34.1098 32.3872 34.1501C31.6283 34.1905 30.8897 34.4098 30.2318 34.7901C29.5738 35.1704 29.0152 35.701 28.6014 36.3384C28.1877 36.9759 27.9307 37.7022 27.8513 38.458L27.5583 41.123Z" fill="currentColor"/>
  </svg>
);

export const FluentCraftmineIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = 'w-5 h-5', style }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
    <path d="M12 2.25L3.75 6.75V17.25L12 21.75L20.25 17.25V6.75L12 2.25Z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 2.25V11.25M12 11.25L3.75 6.75M12 11.25L20.25 6.75M12 11.25V21.75" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7.5 4.5L16.5 9.5M7.5 19.5V14M16.5 19.5V14" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1.5 2"/>
  </svg>
);

export const FluentUpdatesIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = 'w-5 h-5', style }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
    {/* Upper arrow with wide separation */}
    <path d="M4 8.5C5.8 4.8 9.5 2.5 14 2.5C17.8 2.5 20.8 4.5 22 7.5" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round"/>
    <path d="M17.5 8H22V3.5" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Lower arrow with wide separation */}
    <path d="M20 15.5C18.2 19.2 14.5 21.5 10 21.5C6.2 21.5 3.2 19.5 2 16.5" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round"/>
    <path d="M6.5 16H2V20.5" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const FluentGalleryIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = 'w-5 h-5', style }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
    {/* Multi-layered Photos Icon */}
    <rect x="2.5" y="4.5" width="15" height="15" rx="3" stroke="currentColor" strokeWidth="1.75"/>
    <circle cx="7" cy="9" r="1.5" fill="currentColor"/>
    <path d="M3.5 16.5L8 12L12 16L14.5 13.5L17 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6.5 2.5H18.5C20.1569 2.5 21.5 3.84315 21.5 5.5V17.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
  </svg>
);

export const FluentDrawsIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = 'w-5 h-5', style }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
    {/* Artist Palette */}
    <path d="M12 2C6.47715 2 2 6.47715 2 12C2 14.5 3 17 5 18.5C6.5 19.5 7.5 20.5 7.5 21.5C7.5 21.8 7.7 22 8 22H9C9.55228 22 10 21.5523 10 21C10 19.8954 10.8954 19 12 19C16.4183 19 22 16.5 22 12C22 6.47715 17.5228 2 12 2Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="7.5" cy="8.5" r="1.3" fill="currentColor"/>
    <circle cx="12" cy="6.2" r="1.3" fill="currentColor"/>
    <circle cx="16.5" cy="8.5" r="1.3" fill="currentColor"/>
    <circle cx="17.5" cy="13" r="1.3" fill="currentColor"/>
    {/* Paint Brush across palette */}
    <path d="M15 19.5L21.5 13C22 12.5 22 11.7 21.5 11.2C21 10.7 20.2 10.7 19.7 11.2L13.2 17.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M13.2 17.7L11.5 21.5C11.3 22 11.8 22.4 12.2 22.1L15 19.5Z" fill="currentColor"/>
    <line x1="18.5" y1="12.4" x2="20.3" y2="14.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const FluentScreenbugIcon: React.FC<{ className?: string; style?: React.CSSProperties; white?: boolean }> = ({ className = 'w-5 h-5', style, white = false }) => {
  if (white) {
    return (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
        {/* Screen Bezel */}
        <rect x="2" y="3.5" width="20" height="13.5" rx="3" stroke="white" strokeWidth="1.75" strokeOpacity="0.95" />
        {/* Play bug / Screenbug badge in center */}
        <path d="M10 7.5L16 10.25L10 13V7.5Z" fill="white" fillOpacity="0.95" />
        {/* Screen Stand and base */}
        <path d="M12 17V20" stroke="white" strokeWidth="1.75" strokeLinecap="round" />
        <path d="M8 20.5H16" stroke="white" strokeWidth="1.75" strokeLinecap="round" />
        {/* Corner bug glow dot */}
        <circle cx="18.5" cy="6" r="1.2" fill="white" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
      <defs>
        <linearGradient id="screenbug_grad" x1="2" y1="3" x2="22" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4cc2ff" />
          <stop offset="100%" stopColor="#0078d4" />
        </linearGradient>
        <linearGradient id="screenbug_play" x1="9" y1="7" x2="16" y2="13" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#dbeafe" />
        </linearGradient>
      </defs>
      {/* Screen Frame */}
      <rect x="2" y="3.5" width="20" height="13.5" rx="3" stroke="url(#screenbug_grad)" strokeWidth="1.8" />
      <rect x="3" y="4.5" width="18" height="11.5" rx="2" fill="url(#screenbug_grad)" fillOpacity="0.16" />
      {/* Central Screenbug Play Emblem */}
      <path d="M10 7.5L16 10.25L10 13V7.5Z" fill="url(#screenbug_play)" />
      {/* Stand Neck and Foot */}
      <path d="M12 17V20" stroke="url(#screenbug_grad)" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 20.5H16" stroke="url(#screenbug_grad)" strokeWidth="1.8" strokeLinecap="round" />
      {/* Digital On-Screen Graphic (DOG / Screenbug watermark dot) */}
      <circle cx="18.5" cy="6.2" r="1.25" fill="#4cc2ff" />
    </svg>
  );
};

export const FluentVlcIcon = FluentScreenbugIcon;

export const FluentPhotopeaIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = 'w-5 h-5', style }) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
    {/* Photopea rounded frame */}
    <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="1.75" />
    {/* Stylized P character with photo pen curve */}
    <path d="M8.5 7H13.25C14.7688 7 16 8.23122 16 9.75C16 11.2688 14.7688 12.5 13.25 12.5H8.5V17" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" />
    {/* Inner dot or graphic spark accent */}
    <circle cx="12" cy="9.75" r="1" fill="currentColor" />
  </svg>
);

export const FluentPersonFeedbackIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = 'w-5 h-5', style }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
    <path d="M30.27 25C30.03 25 29.78 24.96 29.54 24.88C28.6 24.57 28 23.73 28 22.75V19.94C25.74 19.58 24 17.61 24 15.25V8.75C24 6.13 26.13 4 28.75 4H40.25C42.87 4 45 6.13 45 8.75V15.25C45 17.87 42.87 20 40.25 20H35.13L32.05 24.1C31.61 24.68 30.96 25 30.27 25ZM28.75 6.5C27.51 6.5 26.5 7.51 26.5 8.75V15.25C26.5 16.49 27.51 17.5 28.75 17.5H30.5V22L33.88 17.5H40.26C41.5 17.5 42.51 16.49 42.51 15.25V8.75C42.51 7.51 41.5 6.5 40.26 6.5H28.75ZM16 27.5C11.86 27.5 8.5 24.14 8.5 20C8.5 15.86 11.86 12.5 16 12.5C20.14 12.5 23.5 15.86 23.5 20C23.5 24.14 20.14 27.5 16 27.5ZM16 15C13.24 15 11 17.24 11 20C11 22.76 13.24 25 16 25C18.76 25 21 22.76 21 20C21 17.24 18.76 15 16 15ZM3 34.79C3 34.88 3.15 44 16 44C28.85 44 29 34.88 29 34.79V33.75C29 31.68 27.32 30 25.25 30H6.75C4.68 30 3 31.68 3 33.75V34.79ZM5.5 33.75C5.5 33.06 6.06 32.5 6.75 32.5H25.25C25.94 32.5 26.5 33.06 26.5 33.75V34.78C26.5 35.05 26.28 41.5 16 41.5C5.72 41.5 5.5 35.05 5.5 34.79V33.75Z" fill="currentColor"/>
  </svg>
);

export const FluentDeleteIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = 'w-5 h-5', style }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
    <path d="M20 10.5V11H28V10.5C28 8.29086 26.2091 6.5 24 6.5C21.7909 6.5 20 8.29086 20 10.5ZM17.5 11V10.5C17.5 6.91015 20.4101 4 24 4C27.5899 4 30.5 6.91015 30.5 10.5V11H41.75C42.4404 11 43 11.5596 43 12.25C43 12.9404 42.4404 13.5 41.75 13.5H38.8325L36.8329 37.3556C36.518 41.1117 33.3775 44 29.6082 44H18.3923C14.623 44 11.4825 41.1118 11.1676 37.3557L9.16749 13.5H6.25C5.55964 13.5 5 12.9404 5 12.25C5 11.5596 5.55964 11 6.25 11H17.5ZM13.6589 37.1469C13.8652 39.6077 15.9228 41.5 18.3923 41.5H29.6082C32.0777 41.5 34.1353 39.6077 34.3416 37.1468L36.3238 13.5H11.6763L13.6589 37.1469ZM21.5 20.25C21.5 19.5596 20.9404 19 20.25 19C19.5596 19 19 19.5596 19 20.25V34.75C19 35.4404 19.5596 36 20.25 36C20.9404 36 21.5 35.4404 21.5 34.75V20.25ZM27.75 19C28.4404 19 29 19.5596 29 20.25V34.75C29 35.4404 28.4404 36 27.75 36C27.0596 36 26.5 35.4404 26.5 34.75V20.25C26.5 19.5596 27.0596 19 27.75 19Z" fill="currentColor"/>
  </svg>
);

export const FluentFolderAddIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = 'w-5 h-5', style }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
    <path d="M6.5 12.25V16H16.7145C17.046 16 17.3639 15.8683 17.5983 15.6339L20.9822 12.25L17.5983 8.86612C17.3639 8.6317 17.046 8.5 16.7145 8.5H10.25C8.17893 8.5 6.5 10.1789 6.5 12.25ZM4 12.25C4 8.79822 6.79822 6 10.25 6H16.7145C17.709 6 18.6629 6.39509 19.3661 7.09835L23.2678 11H37.75C41.2018 11 44 13.7982 44 17.25V24.6191C43.2476 23.8971 42.4086 23.2647 41.5 22.7392V17.25C41.5 15.1789 39.8211 13.5 37.75 13.5H23.2678L19.3661 17.4017C18.6629 18.1049 17.709 18.5 16.7145 18.5H6.5V34.75C6.5 36.8211 8.17893 38.5 10.25 38.5H22.7999C23.1255 39.3823 23.544 40.2196 24.0436 41H10.25C6.79822 41 4 38.2018 4 34.75V12.25ZM46 34C46 40.0751 41.0751 45 35 45C28.9249 45 24 40.0751 24 34C24 27.9249 28.9249 23 35 23C41.0751 23 46 27.9249 46 34ZM36 27C36 26.4477 35.5523 26 35 26C34.4477 26 34 26.4477 34 27V33H28C27.4477 33 27 33.4477 27 34C27 34.5523 27.4477 35 28 35H34V41C34 41.5523 34.4477 42 35 42C35.5523 42 36 41.5523 36 41V35H42C42.5523 35 43 34.5523 43 34C43 33.4477 42.5523 33 42 33H36V27Z" fill="currentColor"/>
  </svg>
);

export const FluentRenameIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = 'w-5 h-5', style }) => (
  <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
    <path d="M20.25 2C20.6642 2 21 2.33579 21 2.75C21 3.16421 20.6642 3.5 20.25 3.5H18.498V24.5H20.25C20.6642 24.5 21 24.8358 21 25.25C21 25.6642 20.6642 26 20.25 26H15.25C14.8358 26 14.5 25.6642 14.5 25.25C14.5 24.8358 14.8358 24.5 15.25 24.5H16.998V3.5H15.25C14.8358 3.5 14.5 3.16421 14.5 2.75C14.5 2.33579 14.8358 2 15.25 2H20.25ZM15.998 6.5H5.75391C4.51127 6.5 3.50391 7.50736 3.50391 8.75V19.25C3.50391 20.4926 4.51127 21.5 5.75391 21.5H15.998V23H5.75391C3.68284 23 2.00391 21.3211 2.00391 19.25V8.75C2.00391 6.67893 3.68284 5 5.75391 5H15.998V6.5ZM22.251 5C24.3218 5.00025 26.001 6.67908 26.001 8.75V19.25C26.001 21.3209 24.3218 22.9998 22.251 23H19.498V21.5H22.251C23.4934 21.4998 24.501 20.4925 24.501 19.25V8.75C24.501 7.50751 23.4934 6.50025 22.251 6.5H19.498V5H22.251ZM10 8C10.2901 8 10.5538 8.16744 10.6777 8.42969L14.9277 17.4297C15.1046 17.8042 14.9447 18.2508 14.5703 18.4277C14.1958 18.6046 13.7492 18.4447 13.5723 18.0703L12.3584 15.5H7.6416L6.42773 18.0703C6.25079 18.4447 5.80417 18.6046 5.42969 18.4277C5.05529 18.2508 4.89543 17.8042 5.07227 17.4297L9.32227 8.42969L9.375 8.33594C9.51254 8.12824 9.74618 8 10 8ZM8.34961 14H11.6504L10 10.5049L8.34961 14Z" fill="currentColor"/>
  </svg>
);

export const FluentFolderArrowLeftIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = 'w-5 h-5', style }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
    <path d="M6.5 12.25V16H16.7145C17.046 16 17.3639 15.8683 17.5983 15.6339L20.9822 12.25L17.5983 8.86612C17.3639 8.6317 17.046 8.5 16.7145 8.5H10.25C8.17893 8.5 6.5 10.1789 6.5 12.25ZM4 12.25C4 8.79822 6.79822 6 10.25 6H16.7145C17.709 6 18.6629 6.39509 19.3661 7.09835L23.2678 11H37.75C41.2018 11 44 13.7982 44 17.25V24.6191C43.2476 23.8971 42.4086 23.2647 41.5 22.7392V17.25C41.5 15.1789 39.8211 13.5 37.75 13.5H23.2678L19.3661 17.4017C18.6629 18.1049 17.709 18.5 16.7145 18.5H6.5V34.75C6.5 36.8211 8.17893 38.5 10.25 38.5H22.7999C23.1255 39.3823 23.544 40.2196 24.0436 41H10.25C6.79822 41 4 38.2018 4 34.75V12.25ZM35 45C28.9249 45 24 40.0751 24 34C24 27.9249 28.9249 23 35 23C41.0751 23 46 27.9249 46 34C46 40.0751 41.0751 45 35 45ZM43 34C43 33.4477 42.5523 33 42 33H30.4142L33.7071 29.7071C34.0976 29.3166 34.0976 28.6834 33.7071 28.2929C33.3166 27.9024 32.6834 27.9024 32.2929 28.2929L27.2929 33.2929C26.9024 33.6834 26.9024 34.3166 27.2929 34.7071L32.2929 39.7071C32.6834 40.0976 33.3166 40.0976 33.7071 39.7071C34.0976 39.3166 34.0976 38.6834 33.7071 38.2929L30.4142 35H42C42.5523 35 43 34.5523 43 34Z" fill="currentColor"/>
  </svg>
);

export const FluentArrowUploadIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = 'w-5 h-5', style }) => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
    <path d="M7 2C6.44772 2 6 2.44772 6 3C6 3.55228 6.44772 4 7 4H25C25.5523 4 26 3.55228 26 3C26 2.44772 25.5523 2 25 2H7ZM16.7071 6.29289C16.3166 5.90237 15.6834 5.90237 15.2929 6.29289L8.29289 13.2929C7.90237 13.6834 7.90237 14.3166 8.29289 14.7071C8.68342 15.0976 9.31658 15.0976 9.70711 14.7071L15 9.41421V29C15 29.5523 15.4477 30 16 30C16.5523 30 17 29.5523 17 29V9.41421L22.2929 14.7071C22.6834 15.0976 23.3166 15.0976 23.7071 14.7071C24.0976 14.3166 24.0976 13.6834 23.7071 13.2929L16.7071 6.29289Z" fill="currentColor"/>
  </svg>
);

export const FluentCopyIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = 'w-5 h-5', style }) => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
    <path d="M17 16.5H12.25C10.1789 16.5 8.5 18.1789 8.5 20.25V35.75C8.5 37.8211 10.1789 39.5 12.25 39.5H22.75C24.737 39.5 26.3625 37.9545 26.4912 36H28.9941C28.8629 39.3359 26.118 42 22.75 42H12.25C8.79822 42 6 39.2018 6 35.75V20.25C6 16.7982 8.79822 14 12.25 14H17V16.5ZM35.75 6C39.2018 6 42 8.79822 42 12.25V27.75C42 31.2018 39.2018 34 35.75 34H25.25C21.7982 34 19 31.2018 19 27.75V12.25C19 8.79822 21.7982 6 25.25 6H35.75ZM25.25 8.5C23.1789 8.5 21.5 10.1789 21.5 12.25V27.75C21.5 29.8211 23.1789 31.5 25.25 31.5H35.75C37.8211 31.5 39.5 29.8211 39.5 27.75V12.25C39.5 10.1789 37.8211 8.5 35.75 8.5H25.25Z" fill="currentColor"/>
  </svg>
);

export const FluentDuplicateIcon = FluentCopyIcon;

export const CAMERA_ICON_URL = 'https://static.wikia.nocookie.net/logopedia/images/3/38/Camera_Win10X.svg/revision/latest/scale-to-width-down/200?cb=20221230185750';

export const FluentCameraIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = 'w-5 h-5', style }) => {
  const [loadError, setLoadError] = React.useState(false);

  return (
    <div className={`shrink-0 flex items-center justify-center ${className}`} style={style}>
      {!loadError ? (
        <img
          src={CAMERA_ICON_URL}
          alt="Camera"
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain select-none pointer-events-none"
          onError={() => setLoadError(true)}
        />
      ) : (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-current">
          <path d="M9 3L7.17 5H4C2.9 5 2 5.9 2 7V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V7C22 5.9 21.1 5 20 5H16.83L15 3H9ZM12 18C9.24 18 7 15.76 7 13C7 10.24 9.24 8 12 8C14.76 8 17 10.24 17 13C17 15.76 14.76 18 12 18ZM12 10C10.34 10 9 11.34 9 13C9 14.66 10.34 16 12 16C13.66 16 15 14.66 15 13C15 11.34 13.66 10 12 10Z" fill="currentColor"/>
        </svg>
      )}
    </div>
  );
};

export const Fluent3DCameraIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = 'w-5 h-5', style }) => (
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
