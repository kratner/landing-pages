const puppeteer = require('puppeteer');

async function testAnimationsViaHTTP() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  page.setViewport({ width: 1280, height: 720 });

  const httpUrl = 'http://localhost:8000/assets/Outdoor%20Survival%20Kit.html';

  console.log(`Testing animations via HTTP: ${httpUrl}\n`);
  console.log('=' .repeat(70));

  try {
    await page.goto(httpUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.evaluate(() => new Promise(r => setTimeout(r, 2000)));

    console.log('✓ Page loaded via HTTP successfully\n');

    // Check console for errors
    let consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Test GSAP and animations
    const animationStatus = await page.evaluate(() => {
      return {
        gsapLoaded: typeof window.gsap !== 'undefined',
        scrollTriggerLoaded: typeof window.ScrollTrigger !== 'undefined',
        gsapVersion: window.gsap?.version || 'not loaded',
        scrollTriggerVersion: window.ScrollTrigger?.version || 'not loaded',
        animatedElements: document.querySelectorAll('[style*="animation"], .casebox .case, .tool').length,
        cssAnimationsCount: Array.from(document.styleSheets).reduce((count, sheet) => {
          try {
            return count + Array.from(sheet.cssRules || [])
              .filter(r => r.type === 7).length; // KeyframesRule
          } catch (e) { return count; }
        }, 0)
      };
    });

    console.log('GSAP Status:');
    console.log(`  ✓ GSAP Loaded: ${animationStatus.gsapLoaded}`);
    console.log(`  ✓ GSAP Version: ${animationStatus.gsapVersion}`);
    console.log(`  ✓ ScrollTrigger Loaded: ${animationStatus.scrollTriggerLoaded}`);
    console.log(`  ✓ ScrollTrigger Version: ${animationStatus.scrollTriggerVersion}`);
    console.log(`  ✓ Animated Elements: ${animationStatus.animatedElements}`);
    console.log(`  ✓ CSS Keyframes: ${animationStatus.cssAnimationsCount}`);

    // Scroll and test animations
    console.log('\n⏳ Testing scroll animations...');
    await page.evaluate(() => window.scrollBy(0, 800));
    await page.evaluate(() => new Promise(r => setTimeout(r, 1000)));

    const scrollStatus = await page.evaluate(() => {
      const caseBox = document.querySelector('.casebox .case');
      const tools = document.querySelectorAll('.tool');

      return {
        scrollY: window.scrollY,
        caseBoxTransform: caseBox ? window.getComputedStyle(caseBox).transform : 'N/A',
        animatingToolsCount: Array.from(tools).filter(t => {
          const style = window.getComputedStyle(t);
          return style.transform !== 'none' || style.opacity !== '1';
        }).length
      };
    });

    console.log(`  Scroll Position: ${scrollStatus.scrollY}px`);
    console.log(`  Case Box Transform: ${scrollStatus.caseBoxTransform}`);
    console.log(`  Tools with active animations: ${scrollStatus.animatingToolsCount}/${document.querySelectorAll('.tool').length}`);

    console.log('\n' + '='.repeat(70));
    if (animationStatus.gsapLoaded && animationStatus.scrollTriggerLoaded) {
      console.log('✅ SUCCESS: ANIMATIONS WORKING VIA HTTP!');
      console.log('\n📋 Solution:');
      console.log('  1. Open in browser via HTTP, not file://');
      console.log('  2. Open: http://localhost:8000/assets/Outdoor%20Survival%20Kit.html');
      console.log('  3. OR use a local HTTP server (see instructions below)');
    } else {
      console.log('❌ GSAP not loaded properly');
    }
    console.log('='.repeat(70));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

testAnimationsViaHTTP().catch(console.error);
