# Image and font register — November 20, 2026

## Photography supplied by the owner

All website photography in this update comes from the three archives attached for this task. No stock photographs are bundled or requested from an image CDN.

| Source archive | Photographs | Website collection |
| --- | ---: | --- |
| ARRIVAL-20261115T115615Z-1-001.zip | 23 | Arrival & connection |
| ORPHANAGE-20261115T115615Z-1-001(1).zip | 33 | Giving back |
| Same ORPHANAGE archive, meal/conversation sequence | 15 | Around the table |
| REIGN IN WEALTH-20261115T115334Z-1-006.zip, DAY 6 | 15 | Explore Ghana |

All 86 photographs are in `public/gallery/ghana-2026/`. Each has a full display version (up to 1800 pixels on its longest side) and a thumbnail (up to 720 pixels). Images are oriented using their EXIF rotation before encoding, never enlarged, and served without embedded EXIF/GPS metadata. The photographic content and existing photographic watermarks are retained. The raw originals stay outside the website package.

`docs/PHOTO-SOURCES.csv` records every published asset, its original archive and filename, source SHA-256, dimensions, and display file size. `src/data/gallery-photos.json` supplies accessible descriptions, captions, album assignments, dimensions, and thumbnail paths. Captions do not identify people by name or claim particular outcomes.

`public/images/retreats-share.jpg` is a 1200 × 630 crop of the supplied arrival group photograph for link previews. It is not an additional outside photo.

## Original destination illustrations

Three original SVG compositions are included at `public/images/illustrations/`: `dubai.svg`, `zanzibar.svg`, and `dominican-republic.svg`. These use vector shapes and the established emerald, warm ivory and gold palette. They are destination-inspired illustrations, not photographs of trips, hotels or confirmed venues. Cards and destination galleries label them accordingly. They do not depend on an external service or image-generation API.

## Existing database compatibility

The original nine stock WebP assets are absent from this package. Existing SQLite records may still name them. `src/data/media.ts` maps only those known legacy paths to the new assets at read time and removes duplicate gallery paths. Custom uploaded paths, retreat dates, prices, booking records, content and settings remain intact. The installer removes unchanged original stock assets by SHA-256 and backs them up. Its cleanup preserves customized files at those paths.

## Brand and typography

The original owner-supplied `public/images/reign-in-wealth-logo.png` and the branded favicon, app icon and Apple icon are retained. The existing Brand component presents the master wordmark with the RETREATS subtitle. No attendee photograph is assigned to the founder without an identified founder image.

Local Cormorant Garamond normal/italic and DM Sans font files remain in `public/fonts/`. Their supplied SIL Open Font License files remain beside them. Images and fonts used by this update are served locally.
