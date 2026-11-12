import { DatabaseSync } from "node:sqlite";
import { mkdirSync, chmodSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  retreatSeed,
  settingsSeed,
  testimonialSeed,
} from "../../data/retreats";

let database: DatabaseSync | undefined;
export function db() {
  if (database) return database;
  // Runtime database files are created on persistent disk, outside the deployment trace.
  const path = process.env.DATABASE_PATH || "./data/retreats.sqlite";
  if (path !== ":memory:")
    mkdirSync(
      /*turbopackIgnore: true*/ dirname(
        resolve(/*turbopackIgnore: true*/ path),
      ),
      { recursive: true, mode: 0o700 },
    );
  database = new DatabaseSync(/*turbopackIgnore: true*/ path);
  if (path !== ":memory:")
    chmodSync(
      /*turbopackIgnore: true*/ resolve(/*turbopackIgnore: true*/ path),
      0o600,
    );
  database.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS retreats(id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS settings(id INTEGER PRIMARY KEY CHECK(id=1), data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS testimonials(id TEXT PRIMARY KEY, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS leads(id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, destination TEXT NOT NULL, source TEXT NOT NULL, consent INTEGER NOT NULL, created_at TEXT NOT NULL, UNIQUE(email,destination,source));
    CREATE TABLE IF NOT EXISTS messages(id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL, subject TEXT NOT NULL, message TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS bookings(id TEXT PRIMARY KEY, reference TEXT NOT NULL UNIQUE, email TEXT NOT NULL, retreat_id TEXT NOT NULL REFERENCES retreats(id), status TEXT NOT NULL, data TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS bookings_email ON bookings(email);
    CREATE INDEX IF NOT EXISTS bookings_retreat ON bookings(retreat_id,status);
    CREATE TABLE IF NOT EXISTS payments(id TEXT PRIMARY KEY, provider_session TEXT UNIQUE NOT NULL, booking_id TEXT NOT NULL REFERENCES bookings(id), amount INTEGER NOT NULL, currency TEXT NOT NULL, payment_intent TEXT, refunded_amount INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS stripe_events(id TEXT PRIMARY KEY, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS checkout_attempts(id TEXT PRIMARY KEY, booking_id TEXT NOT NULL REFERENCES bookings(id), amount INTEGER NOT NULL, currency TEXT NOT NULL, provider_session TEXT UNIQUE, status TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, email TEXT NOT NULL, role TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS magic_tokens(token_hash TEXT PRIMARY KEY, email TEXT NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS unsubscribe_tokens(token_hash TEXT PRIMARY KEY, email TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS rate_limits(key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS promos(id TEXT PRIMARY KEY, code TEXT NOT NULL UNIQUE, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS announcements(id TEXT PRIMARY KEY, retreat_id TEXT NOT NULL REFERENCES retreats(id), subject TEXT NOT NULL, message TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS outbox(id TEXT PRIMARY KEY, dedupe_key TEXT UNIQUE NOT NULL, recipient TEXT NOT NULL, subject TEXT NOT NULL, body TEXT NOT NULL, status TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, last_error TEXT, claimed_at TEXT);
    CREATE TABLE IF NOT EXISTS audit_log(id TEXT PRIMARY KEY, actor TEXT NOT NULL, action TEXT NOT NULL, target TEXT NOT NULL, created_at TEXT NOT NULL);
    PRAGMA user_version=1;`);
  for (const [table, column, definition] of [
    ["payments", "payment_intent", "TEXT"],
    ["payments", "refunded_amount", "INTEGER NOT NULL DEFAULT 0"],
    ["outbox", "claimed_at", "TEXT"],
  ]) {
    const columns = database.prepare(`PRAGMA table_info(${table})`).all() as {
      name: string;
    }[];
    if (!columns.some((c) => c.name === column))
      database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
  database.exec("PRAGMA user_version=2");
  const insert = database.prepare(
    "INSERT OR IGNORE INTO retreats(id,slug,data) VALUES(?,?,?)",
  );
  for (const retreat of retreatSeed)
    insert.run(retreat.id, retreat.slug, JSON.stringify(retreat));
  database
    .prepare("INSERT OR IGNORE INTO settings(id,data) VALUES(1,?)")
    .run(JSON.stringify(settingsSeed));
  const testimonial = database.prepare(
    "INSERT OR IGNORE INTO testimonials(id,data) VALUES(?,?)",
  );
  for (const item of testimonialSeed)
    testimonial.run(item.id, JSON.stringify(item));
  return database;
}
export function transaction<T>(fn: () => T): T {
  const d = db();
  d.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    d.exec("COMMIT");
    return result;
  } catch (error) {
    d.exec("ROLLBACK");
    throw error;
  }
}
export function closeDb() {
  database?.close();
  database = undefined;
}
