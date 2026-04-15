# AGENTS.md — video-gen

## Cấu trúc dự án

```
video-gen/
├── src/
│   ├── app/
│   │   ├── page.tsx                        # Trang chủ — form nhập nội dung, chọn template/TTS
│   │   ├── layout.tsx                      # Root layout
│   │   ├── globals.css
│   │   ├── render/[jobId]/page.tsx         # Trang render — hiển thị tiến trình render video
│   │   ├── verify/[jobId]/page.tsx         # Trang verify — xem trước và xác nhận segments
│   │   └── api/
│   │       ├── create/route.ts             # POST — tạo Job, gọi Claude để parse script thành segments
│   │       ├── render/route.ts             # POST — đẩy job vào BullMQ queue để render
│   │       ├── job/[id]/route.ts           # GET  — lấy trạng thái Job theo id
│   │       ├── segment/[id]/route.ts       # PATCH — cập nhật segment (text, subtitle, imageUrl...)
│   │       └── tts/route.ts               # POST — generate audio từ text qua TTS provider
│   ├── components/
│   │   ├── ProgressBar.tsx                 # UI hiển thị tiến trình render
│   │   └── VoiceSelector.tsx              # UI chọn giọng đọc theo provider
│   ├── lib/
│   │   ├── anthropic.ts                    # Wrapper gọi Claude API (với prompt caching)
│   │   ├── db.ts                           # Prisma client singleton
│   │   ├── parser.ts                       # Parse response Claude thành Segment[]
│   │   ├── queue.ts                        # BullMQ queue setup + worker render video
│   │   ├── renderer.ts                     # Gọi Remotion bundler + renderMedia
│   │   ├── tts.ts                          # Gọi TTS provider (Vbee / ElevenLabs / Edge)
│   │   ├── unsplash.ts                     # Fetch ảnh từ Unsplash API
│   │   └── voices.ts                       # Danh sách giọng đọc theo provider
│   ├── remotion/
│   │   ├── Root.tsx                        # Remotion root — đăng ký các Composition
│   │   ├── index.ts                        # Entry point cho Remotion bundler
│   │   ├── helpers.ts                      # Hàm tiện ích cho template (timing, subtitle...)
│   │   └── templates/
│   │       ├── index.ts                    # Export tất cả template + TemplateConfig[]
│   │       ├── NewsTemplate.tsx
│   │       ├── EduTemplate.tsx
│   │       ├── PodcastTemplate.tsx
│   │       ├── TechTemplate.tsx
│   │       ├── StoryTemplate.tsx
│   │       ├── MinimalTemplate.tsx
│   │       ├── KidsTemplate.tsx
│   │       ├── DocumentaryTemplate.tsx
│   │       ├── SocialTemplate.tsx
│   │       └── WhiteboardTemplate.tsx
│   └── types/
│       └── index.ts                        # Tất cả TypeScript types: Job, Segment, TemplateId, TTSProvider...
├── prisma/
│   └── schema.prisma                       # SQLite — model Job (DRAFT/RENDERING/DONE/ERROR) + Segment
├── public/
├── CLAUDE.md                               # Workflow, conventions, hướng dẫn cho agent
├── AGENTS.md                               # File này — cấu trúc dự án + mô tả subagent
├── package.json
├── next.config.ts
├── remotion.config.ts
├── playwright.config.ts
└── vitest.config.ts
```

---

## Stack chính

| Layer | Công nghệ |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind CSS 4 |
| Video | Remotion 4 (render + player) |
| AI | Anthropic Claude SDK (`@anthropic-ai/sdk`) |
| Database | Prisma 7 + SQLite |
| Queue | BullMQ + ioredis (Redis) |
| TTS | Vbee / ElevenLabs / Edge TTS |
| Ảnh | Unsplash API |
| Unit Test | Vitest |
| E2E Test | Playwright |

---

## Data flow

```
User nhập script
    → POST /api/create       → Claude parse → Segment[] lưu DB
    → Trang verify/[jobId]   → User xem trước, chỉnh sửa segments
    → POST /api/render       → BullMQ enqueue job
    → Worker (queue.ts)      → TTS + Unsplash + Remotion render → outputUrl
    → Trang render/[jobId]   → Polling status, hiển thị kết quả
```

---

## Subagents

### 1. Coder Agent

**Gọi bằng:** *"Với vai trò Coder Agent, hãy..."*

**Nhiệm vụ:** Implement tính năng mới, thêm template, mở rộng API.

**Nguyên tắc:**
- Đọc `src/types/index.ts` trước khi tạo bất kỳ type mới nào
- Đọc `prisma/schema.prisma` trước khi thay đổi data model
- Template mới phải implement đúng interface `VideoProps` (`src/types/index.ts`) và đăng ký trong `src/remotion/templates/index.ts` + `src/remotion/Root.tsx`
- API route mới đặt trong `src/app/api/`, dùng Zod để validate input
- Dùng Prisma client từ `src/lib/db.ts` (singleton), không tạo instance mới
- Dùng prompt caching khi gọi Claude (xem `src/lib/anthropic.ts` làm mẫu)
- Sau khi code xong: chạy `npm run lint` và `npx tsc --noEmit`

**Files hay đụng:**
- `src/remotion/templates/` — thêm template
- `src/app/api/` — thêm/sửa API
- `src/lib/` — thêm logic
- `src/types/index.ts` — thêm type

---

### 2. Fixer Agent

**Gọi bằng:** *"Với vai trò Fixer Agent, hãy..."*

**Nhiệm vụ:** Debug lỗi, fix bug, kiểm tra type safety và code quality.

**Nguyên tắc:**
- Luôn đọc file lỗi trước khi sửa, không đoán
- Chạy `npx tsc --noEmit` để xác nhận lỗi TypeScript trước và sau khi fix
- Chạy `npm run lint` để kiểm tra ESLint
- Với lỗi BullMQ/Redis: kiểm tra `src/lib/queue.ts`, đảm bảo worker idempotent
- Với lỗi Remotion: kiểm tra `src/remotion/Root.tsx` và composition registration
- Với lỗi Prisma: kiểm tra migration và đồng bộ schema
- Không sửa nhiều hơn phạm vi bug được yêu cầu
- Sau khi fix: chạy test liên quan để xác nhận không regression

**Checklist khi fix:**
1. Xác định root cause (không fix symptom)
2. Sửa đúng file, đúng dòng
3. Chạy `npx tsc --noEmit` + `npm run lint`
4. Chạy test liên quan

---

### 3. Tester Agent

**Gọi bằng:** *"Với vai trò Tester Agent, hãy..."*

**Nhiệm vụ:** Viết và chạy test, báo cáo coverage, phát hiện regression.

**Nguyên tắc:**
- Unit test dùng **Vitest** (`vitest.config.ts`) — test các hàm trong `src/lib/`
- E2E test dùng **Playwright** (`playwright.config.ts`) — test flow UI end-to-end
- Test file đặt cạnh file được test hoặc trong thư mục `__tests__/`
- Không mock database trong integration test — dùng SQLite test DB riêng
- Mỗi test phải độc lập, không phụ thuộc thứ tự chạy
- Sau khi viết test: chạy `npx vitest run` hoặc `npx playwright test`
- Báo cáo: số test pass/fail, file nào chưa có test

**Ưu tiên test:**
1. `src/lib/parser.ts` — parse Claude response
2. `src/lib/tts.ts` — TTS provider logic
3. `src/app/api/` — API routes
4. E2E: flow tạo job → verify → render
