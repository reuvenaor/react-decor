import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
// A real .at.tsx module imported THROUGH the react-decor Vite plugin (registered in the
// root vitest.config.ts) — this is the compile-and-render proof: every placement in
// one component, executed, not just string-diffed.
import { Cta } from './__fixtures__/render/Forwarded.at.tsx'
import { Hello } from './__fixtures__/render/Hello.at.tsx'
import { Slotted } from './__fixtures__/render/Slotted.at.tsx'

describe('render through the real transform', () => {
  it('composes all four placements into the expected DOM', () => {
    const html = renderToStaticMarkup(<Hello name="world" />)
    expect(html).toBe(
      '<section data-x="frame">' +
        '<div data-label="outer">' +
        '<div data-label="ret">' +
        '<div>' +
        '<section data-x="frame"><span>world</span></section>' +
        '<section data-x="frame"><em>local</em></section>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</section>',
    )
  })

  it('decl-position asChild injection flows through a forwarding atom (clone proof)', () => {
    expect(renderToStaticMarkup(<Cta />)).toBe('<a class="btn" href="/go">go</a>')
  })

  it('routes the target through $at slots at declaration, return, and in-tree', () => {
    const html = renderToStaticMarkup(<Slotted name="world" />)
    expect(html).toBe(
      '<aside data-tone="brand">' +
        '<section data-x="frame">' +
        '<aside data-tone="ret">' +
        '<div>' +
        '<aside data-tone="tree"><span>world</span></aside>' +
        '<i>sib</i>' +
        '</div>' +
        '</aside>' +
        '</section>' +
        '</aside>',
    )
  })
})
