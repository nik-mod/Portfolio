# Milestone 09 performance audit

## Measured change

The existing lazy scene imported Drei's general Environment component. Rollup's module graph confirmed unused EXR/RGBE loaders, gain-map decoders and decompression helpers in that chunk, despite this portfolio using no environment files.

`StudioEnvironment` now handles only the existing one-shot procedural cube capture. It retains the same three Lightformers, HalfFloat texture, 128/256 resolution, near/far planes and 0.8 environment intensity. It restores renderer/scene state and disposes the cube target. There is no frame subscription. Laptop geometry, materials, cinematic poses, camera and lighting artwork are unchanged. The desktop production before/after screenshot was pixel-identical.

| Build output | Before | After |
| --- | ---: | ---: |
| Main JS | 382.80 kB / 129.25 gzip | 382.80 kB / 129.25 gzip |
| Lazy laptop JS | 999.88 kB / 274.85 gzip | 942.92 kB / 255.01 gzip |
| CSS | 39.72 kB / 9.98 gzip | unchanged |

Scene reduction: 56.96 kB minified (5.7%), 19.84 kB gzip (7.2%). Tailwind excludes the new docs directory from utility detection so report prose cannot grow the production stylesheet. Authored visual styles were not changed. No chunk-warning limit changes, manual-chunk camouflage, removed detail or additional dependencies. The >500 kB warning remains because the required Three.js renderer and R3F still dominate this lazy chunk.

## Local measurements, not field guarantees

Headless installed Chrome, Vite production preview on loopback, three fresh browser contexts per viewport before/after; browser cache disabled, 4x CPU slowdown, 150 ms latency, 200,000 bytes/s download and 93,750 bytes/s upload. Desktop 1440x900; touch/mobile emulation 375x812; DPR 1. The browser process/GPU shader cache was shared across runs. These are synthetic host-dependent tests, not real mobile hardware or Lighthouse/CrUX results. Initial samples include local CPU/shader warm-up noise; do not interpret small timing differences as causal gains.

| Metric | Desktop before / after | Mobile before / after |
| --- | --- | --- |
| Median observed LCP | 2.096 / 2.072 s | 1.988 / 1.960 s |
| LCP range | 1.948-5.628 / 2.004-2.276 s | 1.928-2.020 / 1.932-1.992 s |
| Maximum sampled interaction duration | 96 / 96 ms | 56 / 56 ms |
| Maximum CLS session | 0 / 0 | 0 / 0 |
| Idle WebGL draw calls over 1.2 s | 0 / 0 | 0 / 0 |

Event Timing samples cover actual About, Contact and Intro clicks after loading. Durations below 16 ms are not reported by the observer. This is **not field INP** and does not establish the 75th-percentile INP target. Median sum of long-task time over 50 ms across load plus navigation was 2338/1435 ms desktop and 1877/1477 ms mobile; this is not Lighthouse TBT. Startup shader/scene work remains a limitation on slow hardware. Field targets remain LCP <=2.5 s, INP <=200 ms, CLS <=0.1, requiring deployed RUM/CrUX and representative devices.

## Motion and AboutSculpture

- One GSAP ticker drives Lenis (`autoRaf:false`); one Lenis scroll subscription synchronizes ScrollTrigger. Touch retains native scroll. No new clocks or global handlers were added.
- AboutSculpture has one scoped transform-only scrub trigger, no WebGL canvas, per-frame React state, RAF loop, pointer listeners or infinite CSS animation.
- A Chrome timeline trace at About recorded **0 Paint events, 0 layouts, 0 style recalculations and 0 sculpture style mutations over a one-second idle sample**. This is an idle check, not a claim that active scrolling never paints.
- Forward/reverse matrices match. Three resize round trips retain the same trigger count, with one sculpture trigger on eligible desktop and none on tablet/reduced-motion. Media cleanup reverts inline transforms. Existing low-memory/save-data static alternatives are retained.
- Cinematic regression passes 0/25/50/75/90/95/100% progression on desktop/tablet/mobile, reverse scroll, real HTML screen capture, screen coverage, release continuity, stable canvas size, refresh, resize, anchors, keyboard skip/focus, deep links, reduced motion, failed chunk/WebGL, save-data and context loss.
- Actual React unmount leaves zero ScrollTriggers and zero R3F roots; owned geometries/materials/textures and the studio cube target dispose. No duplicate pins or console page errors were found.

## Assets, accessibility and production limits

The scene remains dynamically imported at the Hero's intersection boundary. It normally loads on the first fold; this is not a promise to defer all WebGL until interaction. Save-data/very-low-memory fallback avoids its request. Current system font stacks require no font requests or font-display work. No external HDR, model or texture downloads exist. The screen capture is generated once per layout and capped at 2048 pixels; keys and speaker details are already instanced.

The portrait retains responsive 480/896 WebP variants (21,130/57,946 bytes), intrinsic dimensions, async decoding and lazy loading. The 66,053-byte CV stays unchanged and downloads on request. Existing responsive/fallback, keyboard focus, skip link and reduced-motion behavior remain intact; mobile/tablet regression checks find no horizontal overflow. The approved three-column About and compact mobile static artwork are unchanged.

No redesign or speculative image/texture reduction was justified. Hashed JS/CSS should receive immutable caching and compression on the actual production host, with HTML revalidation and an intentional cache policy for stable-name portrait/CV assets; Vite preview is not deployment verification. Cross-browser, real-device GPU behavior, screen-reader audits, field INP and hosting cache/security headers still require deployed testing.

Measurement and regression scripts/JSON/captures are retained outside the repository in this task's visualization directory (`m09-perf.cjs`, `m09-before.json`, `m09-final.json`, `m09-regression.cjs`, `m09-art.cjs`). An intermediate `m09-after.json` run is also retained; the table above uses the final build run.
