export type TemplateId =
  | 'news' | 'edu' | 'podcast' | 'tech' | 'story'
  | 'minimal' | 'kids' | 'documentary' | 'social' | 'whiteboard'
  | 'reels' | 'stories' | 'karaoke' | 'neon' | 'breaking'
  | 'quote' | 'datastats' | 'lesson'
  | 'magazine' | 'countdown' | 'chat' | 'headline' | 'retro'
  | 'splitv' | 'gradient' | 'meme' | 'redacted' | 'sports'
  | 'tiktokcaption' | 'hook' | 'wordpop'
  | 'dynamic' | 'chatbubble'
  | 'particletext' | 'matrixrain' | 'galaxy'

export type TTSProvider = 'vbee' | 'elevenlabs' | 'edge'

// ─── MotionSpec — AI-generated visual config for DynamicTemplate ──────────────

export interface MotionSpec {
  // Background
  bgType:     'solid' | 'gradient' | 'dark-gradient' | 'image-blur'
  bgColor:    string   // hex, e.g. "#1a1a2e"
  bgColor2:   string   // second color for gradients

  // Typography
  fontFamily: 'sans' | 'mono' | 'serif' | 'display'
  fontSize:   'sm' | 'md' | 'lg' | 'xl'
  textColor:  string
  textAlign:  'left' | 'center' | 'right'

  // Text animation
  textAnim:   'fade' | 'slide-up' | 'slide-left' | 'zoom' | 'typewriter' | 'word-pop' | 'glitch'
  animSpeed:  'slow' | 'normal' | 'fast'

  // Accent / highlight
  accentColor: string
  accentStyle: 'none' | 'underline' | 'highlight' | 'pill' | 'border-left'

  // Transition between segments
  transition: 'cut' | 'fade' | 'slide' | 'zoom-in'

  // Overlay effect
  overlay: 'none' | 'vignette' | 'scanlines' | 'grain'

  // Music
  musicUrl:    string | null
  musicVolume: number   // 0–1
}

export const DEFAULT_MOTION_SPEC: MotionSpec = {
  bgType:      'gradient',
  bgColor:     '#1a1a2e',
  bgColor2:    '#0f3460',
  fontFamily:  'sans',
  fontSize:    'lg',
  textColor:   '#ffffff',
  textAlign:   'center',
  textAnim:    'slide-up',
  animSpeed:   'normal',
  accentColor: '#e94560',
  accentStyle: 'underline',
  transition:  'fade',
  overlay:     'vignette',
  musicUrl:    null,
  musicVolume: 0.3,
}

// ─── Core types ────────────────────────────────────────────────────────────────

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
  motionSpec?: MotionSpec
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
  motionSpec?: MotionSpec
}
