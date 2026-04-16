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
export { ReelsTemplate }       from './ReelsTemplate'
export { StoriesTemplate }     from './StoriesTemplate'
export { KaraokeTemplate }     from './KaraokeTemplate'
export { NeonTemplate }        from './NeonTemplate'
export { BreakingTemplate }    from './BreakingTemplate'
export { QuoteTemplate }       from './QuoteTemplate'
export { DataStatsTemplate }   from './DataStatsTemplate'
export { LessonTemplate }      from './LessonTemplate'
export { MagazineTemplate }    from './MagazineTemplate'
export { CountdownTemplate }   from './CountdownTemplate'
export { ChatTemplate }        from './ChatTemplate'
export { HeadlineTemplate }    from './HeadlineTemplate'
export { RetroTemplate }       from './RetroTemplate'
export { SplitVTemplate }      from './SplitVTemplate'
export { GradientTemplate }    from './GradientTemplate'
export { MemeTemplate }        from './MemeTemplate'
export { RedactedTemplate }    from './RedactedTemplate'
export { SportsTemplate }        from './SportsTemplate'
export { TikTokCaptionTemplate } from './TikTokCaptionTemplate'
export { HookTemplate }          from './HookTemplate'
export { WordPopTemplate }       from './WordPopTemplate'
export { DynamicTemplate }       from './DynamicTemplate'
export { ChatBubbleTemplate }    from './ChatBubbleTemplate'
export { ParticleTextTemplate }  from './ParticleTextTemplate'

