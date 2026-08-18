import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const screenshotDir = path.join(root, 'docs', 'readme', 'screenshots')
const outPath = path.join(root, 'docs', 'readme', 'app-screenshots.svg')

const SLIDES = [
  { file: 'home.png', caption: 'YOUR NEXT WORKOUT' },
  { file: 'workout.png', caption: 'SET BY SET' },
  { file: 'rest.png', caption: 'REST TIMER' },
  { file: 'calendar.png', caption: 'TRAINING CALENDAR' },
  { file: 'stats.png', caption: 'TRACK PROGRESS' },
]

const CANVAS_W = 1200
const COLS = SLIDES.length
const GAP = 16
const MARGIN_X = 40
const MARGIN_TOP = 24
const MARGIN_BOTTOM = 24
const PHONE_W = Math.floor((CANVAS_W - MARGIN_X * 2 - GAP * (COLS - 1)) / COLS)
const CAPTION_H = 36
const CAPTION_GAP = 12
const CAPTION_Y = MARGIN_TOP
const PHONE_Y = CAPTION_Y + CAPTION_H + CAPTION_GAP

function readPngSize(filePath) {
  const buf = fs.readFileSync(filePath)
  if (buf.readUInt32BE(0) !== 0x89504e47) {
    throw new Error(`Not a PNG: ${filePath}`)
  }
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}

function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function readPngDataUri(filePath) {
  const buf = fs.readFileSync(filePath)
  if (buf.readUInt32BE(0) !== 0x89504e47) {
    throw new Error(`Not a PNG: ${filePath}`)
  }
  return `data:image/png;base64,${buf.toString('base64')}`
}

const phoneLayouts = SLIDES.map(({ file }) => {
  const fullPath = path.join(screenshotDir, file)
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing screenshot: ${fullPath}. Run npm run screenshots:readme first.`)
  }
  const { width, height } = readPngSize(fullPath)
  const scale = PHONE_W / width
  const imgW = Math.round(width * scale)
  const imgH = Math.round(height * scale)
  const frameW = imgW + 8
  const frameH = imgH + 8
  const dataUri = readPngDataUri(fullPath)
  return { file, imgW, imgH, frameW, frameH, dataUri }
})

const maxFrameH = Math.max(...phoneLayouts.map((p) => p.frameH))
const CANVAS_H = PHONE_Y + maxFrameH + MARGIN_BOTTOM

const totalRowW =
  phoneLayouts.reduce((sum, p) => sum + p.frameW, 0) + GAP * (COLS - 1)
let cursorX = (CANVAS_W - totalRowW) / 2

const slideGroups = SLIDES.map((slide, i) => {
  const layout = phoneLayouts[i]
  const x = cursorX
  cursorX += layout.frameW + GAP
  const captionW = Math.max(layout.frameW, 180)
  const cardW = Math.max(captionW, layout.frameW)
  const cardX = x + layout.frameW / 2 - cardW / 2
  const cardY = CAPTION_Y
  const cardH = CAPTION_H + CAPTION_GAP + layout.frameH
  const captionX = cardX + (cardW - captionW) / 2
  const imgX = cardX + (cardW - layout.imgW) / 2
  const imgY = PHONE_Y + 4
  return { slide, layout, cardX, cardY, cardW, cardH, captionX, captionW, imgX, imgY }
})

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_W}" height="${CANVAS_H}" viewBox="0 0 ${CANVAS_W} ${CANVAS_H}" role="img" aria-label="Pull-up Trainer app screenshots">
  <rect fill="#0E0E0B" width="${CANVAS_W}" height="${CANVAS_H}"/>
${slideGroups
  .map(({ slide, layout, cardX, cardY, cardW, cardH, captionX, captionW, imgX, imgY }) => {
    return `  <g>
    <rect x="${cardX + 4}" y="${cardY + 4}" width="${cardW}" height="${cardH}" rx="2" fill="#000000"/>
    <rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}" rx="2" fill="#161612" stroke="#000000" stroke-width="2"/>
    <rect x="${captionX + 3}" y="${CAPTION_Y + 3}" width="${captionW}" height="${CAPTION_H}" rx="2" fill="#000000"/>
    <rect x="${captionX}" y="${CAPTION_Y}" width="${captionW}" height="${CAPTION_H}" rx="2" fill="#C6FF3B" stroke="#000000" stroke-width="2"/>
    <text x="${captionX + captionW / 2}" y="${CAPTION_Y + CAPTION_H / 2 + 5}" text-anchor="middle" fill="#0E0E0B" font-family="ui-monospace, 'SF Mono', Menlo, monospace" font-size="11" font-weight="700" letter-spacing="0.1em">${escapeXml(slide.caption)}</text>
    <image href="${layout.dataUri}" x="${imgX}" y="${imgY}" width="${layout.imgW}" height="${layout.imgH}" preserveAspectRatio="xMidYMid meet"/>
  </g>`
  })
  .join('\n')}
</svg>
`

fs.writeFileSync(outPath, svg)
console.log(`Wrote ${path.relative(root, outPath)}`)
