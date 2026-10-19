import { SectionMarker } from '../ui/SectionMarker'

export function Contact() {
  return (
    <section className="section contact" id="contact" aria-labelledby="contact-title" tabIndex={-1}>
      <SectionMarker number="04" label="Contact" />
      <div className="contact-copy">
        <p className="eyebrow">Open channel / A good place to begin</p>
        <h2 id="contact-title">Have something<br /><span>in mind?</span></h2>
      </div>
      <div className="contact-action">
        <p>A website, an interface, a different way to interact.<br />Tell me what you’re thinking.</p>
        <a className="contact-email" href="mailto:nika.modebadze.1@btu.edu.ge"><span>Let’s talk<span className="contact-address">nika.modebadze.1@btu.edu.ge</span></span><span aria-hidden="true">↗</span></a>
        <a href="https://www.linkedin.com/in/nika-modebadze-65987039a/" target="_blank" rel="noopener noreferrer">LinkedIn <span className="contact-link-note">New tab <span aria-hidden="true">↗</span></span></a>
        <a className="contact-return" href="#intro">Return to introduction <span aria-hidden="true">↑</span></a>
      </div>
    </section>
  )
}
