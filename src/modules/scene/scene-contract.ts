export type CalibrationMark = {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  label: string
}

export const calibrationMarks: CalibrationMark[] = [
  { position: 'top-left', label: 'X 00.14' },
  { position: 'top-right', label: 'Y 09.72' },
  { position: 'bottom-left', label: 'AXIS / 01' },
  { position: 'bottom-right', label: 'FRAME / IDLE' },
]
