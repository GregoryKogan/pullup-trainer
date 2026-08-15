export function formatLocalDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(iso: string, days: number): string {
  const d = parseLocalDate(iso)
  d.setDate(d.getDate() + days)
  return formatLocalDate(d)
}

export function daysBetween(a: string, b: string): number {
  const da = parseLocalDate(a)
  const db = parseLocalDate(b)
  return Math.round((db.getTime() - da.getTime()) / 86400000)
}

export function hoursBetween(a: string, b: string): number {
  const da = parseLocalDate(a)
  const db = parseLocalDate(b)
  return (db.getTime() - da.getTime()) / 3600000
}

export function startOfWeek(iso: string): string {
  const d = parseLocalDate(iso)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return formatLocalDate(d)
}

export function todayLocal(): string {
  return formatLocalDate(new Date())
}

export function formatDisplayDate(iso: string, locale = 'en'): string {
  return parseLocalDate(iso).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function toIsoOffset(date: Date): string {
  const pad = (n: number) => String(Math.abs(n)).padStart(2, '0')
  const tz = -date.getTimezoneOffset()
  const sign = tz >= 0 ? '+' : '-'
  const hh = pad(Math.floor(Math.abs(tz) / 60))
  const mm = pad(Math.abs(tz) % 60)
  const y = date.getFullYear()
  const mo = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  const se = String(date.getSeconds()).padStart(2, '0')
  return `${y}-${mo}-${d}T${h}:${mi}:${se}${sign}${hh}:${mm}`
}
