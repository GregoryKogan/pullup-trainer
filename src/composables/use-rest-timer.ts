import { onUnmounted, shallowRef } from 'vue'

export function useRestTimer(onFinish: () => void) {
  const remaining = shallowRef(0)
  const total = shallowRef(0)
  const minSeconds = shallowRef(0)
  const maxSeconds = shallowRef(Number.MAX_SAFE_INTEGER)
  let timer: ReturnType<typeof setInterval> | null = null

  function clear() {
    if (timer) clearInterval(timer)
    timer = null
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

  function start(seconds: number) {
    clear()
    const clamped = clampSeconds(seconds)
    total.value = clamped
    remaining.value = clamped
    timer = setInterval(() => {
      if (remaining.value <= 0) {
        clear()
        onFinish()
        return
      }
      remaining.value--
    }, 1000)
  }

  function adjust(delta: number) {
    remaining.value = clampSeconds(remaining.value + delta)
  }

  function reset() {
    remaining.value = total.value
  }

  function skip() {
    clear()
    remaining.value = 0
  }

  onUnmounted(clear)

  return { remaining, total, start, adjust, reset, skip, clear, setBounds }
}
