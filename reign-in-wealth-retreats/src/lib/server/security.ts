import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
  randomUUID,
} from "node:crypto";
import { db } from "./db";
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function requireCondition(
  value: unknown,
  message: string,
  status = 400,
): asserts value {
  if (!value) throw new ApiError(status, message);
}
export const hash = (text: string) =>
  createHash("sha256").update(text).digest("hex");
export const production = () => process.env.NODE_ENV === "production";
export const isDevPreview = () =>
  !production() && process.env.DEV_PREVIEW_MODE === "true";
export function appUrl() {
  const value =
    process.env.APP_URL || (production() ? "" : "http://localhost:3000");
  requireCondition(value, "APP_URL must be configured.", 503);
  const url = new URL(value);
  requireCondition(
    !production() || url.protocol === "https:",
    "Production APP_URL must use HTTPS.",
    503,
  );
  return url.origin;
}
// Origin allowlist includes only the canonical site and explicitly configured HTTPS
// preview URLs. Do not trust arbitrary Host or X-Forwarded-Host headers.
function configuredTrustedOrigins() {
  const trusted = new Set([appUrl()]);
  for (const entry of (process.env.APP_ALLOWED_ORIGINS || "").split(",")) {
    const configured = entry.trim();
    if (!configured) continue;
    let url: URL;
    try {
      url = new URL(configured);
    } catch {
      throw new ApiError(503, "APP_ALLOWED_ORIGINS contains an invalid URL.");
    }
    requireCondition(
      configured === url.origin &&
        (url.protocol === "https:" ||
          (!production() && url.origin === "http://localhost:3000")),
      "APP_ALLOWED_ORIGINS must contain exact HTTPS origins.",
      503,
    );
    trusted.add(url.origin);
  }
  return trusted;
}

// GitHub Codespaces' HTTPS port-forward proxy can rewrite a browser's Origin
// to http://localhost:PORT while retaining its public Host and Referer.
// Do not generally trust localhost in production: permit this special case
// ONLY inside Codespaces and only if all independent browser/host signals
// match this Codespace's explicitly allowlisted HTTPS origin.
function isCodespacesOriginRewrite(
  request: Request,
  origin: string,
  trustedOrigins: Set<string>,
) {
  if (process.env.CODESPACES !== "true") return false;
  const codespaceName = process.env.CODESPACE_NAME;
  if (!codespaceName) return false;
  const forwardingDomain =
    process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN || "app.github.dev";
  const previewHost = `${codespaceName}-3000.${forwardingDomain}`;
  const previewOrigin = `https://${previewHost}`;
  if (!trustedOrigins.has(previewOrigin)) return false;
  if (origin !== "http://localhost:3000" && origin !== "http://127.0.0.1:3000")
    return false;
  if (request.headers.get("host") !== previewHost) return false;
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin") return false;
  const referer = request.headers.get("referer");
  if (!referer) return false;
  try {
    return new URL(referer).origin === previewOrigin;
  } catch {
    return false;
  }
}

