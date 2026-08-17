import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useWorkoutSessionStore } from '@/stores/workout-session'

describe('useWorkoutSessionStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('advances currentIndex reactively after completeSet', () => {
    const store = useWorkoutSessionStore()
    store.start({
      date: '2026-08-17',
      planned: [
        { position: 1, type: 'reps', planned: 5 },
        { position: 2, type: 'reps', planned: 5 },
      ],
      programName: 'Pull-up Trainer',
      startedAt: '2026-08-17T10:00:00+03:00',
    })

    expect(store.active?.currentIndex).toBe(0)
    store.completeSet(5)
    expect(store.active?.currentIndex).toBe(1)
    expect(store.active?.completed).toHaveLength(1)
    expect(store.restRunning).toBe(true)
  })
})
