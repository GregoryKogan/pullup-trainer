# UI/UX Audit Plan — Pull-up Trainer

> Audit against TZ v1.1, `.cursor/rules/`, `spec/design/poster-design.md`, mockup `spec/design/mockups/poster-p01-volt.html`

## Environment

| Item | Value |
|------|-------|
| Dev URL | `http://localhost:5173/pullup-trainer/` |
| Primary viewport | 390×844 |
| Desktop spot-check | 1280×800 |
| Default locale | EN |
| Default theme | P01 Volt + system |
| Spot themes | P06 Paper Red, P14 Mono Ink (light/dark) |
| IndexedDB reset | Settings → reset_all_data, or DevTools → Application → Clear |

## Screen → Mockup Map

| Route | View | Mockup reference |
|-------|------|------------------|
| `/` | HomeView | Fig 1 · Dashboard |
| `/workout/:date?` | WorkoutView | Fig 2 · Workout |
| `/calendar` | CalendarView | Fig 3 · Calendar |
| `/stats` | StatsView | Fig 4 · Stats |
| `/settings` | SettingsView | Fig 5 · Settings |
| `/onboarding` | OnboardingView | poster-design forms |
| `/result` | ResultView | panel pattern |
| `/programs*` | ProgramsList/Edit | Settings rows |
| `/about`, `/why` | About/Why | content scroll |
| App shell | PwaInstallModal | TZ §3.11 |

## Scenario Checklist

### 1.1 Onboarding
- [ ] Clean IndexedDB → redirect `/onboarding`
- [ ] Intro → test → recommend flow
- [ ] M=0 → Path P0; M=1/5/15/25 → L1–L4 labels
- [ ] Override / re-enter test
- [ ] Accept → Home; re-visit onboarding → redirect home

### 1.2 Home
- [ ] Next workout + Start CTA
- [ ] Level, step, cycle, anchor
- [ ] Missed workout neutral UI + repeat CTA
- [ ] Shift banner when plan shifted
- [ ] About / Why links
- [ ] Workout with correct date

### 1.3 Workout Path L
- [ ] Full success (5 sets, final ≥ N_k)
- [ ] Fail on short reps
- [ ] Exit → fail
- [ ] Rest: 3 min default, 90s/5min presets, ±15s, pause/reset
- [ ] Set cards + max set UI
- [ ] Result query success/fail
- [ ] Progression on Home/Calendar after success

### 1.4 Workout Path P0
- [ ] hold/negative/assisted units
- [ ] Rest 90s–3min
- [ ] Fail → repeat step

### 1.5 Custom program workout
- [ ] Create, activate, workout
- [ ] All set types
- [ ] Success/fail done ≥ planned

### 1.6 Result
- [ ] Success/fail semantics, no guilt tone
- [ ] Totals summary
- [ ] Navigate home

### 1.7 Calendar
- [ ] 3×/week and 2×/week slots
- [ ] Reschedule ≥48h, shift following
- [ ] Autoskip on missed
- [ ] Repeat missed
- [ ] Neutral missed styling

### 1.8 Stats
- [ ] Workout + test history
- [ ] Empty state
- [ ] Test vs workout display

### 1.9 Settings
- [ ] 14 palettes × light/dark/system
- [ ] EN ↔ RU complete
- [ ] Rest timer + presets
- [ ] Frequency 2/3 + weekdays
- [ ] Export/import backup
- [ ] Reset

### 1.10 Custom programs CRUD
- [ ] List/create/edit/save/activate
- [ ] Validation
- [ ] Delete with confirm

### 1.11 About + Why
- [ ] Readable content, open sources
- [ ] Formulas with examples
- [ ] Mono typography

### 1.12 PWA modal
- [ ] Shows in browser tab
- [ ] Dismiss + re-show on reload
- [ ] Platform tabs switchable
- [ ] EN + RU

### 1.13 Navigation
- [ ] Tab bar active states
- [ ] Deep link `/workout/YYYY-MM-DD`
- [ ] No console errors on navigation

## Design Checklist (per screen, EN, P01 dark, 390px)

- [ ] CSS vars only (`--bg`, `--card`, `--ink`, `--accent`, `--ok/warn/bad`, `--shadow`)
- [ ] 2px borders, 2px radius, 4–5px offset shadows
- [ ] Display headers, mono numbers
- [ ] Touch targets ≥44px (buttons ~50px)
- [ ] `prefers-reduced-motion` disables press transforms
- [ ] Contrast ≥4.5:1 on accent surfaces
- [ ] No gradient/blur/glow/emoji

## Fix Order

### P0 — Blockers
1. Workout set-type UX (max/hold/negative/assisted)
2. Rest presets 90s / 3min / 5min
3. Frequency 2/3× + weekdays in Settings
4. Home shift banner + repeat missed CTA
5. Calendar repeat missed flow
6. Result totals summary
7. PWA interactive tabs
8. PWA dismiss on every load (not session-persistent)
9. Retest / return-after-break UI

### P1 — Functional / UX
1. Home level/anchor/streak/dynamic meter/About links
2. Stats weekly streak
3. Settings vibrate/notify toggles + import feedback
4. Custom programs i18n, delete confirm, step jump
5. Calendar/Stats i18n (DOW, month, legends)
6. Neutral missed day styling (TZ over mockup red)
7. Workout deep link date param
8. RestTimer pause SVG

### P2 — Polish
1. Tab bar bleed, focus digit, charts vs mockup
2. About version from package.json
3. Palette labels i18n
4. PWA richer SVGs
5. Why/About kickers i18n

## Coverage Matrix Template

| # | Screen | Scenario | TZ expectation | Locale | Theme | Status | Severity | File | Fix |
|---|--------|----------|----------------|--------|-------|--------|----------|------|-----|

Results logged in [`ui-audit-results.md`](ui-audit-results.md).
