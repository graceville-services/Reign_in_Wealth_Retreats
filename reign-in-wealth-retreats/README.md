# Reign in Wealth Retreats

A complete, independently built retreat website for Reign in Wealth, a business within The Millionaire Chick family. It combines an editorial travel website with a working administration area, individual traveler registration, a traveler portal, and configurable payment and email services.

The design uses the supplied logo, emerald and warm ivory, restrained gold accents, locally hosted typography, and real destination photography. No JUJO code or integrations are required.

## Run it in Codespaces

Extract the ZIP, then open a terminal inside the extracted **`reign-in-wealth-retreats`** folder (the folder containing `package.json`):

```bash
npm install
npm run setup
npm run dev
```

Use **Node.js 24 or newer**. The included dev container uses Node 24. If your existing Codespace has an older version and provides `nvm`, run `nvm install 24` and `nvm use 24` first.

Open the **Ports** panel, find **3000**, and choose **Open in Browser**. Keep the port **Private** while using development preview mode. Setup detects the Codespaces hostname and writes the matching `APP_URL` automatically. If you move this project to another Codespace, update `APP_URL` in `.env` to the new forwarded URL and restart the server.

For reproducible installs after the initial unzip, use `npm ci` instead of `npm install`; a lockfile is included. When this project is used as the repository root, the dev-container lifecycle runs `npm ci` for you. Run `npm run setup` yourself in a private terminal so you can save the generated credentials.

### Open the administrator area

Visit **`/admin`** on the running website. Setup prints the administrator email and a randomly generated password **once**. Save that password in your password manager. Only its scrypt hash is stored in `.env`; there is no shared default password.

Running setup again preserves your existing `.env`. If you lose the password, follow the rotation procedure in [Operations](docs/OPERATIONS.md) rather than deleting your configuration.

### Try the traveler portal

Visit **`/portal`**, enter a test email, and request a sign-in link. In private development mode (`DEV_PREVIEW_MODE=true`, with `NODE_ENV` not set to production), the interface provides a development sign-in link. This lets you inspect the portal before configuring email. The empty portal is intentional: no fictional traveler or payment records are created.

Production never returns development sign-in links. Real traveler sign-in requires configured email delivery.

## What is included

| Area              | Included behavior                                                                                                                                                           |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public website    | Homepage, retreat collection, four destination pages, experience, founder, journal, Ghana 2026 journal framework, testimonials, community, FAQs, contact, and policy pages  |
| Retreat discovery | Dates, destination imagery, itinerary sections, accommodation information, package details, occupancy explanations, and interest/booking calls to action                    |
| Interest capture  | Persistent destination waitlists, community subscriptions, general/group/partnership inquiries, and administrator exports                                                   |
| Reservations      | One traveler per registration; single or double occupancy; roommate preferences; server-validated totals; promotional codes; terms acknowledgment                           |
| Payments          | Stripe Checkout for full payment, deposit, scheduled installment, and remaining balance; signed webhooks; duplicate-event protection; payment and refund reconciliation     |
| Traveler portal   | Email-link sign-in, registrations, schedules, balances, payment actions, receipts, room-assignment information, and retreat announcements                                   |
| Administration    | Retreat and policy editing, dates/pricing/capacity, bookings and room assignments, media uploads, testimonials with consent, inquiries, leads, promotions, and email outbox |
| Operations        | Persistent SQLite data, backup command, email/reminder job command and secured HTTP endpoint, Docker deployment, Codespaces configuration, and GitHub Actions verification  |

## Initial content and availability

The website starts in **interest-list mode**. The four destinations are populated with the dates from the supplied brief:

| Retreat            | Announced travel dates                      |
| ------------------ | ------------------------------------------- |
| Dubai              | December 27, 2026 – January 2, 2027         |
| Ghana              | August 5–15, 2027                           |
| Zanzibar           | September 2027; exact dates to be confirmed |
| Dominican Republic | Coming soon                                 |

Prices, hotels, confirmed daily programs, available seats, public contact details, social profiles, and approved booking policies were not supplied. Those remain unconfigured. Dubai and Ghana contain explicitly proposed itinerary outlines for your team to develop. The founder portrait, real Ghana 2026 media, and authentic testimonials have designated places for your approved content.

Visitors can submit interest and inquiries immediately after setup. Paid reservations open only after you configure the actual package and policies and connect Stripe. Nothing reports a successful payment without a verified provider event.

