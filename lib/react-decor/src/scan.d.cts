/**
 * Shared type hub for the react-decor core. The runtime lives in plain CJS
 * (scan.cjs / virtualize.cjs / errors.cjs); these hand-written declarations are
 * what TypeScript consumers (transform.ts, vite.ts, tests) resolve.
 */

export interface Span {
  start: number
  end: number
}

export type DirectiveForm = 'bare' | 'call' | 'jsx'

export interface Directive {
  form: DirectiveForm
  /** Offset of the `@`. */
  atPos: number
  /** End of the directive text (decl/return: decorator end; jsx-child: past the closing paren). */
  end: number
  /** Component reference text, e.g. `Card` or `UI.Card`. */
  name: string
  /**
   * Text emitted before the target: a complete open tag (`<Card tone={'brand'}>`),
   * or — slotted — the self-closing wrapper up to the `$at` splice point
   * (`<Route path={'/x'} element={`).
   */
  openTag: string
  /** Text emitted after the target: the close tag, or — slotted — the rest of the self-closing wrapper (`} />`). */
  closeTag: string
  /** `$at` marked a receiving prop: the wrapper emits self-closing with the target spliced between openTag and closeTag. */
  slotted?: boolean
  /** Slotted directives: raw-file span of the `$at` identifier (the in-tree splice point). */
  sentinelStart?: number
  sentinelEnd?: number
  /** The wrapper itself carries a `key` attr/prop (blocks the return-position key hoist). */
  hasKeyAttr?: boolean
}

/** Inside-tree directive with in-place-conversion geometry (all offsets into the raw file). */
export interface JsxChildDirective extends Directive {
  form: 'jsx'
  parenOpen: number
  parenClose: number
  wrapperStart: number
  wrapperEnd: number
  /** End of the opening element (JsxElement pairs) or of the whole element (self-closing). */
  openingEnd: number
  selfClosing: boolean
}

export interface DeclarationGroup {
  placement: 'declaration'
  directives: Directive[]
  /** Removes the decorators (+ trailing whitespace) from before the statement. */
  removeSpan: Span
  target: {
    kind: 'function-decl' | 'const-arrow'
    name: string
    nameStart: number
    nameEnd: number
    stmtEnd: number
    exported: boolean
    isDefault: boolean
    exportRemoveSpan?: Span
    /** A directive expression references the identifier `props` → wrapper param becomes `props$`. */
    usesProps: boolean
  }
}

export interface ReturnGroup {
  placement: 'return'
  directives: Directive[]
  /** Removes the directives up to the `return` keyword. */
  removeSpan: Span
  exprStart: number
  exprEnd: number
  /** Returned expression is a direct JSX element/fragment (nest without `{}`). */
  exprIsJsx: boolean
  /**
   * Top-level `key` attribute on the returned element (parens unwrapped): span
   * starts at the attr's `pos` (swallows the leading whitespace on removal);
   * `text` is the verbatim attribute. The transform hoists it onto the
   * outermost wrapper's open tag unless that wrapper has its own key.
   */
  exprKey?: Span & { text: string }
}

export interface JsxChildGroup {
  placement: 'jsx-child'
  directives: JsxChildDirective[]
  /** The wrapped sibling (element or expression container). */
  target: Span
  /** Expression-container targets: span of the inner expression (slotted emit splices it without the braces). */
  targetExpr?: Span
}

export type DirectiveGroup = DeclarationGroup | ReturnGroup | JsxChildGroup

export type AtCode =
  | 'AT000'
  | 'AT001'
  | 'AT002'
  | 'AT003'
  | 'AT004'
  | 'AT005'
  | 'AT006'
  | 'AT007'
  | 'AT008'
  | 'AT009'
  | 'AT011'
  | 'AT012'
  | 'AT013'
  | 'AT014'
  | 'AT015'
  | 'AT016'
  | 'AT017'

export interface AtError {
  code: AtCode
  message: string
  span: Span
}

export interface ScanResult {
  groups: DirectiveGroup[]
  errors: AtError[]
  hasDirectives: boolean
}

export declare function scan(code: string, fileName?: string): ScanResult
