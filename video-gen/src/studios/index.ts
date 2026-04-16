import type { MotionSpec, TemplateId } from '@/types'
import { DEFAULT_MOTION_SPEC } from '@/types'

// ─── Studio definition ────────────────────────────────────────────────────────

export interface StudioInput {
  topic: string
  language: string
  durationSec: number
  // Chat podcast fields
  speakerAName?: string
  speakerARole?: string
  speakerBName?: string
  speakerBRole?: string
  // Educational fields
  targetAudience?: string
}

export interface Studio {
  id:           string
  name:         string
  icon:         string
  tagline:      string
  description:  string
  gradient:     string   // Tailwind gradient classes
  templateId:   TemplateId
  defaultMotionSpec: MotionSpec
  inputFields:  Array<'topic' | 'duration' | 'language' | 'speakers' | 'audience'>
  exampleTopics: string[]
}

// ─── Studio registry ──────────────────────────────────────────────────────────

export const STUDIOS: Studio[] = [
  {
    id:          'viral-short',
    name:        'Viral Short',
    icon:        '⚡',
    tagline:     'TikTok · Reels · Shorts',
    description: 'Hook mạnh ngay giây đầu, nhịp cắt nhanh, giữ người xem đến hết',
    gradient:    'from-orange-500 to-red-600',
    templateId:  'dynamic',
    inputFields: ['topic', 'duration', 'language'],
    exampleTopics: [
      '5 sự thật về não người khiến bạn sốc',
      'Tại sao người giàu thức dậy lúc 5 giờ sáng',
      'Cách học 1 kỹ năng mới trong 20 giờ',
    ],
    defaultMotionSpec: {
      ...DEFAULT_MOTION_SPEC,
      bgType:      'dark-gradient',
      bgColor:     '#0D0D0D',
      bgColor2:    '#1A0520',
      textAnim:    'word-pop',
      animSpeed:   'fast',
      fontSize:    'xl',
      fontFamily:  'display',
      textColor:   '#FFFFFF',
      accentColor: '#FF3B5C',
      accentStyle: 'none',
      transition:  'cut',
      overlay:     'none',
      musicUrl:    null,
      musicVolume: 0.2,
    },
  },

  {
    id:          'chat-podcast',
    name:        'Chat Podcast',
    icon:        '💬',
    tagline:     'Hội thoại · Podcast · Interview',
    description: '2 người trò chuyện, bubble xuất hiện từng câu, tự nhiên như chat thật',
    gradient:    'from-blue-500 to-cyan-500',
    templateId:  'chatbubble',
    inputFields: ['topic', 'speakers', 'duration', 'language'],
    exampleTopics: [
      'Cách học tiếng Anh hiệu quả',
      'Startup và những thất bại không ai kể',
      'Gen Z vs Millennial: ai đúng hơn?',
    ],
    defaultMotionSpec: {
      ...DEFAULT_MOTION_SPEC,
      bgType:      'gradient',
      bgColor:     '#EFF6FF',
      bgColor2:    '#F0FDF4',
      textAnim:    'fade',
      animSpeed:   'normal',
      fontSize:    'md',
      fontFamily:  'sans',
      textColor:   '#111827',
      accentColor: '#2563EB',
      accentStyle: 'none',
      transition:  'fade',
      overlay:     'none',
      musicUrl:    null,
      musicVolume: 0.15,
    },
  },

  {
    id:          'educational',
    name:        'Educational',
    icon:        '📚',
    tagline:     'Giáo dục · Giải thích · How-to',
    description: 'Giải thích từng bước rõ ràng, animation slide mượt, phù hợp học online',
    gradient:    'from-emerald-500 to-teal-600',
    templateId:  'dynamic',
    inputFields: ['topic', 'audience', 'duration', 'language'],
    exampleTopics: [
      'Python cho người mới bắt đầu',
      'Cách đọc báo cáo tài chính',
      'Lịch sử Việt Nam qua 5 sự kiện',
    ],
    defaultMotionSpec: {
      ...DEFAULT_MOTION_SPEC,
      bgType:      'gradient',
      bgColor:     '#0F172A',
      bgColor2:    '#1E3A5F',
      textAnim:    'slide-up',
      animSpeed:   'slow',
      fontSize:    'lg',
      fontFamily:  'sans',
      textColor:   '#F1F5F9',
      accentColor: '#34D399',
      accentStyle: 'border-left',
      transition:  'fade',
      overlay:     'vignette',
      musicUrl:    null,
      musicVolume: 0.2,
    },
  },

  {
    id:          'cinematic',
    name:        'Cinematic',
    icon:        '🎬',
    tagline:     'Storytelling · Documentary · Film',
    description: 'Ảnh nền cinematic blur, fade mượt, typewriter, cảm giác phim tài liệu',
    gradient:    'from-gray-700 to-gray-900',
    templateId:  'dynamic',
    inputFields: ['topic', 'duration', 'language'],
    exampleTopics: [
      'Hành trình khởi nghiệp của tôi',
      'Câu chuyện về người bà nông dân',
      'Sài Gòn — thành phố không bao giờ ngủ',
    ],
    defaultMotionSpec: {
      ...DEFAULT_MOTION_SPEC,
      bgType:      'image-blur',
      bgColor:     '#0A0A0A',
      bgColor2:    '#1A1A1A',
      textAnim:    'typewriter',
      animSpeed:   'slow',
      fontSize:    'lg',
      fontFamily:  'serif',
      textColor:   '#F5F5F0',
      accentColor: '#D4AF37',
      accentStyle: 'underline',
      transition:  'fade',
      overlay:     'vignette',
      musicUrl:    null,
      musicVolume: 0.3,
    },
  },

  {
    id:          'custom',
    name:        'Custom',
    icon:        '✏️',
    tagline:     'Script · Mô tả tự do · Full control',
    description: 'Paste script sẵn hoặc mô tả chi tiết — AI chỉ parse, không viết lại',
    gradient:    'from-violet-500 to-purple-700',
    templateId:  'dynamic',
    inputFields: ['topic', 'duration', 'language'],
    exampleTopics: [
      'Paste script của bạn vào đây...',
      '5 bí quyết học ngoại ngữ.\nBí quyết 1: Nghe mỗi ngày 15 phút.\nBí quyết 2: Nói to khi đọc.',
      'Mô tả: video về khởi nghiệp. Style: dark cinematic, ảnh văn phòng startup, nhịp chậm.',
    ],
    defaultMotionSpec: {
      ...DEFAULT_MOTION_SPEC,
      bgType:      'image-blur',
      bgColor:     '#0A0A0A',
      bgColor2:    '#1A1A2E',
      textAnim:    'fade',
      animSpeed:   'normal',
      fontSize:    'lg',
      fontFamily:  'sans',
      textColor:   '#FFFFFF',
      accentColor: '#A78BFA',
      accentStyle: 'none',
      transition:  'fade',
      overlay:     'vignette',
      musicUrl:    null,
      musicVolume: 0.2,
    },
  },
]

export function getStudio(id: string): Studio | undefined {
  return STUDIOS.find(s => s.id === id)
}
