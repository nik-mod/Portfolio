import { Footer } from '../components/layout/Footer'
import { Header } from '../components/layout/Header'
import { About } from '../components/sections/About'
import { Contact } from '../components/sections/Contact'
import { Hero } from '../components/sections/Hero'
import { SelectedWorks } from '../components/sections/SelectedWorks'
import { useActiveSection } from '../hooks/useActiveSection'
import { useLayoutEffect, useRef } from 'react'
import { usePageMotion } from '../hooks/usePageMotion'

export function App() {
  const activeSection = useActiveSection()
  const main = useRef<HTMLElement>(null)
  usePageMotion(main)
  useLayoutEffect(() => {
    document.dispatchEvent(new Event('nm:app-mounted'))
    // A native anchor may have been followed before React replaced the static
    // accessible document. Resolve it again now that its destination exists.
    if (location.hash && location.hash !== '#intro') {
      const target = document.getElementById(location.hash.slice(1))
      target?.scrollIntoView({ block: 'start', behavior: 'instant' })
      if (document.documentElement.dataset.nmBootSkipped === 'true') target?.focus({ preventScroll: true })
    }
  }, [])

  return (
    <>
      <a className="skip-link" href="#works">Skip to selected works</a>
      <Header activeSection={activeSection} />
      <main id="main-content" ref={main} tabIndex={-1}>
        <Hero />
        <div className="portfolio-content">
          <SelectedWorks />
          <About />
          <Contact />
        </div>
      </main>
      <Footer />
    </>
  )
}
