---
name: release-check
description: Чеклист проверок Pull-up Trainer перед коммитом, пушем и релизом — какие из команд typecheck/lint/test/coverage/e2e/a11y/visual/size/audit нужны под конкретный тип изменения, и как обновлять README-скриншоты и PWA-иконки. Загружать перед коммитом, перед пушем в main и при подготовке релиза.
---

# Чеклист перед коммитом и релизом

## Базовый минимум (всегда)

```bash
npm run typecheck && npm run lint && npm run test
```

Ниже этого не коммитить. `lint` работает с `--max-warnings 0` — предупреждение = ошибка.

## Что добавить по типу изменения

| Трогал | Дополнительно |
|---|---|
| `src/domain/`, `src/stores/`, `src/db/` | `npm run test:coverage` — пороги там выше |
| формулы программы | `npm run audit:science` (скил `science-page`) |
| `src/i18n/locales/science/` | `npm run audit:science` |
| любой `.vue`, стили, темы | `npm run test:visual` |
| экраны, интерактив, a11y | `npm run test:a11y` |
| цвета, токены, палитры | `npm run test:contrast` — axe этот класс регрессий не ловит |
| UI-поток, роутинг, PWA | `npm run test:e2e` |
| зависимости, импорты | `npm run size` — бюджет бандла |
| производительность, PWA | `npm run lighthouse` |
| палитры, `build-assets.py` | `python3 spec/design/build-assets.py`, затем `test:visual` |
| иконки приложения | `npm run sync:icons` (входит в `build`) |

Полный прогон, когда сомневаешься:

```bash
npm run typecheck && npm run lint && npm run test:coverage && \
npm run audit:science && npm run size && npm run test:e2e && npm run lighthouse
```

`test:e2e` уже включает `a11y` и `contrast`. Отдельно они нужны для быстрой итерации.

## Обновление визуальных эталонов

Эталоны сняты на macOS и привязаны к платформе, поэтому в CI (Linux) `test:visual`
пропускается — это локальный гейт, включается через `VISUAL=1`.

**Сначала убей залипший preview-сервер.** У Playwright `reuseExistingServer: true` вне CI:
если на 4173 уже висит сервер, `npm run build` не отработает и тесты пройдут по старому
`dist` — правки стилей просто не попадут в проверку.

```bash
lsof -ti:4173 | xargs kill -9
```

Диффы в `test:visual` — **сначала посмотреть глазами**, отчёт лежит в `playwright-report/`.
Тени, рамки и токены ломаются именно здесь и больше нигде.

```bash
npm run test:visual -- --update-snapshots
```

Эталоны коммитятся вместе с изменением вёрстки. Обновлять их «чтобы позеленело», не
разобравшись в дифе, — способ незаметно сломать дизайн-систему.

## README-скриншоты

Только когда экраны реально изменились внешне:

```bash
npm run screenshots:readme
```

Гоняет Playwright на Mobile Chrome и пересобирает `docs/readme/app-screenshots.svg`.

## Коммит и пуш

- Коммитить и пушить на своё усмотрение после каждого логического изменения, явной просьбы не ждать.
- Сообщения — английский, imperative, кратко.
- Не коммитить сломанный код, временные файлы, `test-results/`, `playwright-report/`.
- Перед пушем в `main` — прогнать `code-review-and-quality` (5 осей: correctness, readability,
  architecture, security, performance; правило «approve if it improves overall code health»).

## Релиз

1. Поднять `version` в `package.json` (она попадает в экспорт истории как `appVersion`).
2. Менялся формат данных — поднять `schemaVersion` и Dexie schema version (скил `program-core`).
3. Полный прогон проверок выше.
4. Пуш в `main` → CI сам собирает и деплоит на GitHub Pages.
5. Проверить живой PWA: обновление service worker, офлайн после первого визита, установка.
