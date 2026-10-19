import { ArchitecturalViewport } from '../scene/ArchitecturalViewport'
import { useRef, useState } from 'react'
import { useScreenDive } from '../../hooks/useScreenDive'
import type { LaptopController } from '../../modules/scene/laptop-pose'

export function Hero() {
  const hero = useRef<HTMLElement>(null)
  const laptop = useRef<LaptopController>(null)
  const [ready, setReady] = useState(false)
  useScreenDive(hero, laptop, ready)
  return (
    <section ref={hero} className="hero" id="intro" aria-labelledby="hero-title" tabIndex={-1}>
      <div className="hero-index">
        <span>Index / 001—004</span>
        <span>Digital practice · 2026</span>
      </div>

      <h1 className="hero-title" id="hero-title">
        <span className="hero-title-solid">Nika</span>{' '}
        <span className="hero-title-outline">Modebadze</span>
      </h1>

      <div className="hero-copy">
        <span className="hero-copy-label">Introduction / 01</span>
        <p className="hero-profession">Creative Developer / UX/UI &amp; Interactive Experiences</p>
        <p>Building expressive digital experiences where visual systems and precise engineering meet.</p>
        <a href="#works">Explore the index <span aria-hidden="true">↓</span></a>
      </div>

      <div className="hero-scene">
        <div className="scene-stage">
          <ArchitecturalViewport controllerRef={laptop} onAvailability={setReady} />
        </div>
      </div>

      <div className="hero-scroll" aria-hidden="true"><span>Scroll to enter</span><i /></div>
      <div className="folio-mark" aria-hidden="true">FOLIO / EDITION 02</div>
    </section>
  )
}
