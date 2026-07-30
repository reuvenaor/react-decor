import type { AtCode, AtError, Span } from './scan.cjs'

export declare function atError(code: AtCode, span: Span, detail?: string): AtError
export declare const AT_CODES: AtCode[]
