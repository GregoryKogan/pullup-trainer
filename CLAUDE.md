# Pull-up Trainer

Local-first SPA PWA (Vue 3 + Vite + TypeScript) для тренировки подтягиваний. Одна встроенная
научно обоснованная программа. Полный офлайн, установка как PWA, хостинг GitHub Pages.
Без бэкенда, аккаунтов, внешних сервисов и монетизации.

Репозиторий: `github.com/GregoryKogan/pullup-trainer`, ветка `main`.

## Команды

```bash
npm run dev              # дев-сервер
npm run typecheck        # vue-tsc
npm run lint             # eslint --max-warnings 0
npm run test             # vitest run
npm run test:coverage    # vitest + пороги покрытия
npm run test:e2e         # playwright (сам поднимает preview)
npm run test:a11y        # axe по всем экранам (dark + light)
npm run test:visual      # визуальные регрессии, локально (VISUAL=1)
npm run build            # sync-pwa-icons + vue-tsc -b + vite build
npm run size             # бюджет бандла
npm run lighthouse       # Lighthouse с порогами из lighthouserc.json
npm run audit:science    # сверка страницы «Почему программа такая» с генератором
```

## Ядро программы

Чистая функция `session(M*, k)` в `src/domain/session.ts`. Таблицы шагов НЕ хранить —
хранить состояние и генерировать шаги на лету.

- Цикл = 6 шагов (k = 1…6); тренировка = 5 подходов.
- Подходы 1–4 (рабочие): `ceil(0.7·M*)`, `ceil(0.6·M*)`, `ceil(0.6·M*)`, `ceil(0.5·M*)`, минимум 1.
- Подход 5 — тип «Максимум», минимум `N_k = min(ceil(0.6·M*) + k − 1, M* + 1)`.

Эталонные значения (обязательные юнит-тесты):

| M* | рабочие подходы | N_1…N_6 |
|---|---|---|
| 3 | 3,2,2,2 | 2,3,4,4,4,4 |
| 7 | 5,5,5,4 | 5,6,7,8,8,8 |
| 15 | 11,9,9,8 | 9,10,11,12,13,14 |
| 25 | 18,15,15,13 | 15,16,17,18,19,20 |

Прогрессия:

- **Успех** (все подходы выполнены, финальный ≥ N_k) → следующий шаг k+1.
- **Провал** (любой подход недобран или финальный < N_k) → повтор того же шага.
- **Два провала подряд на одном шаге** → авто-делоад `M* := floor(0.9·M*)` (мин. 1).
- **Конец цикла** (6 успешных шагов): `M*' = max(лучший подход 5 за цикл, M* − 1)`, новый цикл с шага 1.
- **Ретест** каждые 2 цикла (≈4 недели при 3×/нед) и после перерыва >2 недель.

Уровни по тесту M: 1–4 → L1 «Новичок»; 5–9 → L2 «База»; 10–19 → L3 «Средний»; 20+ → L4
«Продвинутый». Уровень — только метка. **Минимальный допустимый M = 1**.

Подробности расписания, пропусков и переносов — скил `program-core`.

## Модель данных

IndexedDB через Dexie, schema version 4. Таблицы: `settings`, `activeProgress`,
`workoutRecords`, `appMeta`.

Два формата экспорта: `pullup-trainer-history.json` (`format: "pullup-trainer.history"`,
плоская структура для ИИ) и `pullup-trainer-backup.json` (`format: "pullup-trainer.backup"`,
полная замена состояния при импорте). Оба — `schemaVersion` 4, валидация `format` +
`schemaVersion` при импорте. Читатель обязан игнорировать неизвестные поля.

Ломающие изменения формата — только с повышением `schemaVersion` и обновлением
`src/domain/export.test.ts`. Полная схема — скил `program-core`.

## Дизайн-система

Poster / Swiss. Спека: `spec/design/poster-design.md`. Токены: `spec/design/theme-tokens.css`.
Пересборка ассетов: `python3 spec/design/build-assets.py`.

Плоские заливки, рамки 2px, радиус 2px везде, офсетные тени 4–5px сплошным цветом, гигантские
контурные цифры, капс-заголовки. **БЕЗ градиентов, блюра, свечений, скруглений, эмодзи.**
Иконки — inline SVG.

