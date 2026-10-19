import { useLayoutEffect, useMemo } from 'react'
import type { ThreeElements } from '@react-three/fiber'
import { ExtrudeGeometry, Shape } from 'three'

type PlateProps = Omit<ThreeElements['mesh'], 'args'> & {
  size: [number, number, number]
  radius: number
  bevel?: number
}

/** Rounded XZ footprint with an independent thin edge bevel (not a squashed box). */
export function RoundedPlate({ size: [width, height, depth], radius, bevel = 0.003, ...props }: PlateProps) {
  const geometry = useMemo(() => {
    const x = -width / 2, z = -depth / 2, r = radius
    const shape = new Shape()
    shape.moveTo(x + r, z)
    shape.lineTo(x + width - r, z)
    shape.quadraticCurveTo(x + width, z, x + width, z + r)
    shape.lineTo(x + width, z + depth - r)
    shape.quadraticCurveTo(x + width, z + depth, x + width - r, z + depth)
    shape.lineTo(x + r, z + depth)
    shape.quadraticCurveTo(x, z + depth, x, z + depth - r)
    shape.lineTo(x, z + r)
    shape.quadraticCurveTo(x, z, x + r, z)
    const result = new ExtrudeGeometry(shape, {
      depth: height - 2 * bevel, bevelEnabled: true,
      bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, steps: 1, curveSegments: 5,
    })
    result.center()
    result.rotateX(-Math.PI / 2)
    return result
  }, [width, height, depth, radius, bevel])
  useLayoutEffect(() => () => geometry.dispose(), [geometry])
  return <mesh geometry={geometry} {...props} />
}
