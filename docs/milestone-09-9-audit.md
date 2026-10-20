# Milestone 09.9 — NM/01 cinematic boot sequence

Date: 2026-10-20. Scope: the opening, its readiness handoff and verified startup/navigation defects. No commit, push, deployment or Milestone 10 work.

## Result

An original identity-registration sheet now paints from critical HTML/CSS before the React/WebGL application: monumental NIKA MODEBADZE typography, an oxblood scanning rule, registration corners and restrained technical annotations. The name is aligned to the approved desktop/mobile Hero. Guide assembly uses transforms/opacity, not a new JavaScript animation loop or canvas.

Actual scene presentation starts the handoff: the existing correct-pose, captured-texture, compiled-shader and GPU-completed-frame gate remains authoritative. There is no minimum intro duration. Technical annotations disappear in the first 160–300 ms; the aligned identity/background transition lasts 850 ms and coordinates with the existing 950 ms poster-backed canvas reveal. The unrelated GSAP Hero entrance does not replay.

Skip, normal scrolling and external keyboard focus can dismiss the sheet without making an uninitialized canvas visible. Focus remains on the exact underlying element, including before React mounts and during the fade. Returning sessions use a quiet, short dismissal. Reduced motion uses a static opening and direct access. Existing weak-device/WebGL-failure static laptop fallbacks remain. The static contact/CV document also works without JavaScript; the boot is hidden by default if its bootstrap cannot execute.

## What the audit found

The remaining large startup tasks are not exclusively shaders. A prior production trace contained a 1,077 ms React scheduler call with 956 ms of initial document layout under 4× CPU throttling. Another recorded startup had an 874 ms main-thread task. The lazy Three/R3F payload, GL/PMREM preparation, texture upload and portfolio capture still contribute work.

Existing cooperative capture batches, asynchronous shader preparation, GPU readiness checks, DPR adaptation and demand rendering were retained, not reimplemented. Canvas DOM layout/style containment is narrowly scoped. No geometry/material/detail reduction, new dependency, heavy filter, particle system or second WebGL canvas was introduced. An experimental two-frame React mount deferral was rejected because it broke native restoration; `main.tsx` is unchanged from the milestone baseline.

Two verified navigation defects were fixed without changing any cinematic phase values, camera poses or handoff thresholds:

- Late pin installation could move an already-reading visitor backward. Initialization now preserves reading position for fresh navigation or genuine early input, distinguished from automatic reload/back-forward restoration. Measured Works position: −145.609 → −145.219 px; focused CV: 357.625 → 358.016 px.
- A redundant native `#works.scrollIntoView()` after the cinematic finish could pull mobile deep links slightly back inside the pin and leave Works non-interactive. Works keeps the finish function’s correct header alignment; About/Contact navigation is unchanged.

## Actual measurements

Installed headless Chrome on Windows, local Vite production preview, desktop 1440×900/DPR 1 and touch mobile emulation 375×812/DPR 3 (existing mobile renderer DPR cap 1). CPU 4× slowdown, 100 ms latency, 400,000 B/s download, 100,000 B/s upload. Cold means browser asset cache disabled, not a power-cycled GPU. Warm means cache-enabled reload in the same context. One browser/GPU process, sequential cases, no screencast in this final timing run.

| Metric | Desktop before | Desktop final cold | Mobile before | Mobile final cold |
| --- | ---: | ---: | ---: | ---: |
| Scene ready | 6,650 ms | 6,023 ms | 5,387 ms | 5,037 ms |
| Longest main-thread task | 1,041 ms | 994 ms | 1,059 ms | 881 ms |
| Sum of task duration exceeding 50 ms | 3,049 ms | 2,781 ms | 2,188 ms | 2,086 ms |
| Largest sampled post-ready RAF gap | 34.5 ms | 14.4 ms | 28.0 ms | 9.5 ms |

Final cold FCP: **556 / 452 ms** desktop/mobile. A prior same-condition mobile trace without the opening recorded **1,949 ms** FCP; that is a separate single-trace comparison, not a controlled median. Final warm FCP: **284 / 348 ms**; scene ready **2,419 / 2,654 ms**. All final cases: CLS **0**, no horizontal overflow or uncaught page errors. No sampled post-ready gap exceeded 33.34 ms.

These are individual host samples, not proven CPU/GPU speed gains. Other iteration runs had slower readiness and higher total blocking than the baseline. Shader/cache/host variation is substantial. This milestone improves early presentation and continuity; it does not establish lower initialization cost, field INP or field Core Web Vitals.

