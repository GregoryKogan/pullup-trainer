import type { Level, StartRecommendation } from './types'

export function levelFromM(m: number): Level {
  if (m <= 4) return 'L1'
  if (m <= 9) return 'L2'
  if (m <= 19) return 'L3'
  return 'L4'
}

export function recommendStart(m: number): StartRecommendation {
  const level = levelFromM(m)
  return {
    anchor: m,
    level,
    explanationKey: 'onboarding.recommend.l',
    explanationParams: { m, level },
  }
}

export function levelLabel(level: Level): string {
  return level
}
