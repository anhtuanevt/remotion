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

// ─── Studio-specific script generators ───────────────────────────────────────
// Each returns a structured JSON string { scenes: [...] } ready for parseStructuredPrompt

export interface StudioScriptResult {
  scenesJson: string   // raw JSON string → pass to parseStructuredPrompt
}

export async function generateViralScript(params: {
  topic: string
  durationSec: number
  language: string
}): Promise<StudioScriptResult> {
  const { topic, durationSec, language } = params
  const langLabel   = language === 'vi' ? 'Vietnamese' : 'English'
  const sceneCount  = Math.max(8, Math.min(20, Math.round(durationSec / 5)))

  const raw = await callLLM(`You are a viral TikTok/Reels scriptwriter. Write a high-energy short video script.

Language: ${langLabel}
Topic: ${topic}
Target duration: ${durationSec} seconds → aim for exactly ${sceneCount} scenes
Style: fast cuts, punchy sentences, MrBeast energy, word-pop animation

Rules:
- Each scene = 1 short punchy sentence (5–15 words max)
- Scene 1 MUST be a shocking hook question or statement (≤10 words)
- Scene 2-3: build on the hook, intensify curiosity
- Middle scenes: deliver facts/value fast — each = one surprising idea
- Last 2 scenes: callback to hook + strong CTA ("Follow for more", "Comment below", etc.)
- Use ${langLabel} — conversational, not formal
- "sceneKeywords": 3–5 English words for background image (objects, mood, setting)
- "visualMetaphor": optional — describe the vibe of the shot (e.g. "close-up brain neurons firing")

Output ONLY valid JSON in this exact format:
{
  "videoTopic": "${topic}",
  "globalImageStyle": "dark dramatic cinematic neon",
  "scenes": [
    { "text": "...", "sceneKeywords": "...", "visualMetaphor": "..." }
  ]
}`, 1500)

  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('generateViralScript: no JSON in response')
  return { scenesJson: match[0] }
}

export async function generateChatScript(params: {
  topic: string
  speakerAName: string
  speakerARole: string
  speakerBName: string
  speakerBRole: string
  durationSec: number
  language: string
}): Promise<StudioScriptResult> {
  const { topic, speakerAName, speakerARole, speakerBName, speakerBRole, durationSec, language } = params
  const langLabel  = language === 'vi' ? 'Vietnamese' : 'English'
  const lineCount  = Math.max(10, Math.min(30, Math.round(durationSec / 6)))

  const raw = await callLLM(`You are a podcast dialogue scriptwriter. Write a natural, engaging conversation.

Language: ${langLabel}
Topic: "${topic}"
Speaker A: ${speakerAName} (${speakerARole})
Speaker B: ${speakerBName} (${speakerBRole})
Target: ${lineCount} exchanges total, ~${durationSec} seconds

Dialogue rules:
- Each line = one conversational turn (15–40 words)
- Use "[A]" prefix for ${speakerAName}'s lines, "[B]" prefix for ${speakerBName}'s lines
- Alternate roughly between A and B, but allow 2-3 consecutive lines for emphasis
- Natural speech: filler words okay (ừ, à, thật ra, actually, well, you know)
- Use ${langLabel} throughout
- Include moments of agreement, pushback, storytelling, humor
- "sceneKeywords": 3–5 English words evoking the mood/topic of that exchange
  (e.g. "two people talking coffee shop warm" or "debate podium microphone")

Output ONLY valid JSON:
{
  "videoTopic": "${topic}",
  "globalImageStyle": "soft light warm podcast studio",
  "scenes": [
    { "text": "[A] ...", "sceneKeywords": "..." },
    { "text": "[B] ...", "sceneKeywords": "..." }
  ]
}`, 2000)

  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('generateChatScript: no JSON in response')
  return { scenesJson: match[0] }
}

export async function generateEducationalScript(params: {
  topic: string
  targetAudience: string
  durationSec: number
  language: string
}): Promise<StudioScriptResult> {
  const { topic, targetAudience, durationSec, language } = params
  const langLabel  = language === 'vi' ? 'Vietnamese' : 'English'
  const sceneCount = Math.max(6, Math.min(18, Math.round(durationSec / 8)))

  const raw = await callLLM(`You are an educational video scriptwriter. Write a clear, step-by-step explanation.

Language: ${langLabel}
Topic: "${topic}"
Target audience: ${targetAudience || 'general audience'}
Duration: ~${durationSec} seconds → ${sceneCount} segments
Style: calm, clear, confident — think Khan Academy or Kurzgesagt

Script rules:
- Each segment = one clear idea or step (20–40 words)
- Segment 1: hook — why this topic matters (1 relatable example or surprising fact)
- Segments 2–N-1: explain step by step, one idea per segment, build on previous
- Last segment: summary + takeaway
- Use simple language appropriate for "${targetAudience || 'beginners'}"
- Avoid jargon unless you immediately explain it
- "sceneKeywords": 3–5 English words for background image (diagrams, objects, settings)
- "visualMetaphor": a visual concept that illustrates this segment (e.g. "magnifying glass over DNA strand")

Output ONLY valid JSON:
{
  "videoTopic": "${topic}",
  "globalImageStyle": "clean educational dark blue gradient",
  "scenes": [
    { "text": "...", "sceneKeywords": "...", "visualMetaphor": "..." }
  ]
}`, 1500)

  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('generateEducationalScript: no JSON in response')
  return { scenesJson: match[0] }
}

