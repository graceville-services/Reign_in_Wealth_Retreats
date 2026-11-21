import { accessSync, constants, existsSync, mkdirSync, readFileSync, copyFileSync, writeFileSync, chmodSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { randomBytes, scryptSync } from "node:crypto";
import { parseEnv } from "node:util";
import { createRequire } from "node:module";

const args = process.argv.slice(2);
const options = { apply: false, check: false, integrations: false, email: "", url: "https://reigninwealthretreats.com" };
for (let index = 0; index < args.length; index++) {
  const arg = args[index];
  if (arg === "--apply") options.apply = true;
  else if (arg === "--check") options.check = true;
  else if (arg === "--require-integrations") options.integrations = true;
  else if (arg === "--admin-email" || arg === "--app-url") {
    const value = args[++index];
    if (!value || value.startsWith("--")) throw new Error(`${arg} requires a value.`);
    options[arg === "--admin-email" ? "email" : "url"] = value;
  } else if (arg === "--help") {
    console.log("Prepare: npm run setup:production -- --admin-email you@your-domain.com [--apply]\nValidate: npm run check:production [-- --require-integrations]\nWithout --apply, preparation is a dry run. Existing secrets and storage paths are retained.");
    process.exit(0);
  } else throw new Error(`Unknown option: ${arg}`);
}
if (Number(process.versions.node.split(".")[0]) < 22) throw new Error("Node.js 22 or newer is required.");
const root = process.cwd();
const envPath = resolve(root, ".env");
const emailValid = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || "") && !/\.(local|invalid|example)$/i.test(value);
const originValid = (value) => {
  try { const url = new URL(value); return url.protocol === "https:" && url.origin === value; } catch { return false; }
};

function validate() {
  // Use the same file precedence and variable expansion as Next.js.
  const require = createRequire(import.meta.url);
  const { loadEnvConfig } = require("@next/env");
  const { combinedEnv: env, loadedEnvFiles } = loadEnvConfig(root, false);
  const errors = [];
  const notices = [];
  if (env.NODE_ENV !== "production") errors.push("NODE_ENV must be production in the production environment.");
  if (!originValid(env.APP_URL)) errors.push("APP_URL must be an exact HTTPS origin without a trailing slash.");
  if (env.DEV_PREVIEW_MODE !== "false") errors.push("DEV_PREVIEW_MODE must be false.");
  if (env.DEBUG_ORIGIN === "true") errors.push("DEBUG_ORIGIN must be false in production.");
  if (env.CODESPACES === "true") notices.push("Running in Codespaces: run this check again on your production host.");
  if (!emailValid(env.ADMIN_EMAIL)) errors.push("ADMIN_EMAIL must be your controlled, real email address.");
  if (!/^[a-f0-9]{32}:[a-f0-9]{128}$/i.test(env.ADMIN_PASSWORD_HASH || "")) errors.push("ADMIN_PASSWORD_HASH must contain a generated scrypt hash.");
  if ((env.CRON_SECRET || "").length < 32) errors.push("CRON_SECRET must contain at least 32 characters.");
  for (const origin of (env.APP_ALLOWED_ORIGINS || "").split(",").filter(Boolean)) {
    if (!originValid(origin.trim())) errors.push("APP_ALLOWED_ORIGINS must contain exact HTTPS origins, without wildcards.");
  }
  for (const key of ["DATABASE_PATH", "MEDIA_PATH", "BACKUP_PATH"]) {
    if (!env[key]) { errors.push(`${key} is required.`); continue; }
    const path = resolve(root, env[key]);
    const publicRoot = resolve(root, "public");
    if (path === publicRoot || path.startsWith(publicRoot + "/")) errors.push(`${key} must be outside public/.`);
    let parent = key === "DATABASE_PATH" ? dirname(path) : path;
    while (!existsSync(parent) && dirname(parent) !== parent) parent = dirname(parent);
    try { accessSync(parent, constants.W_OK); } catch { errors.push(`${key} is not writable by the current user.`); }
  }
  if (!/^\d+$/.test(env.BACKUP_RETENTION_DAYS || "") || Number(env.BACKUP_RETENTION_DAYS) < 1) errors.push("BACKUP_RETENTION_DAYS must be a positive whole number.");
  const emailReady = Boolean(env.RESEND_API_KEY && env.EMAIL_FROM);
  const stripeReady = Boolean(env.STRIPE_SECRET_KEY?.startsWith("sk_live_") && env.STRIPE_WEBHOOK_SECRET?.startsWith("whsec_"));
  if (!emailReady) (options.integrations ? errors : notices).push("Add RESEND_API_KEY and verified EMAIL_FROM before sending traveler links or email.");
  if (!stripeReady) (options.integrations ? errors : notices).push("Live payments are not configured: add Stripe live secret and webhook signing secret before paid bookings.");
  console.log(`Configuration sources: process environment${loadedEnvFiles.length ? ", " + loadedEnvFiles.map((file) => file.path).join(", ") : ""}.`);
  for (const notice of notices) console.log(`NOTE: ${notice}`);
  for (const error of errors) console.error(`ERROR: ${error}`);
  if (errors.length) process.exitCode = 1;
  else console.log("Production configuration checks passed. This validates settings, not HTTPS, provider credentials or live delivery.");
}

