import type { Segment } from '@/types'
import { randomUUID } from 'crypto'

const WPM: Record<string, number> = { vi: 130, en: 150 }
const MIN_DUR = 2
const MAX_DUR = 8

function estimateDuration(text: string, lang: string): number {
  const wpm   = WPM[lang] ?? 140
  const words = text.trim().split(/\s+/).length
  return Math.min(MAX_DUR, Math.max(MIN_DUR, (words / wpm) * 60))
}

function splitLong(sentence: string, lang: string): string[] {
  if (estimateDuration(sentence, lang) <= MAX_DUR) return [sentence]
  const mid      = Math.floor(sentence.length / 2)
  const commaIdx = sentence.indexOf(',', mid - 20)
  if (commaIdx > 0) {
    return [sentence.slice(0, commaIdx + 1).trim(), sentence.slice(commaIdx + 1).trim()].filter(Boolean)
  }
  const words = sentence.split(' ')
  const half  = Math.floor(words.length / 2)
  return [words.slice(0, half).join(' '), words.slice(half).join(' ')]
}

function extractImagePrompt(text: string): string {
  const stop = /\b(và|của|các|những|một|là|có|được|này|đó|the|a|an|is|are|was|were)\b/gi
  return text.replace(stop, '').replace(/\s+/g, ' ').trim().slice(0, 120)
}

export function parseTranscript(text: string, language = 'vi'): Segment[] {
  if (!text.trim()) throw new Error('Transcript is empty')

  // Chuẩn hóa paragraph breaks: \n + spaces + \n → \n\n
  const normalized = text.replace(/\n[ \t]*\n/g, '\n\n')

  const raw = normalized
    .split(/\n\n+|(?<=[.!?…])\s{2,}/)
    .map(s => s.replace(/\n/g, ' ').trim())
    .filter(Boolean)

  const sentences = raw.flatMap(s => splitLong(s, language))

  let cursor = 0
  return sentences.map((sentence, i) => {
    const duration = estimateDuration(sentence, language)
    const seg: Segment = {
      id:          randomUUID(),
      order:       i,
      text:        sentence,
      subtitle:    sentence.length > 80 ? sentence.slice(0, 77) + '…' : sentence,
      duration,
      startTime:   cursor,
      imagePrompt: extractImagePrompt(sentence),
    }
    cursor += duration
    return seg
  })
}