export function checkOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;

  const trustedOrigins = configuredTrustedOrigins();
  // Preserve direct localhost development; the security exception below is
  // deliberately narrower when NODE_ENV=production.
  if (!production()) trustedOrigins.add(new URL(request.url).origin);
  if (trustedOrigins.has(origin)) return;
  if (isCodespacesOriginRewrite(request, origin, trustedOrigins)) return;

  if (process.env.DEBUG_ORIGIN === "true") {
    // For local debugging only; do not log cookies, credentials or auth tokens.
    console.warn("[origin-check] Rejected request", {
      requestOrigin: origin,
      configuredOrigins: [...trustedOrigins],
      requestUrlOrigin: new URL(request.url).origin,
      host: request.headers.get("host"),
      refererOrigin: (() => {
        try { return new URL(request.headers.get("referer") || "").origin; }
        catch { return null; }
      })(),
      codespaces: process.env.CODESPACES === "true",
    });
  }
  throw new ApiError(403, "This request must come from this website.");
}
export async function jsonBody(request: Request) {
  requireCondition(
    request.headers.get("content-type")?.includes("application/json"),
    "Use a JSON request.",
  );
  requireCondition(
    Number(request.headers.get("content-length") || 0) <= 512_000,
    "Request is too large.",
    413,
  );
  const text = await request.text();
  requireCondition(text.length <= 512_000, "Request is too large.", 413);
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError(400, "Invalid JSON.");
  }
}
export function rateLimit(key: string, max = 12, windowMs = 60_000) {
  const now = Date.now();
  db()
    .prepare("DELETE FROM rate_limits WHERE reset_at < ?")
    .run(now - 3600000);
  const row = db()
    .prepare("SELECT count,reset_at FROM rate_limits WHERE key=?")
    .get(key) as { count: number; reset_at: number } | undefined;
  if (!row || row.reset_at < now)
    db()
      .prepare(
        "INSERT OR REPLACE INTO rate_limits(key,count,reset_at) VALUES(?,1,?)",
      )
      .run(key, now + windowMs);
  else {
    if (row.count >= max)
      throw new ApiError(429, "Please wait a moment before trying again.");
    db().prepare("UPDATE rate_limits SET count=count+1 WHERE key=?").run(key);
  }
}
export function requestKey(request: Request) {
  // The reverse proxy should overwrite, rather than append arbitrary client IP headers.
  return hash(
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local",
  );
}
export type Session = { email: string; role: "admin" | "traveler" };
const cookieName = "riw_session";
export function session(
  request: Request,
  role?: Session["role"],
): Session | null {
  const value = request.headers
    .get("cookie")
    ?.split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith(cookieName + "="))
    ?.slice(cookieName.length + 1);
  if (!value || !/^[a-f0-9]{64}$/.test(value)) return null;
  const row = db()
    .prepare("SELECT email,role,expires FROM sessions WHERE token_hash=?")
    .get(hash(value)) as (Session & { expires: number }) | undefined;
  if (!row || row.expires < Date.now() || (role && row.role !== role))
    return null;
  return { email: row.email, role: row.role };
}
export function requireSession(request: Request, role?: Session["role"]) {
  const user = session(request, role);
  if (!user) throw new ApiError(401, "Please sign in to continue.");
  return user;
}
export function createSession(email: string, role: Session["role"]) {
  const token = randomBytes(32).toString("hex");
  db().prepare("DELETE FROM sessions WHERE expires < ?").run(Date.now());
  db()
    .prepare(
      "INSERT INTO sessions(token_hash,email,role,expires) VALUES(?,?,?,?)",
    )
    .run(hash(token), email, role, Date.now() + 8 * 3600000);
  return `${cookieName}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=28800${production() ? "; Secure" : ""}`;
}
export function logout(request: Request) {
  const value = request.headers
    .get("cookie")
    ?.split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith(cookieName + "="))
    ?.slice(cookieName.length + 1);
  if (value)
    db().prepare("DELETE FROM sessions WHERE token_hash=?").run(hash(value));
  return `${cookieName}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${production() ? "; Secure" : ""}`;
}
export function passwordHash(
  password: string,
  salt = randomBytes(16).toString("hex"),
) {
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
export function verifyPassword(password: string) {
  const stored = process.env.ADMIN_PASSWORD_HASH;
  if (!stored)
    throw new ApiError(
      503,
      "Administrator access has not been configured. Run npm run setup.",
    );
  const [salt, expected] = stored.split(":");
  if (!salt || !expected || expected.length !== 128) return false;
  const actual = scryptSync(password, salt, 64);
  return timingSafeEqual(actual, Buffer.from(expected, "hex"));
}
export function safeEqual(a: string, b: string) {
  const aa = hash(a),
    bb = hash(b);
  return timingSafeEqual(Buffer.from(aa), Buffer.from(bb));
}
export function audit(actor: string, action: string, target: string) {
  db()
    .prepare(
      "INSERT INTO audit_log(id,actor,action,target,created_at) VALUES(?,?,?,?,?)",
    )
    .run(randomUUID(), actor, action, target, new Date().toISOString());
}
export function csvCell(value: unknown) {
  let str = String(value ?? "");
  if (/^[\s]*[=+@\-\t\r]/.test(str)) str = "'" + str;
  return '"' + str.replaceAll('"', '""') + '"';
}
