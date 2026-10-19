import { useCallback, useImperativeHandle, useLayoutEffect, useRef, type Ref } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment } from '@react-three/drei/core/Environment'
import { Lightformer } from '@react-three/drei/core/Lightformer'
import { ACESFilmicToneMapping, CanvasTexture, PerspectiveCamera, SRGBColorSpace, Vector3, type Camera, type DirectionalLight, type Group, type MeshBasicMaterial, type Texture } from 'three'
import { studioPose, type LaptopController, type LaptopPose, type ViewFrame } from '../../modules/scene/laptop-pose'
import { LaptopModel } from './LaptopModel'

type SceneProps = {
  onReady: () => void
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

function Studio({ onReady, onFailure, controllerRef, screenTexture, lowPower }: SceneProps) {
  const { camera, gl, invalidate, size } = useThree()
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

  const apply = useCallback((next: Partial<LaptopPose>) => {
    pose.current = { ...pose.current, ...next }
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
      previewTexture.current?.dispose()
      const texture = new CanvasTexture(canvas)
      texture.colorSpace = SRGBColorSpace
      texture.anisotropy = 2
      previewTexture.current = texture
      preview.current.map = texture
      preview.current.opacity = pose.current.previewMix
      preview.current.needsUpdate = true
      invalidate()
    },
    getScreenFrame: () => {
      body.current!.updateMatrixWorld(true)
      const surface = body.current!.getObjectByName('screen-surface')!
      const center = new Vector3().setFromMatrixPosition(surface.matrixWorld)
      const normal = new Vector3(0, 0, 1).transformDirection(surface.matrixWorld)
      const scale = surface.getWorldScale(new Vector3())
      return { center: center.toArray(), normal: normal.toArray(), width: 4.44 * scale.x, height: 2.69 * scale.y }
    },
  }), [apply, camera, invalidate])

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
      gl.domElement.removeEventListener('webglcontextlost', lost)
    }
  }, [apply, gl, onFailure, size.width, size.height])

  // One notification after the first completed draw, never per-frame React state.
  useFrame(() => {
    if (!reported.current) {
      reported.current = true
      queueMicrotask(() => { if (active.current) onReady() })
    }
  })

  return <>
    <ambientLight intensity={0.3} />
    <directionalLight ref={keyLight} position={[-3, 7, 5]} intensity={3.2} castShadow={!simple}
      shadow-mapSize-width={1024} shadow-mapSize-height={1024}
      shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-6}
      shadow-normalBias={0.035} shadow-bias={-0.0002} />
    <directionalLight position={[5, 3, -5]} intensity={2.1} color="#c5d3ca" />
    <Environment frames={1} resolution={simple ? 128 : 256} environmentIntensity={0.8}>
      <Lightformer form="rect" intensity={3.5} position={[-4, 5, 2]} scale={[3, 6, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={2.5} position={[4, 2, -4]} scale={[2, 5, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={1.5} position={[0, 6, -1]} scale={[6, 2, 1]} target={[0, 0, 0]} />
    </Environment>
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
    aria-hidden="true"
  >
    <Studio {...props} />
  </Canvas>
}
