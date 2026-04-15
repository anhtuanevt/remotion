'use client'
import { useCurrentFrame, interpolate, Sequence, AbsoluteFill, Audio, Img } from 'remotion'
import type { VideoProps, Segment } from '@/types'
import { getSegmentFrames } from '../helpers'

const FPS = 30
const ACCENT_COLORS = ['#ff0050', '#00f2ea', '#ff6b35', '#a855f7', '#22c55e']

function ReelsSegment({ seg, startFrame, durationFrames, segIndex }: {
  seg: Segment; startFrame: number; durationFrames: number; segIndex: number
}) {
  const frame = useCurrentFrame()
  const local = frame - startFrame

  const slideIn = interpolate(local, [0, 18], [80, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const opacity = interpolate(local, [0, 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const fadeOut = interpolate(local, [durationFrames - 10, durationFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const scale   = interpolate(local, [0, durationFrames], [1.0, 1.06], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const accent = ACCENT_COLORS[segIndex % ACCENT_COLORS.length]
  const words = seg.text.split(' ')

  return (
    <Sequence from={startFrame} durationInFrames={durationFrames}>
      <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
        {seg.imageUrl && (
          <AbsoluteFill style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}>
            <Img src={seg.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
          </AbsoluteFill>
        )}

        {/* Gradient bottom */}
        <AbsoluteFill style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
        }} />

        {/* Accent top bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: accent }} />

        {/* Main text — bottom third */}
        <AbsoluteFill style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          padding: '0 52px 220px 52px',
          opacity: opacity * fadeOut,
          transform: `translateY(${slideIn}px)`,
        }}>
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 10,
            fontFamily: 'Arial Black, Arial, sans-serif',
          }}>
            {words.map((word, i) => (
              <span key={i} style={{
                fontSize: 72, fontWeight: 900, color: '#fff',
                lineHeight: 1.2,
                textShadow: '0 3px 16px rgba(0,0,0,0.9)',
                WebkitTextStroke: i % 5 === 0 ? `2px ${accent}` : undefined,
              }}>
                {word}
              </span>
            ))}
          </div>
          {seg.subtitle && (
            <div style={{
              marginTop: 20, fontSize: 40, color: 'rgba(255,255,255,0.8)',
              fontFamily: 'Arial, sans-serif', fontWeight: 500,
              textShadow: '0 2px 8px rgba(0,0,0,0.8)',
            }}>
              {seg.subtitle}
            </div>
          )}
        </AbsoluteFill>

        {/* Bottom safe area */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 160,
          background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 60, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.3)',
          }} />
        </div>

        {seg.audioUrl && <Audio src={seg.audioUrl} />}
      </AbsoluteFill>
    </Sequence>
  )
}

export function ReelsTemplate({ segments }: VideoProps) {
  const segFrames = getSegmentFrames(segments, FPS)
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      {segFrames.map((seg, i) => (
        <ReelsSegment key={seg.id} seg={seg} startFrame={seg.startFrame}
          durationFrames={seg.durationFrames} segIndex={i} />
      ))}
    </AbsoluteFill>
  )
}