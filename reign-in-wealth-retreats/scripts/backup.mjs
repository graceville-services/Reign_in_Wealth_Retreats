import { DatabaseSync } from "node:sqlite";
import {
  mkdirSync,
  existsSync,
  readdirSync,
  statSync,
  rmSync,
  cpSync,
  chmodSync,
} from "node:fs";
import { resolve, join } from "node:path";
try {
  process.loadEnvFile(".env");
} catch {}
const databasePath = resolve(
  process.env.DATABASE_PATH || "./data/retreats.sqlite",
);
if (!existsSync(databasePath)) {
  console.error(
    "No database exists yet. Start the website before creating a backup.",
  );
  process.exit(1);
}
const root = resolve(process.env.BACKUP_PATH || "./backups");
mkdirSync(root, { recursive: true, mode: 0o700 });
const folder = join(
  root,
  "retreats-" +
    new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-"),
);
mkdirSync(folder, { mode: 0o700 });
const database = new DatabaseSync(databasePath);
database.prepare("VACUUM INTO ?").run(join(folder, "retreats.sqlite"));
database.close();
chmodSync(join(folder, "retreats.sqlite"), 0o600);
const media = resolve(process.env.MEDIA_PATH || "./data/media");
if (existsSync(media))
  cpSync(media, join(folder, "media"), { recursive: true });
const retention = Number(process.env.BACKUP_RETENTION_DAYS || 30);
for (const name of readdirSync(root)) {
  if (!name.startsWith("retreats-")) continue;
  const full = join(root, name);
  if (
    statSync(full).isDirectory() &&
    Date.now() - statSync(full).mtimeMs > retention * 86400000
  )
    rmSync(full, { recursive: true });
}
console.log(`Backup saved: ${folder}`);
console.log(
  "Copy this protected folder to encrypted storage outside this server. Retention: " +
    retention +
    " days.",
);
