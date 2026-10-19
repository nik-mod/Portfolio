import { useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import { applyProps, createPortal, useThree } from '@react-three/fiber'
import { CubeCamera, HalfFloatType, Scene, WebGLCubeRenderTarget } from 'three'

/** One procedural studio capture, without file-format loaders or a frame subscription. */
export function StudioEnvironment({ children, resolution }: { children: ReactNode; resolution: number }) {
  const { gl, scene } = useThree()
  const camera = useRef<CubeCamera>(null)
  const studio = useMemo(() => new Scene(), [])
  const target = useMemo(() => {
    const result = new WebGLCubeRenderTarget(resolution)
    result.texture.type = HalfFloatType
    return result
  }, [resolution])

  useLayoutEffect(() => () => target.dispose(), [target])

  useLayoutEffect(() => {
    const previousEnvironment = scene.environment
    const previousIntensity = scene.environmentIntensity
    const previousAutoClear = gl.autoClear
    try {
      gl.autoClear = true
      camera.current!.update(gl, studio)
    } finally {
      gl.autoClear = previousAutoClear
    }
    applyProps(scene, { environment: target.texture, environmentIntensity: 0.8 })
    return () => {
      applyProps(scene, { environment: previousEnvironment, environmentIntensity: previousIntensity })
    }
  }, [gl, scene, studio, target, children])

  return createPortal(<>
    {children}
    <cubeCamera ref={camera} args={[0.1, 1000, target]} />
  </>, studio)
}
