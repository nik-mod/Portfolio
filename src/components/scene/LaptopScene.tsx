import { useCallback, useImperativeHandle, useLayoutEffect, useRef, type Ref } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment } from '@react-three/drei/core/Environment'
import { Lightformer } from '@react-three/drei/core/Lightformer'
import { ACESFilmicToneMapping, type Group, type Texture } from 'three'
import { studioPose, type LaptopController, type LaptopPose } from '../../modules/scene/laptop-pose'
import { LaptopModel } from './LaptopModel'

type SceneProps = {
  onReady: () => void
  onFailure: () => void
  controllerRef?: Ref<LaptopController>
  screenTexture?: Texture
  lowPower?: boolean
}

function Studio({ onReady, onFailure, controllerRef, screenTexture, lowPower }: SceneProps) {
  const { camera, gl, invalidate, size } = useThree()
  const body = useRef<Group>(null)
  const lid = useRef<Group>(null)
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
    camera.position.fromArray(value.cameraPosition)
    camera.lookAt(...value.cameraTarget)
    camera.updateProjectionMatrix()
    invalidate()
  }, [camera, invalidate])

  useImperativeHandle(controllerRef, () => ({
    setPose: apply,
    getPose: () => structuredClone(pose.current),
  }), [apply])

  useLayoutEffect(() => {
    active.current = true
    apply(studioPose(size.width / size.height))
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
    <directionalLight position={[-3, 7, 5]} intensity={3.2} castShadow={!simple}
      shadow-mapSize-width={1024} shadow-mapSize-height={1024}
      shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-6}
      shadow-normalBias={0.035} shadow-bias={-0.0002} />
    <directionalLight position={[5, 3, -5]} intensity={2.1} color="#c5d3ca" />
    <Environment frames={1} resolution={simple ? 128 : 256} environmentIntensity={0.8}>
      <Lightformer form="rect" intensity={3.5} position={[-4, 5, 2]} scale={[3, 6, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={2.5} position={[4, 2, -4]} scale={[2, 5, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={1.5} position={[0, 6, -1]} scale={[6, 2, 1]} target={[0, 0, 0]} />
    </Environment>
    <LaptopModel body={body} lid={lid} simple={Boolean(simple)} screenTexture={screenTexture} />
    {!simple && <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.49, 0]} receiveShadow>
      <planeGeometry args={[30, 30]} /><shadowMaterial transparent opacity={0.27} />
    </mesh>}
  </>
}

export default function LaptopScene(props: SceneProps) {
  return <Canvas
    frameloop="demand"
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
