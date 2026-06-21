/* ============================================================================
   OSK_Prelander_STN_v10.payload.js
   READABLE SOURCE for the Base64 bootstrap payload embedded in
   OSK_Prelander_STN_v10.html (attribute data-osk-payload on the data-osk-boot <img>).

   WHY base64: ClickFunnels' Custom JS/HTML element STRIPS <script> tags from the
   pasted block (confirmed on the live page: 0 osk <script> elements in the DOM) AND
   mangles their contents when it tries to run them ("Unexpected identifier"). Base64
   in a data-* attribute is HTML-safe (only A-Za-z0-9+/=) so CF cannot corrupt it, and
   it is not a <script> tag so CF cannot strip it. The 1×1-image onload handler decodes
   it (UTF-8 safe) and injects it as a live <script>, which DOES execute.

   EDIT HERE, then regenerate the base64 and paste it into data-osk-payload:
     node -e "const fs=require('fs');console.log(Buffer.from(fs.readFileSync('OSK_Prelander_STN_v10.payload.js','utf8'),'utf8').toString('base64'))"
   ============================================================================ */
  (function(){
    "use strict";
    // Tell the onerror bootstrap (data-osk-boot, above) that the inline <script>
    // DID execute on its own, so it should NOT re-inject us. Set immediately.
    window.__oskStnRan = true;
    // Debug telemetry — silent by default; append ?oskdebug to the URL (or set
    // window.OSK_DEBUG=true) to print the load/build trace to the console. Lets us
    // see on the LIVE CF page exactly where the pipeline dies (script ran? GSAP
    // loaded? timeline built?) without guessing.
    var DBG = (typeof location!=='undefined' && /[?&]oskdebug/i.test(location.search)) || window.OSK_DEBUG;
    function log(){ if(DBG && window.console && console.log){ console.log.apply(console, ['[OSK STN]'].concat([].slice.call(arguments))); } }
    log('script executed'); // if you never see this on the live page, CF did not run the <script> (e.g. innerHTML inject)

    // Relocate the floating CTA to <body> so position:fixed is relative to the VIEWPORT,
    // not CF's content column (which is centred + max-width, and on .osk-stn carries the
    // -50vw full-viewport-breakout margin) — either of which throws the fixed bar off.
    // Called from init AND from buildTimeline + refresh, because on the live CF page the
    // single init() relocation did not stick (CF re-renders the custom-HTML subtree), and
    // buildTimeline is known to run. Idempotent: only moves if not already on <body>.
    function relocateFloatbar(root){
      var fb = (root && root.querySelector('[data-floatbar]')) || document.querySelector('.osk-fbar');
      if(fb && document.body && fb.parentNode !== document.body){ document.body.appendChild(fb); log('floatbar -> body'); }
      return fb;
    }

    function init(root){
      if(!root || root.__oskStnInit) return;
      root.__oskStnInit = true;
      log('init', root);

      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // ---- Floating CTA: show once Act 1 is scrolled past, hide over the footer.
      // IntersectionObserver is used (not scroll math) so it works regardless of
      // whether the window or a CF inner container is the scroller.
      var floatbar = relocateFloatbar(root);
      var act1 = root.querySelector('.act1');
      var foot  = root.querySelector('.ft');
      if(floatbar && act1){
        var pastHero = false, atBottom = false;
        var applyFB = function(){ floatbar.classList.toggle('show', pastHero && !atBottom); };
        if('IntersectionObserver' in window){
          new IntersectionObserver(function(es){
            pastHero = es[0].intersectionRatio < 0.08;   // Act 1 mostly out of view
            applyFB();
          }, {threshold:[0, 0.08, 0.5, 1]}).observe(act1);
          if(foot){
            new IntersectionObserver(function(es){
              atBottom = es[0].isIntersecting;            // footer in view -> hide
              applyFB();
            }, {rootMargin:'0px 0px -30px 0px'}).observe(foot);
          }
        } else {
          var onScrollFloat = function(){
            pastHero = act1.getBoundingClientRect().bottom < 40;
            atBottom = (window.innerHeight + window.scrollY) > (document.documentElement.scrollHeight - 200);
            applyFB();
          };
          window.addEventListener('scroll', onScrollFloat, {passive:true});
          window.addEventListener('resize', onScrollFloat);
          onScrollFloat();
        }
      }

      // Reduced motion: leave everything in its natural (visible) state.
      if(reduce) return;

      // ---- Inject GSAP + ScrollTrigger via JS (CF strips <script src>). ----
      // Try multiple CDNs in order so a single blocked host (jsdelivr behind a
      // network/CSP filter) doesn't kill the animation — fall through to cdnjs/unpkg.
      function loadFirst(urls){
        return new Promise(function(res,rej){
          var i=0;
          (function next(){
            if(i>=urls.length){ rej(new Error('all CDNs failed')); return; }
            var url=urls[i++];
            var s=document.createElement('script'); s.src=url; s.async=true;
            s.onload=function(){ log('loaded', url); res(); };
            s.onerror=function(){ log('FAILED', url); next(); };
            document.head.appendChild(s);
          })();
        });
      }
      // If GSAP is somehow already on the page, skip straight to building.
      if(window.gsap && window.ScrollTrigger){ log('gsap already present'); buildTimeline(root); return; }
      loadFirst([
        'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js',
        'https://unpkg.com/gsap@3.12.5/dist/gsap.min.js'
      ])
        .then(function(){ return loadFirst([
          'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js',
          'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js',
          'https://unpkg.com/gsap@3.12.5/dist/ScrollTrigger.min.js'
        ]); })
        .then(function(){
          if(window.gsap && window.ScrollTrigger){ log('GSAP ready -> building timeline'); buildTimeline(root); }
          else { log('GSAP scripts loaded but globals missing'); }
        })
        .catch(function(e){ log('GSAP load failed -> static fallback:', e && e.message); });
    }

    function buildTimeline(root){
      var gsap = window.gsap, ST = window.ScrollTrigger;
      gsap.registerPlugin(ST);

      var q = function(sel){ return root.querySelector(sel); };
      var qa = function(sel){ return Array.prototype.slice.call(root.querySelectorAll(sel)); };

      // ---- ACT 1: reveal hook lines on entry ----
      var a1 = qa('.act1-fx');
      gsap.set(a1, {opacity:0, y:26});
      gsap.to(a1, {opacity:1, y:0, duration:.7, stagger:.13, ease:'power2.out',
        scrollTrigger:{ trigger:root.querySelector('.act1'), start:'top 75%' }});

      // ---- ACT 2: pinned scrub timeline ----
      var track = q('[data-track]');
      var stage = q('[data-stage]');
      var tools = qa('[data-tool]');
      var caseImg = q('[data-case]');
      var cap = q('[data-cap]');
      var counterEl = q('[data-counter]');
      var progress = q('[data-progress]');

      gsap.set(tools, {opacity:0, scale:.3, x:0, y:0});
      gsap.set(caseImg, {scale:.82, opacity:.85});
      if(counterEl) counterEl.textContent = '$0';  // static/fallback keeps the real $214

      var captions = [
        'So I spent 6 months building the answer…',
        'One compact, waterproof case…',
        '…packed with <span class="hl">16 survival tools</span>',
        'Over <span class="hl">40 applications</span> in your pocket',
        'That’s <span class="hl">$214</span> of gear — done right'
      ];
      function setCap(i){
        if(!cap) return;
        i = Math.max(0, Math.min(captions.length-1, i));
        if(cap.__i !== i){ cap.__i = i; cap.innerHTML = captions[i]; }
      }
      var counterObj = {v:0};

      // ---- ACT 2 case-opening image sequence ----
      // The pinned case plays a 24-frame CLOSED->OPEN photo sequence scrubbed in sync with
      // the case scale-up + tool fan-out, so the kit visibly "opens" as you scroll. Frames
      // are pr-photo-3322 (closed) .. 3345 (open) — ascending = closed->open, per
      // Prompts/ImageSequence.md. setCaseFrame() swaps caseImg.src per scrub tick; the frames
      // are PRELOADED (preloadCaseSeq) on Act-2 entry — same deferral as the tool motion clips,
      // so the ~5.5 MB of frames never touch first paint and never download for visitors who
      // don't scroll to Act 2. Idempotent. The closed frame (3322, ~78 KB) is set at build so
      // the case reads closed before the scrub starts; reduced-motion / no-GSAP visitors never
      // run buildTimeline, so they keep the markup src (OPEN frame 3345 — shows the full kit).
      var CASE_SEQ_FIRST = 3322;   // closed
      var CASE_SEQ_LAST  = 3345;   // open
      var caseSeqUrls = [];
      for(var cf=CASE_SEQ_FIRST; cf<=CASE_SEQ_LAST; cf++){
        caseSeqUrls.push('https://mtp-images.com/pr-photo-' + cf + '.png');
      }
      var caseSeqImgs = [], caseSeqPreloaded = false;
      function preloadCaseSeq(){
        if(caseSeqPreloaded) return; caseSeqPreloaded = true;
        caseSeqUrls.forEach(function(u){ var im = new Image(); im.src = u; caseSeqImgs.push(im); });
        log('Act 2 case-opening frames preloading (' + caseSeqUrls.length + ')');
      }
      var caseSeq = {f:0};
      function setCaseFrame(v){
        if(!caseImg) return;
        var i = Math.max(0, Math.min(caseSeqUrls.length-1, Math.round(v)));
        if(caseImg.__f !== i){ caseImg.__f = i; caseImg.src = caseSeqUrls[i]; }
      }
      setCaseFrame(0);  // GSAP drives from CLOSED; reduced-motion keeps the open markup src

      // Swap each Act-2 tool thumbnail from its lightweight static poster (the markup src)
      // to its animated-WebP MOTION clip (data-motion) the FIRST time Act 2 is entered.
      // Deferred (clips are NOT in the initial markup) so the ~1–2 MB-each clips never touch
      // first paint and never download for visitors who don't scroll to Act 2. Gated behind
      // buildTimeline (which only runs when GSAP is present AND !reduced-motion), so a
      // reduced-motion / no-GSAP / CDN-blocked visitor keeps the still posters — no
      // autoplaying motion — matching this file's "visible-by-default, motion-only-after-load"
      // robustness model. Idempotent via motionSwapped.
      var motionSwapped = false;
      function swapToolMotion(){
        if(motionSwapped) return; motionSwapped = true;
        tools.forEach(function(a){
          var img = a.querySelector('img'), m = img && img.getAttribute('data-motion');
          if(img && m && img.getAttribute('src') !== m){ img.src = m; }
        });
        log('Act 2 tool motion clips swapped in');
      }

      // Pin via ScrollTrigger (pinType:'fixed') instead of CSS position:sticky. On the
      // live page a CF ancestor (div.container.fullContainer) has overflow-y:hidden, which
      // makes IT the sticky container — so a position:sticky stage sticks to that box and
      // scrolls off-screen (the case/counter rendered ABOVE the viewport top). position:
      // fixed escapes a non-transformed overflow ancestor, so the stage pins to the
      // viewport correctly. The pin-spacer supplies the scroll length (no manual 360vh
      // track needed), so .act2 no longer carries an inline height.
      var tl = gsap.timeline({
        scrollTrigger:{
          trigger: stage,
          start:'top top',
          end:function(){ return '+=' + Math.round(window.innerHeight * 2.6); },
          scrub:0.6,
          pin: stage,
          pinType:'fixed',
          anticipatePin:1,
          invalidateOnRefresh:true,
          // Start fetching the case-opening frames + motion clips the moment Act 2 is reached
          // (either direction), so they are decoding while the case scales up and are ready by
          // the time the tools fan in — keeps the swap off first paint without stuttering.
          onEnter:function(){ preloadCaseSeq(); swapToolMotion(); },
          onEnterBack:function(){ preloadCaseSeq(); swapToolMotion(); },
          onUpdate:function(self){ if(progress) progress.style.width = (self.progress*100).toFixed(1) + '%'; }
        }
      });

      tl.to(caseImg, {scale:1, opacity:1, duration:1, ease:'power2.out',
          onStart:function(){setCap(0);}, onReverseComplete:function(){setCap(0);}})
        .add(function(){ setCap(1); })
        // tools fan out from the case
        .to(tools, {opacity:1, scale:1, duration:1.4, stagger:0.18, ease:'back.out(1.6)',
          onStart:function(){ setCap(2); }}, '>-0.2')
        .to(counterObj, {v:214, duration:1.6, ease:'none',
          onStart:function(){ setCap(3); },
          onUpdate:function(){ if(counterEl) counterEl.textContent = '$' + Math.round(counterObj.v); }}, '<')
        .add(function(){ setCap(4); })
        .to(caseImg, {scale:1.04, duration:0.6, ease:'power1.inOut'})
        // Case-opening frame sequence (closed->open) runs CONCURRENTLY from t=0, spanning the
        // scale-up and the start of the fan-out, so the case visibly opens as it grows and the
        // tools emerge from the opened case. Inserted last with an absolute position (0) so it
        // overlays the existing beats without shifting any of their timing. ease:'none' = even
        // frame-per-scroll scrub; onUpdate runs in both directions (scrub reverses it on
        // scroll-up). Duration 1.4 leaves the case fully open as the first tools fan out.
        .to(caseSeq, {f:caseSeqUrls.length-1, duration:1.4, ease:'none',
          onUpdate:function(){ setCaseFrame(caseSeq.f); }}, 0);

      // ---- ACT 3: price slash + card reveal ----
      var conv = qa('.conv-fx');
      gsap.set(conv, {opacity:0, y:30});
      gsap.to(conv, {opacity:1, y:0, duration:.7, stagger:.12, ease:'power2.out',
        scrollTrigger:{ trigger:root.querySelector('.act3'), start:'top 78%' }});
      var slash = q('[data-slash]');
      if(slash){
        gsap.fromTo(slash, {color:'#ffe11a'}, {color:'#ff9c8e', duration:.5,
          scrollTrigger:{ trigger:root.querySelector('.act3'), start:'top 60%' }});
      }

      // ---- KIT GRID: batch reveal ----
      var cards = qa('[data-gcard]');
      gsap.set(cards, {opacity:0, y:24});
      ST.batch(cards, {
        start:'top 90%',
        onEnter:function(batch){ gsap.to(batch, {opacity:1, y:0, duration:.5, stagger:.06, ease:'power2.out'}); }
      });

      // Re-assert the floating-CTA relocation here too: buildTimeline is known to run on
      // the live page, whereas init()'s single relocation didn't stick (CF re-render).
      relocateFloatbar(root);

      ST.refresh();
      // Re-measure after late layout shifts (images/webfonts load AFTER init, which
      // would otherwise leave the Act-2 pin start/end computed against the wrong
      // height — a classic cause of "scrub does nothing" once it goes live).
      if(window.addEventListener){ window.addEventListener('load', function(){ relocateFloatbar(root); ST.refresh(); }); }
      setTimeout(function(){ relocateFloatbar(root); ST.refresh(); }, 1500);
      log('timeline built; ScrollTriggers =', ST.getAll ? ST.getAll().length : '?');
    }

    function boot(){
      var roots = document.querySelectorAll('.osk-stn');
      log('boot: .osk-stn found =', roots.length);
      Array.prototype.forEach.call(roots, function(el){ init(el); });
    }
    if(document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', boot);
    } else {
      boot();
    }
  })();
