import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ESLint, type Linter } from 'eslint'
import * as reactDecorParser from 'react-decor/eslint-parser'
import { reactDecorPlugin } from 'react-decor/eslint'
import { describe, expect, it } from 'vitest'

const projDir = path.dirname(fileURLToPath(new URL('./__fixtures__/project/x', import.meta.url)))

/**
 * The four footgun rules, driven through the real parser on raw-@ text — exactly the
 * app's lint path (package imports exercise the packed artifact). All rules are
 * syntactic: no projectService needed.
 */
const makeESLint = () =>
  new ESLint({
    cwd: projDir,
    overrideConfigFile: true,
    overrideConfig: [
      {
        files: ['**/*.at.tsx'],
        languageOptions: {
          parser: reactDecorParser as unknown as Linter.Parser,
          parserOptions: { ecmaFeatures: { jsx: true } },
        },
        plugins: { 'react-decor': reactDecorPlugin },
        rules: {
          'react-decor/no-aschild-decl-decorator': 'error',
          'react-decor/no-props-selector-decl': 'error',
          'react-decor/no-key-prop': 'error',
          'react-decor/no-t-prop': 'error',
          'react-decor/no-static-return-directive': 'error',
          'react-decor/no-local-atom': 'error',
          'react-decor/no-passthrough-atom': 'error',
          'react-decor/no-stray-at-sentinel': 'error',
        },
      },
    ],
  })

async function lint(code: string, file = 'case.at.tsx') {
  const eslint = makeESLint()
  const [res] = await eslint.lintText(code, {
    filePath: path.join(projDir, file),
    warnIgnored: true,
  })
  expect(res.fatalErrorCount).toBe(0)
  return res.messages.map((m) => m.ruleId)
}

