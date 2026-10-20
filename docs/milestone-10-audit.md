# Milestone 10 — NM/01 boot scroll gate, stabilization and final QA

Date: 2026-10-20. Scope: the strict boot-to-laptop scroll gate, remaining startup/restoration defects, and the full Milestone 10 QA pass. No commit, push or deployment.

## 1. Bugs found

1. **[Critical] No scroll lock during NM/01 on a normal first visit.** The boot sheet covered the Hero visually, but nothing blocked page scrolling. `nmGate` values were written but never consumed; Lenis ran from mount; wheel/touch/keyboard all scrolled the document mid-boot, dismissed the sheet via the `finish('scroll')` path, and could scrub into an unverified scene.
2. **[High] Lock released at reveal start, not reveal end.** Once a lock existed, it was released by `finish('ready')` — the moment the 950 ms crossfade *began* — instead of when the handoff completed (`nmGate: 'active'`), violating the required STATE C→D ordering.
3. **[Medium] End-of-document reload lost the reading position.** Refreshing at the bottom of the page restored ~2.9 kpx (one pin distance) past the visitor's place: the browser clamps the restored offset against the unpinned (shorter) document before ScrollTrigger adds its pin spacing back.
4. **[Test-artifact only] Two initial QA-suite assertions** sampled too early (before the restoring timeline installed; before the quiet-mode sheet hid). Fixed in the suite; not product defects.

## 2. Root causes

- The gate plumbing existed as data attributes and events, but no consumer translated them into a scroll lock (CSS) or smooth-scroll suppression (Lenis).
- `finish('ready')` was the earliest release point by construction, and the lock piggybacked on it.
- ScrollTrigger `refresh()` preserves the *current* (already clamped) scroll offset; nothing re-extended the document end before the browser restored it.

## 3. Fixes implemented

- **`index.html`** — the boot bootstrap now sets `data-nm-scroll-lock="true"` on `<html>` for full-experience first visits only (quiet/returning, restored, deep-linked and reduced-motion entries never lock). CSS `html[data-nm-scroll-lock="true"], html[data-nm-scroll-lock="true"] body { overflow: hidden }` blocks wheel, touch and keyboard scrolling with no JS listener needed for the block itself. A `MutationObserver` on `data-nm-gate` releases the lock exactly on `active` (reveal complete) or `fallback` (failure), dispatching `nm:scroll-unlock`. Every escape route (`finish('skip' | 'focus' | 'preference' | 'navigation' | 'unavailable' | 'scroll')`) releases the lock with the sheet; a `ready` handoff deliberately does not — the observer owns that release. `scrollbar-gutter: stable` on `html` keeps the unlock from reflowing the page under classic scrollbars.
- **`src/hooks/usePageMotion.ts`** — Lenis is created stopped when the lock is present, and `stop()`/`start()` are wired to `nm:scroll-lock`/`nm:scroll-unlock`. A stopped Lenis preventDefaults input without queueing a target scroll, so no stale dive can fire at unlock. Listeners are removed on teardown.
- **`src/hooks/useScreenDive.ts`** — `startTimeline()` accepts `preserveEnd`; the restoring branch detects the clamped end-of-document case and re-extends the scroll to the true document bottom after pin installation. Mid-document restoration (the 09.9 fix) is untouched.

## 4. Boot/scroll-gate acceptance results (Phase 6)

Playwright, real GPU (Chrome channel, RTX 4070): scene ready ≈ 2.2 s, interactive ≈ 4.2 s. Full suite: **47/47 passed** (results + screenshots + video in `docs/evidence/milestone-10/`). All 13 mandated tests:

