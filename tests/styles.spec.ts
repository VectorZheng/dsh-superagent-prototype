import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { expect, it } from 'vitest'

const dir = join(process.cwd(), 'src/client')
const css = readFileSync(join(dir, 'client.css'), 'utf8')
const code = readdirSync(dir).filter(name => /\.tsx?$/.test(name)).map(name => readFileSync(join(dir, name), 'utf8')).join('\n')

it('styles only classes a component uses', () => {
  // Template literals like `dt-btn-${variant}` match any class with that prefix.
  const prefixes = [...code.matchAll(/(dt-[\w-]*-)\$\{/g)].map(match => match[1]!)
  const used = (name: string) => new RegExp(`(?<![\\w-])${name}(?![\\w-])`).test(code) || prefixes.some(prefix => name.startsWith(prefix))
  const classes = new Set([...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/\.(dt-[\w-]+)/g)].map(match => match[1]!))
  expect([...classes].filter(name => !used(name))).toEqual([])
})

it('scrolls the page body and keeps the top tabs outside that scroller', () => {
  const body = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const rule = (selector: string) => {
    const line = body.split('\n').map(text => text.trim()).find(text => text.startsWith(`${selector} {`))
    expect(line, selector).toBeDefined()
    return line!
  }
  const decl = (line: string, prop: string) => line.slice(line.indexOf('{') + 1, line.lastIndexOf('}'))
    .split(';').map(part => part.trim()).find(part => part.startsWith(`${prop}:`))?.slice(prop.length + 1).trim()
  // The pane is locked. Header and page tabs live in the column; only the main region scrolls.
  expect(decl(rule('.dt-page'), 'overflow')).toBe('hidden')
  expect(decl(rule('.dt-page'), 'min-height')).toBe('0')
  expect(decl(rule('.dt-page > .dt-column'), 'overflow')).toBeUndefined()
  expect(decl(rule('.dt-page > .dt-column'), 'min-height')).toBe('0')
  expect(decl(rule('.dt-main'), 'overflow')).toBe('auto')
  expect(decl(rule('.dt-main'), 'min-height')).toBe('0')
  expect(decl(rule('.dt-head'), 'flex')).toBe('none')
  expect(decl(rule('.dt-page .dt-tabs'), 'flex')).toBe('none')
  // The group list is not sticky: a sticky bar inside the form covered 评估 / 提示词 and sat on 服务商 / 模型.
  expect(decl(rule('.dt-settings-nav'), 'position')).toBe('static')
  expect(decl(rule('.dt-settings'), 'overflow')).toBe('hidden')
  expect(decl(rule('.dt-settings-body'), 'overflow')).toBe('auto')
  const navRules = body.split('\n').map(text => text.trim()).filter(text => text.startsWith('.dt-settings-nav {'))
  expect(navRules.every(line => !line.includes('position: sticky'))).toBe(true)
  const shell = readFileSync(join(dir, 'app.tsx'), 'utf8')
  const page = shell.slice(shell.indexOf('className="dt-page"'))
  const tabsAt = page.indexOf('className="dt-tabs"')
  expect(page.indexOf('<Header')).toBeGreaterThan(-1)
  expect(page.indexOf('<Header')).toBeLessThan(tabsAt)
  expect(page.indexOf('<main')).toBeGreaterThan(tabsAt)
})

it('writes one rule per line, each selector once within its block', () => {
  const blocks: string[][] = [[]]
  for (const line of css.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').map(text => text.trim()).filter(Boolean)) {
    if (line === '}') { blocks.pop(); continue }
    if (/^@(media|container|supports)\b.*\{$/.test(line)) { blocks.push([]); continue }
    // A rule, or a keyframes rule with its steps, opens and closes on its line.
    expect(line).toMatch(/^[^{}]+\{[^{}]*\}$|^@keyframes [\w-]+ \{( [^{}]+ \{[^{}]*\})+ \}$/)
    if (line.startsWith('@')) continue
    const selector = line.slice(0, line.indexOf('{')).trim()
    expect(blocks.at(-1)).not.toContain(selector)
    blocks.at(-1)!.push(selector)
  }
})
