const puppeteer = require('puppeteer');
const path = require('path');

async function testAnimations() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  // Enable console output
  page.on('console', msg => console.log(`[PAGE LOG] ${msg.text()}`));
  page.on('error', err => console.log(`[PAGE ERROR] ${err}`));
  page.on('pageerror', err => console.log(`[PAGE PAGEERROR] ${err}`));

  const htmlPath = path.join(__dirname, 'assets', 'Outdoor Survival Kit.html');
  const fileUrl = `file://${htmlPath}`;

  console.log(`Loading: ${fileUrl}\n`);

  try {
    await page.goto(fileUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for page to stabilize
    await page.evaluate(() => new Promise(r => setTimeout(r, 2000)));

    console.log('✓ Page loaded successfully\n');

    // Test 1: Check if GSAP is loaded
    const gsapLoaded = await page.evaluate(() => {
      return typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
    });
    console.log(`GSAP Loaded: ${gsapLoaded ? '✓' : '✗'}`);

    // Test 2: Check if animation timeline exists
    const timelineExists = await page.evaluate(() => {
      return window.gsap && window.gsap.timeline ? 'timeline function exists' : 'no timeline';
    });
    console.log(`Timeline available: ${timelineExists}`);

    // Test 3: Get animation state info
    const animationState = await page.evaluate(() => {
      const state = {
        gsapVersion: window.gsap?.version || 'unknown',
        scrollTriggerVersion: window.ScrollTrigger?.version || 'unknown',
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        activeAnimations: 0,
        elements: {}
      };

      // Check for elements with animations
      const caseElements = document.querySelectorAll('.casebox .case, .tool');
      state.elements.withAnimation = caseElements.length;

      // Check if CSS animations are defined
      const styles = Array.from(document.styleSheets).map(sheet => {
        try {
          return Array.from(sheet.cssRules || []).filter(rule =>
            rule.name && (rule.name.includes('Glow') || rule.name.includes('reveal'))
          ).map(r => r.name);
        } catch (e) {
          return [];
        }
      }).flat();
      state.cssAnimations = styles;

      return state;
    });

    console.log(`\nAnimation State:`);
    console.log(`  GSAP Version: ${animationState.gsapVersion}`);
    console.log(`  ScrollTrigger Version: ${animationState.scrollTriggerVersion}`);
    console.log(`  Prefers Reduced Motion: ${animationState.reducedMotion}`);
    console.log(`  Elements with animation: ${animationState.elements.withAnimation}`);
    console.log(`  CSS Animations defined: ${animationState.cssAnimations.length}`);
    if (animationState.cssAnimations.length > 0) {
      console.log(`    - ${animationState.cssAnimations.join('\n    - ')}`);
    }

    // Test 4: Simulate scroll and check ScrollTrigger reactions
    console.log(`\nTesting scroll animations...`);

    const scrollBefore = await page.evaluate(() => {
      return {
        scrollY: window.scrollY,
        documentHeight: document.documentElement.scrollHeight,
        viewportHeight: window.innerHeight
      };
    });

    // Scroll down to trigger animations
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.evaluate(() => new Promise(r => setTimeout(r, 500)));

    const scrollAfter = await page.evaluate(() => {
      return {
        scrollY: window.scrollY,
        animatingElements: document.querySelectorAll('[style*="transform"], [style*="opacity"]').length
      };
    });

    console.log(`  Scroll position: ${scrollBefore.scrollY} -> ${scrollAfter.scrollY}`);
    console.log(`  Elements with active transforms: ${scrollAfter.animatingElements}`);

    // Test 5: Check bootstrap status
    const bootStrapStatus = await page.evaluate(() => {
      // Look for data attribute that indicates bootstrap status
      const bootstrapImg = document.querySelector('img[data-osk-boot]');
      return {
        bootstrapPresent: !!bootstrapImg,
        bootstrapSrc: bootstrapImg?.src || 'N/A',
        scriptExecuted: window.__oskBootstrapExecuted || 'unknown'
      };
    });

    console.log(`\nBootstrap Status:`);
    console.log(`  Bootstrap img present: ${bootStrapStatus.bootstrapPresent ? '✓' : '✗'}`);
    console.log(`  Script executed flag: ${bootStrapStatus.scriptExecuted}`);

    // Test 6: Check for console errors
    console.log(`\nChecking for errors in page...`);
    const errors = await page.evaluate(() => {
      return window.__pageErrors || [];
    });
    console.log(`  Logged errors: ${errors.length || 'none'}`);

    // Summary
    console.log(`\n${'='.repeat(60)}`);
    if (gsapLoaded && animationState.elements.withAnimation > 0) {
      console.log('✓ ANIMATIONS APPEAR TO BE FUNCTIONAL');
      console.log('  - GSAP is loaded');
      console.log('  - ScrollTrigger is registered');
      console.log(`  - ${animationState.elements.withAnimation} animated elements found`);
      console.log(`  - ${animationState.cssAnimations.length} CSS animation keyframes defined`);
    } else {
      console.log('✗ ANIMATION ISSUES DETECTED');
      if (!gsapLoaded) console.log('  - GSAP or ScrollTrigger failed to load');
      if (animationState.elements.withAnimation === 0) console.log('  - No animated elements found');
    }
    console.log(`${'='.repeat(60)}`);

  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testAnimations().catch(console.error);
