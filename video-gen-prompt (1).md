# 🎬 AI Video Generator — Full Build Prompt for Claude Code

## MISSION
Build a complete full-stack web application that turns transcripts or ideas into videos using Remotion + React. Work autonomously from frontend → backend → tests until all tests pass. Do not stop until every test is green.

---

## ORCHESTRATOR AGENT (Main Claude)

You are the **Orchestrator**. Your job is to:
1. Read this entire prompt first
2. Spawn subagents via `Task` tool in parallel where possible
3. Wait for each subagent to finish before moving to dependent tasks
4. Run final integration tests
5. Fix any failures and re-test until everything passes

**Spawn order:**
```
Phase 1 (parallel): SUBAGENT_PROJECT_SETUP + SUBAGENT_DESIGN_SYSTEM
Phase 2 (parallel): SUBAGENT_TEMPLATES + SUBAGENT_BACKEND_CORE
Phase 3 (parallel): SUBAGENT_FRONTEND_PAGES + SUBAGENT_REMOTION_RENDERER
Phase 4 (sequential): SUBAGENT_API_INTEGRATION → SUBAGENT_TESTS
Phase 5: Orchestrator runs all tests, fixes failures, repeats until green
```

---

## TECH STACK

```
Frontend:  Next.js 14 (App Router) + TypeScript + Tailwind CSS
Video:     Remotion 4.x
Backend:   Next.js API Routes + Prisma + SQLite (dev) / PostgreSQL (prod)
Queue:     BullMQ + Redis (use ioredis)
TTS:       Vbee API (primary, Vietnamese) + ElevenLabs (English) + Edge TTS (free fallback)
Images:    Unsplash API (free tier) + Pexels API fallback
AI:        Anthropic Claude API (claude-sonnet-4-20250514) for idea expansion
Auth:      None for MVP
Testing:   Vitest + Playwright (E2E)
```

---

## PROJECT STRUCTURE

```
video-gen/
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Landing / input page
│   │   ├── verify/[jobId]/page.tsx   # Verify & Edit UI
│   │   ├── render/[jobId]/page.tsx   # Render progress page
│   │   └── api/
│   │       ├── create/route.ts       # POST: create job
│   │       ├── job/[id]/route.ts     # GET: poll job status
│   │       ├── segment/[id]/route.ts # PATCH: edit segment
│   │       ├── render/route.ts       # POST: trigger render
│   │       └── tts/route.ts          # POST: generate audio
│   ├── remotion/
│   │   ├── index.ts
│   │   ├── Root.tsx
│   │   ├── helpers.ts
│   │   └── templates/
│   │       ├── NewsTemplate.tsx
│   │       ├── EduTemplate.tsx
│   │       ├── PodcastTemplate.tsx
│   │       ├── TechTemplate.tsx
│   │       ├── StoryTemplate.tsx
│   │       ├── MinimalTemplate.tsx
│   │       ├── KidsTemplate.tsx
│   │       ├── DocumentaryTemplate.tsx
│   │       ├── SocialTemplate.tsx      # 9:16 vertical
│   │       ├── WhiteboardTemplate.tsx
│   │       └── index.ts
│   ├── components/
│   │   ├── SegmentList.tsx
│   │   ├── VideoPreview.tsx
│   │   ├── EditPanel.tsx
│   │   ├── TemplateSelector.tsx
│   │   ├── VoiceSelector.tsx           # Provider + voice picker
│   │   └── ProgressBar.tsx
│   ├── lib/
│   │   ├── anthropic.ts
│   │   ├── tts.ts                      # Unified: Vbee + ElevenLabs + Edge + cache
│   │   ├── unsplash.ts
│   │   ├── parser.ts
│   │   ├── queue.ts
│   │   ├── renderer.ts
│   │   └── db.ts
│   └── types/index.ts
├── prisma/schema.prisma
├── tests/
│   ├── unit/
│   │   ├── parser.test.ts
│   │   ├── tts.test.ts
│   │   └── templates.test.ts
│   └── e2e/
│       ├── create-from-transcript.spec.ts
│       ├── create-from-idea.spec.ts
│       └── verify-edit.spec.ts
├── .env.example
├── package.json
└── remotion.config.ts
```

---

## SUBAGENT_PROJECT_SETUP

**Task:** Initialize the project from scratch.

```bash
npx create-next-app@latest video-gen --typescript --tailwind --app --src-dir --import-alias "@/*" --no-git
cd video-gen

npm install remotion @remotion/renderer @remotion/bundler @remotion/player
npm install @anthropic-ai/sdk bullmq ioredis prisma @prisma/client zod
npm install @dnd-kit/core @dnd-kit/sortable

npm install -D vitest @vitejs/plugin-react playwright @playwright/test

npx prisma init --datasource-provider sqlite
```

**`prisma/schema.prisma`:**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Job {
  id           String    @id @default(cuid())
  status       JobStatus @default(DRAFT)
  template     String    @default("news")
  language     String    @default("vi")
  ttsProvider  String    @default("vbee")
  ttsVoiceId   String    @default("hn_female_ngochuyen_full_48k-fhg")
  segments     Segment[]
  outputUrl    String?
  errorMessage String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}

