import { Composition } from 'remotion'
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
} from './templates'

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
