export async function signalRestEnd(
  vibrate: boolean,
  notify: boolean,
  title: string,
  body: string,
) {
  if (vibrate && 'vibrate' in navigator) {
    navigator.vibrate([200, 100, 200])
  }
  if (notify && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, tag: 'rest-timer' })
  }
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}