model Segment {
  id            String   @id @default(cuid())
  jobId         String
  job           Job      @relation(fields: [jobId], references: [id], onDelete: Cascade)
  order         Int
  text          String
  subtitle      String
  duration      Float
  startTime     Float
  audioUrl      String?
  audioCacheKey String?
  imageUrl      String?
  imagePrompt   String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

enum JobStatus {
  DRAFT
  RENDERING
  DONE
  ERROR
}
```

**`.env.example`:**
```env
DATABASE_URL="file:./dev.db"

# Anthropic — required for "Idea" flow
ANTHROPIC_API_KEY=sk-ant-...

# Vbee — best Vietnamese TTS (recommended)
VBEE_APP_ID=your_app_id
VBEE_API_KEY=your_api_key

# ElevenLabs — best English TTS (optional)
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM

# Unsplash — images (optional, has fallback)
UNSPLASH_ACCESS_KEY=...

# Redis — job queue (optional, falls back to in-process for dev)
REDIS_URL=redis://localhost:6379
```

**`remotion.config.ts`:**
```ts
import { Config } from '@remotion/cli/config';
Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
```

Run: `npx prisma migrate dev --name init && npx prisma generate`

---

## SUBAGENT_DESIGN_SYSTEM

**Task:** Create all shared types.

**`src/types/index.ts`:**
```ts
export type TemplateId =
  | 'news' | 'edu' | 'podcast' | 'tech' | 'story'
  | 'minimal' | 'kids' | 'documentary' | 'social' | 'whiteboard'

export type TTSProvider = 'vbee' | 'elevenlabs' | 'edge'

export interface VbeeVoice {
  id: string
  name: string
  region: 'Bắc' | 'Trung' | 'Nam'
  gender: 'Nữ' | 'Nam'
}

export interface Segment {
  id: string
  order: number
  text: string
  subtitle: string
  duration: number
  startTime: number
  audioUrl?: string
  audioCacheKey?: string
  imageUrl?: string
  imagePrompt?: string
}

export interface Job {
  id: string
  status: 'DRAFT' | 'RENDERING' | 'DONE' | 'ERROR'
  template: TemplateId
  language: string
  ttsProvider: TTSProvider
  ttsVoiceId: string
  segments: Segment[]
  outputUrl?: string
  errorMessage?: string
}

export interface TemplateConfig {
  id: TemplateId
  name: string
  description: string
  aspect: '16:9' | '9:16' | '1:1'
  fps: number
  width: number
  height: number
  thumbnail: string
  tags: string[]
}

export interface VideoProps {
  segments: Segment[]
  template: TemplateId
}
```

---

## SUBAGENT_BACKEND_CORE

**Task:** Build all library functions. The TTS layer is the most critical — implement correctly.

### `src/lib/tts.ts` — Unified TTS with dual-layer cache

```ts
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import type { TTSProvider, VbeeVoice } from '@/types'

// ─── Vbee voice registry ──────────────────────────────────
export const VBEE_VOICES: VbeeVoice[] = [
  // Miền Bắc
  { id: 'hn_female_ngochuyen_full_48k-fhg', name: 'Ngọc Huyền', region: 'Bắc', gender: 'Nữ' },
  { id: 'hn_male_minhquang_full_48k-fhg',   name: 'Minh Quang', region: 'Bắc', gender: 'Nam' },
  { id: 'hn_female_thungan_full_48k-fhg',   name: 'Thu Ngân',   region: 'Bắc', gender: 'Nữ' },
  { id: 'hn_male_thanhlong_full_48k-fhg',   name: 'Thanh Long', region: 'Bắc', gender: 'Nam' },
  { id: 'hn_female_maiphuong_full_48k-fhg', name: 'Mai Phương', region: 'Bắc', gender: 'Nữ' },
  // Miền Trung
  { id: 'hue_female_full_48k-fhg',          name: 'Giọng Huế',  region: 'Trung', gender: 'Nữ' },
  { id: 'hue_male_full_48k-fhg',            name: 'Giọng Huế',  region: 'Trung', gender: 'Nam' },
  // Miền Nam
  { id: 'sg_female_thaotrinh_full_48k-fhg', name: 'Thảo Trinh', region: 'Nam', gender: 'Nữ' },
  { id: 'sg_male_minhtan_full_48k-fhg',     name: 'Minh Tân',   region: 'Nam', gender: 'Nam' },
  { id: 'sg_female_ngoclan_full_48k-fhg',   name: 'Ngọc Lan',   region: 'Nam', gender: 'Nữ' },
  { id: 'sg_male_namgiang_full_48k-fhg',    name: 'Nam Giang',  region: 'Nam', gender: 'Nam' },
]

export const DEFAULT_VBEE_VOICE = VBEE_VOICES[0].id

// ─── Cache helpers ────────────────────────────────────────
// Memory cache: survives for Node process lifetime
// Disk cache: survives server restarts — same text+provider+voice = same file, never re-generated
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

// ─── Vbee ─────────────────────────────────────────────────
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

// ─── ElevenLabs ───────────────────────────────────────────
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

// ─── Edge TTS (free fallback) ─────────────────────────────
async function callEdgeTTS(text: string, language: string, outputPath: string): Promise<void> {
  const { execSync } = await import('child_process')
  const voice = language === 'vi' ? 'vi-VN-HoaiMyNeural' : 'en-US-JennyNeural'
  const safe = text.replace(/"/g, "'").replace(/\n/g, ' ')
  execSync(`edge-tts --voice ${voice} --text "${safe}" --write-media "${outputPath}"`, { timeout: 30_000 })
}

// ─── Public generateAudio API ─────────────────────────────
export async function generateAudio(options: {
  text:      string
  provider:  TTSProvider
  voiceId:   string
  segmentId: string
  language?: string
}): Promise<{ audioUrl: string; cacheKey: string }> {
  const { text, provider, voiceId, language = 'vi' } = options
  const key      = buildCacheKey(text, provider, voiceId)
  const filePath = cacheFilePath(key)
  const url      = toPublicUrl(key)

  // 1. Memory cache hit
  if (memoryCache.has(key)) return { audioUrl: memoryCache.get(key)!, cacheKey: key }

  // 2. Disk cache hit (server restart resilience)
  if (fs.existsSync(filePath)) {
    memoryCache.set(key, url)
    return { audioUrl: url, cacheKey: key }
  }

  // 3. Generate — with auto-fallback chain
  try {
    if (provider === 'vbee')        await callVbee(text, voiceId, filePath)
    else if (provider === 'elevenlabs') await callElevenLabs(text, voiceId, filePath)
    else                            await callEdgeTTS(text, language, filePath)
  } catch (err) {
    console.warn(`[TTS] ${provider} failed, falling back to edge-tts:`, err)
    await callEdgeTTS(text, language, filePath)
  }

  memoryCache.set(key, url)
  return { audioUrl: url, cacheKey: key }
}

// Detect best provider from available env vars
export function detectDefaultProvider(): TTSProvider {
  if (process.env.VBEE_API_KEY && process.env.VBEE_APP_ID) return 'vbee'
  if (process.env.ELEVENLABS_API_KEY) return 'elevenlabs'
  return 'edge'
}
```

### `src/lib/parser.ts`
```ts
import type { Segment } from '@/types'
import { randomUUID } from 'crypto'

const WPM: Record<string, number> = { vi: 130, en: 150 }
const MIN_DUR = 2
const MAX_DUR = 8

function estimateDuration(text: string, lang: string): number {
  const wpm   = WPM[lang] ?? 140
  const words = text.trim().split(/\s+/).length
  return Math.min(MAX_DUR, Math.max(MIN_DUR, (words / wpm) * 60))
}

function splitLong(sentence: string, lang: string): string[] {
  if (estimateDuration(sentence, lang) <= MAX_DUR) return [sentence]
  const mid      = Math.floor(sentence.length / 2)
  const commaIdx = sentence.indexOf(',', mid - 20)
  if (commaIdx > 0) {
    return [sentence.slice(0, commaIdx + 1).trim(), sentence.slice(commaIdx + 1).trim()].filter(Boolean)
  }
  const words = sentence.split(' ')
  const half  = Math.floor(words.length / 2)
  return [words.slice(0, half).join(' '), words.slice(half).join(' ')]
}

function extractImagePrompt(text: string): string {
  const stop = /\b(và|của|các|những|một|là|có|được|này|đó|the|a|an|is|are|was|were)\b/gi
  return text.replace(stop, '').replace(/\s+/g, ' ').trim().slice(0, 120)
}

export function parseTranscript(text: string, language = 'vi'): Segment[] {
  if (!text.trim()) throw new Error('Transcript is empty')

  const raw = text
    .split(/(?<=[.!?])\s+|(?<=\n)\n+/)
    .map(s => s.trim())
    .filter(Boolean)

  const sentences = raw.flatMap(s => splitLong(s, language))

  let cursor = 0
  return sentences.map((sentence, i) => {
    const duration = estimateDuration(sentence, language)
    const seg: Segment = {
      id:          randomUUID(),
      order:       i,
      text:        sentence,
      subtitle:    sentence.length > 80 ? sentence.slice(0, 77) + '…' : sentence,
      duration,
      startTime:   cursor,
      imagePrompt: extractImagePrompt(sentence),
    }
    cursor += duration
    return seg
  })
}
```

### `src/lib/anthropic.ts`
```ts
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function expandIdea(idea: string, language: string): Promise<string> {
  const langLabel = language === 'vi' ? 'Vietnamese' : 'English'
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are a professional video script writer. Write a natural, engaging video narration script.

Rules:
- Write ONLY the narration text — no headers, no stage directions, no markdown
- Use ${langLabel} throughout
- Target: 250–400 words (~2 min of speech)
- Split into natural paragraphs (one idea per paragraph)
- Clear, simple language suitable for voiceover

Idea: ${idea}`,
    }],
  })
  const block = msg.content[0]
  if (block.type !== 'text') throw new Error('Unexpected Claude response')
  return block.text.trim()
}
```

### `src/lib/unsplash.ts`
```ts
const cache = new Map<string, string>()
const FALLBACKS = [
  'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1920&q=80',
  'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1920&q=80',
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1920&q=80',
]

export async function searchImage(prompt: string): Promise<string> {
  if (cache.has(prompt)) return cache.get(prompt)!
  if (!process.env.UNSPLASH_ACCESS_KEY) return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)]
  try {
    const q   = encodeURIComponent(prompt.slice(0, 80))
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${q}&per_page=5&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` } }
    )
    const data = await res.json()
    const url  = data.results?.[0]?.urls?.regular ?? FALLBACKS[0]
    cache.set(prompt, url)
    return url
  } catch {
    return FALLBACKS[0]
  }
}
```

### `src/lib/db.ts`
```ts
import { PrismaClient } from '@prisma/client'
const g = globalThis as any
export const db: PrismaClient = g.prisma ?? new PrismaClient({ log: ['error'] })
if (process.env.NODE_ENV !== 'production') g.prisma = db
```

### `src/lib/queue.ts`
```ts
// BullMQ with graceful in-process fallback when Redis unavailable
export async function enqueueRender(jobId: string): Promise<void> {
  try {
    const { Queue }   = await import('bullmq')
    const { default: Redis } = await import('ioredis')
    const conn = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: 1, connectTimeout: 2000,
    })
    await conn.ping()
    const q = new Queue('video-render', { connection: conn })
    await q.add('render', { jobId }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } })
  } catch {
    console.warn('[Queue] Redis unavailable — running render in-process (dev mode)')
    const { renderVideo } = await import('./renderer')
    const { db }          = await import('./db')
    const job = await db.job.findUnique({ where: { id: jobId }, include: { segments: { orderBy: { order: 'asc' } } } })
    if (!job) throw new Error('Job not found')
    const outputUrl = await renderVideo(job as any)
    await db.job.update({ where: { id: jobId }, data: { status: 'DONE', outputUrl } })
  }
}
```

### API Routes:

**`POST /api/create`** — branch logic: transcript bypasses LLM
```ts
import { z } from 'zod'
import { db } from '@/lib/db'
import { expandIdea } from '@/lib/anthropic'
import { parseTranscript } from '@/lib/parser'
import { detectDefaultProvider, DEFAULT_VBEE_VOICE } from '@/lib/tts'

