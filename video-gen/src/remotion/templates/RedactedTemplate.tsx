'use client'
import { useCurrentFrame, interpolate, Sequence, AbsoluteFill, Audio } from 'remotion'
import type { VideoProps, Segment } from '@/types'
import { getSegmentFrames } from '../helpers'

const FPS = 30

function RedactedBar({ text, revealFrame, localFrame, fontSize = 44 }: {
  text: string; revealFrame: number; localFrame: number; fontSize?: number
}) {
  const revealed = localFrame >= revealFrame
  const revealProgress = interpolate(localFrame, [revealFrame, revealFrame + 20], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })

  return (
    <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
      {/* Black redaction bar */}
      <div style={{
        position: 'absolute', inset: 0,
        background: '#000',
        transform: `scaleX(${1 - revealProgress})`,
        transformOrigin: 'left center',
        zIndex: 2,
        borderRadius: 2,
      }} />
      <div style={{
        fontSize, fontFamily: '"Courier New", monospace',
        color: revealed ? '#e2e8f0' : '#e2e8f0',
        fontWeight: 600, lineHeight: 1.4,
        padding: '4px 6px',
        minWidth: 100,
      }}>
        {text}
      </div>
    </div>
  )
}

function StampOverlay({ text, color, rotation, opacity }: {
  text: string; color: string; rotation: number; opacity: number
}) {
  return (
    <div style={{
      position: 'absolute',
      top: '50%', left: '50%',
      transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
      border: `8px solid ${color}`,
      padding: '12px 32px',
      color,
      fontSize: 72, fontWeight: 900,
      fontFamily: '"Courier New", monospace',
      letterSpacing: 6,
      textTransform: 'uppercase',
      opacity,
      pointerEvents: 'none',
      zIndex: 10,
      whiteSpace: 'nowrap',
    }}>
      {text}
    </div>
  )
}

function RedactedSegment({ seg, startFrame, durationFrames, segIndex }: {
  seg: Segment; startFrame: number; durationFrames: number; segIndex: number
}) {
  const frame = useCurrentFrame()
  const local = frame - startFrame

  const pageOpacity = interpolate(local, [0, 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const fadeOut = interpolate(local, [durationFrames - 10, durationFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // Stamp appears mid-segment
  const stampOpacity = interpolate(local, [durationFrames * 0.45, durationFrames * 0.55], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })
  const stampScale = interpolate(local, [durationFrames * 0.45, durationFrames * 0.55], [2.5, 1.0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })

  // Split text into lines (simulate classified doc)
  const lines = seg.text.match(/.{1,35}/g) ?? [seg.text]

  const STAMPS = [
    { text: 'MẬT', color: '#dc2626', rotation: -12 },
    { text: 'TỐI MẬT', color: '#dc2626', rotation: -8 },
    { text: 'CONFIDENTIAL', color: '#dc2626', rotation: -10 },
    { text: 'DECLASSIFIED', color: '#16a34a', rotation: -15 },
  ]
  const stamp = STAMPS[segIndex % STAMPS.length]

  return (
    <Sequence from={startFrame} durationInFrames={durationFrames}>
      <AbsoluteFill style={{
        background: '#e8e4d4',
        fontFamily: '"Courier New", Courier, monospace',
        overflow: 'hidden',
        opacity: pageOpacity * fadeOut,
      }}>
        {/* Paper texture lines */}
        {Array.from({ length: 40 }, (_, i) => (
          <div key={i} style={{
            position: 'absolute', left: 0, right: 0,
            top: 70 + i * 46, height: 1,
            background: 'rgba(0,0,0,0.07)',
          }} />
        ))}

        {/* Document header */}
        <div style={{
          padding: '52px 60px 0',
          borderBottom: '2px solid #555',
          paddingBottom: 20,
          marginBottom: 24,
        }}>
          <div style={{ fontSize: 22, color: '#555', letterSpacing: 2, marginBottom: 8 }}>
            TÀI LIỆU PHÂN LOẠI — BẢO MẬT CAO
          </div>
          <div style={{ fontSize: 20, color: '#888', letterSpacing: 1 }}>
            Mã hồ sơ: DOC-{String(segIndex + 1).padStart(4, '0')}-
            {Math.abs(seg.id?.charCodeAt(0) ?? 0) % 9000 + 1000}
          </div>
        </div>

        {/* Classified content */}
        <div style={{ padding: '0 60px', position: 'relative' }}>
          {/* Redacted title */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 22, color: '#888', letterSpacing: 1, marginBottom: 10 }}>
              TIÊU ĐỀ:
            </div>
            {lines.map((line, i) => (
              <RedactedBar key={i} text={line} revealFrame={20 + i * 15} localFrame={local} fontSize={46} />
            ))}
          </div>

          {/* Body */}
          {seg.subtitle && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 22, color: '#888', letterSpacing: 1, marginBottom: 10 }}>
                NỘI DUNG:
              </div>
              <RedactedBar text={seg.subtitle} revealFrame={40 + lines.length * 15} localFrame={local} fontSize={36} />
            </div>
          )}

          {/* Authorization block */}
          <div style={{
            marginTop: 60, borderTop: '1px solid #999', paddingTop: 20,
            fontSize: 22, color: '#777', letterSpacing: 1,
          }}>
            <div>CHỮ KÝ: ___________________</div>
            <div style={{ marginTop: 10 }}>NGÀY: __ / __ / ____</div>
          </div>
        </div>

        {/* STAMP overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          transform: `scale(${stampScale})`,
          opacity: stampOpacity,
        }}>
          <StampOverlay text={stamp.text} color={stamp.color} rotation={stamp.rotation} opacity={0.8} />
        </div>

        {seg.audioUrl && <Audio src={seg.audioUrl} />}
      </AbsoluteFill>
    </Sequence>
  )
}

export function RedactedTemplate({ segments }: VideoProps) {
  const segFrames = getSegmentFrames(segments, FPS)
  return (
    <AbsoluteFill style={{ background: '#e8e4d4' }}>
      {segFrames.map((seg, i) => (
        <RedactedSegment key={seg.id} seg={seg} startFrame={seg.startFrame}
          durationFrames={seg.durationFrames} segIndex={i} />
      ))}
    </AbsoluteFill>
  )
}
