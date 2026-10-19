import { SectionMarker } from '../ui/SectionMarker'
import { AboutSculpture } from '../ui/AboutSculpture'
import { useLayoutEffect, useRef } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const skillGroups = [
  { number: '01', title: 'Frontend', kind: 'Core', skills: ['React', 'JavaScript', 'TypeScript', 'HTML', 'CSS', 'SCSS', 'Tailwind CSS', 'Next.js'] },
  { number: '02', title: 'Interaction & design', kind: 'Core', skills: ['GSAP', 'Three.js', 'Figma'] },
  { number: '03', title: 'Tools & platforms', kind: 'Core', skills: ['Git', 'GitHub', 'Cursor AI', 'OpenAI Codex', 'Supabase'] },
  { number: '04', title: 'Extended capabilities', kind: 'Additional', skills: ['Node.js', 'Python / Django', 'QA fundamentals', 'Responsive design', 'Motion design'] },
]

export function About() {
  const skills = useRef<HTMLElement>(null)
  useLayoutEffect(() => {
    let frame = 0
    const refresh = () => {
      cancelAnimationFrame(frame)
      // Native details changes document height; refresh existing triggers once.
      frame = requestAnimationFrame(() => ScrollTrigger.refresh())
    }
    const index = skills.current
    index?.addEventListener('toggle', refresh, true)
    return () => { cancelAnimationFrame(frame); index?.removeEventListener('toggle', refresh, true) }
  }, [])
  return (
    <section className="section about" id="about" aria-labelledby="about-title" tabIndex={-1}>
      <SectionMarker number="03" label="About" />
      <div className="about-spread">
        <figure className="about-portrait">
          <div className="portrait-frame">
            <img src="/images/nika-portrait-896.webp" srcSet="/images/nika-portrait-480.webp 480w, /images/nika-portrait-896.webp 896w" sizes="(max-width: 560px) 72vw, (max-width: 820px) 42vw, 440px" width={896} height={1195} loading="lazy" decoding="async" alt="Nika Modebadze working at a laptop, photographed in black and white." />
            <span className="portrait-register" aria-hidden="true">NM—01</span>
          </div>
          <figcaption><span>Nika Modebadze</span><span>Tbilisi, Georgia / 01</span></figcaption>
        </figure>
        <div className="about-heading">
          <p className="eyebrow">03 / The person behind the interface</p>
          <h2 id="about-title">Design in<br /><span>code</span><em>.</em></h2>
        </div>
        <div className="about-copy">
          <p className="about-identity">Nika Modebadze<span>Creative Developer / UX/UI</span></p>
          <p className="lead">I turn interface designs into responsive React experiences—with attention to how they read, respond, and move.</p>
          <p>Based in Tbilisi, I work between Figma and code. AI-assisted tools help me explore, build, and debug. The details still need a human eye.</p>
          <ul className="about-focus" aria-label="Practice focus">
            <li><span>01</span> Frontend development</li>
            <li><span>02</span> Interactive web experiences</li>
            <li><span>03</span> AI-assisted development</li>
          </ul>
          <a className="cv-download" href="/documents/Nika_Modebadze_CV.pdf" download="Nika_Modebadze_CV.pdf">
            <span>Download CV<small>Curriculum vitae / PDF</small></span>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M5 17v4h14v-4" /></svg>
          </a>
        </div>
        <AboutSculpture />
      </div>
      <section ref={skills} className="capability-list skills-index" aria-labelledby="skills-title">
        <header className="skills-heading">
          <p className="eyebrow">Practice / Technology index</p>
          <h3 id="skills-title">The working<br /><span>index.</span></h3>
          <p>From first sketch to working interface.<br /><span>Open a discipline to explore the toolkit.</span></p>
        </header>
        {skillGroups.map(group => (
          <details className="skill-group" key={group.number} open={group.number === '01'}>
            <summary><span className="skill-number">{group.number}</span><span className="skill-category">{group.kind}</span><span className="skill-category-title">{group.title}</span><span className="skill-toggle" aria-hidden="true">↗</span></summary>
            <ul>{group.skills.map(skill => <li key={skill}>{skill}</li>)}</ul>
          </details>
        ))}
      </section>
    </section>
  )
}
