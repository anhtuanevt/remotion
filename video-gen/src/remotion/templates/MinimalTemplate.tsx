'use client'
import { useCurrentFrame, interpolate, Sequence, AbsoluteFill, Audio, Img } from 'remotion'
import type { VideoProps, Segment } from '@/types'
import { getSegmentFrames, useSegmentAnimation } from '../helpers'

const FPS = 30

function MinimalSegment({
  seg,
  startFrame,
  durationFrames,
  segIndex,
  totalSegments,
}: {
  seg: Segment
  startFrame: number
  durationFrames: number
  segIndex: number
  totalSegments: number
}) {
  const { opacity } = useSegmentAnimation(startFrame, durationFrames)

  // Split text: first word highlighted
  const words = seg.text.split(' ')
  const firstWord = words[0] ?? ''
  const restWords = words.slice(1).join(' ')

  return (
    <Sequence from={startFrame} durationInFrames={durationFrames}>
      <AbsoluteFill
        style={{
          background: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        {/* Centered text */}
        <div
          style={{
            textAlign: 'center',
            maxWidth: 1400,
            padding: '0 100px',
            opacity,
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontWeight: 300,
              color: '#171717',
              lineHeight: 1.4,
            }}
          >
            <span style={{ color: '#2563eb', fontWeight: 600 }}>
              {firstWord}
            </span>
            {restWords ? ` ${restWords}` : ''}
          </div>

          {seg.subtitle && (
            <div
              style={{
                marginTop: 32,
                fontSize: 36,
                fontWeight: 300,
                color: '#525252',
                lineHeight: 1.6,
              }}
            >
              {seg.subtitle}
            </div>
          )}
        </div>

        {/* Progress dots bottom center */}
        <div
          style={{
            position: 'absolute',
            bottom: 60,
            display: 'flex',
            gap: 16,
            alignItems: 'center',
          }}
        >
          {Array.from({ length: totalSegments }, (_, i) => (
            <div
              key={i}
              style={{
                width: i === segIndex ? 32 : 12,
                height: 12,
                borderRadius: 6,
                background: i === segIndex ? '#2563eb' : '#d4d4d4',
                transition: 'all 0.3s',
              }}
            />
          ))}
        </div>

        {seg.audioUrl && <Audio src={seg.audioUrl} />}
      </AbsoluteFill>
    </Sequence>
  )
}

export function MinimalTemplate({ segments }: VideoProps) {
  const segFrames = getSegmentFrames(segments, FPS)

  return (
    <AbsoluteFill style={{ background: '#ffffff' }}>
      {segFrames.map((seg, i) => (
        <MinimalSegment
          key={seg.id}
          seg={seg}
          startFrame={seg.startFrame}
          durationFrames={seg.durationFrames}
          segIndex={i}
          totalSegments={segFrames.length}
        />
      ))}
    </AbsoluteFill>
  )
}