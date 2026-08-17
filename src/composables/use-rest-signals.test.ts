import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  resetRestSoundForTests,
  requestNotificationPermission,
  signalRestEnd,
} from './use-rest-signals'

describe('use-rest-signals', () => {
  const play = vi.fn().mockResolvedValue(undefined)
  const pause = vi.fn()
  let notificationSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    resetRestSoundForTests()
    play.mockClear()
    pause.mockClear()
    vi.stubGlobal(
      'Audio',
      vi.fn(function MockAudio() {
        return {
          preload: '',
          currentTime: 0,
          play,
          pause,
        }
      }),
    )
    notificationSpy = vi.fn()
    vi.stubGlobal('Notification', Object.assign(notificationSpy, { permission: 'granted' }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('does nothing when notify is false', async () => {
    await signalRestEnd(false, 'Title', 'Body')
    expect(play).not.toHaveBeenCalled()
    expect(notificationSpy).not.toHaveBeenCalled()
  })

  it('plays sound and shows notification when notify is true', async () => {
    await signalRestEnd(true, 'Title', 'Body')
    expect(play).toHaveBeenCalled()
    expect(notificationSpy).toHaveBeenCalledWith('Title', {
      body: 'Body',
      tag: 'rest-timer',
    })
  })

  it('plays sound when notification permission is denied', async () => {
    vi.stubGlobal('Notification', Object.assign(notificationSpy, { permission: 'denied' }))
    await signalRestEnd(true, 'Title', 'Body')
    expect(play).toHaveBeenCalled()
    expect(notificationSpy).not.toHaveBeenCalled()
  })

  it('requestNotificationPermission returns false when denied', async () => {
    vi.stubGlobal(
      'Notification',
      Object.assign(vi.fn(), {
        permission: 'denied',
        requestPermission: vi.fn(),
      }),
    )
    await expect(requestNotificationPermission()).resolves.toBe(false)
  })
})
