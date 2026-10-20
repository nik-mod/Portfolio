import { useLayoutEffect, useMemo, useRef, type RefObject } from 'react'
import { RoundedBox } from '@react-three/drei/core/RoundedBox'
import { CanvasTexture, Matrix4, SRGBColorSpace, type Group, type InstancedMesh, type MeshBasicMaterial, type MeshStandardMaterial, type Texture } from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { createDisplayArtwork, createKeyLegends, keycaps } from '../../modules/scene/laptop-surfaces'
import { RoundedPlate } from './RoundedPlate'

type ModelProps = {
  body: RefObject<Group | null>
  lid: RefObject<Group | null>
  simple: boolean
  screenTexture?: Texture
  preview: RefObject<MeshBasicMaterial | null>
  screenMaterial?: RefObject<MeshStandardMaterial | null>
}

function Keyboard({ simple }: { simple: boolean }) {
  const mesh = useRef<InstancedMesh>(null)
  const geometry = useMemo(() => new RoundedBoxGeometry(1, 1, 1, 2, 0.12), [])
  const legends = useMemo(() => {
    const texture = new CanvasTexture(createKeyLegends())
    texture.colorSpace = SRGBColorSpace
    return texture
  }, [])
  useLayoutEffect(() => {
    const matrix = new Matrix4()
    keycaps.forEach((key, index) => {
      matrix.makeScale(key.width, 0.04, 0.245)
      matrix.setPosition(key.x, 0.118, key.z)
      mesh.current!.setMatrixAt(index, matrix)
    })
    mesh.current!.instanceMatrix.needsUpdate = true
    return () => { geometry.dispose(); legends.dispose() }
  }, [geometry, legends])

  return (
    <group name="keyboard">
      <RoundedPlate size={[4.22, 0.022, 1.85]} radius={0.06} position={[0, 0.086, -0.285]}>
        <meshStandardMaterial color="#252b29" metalness={0.4} roughness={0.48} />
      </RoundedPlate>
      <instancedMesh ref={mesh} args={[geometry, undefined, keycaps.length]} castShadow={!simple} name="keycaps">
        <meshStandardMaterial color="#141916" metalness={0.2} roughness={0.42} />
      </instancedMesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.141, -0.285]}>
        <planeGeometry args={[4.2, 1.85]} />
        <meshBasicMaterial map={legends} transparent depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  )
}

function SpeakerGrilles() {
  const mesh = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const matrix = new Matrix4()
    let index = 0
    for (const side of [-1, 1]) for (let row = 0; row < 24; row++) for (let col = 0; col < 3; col++) {
      matrix.makeTranslation(side * (2.17 + col * 0.044), 0.097, -1.02 + row * 0.064)
      mesh.current!.setMatrixAt(index++, matrix)
    }
    mesh.current!.instanceMatrix.needsUpdate = true
  }, [])
  return <instancedMesh ref={mesh} args={[undefined, undefined, 144]} name="speaker-perforations">
    <boxGeometry args={[0.017, 0.003, 0.026]} />
    <meshStandardMaterial color="#151b18" roughness={0.7} />
  </instancedMesh>
}