| # | Test | Result |
| --- | --- | --- |
| 1 | Fresh visit, delayed scene chunk (6 s), delayed 12 s for skip | PASS |
| 2 | Mouse wheel ×10 during NM/01 → scrollY stays 0, gate stays `preparing` | PASS |
| 3 | CDP touch swipe ×2 on 375×812 mobile during NM/01 → scrollY 0 | PASS |
| 4 | Space/ArrowDown/PageDown/End during NM/01 → scrollY 0 | PASS |
| 5 | No dive timeline exists during lock (`diveState` null/preparing, `diveProgress` unset) | PASS |
| 6 | Initialization completes (verified pose/capture/shader/GPU-fence readiness) | PASS |
| 7 | Lock held *during* the 950 ms handoff (`gate=handoff`, wheel → y=0), scene state monotonic `ready`, no flapping, CLS 0, no viewport-width change at unlock | PASS |
| 8 | Scroll available only after `active`; no queued scroll fires at unlock | PASS |
| 9 | Full forward dive to p=1.0000, HTML portfolio handoff opacity 1 / pointer events restored | PASS |
| 10 | Full reverse to p=0.0000, hero typography restored | PASS |
| 11 | Skip Intro before readiness → lock released immediately, `#works` exposed, scrolling works, no re-lock after background readiness | PASS |
| 12 | WebGL failure (`--disable-webgl`) and hung scene chunk (20 s deadline) → static fallback, lock released, no trap | PASS |
| 13 | Reload mid-portfolio: never locks; end-of-document restore now exact (y 8277→8277, worksTop −5287→−5287); mid-document restore exact (−400→−400); full reverse from restored state works | PASS |

Cross-engine boot-gate runs (fresh visit → wheel during boot → unlock → scroll): **Firefox PASS, WebKit PASS**, zero page errors. These runs also exposed bug #2, fixed and re-verified.

## 5. Responsive QA

All nine required viewports (320×568, 375×812, 390×844, 430×932, 768×1024, 1024×768, 1366×768, 1440×900, 1920×1080), fresh full-cinematic visit each, Works/About/Contact/Footer walked with screenshots, then a +120/+80 resize:

- Document horizontal overflow: 0 px at every viewport (−15 px = reserved gutter where a scrollbar exists). No overflow after the section walk or after resize.
- Hero laptop framing fits the hero box at every viewport; scene `ready` everywhere.
- Two scanner flags were verified as false positives: `.viewport-grid`/`.viewport-plane` are decorative layers clipped by `.viewport`'s own `overflow: hidden` (document-level overflow 0), and `.hero-title-outline`'s `scrollWidth > clientWidth` is the text-stroke metric — the rendered box sits 47–1000+ px inside the hero clip edge; screenshots confirm no visual clipping.
- Screenshots: `R-<viewport>-<section>.png`, `R-hero-*.png` in the evidence folder.

## 6. Performance measurements (real, cold, local production preview)

| Metric | M09.9 (desktop) | M10 measured |
| --- | ---: | ---: |
| FCP | 556 ms | **240 ms** |
| LCP | — | **476 ms** |
| CLS | 0 | **0** |
| Scene ready → interactive (incl. 950 ms reveal) | ~6.0 s ready | **3.1 s** |
| Long tasks >50 ms during startup | ~3.0 s total | **5 tasks, 1277 ms total** |

Idle WebGL: pixel-identical canvas reads 1.5 s apart at rest — demand rendering stops, no continuous redraws. Comparison caveats from 09.9 still apply: single-host samples, not controlled medians; field INP not established. Startup main-thread gaps under heavy throttling were not re-measured (no rendering-architecture change; 09.9 numbers stand).

## 7. Accessibility & browser coverage

- First Tab reaches the skip link; activating it lands focused on `#works` aligned under the header (top = 96 px = header height). Full tab-through exits the page in 9 hops — no focus trap. Keyboard scroll-lock escape routes verified (skip, focus, reduced-motion).
- Landmarks (header/main/footer/h1), `lang="en"`, skip link, alt attributes, zero unnamed visible controls — all pass.
- Reduced motion: quiet mode, never locked, static laptop fallback, scrolling immediately free.
- Browsers: **Chrome/Chromium (real GPU + SwiftShader weak-GPU) PASS, Firefox PASS, WebKit PASS** — all on the final build. Not verified: Safari on physical Apple hardware, real screen readers, physical low-end Android/iOS GPUs (no hardware available; reported as unverified, not passed).

## 8. Files modified

- [index.html](../index.html) — scroll-lock CSS + gate/release logic in the boot bootstrap.
- [src/hooks/usePageMotion.ts](../src/hooks/usePageMotion.ts) — Lenis stop/start coordination.
- [src/hooks/useScreenDive.ts](../src/hooks/useScreenDive.ts) — end-of-document restoration fix.
- `docs/evidence/milestone-10/` — test scripts, JSON results, screenshots, recordings (not deployed; safe to commit or ignore).
- This document.

## 9. Tests passed/failed

