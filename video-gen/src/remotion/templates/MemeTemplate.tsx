'use client'
import { useCurrentFrame, interpolate, Sequence, AbsoluteFill, Audio, Img } from 'remotion'
import type { VideoProps, Segment } from '@/types'
import { getSegmentFrames } from '../helpers'

const FPS = 30

function ImpactText({ text, position }: { text: string; position: 'top' | 'bottom' }) {
  return (
    <div style={{
      position: 'absolute',
      top: position === 'top' ? 40 : undefined,
      bottom: position === 'bottom' ? 40 : undefined,
      left: 0, right: 0,
      textAlign: 'center',
      padding: '0 28px',
    }}>
      <div style={{
        fontSize: 96,
        fontFamily: '"Arial Black", "Impact", Arial, sans-serif',
        fontWeight: 900,
        color: '#ffffff',
        textTransform: 'uppercase',
        lineHeight: 1.15,
        // Classic meme: white text with thick black stroke
        WebkitTextStroke: '6px #000',
        paintOrder: 'stroke fill',
        textShadow: '4px 4px 0 #000, -4px -4px 0 #000, 4px -4px 0 #000, -4px 4px 0 #000',
        letterSpacing: 1,
      }}>
        {text}
      </div>
    </div>
  )
}

function MemeSegment({ seg, startFrame, durationFrames, segIndex }: {
  seg: Segment; startFrame: number; durationFrames: number; segIndex: number
}) {
  const frame = useCurrentFrame()
  const local = frame - startFrame

  const opacity = interpolate(local, [0, 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const fadeOut = interpolate(local, [durationFrames - 8, durationFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // Reaction zoom: very slight zoom in over time for comedic effect
  const zoom = interpolate(local, [0, durationFrames], [1.0, 1.04], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // Split text: first part top, rest bottom
  const words = seg.text.split(' ')
  const mid = Math.ceil(words.length / 2)
  const topText = words.slice(0, mid).join(' ')
  const botText = words.slice(mid).join(' ')

  return (
    <Sequence from={startFrame} durationInFrames={durationFrames}>
      <AbsoluteFill style={{
        background: '#000', overflow: 'hidden',
        opacity: opacity * fadeOut,
      }}>
        {/* Image fills frame */}
        {seg.imageUrl ? (
          <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
            <Img src={seg.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </AbsoluteFill>
        ) : (
          /* No image: gray bg with emoji */
          <AbsoluteFill style={{
            background: '#888',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 240,
          }}>
            😂
          </AbsoluteFill>
        )}

        {/* Top impact text */}
        <ImpactText text={topText} position="top" />

        {/* Bottom impact text (subtitle or second half) */}
        {(botText || seg.subtitle) && (
          <ImpactText text={seg.subtitle ?? botText} position="bottom" />
        )}

        {seg.audioUrl && <Audio src={seg.audioUrl} />}
      </AbsoluteFill>
    </Sequence>
  )
}

export function MemeTemplate({ segments }: VideoProps) {
  const segFrames = getSegmentFrames(segments, FPS)
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      {segFrames.map((seg, i) => (
        <MemeSegment key={seg.id} seg={seg} startFrame={seg.startFrame}
          durationFrames={seg.durationFrames} segIndex={i} />
      ))}
    </AbsoluteFill>
  )
}
