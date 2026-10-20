import { useCallback, useImperativeHandle, useLayoutEffect, useRef, type Ref } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Lightformer } from '@react-three/drei/core/Lightformer'
import { ACESFilmicToneMapping, CanvasTexture, PerspectiveCamera, SRGBColorSpace, Vector3, type Camera, type DirectionalLight, type Group, type MeshBasicMaterial, type Texture } from 'three'
import { studioPose, type LaptopController, type LaptopPose, type ViewFrame } from '../../modules/scene/laptop-pose'
import { LaptopModel } from './LaptopModel'
import { StudioEnvironment } from './StudioEnvironment'

type SceneProps = {
  onReady: () => void
  onPresented: () => void
  onFailure: () => void
  controllerRef?: Ref<LaptopController>
  screenTexture?: Texture
  lowPower?: boolean
}

/** Render a correctly proportioned sub-frame inside a fixed-resolution canvas.
 * This is an off-axis perspective projection, never a CSS stretch of the model.
 */
function projectFrame(camera: Camera, frame: ViewFrame | null, aspect: number) {
  if (!(camera instanceof PerspectiveCamera)) return
  camera.aspect = frame ? frame.width / frame.height : aspect
  camera.updateProjectionMatrix()
  if (frame) {
    const sx = frame.width / frame.fullWidth, sy = frame.height / frame.fullHeight
    const offsetX = 2 * frame.left / frame.fullWidth + sx - 1
    const offsetY = 1 - 2 * frame.top / frame.fullHeight - sy
    const matrix = camera.projectionMatrix.elements
    matrix[0] *= sx
    matrix[8] = matrix[8] * sx - offsetX
    matrix[5] *= sy
    matrix[9] = matrix[9] * sy - offsetY
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert()
  }
}

