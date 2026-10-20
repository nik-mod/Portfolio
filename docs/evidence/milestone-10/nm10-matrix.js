// Milestone 10.1 — returning/refresh gate matrix with recordings.
const { chromium, firefox, webkit } = require('playwright');
const fs = require('fs');

const OUT = 'C:/Users/LENOVO_LEGION/OneDrive/Desktop/Portfolio/docs/evidence/milestone-10';
fs.mkdirSync(OUT, { recursive: true });
const results = [];
const check = (n, p, d = '') => { results.push({ n, p, d }); console.log(`${p ? 'PASS' : 'FAIL'} — ${n}${d ? ' :: ' + d : ''}`); };
const st = (page) => page.evaluate(() => ({
  lock: document.documentElement.dataset.nmScrollLock ?? null,
  gate: document.documentElement.dataset.nmGate ?? null,
  boot: document.documentElement.dataset.nmBoot ?? null,
  mode: document.documentElement.dataset.nmBootMode ?? null,
  y: Math.round(window.scrollY),
  diveState: document.getElementById('intro')?.dataset.diveState ?? null,
  diveProgress: document.getElementById('intro')?.dataset.diveProgress ?? null,
  pinInstalled: Boolean(document.querySelector('.portfolio-content').style.marginTop),
}));

async function delayScene(page, ms, dev) {
  let wait = ms;
  const pattern = dev ? '**/LaptopScene*' : '**/LaptopScene-*.js';
  await page.route(pattern, async (r) => { if (wait > 0) await new Promise((res) => setTimeout(res, wait)); wait = 0; await r.continue(); });
}

// Core gated-visit probe: attempts every input class during prep, asserts the
// hold, then after readiness asserts unlock + full forward/reverse cinematic.
async function gatedVisit(browser, label, url, dev, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 850 }, recordVideo: opts.record ? { dir: `${OUT}/recordings` } : undefined, ...opts.context });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await delayScene(page, 7000, dev);
  if (opts.before) await opts.before(page);
  await page.goto(url);
  await page.waitForSelector('#nm-boot:not([hidden])', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2200);

  const early = await st(page);
  check(`${label}: gate present during prep`, early.lock === 'true' && early.gate === 'preparing', JSON.stringify(early));

  for (let i = 0; i < 8; i++) await page.mouse.wheel(0, 500);
  for (const key of ['Space', 'ArrowDown', 'PageDown']) await page.keyboard.press(key);
  await page.waitForTimeout(500);
  const held = await st(page);
  check(`${label}: wheel+keyboard held during prep`, held.y === 0 && held.diveProgress === null && !held.pinInstalled, `y=${held.y} p=${held.diveProgress}`);

  await page.waitForFunction(() => document.documentElement.dataset.nmGate === 'handoff', null, { timeout: 45000 });
  for (let i = 0; i < 5; i++) await page.mouse.wheel(0, 500);
  await page.waitForTimeout(300);
  const duringHandoff = await st(page);
  check(`${label}: lock held through the reveal`, duringHandoff.lock === 'true' && duringHandoff.y === 0);

  await page.waitForFunction(() => document.documentElement.dataset.nmGate === 'active', null, { timeout: 45000 });
  await page.waitForFunction(() => !document.documentElement.dataset.nmScrollLock, null, { timeout: 5000 });
  await page.waitForTimeout(600);
  const free = await st(page);
  check(`${label}: unlocked only after interactive`, free.lock === null && free.gate === 'active' && free.diveState === 'active');

  for (let i = 0; i < 20; i++) await page.mouse.wheel(0, 800);
  await page.waitForTimeout(1500);
  const fwd = await st(page);
  check(`${label}: forward cinematic after unlock`, Number(fwd.diveProgress) > 0.9, `p=${fwd.diveProgress}`);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1100);
  const rev = await st(page);
  check(`${label}: reverse cinematic restores hero`, Number(rev.diveProgress) === 0 && rev.y === 0);
  check(`${label}: no page errors`, errors.length === 0, errors.slice(0, 2).join(' | '));
  const video = opts.record && typeof page.video === 'function' ? await page.video().path().catch(() => null) : null;
  if (video) { await ctx.close(); fs.renameSync(video, `${OUT}/recordings/${label.replace(/[^a-z0-9]+/gi, '-')}.webm`); }
  else await ctx.close();
}

