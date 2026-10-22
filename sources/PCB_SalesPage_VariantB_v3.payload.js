/* ============================================================================
   Paracord Survival Bracelet -- cinematic page script (readable source)
   ----------------------------------------------------------------------------
   Ships Base64-encoded in the data-pcb-cine-payload attribute of the hidden
   <img data-pcb-cine-boot> at the end of the page; the image's onload decodes
   and injects it. That keeps the page a single self-contained HTML block that
   runs on hosts and page builders which strip or rewrite pasted <script> tags.

   Per [data-pcb-cine] root (multi-instance safe; no ids):
     * Reduced motion -> nothing animates; the page is already complete.
     * Otherwise loads GSAP 3.14.2 + ScrollTrigger (jsdelivr -> cdnjs ->
       unpkg) and builds:
         Act 1  hero lines rise in; the photo pushes in on scroll
         Act 2  FIVE TOOLS: pins the stage (pinType 'fixed', which survives an
                overflow-hidden ancestor where position:sticky would not) and
                steps through one real close-up per tool: the shot crossfades
                in with a slow push, the caption swaps, the counter ticks
                1..5, then a closing shot of all of them
         Act 3+ clip wipes, line reveals, the $19 strike -> FREE punch,
                parallax on the full-bleed photos
       and a floating CTA bar (moved to <body> so position:fixed is the
       viewport's), shown after the hero and hidden over the checkout target.
     * If GSAP never loads: the static page stays.
   Debug: add ?pcbdebug to the URL to log the pipeline to the console.
   ============================================================================ */
