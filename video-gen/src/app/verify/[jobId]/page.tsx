'use client'
import { useState, useEffect, useCallback, use, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Player } from '@remotion/player'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { VoiceSelector } from '@/components/VoiceSelector'
import {
  TEMPLATES,
  NewsTemplate, EduTemplate, PodcastTemplate, TechTemplate,
  StoryTemplate, MinimalTemplate, KidsTemplate, DocumentaryTemplate,
  SocialTemplate, WhiteboardTemplate,
  ReelsTemplate, StoriesTemplate, KaraokeTemplate, NeonTemplate,
  BreakingTemplate, QuoteTemplate, DataStatsTemplate, LessonTemplate,
  MagazineTemplate, CountdownTemplate, ChatTemplate, HeadlineTemplate,
  RetroTemplate, SplitVTemplate, GradientTemplate, MemeTemplate,
  RedactedTemplate, SportsTemplate,
  TikTokCaptionTemplate, HookTemplate, WordPopTemplate,
  DynamicTemplate,
} from '@/remotion/templates'
import type { Job, Segment, TTSProvider, MotionSpec } from '@/types'
import { DEFAULT_MOTION_SPEC } from '@/types'

const COMPONENTS: Record<string, React.FC<any>> = {
  news: NewsTemplate, edu: EduTemplate, podcast: PodcastTemplate,
  tech: TechTemplate, story: StoryTemplate, minimal: MinimalTemplate,
  kids: KidsTemplate, documentary: DocumentaryTemplate,
  social: SocialTemplate, whiteboard: WhiteboardTemplate,
  reels: ReelsTemplate, stories: StoriesTemplate, karaoke: KaraokeTemplate,
  neon: NeonTemplate, breaking: BreakingTemplate, quote: QuoteTemplate,
  datastats: DataStatsTemplate, lesson: LessonTemplate,
  magazine: MagazineTemplate, countdown: CountdownTemplate, chat: ChatTemplate,
  headline: HeadlineTemplate, retro: RetroTemplate, splitv: SplitVTemplate,
  gradient: GradientTemplate, meme: MemeTemplate, redacted: RedactedTemplate,
  sports: SportsTemplate,
  tiktokcaption: TikTokCaptionTemplate, hook: HookTemplate, wordpop: WordPopTemplate,
  dynamic: DynamicTemplate,
}

// ─── Template switcher ────────────────────────────────────────────────────────

const LIBRARY_GROUPS = [
  { label: 'TikTok Viral', ids: ['tiktokcaption', 'hook', 'wordpop', 'neon', 'reels', 'social'] },
  { label: 'YouTube / Ngang', ids: ['news', 'edu', 'podcast', 'tech', 'story', 'documentary', 'minimal', 'whiteboard', 'kids'] },
  { label: 'Stories / Dọc', ids: ['stories', 'breaking', 'quote', 'datastats', 'lesson', 'magazine', 'countdown', 'chat', 'headline', 'retro', 'splitv', 'gradient', 'meme', 'redacted', 'sports'] },
]

