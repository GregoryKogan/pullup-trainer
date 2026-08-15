import type { Router } from 'vue-router'

export function safeBack(router: Router, fallback = '/') {
  if (window.history.length > 1) router.back()
  else router.push(fallback)
}
