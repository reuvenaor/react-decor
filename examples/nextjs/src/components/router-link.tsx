'use client'

import NextLink from 'next/link'
import type { RouterLinkProps } from '@shared/lib/router-link'

/**
 * next/link implementation for the shared RouterLink seam: `to` → `href`; the
 * two react-router-only props are dropped — Next's own navigation covers both
 * (default hash handling scrolls to the target without a top jump, standing in
 * for `preventScrollReset`; view transitions are a framework-level concern).
 */
export function NextRouterLink({
  to,
  viewTransition,
  preventScrollReset,
  ...rest
}: RouterLinkProps) {
  void viewTransition
  void preventScrollReset
  return <NextLink href={to} {...rest} />
}
