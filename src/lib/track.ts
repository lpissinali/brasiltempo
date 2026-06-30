// Client-side GA4 event helper. No-ops when gtag isn't present (local dev, GA
// disabled/blocked, or the script not yet loaded), so it's always safe to call.
// The GA tag itself is loaded in src/components/Analytics.tsx.
type GtagParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (command: string, eventName: string, params?: GtagParams) => void;
  }
}

export function track(event: string, params?: GtagParams): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  try {
    window.gtag('event', event, params);
  } catch {
    /* never let analytics break the UI */
  }
}
