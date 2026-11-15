# Gallery and brand favicon

## What's included

- `/gallery` — a responsive photo gallery with destination filters and an accessible fullscreen viewer.
- `src/app/favicon.ico`, `src/app/icon.png`, `src/app/apple-icon.png` — branded square **RW** artwork cropped from the supplied green/gold Reign in Wealth logo. These replace the old generic site icon.
- `src/data/gallery-photos.json` — the curated list of original retreat images. It starts empty on purpose; the page shows correctly labelled destination *inspiration* photos until approved retreat images are imported.
- `scripts/import-gallery.mjs` — resizes and converts source images to local WebP files without depending on short-lived Google Drive image links.

## Import photographs from the shared Drive folder

Source link provided by the site owner:

`https://drive.google.com/drive/folders/1mnOYikCHK9EdBDoPf0zxFaqKSK2CkYDJ?usp=sharing`

The folder was not available through the connected Drive file mount when this update was packaged, so **its contents were not downloaded or published**. Do not claim that the destination imagery supplied in the theme is from a past retreat. To add the actual photos:

1. Open the shared folder in Google Drive and use **Download** to download its selected images or the entire folder as a ZIP. If you are entitled to view but cannot download, ask the folder owner to grant download permission. You can also add a shortcut to the connected Google Drive account for subsequent assisted access.
2. Unzip the Drive download into a temporary directory in your Codespace (outside the project, for example `/workspaces/ghana-retreat-photos`). Do not place raw originals or private images inside `public/`.
   - Optional: If you prefer a command-line download and the folder truly permits public downloads, try `python3 -m pip install --user gdown` followed by `python3 -m gdown --folder "https://drive.google.com/drive/folders/1mnOYikCHK9EdBDoPf0zxFaqKSK2CkYDJ?usp=sharing" -O /workspaces/ghana-retreat-photos --remaining-ok`. Google can rate-limit or refuse automated folder downloads, in which case use the Google Drive website instead.
3. In Codespaces, review the images. Remove any photos without publishing rights, especially identifiable traveler photographs for which consent is missing.
4. From the project directory, run:

   ```bash
   npm ci
   npm run gallery:import -- /workspaces/ghana-retreat-photos --album "Ghana 2026" --location "Ghana"
   ```

5. Review `src/data/gallery-photos.json`. Edit `caption`, `alt`, `album`, and `location` for each image as needed. Remove unapproved records and the corresponding generated WebP files.
6. Preview locally with `npm run dev` and visit `/gallery`.
7. Commit only the generated WebP images under `public/gallery/` and their curated `src/data/gallery-photos.json` entries. The next cPanel Git deployment copies both `src` and `public` to the app directory.

   ```bash
   git add reign-in-wealth-retreats/public/gallery reign-in-wealth-retreats/src/data/gallery-photos.json
   git commit -m "Publish approved Ghana 2026 retreat photographs"
   git push origin main
   ```

   Adjust the path prefix if your terminal is already inside `reign-in-wealth-retreats`.

8. On cPanel use Git Version Control → Update from Remote → Deploy HEAD Commit, then restart Passenger if it doesn't restart automatically.

## Working with albums

Re-run the importer with a different `--album`, such as `Dubai 2026`, for a new trip. The gallery automatically renders a filter for each album. Re-importing identical photos in the same album is idempotent.

Images are converted to max 1800px WebP (quality 80) to reduce page weight. The originals stay in your temporary input folder and are not copied into the website. Avoid storing private or sensitive images in the public gallery.

## Favicon updates and caching

New icons live in the Next.js App Router `src/app` folder and also have explicit URLs in the site's metadata. The old `icon.svg` has been removed to avoid a conflicting favicon. The new favicon is extracted from the original green R and gold W of the brand logo rather than using a generic monogram font.

After deploying, verify `https://reigninwealthretreats.com/favicon.ico` and `https://reigninwealthretreats.com/icon.png`. If a browser still shows the old icon, try a hard refresh or a private window: favicons are aggressively cached.
