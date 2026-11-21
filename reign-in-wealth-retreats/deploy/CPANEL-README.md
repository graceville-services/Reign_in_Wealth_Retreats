# cPanel production deployment

This app keeps the existing Next.js / SQLite / local media architecture. Use the Node.js **22.23.5 or newer** runtime already configured for Passenger.

The repository-root `.cpanel.yml` invokes `reign-in-wealth-retreats/deploy/cpanel-deploy.sh`; the app-level `.cpanel.yml` supports a checkout where the app itself is the root. The script copies source into `$HOME/reign-wealth-retreats-app` (overridable with `CPANEL_APP_ROOT`), preserving runtime data there.

Use `app.js` as Passenger's startup file. Keep the app directory outside `public_html`. Configure HTTPS for both `reigninwealthretreats.com` and `www.reigninwealthretreats.com`.

## Prepare and deploy

Read [the complete production guide](../docs/PRODUCTION.md). After copying the updated source into the live application directory:

```bash
export PATH="/opt/cpanel/ea-nodejs22/bin:$PATH"
node scripts/production-env.mjs --admin-email YOUR_CONTROLLED_EMAIL
node scripts/production-env.mjs --admin-email YOUR_CONTROLLED_EMAIL --apply
npm ci --include=dev --no-audit --no-fund
npm run check:production
npm run build
node scripts/cleanup-legacy-images.mjs
mkdir -p tmp
touch tmp/restart.txt
```

Use your actual controlled administrator email. The preview/apply commands preserve existing credentials and storage paths, generate missing secrets, and back up an existing `.env`. Save any generated password privately. Add actual Stripe and Resend credentials when those integrations are needed.

Subsequent cPanel Git deployments install dependencies, validate the environment, build and touch the restart marker. The Git checkout must be clean with `.cpanel.yml` committed. Use Update from Remote, then Deploy HEAD Commit. Do not edit tracked files in the cPanel-managed checkout.

The cPanel route runs the full `.next` build with installed dependencies. The Docker standalone `server.js` is a separate route, not Passenger's entry point. This update does not migrate to Supabase or change the existing database. The copy/build workflow is not an atomic release-switching deployment.
