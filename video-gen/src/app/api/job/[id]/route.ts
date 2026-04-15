import { z } from 'zod'
import { db } from '@/lib/db'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const job = await db.job.findUnique({
      where: { id },
      include: { segments: { orderBy: { order: 'asc' } } },
    })
    if (!job) return Response.json({ error: 'Not found' }, { status: 404 })

    return Response.json({
      ...job,
      motionSpec: job.motionSpec ? JSON.parse(job.motionSpec) : null,
    })
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

const PatchBody = z.object({
  template: z.string().optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = PatchBody.parse(await req.json())
    const data: Record<string, string> = {}
    if (body.template) data.template = body.template
    if (!Object.keys(data).length) return Response.json({ ok: true })
    await db.job.update({ where: { id }, data })
    return Response.json({ ok: true })
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
