/* ============================================================================
   FILE: mtc_cine.payload.js
   PATH: Funnels/11 in 1 Multi Tool Card - 13710547/11 in 1 Multi Tool Card (F+S)/_src/mtc_cine.payload.js
   ----------------------------------------------------------------------------
   READABLE SOURCE of the cinematic Variant B's script. build_cinematic.py
   Base64-encodes it into the data-mtc-cine-payload attribute of the hidden
   <img data-mtc-cine-boot> at the end of the page (CF strips and mangles a
   pasted <script>; see Documentation/SOP-CF-Custom-JS-Injection.md). Edit
   here, re-run build_cinematic.py -- never edit the Base64.

   What it does, per [data-mtc-cine] root (multi-instance safe; no ids):
     * Reduced motion -> nothing animates; the page is already complete.
     * Otherwise adds .mtc-cine-wait (hides only the hero lines for their
       entrance), loads GSAP 3.14.2 + ScrollTrigger (jsdelivr -> cdnjs ->
       unpkg), then builds:
         Act 1  hero lines rise in; the photo pushes in + darkens on scroll
         Act 2  ANATOMY: pins the stage (pinType 'fixed' -- CF's
                overflow-hidden ancestor breaks position:sticky), moves a
                camera over pr-photo-7218 to each beat's focal point
                (data-fx / data-fy on the photo, 0..1; data-z = zoom over
                the card-fit scale), swaps the caption, ticks the tool
                counter, pulses the reticle
         Act 3+ clip wipes, line reveals, the $19 strike -> FREE punch,
                parallax on the full-bleed photos
       and a floating CTA bar (moved to <body> so position:fixed is the
       viewport's) shown after the hero, hidden while the order form is on
       screen.
     * If GSAP never loads: removes .mtc-cine-wait -> the static page.
   Debug: add ?mtcdebug to the URL to log the pipeline to the console.

   REVISION HISTORY
     v1 (2026-10-20) Claude: first version. Zoom capped at the photo's native
                     pixels. Loader + guards from
                     OSK_Prelander_STN_v3.payload.js (the SOP's reference).
   ============================================================================ */
