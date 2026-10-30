export interface AppToastDetail {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  id?: string | number;
}

export const showAppToast = (
  message: string,
  actionLabel?: string,
  onAction?: () => void
) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent<AppToastDetail>('app:show-toast', {
        detail: {
          message,
          actionLabel,
          onAction,
          id: Date.now() + Math.random(),
        },
      })
    );
  }
};
