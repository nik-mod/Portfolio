import { SectionMarker } from '../ui/SectionMarker'

export function About() {
  return (
    <section className="section about" id="about" aria-labelledby="about-title" tabIndex={-1}>
      <SectionMarker number="03" label="About" />
      <div className="about-heading">
        <p className="eyebrow">Practice / Working principles</p>
        <h2 id="about-title">Structure<br /><em>with</em> feeling.</h2>
      </div>
      <div className="about-copy">
        <p className="lead">A creative-development practice focused on turning visual ideas into clear, responsive, and resilient digital systems.</p>
        <p>The work lives between design and engineering: shaping interaction, composition, typography, and front-end architecture as one connected material.</p>
      </div>
      <ol className="capability-list" aria-label="Areas of focus">
        <li><span>01</span><strong>Creative development</strong></li>
        <li><span>02</span><strong>Interface design</strong></li>
        <li><span>03</span><strong>Responsive systems</strong></li>
        <li><span>04</span><strong>Typography</strong></li>
        <li><span>05</span><strong>Interaction planning</strong></li>
        <li><span>06</span><strong>Front-end architecture</strong></li>
      </ol>
    </section>
  )
}
