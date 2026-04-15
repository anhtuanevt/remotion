'use client'
import { useCurrentFrame, interpolate, Easing, Sequence, AbsoluteFill, Audio, Img } from 'remotion'
import type { VideoProps, Segment } from '@/types'
import { getSegmentFrames } from '../helpers'

const FPS = 30

// MrBeast-style color palette: high energy, maximum contrast
const WORD_COLORS = ['#FFFC00', '#FF3B00', '#00E5FF', '#76FF03', '#FF4081', '#ffffff']

function AnimatedWord({
  word, index, totalWords, localFrame, durationFrames,
}: {
  word: string
  index: number
  totalWords: number
  localFrame: number
  durationFrames: number
}) {
  // Each word pops in staggered across 60% of segment
  const popDelay = (index / totalWords) * (durationFrames * 0.62)
  const wLocal = localFrame - popDelay

  // Spring bounce: shoot past → settle
  const scale =
    wLocal < 0
      ? 0
      : interpolate(wLocal, [0, 5, 11, 17], [0, 1.38, 0.86, 1.0], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
        })

  const opacity =
    wLocal < 0
      ? 0
      : interpolate(wLocal, [0, 3], [0, 1], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
        })

  // Slight upward drift after pop
  const translateY =
    wLocal < 0
      ? 30
      : interpolate(wLocal, [0, 17], [30, 0], {
          extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
          easing: Easing.out(Easing.cubic),
        })

  const color = WORD_COLORS[index % WORD_COLORS.length]
  // Every 3rd word is slightly larger for rhythm
  const fontSize = index % 3 === 0 ? 96 : 80

  return (
    <span
      style={{
        display: 'inline-block',
        margin: '0 8px 14px 8px',
        fontSize,
        fontWeight: 900,
        fontFamily: '"Arial Black", Arial, sans-serif',
        color,
        textTransform: 'uppercase',
        transform: `scale(${scale}) translateY(${translateY}px)`,
        opacity,
        textShadow: `0 5px 0 rgba(0,0,0,0.85), 0 0 28px ${color}55`,
        WebkitTextStroke: '2px rgba(0,0,0,0.6)',
        lineHeight: 1.1,
        letterSpacing: -2,
      }}
    >
      {word}
    </span>
  )
}

function WordPopSegment({
  seg, startFrame, durationFrames,
}: { seg: Segment; startFrame: number; durationFrames: number }) {
  const frame = useCurrentFrame()
  const local = frame - startFrame

  const words = seg.text.split(' ')

  // Background slow zoom
  const bgScale = interpolate(local, [0, durationFrames], [1.0, 1.05], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })

  // Fade out end
  const segOpacity = interpolate(local, [durationFrames - 8, durationFrames], [1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })

  // White flash on cut (3 frames)
  const flashOpacity = interpolate(local, [0, 3, 6], [0.45, 0.1, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })

  return (
    <Sequence from={startFrame} durationInFrames={durationFrames}>
      <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
        {/* Background image, dimmed for text readability */}
        {seg.imageUrl && (
          <AbsoluteFill style={{ transform: `scale(${bgScale})`, transformOrigin: 'center' }}>
            <Img
              src={seg.imageUrl}
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.3 }}
            />
          </AbsoluteFill>
        )}

        {/* Dark vignette */}
        <AbsoluteFill style={{
          background:
            'radial-gradient(ellipse 90% 90% at 50% 50%, transparent 20%, rgba(0,0,0,0.72) 100%)',
        }} />

        {/* White flash on cut */}
        <AbsoluteFill style={{ background: `rgba(255,255,255,${flashOpacity})` }} />

        {/* Word cloud */}
        <AbsoluteFill
          style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '120px 60px',
            opacity: segOpacity,
          }}
        >
          <div style={{
            display: 'flex', flexWrap: 'wrap',
            justifyContent: 'center', alignItems: 'center',
            maxWidth: 960,
          }}>
            {words.map((word, i) => (
              <AnimatedWord
                key={i}
                word={word}
                index={i}
                totalWords={words.length}
                localFrame={local}
                durationFrames={durationFrames}
              />
            ))}
          </div>

          {seg.subtitle && (
            <div style={{
              marginTop: 36,
              fontSize: 44,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.8)',
              fontFamily: 'Arial, sans-serif',
              textAlign: 'center',
              textShadow: '0 2px 10px rgba(0,0,0,0.9)',
            }}>
              {seg.subtitle}
            </div>
          )}
        </AbsoluteFill>

        {seg.audioUrl && <Audio src={seg.audioUrl} />}
      </AbsoluteFill>
    </Sequence>
  )
}

export function WordPopTemplate({ segments }: VideoProps) {
  const segFrames = getSegmentFrames(segments, FPS)
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      {segFrames.map(seg => (
        <WordPopSegment
          key={seg.id}
          seg={seg}
          startFrame={seg.startFrame}
          durationFrames={seg.durationFrames}
        />
      ))}
    </AbsoluteFill>
  )
}
