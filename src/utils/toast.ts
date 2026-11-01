export interface AppToastDetail {
  message: string;
  title?: string;
  description?: string;
  appName?: string;
  actionLabel?: string;
  onAction?: () => void;
  id?: string | number;
  duration?: number;
}

export const showAppToast = (
  message: string,
  actionLabel?: string,
  onAction?: () => void,
  title?: string,
  description?: string,
  appName?: string
) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent<AppToastDetail>('app:show-toast', {
        detail: {
          message,
          actionLabel,
          onAction,
          title,
          description,
          appName,
          id: Date.now() + Math.random(),
        },
      })
    );
  }
};

