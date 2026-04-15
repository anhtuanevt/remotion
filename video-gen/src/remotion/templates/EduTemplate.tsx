'use client'
import { useCurrentFrame, interpolate, Sequence, AbsoluteFill, Audio, Img } from 'remotion'
import type { VideoProps, Segment } from '@/types'
import { getSegmentFrames, useSegmentAnimation } from '../helpers'

const FPS = 30

function EduSegment({
  seg,
  startFrame,
  durationFrames,
  segIndex,
  totalSegments,
  currentFrame,
  totalFrames,
}: {
  seg: Segment
  startFrame: number
  durationFrames: number
  segIndex: number
  totalSegments: number
  currentFrame: number
  totalFrames: number
}) {
  const { opacity, slideUp } = useSegmentAnimation(startFrame, durationFrames)

  const progressWidth = totalFrames > 0 ? (currentFrame / totalFrames) * 100 : 0

  return (
    <Sequence from={startFrame} durationInFrames={durationFrames}>
      <AbsoluteFill style={{ background: '#ffffff', fontFamily: 'Arial, sans-serif' }}>
        {/* Top progress bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: 6,
            width: `${progressWidth}%`,
            background: '#1a56db',
            zIndex: 10,
            transition: 'width 0.1s linear',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: 6,
            width: '100%',
            background: '#e2e8f0',
            zIndex: 9,
          }}
        />

        {/* Chapter label top-left */}
        <div
          style={{
            position: 'absolute',
            top: 28,
            left: 60,
            fontSize: 26,
            color: '#64748b',
            fontWeight: 500,
            letterSpacing: 1,
            zIndex: 10,
          }}
        >
          Phần {segIndex + 1} / {totalSegments}
        </div>

        {/* Main content area */}
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            paddingTop: 80,
          }}
        >
          {/* Left 55%: text */}
          <div
            style={{
              width: '55%',
              padding: '60px 60px 60px 60px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              opacity,
              transform: `translateY(${slideUp}px)`,
            }}
          >
            <div
              style={{
                fontSize: 56,
                fontWeight: 700,
                color: '#1a56db',
                lineHeight: 1.2,
                marginBottom: 28,
              }}
            >
              {seg.text}
            </div>
            {seg.subtitle && (
              <div
                style={{
                  fontSize: 32,
                  color: '#1e293b',
                  lineHeight: 1.6,
                }}
              >
                {seg.subtitle}
              </div>
            )}
          </div>

          {/* Right 45%: image */}
          {seg.imageUrl && (
            <div
              style={{
                width: '45%',
                padding: '60px 60px 60px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Img
                src={seg.imageUrl}
                style={{
                  width: '100%',
                  height: '480px',
                  objectFit: 'cover',
                  borderRadius: 20,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  opacity,
                }}
              />
            </div>
          )}
        </div>

        {/* Audio */}
        {seg.audioUrl && <Audio src={seg.audioUrl} />}
      </AbsoluteFill>
    </Sequence>
  )
}

export function EduTemplate({ segments }: VideoProps) {
  const segFrames = getSegmentFrames(segments, FPS)
  const totalFrames = segFrames.reduce((acc, s) => acc + s.durationFrames, 0)
  const frame = useCurrentFrame()

  return (
    <AbsoluteFill style={{ background: '#ffffff' }}>
      {segFrames.map((seg, i) => (
        <EduSegment
          key={seg.id}
          seg={seg}
          startFrame={seg.startFrame}
          durationFrames={seg.durationFrames}
          segIndex={i}
          totalSegments={segFrames.length}
          currentFrame={frame}
          totalFrames={totalFrames}
        />
      ))}
    </AbsoluteFill>
  )
}