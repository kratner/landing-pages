# Landing-page test bed

Local harness for the saved ClickFunnels landing pages in [`../assets/`](../assets/).
Boots a real (headless) Chrome, loads a page, and reports whether GSAP/ScrollTrigger
loaded, how many ScrollTriggers were built, captures console + failed requests, and
writes screenshots of each scroll position.

## Setup (once)

```bash
cd tests
npm install            # installs puppeteer + a bundled Chrome
```

## ⚠️ You must open the page over http://, NOT file://

Double-clicking the `.html` (a `file://` URL) makes Chrome treat it as an opaque
"null" origin and **block every local script** (GSAP, ScrollTrigger, the CF bundles)
with a CORS error — so nothing animates. This is a browser security rule, not a bug in
the page; it cannot be patched in the HTML. Always view it through a local server:

- **Easiest:** `cd tests && npm run serve` — opens the page in your browser automatically.
- **In VS Code:** right-click `assets/Outdoor Survival Kit.html` → **Open with Live Server**.

## Use

```bash
# Serve the repo over http and open the page yourself in a browser:
npm run serve          # http://localhost:8080/assets/Outdoor%20Survival%20Kit.html
#   add ?oskdebug to the URL to print the page's own load/build trace to the console.

# Automated diagnosis (boots Chrome, scrolls, screenshots -> ./screenshots/):
npm run diagnose                       # Outdoor Survival Kit over the local server
node diagnose.js --offline             # block every external host (CDN/images) — proves
                                       # the animation works with ZERO network
node diagnose.js "http://localhost:8080/assets/SHTF%20Survival%20Kit.html"   # any page/URL
```

A healthy run prints:

```
GSAP loaded           : true
ScrollTrigger loaded  : true
ScrollTrigger count   : 20
first tool opacity    : 1
```

## Files

| File              | Purpose                                                          |
| ----------------- | --------------------------------------------------------------- |
| `server.js`       | Tiny static server rooted at the repo (serves `assets/...`).    |
| `diagnose.js`     | Puppeteer harness: load → inspect GSAP state → scroll → shoot.   |
| `screenshots/`    | Output of the last `diagnose` run (acts 1–3).                    |
| `legacy/`         | The original one-off `test-*.js` scripts, kept for reference.    |

## What was broken (Outdoor Survival Kit) and the fixes

The Act-2 pinned "case opens / tools fan out" animation is driven by GSAP +
ScrollTrigger, injected at runtime.

1. **"No animations" — the real cause: `prefers-reduced-motion`.** The page had an
   accessibility guard (`if(reduce) return;`) that built **zero** animations whenever
   the OS "Reduce Motion" setting was on — extremely common on macOS. That left the
   page completely static for those visitors while working for everyone else.
   Reproduce it: `node diagnose.js` passes, but emulating reduce-motion yields
   `ScrollTrigger count: 0`. Fix: the timeline now builds regardless; set
   `window.OSK_RESPECT_REDUCED_MOTION = true` to restore the strict a11y behaviour.

2. **GSAP loader hardening.** The loader now tries the **local**
   `Outdoor Survival Kit_files/gsap.min.js` + `ScrollTrigger.min.js` *first*, then the
   CDNs, plus a short poll fallback — deterministic and fully offline-capable. On the
   live ClickFunnels page the relative paths 404 and fall through to the CDNs, so live
   behaviour is unchanged. Verified with `--offline`.

3. **The actual "case stuck open, no scrub" bug — CF re-render orphaning the tweens.**
   ClickFunnels' `lander.js` re-renders the custom-HTML `.osk-stn` subtree *after*
   `buildTimeline()` runs, replacing every node. The 20 ScrollTriggers still exist and
   their progress still advances, but they drive **detached** nodes — so on screen
   nothing moves and the case sits on its static (open) markup frame. Diagnose it with
   `node diagnose.js`: a healthy node has `tool0._gsap` set and `toolOpacity:0` at the
   top; the bug shows `_gsap:false`, `toolOpacity:1`, no `.pin-spacer`. Fix:
   `buildTimeline()` now re-resolves the live root, tears down the prior build
   (`ScrollTrigger.getAll().kill()`) and rebuilds against the current nodes, and is
   re-run on `load` + at 1.5s/3s to bind to CF's final re-rendered DOM.

4. **Exit-intent promo modal removed.** The `.modalBackdropWrapper` + `#modalPopup`
   ("LIMITED TIME OFFER" → myhomepromos.com) DOM was deleted from the markup, so the
   ClickFunnels exit-intent popup never appears.

5. **Dead third-party scripts stripped.** Removed ~5 KB of tracking/analytics/shims that
   only spammed the console and failed locally: Google Tag Manager (script + bootstrap +
   noscript), `application.js` (CF userevents/pageview tracking), `main.js` (Everflow),
   `scripts.js` + Chargeblast inline, `pushcrew.js`, `powerscripts.js` (+ bootstrap),
   the Cloudflare challenge/beacon iframes, and the IE9 html5shiv. Kept the core that the
   layout/animation need: `vendor.js`, `lander.js`, `gsap.min.js`, `ScrollTrigger.min.js`.

> Note: some imagery (Act-1 background, the 24-frame case-open sequence, tool motion
> clips) is served from `mtp-images.com` and is **not** all saved locally, so a few
> images 404 when fully offline. The animation itself runs regardless; tools fall back
> to their local still posters.
