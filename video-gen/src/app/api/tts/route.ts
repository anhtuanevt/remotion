import { z } from 'zod'
import { generateAudio } from '@/lib/tts'
import { db } from '@/lib/db'

const Body = z.object({
  segmentId: z.string(),
  text:      z.string().min(1),
  provider:  z.enum(['vbee', 'elevenlabs', 'edge']).default('vbee'),
  voiceId:   z.string(),
  language:  z.string().default('vi'),
})

export async function POST(req: Request) {
  try {
    const body = Body.parse(await req.json())
    const { audioUrl, cacheKey } = await generateAudio({
      text: body.text, provider: body.provider as any,
      voiceId: body.voiceId, segmentId: body.segmentId, language: body.language,
    })
    await db.segment.update({
      where: { id: body.segmentId },
      data: { audioUrl, audioCacheKey: cacheKey },
    })
    return Response.json({ audioUrl })
  } catch (err: any) {
    console.error('[/api/tts]', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
