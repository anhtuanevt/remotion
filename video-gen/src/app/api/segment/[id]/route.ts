import { db } from '@/lib/db'
import { z } from 'zod'

const Body = z.object({
  text:        z.string().optional(),
  subtitle:    z.string().optional(),
  imageUrl:    z.string().optional(),
  audioUrl:    z.string().optional(),
  duration:    z.number().optional(),
  imagePrompt: z.string().optional(),
  order:          z.number().int().optional(),
  sceneEffect:    z.string().optional(),
  subtitleEffect: z.string().optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = Body.parse(await req.json())
    const segment = await db.segment.update({ where: { id }, data })
    return Response.json(segment)
  } catch (err: any) {
    const msg = err?.message ?? String(err)
    console.error('[PATCH /api/segment]', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.segment.delete({ where: { id } })
    return Response.json({ ok: true })
  } catch (err: any) {
    return Response.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}