## Configure your business

Sign in at `/admin` and use the content, retreat, media, and settings sections to:

1. Enter the public email, WhatsApp number, social profiles, and parent-brand website.
2. Upload Kimona Hanson’s approved portrait and your own retreat photography or film.
3. Confirm each destination’s hotel, dates, daily program, inclusions, exclusions, prices, capacity, and cancellation terms.
4. Review and approve the business policies.
5. Connect email and test-mode payments using the setup guide below.
6. Enable reservations only for retreats whose details are ready.

The team can manage these fields through the admin interface. The initial seed file is used only to initialize a new database; changing it later does not overwrite content already edited in the database.

**Start with [Launch guide](docs/LAUNCH.md)** for the exact environment variables, Stripe test procedure, email setup, and launch checklist.

## Common commands

| Command                 | Purpose                                                                                  |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| `npm run dev`           | Start development server on port 3000                                                    |
| `npm run setup`         | Create local configuration and unique administrator credentials if `.env` does not exist |
| `npm exec next typegen` | Generate route types before checking a fresh checkout                                    |
| `npm run typecheck`     | Check TypeScript                                                                         |
| `npm test`              | Run the included server tests                                                            |
| `npm run build`         | Build the production application                                                         |
| `npm start`             | Run the production build; configure an HTTPS `APP_URL` for production use                |
| `npm run jobs`          | Retry email, reconcile pending Checkout sessions, and schedule reminders                 |
| `npm run backup`        | Create a SQLite snapshot and copy uploaded media into a dated backup folder              |

The project uses Next.js 16, React 19, TypeScript, Node’s SQLite API, Lucide icons, Stripe, and Resend’s HTTP API. Dependencies are pinned by `package-lock.json`. Node 24 is required by this project, even if another Next.js application runs on an older Node release.

## Project map

```text
src/app/                 Public pages, reservation/portal/admin entry points, API routes
src/components/          Reusable public and management interfaces
src/data/retreats.ts      First-run content only
src/lib/server/          Database, authentication, validation, payments, email, API
src/lib/types.ts          Shared application contracts
public/images/           Bundled logo and destination photography
public/fonts/            Bundled fonts and their licenses
scripts/                 Setup, backup, and background jobs
tests/                   Server behavior tests
docs/                    Launch, operations, API, design, and asset documentation
```

Generated `data/`, `backups/`, `.env`, `node_modules/`, and `.next/` are runtime/local files. They are not source files to publish or commit.

## Deployment

Use one Node process with a persistent writable disk, or the included Docker Compose configuration. The SQLite database and uploaded media must survive restarts and deployments. The supplied build is not intended for an ephemeral serverless filesystem or multiple independent application replicas.

Docker runs the application as a non-root user and stores application data and backups in named volumes. TLS and the public domain belong to your hosting/reverse-proxy configuration. No live hosting, payment account, email domain, external cron, or off-server backup destination is provisioned by this ZIP.

See [Operations](docs/OPERATIONS.md) for Docker commands, job scheduling, backups, restore, and password rotation. See [API reference](docs/API.md) for integration endpoints and [Analytics](docs/ANALYTICS.md) for consent-aware event tracking. Photography and font credits are in [Assets](docs/ASSETS.md); the design rationale is in [Design](docs/DESIGN.md).

## Integration verification

The code includes automated checks and testable provider integrations. A successful local build or test suite does not mean that your Stripe account, webhook delivery, Resend domain, public hosting, or scheduler has been verified. Follow the sandbox payment and email acceptance steps in the launch guide with your own accounts before opening paid reservations.

See [Delivery verification](docs/VERIFICATION.md) for the completed build, server, and browser checks and the remaining account-specific acceptance steps.


## Deploy using cPanel Git Version Control

See [`deploy/CPANEL-README.md`](deploy/CPANEL-README.md) and the checked-in `.cpanel.yml`. cPanel Git deployment copies/builds the application; the Node.js app manager must still be configured separately.

## New photo gallery and favicon

The `/gallery` page includes an accessible, responsive lightbox and category filters. The new browser favicon is cropped from the supplied Reign in Wealth brand art. The actual traveler photographs are **not** bundled unless approved photos have been imported. See [`docs/GALLERY.md`](docs/GALLERY.md) for how to import the owner-provided Google Drive photos as local optimized WebP images and redeploy with cPanel.
