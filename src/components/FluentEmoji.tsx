import React, { createContext, useContext, useState, type ReactNode } from 'react';
import emojiData from 'fluentui-emoji-js/emojiData.json';
import { useSettings } from '../hooks/useSettings';

const EMOJI_ASSET_BASE = 'https://fluentdeck.vercel.app/emoji/webp/3D';
const EMOJI_VARIATION_SELECTORS = /[\uFE0E\uFE0F]/g;
const EMOJI_TEXT_MARKER = /[\p{Extended_Pictographic}\p{Regional_Indicator}\u20E3]/u;
const EMOJI_TOKEN_PATTERN = /((?:\p{Regional_Indicator}{2}|[#*0-9]\uFE0F?\u20E3|\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?(?:\p{Emoji_Modifier})?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|\uFE0E)?(?:\p{Emoji_Modifier})?)*))/gu;

const normalizeEmoji = (emoji: string) => emoji.replace(EMOJI_VARIATION_SELECTORS, '');
const emojiAssetByGlyph = new Map<string, string>();

for (const emoji of emojiData) {
  const pngFileName = emoji.images['3D']?.[0];
  if (!pngFileName) continue;

  const webpFileName = pngFileName.replace(/\.png$/i, '.webp');
  const assetUrl = `${EMOJI_ASSET_BASE}/${encodeURIComponent(webpFileName)}`;
  emojiAssetByGlyph.set(emoji.glyph, assetUrl);
  emojiAssetByGlyph.set(normalizeEmoji(emoji.glyph), assetUrl);
}

const FlumojsContext = createContext(false);

export const useFlumojsEnabled = () => useContext(FlumojsContext);

export const FlumojsProvider = ({ children }: { children: ReactNode }) => {
  const { settings } = useSettings();

  return (
    <FlumojsContext.Provider value={settings.useFlumojs}>
      {children}
    </FlumojsContext.Provider>
  );
};

interface FluentEmojiProps {
  emoji: string;
  alt?: string;
  className?: string;
  isDecorative?: boolean;
}

export const FluentEmoji: React.FC<FluentEmojiProps> = ({
  emoji,
  alt,
  className,
  isDecorative = false,
}) => {
  const useFlumojs = useContext(FlumojsContext);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const assetUrl = useFlumojs
    ? emojiAssetByGlyph.get(emoji) ?? emojiAssetByGlyph.get(normalizeEmoji(emoji))
    : undefined;

  if (assetUrl && failedSource !== assetUrl) {
    return (
      <img
        src={assetUrl}
        alt={isDecorative ? '' : alt ?? emoji}
        aria-hidden={isDecorative || undefined}
        className={['inline-block align-middle object-contain', className].filter(Boolean).join(' ')}
        loading="lazy"
        decoding="async"
        draggable={false}
        referrerPolicy="no-referrer"
        onError={() => setFailedSource(assetUrl)}
      />
    );
  }

  return (
    <span
      role={isDecorative ? undefined : 'img'}
      aria-label={isDecorative ? undefined : alt ?? emoji}
      aria-hidden={isDecorative || undefined}
      className={['inline-flex items-center justify-center align-middle leading-none', className]
        .filter(Boolean)
        .join(' ')}
    >
      {emoji}
    </span>
  );
};

export const containsEmoji = (text: string) => EMOJI_TEXT_MARKER.test(text);

export const FluentEmojiText: React.FC<{ children: string }> = ({ children }) => (
  <>
    {children.split(EMOJI_TOKEN_PATTERN).map((segment, index) =>
      index % 2 === 1 ? (
        <FluentEmoji
          key={`${index}-${segment}`}
          emoji={segment}
          className="h-[1em] w-[1em]"
        />
      ) : (
        segment
      ),
    )}
  </>
);
