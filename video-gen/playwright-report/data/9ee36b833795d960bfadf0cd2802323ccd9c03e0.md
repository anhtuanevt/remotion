# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: create-from-idea.spec.ts >> create video from idea via LLM
- Location: tests/e2e/create-from-idea.spec.ts:3:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/verify\//
Received string:  "http://localhost:3001/"

Call log:
  - Expect "toHaveURL" with timeout 30000ms
    33 × unexpected value "http://localhost:3001/"

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - heading "Tạo Video AI" [level=1] [ref=e5]
      - paragraph [ref=e6]: Nhập kịch bản hoặc ý tưởng — AI sẽ tạo video chuyên nghiệp trong vài phút.
    - generic [ref=e7]:
      - generic [ref=e8]:
        - paragraph [ref=e9]: Chế độ nhập
        - generic [ref=e10]:
          - button "📝 Kịch bản (Transcript)" [ref=e11]
          - button "💡 Ý tưởng (Idea)" [ref=e12]
      - generic [ref=e13]:
        - generic [ref=e14]: Mô tả ý tưởng
        - textbox "Mô tả ý tưởng video của bạn. AI sẽ tự động viết kịch bản chi tiết..." [ref=e15]: Giải thích về trí tuệ nhân tạo cho người mới bắt đầu
      - generic [ref=e16]:
        - paragraph [ref=e17]: Ngôn ngữ
        - generic [ref=e18]:
          - button "🇻🇳 Tiếng Việt" [ref=e19]
          - button "🇬🇧 English" [ref=e20]
      - generic [ref=e21]:
        - paragraph [ref=e22]: Chọn template
        - generic [ref=e23]:
          - button "📺 News Broadcast Phong cách bản tin TV chuyên nghiệp 16:9" [ref=e24]:
            - generic [ref=e25]: 📺
            - generic [ref=e26]: News Broadcast
            - generic [ref=e27]: Phong cách bản tin TV chuyên nghiệp
            - generic [ref=e28]: 16:9
          - button "📚 Educational Slide giáo dục rõ ràng, học thuật 16:9" [ref=e29]:
            - generic [ref=e30]: 📚
            - generic [ref=e31]: Educational
            - generic [ref=e32]: Slide giáo dục rõ ràng, học thuật
            - generic [ref=e33]: 16:9
          - button "🎙️ Podcast Visual Dành cho podcast có hình ảnh 16:9" [ref=e34]:
            - generic [ref=e35]: 🎙️
            - generic [ref=e36]: Podcast Visual
            - generic [ref=e37]: Dành cho podcast có hình ảnh
            - generic [ref=e38]: 16:9
          - button "💻 Tech & Code Kiến thức lập trình, công nghệ 16:9" [ref=e39]:
            - generic [ref=e40]: 💻
            - generic [ref=e41]: Tech & Code
            - generic [ref=e42]: Kiến thức lập trình, công nghệ
            - generic [ref=e43]: 16:9
          - button "🎬 Story / Film Kể chuyện phong cách điện ảnh 16:9" [ref=e44]:
            - generic [ref=e45]: 🎬
            - generic [ref=e46]: Story / Film
            - generic [ref=e47]: Kể chuyện phong cách điện ảnh
            - generic [ref=e48]: 16:9
          - button "⬜ Minimal Tối giản, tập trung vào chữ 16:9" [ref=e49]:
            - generic [ref=e50]: ⬜
            - generic [ref=e51]: Minimal
            - generic [ref=e52]: Tối giản, tập trung vào chữ
            - generic [ref=e53]: 16:9
          - button "🌈 Kids & Fun Màu sắc vui nhộn cho trẻ em 16:9" [ref=e54]:
            - generic [ref=e55]: 🌈
            - generic [ref=e56]: Kids & Fun
            - generic [ref=e57]: Màu sắc vui nhộn cho trẻ em
            - generic [ref=e58]: 16:9
          - button "🎥 Documentary Phim tài liệu chuyên nghiệp 16:9" [ref=e59]:
            - generic [ref=e60]: 🎥
            - generic [ref=e61]: Documentary
            - generic [ref=e62]: Phim tài liệu chuyên nghiệp
            - generic [ref=e63]: 16:9
          - button "📱 Social / Reels Dọc 9:16 cho TikTok, Reels, Shorts 9:16" [ref=e64]:
            - generic [ref=e65]: 📱
            - generic [ref=e66]: Social / Reels
            - generic [ref=e67]: Dọc 9:16 cho TikTok, Reels, Shorts
            - generic [ref=e68]: 9:16
          - button "✏️ Whiteboard Hoạt hình bảng trắng vẽ tay 16:9" [ref=e69]:
            - generic [ref=e70]: ✏️
            - generic [ref=e71]: Whiteboard
            - generic [ref=e72]: Hoạt hình bảng trắng vẽ tay
            - generic [ref=e73]: 16:9
      - generic [ref=e74]:
        - paragraph [ref=e75]: Giọng đọc
        - generic [ref=e76]:
          - generic [ref=e77]:
            - button "🇻🇳 Vbee" [ref=e78]
            - button "ElevenLabs" [ref=e79]
            - button "Edge (free)" [ref=e80]
          - paragraph [ref=e81]: Sẽ dùng vi-VN-HoaiMyNeural (Tiếng Việt) hoặc en-US-JennyNeural (English)
      - button "Tạo Video" [ref=e82]
  - generic [active]:
    - generic [ref=e85]:
      - generic [ref=e86]:
        - generic [ref=e87]:
          - navigation [ref=e88]:
            - button "previous" [disabled] [ref=e89]:
              - img "previous" [ref=e90]
            - generic [ref=e92]:
              - generic [ref=e93]: 1/
              - text: "1"
            - button "next" [disabled] [ref=e94]:
              - img "next" [ref=e95]
          - img
        - generic [ref=e97]:
          - generic [ref=e98]:
            - img [ref=e99]
            - generic "Latest available version is detected (16.2.3)." [ref=e101]: Next.js 16.2.3
            - generic [ref=e102]: Turbopack
          - img
      - dialog "Build Error" [ref=e104]:
        - generic [ref=e107]:
          - generic [ref=e108]:
            - generic [ref=e109]:
              - generic [ref=e111]: Build Error
              - generic [ref=e112]:
                - button "Copy Error Info" [ref=e113] [cursor=pointer]:
                  - img [ref=e114]
                - link "Go to related documentation" [ref=e116] [cursor=pointer]:
                  - /url: https://nextjs.org/docs/app/api-reference/next-config-js/turbo#webpack-loaders
                  - img [ref=e117]
                - button "Attach Node.js inspector" [ref=e119] [cursor=pointer]:
                  - img [ref=e120]
            - generic [ref=e129]: Unknown module type
          - generic [ref=e131]:
            - generic [ref=e133]:
              - img [ref=e135]
              - generic [ref=e137]: ./node_modules/@remotion/bundler/node_modules/@esbuild/darwin-arm64/README.md
              - button "Open in editor" [ref=e138] [cursor=pointer]:
                - img [ref=e140]
            - generic [ref=e144]:
              - text: "Unknown module type This module doesn't have an associated type. Use a known file extension, or register a loader for it. Read more:"
              - link "https://nextjs.org/docs/app/api-reference/next-config-js/turbo#webpack-loaders" [ref=e145] [cursor=pointer]:
                - /url: https://nextjs.org/docs/app/api-reference/next-config-js/turbo#webpack-loaders
        - generic [ref=e146]: "1"
        - generic [ref=e147]: "2"
    - generic [ref=e152] [cursor=pointer]:
      - button "Open Next.js Dev Tools" [ref=e153]:
        - img [ref=e154]
      - button "Open issues overlay" [ref=e158]:
        - generic [ref=e159]:
          - generic [ref=e160]: "0"
          - generic [ref=e161]: "1"
        - generic [ref=e162]: Issue
  - alert [ref=e163]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test'
  2  | 
  3  | test('create video from idea via LLM', async ({ page }) => {
  4  |   await page.goto('/')
  5  |   await page.click('text=Idea')
  6  |   await page.fill('textarea', 'Giải thích về trí tuệ nhân tạo cho người mới bắt đầu')
  7  |   await page.click('[data-template="edu"]')
  8  |   await page.click('button:has-text("Tạo Video")')
> 9  |   await expect(page).toHaveURL(/\/verify\//, { timeout: 30000 })
     |                      ^ Error: expect(page).toHaveURL(expected) failed
  10 |   const items = page.locator('[data-testid="segment-item"]')
  11 |   await expect(items.first()).toBeVisible({ timeout: 10000 })
  12 |   expect(await items.count()).toBeGreaterThan(2)
  13 | })
  14 | 
```