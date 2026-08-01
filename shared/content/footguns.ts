import {
  SNIPPET_FG_JSX_KEY,
  SNIPPET_FG_KEY_PROP,
  SNIPPET_FG_LOCAL_ATOM,
  SNIPPET_FG_PROPS_SELECTOR,
  SNIPPET_FG_STATIC_RETURN,
  SNIPPET_FG_T_PROP,
} from '@shared/content/docs-snippets'

export interface FootgunItem {
  /** i18n key segment (docs.footguns.items.<key>.*). */
  key: string
  /** The rule (or config) that rejects the shape — verbatim, rendered mono. */
  rule: string
  snippet: string
}

export const FOOTGUNS: FootgunItem[] = [
  { key: 'key_prop', rule: 'react-decor/no-key-prop', snippet: SNIPPET_FG_KEY_PROP },
  { key: 't_prop', rule: 'react-decor/no-t-prop', snippet: SNIPPET_FG_T_PROP },
  {
    key: 'props_selector',
    rule: 'react-decor/no-props-selector-decl',
    snippet: SNIPPET_FG_PROPS_SELECTOR,
  },
  {
    key: 'static_return',
    rule: 'react-decor/no-static-return-directive',
    snippet: SNIPPET_FG_STATIC_RETURN,
  },
  { key: 'local_atom', rule: 'react-decor/no-local-atom', snippet: SNIPPET_FG_LOCAL_ATOM },
  {
    key: 'jsx_key_disable',
    rule: 'eslint-comments/no-restricted-disable',
    snippet: SNIPPET_FG_JSX_KEY,
  },
]
