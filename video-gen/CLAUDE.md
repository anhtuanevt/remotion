@AGENTS.md

# CLAUDE.md — video-gen

## Quy tắc làm việc với project này

### Trước khi bắt đầu bất kỳ task nào

1. Đọc `AGENTS.md` để nắm cấu trúc project
2. Chỉ đọc các file **liên quan trực tiếp** đến task — không đọc toàn bộ `src/`
3. Với task phức tạp (nhiều file, nhiều bước): **chia task trước, code sau**

---

## Workflow chuẩn khi nhận yêu cầu

### Task đơn giản (1 file, 1 thay đổi nhỏ)
```
Đọc file → Sửa → Lint/Type check → Done
```

### Task phức tạp (nhiều file, nhiều bước)
```
1. Đọc các file liên quan
2. Liệt kê task con bằng TaskCreate
3. Xác định task nào độc lập, task nào phụ thuộc
4. Thực hiện theo thứ tự, mark TaskUpdate "completed" khi xong từng bước
5. Chạy lint + type check sau khi hoàn thành
```

**Template prompt cho task phức tạp:**
> Trước khi code, hãy:
> 1. Đọc các file liên quan
> 2. Tạo task list với TaskCreate
> 3. Thực hiện từng task, mark completed khi xong
> 4. Chạy `npm run lint` và `npx tsc --noEmit` sau khi hoàn thành

---

## Tiết kiệm token

### Nguyên tắc đọc file
- Chỉ đọc file **cần thiết** — không đọc `node_modules`, không đọc toàn bộ `src/`
- Dùng Grep/Glob để tìm đúng file trước khi Read
- Nếu chỉ cần 1 function, đọc đúng line range thay vì cả file

### Nguyên tắc viết prompt
- Prompt ngắn, rõ, có **scope cụ thể**: tên file + line number nếu có
- Không nhắc lại context đã có trong `AGENTS.md` / `CLAUDE.md`
- Giao 1 task **hoàn chỉnh** thay vì hỏi từng bước nhỏ

### Nguyên tắc dùng subagent
- Mỗi subagent làm **1 việc duy nhất** (code / fix / test)
- Không để 1 agent vừa code vừa fix vừa test
- Khi cần nhiều agent: chạy độc lập song song nếu không phụ thuộc nhau

### Prompt caching (Anthropic SDK)
- Đã có sẵn trong `src/lib/anthropic.ts`
- Dùng `cache_control` cho system prompt dài để tái sử dụng cache giữa các request
- Giảm chi phí đáng kể khi gọi Claude nhiều lần với cùng context

---

## Gọi subagent

### Coder Agent
```
Với vai trò Coder Agent, hãy [mô tả tính năng].
File liên quan: [danh sách file nếu biết]
```

### Fixer Agent
```
Với vai trò Fixer Agent, hãy fix [mô tả lỗi].
Lỗi xảy ra tại: [file:line hoặc error message]
```

### Tester Agent
```
Với vai trò Tester Agent, hãy viết test cho [tên module/function].
Loại test: [unit / e2e]
```

---

## Conventions

### API Routes (`src/app/api/`)
- Validate input bằng **Zod** trước khi xử lý
- Trả về lỗi rõ ràng: `{ error: string }` với HTTP status phù hợp
- Không để logic business trong route — đẩy vào `src/lib/`

### Remotion Templates (`src/remotion/templates/`)
- Implement đúng props `VideoProps` từ `src/types/index.ts`
- Đăng ký trong `src/remotion/templates/index.ts` (export + `TemplateConfig`)
- Đăng ký Composition trong `src/remotion/Root.tsx`

### Database (Prisma)
- Dùng singleton từ `src/lib/db.ts` — không tạo `PrismaClient` mới
- Sau khi thay đổi `schema.prisma`: chạy `npx prisma migrate dev`

### Queue (BullMQ)
- Job phải **idempotent** — retry không gây lỗi hay duplicate
- Logic worker nằm trong `src/lib/queue.ts`

### Types
- Tất cả shared types đặt trong `src/types/index.ts`
- Không duplicate type giữa các file

---

## Lệnh hay dùng

```bash
npm run dev          # Chạy dev server (Next.js)
npm run build        # Build production
npm run lint         # ESLint
npx tsc --noEmit     # Type check
npx vitest run       # Chạy unit test
npx playwright test  # Chạy E2E test
npx prisma studio    # Xem database qua UI
npx prisma migrate dev  # Apply migration mới
```
