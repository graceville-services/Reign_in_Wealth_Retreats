#!/usr/bin/env node
/**
 * Curate owner-approved local images for the public retreat gallery.
 * Run in Codespaces, then review the result and commit the generated WebP assets.
 * This does not pull or expose private Google Drive content.
 *
 * Example:
 * npm run gallery:import -- ../ghana-photos --album "Ghana 2026" --location "Ghana"
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import { createRequire } from "node:module";
const sharp = createRequire(import.meta.url)("sharp");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(root, "src/data/gallery-photos.json");
const destRoot = path.join(root, "public/gallery");

function slugify(s) {
  return s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "photo";
}
function parseArgs(argv) {
  if (!argv.length || argv.includes("--help") || argv.includes("-h")) {
    console.log('Usage: npm run gallery:import -- <image-directory> --album "Ghana 2026" --location "Ghana"');
    console.log("Only import photographs you have permission to publish. Check the generated manifest before committing.");
    process.exit(argv.length ? 0 : 1);
  }
  const options = { directory: argv[0], album: "Ghana 2026", location: "" };
  for (let i = 1; i < argv.length; i += 2) {
    if (argv[i] === "--album") options.album = argv[i+1] || options.album;
    else if (argv[i] === "--location") options.location = argv[i+1] || "";
    else throw new Error(`Unknown option: ${argv[i]}`);
  }
  if (options.album.length > 80 || options.location.length > 80) throw new Error("Album/location labels must be less than 80 characters.");
  return options;
}
async function walk(directory) {
  const files = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const item = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(item));
    else if (entry.isFile() && /\.(jpe?g|png|webp|avif|tiff?)$/i.test(entry.name)) files.push(item);
  }
  return files.sort((a,b)=>a.localeCompare(b));
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const input = path.resolve(opts.directory);
  if (!(await fs.stat(input)).isDirectory()) throw new Error(`Not a directory: ${input}`);
  const candidates = await walk(input);
  if (!candidates.length) throw new Error("No supported JPEG, PNG, WebP, AVIF, or TIFF images found.");
  if (candidates.length > 500) throw new Error("Import at most 500 photos per batch to avoid oversized deployments.");
  const existing = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  if (!Array.isArray(existing)) throw new Error("Gallery manifest must be a JSON array.");
  const known = new Set(existing.map(p=>p.src));
  const albumSlug = slugify(opts.album);
  const outputDir = path.join(destRoot, albumSlug);
  await fs.mkdir(outputDir, { recursive: true });
  let added = 0, skipped = 0;
  for (const file of candidates) {
    const stat = await fs.stat(file);
    if (stat.size > 40_000_000) { console.warn(`Skipped oversized file: ${path.basename(file)}`); skipped++; continue; }
    const contents = await fs.readFile(file);
    const hash = crypto.createHash("sha256").update(contents).digest("hex").slice(0, 12);
    const filename = `${slugify(path.parse(file).name).slice(0, 48)}-${hash}.webp`;
    const src = `/gallery/${albumSlug}/${filename}`;
    if (known.has(src)) { skipped++; continue; }
    try {
      const metadata = await sharp(contents, { limitInputPixels: 80_000_000 }).metadata();
      if (!metadata.width || !metadata.height) throw new Error("Invalid dimensions");
      // Rotate using EXIF; avoid serving the original file, including private metadata.
      await sharp(contents, { limitInputPixels: 80_000_000 })
        .rotate()
        .resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80, effort: 4 })
        .toFile(path.join(outputDir, filename));
      existing.push({
        src,
        album: opts.album,
        alt: `Photograph from ${opts.album}`,
        caption: `${opts.album} · Photograph ${String(existing.filter(p=>p.album===opts.album).length + 1).padStart(2,"0")}`,
        location: opts.location,
        portrait: metadata.orientation && [5,6,7,8].includes(metadata.orientation)
          ? metadata.width > metadata.height : metadata.height > metadata.width,
      });
      known.add(src);
      added++;
      console.log(`Imported ${path.basename(file)} -> ${src}`);
    } catch (error) {
      skipped++;
      console.warn(`Skipped ${path.basename(file)}: ${error.message}`);
    }
  }
  await fs.writeFile(manifestPath, JSON.stringify(existing, null, 2) + "\n");
  console.log(`\nComplete. Added: ${added}. Skipped: ${skipped}. Total: ${existing.length}.`);
  console.log(`Review ${path.relative(root, manifestPath)} and the images in ${path.relative(root, outputDir)} before publishing.`);
}
main().catch((error) => { console.error(error.message); process.exitCode=1; });
