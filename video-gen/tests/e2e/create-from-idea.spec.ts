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
