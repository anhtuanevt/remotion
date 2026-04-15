'use client'
import { useCurrentFrame, interpolate, Easing, Sequence, AbsoluteFill, Audio } from 'remotion'
import type { VideoProps, Segment } from '@/types'
import { getSegmentFrames } from '../helpers'

const FPS = 30

function Ring({ progress, size, stroke, color }: {
  progress: number; size: number; stroke: number; color: string
}) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - progress)
  return (
    <svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0 }}>
      {/* Track */}
      <circle cx={size/2} cy={size/2} r={r}
        fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} />
      {/* Progress arc */}
      <circle cx={size/2} cy={size/2} r={r}
        fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ filter: `drop-shadow(0 0 8px ${color})` }}
      />
    </svg>
  )
}

function CountdownSegment({ seg, startFrame, durationFrames, segIndex }: {
  seg: Segment; startFrame: number; durationFrames: number; segIndex: number
}) {
  const frame = useCurrentFrame()
  const local = frame - startFrame

  const COLORS = ['#f43f5e', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7']
  const color = COLORS[segIndex % COLORS.length]

  // Countdown: from durationFrames down to 0, whole seconds
  const secondsLeft = Math.ceil((durationFrames - local) / FPS)
  const ringProgress = local / durationFrames

  // Pulse on each new second
  const secondFraction = (local % FPS) / FPS
  const pulse = interpolate(secondFraction, [0, 0.08, 0.18], [1.15, 1.05, 1.0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })

  const enterOpacity = interpolate(local, [0, 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const fadeOut = interpolate(local, [durationFrames - 10, durationFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const titleSlide = interpolate(local, [0, 20], [40, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <Sequence from={startFrame} durationInFrames={durationFrames}>
      <AbsoluteFill style={{
        background: '#09090b',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Arial Black, Arial, sans-serif',
        opacity: enterOpacity * fadeOut,
      }}>
        {/* Glow bg circle */}
        <div style={{
          position: 'absolute',
          width: 700, height: 700, borderRadius: '50%',
          background: `radial-gradient(circle, ${color}15 0%, transparent 70%)`,
        }} />

        {/* Title / event name */}
        <div style={{
          position: 'absolute', top: 140,
          fontSize: 38, fontWeight: 700,
          color: 'rgba(255,255,255,0.6)',
          letterSpacing: 4, textTransform: 'uppercase',
          textAlign: 'center', padding: '0 60px',
          transform: `translateY(${titleSlide}px)`,
        }}>
          {seg.subtitle ?? 'Đếm ngược'}
        </div>

        {/* Ring + number */}
        <div style={{ position: 'relative', width: 500, height: 500 }}>
          <Ring progress={ringProgress} size={500} stroke={16} color={color} />
          {/* Inner glow ring */}
          <Ring progress={ringProgress} size={460} stroke={4} color={`${color}60`} />

          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              fontSize: 180, fontWeight: 900, color: '#fff',
              lineHeight: 1, fontVariantNumeric: 'tabular-nums',
              textShadow: `0 0 60px ${color}80`,
              transform: `scale(${pulse})`,
            }}>
              {secondsLeft}
            </div>
            <div style={{
              fontSize: 28, color: `${color}cc`, letterSpacing: 6,
              textTransform: 'uppercase', marginTop: 8,
            }}>
              giây
            </div>
          </div>
        </div>

        {/* Bottom text */}
        <div style={{
          position: 'absolute', bottom: 160,
          fontSize: 52, fontWeight: 900, color: '#fff',
          textAlign: 'center', padding: '0 60px',
          lineHeight: 1.3,
          textShadow: `0 2px 20px rgba(0,0,0,0.5)`,
        }}>
          {seg.text}
        </div>

        {/* Accent line bottom */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 8,
          background: color,
          boxShadow: `0 0 20px ${color}`,
        }} />

        {seg.audioUrl && <Audio src={seg.audioUrl} />}
      </AbsoluteFill>
    </Sequence>
  )
}

export function CountdownTemplate({ segments }: VideoProps) {
  const segFrames = getSegmentFrames(segments, FPS)
  return (
    <AbsoluteFill style={{ background: '#09090b' }}>
      {segFrames.map((seg, i) => (
        <CountdownSegment key={seg.id} seg={seg} startFrame={seg.startFrame}
          durationFrames={seg.durationFrames} segIndex={i} />
      ))}
    </AbsoluteFill>
  )
}
