const puppeteer = require('puppeteer');

async function testLiveServer() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  page.setViewport({ width: 1280, height: 720 });

  // This is the actual URL from your Live Server
  const url = 'http://127.0.0.1:5500/assets/Outdoor%20Survival%20Kit.html';

  console.log(`Testing: ${url}\n`);

  const logs = [];
  const errors = [];

  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    if (msg.type() === 'error') errors.push(text);
  });

  page.on('response', response => {
    const url = response.url();
    const status = response.status();
    if (status >= 400 && (url.includes('gsap') || url.includes('ScrollTrigger') || url.includes('assets'))) {
      console.log(`[${status}] ${url.split('/').pop()}`);
    }
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
    await page.evaluate(() => new Promise(r => setTimeout(r, 2000)));

    const status = await page.evaluate(() => {
      return {
        gsapLoaded: typeof window.gsap !== 'undefined',
        scrollTriggerLoaded: typeof window.ScrollTrigger !== 'undefined',
        gsapVersion: window.gsap?.version || 'NOT LOADED',
        stVersion: window.ScrollTrigger?.version || 'NOT LOADED',
        reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        debugLogs: []
      };
    });

    console.log('\nLoad Status:');
    console.log(`  GSAP: ${status.gsapLoaded ? '✓ ' + status.gsapVersion : '✗ ' + status.gsapVersion}`);
    console.log(`  ScrollTrigger: ${status.scrollTriggerLoaded ? '✓ ' + status.stVersion : '✗ ' + status.stVersion}`);
    console.log(`  Reduce Motion: ${status.reduceMotion}`);

    if (!status.gsapLoaded || !status.scrollTriggerLoaded) {
      console.log('\n⚠️  ISSUE: Missing libraries. Checking page console logs:');
      logs.slice(0, 20).forEach(log => {
        if (log.includes('OSK') || log.includes('gsap') || log.includes('GSAP') || log.includes('FAILED')) {
          console.log(`    ${log}`);
        }
      });
    } else {
      console.log('\n✓ All libraries loaded successfully!');
      console.log('\nTesting animation execution...');

      const animStatus = await page.evaluate(() => {
        return {
          toolElements: document.querySelectorAll('.tool').length,
          caseElement: !!document.querySelector('.casebox .case'),
          scrollTriggers: window.ScrollTrigger?.getAll?.().length || 0
        };
      });

      console.log(`  Tools: ${animStatus.toolElements}`);
      console.log(`  Case: ${animStatus.caseElement ? 'found' : 'missing'}`);
      console.log(`  ScrollTriggers: ${animStatus.scrollTriggers}`);
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testLiveServer().catch(console.error);
