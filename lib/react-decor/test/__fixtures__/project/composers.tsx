import type { ReactElement, ReactNode } from 'react'

export function Card({ tone, children }: { tone: string; children?: ReactNode }) {
  return <div data-tone={tone}>{children}</div>
}

export function Frame({ children }: { children?: ReactNode }) {
  return <section>{children}</section>
}

export function Slot({ content, tone }: { content?: ReactElement; tone: string }) {
  return <div data-slot={tone}>{content}</div>
}
