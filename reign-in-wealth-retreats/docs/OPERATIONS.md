# Operations handbook

## Runtime and storage

Run this project with Node 24 on **one application instance** with a persistent writable filesystem. SQLite holds site content, leads, inquiries, registrations, payments, sessions, and the email outbox. Uploaded media lives separately on the same persistent disk.

| Data                 | Default source deployment           | Docker Compose                                             |
| -------------------- | ----------------------------------- | ---------------------------------------------------------- |
| SQLite database      | `data/retreats.sqlite`              | `/app/data/retreats.sqlite` in `retreat_data`              |
| Uploaded media       | `data/media/`                       | `/app/data/media/` in `retreat_data`                       |
| Backups              | `backups/`                          | `/app/backups/` in `retreat_backups`                       |
| Secret configuration | Local `.env` or hosting environment | Host `.env` injected by Compose; not copied into the image |

Do not deploy this SQLite configuration onto an ephemeral filesystem or scale to independent replicas. A future horizontal-scaling deployment needs a shared database, shared object storage, and an appropriately coordinated worker architecture.

Keep `data/`, backups, and `.env` outside the web root and out of Git. Public uploaded images/videos are intentionally accessible through `/api/media/...`; do not use that media uploader for passports, medical documents, private traveler records, or payment-card data.

## Start a production build without Docker

Use a persistent checkout, configured `.env`, and an HTTPS reverse proxy:

```bash
npm ci
npm run build
npm start
```

Set `APP_URL` to the actual public HTTPS origin before accepting requests. Next starts on port 3000. Your process supervisor should restart the server after failure and start it after machine reboot. Configure the reverse proxy to preserve the public Host/Origin relationship and to overwrite incoming client-IP forwarding headers rather than trust arbitrary client values.

The process should run under an unprivileged account that can write the configured database, media, and backup directories. Do not run the web service as the server’s root account.

## Docker deployment

The supplied Dockerfile creates a Next.js standalone runtime, copies the required static/public assets, and runs as the `node` user. The Compose file mounts named volumes and binds the app to the host’s loopback interface for a reverse proxy.

1. Run `npm run setup` on the working copy if `.env` does not yet exist, and save the generated administrator credentials.
2. Edit `.env`: set the public HTTPS `APP_URL`, actual administrator email, `DEV_PREVIEW_MODE=false`, and any configured provider credentials.
3. Connect your reverse proxy or hosting platform to port 3000 and configure TLS for the chosen domain.
4. Build and start the container:

```bash
docker compose up -d --build
docker compose ps
docker compose logs --tail=100 app
```

The application health endpoint is `/api/health`. The image health check uses that endpoint; it checks that the app responds, not that Stripe or Resend is configured correctly.

The loopback mapping `127.0.0.1:3000:3000` fits a reverse proxy running on the host. If your platform runs its proxy in another container, connect both services to the appropriate Docker network and route to the app’s container port instead. The Compose file does not purchase a domain, create DNS records, or issue a TLS certificate.

Named volumes are initialized with directories owned by the application user. If replacing them with bind mounts, prepare the host folders with the correct ownership and permissions; do not solve a permission error by making traveler data world-writable.

### Restart and update

```bash
docker compose restart app
```

For a new source release, back up first, review any data/schema changes, then rebuild:

```bash
docker compose exec -T app node scripts/backup.mjs
docker compose up -d --build
```

Changing `.env` values requires recreating the container rather than only restarting its existing configuration:

```bash
docker compose up -d --force-recreate app
```

The database and media volumes survive these operations. **Do not use `docker compose down -v` on an active deployment**: the `-v` option removes the named volumes.

## Email jobs and reminders

Successful mutation requests dispatch queued email after responding, and traveler sign-in sends immediately when email is configured. Recurring jobs remain necessary: they retry the outbox, evaluate payment/pre-departure reminder milestones, and reconcile expired or unresolved Stripe Checkout attempts. The code does not install an operating-system scheduler itself.

For a source checkout with dependencies installed:

```bash
npm run jobs
```

For a running Docker container, use the secured HTTP endpoint from inside the container. The runtime image deliberately does not depend on `tsx` or the full TypeScript source tree:

```bash
docker compose exec -T app node -e 'fetch("http://127.0.0.1:3000/api/jobs", {method:"POST", headers:{Authorization:"Bearer "+process.env.CRON_SECRET}}).then(async r=>{const body=await r.text();if(!r.ok)throw new Error(body);console.log(body)}).catch(e=>{console.error(e.message);process.exit(1)})'
```

