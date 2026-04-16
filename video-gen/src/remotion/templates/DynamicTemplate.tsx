import React from 'react'
import {
  AbsoluteFill, useCurrentFrame, useVideoConfig,
  interpolate, Easing, Audio, Img, Sequence,
} from 'remotion'
import type { VideoProps, MotionSpec, Segment } from '@/types'
import { DEFAULT_MOTION_SPEC } from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const FONT_FAMILIES: Record<string, string> = {
  sans:    '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif',
  mono:    '"Courier New", "Lucida Console", monospace',
  serif:   'Georgia, "Times New Roman", serif',
  display: '"Arial Black", Impact, "Haettenschweiler", sans-serif',
}

const FONT_SIZES: Record<string, number> = {
  sm: 36, md: 52, lg: 66, xl: 88,
}

// ─── Background ───────────────────────────────────────────────────────────────

function getBackground(spec: MotionSpec): string {
  switch (spec.bgType) {
    case 'solid':         return spec.bgColor
    case 'gradient':      return `linear-gradient(135deg, ${spec.bgColor} 0%, ${spec.bgColor2} 100%)`
    case 'dark-gradient': return `linear-gradient(180deg, ${spec.bgColor} 0%, ${spec.bgColor2} 100%)`
    case 'image-blur':    return spec.bgColor  // fallback; image rendered separately
    default:              return spec.bgColor
  }
}

// ─── Overlay ──────────────────────────────────────────────────────────────────

function Overlay({ spec }: { spec: MotionSpec }) {
  switch (spec.overlay) {
    case 'vignette':
      return (
        <AbsoluteFill style={{
          background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.72) 100%)',
          pointerEvents: 'none',
        }} />
      )
    case 'scanlines':
      return (
        <AbsoluteFill style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.18) 2px, rgba(0,0,0,0.18) 4px)',
          pointerEvents: 'none',
        }} />
      )
    case 'grain':
      return (
        <AbsoluteFill style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.08\'/%3E%3C/svg%3E")',
          pointerEvents: 'none',
          opacity: 0.5,
        }} />
      )
    default:
      return null
  }
}

// ─── CountUp number animation ─────────────────────────────────────────────────

type TextPart =
  | { kind: 'text';   value: string }
  | { kind: 'number'; raw: string; num: number; isPercent: boolean }

/** Split text into plain-text and animatable-number parts.
 *  Animates numbers >= 100 that are NOT a year (1900-2100). */
function parseNumbers(text: string): TextPart[] {
  const parts: TextPart[] = []
  // Match standalone numbers: digits with optional thousand separators (.,)
  const re = /\b(\d[\d.,]*\d|\d{2,})(%?)\b/g
  let last = 0
  let m: RegExpExecArray | null

  while ((m = re.exec(text)) !== null) {
    const rawNum = m[1].replace(/[.,]/g, '')
    const num    = parseInt(rawNum, 10)
    const isPct  = m[2] === '%'
    if (isNaN(num)) continue
    const isYear  = num >= 1900 && num <= 2100
    const isSmall = num < 100 && !isPct
    if (isYear || isSmall) continue

    if (m.index > last) parts.push({ kind: 'text', value: text.slice(last, m.index) })
    parts.push({ kind: 'number', raw: m[0], num, isPercent: isPct })
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push({ kind: 'text', value: text.slice(last) })
  return parts.length ? parts : [{ kind: 'text', value: text }]
}

/** Slot-machine CountUp: spin rapidly then ease into the final value. */
function CountUp({
  to, localFrame, totalFrames, isPercent, color,
}: {
  to: number; localFrame: number; totalFrames: number; isPercent: boolean; color: string
}) {
  const clamp  = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const }
  const spinEnd = Math.round(totalFrames * 0.52)

  let value: number
  if (localFrame <= spinEnd) {
    // Spin phase: sine-based cycling (deterministic, no Math.random)
    const t      = localFrame / Math.max(spinEnd, 1)
    const cycles = 4
    const sine   = Math.abs(Math.sin(t * Math.PI * cycles))
    value = Math.round(sine * to)
  } else {
    // Landing phase: ease-out-back so it overshoots slightly then clicks in
    const t = interpolate(localFrame, [spinEnd, totalFrames], [0, 1], {
      ...clamp, easing: Easing.out(Easing.cubic),
    })
    value = Math.round(to * t)
  }

  const formatted = to >= 10000
    ? value.toLocaleString('vi-VN')
    : value.toString()

  return (
    <span style={{
      color,
      fontVariantNumeric: 'tabular-nums',
      display:   'inline-block',
      minWidth:  `${(to.toString().length + (isPercent ? 1 : 0))}ch`,
      textAlign: 'right',
    }}>
      {formatted}{isPercent ? '%' : ''}
    </span>
  )
}

