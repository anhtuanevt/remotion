'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { VoiceSelector } from '@/components/VoiceSelector'
import { DEFAULT_VBEE_VOICE } from '@/lib/voices'
import { STUDIOS } from '@/studios'
import type { TTSProvider } from '@/types'

// ─── Duration options ─────────────────────────────────────────────────────────

const DURATIONS = [
  { sec: 0,   label: 'AI tự quyết' },
  { sec: 30,  label: '30s'         },
  { sec: 60,  label: '1 min'       },
  { sec: 120, label: '2 min'       },
  { sec: 180, label: '3 min'       },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter()

  const [studioId,       setStudioId]       = useState(STUDIOS[0].id)
  const [topic,          setTopic]          = useState('')
  const [speakerAName,   setSpeakerAName]   = useState('Nam')
  const [speakerARole,   setSpeakerARole]   = useState('Host')
  const [speakerBName,   setSpeakerBName]   = useState('Linh')
  const [speakerBRole,   setSpeakerBRole]   = useState('Guest')
  const [targetAudience, setTargetAudience] = useState('người mới bắt đầu')
  const [imageStyle,     setImageStyle]     = useState('')
  const [durationSec,    setDurationSec]    = useState(0)
  const [language,       setLanguage]       = useState('vi')
  const [ttsProvider,    setTtsProvider]    = useState<TTSProvider>('edge')
  const [ttsVoiceId,     setTtsVoiceId]     = useState(DEFAULT_VBEE_VOICE)
  const [loading,        setLoading]        = useState(false)
  const [loadingStep,    setLoadingStep]    = useState('')
  const [error,          setError]          = useState<string | null>(null)

  const activeStudio = STUDIOS.find(s => s.id === studioId)!

  const handleSubmit = async () => {
    if (!topic.trim()) return
    setLoading(true)
    setError(null)
    setLoadingStep('AI đang tạo kịch bản...')

    try {
      const body: Record<string, unknown> = {
        type: 'studio',
        studioId,
        topic: topic.trim(),
        language,
        ...(durationSec > 0 ? { durationSec } : {}),
        ttsProvider,
        ttsVoiceId,
      }

      if (studioId === 'chat-podcast') {
        body.speakerAName = speakerAName
        body.speakerARole = speakerARole
        body.speakerBName = speakerBName
        body.speakerBRole = speakerBRole
      }
      if (studioId === 'educational') {
        body.targetAudience = targetAudience
      }
      if (studioId === 'custom' && imageStyle.trim()) {
        body.imageStyle = imageStyle.trim()
      }

      const res  = await fetch('/api/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      setLoadingStep('Đang xử lý segments...')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      router.push(`/verify/${data.jobId}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
      setTimeout(() => setError(null), 6000)
    } finally {
      setLoading(false)
      setLoadingStep('')
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Error toast */}
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-600 text-white px-4 py-3 rounded-xl shadow-xl max-w-sm text-sm">
          {error}
        </div>
      )}

      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-5 flex items-center gap-3">
          <span className="text-2xl">🎬</span>
          <div>
            <h1 className="text-lg font-bold leading-none">AI Video Studio</h1>
            <p className="text-xs text-gray-400 mt-0.5">Chọn loại nội dung — AI tạo video hoàn chỉnh</p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* Studio selector */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Chọn loại nội dung</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {STUDIOS.map(studio => (
              <button
                key={studio.id}
                onClick={() => setStudioId(studio.id)}
                className={`relative flex flex-col items-start gap-2 p-4 rounded-2xl border text-left transition-all ${
                  studioId === studio.id
                    ? 'border-white/30 bg-white/10 shadow-lg'
                    : 'border-white/10 bg-white/5 hover:bg-white/8 hover:border-white/20'
                }`}
              >
                {/* Gradient accent bar */}
                <div className={`absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl bg-gradient-to-r ${studio.gradient} ${studioId === studio.id ? 'opacity-100' : 'opacity-40'}`} />
                <span className="text-2xl">{studio.icon}</span>
                <div>
                  <p className="text-sm font-semibold leading-tight">{studio.name}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{studio.tagline}</p>
                </div>
                {studioId === studio.id && (
                  <p className="text-[11px] text-gray-300 leading-snug">{studio.description}</p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Topic input */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              {studioId === 'chat-podcast' ? 'Chủ đề cuộc trò chuyện'
                : studioId === 'custom'    ? 'Script hoặc mô tả nội dung'
                : 'Chủ đề video'}
            </label>
            <textarea
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder={activeStudio.exampleTopics[0]}
              rows={studioId === 'custom' ? 8 : 3}
              className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 resize-y"
            />
            {studioId === 'custom' ? (
              <p className="text-[11px] text-gray-500 mt-1.5">
                Paste script sẵn, viết mô tả chi tiết, hoặc liệt kê các ý — AI sẽ chia thành cảnh mà không thay đổi nội dung của bạn.
              </p>
            ) : (
              /* Example topics */
              <div className="flex flex-wrap gap-2 mt-2">
                {activeStudio.exampleTopics.map(ex => (
                  <button
                    key={ex}
                    onClick={() => setTopic(ex)}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-white/8 border border-white/10 text-gray-300 hover:bg-white/15 hover:text-white transition-colors"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Chat podcast: speakers */}
          {studioId === 'chat-podcast' && (
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/10">
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-2">Người A (Host)</p>
                <input
                  value={speakerAName}
                  onChange={e => setSpeakerAName(e.target.value)}
                  placeholder="Tên"
                  className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-white/20 mb-2"
                />
                <input
                  value={speakerARole}
                  onChange={e => setSpeakerARole(e.target.value)}
                  placeholder="Vai trò (vd: Host, Chuyên gia)"
                  className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-white/20"
                />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-2">Người B (Guest)</p>
                <input
                  value={speakerBName}
                  onChange={e => setSpeakerBName(e.target.value)}
                  placeholder="Tên"
                  className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-white/20 mb-2"
                />
                <input
                  value={speakerBRole}
                  onChange={e => setSpeakerBRole(e.target.value)}
                  placeholder="Vai trò (vd: Guest, Sinh viên)"
                  className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-white/20"
                />
              </div>
            </div>
          )}

          {/* Educational: target audience */}
          {studioId === 'educational' && (
            <div className="pt-2 border-t border-white/10">
              <label className="block text-xs font-semibold text-gray-400 mb-2">Đối tượng khán giả</label>
              <input
                value={targetAudience}
                onChange={e => setTargetAudience(e.target.value)}
                placeholder="vd: người mới bắt đầu, học sinh cấp 3, nhà đầu tư..."
                className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-white/20"
              />
            </div>
          )}

          {/* Custom: image style */}
          {studioId === 'custom' && (
            <div className="pt-2 border-t border-white/10">
              <label className="block text-xs font-semibold text-gray-400 mb-2">
                Style hình ảnh <span className="font-normal text-gray-500">(tuỳ chọn)</span>
              </label>
              <input
                value={imageStyle}
                onChange={e => setImageStyle(e.target.value)}
                placeholder="vd: cyberpunk neon dark city · warm vintage film grain · minimal white clean"
                className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-white/20"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                AI sẽ dùng mô tả này để chọn ảnh nền phù hợp cho từng cảnh
              </p>
            </div>
          )}
        </div>

        {/* Duration + Language */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Độ dài</p>
            <div className="flex flex-col gap-2">
              {DURATIONS.map(d => (
                <button
                  key={d.sec}
                  onClick={() => setDurationSec(d.sec)}
                  className={`py-2 rounded-lg border text-sm font-medium transition-all ${
                    durationSec === d.sec
                      ? 'border-white/40 bg-white/15 text-white'
                      : 'border-white/10 bg-transparent text-gray-400 hover:bg-white/8 hover:text-white'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Ngôn ngữ</p>
            <div className="flex flex-col gap-2">
              {[
                { id: 'vi', flag: '🇻🇳', label: 'Tiếng Việt' },
                { id: 'en', flag: '🇬🇧', label: 'English'    },
              ].map(l => (
                <button
                  key={l.id}
                  onClick={() => setLanguage(l.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    language === l.id
                      ? 'border-white/40 bg-white/15 text-white'
                      : 'border-white/10 bg-transparent text-gray-400 hover:bg-white/8 hover:text-white'
                  }`}
                >
                  <span>{l.flag}</span> {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Voice */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Giọng đọc</p>
          <VoiceSelector
            provider={ttsProvider}
            voiceId={ttsVoiceId}
            onChange={(p, v) => { setTtsProvider(p); setTtsVoiceId(v) }}
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || !topic.trim()}
          className={`w-full py-4 font-bold rounded-2xl transition-all text-base shadow-lg disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r ${activeStudio.gradient} hover:opacity-90 active:opacity-80`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-3">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              {loadingStep || 'Đang tạo video...'}
            </span>
          ) : (
            `${activeStudio.icon} Tạo ${activeStudio.name}`
          )}
        </button>

        <p className="text-center text-xs text-gray-500 pb-6">
          AI sẽ tự viết kịch bản, thiết kế giao diện và tạo video hoàn chỉnh
        </p>
      </div>
    </div>
  )
}
