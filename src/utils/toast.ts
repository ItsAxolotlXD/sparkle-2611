export type AppToastSource = 'settings' | 'search' | 'sidebar' | 'live-tv' | 'gallery' | 'camera';

export interface AppToastOptions {
  source?: AppToastSource;
  title?: string;
  description?: string;
  appName?: string;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

export interface AppToastDetail extends AppToastOptions {
  message: string;
  id?: string | number;
}

export function showAppToast(message: string, options?: AppToastOptions): void;
export function showAppToast(
  message: string,
  actionLabel?: string,
  onAction?: () => void,
  title?: string,
  description?: string,
  appName?: string
): void;
export function showAppToast(
  message: string,
  optionsOrActionLabel?: AppToastOptions | string,
  onAction?: () => void,
  title?: string,
  description?: string,
  appName?: string
) {
  if (typeof window === 'undefined') return;

  const options: AppToastOptions =
    typeof optionsOrActionLabel === 'object' && optionsOrActionLabel !== null
      ? optionsOrActionLabel
      : {
          actionLabel: typeof optionsOrActionLabel === 'string' ? optionsOrActionLabel : undefined,
          onAction,
          title,
          description,
          appName,
        };

  window.dispatchEvent(
    new CustomEvent<AppToastDetail>('app:show-toast', {
      detail: {
        message,
        ...options,
        id: Date.now() + Math.random(),
      },
    })
  );
}

