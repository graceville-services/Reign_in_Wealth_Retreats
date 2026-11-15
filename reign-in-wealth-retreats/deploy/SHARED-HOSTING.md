# cPanel shared hosting deployment (Node.js 22)

Repository layout: root `.cpanel.yml`, and website under `reign-in-wealth-retreats/`.
Production application directory: `/home/reigninw/reign-wealth-retreats-app`.

1. In cPanel Application Manager, change existing app root from `public_html/reign-in-wealth-retreats` to `reign-wealth-retreats-app` if the interface permits. Otherwise remove and recreate only that app registration after making backups; keep the domain at its root. Ensure Passenger runs `/opt/cpanel/ea-nodejs22/bin/node`.
2. SSH: `export PATH=/opt/cpanel/ea-nodejs22/bin:$PATH`
3. Bootstrap: `mkdir -p ~/reign-wealth-retreats-app`; from the Git checkout copy `app.js`, `.env.example`, `package*.json`, `next.config.ts`, `next-env.d.ts`, `tsconfig.json`, `src`, `public`, `scripts`, and `docs` there.
4. In the app directory run `npm run setup`, immediately edit `.env` to set `APP_URL=https://reigninwealthretreats.com`, `DEV_PREVIEW_MODE=false`, and `ADMIN_EMAIL` to a real controlled email. Keep the displayed generated password secure.
5. Run `npm ci --no-audit --no-fund`, `npm run build`; validate using `npm run typecheck`.
6. Create `tmp` and touch `tmp/restart.txt`, then inspect app logs and test HTTPS pages.
7. For future deploys commit all repo changes, then use cPanel Git Update from Remote -> Deploy HEAD Commit.

Warnings: Only deploy if Application Manager uses a Node 22 runtime; Node 16 cannot run Next.js 16. Never copy `.env` or SQLite into Git or public_html. Configure payment/email integrations, scheduled jobs, off-host backups, and SSL before accepting real customers.
