export function ceilMin(value: number, min = 1): number {
  return Math.max(min, Math.ceil(value))
}

export function workingSets(anchor: number): number[] {
  const m = Math.max(1, anchor)
  return [
    ceilMin(0.7 * m),
    ceilMin(0.6 * m),
    ceilMin(0.6 * m),
    ceilMin(0.5 * m),
  ]
}

export function finalMinimum(anchor: number, stepInCycle: number): number {
  const m = Math.max(1, anchor)
  const k = Math.min(6, Math.max(1, stepInCycle))
  return Math.min(ceilMin(0.6 * m) + k - 1, m + 1)
}

export function nkSeries(anchor: number): number[] {
  return [1, 2, 3, 4, 5, 6].map((k) => finalMinimum(anchor, k))
}

export function session(anchor: number, stepInCycle: number) {
  const working = workingSets(anchor)
  const nMin = finalMinimum(anchor, stepInCycle)
  const sets = [
    ...working.map((planned, i) => ({
      position: i + 1,
      type: 'reps' as const,
      planned,
    })),
    {
      position: 5,
      type: 'max' as const,
      planned: nMin,
    },
  ]
  return { sets }
}
