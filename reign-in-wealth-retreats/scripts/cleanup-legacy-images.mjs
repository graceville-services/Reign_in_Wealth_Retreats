// cPanel copies files without deleting old ones. Remove only verified original
// stock assets after a successful build, retaining a recovery copy on the host.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, lstatSync, mkdirSync, copyFileSync, unlinkSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const originals = JSON.parse(readFileSync(new URL("./legacy-stock-images.json", import.meta.url), "utf8"));
const pending = [];
for (const [relative, expected] of Object.entries(originals)) {
  if (!/^public\/images\/[a-z-]+\.webp$/.test(relative)) throw new Error("Invalid legacy asset manifest.");
  const path = resolve(root, relative);
  if (!existsSync(path)) continue;
  if (lstatSync(path).isSymbolicLink() || lstatSync(dirname(path)).isSymbolicLink()) {
    console.log(`Preserving symlinked asset: ${relative}`);
    continue;
  }
  const actual = createHash("sha256").update(readFileSync(path)).digest("hex");
  if (actual === expected) pending.push({ relative, path });
  else console.log(`Preserving customized asset: ${relative}`);
}
if (pending.length) {
  const backup = resolve(root, "backups/legacy-stock-assets", new Date().toISOString().replaceAll(":", "-"));
  mkdirSync(backup, { recursive: true, mode: 0o700 });
  // Finish all backup copies before deleting any original.
  for (const { path, relative } of pending) copyFileSync(path, resolve(backup, relative.split("/").at(-1)));
  for (const { path } of pending) unlinkSync(path);
  console.log(`Removed ${pending.length} unchanged legacy stock images. Recovery copies: ${backup}`);
} else console.log("Legacy stock image cleanup: no unchanged originals remain.");
