const puppeteer = require('puppeteer');

async function testAnimationExecution() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.setViewport({ width: 1280, height: 720 });

  const url = 'http://127.0.0.1:5500/assets/Outdoor%20Survival%20Kit.html';

  console.log(`🎬 Testing Animation Execution\n${'='.repeat(70)}\n`);

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
    await page.evaluate(() => new Promise(r => setTimeout(r, 1500)));

    // Check initial state
    const before = await page.evaluate(() => {
      const tools = document.querySelectorAll('.tool');
      const caseBox = document.querySelector('.casebox .case');
      return {
        toolCount: tools.length,
        toolStates: Array.from(tools).map((t, i) => ({
          index: i,
          opacity: window.getComputedStyle(t).opacity,
          transform: window.getComputedStyle(t).transform
        })).slice(0, 2),
        caseOpacity: caseBox ? window.getComputedStyle(caseBox).opacity : null,
        caseTransform: caseBox ? window.getComputedStyle(caseBox).transform : null,
        scrollY: window.scrollY
      };
    });

    console.log('📍 Initial State (scroll position: 0px):');
    console.log(`   Tools opacity: ${before.toolStates[0]?.opacity || 'N/A'}`);
    console.log(`   Case opacity: ${before.caseOpacity}, scale: ${before.caseTransform}`);

    // Scroll down to trigger animations
    console.log('\n⏳ Scrolling to trigger animations...');
    await page.evaluate(() => window.scrollBy(0, 1000));
    await page.evaluate(() => new Promise(r => setTimeout(r, 800)));

    const after = await page.evaluate(() => {
      const tools = document.querySelectorAll('.tool');
      const caseBox = document.querySelector('.casebox .case');
      const stage = document.querySelector('[data-stage]');

      return {
        scrollY: window.scrollY,
        toolStates: Array.from(tools).slice(0, 3).map((t, i) => {
          const style = window.getComputedStyle(t);
          return {
            index: i,
            opacity: style.opacity,
            transform: style.transform,
            isAnimating: style.animation !== 'none'
          };
        }),
        caseOpacity: caseBox ? window.getComputedStyle(caseBox).opacity : null,
        caseTransform: caseBox ? window.getComputedStyle(caseBox).transform : null,
        stage: stage ? {
          opacity: window.getComputedStyle(stage).opacity,
          transform: window.getComputedStyle(stage).transform
        } : null,
        activeAnimations: Array.from(document.querySelectorAll('[style*="animation"]')).length
      };
    });

    console.log(`\n📍 After Scroll (position: ${after.scrollY}px):`);
    console.log(`   Tools opacity: ${after.toolStates[0]?.opacity}`);
    console.log(`   Case opacity: ${after.caseOpacity}, scale: ${after.caseTransform}`);
    if (after.stage) {
      console.log(`   Stage element found: opacity=${after.stage.opacity}`);
    }

    // Check for visual changes
    const changed = {
      toolsOpacity: before.toolStates[0]?.opacity !== after.toolStates[0]?.opacity,
      toolsTransform: before.toolStates[0]?.transform !== after.toolStates[0]?.transform,
      caseOpacity: before.caseOpacity !== after.caseOpacity,
      caseTransform: before.caseTransform !== after.caseTransform
    };

    console.log('\n🔄 Changes Detected:');
    console.log(`   Tools opacity changed: ${changed.toolsOpacity ? '✓ YES' : '✗ NO'}`);
    console.log(`   Tools transform changed: ${changed.toolsTransform ? '✓ YES' : '✗ NO'}`);
    console.log(`   Case opacity changed: ${changed.caseOpacity ? '✓ YES' : '✗ NO'}`);
    console.log(`   Case transform changed: ${changed.caseTransform ? '✓ YES' : '✗ NO'}`);
    console.log(`   Active CSS animations: ${after.activeAnimations}`);

    console.log('\n' + '='.repeat(70));
    if (changed.toolsTransform || changed.toolsOpacity || changed.caseTransform) {
      console.log('✅ ANIMATIONS ARE WORKING!');
      console.log('\n📌 What to do in your browser:');
      console.log('   1. Open the page in your browser');
      console.log('   2. SCROLL DOWN slowly');
      console.log('   3. Watch the survival kit case expand');
      console.log('   4. Watch tools fan out from the case');
      console.log('   5. Keep scrolling to see more reveals');
    } else {
      console.log('⚠️  Animations may not be executing properly.');
      console.log('    Possible causes:');
      console.log('    - Elements are already at final state');
      console.log('    - ScrollTrigger not properly initialized');
      console.log('    - Animations require different scroll distance');
    }
    console.log('='.repeat(70));

  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testAnimationExecution().catch(console.error);
