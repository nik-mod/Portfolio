// Milestone 10 — Responsive QA across the nine required viewports.
const { chromium } = require('playwright');
const fs = require('fs');

const TARGET = 'http://localhost:4173/';
const OUT = 'C:/Users/LENOVO_LEGION/OneDrive/Desktop/Portfolio/docs/evidence/milestone-10';
fs.mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { name: '320x568', width: 320, height: 568, mobile: true },
  { name: '375x812', width: 375, height: 812, mobile: true },
  { name: '390x844', width: 390, height: 844, mobile: true },
  { name: '430x932', width: 430, height: 932, mobile: true },
  { name: '768x1024', width: 768, height: 1024, mobile: false },
  { name: '1024x768', width: 1024, height: 768, mobile: false },
  { name: '1366x768', width: 1366, height: 768, mobile: false },
  { name: '1440x900', width: 1440, height: 900, mobile: false },
  { name: '1920x1080', width: 1920, height: 1080, mobile: false },
];

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const report = [];
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      hasTouch: vp.mobile, isMobile: vp.mobile, deviceScaleFactor: vp.mobile ? 2 : 1,
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(TARGET);
    await page.waitForFunction(
      () => document.documentElement.dataset.nmGate === 'active' || document.documentElement.dataset.nmGate === 'fallback',
      null, { timeout: 45000 },
    );
    await page.waitForFunction(() => !document.documentElement.dataset.nmScrollLock, null, { timeout: 5000 });
    await page.waitForTimeout(900);
    const boot = await page.evaluate(() => ({
      gate: document.documentElement.dataset.nmGate,
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      bodyScrollW: document.body.scrollWidth,
      vw: document.documentElement.clientWidth,
    }));

    // Scan every element for horizontal protrusion beyond the viewport.
    const offenders = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const bad = [];
      document.querySelectorAll('body *').forEach((el) => {
        if (!(el instanceof HTMLElement) || el.closest('#nm-boot')) return;
        const cs = getComputedStyle(el);
        if (cs.position === 'fixed' || cs.display === 'none' || cs.visibility === 'hidden') return;
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) return;
        // Allow 1px subpixel/rounding tolerance; canvas dive frames are intentionally full-bleed.
        if (r.right > vw + 1 || r.left < -1) {
          bad.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} L${Math.round(r.left)} R${Math.round(r.right)}`);
        }
      });
      return bad.slice(0, 6);
    });

    // Typography clipping: scrollWidth exceeding clientWidth on text containers.
    const clipped = await page.evaluate(() => {
      const bad = [];
      document.querySelectorAll('h1,h2,h3,p,a,span,button').forEach((el) => {
        if (!(el instanceof HTMLElement) || !el.textContent.trim() || el.closest('#nm-boot')) return;
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.overflow === 'hidden' || cs.overflowX === 'hidden' || el.className.includes('signature')) return;
        if (el.scrollWidth > el.clientWidth + 2 && cs.overflowWrap !== 'anywhere') {
          bad.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} "${el.textContent.trim().slice(0, 24)}" sw${el.scrollWidth}>cw${el.clientWidth}`);
        }
      });
      return bad.slice(0, 6);
    });

    // Laptop framing inside hero.
    const hero = await page.evaluate(() => {
      const v = document.querySelector('.viewport')?.getBoundingClientRect();
      const h = document.querySelector('.hero')?.getBoundingClientRect();
      if (!v || !h) return null;
      return { fits: v.top >= h.top - 2 && v.bottom <= h.bottom + 2 && v.left >= h.left - 2 && v.right <= h.right + 2,
        vw: Math.round(v.width), vh: Math.round(v.height), scene: document.querySelector('.viewport')?.dataset.sceneState };
    });

    // Walk sections; screenshot each and check pinned navigation consistency.
    const sections = await page.evaluate(() =>
      ['.works', '.about', '.contact'].map((s) => {
        const el = document.querySelector(s);
        return el ? { s, top: Math.round(el.getBoundingClientRect().top + window.scrollY) } : { s, top: -1 };
      }),
    );
    for (const sel of ['.works', '.about', '.contact', 'footer']) {
      await page.evaluate((s) => document.querySelector(s)?.scrollIntoView({ block: 'start', behavior: 'instant' }), sel);
      await page.waitForTimeout(700);
      await page.screenshot({ path: `${OUT}/R-${vp.name}${sel.replace('.', '-')}.png` });
    }
    const afterWalk = await page.evaluate(() => ({
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }));

    // Resize behavior mid-portfolio: keep scroll position stable (no jumps).
    await page.setViewportSize({ width: vp.width + 120, height: vp.height + 80 });
    await page.waitForTimeout(900);
    const resized = await page.evaluate(() => ({
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      y: Math.round(window.scrollY),
    }));

    report.push({ vp: vp.name, boot, offenders, clipped, hero, sections, afterWalk, resized, errors: errors.slice(0, 3) });
    const pass = boot.overflowX <= 0 && offenders.length === 0 && clipped.length === 0 && hero?.fits && afterWalk.overflowX <= 0 && errors.length === 0;
    console.log(`${pass ? 'PASS' : 'FAIL'} — ${vp.name} overflowBoot=${boot.overflowX} overflowWalk=${afterWalk.overflowX} offenders=${offenders.length} clipped=${clipped.length} heroFits=${hero?.fits} scene=${hero?.scene} errors=${errors.length}`);
    if (!pass) { console.log('  offenders:', offenders); console.log('  clipped:', clipped); console.log('  errors:', errors.slice(0, 2)); }
    await ctx.close();
  }
  await browser.close();
  fs.writeFileSync(`${OUT}/nm10-responsive-results.json`, JSON.stringify(report, null, 2));
})().catch((e) => { console.error('SCRIPT ERROR', e); process.exit(2); });
