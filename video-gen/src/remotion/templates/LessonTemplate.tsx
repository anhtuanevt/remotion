'use client'
import { useCurrentFrame, interpolate, Sequence, AbsoluteFill, Audio, Img } from 'remotion'
import type { VideoProps, Segment } from '@/types'
import { getSegmentFrames } from '../helpers'

const FPS = 30

function StepDot({ index, active, done, accent }: {
  index: number; active: boolean; done: boolean; accent: string
}) {
  return (
    <div style={{
      width: 56, height: 56, borderRadius: '50%',
      background: done ? accent : active ? '#fff' : 'rgba(255,255,255,0.1)',
      border: `3px solid ${active || done ? accent : 'rgba(255,255,255,0.2)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      boxShadow: active ? `0 0 20px ${accent}80` : 'none',
      transition: 'all 0.3s',
    }}>
      <span style={{
        fontSize: 26, fontWeight: 800,
        color: done ? '#fff' : active ? accent : 'rgba(255,255,255,0.3)',
        fontFamily: 'Arial, sans-serif',
      }}>
        {done ? '✓' : index + 1}
      </span>
    </div>
  )
}

function LessonSegment({ seg, startFrame, durationFrames, segIndex, allSegments, allFrames }: {
  seg: Segment; startFrame: number; durationFrames: number
  segIndex: number; allSegments: Segment[]; allFrames: { startFrame: number; durationFrames: number }[]
}) {
  const frame = useCurrentFrame()
  const local = frame - startFrame

  const ACCENT_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899']
  const accent = ACCENT_COLORS[segIndex % ACCENT_COLORS.length]

  const slideIn = interpolate(local, [0, 20], [60, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const opacity = interpolate(local, [0, 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const fadeOut = interpolate(local, [durationFrames - 10, durationFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // Overall progress bar
  const totalFrames = allFrames.reduce((s, f) => s + f.durationFrames, 0)
  const elapsedFrames = allFrames.slice(0, segIndex).reduce((s, f) => s + f.durationFrames, 0) + local
  const totalProgress = totalFrames > 0 ? elapsedFrames / totalFrames : 0

  return (
    <Sequence from={startFrame} durationInFrames={durationFrames}>
      <AbsoluteFill style={{
        background: '#f8fafc',
        fontFamily: 'Arial, sans-serif',
        overflow: 'hidden',
      }}>
        {/* Colored top band */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 8,
          background: accent,
        }} />

        {/* Progress bar */}
        <div style={{
          position: 'absolute', top: 8, left: 0, right: 0, height: 4,
          background: '#e2e8f0',
        }}>
          <div style={{
            height: '100%', background: accent, opacity: 0.4,
            width: `${totalProgress * 100}%`,
          }} />
        </div>

        {/* Header */}
        <div style={{
          position: 'absolute', top: 48, left: 52, right: 52,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{
            fontSize: 28, fontWeight: 700, color: accent,
            letterSpacing: 2, textTransform: 'uppercase',
          }}>
            Bài học
          </div>
          <div style={{
            fontSize: 28, color: '#94a3b8', fontWeight: 500,
          }}>
            {segIndex + 1} / {allSegments.length}
          </div>
        </div>

        {/* Step dots row */}
        <div style={{
          position: 'absolute', top: 100, left: 0, right: 0,
          display: 'flex', justifyContent: 'center', gap: 16,
          padding: '0 40px',
        }}>
          {allSegments.map((_, i) => (
            <StepDot
              key={i} index={i} accent={accent}
              active={i === segIndex} done={i < segIndex}
            />
          ))}
        </div>

        {/* Content card */}
        <AbsoluteFill style={{
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center',
          padding: '220px 52px 200px 52px',
          opacity: opacity * fadeOut,
          transform: `translateY(${slideIn}px)`,
        }}>
          {/* Image */}
          {seg.imageUrl && (
            <div style={{
              width: '100%', height: 360,
              borderRadius: 20, overflow: 'hidden',
              marginBottom: 44,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            }}>
              <Img src={seg.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}

          {/* Step accent */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 12,
            marginBottom: 20,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{segIndex + 1}</span>
            </div>
            <div style={{
              fontSize: 28, fontWeight: 700, color: accent, letterSpacing: 1,
            }}>
              Bước {segIndex + 1}
            </div>
          </div>

          {/* Main text */}
          <div style={{
            fontSize: 54, fontWeight: 700, color: '#1e293b',
            lineHeight: 1.4,
          }}>
            {seg.text}
          </div>

          {seg.subtitle && (
            <div style={{
              marginTop: 24, fontSize: 36, color: '#64748b',
              lineHeight: 1.6, borderLeft: `4px solid ${accent}`,
              paddingLeft: 20,
            }}>
              {seg.subtitle}
            </div>
          )}
        </AbsoluteFill>

        {/* Bottom bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
          background: accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            fontSize: 28, fontWeight: 700, color: 'rgba(255,255,255,0.9)',
            letterSpacing: 2,
          }}>
            {'★ '.repeat(Math.min(segIndex + 1, 5))}
          </div>
        </div>

        {seg.audioUrl && <Audio src={seg.audioUrl} />}
      </AbsoluteFill>
    </Sequence>
  )
}

export function LessonTemplate({ segments }: VideoProps) {
  const segFrames = getSegmentFrames(segments, FPS)
  return (
    <AbsoluteFill style={{ background: '#f8fafc' }}>
      {segFrames.map((seg, i) => (
        <LessonSegment
          key={seg.id} seg={seg}
          startFrame={seg.startFrame} durationFrames={seg.durationFrames}
          segIndex={i} allSegments={segments} allFrames={segFrames}
        />
      ))}
    </AbsoluteFill>
  )
}