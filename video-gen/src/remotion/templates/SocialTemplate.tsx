'use client'
import { useCurrentFrame, interpolate, Sequence, AbsoluteFill, Audio, Img } from 'remotion'
import type { VideoProps, Segment } from '@/types'
import { getSegmentFrames, useSegmentAnimation } from '../helpers'

const FPS = 30
const GRADIENT_COLORS = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff']

function WordPopIn({
  word,
  wordIndex,
  localFrame,
}: {
  word: string
  wordIndex: number
  localFrame: number
}) {
  const delay = wordIndex * 6
  const scale = interpolate(localFrame, [delay, delay + 8, delay + 12], [0, 1.2, 1.0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const wordOpacity = interpolate(localFrame, [delay, delay + 6], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <span
      style={{
        display: 'inline-block',
        transform: `scale(${scale})`,
        opacity: wordOpacity,
        margin: '0 8px',
      }}
    >
      {word}
    </span>
  )
}

function SocialSegment({
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
  const words = seg.text.split(' ')

  return (
    <Sequence from={startFrame} durationInFrames={durationFrames}>
      <AbsoluteFill style={{ background: '#000000', overflow: 'hidden' }}>
        {/* Full-bleed vertical image */}
        {seg.imageUrl && (
          <AbsoluteFill>
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

        {/* Dark gradient overlay bottom half for text */}
        <AbsoluteFill
          style={{
            background:
              'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.85) 100%)',
          }}
        />

        {/* Gradient color bar top: 8px height */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            background: `linear-gradient(to right, ${GRADIENT_COLORS.join(', ')})`,
            zIndex: 10,
          }}
        />

        {/* Caption center-bottom: words pop in */}
        <AbsoluteFill
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '0 60px 180px 60px',
          }}
        >
          <div
            style={{
              textAlign: 'center',
              fontSize: 72,
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.3,
              fontFamily: 'Arial, sans-serif',
              textShadow: '0 2px 12px rgba(0,0,0,0.9)',
              flexWrap: 'wrap',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            {words.map((word, i) => (
              <WordPopIn key={i} word={word} wordIndex={i} localFrame={local} />
            ))}
          </div>

          {seg.subtitle && (
            <div
              style={{
                marginTop: 24,
                fontSize: 44,
                color: 'rgba(255,255,255,0.85)',
                textAlign: 'center',
                fontFamily: 'Arial, sans-serif',
                opacity,
              }}
            >
              {seg.subtitle}
            </div>
          )}
        </AbsoluteFill>

        {/* Hashtag strip at very bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 100,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 24,
            padding: '0 40px',
          }}
        >
          {['#viral', '#trending', '#reels', '#shorts', '#fyp'].map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: 34,
                color: '#60a5fa',
                fontFamily: 'Arial, sans-serif',
                fontWeight: 600,
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {seg.audioUrl && <Audio src={seg.audioUrl} />}
      </AbsoluteFill>
    </Sequence>
  )
}

export function SocialTemplate({ segments }: VideoProps) {
  const segFrames = getSegmentFrames(segments, FPS)

  return (
    <AbsoluteFill style={{ background: '#000000' }}>
      {segFrames.map((seg) => (
        <SocialSegment
          key={seg.id}
          seg={seg}
          startFrame={seg.startFrame}
          durationFrames={seg.durationFrames}
        />
      ))}
    </AbsoluteFill>
  )
}