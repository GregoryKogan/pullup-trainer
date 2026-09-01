# Poster / Swiss — дизайн-спецификация

Единственный дизайн-язык продукта Pull-up Trainer. Эталонная палитра — **P01 Volt**;
HTML-мокап: `mockups/poster-p01-volt.html`.

> **Роль мокапов:** HTML-мокапы передают **идею стиля** — характер, палитру, типографику, паттерны компонентов. Это **не** pixel-perfect карты UI. При аудите экранов приоритет — логика, UX и a11y; мокапы — ориентир «как должно ощущаться».
>
> **Источник правды для runtime:** [`src/assets/styles/main.css`](../../src/assets/styles/main.css) + scoped-стили во views/components. Токены — [`theme-tokens.css`](theme-tokens.css). Этот документ описывает фактическую реализацию.

## Характер

Спортивный плакат в швейцарской традиции: плоские поверхности, жёсткие чёрные правила,
офсетные (смещённые) тени, гигантские цифры, капс-заголовки, неоновые «плашки»-лейблы.
Максимум типографской энергии при минимуме декора. Никаких градиентов, блюра, свечений,
скруглений (радиус 2px везде) — «печатный» характер, который хорошо переносит i18n.

Допустимы **полупрозрачные overlay** через `color-mix()` (модалки, tab bar chips) —
это осознанное отступление от «чистой плоскости» ради читаемости поверх контента.

## Принципы

1. **Плоскость.** Заливки + рамка 2px. Радиус 2px. Без градиентов и блюра.
2. **Жёсткие тени.** Офсет `4–5px 4–5px 0` сплошным `--shadow` — главный «объём».
3. **Типографика — главный герой.** Числа огромные и контурные, заголовки капсом, подписи — mono caps.
4. **Плашки-kicker.** Акцентная заливка, рамка, тень 3px — заголовок раздела как знак препинания.
5. **Один акцент + accent2.** Семантика (ok/warn/bad) — отдельная тройка, не пересекается с акцентом палитры.

## Реализация в приложении

```
theme-tokens.css  ← 14 CSS-переменных × 14 палитр × dark/light
       ↓ @import
main.css          ← глобальные utility-классы, layout shell
       ↓
Vue SFC           ← scoped layout/state; глобальные классы в template
```

- Атрибут темы: `data-theme="<slug>-<light|dark>"` на `<html>`.
- Режим **system** (дефолт) резолвится через `prefers-color-scheme` в [`settings.ts`](../../src/stores/settings.ts).
- Дефолт палитры: **p01-volt** + **system**.
- `meta theme-color` синхронизируется с вычисленным `--bg`.
- Все цвета в коде — **только через CSS-переменные**; hardcoded hex в компонентах запрещён.

## Layout shell

| Параметр | Значение |
|---|---|
| Контейнер | `.app-shell` — max-width **480px**, centered, padding **0 18px** |
| Высота | `100dvh`, flex column |
| Фон | `var(--bg)` + паттерн `assets/patterns/swiss-grid.svg` через `.app-shell::before` (в dark — `filter: invert(1)`) |
| Scroll | `.app-main` — overflow-y auto; scrollbars скрыты глобально |
| Workout | `.app-main--fit` — overflow hidden, full-viewport без tab bar |
| Safe area | tab bar, modals, workout dock — `env(safe-area-inset-*)` |
| Touch | `touch-action: manipulation`, zoom prevention |

## Типографика

| Роль | Стек | Размер / регистр |
|---|---|---|
| Body | `system-ui, -apple-system, 'Segoe UI', sans-serif` | **15px / 1.45** |
| Заголовки экранов (`h1`, `h2`) | `"Arial Black", system-ui` | **1.8rem** / uppercase, **+0.02em** |
| Контурная цифра (workout) | `"Arial Black"` via [`ContourNumber`](../../src/components/workout/ContourNumber.vue) | `clamp(5rem, min(28vw, 26vh), 9rem)` |
| KPI / tile (`.tile .big`) | display | **2.4rem** |
| Названия секций (`h4`) | display | ~0.95–1rem / uppercase |
| Kicker, лейблы, кнопки-утилиты | `ui-monospace, 'SF Mono', Menlo` | 0.62–0.88rem / uppercase, tracking |
| Подписи (`.sub`) | sans | 0.8rem, `var(--muted)` |

Правило: **числа и подписи — mono, заголовки — display, абзацы — sans**.

Контурная цифра — **`-webkit-text-stroke` + `paint-order: stroke fill`**: fill `var(--bg)` поверх stroke маскирует артефакты суб-контуров на iOS; stroke `0.05em var(--accent)`.

## Цветовые токены

14 переменных на тему: `--bg`, `--bg2`, `--card`, `--ink`, `--muted`, `--line`, `--accent`, `--accent-ink`, `--accent-text`, `--accent2`, `--ok`, `--warn`, `--bad`, `--shadow`.

