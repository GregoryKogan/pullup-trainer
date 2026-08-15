export const REP_COUNT_MAX = 100

const FRACTION_KEYS = new Set(['.', ',', 'e', 'E', '+', '-'])

export function isValidRepCount(value: number): boolean {
  return Number.isFinite(value) && Number.isInteger(value) && value >= 0 && value <= REP_COUNT_MAX
}

export function blockRepFractionKey(event: KeyboardEvent): void {
  if (event.ctrlKey || event.metaKey || event.altKey) return
  if (FRACTION_KEYS.has(event.key)) {
    event.preventDefault()
  }
}

export function normalizeRepCount(raw: string, max = REP_COUNT_MAX): number | null {
  const trimmed = raw.trim()
  if (trimmed === '') return null
  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed)) return null
  return Math.min(max, Math.max(0, Math.trunc(parsed)))
}

export function syncRepInput(event: Event, set: (value: number) => void, max = REP_COUNT_MAX): void {
  const el = event.target as HTMLInputElement
  const normalized = normalizeRepCount(el.value, max)
  if (normalized === null) return
  set(normalized)
  if (el.value !== String(normalized)) {
    el.value = String(normalized)
  }
}
