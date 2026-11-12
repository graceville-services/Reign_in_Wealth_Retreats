/** Optional GA4 events. Never pass traveler, contact, or payment information here. */
export const ANALYTICS_CONSENT_PREFIX = "riw-analytics-consent:v1:";
export const validMeasurementId = (value: string) =>
  /^G-[A-Z0-9]+$/.test(value);
export const isAnalyticsAllowedPath = (pathname: string) =>
  !/^\/(admin|portal|reserve|unsubscribe|api)(\/|$)/i.test(pathname);
export type AnalyticsEventName =
  | "generate_lead"
  | "contact_request"
  | "begin_checkout";
export type AnalyticsSource =
  | "waitlist"
  | "newsletter"
  | "information"
  | "general"
  | "partnership"
  | "group";
export type AnalyticsFields = {
  destination?: string;
  source?: AnalyticsSource;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    __riwAnalytics?: { id: string; consent: boolean; ready: boolean };
    __riwAnalyticsConfigured?: string[];
  }
}

/** This guard also applies when a component tries to emit an event on a private page. */
export function trackEvent(
  name: AnalyticsEventName,
  fields: AnalyticsFields = {},
): void {
  if (typeof window === "undefined") return;
  const runtime = window.__riwAnalytics;
  if (
    !runtime?.consent ||
    !runtime.ready ||
    !window.gtag ||
    !validMeasurementId(runtime.id) ||
    !isAnalyticsAllowedPath(window.location.pathname)
  )
    return;
  if (!["generate_lead", "contact_request", "begin_checkout"].includes(name))
    return;
  const parameters: Record<string, string> = {
    send_to: runtime.id,
    page_location: window.location.origin + window.location.pathname,
    page_referrer: "",
    page_path: window.location.pathname,
  };
  if (fields.destination && /^[a-z0-9-]{1,100}$/.test(fields.destination))
    parameters.destination = fields.destination;
  if (
    fields.source &&
    [
      "waitlist",
      "newsletter",
      "information",
      "general",
      "partnership",
      "group",
    ].includes(fields.source)
  )
    parameters.source = fields.source;
  window.gtag("event", name, parameters);
}

/** Toggle the documented Google Analytics opt-out flag before route or consent changes. */
export function setAnalyticsCollection(id: string, enabled: boolean): void {
  if (typeof window === "undefined" || !validMeasurementId(id)) return;
  (window as unknown as Record<string, unknown>)[`ga-disable-${id}`] = !enabled;
  if (window.__riwAnalytics?.id === id) window.__riwAnalytics.consent = enabled;
}

/** Tags use host-only cookies, so withdrawing consent can remove their local cookies. */
export function clearAnalyticsCookies(): void {
  if (typeof document === "undefined") return;
  try {
    for (const cookie of document.cookie.split(";")) {
      const name = cookie.split("=")[0]?.trim();
      if (name && /^_ga(?:_|$)|^_gid$|^_gat(?:_|$)/.test(name)) {
        document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
        document.cookie = `${name}=; Max-Age=0; path=/; domain=${window.location.hostname}; SameSite=Lax`;
      }
    }
  } catch {
    /* Browser privacy settings may deny cookie access; collection is already disabled. */
  }
}
