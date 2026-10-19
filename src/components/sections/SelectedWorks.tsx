import { SectionMarker } from '../ui/SectionMarker'
import { projects } from '../../data/projects'
import { ProjectConceptPreview } from '../ui/ProjectConceptPreview'
import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function SelectedWorks() {
  const scope = useRef<HTMLElement>(null)
  useLayoutEffect(() => {
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      // The first spread is deliberately still: it is the laptop's HTML destination.
      const rows = scope.current?.querySelectorAll<HTMLElement>('.project-row:not(:first-of-type)')
      rows?.forEach(row => {
        gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: row, start: 'top bottom', end: 'bottom top', scrub: .45 } })
          .fromTo(row.querySelector('.project-stage'), { y: 22 }, { y: -14 }, 0)
          .fromTo(row.querySelector('.concept-site'), { scale: 1.035 }, { scale: 1 }, 0)
        gsap.from(row.querySelector('.project-title'), { y: 16, duration: .7, ease: 'power3.out', scrollTrigger: { trigger: row, start: 'top 90%', toggleActions: 'play none none reverse' } })
      })
    }, scope)
    return () => media.revert()
  }, [])
  return (
    <section ref={scope} className="section works" id="works" aria-labelledby="works-title" tabIndex={-1}>
      <SectionMarker number="02" label="Selected works" />
      <div className="section-intro works-intro">
        <h2 id="works-title">Selected<br />Works</h2>
        <p>Three directions for the web.<br />Original interfaces, imagined in full.</p>
      </div>

      <div className="works-index" aria-label="Original website concept studies">
        <div className="works-status">
          <span>Digital explorations / 01—03</span>
          <strong>03 concept studies</strong>
        </div>
        {projects.map((project) => (
          <article className="project-row" key={project.number}>
            <span className="project-number">{project.number}</span>
            <div className="project-title">
              <h3>{project.title}</h3>
              <span>{project.discipline}</span>
              <small>Concept Study / Not a Live Client Project</small>
            </div>
            <div className={`project-stage stage-${project.tone}`} aria-hidden="true">
              <ProjectConceptPreview tone={project.tone} />
            </div>
            <span className="project-status">{project.status}</span>
          </article>
        ))}
      </div>
    </section>
  )
}
