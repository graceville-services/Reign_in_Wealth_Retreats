"use client";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import Link from "next/link";
import { Settings2, ShieldCheck, X } from "lucide-react";
import {
  ANALYTICS_CONSENT_PREFIX,
  clearAnalyticsCookies,
  isAnalyticsAllowedPath,
  setAnalyticsCollection,
  validMeasurementId,
} from "@/lib/analytics";
import "@/styles/analytics.css";

type Preference = "accepted" | "declined" | null;
export default function Analytics({
  measurementId,
}: {
  measurementId: string;
}) {
  const id = measurementId.trim();
  if (!validMeasurementId(id)) return null;
  return (
    <Suspense fallback={null}>
      <AnalyticsWithConsent key={id} measurementId={id} />
    </Suspense>
  );
}
function AnalyticsWithConsent({ measurementId }: { measurementId: string }) {
  const pathname = usePathname();
  const query = useSearchParams();
  const queryKey = query.toString(); // Observe navigation, but never send query parameters.
  const [preference, setPreference] = useState<Preference>(null);
  const [hydrated, setHydrated] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [tagReady, setTagReady] = useState(false);
  const lastPage = useRef<string | null>(null);
  const preferenceRef = useRef<Preference>(null);
  const storageKey = ANALYTICS_CONSENT_PREFIX + measurementId;
  const allowed = isAnalyticsAllowedPath(pathname);

  useEffect(() => {
    let saved: Preference = null;
    try {
      const value = localStorage.getItem(storageKey);
      if (value === "accepted" || value === "declined") saved = value;
    } catch {
      /* Session-only preference when browser storage is unavailable. */
    }
    preferenceRef.current = saved;
    setPreference(saved);
    window.__riwAnalytics = {
      id: measurementId,
      consent:
        saved === "accepted" &&
        isAnalyticsAllowedPath(window.location.pathname),
      ready: Boolean(window.__riwAnalyticsConfigured?.includes(measurementId)),
    };
    setAnalyticsCollection(
      measurementId,
      saved === "accepted" && isAnalyticsAllowedPath(window.location.pathname),
    );
    setHydrated(true);
    const sync = (event: StorageEvent) => {
      if (event.key !== storageKey) return;
      const next: Preference =
        event.newValue === "accepted" || event.newValue === "declined"
          ? event.newValue
          : null;
      preferenceRef.current = next;
      setPreference(next);
      setPreferencesOpen(false);
      setAnalyticsCollection(
        measurementId,
        next === "accepted" && isAnalyticsAllowedPath(window.location.pathname),
      );
      if (next !== "accepted") {
        clearAnalyticsCookies();
        lastPage.current = null;
      }
    };
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("storage", sync);
      setAnalyticsCollection(measurementId, false);
    };
  }, [measurementId, storageKey]);

  // Disable the tag before a visitor follows a link to a private route.
  // The popstate capture handler covers browser back/forward navigation.
  useEffect(() => {
    const beforeLink = (event: MouseEvent) => {
      const element =
        event.target instanceof Element
          ? event.target.closest("a[href]")
          : null;
      if (!(element instanceof HTMLAnchorElement)) return;
      try {
        const target = new URL(element.href, window.location.href);
        if (
          target.origin === window.location.origin &&
          !isAnalyticsAllowedPath(target.pathname)
        )
          setAnalyticsCollection(measurementId, false);
      } catch {
        /* Ignore malformed links. */
      }
    };
    const onPopstate = () =>
      setAnalyticsCollection(
        measurementId,
        preferenceRef.current === "accepted" &&
          isAnalyticsAllowedPath(window.location.pathname),
      );
    document.addEventListener("click", beforeLink, true);
    window.addEventListener("popstate", onPopstate, true);
    return () => {
      document.removeEventListener("click", beforeLink, true);
      window.removeEventListener("popstate", onPopstate, true);
    };
  }, [measurementId]);

  const initialize = useCallback(() => {
    if (
      preferenceRef.current !== "accepted" ||
      !isAnalyticsAllowedPath(window.location.pathname)
    )
      return;
    window.dataLayer = window.dataLayer || [];
    window.gtag =
      window.gtag ||
      function (..._args: unknown[]) {
        window.dataLayer!.push(arguments);
      };
    window.__riwAnalytics = { id: measurementId, consent: true, ready: true };
    setAnalyticsCollection(measurementId, true);
    if (!window.__riwAnalyticsConfigured?.includes(measurementId)) {
      window.gtag("consent", "default", {
        analytics_storage: "granted",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
      window.gtag("js", new Date());
      window.gtag("config", measurementId, {
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        cookie_domain: "none",
        cookie_path: "/",
        cookie_flags: "SameSite=Lax;Secure",
        page_location: window.location.origin + window.location.pathname,
        page_referrer: "",
      });
      window.__riwAnalyticsConfigured = [
        ...(window.__riwAnalyticsConfigured || []),
        measurementId,
      ];
    } else {
      window.gtag("consent", "update", {
        analytics_storage: "granted",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
    }
    setTagReady(true);
  }, [measurementId]);

  useEffect(() => {
    const enabled = hydrated && preference === "accepted" && allowed;
    setAnalyticsCollection(measurementId, enabled);
    if (!enabled) {
      lastPage.current = null;
      return;
    }
    if (!tagReady || !window.gtag) return;
    const page = window.location.pathname;
    if (!isAnalyticsAllowedPath(page) || lastPage.current === page) return;
    const location = window.location.origin + page;
    window.gtag("set", {
      page_location: location,
      page_referrer: "",
      page_title: document.title,
    });
    window.gtag("event", "page_view", {
      send_to: measurementId,
      page_location: location,
      page_path: page,
      page_referrer: "",
      page_title: document.title,
    });
    lastPage.current = page;
  }, [
    allowed,
    hydrated,
    measurementId,
    pathname,
    preference,
    queryKey,
    tagReady,
  ]);

  const choose = (next: Exclude<Preference, null>) => {
    preferenceRef.current = next;
    setPreference(next);
    setPreferencesOpen(false);
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      /* Keep the explicit choice for this visit. */
    }
    const enabled =
      next === "accepted" && isAnalyticsAllowedPath(window.location.pathname);
    setAnalyticsCollection(measurementId, enabled);
    if (!enabled) {
      if (window.__riwAnalytics?.id === measurementId)
        window.__riwAnalytics.consent = false;
      clearAnalyticsCookies();
      lastPage.current = null;
      window.gtag?.("consent", "update", {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
    } else if (window.__riwAnalyticsConfigured?.includes(measurementId))
      initialize();
  };
  if (!hydrated || !allowed) return null;
  return (
    <>
      {preference === "accepted" && (
        <Script
          id={`riw-ga-${measurementId}`}
          src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`}
          strategy="afterInteractive"
          onLoad={initialize}
          onReady={initialize}
          onError={() => {
            setTagReady(false);
            if (window.__riwAnalytics) window.__riwAnalytics.ready = false;
          }}
        />
      )}
      {preference === null || preferencesOpen ? (
        <section
          className="riw-consent"
          aria-label="Optional analytics preferences"
        >
          <div className="riw-consent-head">
            <span>
              <ShieldCheck size={17} strokeWidth={1.5} />A considered experience
            </span>
            {preference !== null && (
              <button
                className="riw-consent-close"
                type="button"
                onClick={() => setPreferencesOpen(false)}
                aria-label="Close analytics preferences"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <h2>May we use optional analytics?</h2>
          <p>
            Analytics cookies help us understand which destinations people
            explore. You can accept, decline, or change your choice anytime.{" "}
            <Link href="/privacy">Privacy policy</Link>
          </p>
          <div className="riw-consent-actions">
            <button type="button" onClick={() => choose("declined")}>
              Decline analytics
            </button>
            <button
              type="button"
              className="riw-consent-accept"
              onClick={() => choose("accepted")}
            >
              Accept analytics
            </button>
          </div>
        </section>
      ) : (
        <button
          type="button"
          className="riw-consent-reopen"
          aria-label="Open analytics preferences"
          onClick={() => setPreferencesOpen(true)}
        >
          <Settings2 size={13} />
          Privacy preferences
        </button>
      )}
    </>
  );
}
