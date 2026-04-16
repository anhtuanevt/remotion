import { z } from 'zod'
import { db } from '@/lib/db'
import { expandIdea, generateImagePrompts, generateVideoFromDescription, generateMotionSpec, normalizeWithAI,
         generateViralScript, generateChatScript, generateEducationalScript, generateCinematicScript,
         generateCustomScript } from '@/lib/anthropic'
import { parseTranscript } from '@/lib/parser'
import { isStructuredPrompt, isRawJson, parseStructuredPrompt } from '@/lib/structured-prompt'
import { detectDefaultProvider, DEFAULT_VBEE_VOICE } from '@/lib/tts'
import { TEMPLATES } from '@/lib/template-config'
import { getStudio } from '@/studios'

const Body = z.object({
  type:        z.enum(['transcript', 'idea', 'describe', 'studio']).default('describe'),
  content:     z.string().min(1).max(20000).optional(),
  language:    z.string().default('vi'),
  template:    z.string().default('news'),
  ttsProvider: z.enum(['vbee', 'elevenlabs', 'edge']).optional(),
  ttsVoiceId:  z.string().optional(),
  // Chỉ dùng cho type = 'describe'
  platform:    z.enum(['tiktok', 'youtube', 'instagram']).optional(),
  tone:        z.string().optional(),
  durationSec: z.number().min(10).max(600).optional(),
  // Studio fields
  studioId:       z.string().optional(),
  topic:          z.string().optional(),
  speakerAName:   z.string().optional(),
  speakerARole:   z.string().optional(),
  speakerBName:   z.string().optional(),
  speakerBRole:   z.string().optional(),
  targetAudience: z.string().optional(),
  imageStyle:     z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const body = Body.parse(await req.json())

    const ttsProvider = body.ttsProvider ?? detectDefaultProvider()
    const ttsVoiceId  = body.ttsVoiceId  ?? DEFAULT_VBEE_VOICE

    // ── Structured JSON prompt (scenes[] with per-scene keywords) ──────────────
    // ── Helper: create job from parsed structured scenes ─────────────────────
    const createJobFromStructured = async (normalizedContent: string, sourceDesc: string) => {
      const { segments, motionSpec, topic } = parseStructuredPrompt(normalizedContent)
      if (segments.length === 0) throw new Error('No scenes could be extracted from the input JSON')

      // Detect chat format: majority of texts start with [A] or [B]
      const chatCount = segments.filter(s => /^\[[AB]\]/.test(s.text)).length
      const isChatFmt = chatCount > segments.length / 2
      const template  = isChatFmt ? 'chatbubble' : 'dynamic'

      console.log(`[create] ${sourceDesc}: ${segments.length} scenes, template=${template}, bgType=${motionSpec.bgType}`)

      const job = await db.job.create({
        data: {
          template,
          language:   body.language,
          ttsProvider,
          ttsVoiceId,
          motionSpec: JSON.stringify(motionSpec),
          segments: {
            create: segments.map(s => ({
              order: s.order, text: s.text, subtitle: s.subtitle,
              duration: s.duration, startTime: s.startTime, imagePrompt: s.imagePrompt,
            })),
          },
        },
        include: { segments: { orderBy: { order: 'asc' } } },
      })
      return Response.json({
        jobId:         job.id,
        segments:      job.segments,
        template,
        templateName:  isChatFmt ? 'Chat Bubbles AI' : 'AI Dynamic',
        reasoning:     topic || sourceDesc,
        hasMotionSpec: true,
      })
    }

    // ── Path 0: Studio pipeline ───────────────────────────────────────────────
    if (body.studioId) {
      const studio = getStudio(body.studioId)
      if (!studio) return Response.json({ error: `Unknown studioId: ${body.studioId}` }, { status: 400 })

      const topic      = body.topic ?? body.content ?? ''
      const durationSec = body.durationSec ?? 60
      const language   = body.language

      let scenesJson: string

      if (body.studioId === 'viral-short') {
        const r = await generateViralScript({ topic, durationSec, language })
        scenesJson = r.scenesJson
      } else if (body.studioId === 'chat-podcast') {
        const r = await generateChatScript({
          topic, durationSec, language,
          speakerAName: body.speakerAName ?? 'Host',
          speakerARole: body.speakerARole ?? 'Host',
          speakerBName: body.speakerBName ?? 'Guest',
          speakerBRole: body.speakerBRole ?? 'Guest',
        })
        scenesJson = r.scenesJson
      } else if (body.studioId === 'educational') {
        const r = await generateEducationalScript({
          topic, durationSec, language,
          targetAudience: body.targetAudience ?? 'general audience',
        })
        scenesJson = r.scenesJson
      } else if (body.studioId === 'cinematic') {
        const r = await generateCinematicScript({ topic, durationSec, language })
        scenesJson = r.scenesJson
      } else if (body.studioId === 'custom') {
        const r = await generateCustomScript({
          content:    topic,
          imageStyle: body.imageStyle,
          durationSec,
          language,
        })
        scenesJson = r.scenesJson
      } else {
        // Fallback for unknown studios: describe flow
        scenesJson = ''
      }

      if (scenesJson) {
        // Parse scenes but override motionSpec with studio's default
        const { segments, motionSpec: parsedSpec } = parseStructuredPrompt(scenesJson)
        if (segments.length === 0) throw new Error('No scenes generated by studio')

        const chatCount = segments.filter(s => /^\[[AB]\]/.test(s.text)).length
        const isChatFmt = chatCount > segments.length / 2
        const template  = isChatFmt ? 'chatbubble' : 'dynamic'

        // Studio's defaultMotionSpec takes priority (override AI-parsed spec)
        const finalMotionSpec = { ...parsedSpec, ...studio.defaultMotionSpec }

        if (process.env.ANTHROPIC_API_KEY || process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY) {
          try {
            const prompts = await generateImagePrompts(segments, language, topic)
            prompts.forEach((p, i) => { if (p) segments[i].imagePrompt = p })
          } catch (err) {
            console.warn('[create/studio] generateImagePrompts failed:', err)
          }
        }

        const job = await db.job.create({
          data: {
            template,
            language,
            ttsProvider,
            ttsVoiceId,
            motionSpec: JSON.stringify(finalMotionSpec),
            segments: {
              create: segments.map(s => ({
                order: s.order, text: s.text, subtitle: s.subtitle,
                duration: s.duration, startTime: s.startTime, imagePrompt: s.imagePrompt,
              })),
            },
          },
          include: { segments: { orderBy: { order: 'asc' } } },
        })

        return Response.json({
          jobId:         job.id,
          segments:      job.segments,
          template,
          templateName:  studio.name,
          reasoning:     `Generated via ${studio.name} studio`,
          hasMotionSpec: true,
        })
      }
    }

    // ── Path 1: Standard scenes[] JSON ───────────────────────────────────────
    if (body.content && isStructuredPrompt(body.content)) {
      return createJobFromStructured(body.content, 'Structured JSON prompt')
    }

    // For non-studio paths, content is required
    const content = body.content ?? body.topic ?? ''
    if (!content) return Response.json({ error: 'content or topic is required' }, { status: 400 })

    // ── Path 2: Unknown JSON format → normalize via AI ────────────────────────
    if (isRawJson(content)) {
      console.log('[create] Unknown JSON — normalizing with AI')
      try {
        const normalized = await normalizeWithAI(content)
        return createJobFromStructured(normalized, 'AI-normalized JSON')
      } catch (err) {
        console.warn('[create] normalizeWithAI failed, falling back to describe flow:', err)
        // fall through to normal describe/transcript flow below
      }
    }

    let transcript    = ''
    let chosenTemplate = body.template
    let reasoning      = ''
    let motionSpecJson: string | undefined
    let imageStyle: string | undefined

    if (body.type === 'describe') {
      if (!process.env.ANTHROPIC_API_KEY && !process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
        return Response.json(
          { error: 'Chưa cấu hình AI key. Thêm GROQ_API_KEY (miễn phí tại console.groq.com) vào .env rồi restart server.' },
          { status: 503 },
        )
      }
      // AI tự chọn template + viết script tối ưu
      const result = await generateVideoFromDescription({
        description: content,
        platform:    body.platform    ?? 'tiktok',
        tone:        body.tone        ?? 'viral',
        durationSec: body.durationSec ?? 60,
        language:    body.language,
        templates:   TEMPLATES.map(t => ({
          id: t.id, name: t.name, description: t.description, tags: t.tags,
        })),
      })
      transcript     = result.script
      chosenTemplate = result.template
      reasoning      = result.reasoning
      // Dùng description gốc của user làm style hint cho ảnh
      imageStyle = content

      // Sinh MotionSpec song song (không block nếu thất bại)
      try {
        const spec = await generateMotionSpec({
          description: content,
          platform:    body.platform ?? 'tiktok',
          tone:        body.tone     ?? 'viral',
        })
        motionSpecJson = JSON.stringify(spec)
      } catch (e) {
        console.warn('[create] generateMotionSpec failed:', e)
      }
    } else if (body.type === 'idea') {
      transcript = await expandIdea(content, body.language)
    } else {
      transcript = content
    }

    const segments = parseTranscript(transcript, body.language)

    // Sinh English image keywords nếu có AI key
    if (process.env.ANTHROPIC_API_KEY || process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY) {
      try {
        const prompts = await generateImagePrompts(segments, body.language, imageStyle)
        prompts.forEach((p, i) => { if (p) segments[i].imagePrompt = p })
      } catch (err) {
        console.warn('[create] generateImagePrompts failed:', err)
      }
    }

    const job = await db.job.create({
      data: {
        template: chosenTemplate,
        language: body.language,
        ttsProvider,
        ttsVoiceId,
        ...(motionSpecJson ? { motionSpec: motionSpecJson } : {}),
        segments: {
          create: segments.map(s => ({
            order: s.order, text: s.text, subtitle: s.subtitle,
            duration: s.duration, startTime: s.startTime, imagePrompt: s.imagePrompt,
          })),
        },
      },
      include: { segments: { orderBy: { order: 'asc' } } },
    })

    return Response.json({
      jobId:         job.id,
      segments:      job.segments,
      template:      chosenTemplate,
      templateName:  TEMPLATES.find(t => t.id === chosenTemplate)?.name ?? chosenTemplate,
      reasoning,
      hasMotionSpec: !!motionSpecJson,
    })
  } catch (err: unknown) {
    console.error('[/api/create]', err)
    const message = err instanceof Error ? err.message : String(err)
    return Response.json({ error: message }, { status: 500 })
  }
}
