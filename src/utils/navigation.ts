import type { Router } from 'vue-router'

export function getAppMain(): HTMLElement | null {
  return document.querySelector('.app-main')
}

export function safeBack(router: Router, fallback = '/') {
  if (window.history.length > 1) router.back()
  else router.push(fallback)
}

export function scrollToHash(hash: string, behavior: ScrollBehavior = 'smooth') {
  const id = hash.startsWith('#') ? hash.slice(1) : hash
  if (!id) return
  const main = getAppMain()
  const el = document.getElementById(id)
  if (!main || !el) return
  const top = el.getBoundingClientRect().top - main.getBoundingClientRect().top + main.scrollTop
  main.scrollTo({ top, behavior })
}

export function scrollAppMainToTop(behavior: ScrollBehavior = 'smooth') {
  getAppMain()?.scrollTo({ top: 0, behavior })
}
