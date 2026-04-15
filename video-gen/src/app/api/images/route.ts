import { z } from 'zod'
import { db } from '@/lib/db'
import { searchImage } from '@/lib/unsplash'

const Body = z.object({ jobId: z.string() })

export async function POST(req: Request) {
  try {
    const { jobId } = Body.parse(await req.json())
    const job = await db.job.findUnique({
      where: { id: jobId },
      include: { segments: { orderBy: { order: 'asc' } } },
    })
    if (!job) return Response.json({ error: 'Job not found' }, { status: 404 })

    const needsImage = job.segments.filter(s => !s.imageUrl && s.imagePrompt)
    if (needsImage.length === 0) return Response.json({ updated: [] })

    const results: { id: string; imageUrl: string }[] = []

    // Fetch in small batches to avoid rate limiting
    const chunks = <T>(arr: T[], n: number) =>
      Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n))

    for (const chunk of chunks(needsImage, 3)) {
      await Promise.all(chunk.map(async seg => {
        try {
          const imageUrl = await searchImage(seg.imagePrompt!)
          await db.segment.update({ where: { id: seg.id }, data: { imageUrl } })
          results.push({ id: seg.id, imageUrl })
        } catch (err) {
          console.warn(`[images] Failed for segment ${seg.id}:`, err)
        }
      }))
    }

    return Response.json({ updated: results })
  } catch (err: any) {
    console.error('[/api/images]', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
