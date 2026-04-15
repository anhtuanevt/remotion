'use client'
import { useCurrentFrame, interpolate, Sequence, AbsoluteFill, Audio, Img } from 'remotion'
import type { VideoProps, Segment } from '@/types'
import { getSegmentFrames } from '../helpers'

const FPS = 30
const NEON_COLORS = ['#00ffff', '#ff00ff', '#00ff88', '#ff6600', '#ffff00']

function ScanLine({ frame }: { frame: number }) {
  const y = (frame * 4) % 1920
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0,
      top: y, height: 3,
      background: 'rgba(0,255,255,0.08)',
      pointerEvents: 'none',
    }} />
  )
}

function NeonSegment({ seg, startFrame, durationFrames, segIndex }: {
  seg: Segment; startFrame: number; durationFrames: number; segIndex: number
}) {
  const frame = useCurrentFrame()
  const local = frame - startFrame

  const neon = NEON_COLORS[segIndex % NEON_COLORS.length]

  const glitchX = local > 5 && local < 8 ? interpolate(local, [5, 6, 7, 8], [0, -8, 6, 0], {}) : 0
  const opacity = interpolate(local, [0, 6, durationFrames - 8, durationFrames], [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // Flicker: occasional dim frames
  const flicker = (local % 47 < 2 || local % 73 < 1) ? 0.7 : 1.0

  return (
    <Sequence from={startFrame} durationInFrames={durationFrames}>
      <AbsoluteFill style={{ background: '#050510', overflow: 'hidden' }}>
        {/* Dimmed bg image */}
        {seg.imageUrl && (
          <AbsoluteFill>
            <Img src={seg.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.12 }} />
          </AbsoluteFill>
        )}

        {/* Grid overlay */}
        <AbsoluteFill style={{
          backgroundImage: `
            linear-gradient(rgba(0,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,255,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }} />

        {/* Scan line */}
        <ScanLine frame={local} />

        {/* Neon border frame */}
        <div style={{
          position: 'absolute', inset: 32,
          border: `2px solid ${neon}`,
          borderRadius: 4,
          boxShadow: `0 0 20px ${neon}40, inset 0 0 20px ${neon}10`,
          opacity: flicker,
        }} />
        {/* Corner accents */}
        {[[0,0],[0,1],[1,0],[1,1]].map(([t, r], i) => (
          <div key={i} style={{
            position: 'absolute',
            top: t ? undefined : 32, bottom: t ? 32 : undefined,
            left: r ? undefined : 32, right: r ? 32 : undefined,
            width: 32, height: 32,
            borderTop: !t ? `4px solid ${neon}` : undefined,
            borderBottom: t ? `4px solid ${neon}` : undefined,
            borderLeft: !r ? `4px solid ${neon}` : undefined,
            borderRight: r ? `4px solid ${neon}` : undefined,
            boxShadow: `0 0 12px ${neon}`,
          }} />
        ))}

        {/* Main text */}
        <AbsoluteFill style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '120px 80px',
          opacity: opacity * flicker,
          transform: `translateX(${glitchX}px)`,
        }}>
          <div style={{
            fontSize: 64, fontWeight: 900,
            color: '#fff',
            fontFamily: '"Courier New", Courier, monospace',
            lineHeight: 1.35, textAlign: 'center',
            textShadow: `0 0 20px ${neon}, 0 0 40px ${neon}80, 0 0 80px ${neon}40`,
            letterSpacing: 2,
          }}>
            {seg.text}
          </div>
          {seg.subtitle && (
            <div style={{
              marginTop: 32,
              fontSize: 36, color: neon,
              fontFamily: '"Courier New", Courier, monospace',
              textAlign: 'center', letterSpacing: 4,
              textTransform: 'uppercase',
              textShadow: `0 0 12px ${neon}`,
              opacity: 0.85,
            }}>
              {'> '}{seg.subtitle}
            </div>
          )}
        </AbsoluteFill>

        {seg.audioUrl && <Audio src={seg.audioUrl} />}
      </AbsoluteFill>
    </Sequence>
  )
}

export function NeonTemplate({ segments }: VideoProps) {
  const segFrames = getSegmentFrames(segments, FPS)
  return (
    <AbsoluteFill style={{ background: '#050510' }}>
      {segFrames.map((seg, i) => (
        <NeonSegment key={seg.id} seg={seg} startFrame={seg.startFrame}
          durationFrames={seg.durationFrames} segIndex={i} />
      ))}
    </AbsoluteFill>
  )
}