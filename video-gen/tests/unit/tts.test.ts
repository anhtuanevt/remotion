import { describe, it, expect } from 'vitest'
import { VBEE_VOICES, DEFAULT_VBEE_VOICE, buildCacheKey } from '@/lib/tts'

describe('VBEE_VOICES', () => {
  it('has 11 voices', () => expect(VBEE_VOICES).toHaveLength(11))
  it('covers all 3 regions', () => {
    const regions = new Set(VBEE_VOICES.map(v => v.region))
    expect(regions).toContain('Bắc')
    expect(regions).toContain('Trung')
    expect(regions).toContain('Nam')
  })
  it('default voice is in list', () => {
    expect(VBEE_VOICES.find(v => v.id === DEFAULT_VBEE_VOICE)).toBeDefined()
  })
  it('all voices have required fields', () => {
    VBEE_VOICES.forEach(v => {
      expect(v.id).toBeTruthy()
      expect(v.name).toBeTruthy()
      expect(['Bắc','Trung','Nam']).toContain(v.region)
      expect(['Nữ','Nam']).toContain(v.gender)
    })
  })
  it('cache key differs for different providers', () => {
    const k1 = buildCacheKey('hello', 'vbee', 'voice1')
    const k2 = buildCacheKey('hello', 'elevenlabs', 'voice1')
    expect(k1).not.toBe(k2)
  })
  it('cache key same for identical input', () => {
    const k1 = buildCacheKey('hello', 'vbee', 'voice1')
    const k2 = buildCacheKey('hello', 'vbee', 'voice1')
    expect(k1).toBe(k2)
  })
})
