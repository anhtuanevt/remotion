'use client'
import { useCurrentFrame, interpolate, Sequence, AbsoluteFill, Audio, Img } from 'remotion'
import type { VideoProps, Segment } from '@/types'
import { getSegmentFrames } from '../helpers'

const FPS = 30
const SPLITS = [
  { topBg: '#1e3a5f', bottomBg: '#0f172a', accent: '#38bdf8' },
  { topBg: '#3b1a1a', bottomBg: '#1a0a0a', accent: '#f87171' },
  { topBg: '#1a3b1a', bottomBg: '#0a1a0a', accent: '#4ade80' },
  { topBg: '#2e1a3b', bottomBg: '#1a0a2e', accent: '#c084fc' },
  { topBg: '#3b2e1a', bottomBg: '#2e1a0a', accent: '#fb923c' },
]

function SplitVSegment({ seg, startFrame, durationFrames, segIndex }: {
  seg: Segment; startFrame: number; durationFrames: number; segIndex: number
}) {
  const frame = useCurrentFrame()
  const local = frame - startFrame

  const split = SPLITS[segIndex % SPLITS.length]

  // Split line position: starts at middle, stays
  const dividerY = 55 // percent

  const topSlide = interpolate(local, [0, 20], [-80, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const botSlide = interpolate(local, [0, 20], [80, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const opacity  = interpolate(local, [0, 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const fadeOut  = interpolate(local, [durationFrames - 10, durationFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // Divider stripe width pulses
  const dividerH = interpolate(local, [18, 28], [0, 8], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <Sequence from={startFrame} durationInFrames={durationFrames}>
      <AbsoluteFill style={{ overflow: 'hidden', opacity: opacity * fadeOut }}>
        {/* TOP HALF — image */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: `${dividerY}%`,
          background: split.topBg, overflow: 'hidden',
          transform: `translateY(${topSlide}px)`,
        }}>
          {seg.imageUrl ? (
            <Img src={seg.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              background: `linear-gradient(160deg, ${split.accent}30, ${split.topBg})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 120,
            }}>
              📸
            </div>
          )}
          {/* Gradient fade bottom of top half */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%',
            background: `linear-gradient(to bottom, transparent, ${split.topBg}dd)`,
          }} />

          {/* Segment number top-left */}
          <div style={{
            position: 'absolute', top: 52, left: 48,
            fontSize: 36, fontWeight: 900, color: split.accent,
            fontFamily: 'Arial Black, Arial, sans-serif',
            textShadow: `0 0 16px ${split.accent}80`,
            letterSpacing: 2,
          }}>
            0{segIndex + 1}
          </div>
        </div>

        {/* DIVIDER LINE */}
        <div style={{
          position: 'absolute', top: `${dividerY}%`,
          left: 0, right: 0, height: dividerH,
          background: split.accent,
          boxShadow: `0 0 24px ${split.accent}`,
          zIndex: 2,
        }} />

        {/* BOTTOM HALF — text */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: `${100 - dividerY}%`,
          background: split.bottomBg,
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center',
          padding: '32px 48px',
          transform: `translateY(${botSlide}px)`,
          fontFamily: 'Arial, sans-serif',
        }}>
          {/* Accent dot */}
          <div style={{
            width: 16, height: 16, borderRadius: '50%',
            background: split.accent, marginBottom: 20,
            boxShadow: `0 0 12px ${split.accent}`,
          }} />

          <div style={{
            fontSize: 56, fontWeight: 800, color: '#fff',
            lineHeight: 1.3,
            textShadow: '0 2px 8px rgba(0,0,0,0.5)',
          }}>
            {seg.text}
          </div>

          {seg.subtitle && (
            <div style={{
              marginTop: 20, fontSize: 34, color: split.accent,
              lineHeight: 1.5, fontWeight: 500,
            }}>
              {seg.subtitle}
            </div>
          )}

          {/* Bottom accent bar */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 5,
            background: split.accent, opacity: 0.5,
          }} />
        </div>

        {seg.audioUrl && <Audio src={seg.audioUrl} />}
      </AbsoluteFill>
    </Sequence>
  )
}

export function SplitVTemplate({ segments }: VideoProps) {
  const segFrames = getSegmentFrames(segments, FPS)
  return (
    <AbsoluteFill style={{ background: '#0f172a' }}>
      {segFrames.map((seg, i) => (
        <SplitVSegment key={seg.id} seg={seg} startFrame={seg.startFrame}
          durationFrames={seg.durationFrames} segIndex={i} />
      ))}
    </AbsoluteFill>
  )
}