### P01 Volt — dark (эталон)

| Токен | Значение | Роль |
|---|---|---|
| `--bg` | `#0E0E0B` | фон экрана |
| `--bg2` | `#070706` | треки, фон сегментов, switch off |
| `--card` | `#161612` | поверхности панелей |
| `--ink` | `#F7F7F0` | основной текст |
| `--muted` | `#A3A397` | вторичный текст |
| `--line` | `#000000` | все рамки |
| `--accent` | `#C6FF3B` | kicker, primary, контур цифры, tab-bar, meter |
| `--accent-text` | `#C6FF3B` | акцент как **цвет текста** (в светлых палитрах темнее `--accent`) |
| `--accent-ink` | `#0E0E0B` | текст на акценте |
| `--accent2` | `#FFD22E` | streak chip, planned days, focus outline |
| `--ok` / `--warn` / `--bad` | `#4CE08A` / `#FFC24D` / `#FF5D4D` | семантика |
| `--shadow` | `#000000` | офсетные тени |

### Светлая тема

Та же система, инвертированная по «бумажному» принципу: `--bg` — тёплая бумага, `--card` — белый; рамки и тени остаются тёмными; акцент и семантика затемняются для контраста AA. Конкретные пары — в `theme-tokens.css` и мокапе `poster-p01-volt.html`.

## Глобальные классы (`main.css`)

### Поверхности и типографика

- **`.kicker`** — accent fill, mono caps 0.68rem, shadow 3px, padding 4×9px.
- **`.panel`** — card bg, shadow 5px, padding 16px.
- **`.sec`** — как panel, padding 14px; `h4` с нижней полосой 3px.
- **`.head`** — flex header; `h1/h2` display caps.
- **`.subpage-head`** — back button + title stack для подстраниц.
- **`.sub`** — muted 0.8rem.
- **`.grid2`** / **`.tile`** — KPI-плашки, всегда одна колонка. `.tile` — строка `kicker слева / .big справа`, без вертикального пустого места.

### Кнопки

- **`.btn`** — min-height **50px**, full width, display caps, shadow 4px; active: translate(3px,3px) → shadow 1px (отключается в `prefers-reduced-motion`); `:disabled` — opacity 0.4, без тени, без press-анимации.
- **`.btn.accent`** — accent fill + accent-ink text.
- **`.btn.ghost`** — transparent, muted text.
- **`.btn.outline`** — card fill, ink text (Dismiss в PWA modal).
- **`.btn.destructive`** — `--bad` fill, `--bg` text; primary в подтверждении необратимого
  действия (сброс данных), чтобы «Подтвердить» не выглядел как happy path.
- **`.btnrow`** — horizontal flex, gap 10px; сбрасывает margin-top у кнопок.
- **`.iconbtn`** — 44×44, shadow 3px; active: translate(2px,2px) → shadow 1px; `.inactive`/`:disabled` — opacity 0.35, без тени и press-анимации.
- **`.text-link`** — underline, min-height 44px.

### Формы

- **`.setrow`** — key (mono) / value, min-height 50px, border-bottom 2px.
- **`.seg`** — segmented control на `--bg2`; кнопки — mono **caps**; active `.on` — accent fill (`accent-ink` на `accent`), как у всех выбранных контролов; press у неактивной — подсветка `color-mix(ink 16%)`.
- **`.sw`** — square toggle **54×44px**, thumb 20×20 по центру по вертикали; `.on` — accent fill, thumb уезжает вправо; active: translate(2px,2px).

### Навигация

- **`.tabbar`** — full-bleed accent strip (`margin: 0 -18px`), border-top 3px; inactive — chips с `color-mix(accent-ink 8%/35%)`; active `.on` — bg chip, accent text.

### Modals

- **`.modal-overlay`** — fixed, flex-end; backdrop `color-mix(shadow 60%)` / light: `color-mix(ink 65%)`.
- **`.modal-card`** — card, shadow `0 -6px 0`, max-height 95dvh.
- **`.modal-full`** — full viewport (PWA install); bg `--bg`, safe-area padding.
- **`.sheet-backdrop`** — тот же backdrop, что overlay (calendar sheet).

### Layout helpers

- **`.page`** — flex column, min-height 100%.
- **`.page-bottom`** — margin-top auto. Только для того, что действительно нужно прижать к низу
  (footer онбординга, KPI Home). На контентных секциях длинных страниц даёт дыру на высоких
  вьюпортах — там `.page-end-space`.
- **`.page-end-space`** — запас под tab bar в конце скроллящейся страницы.
- **`.sr-only`**, **`.danger`**.

## Компоненты

### Streak chip (`.chip.streak`)