function TemplateSwitcher({
  activeTemplate, onSelect,
}: {
  activeTemplate: string
  onSelect: (id: string) => void
}) {
  const [libOpen, setLibOpen] = useState(false)
  const [activeGroup, setActiveGroup] = useState(0)

  const dynamicConfig  = TEMPLATES.find(t => t.id === 'dynamic')!
  const activeConfig   = TEMPLATES.find(t => t.id === activeTemplate)
  const isNonDynamic   = activeTemplate !== 'dynamic'

  return (
    <div className="flex-shrink-0 bg-gray-800 border-b border-gray-700">
      <div className="flex items-center gap-2 px-4 py-2">
        {/* Dynamic — always visible, prominent */}
        <button
          onClick={() => onSelect('dynamic')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold flex-shrink-0 transition-all ${
            activeTemplate === 'dynamic'
              ? 'bg-purple-600 text-white ring-2 ring-purple-400'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          <span>✨</span>
          <span>AI Dynamic</span>
        </button>

        <div className="w-px h-6 bg-gray-600 flex-shrink-0" />

        {/* Currently active non-dynamic template (if any) */}
        {isNonDynamic && activeConfig && (
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium flex-shrink-0">
            <span>{activeConfig.thumbnail}</span>
            <span>{activeConfig.name}</span>
            <button
              onClick={() => onSelect('dynamic')}
              className="ml-1 opacity-70 hover:opacity-100 text-xs"
              title="Quay lại Dynamic"
            >✕</button>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Library button */}
        <button
          onClick={() => setLibOpen(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0 transition-colors ${
            libOpen ? 'bg-gray-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'
          }`}
        >
          <span>🗂</span>
          <span>Thư viện template</span>
          <span className="opacity-50">{libOpen ? '▲' : '▼'}</span>
        </button>
      </div>

      {/* Library panel */}
      {libOpen && (
        <div className="border-t border-gray-700 bg-gray-850 px-4 pb-3">
          {/* Group tabs */}
          <div className="flex gap-1 pt-2 pb-2">
            {LIBRARY_GROUPS.map((g, i) => (
              <button
                key={i}
                onClick={() => setActiveGroup(i)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  activeGroup === i
                    ? 'bg-gray-600 text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* Template chips */}
          <div className="flex flex-wrap gap-1.5">
            {LIBRARY_GROUPS[activeGroup].ids.map(id => {
              const t = TEMPLATES.find(x => x.id === id)
              if (!t) return null
              return (
                <button
                  key={id}
                  onClick={() => { onSelect(id); setLibOpen(false) }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeTemplate === id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                  }`}
                >
                  <span>{t.thumbnail}</span>
                  <span>{t.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sortable segment card ────────────────────────────────────────────────────

function SortableSegmentCard({
  segment, index, selected, onClick,
}: {
  segment: Segment
  index: number
  selected: boolean
  onClick: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: segment.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid="segment-item"
      onClick={onClick}
      className={`flex items-start gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
        selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="mt-0.5 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing flex-shrink-0"
        onClick={e => e.stopPropagation()}
        aria-label="Kéo để sắp xếp"
      >
        ⋮⋮
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-gray-500">#{index + 1}</span>
          <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full ml-auto flex-shrink-0">
            {segment.duration.toFixed(1)}s
          </span>
        </div>
        <p className="text-sm text-gray-800 truncate">
          {segment.text.slice(0, 60)}{segment.text.length > 60 ? '…' : ''}
        </p>
      </div>
    </div>
  )
}

// ─── Style panel (MotionSpec fine-tuning) ────────────────────────────────────

const MUSIC_PRESETS = [
  { label: 'Không có nhạc', url: '' },
  { label: 'Upbeat / Năng động', url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d1718ab41b.mp3' },
  { label: 'Cinematic / Điện ảnh', url: 'https://cdn.pixabay.com/download/audio/2023/05/16/audio_166b9c7242.mp3' },
  { label: 'Lo-fi / Nhẹ nhàng', url: 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_946b4db7f0.mp3' },
]

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

function Sel({ value, options, onChange }: {
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input type="color" value={value} onChange={e => onChange(e.target.value)}
        className="w-9 h-9 rounded cursor-pointer border border-gray-300 p-0.5" />
      <input type="text" value={value} onChange={e => onChange(e.target.value)}
        className="flex-1 border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  )
}

function StylePanel({
  motionSpec, onChange, isDynamic, onSwitchToDynamic,
}: {
  motionSpec: MotionSpec
  onChange: (patch: Partial<MotionSpec>) => void
  isDynamic: boolean
  onSwitchToDynamic: () => void
}) {
  const [customMusic, setCustomMusic] = useState(motionSpec.musicUrl ?? '')

  return (
    <div className="space-y-5">
      {!isDynamic && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
          <p className="font-semibold mb-1">Template AI Dynamic chưa được chọn</p>
          <p className="text-amber-700 mb-2">Chuyển sang ✨ Dynamic để xem hiệu ứng tuỳ chỉnh.</p>
          <button
            onClick={onSwitchToDynamic}
            className="w-full py-1.5 bg-amber-500 text-white rounded-lg text-xs font-semibold hover:bg-amber-600 transition-colors"
          >
            Dùng template Dynamic
          </button>
        </div>
      )}

      {/* Background */}
      <div className="space-y-3">
        <p className="text-xs font-bold text-gray-700 uppercase tracking-wider border-b pb-1">Nền</p>
        <Row label="Kiểu nền">
          <Sel value={motionSpec.bgType} onChange={v => onChange({ bgType: v as MotionSpec['bgType'] })} options={[
            { value: 'solid', label: 'Màu đặc' },
            { value: 'gradient', label: 'Gradient (nghiêng)' },
            { value: 'dark-gradient', label: 'Dark Gradient (dọc)' },
            { value: 'image-blur', label: 'Ảnh mờ (blur image)' },
          ]} />
        </Row>
        <Row label="Màu nền chính">
          <ColorInput value={motionSpec.bgColor} onChange={v => onChange({ bgColor: v })} />
        </Row>
        {motionSpec.bgType !== 'solid' && motionSpec.bgType !== 'image-blur' && (
          <Row label="Màu nền phụ (gradient)">
            <ColorInput value={motionSpec.bgColor2} onChange={v => onChange({ bgColor2: v })} />
          </Row>
        )}
      </div>

      {/* Typography */}
      <div className="space-y-3">
        <p className="text-xs font-bold text-gray-700 uppercase tracking-wider border-b pb-1">Typography</p>
        <Row label="Font">
          <Sel value={motionSpec.fontFamily} onChange={v => onChange({ fontFamily: v as MotionSpec['fontFamily'] })} options={[
            { value: 'sans', label: 'Sans-serif (hiện đại)' },
            { value: 'mono', label: 'Monospace (tech)' },
            { value: 'serif', label: 'Serif (cổ điển)' },
            { value: 'display', label: 'Display / Impact (bold)' },
          ]} />
        </Row>
        <Row label="Cỡ chữ">
          <Sel value={motionSpec.fontSize} onChange={v => onChange({ fontSize: v as MotionSpec['fontSize'] })} options={[
            { value: 'sm', label: 'Nhỏ (sm)' },
            { value: 'md', label: 'Vừa (md)' },
            { value: 'lg', label: 'Lớn (lg) — mặc định' },
            { value: 'xl', label: 'Rất lớn (xl)' },
          ]} />
        </Row>
        <Row label="Màu chữ">
          <ColorInput value={motionSpec.textColor} onChange={v => onChange({ textColor: v })} />
        </Row>
        <Row label="Căn lề">
          <div className="flex gap-2">
            {(['left', 'center', 'right'] as const).map(a => (
              <button key={a} onClick={() => onChange({ textAlign: a })}
                className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  motionSpec.textAlign === a ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {a === 'left' ? '⬅' : a === 'center' ? '↔' : '➡'}
              </button>
            ))}
          </div>
        </Row>
      </div>

      {/* Animation */}
      <div className="space-y-3">
        <p className="text-xs font-bold text-gray-700 uppercase tracking-wider border-b pb-1">Hoạt ảnh</p>
        <Row label="Kiểu animation">
          <Sel value={motionSpec.textAnim} onChange={v => onChange({ textAnim: v as MotionSpec['textAnim'] })} options={[
            { value: 'fade', label: 'Fade in' },
            { value: 'slide-up', label: 'Slide up' },
            { value: 'slide-left', label: 'Slide từ trái' },
            { value: 'zoom', label: 'Zoom in' },
            { value: 'typewriter', label: 'Typewriter' },
            { value: 'word-pop', label: 'Word pop (từng từ)' },
            { value: 'glitch', label: 'Glitch (cyberpunk)' },
          ]} />
        </Row>
        <Row label="Tốc độ">
          <div className="flex gap-2">
            {(['slow', 'normal', 'fast'] as const).map(s => (
              <button key={s} onClick={() => onChange({ animSpeed: s })}
                className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  motionSpec.animSpeed === s ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {s === 'slow' ? '🐢 Chậm' : s === 'normal' ? '👌 Vừa' : '⚡ Nhanh'}
              </button>
            ))}
          </div>
        </Row>
        <Row label="Transition giữa segments">
          <Sel value={motionSpec.transition} onChange={v => onChange({ transition: v as MotionSpec['transition'] })} options={[
            { value: 'cut', label: 'Cut (cắt ngay)' },
            { value: 'fade', label: 'Fade' },
            { value: 'slide', label: 'Slide' },
            { value: 'zoom-in', label: 'Zoom in' },
          ]} />
        </Row>
      </div>

      {/* Accent */}
      <div className="space-y-3">
        <p className="text-xs font-bold text-gray-700 uppercase tracking-wider border-b pb-1">Accent</p>
        <Row label="Màu accent">
          <ColorInput value={motionSpec.accentColor} onChange={v => onChange({ accentColor: v })} />
        </Row>
        <Row label="Kiểu accent">
          <Sel value={motionSpec.accentStyle} onChange={v => onChange({ accentStyle: v as MotionSpec['accentStyle'] })} options={[
            { value: 'none', label: 'Không có' },
            { value: 'underline', label: 'Gạch chân' },
            { value: 'highlight', label: 'Highlight' },
            { value: 'pill', label: 'Viền tròn (pill)' },
            { value: 'border-left', label: 'Viền trái' },
          ]} />
        </Row>
      </div>

      {/* Overlay */}
      <div className="space-y-3">
        <p className="text-xs font-bold text-gray-700 uppercase tracking-wider border-b pb-1">Overlay</p>
        <Row label="Hiệu ứng overlay">
          <Sel value={motionSpec.overlay} onChange={v => onChange({ overlay: v as MotionSpec['overlay'] })} options={[
            { value: 'none', label: 'Không có' },
            { value: 'vignette', label: 'Vignette (viền tối)' },
            { value: 'scanlines', label: 'Scanlines (CRT)' },
            { value: 'grain', label: 'Film grain' },
          ]} />
        </Row>
      </div>

      {/* Music */}
      <div className="space-y-3">
        <p className="text-xs font-bold text-gray-700 uppercase tracking-wider border-b pb-1">Nhạc nền</p>
        <Row label="Preset nhạc">
          <Sel
            value={MUSIC_PRESETS.find(p => p.url === (motionSpec.musicUrl ?? ''))?.url ?? ''}
            onChange={v => { setCustomMusic(v); onChange({ musicUrl: v || null }) }}
            options={MUSIC_PRESETS.map(p => ({ value: p.url, label: p.label }))}
          />
        </Row>
        <Row label="URL nhạc tuỳ chỉnh">
          <input
            type="text"
            value={customMusic}
            placeholder="https://... (mp3/wav/ogg)"
            onChange={e => setCustomMusic(e.target.value)}
            onBlur={() => onChange({ musicUrl: customMusic || null })}
            className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Row>
        {motionSpec.musicUrl && (
          <Row label={`Âm lượng: ${Math.round(motionSpec.musicVolume * 100)}%`}>
            <input
              type="range" min={0} max={1} step={0.05}
              value={motionSpec.musicVolume}
              onChange={e => onChange({ musicVolume: parseFloat(e.target.value) })}
              className="w-full"
            />
          </Row>
        )}
      </div>

      {/* Reset */}
      <button
        onClick={() => onChange({ ...DEFAULT_MOTION_SPEC })}
        className="w-full py-2 border border-gray-300 text-gray-600 text-xs rounded-lg hover:bg-gray-50 transition-colors"
      >
        Đặt lại về mặc định
      </button>
    </div>
  )
}

// ─── Edit panel ───────────────────────────────────────────────────────────────

function EditPanel({
  segment, job, onSegmentUpdated,
}: {
  segment: Segment | null
  job: Job
  onSegmentUpdated: (updated: Segment) => void
}) {
  const [text, setText]         = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [saving, setSaving]     = useState(false)
  const [ttsLoading, setTtsLoading] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [ttsProvider, setTtsProvider] = useState<TTSProvider>(job.ttsProvider as TTSProvider)
  const [ttsVoiceId, setTtsVoiceId]   = useState(job.ttsVoiceId)

  useEffect(() => {
    if (segment) {
      setText(segment.text)
      setSubtitle(segment.subtitle)
      setAudioUrl(segment.audioUrl ?? null)
    }
  }, [segment?.id])

  const saveSegment = useCallback(async (fields: Partial<Segment>) => {
    if (!segment) return
    setSaving(true)
    try {
      const res = await fetch(`/api/segment/${segment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      })
      if (res.ok) {
        const updated = await res.json()
        onSegmentUpdated(updated)
      }
    } finally {
      setSaving(false)
    }
  }, [segment])

  const handleTts = async () => {
    if (!segment) return
    setTtsLoading(true)
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segmentId: segment.id,
          text: text || segment.text,
          provider: ttsProvider,
          voiceId: ttsVoiceId,
          language: job.language,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setAudioUrl(data.audioUrl)
        onSegmentUpdated({ ...segment, audioUrl: data.audioUrl })
      }
    } finally {
      setTtsLoading(false)
    }
  }

  if (!segment) {
    return (
      <div
        data-testid="edit-panel"
        className="h-full flex items-center justify-center text-gray-400 text-sm"
      >
        Chọn một segment để chỉnh sửa
      </div>
    )
  }

  return (
    <div data-testid="edit-panel" className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
          Nội dung segment
        </label>
        <textarea
          data-testid="segment-text"
          value={text}
          onChange={e => setText(e.target.value)}
          onBlur={() => saveSegment({ text })}
          rows={5}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
          Phụ đề
        </label>
        <input
          type="text"
          value={subtitle}
          onChange={e => setSubtitle(e.target.value)}
          onBlur={() => saveSegment({ subtitle })}
          placeholder="Phụ đề hiển thị..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="text-xs text-gray-500 bg-gray-50 rounded px-3 py-2">
        Thời lượng ước tính: <strong>{segment.duration.toFixed(1)}s</strong>
        {saving && <span className="ml-2 text-blue-500">Đang lưu...</span>}
      </div>

      {/* TTS */}
      <div className="border-t pt-4">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Giọng đọc</p>
        <VoiceSelector
          provider={ttsProvider}
          voiceId={ttsVoiceId}
          onChange={(p, v) => { setTtsProvider(p); setTtsVoiceId(v) }}
        />
        <button
          onClick={handleTts}
          disabled={ttsLoading}
          className="mt-3 w-full py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {ttsLoading ? 'Đang tạo...' : 'Tạo giọng đọc'}
        </button>
        {audioUrl && (
          <audio controls src={audioUrl} className="w-full mt-3 rounded" />
        )}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function VerifyPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params)
  const router       = useRouter()
  const searchParams = useSearchParams()
  const aiReasoning    = searchParams.get('reasoning')
  const aiTemplateName = searchParams.get('templateName')
  const aiTemplate     = searchParams.get('template')        // 'dynamic' nếu có MotionSpec
  const aiPickedTemplate = searchParams.get('aiTemplate')    // template AI thực sự chọn (hook, neon...)

  const [job, setJob]                             = useState<Job | null>(null)
  const [segments, setSegments]                   = useState<Segment[]>([])
  const [selectedSegment, setSelectedSegment]     = useState<Segment | null>(null)
  const [activeTemplate, setActiveTemplate]       = useState<string>(aiTemplate ?? 'news')
  const [renderLoading, setRenderLoading]         = useState(false)
  const [audioGenLoading, setAudioGenLoading]     = useState(false)
  const [audioGenProgress, setAudioGenProgress]   = useState(0)
  const [error, setError]                         = useState<string | null>(null)

  // MotionSpec (for DynamicTemplate fine-tuning)
  const [motionSpec, setMotionSpec]   = useState<MotionSpec>(DEFAULT_MOTION_SPEC)
  const [rightTab, setRightTab]       = useState<'edit' | 'style'>(aiTemplate === 'dynamic' ? 'style' : 'edit')
  const saveSpecTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Chat
  const [chatOpen, setChatOpen]       = useState(false)
  const [chatInput, setChatInput]     = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: 'Xin chào! Tôi có thể giúp bạn chỉnh sửa video. Ví dụ: "Đổi template sang neon", "Sửa đoạn 2 thành ..."' },
  ])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // Fetch job on mount + poll
  useEffect(() => {
    let cancelled = false
    let initialized = false

    const fetchJob = async () => {
      try {
        const res  = await fetch(`/api/job/${jobId}`)
        const data = await res.json() as Job
        if (cancelled) return
        setJob(data)
        setSegments(data.segments)
        // Chỉ set template lần đầu load — không ghi đè khi user đã chọn template khác
        if (!initialized) {
          if (data.motionSpec) {
            setMotionSpec(data.motionSpec)
            setActiveTemplate(aiTemplate === 'dynamic' ? 'dynamic' : data.template)
          } else {
            setActiveTemplate(aiTemplate ?? data.template)
          }
          initialized = true

          // Auto-fetch images if segments have imagePrompts but no imageUrls
          const needsImages = data.segments.some((s: any) => s.imagePrompt && !s.imageUrl)
          if (needsImages) {
            fetch('/api/images', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ jobId }),
            }).then(async r => {
              if (!r.ok) return
              const d = await r.json()
              const updated: { id: string; imageUrl: string }[] = d.updated ?? []
              if (updated.length > 0 && !cancelled) {
                setSegments(prev => prev.map(s => {
                  const found = updated.find(u => u.id === s.id)
                  return found ? { ...s, imageUrl: found.imageUrl } : s
                }))
              }
            }).catch(() => {})
          }
        }
      } catch {
        // silently ignore poll errors
      }
      if (!cancelled) {
        setTimeout(fetchJob, 3000)
      }
    }

    fetchJob()
    return () => { cancelled = true }
  }, [jobId])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setSegments(prev => {
      const oldIndex = prev.findIndex(s => s.id === active.id)
      const newIndex = prev.findIndex(s => s.id === over.id)
      const reordered = arrayMove(prev, oldIndex, newIndex)

      // Persist new order for affected segments
      reordered.forEach((seg, idx) => {
        if (seg.order !== idx) {
          fetch(`/api/segment/${seg.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order: idx } as any),
          }).catch(() => {})
        }
      })

      return reordered.map((s, i) => ({ ...s, order: i }))
    })
  }, [])

  const handleAddSegment = async () => {
    if (!job) return
    // Create a blank segment by patching; in practice we need a "create" endpoint.
    // For now add a placeholder locally to show UI (actual persistence needs /api/segment POST).
    const placeholder: Segment = {
      id: `temp-${Date.now()}`,
      order: segments.length,
      text: 'Nội dung mới...',
      subtitle: '',
      duration: 5,
      startTime: segments.reduce((s, seg) => s + seg.duration, 0),
    }
    setSegments(prev => [...prev, placeholder])
  }

  const handleDeleteSegment = async (segId: string) => {
    setSegments(prev => prev.filter(s => s.id !== segId))
    if (selectedSegment?.id === segId) setSelectedSegment(null)
    // Persist deletion — requires a DELETE endpoint; fire-and-forget
    fetch(`/api/segment/${segId}`, { method: 'DELETE' }).catch(() => {})
  }

  const handleSegmentUpdated = useCallback((updated: Segment) => {
    setSegments(prev => prev.map(s => s.id === updated.id ? updated : s))
    setSelectedSegment(prev => prev?.id === updated.id ? updated : prev)
  }, [])

  const handleGenerateAllAudio = async () => {
    if (!job) return
    const missing = segments.filter(s => !s.audioUrl)
    if (missing.length === 0) return
    setAudioGenLoading(true)
    setAudioGenProgress(0)
    let done = 0

    // Fetch images in background while generating audio
    const hasImagePrompts = segments.some(s => s.imagePrompt && !s.imageUrl)
    if (hasImagePrompts) {
      fetch('/api/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id }),
      }).then(async res => {
        if (!res.ok) return
        const data = await res.json()
        const updated: { id: string; imageUrl: string }[] = data.updated ?? []
        if (updated.length > 0) {
          setSegments(prev => prev.map(s => {
            const found = updated.find(u => u.id === s.id)
            return found ? { ...s, imageUrl: found.imageUrl } : s
          }))
        }
      }).catch(() => {})
    }

    for (const seg of missing) {
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            segmentId: seg.id,
            text: seg.text,
            provider: job.ttsProvider,
            voiceId: job.ttsVoiceId,
            language: job.language,
          }),
        })
        const data = await res.json()
        if (res.ok) handleSegmentUpdated({ ...seg, audioUrl: data.audioUrl })
      } catch { /* skip failed segment */ }
      done++
      setAudioGenProgress(Math.round((done / missing.length) * 100))
    }
    setAudioGenLoading(false)
    setAudioGenProgress(0)
  }

  const updateMotionSpec = useCallback((patch: Partial<MotionSpec>) => {
    setMotionSpec(prev => {
      const next = { ...prev, ...patch }
      // Debounce save to DB
      if (saveSpecTimer.current) clearTimeout(saveSpecTimer.current)
      saveSpecTimer.current = setTimeout(async () => {
        try {
          await fetch(`/api/job/${jobId}/motionspec`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ motionSpec: next }),
          })
        } catch { /* silently ignore */ }
      }, 600)
      return next
    })
  }, [jobId])

  const handleChatSend = async () => {
    const msg = chatInput.trim()
    if (!msg || !job) return
    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', text: msg }])
    setChatLoading(true)
    try {
      const res  = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id, message: msg }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      if (data.action === 'change_template' && data.template) {
        setActiveTemplate(data.template)
      }
      if (data.action === 'update_segment' && data.segmentId && data.text) {
        setSegments(prev => prev.map(s =>
          s.id === data.segmentId ? { ...s, text: data.text, audioUrl: undefined } : s
        ))
        setSelectedSegment(prev =>
          prev?.id === data.segmentId ? ({ ...prev, text: data.text as string, audioUrl: undefined } as Segment) : prev
        )
      }
      setChatMessages(prev => [...prev, { role: 'ai', text: data.reply }])
    } catch (e: any) {
      setChatMessages(prev => [...prev, { role: 'ai', text: `Lỗi: ${e.message}` }])
    } finally {
      setChatLoading(false)
    }
  }

  const handleRender = async () => {
    if (!job) return
    setRenderLoading(true)
    try {
      // Flush any pending debounced motionSpec save
      if (saveSpecTimer.current) {
        clearTimeout(saveSpecTimer.current)
        saveSpecTimer.current = null
      }

      // Sync active template + latest motionSpec to DB before render
      await Promise.all([
        fetch(`/api/job/${job.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ template: activeTemplate }),
        }),
        activeTemplate === 'dynamic'
          ? fetch(`/api/job/${job.id}/motionspec`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ motionSpec }),
            })
          : Promise.resolve(),
      ])

      const res  = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push(`/render/${job.id}`)
    } catch (e: any) {
      setError(e.message)
      setTimeout(() => setError(null), 4000)
    } finally {
      setRenderLoading(false)
    }
  }

  const templateConfig = TEMPLATES.find(t => t.id === activeTemplate) ?? TEMPLATES[0]
  const ActiveComponent = COMPONENTS[activeTemplate] ?? NewsTemplate

  const totalDuration = segments.reduce((s, seg) => s + seg.duration, 0)
  const totalFrames   = Math.max(30, Math.ceil(totalDuration * templateConfig.fps))

  const missingAudio  = segments.filter(s => !s.audioUrl).length
  const missingImages = segments.filter(s => !s.imageUrl).length
  const previewReady  = missingAudio === 0

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Đang tải...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Error toast */}
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg max-w-sm text-sm">
          {error}
        </div>
      )}

      {/* AI recommendation banner */}
      {aiReasoning && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 flex items-center gap-3 flex-shrink-0">
          <span className="text-lg flex-shrink-0">🤖</span>
          <div className="flex-1 text-sm min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {aiTemplate === 'dynamic' ? (
                <>
                  <span className="font-semibold">✨ AI Dynamic Style đang active</span>
                  <span className="opacity-60">·</span>
                  <span className="opacity-80 text-xs">{aiReasoning}</span>
                  {aiPickedTemplate && (
                    <button
                      onClick={() => setActiveTemplate(aiPickedTemplate)}
                      className="ml-auto flex-shrink-0 text-xs bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-full transition-colors"
                    >
                      Xem template gốc: {aiTemplateName}
                    </button>
                  )}
                </>
              ) : (
                <>
                  <span className="font-semibold">AI đã chọn: {aiTemplateName}</span>
                  <span className="mx-2 opacity-60">—</span>
                  <span className="opacity-90">{aiReasoning}</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/')} className="text-gray-500 hover:text-gray-800 text-sm">
            ← Trang chủ
          </button>
          <span className="text-gray-300">|</span>
          <h1 className="text-sm font-semibold text-gray-800">Xem & Chỉnh sửa Video</h1>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-mono">
            {job.id.slice(0, 8)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateAllAudio}
            disabled={audioGenLoading || segments.every(s => !!s.audioUrl)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {audioGenLoading
              ? `Đang tạo audio... ${audioGenProgress}%`
              : segments.every(s => !!s.audioUrl)
                ? '✓ Đã có audio'
                : `🎙 Tạo audio tất cả (${segments.filter(s => !s.audioUrl).length})`}
          </button>
          <button
            onClick={() => setChatOpen(prev => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              chatOpen
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            💬 AI Chat
          </button>
        </div>
      </header>

      {/* 3-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — segment list */}
        <aside className="w-72 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Segments ({segments.length})
            </span>
            <button
              onClick={handleAddSegment}
              className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded font-medium transition-colors"
            >
              + Thêm
            </button>
          </div>

          <div
            data-testid="segment-list"
            className="flex-1 overflow-y-auto p-3 space-y-2"
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={segments.map(s => s.id)} strategy={verticalListSortingStrategy}>
                {segments.map((seg, idx) => (
                  <div key={seg.id} className="group relative">
                    <SortableSegmentCard
                      segment={seg}
                      index={idx}
                      selected={selectedSegment?.id === seg.id}
                      onClick={() => setSelectedSegment(seg)}
                    />
                    <button
                      onClick={e => { e.stopPropagation(); handleDeleteSegment(seg.id) }}
                      className="absolute top-2 right-2 hidden group-hover:flex items-center justify-center w-5 h-5 bg-red-100 text-red-500 hover:bg-red-200 rounded text-xs"
                      aria-label="Xóa segment"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </aside>

        {/* Center panel — Player */}
        <main className="flex-1 flex flex-col overflow-hidden bg-gray-900">
          {/* Template switcher — redesigned */}
          <TemplateSwitcher
            activeTemplate={activeTemplate}
            onSelect={setActiveTemplate}
          />

          {/* Player */}
          <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
            <div
              style={{
                width: '100%',
                maxWidth: templateConfig.aspect === '9:16' ? 360 : 800,
                aspectRatio: templateConfig.aspect === '9:16' ? '9/16' : '16/9',
                position: 'relative',
              }}
            >
              <Player
                key={activeTemplate}
                component={ActiveComponent}
                inputProps={{ segments, template: activeTemplate, motionSpec }}
                durationInFrames={totalFrames}
                compositionWidth={templateConfig.width}
                compositionHeight={templateConfig.height}
                fps={templateConfig.fps}
                style={{ width: '100%', height: '100%' }}
                numberOfSharedAudioTags={segments.length + 2}
                controls
              />

              {/* Overlay khi chưa đủ điều kiện preview */}
              {!previewReady && (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-lg"
                  style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
                >
                  <div className="text-center px-6">
                    <div className="text-3xl mb-3">🎬</div>
                    <p className="text-white font-semibold text-sm mb-1">
                      Preview chưa sẵn sàng
                    </p>
                    <p className="text-gray-400 text-xs leading-relaxed">
                      Video thật sẽ khác — cần đủ audio &amp; ảnh mới phản ánh đúng chất lượng.
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5 text-xs w-48">
                    {missingAudio > 0 && (
                      <div className="flex items-center justify-between bg-red-900/60 text-red-300 px-3 py-1.5 rounded">
                        <span>Thiếu audio</span>
                        <span className="font-bold">{missingAudio}/{segments.length}</span>
                      </div>
                    )}
                    {missingImages > 0 && (
                      <div className="flex items-center justify-between bg-yellow-900/60 text-yellow-300 px-3 py-1.5 rounded">
                        <span>Ảnh (có sau render)</span>
                        <span className="font-bold">{missingImages}/{segments.length}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleGenerateAllAudio}
                    disabled={audioGenLoading}
                    className="px-4 py-2 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors"
                  >
                    {audioGenLoading
                      ? `Đang tạo audio... ${audioGenProgress}%`
                      : `Tạo audio (${missingAudio} segment)`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Right panel — tabs: Edit | Style */}
        <aside className="w-80 flex-shrink-0 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-gray-200 flex-shrink-0">
            {(['edit', 'style'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setRightTab(tab)}
                className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                  rightTab === tab
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab === 'edit' ? '✏️ Chỉnh sửa' : '✨ Giao diện'}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {rightTab === 'edit' ? (
              <EditPanel
                segment={selectedSegment}
                job={job}
                onSegmentUpdated={handleSegmentUpdated}
              />
            ) : (
              <StylePanel
                motionSpec={motionSpec}
                onChange={updateMotionSpec}
                isDynamic={activeTemplate === 'dynamic'}
                onSwitchToDynamic={() => setActiveTemplate('dynamic')}
              />
            )}
          </div>
        </aside>
      </div>

      {/* Chat panel — floating overlay */}
      {chatOpen && (
        <div className="fixed bottom-16 right-4 z-40 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          style={{ maxHeight: '520px' }}
        >
          {/* Chat header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white flex-shrink-0">
            <span className="text-sm font-semibold">AI Chat — chỉnh sửa video</span>
            <button onClick={() => setChatOpen(false)} className="text-white/70 hover:text-white text-lg leading-none">×</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
            {chatMessages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-snug ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-500 px-3 py-2 rounded-xl text-sm rounded-bl-sm">
                  <span className="animate-pulse">AI đang xử lý...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-3 border-t border-gray-100 flex-shrink-0">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend() } }}
              placeholder="Ví dụ: đổi template sang neon..."
              disabled={chatLoading}
              className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            />
            <button
              onClick={handleChatSend}
              disabled={chatLoading || !chatInput.trim()}
              className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Sticky bottom bar */}
      <footer className="bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>{segments.length} segment{segments.length !== 1 ? 's' : ''}</span>
          <span>·</span>
          <span>Tổng: {totalDuration.toFixed(1)}s</span>
          <span>·</span>
          <span>{totalFrames} frames</span>
        </div>
        <button
          onClick={handleRender}
          disabled={renderLoading || segments.length === 0}
          className="px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {renderLoading ? 'Đang bắt đầu...' : 'Render Video'}
        </button>
      </footer>
    </div>
  )
}
