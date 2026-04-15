'use client'
import { useCurrentFrame, interpolate, Easing, Sequence, AbsoluteFill, Audio, Img } from 'remotion'
import type { VideoProps, Segment } from '@/types'
import { getSegmentFrames } from '../helpers'

const FPS = 30

function HookSegment({
  seg, startFrame, durationFrames, segIndex, totalSegments,
}: {
  seg: Segment
  startFrame: number
  durationFrames: number
  segIndex: number
  totalSegments: number
}) {
  const frame = useCurrentFrame()
  const local = frame - startFrame
  const isHook = segIndex === 0

  // Spring pop: overshoot → settle
  const springScale = interpolate(
    local, [0, 8, 16, 22], [0.55, 1.14, 0.93, 1.0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  )

  // Ken Burns
  const bgScale = interpolate(local, [0, durationFrames], [1.0, 1.06], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })

  const opacity = interpolate(
    local, [0, 10, durationFrames - 10, durationFrames], [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  )

  // Progress: (segIndex + fraction-in-segment) / total
  const overallProgress = (segIndex + local / durationFrames) / totalSegments

  // Hook label badge bounces in
  const badgeScale = interpolate(local, [0, 10, 18], [0, 1.15, 1.0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
    easing: Easing.out(Easing.back(1.5)),
  })

  const words = seg.text.split(' ')

  return (
    <Sequence from={startFrame} durationInFrames={durationFrames}>
      <AbsoluteFill style={{ background: '#0a0a0a', overflow: 'hidden' }}>
        {/* Background image */}
        {seg.imageUrl && (
          <AbsoluteFill style={{ transform: `scale(${bgScale})`, transformOrigin: 'center' }}>
            <Img
              src={seg.imageUrl}
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                opacity: isHook ? 0.28 : 0.58,
              }}
            />
          </AbsoluteFill>
        )}

        {/* Radial glow on hook segment, dark gradient otherwise */}
        <AbsoluteFill style={{
          background: isHook
            ? 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(255,50,0,0.25) 0%, rgba(0,0,0,0.92) 70%)'
            : 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 55%, transparent 100%)',
        }} />

        {/* "WATCH TILL END" badge — only on hook */}
        {isHook && (
          <div style={{
            position: 'absolute', top: 155, left: 0, right: 0,
            display: 'flex', justifyContent: 'center',
            transform: `scale(${badgeScale})`,
            opacity,
          }}>
            <div style={{
              background: '#FF3B00',
              borderRadius: 100,
              padding: '12px 36px',
              fontSize: 34,
              fontWeight: 800,
              color: '#fff',
              fontFamily: '"Arial Black", Arial, sans-serif',
              letterSpacing: 2,
              textTransform: 'uppercase',
              boxShadow: '0 0 30px rgba(255,59,0,0.6)',
            }}>
              ⚡ WATCH TILL END
            </div>
          </div>
        )}

        {/* Main text */}
        <AbsoluteFill style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '200px 64px',
          opacity,
          transform: `scale(${springScale})`,
        }}>
          {isHook ? (
            // Hook: massive stacked words, yellow + white alternating
            <div style={{ textAlign: 'center', fontFamily: '"Arial Black", Arial, sans-serif' }}>
              {words.map((word, i) => (
                <div key={i} style={{
                  display: 'block',
                  fontSize: i === 0 ? 118 : 96,
                  fontWeight: 900,
                  color: i % 2 === 0 ? '#FFFC00' : '#fff',
                  lineHeight: 1.05,
                  textTransform: 'uppercase',
                  textShadow: '0 6px 40px rgba(255,59,0,0.5), 0 0 80px rgba(255,59,0,0.2)',
                  letterSpacing: -2,
                }}>
                  {word}
                </div>
              ))}
            </div>
          ) : (
            // Content segments: large, clean
            <div style={{
              textAlign: 'center',
              fontSize: 82,
              fontWeight: 800,
              color: '#fff',
              lineHeight: 1.25,
              fontFamily: '"Arial Black", Arial, sans-serif',
              textShadow: '0 4px 20px rgba(0,0,0,0.95)',
              maxWidth: 920,
            }}>
              {seg.text}
            </div>
          )}

          {seg.subtitle && !isHook && (
            <div style={{
              marginTop: 30,
              fontSize: 46,
              fontWeight: 700,
              color: '#FFFC00',
              fontFamily: 'Arial, sans-serif',
              textAlign: 'center',
              textShadow: '0 2px 10px rgba(0,0,0,0.9)',
            }}>
              {seg.subtitle}
            </div>
          )}
        </AbsoluteFill>

        {/* Progress bar — "watch till end" indicator */}
        <div style={{
          position: 'absolute', bottom: 330, left: 64, right: 64,
          height: 5, background: 'rgba(255,255,255,0.18)', borderRadius: 3,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', borderRadius: 3,
            width: `${Math.min(overallProgress * 100, 100)}%`,
            background: '#FF3B00',
            boxShadow: '0 0 12px rgba(255,59,0,0.8)',
          }} />
        </div>

        {seg.audioUrl && <Audio src={seg.audioUrl} />}
      </AbsoluteFill>
    </Sequence>
  )
}

export function HookTemplate({ segments }: VideoProps) {
  const segFrames = getSegmentFrames(segments, FPS)
  return (
    <AbsoluteFill style={{ background: '#0a0a0a' }}>
      {segFrames.map((seg, i) => (
        <HookSegment
          key={seg.id}
          seg={seg}
          startFrame={seg.startFrame}
          durationFrames={seg.durationFrames}
          segIndex={i}
          totalSegments={segFrames.length}
        />
      ))}
    </AbsoluteFill>
  )
}
