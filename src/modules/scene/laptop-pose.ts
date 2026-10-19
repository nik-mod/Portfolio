export type Vector3Tuple = [number, number, number]

/** Radians; opening=0 is closed, opening=PI/2 is upright. */
export type LaptopPose = {
  position: Vector3Tuple
  rotation: Vector3Tuple
  scale: number
  opening: number
  cameraPosition: Vector3Tuple
  cameraTarget: Vector3Tuple
}

export type LaptopController = {
  /** Mutates Three objects and requests a frame; safe for GSAP onUpdate. */
  setPose: (pose: Partial<LaptopPose>) => void
  getPose: () => LaptopPose
}

export function studioPose(aspect: number): LaptopPose {
  const compact = aspect < 1.5
  return {
    position: [compact ? 0 : 0.45, -0.1, 0],
    rotation: [0, -0.12, -0.065],
    scale: compact ? 0.98 : 1,
    opening: 1.92,
    cameraPosition: compact ? [5.8, 5, 9.4] : [5.1, 4.3, 7.4],
    cameraTarget: [0.15, 1.05, 0],
  }
}