export const TEMPLATES: TemplateConfig[] = [
  // ── 16:9 ngang ──────────────────────────────────────────────────────────────
  { id: 'news',        name: 'News Broadcast',  description: 'Bản tin TV chuyên nghiệp',         aspect: '16:9', fps: 30, width: 1920, height: 1080, thumbnail: '📺', tags: ['news'] },
  { id: 'edu',         name: 'Educational',      description: 'Slide giáo dục học thuật',          aspect: '16:9', fps: 30, width: 1920, height: 1080, thumbnail: '📚', tags: ['education'] },
  { id: 'podcast',     name: 'Podcast Visual',   description: 'Podcast có hình ảnh, typewriter',   aspect: '16:9', fps: 30, width: 1920, height: 1080, thumbnail: '🎙️', tags: ['podcast'] },
  { id: 'tech',        name: 'Tech & Code',      description: 'Terminal, lập trình, công nghệ',    aspect: '16:9', fps: 30, width: 1920, height: 1080, thumbnail: '💻', tags: ['tech'] },
  { id: 'story',       name: 'Story / Film',     description: 'Điện ảnh Ken Burns, letterbox',     aspect: '16:9', fps: 24, width: 1920, height: 1080, thumbnail: '🎬', tags: ['story'] },
  { id: 'minimal',     name: 'Minimal',          description: 'Tối giản, tập trung vào chữ',       aspect: '16:9', fps: 30, width: 1920, height: 1080, thumbnail: '⬜', tags: ['minimal'] },
  { id: 'kids',        name: 'Kids & Fun',       description: 'Màu sắc vui nhộn cho trẻ em',       aspect: '16:9', fps: 30, width: 1920, height: 1080, thumbnail: '🌈', tags: ['kids'] },
  { id: 'documentary', name: 'Documentary',      description: 'Phim tài liệu, pan chậm, vignette', aspect: '16:9', fps: 24, width: 1920, height: 1080, thumbnail: '🎥', tags: ['documentary'] },
  { id: 'whiteboard',  name: 'Whiteboard',       description: 'Bảng trắng vẽ tay, SVG underline', aspect: '16:9', fps: 30, width: 1920, height: 1080, thumbnail: '✏️', tags: ['whiteboard'] },
  // ── 9:16 dọc ────────────────────────────────────────────────────────────────
  { id: 'social',      name: 'Social / Reels',   description: 'TikTok / Reels — word pop-in',      aspect: '9:16', fps: 30, width: 1080, height: 1920, thumbnail: '📱', tags: ['tiktok', 'reels'] },
  { id: 'reels',       name: 'Reels Bold',       description: 'Bold text, accent stroke, viral',   aspect: '9:16', fps: 30, width: 1080, height: 1920, thumbnail: '🔥', tags: ['reels', 'tiktok'] },
  { id: 'stories',     name: 'Stories',          description: 'Instagram Stories, progress bar',   aspect: '9:16', fps: 30, width: 1080, height: 1920, thumbnail: '💫', tags: ['stories', 'instagram'] },
  { id: 'karaoke',     name: 'Karaoke',          description: 'Highlight từng từ theo nhạc',       aspect: '9:16', fps: 30, width: 1080, height: 1920, thumbnail: '🎵', tags: ['karaoke', 'music'] },
  { id: 'neon',        name: 'Neon Cyberpunk',   description: 'Neon glow, glitch, scan lines',     aspect: '9:16', fps: 30, width: 1080, height: 1920, thumbnail: '⚡', tags: ['neon', 'cyberpunk'] },
  { id: 'breaking',    name: 'Breaking News',    description: 'Breaking news dọc, ticker đỏ',      aspect: '9:16', fps: 30, width: 1080, height: 1920, thumbnail: '🚨', tags: ['news', 'breaking'] },
  { id: 'quote',       name: 'Quote Card',       description: 'Trích dẫn đẹp, serif font, thanh lịch', aspect: '9:16', fps: 30, width: 1080, height: 1920, thumbnail: '💬', tags: ['quote'] },
  { id: 'datastats',   name: 'Data & Stats',     description: 'Số liệu animated, counter, bar',    aspect: '9:16', fps: 30, width: 1080, height: 1920, thumbnail: '📊', tags: ['data', 'stats', 'news'] },
  { id: 'lesson',      name: 'Lesson Steps',     description: 'Từng bước học, step dots, giáo dục', aspect: '9:16', fps: 30, width: 1080, height: 1920, thumbnail: '🎓', tags: ['education', 'lesson'] },
  { id: 'magazine',   name: 'Magazine Cover',   description: 'Bìa tạp chí, ảnh full-bleed, barcode', aspect: '9:16', fps: 30, width: 1080, height: 1920, thumbnail: '📰', tags: ['magazine', 'news'] },
  { id: 'countdown',  name: 'Countdown',        description: 'Đếm ngược animated, ring SVG, sự kiện', aspect: '9:16', fps: 30, width: 1080, height: 1920, thumbnail: '⏱️', tags: ['countdown', 'event'] },
  { id: 'chat',       name: 'Chat Bubbles',     description: 'Hội thoại chat bubble, reveal từng câu', aspect: '9:16', fps: 30, width: 1080, height: 1920, thumbnail: '💭', tags: ['chat', 'conversation'] },
  { id: 'headline',   name: 'Newspaper',        description: 'Trang báo, masthead, rule lines', aspect: '9:16', fps: 30, width: 1080, height: 1920, thumbnail: '🗞️', tags: ['newspaper', 'news'] },
  { id: 'retro',      name: 'VHS Retro 80s',    description: 'VHS scan lines, neon, glitch, CRT', aspect: '9:16', fps: 30, width: 1080, height: 1920, thumbnail: '📼', tags: ['retro', 'vhs', '80s'] },
  { id: 'splitv',     name: 'Split Screen',     description: 'Màn hình đôi, ảnh trên / text dưới', aspect: '9:16', fps: 30, width: 1080, height: 1920, thumbnail: '⬛', tags: ['split', 'visual'] },
  { id: 'gradient',   name: 'Mesh Gradient',    description: 'Gradient mesh animated, frosted glass', aspect: '9:16', fps: 30, width: 1080, height: 1920, thumbnail: '🌈', tags: ['gradient', 'aesthetic'] },
  { id: 'meme',       name: 'Meme',             description: 'Impact font top/bottom, classic meme', aspect: '9:16', fps: 30, width: 1080, height: 1920, thumbnail: '😂', tags: ['meme', 'fun'] },
  { id: 'redacted',   name: 'Classified',       description: 'Tài liệu mật, thanh đen reveal, con dấu', aspect: '9:16', fps: 30, width: 1080, height: 1920, thumbnail: '🔒', tags: ['classified', 'news', 'military'] },
  { id: 'sports',       name: 'Sports Live',       description: 'Bảng tỉ số, score count-up, thể thao', aspect: '9:16', fps: 30, width: 1080, height: 1920, thumbnail: '⚽', tags: ['sports', 'score'] },
  // ── TikTok Viral ────────────────────────────────────────────────────────────
  { id: 'tiktokcaption', name: 'TikTok Caption',   description: 'Auto-caption vàng từng từ, viral TikTok', aspect: '9:16', fps: 30, width: 1080, height: 1920, thumbnail: '🎯', tags: ['tiktok', 'caption', 'viral'] },
  { id: 'hook',          name: 'Hook Viral',        description: 'Hook đầu dramatic, "watch till end"',     aspect: '9:16', fps: 30, width: 1080, height: 1920, thumbnail: '🔥', tags: ['tiktok', 'hook', 'viral'] },
  { id: 'wordpop',       name: 'Word Pop',          description: 'MrBeast style, từng từ bounce nhiều màu', aspect: '9:16', fps: 30, width: 1080, height: 1920, thumbnail: '💥', tags: ['tiktok', 'energy', 'viral'] },
  // ── Three.js 3D ────────────────────────────────────────────────────────────
  { id: 'particletext', name: 'Particle Text 3D', description: '3D particles + orbital ring, viral TikTok', aspect: '9:16', fps: 30, width: 1080, height: 1920, thumbnail: '✨', tags: ['threejs', '3d', 'viral', 'tiktok'] },
  // ── AI Dynamic ─────────────────────────────────────────────────────────────
  { id: 'dynamic',     name: 'AI Dynamic',      description: 'Template sinh bởi AI — hoàn toàn tuỳ chỉnh được',      aspect: '9:16', fps: 30, width: 1080, height: 1920, thumbnail: '✨', tags: ['ai', 'custom', 'dynamic'] },
  { id: 'chatbubble',  name: 'Chat Bubbles AI',  description: 'Hội thoại 2 người — AI parse từ messages[] JSON',       aspect: '9:16', fps: 30, width: 1080, height: 1920, thumbnail: '💬', tags: ['chat', 'conversation', 'ai'] },
]
