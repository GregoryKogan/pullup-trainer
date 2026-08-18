import { nextTick } from 'vue'
import { createRouter, createWebHistory, type RouteLocationNormalized } from 'vue-router'
import { useProgressStore } from '@/stores/progress'
import { getAppMain, scrollToHash } from '@/utils/navigation'

function scrollAppMainAfterRoute(to: RouteLocationNormalized, savedPosition?: { top: number; left?: number }) {
  const main = getAppMain()
  if (!main) return
  if (savedPosition) {
    main.scrollTo({ top: savedPosition.top, left: savedPosition.left ?? 0 })
    return
  }
  if (to.hash) {
    scrollToHash(to.hash)
    return
  }
  main.scrollTo({ top: 0, left: 0 })
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, _from, savedPosition) {
    return new Promise((resolve) => {
      nextTick(() => {
        requestAnimationFrame(() => {
          scrollAppMainAfterRoute(to, savedPosition ?? undefined)
          resolve(false)
        })
      })
    })
  },
  routes: [
    { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
    { path: '/calendar', name: 'calendar', component: () => import('@/views/CalendarView.vue') },
    { path: '/stats', name: 'stats', component: () => import('@/views/StatsView.vue') },
    { path: '/settings', name: 'settings', component: () => import('@/views/SettingsView.vue') },
    { path: '/onboarding', name: 'onboarding', component: () => import('@/views/OnboardingView.vue') },
    { path: '/workout/:date?', name: 'workout', component: () => import('@/views/WorkoutView.vue') },
    { path: '/result', name: 'result', component: () => import('@/views/ResultView.vue') },
    { path: '/about', name: 'about', component: () => import('@/views/AboutView.vue') },
    { path: '/why', name: 'why', component: () => import('@/views/WhyProgramView.vue') },
  ],
})

router.beforeEach(async (to) => {
  const progress = useProgressStore()
  if (!progress.progress && progress.records.length === 0) {
    await progress.hydrate()
  } else if (progress.progress) {
    await progress.settleIfNeeded()
  }
  const needsOnboarding = !progress.progress
  if (needsOnboarding && !['onboarding', 'about', 'why'].includes(String(to.name))) {
    return { name: 'onboarding' }
  }
  if (!needsOnboarding && to.name === 'onboarding') {
    return { name: 'home' }
  }
})

export default router
