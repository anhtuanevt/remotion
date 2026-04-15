const g = globalThis as any

async function getRedisConnection() {
  const { default: Redis } = await import('ioredis')
  const conn = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    maxRetriesPerRequest: 1, connectTimeout: 2000,
  })
  await conn.ping()
  return conn
}

async function startWorkerIfNeeded() {
  if (g.__videoWorker) return
  try {
    const { Worker } = await import('bullmq')
    const conn = await getRedisConnection()
    g.__videoWorker = new Worker(
      'video-render',
      async (job) => {
        const { renderVideo } = await import('./renderer')
        const { db }          = await import('./db')
        const jobData = await db.job.findUnique({
          where: { id: job.data.jobId },
          include: { segments: { orderBy: { order: 'asc' } } },
        })
        if (!jobData) throw new Error(`Job not found: ${job.data.jobId}`)
        const outputUrl = await renderVideo(jobData as any)
        await db.job.update({ where: { id: job.data.jobId }, data: { status: 'DONE', outputUrl } })
      },
      { connection: conn, concurrency: 1 },
    )
    g.__videoWorker.on('failed', async (job: any, err: Error) => {
      console.error('[Worker] Job failed:', job?.data?.jobId, err.message)
      if (job?.data?.jobId) {
        const { db } = await import('./db')
        await db.job.update({
          where: { id: job.data.jobId },
          data: { status: 'ERROR', errorMessage: err.message },
        }).catch(() => {})
      }
    })
    console.log('[Queue] BullMQ worker started')
  } catch {
    // Redis unavailable — worker will not be started, fallback to in-process
  }
}

// BullMQ with graceful in-process fallback when Redis unavailable
export async function enqueueRender(jobId: string): Promise<void> {
  try {
    const { Queue } = await import('bullmq')
    const conn = await getRedisConnection()
    await startWorkerIfNeeded()
    const q = new Queue('video-render', { connection: conn })
    await q.add('render', { jobId }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } })
    console.log('[Queue] Job enqueued:', jobId)
  } catch {
    console.warn('[Queue] Redis unavailable — running render in-process (dev mode)')
    const { renderVideo } = await import('./renderer')
    const { db }          = await import('./db')
    const job = await db.job.findUnique({
      where: { id: jobId },
      include: { segments: { orderBy: { order: 'asc' } } },
    })
    if (!job) throw new Error('Job not found')
    const outputUrl = await renderVideo(job as any)
    await db.job.update({ where: { id: jobId }, data: { status: 'DONE', outputUrl } })
  }
}
