import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pathsSvg = join(root, 'spec/design/contour-digits/paths.svg')
const outFile = join(root, 'src/components/workout/contour-digit-paths.ts')
const inkscape = process.env.INKSCAPE ?? 'inkscape'

const svg = readFileSync(pathsSvg, 'utf8')
const DIGIT_HEIGHT = 100

function extractPath(id) {
  const byIdFirst = new RegExp(`<path[^>]*id="${id}"[^>]*d="([^"]+)"`)
  const byDFirst = new RegExp(`<path[^>]*d="([^"]+)"[^>]*id="${id}"`)
  const match = svg.match(byIdFirst) ?? svg.match(byDFirst)
  if (!match) throw new Error(`Missing path for ${id}`)
  return match[1]
}

function queryBBox(id) {
  const out = execSync(
    `${inkscape} ${JSON.stringify(pathsSvg)} --batch-process --query-id=${id} --query-x --query-y --query-width --query-height`,
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
  ).trim()
  const [x, y, width, height] = out.split(/\s+/).map(Number)
  return { x, y, width, height }
}

const digits = {}
for (let i = 0; i <= 9; i += 1) {
  const key = String(i)
  const id = `digit-${key}`
  const { x, y, width, height } = queryBBox(id)
  const scale = DIGIT_HEIGHT / height
  digits[key] = {
    d: extractPath(id),
    width: Math.round(width * scale * 100) / 100,
    originX: Math.round(x * 100) / 100,
    originY: Math.round(y * 100) / 100,
    scale: Math.round(scale * 10000) / 10000,
  }
}

const body = `export type ContourDigit = {
  d: string
  width: number
  originX: number
  originY: number
  scale: number
}

export const CONTOUR_DIGITS: Record<string, ContourDigit> = ${JSON.stringify(digits, null, 2)
  .replace(/"([^"]+)":/g, "'$1':")
  .replace(/"/g, "'")}

export const DIGIT_GAP = 6
export const DIGIT_HEIGHT = ${DIGIT_HEIGHT}
export const CONTOUR_STROKE_WIDTH = 2.5
`

writeFileSync(outFile, body)
console.log(`Wrote ${outFile}`)