Mono badge в header Home: fill **`--accent2`**, accent-ink text, flame icon (Lucide). Не accent — чтобы streak визually отличался от kicker.

### Progress meter (`.meter`)

Полоса 10px, `--bg2` track, `--accent` fill; подпись «Workout k of 6 · Round n».

### Set cards ([`SetCardsRow`](../../src/components/workout/SetCardsRow.vue))

Список `<ol>` из квадратов **62×62**, horizontal scroll + snap. `.done` — ok border + check; `.done.under` (сделано меньше плана) — warn border, число и галочка warn; `.now` — accent fill.

### Rest timer ([`RestTimerRing`](../../src/components/workout/RestTimerRing.vue))

Двухфазный layout:
- **`.rest-hero`** — SVG ring (stroke accent, linecap **butt**), трек — `color-mix(muted 40%)` (чистый `--line` в тёмной теме сливается с фоном), mono time, timer icon label.
- **`.rest-dock.panel`** — presets 90s/3m/5m, ±15s, skip/pause/reset; mini buttons 44px на `--bg`, mono caps, press translate(2px,2px).
- Живой регион озвучивает не каждый тик, а рубежи: старт, каждые 30 с и последние 5 с.
- Hint: «Sound and notification when rest ends» (switch в Settings).

### Workout screen ([`WorkoutView`](../../src/views/WorkoutView.vue))

Full-viewport, без tab bar. Фазы: **reps** (hero: ContourNumber + pullup icon; dock: rep-stepper + Done/Log fewer) и **rest** (RestTimerRing). Exit — [`ConfirmPanel`](../../src/components/ConfirmPanel.vue).

### Calendar ([`CalendarView`](../../src/views/CalendarView.vue))

- Ячейки min **44px**, display font; сетка заполняет свободную высоту (`flex: 1 1 auto`), но ограничена `max-height`, чтобы на высоких вьюпортах клетки не растягивались в полосы. Легенда прижата к низу (`margin-top: auto`).
- Заголовок месяца — `«<месяц> <год>»` (без локальных суффиксов вроде «г.»), максимум 2 строки: позиция сетки не должна зависеть от длины названия.
- `.today` — accent fill; `.planned` — dot `accent2`; `.done`/`.missed` — ok/bad borders + icons.
- `.sel` — **inset box-shadow** `0 0 0 3px accent2` (не outline).
- Bottom sheet: grab handle, move options, cascade note.

### Stats ([`StatsView`](../../src/views/StatsView.vue))

- `.kpis` — одна колонка; каждая `.kpi` — строка `лейбл слева / число справа` (та же грамматика, что `.tile` и `.setrow`).
- Максимум оси Y считается по **отображаемому** срезу серии, а не по всей истории.
- SVG line + bar charts (accent stroke/fill, `--line` grid).
- `.hist` list + `.pill.ok` / `.pill` fail styling.

### Settings ([`SettingsView`](../../src/views/SettingsView.vue))

Секции `.sec`: Rest (duration ±15, presets seg, auto-start sw, notify sw), Theme (palette `<select>`, mode seg, language seg), Schedule (frequency 2/3, weekday toggles `.wd`), Data (export/import full-width buttons, reset danger), About (version, links to /about, /why).

### Home ([`HomeView`](../../src/views/HomeView.vue))

Kicker — дата-штамп, `h1` — «Today's workout / Rest today». В карточке следующего слота
заголовок — **план подходов** (`5 + 5 + 5 + 4 + MAX`), когда слот на сегодня: дату не дублируем,
она уже в kicker. Для будущего слота заголовок — дата, план идёт строкой ниже.
KPI-плашки прижаты к низу экрана (`.page-bottom`) — выше 1100px высоты вьюпорта прижим снимается.

### Onboarding ([`OnboardingView`](../../src/views/OnboardingView.vue))

3 шага: intro → max test (rep-stepper) → frequency recommendation. Step indicator: `.step-dots` + kicker. Zero-pullups panel.

### Result ([`ResultView`](../../src/views/ResultView.vue))

Centered `.panel.result`: border ok/bad, 64px check/x icon, сводка `«{done} / {planned} reps»`, btnrow Home/Calendar. Появление — fade+slide панели и pop иконки.

### About / Why ([`AboutView`](../../src/views/AboutView.vue), [`WhyProgramView`](../../src/views/WhyProgramView.vue))

`.subpage-head` + back ghost button. About: IconMark, contact links. Why: long-form `.sec`, `.formula code`, source `.badge` (1px border — исключение из правила 2px), [`ScrollToTopFab`](../../src/components/ScrollToTopFab.vue).

## Modals и overlay

