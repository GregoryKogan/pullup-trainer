import { onMounted, onUnmounted, ref, type Ref } from 'vue'
import { scrollAppMainToTop } from '@/utils/navigation'

export function useScrollTopFab(anchorSelector = '.subpage-head') {
  const visible = ref(false)
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    const root = document.querySelector('.app-main')
    const anchor = document.querySelector(anchorSelector)
    if (!root || !anchor) return

    observer = new IntersectionObserver(
      ([entry]) => {
        visible.value = !entry.isIntersecting
      },
      { root, threshold: 0 },
    )
    observer.observe(anchor)
  })

  onUnmounted(() => {
    observer?.disconnect()
  })

  function scrollToTop() {
    scrollAppMainToTop()
  }

  return { visible, scrollToTop } satisfies { visible: Ref<boolean>; scrollToTop: () => void }
}
