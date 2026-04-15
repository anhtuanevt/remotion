import { test, expect } from '@playwright/test'

test('create video from transcript', async ({ page }) => {
  await page.goto('/')
  await page.click('text=Transcript')
  await page.fill('textarea', 'Xin chào. Đây là video đầu tiên. Chúng ta sẽ học về AI.')
  await page.click('[data-template="news"]')
  await page.click('button:has-text("Tạo Video")')
  await expect(page).toHaveURL(/\/verify\//, { timeout: 15000 })
  await expect(page.locator('[data-testid="segment-list"]')).toBeVisible()
  await expect(page.locator('[data-testid="segment-item"]')).toHaveCount(3, { timeout: 5000 })
})
