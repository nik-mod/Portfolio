// Milestone 10 — Phase 6 browser acceptance tests for the NM/01 boot scroll gate.
const { chromium } = require('playwright');
const fs = require('fs');

const TARGET = 'http://localhost:4173/';
const OUT = 'C:/Users/LENOVO_LEGION/OneDrive/Desktop/Portfolio/docs/evidence/milestone-10';
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const check = (name, pass, detail = '') => {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${name}${detail ? ' :: ' + detail : ''}`);
};
const state = (page) => page.evaluate(() => ({
  lock: document.documentElement.dataset.nmScrollLock ?? null,
  gate: document.documentElement.dataset.nmGate ?? null,
  boot: document.documentElement.dataset.nmBoot ?? null,
  sheetHidden: document.getElementById('nm-boot')?.hidden ?? true,
  scrollY: Math.round(window.scrollY),
  diveState: document.getElementById('intro')?.dataset.diveState ?? null,
  diveProgress: document.getElementById('intro')?.dataset.diveProgress ?? null,
  sceneState: document.querySelector('.viewport')?.dataset.sceneState ?? null,
  vw: document.documentElement.clientWidth,
}));

// Hold STATE A by delaying the lazy scene chunk on a fresh (first) visit.
async function delayScene(page, ms) {
  let wait = ms;
  await page.route('**/LaptopScene-*.js', async (route) => {
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    wait = 0;
    await route.continue();
  });
}

async function freshContext(browser, opts = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  return { context, page, errors };
}

(async () => {
  // Cinematic path needs a real GPU; bundled Chromium falls back to SwiftShader
  // (which is itself the weak-device case, tested separately below).
  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  // ---------- Test A: desktop normal first visit — lock, readiness, unlock, dive ----------
  {
    const { context, page, errors } = await freshContext(browser, { recordVideo: { dir: OUT } });
    await delayScene(page, 6000);
    await page.goto(TARGET);
    await page.waitForSelector('#nm-boot');
    await page.waitForSelector('.viewport');

    const a1 = await state(page);
    check('A1 boot sheet visible over Hero', await page.isVisible('#nm-boot') && a1.boot === 'opening');
    check('A1 scroll lock applied on first visit', a1.lock === 'true', `gate=${a1.gate}`);
    check('A1 gate preparing, no cinematic timeline yet', a1.diveState === null || a1.diveState === 'preparing');

    // Instrument scene-state flapping and layout shifts while the scene is still loading.
    await page.evaluate(() => {
      window.__nm10 = { sceneStates: [], layoutShifts: 0 };
      const vp = document.querySelector('.viewport');
      new MutationObserver((records) => records.forEach((r) => window.__nm10.sceneStates.push(r.target.dataset.sceneState)))
        .observe(vp, { attributes: true, attributeFilter: ['data-scene-state'] });
      new PerformanceObserver((list) => list.getEntries().forEach((e) => { window.__nm10.layoutShifts += e.value; }))
        .observe({ type: 'layout-shift', buffered: true });
    });

    // A2 mouse wheel attempts during NM/01
    for (let i = 0; i < 10; i++) await page.mouse.wheel(0, 500);
    await page.waitForTimeout(500);
    check('A2 mouse wheel locked during boot', (await state(page)).scrollY === 0);

    // A3 Space / ArrowDown / PageDown / End
    for (const key of ['Space', 'ArrowDown', 'PageDown', 'End']) await page.keyboard.press(key);
    await page.waitForTimeout(500);
    const a3 = await state(page);
    check('A3 keyboard scroll locked during boot', a3.scrollY === 0, `scrollY=${a3.scrollY}`);
    check('A5 boot still covering, gate unchanged', a3.boot === 'opening' && a3.gate === 'preparing' && a3.diveProgress === null);
    await page.screenshot({ path: `${OUT}/A-boot-locked.png` });

    // B/D: let initialization finish; verify unlock only at interactive
    await page.waitForFunction(() => document.documentElement.dataset.nmGate === 'handoff', null, { timeout: 45000 });
    for (let i = 0; i < 6; i++) await page.mouse.wheel(0, 500);
    await page.waitForTimeout(400);
    const h1 = await state(page);
    check('C-handoff lock held during the 950ms reveal', h1.lock === 'true' && h1.gate === 'handoff' && h1.scrollY === 0, `gate=${h1.gate} y=${h1.scrollY}`);
    await page.waitForFunction(() => document.documentElement.dataset.nmGate === 'active', null, { timeout: 45000 });
    await page.waitForFunction(() => !document.documentElement.dataset.nmScrollLock, null, { timeout: 5000 });
    await page.waitForTimeout(700); // any queued/stale scroll would fire here
    const d1 = await state(page);
    check('D1 lock released exactly at interactive gate', d1.lock === null && d1.gate === 'active');
    check('D1 no queued scroll fired at unlock', d1.scrollY === 0, `scrollY=${d1.scrollY}`);
    check('D1 cinematic timeline active from top', d1.diveState === 'active' && Number(d1.diveProgress) === 0);
    check('D1 boot sheet dismissed after handoff', d1.sheetHidden && (d1.boot === 'handoff' || d1.boot === 'dismissed'));

    const probe = await page.evaluate(() => {
      const inst = window.__nm10;
      return { states: inst.sceneStates.join('>'), cls: +inst.layoutShifts.toFixed(4), vw: document.documentElement.clientWidth };
    });
    check('D1 scene state monotonic (no laptop flapping)', probe.states === 'ready' || probe.states === '', probe.states);
    check('D1 no layout shift from the lock/unlock toggle', probe.cls === 0, `CLS entries sum=${probe.cls}`);
    check('D1 viewport width unchanged by unlock (gutter reserved)', probe.vw === d1.vw, `${probe.vw} vs ${d1.vw}`);
    await page.screenshot({ path: `${OUT}/D-unlocked-revealed.png` });

    // D2: wheel now scrolls (Lenis started) — forward dive
    for (let i = 0; i < 25; i++) await page.mouse.wheel(0, 800);
    await page.waitForTimeout(1600);
    const fwd = await state(page);
    check('D2 wheel scrolls after unlock', fwd.scrollY > 300, `scrollY=${fwd.scrollY}`);
    check('D2 forward dive progresses', Number(fwd.diveProgress) > 0.3, `p=${fwd.diveProgress}`);

    // 9: full forward cinematic dive to the HTML portfolio
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(1200);
    const done = await page.evaluate(() => ({
      p: Number(document.getElementById('intro').dataset.diveProgress),
      portfolioOpacity: document.querySelector('.portfolio-content').style.opacity,
      pointerEvents: getComputedStyle(document.querySelector('.portfolio-content')).pointerEvents,
      worksTop: Math.round(document.querySelector('#works').getBoundingClientRect().top),
    }));
    check('9 full forward dive completes', done.p >= 0.99, `p=${done.p}`);
    check('9 HTML portfolio handed off & interactive', done.portfolioOpacity === '1' && done.pointerEvents === 'auto' || done.pointerEvents === 'none;auto' || done.pointerEvents === '', `op=${done.portfolioOpacity} pe=${done.pointerEvents}`);
    await page.screenshot({ path: `${OUT}/D2-dive-complete.png` });

    // 10: reverse the entire sequence
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1200);
    const back = await state(page);
    check('10 full reverse restores hero', Number(back.diveProgress) === 0 && back.scrollY === 0, `p=${back.diveProgress}`);
    const heroTitle = await page.evaluate(() => document.querySelector('.hero-title').style.opacity);
    check('10 hero typography restored on reverse', heroTitle === '1', `opacity=${heroTitle}`);
    await page.screenshot({ path: `${OUT}/D3-reversed-hero.png` });

    // Refresh: restoring session must never lock and must preserve position
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(900);
    const preReload = await page.evaluate(() => ({
      y: Math.round(window.scrollY),
      worksTop: Math.round(document.querySelector('#works').getBoundingClientRect().top),
    }));
    await page.reload();
    await page.waitForSelector('#intro');
    const rel = await state(page);
    check('13 reload: no lock on restored session', rel.lock === null, `boot=${rel.boot}`);
    await page.waitForFunction(() => document.getElementById('intro').dataset.diveState !== undefined, null, { timeout: 45000 });
    await page.waitForTimeout(1200);
    const post = await page.evaluate(() => ({
      y: Math.round(window.scrollY),
      worksTop: Math.round(document.querySelector('#works').getBoundingClientRect().top),
      p: Number(document.getElementById('intro').dataset.diveProgress),
    }));
    check('13 reload: reading position preserved exactly', post.y === preReload.y && post.worksTop === preReload.worksTop && post.p >= 0.9,
      `${preReload.y}/${preReload.worksTop} -> ${post.y}/${post.worksTop} p=${post.p}`);

    check('A/D uncaught page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
    await context.close();
    const video = page.video && (await (async () => { try { return await page.video.path(); } catch { return null; } })());
    if (video) fs.copyFileSync(video, `${OUT}/A-desktop-cinematic.webm`);
  }

  // ---------- Test B: mobile touch lock during NM/01 ----------
  {
    const { context, page, errors } = await freshContext(browser, {
      viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3,
    });
    await delayScene(page, 6000);
    await page.goto(TARGET);
    await page.waitForSelector('#nm-boot');
    const b1 = await state(page);
    check('B1 mobile lock applied', b1.lock === 'true');
    const client = await context.newCDPSession(page);
    const swipe = async () => {
      await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 187, y: 620 }] });
      for (let y = 620; y >= 160; y -= 40) await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 187, y }] });
      await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    };
    await swipe(); await page.waitForTimeout(400); await swipe(); await page.waitForTimeout(400);
    check('B3 touch swipe locked during boot', (await state(page)).scrollY === 0);
    await page.screenshot({ path: `${OUT}/B-mobile-locked.png` });
    await page.waitForFunction(() => document.documentElement.dataset.nmGate === 'active', null, { timeout: 45000 });
    await page.waitForFunction(() => !document.documentElement.dataset.nmScrollLock, null, { timeout: 5000 });
    await swipe(); await page.waitForTimeout(800);
    const b2 = await state(page);
    check('B6 mobile unlock then touch scrolls into dive', b2.lock === null && b2.scrollY > 20, `scrollY=${b2.scrollY} p=${b2.diveProgress}`);
    check('B uncaught page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
    await context.close();
  }

  // ---------- Test C: Skip Intro before readiness ----------
  {
    const { context, page, errors } = await freshContext(browser);
    await delayScene(page, 12000);
    await page.goto(TARGET);
    await page.waitForSelector('.nm-boot-skip');
    const c1 = await state(page);
    check('C1 skip available while locked', c1.lock === 'true');
    await page.click('.nm-boot-skip');
    await page.waitForTimeout(600);
    const c2 = await state(page);
    check('C11 skip releases lock immediately', c2.lock === null && c2.boot === 'dismissed', `boot=${c2.boot}`);
    check('C11 skip exposes HTML portfolio at #works', (await page.evaluate(() => location.hash)) === '#works');
    const worksVisible = await page.evaluate(() => {
      const r = document.querySelector('#works').getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0;
    });
    check('C11 works section in viewport after skip', worksVisible);
    for (let i = 0; i < 6; i++) await page.mouse.wheel(0, 500);
    await page.waitForTimeout(800);
    check('C11 scrolling works right after skip', (await state(page)).scrollY > 50);
    // Scene still finishes in the background and must not re-lock or trap
    await page.waitForFunction(() => document.documentElement.dataset.nmGate === 'active', null, { timeout: 45000 });
    await page.waitForTimeout(400);
    const c3 = await state(page);
    check('C11 no re-lock after background readiness', c3.lock === null && c3.scrollY > 0);
    check('C uncaught page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
    await context.close();
  }

  // ---------- Test D: WebGL failure unlocks into static fallback ----------
  {
    const failBrowser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--disable-webgl', '--disable-webgl2', '--disable-gpu'] });
    const { context, page, errors } = await freshContext(failBrowser);
    await page.goto(TARGET);
    await page.waitForSelector('#nm-boot');
    const d0 = await state(page);
    check('D-fail lock applied before failure known', d0.lock === 'true');
    await page.waitForFunction(() => document.documentElement.dataset.nmGate === 'fallback', null, { timeout: 30000 });
    await page.waitForFunction(() => !document.documentElement.dataset.nmScrollLock, null, { timeout: 5000 });
    const d1 = await state(page);
    check('D12 WebGL failure releases lock', d1.lock === null && d1.gate === 'fallback');
    check('D12 static fallback presented', d1.sceneState === 'fallback' && (await page.isVisible('.scene-fallback')));
    for (let i = 0; i < 8; i++) await page.mouse.wheel(0, 500);
    await page.waitForTimeout(800);
    const d2 = await state(page);
    check('D12 scrolling free after failure (no trap)', d2.scrollY > 100, `scrollY=${d2.scrollY}`);
    await page.screenshot({ path: `${OUT}/D-webgl-failure-fallback.png` });
    await context.close();
    await failBrowser.close();
  }

  // ---------- Test E: scene never arrives (20s timeout) still unlocks ----------
  {
    const { context, page } = await freshContext(browser);
    await page.route('**/LaptopScene-*.js', (route) => new Promise(() => { /* never settles */ }));
    await page.goto(TARGET);
    await page.waitForSelector('#nm-boot');
    check('E1 lock applied while scene request hangs', (await state(page)).lock === 'true');
    await page.waitForFunction(() => document.documentElement.dataset.nmGate === 'fallback', null, { timeout: 40000 });
    await page.waitForFunction(() => !document.documentElement.dataset.nmScrollLock, null, { timeout: 5000 });
    const e1 = await state(page);
    check('E12 hung scene: timeout fallback unlocks', e1.lock === null && e1.gate === 'fallback' && e1.sceneState === 'fallback');
    for (let i = 0; i < 8; i++) await page.mouse.wheel(0, 500);
    await page.waitForTimeout(800);
    check('E12 scrolling free after timeout', (await state(page)).scrollY > 100);
    await context.close();
  }

  // ---------- Test H: weak GPU (SwiftShader) falls back and unlocks ----------
  {
    const weakBrowser = await chromium.launch({ headless: true }); // bundled build renders via SwiftShader
    const { context, page } = await freshContext(weakBrowser);
    await page.goto(TARGET);
    await page.waitForSelector('#nm-boot');
    check('H1 weak device: lock applied initially', (await state(page)).lock === 'true');
    await page.waitForFunction(() => document.documentElement.dataset.nmGate === 'fallback', null, { timeout: 30000 });
    await page.waitForFunction(() => !document.documentElement.dataset.nmScrollLock, null, { timeout: 5000 });
    const h1 = await state(page);
    check('H1 weak device: static fallback, lock released', h1.lock === null && h1.sceneState === 'fallback');
    for (let i = 0; i < 8; i++) await page.mouse.wheel(0, 500);
    await page.waitForTimeout(800);
    check('H1 weak device: scrolling free (no trap)', (await state(page)).scrollY > 100);
    await context.close();
    await weakBrowser.close();
  }

  // ---------- Test F: reduced motion never locks ----------
  {
    const { context, page, errors } = await freshContext(browser, { reducedMotion: 'reduce' });
    await page.goto(TARGET);
    await page.waitForSelector('#intro');
    const f1 = await state(page);
    check('F reduced-motion: no lock, quiet mode', f1.lock === null && (await page.evaluate(() => document.documentElement.dataset.nmBootMode)) === 'quiet');
    await page.waitForTimeout(1200);
    for (let i = 0; i < 8; i++) await page.mouse.wheel(0, 500);
    await page.waitForTimeout(700);
    check('F reduced-motion: scrolling free immediately', (await state(page)).scrollY > 100);
    await context.close();
  }

  // ---------- Test G: deep link never locks ----------
  {
    const { context, page } = await freshContext(browser);
    await page.goto(`${TARGET}#works`);
    await page.waitForSelector('#works');
    const g1 = await state(page);
    check('G deep link: never locked', g1.lock === null && g1.boot === 'navigation' || g1.boot === 'dismissed', `boot=${g1.boot}`);
    await context.close();
  }

  await browser.close();
  const failed = results.filter((r) => !r.pass);
  console.log(`\n===== ${results.length - failed.length}/${results.length} passed =====`);
  fs.writeFileSync(`${OUT}/nm10-acceptance-results.json`, JSON.stringify(results, null, 2));
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error('SCRIPT ERROR', e); process.exit(2); });
