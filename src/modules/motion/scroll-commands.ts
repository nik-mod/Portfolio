/** Programmatic document scrolls must go through the smooth-scroll owner.
 * A raw window.scrollTo issued while Lenis is animating a wheel target gets
 * overridden on its next frame; the registered command keeps both in sync.
 */
type ImmediateScroller = (target: number) => void

let immediateScroller: ImmediateScroller | null = null

export function registerImmediateScroller(fn: ImmediateScroller | null) {
  immediateScroller = fn
}

export function scrollDocumentTo(target: number) {
  if (immediateScroller) immediateScroller(target)
  else window.scrollTo(0, target)
}
