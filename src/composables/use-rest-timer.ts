import { onUnmounted, shallowRef } from 'vue'

const TICK_MS = 250

export function useRestTimer(onFinish: () => void) {
  const remaining = shallowRef(0)
  const total = shallowRef(0)
  const paused = shallowRef(false)
  const minSeconds = shallowRef(0)
  const maxSeconds = shallowRef(Number.MAX_SAFE_INTEGER)
  let timer: ReturnType<typeof setInterval> | null = null
  let deadline = 0

  function clearTimer() {
    if (timer) clearInterval(timer)
    timer = null
    deadline = 0
  }

  function clear() {
    clearTimer()
    paused.value = false
  }

  function clampSeconds(seconds: number) {
    return Math.min(maxSeconds.value, Math.max(minSeconds.value, seconds))
  }

  function setBounds(min: number, max: number) {
    minSeconds.value = min
    maxSeconds.value = max
    if (remaining.value > 0) {
      remaining.value = clampSeconds(remaining.value)
      if (timer) deadline = Date.now() + remaining.value * 1000
    }
  }

  function secondsLeft() {
    return Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
  }

  function sync() {
    if (!timer) return
    const left = secondsLeft()
    remaining.value = left
    if (left > 0) return
    clearTimer()
    paused.value = false
    onFinish()
  }

  function run(seconds: number) {
    clearTimer()
    deadline = Date.now() + seconds * 1000
    remaining.value = seconds
    timer = setInterval(sync, TICK_MS)
  }

  function start(seconds: number) {
    clearTimer()
    paused.value = false
    const clamped = clampSeconds(seconds)
    total.value = clamped
    remaining.value = clamped
    if (clamped > 0) run(clamped)
  }

  function adjust(delta: number) {
    remaining.value = clampSeconds(remaining.value + delta)
    if (remaining.value > total.value) {
      total.value = remaining.value
    }
    if (timer) deadline = Date.now() + remaining.value * 1000
  }

  function reset() {
    remaining.value = total.value
    if (!paused.value && total.value > 0) run(total.value)
  }

  function skip() {
    clearTimer()
    paused.value = false
    remaining.value = 0
  }

  function pause() {
    if (!timer || paused.value || remaining.value <= 0) return
    remaining.value = secondsLeft()
    clearTimer()
    paused.value = true
  }

  function resume() {
    if (!paused.value || remaining.value <= 0) return
    paused.value = false
    run(remaining.value)
  }

  function onWake() {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
    sync()
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onWake)
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('pageshow', onWake)
    window.addEventListener('focus', onWake)
  }

  onUnmounted(() => {
    clear()
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onWake)
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('pageshow', onWake)
      window.removeEventListener('focus', onWake)
    }
  })

  return { remaining, total, paused, start, adjust, reset, skip, pause, resume, clear, setBounds }
}
