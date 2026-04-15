'use client'
import { VBEE_VOICES } from '@/lib/voices'
import type { TTSProvider } from '@/types'

interface Props {
  provider: TTSProvider
  voiceId: string
  onChange: (provider: TTSProvider, voiceId: string) => void
}

export function VoiceSelector({ provider, voiceId, onChange }: Props) {
  const bac   = VBEE_VOICES.filter(v => v.region === 'Bắc')
  const trung = VBEE_VOICES.filter(v => v.region === 'Trung')
  const nam   = VBEE_VOICES.filter(v => v.region === 'Nam')

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          onClick={() => onChange('vbee', VBEE_VOICES[0].id)}
          className={`px-3 py-1.5 rounded text-sm font-medium border transition-colors ${provider === 'vbee' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
        >
          🇻🇳 Vbee
        </button>
        <button
          onClick={() => onChange('elevenlabs', process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID ?? '21m00Tcm4TlvDq8ikWAM')}
          className={`px-3 py-1.5 rounded text-sm font-medium border transition-colors ${provider === 'elevenlabs' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
        >
          ElevenLabs
        </button>
        <button
          onClick={() => onChange('edge', 'vi-VN-HoaiMyNeural')}
          className={`px-3 py-1.5 rounded text-sm font-medium border transition-colors ${provider === 'edge' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
        >
          Edge (free)
        </button>
      </div>

      {provider === 'vbee' && (
        <select
          value={voiceId}
          onChange={e => onChange('vbee', e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <optgroup label="Giọng miền Bắc">
            {bac.map(v => <option key={v.id} value={v.id}>{v.name} ({v.gender})</option>)}
          </optgroup>
          <optgroup label="Giọng miền Trung">
            {trung.map(v => <option key={v.id} value={v.id}>{v.name} ({v.gender})</option>)}
          </optgroup>
          <optgroup label="Giọng miền Nam">
            {nam.map(v => <option key={v.id} value={v.id}>{v.name} ({v.gender})</option>)}
          </optgroup>
        </select>
      )}

      {provider === 'elevenlabs' && (
        <div>
          <input
            type="text"
            value={voiceId}
            onChange={e => onChange('elevenlabs', e.target.value)}
            placeholder="Voice ID"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            <a href="https://elevenlabs.io/voices" target="_blank" rel="noreferrer" className="underline">Xem danh sách giọng</a>
          </p>
        </div>
      )}

      {provider === 'edge' && (
        <p className="text-sm text-gray-500">
          Sẽ dùng vi-VN-HoaiMyNeural (Tiếng Việt) hoặc en-US-JennyNeural (English)
        </p>
      )}
    </div>
  )
}
