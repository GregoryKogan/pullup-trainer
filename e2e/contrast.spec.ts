import { test, expect, type Page } from '@playwright/test'
import { addDays, buildStatsHistory, gotoApp, prepareProgress, startWorkout } from './helpers/app'

const TODAY = '2026-08-18'
const MODES = ['dark', 'light'] as const

const SCREENS: { name: string; path: string }[] = [
  { name: 'home', path: '' },
  { name: 'calendar', path: '/calendar' },
  { name: 'stats', path: '/stats' },
  { name: 'settings', path: '/settings' },
  { name: 'about', path: '/about' },
  { name: 'why', path: '/why' },
]

async function findLowContrastText(page: Page) {
  return page.evaluate(() => {
    const channel = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
    const luminance = (c: number[]) =>
      0.2126 * channel(c[0] / 255) + 0.7152 * channel(c[1] / 255) + 0.0722 * channel(c[2] / 255)
    // Chrome serialises color-mix() as `color(srgb r g b / a)` with 0..1
    // components, and rgb()/rgba() with 0..255. Both show up here.
    const parse = (s: string): { rgb: number[]; alpha: number } | null => {
      const nums = (s.match(/[\d.]+/g) ?? []).map(Number)
      if (nums.length < 3) return null
      if (s.startsWith('color(')) {
        return { rgb: nums.slice(0, 3).map((v) => v * 255), alpha: nums[3] ?? 1 }
      }
      return { rgb: nums.slice(0, 3), alpha: nums[3] ?? 1 }
    }

    const opaqueBackground = (el: Element): number[] | null => {
      let node: Element | null = el
      while (node) {
        const parsed = parse(getComputedStyle(node).backgroundColor)
        if (parsed && parsed.alpha >= 0.95) return parsed.rgb
        node = node.parentElement
      }
      return null
    }

    const failures: { text: string; selector: string; ratio: number; needed: number }[] = []
    const seen = new Set<Element>()

    for (const el of Array.from(document.querySelectorAll('body *'))) {
      const ownText = Array.from(el.childNodes)
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent?.trim() ?? '')
        .join(' ')
        .trim()
      if (!ownText || seen.has(el)) continue
      seen.add(el)

      const style = getComputedStyle(el)
      if (style.visibility === 'hidden' || style.display === 'none' || style.opacity === '0') continue
      const rect = el.getBoundingClientRect()
      if (rect.width < 2 || rect.height < 2) continue

      const bg = opaqueBackground(el)
      if (!bg) continue
      // Contour numbers fill with the background colour on purpose; the ink
      // that is actually visible is the stroke, so measure that instead.
      const strokeWidth = parseFloat(style.webkitTextStrokeWidth || '0')
      const inkColor =
        strokeWidth > 0 && style.webkitTextStrokeColor ? style.webkitTextStrokeColor : style.color
      const fgParsed = parse(inkColor)
      if (!fgParsed || fgParsed.alpha < 0.95) continue
      const [hi, lo] = [luminance(fgParsed.rgb), luminance(bg)].sort((a, b) => b - a)
      const ratio = (hi + 0.05) / (lo + 0.05)

      const size = parseFloat(style.fontSize)
      const weight = Number(style.fontWeight) || 400
      const large = size >= 24 || (size >= 18.66 && weight >= 700)
      const needed = large ? 3 : 4.5

      if (ratio < needed) {
        const selector = `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''}`
        failures.push({
          text: ownText.slice(0, 40),
          selector,
          ratio: Number(ratio.toFixed(2)),
          needed,
        })
      }
    }
    return failures
  })
}

test.describe('rendered text contrast', () => {
  for (const mode of MODES) {
    for (const screen of SCREENS) {
      test(`${screen.name} ${mode}`, async ({ page }) => {
        await page.clock.setFixedTime(new Date(`${TODAY}T10:00:00`))
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
        expect(await findLowContrastText(page)).toEqual([])
      })
    }

    test(`workout ${mode}`, async ({ page }) => {
      await page.clock.setFixedTime(new Date(`${TODAY}T10:00:00`))
      await prepareProgress(page, { today: TODAY, anchor: 7, themeMode: mode })
      await startWorkout(page, TODAY)
      await expect(page.locator('.contour-number')).toBeVisible()
      expect(await findLowContrastText(page)).toEqual([])
    })
  }
})