describe('react-decor plugin rules', () => {
  it('flags asChild in a declaration-position call-form decorator', async () => {
    const ids = await lint(
      [
        "import { Button } from './b'",
        "import { Link } from './l'",
        "@Button({ asChild: true, variant: 'outline' })",
        'const Cta = () => <Link to="/x">go</Link>',
        'export const use = <Cta />',
      ].join('\n'),
    )
    expect(ids).toEqual(['react-decor/no-aschild-decl-decorator'])
  })

  it('flags asChild in a declaration-position JSX-form decorator', async () => {
    const ids = await lint(
      [
        "import { Button } from './b'",
        '@(<Button asChild />)',
        'export function Cta() {',
        '  return <a href="/x">go</a>',
        '}',
      ].join('\n'),
    )
    expect(ids).toEqual(['react-decor/no-aschild-decl-decorator'])
  })

  it('allows decl-position asChild when the atom forwards {...props} to its root', async () => {
    const ids = await lint(
      [
        "import { Button } from './b'",
        '@Button({ asChild: true, variant: "outline" })',
        'export const Cta = (p: { className?: string }) => (',
        '  <a {...p} href="/x">',
        '    go',
        '  </a>',
        ')',
      ].join('\n'),
    )
    expect(ids).toEqual([])
  })

  it('still flags asChild when it is not the innermost directive of the stack', async () => {
    const ids = await lint(
      [
        "import { Button } from './b'",
        "import { Card } from './c'",
        '@Button({ asChild: true })',
        "@Card({ tone: 'muted' })",
        'export const Cta = (p: { className?: string }) => <a {...p} href="/x">go</a>',
      ].join('\n'),
    )
    expect(ids).toEqual(['react-decor/no-aschild-decl-decorator'])
  })

  it('flags a forwarding atom that clobbers className after the spread', async () => {
    const ids = await lint(
      [
        "import { Button } from './b'",
        '@Button({ asChild: true })',
        'export const Cta = (p: { className?: string }) => (',
        '  <a {...p} className="x">',
        '    go',
        '  </a>',
        ')',
      ].join('\n'),
    )
    expect(ids).toEqual(['react-decor/no-aschild-decl-decorator'])
  })

  it('allows a post-spread className that merges the injected prop back in', async () => {
    const ids = await lint(
      [
        "import { Button } from './b'",
        "import { cn } from './u'",
        '@Button({ asChild: true })',
        'export const Cta = (p: { className?: string }) => (',
        "  <a {...p} className={cn('x', p.className)}>",
        '    go',
        '  </a>',
        ')',
      ].join('\n'),
    )
    expect(ids).toEqual([])
  })

  it('flags a forwarding atom with a non-forwarding branch return', async () => {
    const ids = await lint(
      [
        "import { Button } from './b'",
        '@Button({ asChild: true })',
        'export const Cta = (p: { x?: boolean; className?: string }) => {',
        '  if (p.x) {',
        '    return <span>fallback</span>',
        '  }',
        '  return <a {...p} href="/x">go</a>',
        '}',
      ].join('\n'),
    )
    expect(ids).toEqual(['react-decor/no-aschild-decl-decorator'])
  })

  it('allows a null branch return beside a forwarding return', async () => {
    const ids = await lint(
      [
        "import { Button } from './b'",
        '@Button({ asChild: true })',
        'export const Cta = (p: { x?: boolean; className?: string }) => {',
        '  if (p.x) {',
        '    return null',
        '  }',
        '  return <a {...p} href="/x">go</a>',
        '}',
      ].join('\n'),
    )
    expect(ids).toEqual([])
  })

  it('flags a destructure-rest atom that drops the injected className', async () => {
    const ids = await lint(
      [
        "import { Button } from './b'",
        '@Button({ asChild: true })',
        'export const Cta = ({ className, ...rest }: { className?: string }) => (',
        '  <a {...rest} href="/x">',
        '    go',
        '  </a>',
        ')',
      ].join('\n'),
    )
    expect(ids).toEqual(['react-decor/no-aschild-decl-decorator'])
  })

  it('allows a destructure-rest atom that re-applies the injected className', async () => {
    const ids = await lint(
      [
        "import { Button } from './b'",
        "import { cn } from './u'",
        '@Button({ asChild: true })',
        'export const Cta = ({ className, ...rest }: { className?: string }) => (',
        "  <a {...rest} className={cn('x', className)}>",
        '    go',
        '  </a>',
        ')',
      ].join('\n'),
    )
    expect(ids).toEqual([])
  })

  it('keeps trailing extra spreads exempt on a forwarding root', async () => {
    const ids = await lint(
      [
        "import { Button } from './b'",
        "import { aria } from './a'",
        '@Button({ asChild: true })',
        'export const Cta = (p: { className?: string }) => (',
        '  <a {...p} {...aria} href="/x">',
        '    go',
        '  </a>',
        ')',
      ].join('\n'),
    )
    expect(ids).toEqual([])
  })

  it('resolves an aliased sentinel import for both sentinel-aware rules', async () => {
    const ids = await lint(
      [
        "import { $at as slot } from 'react-decor'",
        "import { Frame } from './f'",
        '@Frame({ content: slot })',
        'export function Ok() { return <i /> }',
        'export const Bad = () => <div data-x={slot} />',
        'export const Plain = () => <div data-y={$at} />',
      ].join('\n'),
    )
    // `slot` is the sentinel (stray flagged once); the literal $at is rebound to
    // an ordinary — here undeclared — identifier and is NOT the rule's business.
    expect(ids).toEqual(['react-decor/no-stray-at-sentinel'])
  })

  it('recognizes directives inside a namespace body (no stray-sentinel report)', async () => {
    const ids = await lint(
      [
        "import { $at } from 'react-decor'",
        "import { Frame } from './f'",
        'export namespace UI {',
        '  @Frame({ content: $at })',
        '  export function Panel(props: { x?: string }) {',
        '    return <i />',
        '  }',
        '}',
      ].join('\n'),
    )
    expect(ids).toEqual([])
  })

  it('applies the directive rules inside a namespace body', async () => {
    const ids = await lint(
      [
        "import { Button } from './b'",
        "import { Link } from './l'",
        'export namespace UI {',
        '  @Button({ asChild: true })',
        '  export const Cta = () => <Link to="/x">go</Link>',
        '}',
      ].join('\n'),
    )
    expect(ids).toEqual(['react-decor/no-aschild-decl-decorator'])
  })

  it('allows asChild at return position (the Slot child stays literal)', async () => {
    const ids = await lint(
      [
        "import { Button } from './b'",
        'export const Cta = () => {',
        '  @(<Button asChild variant="outline" />)',
        '  return <a href="/x">go</a>',
        '}',
      ].join('\n'),
    )
    expect(ids).toEqual([])
  })

  it('flags a static wrapper at return position (belongs on a declaration)', async () => {
    const ids = await lint(
      [
        "import { Reveal } from './r'",
        "import { Card } from './c'",
        'export const Tile = () => {',
        '  @(<Reveal />)',
        "  @Card({ tone: 'muted' })",
        '  return <span>x</span>',
        '}',
      ].join('\n'),
    )
    expect(ids).toEqual([
      'react-decor/no-static-return-directive',
      'react-decor/no-static-return-directive',
    ])
  })

  it('allows return-position wrappers that read hooks, props, or locals', async () => {
    const ids = await lint(
      [
        "import { Region } from './r'",
        "import { Button } from './b'",
        "import { useTranslation } from 'react-i18next'",
        'export const Band = () => {',
        '  const { t } = useTranslation()',
        "  @(<Region label={t('x')} />)",
        '  return <span>x</span>',
        '}',
        'export const Forwarding = (props: { className?: string }) => {',
        '  @(<Button {...props} />)',
        '  return <span>y</span>',
        '}',
      ].join('\n'),
    )
    expect(ids).toEqual([])
  })

  it('flags decorated declarations inside a function body (identity churn)', async () => {
    const ids = await lint(
      [
        "import { Card } from './c'",
        'export const Outer = () => {',
        "  @Card({ tone: 'muted' })",
        '  const LocalTile = () => <span>x</span>',
        '  return <LocalTile />',
        '}',
      ].join('\n'),
    )
    expect(ids).toEqual(['react-decor/no-local-atom'])
  })

  it('flags an undecorated pass-through atom and allows carrying ones', async () => {
    const ids = await lint(
      [
        "import { Reveal } from './r'",
        'const Inner = () => <span>x</span>',
        'const PassThrough = () => <Inner />',
        '@Reveal',
        'const Carrying = () => <Inner />',
        'const WithProps = () => <Inner data-x="1" />',
        'export const use = (',
        '  <>',
        '    <PassThrough />',
        '    <Carrying />',
        '    <WithProps />',
        '  </>',
        ')',
      ].join('\n'),
    )
    expect(ids).toEqual(['react-decor/no-passthrough-atom'])
  })

  it('flags a props-selector function in declaration-position decorator args', async () => {
    const ids = await lint(
      [
        "import { Link } from './l'",
        '@Link({ to: ({ to }) => to, viewTransition: true })',
        'export const BackLink = ({ labelKey }: { to: string; labelKey: string }) => (',
        '  <span>{labelKey}</span>',
        ')',
      ].join('\n'),
    )
    expect(ids).toEqual(['react-decor/no-props-selector-decl'])
  })

  it('exempts $at-carrying functions from no-props-selector-decl (transform rewrites them)', async () => {
    const ids = await lint(
      [
        "import { $at } from 'react-decor'",
        "import { Boundary } from './b'",
        '@Boundary({ render: ({ open }: { open: boolean }) => (open ? $at : null) })',
        'export function Feed() {',
        '  return <ul />',
        '}',
      ].join('\n'),
    )
    expect(ids).toEqual([])
  })

  it('flags a stray $at outside directive arguments, allows it inside them', async () => {
    const ids = await lint(
      [
        "import { $at } from 'react-decor'",
        "import { Frame } from './f'",
        '@Frame({ content: $at })',
        'export function Ok() { return <i /> }',
        'export function Tree() {',
        '  return (',
        '    <div>',
        '      @(<Frame content={$at} />)',
        '      <input />',
        '    </div>',
        '  )',
        '}',
        'export const Bad = () => <div data-x={$at} />',
      ].join('\n'),
    )
    expect(ids).toEqual(['react-decor/no-stray-at-sentinel'])
  })

  it('allows plain function props in decorator args (no destructured param)', async () => {
    const ids = await lint(
      [
        "import { Button } from './b'",
        'const go = () => undefined',
        '@Button({ onClick: () => go() })',
        'const Cta = () => <span>go</span>',
        'export const use = <Cta />',
      ].join('\n'),
    )
    expect(ids).toEqual([])
  })

  it('flags key declared as a component prop (pattern + type literal, one report)', async () => {
    const ids = await lint(
      [
        'interface Item { slug: string }',
        'export const Tile = ({ item, key }: { item: Item; key: string }) => (',
        '  <div>{item.slug}</div>',
        ')',
      ].join('\n'),
    )
    expect(ids).toEqual(['react-decor/no-key-prop'])
  })

  it('ignores key outside component props (data destructuring, lowercase fns)', async () => {
    const ids = await lint(
      [
        "const items = [{ key: 'a' }]",
        'const pick = ({ key }: { key: string }) => key',
        'export const List = () => <>{items.map(({ key }) => <i key={key} />)}</>',
      ].join('\n'),
    )
    expect(ids).toEqual([])
  })

  it('flags t threaded through props by name or TFunction type', async () => {
    const ids = await lint(
      [
        "import type { TFunction } from 'i18next'",
        'export const Heading = ({ t }: { t: TFunction }) => <h2>{t("x")}</h2>',
        'export const Other = ({ translate }: { translate: TFunction }) => <p>{translate("y")}</p>',
      ].join('\n'),
    )
    expect(ids).toEqual(['react-decor/no-t-prop', 'react-decor/no-t-prop'])
  })

  it('flags exactly the Slot violation in the slot-decl fixture', async () => {
    // slot-decl.at.tsx: one decl-position asChild stack among
    // otherwise-conventional atoms.
    const eslint = makeESLint()
    const [res] = await eslint.lintFiles(['slot-decl.at.tsx'])
    expect(res.fatalErrorCount).toBe(0)
    expect(res.messages.map((m) => m.ruleId)).toEqual(['react-decor/no-aschild-decl-decorator'])
    const src = readFileSync(path.join(projDir, 'slot-decl.at.tsx'), 'utf8')
    const asChildLine = src.slice(0, src.indexOf('asChild: true')).split('\n').length
    expect(res.messages[0].line).toBe(asChildLine)
  })

  it('stays silent on the composed atom shapes the conventions prescribe', async () => {
    const ids = await lint(
      [
        "import { Button } from './b'",
        "import { Stagger, StaggerItem } from './s'",
        "import { useTranslation } from 'react-i18next'",
        'interface Item { slug: string }',
        'const ITEMS: Item[] = []',
        "@StaggerItem({ className: 'h-full' })",
        'const Tile = ({ item }: { item: Item }) => <div>{item.slug}</div>',
        "@Stagger({ className: 'grid gap-6' })",
        'const TileList = () => ITEMS.map((item) => <Tile key={item.slug} item={item} />)',
        'export const Cta = () => {',
        '  const { t } = useTranslation()',
        '  @(<Button asChild />)',
        '  return <a href="/x">{t(\'cta\')}</a>',
        '}',
      ].join('\n'),
    )
    expect(ids).toEqual([])
  })
})
