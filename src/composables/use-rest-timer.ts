import { onUnmounted, shallowRef } from 'vue'

export function useRestTimer(onFinish: () => void) {
  const remaining = shallowRef(0)
  const total = shallowRef(0)
  const paused = shallowRef(false)
  const minSeconds = shallowRef(0)
  const maxSeconds = shallowRef(Number.MAX_SAFE_INTEGER)
  let timer: ReturnType<typeof setInterval> | null = null

  function clearTimer() {
    if (timer) clearInterval(timer)
    timer = null
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
    }
  }

  function tick() {
    clearTimer()
    timer = setInterval(() => {
      if (remaining.value <= 0) {
        clearTimer()
        paused.value = false
        onFinish()
        return
      }
      remaining.value--
    }, 1000)
  }

  function start(seconds: number) {
    clearTimer()
    paused.value = false
    const clamped = clampSeconds(seconds)
    total.value = clamped
    remaining.value = clamped
    if (clamped > 0) tick()
  }

  function adjust(delta: number) {
    remaining.value = clampSeconds(remaining.value + delta)
    if (remaining.value > total.value) {
      total.value = remaining.value
    }
  }

  function reset() {
    remaining.value = total.value
    if (!paused.value && total.value > 0) tick()
  }

  function skip() {
    clearTimer()
    paused.value = false
    remaining.value = 0
  }

  function pause() {
    if (!timer || paused.value || remaining.value <= 0) return
    clearTimer()
    paused.value = true
  }

  function resume() {
    if (!paused.value || remaining.value <= 0) return
    paused.value = false
    tick()
  }

  onUnmounted(clear)

  return { remaining, total, paused, start, adjust, reset, skip, pause, resume, clear, setBounds }
}
