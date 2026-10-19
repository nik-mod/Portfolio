export const navigation = [
  { number: '01', label: 'Intro', href: '#intro' },
  { number: '02', label: 'Works', href: '#works' },
  { number: '03', label: 'About', href: '#about' },
  { number: '04', label: 'Contact', href: '#contact' },
] as const

export type SectionId = (typeof navigation)[number]['href']
