# REVISIONS — 1st Hour Trauma First Aid Kit (13688167) / 1stHour Protocols / Portable Protocols

Fully offline, self-contained copy of the complete 15-book 1st Hour Protocols
library — landing page + all 15 e-books (HTML + PDF) + every interior
illustration, cover, print-edition mockup, and font this whole package needs.
Built to be copied as one folder to a phone/tablet/USB drive and opened with
zero internet access.

Each component tracks its own version line. Current version stays at the top
level of this folder; prior versions move into `_archive/`.

---

## Portable Protocols (index.html + books/ + assets/ + pdfs/)

| Version | Date       | Author | Summary |
|---------|------------|--------|---------|
| v1      | 2026-08-29 | Claude | Initial build. Landing page (`index.html`) grouped into Track A (8 trauma-response guides) / Track B (7 emergency-prep guides), matching the grouping already established in `../Upsell/1HT_ProtocolsUpsell_LibraryBuilder_v1.payload.js`'s TRACK_A/TRACK_B arrays. Each card's cover image links to the local HTML book; each card's print-edition photo mockup links to the local PDF. Downloaded and vendored locally: all 15 books' interior illustrations (36 images total), 15 marketing cover images, 15 print-edition photo mockups, 15 PDFs (~63MB), the footer brand logo, and the 2 font files (Anton 400 + Inter variable, latin subset) the books' Google Fonts CDN link normally pulls at runtime — see `assets/fonts/fonts.css`. Copied the latest version of each of the 15 books from `../Books/` into `books/<Folder>/` and rewrote every external reference to a local relative path: the Google Fonts `<link>` block → `../../assets/fonts/fonts.css`, every `mtp-images.com` image/PDF URL → local `assets/` or `../../pdfs/`, the top-bar/footer `1sthour.com` logo link → `../../index.html`, and root-relative sibling cross-links (e.g. `/severe-bleeding/`) → relative paths into the matching sibling book folder. Left untouched, intentionally: each book's "Editor's note" link to `1sthourprotocols.com` (an explicit "check online for the current edition" affordance, not a page dependency) and a few plain-text mentions of `mtp-images.com`/ClickUp/`.pages.dev` inside header comments (not URLs, not fetched). Total package size ~164MB. |

### Open items
- [ ] Live device verification: copy this folder to an actual phone/tablet with Wi-Fi + cellular off, confirm every cover/print-edition/PDF/cross-link tap works and Anton/Inter render (not a system-font fallback).
- [ ] Decide on a distribution format (zip vs. folder copy vs. USB) once verified — not yet packaged.
- [ ] If any of the 15 books gets a new version in `../Books/` going forward, this package's copy needs to be re-synced by hand (it's a point-in-time snapshot, not a live mirror).
