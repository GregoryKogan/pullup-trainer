import type { Router } from 'vue-router'

export function safeBack(router: Router, fallback = '/') {
  if (window.history.length > 1) router.back()
  else router.push(fallback)
}

export function scrollToHash(hash: string, behavior: ScrollBehavior = 'smooth') {
  const id = hash.startsWith('#') ? hash.slice(1) : hash
  if (!id) return
  document.getElementById(id)?.scrollIntoView({ behavior, block: 'start' })
}
