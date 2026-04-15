import { interpolate, useCurrentFrame } from 'remotion'
import type { Segment } from '@/types'

export function useSegmentAnimation(startFrame: number, durationFrames: number) {
  const frame = useCurrentFrame()
  const local = frame - startFrame
  const fadeIn  = interpolate(local, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const fadeOut = interpolate(local, [durationFrames - 15, durationFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const slideUp = interpolate(local, [0, 20], [40, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return { opacity: Math.min(fadeIn, fadeOut), slideUp, localFrame: local }
}

export function getSegmentFrames(segments: Segment[], fps: number) {
  let cursor = 0
  return segments.map(seg => {
    const startFrame = cursor
    const durationFrames = Math.round(seg.duration * fps)
    cursor += durationFrames
    return { ...seg, startFrame, durationFrames }
  })
}
