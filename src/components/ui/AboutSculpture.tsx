import { useLayoutEffect, useRef, type CSSProperties } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const beams = [
  { name: 'silver upright', x: -107, y: -107, z: 0, w: 34, h: 214, d: 62 },
  { name: 'silver upper', x: -73, y: -107, z: 0, w: 88, h: 34, d: 62 },
  { name: 'silver lower', x: -73, y: 73, z: 0, w: 88, h: 34, d: 62 },
  { name: 'graphite upright', x: 73, y: -79, z: -37, w: 34, h: 214, d: 62 },
  { name: 'graphite upper', x: -15, y: -79, z: -37, w: 88, h: 34, d: 62 },
  { name: 'graphite lower', x: -15, y: 101, z: -37, w: 88, h: 34, d: 62 },
  { name: 'oxblood key', x: -10, y: -133, z: 35, w: 20, h: 292, d: 20 },
]

/** Architectural bracket study: real CSS planes, no extra WebGL or render loop. */
export function AboutSculpture() {
  const scope = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const element = scope.current
    if (!element) return
    const device = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
    const limited = device.connection?.saveData ||
      (device.deviceMemory !== undefined && device.deviceMemory <= 4) ||
      (device.hardwareConcurrency > 0 && device.hardwareConcurrency <= 4)
    if (limited) return

    const parts = gsap.utils.toArray<HTMLElement>('.joint-part', element)
    const restingStyles = parts.map(part => part.style.cssText)
    const media = gsap.matchMedia()
    media.add('(min-width: 1101px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
      const motion = element.querySelector('.joint-motion')
      // Local assembly axes: the two brackets pull apart around a stationary key.
      // Each part's origin is its physical centre, not the sculpture's shared origin.
      const separated = [
        [-30, 0, 26], [-17, -26, 34], [-17, 26, 34],
        [30, 0, -30], [17, -26, -42], [17, 26, -42], [0, -5, 43],
      ]
      const reconfigured = [
        { x: -33, y: 0, z: 25, rotationY: -12, rotationZ: -3 },
        { x: -22, y: -33, z: 40, rotationY: -20, rotationZ: -23 },
        { x: -22, y: 33, z: 40, rotationY: -20, rotationZ: 23 },
        { x: 33, y: 0, z: -30, rotationY: 12, rotationZ: 3 },
        { x: 22, y: -33, z: -46, rotationY: 20, rotationZ: 23 },
        { x: 22, y: 33, z: -46, rotationY: 20, rotationZ: -23 },
        { x: 0, y: -5, z: 49, rotationY: -8, rotationZ: 0 },
      ]
      let bounds: { left: number; top: number; width: number; height: number }
      const measure = () => {
        const rect = element.getBoundingClientRect()
        bounds = { left: rect.left, top: rect.top + window.scrollY, width: rect.width, height: rect.height }
      }
      const timeline = gsap.timeline({
        scrollTrigger: {
          id: 'about-code-joint', trigger: element,
          start: 'top bottom', end: 'bottom top', scrub: true,
          invalidateOnRefresh: true, onRefresh: measure,
        },
      })
      timeline.fromTo(motion,
        { opacity: 0, z: -56, rotationY: -9, rotationX: 5, scale: .94 },
        { opacity: 1, z: 0, rotationY: 0, rotationX: 0, scale: 1, duration: .18, ease: 'power2.out' }, 0)
        // Slightly retreat as the mechanism opens, preserving the architectural bay.
        .to(motion, { scale: .92, duration: .27, ease: 'sine.inOut' }, .18)
      parts.forEach((part, index) => {
        const [x, y, z] = separated[index]
        const order = index === 6 ? 0 : index + 1
        timeline.to(part, { x, y, z, duration: .23, ease: 'sine.inOut' }, .18 + order * .008)
          .to(part, { ...reconfigured[index], duration: .17, ease: 'sine.inOut' }, .48 + order * .007)
          .to(part, {
            x: 0, y: 0, z: 0, rotationY: 0, rotationZ: 0,
            duration: .18, ease: 'power2.inOut',
          }, .73 + (6 - order) * .007)
      })
      timeline.to(motion, { scale: 1, duration: .22, ease: 'sine.inOut' }, .73)
        .to({}, { duration: .05 }, .95)

      const pointer = element.querySelector('.joint-pointer')
      const turnX = gsap.quickTo(pointer, 'rotationX', { duration: .65, ease: 'power2.out' })
      const turnY = gsap.quickTo(pointer, 'rotationY', { duration: .65, ease: 'power2.out' })
      const move = (event: PointerEvent) => {
        if (event.pointerType === 'touch') return
        const top = bounds.top - window.scrollY
        turnX(gsap.utils.clamp(-2.5,2.5, -((event.clientY-top)/bounds.height-.5)*5))
        turnY(gsap.utils.clamp(-2.5,2.5, ((event.clientX-bounds.left)/bounds.width-.5)*5))
      }
      const reset = () => { turnX(0); turnY(0) }
      measure()
      element.addEventListener('pointerenter', measure)
      element.addEventListener('pointermove', move)
      element.addEventListener('pointerleave', reset)
      return () => {
        element.removeEventListener('pointerenter', measure)
        element.removeEventListener('pointermove', move)
        element.removeEventListener('pointerleave', reset)
        turnX.tween.kill(); turnY.tween.kill()
        // CSSPlugin normalizes 3D origins while animating. Restore the authored
        // origin as well as identity transforms when returning to a static mode.
        parts.forEach((part, index) => { part.style.cssText = restingStyles[index] })
      }
    }, scope)
    return () => media.revert()
  }, [])

  return (
    <figure className="about-art" ref={scope}>
      <div className="joint-stage" aria-hidden="true">
        <span className="joint-axis joint-axis-x" /><span className="joint-axis joint-axis-y" />
        <span className="joint-register">+</span><span className="joint-register joint-register-end">+</span>
        <div className="joint-shadow" />
        <div className="joint-scale"><div className="joint-motion"><div className="joint-pointer"><div className="joint-sculpture">
          {beams.map(beam => (
            <div className="joint-part" key={beam.name} style={{ transformOrigin: `${beam.x + beam.w / 2}px ${beam.y + beam.h / 2}px ${beam.z}px` }}><div className={`joint-beam ${beam.name}`} style={{
              '--beam-w': `${beam.w}px`, '--beam-h': `${beam.h}px`, '--beam-d': `${beam.d}px`,
              transform: `translate3d(${beam.x}px, ${beam.y}px, ${beam.z}px)`,
            } as CSSProperties}>
              <i className="beam-front" /><i className="beam-back" /><i className="beam-left" />
              <i className="beam-right" /><i className="beam-top" /><i className="beam-bottom" />
            </div></div>
          ))}
        </div></div></div></div>
      </div>
      <figcaption><span>Study 03 / Code joint</span><span>Design × engineering</span></figcaption>
    </figure>
  )
}
