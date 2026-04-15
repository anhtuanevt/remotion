import { z } from 'zod'
import { db } from '@/lib/db'
import { callLLM } from '@/lib/anthropic'
import { TEMPLATES } from '@/lib/template-config'

const Body = z.object({
  jobId:   z.string(),
  message: z.string().min(1).max(2000),
})

export async function POST(req: Request) {
  try {
    const { jobId, message } = Body.parse(await req.json())

    const job = await db.job.findUnique({
      where: { id: jobId },
      include: { segments: { orderBy: { order: 'asc' } } },
    })
    if (!job) return Response.json({ error: 'Job not found' }, { status: 404 })

    const currentTemplate = TEMPLATES.find(t => t.id === job.template)
    const segmentSummary  = job.segments.map((s, i) =>
      `Segment ${i + 1} (id: ${s.id}): "${s.text.slice(0, 80)}${s.text.length > 80 ? '…' : ''}"`
    ).join('\n')

    const templateList = TEMPLATES
      .map(t => `- ${t.id}: ${t.name} — ${t.description}`)
      .join('\n')

    const raw = await callLLM(`You are an AI assistant helping edit a video project. Interpret the user's request and return a structured action.

Current video info:
- Template: ${job.template} (${currentTemplate?.name ?? ''})
- Segments: ${job.segments.length}
${segmentSummary}

Available templates:
${templateList}

User request: "${message}"

Respond using EXACTLY this format:
ACTION: <one of: change_template | update_segment | reply>
DATA: <see below>
REPLY: <short Vietnamese confirmation message to show the user>

ACTION formats:
- change_template → DATA: <template_id>
- update_segment  → DATA: <segment_id>|<new text>
- reply           → DATA: (empty)

Rules:
- If user wants to change visual style/effect/template → use change_template
- If user wants to edit segment content/text → use update_segment
- If user asks a question or request is unclear → use reply
- REPLY must always be in Vietnamese and friendly
- For change_template: pick the most fitting template based on the request`)

    const actionMatch  = raw.match(/^ACTION:\s*(\S+)/m)
    const dataMatch    = raw.match(/^DATA:\s*(.+)/m)
    const replyMatch   = raw.match(/^REPLY:\s*(.+)/m)

    const action = actionMatch?.[1]?.trim() ?? 'reply'
    const data   = dataMatch?.[1]?.trim()   ?? ''
    const reply  = replyMatch?.[1]?.trim()  ?? 'Đã xử lý yêu cầu của bạn.'

    if (action === 'change_template' && data) {
      const templateId = data.toLowerCase()
      const valid = TEMPLATES.find(t => t.id === templateId)
      if (valid) {
        await db.job.update({ where: { id: jobId }, data: { template: templateId } })
        return Response.json({ action: 'change_template', template: templateId, reply })
      }
    }

    if (action === 'update_segment' && data.includes('|')) {
      const [segId, ...rest] = data.split('|')
      const newText = rest.join('|').trim()
      const seg = job.segments.find(s => s.id === segId.trim())
      if (seg && newText) {
        await db.segment.update({
          where: { id: seg.id },
          data: { text: newText, audioUrl: null, audioCacheKey: null },
        })
        return Response.json({ action: 'update_segment', segmentId: seg.id, text: newText, reply })
      }
    }

    return Response.json({ action: 'reply', reply })
  } catch (err: any) {
    console.error('[/api/chat]', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
