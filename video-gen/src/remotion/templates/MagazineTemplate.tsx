'use client'
import { useCurrentFrame, interpolate, Sequence, AbsoluteFill, Audio, Img } from 'remotion'
import type { VideoProps, Segment } from '@/types'
import { getSegmentFrames } from '../helpers'

const FPS = 30
const ISSUES = ['VOL. 1', 'VOL. 2', 'VOL. 3', 'VOL. 4', 'VOL. 5']
const ACCENT_COLORS = ['#e63946', '#f4a261', '#2a9d8f', '#e9c46a', '#264653']

function MagazineSegment({ seg, startFrame, durationFrames, segIndex }: {
  seg: Segment; startFrame: number; durationFrames: number; segIndex: number
}) {
  const frame = useCurrentFrame()
  const local = frame - startFrame

  const accent = ACCENT_COLORS[segIndex % ACCENT_COLORS.length]
  const issue  = ISSUES[segIndex % ISSUES.length]

  const headerSlide = interpolate(local, [0, 22], [-120, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const titleScale  = interpolate(local, [8, 28], [0.92, 1.0],  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const titleOpacity = interpolate(local, [8, 24], [0, 1],       { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const footerSlide = interpolate(local, [15, 35], [80, 0],      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const footerOpacity = interpolate(local, [15, 32], [0, 1],     { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const fadeOut     = interpolate(local, [durationFrames - 12, durationFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <Sequence from={startFrame} durationInFrames={durationFrames}>
      <AbsoluteFill style={{ background: '#111', overflow: 'hidden', fontFamily: 'Arial, sans-serif' }}>
        {/* Full bleed image top 60% */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '62%', overflow: 'hidden' }}>
          {seg.imageUrl ? (
            <Img src={seg.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: `linear-gradient(160deg, ${accent}33, #111)` }} />
          )}
          {/* Gradient fade bottom of image */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%',
            background: 'linear-gradient(to bottom, transparent, #111)',
          }} />
        </div>

        {/* Magazine header bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 80,
          background: accent,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 40px',
          transform: `translateY(${headerSlide}px)`,
        }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: '#fff', letterSpacing: 5, textTransform: 'uppercase' }}>
            EXPOSE
          </div>
          <div style={{ fontSize: 24, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
            {issue}
          </div>
        </div>

        {/* Bottom content area */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, top: '55%',
          background: '#111',
          padding: '0 44px 40px 44px',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          opacity: fadeOut,
        }}>
          {/* Accent bar above title */}
          <div style={{
            width: 60, height: 5, background: accent, borderRadius: 3,
            marginBottom: 20, opacity: titleOpacity,
          }} />

          {/* Main headline */}
          <div style={{
            fontSize: 68, fontWeight: 900, color: '#fff',
            lineHeight: 1.15,
            transform: `scale(${titleScale})`, transformOrigin: 'bottom left',
            opacity: titleOpacity,
          }}>
            {seg.text}
          </div>

          {/* Subtitle / standfirst */}
          {seg.subtitle && (
            <div style={{
              marginTop: 20, fontSize: 34, color: '#9ca3af',
              lineHeight: 1.5,
              transform: `translateY(${footerSlide}px)`,
              opacity: footerOpacity,
            }}>
              {seg.subtitle}
            </div>
          )}

          {/* Footer: page / barcode style */}
          <div style={{
            marginTop: 32, display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            opacity: footerOpacity * 0.5,
          }}>
            <div style={{ fontSize: 22, color: '#6b7280', letterSpacing: 2 }}>
              EXPOSÉ MAGAZINE
            </div>
            {/* Mini barcode decoration */}
            <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end' }}>
              {[8,14,6,12,9,15,7,11,8,13,6].map((h, i) => (
                <div key={i} style={{ width: 4, height: h, background: '#6b7280', borderRadius: 1 }} />
              ))}
            </div>
          </div>
        </div>

        {seg.audioUrl && <Audio src={seg.audioUrl} />}
      </AbsoluteFill>
    </Sequence>
  )
}

export function MagazineTemplate({ segments }: VideoProps) {
  const segFrames = getSegmentFrames(segments, FPS)
  return (
    <AbsoluteFill style={{ background: '#111' }}>
      {segFrames.map((seg, i) => (
        <MagazineSegment key={seg.id} seg={seg} startFrame={seg.startFrame}
          durationFrames={seg.durationFrames} segIndex={i} />
      ))}
    </AbsoluteFill>
  )
}
