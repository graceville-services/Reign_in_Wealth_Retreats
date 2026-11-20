# Codespaces admin-login origin error (403)

The server rejects login POSTs when the browser's `Origin` does not match an explicitly configured trusted origin. Never disable that check to fix a preview URL.

## On GitHub Codespaces

Choose **one** main `APP_URL` in your Codespace's project-root `.env`:

```dotenv
APP_URL=https://reigninwealthretreats.com
APP_ALLOWED_ORIGINS=https://ominous-memory-gxrq456jp6rr2p7wp-3000.app.github.dev
```

`APP_URL` is the canonical external site URL used for generated links. `APP_ALLOWED_ORIGINS` lists exact additional HTTPS origins that may submit browser forms (comma-separated if more than one). Do not include a trailing slash or path, and do not use wildcards. You can instead set `APP_URL` to the Codespaces HTTPS origin when the preview is a separate local development instance; the allowlist is only needed if you access one instance through more than one origin.

Do not place backslashes in URL values. Do not set `APP_URL=http://localhost:3000` while running `npm start` or another production server, because production requires HTTPS. Local `npm run dev` may use localhost.

Check precedence and running process configuration. Next.js can also load `.env.local`, `.env.production.local` or exported shell environment variables. They can override `.env`.

```sh
cd /workspaces/Reign_in_Wealth_Retreats/reign-in-wealth-retreats
grep -HnE '^(APP_URL|APP_ALLOWED_ORIGINS)=' .env .env.local .env.production .env.production.local 2>/dev/null || true
printenv APP_URL || true
```

To apply the change, stop the server (Ctrl+C), then start again:

```sh
npm run dev
```

Or, to test production mode:

```sh
npm run build
npm start
```

A missing session (`GET /api/admin/session` -> 401) is expected before login. A POST to `/api/admin/login` should no longer return 403 for the configured Codespaces origin. Wrong credentials should return 401, not 403.

## On the live cPanel server

Use the real public domain in the server's separate `.env`:

```dotenv
APP_URL=https://reigninwealthretreats.com
APP_ALLOWED_ORIGINS=
```

Do not overwrite your production `.env`, database, admin password hash or existing uploaded media when deploying source updates. Build and restart the Passenger app after updating the code. Do not copy the Codespaces `.env` to production.

## Codespaces proxy-origin rewrite

On forwarded HTTPS browser traffic, GitHub Codespaces can rewrite `Origin` to
`http://localhost:3000`, even when DevTools shows a browser request to the
HTTPS preview. This version recognizes that proxy quirk **only** when:

- `CODESPACES=true` and `CODESPACE_NAME` are set by GitHub Codespaces;
- `APP_ALLOWED_ORIGINS` explicitly lists the exact forwarded HTTPS origin;
- the received `Host` matches the current Codespace preview host;
- `Referer` identifies the exact expected HTTPS preview origin;
- `Sec-Fetch-Site` is `same-origin`, if present.

Cross-site requests and generic localhost requests in production are rejected.
`DEBUG_ORIGIN=true` enables optional server-side mismatch logging (no cookies
or credentials); do not leave it on in production.

**Tests:** `npm run typecheck && npm test && npm run build`.
