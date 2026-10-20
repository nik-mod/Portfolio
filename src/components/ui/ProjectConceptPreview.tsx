/** Original self-contained website studies; DOM artwork survives the screen capture. */
export function ProjectConceptPreview({ tone }: { tone: 'dark' | 'light' | 'red' }) {
  if (tone === 'dark') return (
    <div className="concept-site concept-aurel website-study">
      <div className="study-nav"><strong>aurel<span>↗</span></strong><span>Collection  Our approach  Journal</span><b>Explore objects ↗</b></div>
      <div className="aurel-editorial"><small>ACOUSTIC OBJECTS / COLLECTION 01</small><h4>A quieter<br /><em>kind of presence.</em></h4><p>Considered sound. Uncompromising form.<br />An object made to belong in your space.</p><span className="study-button">Meet A / One <b>↗</b></span></div>
      <div className="aurel-scene"><div className="aurel-plinth" /><div className="aurel-orbit" /><div className="aurel-object"><div className="aurel-shell" /><div className="aurel-driver"><i /><i /><i /></div><div className="aurel-controls"><i /><i /><i /></div><span>A / ONE</span></div><small>BRUSHED ALUMINIUM / WARM SILVER</small><span className="aurel-scene-count">01 — 03</span></div>
      <div className="aurel-story"><div><small>01 / THE ESSENTIALS</small><h5>Less, but<br /><em>more considered.</em></h5></div><p>Every curve has a purpose.<br />Every surface, a quiet intention.<br /><span>Discover the design philosophy ↗</span></p><div className="aurel-detail"><i /><i /><i /><span>Precision in every detail.</span></div></div>
    </div>
  )
  if (tone === 'light') return (
    <div className="concept-site concept-outside website-study">
      <div className="study-nav"><strong>outside<span>↗</span></strong><span>Work  Approach  Studio</span><b>Have something in mind? ↗</b></div>
      <div className="outside-intro"><small>INDEPENDENT CREATIVE STUDIO</small><h4>Think beyond.<br /><span>Make it matter.</span></h4><div><p>Identities, websites and experiences<br />for ideas that deserve to stand apart.</p><span className="study-button">Explore our world <b>↘</b></span></div></div>
      <div className="outside-work"><div className="outside-work-art"><div className="outside-fold fold-one" /><div className="outside-fold fold-two" /><div className="outside-fold fold-three" /><strong>OTHER<br /><em>WAYS.</em></strong><span>AN EXPLORATION IN NEW PERSPECTIVES</span></div><div className="outside-work-caption"><small>01 / VISUAL EXPLORATIONS</small><h5>A different<br />point of view.</h5><span>Identity / Digital experience ↗</span></div><div className="outside-studio-note"><small>NOT A TEMPLATE.<br />A POINT OF VIEW.</small><p>Good design asks<br />better questions.</p><span>Discover our approach ↗</span></div></div>
      <div className="outside-services"><b>Built from curiosity.</b><span>Strategy & identity</span><span>Digital experiences</span><span>Art direction ↗</span></div>
    </div>
  )
  return (
    <div className="concept-site concept-vector website-study">
      <div className="study-nav"><strong>V / VECTOR</strong><span>Platform  Architecture  Resources</span><b>Explore the system ↗</b></div>
      <div className="vector-intro"><small>AN INTERFACE FOR WHAT COMES NEXT.</small><h4>Make space<br />for <em>possibility.</em></h4><p>A new perspective on connected tools.<br />One considered environment for ideas in motion.</p><span className="study-button">Discover Vector <b>↗</b></span></div>
      <div className="vector-system"><div className="vector-halo" /><div className="vector-hardware"><i /><i /><i /><span>V</span></div><div className="vector-interface"><div className="interface-top"><strong>VECTOR / WORKSPACE</strong><span>● SYSTEM READY</span></div><div className="interface-body"><div className="interface-sidebar"><b>Overview</b><span>Spatial layers</span><span>Connections</span><span>Library</span><small>WORKSPACE / 01</small></div><div className="interface-main"><small>YOUR ENVIRONMENT</small><strong>Everything.<br />In perspective.</strong><div className="interface-chart"><i /><i /><i /><i /><i /><i /><i /><i /></div><div className="interface-tags"><span>01 / CONNECT</span><span>02 / CREATE ↗</span></div></div></div></div></div>
      <div className="vector-features"><div><small>01 — CONNECT</small><h5>One connected canvas.</h5><p>Bring your tools into one clear view.</p></div><div><small>02 — COMPOSE</small><h5>Built around your flow.</h5><p>Shape a workspace that moves with you.</p></div><span className="vector-feature-mark">V ↗</span></div>
    </div>
  )
}
