#!/usr/bin/env bash
# Invoked by cPanel Git Version Control from the checked-out repository.
set -Eeuo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
APP_ROOT="${CPANEL_APP_ROOT:-${HOME}/reign-wealth-retreats-app}"

if [[ "${APP_ROOT}" != /* || "${APP_ROOT}" == "/" ]]; then
  echo 'ERROR: CPANEL_APP_ROOT must be an absolute directory path (not /).' >&2
  exit 1
fi
if [[ "${APP_ROOT}" == "${REPO_ROOT}" || "${APP_ROOT}" == "${REPO_ROOT}/"* ]]; then
  echo 'ERROR: Application directory must be separate from the cPanel Git checkout.' >&2
  exit 1
fi

printf 'Deploying from %s to %s\n' "${REPO_ROOT}" "${APP_ROOT}"
mkdir -p "${APP_ROOT}" "${APP_ROOT}/data/media" "${APP_ROOT}/backups" "${APP_ROOT}/tmp"

# Copy only checked-in application code. Never copy .git, .env, data, backups or node_modules.
# Runtime files in APP_ROOT survive deployments.
for item in src public scripts docs; do
  if [[ -d "${REPO_ROOT}/${item}" ]]; then
    mkdir -p "${APP_ROOT}/${item}"
    cp -a "${REPO_ROOT}/${item}/." "${APP_ROOT}/${item}/"
  fi
done
for item in app.js package.json package-lock.json next.config.ts next-env.d.ts tsconfig.json .env.example; do
  if [[ -f "${REPO_ROOT}/${item}" ]]; then
    cp -a "${REPO_ROOT}/${item}" "${APP_ROOT}/${item}"
  fi
done

# Remove the pre-gallery fallback icon from past releases. The new branded
# favicon is provided as icon.png, apple-icon.png, and favicon.ico.
rm -f "${APP_ROOT}/src/app/icon.svg"

cd "${APP_ROOT}"
export PATH="/opt/cpanel/ea-nodejs22/bin:${PATH}"
hash -r
if [[ ! -f .env ]]; then
  echo 'ERROR: Missing production .env in application directory.' >&2
  echo "Create ${APP_ROOT}/.env from .env.example and set APP_URL, secrets, and provider keys." >&2
  exit 1
fi
if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo 'ERROR: Node.js/npm are not available in the cPanel Git deployment shell.' >&2
  echo 'Enable the Node.js 22 environment in the script or ask your hosting provider.' >&2
  exit 1
fi
NODE_MAJOR="$(node -p 'Number(process.versions.node.split(".")[0])')"
if (( NODE_MAJOR < 22 )); then
  echo "ERROR: Node.js 22+ required; cPanel deployment shell is using $(node -v)." >&2
  exit 1
fi

export NEXT_TELEMETRY_DISABLED=1
export NODE_ENV=production
npm ci --no-audit --no-fund
npm run build

# Passenger-based cPanel apps watch this file for restarts; other process managers
# (such as systemd/PM2) must be configured to restart independently.
touch tmp/restart.txt
printf 'Build complete in %s. Configure your cPanel Node.js app to run from here.\n' "${APP_ROOT}"
