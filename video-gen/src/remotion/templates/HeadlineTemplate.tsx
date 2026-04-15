'use client'
import { useCurrentFrame, interpolate, Sequence, AbsoluteFill, Audio, Img } from 'remotion'
import type { VideoProps, Segment } from '@/types'
import { getSegmentFrames } from '../helpers'

const FPS = 30
const TODAY = new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })

function HeadlineSegment({ seg, startFrame, durationFrames, segIndex }: {
  seg: Segment; startFrame: number; durationFrames: number; segIndex: number
}) {
  const frame = useCurrentFrame()
  const local = frame - startFrame

  const ruleGrow  = interpolate(local, [0, 24], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const headOpacity = interpolate(local, [10, 28], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const headSlide = interpolate(local, [10, 28], [30, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const bodyOpacity = interpolate(local, [24, 40], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const fadeOut   = interpolate(local, [durationFrames - 10, durationFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const isBreaking = segIndex === 0

  return (
    <Sequence from={startFrame} durationInFrames={durationFrames}>
      <AbsoluteFill style={{
        background: '#fafaf7',
        fontFamily: 'Georgia, "Times New Roman", serif',
        overflow: 'hidden',
        opacity: fadeOut,
      }}>
        {/* Newspaper header */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          padding: '36px 48px 0',
          borderBottom: '3px solid #111',
        }}>
          <div style={{
            fontSize: 24, color: '#555', textAlign: 'center',
            fontFamily: 'Arial, sans-serif', letterSpacing: 2, textTransform: 'uppercase',
            marginBottom: 10,
          }}>
            {TODAY}
          </div>
          {/* Masthead */}
          <div style={{
            fontSize: 64, fontWeight: 900, textAlign: 'center', color: '#111',
            letterSpacing: -1, lineHeight: 1, marginBottom: 16,
            fontFamily: '"Times New Roman", serif',
          }}>
            THE DAILY
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderTop: '1px solid #555', paddingTop: 8, paddingBottom: 12,
            fontSize: 20, color: '#555', fontFamily: 'Arial, sans-serif',
          }}>
            <span>Est. 2025</span>
            <span>No. {segIndex + 1}</span>
            <span>Tin tức mỗi ngày</span>
          </div>
        </div>

        {/* Breaking label */}
        {isBreaking && (
          <div style={{
            position: 'absolute', top: 200, left: 48,
            background: '#dc2626', color: '#fff',
            fontSize: 26, fontWeight: 800, padding: '8px 20px',
            fontFamily: 'Arial, sans-serif', letterSpacing: 2,
            textTransform: 'uppercase',
          }}>
            ● TIN NÓNG
          </div>
        )}

        {/* Content area */}
        <div style={{ position: 'absolute', top: 230, left: 0, right: 0, bottom: 0, padding: '16px 48px 40px' }}>
          {/* Top rule line */}
          <div style={{ width: `${ruleGrow * 100}%`, height: 4, background: '#111', marginBottom: 20 }} />
          <div style={{ width: `${ruleGrow * 100}%`, height: 1, background: '#111', marginBottom: 24 }} />

          {/* Main headline */}
          <div style={{
            fontSize: 72, fontWeight: 900, color: '#111',
            lineHeight: 1.15,
            transform: `translateY(${headSlide}px)`,
            opacity: headOpacity,
            fontFamily: '"Times New Roman", serif',
          }}>
            {seg.text}
          </div>

          {/* Sub rule */}
          <div style={{
            width: `${ruleGrow * 60}%`, height: 2, background: '#555',
            margin: '24px 0', opacity: headOpacity,
          }} />

          {/* Body text (subtitle as standfirst) */}
          {seg.subtitle && (
            <div style={{
              fontSize: 36, color: '#333', lineHeight: 1.7,
              opacity: bodyOpacity,
              fontStyle: 'italic',
            }}>
              {seg.subtitle}
            </div>
          )}

          {/* Image */}
          {seg.imageUrl && (
            <div style={{
              marginTop: 28, width: '100%', height: 300,
              overflow: 'hidden', opacity: bodyOpacity,
            }}>
              <Img src={seg.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ fontSize: 22, color: '#888', marginTop: 6, fontFamily: 'Arial, sans-serif', fontStyle: 'italic' }}>
                Ảnh minh họa
              </div>
            </div>
          )}
        </div>

        {seg.audioUrl && <Audio src={seg.audioUrl} />}
      </AbsoluteFill>
    </Sequence>
  )
}

export function HeadlineTemplate({ segments }: VideoProps) {
  const segFrames = getSegmentFrames(segments, FPS)
  return (
    <AbsoluteFill style={{ background: '#fafaf7' }}>
      {segFrames.map((seg, i) => (
        <HeadlineSegment key={seg.id} seg={seg} startFrame={seg.startFrame}
          durationFrames={seg.durationFrames} segIndex={i} />
      ))}
    </AbsoluteFill>
  )
}
