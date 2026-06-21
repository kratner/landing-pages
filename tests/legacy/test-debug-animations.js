const puppeteer = require('puppeteer');

async function debugAnimations() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.setViewport({ width: 1280, height: 720 });

  const url = 'http://127.0.0.1:5500/assets/Outdoor%20Survival%20Kit.html';

  console.log('🔍 Debugging Animation Issue\n');

  const osklogs = [];

  page.on('console', msg => {
    const text = msg.text();
    // Capture OSK-related logs
    if (text.includes('[OSK') || text.includes('gsap') || text.includes('GSAP') ||
        text.includes('timeline') || text.includes('ScrollTrigger') || text.includes('FAILED')) {
      osklogs.push(text);
      console.log(`[LOG] ${text}`);
    }
  });

  page.on('error', err => console.error(`[PAGE ERROR] ${err}`));
  page.on('pageerror', err => console.error(`[PAGE PAGEERROR] ${err}`));

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
    await page.evaluate(() => new Promise(r => setTimeout(r, 2000)));

    console.log('\n📋 Checking page state...\n');

    const state = await page.evaluate(() => {
      return {
        oskstn: document.querySelector('.osk-stn') ? 'found' : 'MISSING',
        gsapGlobal: typeof window.gsap !== 'undefined' ? 'loaded' : 'MISSING',
        stGlobal: typeof window.ScrollTrigger !== 'undefined' ? 'loaded' : 'MISSING',
        gsapTimeline: window.gsap?.timeline ? 'available' : 'N/A',
        stGetAll: window.ScrollTrigger?.getAll ? 'available' : 'N/A',
        stRefresh: window.ScrollTrigger?.refresh ? 'available' : 'N/A',
        reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        documentReady: document.readyState,
        bodyhtml: document.body ? 'exists' : 'MISSING'
      };
    });

    console.log('✓ GSAP loaded:', state.gsapGlobal);
    console.log('✓ ScrollTrigger loaded:', state.stGlobal);
    console.log('✓ .osk-stn element:', state.oskstn);
    console.log('✓ Reduced motion:', state.reduceMotion);
    console.log('✓ Document ready:', state.documentReady);
    console.log('✓ ScrollTriggers active:', await page.evaluate(() => window.ScrollTrigger?.getAll?.().length || 0));

    // Try to trigger the bootstrap manually
    console.log('\n🔧 Attempting to trigger animation initialization...\n');

    const result = await page.evaluate(() => {
      // Find and re-run the OSK initialization
      const oskstn = document.querySelector('.osk-stn');
      if (!oskstn) {
        return { error: 'No .osk-stn element found' };
      }

      // The page should have already initialized, but let's check if timelines were built
      const hasST = window.ScrollTrigger && window.ScrollTrigger.getAll;
      const triggers = hasST ? window.ScrollTrigger.getAll() : [];

      return {
        oskstnFound: !!oskstn,
        scrollTriggersCount: triggers.length,
        gsapVersion: window.gsap?.version,
        stVersion: window.ScrollTrigger?.version,
        hasAnimatedElements: document.querySelectorAll('[data-gsap], [data-st]').length > 0
      };
    });

    console.log('Result:');
    Object.entries(result).forEach(([k, v]) => {
      console.log(`  ${k}: ${v}`);
    });

    if (result.scrollTriggersCount === 0) {
      console.log('\n⚠️  NO SCROLLTRIGGERS INITIALIZED!');
      console.log('   This means buildTimeline() did not run.');
      console.log('   Possible reasons:');
      console.log('   1. Reduced motion is enabled');
      console.log('   2. Bootstrap script failed silently');
      console.log('   3. GSAP/ST globals missing at bootstrap time');
      console.log('   4. CDN fallback blocked or very slow');
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

debugAnimations().catch(console.error);
