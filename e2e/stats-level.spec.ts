import { test, expect } from '@playwright/test'
import { prepareSeededApp, todayLocal } from './helpers/app'

const LEVEL_CASES = [
  { anchor: 1, label: /beginner|новичок/i },
  { anchor: 7, label: /base|база/i },
  { anchor: 10, label: /intermediate|средний/i },
  { anchor: 20, label: /advanced|продвинутый/i },
] as const

test.describe('Level label on stats', () => {
  for (const { anchor, label } of LEVEL_CASES) {
    test(`shows level for M=${anchor} on stats screen`, async ({ page }) => {
      await prepareSeededApp(page, anchor, todayLocal())
      await page.getByRole('link', { name: 'Stats' }).click()
      await expect(page.getByText(label)).toBeVisible()
    })
  }
})