function Studio({ onReady, onPresented, onFailure, controllerRef, screenTexture, lowPower }: SceneProps) {
  const { camera, gl, invalidate, size, scene } = useThree()
  const body = useRef<Group>(null)
  const lid = useRef<Group>(null)
  const keyLight = useRef<DirectionalLight>(null)
  const preview = useRef<MeshBasicMaterial>(null)
  const previewTexture = useRef<CanvasTexture>(null)
  const controlled = useRef(false)
  const viewFrame = useRef<ViewFrame | null>(null)
  const layout = useRef({ width: size.width, height: size.height })
  const pose = useRef<LaptopPose>(studioPose(size.width / size.height))
  const simple = lowPower || size.width < 600
  const active = useRef(false)
  const reported = useRef(false)
  const presented = useRef(false)
  const revision = useRef(0)
  const compiled = useRef(false)
  const captured = useRef(false)
  const warming = useRef(0)
  const fence = useRef<{ sync: WebGLSync; version: number; started: number } | null>(null)
  const warmFrames = useRef({ count: 0, slow: 0 })

  const apply = useCallback((next: Partial<LaptopPose>) => {
    pose.current = { ...pose.current, ...next }
    revision.current++
    const value = pose.current
    value.opening = Math.max(0, Math.min(2.4, value.opening))
    body.current?.position.fromArray(value.position)
    body.current?.rotation.set(...value.rotation)
    body.current?.scale.setScalar(value.scale)
    if (lid.current) lid.current.rotation.x = -value.opening
    if (keyLight.current) keyLight.current.intensity = value.keyLightIntensity
    if (preview.current) preview.current.opacity = previewTexture.current ? value.previewMix : 0
    camera.position.fromArray(value.cameraPosition)
    camera.lookAt(...value.cameraTarget)
    projectFrame(camera, viewFrame.current, layout.current.width / layout.current.height)
    invalidate()
  }, [camera, invalidate])

  useImperativeHandle(controllerRef, () => ({
    setPose: (next) => { controlled.current = true; apply(next) },
    getPose: () => structuredClone(pose.current),
    resetPose: () => {
      controlled.current = false
      viewFrame.current = null
      apply(studioPose(layout.current.width / layout.current.height))
    },
    setViewFrame: (frame) => {
      viewFrame.current = frame
      projectFrame(camera, frame, layout.current.width / layout.current.height)
      invalidate()
    },
    setScreenPreview: (canvas) => {
      if (!active.current || !preview.current) return
      if (!canvas) { onFailure(); return }
      previewTexture.current?.dispose()
      const texture = new CanvasTexture(canvas)
      texture.colorSpace = SRGBColorSpace
      texture.anisotropy = 2
      previewTexture.current = texture
      preview.current.map = texture
      preview.current.opacity = pose.current.previewMix
      preview.current.needsUpdate = true
      const generation = ++warming.current
      compiled.current = false
      gl.initTexture(texture)
      void gl.compileAsync(scene, camera).then(() => {
        if (!active.current || generation !== warming.current) return
        compiled.current = true
        captured.current = true
        invalidate()
      }).catch(() => { if (active.current) onFailure() })
    },
    getScreenFrame: () => {
      body.current!.updateMatrixWorld(true)
      const surface = body.current!.getObjectByName('screen-surface')!
      const center = new Vector3().setFromMatrixPosition(surface.matrixWorld)
      const normal = new Vector3(0, 0, 1).transformDirection(surface.matrixWorld)
      const scale = surface.getWorldScale(new Vector3())
      return { center: center.toArray(), normal: normal.toArray(), width: 4.44 * scale.x, height: 2.69 * scale.y }
    },
  }), [apply, camera, gl, invalidate, onFailure, scene])

  const prepare = useCallback(() => {
    compiled.current = false
    const generation = ++warming.current
    // Compile with the real environment and all original materials, concealed.
    void gl.compileAsync(scene, camera).then(() => {
      if (active.current && generation === warming.current) { compiled.current = true; invalidate() }
    }).catch(() => { if (active.current) onFailure() })
  }, [camera, gl, invalidate, onFailure, scene])

  useLayoutEffect(() => () => { previewTexture.current?.dispose() }, [])

  useLayoutEffect(() => {
    active.current = true
    layout.current = { width: size.width, height: size.height }
    apply(controlled.current ? pose.current : studioPose(size.width / size.height))
    const lost = (event: Event) => {
      event.preventDefault()
      onFailure()
    }
    gl.domElement.addEventListener('webglcontextlost', lost)
    return () => {
      active.current = false
      if (fence.current) { (gl.getContext() as WebGL2RenderingContext).deleteSync(fence.current.sync); fence.current = null }
      gl.domElement.removeEventListener('webglcontextlost', lost)
    }
  }, [apply, gl, onFailure, size.width, size.height])

  // R3F useFrame runs BEFORE gl.render. A microtask observes the completed draw,
  // then releases the controller while the canvas remains visually concealed.
  useFrame(() => {
    // Use the existing demand loop, but don't draw partially compiled programs.
    if (!compiled.current) return
    // This Three.js version requires WebGL2 (Canvas rejects WebGL1 devices).
    const context = gl.getContext() as WebGL2RenderingContext
    if (fence.current) {
      const pending = fence.current
      const status = context.clientWaitSync(pending.sync, 0, 0)
      if (status === context.TIMEOUT_EXPIRED) { invalidate(); return }
      context.deleteSync(pending.sync)
      fence.current = null
      if (status === context.WAIT_FAILED) { onFailure(); return }
      if (pending.version === revision.current) {
        const sample = warmFrames.current
        sample.count++
        sample.slow = document.visibilityState === 'visible' && performance.now() - pending.started > 64 ? sample.slow + 1 : 0
        // Two settled draws slower than ~15 fps warrant the static alternative.
        if (sample.slow >= 2) { onFailure(); return }
        if (sample.count >= 2) {
          presented.current = true
          onPresented()
          return
        }
      }
    }
    const frame = gl.info.render.frame
    const version = revision.current
    const started = performance.now()
    gl.render(scene, camera)
    if (presented.current) return
    queueMicrotask(() => {
      if (!active.current || gl.getContext().isContextLost() || gl.info.render.frame <= frame) return
      if (!reported.current) {
        reported.current = true
        onReady()
        // Demand-render one additional frame after React installs the controller.
        invalidate()
        return
      }
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
      const view = viewFrame.current
      const sized = view && Math.abs(view.fullWidth - layout.current.width) < 2 && Math.abs(view.fullHeight - layout.current.height) < 2
      if (version === revision.current && (reduced || (controlled.current && sized && captured.current))) {
        // Submitted is not presented: await GPU completion without blocking JS.
        const sync = context.fenceSync(context.SYNC_GPU_COMMANDS_COMPLETE, 0)
        if (!sync) { onFailure(); return }
        context.flush()
        fence.current = { sync, version, started }
        invalidate()
      }
    })
  }, 1)

  return <>
    <ambientLight intensity={0.3} />
    <directionalLight ref={keyLight} position={[-3, 7, 5]} intensity={3.2} castShadow={!simple}
      shadow-mapSize-width={1024} shadow-mapSize-height={1024}
      shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-6}
      shadow-normalBias={0.035} shadow-bias={-0.0002} />
    <directionalLight position={[5, 3, -5]} intensity={2.1} color="#c5d3ca" />
    <StudioEnvironment resolution={simple ? 128 : 256} onReady={prepare} onFailure={onFailure}>
      <Lightformer form="rect" intensity={3.5} position={[-4, 5, 2]} scale={[3, 6, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={2.5} position={[4, 2, -4]} scale={[2, 5, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={1.5} position={[0, 6, -1]} scale={[6, 2, 1]} target={[0, 0, 0]} />
    </StudioEnvironment>
    <LaptopModel body={body} lid={lid} preview={preview} simple={Boolean(simple)} screenTexture={screenTexture} />
    {!simple && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.49, 0]} receiveShadow>
      <planeGeometry args={[30, 30]} /><shadowMaterial transparent opacity={0.27} />
    </mesh>}
  </>
}

export default function LaptopScene(props: SceneProps) {
  return <Canvas
    frameloop="demand"
    resize={{ scroll: false }}
    dpr={props.lowPower ? 1 : [1, 1.5]}
    shadows
    camera={{ fov: 34, near: 0.1, far: 60, position: [5.1, 4.3, 7.4] }}
    gl={{ alpha: true, antialias: true, powerPreference: 'low-power', toneMapping: ACESFilmicToneMapping }}
    fallback={null}
    style={{ pointerEvents: 'none' }}
    aria-hidden="true"
  >
    <Studio {...props} />
  </Canvas>
}
