export const REP_COUNT_MAX = 100
export const REP_COUNT_MIN = 1

const FRACTION_KEYS = new Set(['.', ',', 'e', 'E', '+', '-'])

export function clampRepCount(value: number, max = REP_COUNT_MAX, min = 0): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, Math.trunc(value)))
}

export function isValidRepCount(value: number): boolean {
  return Number.isFinite(value) && Number.isInteger(value) && value >= 0 && value <= REP_COUNT_MAX
}

export function isValidTestRepCount(value: number): boolean {
  return Number.isFinite(value) && Number.isInteger(value) && value >= REP_COUNT_MIN && value <= REP_COUNT_MAX
}

export function clampTestRepCount(value: number, max = REP_COUNT_MAX): number {
  return clampRepCount(value, max, REP_COUNT_MIN)
}

export function blockRepFractionKey(event: KeyboardEvent): void {
  if (event.ctrlKey || event.metaKey || event.altKey) return
  if (FRACTION_KEYS.has(event.key)) {
    event.preventDefault()
  }
}

export function normalizeRepCount(raw: string, max = REP_COUNT_MAX, min = 0): number | null {
  const trimmed = raw.trim()
  if (trimmed === '') return null
  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed)) return null
  return Math.min(max, Math.max(min, Math.trunc(parsed)))
}

export function syncRepInput(
  event: Event,
  set: (value: number) => void,
  max = REP_COUNT_MAX,
  min = 0,
): void {
  const el = event.target as HTMLInputElement
  const normalized = normalizeRepCount(el.value, max, min)
  if (normalized === null) return
  set(normalized)
  if (el.value !== String(normalized)) {
    el.value = String(normalized)
  }
}

export function syncTestRepInput(event: Event, set: (value: number) => void): void {
  syncRepInput(event, set, REP_COUNT_MAX, REP_COUNT_MIN)
}
