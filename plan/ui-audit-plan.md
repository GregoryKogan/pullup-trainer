# UI Audit Plan — Pull-up Trainer PWA

**Date:** 2026-08-15  
**Base URL:** `http://localhost:5173/pullup-trainer/`  
**Primary viewport:** 375×812 (iPhone)  
**Secondary viewport:** 1280×800 (desktop)

## Route map

| Route | View | Tab bar | Router guard |
|---|---|---|---|
| `/onboarding` | `OnboardingView.vue` | No | Allowed without progress |
| `/` | `HomeView.vue` | Yes | Requires progress |
| `/workout/:date?` | `WorkoutView.vue` | No | Requires progress |
| `/result` | `ResultView.vue` | No | Requires progress |
| `/calendar` | `CalendarView.vue` | Yes | Requires progress |
| `/stats` | `StatsView.vue` | Yes | Requires progress |
| `/settings` | `SettingsView.vue` | Yes | Requires progress |
| `/programs` | `ProgramsListView.vue` | No | Requires progress |
| `/programs/:id/edit` | `ProgramEditView.vue` | No | Requires progress |
| `/about` | `AboutView.vue` | No | Allowed without progress |
| `/why` | `WhyProgramView.vue` | No | Allowed without progress |

**Global overlay:** `PwaInstallModal.vue` via `App.vue`

**Shared UI:** `AppTabBar.vue`, `SetCardsRow.vue`, `RestTimerRing.vue`, `main.css`

## Screen checklist

- [ ] Onboarding (intro, test, recommend)
- [ ] Home
- [ ] Workout (builtin L, P0, custom)
- [ ] Result (success, fail)
- [ ] Calendar
- [ ] Stats
- [ ] Settings (14 palettes, EN/RU)
- [ ] Programs list + editor
- [ ] About
- [ ] Why program
- [ ] PWA install modal

## Scenario matrix

### A. Bootstrap & onboarding
- [ ] Clean DB → redirect `/onboarding`
- [ ] Intro → Test → Recommend → Accept
- [ ] M=0 → Path 0 home/calendar/workout
- [ ] M=3 (L1), M=15 (L3), M=25 (L4)
- [ ] Override recommendation
- [ ] `/about`, `/why` before onboarding

### B. PWA Install Modal
- [ ] Shows in browser tab, dismissible, reappears on reload
- [ ] Platform tabs: iOS / Android / Desktop / Other
- [ ] EN + RU complete
- [ ] SVG steps Poster/Swiss tone
- [ ] Hidden when standalone emulated

### C. Home (`/`)
- [ ] Start today, repeat missed, retest, reduce anchor
- [ ] Level/step/next date/streak labels
- [ ] Tab bar navigation

### D. Workout
- [ ] Builtin L: 5 sets, success/fail, exit fail
- [ ] Max set N_k boundaries
- [ ] Path 0 types
- [ ] Custom all set types
- [ ] Rest timer presets, ±15s, pause/reset, auto-start
- [ ] SetCardsRow states, RestTimerRing

### E. Result
- [ ] Success vs fail UI
- [ ] Volume vs plan, home/calendar buttons

### F. Calendar
- [ ] Month nav, Today
- [ ] planned / done / missed (neutral) / rest / future
- [ ] Reschedule 48h window, start/repeat missed
- [ ] Autoshift on missed
- [ ] Localized month/day names

### G. Stats
- [ ] Weekly streak
- [ ] History + empty state
- [ ] Export history JSON

### H. Settings
- [ ] Rest timer toggles, theme mode, 14 palettes
- [ ] EN ↔ RU all main screens
- [ ] Frequency 2/3, weekdays
- [ ] Backup export/import, reset
- [ ] Touch targets ≥44px

### I. Custom programs
- [ ] Create → edit → save
- [ ] Activate → home reflects custom
- [ ] Delete with confirm
- [ ] Workout success/fail progression

### J. Static pages
- [ ] `/about` — version, links
- [ ] `/why` — formulas, sources, EN/RU

### K. Cross-cutting
- [ ] Tab bar on 4 main screens
- [ ] `prefers-reduced-motion`
- [ ] Contrast on semantic plates
- [ ] No hardcoded hex in components
- [ ] Offline refresh (service worker)

## Mockup comparison (P01 Volt)

> **Не pixel-perfect.** Мокапы — референс стиля (ТЗ §5.1.2). Сверка — sanity-check «ощущения» Poster/Swiss; приоритет аудита — UX, логика, a11y, затем дизайн-язык.

| Screen | App route | Dark | Light |
|---|---|---|---|
| Home | `/` | [ ] | [ ] |
| Workout | `/workout` | [ ] | [ ] |
| Calendar | `/calendar` | [ ] | [ ] |
| Stats | `/stats` | [ ] | [ ] |
| Settings | `/settings` | [ ] | [ ] |

**Reference:** `spec/design/mockups/poster-p01-volt.html`

## State reset

1. Settings → Reset all → confirm
2. CDP fallback: delete IndexedDB + reload

## Static-analysis suspects (verify in browser)

| Suspect | File |
|---|---|
| Workout uses `schedule[0]` not date slot | `WorkoutView.vue:88-96` |
| EN settings snake_case placeholders | `en.json:130-159` |
| Hardcoded UI strings | Settings, Calendar, TabBar |
| Rest presets before rest | `WorkoutView.vue:317` |
| Set jump not wired | `SetCardsRow` / `WorkoutView` |
| Touch targets <44px | Settings `.wd`, `.seg` |
| No global `:focus-visible` | `main.css` |
| No return to built-in | `ProgramsListView.vue` |
| About missing sources | `AboutView.vue` |
