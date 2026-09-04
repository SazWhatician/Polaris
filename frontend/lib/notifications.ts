import { toast } from "sonner";

export interface NotificationOptions {
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ErrorNotificationOptions extends NotificationOptions {
  error?: unknown;
  retry?: () => void;
}

/**
 * Extracts a human-readable message from an unknown error object.
 */
export function extractErrorMessage(error: unknown, fallback = "An unexpected error occurred."): string {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    const record = error as Record<string, unknown>;
    if (typeof record.message === "string") return record.message;
    if (typeof record.error === "string") return record.error;
    if (typeof record.detail === "string") return record.detail;
  }
  return fallback;
}

/**
 * Dispatches a formatted success notification.
 */
export function notifySuccess(
  title: string,
  description?: string,
  options?: NotificationOptions
) {
  return toast.success(title, {
    description,
    duration: options?.duration ?? 4000,
    action: options?.action
      ? {
          label: options.action.label,
          onClick: options.action.onClick,
        }
      : undefined,
  });
}

/**
 * Dispatches a formatted error notification with friendly recovery tips.
 */
export function notifyError(
  title: string,
  descriptionOrError?: string | unknown,
  options?: ErrorNotificationOptions
) {
  let description: string | undefined;

  if (typeof descriptionOrError === "string") {
    description = descriptionOrError;
  } else if (descriptionOrError) {
    description = extractErrorMessage(descriptionOrError);
  } else if (options?.error) {
    description = extractErrorMessage(options.error);
  }

  return toast.error(title, {
    description,
    duration: options?.duration ?? 6000,
    action: options?.retry
      ? {
          label: "Try Again",
          onClick: options.retry,
        }
      : options?.action
      ? {
          label: options.action.label,
          onClick: options.action.onClick,
        }
      : undefined,
  });
}

/**
 * Dispatches an informational notification.
 */
export function notifyInfo(
  title: string,
  description?: string,
  options?: NotificationOptions
) {
  return toast.info(title, {
    description,
    duration: options?.duration ?? 4500,
    action: options?.action
      ? {
          label: options.action.label,
          onClick: options.action.onClick,
        }
      : undefined,
  });
}