This command reads the secret inside the container and does not print it or place its value in the shell history. An external scheduler can instead send `POST /api/jobs` with `Authorization: Bearer <CRON_SECRET>` from its own protected secret store. No JSON body is required.

Run the worker every five minutes for timely retries and Checkout reconciliation; the same task evaluates reminder schedules. Reconciliation checks unresolved provider sessions before releasing their capacity holds, so a delayed payment event does not silently free a paid traveler’s place. Dedupe keys prevent repeated processing from generating a new copy of the same scheduled message. The worker processes a bounded outbox batch, retries failed sends, and records failures for inspection. Check the admin outbox and Resend delivery logs.

Example host crontab for Docker, assuming the project is installed at `/srv/reign-in-wealth-retreats` and the Docker CLI is available to the scheduler account:

```cron
*/5 * * * * cd /srv/reign-in-wealth-retreats && /usr/bin/flock -n /tmp/riw-jobs.lock /usr/bin/docker compose exec -T app node -e 'fetch("http://127.0.0.1:3000/api/jobs",{method:"POST",headers:{Authorization:"Bearer "+process.env.CRON_SECRET}}).then(r=>{if(!r.ok)throw new Error("Job request failed: "+r.status)}).catch(e=>{console.error(e.message);process.exit(1)})'
15 2 * * * cd /srv/reign-in-wealth-retreats && /usr/bin/flock -n /tmp/riw-backup.lock /usr/bin/docker compose exec -T app node scripts/backup.mjs
```

Adjust the installation path, executable paths, operating-system timezone, and alerting to your host. Give the scheduler only the access it needs. Monitor failures; a configured cron entry is not proof that jobs have run.

Without `RESEND_API_KEY` and `EMAIL_FROM`, jobs leave messages queued. Outbox text is visible for development inspection only when development preview is enabled. Do not expose a development instance to public users.

### Current reminder rules

Payment reminders target unpaid installments near or after their due date, with deduplication per booking/installment/week. Pre-departure messages use 30-day, 7-day, and 1-day milestones. Destination travel notes and the portal provide the preparation context. Review these defaults against your operating schedule before launch.

## Backups

Create a backup from the source checkout:

```bash
npm run backup
```

Or from Docker:

```bash
docker compose exec -T app node scripts/backup.mjs
```

The command creates a folder named `retreats-<timestamp>` under `BACKUP_PATH`. It contains a consistent SQLite snapshot created with `VACUUM INTO` and a copy of the uploaded media directory. The script applies its configured local retention policy to its own dated folders.

Use a quiet period for media uploads while backing up so the media copy and database references remain aligned. Database snapshots and media are not one distributed transaction. Keep secrets separately in your secret manager; `.env` is deliberately not included in this data backup.

**Copy completed backups to encrypted storage outside the application server.** A second volume on the same host does not protect against loss of that host. Schedule that off-server transfer using your hosting provider or backup tool, and verify that it completes. No remote storage account is created by this project.

### Restore a source deployment

The following example uses the default data directories. If your environment uses custom paths, apply the same process to those paths.

1. Stop the web process and all scheduled jobs. Keep them stopped throughout restoration.
2. Choose a known completed backup directory and verify that it contains `retreats.sqlite` and, if uploads exist, `media/`.
3. Move the current `data` directory to a protected recovery location; do not overwrite your only copy while investigating an incident.
4. Create a fresh `data` directory and copy the selected snapshot to `data/retreats.sqlite` and its media directory to `data/media`.
5. Preserve application ownership and restrictive permissions. Do not copy old `retreats.sqlite-wal` or `retreats.sqlite-shm` files over the restored snapshot.
6. Restart the application and verify content, an administrator login, media, and known registration/payment records before restarting scheduled email jobs.
7. Reconcile any Stripe events or email activity that occurred after the backup timestamp. Restoring a database does not roll back external provider activity.

A restore should be rehearsed on a private copy before you rely on the backups.

### Restore a Docker deployment

Stop the application and scheduler first. Retain the current named volume or take a separate recovery copy. Use a temporary maintenance container mounting the same data/backup volumes to copy the chosen snapshot and media into `/app/data`, then return ownership to UID/GID `1000:1000` for the `node` user. Use a fresh data directory rather than retaining old SQLite WAL/SHM companions. Restart with `docker compose up -d` and perform the same verification and provider reconciliation described above.

Do not delete or recreate production volumes as a substitute for following a controlled restore. Docker volume names are prefixed by the Compose project name; identify the actual volumes with `docker volume ls` before any maintenance operation.

