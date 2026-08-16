import { test, expect } from '@playwright/test'
import { gotoApp, prepareSeededApp, todayLocal } from './helpers/app'

const SECTION_TITLES = [
  'The short version',
  'How the program works',
  'Entry test and levels',
  'Step generator: session(M*, k)',
  'Success, failure, deload, and retest',
  'Frequency: 3 sessions per week, 48 hours apart',
  'Volume: 5 sets × 3 workouts = 15 per week',
  'Working sets: submaximal descending reps',
  'Final set: maximum with a rising minimum',
  'Rest between sets: 3 minutes by default',
  'Missed workouts and returning after a break',
  'Patterns we rejected',
  'Honest limits',
]

test.describe('Science page', () => {
  test.beforeEach(async ({ page }) => {
    await prepareSeededApp(page, 7, todayLocal())
    await gotoApp(page, '/why')
  })

  test('renders intro and all section titles', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Why this program' })).toBeVisible()
    for (const title of SECTION_TITLES) {
      await expect(page.getByRole('heading', { name: title })).toBeVisible()
    }
  })

  test('renders formula examples from science copy', async ({ page }) => {
    await expect(page.getByText('Levels from test result M')).toBeVisible()
    await expect(page.getByText('M*=7 → 5,5,5,4')).toBeVisible()
    await expect(page.getByText('M*=7: N_1…N_6 = 5,6,7,8,8,8 (cap 8)')).toBeVisible()
  })

  test('lists 35 sources with external links', async ({ page }) => {
    await page.locator('#sources').scrollIntoViewIfNeeded()
    const sourceItems = page.locator('#sources li')
    await expect(sourceItems).toHaveCount(35)
    await expect(page.locator('#sources a[target="_blank"]').first()).toBeVisible()
    await expect(page.getByRole('link', { name: /Ralston et al\. Weekly set/i })).toBeVisible()
  })

  test('citation links point to source anchors', async ({ page }) => {
    await expect(page.locator('a.cite').first()).toHaveAttribute('href', '#source-1')
  })
})
