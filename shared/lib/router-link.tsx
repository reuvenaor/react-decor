import { createContext, useContext } from 'react'
import type { AnchorHTMLAttributes, ComponentType, ReactNode, Ref } from 'react'

/**
 * Framework seam for internal navigation. Shared components/sections import
 * `Link` from HERE (never from react-router / next directly) with react-router's
 * prop shape; each app mounts a `RouterLinkProvider` supplying its router's
 * implementation:
 *
 *   - react-router: the real `Link` passed verbatim (`to`, `viewTransition`,
 *     `preventScrollReset` are all native props).
 *   - next: a thin shim mapping `to` → `href` and dropping the two
 *     react-router-only props (Next's default hash handling covers the TOC case).
 *
 * The adapter works in every react-decor position — plain JSX, `@Link(...)` decl
 * decorators, `@(<Link …/>)` return directives, and as the literal child of an
 * `asChild` Slot pair (Slot clones this element; the injected className/handlers/
 * ref arrive as props and spread through to the impl — React 19 ref-as-prop).
 */
export interface RouterLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string
  /** react-router only: animate the navigation with the View Transitions API. */
  viewTransition?: boolean
  /** react-router only: keep the scroll position on same-page hash navigation. */
  preventScrollReset?: boolean
  ref?: Ref<HTMLAnchorElement>
}

const RouterLinkContext = createContext<ComponentType<RouterLinkProps> | null>(null)

export function RouterLinkProvider({
  link,
  children,
}: {
  link: ComponentType<RouterLinkProps>
  children: ReactNode
}) {
  return <RouterLinkContext.Provider value={link}>{children}</RouterLinkContext.Provider>
}

export function Link(props: RouterLinkProps) {
  const Impl = useContext(RouterLinkContext)
  // Throw, don't fall back to <a>: a silent anchor would pass e2e while losing
  // client-side navigation — a forgotten provider should fail the first render.
  if (!Impl) throw new Error('react-decor-docs: RouterLinkProvider is not mounted')
  // eslint-disable-next-line react-hooks/static-components -- Impl is a STABLE component read from context (its identity is owned by the app's RouterLinkProvider, mounted once), not a component created during render.
  return <Impl {...props} />
}
