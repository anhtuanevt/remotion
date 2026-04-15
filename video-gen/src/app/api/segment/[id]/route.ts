import { db } from '@/lib/db'
import { z } from 'zod'

const Body = z.object({
  text: z.string().optional(),
  subtitle: z.string().optional(),
  imageUrl: z.string().optional(),
  audioUrl: z.string().optional(),
  duration: z.number().optional(),
  imagePrompt: z.string().optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const segment = await db.segment.update({ where: { id }, data: Body.parse(await req.json()) })
    return Response.json(segment)
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