/** Original procedural assembly. +Z is the front lip, hinge axis runs along X. */
export function LaptopModel({ body, lid, simple, screenTexture, preview, screenMaterial }: ModelProps) {
  const display = useMemo(() => {
    const texture = new CanvasTexture(createDisplayArtwork())
    texture.colorSpace = SRGBColorSpace
    texture.anisotropy = simple ? 2 : 4
    return texture
  }, [simple])
  useLayoutEffect(() => () => display.dispose(), [display])
  return (
    <group ref={body} name="laptop">
      <group name="chassis">
        <RoundedBox args={[4.8, 0.16, 3.12]} radius={0.075} smoothness={3} castShadow receiveShadow>
          <meshStandardMaterial color="#929992" metalness={0.82} roughness={0.27} />
        </RoundedBox>
        <RoundedPlate size={[4.75, 0.026, 3.06]} radius={0.08} position={[0, 0.078, 0]} receiveShadow>
          <meshStandardMaterial color="#808981" metalness={0.78} roughness={0.32} />
        </RoundedPlate>
        {/* The base seam, opening notch, side ports and underside feet have depth. */}
        <RoundedPlate size={[4.72, 0.014, 3.04]} radius={0.08} position={[0, -0.058, 0]}>
          <meshStandardMaterial color="#434a44" metalness={0.8} roughness={0.4} />
        </RoundedPlate>
        <RoundedBox args={[0.72, 0.025, 0.045]} radius={0.012} smoothness={2} position={[0, 0.065, 1.543]}>
          <meshStandardMaterial color="#3c443f" metalness={0.7} roughness={0.3} />
        </RoundedBox>
        {[-1, 1].map(side => <group key={side}>
          {[-0.82, -0.37, 0.2].map((z, index) => <RoundedBox key={z} args={[0.016, 0.047, index === 2 ? 0.31 : 0.19]} radius={0.007} smoothness={2} position={[side * 2.397, -0.005, z]}>
            <meshStandardMaterial color="#111713" metalness={0.2} roughness={0.55} />
          </RoundedBox>)}
          <RoundedBox args={[3.6, 0.035, 0.12]} radius={0.015} smoothness={2} position={[0, -0.095, side * 1.1]}>
            <meshStandardMaterial color="#242824" roughness={0.85} />
          </RoundedBox>
        </group>)}
        <Keyboard simple={simple} />
        {!simple && <SpeakerGrilles />}
        <group name="trackpad" position={[0, 0.098, 0.99]}>
          <RoundedPlate size={[1.72, 0.012, 0.76]} radius={0.045}>
            <meshStandardMaterial color="#343d36" metalness={0.7} roughness={0.35} />
          </RoundedPlate>
          <RoundedPlate size={[1.696, 0.012, 0.736]} radius={0.04} position={[0, 0.002, 0]}>
            <meshStandardMaterial color="#89938a" metalness={0.65} roughness={0.36} />
          </RoundedPlate>
        </group>
      </group>
      <group name="hinges">
        {[-1.72, 1.72].map(x => <RoundedBox key={`saddle-${x}`} args={[0.62, 0.09, 0.22]} radius={0.035} smoothness={2} position={[x, 0.125, -1.36]}>
          <meshStandardMaterial color="#69746c" metalness={0.85} roughness={0.3} />
        </RoundedBox>)}
        {[-1.72, 1.72].map(x => <group key={x} position={[x, 0.21, -1.36]} rotation={[0, 0, Math.PI / 2]}>
          <mesh castShadow><cylinderGeometry args={[0.09, 0.09, 0.56, 20]} /><meshStandardMaterial color="#586159" metalness={0.9} roughness={0.24} /></mesh>
          <mesh position={[0, 0.245, 0]}><cylinderGeometry args={[0.092, 0.092, 0.035, 20]} /><meshStandardMaterial color="#86170f" metalness={0.6} roughness={0.32} /></mesh>
        </group>)}
      </group>
      <group ref={lid} name="display-pivot" position={[0, 0.21, -1.36]}>
        <RoundedBox name="lid-shell" args={[4.77, 0.085, 3.05]} radius={0.04} smoothness={3} position={[0, 0, 1.44]} castShadow>
          <meshStandardMaterial color="#8c958c" metalness={0.86} roughness={0.24} />
        </RoundedBox>
        <RoundedPlate name="display-bezel" size={[4.64, 0.016, 2.91]} radius={0.055} position={[0, -0.047, 1.45]}>
          <meshStandardMaterial color="#0b100e" metalness={0.25} roughness={0.27} />
        </RoundedPlate>
        <mesh name="screen-surface" position={[0, -0.057, 1.48]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[4.44, 2.69]} />
          <meshStandardMaterial ref={screenMaterial} map={screenTexture ?? display} emissiveMap={screenTexture ?? display} emissive="#ffffff" emissiveIntensity={0.28} metalness={0.15} roughness={simple ? 0.4 : 0.24} />
        </mesh>
        <mesh name="screen-portfolio" position={[0, -0.058, 1.48]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[4.44, 2.69]} />
          <meshBasicMaterial ref={preview} transparent opacity={0} toneMapped={false} depthWrite={false} />
        </mesh>
        <mesh position={[0, -0.059, 2.884]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.018, 16]} /><meshStandardMaterial color="#283b35" metalness={0.6} roughness={0.15} />
        </mesh>
        <mesh position={[0.065, -0.06, 2.884]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.006, 8]} /><meshBasicMaterial color="#b9c7a2" />
        </mesh>
      </group>
    </group>
  )
}
