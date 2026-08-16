import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function ceilMin(value, min = 1) {
  return Math.max(min, Math.ceil(value))
}

function workingSets(anchor) {
  const m = Math.max(1, anchor)
  return [ceilMin(0.7 * m), ceilMin(0.6 * m), ceilMin(0.6 * m), ceilMin(0.5 * m)]
}

function finalMinimum(anchor, stepInCycle) {
  const m = Math.max(1, anchor)
  const k = Math.min(6, Math.max(1, stepInCycle))
  return Math.min(ceilMin(0.6 * m) + k - 1, m + 1)
}

function nkSeries(anchor) {
  return [1, 2, 3, 4, 5, 6].map((k) => finalMinimum(anchor, k))
}

function levelFromM(m) {
  if (m >= 20) return 'L4'
  if (m >= 10) return 'L3'
  if (m >= 5) return 'L2'
  return 'L1'
}

function deloadAnchor(anchor) {
  return Math.max(1, Math.floor(0.9 * anchor))
}

function loadJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'))
}

function leafKeys(obj, prefix = '') {
  const keys = []
  for (const [key, val] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${key}` : key
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      keys.push(...leafKeys(val, p))
    } else {
      keys.push(p)
    }
  }
  return keys
}

function collectCitedIds(science) {
  const cited = new Set()
  const re = /\[(\d+)\]/g
  const texts = [
    ...science.intro,
    ...Object.values(science.sections).flatMap((s) => s.body),
    ...science.formulas.items.flatMap((i) => [i.formula, i.example, i.note ?? '']),
  ]
  for (const text of texts) {
    let match
    while ((match = re.exec(text)) !== null) cited.add(Number(match[1]))
  }
  return cited
}

const en = loadJson('src/i18n/locales/science/en.json')
const ru = loadJson('src/i18n/locales/science/ru.json')

const errors = []

const enKeys = new Set(leafKeys(en))
const ruKeys = new Set(leafKeys(ru))
for (const k of enKeys) {
  if (!ruKeys.has(k)) errors.push(`RU missing key: ${k}`)
}
for (const k of ruKeys) {
  if (!enKeys.has(k)) errors.push(`EN missing key: ${k}`)
}

const enIds = en.sources.map((s) => s.id).sort((a, b) => a - b)
const ruIds = ru.sources.map((s) => s.id).sort((a, b) => a - b)
if (JSON.stringify(enIds) !== JSON.stringify(ruIds)) {
  errors.push('Source ID lists differ between EN and RU')
}

const cited = collectCitedIds(en)
const sourceIds = new Set(en.sources.map((s) => s.id))
for (const id of sourceIds) {
  if (!cited.has(id)) errors.push(`Source [${id}] is never cited in science copy`)
}
for (const id of cited) {
  if (!sourceIds.has(id)) errors.push(`Citation [${id}] has no matching source entry`)
}

const referenceTables = {
  3: { working: [3, 2, 2, 2], nk: [2, 3, 4, 4, 4, 4] },
  7: { working: [5, 5, 5, 4], nk: [5, 6, 7, 8, 8, 8] },
  15: { working: [11, 9, 9, 8], nk: [9, 10, 11, 12, 13, 14] },
  25: { working: [18, 15, 15, 13], nk: [15, 16, 17, 18, 19, 20] },
}

for (const [anchor, expected] of Object.entries(referenceTables)) {
  const m = Number(anchor)
  const working = workingSets(m)
  const nk = nkSeries(m)
  if (JSON.stringify(working) !== JSON.stringify(expected.working)) {
    errors.push(`workingSets(${m}) = ${JSON.stringify(working)}, expected ${JSON.stringify(expected.working)}`)
  }
  if (JSON.stringify(nk) !== JSON.stringify(expected.nk)) {
    errors.push(`nkSeries(${m}) = ${JSON.stringify(nk)}, expected ${JSON.stringify(expected.nk)}`)
  }
}

if (levelFromM(7) !== 'L2') errors.push('levelFromM(7) should be L2')
if (deloadAnchor(7) !== 6) errors.push('deloadAnchor(7) should be 6')
if (deloadAnchor(3) !== 2) errors.push('deloadAnchor(3) should be 2')

const formulaExamples = en.formulas.items.map((i) => i.example).join(' ')
if (!formulaExamples.includes('M*=7 → 5,5,5,4')) {
  errors.push('Science copy missing M*=7 working set example')
}
if (!formulaExamples.includes('N_1…N_6 = 5,6,7,8,8,8')) {
  errors.push('Science copy missing N_k series example for M*=7')
}

if (errors.length) {
  console.error('Science crosswalk FAILED:\n')
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}

console.log('Science crosswalk OK')
console.log(`  EN/RU keys: ${enKeys.size}`)
console.log(`  Sources: ${en.sources.length}, all cited`)
console.log(`  Reference tables M*=3/7/15/25 match generator`)
