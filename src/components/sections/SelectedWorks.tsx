import { SectionMarker } from '../ui/SectionMarker'

const projects = [
  { number: '01', title: 'Project slot 01', discipline: 'Selected case study', status: 'In curation', tone: 'dark' },
  { number: '02', title: 'Project slot 02', discipline: 'Selected case study', status: 'To be announced', tone: 'light' },
  { number: '03', title: 'Project slot 03', discipline: 'Selected case study', status: 'In curation', tone: 'red' },
] as const

export function SelectedWorks() {
  return (
    <section className="section works" id="works" aria-labelledby="works-title">
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
