# Gallery and photography

The gallery now contains all **86 owner-supplied photographs**, organized into Arrival & connection (23), Giving back (33), Around the table (15), and Explore Ghana (15).

## Public experience

- The home page is a compact overview: photo hero, three-photo experience preview, four retreat cards, and a community invitation.
- `/gallery` has collection filters, 24-image pagination, responsive thumbnails, and a fullscreen viewer with previous/next buttons, arrow-key navigation, Escape to close and focus restoration.
- Direct album links work at `/gallery?album=arrival#photographs`, `/gallery?album=giving-back#photographs`, `/gallery?album=around-the-table#photographs`, and `/gallery?album=explore-ghana#photographs`.
- `/journal/ghana-2026` tells the story through four collection previews. The experience and community pages also use the supplied photos.
- Ghana retreat pages use genuine Ghana retreat images. Other destination pages use original SVG illustrations labelled as such.

## Editing the collection

`src/data/gallery-photos.json` is the editable gallery catalogue. Update `album`, `alt` and `caption` for a photo; remove its record to remove it from the gallery. Also remove the associated WebP files if they should no longer be publicly accessible. Photos referenced in `src/data/gallery.ts` must be replaced there before removal.

`src/data/gallery.ts` defines the featured images used in the hero, overview, journal and gallery introduction. `src/data/media.ts` resolves legacy database image paths without mutating stored records. See `docs/PHOTO-SOURCES.csv` for the original-file mapping and `docs/ASSETS.md` for the asset register.

For later owner-approved photos, the existing importer remains available:

```bash
npm run gallery:import -- /path/to/local/photos --album "Your collection" --location "Your destination"
```

It creates local WebP assets and appends catalogue entries. The Photo component supports older catalogue entries without thumbnails. No Drive connection is needed to serve the completed gallery.

The source originals are not required to run or build this package. Deploy `public/` and `src/` together through the existing cPanel workflow.
