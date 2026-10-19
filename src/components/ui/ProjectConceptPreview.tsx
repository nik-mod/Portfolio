/** Original, image-free mini-site compositions: also rasterized by the laptop handoff. */
export function ProjectConceptPreview({ tone }: { tone: 'dark' | 'light' | 'red' }) {
  if (tone === 'dark') return (
    <div className="concept-site concept-aurel">
      <div className="concept-nav"><strong>AUREL / 01</strong><span>Objects / Philosophy / Journal</span><b>EN ↗</b></div>
      <div className="aurel-copy"><small>AN OBJECT. A PRESENCE.</small><h4>Sound,<br /><em>in its purest</em><br />form.</h4><p>Less noise. More listening.</p><span className="concept-cta">Discover the object <b>↗</b></span></div>
      <div className="aurel-product"><div className="aurel-shadow" /><div className="aurel-speaker"><div className="speaker-top" /><div className="speaker-grille" /><span>A / 01</span><div className="speaker-base" /></div><small>01 — SCULPTED IN SOUND</small></div>
      <div className="concept-bottom"><span>DESIGNED TO BE HEARD.<br />BUILT TO BE KEPT.</span><span>SCROLL TO EXPLORE ↓</span><b>01 / 03</b></div>
    </div>
  )
  if (tone === 'light') return (
    <div className="concept-site concept-outside">
      <div className="concept-nav"><strong>outside.</strong><span>Independent design studio</span><b>LET’S TALK ↗</b></div>
      <div className="outside-heading"><small>GOOD WORK DOESN’T FIT IN.</small><h4>Outside<br /><span>the grid.</span></h4><span className="outside-arrow">↘</span></div>
      <div className="outside-strip"><span>Identity</span><span>Digital</span><span>Art direction</span><b>NOT QUITE LIKE THE OTHERS.</b></div>
      <div className="outside-gallery"><div className="outside-poster"><span>NEW<br />WAYS<br /><em>IN.</em></span><b>NO STRAIGHT LINES.<br />NO STRAIGHT ANSWERS.</b></div><div className="outside-arch"><i /><i /><i /><span>SPACE FOR<br />A DIFFERENT VIEW.</span></div><div className="outside-note"><b>01—02</b><p>Different angles.<br />One point of view.</p><span>SELECTED EXPLORATIONS ↗</span></div></div>
    </div>
  )
  return (
    <div className="concept-site concept-vector">
      <div className="concept-nav"><strong>V / VECTOR</strong><span>System / Architecture / Explore</span><b>ENTER ↗</b></div>
      <div className="vector-copy"><small>A NEW FRAME OF REFERENCE</small><h4>Beyond<br />the <em>surface.</em></h4><p>An exploration of the space<br />between people and technology.</p><span className="concept-cta">Explore the architecture <b>↗</b></span></div>
      <div className="vector-instrument"><div className="vector-grid" /><div className="vector-core"><i /><i /><i /><i /><div><span>V</span><small>INTERFACE / 001</small></div></div><span className="vector-axis axis-one">X / SPATIAL LAYER</span><span className="vector-axis axis-two">OPEN SYSTEM — 01</span></div>
      <div className="concept-bottom"><span>DESIGN × TECHNOLOGY</span><span>01 / FORM<br />02 / CONNECTION</span><b>SCROLL TO DISCOVER ↓</b></div>
    </div>
  )
}
