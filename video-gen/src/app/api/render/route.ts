import { z } from 'zod'
import { db } from '@/lib/db'
import { generateAudio } from '@/lib/tts'
import { searchImage } from '@/lib/unsplash'
import { enqueueRender } from '@/lib/queue'

export async function POST(req: Request) {
  let jobId = ''
  try {
    jobId = z.object({ jobId: z.string() }).parse(await req.json()).jobId
    const job = await db.job.findUnique({
      where: { id: jobId }, include: { segments: { orderBy: { order: 'asc' } } },
    })
    if (!job) return Response.json({ error: 'Job not found' }, { status: 404 })

    const chunks = <T>(arr: T[], n: number) =>
      Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n))

    for (const chunk of chunks(job.segments, 3)) {
      await Promise.all(chunk.map(async seg => {
        const updates: Record<string, string> = {}
        if (!seg.audioUrl) {
          const { audioUrl, cacheKey, durationSec } = await generateAudio({
            text: seg.text, provider: job.ttsProvider as any,
            voiceId: job.ttsVoiceId, segmentId: seg.id, language: job.language,
          })
          updates.audioUrl = audioUrl
          updates.audioCacheKey = cacheKey
          // Use real TTS duration so text display matches audio playback
          if (durationSec !== null) (updates as any).duration = durationSec
        }
        if (!seg.imageUrl && seg.imagePrompt) {
          updates.imageUrl = await searchImage(seg.imagePrompt)
        }
        if (Object.keys(updates).length) {
          await db.segment.update({ where: { id: seg.id }, data: updates })
        }
      }))
    }

    await db.job.update({ where: { id: jobId }, data: { status: 'RENDERING' } })
    await enqueueRender(jobId)
    return Response.json({ jobId, status: 'RENDERING' })
  } catch (err: any) {
    console.error('[/api/render]', err)
    if (jobId) await db.job.update({ where: { id: jobId }, data: { status: 'ERROR', errorMessage: err.message } }).catch(() => {})
    return Response.json({ error: err.message }, { status: 500 })
  }
}
