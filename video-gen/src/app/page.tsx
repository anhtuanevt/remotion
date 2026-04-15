'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { VoiceSelector } from '@/components/VoiceSelector'
import { DEFAULT_VBEE_VOICE } from '@/lib/voices'
import type { TTSProvider } from '@/types'

// ─── Config ───────────────────────────────────────────────────────────────────

const PLATFORMS = [
  { id: 'tiktok',    label: 'TikTok',    icon: '🎵', desc: '9:16 · viral' },
  { id: 'youtube',   label: 'YouTube',   icon: '▶️',  desc: '16:9 · dài'  },
  { id: 'instagram', label: 'Instagram', icon: '📸', desc: 'Reels · Stories' },
] as const

const TONES = [
  { id: 'viral hook',   label: 'Viral Hook',  icon: '🔥' },
  { id: 'educational',  label: 'Giáo dục',    icon: '📚' },
  { id: 'dramatic',     label: 'Dramatic',    icon: '🎬' },
  { id: 'motivational', label: 'Động lực',    icon: '💪' },
  { id: 'news',         label: 'Tin tức',     icon: '📰' },
  { id: 'fun & meme',   label: 'Vui & Meme',  icon: '😂' },
] as const

const DURATIONS = [
  { sec: 30,  label: '30s'   },
  { sec: 60,  label: '1 phút' },
  { sec: 120, label: '2 phút' },
  { sec: 180, label: '3 phút' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter()

  const [description,  setDescription]  = useState('')
  const [platform,     setPlatform]     = useState<'tiktok' | 'youtube' | 'instagram'>('tiktok')
  const [tone,         setTone]         = useState('viral hook')
  const [durationSec,  setDurationSec]  = useState(60)
  const [language,     setLanguage]     = useState('vi')
  const [ttsProvider,  setTtsProvider]  = useState<TTSProvider>('edge')
  const [ttsVoiceId,   setTtsVoiceId]   = useState(DEFAULT_VBEE_VOICE)
  const [loading,      setLoading]      = useState(false)
  const [loadingStep,  setLoadingStep]  = useState('')
  const [error,        setError]        = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!description.trim()) return
    setLoading(true)
    setError(null)
    setLoadingStep('AI đang phân tích mô tả...')

    try {
      const res = await fetch('/api/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'describe', content: description,
          language, platform, tone, durationSec,
          ttsProvider, ttsVoiceId,
        }),
      })
      setLoadingStep('Đang tạo kịch bản...')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const params = new URLSearchParams()
      if (data.reasoning)    params.set('reasoning',    data.reasoning)
      if (data.templateName) params.set('templateName', data.templateName)
      // Nếu AI đã sinh MotionSpec → dùng dynamic template để hiển thị đúng style
      params.set('template', data.hasMotionSpec ? 'dynamic' : (data.template ?? 'news'))
      if (data.hasMotionSpec) params.set('aiTemplate', data.template ?? '')
      router.push(`/verify/${data.jobId}?${params.toString()}`)
    } catch (e: any) {
      setError(e.message)
      setTimeout(() => setError(null), 5000)
    } finally {
      setLoading(false)
      setLoadingStep('')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Error toast */}
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-600 text-white px-4 py-3 rounded-xl shadow-xl max-w-sm text-sm">
          {error}
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <span className="text-2xl">🎬</span>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-none">AI Video Studio</h1>
            <p className="text-xs text-gray-500 mt-0.5">Mô tả ý tưởng — AI tạo video ngay</p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Description */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Mô tả video bạn muốn tạo
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={
              platform === 'tiktok'
                ? 'Ví dụ: Video về 5 sự thật kinh ngạc về não người. Style: nền tối cyberpunk, chữ glitch neon, animation word-pop nhanh. Script mở đầu bằng câu hỏi cực giật gân...'
                : platform === 'youtube'
                ? 'Ví dụ: Hướng dẫn học Python từ đầu. Style: nền trắng sạch, font mono, slide-left animation. Script giải thích từng bước rõ ràng...'
                : 'Ví dụ: Tips du lịch Đà Nẵng 3 ngày. Style: gradient pastel hồng-cam, chữ zoom nhẹ nhàng, nhạc chill. Script gần gũi, có số liệu cụ thể...'
            }
            rows={5}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
          />
          <p className="text-xs text-gray-400 mt-1.5">
            💡 Bạn có thể mô tả luôn <span className="font-medium text-gray-500">style visual</span> (màu sắc, animation, font...) và <span className="font-medium text-gray-500">nội dung script</span> trong cùng một ô — AI sẽ hiểu cả hai.
          </p>
        </div>

        {/* Platform + Tone */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">

          {/* Platform */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Platform</p>
            <div className="grid grid-cols-3 gap-3">
              {PLATFORMS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-center transition-all ${
                    platform === p.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-2xl">{p.icon}</span>
                  <span className="text-sm font-semibold">{p.label}</span>
                  <span className="text-xs text-gray-400">{p.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Phong cách</p>
            <div className="grid grid-cols-3 gap-2">
              {TONES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTone(t.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    tone === t.id
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Duration + Language */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm font-semibold text-gray-700 mb-3">Độ dài</p>
            <div className="grid grid-cols-2 gap-2">
              {DURATIONS.map(d => (
                <button
                  key={d.sec}
                  onClick={() => setDurationSec(d.sec)}
                  className={`py-2 rounded-lg border text-sm font-medium transition-all ${
                    durationSec === d.sec
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <p className="text-sm font-semibold text-gray-700 mb-3">Ngôn ngữ</p>
            <div className="flex flex-col gap-2">
              {[
                { id: 'vi', flag: '🇻🇳', label: 'Tiếng Việt' },
                { id: 'en', flag: '🇬🇧', label: 'English' },
              ].map(l => (
                <button
                  key={l.id}
                  onClick={() => setLanguage(l.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                    language === l.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span>{l.flag}</span> {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Voice */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-3">Giọng đọc</p>
          <VoiceSelector
            provider={ttsProvider}
            voiceId={ttsVoiceId}
            onChange={(p, v) => { setTtsProvider(p); setTtsVoiceId(v) }}
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || !description.trim()}
          className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base shadow-sm"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-3">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              {loadingStep || 'Đang xử lý...'}
            </span>
          ) : (
            '🤖 Tạo Video với AI'
          )}
        </button>

        <p className="text-center text-xs text-gray-400 pb-4">
          AI sẽ tự chọn template phù hợp nhất và viết kịch bản tối ưu cho bạn
        </p>
      </div>
    </div>
  )
}
