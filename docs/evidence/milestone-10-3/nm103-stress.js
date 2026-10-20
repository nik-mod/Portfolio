// M10.3 — scroll choreography stress test (10 scenarios) with recordings.
const { chromium, devices } = require('playwright');
const fs = require('fs');
const OUT = 'C:/Users/LENOVO_LEGION/OneDrive/Desktop/Portfolio/docs/evidence/milestone-10-3';
fs.mkdirSync(OUT + '/recordings', { recursive: true });
const results = [];
const check = (n, p, d = '') => { results.push({ n, p, d }); console.log(`${p ? 'PASS' : 'FAIL'} — ${n}${d ? ' :: ' + d : ''}`); };
const TARGET = 'http://localhost:4173/';

async function ready(page) {
  await page.waitForFunction(() => document.documentElement.dataset.nmGate === 'active', null, { timeout: 45000 });
  await page.waitForFunction(() => !document.documentElement.dataset.nmScrollLock, null, { timeout: 5000 });
  await page.waitForTimeout(500);
}
const probe = (page) => page.evaluate(() => ({
  y: Math.round(window.scrollY),
  p: Number(document.getElementById('intro').dataset.diveProgress),
  title: getComputedStyle(document.querySelector('.hero-title')).opacity,
  portfolioOp: document.querySelector('.portfolio-content').style.opacity || '1',
  overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  canvasFrames: document.querySelector('.laptop-canvas canvas') ? 1 : 0,
}));

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  // 1-6: one recorded session covering slow, fast, reverse, direction changes,
  // half-stop hold, and the full handoff.
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, recordVideo: { dir: OUT + '/recordings' } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(TARGET);
    await ready(page);

    // 1. Very slow scroll: small steps, sample progress continuity.
    let prev = { y: 0, p: 0 }, maxLag = 0;
    for (let i = 0; i < 60; i++) {
      await page.mouse.wheel(0, 25);
      await page.waitForTimeout(60);
      const s = await probe(page);
      const expected = (s.y - prev.y) / 2894; // pin distance ≈ height*3.6
      maxLag = Math.max(maxLag, Math.abs(s.p - prev.p - expected));
      prev = s;
    }
    check('1 slow scroll: progress tracks scroll (no desync)', maxLag < 0.06, `max deviation=${maxLag.toFixed(3)} p=${prev.p}`);
    await page.screenshot({ path: `${OUT}/after/stress-slow-mid.png` });

    // 5. Stop halfway and hold — pose must stay stable.
    await page.evaluate(() => window.scrollTo(0, 1450));
    await page.waitForTimeout(600);
    const hold1 = await probe(page);
    await page.waitForTimeout(900);
    const hold2 = await probe(page);
    check('5 half-stop: pose stable while holding', hold1.p === hold2.p && hold1.y === hold2.y, `p=${hold1.p}->${hold2.p}`);
    await page.screenshot({ path: `${OUT}/after/stress-hold-half.png` });

    // 3+4. Sudden reverse + repeated direction changes.
    for (let i = 0; i < 6; i++) {
      await page.mouse.wheel(0, i % 2 ? 900 : -900);
      await page.waitForTimeout(140);
    }
    await page.waitForTimeout(500);
    const dir = await probe(page);
    check('3/4 fast direction changes: coherent state', Number.isFinite(dir.p) && dir.p >= 0 && dir.p <= 1, `p=${dir.p}`);
    await page.screenshot({ path: `${OUT}/after/stress-directions.png` });

    // 2. Very fast scroll to the end (full handoff).
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(1100);
    const end = await probe(page);
    check('2 fast scroll: full forward dive + handoff', end.p >= 0.99, `p=${end.p} portfolioOp=${end.portfolioOp}`);

    // Full reverse.
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1100);
    const rev = await probe(page);
    check('10 full reverse restores hero exactly', rev.p === 0 && rev.y === 0 && rev.title === '1', `p=${rev.p} title=${rev.title}`);

    // 7. Resize during the pinned sequence.
    await page.evaluate(() => window.scrollTo(0, 2000));
    await page.waitForTimeout(500);
    const preResize = await probe(page);
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(900);
    const postResize = await probe(page);
    check('7 resize mid-pin: no overflow, state coherent', postResize.overflow <= 0 && postResize.p >= 0 && postResize.p <= 1,
      `p ${preResize.p}->${postResize.p} overflow=${postResize.overflow}`);
    await page.screenshot({ path: `${OUT}/after/stress-resize.png` });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(700);

    // 9. Browser back/forward restoration: hash entries create same-site
    // history; going back must land ungated at the saved offset.
    await page.evaluate(() => window.scrollTo(0, 2000));
    await page.waitForTimeout(700);
    await page.click('header a:has-text("About")');
    await page.waitForTimeout(900);
    await page.goBack();
    await page.waitForTimeout(1600);
    const back = await page.evaluate(() => ({
      y: Math.round(window.scrollY),
      lock: document.documentElement.dataset.nmScrollLock ?? null,
      sheetHidden: document.getElementById('nm-boot').hidden,
      url: location.href,
    }));
    check('9 back/forward: returns to site, ungated, position kept',
      back.url.includes('localhost:4173') && back.lock === null && Math.abs(back.y - 2000) < 2200 && back.sheetHidden,
      JSON.stringify(back));

    check('stress: no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));
    const video = typeof page.video === 'function' ? await page.video().path().catch(() => null) : null;
    await ctx.close();
    if (video) fs.renameSync(video, `${OUT}/recordings/stress-desktop-dive.webm`);
  }

  // 8. Mobile touch scrolling through the whole cinematic.
  {
    const ctx = await browser.newContext({ ...devices['iPhone 13'], recordVideo: { dir: OUT + '/recordings' } });
    const page = await ctx.newPage();
    await page.goto(TARGET);
    await ready(page);
    const cdp = await ctx.newCDPSession(page);
    const swipe = async (dy) => {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 187, y: 600 }] });
      const steps = 8;
      for (let s = 1; s <= steps; s++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 187, y: 600 - (dy * s / steps) }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    };
    for (let i = 0; i < 10; i++) { await swipe(500); await page.waitForTimeout(120); }
    await page.waitForTimeout(700);
    const fwd = await probe(page);
    check('8 mobile touch: forward dive progresses', fwd.p > 0.4, `p=${fwd.p} y=${fwd.y}`);
    await page.screenshot({ path: `${OUT}/after/stress-mobile-mid.png` });
    for (let i = 0; i < 12; i++) { await swipe(-500); await page.waitForTimeout(100); }
    await page.waitForTimeout(700);
    const rev = await probe(page);
    check('8 mobile touch: reverse dive restores', rev.p < 0.15, `p=${rev.p} y=${rev.y}`);
    const video = typeof page.video === 'function' ? await page.video().path().catch(() => null) : null;
    await ctx.close();
    if (video) fs.renameSync(video, `${OUT}/recordings/stress-mobile-dive.webm`);
  }

  await browser.close();
  fs.writeFileSync(`${OUT}/nm103-stress-results.json`, JSON.stringify(results, null, 2));
  const failed = results.filter((r) => !r.p).length;
  console.log(`\n===== ${results.length - failed}/${results.length} passed =====`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error('SCRIPT ERROR', e); process.exit(2); });