| Компонент | Паттерн |
|---|---|
| [`PwaInstallModal`](../../src/components/PwaInstallModal.vue) | `.modal-full`; скроллящийся контент растягивается (`flex: 1 1 auto`), футер прижат к низу; platform tabs; step list; lang seg; Install accent + Dismiss outline. Без Install (не Chromium) Dismiss становится accent — на экране всегда есть ровно одно primary-действие |
| [`ConfirmPanel`](../../src/components/ConfirmPanel.vue) | bottom `.modal-overlay` + `.modal-card`; `role="alertdialog"`; focus trap; проп `destructive` красит primary в `--bad` |
| Calendar sheet | Teleport; `.sheet-backdrop` + `.sheetcard.panel` |

Backdrop: semi-transparent через `color-mix`, не flat poster shadow.

## Иконки

| Источник | Назначение |
|---|---|
| [`IconSprite`](../../src/components/icons/IconSprite.vue) | UI chrome: nav, controls, social (26 symbols) |
| Lucide SFC (`src/components/icons/lucide/`) | Декоративные KPI: flame, target, trending-up, activity, timer |
| Pullup SFC (`src/components/icons/pullup/`) | pull-up, dead-hang, above-bar |
| [`IconMark`](../../src/components/icons/brand/IconMark.vue) | Brand mark на About |

Атрибуция Lucide: «Icons by Lucide, lucide.dev» (ISC). Без emoji.

Spec assets: `assets/icons/lucide/` (12 SVG), `assets/icons/pullup/` (3 SVG).

## Motion

- Press: `.btn` — translate(3px,3px); `.iconbtn` / `.mini` / `.today-btn` — translate(2px,2px);
  `.opt` / `.day` / `.sw` — translate(1–2px). Во всех случаях тень схлопывается до 1px.
- Hover (только `hover: hover and pointer: fine`): тень **растёт** на 1–2px — «поднятие» плаката,
  без изменения геометрии.
- Модалки и bottom sheet: slide-in **только через `transform`**. Анимировать `opacity` контейнера
  нельзя — axe считает контраст с учётом наследуемой прозрачности и валит скан на модалке.
- Result: fade+slide панели, pop иконки.
- ScrollToTopFab: opacity transition 0.15s.
- `@media (prefers-reduced-motion: reduce)` — все transform-press, transitions и keyframes отключены.

## Доступность

- Тач-цели ≥ **44px** (кнопки 50px, iconbtn 44px, calendar days 44px, seg 44px).
- Контраст ≥ **4.5:1** (проверено по ролям в каждой палитре).
- Focus: `:focus-visible` → **2px solid `--accent2`**, offset 2px; RestTimerRing mini — 3px.
- `aria-live="polite"` на timer, workout numbers, result, calendar hints.
- Modals: `useModalA11y` — scroll lock, focus trap, Escape, restore focus.
- i18n: EN default; mono caps хорошо держит RU.

## Экраны (inventory)

| # | Route | Tab bar | Mockup |
|---|---|---|---|
| 1 | Home `/` | ✓ | s_dash |
| 2 | Workout `/workout` | ✗ | s_work |
| 3 | Calendar `/calendar` | ✓ | s_cal |
| 4 | Stats `/stats` | ✓ | s_stats |
| 5 | Settings `/settings` | ✓ | s_set |
| 6 | Onboarding `/onboarding` | ✗ | s_onboarding |
| 7 | Result `/result` | ✗ | s_result |
| 8 | PWA install (modal) | ✗ | s_pwa |
| 9 | About `/about` | ✗ | s_about |
| 10 | Why `/why` | ✗ | s_why |

## Файлы

| Файл | Что это |
|---|---|
| `poster-design.md` | Этот документ |
| `theme-tokens.css` | CSS custom properties — подключается в app |
| `build-assets.py` | Генератор мокапов, тokens, README |
| `mockups/poster-p01-volt.html` | P01 Volt × **10 экранов** × 2 темы |
| `mockups/index.html` | Ссылка на мокап |
| `assets/` | Лого, иконки, паттерны — см. `assets/README.md` |
| `src/assets/styles/main.css` | Runtime global styles (источник правды) |

## Evolution notes (от A8-мокапов)

Изменения, намеренно принятые в ходе разработки:

- **Контурная цифра** — stroke + paint-order fill; responsive clamp до 9rem.
- **Streak chip** — `--accent2`, не `--accent`.
- **Tab bar inactive** — полупрозрачные chips (`color-mix`), не opacity-only.
- **Rest timer** — hero/dock split + presets; sound + notification (не vibrate-only).
- **Прогресс** — 6 шагов / цикл (не 26-step legacy).
- **Banner пропуска** — CSS `.banner` есть в HomeView, **не рендерится** (пропуски через hydrate).
- **Swiss grid** — фоновый паттерн на всех экранах.
- **Modal backdrop** — `color-mix` overlays.
- **`.btn.outline`** — третий вариант кнопки.
- **Switch** — 46×44px (квадратный флажок), не pill 46×26.
