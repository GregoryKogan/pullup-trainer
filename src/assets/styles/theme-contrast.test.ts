import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const css = readFileSync(resolve(process.cwd(), 'spec/design/theme-tokens.css'), 'utf8')

function relativeLuminance(hex: string): number {
  const v = hex.replace('#', '')
  const channels = [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) / 255)
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

function parseThemes(): Record<string, Record<string, string>> {
  const themes: Record<string, Record<string, string>> = {}
  const blockRe = /\[data-theme="([^"]+)"\]\s*\{([^}]*)\}/g
  let block: RegExpExecArray | null
  while ((block = blockRe.exec(css)) !== null) {
    const tokens: Record<string, string> = {}
    const tokenRe = /--([\w-]+):\s*(#[0-9A-Fa-f]{6})/g
    let token: RegExpExecArray | null
    while ((token = tokenRe.exec(block[2])) !== null) tokens[token[1]] = token[2]
    if (Object.keys(tokens).length) themes[block[1]] = tokens
  }
  return themes
}

const themes = parseThemes()
const themeNames = Object.keys(themes)

// Text-on-surface pairs only. --accent and --accent2 are fill colors, read
// through --accent-ink when text sits on them; accent-coloured *text* uses
// --accent-text, which is asserted against every surface.
const TEXT_PAIRS: [string, string][] = [
  ['ink', 'bg'],
  ['ink', 'bg2'],
  ['ink', 'card'],
  ['muted', 'bg'],
  ['muted', 'bg2'],
  ['muted', 'card'],
  ['accent-ink', 'accent'],
  ['accent-text', 'bg'],
  ['accent-text', 'bg2'],
  ['accent-text', 'card'],
  ['ok', 'bg'],
  ['ok', 'card'],
  ['warn', 'bg'],
  ['warn', 'card'],
  ['bad', 'bg'],
  ['bad', 'card'],
]

describe('theme token contrast', () => {
  it('parses all 28 themes from the generated token file', () => {
    expect(themeNames).toHaveLength(28)
  })

  it('defines accent-text in every theme', () => {
    expect(themeNames.filter((n) => !themes[n]['accent-text'])).toEqual([])
  })

  it('meets WCAG AA (4.5:1) for every text-on-surface pair in every theme', () => {
    const failures = themeNames.flatMap((name) =>
      TEXT_PAIRS.filter(([fg, bg]) => themes[name][fg] && themes[name][bg])
        .map(([fg, bg]) => ({
          theme: name,
          pair: `${fg} on ${bg}`,
          ratio: Number(contrast(themes[name][fg], themes[name][bg]).toFixed(2)),
        }))
        .filter((r) => r.ratio < 4.5),
    )
    expect(failures).toEqual([])
  })

  it('keeps semantic colors distinguishable from the palette accent', () => {
    const collisions = themeNames.flatMap((name) =>
      (['ok', 'warn', 'bad'] as const)
        .filter((k) => themes[name][k] === themes[name].accent)
        .map((k) => `${name}: ${k} equals accent`),
    )
    expect(collisions).toEqual([])
  })
})
