# Optional analytics and conversion events

Analytics are off by default. An empty measurement ID loads no analytics script and renders no analytics banner. The site accepts only a GA4 measurement ID matching `^G-[A-Z0-9]+$`, such as `G-ABC1234567`; the admin cannot insert arbitrary scripts.

## Enable

1. Create a GA4 web data stream for the real website.
2. In the stream's **Enhanced measurement** settings, turn off automatic page views based on browser history and turn off automatic form, outbound-link, video, download, and site-search collection. This website sends its own controlled events. Leaving Google’s automatic measurement enabled can duplicate page views and capture information outside these explicit hooks.
3. Set the measurement ID in **Retreat Studio → Website settings → Policies & tracking**. Explain the configured analytics service in your approved privacy policy.
4. The layout renders `<Analytics measurementId={settings.analyticsId} />` once. The component contains its own Suspense boundary for Next.js navigation hooks.
5. Verify the consent behavior in a fresh browser session, then accept analytics and use GA4 Realtime to confirm a public page view and a successful interest signup. Do not use real traveler data for validation.

The Google tag is requested only after an explicit accepted preference, including an acceptance saved from a previous visit. No analytics tag, analytics cookie, or denied-consent tracking request is initiated while consent is unknown or initially declined. The stored choice contains only `accepted` or `declined`, under a measurement-ID-specific key. Storage failures fall back to the current visit; they never imply acceptance.

A small **Privacy preferences** button on public pages reopens the controls. Declining later sets the documented Google Analytics disable flag, stops this application's tracking hooks, and removes its accessible host-only GA cookies. An already loaded external script cannot be unloaded from memory, but its collection is disabled. Preference changes are synchronized across tabs when browser storage events are available.

## Public page views

Initial and Next.js navigation page views are sent manually, with `send_page_view: false` in the tag configuration. The component observes `usePathname()` and `useSearchParams()` but only records the pathname; query strings and URL fragments are never included. Query-only changes do not duplicate a page view. Referrer parameters are blank, Google signals and advertising personalization are disabled, and no user ID is assigned.

The application does not send events for `/admin`, `/portal`, `/reserve`, `/unsubscribe`, `/api`, or their subpaths. No banner or tag is mounted on those pages. The existing tag is disabled on private-route entry; a capture-phase link guard disables it before in-app private links are followed, and a popstate guard handles browser back/forward navigation. Keep Enhanced measurement off as described above so Google does not independently attach automatic history or form events.

## Conversion hooks

Import the helper only into client components:

```tsx
import { trackEvent } from "@/lib/analytics";

// Only after the interest-list API confirms a successful save:
trackEvent("generate_lead", {
  destination: retreatSlug,
  source: "waitlist",
});

// Only after a community signup is saved:
trackEvent("generate_lead", {
  destination: "all",
  source: "newsletter",
});

// Only after the contact API confirms a successful save:
trackEvent("contact_request", { source: "partnership" });
```

The complete event-name allowlist is `generate_lead`, `contact_request`, and `begin_checkout`. Fields are restricted to a destination slug and one of these source values: `waitlist`, `newsletter`, `information`, `general`, `partnership`, `group`. Extra fields are discarded. Never pass names, email addresses, telephone numbers, messages, booking IDs, payment references, or form values to analytics.

The helper is a no-op before consent, before the tag is ready, when the measurement ID is missing or invalid, and on excluded paths. Events are not queued for later consent. If consent arrives after a form submission, that past submission stays untracked.

`begin_checkout` is provided as a future public funnel hook. It is deliberately not wired to the private reservation form. A click or redirect to Stripe is not a purchase. This project does not emit `purchase` events; any future purchase reporting should be based on a verified payment, a documented consent decision, and a deliberate server integration. Payment, booking, and balance records remain authoritative in the application's database.

## Sources

- Google: [Manual page views and automatic history measurement](https://developers.google.com/analytics/devguides/collection/ga4/views)
- Google: [Disable Google Analytics collection and advertising features](https://developers.google.com/tag-platform/security/guides/privacy)
- Next.js: [Script component lifecycle](https://nextjs.org/docs/app/api-reference/components/script)
