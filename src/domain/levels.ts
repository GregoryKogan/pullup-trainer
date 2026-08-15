import type { Level, StartRecommendation } from './types'

export function levelFromM(m: number): Level {
  if (m <= 0) return 'P0'
  if (m <= 4) return 'L1'
  if (m <= 9) return 'L2'
  if (m <= 19) return 'L3'
  return 'L4'
}

export function recommendStart(m: number): StartRecommendation {
  if (m <= 0) {
    return {
      path: 'P0',
      path0Step: 1,
      level: 'P0',
      explanationKey: 'onboarding.recommend.p0',
      explanationParams: {},
    }
  }
  const level = levelFromM(m)
  return {
    path: 'L',
    anchor: m,
    level,
    explanationKey: 'onboarding.recommend.l',
    explanationParams: { m, level },
  }
}

export function levelLabel(level: Level): string {
  return level
}
