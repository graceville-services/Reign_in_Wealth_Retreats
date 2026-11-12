# Delivery verification

The following checks were completed against the delivered source project.

## Application

- Next.js production build completed successfully, including its TypeScript check and standalone server output.
- The separate TypeScript check completed successfully.
- All 17 included server tests passed. They cover authentication, cross-origin writes, destination leads, single-use sign-in links, payment reconciliation and duplicate events, currency totals, promotions, capacity holds, room assignments, refunds, unsubscribe behavior, CSV exports, media requests, and malformed input.
- A production server started with a new, isolated SQLite database. All 26 known public and API URLs in the route check returned HTTP 200. Unknown pages displayed the not-found experience; an unknown retreat also included `noindex` metadata.
- The new database initialized all four announced retreats with paid booking disabled. The bundled logo, hero photograph, font, and application icon served successfully.

## Browser review

- Reviewed the homepage, retreat collection, destination detail, reservation entry, traveler sign-in, and administrator sign-in in the browser.
- Checked the narrow mobile layout and navigation, including a check that the homepage did not overflow horizontally.
- Exercised destination filtering and the image gallery controls.
- Submitted a contact inquiry and a Dubai interest request and confirmed that both were saved.

The ZIP excludes all review submissions, local databases, credentials, development build output, and installed dependencies. Setup generates a new administrator password for the recipient.

## Account and hosting checks still required

Stripe and email behavior has code-level verification; no live account credentials were supplied. Use the acceptance steps in [Launch](LAUNCH.md) to verify your Stripe test payments, webhook delivery, Resend sender/domain, and email sign-in before accepting paid reservations. Installments are payments that travelers initiate from their portal, with scheduled reminders; they are not automatic card debits. Refunds are initiated in Stripe and reconciled through verified webhook events.

The authenticated administration and traveler interfaces are implemented; this review checked their public sign-in screens and the underlying server behavior, rather than a live traveler payment journey. The Docker configuration is supplied, but an actual image build was not run in this workspace. Public hosting, HTTPS, scheduled jobs, and an off-server backup destination require your hosting configuration.

Approved retreat prices, hotels, daily programs, capacity, policies, founder photography, participant media, and testimonials remain owner-supplied content. Destination stock photography is credited in [Assets](ASSETS.md) and is not presented as proof of a past retreat.