/** Render text with inline CountUp for any detected big numbers. */
function RichText({
  text, localFrame, countDuration, color, accentColor,
}: {
  text: string; localFrame: number; countDuration: number; color: string; accentColor: string
}) {
  const parts = parseNumbers(text)
  const hasNumbers = parts.some(p => p.kind === 'number')
  if (!hasNumbers) return <>{text}</>

  return (
    <>
      {parts.map((part, i) => {
        if (part.kind === 'text') return <span key={i}>{part.value}</span>
        return (
          <CountUp
            key={i}
            to={part.num}
            localFrame={localFrame}
            totalFrames={countDuration}
            isPercent={part.isPercent}
            color={accentColor}
          />
        )
      })}
    </>
  )
}

// ─── Accent wrapper ───────────────────────────────────────────────────────────

function AccentText({
  text, spec, style, localFrame = 0, countDuration = 45,
}: {
  text: string; spec: MotionSpec; style: React.CSSProperties
  localFrame?: number; countDuration?: number
}) {
  const { accentColor, accentStyle, textColor } = spec

  let innerStyle: React.CSSProperties = {}
  switch (accentStyle) {
    case 'underline':
      innerStyle = { borderBottom: `5px solid ${accentColor}`, paddingBottom: 6 }
      break
    case 'highlight':
      innerStyle = { background: accentColor + '44', borderRadius: 6, padding: '0 8px' }
      break
    case 'pill':
      innerStyle = {
        background: accentColor + '22',
        border: `3px solid ${accentColor}`,
        borderRadius: 12,
        padding: '6px 20px',
      }
      break
    case 'border-left':
      innerStyle = { borderLeft: `8px solid ${accentColor}`, paddingLeft: 24 }
      break
    default:
      break
  }

  return (
    <div style={style}>
      <span style={innerStyle}>
        <RichText
          text={text}
          localFrame={localFrame}
          countDuration={countDuration}
          color={textColor}
          accentColor={accentColor}
        />
      </span>
    </div>
  )
}

// ─── Word-pop animation ───────────────────────────────────────────────────────

function WordPopText({
  text, localFrame, animFrames, spec, sceneDur,
}: {
  text: string; localFrame: number; animFrames: number; spec: MotionSpec; sceneDur: number
}) {
  const words = text.split(' ')
  const framesPerWord = Math.max(5, animFrames / Math.max(words.length, 1))
  const clamp = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const }

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: spec.textAlign === 'center' ? 'center' : spec.textAlign === 'right' ? 'flex-end' : 'flex-start',
      gap: 12,
      padding: '0 60px',
      fontFamily: FONT_FAMILIES[spec.fontFamily] ?? FONT_FAMILIES.sans,
      fontSize: FONT_SIZES[spec.fontSize] ?? 52,
      fontWeight: 800,
      color: spec.textColor,
      lineHeight: 1.25,
    }}>
      {words.map((word, wi) => {
        const wf  = localFrame - wi * framesPerWord
        const op  = interpolate(wf, [0, 5], [0, 1], clamp)
        const sc  = interpolate(wf, [0, 5, 9], [0, 1.4, 1.0], clamp)
        const col = wi % 3 === 0 ? spec.textColor : wi % 3 === 1 ? spec.accentColor : spec.textColor

        // Check if this word is a big number — if so, render CountUp instead
        const cleanWord = word.replace(/[.,]/g, '')
        const num = parseInt(cleanWord, 10)
        const isYear = num >= 1900 && num <= 2100
        const isBigNum = !isNaN(num) && num >= 100 && !isYear

        return (
          <span key={wi} style={{ opacity: op, transform: `scale(${sc})`, display: 'inline-block', color: col }}>
            {isBigNum && wf > 0 ? (
              <CountUp
                to={num}
                localFrame={Math.max(0, wf)}
                totalFrames={Math.max(20, sceneDur - wi * framesPerWord)}
                isPercent={word.endsWith('%')}
                color={spec.accentColor}
              />
            ) : word}
          </span>
        )
      })}
    </div>
  )
}

