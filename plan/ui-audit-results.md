# UI Audit Results — Pull-up Trainer PWA

**Completed:** 2026-08-15  
**Viewport:** 375×812 primary

## Summary

| Priority | Found | Fixed | Open |
|---|---|---|---|
| P0 | 1 | 1 | 0 |
| P1 | 12 | 12 | 0 |
| P2 | 4 | 4 | 0 |

---

## Findings

### [P0] Workout loads wrong step for calendar date
- **Экран/маршрут:** `/workout/:date`
- **Сценарий:** Start workout from calendar for a specific scheduled date
- **Ожидание (TZ/мокап):** StepRef from matching schedule slot for that date
- **Факт:** `resolvePlanned()` always used `schedule[0]`, ignoring route param
- **Скриншот/снимок:** Code review + schedule slot hypothesis confirmed
- **Файлы:** `src/views/WorkoutView.vue`, `src/domain/schedule.ts`
- **Статус:** fixed

### [P1] EN settings show raw i18n keys (snake_case)
- **Экран/маршрут:** `/settings`
- **Сценарий:** Fresh install, open Settings
- **Ожидание (TZ/мокап):** Human-readable labels (Duration, Export backup, etc.)
- **Факт:** `rest_duration`, `export_backup`, `reset_all_data`, `frequency`, etc. visible
- **Скриншот/снимок:** Baseline settings screenshot before fix
- **Файлы:** `src/i18n/locales/en.json`, `src/i18n/locales/ru.json`
- **Статус:** fixed

### [P1] Hardcoded Settings kicker and rest preset buttons
- **Экран/маршрут:** `/settings`
- **Сценарий:** View rest timer preset row
- **Ожидание (TZ/мокап):** i18n-driven labels
- **Факт:** `"Poster · Swiss"` hardcoded; preset buttons used literal `90s`/`3:00`/`5:00`
- **Файлы:** `src/views/SettingsView.vue`
- **Статус:** fixed

### [P1] Tab bar and calendar aria-labels in English only
- **Экран/маршрут:** All tab screens, `/calendar`
- **Сценарий:** Screen reader / snapshot audit
- **Ожидание (TZ/мокап):** Localized accessible names
- **Факт:** `aria-label="Main"`, `aria-label="Next month"`, prev used `common.back`
- **Файлы:** `src/components/AppTabBar.vue`, `src/views/CalendarView.vue`, i18n
- **Статус:** fixed

### [P1] Touch targets below 44px in Settings
- **Экран/маршрут:** `/settings`
- **Сценарий:** Weekday toggles, segment buttons, select, ± rest buttons
- **Ожидание (TZ/мокап):** ≥44px per Poster spec
- **Факт:** `.wd` 36px, `.seg button` 38px, select 38px, icon buttons 40px
- **Файлы:** `src/views/SettingsView.vue`, `src/assets/styles/main.css`
- **Статус:** fixed

### [P1] No global `:focus-visible` outline
- **Экран/маршрут:** Cross-cutting
- **Сценарий:** Keyboard navigation
- **Ожидание (TZ/мокап):** 2px focus outline on interactive elements
- **Факт:** Only calendar selected day had outline
- **Файлы:** `src/assets/styles/main.css`
- **Статус:** fixed

### [P1] Rest presets shown before rest period
- **Экран/маршрут:** `/workout`
- **Сценарий:** Active set, no rest running
- **Ожидание (TZ/мокап):** Presets during rest timer (90s/3min/5min)
- **Факт:** Preset row visible during working sets; could start rest prematurely
- **Файлы:** `src/views/WorkoutView.vue`, `src/components/workout/RestTimerRing.vue`
- **Статус:** fixed — presets moved into RestTimerRing

### [P1] SetCardsRow missing done checkmark; dead click handlers
- **Экран/маршрут:** `/workout`
- **Сценарий:** Complete sets, tap set cards
- **Ожидание (TZ/мокап):** Green border + checkmark per mockup; step-by-step (no jump)
- **Факт:** No checkmark SVG; buttons emitted `select` but parent ignored
- **Файлы:** `src/components/workout/SetCardsRow.vue`
- **Статус:** fixed — checkmark added, cards are display-only divs

