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

    const media = gsap.matchMedia()
    media.add('(min-width: 1101px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(element.querySelector('.joint-motion'), {
        rotationY: -12, rotationX: 3, y: 14,
      }, {
        rotationY: 9, rotationX: -3, y: -14, ease: 'none',
        scrollTrigger: {
          id: 'about-code-joint', trigger: element,
          start: 'top bottom', end: 'bottom top', scrub: true,
          invalidateOnRefresh: true,
        },
      })
    }, scope)
    return () => media.revert()
  }, [])

  return (
    <figure className="about-art" ref={scope}>
      <div className="joint-stage" aria-hidden="true">
        <span className="joint-axis joint-axis-x" /><span className="joint-axis joint-axis-y" />
        <span className="joint-register">+</span><span className="joint-register joint-register-end">+</span>
        <div className="joint-shadow" />
        <div className="joint-scale"><div className="joint-motion"><div className="joint-sculpture">
          {beams.map(beam => (
            <div className={`joint-beam ${beam.name}`} key={beam.name} style={{
              '--beam-w': `${beam.w}px`, '--beam-h': `${beam.h}px`, '--beam-d': `${beam.d}px`,
              transform: `translate3d(${beam.x}px, ${beam.y}px, ${beam.z}px)`,
            } as CSSProperties}>
              <i className="beam-front" /><i className="beam-back" /><i className="beam-left" />
              <i className="beam-right" /><i className="beam-top" /><i className="beam-bottom" />
            </div>
          ))}
        </div></div></div>
      </div>
      <figcaption><span>Study 03 / Code joint</span><span>Design × engineering</span></figcaption>
    </figure>
  )
}
