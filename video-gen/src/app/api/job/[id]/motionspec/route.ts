import { z } from 'zod'
import { db } from '@/lib/db'

const Body = z.object({
  motionSpec: z.record(z.string(), z.unknown()),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { motionSpec } = Body.parse(await req.json())

    const job = await db.job.update({
      where: { id },
      data: { motionSpec: JSON.stringify(motionSpec) },
    })

    return Response.json({ ok: true, motionSpec: JSON.parse(job.motionSpec ?? '{}') })
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
