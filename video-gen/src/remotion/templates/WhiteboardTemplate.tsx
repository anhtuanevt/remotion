'use client'
import { useCurrentFrame, interpolate, Sequence, AbsoluteFill, Audio, Img } from 'remotion'
import type { VideoProps, Segment } from '@/types'
import { getSegmentFrames, useSegmentAnimation } from '../helpers'

const FPS = 30

function SVGUnderline({
  width,
  drawProgress,
}: {
  width: number
  drawProgress: number
}) {
  const dashLength = width + 20
  const dashOffset = dashLength * (1 - drawProgress)

  return (
    <svg
      width={width}
      height={24}
      style={{ display: 'block', marginTop: 4 }}
      overflow="visible"
    >
      <path
        d={`M 0 12 Q ${width / 2} 20 ${width} 12`}
        stroke="#e11d48"
        strokeWidth={4}
        fill="none"
        strokeDasharray={dashLength}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
      />
    </svg>
  )
}

function SVGDivider({ visible }: { visible: boolean }) {
  const dashLength = 1600
  const dashOffset = visible ? 0 : dashLength

  return (
    <svg width="80%" height="20" style={{ margin: '32px 0' }}>
      <line
        x1="0"
        y1="10"
        x2="100%"
        y2="10"
        stroke="#a8a29e"
        strokeWidth={2}
        strokeDasharray={dashLength}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.5s' }}
      />
    </svg>
  )
}

function WhiteboardSegment({
  seg,
  startFrame,
  durationFrames,
  segIndex,
}: {
  seg: Segment
  startFrame: number
  durationFrames: number
  segIndex: number
}) {
  const { opacity } = useSegmentAnimation(startFrame, durationFrames)
  const frame = useCurrentFrame()
  const local = frame - startFrame

  // SVG underline draws in under key phrase
  const underlineProgress = interpolate(local, [10, 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // Key phrase = first sentence or first ~40 chars
  const keyPhrase = seg.text.length > 40 ? seg.text.slice(0, 40) : seg.text
  // Approx width based on character count (monospace ~28px per char)
  const underlineWidth = Math.min(keyPhrase.length * 30, 1600)

  return (
    <Sequence from={startFrame} durationInFrames={durationFrames}>
      <AbsoluteFill
        style={{
          background: '#fafaf9',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: '"Courier New", Courier, monospace',
          padding: '80px 120px',
        }}
      >
        {/* SVG divider between segments (not for first) */}
        {segIndex > 0 && (
          <div style={{ position: 'absolute', top: 80, left: '10%', right: '10%' }}>
            <SVGDivider visible={local > 5} />
          </div>
        )}

        {/* Image if present */}
        {seg.imageUrl && (
          <div
            style={{
              width: 480,
              height: 300,
              borderRadius: 8,
              overflow: 'hidden',
              marginBottom: 48,
              border: '2px solid #d6d3d1',
              opacity,
            }}
          >
            <Img
              src={seg.imageUrl}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )}

        {/* Main text with underline under key phrase */}
        <div
          style={{
            textAlign: 'center',
            opacity,
            maxWidth: 1400,
          }}
        >
          {/* Key phrase with SVG underline */}
          <div style={{ display: 'inline-block', position: 'relative' }}>
            <div
              style={{
                fontSize: 52,
                fontWeight: 700,
                color: '#1c1917',
                lineHeight: 1.4,
              }}
            >
              {keyPhrase}
            </div>
            <SVGUnderline width={underlineWidth} drawProgress={underlineProgress} />
          </div>

          {/* Remainder of text */}
          {seg.text.length > 40 && (
            <div
              style={{
                marginTop: 24,
                fontSize: 52,
                fontWeight: 400,
                color: '#1c1917',
                lineHeight: 1.4,
              }}
            >
              {seg.text.slice(40)}
            </div>
          )}

          {seg.subtitle && (
            <div
              style={{
                marginTop: 32,
                fontSize: 36,
                color: '#78716c',
                fontStyle: 'italic',
                lineHeight: 1.5,
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

export function WhiteboardTemplate({ segments }: VideoProps) {
  const segFrames = getSegmentFrames(segments, FPS)

  return (
    <AbsoluteFill style={{ background: '#fafaf9' }}>
      {segFrames.map((seg, i) => (
        <WhiteboardSegment
          key={seg.id}
          seg={seg}
          startFrame={seg.startFrame}
          durationFrames={seg.durationFrames}
          segIndex={i}
        />
      ))}
    </AbsoluteFill>
  )
}