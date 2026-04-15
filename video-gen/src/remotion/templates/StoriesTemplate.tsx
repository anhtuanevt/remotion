'use client'
import { useCurrentFrame, interpolate, Sequence, AbsoluteFill, Audio, Img } from 'remotion'
import type { VideoProps, Segment } from '@/types'
import { getSegmentFrames } from '../helpers'

const FPS = 30
const STORY_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
]

function StoriesProgressBar({ total, current, progress }: { total: number; current: number; progress: number }) {
  return (
    <div style={{
      position: 'absolute', top: 52, left: 20, right: 20, zIndex: 20,
      display: 'flex', gap: 6,
    }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{
          flex: 1, height: 4, borderRadius: 2,
          background: 'rgba(255,255,255,0.35)',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', borderRadius: 2, background: '#fff',
            width: i < current ? '100%' : i === current ? `${progress * 100}%` : '0%',
          }} />
        </div>
      ))}
    </div>
  )
}

function StoriesSegment({ seg, startFrame, durationFrames, segIndex, totalSegments }: {
  seg: Segment; startFrame: number; durationFrames: number; segIndex: number; totalSegments: number
}) {
  const frame = useCurrentFrame()
  const local = frame - startFrame
  const progress = local / durationFrames

  const popScale = interpolate(local, [0, 10, 16], [0.85, 1.04, 1.0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const opacity  = interpolate(local, [0, 8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const fadeOut  = interpolate(local, [durationFrames - 8, durationFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const gradient = STORY_GRADIENTS[segIndex % STORY_GRADIENTS.length]

  return (
    <Sequence from={startFrame} durationInFrames={durationFrames}>
      <AbsoluteFill style={{ background: '#111', overflow: 'hidden' }}>
        {/* Background: image or gradient */}
        {seg.imageUrl ? (
          <AbsoluteFill>
            <Img src={seg.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <AbsoluteFill style={{ background: 'rgba(0,0,0,0.35)' }} />
          </AbsoluteFill>
        ) : (
          <AbsoluteFill style={{ background: gradient }} />
        )}

        {/* Progress bars */}
        <StoriesProgressBar total={totalSegments} current={segIndex} progress={progress} />

        {/* Text card center */}
        <AbsoluteFill style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '120px 48px',
          opacity: opacity * fadeOut,
          transform: `scale(${popScale})`,
        }}>
          {/* "Sticker" style card */}
          <div style={{
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(12px)',
            borderRadius: 28,
            padding: '44px 48px',
            width: '100%',
            border: '2px solid rgba(255,255,255,0.2)',
          }}>
            <div style={{
              fontSize: 56, fontWeight: 800, color: '#fff',
              lineHeight: 1.3, textAlign: 'center',
              fontFamily: 'Arial, sans-serif',
              textShadow: '0 2px 10px rgba(0,0,0,0.5)',
            }}>
              {seg.text}
            </div>
            {seg.subtitle && (
              <div style={{
                marginTop: 24, fontSize: 36, color: 'rgba(255,255,255,0.75)',
                textAlign: 'center', fontFamily: 'Arial, sans-serif',
              }}>
                {seg.subtitle}
              </div>
            )}
          </div>
        </AbsoluteFill>

        {seg.audioUrl && <Audio src={seg.audioUrl} />}
      </AbsoluteFill>
    </Sequence>
  )
}

export function StoriesTemplate({ segments }: VideoProps) {
  const segFrames = getSegmentFrames(segments, FPS)
  return (
    <AbsoluteFill style={{ background: '#111' }}>
      {segFrames.map((seg, i) => (
        <StoriesSegment key={seg.id} seg={seg} startFrame={seg.startFrame}
          durationFrames={seg.durationFrames} segIndex={i} totalSegments={segFrames.length} />
      ))}
    </AbsoluteFill>
  )
}