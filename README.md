# Creative Developer Portfolio

Milestone 04 replaces the architectural hero study with an original procedural React Three Fiber laptop. The approved editorial composition and GSAP/Lenis motion remain in place. The real-time scene is static for this milestone; the cinematic scroll sequence is still deferred.

## Setup

```bash
npm install
npm run dev
```

The local development server is available at the URL printed by Vite (usually `http://localhost:5173`).

## Scripts

- `npm run dev` — start the Vite development server
- `npm run typecheck` — run strict TypeScript validation
- `npm run lint` — run ESLint across TypeScript and React source
- `npm run build` — type-check and create a production bundle
- `npm run preview` — preview the production bundle locally

## Architecture

```text
src/
├── app/                 Application composition
├── components/
│   ├── layout/          Persistent shell components
│   ├── scene/           Lightweight visual scene components
│   ├── sections/        Page sections
│   └── ui/              Shared interface primitives
├── data/                Typed static content
├── hooks/               Reusable React behavior
├── modules/
│   ├── motion/          Motion contracts and helpers
│   └── scene/           Scene data contracts for future 3D work
└── styles/              Global design system and responsive rules
```

Tailwind CSS provides foundational theme tokens and remains available for future utility-driven components; the current editorial composition is expressed in a focused global stylesheet to keep its grid and visual logic legible.

## Milestone 03 motion

`usePageMotion` scopes GSAP timelines and ScrollTriggers to the main element with `gsap.matchMedia`. Cleanup reverts animated styles and triggers, removes the ticker callback and Lenis subscription, and destroys Lenis. React StrictMode and live media-query changes use the same teardown path.

On eligible fine-pointer desktops, a single GSAP ticker calls Lenis with milliseconds; Lenis updates ScrollTrigger. There is no second RAF loop, custom scroll container, or pinning. Anchors and keyboard navigation remain native, with CSS scroll offsets for the persistent header. Touch devices retain native scrolling.

Hero typography, viewport and red hinge enter in a short coordinated timeline. Works rows, About copy/capabilities and Contact reveal as they enter, reversing when scrolling above their start. Desktop depth shifts use small scrubbed transforms. Project previews use restrained CSS hover feedback. No animation changes document layout.

Reduced motion disables GSAP effects and Lenis entirely. Coarse-pointer/mobile devices, data-saving connections, and devices reporting at most four CPU threads or 4 GB memory receive short reveals without smoothing or scrubbed effects. These hardware signals are conservative hints, not a device benchmark.

`createScrollProgress(element, callback)` is the future scene adapter. It reports clamped 0–1 progress in either direction and returns a disposer. A future React effect can feed it into a scene ref without rerendering on each scroll update. It is not attached to a scene yet; the future consumer should provide a static pose under reduced motion.

## Milestone 04 laptop

The laptop is authored entirely in code: there is no third-party GLB, external image, font, HDR environment, or model license dependency. `LaptopModel.tsx` assembles a beveled metallic chassis, separate hinge saddles/barrels, instanced keycaps with local legend artwork, speaker perforations, side ports, a recessed trackpad, and a separately pivoted thin-bezel display. `RoundedPlate.tsx` provides thin extruded surfaces with independent footprint rounding and edge bevels. `laptop-surfaces.ts` draws original screen and key artwork locally.

`ArchitecturalViewport` preserves the existing CSS study beneath the lazy-loaded canvas. It starts loading when near the viewport. Loading, unavailable WebGL, context loss, and chunk/render errors keep the HTML/CSS fallback available. Data-saving connections and devices reporting 2 GB memory or less use the fallback without requesting the scene. The scene is decorative and does not intercept pointer/touch navigation.

`LaptopScene` uses `frameloop="demand"`, a locally captured one-frame studio environment, capped DPR (1–1.5 desktop; 1 for coarse-pointer/lower-power devices), and no post-processing, controls, or idle animation. Compact devices omit speaker detail and real-time shadows. React Three Fiber owns scene/renderer disposal; explicitly created plate/key geometries and canvas textures also have effect cleanup. Context-loss listeners are detached on teardown.

`ArchitecturalViewport` accepts an optional `controllerRef` implementing `LaptopController` from `laptop-pose.ts`. `getPose()` returns an independent snapshot. `setPose(partialPose)` synchronously changes model position, Euler rotation, scale, display opening angle, and camera position/target, then requests a frame. Opening uses radians: zero is closed, PI/2 upright, capped at 2.4. The display rotates around its rear X-axis hinge while the base stays fixed. Responsive resize restores the appropriate studio pose. The screen accepts an optional caller-owned Three texture through `LaptopScene`/`LaptopModel`; the scene disposes only its own generated textures.

The Milestone 03 normalized progress adapter remains available but is not connected to the laptop. Future GSAP updates can call `setPose` without per-frame React state or a second render loop.

Deferred: real case studies and contact details, the scroll-driven laptop sequence, interactive screen content, and camera fly-through.
