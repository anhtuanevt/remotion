'use client'
import { useCurrentFrame, interpolate, Easing, Sequence, AbsoluteFill, Audio, Img } from 'remotion'
import type { VideoProps, Segment } from '@/types'
import { getSegmentFrames } from '../helpers'

const FPS = 30

function ScoreBoard({ homeScore, awayScore, teamA, teamB, localFrame, accent }: {
  homeScore: number; awayScore: number; teamA: string; teamB: string; localFrame: number; accent: string
}) {
  const countA = Math.round(interpolate(localFrame, [10, 35], [0, homeScore], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
  }))
  const countB = Math.round(interpolate(localFrame, [20, 45], [0, awayScore], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic),
  }))

  return (
    <div style={{
      background: 'rgba(0,0,0,0.85)',
      borderRadius: 20, overflow: 'hidden',
      border: `3px solid ${accent}`,
      boxShadow: `0 0 40px ${accent}40`,
    }}>
      {/* Header */}
      <div style={{
        background: accent, padding: '12px 32px',
        fontSize: 26, fontWeight: 900, color: '#fff',
        textAlign: 'center', letterSpacing: 3,
        fontFamily: 'Arial Black, Arial, sans-serif',
      }}>
        ⚽ TRỰC TIẾP
      </div>

      {/* Scores */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 0, padding: '24px 32px',
      }}>
        {/* Team A */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{
            fontSize: 28, fontWeight: 800, color: '#fff',
            fontFamily: 'Arial, sans-serif', marginBottom: 12,
            letterSpacing: 1,
          }}>
            {teamA}
          </div>
          <div style={{
            fontSize: 100, fontWeight: 900, color: '#fff',
            fontFamily: 'Arial Black, Arial, sans-serif',
            lineHeight: 1, fontVariantNumeric: 'tabular-nums',
            textShadow: `0 0 30px ${accent}80`,
          }}>
            {countA}
          </div>
        </div>

        {/* VS divider */}
        <div style={{
          fontSize: 36, color: 'rgba(255,255,255,0.4)',
          fontFamily: 'Arial Black, sans-serif',
          padding: '0 20px', marginTop: 20,
        }}>
          :
        </div>

        {/* Team B */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{
            fontSize: 28, fontWeight: 800, color: '#fff',
            fontFamily: 'Arial, sans-serif', marginBottom: 12,
            letterSpacing: 1,
          }}>
            {teamB}
          </div>
          <div style={{
            fontSize: 100, fontWeight: 900, color: '#fff',
            fontFamily: 'Arial Black, Arial, sans-serif',
            lineHeight: 1, fontVariantNumeric: 'tabular-nums',
            textShadow: `0 0 30px ${accent}80`,
          }}>
            {countB}
          </div>
        </div>
      </div>
    </div>
  )
}

function SportsSegment({ seg, startFrame, durationFrames, segIndex }: {
  seg: Segment; startFrame: number; durationFrames: number; segIndex: number
}) {
  const frame = useCurrentFrame()
  const local = frame - startFrame

  const ACCENTS = ['#f59e0b', '#ef4444', '#22c55e', '#3b82f6', '#a855f7']
  const accent = ACCENTS[segIndex % ACCENTS.length]

  // Try to parse scores from text: "3-1" or "Việt Nam 3 Thái Lan 1"
  const scoreMatch = seg.text.match(/(\d+)\s*[-:]\s*(\d+)/)
  const homeScore = scoreMatch ? parseInt(scoreMatch[1]) : segIndex + 1
  const awayScore = scoreMatch ? parseInt(scoreMatch[2]) : segIndex

  // Team names from subtitle or defaults
  const teams = (seg.subtitle ?? 'VN - TL').split(/[-:]/)
  const teamA = teams[0]?.trim() ?? 'VN'
  const teamB = teams[1]?.trim() ?? 'TL'

  const slideIn  = interpolate(local, [0, 22], [80, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const opacity  = interpolate(local, [0, 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const fadeOut  = interpolate(local, [durationFrames - 10, durationFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // Celebration particles at top
  const particleOpacity = interpolate(local, [30, 50], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <Sequence from={startFrame} durationInFrames={durationFrames}>
      <AbsoluteFill style={{
        background: '#0a0a0a', overflow: 'hidden',
        opacity: opacity * fadeOut,
      }}>
        {/* Background image */}
        {seg.imageUrl && (
          <AbsoluteFill>
            <Img src={seg.imageUrl} style={{
              width: '100%', height: '100%', objectFit: 'cover',
              opacity: 0.25, filter: 'blur(2px)',
            }} />
          </AbsoluteFill>
        )}

        {/* Stadium lights glow */}
        <AbsoluteFill style={{
          background: `radial-gradient(ellipse at top, ${accent}20 0%, transparent 60%)`,
        }} />

        {/* Celebration dots */}
        <div style={{ position: 'absolute', top: 80, left: 0, right: 0, opacity: particleOpacity }}>
          {Array.from({ length: 12 }, (_, i) => {
            const x = (i / 12) * 100
            const y = Math.sin(i * 1.3) * 30
            return (
              <div key={i} style={{
                position: 'absolute',
                left: `${x}%`, top: y,
                width: 16, height: 16, borderRadius: '50%',
                background: ACCENTS[i % ACCENTS.length],
                opacity: 0.7,
              }} />
            )
          })}
        </div>

        {/* Main content */}
        <AbsoluteFill style={{
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center',
          padding: '100px 52px',
          transform: `translateY(${slideIn}px)`,
          gap: 40,
        }}>
          <ScoreBoard
            homeScore={homeScore} awayScore={awayScore}
            teamA={teamA} teamB={teamB}
            localFrame={local} accent={accent}
          />

          {/* Commentary text */}
          <div style={{
            background: `${accent}22`,
            border: `2px solid ${accent}44`,
            borderRadius: 16, padding: '24px 36px',
            width: '100%',
          }}>
            <div style={{
              fontSize: 44, fontWeight: 700, color: '#fff',
              fontFamily: 'Arial, sans-serif', lineHeight: 1.4,
              textAlign: 'center',
            }}>
              {scoreMatch ? seg.text : seg.text}
            </div>
          </div>
        </AbsoluteFill>

        {/* Bottom ticker */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 70,
          background: accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, fontWeight: 800, color: '#000',
          letterSpacing: 3, fontFamily: 'Arial Black, Arial, sans-serif',
        }}>
          ▶ SPORTS LIVE
        </div>

        {seg.audioUrl && <Audio src={seg.audioUrl} />}
      </AbsoluteFill>
    </Sequence>
  )
}

export function SportsTemplate({ segments }: VideoProps) {
  const segFrames = getSegmentFrames(segments, FPS)
  return (
    <AbsoluteFill style={{ background: '#0a0a0a' }}>
      {segFrames.map((seg, i) => (
        <SportsSegment key={seg.id} seg={seg} startFrame={seg.startFrame}
          durationFrames={seg.durationFrames} segIndex={i} />
      ))}
    </AbsoluteFill>
  )
}
