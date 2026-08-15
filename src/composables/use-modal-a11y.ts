import { nextTick, onBeforeUnmount, ref, watch, type Ref } from 'vue'

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function useModalA11y(
  visible: Ref<boolean>,
  options?: {
    onEscape?: () => void
    initialFocusSelector?: string
  },
) {
  const panelRef = ref<HTMLElement | null>(null)
  let previousFocus: HTMLElement | null = null
  let keyHandler: ((e: KeyboardEvent) => void) | null = null

  function getFocusables() {
    if (!panelRef.value) return []
    return [...panelRef.value.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
      (el) => el.offsetParent !== null,
    )
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      options?.onEscape?.()
      return
    }
    if (e.key !== 'Tab') return
    const focusables = getFocusables()
    if (focusables.length === 0) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  watch(visible, async (open) => {
    if (open) {
      previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
      await nextTick()
      const selector = options?.initialFocusSelector
      const target = selector ? panelRef.value?.querySelector<HTMLElement>(selector) : null
      const focusables = getFocusables()
      ;(target ?? focusables[0] ?? panelRef.value)?.focus()
      keyHandler = handleKeydown
      window.addEventListener('keydown', keyHandler)
    } else {
      if (keyHandler) {
        window.removeEventListener('keydown', keyHandler)
        keyHandler = null
      }
      previousFocus?.focus()
      previousFocus = null
    }
  })

  onBeforeUnmount(() => {
    if (keyHandler) window.removeEventListener('keydown', keyHandler)
  })

  return { panelRef }
}
