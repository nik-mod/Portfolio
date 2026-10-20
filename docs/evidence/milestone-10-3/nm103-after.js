// M10.3 after-fix verification for the three reproduced defects.
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = 'C:/Users/LENOVO_LEGION/OneDrive/Desktop/Portfolio/docs/evidence/milestone-10-3';
fs.mkdirSync(OUT + '/after', { recursive: true });
const results = [];
const check = (n, p, d = '') => { results.push({ n, p, d }); console.log(`${p ? 'PASS' : 'FAIL'} — ${n}${d ? ' :: ' + d : ''}`); };

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  // ---- B-after: scan animates in quiet mode (fresh + returning, both servers) ----
  for (const [label, url, dev] of [['PROD', 'http://localhost:4173/', false], ['DEV-5174', 'http://localhost:5174/', true]]) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(url);
    await page.waitForFunction(() => document.documentElement.dataset.nmGate === 'active' || document.documentElement.dataset.nmGate === 'fallback', null, { timeout: 60000 });
    let wait = 8000;
    await page.route(dev ? '**/LaptopScene*' : '**/LaptopScene-*.js', async (r) => { if (wait > 0) await new Promise((res) => setTimeout(res, wait)); wait = 0; await r.continue(); });
    await page.reload();
    await page.waitForSelector('#nm-boot:not([hidden])', { timeout: 10000 }).catch(() => {});
    const ys = [];
    for (let i = 0; i < 14; i++) {
      ys.push(await page.evaluate(() => {
        const s = document.querySelector('.nm-boot-scan');
        return s ? +s.getBoundingClientRect().top.toFixed(1) : null;
      }).catch(() => null));
      await page.waitForTimeout(180);
    }
    const moved = new Set(ys.filter((v) => v !== null)).size;
    check(`B-after ${label}: scan animates on refresh (quiet)`, moved > 4, `distinct positions=${moved} samples=[${ys.slice(0, 6).join(',')}]`);
    await ctx.close();
  }

  // ---- C-after: restoring mid-dive — sheet dismissed, position kept ----
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto('http://localhost:4173/');
    await page.waitForFunction(() => document.documentElement.dataset.nmGate === 'active', null, { timeout: 45000 });
    await page.waitForFunction(() => !document.documentElement.dataset.nmScrollLock);
    await page.evaluate(() => window.scrollTo(0, 1800));
    await page.waitForTimeout(900);
    let wait = 8000;
    await page.route('**/LaptopScene-*.js', async (r) => { if (wait > 0) await new Promise((res) => setTimeout(res, wait)); wait = 0; await r.continue(); });
    await page.reload();
    await page.waitForTimeout(1500);
    const early = await page.evaluate(() => ({
      y: Math.round(scrollY),
      lock: document.documentElement.dataset.nmScrollLock ?? null,
      sheetOpacity: getComputedStyle(document.getElementById('nm-boot')).opacity,
      sheetHidden: document.getElementById('nm-boot').hidden,
    }));
    check('C-after: restored position kept (mid-dive reload)', early.y > 1500, `y=${early.y}`);
    check('C-after: boot sheet dismissed over restored content', early.sheetHidden || +early.sheetOpacity < 0.15, `op=${early.sheetOpacity}`);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${OUT}/after/C-restore-after.png` });
    await ctx.close();
  }

  // ---- C-after-2: refresh at TOP still locks (deferred lock holds) ----
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto('http://localhost:4173/');
    await page.waitForFunction(() => document.documentElement.dataset.nmGate === 'active', null, { timeout: 45000 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    let wait = 8000;
    await page.route('**/LaptopScene-*.js', async (r) => { if (wait > 0) await new Promise((res) => setTimeout(res, wait)); wait = 0; await r.continue(); });
    await page.reload();
    await page.waitForTimeout(2600);
    for (let i = 0; i < 6; i++) await page.mouse.wheel(0, 600);
    await page.keyboard.press('PageDown');
    await page.waitForTimeout(400);
    const s = await page.evaluate(() => ({ y: Math.round(scrollY), lock: document.documentElement.dataset.nmScrollLock ?? null }));
    check('C-after-2: top refresh still locked (deferred lock)', s.y === 0 && s.lock === 'true', JSON.stringify(s));
    await ctx.close();
  }

  // ---- Screen-after: mid-dive screen content single (live + restored) ----
  for (const [label, restore] of [['live', false], ['restored', true]]) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto('http://localhost:4173/');
    await page.waitForFunction(() => document.documentElement.dataset.nmGate === 'active', null, { timeout: 45000 });
    await page.waitForFunction(() => !document.documentElement.dataset.nmScrollLock);
    if (!restore) {
      await page.evaluate(() => window.scrollTo(0, 1800));
      await page.waitForTimeout(800);
    } else {
      await page.evaluate(() => window.scrollTo(0, 1800));
      await page.waitForTimeout(800);
      await page.reload();
      await page.waitForFunction(() => document.getElementById('intro').dataset.diveState !== undefined, null, { timeout: 45000 });
      await page.waitForTimeout(1200);
    }
    await page.screenshot({ path: `${OUT}/after/screen-middive-${label}.png` });
    // The baked artwork must be dimmed while the capture is visible.
    const probe = await page.evaluate(() => {
      const p = Number(document.getElementById('intro').dataset.diveProgress);
      return { p, previewOpacity: getComputedStyle(document.querySelector('.screen-portfolio') ? document.querySelector('.screen-portfolio') : document.body).opacity };
    });
    check(`screen-after ${label}: mid-dive reached`, probe.p > 0.3 && probe.p < 0.9, `p=${probe.p}`);
    await ctx.close();
  }

  await browser.close();
  fs.writeFileSync(`${OUT}/nm103-after-results.json`, JSON.stringify(results, null, 2));
  const failed = results.filter((r) => !r.p).length;
  console.log(`\n===== ${results.length - failed}/${results.length} passed =====`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error('SCRIPT ERROR', e); process.exit(2); });
