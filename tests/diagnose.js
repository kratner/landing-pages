// Diagnostic harness for a saved landing page.
// Boots a headless Chrome, loads the page (with ?oskdebug so the page's own
// telemetry prints), captures console + page errors + failed network requests,
// reports GSAP / ScrollTrigger state, then scrolls and screenshots each act.
//
// Usage:
//   node diagnose.js                      # default: Outdoor Survival Kit via local http server
//   node diagnose.js "<url>"              # diagnose any URL
//   node diagnose.js --offline            # simulate no internet (block external hosts)
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');

const ARGS = process.argv.slice(2);
const OFFLINE = ARGS.includes('--offline');
const customUrl = ARGS.find(a => a.startsWith('http'));
const PORT = 8080;
const PAGE = 'Outdoor Survival Kit.html';
const URL = customUrl || `http://localhost:${PORT}/assets/${encodeURIComponent(PAGE)}?oskdebug`;
const SHOT_DIR = path.join(__dirname, 'screenshots');

function startServer() {
  return new Promise((resolve) => {
    const proc = spawn('node', [path.join(__dirname, 'server.js'), String(PORT)], { stdio: 'ignore' });
    // give it a moment to bind
    setTimeout(() => resolve(proc), 600);
  });
}

(async () => {
  if (!fs.existsSync(SHOT_DIR)) fs.mkdirSync(SHOT_DIR, { recursive: true });
  const server = customUrl ? null : await startServer();

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const oskLogs = [], pageErrors = [], failedReqs = [];

  page.on('console', m => { const t = m.text(); if (/\[OSK|gsap|GSAP|ScrollTrigger|timeline|FAILED/i.test(t)) oskLogs.push(`${m.type()}: ${t}`); });
  page.on('pageerror', e => pageErrors.push(String(e)));
  page.on('requestfailed', r => failedReqs.push(`${r.failure()?.errorText} ${r.url()}`));
  page.on('response', r => { if (r.status() >= 400) failedReqs.push(`HTTP ${r.status()} ${r.url()}`); });

  if (OFFLINE) {
    await page.setRequestInterception(true);
    page.on('request', r => {
      const u = r.url();
      const external = /^https?:\/\//.test(u) && !u.includes('localhost') && !u.includes('127.0.0.1');
      if (external) r.abort(); else r.continue();
    });
  }

  console.log(`\n=== Diagnose: ${URL} ${OFFLINE ? '(OFFLINE mode)' : ''} ===\n`);

  try {
    await page.goto(URL, { waitUntil: 'networkidle2', timeout: 45000 });
  } catch (e) {
    console.log(`goto warning: ${e.message}`);
  }
  await new Promise(r => setTimeout(r, 2500));

  const state = await page.evaluate(() => ({
    oskRan: !!window.__oskStnRan,
    gsap: typeof window.gsap !== 'undefined',
    scrollTrigger: typeof window.ScrollTrigger !== 'undefined',
    stCount: (window.ScrollTrigger && window.ScrollTrigger.getAll) ? window.ScrollTrigger.getAll().length : null,
    roots: document.querySelectorAll('.osk-stn').length,
    tools: document.querySelectorAll('[data-tool]').length,
    caseImg: !!document.querySelector('[data-case]'),
    toolOpacity: (() => { const t = document.querySelector('[data-tool]'); return t ? getComputedStyle(t).opacity : 'n/a'; })()
  }));

  console.log('--- Page state ---');
  console.log(`inline osk script ran : ${state.oskRan}`);
  console.log(`GSAP loaded           : ${state.gsap}`);
  console.log(`ScrollTrigger loaded  : ${state.scrollTrigger}`);
  console.log(`ScrollTrigger count   : ${state.stCount}`);
  console.log(`.osk-stn roots        : ${state.roots}`);
  console.log(`[data-tool] count     : ${state.tools}`);
  console.log(`first tool opacity    : ${state.toolOpacity}  (0 = hidden pre-anim, 1 = revealed)`);

  console.log('\n--- OSK telemetry ---');
  console.log(oskLogs.length ? oskLogs.join('\n') : '(none captured)');

  console.log('\n--- Page errors ---');
  console.log(pageErrors.length ? pageErrors.slice(0, 10).join('\n') : '(none)');

  console.log('\n--- Failed / 4xx-5xx requests (first 25) ---');
  console.log(failedReqs.length ? [...new Set(failedReqs)].slice(0, 25).join('\n') : '(none)');

  // Scroll through and capture screenshots.
  const shots = [['01-top', 0], ['02-act2', 1.2], ['03-act2-mid', 2.0], ['04-bottom', 4.0]];
  for (const [name, vh] of shots) {
    await page.evaluate(y => window.scrollTo(0, y * window.innerHeight), vh);
    await new Promise(r => setTimeout(r, 900));
    await page.screenshot({ path: path.join(SHOT_DIR, `${name}.png`) });
  }
  console.log(`\nScreenshots written to ${SHOT_DIR}`);

  await browser.close();
  if (server) server.kill();
})();