(function () {
  "use strict";
  if (window.__mtcCineRan) return;
  window.__mtcCineRan = true;
  var DBG = /[?&]mtcdebug/i.test(location.search) || window.MTC_DEBUG;
  function log() { if (DBG && window.console) console.log.apply(console, ['[MTC CINE]'].concat([].slice.call(arguments))); }
  log('payload executed');

  var REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PHOTO = { w: 5712, h: 3213 };                        // pr-photo-7218
  var CARD = { x0: 0.488, x1: 0.660, y0: 0.222, y1: 0.640 };   // the card on that photo (measured)
  var GSAP_URLS = [
    'https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.14.2/gsap.min.js',
    'https://unpkg.com/gsap@3.14.2/dist/gsap.min.js'
  ];
  var ST_URLS = [
    'https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/ScrollTrigger.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.14.2/ScrollTrigger.min.js',
    'https://unpkg.com/gsap@3.14.2/dist/ScrollTrigger.min.js'
  ];

  function loadFirst(urls) {
    return new Promise(function (res, rej) {
      var i = 0;
      (function next() {
        if (i >= urls.length) { rej(new Error('all CDNs failed')); return; }
        var url = urls[i++], s = document.createElement('script');
        s.src = url; s.async = true;
        s.onload = function () { log('loaded', url); res(); };
        s.onerror = function () { log('FAILED', url); next(); };
        document.head.appendChild(s);
      })();
    });
  }
  function orderForm() {
    return document.querySelector('[data-title="_ORDERFORM"]') || document.querySelector('[data-de-type^="order2step"]') ||
           document.querySelector('.orderformtarget');
  }

  // ---- Floating CTA: works without GSAP (IntersectionObserver), so it runs first. ----
  function floatbar(root) {
    var fb = root.querySelector('[data-cine-fbar]') || root.__fbar;
    var hero = root.querySelector('[data-cine-hero]');
    if (!fb || !hero || !('IntersectionObserver' in window)) return;
    root.__fbar = fb;
    if (fb.parentNode !== document.body) document.body.appendChild(fb);   // fixed = the viewport's
    var pastHero = false, formOn = false;
    function apply() {
      var on = pastHero && !formOn;
      fb.classList.toggle('mtc-cine-fbar-on', on);
      fb.setAttribute('aria-hidden', on ? 'false' : 'true');
      var a = fb.querySelector('a'); if (a) a.tabIndex = on ? 0 : -1;
    }
    new IntersectionObserver(function (es) { pastHero = !es[0].isIntersecting; apply(); }, { threshold: 0 }).observe(hero);
    var f = orderForm();
    if (f) new IntersectionObserver(function (es) { formOn = es[0].isIntersecting; apply(); }, { threshold: 0 }).observe(f);
  }

  function init(root) {
    if (!root || root.__mtcCine) return;
    root.__mtcCine = true;
    log('init');
    floatbar(root);
    if (REDUCE) { log('reduced motion: static page'); return; }
    root.classList.add('mtc-cine-wait');
    var safety = setTimeout(function () { root.classList.remove('mtc-cine-wait'); log('safety timeout: static page'); }, 4000);
    var ready = (window.gsap && window.ScrollTrigger) ? Promise.resolve() :
      loadFirst(GSAP_URLS).then(function () { return loadFirst(ST_URLS); });
    ready.then(function () {
      clearTimeout(safety);
      if (!(window.gsap && window.ScrollTrigger)) throw new Error('globals missing');
      build(root);
    }).catch(function (e) {
      clearTimeout(safety);
      root.classList.remove('mtc-cine-wait', 'mtc-cine-on');
      log('GSAP unavailable -> static page:', e && e.message);
    });
  }

  function build(root) {
    var gsap = window.gsap, ST = window.ScrollTrigger;
    gsap.registerPlugin(ST);
    var q = function (s) { return root.querySelector(s); };
    var qa = function (s) { return [].slice.call(root.querySelectorAll(s)); };

    // Initial states are set here, then the class swap -- so nothing is hidden
    // unless GSAP is present to bring it back.
    var lines = qa('[data-fx="line"]'), heroFx = qa('[data-fx="hero"]');
    gsap.set(lines, { yPercent: 110 });
    gsap.set(heroFx, { autoAlpha: 0, y: 24 });
    root.classList.add('mtc-cine-on');
    root.classList.remove('mtc-cine-wait');

    // ---- ACT 1: hero entrance + scroll push-in ----
    gsap.timeline({ delay: 0.15 })
      .to(lines, { yPercent: 0, duration: 0.9, stagger: 0.16, ease: 'power3.out' })
      .to(heroFx, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.12, ease: 'power2.out' }, '-=0.45');
    var hero = q('[data-cine-hero]'), heroImg = q('[data-cine-hero-img]');
    if (hero && heroImg) {
      gsap.fromTo(heroImg, { scale: 1.02 }, { scale: 1.14, ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to(q('.mtc-cine-cue'), { autoAlpha: 0, ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: '20% top', scrub: true } });
    }

    // ---- ACT 2: anatomy camera ----
    buildAnatomy(root, gsap, ST);

    // ---- Reveals ----
    qa('[data-fx="up"]').forEach(function (el) {
      gsap.from(el, { autoAlpha: 0, y: 34, duration: 0.8, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 86%', once: true } });
    });
    qa('[data-fx="wipe"]').forEach(function (el, i) {
      gsap.fromTo(el, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 1.1, ease: 'power3.inOut',
        delay: (i % 2) * 0.12, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
    var l2 = qa('[data-fx="line2"]');
    if (l2.length) gsap.from(l2, { yPercent: 110, duration: 0.9, stagger: 0.16, ease: 'power3.out',
      scrollTrigger: { trigger: l2[0], start: 'top 85%', once: true } });

    // ---- ACT 4: $19 struck through, then FREE ----
    var val = q('[data-cine-value]'), strike = q('[data-cine-strike]'), free = q('[data-cine-free]');
    if (val && strike && free) {
      gsap.set(strike, { scaleX: 0 });
      gsap.set(free, { autoAlpha: 0, scale: 0.6 });
      gsap.timeline({ scrollTrigger: { trigger: val, start: 'top 70%', once: true } })
        .to(strike, { scaleX: 1, duration: 0.55, ease: 'power2.inOut' })
        .to(free, { autoAlpha: 1, scale: 1, duration: 0.6, ease: 'back.out(2.2)' }, '+=0.1');
    }

    // ---- Parallax on full-bleed photos ----
    qa('[data-cine-bleed]').forEach(function (sec) {
      var img = sec.querySelector('[data-cine-par]');
      if (img) gsap.fromTo(img, { yPercent: -8 }, { yPercent: 8, ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    var refresh = function () { ST.refresh(); };
    window.addEventListener('load', refresh);
    setTimeout(refresh, 1500);
    root.__mtcCineBuilt = true;
    window.__mtcCineBuilt = (window.__mtcCineBuilt || 0) + 1;
    log('built; ScrollTriggers =', ST.getAll().length);
  }

  function buildAnatomy(root, gsap, ST) {
    var stage = root.querySelector('[data-cine-stage]'), cam = root.querySelector('[data-cine-cam]'),
        img = root.querySelector('[data-cine-cam-img]'), beats = [].slice.call(root.querySelectorAll('.mtc-cine-beat:not([data-final])')),
        fin = root.querySelector('.mtc-cine-beat[data-final]'),
        count = root.querySelector('[data-cine-count]'), countWrap = root.querySelector('.mtc-cine-count'),
        bar = root.querySelector('[data-cine-bar]'), ret = root.querySelector('[data-cine-reticle]');
    if (!stage || !cam || !img || !beats.length) return;
    img.loading = 'eager';                       // the pinned scene must not wait on lazy-load
    var shots = [{ fx: (CARD.x0 + CARD.x1) / 2, fy: (CARD.y0 + CARD.y1) / 2, z: 1, n: 0 }].concat(beats.map(function (b) {
      return { fx: +b.getAttribute('data-fx'), fy: +b.getAttribute('data-fy'), z: +b.getAttribute('data-z') || 2, n: +b.getAttribute('data-n') || 0 };
    }));
    var geo = {};
    // Size the photo to "cover" the stage once; the camera is a transform on top.
    function measure() {
      var W = stage.clientWidth, H = stage.clientHeight;
      var k = Math.max(W / PHOTO.w, H / PHOTO.h);
      var iw = PHOTO.w * k, ih = PHOTO.h * k;
      // via CSS variables: the stylesheet's !important size rules read them (an inline px width alone loses)
      img.style.setProperty('--mtc-cam-w', iw + 'px'); img.style.setProperty('--mtc-cam-h', ih + 'px');
      // card-fit: the whole card at ~78% of the stage's short side (and the panel's room on desktop)
      var cw = (CARD.x1 - CARD.x0) * iw, ch = (CARD.y1 - CARD.y0) * ih;
      var wide = W >= 900;
      var room = wide ? W * 0.52 : W * 0.92, roomH = wide ? H * 0.82 : H * 0.56;
      geo = { W: W, H: H, iw: iw, ih: ih, fit: Math.min(room / cw, roomH / ch), wide: wide, max: 1 / k };
    }
    function pose(s) {
      var scale = Math.min(geo.fit * s.z, geo.max);       // never past the photo's native pixels (stays sharp)
      var cx = geo.wide ? geo.W * 0.66 : geo.W * 0.5;     // desktop: subject right of the caption panel
      var cy = geo.wide ? geo.H * 0.5 : geo.H * 0.36;     // phone: subject above the caption panel
      var x = cx - s.fx * geo.iw * scale, y = cy - s.fy * geo.ih * scale;
      x = Math.min(0, Math.max(geo.W - geo.iw * scale, x));   // never show past the photo's edge
      y = Math.min(0, Math.max(geo.H - geo.ih * scale, y));
      return { x: x, y: y, scale: scale };
    }
    root.classList.add('mtc-cine-anat-on');      // full-screen stage first -- then measure it
    measure();
    gsap.set(img, { transformOrigin: '0 0' });
    gsap.set(img, pose(shots[0]));
    gsap.set(beats.concat(fin ? [fin] : []), { autoAlpha: 0, y: 26 });
    gsap.set(ret, { autoAlpha: 0, scale: 1.6 });
    if (count) count.textContent = '0';

    // states: -1 = overview (no caption, no counter), 0..n-1 = a tool, 'end' = pulled back (closing caption)
    var current = -1;
    function cap(i) { return i === 'end' ? fin : (i >= 0 ? beats[i] : null); }
    function countTo(v) {
      if (!count) return;
      var from = { v: +count.textContent || 0 };
      gsap.to(from, { v: v, duration: 0.5, ease: 'power1.out', overwrite: true, onUpdate: function () { count.textContent = Math.round(from.v); } });
    }
    function show(i) {
      if (i === current) return;
      var prev = cap(current), next = cap(i); current = i;
      if (prev) gsap.to(prev, { autoAlpha: 0, y: -18, duration: 0.3, overwrite: true });
      if (next) gsap.fromTo(next, { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.45, delay: 0.1, overwrite: true });
      if (countWrap) gsap.to(countWrap, { autoAlpha: i === -1 ? 0 : 1, duration: 0.3, overwrite: true });
      if (typeof i === 'number' && i >= 0) {
        gsap.fromTo(ret, { autoAlpha: 0, scale: 1.6 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'power3.out', overwrite: true });
        countTo(shots[i + 1].n);
      } else {
        gsap.to(ret, { autoAlpha: 0, duration: 0.25, overwrite: true });
        if (i === 'end') countTo(11);
      }
    }

    // One timeline step per beat: move the camera, then hold. Labels drive the captions.
    // Function values: GSAP re-reads them whenever the timeline is invalidated
    // (refreshInit below), so a resize / rotation re-aims every shot.
    function move(s) {
      return { duration: 1, x: function () { return pose(s).x; }, y: function () { return pose(s).y; },
               scale: function () { return pose(s).scale; } };
    }
    var tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } });
    tl.to({}, { duration: 0.5 });              // overview hold
    shots.slice(1).forEach(function (s, k) {
      tl.to(img, move(s), '>');
      tl.addLabel('beat' + k);
      tl.to({}, { duration: 0.9 });            // hold on the tool
    });
    tl.to(img, move(shots[0]), '>');           // pull back to the whole card
    tl.to({}, { duration: 0.4 });

    ST.create({
      trigger: stage, start: 'top top',
      end: function () { return '+=' + Math.round(window.innerHeight * (1.1 * shots.length)); },
      pin: stage, pinType: 'fixed', pinSpacing: true, anticipatePin: 1, scrub: 0.6,
      animation: tl, invalidateOnRefresh: true,
      onRefreshInit: function () { measure(); },
      onUpdate: function (self) {
        if (bar) bar.style.transform = 'scaleX(' + self.progress.toFixed(3) + ')';
        var t = tl.duration() * self.progress, idx = -1;
        for (var k = 0; k < beats.length; k++) {
          var at = tl.labels['beat' + k];
          if (t >= at - 0.35) idx = k;
        }
        if (t >= tl.duration() - 1.3) idx = 'end';       // pulled back: all 11
        show(idx);
      }
    });
    // Re-pose the camera when the stage size changes (rotation / toolbar).
    ST.addEventListener('refreshInit', function () {
      measure(); tl.invalidate();
    });
  }

  function boot() {
    var roots = document.querySelectorAll('[data-mtc-cine]');
    log('roots', roots.length);
    [].forEach.call(roots, init);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
