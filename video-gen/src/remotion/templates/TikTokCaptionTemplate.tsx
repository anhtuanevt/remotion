'use client'
import { useCurrentFrame, interpolate, Easing, Sequence, AbsoluteFill, Audio, Img } from 'remotion'
import type { VideoProps, Segment } from '@/types'
import { getSegmentFrames } from '../helpers'

const FPS = 30

// TikTok yellow-pill auto-caption style
function CaptionWord({
  word, isActive, isPast,
}: { word: string; isActive: boolean; isPast: boolean }) {
  return (
    <span
      style={{
        display: 'inline-block',
        margin: '0 6px 10px 6px',
        padding: isActive ? '6px 18px' : '6px 2px',
        background: isActive ? '#FFFC00' : 'transparent',
        borderRadius: isActive ? 10 : 0,
        fontSize: 74,
        fontWeight: 900,
        fontFamily: '"Arial Black", Arial, sans-serif',
        color: isActive ? '#000' : isPast ? 'rgba(255,255,255,0.55)' : '#fff',
        textShadow: !isActive
          ? '0 3px 10px rgba(0,0,0,1), 0 0 24px rgba(0,0,0,0.8)'
          : 'none',
        lineHeight: 1.15,
        letterSpacing: -1,
        transform: isActive ? 'scale(1.08)' : 'scale(1)',
        transformOrigin: 'center bottom',
        transition: 'transform 0.05s',
      }}
    >
      {word}
    </span>
  )
}

function TikTokCaptionSegment({
  seg, startFrame, durationFrames,
}: { seg: Segment; startFrame: number; durationFrames: number }) {
  const frame = useCurrentFrame()
  const local = frame - startFrame

  const words = seg.text.split(' ')
  // Highlight spans 85% of segment so last word doesn't linger
  const highlightFrames = durationFrames * 0.85
  const currentWordIndex = Math.min(
    Math.floor((local / highlightFrames) * words.length),
    words.length - 1,
  )

  // Ken Burns slow zoom
  const bgScale = interpolate(local, [0, durationFrames], [1.0, 1.07], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })

  // Segment fade in/out
  const opacity = interpolate(
    local, [0, 8, durationFrames - 8, durationFrames], [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  )

  // Captions slide up on entry
  const captionY = interpolate(local, [0, 14], [48, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  })

  return (
    <Sequence from={startFrame} durationInFrames={durationFrames}>
      <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
        {/* Background image */}
        {seg.imageUrl && (
          <AbsoluteFill style={{ transform: `scale(${bgScale})`, transformOrigin: 'center' }}>
            <Img
              src={seg.imageUrl}
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.72 }}
            />
          </AbsoluteFill>
        )}

        {/* Gradient bottom overlay so captions pop */}
        <AbsoluteFill style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.55) 30%, transparent 65%)',
        }} />

        {/* Captions — TikTok safe zone: above bottom UI (≈ 350px) */}
        <AbsoluteFill
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            alignItems: 'center',
            padding: '0 52px 390px 52px',
            opacity,
            transform: `translateY(${captionY}px)`,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'flex-end',
              maxWidth: 960,
            }}
          >
            {words.map((word, i) => (
              <CaptionWord
                key={i}
                word={word}
                isActive={i === currentWordIndex}
                isPast={i < currentWordIndex}
              />
            ))}
          </div>

          {/* Subtitle / speaker label */}
          {seg.subtitle && (
            <div
              style={{
                marginTop: 18,
                fontSize: 38,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.75)',
                fontFamily: 'Arial, sans-serif',
                textAlign: 'center',
                textShadow: '0 2px 8px rgba(0,0,0,0.9)',
              }}
            >
              {seg.subtitle}
            </div>
          )}
        </AbsoluteFill>

        {seg.audioUrl && <Audio src={seg.audioUrl} />}
      </AbsoluteFill>
    </Sequence>
  )
}

export function TikTokCaptionTemplate({ segments }: VideoProps) {
  const segFrames = getSegmentFrames(segments, FPS)
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      {segFrames.map(seg => (
        <TikTokCaptionSegment
          key={seg.id}
          seg={seg}
          startFrame={seg.startFrame}
          durationFrames={seg.durationFrames}
        />
      ))}
    </AbsoluteFill>
  )
}
