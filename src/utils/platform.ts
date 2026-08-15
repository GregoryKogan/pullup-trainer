export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export type InstallPlatform = 'ios' | 'android' | 'desktop' | 'other'

export function detectPlatform(): InstallPlatform {
  const ua = navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream) {
    return 'ios'
  }
  if (/Android/.test(ua)) return 'android'
  if (/Chrome|Edg/.test(ua) && !/Mobile/.test(ua)) return 'desktop'
  return 'other'
}

export function isPwaInstalled(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}
