import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/** Future scene adapter: feed progress into a mutable R3F ref, not React state.
 * Call from an effect and return the disposer. No pinning or render loop is added.
 * The consumer chooses a static scene pose when reduced motion is requested.
 */
export function createScrollProgress(
  trigger: HTMLElement,
  onProgress: (progress: number) => void,
) {
  const update = (self: ScrollTrigger) => onProgress(gsap.utils.clamp(0, 1, self.progress))
  const controller = ScrollTrigger.create({
    trigger, start: 'clamp(top bottom)', end: 'clamp(bottom top)',
    onUpdate: update, onRefresh: update,
  })
  update(controller)
  return () => controller.kill()
}
