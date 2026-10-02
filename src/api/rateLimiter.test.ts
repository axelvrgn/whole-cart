import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRateLimiter } from './rateLimiter'

describe('createRateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('spaces tasks by the minimum interval', async () => {
    const schedule = createRateLimiter(1000)
    const starts: number[] = []
    const t0 = Date.now()
    const task = async () => {
      starts.push(Date.now() - t0)
    }

    const all = Promise.all([schedule(task), schedule(task), schedule(task)])
    await vi.runAllTimersAsync()
    await all

    expect(starts).toEqual([0, 1000, 2000])
  })

  it('returns each task result', async () => {
    const schedule = createRateLimiter(10)
    const result = schedule(async () => 42)
    await vi.runAllTimersAsync()
    await expect(result).resolves.toBe(42)
  })

  it('keeps going after a failed task', async () => {
    const schedule = createRateLimiter(10)
    const failed = schedule(async () => {
      throw new Error('boom')
    })
    const next = schedule(async () => 'ok')
    failed.catch(() => undefined)
    await vi.runAllTimersAsync()

    await expect(failed).rejects.toThrow('boom')
    await expect(next).resolves.toBe('ok')
  })
})
