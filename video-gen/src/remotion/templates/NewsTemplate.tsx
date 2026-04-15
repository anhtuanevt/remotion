'use client'
import { useCurrentFrame, interpolate, Sequence, AbsoluteFill, Audio, Img } from 'remotion'
import type { VideoProps, Segment } from '@/types'
import { getSegmentFrames, useSegmentAnimation } from '../helpers'

const FPS = 30

function NewsSegment({
  seg,
  startFrame,
  durationFrames,
  totalFrames,
}: {
  seg: Segment
  startFrame: number
  durationFrames: number
  totalFrames: number
}) {
  const { opacity, slideUp } = useSegmentAnimation(startFrame, durationFrames)
  const frame = useCurrentFrame()
  const local = frame - startFrame

  // Black flash between segments: 5 frames at start
  const flashOpacity = interpolate(local, [0, 5], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // Subtitle fades in 10 frames after headline
  const subtitleOpacity = interpolate(local, [10, 25], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // Scrolling ticker: one full scroll over the segment duration
  const tickerTranslate = interpolate(local, [0, durationFrames], [100, -100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <Sequence from={startFrame} durationInFrames={durationFrames}>
      <AbsoluteFill style={{ background: '#0a0a0a' }}>
        {/* Full-bleed dimmed image */}
        {seg.imageUrl && (
          <AbsoluteFill>
            <Img
              src={seg.imageUrl}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 0.35,
              }}
            />
          </AbsoluteFill>
        )}

        {/* Dark gradient overlay bottom 40% */}
        <AbsoluteFill
          style={{
            background:
              'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.95) 100%)',
          }}
        />

        {/* Bottom-third text area */}
        <AbsoluteFill
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '0 80px 120px 80px',
          }}
        >
          {/* Headline with red left bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 20,
              opacity,
              transform: `translateY(${slideUp}px)`,
            }}
          >
            {/* Red vertical bar */}
            <div
              style={{
                width: 4,
                minHeight: 72,
                background: '#e53e3e',
                borderRadius: 2,
                flexShrink: 0,
                marginTop: 6,
              }}
            />
            <div
              style={{
                fontSize: 64,
                fontWeight: 700,
                color: '#ffffff',
                lineHeight: 1.15,
                textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                fontFamily: 'Arial, sans-serif',
              }}
            >
              {seg.text}
            </div>
          </div>

          {/* Subtitle */}
          {seg.subtitle && (
            <div
              style={{
                fontSize: 36,
                color: '#9ca3af',
                marginTop: 16,
                marginLeft: 24,
                opacity: subtitleOpacity,
                fontFamily: 'Arial, sans-serif',
              }}
            >
              {seg.subtitle}
            </div>
          )}
        </AbsoluteFill>

        {/* Scrolling ticker bar at very bottom */}
        <AbsoluteFill
          style={{
            top: 'auto',
            bottom: 0,
            height: 52,
            background: '#e53e3e',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              transform: `translateX(${tickerTranslate}%)`,
              whiteSpace: 'nowrap',
              fontSize: 28,
              fontWeight: 600,
              color: '#ffffff',
              paddingLeft: 40,
              fontFamily: 'Arial, sans-serif',
              letterSpacing: 1,
            }}
          >
            {'BREAKING NEWS  •  '.repeat(6)} {seg.text}
          </div>
        </AbsoluteFill>

        {/* Black flash between segments */}
        {local < 5 && (
          <AbsoluteFill style={{ background: `rgba(0,0,0,${flashOpacity})` }} />
        )}

        {/* Audio */}
        {seg.audioUrl && <Audio src={seg.audioUrl} />}
      </AbsoluteFill>
    </Sequence>
  )
}

export function NewsTemplate({ segments }: VideoProps) {
  const segFrames = getSegmentFrames(segments, FPS)
  const totalFrames = segFrames.reduce((acc, s) => acc + s.durationFrames, 0)

  return (
    <AbsoluteFill style={{ background: '#0a0a0a' }}>
      {segFrames.map((seg) => (
        <NewsSegment
          key={seg.id}
          seg={seg}
          startFrame={seg.startFrame}
          durationFrames={seg.durationFrames}
          totalFrames={totalFrames}
        />
      ))}
    </AbsoluteFill>
  )
}