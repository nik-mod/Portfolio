import { useLayoutEffect, type RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

gsap.registerPlugin(ScrollTrigger)

/** Owns page motion, media-query changes, and the single smooth-scroll clock. */
export function usePageMotion(scope: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    if (!scope.current) return
    const device = navigator as Navigator & {
      deviceMemory?: number
      connection?: { saveData?: boolean }
    }
    const limited = device.connection?.saveData ||
      (device.deviceMemory !== undefined && device.deviceMemory <= 4) ||
      (device.hardwareConcurrency > 0 && device.hardwareConcurrency <= 4)
    const media = gsap.matchMedia()

    media.add({
      all: '(min-width: 0px)',
      reduced: '(prefers-reduced-motion: reduce)',
      desktop: '(min-width: 821px) and (hover: hover) and (pointer: fine)',
    }, (context) => {
      if (context.conditions?.reduced) return
      const full = Boolean(context.conditions?.desktop && !limited)
      const select = gsap.utils.selector(scope.current)
      let lenis: Lenis | undefined
      const tick = (seconds: number) => lenis?.raf(seconds * 1000)

      if (full) {
        lenis = new Lenis({ autoRaf: false, lerp: 0.12, syncTouch: false })
        lenis.on('scroll', ScrollTrigger.update)
        gsap.ticker.add(tick)
      }

      // No CSS-hidden initial state: content remains available if JS fails.
      // The critical NM/01 identity sheet owns the first impression. Its type
      // registers directly onto this final Hero, without replaying an entrance.
      if (!document.documentElement.dataset.nmBoot) {
        gsap.timeline({ defaults: { ease: 'power3.out', duration: full ? 0.9 : 0.4 } })
          .from(select('.hero-index'), { opacity: 0, y: 8 })
          .from(select('.hero-title > span'), { opacity: 0, yPercent: full ? 28 : 10, stagger: 0.13 }, 0.08)
          .from(select('.hero-copy, .hero-scroll'), { opacity: 0, y: 10, stagger: 0.08 }, 0.48)
      }

      const reveal = (trigger: Element, targets: Element[]) => {
        gsap.from(targets, {
          opacity: 0, y: full ? 22 : 10, duration: full ? 0.7 : 0.35,
          stagger: full ? 0.09 : 0.04, ease: 'power2.out',
          scrollTrigger: {
            trigger, start: 'top 90%',
            toggleActions: 'play none none reverse',
          },
        })
      }

      // Works belongs to the screen-dive handoff; separate reveals would shift
      // its glyphs while the matching screen texture is fading into the HTML.
      select('.section:not(.works)').forEach((section: HTMLElement) => {
        reveal(section, Array.from(section.querySelectorAll('.section-marker, .section-intro, .about-heading, .contact-copy')))
      })
      select('.about-copy, .capability-list, .contact-action').forEach((block: HTMLElement) => {
        reveal(block, Array.from(block.children))
      })

      if (full) {
        gsap.fromTo(select('.about-heading h2'), { y: 8 }, {
          y: -8, ease: 'none',
          scrollTrigger: { trigger: select('.about')[0], start: 'top bottom', end: 'bottom top', scrub: 0.5 },
        })
      }

      // Refresh after local fonts settle; cancelled on StrictMode teardown/unmount.
      let disposed = false
      void document.fonts.ready.then(() => {
        if (!disposed) {
          lenis?.resize()
          ScrollTrigger.refresh()
        }
      })
      return () => {
        disposed = true
        gsap.ticker.remove(tick)
        lenis?.off('scroll', ScrollTrigger.update)
        lenis?.destroy()
      }
    }, scope)

    // Reverts inline styles, timelines and triggers, including media-query changes.
    return () => media.revert()
  }, [scope])
}
