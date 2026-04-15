'use client'
import { useCurrentFrame, interpolate, Sequence, AbsoluteFill, Audio, Img } from 'remotion'
import type { VideoProps, Segment } from '@/types'
import { getSegmentFrames, useSegmentAnimation } from '../helpers'

const FPS = 30
const NUM_BARS = 8

function PodcastSegment({
  seg,
  startFrame,
  durationFrames,
  showTitle,
}: {
  seg: Segment
  startFrame: number
  durationFrames: number
  showTitle?: string
}) {
  const { opacity } = useSegmentAnimation(startFrame, durationFrames)
  const frame = useCurrentFrame()
  const local = frame - startFrame

  // Typewriter effect: reveal characters using interpolate
  const totalChars = seg.text.length
  const charsRevealed = Math.floor(
    interpolate(local, [0, Math.min(durationFrames * 0.7, totalChars * 2)], [0, totalChars], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  )
  const displayText = seg.text.slice(0, charsRevealed)

  // Waveform bars: animated sine waves
  const barHeights = Array.from({ length: NUM_BARS }, (_, i) => {
    const base = 20
    const amplitude = 40
    return base + amplitude * Math.abs(Math.sin((local * 0.15 + i * 0.8)))
  })

  return (
    <Sequence from={startFrame} durationInFrames={durationFrames}>
      <AbsoluteFill
        style={{
          background: '#18181b',
          fontFamily: 'Arial, sans-serif',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Show title persistent top */}
        {showTitle && (
          <div
            style={{
              position: 'absolute',
              top: 40,
              left: 0,
              right: 0,
              textAlign: 'center',
              fontSize: 28,
              fontWeight: 600,
              color: '#a855f7',
              letterSpacing: 3,
              textTransform: 'uppercase',
            }}
          >
            {showTitle}
          </div>
        )}

        {/* Large circle placeholder / image centered top half */}
        <div
          style={{
            marginTop: 120,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: '#27272a',
            border: '4px solid #a855f7',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {seg.imageUrl ? (
            <Img
              src={seg.imageUrl}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ fontSize: 120, lineHeight: 1 }}>🎙️</div>
          )}
        </div>

        {/* Text card center-bottom */}
        <div
          style={{
            marginTop: 48,
            background: '#27272a',
            borderRadius: 20,
            padding: '32px 48px',
            maxWidth: 1400,
            width: '80%',
            opacity,
          }}
        >
          <div
            style={{
              fontSize: 40,
              color: '#e4e4e7',
              lineHeight: 1.5,
              minHeight: 120,
            }}
          >
            {displayText}
            {/* Blinking cursor at end of typewriter */}
            <span
              style={{
                display: 'inline-block',
                width: 3,
                height: '1em',
                background: '#a855f7',
                marginLeft: 4,
                verticalAlign: 'middle',
                opacity: Math.round(local / 15) % 2 === 0 ? 1 : 0,
              }}
            />
          </div>
          {seg.subtitle && (
            <div
              style={{
                marginTop: 16,
                fontSize: 32,
                color: '#71717a',
              }}
            >
              {seg.subtitle}
            </div>
          )}
        </div>

        {/* Waveform bars bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            display: 'flex',
            gap: 12,
            alignItems: 'flex-end',
            height: 80,
          }}
        >
          {barHeights.map((h, i) => (
            <div
              key={i}
              style={{
                width: 16,
                height: h,
                background: '#a855f7',
                borderRadius: 8,
                opacity: 0.8,
              }}
            />
          ))}
        </div>

        {seg.audioUrl && <Audio src={seg.audioUrl} />}
      </AbsoluteFill>
    </Sequence>
  )
}

export function PodcastTemplate({ segments }: VideoProps) {
  const segFrames = getSegmentFrames(segments, FPS)
  const showTitle = segments[0]?.text?.split(' ').slice(0, 4).join(' ') ?? 'PODCAST'

  return (
    <AbsoluteFill style={{ background: '#18181b' }}>
      {segFrames.map((seg) => (
        <PodcastSegment
          key={seg.id}
          seg={seg}
          startFrame={seg.startFrame}
          durationFrames={seg.durationFrames}
          showTitle={showTitle}
        />
      ))}
    </AbsoluteFill>
  )
}