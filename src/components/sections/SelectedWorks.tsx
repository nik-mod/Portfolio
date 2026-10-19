import { SectionMarker } from '../ui/SectionMarker'
import { projects } from '../../data/projects'

export function SelectedWorks() {
  return (
    <section className="section works" id="works" aria-labelledby="works-title" tabIndex={-1}>
      <SectionMarker number="02" label="Selected works" />
      <div className="section-intro works-intro">
        <h2 id="works-title">Selected<br />Works</h2>
        <p>An evolving exhibition index. The structure is ready; selected case studies are still being assembled.</p>
      </div>

      <div className="works-index" aria-label="Case study index awaiting publication">
        <div className="works-status">
          <span>Edition / 02</span>
          <strong>03 reserved positions</strong>
        </div>
        {projects.map((project) => (
          <article className="project-row" key={project.number}>
            <span className="project-number">{project.number}</span>
            <div className="project-title">
              <h3>{project.title}</h3>
              <span>{project.discipline}</span>
            </div>
            <div className={`project-stage stage-${project.tone}`} aria-hidden="true">
              <i /><i /><span>{project.number}</span>
            </div>
            <span className="project-status">{project.status}</span>
          </article>
        ))}
      </div>
    </section>
  )
}