Startup main-thread RAF gaps still reached **1,021 / 897 ms** desktop/mobile. Do not interpret the post-ready result as zero startup dropped frames. Pixel inspection during the recorded 874 ms task showed the red rule moving **y359 → y418**, at 894 → 1,564 ms, both inside that task. Thus compositor motion continued while main-thread RAF was blocked.

## Verification

- Final `npm run typecheck`, `npm run lint`, `npm run build`: passed.
- Independent fresh-browser design/accessibility evaluation: passed on round 2 after fixing obscured external keyboard focus.
- Development desktop/tablet/mobile cinematic regression and production browser checks: phase samples, actual captured screen, camera/hinge reversal, coverage, release continuity, refresh, resize, anchors and deep Works reload passed. No phase/camera choreography changes.
- Cold/warm/hard-refresh first and settled poses matched. Restored mid-dive desktop/mobile lid pose remained −1.94.
- Early Skip, early native scroll with/without `#intro`, pre-ready CV focus, deep About, reduced/live-reduced motion, weak CPU, unavailable WebGL and no-JavaScript access passed.
- Normal idle demand rendering stops. Real unmount regression disposed 65/65/61 desktop/tablet/mobile scene resources and removed the cinematic triggers/roots.
- Protected source/public assets retain their milestone-baseline hashes: laptop model/material definitions/lighting/capture, Selected Works, About/Sculpture, Skills, Contact, Footer, portrait and exact CV PDF. Package manifests are unchanged.

Final minified/gzip sizes: HTML **14.53/4.64 kB**, main **396.90/132.86 kB**, lazy scene **944.69/255.71 kB**, CSS **64.01/14.94 kB**. The existing >500 kB lazy-scene warning remains visible and unsuppressed.

## Changed files

- [index.html](C:/Users/LENOVO_LEGION/OneDrive/Desktop/Portfolio/index.html): critical composition, bounded bootstrap/listeners, accessibility and quiet/reduced behavior.
- [App.tsx](C:/Users/LENOVO_LEGION/OneDrive/Desktop/Portfolio/src/app/App.tsx): mounted signal and early Skip destination/focus resolution.
- [ArchitecturalViewport.tsx](C:/Users/LENOVO_LEGION/OneDrive/Desktop/Portfolio/src/components/scene/ArchitecturalViewport.tsx): existing verified presentation/failure releases the boot.
- [usePageMotion.ts](C:/Users/LENOVO_LEGION/OneDrive/Desktop/Portfolio/src/hooks/usePageMotion.ts): avoids duplicate Hero entrance; existing page/Lenis motion retained.
- [useScreenDive.ts](C:/Users/LENOVO_LEGION/OneDrive/Desktop/Portfolio/src/hooks/useScreenDive.ts): the two initialization/anchor corrections above.
- [globals.css](C:/Users/LENOVO_LEGION/OneDrive/Desktop/Portfolio/src/styles/globals.css): scoped canvas layout/style containment.
- This audit document. Other dirty files were pre-existing work, not new changes attributed to 09.9.

## Evidence and remaining limitations

Evidence folder: `C:/Users/LENOVO_LEGION/.codex/visualizations/2026/10/19/01a153af-fdbc-7701-a97e-d580977e3f41`.

Key files: `nm01-final-independent-metrics.json`, `laptop-m099-baseline-startup.json`, `nm01-final-cold-results.json`, `nm01-mobile-trace.json`, `nm01-compositor-pixels.json`, `nm01-path-results.json`, and `nm01-focus-fixed-results.json`.

Desktop/mobile screenshots include cold 0.5/1.5/3/5-second frames, handoff frames and ready states. Timestamped CDP frame JSONs were encoded into `nm01-{desktop,mobile}-{cold,warm}.webm` at 30 fps, preserving observed frame holds without interpolation or speeding up the recording. Cold clips start at the first received frame and span 6.64 / 5.57 seconds through handoff; they do not fabricate missing initial network frames. Warm clips contain the changed-frame interval (3.12 / 3.25 seconds); separate 5-second snapshots confirm the settled state. These recordings demonstrate visual states/continuity, not a reliable physical-device FPS benchmark.

This is ready for scoped acceptance, not a certified cross-browser/field-performance release. Physical low-end Android/iOS GPUs, Safari/Firefox, real assistive technology and deployed caching/compression/CSP still need validation. Significant initial layout/driver work and the substantial lazy scene payload remain. The opening preserves compositor motion but cannot guarantee responsive main-thread input during every startup task on weak hardware.