// ─── Typewriter animation ─────────────────────────────────────────────────────

function TypewriterText({
  text, localFrame, animFrames, spec,
}: {
  text: string; localFrame: number; animFrames: number; spec: MotionSpec
}) {
  const clamp = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const }
  const charsToShow = Math.floor(
    interpolate(localFrame, [0, Math.max(animFrames, 1)], [0, text.length], clamp),
  )
  const showCursor = Math.floor(localFrame * 0.4) % 2 === 0 && charsToShow < text.length

  const style: React.CSSProperties = {
    fontFamily: FONT_FAMILIES[spec.fontFamily] ?? FONT_FAMILIES.sans,
    fontSize: FONT_SIZES[spec.fontSize] ?? 52,
    fontWeight: 700,
    color: spec.textColor,
    textAlign: spec.textAlign as 'left' | 'center' | 'right',
    padding: '0 60px',
    lineHeight: 1.3,
  }
  return (
    <div style={style}>
      {text.slice(0, charsToShow)}
      {showCursor && <span style={{ color: spec.accentColor, opacity: 0.9 }}>|</span>}
    </div>
  )
}

// ─── Main animated text ───────────────────────────────────────────────────────

function AnimatedText({
  text, localFrame, spec, animFrames, sceneDur,
}: {
  text: string; localFrame: number; spec: MotionSpec; animFrames: number; sceneDur: number
}) {
  const clamp = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const }
  // CountUp runs for ~60% of scene duration, starting at scene start
  const countDuration = Math.max(30, Math.round(sceneDur * 0.6))

  if (spec.textAnim === 'word-pop') {
    return <WordPopText text={text} localFrame={localFrame} animFrames={animFrames} spec={spec} sceneDur={sceneDur} />
  }
  if (spec.textAnim === 'typewriter') {
    const twFrames = Math.max(animFrames, text.length * 1.5)
    return <TypewriterText text={text} localFrame={localFrame} animFrames={twFrames} spec={spec} />
  }

  // Base style
  const baseStyle: React.CSSProperties = {
    fontFamily: FONT_FAMILIES[spec.fontFamily] ?? FONT_FAMILIES.sans,
    fontSize: FONT_SIZES[spec.fontSize] ?? 52,
    fontWeight: 700,
    color: spec.textColor,
    textAlign: spec.textAlign as 'left' | 'center' | 'right',
    lineHeight: 1.3,
  }

  let opacity  = 1
  let transform = 'none'

  switch (spec.textAnim) {
    case 'fade': {
      opacity = interpolate(localFrame, [0, animFrames], [0, 1], clamp)
      break
    }
    case 'slide-up': {
      const y = interpolate(localFrame, [0, animFrames], [80, 0], {
        ...clamp, easing: Easing.out(Easing.quad),
      })
      opacity = interpolate(localFrame, [0, animFrames * 0.65], [0, 1], clamp)
      transform = `translateY(${y}px)`
      break
    }
    case 'slide-left': {
      const x = interpolate(localFrame, [0, animFrames], [-120, 0], {
        ...clamp, easing: Easing.out(Easing.quad),
      })
      opacity = interpolate(localFrame, [0, animFrames * 0.65], [0, 1], clamp)
      transform = `translateX(${x}px)`
      break
    }
    case 'zoom': {
      const sc = interpolate(localFrame, [0, animFrames], [0.6, 1], {
        ...clamp, easing: Easing.out(Easing.back(1.3)),
      })
      opacity = interpolate(localFrame, [0, animFrames * 0.55], [0, 1], clamp)
      transform = `scale(${sc})`
      break
    }
    case 'glitch': {
      const isGlitching = localFrame < 12
      const rx = isGlitching ? Math.sin(localFrame * 137.5) * 7 : 0
      const ry = isGlitching ? Math.cos(localFrame * 79.3) * 4 : 0
      opacity = interpolate(localFrame, [0, 8], [0, 1], clamp)
      transform = `translate(${rx}px, ${ry}px)`
      const splitStyle: React.CSSProperties = {
        ...baseStyle,
        opacity,
        transform,
        textShadow: isGlitching
          ? `${Math.sin(localFrame * 99) * 6}px 0 ${spec.accentColor}88, ${Math.cos(localFrame * 99) * -6}px 0 #0ff8`
          : 'none',
      }
      return <AccentText text={text} spec={spec} style={splitStyle} localFrame={localFrame} countDuration={countDuration} />
    }
  }

  return (
    <AccentText
      text={text}
      spec={spec}
      style={{ ...baseStyle, opacity, transform }}
      localFrame={localFrame}
      countDuration={countDuration}
    />
  )
}

