'use client'
import { useCurrentFrame, interpolate, Sequence, AbsoluteFill, Audio } from 'remotion'
import type { VideoProps, Segment } from '@/types'
import { getSegmentFrames } from '../helpers'

const FPS = 30

// Beautiful animated mesh gradient palettes
const PALETTES = [
  { c1: '#667eea', c2: '#764ba2', c3: '#f093fb', c4: '#4facfe' },
  { c1: '#f7971e', c2: '#ffd200', c3: '#ff6b6b', c4: '#ee0979' },
  { c1: '#11998e', c2: '#38ef7d', c3: '#1a6b4a', c4: '#43e97b' },
  { c1: '#4776e6', c2: '#8e54e9', c3: '#24c6dc', c4: '#514a9d' },
  { c1: '#f953c6', c2: '#b91d73', c3: '#fc5c7d', c4: '#6a3093' },
  { c1: '#00c9ff', c2: '#92fe9d', c3: '#00b09b', c4: '#96c93d' },
]

function FloatingOrb({ x, y, size, color, phase, speed }: {
  x: number; y: number; size: number; color: string; phase: number; speed: number
}) {
  const frame = useCurrentFrame()
  const dx = Math.sin((frame * speed + phase) * 0.02) * 60
  const dy = Math.cos((frame * speed + phase) * 0.015) * 80

  return (
    <div style={{
      position: 'absolute',
      left: `${x}%`, top: `${y}%`,
      width: size, height: size,
      borderRadius: '50%',
      background: `radial-gradient(circle, ${color}88 0%, transparent 70%)`,
      transform: `translate(${dx}px, ${dy}px) translate(-50%, -50%)`,
      filter: 'blur(40px)',
    }} />
  )
}

function GradientSegment({ seg, startFrame, durationFrames, segIndex }: {
  seg: Segment; startFrame: number; durationFrames: number; segIndex: number
}) {
  const frame = useCurrentFrame()
  const local = frame - startFrame

  const p = PALETTES[segIndex % PALETTES.length]

  const textOpacity = interpolate(local, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const textScale   = interpolate(local, [0, 20], [0.88, 1.0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const fadeOut     = interpolate(local, [durationFrames - 12, durationFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // Animate gradient angle
  const angle = interpolate(local, [0, durationFrames], [135, 225], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <Sequence from={startFrame} durationInFrames={durationFrames}>
      <AbsoluteFill style={{
        overflow: 'hidden',
        background: `linear-gradient(${angle}deg, ${p.c1} 0%, ${p.c2} 40%, ${p.c3} 70%, ${p.c4} 100%)`,
        opacity: fadeOut,
      }}>
        {/* Floating orbs for mesh effect */}
        <FloatingOrb x={20} y={20} size={600} color={p.c4} phase={0} speed={1.2} />
        <FloatingOrb x={80} y={40} size={500} color={p.c1} phase={2} speed={0.8} />
        <FloatingOrb x={50} y={80} size={700} color={p.c3} phase={4} speed={1.0} />
        <FloatingOrb x={10} y={70} size={400} color={p.c2} phase={6} speed={1.4} />
        <FloatingOrb x={90} y={10} size={450} color={p.c4} phase={3} speed={0.9} />

        {/* Frosted glass card */}
        <AbsoluteFill style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '80px 56px',
          transform: `scale(${textScale})`,
          opacity: textOpacity,
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 36,
            padding: '60px 56px',
            width: '100%',
            boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
          }}>
            {seg.subtitle && (
              <div style={{
                fontSize: 30, color: 'rgba(255,255,255,0.75)',
                fontFamily: 'Arial, sans-serif', fontWeight: 600,
                letterSpacing: 3, textTransform: 'uppercase',
                marginBottom: 28, textAlign: 'center',
              }}>
                {seg.subtitle}
              </div>
            )}

            <div style={{
              fontSize: 64, fontWeight: 800, color: '#fff',
              fontFamily: 'Arial, sans-serif',
              lineHeight: 1.3, textAlign: 'center',
              textShadow: '0 2px 20px rgba(0,0,0,0.2)',
            }}>
              {seg.text}
            </div>
          </div>
        </AbsoluteFill>

        {seg.audioUrl && <Audio src={seg.audioUrl} />}
      </AbsoluteFill>
    </Sequence>
  )
}

export function GradientTemplate({ segments }: VideoProps) {
  const segFrames = getSegmentFrames(segments, FPS)
  return (
    <AbsoluteFill>
      {segFrames.map((seg, i) => (
        <GradientSegment key={seg.id} seg={seg} startFrame={seg.startFrame}
          durationFrames={seg.durationFrames} segIndex={i} />
      ))}
    </AbsoluteFill>
  )
}
