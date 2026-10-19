import { SectionMarker } from '../ui/SectionMarker'

export function Contact() {
  return (
    <section className="section contact" id="contact" aria-labelledby="contact-title" tabIndex={-1}>
      <SectionMarker number="04" label="Contact" />
      <div className="contact-copy">
        <p className="eyebrow">Open channel / Details pending</p>
        <h2 id="contact-title">Let’s make<br /><span>something matter.</span></h2>
      </div>
      <div className="contact-action">
        <span className="contact-index" aria-hidden="true">04 / END</span>
        <p>Contact details are being confirmed. This channel will open soon; no invented address, just an honest pause.</p>
        <a href="#intro">Return to introduction <span aria-hidden="true">↑</span></a>
      </div>
    </section>
  )
}
