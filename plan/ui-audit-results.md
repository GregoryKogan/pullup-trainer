# UI/UX Audit Results — Pull-up Trainer

Audit date: 2026-08-15  
Environment: `http://localhost:5173/pullup-trainer/` · 390×844 · P01 Volt

## Summary

Pre-audit baseline identified 24 confirmed issues across P0/P1/P2. All 24 fixed and browser-verified on 2026-08-15. Final checks: typecheck, lint, test (22), build — all green.

## Issues & Fixes

| # | Screen | Problem | Severity | Fix | Verified |
|---|--------|---------|----------|-----|----------|
| 1 | Workout | All sets show "reps"; max/hold/negative/assisted ignored | blocker | Type-aware labels + done button in WorkoutView | yes |
| 2 | Settings/Workout | No 90s/5min rest presets | blocker | Preset buttons in Settings + Workout | yes |
| 3 | Settings | No frequency 2/3 or weekdays picker | blocker | Schedule settings section wired to progress | yes |
| 4 | Home | No shift banner or repeat-missed CTA | blocker | Missed slot detection + banner/buttons | yes |
| 5 | Calendar | No repeat-missed action | blocker | Repeat button on missed slot sheet | yes |
| 6 | Result | No volume/summary | blocker | Query params + summary panel | yes |
| 7 | PWA | Tabs display-only | blocker | Interactive tab state in modal | yes |
| 8 | PWA | sessionStorage hides modal on refresh | blocker | Show on each load until installed | yes |
| 9 | Home | No retest after >2 week break | blocker | Retest banner with retest/reduce actions | yes |
| 10 | Home | Hardcoded 27% meter; no level/anchor/streak | major | Dynamic meter + metadata + streak chip | yes |
| 11 | Stats | Streak placeholder `—` | major | computeWeeklyStreak util | yes |
| 12 | Settings | restVibrate/restNotify not configurable | major | Toggle switches | yes |
| 13 | Settings | Silent import failure | major | validateBackup feedback message | yes |
| 14 | Programs | Hardcoded EN, no delete confirm | major | i18n + confirm dialog | yes |
| 15 | Programs | No manual step jump | major | Step selector on activate | yes |
| 16 | Calendar/Stats | EN DOW/month labels | major | vue-i18n + locale date formatting | yes |
| 17 | Calendar | Missed used `--bad` border | major | Neutral `--muted` styling per TZ | yes |
| 18 | Workout | Ignores `/workout/:date` param | major | Route date in loadSession | yes |
| 19 | RestTimer | Pause uses emoji | minor | Inline SVG pause icon | yes |
| 20 | About | Hardcoded v1.0.0 | polish | i18n version string | yes |
| 21 | Settings | Theme mode labels hardcoded EN | polish | i18n keys | yes |
| 22 | Stats/Why | Hardcoded EN kickers | polish | i18n keys | yes |
| 23 | i18n | `<html lang>` static | minor | setLocale updates document.lang | yes |
| 24 | SetCardsRow | "Set"/"Now" hardcoded EN | minor | i18n in component | yes |

## Deferred

| Item | Reason |
|------|--------|
| Full E2E Playwright suite | Out of v1 scope; Vitest component tests added where regressions likely |
| PWA platform-specific rich SVG illustrations | P2 partial improvement only; functional steps sufficient |

## Before/After Screenshots

Screenshots captured during browser verification pass (P0/P1 flows):
- `plan/screenshots/` — populated during Phase 5 regression
