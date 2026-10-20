// M10.3 defect reproduction: reveal mismatch, quiet scan freeze, restoring sheet.
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = 'C:/Users/LENOVO_LEGION/OneDrive/Desktop/Portfolio/docs/evidence/milestone-10-3';
fs.mkdirSync(OUT + '/before', { recursive: true });

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  // ---- A: cold-boot reveal — poster vs live canvas alignment ----
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, recordVideo: { dir: OUT + '/before' } });
    const page = await ctx.newPage();
    await page.goto('http://localhost:4173/');
    await page.waitForFunction(() => document.documentElement.dataset.nmGate === 'handoff', null, { timeout: 45000 });
    const geo = await page.evaluate(() => {
      const poster = document.querySelector('.scene-poster img');
      const canvas = document.querySelector('.laptop-canvas canvas');
      const p = poster.getBoundingClientRect(), c = canvas.getBoundingClientRect();
      const ia = 1003 / 657, ba = c.width / c.height;
      const cw = Math.min(c.width, c.height * ia), ch = Math.min(c.height, c.width / ia);
      return {
        poster: { l: +p.left.toFixed(1), t: +p.top.toFixed(1), w: +p.width.toFixed(1), h: +p.height.toFixed(1) },
        canvas: { l: +c.left.toFixed(1), t: +c.top.toFixed(1), w: +c.width.toFixed(1), h: +c.height.toFixed(1) },
        posterContainBox: { l: +(c.left + (c.width - cw) / 2).toFixed(1), t: +c.top.toFixed(1), w: +cw.toFixed(1), h: +ch.toFixed(1) },
        boxAspect: +ba.toFixed(3), posterAspect: +ia.toFixed(3),
      };
    });
    console.log('A geometry:', JSON.stringify(geo, null, 1));
    await page.screenshot({ path: `${OUT}/before/A-reveal-start.png` });
    await page.waitForFunction(() => document.documentElement.dataset.nmGate === 'active', null, { timeout: 10000 });
    await page.waitForTimeout(1100);
    await page.screenshot({ path: `${OUT}/before/A-reveal-end.png` });
    await ctx.close();
  }

  // ---- B: returning refresh — scan line frozen? ----
  for (const [label, url, dev] of [['PROD', 'http://localhost:4173/', false], ['DEV-5174', 'http://localhost:5174/', true]]) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(url);
    await page.waitForFunction(() => document.documentElement.dataset.nmGate === 'active' || document.documentElement.dataset.nmGate === 'fallback', null, { timeout: 60000 });
    let wait = 8000;
    await page.route(dev ? '**/LaptopScene*' : '**/LaptopScene-*.js', async (r) => { if (wait > 0) await new Promise((res) => setTimeout(res, wait)); wait = 0; await r.continue(); });
    await page.reload(); // returning session (sessionStorage set by first visit)
    await page.waitForSelector('#nm-boot:not([hidden])', { timeout: 10000 }).catch(() => {});
    const samples = [];
    for (let i = 0; i < 14; i++) {
      const s = await page.evaluate(() => {
        const scan = document.querySelector('.nm-boot-scan');
        if (!scan) return null;
        const r = scan.getBoundingClientRect();
        const cs = getComputedStyle(scan);
        return { y: +r.top.toFixed(1), mode: document.documentElement.dataset.nmBootMode, playState: cs.animationName === 'none' ? 'none' : cs.animationPlayState };
      }).catch(() => null);
      samples.push(s);
      await page.waitForTimeout(180);
    }
    const ys = samples.filter(Boolean).map((s) => s.y);
    const moving = new Set(ys).size > 2;
    console.log(`B ${label}: mode=${samples.find(Boolean)?.mode} playState=${samples.find(Boolean)?.playState} scanY samples=[${ys.slice(0, 8).join(',')}] -> ${moving ? 'ANIMATING' : 'FROZEN (DEFECT)'}`);
    await ctx.close();
  }

  // ---- C: restoring mid-dive — boot sheet over content ----
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto('http://localhost:4173/');
    await page.waitForFunction(() => document.documentElement.dataset.nmGate === 'active', null, { timeout: 45000 });
    await page.waitForFunction(() => !document.documentElement.dataset.nmScrollLock);
    await page.evaluate(() => window.scrollTo(0, 4200));
    await page.waitForTimeout(900);
    let wait = 8000;
    await page.route('**/LaptopScene-*.js', async (r) => { if (wait > 0) await new Promise((res) => setTimeout(res, wait)); wait = 0; await r.continue(); });
    await page.reload();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${OUT}/before/C-restore-1s.png` });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${OUT}/before/C-restore-2s.png` });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT}/before/C-restore-3-5s.png` });
    const vis = await page.evaluate(() => {
      const sheet = document.getElementById('nm-boot');
      return { hidden: sheet.hidden, opacity: getComputedStyle(sheet).opacity, y: Math.round(scrollY) };
    });
    console.log('C restoring sheet @~3.7s:', JSON.stringify(vis));
    await ctx.close();
  }

  await browser.close();
})().catch((e) => { console.error('SCRIPT ERROR', e); process.exit(2); });
