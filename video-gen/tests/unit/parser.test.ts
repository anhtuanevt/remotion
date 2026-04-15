import { describe, it, expect } from 'vitest'
import { parseTranscript } from '@/lib/parser'

describe('parseTranscript', () => {
  it('splits short transcript', () => {
    const segs = parseTranscript('Hello world. This is second. Third here.', 'en')
    expect(segs.length).toBe(3)
    expect(segs[0].order).toBe(0)
    expect(segs[0].startTime).toBe(0)
  })
  it('assigns increasing startTime', () => {
    const segs = parseTranscript('First sentence. Second sentence. Third.', 'en')
    expect(segs[1].startTime).toBeGreaterThan(0)
    expect(segs[2].startTime).toBeGreaterThan(segs[1].startTime)
  })
  it('enforces min duration 2s', () => {
    const segs = parseTranscript('Hi.', 'en')
    expect(segs[0].duration).toBeGreaterThanOrEqual(2)
  })
  it('enforces max duration 8s per segment', () => {
    const long = Array(200).fill('word').join(' ') + '.'
    const segs = parseTranscript(long, 'en')
    segs.forEach(s => expect(s.duration).toBeLessThanOrEqual(8))
  })
  it('throws on empty input', () => {
    expect(() => parseTranscript('')).toThrow()
  })
  it('handles Vietnamese', () => {
    const segs = parseTranscript('Xin chào. Đây là câu thứ hai.', 'vi')
    expect(segs.length).toBe(2)
  })
})
