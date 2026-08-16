import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useRestTimer } from './use-rest-timer'

describe('useRestTimer pause/resume', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('pauses countdown and resumes from same remaining', () => {
    const onFinish = vi.fn()
    const { remaining, paused, start, pause, resume } = useRestTimer(onFinish)

    start(60)
    expect(remaining.value).toBe(60)

    vi.advanceTimersByTime(5000)
    expect(remaining.value).toBe(55)

    pause()
    expect(paused.value).toBe(true)

    vi.advanceTimersByTime(10000)
    expect(remaining.value).toBe(55)

    resume()
    expect(paused.value).toBe(false)

    vi.advanceTimersByTime(3000)
    expect(remaining.value).toBe(52)
    expect(onFinish).not.toHaveBeenCalled()
  })

  it('calls onFinish when timer reaches zero', () => {
    const onFinish = vi.fn()
    const { start } = useRestTimer(onFinish)

    start(3)
    vi.advanceTimersByTime(4000)
    expect(onFinish).toHaveBeenCalledTimes(1)
  })
})
