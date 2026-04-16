import React from 'react'
import {
  AbsoluteFill, useCurrentFrame, interpolate, Easing, Sequence, Audio,
} from 'remotion'
import type { VideoProps } from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const FPS = 30
const BUBBLE_H = 160      // estimated px per bubble for scroll calc
const MAX_VISIBLE = 5     // max bubbles shown at once

const SPEAKER: Record<'A' | 'B', {
  bg: string; text: string; side: 'flex-start' | 'flex-end'
  radius: string; labelColor: string; name: string
}> = {
  A: { bg: '#2563EB', text: '#ffffff', side: 'flex-start',  radius: '6px 20px 20px 20px', labelColor: '#93C5FD', name: 'A' },
  B: { bg: '#F3F4F6', text: '#111827', side: 'flex-end',    radius: '20px 6px 20px 20px', labelColor: '#6B7280', name: 'B' },
}

// ─── Parse "[A] text" or "[B] text" ──────────────────────────────────────────

function parseSpeaker(raw: string): { speaker: 'A' | 'B'; text: string } {
  const m = raw.match(/^\[([AB])\]\s*([\s\S]+)$/)
  if (m) return { speaker: m[1] as 'A' | 'B', text: m[2].trim() }
  return { speaker: 'A', text: raw.trim() }
}

// ─── Bubble ───────────────────────────────────────────────────────────────────

function Bubble({
  speaker, text, enterFrame, isActive,
}: {
  speaker: 'A' | 'B'; text: string; enterFrame: number; isActive: boolean
}) {
  const frame = useCurrentFrame()
  const clamp = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const }
  const localF = Math.max(0, frame - enterFrame)

  const scale   = isActive ? interpolate(localF, [0, 8, 12], [0.75, 1.06, 1.0], { ...clamp, easing: Easing.out(Easing.back(1.4)) }) : 1
  const opacity = interpolate(localF, [0, 6], [0, 1], clamp)

  const s = SPEAKER[speaker]

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: s.side,
      marginBottom: 18,
      opacity,
      transform: `scale(${scale})`,
      transformOrigin: s.side === 'flex-start' ? 'left center' : 'right center',
    }}>
      {/* Speaker label */}
      <div style={{
        fontSize: 22, fontWeight: 600, color: s.labelColor, marginBottom: 6,
        paddingLeft: s.side === 'flex-start' ? 6 : 0,
        paddingRight: s.side === 'flex-end' ? 6 : 0,
      }}>
        {s.name}
      </div>
      {/* Bubble */}
      <div style={{
        maxWidth: '76%',
        background: s.bg,
        color: s.text,
        borderRadius: s.radius,
        padding: '18px 26px',
        fontSize: 38,
        lineHeight: 1.45,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontWeight: 500,
        boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
        wordBreak: 'break-word',
      }}>
        {text}
      </div>
    </div>
  )
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingDots({ speaker }: { speaker: 'A' | 'B' }) {
  const frame = useCurrentFrame()
  const s = SPEAKER[speaker]
  return (
    <div style={{ display: 'flex', alignItems: s.side, marginBottom: 12 }}>
      <div style={{
        background: s.bg, borderRadius: s.radius,
        padding: '14px 22px', display: 'flex', gap: 8, opacity: 0.7,
      }}>
        {[0, 1, 2].map(i => {
          const dot = interpolate(Math.sin((frame * 0.3) + i * 1.2), [-1, 1], [0.3, 1])
          return <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: s.text, opacity: dot }} />
        })}
      </div>
    </div>
  )
}

// ─── Main Template ────────────────────────────────────────────────────────────

export const ChatBubbleTemplate: React.FC<VideoProps> = ({ segments }) => {
  const frame = useCurrentFrame()
  const clamp = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const }

  // Build timings
  type Timing = { start: number; dur: number; speaker: 'A' | 'B'; text: string; audioUrl?: string }
  const timings: Timing[] = []
  let cursor = 0
  for (const seg of segments) {
    const dur = Math.max(FPS, Math.ceil(seg.duration * FPS))
    const { speaker, text } = parseSpeaker(seg.text)
    timings.push({ start: cursor, dur, speaker, text, audioUrl: seg.audioUrl })
    cursor += dur
  }

  // How many messages have appeared
  const appearedCount = timings.filter(t => frame >= t.start).length
  const activeIdx     = appearedCount - 1

  // Sliding window of last MAX_VISIBLE
  const windowStart = Math.max(0, appearedCount - MAX_VISIBLE)
  const visible     = timings.slice(windowStart, appearedCount)

  // Next speaker (for typing indicator before their bubble appears)
  const nextTiming  = timings[appearedCount]
  const showTyping  = nextTiming && (frame >= nextTiming.start - FPS * 0.8) && (frame < nextTiming.start)

  // Smooth scroll — translate container up as overflow grows
  const overflow        = Math.max(0, appearedCount - MAX_VISIBLE)
  const prevOverflow    = Math.max(0, overflow - 1)
  const lastStart       = timings[activeIdx]?.start ?? 0
  const scrollY = overflow > 0
    ? interpolate(frame, [lastStart, lastStart + 18], [prevOverflow * BUBBLE_H, overflow * BUBBLE_H], clamp)
    : 0

  // Active audio segment
  const activeTiming = timings.find(t => frame >= t.start && frame < t.start + t.dur)

  return (
    <AbsoluteFill style={{
      background: 'linear-gradient(160deg, #EFF6FF 0%, #F0FDF4 60%, #FAFAFA 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      overflow: 'hidden',
    }}>
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 116,
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1.5px solid #E5E7EB',
        display: 'flex', alignItems: 'center', padding: '0 44px', gap: 20,
        zIndex: 10,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}>
        {/* Avatar */}
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 28, fontWeight: 700,
        }}>
          C
        </div>
        <div>
          <div style={{ fontSize: 30, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>Conversation</div>
          <div style={{ fontSize: 20, color: '#22C55E', fontWeight: 500 }}>● Active now</div>
        </div>
      </div>

      {/* ── Messages container ────────────────────────────────────────── */}
      <div style={{
        position: 'absolute',
        top: 126, bottom: 0, left: 0, right: 0,
        padding: '24px 40px 32px',
        transform: `translateY(-${scrollY}px)`,
      }}>
        {visible.map((t, vi) => {
          const globalIdx = windowStart + vi
          const isActive  = globalIdx === activeIdx
          return (
            <Bubble
              key={globalIdx}
              speaker={t.speaker}
              text={t.text}
              enterFrame={t.start}
              isActive={isActive}
            />
          )
        })}

        {/* Typing indicator before next bubble */}
        {showTyping && nextTiming && (
          <TypingDots speaker={nextTiming.speaker} />
        )}
      </div>

      {/* ── Audio (current segment voiceover) ────────────────────────── */}
      {activeTiming?.audioUrl && (
        <Sequence from={activeTiming.start} durationInFrames={activeTiming.dur}>
          <Audio src={activeTiming.audioUrl} />
        </Sequence>
      )}
    </AbsoluteFill>
  )
}