export async function generateCinematicScript(params: {
  topic: string
  durationSec: number
  language: string
}): Promise<StudioScriptResult> {
  const { topic, durationSec, language } = params
  const langLabel  = language === 'vi' ? 'Vietnamese' : 'English'
  const sceneCount = Math.max(5, Math.min(15, Math.round(durationSec / 10)))

  const raw = await callLLM(`You are a documentary filmmaker and scriptwriter. Write a cinematic, emotionally resonant narration.

Language: ${langLabel}
Topic / Story: "${topic}"
Duration: ~${durationSec} seconds → ${sceneCount} scenes
Style: Ken Burns documentary, slow typewriter, poetic narration

Script rules:
- Each scene = one narrative beat (25–50 words, like documentary voiceover)
- Scene 1: establish time/place/person with vivid imagery
- Middle: journey, conflict, transformation — one scene per emotional beat
- Final scene: reflection, resolution, or open-ended question
- Tone: contemplative, intimate, beautiful — not corporate, not rushed
- Use ${langLabel} — literary quality, not conversational
- "sceneKeywords": 3–5 English words for cinematic background image
  (e.g. "golden hour countryside silhouette" or "rain window city lights blur")
- "visualMetaphor": cinematic shot description (e.g. "slow pan across empty chair at dining table")

Output ONLY valid JSON:
{
  "videoTopic": "${topic}",
  "globalImageStyle": "cinematic film grain warm vintage blur",
  "scenes": [
    { "text": "...", "sceneKeywords": "...", "visualMetaphor": "..." }
  ]
}`, 1500)

  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('generateCinematicScript: no JSON in response')
  return { scenesJson: match[0] }
}

export async function generateCustomScript(params: {
  content: string
  imageStyle?: string
  durationSec: number
  language: string
}): Promise<StudioScriptResult> {
  const { content, imageStyle, durationSec, language } = params
  const langLabel  = language === 'vi' ? 'Vietnamese' : 'English'
  const sceneCount = Math.max(5, Math.min(25, Math.round(durationSec / 7)))

  const styleHint = imageStyle?.trim()
    ? `Image style requested: "${imageStyle.trim()}" — use this to craft sceneKeywords for every scene.`
    : 'Infer appropriate sceneKeywords from the content of each scene.'

  const raw = await callLLM(`You are a video scene parser. Split the content below into video scenes WITHOUT rewriting or summarizing — preserve the original phrasing as closely as possible.

Language: ${langLabel}
Target scene count: ~${sceneCount} (adjust naturally based on content length)
${styleHint}

Rules:
- Each scene = one natural paragraph or sentence group from the original content
- Do NOT paraphrase, summarize, or change the meaning
- Split at natural pause points (paragraph breaks, topic shifts, list items)
- "sceneKeywords": 3–5 English words describing the ideal background image for that scene
- "visualMetaphor": optional short description of a cinematic shot that matches the scene mood

Output ONLY valid JSON:
{
  "videoTopic": "(infer from content)",
  "globalImageStyle": "${imageStyle ?? 'cinematic atmospheric'}",
  "scenes": [
    { "text": "...", "sceneKeywords": "...", "visualMetaphor": "..." }
  ]
}

Content to parse:
${content.slice(0, 8000)}`, 2000)

  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('generateCustomScript: no JSON in response')
  return { scenesJson: match[0] }
}

// ─── AI JSON Normalizer ───────────────────────────────────────────────────────
// Converts any unknown JSON format → standard { scenes: [...] }

export async function normalizeWithAI(rawJson: string): Promise<string> {
  const raw = await callLLM(`You are a JSON converter for a video generator tool.
Convert the input JSON into this exact output format:
{
  "videoTopic": "string (optional)",
  "globalImageStyle": "string (optional)",
  "scenes": [
    { "text": "...", "sceneKeywords": "...", "visualMetaphor": "..." }
  ]
}

Conversion rules:
- If input has a "messages" array: each message → one scene
  - "text" must be formatted as "[A] message" for the first unique speaker, "[B] message" for the second
  - Detect the speaker from any of these fields: "from", "sender", "role", "author", "name", "id"
  - Map the first unique speaker value → A, the second → B
  - Use "visualHint" or "emotion" fields as "sceneKeywords" if available
- If input has another array (posts, items, steps, etc.): use that array as scenes
- If input is a JSON array at the root level: treat each element as a scene
- "text" is required and must be a non-empty string
- "sceneKeywords" and "visualMetaphor" are optional — infer from context
- Output ONLY valid JSON. No markdown fences, no explanation.

Input JSON:
${rawJson.slice(0, 6000)}`, 2048)

  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('normalizeWithAI: no JSON object in response')
  return match[0]
}
