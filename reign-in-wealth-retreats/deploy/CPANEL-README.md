# cPanel Git deployment for Reign in Wealth Retreats

This repository includes `.cpanel.yml` at **the Git repository root**. Commit it to GitHub. cPanel Git Version Control requires a checked-in `.cpanel.yml` and a **clean Git working tree**.

## Before the first deployment

1. Confirm your hosting plan supports **Node.js 24+**, a persistent Next.js server, shell commands, and sufficient memory for `next build`. The cPanel Git interface alone does **not** run the website.
2. cPanel Git Version Control: clone your GitHub repository into a **repository directory**, not `public_html` and not the live app directory.
3. The deploy script copies source code into `$HOME/reign-wealth-retreats-app` by default. If your cPanel Node.js application root is different, edit `deploy/cpanel-deploy.sh` to set APP_ROOT appropriately, or add a preceding `.cpanel.yml` task defining `CPANEL_APP_ROOT` in the same shell execution context.
4. Via SSH, prepare the production configuration *outside the Git checkout*:

   ```bash
   mkdir -p "$HOME/reign-wealth-retreats-app/data/media" "$HOME/reign-wealth-retreats-app/backups"
   cp /path/to/git-checkout/.env.example "$HOME/reign-wealth-retreats-app/.env"
   chmod 600 "$HOME/reign-wealth-retreats-app/.env"
   nano "$HOME/reign-wealth-retreats-app/.env"
   ```

   Set `APP_URL=https://your-domain.example` and secrets; set `DEV_PREVIEW_MODE=false`; use persistent absolute paths for `DATABASE_PATH`, `MEDIA_PATH`, and `BACKUP_PATH` to avoid path ambiguity. Never commit `.env` or production runtime files.

5. Ensure cPanel's deployment shell has Node.js **24+** and npm on its `PATH`. The cPanel Node.js application selector and the Git deployment shell may have different `PATH` settings. The script fails clearly if Node is missing or too old.
6. Go to cPanel **Git Version Control → Manage → Pull or Deploy → Update from Remote → Deploy HEAD Commit**. Git must be clean (`git status --porcelain` prints nothing). The script copies source, runs `npm ci` and `npm run build`, then touches `tmp/restart.txt`.
7. **Separately configure the hosting provider's Node.js application manager or process supervisor** for this app root, start command, public domain and HTTPS. `npm start` uses Next.js on port 3000 when a standalone process manager is supported; Passenger setups may require additional host-specific startup wiring. Git deployment by itself does not register, start, or route the application.
8. Test `/api/health`, `/admin`, bookings, and Stripe webhooks. Configure real email, approved pricing, SSL, scheduled reminder jobs, and off-server backups before accepting payments.

## If cPanel still says it cannot deploy

Run in **the cPanel Git checkout**:

```bash
pwd
ls -la .cpanel.yml
git ls-files .cpanel.yml
git status --porcelain
git branch --show-current
```

If `.cpanel.yml` isn't tracked, commit and push it **from Codespaces**, then use **Update from Remote** in cPanel. Do **not** edit tracked files directly inside the cPanel-managed Git checkout, because it must remain clean.

## Important limitations

- This ZIP reflects the **SQLite/local-storage version** supplied by the user. It does not migrate the separately discussed Supabase version; do not combine their env files or data without a proper migration.
- Keep the app root outside publicly accessible `public_html` so `.env`, SQLite databases and user uploads cannot be served directly.
- `cp -a` is conservative: deployments will not delete old source files that were removed from Git. If you remove routes/files, delete obsolete deployed copies deliberately during a maintenance window (do not delete `data`, `.env`, or `backups`).
- A failed build leaves the previously built `.next` directory potentially modified. For reliable zero-downtime deployments, use release directories and atomic switching instead.
