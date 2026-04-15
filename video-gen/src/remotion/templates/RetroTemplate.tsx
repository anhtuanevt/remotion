'use client'
import { useCurrentFrame, interpolate, Sequence, AbsoluteFill, Audio, Img } from 'remotion'
import type { VideoProps, Segment } from '@/types'
import { getSegmentFrames } from '../helpers'

const FPS = 30

function StaticNoise({ seed }: { seed: number }) {
  // Deterministic noise pattern via SVG feTurbulence
  return (
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.05, mixBlendMode: 'screen' }}>
      <filter id={`noise-${seed}`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" seed={seed} />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#noise-${seed})`} />
    </svg>
  )
}

function ScanLines() {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 4px)',
      zIndex: 5,
    }} />
  )
}

function VHSStamp({ frame }: { frame: number }) {
  const seconds = Math.floor(frame / FPS)
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0')
  const secs = (seconds % 60).toString().padStart(2, '0')
  return (
    <div style={{
      position: 'absolute', top: 50, right: 48, zIndex: 10,
      fontSize: 28, color: '#fff', fontFamily: '"Courier New", monospace',
      opacity: Math.floor(frame / 20) % 2 === 0 ? 0.9 : 0.4,
      textShadow: '0 0 8px rgba(255,0,0,0.6)',
    }}>
      ● REC {mins}:{secs}
    </div>
  )
}

function RetroSegment({ seg, startFrame, durationFrames, segIndex }: {
  seg: Segment; startFrame: number; durationFrames: number; segIndex: number
}) {
  const frame = useCurrentFrame()
  const local = frame - startFrame

  // VHS color aberration: slight horizontal RGB shift
  const aberrationX = local < 5 ? interpolate(local, [0, 5], [6, 0], {}) : 0

  const textOpacity = interpolate(local, [0, 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const fadeOut = interpolate(local, [durationFrames - 10, durationFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // Wobble: subtle vertical jitter
  const wobble = local < 8 ? interpolate(local % 3, [0, 1, 2, 3], [0, -3, 2, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  }) : 0

  const PALETTES = [
    { bg: '#1a0a2e', title: '#ff6ec7', body: '#b8ffcb', accent: '#ffe135' },
    { bg: '#0d0d1a', title: '#00ffff', body: '#ff6ec7', accent: '#ffe135' },
    { bg: '#1a1a0a', title: '#39ff14', body: '#ffee00', accent: '#ff6ec7' },
  ]
  const palette = PALETTES[segIndex % PALETTES.length]

  return (
    <Sequence from={startFrame} durationInFrames={durationFrames}>
      <AbsoluteFill style={{
        background: palette.bg,
        overflow: 'hidden',
        transform: `translateY(${wobble}px)`,
        opacity: fadeOut,
      }}>
        {/* Background image — very dimmed */}
        {seg.imageUrl && (
          <AbsoluteFill>
            <Img src={seg.imageUrl} style={{
              width: '100%', height: '100%', objectFit: 'cover', opacity: 0.2,
              filter: 'saturate(0.4) sepia(0.3)',
            }} />
          </AbsoluteFill>
        )}

        {/* CRT vignette */}
        <AbsoluteFill style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.75) 100%)',
          pointerEvents: 'none', zIndex: 4,
        }} />

        <ScanLines />
        <StaticNoise seed={segIndex * 7 + Math.floor(local / 5)} />
        <VHSStamp frame={local} />

        {/* Color aberration ghost red */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 3,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '160px 56px',
          transform: `translateX(${aberrationX}px)`,
          opacity: 0.3,
          mixBlendMode: 'screen',
        }}>
          <div style={{ fontSize: 76, fontWeight: 900, color: 'red', textAlign: 'center', lineHeight: 1.25 }}>
            {seg.text}
          </div>
        </div>

        {/* Main content */}
        <AbsoluteFill style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '160px 56px', zIndex: 6,
          opacity: textOpacity,
        }}>
          {/* 80s style label */}
          <div style={{
            fontSize: 28, letterSpacing: 6, color: palette.accent,
            fontFamily: '"Courier New", monospace', fontWeight: 700,
            textTransform: 'uppercase', marginBottom: 32,
            textShadow: `0 0 12px ${palette.accent}`,
          }}>
            ◄◄ {seg.subtitle ?? 'RETRO MODE'} ►
          </div>

          {/* Title — neon glow */}
          <div style={{
            fontSize: 78, fontWeight: 900, color: palette.title,
            fontFamily: '"Courier New", monospace',
            lineHeight: 1.25, textAlign: 'center',
            textShadow: `0 0 20px ${palette.title}, 0 0 40px ${palette.title}60`,
            letterSpacing: -1,
          }}>
            {seg.text}
          </div>

          {/* Decorative stripe */}
          <div style={{
            marginTop: 36, display: 'flex', gap: 8, alignItems: 'center',
          }}>
            {Array.from({ length: 9 }, (_, i) => (
              <div key={i} style={{
                width: i === 4 ? 48 : 12, height: 12,
                background: i % 2 === 0 ? palette.accent : palette.body,
                borderRadius: 2,
              }} />
            ))}
          </div>
        </AbsoluteFill>

        {seg.audioUrl && <Audio src={seg.audioUrl} />}
      </AbsoluteFill>
    </Sequence>
  )
}

export function RetroTemplate({ segments }: VideoProps) {
  const segFrames = getSegmentFrames(segments, FPS)
  return (
    <AbsoluteFill style={{ background: '#1a0a2e' }}>
      {segFrames.map((seg, i) => (
        <RetroSegment key={seg.id} seg={seg} startFrame={seg.startFrame}
          durationFrames={seg.durationFrames} segIndex={i} />
      ))}
    </AbsoluteFill>
  )
}