const Body = z.object({
  type:        z.enum(['transcript', 'idea']),
  content:     z.string().min(1).max(10000),
  language:    z.string().default('vi'),
  template:    z.string().default('news'),
  ttsProvider: z.enum(['vbee', 'elevenlabs', 'edge']).optional(),
  ttsVoiceId:  z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const body = Body.parse(await req.json())

    // KEY DECISION: transcript → use directly, idea → expand via LLM
    const transcript = body.type === 'transcript'
      ? body.content
      : await expandIdea(body.content, body.language)

    const segments    = parseTranscript(transcript, body.language)
    const ttsProvider = body.ttsProvider ?? detectDefaultProvider()
    const ttsVoiceId  = body.ttsVoiceId  ?? DEFAULT_VBEE_VOICE

    const job = await db.job.create({
      data: {
        template: body.template,
        language: body.language,
        ttsProvider,
        ttsVoiceId,
        segments: {
          create: segments.map(s => ({
            order: s.order, text: s.text, subtitle: s.subtitle,
            duration: s.duration, startTime: s.startTime, imagePrompt: s.imagePrompt,
          })),
        },
      },
      include: { segments: { orderBy: { order: 'asc' } } },
    })

    return Response.json({ jobId: job.id, segments: job.segments })
  } catch (err: any) {
    console.error('[/api/create]', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
```

**`GET /api/job/[id]`**
```ts
import { db } from '@/lib/db'
export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const job = await db.job.findUnique({
      where: { id: params.id },
      include: { segments: { orderBy: { order: 'asc' } } },
    })
    if (!job) return Response.json({ error: 'Not found' }, { status: 404 })
    return Response.json(job)
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
```

**`PATCH /api/segment/[id]`**
```ts
import { db } from '@/lib/db'
import { z } from 'zod'
const Body = z.object({
  text: z.string().optional(), subtitle: z.string().optional(),
  imageUrl: z.string().optional(), audioUrl: z.string().optional(),
  duration: z.number().optional(), imagePrompt: z.string().optional(),
})
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const segment = await db.segment.update({ where: { id: params.id }, data: Body.parse(await req.json()) })
    return Response.json(segment)
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
```

**`POST /api/tts`**
```ts
import { z } from 'zod'
import { generateAudio } from '@/lib/tts'
import { db } from '@/lib/db'

const Body = z.object({
  segmentId: z.string(),
  text:      z.string().min(1),
  provider:  z.enum(['vbee', 'elevenlabs', 'edge']).default('vbee'),
  voiceId:   z.string(),
  language:  z.string().default('vi'),
})

export async function POST(req: Request) {
  try {
    const body = Body.parse(await req.json())
    const { audioUrl, cacheKey } = await generateAudio({
      text: body.text, provider: body.provider as any,
      voiceId: body.voiceId, segmentId: body.segmentId, language: body.language,
    })
    await db.segment.update({
      where: { id: body.segmentId },
      data: { audioUrl, audioCacheKey: cacheKey },
    })
    return Response.json({ audioUrl })
  } catch (err: any) {
    console.error('[/api/tts]', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
```

**`POST /api/render`**
```ts
import { z } from 'zod'
import { db } from '@/lib/db'
import { generateAudio } from '@/lib/tts'
import { searchImage } from '@/lib/unsplash'
import { enqueueRender } from '@/lib/queue'

export async function POST(req: Request) {
  let jobId = ''
  try {
    jobId = z.object({ jobId: z.string() }).parse(await req.json()).jobId
    const job = await db.job.findUnique({
      where: { id: jobId }, include: { segments: { orderBy: { order: 'asc' } } },
    })
    if (!job) return Response.json({ error: 'Job not found' }, { status: 404 })

    // Pre-generate missing audio + images in parallel (max 3 concurrent)
    const chunks = <T>(arr: T[], n: number) =>
      Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n))

    for (const chunk of chunks(job.segments, 3)) {
      await Promise.all(chunk.map(async seg => {
        const updates: Record<string, string> = {}
        if (!seg.audioUrl) {
          const { audioUrl, cacheKey } = await generateAudio({
            text: seg.text, provider: job.ttsProvider as any,
            voiceId: job.ttsVoiceId, segmentId: seg.id, language: job.language,
          })
          updates.audioUrl = audioUrl
          updates.audioCacheKey = cacheKey
        }
        if (!seg.imageUrl && seg.imagePrompt) {
          updates.imageUrl = await searchImage(seg.imagePrompt)
        }
        if (Object.keys(updates).length) {
          await db.segment.update({ where: { id: seg.id }, data: updates })
        }
      }))
    }

    await db.job.update({ where: { id: jobId }, data: { status: 'RENDERING' } })
    await enqueueRender(jobId)
    return Response.json({ jobId, status: 'RENDERING' })
  } catch (err: any) {
    console.error('[/api/render]', err)
    if (jobId) await db.job.update({ where: { id: jobId }, data: { status: 'ERROR', errorMessage: err.message } }).catch(() => {})
    return Response.json({ error: err.message }, { status: 500 })
  }
}
```

---

## SUBAGENT_TEMPLATES

**Task:** Build all 10 Remotion templates. Every template must be fully functional.

**`src/remotion/helpers.ts`:**
```ts
import { interpolate, useCurrentFrame } from 'remotion'
import type { Segment } from '@/types'

export function useSegmentAnimation(startFrame: number, durationFrames: number) {
  const frame = useCurrentFrame()
  const local = frame - startFrame
  const fadeIn  = interpolate(local, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const fadeOut = interpolate(local, [durationFrames - 15, durationFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const slideUp = interpolate(local, [0, 20], [40, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return { opacity: Math.min(fadeIn, fadeOut), slideUp, localFrame: local }
}

export function getSegmentFrames(segments: Segment[], fps: number) {
  let cursor = 0
  return segments.map(seg => {
    const startFrame = cursor
    const durationFrames = Math.round(seg.duration * fps)
    cursor += durationFrames
    return { ...seg, startFrame, durationFrames }
  })
}
```

**CRITICAL RULES for all templates:**
- Import `useCurrentFrame`, `interpolate`, `Sequence`, `AbsoluteFill`, `Audio`, `Img` from `remotion`
- Use `getSegmentFrames()` to map segments → frame ranges
- Wrap each segment in `<Sequence from={startFrame} durationInFrames={durationFrames}>`
- Use `<Audio src={seg.audioUrl} />` when audioUrl exists
- Use `<Img src={seg.imageUrl} />` (Remotion Img, not HTML img)
- Minimum font sizes: body 32px, title 56px
- Export as named export matching the component name

**Implement each template with full working code:**

### NewsTemplate — dark broadcast style
- `#0a0a0a` background
- Full-bleed dimmed image (opacity 0.35) with dark gradient overlay on bottom 40%
- Text bottom-third: headline 64px bold white, subtitle 36px gray
- Red `#e53e3e` vertical bar (4px) left of headline
- Scrolling ticker bar at very bottom (CSS marquee via translateX animation)
- Headline slides up (40→0px), subtitle fades in 10 frames after headline
- Black flash (5 frames opacity 0→1→0) between segments

### EduTemplate — academic split layout
- White `#ffffff` background
- Left 55% text, right 45% image (rounded-xl, object-cover)
- Heading `#1a56db` blue 56px, body `#1e293b` 32px
- If text has multiple sentences: show each as bullet, one per 20 frames
- Top progress bar: width = (currentFrame / totalFrames) × 100%
- Chapter label top-left: "Phần N / Total"

### PodcastTemplate — dark moody
- `#18181b` background, `#a855f7` purple accent
- Large circle placeholder icon/avatar centered top half
- Text card center-bottom: rounded-xl `#27272a` bg
- Typewriter: reveal characters using `text.slice(0, interpolate(local, [0, durationFrames*0.7], [0, text.length]))`
- 8 waveform bars bottom: heights animated with `Math.sin(localFrame/5 + i) * 0.5 + 0.5`
- Show title persistent top

### TechTemplate — terminal aesthetic
- `#0d1117` background (GitHub dark)
- Terminal window frame: title bar with 3 colored dots, `font-family: 'Courier New', monospace`
- Text reveal: `text.slice(0, Math.floor(interpolate(local, [0, 30], [0, text.length])))`
- Blinking cursor `|` after last char: `opacity: local % 30 < 15 ? 1 : 0`
- Background: 20 columns of slowly falling small characters, opacity 0.04
- Colors: `#58a6ff` blue, `#3fb950` green, `#e6edf3` default

### StoryTemplate — cinematic 24fps
- Full-bleed image with Ken Burns: `scale: interpolate(local, [0, durationFrames], [1.0, 1.08])`
- Black letterbox top+bottom: 80px each (`#000000`)
- Text centered in middle zone: serif font, `#f5f0e8` cream, large `text-shadow`
- Fade to black between segments: last 12 frames opacity → 0
- Optional SVG `feTurbulence` grain overlay at opacity 0.03

### MinimalTemplate — ultra clean
- `#ffffff` background, `#171717` text
- Single centered text: `font-size: 64px, font-weight: 300`
- First word highlighted in `#2563eb`
- No images, no decoration
- Progress dots bottom center: ● filled = current, ○ = others
- Perfect fade: `opacity` only, no transform

### KidsTemplate — bright & bouncy
- Background cycles per segment: `['#fbbf24','#34d399','#60a5fa','#f472b6'][order % 4]`
- Single large text 900 weight 80px, white with thick text-shadow
- Emoji floats in from right: `translateX: interpolate(local, [0, 15], [200, 0])`
- Bounce: `scale: interpolate(local, [0, 10, 15], [0, 1.15, 1.0])`
- Polka dot SVG background (white circles, opacity 0.1)

### DocumentaryTemplate — professional broadcast 24fps
- Full-bleed image with slow pan: `translateX: interpolate(local, [0, durationFrames], ['-2%', '2%'])`
- Lower-third: dark `rgba(0,0,0,0.8)` strip slides up from bottom (20 frames)
  - Main text white 40px
  - Sub-label `#f59e0b` amber 26px (location/source)
- Vignette: `box-shadow: inset 0 0 200px rgba(0,0,0,0.6)` on overlay div

### SocialTemplate — 9:16 vertical (1080×1920)
- Full-bleed vertical image
- Caption center-bottom: white 72px, `text-shadow: 0 2px 8px rgba(0,0,0,0.9)`
- Words pop in one by one: stagger 4 frames each, `scale: 0.5→1.0`
- Emoji rises from bottom every 60 frames: `translateY: 200→-100`
- Hashtag strip at very bottom: `#999` 28px
- Gradient color bar top: 8px height, bright accent

### WhiteboardTemplate — hand-drawn feel
- `#fafaf9` cream background
- `font-family: 'Courier New'` or hand-writing feel
- SVG underline draws in under key phrase: `stroke-dashoffset: len→0` over 20 frames
- Main text `#1c1917` 52px, highlights `#2563eb` blue
- Simple SVG divider line draws between segments
- No images

**`src/remotion/templates/index.ts`:**
```ts
import type { TemplateConfig } from '@/types'

export { NewsTemplate }        from './NewsTemplate'
export { EduTemplate }         from './EduTemplate'
export { PodcastTemplate }     from './PodcastTemplate'
export { TechTemplate }        from './TechTemplate'
export { StoryTemplate }       from './StoryTemplate'
export { MinimalTemplate }     from './MinimalTemplate'
export { KidsTemplate }        from './KidsTemplate'
export { DocumentaryTemplate } from './DocumentaryTemplate'
export { SocialTemplate }      from './SocialTemplate'
export { WhiteboardTemplate }  from './WhiteboardTemplate'

export const TEMPLATES: TemplateConfig[] = [
  { id: 'news',        name: 'News Broadcast',  description: 'Phong cách bản tin TV chuyên nghiệp', aspect: '16:9', fps: 30, width: 1920, height: 1080, thumbnail: '📺', tags: ['news', 'tin tức'] },
  { id: 'edu',         name: 'Educational',      description: 'Slide giáo dục rõ ràng, học thuật',  aspect: '16:9', fps: 30, width: 1920, height: 1080, thumbnail: '📚', tags: ['education', 'giáo dục'] },
  { id: 'podcast',     name: 'Podcast Visual',   description: 'Dành cho podcast có hình ảnh',       aspect: '16:9', fps: 30, width: 1920, height: 1080, thumbnail: '🎙️', tags: ['podcast'] },
  { id: 'tech',        name: 'Tech & Code',      description: 'Kiến thức lập trình, công nghệ',     aspect: '16:9', fps: 30, width: 1920, height: 1080, thumbnail: '💻', tags: ['tech', 'code'] },
  { id: 'story',       name: 'Story / Film',     description: 'Kể chuyện phong cách điện ảnh',      aspect: '16:9', fps: 24, width: 1920, height: 1080, thumbnail: '🎬', tags: ['story', 'film'] },
  { id: 'minimal',     name: 'Minimal',          description: 'Tối giản, tập trung vào chữ',        aspect: '16:9', fps: 30, width: 1920, height: 1080, thumbnail: '⬜', tags: ['minimal'] },
  { id: 'kids',        name: 'Kids & Fun',       description: 'Màu sắc vui nhộn cho trẻ em',        aspect: '16:9', fps: 30, width: 1920, height: 1080, thumbnail: '🌈', tags: ['kids'] },
  { id: 'documentary', name: 'Documentary',      description: 'Phim tài liệu chuyên nghiệp',        aspect: '16:9', fps: 24, width: 1920, height: 1080, thumbnail: '🎥', tags: ['documentary'] },
  { id: 'social',      name: 'Social / Reels',   description: 'Dọc 9:16 cho TikTok, Reels, Shorts', aspect: '9:16', fps: 30, width: 1080, height: 1920, thumbnail: '📱', tags: ['tiktok', 'reels'] },
  { id: 'whiteboard',  name: 'Whiteboard',       description: 'Hoạt hình bảng trắng vẽ tay',        aspect: '16:9', fps: 30, width: 1920, height: 1080, thumbnail: '✏️', tags: ['whiteboard'] },
]
```

**`src/remotion/Root.tsx`:**
```tsx
import { Composition } from 'remotion'
import { TEMPLATES, NewsTemplate, EduTemplate, PodcastTemplate, TechTemplate,
         StoryTemplate, MinimalTemplate, KidsTemplate, DocumentaryTemplate,
         SocialTemplate, WhiteboardTemplate } from './templates'

const COMPONENTS: Record<string, React.FC<any>> = {
  news: NewsTemplate, edu: EduTemplate, podcast: PodcastTemplate,
  tech: TechTemplate, story: StoryTemplate, minimal: MinimalTemplate,
  kids: KidsTemplate, documentary: DocumentaryTemplate,
  social: SocialTemplate, whiteboard: WhiteboardTemplate,
}

export const RemotionRoot = () => (
  <>
    {TEMPLATES.map(t => (
      <Composition
        key={t.id} id={t.id} component={COMPONENTS[t.id]}
        durationInFrames={300} fps={t.fps} width={t.width} height={t.height}
        defaultProps={{ segments: [], template: t.id }}
      />
    ))}
  </>
)
```

---

## SUBAGENT_FRONTEND_PAGES

**Task:** Build all pages and components.

### Landing page `src/app/page.tsx`

Max-w-3xl centered layout. Sections:
1. Hero heading + subtitle
2. Radio toggle: Transcript / Idea
3. Textarea (min-h-48, placeholder varies by type)
4. Language selector: 🇻🇳 Tiếng Việt / 🇬🇧 English  
5. Template grid (see below)
6. VoiceSelector component (compact, below templates)
7. Submit button → POST /api/create → loading → redirect /verify/[jobId]

**Template grid:** 5 cols desktop / 2 cols mobile. Each card: emoji (40px), name bold, description small, aspect badge pill. Selected: `ring-2 ring-blue-500 bg-blue-50`.

### `src/components/VoiceSelector.tsx`
```tsx
// Props: provider, voiceId, onChange(provider, voiceId)
//
// 3 provider buttons: 🇻🇳 Vbee | ElevenLabs | Edge (free)
//
// When Vbee selected:
//   <select> with <optgroup label="Giọng miền Bắc/Trung/Nam">
//   Each <option value={v.id}>{v.name} ({v.gender})</option>
//   Import VBEE_VOICES from '@/lib/tts'
//
// When ElevenLabs selected:
//   Text input for voice ID
//   Small link: "Xem danh sách giọng" → elevenlabs.io/voices
//
// When Edge selected:
//   Info text: "Sẽ dùng vi-VN-HoaiMyNeural (Tiếng Việt) hoặc en-US-JennyNeural (English)"
```

### Verify page `src/app/verify/[jobId]/page.tsx`

Grid: `grid-cols-[280px_1fr_320px]` full viewport height (`h-screen overflow-hidden`).

**Left — SegmentList (scrollable):**
- Fetch job on mount via GET /api/job/[id]
- Cards: `#N` badge, text preview 60 chars, duration pill
- Click → set selectedId, call Player.seekTo(segment.startTime)
- Drag reorder via @dnd-kit/sortable → optimistic update → PATCH each affected segment order
- Add segment button (bottom), delete on hover (trash icon)
- `data-testid="segment-list"` and `data-testid="segment-item"` on each card

**Center — VideoPreview:**
- `<Player>` from @remotion/player
- Props: component, inputProps={segments, template: job.template}, style fill container
- Template switcher: row of emoji buttons above player, clicking updates job.template (PATCH /api/job/[id])

**Right — EditPanel (`data-testid="edit-panel"`):**
- Empty state when nothing selected
- Segment selected:
  - Textarea `data-testid="segment-text"` → text, auto-save onBlur → PATCH
  - Input → subtitle, auto-save onBlur
  - Image preview + "Đổi ảnh" button
  - **TTS section:**
    - VoiceSelector (provider + voiceId for this segment)
    - "Tạo giọng đọc" → POST /api/tts → show `<audio controls>` on success
    - If audioUrl: show player + "Tạo lại"
  - Duration estimate

**Bottom bar (sticky):**
- Segment count, total duration
- "Render Video" → POST /api/render → redirect /render/[jobId]

### Render page `src/app/render/[jobId]/page.tsx`

- Poll GET /api/job/[id] every 2s
- Show step progress: Chuẩn bị → Tạo giọng → Lấy hình → Render → Xong
- When DONE: `<video controls src={outputUrl}>` + download link + "Tạo video mới"
- When ERROR: show errorMessage + retry button

---

## SUBAGENT_REMOTION_RENDERER

**Task:** Server-side render pipeline.

**`src/lib/renderer.ts`:**
```ts
import { bundle } from '@remotion/bundler'
import { renderMedia, selectComposition } from '@remotion/renderer'
import path from 'path'
import fs from 'fs'
import { TEMPLATES } from '@/remotion/templates'
import type { Job } from '@/types'

let bundleCache: string | null = null

export async function renderVideo(job: Job): Promise<string> {
  const outputDir  = path.join(process.cwd(), 'public', 'outputs')
  fs.mkdirSync(outputDir, { recursive: true })
  const outputPath = path.join(outputDir, `${job.id}.mp4`)

  if (!bundleCache) {
    bundleCache = await bundle({
      entryPoint: path.join(process.cwd(), 'src', 'remotion', 'index.ts'),
      webpackOverride: c => c,
    })
  }

  const template    = TEMPLATES.find(t => t.id === job.template)!
  const totalFrames = Math.max(30, Math.ceil(
    job.segments.reduce((s, seg) => s + seg.duration, 0) * template.fps
  ))

  const composition = await selectComposition({
    serveUrl: bundleCache, id: job.template,
    inputProps: { segments: job.segments, template: job.template },
  })

  await renderMedia({
    composition: { ...composition, durationInFrames: totalFrames },
    serveUrl: bundleCache, codec: 'h264', outputLocation: outputPath,
    inputProps: { segments: job.segments, template: job.template },
    concurrency: 2,
    onProgress: ({ progress }) => process.stdout.write(`\r[Render] ${Math.round(progress * 100)}%`),
  })

  console.log(`\n[Render] Complete: ${outputPath}`)
  return `/outputs/${job.id}.mp4`
}
```

---

## SUBAGENT_API_INTEGRATION

**Task:** Wire everything together. Verify all flows.

**Flows to verify end-to-end:**

1. **Transcript flow:** POST /api/create {type:'transcript'} → 200, segments → GET /api/job/:id → PATCH segment → POST /api/tts → audioUrl → POST /api/render → poll DONE → outputUrl present

2. **Idea flow:** POST /api/create {type:'idea'} → Claude API called → segments created → same render flow

3. **Vbee flow:** POST /api/tts {provider:'vbee', voiceId:'hn_female_ngochuyen_full_48k-fhg'} → audioUrl saved to segment DB

4. **Cache hit:** POST /api/tts same text+provider+voice twice → second returns instantly (no external API call made)

5. **Fallback flow:** POST /api/tts {provider:'vbee'} with VBEE keys missing → falls back to edge-tts → returns audioUrl without crash

**Global error handling:**
- All routes: try/catch → `{ error: string }` with 4xx/5xx
- Frontend: toast div top-right, auto-dismiss 4s
- Queue worker: 3 retries, then status='ERROR' + errorMessage

---

## SUBAGENT_TESTS

**Task:** Write all tests. Fix failures. Repeat until 100% green.

### `tests/unit/parser.test.ts`
```ts
import { describe, it, expect } from 'vitest'
import { parseTranscript } from '@/lib/parser'

describe('parseTranscript', () => {
  it('splits short transcript', () => {
    const segs = parseTranscript('Hello world. This is second. Third here.', 'en')
    expect(segs.length).toBe(3)
    expect(segs[0].order).toBe(0)
    expect(segs[0].startTime).toBe(0)
  })
  it('assigns increasing startTime', () => {
    const segs = parseTranscript('First sentence. Second sentence. Third.', 'en')
    expect(segs[1].startTime).toBeGreaterThan(0)
    expect(segs[2].startTime).toBeGreaterThan(segs[1].startTime)
  })
  it('enforces min duration 2s', () => {
    const segs = parseTranscript('Hi.', 'en')
    expect(segs[0].duration).toBeGreaterThanOrEqual(2)
  })
  it('enforces max duration 8s per segment', () => {
    const long = Array(200).fill('word').join(' ') + '.'
    const segs = parseTranscript(long, 'en')
    segs.forEach(s => expect(s.duration).toBeLessThanOrEqual(8))
  })
  it('throws on empty input', () => {
    expect(() => parseTranscript('')).toThrow()
  })
  it('handles Vietnamese', () => {
    const segs = parseTranscript('Xin chào. Đây là câu thứ hai.', 'vi')
    expect(segs.length).toBe(2)
  })
})
```

### `tests/unit/tts.test.ts`
```ts
import { describe, it, expect } from 'vitest'
import { VBEE_VOICES, DEFAULT_VBEE_VOICE, buildCacheKey } from '@/lib/tts'

describe('VBEE_VOICES', () => {
  it('has 11 voices', () => expect(VBEE_VOICES).toHaveLength(11))
  it('covers all 3 regions', () => {
    const regions = new Set(VBEE_VOICES.map(v => v.region))
    expect(regions).toContain('Bắc')
    expect(regions).toContain('Trung')
    expect(regions).toContain('Nam')
  })
  it('default voice is in list', () => {
    expect(VBEE_VOICES.find(v => v.id === DEFAULT_VBEE_VOICE)).toBeDefined()
  })
  it('all voices have required fields', () => {
    VBEE_VOICES.forEach(v => {
      expect(v.id).toBeTruthy()
      expect(v.name).toBeTruthy()
      expect(['Bắc','Trung','Nam']).toContain(v.region)
      expect(['Nữ','Nam']).toContain(v.gender)
    })
  })
  it('cache key differs for different providers', () => {
    const k1 = buildCacheKey('hello', 'vbee', 'voice1')
    const k2 = buildCacheKey('hello', 'elevenlabs', 'voice1')
    expect(k1).not.toBe(k2)
  })
  it('cache key same for identical input', () => {
    const k1 = buildCacheKey('hello', 'vbee', 'voice1')
    const k2 = buildCacheKey('hello', 'vbee', 'voice1')
    expect(k1).toBe(k2)
  })
})
```

### `tests/unit/templates.test.ts`
```ts
import { describe, it, expect } from 'vitest'
import { TEMPLATES } from '@/remotion/templates'

describe('TEMPLATES', () => {
  it('exports exactly 10 templates', () => expect(TEMPLATES).toHaveLength(10))
  it('each has required fields', () => {
    TEMPLATES.forEach(t => {
      expect(t.id).toBeTruthy()
      expect(t.width).toBeGreaterThan(0)
      expect(t.height).toBeGreaterThan(0)
      expect(t.fps).toBeGreaterThan(0)
      expect(t.thumbnail).toBeTruthy()
    })
  })
  it('social is 9:16 vertical', () => {
    const s = TEMPLATES.find(t => t.id === 'social')!
    expect(s.width).toBe(1080)
    expect(s.height).toBe(1920)
  })
  it('story and documentary are 24fps', () => {
    expect(TEMPLATES.find(t => t.id === 'story')!.fps).toBe(24)
    expect(TEMPLATES.find(t => t.id === 'documentary')!.fps).toBe(24)
  })
  it('all IDs are unique', () => {
    const ids = TEMPLATES.map(t => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
```

### `tests/e2e/create-from-transcript.spec.ts`
```ts
import { test, expect } from '@playwright/test'

test('create video from transcript', async ({ page }) => {
  await page.goto('/')
  await page.click('text=Transcript')
  await page.fill('textarea', 'Xin chào. Đây là video đầu tiên. Chúng ta sẽ học về AI.')
  await page.click('[data-template="news"]')
  await page.click('button:has-text("Tạo Video")')
  await expect(page).toHaveURL(/\/verify\//, { timeout: 15000 })
  await expect(page.locator('[data-testid="segment-list"]')).toBeVisible()
  await expect(page.locator('[data-testid="segment-item"]')).toHaveCount(3, { timeout: 5000 })
})
```

### `tests/e2e/create-from-idea.spec.ts`
```ts
import { test, expect } from '@playwright/test'

test('create video from idea via LLM', async ({ page }) => {
  await page.goto('/')
  await page.click('text=Idea')
  await page.fill('textarea', 'Giải thích về trí tuệ nhân tạo cho người mới bắt đầu')
  await page.click('[data-template="edu"]')
  await page.click('button:has-text("Tạo Video")')
  await expect(page).toHaveURL(/\/verify\//, { timeout: 30000 })
  const items = page.locator('[data-testid="segment-item"]')
  await expect(items.first()).toBeVisible({ timeout: 10000 })
  expect(await items.count()).toBeGreaterThan(2)
})
```

### `tests/e2e/verify-edit.spec.ts`
```ts
import { test, expect } from '@playwright/test'

test('edit segment text and trigger render', async ({ page, request }) => {
  const res = await request.post('/api/create', {
    data: { type: 'transcript', content: 'First sentence. Second sentence.', language: 'vi', template: 'minimal' },
  })
  const { jobId } = await res.json()

  await page.goto(`/verify/${jobId}`)
  await page.locator('[data-testid="segment-item"]').first().click()
  await expect(page.locator('[data-testid="edit-panel"]')).toBeVisible()

  const textarea = page.locator('[data-testid="segment-text"]')
  await textarea.fill('Câu đã được chỉnh sửa.')
  await textarea.blur()

  await expect(page.locator('[data-testid="segment-item"]').first())
    .toContainText('Câu đã được chỉnh sửa', { timeout: 3000 })

  await page.click('button:has-text("Render Video")')
  await expect(page).toHaveURL(/\/render\//, { timeout: 10000 })
})
```

**Run commands:**
```bash
npx vitest run
npx playwright test
```

**Rule:** Never modify tests to force-pass. Fix the source code.

---

## FINAL CHECKLIST (Orchestrator verifies before declaring done)

- [ ] `npm run dev` starts with zero TypeScript errors
- [ ] Landing: all 10 template cards visible, Vbee voice dropdown grouped by region
- [ ] Transcript flow: input → verify page with correct segment count
- [ ] Idea flow: Claude called → meaningful segments generated
- [ ] TTS: Vbee voices show Bắc / Trung / Nam grouping in UI
- [ ] TTS cache: second call for same text+provider+voice returns instantly (logged)
- [ ] TTS fallback: works with no API keys set (Edge TTS)
- [ ] Segment edit: text change → auto-saves on blur → updates in list
- [ ] Remotion Player: live preview in verify page
- [ ] All 10 templates: render without React errors in Player
- [ ] Render job: completes → /render page shows Done
- [ ] Output MP4: downloadable and playable
- [ ] `npx vitest run` → ✅ all pass
- [ ] `npx playwright test` → ✅ all pass
- [ ] `npx tsc --noEmit` → zero errors
- [ ] No console errors in browser DevTools

---

## ENVIRONMENT NOTES

| Variable | Required? | Effect if missing |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes (Idea flow) | Idea flow fails gracefully |
| `VBEE_APP_ID` + `VBEE_API_KEY` | Recommended | Falls back to Edge TTS |
| `ELEVENLABS_API_KEY` | Optional | Falls back to Edge TTS |
| `UNSPLASH_ACCESS_KEY` | Optional | Uses placeholder stock images |
| `REDIS_URL` | Optional | Renders in-process (dev mode) |

App runs in demo mode with only `ANTHROPIC_API_KEY` + `VBEE_APP_ID` + `VBEE_API_KEY`.

---

## START COMMAND

```bash
npm run dev
# Open http://localhost:3000
```

**Orchestrator: Begin now. Spawn Phase 1 agents in parallel.**