Все цвета ТОЛЬКО из переменных: `--bg`, `--bg2`, `--card`, `--ink`, `--muted`, `--line`,
`--accent`, `--accent-ink`, `--accent2`, `--ok`, `--warn`, `--bad`, `--shadow`.
Голый CSS + токены, без CSS-фреймворков и компонентных библиотек.

14 палитр P01–P14 × light/dark. Механика: `data-theme="<slug>-<mode>"` на `<html>`, режим
`system` резолвится через `prefers-color-scheme`. Дефолт — P01 Volt + system.

Тач-цели ≥44px (кнопки 50px), контраст ≥4.5:1, `prefers-reduced-motion` отключает
transform-анимации. Подробности — скил `poster-design`.

## Конвенции кода

- SFC `<script setup lang="ts">`, Composition API, strict TS. Никогда Options API.
- **Без комментариев в коде**, если их явно не попросили.
- Имена: файлы kebab-case, компоненты PascalCase, функции camelCase, константы UPPER_SNAKE.
- Логика программы — чистые функции без побочных эффектов (`session(M*, k)` — эталон).
- Не добавлять библиотеки без необходимости. Бюджет: старт ≤2 с, лимиты в `.size-limit.json`.
- i18n: **EN — язык по умолчанию**, RU — вторичный. Ключи в `en.json` и `ru.json` должны
  совпадать один в один, это проверяется тестом `src/i18n/locales.test.ts`.

## Проверка перед коммитом

Обязательный минимум: `npm run typecheck && npm run lint && npm run test`.
Трогал UI — плюс `npm run test:e2e`. Трогал темы или вёрстку — плюс `npm run test:visual`.
Полный чеклист — скил `release-check`.

Коммитить и пушить на своё усмотрение после каждого логического изменения, явной просьбы
ждать не нужно. Не коммитить сломанный код и временный мусор. Сообщения коммитов —
английский, imperative, кратко.

## PWA и платформы

- GitHub Pages, base path `/pullup-trainer/` — согласован в `vite.config.ts` и scope SW.
- Полный офлайн после первого визита, `display: standalone`.
- iOS Safari: детекция установленного PWA через `display-mode: standalone` ИЛИ
  `navigator.standalone === true`. Данные только в IndexedDB.
- Экран установки PWA обязателен: полноэкранный modal при открытии во вкладке браузера,
  автоопределение платформы по User-Agent, `beforeinstallprompt` на Chromium, на iOS —
  только инструкция Share → Add to Home Screen.

## Жёсткие запреты продукта

- Без монетизации: ни рекламы, ни донатов, ни пейволов, ни подписок.
- Без аккаунтов, облачной синхронизации, ИИ-коучинга, камеры, соцсетей, лидербордов.
- Без голосовых подсказок и фоновой музыки; короткий звук окончания отдыха — под Notify.
- Без напоминаний в v1 (нереализуемо в статическом PWA).
- Mobile-first; десктоп просто должен работать.
- Страница «Почему программа такая» — только ОТКРЫТЫЕ источники, все формулы с примерами
  подстановки, честные пометки об экстраполяциях.

## Инструменты

MCP в `.mcp.json`: `chrome-devtools` (Lighthouse, perf-трейсы, отладка live-страницы),
`context7` (актуальная дока Vue / Vite / Dexie / vue-i18n). Оба требуют подтверждения
при старте сессии.

Версия Node — в `.nvmrc`, CI читает её оттуда. Не задавать версию в workflow вручную.

Визуальные эталоны привязаны к платформе и сняты на macOS, поэтому `test:visual`
не гоняется в CI (Linux) — это локальный гейт под `VISUAL=1`.

**Осторожно с preview-сервером.** У Playwright `reuseExistingServer: true` вне CI: если
на 4173 уже висит сервер, сборка не пересобирается и тесты идут по старому `dist`.
Перед прогоном после правок в стилях — `lsof -ti:4173 | xargs kill -9`.

## Скилы

`program-core`, `poster-design`, `science-page`, `release-check` — проектные.
`vue-core`, `vue-testing`, `code-review-and-quality`, `humanizer`, `humanizer-ru` — общие.
