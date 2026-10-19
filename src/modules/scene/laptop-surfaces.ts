import { projects } from '../../data/projects'

/** Original, local preview of the same exhibition index used by the real HTML. */
export function createDisplayArtwork() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 640
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#10100f'
  ctx.fillRect(0, 0, 1024, 640)
  ctx.strokeStyle = '#30302c'
  ctx.lineWidth = 1
  for (let x = 64; x < 1024; x += 128) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 640); ctx.stroke()
  }
  ctx.fillStyle = '#eeeade'
  ctx.font = '20px monospace'
  ctx.fillText('NM / DEV', 64, 65)
  ctx.fillStyle = '#aaa79f'
  ctx.font = '14px monospace'
  ctx.fillText('DESIGN × ENGINEERING', 64, 98)
  ctx.fillStyle = '#eeeade'
  ctx.font = '900 100px "Bahnschrift Condensed", "Arial Narrow", sans-serif'
  ctx.fillText('SELECTED', 64, 265)
  ctx.fillText('WORKS', 64, 345)
  ctx.fillStyle = '#86170f'
  ctx.fillRect(64, 390, 360, 5)
  projects.forEach((project, index) => {
    const y = 205 + index * 105
    ctx.fillStyle = '#d25748'
    ctx.font = '24px monospace'
    ctx.fillText(project.number, 560, y)
    ctx.fillStyle = '#eeeade'
    ctx.font = 'bold 26px "Bahnschrift Condensed", "Arial Narrow", sans-serif'
    ctx.fillText(project.title.toUpperCase(), 620, y)
    ctx.fillStyle = '#aaa79f'
    ctx.font = '12px monospace'
    ctx.fillText(project.status.toUpperCase(), 620, y + 28)
    ctx.fillStyle = '#343430'
    ctx.fillRect(560, y + 55, 400, 1)
  })
  ctx.fillStyle = '#aaa79f'
  ctx.font = '16px monospace'
  ctx.fillText('SELECTED CASE STUDIES', 64, 565)
  ctx.fillText('INDEX / 02', 855, 565)
  return canvas
}

export type Keycap = { x: number; z: number; width: number; label: string }

const rows = [
  ['esc', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', '○'],
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', '⌫'],
  ['tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'],
  ['caps', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", 'enter'],
  ['shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'shift'],
  ['ctrl', 'fn', 'alt', 'cmd', '', 'cmd', 'alt', '←', '↑↓', '→'],
]

export const keycaps: Keycap[] = rows.flatMap((row, r) => {
  const widths = row.map((label, i) => {
    if (r === 0) return 1
    if (label === '') return 5
    if (label === 'shift') return i === 0 ? 2.1 : 2.9
    if (label === 'caps' || label === 'enter') return 1.65
    if (label === 'tab' || label === '⌫') return 1.4
    return 1
  })
  const unit = 4.04 / widths.reduce((sum, width) => sum + width, 0)
  let x = -2.02
  return row.map((label, i) => {
    const width = widths[i] * unit
    const key = { x: x + width / 2, z: -1.04 + r * 0.288, width: width - 0.035, label }
    x += width
    return key
  })
})

export function createKeyLegends() {
  const canvas = document.createElement('canvas')
  canvas.width = 1536
  canvas.height = 768
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#d3d6cc'
  ctx.font = '17px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  // This plane's +Y maps toward the hinge (-Z).
  for (const key of keycaps) {
    ctx.fillText(key.label, (key.x / 4.2 + 0.5) * 1536, (key.z + 1.21) / 1.85 * 768)
  }
  return canvas
}
