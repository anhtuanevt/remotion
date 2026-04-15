'use client'
import { useCurrentFrame, interpolate, Sequence, AbsoluteFill, Audio, Img } from 'remotion'
import type { VideoProps, Segment } from '@/types'
import { getSegmentFrames, useSegmentAnimation } from '../helpers'

const FPS = 24
const LETTERBOX_HEIGHT = 80

function StorySegment({
  seg,
  startFrame,
  durationFrames,
}: {
  seg: Segment
  startFrame: number
  durationFrames: number
}) {
  const { opacity, localFrame } = useSegmentAnimation(startFrame, durationFrames)
  const frame = useCurrentFrame()
  const local = frame - startFrame

  // Ken Burns zoom: subtle scale from 1.05 to 1.12 over the segment
  const kenBurnsScale = interpolate(local, [0, durationFrames], [1.05, 1.12], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // Fade to black at end of segment
  const fadeToBlack = interpolate(
    local,
    [durationFrames - 12, durationFrames],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )

  return (
    <Sequence from={startFrame} durationInFrames={durationFrames}>
      <AbsoluteFill style={{ background: '#000000', overflow: 'hidden' }}>
        {/* Full-bleed image with Ken Burns */}
        {seg.imageUrl && (
          <AbsoluteFill
            style={{
              transform: `scale(${kenBurnsScale})`,
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

        {/* Dark overlay for text legibility */}
        <AbsoluteFill
          style={{
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 100%)',
          }}
        />

        {/* Letterbox top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: LETTERBOX_HEIGHT,
            background: '#000000',
          }}
        />

        {/* Letterbox bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: LETTERBOX_HEIGHT,
            background: '#000000',
          }}
        />

        {/* Centered text in middle zone */}
        <AbsoluteFill
          style={{
            top: LETTERBOX_HEIGHT,
            bottom: LETTERBOX_HEIGHT,
            left: 0,
            right: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 120px',
          }}
        >
          <div
            style={{
              textAlign: 'center',
              opacity,
            }}
          >
            <div
              style={{
                fontSize: 56,
                fontWeight: 400,
                color: '#f5f0e8',
                lineHeight: 1.45,
                fontFamily: 'Georgia, "Times New Roman", serif',
                textShadow: '0 2px 12px rgba(0,0,0,0.7)',
                letterSpacing: 0.5,
              }}
            >
              {seg.text}
            </div>
            {seg.subtitle && (
              <div
                style={{
                  marginTop: 24,
                  fontSize: 32,
                  color: '#c9b99a',
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontStyle: 'italic',
                  textShadow: '0 1px 6px rgba(0,0,0,0.6)',
                }}
              >
                {seg.subtitle}
              </div>
            )}
          </div>
        </AbsoluteFill>

        {/* Fade to black overlay */}
        <AbsoluteFill
          style={{
            background: `rgba(0,0,0,${fadeToBlack})`,
            pointerEvents: 'none',
          }}
        />

        {seg.audioUrl && <Audio src={seg.audioUrl} />}
      </AbsoluteFill>
    </Sequence>
  )
}

export function StoryTemplate({ segments }: VideoProps) {
  const segFrames = getSegmentFrames(segments, FPS)

  return (
    <AbsoluteFill style={{ background: '#000000' }}>
      {segFrames.map((seg) => (
        <StorySegment
          key={seg.id}
          seg={seg}
          startFrame={seg.startFrame}
          durationFrames={seg.durationFrames}
        />
      ))}
    </AbsoluteFill>
  )
}