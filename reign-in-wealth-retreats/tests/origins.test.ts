import { test } from "node:test";
import assert from "node:assert/strict";
import { checkOrigin, ApiError } from "../src/lib/server/security";

const main = "https://reigninwealthretreats.com";
const preview = "https://ominous-memory-gxrq456jp6rr2p7wp-3000.app.github.dev";
const host = "ominous-memory-gxrq456jp6rr2p7wp-3000.app.github.dev";
function makeRequest(origin: string, override: Record<string, string> = {}) {
  return new Request("http://localhost:3000/api/admin/login", {
    method: "POST",
    headers: { Origin: origin, Host: host, Referer: `${preview}/admin`, "Sec-Fetch-Site": "same-origin", ...override },
  });
}

test("exact HTTPS origin is accepted; Codespaces-rewritten origin needs matching public host and referer", () => {
  const keys = ["NODE_ENV", "APP_URL", "APP_ALLOWED_ORIGINS", "CODESPACES", "CODESPACE_NAME", "GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN"] as const;
  const old = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  try {
    Reflect.set(process.env, "NODE_ENV", "production");
    process.env.APP_URL = main;
    process.env.APP_ALLOWED_ORIGINS = preview;
    process.env.CODESPACES = "true";
    process.env.CODESPACE_NAME = "ominous-memory-gxrq456jp6rr2p7wp";
    process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN = "app.github.dev";

    assert.doesNotThrow(() => checkOrigin(makeRequest(preview)));
    assert.doesNotThrow(() => checkOrigin(makeRequest(main)));
    assert.doesNotThrow(() => checkOrigin(makeRequest("http://localhost:3000")));
    assert.doesNotThrow(() => checkOrigin(makeRequest("http://127.0.0.1:3000")));
    const denied = (request: Request) => assert.throws(
      () => checkOrigin(request),
      (e: unknown) => e instanceof ApiError && e.status === 403,
    );
    denied(makeRequest("https://hostile.example"));
    denied(makeRequest("http://localhost:3000", { Host: "attacker.example" }));
    denied(makeRequest("http://localhost:3000", { Referer: "https://attacker.example/" }));
    denied(makeRequest("http://localhost:3000", { "Sec-Fetch-Site": "cross-site" }));
    denied(makeRequest("http://localhost:3000", { Referer: "" }));
    process.env.CODESPACES = "false";
    denied(makeRequest("http://localhost:3000"));
    process.env.CODESPACES = "true";
    process.env.APP_ALLOWED_ORIGINS = "https://other.example";
    denied(makeRequest("http://localhost:3000"));
    process.env.APP_ALLOWED_ORIGINS = preview + "/not-an-origin";
    assert.throws(() => checkOrigin(makeRequest(preview)),
      (e: unknown) => e instanceof ApiError && e.status === 503);
  } finally {
    for (const key of keys) {
      const value = old[key];
      if (value === undefined) delete process.env[key];
      else Reflect.set(process.env, key, value);
    }
  }
});
