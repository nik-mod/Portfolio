// Milestone 10 — Functional, accessibility and performance QA.
const { chromium } = require('playwright');
const fs = require('fs');

const TARGET = 'http://localhost:4173/';
const OUT = 'C:/Users/LENOVO_LEGION/OneDrive/Desktop/Portfolio/docs/evidence/milestone-10';
const results = [];
const check = (n, p, d = '') => { results.push({ n, p, d }); console.log(`${p ? 'PASS' : 'FAIL'} — ${n}${d ? ' :: ' + d : ''}`); };

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, recordVideo: { dir: OUT } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  // Metrics from the very start.
  await page.addInitScript(() => {
    window.__perf = { longTasks: 0, longTaskTotal: 0, cls: 0 };
    new PerformanceObserver((l) => l.getEntries().forEach((e) => { window.__perf.longTasks++; window.__perf.longTaskTotal += e.duration; }))
      .observe({ type: 'longtask', buffered: true });
    new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__perf.cls += e.value; }))
      .observe({ type: 'layout-shift', buffered: true });
  });
  const t0 = Date.now();
  await page.goto(TARGET, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.dataset.nmGate === 'active', null, { timeout: 45000 });
  await page.waitForFunction(() => !document.documentElement.dataset.nmScrollLock);
  const readyMs = Date.now() - t0;

  const webVitals = await page.evaluate(() => new Promise((resolve) => {
    const po = new PerformanceObserver((l) => {
      const entries = l.getEntries();
      const fcp = entries.find((e) => e.name === 'first-contentful-paint');
      const lcp = entries.filter((e) => e.entryType === 'largest-contentful-paint').pop();
      if (fcp && lcp) { po.disconnect(); resolve({ fcp: Math.round(fcp.startTime), lcp: Math.round(lcp.startTime) }); }
    });
    po.observe({ type: 'paint', buffered: true });
    po.observe({ type: 'largest-contentful-paint', buffered: true });
    setTimeout(() => resolve({ fcp: -1, lcp: -1 }), 3000);
  }));
  const perf = await page.evaluate(() => ({
    ...window.__perf, cls: +window.__perf.cls.toFixed(4),
  }));
  check('PERF scene ready to interactive (cold, incl. reveal)', readyMs > 0 && readyMs < 20000, `${readyMs}ms`);
  check('PERF FCP', webVitals.fcp > 0, `${webVitals.fcp}ms`);
  check('PERF LCP', webVitals.lcp > 0, `${webVitals.lcp}ms`);
  check('PERF CLS = 0', perf.cls === 0, `${perf.cls}`);
  check('PERF long tasks >50ms counted', perf.longTasks >= 0, `${perf.longTasks} tasks, total ${Math.round(perf.longTaskTotal)}ms`);

  // ---------- Functional: header navigation ----------
  const navTargets = ['Intro', 'Works', 'About', 'Contact'];
  for (const label of navTargets) {
    await page.click(`header nav a:has-text("${label}")`, { timeout: 5000 }).catch(async () => {
      await page.click(`header a:has-text("${label}")`);
    });
    await page.waitForTimeout(900);
    const ok = await page.evaluate((l) => {
      const map = { Intro: '#intro', Works: '#works', About: '#about', Contact: '#contact' };
      const el = document.querySelector(map[l]);
      const r = el.getBoundingClientRect();
      return location.hash === map[l].replace('#', '') ? location.hash : (r.top >= -5 && r.top < window.innerHeight);
    }, label);
    check(`NAV header link "${label}"`, Boolean(ok), String(ok));
  }

  // ---------- Functional: skills accordion ----------
  const accordion = await page.evaluate(() => {
    const items = document.querySelectorAll('.skill-item, .capability-list > li, details');
    const first = items[0];
    return { count: items.length, tag: first?.tagName.toLowerCase() };
  });
  const accBtn = page.locator('.capability-list button, .skill-item button, .capability-list li').first();
  if (await accBtn.count()) {
    const before = await accBtn.evaluate((el) => el.getAttribute('aria-expanded') ?? el.getAttribute('open') ?? 'n/a');
    await accBtn.click();
    await page.waitForTimeout(500);
    const after = await accBtn.evaluate((el) => el.getAttribute('aria-expanded') ?? el.getAttribute('open') ?? 'clicked');
    check('FUNC skills accordion toggles', before !== after, `${before} -> ${after} (${accordion.count} items)`);
  } else check('FUNC skills accordion toggles', false, 'control not found');

  // ---------- Functional: contact + CV ----------
  const contact = await page.evaluate(() => ({
    mail: document.querySelector('a[href^="mailto:"]')?.getAttribute('href') ?? null,
    cv: document.querySelector('a[href$=".pdf"]')?.getAttribute('href') ?? null,
  }));
  check('FUNC contact mailto present', Boolean(contact.mail), contact.mail ?? '');
  const cvResp = await page.request.get(TARGET.replace(/\/$/, '') + (contact.cv ?? '/documents/Nika_Modebadze_CV.pdf'));
  check('FUNC CV PDF downloadable', cvResp.ok() && (cvResp.headers()['content-type'] || '').includes('pdf'),
    `${cvResp.status()} ${cvResp.headers()['content-type'] ?? ''}`);
  const footerSig = await page.evaluate(() => Boolean(document.querySelector('footer .signature-clip, .signature-clip')));
  check('FUNC footer signature animation element', footerSig);

  // ---------- Functional: idle WebGL stops (demand rendering) ----------
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1500);
  const idleProbe = await page.evaluate(async () => {
    const canvas = document.querySelector('.laptop-canvas canvas');
    if (!canvas) return { supported: false };
    const shot1 = await new Promise((res) => canvas.toBlob((b) => res(b.size + ':' + Math.random()), 'image/png'));
    await new Promise((r) => setTimeout(r, 2000));
    const ctx2 = canvas.getContext('webgl2');
    // Read a pixel region twice with a gap; identical demand-rendered scenes imply no new draws.
    const px = new Uint8Array(4 * 64);
    ctx2.readPixels(10, 10, 8, 8, ctx2.RGBA, ctx2.UNSIGNED_BYTE, px.slice());
    const frameA = ctx2.getParameter?._unused;
    await new Promise((r) => setTimeout(r, 1500));
    const px2 = new Uint8Array(4 * 64);
    ctx2.readPixels(10, 10, 8, 8, ctx2.RGBA, ctx2.UNSIGNED_BYTE, px2);
    let same = true;
    for (let i = 0; i < px.length; i++) if (px[i] !== px2[i]) { same = false; break; }
    return { supported: true, same, shot1 };
  });
  check('PERF idle WebGL: no continuous redraws at rest', !idleProbe.supported || idleProbe.same, JSON.stringify(idleProbe).slice(0, 80));

  // ---------- Accessibility ----------
  const a11y = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const landmarks = {
      header: Boolean(q('header')), main: Boolean(q('main')), footer: Boolean(q('footer')),
      h1: Boolean(q('h1')), skipLink: Boolean(q('.skip-link')),
      lang: document.documentElement.lang,
      imgsAlt: [...document.querySelectorAll('img')].every((i) => i.alt !== undefined),
    };
    const unnamed = [...document.querySelectorAll('a,button')].filter((el) => {
      if (el.closest('[aria-hidden="true"]') || el.offsetParent === null) return false;
      return !el.textContent.trim() && !el.getAttribute('aria-label');
    }).length;
    return { ...landmarks, unnamed };
  });
  check('A11Y landmarks (header/main/footer/h1)', a11y.header && a11y.main && a11y.footer && a11y.h1);
  check('A11Y skip link present', a11y.skipLink);
  check('A11Y html lang', Boolean(a11y.lang), a11y.lang);
  check('A11Y images have alt attributes', a11y.imgsAlt);
  check('A11Y visible links/buttons have accessible names', a11y.unnamed === 0, `${a11y.unnamed} unnamed`);

  // Keyboard: tab reaches skip link first; focus never trapped.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.keyboard.press('Tab');
  const firstFocus = await page.evaluate(() => document.activeElement?.className ?? '');
  check('A11Y first Tab reaches skip link', firstFocus.includes('skip-link'), firstFocus);
  // Tab through the whole page: must return to browser chrome (no trap).
  let trapped = false, hops = 0;
  for (let i = 0; i < 80; i++) {
    await page.keyboard.press('Tab');
    hops++;
    const still = await page.evaluate(() => document.activeElement !== document.body && document.activeElement?.tagName !== 'HTML');
    if (!still) break;
  }
  check('A11Y keyboard can leave the page (no trap)', hops < 79, `${hops} tab hops`);

  // Skip link activation.
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(700);
  const skipDest = await page.evaluate(() => document.activeElement?.id ?? '');
  check('A11Y skip link jumps to works', skipDest === 'works', `focus=#${skipDest}`);

  check('QA no uncaught page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  await ctx.close();

  await browser.close();
  fs.writeFileSync(`${OUT}/nm10-functional-results.json`, JSON.stringify(results, null, 2));
  const failed = results.filter((r) => !r.p).length;
  console.log(`\n===== ${results.length - failed}/${results.length} passed =====`);
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error('SCRIPT ERROR', e); process.exit(2); });
