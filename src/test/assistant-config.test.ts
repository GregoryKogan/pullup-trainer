import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync, lstatSync, readlinkSync } from 'node:fs'
import { resolve, join } from 'node:path'

const root = process.cwd()
const claudeSkills = resolve(root, '.claude/skills')
const cursorSkills = resolve(root, '.cursor/skills')
const cursorRules = resolve(root, '.cursor/rules')

function skillNames(dir: string) {
  return readdirSync(dir).sort()
}

describe('assistant configuration', () => {
  it('keeps CLAUDE.md as the entry point', () => {
    expect(existsSync(resolve(root, 'CLAUDE.md'))).toBe(true)
  })

  it('gives every skill a name and a description', () => {
    const missing = skillNames(claudeSkills).filter((name) => {
      const file = join(claudeSkills, name, 'SKILL.md')
      if (!existsSync(file)) return true
      const head = readFileSync(file, 'utf8').split('---')[1] ?? ''
      return !/\bname:/.test(head) || !/\bdescription:/.test(head)
    })
    expect(missing).toEqual([])
  })

  it('names each skill directory after the name in its frontmatter', () => {
    const mismatched = skillNames(claudeSkills).filter((name) => {
      const head = readFileSync(join(claudeSkills, name, 'SKILL.md'), 'utf8').split('---')[1] ?? ''
      return (head.match(/\bname:\s*(\S+)/)?.[1] ?? '') !== name
    })
    expect(mismatched).toEqual([])
  })

  // The two assistants used to carry their own copies of the same rules, and
  // the copies drifted silently. .claude is the source; .cursor only links.
  it('exposes every Claude skill to Cursor as a symlink', () => {
    expect(skillNames(cursorSkills)).toEqual(skillNames(claudeSkills))
  })

  it('never lets a Cursor skill hold its own copy', () => {
    const notLinks = skillNames(cursorSkills).filter((name) => {
      const path = join(cursorSkills, name)
      return !lstatSync(path).isSymbolicLink() || !readlinkSync(path).includes('.claude/skills/')
    })
    expect(notLinks).toEqual([])
  })

  it('keeps Cursor rules down to the single pointer file', () => {
    expect(readdirSync(cursorRules)).toEqual(['00-source-of-truth.mdc'])
  })

  it('points every command named in the docs at a real npm script', () => {
    const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))
    const docs = [
      readFileSync(resolve(root, 'CLAUDE.md'), 'utf8'),
      ...skillNames(claudeSkills).map((n) => readFileSync(join(claudeSkills, n, 'SKILL.md'), 'utf8')),
      readFileSync(join(cursorRules, '00-source-of-truth.mdc'), 'utf8'),
    ].join('\n')
    const named = [...new Set([...docs.matchAll(/npm run ([a-z0-9:]+)/g)].map((m) => m[1]))]
    expect(named.length).toBeGreaterThan(5)
    expect(named.filter((s) => !(s in pkg.scripts))).toEqual([])
  })

  it('references skills that exist', () => {
    const known = new Set(skillNames(claudeSkills))
    const rules = readFileSync(join(cursorRules, '00-source-of-truth.mdc'), 'utf8')
    const referenced = [...rules.matchAll(/^\| `([a-z0-9-]+)`/gm)].map((m) => m[1])
    expect(referenced.length).toBeGreaterThan(5)
    expect(referenced.filter((name) => !known.has(name))).toEqual([])
  })
})
