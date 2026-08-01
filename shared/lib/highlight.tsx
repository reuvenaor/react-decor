import type { ReactNode } from 'react'

// Tiny TSX tokenizer for the docs' code samples — enough for the hand-authored
// snippets in src/content/snippets.ts, deliberately not a general parser. Colors are
// semantic chart tokens; CodeBlock renders inside a forced-`dark` surface, so the
// resolved values are always the dark-theme ones (tuned for contrast on the card).
//
// Order matters: comments swallow to end of line before anything else, strings beat
// keywords, and the `@` decorator tokens get the brand `primary` — they are the
// whole point of the library.
const TOKEN = new RegExp(
  [
    String.raw`(?<comment>\/\/[^\n]*|\{\/\*[\s\S]*?\*\/\}|\/\*[\s\S]*?\*\/)`,
    String.raw`(?<string>'[^'\n]*'|"[^"\n]*"|\x60[^\x60]*\x60)`,
    String.raw`(?<decorator>@\(|@[A-Z][\w$]*)`,
    String.raw`(?<keyword>\b(?:import|export|from|const|let|return|function|type|interface|default|if|else|new|extends|satisfies|as|typeof)\b)`,
    String.raw`(?<arrow>=>)`,
    String.raw`(?<tag><\/?[A-Za-z][\w.-]*|\/>|>)`,
    String.raw`(?<number>\b\d+(?:\.\d+)?\b)`,
  ].join('|'),
  'g',
)

const TOKEN_CLASS: Record<string, string> = {
  comment: 'text-muted-foreground/80 italic',
  string: 'text-chart-4',
  decorator: 'text-primary font-semibold',
  keyword: 'text-chart-2',
  arrow: 'text-chart-2',
  tag: 'text-chart-1',
  number: 'text-chart-3',
}

/** Tokenize a code sample into styled spans (plain text stays bare strings). */
export function highlightTsx(code: string): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  let key = 0
  for (const match of code.matchAll(TOKEN)) {
    const index = match.index ?? last
    if (index > last) out.push(code.slice(last, index))
    const groups = match.groups ?? {}
    const kind = Object.keys(groups).find((name) => groups[name] !== undefined)
    out.push(
      <span key={key++} className={kind ? TOKEN_CLASS[kind] : undefined}>
        {match[0]}
      </span>,
    )
    last = index + match[0].length
  }
  if (last < code.length) out.push(code.slice(last))
  return out
}
