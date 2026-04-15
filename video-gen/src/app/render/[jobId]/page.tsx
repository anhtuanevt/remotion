'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ProgressBar } from '@/components/ProgressBar'

export default function RenderPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const router    = useRouter()
  const [job, setJob]     = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const poll = async () => {
      try {
        const res  = await fetch(`/api/job/${jobId}`)
        const data = await res.json()
        if (cancelled) return
        setJob(data)
        if (data.status === 'DONE' || data.status === 'ERROR') return
        setTimeout(poll, 2000)
      } catch (e: any) {
        if (!cancelled) setError(e.message)
      }
    }

    poll()
    return () => { cancelled = true }
  }, [jobId])

  const steps     = ['Chuẩn bị', 'Tạo giọng', 'Lấy hình', 'Render', 'Xong']
  const stepIndex = job?.status === 'RENDERING' ? 3 : job?.status === 'DONE' ? 4 : 0

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Đang tải...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <div className="bg-white rounded-xl shadow p-8 max-w-lg w-full space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Đang tạo video</h1>

        <div className="flex justify-between mb-2">
          {steps.map((s, i) => (
            <div key={s} className={`text-xs font-medium ${i <= stepIndex ? 'text-blue-600' : 'text-gray-400'}`}>
              {i < stepIndex ? '✓ ' : ''}{s}
            </div>
          ))}
        </div>

        <ProgressBar value={stepIndex / (steps.length - 1)} label="Tiến độ" />

        {error && (
          <p className="text-red-600 text-sm">{error}</p>
        )}

        {job.status === 'DONE' && job.outputUrl && (
          <div className="space-y-4">
            <p className="text-green-600 font-medium">Video đã hoàn thành!</p>
            <video controls src={job.outputUrl} className="w-full rounded-lg" />
            <div className="flex gap-3">
              <a
                href={job.outputUrl}
                download
                className="flex-1 text-center bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700"
              >
                Tải xuống
              </a>
              <button
                onClick={() => router.push('/')}
                className="flex-1 text-center bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200"
              >
                Tạo video mới
              </button>
            </div>
          </div>
        )}

        {job.status === 'ERROR' && (
          <div className="space-y-3">
            <p className="text-red-600 font-medium">Lỗi: {job.errorMessage}</p>
            <button
              onClick={() => router.push(`/verify/${jobId}`)}
              className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200"
            >
              Quay lại chỉnh sửa
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
