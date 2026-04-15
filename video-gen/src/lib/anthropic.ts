import Anthropic from '@anthropic-ai/sdk'
import type { MotionSpec } from '@/types'
import { DEFAULT_MOTION_SPEC } from '@/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ─── Helpers ──────────────────────────────────────────────────────────────────

// LLM hay trả JSON với literal newline/tab bên trong string → JSON.parse fail.
// Hàm này đi qua từng ký tự, nhận biết đang trong string hay không,
// và escape các control char chỉ khi ở trong string value.
function fixJsonControlChars(json: string): string {
  let result  = ''
  let inStr   = false
  let escaped = false

  for (const ch of json) {
    if (escaped)            { result += ch; escaped = false; continue }
    if (ch === '\\')        { result += ch; escaped = true;  continue }
    if (ch === '"')         { inStr = !inStr; result += ch;  continue }
    if (inStr) {
      if (ch === '\n')      { result += '\\n';  continue }
      if (ch === '\r')      { result += '\\r';  continue }
      if (ch === '\t')      { result += '\\t';  continue }
    }
    result += ch
  }
  return result
}

// ─── LLM abstraction: dùng Anthropic nếu có key, fallback sang Gemini ─────────

export async function callLLM(prompt: string, maxTokens = 2048): Promise<string> {
  // 1. Anthropic Claude (tốt nhất)
  if (process.env.ANTHROPIC_API_KEY) {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-20250514', max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    })
    const block = msg.content[0]
    if (block.type !== 'text') throw new Error('Unexpected Anthropic response')
    return block.text.trim()
  }

  // 2. Groq — miễn phí, nhanh (console.groq.com)
  if (process.env.GROQ_API_KEY) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`)
    const data = await res.json()
    return data.choices[0].message.content.trim()
  }

  // 3. Gemini (aistudio.google.com — cần enable billing hoặc dùng key hợp lệ)
  if (process.env.GEMINI_API_KEY) {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genai.getGenerativeModel({ model: 'gemini-2.0-flash-lite' })
    const result = await model.generateContent(prompt)
    return result.response.text().trim()
  }

  throw new Error('Chưa cấu hình AI key. Thêm GROQ_API_KEY, ANTHROPIC_API_KEY hoặc GEMINI_API_KEY vào .env')
}

export async function expandIdea(idea: string, language: string): Promise<string> {
  const langLabel = language === 'vi' ? 'Vietnamese' : 'English'
  return callLLM(`You are a professional video script writer. Write a natural, engaging video narration script.

Rules:
- Write ONLY the narration text — no headers, no stage directions, no markdown
- Use ${langLabel} throughout
- Target: 250–400 words (~2 min of speech)
- Split into natural paragraphs (one idea per paragraph)
- Clear, simple language suitable for voiceover

Idea: ${idea}`, 1024)
}

// ─── AI Video Studio ──────────────────────────────────────────────────────────

export interface VideoStudioResult {
  template: string
  reasoning: string
  script: string
}

export async function generateVideoFromDescription(params: {
  description: string
  platform: 'tiktok' | 'youtube' | 'instagram'
  tone: string
  durationSec: number
  language: string
  templates: { id: string; name: string; description: string; tags: string[] }[]
}): Promise<VideoStudioResult> {
  const { description, platform, tone, durationSec, language, templates } = params
  const langLabel  = language === 'vi' ? 'Vietnamese' : 'English'
  const wordTarget = Math.round((durationSec / 60) * (language === 'vi' ? 130 : 150))

  const templateList = templates
    .map(t => `- ${t.id}: ${t.name} — ${t.description} [tags: ${t.tags.join(', ')}]`)
    .join('\n')

  const raw = await callLLM(`You are a professional video producer and scriptwriter. Given a description, select the best template and write an optimized script.

Platform: ${platform}
Tone: ${tone}
Duration: ~${durationSec} seconds (~${wordTarget} words)
Language: ${langLabel}

Available templates:
${templateList}

Template selection rules:
- TikTok + viral/dramatic/hook → prefer: hook, tiktokcaption, wordpop, neon, breaking, reels
- TikTok + educational/facts   → prefer: tiktokcaption, lesson, datastats, karaoke
- YouTube                      → prefer: news, edu, documentary, podcast, story, tech
- Instagram                    → prefer: stories, gradient, quote, magazine, social
- Match tone keywords to template mood (retro, neon, kids, sports, chat, meme, etc.)

Script rules:
- Write ONLY narration text — no headers, stage directions, or markdown
- Use ${langLabel}
- Split into short paragraphs (1–3 sentences max, one idea each) — each paragraph = one video segment
- For "hook" template: first paragraph MUST be a short shocking question or statement (≤10 words)
- For "tiktokcaption" / "wordpop": use punchy short sentences, high-energy language
- For "karaoke": rhythmic, lyrical phrasing
- Target ~${wordTarget} words total

Description:
${description}

Respond using EXACTLY this format (no JSON, no markdown, no extra text):
TEMPLATE: <template_id>
REASONING: <1-2 sentences why>
SCRIPT:
<full narration — paragraphs separated by blank lines>
END_SCRIPT`)

  return parseStudioResponse(raw)
}

// Parse định dạng text thay vì JSON — tránh hoàn toàn lỗi JSON parse
function parseStudioResponse(raw: string): VideoStudioResult {
  const templateMatch  = raw.match(/^TEMPLATE:\s*(\S+)/m)
  const reasoningMatch = raw.match(/^REASONING:\s*(.+)/m)

  const template  = templateMatch?.[1]?.trim().toLowerCase() ?? 'news'
  const reasoning = reasoningMatch?.[1]?.trim() ?? ''

  // Dùng indexOf thay vì regex để tránh lỗi $ match cuối dòng khi có flag /m
  const scriptStart = raw.indexOf('\nSCRIPT:\n')
  let script = ''
  if (scriptStart >= 0) {
    const afterScript = raw.slice(scriptStart + '\nSCRIPT:\n'.length)
    const endIdx = afterScript.indexOf('\nEND_SCRIPT')
    script = (endIdx >= 0 ? afterScript.slice(0, endIdx) : afterScript).trim()
  }

  // Fallback: thử SCRIPT: không có newline ngay sau
  if (!script) {
    const altStart = raw.indexOf('SCRIPT:')
    if (altStart >= 0) {
      const afterScript = raw.slice(altStart + 'SCRIPT:'.length).replace(/^\s*\n/, '')
      const endIdx = afterScript.indexOf('\nEND_SCRIPT')
      script = (endIdx >= 0 ? afterScript.slice(0, endIdx) : afterScript).trim()
    }
  }

  if (!script) throw new Error('LLM response missing SCRIPT section:\n' + raw.slice(0, 400))

  return { template, reasoning, script }
}

// ─── Image prompts ────────────────────────────────────────────────────────────

// Sinh English image search keywords cho từng segment
// Trả về mảng keywords tương ứng 1-1 với segments
export async function generateImagePrompts(
  segments: { text: string }[],
  language: string,
  imageStyle?: string,
): Promise<string[]> {
  if (segments.length === 0) return []

  const numbered = segments
    .map((s, i) => `${i + 1}. ${s.text}`)
    .join('\n')

  const styleHint = imageStyle
    ? `\nVisual style requested by user: "${imageStyle.slice(0, 200)}"\nApply this style context to every image keyword (e.g. if user wants "cyberpunk neon city", lean keywords toward that aesthetic).\n`
    : ''

  try {
    const raw = await callLLM(`You are helping choose stock photos for a video. For each sentence below, write 3-5 English keywords that describe the ideal background image for that sentence. Focus on visual elements (objects, settings, mood, colors), not abstract concepts.
${styleHint}
Rules:
- Output ONLY a JSON array of strings, one per sentence
- Each string: 3–5 English keywords separated by spaces
- Never use quotes, punctuation or explanations inside keywords
- The count must match exactly: ${segments.length} items

Sentences${language === 'vi' ? ' (Vietnamese)' : ''}:
${numbered}

Respond with valid JSON array only, example: ["keyword1 keyword2 keyword3", "keyword4 keyword5"]`, 512)

    const match = raw.match(/\[[\s\S]*\]/)
    if (!match) throw new Error('No JSON array found')
    const parsed: string[] = JSON.parse(match[0])
    if (!Array.isArray(parsed) || parsed.length !== segments.length) {
      throw new Error('Array length mismatch')
    }
    return parsed
  } catch {
    return segments.map(s =>
      s.text.replace(/[^\w\s]/g, '').split(/\s+/).slice(0, 5).join(' ')
    )
  }
}

// ─── MotionSpec generation ────────────────────────────────────────────────────

export async function generateMotionSpec(params: {
  description: string
  platform: 'tiktok' | 'youtube' | 'instagram'
  tone: string
}): Promise<MotionSpec> {
  const { description, platform, tone } = params

  try {
    const raw = await callLLM(`You are a video visual designer. Based on the description below, output a JSON visual spec.

Return ONLY a valid JSON object with these exact fields and allowed values:
{
  "bgType": "solid" | "gradient" | "dark-gradient" | "image-blur",
  "bgColor": "#hexcolor",
  "bgColor2": "#hexcolor",
  "fontFamily": "sans" | "mono" | "serif" | "display",
  "fontSize": "sm" | "md" | "lg" | "xl",
  "textColor": "#hexcolor",
  "textAlign": "left" | "center" | "right",
  "textAnim": "fade" | "slide-up" | "slide-left" | "zoom" | "typewriter" | "word-pop" | "glitch",
  "animSpeed": "slow" | "normal" | "fast",
  "accentColor": "#hexcolor",
  "accentStyle": "none" | "underline" | "highlight" | "pill" | "border-left",
  "transition": "cut" | "fade" | "slide" | "zoom-in",
  "overlay": "none" | "vignette" | "scanlines" | "grain",
  "musicUrl": null,
  "musicVolume": 0.3
}

Design rules:
- TikTok viral/hook/dramatic → dark-gradient bg, word-pop or glitch textAnim, fast animSpeed, scanlines or vignette overlay
- TikTok educational/facts   → gradient bg, slide-up textAnim, normal speed, vignette
- YouTube documentary/story  → image-blur bg, fade textAnim, slow speed, vignette
- YouTube tech/news          → gradient bg, slide-left, mono font, normal speed
- Instagram aesthetic        → gradient bg, zoom textAnim, slow speed, none overlay
- Motivational/energy        → dark-gradient, word-pop, fast, vignette
- Fun/meme                   → gradient bright colors, word-pop, fast, none
- News                       → solid dark bg, slide-left, sans font, border-left accent
- Educational calm           → solid light bg (#f5f5f5), textColor #222, fade, serif, slow
- Cyberpunk/neon              → dark-gradient (#0a0014 → #1a0050), mono font, glitch, accentColor #00ffff, scanlines

Platform: ${platform}
Tone: ${tone}
Description: ${description}

Output ONLY the JSON object, no markdown, no explanation.`, 512)

    // Extract JSON from response
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON found')
    const parsed = JSON.parse(match[0]) as Partial<MotionSpec>

    // Validate + merge with defaults
    const spec: MotionSpec = { ...DEFAULT_MOTION_SPEC, ...parsed }

    // Ensure musicUrl is always null from AI (user provides their own)
    spec.musicUrl = null

    return spec
  } catch (err) {
    console.warn('[generateMotionSpec] failed, using default:', err)
    return { ...DEFAULT_MOTION_SPEC }
  }
}
