import { randomUUID } from 'crypto'
import type { Segment, MotionSpec } from '@/types'
import { DEFAULT_MOTION_SPEC } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface StructuredScene {
  id?: number
  text: string
  sceneKeywords?: string
  visualMetaphor?: string
  overrideStyle?: string
}

interface StructuredPrompt {
  videoTopic?: string
  globalImageStyle?: string
  imageBackground?: boolean   // true = use image-blur bg, false = solid/gradient
  style?: {
    background?: string
    fontPrimary?: string
    fontSecondary?: string
    accent?: string
    textColor?: string
  }
  motion?: {
    textAnimation?: string
    transition?: string
    durationPerScene?: number
    zoomRange?: [number, number]
  }
  effects?: {
    glow?: boolean
    grain?: boolean
    scanlines?: boolean
    lightRays?: boolean
  }
  audio?: {
    bgm?: string
    sfx?: string[]
  }
  scenes: StructuredScene[]
}

// ─── JSON sanitizer ───────────────────────────────────────────────────────────
// Replace literal newlines/tabs inside JSON string values (common when copy-pasting)

function sanitizeJson(raw: string): string {
  // Replace literal newlines/tabs inside JSON string values
  // Walk char by char to avoid regex `s` flag (dotAll) TS target issues
  let result = ''
  let inString = false
  let escaped = false
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i]
    if (escaped) {
      result += ch
      escaped = false
      continue
    }
    if (ch === '\\' && inString) { escaped = true; result += ch; continue }
    if (ch === '"') { inString = !inString; result += ch; continue }
    if (inString && (ch === '\n' || ch === '\r' || ch === '\t')) {
      result += ' '
      continue
    }
    result += ch
  }
  return result
}

// ─── Detect ───────────────────────────────────────────────────────────────────

export function isStructuredPrompt(content: string): boolean {
  try {
    const parsed = JSON.parse(sanitizeJson(content.trim()))
    return Array.isArray(parsed?.scenes) && parsed.scenes.length > 0
  } catch {
    return false
  }
}

// Returns true for any valid JSON object/array (even unsupported formats)
export function isRawJson(content: string): boolean {
  try {
    const trimmed = content.trim()
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return false
    JSON.parse(sanitizeJson(trimmed))
    return true
  } catch {
    return false
  }
}

// ─── Image prompt builder ─────────────────────────────────────────────────────

function buildImagePrompt(scene: StructuredScene, globalStyle?: string): string {
  const parts: string[] = []
  if (globalStyle) parts.push(globalStyle)
  if (scene.sceneKeywords) parts.push(scene.sceneKeywords)
  if (scene.visualMetaphor) parts.push(scene.visualMetaphor)
  if (scene.overrideStyle) parts.push(scene.overrideStyle)
  // Fallback to scene text if no keywords
  if (parts.length === (globalStyle ? 1 : 0)) parts.push(scene.text)
  return parts.join(', ').slice(0, 300)
}

// ─── MotionSpec mapper ────────────────────────────────────────────────────────

function mapTextAnim(raw?: string): MotionSpec['textAnim'] {
  if (!raw) return DEFAULT_MOTION_SPEC.textAnim
  const s = raw.toLowerCase()
  if (s.includes('glitch'))    return 'glitch'
  if (s.includes('typewriter') || s.includes('type')) return 'typewriter'
  if (s.includes('word'))      return 'word-pop'
  if (s.includes('zoom'))      return 'zoom'
  if (s.includes('slide-left') || s.includes('left')) return 'slide-left'
  if (s.includes('slide') || s.includes('up'))        return 'slide-up'
  if (s.includes('fade'))      return 'fade'
  return DEFAULT_MOTION_SPEC.textAnim
}

function mapTransition(raw?: string): MotionSpec['transition'] {
  if (!raw) return DEFAULT_MOTION_SPEC.transition
  const s = raw.toLowerCase()
  if (s.includes('cut') || s.includes('hard')) return 'cut'
  if (s.includes('slide'))  return 'slide'
  if (s.includes('zoom'))   return 'zoom-in'
  return 'fade' // dissolve, cross-dissolve, etc.
}

function mapFontFamily(raw?: string): MotionSpec['fontFamily'] {
  if (!raw) return DEFAULT_MOTION_SPEC.fontFamily
  const s = raw.toLowerCase()
  if (s.includes('mono') || s.includes('code')) return 'mono'
  if (s.includes('serif') && !s.includes('sans')) return 'serif'
  if (s.includes('display') || s.includes('impact')) return 'display'
  return 'sans'
}

function mapOverlay(effects?: StructuredPrompt['effects']): MotionSpec['overlay'] {
  if (!effects) return DEFAULT_MOTION_SPEC.overlay
  if (effects.grain)     return 'grain'
  if (effects.scanlines) return 'scanlines'
  if (effects.glow)      return 'vignette'
  return 'none'
}

export function buildMotionSpec(p: StructuredPrompt): MotionSpec {
  const bgColor  = p.style?.background ?? DEFAULT_MOTION_SPEC.bgColor
  const bgColor2 = DEFAULT_MOTION_SPEC.bgColor2

  // Use image-blur when scenes have keywords OR user explicitly sets imageBackground: true
  const hasSceneKeywords = p.scenes.some(s => s.sceneKeywords || s.visualMetaphor)
  const useImageBg = p.imageBackground !== false && hasSceneKeywords

  return {
    ...DEFAULT_MOTION_SPEC,
    bgType:      useImageBg ? 'image-blur' : 'dark-gradient',
    bgColor,
    bgColor2,
    fontFamily:  mapFontFamily(p.style?.fontPrimary),
    textColor:   p.style?.textColor   ?? DEFAULT_MOTION_SPEC.textColor,
    accentColor: p.style?.accent      ?? DEFAULT_MOTION_SPEC.accentColor,
    textAnim:    mapTextAnim(p.motion?.textAnimation),
    transition:  mapTransition(p.motion?.transition),
    overlay:     mapOverlay(p.effects),
  }
}

// ─── Main parser ──────────────────────────────────────────────────────────────

export function parseStructuredPrompt(content: string): {
  segments: Segment[]
  motionSpec: MotionSpec
  topic: string
} {
  const p: StructuredPrompt = JSON.parse(sanitizeJson(content.trim()))
  const durationPerScene = p.motion?.durationPerScene ?? 3

  let cursor = 0
  const segments: Segment[] = p.scenes.map((scene, i) => {
    const dur = durationPerScene
    const seg: Segment = {
      id:          randomUUID(),
      order:       i,
      text:        scene.text,
      subtitle:    scene.text.length > 80 ? scene.text.slice(0, 77) + '…' : scene.text,
      duration:    dur,
      startTime:   cursor,
      imagePrompt: buildImagePrompt(scene, p.globalImageStyle),
    }
    cursor += dur
    return seg
  })

  return {
    segments,
    motionSpec: buildMotionSpec(p),
    topic: p.videoTopic ?? '',
  }
}
