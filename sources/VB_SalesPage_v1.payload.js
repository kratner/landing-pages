/* ============================================================================
   Veterans Bar -- cinematic page script (readable source)
   ----------------------------------------------------------------------------
   Ships Base64-encoded in the data-vbc-payload attribute of the hidden
   <img data-vbc-boot> at the end of the page; the image's onload decodes
   and injects it. That keeps the page a single self-contained HTML block that
   runs on hosts and page builders which strip or rewrite pasted <script> tags.

   Per [data-vbc] root (multi-instance safe; no ids):
     * Reduced motion -> nothing animates; the page is already complete.
     * Otherwise adds .vbc-wait (hides only the hero lines for their entrance),
       loads GSAP 3.14.2 + ScrollTrigger (jsdelivr -> cdnjs -> unpkg), then:
         Act 1  hero lines rise in; the photo pushes in on scroll
         Act 2  TURN IT OVER: pins the stage (pinType 'fixed', which survives
                an overflow-hidden ancestor where position:sticky would not),
                eases a camera to each detail on the bar (data-x / data-y on
                that face, 0..1; data-z = zoom, capped at the render's native
                pixels), turns the bar over between the front and back
                details, swaps the caption, rings the detail, pulls back
         Act 3+ wipes, line reveals, the $49 strike -> FREE punch, parallax
       and a floating CTA bar (moved to <body> so position:fixed is the
       viewport's), shown after the hero and hidden over the final
       call-to-action section.
     * If GSAP never loads: removes .vbc-wait -> the static page.
   Debug: add ?vbcdebug to the URL to log the pipeline to the console.
   ============================================================================ */
