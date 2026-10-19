import { Footer } from '../components/layout/Footer'
import { Header } from '../components/layout/Header'
import { About } from '../components/sections/About'
import { Contact } from '../components/sections/Contact'
import { Hero } from '../components/sections/Hero'
import { SelectedWorks } from '../components/sections/SelectedWorks'
import { useActiveSection } from '../hooks/useActiveSection'
import { useRef } from 'react'
import { usePageMotion } from '../hooks/usePageMotion'

export function App() {
  const activeSection = useActiveSection()
  const main = useRef<HTMLElement>(null)
  usePageMotion(main)

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <Header activeSection={activeSection} />
      <main id="main-content" ref={main} tabIndex={-1}>
        <Hero />
        <SelectedWorks />
        <About />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
