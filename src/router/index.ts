import { createRouter, createWebHistory } from 'vue-router'
import { useProgressStore } from '@/stores/progress'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
    { path: '/calendar', name: 'calendar', component: () => import('@/views/CalendarView.vue') },
    { path: '/stats', name: 'stats', component: () => import('@/views/StatsView.vue') },
    { path: '/settings', name: 'settings', component: () => import('@/views/SettingsView.vue') },
    { path: '/onboarding', name: 'onboarding', component: () => import('@/views/OnboardingView.vue') },
    { path: '/workout/:date?', name: 'workout', component: () => import('@/views/WorkoutView.vue') },
    { path: '/result', name: 'result', component: () => import('@/views/ResultView.vue') },
    { path: '/programs', name: 'programs', component: () => import('@/views/programs/ProgramsListView.vue') },
    {
      path: '/programs/:id/edit',
      name: 'program-edit',
      component: () => import('@/views/programs/ProgramEditView.vue'),
    },
    { path: '/about', name: 'about', component: () => import('@/views/AboutView.vue') },
    { path: '/why', name: 'why', component: () => import('@/views/WhyProgramView.vue') },
  ],
})

router.beforeEach(async (to) => {
  const progress = useProgressStore()
  if (!progress.progress && progress.records.length === 0) {
    await progress.hydrate()
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
