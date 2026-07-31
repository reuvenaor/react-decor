import { cloneElement, type ReactElement } from 'react'

// A minimal asChild wrapper with Radix Slot's cloning semantics: clone the child
// element and inject className. The decl-decorated atom below FORWARDS its props
// onto its root element, so the injection flows through the <Cta_base {...props}/>
// boundary — the case the refined no-aschild-decl-decorator rule exempts.
function ButtonLike({
  asChild,
  className,
  children,
}: {
  asChild?: boolean
  className: string
  children?: ReactElement<{ className?: string }>
}) {
  if (asChild && children) return cloneElement(children, { className })
  return <button className={className}>{children}</button>
}

@ButtonLike({ asChild: true, className: 'btn' })
export function Cta(p: { href?: string }) {
  return (
    <a {...p} href="/go">
      go
    </a>
  )
}