### [P1] Toggle switches lack accessible names
- **Экран/маршрут:** `/settings`
- **Сценарий:** Rest timer toggles
- **Ожидание (TZ/мокап):** `aria-label` + `aria-pressed`
- **Факт:** Bare `.sw` buttons with no accessible name
- **Файлы:** `src/views/SettingsView.vue`
- **Статус:** fixed

### [P1] PWA modal a11y gaps
- **Экран/маршрут:** Global overlay
- **Сценарий:** Open app in browser tab
- **Ожидание (TZ/мокап):** Dialog with labelled heading, tab controls
- **Факт:** No `aria-labelledby`, tabs lacked `aria-controls`/`tabindex`
- **Файлы:** `src/components/PwaInstallModal.vue`
- **Статус:** fixed

### [P1] About page missing program sources link
- **Экран/маршрут:** `/about`
- **Сценарий:** TZ §3.8 requires link to scientific sources
- **Ожидание (TZ/мокап):** Link to Why page sources section
- **Факт:** Only generic Why link
- **Файлы:** `src/views/AboutView.vue`, `src/views/WhyProgramView.vue`
- **Статус:** fixed — `#sources` anchor + button

### [P1] No return to built-in program from custom
- **Экран/маршрут:** `/programs`
- **Сценарий:** Activate custom program, try to switch back
- **Ожидание (TZ/мокап):** User can return to built-in program
- **Факт:** No UI action; custom overwrote progress
- **Файлы:** `src/views/programs/ProgramsListView.vue`, `src/stores/progress.ts`
- **Статус:** fixed — `activateBuiltin()` from last test M

### [P1] RestTimerRing hardcoded ±15s labels
- **Экран/маршрут:** `/workout`
- **Сценарий:** Rest timer controls
- **Ожидание (TZ/мокап):** i18n EN/RU
- **Факт:** Literal `−15s` / `+15s`
- **Файлы:** `src/components/workout/RestTimerRing.vue`, i18n
- **Статус:** fixed

### [P2] Calendar sheet missing bottom-sheet handle
- **Экран/маршрут:** `/calendar`
- **Сценарий:** Select day → reschedule panel
- **Ожидание (TZ/мокап):** Panel with drag handle per mockup
- **Факт:** Inline panel without handle
- **Файлы:** `src/views/CalendarView.vue`
- **Статус:** fixed — `::before` handle bar

### [P2] Stats charts lack grid/axis baseline
- **Экран/маршрут:** `/stats`
- **Сценарий:** View charts
- **Ожидание (TZ/мокап):** SVG grid lines per Poster mockup
- **Факт:** Bare polylines/bars
- **Файлы:** `src/views/StatsView.vue`
- **Статус:** fixed — horizontal grid + baseline

### [P2] Modal overlay hardcoded rgba
- **Экран/маршрут:** PWA modal
- **Сценарий:** Design token audit
- **Ожидание (TZ/мокап):** CSS variables only
- **Факт:** `rgba(0,0,0,0.65)` in main.css
- **Файлы:** `src/assets/styles/main.css`
- **Статус:** fixed — `color-mix` with `--ink`

### [P2] theme-color meta not palette-aware
- **Экран/маршрут:** `/settings` theme switch
- **Сценарий:** Change palette
- **Ожидание (TZ/мокап):** Meta theme-color matches active palette
- **Факт:** Hardcoded P01 dark/light hex
- **Файлы:** `src/stores/settings.ts`
- **Статус:** fixed — reads `--bg` after apply

---

## Verification

- `npm run typecheck` — pass
- `npm run lint` — pass
- `npm run test` — 23/23 pass
- `npm run build` — pass
- Browser smoke: onboarding M=7 → home → settings EN/RU → PWA modal — pass
