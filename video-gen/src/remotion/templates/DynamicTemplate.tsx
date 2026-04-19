import React from 'react'
import {
  AbsoluteFill, useCurrentFrame, useVideoConfig,
  interpolate, Easing, Audio, Img, Sequence,
} from 'remotion'
import type { VideoProps, MotionSpec, Segment, SceneEffect, SubtitleEffect } from '@/types'
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

type SP = { seg: Segment; localFrame: number; spec: MotionSpec; animFrames: number; sceneDur: number }

// ─── Background ───────────────────────────────────────────────────────────────

function getBackground(spec: MotionSpec): string {
  switch (spec.bgType) {
    case 'solid':         return spec.bgColor
    case 'gradient':      return `linear-gradient(135deg, ${spec.bgColor} 0%, ${spec.bgColor2} 100%)`
    case 'dark-gradient': return `linear-gradient(180deg, ${spec.bgColor} 0%, ${spec.bgColor2} 100%)`
    case 'image-blur':    return spec.bgColor
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

function parseNumbers(text: string): TextPart[] {
  const parts: TextPart[] = []
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

function CountUp({
  to, localFrame, totalFrames, isPercent, color,
}: {
  to: number; localFrame: number; totalFrames: number; isPercent: boolean; color: string
}) {
  const clamp  = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const }
  const spinEnd = Math.round(totalFrames * 0.52)

  let value: number
  if (localFrame <= spinEnd) {
    const t      = localFrame / Math.max(spinEnd, 1)
    const cycles = 4
    const sine   = Math.abs(Math.sin(t * Math.PI * cycles))
    value = Math.round(sine * to)
  } else {
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

// ─── Subtitle effects ─────────────────────────────────────────────────────────


function SubtitleBar({
  text, localFrame, sceneDur, accentColor, effect = 'fade-bar',
}: {
  text: string; localFrame: number; sceneDur: number; accentColor: string; effect?: SubtitleEffect
}) {
  const clamp = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const }

  if (!text || effect === 'none') return null

  if (effect === 'fade-bar') {
    const op = interpolate(localFrame, [0, 8, sceneDur - 6, sceneDur], [0, 1, 1, 0], clamp)
    return (
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 100%)',
        padding: '40px 60px 28px',
        opacity: op,
      }}>
        <p style={{ color: '#fff', fontSize: 28, fontWeight: 600, fontFamily: FONT_FAMILIES.sans, textAlign: 'center', lineHeight: 1.4, textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}>{text}</p>
      </div>
    )
  }

  if (effect === 'slide-up') {
    const op = interpolate(localFrame, [0, 8, sceneDur - 6, sceneDur], [0, 1, 1, 0], clamp)
    const y  = interpolate(localFrame, [0, 10], [30, 0], { ...clamp, easing: Easing.out(Easing.quad) })
    return (
      <div style={{
        position: 'absolute', bottom: 40, left: 0, right: 0,
        display: 'flex', justifyContent: 'center',
        opacity: op, transform: `translateY(${y}px)`,
      }}>
        <p style={{ color: '#fff', fontSize: 30, fontWeight: 700, fontFamily: FONT_FAMILIES.sans, textAlign: 'center', background: 'rgba(0,0,0,0.6)', borderRadius: 10, padding: '8px 24px', maxWidth: '80%' }}>{text}</p>
      </div>
    )
  }

  if (effect === 'typewriter') {
    const charsToShow = Math.floor(interpolate(localFrame, [0, Math.min(sceneDur * 0.6, text.length * 2)], [0, text.length], clamp))
    const showCursor  = Math.floor(localFrame * 0.4) % 2 === 0 && charsToShow < text.length
    const op = interpolate(localFrame, [sceneDur - 5, sceneDur], [1, 0], clamp)
    return (
      <div style={{ position: 'absolute', bottom: 40, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: op }}>
        <p style={{ color: '#fff', fontSize: 30, fontWeight: 600, fontFamily: FONT_FAMILIES.mono, textAlign: 'left', background: 'rgba(0,0,0,0.7)', borderRadius: 8, padding: '8px 24px', maxWidth: '80%' }}>
          {text.slice(0, charsToShow)}
          {showCursor && <span style={{ color: accentColor }}>|</span>}
        </p>
      </div>
    )
  }

  if (effect === 'word-highlight') {
    const words = text.split(' ')
    const framesPerWord = Math.max(4, Math.round((sceneDur * 0.8) / Math.max(words.length, 1)))
    const activeIdx = Math.min(words.length - 1, Math.floor(localFrame / framesPerWord))
    const op = interpolate(localFrame, [sceneDur - 5, sceneDur], [1, 0], clamp)
    return (
      <div style={{ position: 'absolute', bottom: 40, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: op }}>
        <p style={{ fontSize: 30, fontWeight: 700, fontFamily: FONT_FAMILIES.sans, textAlign: 'center', background: 'rgba(0,0,0,0.7)', borderRadius: 10, padding: '8px 24px', maxWidth: '80%', display: 'flex', flexWrap: 'wrap' as const, gap: '6px', justifyContent: 'center' }}>
          {words.map((w, i) => (
            <span key={i} style={{ color: i === activeIdx ? accentColor : '#fff', transition: 'color 0.1s', fontWeight: i === activeIdx ? 800 : 600, textShadow: i === activeIdx ? `0 0 20px ${accentColor}` : 'none' }}>{w}</span>
          ))}
        </p>
      </div>
    )
  }

  if (effect === 'karaoke') {
    const words = text.split(' ')
    const framesPerWord = Math.max(4, Math.round((sceneDur * 0.85) / Math.max(words.length, 1)))
    const doneIdx = Math.floor(localFrame / framesPerWord)
    const op = interpolate(localFrame, [sceneDur - 5, sceneDur], [1, 0], clamp)
    return (
      <div style={{ position: 'absolute', bottom: 36, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: op }}>
        <div style={{ background: 'rgba(0,0,0,0.75)', borderRadius: 12, padding: '10px 28px', maxWidth: '85%', display: 'flex', flexWrap: 'wrap' as const, gap: '8px', justifyContent: 'center' }}>
          {words.map((w, i) => (
            <span key={i} style={{
              fontSize: 32, fontWeight: 800, fontFamily: FONT_FAMILIES.sans,
              color: i < doneIdx ? accentColor : i === doneIdx ? '#fff' : 'rgba(255,255,255,0.45)',
              textShadow: i <= doneIdx ? `0 0 15px ${accentColor}88` : 'none',
            }}>{w}</span>
          ))}
        </div>
      </div>
    )
  }

  if (effect === 'karaoke-bounce') {
    const words = text.split(' ')
    const framesPerWord = Math.max(4, Math.round((sceneDur * 0.85) / Math.max(words.length, 1)))
    const activeIdx = Math.min(words.length - 1, Math.floor(localFrame / framesPerWord))
    const wordLocal = localFrame - activeIdx * framesPerWord
    const op = interpolate(localFrame, [sceneDur - 5, sceneDur], [1, 0], clamp)
    return (
      <div style={{ position: 'absolute', bottom: 32, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: op }}>
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '10px', justifyContent: 'center', maxWidth: '88%', padding: '0 16px' }}>
          {words.map((w, i) => {
            const isActive = i === activeIdx
            const isDone = i < activeIdx
            const bounce = isActive
              ? interpolate(wordLocal, [0, 4, 8], [0.7, 1.25, 1.0], { ...clamp, easing: Easing.out(Easing.back(2)) })
              : 1
            const ty = isActive
              ? interpolate(wordLocal, [0, 4, 8], [6, -8, 0], { ...clamp, easing: Easing.out(Easing.quad) })
              : 0
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', transform: `scale(${bounce}) translateY(${ty}px)`, transformOrigin: 'bottom center' }}>
                <span style={{
                  fontSize: 34, fontWeight: 900, fontFamily: FONT_FAMILIES.sans,
                  color: isDone ? accentColor : isActive ? '#fff' : 'rgba(255,255,255,0.4)',
                  textShadow: isActive ? `0 2px 20px rgba(0,0,0,0.8)` : 'none',
                }}>{w}</span>
                <div style={{
                  height: 3, borderRadius: 2, marginTop: 3,
                  width: isActive ? '100%' : isDone ? '100%' : '0%',
                  background: accentColor,
                  boxShadow: isActive ? `0 0 8px ${accentColor}` : 'none',
                  transition: 'width 0.05s',
                }} />
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (effect === 'pill-badge') {
    const op = interpolate(localFrame, [0, 8, sceneDur - 5, sceneDur], [0, 1, 1, 0], clamp)
    const scale = interpolate(localFrame, [0, 8], [0.85, 1], { ...clamp, easing: Easing.out(Easing.back(1.5)) })
    return (
      <div style={{ position: 'absolute', bottom: 44, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: op, transform: `scale(${scale})` }}>
        <p style={{ color: '#fff', fontSize: 28, fontWeight: 700, fontFamily: FONT_FAMILIES.sans, background: accentColor, borderRadius: 50, padding: '10px 32px', maxWidth: '80%', textAlign: 'center' }}>{text}</p>
      </div>
    )
  }

  if (effect === 'neon-caption') {
    const op = interpolate(localFrame, [0, 8, sceneDur - 5, sceneDur], [0, 1, 1, 0], clamp)
    return (
      <div style={{ position: 'absolute', bottom: 44, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: op }}>
        <p style={{
          color: accentColor, fontSize: 30, fontWeight: 800, fontFamily: FONT_FAMILIES.mono,
          textAlign: 'center', letterSpacing: '2px',
          textShadow: `0 0 10px ${accentColor}, 0 0 30px ${accentColor}88, 0 0 60px ${accentColor}44`,
        }}>{text}</p>
      </div>
    )
  }

  if (effect === 'outline-pop') {
    const op    = interpolate(localFrame, [0, 6, sceneDur - 5, sceneDur], [0, 1, 1, 0], clamp)
    const scale = interpolate(localFrame, [0, 6], [0.7, 1], { ...clamp, easing: Easing.out(Easing.back(1.3)) })
    return (
      <div style={{ position: 'absolute', bottom: 44, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: op, transform: `scale(${scale})` }}>
        <p style={{
          color: '#fff', fontSize: 34, fontWeight: 900, fontFamily: FONT_FAMILIES.display,
          textAlign: 'center', letterSpacing: '1px',
          WebkitTextStroke: `3px ${accentColor}`,
          textShadow: `4px 4px 0 ${accentColor}`,
          maxWidth: '80%',
        }}>{text}</p>
      </div>
    )
  }

  // default fallback = fade-bar
  const op = interpolate(localFrame, [0, 8, sceneDur - 6, sceneDur], [0, 1, 1, 0], clamp)
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 100%)',
      padding: '40px 60px 28px', opacity: op,
    }}>
      <p style={{ color: '#fff', fontSize: 28, fontWeight: 600, fontFamily: FONT_FAMILIES.sans, textAlign: 'center', lineHeight: 1.4 }}>{text}</p>
    </div>
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
      display: 'flex', flexWrap: 'wrap',
      justifyContent: spec.textAlign === 'center' ? 'center' : spec.textAlign === 'right' ? 'flex-end' : 'flex-start',
      gap: 12, padding: '0 60px',
      fontFamily: FONT_FAMILIES[spec.fontFamily] ?? FONT_FAMILIES.sans,
      fontSize: FONT_SIZES[spec.fontSize] ?? 52,
      fontWeight: 800, color: spec.textColor, lineHeight: 1.25,
    }}>
      {words.map((word, wi) => {
        const wf  = localFrame - wi * framesPerWord
        const op  = interpolate(wf, [0, 5], [0, 1], clamp)
        const sc  = interpolate(wf, [0, 5, 9], [0, 1.4, 1.0], clamp)
        const col = wi % 3 === 0 ? spec.textColor : wi % 3 === 1 ? spec.accentColor : spec.textColor
        const cleanWord = word.replace(/[.,]/g, '')
        const num = parseInt(cleanWord, 10)
        const isYear = num >= 1900 && num <= 2100
        const isBigNum = !isNaN(num) && num >= 100 && !isYear
        return (
          <span key={wi} style={{ opacity: op, transform: `scale(${sc})`, display: 'inline-block', color: col }}>
            {isBigNum && wf > 0 ? (
              <CountUp to={num} localFrame={Math.max(0, wf)} totalFrames={Math.max(20, sceneDur - wi * framesPerWord)} isPercent={word.endsWith('%')} color={spec.accentColor} />
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
    fontWeight: 700, color: spec.textColor,
    textAlign: spec.textAlign as 'left' | 'center' | 'right',
    padding: '0 60px', lineHeight: 1.3,
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
  const countDuration = Math.max(30, Math.round(sceneDur * 0.6))

  if (spec.textAnim === 'word-pop') {
    return <WordPopText text={text} localFrame={localFrame} animFrames={animFrames} spec={spec} sceneDur={sceneDur} />
  }
  if (spec.textAnim === 'typewriter') {
    const twFrames = Math.min(Math.max(animFrames, text.length * 1.5), sceneDur * 0.85)
    return <TypewriterText text={text} localFrame={localFrame} animFrames={twFrames} spec={spec} />
  }

  const baseStyle: React.CSSProperties = {
    fontFamily: FONT_FAMILIES[spec.fontFamily] ?? FONT_FAMILIES.sans,
    fontSize: FONT_SIZES[spec.fontSize] ?? 52,
    fontWeight: 700, color: spec.textColor,
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
      const y = interpolate(localFrame, [0, animFrames], [80, 0], { ...clamp, easing: Easing.out(Easing.quad) })
      opacity = interpolate(localFrame, [0, animFrames * 0.65], [0, 1], clamp)
      transform = `translateY(${y}px)`
      break
    }
    case 'slide-left': {
      const x = interpolate(localFrame, [0, animFrames], [-120, 0], { ...clamp, easing: Easing.out(Easing.quad) })
      opacity = interpolate(localFrame, [0, animFrames * 0.65], [0, 1], clamp)
      transform = `translateX(${x}px)`
      break
    }
    case 'zoom': {
      const sc = interpolate(localFrame, [0, animFrames], [0.6, 1], { ...clamp, easing: Easing.out(Easing.back(1.3)) })
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
        ...baseStyle, opacity, transform,
        textShadow: isGlitching
          ? `${Math.sin(localFrame * 99) * 6}px 0 ${spec.accentColor}88, ${Math.cos(localFrame * 99) * -6}px 0 #0ff8`
          : 'none',
      }
      return <AccentText text={text} spec={spec} style={splitStyle} localFrame={localFrame} countDuration={countDuration} />
    }
  }

  return (
    <AccentText text={text} spec={spec} style={{ ...baseStyle, opacity, transform }}
      localFrame={localFrame} countDuration={countDuration} />
  )
}

// ─── Scene components ─────────────────────────────────────────────────────────

function DefaultScene({ seg, localFrame, spec, animFrames, sceneDur }: SP) {
  return (
    <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {spec.bgType === 'image-blur' && seg.imageUrl && (
        <AbsoluteFill>
          <Img src={seg.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(10px) brightness(0.55)', transform: 'scale(1.06)' }} />
        </AbsoluteFill>
      )}
      <div style={{ width: '100%' }}>
        <AnimatedText text={seg.text} localFrame={localFrame} spec={spec} animFrames={animFrames} sceneDur={sceneDur} />
      </div>
    </AbsoluteFill>
  )
}

function BoldTitleScene({ seg, localFrame, spec, animFrames }: SP) {
  const clamp = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const }
  const opacity = interpolate(localFrame, [0, animFrames], [0, 1], clamp)
  const scale   = interpolate(localFrame, [0, animFrames], [0.85, 1], { ...clamp, easing: Easing.out(Easing.back(1.2)) })
  return (
    <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 80px' }}>
      {seg.imageUrl && (
        <AbsoluteFill>
          <Img src={seg.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(8px) brightness(0.45)', transform: 'scale(1.05)' }} />
        </AbsoluteFill>
      )}
      <div style={{
        opacity, transform: `scale(${scale})`,
        fontFamily: FONT_FAMILIES.display, fontSize: 96, fontWeight: 900,
        color: spec.textColor, textAlign: 'center', lineHeight: 1.1, letterSpacing: '-2px',
        textShadow: `0 4px 40px ${spec.accentColor}66`,
      }}>
        {seg.text}
      </div>
    </AbsoluteFill>
  )
}

function QuoteCardScene({ seg, localFrame, spec, animFrames }: SP) {
  const clamp = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const }
  const opacity = interpolate(localFrame, [0, animFrames], [0, 1], clamp)
  const y       = interpolate(localFrame, [0, animFrames], [40, 0], { ...clamp, easing: Easing.out(Easing.quad) })
  return (
    <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {seg.imageUrl && (
        <AbsoluteFill>
          <Img src={seg.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(8px) brightness(0.45)', transform: 'scale(1.05)' }} />
        </AbsoluteFill>
      )}
      <div style={{
        opacity, transform: `translateY(${y}px)`,
        maxWidth: '80%', position: 'relative',
        background: 'rgba(255,255,255,0.08)',
        border: `3px solid ${spec.accentColor}88`,
        borderRadius: 20, padding: '50px 60px',
      }}>
        <div style={{ position: 'absolute', top: -20, left: 36, fontSize: 100, color: spec.accentColor, opacity: 0.5, lineHeight: 1, fontFamily: 'Georgia, serif' }}>"</div>
        <div style={{ fontFamily: FONT_FAMILIES.serif, fontSize: 50, fontStyle: 'italic', color: spec.textColor, textAlign: 'center', lineHeight: 1.45, paddingTop: 16 }}>
          {seg.text}
        </div>
        <div style={{ position: 'absolute', bottom: -20, right: 36, fontSize: 100, color: spec.accentColor, opacity: 0.5, lineHeight: 1, fontFamily: 'Georgia, serif' }}>"</div>
      </div>
    </AbsoluteFill>
  )
}

function CaptionBottomScene({ seg, localFrame, spec, animFrames, sceneDur }: SP) {
  const clamp  = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const }
  const textY  = interpolate(localFrame, [0, animFrames], [60, 0], { ...clamp, easing: Easing.out(Easing.quad) })
  const textOp = interpolate(localFrame, [0, animFrames], [0, 1], clamp)
  return (
    <AbsoluteFill>
      {seg.imageUrl
        ? <Img src={seg.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <AbsoluteFill style={{ background: getBackground(spec) }} />}
      <AbsoluteFill style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.88) 100%)' }} />
      <AbsoluteFill style={{ display: 'flex', alignItems: 'flex-end', padding: '0 0 56px' }}>
        <div style={{ width: '100%', transform: `translateY(${textY}px)`, opacity: textOp, padding: '0 60px' }}>
          <div style={{ width: 5, height: 40, background: spec.accentColor, marginBottom: 12, borderRadius: 3 }} />
          <div style={{ fontFamily: FONT_FAMILIES[spec.fontFamily] ?? FONT_FAMILIES.sans, fontSize: FONT_SIZES[spec.fontSize] ?? 52, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
            <RichText text={seg.text} localFrame={localFrame} countDuration={Math.round(sceneDur * 0.7)} color="#fff" accentColor={spec.accentColor} />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

function LowerThirdScene({ seg, localFrame, spec, animFrames }: SP) {
  const clamp  = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const }
  const barX   = interpolate(localFrame, [0, animFrames], [-300, 0], { ...clamp, easing: Easing.out(Easing.quad) })
  const textOp = interpolate(localFrame, [Math.max(0, animFrames - 5), animFrames + 8], [0, 1], clamp)
  return (
    <AbsoluteFill>
      {seg.imageUrl
        ? <Img src={seg.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : <AbsoluteFill style={{ background: getBackground(spec) }} />}
      <AbsoluteFill style={{ display: 'flex', alignItems: 'flex-end', padding: '0 0 100px' }}>
        <div style={{ transform: `translateX(${barX}px)`, background: spec.accentColor, padding: '16px 48px', borderRadius: '0 12px 12px 0', maxWidth: '78%' }}>
          <div style={{ opacity: textOp, fontFamily: FONT_FAMILIES.sans, fontSize: 42, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {seg.text}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

function ImageFullScene({ seg, localFrame, spec, animFrames, sceneDur }: SP) {
  const clamp   = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const }
  const opacity = interpolate(localFrame, [0, animFrames], [0, 1], clamp)
  const scale   = interpolate(localFrame, [0, sceneDur], [1.0, 1.05], clamp)
  return (
    <AbsoluteFill>
      {seg.imageUrl
        ? <AbsoluteFill><Img src={seg.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${scale})` }} /></AbsoluteFill>
        : <AbsoluteFill style={{ background: getBackground(spec) }} />}
      <AbsoluteFill style={{ background: 'rgba(0,0,0,0.42)' }} />
      <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', opacity, padding: '0 80px' }}>
        <div style={{ fontFamily: FONT_FAMILIES[spec.fontFamily] ?? FONT_FAMILIES.sans, fontSize: FONT_SIZES[spec.fontSize] ?? 52, fontWeight: 700, color: '#fff', textAlign: 'center', lineHeight: 1.3, textShadow: '0 2px 20px rgba(0,0,0,0.9)' }}>
          <RichText text={seg.text} localFrame={localFrame} countDuration={Math.round(sceneDur * 0.7)} color="#fff" accentColor={spec.accentColor} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

function ImageSideScene({ seg, localFrame, spec, animFrames }: SP) {
  const clamp  = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const }
  const textX  = interpolate(localFrame, [0, animFrames], [-60, 0], { ...clamp, easing: Easing.out(Easing.quad) })
  const textOp = interpolate(localFrame, [0, animFrames], [0, 1], clamp)
  const imgX   = interpolate(localFrame, [0, animFrames], [60, 0], { ...clamp, easing: Easing.out(Easing.quad) })
  return (
    <AbsoluteFill style={{ display: 'flex', flexDirection: 'row' }}>
      <div style={{ width: '50%', background: getBackground(spec), display: 'flex', alignItems: 'center', justifyContent: 'flex-start', padding: '60px 50px', transform: `translateX(${textX}px)`, opacity: textOp }}>
        <div>
          <div style={{ width: 6, height: 50, background: spec.accentColor, borderRadius: 3, marginBottom: 20 }} />
          <div style={{ fontFamily: FONT_FAMILIES[spec.fontFamily] ?? FONT_FAMILIES.sans, fontSize: 46, fontWeight: 700, color: spec.textColor, lineHeight: 1.35 }}>
            {seg.text}
          </div>
        </div>
      </div>
      <div style={{ width: '50%', transform: `translateX(${imgX}px)`, overflow: 'hidden' }}>
        {seg.imageUrl
          ? <Img src={seg.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', background: spec.accentColor + '33' }} />}
      </div>
    </AbsoluteFill>
  )
}

function ImageTopScene({ seg, localFrame, spec, animFrames }: SP) {
  const clamp  = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const }
  const textY  = interpolate(localFrame, [0, animFrames], [40, 0], { ...clamp, easing: Easing.out(Easing.quad) })
  const textOp = interpolate(localFrame, [0, animFrames], [0, 1], clamp)
  return (
    <AbsoluteFill style={{ flexDirection: 'column', display: 'flex' }}>
      <div style={{ height: '55%', overflow: 'hidden', position: 'relative' }}>
        {seg.imageUrl
          ? <Img src={seg.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', background: spec.accentColor + '33' }} />}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: `linear-gradient(to bottom, transparent, ${spec.bgColor})` }} />
      </div>
      <div style={{ height: '45%', background: getBackground(spec), display: 'flex', alignItems: 'center', padding: '20px 60px', transform: `translateY(${textY}px)`, opacity: textOp }}>
        <div style={{ fontFamily: FONT_FAMILIES[spec.fontFamily] ?? FONT_FAMILIES.sans, fontSize: 46, fontWeight: 700, color: spec.textColor, lineHeight: 1.35 }}>
          {seg.text}
        </div>
      </div>
    </AbsoluteFill>
  )
}

function CountingNumberScene({ seg, localFrame, spec, sceneDur }: SP) {
  const clamp = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const }
  const parts   = parseNumbers(seg.text)
  const numPart = parts.find(p => p.kind === 'number') as Extract<TextPart, { kind: 'number' }> | undefined

  if (!numPart) return <DefaultScene seg={seg} localFrame={localFrame} spec={spec} animFrames={20} sceneDur={sceneDur} />

  const label  = parts.filter(p => p.kind === 'text').map(p => (p as Extract<TextPart, { kind: 'text' }>).value).join(' ').trim()
  const opacity = interpolate(localFrame, [0, 15], [0, 1], clamp)
  const labelY  = interpolate(localFrame, [0, 20], [20, 0], { ...clamp, easing: Easing.out(Easing.quad) })

  return (
    <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
      {seg.imageUrl && (
        <AbsoluteFill>
          <Img src={seg.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(8px) brightness(0.4)', transform: 'scale(1.05)' }} />
        </AbsoluteFill>
      )}
      <div style={{ opacity, display: 'flex', alignItems: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontFamily: FONT_FAMILIES.display, fontSize: 160, fontWeight: 900, lineHeight: 1, color: spec.accentColor, textShadow: `0 0 60px ${spec.accentColor}88` }}>
          <CountUp to={numPart.num} localFrame={localFrame} totalFrames={Math.round(sceneDur * 0.85)} isPercent={numPart.isPercent} color={spec.accentColor} />
        </div>
        {label && (
          <div style={{ transform: `translateY(${labelY}px)`, fontFamily: FONT_FAMILIES[spec.fontFamily] ?? FONT_FAMILIES.sans, fontSize: 44, fontWeight: 600, color: spec.textColor, textAlign: 'center', opacity: 0.85, padding: '0 60px' }}>
            {label}
          </div>
        )}
      </div>
    </AbsoluteFill>
  )
}

function ChartBarScene({ seg, localFrame, spec, animFrames, sceneDur }: SP) {
  const clamp = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const }
  const parts = parseNumbers(seg.text)
  const bars: { label: string; value: number }[] = []
  let currentLabel = ''

  for (const part of parts) {
    if (part.kind === 'text') {
      currentLabel += part.value
    } else {
      const label = currentLabel.replace(/[:\-,]+$/, '').trim().slice(-30)
      bars.push({ label: label || String(part.num), value: part.num })
      currentLabel = ''
    }
  }

  if (bars.length === 0) return <DefaultScene seg={seg} localFrame={localFrame} spec={spec} animFrames={animFrames} sceneDur={sceneDur} />

  const maxVal  = Math.max(...bars.map(b => b.value))
  const titleOp = interpolate(localFrame, [0, animFrames], [0, 1], clamp)

  return (
    <AbsoluteFill style={{ background: getBackground(spec), padding: '50px 80px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ opacity: titleOp, fontFamily: FONT_FAMILIES[spec.fontFamily] ?? FONT_FAMILIES.sans, fontSize: 38, fontWeight: 700, color: spec.textColor, marginBottom: 12 }}>
        {seg.text.replace(/\d[\d.,]*/g, '').replace(/\s+/g, ' ').trim().slice(0, 60) || 'Statistics'}
      </div>
      {bars.slice(0, 6).map((bar, i) => {
        const delay = i * 5
        const progress = interpolate(localFrame, [delay, delay + 25], [0, bar.value / maxVal], { ...clamp, easing: Easing.out(Easing.cubic) })
        const barOp = interpolate(localFrame, [delay, delay + 10], [0, 1], clamp)
        return (
          <div key={i} style={{ opacity: barOp }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, color: spec.textColor, fontFamily: FONT_FAMILIES.sans, fontSize: 28, fontWeight: 600 }}>
              <span>{bar.label}</span>
              <span style={{ color: spec.accentColor }}>
                <CountUp to={bar.value} localFrame={Math.max(0, localFrame - delay)} totalFrames={Math.max(25, sceneDur - delay)} isPercent={false} color={spec.accentColor} />
              </span>
            </div>
            <div style={{ height: 26, borderRadius: 13, background: 'rgba(255,255,255,0.12)' }}>
              <div style={{ height: '100%', width: `${progress * 100}%`, borderRadius: 13, background: `linear-gradient(90deg, ${spec.accentColor}, ${spec.accentColor}aa)`, boxShadow: `0 0 20px ${spec.accentColor}66` }} />
            </div>
          </div>
        )
      })}
    </AbsoluteFill>
  )
}

function ProgressRingScene({ seg, localFrame, spec, sceneDur }: SP) {
  const clamp    = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const }
  const pctMatch = seg.text.match(/(\d+(?:\.\d+)?)\s*%/)
  if (!pctMatch) return <DefaultScene seg={seg} localFrame={localFrame} spec={spec} animFrames={20} sceneDur={sceneDur} />

  const targetPct = Math.min(100, parseFloat(pctMatch[1]))
  const label     = seg.text.replace(pctMatch[0], '').trim()
  const progress  = interpolate(localFrame, [0, Math.round(sceneDur * 0.8)], [0, targetPct], { ...clamp, easing: Easing.out(Easing.cubic) })
  const opacity   = interpolate(localFrame, [0, 15], [0, 1], clamp)

  const size   = 340
  const stroke = 26
  const r      = (size - stroke) / 2
  const circ   = 2 * Math.PI * r
  const offset = circ - (progress / 100) * circ

  return (
    <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 36 }}>
      {seg.imageUrl && (
        <AbsoluteFill>
          <Img src={seg.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(8px) brightness(0.4)', transform: 'scale(1.05)' }} />
        </AbsoluteFill>
      )}
      <div style={{ opacity, position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={spec.accentColor} strokeWidth={stroke}
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 12px ${spec.accentColor})` }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <div style={{ fontFamily: FONT_FAMILIES.display, fontSize: 90, fontWeight: 900, color: spec.accentColor, lineHeight: 1 }}>
            {Math.round(progress)}%
          </div>
        </div>
      </div>
      {label && (
        <div style={{ fontFamily: FONT_FAMILIES[spec.fontFamily] ?? FONT_FAMILIES.sans, fontSize: 42, fontWeight: 600, color: spec.textColor, textAlign: 'center', opacity: 0.9, padding: '0 80px' }}>
          {label}
        </div>
      )}
    </AbsoluteFill>
  )
}

function MinimalTextScene({ seg, localFrame, spec, animFrames }: SP) {
  const clamp   = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const }
  const opacity = interpolate(localFrame, [0, animFrames * 1.5], [0, 1], clamp)
  const y       = interpolate(localFrame, [0, animFrames * 1.5], [20, 0], { ...clamp, easing: Easing.out(Easing.quad) })
  const alignMap = { left: 'flex-start', center: 'center', right: 'flex-end' } as const
  return (
    <AbsoluteFill style={{ background: spec.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 100px' }}>
      <div style={{ opacity, transform: `translateY(${y}px)`, textAlign: spec.textAlign as 'left' | 'center' | 'right', width: '100%' }}>
        <div style={{ fontFamily: FONT_FAMILIES.serif, fontSize: 56, fontWeight: 300, color: spec.textColor, lineHeight: 1.5, letterSpacing: '0.5px' }}>
          {seg.text}
        </div>
        <div style={{ width: 60, height: 3, background: spec.accentColor, marginTop: 30, borderRadius: 2, marginLeft: alignMap[spec.textAlign as keyof typeof alignMap] === 'flex-end' ? 'auto' : spec.textAlign === 'center' ? 'auto' : 0, marginRight: spec.textAlign === 'center' ? 'auto' : 0 }} />
      </div>
    </AbsoluteFill>
  )
}

function NeonGlowScene({ seg, localFrame, spec, animFrames }: SP) {
  const clamp         = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const }
  const glowIntensity = interpolate(localFrame, [0, animFrames, animFrames + 15], [0, 1.5, 1], clamp)
  const opacity       = interpolate(localFrame, [0, animFrames], [0, 1], clamp)
  const g             = spec.accentColor
  const textShadow    = glowIntensity > 0.1
    ? `0 0 ${10 * glowIntensity}px ${g}, 0 0 ${30 * glowIntensity}px ${g}, 0 0 ${60 * glowIntensity}px ${g}88`
    : 'none'
  return (
    <AbsoluteFill style={{ background: '#050010', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 80px' }}>
      <AbsoluteFill style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.2) 2px, rgba(0,0,0,0.2) 4px)', pointerEvents: 'none' }} />
      <div style={{ opacity, fontFamily: FONT_FAMILIES.mono, fontSize: FONT_SIZES[spec.fontSize] ?? 52, fontWeight: 700, color: g, textAlign: 'center', lineHeight: 1.3, textShadow, letterSpacing: '2px' }}>
        {seg.text}
      </div>
    </AbsoluteFill>
  )
}

function SplitScreenScene({ seg, localFrame, spec, animFrames, sceneDur }: SP) {
  const clamp    = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const }
  const imgScale = interpolate(localFrame, [0, sceneDur], [1.05, 1.0], clamp)
  const textX    = interpolate(localFrame, [0, animFrames], [50, 0], { ...clamp, easing: Easing.out(Easing.quad) })
  const textOp   = interpolate(localFrame, [0, animFrames], [0, 1], clamp)
  return (
    <AbsoluteFill style={{ display: 'flex', flexDirection: 'row' }}>
      <div style={{ width: '55%', overflow: 'hidden' }}>
        {seg.imageUrl
          ? <Img src={seg.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${imgScale})` }} />
          : <div style={{ width: '100%', height: '100%', background: spec.accentColor + '44' }} />}
      </div>
      <div style={{ width: '45%', background: getBackground(spec), display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 50px', transform: `translateX(${textX}px)`, opacity: textOp }}>
        <div style={{ fontFamily: FONT_FAMILIES[spec.fontFamily] ?? FONT_FAMILIES.sans, fontSize: 44, fontWeight: 700, color: spec.textColor, lineHeight: 1.4 }}>
          {seg.text}
        </div>
      </div>
    </AbsoluteFill>
  )
}

function TypewriterFocusScene({ seg, localFrame, spec, animFrames, sceneDur }: SP) {
  const clamp       = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const }
  const twFrames    = Math.min(Math.max(animFrames, seg.text.length * 1.5), sceneDur * 0.85)
  const charsToShow = Math.floor(interpolate(localFrame, [0, twFrames], [0, seg.text.length], clamp))
  const showCursor  = Math.floor(localFrame * 0.35) % 2 === 0 && charsToShow < seg.text.length
  const spotlightOp = interpolate(localFrame, [0, 15], [0, 1], clamp)
  return (
    <AbsoluteFill style={{ background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 80px' }}>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(255,255,255,0.06) 0%, transparent 70%)', opacity: spotlightOp, pointerEvents: 'none' }} />
      <div style={{ fontFamily: FONT_FAMILIES.mono, fontSize: FONT_SIZES[spec.fontSize] ?? 52, fontWeight: 600, color: spec.textColor, textAlign: 'left', lineHeight: 1.4, width: '100%', borderLeft: `4px solid ${spec.accentColor}`, paddingLeft: 40 }}>
        {seg.text.slice(0, charsToShow)}
        {showCursor && <span style={{ color: spec.accentColor }}>█</span>}
      </div>
    </AbsoluteFill>
  )
}

function WordByWordScene({ seg, localFrame, spec, sceneDur }: SP) {
  const words        = seg.text.split(' ')
  const clamp        = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const }
  const framesPerWord = Math.max(8, Math.round((sceneDur * 0.85) / Math.max(words.length, 1)))
  const currentIdx   = Math.min(words.length - 1, Math.floor(localFrame / framesPerWord))
  const wordLocal    = localFrame - currentIdx * framesPerWord
  const opacity      = interpolate(wordLocal, [0, 5], [0, 1], clamp)
  const scale        = interpolate(wordLocal, [0, 5, 10], [0.6, 1.15, 1.0], clamp)
  const word         = words[currentIdx]

  return (
    <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {seg.imageUrl && (
        <AbsoluteFill>
          <Img src={seg.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(8px) brightness(0.45)', transform: 'scale(1.05)' }} />
        </AbsoluteFill>
      )}
      <div style={{ opacity, transform: `scale(${scale})`, fontFamily: FONT_FAMILIES[spec.fontFamily] ?? FONT_FAMILIES.display, fontSize: 120, fontWeight: 900, color: currentIdx % 2 === 0 ? spec.textColor : spec.accentColor, textAlign: 'center', textShadow: '0 4px 40px rgba(0,0,0,0.5)', padding: '0 60px', lineHeight: 1.1 }}>
        {word}
      </div>
    </AbsoluteFill>
  )
}

// ─── Karaoke scene ───────────────────────────────────────────────────────────

function KaraokeScene({ seg, localFrame, spec, sceneDur }: SP) {
  const words = seg.text.split(' ')
  const clamp = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const }
  const framesPerWord = Math.max(4, Math.round((sceneDur * 0.88) / Math.max(words.length, 1)))
  const activeIdx = Math.min(words.length - 1, Math.floor(localFrame / framesPerWord))
  const wordLocal = localFrame - activeIdx * framesPerWord

  const sceneOp = interpolate(localFrame, [0, 8, sceneDur - 6, sceneDur], [0, 1, 1, 0], clamp)

  return (
    <AbsoluteFill style={{ background: '#080012', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: sceneOp }}>
      {/* Ambient glow behind active word */}
      <div style={{
        position: 'absolute',
        width: 420, height: 220,
        borderRadius: '50%',
        background: `radial-gradient(ellipse, ${spec.accentColor}28 0%, transparent 70%)`,
        filter: 'blur(40px)',
        pointerEvents: 'none',
      }} />

      {seg.imageUrl && (
        <AbsoluteFill>
          <Img src={seg.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(14px) brightness(0.25)', transform: 'scale(1.06)' }} />
        </AbsoluteFill>
      )}

      <div style={{
        display: 'flex', flexWrap: 'wrap' as const,
        justifyContent: 'center', alignItems: 'center',
        gap: '14px 18px',
        padding: '0 64px',
        maxWidth: '100%',
      }}>
        {words.map((word, i) => {
          const isDone   = i < activeIdx
          const isActive = i === activeIdx
          const bounce   = isActive
            ? interpolate(wordLocal, [0, 3, 7], [0.85, 1.18, 1.0], { ...clamp, easing: Easing.out(Easing.back(2)) })
            : 1
          const ty = isActive
            ? interpolate(wordLocal, [0, 3, 7], [8, -10, 0], { ...clamp, easing: Easing.out(Easing.quad) })
            : 0

          const color = isDone
            ? spec.accentColor
            : isActive
              ? '#ffffff'
              : 'rgba(255,255,255,0.28)'

          const shadow = isDone
            ? `0 0 12px ${spec.accentColor}66`
            : isActive
              ? `0 0 24px ${spec.accentColor}, 0 0 60px ${spec.accentColor}66`
              : 'none'

          return (
            <div key={i} style={{
              display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
              transform: `scale(${bounce}) translateY(${ty}px)`,
              transformOrigin: 'bottom center',
            }}>
              <span style={{
                fontFamily: FONT_FAMILIES[spec.fontFamily] ?? FONT_FAMILIES.sans,
                fontSize: FONT_SIZES[spec.fontSize] ?? 66,
                fontWeight: 900,
                color,
                textShadow: shadow,
                letterSpacing: '-0.5px',
                lineHeight: 1.2,
                transition: 'color 0.05s',
              }}>
                {word}
              </span>
              {/* Underline bar that fills in for done/active words */}
              <div style={{
                height: 4, borderRadius: 2, marginTop: 4,
                width: (isDone || isActive) ? '100%' : '0%',
                background: spec.accentColor,
                boxShadow: isActive ? `0 0 10px ${spec.accentColor}` : 'none',
                transition: 'width 0.06s',
              }} />
            </div>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}

// ─── Scene router ─────────────────────────────────────────────────────────────

function SegmentScene({ seg, localFrame, spec, animFrames, sceneDur }: SP) {
  const effect = (seg.sceneEffect ?? 'default') as SceneEffect
  const props  = { seg, localFrame, spec, animFrames, sceneDur }
  switch (effect) {
    case 'bold-title':        return <BoldTitleScene {...props} />
    case 'quote-card':        return <QuoteCardScene {...props} />
    case 'caption-bottom':    return <CaptionBottomScene {...props} />
    case 'lower-third':       return <LowerThirdScene {...props} />
    case 'image-full':        return <ImageFullScene {...props} />
    case 'image-side':        return <ImageSideScene {...props} />
    case 'image-top':         return <ImageTopScene {...props} />
    case 'counting-number':   return <CountingNumberScene {...props} />
    case 'chart-bar':         return <ChartBarScene {...props} />
    case 'progress-ring':     return <ProgressRingScene {...props} />
    case 'minimal-text':      return <MinimalTextScene {...props} />
    case 'neon-glow':         return <NeonGlowScene {...props} />
    case 'split-screen':      return <SplitScreenScene {...props} />
    case 'typewriter-focus':  return <TypewriterFocusScene {...props} />
    case 'word-by-word':      return <WordByWordScene {...props} />
    case 'karaoke':           return <KaraokeScene {...props} />
    default:                  return <DefaultScene {...props} />
  }
}

// ─── DynamicTemplate ─────────────────────────────────────────────────────────

export const DynamicTemplate: React.FC<VideoProps> = ({ segments, motionSpec }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const spec: MotionSpec = { ...DEFAULT_MOTION_SPEC, ...motionSpec }

  const speedMult  = spec.animSpeed === 'slow' ? 2.0 : spec.animSpeed === 'fast' ? 0.55 : 1.0
  const animFrames = Math.round(20 * speedMult)
  const transFrames = spec.transition === 'cut' ? 0 : 9

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
      {spec.musicUrl && <Audio src={spec.musicUrl} volume={spec.musicVolume} loop />}

      {segments.map((seg, idx) => {
        if (!seg.audioUrl) return null
        const { start, dur } = timings[idx]
        return (
          <Sequence key={`audio-${seg.id}`} from={start} durationInFrames={dur}>
            <Audio src={seg.audioUrl} />
          </Sequence>
        )
      })}

      {segments.map((seg, idx) => {
        const { start, end, dur } = timings[idx]
        const enterStart = start - transFrames
        if (frame < enterStart || frame >= end) return null

        const localFrame = Math.max(0, frame - start)
        let opacity = 1
        let transTransform = 'none'

        if (spec.transition === 'fade' && transFrames > 0) {
          opacity = interpolate(frame, [enterStart, start, end - transFrames, end], [0, 1, 1, 0], clamp)
        } else if (spec.transition === 'slide' && transFrames > 0) {
          const tx = interpolate(frame, [enterStart, start], [100, 0], { ...clamp, easing: Easing.out(Easing.quad) })
          opacity = interpolate(frame, [enterStart, start], [0, 1], clamp)
          transTransform = `translateX(${tx}%)`
        } else if (spec.transition === 'zoom-in' && transFrames > 0) {
          const sc = interpolate(frame, [enterStart, start], [0.84, 1], clamp)
          opacity = interpolate(frame, [enterStart, start], [0, 1], clamp)
          transTransform = `scale(${sc})`
        }

        const sceneEffect = (seg.sceneEffect ?? 'default') as SceneEffect
        // Only show subtitle for image-based scenes; text-heavy scenes already display text prominently
        const IMAGE_SCENES: SceneEffect[] = ['image-full', 'caption-bottom', 'lower-third', 'split-screen', 'image-side', 'image-top']
        const subtitleEffect: SubtitleEffect = (seg.subtitleEffect as SubtitleEffect) || (
          IMAGE_SCENES.includes(sceneEffect) ? 'fade-bar'
          : sceneEffect === 'neon-glow' ? 'neon-caption'
          : 'none'
        )

        return (
          <AbsoluteFill key={seg.id} style={{ opacity, transform: transTransform }}>
            <SegmentScene seg={seg} localFrame={localFrame} spec={spec} animFrames={animFrames} sceneDur={dur} />
            {seg.subtitle && (
              <SubtitleBar
                text={seg.subtitle}
                localFrame={localFrame}
                sceneDur={dur}
                accentColor={spec.accentColor}
                effect={subtitleEffect}
              />
            )}
          </AbsoluteFill>
        )
      })}

      <Overlay spec={spec} />
    </AbsoluteFill>
  )
}
