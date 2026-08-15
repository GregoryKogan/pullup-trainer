import { onUnmounted, shallowRef } from 'vue'

export function useRestTimer(onFinish: () => void) {
  const remaining = shallowRef(0)
  const total = shallowRef(0)
  const paused = shallowRef(false)
  let timer: ReturnType<typeof setInterval> | null = null

  function clear() {
    if (timer) clearInterval(timer)
    timer = null
  }

  function start(seconds: number) {
    clear()
    total.value = seconds
    remaining.value = seconds
    paused.value = false
    timer = setInterval(() => {
      if (paused.value) return
      if (remaining.value <= 0) {
        clear()
        onFinish()
        return
      }
      remaining.value--
    }, 1000)
  }

  function adjust(delta: number) {
    remaining.value = Math.max(0, remaining.value + delta)
  }

  function togglePause() {
    paused.value = !paused.value
  }

  function reset() {
    remaining.value = total.value
  }

  function skip() {
    clear()
    remaining.value = 0
  }

  onUnmounted(clear)

  return { remaining, total, paused, start, adjust, togglePause, reset, skip, clear }
}