## Administrator password rotation

For a source checkout using `.env`, stop the server, then run this from the project root in a private terminal. It preserves all other environment values, creates a new random password, replaces its hash, and revokes existing administrator sessions if a database exists:

```bash
node --input-type=module <<'JS'
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes, scryptSync } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
process.loadEnvFile('.env');
const password = randomBytes(18).toString('base64url');
const salt = randomBytes(16).toString('hex');
const hash = salt + ':' + scryptSync(password, salt, 64).toString('hex');
const config = readFileSync('.env', 'utf8');
if (!/^ADMIN_PASSWORD_HASH=.*$/m.test(config)) throw new Error('ADMIN_PASSWORD_HASH line is missing.');
writeFileSync('.env', config.replace(/^ADMIN_PASSWORD_HASH=.*$/m, 'ADMIN_PASSWORD_HASH=' + hash), { mode: 0o600 });
const path = process.env.DATABASE_PATH || './data/retreats.sqlite';
if (existsSync(path)) {
  const database = new DatabaseSync(path);
  database.prepare("DELETE FROM sessions WHERE role='admin'").run();
  database.close();
}
console.log('New administrator password:', password);
console.log('Save it in your password manager; restart the server.');
JS
```

For Docker, change the hash in the host environment file or secret store and recreate the app container. The host rotation snippet cannot revoke sessions inside a Docker-only volume; revoke those through a controlled SQLite maintenance operation on that volume. Keep the application stopped during the credential change. If you store environment variables in a hosting control panel, update the hash there rather than creating a competing `.env` source.

## Payment and booking operations

A **booking status change** and a **financial refund** are separate operations. Cancel the registration in admin according to the agreed terms; issue any approved refund in the correct Stripe account; let the signed `charge.refunded` event update the recorded payment. Check the provider and application records after refunding. Do not manually edit paid amounts in SQLite to imitate a provider refund.

Prices and terms are captured with the registration. Avoid editing existing confirmed registrations by altering a retreat’s current public pricing. Review the contractual and financial effect of any change with the traveler and use the appropriate payment/provider process.

Room labels are operational assignments. The dashboard counts travelers separately from distinct assigned rooms. A requested roommate is not an additional registered traveler, and an assignment label does not itself reserve a room at a hotel.

Admin CSV exports contain personal data. Download only for the team’s operational need, store them securely, and honor your retention policy. Leading formula characters are escaped by the export implementation for safer spreadsheet opening.

## Troubleshooting

| Symptom                                     | What to check                                                                                                                                           |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node:sqlite` unavailable                   | Use Node 24 and reinstall with `npm ci`.                                                                                                                |
| Database read-only or permission denied     | The runtime account must own or have write access to `DATABASE_PATH`’s directory and `MEDIA_PATH`; preserve persistent mounts.                          |
| Sign-in link points to a previous Codespace | Update `APP_URL`, restart, and request a new link.                                                                                                      |
| Traveler sign-in unavailable in production  | Configure Resend and its verified sender; development preview links are intentionally unavailable.                                                      |
| Interest succeeds but no email arrives      | Inspect the record and outbox, confirm email credentials, run jobs, and inspect provider delivery status.                                               |
| Payment button remains unavailable          | Check future dates, open status, booking toggle, hotel, selected occupancy price, positive capacity, terms, approved policies, and both Stripe secrets. |
| Stripe webhook returns 400                  | Check the exact endpoint’s signing secret and raw signed event delivery. Browser visits or unsigned JSON are not valid webhook tests.                   |
| Checkout succeeded but payment is pending   | Inspect Stripe event delivery and application logs; never force paid status from a return URL.                                                          |
| Receipt has the wrong environment           | Confirm the secret key, endpoint secret, and records all belong to the same sandbox/live environment.                                                   |
| Media upload rejected                       | Use the supported image/video formats and keep the file at or below 25 MB.                                                                              |
| No data after rebuilding Docker             | Verify that the same named data volume is mounted and has not been deleted.                                                                             |

## Reference material

- [Server API](API.md)
- [Launch and provider acceptance guide](LAUNCH.md)
- [Analytics and consent](ANALYTICS.md)
- [Next.js deployment documentation](https://nextjs.org/docs/app/getting-started/deploying)
- [Stripe webhook verification](https://docs.stripe.com/webhooks)
- [GitHub Codespaces port forwarding](https://docs.github.com/en/codespaces/developing-in-a-codespace/forwarding-ports-in-your-codespace)