Final runs: acceptance 47/47 · functional+a11y+perf 23/23 (after correcting two suite sequencing artifacts) · responsive 9/9 viewports clean · cross-engine 3/3. Typecheck, lint and production build pass on the final tree; zero console/page errors across every scenario.

## 10. Remaining issues

- **Critical:** none. **High:** none.
- **Medium:** none.
- **Low:**
  - Chromium occasionally discards a saved scroll position at extreme document end (restores to top) *before* any site code runs — browser-level behavior; the site then loads coherently (quiet boot, dive ready). No regression from M09.9.
  - LinkedIn profile URL unverifiable by automated request (HTTP 999 bot protection); valid format, opens in real browsers.
  - Real-device Safari/low-end GPU, real AT, and deployed header/CSP validation remain unverified (inherited from 09.9; require hardware/deployment).
  - Startup long tasks (~1.3 s total) remain from the lazy Three.js payload; accepted design, unchanged.

## 11. Verdict

**Ready for deployment approval.** The boot-gate acceptance criterion is met and browser-proven: on a normal first visit NM/01 stays active and all scrolling (wheel, touch, keyboard) is locked until the laptop is fully initialized, the cinematic Hero is visually stable, and the handoff completes — only then does scrolling unlock into the cinematic dive. Skip, reduced-motion, deep-link, weak-GPU, WebGL-failure and timeout paths all unlock safely with no permanent trap. No Critical or High issues remain.

---

# Addendum M10.1 — the real-usage scroll-lock gap (returning sessions and refreshes)

Date: 2026-10-20 (same day). Trigger: the actual user recording showed the site scrolling during NM/01 despite the 47/47 suite.

## Verified root cause

The M10 lock condition skipped **every real-world re-entry**: `sessionStorage['nm/01']` present (returning visitor → quiet mode) and `navigation.type === 'reload'` (same-tab refresh) both bypassed the lock. Reproduced on the production preview: fresh session held (wheel y=0); returning session scrolled to y=2345 during prep; same-tab refresh-from-top scrolled to y=2305. The automated 47/47 suite had only ever used fresh contexts — a test-design blind spot, now closed.

## Fix ([index.html](../index.html) only)

- The lock now applies to **every session that starts at the top of the Hero** — fresh, returning, and reload alike (condition: no deep-link hash and `scrollY <= 1`). Returning visitors keep the shorter quiet intro; they just cannot scroll into an unready scene.
- New release path: a reload whose browser restoration lands **below the top** unlocks on the restoration scroll itself (`restoring && no user input && scrollY > 1`) — the visitor is reading accessible HTML, never gated. Verified empirically first: Chrome scroll restoration succeeds *while* `overflow: hidden` is applied from document start, so locking a reload cannot trap or displace a restored reader.

## Results (all on the final build; scripts/results in `docs/evidence/milestone-10/`)

- **Matrix (59/60)** — fresh, returning-new-tab, same-tab refresh-from-top, and 3× consecutive refresh, on **both production preview (4173) and dev server (5173)**: gate present during prep, wheel/Space/ArrowDown/PageDown held (y=0, no dive timeline, pin not installed), lock held through the 950 ms reveal, unlock only at interactive, full forward dive (p=1.0) and reverse (p=0.0) after. Reduced-motion + returning: immediate static fallback, unlocked, scrolling free at once (accessibility exception). Mid-page reload: not locked, position preserved (y=3000 exact), free scrolling immediately.
- **Recordings**: `recordings/PROD-fresh.webm` (full gated visit → unlock → dive) and `recordings/PROD-refresh-x3.webm` (three consecutive refreshes, each attempting premature scroll — all held).
- **Regression: original acceptance suite 47/47** after the change (deep link, skip, WebGL failure, hung-chunk timeout, weak GPU, reduced motion, restoration, forward/reverse dive all intact).
- **Cross-engine**: Firefox gated returning visit full pass; Firefox mid-page reload restores under the lock (y=2500). WebKit gated returning visit full pass.

## Remaining limitations

- **Headless WebKit does not perform reload scroll restoration at all** (lands at top) — proven independent of the lock by neutralizing the lock and reproducing the identical loss. Gating behavior in WebKit is correct; position restoration on reload is an engine/environment limitation to re-check on physical Safari.
- Same as before: physical Safari/low-end GPUs and real assistive technology remain unverified.
