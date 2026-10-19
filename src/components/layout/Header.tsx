import { navigation } from '../../data/navigation'
import type { SectionId } from '../../data/navigation'

type HeaderProps = { activeSection: SectionId }

export function Header({ activeSection }: HeaderProps) {
  return (
    <header className="site-header">
      <a className="wordmark" href="#intro" aria-label="Nika Modebadze — back to introduction">
        <span className="wordmark-mark" aria-hidden="true">NM</span>
        <span>Nika Modebadze</span>
      </a>

      <div className="availability" aria-label="Availability status">
        <span className="status-dot" aria-hidden="true" />
        <span>Independent practice<br />Design × Engineering</span>
      </div>

      <nav aria-label="Primary navigation">
        <ol className="nav-list">
          {navigation.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className={activeSection === item.href ? 'is-active' : undefined}
                aria-current={activeSection === item.href ? 'location' : undefined}
              >
                <span>{item.number}</span>{item.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </header>
  )
}
