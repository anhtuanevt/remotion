import { test, expect } from '@playwright/test'

test('edit segment text and trigger render', async ({ page, request }) => {
  const res = await request.post('/api/create', {
    data: { type: 'transcript', content: 'First sentence. Second sentence.', language: 'vi', template: 'minimal' },
  })
  const { jobId } = await res.json()

  await page.goto(`/verify/${jobId}`)
  await page.locator('[data-testid="segment-item"]').first().click()
  await expect(page.locator('[data-testid="edit-panel"]')).toBeVisible()

  const textarea = page.locator('[data-testid="segment-text"]')
  await textarea.fill('Câu đã được chỉnh sửa.')
  await textarea.blur()

  await expect(page.locator('[data-testid="segment-item"]').first())
    .toContainText('Câu đã được chỉnh sửa', { timeout: 3000 })

  await page.click('button:has-text("Render Video")')
  await expect(page).toHaveURL(/\/render\//, { timeout: 10000 })
})
