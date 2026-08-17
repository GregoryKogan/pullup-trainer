import { copyFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const sourceDir = join(root, 'spec/design/assets/logo')
const targetDir = join(root, 'public')
const sizes = [32, 180, 192, 512]

for (const size of sizes) {
  const name = `icon-${size}.png`
  const source = join(sourceDir, name)
  const target = join(targetDir, name)
  if (!existsSync(source)) {
    throw new Error(`Missing logo asset: ${source}`)
  }
  copyFileSync(source, target)
}

console.log(`Synced ${sizes.length} PWA icons from spec/design/assets/logo to public/`)
