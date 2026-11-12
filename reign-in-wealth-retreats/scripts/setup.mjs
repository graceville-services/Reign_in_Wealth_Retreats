import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { randomBytes, scryptSync } from "node:crypto";
if (Number(process.versions.node.split(".")[0]) < 24) {
  console.error(
    "This project requires Node.js 24 or newer. Run nvm install 24 && nvm use 24.",
  );
  process.exit(1);
}
if (existsSync(".env")) {
  console.log(
    "Your .env already exists and has been preserved. Run npm run dev.",
  );
  process.exit(0);
}
const password = randomBytes(18).toString("base64url");
const salt = randomBytes(16).toString("hex");
const passwordHash =
  salt + ":" + scryptSync(password, salt, 64).toString("hex");
const codespace = process.env.CODESPACE_NAME;
const domain =
  process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN || "app.github.dev";
const appUrl = codespace
  ? `https://${codespace}-3000.${domain}`
  : "http://localhost:3000";
let env = readFileSync(".env.example", "utf8")
  .replace("APP_URL=http://localhost:3000", `APP_URL=${appUrl}`)
  .replace("ADMIN_PASSWORD_HASH=", `ADMIN_PASSWORD_HASH=${passwordHash}`)
  .replace("CRON_SECRET=", `CRON_SECRET=${randomBytes(32).toString("hex")}`);
writeFileSync(".env", env, { mode: 0o600, flag: "wx" });
mkdirSync("data", { recursive: true, mode: 0o700 });
mkdirSync("data/media", { recursive: true, mode: 0o700 });
console.log("\nReign in Wealth Retreats is ready for local development.\n");
console.log(`Website: ${appUrl}`);
console.log("Administrator email: admin@reigninwealth.local");
console.log(`Administrator password: ${password}`);
console.log(
  "\nSave this generated password in your password manager. It is not stored in plaintext.",
);
console.log("Run npm run dev, open port 3000, and visit /admin.\n");
console.log(
  "Payments and real email remain unavailable until you add provider credentials and approve your retreat details.",
);
