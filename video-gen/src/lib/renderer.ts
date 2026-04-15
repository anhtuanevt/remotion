import { bundle } from '@remotion/bundler'
import { renderMedia, selectComposition } from '@remotion/renderer'
import path from 'path'
import fs from 'fs'
import { TEMPLATES } from '@/lib/template-config'
import type { Job, Segment } from '@/types'

let bundleCache: string | null = null

// Remotion tạo bundle server riêng (port khác với Next.js).
// Relative URLs như "/audio/..." sẽ resolve sang bundle server → 404.
// Chuyển sang absolute URL trỏ đúng về Next.js server.
function toAbsoluteUrl(url: string): string {
  if (!url || url.startsWith('http') || url.startsWith('file://')) return url
  const base = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '')
    ?? `http://localhost:${process.env.PORT ?? 3000}`
  return `${base}${url}`
}

function resolveSegmentUrls(segments: Segment[]): Segment[] {
  return segments.map(seg => ({
    ...seg,
    audioUrl: seg.audioUrl ? toAbsoluteUrl(seg.audioUrl) : seg.audioUrl,
    imageUrl: seg.imageUrl ? toAbsoluteUrl(seg.imageUrl) : seg.imageUrl,
  }))
}

export async function renderVideo(job: Job): Promise<string> {
  const outputDir  = path.join(process.cwd(), 'public', 'outputs')
  fs.mkdirSync(outputDir, { recursive: true })
  const outputPath = path.join(outputDir, `${job.id}.mp4`)

  if (!bundleCache) {
    bundleCache = await bundle({
      entryPoint: path.join(process.cwd(), 'src', 'remotion', 'index.ts'),
      // Resolve the "@/" path alias (tsconfig "paths") so templates can import @/types etc.
      webpackOverride: (config) => ({
        ...config,
        resolve: {
          ...config.resolve,
          alias: {
            ...(config.resolve?.alias as Record<string, string> ?? {}),
            '@': path.join(process.cwd(), 'src'),
          },
        },
      }),
    })
  }

  const template    = TEMPLATES.find(t => t.id === job.template) ?? TEMPLATES[0]
  const totalFrames = Math.max(30, Math.ceil(
    job.segments.reduce((s, seg) => s + seg.duration, 0) * template.fps
  ))

  // Convert relative URLs → absolute so Remotion's Chromium can fetch them
  const segments = resolveSegmentUrls(job.segments)

  // Parse motionSpec if stored as JSON string (raw Prisma field)
  const motionSpec = job.motionSpec
    ? (typeof job.motionSpec === 'string' ? JSON.parse(job.motionSpec) : job.motionSpec)
    : undefined

  const inputProps: Record<string, unknown> = { segments, template: job.template }
  if (motionSpec) inputProps.motionSpec = motionSpec

  const composition = await selectComposition({
    serveUrl: bundleCache, id: job.template, inputProps,
  })

  await renderMedia({
    composition: { ...composition, durationInFrames: totalFrames },
    serveUrl: bundleCache, codec: 'h264', outputLocation: outputPath,
    inputProps,
    concurrency: 2,
    onProgress: ({ progress }) => process.stdout.write(`\r[Render] ${Math.round(progress * 100)}%`),
  })

  console.log(`\n[Render] Complete: ${outputPath}`)
  return `/outputs/${job.id}.mp4`
}
