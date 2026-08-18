import { test, expect } from '@playwright/test'
import { gotoApp, prepareSeededApp, prepareProgress, todayLocal } from './helpers/app'

const SECTION_TITLES_EN = [
  'The short version',
  'How the program works',
  'Entry test and levels',
  'Step generator: session(M*, k)',
  'Success, failure, deload, and retest',
  'Frequency: 3 sessions per week, 2 calendar days apart',
  'Volume: 5 sets × 3 workouts = 15 per week',
  'Working sets: submaximal descending reps',
  'Final set: maximum with a rising minimum',
  'Rest between sets: 3 minutes by default',
  'Missed workouts and returning after a break',
  'Patterns we rejected',
  'Honest limits',
]

const SECTION_TITLES_RU = [
  'Коротко',
  'Как устроена программа',
  'Входной тест и уровни',
  'Генератор шагов: session(M*, k)',
  'Успех, провал, разгрузка и повторный тест',
  'Частота: 3 тренировки в неделю, пауза от 2 календарных дней',
  'Объём: 5 подходов × 3 тренировки = 15 в неделю',
  'Рабочие подходы: убывающая лесенка',
  'Финальный подход: максимум с растущим минимумом',
  'Отдых между подходами: 3 минуты по умолчанию',
  'Пропуски и возврат после перерыва',
  'От чего отказались',
  'Честные ограничения',
]

const FORMULA_EXAMPLES_EN = [
  'Levels from test result M',
  'M*=7 → 5,5,5,4',
  'M*=7: N_1…N_6 = 5,6,7,8,8,8 (cap 8)',
  'M*=7 → 6; M*=3 → 2',
  "Best final = 8, M*=7 → M*' = 8",
  'A formal max test resets M*',
]

const FORMULA_EXAMPLES_RU = [
  'Уровни по результату теста M',
  'M*=7 → 5,5,5,4',
  'M*=7: N_1…N_6 = 5,6,7,8,8,8 (потолок 8)',
  'M*=7 → 6; M*=3 → 2',
  "Лучший финал = 8, M*=7 → M*' = 8",
  'Тест максимума задаёт новый M*',
]

test.describe('Science page EN', () => {
  test.beforeEach(async ({ page }) => {
    await prepareSeededApp(page, 7, todayLocal())
    await gotoApp(page, '/why')
  })

  test('renders intro and all section titles', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Why this program' })).toBeVisible()
    for (const title of SECTION_TITLES_EN) {
      await expect(page.getByRole('heading', { name: title })).toBeVisible()
    }
  })

  test('renders all formula examples from science copy', async ({ page }) => {
    for (const example of FORMULA_EXAMPLES_EN) {
      await expect(page.getByText(example)).toBeVisible()
    }
  })

  test('lists 35 sources with external links and metadata', async ({ page }) => {
    await page.locator('#sources').scrollIntoViewIfNeeded()
    const sourceItems = page.locator('#sources li')
    await expect(sourceItems).toHaveCount(35)
    const firstLink = page.locator('#sources a[target="_blank"]').first()
    await expect(firstLink).toHaveAttribute('rel', 'noopener')
    await expect(page.getByRole('link', { name: /Ralston et al\. Weekly set/i })).toBeVisible()
    await expect(page.getByText('Sports Med, 2017').first()).toBeVisible()
    await expect(page.getByText('Multiple sources').first()).toBeVisible()
    await expect(page.getByText('Extrapolation').first()).toBeVisible()
  })

  test('citation links point to source anchors', async ({ page }) => {
    const cites = page.locator('a.cite')
    const count = await cites.count()
    expect(count).toBeGreaterThan(5)
    for (let i = 0; i < Math.min(count, 10); i++) {
      const href = await cites.nth(i).getAttribute('href')
      expect(href).toMatch(/^#source-\d+$/)
    }
    await expect(cites.first()).toHaveAttribute('href', '#source-1')
  })
})

test.describe('Science page RU', () => {
  test.beforeEach(async ({ page }) => {
    await prepareProgress(page, { anchor: 7, today: todayLocal(), language: 'ru' })
    await gotoApp(page, '/why')
  })

  test('renders intro and all section titles', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Почему такая программа' })).toBeVisible()
    for (const title of SECTION_TITLES_RU) {
      await expect(page.getByRole('heading', { name: title })).toBeVisible()
    }
  })

  test('renders all formula examples from science copy', async ({ page }) => {
    for (const example of FORMULA_EXAMPLES_RU) {
      await expect(page.getByText(example)).toBeVisible()
    }
  })

  test('lists 35 sources with RU badges', async ({ page }) => {
    await page.locator('#sources').scrollIntoViewIfNeeded()
    await expect(page.locator('#sources li')).toHaveCount(35)
    await expect(page.getByText('Несколько источников').first()).toBeVisible()
    await expect(page.getByText('Экстраполяция').first()).toBeVisible()
  })
})
