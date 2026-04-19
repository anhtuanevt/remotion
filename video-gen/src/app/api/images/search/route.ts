import { searchImages } from '@/lib/unsplash'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q     = searchParams.get('q')?.trim() ?? ''
  const count = Math.min(12, Math.max(4, parseInt(searchParams.get('count') ?? '8', 10)))

  if (!q) return Response.json({ results: [] })

  try {
    const results = await searchImages(q, count)
    return Response.json({ results })
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
