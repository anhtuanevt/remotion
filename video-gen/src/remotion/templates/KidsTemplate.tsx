'use client'
import { useCurrentFrame, interpolate, Sequence, AbsoluteFill, Audio, Img } from 'remotion'
import type { VideoProps, Segment } from '@/types'
import { getSegmentFrames, useSegmentAnimation } from '../helpers'

const FPS = 30
const BG_COLORS = ['#fbbf24', '#34d399', '#60a5fa', '#f472b6']

function PolkaDots() {
  const dots = []
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 18; col++) {
      dots.push(
        <circle
          key={`${row}-${col}`}
          cx={col * 120 + 60}
          cy={row * 120 + 60}
          r={20}
          fill="white"
          opacity={0.1}
        />
      )
    }
  }
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: 'absolute', top: 0, left: 0 }}
    >
      {dots}
    </svg>
  )
}

function KidsSegment({
  seg,
  startFrame,
  durationFrames,
}: {
  seg: Segment
  startFrame: number
  durationFrames: number
}) {
  const frame = useCurrentFrame()
  const local = frame - startFrame

  // Bounce scale animation on enter
  const bounceScale = interpolate(local, [0, 8, 14, 18, 22], [0.5, 1.15, 0.92, 1.05, 1.0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // Fade out at end
  const opacity = interpolate(local, [durationFrames - 12, durationFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const bgColor = BG_COLORS[seg.order % BG_COLORS.length]

  return (
    <Sequence from={startFrame} durationInFrames={durationFrames}>
      <AbsoluteFill
        style={{
          background: bgColor,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Arial Rounded MT Bold, Arial, sans-serif',
          overflow: 'hidden',
        }}
      >
        {/* Polka dot SVG background */}
        <PolkaDots />

        {/* Image if present */}
        {seg.imageUrl && (
          <div
            style={{
              width: 400,
              height: 300,
              borderRadius: 24,
              overflow: 'hidden',
              marginBottom: 40,
              transform: `scale(${bounceScale})`,
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            }}
          >
            <Img
              src={seg.imageUrl}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )}

        {/* Main text: large, bouncy */}
        <div
          style={{
            textAlign: 'center',
            maxWidth: 1400,
            padding: '0 80px',
            opacity,
            transform: `scale(${bounceScale})`,
            transformOrigin: 'center center',
          }}
        >
          <div
            style={{
              fontSize: 80,
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1.25,
              textShadow: '0 4px 12px rgba(0,0,0,0.2)',
              letterSpacing: -1,
            }}
          >
            {seg.text}
          </div>
          {seg.subtitle && (
            <div
              style={{
                marginTop: 24,
                fontSize: 44,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.85)',
              }}
            >
              {seg.subtitle}
            </div>
          )}
        </div>

        {seg.audioUrl && <Audio src={seg.audioUrl} />}
      </AbsoluteFill>
    </Sequence>
  )
}

export function KidsTemplate({ segments }: VideoProps) {
  const segFrames = getSegmentFrames(segments, FPS)

  return (
    <AbsoluteFill style={{ background: BG_COLORS[0] }}>
      {segFrames.map((seg) => (
        <KidsSegment
          key={seg.id}
          seg={seg}
          startFrame={seg.startFrame}
          durationFrames={seg.durationFrames}
        />
      ))}
    </AbsoluteFill>
  )
}