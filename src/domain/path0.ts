import type { WorkoutSession } from './types'

function range(min: number, max: number): number {
  return Math.round((min + max) / 2)
}

export function path0Session(step: number): WorkoutSession {
  const s = Math.min(12, Math.max(1, step))
  if (s <= 4) {
    const holdSeconds = 20 + (s - 1) * 5
    return {
      sets: [
        { position: 1, type: 'reps', unit: 'reps', planned: 8, label: 'scap_pull' },
        { position: 2, type: 'reps', unit: 'reps', planned: 8, label: 'scap_pull' },
        { position: 3, type: 'reps', unit: 'reps', planned: 8, label: 'scap_pull' },
        { position: 4, type: 'hold', unit: 'seconds', planned: holdSeconds, label: 'hang' },
        { position: 5, type: 'hold', unit: 'seconds', planned: holdSeconds, label: 'hang' },
        { position: 6, type: 'hold', unit: 'seconds', planned: holdSeconds, label: 'hang' },
      ],
    }
  }
  if (s <= 8) {
    const negSeconds = range(3, 5)
    return {
      sets: [
        { position: 1, type: 'negative', unit: 'seconds', planned: negSeconds, label: 'negative' },
        { position: 2, type: 'negative', unit: 'seconds', planned: negSeconds, label: 'negative' },
        { position: 3, type: 'negative', unit: 'seconds', planned: negSeconds, label: 'negative' },
        { position: 4, type: 'assisted', unit: 'reps', planned: 6, label: 'assisted' },
        { position: 5, type: 'assisted', unit: 'reps', planned: 6, label: 'assisted' },
        { position: 6, type: 'assisted', unit: 'reps', planned: 6, label: 'assisted' },
      ],
    }
  }
  return {
    sets: [
      { position: 1, type: 'negative', unit: 'seconds', planned: 6, label: 'negative' },
      { position: 2, type: 'negative', unit: 'seconds', planned: 6, label: 'negative' },
      { position: 3, type: 'negative', unit: 'seconds', planned: 6, label: 'negative' },
      { position: 4, type: 'assisted', unit: 'reps', planned: 8, label: 'assisted' },
      { position: 5, type: 'assisted', unit: 'reps', planned: 8, label: 'assisted' },
      { position: 6, type: 'assisted', unit: 'reps', planned: 8, label: 'assisted' },
    ],
  }
}
