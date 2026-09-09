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

  it('counts down by wall clock when interval ticks are throttled', () => {
    const onFinish = vi.fn()
    const { remaining, start } = useRestTimer(onFinish)

    start(180)
    vi.setSystemTime(Date.now() + 60_000)
    vi.advanceTimersByTime(250)

    expect(remaining.value).toBe(120)
    expect(onFinish).not.toHaveBeenCalled()
  })

  it('catches up on return to foreground after the deadline passed', () => {
    const onFinish = vi.fn()
    const { remaining, start } = useRestTimer(onFinish)

    start(60)
    vi.setSystemTime(Date.now() + 120_000)
    document.dispatchEvent(new Event('visibilitychange'))

    expect(remaining.value).toBe(0)
    expect(onFinish).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(5000)
    expect(onFinish).toHaveBeenCalledTimes(1)
  })

  it('ignores wake events while the document is hidden', () => {
    const onFinish = vi.fn()
    const { remaining, start } = useRestTimer(onFinish)
    const visibility = vi
      .spyOn(document, 'visibilityState', 'get')
      .mockReturnValue('hidden')

    start(60)
    vi.setSystemTime(Date.now() + 120_000)
    document.dispatchEvent(new Event('visibilitychange'))

    expect(remaining.value).toBe(60)
    expect(onFinish).not.toHaveBeenCalled()
    visibility.mockRestore()
  })

  it('does not double-count paused time spent in the background', () => {
    const onFinish = vi.fn()
    const { remaining, start, pause, resume } = useRestTimer(onFinish)

    start(180)
    vi.advanceTimersByTime(30_000)
    pause()

    vi.setSystemTime(Date.now() + 600_000)
    window.dispatchEvent(new Event('focus'))
    expect(remaining.value).toBe(150)

    resume()
    vi.setSystemTime(Date.now() + 10_000)
    vi.advanceTimersByTime(250)
    expect(remaining.value).toBe(140)
  })
})
