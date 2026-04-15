import { describe, it, expect } from 'vitest'
import { TEMPLATES } from '@/remotion/templates'

describe('TEMPLATES', () => {
  it('exports exactly 10 templates', () => expect(TEMPLATES).toHaveLength(10))
  it('each has required fields', () => {
    TEMPLATES.forEach(t => {
      expect(t.id).toBeTruthy()
      expect(t.width).toBeGreaterThan(0)
      expect(t.height).toBeGreaterThan(0)
      expect(t.fps).toBeGreaterThan(0)
      expect(t.thumbnail).toBeTruthy()
    })
  })
  it('social is 9:16 vertical', () => {
    const s = TEMPLATES.find(t => t.id === 'social')!
    expect(s.width).toBe(1080)
    expect(s.height).toBe(1920)
  })
  it('story and documentary are 24fps', () => {
    expect(TEMPLATES.find(t => t.id === 'story')!.fps).toBe(24)
    expect(TEMPLATES.find(t => t.id === 'documentary')!.fps).toBe(24)
  })
  it('all IDs are unique', () => {
    const ids = TEMPLATES.map(t => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
