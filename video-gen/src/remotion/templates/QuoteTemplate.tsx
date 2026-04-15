'use client'
import { useCurrentFrame, interpolate, Sequence, AbsoluteFill, Audio, Img } from 'remotion'
import type { VideoProps, Segment } from '@/types'
import { getSegmentFrames } from '../helpers'

const FPS = 30
const QUOTE_PALETTES = [
  { bg: '#fdf6e3', text: '#2c2416', accent: '#c9a84c', quote: '#8b6914' },
  { bg: '#1a1a2e', text: '#eaeaea', accent: '#e94560', quote: '#a8a8c8' },
  { bg: '#f8f9fa', text: '#212529', accent: '#0d6efd', quote: '#6c757d' },
  { bg: '#0d1b2a', text: '#ffffff', accent: '#00b4d8', quote: '#90e0ef' },
  { bg: '#2d1b69', text: '#ffffff', accent: '#f72585', quote: '#c77dff' },
]

function QuoteSegment({ seg, startFrame, durationFrames, segIndex }: {
  seg: Segment; startFrame: number; durationFrames: number; segIndex: number
}) {
  const frame = useCurrentFrame()
  const local = frame - startFrame

  const palette = QUOTE_PALETTES[segIndex % QUOTE_PALETTES.length]

  const lineGrow = interpolate(local, [0, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const textOpacity = interpolate(local, [15, 35], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const authorSlide = interpolate(local, [30, 50], [40, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const authorOpacity = interpolate(local, [30, 50], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const fadeOut = interpolate(local, [durationFrames - 12, durationFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // Big quotation mark size pulses subtly
  const quoteScale = interpolate(local, [0, 60, 120], [1, 1.04, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <Sequence from={startFrame} durationInFrames={durationFrames}>
      <AbsoluteFill style={{ background: palette.bg, overflow: 'hidden' }}>
        {/* Subtle bg image blend */}
        {seg.imageUrl && (
          <AbsoluteFill>
            <Img src={seg.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.08 }} />
          </AbsoluteFill>
        )}

        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: -100, right: -100,
          width: 500, height: 500, borderRadius: '50%',
          background: palette.accent, opacity: 0.08,
        }} />
        <div style={{
          position: 'absolute', bottom: -80, left: -80,
          width: 350, height: 350, borderRadius: '50%',
          background: palette.accent, opacity: 0.06,
        }} />

        {/* Horizontal line that draws in */}
        <div style={{
          position: 'absolute', top: 220, left: 80,
          height: 3, background: palette.accent,
          width: `${lineGrow * (1080 - 160)}px`,
          borderRadius: 2,
        }} />

        {/* Big quote mark */}
        <div style={{
          position: 'absolute', top: 120, left: 60,
          fontSize: 240, color: palette.accent, opacity: 0.25,
          fontFamily: 'Georgia, serif', lineHeight: 1,
          transform: `scale(${quoteScale})`, transformOrigin: 'top left',
          userSelect: 'none',
        }}>
          "
        </div>

        {/* Main content */}
        <AbsoluteFill style={{
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center', padding: '280px 80px 200px 80px',
          opacity: fadeOut,
        }}>
          {/* Quote text */}
          <div style={{
            fontSize: 58, fontWeight: 400,
            color: palette.text,
            fontFamily: 'Georgia, "Times New Roman", serif',
            lineHeight: 1.55, textAlign: 'center',
            opacity: textOpacity,
            fontStyle: 'italic',
          }}>
            "{seg.text}"
          </div>

          {/* Divider line */}
          <div style={{
            margin: '48px auto',
            width: 60, height: 2,
            background: palette.accent,
            opacity: authorOpacity,
          }} />

          {/* Author / subtitle */}
          {seg.subtitle && (
            <div style={{
              fontSize: 38, fontWeight: 600,
              color: palette.quote,
              fontFamily: 'Arial, sans-serif',
              textAlign: 'center',
              opacity: authorOpacity,
              transform: `translateY(${authorSlide}px)`,
              letterSpacing: 2,
            }}>
              — {seg.subtitle}
            </div>
          )}
        </AbsoluteFill>

        {/* Bottom accent line */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 6,
          background: palette.accent,
        }} />

        {seg.audioUrl && <Audio src={seg.audioUrl} />}
      </AbsoluteFill>
    </Sequence>
  )
}

export function QuoteTemplate({ segments }: VideoProps) {
  const segFrames = getSegmentFrames(segments, FPS)
  return (
    <AbsoluteFill>
      {segFrames.map((seg, i) => (
        <QuoteSegment key={seg.id} seg={seg} startFrame={seg.startFrame}
          durationFrames={seg.durationFrames} segIndex={i} />
      ))}
    </AbsoluteFill>
  )
}