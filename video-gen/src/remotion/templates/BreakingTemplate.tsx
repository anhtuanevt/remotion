'use client'
import { useCurrentFrame, interpolate, Sequence, AbsoluteFill, Audio, Img } from 'remotion'
import type { VideoProps, Segment } from '@/types'
import { getSegmentFrames } from '../helpers'

const FPS = 30

function BreakingSegment({ seg, startFrame, durationFrames, segIndex }: {
  seg: Segment; startFrame: number; durationFrames: number; segIndex: number
}) {
  const frame = useCurrentFrame()
  const local = frame - startFrame

  const stripSlide = interpolate(local, [0, 20], [-200, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const textOpacity = interpolate(local, [8, 22], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const fadeOut = interpolate(local, [durationFrames - 10, durationFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // BREAKING pulse: blink every 30 frames
  const breakingVisible = Math.floor(local / 20) % 2 === 0

  // Ticker scroll
  const tickerX = interpolate(local, [0, durationFrames], [100, -200], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const isUrgent = segIndex === 0

  return (
    <Sequence from={startFrame} durationInFrames={durationFrames}>
      <AbsoluteFill style={{ background: '#0a0a0a', overflow: 'hidden' }}>
        {/* Background image */}
        {seg.imageUrl && (
          <AbsoluteFill>
            <Img src={seg.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} />
            <AbsoluteFill style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.8) 100%)' }} />
          </AbsoluteFill>
        )}

        {/* Top bar — channel branding */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 80,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', padding: '0 40px',
          borderBottom: '3px solid #dc2626',
        }}>
          <div style={{
            fontSize: 32, fontWeight: 900, color: '#fff',
            fontFamily: 'Arial Black, Arial, sans-serif',
            letterSpacing: 3,
          }}>
            NEWS 24
          </div>
          <div style={{
            marginLeft: 'auto', fontSize: 28, color: '#9ca3af',
            fontFamily: 'Arial, sans-serif',
          }}>
            LIVE
            <span style={{
              display: 'inline-block', width: 10, height: 10,
              borderRadius: '50%', background: '#dc2626',
              marginLeft: 10, verticalAlign: 'middle',
              opacity: breakingVisible ? 1 : 0.2,
            }} />
          </div>
        </div>

        {/* BREAKING NEWS stamp */}
        {isUrgent && (
          <div style={{
            position: 'absolute', top: 120, left: 40,
            background: '#dc2626',
            padding: '12px 28px',
            opacity: breakingVisible ? 1 : 0.6,
            transform: `translateX(${stripSlide}px)`,
          }}>
            <div style={{
              fontSize: 32, fontWeight: 900, color: '#fff',
              fontFamily: 'Arial Black, Arial, sans-serif',
              letterSpacing: 4,
            }}>
              ● BREAKING NEWS
            </div>
          </div>
        )}

        {/* Main content — lower half */}
        <AbsoluteFill style={{
          display: 'flex', flexDirection: 'column',
          justifyContent: 'flex-end', padding: '0 0 100px 0',
          opacity: textOpacity * fadeOut,
        }}>
          {/* Dark strip */}
          <div style={{
            background: 'rgba(0,0,0,0.88)',
            borderLeft: '8px solid #dc2626',
            padding: '36px 44px',
            marginBottom: 16,
            transform: `translateX(${stripSlide}px)`,
          }}>
            <div style={{
              fontSize: 58, fontWeight: 800, color: '#fff',
              fontFamily: 'Arial, sans-serif',
              lineHeight: 1.3,
            }}>
              {seg.text}
            </div>
            {seg.subtitle && (
              <div style={{
                marginTop: 16, fontSize: 36, color: '#fca5a5',
                fontFamily: 'Arial, sans-serif',
                letterSpacing: 1,
              }}>
                {seg.subtitle}
              </div>
            )}
          </div>
        </AbsoluteFill>

        {/* Ticker bottom */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
          background: '#dc2626',
          display: 'flex', alignItems: 'center', overflow: 'hidden',
        }}>
          <div style={{
            background: '#000', color: '#fff',
            padding: '0 24px', fontSize: 30, fontWeight: 900,
            height: '100%', display: 'flex', alignItems: 'center',
            flexShrink: 0, letterSpacing: 2,
            fontFamily: 'Arial Black, Arial, sans-serif',
          }}>
            BREAKING
          </div>
          <div style={{
            transform: `translateX(${tickerX}%)`,
            whiteSpace: 'nowrap',
            fontSize: 30, fontWeight: 700, color: '#fff',
            fontFamily: 'Arial, sans-serif',
            paddingLeft: 40,
            letterSpacing: 1,
          }}>
            {`${seg.text}  •  ${seg.subtitle ?? ''}  •  `}
          </div>
        </div>

        {seg.audioUrl && <Audio src={seg.audioUrl} />}
      </AbsoluteFill>
    </Sequence>
  )
}

export function BreakingTemplate({ segments }: VideoProps) {
  const segFrames = getSegmentFrames(segments, FPS)
  return (
    <AbsoluteFill style={{ background: '#0a0a0a' }}>
      {segFrames.map((seg, i) => (
        <BreakingSegment key={seg.id} seg={seg} startFrame={seg.startFrame}
          durationFrames={seg.durationFrames} segIndex={i} />
      ))}
    </AbsoluteFill>
  )
}