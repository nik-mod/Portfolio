import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function Footer() {
  const scope = useRef<HTMLElement>(null)
  useLayoutEffect(() => {
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const letters = scope.current!.querySelectorAll('.signature-letter')
      const message = scope.current!.querySelector('.signature-message')
      // Set the entire character array together: staggered .from() initialization
      // otherwise leaves later characters visible before their individual start.
      gsap.set(letters, { yPercent: 110, opacity: 0 })
      gsap.set(message, { opacity: 0, y: 8 })
      gsap.timeline({ id: 'footer-signature', scrollTrigger: { id: 'footer-signature', trigger: scope.current, start: 'top 92%', end: 'clamp(bottom bottom)', scrub: .6, invalidateOnRefresh: true } })
        .to(letters, { yPercent: 0, opacity: 1, duration: .95, stagger: .09, ease: 'power2.out' })
        .to(message, { opacity: 1, y: 0, duration: .3, ease: 'power2.out' }, 1.92)
    }, scope)
    return () => media.revert()
  }, [])
  return (
    <footer className="site-footer" ref={scope} aria-labelledby="signature-title">
      <div className="footer-register"><span>Independent by design.</span><span>Tbilisi, Georgia / Design × engineering</span></div>
      <h2 id="signature-title" className="footer-signature"><span className="sr-only">Nika Modebadze</span><span className="signature-visual" aria-hidden="true">{['NIKA', 'MODEBADZE'].map(word => <span className="signature-word" key={word}>{Array.from(word).map((letter, index) => <span className="signature-clip" key={`${letter}-${index}`}><span className="signature-letter">{letter}</span></span>)}</span>)}</span></h2>
      <p className="signature-message">LET’S BUILD SOMETHING WORTH REMEMBERING.</p>
      <div className="footer-meta"><p>Creative Developer / UX/UI</p><p>© {new Date().getFullYear()} Nika Modebadze</p><a href="#intro">Back to top <span aria-hidden="true">↑</span></a></div>
    </footer>
  )
}
