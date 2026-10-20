# Milestone 09.8 — remaining readiness audit

Date: 2026-10-20. Scope: adaptive performance, loading, responsive layout,
accessibility, and visual/cinematic stability. The separate original 09.8 prompt
was not present in this chat; this covers the explicitly listed continuation
requirements. The completed AboutSculpture was not changed or re-choreographed.

## Verified defect and focused fix

The laptop entrance read reduced motion only when its tween was created. Changing
the preference during the 950 ms fade left that tween running. Actual Chrome
samples before the fix: opacity 0.4868 before the change, 0.5446 afterward, with
the brightness filter still active.

`ArchitecturalViewport.tsx` now subscribes to that preference for the lifetime of
the ready scene. Enabling reduced motion finishes and kills the entrance tween,
which also clears its filter. Disabling reduced motion does not replay it. The
listener is removed on failure/unmount along with existing GSAP context cleanup.
Post-fix sample: 0.4835 before, 1 / filter none within the 50 ms verification
window after changing the preference; switching back remained at 1. The regular
950 ms reveal, first-frame gate, geometry, poses, and screen-dive timeline are
unchanged. No new animation clock, dependency, or visual asset.

## Production measurements

Installed headless Chrome, Vite production preview on loopback port 4174,
1440x900 desktop and 375x812 touch/mobile, DPR 1, three fresh contexts per device
per build. Cache disabled; 4x CPU slowdown; 150 ms network latency; 200,000 B/s
download and 93,750 B/s upload. One shared browser/GPU process per six-run set.
The production server does not represent deployed CDN compression/caching.

| Metric | Before preference fix | Final build |
| --- | --- | --- |
| Desktop LCP, median (range) | 2.544 s (2.408–6.116) | 2.512 s (2.324–2.564) |
| Mobile LCP, median (range) | 2.580 s (2.392–2.648) | 2.384 s (2.376–2.404) |
| Maximum sampled interaction, desktop/mobile | 112 / 120 ms | 104 / 56 ms |
| Maximum CLS, either device | 0 | 0 |
| Idle WebGL draws over 1.2 s | 0 | 0 |

Timing differences are normal host/shader warm-up variation, not a claimed
performance gain from the preference-only fix. Interactions were actual About,
Contact, and Intro navigation after scene loading. Event Timing samples are not
field INP and do not cover input during every startup task. Final runs contained
6–7 long tasks; summed excess duration above 50 ms was 2.56–3.50 s across loading
and navigation. This is not Lighthouse TBT. CPU/shader/capture startup work
remains significant under throttling. No field Core Web Vitals guarantee.

Final production bundles (minified / gzip): main 395.11 / 132.32 kB; lazy laptop
943.33 / 255.17 kB; CSS 63.77 / 15.00 kB. The fix adds approximately 0.12 kB
minified / 0.03 kB gzip to main. Scene and CSS sizes are unchanged. The existing
>500 kB lazy scene warning remains unsuppressed. Scene imports already use the
targeted Drei Lightformer and one-shot StudioEnvironment rather than a generic
environment loader. No arbitrary chunk splitting or detail reduction was justified.

## Adaptive and loading verification

- Save-data and simulated 2 GB memory: no scene JS request, canvas, or pin; visible
  honest fallback and direct Selected Works navigation.
- Simulated 4 GB memory, two CPU cores, and coarse/touch pointer: actual renderer
  pixel ratio 1, key-light shadow casting disabled, all six environment faces
  128px. Low-memory/low-core/touch modes did not enable Lenis smooth scrolling.
- Normal cold/warm loading: first presented frame controlled at lid rotation
  -1.28, opacity starts near zero and reaches 1 at approximately 950 ms, filter
  clears. Restored mid-dive first/current lid rotations both -1.94. No wireframe
  DOM. Existing enabled-scene 20-second failure deadline remains in place.
- WebGL unsupported, scene import failure, save-data, and context loss restore
  direct readable HTML and remove the pin. Reduced motion has direct portfolio
  access without a mandatory cinematic sequence.
- One existing GSAP ticker subscription drives Lenis with autoRaf false. Demand
  rendering is retained. Idle frame/draw counters stop. Scroll does not resize
  the rendering canvas; refresh/resize leave one cinematic trigger and pin.

## Responsive, accessibility, visual, and cinematic checks

- Production widths 320, 375, 640, 768, 1024, 1440, 1920: no horizontal overflow;
  Works/About/Contact/Intro anchors clear the header. Reduced-motion reflow and
  portrait loading verified. Chrome screenshots inspected at narrow mobile and
  intermediate desktop widths; no visual redesign was made.
- Keyboard skip link, Enter/Space disclosure, aria-expanded, CV focus outline,
  dark focus outline on light Contact, semantic main/h1 and image alternatives
  verified. Email and LinkedIn attributes remain correct. This is a focused
  keyboard/semantic review, not a complete WCAG or assistive-technology audit.
- CV returns HTTP 200/application/pdf, starts with %PDF-, is 66,053 bytes, and its
  SHA-256 equals the original public file. No CV content changes. With JavaScript
  disabled, contact and CV links remain available in the existing noscript view.
- Desktop/tablet/mobile cinematic regression: 0/25/50/75/90/95/100% samples,
  camera/hinge reversal, actual HTML texture, full screen coverage, one HTML Works
  section, opacity/handoff alignment, release continuity, stable canvas size,
  refresh, resize, keyboard skip, anchors, deep-link reload, and live media changes
  passed. Final preference fix received a further desktop lifecycle/failure check.
- Actual React unmount removes all ScrollTriggers, pin, and R3F roots; 65/65/61
  scene resources disposed on desktop/tablet/mobile in the full regression.
  No uncaught page errors in normal scenarios. Expected unavailable-WebGL/import
  diagnostics are failure-path conditions, not normal runtime failures.

## Readiness and remaining risks

Functionally ready for staging and real-device acceptance, not a certified field
performance or cross-browser release. Desktop final median LCP is slightly above
the 2.5 s target, and the earlier 6.116 s outlier plus startup long tasks warrant
monitoring. The lazy Three.js/R3F payload remains substantial. Keep representative
low-end Android/iOS GPU testing, Safari/Firefox, real screen readers, deployed
compression/cache/security headers, and field LCP/INP/CLS as release checks. Device
memory/network hints are not universally supported; DPR caps and demand rendering
still apply, but emulation is not proof of real low-end GPU behavior.

Only application change in this continuation: ArchitecturalViewport.tsx. All
other source/public assets, including AboutSculpture, retained their baseline
hashes. Typecheck, lint, and build passed; no commit, push, deployment, or M10 work.

Evidence outside the repository: task visualization directory, including
`m09-m098-current.json`, `m09-m098-final-audit.json`, `m098-audit-quality.json`, and
`m098-audit-cinematic-*` / `m098-audit-about-*` / `m098-audit-contact-*` screenshots.
Playwright audit scripts live in the session temporary m098-audit directory.
