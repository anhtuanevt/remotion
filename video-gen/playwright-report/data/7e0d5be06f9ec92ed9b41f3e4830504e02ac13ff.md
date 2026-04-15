# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: verify-edit.spec.ts >> edit segment text and trigger render
- Location: tests/e2e/verify-edit.spec.ts:3:5

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/render\//
Received string:  "http://localhost:3001/verify/cmnu3ngnj0004iodla3tjqko2"
Timeout: 10000ms

Call log:
  - Expect "toHaveURL" with timeout 10000ms
    14 × unexpected value "http://localhost:3001/verify/cmnu3ngnj0004iodla3tjqko2"

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e4]:
        - button "← Trang chủ" [ref=e5]
        - generic [ref=e6]: "|"
        - heading "Xem & Chỉnh sửa Video" [level=1] [ref=e7]
        - generic [ref=e8]: cmnu3ngn
    - generic [ref=e9]:
      - complementary [ref=e10]:
        - generic [ref=e11]:
          - generic [ref=e12]: Segments (2)
          - button "+ Thêm" [ref=e13]
        - generic [ref=e14]:
          - generic [ref=e16] [cursor=pointer]:
            - button "Kéo để sắp xếp" [ref=e17]: ⋮⋮
            - generic [ref=e18]:
              - generic [ref=e19]:
                - generic [ref=e20]: "#1"
                - generic [ref=e21]: 2.0s
              - paragraph [ref=e22]: Câu đã được chỉnh sửa.
          - generic [ref=e24] [cursor=pointer]:
            - button "Kéo để sắp xếp" [ref=e25]: ⋮⋮
            - generic [ref=e26]:
              - generic [ref=e27]:
                - generic [ref=e28]: "#2"
                - generic [ref=e29]: 2.0s
              - paragraph [ref=e30]: Second sentence.
          - status [ref=e31]
      - main [ref=e32]:
        - generic [ref=e33]:
          - button "📺" [ref=e34]
          - button "📚" [ref=e35]
          - button "🎙️" [ref=e36]
          - button "💻" [ref=e37]
          - button "🎬" [ref=e38]
          - button "⬜" [ref=e39]
          - button "🌈" [ref=e40]
          - button "🎥" [ref=e41]
          - button "📱" [ref=e42]
          - button "✏️" [ref=e43]
        - generic [ref=e46]:
          - generic [ref=e52]:
            - generic [ref=e53]: Câu đã được chỉnh sửa.
            - generic [ref=e54]: First sentence.
          - generic [ref=e59]:
            - generic [ref=e60]:
              - button "Play video" [ref=e61] [cursor=pointer]:
                - img [ref=e62]
              - button "Mute sound" [ref=e65] [cursor=pointer]:
                - img [ref=e66]
              - generic [ref=e68]: 0:00 / 0:04
            - button "Enter Fullscreen" [ref=e70] [cursor=pointer]:
              - img [ref=e71]
      - complementary [ref=e81]:
        - generic [ref=e82]: Chỉnh sửa
        - generic [ref=e84]:
          - generic [ref=e85]:
            - generic [ref=e86]: Nội dung segment
            - textbox [ref=e87]: Câu đã được chỉnh sửa.
          - generic [ref=e88]:
            - generic [ref=e89]: Phụ đề
            - textbox "Phụ đề hiển thị..." [ref=e90]: First sentence.
          - generic [ref=e91]:
            - text: "Thời lượng ước tính:"
            - strong [ref=e92]: 2.0s
          - generic [ref=e93]:
            - paragraph [ref=e94]: Giọng đọc
            - generic [ref=e95]:
              - generic [ref=e96]:
                - button "🇻🇳 Vbee" [ref=e97]
                - button "ElevenLabs" [ref=e98]
                - button "Edge (free)" [ref=e99]
              - paragraph [ref=e100]: Sẽ dùng vi-VN-HoaiMyNeural (Tiếng Việt) hoặc en-US-JennyNeural (English)
            - button "Tạo giọng đọc" [ref=e101]
    - contentinfo [ref=e102]:
      - generic [ref=e103]:
        - generic [ref=e104]: 2 segments
        - generic [ref=e105]: ·
        - generic [ref=e106]: "Tổng: 4.0s"
        - generic [ref=e107]: ·
        - generic [ref=e108]: 120 frames
      - button "Render Video" [ref=e109]
  - generic [active]:
    - generic [ref=e112]:
      - generic [ref=e113]:
        - generic [ref=e114]:
          - navigation [ref=e115]:
            - button "previous" [disabled] [ref=e116]:
              - img "previous" [ref=e117]
            - generic [ref=e119]:
              - generic [ref=e120]: 1/
              - text: "1"
            - button "next" [disabled] [ref=e121]:
              - img "next" [ref=e122]
          - img
        - generic [ref=e124]:
          - generic [ref=e125]:
            - img [ref=e126]
            - generic "Latest available version is detected (16.2.3)." [ref=e128]: Next.js 16.2.3
            - generic [ref=e129]: Turbopack
          - img
      - dialog "Build Error" [ref=e131]:
        - generic [ref=e134]:
          - generic [ref=e135]:
            - generic [ref=e136]:
              - generic [ref=e138]: Build Error
              - generic [ref=e139]:
                - button "Copy Error Info" [ref=e140] [cursor=pointer]:
                  - img [ref=e141]
                - link "Go to related documentation" [ref=e143] [cursor=pointer]:
                  - /url: https://nextjs.org/docs/app/api-reference/next-config-js/turbo#webpack-loaders
                  - img [ref=e144]
                - button "Attach Node.js inspector" [ref=e146] [cursor=pointer]:
                  - img [ref=e147]
            - generic [ref=e156]: Unknown module type
          - generic [ref=e158]:
            - generic [ref=e160]:
              - img [ref=e162]
              - generic [ref=e164]: ./node_modules/@remotion/bundler/node_modules/@esbuild/darwin-arm64/README.md
              - button "Open in editor" [ref=e165] [cursor=pointer]:
                - img [ref=e167]
            - generic [ref=e171]:
              - text: "Unknown module type This module doesn't have an associated type. Use a known file extension, or register a loader for it. Read more:"
              - link "https://nextjs.org/docs/app/api-reference/next-config-js/turbo#webpack-loaders" [ref=e172] [cursor=pointer]:
                - /url: https://nextjs.org/docs/app/api-reference/next-config-js/turbo#webpack-loaders
        - generic [ref=e173]: "1"
        - generic [ref=e174]: "2"
    - generic [ref=e179] [cursor=pointer]:
      - button "Open Next.js Dev Tools" [ref=e180]:
        - img [ref=e181]
      - button "Open issues overlay" [ref=e185]:
        - generic [ref=e186]:
          - generic [ref=e187]: "0"
          - generic [ref=e188]: "1"
        - generic [ref=e189]: Issue
  - alert [ref=e190]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | test('edit segment text and trigger render', async ({ page, request }) => {
  4  |   const res = await request.post('/api/create', {
  5  |     data: { type: 'transcript', content: 'First sentence. Second sentence.', language: 'vi', template: 'minimal' },
  6  |   })
  7  |   const { jobId } = await res.json()
  8  | 
  9  |   await page.goto(`/verify/${jobId}`)
  10 |   await page.locator('[data-testid="segment-item"]').first().click()
  11 |   await expect(page.locator('[data-testid="edit-panel"]')).toBeVisible()
  12 | 
  13 |   const textarea = page.locator('[data-testid="segment-text"]')
  14 |   await textarea.fill('Câu đã được chỉnh sửa.')
  15 |   await textarea.blur()
  16 | 
  17 |   await expect(page.locator('[data-testid="segment-item"]').first())
  18 |     .toContainText('Câu đã được chỉnh sửa', { timeout: 3000 })
  19 | 
  20 |   await page.click('button:has-text("Render Video")')
> 21 |   await expect(page).toHaveURL(/\/render\//, { timeout: 10000 })
     |                      ^ Error: expect(page).toHaveURL(expected) failed
  22 | })
  23 | 
```