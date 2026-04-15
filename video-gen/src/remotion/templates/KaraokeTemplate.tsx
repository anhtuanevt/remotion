'use client'
import { useCurrentFrame, interpolate, Sequence, AbsoluteFill, Audio } from 'remotion'
import type { VideoProps, Segment } from '@/types'
import { getSegmentFrames } from '../helpers'

const FPS = 30

function KaraokeSegment({ seg, startFrame, durationFrames }: {
  seg: Segment; startFrame: number; durationFrames: number
}) {
  const frame = useCurrentFrame()
  const local = frame - startFrame

  const words = seg.text.split(' ')
  // Each word highlights in sequence across 80% of the segment duration
  const totalHighlightFrames = durationFrames * 0.8

  const bgPulse = interpolate(
    Math.sin((local * Math.PI * 2) / 60),
    [-1, 1], [0.92, 1.0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )

  const overallOpacity = interpolate(local, [0, 10, durationFrames - 10, durationFrames],
    [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <Sequence from={startFrame} durationInFrames={durationFrames}>
      <AbsoluteFill style={{
        background: '#0f0f23',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Arial Black, Arial, sans-serif',
        overflow: 'hidden',
      }}>
        {/* Animated bg circles */}
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            position: 'absolute',
            width: 500 + i * 200,
            height: 500 + i * 200,
            borderRadius: '50%',
            border: `2px solid rgba(168,85,247,${0.08 - i * 0.02})`,
            transform: `scale(${bgPulse + i * 0.02})`,
          }} />
        ))}

        {/* Subtitle / song title top */}
        {seg.subtitle && (
          <div style={{
            position: 'absolute', top: 100,
            fontSize: 34, color: 'rgba(168,85,247,0.8)',
            letterSpacing: 4, textTransform: 'uppercase',
            fontFamily: 'Arial, sans-serif', fontWeight: 600,
            opacity: overallOpacity,
          }}>
            {seg.subtitle}
          </div>
        )}

        {/* Words with karaoke highlight */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
          gap: '0 16px', padding: '0 60px', opacity: overallOpacity,
          maxWidth: 900,
        }}>
          {words.map((word, i) => {
            const wordStart = (i / words.length) * totalHighlightFrames
            const wordEnd   = ((i + 1) / words.length) * totalHighlightFrames
            const highlighted = local >= wordStart
            const activeNow   = local >= wordStart && local < wordEnd

            const wordScale = activeNow
              ? interpolate(local, [wordStart, wordStart + 6], [0.9, 1.12], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
              : highlighted ? 1.0 : 0.95

            return (
              <span key={i} style={{
                display: 'inline-block',
                fontSize: 68, fontWeight: 900,
                lineHeight: 1.35,
                transform: `scale(${wordScale})`,
                color: highlighted ? '#fff' : 'rgba(255,255,255,0.25)',
                textShadow: activeNow ? '0 0 30px rgba(168,85,247,0.9), 0 0 60px rgba(168,85,247,0.4)' : 'none',
                transition: 'color 0.1s',
                WebkitTextStroke: activeNow ? '1px rgba(168,85,247,0.6)' : undefined,
              }}>
                {word}
              </span>
            )
          })}
        </div>

        {/* Progress bar bottom */}
        <div style={{
          position: 'absolute', bottom: 180, left: 60, right: 60,
          height: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 3,
        }}>
          <div style={{
            height: '100%', borderRadius: 3,
            width: `${(local / durationFrames) * 100}%`,
            background: 'linear-gradient(to right, #a855f7, #ec4899)',
          }} />
        </div>

        {seg.audioUrl && <Audio src={seg.audioUrl} />}
      </AbsoluteFill>
    </Sequence>
  )
}

export function KaraokeTemplate({ segments }: VideoProps) {
  const segFrames = getSegmentFrames(segments, FPS)
  return (
    <AbsoluteFill style={{ background: '#0f0f23' }}>
      {segFrames.map(seg => (
        <KaraokeSegment key={seg.id} seg={seg} startFrame={seg.startFrame}
          durationFrames={seg.durationFrames} />
      ))}
    </AbsoluteFill>
  )
}