(function () {
  "use strict";
  if (window.__pcbCineRan) return;
  window.__pcbCineRan = true;
  var DBG = /[?&]pcbdebug/i.test(location.search) || window.PCB_DEBUG;
  function log() { if (DBG && window.console) console.log.apply(console, ['[PCB CINE]'].concat([].slice.call(arguments))); }
  log('payload executed');

  var REDUCE = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
      fb.classList.toggle('pcb-cine-fbar-on', on);
      fb.setAttribute('aria-hidden', on ? 'false' : 'true');
      var a = fb.querySelector('a'); if (a) a.tabIndex = on ? 0 : -1;
    }
    new IntersectionObserver(function (es) { pastHero = !es[0].isIntersecting; apply(); }, { threshold: 0 }).observe(hero);
    var f = orderForm();
    if (f) new IntersectionObserver(function (es) { formOn = es[0].isIntersecting; apply(); }, { threshold: 0 }).observe(f);
  }

  function init(root) {
    if (!root || root.__pcbCine) return;
    root.__pcbCine = true;
    log('init');
    floatbar(root);
    if (REDUCE) { log('reduced motion: static page'); return; }
    root.classList.add('pcb-cine-wait');
    var safety = setTimeout(function () { root.classList.remove('pcb-cine-wait'); log('safety timeout: static page'); }, 4000);
    var ready = (window.gsap && window.ScrollTrigger) ? Promise.resolve() :
      loadFirst(GSAP_URLS).then(function () { return loadFirst(ST_URLS); });
    ready.then(function () {
      clearTimeout(safety);
      if (!(window.gsap && window.ScrollTrigger)) throw new Error('globals missing');
      build(root);
    }).catch(function (e) {
      clearTimeout(safety);
      root.classList.remove('pcb-cine-wait', 'pcb-cine-on');
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
    root.classList.add('pcb-cine-on');
    root.classList.remove('pcb-cine-wait');

    // ---- ACT 1: hero entrance + scroll push-in ----
    gsap.timeline({ delay: 0.15 })
      .to(lines, { yPercent: 0, duration: 0.9, stagger: 0.16, ease: 'power3.out' })
      .to(heroFx, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.12, ease: 'power2.out' }, '-=0.45');
    var hero = q('[data-cine-hero]'), heroImg = q('[data-cine-hero-img]');
    if (hero && heroImg) {
      gsap.fromTo(heroImg, { scale: 1.02 }, { scale: 1.14, ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to(q('.pcb-cine-cue'), { autoAlpha: 0, ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: '20% top', scrub: true } });
    }

    // ---- ACT 2: five tools ----
    buildTools(root, gsap, ST);

    // ---- Reveals ----
    qa('[data-fx="up"]').forEach(function (el) {
      gsap.from(el, { autoAlpha: 0, y: 34, duration: 0.8, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 86%', once: true } });
    });
    qa('[data-fx="wipe"]').forEach(function (el, i) {
      gsap.fromTo(el, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 1.1, ease: 'power3.inOut',
        delay: (i % 2) * 0.12, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
    qa('[data-fx="line2"]').forEach(function (el) {
      gsap.from(el, { yPercent: 110, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });

    // ---- ACT 5: $19 struck through, then FREE ----
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
    root.__pcbCineBuilt = true;
    window.__pcbCineBuilt = (window.__pcbCineBuilt || 0) + 1;
    log('built; ScrollTriggers =', ST.getAll().length);
  }

  function buildTools(root, gsap, ST) {
    var stage = root.querySelector('[data-cine-stage]'),
        shots = [].slice.call(root.querySelectorAll('[data-cine-shot]')),
        beats = [].slice.call(root.querySelectorAll('.pcb-cine-beat:not([data-final])')),
        fin = root.querySelector('.pcb-cine-beat[data-final]'),
        count = root.querySelector('[data-cine-count]'), countWrap = root.querySelector('.pcb-cine-count'),
        bar = root.querySelector('[data-cine-bar]');
    if (!stage || !shots.length || !beats.length) return;
    shots.forEach(function (s) { s.loading = 'eager'; });   // the pinned scene must not wait on lazy-load
    root.classList.add('pcb-cine-tools-on');               // stacked full-screen stage

    // states: 0..n-1 = a tool, 'end' = all of them (the closing shot)
    var caps = beats.concat(fin ? [fin] : []);
    gsap.set(caps, { autoAlpha: 0, y: 26 });
    gsap.set(shots, { autoAlpha: 0, scale: 1.04 });
    gsap.set(shots[0], { autoAlpha: 1 });
    if (count) count.textContent = '1';
    var current = null, n = beats.length;
    function shotFor(i) { return i === 'end' ? shots[shots.length - 1] : shots[Math.min(i, shots.length - 1)]; }
    function capFor(i) { return i === 'end' ? fin : beats[i]; }
    function show(i) {
      if (i === current) return;
      var prevCap = current === null ? null : capFor(current), prevShot = current === null ? null : shotFor(current);
      current = i;
      var nextCap = capFor(i), nextShot = shotFor(i);
      if (prevCap) gsap.to(prevCap, { autoAlpha: 0, y: -18, duration: 0.3, overwrite: true });
      if (nextCap) gsap.fromTo(nextCap, { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.5, delay: 0.1, overwrite: true });
      if (prevShot && prevShot !== nextShot) gsap.to(prevShot, { autoAlpha: 0, duration: 0.6, overwrite: 'auto' });
      // slow push on the incoming close-up (the shot stays sharp: 1600px source, max 1.12x)
      gsap.fromTo(nextShot, { autoAlpha: prevShot === nextShot ? 1 : 0, scale: 1.04 },
        { autoAlpha: 1, scale: 1.12, duration: 0.6, overwrite: 'auto',
          onComplete: function () { gsap.to(nextShot, { scale: 1.16, duration: 6, ease: 'none' }); } });
      if (countWrap) gsap.to(countWrap, { autoAlpha: i === 'end' ? 0 : 1, duration: 0.3, overwrite: true });
      if (count && i !== 'end') count.textContent = String(i + 1);
    }

    ST.create({
      trigger: stage, start: 'top top',
      end: function () { return '+=' + Math.round(window.innerHeight * 0.9 * (n + 1)); },
      pin: stage, pinType: 'fixed', pinSpacing: true, anticipatePin: 1,
      onUpdate: function (self) {
        if (bar) bar.style.transform = 'scaleX(' + self.progress.toFixed(3) + ')';
        var seg = Math.floor(self.progress * (n + 1));
        show(seg >= n ? 'end' : Math.max(0, seg));
      },
      onEnter: function () { if (current === null) show(0); },
      onEnterBack: function () { if (current === null) show(0); }
    });
    show(0);
  }

  function boot() {
    var roots = document.querySelectorAll('[data-pcb-cine]');
    log('roots', roots.length);
    [].forEach.call(roots, init);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
