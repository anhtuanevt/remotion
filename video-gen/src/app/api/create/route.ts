import { z } from 'zod'
import { db } from '@/lib/db'
import { expandIdea, generateImagePrompts, generateVideoFromDescription, generateMotionSpec } from '@/lib/anthropic'
import { parseTranscript } from '@/lib/parser'
import { isStructuredPrompt, parseStructuredPrompt } from '@/lib/structured-prompt'
import { detectDefaultProvider, DEFAULT_VBEE_VOICE } from '@/lib/tts'
import { TEMPLATES } from '@/lib/template-config'

const Body = z.object({
  type:        z.enum(['transcript', 'idea', 'describe']),
  content:     z.string().min(1).max(20000),
  language:    z.string().default('vi'),
  template:    z.string().default('news'),
  ttsProvider: z.enum(['vbee', 'elevenlabs', 'edge']).optional(),
  ttsVoiceId:  z.string().optional(),
  // Chỉ dùng cho type = 'describe'
  platform:    z.enum(['tiktok', 'youtube', 'instagram']).optional(),
  tone:        z.string().optional(),
  durationSec: z.number().min(10).max(600).optional(),
})

export async function POST(req: Request) {
  try {
    const body = Body.parse(await req.json())

    const ttsProvider = body.ttsProvider ?? detectDefaultProvider()
    const ttsVoiceId  = body.ttsVoiceId  ?? DEFAULT_VBEE_VOICE

    // ── Structured JSON prompt (scenes[] with per-scene keywords) ──────────────
    if (isStructuredPrompt(body.content)) {
      console.log('[create] Detected structured JSON prompt')
      const { segments, motionSpec, topic } = parseStructuredPrompt(body.content)
      console.log('[create] Structured:', segments.length, 'scenes, bgType:', motionSpec.bgType)
      const job = await db.job.create({
        data: {
          template:   'dynamic',
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
        template:      'dynamic',
        templateName:  'AI Dynamic',
        reasoning:     topic ? `Structured prompt: "${topic}"` : 'Structured JSON prompt',
        hasMotionSpec: true,
      })
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
        description: body.content,
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
      imageStyle = body.content

      // Sinh MotionSpec song song (không block nếu thất bại)
      try {
        const spec = await generateMotionSpec({
          description: body.content,
          platform:    body.platform ?? 'tiktok',
          tone:        body.tone     ?? 'viral',
        })
        motionSpecJson = JSON.stringify(spec)
      } catch (e) {
        console.warn('[create] generateMotionSpec failed:', e)
      }
    } else if (body.type === 'idea') {
      transcript = await expandIdea(body.content, body.language)
    } else {
      transcript = body.content
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
  } catch (err: any) {
    console.error('[/api/create]', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
