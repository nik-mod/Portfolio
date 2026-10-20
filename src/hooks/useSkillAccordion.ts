import { useLayoutEffect, type RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/** Enhance native details without removing their keyboard or no-animation fallback. */
export function useSkillAccordion(scope: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    const cleanups: (() => void)[] = []
    let refreshFrame = 0
    const refresh = () => {
      cancelAnimationFrame(refreshFrame)
      refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh())
    }
    scope.current?.querySelectorAll<HTMLDetailsElement>('.skill-group').forEach(details => {
      const summary = details.querySelector('summary')!
      const content = details.querySelector<HTMLElement>('.skill-content')!
      const list = content.querySelector('ul')!
      let expanded = details.open
      let heightTween: gsap.core.Tween | undefined
      let contentTween: gsap.core.Tween | undefined
      const stop = () => { heightTween?.kill(); contentTween?.kill() }
      const settle = () => {
        stop()
        heightTween = undefined
        contentTween = undefined
        details.open = expanded
        summary.setAttribute('aria-expanded', String(expanded))
        content.inert = !expanded
        gsap.set(content, { clearProps: 'height' })
        gsap.set(list, { clearProps: 'opacity,transform' })
        refresh()
      }
      summary.setAttribute('aria-expanded', String(expanded))
      content.inert = !expanded
      const toggle = (event: MouseEvent) => {
        event.preventDefault() // Native summary synthesizes clicks for Enter and Space.
        expanded = !expanded
        summary.setAttribute('aria-expanded', String(expanded))
        content.inert = !expanded
        if (!expanded && content.contains(document.activeElement)) summary.focus()
        if (reduced.matches) { settle(); return }
        stop()
        const startHeight = details.open ? content.getBoundingClientRect().height : 0
        if (!details.open) {
          details.open = true
          gsap.set(list, { opacity: 0, y: 8 })
        }
        gsap.set(content, { height: startHeight })
        heightTween = gsap.to(content, {
          height: expanded ? list.offsetHeight : 0, duration: .55, ease: 'power3.inOut',
          onComplete: settle,
        })
        contentTween = gsap.to(list, { opacity: expanded ? 1 : 0, y: expanded ? 0 : -6, duration: .5, ease: 'power2.inOut' })
      }
      const nativeToggle = () => {
        if (!heightTween) {
          expanded = details.open
          summary.setAttribute('aria-expanded', String(expanded))
          content.inert = !expanded
          refresh()
        }
      }
      summary.addEventListener('click', toggle)
      details.addEventListener('toggle', nativeToggle)
      reduced.addEventListener('change', settle)
      cleanups.push(() => {
        stop()
        summary.removeEventListener('click', toggle)
        details.removeEventListener('toggle', nativeToggle)
        reduced.removeEventListener('change', settle)
        details.open = expanded
        content.inert = false
        summary.removeAttribute('aria-expanded')
        gsap.set(content, { clearProps: 'height' })
        gsap.set(list, { clearProps: 'opacity,transform' })
      })
    })
    return () => { cleanups.forEach(cleanup => cleanup()); cancelAnimationFrame(refreshFrame) }
  }, [scope])
}
