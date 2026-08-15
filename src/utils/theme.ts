export const PALETTE_SLUGS = [
  'p01-volt',
  'p02-signal-orange',
  'p03-cobalt',
  'p04-magenta-pop',
  'p05-taxi',
  'p06-paper-red',
  'p07-mint-terminal',
  'p08-amber',
  'p09-cyan-future',
  'p10-crimson',
  'p11-spring-green',
  'p12-ultraviolet',
  'p13-coral-sunrise',
  'p14-mono-ink',
] as const

export type PaletteSlug = (typeof PALETTE_SLUGS)[number]

export const PALETTE_LABELS: Record<PaletteSlug, string> = {
  'p01-volt': 'P01 Volt',
  'p02-signal-orange': 'P02 Signal Orange',
  'p03-cobalt': 'P03 Cobalt',
  'p04-magenta-pop': 'P04 Magenta Pop',
  'p05-taxi': 'P05 Taxi',
  'p06-paper-red': 'P06 Paper Red',
  'p07-mint-terminal': 'P07 Mint Terminal',
  'p08-amber': 'P08 Amber',
  'p09-cyan-future': 'P09 Cyan Future',
  'p10-crimson': 'P10 Crimson',
  'p11-spring-green': 'P11 Spring Green',
  'p12-ultraviolet': 'P12 Ultraviolet',
  'p13-coral-sunrise': 'P13 Coral Sunrise',
  'p14-mono-ink': 'P14 Mono Ink',
}
