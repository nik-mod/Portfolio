# Milestone 10.3 — Cinematic bug recovery & premium responsive refinement

Date: 2026-10-20. Trigger: the actual user recording (localhost:5174 dev server) showed animation and visual defects that automated QA had passed. Every defect below was reproduced with instrumented browser runs before fixing, and re-verified after. No commit, push or deployment.

## 1. Reproduced defects

| # | Defect (user-visible) | Reproduced by |
| --- | --- | --- |
| D1 | **NM/01 scan line frozen on refresh.** The red scanning line sat dead at the top edge of the boot frame on every repeat visit. | Sampling `.nm-boot-scan` position on returning refreshes: 14/14 samples at y=203.4, `animation-name: none`, on both the production preview and dev server 5174. |
| D2 | **Doubled laptop-screen content mid-dive.** During the pinned dive the laptop display showed "SELECTED WORKS" and the Aurel project twice at different scales. | Frame captures at p≈0.62 on live scrolling *and* on restored sessions — identical doubling (the user's recording showed the same signature). |
| D3 | **Boot sheet floating over restored content.** Reloading mid-document showed the NM/01 annotations fixed on screen over the reading content until the scene readied. | Reload at y=1800 with a delayed scene: sheet opacity 1.0 at 3.7 s. |
| D4 | **Reading position lost on mid-document reload.** The restored offset never returned (y=0). | Instrumented trace: reload from y=4200 with a delayed scene → y stayed 0 through the entire preparation window. |
| D5 | **Programmatic/native scrolls overridden by Lenis.** A nav click or keyboard End issued while a wheel animation was pending was dragged back to the wheel target. | Wheel ×3 then jump to bottom → y snapped back to 2698 (the wheel target) and stuck. |
| D6 | **BAY—01 overlapping the X calibration label at 320 px.** | 320×568 hero screenshot: the labels collide. |
| D7 | **Back-after-hash-nav lost the reading position.** Going back from an in-page anchor landed at the anchor's offset instead of where the reader was. | Stress scenario 9: goBack → y=5722 instead of 2000. |

**Not reproduced** (reported honestly): the user video's double-laptop boot frame (~3.8 s). Controlled fresh-visit reveals on production and dev, and reload-from-top reveals, all show the boot sheet covering the crossfade (by design) with an aligned final state — frame captures in `before/DEV-reveal-*.png`, `before/DEV-reload-top-*.png`. The ghost frames in the 10 fps screen recording are consistent with recorder frame blending during fast motion. No fix applied — there is no reproduced defect to fix, and the reveal geometry was verified aligned.

## 2. Root causes

- **D1**: `html[data-nm-boot-mode="quiet"] .nm-boot-scan { animation: none }` — the M10.1 returning-visitor quiet mode deliberately disabled the intro's entrance animations and accidentally killed the loading pulse. Since every refresh is a quiet session, the scan was always frozen on refresh.
- **D2**: the screen has two layers — the baked display artwork (`screen-surface`, emissive) and the captured portfolio texture (`screen-portfolio`, opacity = `previewMix`). The capture's crop is authored for the *final* camera, so at mid-dive opacity (~0.84) the misaligned baked artwork showed through at full brightness.
- **D3/D4**: the boot sheet is `position: fixed` for restoring sessions and stayed visible until scene-ready; and the M10.1 scroll lock (overflow hidden) raced the browser's scroll restoration — when the lock armed before Chrome restored, the restoration was blocked and lost (Chrome clamps/aborts when the not-yet-pinned document is shorter than the saved offset).
- **D5**: Lenis's `onNativeScroll` only syncs when `isScrolling === false | 'native'`; during a smooth wheel animation (`'smooth'`) an external native scroll is ignored and overwritten by the next animation frame.
- **D6**: at ≤400 px the hero scene cell is short enough that `bay-index` (top 11%) lands on the calibration row.
- **D7**: same-document history traversals have no automatic scroll restoration in this flow, and the app's `hashchange` handler scrolled to the hash target on back/forward too.

## 3. Fixes

- **index.html** — quiet mode no longer disables the scan (it gets a slightly slower 1800 ms pulse); only reduced-motion pins it. Restoration reworked to be deterministic instead of racing the browser: `history.scrollRestoration = 'manual'` for reload/back-forward with the offset saved to sessionStorage on `pagehide`. A saved offset > top means a reading entry: no scroll lock at all, the sheet never shows, and a best-effort immediate landing runs while the document grows. A top entry (fresh, returning, or top-position reload) locks from the first frame. The saved offset is applied exactly once the cinematic pin exists; the WebGL-failure path honors it too.
- **src/components/scene/LaptopScene.tsx + LaptopModel.tsx** — the baked artwork now yields against black in sync with `previewMix` (fully dimmed before the capture reaches readable opacity), so the mid-dive screen crossfade can never show two misaligned contents. The pose object and choreography are untouched.
- **src/hooks/usePageMotion.ts + new src/modules/motion/scroll-commands.ts** — all app-driven document scrolls route through Lenis (`scrollTo(target, { immediate: true, force: true })`) so a jump can never lose to a pending wheel animation; a small adoption listener makes external native scrolls (keyboard PageDown/End, find-in-page) win as well.
- **src/hooks/useScreenDive.ts** — applies the saved offset after the pin installs (replacing the clamp heuristic for the boot-script path); history entries are tagged with their reading offset on anchor navigation and back/forward traversals restore it instead of re-navigating to the hash.
- **src/styles/globals.css** — scoped `@media (max-width: 400px)` drops BAY—01 below the calibration row.

## 4. Verification (all on the final build)

- **Boot-gate regression: 47/47** (M10 acceptance suite) and **returning/refresh matrix: 60/60** (fresh, returning-new-tab, same-tab refresh, 3× consecutive refresh, reduced-motion, mid-page reload, deep links — on production preview and dev server, Chrome/Firefox/WebKit). The previously failing WebKit mid-page restoration now passes via the deterministic manual restoration.
- **Scan animation**: 14/14 sampled positions distinct on refresh in quiet mode, both servers (`nm103-after.js`).
- **Screen content**: mid-dive frames at p 0.53/0.62/0.72 show a single coherent screen (`after/screen-middive-*.png`).
- **Restoration**: mid-dive reload → exact offset (y=1800, 2400), dive continuing (p=0.83), no sheet, unlocked.
- **Choreography stress: 10/10** — slow-scroll progress tracking (max deviation 0.000), half-stop pose hold, fast direction changes, fast full dive + handoff, exact full reverse, mid-pin resize (no overflow), same-document back/forward (y=2000 exact), mobile touch forward/reverse, zero page errors. Recordings: `recordings/stress-desktop-dive.webm`, `stress-mobile-dive.webm`, `m103-refresh-scan-dive.webm` (refresh → scan animating → lock held → dive), `m103-middive-reload-restore.webm`.
- **Responsive**: 9 required viewports + 560/821 breakpoint edges × hero/works/about/contact/footer captured and visually reviewed. One defect (D6) found and fixed with a re-captured proof. 320/430/560/768/1024 heroes, works, contact reviewed frame-by-frame; typography, proportions, spacing hierarchy and image cropping hold the Machine Editorial identity at every width.

## 5. Performance notes

No new rendering loops, dependencies or heavy effects. The artwork dim reuses the existing pose application (one material write per applied pose, GPU-cheap). Startup long tasks and scene-ready timings were not re-measured — no rendering-architecture or loading-path change was made beyond material color writes; the M10 measurements stand.

## 6. Remaining limitations

- The boot-reveal double-laptop frame from the user's recording was not reproducible in controlled conditions (reportedly recorder frame blending; geometry verified aligned). If it recurs on real hardware, capture the machine's own screen recording — that would isolate the compositor from the recorder.
- Very slow scenes can still let a mid-document reload land best-effort rather than exact until the scene readies (Chrome abandons restoration for documents shorter than the saved offset; the pin then corrects exactly).
- Keyboard scrolls during an active wheel animation adopt within ~2 frames (may briefly show the wheel target first).
- Same-document history positions are tagged at click time; scrolling after visiting an anchor and going back twice returns to the tagged offset, not a later position.
- Physical Safari/low-end GPUs and real assistive technology remain unverified (no hardware).

## 7. Verdict

The NM/01 scan visibly animates on every refresh (including returning sessions), the laptop cinematic is coherent and jump-free across slow/fast/reverse/interrupted/refreshed scrolling on capable desktop and mobile emulation, programmatic and keyboard navigation can no longer be overridden mid-animation, and the responsive layouts reviewed at nine widths plus breakpoint edges are intentional and clean. Full regression (47 + 60 + 10) is green. Ready for review.
