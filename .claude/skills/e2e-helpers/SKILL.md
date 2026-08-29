---
name: e2e-helpers
description: API хелперов Playwright в e2e/helpers/app.ts для Pull-up Trainer — сидирование IndexedDB, навигация, прохождение тренировки, чтение состояния, и грабли (base path, модалка PWA, залипший preview-сервер, зависимость от даты). Загружать при написании или починке любой спеки в e2e/, включая a11y, contrast и visual.
---

# e2e-хелперы

Все спеки в `e2e/` работают через `e2e/helpers/app.ts` (~505 строк, 29 экспортов).
Прямой `page.goto` и ручная возня с IndexedDB — почти всегда ошибка: хелперы уже решают
базовый путь, модалку установки и гидратацию.

## Подготовка состояния

| Функция | Что делает |
|---|---|
| `prepareFreshApp(page)` | чистое состояние → онбординг |
| `prepareSeededApp(page, anchor, today)` | быстрый сид: якорь + слот на сегодня |
| `prepareProgress(page, options)` | полный контроль (главный инструмент) |
| `prepareFreshAppKeepPwa(page)` | чистое состояние, но модалку PWA не закрывать |

`prepareProgress` делает reset → seed → reload → закрыть модалку → дождаться главной.
После него приложение **на главной**, а не там, куда ты собирался.

### `SeedOptions`

```ts
anchor, today, stepRef, schedule, lastWorkoutDate,
frequencyDays (2|3), weekdays, state, language ('en'|'ru'),
palette, themeMode ('dark'|'light'|'system'),
restDurationSeconds, restAutoStart, workoutRecords
```

`state` перекрывает генератор: `anchor`, `level`, `cycleIndex`, `stepInCycle`, `failStreak`,
`lastRetestDate`, `lastRetestCycleIndex`, `cycleBestMax`. `level` считается из якоря, если не задан.

## Навигация

- `gotoApp(page, path)` — единственный правильный способ. Он **срезает ведущий слеш**, потому
  что base path приложения `/pullup-trainer/`. Абсолютный путь в `page.goto('/calendar')`
  затрёт base и даст 404-страницу Vite.
- `startWorkout(page, date)` — жмёт START, иначе переходит по адресу; дожидается `/workout/`,
  закрывает модалку, снимает гейт отдыха.
- `dismissPwaModal(page)`, `clearRestGate(page)` — точечно, если нужно вручную.

## Прохождение тренировки

| Функция | Сценарий |
|---|---|
| `completeWorkout(page, maxReps)` | все 5 подходов → `/result` |
| `failWorkoutEarly(page)` | выход посреди тренировки → провал |
| `failWorkoutFinalShort(page, maxReps)` | недобор финального подхода |
| `seedActiveWorkoutSession(page, date)` | начатая тренировка, уход на календарь |

## Проверки и чтение

- `assertSetTargets(page, [5,5,5,4,5])` — сверить карточки подходов с генератором.
- `readProgress(page)` / `readRecords(page)` — прочитать IndexedDB напрямую.
- `assertNoTextOverlap(page, chartIndex, selector)` — наложение подписей на графиках.
- `seedWorkoutRecord(page, record)`, `setLanguageRu(page)`.

## Даты

`todayLocal()`, `addDays(iso, n)`, `startOfWeek(iso)`, `buildStatsHistory(today, count)`.

## Грабли

**Заморозь часы, если сравниваешь скриншоты или завязан на календарь.** Спеки, которые сидируют
`todayLocal()`, ломаются на смене суток — это реально случилось с `calendar.spec.ts`.

```ts
await page.clock.setFixedTime(new Date('2026-08-18T10:00:00'))
```

Ставить **до** `prepareProgress`. `setFixedTime` фиксирует `Date.now()`, но не глушит таймеры,
в отличие от `clock.install` — для этого приложения нужен именно первый.

**Прошлые слоты в расписании съедают сегодняшний.** При `hydrate()` слот с `date < today` без
записи автоматически становится провалом, прогрессия и расписание сдвигаются. Сид вида
«история + слот на сегодня» приводит к экрану «Could not load this workout». Для экрана
тренировки бери чистый сид: `{ today, anchor }` и один слот.

**Полная перезагрузка возвращает модалку установки.** Она показывается при каждом запуске, пока
приложение не установлено. `prepareProgress` её закрывает, но любой последующий `page.goto`
(не SPA-переход) вернёт её. `startWorkout` это уже учитывает.

**Залипший preview-сервер отдаёт старую сборку.** Вне CI у Playwright `reuseExistingServer: true`:
если на 4173 уже висит сервер, `npm run build` не выполняется и тесты идут по прошлому `dist`.
Правки стилей просто не попадут в проверку.

```bash
lsof -ti:4173 | xargs kill -9
```

**Проекты.** `test:e2e` гоняет Mobile Chrome и Desktop Chrome; `test:visual`, `test:a11y` и
`test:contrast` — только Mobile Chrome. Визуальные эталоны привязаны к платформе и включаются
через `VISUAL=1`, поэтому в CI (Linux) пропускаются.

## Специализированные наборы

- `e2e/a11y.spec.ts` — axe по экранам в обеих темах. Проверяет только `violations`;
  контраст axe часто относит в `incomplete`, потому что не может определить фон под
  фоновым паттерном.
- `e2e/contrast.spec.ts` — то, что axe не может: считает контраст по отрендеренным цветам,
  разбирая и `rgb()`, и `color(srgb ...)` (в него Chrome сериализует `color-mix`), с учётом
  обводки текста и порогов для крупного шрифта. **Именно эта спека ловит регрессии токенов.**
- `e2e/visual.spec.ts` — 43 эталона. Допуски заданы в `playwright.config.ts`
  (`threshold: 0.02`, `maxDiffPixels: 0`); ослаблять их нельзя, дефолты Playwright прячут
  смену цвета на мелком тексте.
