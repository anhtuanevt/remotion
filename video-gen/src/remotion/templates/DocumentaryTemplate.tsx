'use client'
import { useCurrentFrame, interpolate, Sequence, AbsoluteFill, Audio, Img } from 'remotion'
import type { VideoProps, Segment } from '@/types'
import { getSegmentFrames, useSegmentAnimation } from '../helpers'

const FPS = 24

function DocumentarySegment({
  seg,
  startFrame,
  durationFrames,
}: {
  seg: Segment
  startFrame: number
  durationFrames: number
}) {
  const { opacity } = useSegmentAnimation(startFrame, durationFrames)
  const frame = useCurrentFrame()
  const local = frame - startFrame

  // Slow pan: translateX from 0% to -3% across segment
  const panX = interpolate(local, [0, durationFrames], [0, -3], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // Lower-third strip slides up from bottom
  const lowerThirdY = interpolate(local, [0, 20], [160, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <Sequence from={startFrame} durationInFrames={durationFrames}>
      <AbsoluteFill style={{ background: '#000000', overflow: 'hidden' }}>
        {/* Full-bleed image with slow pan */}
        {seg.imageUrl && (
          <AbsoluteFill
            style={{
              transform: `translateX(${panX}%) scale(1.04)`,
              transformOrigin: 'center center',
            }}
          >
            <Img
              src={seg.imageUrl}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </AbsoluteFill>
        )}

        {/* Vignette overlay */}
        <AbsoluteFill
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.65) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Lower-third dark strip */}
        <AbsoluteFill
          style={{
            justifyContent: 'flex-end',
            alignItems: 'flex-start',
          }}
        >
          <div
            style={{
              position: 'absolute',
              bottom: 80,
              left: 0,
              right: 0,
              transform: `translateY(${lowerThirdY}px)`,
              opacity,
            }}
          >
            {/* Dark strip background */}
            <div
              style={{
                background: 'rgba(0,0,0,0.82)',
                borderLeft: '6px solid #f59e0b',
                padding: '24px 60px 24px 48px',
                maxWidth: 900,
              }}
            >
              {/* Main text */}
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 600,
                  color: '#ffffff',
                  fontFamily: 'Arial, sans-serif',
                  lineHeight: 1.35,
                }}
              >
                {seg.text}
              </div>

              {/* Sub-label in amber */}
              {seg.subtitle && (
                <div
                  style={{
                    marginTop: 12,
                    fontSize: 26,
                    color: '#f59e0b',
                    fontFamily: 'Arial, sans-serif',
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                  }}
                >
                  {seg.subtitle}
                </div>
              )}
            </div>
          </div>
        </AbsoluteFill>

        {seg.audioUrl && <Audio src={seg.audioUrl} />}
      </AbsoluteFill>
    </Sequence>
  )
}

export function DocumentaryTemplate({ segments }: VideoProps) {
  const segFrames = getSegmentFrames(segments, FPS)

  return (
    <AbsoluteFill style={{ background: '#000000' }}>
      {segFrames.map((seg) => (
        <DocumentarySegment
          key={seg.id}
          seg={seg}
          startFrame={seg.startFrame}
          durationFrames={seg.durationFrames}
        />
      ))}
    </AbsoluteFill>
  )
}