const REST_END_SOUND_URL = `${import.meta.env.BASE_URL}sounds/set-start-go.wav`

let restEndAudio: HTMLAudioElement | null = null
let soundUnlocked = false

function getRestEndAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null
  if (!restEndAudio) {
    restEndAudio = new Audio(REST_END_SOUND_URL)
    restEndAudio.preload = 'auto'
  }
  return restEndAudio
}

export async function unlockRestSound(): Promise<void> {
  if (soundUnlocked) return
  const audio = getRestEndAudio()
  if (!audio) return
  try {
    audio.currentTime = 0
    await audio.play()
    audio.pause()
    audio.currentTime = 0
    soundUnlocked = true
  } catch {
    // iOS may reject until a later gesture
  }
}

async function playRestEndSound(): Promise<void> {
  const audio = getRestEndAudio()
  if (!audio) return
  audio.currentTime = 0
  try {
    await audio.play()
  } catch {
    // autoplay blocked or audio unavailable
  }
}

export async function signalRestEnd(notify: boolean, title: string, body: string) {
  if (!notify) return
  await playRestEndSound()
  if ('Notification' in window && Notification.permission === 'granted') {
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

export function resetRestSoundForTests() {
  restEndAudio = null
  soundUnlocked = false
}