(function () {
  "use strict";
  if (window.__vbcRan) return;
  window.__vbcRan = true;
  var DBG = /[?&]vbcdebug/i.test(location.search) || window.VBC_DEBUG;
  function log() { if (DBG && window.console) console.log.apply(console, ['[VBC]'].concat([].slice.call(arguments))); }
  log('payload executed');

  var REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NATIVE_W = 1315;                                   // the front cutout's width in px (never upscale past it)
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
    return document.querySelector('[data-vbc-final]');
  }

  // ---- Floating CTA: works without GSAP (IntersectionObserver), so it runs first. ----
  function floatbar(root) {
    var fb = root.querySelector('[data-vbc-fbar]') || root.__fbar;
    var hero = root.querySelector('[data-vbc-hero]');
    if (!fb || !hero || !('IntersectionObserver' in window)) return;
    root.__fbar = fb;
    if (fb.parentNode !== document.body) document.body.appendChild(fb);   // fixed = the viewport's
    var pastHero = false, formOn = false;
    function apply() {
      var on = pastHero && !formOn;
      fb.classList.toggle('vbc-fbar-on', on);
      fb.setAttribute('aria-hidden', on ? 'false' : 'true');
      var a = fb.querySelector('a'); if (a) a.tabIndex = on ? 0 : -1;
    }
    new IntersectionObserver(function (es) { pastHero = !es[0].isIntersecting; apply(); }, { threshold: 0 }).observe(hero);
    var f = orderForm();
    if (f) new IntersectionObserver(function (es) { formOn = es[0].isIntersecting; apply(); }, { threshold: 0 }).observe(f);
  }

  function init(root) {
    if (!root || root.__vbc) return;
    root.__vbc = true;
    log('init');
    floatbar(root);
    if (REDUCE) { log('reduced motion: static page'); return; }
    root.classList.add('vbc-wait');
    var safety = setTimeout(function () { root.classList.remove('vbc-wait'); log('safety timeout: static page'); }, 4000);
    var ready = (window.gsap && window.ScrollTrigger) ? Promise.resolve() :
      loadFirst(GSAP_URLS).then(function () { return loadFirst(ST_URLS); });
    ready.then(function () {
      clearTimeout(safety);
      if (!(window.gsap && window.ScrollTrigger)) throw new Error('globals missing');
      build(root);
    }).catch(function (e) {
      clearTimeout(safety);
      root.classList.remove('vbc-wait', 'vbc-on');
      log('GSAP unavailable -> static page:', e && e.message);
    });
  }

  function build(root) {
    var gsap = window.gsap, ST = window.ScrollTrigger;
    gsap.registerPlugin(ST);
    var q = function (s) { return root.querySelector(s); };
    var qa = function (s) { return [].slice.call(root.querySelectorAll(s)); };

    // Initial states first, then the class swap -- nothing is hidden unless GSAP is here to bring it back.
    var lines = qa('[data-fx="line"]'), heroFx = qa('[data-fx="hero"]');
    gsap.set(lines, { yPercent: 110 });
    gsap.set(heroFx, { autoAlpha: 0, y: 24 });
    root.classList.add('vbc-on');
    root.classList.remove('vbc-wait');

    // ---- ACT 1: hero entrance + scroll push-in ----
    gsap.timeline({ delay: 0.15 })
      .to(lines, { yPercent: 0, duration: 0.9, stagger: 0.16, ease: 'power3.out' })
      .to(heroFx, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.12, ease: 'power2.out' }, '-=0.45');
    var hero = q('[data-vbc-hero]'), heroImg = q('[data-vbc-hero-img]');
    if (hero && heroImg) {
      gsap.fromTo(heroImg, { scale: 1.02 }, { scale: 1.12, ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to(q('.vbc-cue'), { autoAlpha: 0, ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: '20% top', scrub: true } });
    }

    // ---- ACT 2: turn it over ----
    buildTurn(root, gsap, ST);

    // ---- Reveals ----
    qa('[data-fx="up"]').forEach(function (el) {
      gsap.from(el, { autoAlpha: 0, y: 34, duration: 0.8, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 86%', once: true } });
    });
    qa('[data-fx="wipe"]').forEach(function (el) {
      gsap.fromTo(el, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 1.1, ease: 'power3.inOut',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
    var l2 = qa('[data-fx="line2"]');
    if (l2.length) gsap.from(l2, { yPercent: 110, duration: 0.9, stagger: 0.16, ease: 'power3.out',
      scrollTrigger: { trigger: l2[0], start: 'top 85%', once: true } });

    // ---- ACT 4: $49 struck through, then FREE ----
    var val = q('[data-vbc-value]'), strike = q('[data-vbc-strike]'), free = q('[data-vbc-free]');
    if (val && strike && free) {
      gsap.set(strike, { scaleX: 0 });
      gsap.set(free, { autoAlpha: 0, scale: 0.6 });
      gsap.timeline({ scrollTrigger: { trigger: val, start: 'top 70%', once: true } })
        .to(strike, { scaleX: 1, duration: 0.55, ease: 'power2.inOut' })
        .to(free, { autoAlpha: 1, scale: 1, duration: 0.6, ease: 'back.out(2.2)' }, '+=0.1');
    }

    // ---- Parallax on the full-bleed photo ----
    qa('[data-vbc-bleed]').forEach(function (sec) {
      var img = sec.querySelector('[data-vbc-par]');
      if (img) gsap.fromTo(img, { yPercent: -8 }, { yPercent: 8, ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    var refresh = function () { ST.refresh(); };
    window.addEventListener('load', refresh);
    setTimeout(refresh, 1500);
    root.__vbcBuilt = true;
    window.__vbcBuilt = (window.__vbcBuilt || 0) + 1;
    log('built; ScrollTriggers =', ST.getAll().length);
  }

  function buildTurn(root, gsap, ST) {
    var stage = root.querySelector('[data-vbc-stage]'), cam = root.querySelector('[data-vbc-cam]'),
        card = root.querySelector('[data-vbc-card]'),
        beats = [].slice.call(root.querySelectorAll('.vbc-beat:not([data-final])')),
        fin = root.querySelector('.vbc-beat[data-final]'),
        side = root.querySelector('[data-vbc-side]'), step = root.querySelector('[data-vbc-step]'),
        countWrap = root.querySelector('.vbc-count'),
        bar = root.querySelector('[data-vbc-bar]'), ring = root.querySelector('[data-vbc-ring]');
    if (!stage || !cam || !card || !beats.length) return;
    [].forEach.call(card.querySelectorAll('img'), function (i) { i.loading = 'eager'; });   // the pinned scene must not wait on lazy-load
    var shots = beats.map(function (b) {
      return { x: +b.getAttribute('data-x'), y: +b.getAttribute('data-y'), z: +b.getAttribute('data-z') || 1.5,
               back: b.getAttribute('data-face') === 'back' };
    });
    var firstBack = -1;
    for (var k = 0; k < shots.length; k++) if (shots[k].back) { firstBack = k; break; }
    var geo = {};

    // The camera box is placed and sized by CSS (--vbc-cam-* below); the camera move is a transform on it.
    function measure() {
      var W = stage.clientWidth, H = stage.clientHeight, wide = W >= 900;
      var cw = wide ? Math.min(W * 0.48, 760) : Math.min(W * 0.9, 560);
      var ch = cw * 740 / 1315;
      geo = { W: W, H: H, cw: cw, ch: ch, wide: wide,
              cx: wide ? W * 0.68 : W * 0.5,             // desktop: subject right of the caption panel
              cy: wide ? H * 0.5 : H * 0.34,             // phone: subject above the caption panel
              max: NATIVE_W / cw };
      // via CSS variables: the stylesheet's !important box rules read them (inline px alone loses to them)
      cam.style.setProperty('--vbc-cam-l', (geo.cx - cw / 2) + 'px'); cam.style.setProperty('--vbc-cam-t', (geo.cy - ch / 2) + 'px');
      cam.style.setProperty('--vbc-cam-w', cw + 'px'); cam.style.setProperty('--vbc-cam-h', ch + 'px');
    }
    function pose(s) {
      if (!s) return { x: 0, y: 0, scale: 1 };
      var z = Math.min(s.z, geo.max);                    // never past the render's native pixels
      var x = (0.5 - s.x) * geo.cw * z;
      // desktop: never slide the bar under the caption panel (left ~40%); the ring follows the detail instead
      if (geo.wide) x = Math.max(x, geo.W * 0.41 - geo.cx + geo.cw * z / 2);
      return { x: x, y: (0.5 - s.y) * geo.ch * z, scale: z };
    }
    function ringAt(s) {                                 // where the detail ends up on screen once the shot settles
      var p = pose(s);
      return { left: geo.cx + p.x + (s.x - 0.5) * geo.cw * p.scale, top: geo.cy + p.y + (s.y - 0.5) * geo.ch * p.scale };
    }
    root.classList.add('vbc-turn-on');                   // full-screen stage first -- then measure it
    measure();
    gsap.set(cam, { transformOrigin: '50% 50%' });
    gsap.set(cam, pose(null));
    gsap.set(card, { rotationY: 0, transformPerspective: 1600 });
    gsap.set(beats.concat(fin ? [fin] : []), { autoAlpha: 0, y: 26 });
    gsap.set(ring, { autoAlpha: 0, scale: 1.6 });

    // states: -1 = overview, 0..n-1 = a detail, 'end' = pulled back
    var current = -1;
    function cap(i) { return i === 'end' ? fin : (i >= 0 ? beats[i] : null); }
    function show(i) {
      if (i === current) return;
      var prev = cap(current), next = cap(i); current = i;
      if (prev) gsap.to(prev, { autoAlpha: 0, y: -18, duration: 0.3, overwrite: true });
      if (next) gsap.fromTo(next, { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.45, delay: 0.1, overwrite: true });
      if (countWrap) gsap.to(countWrap, { autoAlpha: i === -1 ? 0 : 1, duration: 0.3, overwrite: true });
      if (typeof i === 'number' && i >= 0) {
        gsap.set(ring, ringAt(shots[i]));
        gsap.fromTo(ring, { autoAlpha: 0, scale: 1.6 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'power3.out', overwrite: true });
        if (side) side.textContent = shots[i].back ? 'Back' : 'Front';
        if (step) step.textContent = (i + 1) + ' of ' + shots.length;
      } else {
        gsap.to(ring, { autoAlpha: 0, duration: 0.25, overwrite: true });
        if (i === 'end') { if (side) side.textContent = 'Both'; if (step) step.textContent = 'sides'; }
      }
    }

    // Timeline: hold -> each front detail -> pull back + turn over -> each back detail -> pull back.
    // Function values are re-read when the timeline is invalidated (refreshInit), so a resize re-aims every shot.
    function move(s) {
      return { duration: 1, x: function () { return pose(s).x; }, y: function () { return pose(s).y; },
               scale: function () { return pose(s).scale; } };
    }
    var tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } });
    tl.to({}, { duration: 0.5 });                        // overview hold
    shots.forEach(function (s, k) {
      if (k === firstBack) {
        tl.to(cam, move(null), '>');                     // pull back...
        tl.to(card, { rotationY: 180, duration: 1.2, ease: 'power2.inOut' }, '>');   // ...and turn it over
      }
      tl.to(cam, move(s), '>');
      tl.addLabel('beat' + k);
      tl.to({}, { duration: 0.9 });                      // hold on the detail
    });
    tl.to(cam, move(null), '>');                         // pull back to the whole bar
    tl.to({}, { duration: 0.4 });

    ST.create({
      trigger: stage, start: 'top top',
      end: function () { return '+=' + Math.round(window.innerHeight * (1.1 * (shots.length + 2))); },
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
        // between the last front detail and the first back detail the bar is turning: no ring
        if (firstBack > 0 && idx === firstBack - 1 && t > tl.labels['beat' + (firstBack - 1)] + 0.9) idx = -1;
        if (t >= tl.duration() - 1.3) idx = 'end';
        show(idx);
      }
    });
    ST.addEventListener('refreshInit', function () { measure(); tl.invalidate(); });
  }

  function boot() {
    var roots = document.querySelectorAll('[data-vbc]');
    log('roots', roots.length);
    [].forEach.call(roots, init);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
