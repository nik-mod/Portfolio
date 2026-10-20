import { calibrationMarks } from '../../modules/scene/scene-contract'
import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState, type Ref } from 'react'
import type { LaptopController } from '../../modules/scene/laptop-pose'
import { SceneBoundary } from './SceneBoundary'

const LaptopScene = lazy(() => import('./LaptopScene'))

export function ArchitecturalViewport({ controllerRef, onAvailability }: {
  controllerRef?: Ref<LaptopController>
  onAvailability?: (ready: boolean) => void
}) {
  const figure = useRef<HTMLElement>(null)
  const [enabled, setEnabled] = useState(false)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [lowPower, setLowPower] = useState(false)
  // Controller availability and visual presentation are separate milestones.
  const onReady = useCallback(() => { onAvailability?.(true) }, [onAvailability])
  const onPresented = useCallback(() => { setReady(true) }, [])
  const onFailure = useCallback(() => { setReady(false); setFailed(true); onAvailability?.(false) }, [onAvailability])

  useEffect(() => {
    const device = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || device.connection?.saveData ||
      (device.deviceMemory !== undefined && device.deviceMemory <= 2) ||
      (device.hardwareConcurrency > 0 && device.hardwareConcurrency <= 2)) {
      let cancelled = false
      queueMicrotask(() => { if (!cancelled) onFailure() })
      return () => { cancelled = true }
    }
    const limited = (device.deviceMemory !== undefined && device.deviceMemory <= 4) ||
      (device.hardwareConcurrency > 0 && device.hardwareConcurrency <= 4) || matchMedia('(pointer: coarse)').matches
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    // A restored unpinned document can place the Hero outside the observer.
    // Recreate its pin before presenting a restored, hash-free scroll position.
    const restoring = (!location.hash || location.hash === '#intro') && (navigation?.type === 'reload' || navigation?.type === 'back_forward')
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting || restoring) {
        setLowPower(limited)
        setEnabled(true)
        observer.disconnect()
      }
    }, { rootMargin: '200px' })
    if (figure.current) observer.observe(figure.current)
    return () => observer.disconnect()
  }, [onFailure])

  useEffect(() => {
    if (!enabled || ready || failed) return
    // A rejected import/context must never leave an indefinite loading bay.
    const deadline = window.setTimeout(onFailure, 20000)
    return () => window.clearTimeout(deadline)
  }, [enabled, ready, failed, onFailure])

  useLayoutEffect(() => {
    if (failed) {
      document.documentElement.dataset.nmGate = 'fallback'
      // The dive never starts on this path; honor the boot sheet's saved
      // reading position directly.
      const savedScroll = Number(document.documentElement.dataset.nmSavedScroll ?? 0)
      if (savedScroll > 1) {
        delete document.documentElement.dataset.nmSavedScroll
        window.scrollTo(0, savedScroll)
      }
      document.dispatchEvent(new Event('nm:scene-ready'))
      return
    }
    if (!ready || !figure.current) return
    const element = figure.current
    let disposed = false
    document.documentElement.dataset.nmGate = 'handoff'
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    const progressed = Number(figure.current.closest<HTMLElement>('.hero')?.dataset.diveProgress ?? 0) > .02
    const canvas = figure.current.querySelector('.laptop-canvas')!
    const poster = figure.current.querySelector('.scene-poster')!
    // A bounded browser-composited crossfade, not a second JS animation loop.
    // Explicit keyframes also avoid warm-cache CSS-transition batching races.
    const options = { duration: 950, easing: 'cubic-bezier(.37,0,.63,1)' }
    const animations = reduced.matches || progressed ? [] : [
      canvas.animate([{ opacity: 0 }, { opacity: 1 }], options),
      // Hold the matching opaque image underneath; fading both transparent
      // surfaces together would make the object dip in brightness halfway.
      poster.animate([{ opacity: 1 }, { opacity: 1 }], options),
    ]
    // This event follows correct pose, screen capture, async shader preparation
    // and two GPU-completed draws. It never makes an unready canvas visible.
    document.dispatchEvent(new Event('nm:scene-ready'))
    const activate = () => {
      if (disposed) return
      element.dataset.interactionReady = 'true'
      document.documentElement.dataset.nmGate = 'active'
      element.dispatchEvent(new Event('nm:scene-interactive', { bubbles: true }))
    }
    // Finishing an actual animation is presentation readiness, not an arbitrary
    // loading timer. This owner alone releases the cinematic interaction gate.
    const bootAnimations = document.getElementById('nm-boot')?.getAnimations() ?? []
    void Promise.allSettled([...animations, ...bootAnimations].map(animation => animation.finished)).then(activate)
    // A preference change during the entrance must stop motion, not replay it.
    const finish = () => {
      if (!reduced.matches) return
      animations.forEach(animation => animation.cancel())
      activate()
    }
    reduced.addEventListener('change', finish)
    return () => {
      disposed = true
      delete element.dataset.interactionReady
      reduced.removeEventListener('change', finish)
      animations.forEach(animation => animation.cancel())
    }
  }, [ready, failed])

  return (
    <figure ref={figure} className="viewport" data-scene-ready={ready} data-scene-state={failed ? 'fallback' : ready ? 'ready' : 'loading'} aria-label="Sculptural laptop in a graphite studio">
      <div className="scene-loading" aria-hidden="true" />
      <div className="viewport-grid" aria-hidden="true" />
      <div className="viewport-plane plane-a" aria-hidden="true" />
      <div className="viewport-plane plane-b" aria-hidden="true" />
      <picture className="scene-poster" aria-hidden="true">
        <source media="(max-width: 560px)" srcSet="/images/laptop-intro-mobile.webp" />
        <source media="(max-width: 820px)" srcSet="/images/laptop-intro-tablet.webp" />
        <img src="/images/laptop-intro-desktop.webp" width="1004" height="669" alt="" fetchPriority="high" decoding="async" />
      </picture>
      {failed && <div className="scene-fallback"><span>Object / 01 — Static preview</span><p>The interactive view is unavailable.<br />The portfolio remains fully accessible.</p><a href="#works">Explore selected works <span aria-hidden="true">↗</span></a></div>}
      {enabled && !failed && <div className="laptop-canvas" aria-hidden="true">
        <SceneBoundary onFailure={onFailure}>
          <Suspense fallback={null}>
            <LaptopScene onReady={onReady} onPresented={onPresented} onFailure={onFailure} controllerRef={controllerRef} lowPower={lowPower} />
          </Suspense>
        </SceneBoundary>
      </div>}
      <div className="crop crop-nw" aria-hidden="true" />
      <div className="crop crop-se" aria-hidden="true" />
      <span className="bay-index" aria-hidden="true">BAY—01</span>
      <span className="bay-status" aria-hidden="true">FORM / FUNCTION<br />INDUSTRIAL STUDY</span>
      {calibrationMarks.map((mark) => (
        <span className={`calibration ${mark.position}`} key={mark.position}>{mark.label}</span>
      ))}
      <figcaption>Object 01 — dimensional study</figcaption>
    </figure>
  )
}
