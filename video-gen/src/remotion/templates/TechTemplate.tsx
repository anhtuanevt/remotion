'use client'
import { useCurrentFrame, interpolate, Sequence, AbsoluteFill, Audio, Img } from 'remotion'
import type { VideoProps, Segment } from '@/types'
import { getSegmentFrames, useSegmentAnimation } from '../helpers'

const FPS = 30

function TechSegment({
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

  // Character-by-character reveal
  const totalChars = seg.text.length
  const charsRevealed = Math.floor(
    interpolate(local, [0, Math.min(durationFrames * 0.65, totalChars * 3)], [0, totalChars], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  )
  const displayText = seg.text.slice(0, charsRevealed)
  const cursorVisible = Math.round(local / 15) % 2 === 0

  return (
    <Sequence from={startFrame} durationInFrames={durationFrames}>
      <AbsoluteFill
        style={{
          background: '#0d1117',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: '"Courier New", Courier, monospace',
        }}
      >
        {/* Background image (dimmed) */}
        {seg.imageUrl && (
          <AbsoluteFill>
            <Img
              src={seg.imageUrl}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: 0.08,
              }}
            />
          </AbsoluteFill>
        )}

        {/* Terminal window frame */}
        <div
          style={{
            width: '85%',
            maxWidth: 1400,
            background: '#161b22',
            borderRadius: 12,
            border: '1px solid #30363d',
            overflow: 'hidden',
            opacity,
            boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
          }}
        >
          {/* Title bar */}
          <div
            style={{
              background: '#21262d',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              borderBottom: '1px solid #30363d',
            }}
          >
            {/* Three colored dots */}
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: '#ff5f57',
              }}
            />
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: '#febc2e',
              }}
            />
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: '#28c840',
              }}
            />
            <div
              style={{
                marginLeft: 12,
                color: '#8b949e',
                fontSize: 22,
                fontFamily: '"Courier New", Courier, monospace',
              }}
            >
              terminal — video-gen
            </div>
          </div>

          {/* Terminal body */}
          <div style={{ padding: '40px 48px', minHeight: 400 }}>
            {/* Prompt line */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                marginBottom: 24,
              }}
            >
              <span style={{ color: '#3fb950', fontSize: 36, flexShrink: 0 }}>
                $
              </span>
              <span style={{ color: '#58a6ff', fontSize: 36 }}>
                speak
              </span>
            </div>

            {/* Main text output */}
            <div
              style={{
                fontSize: 40,
                color: '#e6edf3',
                lineHeight: 1.7,
                wordBreak: 'break-word',
              }}
            >
              {displayText}
              {/* Blinking cursor */}
              <span
                style={{
                  display: 'inline-block',
                  width: 20,
                  height: '1.1em',
                  background: '#58a6ff',
                  marginLeft: 4,
                  verticalAlign: 'text-bottom',
                  opacity: cursorVisible ? 1 : 0,
                }}
              />
            </div>

            {/* Subtitle / info line */}
            {seg.subtitle && (
              <div
                style={{
                  marginTop: 32,
                  fontSize: 32,
                  color: '#8b949e',
                  borderLeft: '3px solid #3fb950',
                  paddingLeft: 20,
                }}
              >
                {seg.subtitle}
              </div>
            )}
          </div>
        </div>

        {seg.audioUrl && <Audio src={seg.audioUrl} />}
      </AbsoluteFill>
    </Sequence>
  )
}

export function TechTemplate({ segments }: VideoProps) {
  const segFrames = getSegmentFrames(segments, FPS)

  return (
    <AbsoluteFill style={{ background: '#0d1117' }}>
      {segFrames.map((seg) => (
        <TechSegment
          key={seg.id}
          seg={seg}
          startFrame={seg.startFrame}
          durationFrames={seg.durationFrames}
        />
      ))}
    </AbsoluteFill>
  )
}