if (options.check) {
  validate();
} else {
  if (!originValid(options.url)) throw new Error("--app-url must be an exact HTTPS origin, without a trailing slash.");
  const existingText = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
  const existing = existingText ? parseEnv(existingText) : {};
  const email = (options.email || existing.ADMIN_EMAIL || "").toLowerCase();
  if (!emailValid(email)) throw new Error("Provide your controlled email using --admin-email you@your-domain.com.");
  const generatedPassword = existing.ADMIN_PASSWORD_HASH ? "" : randomBytes(24).toString("base64url");
  const salt = generatedPassword ? randomBytes(16).toString("hex") : "";
  const updates = {
    NODE_ENV: "production",
    NEXT_TELEMETRY_DISABLED: "1",
    APP_URL: options.url,
    APP_ALLOWED_ORIGINS: options.url === "https://reigninwealthretreats.com" ? "https://www.reigninwealthretreats.com" : "",
    DEV_PREVIEW_MODE: "false",
    DEBUG_ORIGIN: "false",
    DATABASE_PATH: existing.DATABASE_PATH || resolve(root, "data/retreats.sqlite"),
    MEDIA_PATH: existing.MEDIA_PATH || resolve(root, "data/media"),
    BACKUP_PATH: existing.BACKUP_PATH || resolve(root, "backups"),
    BACKUP_RETENTION_DAYS: existing.BACKUP_RETENTION_DAYS || "30",
    ADMIN_EMAIL: email,
    ADMIN_PASSWORD_HASH: existing.ADMIN_PASSWORD_HASH || `${salt}:${scryptSync(generatedPassword, salt, 64).toString("hex")}`,
    CRON_SECRET: existing.CRON_SECRET || randomBytes(32).toString("hex"),
  };
  const raw = existingText || readFileSync(resolve(root, ".env.production.example"), "utf8");
  const seen = new Set();
  const encode = (value) => /^[a-zA-Z0-9_:/.,@+-]+$/.test(value) ? value : JSON.stringify(value).replaceAll("$", "\\$");
  const lines = raw.split(/\r?\n/).map((line) => {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    if (!match || !(match[1] in updates)) return line;
    seen.add(match[1]);
    return `${match[1]}=${encode(updates[match[1]])}`;
  });
  for (const [key, value] of Object.entries(updates)) if (!seen.has(key)) lines.push(`${key}=${encode(value)}`);
  const output = lines.join("\n").replace(/\n*$/, "\n");
  const overrides = [".env.production.local", ".env.local", ".env.production"].filter((file) => existsSync(resolve(root, file)));
  if (overrides.length) console.log(`NOTE: ${overrides.join(", ")} can override .env. Review them and run npm run check:production.`);
  if (!options.apply) {
    console.log(`DRY RUN: ${existingText ? "update" : "create"} ${envPath} for ${options.url}.\nExisting credentials, provider keys and storage paths are preserved.\nRun the same command with --apply to write the file${generatedPassword ? " and show your new admin password once" : ""}.`);
  } else if (output === existingText) {
    console.log("Production .env is already prepared; no changes made.");
  } else {
    if (existingText) {
      const backup = `${envPath}.backup.${new Date().toISOString().replaceAll(":", "-")}.${randomBytes(3).toString("hex")}`;
      copyFileSync(envPath, backup, constants.COPYFILE_EXCL);
      chmodSync(backup, 0o600);
      console.log(`Previous environment backed up to ${backup}.`);
    }
    writeFileSync(envPath, output, { mode: 0o600, flag: existingText ? "w" : "wx" });
    chmodSync(envPath, 0o600);
    for (const dir of [dirname(resolve(root, updates.DATABASE_PATH)), resolve(root, updates.MEDIA_PATH), resolve(root, updates.BACKUP_PATH)]) mkdirSync(dir, { recursive: true, mode: 0o700 });
    console.log(`Production .env prepared for ${options.url}. Administrator email: ${email}.`);
    if (generatedPassword) console.log(`New administrator password (save privately): ${generatedPassword}\nOnly its scrypt hash is stored in .env.`);
    console.log("Add your provider credentials, then run npm run check:production. Restart Passenger after environment changes.");
  }
}
