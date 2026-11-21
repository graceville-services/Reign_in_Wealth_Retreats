# Existing shared-hosting setup

- Repository: root `.cpanel.yml`, app under `reign-in-wealth-retreats/`.
- Live app: `/home/reigninw/reign-wealth-retreats-app` (use the actual configured path if different).
- Runtime: `/opt/cpanel/ea-nodejs22/bin/node`, Node.js 22.23.5 or newer.
- Startup file: `app.js` through Passenger.
- Domain: `https://reigninwealthretreats.com`, allowing the HTTPS `www` origin for form requests.
- Data: existing SQLite and local media, retained outside the public web root.

Follow [CPANEL-README.md](CPANEL-README.md) and [the production guide](../docs/PRODUCTION.md). Use `setup:production` on the production host. The ordinary `setup` command intentionally prepares local development settings.

The update creates application secrets only, not mailboxes, provider accounts or TLS certificates. Keep existing database and media paths when preparing production settings.
