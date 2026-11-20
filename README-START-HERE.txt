Reign in Wealth Retreats: Codespaces Origin Rewrite Fix v3

Fixes: Codespaces port forwarding may rewrite HTTP Origin from the browser's
https://<codespace>-3000.app.github.dev to http://localhost:3000.
The fix only tolerates that rewrite when CODESPACES=true, the exact preview
HTTPS URL is on APP_ALLOWED_ORIGINS, and Host + Referer match the expected
Codespaces hostname. Sec-Fetch-Site must be same-origin if provided.

Apply this zip from your repository ROOT (the directory containing
reign-in-wealth-retreats/), then run from the app directory:
  npm run typecheck
  npm test
  npm run build
  npm start

.env (Codespaces only, don't commit it):
  APP_URL=https://reigninwealthretreats.com
  APP_ALLOWED_ORIGINS=https://<YOUR-CODESPACE-NAME>-3000.app.github.dev

This archive does not include or replace .env, the database, or credentials.
Server's own APP_URL and APP_ALLOWED_ORIGINS are unchanged on cPanel.
Note: preview cookies are isolated from production domain.
