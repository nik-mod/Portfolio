import { useEffect, useState } from 'react'
import { navigation, type SectionId } from '../data/navigation'

export function useActiveSection() {
  const [activeSection, setActiveSection] = useState<SectionId>('#intro')

  useEffect(() => {
    const sections = navigation
      .map(({ href }) => document.querySelector(href))
      .filter((section): section is Element => section !== null)

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

        if (visible) setActiveSection(`#${visible.target.id}` as SectionId)
      },
      { rootMargin: '-20% 0px -55%', threshold: [0.05, 0.35, 0.7] },
    )

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  return activeSection
}
