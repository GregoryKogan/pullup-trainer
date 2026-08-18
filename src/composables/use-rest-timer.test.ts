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

  it('extends total when adjust pushes remaining above initial total', () => {
    const onFinish = vi.fn()
    const { remaining, total, start, adjust } = useRestTimer(onFinish)

    start(180)
    adjust(15)

    expect(remaining.value).toBe(195)
    expect(total.value).toBe(195)
  })

  it('keeps extended total when adjust decreases remaining', () => {
    const onFinish = vi.fn()
    const { remaining, total, start, adjust } = useRestTimer(onFinish)

    start(180)
    adjust(15)
    adjust(-30)

    expect(remaining.value).toBe(165)
    expect(total.value).toBe(195)
  })

  it('reset returns to extended total after adjust up', () => {
    const onFinish = vi.fn()
    const { remaining, total, start, adjust, reset } = useRestTimer(onFinish)

    start(180)
    adjust(15)
    vi.advanceTimersByTime(30000)
    reset()

    expect(remaining.value).toBe(195)
    expect(total.value).toBe(195)
  })
})
