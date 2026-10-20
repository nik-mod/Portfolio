type ScreenRect = { left: number; top: number; width: number; height: number }
const captureJobs = new WeakMap<HTMLElement, symbol>()

/** Rasterize this local, image-free section once per layout, not per frame.
 * Inline computed styles preserve the actual responsive grid and local fonts.
 */
export async function capturePortfolio(section: HTMLElement, width: number, height: number, screen: ScreenRect) {
  const job = Symbol()
  captureJobs.set(section, job)
  await document.fonts.ready
  const clone = section.cloneNode(true) as HTMLElement
  const source = [section, ...Array.from(section.querySelectorAll<HTMLElement>('*'))]
  const target = [clone, ...Array.from(clone.querySelectorAll<HTMLElement>('*'))]
  let budget = performance.now()
  const browserScheduler = globalThis as typeof globalThis & { scheduler?: { yield: () => Promise<void> } }
  for (const [index, element] of source.entries()) {
    if (!section.isConnected || captureJobs.get(section) !== job) throw new DOMException('Capture superseded', 'AbortError')
    const computed = getComputedStyle(element)
    const copy = target[index]
    // One CSSOM write per node instead of repeatedly reparsing its declaration.
    // Keep every computed value: the generated handoff image must not change.
    copy.style.cssText = Array.from(computed, property => `${property}:${computed.getPropertyValue(property)};`).join('')
    copy.removeAttribute('id')
    copy.style.animation = 'none'
    copy.style.transition = 'none'
    copy.style.opacity = '1'
    if (element.matches('.section, .section-marker, .section-intro, .project-number, .project-title, .project-stage, .project-status')) {
      copy.style.transform = 'none'
    }
    // Finite startup work, not an animation clock: give input and paint a turn.
    if (performance.now() - budget > 5) {
      if (browserScheduler.scheduler?.yield) await browserScheduler.scheduler.yield()
      else await new Promise<void>(resolve => setTimeout(resolve, 0))
      budget = performance.now()
    }
  }
  Object.assign(clone.style, { margin: '0', width: `${width}px`, position: 'relative', top: '0', left: '0' })
  const pseudoStyle = getComputedStyle(section, '::before')
  if (pseudoStyle.content !== 'none' && pseudoStyle.display !== 'none') {
    const rule = document.createElement('div')
    for (const property of Array.from(pseudoStyle)) rule.style.setProperty(property, pseudoStyle.getPropertyValue(property))
    clone.prepend(rule)
  }
  const html = new XMLSerializer().serializeToString(clone)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><foreignObject width="100%" height="100%">${html}</foreignObject></svg>`
  const image = new Image()
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  await image.decode()
  const canvas = document.createElement('canvas')
  // The complete texture retains the physical display aspect; the visible crop
  // maps exactly to the destination viewport at the final camera position.
  const resolution = Math.min(1, 2048 / screen.width, 2048 / screen.height)
  canvas.width = Math.ceil(screen.width * resolution)
  canvas.height = Math.ceil(screen.height * resolution)
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#10100f'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.scale(resolution, resolution)
  ctx.drawImage(image, -screen.left, -screen.top, width, height)
  ctx.fillStyle = '#eeeade'
  ctx.font = '20px monospace'
  ctx.fillText('NM / DEV', 20, 30)
  // Verify that this local capture is origin-clean before sending it to WebGL.
  ctx.getImageData(0, 0, 1, 1)
  return canvas
}
