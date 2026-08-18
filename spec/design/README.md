# Design — Poster / Swiss

Дизайн-система приложения: язык **Poster / Swiss**,
14 цветовых тем, в каждой — тёмный и светлый режим.

Полная спека: [`poster-design.md`](poster-design.md) (экраны, компоненты, a11y).

## Структура

```
design/
├── README.md          ← этот файл
├── poster-design.md   ← спека дизайн-языка (источник правды)
├── theme-tokens.css   ← все палитры как CSS custom properties
├── build-assets.py    ← генератор мокапов, токенов и этого README
├── mockups/           ← HTML-мокап P01 Volt (10 экранов + index)
└── assets/            ← графика: логотип, иконки, паттерны
```

Runtime-стили приложения: [`src/assets/styles/main.css`](../../src/assets/styles/main.css)
(импортирует `theme-tokens.css`).

## Темы

| № | Имя | data-theme | Характер |
|---|---|---|---|
| P01 | Volt | `p01-volt-dark` / `p01-volt-light` | эталонный неон-зелёный |
| P02 | Signal Orange | `p02-signal-orange-dark` / `p02-signal-orange-light` | сигнально-оранжевый |
| P03 | Cobalt | `p03-cobalt-dark` / `p03-cobalt-light` | электрик-синий |
| P04 | Magenta Pop | `p04-magenta-pop-dark` / `p04-magenta-pop-light` | неоновая магента |
| P05 | Taxi | `p05-taxi-dark` / `p05-taxi-light` | такси-жёлтый |
| P06 | Paper Red | `p06-paper-red-dark` / `p06-paper-red-light` | швейцарский ч/б + красный |
| P07 | Mint Terminal | `p07-mint-terminal-dark` / `p07-mint-terminal-light` | мятный терминал |
| P08 | Amber | `p08-amber-dark` / `p08-amber-light` | янтарный / строительный |
| P09 | Cyan Future | `p09-cyan-future-dark` / `p09-cyan-future-light` | циановое будущее |
| P10 | Crimson | `p10-crimson-dark` / `p10-crimson-light` | тёмно-красный |
| P11 | Spring Green | `p11-spring-green-dark` / `p11-spring-green-light` | весенний зелёный |
| P12 | Ultraviolet | `p12-ultraviolet-dark` / `p12-ultraviolet-light` | фиолетовый |
| P13 | Coral Sunrise | `p13-coral-sunrise-dark` / `p13-coral-sunrise-light` | коралловый рассвет |
| P14 | Mono Ink | `p14-mono-ink-dark` / `p14-mono-ink-light` | чистая инверсия ч/б |

По умолчанию: **P01 Volt**, режим **system** (тёмный/светлый по настройке ОС).

## Как использовать в приложении

1. Подключить `theme-tokens.css` через `main.css`.
2. Установить на `<html>` атрибут `data-theme="<slug>-<mode>"`, mode = dark | light.
3. Настройки: выбор палитры (P01–P14) + режим light / dark / system;
   system резолвится через `prefers-color-scheme`.
4. Все компоненты используют только переменные: `--bg`, `--bg2`, `--card`,
   `--ink`, `--muted`, `--line`, `--accent`, `--accent-ink`, `--accent2`,
   `--ok`, `--warn`, `--bad`, `--shadow`.

## Мокапы

`mockups/poster-p01-volt.html` — 10 экранов в дефолтной палитре P01 Volt:
Home, Workout, Calendar, Stats, Settings, Onboarding, Result, PWA install, About, Why program.

Графические ассеты — в `assets/` (см. `assets/README.md`).

Пересборка: `python3 build-assets.py`.
