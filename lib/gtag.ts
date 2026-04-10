/**
 * Google Analytics 4 (gtag.js) — helpers para pageviews y eventos personalizados.
 * En desarrollo no envía nada (NODE_ENV !== "production").
 */

export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? "";

const isProd = process.env.NODE_ENV === "production";

function canSend(): boolean {
  return (
    isProd &&
    Boolean(GA_MEASUREMENT_ID) &&
    typeof window !== "undefined" &&
    typeof window.gtag === "function"
  );
}

/**
 * Registra una vista de página (navegación App Router).
 * Usa `gtag('config', ...)` con `page_path` (recomendado para GA4 en SPA).
 */
export function pageview(url: string): void {
  if (!canSend()) return;
  const path = url.startsWith("/") ? url : `/${url}`;
  window.gtag!("config", GA_MEASUREMENT_ID, {
    page_path: path,
  });
}

/**
 * Evento personalizado GA4.
 * @see https://developers.google.com/analytics/devguides/collection/ga4/events
 */
export function event(action: string, params?: Record<string, unknown>): void {
  if (!canSend()) return;
  window.gtag!("event", action, params ?? {});
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export {};
