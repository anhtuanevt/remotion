import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import type { TTSProvider } from '@/types'
export { VBEE_VOICES, DEFAULT_VBEE_VOICE } from '@/lib/voices'

const memoryCache = new Map<string, string>()

export function buildCacheKey(text: string, provider: TTSProvider, voiceId: string): string {
  return crypto.createHash('md5').update(`${provider}:${voiceId}:${text}`).digest('hex')
}

function audioDirPath(): string {
  const dir = path.join(process.cwd(), 'public', 'audio')
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

function cacheFilePath(key: string): string {
  return path.join(audioDirPath(), `${key}.mp3`)
}

function toPublicUrl(key: string): string {
  return `/audio/${key}.mp3`
}

async function callVbee(text: string, voiceId: string, outputPath: string): Promise<void> {
  if (!process.env.VBEE_API_KEY || !process.env.VBEE_APP_ID) {
    throw new Error('VBEE_API_KEY or VBEE_APP_ID not configured')
  }

  const res = await fetch('https://api.vbee.vn/tts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.VBEE_API_KEY,
    },
    body: JSON.stringify({
      app_id:         process.env.VBEE_APP_ID,
      input_text:     text,
      voice_name:     voiceId,
      audio_type:     'mp3',
      speed:          1.0,
      without_filter: false,
    }),
  })

  if (!res.ok) throw new Error(`Vbee ${res.status}: ${await res.text()}`)
  const data = await res.json()

  if (data.audio_link) {
    const dl = await fetch(data.audio_link)
    if (!dl.ok) throw new Error('Vbee: failed downloading audio_link')
    fs.writeFileSync(outputPath, Buffer.from(await dl.arrayBuffer()))
  } else if (data.audio_data) {
    fs.writeFileSync(outputPath, Buffer.from(data.audio_data, 'base64'))
  } else {
    throw new Error(`Vbee: unexpected response: ${JSON.stringify(data)}`)
  }
}

async function callElevenLabs(text: string, voiceId: string, outputPath: string): Promise<void> {
  if (!process.env.ELEVENLABS_API_KEY) throw new Error('ELEVENLABS_API_KEY not configured')
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  })
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`)
  fs.writeFileSync(outputPath, Buffer.from(await res.arrayBuffer()))
}

async function callEdgeTTS(text: string, language: string, outputPath: string): Promise<void> {
  const { spawnSync } = await import('child_process')
  const voice = language === 'vi' ? 'vi-VN-HoaiMyNeural' : 'en-US-JennyNeural'
  const result = spawnSync(
    'edge-tts',
    ['--voice', voice, '--text', text.replace(/\n/g, ' '), '--write-media', outputPath],
    {
      timeout: 30_000,
      env: { ...process.env, PATH: `/Users/bruce/.local/bin:${process.env.PATH ?? ''}` },
    }
  )
  if (result.status !== 0 || result.error) {
    const msg = result.stderr?.toString().trim() || result.error?.message || 'edge-tts exited with non-zero status'
    throw new Error(`edge-tts failed: ${msg}`)
  }
}

// Measure actual MP3 duration using ffprobe
async function getAudioDurationSec(filePath: string): Promise<number | null> {
  try {
    const { spawnSync } = await import('child_process')
    const result = spawnSync(
      'ffprobe',
      ['-v', 'quiet', '-print_format', 'json', '-show_format', filePath],
      { timeout: 10_000 },
    )
    if (result.status !== 0) return null
    const data = JSON.parse(result.stdout.toString())
    const dur = parseFloat(data?.format?.duration)
    return isNaN(dur) ? null : dur
  } catch {
    return null
  }
}

export async function generateAudio(options: {
  text:      string
  provider:  TTSProvider
  voiceId:   string
  segmentId: string
  language?: string
}): Promise<{ audioUrl: string; cacheKey: string; durationSec: number | null }> {
  const { text, provider, voiceId, language = 'vi' } = options
  const key      = buildCacheKey(text, provider, voiceId)
  const filePath = cacheFilePath(key)
  const url      = toPublicUrl(key)

  if (memoryCache.has(key)) {
    const durationSec = await getAudioDurationSec(filePath)
    return { audioUrl: memoryCache.get(key)!, cacheKey: key, durationSec }
  }

  if (fs.existsSync(filePath)) {
    memoryCache.set(key, url)
    const durationSec = await getAudioDurationSec(filePath)
    return { audioUrl: url, cacheKey: key, durationSec }
  }

  try {
    if (provider === 'vbee')            await callVbee(text, voiceId, filePath)
    else if (provider === 'elevenlabs') await callElevenLabs(text, voiceId, filePath)
    else                                await callEdgeTTS(text, language, filePath)
  } catch (err) {
    console.warn(`[TTS] ${provider} failed, falling back to edge-tts:`, err)
    await callEdgeTTS(text, language, filePath)
  }

  memoryCache.set(key, url)
  const durationSec = await getAudioDurationSec(filePath)
  return { audioUrl: url, cacheKey: key, durationSec }
}

export function detectDefaultProvider(): TTSProvider {
  if (process.env.VBEE_API_KEY && process.env.VBEE_APP_ID) return 'vbee'
  if (process.env.ELEVENLABS_API_KEY) return 'elevenlabs'
  return 'edge'
}
