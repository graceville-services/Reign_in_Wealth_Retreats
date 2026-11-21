# Photo and production update — November 20, 2026

## What changed

- Integrated all 86 photographs supplied in ARRIVAL, ORPHANAGE and REIGN IN WEALTH / DAY 6.
- Organized the gallery into Arrival & connection (23), Giving back (33), Around the table (15), and Explore Ghana (15).
- Added full-size WebP display images and smaller responsive thumbnails. Both sets together use about 22 MiB, compared with approximately 465 MiB of original photographs.
- Replaced the stock-image homepage with an authentic Ghana waterfall hero and a three-photo overview. The home page now has four main sections: hero, overview, upcoming retreats, and community invitation. The full story is on the gallery and journal pages.
- Updated the Ghana journal, experience, community, social sharing and retreat imagery. Retained the supplied logo and branded favicon.
- Added three original vector illustrations for destinations without supplied photographs: Dubai, Zanzibar and the Dominican Republic. These are labelled as illustrations.
- Removed the nine original stock photographs from the payload. Existing SQLite image references resolve to new assets without rewriting the stored retreat records.
- Added production configuration for https://reigninwealthretreats.com and its HTTPS www origin, secure admin/cron credential generation, configuration validation, and the existing cPanel Passenger deployment path.
- Added an installer with preview, checksums, backups, rollback, and preservation of existing environments, databases and uploads.

## Verification completed

- Next.js production build and TypeScript checks passed.
- All 18 existing application tests passed.
- All 7 installer safety tests passed, including preservation and rollback.
- Sixteen rendered routes/endpoints returned HTTP 200, including the homepage, gallery, filtered gallery, journal, all four destinations, about, contact, admin and health.
- Rendered image references on those pages resolve to local files; there are no missing or externally hosted images in the supplied default content.
- All 86 full-size photographs and 86 thumbnails were checked for valid dimensions, maximum size, and removal of embedded EXIF metadata.
- Existing-database checks confirm legacy image replacement while preserving stored JSON, owner-edited text/prices and custom media paths.
- Production environment preparation and deployed-stock cleanup were checked in isolated fixtures.

## Verification limits

The browser runtime in this execution environment could not launch because its local socket operation was restricted, so desktop/mobile screenshots and real-browser interaction checks could not be completed here. Responsive CSS and gallery controls are included, but visual review in your own browser is still needed after installation. This ZIP was not deployed to the live domain. HTTPS, live provider credentials, email delivery and payment completion must be checked on your production host. The local runtime used Node 24.22.3; your existing Node 22.23.5 host was not directly accessed.

## Complete source and runtime data

The package contains the full updated source application. The installer is intended to overlay your current matching app. Existing data and configuration stay in place. External service keys are not invented or bundled: enter your real Stripe and Resend values in the generated production environment when enabling those services. No new retreat dates, prices or bookings are introduced by this update.
