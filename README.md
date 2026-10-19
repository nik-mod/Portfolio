# Creative Developer Portfolio

Milestone 05 adds a reversible, pinned screen dive to Nika Modebadze's procedural React Three Fiber laptop. The Machine Editorial composition, personal identity, NM / DEV screen branding, and existing GSAP/Lenis lifecycle remain in place.

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

On eligible fine-pointer desktops, a single GSAP ticker calls Lenis with milliseconds; Lenis updates ScrollTrigger. There is no second RAF loop or custom scroll container. Touch devices retain native scrolling. Milestone 05 adds the single Hero pin described below.

Hero typography, viewport and red hinge enter in a short coordinated timeline. About copy/capabilities and Contact reveal as they enter, reversing when scrolling above their start. Project previews use restrained CSS hover feedback. Works is owned by the screen-dive handoff to prevent independent row reveals from moving glyphs during the texture-to-HTML blend.

Reduced motion disables GSAP effects and Lenis entirely. Coarse-pointer/mobile devices receive shorter page reveals, native touch scrolling and adapted cinematic pacing. Conservative hardware hints simplify WebGL detail; save-data and very low memory use the direct-access fallback.

`createScrollProgress(element, callback)` is the future scene adapter. It reports clamped 0–1 progress in either direction and returns a disposer. A future React effect can feed it into a scene ref without rerendering on each scroll update. It is not attached to a scene yet; the future consumer should provide a static pose under reduced motion.

## Milestone 04 laptop

The laptop is authored entirely in code: there is no third-party GLB, external image, font, HDR environment, or model license dependency. `LaptopModel.tsx` assembles a beveled metallic chassis, separate hinge saddles/barrels, instanced keycaps with local legend artwork, speaker perforations, side ports, a recessed trackpad, and a separately pivoted thin-bezel display. `RoundedPlate.tsx` provides thin extruded surfaces with independent footprint rounding and edge bevels. `laptop-surfaces.ts` draws original screen and key artwork locally.

`ArchitecturalViewport` preserves the existing CSS study beneath the lazy-loaded canvas. It starts loading when near the viewport. Loading, unavailable WebGL, context loss, and chunk/render errors keep the HTML/CSS fallback available. Data-saving connections and devices reporting 2 GB memory or less use the fallback without requesting the scene. The scene is decorative and does not intercept pointer/touch navigation.

`LaptopScene` uses `frameloop="demand"`, a locally captured one-frame studio environment, capped DPR (1–1.5 desktop; 1 for coarse-pointer/lower-power devices), and no post-processing, controls, or idle animation. Compact devices omit speaker detail and real-time shadows. React Three Fiber owns scene/renderer disposal; explicitly created plate/key geometries and canvas textures also have effect cleanup. Context-loss listeners are detached on teardown.

`ArchitecturalViewport` accepts an optional `controllerRef` implementing `LaptopController` from `laptop-pose.ts`. `getPose()` returns an independent snapshot. `setPose(partialPose)` synchronously changes model position, Euler rotation, scale, display opening angle, key light, screen-preview mix, and camera position/target, then requests a frame. Opening uses radians: zero is closed, PI/2 upright, capped at 2.4. The display rotates around its rear X-axis hinge while the base stays fixed. `getScreenFrame()` reads the actual display's world center, normal and dimensions. Controlled poses survive canvas resizes; `resetPose()` returns ownership to responsive studio framing. The scene disposes its own generated textures.

## Milestone 05 screen dive

`useScreenDive` creates one normalized GSAP timeline with a single ScrollTrigger pin after the first successful WebGL draw. Its phases are Reveal (0–20%), Open (20–45%), Align (45–65%), Dive (65–90%), and Enter (90–100%). Pure interpolation drives the body and real hinge. The camera aligns to the display's measured world-space normal, then approaches continuously until every screen border is outside the viewport. Geometry is never stretched, and the camera does not cross the screen's near plane.

The HTML aperture expands over a fixed-resolution canvas. An off-axis perspective matrix maps the scene into that aperture without stretching geometry or triggering React/R3F resize updates on every frame. Only an actual viewport resize changes canvas resolution. Desktop uses 3.6 Hero heights of scroll; tablet uses 2.8 and mobile 2.4. The pinned mobile composition keeps name, object, descriptor and entry link within the available height.

The initial screen uses shared exhibition-index data from `data/projects.ts`. Once per layout size, `capture-portfolio.ts` makes an origin-clean local raster of the real Selected Works section using inline computed styles and the existing local fonts. A separate display surface blends in that capture during alignment. It is cropped for the terminal camera view, capped at 2048 pixels, and disposed on replacement/unmount. This is not a second DOM portfolio. If a browser declines SVG/foreignObject capture, the shared-content preview still leads into accessible HTML.

The actual `.portfolio-content` stays in document order exactly once. Near completion it shares the screen's projected scale while blending into view. Its negative overlap equals the Hero height; its translation reaches zero at the pin endpoint, so normal scrolling continues without a duplicate section or empty spacer. Scrolling backward reverses the same timeline. No React state updates run on scroll/render frames, no second Lenis instance exists, and idle WebGL rendering stops.

The skip link targets Selected Works. Section links resolve against the real pin start/end before returning to normal anchor positioning, and keyboard focus can complete the sequence immediately. Opacity never removes the content from screen readers. Reduced motion, failed WebGL/chunk loads, context loss, save-data and the low-memory fallback have direct section access without the pin. Cleanup removes the timeline, pin, temporary styles and scoped anchor/focus listeners, resets the studio pose, and preserves reading position when a live fallback is activated.

Verification scripts/screenshots are kept outside the source tree in this chat's visualization directory. Browser validation covers forward/reverse sample poses, screen coverage, release continuity, demand rendering, resize/refresh, anchors, keyboard skip/focus, live reduced-motion changes, load/context failures, and React/GPU teardown. Chrome emulation does not establish real-device frame rates or cross-browser SVG-capture behavior.

Deferred: real case studies and contact details, and Milestone 06 features.
