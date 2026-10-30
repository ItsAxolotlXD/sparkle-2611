import React from 'react';

export const SPINNING_RING_GIF_URL =
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ew-d4Dd9KCAbDzszRo6i0Oxnwqq4QFgh6.gif';

// The supplied GIF contains 114 frames with a 30ms delay per frame.
export const SPINNING_RING_GIF_LOOP_DURATION_MS = 114 * 30;

interface SpinningRingProps {
  size?: number;
  /** The GIF defines its own stroke weight; retained for existing call sites. */
  strokeWidth?: number;
  className?: string;
  ariaLabel?: string;
  onGifReady?: () => void;
}

export const SpinningRing: React.FC<SpinningRingProps> = ({
  size = 48,
  className = '',
  ariaLabel = 'Đang tải...',
  onGifReady
}) => (
  <div
    role="status"
    aria-label={ariaLabel}
    className={`inline-flex items-center justify-center select-none pointer-events-none ${className}`}
    style={{ width: size, height: size }}
  >
    <div
      aria-hidden="true"
      data-spinning-ring="true"
      className="winui-gif-progress-ring"
      style={{
        WebkitMaskImage: `url("${SPINNING_RING_GIF_URL}")`,
        maskImage: `url("${SPINNING_RING_GIF_URL}")`
      }}
    />
    {onGifReady && (
      <img
        src={SPINNING_RING_GIF_URL}
        alt=""
        aria-hidden="true"
        className="sr-only"
        loading="eager"
        decoding="async"
        onLoad={onGifReady}
        onError={onGifReady}
      />
    )}
  </div>
);
