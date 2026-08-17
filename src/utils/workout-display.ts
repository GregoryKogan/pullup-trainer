import { REST_MAX_SECONDS, REST_MIN_SECONDS } from '@/constants/app'

export function clampRestSeconds(seconds: number): number {
  return Math.min(REST_MAX_SECONDS, Math.max(REST_MIN_SECONDS, seconds))
}
