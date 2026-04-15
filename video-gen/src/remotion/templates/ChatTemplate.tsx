'use client'
import { useCurrentFrame, interpolate, Sequence, AbsoluteFill, Audio } from 'remotion'
import type { VideoProps, Segment } from '@/types'
import { getSegmentFrames } from '../helpers'

const FPS = 30

type Side = 'left' | 'right'

function ChatBubble({ text, side, localFrame, delay }: {
  text: string; side: Side; localFrame: number; delay: number
}) {
  const appear = interpolate(localFrame, [delay, delay + 12], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })
  const slideX = interpolate(localFrame, [delay, delay + 14], [side === 'left' ? -60 : 60, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })

  const isLeft = side === 'left'
  return (
    <div style={{
      display: 'flex', justifyContent: isLeft ? 'flex-start' : 'flex-end',
      opacity: appear,
      transform: `translateX(${slideX}px)`,
      marginBottom: 20,
    }}>
      {/* Avatar dot */}
      {isLeft && (
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: '#374151',
          flexShrink: 0, marginRight: 14, marginTop: 4,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24,
        }}>
          💬
        </div>
      )}
      <div style={{
        maxWidth: '75%',
        background: isLeft ? '#1f2937' : '#2563eb',
        borderRadius: isLeft
          ? '4px 20px 20px 20px'
          : '20px 4px 20px 20px',
        padding: '18px 24px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
      }}>
        <div style={{
          fontSize: 38, color: '#f9fafb',
          lineHeight: 1.45,
          fontFamily: 'Arial, sans-serif',
          fontWeight: 500,
        }}>
          {text}
        </div>
      </div>
      {!isLeft && (
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: '#2563eb',
          flexShrink: 0, marginLeft: 14, marginTop: 4,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24,
        }}>
          🤖
        </div>
      )}
    </div>
  )
}

function TypingIndicator({ visible }: { visible: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '16px 24px',
      background: '#1f2937', borderRadius: '4px 20px 20px 20px',
      width: 100, opacity: visible ? 1 : 0,
    }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 14, height: 14, borderRadius: '50%', background: '#6b7280',
          opacity: 0.5 + 0.5 * Math.abs(Math.sin((Date.now() / 300 + i) % Math.PI)),
        }} />
      ))}
    </div>
  )
}

function ChatSegment({ seg, startFrame, durationFrames, segIndex }: {
  seg: Segment; startFrame: number; durationFrames: number; segIndex: number
}) {
  const frame = useCurrentFrame()
  const local = frame - startFrame

  const side: Side = segIndex % 2 === 0 ? 'left' : 'right'
  const fadeOut = interpolate(local, [durationFrames - 10, durationFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const headerOpacity = interpolate(local, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // Split text into sentences for multi-bubble effect
  const sentences = seg.text.match(/[^.!?]+[.!?]*/g)?.filter(Boolean) ?? [seg.text]
  const showTyping = local > 5 && local < 20

  return (
    <Sequence from={startFrame} durationInFrames={durationFrames}>
      <AbsoluteFill style={{
        background: '#111827',
        fontFamily: 'Arial, sans-serif',
        overflow: 'hidden',
        opacity: fadeOut,
      }}>
        {/* Chat header */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 100,
          background: '#1f2937',
          borderBottom: '1px solid #374151',
          display: 'flex', alignItems: 'center', padding: '0 40px', gap: 20,
          opacity: headerOpacity,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28,
          }}>
            💬
          </div>
          <div>
            <div style={{ fontSize: 30, fontWeight: 700, color: '#f9fafb' }}>
              {seg.subtitle ?? 'Hội thoại'}
            </div>
            <div style={{ fontSize: 22, color: '#22c55e', marginTop: 2 }}>
              ● Đang hoạt động
            </div>
          </div>
        </div>

        {/* Messages area */}
        <div style={{
          position: 'absolute', top: 110, bottom: 100, left: 0, right: 0,
          padding: '24px 32px',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          overflow: 'hidden',
        }}>
          {showTyping && (
            <div style={{ display: 'flex', marginBottom: 16 }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: '#374151', flexShrink: 0, marginRight: 14,
              }} />
              <TypingIndicator visible />
            </div>
          )}
          {sentences.map((sentence, i) => (
            <ChatBubble
              key={i} text={sentence.trim()}
              side={i % 2 === 0 ? side : (side === 'left' ? 'right' : 'left')}
              localFrame={local} delay={20 + i * 18}
            />
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 100,
          background: '#1f2937',
          borderTop: '1px solid #374151',
          display: 'flex', alignItems: 'center', padding: '0 32px', gap: 16,
        }}>
          <div style={{
            flex: 1, height: 60, background: '#374151',
            borderRadius: 30, display: 'flex', alignItems: 'center',
            padding: '0 24px',
          }}>
            <div style={{ fontSize: 28, color: '#6b7280' }}>Nhập tin nhắn...</div>
          </div>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: '#2563eb',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28,
          }}>
            ➤
          </div>
        </div>

        {seg.audioUrl && <Audio src={seg.audioUrl} />}
      </AbsoluteFill>
    </Sequence>
  )
}

export function ChatTemplate({ segments }: VideoProps) {
  const segFrames = getSegmentFrames(segments, FPS)
  return (
    <AbsoluteFill style={{ background: '#111827' }}>
      {segFrames.map((seg, i) => (
        <ChatSegment key={seg.id} seg={seg} startFrame={seg.startFrame}
          durationFrames={seg.durationFrames} segIndex={i} />
      ))}
    </AbsoluteFill>
  )
}
