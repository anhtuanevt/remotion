'use client'
import { useCurrentFrame, interpolate, Easing, Sequence, AbsoluteFill, Audio } from 'remotion'
import type { VideoProps, Segment } from '@/types'
import { getSegmentFrames } from '../helpers'

const FPS = 30

/** Extract the first number from text, e.g. "GDP tăng 7.5%" → 7.5 */
function extractNumber(text: string): number | null {
  const m = text.match(/[\d,]+\.?\d*/)
  if (!m) return null
  return parseFloat(m[0].replace(/,/g, ''))
}

/** Format large numbers: 1234567 → 1.234.567 */
function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return n.toLocaleString('vi-VN')
  return n.toFixed(n % 1 !== 0 ? 1 : 0)
}

function DataSegment({ seg, startFrame, durationFrames, segIndex }: {
  seg: Segment; startFrame: number; durationFrames: number; segIndex: number
}) {
  const frame = useCurrentFrame()
  const local = frame - startFrame

  const target = extractNumber(seg.text)
  const hasNumber = target !== null

  const eased = interpolate(local, [0, Math.min(durationFrames * 0.7, 60)], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  })

  const countedValue = hasNumber ? target * eased : 0

  const barWidth = interpolate(local, [0, Math.min(durationFrames * 0.6, 50)], [0, 100], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  })

  const opacity = interpolate(local, [0, 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const fadeOut = interpolate(local, [durationFrames - 10, durationFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const ACCENT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
  const accent = ACCENT_COLORS[segIndex % ACCENT_COLORS.length]

  const slideY = interpolate(local, [0, 18], [50, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <Sequence from={startFrame} durationInFrames={durationFrames}>
      <AbsoluteFill style={{
        background: '#0f172a',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '80px 60px',
        fontFamily: 'Arial, sans-serif',
        opacity: opacity * fadeOut,
      }}>
        {/* Segment index label */}
        <div style={{
          position: 'absolute', top: 80,
          fontSize: 28, color: accent,
          letterSpacing: 3, textTransform: 'uppercase', fontWeight: 600,
          opacity: 0.7,
          transform: `translateY(${slideY}px)`,
        }}>
          {'// '} Số liệu {segIndex + 1}
        </div>

        {/* Big animated number */}
        {hasNumber && (
          <div style={{
            fontSize: 160, fontWeight: 900, color: '#fff',
            lineHeight: 1, textAlign: 'center',
            fontVariantNumeric: 'tabular-nums',
            textShadow: `0 0 40px ${accent}60`,
            transform: `translateY(${slideY}px)`,
          }}>
            {formatNum(countedValue)}
          </div>
        )}

        {/* Text label */}
        <div style={{
          marginTop: hasNumber ? 24 : 0,
          fontSize: hasNumber ? 44 : 62,
          fontWeight: hasNumber ? 500 : 800,
          color: hasNumber ? 'rgba(255,255,255,0.75)' : '#fff',
          textAlign: 'center', lineHeight: 1.4,
          transform: `translateY(${slideY}px)`,
        }}>
          {seg.text}
        </div>

        {/* Animated bar */}
        <div style={{
          marginTop: 48, width: '100%',
          height: 12, background: 'rgba(255,255,255,0.1)',
          borderRadius: 6, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', borderRadius: 6,
            width: `${barWidth}%`,
            background: `linear-gradient(to right, ${accent}, ${accent}99)`,
            boxShadow: `0 0 20px ${accent}80`,
          }} />
        </div>

        {/* Subtitle */}
        {seg.subtitle && (
          <div style={{
            marginTop: 32, fontSize: 36,
            color: accent, textAlign: 'center',
            fontWeight: 600, letterSpacing: 1,
            transform: `translateY(${slideY}px)`,
          }}>
            {seg.subtitle}
          </div>
        )}

        {/* Small grid decoration */}
        <div style={{
          position: 'absolute', bottom: 80, left: 60, right: 60,
          display: 'flex', gap: 12, justifyContent: 'center',
        }}>
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} style={{
              flex: 1, height: 40 + i * 15,
              background: accent,
              opacity: 0.15 + i * 0.08,
              borderRadius: '4px 4px 0 0',
            }} />
          ))}
        </div>

        {seg.audioUrl && <Audio src={seg.audioUrl} />}
      </AbsoluteFill>
    </Sequence>
  )
}

export function DataStatsTemplate({ segments }: VideoProps) {
  const segFrames = getSegmentFrames(segments, FPS)
  return (
    <AbsoluteFill style={{ background: '#0f172a' }}>
      {segFrames.map((seg, i) => (
        <DataSegment key={seg.id} seg={seg} startFrame={seg.startFrame}
          durationFrames={seg.durationFrames} segIndex={i} />
      ))}
    </AbsoluteFill>
  )
}