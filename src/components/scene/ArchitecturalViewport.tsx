import { calibrationMarks } from '../../modules/scene/scene-contract'
import { lazy, Suspense, useCallback, useEffect, useRef, useState, type Ref } from 'react'
import type { LaptopController } from '../../modules/scene/laptop-pose'
import { SceneBoundary } from './SceneBoundary'

const LaptopScene = lazy(() => import('./LaptopScene'))

export function ArchitecturalViewport({ controllerRef }: { controllerRef?: Ref<LaptopController> }) {
  const figure = useRef<HTMLElement>(null)
  const [enabled, setEnabled] = useState(false)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [lowPower, setLowPower] = useState(false)
  const onReady = useCallback(() => setReady(true), [])
  const onFailure = useCallback(() => { setReady(false); setFailed(true) }, [])

  useEffect(() => {
    const device = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
    if (device.connection?.saveData || (device.deviceMemory !== undefined && device.deviceMemory <= 2)) return
    const limited = (device.deviceMemory !== undefined && device.deviceMemory <= 4) ||
      (device.hardwareConcurrency > 0 && device.hardwareConcurrency <= 4) || matchMedia('(pointer: coarse)').matches
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setLowPower(limited)
        setEnabled(true)
        observer.disconnect()
      }
    }, { rootMargin: '200px' })
    if (figure.current) observer.observe(figure.current)
    return () => observer.disconnect()
  }, [])

  return (
    <figure ref={figure} className="viewport" data-scene-ready={ready} aria-label="Sculptural laptop in a graphite studio">
      <div className="viewport-grid" aria-hidden="true" />
      <div className="viewport-plane plane-a" aria-hidden="true" />
      <div className="viewport-plane plane-b" aria-hidden="true" />
      <div className="machine" aria-hidden="true">
        <div className="machine-screen">
          <div className="screen-depth" />
          <span className="reticle"><i /><i /></span>
          <span className="screen-readout">FRAME / 00</span>
        </div>
        <div className="machine-hinge" />
        <div className="machine-base"><span /><i /></div>
      </div>
      {enabled && !failed && <div className="laptop-canvas" aria-hidden="true">
        <SceneBoundary onFailure={onFailure}>
          <Suspense fallback={null}>
            <LaptopScene onReady={onReady} onFailure={onFailure} controllerRef={controllerRef} lowPower={lowPower} />
          </Suspense>
        </SceneBoundary>
      </div>}
      <div className="crop crop-nw" aria-hidden="true" />
      <div className="crop crop-se" aria-hidden="true" />
      <span className="bay-index" aria-hidden="true">BAY—01</span>
      <span className="bay-status" aria-hidden="true">FORM / FUNCTION<br />INDUSTRIAL STUDY</span>
      {calibrationMarks.map((mark) => (
        <span className={`calibration ${mark.position}`} key={mark.position}>{mark.label}</span>
      ))}
      <figcaption>Object 01 — dimensional study</figcaption>
    </figure>
  )
}
