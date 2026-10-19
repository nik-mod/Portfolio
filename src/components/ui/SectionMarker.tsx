type SectionMarkerProps = {
  number: string
  label: string
}

export function SectionMarker({ number, label }: SectionMarkerProps) {
  return (
    <div className="section-marker" aria-hidden="true">
      <span>{number}</span>
      <i />
      <span>{label}</span>
    </div>
  )
}