// ─── Single segment scene ─────────────────────────────────────────────────────

function SegmentScene({
  seg, localFrame, spec, animFrames, sceneDur,
}: {
  seg: Segment; localFrame: number; spec: MotionSpec; animFrames: number; sceneDur: number
}) {
  return (
    <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Blurred image background */}
      {spec.bgType === 'image-blur' && seg.imageUrl && (
        <AbsoluteFill>
          <Img
            src={seg.imageUrl}
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              filter: 'blur(28px) brightness(0.35)',
              transform: 'scale(1.12)',
            }}
          />
        </AbsoluteFill>
      )}

      {/* Text */}
      <div style={{ width: '100%', padding: '0' }}>
        <AnimatedText text={seg.text} localFrame={localFrame} spec={spec} animFrames={animFrames} sceneDur={sceneDur} />
      </div>
    </AbsoluteFill>
  )
}

// ─── DynamicTemplate ─────────────────────────────────────────────────────────

export const DynamicTemplate: React.FC<VideoProps> = ({ segments, motionSpec }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const spec: MotionSpec = { ...DEFAULT_MOTION_SPEC, ...motionSpec }

  const speedMult = spec.animSpeed === 'slow' ? 2.0 : spec.animSpeed === 'fast' ? 0.55 : 1.0
  const animFrames = Math.round(20 * speedMult)
  const transFrames = spec.transition === 'cut' ? 0 : 9

  // Build cumulative timings
  const timings: Array<{ start: number; end: number; dur: number }> = []
  let cursor = 0
  for (const seg of segments) {
    const dur = Math.max(30, Math.ceil(seg.duration * fps))
    timings.push({ start: cursor, end: cursor + dur, dur })
    cursor += dur
  }

  const clamp = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const }

  return (
    <AbsoluteFill style={{ overflow: 'hidden', background: getBackground(spec) }}>
      {/* Background music */}
      {spec.musicUrl && (
        <Audio src={spec.musicUrl} volume={spec.musicVolume} loop />
      )}

      {/* Segment audio (voiceover) */}
      {segments.map((seg, idx) => {
        if (!seg.audioUrl) return null
        const { start, dur } = timings[idx]
        return (
          <Sequence key={`audio-${seg.id}`} from={start} durationInFrames={dur}>
            <Audio src={seg.audioUrl} />
          </Sequence>
        )
      })}

      {/* Render each segment */}
      {segments.map((seg, idx) => {
        const { start, end, dur } = timings[idx]

        // Window: enterStart … end
        const enterStart = start - transFrames
        if (frame < enterStart || frame >= end) return null

        const localFrame = Math.max(0, frame - start)

        // Transition opacity / transform
        let opacity = 1
        let transTransform = 'none'

        if (spec.transition === 'fade' && transFrames > 0) {
          opacity = interpolate(
            frame,
            [enterStart, start, end - transFrames, end],
            [0, 1, 1, 0],
            clamp,
          )
        } else if (spec.transition === 'slide' && transFrames > 0) {
          const tx = interpolate(frame, [enterStart, start], [100, 0], {
            ...clamp, easing: Easing.out(Easing.quad),
          })
          opacity = interpolate(frame, [enterStart, start], [0, 1], clamp)
          transTransform = `translateX(${tx}%)`
        } else if (spec.transition === 'zoom-in' && transFrames > 0) {
          const sc = interpolate(frame, [enterStart, start], [0.84, 1], clamp)
          opacity = interpolate(frame, [enterStart, start], [0, 1], clamp)
          transTransform = `scale(${sc})`
        }

        return (
          <AbsoluteFill key={seg.id} style={{ opacity, transform: transTransform }}>
            <SegmentScene
              seg={seg}
              localFrame={localFrame}
              spec={spec}
              animFrames={animFrames}
              sceneDur={dur}
            />
          </AbsoluteFill>
        )
      })}

      {/* Overlay effects */}
      <Overlay spec={spec} />
    </AbsoluteFill>
  )
}
