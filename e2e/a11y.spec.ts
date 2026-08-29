import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import {
  addDays,
  buildStatsHistory,
  dismissPwaModal,
  gotoApp,
  prepareFreshApp,
  prepareProgress,
  todayLocal,
  startWorkout,
} from './helpers/app'

const TODAY = todayLocal()

async function scan(page: Page) {
  return new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
}

function serious(results: Awaited<ReturnType<typeof scan>>) {
  return results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.map((n) => n.target.join(' ')),
    }))
}

const SCREENS: { name: string; path: string }[] = [
  { name: 'home', path: '' },
  { name: 'calendar', path: '/calendar' },
  { name: 'stats', path: '/stats' },
  { name: 'settings', path: '/settings' },
  { name: 'about', path: '/about' },
  { name: 'why', path: '/why' },
]

const MODES = ['dark', 'light'] as const

test.describe('accessibility', () => {
  for (const mode of MODES) {
    for (const screen of SCREENS) {
      test(`${screen.name} has no serious or critical axe violations (${mode})`, async ({ page }) => {
        await prepareProgress(page, {
          today: TODAY,
          anchor: 7,
          themeMode: mode,
          workoutRecords: buildStatsHistory(TODAY, 12),
          schedule: [
            { date: addDays(TODAY, -2), stepRef: 1 },
            { date: TODAY, stepRef: 2 },
            { date: addDays(TODAY, 2), stepRef: 3 },
          ],
        })
        await gotoApp(page, screen.path)
        expect(serious(await scan(page))).toEqual([])
      })
    }
  }

  test('onboarding has no serious or critical axe violations', async ({ page }) => {
    await prepareFreshApp(page)
    await gotoApp(page, '/onboarding')
    expect(serious(await scan(page))).toEqual([])
  })

  test('workout screen has no serious or critical axe violations', async ({ page }) => {
    await prepareProgress(page, { today: TODAY, anchor: 7 })
    await startWorkout(page, TODAY)
    expect(serious(await scan(page))).toEqual([])
  })

  test('PWA install modal has no serious or critical axe violations', async ({ page }) => {
    await prepareProgress(page, { today: TODAY, anchor: 7 })
    await page.goto('.')
    const modal = page.getByRole('button', { name: /continue in browser|продолжить/i })
    if (await modal.isVisible().catch(() => false)) {
      expect(serious(await scan(page))).toEqual([])
    }
    await dismissPwaModal(page)
  })

  test('touch targets on the tab bar meet the 44px minimum', async ({ page }) => {
    await prepareProgress(page, { today: TODAY, anchor: 7 })
    await gotoApp(page)
    const links = page.getByRole('navigation', { name: /main navigation|основная навигация/i }).getByRole('link')
    const count = await links.count()
    expect(count).toBeGreaterThan(0)
    for (let i = 0; i < count; i++) {
      const box = await links.nth(i).boundingBox()
      expect(box, `tab ${i} has no box`).not.toBeNull()
      expect(box!.height, `tab ${i} height`).toBeGreaterThanOrEqual(44)
      expect(box!.width, `tab ${i} width`).toBeGreaterThanOrEqual(44)
    }
  })
})
