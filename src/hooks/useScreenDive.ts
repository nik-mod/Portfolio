import { useLayoutEffect, type RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { studioPose, type LaptopController, type Vector3Tuple } from '../modules/scene/laptop-pose'
import { capturePortfolio } from '../modules/scene/capture-portfolio'

gsap.registerPlugin(ScrollTrigger)

const mix = (a: number, b: number, t: number) => a + (b - a) * t
const vector = (a: Vector3Tuple, b: Vector3Tuple, t: number): Vector3Tuple =>
  [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)]
const phase = (p: number, start: number, end: number) => {
  const t = Math.max(0, Math.min(1, (p - start) / (end - start)))
  return t * t * (3 - 2 * t)
}

/** One scrubbed clock owns the pin, physical pose, camera and HTML handoff. */
export function useScreenDive(
  ref: RefObject<HTMLElement | null>,
  laptop: RefObject<LaptopController | null>,
  available: boolean,
) {
  useLayoutEffect(() => {
    const hero = ref.current
    const controller = laptop.current
    const portfolio = document.querySelector<HTMLElement>('.portfolio-content')
    if (!hero || !controller || !portfolio || !available) return
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
      const restoring = (navigation?.type === 'reload' || navigation?.type === 'back_forward') &&
        (!location.hash || location.hash === '#intro') && document.documentElement.dataset.nmBootInput !== 'true'
      const readingTop = !restoring && window.scrollY > 1 && portfolio.getBoundingClientRect().top < window.innerHeight
        ? portfolio.getBoundingClientRect().top : null
      const anchor = hero.querySelector<HTMLElement>('.hero-scene')!
      const stage = hero.querySelector<HTMLElement>('.scene-stage')!
      const viewport = hero.querySelector<HTMLElement>('.viewport')!
      const title = hero.querySelector<HTMLElement>('.hero-title')!
      const copy = hero.querySelector<HTMLElement>('.hero-copy')!
      const labels = Array.from(hero.querySelectorAll<HTMLElement>('.hero-index, .hero-scroll, .folio-mark'))
      const calibration = Array.from(viewport.querySelectorAll<HTMLElement>('.viewport-grid, .viewport-plane, .crop, .bay-index, .bay-status, .calibration, figcaption'))
      const shade = gsap.utils.interpolate('#252522', '#10100f')
      const playhead = { progress: 0 }
      let width = 0, height = 0, header = 0, distance = 0
      let left = 0, top = 0, sceneWidth = 0, sceneHeight = 0
      let base = studioPose(1.6)
      let captureKey = '', version = 0, disposed = false
      let timeline: gsap.core.Timeline | undefined
      let interactive = false, heldProgress = 0, lastProgress = -1
      let anchorProgress = 0, anchorFraction = 0
      let resizeReading: { element: HTMLElement; gap: number } | null = null
      let resizePhase: number | null = null
      hero.classList.add('is-cinematic')
      hero.dataset.diveState = 'preparing'

      const measure = () => {
        header = document.querySelector('header')!.getBoundingClientRect().height
        height = Math.max(320, window.innerHeight - header)
        hero.style.setProperty('--cinema-height', `${height}px`)
        width = hero.clientWidth
        hero.style.setProperty('--cinema-width', `${width}px`)
        left = anchor.offsetLeft
        top = anchor.offsetTop
        sceneWidth = anchor.offsetWidth
        sceneHeight = anchor.offsetHeight
        distance = height * (width > 820 ? 3.6 : width > 560 ? 2.8 : 2.4)
        base = studioPose(sceneWidth / sceneHeight)
        lastProgress = -1
        if (timeline) {
          portfolio.style.marginTop = `${-height}px`
          portfolio.style.transformOrigin = `50% ${height / 2}px`
        }
        const key = `${width}:${height}`
        if (captureKey !== key) {
          captureKey = key
          const generation = ++version
          const tangent = Math.tan(34 * Math.PI / 360)
          const cover = Math.min(2.69 / (2 * tangent), 4.44 / (2 * tangent * (width / height)))
          const screenHeight = 2.69 / (2 * cover * 0.92 * tangent) * height
          const screenWidth = screenHeight * 4.44 / 2.69
          void capturePortfolio(portfolio.querySelector('#works')!, width, height, {
            left: (width - screenWidth) / 2, top: (height - screenHeight) / 2, width: screenWidth, height: screenHeight,
          }).then(canvas => {
            if (!disposed && generation === version) controller.setScreenPreview(canvas)
          }).catch(() => {
            // A missing required texture must use direct HTML, not arm a dive
            // whose WebGL screen cannot match its destination.
            if (!disposed && generation === version) controller.setScreenPreview(null)
          })
        }
      }

      const render = () => {
        const raw = playhead.progress
        const p = !interactive ? heldProgress : anchorFraction > 0
          ? raw < anchorFraction ? anchorProgress * raw / anchorFraction
            : anchorProgress + (1 - anchorProgress) * (raw - anchorFraction) / (1 - anchorFraction || 1)
          : raw
        if (p === lastProgress) return
        lastProgress = p
        const reveal = phase(p, 0, 0.2)
        const open = phase(p, 0.2, 0.45)
        const align = phase(p, 0.45, 0.65)
        const dive = phase(p, 0.65, 0.9)
        const enter = phase(p, 0.9, 1)
        const expand = phase(p, 0.15, 0.65)
        const fade = 1 - phase(p, 0.12, 0.38)
        hero.style.setProperty('--dive-frame-opacity', `${1 - phase(p, 0.15, 0.4)}`)
        const frameLeft = left * (1 - expand), frameTop = top * (1 - expand)
        const frameWidth = mix(sceneWidth, width, expand), frameHeight = mix(sceneHeight, height, expand)
        hero.style.setProperty('--canvas-left', `${-frameLeft}px`)
        hero.style.setProperty('--canvas-top', `${-frameTop}px`)
        controller.setViewFrame({ left: frameLeft, top: frameTop, width: frameWidth, height: frameHeight, fullWidth: width, fullHeight: height })
        title.style.opacity = `${fade}`
        copy.style.opacity = `${fade}`
        labels.forEach(element => { element.style.opacity = `${1 - phase(p, 0.15, 0.4)}` })
        calibration.forEach(element => { element.style.opacity = `${1 - phase(p, 0.28, 0.62)}` })
        Object.assign(stage.style, {
          left: `${-left * expand}px`, top: `${-top * expand}px`,
          width: `${frameWidth}px`, height: `${frameHeight}px`,
          opacity: `${1 - phase(p, 0.97, 1)}`,
        })
        const cut = 1 - expand
        viewport.style.clipPath = `polygon(${5.5 * cut}% 0,100% 0,100% ${100 - 9 * cut}%,${100 - 6 * cut}% 100%,0 100%,0 ${7 * cut}%)`
        viewport.style.backgroundColor = shade(expand)

        // The lid stays rigid; only its real hinge pivot rotates.
        controller.setPose({
          position: vector([base.position[0] + 0.12 * (1 - reveal), base.position[1] - 0.1 * (1 - reveal), 0], [0, -0.1, 0], Math.max(open, align)),
          rotation: vector([0, base.rotation[1] + 0.08 * (1 - reveal), base.rotation[2]], [0, 0, 0], Math.max(open * 0.4, align)),
          scale: mix(base.scale, 1, align),
          opening: mix(1.28, 1.94, open),
          keyLightIntensity: mix(mix(3.2, 3.8, open), 3.1, align),
          previewMix: phase(p, 0.48, 0.68),
        })
        const screen = controller.getScreenFrame()
        const atDistance = (d: number): Vector3Tuple =>
          screen.center.map((value, i) => value + screen.normal[i] * d) as Vector3Tuple
        // Use the real display dimensions and camera FOV to cover either aspect.
        const tangent = Math.tan(34 * Math.PI / 360)
        const cover = Math.min(screen.height / (2 * tangent), screen.width / (2 * tangent * (width / height)))
        const approach = mix(6.1, cover * mix(0.97, 0.92, enter), dive)
        const openCamera = vector(base.cameraPosition, [3.4, 3.3, 6.4], open)
        controller.setPose({
          cameraPosition: vector(openCamera, atDistance(approach), align),
          cameraTarget: vector(base.cameraTarget, screen.center, align),
        })

        // The sole HTML portfolio occupies the hero's footprint as pinning ends.
        // Opacity never removes content from the accessibility tree.
        if (timeline) {
          const alpha = phase(p, 0.9, 0.985)
          portfolio.style.opacity = `${alpha}`
          const htmlScale = 0.92 / mix(0.97, 0.92, enter)
          portfolio.style.transform = p >= 0.88 && p < 1 ? `translate3d(0,${-(1 - p) * distance}px,0) scale(${htmlScale})` : ''
          portfolio.style.pointerEvents = p >= 0.985 ? '' : 'none'
        }
        hero.dataset.diveProgress = p.toFixed(4)
      }

      const refreshed = (trigger: ScrollTrigger) => {
        const reading = resizeReading, progress = resizePhase
        resizeReading = null
        resizePhase = null
        if (reading?.element.isConnected && timeline) {
          timeline.progress(1)
          lastProgress = -1
          render()
          trigger.scroll(window.scrollY + reading.element.getBoundingClientRect().top - header - reading.gap)
          ScrollTrigger.update()
        } else if (progress !== null && timeline) {
          trigger.scroll(trigger.start + (trigger.end - trigger.start) * progress)
          timeline.progress(progress)
          ScrollTrigger.update()
        }
        render()
      }

      const startTimeline = (preserveEnd = false) => {
        if (timeline || disposed) return
        timeline = gsap.timeline({
          onUpdate: render,
          scrollTrigger: {
            id: 'screen-dive', trigger: hero, pin: true, pinSpacing: true,
            start: () => `top top+=${header}`,
            end: () => `+=${distance}`,
            scrub: true, invalidateOnRefresh: true, refreshPriority: 1,
            onRefreshInit: measure,
            onRefresh: refreshed,
          },
        }).to(playhead, { progress: 1, duration: 1, ease: 'none' })
        measure()
        ScrollTrigger.sort()
        // Native restoration clamps an end-of-document position against the
        // unpinned (shorter) page before this pin adds its spacing back.
        const clampedEnd = preserveEnd &&
          Math.abs(window.scrollY - (document.documentElement.scrollHeight - window.innerHeight)) < 2
        ScrollTrigger.refresh()
        if (clampedEnd) window.scrollTo(0, document.documentElement.scrollHeight - window.innerHeight)
        if (!interactive) heldProgress = timeline.scrollTrigger!.progress
        hero.dataset.diveState = interactive ? 'active' : 'restoring'
        lastProgress = -1
        render()
      }

      const finish = () => {
        const trigger = timeline?.scrollTrigger
        if (!trigger || !timeline) return
        // Explicit navigation is a direct-HTML bypass, not cinematic motion.
        if (!interactive) heldProgress = 1
        window.scrollTo({ top: trigger.end, behavior: 'instant' })
        ScrollTrigger.update()
        timeline.progress(1)
        render()
      }
      // Native #intro resolves to the pin's transformed box after release. Use
      // the trigger's real start/end, then return to native section positioning.
      const navigate = (hash: string, focus: boolean) => {
        const target = document.getElementById(hash.slice(1))
        if (!target || (target !== hero && !portfolio.contains(target))) return false
        if (target === hero) {
          if (interactive) startTimeline()
          if (timeline) {
            heldProgress = 0
            anchorFraction = 0
            window.scrollTo({ top: Math.max(0, timeline.scrollTrigger!.start), behavior: 'instant' })
            ScrollTrigger.update()
            timeline.progress(0)
            lastProgress = -1
            render()
          } else target.scrollIntoView({ block: 'start', behavior: 'instant' })
        } else {
          finish()
          // finish already aligns Works with the real header. Native scroll-
          // margin would move a hash-restored mobile view back into the pin.
          if (!timeline || target.id !== 'works') target.scrollIntoView({ block: 'start', behavior: 'instant' })
          ScrollTrigger.update()
        }
        if (focus) target.focus({ preventScroll: true })
        return true
      }
      const anchorClick = (event: MouseEvent) => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return
        const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href^="#"]') : null
        const hash = link?.getAttribute('href')
        if (!hash || !navigate(hash, true)) return
        event.preventDefault()
        if (location.hash !== hash) history.pushState(null, '', hash)
      }
      const hashChanged = () => { navigate(location.hash, false) }

      const focusPortfolio = (event: FocusEvent) => {
        if (event.target instanceof HTMLElement && portfolio.contains(event.target) && timeline && timeline.scrollTrigger!.progress < 1) {
          finish()
          if (event.target.id !== 'works') event.target.scrollIntoView({ block: 'nearest', behavior: 'instant' })
          ScrollTrigger.update()
        }
      }
      document.addEventListener('focusin', focusPortfolio)
      document.addEventListener('click', anchorClick)
      window.addEventListener('hashchange', hashChanged)
      const activate = () => {
        if (interactive || disposed) return
        // Preserve the already-presented pose if a restored visitor moved while
        // the reveal was running; the unchanged phase curves stay reversible.
        if (timeline) {
          anchorProgress = heldProgress
          anchorFraction = timeline.scrollTrigger!.progress
        }
        interactive = true
        const atIntro = window.scrollY <= Math.max(1, hero.offsetTop - header + 1)
        if (!timeline && atIntro && (!location.hash || location.hash === '#intro') && !portfolio.contains(document.activeElement)) startTimeline()
        hero.dataset.diveState = timeline ? 'active' : 'direct'
        lastProgress = -1
        render()
      }
      const resizePreparation = () => {
        if (!timeline) { measure(); render(); return }
        if (window.innerWidth === width && Math.abs(window.innerHeight - height - header) < 1) return
        if (resizeReading || resizePhase !== null) return
        if (lastProgress >= .985) {
          const element = Array.from(portfolio.querySelectorAll<HTMLElement>(':scope > .section'))
            .find(section => section.getBoundingClientRect().bottom > header + 1)
          if (element) resizeReading = { element, gap: element.getBoundingClientRect().top - header }
        } else resizePhase = timeline.scrollTrigger!.progress
      }
      hero.addEventListener('nm:scene-interactive', activate)
      window.addEventListener('resize', resizePreparation)
      measure()
      render()
      // Only native restoration reserves pin space before presentation. Its
      // initial pose is held, never scrubbed, until the verified reveal finishes.
      if (restoring) startTimeline(true)
      if (viewport.dataset.interactionReady === 'true') activate()
      if (location.hash && (location.hash !== '#intro' || (!restoring && window.scrollY <= 1))) navigate(location.hash, false)
      else if (readingTop !== null && !timeline) window.scrollBy(0, portfolio.getBoundingClientRect().top - readingTop)

      return () => {
        disposed = true
        const trigger = timeline?.scrollTrigger
        const current = window.scrollY
        const wasInside = trigger && current > trigger.start && current <= trigger.end
        const before = portfolio.getBoundingClientRect().top
        timeline?.revert()
        document.removeEventListener('focusin', focusPortfolio)
        document.removeEventListener('click', anchorClick)
        window.removeEventListener('hashchange', hashChanged)
        hero.removeEventListener('nm:scene-interactive', activate)
        window.removeEventListener('resize', resizePreparation)
        hero.classList.remove('is-cinematic')
        hero.style.removeProperty('--cinema-height')
        hero.style.removeProperty('--cinema-width')
        hero.style.removeProperty('--canvas-left')
        hero.style.removeProperty('--canvas-top')
        hero.style.removeProperty('--dive-frame-opacity')
        delete hero.dataset.diveProgress
        delete hero.dataset.diveState
        stage.removeAttribute('style')
        viewport.style.removeProperty('clip-path')
        viewport.style.removeProperty('background-color')
        ;[title, copy, ...labels, ...calibration].forEach(element => element.style.removeProperty('opacity'))
        ;['opacity', 'transform', 'transform-origin', 'pointer-events', 'margin-top'].forEach(property => portfolio.style.removeProperty(property))
        controller.resetPose()
        // Media changes/context loss preserve reading position; unmount does not scroll.
        queueMicrotask(() => {
          if (!hero.isConnected || !portfolio.isConnected) return
          if (wasInside) portfolio.scrollIntoView({ block: 'start', behavior: 'instant' })
          else if ((trigger && current > trigger.end) || (!trigger && current > 0 && before < window.innerHeight)) {
            window.scrollBy(0, portfolio.getBoundingClientRect().top - before)
          }
          ScrollTrigger.refresh()
        })
      }
    }, hero)
    return () => media.revert()
  }, [available, laptop, ref])
}