// Repeated refreshes in one live session, each attempting premature scroll.
async function repeatedRefresh(browser, label, url, dev) {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 850 }, recordVideo: { dir: `${OUT}/recordings` } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  // One persistent handler; each round sets the delay it needs.
  let sceneWait = 0;
  await page.route(dev ? '**/LaptopScene*' : '**/LaptopScene-*.js', async (r) => {
    if (sceneWait > 0) await new Promise((res) => setTimeout(res, sceneWait));
    sceneWait = 0;
    await r.continue();
  });
  await page.goto(url);
  await page.waitForFunction(() => document.documentElement.dataset.nmGate === 'active', null, { timeout: 45000 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  for (let round = 1; round <= 3; round++) {
    sceneWait = 6000;
    await page.reload();
    await page.waitForTimeout(2200);
    for (let i = 0; i < 6; i++) await page.mouse.wheel(0, 600);
    await page.keyboard.press('PageDown');
    await page.waitForTimeout(400);
    const s = await st(page);
    check(`${label} refresh #${round}: scroll held`, s.y === 0 && s.lock === 'true', `y=${s.y} lock=${s.lock} boot=${s.boot}`);
  }
  await page.waitForFunction(() => document.documentElement.dataset.nmGate === 'active', null, { timeout: 45000 });
  await page.waitForTimeout(600);
  const after = await st(page);
  check(`${label} refresh x3: unlocked at end`, after.lock === null);
  for (let i = 0; i < 15; i++) await page.mouse.wheel(0, 700);
  await page.waitForTimeout(1300);
  const dive = await st(page);
  check(`${label} refresh x3: dive works after`, Number(dive.diveProgress) > 0.5, `p=${dive.diveProgress}`);
  check(`${label}: no page errors`, errors.length === 0, errors.slice(0, 2).join(' | '));
  const video = typeof page.video === 'function' ? await page.video().path().catch(() => null) : null;
  await ctx.close();
  if (video) fs.renameSync(video, `${OUT}/recordings/${label.replace(/[^a-z0-9]+/gi, '-')}-refresh-x3.webm`);
}

(async () => {
  const chrome = await chromium.launch({ channel: 'chrome', headless: true });

  // ---- Production preview (4173) ----
  await gatedVisit(chrome, 'PROD fresh', 'http://localhost:4173/', false, { record: true });
  await gatedVisit(chrome, 'PROD returning-newtab', 'http://localhost:4173/', false, {
    before: async (page) => { await page.addInitScript(() => { try { sessionStorage.setItem('nm/01', 'seen'); } catch (_) {} }); },
  });
  // Reduced-motion + returning: accessibility exception — immediate static
  // fallback, never gated, scrolling free at once.
  {
    const ctx = await chrome.newContext({ viewport: { width: 1366, height: 850 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.addInitScript(() => { try { sessionStorage.setItem('nm/01', 'seen'); } catch (_) {} });
    await page.goto('http://localhost:4173/');
    await page.waitForTimeout(1500);
    const s = await st(page);
    check('PROD reduced-motion-returning: immediate fallback, unlocked', s.gate === 'fallback' && s.lock === null && s.boot === 'dismissed', JSON.stringify(s));
    for (let i = 0; i < 6; i++) await page.mouse.wheel(0, 600);
    await page.waitForTimeout(500);
    check('PROD reduced-motion-returning: scrolling free at once', (await page.evaluate(() => Math.round(window.scrollY))) > 500);
    await ctx.close();
  }
  await repeatedRefresh(chrome, 'PROD', 'http://localhost:4173/', false);

  // Same-tab refresh with the gate probe (single reload, delayed scene)
  {
    const ctx = await chrome.newContext({ viewport: { width: 1366, height: 850 } });
    const page = await ctx.newPage();
    await page.goto('http://localhost:4173/');
    await page.waitForFunction(() => document.documentElement.dataset.nmGate === 'active', null, { timeout: 45000 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await delayScene(page, 7000, false);
    await page.reload();
    await page.waitForTimeout(2200);
    for (let i = 0; i < 6; i++) await page.mouse.wheel(0, 600);
    await page.waitForTimeout(400);
    const s = await st(page);
    check('PROD same-tab-refresh-top: scroll held', s.y === 0 && s.lock === 'true', JSON.stringify(s));
    await ctx.close();
  }

  // Mid-page restoration must NOT be gated and must preserve position (regression)
  {
    const ctx = await chrome.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto('http://localhost:4173/');
    await page.waitForFunction(() => document.documentElement.dataset.nmGate === 'active', null, { timeout: 45000 });
    await page.evaluate(() => window.scrollTo(0, 3000));
    await page.waitForTimeout(700);
    const before = await page.evaluate(() => Math.round(document.querySelector('#works').getBoundingClientRect().top));
    await delayScene(page, 7000, false);
    await page.reload();
    await page.waitForTimeout(2500);
    const r = await st(page);
    check('PROD mid-page reload: not locked', r.lock === null, JSON.stringify(r));
    check('PROD mid-page reload: reading position preserved', r.y > 2500, `y=${r.y}`);
    // Compare the works offset only once the pin and held pose are re-installed.
    await page.waitForFunction(() => document.getElementById('intro')?.dataset.diveState !== undefined &&
      Boolean(document.querySelector('.portfolio-content').style.marginTop), null, { timeout: 45000 });
    await page.waitForTimeout(1000);
    const worksTop = await page.evaluate(() => Math.round(document.querySelector('#works').getBoundingClientRect().top));
    check('PROD mid-page reload: works offset stable', Math.abs(worksTop - before) < 40, `${before} -> ${worksTop}`);
    for (let i = 0; i < 6; i++) await page.mouse.wheel(0, 500);
    await page.waitForTimeout(500);
    check('PROD mid-page reload: scrolling free immediately', (await page.evaluate(() => Math.round(window.scrollY))) > 2500);
    await ctx.close();
  }

  // ---- Development server (5173) ----
  await gatedVisit(chrome, 'DEV fresh', 'http://localhost:5173/', true);
  await gatedVisit(chrome, 'DEV returning-newtab', 'http://localhost:5173/', true, {
    before: async (page) => { await page.addInitScript(() => { try { sessionStorage.setItem('nm/01', 'seen'); } catch (_) {} }); },
  });
  {
    const ctx = await chrome.newContext({ viewport: { width: 1366, height: 850 } });
    const page = await ctx.newPage();
    await page.goto('http://localhost:5173/');
    await page.waitForFunction(() => document.documentElement.dataset.nmGate === 'active' || document.documentElement.dataset.nmGate === 'fallback', null, { timeout: 60000 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await delayScene(page, 7000, true);
    await page.reload();
    await page.waitForTimeout(2500);
    for (let i = 0; i < 6; i++) await page.mouse.wheel(0, 600);
    await page.waitForTimeout(400);
    const s = await st(page);
    check('DEV same-tab-refresh-top: scroll held', s.y === 0 && s.lock === 'true', JSON.stringify(s));
    await ctx.close();
  }

  await chrome.close();

  // ---- Cross-engine restoration under the lock (reload mid-page) ----
  for (const [engine, name] of [[firefox, 'firefox'], [webkit, 'webkit']]) {
    const b = await engine.launch({ headless: true }).catch((e) => { console.log(`${name} UNAVAILABLE: ${e.message.slice(0, 100)}`); return null; });
    if (!b) continue;
    const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await page.goto('http://localhost:4173/');
    await page.waitForFunction(() => document.documentElement.dataset.nmGate === 'active' || document.documentElement.dataset.nmGate === 'fallback', null, { timeout: 60000 });
    await page.evaluate(() => window.scrollTo(0, 2500));
    await page.waitForTimeout(700);
    await page.reload();
    await page.waitForTimeout(3000);
    const r = await st(page);
    check(`${name} mid-page reload: position restored`, r.y > 2000, `y=${r.y}`);
    check(`${name} mid-page reload: not locked`, r.lock === null);
    await ctx.close();
    await b.close();
  }

  await firefox.launch({ headless: true }).then(async (b) => {
    await gatedVisit(b, 'FF returning-newtab', 'http://localhost:4173/', false, {
      before: async (page) => { await page.addInitScript(() => { try { sessionStorage.setItem('nm/01', 'seen'); } catch (_) {} }); },
    });
    await b.close();
  }).catch((e) => console.log('FF gated visit skipped: ' + e.message.slice(0, 100)));
  await webkit.launch({ headless: true }).then(async (b) => {
    await gatedVisit(b, 'WK returning-newtab', 'http://localhost:4173/', false, {
      before: async (page) => { await page.addInitScript(() => { try { sessionStorage.setItem('nm/01', 'seen'); } catch (_) {} }); },
    });
    await b.close();
  }).catch((e) => console.log('WK gated visit skipped: ' + e.message.slice(0, 100)));

  fs.writeFileSync(`${OUT}/nm10-matrix-results.json`, JSON.stringify(results, null, 2));
  const failed = results.filter((r) => !r.p).length;
  console.log(`\n===== ${results.length - failed}/${results.length} passed =====`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error('SCRIPT ERROR', e); process.exit(2); });
